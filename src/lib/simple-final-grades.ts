import { db } from "@/db";
import {
  finalTaskGrades,
  finalTasks,
  finalEvaluations,
  finalGroupMembers,
  type FinalEvaluation,
  type NewFinalEvaluation,
} from "@/db/drizzle/final-schema";
import { eq, and, sql } from "drizzle-orm";

// Simple grade summary for a student
export interface StudentGradeSummary {
  studentId: string;
  groupId: string;
  totalPoints: number;
  gradedTaskCount: number;
  taskGrades: Array<{
    taskId: string;
    taskTitle: string;
    points: number;
    feedback: string | null;
    gradedAt: string;
  }>;
}

/**
 * Get a student's grade summary by adding up all their task points
 */
export async function getStudentGradeSummary(
  studentId: string,
  groupId: string
): Promise<StudentGradeSummary | null> {
  // Get all graded tasks for this student in this group
  const gradedTasks = await db
    .select({
      taskId: finalTaskGrades.taskId,
      taskTitle: finalTasks.title,
      points: finalTaskGrades.points,

      feedback: finalTaskGrades.feedback,
      gradedAt: finalTaskGrades.gradedAt,
    })
    .from(finalTaskGrades)
    .innerJoin(finalTasks, eq(finalTaskGrades.taskId, finalTasks.id))
    .where(
      and(
        eq(finalTaskGrades.studentId, studentId),
        eq(finalTasks.groupId, groupId)
      )
    );

  if (gradedTasks.length === 0) {
    return null;
  }

  // Simple addition of all points
  const totalPoints = gradedTasks.reduce((sum, task) => sum + task.points, 0);

  return {
    studentId,
    groupId,
    totalPoints,
    gradedTaskCount: gradedTasks.length,
    taskGrades: gradedTasks.map((task) => ({
      taskId: task.taskId,
      taskTitle: task.taskTitle,
      points: task.points,
      feedback: task.feedback,
      gradedAt: task.gradedAt,
    })),
  };
}

/**
 * Update or create final evaluation with simple totals
 */
export async function updateStudentFinalGrade(
  studentId: string,
  groupId: string,
  overallFeedback?: string
): Promise<FinalEvaluation> {
  // Verify student is in the group
  const membership = await db.query.finalGroupMembers.findFirst({
    where: and(
      eq(finalGroupMembers.groupId, groupId),
      eq(finalGroupMembers.userId, studentId)
    ),
  });

  if (!membership) {
    throw new Error("Student is not a member of this group");
  }

  // Get grade summary
  const gradeSummary = await getStudentGradeSummary(studentId, groupId);

  if (!gradeSummary) {
    throw new Error("No graded tasks found for this student");
  }

  // Check if evaluation exists
  const existingEvaluation = await db.query.finalEvaluations.findFirst({
    where: and(
      eq(finalEvaluations.userId, studentId),
      eq(finalEvaluations.groupId, groupId)
    ),
  });

  const evaluationData = {
    totalPoints: gradeSummary.totalPoints,
    overallFeedback: overallFeedback || null,
    updatedAt: sql`timezone('utc'::text, now())`,
  };

  if (existingEvaluation) {
    // Update existing evaluation
    const [updatedEvaluation] = await db
      .update(finalEvaluations)
      .set(evaluationData)
      .where(eq(finalEvaluations.id, existingEvaluation.id))
      .returning();

    return updatedEvaluation;
  } else {
    // Create new evaluation
    const newEvaluationData: NewFinalEvaluation = {
      groupId,
      userId: studentId,
      totalPoints: gradeSummary.totalPoints,
      overallFeedback: overallFeedback || null,
    };

    const [newEvaluation] = await db
      .insert(finalEvaluations)
      .values(newEvaluationData)
      .returning();

    return newEvaluation;
  }
}

/**
 * Get all students' final grades for a group
 */
export async function getGroupFinalGrades(
  groupId: string
): Promise<
  Array<StudentGradeSummary & { studentName: string; studentEmail: string }>
> {
  // Get all group members
  const members = await db.query.finalGroupMembers.findMany({
    where: eq(finalGroupMembers.groupId, groupId),
    with: {
      user: {
        columns: {
          id: true,
          email: true,
          fullName: true,
        },
      },
    },
  });

  const finalGrades = [];

  for (const member of members) {
    const gradeSummary = await getStudentGradeSummary(member.userId, groupId);

    if (gradeSummary) {
      finalGrades.push({
        ...gradeSummary,
        studentName: member.user.fullName || member.user.email || "Unknown",
        studentEmail: member.user.email || "",
      });
    }
  }

  return finalGrades;
}

/**
 * Recalculate all final grades (run after grading tasks)
 */
export async function recalculateAllFinalGrades(): Promise<void> {
  // Get all existing evaluations
  const evaluations = await db.query.finalEvaluations.findMany();

  for (const evaluation of evaluations) {
    try {
      await updateStudentFinalGrade(
        evaluation.userId,
        evaluation.groupId,
        evaluation.overallFeedback || undefined
      );
    } catch (error) {
      console.error(
        `Failed to recalculate grade for student ${evaluation.userId}:`,
        error
      );
    }
  }
}

/**
 * Get simple grade statistics
 */
export async function getSimpleGradeStats(): Promise<{
  totalStudents: number;
  studentsWithGrades: number;
  averagePoints: number;
  totalPointsAwarded: number;
}> {
  const evaluations = await db.query.finalEvaluations.findMany();

  const totalStudents = await db
    .select({ count: sql<number>`count(*)` })
    .from(finalGroupMembers)
    .then((result) => result[0]?.count || 0);

  const studentsWithGrades = evaluations.length;

  const totalPointsAwarded = evaluations.reduce(
    (sum, e) => sum + e.totalPoints,
    0
  );

  const averagePoints =
    studentsWithGrades > 0
      ? Math.round(totalPointsAwarded / studentsWithGrades)
      : 0;

  return {
    totalStudents,
    studentsWithGrades,
    averagePoints,
    totalPointsAwarded,
  };
}
