import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, documentsTable, validationsTable, auditLogsTable } from "@workspace/db";
import { SubmitReviewBody } from "@workspace/api-zod";

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

router.post("/documents/:id/review", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = SubmitReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    request_changes: "review_pending",
  };

  const newStatus = statusMap[parsed.data.action] ?? "review_pending";

  const [doc] = await db.update(documentsTable)
    .set({
      status: newStatus,
      reviewComment: parsed.data.comment ?? null,
      assignedTo: parsed.data.assignedTo ?? null,
      updatedAt: new Date(),
    })
    .where(eq(documentsTable.id, id))
    .returning();

  if (!doc) { res.status(404).json({ error: "Document not found" }); return; }

  await db.insert(auditLogsTable).values({
    documentId: id,
    action: `document_${parsed.data.action}d`,
    actor: parsed.data.assignedTo ?? "reviewer",
    details: { action: parsed.data.action, comment: parsed.data.comment },
  });

  res.json(formatDoc(doc));
});

router.get("/review-queue", async (req, res): Promise<void> => {
  const docs = await db.select().from(documentsTable)
    .where(eq(documentsTable.status, "review_pending"))
    .orderBy(desc(documentsTable.createdAt))
    .limit(50);

  const queue = await Promise.all(docs.map(async (doc) => {
    const issues = await db.select().from(validationsTable)
      .where(and(eq(validationsTable.documentId, doc.id), eq(validationsTable.status, "open")));

    return {
      document: formatDoc(doc),
      validationCount: issues.length,
      pendingSince: doc.updatedAt.toISOString(),
      assignedTo: doc.assignedTo ?? null,
    };
  }));

  res.json(queue);
});

export default router;
