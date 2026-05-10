import React from "react";
import { View, Text, Linking, TouchableOpacity } from "react-native";
import type { ChatMessage } from "@/store/agentStore";
import { explorerTxUrl } from "@/constants/rpc";

interface AgentMessageProps {
  message: ChatMessage;
  agentName: string;
}

export function AgentMessage({ message, agentName }: AgentMessageProps) {
  const isUser = message.role === "user";
  const isAdviceMode =
    message.content.toLowerCase().includes("recommend") ||
    message.content.toLowerCase().includes("option") ||
    message.content.toLowerCase().includes("consider");

  return (
    <View className={`mb-3 ${isUser ? "items-end" : "items-start"}`}>
      {!isUser && (
        <View className="flex-row items-center gap-2 mb-1 ml-1">
          <Text className="text-text-muted text-xs">{agentName}</Text>
          {isAdviceMode && (
            <View className="bg-accent/20 rounded-full px-2 py-0.5">
              <Text className="text-accent text-xs font-semibold">
                💡 Advice
              </Text>
            </View>
          )}
        </View>
      )}
      <View
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-accent rounded-tr-sm"
            : "bg-card border border-border rounded-tl-sm"
        }`}
      >
        <Text
          className={`${isUser ? "text-white" : "text-text-primary"} text-sm leading-5`}
        >
          {message.content}
        </Text>

        {message.txSignature && (
          <TouchableOpacity
            className="mt-2 bg-green/10 border border-green/30 rounded-xl px-3 py-2"
            onPress={() => Linking.openURL(explorerTxUrl(message.txSignature!))}
          >
            <Text className="text-green text-xs font-semibold">
              ✓ View on Solscan →
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <Text className="text-text-muted text-xs mt-1 mx-1">
        {message.createdAt.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
}
