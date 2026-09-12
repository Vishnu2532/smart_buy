import { Star } from "lucide-react";

/**
 * Real rating display. Renders nothing when the source didn't provide a rating.
 * Never invents a rating from AI sentiment.
 */
export default function RatingDisplay({ rating, reviewCount, size = "sm" }) {
  const hasRating = rating !== null && rating !== undefined;
  if (!hasRating) {
    return <span className="text-xs italic text-muted-foreground">No rating data</span>;
  }
  const iconSize = size === "lg" ? "h-4 w-4" : "h-3 w-3";
  const textSize = size === "lg" ? "text-sm" : "text-xs";
  return (
    <span className={`inline-flex items-center gap-1 ${textSize} text-foreground`}>
      <Star className={`${iconSize} fill-amber-500 text-amber-500`} />
      <span className="font-mono font-semibold tabular">{Number(rating).toFixed(1)}</span>
      {reviewCount !== null && reviewCount !== undefined && (
        <span className="text-muted-foreground">
          ({Number(reviewCount).toLocaleString("en-IN")})
        </span>
      )}
    </span>
  );
}
