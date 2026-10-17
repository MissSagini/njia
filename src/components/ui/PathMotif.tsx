type PathMotifProps = {
  tone?: "light" | "dark";
  count?: 3 | 4;
  size?: number;
  className?: string;
};

/** Rising stepping-stone dots, warm leading to a solid final dot. Use once per page at most. */
export function PathMotif({ tone = "light", count = 4, size = 1, className }: PathMotifProps) {
  const warm =
    tone === "dark"
      ? ["var(--color-ochre)", "var(--color-ochre)", "var(--color-ochre)"]
      : ["var(--color-ochre)", "var(--color-ochre)", "var(--color-sunset)"];
  const end = tone === "dark" ? "var(--color-cream)" : "var(--color-forest)";
  const colors = [...warm.slice(3 - (count - 1)), end];
  const base = [14, 16, 18, 24].slice(4 - count);
  const rise = 12 * size;
  const total = rise * (count - 1) + base[count - 1] * size;

  return (
    <div aria-hidden className={className} style={{ display: "inline-flex", alignItems: "flex-end", gap: 14 * size, height: total }}>
      {colors.map((c, i) => (
        <span
          key={i}
          className="flex-none rounded-pill"
          style={{ width: base[i] * size, height: base[i] * size, background: c, marginBottom: rise * i }}
        />
      ))}
    </div>
  );
}
