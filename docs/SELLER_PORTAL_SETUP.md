# Sell to Paradise — Shopify setup

## Goal
Keep the Seller Portal fully navigable for the August 27 demo, then enable the Shopify-native photo relay when the target store is available.

## Current behavior
The portal has two modes:

### Demo mode
If no `intake_product` is assigned in the Seller Portal section:
- all four steps work
- customers can select, preview, remove and reorder up to 12 photos
- text/contact details can submit through Shopify's native contact form
- selected photos are **not transmitted**
- the interface clearly labels the photo relay as demo mode

This prevents the demo from dead-ending before Shopify store configuration is finished.

### Relay mode
When a valid intake product is assigned:
- selected photos are posted to Shopify as line-item file properties
- returned file URLs are captured into the contact submission
- the temporary cart line is removed after upload

The relay remains beta until persistence is verified on the real store after the temporary line is removed.

## Create the intake product
In Shopify Admin:

1. Go to **Products → Add product**.
2. Title it something obvious internally, for example `Seller Intake Upload Relay`.
3. Set price to `$0.00`.
4. Use one default variant.
5. Do not track inventory, or give it sufficient inventory for testing.
6. Keep it out of normal merchandising collections and navigation.
7. Make sure the variant can be added through the Online Store sales channel during testing.
8. Save the product.

## Assign it to the Seller Portal
1. Go to **Online Store → Themes → Customize**.
2. Open the page using the `sell-to-paradise` template.
3. Open the **Seller portal** section.
4. Set **Hidden intake product** to `Seller Intake Upload Relay`.
5. Save.

The section will automatically output the selected variant ID and enable relay mode.

## Required real-store QA
Before claiming photo relay is production-ready:

1. Select 2-3 normal phone photos.
2. Complete all seller steps.
3. Submit.
4. Confirm `/cart/add.js` accepts the file-valued line-item properties.
5. Confirm usable Shopify-hosted file URLs are returned.
6. Confirm the contact email contains those URLs.
7. Confirm the temporary cart line is removed.
8. Open the file URLs after cart removal.
9. Reload / use a new browser session and re-check the URLs.
10. Re-check later before relying on orphaned-file persistence in production.

If URL persistence is unreliable, do not silently ship the relay. Keep demo mode or move to a deliberately designed order-based intake fallback after discussing the analytics/notification tradeoffs.

## Client-side limits
The current portal:
- accepts image files only (including common HEIC/HEIF filenames where the browser exposes an empty MIME type)
- limits selection to 12 photos
- rejects files larger than 20 MB
- de-duplicates the same selected file
- allows remove/reorder
- preserves existing selections when more photos are picked

## Page setup
The theme already includes:

`templates/page.sell-to-paradise.json`

Create a Shopify Page named **Sell to Paradise** and assign the `sell-to-paradise` template.

Recommended handle:

`/pages/sell-to-paradise`

## Launch rule
For the August 27 demo, a functioning demo-mode portal is acceptable. Do not delay the entire Shopify demo solely to prove orphaned file persistence.
