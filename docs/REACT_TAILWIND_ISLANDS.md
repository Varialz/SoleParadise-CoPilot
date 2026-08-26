# React + Tailwind Islands

Sole Paradise remains a Shopify Liquid theme. React is used only for interactions where local UI state or richer motion materially improves the shopping experience.

## Architecture

- **Liquid owns Shopify data and commerce.** Products, prices, URLs, variants, cart forms, SEO markup, Theme Editor settings, and no-JS fallbacks stay server rendered.
- **React progressively enhances selected sections.** The initial island is `From the Feed`.
- **Tailwind is compiled and isolated inside the island Shadow DOM.** Its utility styles cannot leak into the Liquid theme or reset existing Shopify components.
- **GSAP remains the motion engine.** React owns state; GSAP handles intentional entry/reveal motion when available.
- **Native Shopify Quick View remains the commerce implementation.** React calls the existing Liquid quick-view trigger rather than maintaining a second cart/product system.

## From the Feed island

Files:

- `sections/sp-from-feed.liquid`
- `assets/sp-react-feed.js`
- `assets/sp-react-feed.css`

Behavior:

1. Liquid renders the normal feed first.
2. Liquid also emits a compact JSON representation of the same products.
3. The React module attaches a Shadow DOM and loads the isolated Tailwind stylesheet.
4. Only after the stylesheet loads successfully does React mount and hide the fallback feed.
5. If React, the CDN, or the stylesheet fails, the original Liquid feed remains visible and functional.

The React treatment adds:

- tactile horizontal lookbook browsing
- variable editorial card widths
- drag-to-scroll
- active-card tracking
- arrow navigation
- subtle pointer depth on photography
- GSAP staggered entry motion
- existing Shopify Quick View integration

The Theme Editor setting **Use enhanced React lookbook** can disable the island without removing the underlying section.

## Dependency policy

Do not convert the full theme into a React SPA. Do not duplicate product, cart, variant, or checkout logic in React unless there is a clear Shopify limitation that requires it.

Before adding another island, ask whether React materially improves one of these:

- interaction state
- media browsing
- filtering/search experience
- cart feedback
- editorial storytelling
- high-value motion

If normal Liquid + CSS + lightweight JavaScript can do the job just as well, keep it native.

## Good next candidates

1. Quick View visual shell while preserving the existing cart/product controller.
2. Predictive search overlay.
3. Shoppable editorial/lookbook module.
4. Cart drawer feedback and cross-sell rail.

Do not use React simply to render ordinary product grids, headers, static copy, or footer navigation.
