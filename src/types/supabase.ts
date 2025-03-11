export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "quizzes_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey";
            columns: ["quiz_id"];
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "quiz_questions";
            referencedColumns: ["id"];
          }
        ];
      };
      quiz_results: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string;
          score: number;
          total_questions: number;
          answers: Json;
          completed_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          user_id: string;
          score: number;
          total_questions: number;
          answers: Json;
          completed_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          user_id?: string;
          score?: number;
          total_questions?: number;
          answers?: Json;
          completed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_results_quiz_id_fkey";
            columns: ["quiz_id"];
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_results_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
  };
}
