import { Outlet, Link, useLocation } from "react-router-dom";
import { ShieldCheck, Search as SearchIcon, GitCompare, Sparkles, Home } from "lucide-react";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: SearchIcon },
  { to: "/compare", label: "Compare", icon: GitCompare },
  { to: "/recommend", label: "Recommend", icon: Sparkles },
];

export default function Layout() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <header
        data-testid="site-header"
        className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          <Link to="/" data-testid="brand-link" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-sm bg-foreground flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-background" strokeWidth={2.4} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-xl tracking-tight">SMART BUY</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Real data · No fabrication
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => {
              const active = location.pathname === n.to || (n.to !== "/" && location.pathname.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  data-testid={`nav-${n.label.toLowerCase()}`}
                  className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${
                    active
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-sm border border-emerald-600/30 bg-emerald-50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 pulse-dot" />
              <span className="text-[11px] uppercase tracking-widest font-mono font-semibold text-emerald-700">
                Live · SerpAPI
              </span>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-border">
          <div className="max-w-7xl mx-auto px-2 flex items-center justify-around">
            {nav.map((n) => {
              const active = location.pathname === n.to;
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  data-testid={`mobile-nav-${n.label.toLowerCase()}`}
                  className={`flex-1 flex flex-col items-center py-2 text-[10px] uppercase tracking-widest font-mono ${
                    active ? "text-foreground" : "text-muted-foreground"
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

      <footer className="border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid gap-6 md:grid-cols-3">
          <div>
            <div className="font-display font-bold text-lg">SMART BUY</div>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Every product, price, and review shown here comes from a real source. If a data point isn't available, we say so — instead of making it up.
            </p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mb-2">Data sources</div>
            <ul className="text-sm space-y-1">
              <li>Google Shopping via SerpAPI</li>
              <li>Google Product Reviews (real snippets)</li>
              <li>Own price observations over time</li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mb-2">Guarantee</div>
            <p className="text-sm">
              No mock products. No fake reviews. No fabricated price history. If SMART BUY doesn't have real evidence, it doesn't present it.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
