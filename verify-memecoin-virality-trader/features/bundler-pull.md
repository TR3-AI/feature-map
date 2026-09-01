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

- Checker view visible; ProofShot recording; a test token with a known bundler setup; the provider's own dashboard open for comparison.

1. **Bundler share pull works end to end.** Run the test token with the known bundler setup through the checker.
   Success: the displayed % matches the provider's own dashboard for that token, both visible side by side in the recording.
   Failure: no % appears, or it disagrees with the provider's dashboard.
2. **pull.** Run the test token and inspect the raw provider query in the checker view.
   Success: the query returns the creation-block wallets from the pinned provider, visible in the checker view.
   Failure: no wallets are returned, or the query silently fails without showing a result.
3. **exclude-curve.** Compare the displayed % against the raw wallet list from the pull.
   Success: the % excludes the program-owned bonding-curve account from the combined supply calculation.
   Failure: the bonding curve account is counted into the %, inflating it.
4. **provider-down.** Block the provider and run another candidate.
   Success: the candidate visibly waits and never advances without a number.
   Failure: the candidate advances anyway, or gets a zeroed or fake % instead of waiting.

## Gotchas

- The comparison is against the *same* counting method — a different tool's number is expected to disagree; use the pinned provider's own dashboard.
- A token whose creation block can't be read must flag, not report 0%.
