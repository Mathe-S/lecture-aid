import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  TaskWithDetails,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskStatus,
} from "@/lib/final-task-service";

// Query key factory
export const finalTaskKeys = {
  all: ["final", "tasks"] as const,
  group: (groupId: string) => [...finalTaskKeys.all, "group", groupId] as const,
  task: (taskId: string) => [...finalTaskKeys.all, "task", taskId] as const,
};

// API helper function
async function handleTaskResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Request failed with status ${response.status}`
    );
  }
  return response.json();
}

// API functions
async function fetchGroupTasks(groupId: string): Promise<TaskWithDetails[]> {
  const response = await fetch(`/api/final/groups/${groupId}/tasks`);
  return handleTaskResponse<TaskWithDetails[]>(response);
}

async function fetchTask(
  groupId: string,
  taskId: string
): Promise<TaskWithDetails> {
  const response = await fetch(`/api/final/groups/${groupId}/tasks/${taskId}`);
  return handleTaskResponse<TaskWithDetails>(response);
}

async function createTaskApi(
  groupId: string,
  payload: CreateTaskPayload
): Promise<TaskWithDetails> {
  const response = await fetch(`/api/final/groups/${groupId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleTaskResponse<TaskWithDetails>(response);
}

async function updateTaskApi(
  groupId: string,
  taskId: string,
  payload: UpdateTaskPayload
): Promise<TaskWithDetails> {
  const response = await fetch(`/api/final/groups/${groupId}/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleTaskResponse<TaskWithDetails>(response);
}

async function deleteTaskApi(
  groupId: string,
  taskId: string
): Promise<{ message: string }> {
  const response = await fetch(`/api/final/groups/${groupId}/tasks/${taskId}`, {
    method: "DELETE",
  });
  return handleTaskResponse<{ message: string }>(response);
}

async function assignUsersToTaskApi(
  groupId: string,
  taskId: string,
  assigneeIds: string[]
): Promise<TaskWithDetails> {
  const response = await fetch(
    `/api/final/groups/${groupId}/tasks/${taskId}/assign`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeIds }),
    }
  );
  return handleTaskResponse<TaskWithDetails>(response);
}

// Hooks

/**
 * Hook to fetch all tasks for a group
 */
export function useGroupTasks(groupId: string | undefined) {
  return useQuery({
    queryKey: groupId ? finalTaskKeys.group(groupId) : [],
    queryFn: () => fetchGroupTasks(groupId!),
    enabled: !!groupId,
  });
}

/**
 * Hook to fetch a single task
 */
export function useTask(
  groupId: string | undefined,
  taskId: string | undefined
) {
  return useQuery({
    queryKey: groupId && taskId ? finalTaskKeys.task(taskId) : [],
    queryFn: () => fetchTask(groupId!, taskId!),
    enabled: !!groupId && !!taskId,
  });
}

/**
 * Hook to create a new task
 */
export function useCreateTask(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation<TaskWithDetails, Error, CreateTaskPayload>({
    mutationFn: (payload) => createTaskApi(groupId, payload),
    onSuccess: (data) => {
      toast.success(`Task "${data.title}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: finalTaskKeys.group(groupId) });
    },
    onError: (error) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });
}

/**
 * Hook to update a task
 */
export function useUpdateTask(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    TaskWithDetails,
    Error,
    { taskId: string; payload: UpdateTaskPayload }
  >({
    mutationFn: ({ taskId, payload }) =>
      updateTaskApi(groupId, taskId, payload),
    onSuccess: (data) => {
      toast.success(`Task "${data.title}" updated successfully!`);
      queryClient.invalidateQueries({ queryKey: finalTaskKeys.group(groupId) });
      queryClient.invalidateQueries({ queryKey: finalTaskKeys.task(data.id) });
    },
    onError: (error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });
}

/**
 * Hook to update task status (for drag-and-drop)
 */
export function useUpdateTaskStatus(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    TaskWithDetails,
    Error,
    { taskId: string; status: TaskStatus },
    { previousTasks: TaskWithDetails[] | undefined }
  >({
    mutationFn: ({ taskId, status }) =>
      updateTaskApi(groupId, taskId, { status }),
    onMutate: async ({ taskId, status }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: finalTaskKeys.group(groupId),
      });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<TaskWithDetails[]>(
        finalTaskKeys.group(groupId)
      );

      // Optimistically update to the new value
      queryClient.setQueryData<TaskWithDetails[]>(
        finalTaskKeys.group(groupId),
        (oldTasks) => {
          if (!oldTasks) return oldTasks;
          return oldTasks.map((task) =>
            task.id === taskId ? { ...task, status } : task
          );
        }
      );

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(
          finalTaskKeys.group(groupId),
          context.previousTasks
        );
      }
      toast.error(`Failed to update task status: ${error.message}`);
    },
    onSuccess: (data) => {
      // Update the individual task query if it exists
      queryClient.invalidateQueries({ queryKey: finalTaskKeys.task(data.id) });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: finalTaskKeys.group(groupId) });
    },
  });
}

/**
 * Hook to delete a task
 */
export function useDeleteTask(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (taskId) => deleteTaskApi(groupId, taskId),
    onSuccess: (data, taskId) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: finalTaskKeys.group(groupId) });
      queryClient.removeQueries({ queryKey: finalTaskKeys.task(taskId) });
    },
    onError: (error) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });
}

/**
 * Hook to assign users to a task
 */
export function useAssignUsersToTask(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    TaskWithDetails,
    Error,
    { taskId: string; assigneeIds: string[] }
  >({
    mutationFn: ({ taskId, assigneeIds }) =>
      assignUsersToTaskApi(groupId, taskId, assigneeIds),
    onSuccess: (data) => {
      const assigneeCount = data.assignees.length;
      const message =
        assigneeCount === 0
          ? `All assignees removed from task "${data.title}"`
          : `${assigneeCount} user(s) assigned to task "${data.title}"`;
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: finalTaskKeys.group(groupId) });
      queryClient.invalidateQueries({ queryKey: finalTaskKeys.task(data.id) });
    },
    onError: (error) => {
      toast.error(`Failed to assign users: ${error.message}`);
    },
  });
}

// Utility hooks for task management

/**
 * Hook to get tasks organized by status (for Kanban board)
 */
export function useTasksByStatus(groupId: string | undefined) {
  const { data: tasks, ...rest } = useGroupTasks(groupId);

  // Ensure we always have a proper structure, even during loading
  const tasksByStatus = tasks?.reduce(
    (acc, task) => {
      if (!acc[task.status]) {
        acc[task.status] = [];
      }
      acc[task.status].push(task);
      return acc;
    },
    {
      todo: [],
      in_progress: [],
      done: [],
      graded: [],
      appeal: [],
    } as Record<TaskStatus, TaskWithDetails[]>
  ) || {
    todo: [],
    in_progress: [],
    done: [],
    graded: [],
    appeal: [],
  };

  return {
    tasksByStatus,
    tasks,
    ...rest,
  };
}

/**
 * Hook to get task statistics
 */
export function useTaskStats(groupId: string | undefined) {
  const { data: tasks } = useGroupTasks(groupId);

  if (!tasks) {
    return {
      total: 0,
      todo: 0,
      inProgress: 0,
      done: 0,
      graded: 0,
      appeal: 0,
      completionRate: 0,
    };
  }

  const stats = tasks.reduce(
    (acc, task) => {
      acc.total++;
      switch (task.status) {
        case "todo":
          acc.todo++;
          break;
        case "in_progress":
          acc.inProgress++;
          break;
        case "done":
          acc.done++;
          break;
        case "graded":
          acc.graded++;
          break;
        case "appeal":
          acc.appeal++;
          break;
      }
      return acc;
    },
    {
      total: 0,
      todo: 0,
      inProgress: 0,
      done: 0,
      graded: 0,
      appeal: 0,
      completionRate: 0,
    }
  );

  stats.completionRate = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;

  return stats;
}
