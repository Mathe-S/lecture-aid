"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
import { ProfileRecord, Quiz, QuizResult } from "@/types";

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

        // Fetch all quiz results
        const { data: resultsData, error: resultsError } = await supabase
          .from("quiz_results")
          .select("*")
          .order("completed_at", { ascending: false });

        if (resultsError) throw resultsError;

        // Fetch all quizzes to get their titles
        const { data: quizzesData, error: quizzesError } = await supabase
          .from("quizzes")
          .select("id, title");

        if (quizzesError) throw quizzesError;

        // Create a map of quiz IDs to quiz titles
        const quizzesMap = quizzesData.reduce((acc, quiz) => {
          acc[quiz.id] = quiz as Quiz;
          return acc;
        }, {} as Record<string, Quiz>);

        // Fetch user profiles to display names instead of IDs
        const userIds = [
          ...new Set(resultsData.map((result) => result.user_id)),
        ];

        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("id, email, full_name, avatar_url")
          .in("id", userIds);

        if (usersError) {
          console.error("Error fetching user profiles:", usersError);
        }

        const usersMap = (usersData || []).reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<string, ProfileRecord>);

        setResults(resultsData);
        setQuizzes(quizzesMap);
        setUsers(usersMap);
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
                    console.log("🚀 ~ {results.map ~ result:", result);
                    const quiz = quizzes[result.quiz_id] || {
                      title: "Unknown Quiz",
                    };
                    const user = users[result.user_id] || {
                      full_name: "Unknown User",
                    };
                    const percentage = Math.round(
                      (result.score / result.total_questions) * 100
                    );

                    return (
                      <TableRow key={result.id}>
                        <TableCell>{quiz.title}</TableCell>
                        <TableCell>
                          {user?.full_name ||
                            user?.email ||
                            `User (${result.user_id.substring(0, 8)}...)`}
                        </TableCell>
                        <TableCell>
                          {result.score} / {result.total_questions}
                        </TableCell>
                        <TableCell>{percentage}%</TableCell>
                        <TableCell>
                          {new Date(result.completed_at).toLocaleString()}
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
