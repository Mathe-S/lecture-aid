"use client";

import { useState, useEffect, useMemo } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/tokyo-night-dark.css";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle,
  BookOpen,
  Key,
  Trophy,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { CourseStep } from "@/components/challenges/course-overview/CourseStep";
import { generateEncryptedProgressKey } from "@/lib/course-overview-utils";

interface StepProgress {
  [stepId: string]: {
    completed: boolean;
    answer: string;
    completedAt: string;
  };
}

interface ChallengeProgress {
  steps: StepProgress;
  startedAt: string;
  lastUpdated: string;
}

const courseSteps = [
  { id: "static-checking", title: "Static Checking", number: 1 },
  { id: "testing", title: "Testing", number: 2 },
  { id: "code-review", title: "Code Review", number: 3 },
  { id: "specifications", title: "Specifications", number: 4 },
  {
    id: "designing-specifications",
    title: "Designing Specifications",
    number: 5,
  },
  { id: "abstract-data-types", title: "Abstract Data Types", number: 6 },
  {
    id: "abstraction-functions-rep-invariants",
    title: "Abstraction Functions & Rep Invariants",
    number: 7,
  },
  { id: "interfaces-subtyping", title: "Interfaces & Subtyping", number: 8 },
  { id: "functional-programming", title: "Functional Programming", number: 9 },
  { id: "equality", title: "Equality", number: 10 },
  { id: "recursive-data-types", title: "Recursive Data Types", number: 11 },
  { id: "grammars-parsing", title: "Grammars & Parsing", number: 12 },
  { id: "debugging", title: "Debugging", number: 13 },
  { id: "concurrency", title: "Concurrency", number: 14 },
  { id: "promises", title: "Promises", number: 15 },
  { id: "mutual-exclusion", title: "Mutual Exclusion", number: 16 },
  {
    id: "callbacks-gui",
    title: "Callbacks & Graphical User Interfaces",
    number: 17,
  },
  {
    id: "message-passing-networking",
    title: "Message-Passing & Networking",
    number: 18,
  },
  { id: "little-languages", title: "Little Languages", number: 19 },
  {
    id: "software-construction-review",
    title: "Software Construction Review",
    number: 20,
  },
];

export default function CourseOverviewChallengePage() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState<ChallengeProgress>({
    steps: {},
    startedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  });

  const userData = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email || "",
      name: user.user_metadata?.name || user.email || "User",
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      const savedProgress = localStorage.getItem(
        `challenge_course-overview_${user.id}`
      );
      if (savedProgress) {
        setProgress(JSON.parse(savedProgress));
      } else {
        const initialProgress: ChallengeProgress = {
          steps: {},
          startedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        };
        setProgress(initialProgress);
        localStorage.setItem(
          `challenge_course-overview_${user.id}`,
          JSON.stringify(initialProgress)
        );
      }
    }
  }, [user]);

  useEffect(() => {
    // This effect will run whenever the current step changes,
    // ensuring that new code blocks are highlighted.
    hljs.highlightAll();
  }, [currentStep]);

  const saveProgress = (updatedProgress: ChallengeProgress) => {
    if (user) {
      const progressToSave = {
        ...updatedProgress,
        lastUpdated: new Date().toISOString(),
      };
      setProgress(progressToSave);
      localStorage.setItem(
        `challenge_course-overview_${user.id}`,
        JSON.stringify(progressToSave)
      );
    }
  };

  const handleStepComplete = (stepId: string, answer: string) => {
    const updatedProgress = {
      ...progress,
      steps: {
        ...progress.steps,
        [stepId]: {
          completed: true,
          answer,
          completedAt: new Date().toISOString(),
        },
      },
    };
    saveProgress(updatedProgress);
  };

  const completedSteps = Object.keys(progress.steps).length;
  const progressPercentage = (completedSteps / courseSteps.length) * 100;
  const encryptedKey = userData
    ? generateEncryptedProgressKey(userData, completedSteps)
    : "";

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-4">
              Please sign in to access the Course Overview Challenge.
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/challenges/course-overview"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Challenge Details
          </Link>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Introduction to Software Engineering
          </Badge>
        </div>

        {/* Progress Header */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Course Overview Challenge
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">50 Points</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">60 min</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  Progress: {completedSteps} / {courseSteps.length} steps
                  completed
                </span>
                <span>{progressPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Step Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Course Topics</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {courseSteps.map((step, index) => (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(index)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        currentStep === index
                          ? "bg-blue-100 border-2 border-blue-300"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                            progress.steps[step.id]?.completed
                              ? "bg-green-500 text-white"
                              : currentStep === index
                              ? "bg-blue-500 text-white"
                              : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          {progress.steps[step.id]?.completed ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            step.number
                          )}
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            currentStep === index
                              ? "text-blue-700"
                              : "text-gray-700"
                          }`}
                        >
                          {step.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <CourseStep
              step={courseSteps[currentStep]}
              isCompleted={
                !!progress.steps[courseSteps[currentStep].id]?.completed
              }
              onComplete={handleStepComplete}
              onNext={() => {
                if (currentStep < courseSteps.length - 1) {
                  setCurrentStep(currentStep + 1);
                }
              }}
              onPrevious={() => {
                if (currentStep > 0) {
                  setCurrentStep(currentStep - 1);
                }
              }}
              hasNext={currentStep < courseSteps.length - 1}
              hasPrevious={currentStep > 0}
            />
          </div>
        </div>

        {/* Encrypted Progress Key */}
        {completedSteps > 0 && (
          <Card className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Key className="h-5 w-5" />
                Your Progress Key
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700 mb-2">
                This encrypted key represents your progress ({completedSteps}{" "}
                steps completed):
              </p>
              <div className="bg-white p-3 rounded-lg border border-green-200">
                <code className="text-sm font-mono text-gray-800 break-all">
                  {encryptedKey}
                </code>
              </div>
              <p className="text-xs text-green-600 mt-2">
                This key is unique to you and updates as you complete more
                steps.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
