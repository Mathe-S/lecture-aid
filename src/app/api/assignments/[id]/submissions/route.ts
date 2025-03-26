import {
  getSubmissionsByAssignment,
  createSubmission,
  getSubmissionByUserAndAssignment,
  updateSubmission,
} from "@/lib/assignmentService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const submissions = await getSubmissionsByAssignment(id);
    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const submissionData = await request.json();
    const { id } = await params;

    if (!submissionData.userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if submission already exists
    const existingSubmission = await getSubmissionByUserAndAssignment(
      id,
      submissionData.userId
    );

    let submission;
    if (existingSubmission) {
      // Update existing submission
      submission = await updateSubmission(existingSubmission.id, {
        repositoryUrl: submissionData.repositoryUrl,
        repositoryName: submissionData.repositoryName,
      });
    } else {
      // Create new submission
      submission = await createSubmission({
        ...submissionData,
        assignmentId: id,
      });
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error handling submission:", error);

    // TypeScript-safe check for PostgreSQL error
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505" &&
      "constraint_name" in error &&
      error.constraint_name ===
        "assignment_submissions_user_id_assignment_id_key"
    ) {
      return NextResponse.json(
        {
          error:
            "You have already submitted this assignment. Please refresh the page to see your current submission.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}
