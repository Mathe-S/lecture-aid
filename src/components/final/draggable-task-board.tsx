"use client";

import { useState, useMemo } from "react";
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
  AlertTriangle,
} from "lucide-react";
import { CreateTaskDialog } from "./create-task-dialog";
import { DroppableColumn } from "@/components/final/droppable-column";
import { TaskFiltersComponent, type TaskFilters } from "./task-filters";
import { TaskResultsSummary } from "./task-results-summary";
import { groupTasksByStatus } from "@/lib/task-filtering";

interface DraggableTaskBoardProps {
  group: FinalGroupWithDetails;
}

export function DraggableTaskBoard({ group }: DraggableTaskBoardProps) {
  const { user } = useAuth();
  const { tasks, tasksByStatus, isLoading, error } = useTasksByStatus(group.id);
  const updateTaskStatusMutation = useUpdateTaskStatus(group.id);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Filtering and sorting state
  const [filters, setFilters] = useState<TaskFilters>({
    assigneeIds: [],
    sortBy: "createdAt-desc",
  });

  // Apply filters and sorting to tasks
  const filteredTasksByStatus = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        todo: [],
        in_progress: [],
        done: [],
        graded: [],
        appeal: [],
      };
    }

    const groupedTasks = groupTasksByStatus(tasks, filters);

    // Ensure all status columns exist, even if empty
    return {
      todo: groupedTasks.todo || [],
      in_progress: groupedTasks.in_progress || [],
      done: groupedTasks.done || [],
      graded: groupedTasks.graded || [],
      appeal: groupedTasks.appeal || [],
    };
  }, [tasks, filters]);

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
    if (!tasks) return undefined;
    return tasks.find((task) => task.id === taskId);
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

  // Check if any filters are active to determine which data to use
  const hasActiveFilters =
    filters.assigneeIds.length > 0 || filters.sortBy !== "createdAt-desc";
  const currentTasksByStatus = hasActiveFilters
    ? filteredTasksByStatus
    : tasksByStatus;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Filter and Sort Controls */}
        <TaskFiltersComponent
          tasks={tasks || []}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Results Summary */}
        <TaskResultsSummary
          totalTasks={tasks?.length || 0}
          filteredTasks={
            hasActiveFilters ? Object.values(filteredTasksByStatus).flat() : []
          }
          filters={filters}
        />

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-3">
            <Button
              size="sm"
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-slate-300 hover:bg-slate-50 shadow-sm"
            >
              <Calendar className="h-4 w-4" />
              Sprint Planning
            </Button>
          </div>

          {/* Task Count Summary */}
          <div className="text-sm text-slate-600">
            {tasks?.length || 0} total tasks
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* To Do Column */}
          <DroppableColumn
            id="todo"
            title="To Do"
            icon={Clock}
            tasks={currentTasksByStatus.todo}
            canDragTask={canDragTask}
            group={group}
            userId={user?.id}
          />

          {/* In Progress Column */}
          <DroppableColumn
            id="in_progress"
            title="In Progress"
            icon={Activity}
            tasks={currentTasksByStatus.in_progress}
            canDragTask={canDragTask}
            group={group}
            userId={user?.id}
          />

          {/* Done Column */}
          <DroppableColumn
            id="done"
            title="Done"
            icon={CheckCircle}
            tasks={currentTasksByStatus.done}
            canDragTask={canDragTask}
            group={group}
            userId={user?.id}
          />

          {/* Graded Column */}
          <DroppableColumn
            id="graded"
            title="Graded"
            icon={Award}
            tasks={currentTasksByStatus.graded}
            canDragTask={() => false} // Students cannot drag graded tasks
            group={group}
            userId={user?.id}
          />

          {/* Grade Appeal Column */}
          <DroppableColumn
            id="appeal"
            title="Grade Appeal"
            icon={AlertTriangle}
            tasks={currentTasksByStatus.appeal}
            canDragTask={() => false} // Students cannot drag appeal tasks
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
