import { NextRequest, NextResponse } from "next/server";
import { getQuizResultDetails } from "@/lib/quizResultService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Result ID is required" },
      { status: 400 }
    );
  }

  try {
    const resultDetails = await getQuizResultDetails(id);
    return NextResponse.json(resultDetails);
  } catch (error) {
    console.error("Error fetching result details:", error);
    return NextResponse.json(
      { error: "Failed to fetch result details" },
      { status: 500 }
    );
  }
}
