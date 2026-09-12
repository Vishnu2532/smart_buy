/**
 * SMART BUY brand mark.
 * Concept: shopping bag (commerce) + inset checkmark (verified/smart choice) +
 * a small emerald verification bead (real data trust signal).
 */
export default function SmartBuyLogo({ size = 32, showWordmark = false, className = "", inverse = false }) {
  const fg = inverse ? "#EEE7DC" : "#0F1420";
  const bag = "#E97244"; // accent
  const check = inverse ? "#0F1420" : "#0F1420";
  const bead = "#4BA36B";
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="SMART BUY logo"
        role="img"
      >
        <rect width="32" height="32" rx="7" fill={inverse ? "#EEE7DC" : "#0F1420"} />
        <path d="M9.5 12.5V11a3.5 3.5 0 1 1 7 0v1.5" stroke={fg} strokeWidth="1.6" strokeLinecap="round" />
        <path
          d="M7.5 12.5h11l-1 10.5a2 2 0 0 1-2 1.8h-5a2 2 0 0 1-2-1.8L7.5 12.5Z"
          fill={bag}
          stroke={fg}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M11 17.2l1.7 1.7L15.5 15.5" stroke={check} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="22.5" cy="10.5" r="3" fill={bead} stroke={fg} strokeWidth="1.4" />
        <path d="M21.2 10.5l1 1 1.6-1.6" stroke={fg} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className={`font-display font-bold text-lg sm:text-xl tracking-tight ${inverse ? "text-background" : "text-foreground"}`}>
            SMART <span className="text-accent">BUY</span>
          </span>
          <span className="mt-1 text-[9px] font-mono font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Buy smarter. Decide better.
          </span>
        </div>
      )}
    </div>
  );
}
