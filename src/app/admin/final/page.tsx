"use client";

import { useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Users,
  GitBranch,
  CheckSquare,
  Calendar,
  BarChart3,
  Download,
  MessageSquare,
  Star,
  TrendingUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { GroupsOverview } from "@/components/admin/final/groups-overview";

// Types for the admin final projects data
interface FinalProjectsData {
  groups: any[];
  tasks: any[];
  evaluations: any[];
  summary: {
    totalStudents: number;
    evaluatedStudents: number;
    averageScore: number;
    weeklyAverages: {
      week1: number;
      week2: number;
      week3: number;
      week4: number;
    };
  };
  weeklyMaxScores: {
    week1: number;
    week2: number;
    week3: number;
    week4: number;
  };
}

// Fetch functions
async function fetchFinalProjectsData(): Promise<FinalProjectsData> {
  const [groupsRes, tasksRes, evaluationsRes] = await Promise.all([
    fetch("/api/admin/final"),
    fetch("/api/admin/final/tasks"),
    fetch("/api/admin/final/evaluations"),
  ]);

  if (!groupsRes.ok || !tasksRes.ok || !evaluationsRes.ok) {
    throw new Error("Failed to fetch final projects data");
  }

  const [groups, tasks, evaluationsData] = await Promise.all([
    groupsRes.json(),
    tasksRes.json(),
    evaluationsRes.json(),
  ]);

  return {
    groups,
    tasks,
    evaluations: evaluationsData.evaluations,
    summary: evaluationsData.summary,
    weeklyMaxScores: evaluationsData.weeklyMaxScores,
  };
}

export default function AdminFinalProjectsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const {
    data: finalData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "final-projects"],
    queryFn: fetchFinalProjectsData,
  });

  if (isLoading) {
    return (
      <RoleGuard allowedRoles={["admin"]}>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                Loading final projects data...
              </p>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard allowedRoles={["admin"]}>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-red-600">
                <p>Failed to load final projects data</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    );
  }

  const { groups, tasks, summary, weeklyMaxScores } = finalData!;

  // Calculate statistics
  const totalGroups = groups.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task: any) => task.status === "done"
  ).length;
  // const gradedTasks = tasks.filter(
  //   (task: any) => task.status === "graded"
  // ).length;
  const pendingGradingTasks = tasks.filter(
    (task: any) => task.status === "done"
  ).length;
  const taskCompletionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Final Projects Administration
            </h1>
            <p className="text-muted-foreground">
              Manage and grade final project submissions with weekly scoring
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className="gap-2 relative"
              onClick={() => (window.location.href = "/admin/final/grading")}
            >
              <Star className="h-4 w-4" />
              Grade Tasks
              {pendingGradingTasks > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-1 px-1.5 py-0.5 text-xs"
                >
                  {pendingGradingTasks}
                </Badge>
              )}
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Grades
            </Button>
            <Button variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Send Feedback
            </Button>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Groups
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGroups}</div>
              <p className="text-xs text-muted-foreground">
                Active final project groups
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Students Evaluated
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.evaluatedStudents}/{summary.totalStudents}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round(
                  (summary.evaluatedStudents / summary.totalStudents) * 100
                )}
                % completion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Score
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.averageScore}/450
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((summary.averageScore / 450) * 100)}% average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Task Completion
              </CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taskCompletionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {completedTasks}/{totalTasks} tasks completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Scores Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Score Averages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(summary.weeklyAverages).map(([week, average]) => {
                const weekNum = parseInt(week.replace("week", ""));
                const maxScore =
                  weeklyMaxScores[week as keyof typeof weeklyMaxScores];
                const percentage = Math.round((average / maxScore) * 100);

                return (
                  <div key={week} className="text-center">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Week {weekNum}
                    </div>
                    <div className="text-2xl font-bold">
                      {average}/{maxScore}
                    </div>
                    <Badge
                      variant={
                        percentage >= 80
                          ? "default"
                          : percentage >= 60
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {percentage}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    className="h-20 flex-col gap-2 relative"
                    onClick={() =>
                      (window.location.href = "/admin/final/grading")
                    }
                  >
                    <Star className="h-6 w-6" />
                    <span>Grade Students</span>
                    {pendingGradingTasks > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs"
                      >
                        {pendingGradingTasks}
                      </Badge>
                    )}
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <GitBranch className="h-6 w-6" />
                    GitHub Analysis
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Calendar className="h-6 w-6" />
                    Progress Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Final Project Groups</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Overview of all final project groups and their progress
                </p>
              </CardHeader>
              <CardContent>
                <GroupsOverview groups={groups} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evaluations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Evaluations</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Grade student task submissions with points and feedback
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Star className="h-16 w-16 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">
                    Task Grading System
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Grade individual tasks submitted by students. Review their
                    commit/merge request links and provide detailed feedback.
                  </p>
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={() =>
                      (window.location.href = "/admin/final/grading")
                    }
                  >
                    <Star className="h-5 w-5" />
                    Open Grading Interface
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Reports</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Detailed analytics on project progress and student performance
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Analytics dashboard will be implemented next</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}
