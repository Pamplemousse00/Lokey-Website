# Lo-Key Cloudflare backend v2 setup

This version adds:

- vehicle information on customer reviews
- battery-size collection on vehicle requests
- request deletion and battery-size charts in `/admin/`
- an admin compatibility manager for **Yes / Probably / No** decisions
- public D1-backed compatibility overrides
- add-to-cart event and quantity counters
- a lighter review popup with Turnstile preloaded during idle time
- the supplied Turnstile public sitekey already entered in `vehicle-request-config.js`

## 1. Upgrade the existing D1 database

Because backend v1 is already running, open:

**Cloudflare > Storage & databases > D1 > lokey-production > Console**

Paste and run the complete contents of:

```text
MIGRATION-V2.sql
```

Run this migration **once**. It adds:

- `reviews.vehicle`
- `vehicle_requests.battery_sizes`
- `compatibility_records`
- `cart_events`

Do not run `MIGRATION-V2.sql` repeatedly because SQLite will reject an attempt to add the same column twice.

`schema.sql` is the complete schema for a brand-new database and is not needed for this upgrade.

## 2. Keep the existing Cloudflare settings

The project still requires:

- D1 binding: `DB` → `lokey-production`
- secret: `TURNSTILE_SECRET_KEY`
- secret: `ADMIN_API_KEY`
- secret: `RATE_LIMIT_SALT`
- plain variable: `TURNSTILE_ALLOWED_HOSTNAMES=lokey.ca,www.lokey.ca`

The public Turnstile sitekey is now set to:

```text
0x4AAAAAAD7v8d8LZ7ZBcYW2
```

The Turnstile secret must remain only in Cloudflare and must never be committed to GitHub.

## 3. Commit and deploy

Commit this complete folder to the GitHub repository connected to Cloudflare Pages. Keep the `functions/` directory at the repository root beside `index.html`.

Cloudflare will automatically deploy these added routes:

- `GET /api/compatibility`
- `POST /api/cart-events`
- `GET /api/admin/cart-metrics`
- `GET /api/admin/compatibility`
- `POST /api/admin/compatibility`
- `DELETE /api/admin/compatibility/:id`
- `DELETE /api/admin/vehicle-requests/:id`

The existing review and vehicle-request routes remain in place.

## 4. Test after deployment

### Review vehicle field

Open **Write a review** and confirm that the form contains a required **Vehicle** field with the placeholder `Year, make, model`. Submit a test review, then confirm the vehicle appears in the pending review card in `/admin/`.

### Vehicle request battery sizes

Run an incompatible compatibility check and click **Request a vehicle**. The listed battery should prefill the battery-size field. Submit the request and confirm that:

- the size appears in the admin table
- the battery-size chart updates
- the **Delete** button removes the request

A request containing `CR2032 + CR2025` should add one chart count to both CR2032 and CR2025.

### Compatibility manager

In `/admin/`, choose year, make, model, result, and battery size. Save it, then run the same vehicle lookup on the public product page. The D1 decision takes priority over the static compatibility catalogue.

### Cart counter

Click **Add to cart** on the product page, refresh `/admin/`, and confirm that:

- **Add-to-cart events** increases by one per add action
- **Units added** increases by the selected quantity

Using the plus button in the cart drawer also records an add event.

## Notes

- Existing approved reviews created before this migration may have no vehicle value. New reviews require one.
- Cart events contain quantity, source, page URL, and timestamp. They do not store customer names, email addresses, or raw IP addresses.
- The compatibility manager stores runtime overrides in D1; it does not rewrite `compatibility-data.json` in GitHub.
