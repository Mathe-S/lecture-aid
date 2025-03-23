"use client";

import { useAuth } from "@/context/AuthContext";
import { useAssignments, useDeleteAssignment } from "@/hooks/useAssignments";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
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
import { useState } from "react";

export default function AssignmentsPage() {
  const { role } = useAuth();
  const { data: assignments, isLoading } = useAssignments();
  const deleteAssignment = useDeleteAssignment();
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(
    null
  );

  const isLecturerOrAdmin = role === "lecturer" || role === "admin";
  const isAdmin = role === "admin";

  const handleDelete = async () => {
    if (!assignmentToDelete) return;

    try {
      await deleteAssignment.mutateAsync(assignmentToDelete);
      toast.success("Assignment deleted successfully");
      setAssignmentToDelete(null);
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to delete assignment");
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Assignments</h1>
        {isLecturerOrAdmin && (
          <Link href="/assignments/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-28" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : assignments?.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-slate-500">No assignments found.</p>
          {isLecturerOrAdmin && (
            <Link href="/assignments/create">
              <Button className="mt-4">Create your first assignment</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {assignments?.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <CardTitle>{assignment.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {assignment.description && (
                  <p className="text-slate-600">{assignment.description}</p>
                )}
                {assignment.due_date && (
                  <div className="flex items-center mt-2 text-sm text-slate-500">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Due: {format(new Date(assignment.due_date), "PPP")}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href={`/assignments/${assignment.id}`}>
                  <Button variant="outline">
                    {role === "student" ? "Submit" : "View Details"}
                  </Button>
                </Link>

                {isAdmin && (
                  <AlertDialog
                    open={assignmentToDelete === assignment.id}
                    onOpenChange={(open) => {
                      if (!open) setAssignmentToDelete(null);
                    }}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setAssignmentToDelete(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this assignment? This
                          action cannot be undone. All submissions related to
                          this assignment will also be deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive  hover:bg-destructive/90"
                        >
                          {deleteAssignment.isPending
                            ? "Deleting..."
                            : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
