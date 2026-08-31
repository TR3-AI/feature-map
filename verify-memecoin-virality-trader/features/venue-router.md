# Venue router

Routes each order to the chain that lists the coin — Solana or the Robinhood Chain (EVM L2) — and records the venue on every fill. Unroutable coins block, never guess.

## Sub-features

- `route` picks the venue from the coin's listing.
- `keys` uses the right venue's wallet keys (secret names only).
- `venue-record` names the venue on every fill report.
- `unroutable` blocks with a reason instead of guessing.

## How to get to it (user POV)

- Indirect: the venue shows on each fill in the fill feed.

## Driving it with the harness

Preconditions:

- Fill feed visible; ProofShot recording; test coins per venue plus one unroutable.

- **Solana coin.** Send a Solana-only test order. The fill report shows venue Solana.
- **Robinhood coin.** Send a Robinhood Chain test order. The fill report shows venue Robinhood Chain.
- **Unroutable.** Send a coin listed on neither. The order blocks with the reason shown.

## Gotchas

- The venue must come from the listing, not config preference — force a mismatch in test data and watch it still route correctly.
- Keys must never appear in the recording; secret names only.
