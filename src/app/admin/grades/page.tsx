"use client";

import { useState } from "react";
import Link from "next/link";
import RoleGuard from "@/components/RoleGuard";
import {
  useAllGrades,
  useUpdateExtraPoints,
  useRecalculateGrade,
  useRecalculateAllGrades,
} from "@/hooks/useGrades";
import { useQuery } from "@tanstack/react-query";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  ChevronLeft,
  User,
  Edit,
  RefreshCw,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Profile, GradeWithProfilesType } from "@/db/drizzle/schema";

// Define sort fields
type SortField =
  | "name"
  | "quizPoints"
  | "assignmentPoints"
  | "midtermPoints"
  | "finalPoints"
  | "extraPoints"
  | "totalPoints"
  | "progress";
type SortDirection = "asc" | "desc";

// Interface for final task scores
interface StudentFinalScore {
  userId: string;
  totalPointsEarned: number;
  totalTasksGraded: number;
  totalTasks: number;
}

export default function AdminGradesPage() {
  const { data: allGrades, isLoading } = useAllGrades() as {
    data: GradeWithProfilesType[] | undefined;
    isLoading: boolean;
  };

  // Fetch all students' final task scores
  const { data: finalScores, isLoading: isLoadingFinalScores } = useQuery({
    queryKey: ["admin", "final-scores"],
    queryFn: async (): Promise<StudentFinalScore[]> => {
      const response = await fetch("/api/admin/final/all-scores");
      if (!response.ok) throw new Error("Failed to fetch final scores");
      return response.json();
    },
  });
  const [selectedStudent, setSelectedStudent] =
    useState<GradeWithProfilesType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [extraPoints, setExtraPoints] = useState<number>(0);
  const [sortField, setSortField] = useState<SortField>("totalPoints");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Use the mutation hooks
  const updateExtraPointsMutation = useUpdateExtraPoints();
  const recalculateGradeMutation = useRecalculateGrade();
  const recalculateAllGradesMutation = useRecalculateAllGrades();

  const handleUpdateExtraPoints = async () => {
    if (!selectedStudent) return;

    updateExtraPointsMutation.mutate(
      {
        userId: selectedStudent.userId,
        extraPoints,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
        },
      }
    );
  };

  const handleRecalculateGrade = async (userId: string) => {
    recalculateGradeMutation.mutate(userId);
  };

  const handleRecalculateAllGrades = async () => {
    recalculateAllGradesMutation.mutate();
  };

  // Handle sort click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Sort the grades
  const sortedGrades = allGrades
    ? [...allGrades].sort((a, b) => {
        let comparison = 0;

        // Helper function to get name
        const getFullName = (grade: GradeWithProfilesType) =>
          grade.user?.profiles?.[0]?.fullName || "Unknown";

        // Helper function for percentage calculation
        const getProgress = (grade: GradeWithProfilesType) =>
          ((grade.totalPoints ?? 0) / (grade.maxPossiblePoints || 1000)) * 100;

        // Helper function to get final points
        const getFinalPoints = (grade: GradeWithProfilesType) => {
          const finalScore = finalScores?.find(
            (fs) => fs.userId === grade.userId
          );
          return finalScore?.totalPointsEarned ?? 0;
        };

        switch (sortField) {
          case "name":
            comparison = getFullName(a).localeCompare(getFullName(b));
            break;
          case "quizPoints":
            comparison = (a.quizPoints ?? 0) - (b.quizPoints ?? 0);
            break;
          case "assignmentPoints":
            comparison = (a.assignmentPoints ?? 0) - (b.assignmentPoints ?? 0);
            break;
          case "midtermPoints":
            comparison = (a.midtermPoints ?? 0) - (b.midtermPoints ?? 0);
            break;
          case "finalPoints":
            comparison = getFinalPoints(a) - getFinalPoints(b);
            break;
          case "extraPoints":
            comparison = (a.extraPoints ?? 0) - (b.extraPoints ?? 0);
            break;
          case "totalPoints":
            comparison = (a.totalPoints ?? 0) - (b.totalPoints ?? 0);
            break;
          case "progress":
            comparison = getProgress(a) - getProgress(b);
            break;
        }

        // Reverse for descending order
        return sortDirection === "asc" ? comparison : -comparison;
      })
    : [];

  // Helper component for sortable header
  const SortableHeader = ({
    field,
    children,
    className = "",
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead
      className={`${className} cursor-pointer hover:bg-slate-50`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center justify-end gap-1">
        {children}
        {sortField === field &&
          (sortDirection === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          ))}
      </div>
    </TableHead>
  );

  return (
    <RoleGuard
      allowedRoles={["admin"]}
      fallback={<div>You do not have permission to view this page.</div>}
    >
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-8">
          <Link href="/admin" className="mr-4">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Student Grades</h1>
            <p className="text-slate-500">View and manage student grades</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Grades Overview</CardTitle>
                <CardDescription>
                  View all students&apos; grades and manage extra points
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculateAllGrades}
                disabled={recalculateAllGradesMutation.isPending || isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    recalculateAllGradesMutation.isPending ? "animate-spin" : ""
                  }`}
                />
                {recalculateAllGradesMutation.isPending
                  ? "Recalculating..."
                  : "Recalculate All"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !allGrades || allGrades.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No student grades found
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader field="name" className="text-left">
                        Student
                      </SortableHeader>
                      <SortableHeader
                        field="quizPoints"
                        className="w-[100px] text-right"
                      >
                        Quiz
                      </SortableHeader>
                      <SortableHeader
                        field="assignmentPoints"
                        className="w-[100px] text-right"
                      >
                        Assignment
                      </SortableHeader>
                      <SortableHeader
                        field="midtermPoints"
                        className="w-[100px] text-right"
                      >
                        Midterm
                      </SortableHeader>
                      <SortableHeader
                        field="finalPoints"
                        className="w-[100px] text-right"
                      >
                        Final
                      </SortableHeader>
                      <SortableHeader
                        field="extraPoints"
                        className="w-[100px] text-right"
                      >
                        Extra
                      </SortableHeader>
                      <SortableHeader
                        field="totalPoints"
                        className="w-[100px] text-right"
                      >
                        Total
                      </SortableHeader>
                      <SortableHeader
                        field="progress"
                        className="w-[150px] text-right"
                      >
                        Progress
                      </SortableHeader>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedGrades?.map((grade) => {
                      const profile = grade.user?.profiles?.[0] as
                        | Profile
                        | undefined;
                      const totalPercentage =
                        ((grade.totalPoints ?? 0) /
                          (grade.maxPossiblePoints ?? 1000)) *
                        100;

                      // Get final score for this student
                      const finalScore = finalScores?.find(
                        (fs) => fs.userId === grade.userId
                      );

                      return (
                        <TableRow key={grade.userId}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={profile?.avatarUrl || ""}
                                  alt={profile?.fullName || "Student"}
                                />
                                <AvatarFallback>
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {profile?.fullName || "Unknown Student"}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {profile?.email || "No email"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {grade.quizPoints}/{grade.maxQuizPoints || 0}
                          </TableCell>
                          <TableCell className="text-right">
                            {grade.assignmentPoints}/
                            {grade.maxAssignmentPoints || 0}
                          </TableCell>
                          <TableCell className="text-right">
                            {grade.midtermPoints ?? 0}/250
                          </TableCell>
                          <TableCell className="text-right">
                            {isLoadingFinalScores ? (
                              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className="font-medium">
                                  {finalScore?.totalPointsEarned ?? 0}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {finalScore?.totalTasksGraded ?? 0}/
                                  {finalScore?.totalTasks ?? 0} tasks
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {grade.extraPoints}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {grade.totalPoints}/
                            {grade.maxPossiblePoints || 1000}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={totalPercentage}
                                className="h-2"
                              />
                              <span className="text-sm w-9 text-right">
                                {Math.round(totalPercentage)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedStudent(grade);
                                  setExtraPoints(grade.extraPoints ?? 0);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleRecalculateGrade(grade.userId)
                                }
                                disabled={recalculateGradeMutation.isPending}
                              >
                                <RefreshCw
                                  className={`h-4 w-4 ${
                                    recalculateGradeMutation.isPending
                                      ? "animate-spin"
                                      : ""
                                  }`}
                                />
                                <span className="sr-only">Recalculate</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Extra Points</DialogTitle>
              <DialogDescription>
                Award extra points to this student for participation, effort, or
                other contributions.
              </DialogDescription>
            </DialogHeader>

            {selectedStudent && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={selectedStudent.profile?.avatarUrl || ""}
                      alt={selectedStudent.profile?.fullName || "Student"}
                    />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {selectedStudent.profile?.fullName || "Unknown Student"}
                    </div>
                    <div className="text-sm text-slate-500">
                      Current total: {selectedStudent.totalPoints || 0}/
                      {selectedStudent.maxPossiblePoints || 1000}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div className="col-span-2">
                      <label
                        htmlFor="extraPoints"
                        className="text-sm font-medium"
                      >
                        Extra Points
                      </label>
                      <Input
                        id="extraPoints"
                        type="number"
                        value={extraPoints}
                        onChange={(e) =>
                          setExtraPoints(parseInt(e.target.value) || 0)
                        }
                        min="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium">New Total</div>
                      <div className="mt-2 text-xl font-semibold">
                        {(selectedStudent.quizPoints ?? 0) +
                          (selectedStudent.assignmentPoints ?? 0) +
                          extraPoints}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateExtraPoints}
                disabled={updateExtraPointsMutation.isPending}
              >
                {updateExtraPointsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
