"use client";

import { useState } from "react";
import Link from "next/link";
import RoleGuard from "@/components/RoleGuard";
import { useAllGrades } from "@/hooks/useGrades";
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
  BarChart4,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { gradesKeys } from "@/hooks/useGrades";
import { toast } from "sonner";
import { Profile } from "@/db/drizzle/schema";
import { GradeWithProfilesType } from "@/db/drizzle/schema";

export default function AdminGradesPage() {
  const { data: allGrades, isLoading } = useAllGrades() as {
    data: GradeWithProfilesType[] | undefined;
    isLoading: boolean;
  };
  const [selectedStudent, setSelectedStudent] =
    useState<GradeWithProfilesType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [extraPoints, setExtraPoints] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateExtraPoints = async () => {
    if (!selectedStudent) return;

    setIsUpdating(true);
    try {
      const response = await fetch("/api/admin/grades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedStudent.userId,
          action: "updateExtraPoints",
          extraPoints,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update extra points");
      }

      await queryClient.invalidateQueries({ queryKey: gradesKeys.admin() });
      setIsDialogOpen(false);
      toast.success("Extra points updated successfully");
    } catch (error) {
      toast.error("Failed to update extra points");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const recalculateGrades = async (userId: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/admin/grades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          action: "recalculate",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to recalculate grades");
      }

      await queryClient.invalidateQueries({ queryKey: gradesKeys.admin() });
      toast.success("Grades recalculated successfully");
    } catch (error) {
      toast.error("Failed to recalculate grades");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

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
              <BarChart4 className="h-5 w-5 text-slate-400" />
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
                      <TableHead>Student</TableHead>
                      <TableHead className="w-[100px] text-right">
                        Quiz
                      </TableHead>
                      <TableHead className="w-[100px] text-right">
                        Assignment
                      </TableHead>
                      <TableHead className="w-[100px] text-right">
                        Extra
                      </TableHead>
                      <TableHead className="w-[100px] text-right">
                        Total
                      </TableHead>
                      <TableHead className="w-[150px] text-right">
                        Progress
                      </TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allGrades?.map((grade) => {
                      const profile = grade.user?.profiles?.[0] as
                        | Profile
                        | undefined;
                      const totalPercentage =
                        ((grade.totalPoints ?? 0) /
                          (grade.maxPossiblePoints ?? 100)) *
                        100;

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
                            {grade.extraPoints}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {grade.totalPoints}/{grade.maxPossiblePoints}
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
                                onClick={() => recalculateGrades(grade.userId)}
                                disabled={isUpdating}
                              >
                                <RefreshCw
                                  className={`h-4 w-4 ${
                                    isUpdating ? "animate-spin" : ""
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
                      {selectedStudent.maxPossiblePoints || 100}
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
              <Button onClick={updateExtraPoints} disabled={isUpdating}>
                {isUpdating ? (
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
