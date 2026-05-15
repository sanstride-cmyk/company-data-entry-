import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workflowTasksTable = pgTable("workflow_tasks", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  taskType: text("task_type").notNull().default("review"),
  status: text("status").notNull().default("pending"),
  assignedTo: text("assigned_to"),
  dueDate: text("due_date"),
  comment: text("comment"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  completedBy: text("completed_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWorkflowTaskSchema = createInsertSchema(workflowTasksTable).omit({ id: true, createdAt: true });
export type InsertWorkflowTask = z.infer<typeof insertWorkflowTaskSchema>;
export type WorkflowTask = typeof workflowTasksTable.$inferSelect;
