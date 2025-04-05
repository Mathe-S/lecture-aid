import { StudentGradeWithUserAndProfile } from "@/db/drizzle/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Query key factory
export const gradesKeys = {
  all: ["grades"] as const,
  user: () => [...gradesKeys.all, "user"] as const,
  admin: () => [...gradesKeys.all, "admin"] as const,
};

// Fetch student grades
const fetchGrades = async () => {
  const response = await fetch("/api/grades");
  if (!response.ok) {
    throw new Error("Failed to fetch grades");
  }
  return response.json();
};

// Fetch all grades (admin only)
const fetchAllGrades = async (): Promise<StudentGradeWithUserAndProfile[]> => {
  const response = await fetch("/api/admin/grades");
  if (!response.ok) {
    throw new Error("Failed to fetch all grades");
  }
  return response.json();
};

// API mutation functions
const updateExtraPointsAPI = async ({
  userId,
  extraPoints,
}: {
  userId: string;
  extraPoints: number;
}) => {
  const response = await fetch("/api/admin/grades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      action: "updateExtraPoints",
      extraPoints,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update extra points");
  }

  return response.json();
};

const recalculateGradeAPI = async (userId: string) => {
  const response = await fetch("/api/admin/grades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      action: "recalculate",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to recalculate grade");
  }

  return response.json();
};

const recalculateAllGradesAPI = async () => {
  const response = await fetch("/api/admin/grades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "recalculateAll",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to recalculate all grades");
  }

  return response.json();
};

// Hook for students to view their grades
export function useGrades() {
  return useQuery({
    queryKey: gradesKeys.user(),
    queryFn: fetchGrades,
  });
}

// Hook for admins to view all grades
export function useAllGrades() {
  return useQuery({
    queryKey: gradesKeys.admin(),
    queryFn: fetchAllGrades,
  });
}

// Hook for updating extra points
export function useUpdateExtraPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateExtraPointsAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.admin() });
      toast.success("Extra points updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update extra points", {
        description: error.message,
      });
    },
  });
}

// Hook for recalculating a single student's grades
export function useRecalculateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recalculateGradeAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.admin() });
      toast.success("Grades recalculated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to recalculate grades", {
        description: error.message,
      });
    },
  });
}

// Hook for recalculating all students' grades
export function useRecalculateAllGrades() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recalculateAllGradesAPI,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gradesKeys.admin() });
      toast.success(
        data.message || "All student grades recalculated successfully"
      );
    },
    onError: (error: Error) => {
      toast.error("Failed to recalculate all grades", {
        description: error.message,
      });
    },
  });
}
