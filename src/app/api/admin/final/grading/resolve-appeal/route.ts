import { NextRequest, NextResponse } from "next/server";
import { gradeTask } from "@/lib/final-grading-service";
import { supabaseForServer } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseForServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!userRole || userRole.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { taskId, studentId, points, maxPoints, feedback, adminResponse } =
      body;

    if (!taskId || !studentId || points === undefined || !maxPoints) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update the task description to include admin response to appeal
    if (adminResponse) {
      // Get current task to append admin response
      const { data: currentTask } = await supabase
        .from("final_tasks")
        .select("description")
        .eq("id", taskId)
        .single();

      if (currentTask) {
        const updatedDescription = `${currentTask.description || ""}

---
**Admin Response to Appeal:**
${adminResponse}
---`;

        await supabase
          .from("final_tasks")
          .update({
            description: updatedDescription,
            status: "graded", // Move back to graded status
          })
          .eq("id", taskId);
      }
    } else {
      // Just move back to graded status without admin response
      await supabase
        .from("final_tasks")
        .update({ status: "graded" })
        .eq("id", taskId);
    }

    // Grade or re-grade the task with new points
    const result = await gradeTask({
      taskId,
      studentId,
      points,
      maxPoints,
      feedback: feedback || null,
      graderId: user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error resolving appeal:", error);
    return NextResponse.json(
      { error: "Failed to resolve appeal" },
      { status: 500 }
    );
  }
}
