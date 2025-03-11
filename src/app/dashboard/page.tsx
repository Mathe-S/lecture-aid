"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/Button";
import { User, Mail, Shield, Github, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-slate-400 mx-auto" />
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Get avatar URL from GitHub user metadata
  const avatarUrl = user.user_metadata?.avatar_url || "";
  const userName =
    user.user_metadata?.full_name || user.user_metadata?.name || "User";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{userName}</CardTitle>
                <CardDescription>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {role || "Loading role..."}
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4 text-sm">
                <User className="h-5 w-5 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Name</p>
                  <p className="text-sm text-slate-500">{userName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <Mail className="h-5 w-5 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Email</p>
                  <p className="text-sm text-slate-500">
                    {user.email || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <Shield className="h-5 w-5 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Role</p>
                  <p className="text-sm text-slate-500">
                    {role || "Not assigned"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <Github className="h-5 w-5 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">GitHub</p>
                  <p className="text-sm text-slate-500">
                    {user.user_metadata?.preferred_username ||
                      user.user_metadata?.user_name ||
                      "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <div className="h-5 w-5 text-slate-400 flex items-center justify-center">
                  ID
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">User ID</p>
                  <p className="text-sm text-slate-500 break-all">{user.id}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {role === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>
                Special actions available to administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/admin")}>
                Go to Admin Panel
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
