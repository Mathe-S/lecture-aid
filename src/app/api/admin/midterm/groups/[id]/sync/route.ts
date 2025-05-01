import { NextResponse, NextRequest } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRole } from "@/lib/userService";
import { syncGitHubRepositoryData, isGroupOwner } from "@/lib/midterm-service";

export async function POST(
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

  // Authorization: Admin OR Owner of this specific group
  const role = await getUserRole(session.user.id);
  const isAdmin = role === "admin";
  let isOwnerOfThisGroup = false;

  if (!isAdmin) {
    // If not admin, check if they are the owner of THIS group
    try {
      isOwnerOfThisGroup = await isGroupOwner(groupId, session.user.id);
    } catch (err) {
      console.error(
        `Error checking group ownership for user ${session.user.id} and group ${groupId}:`,
        err
      );
      // Treat error as unauthorized for safety
      return NextResponse.json(
        { error: "Failed to verify ownership" },
        { status: 500 }
      );
    }
  }

  // Now check if authorized
  if (!isAdmin && !isOwnerOfThisGroup) {
    return NextResponse.json(
      { error: "Forbidden: Admin or Group Owner required" },
      { status: 403 }
    );
  }

  try {
    // Pass the session's provider_token if available, as the service function might need it
    await syncGitHubRepositoryData(groupId, session.provider_token);

    return NextResponse.json({ message: "Sync initiated successfully" });
  } catch (error) {
    console.error(`Failed to sync repository for group ${groupId}:`, error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: `Sync failed: ${message}` },
      { status: 500 }
    );
  }
}
