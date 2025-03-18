import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Assignment } from "@/db/drizzle/schema";
import { createClient } from "@/utils/supabase/client";

// Define query keys
export const assignmentKeys = {
  all: ["assignments"] as const,
  details: (id: string) => [...assignmentKeys.all, id] as const,
  lists: () => [...assignmentKeys.all, "list"] as const,
};

// Get all assignments
export function useAssignments() {
  return useQuery({
    queryKey: assignmentKeys.lists(),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .order("createdAt", { ascending: false });

      if (error) throw error;
      return data as Assignment[];
    },
  });
}

// Get a single assignment
export function useAssignment(id: string | undefined) {
  return useQuery({
    queryKey: assignmentKeys.details(id || ""),
    queryFn: async () => {
      if (!id) return null;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Assignment;
    },
    enabled: !!id,
  });
}

// Create a new assignment
export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      newAssignment: Omit<Assignment, "id" | "createdAt" | "updatedAt">
    ) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("assignments")
        .insert(newAssignment)
        .select()
        .single();

      if (error) throw error;
      return data as Assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
    },
  });
}
