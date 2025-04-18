import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Assignment, AssignmentSubmission } from "@/db/drizzle/schema";
import { assignmentApi } from "@/lib/api/assignmentApi";
import { toast } from "sonner";

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
    // Optimistic Update Logic
    onMutate: async (assignmentIdToDelete: string) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: assignmentKeys.lists() });

      // Snapshot the previous value
      const previousAssignments = queryClient.getQueryData<Assignment[]>(
        assignmentKeys.lists()
      );

      // Optimistically remove the assignment from the list
      if (previousAssignments) {
        queryClient.setQueryData<Assignment[]>(
          assignmentKeys.lists(),
          previousAssignments.filter(
            (assignment) => assignment.id !== assignmentIdToDelete
          )
        );
      }

      // Return a context object with the snapshotted value
      return { previousAssignments };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, _variables, context) => {
      console.error("Error deleting assignment:", err);
      toast.error("Failed to delete assignment. Restoring list.");
      if (context?.previousAssignments) {
        queryClient.setQueryData<Assignment[]>(
          assignmentKeys.lists(),
          context.previousAssignments
        );
      }
    },
    // Always refetch after error or success:
    onSettled: () => {
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

// Close an assignment
export function useCloseAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assignmentApi.closeAssignment(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.details(variables),
      });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
    },
  });
}

// Upload grades JSON for an assignment
export function useUploadGradesJson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assignmentId,
      gradesData,
    }: {
      assignmentId: string;
      gradesData: any;
    }) => assignmentApi.uploadGradesJson(assignmentId, gradesData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.details(variables.assignmentId),
      });
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.submissions(variables.assignmentId),
      });
    },
  });
}

// Upload single student grade JSON for an assignment
export function useUploadSingleGradeJson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assignmentId,
      studentId, // This is the student's email
      gradesData,
    }: {
      assignmentId: string;
      studentId: string;
      gradesData: any;
    }) =>
      assignmentApi.uploadSingleGradeJson(assignmentId, studentId, gradesData),
    onSuccess: (_, variables) => {
      // Invalidate queries related to the assignment and its submissions
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.details(variables.assignmentId),
      });
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.submissions(variables.assignmentId),
      });
      // Optionally, if you have a query for a specific submission by user email/ID,
      // you might invalidate that too, though invalidating the whole list
      // often covers it.
    },
  });
}

// Admin submit an assignment on behalf of a student
export function useAdminSubmitAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    // Use the existing submitAssignment API function
    // The API route handles the authorization logic
    mutationFn: (
      submission: Omit<
        AssignmentSubmission,
        "id" | "submittedAt" | "updatedAt" | "feedback" | "grade"
      >
    ) => assignmentApi.submitAssignment(submission),
    onSuccess: (_, variables) => {
      // Invalidate submissions for the specific assignment
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.submissions(variables.assignmentId),
      });
      // Optionally invalidate details if needed
      // queryClient.invalidateQueries({
      //   queryKey: assignmentKeys.details(variables.assignmentId),
      // });
    },
  });
}
