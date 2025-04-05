"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash, Save, ArrowLeft, Loader2 } from "lucide-react";
import { Quiz, QuizOption, QuizQuestionWithOptions } from "@/db/drizzle/schema";
import { useQuiz, useCreateQuiz, useUpdateQuiz } from "@/hooks/useQuizzes";
import RichTextEditor from "@/components/RichTextEditor";

export default function QuizFormPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const isEditing = params.action !== "new";
  const quizId = isEditing ? (params.action as string) : "";

  // React Query hooks
  const { data: quizData, isLoading: isLoadingQuiz } = useQuiz(quizId);
  const createQuizMutation = useCreateQuiz();
  const updateQuizMutation = useUpdateQuiz(quizId);

  const [quiz, setQuiz] = useState<Quiz>({
    id: "",
    title: "",
    description: "",
    grade: 10, // Default 1.0 point
    createdAt: "",
    createdBy: "",
    updatedAt: "",
  });
  const [questions, setQuestions] = useState<QuizQuestionWithOptions[]>([]);
  const [activeTab, setActiveTab] = useState("details");

  // Populate form when quiz data is loaded
  useEffect(() => {
    if (quizData) {
      setQuiz({
        id: quizData.id,
        title: quizData.title,
        description: quizData.description,
        grade: quizData.grade || 0,
        createdAt: quizData.createdAt,
        createdBy: quizData.createdBy,
        updatedAt: quizData.updatedAt,
      });
      setQuestions(quizData.quizQuestions);
    }
  }, [quizData]);

  async function handleSave() {
    const quizToSave = {
      ...quiz,
      quizQuestions: questions,
    };

    if (isEditing) {
      updateQuizMutation.mutate(quizToSave);
    } else {
      createQuizMutation.mutate({
        ...quizToSave,
        createdBy: user?.id as string,
      });
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

  const isLoading = isLoadingQuiz;
  const isSaving = createQuizMutation.isPending || updateQuizMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-2">Loading quiz data...</p>
      </div>
    );
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

                  <div>
                    <Label htmlFor="grade">Grade Points</Label>
                    <Input
                      id="grade"
                      type="number"
                      min="0"
                      step="0.1"
                      value={(quiz.grade / 10).toFixed(1)}
                      onChange={(e) => {
                        // Convert from decimal (e.g. 1.5) to integer (15)
                        const decimalValue = parseFloat(e.target.value) || 0;
                        const intValue = Math.round(decimalValue * 10);
                        setQuiz({ ...quiz, grade: intValue });
                      }}
                      placeholder="Enter grade points (e.g., 1.5)"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      How many points this quiz is worth. Use 0 for practice
                      quizzes that don&apos;t count towards the grade. You can
                      use decimal values like 1.5, 2.5, etc.
                    </p>
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
                            <RichTextEditor
                              id={`question-${qIndex}`}
                              value={question.text}
                              onChange={(content) => {
                                const newQuestions = [...questions];
                                newQuestions[qIndex].text = content;
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

                                          const isMultipleChoice =
                                            newQuestions[
                                              qIndex
                                            ].quizOptions.filter(
                                              (o, i) =>
                                                i !== oIndex && o.isCorrect
                                            ).length > 0;

                                          if (!isMultipleChoice && checked) {
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
              disabled={isSaving || !quiz.title}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
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
