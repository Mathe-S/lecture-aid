import { NextResponse } from "next/server";
import { supabaseForServer } from "@/utils/supabase/server";
import db from "@/db";
import { assignmentSubmissions, profiles } from "@/db/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the current user from the auth context
    const supabase = await supabaseForServer();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the user is an admin or lecturer
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("id", session.user.id)
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

    const { id } = await params;
    const { gradesData } = await request.json();

    if (
      !gradesData ||
      !gradesData.students ||
      !Array.isArray(gradesData.students)
    ) {
      return NextResponse.json(
        { error: "Invalid grades data format" },
        { status: 400 }
      );
    }

    const results = {
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process each student in the grades data
    for (const student of gradesData.students) {
      if (!student.studentId || typeof student.points !== "number") {
        results.skipped++;
        results.errors.push(`Invalid student data: ${JSON.stringify(student)}`);
        continue;
      }

      try {
        // Find the profile with the matching email
        const [profileRecord] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.email, student.studentId));

        if (!profileRecord) {
          results.skipped++;
          results.errors.push(`Student not found: ${student.studentId}`);
          continue;
        }

        // Find the submission for this student
        const [submissionResult] = await db
          .select()
          .from(assignmentSubmissions)
          .where(
            and(
              eq(assignmentSubmissions.assignmentId, id),
              eq(assignmentSubmissions.userId, profileRecord.id)
            )
          );

        if (!submissionResult) {
          results.skipped++;
          results.errors.push(
            `No submission found for student: ${student.studentId}`
          );
          continue;
        }

        // Prepare feedback from notes
        let feedback = "";
        if (student.notes && Array.isArray(student.notes)) {
          feedback = student.notes.join("\n");
        }

        // Add similarity info if available
        if (student.similarityInfo) {
          feedback += `\n\nSimilarity: ${student.similarityInfo.similarity}% match with ${student.similarityInfo.otherStudent}`;
        }

        // Add any other fields as JSON
        const otherFields = { ...student };
        delete otherFields.studentId;
        delete otherFields.points;
        delete otherFields.notes;
        delete otherFields.similarityInfo;

        if (Object.keys(otherFields).length > 0) {
          feedback += `\n\nAdditional Information:\n${JSON.stringify(
            otherFields,
            null,
            2
          )}`;
        }

        // Update the submission with the grade and feedback
        await db
          .update(assignmentSubmissions)
          .set({
            grade: student.points,
            feedback: feedback,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(assignmentSubmissions.id, submissionResult.id));

        results.successful++;
      } catch (error) {
        console.error(`Error processing student ${student.studentId}:`, error);
        results.failed++;
        results.errors.push(
          `Error processing ${student.studentId}: ${(error as Error).message}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${
        results.successful + results.failed + results.skipped
      } students. ${results.successful} updated, ${results.failed} failed, ${
        results.skipped
      } skipped.`,
      results,
    });
  } catch (error) {
    console.error("Error uploading grades:", error);
    return NextResponse.json(
      { error: "Failed to upload grades" },
      { status: 500 }
    );
  }
}
