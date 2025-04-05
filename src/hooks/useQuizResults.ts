import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QuizResult, Quiz, ProfileRecord } from "@/db/drizzle/schema";
import { toast } from "sonner";

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

// Delete a quiz result
async function deleteQuizResult(id: string) {
  const response = await fetch(`/api/quiz-results/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete result");
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

export function useDeleteQuizResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteQuizResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizResultsKeys.list() });
      toast.success("Quiz result deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete quiz result", {
        description: error.message,
      });
    },
  });
}
