import { Link, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";

/**
 * Floating Ask SMART BUY button. Hidden on the /chat page itself.
 */
export default function FloatingAsk() {
  const location = useLocation();
  if (location.pathname.startsWith("/chat")) return null;
  return (
    <Link
      to="/chat"
      data-testid="floating-ask"
      className="group fixed z-30 bottom-5 right-5 sm:bottom-6 sm:right-6 inline-flex items-center gap-2 rounded-full bg-foreground text-background pl-3 pr-4 py-3 shadow-lg border border-foreground hover:bg-accent hover:border-accent transition-colors"
      aria-label="Ask SMART BUY"
    >
      <span className="h-7 w-7 rounded-full bg-accent group-hover:bg-background/20 flex items-center justify-center transition-colors">
        <Sparkles className="h-4 w-4 text-background group-hover:text-background" />
      </span>
      <span className="text-sm font-semibold hidden sm:inline">Ask SMART BUY</span>
      <span className="text-sm font-semibold sm:hidden">Ask</span>
    </Link>
  );
}
