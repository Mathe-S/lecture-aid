import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import * as midtermService from "@/lib/midterm-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await supabaseForServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if the group exists
    const group = await midtermService.getMidtermGroupDetails(id);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if user is already a member
    const isMember = await midtermService.isGroupMember(id, session.user.id);
    if (isMember) {
      return NextResponse.json(
        { error: "You are already a member of this group" },
        { status: 400 }
      );
    }

    // Join the group
    await midtermService.joinMidtermGroup(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to join group:", error);
    return NextResponse.json(
      {
        error: "Failed to join group",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
