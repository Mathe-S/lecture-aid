import { NextResponse } from "next/server";
import db from "@/db";
import { chatMessages } from "@/db/drizzle/chat-schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import { supabaseForServer } from "@/utils/supabase/server";
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatRoomId = searchParams.get("chatRoomId");

    // Optional params for pagination
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Auth check
    const supabase = await supabaseForServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No authenticated user found" },
        { status: 401 }
      );
    }

    if (!chatRoomId) {
      return NextResponse.json(
        { error: "Chat room ID is required" },
        { status: 400 }
      );
    }

    // Get top-level messages (not replies)
    const messages = await db.query.chatMessages.findMany({
      where: and(
        eq(chatMessages.chatRoomId, chatRoomId),
        isNull(chatMessages.parentMessageId)
      ),
      orderBy: [desc(chatMessages.createdAt)],
      limit,
      offset,
      with: {
        author: {
          columns: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        reactions: {
          with: {
            user: {
              columns: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    // For each message, get replies
    const messagesWithReplies = await Promise.all(
      messages.map(async (message) => {
        const replies = await db.query.chatMessages.findMany({
          where: eq(chatMessages.parentMessageId, message.id),
          orderBy: [desc(chatMessages.createdAt)],
          with: {
            author: {
              columns: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
            reactions: {
              with: {
                user: {
                  columns: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        });

        // Calculate reaction counts
        const reactionCounts: Record<string, number> = {};
        if (Array.isArray(message.reactions)) {
          message.reactions.forEach((reaction: any) => {
            reactionCounts[reaction.reaction] =
              (reactionCounts[reaction.reaction] || 0) + 1;
          });
        }

        return {
          ...message,
          replies,
          reactionCounts,
        };
      })
    );

    return NextResponse.json({ messages: messagesWithReplies });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
