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
  GitCommit,
  GitMerge,
  Award,
  Edit,
  Mail,
  Calendar,
  User,
  Clock,
} from "lucide-react";
import type { TaskForGrading } from "@/lib/final-grading-service";

// Extended type for graded tasks with timestamp fields
interface GradedTask extends TaskForGrading {
  updatedAt: string;
  createdAt: string;
}

interface GradedTasksInterfaceProps {
  tasks: GradedTask[];
  week: number;
}

interface UpdateGradeDialogProps {
  task: GradedTask;
  grade: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SendFeedbackDialogProps {
  task: GradedTask;
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

function UpdateGradeDialog({
  task,
  grade,
  isOpen,
  onOpenChange,
}: UpdateGradeDialogProps) {
  const [points, setPoints] = useState(grade.points.toString());
  const [feedback, setFeedback] = useState(grade.feedback || "");
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

  // Update grade mutation
  const updateGradeMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch("/api/admin/final/grading/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to update grade");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Grade updated successfully!");
      queryClient.invalidateQueries({
        queryKey: ["admin", "grading", "graded-tasks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "grading", "stats"],
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update grade: ${error.message}`);
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

    updateGradeMutation.mutate({
      taskId: task.id,
      studentId: grade.studentId,
      points: pointsNum,
      feedback: feedback.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Update Grade: {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Info */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
            <Avatar>
              <AvatarImage src={grade.student.avatarUrl || undefined} />
              <AvatarFallback>
                {getInitials(grade.student.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{grade.student.fullName}</p>
              <p className="text-sm text-muted-foreground">
                {grade.student.email}
              </p>
            </div>
          </div>

          {/* Current Grade Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Current Grade</span>
            </div>
            <p className="text-sm">Score: {grade.points} points</p>
            <p className="text-sm text-muted-foreground">
              Graded by: {grade.grader.fullName} on{" "}
              {new Date(grade.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Update Form */}
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
              <Label htmlFor="feedback">Feedback</Label>
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
              disabled={updateGradeMutation.isPending}
            >
              {updateGradeMutation.isPending ? "Updating..." : "Update Grade"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SendFeedbackDialog({
  task,
  isOpen,
  onOpenChange,
}: SendFeedbackDialogProps) {
  const [subject, setSubject] = useState(`Feedback for Task: ${task.title}`);
  const [message, setMessage] = useState("");

  // Send feedback mutation
  const sendFeedbackMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch("/api/admin/final/grading/send-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to send feedback");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Feedback sent successfully!");
      onOpenChange(false);
      setMessage("");
    },
    onError: (error: Error) => {
      toast.error(`Failed to send feedback: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    const studentIds = task.assignees.map((a) => a.user.id);
    sendFeedbackMutation.mutate({
      taskId: task.id,
      studentIds,
      subject: subject.trim(),
      message: message.trim(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Feedback: {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipients */}
          <div>
            <Label>Recipients</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {task.assignees.map((assignee) => (
                <div
                  key={assignee.id}
                  className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={assignee.user.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(assignee.user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{assignee.user.fullName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your feedback message..."
              rows={6}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={sendFeedbackMutation.isPending}
            >
              {sendFeedbackMutation.isPending ? "Sending..." : "Send Feedback"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GradedTasksInterface({ tasks }: GradedTasksInterfaceProps) {
  const [selectedGrade, setSelectedGrade] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<GradedTask | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  const handleUpdateGrade = (task: GradedTask, grade: any) => {
    setSelectedTask(task);
    setSelectedGrade(grade);
    setShowUpdateDialog(true);
  };

  const handleSendFeedback = (task: GradedTask) => {
    setSelectedTask(task);
    setShowFeedbackDialog(true);
  };

  // Filter tasks that are graded
  const gradedTasks = tasks.filter((task) => task.status === "graded");

  if (gradedTasks.length === 0) {
    return (
      <div className="text-center py-8">
        <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-lg font-medium mb-2">No graded tasks found</p>
        <p className="text-muted-foreground">
          Graded tasks will appear here after you grade student submissions
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
            <TableHead>Grades</TableHead>
            <TableHead>Time & Creation Info</TableHead>
            <TableHead>Links</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gradedTasks.map((task) => (
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
                      <Badge variant="secondary">
                        {task.estimatedHours}h estimated
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  {task.grades?.map((grade) => (
                    <div
                      key={grade.id}
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={grade.student.avatarUrl || undefined}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(grade.student.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {grade.student.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {grade.points} pts
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleUpdateGrade(task, grade)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
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
                        src={task.createdBy?.avatarUrl || undefined}
                      />
                      <AvatarFallback className="text-xs">
                        {getInitials(task.createdBy?.fullName || null)}
                      </AvatarFallback>
                    </Avatar>
                    By: {task.createdBy?.fullName || "Unknown"}
                  </div>
                  {task.grades && task.grades.length > 0 && (
                    <div className="flex items-center gap-1 text-muted-foreground mt-2 pt-1 border-t">
                      <User className="h-3 w-3" />
                      Graded: {new Date(task.updatedAt).toLocaleDateString()}
                    </div>
                  )}
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleSendFeedback(task)}
                  >
                    <Mail className="h-3 w-3" />
                    Send Feedback
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Update Grade Dialog */}
      {selectedTask && selectedGrade && (
        <UpdateGradeDialog
          task={selectedTask}
          grade={selectedGrade}
          isOpen={showUpdateDialog}
          onOpenChange={setShowUpdateDialog}
        />
      )}

      {/* Send Feedback Dialog */}
      {selectedTask && (
        <SendFeedbackDialog
          task={selectedTask}
          isOpen={showFeedbackDialog}
          onOpenChange={setShowFeedbackDialog}
        />
      )}
    </div>
  );
}
