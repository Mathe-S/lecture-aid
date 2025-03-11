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
import { getQuizWithQuestions } from "@/lib/quizService";
import { useAuth } from "@/context/AuthContext";

export default function TakeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        setLoading(true);
        const quizData = await getQuizWithQuestions(params.id);
        setQuiz(quizData);

        // Initialize answers object
        const initialAnswers = {};
        quizData.questions.forEach((question) => {
          initialAnswers[question.id] = quizData.is_multiple_choice ? [] : null;
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

  function handleSingleChoiceChange(questionId, optionId) {
    setAnswers({
      ...answers,
      [questionId]: optionId,
    });
  }

  function handleMultipleChoiceChange(questionId, optionId, checked) {
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
    let totalQuestions = quiz.questions.length;

    quiz.questions.forEach((question) => {
      const userAnswer = answers[question.id];
      const correctOptions = question.quiz_options
        .filter((option) => option.is_correct)
        .map((option) => option.id);

      if (quiz.is_multiple_choice) {
        // For multiple choice, all correct options must be selected and no incorrect ones
        const isCorrect =
          correctOptions.every((id) => userAnswer.includes(id)) &&
          userAnswer.length === correctOptions.length;

        if (isCorrect) correctAnswers++;
      } else {
        // For single choice, the selected option must be correct
        if (correctOptions.includes(userAnswer)) {
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
    const quizScore = calculateScore();
    setScore(quizScore);
    setSubmitted(true);

    // Here you could also save the quiz result to the database
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
                  {score.score}/{score.total}
                </p>
                <p className="text-xl mt-2">{score.percentage}%</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Review Your Answers</h3>
                {quiz.questions.map((question, qIndex) => {
                  const userAnswer = answers[question.id];
                  const correctOptions = question.quiz_options
                    .filter((option) => option.is_correct)
                    .map((option) => option.id);

                  let isCorrect;
                  if (quiz.is_multiple_choice) {
                    isCorrect =
                      correctOptions.every((id) => userAnswer.includes(id)) &&
                      userAnswer.length === correctOptions.length;
                  } else {
                    isCorrect = correctOptions.includes(userAnswer);
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
                          {question.quiz_options.map((option) => {
                            const isSelected = quiz.is_multiple_choice
                              ? userAnswer.includes(option.id)
                              : userAnswer === option.id;

                            return (
                              <div
                                key={option.id}
                                className={`p-2 rounded ${
                                  option.is_correct
                                    ? "bg-green-100"
                                    : isSelected && !option.is_correct
                                    ? "bg-red-100"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {quiz.is_multiple_choice ? (
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
              {quiz.questions.map((question, qIndex) => (
                <Card key={question.id} className="border border-muted">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Question {qIndex + 1}: {question.text}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {quiz.is_multiple_choice ? (
                      <div className="space-y-2">
                        {question.quiz_options.map((option) => (
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
                                  checked
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
                        value={answers[question.id] || ""}
                        onValueChange={(value) =>
                          handleSingleChoiceChange(question.id, value)
                        }
                      >
                        <div className="space-y-2">
                          {question.quiz_options.map((option) => (
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
