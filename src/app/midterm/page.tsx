"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  GitBranch,
  GitFork,
  Plus,
  Users,
  Loader2,
  Github,
  Calendar,
  ExternalLink,
  Pencil,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import {
  useMidtermGroups,
  useCreateMidtermGroup,
  useJoinMidtermGroup,
  useConnectRepository,
  useUpdateRepository,
  useLeaveGroup,
} from "@/hooks/useMidtermGroups";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MidtermPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [connectingGroupId, setConnectingGroupId] = useState<string | null>(
    null
  );
  const [updatingGroupId, setUpdatingGroupId] = useState<string | null>(null);
  const { leaveGroup, isLoading: isLeavingGroup } = useLeaveGroup();
  const [groupToLeave, setGroupToLeave] = useState<string | null>(null);

  // Use our custom hooks
  const { data: groups = [], isLoading } = useMidtermGroups();
  const { createGroup, isLoading: isCreatingGroup } = useCreateMidtermGroup();
  const { joinGroup } = useJoinMidtermGroup();
  const { connectRepository, isLoading: isConnectingRepo } =
    useConnectRepository();
  const { updateRepository, isLoading: isUpdatingRepo } = useUpdateRepository();

  // Filter groups the user is a member of
  const userGroups = groups.filter((group) =>
    group.members.some((member) => member.userId === user?.id)
  );

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      await createGroup({
        name: newGroupName,
        description: newGroupDescription || undefined,
      });

      setNewGroupName("");
      setNewGroupDescription("");
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Failed to create group", error);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await joinGroup(groupId);
    } catch (error) {
      console.error("Failed to join group", error);
    }
  };

  const handleConnectRepository = async (groupId: string) => {
    if (!repositoryUrl.trim() || !repositoryUrl.includes("github.com")) {
      return;
    }

    try {
      await connectRepository({
        groupId,
        repositoryUrl,
      });

      setRepositoryUrl("");
      setConnectingGroupId(null);
    } catch (error) {
      console.error("Failed to connect repository", error);
    }
  };

  const handleUpdateRepository = async (groupId: string) => {
    if (!repositoryUrl.trim() || !repositoryUrl.includes("github.com")) {
      return;
    }

    try {
      await updateRepository({
        groupId,
        repositoryUrl,
      });

      setRepositoryUrl("");
      setUpdatingGroupId(null);
    } catch (error) {
      console.error("Failed to update repository", error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupToLeave) return;
    try {
      await leaveGroup(groupToLeave);
      setGroupToLeave(null);
    } catch (error) {
      console.error("Failed to leave group", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <main className="container mx-auto py-10 px-4 md:px-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Midterm Project</h1>
          <p className="text-muted-foreground">
            Create or join a group for your midterm project. Track your progress
            and visualize your contributions.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
            <CardDescription>
              Build a Flashcard Browser Extension with Hand Gesture Detection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-semibold">Requirements</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>
                    Browser Extension for creating flashcards from selected text
                    (Can be changed according to the group)
                  </li>
                  <li>
                    Hand gesture detection for flashcard review (Can be changed
                    according to the group)
                  </li>
                  <li>Well-tested code with clear specifications</li>
                  <li>
                    Documentation with Abstract Functions and Representation
                    Invariants.
                  </li>
                  <li>Clean Git workflow with proper commits and PRs</li>
                </ul>
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-semibold">Grading (250 points)</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Specification (50 points):</strong> Clear
                    descriptions of what your code does
                  </p>
                  <p>
                    <strong>Testing (50 points):</strong> Comprehensive test
                    suite to verify functionality
                  </p>
                  <p>
                    <strong>Implementation (100 points):</strong> Working code
                    that meets requirements
                  </p>
                  <p>
                    <strong>Documentation (25 points):</strong> Clean, readable
                    code with AF/RI explanations if applicable
                  </p>
                  <p>
                    <strong>Git Workflow (25 points):</strong> Meaningful
                    commits, branches, and pull requests
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  3 weeks (April 10 - May 1)
                </span>
              </div>

              <Link
                href="https://teams.microsoft.com/l/message/19:9p7CGZbtOZFaFMj-DSfRQ3fh66rKS3pYnxgvCemxJMQ1@thread.tacv2/1744194496683?tenantId=b5a13ba1-627c-4358-8b6f-cc09027ff3af&groupId=afe80f18-d6e8-449c-96dd-28f43aa85efa&parentMessageId=1744194496683&teamName=Introduction%20to%20Software%20Engineering%20Practical%20Course%202024-2025&channelName=General&createdTime=1744194496683"
                target="_blank"
                className="text-sm text-blue-600 hover:underline flex items-center"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Full Assignment
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Your Project Groups</h2>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Project Group</DialogTitle>
                  <DialogDescription>
                    Create a new group for your midterm project. You&apos;ll be
                    automatically added as the owner.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Group Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Team Awesome"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Briefly describe your project approach"
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim() || isCreatingGroup}
                  >
                    {isCreatingGroup ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Group"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {userGroups.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium">No Groups Yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  You haven&apos;t created or joined any project groups yet.
                  Create a new group or join an existing one.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setShowCreateDialog(true)}
                >
                  Create Your First Group
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {userGroups.map((group) => (
                <Card key={group.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5 text-blue-500" />
                      {group.name}
                    </CardTitle>
                    <CardDescription>
                      {group.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-medium text-muted-foreground">
                          Repository
                        </div>
                        {group.repositoryUrl ? (
                          <div className="flex items-center">
                            <a
                              href={group.repositoryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:underline"
                            >
                              <Github className="h-4 w-4" />
                              {group.repositoryOwner}/{group.repositoryName}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <Dialog
                              open={updatingGroupId === group.id}
                              onOpenChange={(open) => {
                                if (open && group.repositoryUrl) {
                                  setRepositoryUrl(group.repositoryUrl);
                                }
                                if (!open) setUpdatingGroupId(null);
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 ml-1"
                                  onClick={() => setUpdatingGroupId(group.id)}
                                >
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                  <span className="sr-only">
                                    Update Repository
                                  </span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Update GitHub Repository
                                  </DialogTitle>
                                  <DialogDescription>
                                    Update the connected GitHub repository URL.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2 py-4">
                                  <Label
                                    htmlFor={`update-repo-url-${group.id}`}
                                  >
                                    Repository URL
                                  </Label>
                                  <Input
                                    id={`update-repo-url-${group.id}`}
                                    placeholder="https://github.com/username/repo"
                                    value={repositoryUrl}
                                    onChange={(e) =>
                                      setRepositoryUrl(e.target.value)
                                    }
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Must be a public GitHub repository
                                  </p>
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={() =>
                                      handleUpdateRepository(group.id)
                                    }
                                    disabled={
                                      isUpdatingRepo ||
                                      !repositoryUrl.includes("github.com")
                                    }
                                  >
                                    {isUpdatingRepo ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                      </>
                                    ) : (
                                      "Update Repository"
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              No repository connected
                            </span>

                            <Dialog
                              open={connectingGroupId === group.id}
                              onOpenChange={(open) =>
                                !open && setConnectingGroupId(null)
                              }
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setConnectingGroupId(group.id)}
                                >
                                  Connect
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Connect GitHub Repository
                                  </DialogTitle>
                                  <DialogDescription>
                                    Connect your GitHub repository to track
                                    progress and visualize contributions.
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-2 py-4">
                                  <Label htmlFor="repo-url">
                                    Repository URL
                                  </Label>
                                  <Input
                                    id="repo-url"
                                    placeholder="https://github.com/username/repo"
                                    value={repositoryUrl}
                                    onChange={(e) =>
                                      setRepositoryUrl(e.target.value)
                                    }
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Must be a public GitHub repository
                                  </p>
                                </div>

                                <DialogFooter>
                                  <Button
                                    onClick={() =>
                                      handleConnectRepository(group.id)
                                    }
                                    disabled={
                                      isConnectingRepo ||
                                      !repositoryUrl.includes("github.com")
                                    }
                                  >
                                    {isConnectingRepo ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Connecting...
                                      </>
                                    ) : (
                                      "Connect Repository"
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">
                          Members ({group.members.length})
                        </div>
                        <div className="flex flex-col gap-2">
                          {group.members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-800">
                                  {member.profile.fullName
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>
                                <span className="text-sm">
                                  {member.profile.fullName}
                                </span>
                              </div>
                              <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full">
                                {member.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex justify-between items-center pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/midterm/groups/${group.id}`)}
                    >
                      View Details
                    </Button>

                    <div className="flex items-center gap-2">
                      {group.repositoryUrl && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() =>
                            router.push(`/midterm/visualization/${group.id}`)
                          }
                        >
                          Visualization
                        </Button>
                      )}

                      <AlertDialog
                        open={groupToLeave === group.id}
                        onOpenChange={(open) => !open && setGroupToLeave(null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setGroupToLeave(group.id)}
                          >
                            <LogOut className="mr-1 h-4 w-4" />
                            Leave
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you sure you want to leave this group?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. You will lose access
                              to the group details and visualization.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => setGroupToLeave(null)}
                            >
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleLeaveGroup}
                              disabled={isLeavingGroup}
                            >
                              {isLeavingGroup ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Leaving...
                                </>
                              ) : (
                                "Leave Group"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Available Groups</h2>

          {groups.filter(
            (group) =>
              !group.members.some((member) => member.userId === user?.id)
          ).length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  No other groups available to join.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups
                .filter(
                  (group) =>
                    !group.members.some((member) => member.userId === user?.id)
                )
                .map((group) => (
                  <Card key={group.id}>
                    <CardHeader>
                      <CardTitle>{group.name}</CardTitle>
                      <CardDescription>
                        {group.description || "No description provided"}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {group.members.length} member
                          {group.members.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Button
                        onClick={() => handleJoinGroup(group.id)}
                        className="w-full"
                        variant="outline"
                      >
                        <GitFork className="mr-2 h-4 w-4" />
                        Join Group
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
