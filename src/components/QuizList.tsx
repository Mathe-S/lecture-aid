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
  const router = useRouter();

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
    try {
      // Use the API route for deletion
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete quiz: ${response.statusText}`);
      }

      // Only update UI if API call succeeds
      setQuizzes(quizzes.filter((q) => q.id !== quizId));
    } catch (error) {
      console.error("Error deleting quiz:", error);
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
                  {quiz.quizQuestions?.length || 0} questions
                </p>
                <p className="text-sm text-muted-foreground">
                  Type:{" "}
                  {quiz.isMultipleChoice ? "Multiple Choice" : "Single Choice"}
                </p>
              </CardContent>
              <CardFooter>
                {isAdmin ? (
                  <div className="flex justify-between w-full">
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
                  </div>
                ) : (
                  <Button
                    onClick={() => router.push(`/quizzes/${quiz.id}`)}
                    className="w-full cursor-pointer"
                  >
                    Take Quiz
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
