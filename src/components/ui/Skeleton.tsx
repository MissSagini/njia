import { cx } from "@/lib/cx";

const ROW_WIDTHS = ["70%", "55%", "80%", "60%"];

type SkeletonProps = {
  /** Read out by screen readers, like "Loading your sessions". */
  label?: string;
  rows?: number;
  avatar?: boolean;
};

/** Line-coloured blocks in the shape of the content to come. No shimmer, to stay light on mobile data. */
export function Skeleton({ label = "Loading", rows = 3, avatar }: SkeletonProps) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-4">
      <div className="flex items-center gap-4 rounded-md border border-line bg-white p-4">
        {avatar ? <div className="size-16 flex-none rounded-pill bg-line" /> : null}
        <div className="flex flex-1 flex-col gap-3">
          <div className="h-3.5 w-2/5 rounded-sm bg-line" />
          <div className="h-[22px] w-3/4 rounded-sm bg-line" />
          <div className="h-3.5 w-[55%] rounded-sm bg-line" />
        </div>
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-[54px] items-center gap-3 rounded-md border border-line bg-white px-4">
          <div className="size-5 flex-none rounded-sm bg-line" />
          <div className="h-3.5 rounded-sm bg-line" style={{ width: ROW_WIDTHS[i % ROW_WIDTHS.length] }} />
        </div>
      ))}
    </div>
  );
}

/** A single block for custom skeleton layouts. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div aria-hidden className={cx("rounded-sm bg-line", className)} />;
}
