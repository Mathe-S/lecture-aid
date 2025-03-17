"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { chatKeys } from "@/hooks/useChat";
import { ChatMessage, ChatMessageWithReplies } from "@/types/chat";
import { toast } from "sonner";

export function useRealtimeMessages(chatRoomId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!chatRoomId) return;

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel(`chat:${chatRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        (payload) => {
          // Get the existing messages
          const currentMessages =
            queryClient.getQueryData<ChatMessageWithReplies[]>(
              chatKeys.messages(chatRoomId)
            ) || [];

          // If it's a new top-level message (not a reply)
          if (!payload.new.parent_message_id) {
            // We need to fetch the complete message with author info
            // This could be improved with a more targeted API
            queryClient.invalidateQueries({
              queryKey: chatKeys.messages(chatRoomId),
            });
          } else {
            // It's a reply, update the parent message's replies
            const parentId = payload.new.parent_message_id;
            const updatedMessages = currentMessages.map((message) => {
              if (message.id === parentId) {
                // We need the full message details
                // For a real implementation, consider a more efficient approach
                queryClient.invalidateQueries({
                  queryKey: chatKeys.messages(chatRoomId),
                });
                return message;
              }
              return message;
            });

            queryClient.setQueryData(
              chatKeys.messages(chatRoomId),
              updatedMessages
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        () => {
          // For simplicity, just invalidate the queries
          queryClient.invalidateQueries({
            queryKey: chatKeys.messages(chatRoomId),
          });
        }
      )
      .subscribe();

    // Subscribe to reactions
    const reactionSubscription = supabase
      .channel(`reactions:${chatRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, or DELETE
          schema: "public",
          table: "message_reactions",
        },
        () => {
          // For simplicity, invalidate the messages query
          // In a production app, you might want to update the specific message
          queryClient.invalidateQueries({
            queryKey: chatKeys.messages(chatRoomId),
          });
        }
      )
      .subscribe();

    // Subscribe to pinned messages
    const pinnedSubscription = supabase
      .channel(`pinned:${chatRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT or DELETE
          schema: "public",
          table: "pinned_messages",
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: chatKeys.pinnedMessages(chatRoomId),
          });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.channel(`chat:${chatRoomId}`).unsubscribe();
      supabase.channel(`reactions:${chatRoomId}`).unsubscribe();
      supabase.channel(`pinned:${chatRoomId}`).unsubscribe();
    };
  }, [chatRoomId, queryClient, supabase]);

  // No need to return anything as this is just setting up listeners
  return null;
}
