# Sole Paradise — Claude implementation handoff

## Deadline / operating mode
**Working Shopify demo required by end of day Thursday, August 27, 2026.**

Until that demo is live, reliability and launch-critical fidelity outrank new features. Read `docs/LAUNCH_PLAN_2026-08-27.md` before coding.

Do not spend deadline time inventing new sections, new data models, or architectural rewrites unless they fix a P0 blocker.

## Mission
Help turn the approved Sole Paradise visual target into the real Shopify theme without redesigning the product.

The north star is the approved composite mockup: a dark Chicago luxury-resale storefront with an END.-style boutique surface and Grailed-style resale/archive intelligence.

## Design contract
- Brand: Sole Paradise
- Positioning: Chicago luxury resale boutique / archive commerce
- Visual system: dark navy/black shell, crisp white typography, paradise blue accents
- Tone: fashion editorial, restrained, confident, dense enough to feel like a real retailer
- Do not add generic SaaS cards, glassmorphism, gradients for decoration, random rounded UI, fake metrics, or filler copy
- Product imagery and product information always outrank decoration
- Motion should be GSAP-based, deliberate, and accessibility-safe

## Current architecture
Shopify theme. Preserve native Shopify behavior and progressive enhancement.

Core systems already exist:
- full-bleed editorial hero
- dark utility/header shell and boutique menus
- From the Feed archive system
- Paradise Selects
- Paradise Features
- Shopify-native collection filtering/sorting
- editorial PDP dossier with archive metadata
- product recommendations / More Like This
- global Quick View drawer using Shopify product JSON + cart/add.js
- Seller Portal multi-step intake
- GSAP + ScrollTrigger motion layer

## Files Claude should inspect first
- `docs/LAUNCH_PLAN_2026-08-27.md`
- `layout/theme.liquid`
- `assets/sole-paradise.css`
- `assets/mockup-alignment.css`
- `assets/header.css`
- `assets/product-card.css`
- `assets/collection.css`
- `assets/product.css`
- `assets/quick-view.css`
- `assets/quick-view.js`
- `assets/sole-paradise-motion.js`
- `sections/sp-hero.liquid`
- `sections/sp-from-feed.liquid`
- `sections/sp-paradise-selects.liquid`
- `sections/sp-features.liquid`
- `sections/main-collection.liquid`
- `sections/main-product.liquid`
- `snippets/product-card.liquid`
- `snippets/quick-view-drawer.liquid`

## Collaboration rules
1. Work in a feature branch. Never push directly to `main`.
2. Prefer small commits grouped by surface: header, collection, PDP, mobile, motion, etc.
3. Do not rewrite working Shopify logic just for style.
4. Do not remove no-JS fallbacks.
5. Do not add paid services or external app dependencies.
6. Do not expose secrets or Shopify Admin credentials in theme code.
7. Reuse existing product-card and product-form primitives.
8. If a change conflicts with the approved mockup direction, do not make it.
9. Preserve reduced-motion support.
10. Before finishing, compare your branch against `main` and list changed files + unresolved risks.
11. Until the Aug 27 demo is live, pick one P0 launch task at a time and stop when that task is complete.
12. Do not merge to `main`; return the branch/commits for review.

## Best work for Claude to take in parallel
To avoid collisions, focus on these lanes first:

### Lane A — Mobile fidelity
- match the approved mobile mockup more closely
- tighten mobile hero crop and typography
- make From the Feed a clean 2-column mobile grid
- improve mobile Quick View proportions and controls
- refine mobile menu spacing and hierarchy

### Lane B — PDP detail polish
- improve media thumbnails and information rhythm
- refine disclosures for `The Piece`, measurements, authenticity, shipping
- strengthen disabled/sold-out variant visuals
- keep purchase path safe

### Lane C — Accessibility / QA
- keyboard-test drawer, menu, filters, variant picker
- check focus-visible states
- inspect ARIA relationships
- check no-JS fallbacks
- check reduced motion
- identify Liquid or CSS regressions without redesigning surfaces

### Lane D — responsive cleanup
- inspect 390px, 750px, 1000px, 1200px, 1440px breakpoints
- remove text collisions / overflow
- verify 2-column mobile product cards and 3-4 column desktop collection density

## Do NOT independently change
Unless explicitly assigned:
- core brand palette
- hero messaging
- homepage section order
- product card information hierarchy
- Quick View architecture
- Seller Portal architecture
- Shopify data model / metafield namespace

## Acceptance criteria
A change is good if it makes the live Shopify theme closer to the approved mockup while keeping commerce behavior intact.

Before the Aug 27 deadline, a change is only worth shipping if it improves a P0 launch requirement or removes a real blocker.

The target feel is:
**END. boutique presentation + Grailed archive intelligence + Sole Paradise Chicago identity.**
