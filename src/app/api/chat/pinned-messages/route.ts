import { NextResponse } from "next/server";
import db from "@/db";
import { pinnedMessages } from "@/db/drizzle/chat-schema";
import { eq } from "drizzle-orm";
import { supabaseForServer } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatRoomId = searchParams.get("chatRoomId");

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

    // Get pinned messages for the chat room
    const pinned = await db.query.pinnedMessages.findMany({
      where: eq(pinnedMessages.chatRoomId, chatRoomId),
      with: {
        message: {
          with: {
            author: {
              columns: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        pinnedByUser: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json({ pinnedMessages: pinned });
  } catch (error: any) {
    console.error("Error fetching pinned messages:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pinned messages" },
      { status: 500 }
    );
  }
}
