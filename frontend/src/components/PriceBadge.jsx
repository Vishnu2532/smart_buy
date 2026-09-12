import { formatINR } from "@/lib/api";

/**
 * Premium tabular price display. Automatically hides missing pieces.
 */
export default function PriceBadge({ current, original, size = "md" }) {
  const cur = formatINR(current);
  const orig = formatINR(original);
  const discount =
    current && original && original > current ? Math.round(((original - current) / original) * 100) : null;

  const bigCls =
    size === "lg"
      ? "font-display text-3xl sm:text-4xl"
      : size === "sm"
      ? "font-mono text-lg"
      : "font-mono text-xl sm:text-2xl";

  if (!cur) return <span className="text-sm italic text-muted-foreground">Price not available</span>;
  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className={`${bigCls} font-bold tracking-tight tabular text-foreground`} data-testid="price-current">
        {cur}
      </span>
      {orig && discount !== null && (
        <>
          <span className="font-mono text-xs sm:text-sm line-through text-muted-foreground tabular">{orig}</span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-600/25 px-1.5 py-0.5 rounded">
            {discount}% off
          </span>
        </>
      )}
    </div>
  );
}
