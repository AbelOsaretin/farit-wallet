import { getBalance } from "./get-balance.ts";
import { getQuote } from "./get-quote.ts";
import { buildSwapTx } from "./execute-swap.ts";
import { buildSendTx } from "./send-token.ts";
import { buildStakeTx } from "./stake-sol.ts";
import { getNfts } from "./get-nfts.ts";

// Policy: these are the only tools the agent can use
const SUPPORTED_TOOLS = new Set([
  "get_balance",
  "get_quote",
  "execute_swap",
  "send_token",
  "stake_sol",
  "get_nfts",
  "request_approval",
]);

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  walletAddress: string,
): Promise<unknown> {
  // Reject unsupported tools immediately
  if (!SUPPORTED_TOOLS.has(name)) {
    return {
      error: `Tool '${name}' is not supported. Supported tools: ${Array.from(SUPPORTED_TOOLS).join(", ")}`,
      is_policy_error: true,
    };
  }

  switch (name) {
    case "get_balance":
      return getBalance((input.wallet_address as string) ?? walletAddress);

    case "get_quote":
      return getQuote(input);

    case "execute_swap":
      return buildSwapTx(input, walletAddress);

    case "send_token":
      return buildSendTx(input, walletAddress);

    case "stake_sol":
      return buildStakeTx(input, walletAddress);

    case "get_nfts":
      return getNfts((input.wallet_address as string) ?? walletAddress);

    case "request_approval":
      return { __requires_approval: true, ...input };

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
