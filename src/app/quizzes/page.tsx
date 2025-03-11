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
import { getQuizzes } from "@/lib/quizService";
import { QuizWithQuestionCount } from "@/types";

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizWithQuestionCount[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        setLoading(true);
        const data = await getQuizzes();
        setQuizzes(data || []);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchQuizzes();
  }, []);

  if (loading) {
    return <div className="container mx-auto py-8">Loading quizzes...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Available Quizzes</h1>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                No quizzes available at the moment.
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
              <CardFooter>
                <Button
                  onClick={() => router.push(`/quizzes/${quiz.id}`)}
                  className="w-full cursor-pointer"
                >
                  Take Quiz
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
