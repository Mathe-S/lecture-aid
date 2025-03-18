"use client";

import { useAuth } from "@/context/AuthContext";
import { useAssignments } from "@/hooks/useAssignments";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssignmentsPage() {
  const { role } = useAuth();
  const { data: assignments, isLoading } = useAssignments();

  const isLecturerOrAdmin = role === "lecturer" || role === "admin";

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Assignments</h1>
        {isLecturerOrAdmin && (
          <Link href="/assignments/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-28" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : assignments?.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-slate-500">No assignments found.</p>
          {isLecturerOrAdmin && (
            <Link href="/assignments/create">
              <Button className="mt-4">Create your first assignment</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {assignments?.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <CardTitle>{assignment.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {assignment.description && (
                  <p className="text-slate-600">{assignment.description}</p>
                )}
                {assignment.dueDate && (
                  <div className="flex items-center mt-2 text-sm text-slate-500">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Due: {format(new Date(assignment.dueDate), "PPP")}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Link href={`/assignments/${assignment.id}`}>
                  <Button variant="outline">
                    {role === "student" ? "Submit" : "View Details"}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
