import { createClient } from "@supabase/supabase-js";

export type UserRole = "admin" | "lecturer" | "student";

export type Database = {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
        };
        Update: {
          role?: UserRole;
        };
      };
      // other tables...
    };
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
