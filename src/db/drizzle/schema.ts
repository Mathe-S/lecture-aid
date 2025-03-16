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
    isMultipleChoice: boolean("is_multiple_choice").default(false),
    createdBy: uuid("created_by").notNull(),
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
