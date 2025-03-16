"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { QuizAnswers, QuizQuestionWithOptions } from "@/db/drizzle/schema";
import { useQuiz } from "@/hooks/useQuizzes";
import { useMutation } from "@tanstack/react-query";
import { saveQuizResult } from "@/app/api/actions/quiz-results";
import { isQuestionMultipleChoice } from "@/db/drizzle/schema";
import { toast } from "sonner";

export default function TakeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{
    score: number;
    total: number;
    percentage: number;
  } | null>(null);

  const { data: quiz, isLoading, error } = useQuiz(params.id as string);

  useEffect(() => {
    if (quiz) {
      const initialAnswers: QuizAnswers = {};
      quiz.quizQuestions.forEach((question: QuizQuestionWithOptions) => {
        const hasMultipleCorrectAnswers =
          question.quizOptions &&
          question.quizOptions.filter((o) => o.isCorrect).length > 1;

        initialAnswers[question.id] = hasMultipleCorrectAnswers ? [] : "";
      });
      setAnswers(initialAnswers);
    }
  }, [quiz]);

  const saveResultMutation = useMutation({
    mutationFn: async ({
      quizId,
      score,
      totalQuestions,
      answers,
    }: {
      quizId: string;
      score: number;
      totalQuestions: number;
      answers: Record<string, string | string[]>;
    }) => {
      const result = await saveQuizResult({
        quizId,
        score,
        totalQuestions,
        answers,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to save quiz result");
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Quiz result saved successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to save quiz result", {
        description: error.message,
        duration: 5000,
      });

      console.error("Error saving quiz result:", error);
    },
  });

  function handleSingleChoiceChange(questionId: string, optionId: string) {
    setAnswers({
      ...answers,
      [questionId]: optionId,
    });
  }

  function handleMultipleChoiceChange(
    questionId: string,
    optionId: string,
    checked: boolean
  ) {
    const currentAnswers = [...(answers[questionId] || [])];

    if (checked) {
      if (!currentAnswers.includes(optionId)) {
        currentAnswers.push(optionId);
      }
    } else {
      const index = currentAnswers.indexOf(optionId);
      if (index !== -1) {
        currentAnswers.splice(index, 1);
      }
    }

    setAnswers({
      ...answers,
      [questionId]: currentAnswers,
    });
  }

  function calculateScore() {
    let correctAnswers = 0;
    const totalQuestions: number = quiz?.quizQuestions.length || 0;

    quiz?.quizQuestions.forEach((question) => {
      const userAnswer = answers[question.id];
      const correctOptions = question.quizOptions
        .filter((option) => option.isCorrect)
        .map((option) => option.id);

      // Determine if this is a multiple choice question
      const isMultipleCorrectAnswers = correctOptions.length > 1;

      if (isMultipleCorrectAnswers) {
        // For multiple choice, all correct options must be selected and no incorrect ones
        const isCorrect =
          correctOptions.every((id) => userAnswer.includes(id)) &&
          userAnswer.length === correctOptions.length;

        if (isCorrect) correctAnswers++;
      } else {
        // For single choice, the selected option must be correct
        if (correctOptions.includes(userAnswer as string)) {
          correctAnswers++;
        }
      }
    });

    return {
      score: correctAnswers,
      total: totalQuestions,
      percentage: Math.round((correctAnswers / totalQuestions) * 100),
    };
  }

  function handleSubmit() {
    if (!quiz) return;

    const scoreResult = calculateScore();
    setScore(scoreResult);
    setSubmitted(true);

    // Save the quiz result using mutation
    toast.promise(
      saveResultMutation.mutateAsync({
        quizId: quiz.id,
        score: scoreResult.score,
        totalQuestions: scoreResult.total,
        answers,
      }),
      {
        loading: "Saving your quiz results...",
        success: "Your quiz results were saved successfully!",
        error: (err) => `Failed to save results: ${err.message}`,
      }
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading quiz...</span>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="container mx-auto py-8">
        Quiz not found or error loading quiz
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
          <CardDescription>{quiz.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-6">
              <div className="text-center py-4">
                <h2 className="text-2xl font-bold">Your Score</h2>
                <p className="text-4xl font-bold mt-2">
                  {score?.score}/{score?.total}
                </p>
                <p className="text-xl mt-2">{score?.percentage}%</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Review Your Answers</h3>
                {quiz.quizQuestions.map((question, qIndex) => {
                  const userAnswer = answers[question.id];
                  const correctOptions = question.quizOptions
                    .filter((option) => option.isCorrect)
                    .map((option) => option.id);

                  let isCorrect;
                  if (isQuestionMultipleChoice(question)) {
                    isCorrect =
                      correctOptions.every((id) => userAnswer.includes(id)) &&
                      userAnswer.length === correctOptions.length;
                  } else {
                    isCorrect = correctOptions.includes(userAnswer as string);
                  }

                  return (
                    <Card
                      key={question.id}
                      className={`border ${
                        isCorrect ? "border-green-500" : "border-red-500"
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          Question {qIndex + 1}: {question.text}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {isQuestionMultipleChoice(question) ? (
                            question.quizOptions.map((option) => {
                              const isSelected = userAnswer.includes(option.id);
                              return (
                                <div
                                  key={option.id}
                                  className={`p-2 rounded ${
                                    option.isCorrect
                                      ? "bg-green-100"
                                      : isSelected && !option.isCorrect
                                      ? "bg-red-100"
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Checkbox checked={isSelected} disabled />
                                    <span>{option.text}</span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <RadioGroup value={userAnswer as string} disabled>
                              {question.quizOptions.map((option) => {
                                const isSelected = userAnswer === option.id;
                                return (
                                  <div
                                    key={option.id}
                                    className={`p-2 rounded ${
                                      option.isCorrect
                                        ? "bg-green-100"
                                        : isSelected && !option.isCorrect
                                        ? "bg-red-100"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <RadioGroupItem
                                        value={option.id}
                                        disabled
                                      />
                                      <span>{option.text}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </RadioGroup>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {quiz.quizQuestions.map((question, qIndex) => {
                // Determine if this question has multiple correct answers
                const isMultipleCorrectAnswers =
                  question.quizOptions &&
                  question.quizOptions.filter((o) => o.isCorrect).length > 1;

                return (
                  <Card key={question.id} className="border border-muted">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Question {qIndex + 1}: {question.text}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isMultipleCorrectAnswers ? (
                        <div className="space-y-2">
                          {question.quizOptions.map((option) => (
                            <div
                              key={option.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`option-${option.id}`}
                                checked={(answers[question.id] || []).includes(
                                  option.id
                                )}
                                onCheckedChange={(checked) =>
                                  handleMultipleChoiceChange(
                                    question.id,
                                    option.id,
                                    checked as boolean
                                  )
                                }
                              />
                              <Label htmlFor={`option-${option.id}`}>
                                {option.text}
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <RadioGroup
                          value={answers[question.id] as string}
                          onValueChange={(value) =>
                            handleSingleChoiceChange(question.id, value)
                          }
                        >
                          <div className="space-y-2">
                            {question.quizOptions.map((option) => (
                              <div
                                key={option.id}
                                className="flex items-center space-x-2"
                              >
                                <RadioGroupItem
                                  value={option.id}
                                  id={`option-${option.id}`}
                                />
                                <Label htmlFor={`option-${option.id}`}>
                                  {option.text}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter>
          {submitted ? (
            <Button onClick={() => router.push("/quizzes")}>
              Back to Quizzes
            </Button>
          ) : (
            <Button onClick={handleSubmit}>Submit Quiz</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
