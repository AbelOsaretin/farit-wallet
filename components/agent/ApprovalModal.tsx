import React from "react";
import { View, Text } from "react-native";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { PendingApproval } from "@/store/agentStore";

interface ApprovalModalProps {
  approval: PendingApproval | null;
  onApprove: (approval: PendingApproval) => void;
  onReject: (approval: PendingApproval) => void;
}

function getActionLabel(action: Record<string, unknown>): string {
  const txType = typeof action.tx_type === "string" ? action.tx_type : null;
  const params = action.params as Record<string, unknown> | undefined;

  if (txType === "sol_transfer" && params?.to) {
    return `Send SOL to ${String(params.to).slice(0, 8)}…`;
  }
  if (txType === "spl_transfer" && params?.to) {
    return `Send token to ${String(params.to).slice(0, 8)}…`;
  }
  if (txType === "stake" && params?.amount_lamports) {
    const amountSol = Number(params.amount_lamports) / 1e9;
    return `Stake ${amountSol.toFixed(4)} SOL`;
  }
  if (action.from_mint && action.to_mint) {
    const from = String(action.from_mint).slice(0, 6);
    const to = String(action.to_mint).slice(0, 6);
    return `Swap ${from}… to ${to}…`;
  }
  return "Review the action details below";
}

export function ApprovalModal({
  approval,
  onApprove,
  onReject,
}: ApprovalModalProps) {
  if (!approval) return null;

  const actionLabel = getActionLabel(approval.action);

  return (
    <Modal visible title="Approve Action">
      <View className="gap-4">
        <View className="bg-orange/10 border border-orange/30 rounded-2xl p-4 gap-2">
          <Text className="text-orange text-xs font-bold uppercase tracking-widest">
            Action Summary
          </Text>
          <Text className="text-text-primary text-base leading-6 font-semibold">
            {approval.summary}
          </Text>
        </View>

        <View className="bg-card border border-border rounded-2xl p-4 gap-2">
          <Text className="text-text-muted text-xs font-bold uppercase tracking-widest">
            What will happen
          </Text>
          <Text className="text-text-primary text-sm leading-5">
            {actionLabel}
          </Text>
        </View>

        <View className="flex-row items-center justify-between bg-surface rounded-xl p-4">
          <Text className="text-text-secondary text-sm">Estimated Value</Text>
          <Text className="text-text-primary font-bold text-lg">
            ${approval.estimatedUsd.toFixed(2)}
          </Text>
        </View>

        <Text className="text-text-muted text-xs text-center leading-4">
          This action meets or exceeds your auto-approve threshold of $
          {approval.estimatedUsd.toFixed(2)}. Review carefully before
          proceeding.
        </Text>

        <View className="flex-row gap-3">
          <Button
            title="Reject"
            variant="outline"
            className="flex-1"
            onPress={() => onReject(approval)}
          />
          <Button
            title="Approve & Execute"
            className="flex-1"
            onPress={() => onApprove(approval)}
          />
        </View>
      </View>
    </Modal>
  );
}
