"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MidtermGroupWithMembers,
  MidtermGroupWithDetails,
} from "@/db/drizzle/midterm-schema";
import { toast } from "sonner";

// Mock API calls - these would be actual API calls in a production app
const fetchGroups = async (): Promise<MidtermGroupWithMembers[]> => {
  // Simulated API call
  await new Promise((resolve) => setTimeout(resolve, 800));
  return [];
};

const fetchGroupDetails = async (
  id: string
): Promise<MidtermGroupWithDetails | null> => {
  console.log(
    "Fetching group details for:",
    id,
    "now it simulates the API call"
  );
  // Simulated API call
  await new Promise((resolve) => setTimeout(resolve, 800));
  return null;
};

const createGroup = async (data: {
  name: string;
  description?: string;
}): Promise<MidtermGroupWithMembers> => {
  console.log("Creating group:", data, "now it simulates the API call");
  // Simulated API call
  await new Promise((resolve) => setTimeout(resolve, 800));
  throw new Error("Not implemented");
};

const joinGroup = async (groupId: string): Promise<void> => {
  console.log("Joining group:", groupId, "now it simulates the API call");
  // Simulated API call
  await new Promise((resolve) => setTimeout(resolve, 800));
};

const leaveGroup = async (groupId: string): Promise<void> => {
  console.log("Leaving group:", groupId, "now it simulates the API call");
  // Simulated API call
  await new Promise((resolve) => setTimeout(resolve, 800));
};

const connectRepository = async (
  groupId: string,
  repositoryUrl: string
): Promise<void> => {
  console.log(
    "Connecting repository for group:",
    groupId,
    "repositoryUrl:",
    repositoryUrl,
    "now it simulates the API call"
  );
  // Simulated API call
  await new Promise((resolve) => setTimeout(resolve, 800));
};

const syncRepository = async (groupId: string): Promise<void> => {
  console.log(
    "Syncing repository for group:",
    groupId,
    "now it simulates the API call"
  );
  // Simulated API call
  await new Promise((resolve) => setTimeout(resolve, 800));
};

const saveEvaluation = async (data: {
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
}): Promise<void> => {
  console.log(
    "Saving evaluation for group:",
    data.groupId,
    "now it simulates the API call"
  );
  // Simulated API call
  await new Promise((resolve) => setTimeout(resolve, 800));
};

export function useMidtermGroups() {
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<"all" | "mine">("all");

  const {
    data: groups = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["midterm-groups", filter],
    queryFn: () => fetchGroups(),
  });

  const createMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["midterm-groups"] });
      toast.success("Group created successfully");
    },
    onError: (error) => {
      console.error("Failed to create group:", error);
      toast.error("Failed to create group");
    },
  });

  const joinMutation = useMutation({
    mutationFn: joinGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["midterm-groups"] });
      toast.success("Joined group successfully");
    },
    onError: (error) => {
      console.error("Failed to join group:", error);
      toast.error("Failed to join group");
    },
  });

  const leaveMutation = useMutation({
    mutationFn: leaveGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["midterm-groups"] });
      toast.success("Left group successfully");
    },
    onError: (error) => {
      console.error("Failed to leave group:", error);
      toast.error("Failed to leave group");
    },
  });

  const connectRepoMutation = useMutation({
    mutationFn: ({
      groupId,
      repositoryUrl,
    }: {
      groupId: string;
      repositoryUrl: string;
    }) => connectRepository(groupId, repositoryUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["midterm-groups"] });
      toast.success("Repository connected successfully");
    },
    onError: (error) => {
      console.error("Failed to connect repository:", error);
      toast.error("Failed to connect repository");
    },
  });

  return {
    groups,
    isLoading,
    error,
    refetch,
    filter,
    setFilter,
    createGroup: createMutation.mutate,
    isCreating: createMutation.isPending,
    joinGroup: joinMutation.mutate,
    isJoining: joinMutation.isPending,
    leaveGroup: leaveMutation.mutate,
    isLeaving: leaveMutation.isPending,
    connectRepository: (groupId: string, repositoryUrl: string) =>
      connectRepoMutation.mutate({ groupId, repositoryUrl }),
    isConnecting: connectRepoMutation.isPending,
  };
}

export function useMidtermGroupDetails(id?: string) {
  const queryClient = useQueryClient();

  const {
    data: groupDetails,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["midterm-group", id],
    queryFn: () => (id ? fetchGroupDetails(id) : Promise.resolve(null)),
    enabled: !!id,
  });

  const syncMutation = useMutation({
    mutationFn: syncRepository,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["midterm-group", id] });
      toast.success("Repository data synced successfully");
    },
    onError: (error) => {
      console.error("Failed to sync repository:", error);
      toast.error("Failed to sync repository");
    },
  });

  return {
    groupDetails,
    isLoading,
    error,
    refetch,
    syncRepository: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
  };
}

export function useMidtermEvaluation() {
  const queryClient = useQueryClient();

  const evaluationMutation = useMutation({
    mutationFn: saveEvaluation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["midterm-group", variables.groupId],
      });
      toast.success("Evaluation saved successfully");
    },
    onError: (error) => {
      console.error("Failed to save evaluation:", error);
      toast.error("Failed to save evaluation");
    },
  });

  return {
    saveEvaluation: evaluationMutation.mutate,
    isSaving: evaluationMutation.isPending,
  };
}
