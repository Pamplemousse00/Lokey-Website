# Lo-Key Cloudflare backend v4 setup

This version adds:

- public indexing support (`noindex` removed, plus `robots.txt` and `sitemap.xml`)
- customer-facing support and policy pages
- production checkout wording instead of demo-cart wording
- authenticated CSV exports from `/admin/`
- an admin audit trail for review moderation, vehicle-request deletion, and compatibility changes
- an admin name/email field used to identify each audited action

It retains all v3 features, including Turnstile, D1 reviews, vehicle requests, compatibility overrides, battery-size charts, and cart-event metrics.

## 1. Upgrade the existing D1 database

Open:

**Cloudflare > Storage & databases > D1 > lokey-production > Console**

Paste and run the complete contents of:

```text
MIGRATION-V3.sql
```

This migration is safe to run again because it uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.

It creates:

- `admin_audit_log`
- indexes for audit date and record lookups

`schema.sql` now contains the complete schema for a brand-new database.

## 2. Keep the existing Cloudflare settings

The project still requires:

- D1 binding: `DB` → `lokey-production`
- secret: `TURNSTILE_SECRET_KEY`
- secret: `ADMIN_API_KEY`
- secret: `RATE_LIMIT_SALT`
- plain variable: `TURNSTILE_ALLOWED_HOSTNAMES=lokey.ca,www.lokey.ca`

The public Turnstile sitekey remains:

```text
0x4AAAAAAD7v8d8LZ7ZBcYW2
```

## 3. Commit and deploy

Commit the complete folder to the GitHub repository connected to Cloudflare Pages. Keep `functions/` at the repository root beside `index.html`.

New routes include:

- `GET /api/admin/audit-log`
- `GET /api/admin/export/reviews`
- `GET /api/admin/export/vehicle-requests`
- `GET /api/admin/export/compatibility`
- `GET /api/admin/export/cart-events`
- `GET /api/admin/export/audit-log`

All export and audit routes require the existing `ADMIN_API_KEY` bearer token.

## 4. Admin identity and audit trail

The admin login now asks for a name or email in addition to the API key. The browser sends it as `X-Admin-Actor` on authenticated admin requests.

When Cloudflare Access is later enabled, the backend automatically prefers the verified `CF-Access-Authenticated-User-Email` header over the manually entered name.

The audit trail records:

- review approval
- review approval as verified
- review rejection
- vehicle-request deletion
- compatibility creation
- compatibility update
- compatibility deletion

The audit log is append-only through the current admin interface.

## 5. CSV exports

The admin dashboard has buttons for reviews, vehicle requests, compatibility records, cart events, and the audit trail. Each export currently includes up to 10,000 newest records and opens as UTF-8 CSV with an Excel-compatible byte-order mark.

## 6. Public launch pages

The following pages are now linked from both storefront footers:

- `contact.html`
- `shipping.html`
- `returns.html`
- `warranty.html`
- `privacy.html`
- `terms.html`

Before accepting paid orders:

1. Create and monitor `support@lokey.ca`, or replace it throughout the files with the real support address.
2. Confirm the policy choices currently drafted as a **30-day return window** and **12-month limited warranty**.
3. Add the numbered corporation's legal name and seller address at checkout and on order confirmations.
4. Have the privacy policy, terms, warranty, and returns policy reviewed for the final Canadian and U.S. sales structure.

## 7. Search indexing

The public `noindex` tags have been removed. `robots.txt` allows the public site while disallowing `/admin/` and `/api/admin/`, and `sitemap.xml` lists the public pages.

The admin page remains `noindex`, and `_headers` still applies `X-Robots-Tag: noindex` to `/admin/*`.


## SEO and AI search setup

See `SEO-AI-LAUNCH-CHECKLIST.md` after deployment. The site includes canonical tags, social previews, JSON-LD, a sitemap, robots rules, and an optional `llms.txt`.
