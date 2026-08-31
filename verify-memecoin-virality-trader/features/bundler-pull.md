# Bundler share pull

Pulls the wallets that bought in the creation block and their combined supply %, excluding program-owned accounts (the bonding curve), via one pinned provider and counting method.

## Sub-features

- `pull` queries the pinned provider for creation-block wallets.
- `exclude-curve` removes program-owned accounts from the %.
- `provider-down` makes the candidate wait, never wave through.

## How to get to it (user POV)

- Indirect: the bundler % appears on the candidate in the checker view.

## Driving it with the harness

Preconditions:

- Checker view visible; ProofShot recording; a test token with a known bundler setup; the provider's own dashboard open for comparison.

- **Known token.** Run the test token. The bundler % on screen matches the provider's dashboard for that token — both visible in the recording.
- **Provider down.** Block the provider and run another candidate. It visibly waits; it does not advance without a number.

## Gotchas

- The comparison is against the *same* counting method — a different tool's number is expected to disagree; use the pinned provider's own dashboard.
- A token whose creation block can't be read must flag, not report 0%.
