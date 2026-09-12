import { useState } from "react";
import { Sparkles, Loader2, ArrowRight, Wand2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { api, relativeTime } from "@/lib/api";
import EmptyState from "@/components/EmptyState";
import SourceBadge from "@/components/ProvenanceBadge";
import PriceBadge from "@/components/PriceBadge";
import RatingDisplay from "@/components/RatingDisplay";

const PROMPTS = [
  "I need a phone under ₹30,000 with a great camera and battery.",
  "Wireless earbuds under ₹8,000 for daily commute and calls.",
  "Laptop for college students under ₹60,000.",
  "Smart TV under ₹40,000 for a small living room.",
];

export default function Recommend() {
  const [requirements, setRequirements] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [sharing, setSharing] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (requirements.trim().length < 5) { toast.warning("Describe your needs in at least 5 characters."); return; }
    setLoading(true); setResult(null);
    api.post("/recommend", { requirements: requirements.trim(), query: query.trim() || null })
      .then((r) => setResult(r.data))
      .catch((e) => toast.error(e?.response?.data?.detail || "Recommendation failed"))
      .finally(() => setLoading(false));
  };

  const share = () => {
    if (!result || result.no_real_products) return;
    setSharing(true);
    api.post("/share", {
      kind: "recommend",
      payload: {
        requirements: requirements.trim(),
        query: query.trim() || null,
        recommendation: result.recommendation,
        candidates: result.candidates,
        generated_at: result.generated_at,
      },
    })
      .then((r) => {
        const url = `${window.location.origin}/s/${r.data.share_id}`;
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        if (navigator.share) navigator.share({ title: "SMART BUY recommendation", url }).catch(() => {});
        toast.success("Public link copied", { description: url });
      })
      .catch((e) => toast.error(e?.response?.data?.detail || "Could not create share link"))
      .finally(() => setSharing(false));
  };

  const recProduct = result?.recommendation?.recommended_product_id
    ? result.candidates.find((p) => p.product_id === result.recommendation.recommended_product_id)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-up">
      <div className="mb-8">
        <div className="eyebrow mb-1">AI Recommendation</div>
        <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-[-0.02em] leading-[1.05]">
          Describe what you need.{" "}
          <span className="italic text-accent">We pick from real products only.</span>
        </h1>
        <p className="text-base text-muted-foreground mt-3 max-w-2xl">
          Our AI analyzes your requirement and chooses the best match among real Google Shopping results. It never invents a product from training data.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-8 card-elevated">
        <div>
          <label className="eyebrow mb-2 block">What are you looking to buy?</label>
          <textarea
            data-testid="requirements-input"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={4}
            placeholder="e.g. Best noise cancelling headphones under ₹30,000 for daily commute and calls."
            className="w-full p-4 bg-background border border-border rounded-xl text-base leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {PROMPTS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setRequirements(p)}
                className="chip hover:bg-secondary hover:border-foreground/30 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="eyebrow mb-2 block">Optional search query <span className="normal-case tracking-normal">(defaults to your requirements)</span></label>
          <input
            data-testid="query-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. noise cancelling headphones"
            className="w-full p-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          data-testid="recommend-submit"
          className="btn-primary"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          Recommend from real products
        </button>
      </form>

      {result && result.no_real_products && (
        <div className="mt-8"><EmptyState title="No real products found" description={result.message} /></div>
      )}

      {result && !result.no_real_products && (
        <div className="mt-10 space-y-6">
          <div className="rounded-2xl border border-accent/30 bg-card p-6 sm:p-8 card-elevated relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent" />
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="eyebrow">Best match</span>
            </div>
            {recProduct ? (
              <>
                <Link to={`/product/${encodeURIComponent(recProduct.product_id)}`} className="hover:text-accent transition-colors">
                  <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{recProduct.product_name}</h3>
                </Link>
                <div className="mt-2 flex items-center flex-wrap gap-3">
                  {recProduct.seller && <span className="chip">{recProduct.seller}</span>}
                  <RatingDisplay rating={recProduct.rating} reviewCount={recProduct.review_count} />
                </div>
                <div className="mt-4"><PriceBadge current={recProduct.current_price} original={recProduct.original_price} size="lg" /></div>
              </>
            ) : (
              <p className="text-sm italic">The model did not identify a specific product ID among candidates.</p>
            )}

            {result.recommendation?.why && (
              <div className="mt-6">
                <div className="eyebrow mb-1">Why</div>
                <p className="text-base leading-relaxed font-display">{result.recommendation.why}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              {Array.isArray(result.recommendation?.strengths) && (
                <div>
                  <div className="eyebrow text-emerald-800 mb-1">Strengths</div>
                  <ul className="list-disc pl-5 text-sm space-y-1">{result.recommendation.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
              {Array.isArray(result.recommendation?.weaknesses) && (
                <div>
                  <div className="eyebrow text-rose-800 mb-1">Weaknesses</div>
                  <ul className="list-disc pl-5 text-sm space-y-1">{result.recommendation.weaknesses.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
            </div>

            {result.recommendation?.price_assessment && (
              <div className="mt-5">
                <div className="eyebrow mb-1">Price assessment</div>
                <p className="text-sm">{result.recommendation.price_assessment}</p>
              </div>
            )}

            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-6 flex items-center justify-between gap-4 flex-wrap">
              <span>Grounded in {result.candidates.length} real candidates · Generated {relativeTime(result.generated_at)}</span>
              <button
                type="button"
                onClick={share}
                disabled={sharing}
                data-testid="share-recommend"
                className="btn-secondary text-xs normal-case tracking-normal"
              >
                {sharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
                Share this
              </button>
            </div>
          </div>

          <div>
            <div className="eyebrow mb-3">Also considered · {result.candidates.length} real candidates</div>
            <div className="grid md:grid-cols-2 gap-3">
              {result.candidates.map((c) => (
                <Link
                  key={c.product_id}
                  to={`/product/${encodeURIComponent(c.product_id)}`}
                  data-testid={`candidate-card-${c.product_id}`}
                  className="flex items-center justify-between gap-3 p-4 border border-border rounded-xl bg-card hover:border-foreground/30 hover:card-elevated transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{c.product_name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {c.seller || "—"}
                    </div>
                    <div className="mt-2"><PriceBadge current={c.current_price} original={c.original_price} size="sm" /></div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </Link>
              ))}
            </div>
            <div className="mt-4"><SourceBadge source="serpapi_google_shopping" retrievedAt={result.generated_at} /></div>
          </div>
        </div>
      )}
    </div>
  );
}
