import { db } from "@/db";
import {
  finalTaskGrades,
  finalTasks,
  finalTaskAssignees,
  feedbackTemplates,
  type FinalTaskGrade,
  type FeedbackTemplate,
  type NewFeedbackTemplate,
} from "@/db/drizzle/final-schema";
import { profiles } from "@/db/drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

// Types for grading
export interface TaskGradeWithDetails extends FinalTaskGrade {
  task: {
    id: string;
    title: string;
    description: string | null;
    commitLink: string | null;
    mergeRequestLink: string | null;
    status: string;
    priority: string;
    dueDate: string | null;
    groupId: string;
  };
  student: {
    id: string;
    fullName: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  grader: {
    id: string;
    fullName: string | null;
    email: string | null;
  } | null;
}

export interface TaskForGrading {
  id: string;
  title: string;
  description: string | null;
  commitLink: string | null;
  mergeRequestLink: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  estimatedHours: number | null;
  groupId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    fullName: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  assignees: {
    id: string;
    userId: string;
    user: {
      id: string;
      fullName: string | null;
      email: string | null;
      avatarUrl: string | null;
    };
  }[];
  grades: TaskGradeWithDetails[];
}

export interface GradeTaskPayload {
  taskId: string;
  studentId: string;
  graderId: string;
  points: number;
  maxPoints: number;
  feedback?: string;
}

export interface UpdateGradePayload {
  points: number;
  maxPoints: number;
  feedback?: string;
}

// Task Grading Functions
export async function getTasksForGrading(
  groupId?: string
): Promise<TaskForGrading[]> {
  // Create aliases for multiple profile joins
  const creatorProfiles = alias(profiles, "creator_profiles");
  const assigneeProfiles = alias(profiles, "assignee_profiles");
  const studentProfiles = alias(profiles, "student_profiles");
  const graderProfiles = alias(profiles, "grader_profiles");

  // Single query to get all data with joins
  const rawData = await db
    .select({
      // Task data
      taskId: finalTasks.id,
      taskTitle: finalTasks.title,
      taskDescription: finalTasks.description,
      taskCommitLink: finalTasks.commitLink,
      taskMergeRequestLink: finalTasks.mergeRequestLink,
      taskStatus: finalTasks.status,
      taskPriority: finalTasks.priority,
      taskDueDate: finalTasks.dueDate,
      taskEstimatedHours: finalTasks.estimatedHours,
      taskGroupId: finalTasks.groupId,
      taskCreatedAt: finalTasks.createdAt,
      taskUpdatedAt: finalTasks.updatedAt,
      taskCreatedById: finalTasks.createdById,

      // Creator data
      creatorId: creatorProfiles.id,
      creatorFullName: creatorProfiles.fullName,
      creatorEmail: creatorProfiles.email,
      creatorAvatarUrl: creatorProfiles.avatarUrl,

      // Assignee data
      assigneeId: finalTaskAssignees.id,
      assigneeUserId: finalTaskAssignees.userId,
      assigneeUserFullName: assigneeProfiles.fullName,
      assigneeUserEmail: assigneeProfiles.email,
      assigneeUserAvatarUrl: assigneeProfiles.avatarUrl,

      // Grade data
      gradeId: finalTaskGrades.id,
      gradeTaskId: finalTaskGrades.taskId,
      gradeStudentId: finalTaskGrades.studentId,
      gradeGraderId: finalTaskGrades.graderId,
      gradePoints: finalTaskGrades.points,
      gradeMaxPoints: finalTaskGrades.maxPoints,
      gradeFeedback: finalTaskGrades.feedback,
      gradeGradedAt: finalTaskGrades.gradedAt,
      gradeUpdatedAt: finalTaskGrades.updatedAt,

      // Student data (for grades)
      studentId: studentProfiles.id,
      studentFullName: studentProfiles.fullName,
      studentEmail: studentProfiles.email,
      studentAvatarUrl: studentProfiles.avatarUrl,

      // Grader data
      graderId: graderProfiles.id,
      graderFullName: graderProfiles.fullName,
      graderEmail: graderProfiles.email,
    })
    .from(finalTasks)
    .leftJoin(creatorProfiles, eq(finalTasks.createdById, creatorProfiles.id))
    .leftJoin(finalTaskAssignees, eq(finalTasks.id, finalTaskAssignees.taskId))
    .leftJoin(
      assigneeProfiles,
      eq(finalTaskAssignees.userId, assigneeProfiles.id)
    )
    .leftJoin(finalTaskGrades, eq(finalTasks.id, finalTaskGrades.taskId))
    .leftJoin(
      studentProfiles,
      eq(finalTaskGrades.studentId, studentProfiles.id)
    )
    .leftJoin(graderProfiles, eq(finalTaskGrades.graderId, graderProfiles.id))
    .where(groupId ? eq(finalTasks.groupId, groupId) : undefined)
    .orderBy(desc(finalTasks.updatedAt));

  // Group the flat data into the expected structure
  const taskMap = new Map<string, TaskForGrading>();

  for (const row of rawData) {
    if (!taskMap.has(row.taskId)) {
      taskMap.set(row.taskId, {
        id: row.taskId,
        title: row.taskTitle,
        description: row.taskDescription,
        commitLink: row.taskCommitLink,
        mergeRequestLink: row.taskMergeRequestLink,
        status: row.taskStatus,
        priority: row.taskPriority,
        dueDate: row.taskDueDate,
        estimatedHours: row.taskEstimatedHours,
        groupId: row.taskGroupId,
        createdAt: row.taskCreatedAt,
        updatedAt: row.taskUpdatedAt,
        createdBy: {
          id: row.creatorId || row.taskCreatedById,
          fullName: row.creatorFullName,
          email: row.creatorEmail,
          avatarUrl: row.creatorAvatarUrl,
        },
        assignees: [],
        grades: [],
      });
    }

    const task = taskMap.get(row.taskId)!;

    // Add assignee if not already added
    if (
      row.assigneeId &&
      row.assigneeUserId &&
      !task.assignees.find((a) => a.id === row.assigneeId)
    ) {
      task.assignees.push({
        id: row.assigneeId,
        userId: row.assigneeUserId,
        user: {
          id: row.assigneeUserId,
          fullName: row.assigneeUserFullName,
          email: row.assigneeUserEmail,
          avatarUrl: row.assigneeUserAvatarUrl,
        },
      });
    }

    // Add grade if not already added
    if (
      row.gradeId &&
      row.gradeTaskId &&
      row.gradeStudentId &&
      row.gradeGraderId &&
      row.gradePoints !== null &&
      row.gradeMaxPoints !== null &&
      row.gradeGradedAt &&
      row.gradeUpdatedAt &&
      row.studentId &&
      !task.grades.find((g) => g.id === row.gradeId)
    ) {
      task.grades.push({
        id: row.gradeId,
        taskId: row.gradeTaskId,
        studentId: row.gradeStudentId,
        graderId: row.gradeGraderId,
        points: row.gradePoints,
        maxPoints: row.gradeMaxPoints,
        feedback: row.gradeFeedback,
        gradedAt: row.gradeGradedAt,
        updatedAt: row.gradeUpdatedAt,
        task: {
          id: row.taskId,
          title: row.taskTitle,
          description: row.taskDescription,
          commitLink: row.taskCommitLink,
          mergeRequestLink: row.taskMergeRequestLink,
          status: row.taskStatus,
          priority: row.taskPriority,
          dueDate: row.taskDueDate,
          groupId: row.taskGroupId,
        },
        student: {
          id: row.studentId,
          fullName: row.studentFullName,
          email: row.studentEmail,
          avatarUrl: row.studentAvatarUrl,
        },
        grader: row.graderId
          ? {
              id: row.graderId,
              fullName: row.graderFullName,
              email: row.graderEmail,
            }
          : null,
      });
    }
  }

  return Array.from(taskMap.values());
}

export async function gradeTask(
  payload: GradeTaskPayload
): Promise<FinalTaskGrade> {
  const [grade] = await db
    .insert(finalTaskGrades)
    .values({
      taskId: payload.taskId,
      studentId: payload.studentId,
      graderId: payload.graderId,
      points: payload.points,
      maxPoints: payload.maxPoints,
      feedback: payload.feedback,
    })
    .returning();

  // Update task status to graded if all assignees are graded
  const assignees = await db
    .select()
    .from(finalTaskAssignees)
    .where(eq(finalTaskAssignees.taskId, payload.taskId));

  const grades = await db
    .select()
    .from(finalTaskGrades)
    .where(eq(finalTaskGrades.taskId, payload.taskId));

  if (assignees.length === grades.length) {
    await db
      .update(finalTasks)
      .set({ status: "graded" })
      .where(eq(finalTasks.id, payload.taskId));
  }

  return grade;
}

export async function updateTaskGrade(
  gradeId: string,
  payload: UpdateGradePayload
): Promise<FinalTaskGrade> {
  const [updatedGrade] = await db
    .update(finalTaskGrades)
    .set({
      points: payload.points,
      maxPoints: payload.maxPoints,
      feedback: payload.feedback,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(finalTaskGrades.id, gradeId))
    .returning();

  return updatedGrade;
}

export async function getTaskGrade(
  taskId: string,
  studentId: string
): Promise<TaskGradeWithDetails | null> {
  const studentProfiles = alias(profiles, "student_profiles");
  const graderProfiles = alias(profiles, "grader_profiles");

  const [grade] = await db
    .select({
      id: finalTaskGrades.id,
      taskId: finalTaskGrades.taskId,
      studentId: finalTaskGrades.studentId,
      graderId: finalTaskGrades.graderId,
      points: finalTaskGrades.points,
      maxPoints: finalTaskGrades.maxPoints,
      feedback: finalTaskGrades.feedback,
      gradedAt: finalTaskGrades.gradedAt,
      updatedAt: finalTaskGrades.updatedAt,
      task: {
        id: finalTasks.id,
        title: finalTasks.title,
        description: finalTasks.description,
        commitLink: finalTasks.commitLink,
        mergeRequestLink: finalTasks.mergeRequestLink,
        status: finalTasks.status,
        priority: finalTasks.priority,
        dueDate: finalTasks.dueDate,
        groupId: finalTasks.groupId,
      },
      student: {
        id: studentProfiles.id,
        fullName: studentProfiles.fullName,
        email: studentProfiles.email,
        avatarUrl: studentProfiles.avatarUrl,
      },
      grader: {
        id: graderProfiles.id,
        fullName: graderProfiles.fullName,
        email: graderProfiles.email,
      },
    })
    .from(finalTaskGrades)
    .innerJoin(finalTasks, eq(finalTaskGrades.taskId, finalTasks.id))
    .innerJoin(
      studentProfiles,
      eq(finalTaskGrades.studentId, studentProfiles.id)
    )
    .leftJoin(graderProfiles, eq(finalTaskGrades.graderId, graderProfiles.id))
    .where(
      and(
        eq(finalTaskGrades.taskId, taskId),
        eq(finalTaskGrades.studentId, studentId)
      )
    );

  return grade || null;
}

// Feedback Template Functions
export async function getFeedbackTemplates(): Promise<FeedbackTemplate[]> {
  return await db
    .select()
    .from(feedbackTemplates)
    .orderBy(asc(feedbackTemplates.category), asc(feedbackTemplates.name));
}

export async function createFeedbackTemplate(
  payload: NewFeedbackTemplate
): Promise<FeedbackTemplate> {
  const [template] = await db
    .insert(feedbackTemplates)
    .values(payload)
    .returning();

  return template;
}

export async function updateFeedbackTemplate(
  templateId: string,
  payload: Partial<NewFeedbackTemplate>
): Promise<FeedbackTemplate> {
  const [updatedTemplate] = await db
    .update(feedbackTemplates)
    .set({
      ...payload,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(feedbackTemplates.id, templateId))
    .returning();

  return updatedTemplate;
}

export async function deleteFeedbackTemplate(
  templateId: string
): Promise<void> {
  await db
    .delete(feedbackTemplates)
    .where(eq(feedbackTemplates.id, templateId));
}

export async function getFeedbackTemplatesByCategory(
  category: string
): Promise<FeedbackTemplate[]> {
  return await db
    .select()
    .from(feedbackTemplates)
    .where(eq(feedbackTemplates.category, category))
    .orderBy(asc(feedbackTemplates.name));
}

// Analytics Functions
export async function getGradingStats(groupId?: string) {
  const tasksQuery = db
    .select({
      id: finalTasks.id,
      status: finalTasks.status,
      groupId: finalTasks.groupId,
    })
    .from(finalTasks)
    .where(groupId ? eq(finalTasks.groupId, groupId) : undefined);

  const tasks = await tasksQuery;

  const gradesQuery = db
    .select({
      points: finalTaskGrades.points,
      maxPoints: finalTaskGrades.maxPoints,
      taskId: finalTaskGrades.taskId,
    })
    .from(finalTaskGrades)
    .innerJoin(finalTasks, eq(finalTaskGrades.taskId, finalTasks.id))
    .where(groupId ? eq(finalTasks.groupId, groupId) : undefined);

  const grades = await gradesQuery;

  const totalTasks = tasks.length;
  const gradedTasks = tasks.filter(
    (task: (typeof tasks)[0]) => task.status === "graded"
  ).length;
  const pendingTasks = tasks.filter(
    (task: (typeof tasks)[0]) => task.status === "done"
  ).length;

  const totalPoints = grades.reduce(
    (sum: number, grade: (typeof grades)[0]) => sum + grade.points,
    0
  );
  const totalMaxPoints = grades.reduce(
    (sum: number, grade: (typeof grades)[0]) => sum + grade.maxPoints,
    0
  );
  const averageScore =
    totalMaxPoints > 0 ? (totalPoints / totalMaxPoints) * 100 : 0;

  return {
    totalTasks,
    gradedTasks,
    pendingTasks,
    averageScore: Math.round(averageScore * 100) / 100,
    totalGrades: grades.length,
  };
}
