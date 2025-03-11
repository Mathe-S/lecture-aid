"use client";

import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useEffect } from "react";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [isLoading, user, router]);

  const adminModules = [
    {
      title: "Quiz Management",
      description:
        "Create and manage quizzes with single or multiple choice questions",
      icon: <FileText className="h-8 w-8 text-primary" />,
      href: "/admin/quizzes",
    },
    // Add other admin modules here
  ];

  if (isLoading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <RoleGuard
      allowedRoles={["admin"]}
      fallback={<div>You do not have permission to view this page.</div>}
    >
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <p className="mb-8">
          Welcome to the admin dashboard. Manage your application from here.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adminModules.map((module, index) => (
            <Link href={module.href} key={index} className="block">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    {module.icon}
                    <CardTitle>{module.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{module.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </RoleGuard>
  );
}
