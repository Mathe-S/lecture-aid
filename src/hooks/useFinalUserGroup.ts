import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
// Assuming FinalGroupWithDetails is exported from the service, or we define a similar one here
import type { FinalGroupWithDetails } from "@/lib/final-group-service";

// --- Query Keys ---
export const finalUserGroupKeys = {
  mine: ["finalUserGroup", "mine"] as const,
  all: ["finalUserGroup", "all"] as const, // Key for all groups query
};

// --- API Helper Function for type safety with fetch ---
async function handleGroupResponse<T>(response: Response): Promise<T> {
  // Specifically handle 404 as null before general error handling
  if (response.status === 404) {
    return null as T; // Important for useUserFinalGroup to return null when not in a group
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})); // Try to get error message from body
    throw new Error(
      errorData.error || `Request failed with status ${response.status}`
    );
  }
  // Handle 204 No Content or cases where response might be empty but OK
  if (response.status === 204) {
    return undefined as T;
  }
  // This check is now redundant due to the one at the top, but harmless if left.
  // if (response.status === 404) {
  //   return null as T;
  // }
  return response.json();
}

// --- API Functions ---

// Fetch current user's final group
async function fetchUserFinalGroup(): Promise<FinalGroupWithDetails | null> {
  const response = await fetch("/api/final/groups/mine");
  // handleGroupResponse will manage 404 to return null
  return handleGroupResponse<FinalGroupWithDetails | null>(response);
}

interface CreateFinalGroupPayload {
  name: string;
  // description?: string; // Optional: if description can be set at creation
}

// Create a new final group
async function createFinalGroupApi(
  groupData: CreateFinalGroupPayload
): Promise<FinalGroupWithDetails> {
  const response = await fetch("/api/final/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(groupData),
  });
  return handleGroupResponse<FinalGroupWithDetails>(response);
}

// Join an existing final group
interface JoinFinalGroupPayload {
  groupId: string;
}
async function joinFinalGroupApi(
  payload: JoinFinalGroupPayload
): Promise<FinalGroupWithDetails> {
  const response = await fetch(`/api/final/groups/${payload.groupId}/join`, {
    method: "POST",
    // No body needed if groupId is in URL and no other payload
  });
  return handleGroupResponse<FinalGroupWithDetails>(response);
}

// Leave the current final group
async function leaveFinalGroupApi(): Promise<{ message: string }> {
  const response = await fetch(`/api/final/groups/leave`, {
    method: "POST",
  });
  return handleGroupResponse<{ message: string }>(response);
}

// Remove a member from a final group (owner action)
interface RemoveFinalGroupMemberPayload {
  groupId: string;
  memberId: string;
}
async function removeFinalGroupMemberApi(
  payload: RemoveFinalGroupMemberPayload
): Promise<FinalGroupWithDetails> {
  const response = await fetch(
    `/api/final/groups/${payload.groupId}/members/${payload.memberId}`,
    {
      method: "DELETE",
    }
  );
  return handleGroupResponse<FinalGroupWithDetails>(response);
}

// Fetch all final groups
async function fetchAllFinalGroups(): Promise<FinalGroupWithDetails[]> {
  const response = await fetch("/api/final/groups/all");
  // handleGroupResponse should correctly return null/empty array or throw error
  const groups = await handleGroupResponse<FinalGroupWithDetails[] | null>(
    response
  );
  return groups || []; // Ensure it always returns an array
}

// Select a project for the final group (owner action)
interface SelectProjectForFinalGroupPayload {
  groupId: string;
  projectId: string;
}
async function selectProjectForFinalGroupApi(
  payload: SelectProjectForFinalGroupPayload
): Promise<FinalGroupWithDetails> {
  const response = await fetch(
    `/api/final/groups/${payload.groupId}/select-project`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: payload.projectId }), // Send projectId in body
    }
  );
  return handleGroupResponse<FinalGroupWithDetails>(response);
}

// --- React Query Hooks ---

/**
 * Hook to fetch the current user's final project group.
 * Returns null if the user is not in a group (handles 404).
 */
export function useUserFinalGroup() {
  return useQuery<FinalGroupWithDetails | null, Error>({
    queryKey: finalUserGroupKeys.mine,
    queryFn: fetchUserFinalGroup,
    // Stale time can be configured if needed, e.g., 5 minutes
    // staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch all final project groups.
 */
export function useAllFinalGroups() {
  return useQuery<FinalGroupWithDetails[], Error>({
    queryKey: finalUserGroupKeys.all,
    queryFn: fetchAllFinalGroups,
    // staleTime: 1000 * 60 * 2, // Optional: consider a short stale time
  });
}

/**
 * Hook to create a new final project group.
 */
export function useCreateFinalGroup() {
  const queryClient = useQueryClient();
  return useMutation<FinalGroupWithDetails, Error, CreateFinalGroupPayload>({
    mutationFn: createFinalGroupApi,
    onSuccess: (data) => {
      toast.success(`Group "${data.name}" created successfully!`);
      // Invalidate the user's group query to refetch and show the new group
      queryClient.invalidateQueries({ queryKey: finalUserGroupKeys.mine });
      // Optionally, directly set the query data if preferred over refetch
      // queryClient.setQueryData(finalUserGroupKeys.mine, data);
    },
    onError: (error) => {
      toast.error(`Failed to create group: ${error.message}`);
    },
  });
}

/**
 * Hook to join an existing final project group.
 */
export function useJoinFinalGroup() {
  const queryClient = useQueryClient();
  return useMutation<FinalGroupWithDetails, Error, JoinFinalGroupPayload>({
    mutationFn: joinFinalGroupApi,
    onSuccess: (data) => {
      toast.success(`Successfully joined group "${data.name}"!`);
      queryClient.invalidateQueries({ queryKey: finalUserGroupKeys.mine });
    },
    onError: (error) => {
      toast.error(`Failed to join group: ${error.message}`);
    },
  });
}

/**
 * Hook to leave the current final project group.
 */
export function useLeaveFinalGroup() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, void>({
    mutationFn: leaveFinalGroupApi,
    onSuccess: (data) => {
      toast.success(data.message || "Successfully left group!");
      queryClient.invalidateQueries({ queryKey: finalUserGroupKeys.mine });
    },
    onError: (error) => {
      toast.error(`Failed to leave group: ${error.message}`);
    },
  });
}

/**
 * Hook for group owners to remove a member from their final project group.
 */
export function useRemoveFinalGroupMember() {
  const queryClient = useQueryClient();
  return useMutation<
    FinalGroupWithDetails,
    Error,
    RemoveFinalGroupMemberPayload
  >({
    mutationFn: removeFinalGroupMemberApi,
    onSuccess: (data) => {
      // 'data' is the updated group details
      // 'variables' contains groupId and memberId
      toast.success(`Member removed successfully from group "${data.name}".`);
      queryClient.invalidateQueries({ queryKey: finalUserGroupKeys.mine });
    },
    onError: (error) => {
      toast.error(`Failed to remove member: ${error.message}`);
    },
  });
}

/**
 * Hook for group owners to select a project for their final group.
 */
export function useSelectProjectForFinalGroup() {
  const queryClient = useQueryClient();
  return useMutation<
    FinalGroupWithDetails,
    Error,
    SelectProjectForFinalGroupPayload
  >({
    mutationFn: selectProjectForFinalGroupApi,
    onSuccess: (data) => {
      toast.success(
        `Project "${
          data.selectedProject?.title || "Unknown"
        }" selected for group "${data.name}".`
      );
      queryClient.invalidateQueries({ queryKey: finalUserGroupKeys.mine });
      queryClient.invalidateQueries({ queryKey: finalUserGroupKeys.all }); // Invalidate all groups list as well
      // Optionally, update the specific group in the cache directly for 'allGroups' query
    },
    onError: (error) => {
      toast.error(`Failed to select project: ${error.message}`);
    },
  });
}

/**
 * Hook for group owners to update repository information for their final group.
 */
export function useUpdateGroupRepository() {
  const queryClient = useQueryClient();
  return useMutation<
    FinalGroupWithDetails,
    Error,
    { groupId: string; repositoryUrl: string }
  >({
    mutationFn: async ({ groupId, repositoryUrl }) => {
      const response = await fetch(`/api/final/groups/${groupId}/repository`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryUrl }),
      });
      return handleGroupResponse<FinalGroupWithDetails>(response);
    },
    onSuccess: (data) => {
      toast.success(
        `Repository ${
          data.repositoryUrl ? "linked" : "unlinked"
        } successfully for group "${data.name}".`
      );
      queryClient.invalidateQueries({ queryKey: finalUserGroupKeys.mine });
      queryClient.invalidateQueries({ queryKey: finalUserGroupKeys.all });
    },
    onError: (error) => {
      toast.error(`Failed to update repository: ${error.message}`);
    },
  });
}
