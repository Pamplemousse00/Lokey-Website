LO-KEY WEBSITE + CLOUDFLARE BACKEND V2

Core storefront files
- index.html
- product.html
- styles.css
- script.js
- vehicle-request-config.js
- compatibility-data.json / compatibility-data.js
- compatibility-messages.js
- product-images.js

Backend files
- functions/api/reviews.js
- functions/api/vehicle-requests.js
- functions/api/compatibility.js
- functions/api/cart-events.js
- functions/api/admin/*
- admin/index.html, admin/admin.js, admin/admin.css
- schema.sql for a fresh database
- MIGRATION-V2.sql for an existing backend-v1 database

Current features
- D1-backed, moderated customer reviews
- Required review vehicle field: year, make, and model
- Turnstile-protected review and vehicle-request forms
- Vehicle requests with one or more key-fob battery sizes
- Admin deletion of vehicle requests
- Admin battery-size request chart
- Admin Yes / Probably / No compatibility manager
- D1 compatibility records that override the static catalogue
- Add-to-cart event and unit counters in the admin dashboard
- Shopify cart permalink checkout

Deployment
This folder is intended to be the repository root used by Cloudflare Pages.
Push it to the connected GitHub repository and Cloudflare will deploy both the
static site and the Pages Functions.

Existing database upgrade
Run MIGRATION-V2.sql once in the Cloudflare D1 console before deploying this
version. See CLOUDFLARE-BACKEND-SETUP.md for exact instructions.

Admin
Open:
  https://lokey.ca/admin/

The admin page requires the ADMIN_API_KEY configured as a Cloudflare secret.

Turnstile
The public sitekey is stored in vehicle-request-config.js. The private secret
must remain in Cloudflare as TURNSTILE_SECRET_KEY and must never be committed.
