"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GraduationCap,
  ExternalLink,
  GitCommit,
  GitMerge,
  Award,
  Clock,
  Calendar,
} from "lucide-react";
import type { TaskForGrading } from "@/lib/final-grading-service";

interface TaskGradingInterfaceProps {
  tasks: TaskForGrading[];
  week: number;
}

interface GradeTaskDialogProps {
  task: TaskForGrading;
  student: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
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

function GradeTaskDialog({
  task,
  student,
  isOpen,
  onOpenChange,
}: GradeTaskDialogProps) {
  const [points, setPoints] = useState("");
  const [feedback, setFeedback] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const queryClient = useQueryClient();

  // Fetch feedback templates
  const { data: templates } = useQuery({
    queryKey: ["feedback-templates"],
    queryFn: async () => {
      const response = await fetch("/api/admin/final/feedback-templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json();
    },
  });

  // Grade task mutation
  const gradeTaskMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch("/api/admin/final/grading/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to grade task");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Task graded successfully!");
      queryClient.invalidateQueries({
        queryKey: ["admin", "grading", "tasks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "grading", "stats"],
      });
      onOpenChange(false);
      setPoints("");
      setFeedback("");
      setSelectedTemplate("");
    },
    onError: (error: Error) => {
      toast.error(`Failed to grade task: ${error.message}`);
    },
  });

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find((t: any) => t.id === templateId);
    if (template) {
      setFeedback(template.content);
      setSelectedTemplate(templateId);
    }
  };

  const handleSubmit = () => {
    if (!points) {
      toast.error("Please enter points");
      return;
    }

    const pointsNum = parseInt(points);

    if (pointsNum < 0) {
      toast.error("Points must be non-negative");
      return;
    }

    gradeTaskMutation.mutate({
      taskId: task.id,
      studentId: student.id,
      points: pointsNum,
      feedback: feedback.trim() || undefined,
    });
  };

  // Check if student already has a grade for this task
  const existingGrade = task.grades?.find((g) => g.studentId === student.id);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Grade Task: {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[75vh] overflow-y-auto pr-2">
          <div className="space-y-6">
            {/* Student Info */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <Avatar>
                <AvatarImage src={student.avatarUrl || undefined} />
                <AvatarFallback>{getInitials(student.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{student.fullName}</p>
                <p className="text-sm text-muted-foreground">{student.email}</p>
              </div>
            </div>

            {/* Complete Task Details */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Complete Task Information
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
                    <h6 className="font-medium text-sm mb-2">Description</h6>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-white p-3 rounded border">
                      {task.description}
                    </div>
                  </div>
                )}

                {/* Estimated Hours and Due Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {task.estimatedHours && (
                    <div>
                      <h6 className="font-medium text-sm mb-1">
                        Estimated Hours
                      </h6>
                      <p className="text-sm text-muted-foreground">
                        {task.estimatedHours} hour
                        {task.estimatedHours !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                  {task.dueDate && (
                    <div>
                      <h6 className="font-medium text-sm mb-1">Due Date</h6>
                      <p className="text-sm text-muted-foreground">
                        {new Date(task.dueDate).toLocaleDateString()} at{" "}
                        {new Date(task.dueDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Assignees */}
                {task.assignees.length > 0 && (
                  <div>
                    <h6 className="font-medium text-sm mb-2">
                      All Assigned Students
                    </h6>
                    <div className="flex flex-wrap gap-2">
                      {task.assignees.map((assignee) => (
                        <div
                          key={assignee.user.id}
                          className="flex items-center gap-2 bg-white rounded-full px-3 py-1 border"
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarImage
                              src={assignee.user.avatarUrl || undefined}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitials(assignee.user.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {assignee.user.fullName}
                          </span>
                          {assignee.user.id === student.id && (
                            <Badge variant="secondary" className="text-xs">
                              Grading
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Creation and Update Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-2 border-t">
                  <div>
                    <h6 className="font-medium mb-1">Created</h6>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={task.createdBy.avatarUrl || undefined}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(task.createdBy.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          {task.createdBy.fullName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(task.createdAt).toLocaleDateString()} at{" "}
                          {new Date(task.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h6 className="font-medium mb-1">Last Updated</h6>
                    <p className="text-muted-foreground text-xs">
                      {new Date(task.updatedAt).toLocaleDateString()} at{" "}
                      {new Date(task.updatedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Links */}
            {(task.commitLink || task.mergeRequestLink) && (
              <div className="space-y-3">
                <h6 className="font-medium text-sm">
                  Student Submission Links
                </h6>
                <div className="flex gap-2">
                  {task.commitLink && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => window.open(task.commitLink!, "_blank")}
                    >
                      <GitCommit className="h-4 w-4" />
                      View Commit
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                  {task.mergeRequestLink && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        window.open(task.mergeRequestLink!, "_blank")
                      }
                    >
                      <GitMerge className="h-4 w-4" />
                      View MR
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Existing Grade (if any) */}
            {existingGrade && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">
                    Already Graded
                  </span>
                </div>
                <p className="text-sm">Score: {existingGrade.points} points</p>
                {existingGrade.feedback && (
                  <p className="text-sm mt-1 text-muted-foreground">
                    Feedback: {existingGrade.feedback}
                  </p>
                )}
              </div>
            )}

            {/* Grading Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="points">Points Earned</Label>
                <Input
                  id="points"
                  type="number"
                  min="0"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="0"
                />
              </div>

              {/* Feedback Templates */}
              {templates && templates.length > 0 && (
                <div>
                  <Label>Feedback Template (Optional)</Label>
                  <Select
                    value={selectedTemplate}
                    onValueChange={handleTemplateSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template: any) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Feedback */}
              <div>
                <Label htmlFor="feedback">Feedback (Optional)</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide detailed feedback on the student's work..."
                  rows={4}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={gradeTaskMutation.isPending}
              >
                {gradeTaskMutation.isPending
                  ? "Grading..."
                  : existingGrade
                  ? "Update Grade"
                  : "Grade Task"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TaskGradingInterface({ tasks }: TaskGradingInterfaceProps) {
  const [selectedTask, setSelectedTask] = useState<TaskForGrading | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showGradeDialog, setShowGradeDialog] = useState(false);

  const handleGradeTask = (task: TaskForGrading, student: any) => {
    setSelectedTask(task);
    setSelectedStudent(student);
    setShowGradeDialog(true);
  };

  // Filter tasks that are in "done" status (ready for grading)
  const tasksReadyForGrading = tasks.filter((task) => task.status === "done");

  if (tasksReadyForGrading.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-lg font-medium mb-2">No tasks ready for grading</p>
        <p className="text-muted-foreground">
          Tasks will appear here when students mark them as done
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task Details</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Time & Dates</TableHead>
            <TableHead>Links</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasksReadyForGrading.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">
                        {task.description.slice(0, 100)}
                        {task.description.length > 100 && "..."}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Badge
                      variant={
                        task.priority === "high"
                          ? "destructive"
                          : task.priority === "medium"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {task.priority}
                    </Badge>
                    <Badge variant="outline">{task.status}</Badge>
                    {task.estimatedHours && (
                      <Badge variant="secondary">{task.estimatedHours}h</Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {task.assignees.map((assignee) => (
                    <div
                      key={assignee.user.id}
                      className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-1"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={assignee.user.avatarUrl || undefined}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(assignee.user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{assignee.user.fullName}</span>
                      {task.grades?.some(
                        (g) => g.studentId === assignee.user.id
                      ) && <Award className="h-3 w-3 text-green-600" />}
                    </div>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Created: {new Date(task.createdAt).toLocaleDateString()}
                  </div>
                  {task.dueDate && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Avatar className="h-3 w-3">
                      <AvatarImage
                        src={task.createdBy.avatarUrl || undefined}
                      />
                      <AvatarFallback className="text-xs">
                        {getInitials(task.createdBy.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    By: {task.createdBy.fullName || "Unknown"}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {task.commitLink && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => window.open(task.commitLink!, "_blank")}
                    >
                      <GitCommit className="h-4 w-4" />
                    </Button>
                  )}
                  {task.mergeRequestLink && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        window.open(task.mergeRequestLink!, "_blank")
                      }
                    >
                      <GitMerge className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {task.assignees.map((assignee) => {
                    const isGraded = task.grades?.some(
                      (g) => g.studentId === assignee.user.id
                    );
                    return (
                      <Button
                        key={assignee.user.id}
                        variant={isGraded ? "outline" : "default"}
                        size="sm"
                        className="gap-1"
                        onClick={() => handleGradeTask(task, assignee.user)}
                      >
                        <GraduationCap className="h-3 w-3" />
                        {isGraded ? "Update" : "Grade"}
                      </Button>
                    );
                  })}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Grade Task Dialog */}
      {selectedTask && selectedStudent && (
        <GradeTaskDialog
          task={selectedTask}
          student={selectedStudent}
          isOpen={showGradeDialog}
          onOpenChange={setShowGradeDialog}
        />
      )}
    </div>
  );
}
