# Lo-Key Cloudflare backend v7 setup

This version moves the entire vehicle compatibility catalogue into Cloudflare D1.
The website no longer builds its dropdowns from `compatibility-data.json`, and the
old `compatibility_records` override table is removed.

## 1. Back up the current database

Before the migration, open `/admin/` and export:

- Compatibility
- Vehicle requests
- Audit trail

The migration preserves the rows in `compatibility_records`, but the exports give
you a separate rollback reference.

## 2. Run the D1 migration

Open:

**Cloudflare > Storage & databases > D1 > lokey-production > Console**

Open `database/migrations/MIGRATION-V5.sql` from this package, copy the complete file, paste it into
the D1 console, and press **Execute** once.

The migration:

1. creates the new `vehicles` catalogue table;
2. imports every effective year/make/model record from the former JSON catalogue;
3. preserves existing `compatibility_records` decisions as exact-year vehicle rows;
4. drops `compatibility_records`;
5. creates lookup and catalogue indexes;
6. runs two verification queries at the end.

The first result should show approximately **7,581 vehicle-year rows**, plus any
legacy-only vehicles you previously added. The second result should be empty,
confirming that `compatibility_records` no longer exists.

Do not run `database/migrations/MIGRATION-V5.sql` a second time after it succeeds.

## 3. Deploy the complete website folder

Commit this complete folder to the GitHub repository connected to Cloudflare
Pages. Keep `functions/` at the repository root beside `index.html`.

The relevant routes are now:

- `GET /api/compatibility` — returns the D1-backed dropdown catalogue
- `GET /api/compatibility?year=2016&make=Kia&model=Soul%20EV` — exact lookup
- `GET /api/agent/compatibility` — agent-oriented exact lookup
- `GET /api/admin/vehicles` — recent admin-managed vehicle rows
- `POST /api/admin/vehicles` — add a new model or model-year range
- `PUT /api/admin/vehicles/:id` — change the battery or status
- `DELETE /api/admin/vehicles/:id` — remove one exact model-year row

The admin routes require the existing `ADMIN_API_KEY` bearer token.

## 4. Use the new admin catalogue manager

Open `/admin/` after deployment.

### Edit an existing model year

Choose Year, Make, and Model. The current D1 battery and result load into the
form. Change the battery description and/or Yes/Probably/No result, then press
**Save changes**.

### Add a completely new vehicle

Use **Add new vehicle**. Enter:

- From year
- To year
- Make
- Model
- Result
- Battery description

A one-year range creates one row. A multi-year range creates one row for every
model year so the public and admin dropdowns update automatically.

For example, a 2016-only entry uses From year `2016` and To year `2016`. The migration already adds the previously missing **2016 Kia Soul EV** as CR2032 / Probably.

## 5. Existing Cloudflare variables

The project still requires:

- D1 binding: `DB` → `lokey-production`
- secret: `TURNSTILE_SECRET_KEY`
- secret: `ADMIN_API_KEY`
- secret: `RATE_LIMIT_SALT`
- plain variable: `TURNSTILE_ALLOWED_HOSTNAMES=lokey.ca,www.lokey.ca`
- secret: `RESEND_API_KEY`
- plain variable: `CONTACT_FROM_EMAIL`
- plain variable: `CONTACT_TO_EMAIL`
- optional plain variable: `LAUNCH_NOTIFY_FROM_EMAIL` (defaults to `CONTACT_FROM_EMAIL`)
- optional plain variable: `LAUNCH_NOTIFY_TO_EMAIL` (defaults to `CONTACT_TO_EMAIL`)

## 6. Verification after deployment

1. Open `/product` and confirm the Year, Make, and Model lists load.
2. Check a known vehicle such as `2017 Hyundai Tucson`.
3. Open `/admin/`, edit a known vehicle battery, save it, and confirm the public
   lookup changes.
4. Add a temporary one-year test model, confirm it appears in the dropdown, then
   delete it.
5. Open `/api/status` and confirm the database reports `ok`.
6. Open `/api/compatibility` and confirm the response contains `source: "d1"`.

## 7. Fresh database installs

`database/schema.sql` contains the current table structure, including `vehicles`. The full
catalogue seed and legacy conversion are contained in `database/migrations/MIGRATION-V5.sql`, which is
intended for the existing production database described above.


## 8. Notify Me signup alerts

The product-page Notify Me form posts to `/api/launch-notifications`. The address is
saved to the `launch_notifications` D1 table before any admin email is attempted.
Apply `database/migrations/MIGRATION-V6.sql` once on an existing database if that table
has not already been created.

For a genuinely new signup, the Pages Function queues a Resend email to
`LAUNCH_NOTIFY_TO_EMAIL` (or `CONTACT_TO_EMAIL` when the launch-specific variable is
omitted). Repeated submissions from an already-subscribed address do not send duplicate
admin alerts. The list and current subscribed count are visible in `/admin/`, and the
existing **Launch notifications** CSV export downloads the stored records.

## V13: multiple signup alert recipients and tabbed admin

Set the Production plain-text Pages variable `LAUNCH_NOTIFY_TO_EMAIL` to a comma-separated list of recipient email addresses, for example `owner@example.com,uncle@example.com`. This overrides `CONTACT_TO_EMAIL` for Notify Me alerts only. Both recipients receive the same internal alert with the latest 20 active subscriber emails and their Eastern-time signup dates. Only use authorized internal recipients. No new D1 migration or Resend key is required. Redeploy after updating the variable. Test with a new subscriber address.

The admin dashboard now has separate tabs for Overview, CSV exports, Notify Me, Reviews, Vehicle catalogue, Vehicle requests and Audit trail. Existing API limits and exports remain unchanged.

## V14: signup alert diagnostics and removal

Run `database/migrations/MIGRATION-V7.sql` in the existing D1 database to enable persistent alert diagnostics. This migration is additive and safe to rerun. V14 still saves signups and attempts emails if the diagnostics table is missing. The admin Notify Me tab displays the latest alert outcome and provider ID or error. Accepted by Resend is not a guarantee of inbox delivery; check Resend Emails for delivery events. Older signups show Not recorded. New signup requests await the email API with a ten-second timeout after the database save; email failure does not invalidate the signup. No automatic historical resend occurs.

Delete in the Notify Me tab permanently removes the selected signup and its alert diagnostic, refreshes counts, and records an audit action (without the subscriber address). A deleted address can subscribe again. Use a new address or delete your own test signup before retesting. Verify Production variables and redeploy; existing comma-separated recipient syntax remains valid. Only authorized internal recipients should receive the subscriber list.
