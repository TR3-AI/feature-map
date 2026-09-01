# Venue router

Routes each order to the chain that lists the coin — Solana or the Robinhood Chain (EVM L2) — and records the venue on every fill. Unroutable coins block, never guess.

## Sub-features

- `route` picks the venue from the coin's listing.
- `keys` uses the right venue's wallet keys (secret names only).
- `venue-record` names the venue on every fill report.
- `unroutable` blocks with a reason instead of guessing.

## How to get to it (user POV)

- Indirect: the venue shows on each fill in the fill feed.

## Test stream

Preconditions:

- Fill feed visible; ProofShot recording; test coins per venue plus one unroutable.

1. **Venue router works end to end.** Send a Solana-only test order, a Robinhood Chain test order, and a test coin listed on neither.
   Success: Each order lands on the right chain with the venue named; unroutable coins block visibly.
   Failure: An order goes to the wrong chain, the venue isn't recorded, or an unroutable coin gets forced through.
2. **route.** Send a Solana-only test order and a Robinhood Chain test order.
   Success: Each order is handed to the chain adapter matching the coin's actual listing.
   Failure: An order is routed to the wrong chain, or routed by something other than the listing.
3. **keys.** Send a test order on each venue and inspect the recording.
   Success: Each venue's order is signed with that venue's own wallet keys, referenced by secret name only — no raw key appears anywhere in the recording.
   Failure: The wrong venue's keys are used, or a raw key appears in the recording.
4. **venue-record.** Send a Solana-only test order and a Robinhood Chain test order.
   Success: The fill report for each order names the correct venue.
   Failure: A fill report is missing the venue, or names the wrong one.
5. **unroutable.** Send a coin listed on neither venue.
   Success: The order blocks with the reason shown.
   Failure: The order goes through on some venue, or blocks with no reason shown.

## Gotchas

- The venue must come from the listing, not config preference — force a mismatch in test data and watch it still route correctly.
- Keys must never appear in the recording; secret names only.
