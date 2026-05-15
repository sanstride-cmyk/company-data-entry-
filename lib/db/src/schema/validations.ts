import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const validationsTable = pgTable("validations", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  ruleCode: text("rule_code").notNull(),
  severity: text("severity").notNull().default("warning"),
  message: text("message").notNull(),
  field: text("field"),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertValidationSchema = createInsertSchema(validationsTable).omit({ id: true, createdAt: true });
export type InsertValidation = z.infer<typeof insertValidationSchema>;
export type Validation = typeof validationsTable.$inferSelect;
