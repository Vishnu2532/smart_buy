import { useState } from "react";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { api, formatINR, relativeTime } from "@/lib/api";
import EmptyState from "@/components/EmptyState";
import ProvenanceBadge from "@/components/ProvenanceBadge";

export default function Recommend() {
  const [requirements, setRequirements] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    if (requirements.trim().length < 5) { toast.warning("Describe your needs in at least 5 characters."); return; }
    setLoading(true); setResult(null);
    api.post("/recommend", { requirements: requirements.trim(), query: query.trim() || null })
      .then((r) => setResult(r.data))
      .catch((e) => toast.error(e?.response?.data?.detail || "Recommendation failed"))
      .finally(() => setLoading(false));
  };

  const recProduct = result?.recommendation?.recommended_product_id
    ? result.candidates.find((p) => p.product_id === result.recommendation.recommended_product_id)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-up">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mb-2">AI recommendation</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          Describe what you need. We'll pick from <span className="italic text-accent">real</span> products only.
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Gemini analyzes your requirement and chooses the best match among real Google Shopping results. It never
          invents a product from training data.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4 border border-border rounded-sm p-6 bg-card">
        <div>
          <label className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Your requirements</label>
          <textarea
            data-testid="requirements-input"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={4}
            placeholder="e.g. Best noise cancelling headphones under ₹30,000 for daily commute and calls."
            className="w-full mt-1 p-3 bg-background border border-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Optional search query (defaults to your requirements)</label>
          <input
            data-testid="query-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. noise cancelling headphones"
            className="w-full mt-1 p-2.5 bg-background border border-border rounded-sm text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          data-testid="recommend-submit"
          className="inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background text-sm font-semibold rounded-sm hover:bg-accent transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Recommend from real products
        </button>
      </form>

      {result && result.no_real_products && (
        <div className="mt-8"><EmptyState title="No real products found" description={result.message} /></div>
      )}

      {result && !result.no_real_products && (
        <div className="mt-8 space-y-6">
          <div className="border border-border rounded-sm p-6 bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Recommended</div>
            </div>
            {recProduct ? (
              <>
                <Link to={`/product/${encodeURIComponent(recProduct.product_id)}`} className="hover:underline">
                  <h3 className="font-display text-xl font-bold">{recProduct.product_name}</h3>
                </Link>
                <div className="mt-1 text-sm text-muted-foreground">{recProduct.seller || "Seller not available"}</div>
                <div className="mt-2 font-mono text-2xl font-bold">{formatINR(recProduct.current_price) || "Price N/A"}</div>
              </>
            ) : (
              <p className="text-sm italic">The model did not identify a specific product ID among candidates.</p>
            )}
            {result.recommendation?.why && (
              <div className="mt-4 space-y-2">
                <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Why</div>
                <p className="text-sm leading-relaxed">{result.recommendation.why}</p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              {Array.isArray(result.recommendation?.strengths) && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-mono mb-1">Strengths</div>
                  <ul className="list-disc pl-5 text-sm space-y-1">{result.recommendation.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
              {Array.isArray(result.recommendation?.weaknesses) && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-rose-700 font-mono mb-1">Weaknesses</div>
                  <ul className="list-disc pl-5 text-sm space-y-1">{result.recommendation.weaknesses.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
            </div>
            {result.recommendation?.price_assessment && (
              <div className="mt-4">
                <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mb-1">Price assessment</div>
                <p className="text-sm">{result.recommendation.price_assessment}</p>
              </div>
            )}
            <div className="text-[10px] font-mono text-muted-foreground mt-4">
              Grounded in {result.candidates.length} real candidates · Generated {relativeTime(result.generated_at)}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mb-2">Considered candidates (real)</div>
            <div className="grid md:grid-cols-2 gap-3">
              {result.candidates.map((c) => (
                <Link key={c.product_id} to={`/product/${encodeURIComponent(c.product_id)}`} data-testid={`candidate-card-${c.product_id}`} className="flex items-center justify-between p-3 border border-border rounded-sm bg-card hover:bg-secondary/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{c.product_name}</div>
                    <div className="text-xs text-muted-foreground">{c.seller || "—"} · {formatINR(c.current_price) || "Price N/A"}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </Link>
              ))}
            </div>
            <div className="mt-3"><ProvenanceBadge source="serpapi_google_shopping" retrievedAt={result.generated_at} /></div>
          </div>
        </div>
      )}
    </div>
  );
}
