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
import {
  QuizAnswers,
  QuizQuestion,
  QuizWithQuestionsAndOptions,
} from "@/db/drizzle/schema";
import { supabase } from "@/lib/supabase";

export default function TakeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizWithQuestionsAndOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{
    score: number;
    total: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        setLoading(true);
        const response = await fetch(`/api/quizzes/${params.id}`);
        const quizData = await response.json();
        console.log("🚀 ~ fetchQuiz ~ quizData:", quizData);
        setQuiz(quizData);

        // Initialize answers object
        const initialAnswers: QuizAnswers = {};
        quizData.questions.forEach((question: QuizQuestion) => {
          initialAnswers[question.id] = quizData.is_multiple_choice ? [] : "";
        });
        setAnswers(initialAnswers);
      } catch (error) {
        console.error("Error fetching quiz:", error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchQuiz();
    }
  }, [params.id]);

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

      if (quiz.isMultipleChoice) {
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
    const scoreResult = calculateScore();
    setScore(scoreResult);
    setSubmitted(true);

    // Save the quiz result to the database
    saveQuizResult(
      quiz?.id as string,
      scoreResult.score,
      scoreResult.total,
      answers
    );
  }

  // Add this function to save the quiz result
  async function saveQuizResult(
    quizId: string,
    score: number,
    totalQuestions: number,
    answers: Record<string, string | string[]>
  ) {
    try {
      // First, get the user data
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        console.error("No authenticated user found");
        return;
      }

      // Then use the user ID in your insert
      const { error } = await supabase.from("quiz_results").insert({
        quiz_id: quizId,
        user_id: userData.user.id,
        score,
        total_questions: totalQuestions,
        answers,
      });

      if (error) {
        console.error("Error saving quiz result:", error);
      }
    } catch (error) {
      console.error("Error saving quiz result:", error);
    }
  }

  if (loading) {
    return <div className="container mx-auto py-8">Loading quiz...</div>;
  }

  if (!quiz) {
    return <div className="container mx-auto py-8">Quiz not found</div>;
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
                  if (quiz.isMultipleChoice) {
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
                          {question.quizOptions.map((option) => {
                            const isSelected = quiz.isMultipleChoice
                              ? userAnswer.includes(option.id)
                              : userAnswer === option.id;

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
                                  {quiz.isMultipleChoice ? (
                                    <Checkbox checked={isSelected} disabled />
                                  ) : (
                                    <RadioGroupItem
                                      value={option.id}
                                      checked={isSelected}
                                      disabled
                                    />
                                  )}
                                  <span>{option.text}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {quiz.quizQuestions.map((question, qIndex) => (
                <Card key={question.id} className="border border-muted">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Question {qIndex + 1}: {question.text}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {quiz.isMultipleChoice ? (
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
              ))}
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
