import { Link } from "react-router-dom";
import { ExternalLink, ShoppingBag, Heart, Check } from "lucide-react";
import { relativeTime } from "@/lib/api";
import PriceBadge from "@/components/PriceBadge";
import RatingDisplay from "@/components/RatingDisplay";
import SourceBadge from "@/components/ProvenanceBadge";

export default function ProductCard({ product, onCompareAdd, compareSelected, dense = false }) {
  return (
    <article
      data-testid={`product-card-${product.product_id}`}
      className={`group flex flex-col bg-card border border-border rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:card-elevated`}
    >
      <Link to={`/product/${encodeURIComponent(product.product_id)}`} className="block relative">
        <div className="aspect-[4/3] bg-secondary/40 relative overflow-hidden flex items-center justify-center">
          {product.image ? (
            <img
              src={product.image}
              alt={product.product_name || "Product image"}
              className="max-h-full max-w-full object-contain p-5 transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ShoppingBag className="h-10 w-10" />
              <span className="text-[10px] font-mono uppercase tracking-widest">No image</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <SourceBadge source={product.source} retrievedAt={product.retrieved_at} compact />
          </div>
        </div>
      </Link>

      <div className={`${dense ? "p-3" : "p-4"} flex-1 flex flex-col gap-3`}>
        <Link to={`/product/${encodeURIComponent(product.product_id)}`}>
          <h3
            data-testid={`product-name-${product.product_id}`}
            className="font-display text-base sm:text-[17px] font-semibold leading-tight line-clamp-2 hover:text-accent transition-colors"
          >
            {product.product_name || "Untitled product"}
          </h3>
        </Link>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {product.seller ? (
            <span className="chip">{product.seller}</span>
          ) : (
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground italic">
              Seller not available
            </span>
          )}
          <RatingDisplay rating={product.rating} reviewCount={product.review_count} />
        </div>

        <div className="mt-auto">
          <PriceBadge current={product.current_price} original={product.original_price} />
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-border/70">
          {onCompareAdd && (
            <button
              type="button"
              onClick={() => onCompareAdd(product)}
              data-testid={`compare-toggle-${product.product_id}`}
              className={`text-[11px] font-mono uppercase tracking-widest px-2.5 py-1.5 rounded-md border transition-all ${
                compareSelected
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:bg-secondary hover:border-foreground/40"
              }`}
            >
              {compareSelected ? (
                <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" /> In compare</span>
              ) : (
                "Add compare"
              )}
            </button>
          )}
          <button
            type="button"
            aria-label="Save (coming soon)"
            title="Save to watchlist (coming soon)"
            className="text-muted-foreground hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-secondary"
          >
            <Heart className="h-3.5 w-3.5" />
          </button>
          {product.seller_url && (
            <a
              href={product.seller_url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`seller-link-${product.product_id}`}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Seller <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="text-[10px] font-mono text-muted-foreground">
          Retrieved {relativeTime(product.retrieved_at)}
        </div>
      </div>
    </article>
  );
}
