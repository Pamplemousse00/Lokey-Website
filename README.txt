LO-KEY TWO-PAGE WEBSITE — REVISED

Files
- index.html: scrollable home page
- product.html: product details and interactive add-to-cart page
- styles.css: all responsive styling
- script.js: sticky header, mobile menu, FAQ, quantity selector, local cart drawer, confirmation dialog, and UI effects
- assets/: logo and presentation-reference images

Revision highlights
- Header moves into the top edge as the announcement banner scrolls away.
- Canadian maple-leaf branding appears in the navigation and About section.
- The home-page hero now identifies Lo-Key visually as a CR2032-style battery.
- Product price and summary appear beside the image on mobile.
- Mobile statistics use one compact row.
- Cart quantity removal requires confirmation.
- Battery-life language is deliberately conditional because results depend on the key fob and user routine.

Preview
Open index.html directly in a modern browser, or run a local server from this folder:

  python -m http.server 8000

Then visit:
  http://localhost:8000/

Storefront note
The cart works in the browser using localStorage. The checkout button is intentionally a front-end placeholder. Connect it to Shopify, Stripe, WooCommerce, or another payment system when the product is ready for sale.

Content note
The website uses concept imagery and pilot wording. Compatibility, safety, packaging, transport, certifications, pricing, and retail availability should be finalized before public launch.
