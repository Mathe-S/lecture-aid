import { eq } from "drizzle-orm";
import db from "@/db";
import {
  QuizOption,
  QuizQuestionWithOptions,
  quizzes,
  quizQuestions,
  quizOptions,
  QuizWithQuestionsAndOptions,
} from "@/db/drizzle/schema";

export async function getQuizzes() {
  return await db.query.quizzes.findMany({
    orderBy: (quizzes, { desc }) => [desc(quizzes.createdAt)],
  });
}

export async function getQuizById(id: string) {
  return await db.query.quizzes.findFirst({
    where: eq(quizzes.id, id),
  });
}

export async function getQuizzesWithQuestions() {
  return await db.query.quizzes.findMany({
    orderBy: (quizzes, { desc }) => [desc(quizzes.createdAt)],
    with: {
      quizQuestions: {
        orderBy: (questions, { asc }) => [asc(questions.orderIndex)],
      },
    },
  });
}

export async function getQuizWithQuestions(
  id: string
): Promise<QuizWithQuestionsAndOptions> {
  try {
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, id),
      with: {
        quizQuestions: {
          with: {
            quizOptions: true,
          },
          orderBy: (questions, { asc }) => [asc(questions.orderIndex)],
        },
      },
    });
    console.log("🚀 ~ quiz:", quiz);

    if (!quiz) throw new Error("Quiz not found");

    return quiz as QuizWithQuestionsAndOptions;
  } catch (error) {
    console.error("Error fetching quiz:", error);
    throw error;
  }
}

export async function createQuiz(
  quizData: QuizWithQuestionsAndOptions,
  userId: string
) {
  // Create quiz
  const [quiz] = await db
    .insert(quizzes)
    .values({
      title: quizData.title,
      description: quizData.description,
      isMultipleChoice: quizData.isMultipleChoice,
      createdBy: userId,
    })
    .returning();

  // Create questions and options if provided
  if (quizData.quizQuestions && quizData.quizQuestions.length > 0) {
    await createQuestionsWithOptions(quiz.id, quizData.quizQuestions);
  }

  return quiz;
}

export async function updateQuiz(
  id: string,
  quizData: QuizWithQuestionsAndOptions
) {
  // Update quiz
  const [quiz] = await db
    .update(quizzes)
    .set({
      title: quizData.title,
      description: quizData.description,
      isMultipleChoice: quizData.isMultipleChoice,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(quizzes.id, id))
    .returning();

  // Handle questions update if provided
  if (quizData.quizQuestions) {
    // First delete existing questions (cascade will delete options)
    await db.delete(quizQuestions).where(eq(quizQuestions.quizId, id));

    // Then create new questions with options
    if (quizData.quizQuestions.length > 0) {
      await createQuestionsWithOptions(id, quizData.quizQuestions);
    }
  }

  return quiz;
}

export async function deleteQuiz(id: string) {
  await db.delete(quizzes).where(eq(quizzes.id, id));
  return true;
}

async function createQuestionsWithOptions(
  quizId: string,
  questions: QuizQuestionWithOptions[]
) {
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];

    // Create question
    const [createdQuestion] = await db
      .insert(quizQuestions)
      .values({
        quizId,
        text: question.text,
        orderIndex: i,
      })
      .returning();

    // Create options for this question
    if (question.quizOptions && question.quizOptions.length > 0) {
      const optionsToInsert = question.quizOptions.map(
        (option: QuizOption, index: number) => ({
          questionId: createdQuestion.id,
          text: option.text,
          isCorrect: option.isCorrect,
          orderIndex: index,
        })
      );

      await db.insert(quizOptions).values(optionsToInsert);
    }
  }
}
