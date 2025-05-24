import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { updateGroupRepository } from "@/lib/final-group-service";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await context.params;
    const { repositoryUrl } = await request.json();

    if (typeof repositoryUrl !== "string") {
      return NextResponse.json(
        { error: "Repository URL must be a string" },
        { status: 400 }
      );
    }

    // Basic validation for GitHub URL format
    if (repositoryUrl && !repositoryUrl.includes("github.com")) {
      return NextResponse.json(
        { error: "Please provide a valid GitHub repository URL" },
        { status: 400 }
      );
    }

    const supabase = await supabaseForServer();
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the repository (service will verify owner permissions)
    const updatedGroup = await updateGroupRepository(
      groupId,
      repositoryUrl,
      user.user.id
    );

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error("Error updating repository:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update repository";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
