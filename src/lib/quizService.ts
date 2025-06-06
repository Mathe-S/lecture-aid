import { eq } from "drizzle-orm";
import db from "@/db";
import {
  QuizOption,
  QuizQuestionWithOptions,
  quizzes,
  quizQuestions,
  quizOptions,
  QuizWithQuestionsAndOptions,
  quizResults,
  studentGrades,
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
  const [quiz] = await db
    .insert(quizzes)
    .values({
      title: quizData.title,
      description: quizData.description,
      createdBy: userId,
    })
    .returning();

  if (quizData.quizQuestions && quizData.quizQuestions.length > 0) {
    await createQuestionsWithOptions(quiz.id, quizData.quizQuestions);
  }

  return quiz;
}

export async function updateQuiz(
  id: string,
  quizData: QuizWithQuestionsAndOptions
) {
  const [quiz] = await db
    .update(quizzes)
    .set({
      title: quizData.title,
      description: quizData.description,
      grade: quizData.grade,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(quizzes.id, id))
    .returning();

  if (quizData.quizQuestions) {
    // Get existing questions with their options
    const existingQuiz = await getQuizWithQuestions(id);
    const existingQuestions = existingQuiz.quizQuestions || [];

    // Process each question in the updated quiz
    const questionUpdatePromises = quizData.quizQuestions.map(
      async (updatedQuestion, i) => {
        // Check if this is an existing question or a new one
        if (updatedQuestion.id && !updatedQuestion.id.startsWith("temp-")) {
          // This is an existing question - update it
          const [updatedQuestionResult] = await db
            .update(quizQuestions)
            .set({
              text: updatedQuestion.text,
              orderIndex: i,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(quizQuestions.id, updatedQuestion.id))
            .returning();

          // Process options for this question
          if (
            updatedQuestion.quizOptions &&
            updatedQuestion.quizOptions.length > 0
          ) {
            await updateQuestionOptions(
              updatedQuestionResult.id,
              updatedQuestion.quizOptions
            );
          }

          return updatedQuestionResult;
        } else {
          // This is a new question - create it
          const [createdQuestion] = await db
            .insert(quizQuestions)
            .values({
              quizId: id,
              text: updatedQuestion.text,
              orderIndex: i,
            })
            .returning();

          // Create options for this new question
          if (
            updatedQuestion.quizOptions &&
            updatedQuestion.quizOptions.length > 0
          ) {
            const optionsToInsert = updatedQuestion.quizOptions.map(
              (option, index) => ({
                questionId: createdQuestion.id,
                text: option.text,
                isCorrect: option.isCorrect,
                orderIndex: index,
              })
            );
            await db.insert(quizOptions).values(optionsToInsert);
          }

          return createdQuestion;
        }
      }
    );

    // Wait for all question updates to complete
    await Promise.all(questionUpdatePromises);

    // Delete questions that were removed
    const updatedQuestionIds = quizData.quizQuestions
      .map((q) => q.id)
      .filter((id) => id && !id.startsWith("temp-"));

    const questionsToDelete = existingQuestions
      .filter((q) => !updatedQuestionIds.includes(q.id))
      .map((q) => q.id);

    if (questionsToDelete.length > 0) {
      for (const questionId of questionsToDelete) {
        await db.delete(quizQuestions).where(eq(quizQuestions.id, questionId));
      }
    }
  }

  return quiz;
}

// Helper function to update options for a question
async function updateQuestionOptions(
  questionId: string,
  updatedOptions: QuizOption[]
) {
  // Get existing options
  const existingOptions = await db.query.quizOptions.findMany({
    where: eq(quizOptions.questionId, questionId),
  });

  // Process each option in the updated list
  for (let i = 0; i < updatedOptions.length; i++) {
    const option = updatedOptions[i];

    // Check if this is an existing option or a new one
    if (option.id && !option.id.startsWith("temp-")) {
      // This is an existing option - update it
      await db
        .update(quizOptions)
        .set({
          text: option.text,
          isCorrect: option.isCorrect,
          orderIndex: i,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(quizOptions.id, option.id));
    } else {
      // This is a new option - create it
      await db.insert(quizOptions).values({
        questionId,
        text: option.text,
        isCorrect: option.isCorrect,
        orderIndex: i,
      });
    }
  }

  // Delete options that were removed
  const updatedOptionIds = updatedOptions
    .map((o) => o.id)
    .filter((id) => id && !id.startsWith("temp-"));

  const optionsToDelete = existingOptions
    .filter((o) => !updatedOptionIds.includes(o.id))
    .map((o) => o.id);

  if (optionsToDelete.length > 0) {
    for (const optionId of optionsToDelete) {
      await db.delete(quizOptions).where(eq(quizOptions.id, optionId));
    }
  }
}

export async function deleteQuiz(id: string) {
  await db.delete(quizzes).where(eq(quizzes.id, id));
  return true;
}

export async function closeAndGradeQuiz(id: string) {
  // First mark the quiz as closed
  await db
    .update(quizzes)
    .set({
      closed: true,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(quizzes.id, id));

  // Get the quiz to check its grade value
  const quiz = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, id),
  });

  if (!quiz) {
    throw new Error("Quiz not found");
  }

  // If the quiz is worth 0 points, don't update any grades
  if (quiz.grade === 0) {
    return { success: true, gradedCount: 0 };
  }

  // Find all student results for this quiz
  const results = await db.query.quizResults.findMany({
    where: eq(quizResults.quizId, id),
  });

  // Get unique user IDs who took the quiz
  const userIds = [...new Set(results.map((result) => result.userId))];

  // Update student grades for each user
  const updatePromises = userIds.map(async (userId) => {
    // Check if the student already has a grade record
    const existingGrade = await db.query.studentGrades.findFirst({
      where: eq(studentGrades.userId, userId),
    });

    if (existingGrade) {
      // Update existing record
      return await db
        .update(studentGrades)
        .set({
          quizPoints: (existingGrade.quizPoints || 0) + quiz.grade,
          totalPoints: (existingGrade.totalPoints || 0) + quiz.grade,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(studentGrades.userId, userId));
    } else {
      // Create new record
      return await db
        .insert(studentGrades)
        .values({
          userId,
          quizPoints: quiz.grade,
          totalPoints: quiz.grade,
        })
        .returning();
    }
  });

  await Promise.all(updatePromises);

  return {
    success: true,
    gradedCount: userIds.length,
    quizGrade: quiz.grade,
  };
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
