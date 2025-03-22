import { Assignment, AssignmentSubmission } from "@/db/drizzle/schema";

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
  ): Promise<AssignmentSubmission[]> => {
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
    submission: Omit<AssignmentSubmission, "id" | "submittedAt" | "updatedAt">
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
    assignmentId: string,
    submissionId: string,
    feedback: string,
    grade: number
  ): Promise<AssignmentSubmission> => {
    const response = await fetch(
      `/api/assignments/${assignmentId}/submissions/${submissionId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback, grade }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to grade submission");
    }

    return response.json();
  },
};
