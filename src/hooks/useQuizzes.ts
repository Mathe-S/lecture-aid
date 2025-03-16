import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quizApi } from "@/lib/api/quizApi";
import { QuizWithQuestionsAndOptions } from "@/db/drizzle/schema";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Query key factory
export const quizKeys = {
  all: ["quizzes"] as const,
  lists: () => [...quizKeys.all, "list"] as const,
  list: (filters: string) => [...quizKeys.lists(), { filters }] as const,
  details: () => [...quizKeys.all, "detail"] as const,
  detail: (id: string) => [...quizKeys.details(), id] as const,
};

// Get all quizzes
export function useQuizzes() {
  return useQuery({
    queryKey: quizKeys.lists(),
    queryFn: () => quizApi.getQuizzes(),
  });
}

// Get a single quiz
export function useQuiz(id: string) {
  return useQuery({
    queryKey: quizKeys.detail(id),
    queryFn: () => quizApi.getQuiz(id),
    enabled: !!id, // Only run if id exists
  });
}

// Create a new quiz
export function useCreateQuiz() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (
      quizData: Omit<QuizWithQuestionsAndOptions, "id"> & { createdBy: string }
    ) => quizApi.createQuiz(quizData),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
      toast.success("Quiz created successfully");
      router.push("/admin/quizzes");
    },
    onError: (error) => {
      toast.error("Failed to create quiz", {
        description: error.message,
      });
    },
  });
}

// Update a quiz
export function useUpdateQuiz(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (quizData: QuizWithQuestionsAndOptions) =>
      quizApi.updateQuiz(id, quizData),
    onSuccess: () => {
      // Invalidate and refetch the quiz list and the specific quiz
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(id) });
      toast.success("Quiz updated successfully");
      router.push("/admin/quizzes");
    },
    onError: (error) => {
      toast.error("Failed to update quiz", {
        description: error.message,
      });
    },
  });
}

// Delete a quiz
export function useDeleteQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => quizApi.deleteQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
      toast.success("Quiz deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete quiz", {
        description: error.message,
      });
    },
  });
}
