import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

export interface FinalTaskGradeSummary {
  totalPointsEarned: number;
  totalTasksGraded: number;
  totalTasks: number;
  averageScore: number;
  grades: Array<{
    taskId: string;
    taskTitle: string;
    points: number;
    maxPoints: number;
    percentage: number;
    gradedAt: string;
  }>;
}

export function useFinalTaskGrades() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["final-task-grades", user?.id],
    queryFn: async (): Promise<FinalTaskGradeSummary> => {
      if (!user?.id) throw new Error("User not authenticated");

      const response = await fetch(`/api/final/grades/my-tasks`);
      if (!response.ok) {
        throw new Error("Failed to fetch final task grades");
      }
      return response.json();
    },
    enabled: !!user?.id,
  });
}
