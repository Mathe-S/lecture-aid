import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import * as midtermService from "@/lib/midterm-service";
import { getUserRole } from "@/lib/userService";
import { getMidtermGroupById } from "@/lib/midterm-service";

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
  const { id: groupId } = await params;
  const supabase = await supabaseForServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Authorization: Check if user is admin
  const role = await getUserRole(session.user.id);

  try {
    const groupDetails = await midtermService.getMidtermGroupDetails(groupId);

    if (!groupDetails) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const isAdmin = role === "admin";
    const memberInfo = groupDetails.members.find(
      (m) => m.userId === session.user.id
    );
    const isOwner = memberInfo?.role === "owner";

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        {
          error:
            "Forbidden: User must be an admin or the group owner to delete.",
        },
        { status: 403 }
      );
    }

    const success = await midtermService.deleteMidtermGroup(groupId);
    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete group" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to delete group ${groupId}:`, error);
    return NextResponse.json(
      {
        error: "Failed to delete group",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// PUT handler for updating group name/description
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;
  const supabase = await supabaseForServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description } = await request.json();

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    // Authorization Check: Admin or Owner
    const groupDetails = await getMidtermGroupById(groupId);
    if (!groupDetails) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    const memberInfo = groupDetails.members.find(
      (m) => m.userId === session.user.id
    );
    const isAdmin = session.user.app_metadata?.role === "admin"; // Adjust role check
    const isOwner = memberInfo?.role === "owner";

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden: Only admin or group owner can update" },
        { status: 403 }
      );
    }

    // Prepare update data (only name and description)
    const updateData = {
      name: name.trim(),
      description: description || null, // Use null if empty/undefined
    };

    const updatedGroup = await midtermService.updateMidtermGroup(
      groupId,
      updateData
    );

    if (!updatedGroup) {
      throw new Error("Update failed in service layer"); // Should not happen if auth passed
    }

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error(`Failed to update group ${groupId}:`, error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: `Failed to update group: ${message}` },
      { status: 500 }
    );
  }
}
