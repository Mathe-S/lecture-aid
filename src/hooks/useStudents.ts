import { useQuery } from "@tanstack/react-query";

// Fetch all students
const fetchStudents = async () => {
  const response = await fetch("/api/users/students");
  if (!response.ok) {
    throw new Error("Failed to fetch students");
  }
  return response.json();
};

// Query key factory
export const studentsKeys = {
  all: ["students"] as const,
};

// Hook to fetch all students
export function useStudents() {
  return useQuery({
    queryKey: studentsKeys.all,
    queryFn: fetchStudents,
  });
}
