import type { Metadata } from "next";
import Link from "next/link";
import { AdminPage, LoadError } from "@/components/admin/AdminPage";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { paymentsLedger } from "@/lib/admin/data";
import { requireViewer } from "@/lib/auth/dal";
import { formatKes } from "@/lib/money";
import { formatDayEat, formatTimeEat } from "@/lib/time";

export const metadata: Metadata = { title: "Payments" };

const STATUS = {
  succeeded: { label: "Paid", variant: "tag" },
  pending: { label: "Waiting", variant: "neutral" },
  failed: { label: "Failed", variant: "neutral" },
} as const;

export default function AdminPaymentsPage() {
  return (
    <AdminPage title="Payments" intro="Every M-Pesa and card payment, and what each student still owes." loading="Loading payments">
      <Ledger />
    </AdminPage>
  );
}

async function Ledger() {
  const viewer = await requireViewer(["admin"]);
  let ledger;
  try {
    ledger = await paymentsLedger(viewer);
  } catch (error) {
    console.error("admin: payments failed", (error as { code?: string }).code);
    return <LoadError what="The payments" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Still to pay">
        {ledger.outstanding.length ? (
          <ul className="m-0 flex list-none flex-col p-0">
            {ledger.outstanding.map((o) => (
              <li key={o.studentId} className="flex min-h-12 items-center justify-between gap-3 border-t border-line py-2 first:border-t-0">
                <Link href={`/admin/students/${o.studentId}`}>{o.studentName}</Link>
                <span className="font-semibold">{formatKes(o.balanceKes)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-body text-ink-muted">Nobody owes anything.</p>
        )}
      </Panel>

      <Panel title="Payments" description="Newest first. Times in East Africa Time.">
        {ledger.payments.length ? (
          <ul className="m-0 flex list-none flex-col p-0">
            {ledger.payments.map((p) => (
              <li key={p.id} className="flex flex-col gap-1 border-t border-line py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col">
                  <Link href={`/admin/students/${p.studentId}`}>{p.studentName}</Link>
                  <span className="text-small text-ink-muted">
                    {formatDayEat(p.at)}, {formatTimeEat(p.at)} · {p.method === "mpesa" ? "M-Pesa" : "Card"}
                    {p.reference ? ` · ${p.reference}` : ""}
                  </span>
                </div>
                <span className="flex items-center gap-3">
                  <span className="font-semibold">{formatKes(p.amountKes)}</span>
                  <Badge variant={STATUS[p.status].variant}>{STATUS[p.status].label}</Badge>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="credit-card" title="No payments yet.">
            M-Pesa and card payments will show here as they come in.
          </EmptyState>
        )}
      </Panel>
    </div>
  );
}
