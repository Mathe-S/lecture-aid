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

export async function updateUserProfileAction(profileData: any) {
  try {
    await updateUserProfile(profileData);
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error: "Failed to update profile" };
  }
}
