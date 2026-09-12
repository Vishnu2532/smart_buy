import { Info } from "lucide-react";

/** Honest empty-state block used throughout the app. Never replaced with fake data. */
export default function EmptyState({ title, description, action, icon: Icon = Info }) {
  return (
    <div
      data-testid="empty-state"
      className="border border-dashed border-border rounded-sm p-8 bg-secondary/30 flex flex-col items-center text-center gap-3"
    >
      <div className="h-10 w-10 rounded-full bg-background border border-border flex items-center justify-center">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="max-w-md">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>}
      </div>
      {action}
    </div>
  );
}
