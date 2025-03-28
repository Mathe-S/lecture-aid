import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Assignment, AssignmentSubmission } from "@/db/drizzle/schema";
import { assignmentApi } from "@/lib/api/assignmentApi";

// Define query keys
export const assignmentKeys = {
  all: ["assignments"] as const,
  details: (id: string) => [...assignmentKeys.all, id] as const,
  lists: () => [...assignmentKeys.all, "list"] as const,
  submissions: (assignmentId: string) =>
    [...assignmentKeys.details(assignmentId), "submissions"] as const,
  submission: (assignmentId: string, submissionId: string) =>
    [...assignmentKeys.submissions(assignmentId), submissionId] as const,
};

// Get all assignments
export function useAssignments() {
  return useQuery({
    queryKey: assignmentKeys.lists(),
    queryFn: () => assignmentApi.getAssignments(),
  });
}

// Get a single assignment
export function useAssignment(id: string | undefined) {
  return useQuery({
    queryKey: assignmentKeys.details(id || ""),
    queryFn: () => (id ? assignmentApi.getAssignment(id) : null),
    enabled: !!id,
  });
}

// Create a new assignment
export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      newAssignment: Omit<Assignment, "id" | "created_at" | "updatedAt"> & {
        created_by: string;
      }
    ) => assignmentApi.createAssignment(newAssignment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
    },
  });
}

// Update an assignment
export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Assignment> }) =>
      assignmentApi.updateAssignment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.details(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
    },
  });
}

// Delete an assignment
export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assignmentApi.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
    },
  });
}

// Get submissions for an assignment
export function useAssignmentSubmissions(assignmentId: string | undefined) {
  return useQuery({
    queryKey: assignmentKeys.submissions(assignmentId || ""),
    queryFn: () =>
      assignmentId ? assignmentApi.getSubmissions(assignmentId) : [],
    enabled: !!assignmentId,
  });
}

// Submit an assignment
export function useSubmitAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      submission: Omit<AssignmentSubmission, "id" | "submittedAt" | "updatedAt">
    ) => assignmentApi.submitAssignment(submission),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.submissions(variables.assignmentId),
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
      assignmentId: string;
      submissionId: string;
      feedback: string;
      grade: number;
    }) => assignmentApi.gradeSubmission(submissionId, feedback, grade),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.submissions(variables.assignmentId),
      });
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.submission(
          variables.assignmentId,
          variables.submissionId
        ),
      });
    },
  });
}

// Download submissions for an assignment
export function useDownloadSubmissions() {
  return useMutation({
    mutationFn: (assignmentId: string) =>
      assignmentApi.downloadSubmissionsCsv(assignmentId),
  });
}
