import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRole } from "@/lib/userService";
import { db } from "@/db";
import { finalTaskGrades, finalTasks } from "@/db/drizzle/final-schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const gradeTaskSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
  studentId: z.string().uuid("Invalid student ID"),
  points: z.number().min(0, "Points must be non-negative"),
  feedback: z.string().optional(),
});

export async function POST(request: Request) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = gradeTaskSchema.parse(body);

    // Check if the task exists and is in "done" status
    const task = await db.query.finalTasks.findFirst({
      where: eq(finalTasks.id, validatedData.taskId),
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.status !== "done") {
      return NextResponse.json(
        { error: "Task must be in 'done' status to be graded" },
        { status: 400 }
      );
    }

    // Check if grade already exists for this task and student
    const existingGrade = await db.query.finalTaskGrades.findFirst({
      where: and(
        eq(finalTaskGrades.taskId, validatedData.taskId),
        eq(finalTaskGrades.studentId, validatedData.studentId)
      ),
    });

    let gradedTask;

    if (existingGrade) {
      // Update existing grade
      gradedTask = await db
        .update(finalTaskGrades)
        .set({
          points: validatedData.points,
          feedback: validatedData.feedback,
          graderId: userData.user.id,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(finalTaskGrades.id, existingGrade.id))
        .returning();
    } else {
      // Create new grade
      gradedTask = await db
        .insert(finalTaskGrades)
        .values({
          taskId: validatedData.taskId,
          studentId: validatedData.studentId,
          points: validatedData.points,
          feedback: validatedData.feedback,
          graderId: userData.user.id,
        })
        .returning();
    }

    // Update task status to "graded" if all assignees have been graded
    const taskWithAssignees = await db.query.finalTasks.findFirst({
      where: eq(finalTasks.id, validatedData.taskId),
      with: {
        assignees: true,
        grades: true,
      },
    });

    if (taskWithAssignees) {
      const assigneeIds = taskWithAssignees.assignees.map((a) => a.userId);
      const gradedStudentIds = taskWithAssignees.grades.map((g) => g.studentId);

      // Check if all assignees have been graded
      const allGraded = assigneeIds.every((id) =>
        gradedStudentIds.includes(id)
      );

      if (allGraded && task.status === "done") {
        await db
          .update(finalTasks)
          .set({
            status: "graded",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(finalTasks.id, validatedData.taskId));
      }
    }

    return NextResponse.json({
      message: existingGrade
        ? "Grade updated successfully"
        : "Task graded successfully",
      grade: gradedTask[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[API_ADMIN_FINAL_GRADING_GRADE_POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to grade task" },
      { status: 500 }
    );
  }
}
