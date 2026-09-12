import { TrendingDown, TrendingUp, Minus, Circle } from "lucide-react";

const TONE = {
  positive: {
    icon: TrendingDown,
    cls: "bg-emerald-600 text-white border-emerald-700",
  },
  neutral: {
    icon: Minus,
    cls: "bg-secondary text-foreground border-border",
  },
  negative: {
    icon: TrendingUp,
    cls: "bg-rose-600 text-white border-rose-700",
  },
  insufficient: {
    icon: Circle,
    cls: "bg-card text-muted-foreground border-dashed border-border",
  },
};

export default function DealBadge({ deal }) {
  if (!deal) return null;
  const tone = deal.label === "Insufficient history" ? "insufficient" : deal.tone || "neutral";
  const style = TONE[tone] || TONE.neutral;
  const Icon = style.icon;
  return (
    <span
      data-testid="deal-badge"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-widest ${style.cls}`}
    >
      <Icon className="h-3 w-3" />
      {deal.label}
    </span>
  );
}
