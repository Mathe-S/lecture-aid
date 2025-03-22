"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, ExternalLink, Pencil } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

type SubmissionWithProfile = {
  id: string;
  assignmentId: string;
  userId: string;
  repositoryUrl: string;
  repositoryName: string | null;
  feedback: string | null;
  grade: number | null;
  submittedAt: string;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
};

export const SubmissionsColumns: ColumnDef<SubmissionWithProfile>[] = [
  {
    accessorKey: "profiles.full_name",
    header: "Student",
    cell: ({ row }) => {
      const fullName = row.getValue("profiles.full_name") as string | null;
      const email = row.original.profiles?.email;

      return (
        <div>
          <div className="font-medium">{fullName || "Unnamed Student"}</div>
          {email && <div className="text-xs text-slate-500">{email}</div>}
        </div>
      );
    },
  },
  {
    accessorKey: "repositoryName",
    header: "Repository",
    cell: ({ row }) => {
      const repoName = row.getValue("repositoryName") as string | null;
      const repoUrl = row.original.repositoryUrl;

      return (
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 hover:underline"
        >
          <Github className="h-4 w-4 mr-1" />
          {repoName || repoUrl}
          <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      );
    },
  },
  {
    accessorKey: "submittedAt",
    header: "Submitted",
    cell: ({ row }) => {
      const date = new Date(row.getValue("submittedAt") as string);
      return <div className="text-sm">{format(date, "PPP")}</div>;
    },
  },
  {
    accessorKey: "grade",
    header: "Grade",
    cell: ({ row }) => {
      const grade = row.getValue("grade") as number | null;

      return grade !== null ? (
        <Badge variant="outline" className="font-medium">
          {grade}
        </Badge>
      ) : (
        <Badge variant="outline" className="text-slate-500">
          Not graded
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const submissionId = row.original.id;

      return (
        <Link href={`/assignments/grade/${submissionId}`}>
          <Button size="sm" variant="ghost">
            <Pencil className="h-4 w-4 mr-1" />
            Grade
          </Button>
        </Link>
      );
    },
  },
];
