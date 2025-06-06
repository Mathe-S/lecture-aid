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
  MidtermGroupWithMembers,
  MidtermGroupWithProgress,
  MidtermTask,
  MidtermEvaluation,
  MemberWithProfileAndEvaluationStatus,
  MidtermEvaluationWithGroup,
} from "@/db/drizzle/midterm-schema";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

// Consistent query key structure
export const midtermKeys = {
  all: ["midterm"] as const,
  groups: () => [...midtermKeys.all, "groups"] as const,
  group: (id: string) => [...midtermKeys.groups(), id] as const,
  evaluations: () => [...midtermKeys.all, "evaluations"] as const,
  evaluation: (groupId: string, userId: string) =>
    [...midtermKeys.evaluations(), groupId, userId] as const,
  userEvaluations: (userId: string) =>
    [...midtermKeys.evaluations(), "user", userId] as const,
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

// Create Group (Ensure it returns the created group)
export function useCreateMidtermGroup(): UseMutationResult<
  MidtermGroup, // Expecting the created group object back
  Error,
  { name: string; description?: string },
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }): Promise<MidtermGroup> => {
      // Return MidtermGroup
      const response = await fetch("/api/midterm/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create group");
      }
      return response.json(); // Assume API returns the created group
    },
    onSuccess: () => {
      // Invalidate the list to refetch
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
      // Optionally, add the new group to the cache immediately if desired
      // queryClient.setQueryData<MidtermGroupWithMembers[]>(midtermKeys.groups(), (old) =>
      //   old ? [...old, { ...createdGroup, members: [/* construct owner member */] }] : [/* new group */]
      // );
    },
    onError: (error) => {
      toast.error(`Failed to create group: ${error.message}`);
    },
  });
}

// Join Group with Optimistic Update
export function useJoinMidtermGroup(): UseMutationResult<
  boolean,
  Error,
  string, // groupId
  { previousGroups?: MidtermGroupWithProgress[] } // Context type
> {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (groupId): Promise<boolean> => {
      const response = await fetch(`/api/midterm/groups/${groupId}/join`, {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to join group");
      }
      return response.ok;
    },
    onMutate: async (groupId) => {
      if (!user) {
        console.warn("User not available for optimistic join update.");
        return {};
      }
      const queryKey = midtermKeys.groups();
      await queryClient.cancelQueries({ queryKey });
      const previousGroups =
        queryClient.getQueryData<MidtermGroupWithProgress[]>(queryKey);

      if (previousGroups && user) {
        queryClient.setQueryData<MidtermGroupWithProgress[]>(
          queryKey,
          (oldData) => {
            if (!oldData) return [];
            return oldData.map((group) => {
              if (
                group.id === groupId &&
                !group.members?.some((m) => m.userId === user.id)
              ) {
                const now = new Date().toISOString();
                const newMember: MemberWithProfileAndEvaluationStatus = {
                  profile: {
                    id: user.id,
                    createdAt: now,
                    updatedAt: now,
                    email: user.email ?? null,
                    fullName:
                      user.user_metadata?.full_name ??
                      user.email ??
                      "New Member",
                    avatarUrl: user.user_metadata?.avatar_url ?? null,
                  },
                  id: `optimistic-${Date.now()}`,
                  groupId: group.id,
                  userId: user.id,
                  role: "member",
                  joinedAt: now,
                  isEvaluated: false,
                };

                const existingMembers: MemberWithProfileAndEvaluationStatus[] =
                  group.members || [];
                const updatedMembers = [...existingMembers, newMember];

                return {
                  ...group,
                  members: updatedMembers,
                };
              }
              return group;
            });
          }
        );
      } else {
        console.warn(
          "Previous group data not found or user not available, skipping optimistic join update."
        );
      }
      return { previousGroups };
    },
    onError: (err, groupId, context) => {
      toast.error(`Failed to join group: ${err.message}`);
      if (context?.previousGroups) {
        queryClient.setQueryData(midtermKeys.groups(), context.previousGroups);
      }
    },
    onSettled: (data, error, groupId) => {
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
      queryClient.invalidateQueries({ queryKey: midtermKeys.group(groupId) });
    },
  });
}

// Update Group Details (Name/Description/Repo URL)
export function useUpdateMidtermGroup(): UseMutationResult<
  MidtermGroup | null,
  Error,
  {
    groupId: string;
    name?: string;
    description?: string;
    repositoryUrl?: string;
  },
  unknown
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, name, description, repositoryUrl }) => {
      const response = await fetch(`/api/midterm/groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, repositoryUrl }),
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

// Leave Group with Optimistic Update
export function useLeaveGroup(): UseMutationResult<
  boolean,
  Error,
  string, // groupId
  { previousGroups?: MidtermGroupWithMembers[] } // Context type
> {
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Get user context

  return useMutation({
    mutationFn: async (groupId): Promise<boolean> => {
      const response = await fetch(`/api/midterm/groups/${groupId}/leave`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to leave group");
      }
      return response.ok;
    },
    onMutate: async (groupId) => {
      if (!user) {
        console.warn("User not available for optimistic leave update.");
        return {}; // Skip optimistic update if user isn't loaded
        // Or: throw new Error("User not authenticated for optimistic update.");
      }
      const queryKey = midtermKeys.groups();
      await queryClient.cancelQueries({ queryKey });
      const previousGroups =
        queryClient.getQueryData<MidtermGroupWithMembers[]>(queryKey);

      if (previousGroups && user) {
        // Check user again
        queryClient.setQueryData<MidtermGroupWithMembers[]>(
          queryKey,
          (oldData) => {
            if (!oldData) return [];
            return oldData.map((group) => {
              if (group.id === groupId) {
                return {
                  ...group,
                  members: (group.members || []).filter(
                    (member) => member.userId !== user.id
                  ),
                };
              }
              return group;
            });
          }
        );
      } else {
        console.warn(
          "Previous group data not found or user not available, skipping optimistic leave update."
        );
      }
      return { previousGroups };
    },
    onError: (err, groupId, context) => {
      toast.error(`Failed to leave group: ${err.message}`);
      if (context?.previousGroups) {
        queryClient.setQueryData(midtermKeys.groups(), context.previousGroups);
      }
    },
    onSettled: (data, error, groupId) => {
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
      queryClient.invalidateQueries({ queryKey: midtermKeys.group(groupId) });
    },
  });
}

// Delete Group
// Assumes DELETE /api/midterm/groups/[id]
export function useDeleteMidtermGroup(): UseMutationResult<
  boolean,
  Error,
  string, // groupId
  { previousGroups?: MidtermGroupWithProgress[] } // Optimistic context
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId): Promise<boolean> => {
      const response = await fetch(`/api/midterm/groups/${groupId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete group");
      }
      return response.ok;
    },
    onMutate: async (groupId) => {
      const queryKey = midtermKeys.groups();
      await queryClient.cancelQueries({ queryKey });
      const previousGroups =
        queryClient.getQueryData<MidtermGroupWithProgress[]>(queryKey);

      if (previousGroups) {
        queryClient.setQueryData<MidtermGroupWithProgress[]>(
          queryKey,
          (old) => old?.filter((g) => g.id !== groupId) ?? []
        );
      } else {
        console.warn(
          "Previous group data not found, skipping optimistic delete update."
        );
      }
      return { previousGroups };
    },
    onError: (err, groupId, context) => {
      toast.error(`Failed to delete group: ${err.message}`);
      if (context?.previousGroups) {
        queryClient.setQueryData(midtermKeys.groups(), context.previousGroups);
      }
    },
    onSettled: (data, error, groupId) => {
      // Remove the specific group query if it exists
      queryClient.removeQueries({ queryKey: midtermKeys.group(groupId) });
      // Invalidate the list
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
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

// --- User-Specific Hooks ---

// Hook to fetch evaluations for the current user
export function useUserMidtermEvaluations(): UseQueryResult<
  MidtermEvaluationWithGroup[],
  Error
> {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: midtermKeys.userEvaluations(userId!), // Use specific user key
    queryFn: async () => {
      if (!userId) return []; // Return empty if no user
      const response = await fetch("/api/midterm/evaluations/me");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to fetch user midterm evaluations"
        );
      }
      return response.json();
    },
    enabled: !!userId, // Only run when userId is available
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
