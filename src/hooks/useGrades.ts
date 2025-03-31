import { StudentGradeWithUserAndProfile } from "@/db/drizzle/schema";
import { useQuery } from "@tanstack/react-query";

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
