import { getSubmissionByUserAndAssignment } from "@/lib/assignmentService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params;

    const submission = await getSubmissionByUserAndAssignment(id, userId);

    if (!submission) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error fetching user submission:", error);
    return NextResponse.json(
      { error: "Failed to fetch user submission" },
      { status: 500 }
    );
  }
}
