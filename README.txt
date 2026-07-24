LO-KEY WEBSITE + CLOUDFLARE BACKEND V4

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
- D1-backed moderated reviews and compatibility records
- Turnstile-protected public forms
- vehicle requests with battery-size analytics
- add-to-cart event metrics
- admin compatibility manager
- CSV exports for reviews, requests, compatibility, cart events, and audit logs
- admin audit trail for approvals, rejections, deletions, and compatibility changes

Database
- schema.sql: complete fresh-install schema
- MIGRATION-V2.sql: older v1-to-v2 migration
- MIGRATION-V3.sql: adds the admin audit trail to the current database

Deployment
Push this folder as the repository root connected to Cloudflare Pages. Run
MIGRATION-V3.sql once before using the updated admin dashboard.

Important launch checks
- Create or replace support@lokey.ca.
- Confirm the drafted 30-day returns and 12-month warranty terms.
- Insert the numbered corporation's legal seller identity at checkout/order confirmation.
- Obtain legal review before accepting paid orders in Canada or the United States.
