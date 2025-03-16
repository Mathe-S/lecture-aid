"use server";

import { getUserRole, updateUserProfile } from "@/lib/userService";

export async function fetchUserRole(userId: string) {
  try {
    return await getUserRole(userId);
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
}

export async function updateUserProfileAction(profileData: {
  id: string;
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
}) {
  try {
    await updateUserProfile(profileData);
    return {
      success: true,
      message: "Profile updated successfully",
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}
