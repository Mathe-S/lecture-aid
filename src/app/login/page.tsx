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

export default function LoginPage() {
  const { user, signInWithGitHub, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-4">
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

      <Toaster />
    </div>
  );
}
