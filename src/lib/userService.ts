import { eq } from "drizzle-orm";
import db from "@/db";
import { userRoles, profiles } from "@/db/drizzle/schema";
import { supabaseForServer } from "@/utils/supabase/server";

/**
 * Get a user's role from the database
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const userRole = await db.query.userRoles.findFirst({
      where: eq(userRoles.id, userId),
      columns: {
        role: true,
      },
    });

    return userRole?.role || null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    throw error;
  }
}

/**
 * Update a user's profile in the database and Supabase auth metadata
 */
export async function updateUserProfile(profileData: {
  id: string;
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  updatedAt?: string;
}) {
  try {
    const { id, ...data } = profileData;

    const supabase = await supabaseForServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not found");
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: data.fullName,
        },
      });

      if (error) {
        console.error("Error updating Supabase user metadata:", error);
      }
    } catch (supabaseError) {
      console.error("Failed to update Supabase user metadata:", supabaseError);
      // Continue with database update even if Supabase update fails
    }

    // Check if profile exists
    const existingProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, id),
    });

    if (existingProfile) {
      // Update existing profile
      await db
        .update(profiles)
        .set({
          email: data.email,
          fullName: data.fullName,
          avatarUrl: data.avatarUrl,
          updatedAt: data.updatedAt || new Date().toISOString(),
        })
        .where(eq(profiles.id, id));
    } else {
      // Create new profile
      await db.insert(profiles).values({
        id,
        email: data.email,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        createdAt: new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      });
    }

    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

/**
 * Create or update a user's role
 */
export async function setUserRole(userId: string, role: string) {
  try {
    const existingRole = await db.query.userRoles.findFirst({
      where: eq(userRoles.id, userId),
    });

    if (existingRole) {
      // Update existing role
      await db
        .update(userRoles)
        .set({
          role,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userRoles.id, userId));
    } else {
      // Create new role
      await db.insert(userRoles).values({
        id: userId,
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return true;
  } catch (error) {
    console.error("Error setting user role:", error);
    throw error;
  }
}
