import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  sendMessage,
  toggleReaction,
  togglePinMessage,
  deleteMessage,
} from "@/app/api/actions/chat";
import {
  ChatMessageWithReplies,
  SendMessageRequest,
  ReactionRequest,
  PinMessageRequest,
  PinnedMessageWithMessage,
} from "@/types/chat";
import { useAuth } from "@/context/AuthContext";

// Query key factory for chat-related queries
export const chatKeys = {
  all: ["chat"] as const,
  rooms: () => [...chatKeys.all, "rooms"] as const,
  room: (id: string) => [...chatKeys.rooms(), id] as const,
  messages: (roomId: string) => [...chatKeys.room(roomId), "messages"] as const,
  pinnedMessages: (roomId: string) =>
    [...chatKeys.room(roomId), "pinned"] as const,
};

// Hook to fetch messages for a chat room
export function useChatMessages(chatRoomId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: chatKeys.messages(chatRoomId),
    queryFn: async () => {
      const response = await fetch(
        `/api/chat/messages?chatRoomId=${chatRoomId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch messages");
      }

      const data = await response.json();
      return data.messages as ChatMessageWithReplies[];
    },
    enabled: !!user && !!chatRoomId,
    staleTime: 1000 * 10, // 10 seconds
  });
}

// Hook to fetch pinned messages for a chat room
export function usePinnedMessages(
  chatRoomId: string
): UseQueryResult<PinnedMessageWithMessage[], Error> {
  const { user } = useAuth();

  return useQuery({
    queryKey: chatKeys.pinnedMessages(chatRoomId),
    queryFn: async () => {
      const response = await fetch(
        `/api/chat/pinned-messages?chatRoomId=${chatRoomId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch pinned messages");
      }

      const data = await response.json();
      return data.pinnedMessages;
    },
    enabled: !!user && !!chatRoomId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Hook for sending new messages
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageData: SendMessageRequest) => {
      const result = await sendMessage(messageData);

      if (!result.success) {
        throw new Error(result.error || "Failed to send message");
      }

      return result.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate chat messages query to refresh the list
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(variables.chatRoomId),
      });

      // If it's a reply, we may need to update the parent message
      if (variables.parentMessageId) {
        toast.success("Reply sent successfully");
      } else {
        toast.success("Message sent successfully");
      }
    },
    onError: (error) => {
      toast.error("Failed to send message", {
        description: error.message,
      });
    },
  });
}

// Hook for toggling reactions on messages
export function useToggleReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reactionData: ReactionRequest) => {
      const result = await toggleReaction(reactionData);

      if (!result.success) {
        throw new Error(result.error || "Failed to toggle reaction");
      }

      return result;
    },
    onSuccess: () => {
      // Instead of invalidating specific queries, we can let the realtime subscription
      // update the cache (if using realtime), or simply invalidate all chat message queries
      queryClient.invalidateQueries({
        queryKey: chatKeys.all,
      });
    },
    onError: (error) => {
      toast.error("Failed to toggle reaction", {
        description: error.message,
      });
    },
  });
}

// Hook for toggling pinned status of messages
export function useTogglePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pinData: PinMessageRequest) => {
      const result = await togglePinMessage(pinData);

      if (!result.success) {
        throw new Error(result.error || "Failed to toggle pin status");
      }

      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate pinned messages query to refresh the list
      queryClient.invalidateQueries({
        queryKey: chatKeys.pinnedMessages(variables.chatRoomId),
      });

      // Also invalidate messages query since pin status can be shown on messages
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(variables.chatRoomId),
      });

      toast.success("Pin status updated");
    },
    onError: (error) => {
      toast.error("Failed to update pin status", {
        description: error.message,
      });
    },
  });
}

// Delete message with optimistic updates
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId }: { messageId: string }) => {
      const result = await deleteMessage({ messageId });
      if (!result.success) {
        throw new Error(result.error || "Failed to delete message");
      }
      return result;
    },
    // Apply optimistic update before server responds
    onMutate: async ({ messageId }) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: chatKeys.all });

      // Get all messages from the cache
      const previousMessages = queryClient.getQueryData<
        Map<string, ChatMessageWithReplies[]>
      >(chatKeys.all);

      // Find the chatRoomId for this message
      let chatRoomId: string | null = null;

      // Update all cached message queries to remove the deleted message
      queryClient.setQueriesData({ queryKey: chatKeys.all }, (old: any) => {
        if (!old) return old;

        if (Array.isArray(old)) {
          // Remove the message from the array
          const result = old.filter((msg) => {
            if (msg.id === messageId) {
              chatRoomId = msg.chatRoomId;
              return false;
            }

            // Also filter out this message from any replies arrays
            if (msg.replies) {
              msg.replies = msg.replies.filter(
                (reply: ChatMessageWithReplies) => reply.id !== messageId
              );
            }

            return true;
          });

          return result;
        }

        return old;
      });

      // Return the previous messages so we can revert if there's an error
      return { previousMessages, chatRoomId };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, revert back to the previous messages
      if (context?.previousMessages) {
        queryClient.setQueryData(chatKeys.all, context.previousMessages);
      }

      toast.error("Failed to delete message", {
        description: err.message,
      });
    },
    onSettled: (data, error, variables, context) => {
      // Always refetch after error or success to make sure our local data is correct
      if (context?.chatRoomId) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.messages(context.chatRoomId),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: chatKeys.all });
      }
    },
  });
}
