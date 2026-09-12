import { CheckCircle2 } from "lucide-react";

export function TrustPill({ label = "Real data · No fabrication", className = "" }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-emerald-600/25 bg-emerald-50 px-3 py-1.5 ${className}`}
      data-testid="trust-pill"
    >
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" strokeWidth={2.4} />
      <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-emerald-800">
        {label}
      </span>
    </div>
  );
}

export function LivePill({ configured, className = "" }) {
  if (configured === false) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-50 px-3 py-1.5 ${className}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-amber-800">
          Live data unavailable
        </span>
      </div>
    );
  }
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-emerald-600/25 bg-emerald-50 px-3 py-1.5 ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 pulse-dot" />
      <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-emerald-800">
        Live · SerpAPI
      </span>
    </div>
  );
}
