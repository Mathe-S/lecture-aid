import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import * as midtermService from "@/lib/midterm-service";
import { getUserRole } from "@/lib/userService";
import { MidtermGroup } from "@/db/drizzle/midterm-schema";

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
    const group = await midtermService.getMidtermGroupDetailsWithTasks(id);

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
    const groupDetails = await midtermService.getMidtermGroupDetailsWithTasks(
      groupId
    );

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

// Function to parse GitHub URL
function parseGitHubUrl(url: string): { owner: string; name: string } | null {
  if (!url || typeof url !== "string") return null;
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname !== "github.com") return null;
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    if (pathParts.length >= 2) {
      return {
        owner: pathParts[0],
        name: pathParts[1].replace(".git", ""), // Remove .git suffix if present
      };
    }
  } catch (e) {
    console.error("Failed to parse GitHub URL:", e);
    // Invalid URL
    return null;
  }
  return null;
}

// PUT handler for updating group name/description/repositoryUrl
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
    const { name, description, repositoryUrl } = await request.json();

    if (
      name !== undefined &&
      (typeof name !== "string" || name.trim() === "")
    ) {
      return NextResponse.json(
        { error: "Group name cannot be empty" },
        { status: 400 }
      );
    }

    // Validate repositoryUrl if provided
    let parsedRepo: { owner: string; name: string } | null = null;
    if (repositoryUrl !== undefined) {
      if (repositoryUrl === null || repositoryUrl === "") {
        // Allowing explicit clearing of the URL
        parsedRepo = null;
      } else if (typeof repositoryUrl !== "string") {
        return NextResponse.json(
          { error: "Invalid repository URL format" },
          { status: 400 }
        );
      } else {
        parsedRepo = parseGitHubUrl(repositoryUrl);
        if (!parsedRepo) {
          return NextResponse.json(
            { error: "Invalid GitHub repository URL" },
            { status: 400 }
          );
        }
      }
    }

    // Authorization Check: Admin or Owner (check based on current DB state)
    const groupDetails = await midtermService.getMidtermGroupDetailsWithTasks(
      groupId
    );
    if (!groupDetails) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    const memberInfo = groupDetails.members.find(
      (m) => m.userId === session.user.id
    );
    const role = await getUserRole(session.user.id);
    const isAdmin = role === "admin";
    const isOwner = memberInfo?.role === "owner";

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden: Only admin or group owner can update" },
        { status: 403 }
      );
    }

    // Prepare update data - only include fields that were actually sent
    const updateData: Partial<MidtermGroup> = {};
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description || null; // Use null if empty/falsy
    }
    if (repositoryUrl !== undefined) {
      if (repositoryUrl === null || repositoryUrl === "") {
        // Explicitly clear repository fields
        updateData.repositoryUrl = null;
        updateData.repositoryOwner = null;
        updateData.repositoryName = null;
        updateData.lastSync = null; // Also clear last sync time
      } else if (parsedRepo) {
        updateData.repositoryUrl = repositoryUrl;
        updateData.repositoryOwner = parsedRepo.owner;
        updateData.repositoryName = parsedRepo.name;
        // Note: We might want to trigger an initial sync here or soon after
      }
    }

    // Prevent empty updates
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(groupDetails); // No changes, return current data
    }

    const updatedGroup = await midtermService.updateMidtermGroup(
      groupId,
      updateData
    );

    if (!updatedGroup) {
      throw new Error(
        "Update failed in service layer, group might not exist or DB error."
      );
    }

    if (
      updateData.repositoryUrl &&
      updateData.repositoryOwner &&
      updateData.repositoryName
    ) {
      console.log(
        `Repository URL updated for group ${groupId}, attempting initial sync...`
      );
      // We run this without await and ignore errors for now
      // Consider a more robust background job system for this
      midtermService
        .syncGitHubRepositoryData(groupId, session.provider_token)
        .catch((err) => {
          console.error(
            `[Non-blocking] Initial sync failed for ${groupId} after URL update:`,
            err
          );
        });
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
