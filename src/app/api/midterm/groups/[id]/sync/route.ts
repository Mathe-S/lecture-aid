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
    const { repositoryUrl } = await request.json();

    if (!repositoryUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }

    // Validate that the user is a member of this group
    const isMember = await midtermService.isGroupMember(id, session.user.id);
    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // Connect the repository and sync data
    await midtermService.connectRepository(id, repositoryUrl, session);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to sync repository:", error);
    return NextResponse.json(
      {
        error: "Failed to sync repository",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
