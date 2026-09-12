import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShieldCheck, X, TrendingUp, Sparkles, Database } from "lucide-react";
import { api, formatINR } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

const EXAMPLES = ["Apple iPhone 15", "Sony WH-1000XM5", "Samsung Galaxy S24", "Dyson V15"];

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState([]);
  const [config, setConfig] = useState({ serpapi_configured: true, llm_configured: true });

  useEffect(() => {
    api.get("/health").then((r) => setConfig(r.data)).catch(() => {});
    api.get("/recent-products", { params: { limit: 6 } }).then((r) => setRecent(r.data.products || [])).catch(() => {});
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const query = q.trim();
    if (query.length < 2) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="fade-up">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-background to-secondary/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-border bg-background">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[10px] uppercase tracking-widest font-mono font-semibold">
                Zero fake data · Verified sources
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              Shopping advice you can actually
              <span className="italic text-accent"> trust.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Every product, price, seller, rating and review on SMART BUY is fetched from a real source — never generated,
              never imagined. If evidence is missing, we say so instead of making it up.
            </p>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-xl">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  data-testid="hero-search-input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search real Indian Google Shopping — e.g. iPhone 15, Sony WH-1000XM5"
                  className="w-full pl-10 pr-10 py-3 bg-background border border-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                data-testid="hero-search-submit"
                className="px-5 py-3 bg-foreground text-background text-sm font-semibold rounded-sm hover:bg-accent transition-colors"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(ex)}`)}
                  data-testid={`example-search-${ex.replace(/\s+/g, "-").toLowerCase()}`}
                  className="text-xs font-mono px-2.5 py-1.5 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>

            {!config.serpapi_configured && (
              <div className="mt-4 border-l-4 border-l-amber-500 bg-amber-50 p-4 text-sm rounded-r-sm">
                <strong>Live search is unavailable.</strong> The SerpAPI key is not configured on the server, so
                SMART BUY cannot fetch real products. No fake fallback will be shown.
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-sm border border-border bg-card p-6 space-y-5 shadow-sm">
              <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Data policy</div>
              <ul className="space-y-4">
                {[
                  { icon: Database, title: "Real products only", desc: "Sourced live from Google Shopping via SerpAPI." },
                  { icon: TrendingUp, title: "Real price history", desc: "Built from actual snapshots — never fabricated to fill a chart." },
                  { icon: Sparkles, title: "AI that only analyzes", desc: "Gemini reads real reviews. It never invents reviews or ratings." },
                ].map((f) => (
                  <li key={f.title} className="flex gap-3">
                    <div className="h-9 w-9 rounded-sm border border-border bg-background flex items-center justify-center flex-shrink-0">
                      <f.icon className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{f.title}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Recent real products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mb-1">
              Recently fetched from Google Shopping
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Real products, real prices</h2>
          </div>
        </div>
        {recent.length === 0 ? (
          <div className="border border-dashed border-border rounded-sm p-10 text-center bg-secondary/30">
            <p className="text-sm text-muted-foreground">
              No products have been fetched yet. Run your first real search above — SMART BUY will show only what Google Shopping actually returns.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recent.map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </div>
        )}
        {recent.length > 0 && (
          <p className="text-xs font-mono text-muted-foreground mt-6">
            Total observed value: {formatINR(recent.reduce((s, p) => s + (p.current_price || 0), 0))} across {recent.length} real snapshots
          </p>
        )}
      </section>
    </div>
  );
}
