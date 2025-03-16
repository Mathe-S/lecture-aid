"use client";

import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/db/drizzle/schema";
import { ReactNode } from "react";

type RoleGuardProps = {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
};

export default function RoleGuard({
  allowedRoles,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
