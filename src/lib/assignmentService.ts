import { and, eq } from "drizzle-orm";
import db from "@/db";
import {
  assignments,
  assignmentSubmissions,
  Assignment,
  AssignmentSubmission,
  assignmentCustomFields,
  AssignmentWithCustomFields,
  assignmentSubmissionCustomValues,
  AssignmentSubmissionCustomValue,
  Profile,
} from "@/db/drizzle/schema";

export async function getAssignments() {
  return await db.query.assignments.findMany({
    orderBy: (assignments, { desc }) => [desc(assignments.created_at)],
  });
}

export async function getAssignmentById(
  id: string
): Promise<AssignmentWithCustomFields | undefined> {
  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, id),
  });

  if (!assignment) {
    return undefined;
  }

  const customFields = await db.query.assignmentCustomFields.findMany({
    where: eq(assignmentCustomFields.assignment_id, id),
    orderBy: (fields, { asc }) => [asc(fields.order)],
  });

  return {
    ...assignment,
    customFields: customFields || [],
  };
}

export async function createAssignment(
  assignmentData: Omit<Assignment, "id" | "created_at" | "updatedAt"> & {
    customFields?: Array<{ label: string }>;
  }
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

  if (assignment && assignmentData.customFields) {
    for (const [index, customField] of assignmentData.customFields.entries()) {
      if (customField.label.trim() !== "") {
        await db.insert(assignmentCustomFields).values({
          assignment_id: assignment.id,
          label: customField.label,
          order: index,
          is_required: false,
        });
      }
    }
  }

  return assignment;
}

export async function updateAssignment(
  id: string,
  assignmentData: Partial<Assignment> & {
    customFields?: Array<{ label: string }>;
  }
) {
  await db
    .delete(assignmentCustomFields)
    .where(eq(assignmentCustomFields.assignment_id, id));

  if (assignmentData.customFields) {
    for (const [index, customField] of assignmentData.customFields.entries()) {
      if (customField.label.trim() !== "") {
        await db.insert(assignmentCustomFields).values({
          assignment_id: id,
          label: customField.label,
          order: index,
          is_required: false,
        });
      }
    }
  }

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

export async function getSubmissionById(id: string): Promise<
  | (AssignmentSubmission & {
      profile: Profile | null;
      assignment: AssignmentWithCustomFields;
      customAnswers: AssignmentSubmissionCustomValue[];
    })
  | null
> {
  const submissionData = await db.query.assignmentSubmissions.findFirst({
    where: eq(assignmentSubmissions.id, id),
    with: {
      profile: true,
      assignment: true,
    },
  });

  if (!submissionData) {
    return null;
  }

  let populatedAssignment: AssignmentWithCustomFields | undefined;
  if (submissionData.assignment) {
    const customFieldDefinitions =
      await db.query.assignmentCustomFields.findMany({
        where: eq(
          assignmentCustomFields.assignment_id,
          submissionData.assignment.id
        ),
        orderBy: (fields, { asc }) => [asc(fields.order)],
      });
    populatedAssignment = {
      ...submissionData.assignment,
      customFields: customFieldDefinitions || [],
    };
  }

  const customAnswers =
    await db.query.assignmentSubmissionCustomValues.findMany({
      where: eq(
        assignmentSubmissionCustomValues.submission_id,
        submissionData.id
      ),
    });

  return {
    ...submissionData,
    profile: submissionData.profile || null,
    assignment: populatedAssignment!,
    customAnswers: customAnswers || [],
  };
}

export async function createSubmission(
  submissionData: Omit<
    AssignmentSubmission,
    "id" | "submittedAt" | "updatedAt"
  > & {
    customAnswers?: Array<{ customFieldId: string; value: string }>;
  }
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

  if (
    submission &&
    submissionData.customAnswers &&
    submissionData.customAnswers.length > 0
  ) {
    await db
      .delete(assignmentSubmissionCustomValues)
      .where(eq(assignmentSubmissionCustomValues.submission_id, submission.id));

    for (const answer of submissionData.customAnswers) {
      if (answer.value.trim() !== "") {
        await db.insert(assignmentSubmissionCustomValues).values({
          submission_id: submission.id,
          custom_field_id: answer.customFieldId,
          value: answer.value,
        });
      }
    }
  }

  return submission;
}

export async function updateSubmission(
  id: string,
  submissionData: Partial<
    Omit<
      AssignmentSubmission,
      "id" | "submittedAt" | "updatedAt" | "feedback" | "grade"
    >
  >,
  customAnswers?: Array<{ customFieldId: string; value: string }>
) {
  const [updatedMainSubmission] = await db
    .update(assignmentSubmissions)
    .set({
      repositoryUrl: submissionData.repositoryUrl,
      repositoryName: submissionData.repositoryName,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(assignmentSubmissions.id, id))
    .returning();

  if (updatedMainSubmission) {
    await db
      .delete(assignmentSubmissionCustomValues)
      .where(eq(assignmentSubmissionCustomValues.submission_id, id));

    if (customAnswers && customAnswers.length > 0) {
      for (const answer of customAnswers) {
        if (answer.value.trim() !== "") {
          await db.insert(assignmentSubmissionCustomValues).values({
            submission_id: id,
            custom_field_id: answer.customFieldId,
            value: answer.value,
          });
        }
      }
    }
  }

  return updatedMainSubmission;
}

export async function setGradeAndFeedback(
  submissionId: string,
  feedback: string | null, // Allow null feedback
  grade: number | null // Allow null grade (e.g., if clearing a grade)
) {
  const [gradedSubmission] = await db
    .update(assignmentSubmissions)
    .set({
      feedback: feedback,
      grade: grade,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(assignmentSubmissions.id, submissionId))
    .returning();

  return gradedSubmission;
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
): Promise<
  | (AssignmentSubmission & {
      profile: Profile | null;
      assignment: AssignmentWithCustomFields | null;
      customAnswers: AssignmentSubmissionCustomValue[];
    })
  | null
> {
  const submission = await db.query.assignmentSubmissions.findFirst({
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

  if (!submission) {
    return null;
  }

  let populatedAssignmentForUser: AssignmentWithCustomFields | undefined;
  if (submission.assignment) {
    const cfDefs = await db.query.assignmentCustomFields.findMany({
      where: eq(assignmentCustomFields.assignment_id, submission.assignment.id),
      orderBy: (f, { asc }) => [asc(f.order)],
    });
    populatedAssignmentForUser = {
      ...submission.assignment,
      customFields: cfDefs || [],
    };
  }

  const customAnswersForUser =
    await db.query.assignmentSubmissionCustomValues.findMany({
      where: eq(assignmentSubmissionCustomValues.submission_id, submission.id),
    });

  return {
    ...submission,
    profile: submission.profile || null,
    assignment: populatedAssignmentForUser || null,
    customAnswers: customAnswersForUser || [],
  };
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
