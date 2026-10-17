import { cx } from "@/lib/cx";

type ChoiceChipProps = {
  label: string;
  sub?: string;
  selected?: boolean;
  /** "Taken": struck through and can't be tapped. */
  disabled?: boolean;
  onPick?: () => void;
  height?: number;
  align?: "center" | "start";
  className?: string;
};

/** For call times, days, payment methods and filters. */
export function ChoiceChip({ label, sub, selected, disabled, onPick, height = 44, align = "center", className }: ChoiceChipProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onPick}
      disabled={disabled}
      aria-pressed={selected ? "true" : "false"}
      aria-label={disabled ? `${label}${sub ? ` ${sub}` : ""}, taken` : undefined}
      className={cx(
        "flex w-full min-w-11 flex-col justify-center gap-0.5 rounded-md px-2.5 py-1.5 font-body text-[16px] leading-6",
        align === "start" ? "items-start text-left" : "items-center text-center",
        disabled
          ? "cursor-not-allowed border border-line bg-cream text-ink-muted line-through"
          : selected
            ? "cursor-pointer border-2 border-forest bg-forest-soft text-forest"
            : "cursor-pointer border border-line bg-white text-ink hover:border-ink-muted",
        className,
      )}
      style={{ minHeight: height }}
    >
      <span className="font-bold">{label}</span>
      {sub ? <span className={cx("text-small font-medium", selected && !disabled ? "text-forest" : "text-ink-muted")}>{sub}</span> : null}
    </button>
  );
}
