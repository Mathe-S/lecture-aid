import { relations } from "drizzle-orm/relations";
import {
  users as usersInAuth,
  userRoles,
  quizzes,
  quizQuestions,
  quizOptions,
  quizResults,
  profiles,
  assignments,
  assignmentSubmissions,
  studentGrades,
} from "./schema";

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  usersInAuth: one(usersInAuth, {
    fields: [userRoles.id],
    references: [usersInAuth.id],
  }),
}));

export const usersInAuthRelations = relations(usersInAuth, ({ many }) => ({
  userRoles: many(userRoles),
  quizzes: many(quizzes),
  quizResults: many(quizResults),
  profiles: many(profiles),
  createdAssignments: many(assignments, { relationName: "creator" }),
  assignmentSubmissions: many(assignmentSubmissions, {
    relationName: "student",
  }),
  grades: many(studentGrades),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  usersInAuth: one(usersInAuth, {
    fields: [quizzes.createdBy],
    references: [usersInAuth.id],
  }),
  quizQuestions: many(quizQuestions),
  quizResults: many(quizResults),
}));

export const quizQuestionsRelations = relations(
  quizQuestions,
  ({ one, many }) => ({
    quiz: one(quizzes, {
      fields: [quizQuestions.quizId],
      references: [quizzes.id],
    }),
    quizOptions: many(quizOptions),
  })
);

export const quizOptionsRelations = relations(quizOptions, ({ one }) => ({
  quizQuestion: one(quizQuestions, {
    fields: [quizOptions.questionId],
    references: [quizQuestions.id],
  }),
}));

export const quizResultsRelations = relations(quizResults, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizResults.quizId],
    references: [quizzes.id],
  }),
  usersInAuth: one(usersInAuth, {
    fields: [quizResults.userId],
    references: [usersInAuth.id],
  }),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  usersInAuth: one(usersInAuth, {
    fields: [profiles.id],
    references: [usersInAuth.id],
  }),
  submissions: many(assignmentSubmissions),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  creator: one(usersInAuth, {
    fields: [assignments.created_by],
    references: [usersInAuth.id],
  }),
  submissions: many(assignmentSubmissions),
}));

export const assignmentSubmissionsRelations = relations(
  assignmentSubmissions,
  ({ one }) => ({
    assignment: one(assignments, {
      fields: [assignmentSubmissions.assignmentId],
      references: [assignments.id],
    }),
    student: one(usersInAuth, {
      fields: [assignmentSubmissions.userId],
      references: [usersInAuth.id],
    }),
    profile: one(profiles, {
      fields: [assignmentSubmissions.userId],
      references: [profiles.id],
    }),
  })
);

export const studentGradesRelations = relations(studentGrades, ({ one }) => ({
  user: one(usersInAuth, {
    fields: [studentGrades.userId],
    references: [usersInAuth.id],
  }),
}));
