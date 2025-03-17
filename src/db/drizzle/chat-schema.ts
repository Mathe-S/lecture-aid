import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { profiles } from "./schema"; // Assuming this is where your user profiles are defined

// Chat rooms table - optional if you want to support multiple chat contexts
export const chatRooms = pgTable("chat_rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profiles.id),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatRoomId: uuid("chat_room_id")
    .references(() => chatRooms.id)
    .notNull(),
  content: text("content").notNull(),
  userId: uuid("user_id")
    .references(() => profiles.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isEdited: boolean("is_edited").default(false),
  // For reply functionality
  parentMessageId: uuid("parent_message_id").references(
    (): any => chatMessages.id
  ),
});

// Reactions table
export const messageReactions = pgTable(
  "message_reactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    messageId: uuid("message_id")
      .references(() => chatMessages.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id)
      .notNull(),
    reaction: varchar("reaction", { length: 20 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("message_reaction_unique").on(
      table.messageId,
      table.userId,
      table.reaction
    ),
  ]
);

// Pinned messages table
export const pinnedMessages = pgTable(
  "pinned_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    messageId: uuid("message_id")
      .references(() => chatMessages.id, { onDelete: "cascade" })
      .notNull(),
    chatRoomId: uuid("chat_room_id")
      .references(() => chatRooms.id)
      .notNull(),
    pinnedBy: uuid("pinned_by")
      .references(() => profiles.id)
      .notNull(),
    pinnedAt: timestamp("pinned_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("pinned_message_unique").on(table.messageId, table.chatRoomId),
  ]
);

// Define relations
export const chatRoomsRelations = relations(chatRooms, ({ many, one }) => ({
  messages: many(chatMessages),
  pinnedMessages: many(pinnedMessages),
  creator: one(profiles, {
    fields: [chatRooms.createdBy],
    references: [profiles.id],
  }),
}));

export const chatMessagesRelations = relations(
  chatMessages,
  ({ many, one }) => ({
    chatRoom: one(chatRooms, {
      fields: [chatMessages.chatRoomId],
      references: [chatRooms.id],
    }),
    author: one(profiles, {
      fields: [chatMessages.userId],
      references: [profiles.id],
    }),
    reactions: many(messageReactions),
    replies: many(chatMessages, {
      relationName: "replies",
    }),
    parentMessage: one(chatMessages, {
      fields: [chatMessages.parentMessageId],
      references: [chatMessages.id],
      relationName: "replies",
    }),
  })
);

export const messageReactionsRelations = relations(
  messageReactions,
  ({ one }) => ({
    message: one(chatMessages, {
      fields: [messageReactions.messageId],
      references: [chatMessages.id],
    }),
    user: one(profiles, {
      fields: [messageReactions.userId],
      references: [profiles.id],
    }),
  })
);

export const pinnedMessagesRelations = relations(pinnedMessages, ({ one }) => ({
  message: one(chatMessages, {
    fields: [pinnedMessages.messageId],
    references: [chatMessages.id],
  }),
  chatRoom: one(chatRooms, {
    fields: [pinnedMessages.chatRoomId],
    references: [chatRooms.id],
  }),
  pinnedByUser: one(profiles, {
    fields: [pinnedMessages.pinnedBy],
    references: [profiles.id],
  }),
}));
