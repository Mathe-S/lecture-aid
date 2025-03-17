"use server";

import db from "@/db";
import {
  chatMessages,
  messageReactions,
  pinnedMessages,
  chatRooms,
} from "@/db/drizzle/chat-schema";
import { supabaseForServer } from "@/utils/supabase/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { checkAdminRole } from "@/lib/authUtils";

export async function sendMessage({
  chatRoomId,
  content,
  parentMessageId,
}: {
  chatRoomId: string;
  content: string;
  parentMessageId?: string;
}) {
  try {
    const supabase = await supabaseForServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No authenticated user found" };
    }

    // Insert new message
    const [message] = await db
      .insert(chatMessages)
      .values({
        chatRoomId,
        content,
        userId: user.id,
        parentMessageId: parentMessageId || null,
      })
      .returning();

    // Revalidate the chat page to update the UI
    revalidatePath(`/chat/${chatRoomId}`);

    return { success: true, data: message };
  } catch (error: any) {
    console.error("Error sending message:", error);
    return {
      success: false,
      error: error.message || "Failed to send message",
    };
  }
}

export async function toggleReaction({
  messageId,
  reaction,
}: {
  messageId: string;
  reaction: string;
}) {
  try {
    const supabase = await supabaseForServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No authenticated user found" };
    }

    // Check if the reaction already exists
    const existingReaction = await db.query.messageReactions.findFirst({
      where: and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, user.id),
        eq(messageReactions.reaction, reaction)
      ),
    });

    if (existingReaction) {
      // Remove reaction if it exists
      await db
        .delete(messageReactions)
        .where(eq(messageReactions.id, existingReaction.id));
    } else {
      // Add reaction if it doesn't exist
      await db.insert(messageReactions).values({
        messageId,
        userId: user.id,
        reaction,
      });
    }

    // Get the message to find its chat room
    const message = await db.query.chatMessages.findFirst({
      where: eq(chatMessages.id, messageId),
    });

    if (message) {
      revalidatePath(`/chat/${message.chatRoomId}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error toggling reaction:", error);
    return {
      success: false,
      error: error.message || "Failed to toggle reaction",
    };
  }
}

export async function togglePinMessage({
  messageId,
  chatRoomId,
}: {
  messageId: string;
  chatRoomId: string;
}) {
  try {
    const supabase = await supabaseForServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No authenticated user found" };
    }

    // Check if the message is already pinned
    const existingPin = await db.query.pinnedMessages.findFirst({
      where: and(
        eq(pinnedMessages.messageId, messageId),
        eq(pinnedMessages.chatRoomId, chatRoomId)
      ),
    });

    if (existingPin) {
      // Unpin the message if it's already pinned
      await db
        .delete(pinnedMessages)
        .where(eq(pinnedMessages.id, existingPin.id));
    } else {
      // Pin the message if it's not pinned
      await db.insert(pinnedMessages).values({
        messageId,
        chatRoomId,
        pinnedBy: user.id,
      });
    }

    revalidatePath(`/chat/${chatRoomId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Error toggling pin:", error);
    return {
      success: false,
      error: error.message || "Failed to toggle pin",
    };
  }
}

export async function createChatRoom({
  name,
  description = "",
}: {
  name: string;
  description?: string;
}) {
  try {
    const supabase = await supabaseForServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No authenticated user found" };
    }

    // Insert new chat room
    const [chatRoom] = await db
      .insert(chatRooms)
      .values({
        name,
        description,
        createdBy: user.id,
      })
      .returning();

    // Revalidate the chat page
    revalidatePath(`/chat`);

    return { success: true, data: chatRoom };
  } catch (error: any) {
    console.error("Error creating chat room:", error);
    return {
      success: false,
      error: error.message || "Failed to create chat room",
    };
  }
}

export async function deleteMessage({ messageId }: { messageId: string }) {
  try {
    // Use the admin check utility
    const adminCheck = await checkAdminRole();

    if (!adminCheck.success) {
      return {
        success: false,
        error: adminCheck.error,
      };
    }

    // Get the message to find its chat room (for revalidation)
    const message = await db.query.chatMessages.findFirst({
      where: eq(chatMessages.id, messageId),
    });

    if (!message) {
      return { success: false, error: "Message not found" };
    }

    // Delete the message
    await db.delete(chatMessages).where(eq(chatMessages.id, messageId));

    // Revalidate the chat page to update the UI
    revalidatePath(`/chat/${message.chatRoomId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting message:", error);
    return {
      success: false,
      error: error.message || "Failed to delete message",
    };
  }
}
