"use client";

import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  GitBranch,
  Github,
  ExternalLink,
  Pencil,
  LogOut,
  Trash2,
  ListChecks,
  Loader2,
  GitFork,
} from "lucide-react";
import { MidtermGroupWithMembers } from "@/db/drizzle/midterm-schema";
import type { User } from "@supabase/supabase-js";
import { UserRole } from "@/types/general";

interface GroupCardProps {
  group: MidtermGroupWithMembers & {
    taskProgress?: { total?: number; checked?: number };
  };
  user: User | null; // Keep user object
  role: UserRole; // Keep role
  type: "user" | "available";

  // Callbacks for actions
  onEditClick: (group: MidtermGroupWithMembers) => void;
  onUpdateGroup: (
    groupId: string,
    name: string,
    description: string,
    repositoryUrl?: string
  ) => Promise<void>;
  isUpdatingGroup: boolean;

  onLeaveGroup: (groupId: string) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
  onJoinGroup: (groupId: string) => Promise<void>;

  // Loading states
  isLeavingGroup: boolean;
  isDeletingGroup: boolean;
  isJoiningGroup: boolean;
}

export function GroupCard({
  group,
  user,
  role,
  type,
  onEditClick,
  onUpdateGroup,
  isUpdatingGroup,
  onLeaveGroup,
  onDeleteGroup,
  onJoinGroup,
  isLeavingGroup,
  isDeletingGroup,
  isJoiningGroup,
}: GroupCardProps) {
  const router = useRouter();

  // Local state for dialogs/alerts
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showLeaveAlert, setShowLeaveAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [repositoryUrl, setRepositoryUrl] = useState(group.repositoryUrl || "");

  const isOwner = group.members.some(
    (member) => member.userId === user?.id && member.role === "owner"
  );
  const canModify = role === "admin" || isOwner;

  // Calculate progress safely using optional chaining
  const totalTasks = group.taskProgress?.total ?? 0;
  const completedTasks = group.taskProgress?.checked ?? 0;
  const progressPercent =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Action handlers
  const handleConnectSubmit = () => {
    onUpdateGroup(
      group.id,
      group.name,
      group.description || "",
      repositoryUrl
    ).then(() => setShowConnectDialog(false));
  };
  const handleUpdateSubmit = () => {
    onUpdateGroup(
      group.id,
      group.name,
      group.description || "",
      repositoryUrl
    ).then(() => setShowUpdateDialog(false));
  };
  const handleLeaveSubmit = () => {
    onLeaveGroup(group.id).then(() => setShowLeaveAlert(false));
  };
  const handleDeleteSubmit = () => {
    onDeleteGroup(group.id).then(() => setShowDeleteAlert(false));
  };
  const handleJoinSubmit = () => {
    onJoinGroup(group.id);
  };

  return (
    <Card className="flex flex-col h-full">
      {" "}
      {/* Ensure card takes full height for grid alignment */}
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-grow pr-2">
            {" "}
            {/* Added padding right */}
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-blue-500" /> {group.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {group.description || "No description provided"}
            </CardDescription>
          </div>
          {/* Edit button triggers parent state change */}
          {type === "user" && canModify && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => onEditClick(group)}
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Edit Group</span>
            </Button>
          )}
        </div>
        {totalTasks > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="flex items-center gap-1.5">
                <ListChecks className="h-3 w-3" /> Task Progress
              </span>
              <span>
                {completedTasks} / {totalTasks} ({progressPercent.toFixed(0)}%)
              </span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        {" "}
        {/* Allow content to grow */}
        <div className="space-y-4">
          {/* Repository Section */}
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
                  className="flex items-center gap-1 text-blue-600 hover:underline text-sm mr-1"
                >
                  <Github className="h-4 w-4" /> {group.repositoryOwner}/
                  {group.repositoryName}
                  <ExternalLink className="h-3 w-3 ml-0.5" />
                </a>
                {/* Conditionally render Update Repo Dialog Trigger for 'user' type */}
                {type === "user" && (
                  <Dialog
                    open={showUpdateDialog}
                    onOpenChange={setShowUpdateDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          setRepositoryUrl(group.repositoryUrl || "")
                        }
                      >
                        {" "}
                        <Pencil className="h-3 w-3 text-muted-foreground" />{" "}
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
                        <Label htmlFor={`update-repo-url-${group.id}`}>
                          Repository URL
                        </Label>
                        <Input
                          id={`update-repo-url-${group.id}`}
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
                          variant="outline"
                          onClick={() => setShowUpdateDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpdateSubmit}
                          disabled={
                            isUpdatingGroup ||
                            !repositoryUrl ||
                            !repositoryUrl.includes("github.com")
                          }
                        >
                          {isUpdatingGroup ? (
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
              </div>
            ) : (
              <div className="flex justify-between items-center p-3 bg-amber-50 text-amber-800 rounded-md">
                <p className="text-sm">No GitHub repository connected.</p>
                {/* Conditionally render Connect Repo Dialog Trigger for 'user' type */}
                {type === "user" && (
                  <Dialog
                    open={showConnectDialog}
                    onOpenChange={setShowConnectDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="text-amber-800 hover:text-amber-900 h-auto p-0 text-sm"
                      >
                        Connect Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Connect GitHub Repository</DialogTitle>
                        <DialogDescription>
                          Connect your GitHub repository to track progress.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2 py-4">
                        <Label htmlFor={`connect-repo-url-${group.id}`}>
                          Repository URL
                        </Label>
                        <Input
                          id={`connect-repo-url-${group.id}`}
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
                          variant="outline"
                          onClick={() => setShowConnectDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleConnectSubmit}
                          disabled={
                            isUpdatingGroup ||
                            !repositoryUrl ||
                            !repositoryUrl.includes("github.com")
                          }
                        >
                          {isUpdatingGroup ? (
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
              </div>
            )}
          </div>

          {/* Member List */}
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
                        .join("") ?? "U"}
                    </div>
                    <span
                      className="text-sm truncate"
                      title={member.profile.fullName ?? "Unknown User"}
                    >
                      {member.profile.fullName ?? "Unknown User"}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full flex-shrink-0">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t flex flex-wrap gap-2 justify-between items-center">
        {" "}
        {/* flex-wrap added */}
        {type === "user" ? (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              {" "}
              {/* flex-wrap added */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/midterm/groups/${group.id}`)}
              >
                View Details
              </Button>
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
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {" "}
              {/* flex-wrap added */}
              {/* Leave Group Alert */}
              <AlertDialog
                open={showLeaveAlert}
                onOpenChange={setShowLeaveAlert}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                  >
                    <LogOut className="mr-1 h-4 w-4" /> Leave
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave Group?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure? You will lose access.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLeaveSubmit}
                      disabled={isLeavingGroup}
                    >
                      {isLeavingGroup ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Leaving...
                        </>
                      ) : (
                        "Leave"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {/* Delete Group Alert */}
              {canModify && (
                <AlertDialog
                  open={showDeleteAlert}
                  onOpenChange={setShowDeleteAlert}
                >
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Group?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently deletes the group and all data. Cannot
                        be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteSubmit}
                        disabled={isDeletingGroup}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {isDeletingGroup ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </>
        ) : (
          /* type === 'available' */
          <Button
            onClick={handleJoinSubmit}
            className="w-full"
            variant="outline"
            disabled={isJoiningGroup}
          >
            <GitFork className="mr-2 h-4 w-4" /> Join Group
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
