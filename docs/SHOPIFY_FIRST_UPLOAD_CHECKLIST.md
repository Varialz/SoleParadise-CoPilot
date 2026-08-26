# Sole Paradise — First Shopify Upload Checklist

## Goal
Get the current theme onto a real Shopify store and reach a credible demo state without relying on unfinished merchant configuration.

## Before upload
- Use the latest `main` branch as the source of truth.
- Do not merge design experiments directly into `main` without reviewing them against the approved Sole Paradise mockup.
- Keep the store password protected until the client approves the demo.
- Do not configure Shopify Payments, payout banking, tax identity, or client billing with developer credentials.

## First 30 minutes in Shopify
1. Upload / sync the latest theme as **unpublished**.
2. Open Theme Editor before adding extra apps.
3. Confirm the homepage renders without a Liquid error.
4. Confirm header and footer render.
5. Confirm the following templates exist:
   - Home
   - Collection
   - Product
   - Search
   - Sell to Paradise page
6. Create at least 8 representative products with usable images and prices.
7. Verify at least one product has multiple variants and one is sold out.
8. Assign a hero campaign image and optional mobile hero crop.

## Demo content minimum
Use enough real-looking inventory to prevent empty retail surfaces:
- 8–12 products minimum
- 3+ designers
- 2+ clothing categories
- 1 footwear product
- 1 jewelry/accessory product
- 2–3 `FROM-FEED` tagged products
- 1 sold-out/archive example
- 1 product with archive metadata populated

## Recommended product metafields
Namespace: `custom`
- `condition`
- `condition_score`
- `archive_id`
- `one_of_one`
- `measurements`
- `flaws`
- `original_accessories`
- `item_state`
- `size`
- `instagram_permalink`

## Homepage configuration order
1. Hero
2. From the Feed
3. Paradise Edit
4. Paradise Selects
5. New Arrivals
6. Paradise Features
7. Brand Index
8. Trust
9. Sell to Paradise
10. Paradise Archive / sold pieces

The theme has safe product fallbacks for partially configured merchandising sections, but final demo quality improves once real collections and picks are assigned.

## Navigation
Create the primary navigation before client review:
- SHOP
- NEW
- DESIGNERS
- CLOTHING
- FOOTWEAR
- ARCHIVE
- FEATURES
- SELL

Suggested SHOP submenu:
- New In
- From the Feed
- 1 of 1
- Pre-Owned
- Staff Picks
- Under $500

Suggested DESIGNERS submenu:
- Chrome Hearts
- Rick Owens
- AMIRI
- Balenciaga
- Gallery Dept.
- Saint Mxxxxxx
- View all designers

## Required pages
Create and assign:
- Sell to Paradise → `page.sell-to-paradise`
- Shipping / Returns policy
- Privacy policy
- Terms of service
- Contact page if desired

## Commerce QA
Test on the unpublished theme:
- Product link opens PDP
- Variant selection updates correctly
- Available product adds to cart
- Sold-out product cannot be added
- Quick View opens and closes
- Quick View Add to Bag works
- Normal product link still works without Quick View
- Cart count/state updates
- Search returns products
- Collection filters/sort work
- Product recommendations load when Shopify returns recommendations

## Seller Portal
The seller portal can operate in launch/demo mode without the hidden intake product.

To enable the experimental Shopify photo relay:
1. Create a dedicated $0 hidden intake product.
2. Keep it out of sales-facing collections/navigation.
3. Assign it in the Seller Portal section setting.
4. Follow `docs/SELLER_PORTAL_SETUP.md` and verify file persistence before treating the relay as production-ready.

## Mobile QA widths
Check at approximately:
- 390px
- 430px
- 750px
- 1000px
- 1440px desktop

Confirm:
- no horizontal overflow
- mobile hero crop reads correctly
- product grids stay 2-column where intended
- mobile menu is usable
- collection Filter / Sort toolbar remains usable
- Quick View purchase controls are reachable
- PDP reaches Add to Cart quickly

## Final demo rule
Do not spend the last launch window adding features. Once the core path works, only fix visible blockers, broken commerce behavior, layout collisions, dead links, and client-facing configuration mistakes.
