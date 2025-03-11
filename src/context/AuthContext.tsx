"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserAttributes, UserRole } from "@/types";

type AuthContextType = {
  user: User | null;
  role: UserRole | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (attributes: UserAttributes) => Promise<User | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const setupAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          // Fetch user role
          const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          setRole(data?.role || null);
        }
      } catch (error) {
        console.error("Error setting up auth:", error);
      } finally {
        setIsLoading(false);
      }

      // Set up auth state listener
      const {
        data: { subscription },
      } = await supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          // Fetch user role
          const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          setRole(data?.role || null);
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
  }, [router]);

  const signInWithGitHub = async () => {
    try {
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
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
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

      // Also update the profiles table
      if (userData.user) {
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: userData.user.id,
            email: userData.user.email,
            name: userData.user.user_metadata?.name,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
            ignoreDuplicates: false,
          }
        );

        if (profileError) {
          console.error("Error updating profile:", profileError);
          // We don't throw here to avoid breaking auth updates if profile update fails
        }
      }

      // Refresh the session to get updated user data
      const { data: sessionData } = await supabase.auth.getSession();
      setSession(sessionData.session);
      setUser(userData.user);

      return userData.user;
    } catch (error: any) {
      toast.error(
        error.message && typeof error.message === "string"
          ? error.message
          : "An unexpected error occurred"
      );
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
