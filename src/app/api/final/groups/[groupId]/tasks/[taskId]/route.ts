import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import {
  getTaskById,
  updateTask,
  deleteTask,
  UpdateTaskPayload,
} from "@/lib/final-task-service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ groupId: string; taskId: string }> }
) {
  try {
    const { taskId } = await context.params;
    const supabase = await supabaseForServer();
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await getTaskById(taskId, user.user.id);
    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch task";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ groupId: string; taskId: string }> }
) {
  try {
    const { taskId } = await context.params;
    const payload: UpdateTaskPayload = await request.json();

    // Basic validation
    if (payload.title !== undefined && !payload.title.trim()) {
      return NextResponse.json(
        { error: "Task title cannot be empty" },
        { status: 400 }
      );
    }

    const supabase = await supabaseForServer();
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedTask = await updateTask(taskId, user.user.id, payload);
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update task";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ groupId: string; taskId: string }> }
) {
  try {
    const { taskId } = await context.params;
    const supabase = await supabaseForServer();
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteTask(taskId, user.user.id);
    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete task";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
