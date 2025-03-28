"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  useAssignment,
  useAssignmentSubmissions,
  useDeleteAssignment,
  useDownloadSubmissions,
} from "@/hooks/useAssignments";
import { SubmitAssignment } from "@/components/submit-assignment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  CalendarIcon,
  User,
  Loader2,
  PenSquare,
  Trash2,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { SubmissionsColumns } from "./columns";
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

export default function AssignmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { role } = useAuth();
  const { data: assignment, isLoading } = useAssignment(id);
  const { data: submissions, isLoading: isLoadingSubmissions } =
    useAssignmentSubmissions(id);
  const deleteAssignment = useDeleteAssignment();
  const downloadSubmissions = useDownloadSubmissions();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isAdmin = role === "admin";
  const isLecturerOrAdmin = role === "lecturer" || role === "admin";

  const handleDelete = async () => {
    try {
      await deleteAssignment.mutateAsync(id);
      toast.success("Assignment deleted successfully");
      router.push("/assignments");
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to delete assignment");
    }
  };

  async function handleDownloadSubmissions() {
    try {
      const blob = await downloadSubmissions.mutateAsync(id);
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      // Create a temporary anchor element
      const a = document.createElement("a");
      a.href = url;
      a.download = `assignment_submissions_${id}.csv`;
      // Append to the document
      document.body.appendChild(a);
      // Trigger a click on the element
      a.click();
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Submissions downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download submissions");
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="mb-6">
          <Link href="/assignments">
            <Button variant="ghost" className="pl-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assignments
            </Button>
          </Link>
        </div>
        <Skeleton className="h-10 w-1/2 mb-4" />
        <Skeleton className="h-6 w-1/3 mb-2" />
        <Skeleton className="h-6 w-1/4 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container mx-auto py-10">
        <div className="mb-6">
          <Link href="/assignments">
            <Button variant="ghost" className="pl-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assignments
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Assignment not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <Link href="/assignments">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assignments
          </Button>
        </Link>

        {isAdmin && (
          <div className="flex gap-2">
            <Link href={`/assignments/edit/${id}`}>
              <Button variant="outline">
                <PenSquare className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>

            <AlertDialog
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this assignment? This action
                    cannot be undone. All submissions related to this assignment
                    will also be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteAssignment.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">{assignment.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {assignment.description && (
            <p className="mb-4">{assignment.description}</p>
          )}
          <div className="flex flex-col sm:flex-row sm:gap-6 text-sm text-slate-500">
            {assignment.due_date && (
              <div className="flex items-center mb-2 sm:mb-0">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Due: {format(new Date(assignment.due_date), "PPP")}
              </div>
            )}
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              Created by instructor
            </div>
          </div>
        </CardContent>
      </Card>

      {role === "student" ? (
        <div className="max-w-2xl mx-auto">
          <SubmitAssignment
            assignmentId={id}
            assignmentTitle={assignment.title}
          />
        </div>
      ) : isLecturerOrAdmin ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Submissions</h2>

            <Button
              variant="outline"
              onClick={handleDownloadSubmissions}
              disabled={downloadSubmissions.isPending || !submissions?.length}
            >
              {downloadSubmissions.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </>
              )}
            </Button>
          </div>

          {isLoadingSubmissions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
              <span>Loading submissions...</span>
            </div>
          ) : submissions?.length ? (
            <DataTable columns={SubmissionsColumns} data={submissions} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center">No submissions yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
