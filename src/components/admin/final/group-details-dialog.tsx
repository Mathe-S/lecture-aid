"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Star,
  MessageSquare,
  Download,
  ExternalLink,
  GitBranch,
  CheckSquare,
  Users,
} from "lucide-react";

// Types
interface GroupMember {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: "owner" | "member";
  contributions?: {
    tasksCompleted: number;
    totalTasks: number;
    lastActive: string;
  };
}

interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "high" | "medium" | "low";
  assignees: GroupMember[];
  dueDate?: string;
}

interface Group {
  id: string;
  name: string;
  members: GroupMember[];
  status: "active" | "completed" | "archived";
  taskCompletionRate: number;
  currentScore: number;
  maxScore: number;
  githubUrl?: string;
  tasks?: Task[];
  createdAt: string;
  lastActive: string;
}

interface GroupDetailsDialogProps {
  group: Group | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper function to get initials
function getInitials(fullName: string | null): string {
  if (!fullName) return "U";
  return fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Helper function to format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Helper function to format status
function formatStatus(status: string | undefined): string {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function GroupDetailsDialog({
  group,
  isOpen,
  onOpenChange,
}: GroupDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {group.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Status and Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant={
                      group.status === "active"
                        ? "default"
                        : group.status === "completed"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {formatStatus(group.status)}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {group.currentScore}
                    </span>
                    <span className="text-muted-foreground">
                      /{group.maxScore} points
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Task Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Task Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Completion Rate
                    </span>
                    <span className="font-medium">
                      {group.taskCompletionRate}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${group.taskCompletionRate}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Star className="h-5 w-5" />
                    Grade
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Feedback
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Download className="h-5 w-5" />
                    Export
                  </Button>
                  {group.githubUrl && (
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <ExternalLink className="h-5 w-5" />
                      GitHub
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                <CardDescription>
                  Overview of all tasks and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assignees</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.tasks?.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          {task.title}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              task.status === "done"
                                ? "default"
                                : task.status === "in_progress"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {task.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          <div className="flex -space-x-2">
                            {task.assignees.map((assignee, index) => (
                              <Avatar
                                key={
                                  assignee.id || `${task.id}-assignee-${index}`
                                }
                                className="h-6 w-6 border-2 border-background"
                              >
                                <AvatarImage
                                  src={assignee.avatarUrl || undefined}
                                />
                                <AvatarFallback className="text-xs">
                                  {getInitials(assignee.fullName)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.dueDate
                            ? formatDate(task.dueDate)
                            : "No due date"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Team Members
                </CardTitle>
                <CardDescription>
                  Overview of team members and their contributions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead>Last Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.members.map((member, index) => (
                      <TableRow
                        key={member.id || `${group.id}-member-${index}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={member.avatarUrl || undefined}
                              />
                              <AvatarFallback>
                                {getInitials(member.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {member.fullName}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              member.role === "owner" ? "default" : "secondary"
                            }
                          >
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {member.contributions ? (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {member.contributions.tasksCompleted}
                              </span>
                              <span className="text-muted-foreground">
                                /{member.contributions.totalTasks}
                              </span>
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          {member.contributions?.lastActive
                            ? formatDate(member.contributions.lastActive)
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Activity Timeline
                </CardTitle>
                <CardDescription>Recent activity and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm">
                        Repository created on{" "}
                        <span className="font-medium">
                          {formatDate(group.createdAt)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm">
                        Last task completed on{" "}
                        <span className="font-medium">
                          {formatDate(group.lastActive)}
                        </span>
                      </p>
                    </div>
                  </div>
                  {group.githubUrl && (
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm">
                          GitHub repository:{" "}
                          <a
                            href={group.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Repository
                          </a>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
