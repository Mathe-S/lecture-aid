import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AssignmentSubmission } from "@/db/drizzle/schema";
import { createClient } from "@/utils/supabase/client";
import { getUserRepositories } from "@/lib/github-service";
import { useAuth } from "@/context/AuthContext";

// Define query keys
export const submissionKeys = {
  all: ["assignmentSubmissions"] as const,
  lists: (assignmentId: string) =>
    [...submissionKeys.all, assignmentId] as const,
  detail: (assignmentId: string, userId: string) =>
    [...submissionKeys.lists(assignmentId), userId] as const,
};

export const githubKeys = {
  all: ["github"] as const,
  repos: () => [...githubKeys.all, "repos"] as const,
};

// Get user's GitHub repositories
export function useGitHubRepositories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: githubKeys.repos(),
    queryFn: () => getUserRepositories(user),
    enabled: !!user,
  });
}

// Get all submissions for an assignment
export function useAssignmentSubmissions(assignmentId: string | undefined) {
  return useQuery({
    queryKey: submissionKeys.lists(assignmentId || ""),
    queryFn: async () => {
      if (!assignmentId) return [];

      const supabase = createClient();
      const { data, error } = await supabase
        .from("assignment_submissions")
        .select("*, profiles(full_name, email)")
        .eq("assignmentId", assignmentId);

      if (error) throw error;
      return data;
    },
    enabled: !!assignmentId,
  });
}

// Get user's submission for an assignment
export function useUserSubmission(
  assignmentId: string | undefined,
  userId: string | undefined
) {
  return useQuery({
    queryKey: submissionKeys.detail(assignmentId || "", userId || ""),
    queryFn: async () => {
      if (!assignmentId || !userId) return null;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("assignment_submissions")
        .select("*")
        .eq("assignmentId", assignmentId)
        .eq("userId", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 is "no rows returned" error
      return data as AssignmentSubmission | null;
    },
    enabled: !!assignmentId && !!userId,
  });
}

// Submit an assignment
export function useSubmitAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      submission: Omit<
        AssignmentSubmission,
        "id" | "submittedAt" | "updatedAt" | "feedback" | "grade"
      >
    ) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("assignment_submissions")
        .upsert({
          assignmentId: submission.assignmentId,
          userId: submission.userId,
          repositoryUrl: submission.repositoryUrl,
          repositoryName: submission.repositoryName,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AssignmentSubmission;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: submissionKeys.lists(data.assignmentId),
      });
      queryClient.invalidateQueries({
        queryKey: submissionKeys.detail(data.assignmentId, data.userId),
      });
    },
  });
}
