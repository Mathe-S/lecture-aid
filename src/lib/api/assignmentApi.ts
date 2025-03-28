import {
  Assignment,
  AssignmentSubmission,
  AssignmentSubmissionWithProfile,
} from "@/db/drizzle/schema";

// API Responses
export type GetAssignmentResponse = Assignment;
export type CreateAssignmentResponse = Assignment;
export type UpdateAssignmentResponse = Assignment;

// API Error
export interface ApiError {
  error: string;
  status?: number;
}

// Assignment API
export const assignmentApi = {
  getAssignments: async (): Promise<Assignment[]> => {
    const response = await fetch("/api/assignments");
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch assignments");
    }
    return response.json();
  },

  getAssignment: async (id: string): Promise<GetAssignmentResponse> => {
    const response = await fetch(`/api/assignments/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch assignment");
    }
    return response.json();
  },

  createAssignment: async (
    assignmentData: Omit<Assignment, "id" | "created_at" | "updatedAt"> & {
      created_by: string;
    }
  ): Promise<CreateAssignmentResponse> => {
    const response = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignmentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create assignment");
    }

    return response.json();
  },

  updateAssignment: async (
    id: string,
    assignmentData: Partial<Assignment>
  ): Promise<UpdateAssignmentResponse> => {
    const response = await fetch(`/api/assignments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignmentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update assignment");
    }

    return response.json();
  },

  deleteAssignment: async (id: string): Promise<{ success: boolean }> => {
    const response = await fetch(`/api/assignments/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete assignment");
    }

    return response.json();
  },

  // Assignment submissions
  getSubmissions: async (
    assignmentId: string
  ): Promise<AssignmentSubmissionWithProfile[]> => {
    const response = await fetch(
      `/api/assignments/${assignmentId}/submissions`
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch submissions");
    }
    return response.json();
  },

  submitAssignment: async (
    submission: Omit<
      AssignmentSubmission,
      "id" | "submittedAt" | "updatedAt" | "feedback" | "grade"
    >
  ): Promise<AssignmentSubmission> => {
    const response = await fetch(
      `/api/assignments/${submission.assignmentId}/submissions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit assignment");
    }

    return response.json();
  },

  gradeSubmission: async (
    submissionId: string,
    feedback: string,
    grade: number
  ): Promise<AssignmentSubmission> => {
    const response = await fetch(`/api/submissions/${submissionId}/grade`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback, grade }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to grade submission");
    }

    return response.json();
  },

  getSubmission: async (
    submissionId: string
  ): Promise<AssignmentSubmissionWithProfile> => {
    const response = await fetch(`/api/submissions/${submissionId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch submission");
    }
    return response.json();
  },

  getUserSubmission: async (
    assignmentId: string,
    userId: string
  ): Promise<AssignmentSubmission | null> => {
    const response = await fetch(
      `/api/assignments/${assignmentId}/submissions/user/${userId}`
    );
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch user submission");
    }
    return response.json();
  },

  downloadSubmissionsCsv: async (assignmentId: string): Promise<Blob> => {
    const response = await fetch(
      `/api/assignments/${assignmentId}/submissions/download`
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to download submissions");
    }
    return response.blob();
  },
};
