"use client";

import { useDraggable } from "@dnd-kit/core";
import type { TaskWithDetails } from "@/lib/final-task-service";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: TaskWithDetails;
  canDrag: boolean;
}

// Helper function to get user initials
function getInitials(fullName: string | null): string {
  if (!fullName) return "U";
  return fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TaskCard({ task, canDrag }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    disabled: !canDrag,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "p-3 border rounded-lg transition-shadow duration-200",
        canDrag
          ? "cursor-grab active:cursor-grabbing hover:shadow-md"
          : "cursor-default",
        "hover:shadow-md",
        task.status === "todo" && "bg-white",
        task.status === "in_progress" && "bg-blue-50",
        task.status === "done" && "bg-green-50",
        !canDrag && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
        <Badge
          variant={
            task.priority === "high"
              ? "destructive"
              : task.priority === "medium"
              ? "default"
              : "secondary"
          }
          className="text-xs flex-shrink-0 ml-2"
        >
          {task.priority}
        </Badge>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      {task.assignees.length > 0 && (
        <div className="flex items-center gap-1 mt-2">
          {task.assignees.slice(0, 3).map((assignee) => (
            <Avatar key={assignee.profile.id} className="h-5 w-5">
              <AvatarImage
                src={assignee.profile.avatarUrl || undefined}
                alt={assignee.profile.fullName || "User"}
              />
              <AvatarFallback className="text-xs">
                {getInitials(assignee.profile.fullName)}
              </AvatarFallback>
            </Avatar>
          ))}
          {task.assignees.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{task.assignees.length - 3}
            </span>
          )}
        </div>
      )}

      {task.dueDate && (
        <div className="text-xs text-muted-foreground mt-2">
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </div>
      )}

      {!canDrag && (
        <div className="text-xs text-muted-foreground mt-2 italic">
          Not assigned to you
        </div>
      )}
    </div>
  );
}
