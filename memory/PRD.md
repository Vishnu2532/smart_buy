# SMART BUY — PRD

## Problem statement
SMART BUY helps users make real purchasing decisions in India. NON-NEGOTIABLE mandate: never present fake data as real. All products, prices, sellers, ratings, review counts, reviews, and price history must come from legitimate sources. Empty state > fake data.

## Architecture
- Frontend: React 19 + React Router + Tailwind + shadcn UI + recharts + sonner
- Backend: FastAPI + Motor (MongoDB)
- Live shopping data: SerpAPI Google Shopping (engine=google_shopping, gl=in, hl=en)
- AI analysis: Gemini 2.5 Pro via Emergent Universal LLM Key (analysis-only; never invents data)
- Storage: MongoDB collections `products`, `price_observations`, `reviews`, `ai_analyses`, `search_snapshots`

## Endpoints (all /api)
- GET /health, GET /search, GET /products/{id}, GET /recent-products
- POST /products/{id}/refresh-reviews — returns source_unavailable=true when Google's product endpoint is deprecated (honest, not 502)
- POST /analyze-reviews — requires >=2 real reviews, else returns insufficient=true
- POST /compare — Gemini verdict grounded in real product records
- POST /recommend — live SerpAPI search + Gemini picks from real candidates

## What's implemented (2026-02)
- Live SerpAPI Google Shopping search with sort + price + rating filters (INR)
- Product detail: real price, seller, rating, review count, provenance, delivery, seller link
- Price history chart from REAL observations only (honest empty state when <2 points)
- Deal detection ONLY from real observations (>=3 required); labels: Great Deal / Good Price / Around Average / Price Above Average / Insufficient history
- Honest empty states everywhere: no products, no reviews, no price history, source unavailable
- AI review analysis gated behind >=2 real reviews; Gemini system prompt enforces "no fabrication"
- Side-by-side compare page with AI verdict
- Recommend page: user requirements + live SerpAPI + Gemini grounded selection
- Sticky header with brand, nav, live SerpAPI indicator; footer with data-provenance policy
- Provenance badge (Live · Google Shopping / Stored) with relative timestamp

## Prioritized backlog
- P1: Extend reviews sourcing — Amazon Reviews via SerpApi (`amazon_reviews` engine) when seller is Amazon, so we can display real review text for a subset of products
- P1: Track price observations for wishlisted products via a cron/background sweep so history builds up faster
- P2: User accounts + wishlist + price-drop alerts (email)
- P2: `google_immersive_product` engine integration with page_token flow for richer product data
- P2: Category browse pages (Electronics, Home, etc.) driven by real recent-searches
- P3: Export a product's price journey as CSV / share link

## Data policy (do not violate)
- Never fabricate products, reviews, ratings, prices, discounts, specifications, or price history
- Every field missing from source = null / "Not available"
- Gemini analyzes only what backend sends; the system prompt forbids inventing content

## Iteration 2 — Premium visual redesign (2026-02)
- Brand identity: SmartBuyLogo SVG (shopping bag + inset checkmark + emerald verification bead), favicon.svg, page title & OG metadata
- Typography: Fraunces display serif, Inter body, JetBrains Mono for tabular numbers
- Color system: warm ivory background, near-black foreground, refined coral accent, restrained emerald/amber/rose signals
- Reusable primitives: TrustPill/LivePill, PriceBadge, RatingDisplay, DealBadge, SourceBadge, LoadingSkeleton, ProductCard
- Home: premium hero with subtle grid + radial glow, real live snapshot preview card (honest skeleton when empty), 4 trust pillars, CTA
- Search: card-elevated bar with inline submit, desktop filter sidebar + mobile filter drawer, skeleton loaders
- Product: editorial gallery layout, tabular price, deal badge, real reviews section, AI take card with accent hairline
- Compare: side-by-side with AI-pick highlight
- Recommend: prompt chips, best-match card with accent hairline, candidate list
- Mobile: no horizontal scroll at 390px, sticky glass header + bottom tab nav
