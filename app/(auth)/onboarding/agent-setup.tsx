import React, { useState } from 'react'
import {
  View, Text, ScrollView, TextInput, Alert, Switch, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/services/supabase/client'
import { upsertAgentConfig } from '@/services/supabase/agent'
import { useAgentStore, AgentConfig, AgentPersonality, AIProvider } from '@/store/agentStore'
import { usePrivy } from '@privy-io/expo'

const TOTAL_STEPS = 4

// ── Data ────────────────────────────────────────────────────────────────────

const PERSONALITIES: { value: AgentPersonality; label: string; icon: string; desc: string }[] = [
  { value: 'professional', label: 'Professional', icon: '💼', desc: 'Concise, precise, no slang' },
  { value: 'friendly',     label: 'Friendly',     icon: '😊', desc: 'Warm, clear, encouraging'  },
  { value: 'degen',        label: 'Degen',         icon: '🦍', desc: 'gm ser, crypto-native'     },
]

const PROVIDERS: { value: AIProvider; label: string; icon: string; desc: string }[] = [
  { value: 'anthropic', label: 'Claude',  icon: '◈', desc: 'Anthropic · Best reasoning'  },
  { value: 'openai',    label: 'GPT-4o',  icon: '◉', desc: 'OpenAI · Versatile & fast'   },
  { value: 'gemini',    label: 'Gemini',  icon: '◇', desc: 'Google · Multimodal & quick' },
]

const ALL_ACTIONS: { key: string; label: string; icon: string; desc: string }[] = [
  { key: 'send',  label: 'Send',  icon: '↑', desc: 'Transfer SOL & tokens'      },
  { key: 'swap',  label: 'Swap',  icon: '⇄', desc: 'Swap via Jupiter DEX'        },
  { key: 'stake', label: 'Stake', icon: '⬡', desc: 'Stake SOL with validators'   },
]

// ── Step components ──────────────────────────────────────────────────────────

function StepIntro({ onNext }: { onNext: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-6 gap-8">
      <View className="w-28 h-28 rounded-full bg-accent/20 border-2 border-accent/40 items-center justify-center">
        <Text className="text-6xl">✦</Text>
      </View>
      <View className="items-center gap-3">
        <Text className="text-text-primary text-3xl font-bold text-center">Meet Your AI Agent</Text>
        <Text className="text-text-secondary text-base text-center leading-6 max-w-xs">
          Your embedded Solana assistant can check balances, swap tokens, send SOL, stake — all from a chat.
        </Text>
      </View>
      <View className="w-full gap-3">
        {['Natural language commands', 'On-device signing', 'You approve high-value moves'].map((f) => (
          <View key={f} className="flex-row items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3">
            <Text className="text-accent text-base">✓</Text>
            <Text className="text-text-secondary text-sm">{f}</Text>
          </View>
        ))}
      </View>
      <Button title="Get Started →" className="w-full" onPress={onNext} />
    </View>
  )
}

function StepIdentity({
  agentName, setAgentName, personality, setPersonality, onBack, onNext,
}: {
  agentName: string; setAgentName: (v: string) => void
  personality: AgentPersonality; setPersonality: (v: AgentPersonality) => void
  onBack: () => void; onNext: () => void
}) {
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }} showsVerticalScrollIndicator={false}>
      <View className="gap-1">
        <Text className="text-text-primary text-2xl font-bold">Name Your Agent</Text>
        <Text className="text-text-secondary text-sm">Give your AI a name and personality</Text>
      </View>

      <View className="gap-2">
        <Text className="text-text-muted text-xs font-bold uppercase tracking-widest">Agent Name</Text>
        <TextInput
          className="bg-card border border-border rounded-2xl px-4 py-4 text-text-primary text-base"
          value={agentName}
          onChangeText={setAgentName}
          placeholder="e.g. SAGE, NOVA, ARIA"
          placeholderTextColor="#50507A"
          maxLength={20}
          autoFocus
        />
        <View className="flex-row gap-2">
          {['SAGE', 'NOVA', 'ARIA'].map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setAgentName(s)}
              className="bg-card border border-border rounded-xl px-3 py-1.5"
            >
              <Text className="text-text-muted text-xs font-bold">{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="gap-3">
        <Text className="text-text-muted text-xs font-bold uppercase tracking-widest">Personality</Text>
        {PERSONALITIES.map((p) => (
          <TouchableOpacity
            key={p.value}
            onPress={() => setPersonality(p.value)}
            activeOpacity={0.8}
            className={`flex-row items-center gap-4 rounded-2xl p-4 border ${
              personality === p.value
                ? 'bg-accent/15 border-accent'
                : 'bg-card border-border'
            }`}
          >
            <View className={`w-11 h-11 rounded-xl items-center justify-center ${
              personality === p.value ? 'bg-accent/20' : 'bg-border'
            }`}>
              <Text className="text-2xl">{p.icon}</Text>
            </View>
            <View className="flex-1">
              <Text className={`font-bold text-base ${personality === p.value ? 'text-accent' : 'text-text-primary'}`}>
                {p.label}
              </Text>
              <Text className="text-text-muted text-xs mt-0.5">{p.desc}</Text>
            </View>
            {personality === p.value && (
              <View className="w-5 h-5 rounded-full bg-accent items-center justify-center">
                <Text className="text-white text-xs font-bold">✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View className="flex-row gap-3">
        <Button title="← Back" variant="outline" className="flex-1" onPress={onBack} />
        <Button title="Next →" className="flex-1" onPress={onNext} disabled={!agentName.trim()} />
      </View>
    </ScrollView>
  )
}

function StepProvider({
  provider, setProvider, onBack, onNext,
}: {
  provider: AIProvider; setProvider: (v: AIProvider) => void
  onBack: () => void; onNext: () => void
}) {
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }} showsVerticalScrollIndicator={false}>
      <View className="gap-1">
        <Text className="text-text-primary text-2xl font-bold">Choose AI Brain</Text>
        <Text className="text-text-secondary text-sm">Pick the language model powering your agent</Text>
      </View>

      <View className="gap-3">
        {PROVIDERS.map((p) => (
          <TouchableOpacity
            key={p.value}
            onPress={() => setProvider(p.value)}
            activeOpacity={0.8}
            className={`flex-row items-center gap-4 rounded-2xl p-5 border ${
              provider === p.value
                ? 'bg-accent/15 border-accent'
                : 'bg-card border-border'
            }`}
          >
            <View className={`w-12 h-12 rounded-xl items-center justify-center ${
              provider === p.value ? 'bg-accent/20' : 'bg-border'
            }`}>
              <Text className={`text-2xl font-bold ${provider === p.value ? 'text-accent' : 'text-text-muted'}`}>
                {p.icon}
              </Text>
            </View>
            <View className="flex-1">
              <Text className={`font-bold text-base ${provider === p.value ? 'text-accent' : 'text-text-primary'}`}>
                {p.label}
              </Text>
              <Text className="text-text-muted text-xs mt-0.5">{p.desc}</Text>
            </View>
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
              provider === p.value ? 'bg-accent border-accent' : 'border-border'
            }`}>
              {provider === p.value && <Text className="text-white text-xs font-bold">✓</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View className="bg-card border border-border rounded-2xl p-4 gap-1">
        <Text className="text-text-muted text-xs font-bold uppercase tracking-widest">Note</Text>
        <Text className="text-text-secondary text-xs leading-4">
          API keys are stored securely in Supabase Edge Function secrets — never bundled into the app.
        </Text>
      </View>

      <View className="flex-row gap-3">
        <Button title="← Back" variant="outline" className="flex-1" onPress={onBack} />
        <Button title="Next →" className="flex-1" onPress={onNext} />
      </View>
    </ScrollView>
  )
}

function StepPermissions({
  threshold, setThreshold, actions, toggleAction, loading, onBack, onSave,
}: {
  threshold: string; setThreshold: (v: string) => void
  actions: string[]; toggleAction: (a: string) => void
  loading: boolean; onBack: () => void; onSave: () => void
}) {
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }} showsVerticalScrollIndicator={false}>
      <View className="gap-1">
        <Text className="text-text-primary text-2xl font-bold">Set Permissions</Text>
        <Text className="text-text-secondary text-sm">Control what your agent can do autonomously</Text>
      </View>

      <View className="gap-3">
        <Text className="text-text-muted text-xs font-bold uppercase tracking-widest">Auto-Approve Under</Text>
        <View className="bg-card border border-border rounded-2xl px-4 py-4 flex-row items-center gap-3">
          <View className="bg-accent/20 rounded-xl px-3 py-2">
            <Text className="text-accent font-bold text-base">$</Text>
          </View>
          <TextInput
            className="flex-1 text-text-primary text-xl font-bold"
            value={threshold}
            onChangeText={setThreshold}
            keyboardType="decimal-pad"
            placeholder="10"
            placeholderTextColor="#50507A"
          />
          <Text className="text-text-muted text-sm">USD</Text>
        </View>
        <Text className="text-text-muted text-xs leading-4">
          Actions below this value execute autonomously. At or above — you'll be asked to approve first.
        </Text>
      </View>

      <View className="gap-3">
        <Text className="text-text-muted text-xs font-bold uppercase tracking-widest">Enabled Actions</Text>
        {ALL_ACTIONS.map((a) => (
          <View
            key={a.key}
            className={`flex-row items-center gap-4 rounded-2xl p-4 border ${
              actions.includes(a.key) ? 'bg-card border-accent/30' : 'bg-card border-border opacity-60'
            }`}
          >
            <View className={`w-10 h-10 rounded-xl items-center justify-center ${
              actions.includes(a.key) ? 'bg-accent/20' : 'bg-border'
            }`}>
              <Text className={`text-lg font-bold ${actions.includes(a.key) ? 'text-accent' : 'text-text-muted'}`}>
                {a.icon}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-text-primary font-semibold">{a.label}</Text>
              <Text className="text-text-muted text-xs">{a.desc}</Text>
            </View>
            <Switch
              value={actions.includes(a.key)}
              onValueChange={() => toggleAction(a.key)}
              trackColor={{ false: '#252545', true: '#9945FF' }}
              thumbColor="#fff"
            />
          </View>
        ))}
      </View>

      <View className="flex-row gap-3">
        <Button title="← Back" variant="outline" className="flex-1" onPress={onBack} />
        <Button title="Save & Launch" className="flex-1" loading={loading} onPress={onSave} />
      </View>
    </ScrollView>
  )
}

// ── Main wizard ──────────────────────────────────────────────────────────────

async function ensureSupabaseSession(privyUser: any): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) return session.user.id

  const accounts = privyUser?.linked_accounts ?? privyUser?.linkedAccounts ?? []
  const email: string | undefined = accounts.find((a: any) => a.type === 'email')?.address
  if (!email || !privyUser?.id) return null

  // Try sign-in first (returning user)
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email, password: privyUser.id,
  })
  if (!signInErr && signInData.session) return signInData.session.user.id

  // First time — sign up (requires "Confirm email" OFF in Supabase dashboard)
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email, password: privyUser.id,
  })
  if (!signUpErr && signUpData.session) return signUpData.session.user.id

  // signUp succeeded but returned no session — try sign-in once more
  const { data: retryData } = await supabase.auth.signInWithPassword({
    email, password: privyUser.id,
  })
  return retryData.session?.user.id ?? null
}

export default function AgentSetupScreen() {
  const router    = useRouter()
  const setConfig = useAgentStore((s) => s.setConfig)
  const { user: privyUser } = usePrivy()
  const [loading, setLoading] = useState(false)
  const [step, setStep]       = useState(1)

  const [agentName,   setAgentName]   = useState('SAGE')
  const [personality, setPersonality] = useState<AgentPersonality>('professional')
  const [provider,    setProvider]    = useState<AIProvider>('anthropic')
  const [threshold,   setThreshold]   = useState('10')
  const [actions,     setActions]     = useState<string[]>(['send', 'swap', 'stake'])

  function animateStep(next: number) {
    setStep(next)
  }

  function toggleAction(action: string) {
    setActions((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    )
  }

  async function handleSave() {
    setLoading(true)
    try {
      const userId = await ensureSupabaseSession(privyUser)
      if (!userId) {
        Alert.alert(
          'Session error',
          'Could not establish a Supabase session.\n\nFix: Supabase Dashboard → Authentication → Providers → Email → disable "Confirm email", then try again.'
        )
        return
      }

      const config: Omit<AgentConfig, 'id'> = {
        agentName:               agentName.trim() || 'SAGE',
        personality,
        aiProvider:              provider,
        aiModel:                 provider === 'anthropic' ? 'claude-sonnet-4-20250514'
                               : provider === 'openai'    ? 'gpt-4o'
                               :                           'gemini-2.0-flash',
        autoApproveThresholdUsd: parseFloat(threshold) || 10,
        enabledActions:          actions,
      }
      await upsertAgentConfig(userId, config)
      setConfig(config)
      router.replace('/(auth)/onboarding/complete')
    } catch (e) {
      Alert.alert('Error', (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Progress bar
  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      {/* Progress bar */}
      <View className="px-6 pt-4 pb-2 gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-text-muted text-xs">Step {step} of {TOTAL_STEPS}</Text>
          <View className="flex-row gap-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                className={`h-1.5 rounded-full ${
                  i < step ? 'bg-accent' : 'bg-border'
                }`}
                style={{ width: i < step ? 24 : 16 }}
              />
            ))}
          </View>
        </View>
      </View>

      <View className="flex-1">
        {step === 1 && (
          <StepIntro onNext={() => animateStep(2)} />
        )}
        {step === 2 && (
          <StepIdentity
            agentName={agentName} setAgentName={setAgentName}
            personality={personality} setPersonality={setPersonality}
            onBack={() => animateStep(1)} onNext={() => animateStep(3)}
          />
        )}
        {step === 3 && (
          <StepProvider
            provider={provider} setProvider={setProvider}
            onBack={() => animateStep(2)} onNext={() => animateStep(4)}
          />
        )}
        {step === 4 && (
          <StepPermissions
            threshold={threshold} setThreshold={setThreshold}
            actions={actions} toggleAction={toggleAction}
            loading={loading} onBack={() => animateStep(3)} onSave={handleSave}
          />
        )}
      </View>
    </SafeAreaView>
  )
}
