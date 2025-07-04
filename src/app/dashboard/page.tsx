"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  Shield,
  Github,
  Loader2,
  Edit,
  Check,
  X,
  BookOpen,
  ExternalLink,
  Award,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { updateUserProfileAction } from "../actions/auth";
import { useUserSubmissions } from "@/hooks/useSubmissions";
import Link from "next/link";
import { format } from "date-fns";
import { AssignmentSubmissionWithProfile } from "@/db/drizzle/schema";
import { useGrades } from "@/hooks/useGrades";
import { Progress } from "@/components/ui/progress";
import { useUserMidtermEvaluations } from "@/hooks/useMidtermGroups";
import { FinalTaskScoreCard } from "@/components/final/final-task-score-card";

export default function DashboardPage() {
  const { user, role, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [isEditingName, setIsEditingName] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: submissions, isLoading: isLoadingSubmissions } =
    useUserSubmissions(user?.id);

  const { data: grades, isLoading: isLoadingGrades } = useGrades();

  const { data: midtermEvaluations, isLoading: isLoadingMidtermEvals } =
    useUserMidtermEvaluations();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }

    if (user) {
      // Initialize name fields from user data
      const fullName =
        user.user_metadata?.full_name || user.user_metadata?.name || "";
      const nameParts = fullName.split(" ");
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-slate-400 mx-auto" />
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Get avatar URL from GitHub user metadata
  const avatarUrl = user.user_metadata?.avatar_url || "";
  const userName =
    user.user_metadata?.full_name || user.user_metadata?.name || "User";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  const handleSaveName = async () => {
    if (!firstName.trim()) return;

    setIsSaving(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const result = await updateUserProfileAction({
        id: user.id,
        fullName: fullName,
      });

      if (result.success) {
        // Refresh the user data to update the UI
        await refreshUser();
      }
    } catch (error) {
      console.error("Failed to update name:", error);
    } finally {
      setIsEditingName(false);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{userName}</CardTitle>
                <CardDescription>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {role || "Loading role..."}
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4 text-sm">
                <User className="h-5 w-5 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Name</p>
                  {isEditingName ? (
                    <div className="mt-1 space-y-2">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="First name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={handleSaveName}
                          disabled={isSaving || !firstName.trim()}
                          className="flex items-center"
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingName(false)}
                          className="flex items-center"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <p className="text-sm text-slate-500">{userName}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingName(true)}
                        className="ml-2 h-6 w-6 p-0"
                      >
                        <Edit className="h-3.5 w-3.5 text-slate-400" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <Mail className="h-5 w-5 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Email</p>
                  <p className="text-sm text-slate-500">
                    {user.email || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <Shield className="h-5 w-5 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Role</p>
                  <p className="text-sm text-slate-500">
                    {role || "Not assigned"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <Github className="h-5 w-5 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">GitHub</p>
                  <p className="text-sm text-slate-500">
                    {user.user_metadata?.preferred_username ||
                      user.user_metadata?.user_name ||
                      "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <div className="h-5 w-5 text-slate-400 flex items-center justify-center">
                  ID
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">User ID</p>
                  <p className="text-sm text-slate-500 break-all">{user.id}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              My Course Progress
            </CardTitle>
            <CardDescription>
              Your current grades and progress in the course
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingGrades ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : grades ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Overall Grade</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {grades.totalPoints}
                      </span>
                      <span className="text-slate-500 text-sm">
                        / {grades.maxPossiblePoints || "N/A"}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={
                      (grades.totalPoints / (grades.maxPossiblePoints || 1)) *
                      100
                    }
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-md p-4 space-y-1">
                    <h4 className="text-sm font-medium text-slate-500">
                      Quiz Points
                    </h4>
                    <div className="text-lg font-semibold">
                      {grades.quizPoints}
                      <span className="text-slate-400 text-sm ml-1">
                        / {grades.maxQuizPoints || "0"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-md p-4 space-y-1">
                    <h4 className="text-sm font-medium text-slate-500">
                      Assignment Points
                    </h4>
                    <div className="text-lg font-semibold">
                      {grades.assignmentPoints}
                      <span className="text-slate-400 text-sm ml-1">
                        / {grades.maxAssignmentPoints || "0"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-md p-4 space-y-1">
                    <h4 className="text-sm font-medium text-slate-500">
                      Midterm Points
                    </h4>
                    <div className="text-lg font-semibold">
                      {grades.midtermPoints ?? 0}
                      <span className="text-slate-400 text-sm ml-1">/ 250</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-md p-4 space-y-1">
                    <h4 className="text-sm font-medium text-slate-500">
                      Extra Points
                    </h4>
                    <div className="text-lg font-semibold">
                      {grades.extraPoints}
                    </div>
                  </div>
                </div>

                {/* Final Project Score */}
                <div className="mt-6">
                  <FinalTaskScoreCard />
                </div>
              </div>
            ) : (
              <p className="text-center py-4 text-slate-500">
                No grade data available
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Midterm Project Evaluations
            </CardTitle>
            <CardDescription>
              Your evaluation results for the midterm project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMidtermEvals ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : midtermEvaluations?.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                Your midterm evaluation is not available yet.
              </p>
            ) : (
              <div className="space-y-4">
                {midtermEvaluations?.map((evalData) => (
                  <div
                    key={evalData.id}
                    className="p-4 rounded-lg border border-slate-200 bg-white space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Link
                          href={`/midterm/groups/${evalData.groupId}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          Group: {evalData.groupName}
                        </Link>
                        <p className="text-xs text-slate-500">
                          Evaluated on:{" "}
                          {format(new Date(evalData.updatedAt), "PPP")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          {evalData.totalScore}/250
                        </p>
                        {/* Optionally add breakdown or link to details */}
                      </div>
                    </div>
                    {/* Conditionally display feedback */}
                    {evalData.feedback && (
                      <div className="mt-2 pt-3 border-t border-slate-100">
                        <h4 className="text-xs font-medium text-slate-600 mb-1">
                          Feedback:
                        </h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {evalData.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Assignment Submissions
            </CardTitle>
            <CardDescription>
              View and manage your assignment submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSubmissions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : submissions?.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                You haven&apos;t submitted any assignments yet.
              </p>
            ) : (
              <div className="space-y-4">
                {submissions?.map(
                  (submission: AssignmentSubmissionWithProfile) => (
                    <div
                      key={submission.id}
                      className="flex items-start justify-between p-4 rounded-lg border border-slate-200 bg-white"
                    >
                      <div className="space-y-1">
                        <Link
                          href={`/assignments/${submission.assignmentId}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {submission.assignment.title}
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <span>
                            Submitted on{" "}
                            {submission.submittedAt
                              ? format(new Date(submission.submittedAt), "PPP")
                              : "Not submitted"}
                          </span>
                          {submission.grade !== null && (
                            <span>• Grade: {submission.grade}</span>
                          )}
                        </div>
                      </div>
                      <a
                        href={submission.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {role === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>
                Special actions available to administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/admin")}>
                Go to Admin Panel
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
