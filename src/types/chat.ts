import { InferSelectModel } from "drizzle-orm";
import {
  chatRooms,
  chatMessages,
  messageReactions,
  pinnedMessages,
} from "@/db/drizzle/chat-schema";
import { profiles } from "@/db/drizzle/schema"; // Adjust path as needed

export type ChatRoom = InferSelectModel<typeof chatRooms>;
export type ChatMessage = InferSelectModel<typeof chatMessages>;
export type MessageReaction = InferSelectModel<typeof messageReactions>;
export type PinnedMessage = InferSelectModel<typeof pinnedMessages>;

// Extended types with relations
export type ChatMessageWithAuthor = ChatMessage & {
  author: Pick<
    InferSelectModel<typeof profiles>,
    "id" | "fullName" | "avatarUrl"
  >;
};

export type ChatMessageWithReactions = ChatMessageWithAuthor & {
  reactions: MessageReaction[];
  reactionCounts: Record<string, number>; // e.g., { 'like': 5, 'heart': 3 }
};

export type ChatMessageWithReplies = ChatMessageWithReactions & {
  replies?: ChatMessageWithReactions[];
  parentMessage?: ChatMessageWithReactions;
};

export type ChatRoomWithDetails = ChatRoom & {
  pinnedMessages?: (PinnedMessage & { message: ChatMessageWithAuthor })[];
};

// Request/response types
export type SendMessageRequest = {
  chatRoomId: string;
  content: string;
  parentMessageId?: string;
};

export type ReactionRequest = {
  messageId: string;
  reaction: string;
};

export type PinMessageRequest = {
  messageId: string;
  chatRoomId: string;
};
