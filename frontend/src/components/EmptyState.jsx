import { Info, RotateCcw } from "lucide-react";

/**
 * Honest empty-state block used throughout the app. Never replaced with fake data.
 */
export default function EmptyState({ title, description, action, icon: Icon = Info, tone = "neutral" }) {
  const cls =
    tone === "warning"
      ? "border-amber-500/40 bg-amber-50/60"
      : tone === "error"
      ? "border-rose-500/40 bg-rose-50/60"
      : "border-border bg-secondary/30";
  return (
    <div
      data-testid="empty-state"
      className={`border border-dashed rounded-xl p-8 sm:p-10 ${cls} flex flex-col items-center text-center gap-4`}
    >
      <div className="h-12 w-12 rounded-full bg-background border border-border flex items-center justify-center">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="max-w-md space-y-1.5">
        <h3 className="font-display text-lg sm:text-xl font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export { RotateCcw as RetryIcon };
