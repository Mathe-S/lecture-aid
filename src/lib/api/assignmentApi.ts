import {
  Assignment,
  AssignmentSubmission,
  AssignmentSubmissionWithProfile,
  AssignmentCustomField,
} from "@/db/drizzle/schema";

// API Responses
export type GetAssignmentResponse = Assignment & {
  customFields?: AssignmentCustomField[];
};
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
      customFields?: Array<{ label: string }>;
    }
  ): Promise<CreateAssignmentResponse> => {
    const response = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...assignmentData,
        grade: assignmentData.grade || 3, // Ensure grade is included
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create assignment");
    }

    return response.json();
  },

  updateAssignment: async (
    id: string,
    assignmentData: Partial<Assignment> & {
      customFields?: Array<{ label: string }>;
    }
  ): Promise<UpdateAssignmentResponse> => {
    const response = await fetch(`/api/assignments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...assignmentData,
        grade: assignmentData.grade !== undefined ? assignmentData.grade : 3, // Ensure grade is included for partial updates
      }),
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
    > & { customAnswers?: Array<{ customFieldId: string; value: string }> }
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

  // Close an assignment
  closeAssignment: async (id: string): Promise<Assignment> => {
    const response = await fetch(`/api/assignments/${id}/close`, {
      method: "PUT",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to close assignment");
    }

    return response.json();
  },

  // Upload grades JSON for an assignment
  uploadGradesJson: async (
    assignmentId: string,
    gradesData: any
  ): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/assignments/${assignmentId}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gradesData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload grades");
    }

    return response.json();
  },

  // Upload grades JSON for a single student
  uploadSingleGradeJson: async (
    assignmentId: string,
    studentId: string, // This should be the student's email
    gradesData: any
  ): Promise<{ success: boolean; message: string }> => {
    // The gradesData should still contain the 'students' array,
    // but the backend will only process the one matching studentId.
    const response = await fetch(
      `/api/assignments/${assignmentId}/grade/${encodeURIComponent(studentId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradesData }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload single student grade");
    }

    return response.json();
  },
};
