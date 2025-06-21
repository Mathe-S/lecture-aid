import { NextRequest, NextResponse } from "next/server";
import {
  gradeTask,
  getTaskGrade,
  updateTaskGrade,
} from "@/lib/final-grading-service";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRole } from "@/lib/userService";

export async function POST(request: NextRequest) {
  const supabase = await supabaseForServer();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if user is admin
    const userRole = await getUserRole(userData.user.id);
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { taskId, studentId, points, feedback, adminResponse } = body;

    if (!taskId || !studentId || points === undefined) {
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

    // Check if a grade already exists for this task and student
    const existingGrade = await getTaskGrade(taskId, studentId);

    let result;
    if (existingGrade) {
      // Update existing grade
      result = await updateTaskGrade(existingGrade.id, {
        points,
        feedback: feedback || null,
      });
    } else {
      // Create new grade (shouldn't happen for appeals, but handle it)
      result = await gradeTask({
        taskId,
        studentId,
        points,
        feedback: feedback || null,
        graderId: userData.user.id,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error resolving appeal:", error);
    return NextResponse.json(
      { error: "Failed to resolve appeal" },
      { status: 500 }
    );
  }
}
