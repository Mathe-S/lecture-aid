"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Clock, Target, AlertCircle } from "lucide-react";
import Link from "next/link";

// For now, static challenge data - later from API/database
const challengeDetails = {
  "encryptions-and-devtools": {
    id: "encryptions-and-devtools",
    title: "Encryptions and Devtools",
    description:
      "Master encryption techniques through interactive command-line challenges. Each student receives unique commands leading to their personal final answer.",
    longDescription: `
      Welcome to the Encryptions and Devtools challenge! 
      
      In this challenge, you&apos;ll work through a series of 5 unique commands that will test your understanding of:
      • Basic encryption and decryption techniques
      • Developer tools and browser inspection
      • Command-line operations
      • Problem-solving skills
      
      Each step will unlock the next, leading you to your unique final answer. Your commands are personalized based on your user profile, ensuring a unique experience for every student.
    `,
    points: 50,
    estimatedTime: "30-45 minutes",
    steps: 5,
    isCompleted: false,
  },
};

export default function ChallengePage() {
  const params = useParams();
  const { user } = useAuth();
  const challengeId = params.challengeId as string;

  const challenge =
    challengeDetails[challengeId as keyof typeof challengeDetails];

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Challenge Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The challenge you&apos;re looking for doesn&apos;t exist or has
              been removed.
            </p>
            <Link href="/challenges">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Challenges
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link href="/challenges">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Challenges
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Challenge Header */}
          <Card className="mb-8 bg-white shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold mb-2">
                    {challenge.title}
                  </CardTitle>
                  <p className="text-purple-100 text-lg">
                    {challenge.description}
                  </p>
                </div>
                <div className="text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-2" />
                  <Badge
                    variant="secondary"
                    className="bg-white text-purple-700 font-semibold"
                  >
                    {challenge.points} Points
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="flex justify-center items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold text-gray-900">
                      {challenge.estimatedTime}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">Estimated Time</p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-green-500" />
                    <span className="font-semibold text-gray-900">
                      {challenge.steps} Steps
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">Total Steps</p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold text-gray-900">
                      Beginner
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">Difficulty</p>
                </div>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  About This Challenge
                </h3>
                <div className="text-gray-700 whitespace-pre-line">
                  {challenge.longDescription}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Challenge Content */}
          <Card className="bg-white shadow-xl border-0">
            <CardContent className="p-8">
              {user ? (
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Ready to Start?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Your unique challenge commands will be generated based on
                    your profile. Each step will unlock the next one.
                  </p>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    onClick={() => {
                      // TODO: This will redirect to the actual challenge interface
                      alert(
                        "Challenge interface coming soon! This will start your personalized challenge."
                      );
                    }}
                  >
                    Start Challenge
                  </Button>

                  {/* Placeholder for future challenge steps */}
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Coming Soon:</strong> Interactive challenge
                      interface with step-by-step guidance, command execution,
                      and real-time feedback.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Sign In Required
                  </h3>
                  <p className="text-gray-600 mb-6">
                    You need to be signed in to access personalized challenges
                    and track your progress.
                  </p>
                  <Link href="/auth">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    >
                      Sign In to Continue
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
