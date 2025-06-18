import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRole } from "@/lib/userService";
import { db } from "@/db";
import { finalEvaluations, finalGroupMembers } from "@/db/drizzle/final-schema";
import { sql } from "drizzle-orm";

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

    // Fetch all evaluations with group and student details
    const evaluations = await db.query.finalEvaluations.findMany({
      with: {
        group: {
          columns: {
            id: true,
            name: true,
          },
        },
        student: {
          columns: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [finalEvaluations.createdAt],
    });

    // Calculate summary statistics
    const totalStudents = await db
      .select({ count: sql<number>`count(*)` })
      .from(finalGroupMembers)
      .then((result) => result[0]?.count || 0);

    const evaluatedStudents = evaluations.length;

    const averageScore =
      evaluations.length > 0
        ? evaluations.reduce(
            (sum, evaluation) => sum + evaluation.totalPoints,
            0
          ) / evaluations.length
        : 0;

    // Since final evaluations don't have weekly scores, we'll simulate them
    // by dividing the total points across 4 weeks equally
    const weeklyAverages = {
      week1: averageScore / 4,
      week2: averageScore / 4,
      week3: averageScore / 4,
      week4: averageScore / 4,
    };

    // Weekly max scores (based on the 400-point system)
    const weeklyMaxScores = {
      week1: 100, // 25% of 400
      week2: 100, // 25% of 400
      week3: 100, // 25% of 400
      week4: 100, // 25% of 400
    };

    const summary = {
      totalStudents,
      evaluatedStudents,
      averageScore: Math.round(averageScore * 100) / 100,
      weeklyAverages: {
        week1: Math.round(weeklyAverages.week1 * 100) / 100,
        week2: Math.round(weeklyAverages.week2 * 100) / 100,
        week3: Math.round(weeklyAverages.week3 * 100) / 100,
        week4: Math.round(weeklyAverages.week4 * 100) / 100,
      },
    };

    return NextResponse.json({
      evaluations,
      summary,
      weeklyMaxScores,
    });
  } catch (error) {
    console.error("[API_ADMIN_FINAL_EVALUATIONS_GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch final project evaluations" },
      { status: 500 }
    );
  }
}
