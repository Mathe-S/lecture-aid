"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import RoleGuard from "@/components/RoleGuard";
import { AssignmentForm } from "@/components/assignment-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CreateAssignmentPage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  // If not authenticated or not lecturer/admin, redirect
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    } else if (!isLoading && user && role !== "lecturer" && role !== "admin") {
      router.push("/assignments");
    }
  }, [isLoading, user, role, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <RoleGuard
      allowedRoles={["lecturer", "admin"]}
      fallback={<div>You do not have permission to view this page.</div>}
    >
      <div className="container mx-auto py-10">
        <div className="mb-6">
          <Link href="/assignments">
            <Button variant="ghost" className="pl-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assignments
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Create New Assignment</h1>
          <AssignmentForm />
        </div>
      </div>
    </RoleGuard>
  );
}
