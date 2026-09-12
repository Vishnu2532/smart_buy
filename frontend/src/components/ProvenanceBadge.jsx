import { relativeTime } from "@/lib/api";

/**
 * Source provenance badge. Always shows where data actually came from.
 */
export default function SourceBadge({ source, retrievedAt, compact = false, className = "" }) {
  const s = String(source || "");
  const isLive = s.startsWith("serpapi");
  const label = isLive
    ? s.includes("product")
      ? "Google Product"
      : "Google Shopping"
    : s || "Unknown source";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-widest ${
        isLive
          ? "bg-emerald-50 border-emerald-600/25 text-emerald-800"
          : "bg-amber-50 border-amber-500/30 text-amber-800"
      } ${className}`}
      title={`Source: ${label}${retrievedAt ? ` · Updated ${relativeTime(retrievedAt)}` : ""}`}
    >
      {isLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 pulse-dot" />}
      {compact ? (isLive ? "Live" : "Stored") : label}
      {retrievedAt && !compact && <span className="text-muted-foreground normal-case tracking-normal">· {relativeTime(retrievedAt)}</span>}
    </span>
  );
}
