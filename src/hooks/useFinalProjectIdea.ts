import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Query key factory
export const finalProjectIdeaKeys = {
  all: ["final", "project-idea"] as const,
  group: (groupId: string) => [...finalProjectIdeaKeys.all, groupId] as const,
};

interface ProjectIdeaResponse {
  projectIdea: string | null;
}

/**
 * Hook to fetch the project idea for a group
 */
export function useFinalProjectIdea(groupId: string | undefined) {
  return useQuery({
    queryKey: groupId ? finalProjectIdeaKeys.group(groupId) : [],
    queryFn: async (): Promise<ProjectIdeaResponse> => {
      if (!groupId) throw new Error("Group ID is required");

      const response = await fetch(`/api/final/groups/${groupId}/idea`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch project idea");
      }

      return response.json();
    },
    enabled: !!groupId,
  });
}

/**
 * Hook to update the project idea for a group
 */
export function useUpdateFinalProjectIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      projectIdea,
    }: {
      groupId: string;
      projectIdea: string;
    }) => {
      const response = await fetch(`/api/final/groups/${groupId}/idea`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectIdea }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update project idea");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch the project idea query
      queryClient.invalidateQueries({
        queryKey: finalProjectIdeaKeys.group(variables.groupId),
      });

      // Also invalidate the user's group data
      queryClient.invalidateQueries({
        queryKey: ["final", "user-group"],
      });

      toast.success("Project idea updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update project idea", {
        description: error.message,
      });
    },
  });
}
