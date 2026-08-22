import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// One row per issued refresh token. Rotation + reuse-detection live on this table.
export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(), // sha256 of the raw token — raw value never stored
  familyId: text('family_id').notNull(),            // shared by a token and everything it rotates into
  revoked: boolean('revoked').notNull().default(false),
  replacedBy: text('replaced_by'),                  // id of the token this one was rotated into
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  userAgent: text('user_agent'),
  ip: text('ip'),
});

export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

export const briefings = pgTable('briefings', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  briefing: text('briefing').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const approvals = pgTable('approvals', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  from: text('from').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected'
  threadId: text('thread_id'),
  messageId: text('message_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
