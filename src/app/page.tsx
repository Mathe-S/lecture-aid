"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Github } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  const { user, signInWithGitHub, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  // If user is logged in, don't render the home page content
  // as we're redirecting to dashboard
  if (user) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="max-w-3xl w-full text-center space-y-8 mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900">
          Welcome to Lecture+
        </h1>

        <p className="text-xl text-slate-700 max-w-2xl mx-auto">
          A collaborative platform for students, lecturers, and administrators
          to manage educational resources.
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Sign In
          </CardTitle>
          <CardDescription className="text-center">
            Use your GitHub account to access the platform
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button
            variant="outline"
            onClick={signInWithGitHub}
            className="w-full py-6 border-slate-300 hover:bg-slate-100"
            disabled={isLoading}
          >
            <Github className="mr-2 h-5 w-5" />
            {isLoading ? "Loading..." : "Sign in with GitHub"}
          </Button>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-slate-500">
            No registration needed - just sign in with GitHub
          </div>
        </CardFooter>
      </Card>

      <div className="pt-8 text-slate-600">
        <p>Available roles: Admin, Lecturer, Student</p>
      </div>

      <Toaster />
    </div>
  );
}
