import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MidtermGroup,
  MidtermGroupWithMembers,
  MidtermGroupWithDetails,
} from "@/db/drizzle/midterm-schema";

// Query keys for midterm groups
export const midtermKeys = {
  all: ["midterm"] as const,
  groups: () => [...midtermKeys.all, "groups"] as const,
  group: (id: string) => [...midtermKeys.groups(), id] as const,
};

// Fetch all midterm groups
const fetchGroups = async (): Promise<MidtermGroupWithMembers[]> => {
  const response = await fetch("/api/midterm/groups");
  if (!response.ok) {
    throw new Error("Failed to fetch groups");
  }
  return response.json();
};

// Fetch a single midterm group with details
const fetchGroupDetails = async (
  id: string
): Promise<MidtermGroupWithDetails> => {
  const response = await fetch(`/api/midterm/groups/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch group details");
  }
  return response.json();
};

// Create a new midterm group
const createGroup = async ({
  name,
  description,
}: {
  name: string;
  description?: string;
}): Promise<MidtermGroup> => {
  const response = await fetch("/api/midterm/groups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to create group");
  }

  return response.json();
};

// Join an existing midterm group
const joinGroup = async (id: string): Promise<void> => {
  const response = await fetch(`/api/midterm/groups/${id}/join`, {
    method: "POST",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to join group");
  }
};

// Connect a GitHub repository to a midterm group
const connectRepository = async ({
  groupId,
  repositoryUrl,
}: {
  groupId: string;
  repositoryUrl: string;
}): Promise<void> => {
  const response = await fetch(`/api/midterm/groups/${groupId}/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ repositoryUrl }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to connect repository");
  }
};

// Update an existing repository connection
const updateRepository = async ({
  groupId,
  repositoryUrl,
}: {
  groupId: string;
  repositoryUrl: string;
}): Promise<void> => {
  const response = await fetch(`/api/midterm/groups/${groupId}/sync`, {
    method: "PUT", // Use PUT or PATCH for updates
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ repositoryUrl }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to update repository");
  }
};

// Leave a midterm group
const leaveGroup = async (id: string): Promise<void> => {
  const response = await fetch(`/api/midterm/groups/${id}/leave`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to leave group");
  }
};

// Delete a midterm group
const deleteGroupAPI = async (id: string): Promise<void> => {
  const response = await fetch(`/api/midterm/groups/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to delete group");
  }
};

// Update group name/description
const updateGroupAPI = async ({
  groupId,
  name,
  description,
}: {
  groupId: string;
  name: string;
  description?: string;
}): Promise<MidtermGroup> => {
  const response = await fetch(`/api/midterm/groups/${groupId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to update group");
  }
  return response.json();
};

// Hook to fetch all midterm groups
export function useMidtermGroups() {
  return useQuery({
    queryKey: midtermKeys.groups(),
    queryFn: fetchGroups,
  });
}

// Hook to fetch a single midterm group with details
export function useMidtermGroupDetails(id: string) {
  return useQuery({
    queryKey: midtermKeys.group(id),
    queryFn: () => fetchGroupDetails(id),
    enabled: !!id,
  });
}

// Hook to create a new midterm group
export function useCreateMidtermGroup() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const mutation = useMutation({
    mutationFn: createGroup,
    onMutate: () => {
      setIsCreating(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
      toast.success("Group created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create group", {
        description: error.message,
      });
    },
    onSettled: () => {
      setIsCreating(false);
    },
  });

  return {
    createGroup: mutation.mutateAsync,
    isLoading: isCreating,
  };
}

// Hook to join a midterm group
export function useJoinMidtermGroup() {
  const queryClient = useQueryClient();
  const [isJoining, setIsJoining] = useState(false);

  const mutation = useMutation({
    mutationFn: joinGroup,
    onMutate: () => {
      setIsJoining(true);
    },
    onSuccess: (_data, groupId) => {
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
      queryClient.invalidateQueries({ queryKey: midtermKeys.group(groupId) });
      toast.success("Joined group successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to join group", {
        description: error.message,
      });
    },
    onSettled: () => {
      setIsJoining(false);
    },
  });

  return {
    joinGroup: mutation.mutateAsync,
    isLoading: isJoining,
  };
}

// Hook to connect a GitHub repository to a midterm group
export function useConnectRepository() {
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  const mutation = useMutation({
    mutationFn: connectRepository,
    onMutate: () => {
      setIsConnecting(true);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: midtermKeys.group(variables.groupId),
      });
      toast.success("Repository connected successfully", {
        description:
          "Data sync has been initiated and may take a moment to complete.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to connect repository", {
        description: error.message,
      });
    },
    onSettled: () => {
      setIsConnecting(false);
    },
  });

  return {
    connectRepository: mutation.mutateAsync,
    isLoading: isConnecting,
  };
}

// Hook to update a GitHub repository connection for a midterm group
export function useUpdateRepository() {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const mutation = useMutation({
    mutationFn: updateRepository,
    onMutate: () => {
      setIsUpdating(true);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: midtermKeys.group(variables.groupId),
      });
      // Also invalidate the list view if needed, though group details changing should be enough
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
      toast.success("Repository updated successfully", {
        description:
          "Data sync has been re-initiated and may take a moment to complete.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to update repository", {
        description: error.message,
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    },
  });

  return {
    updateRepository: mutation.mutateAsync,
    isLoading: isUpdating,
  };
}

// Hook to leave a midterm group
export function useLeaveGroup() {
  const queryClient = useQueryClient();
  const [isLeaving, setIsLeaving] = useState(false);

  const mutation = useMutation({
    mutationFn: leaveGroup,
    onMutate: () => {
      setIsLeaving(true);
    },
    onSuccess: (_data, groupId) => {
      // Invalidate both the list of all groups and the specific group details
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
      queryClient.invalidateQueries({ queryKey: midtermKeys.group(groupId) });
      toast.success("Successfully left the group");
    },
    onError: (error: Error) => {
      toast.error("Failed to leave group", {
        description: error.message,
      });
    },
    onSettled: () => {
      setIsLeaving(false);
    },
  });

  return {
    leaveGroup: mutation.mutateAsync,
    isLoading: isLeaving,
  };
}

// Hook to delete a midterm group (Admin only)
export function useDeleteMidtermGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroupAPI,
    onSuccess: () => {
      // Invalidate the list of all groups
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
      toast.success("Group deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete group", {
        description: error.message,
      });
    },
  });
}

// Hook to update a midterm group (Admin/Owner)
export function useUpdateMidtermGroup() {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const mutation = useMutation({
    mutationFn: updateGroupAPI,
    onMutate: () => {
      setIsUpdating(true);
    },
    onSuccess: (data, variables) => {
      // Invalidate list and specific group
      queryClient.invalidateQueries({ queryKey: midtermKeys.groups() });
      queryClient.invalidateQueries({
        queryKey: midtermKeys.group(variables.groupId),
      });
      toast.success("Group updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update group", {
        description: error.message,
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    },
  });

  return {
    updateGroup: mutation.mutateAsync,
    isLoading: isUpdating,
  };
}
