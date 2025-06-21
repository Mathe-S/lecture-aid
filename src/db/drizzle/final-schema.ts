import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  unique,
  jsonb,
  pgPolicy,
  index,
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

// --- Final Tasks (Created by Group Members) ---
export const finalTasks = pgTable(
  "final_tasks",
  {
    id: uuid("id")
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    title: text("title").notNull(),
    description: text("description"),
    commitLink: text("commit_link"),
    mergeRequestLink: text("merge_request_link"),
    priority: text("priority", { enum: ["high", "medium", "low"] })
      .default("medium")
      .notNull(),
    status: text("status", {
      enum: ["todo", "in_progress", "done", "graded", "appeal"],
    })
      .default("todo")
      .notNull(),
    dueDate: timestamp("due_date", { withTimezone: true, mode: "string" }),
    estimatedHours: integer("estimated_hours"),
    groupId: uuid("group_id")
      .references(() => finalGroups.id, { onDelete: "cascade" })
      .notNull(),
    createdById: uuid("created_by_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    groupIdIdx: index("final_tasks_group_id_idx").on(table.groupId),
    statusIdx: index("final_tasks_status_idx").on(table.status),
    priorityIdx: index("final_tasks_priority_idx").on(table.priority),
    dueDateIdx: index("final_tasks_due_date_idx").on(table.dueDate),
  })
);

// --- Final Task Assignees (Many-to-Many: Tasks ↔ Users) ---
export const finalTaskAssignees = pgTable(
  "final_task_assignees",
  {
    id: uuid("id")
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    taskId: uuid("task_id")
      .references(() => finalTasks.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    assignedById: uuid("assigned_by_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    assignedAt: timestamp("assigned_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    taskUserUnique: unique("final_task_assignees_task_user_unique").on(
      table.taskId,
      table.userId
    ),
    taskIdIdx: index("final_task_assignees_task_id_idx").on(table.taskId),
    userIdIdx: index("final_task_assignees_user_id_idx").on(table.userId),
  })
);

// Task-related types for inserts
export type NewFinalTask = typeof finalTasks.$inferInsert;
export type FinalTask = typeof finalTasks.$inferSelect;
export type NewFinalTaskAssignee = typeof finalTaskAssignees.$inferInsert;
export type FinalTaskAssignee = typeof finalTaskAssignees.$inferSelect;

// Export priority and status enums for use in components
export const TASK_PRIORITIES = ["high", "medium", "low"] as const;
export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "done",
  "graded",
  "appeal",
] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];

// --- Final Task Grades ---
export const finalTaskGrades = pgTable(
  "final_task_grades",
  {
    id: uuid("id")
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    taskId: uuid("task_id")
      .references(() => finalTasks.id, { onDelete: "cascade" })
      .notNull(),
    studentId: uuid("student_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    graderId: uuid("grader_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    points: integer("points").notNull(), // Points awarded for this task
    maxPoints: integer("max_points").notNull(), // Maximum possible points
    feedback: text("feedback"),
    gradedAt: timestamp("graded_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    taskStudentUnique: unique("final_task_grades_task_student_unique").on(
      table.taskId,
      table.studentId
    ),
    taskIdIdx: index("final_task_grades_task_id_idx").on(table.taskId),
    studentIdIdx: index("final_task_grades_student_id_idx").on(table.studentId),
    graderIdIdx: index("final_task_grades_grader_id_idx").on(table.graderId),
  })
);

// --- Feedback Templates ---
export const feedbackTemplates = pgTable(
  "feedback_templates",
  {
    id: uuid("id")
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(), // e.g., 'code_quality', 'documentation', 'testing'
    content: text("content").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    createdById: uuid("created_by_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    categoryIdx: index("feedback_templates_category_idx").on(table.category),
    createdByIdx: index("feedback_templates_created_by_idx").on(
      table.createdById
    ),
  })
);

// Task grade types
export type NewFinalTaskGrade = typeof finalTaskGrades.$inferInsert;
export type FinalTaskGrade = typeof finalTaskGrades.$inferSelect;

// Feedback template types
export type NewFeedbackTemplate = typeof feedbackTemplates.$inferInsert;
export type FeedbackTemplate = typeof feedbackTemplates.$inferSelect;

// --- Final Evaluations (Simple Task Points Summary) ---
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

    // Just the total points earned - simple addition
    totalPoints: integer("total_points").default(0).notNull(), // Sum of all task points earned

    // Optional overall feedback
    overallFeedback: text("overall_feedback"),

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
      fields: [finalGroupMembers.userId],
      references: [profiles.id],
    }),
  })
);

export const finalTasksRelations = relations(finalTasks, ({ one, many }) => ({
  group: one(finalGroups, {
    fields: [finalTasks.groupId],
    references: [finalGroups.id],
  }),
  createdBy: one(profiles, {
    fields: [finalTasks.createdById],
    references: [profiles.id],
  }),
  assignees: many(finalTaskAssignees),
  grades: many(finalTaskGrades),
}));

export const finalTaskGradesRelations = relations(
  finalTaskGrades,
  ({ one }) => ({
    task: one(finalTasks, {
      fields: [finalTaskGrades.taskId],
      references: [finalTasks.id],
    }),
    student: one(profiles, {
      fields: [finalTaskGrades.studentId],
      references: [profiles.id],
    }),
    grader: one(profiles, {
      fields: [finalTaskGrades.graderId],
      references: [profiles.id],
    }),
  })
);

export const feedbackTemplatesRelations = relations(
  feedbackTemplates,
  ({ one }) => ({
    createdBy: one(profiles, {
      fields: [feedbackTemplates.createdById],
      references: [profiles.id],
    }),
  })
);

export const finalTaskAssigneesRelations = relations(
  finalTaskAssignees,
  ({ one }) => ({
    task: one(finalTasks, {
      fields: [finalTaskAssignees.taskId],
      references: [finalTasks.id],
    }),
    user: one(profiles, {
      fields: [finalTaskAssignees.userId],
      references: [profiles.id],
    }),
    assignedBy: one(profiles, {
      fields: [finalTaskAssignees.assignedById],
      references: [profiles.id],
    }),
  })
);

export const finalEvaluationsRelations = relations(
  finalEvaluations,
  ({ one }) => ({
    group: one(finalGroups, {
      fields: [finalEvaluations.groupId],
      references: [finalGroups.id],
    }),
    student: one(profiles, {
      fields: [finalEvaluations.userId],
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
