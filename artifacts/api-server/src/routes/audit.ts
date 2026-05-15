import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, auditLogsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/audit-logs", async (req, res): Promise<void> => {
  const { documentId, actor, action, page, limit } = req.query as Record<string, string>;
  const pageNum = parseInt(page ?? "1", 10);
  const limitNum = parseInt(limit ?? "50", 10);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (documentId) conditions.push(eq(auditLogsTable.documentId, parseInt(documentId, 10)));
  if (actor) conditions.push(eq(auditLogsTable.actor, actor));
  if (action) conditions.push(eq(auditLogsTable.action, action));

  const logs = await db.select().from(auditLogsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(limitNum)
    .offset(offset);

  res.json(logs.map(l => ({
    ...l,
    details: l.details ?? {},
    createdAt: l.createdAt.toISOString(),
  })));
});

export default router;
