import React from 'react'
import { View, Text } from 'react-native'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { PendingApproval } from '@/store/agentStore'

interface ApprovalModalProps {
  approval: PendingApproval | null
  onApprove: (approval: PendingApproval) => void
  onReject: (approval: PendingApproval) => void
}

export function ApprovalModal({ approval, onApprove, onReject }: ApprovalModalProps) {
  if (!approval) return null

  return (
    <Modal visible title="Action Required">
      <View className="gap-4">
        <View className="bg-orange/10 border border-orange/30 rounded-2xl p-4">
          <Text className="text-orange text-xs font-bold uppercase tracking-widest mb-2">
            Approval Required
          </Text>
          <Text className="text-text-primary text-base leading-6">
            {approval.summary}
          </Text>
        </View>

        <View className="flex-row items-center justify-between bg-surface rounded-xl p-4">
          <Text className="text-text-secondary">Estimated Value</Text>
          <Text className="text-text-primary font-bold text-lg">
            ${approval.estimatedUsd.toFixed(2)}
          </Text>
        </View>

        <Text className="text-text-muted text-xs text-center">
          This action exceeds your auto-approve threshold. Review carefully before proceeding.
        </Text>

        <View className="flex-row gap-3">
          <Button
            title="Reject"
            variant="danger"
            className="flex-1"
            onPress={() => onReject(approval)}
          />
          <Button
            title="Approve"
            variant="primary"
            className="flex-1"
            onPress={() => onApprove(approval)}
          />
        </View>
      </View>
    </Modal>
  )
}
