import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import {
  getGroupTasks,
  createTask,
  CreateTaskPayload,
} from "@/lib/final-task-service";

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

    const tasks = await getGroupTasks(groupId, user.user.id);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching group tasks:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch tasks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await context.params;
    const payload: CreateTaskPayload = await request.json();

    // Basic validation
    if (!payload.title?.trim()) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    const supabase = await supabaseForServer();
    const { data: user, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const newTask = await createTask(groupId, user.user.id, payload);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
