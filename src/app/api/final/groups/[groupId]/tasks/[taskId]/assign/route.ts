import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { assignUsersToTask } from "@/lib/final-task-service";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ groupId: string; taskId: string }> }
) {
  try {
    const { taskId } = await context.params;
    const { assigneeIds }: { assigneeIds: string[] } = await request.json();

    // Basic validation
    if (!Array.isArray(assigneeIds)) {
      return NextResponse.json(
        { error: "assigneeIds must be an array" },
        { status: 400 }
      );
    }

    const supabase = await supabaseForServer();
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedTask = await assignUsersToTask(
      taskId,
      assigneeIds,
      user.user.id
    );
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error assigning users to task:", error);
    const message =
      error instanceof Error ? error.message : "Failed to assign users to task";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
