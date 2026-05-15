import { pgTable, serial, text, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSizeBytes: integer("file_size_bytes"),
  fileUrl: text("file_url"),
  status: text("status").notNull().default("uploaded"),
  docType: text("doc_type").notNull().default("invoice"),
  uploadSource: text("upload_source").notNull().default("web_upload"),
  vendorId: integer("vendor_id"),
  vendorName: text("vendor_name"),
  confidenceScore: numeric("confidence_score", { precision: 5, scale: 4 }),
  isDuplicate: boolean("is_duplicate").notNull().default(false),
  duplicateOfId: integer("duplicate_of_id"),
  assignedTo: text("assigned_to"),
  reviewComment: text("review_comment"),
  priority: text("priority").notNull().default("medium"),
  tags: text("tags").array().notNull().default([]),
  processingStartedAt: timestamp("processing_started_at", { withTimezone: true }),
  processingCompletedAt: timestamp("processing_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
