import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { updateTask } from "@/lib/final-task-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string; taskId: string }> }
) {
  try {
    const { groupId, taskId } = await params;
    const { requestedPoints, reason } = await request.json();

    const supabase = await supabaseForServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate input
    if (typeof requestedPoints !== "number" || requestedPoints < 0) {
      return NextResponse.json(
        { error: "Invalid requested points" },
        { status: 400 }
      );
    }

    // Update task status to appeal and append appeal reason to description
    const appealDescription = reason
      ? `\n\n--- GRADE APPEAL ---\nRequested Points: ${requestedPoints}\nReason: ${reason}\n--- END APPEAL ---`
      : `\n\n--- GRADE APPEAL ---\nRequested Points: ${requestedPoints}\n--- END APPEAL ---`;

    // Get current task to append to description
    const taskResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/final/groups/${groupId}/tasks/${taskId}`,
      {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      }
    );

    if (!taskResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch task" },
        { status: 500 }
      );
    }

    const currentTask = await taskResponse.json();
    const updatedDescription =
      (currentTask.description || "") + appealDescription;

    // Update the task with appeal status and updated description
    const updatedTask = await updateTask(taskId, user.id, {
      status: "appeal",
      description: updatedDescription,
    });

    return NextResponse.json({
      message: "Appeal submitted successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Appeal submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit appeal" },
      { status: 500 }
    );
  }
}
