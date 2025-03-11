// Quiz-related type definitions
export interface QuizQuestion {
  id: string;
  quiz_id: string;
  text: string;
  order_index: number;
  created_at: string;
  updated_at: string | null;
}

export interface QuizQuestionWithOptions extends QuizQuestion {
  quiz_options: QuizOption[];
}

export interface QuizOption {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
  updated_at: string | null;
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  is_multiple_choice: boolean;
  created_by: string;
  created_at: string;
  updated_at: string | null;
}

// Extended quiz type with question count for the admin page
export interface QuizWithQuestionCount extends Quiz {
  quiz_questions: { count: number }[];
  question_count: number;
}

// Full quiz with all questions and options
export interface QuizWithQuestions extends Quiz {
  questions: (QuizQuestion & {
    quiz_options: QuizOption[];
  })[];
}

// Quiz answer types
export interface QuizAnswers {
  [questionId: string]: string | string[];
}

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
}
