# V12 changes

- Added Resend admin-email alerts for genuinely new product-page **Notify Me** signups.
- Notify Me submissions are still saved to D1 first; email-delivery failures do not lose the signup or make the customer submission fail.
- Duplicate submissions from an already-subscribed address no longer create duplicate rows or duplicate admin emails.
- Added authenticated `GET /api/admin/launch-notifications` for the admin dashboard.
- Added a Notify Me subscriber metric and signup table to `/admin/`.
- Kept the existing Launch notifications CSV export.
- Added optional `LAUNCH_NOTIFY_FROM_EMAIL` and `LAUNCH_NOTIFY_TO_EMAIL` Cloudflare variables; when omitted, the launch alerts reuse the existing contact-form sender/recipient.
- Bumped admin CSS/JS cache versions to v11.
