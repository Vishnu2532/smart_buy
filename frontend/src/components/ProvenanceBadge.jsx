import { relativeTime } from "@/lib/api";

export default function ProvenanceBadge({ source, retrievedAt, compact = false }) {
  const label =
    source === "serpapi" || source === "serpapi_google_shopping"
      ? "Live · Google Shopping"
      : source === "serpapi_google_product"
      ? "Live · Google Product"
      : source === "stored"
      ? "Stored observation"
      : source || "Unknown source";
  const isLive = String(source || "").startsWith("serpapi");
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-sm border text-[10px] font-mono uppercase tracking-widest ${
        isLive
          ? "bg-emerald-50 border-emerald-600/30 text-emerald-700"
          : "bg-amber-50 border-amber-500/40 text-amber-800"
      }`}
      title={`Source: ${label}${retrievedAt ? ` · Updated ${relativeTime(retrievedAt)}` : ""}`}
    >
      {isLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 pulse-dot" />}
      <span>{compact ? (isLive ? "Live" : "Stored") : label}</span>
      {retrievedAt && !compact && <span className="text-muted-foreground">· {relativeTime(retrievedAt)}</span>}
    </div>
  );
}
