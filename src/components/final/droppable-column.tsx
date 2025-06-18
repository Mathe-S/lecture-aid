"use client";

import { useDroppable } from "@dnd-kit/core";
import type { TaskWithDetails } from "@/lib/final-task-service";
import type { FinalGroupWithDetails } from "@/lib/final-group-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "./task-card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface DroppableColumnProps {
  id: string;
  title: string;
  icon: LucideIcon;
  tasks: TaskWithDetails[];
  canDragTask: (task: TaskWithDetails) => boolean;
  group: FinalGroupWithDetails;
  userId?: string;
}

export function DroppableColumn({
  id,
  title,
  icon: Icon,
  tasks,
  canDragTask,
  group,
  userId,
}: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isOver && "ring-2 ring-blue-500 ring-offset-2 bg-blue-50/50"
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
          <Badge variant="secondary">{tasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent
        ref={setNodeRef}
        className={cn(
          "space-y-3 min-h-[200px] transition-colors duration-200",
          isOver && "bg-blue-50/30"
        )}
      >
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Icon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {id === "todo"
                ? "No tasks yet"
                : id === "in_progress"
                ? "No active tasks"
                : id === "done"
                ? "No completed tasks"
                : "No graded tasks"}
            </p>
            {id === "todo" && (
              <p className="text-xs">Add tasks to get started</p>
            )}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              canDrag={canDragTask(task)}
              group={group}
              userId={userId}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
