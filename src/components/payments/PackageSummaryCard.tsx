import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { formatKes } from "@/lib/money";

const INCLUDED = [
  "A Kenyan mentor who studied at your dream university",
  "Weekly sessions on Google Meet, with notes",
  "A short task list each week",
  "A weekly progress report for your parent",
];

/** The package price and what it includes. */
export function PackageSummaryCard({ pkg }: { pkg: { priceKes: number; weeks: number } | null }) {
  return (
    <Card tone="tint" eyebrow="What you'll pay" title={pkg ? `${formatKes(pkg.priceKes)} for ${pkg.weeks} weeks` : "Your mentorship package"}>
      <ul className="m-0 flex list-none flex-col gap-2 p-0 pt-1">
        {INCLUDED.map((i) => (
          <li key={i} className="flex items-start gap-2 text-ink">
            <Icon name="check" size={20} color="var(--color-forest)" style={{ marginTop: 3 }} />
            {i}
          </li>
        ))}
      </ul>
      <p className="m-0 pt-3">Pay by M-Pesa or card (Visa or Mastercard). The M-Pesa prompt can go to your parent&apos;s phone.</p>
    </Card>
  );
}
