import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, RefreshCcw, Sparkles, AlertTriangle, ShoppingBag, Heart, Share2 } from "lucide-react";
import { toast } from "sonner";
import { api, relativeTime } from "@/lib/api";
import SourceBadge from "@/components/ProvenanceBadge";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import EmptyState from "@/components/EmptyState";
import PriceBadge from "@/components/PriceBadge";
import RatingDisplay from "@/components/RatingDisplay";
import DealBadge from "@/components/DealBadge";

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
        if (r.data.fetched > 0) toast.success(`Fetched ${r.data.fetched} real reviews`);
        else if (r.data.source_unavailable) { toast.info("No live review source available right now"); setSourceNote(r.data.note); }
        else toast.info("The source returned no reviews for this product");
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

  if (loading) return <ProductLoading />;
  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <EmptyState
          icon={AlertTriangle}
          tone="warning"
          title="Product not available"
          description={error}
          action={<Link to="/search" className="btn-secondary">Back to search</Link>}
        />
      </div>
    );
  }

  const { product, price_observations: obs, reviews, deal } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-up">
      <Link
        to="/search"
        data-testid="back-to-search"
        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to search
      </Link>

      <div className="grid lg:grid-cols-12 gap-8 xl:gap-12">
        {/* Gallery */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl bg-card border border-border aspect-square flex items-center justify-center overflow-hidden card-elevated">
            {product.image ? (
              <img src={product.image} alt={product.product_name || ""} className="max-h-full max-w-full object-contain p-8" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ShoppingBag className="h-12 w-12" />
                <span className="text-xs font-mono uppercase tracking-widest">No image available</span>
              </div>
            )}
          </div>
        </div>

        {/* Buy panel */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap gap-2 items-center">
            <SourceBadge source={product.source} retrievedAt={product.last_seen_at || product.retrieved_at} />
            <DealBadge deal={deal} />
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.02em] leading-[1.05]">
            {product.product_name || "Untitled product"}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {product.seller ? (
              <span className="chip">{product.seller}</span>
            ) : (
              <span className="italic text-xs">Seller not available</span>
            )}
            <RatingDisplay rating={product.rating} reviewCount={product.review_count} size="lg" />
          </div>

          <div className="border-y border-border py-5">
            <PriceBadge current={product.current_price} original={product.original_price} size="lg" />
            {deal && <p className="text-sm text-muted-foreground mt-3">{deal.explanation}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {product.seller_url && (
              <a
                href={product.seller_url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="visit-seller"
                className="btn-primary"
              >
                Visit seller <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <button type="button" className="btn-secondary" onClick={() => toast.info("Watchlist ships soon — sign-in coming next.")}>
              <Heart className="h-4 w-4" /> Save
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: product.product_name || "SMART BUY", url: window.location.href }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied");
                }
              }}
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>

          {product.delivery && (
            <div className="chip">{product.delivery}</div>
          )}
        </div>
      </div>

      {/* Insights row: Price history */}
      <section className="mt-14">
        <SectionHeader eyebrow="Price intelligence" title="Price history" note={`${obs.length} real observation${obs.length === 1 ? "" : "s"}`} />
        <div className="rounded-xl border border-border bg-card p-5 sm:p-7">
          <PriceHistoryChart observations={obs} deal={deal} />
        </div>
      </section>

      {/* Reviews */}
      <section className="mt-14">
        <SectionHeader
          eyebrow="Voice of the customer"
          title="Real reviews"
          right={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchReviews}
                disabled={reviewsLoading}
                data-testid="fetch-reviews-btn"
                className="btn-secondary text-xs"
              >
                {reviewsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
                Fetch real reviews
              </button>
              {reviews.length >= 2 && (
                <button
                  type="button"
                  onClick={analyze}
                  disabled={analysisLoading}
                  data-testid="analyze-reviews-btn"
                  className="btn-primary text-xs"
                >
                  {analysisLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  AI analyze
                </button>
              )}
            </div>
          }
        />

        {reviews.length === 0 ? (
          <EmptyState
            title="No real review data currently available"
            description={sourceNote || "SMART BUY hasn't fetched any real reviews for this product yet. Click 'Fetch real reviews' to try again. If the source has none, we won't invent any."}
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {reviews.map((r, i) => (
              <div key={i} data-testid={`review-${i}`} className="p-5 border border-border rounded-xl bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold uppercase tracking-widest">{r.reviewer_name || "Anonymous"}</span>
                  <RatingDisplay rating={r.rating} />
                </div>
                {r.title && <div className="font-display font-semibold text-base mb-1.5">{r.title}</div>}
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {r.review_text || <em className="text-muted-foreground">Review text not available.</em>}
                </p>
                <div className="mt-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {r.source || "google_product"} · {r.review_date || "date unknown"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI Analysis */}
      {analysis && (
        <section className="mt-14">
          <SectionHeader eyebrow="SMART BUY AI" title="Our take" />
          <div className="rounded-xl border border-border bg-card p-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent" />
            {analysis.insufficient ? (
              <p className="text-sm">{analysis.message}</p>
            ) : (
              <AnalysisView analysis={analysis.analysis} />
            )}
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-5">
              Grounded in {analysis.review_count_analyzed} real reviews · {relativeTime(analysis.generated_at)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeader({ eyebrow, title, note, right }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
      <div>
        <div className="eyebrow mb-1">{eyebrow}</div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
      </div>
      {note && <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{note}</span>}
      {right}
    </div>
  );
}

function AnalysisView({ analysis }) {
  if (!analysis) return null;
  if (analysis.raw) return <pre className="text-xs whitespace-pre-wrap font-mono">{analysis.raw}</pre>;
  return (
    <div className="space-y-5">
      {analysis.overall_sentiment && (
        <div>
          <div className="eyebrow mb-1">Overall sentiment</div>
          <span className="chip capitalize">{analysis.overall_sentiment}</span>
        </div>
      )}
      {analysis.summary && (
        <div>
          <div className="eyebrow mb-1">Summary</div>
          <p className="text-sm leading-relaxed">{analysis.summary}</p>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        {Array.isArray(analysis.positives) && analysis.positives.length > 0 && (
          <ThemeList title="What buyers like" items={analysis.positives} tone="positive" />
        )}
        {Array.isArray(analysis.negatives) && analysis.negatives.length > 0 && (
          <ThemeList title="Common complaints" items={analysis.negatives} tone="negative" />
        )}
      </div>
      {Array.isArray(analysis.recurring_concerns) && analysis.recurring_concerns.length > 0 && (
        <ThemeList title="Recurring concerns" items={analysis.recurring_concerns} tone="neutral" />
      )}
      {Array.isArray(analysis.evidence) && analysis.evidence.length > 0 && (
        <div>
          <div className="eyebrow mb-2">Evidence</div>
          <ul className="text-xs font-mono space-y-1">
            {analysis.evidence.map((e, i) => (
              <li key={i}>
                <span className="text-muted-foreground">
                  [Reviews {Array.isArray(e.review_indexes) ? e.review_indexes.join(", ") : "?"}]
                </span>{" "}
                <span>{e.claim}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ThemeList({ title, items, tone }) {
  const color = tone === "positive" ? "text-emerald-800" : tone === "negative" ? "text-rose-800" : "text-foreground";
  return (
    <div>
      <div className={`eyebrow mb-1 ${color}`}>{title}</div>
      <ul className="list-disc pl-5 text-sm space-y-1">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}

function ProductLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5"><div className="skeleton aspect-square rounded-2xl" /></div>
        <div className="lg:col-span-7 space-y-4">
          <div className="skeleton h-6 w-24" />
          <div className="skeleton h-10 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-14 w-2/3" />
          <div className="skeleton h-10 w-40" />
        </div>
      </div>
    </div>
  );
}
