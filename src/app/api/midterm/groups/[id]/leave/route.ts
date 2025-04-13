import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import * as midtermService from "@/lib/midterm-service";

export async function DELETE(
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
  const userId = session.user.id;

  try {
    // Verify the user is currently a member before allowing them to leave
    const isMember = await midtermService.isGroupMember(id, userId);
    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 } // Forbidden
      );
    }

    // Call the service function to remove the member
    await midtermService.leaveMidtermGroup(id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to leave group ${id}:`, error);
    return NextResponse.json(
      {
        error: "Failed to leave group",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
