import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import db from "@/db";
import { assignmentSubmissions, profiles } from "@/db/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; studentId: string }> }
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

    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      !userRole ||
      (userRole.role !== "admin" && userRole.role !== "lecturer")
    ) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    // 2. Parse Request Data
    const { id: assignmentId, studentId: studentEmail } = await params; // studentId from route is the email
    const { gradesData } = await request.json();

    // 3. Validate Input
    if (
      !gradesData ||
      !gradesData.students ||
      !Array.isArray(gradesData.students)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid grades data format: 'students' array missing or invalid.",
        },
        { status: 400 }
      );
    }

    // Find the specific student's data in the JSON based on the email from the route parameter
    const studentGradeInfo = gradesData.students.find(
      (s: any) => s.studentId === studentEmail
    );

    if (!studentGradeInfo) {
      return NextResponse.json(
        {
          error: `Student with email ${studentEmail} not found in the provided JSON data.`,
        },
        { status: 404 }
      );
    }

    // Check for either totalPoints or points to be available
    const hasValidGrade =
      typeof studentGradeInfo.totalPoints === "number" ||
      typeof studentGradeInfo.points === "number";

    if (!studentGradeInfo.studentId || !hasValidGrade) {
      return NextResponse.json(
        { error: "Invalid grade data for the specified student in JSON." },
        { status: 400 }
      );
    }

    // Use totalPoints if available, otherwise fall back to points
    const gradeValue =
      typeof studentGradeInfo.totalPoints === "number"
        ? studentGradeInfo.totalPoints
        : studentGradeInfo.points;

    // 4. Database Operations
    // Find the profile with the matching email
    const [profileRecord] = await db
      .select({ id: profiles.id }) // Select only the ID
      .from(profiles)
      .where(eq(profiles.email, studentEmail));

    if (!profileRecord) {
      return NextResponse.json(
        { error: `Profile not found for student email: ${studentEmail}` },
        { status: 404 }
      );
    }

    // Find the submission for this student and assignment
    const [submissionResult] = await db
      .select({ id: assignmentSubmissions.id }) // Select only the ID
      .from(assignmentSubmissions)
      .where(
        and(
          eq(assignmentSubmissions.assignmentId, assignmentId),
          eq(assignmentSubmissions.userId, profileRecord.id)
        )
      );

    if (!submissionResult) {
      return NextResponse.json(
        {
          error: `No submission found for student ${studentEmail} in assignment ${assignmentId}`,
        },
        { status: 404 }
      );
    }

    // 5. Prepare Feedback
    let feedback = "";
    if (studentGradeInfo.notes && Array.isArray(studentGradeInfo.notes)) {
      feedback = studentGradeInfo.notes.join("\n");
    }
    if (studentGradeInfo.similarityInfo) {
      feedback += `\n\nSimilarity: ${studentGradeInfo.similarityInfo.similarity}% match with ${studentGradeInfo.similarityInfo.otherStudent}`;
    }
    // Add any other fields as JSON
    const otherFields = { ...studentGradeInfo };
    delete otherFields.studentId;
    delete otherFields.points;
    delete otherFields.totalPoints;
    delete otherFields.notes;
    delete otherFields.similarityInfo;
    if (Object.keys(otherFields).length > 0) {
      feedback += `\n\nAdditional Information:\n${JSON.stringify(
        otherFields,
        null,
        2
      )}`;
    }

    // 6. Update Submission
    await db
      .update(assignmentSubmissions)
      .set({
        grade: gradeValue,
        feedback: feedback || null, // Ensure feedback is null if empty
        updatedAt: new Date().toISOString(),
      })
      .where(eq(assignmentSubmissions.id, submissionResult.id));

    // 7. Return Success Response
    return NextResponse.json({
      success: true,
      message: `Successfully graded submission for student ${studentEmail}.`,
    });
  } catch (error) {
    console.error("Error uploading single student grade:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to upload grade for student", details: errorMessage },
      { status: 500 }
    );
  }
}
