"use client";

import { createContext, useContext, useEffect } from "react";
import { Session, User, UserAttributes } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSession,
  useUser,
  useUserRole,
  useGithubAuth,
  useSignOut,
  useUpdateProfile,
  authKeys,
} from "@/hooks/useAuth";

type AuthContextType = {
  user: User | null;
  role: string | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (attributes: UserAttributes) => Promise<User | null>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: session, isLoading: isSessionLoading } = useSession();
  const { data: role, isLoading: isRoleLoading } = useUserRole(user?.id);
  const { mutateAsync: signInWithGitHubMutation } = useGithubAuth();
  const { mutateAsync: signOutMutation } = useSignOut();
  const { mutateAsync: updateProfileMutation } = useUpdateProfile();

  const queryClient = useQueryClient();
  const router = useRouter();
  const supabase = createClient();

  // Setup auth state change listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      // Invalidate all auth queries when auth state changes
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase.auth, queryClient]);

  const isLoading = isUserLoading || isSessionLoading || isRoleLoading;

  const signInWithGitHub = async () => {
    await signInWithGitHubMutation();
  };

  const signOut = async () => {
    await signOutMutation();
  };

  const updateUserProfile = async (attributes: UserAttributes) => {
    return await updateProfileMutation(attributes);
  };

  const refreshUser = async () => {
    queryClient.invalidateQueries({ queryKey: authKeys.all });
  };

  const value = {
    user: user || null,
    role: role || null,
    session: session || null,
    isLoading,
    signInWithGitHub,
    signOut,
    updateUserProfile,
    refreshUser,
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
