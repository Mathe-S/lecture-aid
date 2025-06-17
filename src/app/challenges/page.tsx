"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Play, CheckCircle, Lock, Star, Zap } from "lucide-react";
import Link from "next/link";

interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  isCompleted: boolean;
  isLocked: boolean;
  completionRate: number;
}

// For now, we'll have static data. Later this can come from an API
const challengesData: Challenge[] = [
  {
    id: "encryptions-and-devtools",
    title: "Encryptions and Devtools",
    description:
      "Master encryption techniques through interactive command-line challenges. Each student receives unique commands leading to their personal final answer.",
    points: 50,
    isCompleted: false,
    isLocked: false,
    completionRate: 0,
  },
  {
    id: "course-overview",
    title: "Course Overview",
    description:
      "Comprehensive review of Introduction To Software Engineering. 20 in-depth topics covering everything from static checking to little languages.",
    points: 50,
    isCompleted: false,
    isLocked: false,
    completionRate: 0,
  },
  // Placeholder for future challenges
  {
    id: "coming-soon-1",
    title: "Coming Soon",
    description: "More exciting challenges are on the way!",
    points: 0,
    isCompleted: false,
    isLocked: true,
    completionRate: 0,
  },
];

export default function ChallengesPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>(challengesData);
  const [totalPoints, setTotalPoints] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState(0);

  useEffect(() => {
    // Calculate stats
    const completed = challenges.filter((c) => c.isCompleted).length;
    const points = challenges
      .filter((c) => c.isCompleted)
      .reduce((sum, c) => sum + c.points, 0);

    setCompletedChallenges(completed);
    setTotalPoints(points);

    // TODO: Load completion status from database/API
    // For now, we'll use localStorage as a simple solution
    if (user) {
      const savedProgress = localStorage.getItem(
        `challenges_progress_${user.id}`
      );
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        setChallenges(
          challenges.map((challenge) => ({
            ...challenge,
            isCompleted: progress[challenge.id]?.isCompleted || false,
            completionRate: progress[challenge.id]?.completionRate || 0,
          }))
        );
      }
    }
  }, [user, challenges]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Code Challenges
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Test your skills, earn points, and master programming concepts
            through interactive challenges
          </p>
        </div>

        {/* Stats Bar */}
        {user && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex justify-center items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="text-2xl font-bold text-gray-900">
                    {totalPoints}
                  </span>
                </div>
                <p className="text-gray-600">Total Points</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold text-gray-900">
                    {completedChallenges}
                  </span>
                </div>
                <p className="text-gray-600">Completed</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-purple-500" />
                  <span className="text-2xl font-bold text-gray-900">
                    {challenges.filter((c) => !c.isLocked).length}
                  </span>
                </div>
                <p className="text-gray-600">Available</p>
              </div>
            </div>
          </div>
        )}

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <Card
              key={challenge.id}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                challenge.isLocked
                  ? "opacity-60 cursor-not-allowed"
                  : "cursor-pointer hover:shadow-2xl"
              } ${
                challenge.isCompleted
                  ? "ring-2 ring-green-200 bg-gradient-to-br from-green-50 to-emerald-50"
                  : "bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50"
              }`}
            >
              {/* Completion Badge */}
              {challenge.isCompleted && (
                <div className="absolute top-4 right-4 z-10">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              )}

              {/* Lock Overlay */}
              {challenge.isLocked && (
                <div className="absolute inset-0 bg-gray-100 bg-opacity-90 flex items-center justify-center z-10">
                  <Lock className="h-12 w-12 text-gray-400" />
                </div>
              )}

              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold text-gray-900 mb-2">
                  {challenge.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={`${
                      challenge.isCompleted
                        ? "bg-green-100 text-green-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {challenge.points > 0
                      ? `${challenge.points} Points`
                      : "Coming Soon"}
                  </Badge>
                  {challenge.isCompleted && (
                    <Badge variant="default" className="bg-green-500">
                      Completed
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-gray-600 mb-4 text-ellipsis overflow-hidden">
                  {challenge.description}
                </p>

                {/* Progress Bar (if challenge has been started) */}
                {challenge.completionRate > 0 && !challenge.isCompleted && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{challenge.completionRate}%</span>
                    </div>
                    <Progress
                      value={challenge.completionRate}
                      className="h-2"
                    />
                  </div>
                )}

                {/* Action Button */}
                {!challenge.isLocked && challenge.points > 0 && (
                  <Link href={`/challenges/${challenge.id}`}>
                    <Button
                      className={`w-full ${
                        challenge.isCompleted
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                      }`}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {challenge.isCompleted
                        ? "View Challenge"
                        : "Start Challenge"}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action for Non-logged Users */}
        {!user && (
          <div className="text-center mt-12 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="mb-4">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Ready to Start Your Journey?
              </h3>
              <p className="text-gray-600 mb-6">
                Sign in to track your progress, earn points, and unlock
                achievements!
              </p>
              <Link href="/">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  Sign In to Start
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
