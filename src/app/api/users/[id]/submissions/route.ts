import { getSubmissionsByUser } from "@/lib/assignmentService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const submissions = await getSubmissionsByUser(userId);
    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching user submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch user submissions" },
      { status: 500 }
    );
  }
}
