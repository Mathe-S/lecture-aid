"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleGuard from "@/components/RoleGuard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ProfileRecord, QuizQuestion, QuizResult } from "@/db/drizzle/schema";
import { QuizOption } from "@/db/drizzle/schema";
import { Quiz } from "@/db/drizzle/schema";

export default function QuizResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;

  const [result, setResult] = useState<QuizResult | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [options, setOptions] = useState<Record<string, QuizOption[]>>({});
  const [user, setUser] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResultDetails() {
      try {
        setLoading(true);

        // Fetch all data through our API route
        const response = await fetch(`/api/quiz-results/${resultId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch result: ${response.statusText}`);
        }

        const data = await response.json();

        setResult(data.result);
        setQuiz(data.quiz);
        setQuestions(data.questions);
        setOptions(data.options);
        setUser(data.user || { id: data.result.userId });
      } catch (error) {
        console.error("Error fetching result details:", error);
      } finally {
        setLoading(false);
      }
    }

    if (resultId) {
      fetchResultDetails();
    }
  }, [resultId]);

  function getAnswerForQuestion(questionId: string) {
    if (!result || !result.answers) return null;
    return (
      (result.answers as Record<string, string | string[]>)[questionId] || null
    );
  }

  function isAnswerCorrect(questionId: string) {
    const answer = getAnswerForQuestion(questionId);
    if (!answer) return false;

    const questionOptions = options[questionId] || [];

    // For single choice questions
    if (typeof answer === "string") {
      const selectedOption = questionOptions.find((opt) => opt.id === answer);
      return selectedOption?.isCorrect || false;
    }

    // For multiple choice questions
    if (Array.isArray(answer)) {
      const correctOptions = questionOptions
        .filter((opt) => opt.isCorrect)
        .map((opt) => opt.id);
      const selectedCorrectOptions = answer.filter((id) =>
        correctOptions.includes(id)
      );

      // All correct options must be selected and no incorrect options
      return (
        selectedCorrectOptions.length === correctOptions.length &&
        answer.length === selectedCorrectOptions.length
      );
    }

    return false;
  }

  if (loading) {
    return (
      <RoleGuard allowedRoles={["admin"]}>
        <div className="container mx-auto py-8">
          <div className="flex justify-center">Loading result details...</div>
        </div>
      </RoleGuard>
    );
  }

  if (!result || !quiz) {
    return (
      <RoleGuard allowedRoles={["admin"]}>
        <div className="container mx-auto py-8">
          <div className="flex justify-center">Result not found</div>
        </div>
      </RoleGuard>
    );
  }

  const percentage = Math.round((result.score / result.totalQuestions) * 100);
  const userName = user?.fullName || user?.email || result.userId;

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription>Result for {userName}</CardDescription>
              </div>
              <Badge
                className={
                  percentage >= 70
                    ? "bg-green-500"
                    : percentage >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }
              >
                {result.score} / {result.totalQuestions} ({percentage}%)
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Quiz Details</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Completed On
                    </p>
                    <p>{new Date(result.completedAt || "").toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Question Responses</h3>

                <div className="space-y-6">
                  {questions.map((question, index) => {
                    const questionOptions = options[question.id] || [];
                    const answer = getAnswerForQuestion(question.id);
                    const isCorrect = isAnswerCorrect(question.id);

                    return (
                      <div key={question.id} className="border rounded-lg p-4">
                        <div className="flex justify-between">
                          <h4 className="font-medium">
                            Question {index + 1}: {question.text}
                          </h4>
                          <Badge
                            variant={isCorrect ? "default" : "destructive"}
                          >
                            {isCorrect ? "Correct" : "Incorrect"}
                          </Badge>
                        </div>

                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground mb-1">
                            Options:
                          </p>
                          <ul className="space-y-1">
                            {questionOptions.map((option) => {
                              const isSelected = Array.isArray(answer)
                                ? answer.includes(option.id)
                                : answer === option.id;

                              return (
                                <li
                                  key={option.id}
                                  className="flex items-center gap-2"
                                >
                                  <span
                                    className={`
                                    ${isSelected ? "font-medium" : ""}
                                    ${option.isCorrect ? "text-green-600" : ""}
                                    ${
                                      isSelected && !option.isCorrect
                                        ? "text-red-600"
                                        : ""
                                    }
                                  `}
                                  >
                                    {option.text}
                                  </span>
                                  {isSelected && (
                                    <Badge variant="outline" className="ml-2">
                                      Selected
                                    </Badge>
                                  )}
                                  {option.isCorrect && (
                                    <Badge
                                      variant="outline"
                                      className="bg-green-50 text-green-700 border-green-200"
                                    >
                                      Correct Answer
                                    </Badge>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/results")}
            >
              Back to Results
            </Button>
          </CardFooter>
        </Card>
      </div>
    </RoleGuard>
  );
}
