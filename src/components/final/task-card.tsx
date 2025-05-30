"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { TaskWithDetails } from "@/lib/final-task-service";
import type { FinalGroupWithDetails } from "@/lib/final-group-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditTaskDialog } from "./edit-task-dialog";

interface TaskCardProps {
  task: TaskWithDetails;
  canDrag: boolean;
  group: FinalGroupWithDetails;
  userId?: string;
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

export function TaskCard({ task, canDrag, group, userId }: TaskCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    disabled: !canDrag,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  // Check if current user can edit this task (is assigned to it)
  const canEdit =
    userId && task.assignees.some((assignee) => assignee.profile.id === userId);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag from starting
    setShowEditDialog(true);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={cn(
          "p-3 border rounded-lg transition-shadow duration-200 relative group",
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
        {/* Edit Button - Only visible to assigned users */}
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute bottom-2 right-2 h-8 w-8 p-0 opacity-20 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white shadow-sm border border-gray-200"
            onClick={handleEditClick}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}

        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm line-clamp-2 pr-6">
            {task.title}
          </h4>
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
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2 whitespace-pre-wrap">
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

      {/* Edit Task Dialog */}
      {showEditDialog && canEdit && (
        <EditTaskDialog
          isOpen={showEditDialog}
          onOpenChange={setShowEditDialog}
          task={task}
          group={group}
        />
      )}
    </>
  );
}
