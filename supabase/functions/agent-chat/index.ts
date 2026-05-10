import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runAgentLoop } from "./loop.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Validate JWT ──────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // ── 2. Parse body ────────────────────────────────────────────────────────
    const { messages, wallet_address, resume_approval, token_summary } =
      await req.json();

    // ── 3. Fetch agent config ────────────────────────────────────────────────
    const { data: config, error: configError } = await supabase
      .from("agent_configs")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (configError || !config) throw new Error("Agent config not found");

    // ── 4. Fetch current SOL balance for system prompt context ───────────────
    const rpcUrl =
      Deno.env.get("SOLANA_RPC_URL") ?? "https://api.devnet.solana.com";
    let solBalance = 0;
    try {
      const rpcRes = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [wallet_address],
        }),
      });
      const rpcJson = await rpcRes.json();
      solBalance = (rpcJson?.result?.value ?? 0) / 1e9;
    } catch {
      /* non-fatal */
    }

    // ── 5. Build system prompt ────────────────────────────────────────────────
    const systemPrompt = buildSystemPrompt({
      agentName: config.agent_name,
      personality: config.personality,
      walletAddress: wallet_address,
      solBalance,
      tokenSummary: token_summary ?? "",
      threshold: config.auto_approve_threshold_usd,
      enabledActions: config.enabled_actions,
    });

    // ── 6. Run agentic loop ───────────────────────────────────────────────────
    const agentConfig = {
      ai_provider: config.ai_provider,
      ai_model: config.ai_model,
    };

    const result = await runAgentLoop(
      messages,
      systemPrompt,
      wallet_address,
      agentConfig,
    );

    // ── 7. Persist assistant reply ────────────────────────────────────────────
    if (result.type === "reply" && result.text) {
      await supabase.from("agent_messages").insert({
        user_id: user.id,
        role: "assistant",
        content: result.text,
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

interface PromptArgs {
  agentName: string;
  personality: string;
  walletAddress: string;
  solBalance: number;
  tokenSummary: string;
  threshold: number;
  enabledActions: string[];
}

function buildSystemPrompt(args: PromptArgs): string {
  const personalityGuide =
    {
      professional: "Be concise, precise, and professional. No slang.",
      friendly: "Be warm, clear, and encouraging.",
      degen:
        'Be casual and crypto-native. Use "gm", "ngmi", "ser" where appropriate.',
    }[args.personality] ?? "";

  return `You are ${args.agentName}, a Solana blockchain AI agent embedded in a mobile wallet.
Personality: ${personalityGuide}

YOUR ROLE:
- Help users understand and manage their Solana wallet.
- Give research and advice on portfolio and opportunities.
- Execute only supported onchain actions with user approval.
- Be honest about limitations — don't pretend to support unsupported protocols.

WALLET CONTEXT:
Address: ${args.walletAddress}
Network: Solana Devnet
SOL balance: ${args.solBalance.toFixed(4)} SOL
Top tokens: ${args.tokenSummary || "None"}

SUPPORTED ONCHAIN ACTIONS:
- get_balance: Check wallet balances and tokens
- get_quote: Get swap quotes (useful for advice and planning)
- execute_swap: Swap SOL ↔ USDC via Jupiter
- send_token: Send SOL or SPL tokens
- stake_sol: Stake SOL with validators
- get_nfts: View NFT portfolio

AUTO-APPROVE THRESHOLD: $${args.threshold} USD
- Actions BELOW this value: execute autonomously, inform the user after.
- Actions AT OR ABOVE this value: ALWAYS call request_approval first, then wait.

ENABLED ACTIONS: ${args.enabledActions.join(", ")}
Only perform actions that appear in this list. Reject or downgrade unsupported requests.

REQUEST MODES:
1. ADVICE MODE: User asks "what should I do?" or "what are my options?"
   → Use get_balance, get_quote, get_nfts to gather data.
   → Give a clear recommendation with pros/cons, risks, and next steps.
   → Do NOT call execute_swap or send_token. Do NOT build transactions.

2. EXECUTION MODE: User explicitly asks to perform an action like "swap X SOL to USDC"
   → Interpret their request as one of the supported actions.
   → If the requested protocol/action is unsupported, explain the limitation and offer supported alternatives.
   → Use get_quote to preview the result.
   → Call request_approval if the action value meets or exceeds the threshold.
   → After approval, execute.

3. UNSUPPORTED REQUEST: User asks "invest in Raydium farm" or "interact with Meteora"
   → Explain that you can't directly deploy to that protocol.
   → Offer the closest supported alternative or a research summary.
   → Example: "I can't directly farm on Raydium yet, but I can help you swap tokens on Jupiter. Would you like a quote?"

TOOL USAGE RULES:
1. Always call get_balance or get_quote before suggesting or executing any financial action.
2. Never guess a token mint address — only use addresses confirmed by get_balance results.
3. Always call request_approval before actions at or above the threshold.
4. After executing a transaction, confirm with the tx signature and a Solscan devnet link.
5. If the user asks for advice only, gather research but do not build or execute a transaction.

Be concise and honest about what you can and cannot do. Confirm completed actions with a short success message and the Solscan link:
https://solscan.io/tx/<signature>?cluster=devnet`;
}
