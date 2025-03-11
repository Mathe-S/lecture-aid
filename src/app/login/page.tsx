"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaGithub } from "react-icons/fa";

export default function LoginPage() {
  const { user, signInWithGitHub, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Use your GitHub account to access the platform
          </p>
        </div>

        <div className="mt-8">
          <div className="rounded-md shadow-sm">
            <Button
              onClick={signInWithGitHub}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isLoading}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <FaGithub className="h-5 w-5 text-gray-300 group-hover:text-gray-400" />
              </span>
              {isLoading ? "Loading..." : "Sign in with GitHub"}
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                No registration needed
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
