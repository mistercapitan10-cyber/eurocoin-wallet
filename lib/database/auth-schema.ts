/**
 * Drizzle ORM schema for NextAuth.js
 * Matches the standard NextAuth table names: users, accounts, sessions, verification_tokens
 */

import { pgTable, text, timestamp, uuid, boolean, index, bigint } from "drizzle-orm/pg-core";

// Users table (matches auth_users in database)
export const users = pgTable("auth_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date", withTimezone: true }),
  image: text("image"),

  // Custom fields from auth_users schema (optional)
  authType: text("auth_type").default("email"),
  walletAddress: text("wallet_address").unique(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow(),
});

// Accounts table (matches auth_accounts in database)
export const accounts = pgTable(
  "auth_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: bigint("expires_at", { mode: "number" }),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => ({
    providerIdx: index().on(table.provider, table.providerAccountId),
  }),
);

// Sessions table (matches auth_sessions in database)
export const sessions = pgTable("auth_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: text("session_token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
});

// Verification tokens table (matches auth_verification_tokens in database)
export const verificationTokens = pgTable(
  "auth_verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (table) => ({
    compositePk: index().on(table.identifier, table.token),
  }),
);
