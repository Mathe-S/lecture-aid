"use server";

import db from "@/db";
import { quizResults } from "@/db/drizzle/schema";
import { createClient } from "@/utils/supabase/server";

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
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

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
