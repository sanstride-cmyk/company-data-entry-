import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, validationsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/documents/:id/validations", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const issues = await db.select().from(validationsTable).where(eq(validationsTable.documentId, id));
  res.json(issues.map(v => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
  })));
});

export default router;
