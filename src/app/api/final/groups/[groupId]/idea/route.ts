import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import {
  updateProjectIdea,
  getUserFinalGroup,
} from "@/lib/final-group-service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await context.params;
    const supabase = await supabaseForServer();
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's group to verify membership
    const userGroup = await getUserFinalGroup(user.user.id);

    if (!userGroup || userGroup.id !== groupId) {
      return NextResponse.json(
        { error: "Not a member of this group" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      projectIdea: userGroup.projectIdea,
    });
  } catch (error) {
    console.error("Error fetching project idea:", error);
    return NextResponse.json(
      { error: "Failed to fetch project idea" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await context.params;
    const { projectIdea } = await request.json();

    if (typeof projectIdea !== "string") {
      return NextResponse.json(
        { error: "Project idea must be a string" },
        { status: 400 }
      );
    }

    const supabase = await supabaseForServer();
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the project idea (service will verify owner permissions)
    const updatedGroup = await updateProjectIdea(
      groupId,
      projectIdea,
      user.user.id
    );

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error("Error updating project idea:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update project idea";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
