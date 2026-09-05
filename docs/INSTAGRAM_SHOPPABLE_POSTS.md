# Instagram shoppable-post import

Source: https://www.instagram.com/soleparadise.chicago/

This manifest tracks posts imported into the homepage `From the Feed` section. Product selectors remain the source of truth for direct PDP links. Until a Shopify product is selected, the storefront uses a product-scoped search link and clearly labels the action `Find`.

| Post | Theme asset | Products captured | Import status |
| --- | --- | --- | --- |
| `DceBrFhld8m` | `instagram-dcebrfhld8m.jpg` | Chrome Scroll Logo Thermal Black Zipup Hoodie; Chrome Scroll Logo Black Sweatpants; Black White Skate Sneakers | Image/details imported; Shopify product selection pending |
| `Dc1Wp7Elc_n` | `instagram-dc1wp7elc_n.jpg` | ABC Desires Tee; Holy Grail Dirty Wash White Denim; Pearlized Brown Vans | Image/details imported; Shopify product selection pending |
| `DcmQW9jDwcU` | `instagram-dcmqw9jdwcu.jpg` | ST.Vanity Black Ash Crewneck; HMDD Black Patch Baggy Denim; Sicko Black White Hiking Shoes | Image/details imported; Shopify product selection pending |
| `DcltViXuCHV` | `instagram-dcltvixuchv.jpg` | Pearlized Pink Vans; Pearlized Brown Vans; Pearlized Blue Vans | Image/details imported; Shopify product selection pending |

## Import rules

- Skip time-sensitive sale flyers, event flyers, and posts without merchandise.
- Use the exact Instagram caption for product names, sizes, condition, and price.
- Preserve the original Instagram permalink.
- Do not claim a direct PDP match until the corresponding Shopify product has been selected.
- One homepage block represents one post and supports up to three featured products.
