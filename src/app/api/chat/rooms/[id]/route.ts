import { NextResponse } from "next/server";
import db from "@/db";
import { chatRooms } from "@/db/drizzle/chat-schema";
import { eq } from "drizzle-orm";
import { supabaseForServer } from "@/utils/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

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

    // Get chat room details
    const room = await db.query.chatRooms.findFirst({
      where: eq(chatRooms.id, id),
      with: {
        creator: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Chat room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ chatRoom: room });
  } catch (error: any) {
    console.error("Error fetching chat room:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch chat room" },
      { status: 500 }
    );
  }
}
