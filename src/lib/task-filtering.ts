import type { TaskWithDetails } from "@/lib/final-task-service";
import type { TaskFilters, SortOption } from "@/components/final/task-filters";

/**
 * Filter tasks based on the provided filters
 */
export function filterTasks(
  tasks: TaskWithDetails[],
  filters: TaskFilters
): TaskWithDetails[] {
  let filteredTasks = [...tasks];

  // Filter by assignees
  if (filters.assigneeIds.length > 0) {
    filteredTasks = filteredTasks.filter((task) =>
      task.assignees.some((assignee) =>
        filters.assigneeIds.includes(assignee.profile.id)
      )
    );
  }

  return filteredTasks;
}

/**
 * Sort tasks based on the provided sort option
 */
export function sortTasks(
  tasks: TaskWithDetails[],
  sortBy: SortOption
): TaskWithDetails[] {
  const sortedTasks = [...tasks];

  switch (sortBy) {
    case "createdAt-desc":
      return sortedTasks.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    case "createdAt-asc":
      return sortedTasks.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    case "score-desc":
      return sortedTasks.sort((a, b) => {
        const aScore = getTaskMaxScore(a);
        const bScore = getTaskMaxScore(b);
        return bScore - aScore;
      });

    case "score-asc":
      return sortedTasks.sort((a, b) => {
        const aScore = getTaskMaxScore(a);
        const bScore = getTaskMaxScore(b);
        return aScore - bScore;
      });

    case "priority":
      return sortedTasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    case "dueDate":
      return sortedTasks.sort((a, b) => {
        // Tasks with due dates come first, sorted by due date
        // Tasks without due dates come last
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

    default:
      return sortedTasks;
  }
}

/**
 * Get the maximum score for a task from its grades
 */
function getTaskMaxScore(task: TaskWithDetails): number {
  if (!task.grades || task.grades.length === 0) return 0;
  return Math.max(...task.grades.map((grade) => grade.points));
}

/**
 * Filter and sort tasks based on the provided filters
 */
export function filterAndSortTasks(
  tasks: TaskWithDetails[],
  filters: TaskFilters
): TaskWithDetails[] {
  const filteredTasks = filterTasks(tasks, filters);
  return sortTasks(filteredTasks, filters.sortBy);
}

/**
 * Group filtered and sorted tasks by status
 */
export function groupTasksByStatus(
  tasks: TaskWithDetails[],
  filters: TaskFilters
): Record<string, TaskWithDetails[]> {
  const filteredAndSortedTasks = filterAndSortTasks(tasks, filters);

  return filteredAndSortedTasks.reduce((acc, task) => {
    const status = task.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(task);
    return acc;
  }, {} as Record<string, TaskWithDetails[]>);
}
