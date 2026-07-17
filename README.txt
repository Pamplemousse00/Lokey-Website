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

REVIEWS
-------
Both pages load review content from reviews-data.js. Edit that single file to add,
remove, or update reviews. The included records are clearly marked demo content for
layout testing; replace them with genuine purchaser feedback before launch.

Each review supports these fields:
- id
- name
- title
- body
- rating (1 to 5)
- date (YYYY-MM-DD)
- country
- verified (true or false)
- demo (true only for temporary sample content)


REVIEW PREVIEW, POPUP, AND SUBMISSION
------------------------------------
The home page initially shows 3 reviews; the product page initially shows 6.
The Show all reviews button opens a scrollable popup containing the complete
review list. The popup has its own Most recent, Top rated, and Lowest rated
sorting control, so even a large review collection does not lengthen the page.

The Write a review button opens a shared form modal. Review submissions do not
use localStorage. With window.LO_KEY_REVIEW_API left blank, the form displays a
configuration message instead of pretending to publish the review.

For production, set window.LO_KEY_REVIEW_API in reviews-data.js to a secure API
endpoint. That endpoint should:
- accept the form data,
- verify order number + purchase email against Shopify using the Admin API,
- store approved reviews in a database,
- return { review: {...} }, including verified: true only after a successful check.

After a successful API response, the returned review is inserted into the page
immediately for the current session. The database/API remains the permanent
source of truth.

Never expose a Shopify Admin API token in script.js or reviews-data.js.

ORDER-CONFIRMATION REVIEW LINK
------------------------------
The form supports URL prefill. A link such as:

  https://yourdomain.ca/product.html?review=1&order=%231001#reviews

opens the review modal and pre-populates the order number. The customer can then
enter the purchase email used at checkout. Avoid putting the customer's email in
the URL because URLs may be stored in browser history, analytics, and server logs.
