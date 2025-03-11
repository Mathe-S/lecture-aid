import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "./user.types";

export type UserAttributes = {
  [key: string]: string | number | boolean | null | undefined;
};

export type AuthContextType = {
  user: User | null;
  role: UserRole | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (attributes: UserAttributes) => Promise<User | null>;
};
