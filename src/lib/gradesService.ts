import { eq, sql } from "drizzle-orm";
import db from "@/db";
import {
  studentGrades,
  quizResults,
  assignmentSubmissions,
  profiles,
  GradeWithProfilesType,
} from "@/db/drizzle/schema";
import { getMidtermEvaluationsForUser } from "./midterm-service";

/**
 * Get a student's grade from the database
 */
export async function getStudentGrade(userId: string) {
  try {
    // First check if grade record exists
    let grade = await db.query.studentGrades.findFirst({
      where: eq(studentGrades.userId, userId),
    });

    // If no grade record, create one
    if (!grade) {
      // Calculate initial grades based on existing quiz results and assignments
      const gradeData = await calculateGrades(userId);

      // Insert record
      const [newGrade] = await db
        .insert(studentGrades)
        .values({
          userId,
          ...gradeData,
          totalPoints:
            gradeData.quizPoints +
            gradeData.assignmentPoints +
            gradeData.extraPoints,
          maxPossiblePoints: 1000,
          updatedAt: new Date().toISOString(),
        })
        .returning();

      grade = newGrade;
    }

    return grade;
  } catch (error) {
    console.error("Error fetching student grade:", error);
    throw error;
  }
}

/**
 * Calculate a student's grades from scratch based on quiz results and assignment submissions
 */
export async function calculateGrades(userId: string) {
  try {
    // Get quiz results
    const quizResultsData = await db.query.quizResults.findMany({
      where: eq(quizResults.userId, userId),
      with: {
        quiz: true,
      },
    });

    // Calculate quiz points
    let quizPoints = 0;

    quizResultsData.forEach((result) => {
      // Only count points from closed quizzes with grade > 0
      if (result.quiz.grade > 0 && result.quiz.closed === true) {
        quizPoints += result.quiz.grade;
      }
    });

    // Calculate max quiz points by summing grades of all closed quizzes
    const closedQuizzes = await db.query.quizzes.findMany({
      where: (quizzes, { eq }) => eq(quizzes.closed, true),
    });

    const maxQuizPoints = closedQuizzes.reduce(
      (total, quiz) => total + quiz.grade,
      0
    );

    // Get assignment submissions with their assignments
    const assignmentSubmissionsData =
      await db.query.assignmentSubmissions.findMany({
        where: eq(assignmentSubmissions.userId, userId),
        with: {
          assignment: true,
        },
      });

    // Get all closed assignments to determine max possible points
    const closedAssignments = await db.query.assignments.findMany({
      where: (assignments, { eq }) => eq(assignments.closed, true),
    });

    // Calculate max assignment points by summing grades of all closed assignments
    const maxAssignmentPoints = closedAssignments.reduce(
      (total, assignment) => total + assignment.grade,
      0
    );

    // Calculate assignment points (only count graded submissions for closed assignments)
    let assignmentPoints = 0;

    assignmentSubmissionsData.forEach((submission) => {
      if (submission.grade !== null && submission.assignment.closed === true) {
        assignmentPoints += submission.grade;
      }
    });

    return {
      quizPoints,
      maxQuizPoints,
      assignmentPoints,
      maxAssignmentPoints,
      extraPoints: 0, // Default to 0 for extra points
      maxPossiblePoints: 1000,
    };
  } catch (error) {
    console.error("Error calculating student grades:", error);
    throw error;
  }
}

/**
 * Update a student's grades
 */
export async function updateStudentGrades(
  userId: string,
  gradeData: {
    quizPoints?: number;
    maxQuizPoints?: number;
    assignmentPoints?: number;
    maxAssignmentPoints?: number;
    extraPoints?: number;
    maxPossiblePoints?: number;
  }
) {
  try {
    // Get current grades
    const currentGrade = await getStudentGrade(userId);

    // Calculate new total
    const totalPoints =
      (gradeData.quizPoints ?? currentGrade?.quizPoints ?? 0) +
      (gradeData.assignmentPoints ?? currentGrade?.assignmentPoints ?? 0) +
      (gradeData.extraPoints ?? currentGrade?.extraPoints ?? 0);

    // Update the record
    await db
      .update(studentGrades)
      .set({
        ...gradeData,
        totalPoints,
        maxPossiblePoints: 1000, // Always set to 1000
        updatedAt: new Date().toISOString(),
      })
      .where(eq(studentGrades.userId, userId));

    return true;
  } catch (error) {
    console.error("Error updating student grades:", error);
    throw error;
  }
}

/**
 * Update extra points for a student
 */
export async function updateExtraPoints(userId: string, extraPoints: number) {
  try {
    // Get current grades
    const currentGrade = await getStudentGrade(userId);

    // Update total points and extra points
    const totalPoints =
      (currentGrade?.quizPoints ?? 0) +
      (currentGrade?.assignmentPoints ?? 0) +
      extraPoints;

    // Update the record
    await db
      .update(studentGrades)
      .set({
        extraPoints,
        totalPoints,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(studentGrades.userId, userId));

    return true;
  } catch (error) {
    console.error("Error updating extra points:", error);
    throw error;
  }
}

/**
 * Recalculate grades for a student (including midterm)
 */
export async function recalculateGrades(userId: string) {
  try {
    const baseGradeData = await calculateGrades(userId);

    const midtermEvaluations = await getMidtermEvaluationsForUser(userId);

    const midtermPoints = midtermEvaluations.reduce(
      (sum, evalData) => sum + (evalData.totalScore || 0),
      0
    );
    const maxMidtermPoints = midtermEvaluations.length * 250;

    const currentGrade = await db.query.studentGrades.findFirst({
      where: eq(studentGrades.userId, userId),
    });

    const extraPoints = currentGrade?.extraPoints ?? 0;

    // Calculate total points and max possible points
    const totalPoints =
      baseGradeData.quizPoints +
      baseGradeData.assignmentPoints +
      midtermPoints +
      extraPoints;
    const maxPossiblePoints =
      baseGradeData.maxQuizPoints +
      baseGradeData.maxAssignmentPoints +
      maxMidtermPoints;

    // Prepare data object for update/insert
    const gradeRecordData = {
      quizPoints: baseGradeData.quizPoints,
      maxQuizPoints: baseGradeData.maxQuizPoints,
      assignmentPoints: baseGradeData.assignmentPoints,
      maxAssignmentPoints: baseGradeData.maxAssignmentPoints,
      midtermPoints: midtermPoints,
      extraPoints: extraPoints,
      totalPoints: totalPoints,
      maxPossiblePoints: maxPossiblePoints,
      updatedAt: new Date().toISOString(),
    };

    if (currentGrade) {
      await db
        .update(studentGrades)
        .set(gradeRecordData)
        .where(eq(studentGrades.userId, userId));
    } else {
      await db.insert(studentGrades).values({
        userId,
        ...gradeRecordData,
      });
    }

    return true;
  } catch (error) {
    throw error; // Re-throw the error so the API route catches it
  }
}

/**
 * Get all student grades for admin dashboard
 */
export async function getAllStudentGrades() {
  try {
    const grades = await db.query.studentGrades.findMany({
      with: {
        user: {
          with: {
            profiles: true,
          },
        },
      },
    });

    return grades;
  } catch (error) {
    console.error("Error fetching all student grades:", error);
    throw error;
  }
}

/**
 * Recalculate all student grades
 */
export async function recalculateAllGrades() {
  try {
    // Get all user IDs from the studentGrades table
    const allUserIds = await db
      .select({ userId: studentGrades.userId })
      .from(studentGrades);

    await Promise.all(
      allUserIds.map(({ userId }) => recalculateGrades(userId))
    );
    console.log(
      `Successfully recalculated grades for ${allUserIds.length} students.`
    );
    return { count: allUserIds.length };
  } catch (error) {
    console.error("Error recalculating all grades:", error);
    throw error;
  }
}

/**
 * Get data specifically for the public leaderboard (Top 10 by total points)
 */
export async function getLeaderboardData() {
  try {
    // Define the type for the leaderboard entry if GradeWithProfilesType isn't exactly right
    // For simplicity, assuming GradeWithProfilesType includes what we need
    const leaderboard = await db
      .select({
        userId: studentGrades.userId,
        totalPoints: studentGrades.totalPoints,
        // Select necessary profile fields directly to avoid over-fetching
        profile: {
          fullName: profiles.fullName,
          avatarUrl: profiles.avatarUrl,
          email: profiles.email, // Include email if needed, otherwise remove
        },
      })
      .from(studentGrades)
      .innerJoin(profiles, eq(studentGrades.userId, profiles.id))
      .orderBy(sql`${studentGrades.totalPoints} DESC NULLS LAST`) // Order by totalPoints descending
      .limit(10); // Limit to top 10

    // Map the result to include the nested profile structure expected by the frontend
    const formattedLeaderboard = leaderboard.map((entry) => ({
      userId: entry.userId,
      totalPoints: entry.totalPoints,
      // Mimic the structure from getAllStudentGrades if necessary
      user: {
        profiles: [entry.profile],
      },
    }));

    return formattedLeaderboard as GradeWithProfilesType[]; // Cast to the expected type
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    throw error;
  }
}
