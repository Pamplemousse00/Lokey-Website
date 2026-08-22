/*
 * Edit compatibility wording here only.
 * Every vehicle result selects one of these entries from its normalized status.
 */
window.LO_KEY_COMPATIBILITY_MESSAGES = {
  "verified": {
    "lead": "Yes!",
    "message": "This vehicle and key-fob combination has been tested and verified to work with Lo-Key."
  },
  "compatible": {
    "lead": "Yes.",
    "message": "Our records show that this vehicle uses a CR2032 battery. You should confirm by opening your key fob and checking the battery inside."
  },
  "conditional": {
    "lead": "Check first.",
    "message": "Our records show more than one possible key-fob battery for this vehicle. Open your key fob and confirm that the battery inside is marked CR2032."
  },
  "incompatible": {
    "lead": "No.",
    "message": "This vehicle is listed as using a battery other than CR2032, so it is not compatible with the current Lo-Key model."
  },
  "unknown": {
    "lead": "Not confirmed.",
    "message": "We do not yet have a confirmed battery fitment for this vehicle. Check the battery marking inside your key before ordering."
  },
  "unlisted": {
    "lead": "Not listed yet.",
    "message": "This vehicle is not yet in our compatibility database. Check the battery marking inside your key before ordering."
  }
};
