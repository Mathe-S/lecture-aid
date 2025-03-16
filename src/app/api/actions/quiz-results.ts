"use server";

import db from "@/db";
import { quizResults } from "@/db/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/server";

export async function saveQuizResult({
  quizId,
  score,
  totalQuestions,
  answers,
}: {
  quizId: string;
  score: number;
  totalQuestions: number;
  answers: Record<string, string | string[]>;
}) {
  try {
    // Get the current user using our centralized utility
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "No authenticated user found" };
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

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error saving quiz result:", error);
    return {
      success: false,
      error: error.message || "Failed to save quiz result",
    };
  }
}
