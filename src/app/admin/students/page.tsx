"use client";

import { useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { useStudents } from "@/hooks/useStudents";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  User,
  Mail,
  Calendar,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { formatDistance } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function AdminStudentsPage() {
  const { data: students, isLoading } = useStudents();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <RoleGuard
      allowedRoles={["admin"]}
      fallback={<div>You do not have permission to view this page.</div>}
    >
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-8">
          <Link href="/admin" className="mr-4">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Student Profiles</h1>
            <p className="text-slate-500">View and manage student profiles</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students && students.length === 0 ? (
            <p className="col-span-full text-center py-8 text-slate-500">
              No students found
            </p>
          ) : (
            students?.map((student: any) => (
              <Card
                key={student.id}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={student.profile?.avatarUrl || ""}
                        alt={student.profile?.fullName || "Student"}
                      />
                      <AvatarFallback>
                        {(student.profile?.fullName || "S")
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {student.profile?.fullName || "Unnamed Student"}
                      </CardTitle>
                      <CardDescription>
                        {student.profile?.email || "No email"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-sm text-slate-500">
                    <p>
                      Joined{" "}
                      {student.createdAt
                        ? formatDistance(
                            new Date(student.createdAt),
                            new Date(),
                            { addSuffix: true }
                          )
                        : "Unknown"}
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedStudent(student);
                      setIsDialogOpen(true);
                    }}
                  >
                    View Profile
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedStudent && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">Student Profile</DialogTitle>
                  <DialogDescription>
                    Detailed information about this student
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={selectedStudent.profile?.avatarUrl || ""}
                        alt={selectedStudent.profile?.fullName || "Student"}
                      />
                      <AvatarFallback className="text-lg">
                        {(selectedStudent.profile?.fullName || "S")
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-2 flex-1">
                      <h2 className="text-2xl font-bold">
                        {selectedStudent.profile?.fullName || "Unnamed Student"}
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-blue-50">
                          Student
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">
                            {selectedStudent.profile?.email ||
                              "No email provided"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Account Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">
                            ID: {selectedStudent.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">
                            Joined{" "}
                            {selectedStudent.createdAt
                              ? new Date(
                                  selectedStudent.createdAt
                                ).toLocaleDateString()
                              : "Unknown"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Student Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/api/users/${selectedStudent.id}/submissions`}
                          target="_blank"
                        >
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Submissions
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
