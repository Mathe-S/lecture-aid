"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAssignment } from "@/hooks/useAssignments";
import { useAssignmentSubmissions } from "@/hooks/useSubmissions";
import { SubmitAssignment } from "@/components/submit-assignment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CalendarIcon, User, Loader2 } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { SubmissionsColumns } from "./columns";

export default function AssignmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { role } = useAuth();
  const { data: assignment, isLoading } = useAssignment(id);
  const { data: submissions, isLoading: isLoadingSubmissions } =
    useAssignmentSubmissions(id);

  const isLecturerOrAdmin = role === "lecturer" || role === "admin";

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
      <div className="mb-6">
        <Link href="/assignments">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assignments
          </Button>
        </Link>
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
            {assignment.dueDate && (
              <div className="flex items-center mb-2 sm:mb-0">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Due: {format(new Date(assignment.dueDate), "PPP")}
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
          <h2 className="text-xl font-semibold mb-4">Submissions</h2>
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
