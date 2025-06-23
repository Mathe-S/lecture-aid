"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  Calendar,
  Clock,
  User,
  CheckCircle,
  Eye,
  GitCommit,
  GitMerge,
  ExternalLink,
} from "lucide-react";
import type { TaskForGrading } from "@/lib/final-grading-service";

interface AppealsInterfaceProps {
  tasks: TaskForGrading[];
  week: number;
}

interface AppealDialogProps {
  task: TaskForGrading | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (data: any) => void;
}

function getInitials(fullName: string | null): string {
  if (!fullName) return "U";
  return fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high":
      return "destructive";
    case "medium":
      return "default";
    case "low":
      return "secondary";
    default:
      return "outline";
  }
}

function extractAppealInfo(description: string | null) {
  if (!description) return null;

  // Look for appeal information in the description
  const appealMatch = description.match(
    /---\s*GRADE APPEAL\s*---([\s\S]*?)---\s*END APPEAL\s*---/
  );
  if (!appealMatch) return null;

  const appealText = appealMatch[1].trim();
  const pointsMatch = appealText.match(/Requested Points:\s*(\d+)/);
  // Capture everything after "Reason:" until the end of the appeal text
  const reasonMatch = appealText.match(/Reason:\s*([\s\S]*)/);

  return {
    requestedPoints: pointsMatch ? parseInt(pointsMatch[1]) : null,
    reason: reasonMatch ? reasonMatch[1].trim() : null,
    fullAppealText: appealText,
  };
}

function getOriginalDescription(description: string | null): string {
  if (!description) return "";

  // Extract the original description before any appeal information
  const appealStartIndex = description.indexOf("--- GRADE APPEAL ---");
  if (appealStartIndex !== -1) {
    return description.substring(0, appealStartIndex).trim();
  }

  return description;
}

function renderTextWithLinks(text: string) {
  // Simple URL regex to match http/https URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    // Create a new regex for testing to avoid state issues
    const testRegex = /(https?:\/\/[^\s]+)/g;
    if (testRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

function AppealDialog({ task, isOpen, onClose, onResolve }: AppealDialogProps) {
  const [points, setPoints] = useState("");
  const [feedback, setFeedback] = useState("");
  const [adminResponse, setAdminResponse] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  if (!task) return null;

  const appealInfo = extractAppealInfo(task.description);

  // Find the student's current grade if exists

  const handleResolve = () => {
    if (!selectedStudentId || !points) return;

    onResolve({
      taskId: task.id,
      studentId: selectedStudentId,
      points: parseInt(points),
      feedback,
      adminResponse,
    });

    // Reset form
    setPoints("");
    setFeedback("");
    setAdminResponse("");
    setSelectedStudentId("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Grade Appeal Review
          </DialogTitle>
          <DialogDescription>
            Review and resolve the grade appeal for this task
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Complete Task Details - Matching Grading Interface */}
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
                    {task.estimatedHours && (
                      <Badge variant="outline">{task.estimatedHours}h</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div>
                  <h6 className="font-medium text-sm mb-2">Description</h6>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-white p-3 rounded border">
                    {renderTextWithLinks(
                      getOriginalDescription(task.description)
                    )}
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
              <h6 className="font-medium text-sm">Student Submission Links</h6>
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

          {/* Appeal Information */}
          {appealInfo && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  Appeal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {appealInfo.requestedPoints && (
                  <div>
                    <span className="font-medium">Requested Points:</span>{" "}
                    <Badge variant="outline">
                      {appealInfo.requestedPoints}
                    </Badge>
                  </div>
                )}
                {appealInfo.reason && (
                  <div>
                    <span className="font-medium">Student&apos;s Reason:</span>
                    <div className="mt-1 p-3 bg-white rounded border text-sm whitespace-pre-wrap max-h-none">
                      {appealInfo.reason}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assigned Students */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Students & Current Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {task.assignees.map((assignee) => {
                  const grade = task.grades?.find(
                    (g) => g.studentId === assignee.user.id
                  );
                  return (
                    <div
                      key={assignee.user.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedStudentId === assignee.user.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => {
                        setSelectedStudentId(assignee.user.id);
                        if (grade) {
                          setPoints(grade.points.toString());
                          setFeedback(grade.feedback || "");
                        } else {
                          setPoints(
                            appealInfo?.requestedPoints?.toString() || ""
                          );
                          setFeedback("");
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={assignee.user.avatarUrl || undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(assignee.user.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {assignee.user.fullName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {assignee.user.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {grade ? (
                          <div>
                            <Badge variant="secondary">
                              {grade.points} pts
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Graded{" "}
                              {new Date(grade.gradedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <Badge variant="outline">Not graded</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Resolution Form */}
          {selectedStudentId && (
            <Card>
              <CardHeader>
                <CardTitle>Resolve Appeal</CardTitle>
                <CardDescription>
                  Update the grade and provide response to the student
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      type="number"
                      min="0"
                      value={points}
                      onChange={(e) => setPoints(e.target.value)}
                      placeholder="Enter points"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="feedback">Feedback (Optional)</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback on the task..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="adminResponse">
                    Admin Response to Appeal
                  </Label>
                  <Textarea
                    id="adminResponse"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Explain your decision regarding this appeal..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2 flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleResolve}
            disabled={!selectedStudentId || !points}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Resolve Appeal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AppealsInterface({ tasks, week }: AppealsInterfaceProps) {
  const [selectedTask, setSelectedTask] = useState<TaskForGrading | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const resolveAppealMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/admin/final/grading/resolve-appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to resolve appeal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "grading"] });
      setIsDialogOpen(false);
    },
  });

  const handleViewAppeal = (task: TaskForGrading) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">No appeals for Week {week}</p>
        <p className="text-muted-foreground">
          Appeals will appear here when students appeal their grades
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const appealInfo = extractAppealInfo(task.description);

        return (
          <Card key={task.id} className="border-orange-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(task.priority) as any}>
                      {task.priority}
                    </Badge>
                    <h3 className="font-semibold">{task.title}</h3>
                    {task.estimatedHours && (
                      <Badge variant="outline">{task.estimatedHours}h</Badge>
                    )}
                    <Badge variant="secondary" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Appeal
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Group: {task.groupId}
                  </p>
                </div>
                <Button
                  onClick={() => handleViewAppeal(task)}
                  size="sm"
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Review Appeal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Appeal Summary */}
                {appealInfo && (
                  <div className="bg-orange-50 p-3 rounded-md border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-orange-800">
                        Appeal Summary
                      </span>
                    </div>
                    {appealInfo.requestedPoints && (
                      <p className="text-sm">
                        <span className="font-medium">Requested Points:</span>{" "}
                        {appealInfo.requestedPoints}
                      </p>
                    )}
                    {appealInfo.reason && (
                      <p className="text-sm mt-1">
                        <span className="font-medium">Reason:</span>{" "}
                        {appealInfo.reason}
                      </p>
                    )}
                  </div>
                )}

                {/* Assigned Students */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Assigned Students ({task.assignees.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {task.assignees.map((assignee) => {
                      const grade = task.grades?.find(
                        (g) => g.studentId === assignee.user.id
                      );
                      return (
                        <div
                          key={assignee.user.id}
                          className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1"
                        >
                          <Avatar className="h-6 w-6">
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
                          {grade && (
                            <Badge variant="outline" className="text-xs">
                              {grade.points} pts
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Task Details */}
                <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Due:{" "}
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : "No due date"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Updated: {new Date(task.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    By: {task.createdBy.fullName}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <AppealDialog
        task={selectedTask}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onResolve={(data) => resolveAppealMutation.mutate(data)}
      />
    </div>
  );
}
