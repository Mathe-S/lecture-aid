import {
  createQuiz,
  getQuizzesWithQuestions,
  getQuizzes,
} from "@/lib/quizService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Check if we need to include questions with the response
    const url = new URL(request.url);
    const includeQuestions =
      url.searchParams.get("includeQuestions") === "true";

    let quizzes;
    if (includeQuestions) {
      quizzes = await getQuizzesWithQuestions();
    } else {
      quizzes = await getQuizzes();
    }

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const quizData = await request.json();
    const userId = quizData.createdBy;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const quiz = await createQuiz(quizData, userId);
    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}
