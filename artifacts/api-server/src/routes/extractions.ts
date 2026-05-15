import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, extractionsTable, auditLogsTable } from "@workspace/db";
import { UpdateExtractionBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatExtraction(e: typeof extractionsTable.$inferSelect) {
  return {
    ...e,
    subtotal: e.subtotal != null ? parseFloat(String(e.subtotal)) : null,
    taxAmount: e.taxAmount != null ? parseFloat(String(e.taxAmount)) : null,
    cgst: e.cgst != null ? parseFloat(String(e.cgst)) : null,
    sgst: e.sgst != null ? parseFloat(String(e.sgst)) : null,
    igst: e.igst != null ? parseFloat(String(e.igst)) : null,
    totalAmount: e.totalAmount != null ? parseFloat(String(e.totalAmount)) : null,
    lineItems: Array.isArray(e.lineItems) ? e.lineItems : [],
    fieldConfidences: (e.fieldConfidences && typeof e.fieldConfidences === "object") ? e.fieldConfidences : {},
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt?.toISOString() ?? null,
  };
}

router.get("/documents/:id/extraction", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [extraction] = await db.select().from(extractionsTable).where(eq(extractionsTable.documentId, id));
  if (!extraction) { res.status(404).json({ error: "Extraction not found" }); return; }

  res.json(formatExtraction(extraction));
});

router.patch("/documents/:id/extraction", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateExtractionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [extraction] = await db.update(extractionsTable)
    .set({ ...parsed.data, isHumanCorrected: true, updatedAt: new Date() })
    .where(eq(extractionsTable.documentId, id))
    .returning();

  if (!extraction) { res.status(404).json({ error: "Extraction not found" }); return; }

  await db.insert(auditLogsTable).values({
    documentId: id,
    action: "extraction_corrected",
    actor: "user",
    details: parsed.data,
  });

  res.json(formatExtraction(extraction));
});

export default router;
