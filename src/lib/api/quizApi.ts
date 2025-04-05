import { QuizWithQuestionsAndOptions, Quiz } from "@/db/drizzle/schema";

// API Responses
export type GetQuizResponse = QuizWithQuestionsAndOptions;
export type CreateQuizResponse = Quiz;
export type UpdateQuizResponse = Quiz;

// API Error
export interface ApiError {
  error: string;
  status?: number;
}

// Quiz API
export const quizApi = {
  getQuizzes: async (): Promise<QuizWithQuestionsAndOptions[]> => {
    const response = await fetch("/api/quizzes?includeQuestions=true");
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch quizzes");
    }
    return response.json();
  },

  getQuiz: async (id: string): Promise<GetQuizResponse> => {
    const response = await fetch(`/api/quizzes/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch quiz");
    }
    return response.json();
  },

  createQuiz: async (
    quizData: Omit<QuizWithQuestionsAndOptions, "id"> & { createdBy: string }
  ): Promise<CreateQuizResponse> => {
    const response = await fetch("/api/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...quizData,
        grade: quizData.grade || 0,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create quiz");
    }

    return response.json();
  },

  updateQuiz: async (
    id: string,
    quizData: QuizWithQuestionsAndOptions
  ): Promise<UpdateQuizResponse> => {
    const response = await fetch(`/api/quizzes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...quizData,
        grade: quizData.grade || 0,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update quiz");
    }

    return response.json();
  },

  deleteQuiz: async (id: string): Promise<{ success: boolean }> => {
    const response = await fetch(`/api/quizzes/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete quiz");
    }

    return response.json();
  },
};
