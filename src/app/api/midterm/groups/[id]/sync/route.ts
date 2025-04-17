import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import * as midtermService from "@/lib/midterm-service";
import { syncGitHubRepositoryData } from "@/lib/midterm-service";

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
    await midtermService.connectRepository(id, repositoryUrl);

    // Trigger the GitHub data sync and metric update
    try {
      await syncGitHubRepositoryData(id);
      // Sync succeeded along with connect
      return NextResponse.json({
        success: true,
        message: "Repository connected and initial sync started.",
      });
    } catch (syncError) {
      // Connect succeeded, but initial sync failed
      console.error(
        `Initial sync failed for group ${id} after connect:`,
        syncError
      );
      // Return success for the connect part, but maybe indicate sync issue
      return NextResponse.json(
        {
          success: true, // Connect was successful
          warning:
            "Repository connected, but initial data sync failed. Please try syncing manually later.",
          syncErrorDetails:
            syncError instanceof Error ? syncError.message : undefined,
        },
        { status: 207 }
      ); // Multi-Status might be appropriate
    }
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

export async function PUT(
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

    // Update the repository and sync data
    // Re-use connectRepository, assuming it handles updates or use a specific update function if available
    // For simplicity, we'll assume connectRepository can handle updates based on existing group state
    await midtermService.connectRepository(id, repositoryUrl);

    // Trigger the GitHub data sync and metric update
    try {
      await syncGitHubRepositoryData(id);
      // Sync succeeded along with update
      return NextResponse.json({
        success: true,
        message: "Repository updated and sync started.",
      });
    } catch (syncError) {
      // Update succeeded, but sync failed
      console.error(`Sync failed for group ${id} after update:`, syncError);
      return NextResponse.json(
        {
          success: true, // Update was successful
          warning:
            "Repository updated, but data sync failed. Please try syncing manually later.",
          syncErrorDetails:
            syncError instanceof Error ? syncError.message : undefined,
        },
        { status: 207 }
      );
    }
  } catch (error) {
    console.error("Failed to update repository:", error);
    return NextResponse.json(
      {
        error: "Failed to update repository",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
