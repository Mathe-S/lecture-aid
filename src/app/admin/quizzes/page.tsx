"use client";

import QuizList from "@/components/QuizList";
import RoleGuard from "@/components/RoleGuard";

export default function AdminQuizzesPage() {
  return (
    <RoleGuard
      allowedRoles={["admin"]}
      fallback={<div>You do not have permission to view this page.</div>}
    >
      <QuizList
        isAdmin={true}
        title="Quiz Management"
        emptyMessage="No quizzes found. Create your first quiz!"
      />
    </RoleGuard>
  );
}
