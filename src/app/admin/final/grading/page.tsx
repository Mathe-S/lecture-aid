"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  Search,
  Filter,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Award,
} from "lucide-react";
import { TaskGradingInterface } from "@/components/admin/final/task-grading-interface";
import { FeedbackTemplateManager } from "@/components/admin/final/feedback-template-manager";

// Helper function to get week number from date
function getWeekNumber(date: Date): number {
  // This is a simplified week calculation - you might want to adjust based on your semester start date
  const startOfSemester = new Date("2024-01-15"); // Adjust this date
  const diffTime = Math.abs(date.getTime() - startOfSemester.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 7);
}

export default function AdminGradingPage() {
  // const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("grading");

  // Fetch tasks for grading
  const { data: tasksForGrading, isLoading } = useQuery({
    queryKey: ["admin", "grading", "tasks", selectedGroup],
    queryFn: async () => {
      const url =
        selectedGroup === "all"
          ? "/api/admin/final/grading/tasks"
          : `/api/admin/final/grading/tasks?groupId=${selectedGroup}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
  });

  // Fetch groups for filter
  const { data: groups } = useQuery({
    queryKey: ["admin", "final", "groups"],
    queryFn: async () => {
      const response = await fetch("/api/admin/final/groups");
      if (!response.ok) throw new Error("Failed to fetch groups");
      return response.json();
    },
  });

  // Fetch grading statistics
  const { data: gradingStats } = useQuery({
    queryKey: ["admin", "grading", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/final/grading/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  // Filter tasks based on search and filters
  const filteredTasks =
    tasksForGrading?.filter((task: any) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignees.some((assignee: any) =>
          assignee.user.fullName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
        );

      const matchesWeek =
        selectedWeek === "all" ||
        getWeekNumber(new Date(task.updatedAt)) === parseInt(selectedWeek);

      return matchesSearch && matchesWeek;
    }) || [];

  // Group tasks by week for display
  const tasksByWeek = filteredTasks.reduce((acc: any, task: any) => {
    const week = getWeekNumber(new Date(task.updatedAt));
    if (!acc[week]) acc[week] = [];
    acc[week].push(task);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">Loading grading interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Final Project Grading</h1>
          <p className="text-muted-foreground">
            Grade student submissions and provide feedback
          </p>
        </div>
        <Badge variant="secondary" className="gap-2">
          <GraduationCap className="h-4 w-4" />
          Admin
        </Badge>
      </div>

      {/* Statistics Overview */}
      {gradingStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {gradingStats.totalTasks}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Grading
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {gradingStats.pendingTasks}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Graded</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {gradingStats.gradedTasks}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Score
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {gradingStats.averageScore.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grading" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Task Grading
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Filter className="h-4 w-4" />
            Feedback Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grading" className="mt-6">
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tasks or students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select
                    value={selectedGroup}
                    onValueChange={setSelectedGroup}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {groups?.map((group: any) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Week" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Weeks</SelectItem>
                      <SelectItem value="1">Week 1</SelectItem>
                      <SelectItem value="2">Week 2</SelectItem>
                      <SelectItem value="3">Week 3</SelectItem>
                      <SelectItem value="4">Week 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tasks by Week */}
            <div className="space-y-6">
              {Object.keys(tasksByWeek)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map((week) => (
                  <Card key={week}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Week {week}
                        <Badge variant="outline">
                          {tasksByWeek[week].length} task(s)
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TaskGradingInterface
                        tasks={tasksByWeek[week]}
                        week={parseInt(week)}
                      />
                    </CardContent>
                  </Card>
                ))}

              {Object.keys(tasksByWeek).length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">
                        No tasks to grade
                      </p>
                      <p className="text-muted-foreground">
                        All tasks have been graded or no tasks match your
                        filters
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <FeedbackTemplateManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
