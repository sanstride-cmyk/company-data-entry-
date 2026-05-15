import { Router, type IRouter } from "express";
import { eq, ilike } from "drizzle-orm";
import { db, vendorsTable } from "@workspace/db";
import { CreateVendorBody, UpdateVendorBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatVendor(v: typeof vendorsTable.$inferSelect) {
  return {
    ...v,
    createdAt: v.createdAt.toISOString(),
  };
}

router.get("/vendors", async (req, res): Promise<void> => {
  const { search } = req.query as { search?: string };
  const vendors = search
    ? await db.select().from(vendorsTable).where(ilike(vendorsTable.name, `%${search}%`))
    : await db.select().from(vendorsTable);
  res.json(vendors.map(formatVendor));
});

router.post("/vendors", async (req, res): Promise<void> => {
  const parsed = CreateVendorBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [vendor] = await db.insert(vendorsTable).values(parsed.data).returning();
  res.status(201).json(formatVendor(vendor));
});

router.get("/vendors/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, id));
  if (!vendor) { res.status(404).json({ error: "Vendor not found" }); return; }

  res.json(formatVendor(vendor));
});

router.patch("/vendors/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateVendorBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [vendor] = await db.update(vendorsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(vendorsTable.id, id))
    .returning();

  if (!vendor) { res.status(404).json({ error: "Vendor not found" }); return; }

  res.json(formatVendor(vendor));
});

export default router;
