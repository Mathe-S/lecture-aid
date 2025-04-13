import {
  pgTable,
  foreignKey,
  uuid,
  text,
  timestamp,
  integer,
  unique,
  jsonb,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { profiles, users } from "./schema";

// Import type for Profile
import { Profile } from "./schema";

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
      withCheck: sql`true`,
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

// Define relations for midterm tables
export const midtermGroupsRelations = relations(midtermGroups, ({ many }) => ({
  members: many(midtermGroupMembers),
  metrics: many(midtermRepositoryMetrics),
  contributions: many(midtermContributions),
  evaluations: many(midtermEvaluations),
}));

export const midtermGroupMembersRelations = relations(
  midtermGroupMembers,
  ({ one }) => ({
    group: one(midtermGroups, {
      fields: [midtermGroupMembers.groupId],
      references: [midtermGroups.id],
    }),
    user: one(profiles, {
      fields: [midtermGroupMembers.userId],
      references: [profiles.id],
    }),
  })
);

export const midtermRepositoryMetricsRelations = relations(
  midtermRepositoryMetrics,
  ({ one }) => ({
    group: one(midtermGroups, {
      fields: [midtermRepositoryMetrics.groupId],
      references: [midtermGroups.id],
    }),
  })
);

export const midtermContributionsRelations = relations(
  midtermContributions,
  ({ one }) => ({
    group: one(midtermGroups, {
      fields: [midtermContributions.groupId],
      references: [midtermGroups.id],
    }),
    user: one(profiles, {
      fields: [midtermContributions.userId],
      references: [profiles.id],
    }),
  })
);

export const midtermEvaluationsRelations = relations(
  midtermEvaluations,
  ({ one }) => ({
    group: one(midtermGroups, {
      fields: [midtermEvaluations.groupId],
      references: [midtermGroups.id],
    }),
    user: one(profiles, {
      fields: [midtermEvaluations.userId],
      references: [profiles.id],
    }),
    evaluator: one(profiles, {
      fields: [midtermEvaluations.evaluatorId],
      references: [profiles.id],
    }),
  })
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
