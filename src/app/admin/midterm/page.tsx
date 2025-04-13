"use client";

import { useState, useEffect } from "react";
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
import { MidtermGroupWithMembers } from "@/db/drizzle/schema";

// This would come from your API
const mockGroups: MidtermGroupWithMembers[] = [
  {
    id: "1",
    name: "Team Alpha",
    description:
      "Building a flashcard extension with ML-powered gesture recognition",
    repositoryUrl: "https://github.com/team-alpha/flashcards-extension",
    repositoryOwner: "team-alpha",
    repositoryName: "flashcards-extension",
    createdAt: "2023-04-10T12:00:00Z",
    updatedAt: "2023-04-10T12:00:00Z",
    lastSync: null,
    members: [
      {
        id: "m1",
        groupId: "1",
        userId: "u1",
        role: "owner",
        joinedAt: "2023-04-10T12:00:00Z",
        profile: {
          id: "u1",
          fullName: "Jane Doe",
          email: "jane@example.com",
          avatarUrl: null,
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
        },
      },
      {
        id: "m2",
        groupId: "1",
        userId: "u2",
        role: "member",
        joinedAt: "2023-04-10T12:05:00Z",
        profile: {
          id: "u2",
          fullName: "John Smith",
          email: "john@example.com",
          avatarUrl: null,
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
        },
      },
    ],
  },
  {
    id: "2",
    name: "Team Beta",
    description:
      "Creating an innovative browser extension for flashcards with gesture controls",
    repositoryUrl: null,
    repositoryOwner: null,
    repositoryName: null,
    createdAt: "2023-04-11T09:30:00Z",
    updatedAt: "2023-04-11T09:30:00Z",
    lastSync: null,
    members: [
      {
        id: "m3",
        groupId: "2",
        userId: "u3",
        role: "owner",
        joinedAt: "2023-04-11T09:30:00Z",
        profile: {
          id: "u3",
          fullName: "Alex Johnson",
          email: "alex@example.com",
          avatarUrl: null,
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
        },
      },
    ],
  },
];

// Mock evaluations
const mockEvaluations = {
  u1: {
    userId: "u1",
    specScore: 40,
    testScore: 45,
    implementationScore: 90,
    documentationScore: 20,
    gitWorkflowScore: 23,
    totalScore: 218,
    feedback:
      "Good work on implementation, but documentation needs improvement",
  },
  u2: {
    userId: "u2",
    specScore: 35,
    testScore: 40,
    implementationScore: 85,
    documentationScore: 15,
    gitWorkflowScore: 20,
    totalScore: 195,
    feedback: "Good implementation, low documentation scores",
  },
};

export default function MidtermAdminPage() {
  const { role } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<MidtermGroupWithMembers[]>([]);
  const [selectedGroup, setSelectedGroup] =
    useState<MidtermGroupWithMembers | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState({
    specScore: 0,
    testScore: 0,
    implementationScore: 0,
    documentationScore: 0,
    gitWorkflowScore: 0,
    feedback: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncingRepo, setIsSyncingRepo] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // Replace with actual API call
    if (role === "admin") {
      setGroups(mockGroups);
      setLoading(false);
    } else {
      // Redirect non-admins
      router.push("/dashboard");
    }
  }, [role, router]);

  const handleSyncRepository = async (groupId: string) => {
    setIsSyncingRepo(true);

    try {
      console.log(
        "Syncing repository for group:",
        groupId,
        "now it simulates the API call"
      );
      // This would be an actual API call
      // await syncRepositoryData(groupId, user);

      // Simulate API response
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Repository data synced successfully");
    } catch (error) {
      console.error("Failed to sync repository:", error);
      toast.error("Failed to sync repository data");
    } finally {
      setIsSyncingRepo(false);
    }
  };

  const openEvaluationDialog = (
    group: MidtermGroupWithMembers,
    userId: string
  ) => {
    setSelectedGroup(group);
    setSelectedUser(userId);

    // Check if evaluation exists already
    const existingEval = (mockEvaluations as any)[userId];
    if (existingEval) {
      setEvaluation({
        specScore: existingEval.specScore,
        testScore: existingEval.testScore,
        implementationScore: existingEval.implementationScore,
        documentationScore: existingEval.documentationScore,
        gitWorkflowScore: existingEval.gitWorkflowScore,
        feedback: existingEval.feedback,
      });
    } else {
      // Reset form for new evaluation
      setEvaluation({
        specScore: 0,
        testScore: 0,
        implementationScore: 0,
        documentationScore: 0,
        gitWorkflowScore: 0,
        feedback: "",
      });
    }

    setDialogOpen(true);
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedGroup || !selectedUser) return;

    setIsSubmitting(true);

    try {
      // Calculate total score
      const totalScore =
        evaluation.specScore +
        evaluation.testScore +
        evaluation.implementationScore +
        evaluation.documentationScore +
        evaluation.gitWorkflowScore;

      console.log("Total score:", totalScore);

      // This would be an actual API call
      // await saveEvaluation(
      //   selectedGroup.id,
      //   selectedUser,
      //   user.id,
      //   { ...evaluation },
      //   evaluation.feedback
      // );

      // Simulate API response
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Evaluation saved successfully");
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save evaluation:", error);
      toast.error("Failed to save evaluation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
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
              All groups working on midterm projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groups.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">
                    No project groups found
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
                            <span className="text-xs text-muted-foreground">
                              {group.description?.substring(0, 60)}
                              {group.description &&
                              group.description.length > 60
                                ? "..."
                                : ""}
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
                                <span className="text-sm">
                                  {member.profile.fullName}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() =>
                                    openEvaluationDialog(group, member.userId)
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
                              className="flex items-center text-blue-600 hover:underline"
                            >
                              <GitBranch className="h-4 w-4 mr-1" />
                              {group.repositoryName}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No repository
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {group.lastSync ? (
                            <span className="text-sm">
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
                          >
                            {isSyncingRepo ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-1" />
                            )}
                            Sync Data
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
              {selectedGroup && selectedUser && (
                <>
                  Evaluating{" "}
                  {
                    selectedGroup.members.find((m) => m.userId === selectedUser)
                      ?.profile.fullName
                  }{" "}
                  from {selectedGroup.name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="spec-score">Specification (out of 50)</Label>
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
              <Label htmlFor="test-score">Testing (out of 50)</Label>
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
                Implementation (out of 100)
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
                Documentation (out of 25)
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
              <Label htmlFor="git-workflow-score">
                Git Workflow (out of 25)
              </Label>
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
                  setEvaluation({
                    ...evaluation,
                    feedback: e.target.value,
                  })
                }
              />
            </div>

            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-sm font-medium">
                Total Score:{" "}
                {evaluation.specScore +
                  evaluation.testScore +
                  evaluation.implementationScore +
                  evaluation.documentationScore +
                  evaluation.gitWorkflowScore}{" "}
                / 250
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitEvaluation} disabled={isSubmitting}>
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
