# Venue router

Routes each order to the chain that lists the coin — Solana or the Robinhood Chain (EVM L2) — and records the venue on every fill. Unroutable coins block, never guess.

## Sub-features

- `route` picks the venue from the coin's listing.
- `keys` uses the right venue's wallet keys (secret names only).
- `venue-record` names the venue on every fill report.
- `unroutable` blocks with a reason instead of guessing.

## How to get to it (user POV)

- Indirect: the venue shows on each fill in the fill feed.

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** an order needs a venue.
2. **Mechanism:** the router picks the chain by where the asset is actually listed (Solana vs the EVM L2) — not a static preference — under per-venue scoped API keys (least privilege: one leaked key can't touch the other venue).
3. **Surface:** the order lands on the correct venue's own record, tagged with the venue that took it.
4. **Breaks:** unroutable treated as illiquid (no listing/liquidity path at all → must block, never guess; illiquid still routes, just poorly) · one credential working across both venues (scoping failed) · a static preference routing to a venue where the asset isn't listed.

Existence: exists in the requested format — venue routing by listing, per-venue scoped keys, and blocking on no-route are all standard patterns from DEX aggregators and multi-venue trading bots; nothing here needs bot-simulation beyond wiring the two specific chain adapters.
Deviations from standard: none — research reinforced the spec. "Route by listing, block don't guess on unroutable, distinct scoped keys per venue" already matches production smart-order-routing and least-privilege API-key practice, including this file's own distinction between unroutable (no listing) and illiquid (listed but thin), which mirrors how real routers treat those as separate cases.

## Test stream

Preconditions:

- Fill feed visible; ProofShot recording; test coins per venue plus one unroutable coin genuinely absent from both venues' listings.

1. **Venue router works end to end.** Send a Solana-only test order, a Robinhood Chain test order, and a test coin listed on neither.
   Success: Each order lands on the right chain with the venue named; unroutable coins block visibly.
   Failure: An order goes to the wrong chain, the venue isn't recorded, or an unroutable coin gets forced through.
2. **route.** Send a Solana-only test order and a Robinhood Chain test order.
   Success: Each order is handed to the chain adapter matching the coin's actual listing.
   Failure: An order is routed to the wrong chain, or routed by something other than the listing.
3. **keys.** Send a test order on each venue and inspect the recording.
   Success: Each venue's order is signed with that venue's own wallet key, referenced by a distinct secret name per venue — no raw key, seed phrase, or private key material appears anywhere in the recording.
   Failure: The wrong venue's key is used, the same secret name is reused across venues, or raw key/seed material appears in the recording.
4. **venue-record.** Send a Solana-only test order and a Robinhood Chain test order.
   Success: The fill report for each order names the correct venue.
   Failure: A fill report is missing the venue, or names the wrong one.
5. **unroutable.** Send a coin listed on neither venue.
   Success: The order blocks, and the shown reason specifically names the listing failure — not a generic or opaque error.
   Failure: The order goes through on some venue, blocks with no reason shown, or the reason given is generic/unclear about why.

## Gotchas

- The venue must come from the listing, not config preference — force a mismatch in test data and watch it still route correctly.
- Keys must never appear in the recording; secret names only.
- A "listed but illiquid" coin (dead or rugged pool, zero real depth) is not the same as unroutable — the router checks listing, not liquidity. Picking a listed-but-illiquid coin as unroutable test data would be the wrong fixture.
