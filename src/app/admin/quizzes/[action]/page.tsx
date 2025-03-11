"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash, Save, ArrowLeft } from "lucide-react";

export default function QuizFormPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const isEditing = params.action !== "new";
  const quizId = isEditing ? params.action : null;

  console.log("Params:", params);
  console.log("Is editing:", isEditing);
  console.log("Quiz ID:", quizId);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState({
    title: "",
    description: "",
    is_multiple_choice: false,
  });
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (isEditing && quizId) {
      fetchQuizData(quizId);
    }
  }, [isEditing, quizId]);

  async function fetchQuizData(id: string) {
    try {
      setLoading(true);
      // Fetch quiz details
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .single();

      if (quizError) throw quizError;

      console.log("🚀 ~ fetchQuizData ~ quizData:", quizData);
      // Fetch quiz questions
      const { data: questionData, error: questionError } = await supabase
        .from("quiz_questions")
        .select("*, quiz_options(*)")
        .eq("quiz_id", id)
        .order("order_index", { ascending: true });

      console.log("🚀 ~ fetchQuizData ~ questionData:", questionData);
      if (questionError) throw questionError;

      setQuiz(quizData);
      setQuestions(questionData || []);
    } catch (error) {
      console.error("Error fetching quiz data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);

      let quizResult;

      // Create or update quiz
      if (isEditing) {
        const { data, error } = await supabase
          .from("quizzes")
          .update({
            title: quiz.title,
            description: quiz.description,
            is_multiple_choice: quiz.is_multiple_choice,
            updated_at: new Date().toISOString(),
          })
          .eq("id", quizId)
          .select()
          .single();

        if (error) throw error;
        quizResult = data;
      } else {
        const { data, error } = await supabase
          .from("quizzes")
          .insert({
            title: quiz.title,
            description: quiz.description,
            is_multiple_choice: quiz.is_multiple_choice,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        quizResult = data;
      }

      // Now handle questions and options
      const currentQuizId = quizResult.id;

      // Process each question
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const isNewQuestion = question.id.toString().startsWith("temp-");
        let questionId;

        // Create or update question
        if (isNewQuestion) {
          // Create new question
          const { data: newQuestion, error: questionError } = await supabase
            .from("quiz_questions")
            .insert({
              quiz_id: currentQuizId,
              text: question.text,
              order_index: i,
            })
            .select()
            .single();

          if (questionError) throw questionError;
          questionId = newQuestion.id;
        } else {
          // Update existing question
          const { error: questionError } = await supabase
            .from("quiz_questions")
            .update({
              text: question.text,
              order_index: i,
            })
            .eq("id", question.id);

          if (questionError) throw questionError;
          questionId = question.id;
        }

        // Process options for this question
        if (question.quiz_options && question.quiz_options.length > 0) {
          for (let j = 0; j < question.quiz_options.length; j++) {
            const option = question.quiz_options[j];
            const isNewOption = option.id.toString().startsWith("temp-");

            if (isNewOption) {
              // Create new option
              const { error: optionError } = await supabase
                .from("quiz_options")
                .insert({
                  question_id: questionId,
                  text: option.text,
                  is_correct: option.is_correct,
                  order_index: j,
                });

              if (optionError) throw optionError;
            } else {
              // Update existing option
              const { error: optionError } = await supabase
                .from("quiz_options")
                .update({
                  text: option.text,
                  is_correct: option.is_correct,
                  order_index: j,
                })
                .eq("id", option.id);

              if (optionError) throw optionError;
            }
          }
        }
      }

      router.push("/admin/quizzes");
    } catch (error) {
      console.error("Error saving quiz:", error);
    } finally {
      setSaving(false);
    }
  }

  function addNewQuestion() {
    setQuestions([
      ...questions,
      {
        id: `temp-${Date.now()}`,
        text: "",
        order_index: questions.length,
        quiz_options: [
          {
            id: `temp-option-${Date.now()}`,
            text: "",
            is_correct: true,
            order_index: 0,
          },
          {
            id: `temp-option-${Date.now() + 1}`,
            text: "",
            is_correct: false,
            order_index: 1,
          },
        ],
      },
    ]);
  }

  if (loading) {
    return <div>Loading quiz data...</div>;
  }

  return (
    <RoleGuard
      allowedRoles={["admin"]}
      fallback={<div>You do not have permission to view this page.</div>}
    >
      <div className="container mx-auto py-8">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/quizzes")}
          className="mb-6"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Quizzes
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Quiz" : "Create New Quiz"}</CardTitle>
            <CardDescription>
              {isEditing
                ? "Update your quiz details and questions"
                : "Fill in the details to create a new quiz"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="details">Quiz Details</TabsTrigger>
                <TabsTrigger value="questions">Questions</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Quiz Title</Label>
                    <Input
                      id="title"
                      value={quiz.title}
                      onChange={(e) =>
                        setQuiz({ ...quiz, title: e.target.value })
                      }
                      placeholder="Enter quiz title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={quiz.description || ""}
                      onChange={(e) =>
                        setQuiz({ ...quiz, description: e.target.value })
                      }
                      placeholder="Enter quiz description"
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="multiple-choice"
                      checked={quiz.is_multiple_choice}
                      onCheckedChange={(checked) =>
                        setQuiz({ ...quiz, is_multiple_choice: checked })
                      }
                    />
                    <Label htmlFor="multiple-choice">
                      Allow multiple correct answers
                    </Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="questions">
                <div className="space-y-6">
                  {questions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        No questions added yet
                      </p>
                      <Button onClick={addNewQuestion}>
                        <Plus size={16} className="mr-2" />
                        Add First Question
                      </Button>
                    </div>
                  ) : (
                    <>
                      {questions.map((question, qIndex) => (
                        <Card key={question.id} className="border border-muted">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <Label htmlFor={`question-${qIndex}`}>
                                Question {qIndex + 1}
                              </Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setQuestions(
                                    questions.filter((_, i) => i !== qIndex)
                                  );
                                }}
                              >
                                <Trash size={16} />
                              </Button>
                            </div>
                            <Input
                              id={`question-${qIndex}`}
                              value={question.text}
                              onChange={(e) => {
                                const newQuestions = [...questions];
                                newQuestions[qIndex].text = e.target.value;
                                setQuestions(newQuestions);
                              }}
                              placeholder="Enter question text"
                            />
                          </CardHeader>
                          <CardContent>
                            <Label className="mb-2 block">Options</Label>
                            <div className="space-y-2">
                              {question.quiz_options.map((option, oIndex) => (
                                <div
                                  key={option.id}
                                  className="flex items-center gap-2"
                                >
                                  <div className="flex-1">
                                    <Input
                                      value={option.text}
                                      onChange={(e) => {
                                        const newQuestions = [...questions];
                                        newQuestions[qIndex].quiz_options[
                                          oIndex
                                        ].text = e.target.value;
                                        setQuestions(newQuestions);
                                      }}
                                      placeholder={`Option ${oIndex + 1}`}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={option.is_correct}
                                      onCheckedChange={(checked) => {
                                        const newQuestions = [...questions];

                                        // For single choice, uncheck all other options
                                        if (
                                          !quiz.is_multiple_choice &&
                                          checked
                                        ) {
                                          newQuestions[
                                            qIndex
                                          ].quiz_options.forEach((opt, i) => {
                                            newQuestions[qIndex].quiz_options[
                                              i
                                            ].is_correct = i === oIndex;
                                          });
                                        } else {
                                          newQuestions[qIndex].quiz_options[
                                            oIndex
                                          ].is_correct = checked;
                                        }

                                        setQuestions(newQuestions);
                                      }}
                                    />
                                    <Label>Correct</Label>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newQuestions = [...questions];
                                        newQuestions[qIndex].quiz_options =
                                          newQuestions[
                                            qIndex
                                          ].quiz_options.filter(
                                            (_, i) => i !== oIndex
                                          );
                                        setQuestions(newQuestions);
                                      }}
                                      disabled={
                                        question.quiz_options.length <= 2
                                      }
                                    >
                                      <Trash size={16} />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                const newQuestions = [...questions];
                                newQuestions[qIndex].quiz_options.push({
                                  id: `temp-option-${Date.now()}`,
                                  text: "",
                                  is_correct: false,
                                  order_index:
                                    newQuestions[qIndex].quiz_options.length,
                                });
                                setQuestions(newQuestions);
                              }}
                            >
                              <Plus size={16} className="mr-2" />
                              Add Option
                            </Button>
                          </CardContent>
                        </Card>
                      ))}

                      <Button onClick={addNewQuestion}>
                        <Plus size={16} className="mr-2" />
                        Add Question
                      </Button>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/quizzes")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !quiz.title}
              className="flex items-center gap-2"
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Save size={16} />
                  Save Quiz
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </RoleGuard>
  );
}
