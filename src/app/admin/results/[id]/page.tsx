"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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

export default function QuizResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;

  const [result, setResult] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [options, setOptions] = useState<Record<string, any[]>>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResultDetails() {
      try {
        setLoading(true);

        // Fetch the quiz result
        const { data: resultData, error: resultError } = await supabase
          .from("quiz_results")
          .select("*")
          .eq("id", resultId)
          .single();

        if (resultError) throw resultError;

        // Fetch the quiz
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", resultData.quiz_id)
          .single();

        if (quizError) throw quizError;

        // Fetch the questions for this quiz
        const { data: questionsData, error: questionsError } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("quiz_id", resultData.quiz_id)
          .order("order_index");

        if (questionsError) throw questionsError;

        // Fetch all options for all questions
        const questionIds = questionsData.map((q) => q.id);
        const { data: optionsData, error: optionsError } = await supabase
          .from("quiz_options")
          .select("*")
          .in("question_id", questionIds)
          .order("order_index");

        if (optionsError) throw optionsError;

        // Group options by question_id
        const optionsMap = optionsData.reduce((acc, option) => {
          if (!acc[option.question_id]) {
            acc[option.question_id] = [];
          }
          acc[option.question_id].push(option);
          return acc;
        }, {} as Record<string, any[]>);

        // Fetch user information
        // Adjust this based on your user data structure
        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", resultData.user_id)
          .single();

        setResult(resultData);
        setQuiz(quizData);
        setQuestions(questionsData);
        setOptions(optionsMap);
        setUser(userData || { id: resultData.user_id });
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
    return result.answers[questionId];
  }

  function isAnswerCorrect(questionId: string) {
    const answer = getAnswerForQuestion(questionId);
    if (!answer) return false;

    const questionOptions = options[questionId] || [];

    // For single choice questions
    if (typeof answer === "string") {
      const selectedOption = questionOptions.find((opt) => opt.id === answer);
      return selectedOption?.is_correct || false;
    }

    // For multiple choice questions
    if (Array.isArray(answer)) {
      const correctOptions = questionOptions
        .filter((opt) => opt.is_correct)
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

  const percentage = Math.round((result.score / result.total_questions) * 100);
  const userName = user?.full_name || user?.email || result.user_id;

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
                {result.score} / {result.total_questions} ({percentage}%)
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
                    <p>{new Date(result.completed_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quiz Type</p>
                    <p>
                      {quiz.is_multiple_choice
                        ? "Multiple Choice"
                        : "Single Choice"}
                    </p>
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
                                    ${option.is_correct ? "text-green-600" : ""}
                                    ${
                                      isSelected && !option.is_correct
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
                                  {option.is_correct && (
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
