import { useQuery } from "@tanstack/react-query";
import { QuizResult, Quiz, ProfileRecord } from "@/db/drizzle/schema";

export interface QuizResultsResponse {
  results: QuizResult[];
  quizzes: Record<string, Quiz>;
  users: Record<string, ProfileRecord>;
}

// Query keys
export const quizResultsKeys = {
  all: ["quizResults"] as const,
  list: () => [...quizResultsKeys.all, "list"] as const,
  detail: (id: string) => [...quizResultsKeys.all, "detail", id] as const,
};

// Fetch functions
async function fetchQuizResults(): Promise<QuizResultsResponse> {
  const response = await fetch("/api/quiz-results");

  if (!response.ok) {
    throw new Error(`Failed to fetch results: ${response.statusText}`);
  }

  return response.json();
}

async function fetchQuizResultDetail(id: string) {
  const response = await fetch(`/api/quiz-results/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch result: ${response.statusText}`);
  }

  return response.json();
}

// Hooks
export function useQuizResults() {
  return useQuery({
    queryKey: quizResultsKeys.list(),
    queryFn: fetchQuizResults,
  });
}

export function useQuizResultDetail(id: string) {
  return useQuery({
    queryKey: quizResultsKeys.detail(id),
    queryFn: () => fetchQuizResultDetail(id),
    enabled: !!id, // Only run the query if we have an ID
  });
}
