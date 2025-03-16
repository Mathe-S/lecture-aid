"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Session, User, UserAttributes } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

type AuthContextType = {
  user: User | null;
  role: string | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (attributes: UserAttributes) => Promise<User | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Fetch user role via API route
  const fetchUserRole = async (userId: string) => {
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

  useEffect(() => {
    const setupAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          // Use API route to fetch user role
          const userRole = await fetchUserRole(session.user.id);
          setRole(userRole);
        }
      } catch (error) {
        console.error("Error setting up auth:", error);
      } finally {
        setIsLoading(false);
      }

      // Set up auth state listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          // Use API route to fetch user role
          const userRole = await fetchUserRole(session.user.id);
          setRole(userRole);
        } else {
          setRole(null);
        }

        router.refresh();
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    setupAuth();
  }, [router, supabase.auth]);

  const signInWithGitHub = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      // If we get here and data.url exists, we need to redirect the user
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      console.error("GitHub sign in error:", error);
      toast("Authentication Error", {
        description: "Failed to sign in with GitHub. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
    // Note: We don't set isLoading to false on success because we're redirecting
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      console.log("🚀 ~ signOut ~ router:", router);
      router.push("/");
    } catch (error: unknown) {
      console.error("Sign out error:", error);
      toast("Sign Out Error", {
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  const updateUserProfile = async (attributes: UserAttributes) => {
    try {
      setIsLoading(true);

      // Update the user in Supabase Auth
      const { data: userData, error: userError } =
        await supabase.auth.updateUser(attributes);

      if (userError) throw userError;

      // Use API route to update the profile
      if (userData.user) {
        try {
          const response = await fetch("/api/auth/update-profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userData.user.id,
              email: userData.user.email,
              fullName: userData.user.user_metadata?.name,
              avatarUrl: userData.user.user_metadata?.avatar_url,
              updatedAt: new Date().toISOString(),
            }),
          });

          if (!response.ok) {
            console.error("Error updating profile:", await response.text());
          }
        } catch (error) {
          console.error("Error updating profile:", error);
          // We don't throw here to avoid breaking auth updates if profile update fails
        }
      }

      // Refresh the session to get updated user data
      const { data: sessionData } = await supabase.auth.getSession();
      setSession(sessionData.session);
      setUser(userData.user);

      return userData.user;
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    role,
    session,
    isLoading,
    signInWithGitHub,
    signOut,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
