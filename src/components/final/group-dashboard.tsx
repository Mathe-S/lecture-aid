"use client";

import { useState } from "react";
import { useQueryState } from "nuqs";
import { useAuth } from "@/context/AuthContext";
import type { FinalGroupWithDetails } from "@/lib/final-group-service";
import { useTaskStats } from "@/hooks/useFinalTasks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  FolderOpen,
  GitBranch,
  Activity,
  Calendar,
  Plus,
  ExternalLink,
  Lightbulb,
  Target,
} from "lucide-react";
import { ProjectIdeaEditor } from "./project-idea-editor";
import { RepositoryLinkDialog } from "./repository-link-dialog";
import { DraggableTaskBoard } from "./draggable-task-board";

interface GroupDashboardProps {
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

function ProjectOverviewSection({
  group,
  isOwner,
  onLinkRepository,
}: {
  group: FinalGroupWithDetails;
  isOwner: boolean;
  onLinkRepository: () => void;
}) {
  const taskStats = useTaskStats(group.id);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Group Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{group.name}</h3>
            {group.description && (
              <p className="text-muted-foreground">{group.description}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {group.members.map((member) => (
              <div
                key={member.profile.id}
                className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.profile.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(member.profile.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{member.profile.fullName}</span>
                {member.role === "owner" && (
                  <Badge variant="secondary" className="text-xs">
                    Owner
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              Created: {new Date(group.createdAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Selected Project Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Selected Project
          </CardTitle>
        </CardHeader>
        <CardContent>
          {group.selectedProject ? (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">{group.selectedProject.title}</h3>
                <Badge variant="outline" className="mt-1">
                  {group.selectedProject.category}
                </Badge>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Project Details
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No project selected yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Visit the Projects page to select a project
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GitHub Repository Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            GitHub Repository
          </CardTitle>
        </CardHeader>
        <CardContent>
          {group.repositoryUrl ? (
            <div className="space-y-3">
              <div>
                {group.repositoryOwner && group.repositoryName ? (
                  <p className="text-sm font-medium">
                    {group.repositoryOwner}/{group.repositoryName}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground break-all">
                    {group.repositoryUrl}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.open(group.repositoryUrl!, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Repository
                </Button>
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLinkRepository}
                    className="gap-2"
                  >
                    <GitBranch className="h-4 w-4" />
                    Update
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <GitBranch className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No repository linked yet</p>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-2"
                  onClick={onLinkRepository}
                >
                  <Plus className="h-4 w-4" />
                  Link Repository
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{Math.round(taskStats.completionRate)}%</span>
            </div>
            <Progress value={taskStats.completionRate} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {taskStats.done}
              </div>
              <div className="text-xs text-muted-foreground">
                Completed Tasks
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {taskStats.total}
              </div>
              <div className="text-xs text-muted-foreground">Total Tasks</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>3 weeks remaining</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TaskBoardSection({ group }: { group: FinalGroupWithDetails }) {
  return <DraggableTaskBoard group={group} />;
}

function TeamActivitySection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Track your team&apos;s recent contributions and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No activity yet</p>
            <p className="text-sm">
              Activity will appear here as team members work on tasks and make
              updates
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function GroupDashboard({ group }: GroupDashboardProps) {
  const { user } = useAuth();
  const isOwner = user?.id === group.owner.id;
  const [activeTab, setActiveTab] = useQueryState("tab", {
    defaultValue: "overview",
    clearOnDefault: true,
  });
  const [showRepositoryLinkDialog, setShowRepositoryLinkDialog] =
    useState(false);

  const handleLinkRepository = () => {
    setShowRepositoryLinkDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{group.name}</h2>
          <p className="text-muted-foreground">
            {group.members.length} member{group.members.length === 1 ? "" : "s"}{" "}
            •
            {group.selectedProject
              ? ` ${group.selectedProject.title}`
              : " No project selected"}
          </p>
        </div>
        <Badge variant={isOwner ? "default" : "secondary"}>
          {isOwner ? "Owner" : "Member"}
        </Badge>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="idea" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Project Idea
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <ProjectOverviewSection
            group={group}
            isOwner={isOwner}
            onLinkRepository={handleLinkRepository}
          />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <TaskBoardSection group={group} />
        </TabsContent>

        <TabsContent value="idea" className="mt-6">
          <ProjectIdeaEditor groupId={group.id} isOwner={isOwner} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <TeamActivitySection />
        </TabsContent>
      </Tabs>

      <RepositoryLinkDialog
        isOpen={showRepositoryLinkDialog}
        onOpenChange={setShowRepositoryLinkDialog}
        groupId={group.id}
        currentRepositoryUrl={group.repositoryUrl}
      />
    </div>
  );
}
