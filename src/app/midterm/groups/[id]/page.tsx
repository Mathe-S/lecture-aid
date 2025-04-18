"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useMidtermGroupDetails,
  useConnectRepository,
  useUpdateRepository,
  useLeaveGroup,
  useUploadTodo,
} from "@/hooks/useMidtermGroups";
import { Button } from "@/components/ui/button";
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
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GitHubMetricsCard } from "@/components/github-metrics-card";
import {
  GitBranch,
  GitFork,
  ChevronLeft,
  Loader2,
  Github,
  Users,
  Pencil,
  LogOut,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { MidtermTodoList } from "@/components/midterm/MidtermTodoList";
import { Progress } from "@/components/ui/progress";

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuth();
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: group, isLoading: isLoadingGroup } = useMidtermGroupDetails(id);
  const { mutateAsync: connectRepository, isPending: isConnecting } =
    useConnectRepository();
  const { mutateAsync: updateRepository, isPending: isUpdating } =
    useUpdateRepository();
  const { mutateAsync: leaveGroup, isPending: isLeaving } = useLeaveGroup();
  const { mutateAsync: uploadTodo, isPending: isUploadingTodo } =
    useUploadTodo();

  const handleConnectRepository = async () => {
    if (!repositoryUrl.trim() || !repositoryUrl.includes("github.com")) {
      return;
    }

    try {
      await connectRepository({
        groupId: id,
        repositoryUrl,
      });
      setRepositoryUrl("");
      setShowConnectDialog(false);
    } catch (error) {
      console.error("Failed to connect repository", error);
    }
  };

  const handleUpdateRepository = async () => {
    if (!repositoryUrl.trim() || !repositoryUrl.includes("github.com")) {
      return;
    }

    try {
      await updateRepository({
        groupId: id,
        repositoryUrl,
      });
      setRepositoryUrl("");
      setShowUpdateDialog(false);
    } catch (error) {
      console.error("Failed to update repository", error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!id) return;
    try {
      await leaveGroup(id);
      setShowLeaveDialog(false);
      router.push("/midterm");
    } catch (error) {
      console.error("Failed to leave group", error);
    }
  };

  // Check if the current user is a member of this group
  const isMember = !!group?.members.find(
    (member) => member.userId === user?.id
  );

  // Check if the current user is the owner of this group
  const isOwner = !!group?.members.find(
    (member) => member.userId === user?.id && member.role === "owner"
  );

  // Calculate task progress
  const totalTasks = group?.tasks?.length ?? 0;
  const completedTasks =
    group?.tasks?.filter((task) => task.isChecked).length ?? 0;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Handler for file selection and upload
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !id) {
      return;
    }

    if (file.type !== "text/markdown" && !file.name.endsWith(".md")) {
      toast.error("Invalid file type", {
        description: "Please upload a Markdown file (.md).",
      });
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const markdownContent = e.target?.result as string;
      if (markdownContent) {
        try {
          const result = await uploadTodo({
            groupId: id,
            markdownContent: markdownContent,
          });
          toast.success("TODO list uploaded successfully", {
            description: `Processed ${result.taskCount} tasks.`,
          });
        } catch (error: any) {
          console.error("Failed to upload TODO list", error);
          toast.error("Failed to upload TODO list", {
            description: error.message,
          });
        }
      }
      // Reset file input after processing
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = (e) => {
      console.error("File reading error", e);
      toast.error("Error reading file");
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  if (isLoadingGroup) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 py-20">
          <h1 className="text-2xl font-bold">Group Not Found</h1>
          <p className="text-muted-foreground">
            The group you are looking for does not exist or you don&apos;t have
            access to it.
          </p>
          <Link
            href="/midterm"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Midterm Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto py-10 px-4 md:px-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link
              href="/midterm"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-2"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Midterm Projects
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
            <p className="text-muted-foreground">
              {group.description || "No description provided"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isMember && !group.repositoryUrl && (
              <Dialog
                open={showConnectDialog}
                onOpenChange={setShowConnectDialog}
              >
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    Connect Repository
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Connect GitHub Repository</DialogTitle>
                    <DialogDescription>
                      Connect your GitHub repository to track progress and
                      visualize contributions.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-2 py-4">
                    <Label htmlFor="repo-url">Repository URL</Label>
                    <Input
                      id="repo-url"
                      placeholder="https://github.com/username/repo"
                      value={repositoryUrl}
                      onChange={(e) => setRepositoryUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be a public GitHub repository
                    </p>
                  </div>

                  <DialogFooter>
                    <Button
                      onClick={handleConnectRepository}
                      disabled={
                        isConnecting || !repositoryUrl.includes("github.com")
                      }
                    >
                      {isConnecting ? (
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
            )}

            {group.repositoryUrl && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/midterm/visualization/${id}`}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  <GitBranch className="mr-2 h-4 w-4" />
                  View Visualization
                </Link>

                {isMember && (
                  <Dialog
                    open={showUpdateDialog}
                    onOpenChange={(open) => {
                      if (open && group.repositoryUrl) {
                        setRepositoryUrl(group.repositoryUrl);
                      }
                      setShowUpdateDialog(open);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Update Repository</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update GitHub Repository</DialogTitle>
                        <DialogDescription>
                          Update the connected GitHub repository URL.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-2 py-4">
                        <Label htmlFor="update-repo-url">Repository URL</Label>
                        <Input
                          id="update-repo-url"
                          placeholder="https://github.com/username/repo"
                          value={repositoryUrl}
                          onChange={(e) => setRepositoryUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Must be a public GitHub repository
                        </p>
                      </div>

                      <DialogFooter>
                        <Button
                          onClick={handleUpdateRepository}
                          disabled={
                            isUpdating || !repositoryUrl.includes("github.com")
                          }
                        >
                          {isUpdating ? (
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
                )}

                {isMember && (
                  <AlertDialog
                    open={showLeaveDialog}
                    onOpenChange={setShowLeaveDialog}
                  >
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <LogOut className="mr-1 h-4 w-4" />
                        Leave Group
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you sure you want to leave this group?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. You will lose access to
                          the group details and visualization.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleLeaveGroup}
                          disabled={isLeaving}
                        >
                          {isLeaving ? (
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
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitFork className="h-5 w-5 text-blue-500" />
                  Group Details
                </CardTitle>
                <CardDescription>
                  Created on{" "}
                  {new Date(group.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.repositoryUrl ? (
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-medium text-muted-foreground">
                      Repository
                    </div>
                    <a
                      href={group.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <Github className="h-4 w-4" />
                      {group.repositoryOwner}/{group.repositoryName}
                    </a>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 text-amber-800 rounded-md">
                    <p className="text-sm">
                      No GitHub repository connected. Connect a repository to
                      track progress and visualize contributions.
                    </p>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Project Requirements
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      Browser Extension for creating flashcards from selected
                      text
                    </li>
                    <li>Hand gesture detection for flashcard review</li>
                    <li>Well-tested code with clear specifications</li>
                    <li>
                      Documentation with Abstract Functions and Representation
                      Invariants
                    </li>
                    <li>Clean Git workflow with proper commits and PRs</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* TODO UPLOAD SECTION - OWNER ONLY */}
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>Project TODO List</CardTitle>
                  <CardDescription>
                    Upload your team&apos;s `todo.md` file to track progress.
                    Uploading will replace the existing list.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".md,text/markdown"
                    className="hidden"
                    id="todo-upload-input"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingTodo}
                    variant="outline"
                    className="w-full"
                  >
                    {isUploadingTodo ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {group?.tasks?.length ? "Replace" : "Upload"} todo.md
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* TODO LIST DISPLAY */}
            {group?.tasks && (
              <MidtermTodoList
                tasks={group.tasks}
                groupId={id}
                canEdit={isMember}
              />
            )}

            {group.metrics && (
              <div className="mt-6">
                <GitHubMetricsCard
                  metrics={group.metrics}
                  repoUrl={group.repositoryUrl}
                />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Group Members
                </CardTitle>
                <CardDescription>
                  {group.members.length} member
                  {group.members.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-800">
                          {member.profile.fullName
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {member.profile.fullName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.profile.email}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs px-2 py-0.5 bg-slate-100 rounded-full">
                        {member.role}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {group.contributions && group.contributions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Contributions</CardTitle>
                  <CardDescription>
                    Activity from GitHub repository
                  </CardDescription>
                  {/* Add Progress Bar here if tasks exist */}
                  {totalTasks > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          Task Progress
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                          {completedTasks} / {totalTasks}
                        </span>
                      </div>
                      <Progress value={taskProgress} className="h-2" />
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.contributions.map((contribution) => (
                      <div key={contribution.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-800">
                              {contribution.profile?.fullName
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <span className="text-sm font-medium">
                              {contribution.profile?.fullName}
                            </span>
                          </div>
                          {contribution.githubUsername && (
                            <span className="text-xs text-muted-foreground">
                              @{contribution.githubUsername}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Commits
                            </span>
                            <span className="font-medium">
                              {contribution.commits || 0}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Pull Requests
                            </span>
                            <span className="font-medium">
                              {contribution.pullRequests || 0}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Code Changes
                            </span>
                            <span className="font-medium">
                              +{contribution.additions || 0}/ -
                              {contribution.deletions || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
