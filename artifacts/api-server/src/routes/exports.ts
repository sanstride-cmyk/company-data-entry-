import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, exportJobsTable, auditLogsTable } from "@workspace/db";
import { CreateExportJobBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatJob(j: typeof exportJobsTable.$inferSelect) {
  return {
    ...j,
    documentIds: Array.isArray(j.documentIds) ? j.documentIds : [],
    fieldMapping: (j.fieldMapping && typeof j.fieldMapping === "object" && !Array.isArray(j.fieldMapping)) ? j.fieldMapping : {},
    createdAt: j.createdAt.toISOString(),
    completedAt: j.completedAt?.toISOString() ?? null,
  };
}

router.get("/export-jobs", async (_req, res): Promise<void> => {
  const jobs = await db.select().from(exportJobsTable).orderBy(exportJobsTable.createdAt);
  res.json(jobs.map(formatJob));
});

router.post("/export-jobs", async (req, res): Promise<void> => {
  const parsed = CreateExportJobBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [job] = await db.insert(exportJobsTable).values({
    exportFormat: parsed.data.exportFormat,
    documentIds: parsed.data.documentIds,
    documentCount: parsed.data.documentIds.length,
    fieldMapping: parsed.data.fieldMapping ?? {},
    status: "pending",
  }).returning();

  // Simulate processing
  setTimeout(async () => {
    await db.update(exportJobsTable)
      .set({ status: "completed", completedAt: new Date(), downloadUrl: `/api/export-jobs/${job.id}/download` })
      .where(eq(exportJobsTable.id, job.id));

    await db.insert(auditLogsTable).values({
      action: "export_completed",
      actor: "system",
      details: { exportJobId: job.id, format: job.exportFormat, count: job.documentCount },
    });
  }, 3000);

  res.status(201).json(formatJob(job));
});

router.get("/export-jobs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [job] = await db.select().from(exportJobsTable).where(eq(exportJobsTable.id, id));
  if (!job) { res.status(404).json({ error: "Export job not found" }); return; }

  res.json(formatJob(job));
});

export default router;
