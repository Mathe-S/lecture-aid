import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { User, UserAttributes } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useState } from "react";

// Query key factory
export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
  session: () => [...authKeys.all, "session"] as const,
  role: (userId: string) => [...authKeys.user(), userId, "role"] as const,
};

// Auth API functions
const fetchUserRole = async (userId: string): Promise<string | null> => {
  try {
    const response = await fetch("/api/auth/user-role", {
      headers: {
        "x-user-id": userId,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch user role");

    const data = await response.json();
    return data.role;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
};

const updateProfile = async (profileData: any) => {
  const response = await fetch("/api/auth/update-profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    throw new Error("Failed to update profile");
  }

  return response.json();
};

// Get current session
export function useSession() {
  const supabase = createClient();

  return useQuery({
    queryKey: authKeys.session(),
    queryFn: async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        // Don't throw on missing session, just return null
        if (error && !error.message.includes("session")) {
          throw error;
        }
        return data.session;
      } catch (error) {
        console.error("Session fetch error:", error);
        return null;
      }
    },
  });
}

// Get current user
export function useUser() {
  const supabase = createClient();

  return useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        // Don't throw on auth errors, just return null
        if (error && !error.message.includes("auth")) {
          throw error;
        }
        return data.user;
      } catch (error) {
        console.error("User fetch error:", error);
        return null;
      }
    },
  });
}

// Get user role
export function useUserRole(userId?: string | null) {
  const { data: user } = useUser();
  const actualUserId = userId || user?.id;

  return useQuery({
    queryKey: authKeys.role(actualUserId || ""),
    queryFn: () => fetchUserRole(actualUserId || ""),
    enabled: !!actualUserId,
  });
}

// Use this hook to check if user is admin
export function useIsAdmin() {
  const { data: role } = useUserRole();
  return role === "admin";
}

// Sign in with GitHub
export function useGithubAuth() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  return {
    mutateAsync: async () => {
      try {
        setIsRedirecting(true);
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "github",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        if (data?.url) {
          window.location.href = data.url;
        }

        return data;
      } catch (error: any) {
        toast.error("Authentication Error", {
          description: error.message || "Failed to sign in with GitHub",
        });
        setIsRedirecting(false);
        throw error;
      }
    },
    isLoading: isRedirecting,
  };
}

// Sign out
export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        // Clear React Query cache
        queryClient.clear();

        // Call server-side sign out
        await fetch("/api/auth/signout", { method: "POST" });

        // Also sign out on client side
        const supabase = createClient();
        await supabase.auth.signOut();

        return true;
      } catch (error) {
        console.error("Sign out error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Hard reload the page instead of using Next.js router
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast.error("Sign Out Error", {
        description: error.message || "Failed to sign out",
      });

      // Even on error, force refresh
      window.location.href = "/";
    },
  });
}

// Update user profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (attributes: UserAttributes) => {
      // First update auth user
      const { data, error } = await supabase.auth.updateUser(attributes);
      if (error) throw error;

      // Then update profile in database
      if (data.user) {
        await updateProfile({
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.name,
          avatarUrl: data.user.user_metadata?.avatar_url,
          updatedAt: new Date().toISOString(),
        });
      }

      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      toast.success("Profile updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Update Failed", {
        description: error.message || "Failed to update profile",
      });
    },
  });
}

// Convenient wrapper hook for auth state
export function useAuthState() {
  const { data: session, isLoading: isSessionLoading } = useSession();
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: role, isLoading: isRoleLoading } = useUserRole(user?.id);

  const isLoading = isSessionLoading || isUserLoading || isRoleLoading;

  return {
    session,
    user,
    role,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: role === "admin",
  };
}

// Helper function to check auth status more reliably
export function getAuthStatus(user: User | null, isLoading: boolean) {
  if (isLoading) return "loading";
  if (user) return "authenticated";
  return "unauthenticated";
}
