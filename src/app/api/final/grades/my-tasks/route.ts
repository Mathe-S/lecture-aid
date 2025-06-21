import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  finalGroupMembers,
  finalTaskAssignees,
  finalTaskGrades,
} from "@/db/drizzle/final-schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const supabase = await supabaseForServer();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = userData.user.id;

    // Get user's final group and all tasks
    const userGroup = await db.query.finalGroupMembers.findFirst({
      where: eq(finalGroupMembers.userId, userId),
      with: {
        group: {
          with: {
            tasks: {
              with: {
                assignees: {
                  where: eq(finalTaskAssignees.userId, userId),
                },
                grades: {
                  where: eq(finalTaskGrades.studentId, userId),
                },
              },
            },
          },
        },
      },
    });

    if (!userGroup) {
      return NextResponse.json({
        totalPointsEarned: 0,
        totalTasksGraded: 0,
        totalTasks: 0,
        averageScore: 0,
        grades: [],
      });
    }

    // Filter tasks that the user is assigned to
    const userTasks = userGroup.group.tasks.filter(
      (task) => task.assignees.length > 0
    );

    // Calculate statistics
    const gradedTasks = userTasks.filter(
      (task) => task.status === "graded" && task.grades.length > 0
    );

    const totalPointsEarned = gradedTasks.reduce(
      (sum, task) => sum + (task.grades[0]?.points || 0),
      0
    );

    const averageScore =
      gradedTasks.length > 0
        ? gradedTasks.reduce((sum, task) => {
            const grade = task.grades[0];
            return sum + (grade ? grade.points : 0);
          }, 0) / gradedTasks.length
        : 0;

    const grades = gradedTasks.map((task) => {
      const grade = task.grades[0];
      return {
        taskId: task.id,
        taskTitle: task.title,
        points: grade.points,

        gradedAt: grade.gradedAt,
      };
    });

    return NextResponse.json({
      totalPointsEarned,
      totalTasksGraded: gradedTasks.length,
      totalTasks: userTasks.length,
      averageScore: Math.round(averageScore),
      grades,
    });
  } catch (error) {
    console.error("[API_FINAL_GRADES_MY_TASKS_GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch final task grades" },
      { status: 500 }
    );
  }
}
