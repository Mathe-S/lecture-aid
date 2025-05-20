import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { selectProjectForFinalGroup } from "@/lib/final-group-service";
import { z } from "zod";

const selectProjectSchema = z.object({
  projectId: z.string().uuid("Invalid Project ID format"),
});

export async function PUT(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ groupId: string }> }
) {
  const params = await paramsPromise;
  const supabase = await supabaseForServer();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = userData.user.id;
  const { groupId } = params;

  if (!groupId) {
    return NextResponse.json(
      { error: "Group ID is required in URL" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const validation = selectProjectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }
    const { projectId } = validation.data;

    const updatedGroup = await selectProjectForFinalGroup(
      groupId,
      projectId,
      userId
    );
    return NextResponse.json(updatedGroup, { status: 200 });
  } catch (error) {
    console.error("[API_FINAL_GROUPS_SELECT_PROJECT_PUT] Error:", error);
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: error.message }, { status: 403 }); // Forbidden
      }
      if (error.message.includes("Project not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("Group not found")) {
        // From service if owner check fails due to no group
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred while selecting project" },
      { status: 500 }
    );
  }
}
