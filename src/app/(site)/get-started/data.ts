import "server-only";
import { and, asc, eq, gt, lt, ne, notExists } from "drizzle-orm";
import { adminDb, schema } from "@/db";

/** How far ahead free call times are offered, and the least notice the team needs. */
const BOOKING_WINDOW_DAYS = 14;
const MIN_NOTICE_HOURS = 2;

export type CallSlot = { id: string; startsAt: string };
export type PackageSummary = { name: string; priceKes: number; weeks: number };

/**
 * Open free call times. Read with the server's access because visitors aren't
 * signed in; only the start times leave the server.
 */
export async function openCallSlots(): Promise<CallSlot[]> {
  const now = Date.now();
  const from = new Date(now + MIN_NOTICE_HOURS * 3_600_000);
  const to = new Date(now + BOOKING_WINDOW_DAYS * 86_400_000);
  const { consultationSlots: slots, consultations } = schema;

  const rows = await adminDb()
    .select({ id: slots.id, startsAt: slots.startsAt })
    .from(slots)
    .where(
      and(
        gt(slots.startsAt, from),
        lt(slots.startsAt, to),
        notExists(
          adminDb()
            .select({ id: consultations.id })
            .from(consultations)
            .where(and(eq(consultations.slotId, slots.id), ne(consultations.status, "cancelled"))),
        ),
      ),
    )
    .orderBy(asc(slots.startsAt));

  return rows.map((r) => ({ id: r.id, startsAt: r.startsAt.toISOString() }));
}

/** Whether a slot can still be booked. The unique index on consultations is the real guard. */
export async function isSlotOpen(slotId: string): Promise<boolean> {
  const slots = await openCallSlots();
  return slots.some((s) => s.id === slotId);
}

/** The package on sale now, or null if none is set up. */
export async function activePackage(): Promise<(PackageSummary & { id: string }) | null> {
  const row = await adminDb().query.packages.findFirst({ where: eq(schema.packages.active, true) });
  return row ? { id: row.id, name: row.name, priceKes: row.priceKes, weeks: row.weeks } : null;
}
