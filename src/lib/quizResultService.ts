import { eq } from "drizzle-orm";
import db from "@/db";
import {
  quizResults,
  profiles,
  quizzes,
  quizQuestions,
} from "@/db/drizzle/schema";

export async function getQuizResultDetails(id: string) {
  // Fetch the quiz result
  const result = await db.query.quizResults.findFirst({
    where: eq(quizResults.id, id),
  });

  if (!result) {
    throw new Error("Result not found");
  }

  // Fetch the quiz
  const quiz = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, result.quizId),
  });

  // Fetch the questions
  const questions = await db.query.quizQuestions.findMany({
    where: eq(quizQuestions.quizId, result.quizId),
    orderBy: (quizQuestions, { asc }) => [asc(quizQuestions.orderIndex)],
  });

  // Fetch all options for these questions
  const questionIds = questions.map((q) => q.id);
  const allOptions = await db.query.quizOptions.findMany({
    where: (quizOptions, { inArray }) =>
      inArray(quizOptions.questionId, questionIds),
    orderBy: (quizOptions, { asc }) => [asc(quizOptions.orderIndex)],
  });

  // Group options by question ID
  const optionsMap = allOptions.reduce((acc, option) => {
    if (!acc[option.questionId]) {
      acc[option.questionId] = [];
    }
    acc[option.questionId].push(option);
    return acc;
  }, {} as Record<string, typeof allOptions>);

  // Fetch user profile
  const user = await db.query.profiles.findFirst({
    where: eq(profiles.id, result.userId),
  });

  return {
    result,
    quiz,
    questions,
    options: optionsMap,
    user,
  };
}

export async function getAllQuizResults() {
  // Fetch all quiz results
  const results = await db.query.quizResults.findMany({
    orderBy: (quizResults, { desc }) => [desc(quizResults.completedAt)],
  });

  // Get unique quiz IDs and user IDs from results
  const quizIds = [...new Set(results.map((result) => result.quizId))];
  const userIds = [...new Set(results.map((result) => result.userId))];

  // Fetch all quizzes with these IDs
  const quizzesData = await db.query.quizzes.findMany({
    columns: {
      id: true,
      title: true,
    },
    where: (quizzes, { inArray }) => inArray(quizzes.id, quizIds),
  });

  // Fetch all user profiles with these IDs
  const usersData = await db.query.profiles.findMany({
    columns: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
    },
    where: (profiles, { inArray }) => inArray(profiles.id, userIds),
  });

  // Create maps for quick lookups
  const quizzesMap = quizzesData.reduce((acc, quiz) => {
    acc[quiz.id] = quiz;
    return acc;
  }, {} as Record<string, (typeof quizzesData)[0]>);

  const usersMap = usersData.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, (typeof usersData)[0]>);

  return {
    results,
    quizzes: quizzesMap,
    users: usersMap,
  };
}
