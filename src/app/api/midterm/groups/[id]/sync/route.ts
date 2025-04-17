import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import * as midtermService from "@/lib/midterm-service";
import { syncGitHubRepositoryData } from "@/lib/midterm-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { repositoryUrl } = await request.json();

    if (!repositoryUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }

    // Fetch session to potentially get GitHub token
    const supabase = await supabaseForServer();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Validate that the user is a member of this group
    const isMember = await midtermService.isGroupMember(
      id,
      session?.user?.id ?? ""
    );
    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // 1. Connect the repository (updates URL/owner/name in DB)
    await midtermService.connectRepository(id, repositoryUrl);

    // 2. Trigger the GitHub data sync and metric update
    try {
      // Pass the provider_token if available
      await syncGitHubRepositoryData(id, session?.provider_token);
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
  const { id } = await params;

  try {
    const { repositoryUrl } = await request.json();

    if (!repositoryUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }

    // Fetch session to potentially get GitHub token
    const supabase = await supabaseForServer();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Validate that the user is a member of this group
    const isMember = await midtermService.isGroupMember(
      id,
      session?.user?.id ?? ""
    );
    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // 1. Update the repository details (effectively same as connect for this service)
    await midtermService.connectRepository(id, repositoryUrl);

    // 2. Trigger the GitHub data sync and metric update
    try {
      // Pass the provider_token if available
      await syncGitHubRepositoryData(id, session?.provider_token);
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
