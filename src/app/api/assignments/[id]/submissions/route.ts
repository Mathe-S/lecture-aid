import {
  getSubmissionsByAssignment,
  createSubmission,
  getSubmissionByUserAndAssignment,
  updateSubmission,
  getAssignmentById,
} from "@/lib/assignmentService";
import { NextRequest, NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server"; // Import Supabase server client

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
    // 1. Authentication and Authorization
    const supabase = await supabaseForServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // We need the user's role to determine if they can submit for others or bypass closure
    const { data: userRoleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = userRoleData?.role;
    const canSubmitForOthers = userRole === "admin" || userRole === "lecturer";

    // 2. Parse Request Data
    const submissionData = await request.json();
    const { id: assignmentId } = await params;

    // Validate required fields in the request body
    if (!submissionData.userId) {
      return NextResponse.json(
        { error: "Target User ID (userId) is required in the request body" },
        { status: 400 }
      );
    }
    if (!submissionData.repositoryUrl || !submissionData.repositoryName) {
      return NextResponse.json(
        { error: "Repository URL and Name are required" },
        { status: 400 }
      );
    }

    // 3. Permission Check: Ensure only admins/lecturers submit for *other* users
    if (submissionData.userId !== user.id && !canSubmitForOthers) {
      return NextResponse.json(
        { error: "Forbidden: You can only submit for yourself." },
        { status: 403 }
      );
    }

    // 4. Check Assignment Status
    const assignment = await getAssignmentById(assignmentId);
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check if the assignment is closed
    // Bypass this check ONLY if the user is an admin or lecturer
    if (assignment.closed && !canSubmitForOthers) {
      return NextResponse.json(
        {
          error:
            "This assignment is closed and no longer accepting submissions.",
        },
        { status: 403 }
      );
    }

    // 5. Check for Existing Submission
    const existingSubmission = await getSubmissionByUserAndAssignment(
      assignmentId,
      submissionData.userId // Use the userId from the request body
    );

    let submission;
    // Define the payload with explicit types expected by update/create functions
    const submissionPayload: {
      repositoryUrl: string;
      repositoryName: string | null;
    } = {
      repositoryUrl: submissionData.repositoryUrl,
      repositoryName: submissionData.repositoryName ?? null, // Ensure repositoryName is string or null
      // Important: We deliberately DON'T include grade/feedback here.
      // 'submittedAt' and 'updatedAt' are handled by the service/database.
    };

    if (existingSubmission) {
      // Update existing submission
      submission = await updateSubmission(
        existingSubmission.id,
        submissionPayload
      );
    } else {
      // Create new submission
      // The createSubmission function likely needs userId and assignmentId separately
      submission = await createSubmission({
        ...submissionPayload, // Spread the validated payload
        userId: submissionData.userId, // Use the target userId (already validated)
        assignmentId: assignmentId,
        // Explicitly set other non-provided fields expected by createSubmission
        grade: null,
        feedback: null,
        // submittedAt and updatedAt should be handled by the service/DB
      });
    }

    // 6. Return Response
    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error handling submission:", error);

    // Refined type check for unique constraint violation
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505" && // PostgreSQL unique violation code
      "constraint_name" in error && // Check if constraint_name exists
      typeof (error as any).constraint_name === "string" &&
      (error as any).constraint_name.includes("_user_id_assignment_id_key") // Access safely
    ) {
      // This error shouldn't ideally happen with the update logic, but handle defensively.
      return NextResponse.json(
        {
          error:
            "A submission for this user and assignment already exists. Update logic failed or race condition occurred.",
        },
        { status: 409 } // Use 409 Conflict
      );
    }

    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}
