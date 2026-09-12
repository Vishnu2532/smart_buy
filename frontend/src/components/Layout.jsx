import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Search as SearchIcon, GitCompare, Sparkles, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import SmartBuyLogo from "@/components/SmartBuyLogo";
import { LivePill } from "@/components/TrustBadge";
import { api } from "@/lib/api";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: SearchIcon },
  { to: "/compare", label: "Compare", icon: GitCompare },
  { to: "/recommend", label: "Recommend", icon: Sparkles },
  { to: "/chat", label: "Chat", icon: MessageSquare },
];

export default function Layout() {
  const location = useLocation();
  const [config, setConfig] = useState({ serpapi_configured: true, llm_configured: true });
  useEffect(() => {
    api.get("/health").then((r) => setConfig(r.data)).catch(() => setConfig({ serpapi_configured: false }));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header
        data-testid="site-header"
        className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/70"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          <Link to="/" data-testid="brand-link" className="flex items-center gap-3 group">
            <SmartBuyLogo size={34} />
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-lg sm:text-xl tracking-tight">
                SMART <span className="text-accent">BUY</span>
              </span>
              <span className="mt-1 hidden sm:block text-[9px] font-mono font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Buy smarter · Decide better
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
            {NAV.map((n) => {
              const active = n.to === "/" ? location.pathname === "/" : location.pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  data-testid={`nav-${n.label.toLowerCase()}`}
                  className={`relative px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n.label}
                  {active && (
                    <span className="absolute left-3 right-3 -bottom-0.5 h-0.5 bg-accent rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden sm:block">
            <LivePill configured={config.serpapi_configured} />
          </div>
        </div>

        <div className="md:hidden border-t border-border/70">
          <div className="max-w-7xl mx-auto px-2 flex items-center justify-around">
            {NAV.map((n) => {
              const active = n.to === "/" ? location.pathname === "/" : location.pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  data-testid={`mobile-nav-${n.label.toLowerCase()}`}
                  className={`flex-1 flex flex-col items-center py-2 text-[10px] uppercase tracking-widest font-mono transition-colors ${
                    active ? "text-accent" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 mb-0.5" />
                  {n.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-24 border-t border-border/70 bg-secondary/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <SmartBuyLogo size={40} showWordmark />
            <p className="text-sm text-muted-foreground mt-4 max-w-md leading-relaxed">
              Every product, price and review shown here comes from a real source. If a data point isn't available, we say so — instead of making it up.
            </p>
          </div>
          <div>
            <div className="eyebrow mb-3">Data sources</div>
            <ul className="text-sm space-y-2 text-foreground/80">
              <li>Google Shopping · SerpAPI</li>
              <li>Real product-page reviews</li>
              <li>Own price observations</li>
            </ul>
          </div>
          <div>
            <div className="eyebrow mb-3">Guarantee</div>
            <p className="text-sm text-foreground/80">
              No mock products. No fake reviews. No fabricated price history. Ever.
            </p>
          </div>
        </div>
        <div className="border-t border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground">
            <span>© {new Date().getFullYear()} SMART BUY · Buy smarter. Decide better.</span>
            <span>Real Data · No Fabrication</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
