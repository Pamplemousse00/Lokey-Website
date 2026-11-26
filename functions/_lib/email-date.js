// Display dates in Lo-Key's local business timezone; keep database values in UTC.
const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Toronto", year: "numeric", month: "short", day: "numeric",
  hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short"
});
export function emailDate(value) {
  const date = new Date(value);
  return !value || Number.isNaN(date.getTime()) ? "Unknown" : formatter.format(date);
}
