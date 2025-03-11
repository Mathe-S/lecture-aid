"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Edit, Trash } from "lucide-react";
import { supabase } from "@/lib/supabase";
import RoleGuard from "@/components/RoleGuard";
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
import { QuizWithQuestionCount } from "@/types";

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizWithQuestionCount[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        setLoading(true);

        // Option 1: Using a join to get question counts
        const { data, error } = await supabase
          .from("quizzes")
          .select(
            `
            *,
            quiz_questions:quiz_questions(count)
          `
          )
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Transform the data to include question_count
        const quizzesWithCounts =
          data?.map((quiz) => ({
            ...quiz,
            question_count: quiz.quiz_questions[0]?.count || 0,
          })) || [];

        setQuizzes(quizzesWithCounts);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchQuizzes();
  }, []);

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      await supabase.from("quizzes").delete().eq("id", quizId);
      setQuizzes(quizzes.filter((q) => q.id !== quizId));
    } catch (error) {
      console.error("Error deleting quiz:", error);
    }
  };

  return (
    <RoleGuard
      allowedRoles={["admin"]}
      fallback={<div>You do not have permission to view this page.</div>}
    >
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Quiz Management</h1>
          <Button
            onClick={() => router.push("/admin/quizzes/new")}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Create Quiz
          </Button>
        </div>

        {loading ? (
          <div>Loading quizzes...</div>
        ) : quizzes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-6">
                <p className="text-muted-foreground">
                  No quizzes found. Create your first quiz!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <Card key={quiz.id}>
                <CardHeader>
                  <CardTitle>{quiz.title}</CardTitle>
                  <CardDescription>
                    {quiz.description
                      ? quiz.description.substring(0, 100) +
                        (quiz.description.length > 100 ? "..." : "")
                      : "No description available"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {quiz.question_count || 0} questions
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Type:{" "}
                    {quiz.is_multiple_choice
                      ? "Multiple Choice"
                      : "Single Choice"}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/quizzes/${quiz.id}`)}
                  >
                    <Edit size={16} className="mr-2" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="default" size="sm">
                        <Trash size={16} className="mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the quiz and all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteQuiz(quiz.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
