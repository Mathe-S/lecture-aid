import { NextResponse, NextRequest } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRole } from "@/lib/userService"; // Assuming this exists
import { syncGitHubRepositoryData } from "@/lib/midterm-service"; // Import the sync function
// import { triggerRepositorySync } from "@/lib/github-service"; // Hypothetical service function

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

  // Authorization: Admin only
  const role = await getUserRole(session.user.id);
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Call the actual sync logic service function
    console.log(`Admin sync requested for group: ${groupId}`);
    await syncGitHubRepositoryData(groupId);

    // Remove simulation: await new Promise(resolve => setTimeout(resolve, 1500));

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
