import React from 'react'
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Button } from '@/components/ui/Button'

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-between px-6 py-8">

        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-8xl">◎</Text>
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-text-primary tracking-tight">
              Farit Wallet
            </Text>
            <Text className="text-text-secondary text-base text-center leading-6">
              Your AI-powered Solana wallet.{'\n'}Trade, stake, and manage assets — just ask.
            </Text>
          </View>
        </View>

        <View className="w-full">
          <Button
            title="Get Started"
            onPress={() => router.push('/(auth)/sign-in')}
          />
        </View>

        <View className="mt-4 bg-orange/10 border border-orange/30 rounded-2xl px-4 py-3 flex-row items-center gap-2 w-full">
          <Text className="text-orange text-sm">⚠</Text>
          <Text className="text-orange text-xs font-semibold flex-1">
            Devnet only — this is a testnet wallet. Do not use real funds.
          </Text>
        </View>

      </View>
    </SafeAreaView>
  )
}
