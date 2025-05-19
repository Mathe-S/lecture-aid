import { NextRequest, NextResponse } from "next/server";
import {
  getSubmissionsByAssignment,
  SubmissionWithDetails,
} from "@/lib/assignmentService";
import { supabaseForServer } from "@/utils/supabase/server";
import { userRoles, AssignmentCustomField } from "@/db/drizzle/schema";
import db from "@/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and authorize the user
    const supabase = await supabaseForServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is admin or lecturer
    const userRole = await db.query.userRoles.findFirst({
      where: eq(userRoles.id, user.id),
    });

    if (
      !userRole ||
      (userRole.role !== "admin" && userRole.role !== "lecturer")
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const submissions: SubmissionWithDetails[] =
      await getSubmissionsByAssignment(id);

    if (!submissions.length) {
      // If there are no submissions, or assignment wasn't found by getSubmissionsByAssignment
      // We might want to return an empty CSV or a message.
      // For now, let's return an empty CSV with default headers if no assignment info is available.
      const emptyCsvHeaders = [
        "Student Name",
        "Email",
        "GitHub URL",
        "Repository Name",
        "Submitted At",
        "Grade",
      ];
      const emptyCsvString = emptyCsvHeaders.join(",");
      const emptyBlob = new Blob([emptyCsvString], {
        type: "text/csv;charset=utf-8;",
      });
      const emptyResponse = new NextResponse(emptyBlob);
      emptyResponse.headers.set("Content-Type", "text/csv");
      emptyResponse.headers.set(
        "Content-Disposition",
        `attachment; filename="assignment_submissions_${id}_empty.csv"`
      );
      return emptyResponse;
    }

    // Assuming all submissions belong to the same assignment, get custom field definitions from the first one.
    // getSubmissionsByAssignment ensures assignment.customFields is populated.
    const customFieldDefinitions: AssignmentCustomField[] =
      submissions[0].assignment.customFields || [];

    // Define base headers
    const baseHeaders = [
      "Student Name",
      "Email",
      "GitHub URL",
      "Repository Name",
      "Submitted At",
      "Grade",
    ];

    // Add custom field labels to headers
    const customFieldHeaders = customFieldDefinitions.map(
      (cf) => cf.label || "Unnamed Custom Field"
    );
    const allHeaders = [...baseHeaders, ...customFieldHeaders];

    // Format data for CSV
    const csvData = submissions.map((submission) => {
      const row: { [key: string]: string | number | null } = {
        "Student Name": submission.profile?.fullName || "Unknown",
        Email: submission.profile?.email || "Unknown",
        "GitHub URL": submission.repositoryUrl || "Not submitted",
        "Repository Name": submission.repositoryName || "Not submitted",
        "Submitted At": submission.submittedAt
          ? new Date(submission.submittedAt).toLocaleString()
          : "Not submitted",
        Grade: submission.grade !== null ? submission.grade : "Not graded",
      };

      // Add custom field answers
      customFieldDefinitions.forEach((cfDefinition) => {
        const answer = submission.customAnswers.find(
          (ca) => ca.custom_field_id === cfDefinition.id
        );
        row[cfDefinition.label || "Unnamed Custom Field"] = answer
          ? answer.value
          : ""; // Use empty string for unanswered
      });
      return row;
    });

    // Convert to CSV string
    const csvString = [
      allHeaders.join(","),
      ...csvData.map((row) =>
        allHeaders
          .map(
            (header) =>
              `"${String(
                row[header] === null || row[header] === undefined
                  ? ""
                  : row[header]
              ).replace(/"/g, '""')}"`
          )
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const response = new NextResponse(blob);
    response.headers.set("Content-Type", "text/csv");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="assignment_submissions_${id}.csv"`
    );

    return response;
  } catch (error) {
    console.error("Error downloading submissions:", error);
    // It's good practice to check if error is an instance of Error
    let errorMessage = "Failed to download submissions";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
