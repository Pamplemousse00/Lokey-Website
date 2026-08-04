# Lo-Key website v7 changes

- Replaced the JSON-driven production vehicle catalogue with a D1 `vehicles` table.
- Added `database/migrations/MIGRATION-V5.sql` to import 7,581 exact vehicle-year rows, preserve old
  `compatibility_records` edits, and drop `compatibility_records`.
- Added the missing 2016 Kia Soul EV as CR2032 / compatible (not physically verified).
- Changed `GET /api/compatibility` so it provides both the dropdown catalogue and
  exact vehicle lookups directly from D1.
- Changed the agent compatibility endpoint to use D1 only.
- Added authenticated admin vehicle APIs for listing, adding, editing, and deleting.
- Updated `/admin/` with separate Edit existing vehicle and Add new vehicle forms.
- Battery fields now accept arbitrary descriptions, not only four fixed coin-cell sizes.
- Updated compatibility CSV export to export the complete `vehicles` table.
- Removed the runtime `compatibility-data.json` and `compatibility-data.js` files.
- Updated the schema, OpenAPI document, API docs, deployment notes, and cache-busting
  script versions.
