import { NextResponse } from "next/server";
import db from "@/db";
import { supabaseForServer } from "@/utils/supabase/server";

export async function GET() {
  try {
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

    // Get all chat rooms
    const rooms = await db.query.chatRooms.findMany({
      orderBy: (chatRooms, { desc }) => [desc(chatRooms.updatedAt)],
    });

    return NextResponse.json({ chatRooms: rooms });
  } catch (error: any) {
    console.error("Error fetching chat rooms:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch chat rooms" },
      { status: 500 }
    );
  }
}
