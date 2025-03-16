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
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash, Save, ArrowLeft } from "lucide-react";
import { Quiz, QuizOption, QuizQuestionWithOptions } from "@/db/drizzle/schema";

export default function QuizFormPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const isEditing = params.action !== "new";
  const quizId = isEditing ? (params.action as string) : "";

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState<Quiz>({
    id: "",
    title: "",
    description: "",
    isMultipleChoice: false,
    createdAt: "",
    createdBy: "",
    updatedAt: "",
  });
  const [questions, setQuestions] = useState<QuizQuestionWithOptions[]>([]);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (isEditing && quizId) {
      fetchQuizData(quizId);
    }
  }, [isEditing, quizId]);

  async function fetchQuizData(id: string) {
    try {
      setLoading(true);

      // Use the API route instead of direct Supabase calls
      const response = await fetch(`/api/quizzes/${id}`);

      if (!response.ok) {
        throw new Error(`Error fetching quiz: ${response.statusText}`);
      }

      const quizData = await response.json();

      setQuiz({
        id: quizData.id,
        title: quizData.title,
        description: quizData.description,
        isMultipleChoice: quizData.isMultipleChoice,
        createdAt: quizData.createdAt,
        createdBy: quizData.createdBy,
        updatedAt: quizData.updatedAt,
      });

      setQuestions(quizData.quizQuestions);
    } catch (error) {
      console.error("Error fetching quiz data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);

      // Create the full quiz object with questions and options
      const quizToSave = {
        ...quiz,
        quizQuestions: questions,
      };

      let response;

      if (isEditing) {
        // Update existing quiz
        response = await fetch(`/api/quizzes/${quizId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(quizToSave),
        });
      } else {
        // Create new quiz
        response = await fetch("/api/quizzes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...quizToSave,
            createdBy: user?.id as string,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save quiz");
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
        orderIndex: questions.length,
        quizId: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        quizOptions: [
          {
            id: `temp-option-${Date.now()}`,
            questionId: "",
            text: "",
            isCorrect: true,
            orderIndex: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: `temp-option-${Date.now() + 1}`,
            text: "",
            isCorrect: false,
            orderIndex: 1,
            questionId: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
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
                      checked={quiz.isMultipleChoice || false}
                      onCheckedChange={(checked) =>
                        setQuiz({ ...quiz, isMultipleChoice: checked })
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
                              {question.quizOptions.map(
                                (option: QuizOption, oIndex: number) => (
                                  <div
                                    key={option.id}
                                    className="flex items-center gap-2"
                                  >
                                    <div className="flex-1">
                                      <Input
                                        value={option.text}
                                        onChange={(e) => {
                                          const newQuestions = [...questions];
                                          newQuestions[qIndex].quizOptions[
                                            oIndex
                                          ].text = e.target.value;
                                          setQuestions(newQuestions);
                                        }}
                                        placeholder={`Option ${oIndex + 1}`}
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={option.isCorrect || false}
                                        onCheckedChange={(checked) => {
                                          const newQuestions = [...questions];

                                          // For single choice, uncheck all other options
                                          if (
                                            !quiz.isMultipleChoice &&
                                            checked
                                          ) {
                                            newQuestions[
                                              qIndex
                                            ].quizOptions.forEach((opt, i) => {
                                              newQuestions[qIndex].quizOptions[
                                                i
                                              ].isCorrect = i === oIndex;
                                            });
                                          } else {
                                            newQuestions[qIndex].quizOptions[
                                              oIndex
                                            ].isCorrect = checked;
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
                                          newQuestions[qIndex].quizOptions =
                                            newQuestions[
                                              qIndex
                                            ].quizOptions.filter(
                                              (_, i) => i !== oIndex
                                            );
                                          setQuestions(newQuestions);
                                        }}
                                        disabled={
                                          question.quizOptions.length <= 2
                                        }
                                      >
                                        <Trash size={16} />
                                      </Button>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                const newQuestions = [...questions];
                                newQuestions[qIndex].quizOptions.push({
                                  id: `temp-option-${Date.now()}`,
                                  text: "",
                                  isCorrect: false,
                                  orderIndex:
                                    newQuestions[qIndex].quizOptions.length,
                                  questionId: question.id,
                                  createdAt: new Date().toISOString(),
                                  updatedAt: new Date().toISOString(),
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
