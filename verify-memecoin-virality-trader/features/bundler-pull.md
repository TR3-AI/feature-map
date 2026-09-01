# Bundler share pull

Pulls the wallets that bought in the creation block and their combined supply %, excluding program-owned accounts (the bonding curve), via one pinned provider and counting method.

## Sub-features

- `pull` queries the pinned provider for creation-block wallets.
- `exclude-curve` removes program-owned accounts from the %.
- `provider-down` makes the candidate wait, never wave through.

## How to get to it (user POV)

- Indirect: the bundler % appears on the candidate in the checker view.

## How it works in practice

- Bubblemaps-style providers scan a token's launch transactions for wallets that bought in the same block or near-simultaneously, then compute what share of total supply those wallets hold — excluding the program-owned bonding-curve account itself, since it isn't a buyer.
- Providers disagree with each other on the exact % because "same block" windows and wallet-clustering heuristics differ tool to tool — that's the real-world reason to pin one provider and one counting method as the single source of truth rather than average across tools.
- A 429 rate limit and a 5xx outage look different in provider logs, but both mean the same thing operationally: no trustworthy number right now, so the candidate waits either way.
- The documented blind spot is real: stealth-bundling tools atomically bundle token creation + buys into one transaction, so on-chain analytics see many distinct, unlinked-looking holders instead of a flagged cluster — providers built for the common case can miss these by design, not by bug.
- Existence: bundle-percentage pulls with curve exclusion are native — Bubblemaps, Trench Bot, and similar chain-analytics providers do exactly this scan/exclude/aggregate today; only the provider-down state needs to be forced for the test.
- Deviations from standard: none — research reinforced the spec (pinned provider/method, curve exclusion, and wait-not-wave-through on outage all match how production bundle checkers already behave; the stealth-bundling blind spot is already called out in Gotchas as a provider limit, not a pull-mechanism bug).

## Test stream

Preconditions:

- Checker view visible; ProofShot recording; a test token with a known bundler setup; the provider's own dashboard open for comparison; a way to block and later restore the provider.

1. **Bundler share pull works end to end.** Run the test token with the known bundler setup through the checker.
   Success: the displayed % matches the provider's own dashboard for that token, both visible side by side in the recording.
   Failure: no % appears, or it disagrees with the provider's dashboard.
2. **pull.** Run the test token and inspect the raw provider query in the checker view.
   Success: the query returns the creation-block wallets from the pinned provider, visible in the checker view.
   Failure: no wallets are returned, or the query silently fails without showing a result.
3. **exclude-curve.** Compare the displayed % against the raw wallet list from the pull.
   Success: the % excludes the program-owned bonding-curve account from the combined supply calculation.
   Failure: the bonding curve account is counted into the %, inflating it.
4. **provider-down.** Block the provider and run another candidate; then restore the provider and confirm the resumed pull is fresh.
   Success: the candidate visibly waits and never advances without a number while blocked; once restored, it advances only with a newly pulled %, not a stale number left over from before the outage.
   Failure: the candidate advances anyway while blocked, gets a zeroed or fake % instead of waiting, or resumes with a cached/stale % instead of a fresh pull.

## Gotchas

- The comparison is against the *same* counting method — a different tool's number is expected to disagree; use the pinned provider's own dashboard.
- A token whose creation block can't be read must flag, not report 0%.
- Stealth-bundling tools exist that launch a token with zero trace on Bubblemaps-type providers — even the pinned provider can undercount a bundle that was specifically built to evade detection; that's a provider blind spot, not a pull-mechanism bug.
- A rate limit (429) and an outright provider outage (5xx) look different in the logs, but both must collapse to the same behavior here — wait, never fabricate a number; test both, not just a hard block.
