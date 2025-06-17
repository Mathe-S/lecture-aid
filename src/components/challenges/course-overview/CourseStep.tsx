"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { getStepContent } from "@/lib/course-overview-utils";
import { InteractiveQuestion, Question } from "./InteractiveQuestion";

interface CourseStepProps {
  step: {
    id: string;
    title: string;
    number: number;
  };
  isCompleted: boolean;
  onComplete: (stepId: string, answer: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function CourseStep({
  step,
  isCompleted,
  onComplete,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}: CourseStepProps) {
  const [showHints, setShowHints] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);

  const stepContent = getStepContent(step.id);

  const showNextHint = () => {
    if (stepContent && currentHint < stepContent.hints.length - 1) {
      setCurrentHint(currentHint + 1);
    }
  };

  if (!stepContent) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Content Not Available</h3>
          <p className="text-gray-600">
            This step&apos;s content is still being prepared. Please check back
            later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-blue-500 text-white"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  step.number
                )}
              </div>
              <div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {stepContent.description}
                </p>
              </div>
            </div>
            {isCompleted && (
              <Badge variant="default" className="bg-green-500">
                Completed
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Step Content */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Learning Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: stepContent.content }}
          />
        </CardContent>
      </Card>

      {/* Interactive Question */}
      {stepContent.question && (
        <InteractiveQuestion
          question={stepContent.question as Question}
          onAnswer={(isCorrect, userAnswer) => {
            if (isCorrect) {
              onComplete(step.id, JSON.stringify(userAnswer));
            }
          }}
          showResult={isCompleted}
          isCorrect={isCompleted}
        />
      )}

      {/* Hints Section */}
      {!isCompleted && (
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!showHints ? (
              <Button
                variant="outline"
                onClick={() => setShowHints(true)}
                className="w-full"
              >
                Show Hints
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800">
                    <strong>Hint {currentHint + 1}:</strong>{" "}
                    {stepContent.hints[currentHint]}
                  </p>
                </div>

                {currentHint < stepContent.hints.length - 1 && (
                  <Button variant="outline" onClick={showNextHint} size="sm">
                    Show Next Hint ({currentHint + 2}/{stepContent.hints.length}
                    )
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous Step
        </Button>

        <Button
          onClick={onNext}
          disabled={!hasNext}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
        >
          Next Step
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
