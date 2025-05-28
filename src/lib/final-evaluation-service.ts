import { db } from "@/db";
import {
  finalEvaluations,
  finalGroups,
  finalGroupMembers,
  NewFinalEvaluation,
  FinalEvaluation,
} from "@/db/drizzle/final-schema";
import { profiles } from "@/db/drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";

// Types for the evaluation system
export interface WeeklyEvaluation {
  week: 1 | 2 | 3 | 4;
  score: number;
  maxScore: number;
  feedback: string | null;
  githubContributions: number;
  tasksCompleted: number;
}

export interface FinalEvaluationWithDetails extends FinalEvaluation {
  student: {
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  };
  group: {
    id: string;
    name: string;
  };
  evaluator: {
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
  weeklyBreakdown: WeeklyEvaluation[];
}

export interface EvaluationSummary {
  totalStudents: number;
  evaluatedStudents: number;
  averageScore: number;
  weeklyAverages: {
    week1: number;
    week2: number;
    week3: number;
    week4: number;
  };
}

// Constants for scoring
export const WEEKLY_MAX_SCORES = {
  week1: 50,
  week2: 100,
  week3: 150,
  week4: 150,
} as const;

export const TOTAL_MAX_SCORE = 450;

/**
 * Get all evaluations with detailed information
 */
export async function getAllEvaluationsWithDetails(): Promise<
  FinalEvaluationWithDetails[]
> {
  const evaluations = await db.query.finalEvaluations.findMany({
    with: {
      student: {
        columns: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      group: {
        columns: {
          id: true,
          name: true,
        },
      },
      evaluator: {
        columns: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: [desc(finalEvaluations.updatedAt)],
  });

  return evaluations.map((evaluation) => ({
    ...evaluation,
    weeklyBreakdown: [
      {
        week: 1 as const,
        score: evaluation.week1Score || 0,
        maxScore: WEEKLY_MAX_SCORES.week1,
        feedback: evaluation.week1Feedback,
        githubContributions: evaluation.week1GitHubContributions || 0,
        tasksCompleted: evaluation.week1TasksCompleted || 0,
      },
      {
        week: 2 as const,
        score: evaluation.week2Score || 0,
        maxScore: WEEKLY_MAX_SCORES.week2,
        feedback: evaluation.week2Feedback,
        githubContributions: evaluation.week2GitHubContributions || 0,
        tasksCompleted: evaluation.week2TasksCompleted || 0,
      },
      {
        week: 3 as const,
        score: evaluation.week3Score || 0,
        maxScore: WEEKLY_MAX_SCORES.week3,
        feedback: evaluation.week3Feedback,
        githubContributions: evaluation.week3GitHubContributions || 0,
        tasksCompleted: evaluation.week3TasksCompleted || 0,
      },
      {
        week: 4 as const,
        score: evaluation.week4Score || 0,
        maxScore: WEEKLY_MAX_SCORES.week4,
        feedback: evaluation.week4Feedback,
        githubContributions: evaluation.week4GitHubContributions || 0,
        tasksCompleted: evaluation.week4TasksCompleted || 0,
      },
    ],
  }));
}

/**
 * Get evaluation for a specific student in a specific group
 */
export async function getStudentEvaluation(
  groupId: string,
  userId: string
): Promise<FinalEvaluationWithDetails | null> {
  const evaluation = await db.query.finalEvaluations.findFirst({
    where: and(
      eq(finalEvaluations.groupId, groupId),
      eq(finalEvaluations.userId, userId)
    ),
    with: {
      student: {
        columns: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      group: {
        columns: {
          id: true,
          name: true,
        },
      },
      evaluator: {
        columns: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!evaluation) return null;

  return {
    ...evaluation,
    weeklyBreakdown: [
      {
        week: 1 as const,
        score: evaluation.week1Score || 0,
        maxScore: WEEKLY_MAX_SCORES.week1,
        feedback: evaluation.week1Feedback,
        githubContributions: evaluation.week1GitHubContributions || 0,
        tasksCompleted: evaluation.week1TasksCompleted || 0,
      },
      {
        week: 2 as const,
        score: evaluation.week2Score || 0,
        maxScore: WEEKLY_MAX_SCORES.week2,
        feedback: evaluation.week2Feedback,
        githubContributions: evaluation.week2GitHubContributions || 0,
        tasksCompleted: evaluation.week2TasksCompleted || 0,
      },
      {
        week: 3 as const,
        score: evaluation.week3Score || 0,
        maxScore: WEEKLY_MAX_SCORES.week3,
        feedback: evaluation.week3Feedback,
        githubContributions: evaluation.week3GitHubContributions || 0,
        tasksCompleted: evaluation.week3TasksCompleted || 0,
      },
      {
        week: 4 as const,
        score: evaluation.week4Score || 0,
        maxScore: WEEKLY_MAX_SCORES.week4,
        feedback: evaluation.week4Feedback,
        githubContributions: evaluation.week4GitHubContributions || 0,
        tasksCompleted: evaluation.week4TasksCompleted || 0,
      },
    ],
  };
}

/**
 * Create or update an evaluation for a student
 */
export async function upsertEvaluation(
  groupId: string,
  userId: string,
  evaluatorId: string,
  evaluationData: {
    week1Score?: number;
    week1Feedback?: string;
    week2Score?: number;
    week2Feedback?: string;
    week3Score?: number;
    week3Feedback?: string;
    week4Score?: number;
    week4Feedback?: string;
    feedback?: string;
  }
): Promise<FinalEvaluationWithDetails> {
  // Verify the student is a member of the group
  const membership = await db.query.finalGroupMembers.findFirst({
    where: and(
      eq(finalGroupMembers.groupId, groupId),
      eq(finalGroupMembers.userId, userId)
    ),
  });

  if (!membership) {
    throw new Error("Student is not a member of this group");
  }

  // Calculate total score
  const totalScore =
    (evaluationData.week1Score || 0) +
    (evaluationData.week2Score || 0) +
    (evaluationData.week3Score || 0) +
    (evaluationData.week4Score || 0);

  // Check if evaluation already exists
  const existingEvaluation = await db.query.finalEvaluations.findFirst({
    where: and(
      eq(finalEvaluations.groupId, groupId),
      eq(finalEvaluations.userId, userId)
    ),
  });

  if (existingEvaluation) {
    // Update existing evaluation
    await db
      .update(finalEvaluations)
      .set({
        ...evaluationData,
        totalScore,
        evaluatorId,
        updatedAt: sql`timezone('utc'::text, now())`,
      })
      .where(eq(finalEvaluations.id, existingEvaluation.id));
  } else {
    // Create new evaluation
    const newEvaluationData: NewFinalEvaluation = {
      groupId,
      userId,
      evaluatorId,
      week1Score: evaluationData.week1Score || 0,
      week1Feedback: evaluationData.week1Feedback || null,
      week2Score: evaluationData.week2Score || 0,
      week2Feedback: evaluationData.week2Feedback || null,
      week3Score: evaluationData.week3Score || 0,
      week3Feedback: evaluationData.week3Feedback || null,
      week4Score: evaluationData.week4Score || 0,
      week4Feedback: evaluationData.week4Feedback || null,
      feedback: evaluationData.feedback || null,
      totalScore,
    };

    await db.insert(finalEvaluations).values(newEvaluationData);
  }

  // Return the evaluation with details
  const evaluationWithDetails = await getStudentEvaluation(groupId, userId);
  if (!evaluationWithDetails) {
    throw new Error("Failed to retrieve evaluation after upsert");
  }

  return evaluationWithDetails;
}

/**
 * Get evaluation summary statistics
 */
export async function getEvaluationSummary(): Promise<EvaluationSummary> {
  // Get total number of students in final groups
  const totalStudentsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(finalGroupMembers);

  const totalStudents = totalStudentsResult[0]?.count || 0;

  // Get number of evaluated students
  const evaluatedStudentsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(finalEvaluations);

  const evaluatedStudents = evaluatedStudentsResult[0]?.count || 0;

  // Get average scores
  const averageScoresResult = await db
    .select({
      avgTotal: sql<number>`avg(total_score)`,
      avgWeek1: sql<number>`avg(week1_score)`,
      avgWeek2: sql<number>`avg(week2_score)`,
      avgWeek3: sql<number>`avg(week3_score)`,
      avgWeek4: sql<number>`avg(week4_score)`,
    })
    .from(finalEvaluations);

  const averages = averageScoresResult[0];

  return {
    totalStudents,
    evaluatedStudents,
    averageScore: Math.round(averages?.avgTotal || 0),
    weeklyAverages: {
      week1: Math.round(averages?.avgWeek1 || 0),
      week2: Math.round(averages?.avgWeek2 || 0),
      week3: Math.round(averages?.avgWeek3 || 0),
      week4: Math.round(averages?.avgWeek4 || 0),
    },
  };
}

/**
 * Get all students in final groups who need evaluation
 */
export async function getStudentsForEvaluation() {
  const students = await db
    .select({
      userId: finalGroupMembers.userId,
      groupId: finalGroupMembers.groupId,
      groupName: finalGroups.name,
      studentName: profiles.fullName,
      studentEmail: profiles.email,
      studentAvatar: profiles.avatarUrl,
      hasEvaluation: sql<boolean>`CASE WHEN ${finalEvaluations.id} IS NOT NULL THEN true ELSE false END`,
    })
    .from(finalGroupMembers)
    .innerJoin(finalGroups, eq(finalGroupMembers.groupId, finalGroups.id))
    .innerJoin(profiles, eq(finalGroupMembers.userId, profiles.id))
    .leftJoin(
      finalEvaluations,
      and(
        eq(finalEvaluations.groupId, finalGroupMembers.groupId),
        eq(finalEvaluations.userId, finalGroupMembers.userId)
      )
    )
    .orderBy(finalGroups.name, profiles.fullName);

  return students;
}
