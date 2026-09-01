# Bundler share pull

Pulls the wallets that bought in the creation block and their combined supply %, excluding program-owned accounts (the bonding curve), via one pinned provider and counting method.

## Sub-features

- `pull` queries the pinned provider for creation-block wallets.
- `exclude-curve` removes program-owned accounts from the %.
- `provider-down` makes the candidate wait, never wave through.

## How to get to it (user POV)

- Indirect: the bundler % appears on the candidate in the checker view.

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
