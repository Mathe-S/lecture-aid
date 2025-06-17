"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Play,
  CheckCircle,
  Clock,
  Trophy,
  Users,
  ArrowLeft,
  Brain,
} from "lucide-react";
import Link from "next/link";

const courseTopics = [
  "Static Checking",
  "Testing",
  "Code Review",
  "Specifications",
  "Designing Specifications",
  "Abstract Data Types",
  "Abstraction Functions & Rep Invariants",
  "Interfaces & Subtyping",
  "Functional Programming",
  "Equality",
  "Recursive Data Types",
  "Grammars & Parsing",
  "Debugging",
  "Concurrency",
  "Promises",
  "Mutual Exclusion",
  "Callbacks & Graphical User Interfaces",
  "Message-Passing & Networking",
  "Little Languages",
];

export default function CourseOverviewChallenge() {
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState(0);
  const [totalSteps] = useState(20);

  useEffect(() => {
    if (user) {
      const savedProgress = localStorage.getItem(
        `challenge_course-overview_${user.id}`
      );
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        setCompletedSteps(Object.keys(progress.steps || {}).length);
      }
    }
  }, [user]);

  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Back Button */}
        <Link
          href="/challenges"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Challenges
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Course Overview Challenge
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Introduction to Software Engineering concepts through 20
            comprehensive topics. Test your understanding with in-depth problems
            and real-world scenarios.
          </p>
        </div>

        {/* Challenge Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Brain className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {totalSteps}
              </div>
              <div className="text-sm text-gray-600">Topics</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">50</div>
              <div className="text-sm text-gray-600">Points</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">60</div>
              <div className="text-sm text-gray-600">Minutes</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">Advanced</div>
              <div className="text-sm text-gray-600">Level</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Section */}
        {user && completedSteps > 0 && (
          <Card className="mb-8 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Completed Steps</span>
                <span>
                  {completedSteps} / {totalSteps}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3 mb-2" />
              <p className="text-sm text-gray-600">
                {progressPercentage.toFixed(1)}% Complete
              </p>
            </CardContent>
          </Card>
        )}

        {/* Challenge Description */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Challenge Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              This comprehensive challenge covers all major topics from MIT
              6.102 Software Construction. Each step focuses on a specific
              concept with in-depth explanations and complex problem-solving
              scenarios.
            </p>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                What You&apos;ll Learn:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Advanced software construction principles and practices
                </li>
                <li>• Static analysis, testing, and code review techniques</li>
                <li>
                  • Abstract data types and functional programming concepts
                </li>
                <li>
                  • Concurrency, networking, and language design principles
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="font-semibold text-amber-900 mb-2">
                Challenge Features:
              </h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>
                  • All 20 steps available from the start - no sequential
                  unlocking
                </li>
                <li>• Answer verification for each step</li>
                <li>• Unique encrypted progress key for each student</li>
                <li>• Real-world scenarios and complex problem solving</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Topics Preview */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Course Topics ({totalSteps} Steps)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {courseTopics.map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="text-gray-700 font-medium">{topic}</span>
                  {user && completedSteps > index && (
                    <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          {user ? (
            <Link href="/challenges/course-overview/challenge">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 px-8"
              >
                <Play className="h-5 w-5 mr-2" />
                {completedSteps > 0 ? "Continue Challenge" : "Start Challenge"}
              </Button>
            </Link>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg">
              <p className="text-gray-600 mb-4">
                Sign in to start the challenge and track your progress!
              </p>
              <Link href="/">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  Sign In to Start
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
