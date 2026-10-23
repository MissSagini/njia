import "server-only";
import { eq } from "drizzle-orm";
import { adminDb, schema } from "@/db";

export { isSlotOpen, openCallSlots, type CallSlot } from "@/lib/calls/data";
export type PackageSummary = { name: string; priceKes: number; weeks: number };

/** The package on sale now, or null if none is set up. */
export async function activePackage(): Promise<(PackageSummary & { id: string }) | null> {
  const row = await adminDb().query.packages.findFirst({ where: eq(schema.packages.active, true) });
  return row ? { id: row.id, name: row.name, priceKes: row.priceKes, weeks: row.weeks } : null;
}
