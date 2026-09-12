import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Check, AlertTriangle, ShoppingBag } from "lucide-react";
import { api, relativeTime } from "@/lib/api";
import SmartBuyLogo from "@/components/SmartBuyLogo";
import EmptyState from "@/components/EmptyState";
import PriceBadge from "@/components/PriceBadge";
import RatingDisplay from "@/components/RatingDisplay";
import SourceBadge from "@/components/ProvenanceBadge";

/** Public read-only page for shared AI verdicts (compare + recommend). */
export default function SharedVerdict() {
  const { shareId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true); setError(null);
    api.get(`/share/${encodeURIComponent(shareId)}`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e?.response?.data?.detail || "This link is invalid or expired."))
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading) return <div className="max-w-3xl mx-auto p-16 text-center text-sm text-muted-foreground font-mono uppercase tracking-widest">Loading verdict…</div>;
  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-8 py-16">
        <EmptyState icon={AlertTriangle} tone="warning" title="This verdict is not available" description={error}
          action={<Link to="/" className="btn-primary">Explore SMART BUY</Link>} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-up">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <Link to="/" className="inline-flex items-center gap-2">
          <SmartBuyLogo size={36} />
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-lg">
              SMART <span className="text-accent">BUY</span>
            </span>
            <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.18em] text-muted-foreground mt-1">
              Buy smarter · Decide better
            </span>
          </div>
        </Link>
        <div className="chip">
          Shared verdict · {relativeTime(data.created_at)}
        </div>
      </div>

      {data.kind === "compare" && <ComparisonView payload={data.payload} />}
      {data.kind === "recommend" && <RecommendationView payload={data.payload} />}

      <div className="mt-12 border-t border-border pt-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-xs text-muted-foreground max-w-md leading-relaxed">
          This is a read-only snapshot of an AI verdict grounded in real product data. Live prices may have changed since it was shared.
        </div>
        <Link to="/recommend" className="btn-primary text-xs">
          Get your own recommendation <Sparkles className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function ComparisonView({ payload }) {
  const items = payload?.items || [];
  const comparison = payload?.comparison || {};
  const winnerId = comparison.winner_product_id;
  return (
    <div>
      <div className="mb-8">
        <div className="eyebrow mb-1">Side-by-side · AI verdict</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Comparison snapshot</h1>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {items.map((p) => (
          <div key={p.product_id} className={`relative border rounded-2xl p-5 sm:p-6 bg-card ${winnerId === p.product_id ? "border-accent card-elevated" : "border-border"}`}>
            {winnerId === p.product_id && (
              <span className="absolute -top-3 left-5 chip bg-foreground text-background border-foreground">
                <Check className="h-3 w-3" /> AI pick
              </span>
            )}
            <div className="aspect-video bg-secondary/40 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
              {p.image ? <img src={p.image} alt="" className="max-h-full object-contain p-4" /> : <ShoppingBag className="h-6 w-6 text-muted-foreground" />}
            </div>
            <h3 className="font-display text-lg sm:text-xl font-semibold leading-tight tracking-tight">{p.product_name}</h3>
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              {p.seller && <span className="chip">{p.seller}</span>}
              <RatingDisplay rating={p.rating} reviewCount={p.review_count} />
            </div>
            <div className="mt-4"><PriceBadge current={p.current_price} original={p.original_price} /></div>
            <div className="mt-4"><SourceBadge source={p.source} retrievedAt={p.retrieved_at} /></div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-5 card-elevated">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="eyebrow">SMART BUY AI · Verdict</span>
        </div>
        {comparison.insufficient_evidence && (
          <div className="border-l-4 border-amber-500 bg-amber-50/70 p-3 text-sm rounded-r-md">
            The supplied product data was limited when this comparison was generated.
          </div>
        )}
        {comparison.verdict && <p className="text-base sm:text-lg leading-relaxed font-display">{comparison.verdict}</p>}
        <div className="grid md:grid-cols-2 gap-6 pt-2">
          {["a", "b"].map((k, idx) => (
            <div key={k}>
              <div className="text-sm font-semibold mb-2 truncate">{items[idx]?.product_name}</div>
              {Array.isArray(comparison[`pros_${k}`]) && comparison[`pros_${k}`].length > 0 && (
                <>
                  <div className="eyebrow text-emerald-800 mt-2 mb-1">Pros</div>
                  <ul className="list-disc pl-5 text-sm space-y-1">{comparison[`pros_${k}`].map((x, i) => <li key={i}>{x}</li>)}</ul>
                </>
              )}
              {Array.isArray(comparison[`cons_${k}`]) && comparison[`cons_${k}`].length > 0 && (
                <>
                  <div className="eyebrow text-rose-800 mt-3 mb-1">Cons</div>
                  <ul className="list-disc pl-5 text-sm space-y-1">{comparison[`cons_${k}`].map((x, i) => <li key={i}>{x}</li>)}</ul>
                </>
              )}
            </div>
          ))}
        </div>
        {comparison.value_for_money && (
          <div>
            <div className="eyebrow mt-3 mb-1">Value for money</div>
            <p className="text-sm">{comparison.value_for_money}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RecommendationView({ payload }) {
  const recommendation = payload?.recommendation || {};
  const candidates = payload?.candidates || [];
  const recProduct = recommendation.recommended_product_id
    ? candidates.find((p) => p.product_id === recommendation.recommended_product_id)
    : null;
  return (
    <div>
      <div className="mb-8">
        <div className="eyebrow mb-1">AI Recommendation · Snapshot</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          For: <span className="italic text-accent">{payload?.requirements || "your requirement"}</span>
        </h1>
      </div>

      <div className="rounded-2xl border border-accent/30 bg-card p-6 sm:p-8 card-elevated relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent" />
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="eyebrow">Best match</span>
        </div>
        {recProduct ? (
          <>
            <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{recProduct.product_name}</h3>
            <div className="mt-2 flex items-center flex-wrap gap-3">
              {recProduct.seller && <span className="chip">{recProduct.seller}</span>}
              <RatingDisplay rating={recProduct.rating} reviewCount={recProduct.review_count} />
            </div>
            <div className="mt-4"><PriceBadge current={recProduct.current_price} original={recProduct.original_price} size="lg" /></div>
          </>
        ) : (
          <p className="text-sm italic text-muted-foreground">Recommended product not linked in this snapshot.</p>
        )}
        {recommendation.why && (
          <div className="mt-6">
            <div className="eyebrow mb-1">Why</div>
            <p className="text-base leading-relaxed font-display">{recommendation.why}</p>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {Array.isArray(recommendation.strengths) && (
            <div>
              <div className="eyebrow text-emerald-800 mb-1">Strengths</div>
              <ul className="list-disc pl-5 text-sm space-y-1">{recommendation.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
          {Array.isArray(recommendation.weaknesses) && (
            <div>
              <div className="eyebrow text-rose-800 mb-1">Weaknesses</div>
              <ul className="list-disc pl-5 text-sm space-y-1">{recommendation.weaknesses.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
        </div>
        {recommendation.price_assessment && (
          <div className="mt-5">
            <div className="eyebrow mb-1">Price assessment</div>
            <p className="text-sm">{recommendation.price_assessment}</p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="eyebrow mb-3">Also considered · {candidates.length} real candidates</div>
        <div className="grid md:grid-cols-2 gap-3">
          {candidates.map((c) => (
            <div key={c.product_id} className="flex items-center justify-between gap-3 p-4 border border-border rounded-xl bg-card">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{c.product_name}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.seller || "—"}</div>
                <div className="mt-2"><PriceBadge current={c.current_price} original={c.original_price} size="sm" /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
