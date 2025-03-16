import { NextResponse } from "next/server";
import { getAllQuizResults } from "@/lib/quizResultService";

export async function GET() {
  try {
    const resultsData = await getAllQuizResults();
    return NextResponse.json(resultsData);
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz results" },
      { status: 500 }
    );
  }
}
