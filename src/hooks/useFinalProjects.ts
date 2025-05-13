import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { FinalProject, NewFinalProject } from "@/db/drizzle/final-schema"; // Assuming types are exported
import type { FinalProjectWithAdmin } from "@/lib/final-project-service"; // Type from service

// --- Query Keys ---
export const finalProjectKeys = {
  all: ["finalProjects"] as const,
  detail: (projectId: string) => [...finalProjectKeys.all, projectId] as const,
};

// --- API Helper Functions using fetch ---

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})); // Try to parse error, default to empty obj
    throw new Error(
      errorData.error || `Request failed with status ${response.status}`
    );
  }
  // For 204 No Content, response.json() will fail. Handle it before parsing.
  if (response.status === 204) {
    return undefined as T; // Or an appropriate value for void/boolean responses
  }
  return response.json();
}

// Fetch all final projects
async function fetchFinalProjects(): Promise<FinalProjectWithAdmin[]> {
  const response = await fetch("/api/final/projects");
  return handleResponse<FinalProjectWithAdmin[]>(response);
}

// Fetch a single final project by ID
async function fetchFinalProjectById(
  projectId: string
): Promise<FinalProjectWithAdmin> {
  const response = await fetch(`/api/final/projects/${projectId}`);
  return handleResponse<FinalProjectWithAdmin>(response);
}

// Create a new final project
async function createFinalProjectApi(
  projectData: Omit<
    NewFinalProject,
    "createdByAdminId" | "id" | "createdAt" | "updatedAt"
  >
): Promise<FinalProject> {
  const response = await fetch("/api/final/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(projectData),
  });
  return handleResponse<FinalProject>(response);
}

// Update a final project
async function updateFinalProjectApi(
  projectId: string,
  projectData: Partial<
    Omit<NewFinalProject, "createdByAdminId" | "id" | "createdAt" | "updatedAt">
  >
): Promise<FinalProject> {
  const response = await fetch(`/api/final/projects/${projectId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(projectData),
  });
  return handleResponse<FinalProject>(response);
}

// Delete a final project
async function deleteFinalProjectApi(projectId: string): Promise<void> {
  const response = await fetch(`/api/final/projects/${projectId}`, {
    method: "DELETE",
  });
  // For DELETE, we expect a 204 No Content or handle other statuses
  if (!response.ok && response.status !== 204) {
    // Allow 204 as ok for delete
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Request failed with status ${response.status}`
    );
  }
  // No need to parse JSON for a successful delete (204)
}

// --- React Query Hooks ---

/**
 * Hook to fetch all final projects.
 */
export function useFinalProjects() {
  return useQuery<FinalProjectWithAdmin[], Error>({
    queryKey: finalProjectKeys.all,
    queryFn: fetchFinalProjects,
  });
}

/**
 * Hook to fetch a single final project by its ID.
 */
export function useFinalProject(projectId: string | null | undefined) {
  return useQuery<FinalProjectWithAdmin, Error>({
    queryKey: finalProjectKeys.detail(projectId || ""),
    queryFn: () => fetchFinalProjectById(projectId!),
    enabled: !!projectId, // Only run query if projectId is truthy
  });
}

/**
 * Hook to create a new final project.
 */
export function useCreateFinalProject() {
  const queryClient = useQueryClient();
  return useMutation<
    FinalProject,
    Error,
    Omit<NewFinalProject, "createdByAdminId" | "id" | "createdAt" | "updatedAt">
  >({
    mutationFn: createFinalProjectApi,
    onSuccess: (data) => {
      toast.success(`Final project "${data.title}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: finalProjectKeys.all });
    },
    onError: (error) => {
      toast.error(`Failed to create final project: ${error.message}`);
    },
  });
}

/**
 * Hook to update an existing final project.
 */
export function useUpdateFinalProject() {
  const queryClient = useQueryClient();
  return useMutation<
    FinalProject,
    Error,
    {
      projectId: string;
      data: Partial<
        Omit<
          NewFinalProject,
          "createdByAdminId" | "id" | "createdAt" | "updatedAt"
        >
      >;
    }
  >({
    mutationFn: ({ projectId, data }) => updateFinalProjectApi(projectId, data),
    onSuccess: (updatedProject, variables) => {
      toast.success(
        `Final project "${updatedProject.title}" updated successfully!`
      );
      queryClient.invalidateQueries({ queryKey: finalProjectKeys.all });
      queryClient.invalidateQueries({
        queryKey: finalProjectKeys.detail(variables.projectId),
      });
      queryClient.setQueryData(
        finalProjectKeys.detail(variables.projectId),
        updatedProject
      );
    },
    onError: (error, variables) => {
      toast.error(
        `Failed to update project (ID: ${variables.projectId}): ${error.message}`
      );
    },
  });
}

/**
 * Hook to delete a final project.
 */
export function useDeleteFinalProject() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteFinalProjectApi,
    onSuccess: (_, projectId) => {
      toast.success("Final project deleted successfully!");
      queryClient.invalidateQueries({ queryKey: finalProjectKeys.all });
      queryClient.removeQueries({
        queryKey: finalProjectKeys.detail(projectId),
      });
    },
    onError: (error, projectId) => {
      toast.error(
        `Failed to delete project (ID: ${projectId}): ${error.message}`
      );
    },
  });
}
