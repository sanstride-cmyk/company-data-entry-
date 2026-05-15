import { Router, type IRouter } from "express";
import { eq, and, ilike, desc, sql, gte, lte, inArray } from "drizzle-orm";
import { db, documentsTable, extractionsTable, validationsTable, auditLogsTable, vendorsTable } from "@workspace/db";
import {
  ListDocumentsQueryParams,
  CreateDocumentBody,
  GetDocumentParams,
  UpdateDocumentParams,
  UpdateDocumentBody,
  DeleteDocumentParams,
  ProcessDocumentParams,
  ReprocessDocumentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatDoc(doc: typeof documentsTable.$inferSelect) {
  return {
    ...doc,
    confidenceScore: doc.confidenceScore != null ? parseFloat(String(doc.confidenceScore)) : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    processingStartedAt: doc.processingStartedAt?.toISOString() ?? null,
    processingCompletedAt: doc.processingCompletedAt?.toISOString() ?? null,
  };
}

router.get("/documents", async (req, res): Promise<void> => {
  const parsed = ListDocumentsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { status, docType, vendorId, search, page, limit, dateFrom, dateTo } = parsed.data;
  const offset = ((page ?? 1) - 1) * (limit ?? 20);

  const conditions: ReturnType<typeof eq>[] = [];
  if (status) conditions.push(eq(documentsTable.status, status));
  if (docType) conditions.push(eq(documentsTable.docType, docType));
  if (vendorId != null) conditions.push(eq(documentsTable.vendorId, vendorId));
  if (search) conditions.push(ilike(documentsTable.fileName, `%${search}%`));
  if (dateFrom) conditions.push(gte(documentsTable.createdAt, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(documentsTable.createdAt, new Date(dateTo)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [documents, countResult] = await Promise.all([
    db.select().from(documentsTable).where(where).orderBy(desc(documentsTable.createdAt)).limit(limit ?? 20).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(documentsTable).where(where),
  ]);

  res.json({
    documents: documents.map(formatDoc),
    total: Number(countResult[0]?.count ?? 0),
    page: page ?? 1,
    limit: limit ?? 20,
  });
});

router.post("/documents", async (req, res): Promise<void> => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [doc] = await db.insert(documentsTable).values({
    ...parsed.data,
    status: "uploaded",
  }).returning();

  await db.insert(auditLogsTable).values({
    documentId: doc.id,
    action: "document_uploaded",
    actor: "system",
    details: { fileName: doc.fileName, docType: doc.docType },
  });

  res.status(201).json(formatDoc(doc));
});

router.get("/documents/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
  if (!doc) { res.status(404).json({ error: "Document not found" }); return; }

  res.json(formatDoc(doc));
});

router.patch("/documents/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateDocumentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [doc] = await db.update(documentsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(documentsTable.id, id))
    .returning();

  if (!doc) { res.status(404).json({ error: "Document not found" }); return; }

  await db.insert(auditLogsTable).values({
    documentId: doc.id,
    action: "document_updated",
    actor: "user",
    details: parsed.data,
  });

  res.json(formatDoc(doc));
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [doc] = await db.delete(documentsTable).where(eq(documentsTable.id, id)).returning();
  if (!doc) { res.status(404).json({ error: "Document not found" }); return; }

  res.sendStatus(204);
});

router.post("/documents/:id/process", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const now = new Date();
  const [doc] = await db.update(documentsTable)
    .set({ status: "processing", processingStartedAt: now, updatedAt: now })
    .where(eq(documentsTable.id, id))
    .returning();

  if (!doc) { res.status(404).json({ error: "Document not found" }); return; }

  // Simulate AI processing — in production this would call an AI service
  setTimeout(async () => {
    const confidence = 0.75 + Math.random() * 0.24;
    const completedNow = new Date();
    await db.update(documentsTable)
      .set({ status: "extracted", confidenceScore: String(confidence), processingCompletedAt: completedNow, updatedAt: completedNow })
      .where(eq(documentsTable.id, id));

    // Create a mock extraction
    const existing = await db.select().from(extractionsTable).where(eq(extractionsTable.documentId, id));
    if (existing.length === 0) {
      await db.insert(extractionsTable).values({
        documentId: id,
        invoiceNumber: `INV-${Math.floor(Math.random() * 90000) + 10000}`,
        invoiceDate: new Date().toISOString().split("T")[0],
        totalAmount: String((Math.random() * 100000 + 5000).toFixed(2)),
        currency: "INR",
        fieldConfidences: { invoiceNumber: confidence, totalAmount: confidence - 0.05 },
        lineItems: [],
      });
    }

    await db.insert(auditLogsTable).values({
      documentId: id,
      action: "document_processed",
      actor: "ai_engine",
      details: { confidence },
    });
  }, 2000);

  res.json(formatDoc(doc));
});

router.post("/documents/:id/reprocess", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const now = new Date();
  const [doc] = await db.update(documentsTable)
    .set({ status: "processing", processingStartedAt: now, updatedAt: now })
    .where(eq(documentsTable.id, id))
    .returning();

  if (!doc) { res.status(404).json({ error: "Document not found" }); return; }

  await db.insert(auditLogsTable).values({
    documentId: id,
    action: "document_reprocessed",
    actor: "user",
    details: {},
  });

  res.json(formatDoc(doc));
});

export default router;
