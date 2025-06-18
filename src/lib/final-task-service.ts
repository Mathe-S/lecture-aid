import { db } from "@/db";
import {
  finalTasks,
  finalTaskAssignees,
  finalGroupMembers,
  NewFinalTask,
  NewFinalTaskAssignee,
  TaskPriority,
  TaskStatus,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/db/drizzle/final-schema";
import { eq, and, desc } from "drizzle-orm";

// Types for the service layer
export interface ProfileDetails {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface TaskAssigneeDetails {
  profile: ProfileDetails;
  assignedAt: string;
  assignedBy: ProfileDetails;
}

export interface TaskGradeDetails {
  id: string;
  studentId: string;
  points: number;
  maxPoints: number;
  feedback: string | null;
  gradedAt: string;
  grader: ProfileDetails;
}

export interface TaskWithDetails {
  id: string;
  title: string;
  description: string | null;
  commitLink: string | null;
  mergeRequestLink: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  estimatedHours: number | null;
  groupId: string;
  createdBy: ProfileDetails;
  assignees: TaskAssigneeDetails[];
  grades?: TaskGradeDetails[]; // Include grades for graded tasks
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  commitLink?: string;
  mergeRequestLink?: string;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedHours?: number;
  assigneeIds?: string[]; // Array of user IDs to assign
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  commitLink?: string;
  mergeRequestLink?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  estimatedHours?: number;
}

/**
 * Verifies if a user is a member of a final group
 */
async function verifyGroupMembership(
  groupId: string,
  userId: string
): Promise<boolean> {
  const membership = await db.query.finalGroupMembers.findFirst({
    where: and(
      eq(finalGroupMembers.groupId, groupId),
      eq(finalGroupMembers.userId, userId)
    ),
  });
  return !!membership;
}

/**
 * Fetches all tasks for a specific group with full details
 */
export async function getGroupTasks(
  groupId: string,
  userId: string
): Promise<TaskWithDetails[]> {
  // Verify user is a member of the group
  const isMember = await verifyGroupMembership(groupId, userId);
  if (!isMember) {
    throw new Error("Unauthorized: User is not a member of this group.");
  }

  const tasks = await db.query.finalTasks.findMany({
    where: eq(finalTasks.groupId, groupId),
    with: {
      createdBy: {
        columns: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      assignees: {
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          assignedBy: {
            columns: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      },
      grades: {
        with: {
          student: {
            columns: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          grader: {
            columns: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
    orderBy: [desc(finalTasks.createdAt)],
  });

  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    commitLink: task.commitLink,
    mergeRequestLink: task.mergeRequestLink,
    priority: task.priority as TaskPriority,
    status: task.status as TaskStatus,
    dueDate: task.dueDate,
    estimatedHours: task.estimatedHours,
    groupId: task.groupId,
    createdBy: {
      id: task.createdBy.id,
      email: task.createdBy.email,
      fullName: task.createdBy.fullName,
      avatarUrl: task.createdBy.avatarUrl,
    },
    assignees: task.assignees.map((assignee) => ({
      profile: {
        id: assignee.user.id,
        email: assignee.user.email,
        fullName: assignee.user.fullName,
        avatarUrl: assignee.user.avatarUrl,
      },
      assignedAt: assignee.assignedAt,
      assignedBy: {
        id: assignee.assignedBy.id,
        email: assignee.assignedBy.email,
        fullName: assignee.assignedBy.fullName,
        avatarUrl: assignee.assignedBy.avatarUrl,
      },
    })),
    grades: task.grades?.map((grade) => ({
      id: grade.id,
      studentId: grade.studentId,
      points: grade.points,
      maxPoints: grade.maxPoints,
      feedback: grade.feedback,
      gradedAt: grade.gradedAt,
      grader: {
        id: grade.grader.id,
        email: grade.grader.email,
        fullName: grade.grader.fullName,
        avatarUrl: grade.grader.avatarUrl,
      },
    })),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }));
}

/**
 * Creates a new task for a group
 */
export async function createTask(
  groupId: string,
  userId: string,
  payload: CreateTaskPayload
): Promise<TaskWithDetails> {
  // Verify user is a member of the group
  const isMember = await verifyGroupMembership(groupId, userId);
  if (!isMember) {
    throw new Error("Unauthorized: User is not a member of this group.");
  }

  // Validate payload
  if (!payload.title?.trim()) {
    throw new Error("Task title is required.");
  }

  if (payload.priority && !TASK_PRIORITIES.includes(payload.priority)) {
    throw new Error("Invalid priority value.");
  }

  // Create the task
  const newTaskData: NewFinalTask = {
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    commitLink: payload.commitLink || null,
    mergeRequestLink: payload.mergeRequestLink || null,
    priority: payload.priority || "medium",
    status: "todo",
    dueDate: payload.dueDate || null,
    estimatedHours: payload.estimatedHours || null,
    groupId,
    createdById: userId,
  };

  const [createdTask] = await db
    .insert(finalTasks)
    .values(newTaskData)
    .returning();

  if (!createdTask) {
    throw new Error("Failed to create task.");
  }

  // Assign users if provided
  if (payload.assigneeIds && payload.assigneeIds.length > 0) {
    // Verify all assignees are group members
    const groupMembers = await db.query.finalGroupMembers.findMany({
      where: eq(finalGroupMembers.groupId, groupId),
      columns: { userId: true },
    });

    const memberIds = groupMembers.map((m) => m.userId);
    const invalidAssignees = payload.assigneeIds.filter(
      (id) => !memberIds.includes(id)
    );

    if (invalidAssignees.length > 0) {
      throw new Error("Some assignees are not members of this group.");
    }

    // Create assignments
    const assignments: NewFinalTaskAssignee[] = payload.assigneeIds.map(
      (assigneeId) => ({
        taskId: createdTask.id,
        userId: assigneeId,
        assignedById: userId,
      })
    );

    await db.insert(finalTaskAssignees).values(assignments);
  }

  // Fetch and return the complete task details
  return getTaskById(createdTask.id, userId);
}

/**
 * Updates an existing task
 */
export async function updateTask(
  taskId: string,
  userId: string,
  payload: UpdateTaskPayload
): Promise<TaskWithDetails> {
  // Get the task and verify permissions
  const task = await db.query.finalTasks.findFirst({
    where: eq(finalTasks.id, taskId),
  });

  if (!task) {
    throw new Error("Task not found.");
  }

  // Verify user is a member of the group
  const isMember = await verifyGroupMembership(task.groupId, userId);
  if (!isMember) {
    throw new Error("Unauthorized: User is not a member of this group.");
  }

  // Validate payload
  if (payload.title !== undefined && !payload.title.trim()) {
    throw new Error("Task title cannot be empty.");
  }

  if (payload.priority && !TASK_PRIORITIES.includes(payload.priority)) {
    throw new Error("Invalid priority value.");
  }

  if (payload.status && !TASK_STATUSES.includes(payload.status)) {
    throw new Error("Invalid status value.");
  }

  // Update the task
  const updateData: Partial<NewFinalTask> = {
    updatedAt: new Date().toISOString(),
  };

  if (payload.title !== undefined) updateData.title = payload.title.trim();
  if (payload.description !== undefined)
    updateData.description = payload.description?.trim() || null;
  if (payload.commitLink !== undefined)
    updateData.commitLink = payload.commitLink || null;
  if (payload.mergeRequestLink !== undefined)
    updateData.mergeRequestLink = payload.mergeRequestLink || null;
  if (payload.priority !== undefined) updateData.priority = payload.priority;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.dueDate !== undefined)
    updateData.dueDate = payload.dueDate || null;
  if (payload.estimatedHours !== undefined)
    updateData.estimatedHours = payload.estimatedHours || null;

  await db.update(finalTasks).set(updateData).where(eq(finalTasks.id, taskId));

  // Fetch and return the updated task details
  return getTaskById(taskId, userId);
}

/**
 * Deletes a task (assignees can delete if assigned, otherwise only group owner can delete)
 */
export async function deleteTask(
  taskId: string,
  userId: string
): Promise<void> {
  // Get the task with its assignees
  const task = await db.query.finalTasks.findFirst({
    where: eq(finalTasks.id, taskId),
    with: {
      assignees: {
        columns: { userId: true },
      },
    },
  });

  if (!task) {
    throw new Error("Task not found.");
  }

  // Verify user is a member of the group
  const groupMembership = await db.query.finalGroupMembers.findFirst({
    where: and(
      eq(finalGroupMembers.groupId, task.groupId),
      eq(finalGroupMembers.userId, userId)
    ),
  });

  if (!groupMembership) {
    throw new Error("Unauthorized: User is not a member of this group.");
  }

  // Check permissions based on assignment status
  const hasAssignees = task.assignees.length > 0;

  if (hasAssignees) {
    // If task has assignees, only assignees can delete it
    const isAssignee = task.assignees.some(
      (assignee) => assignee.userId === userId
    );
    if (!isAssignee) {
      throw new Error(
        "Unauthorized: Only assigned users can delete this task."
      );
    }
  } else {
    // If task has no assignees, only group owner can delete it
    const isOwner = groupMembership.role === "owner";
    if (!isOwner) {
      throw new Error(
        "Unauthorized: Only group owner can delete unassigned tasks."
      );
    }
  }

  // Delete task (assignments will be deleted by cascade)
  await db.delete(finalTasks).where(eq(finalTasks.id, taskId));
}

/**
 * Assigns users to a task
 */
export async function assignUsersToTask(
  taskId: string,
  assigneeIds: string[],
  userId: string
): Promise<TaskWithDetails> {
  // Get the task and verify permissions
  const task = await db.query.finalTasks.findFirst({
    where: eq(finalTasks.id, taskId),
  });

  if (!task) {
    throw new Error("Task not found.");
  }

  // Verify user is a member of the group
  const isMember = await verifyGroupMembership(task.groupId, userId);
  if (!isMember) {
    throw new Error("Unauthorized: User is not a member of this group.");
  }

  // Verify all assignees are group members
  const groupMembers = await db.query.finalGroupMembers.findMany({
    where: eq(finalGroupMembers.groupId, task.groupId),
    columns: { userId: true },
  });

  const memberIds = groupMembers.map((m) => m.userId);
  const invalidAssignees = assigneeIds.filter((id) => !memberIds.includes(id));

  if (invalidAssignees.length > 0) {
    throw new Error("Some assignees are not members of this group.");
  }

  // Remove existing assignments
  await db
    .delete(finalTaskAssignees)
    .where(eq(finalTaskAssignees.taskId, taskId));

  // Add new assignments
  if (assigneeIds.length > 0) {
    const assignments: NewFinalTaskAssignee[] = assigneeIds.map(
      (assigneeId) => ({
        taskId,
        userId: assigneeId,
        assignedById: userId,
      })
    );

    await db.insert(finalTaskAssignees).values(assignments);
  }

  // Fetch and return the updated task details
  return getTaskById(taskId, userId);
}

/**
 * Gets a single task by ID with full details
 */
export async function getTaskById(
  taskId: string,
  userId: string
): Promise<TaskWithDetails> {
  const task = await db.query.finalTasks.findFirst({
    where: eq(finalTasks.id, taskId),
    with: {
      createdBy: {
        columns: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      assignees: {
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          assignedBy: {
            columns: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (!task) {
    throw new Error("Task not found.");
  }

  // Verify user is a member of the group
  const isMember = await verifyGroupMembership(task.groupId, userId);
  if (!isMember) {
    throw new Error("Unauthorized: User is not a member of this group.");
  }

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    commitLink: task.commitLink,
    mergeRequestLink: task.mergeRequestLink,
    priority: task.priority as TaskPriority,
    status: task.status as TaskStatus,
    dueDate: task.dueDate,
    estimatedHours: task.estimatedHours,
    groupId: task.groupId,
    createdBy: {
      id: task.createdBy.id,
      email: task.createdBy.email,
      fullName: task.createdBy.fullName,
      avatarUrl: task.createdBy.avatarUrl,
    },
    assignees: task.assignees.map((assignee) => ({
      profile: {
        id: assignee.user.id,
        email: assignee.user.email,
        fullName: assignee.user.fullName,
        avatarUrl: assignee.user.avatarUrl,
      },
      assignedAt: assignee.assignedAt,
      assignedBy: {
        id: assignee.assignedBy.id,
        email: assignee.assignedBy.email,
        fullName: assignee.assignedBy.fullName,
        avatarUrl: assignee.assignedBy.avatarUrl,
      },
    })),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

/**
 * Updates only the status of a task (for drag-and-drop)
 */
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  userId: string
): Promise<TaskWithDetails> {
  // Validate status
  if (!TASK_STATUSES.includes(status)) {
    throw new Error("Invalid status value.");
  }

  return updateTask(taskId, userId, { status });
}

// Export types and constants for use in other modules
export { TASK_PRIORITIES, TASK_STATUSES };
export type { TaskPriority, TaskStatus };
