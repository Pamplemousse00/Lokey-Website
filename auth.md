# Lo-Key API authentication

## Public read access

The following public endpoints do not require authentication:

- `GET https://lokey.ca/api/status`
- `GET https://lokey.ca/api/agent/compatibility?year=YEAR&make=MAKE&model=MODEL`
- `GET https://lokey.ca/api/reviews`

## Browser submission endpoints

Review, vehicle-request, and contact submissions require a valid Cloudflare Turnstile token created through the corresponding form on `https://lokey.ca`. These endpoints are intended for interactive browser use and are not available for unattended agent registration.

## Administrative endpoints

Administrative endpoints are private and require the existing Lo-Key administrator bearer credential. They are not part of the public API catalog and must not be called by third-party agents.

## OAuth, OpenID Connect, and agent registration

Lo-Key does not currently operate a public OAuth 2.0 or OpenID Connect authorization server. Therefore, Lo-Key intentionally does not publish fabricated OAuth discovery metadata, protected-resource metadata, dynamic client registration, or agent credentials.

## MCP and A2A

Lo-Key does not currently operate a public MCP or Agent-to-Agent server. Browser-supported WebMCP tools may be exposed on the public website for read-only compatibility and review lookups.
