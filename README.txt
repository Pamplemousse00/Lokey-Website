LO-KEY WEBSITE + CLOUDFLARE BACKEND V8

Public pages (kept at the project root for clean URLs)
- index.html
- product.html
- contact.html
- shipping.html
- returns.html
- warranty.html
- privacy.html
- terms.html
- robots.txt
- sitemap.xml
- openapi.json
- auth.md
- llms.txt

Runtime assets
- assets/css/styles.css
- assets/js/*.js
- assets/* images and icons

Backend and admin
- functions/: Cloudflare Pages Functions
- admin/: authenticated D1 administration dashboard
- D1-backed vehicle catalogue, reviews, requests, contact messages, cart events, and audit log
- Contact submissions are saved to D1 before email delivery is attempted
- Contact-message CSV export is available from /admin/

Project documentation and database history
- docs/internal/: deployment, SEO, agent-readiness, and change notes
- database/schema.sql: complete current table structure
- database/migrations/: historical migration scripts
- database/verification/: database verification queries
- scripts/: local verification utilities

Deployment
1. Push this complete folder to the GitHub repository connected to Cloudflare Pages.
2. Confirm the production D1 binding is named DB.
3. Confirm TURNSTILE_SECRET_KEY, ADMIN_API_KEY, RATE_LIMIT_SALT, RESEND_API_KEY,
   CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, and TURNSTILE_ALLOWED_HOSTNAMES are set.
4. Redeploy after changing Cloudflare variables or secrets.

Contact delivery
- A valid form submission is first stored in contact_messages.
- If Resend accepts the email, delivery_status becomes sent.
- If Resend rejects it or is not configured, the visitor still receives a successful
  acknowledgement and the delivery problem is recorded in delivery_status/delivery_error.
- Export Contact messages in /admin/ to review stored submissions and provider errors.
