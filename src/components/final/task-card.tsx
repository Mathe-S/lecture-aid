"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { TaskWithDetails } from "@/lib/final-task-service";
import type { FinalGroupWithDetails } from "@/lib/final-group-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, Award, MessageSquare, FolderOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { EditTaskDialog } from "./edit-task-dialog";
import { DeleteTaskDialog } from "./delete-task-dialog";

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showGradeDialog, setShowGradeDialog] = useState(false);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    disabled: !canDrag,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  // Check if current user can edit this task (is assigned to it and task is not graded)
  const canEdit =
    userId &&
    task.status !== "graded" &&
    task.assignees.some((assignee) => assignee.profile.id === userId);

  // Check if current user can delete this task (and task is not graded)
  const canDelete =
    userId &&
    task.status !== "graded" &&
    (() => {
      const hasAssignees = task.assignees.length > 0;
      if (hasAssignees) {
        // If task has assignees, only assignees can delete it
        return task.assignees.some(
          (assignee) => assignee.profile.id === userId
        );
      } else {
        // If task has no assignees, only group owner can delete it
        const userMembership = group.members.find(
          (member) => member.profile.id === userId
        );
        return userMembership?.role === "owner";
      }
    })();

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag from starting
    setShowEditDialog(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag from starting
    setShowDeleteDialog(true);
  };

  const handleGradeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag from starting
    setShowGradeDialog(true);
  };

  // Get the current user's grade for this task (if it exists)
  const userGrade =
    userId && task.grades?.find((grade) => grade.studentId === userId);
  const hasGrade = task.status === "graded" && userGrade;

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
          task.status === "graded" &&
            "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200",
          !canDrag && "opacity-60"
        )}
      >
        {/* Action Buttons - Only visible to users with permissions */}
        {(canEdit || canDelete) && (
          <div className="absolute bottom-2 right-2 flex gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white/80 hover:bg-white shadow-sm border border-gray-200"
                onClick={handleEditClick}
                title="Edit task"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white/80 hover:bg-red-50 shadow-sm border border-gray-200 hover:border-red-200"
                onClick={handleDeleteClick}
                title="Delete task"
              >
                <Trash2 className="h-3 w-3 text-red-600" />
              </Button>
            )}
          </div>
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

        {!canDrag && task.status !== "graded" && (
          <div className="text-xs text-muted-foreground mt-2 italic">
            Not assigned to you
          </div>
        )}

        {/* Grade Display for Graded Tasks */}
        {hasGrade && userGrade && (
          <div className="mt-3 pt-2 border-t border-yellow-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-600" />
                <div>
                  <div className="text-sm font-medium text-yellow-800">
                    Score: {userGrade.points}/{userGrade.maxPoints}
                  </div>
                  <div className="text-xs text-yellow-600">
                    {Math.round((userGrade.points / userGrade.maxPoints) * 100)}
                    %
                  </div>
                </div>
              </div>
              {userGrade.feedback && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100"
                  onClick={handleGradeClick}
                  title="View feedback"
                >
                  <MessageSquare className="h-3 w-3" />
                </Button>
              )}
            </div>
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

      {/* Delete Task Dialog */}
      {showDeleteDialog && canDelete && (
        <DeleteTaskDialog
          isOpen={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          task={task}
          groupId={group.id}
        />
      )}

      {/* Grade Feedback Dialog */}
      {showGradeDialog && hasGrade && userGrade && (
        <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                Graded Task: {task.title}
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Task Details Section */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Task Details
                  </h4>

                  <div className="space-y-4">
                    {/* Title and Priority */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h5 className="font-medium text-lg">{task.title}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              task.priority === "high"
                                ? "destructive"
                                : task.priority === "medium"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {task.priority} priority
                          </Badge>
                          <Badge variant="outline">
                            {task.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {task.description && (
                      <div>
                        <h6 className="font-medium text-sm mb-2">
                          Description
                        </h6>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-white p-3 rounded border">
                          {task.description}
                        </div>
                      </div>
                    )}

                    {/* Assignees */}
                    {task.assignees.length > 0 && (
                      <div>
                        <h6 className="font-medium text-sm mb-2">
                          Assigned to
                        </h6>
                        <div className="flex flex-wrap gap-2">
                          {task.assignees.map((assignee) => (
                            <div
                              key={assignee.profile.id}
                              className="flex items-center gap-2 bg-white rounded-full px-3 py-1 border"
                            >
                              <Avatar className="h-5 w-5">
                                <AvatarImage
                                  src={assignee.profile.avatarUrl || undefined}
                                />
                                <AvatarFallback className="text-xs">
                                  {getInitials(assignee.profile.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {assignee.profile.fullName}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h6 className="font-medium mb-1">Created</h6>
                        <p className="text-muted-foreground">
                          {new Date(task.createdAt).toLocaleDateString()} at{" "}
                          {new Date(task.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {task.dueDate && (
                        <div>
                          <h6 className="font-medium mb-1">Due Date</h6>
                          <p className="text-muted-foreground">
                            {new Date(task.dueDate).toLocaleDateString()} at{" "}
                            {new Date(task.dueDate).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grade Summary */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      <span className="font-semibold text-yellow-800">
                        Your Score
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-800">
                        {userGrade.points}/{userGrade.maxPoints}
                      </div>
                      <div className="text-sm text-yellow-600">
                        {Math.round(
                          (userGrade.points / userGrade.maxPoints) * 100
                        )}
                        %
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-yellow-700">
                    Graded by: {userGrade.grader.fullName} on{" "}
                    {new Date(userGrade.gradedAt).toLocaleDateString()} at{" "}
                    {new Date(userGrade.gradedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {/* Feedback */}
                {userGrade.feedback ? (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Instructor Feedback
                    </h4>
                    <div className="bg-white border rounded-lg p-4">
                      <div className="text-sm whitespace-pre-wrap">
                        {userGrade.feedback}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No feedback provided for this task.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
