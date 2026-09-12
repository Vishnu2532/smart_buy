import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, Star, RefreshCcw, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { api, formatINR, relativeTime } from "@/lib/api";
import ProvenanceBadge from "@/components/ProvenanceBadge";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import EmptyState from "@/components/EmptyState";

const DEAL_STYLES = {
  positive: "bg-emerald-600 text-white",
  neutral: "bg-secondary text-foreground border border-border",
  negative: "bg-rose-600 text-white",
};

export default function ProductDetail() {
  const { productId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const [sourceNote, setSourceNote] = useState(null);

  const load = () => {
    setLoading(true); setError(null);
    api.get(`/products/${encodeURIComponent(productId)}`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e?.response?.data?.detail || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [productId]);

  const fetchReviews = () => {
    setReviewsLoading(true); setSourceNote(null);
    api.post(`/products/${encodeURIComponent(productId)}/refresh-reviews`)
      .then((r) => {
        if (r.data.fetched > 0) {
          toast.success(`Fetched ${r.data.fetched} real reviews`);
        } else if (r.data.source_unavailable) {
          toast.info("No live review source available right now");
          setSourceNote(r.data.note);
        } else {
          toast.info("The source returned no reviews for this product");
        }
        load();
      })
      .catch((e) => toast.error(e?.response?.data?.detail || "Could not fetch reviews"))
      .finally(() => setReviewsLoading(false));
  };

  const analyze = () => {
    setAnalysisLoading(true); setAnalysis(null);
    api.post(`/analyze-reviews`, { product_id: productId })
      .then((r) => setAnalysis(r.data))
      .catch((e) => toast.error(e?.response?.data?.detail || "Analysis failed"))
      .finally(() => setAnalysisLoading(false));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
  }
  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <EmptyState icon={AlertTriangle} title="Product not available" description={error} action={<Link to="/search" className="text-accent underline">Back to search</Link>} />
      </div>
    );
  }

  const { product, price_observations: obs, reviews, deal } = data;
  const discount = product.current_price && product.original_price && product.original_price > product.current_price
    ? Math.round(((product.original_price - product.current_price) / product.original_price) * 100)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-up">
      <Link to="/search" data-testid="back-to-search" className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-3 w-3" /> Back to search
      </Link>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <div className="aspect-square bg-secondary/30 rounded-sm border border-border flex items-center justify-center overflow-hidden">
            {product.image ? (
              <img src={product.image} alt={product.product_name || ""} className="max-h-full max-w-full object-contain p-6" />
            ) : (
              <span className="text-sm text-muted-foreground italic">No image available</span>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap gap-2 items-center">
            <ProvenanceBadge source={product.source} retrievedAt={product.last_seen_at || product.retrieved_at} />
            {deal && (
              <span data-testid="deal-badge" className={`text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-sm ${DEAL_STYLES[deal.tone] || DEAL_STYLES.neutral}`}>
                {deal.label}
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            {product.product_name || "Untitled product"}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {product.seller ? (
              <span className="font-mono uppercase tracking-widest text-xs">{product.seller}</span>
            ) : (
              <span className="italic">Seller not available</span>
            )}
            {product.rating !== null && product.rating !== undefined ? (
              <span className="inline-flex items-center gap-1 text-foreground">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span className="font-mono font-semibold">{product.rating}</span>
                {product.review_count !== null && product.review_count !== undefined && (
                  <span className="text-muted-foreground">({product.review_count.toLocaleString("en-IN")} reviews)</span>
                )}
              </span>
            ) : (
              <span className="italic">No rating data</span>
            )}
          </div>

          <div className="border-t border-b border-border py-5 flex items-end gap-4">
            {product.current_price ? (
              <div className="font-mono text-4xl font-bold tracking-tight" data-testid="current-price">
                {formatINR(product.current_price)}
              </div>
            ) : (
              <div className="italic text-muted-foreground">Price not available</div>
            )}
            {product.original_price && discount && (
              <div className="pb-1.5">
                <div className="font-mono line-through text-muted-foreground text-sm">{formatINR(product.original_price)}</div>
                <div className="text-emerald-700 text-sm font-mono font-semibold">−{discount}%</div>
              </div>
            )}
          </div>

          {deal && (
            <p className="text-sm text-muted-foreground">{deal.explanation}</p>
          )}

          {product.seller_url && (
            <a
              href={product.seller_url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="visit-seller"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-foreground text-background text-sm font-semibold rounded-sm hover:bg-accent transition-colors"
            >
              Visit seller <ExternalLink className="h-4 w-4" />
            </a>
          )}

          {product.delivery && (
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Delivery: {product.delivery}</div>
          )}
        </div>
      </div>

      {/* Price history */}
      <section className="mt-12">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Price history</div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Only real observations</h2>
          </div>
          <span className="text-xs font-mono text-muted-foreground">{obs.length} snapshot{obs.length === 1 ? "" : "s"}</span>
        </div>
        <PriceHistoryChart observations={obs} deal={deal} />
      </section>

      {/* Reviews */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Reviews</div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Real customer reviews</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchReviews}
              disabled={reviewsLoading}
              data-testid="fetch-reviews-btn"
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest px-3 py-2 rounded-sm border border-border hover:bg-secondary"
            >
              {reviewsLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
              Fetch real reviews
            </button>
            {reviews.length >= 2 && (
              <button
                type="button"
                onClick={analyze}
                disabled={analysisLoading}
                data-testid="analyze-reviews-btn"
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest px-3 py-2 rounded-sm bg-foreground text-background hover:bg-accent"
              >
                {analysisLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                AI analyze
              </button>
            )}
          </div>
        </div>

        {reviews.length === 0 ? (
          <EmptyState
            title="No real review data currently available"
            description={sourceNote || "SMART BUY hasn't fetched any real reviews for this product yet. Click 'Fetch real reviews' to try again. If the source has none, we won't invent any."}
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {reviews.map((r, i) => (
              <div key={i} data-testid={`review-${i}`} className="p-4 border border-border rounded-sm bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold">{r.reviewer_name || "Anonymous"}</span>
                  {r.rating !== null && r.rating !== undefined && (
                    <span className="inline-flex items-center gap-0.5 text-xs">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span className="font-mono font-semibold">{r.rating}</span>
                    </span>
                  )}
                </div>
                {r.title && <div className="font-semibold text-sm mb-1">{r.title}</div>}
                <p className="text-sm text-muted-foreground leading-relaxed">{r.review_text || <em>Review text not available.</em>}</p>
                <div className="mt-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {r.source || "google_product"} · {r.review_date || "date unknown"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI Analysis */}
      {analysis && (
        <section className="mt-12">
          <div className="border border-border rounded-sm p-6 bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-accent" />
              <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">AI review analysis · Gemini 2.5 Pro</div>
            </div>
            {analysis.insufficient ? (
              <p className="text-sm">{analysis.message}</p>
            ) : (
              <AnalysisView analysis={analysis.analysis} count={analysis.review_count_analyzed} />
            )}
            <div className="text-[10px] font-mono text-muted-foreground mt-4">
              Grounded in {analysis.review_count_analyzed} real reviews · Generated {relativeTime(analysis.generated_at)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function AnalysisView({ analysis, count }) {
  if (!analysis) return null;
  if (analysis.raw) {
    return <pre className="text-xs whitespace-pre-wrap font-mono">{analysis.raw}</pre>;
  }
  const items = [
    { label: "Overall sentiment", value: analysis.overall_sentiment },
    { label: "Summary", value: analysis.summary },
  ];
  return (
    <div className="space-y-4">
      {items.map((i) => i.value && (
        <div key={i.label}>
          <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mb-1">{i.label}</div>
          <p className="text-sm leading-relaxed">{i.value}</p>
        </div>
      ))}
      {Array.isArray(analysis.positives) && analysis.positives.length > 0 && (
        <ListBlock title="What buyers like" items={analysis.positives} tone="positive" />
      )}
      {Array.isArray(analysis.negatives) && analysis.negatives.length > 0 && (
        <ListBlock title="Common complaints" items={analysis.negatives} tone="negative" />
      )}
      {Array.isArray(analysis.recurring_concerns) && analysis.recurring_concerns.length > 0 && (
        <ListBlock title="Recurring concerns" items={analysis.recurring_concerns} tone="neutral" />
      )}
      {Array.isArray(analysis.evidence) && analysis.evidence.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mb-1">Evidence</div>
          <ul className="text-xs font-mono space-y-1">
            {analysis.evidence.map((e, i) => (
              <li key={i}>
                <span className="text-muted-foreground">[Reviews {Array.isArray(e.review_indexes) ? e.review_indexes.join(", ") : "?"}]</span>{" "}
                <span>{e.claim}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ListBlock({ title, items, tone }) {
  const color = tone === "positive" ? "text-emerald-700" : tone === "negative" ? "text-rose-700" : "text-foreground";
  return (
    <div>
      <div className={`text-[10px] uppercase tracking-widest font-mono mb-1 ${color}`}>{title}</div>
      <ul className="list-disc pl-5 text-sm space-y-1">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}
