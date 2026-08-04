# Lo-Key SEO and AI Search Launch Checklist

The website files now contain:

- self-referencing canonical URLs;
- unique page titles and meta descriptions;
- Open Graph and Twitter preview metadata using `assets/og-image.png`;
- `WebSite`, `Organization`, `WebPage`, `Product`, `BreadcrumbList`, and `FAQPage` JSON-LD where appropriate;
- a public XML sitemap with image entries;
- an indexable robots policy while excluding the admin interface;
- an optional `llms.txt` factual summary for AI agents.

## Required manual steps after deployment

1. In Google Search Console, verify the `lokey.ca` Domain property.
2. Submit `https://lokey.ca/sitemap.xml`.
3. Use URL Inspection on `https://lokey.ca/` and `https://lokey.ca/product.html`, run **Test live URL**, then **Request indexing**.
4. Run both pages through Google's Rich Results Test and Schema Markup Validator.
5. Confirm Cloudflare redirects HTTP to HTTPS and redirects `www.lokey.ca` to the preferred apex domain.
6. Check `site:lokey.ca` after Google has had time to recrawl. New sites can take days or longer to settle.
7. When genuine approved reviews exist, add only real aggregate-rating data that exactly matches visible reviews. Do not create placeholder ratings.
8. When preorders actually open, add a truthful `Offer` to Product structured data and create a Google Merchant Center feed.
9. Publish evidence-based testing and compatibility information. Independent testing, detailed methodology, real customer reviews, and reputable external links are the strongest path to positive AI summaries.
10. Seek relevant links and mentions from automotive-security publications, Canadian startup directories, locksmith/dealer partners, and product reviewers.

## Important limitation

No metadata can force a number-one ranking or control an AI Overview. Google decides whether to index, rank, quote, or summarize a page. Positive performance claims should be supported by public testing or genuine reviews.
