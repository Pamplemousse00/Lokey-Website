---
name: vehicle-compatibility
description: Check the best available Lo-Key compatibility record for a vehicle by year, make, and model. Use before stating that a particular key fob is compatible with the current CR2032 Lo-Key model.
---

# Lo-Key vehicle compatibility

## Endpoint

Send a GET request to:

`https://lokey.ca/api/agent/compatibility?year=YEAR&make=MAKE&model=MODEL`

URL-encode the make and model.

## Interpret the result

- `verified`: tested and confirmed by Lo-Key.
- `compatible`: listed as using CR2032, but the exact key-fob style may still require confirmation.
- `conditional`: battery size or key-fob style varies; inspect the exact fob.
- `incompatible`: listed as using a battery other than CR2032 for the current Lo-Key model.
- `unknown`: the vehicle is listed, but compatibility has not been confirmed.
- `unlisted`: the vehicle is not in the current catalogue.

Always report the returned `battery`, `source`, and `caution` fields when present. A catalogue result is not a guarantee of compartment clearance, contact geometry, or pulse-current suitability.
