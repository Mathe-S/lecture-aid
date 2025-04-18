import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import {
  updateTaskStatus,
  getTaskById,
  isGroupMember,
} from "@/lib/midterm-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const supabase = await supabaseForServer();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;
  const userId = userData.user.id;

  try {
    // Get the new checked status from the request body
    const { isChecked } = await request.json();
    if (typeof isChecked !== "boolean") {
      return NextResponse.json(
        { error: "Invalid 'isChecked' value in request body" },
        { status: 400 }
      );
    }

    // Get the task to find its group ID
    const task = await getTaskById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if the user is a member of the group this task belongs to
    const memberCheck = await isGroupMember(task.groupId, userId);
    if (!memberCheck) {
      return NextResponse.json(
        {
          error:
            "Forbidden: User is not a member of the group this task belongs to",
        },
        { status: 403 }
      );
    }

    // Update the task status
    const updatedTask = await updateTaskStatus(taskId, isChecked);
    if (!updatedTask) {
      // Should not happen if task was found earlier, but check anyway
      return NextResponse.json(
        { error: "Failed to update task" },
        { status: 500 }
      );
    }

    console.log(
      `[Task Update ${taskId}] User ${userId} set isChecked=${isChecked}`
    );

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error(`[API Task Update Error ${taskId}]:`, error);
    if (error instanceof SyntaxError) {
      // Handle JSON parsing errors
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update task status", details: error.message },
      { status: 500 }
    );
  }
}
