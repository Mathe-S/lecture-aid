import {
  QuizOption,
  QuizQuestionWithOptions,
  QuizWithQuestions,
} from "@/types";
import { supabase } from "./supabase";

export async function getQuizzes() {
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getQuizById(id: string) {
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getQuizWithQuestions(
  id: string
): Promise<QuizWithQuestions> {
  // Get quiz
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", id)
    .single();

  if (quizError) throw quizError;

  // Get questions with options
  const { data: questions, error: questionsError } = await supabase
    .from("quiz_questions")
    .select(
      `
      *,
      quiz_options(*)
    `
    )
    .eq("quiz_id", id)
    .order("order_index", { ascending: true });

  if (questionsError) throw questionsError;

  // Sort options by order_index
  questions.forEach((question) => {
    question.quiz_options.sort(
      (a: QuizOption, b: QuizOption) => a.order_index - b.order_index
    );
  });

  return { ...quiz, questions };
}

export async function createQuiz(quizData: QuizWithQuestions, userId: string) {
  // Create quiz
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      title: quizData.title,
      description: quizData.description,
      is_multiple_choice: quizData.is_multiple_choice,
      created_by: userId,
    })
    .select()
    .single();

  if (quizError) throw quizError;

  // Create questions and options if provided
  if (quizData.questions && quizData.questions.length > 0) {
    await createQuestionsWithOptions(quiz.id, quizData.questions);
  }

  return quiz;
}

export async function updateQuiz(id: string, quizData: QuizWithQuestions) {
  // Update quiz
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .update({
      title: quizData.title,
      description: quizData.description,
      is_multiple_choice: quizData.is_multiple_choice,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (quizError) throw quizError;

  // Handle questions update if provided
  if (quizData.questions) {
    // First delete existing questions (cascade will delete options)
    await supabase.from("quiz_questions").delete().eq("quiz_id", id);

    // Then create new questions with options
    if (quizData.questions.length > 0) {
      await createQuestionsWithOptions(id, quizData.questions);
    }
  }

  return quiz;
}

export async function deleteQuiz(id: string) {
  const { error } = await supabase.from("quizzes").delete().eq("id", id);

  if (error) throw error;
  return true;
}

async function createQuestionsWithOptions(
  quizId: string,
  questions: QuizQuestionWithOptions[]
) {
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];

    // Create question
    const { data: createdQuestion, error: questionError } = await supabase
      .from("quiz_questions")
      .insert({
        quiz_id: quizId,
        text: question.text,
        order_index: i,
      })
      .select()
      .single();

    if (questionError) throw questionError;

    // Create options for this question
    if (question.quiz_options && question.quiz_options.length > 0) {
      const optionsToInsert = question.quiz_options.map(
        (option: QuizOption, index: number) => ({
          question_id: createdQuestion.id,
          text: option.text,
          is_correct: option.is_correct,
          order_index: index,
        })
      );

      const { error: optionsError } = await supabase
        .from("quiz_options")
        .insert(optionsToInsert);

      if (optionsError) throw optionsError;
    }
  }
}
