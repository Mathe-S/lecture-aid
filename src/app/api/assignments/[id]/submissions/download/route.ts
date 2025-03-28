import { NextRequest, NextResponse } from "next/server";
import { getSubmissionsByAssignment } from "@/lib/assignmentService";
import { supabaseForServer } from "@/utils/supabase/server";
import { userRoles } from "@/db/drizzle/schema";
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
    const submissions = await getSubmissionsByAssignment(id);

    // Format data for CSV
    const csvData = submissions.map((submission) => ({
      studentName: submission.profile?.fullName || "Unknown",
      studentEmail: submission.profile?.email || "Unknown",
      githubUrl: submission.repositoryUrl || "Not submitted",
      repositoryName: submission.repositoryName || "Not submitted",
      submittedAt: submission.submittedAt
        ? new Date(submission.submittedAt).toLocaleString()
        : "Not submitted",
      grade: submission.grade !== null ? submission.grade : "Not graded",
    }));

    // Convert to CSV string
    const headers = [
      "Student Name",
      "Email",
      "GitHub URL",
      "Repository Name",
      "Submitted At",
      "Grade",
    ];
    const csvString = [
      headers.join(","),
      ...csvData.map((row) =>
        [
          `"${row.studentName}"`,
          `"${row.studentEmail}"`,
          `"${row.githubUrl}"`,
          `"${row.repositoryName}"`,
          `"${row.submittedAt}"`,
          `"${row.grade}"`,
        ].join(",")
      ),
    ].join("\n");

    // Create a Blob containing the CSV data
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

    // Create the response with the appropriate headers
    const response = new NextResponse(blob);
    response.headers.set("Content-Type", "text/csv");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="assignment_submissions_${id}.csv"`
    );

    return response;
  } catch (error) {
    console.error("Error downloading submissions:", error);
    return NextResponse.json(
      { error: "Failed to download submissions" },
      { status: 500 }
    );
  }
}
