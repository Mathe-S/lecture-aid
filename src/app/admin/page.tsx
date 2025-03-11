"use client";

import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import { redirect } from "next/navigation";

export default function AdminPage() {
  const { user, isLoading } = useAuth();

  // Redirect if not authenticated
  if (!isLoading && !user) {
    redirect("/");
  }

  return (
    <RoleGuard
      allowedRoles={["admin"]}
      fallback={<div>You do not have permission to view this page.</div>}
    >
      <div>
        <h1>Admin Dashboard</h1>
        <p>Welcome to the admin dashboard. Only admins can see this content.</p>
      </div>
    </RoleGuard>
  );
}
