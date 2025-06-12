"use client";

import { useEffect } from "react";
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
      Welcome to the comprehensive Encryptions and Devtools challenge! 
      
      This 5-step challenge simulates real-world development scenarios you&apos;ll encounter as a professional developer:

      🔓 Step 1: JWT Security Analysis
      Learn how JSON Web Tokens work in authentication systems. You&apos;ll decode production-style JWTs to understand how modern web applications handle user sessions securely.

      📂 Step 2: Repository Investigation  
      Master Git and GitHub workflows by finding hidden configuration files. This mirrors how developers locate API keys, configuration files, and documentation in team repositories.

      🔍 Step 3: Browser DevTools Mastery
      Use Chrome/Firefox developer tools to investigate network requests, examine DOM elements, and debug web applications - essential skills for frontend development and security testing.

      🌐 Step 4: API Interaction & Authentication
      Simulate real API interactions with proper authentication headers. Learn how modern applications communicate with backend services and handle API security.

      🔐 Step 5: Advanced Encryption Implementation
      Apply RSA encryption techniques used in production systems to secure sensitive data transmission between client and server.
      
      Each step builds upon the previous one and includes real code examples, best practices, and links to industry documentation.
    `,
    points: 50,
    estimatedTime: "45-60 minutes",
    steps: 5,
    isCompleted: false,
  },
};

export default function ChallengePage() {
  const params = useParams();
  const { user } = useAuth();
  const challengeId = params.challengeId as string;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("completed") === "true") {
        // Update the challenge as completed in localStorage
        if (user) {
          const savedProgress = localStorage.getItem(
            `challenges_progress_${user.id}`
          );
          if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            progress[challengeId] = { isCompleted: true, completionRate: 100 };
            localStorage.setItem(
              `challenges_progress_${user.id}`,
              JSON.stringify(progress)
            );
          } else {
            // Create new progress entry
            const newProgress = {
              [challengeId]: { isCompleted: true, completionRate: 100 },
            };
            localStorage.setItem(
              `challenges_progress_${user.id}`,
              JSON.stringify(newProgress)
            );
          }
        }
        // Clean up URL
        window.history.replaceState({}, "", `/challenges/${challengeId}`);
      }
    }
  }, [challengeId, user]);

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
                  <Link href={`/challenges/${challengeId}/challenge`}>
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    >
                      Start Challenge
                    </Button>
                  </Link>
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
                  <Link href="/">
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
