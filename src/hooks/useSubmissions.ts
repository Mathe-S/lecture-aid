import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AssignmentSubmission } from "@/db/drizzle/schema";
import { useAuth } from "@/context/AuthContext";
import { assignmentApi } from "@/lib/api/assignmentApi";
import { GitHubRepo } from "@/lib/github-service";

// Define query keys
export const submissionKeys = {
  all: ["assignmentSubmissions"] as const,
  lists: (assignmentId: string) =>
    [...submissionKeys.all, assignmentId] as const,
  detail: (submissionId: string) =>
    [...submissionKeys.all, "detail", submissionId] as const,
  userSubmission: (assignmentId: string, userId: string) =>
    [...submissionKeys.lists(assignmentId), userId] as const,
};

export const githubKeys = {
  all: ["github"] as const,
  repos: () => [...githubKeys.all, "repos"] as const,
};

// Get user's GitHub repositories
export function useGitHubRepositories() {
  const { session } = useAuth();

  return useQuery({
    queryKey: githubKeys.repos(),
    queryFn: async (): Promise<GitHubRepo[]> => {
      const response = await fetch("/api/github/repos");
      if (!response.ok) {
        throw new Error("Failed to fetch GitHub repositories");
      }
      return response.json();
    },
    enabled: !!session,
  });
}

// Get all submissions for an assignment
export function useAssignmentSubmissions(assignmentId: string | undefined) {
  return useQuery({
    queryKey: submissionKeys.lists(assignmentId || ""),
    queryFn: () =>
      assignmentId ? assignmentApi.getSubmissions(assignmentId) : [],
    enabled: !!assignmentId,
  });
}

// Get specific submission by ID
export function useSubmission(submissionId: string | undefined) {
  return useQuery({
    queryKey: submissionKeys.detail(submissionId || ""),
    queryFn: async () => {
      if (!submissionId) return null;
      return assignmentApi.getSubmission(submissionId);
    },
    enabled: !!submissionId,
  });
}

// Get user's submission for an assignment
export function useUserSubmission(
  assignmentId: string | undefined,
  userId: string | undefined
) {
  return useQuery({
    queryKey: submissionKeys.userSubmission(assignmentId || "", userId || ""),
    queryFn: async () => {
      if (!assignmentId || !userId) return null;
      return assignmentApi.getUserSubmission(assignmentId, userId);
    },
    enabled: !!assignmentId && !!userId,
  });
}

// Get all submissions for a user
export function useUserSubmissions(userId: string | undefined) {
  return useQuery({
    queryKey: [...submissionKeys.all, "user", userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/users/${userId}/submissions`);
      if (!response.ok) {
        throw new Error("Failed to fetch user submissions");
      }
      return response.json();
    },
    enabled: !!userId,
  });
}

// Submit an assignment
export function useSubmitAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      submission: Omit<
        AssignmentSubmission,
        "id" | "submittedAt" | "updatedAt" | "feedback" | "grade"
      >
    ) => assignmentApi.submitAssignment(submission),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: submissionKeys.lists(data.assignmentId),
      });
      queryClient.invalidateQueries({
        queryKey: submissionKeys.userSubmission(data.assignmentId, data.userId),
      });
    },
  });
}

// Grade a submission
export function useGradeSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      feedback,
      grade,
    }: {
      submissionId: string;
      feedback: string;
      grade: number;
    }) => assignmentApi.gradeSubmission(submissionId, feedback, grade),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: submissionKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: submissionKeys.lists(data.assignmentId),
      });
    },
  });
}
