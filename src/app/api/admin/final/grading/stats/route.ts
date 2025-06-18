import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRole } from "@/lib/userService";
import { db } from "@/db";
import { finalTasks, finalTaskGrades } from "@/db/drizzle/final-schema";
import { profiles } from "@/db/drizzle/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
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

    // Get total tasks count
    const totalTasksResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(finalTasks);
    const totalTasks = totalTasksResult[0]?.count || 0;

    // Get pending tasks count (status = 'done')
    const pendingTasksResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(finalTasks)
      .where(eq(finalTasks.status, "done"));
    const pendingTasks = pendingTasksResult[0]?.count || 0;

    // Get graded tasks count (status = 'graded')
    const gradedTasksResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(finalTasks)
      .where(eq(finalTasks.status, "graded"));
    const gradedTasks = gradedTasksResult[0]?.count || 0;

    // Get average score from task grades
    const averageScoreResult = await db
      .select({ avg: sql<number>`avg(${finalTaskGrades.points})` })
      .from(finalTaskGrades);
    const averageScore = averageScoreResult[0]?.avg || 0;

    // Get individual student performance
    const studentPerformance = await db
      .select({
        studentId: finalTaskGrades.studentId,
        studentName: profiles.fullName,
        studentEmail: profiles.email,
        totalPoints: sql<number>`sum(${finalTaskGrades.points})`,
        tasksGraded: sql<number>`count(${finalTaskGrades.id})`,
        averageScore: sql<number>`avg(${finalTaskGrades.points})`,
      })
      .from(finalTaskGrades)
      .leftJoin(profiles, eq(profiles.id, finalTaskGrades.studentId))
      .groupBy(finalTaskGrades.studentId, profiles.fullName, profiles.email)
      .orderBy(sql`avg(${finalTaskGrades.points}) desc`);

    // Calculate completion rate
    const completionRate =
      totalTasks > 0 ? (gradedTasks / totalTasks) * 100 : 0;

    const stats = {
      totalTasks,
      pendingTasks,
      gradedTasks,
      averageScore: Math.round(averageScore * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      studentPerformance: studentPerformance.map((student) => ({
        ...student,
        totalPoints: student.totalPoints || 0,
        tasksGraded: student.tasksGraded || 0,
        averageScore: Math.round((student.averageScore || 0) * 100) / 100,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[API_ADMIN_FINAL_GRADING_STATS_GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch grading statistics" },
      { status: 500 }
    );
  }
}
