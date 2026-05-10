import React, { useRef, useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { useAgentStore } from '@/store/agentStore'
import { useAgent } from '@/hooks/useAgent'
import { useWalletStore } from '@/store/walletStore'
import { useBalance } from '@/hooks/useBalance'
import { AgentMessage } from '@/components/agent/AgentMessage'
import { ApprovalModal } from '@/components/agent/ApprovalModal'
import { ellipsify } from '@/utils/ellipsify'

const SUGGESTED_PROMPTS = [
  { icon: '💰', text: "What's my balance?" },
  { icon: '⇄',  text: 'Swap 0.1 SOL to USDC' },
  { icon: '🪙', text: 'Show my tokens' },
  { icon: '📊', text: 'How is the market?' },
]

function TypingIndicator({ name }: { name: string }) {
  return (
    <View className="items-start mb-3">
      <Text className="text-text-muted text-xs mb-1 ml-1">{name}</Text>
      <View className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex-row gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <View key={i} className="w-2 h-2 rounded-full bg-accent opacity-60" />
        ))}
      </View>
    </View>
  )
}

function WalletPill() {
  const { address, solBalance, totalUsdValue, isLoading } = useWalletStore()
  const { refresh } = useBalance()

  useEffect(() => { if (address) refresh() }, [address])

  return (
    <View className="bg-card border border-border rounded-2xl mx-4 mb-3 overflow-hidden">
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-3 flex-1">
          <View className="w-10 h-10 rounded-xl bg-accent/15 items-center justify-center">
            <Text className="text-accent text-base">◈</Text>
          </View>
          <View className="flex-1">
            <Text className="text-text-muted text-xs uppercase tracking-wider">Balance</Text>
            <Text className="text-text-primary text-lg font-bold">
              {isLoading ? '—' : `${solBalance.toFixed(4)} SOL`}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-text-muted text-xs">USD</Text>
          <Text className="text-accent text-base font-bold">
            ${totalUsdValue.toFixed(2)}
          </Text>
        </View>
      </View>

      {address && (
        <TouchableOpacity
          onPress={() => Clipboard.setStringAsync(address)}
          activeOpacity={0.6}
          className="bg-surface border-t border-border px-4 py-2 flex-row items-center justify-between"
        >
          <Text className="text-text-muted text-xs font-mono">
            {ellipsify(address, 8)}
          </Text>
          <Text className="text-accent text-xs">Tap to copy</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

export default function AgentHome() {
  const { messages, isThinking, pendingApproval, config } = useAgentStore()
  const { approve, reject, sendMessage } = useAgent()
  const router = useRouter()
  const [input, setInput]   = useState('')
  const listRef             = useRef<FlatList>(null)
  const agentName           = config?.agentName ?? 'SAGE'
  const insets              = useSafeAreaInsets()

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages.length, isThinking])

  async function handleSend(text?: string) {
    const message = (text ?? input).trim()
    if (!message || isThinking) return
    setInput('')
    await sendMessage(message)
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-divider">
          <View className="flex-row items-center gap-3">
            <View className="w-11 h-11 rounded-full bg-accent/20 border border-accent/40 items-center justify-center">
              <Text className="text-accent text-xl">✦</Text>
            </View>
            <View>
              <Text className="text-text-primary font-bold text-base">{agentName}</Text>
              <Text className="text-text-muted text-xs">AI Wallet Agent</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="bg-orange/10 border border-orange/30 rounded-full px-3 py-1">
              <Text className="text-orange text-xs font-bold">DEVNET</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(app)/settings')}
              className="bg-card border border-border w-9 h-9 rounded-full items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-text-secondary text-base">⚙</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallet info card */}
        <View className="pt-3">
          <WalletPill />
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          renderItem={({ item }) => <AgentMessage message={item} agentName={agentName} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-6 gap-6">
              <View className="items-center gap-3">
                <View className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent/30 items-center justify-center">
                  <Text className="text-4xl">✦</Text>
                </View>
                <Text className="text-text-primary font-bold text-xl">{agentName}</Text>
                <Text className="text-text-muted text-sm text-center leading-6 max-w-xs">
                  Your AI wallet companion. Ask me to check balances, send tokens, swap, stake, or anything else.
                </Text>
              </View>

              <View className="w-full gap-2">
                <Text className="text-text-muted text-xs font-bold uppercase tracking-widest text-center">
                  Try saying
                </Text>
                <View className="gap-2">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <TouchableOpacity
                      key={p.text}
                      onPress={() => handleSend(p.text)}
                      activeOpacity={0.7}
                      className="bg-card border border-border rounded-2xl px-4 py-3 flex-row items-center gap-3"
                    >
                      <Text className="text-lg">{p.icon}</Text>
                      <Text className="text-text-primary text-sm flex-1">{p.text}</Text>
                      <Text className="text-text-muted">→</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          }
          ListFooterComponent={isThinking ? <TypingIndicator name={agentName} /> : null}
        />

        {/* Input bar */}
        <View style={{ paddingBottom: insets.bottom + 90 }} className="px-4 pt-3 border-t border-divider bg-bg">
          <View className="flex-row items-end gap-2">
            <TextInput
              className="flex-1 bg-card border border-border rounded-2xl px-4 py-3 text-text-primary text-base max-h-28"
              placeholder={`Ask ${agentName} anything...`}
              placeholderTextColor="#50507A"
              value={input}
              onChangeText={setInput}
              multiline
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              className={`w-12 h-12 rounded-2xl items-center justify-center ${
                input.trim() && !isThinking ? 'bg-accent' : 'bg-border'
              }`}
              onPress={() => handleSend()}
              disabled={!input.trim() || isThinking}
              activeOpacity={0.8}
            >
              <Text className="text-white text-xl">↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ApprovalModal
        approval={pendingApproval}
        onApprove={approve}
        onReject={reject}
      />
    </SafeAreaView>
  )
}
