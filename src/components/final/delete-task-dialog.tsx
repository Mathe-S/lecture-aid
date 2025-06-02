"use client";

import { useDeleteTask } from "@/hooks/useFinalTasks";
import type { TaskWithDetails } from "@/lib/final-task-service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface DeleteTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithDetails;
  groupId: string;
}

export function DeleteTaskDialog({
  isOpen,
  onOpenChange,
  task,
  groupId,
}: DeleteTaskDialogProps) {
  const deleteTaskMutation = useDeleteTask(groupId);

  const handleDelete = async () => {
    try {
      await deleteTaskMutation.mutateAsync(task.id);
      onOpenChange(false);
    } catch {
      // Error is handled by the mutation
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Task</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{task.title}&quot;? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteTaskMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteTaskMutation.isPending}
            className="bg-destructive  hover:bg-destructive/90"
          >
            {deleteTaskMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Delete Task
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
