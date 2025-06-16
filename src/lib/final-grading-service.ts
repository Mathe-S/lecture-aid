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
  };
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
  groupId: string;
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
  const query = db
    .select({
      id: finalTasks.id,
      title: finalTasks.title,
      description: finalTasks.description,
      commitLink: finalTasks.commitLink,
      mergeRequestLink: finalTasks.mergeRequestLink,
      status: finalTasks.status,
      priority: finalTasks.priority,
      dueDate: finalTasks.dueDate,
      groupId: finalTasks.groupId,
    })
    .from(finalTasks)
    .where(groupId ? eq(finalTasks.groupId, groupId) : undefined)
    .orderBy(desc(finalTasks.updatedAt));

  const tasks = await query;

  // Get assignees and grades for each task
  const tasksWithDetails = await Promise.all(
    tasks.map(async (task: (typeof tasks)[0]) => {
      // Get assignees
      const assignees = await db
        .select({
          id: finalTaskAssignees.id,
          userId: finalTaskAssignees.userId,
          user: {
            id: profiles.id,
            fullName: profiles.fullName,
            email: profiles.email,
            avatarUrl: profiles.avatarUrl,
          },
        })
        .from(finalTaskAssignees)
        .innerJoin(profiles, eq(finalTaskAssignees.userId, profiles.id))
        .where(eq(finalTaskAssignees.taskId, task.id));

      // Get grades
      const grades = await db
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
            id: profiles.id,
            fullName: profiles.fullName,
            email: profiles.email,
            avatarUrl: profiles.avatarUrl,
          },
          grader: {
            id: profiles.id,
            fullName: profiles.fullName,
            email: profiles.email,
          },
        })
        .from(finalTaskGrades)
        .innerJoin(finalTasks, eq(finalTaskGrades.taskId, finalTasks.id))
        .innerJoin(profiles, eq(finalTaskGrades.studentId, profiles.id))
        .leftJoin(profiles, eq(finalTaskGrades.graderId, profiles.id))
        .where(eq(finalTaskGrades.taskId, task.id));

      return {
        ...task,
        assignees,
        grades,
      };
    })
  );

  return tasksWithDetails;
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
        id: profiles.id,
        fullName: profiles.fullName,
        email: profiles.email,
        avatarUrl: profiles.avatarUrl,
      },
      grader: {
        id: profiles.id,
        fullName: profiles.fullName,
        email: profiles.email,
      },
    })
    .from(finalTaskGrades)
    .innerJoin(finalTasks, eq(finalTaskGrades.taskId, finalTasks.id))
    .innerJoin(profiles, eq(finalTaskGrades.studentId, profiles.id))
    .leftJoin(profiles, eq(finalTaskGrades.graderId, profiles.id))
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
