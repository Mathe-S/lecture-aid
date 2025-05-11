import {
  pgTable,
  foreignKey,
  check,
  uuid,
  text,
  timestamp,
  pgPolicy,
  boolean,
  integer,
  unique,
  jsonb,
  pgSchema,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { User } from "@supabase/supabase-js";
const authSchema = pgSchema("auth");

export const users = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid().primaryKey().notNull(),
    role: text().default("student").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.id],
      foreignColumns: [users.id],
      name: "user_roles_id_fkey",
    }),
    check(
      "role_check",
      sql`role = ANY (ARRAY['admin'::text, 'lecturer'::text, 'student'::text])`
    ),
  ]
);

export const quizzes = pgTable(
  "quizzes",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    title: text().notNull(),
    description: text(),
    grade: integer().default(0).notNull(),
    createdBy: uuid("created_by").notNull(),
    closed: boolean().default(false).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: "quizzes_created_by_fkey",
    }),
    pgPolicy("Everyone can view quizzes", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`true`,
    }),
    pgPolicy("Admins can do everything", {
      as: "permissive",
      for: "all",
      to: ["authenticated"],
    }),
  ]
);

export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    quizId: uuid("quiz_id").notNull(),
    text: text().notNull(),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.quizId],
      foreignColumns: [quizzes.id],
      name: "quiz_questions_quiz_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Everyone can view quiz questions", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`true`,
    }),
    pgPolicy("Admins can do everything", {
      as: "permissive",
      for: "all",
      to: ["authenticated"],
    }),
  ]
);

export const quizOptions = pgTable(
  "quiz_options",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    questionId: uuid("question_id").notNull(),
    text: text().notNull(),
    isCorrect: boolean("is_correct").default(false),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.questionId],
      foreignColumns: [quizQuestions.id],
      name: "quiz_options_question_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Everyone can view quiz options", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`true`,
    }),
    pgPolicy("Admins can do everything", {
      as: "permissive",
      for: "all",
      to: ["authenticated"],
    }),
  ]
);

export const quizResults = pgTable(
  "quiz_results",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    quizId: uuid("quiz_id").notNull(),
    userId: uuid("user_id").notNull(),
    score: integer().notNull(),
    totalQuestions: integer("total_questions").notNull(),
    answers: jsonb().notNull(),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.quizId],
      foreignColumns: [quizzes.id],
      name: "quiz_results_quiz_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "quiz_results_user_id_fkey",
    }).onDelete("cascade"),
    unique("quiz_results_quiz_id_user_id_key").on(table.quizId, table.userId),
    pgPolicy("Users can submit their own results", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`(user_id = auth.uid())`,
    }),
    pgPolicy("Users can view their own results", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
    pgPolicy("Admins can view all results", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
  ]
);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid().primaryKey().notNull(),
    email: text(),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.id],
      foreignColumns: [users.id],
      name: "profiles_id_fkey",
    }),
    pgPolicy("Admins can view all profiles", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`(EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.id = auth.uid()) AND (user_roles.role = 'admin'::text))))`,
    }),
    pgPolicy("Users can update their own profile", {
      as: "permissive",
      for: "update",
      to: ["authenticated"],
    }),
    pgPolicy("Users can view their own profile", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
  ]
);

export const assignments = pgTable(
  "assignments",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    title: text().notNull(),
    description: text(),
    grade: integer().default(3).notNull(),
    due_date: timestamp("due_date", { withTimezone: true, mode: "string" }),
    created_by: uuid("created_by").notNull(),
    created_at: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
    closed: boolean().default(false),
  },
  (table) => [
    foreignKey({
      columns: [table.created_by],
      foreignColumns: [users.id],
      name: "assignments_created_by_fkey",
    }),
    pgPolicy("Everyone can view assignments", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`true`,
    }),
    pgPolicy("Only lecturers and admins can create assignments", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`(
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_roles.id = auth.uid() 
          AND user_roles.role IN ('lecturer', 'admin')
        )
      )`,
    }),
    pgPolicy("Only lecturers and admins can update assignments", {
      as: "permissive",
      for: "update",
      to: ["authenticated"],
      using: sql`(
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_roles.id = auth.uid() 
          AND user_roles.role IN ('lecturer', 'admin')
        )
      )`,
    }),
  ]
);

export const assignmentCustomFields = pgTable(
  "assignment_custom_fields",
  {
    id: uuid("id")
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    assignment_id: uuid("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    is_required: boolean("is_required").default(false).notNull(),
    order: integer("order").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => ({
    assignmentIdFk: foreignKey({
      columns: [table.assignment_id],
      foreignColumns: [assignments.id],
      name: "assignment_custom_fields_assignment_id_fkey",
    }).onDelete("cascade"),
    // Optional: Add a unique constraint on assignment_id and label if needed
    // uniqueLabelPerAssignment: unique("assignment_custom_fields_assignment_id_label_key").on(table.assignment_id, table.label),
  })
);

export const assignmentSubmissions = pgTable(
  "assignment_submissions",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    assignmentId: uuid("assignment_id").notNull(),
    userId: uuid("user_id").notNull(),
    repositoryUrl: text("repository_url").notNull(),
    repositoryName: text("repository_name"),
    feedback: text(),
    grade: integer(),
    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.assignmentId],
      foreignColumns: [assignments.id],
      name: "assignment_submissions_assignment_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "assignment_submissions_user_id_fkey",
    }).onDelete("cascade"),
    unique("assignment_submissions_user_id_assignment_id_key").on(
      table.userId,
      table.assignmentId
    ),
    pgPolicy("Students can submit their own assignments", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`(user_id = auth.uid())`,
    }),
    pgPolicy("Students can update their own submissions", {
      as: "permissive",
      for: "update",
      to: ["authenticated"],
      using: sql`(user_id = auth.uid())`,
      withCheck: sql`(user_id = auth.uid() AND grade IS NULL)`,
    }),
    pgPolicy("Everyone can view submissions", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
    }),
    pgPolicy("Lecturers and admins can grade submissions", {
      as: "permissive",
      for: "update",
      to: ["authenticated"],
      using: sql`(
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_roles.id = auth.uid() 
          AND user_roles.role IN ('lecturer', 'admin')
        )
      )`,
    }),
  ]
);

export const assignmentSubmissionCustomValues = pgTable(
  "assignment_submission_custom_values",
  {
    id: uuid("id")
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    submission_id: uuid("submission_id")
      .notNull()
      .references(() => assignmentSubmissions.id, { onDelete: "cascade" }),
    custom_field_id: uuid("custom_field_id")
      .notNull()
      .references(() => assignmentCustomFields.id, { onDelete: "cascade" }),
    value: text("value").notNull(), // Assuming custom field values are always text and required if a record exists
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.submission_id],
      foreignColumns: [assignmentSubmissions.id],
      name: "ascv_submission_id_fkey", // Using a shorter name for the constraint
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.custom_field_id],
      foreignColumns: [assignmentCustomFields.id],
      name: "ascv_custom_field_id_fkey",
    }).onDelete("cascade"),
    // Unique constraint to ensure a user doesn't submit multiple values for the same custom field on the same submission
    unique("ascv_submission_field_unique").on(
      table.submission_id,
      table.custom_field_id
    ),
    pgPolicy("Users can manage their own custom submission values", {
      as: "permissive",
      for: "all", // Allows insert, select, update, delete by the user who owns the submission
      to: ["authenticated"],
      using: sql`(EXISTS ( SELECT 1
   FROM assignment_submissions sub
  WHERE ((sub.id = submission_id) AND (sub.user_id = auth.uid()))))`, // User owns the submission
      withCheck: sql`(EXISTS ( SELECT 1
   FROM assignment_submissions sub
  WHERE ((sub.id = submission_id) AND (sub.user_id = auth.uid()))))`,
    }),
    pgPolicy("Lecturers and admins can view all custom submission values", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`(EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.id = auth.uid()) AND (user_roles.role = ANY (ARRAY['lecturer'::text, 'admin'::text])))))`,
    }),
  ]
);

export const studentGrades = pgTable(
  "student_grades",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    userId: uuid("user_id").notNull(),
    quizPoints: integer("quiz_points").default(0),
    maxQuizPoints: integer("max_quiz_points").default(0),
    assignmentPoints: integer("assignment_points").default(0),
    maxAssignmentPoints: integer("max_assignment_points").default(0),
    midtermPoints: integer("midterm_points").default(0),
    extraPoints: integer("extra_points").default(0),
    totalPoints: integer("total_points").default(0),
    maxPossiblePoints: integer("max_possible_points").default(1000),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "student_grades_user_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Students can view their own grades", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`(user_id = auth.uid())`,
    }),
    pgPolicy("Admins and lecturers can manage grades", {
      as: "permissive",
      for: "all",
      to: ["authenticated"],
      using: sql`(
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_roles.id = auth.uid() 
          AND user_roles.role IN ('lecturer', 'admin')
        )
      )`,
    }),
  ]
);

export type Quiz = typeof quizzes.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type QuizOption = typeof quizOptions.$inferSelect;
export type QuizResult = typeof quizResults.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type UserRoleRecord = typeof userRoles.$inferSelect;

export type QuizQuestionWithOptions = QuizQuestion & {
  quizOptions: QuizOption[];
};
export type QuizWithQuestionsAndOptions = Quiz & {
  quizQuestions: QuizQuestionWithOptions[];
};
export type QuizAnswers = Record<string, string | string[]>;

export type ProfileRecord = typeof profiles.$inferSelect;

export type UserRole = typeof userRoles.$inferSelect.role;

// Helper function to determine if a question is multiple choice
export function isQuestionMultipleChoice(
  question: QuizQuestionWithOptions
): boolean {
  return question.quizOptions.filter((option) => option.isCorrect).length > 1;
}

//  types for assignments
export type Assignment = typeof assignments.$inferSelect;
export type AssignmentCustomField = typeof assignmentCustomFields.$inferSelect;
export type AssignmentWithCustomFields = Assignment & {
  customFields: AssignmentCustomField[];
};
export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type AssignmentSubmissionWithProfile = AssignmentSubmission & {
  profile: Profile;
  assignment: AssignmentWithCustomFields;
};
export type AssignmentSubmissionCustomValue =
  typeof assignmentSubmissionCustomValues.$inferSelect;

export type AssignmentSubmissionWithCustomAnswers = AssignmentSubmission & {
  customAnswers?: AssignmentSubmissionCustomValue[];
};

//  types for grades
export type StudentGrade = typeof studentGrades.$inferSelect;
export type StudentGradeWithUserAndProfile = StudentGrade & {
  user: User;
  profile: Profile;
};

// Use our own User type that includes the profiles property
export type UserWithProfiles = {
  id: string;
  profiles?: Profile[];
  [key: string]: any;
};

// Update the StudentGradeWithUserAndProfile type
export type GradeWithProfilesType = Omit<
  StudentGradeWithUserAndProfile,
  "user"
> & {
  user: UserWithProfiles;
  profile?: Profile;
};
