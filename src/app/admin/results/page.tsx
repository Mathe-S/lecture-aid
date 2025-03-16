"use client";

import RoleGuard from "@/components/RoleGuard";
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
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useQuizResults } from "@/hooks/useQuizResults";
import { QuizResult } from "@/db/drizzle/schema";

export default function AdminQuizResultsPage() {
  const router = useRouter();
  const { data, isLoading, error } = useQuizResults();

  // Extract data
  const results = data?.results || [];
  const quizzes = data?.quizzes || {};
  const users = data?.users || {};

  function handleViewDetails(resultId: string) {
    router.push(`/admin/results/${resultId}`);
  }

  return (
    <RoleGuard
      allowedRoles={["admin"]}
      fallback={<div>You do not have permission to view this page.</div>}
    >
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Results</CardTitle>
            <CardDescription>
              View all quiz submissions and student performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                <span>Loading results...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                Error loading results
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8">No quiz results found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result: QuizResult) => {
                    const quiz = quizzes[result.quizId] || {
                      title: "Unknown Quiz",
                    };
                    const user = users[result.userId] || {};
                    const percentage = Math.round(
                      (result.score / result.totalQuestions) * 100
                    );

                    return (
                      <TableRow key={result.id}>
                        <TableCell>{quiz.title}</TableCell>
                        <TableCell>
                          {user?.fullName ||
                            user?.email ||
                            `User (${result.userId.substring(0, 8)}...)`}
                        </TableCell>
                        <TableCell>
                          {result.score} / {result.totalQuestions}
                        </TableCell>
                        <TableCell>{percentage}%</TableCell>
                        <TableCell>
                          {new Date(result.completedAt || "").toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(result.id)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
