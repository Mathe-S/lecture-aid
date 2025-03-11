// User Roles

import { UserRole } from "@/types";

export interface UserRoleRecord {
  id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Quizzes
export interface QuizRecord {
  id: string;
  title: string;
  description: string | null;
  is_multiple_choice: boolean;
  created_by: string;
  created_at: string;
  updated_at: string | null;
}

// Quiz Questions
export interface QuizQuestionRecord {
  id: string;
  quiz_id: string;
  text: string;
  order_index: number;
  created_at: string;
  updated_at: string | null;
}

// Quiz Options
export interface QuizOptionRecord {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
  updated_at: string | null;
}

// Quiz Results
export interface QuizResultRecord {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  answers: Record<string, string | string[]>; // JSON structure for answers
  completed_at: string;
}

// Database Tables type mapping
export type Tables = {
  user_roles: UserRoleRecord;
  quizzes: QuizRecord;
  quiz_questions: QuizQuestionRecord;
  quiz_options: QuizOptionRecord;
  quiz_results: QuizResultRecord;
};

export interface QuizResultRecord {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total_questions: number;
}
