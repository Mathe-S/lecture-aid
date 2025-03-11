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
      quizzes: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          is_multiple_choice: boolean;
          created_by: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          is_multiple_choice?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          is_multiple_choice?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          text: string;
          order_index: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          text: string;
          order_index: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          text?: string;
          order_index?: number;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      quiz_options: {
        Row: {
          id: string;
          question_id: string;
          text: string;
          is_correct: boolean;
          order_index: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          question_id: string;
          text: string;
          is_correct?: boolean;
          order_index: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          question_id?: string;
          text?: string;
          is_correct?: boolean;
          order_index?: number;
          created_at?: string;
          updated_at?: string | null;
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
