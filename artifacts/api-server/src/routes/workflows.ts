import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, workflowTasksTable, auditLogsTable } from "@workspace/db";
import { CreateWorkflowTaskBody, ActOnWorkflowTaskBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatTask(t: typeof workflowTasksTable.$inferSelect) {
  return {
    ...t,
    createdAt: t.createdAt.toISOString(),
    completedAt: t.completedAt?.toISOString() ?? null,
  };
}

router.get("/workflow-tasks", async (req, res): Promise<void> => {
  const { status, assignedTo } = req.query as { status?: string; assignedTo?: string };
  const conditions = [];
  if (status) conditions.push(eq(workflowTasksTable.status, status));
  if (assignedTo) conditions.push(eq(workflowTasksTable.assignedTo, assignedTo));

  const tasks = await db.select().from(workflowTasksTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(workflowTasksTable.createdAt);

  res.json(tasks.map(formatTask));
});

router.post("/workflow-tasks", async (req, res): Promise<void> => {
  const parsed = CreateWorkflowTaskBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [task] = await db.insert(workflowTasksTable).values(parsed.data).returning();

  res.status(201).json(formatTask(task));
});

router.post("/workflow-tasks/:id/action", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = ActOnWorkflowTaskBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    escalate: "escalated",
  };

  const [task] = await db.update(workflowTasksTable)
    .set({
      status: statusMap[parsed.data.action] ?? "pending",
      comment: parsed.data.comment ?? null,
      completedAt: new Date(),
      completedBy: parsed.data.completedBy,
    })
    .where(eq(workflowTasksTable.id, id))
    .returning();

  if (!task) { res.status(404).json({ error: "Task not found" }); return; }

  await db.insert(auditLogsTable).values({
    documentId: task.documentId,
    action: `workflow_task_${parsed.data.action}d`,
    actor: parsed.data.completedBy,
    details: { taskId: id, action: parsed.data.action },
  });

  res.json(formatTask(task));
});

export default router;
