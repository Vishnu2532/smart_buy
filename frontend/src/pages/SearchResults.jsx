import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, AlertTriangle, SlidersHorizontal, X, GitCompare } from "lucide-react";
import { toast } from "sonner";
import { api, relativeTime } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import EmptyState from "@/components/EmptyState";
import { ProductGridSkeleton } from "@/components/LoadingSkeleton";

const SORTS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: low → high" },
  { value: "price-desc", label: "Price: high → low" },
  { value: "rating", label: "Rating" },
  { value: "discount", label: "Discount" },
];

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get("q") || "";
  const sort = params.get("sort") || "relevance";
  const [input, setInput] = useState(q);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [compare, setCompare] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("smartbuy_compare") || "[]"); } catch { return []; }
  });
  const [minPrice, setMinPrice] = useState(params.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(params.get("max_price") || "");
  const [minRating, setMinRating] = useState(params.get("min_rating") || "");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { setInput(q); }, [q]);

  useEffect(() => {
    if (!q) { setData(null); return; }
    setLoading(true); setError(null);
    const p = { q, sort };
    if (minPrice) p.min_price = Number(minPrice);
    if (maxPrice) p.max_price = Number(maxPrice);
    if (minRating) p.min_rating = Number(minRating);
    api.get("/search", { params: p })
      .then((r) => setData(r.data))
      .catch((e) => {
        setData(null);
        setError(e?.response?.data?.detail || e.message || "Live search failed.");
      })
      .finally(() => setLoading(false));
  }, [q, sort, minPrice, maxPrice, minRating]);

  const inCompare = useMemo(() => new Set(compare.map((p) => p.product_id)), [compare]);
  const toggleCompare = (p) => {
    let next;
    if (inCompare.has(p.product_id)) {
      next = compare.filter((x) => x.product_id !== p.product_id);
    } else {
      if (compare.length >= 2) { toast.warning("You can compare at most 2 products."); return; }
      next = [...compare, p];
    }
    setCompare(next);
    sessionStorage.setItem("smartbuy_compare", JSON.stringify(next));
    if (next.length === 2) toast.success("Two products selected. Open Compare for the AI verdict.");
  };

  const submit = (e) => {
    e.preventDefault();
    if (input.trim().length < 2) return;
    const next = new URLSearchParams(params);
    next.set("q", input.trim());
    setParams(next);
  };

  const setSort = (v) => {
    const next = new URLSearchParams(params);
    next.set("sort", v);
    setParams(next);
  };

  const resetFilters = () => { setMinPrice(""); setMaxPrice(""); setMinRating(""); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-up">
      {/* Search bar */}
      <form onSubmit={submit} className="relative rounded-xl border border-border bg-card overflow-hidden focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30 transition-all mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          data-testid="search-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search real Google Shopping…"
          className="w-full pl-12 pr-32 py-3.5 bg-transparent text-base focus:outline-none placeholder:text-muted-foreground/70"
        />
        <button
          type="submit"
          data-testid="search-submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
        >
          Search
        </button>
      </form>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Filter sidebar (desktop) */}
        <aside className="lg:col-span-3 hidden lg:block">
          <div className="rounded-xl border border-border bg-card p-5 space-y-5 sticky top-24">
            <div className="flex items-center justify-between">
              <div className="eyebrow">Filters</div>
              <button onClick={resetFilters} className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground">
                Reset
              </button>
            </div>
            <FilterFields
              minPrice={minPrice} setMinPrice={setMinPrice}
              maxPrice={maxPrice} setMaxPrice={setMaxPrice}
              minRating={minRating} setMinRating={setMinRating}
            />
            <div className="pt-4 border-t border-border/70">
              <button
                type="button"
                data-testid="compare-open"
                disabled={compare.length < 2}
                onClick={() => navigate("/compare")}
                className={`w-full py-2.5 px-3 text-xs font-mono uppercase tracking-widest rounded-md border transition-colors ${
                  compare.length === 2 ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"
                }`}
              >
                <GitCompare className="h-3.5 w-3.5 inline mr-1" /> Compare ({compare.length}/2)
              </button>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="lg:col-span-9 min-w-0">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="text-xs font-mono text-muted-foreground">
              {loading ? (
                "Fetching real Google Shopping…"
              ) : data ? (
                <>
                  <strong className="text-foreground">{data.count}</strong> real result{data.count === 1 ? "" : "s"}
                  {q && <> for <em className="text-foreground not-italic">"{q}"</em></>} · Retrieved {relativeTime(data.retrieved_at)}
                </>
              ) : q ? "Type to search real products" : ""}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Sort</label>
              <select
                data-testid="filter-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="py-1.5 px-2 bg-card border border-border rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className="lg:hidden text-[11px] font-mono uppercase tracking-widest px-3 py-2 rounded-md border border-border bg-card hover:bg-secondary"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 inline mr-1" /> Filters
              </button>
            </div>
          </div>

          {loading && <ProductGridSkeleton count={8} />}

          {!loading && error && (
            <EmptyState
              icon={AlertTriangle}
              tone="warning"
              title="Live shopping data is temporarily unavailable"
              description={error}
            />
          )}

          {!loading && !error && data && data.count === 0 && (
            <EmptyState
              title="No real products were found"
              description={`Google Shopping returned no results for "${q}". Try a different query — SMART BUY will not show fabricated products to fill the page.`}
            />
          )}

          {!loading && !error && data && data.count > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {data.products.map((p) => (
                <ProductCard
                  key={p.product_id}
                  product={p}
                  onCompareAdd={toggleCompare}
                  compareSelected={inCompare.has(p.product_id)}
                />
              ))}
            </div>
          )}

          {!loading && !error && !data && !q && (
            <EmptyState
              title="Type a real product name above"
              description="SMART BUY only shows what Google Shopping actually returns for your query. There are no sample products."
            />
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden bg-foreground/40 backdrop-blur-sm" onClick={() => setShowFilters(false)}>
          <div className="absolute bottom-0 inset-x-0 rounded-t-2xl bg-card border-t border-border p-5 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="font-display text-lg font-semibold">Filters</div>
              <button onClick={() => setShowFilters(false)} className="p-2 rounded-md hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            <FilterFields
              minPrice={minPrice} setMinPrice={setMinPrice}
              maxPrice={maxPrice} setMaxPrice={setMaxPrice}
              minRating={minRating} setMinRating={setMinRating}
            />
            <button onClick={() => setShowFilters(false)} className="btn-primary w-full">Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterFields({ minPrice, setMinPrice, maxPrice, setMaxPrice, minRating, setMinRating }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="eyebrow">Price range (₹)</label>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <input data-testid="filter-min-price" type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="py-2 px-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
          <input data-testid="filter-max-price" type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="py-2 px-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
        </div>
      </div>
      <div>
        <label className="eyebrow">Min rating</label>
        <input data-testid="filter-min-rating" type="number" min="0" max="5" step="0.1" placeholder="0.0" value={minRating} onChange={(e) => setMinRating(e.target.value)} className="mt-1.5 w-full py-2 px-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
      </div>
    </div>
  );
}
