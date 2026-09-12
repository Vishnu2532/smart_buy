import { Sparkles } from "lucide-react";

/**
 * Small model picker used above every AI panel.
 * Only two options: Gemini or GPT — both routed through Emergent LLM Key.
 */
export default function ModelPicker({ value = "gemini", onChange, className = "", size = "sm" }) {
  const opts = [
    { key: "gemini", label: "Gemini" },
    { key: "openai", label: "GPT" },
  ];
  const padCls = size === "xs" ? "text-[10px] px-2 py-1" : "text-[11px] px-2.5 py-1.5";
  return (
    <div
      role="tablist"
      aria-label="AI model"
      data-testid="model-picker"
      className={`inline-flex items-center gap-0.5 rounded-full bg-secondary border border-border p-0.5 ${className}`}
    >
      <span className="pl-2 pr-1 text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground hidden sm:inline">
        <Sparkles className="h-3 w-3 inline-block mr-1 -mt-0.5 text-accent" />
        AI
      </span>
      {opts.map((o) => (
        <button
          key={o.key}
          type="button"
          role="tab"
          aria-selected={value === o.key}
          onClick={() => onChange?.(o.key)}
          data-testid={`model-picker-${o.key}`}
          className={`font-mono font-semibold uppercase tracking-widest rounded-full transition-all ${padCls} ${
            value === o.key
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
