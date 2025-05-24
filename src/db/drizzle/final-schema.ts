import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  unique,
  jsonb,
  pgPolicy,
  boolean,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { profiles, users } from "./schema"; // Assuming common user/profile schema
import { Profile } from "./schema"; // Import Profile type

export interface ResourceLink {
  label: string;
  url: string;
}

// --- Final Projects (Created by Admin) ---
export const finalProjects = pgTable(
  "final_projects",
  {
    id: uuid("id")
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull(), // e.g., 'Data-Driven', 'Education'
    learningObjectives: jsonb("learning_objectives")
      .$type<string[]>()
      .default(sql`'[]'::jsonb`), // Array of strings
    expectedDeliverables: jsonb("expected_deliverables")
      .$type<string[]>()
      .default(sql`'[]'::jsonb`), // Array of strings
    resourceLinks: jsonb("resource_links")
      .$type<ResourceLink[]>()
      .default(sql`'[]'::jsonb`), // Array of {label: string, url: string}
    projectTags: jsonb("project_tags")
      .$type<string[]>()
      .default(sql`'[]'::jsonb`), // Array of strings
    createdByAdminId: uuid("created_by_admin_id")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }), // Keep project if admin deleted, or use "cascade"
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  () => [
    pgPolicy("Authenticated users can view final projects", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`true`,
    }),
    pgPolicy("Admins can create, update, delete final projects", {
      as: "permissive",
      for: "all",
      to: ["authenticated"],
      using: sql`(EXISTS ( SELECT 1
        FROM user_roles
        WHERE ((user_roles.id = auth.uid()) AND (user_roles.role = 'admin'::text))))`,
      withCheck: sql`(EXISTS ( SELECT 1
        FROM user_roles
        WHERE ((user_roles.id = auth.uid()) AND (user_roles.role = 'admin'::text))))`,
    }),
  ]
);

// --- Final Groups (Created by Students) ---
export const finalGroups = pgTable(
  "final_groups",
  {
    id: uuid("id")
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    selectedProjectId: uuid("selected_project_id").references(
      () => finalProjects.id,
      { onDelete: "set null" } // Group remains if project deleted
    ),
    projectIdea: text("project_idea"), // Markdown content for the group's project idea
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
  (table) => [
    pgPolicy("Authenticated users can view final groups", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`true`,
    }),
    pgPolicy("Authenticated users can create final groups", {
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
        SELECT 1 FROM final_group_members
        WHERE final_group_members.group_id = ${table.id}
        AND final_group_members.user_id = auth.uid()
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM final_group_members
        WHERE final_group_members.group_id = ${table.id}
        AND final_group_members.user_id = auth.uid()
      )`,
    }),
    pgPolicy("Group owners can delete their group", {
      as: "permissive",
      for: "delete",
      to: ["authenticated"],
      using: sql`EXISTS (
        SELECT 1 FROM final_group_members
        WHERE final_group_members.group_id = ${table.id}
        AND final_group_members.user_id = auth.uid()
        AND final_group_members.role = 'owner'::text
      )`,
    }),
  ]
);

// --- Final Group Members ---
export const finalGroupMembers = pgTable(
  "final_group_members",
  {
    id: uuid("id")
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => finalGroups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(), // 'owner', 'member'
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    unique("final_group_members_group_id_user_id_key").on(
      table.groupId,
      table.userId
    ),
    pgPolicy("Authenticated users can view final group members", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`true`,
    }),
    pgPolicy("Users can join final groups (insert)", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`(user_id = auth.uid())`,
    }),
    pgPolicy("Users can leave final groups (delete)", {
      as: "permissive",
      for: "delete",
      to: ["authenticated"],
      using: sql`(user_id = auth.uid())`,
    }),
  ]
);

// --- Final Tasks (Uploaded Markdown TODOs) ---
export const finalTasks = pgTable(
  "final_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => finalGroups.id, { onDelete: "cascade" }),
    phase: text("phase").notNull(), // From Markdown structure
    step: text("step").notNull(), // From Markdown structure
    taskText: text("task_text").notNull(),
    isChecked: boolean("is_checked").default(false).notNull(),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    pgPolicy("Group members can view tasks", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`EXISTS (
        SELECT 1 FROM final_group_members
        WHERE final_group_members.group_id = ${table.groupId}
        AND final_group_members.user_id = auth.uid()
      )`,
    }),
    pgPolicy("Group members can manage tasks (insert, update, delete)", {
      as: "permissive",
      for: "all",
      to: ["authenticated"],
      using: sql`EXISTS (
        SELECT 1 FROM final_group_members
        WHERE final_group_members.group_id = ${table.groupId}
        AND final_group_members.user_id = auth.uid()
        AND (final_group_members.role = 'owner'::text OR final_group_members.role = 'member'::text)
      )`,
      withCheck: sql`EXISTS (
        SELECT 1 FROM final_group_members
        WHERE final_group_members.group_id = ${table.groupId}
        AND final_group_members.user_id = auth.uid()
        AND (final_group_members.role = 'owner'::text OR final_group_members.role = 'member'::text)
      )`,
    }),
  ]
);

// --- Final Evaluations (Admin Grading) ---
export const finalEvaluations = pgTable(
  "final_evaluations",
  {
    id: uuid("id")
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => finalGroups.id, { onDelete: "cascade" }),
    userId: uuid("user_id") // Student being evaluated
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    evaluatorId: uuid("evaluator_id") // Admin who evaluated
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),

    // Scoring Categories - Total 450 points
    projectConceptualizationScore: integer(
      "project_conceptualization_score"
    ).default(0), // 75 pts
    technicalImplementationScore: integer(
      "technical_implementation_score"
    ).default(0), // 150 pts
    innovationComplexityScore: integer("innovation_complexity_score").default(
      0
    ), // 75 pts
    documentationPresentationScore: integer(
      "documentation_presentation_score"
    ).default(0), // 75 pts
    testingPolishScore: integer("testing_polish_score").default(0), // 75 pts

    totalScore: integer("total_score").default(0), // Calculated sum
    feedback: text("feedback"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    unique("final_evaluations_group_id_user_id_key").on(
      table.groupId,
      table.userId
    ), // Each student evaluated once per group for finals
    pgPolicy("Users can view their own final evaluations", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`(user_id = auth.uid())`,
    }),
    pgPolicy("Admins can manage final evaluations", {
      as: "permissive",
      for: "all",
      to: ["authenticated"],
      using: sql`(EXISTS ( SELECT 1
        FROM user_roles
        WHERE ((user_roles.id = auth.uid()) AND (user_roles.role = 'admin'::text))))`,
      withCheck: sql`(EXISTS ( SELECT 1
        FROM user_roles
        WHERE ((user_roles.id = auth.uid()) AND (user_roles.role = 'admin'::text))))`,
    }),
  ]
);

// --- Relations for Final Project Entities ---

export const finalProjectsRelations = relations(
  finalProjects,
  ({ one, many }) => ({
    groups: many(finalGroups), // A project can be selected by multiple groups
    adminCreator: one(profiles, {
      // Changed from users to profiles for profile data
      fields: [finalProjects.createdByAdminId],
      references: [profiles.id],
    }),
  })
);

export const finalGroupsRelations = relations(finalGroups, ({ one, many }) => ({
  selectedProject: one(finalProjects, {
    fields: [finalGroups.selectedProjectId],
    references: [finalProjects.id],
  }),
  members: many(finalGroupMembers),
  tasks: many(finalTasks),
  evaluations: many(finalEvaluations),
  // If GitHub metrics/contributions are added, relations would go here
}));

export const finalGroupMembersRelations = relations(
  finalGroupMembers,
  ({ one }) => ({
    group: one(finalGroups, {
      fields: [finalGroupMembers.groupId],
      references: [finalGroups.id],
    }),
    user: one(profiles, {
      // Changed from users to profiles for profile data
      fields: [finalGroupMembers.userId],
      references: [profiles.id],
    }),
  })
);

export const finalTasksRelations = relations(finalTasks, ({ one }) => ({
  group: one(finalGroups, {
    fields: [finalTasks.groupId],
    references: [finalGroups.id],
  }),
}));

export const finalEvaluationsRelations = relations(
  finalEvaluations,
  ({ one }) => ({
    group: one(finalGroups, {
      fields: [finalEvaluations.groupId],
      references: [finalGroups.id],
    }),
    student: one(profiles, {
      // Changed from users to profiles for profile data
      fields: [finalEvaluations.userId],
      references: [profiles.id],
    }),
    evaluator: one(profiles, {
      // Changed from users to profiles for profile data
      fields: [finalEvaluations.evaluatorId],
      references: [profiles.id],
    }),
  })
);

// --- TypeScript Types for Final Project Entities ---
export type FinalProject = typeof finalProjects.$inferSelect;
export type NewFinalProject = typeof finalProjects.$inferInsert;

export type FinalGroup = typeof finalGroups.$inferSelect;
export type NewFinalGroup = typeof finalGroups.$inferInsert;

export type FinalGroupMember = typeof finalGroupMembers.$inferSelect;
export type NewFinalGroupMember = typeof finalGroupMembers.$inferInsert;

export type FinalTask = typeof finalTasks.$inferSelect;
export type NewFinalTask = typeof finalTasks.$inferInsert;

export type FinalEvaluation = typeof finalEvaluations.$inferSelect;
export type NewFinalEvaluation = typeof finalEvaluations.$inferInsert;

// --- Composite Types (similar to midterm for richer data structures) ---

// Example: FinalGroup with its members and selected project details
export interface FinalGroupWithDetails extends FinalGroup {
  selectedProject: FinalProject | null;
  members: (FinalGroupMember & { profile: Profile })[]; // Profile from ./schema
  tasks?: FinalTask[];
  // evaluations?: FinalEvaluation[]; // Could be added if needed directly on group details
}

// Example: For admin view, a project with groups that selected it
export interface FinalProjectWithGroups extends FinalProject {
  groups: FinalGroup[];
}

// For displaying evaluations with student and group names
export interface FinalEvaluationWithNames extends FinalEvaluation {
  studentName: string | null;
  groupName: string | null;
  evaluatorName: string | null;
}
