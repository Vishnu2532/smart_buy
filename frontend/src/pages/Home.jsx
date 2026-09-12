import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Database, ScanSearch, LineChart, Shield, Sparkles, Zap } from "lucide-react";
import { api, formatINR } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { TrustPill } from "@/components/TrustBadge";
import SmartBuyLogo from "@/components/SmartBuyLogo";

const EXAMPLES = [
  "Best phone under ₹30,000",
  "Laptop for college",
  "Sony WH-1000XM5",
  "Best TV under ₹50,000",
];

const PILLARS = [
  { icon: Database, title: "Real data", desc: "Products and prices come from legitimate sources like Google Shopping." },
  { icon: Sparkles, title: "AI with evidence", desc: "AI analyzes real information instead of inventing facts." },
  { icon: LineChart, title: "Price intelligence", desc: "Understand whether today's price is actually good — built from real snapshots." },
  { icon: ScanSearch, title: "Review insights", desc: "See what real buyers are saying, summarized fairly." },
];

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState([]);
  const [config, setConfig] = useState({ serpapi_configured: true, llm_configured: true });

  useEffect(() => {
    api.get("/health").then((r) => setConfig(r.data)).catch(() => {});
    api.get("/recent-products", { params: { limit: 8 } }).then((r) => setRecent(r.data.products || [])).catch(() => {});
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const query = q.trim();
    if (query.length < 2) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-hero border-b border-border/70">
        <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-7">
              <div className="fade-up">
                <TrustPill />
              </div>

              <h1 className="fade-up-delay-1 font-display text-[30px] leading-[1.1] sm:text-5xl lg:text-[72px] font-bold tracking-[-0.02em] break-words">
                Shopping advice you can{" "}
                <span className="italic text-accent">actually trust.</span>
              </h1>

              <p className="fade-up-delay-2 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                Compare real products, prices, sellers and reviews — then let AI ground its verdict in evidence, never fiction.
              </p>

              {/* Search */}
              <form onSubmit={submit} className="fade-up-delay-3 max-w-2xl">
                <div className="relative rounded-xl border border-border bg-card card-elevated overflow-hidden focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30 transition-all">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    data-testid="hero-search-input"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search real products, brands or shopping needs…"
                    className="w-full pl-12 pr-36 py-4 bg-transparent text-base focus:outline-none placeholder:text-muted-foreground/70"
                  />
                  <button
                    type="submit"
                    data-testid="hero-search-submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 bg-foreground text-background px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
                  >
                    Search <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => navigate(`/search?q=${encodeURIComponent(ex)}`)}
                      data-testid={`example-search-${ex.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
                      className="chip hover:bg-secondary hover:border-foreground/30 transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </form>

              {!config.serpapi_configured && (
                <div className="border-l-4 border-l-amber-500 bg-amber-50 p-4 text-sm rounded-r-md max-w-xl">
                  <strong>Live search is unavailable.</strong> The SerpAPI key is not configured — SMART BUY will not
                  show fabricated fallback products.
                </div>
              )}
            </div>

            {/* Right side card */}
            <div className="lg:col-span-5 fade-up-delay-2">
              <div className="relative rounded-2xl bg-card border border-border card-elevated overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
                <div className="p-6 sm:p-8 space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <SmartBuyLogo size={40} />
                    <span className="chip border-emerald-600/30 bg-emerald-50 text-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 pulse-dot" />
                      Verified sources
                    </span>
                  </div>
                  <div>
                    <div className="eyebrow mb-1">Live snapshot</div>
                    <div className="font-display text-2xl font-semibold tracking-tight">
                      {recent.length > 0 ? "Recently fetched · India" : "Google Shopping · India"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4 space-y-3">
                    {recent.length > 0 ? (
                      recent.slice(0, 3).map((row) => (
                        <div key={row.product_id} className="flex items-center justify-between gap-3 text-sm">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{row.product_name || "Untitled"}</div>
                            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground truncate">
                              {row.seller || "Seller unknown"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-mono font-semibold tabular text-sm">
                              {row.current_price ? formatINR(row.current_price) : "—"}
                            </span>
                            <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-600/25 px-1.5 py-0.5 rounded">
                              Live
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="space-y-3">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="flex items-center justify-between gap-3">
                            <div className="flex-1 space-y-1.5">
                              <div className="skeleton h-3 w-3/4" />
                              <div className="skeleton h-2 w-1/3" />
                            </div>
                            <div className="skeleton h-4 w-16" />
                          </div>
                        ))}
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground pt-1">
                          Run your first search to populate this feed
                        </p>
                      </div>
                    )}
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground pt-2 border-t border-border/70">
                      {recent.length > 0 ? "Live data · SerpAPI Google Shopping" : "Waiting for your first real search"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="h-3.5 w-3.5 text-accent" />
                    <span>Sub-second results from SerpAPI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST PILLARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-2xl mb-10">
          <div className="eyebrow mb-2">Why SMART BUY</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Evidence-based. <span className="italic text-accent">Always.</span>
          </h2>
          <p className="text-base text-muted-foreground mt-3">
            Four rules make SMART BUY different from every other AI shopping tool.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p, i) => (
            <div
              key={p.title}
              className={`relative rounded-xl border border-border bg-card p-6 hover:-translate-y-0.5 hover:card-elevated transition-all duration-200`}
            >
              <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center mb-4">
                <p.icon className="h-5 w-5 text-accent" />
              </div>
              <div className="font-display text-lg font-semibold tracking-tight">{p.title}</div>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">{p.desc}</p>
              <div className="absolute top-4 right-4 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                0{i + 1}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT REAL PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="eyebrow mb-1">Recently fetched from Google Shopping</div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Real products, real prices</h2>
          </div>
          {recent.length > 0 && (
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              {recent.length} live snapshots · Total observed value {formatINR(recent.reduce((s, p) => s + (p.current_price || 0), 0))}
            </div>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-12 text-center bg-secondary/30">
            <Shield className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No products have been fetched yet. Run your first real search above — SMART BUY only shows what Google Shopping actually returns.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {recent.slice(0, 8).map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-border/70 bg-secondary/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-5">
          <TrustPill className="mx-auto" label="Real Data · No Fabrication" />
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Buy smarter. <span className="italic text-accent">Decide better.</span>
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Describe what you actually need — SMART BUY picks from real Indian search results and shows you the reasoning.
          </p>
          <div className="flex items-center gap-3 justify-center flex-wrap">
            <button
              type="button"
              onClick={() => navigate("/recommend")}
              data-testid="cta-recommend"
              className="btn-primary"
            >
              Ask for a recommendation <Sparkles className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/search")}
              data-testid="cta-search"
              className="btn-secondary"
            >
              Search live products
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
