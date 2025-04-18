import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import {
  MidtermGroup,
  MidtermGroupWithDetails,
  MidtermGroupWithProgress,
  MidtermTask,
  MidtermEvaluation,
} from "@/db/drizzle/midterm-schema";
import { toast } from "sonner";

// Consistent query key structure
export const midtermKeys = {
  all: ["midterm"] as const,
  groups: () => [...midtermKeys.all, "groups"] as const,
  group: (id: string) => [...midtermKeys.groups(), id] as const,
  evaluations: () => [...midtermKeys.all, "evaluations"] as const,
  evaluation: (groupId: string, userId: string) =>
    [...midtermKeys.evaluations(), groupId, userId] as const,
};

// --- Helper Fetch Functions (Similar to original pattern) ---

const fetchGroups = async (): Promise<MidtermGroupWithProgress[]> => {
  const response = await fetch("/api/midterm/groups"); // Target the API route
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch groups");
  }
  return response.json();
};

const fetchGroupDetails = async (
  groupId: string
): Promise<MidtermGroupWithDetails | null> => {
  const response = await fetch(`/api/midterm/groups/${groupId}`); // Target the API route
  if (!response.ok) {
    if (response.status === 404) return null;
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch group details");
  }
  return response.json();
};

// --- React Query Hooks ---

// Fetch all groups (with progress)
export function useMidtermGroups(): UseQueryResult<
  MidtermGroupWithProgress[],
  Error
> {
  return useQuery({
    queryKey: midtermKeys.groups(),
    queryFn: fetchGroups, // Use the fetch helper
  });
}

// Fetch single group details (with tasks)
export function useMidtermGroupDetails(
  groupId: string | null
): UseQueryResult<MidtermGroupWithDetails | null, Error> {
  return useQuery({
    queryKey: midtermKeys.group(groupId!), // Use the function
    queryFn: () => fetchGroupDetails(groupId!), // Use the fetch helper
    enabled: !!groupId,
  });
}

// --- Mutations ---

// Create Group
export function useCreateMidtermGroup(): UseMutationResult<
  MidtermGroup,
  Error,
  { name: string; description?: string },
  unknown
> {
  const queryClient = useQueryClient();
  // Remove useAuth here unless needed for optimistic updates (unlikely for create)

  return useMutation({
    // This mutationFn assumes a POST /api/midterm/groups endpoint handles creation
    mutationFn: async ({ name, description }) => {
      const response = await fetch("/api/midterm/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
    },
  });
}

// Join Group
export function useJoinMidtermGroup(): UseMutationResult<
  boolean,
  Error,
  string, // groupId
  unknown
> {
  const queryClient = useQueryClient();
  // Remove useAuth here, API route handles user ID

  return useMutation({
    // Assumes POST /api/midterm/groups/[id]/join
    mutationFn: async (groupId) => {
      const response = await fetch(`/api/midterm/groups/${groupId}/join`, {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to join group");
      }
      // Assuming API returns 200 OK on success, maybe no body needed or boolean?
      return response.ok; // Or handle specific success response
    },
    onSuccess: (data, groupId) => {
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
      queryClient.invalidateQueries({ queryKey: midtermKeys.group(groupId) });
    },
  });
}

// Connect Repository
// This likely needs adjustment - the mutation currently calls apiConnectRepository directly
// Should probably call an API endpoint e.g., POST /api/midterm/groups/[id]/connect
export function useConnectRepository(): UseMutationResult<
  void,
  Error,
  { groupId: string; repositoryUrl: string },
  unknown
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, repositoryUrl }) => {
      const response = await fetch(`/api/midterm/groups/${groupId}/connect`, {
        // Changed endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryUrl }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to connect repository");
      }
      // No return needed for void
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: midtermKeys.group(variables.groupId),
      });
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
    },
  });
}

// Update Repository
// Similar to connect, should call an API endpoint e.g., PUT /api/midterm/groups/[id]/connect
export function useUpdateRepository(): UseMutationResult<
  MidtermGroup | null, // API might return updated group or just success
  Error,
  { groupId: string; repositoryUrl: string },
  unknown
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, repositoryUrl }) => {
      const response = await fetch(`/api/midterm/groups/${groupId}/connect`, {
        // Changed endpoint
        method: "PUT", // Use PUT for update
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryUrl }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update repository");
      }
      return response.json(); // Assuming API returns updated group
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: midtermKeys.group(variables.groupId),
      });
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
    },
  });
}

// Update Group Details (Name/Description)
// Assumes PUT /api/midterm/groups/[id]
export function useUpdateMidtermGroup(): UseMutationResult<
  MidtermGroup | null,
  Error,
  { groupId: string; name?: string; description?: string },
  unknown
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, name, description }) => {
      const response = await fetch(`/api/midterm/groups/${groupId}`, {
        // Changed endpoint
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update group details");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: midtermKeys.group(variables.groupId),
      });
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
    },
  });
}

// Leave Group
// Assumes DELETE /api/midterm/groups/[id]/leave
export function useLeaveGroup(): UseMutationResult<
  boolean,
  Error,
  string, // groupId
  unknown
> {
  const queryClient = useQueryClient();
  // Remove useAuth, API handles user
  return useMutation({
    mutationFn: async (groupId) => {
      const response = await fetch(`/api/midterm/groups/${groupId}/leave`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to leave group");
      }
      return response.ok;
    },
    onSuccess: (data, groupId) => {
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
      queryClient.removeQueries({ queryKey: midtermKeys.group(groupId) });
    },
  });
}

// Delete Group
// Assumes DELETE /api/midterm/groups/[id]
export function useDeleteMidtermGroup(): UseMutationResult<
  boolean,
  Error,
  string, // groupId
  unknown
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId) => {
      const response = await fetch(`/api/midterm/groups/${groupId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete group");
      }
      return response.ok;
    },
    onSuccess: (data, groupId) => {
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
      queryClient.removeQueries({ queryKey: midtermKeys.group(groupId) });
    },
  });
}

// Upload TODO List (This one was already correct, using fetch)
export function useUploadTodo(): UseMutationResult<
  { message: string; taskCount: number },
  Error,
  { groupId: string; markdownContent: string },
  unknown
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, markdownContent }) => {
      const response = await fetch(`/api/midterm/groups/${groupId}/todo`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: markdownContent,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload TODO list");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: midtermKeys.group(variables.groupId),
      });
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
    },
  });
}

// Update Task Status (This one was already correct, using fetch)
export function useUpdateTaskStatus(): UseMutationResult<
  MidtermTask,
  Error,
  { taskId: string; isChecked: boolean; groupId: string },
  { previousGroupData?: MidtermGroupWithDetails | null }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, isChecked }) => {
      const response = await fetch(`/api/midterm/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isChecked }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update task status");
      }
      return response.json();
    },
    onMutate: async (newTaskData) => {
      await queryClient.cancelQueries({
        queryKey: midtermKeys.group(newTaskData.groupId),
      });
      const previousGroupData =
        queryClient.getQueryData<MidtermGroupWithDetails | null>(
          midtermKeys.group(newTaskData.groupId)
        );

      queryClient.setQueryData<MidtermGroupWithDetails | undefined>(
        midtermKeys.group(newTaskData.groupId),
        (old) => {
          if (!old || !old.tasks) return old;
          return {
            ...old,
            tasks: old.tasks.map((task) =>
              task.id === newTaskData.taskId
                ? { ...task, isChecked: newTaskData.isChecked }
                : task
            ),
          };
        }
      );
      return { previousGroupData };
    },
    onError: (err, newTaskData, context) => {
      if (context?.previousGroupData !== undefined) {
        queryClient.setQueryData(
          midtermKeys.group(newTaskData.groupId),
          context.previousGroupData
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: midtermKeys.group(variables.groupId),
      });
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
    },
  });
}

// --- Admin Hooks ---

// Hook to save/update an evaluation (Admin)
// Assumes POST /api/admin/midterm/evaluations
export function useSaveEvaluation(): UseMutationResult<
  MidtermEvaluation, // Assuming API returns the saved/updated evaluation
  Error,
  {
    // Input variables type
    groupId: string;
    userId: string;
    scores: {
      specScore: number;
      testScore: number;
      implementationScore: number;
      documentationScore: number;
      gitWorkflowScore: number;
    };
    feedback: string;
  },
  unknown // Context type
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (evaluationData) => {
      const response = await fetch(`/api/admin/midterm/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evaluationData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save evaluation");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast.success("Evaluation saved successfully!");
      // Invalidate the specific evaluation query
      queryClient.invalidateQueries({
        queryKey: midtermKeys.evaluation(variables.groupId, variables.userId),
      });
      // Optionally invalidate group details if evaluation affects it
      // queryClient.invalidateQueries({ queryKey: midtermKeys.group(variables.groupId) });
    },
    onError: (error: Error) => {
      toast.error("Failed to save evaluation", { description: error.message });
    },
  });
}

// Hook to fetch a specific evaluation (Admin)
// Assumes GET /api/admin/midterm/evaluations?groupId=...&userId=...
export function useEvaluation(
  groupId?: string,
  userId?: string
): UseQueryResult<MidtermEvaluation | null, Error> {
  return useQuery({
    queryKey: midtermKeys.evaluation(groupId!, userId!),
    queryFn: async () => {
      if (!groupId || !userId) return null; // Don't fetch if IDs are missing
      const response = await fetch(
        `/api/admin/midterm/evaluations?groupId=${groupId}&userId=${userId}`
      );
      if (!response.ok) {
        if (response.status === 404) return null; // Evaluation might not exist yet
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch evaluation");
      }
      return response.json();
    },
    enabled: !!groupId && !!userId, // Only run when both IDs are provided
    retry: false, // Don't retry if it fails (e.g., 404)
  });
}

// Hook to trigger repository sync (Admin)
// Assumes POST /api/admin/midterm/groups/[id]/sync
export function useSyncRepository(): UseMutationResult<
  void, // Assuming API returns no body on success
  Error,
  string, // groupId
  unknown
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId) => {
      const response = await fetch(
        `/api/admin/midterm/groups/${groupId}/sync`,
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to initiate sync");
      }
      // No return needed for void
    },
    onSuccess: (data, groupId) => {
      toast.success("Repository sync initiated.", {
        description: "Data update may take a few moments.",
      });
      // Invalidate group details to reflect potential updates after sync
      queryClient.invalidateQueries({ queryKey: midtermKeys.group(groupId) });
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() }); // Also list potentially?
    },
    onError: (error: Error) => {
      toast.error("Failed to initiate sync", { description: error.message });
    },
  });
}
