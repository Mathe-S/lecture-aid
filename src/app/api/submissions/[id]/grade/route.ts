import { updateSubmission } from "@/lib/assignmentService";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { feedback, grade } = await request.json();

    if (typeof grade !== "number") {
      return NextResponse.json(
        { error: "Grade must be a number" },
        { status: 400 }
      );
    }

    const { id } = await params;
    const submission = await updateSubmission(id, {
      feedback,
      grade,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error updating submission grade:", error);
    return NextResponse.json(
      { error: "Failed to update submission grade" },
      { status: 500 }
    );
  }
}
