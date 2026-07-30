# Lo-Key AI / agent-readiness deployment notes

## Implemented in this package

- RFC 8288 `Link` response headers on `/` and `/product`.
- RFC 9727 API catalog at `/.well-known/api-catalog`.
- OpenAPI 3.1 document at `/openapi.json`.
- Human API documentation at `/docs/api`.
- Public health endpoint at `/api/status`.
- Agent-oriented compatibility endpoint at `/api/agent/compatibility`.
- Agent Skills discovery index and three `SKILL.md` files.
- Honest `/auth.md` explaining the current authentication model.
- WebMCP read-only tools for compatibility and published reviews, with support for both the current draft API and the older preview API.
- Content Signals declaring `search=yes`, `ai-input=yes`, and `ai-train=no`.
- Origin `Content-Signal` response headers so Cloudflare Markdown for Agents preserves the same policy.

## Cloudflare dashboard settings still required

### AI crawler access

Keep Google, Google-Extended, and the AI crawlers you want to serve set to **Allow**. Do not enable a global AI-bot block if the goal is AI retrieval and grounding.

### Managed robots.txt

Cloudflare may insert managed content into the live `robots.txt`. Confirm that the live file contains:

```text
Content-Signal: search=yes, ai-input=yes, ai-train=no
```

and does not contain `Disallow: /` for Google-Extended or other AI crawlers you want to reach the site.

### Markdown for Agents

Enable **Markdown for Agents** in Cloudflare. The website package cannot switch this account-level feature on. Verify after deployment:

```bash
curl -i -H "Accept: text/markdown" https://lokey.ca/
```

The response should contain `Content-Type: text/markdown`, `Vary: Accept`, and normally `x-markdown-tokens`.

## Features intentionally not fabricated

### OAuth / OpenID Connect discovery

Lo-Key does not operate a public OAuth or OpenID Connect authorization server. Publishing invented authorization endpoints, token endpoints, JWKS data, or protected-resource metadata would be incorrect and unsafe. Add these well-known documents only after a real authorization server is deployed.

### MCP Server Card

Lo-Key does not currently operate a public MCP server. A server card should not be published until a real MCP transport endpoint exists.

### DNS-AID

DNS-AID is still an Internet-Draft and is intended to advertise an actual agent endpoint or organization agent index. Lo-Key currently exposes HTTP APIs and WebMCP browser tools, not an MCP or A2A agent server. Do not publish a misleading SVCB record yet.

When a real agent endpoint exists, add the DNS record in Cloudflare DNS and enable DNSSEC. The draft's organization discovery owner is `_index._agents.lokey.ca`, but the exact SVCB parameters should be reviewed against the then-current draft and Cloudflare's supported SvcParam keys before publication.

## Verification URLs

- `https://lokey.ca/.well-known/api-catalog`
- `https://lokey.ca/openapi.json`
- `https://lokey.ca/docs/api`
- `https://lokey.ca/api/status`
- `https://lokey.ca/api/agent/compatibility?year=2017&make=Hyundai&model=Tucson`
- `https://lokey.ca/.well-known/agent-skills/index.json`
- `https://lokey.ca/auth.md`
