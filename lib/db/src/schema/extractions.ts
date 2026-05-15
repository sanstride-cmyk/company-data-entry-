import { pgTable, serial, integer, text, numeric, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const extractionsTable = pgTable("extractions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  invoiceNumber: text("invoice_number"),
  invoiceDate: text("invoice_date"),
  dueDate: text("due_date"),
  poNumber: text("po_number"),
  gstin: text("gstin"),
  vendorGstin: text("vendor_gstin"),
  vendorName: text("vendor_name"),
  vendorAddress: text("vendor_address"),
  vendorPhone: text("vendor_phone"),
  vendorEmail: text("vendor_email"),
  customerName: text("customer_name"),
  customerAddress: text("customer_address"),
  shipmentId: text("shipment_id"),
  warehouseId: text("warehouse_id"),
  lineItems: jsonb("line_items").notNull().default([]),
  subtotal: numeric("subtotal", { precision: 15, scale: 2 }),
  taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }),
  cgst: numeric("cgst", { precision: 15, scale: 2 }),
  sgst: numeric("sgst", { precision: 15, scale: 2 }),
  igst: numeric("igst", { precision: 15, scale: 2 }),
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }),
  currency: text("currency").default("INR"),
  paymentTerms: text("payment_terms"),
  bankDetails: text("bank_details"),
  rawText: text("raw_text"),
  fieldConfidences: jsonb("field_confidences").notNull().default({}),
  isHumanCorrected: boolean("is_human_corrected").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const insertExtractionSchema = createInsertSchema(extractionsTable).omit({ id: true, createdAt: true });
export type InsertExtraction = z.infer<typeof insertExtractionSchema>;
export type Extraction = typeof extractionsTable.$inferSelect;
