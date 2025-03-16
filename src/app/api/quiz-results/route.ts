import { NextResponse } from "next/server";
import db from "@/db";
import { quizResults, quizzes, profiles, userRoles } from "@/db/drizzle/schema";
import { eq } from "drizzle-orm";
import { supabaseForServer } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await supabaseForServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No authenticated user found" },
        { status: 401 }
      );
    }

    const userRole = await db.query.userRoles.findFirst({
      where: eq(userRoles.id, user.id),
    });

    if (!userRole || userRole.role !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Fetch all quiz results
    const results = await db.query.quizResults.findMany({
      orderBy: (quizResults, { desc }) => [desc(quizResults.completedAt)],
    });

    // Get unique quiz IDs and user IDs from the results
    const quizIds = [...new Set(results.map((result) => result.quizId))];
    const userIds = [...new Set(results.map((result) => result.userId))];

    // Fetch associated quizzes
    const quizzesData = await db.query.quizzes.findMany({
      where: (quizzes, { inArray }) => inArray(quizzes.id, quizIds),
    });

    // Fetch associated user profiles
    const usersData = await db.query.profiles.findMany({
      where: (profiles, { inArray }) => inArray(profiles.id, userIds),
    });

    // Index quizzes and users by ID for easier lookup
    const quizzesMap = quizzesData.reduce((acc, quiz) => {
      acc[quiz.id] = quiz;
      return acc;
    }, {} as Record<string, typeof quizzes.$inferSelect>);

    const usersMap = usersData.reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {} as Record<string, typeof profiles.$inferSelect>);

    return NextResponse.json({
      results,
      quizzes: quizzesMap,
      users: usersMap,
    });
  } catch (error: any) {
    console.error("Error fetching quiz results:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch quiz results" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { quizId, score, totalQuestions, answers } = await request.json();

    // Get the user from Supabase auth
    const supabase = await supabaseForServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "No authenticated user found" },
        { status: 401 }
      );
    }

    // Use Drizzle to insert the quiz result
    const [result] = await db
      .insert(quizResults)
      .values({
        quizId,
        userId: user.id,
        score,
        totalQuestions,
        answers,
      })
      .returning();

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error saving quiz result:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save quiz result" },
      { status: 500 }
    );
  }
}
