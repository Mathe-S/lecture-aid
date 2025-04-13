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
export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type AssignmentSubmissionWithProfile = AssignmentSubmission & {
  profile: Profile;
  assignment: Assignment;
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

export const midtermGroups = pgTable(
  "midterm_groups",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    name: text().notNull(),
    description: text(),
    repositoryUrl: text("repository_url"),
    repositoryOwner: text("repository_owner"),
    repositoryName: text("repository_name"),
    lastSync: timestamp("last_sync", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  () => [
    pgPolicy("Everyone can view midterm groups", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`true`,
    }),
    pgPolicy("Users can create midterm groups", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      using: sql`true`,
    }),
    pgPolicy("Group members can update their group", {
      as: "permissive",
      for: "update",
      to: ["authenticated"],
      using: sql`EXISTS (
        SELECT 1 FROM midterm_group_members 
        WHERE midterm_group_members.group_id = midterm_groups.id 
        AND midterm_group_members.user_id = auth.uid()
      )`,
    }),
  ]
);

export const midtermGroupMembers = pgTable(
  "midterm_group_members",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    groupId: uuid("group_id").notNull(),
    userId: uuid("user_id").notNull(),
    role: text().default("member").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [midtermGroups.id],
      name: "midterm_group_members_group_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "midterm_group_members_user_id_fkey",
    }).onDelete("cascade"),
    unique("midterm_group_members_group_id_user_id_key").on(
      table.groupId,
      table.userId
    ),
    pgPolicy("Everyone can view group members", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`true`,
    }),
    pgPolicy("Users can join groups", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`(user_id = auth.uid())`,
    }),
    pgPolicy("Users can leave groups", {
      as: "permissive",
      for: "delete",
      to: ["authenticated"],
      using: sql`(user_id = auth.uid())`,
    }),
  ]
);

export const midtermRepositoryMetrics = pgTable(
  "midterm_repository_metrics",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    groupId: uuid("group_id").notNull(),
    totalCommits: integer("total_commits").default(0),
    totalPullRequests: integer("total_pull_requests").default(0),
    totalBranches: integer("total_branches").default(0),
    totalIssues: integer("total_issues").default(0),
    codeAdditions: integer("code_additions").default(0),
    codeDeletions: integer("code_deletions").default(0),
    contributorsCount: integer("contributors_count").default(0),
    lastUpdated: timestamp("last_updated", {
      withTimezone: true,
      mode: "string",
    })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    detailedMetrics: jsonb().default({}),
  },
  (table) => [
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [midtermGroups.id],
      name: "midterm_repository_metrics_group_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Everyone can view repository metrics", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`true`,
    }),
  ]
);

export const midtermContributions = pgTable(
  "midterm_contributions",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    groupId: uuid("group_id").notNull(),
    userId: uuid("user_id").notNull(),
    githubUsername: text("github_username"),
    commits: integer().default(0),
    pullRequests: integer("pull_requests").default(0),
    codeReviews: integer("code_reviews").default(0),
    additions: integer().default(0),
    deletions: integer().default(0),
    branchesCreated: integer("branches_created").default(0),
    lastCommitDate: timestamp("last_commit_date", {
      withTimezone: true,
      mode: "string",
    }),
    contributionData: jsonb().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [midtermGroups.id],
      name: "midterm_contributions_group_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "midterm_contributions_user_id_fkey",
    }).onDelete("cascade"),
    unique("midterm_contributions_group_id_user_id_key").on(
      table.groupId,
      table.userId
    ),
    pgPolicy("Everyone can view contributions", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`true`,
    }),
  ]
);

export const midtermEvaluations = pgTable(
  "midterm_evaluations",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    groupId: uuid("group_id").notNull(),
    userId: uuid("user_id").notNull(),
    evaluatorId: uuid("evaluator_id").notNull(),
    specScore: integer("spec_score").default(0),
    testScore: integer("test_score").default(0),
    implementationScore: integer("implementation_score").default(0),
    documentationScore: integer("documentation_score").default(0),
    gitWorkflowScore: integer("git_workflow_score").default(0),
    totalScore: integer("total_score").default(0),
    feedback: text(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [midtermGroups.id],
      name: "midterm_evaluations_group_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "midterm_evaluations_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.evaluatorId],
      foreignColumns: [users.id],
      name: "midterm_evaluations_evaluator_id_fkey",
    }).onDelete("cascade"),
    unique("midterm_evaluations_group_id_user_id_key").on(
      table.groupId,
      table.userId
    ),
    pgPolicy("Users can view their own evaluations", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`(user_id = auth.uid())`,
    }),
    pgPolicy("Admins can view and create evaluations", {
      as: "permissive",
      for: "all",
      to: ["authenticated"],
      using: sql`(EXISTS ( SELECT 1
        FROM user_roles
        WHERE ((user_roles.id = auth.uid()) AND (user_roles.role = 'admin'::text))))`,
    }),
  ]
);

// types for midterm entities
export type MidtermGroup = typeof midtermGroups.$inferSelect;
export type MidtermGroupMember = typeof midtermGroupMembers.$inferSelect;
export type MidtermRepositoryMetric =
  typeof midtermRepositoryMetrics.$inferSelect;
export type MidtermContribution = typeof midtermContributions.$inferSelect;
export type MidtermEvaluation = typeof midtermEvaluations.$inferSelect;

export type MidtermGroupWithMembers = MidtermGroup & {
  members: (MidtermGroupMember & { profile: Profile })[];
};

export type MidtermGroupWithDetails = MidtermGroupWithMembers & {
  metrics: MidtermRepositoryMetric;
  contributions: (MidtermContribution & { profile: Profile })[];
};
