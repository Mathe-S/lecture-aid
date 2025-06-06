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
  Download,
  Edit,
  Trash,
  Lock,
  Github,
  ExternalLink,
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
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { AssignmentGrading } from "@/components/assignment-grading";
import { useUserSubmission } from "@/hooks/useSubmissions";
import { FeedbackDisplay } from "@/components/feedback-display";

export default function AssignmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { role, user } = useAuth();
  const { data: assignment, isLoading } = useAssignment(id);
  const { data: submissions, isLoading: isLoadingSubmissions } =
    useAssignmentSubmissions(id);
  const deleteAssignment = useDeleteAssignment();
  const downloadSubmissions = useDownloadSubmissions();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { data: userSubmission } = useUserSubmission(id, user?.id);

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
            <div className="mt-4 space-x-4 flex">
              <Link href={`/assignments/edit/${id}`}>
                <Button size="sm" className="pl-3">
                  <Edit className="mr-1.5 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button
                size="sm"
                variant="destructive"
                className="pl-3"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">{assignment.title}</CardTitle>
          {assignment.closed && (
            <div className="mt-2 inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
              <Lock className="mr-1 h-3 w-3" />
              Closed
            </div>
          )}
        </CardHeader>
        <CardContent>
          {assignment.description && (
            <p className="mb-4 whitespace-pre-wrap">{assignment.description}</p>
          )}
          <div className="flex flex-col sm:flex-row sm:gap-6 text-sm text-slate-500">
            {assignment.due_date && (
              <div className="flex items-center mb-2 sm:mb-0">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Due: {format(new Date(assignment.due_date), "PPP")}
              </div>
            )}
            <div className="flex items-center mb-2 sm:mb-0">
              <User className="mr-2 h-4 w-4" />
              Created by instructor
            </div>
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
              Points: {assignment.grade}
            </div>
          </div>
        </CardContent>
      </Card>

      {role === "student" ? (
        <div className="max-w-2xl mx-auto">
          {assignment.closed ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-red-500" />
                  Assignment Closed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  This assignment is no longer accepting submissions.
                </p>

                {userSubmission ? (
                  <div className="mt-4 border rounded-md p-4 bg-slate-50">
                    <h3 className="text-md font-medium mb-2">
                      Your Submission
                    </h3>

                    <div className="mb-3">
                      <a
                        href={userSubmission.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-2 text-sm"
                      >
                        <Github className="h-4 w-4" />
                        {userSubmission.repositoryName ||
                          userSubmission.repositoryUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    {userSubmission.grade !== null && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <h4 className="font-medium text-sm mb-1">Grade</h4>
                        <p className="text-2xl font-bold">
                          {userSubmission.grade}{" "}
                          <span className="text-sm font-normal text-slate-500">
                            / {assignment.grade}
                          </span>
                        </p>
                      </div>
                    )}

                    {userSubmission.feedback && (
                      <div className="mt-3">
                        <h4 className="font-medium text-sm mb-1">Feedback</h4>
                        <FeedbackDisplay feedback={userSubmission.feedback} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-red-500">
                      You did not submit this assignment before it closed.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <SubmitAssignment assignmentId={id} />
          )}
        </div>
      ) : isLecturerOrAdmin ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Submissions</h2>

            <div className="flex space-x-4">
              {isAdmin && <AssignmentGrading assignment={assignment} />}

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

      {showDeleteDialog && (
        <DeleteAssignmentDialog
          open={showDeleteDialog}
          onOpenChange={(open) => setShowDeleteDialog(open)}
          onDelete={handleDelete}
          isDeleting={deleteAssignment.isPending}
        />
      )}
    </div>
  );
}

function DeleteAssignmentDialog({
  open,
  onOpenChange,
  onDelete,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this assignment? This action cannot
            be undone. All submissions related to this assignment will also be
            deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="bg-destructive  hover:bg-destructive/90"
          >
            {isDeleting ? (
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
  );
}
