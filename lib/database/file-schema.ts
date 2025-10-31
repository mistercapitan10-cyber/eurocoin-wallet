/**
 * Drizzle ORM schema for request files
 * Handles file attachments for exchange and internal requests
 */

import { pgTable, uuid, text, bigint, timestamp, index } from "drizzle-orm/pg-core";

export const requestFiles = pgTable(
  "request_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: text("request_id").notNull(),
    requestType: text("request_type").notNull(),
    fileName: text("file_name").notNull(),
    fileType: text("file_type").notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull(),
    fileData: text("file_data").notNull(), // Base64 encoded
    uploadedAt: timestamp("uploaded_at", { mode: "date", withTimezone: true }).defaultNow(),
  },
  (table) => ({
    requestIdIdx: index("idx_request_files_request_id").on(table.requestId),
    requestTypeIdx: index("idx_request_files_request_type").on(table.requestType),
  }),
);

export type RequestFile = typeof requestFiles.$inferSelect;
export type NewRequestFile = typeof requestFiles.$inferInsert;
