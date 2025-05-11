"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAssignment } from "@/hooks/useAssignments";
import { AssignmentForm } from "@/components/assignment-form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AssignmentWithCustomFields } from "@/db/drizzle/schema";

export default function EditAssignmentPage() {
  const params = useParams();
  const { user, role, isLoading } = useAuth();
  const router = useRouter();
  const assignmentId = params.id as string;
  const {
    data: assignment,
    isLoading: assignmentLoading,
    error,
  } = useAssignment(assignmentId);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (role !== "lecturer" && role !== "admin") {
        router.push("/assignments");
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, role, isLoading, router]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto mt-8 px-4">
        <div className="rounded-lg border p-8 shadow-sm">
          <h1 className="mb-4 text-2xl font-bold">Error</h1>
          <p className="text-red-500">Failed to load assignment details.</p>
          <Link href="/assignments" className="mt-4 inline-block">
            <Button variant="outline">Back to Assignments</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (assignmentLoading) {
    return (
      <div className="container mx-auto mt-8 px-4">
        <div className="rounded-lg border p-8 shadow-sm">
          <h1 className="mb-4 text-2xl font-bold">Edit Assignment</h1>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container mx-auto mt-8 px-4">
        <div className="rounded-lg border p-8 shadow-sm">
          <h1 className="mb-4 text-2xl font-bold">Assignment Not Found</h1>
          <p>The assignment you are trying to edit does not exist.</p>
          <Link href="/assignments" className="mt-4 inline-block">
            <Button variant="outline">Back to Assignments</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-8 px-4">
      <div className="rounded-lg border p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Assignment</h1>
          <Link href="/assignments">
            <Button variant="outline">Back to Assignments</Button>
          </Link>
        </div>
        <AssignmentForm
          assignmentData={assignment as AssignmentWithCustomFields}
        />
      </div>
    </div>
  );
}
