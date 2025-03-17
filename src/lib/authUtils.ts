import db from "@/db";
import { userRoles } from "@/db/drizzle/schema";
import { eq } from "drizzle-orm";
import { supabaseForServer } from "@/utils/supabase/server";

/**
 * Get the authenticated user and their role
 * @returns An object containing the user and their role
 */
export async function getAuthenticatedUser() {
  try {
    const supabase = await supabaseForServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { user: null, role: null };
    }

    // Get the user's role from the database
    const userRole = await db.query.userRoles.findFirst({
      where: eq(userRoles.id, user.id),
    });

    return {
      user,
      role: userRole?.role || null,
    };
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return { user: null, role: null };
  }
}

/**
 * Check if the authenticated user has a specific role
 * @param requiredRole The role required to pass the check
 * @returns An object with success status and user data if successful
 */
export async function checkUserRole(requiredRole: string) {
  const { user, role } = await getAuthenticatedUser();

  if (!user) {
    return {
      success: false,
      error: "No authenticated user found",
    };
  }

  if (role !== requiredRole) {
    return {
      success: false,
      error: `Only users with ${requiredRole} role can perform this action`,
    };
  }

  return {
    success: true,
    user,
    role,
  };
}

/**
 * Check if the authenticated user is an admin
 * @returns An object with success status and user data if user is admin
 */
export async function checkAdminRole() {
  return checkUserRole("admin");
}
