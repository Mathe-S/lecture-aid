"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/Button";
import {
  User,
  Mail,
  Shield,
  Github,
  Loader2,
  Edit,
  Check,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { updateUserProfileAction } from "../actions/auth";

export default function DashboardPage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();
  const [isEditingName, setIsEditingName] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }

    if (user) {
      // Initialize name fields from user data
      const fullName =
        user.user_metadata?.full_name || user.user_metadata?.name || "";
      const nameParts = fullName.split(" ");
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
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

  const handleSaveName = async () => {
    if (!firstName.trim()) return;

    setIsSaving(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      setIsEditingName(false);
      await updateUserProfileAction({
        id: user.id,
        fullName: fullName,
      });
    } catch (error) {
      console.error("Failed to update name:", error);
    } finally {
      setIsSaving(false);
    }
  };

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
                  {isEditingName ? (
                    <div className="mt-1 space-y-2">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="First name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={handleSaveName}
                          disabled={isSaving || !firstName.trim()}
                          className="flex items-center"
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingName(false)}
                          className="flex items-center"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <p className="text-sm text-slate-500">{userName}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingName(true)}
                        className="ml-2 h-6 w-6 p-0"
                      >
                        <Edit className="h-3.5 w-3.5 text-slate-400" />
                      </Button>
                    </div>
                  )}
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
