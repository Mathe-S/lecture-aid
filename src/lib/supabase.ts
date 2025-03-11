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

// Make sure these environment variables are properly set in .env.local
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
