/*
 * Production review endpoint.
 *
 * The static site does not save submitted reviews locally. When this value is
 * set, the review form POSTs JSON to the endpoint. The endpoint should verify
 * Shopify order number + purchaser email server-side and return:
 * { review: { ...review fields... } }.
 */
window.LO_KEY_REVIEW_API = "";

/*
 * Shared review data for both index.html and product.html.
 *
 * The entries below are DEMO CONTENT so the review layout and sorting can be
 * tested before the August beta. Replace them with genuine customer reviews
 * before publishing the storefront. Keep the same field names when adding
 * real reviews.
 */
window.LO_KEY_REVIEWS = [
  {
    id: "demo-review-001",
    name: "Sample Reviewer A",
    title: "Sample five-star review",
    body: "Sample review copy for layout testing. Replace this entry with a genuine purchaser review before launch.",
    rating: 5,
    date: "2026-07-10",
    country: "Canada",
    verified: true,
    demo: true
  },
  {
    id: "demo-review-002",
    name: "Sample Reviewer B",
    title: "Sample installation feedback",
    body: "This is placeholder content used to test the shared review component, review count, and sorting controls.",
    rating: 5,
    date: "2026-07-03",
    country: "Canada",
    verified: true,
    demo: true
  },
  {
    id: "demo-review-003",
    name: "Sample Reviewer C",
    title: "Sample convenience feedback",
    body: "This demo entry shows how a longer review will wrap across the card on desktop and mobile layouts.",
    rating: 4,
    date: "2026-06-24",
    country: "United States",
    verified: true,
    demo: true
  },
  {
    id: "demo-review-004",
    name: "Sample Reviewer D",
    title: "Sample spare-key feedback",
    body: "Placeholder review for visual testing only. Replace with real verified-purchase feedback after the beta begins.",
    rating: 5,
    date: "2026-06-18",
    country: "Canada",
    verified: true,
    demo: true
  },
  {
    id: "demo-review-005",
    name: "Sample Reviewer E",
    title: "Sample product feedback",
    body: "Demo content used to confirm that lowest-rated sorting works correctly without maintaining two separate review lists.",
    rating: 5,
    date: "2026-06-08",
    country: "United Kingdom",
    verified: true,
    demo: true
  }
];
