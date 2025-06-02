"use client";

import { useState, useEffect } from "react";
import { useUpdateTask, useAssignUsersToTask } from "@/hooks/useFinalTasks";
import type { FinalGroupWithDetails } from "@/lib/final-group-service";
import type { TaskWithDetails, TaskPriority } from "@/lib/final-task-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, Loader2, Edit } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EditTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithDetails;
  group: FinalGroupWithDetails;
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

export function EditTaskDialog({
  isOpen,
  onOpenChange,
  task,
  group,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [estimatedHours, setEstimatedHours] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);

  const updateTaskMutation = useUpdateTask(group.id);
  const assignUsersMutation = useAssignUsersToTask(group.id);

  // Initialize form with task data when dialog opens
  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setEstimatedHours(task.estimatedHours?.toString() || "");
      setSelectedAssignees(
        task.assignees.map((assignee) => assignee.profile.id)
      );
    }
  }, [isOpen, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    try {
      // First update the task details
      await updateTaskMutation.mutateAsync({
        taskId: task.id,
        payload: {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate?.toISOString(),
          estimatedHours: estimatedHours ? parseInt(estimatedHours) : undefined,
        },
      });

      // Then update assignees if they changed
      const currentAssigneeIds = task.assignees.map(
        (assignee) => assignee.profile.id
      );
      const assigneesChanged =
        selectedAssignees.length !== currentAssigneeIds.length ||
        selectedAssignees.some((id) => !currentAssigneeIds.includes(id));

      if (assigneesChanged) {
        await assignUsersMutation.mutateAsync({
          taskId: task.id,
          assigneeIds: selectedAssignees,
        });
      }

      onOpenChange(false);
    } catch {
      // Error is handled by the mutations
    }
  };

  const handleAssigneeToggle = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const isLoading =
    updateTaskMutation.isPending || assignUsersMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Task
          </DialogTitle>
          <DialogDescription>
            Update task details and assignees. You can modify all aspects of
            this task since you&apos;re assigned to it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task in detail..."
              rows={3}
            />
          </div>

          {/* Priority and Estimated Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value: TaskPriority) => setPriority(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 High</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                min="1"
                max="100"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="e.g., 8"
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setShowCalendar(false);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Assignees */}
          <div className="space-y-3">
            <Label>Assign to Team Members</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {group.members.map((member) => (
                <div
                  key={member.profile.id}
                  className="flex items-center space-x-3"
                >
                  <Checkbox
                    id={`assignee-${member.profile.id}`}
                    checked={selectedAssignees.includes(member.profile.id)}
                    onCheckedChange={() =>
                      handleAssigneeToggle(member.profile.id)
                    }
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={member.profile.avatarUrl || undefined}
                      />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.profile.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <Label
                      htmlFor={`assignee-${member.profile.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {member.profile.fullName}
                      {member.role === "owner" && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (Owner)
                        </span>
                      )}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
            {selectedAssignees.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedAssignees.length} member
                {selectedAssignees.length === 1 ? "" : "s"} selected
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isLoading}
              className="gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
