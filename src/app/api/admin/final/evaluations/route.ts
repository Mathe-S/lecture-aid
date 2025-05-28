import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import { getUserRole } from "@/lib/userService";
import {
  getAllEvaluationsWithDetails,
  getEvaluationSummary,
  upsertEvaluation,
  WEEKLY_MAX_SCORES,
} from "@/lib/final-evaluation-service";

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

    // Fetch all evaluations and summary
    const [evaluations, summary] = await Promise.all([
      getAllEvaluationsWithDetails(),
      getEvaluationSummary(),
    ]);

    return NextResponse.json({
      evaluations,
      summary,
      weeklyMaxScores: WEEKLY_MAX_SCORES,
    });
  } catch (error) {
    console.error("[API_ADMIN_FINAL_EVALUATIONS_GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch evaluations" },
      { status: 500 }
    );
  }
}

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
    const {
      groupId,
      userId,
      week1Score,
      week1Feedback,
      week2Score,
      week2Feedback,
      week3Score,
      week3Feedback,
      week4Score,
      week4Feedback,
      feedback,
    } = body;

    // Validation
    if (!groupId || !userId) {
      return NextResponse.json(
        { error: "Group ID and User ID are required" },
        { status: 400 }
      );
    }

    // Validate scores are within limits
    const scoreValidations = [
      { score: week1Score, max: WEEKLY_MAX_SCORES.week1, week: 1 },
      { score: week2Score, max: WEEKLY_MAX_SCORES.week2, week: 2 },
      { score: week3Score, max: WEEKLY_MAX_SCORES.week3, week: 3 },
      { score: week4Score, max: WEEKLY_MAX_SCORES.week4, week: 4 },
    ];

    for (const { score, max, week } of scoreValidations) {
      if (score !== undefined && (score < 0 || score > max)) {
        return NextResponse.json(
          { error: `Week ${week} score must be between 0 and ${max}` },
          { status: 400 }
        );
      }
    }

    // Create or update evaluation
    const evaluation = await upsertEvaluation(
      groupId,
      userId,
      userData.user.id,
      {
        week1Score,
        week1Feedback,
        week2Score,
        week2Feedback,
        week3Score,
        week3Feedback,
        week4Score,
        week4Feedback,
        feedback,
      }
    );

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("[API_ADMIN_FINAL_EVALUATIONS_POST] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save evaluation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
