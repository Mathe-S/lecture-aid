import { and, eq } from "drizzle-orm";
import db from "@/db";
import {
  assignments,
  assignmentSubmissions,
  Assignment,
  AssignmentSubmission,
} from "@/db/drizzle/schema";

export async function getAssignments() {
  return await db.query.assignments.findMany({
    orderBy: (assignments, { desc }) => [desc(assignments.created_at)],
  });
}

export async function getAssignmentById(id: string) {
  return await db.query.assignments.findFirst({
    where: eq(assignments.id, id),
  });
}

export async function createAssignment(
  assignmentData: Omit<Assignment, "id" | "created_at" | "updatedAt">
) {
  const [assignment] = await db
    .insert(assignments)
    .values({
      title: assignmentData.title,
      description: assignmentData.description,
      due_date: assignmentData.due_date,
      created_by: assignmentData.created_by,
      grade: assignmentData.grade,
    })
    .returning();

  return assignment;
}

export async function updateAssignment(
  id: string,
  assignmentData: Partial<Assignment>
) {
  const [assignment] = await db
    .update(assignments)
    .set({
      title: assignmentData.title,
      description: assignmentData.description,
      due_date: assignmentData.due_date,
      grade: assignmentData.grade,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(assignments.id, id))
    .returning();

  return assignment;
}

export async function deleteAssignment(id: string) {
  await db.delete(assignments).where(eq(assignments.id, id));
  return true;
}

export async function getSubmissionsByAssignment(assignmentId: string) {
  return await db.query.assignmentSubmissions.findMany({
    where: eq(assignmentSubmissions.assignmentId, assignmentId),
    orderBy: (submissions, { desc }) => [desc(submissions.submittedAt)],
    with: {
      profile: true,
      assignment: true,
    },
  });
}

export async function getSubmissionById(id: string) {
  return await db.query.assignmentSubmissions.findFirst({
    where: eq(assignmentSubmissions.id, id),
    with: {
      profile: true,
      assignment: true,
    },
  });
}

export async function createSubmission(
  submissionData: Omit<AssignmentSubmission, "id" | "submittedAt" | "updatedAt">
) {
  const [submission] = await db
    .insert(assignmentSubmissions)
    .values({
      assignmentId: submissionData.assignmentId,
      userId: submissionData.userId,
      repositoryUrl: submissionData.repositoryUrl,
      repositoryName: submissionData.repositoryName,
      feedback: submissionData.feedback,
      grade: submissionData.grade,
    })
    .onConflictDoUpdate({
      target: [
        assignmentSubmissions.userId,
        assignmentSubmissions.assignmentId,
      ],
      set: {
        repositoryUrl: submissionData.repositoryUrl,
        repositoryName: submissionData.repositoryName,
        updatedAt: new Date().toISOString(),
      },
    })
    .returning();

  return submission;
}

export async function updateSubmission(
  id: string,
  submissionData: Partial<AssignmentSubmission>
) {
  const [submission] = await db
    .update(assignmentSubmissions)
    .set({
      repositoryUrl: submissionData.repositoryUrl,
      repositoryName: submissionData.repositoryName,
      feedback: submissionData.feedback,
      grade: submissionData.grade,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(assignmentSubmissions.id, id))
    .returning();

  return submission;
}

export async function deleteSubmission(id: string) {
  await db
    .delete(assignmentSubmissions)
    .where(eq(assignmentSubmissions.id, id));
  return true;
}

export async function getSubmissionByUserAndAssignment(
  assignmentId: string,
  userId: string
) {
  return await db.query.assignmentSubmissions.findFirst({
    where: (submissions) =>
      and(
        eq(submissions.assignmentId, assignmentId),
        eq(submissions.userId, userId)
      ),
    with: {
      profile: true,
      assignment: true,
    },
  });
}

export async function getSubmissionsByUser(userId: string) {
  return await db.query.assignmentSubmissions.findMany({
    where: eq(assignmentSubmissions.userId, userId),
    orderBy: (submissions, { desc }) => [desc(submissions.submittedAt)],
    with: {
      profile: true,
      assignment: true,
    },
  });
}
