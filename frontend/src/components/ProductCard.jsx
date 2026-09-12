import { Link } from "react-router-dom";
import { Star, ExternalLink, ShoppingBag } from "lucide-react";
import { formatINR, relativeTime } from "@/lib/api";
import ProvenanceBadge from "@/components/ProvenanceBadge";

/**
 * Real-data product card. Never invents missing fields.
 */
export default function ProductCard({ product, onCompareAdd, compareSelected }) {
  const currentPrice = formatINR(product.current_price);
  const originalPrice = formatINR(product.original_price);
  const discount =
    product.current_price && product.original_price && product.original_price > product.current_price
      ? Math.round(((product.original_price - product.current_price) / product.original_price) * 100)
      : null;

  return (
    <article
      data-testid={`product-card-${product.product_id}`}
      className="group flex flex-col bg-card border border-border rounded-sm overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
    >
      <Link to={`/product/${encodeURIComponent(product.product_id)}`} className="block">
        <div className="aspect-[4/3] bg-secondary/40 relative overflow-hidden flex items-center justify-center">
          {product.image ? (
            // eslint-disable-next-line jsx-a11y/img-redundant-alt
            <img
              src={product.image}
              alt={product.product_name || "Product image"}
              className="max-h-full max-w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          )}
          {discount !== null && discount >= 5 && (
            <div className="absolute top-2 left-2 bg-foreground text-background text-[10px] font-mono font-bold px-2 py-1 rounded-sm uppercase tracking-widest">
              -{discount}%
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <Link to={`/product/${encodeURIComponent(product.product_id)}`}>
          <h3
            data-testid={`product-name-${product.product_id}`}
            className="font-display text-base font-semibold leading-tight line-clamp-2 hover:text-accent transition-colors"
          >
            {product.product_name || "Untitled product"}
          </h3>
        </Link>

        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          {product.seller ? (
            <span className="font-mono uppercase tracking-widest text-[10px]">{product.seller}</span>
          ) : (
            <span className="font-mono uppercase tracking-widest text-[10px] italic">Seller not available</span>
          )}
          {product.rating !== null && product.rating !== undefined ? (
            <span className="inline-flex items-center gap-1 text-foreground">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              <span className="font-mono font-semibold">{product.rating}</span>
              {product.review_count !== null && product.review_count !== undefined && (
                <span className="text-muted-foreground">({product.review_count.toLocaleString("en-IN")})</span>
              )}
            </span>
          ) : (
            <span className="italic">No rating data</span>
          )}
        </div>

        <div className="flex items-end justify-between gap-2 mt-auto">
          <div>
            {currentPrice ? (
              <div className="font-mono font-bold text-xl tracking-tight text-foreground">
                {currentPrice}
              </div>
            ) : (
              <div className="text-sm italic text-muted-foreground">Price not available</div>
            )}
            {originalPrice && discount !== null && (
              <div className="text-xs text-muted-foreground line-through font-mono">{originalPrice}</div>
            )}
          </div>
          <ProvenanceBadge source="serpapi" retrievedAt={product.retrieved_at} compact />
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-border">
          {onCompareAdd && (
            <button
              type="button"
              onClick={() => onCompareAdd(product)}
              data-testid={`compare-toggle-${product.product_id}`}
              className={`text-[11px] font-mono uppercase tracking-widest px-2.5 py-1.5 rounded-sm border transition-colors ${
                compareSelected
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:bg-secondary"
              }`}
            >
              {compareSelected ? "In compare" : "Add compare"}
            </button>
          )}
          {product.seller_url && (
            <a
              href={product.seller_url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`seller-link-${product.product_id}`}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              View seller <ExternalLink className="h-3 w-3" />
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
