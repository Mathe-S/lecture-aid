import { NextResponse, NextRequest } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import * as midtermService from "@/lib/midterm-service";
import { getUserRole } from "@/lib/userService"; // Assuming this exists

// GET handler to fetch a specific evaluation
export async function GET(request: NextRequest) {
  const supabase = await supabaseForServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Authorization: Admin only
  const role = await getUserRole(session.user.id);
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const userId = searchParams.get("userId");

  if (!groupId || !userId) {
    return NextResponse.json(
      { error: "groupId and userId query parameters are required" },
      { status: 400 }
    );
  }

  try {
    // Need a service function like getEvaluation(groupId, userId)
    // For now, simulate or assume it exists and might return null
    // const evaluation = await midtermService.getEvaluation(groupId, userId);
    const evaluations = await midtermService.getGroupEvaluations(groupId);
    const evaluation = evaluations.find((e) => e.userId === userId) || null;

    if (!evaluation) {
      return NextResponse.json(
        { error: "Evaluation not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Failed to fetch evaluation:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: `Failed to fetch evaluation: ${message}` },
      { status: 500 }
    );
  }
}

// POST handler to save/update an evaluation
export async function POST(request: NextRequest) {
  const supabase = await supabaseForServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Authorization: Admin only
  const role = await getUserRole(session.user.id);
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { groupId, userId, scores, feedback } = body;

    // Basic validation
    if (!groupId || !userId || !scores) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    // Add more validation for scores if needed

    await midtermService.saveEvaluation(
      groupId,
      userId,
      session.user.id, // evaluatorId is the current admin user
      scores,
      feedback
    );

    // Fetch the potentially updated evaluation to return it
    // const savedEvaluation = await midtermService.getEvaluation(groupId, userId);
    const evaluations = await midtermService.getGroupEvaluations(groupId);
    const savedEvaluation =
      evaluations.find((e) => e.userId === userId) || null;

    return NextResponse.json(savedEvaluation);
  } catch (error) {
    console.error("Failed to save evaluation:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: `Failed to save evaluation: ${message}` },
      { status: 500 }
    );
  }
}
