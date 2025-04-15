import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import * as midtermService from "@/lib/midterm-service";
import { getUserRole } from "@/lib/userService";

export async function GET(
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
    const group = await midtermService.getMidtermGroupDetails(id);

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Failed to fetch midterm group:", error);
    return NextResponse.json(
      { error: "Failed to fetch midterm group" },
      { status: 500 }
    );
  }
}

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

  // Authorization: Check if user is admin
  const role = await getUserRole(session.user.id);
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const success = await midtermService.deleteMidtermGroup(id);
    if (!success) {
      // Handle case where deletion failed in the service layer (though it currently always returns true)
      return NextResponse.json(
        { error: "Failed to delete group" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to delete group ${id}:`, error);
    return NextResponse.json(
      {
        error: "Failed to delete group",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
