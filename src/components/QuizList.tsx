"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Edit, Trash, Lock, Award, ExternalLink } from "lucide-react";
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
import { QuizWithQuestionsAndOptions } from "@/db/drizzle/schema";
import { Badge } from "@/components/ui/badge";
import { useCloseAndGradeQuiz, useDeleteQuiz } from "@/hooks/useQuizzes";

interface QuizListProps {
  isAdmin?: boolean;
  title?: string;
  emptyMessage?: string;
}

export default function QuizList({
  isAdmin = false,
  title = "Available Quizzes",
  emptyMessage = "No quizzes available at the moment.",
}: QuizListProps) {
  const [quizzes, setQuizzes] = useState<QuizWithQuestionsAndOptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizToClose, setQuizToClose] = useState<string | null>(null);
  const router = useRouter();
  const closeAndGradeQuizMutation = useCloseAndGradeQuiz();
  const deleteQuizMutation = useDeleteQuiz();

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        setLoading(true);

        // Use the API route with the includeQuestions parameter
        const response = await fetch("/api/quizzes?includeQuestions=true");

        if (!response.ok) {
          throw new Error(`Failed to fetch quizzes: ${response.statusText}`);
        }

        const data = await response.json();
        setQuizzes(data);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchQuizzes();
  }, []);

  const handleDeleteQuiz = async (quizId: string) => {
    deleteQuizMutation.mutate(quizId, {
      onSuccess: () => {
        setQuizzes(quizzes.filter((q) => q.id !== quizId));
      },
    });
  };

  const handleCloseAndGradeQuiz = async () => {
    if (quizToClose) {
      closeAndGradeQuizMutation.mutate(quizToClose, {
        onSuccess: () => {
          // Update local state to reflect the change
          setQuizzes(
            quizzes.map((quiz) =>
              quiz.id === quizToClose ? { ...quiz, closed: true } : quiz
            )
          );
          setQuizToClose(null);
        },
      });
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8">Loading quizzes...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        {isAdmin && (
          <Button
            onClick={() => router.push("/admin/quizzes/new")}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Create Quiz
          </Button>
        )}
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <p className="text-muted-foreground">{emptyMessage}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => {
            return (
              <Card key={quiz.id} className={quiz.closed ? "opacity-80" : ""}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{quiz.title}</CardTitle>
                    {quiz.closed && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Lock size={12} />
                        Closed
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {quiz.description
                      ? quiz.description.substring(0, 100) +
                        (quiz.description.length > 100 ? "..." : "")
                      : "No description available"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {quiz.quizQuestions?.length || 0} questions
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {quiz.grade === 0 ? (
                      <span className="text-muted">
                        Practice Quiz (0 points)
                      </span>
                    ) : (
                      <>
                        Worth: {(quiz.grade / 10).toFixed(1)} point
                        {quiz.grade !== 10 ? "s" : ""}
                      </>
                    )}
                  </p>
                </CardContent>
                <CardFooter>
                  {isAdmin ? (
                    <div className="flex flex-wrap justify-between w-full gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/quizzes/${quiz.id}`)}
                      >
                        <Edit size={16} className="mr-2" />
                        Edit
                      </Button>

                      {!quiz.closed && quiz.grade > 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQuizToClose(quiz.id)}
                              className="text-amber-600 border-amber-200 hover:bg-amber-50"
                            >
                              <Award size={16} className="mr-2" />
                              Close & Grade
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Close and grade quiz?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will close the quiz for students and award{" "}
                                {(quiz.grade / 10).toFixed(1)} points to all
                                students who have taken it. This action cannot
                                be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                onClick={() => setQuizToClose(null)}
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleCloseAndGradeQuiz}
                                disabled={closeAndGradeQuizMutation.isPending}
                              >
                                {closeAndGradeQuizMutation.isPending
                                  ? "Processing..."
                                  : "Close & Grade"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 border-red-200 hover:bg-red-50"
                          >
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
                              This action cannot be undone. This will
                              permanently delete the quiz and all associated
                              data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              disabled={deleteQuizMutation.isPending}
                            >
                              {deleteQuizMutation.isPending
                                ? "Deleting..."
                                : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ) : (
                    <Button
                      onClick={() => router.push(`/quizzes/${quiz.id}`)}
                      className="w-full cursor-pointer flex items-center gap-2"
                      disabled={quiz.closed}
                    >
                      {quiz.closed ? (
                        <>Quiz Closed</>
                      ) : (
                        <>
                          Take Quiz
                          <ExternalLink size={16} />
                        </>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
