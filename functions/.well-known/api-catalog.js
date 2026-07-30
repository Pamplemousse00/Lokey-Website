const catalog = {
  linkset: [
    {
      anchor: "https://lokey.ca/api",
      "service-desc": [
        {
          href: "https://lokey.ca/openapi.json",
          type: "application/vnd.oai.openapi+json"
        }
      ],
      "service-doc": [
        {
          href: "https://lokey.ca/docs/api/",
          type: "text/html"
        }
      ],
      status: [
        {
          href: "https://lokey.ca/api/status",
          type: "application/json"
        }
      ]
    }
  ]
};

const headers = {
  "Content-Type": "application/linkset+json; charset=utf-8; profile=\"https://www.rfc-editor.org/info/rfc9727\"",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
  "Access-Control-Allow-Origin": "*",
  "Content-Signal": "search=yes, ai-input=yes, ai-train=no",
  Link: '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json", </openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json", </docs/api/>; rel="service-doc"; type="text/html", </api/status>; rel="status"; type="application/json"'
};

export function onRequestGet() {
  return new Response(JSON.stringify(catalog), { status: 200, headers });
}

export function onRequestHead() {
  return new Response(null, { status: 200, headers });
}

const methodNotAllowed = () => new Response(
  JSON.stringify({ error: "Method not allowed." }),
  {
    status: 405,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Allow: "GET, HEAD"
    }
  }
);

export const onRequestPost = methodNotAllowed;
export const onRequestPut = methodNotAllowed;
export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
