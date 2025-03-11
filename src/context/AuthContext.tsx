"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, UserRole } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type AuthContextType = {
  user: User | null;
  role: UserRole | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
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

      setIsLoading(false);

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
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const value = {
    user,
    role,
    session,
    isLoading,
    signInWithGitHub,
    signOut,
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
