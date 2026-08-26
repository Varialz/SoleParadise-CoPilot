# Sole Paradise — Archive / From the Feed Setup

This feature is designed for Shopify Basic and does not require a paid backend.

## Employee workflow

1. Post the piece to Instagram using the normal photo carousel.
2. In Shopify mobile/admin, create a product draft using the same photos.
3. Set inventory to 1 for one-off used pieces.
4. Add the `FROM-FEED` product tag.
5. Fill the relevant custom metafields below.
6. Review and publish.

## Product metafields

Create these product metafield definitions under **Settings → Custom data → Products** using namespace `custom`.

| Key | Suggested type | Purpose |
| --- | --- | --- |
| `item_state` | Single line text | `Pre-Owned`, `New`, etc. |
| `size` | Single line text | Used-piece size when the item is not modeled as a size variant |
| `condition` | Single line text | Example: `9 / 10` or `Excellent` |
| `flaws` | Multi-line text | Visible condition notes / disclosed flaws |
| `measurements` | Single line or multi-line text | Example: `23 in pit-to-pit × 27 in length` |
| `archive_id` | Single line text | Optional internal/archive number |
| `instagram_permalink` | URL | Optional original Instagram post URL |

All fields are optional. The storefront only renders populated values.

## Automatic collection

Create a Shopify automated collection called **From the Feed** with this condition:

- Product tag is equal to `FROM-FEED`

Then open the Theme Editor, find the homepage **From the Feed** section, and select that collection.

The section uses normal Shopify product objects, so there is no Instagram API or client-side inventory dependency.

## Theme behavior

Products tagged `FROM-FEED` automatically receive:

- `From the Feed` archive labeling on product cards
- 1-of-1 treatment when no archive ID is supplied
- optional size / condition / item-state metadata on cards
- an archive details panel on the product page
- optional condition notes and measurements
- optional link back to the original Instagram post

Products without the tag continue to use the normal Sole Paradise product presentation.
