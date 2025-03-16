"use client";

import { useState, useEffect } from "react";
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
import { ProfileRecord, Quiz, QuizResult } from "@/db/drizzle/schema";

export default function AdminQuizResultsPage() {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>({});
  const [users, setUsers] = useState<Record<string, ProfileRecord>>({});
  const router = useRouter();

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);

        // Fetch all data through our API route
        const response = await fetch("/api/quiz-results");

        if (!response.ok) {
          throw new Error(`Failed to fetch results: ${response.statusText}`);
        }

        const data = await response.json();

        setResults(data.results);
        setQuizzes(data.quizzes);
        setUsers(data.users);
      } catch (error) {
        console.error("Error fetching quiz results:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, []);

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
            {loading ? (
              <div className="flex justify-center py-8">Loading results...</div>
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
                  {results.map((result) => {
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
