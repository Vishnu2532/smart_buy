import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Loader2, AlertTriangle, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { api, relativeTime } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import EmptyState from "@/components/EmptyState";

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
      if (compare.length >= 2) { toast.warning("You can compare at most 2 products. Remove one first."); return; }
      next = [...compare, p];
    }
    setCompare(next);
    sessionStorage.setItem("smartbuy_compare", JSON.stringify(next));
    if (next.length === 2) toast.success("Two products selected. Open Compare to see the verdict.");
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-up">
      <form onSubmit={submit} className="flex items-center gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            data-testid="search-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search real Google Shopping"
            className="w-full pl-10 pr-3 py-2.5 bg-background border border-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          />
        </div>
        <button type="submit" data-testid="search-submit" className="px-4 py-2.5 bg-foreground text-background text-sm font-semibold rounded-sm hover:bg-accent transition-colors">
          Search
        </button>
      </form>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div>
          <label className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Sort</label>
          <select data-testid="filter-sort" value={sort} onChange={(e) => setSort(e.target.value)} className="w-full mt-1 py-2 px-2 bg-background border border-border rounded-sm text-sm">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Min ₹</label>
          <input data-testid="filter-min-price" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full mt-1 py-2 px-2 bg-background border border-border rounded-sm text-sm" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Max ₹</label>
          <input data-testid="filter-max-price" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full mt-1 py-2 px-2 bg-background border border-border rounded-sm text-sm" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Min rating</label>
          <input data-testid="filter-min-rating" type="number" min="0" max="5" step="0.1" value={minRating} onChange={(e) => setMinRating(e.target.value)} className="w-full mt-1 py-2 px-2 bg-background border border-border rounded-sm text-sm" />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            data-testid="compare-open"
            disabled={compare.length < 2}
            onClick={() => navigate("/compare")}
            className={`w-full py-2 px-3 text-xs font-mono uppercase tracking-widest rounded-sm border ${compare.length === 2 ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}
          >
            <SlidersHorizontal className="h-3 w-3 inline mr-1" /> Compare ({compare.length}/2)
          </button>
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <span className="ml-3 text-sm font-mono text-muted-foreground">Fetching real Google Shopping results…</span>
        </div>
      )}

      {!loading && error && (
        <EmptyState
          icon={AlertTriangle}
          title="Live shopping data is temporarily unavailable"
          description={error}
        />
      )}

      {!loading && !error && data && data.count === 0 && (
        <EmptyState
          title="No real products were found for this search"
          description={`Google Shopping returned no results for “${q}”. Try a different query — SMART BUY will not show fabricated products to fill the page.`}
        />
      )}

      {!loading && !error && data && data.count > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-mono text-muted-foreground">
              <strong className="text-foreground">{data.count}</strong> real products · Retrieved {relativeTime(data.retrieved_at)} · Source: Google Shopping via SerpAPI
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {data.products.map((p) => (
              <ProductCard
                key={p.product_id}
                product={p}
                onCompareAdd={toggleCompare}
                compareSelected={inCompare.has(p.product_id)}
              />
            ))}
          </div>
        </>
      )}

      {!loading && !error && !data && !q && (
        <EmptyState
          title="Type a real product name above"
          description="SMART BUY only shows what Google Shopping actually returns for your query. There are no sample products."
        />
      )}
    </div>
  );
}
