# Sole Paradise Shopify Demo — Launch Plan

## Deadline
**Working Shopify demo by end of day Thursday, August 27, 2026.**

This deadline outranks additional polish. The objective is a credible, navigable, commerce-safe Shopify demo that visibly matches the approved Sole Paradise direction.

## Definition of done
The demo is launchable when all of the following are true:

1. Theme installs / publishes to the target Shopify development or client store without a blocking Liquid error.
2. Homepage renders with the Sole Paradise dark boutique identity.
3. Header/navigation work on desktop and mobile.
4. Collection page renders products and native Shopify filters/sort without breaking.
5. Product page renders media, variants, price, Add to Cart, archive metadata, and More Like This.
6. Quick View opens, loads a product, closes correctly, and preserves normal product links as fallback.
7. Cart/Add to Cart works for at least one real test product.
8. Search page works.
9. Sell to Paradise page renders and the form can be navigated. Photo relay may remain explicitly beta if live persistence has not been verified.
10. Core pages are usable at mobile and desktop widths with no major overflow/collision.
11. No secrets, paid-service dependency, or fake live functionality is introduced to hit the deadline.

## P0 — Must finish before launch

### Store connection / real Shopify QA
- Upload/sync latest `main` to the target Shopify store.
- Confirm Theme Editor can render the homepage.
- Confirm required templates exist and resolve.
- Add at least 6-12 representative products so product grids are not empty.
- Assign collections used by homepage sections.
- Create/assign the Sell to Paradise page template.
- Confirm product recommendation endpoint returns results when recommendations exist.

### Commerce path
- Test available variant selection.
- Test unavailable/sold-out state.
- Test Add to Cart from PDP.
- Test Add to Cart from Quick View.
- Verify cart count/state after Quick View add.
- Verify normal product link still works if Quick View JS fails.

### Visual fidelity
- Homepage hero image + crop.
- Mobile hero typography/crop.
- From the Feed mobile 2-column grid.
- Collection density and filter layout.
- PDP first viewport hierarchy.
- Quick View desktop/mobile proportions.
- Header/mobile menu spacing.

### Regression / accessibility
- Escape closes menus/drawers.
- Focus is visible.
- No horizontal overflow at ~390px, 750px, 1000px, 1440px.
- Reduced-motion path remains functional.
- No obvious console-breaking JS errors.

## P1 — Ship if time remains
- More detailed GSAP timings.
- Additional editorial content cards.
- Exact hover micro-interactions.
- Extra product card states.
- Footer visual polish.
- Better empty/search states.

## P2 — Explicitly after demo deadline
- Full Instagram ingestion automation.
- Seller photo relay production hardening if orphaned Shopify file persistence is still unverified.
- Advanced custom filters beyond native Shopify Search & Discovery.
- Complex page transitions.
- Bespoke editorial article templates.
- Any paid external service or backend.

## Parallel work split

### Primary integrator / final decisions
Own:
- merges into `main`
- homepage fidelity
- Quick View architecture
- commerce-path fixes
- Shopify integration decisions
- final launch QA

### Claude / secondary coding agent
Best lanes:
- mobile fidelity
- responsive cleanup
- PDP detail styling
- accessibility regression checks
- CSS overflow/collision fixes

Claude must work in a separate feature branch and must not merge to `main` without review.

### Additional coding agent
Use for isolated, testable tasks rather than simultaneous redesign:
- inspect Liquid syntax / Theme Check issues
- test responsive CSS
- trace JS errors
- review specific files for regressions
- implement one narrowly scoped P0 ticket per branch

## Freeze rule
After the Shopify theme renders successfully in the target store, **do not make large architecture changes before the demo**. Fix blockers and visible fidelity gaps only.

## Launch-day test order
1. Homepage desktop
2. Homepage mobile
3. Collection → filter/sort → product
4. Product variants → Add to Cart
5. Quick View → Add to Cart → close/open another product
6. Search
7. Seller Portal
8. Navigation/menu/footer links
9. Final mobile overflow pass
10. Publish/share preview link

## Decision rule
When choosing between a new feature and a reliable demo tomorrow: **choose the reliable demo.**
