import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Sparkles, X, ArrowLeft, ShoppingBag, Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { api, relativeTime } from "@/lib/api";
import EmptyState from "@/components/EmptyState";
import SourceBadge from "@/components/ProvenanceBadge";
import PriceBadge from "@/components/PriceBadge";
import RatingDisplay from "@/components/RatingDisplay";

export default function Compare() {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("smartbuy_compare") || "[]"); } catch { return []; }
  });
  const [verdict, setVerdict] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const remove = (pid) => {
    const next = items.filter((x) => x.product_id !== pid);
    setItems(next);
    sessionStorage.setItem("smartbuy_compare", JSON.stringify(next));
    setVerdict(null);
  };

  useEffect(() => { setVerdict(null); }, [items.length]);

  const run = () => {
    if (items.length !== 2) return;
    setLoading(true); setVerdict(null);
    api.post("/compare", { product_ids: items.map((x) => x.product_id) })
      .then((r) => setVerdict(r.data))
      .catch((e) => toast.error(e?.response?.data?.detail || "Comparison failed"))
      .finally(() => setLoading(false));
  };

  const share = () => {
    if (!verdict) return;
    setSharing(true);
    api.post("/share", { kind: "compare", payload: { items, comparison: verdict.comparison, generated_at: verdict.generated_at } })
      .then((r) => {
        const url = `${window.location.origin}/s/${r.data.share_id}`;
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        if (navigator.share) navigator.share({ title: "SMART BUY verdict", url }).catch(() => {});
        toast.success("Public link copied", { description: url });
      })
      .catch((e) => toast.error(e?.response?.data?.detail || "Could not create share link"))
      .finally(() => setSharing(false));
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-8 py-16">
        <EmptyState
          title="Nothing to compare yet"
          description="Head to Search, pick up to 2 real products with 'Add compare', then return here for the AI verdict."
          action={<Link to="/search" className="btn-primary">Open search</Link>}
        />
      </div>
    );
  }

  const winnerId = verdict?.comparison?.winner_product_id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-up">
      <Link to="/search" className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to search
      </Link>

      <div className="mb-8">
        <div className="eyebrow mb-1">Side by side</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          Which one wins?{" "}
          <span className="italic text-accent">Let real data decide.</span>
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {items.map((p) => (
          <div key={p.product_id} className={`relative border rounded-2xl p-5 sm:p-6 bg-card transition-all ${winnerId === p.product_id ? "border-accent card-elevated" : "border-border"}`}>
            {winnerId === p.product_id && (
              <span className="absolute -top-3 left-5 chip bg-foreground text-background border-foreground">
                <Check className="h-3 w-3" /> AI pick
              </span>
            )}
            <button
              onClick={() => remove(p.product_id)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground rounded-md p-1.5 hover:bg-secondary"
              data-testid={`remove-${p.product_id}`}
              aria-label="Remove from compare"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="aspect-video bg-secondary/40 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
              {p.image ? <img src={p.image} alt="" className="max-h-full object-contain p-4" /> : (
                <div className="flex items-center gap-2 text-muted-foreground text-xs"><ShoppingBag className="h-5 w-5" /> No image</div>
              )}
            </div>
            <h3 className="font-display text-lg sm:text-xl font-semibold leading-tight tracking-tight">{p.product_name}</h3>
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              {p.seller && <span className="chip">{p.seller}</span>}
              <RatingDisplay rating={p.rating} reviewCount={p.review_count} />
            </div>
            <div className="mt-4">
              <PriceBadge current={p.current_price} original={p.original_price} />
            </div>
            <div className="mt-4">
              <SourceBadge source={p.source} retrievedAt={p.retrieved_at} />
            </div>
          </div>
        ))}
      </div>

      {items.length === 2 && !verdict && (
        <div className="mt-8">
          <button
            type="button"
            onClick={run}
            disabled={loading}
            data-testid="run-compare"
            className="btn-primary"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Run AI verdict
          </button>
        </div>
      )}

      {verdict && verdict.comparison && (
        <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-5 card-elevated">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="eyebrow">SMART BUY AI · Verdict</span>
          </div>
          {verdict.comparison.insufficient_evidence && (
            <div className="border-l-4 border-amber-500 bg-amber-50/70 p-3 text-sm rounded-r-md">
              The supplied product data is limited. Treat this verdict as conditional.
            </div>
          )}
          {verdict.comparison.verdict && (
            <p className="text-base sm:text-lg leading-relaxed font-display">{verdict.comparison.verdict}</p>
          )}
          <div className="grid md:grid-cols-2 gap-6 pt-2">
            {["a", "b"].map((k, idx) => (
              <div key={k}>
                <div className="text-sm font-semibold mb-2 truncate">{items[idx]?.product_name}</div>
                {Array.isArray(verdict.comparison[`pros_${k}`]) && verdict.comparison[`pros_${k}`].length > 0 && (
                  <>
                    <div className="eyebrow text-emerald-800 mt-2 mb-1">Pros</div>
                    <ul className="list-disc pl-5 text-sm space-y-1">{verdict.comparison[`pros_${k}`].map((x, i) => <li key={i}>{x}</li>)}</ul>
                  </>
                )}
                {Array.isArray(verdict.comparison[`cons_${k}`]) && verdict.comparison[`cons_${k}`].length > 0 && (
                  <>
                    <div className="eyebrow text-rose-800 mt-3 mb-1">Cons</div>
                    <ul className="list-disc pl-5 text-sm space-y-1">{verdict.comparison[`cons_${k}`].map((x, i) => <li key={i}>{x}</li>)}</ul>
                  </>
                )}
              </div>
            ))}
          </div>
          {verdict.comparison.value_for_money && (
            <div>
              <div className="eyebrow mt-3 mb-1">Value for money</div>
              <p className="text-sm">{verdict.comparison.value_for_money}</p>
            </div>
          )}
          <div className="flex items-center justify-between gap-4 pt-4 flex-wrap border-t border-border/70">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Generated {relativeTime(verdict.generated_at)}
            </div>
            <button
              type="button"
              onClick={share}
              disabled={sharing}
              data-testid="share-compare"
              className="btn-secondary text-xs"
            >
              {sharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
              Share verdict
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
