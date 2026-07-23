# Lo-Key Cloudflare backend setup

This package adds:

- Turnstile protection on the vehicle-request and review forms
- D1-backed vehicle requests and reviews
- public `GET /api/reviews`
- moderated `POST /api/reviews`
- protected admin APIs and `/admin/`
- hashed-IP submission rate limits

## 1. Apply the D1 schema

Open Cloudflare > Storage & databases > D1 > `lokey-production` > Console.
Paste and run the full contents of `schema.sql`.

The SQL uses `CREATE TABLE IF NOT EXISTS`, so it is safe if the existing
`vehicle_requests` table was already created.

## 2. Confirm the D1 binding

Open Workers & Pages > your Pages project > Settings > Bindings.

Add the D1 binding to Production and Preview:

- Variable name: `DB`
- Database: `lokey-production`

Redeploy after changing bindings.

## 3. Create a Turnstile widget

Open Cloudflare > Turnstile > Add widget.

Suggested settings:

- Widget name: `Lo-Key forms`
- Hostnames: `lokey.ca`, `www.lokey.ca`
- Mode: Managed

Copy both values:

- Put the public **sitekey** in `vehicle-request-config.js`, replacing
  `REPLACE_WITH_TURNSTILE_SITE_KEY`.
- Store the private **secret key** as the encrypted Pages secret
  `TURNSTILE_SECRET_KEY`.

Never put the secret key in GitHub or a browser JavaScript file.

For preview-domain testing, temporarily add the Pages preview hostname to the
Turnstile widget's allowed hostnames. Remove it when no longer needed.

## 4. Add Pages variables and secrets

Open Workers & Pages > your Pages project > Settings > Variables and Secrets.
Add these to Production and Preview, then redeploy:

| Name | Type | Value |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | Secret | Turnstile secret key |
| `ADMIN_API_KEY` | Secret | A long random password/key |
| `RATE_LIMIT_SALT` | Secret | Another long random value |
| `TURNSTILE_ALLOWED_HOSTNAMES` | Plain text | `lokey.ca,www.lokey.ca` |

Generate secure random values in PowerShell:

```powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

Run that twice: once for `ADMIN_API_KEY` and once for `RATE_LIMIT_SALT`.

## 5. Commit and push

Commit the complete folder to the GitHub repository connected to Cloudflare
Pages. The `functions/` directory must be at the repository root beside
`index.html`.

Cloudflare will deploy these routes automatically:

- `POST /api/vehicle-requests`
- `GET /api/reviews`
- `POST /api/reviews`
- `GET /api/admin/reviews?status=pending`
- `POST /api/admin/reviews/:id/approve`
- `POST /api/admin/reviews/:id/reject`
- `GET /api/admin/vehicle-requests`

## 6. Test

### Vehicle request

Open the product page, run an incompatible vehicle lookup, select **Request a
vehicle**, complete Turnstile, and submit. Confirm the row in D1:

```sql
SELECT * FROM vehicle_requests ORDER BY id DESC LIMIT 20;
```

### Review submission

Submit a review. It should not appear publicly yet. Confirm it is pending:

```sql
SELECT id, name, rating, moderation_status, created_at
FROM reviews
ORDER BY id DESC;
```

### Admin

Open:

```text
https://lokey.ca/admin/
```

Enter the exact `ADMIN_API_KEY` secret. The page can approve or reject pending
reviews and view vehicle requests. Approved reviews appear through
`GET /api/reviews` and normally refresh on the storefront within about a minute.

## 7. Recommended extra protection with Cloudflare Access

The admin APIs already require the bearer key. For a second layer, create a
Cloudflare Access self-hosted application protecting:

- `lokey.ca/admin/*`
- `lokey.ca/api/admin/*`

Use an Allow policy for only your email address. Keep the API key requirement in
place as defence in depth and to protect the Pages preview domain too.

## Current submission limits

- Vehicle requests: 5 per IP hash per hour
- Reviews: 3 per IP hash per 24 hours

The database stores a salted hash, not the plain IP address. Change the limits in:

- `functions/api/vehicle-requests.js`
- `functions/api/reviews.js`
