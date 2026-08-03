LO-KEY WEBSITE + CLOUDFLARE BACKEND V7

Public pages
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

Backend and admin
- D1-backed moderated reviews
- D1-backed vehicle compatibility catalogue and dropdowns
- admin editing of existing vehicle battery/status records
- admin creation of completely new vehicles and model-year ranges
- Turnstile-protected public forms
- vehicle requests with battery-size analytics
- add-to-cart event metrics
- CSV exports for reviews, requests, vehicles, cart events, and audit logs
- admin audit trail for approvals, rejections, deletions, and vehicle changes

Database
- schema.sql: complete current table structure
- MIGRATION-V2.sql through MIGRATION-V4.sql: older incremental migrations
- MIGRATION-V5.sql: imports the full compatibility catalogue into D1, preserves
  legacy compatibility_records, and drops compatibility_records

Deployment
1. Back up the Compatibility, Vehicle requests, and Audit trail CSVs in /admin/.
2. Run the complete MIGRATION-V5.sql once in the production D1 console.
3. Deploy this complete folder through the GitHub repository connected to
   Cloudflare Pages.
4. Follow CLOUDFLARE-BACKEND-SETUP.md for verification.

Important launch checks
- Configure the contact form email delivery described in CLOUDFLARE-BACKEND-SETUP.md.
- Confirm the drafted 30-day returns and 12-month warranty terms.
- Insert the numbered corporation's legal seller identity at checkout/order confirmation.
- Obtain legal review before accepting paid orders in Canada or the United States.
