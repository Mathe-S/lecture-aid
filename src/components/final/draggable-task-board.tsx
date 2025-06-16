"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useTasksByStatus, useUpdateTaskStatus } from "@/hooks/useFinalTasks";
import type { FinalGroupWithDetails } from "@/lib/final-group-service";
import type { TaskWithDetails, TaskStatus } from "@/lib/final-task-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Kanban,
  Activity,
  CheckCircle,
  Clock,
  Plus,
  Calendar,
  Award,
} from "lucide-react";
import { CreateTaskDialog } from "./create-task-dialog";
import { DroppableColumn } from "@/components/final/droppable-column";

interface DraggableTaskBoardProps {
  group: FinalGroupWithDetails;
}

export function DraggableTaskBoard({ group }: DraggableTaskBoardProps) {
  const { user } = useAuth();
  const { tasksByStatus, isLoading, error } = useTasksByStatus(group.id);
  const updateTaskStatusMutation = useUpdateTaskStatus(group.id);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  );

  // Check if user can drag a specific task
  const canDragTask = (task: TaskWithDetails): boolean => {
    if (!user) return false;

    // User can drag if they are assigned to the task
    return task.assignees.some((assignee) => assignee.profile.id === user.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = findTaskById(taskId);

    if (!task || !canDragTask(task)) {
      return;
    }

    // Don't update if status hasn't changed
    if (task.status === newStatus) return;

    // Prevent students from moving tasks to "graded" status
    if (newStatus === "graded") {
      return; // Only admins can grade tasks through the grading interface
    }

    // Update task status with optimistic update
    updateTaskStatusMutation.mutate({
      taskId,
      status: newStatus,
    });
  };

  const findTaskById = (taskId: string): TaskWithDetails | undefined => {
    const allTasks = [
      ...tasksByStatus.todo,
      ...tasksByStatus.in_progress,
      ...tasksByStatus.done,
      ...tasksByStatus.graded,
    ];
    return allTasks.find((task) => task.id === taskId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Kanban className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-red-600">
            <p>Failed to load tasks: {error.message}</p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            Sprint Planning
          </Button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* To Do Column */}
          <DroppableColumn
            id="todo"
            title="To Do"
            icon={Clock}
            tasks={tasksByStatus.todo}
            canDragTask={canDragTask}
            group={group}
            userId={user?.id}
          />

          {/* In Progress Column */}
          <DroppableColumn
            id="in_progress"
            title="In Progress"
            icon={Activity}
            tasks={tasksByStatus.in_progress}
            canDragTask={canDragTask}
            group={group}
            userId={user?.id}
          />

          {/* Done Column */}
          <DroppableColumn
            id="done"
            title="Done"
            icon={CheckCircle}
            tasks={tasksByStatus.done}
            canDragTask={canDragTask}
            group={group}
            userId={user?.id}
          />

          {/* Graded Column */}
          <DroppableColumn
            id="graded"
            title="Graded"
            icon={Award}
            tasks={tasksByStatus.graded}
            canDragTask={() => false} // Students cannot drag graded tasks
            group={group}
            userId={user?.id}
          />
        </div>

        {/* Create Task Dialog */}
        {showCreateDialog && (
          <CreateTaskDialog
            isOpen={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            group={group}
          />
        )}
      </div>
    </DndContext>
  );
}
