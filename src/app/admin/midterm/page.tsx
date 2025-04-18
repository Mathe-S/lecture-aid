"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  Star,
  ExternalLink,
  RefreshCw,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { MidtermGroupWithMembers } from "@/db/drizzle/midterm-schema";
import {
  useMidtermGroups,
  useSaveEvaluation,
  useEvaluation,
  useSyncRepository,
} from "@/hooks/useMidtermGroups";

// Default evaluation state
const defaultEvaluationState = {
  specScore: 0,
  testScore: 0,
  implementationScore: 0,
  documentationScore: 0,
  gitWorkflowScore: 0,
  feedback: "",
};

export default function MidtermAdminPage() {
  const { role } = useAuth();
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] =
    useState<MidtermGroupWithMembers | null>(null);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [evaluation, setEvaluation] = useState(defaultEvaluationState);
  const [dialogOpen, setDialogOpen] = useState(false);

  // --- Fetching Data ---
  const { data: groups = [], isLoading: isLoadingGroups } = useMidtermGroups();
  const { mutate: saveEvaluation, isPending: isSubmitting } =
    useSaveEvaluation();
  const { mutate: syncRepository, isPending: isSyncingRepo } =
    useSyncRepository();

  // Fetch specific evaluation when dialog opens and selection is made
  const { data: existingEvaluation, isLoading: isLoadingEvaluation } =
    useEvaluation(selectedGroup?.id, selectedUser?.id);

  // Effect to redirect non-admins
  useEffect(() => {
    if (role && role !== "admin") {
      toast.error("Access Denied", {
        description: "You must be an admin to view this page.",
      });
      router.push("/dashboard");
    }
  }, [role, router]);

  // Effect to populate form when existing evaluation loads
  useEffect(() => {
    if (existingEvaluation) {
      setEvaluation({
        specScore: existingEvaluation.specScore ?? 0,
        testScore: existingEvaluation.testScore ?? 0,
        implementationScore: existingEvaluation.implementationScore ?? 0,
        documentationScore: existingEvaluation.documentationScore ?? 0,
        gitWorkflowScore: existingEvaluation.gitWorkflowScore ?? 0,
        feedback: existingEvaluation.feedback ?? "",
      });
    } else if (!isLoadingEvaluation && selectedUser && selectedGroup) {
      // Reset form if evaluation not found after attempting fetch (and user/group selected)
      setEvaluation(defaultEvaluationState);
    }
  }, [existingEvaluation, isLoadingEvaluation, selectedUser, selectedGroup]);

  // --- Handlers ---
  const handleSyncRepository = (groupId: string) => {
    syncRepository(groupId);
  };

  const openEvaluationDialog = useCallback(
    (
      group: MidtermGroupWithMembers,
      member: { userId: string; profile: { fullName: string | null } }
    ) => {
      setSelectedGroup(group);
      setSelectedUser({
        id: member.userId,
        name: member.profile.fullName ?? "Unknown User",
      });
      setEvaluation(defaultEvaluationState); // Reset form immediately
      setDialogOpen(true);
    },
    []
  );

  const handleSubmitEvaluation = async () => {
    if (!selectedGroup || !selectedUser) return;

    try {
      await saveEvaluation({
        groupId: selectedGroup.id,
        userId: selectedUser.id,
        scores: {
          specScore: evaluation.specScore,
          testScore: evaluation.testScore,
          implementationScore: evaluation.implementationScore,
          documentationScore: evaluation.documentationScore,
          gitWorkflowScore: evaluation.gitWorkflowScore,
        },
        feedback: evaluation.feedback,
      });
      setDialogOpen(false);
    } catch (error) {
      // Error toast is handled by the hook
      console.error("Failed to save evaluation from component:", error);
    }
  };

  // Loading state combines initial role check and group fetching
  const isLoading = !role || isLoadingGroups;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Ensure admin role after loading
  if (role !== "admin") {
    // This should ideally not be reached due to the redirect effect,
    // but serves as a fallback render.
    return (
      <div className="container mx-auto py-10 px-4 md:px-6">
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto py-10 px-4 md:px-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Midterm Project Administration
            </h1>
            <p className="text-muted-foreground mt-1">
              Evaluate and manage student midterm projects
            </p>
          </div>
          <Link href="/midterm">
            <Button variant="outline">View Student Area</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Groups</CardTitle>
            <CardDescription>
              All groups working on midterm projects ({groups.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groups.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">
                    No project groups found.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Repository</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{group.name}</span>
                            <span
                              className="text-xs text-muted-foreground truncate w-48"
                              title={group.description ?? ""}
                            >
                              {group.description || "No description"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            {group.members.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center justify-between"
                              >
                                <span
                                  className="text-sm truncate"
                                  title={member.profile.fullName ?? ""}
                                >
                                  {member.profile.fullName ?? "Unknown User"}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 ml-2 flex-shrink-0"
                                  onClick={() =>
                                    openEvaluationDialog(group, member)
                                  }
                                >
                                  <Star className="h-4 w-4" />
                                  <span className="sr-only">Grade</span>
                                </Button>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {group.repositoryUrl ? (
                            <a
                              href={group.repositoryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-600 hover:underline truncate"
                              title={group.repositoryUrl}
                            >
                              <GitBranch className="h-4 w-4 mr-1 flex-shrink-0" />
                              <span className="truncate">
                                {group.repositoryOwner}/{group.repositoryName}
                              </span>
                              <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              N/A
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {group.lastSync ? (
                            <span className="text-sm whitespace-nowrap">
                              {new Date(group.lastSync).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Never
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSyncRepository(group.id)}
                            disabled={!group.repositoryUrl || isSyncingRepo}
                            title={
                              !group.repositoryUrl
                                ? "Connect repository first"
                                : "Sync repository data"
                            }
                          >
                            {isSyncingRepo ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-1" />
                            )}
                            Sync
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Evaluate Student</DialogTitle>
            <DialogDescription>
              {selectedUser && selectedGroup && (
                <>
                  Evaluating <strong>{selectedUser.name}</strong> from group{" "}
                  <strong>{selectedGroup.name}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {isLoadingEvaluation ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="spec-score">Specification (0-50)</Label>
                <Input
                  id="spec-score"
                  type="number"
                  min="0"
                  max="50"
                  value={evaluation.specScore}
                  onChange={(e) =>
                    setEvaluation({
                      ...evaluation,
                      specScore: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-score">Testing (0-50)</Label>
                <Input
                  id="test-score"
                  type="number"
                  min="0"
                  max="50"
                  value={evaluation.testScore}
                  onChange={(e) =>
                    setEvaluation({
                      ...evaluation,
                      testScore: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="implementation-score">
                  Implementation (0-100)
                </Label>
                <Input
                  id="implementation-score"
                  type="number"
                  min="0"
                  max="100"
                  value={evaluation.implementationScore}
                  onChange={(e) =>
                    setEvaluation({
                      ...evaluation,
                      implementationScore: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentation-score">
                  Documentation (0-25)
                </Label>
                <Input
                  id="documentation-score"
                  type="number"
                  min="0"
                  max="25"
                  value={evaluation.documentationScore}
                  onChange={(e) =>
                    setEvaluation({
                      ...evaluation,
                      documentationScore: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="git-workflow-score">Git Workflow (0-25)</Label>
                <Input
                  id="git-workflow-score"
                  type="number"
                  min="0"
                  max="25"
                  value={evaluation.gitWorkflowScore}
                  onChange={(e) =>
                    setEvaluation({
                      ...evaluation,
                      gitWorkflowScore: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  rows={4}
                  placeholder="Provide feedback on the student's work"
                  value={evaluation.feedback}
                  onChange={(e) =>
                    setEvaluation({ ...evaluation, feedback: e.target.value })
                  }
                />
              </div>

              <div className="rounded-md bg-slate-50 p-3 mt-4">
                <p className="text-sm font-medium">
                  Total Score:{" "}
                  {(evaluation.specScore || 0) +
                    (evaluation.testScore || 0) +
                    (evaluation.implementationScore || 0) +
                    (evaluation.documentationScore || 0) +
                    (evaluation.gitWorkflowScore || 0)}{" "}
                  / 250
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEvaluation}
              disabled={isSubmitting || isLoadingEvaluation}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Evaluation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
