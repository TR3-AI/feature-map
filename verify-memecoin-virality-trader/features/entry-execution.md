# Entry execution

Executes the sized entry on-chain — only after Bobby's click; the alert alone never spends money. One click, one fill, verified on-chain before reporting.

## Sub-features

- `click-gated` executes only on a buy click, never on the alert alone.
- `onchain-fill` captures the real fill: size, price, venue.
- `no-replay` re-clicks never re-enter.
- `failure-visible` reports chain failures with the real error.

## How to get to it (user POV)

- The BUY button (user action); the fill feed (proof).

## Driving it with the harness

Preconditions:

- Devnet; disposable wallet; ProofShot recording; a test alert with a pre-filled size.

- **Click.** Tap BUY once. The fill feed shows one fill matching the pre-filled size, with price and venue.
- **Re-click.** Tap again on the same alert. No second entry appears.
- **No click.** Fire an alert and never tap. The wallet shows no spend.

## Gotchas

- "The alert alone never spends money" is the load-bearing invariant — always run the no-click check, not just the happy path.
- The fill must be confirmed on-chain, not just optimistically reported; check the explorer in the recording.
