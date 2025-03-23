"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGradeSubmission, useSubmission } from "@/hooks/useSubmissions";
import RoleGuard from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Save, Github, ExternalLink } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

export default function GradeSubmissionPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [grade, setGrade] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");

  // Fetch submission details
  const { data: submission, isLoading } = useSubmission(id);

  useEffect(() => {
    if (submission) {
      if (submission.grade !== null) {
        setGrade(submission.grade.toString());
      }
      if (submission.feedback) {
        setFeedback(submission.feedback);
      }
    }
  }, [submission]);

  // Save grade mutation
  const gradeMutation = useGradeSubmission();

  const handleSubmit = () => {
    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum)) {
      toast.error("Grade must be a number");
      return;
    }

    gradeMutation.mutate(
      {
        submissionId: id,
        feedback,
        grade: gradeNum,
      },
      {
        onSuccess: () => {
          toast.success("Feedback and grade saved successfully");
          if (submission?.assignmentId) {
            router.push(`/assignments/${submission.assignmentId}`);
          } else {
            router.push("/assignments");
          }
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container mx-auto py-10">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="pl-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Submission not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleGradeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers
    const value = e.target.value.replace(/[^0-9]/g, "");
    setGrade(value);
  };

  return (
    <RoleGuard
      allowedRoles={["lecturer", "admin"]}
      fallback={<div>You do not have permission to view this page.</div>}
    >
      <div className="container mx-auto py-10">
        <div className="mb-6">
          <Link href={`/assignments/${submission.assignmentId}`}>
            <Button variant="ghost" className="pl-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assignment
            </Button>
          </Link>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                Grade Submission: {submission.assignment?.title || "Assignment"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500">
                    Student
                  </h3>
                  <p className="mt-1">
                    {submission.profile?.fullName || "Unnamed Student"}
                  </p>
                  {submission.profile?.email && (
                    <p className="text-sm text-slate-500">
                      {submission.profile.email}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500">
                    Repository
                  </h3>
                  <a
                    href={submission.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center text-blue-600 hover:underline"
                  >
                    <Github className="h-4 w-4 mr-1" />
                    {submission.repositoryName || submission.repositoryUrl}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500">
                    Submitted
                  </h3>
                  <p className="mt-1">
                    {format(
                      new Date(submission.submittedAt || ""),
                      "PPP 'at' h:mm a"
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter a numeric grade"
                  value={grade}
                  onChange={handleGradeChange}
                  className="max-w-[200px]"
                />
              </div>

              <div>
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide feedback to the student"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={6}
                />
              </div>
            </CardContent>
            <CardContent className="pt-0">
              <Button
                onClick={handleSubmit}
                disabled={gradeMutation.isPending}
                className="w-full sm:w-auto"
              >
                {gradeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Feedback & Grade
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
