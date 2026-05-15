import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const exportJobsTable = pgTable("export_jobs", {
  id: serial("id").primaryKey(),
  exportFormat: text("export_format").notNull(),
  status: text("status").notNull().default("pending"),
  documentIds: jsonb("document_ids").notNull().default([]),
  documentCount: integer("document_count").notNull().default(0),
  downloadUrl: text("download_url"),
  fieldMapping: jsonb("field_mapping").notNull().default({}),
  errorMessage: text("error_message"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertExportJobSchema = createInsertSchema(exportJobsTable).omit({ id: true, createdAt: true });
export type InsertExportJob = z.infer<typeof insertExportJobSchema>;
export type ExportJob = typeof exportJobsTable.$inferSelect;
