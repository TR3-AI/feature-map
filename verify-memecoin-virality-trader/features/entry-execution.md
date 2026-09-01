# Entry execution

Executes the sized entry on-chain — only after Bobby's click; the alert alone never spends money. One click, one fill, verified on-chain before reporting.

## Sub-features

- `click-gated` executes only on a buy click, never on the alert alone.
- `onchain-fill` captures the real fill: size, price, venue.
- `no-replay` re-clicks never re-enter.
- `failure-visible` reports chain failures with the real error.

## How to get to it (user POV)

- The BUY button (user action); the fill feed (proof).

## Test stream

Preconditions:

- Devnet; disposable wallet; ProofShot recording; a test alert with a pre-filled size.

1. **Entry execution works end to end.** Tap BUY once on a devnet test alert and check the fill feed.
   Success: One click produces one on-chain fill matching the pre-filled size; re-clicks do nothing — all recorded.
   Failure: The click produces no fill, a fill appears without any click, or one click enters twice.
2. **click-gated.** Fire a test alert and never tap BUY.
   Success: the wallet shows no spend and no fill appears while the alert sits untapped.
   Failure: a fill or a spend appears without any click.
3. **onchain-fill.** Tap BUY once and check the fill feed against the chain explorer.
   Success: the fill is confirmed on-chain in the explorer, matching the pre-filled size, with a real price and venue.
   Failure: the fill feed shows a fill that isn't confirmed on-chain, or is missing size, price, or venue.
4. **no-replay.** Tap BUY again on the same alert.
   Success: no second entry or fill appears after the re-click.
   Failure: a second entry appears from the re-click.
5. **failure-visible.** Force a transaction that will fail on-chain (for example, an unfunded wallet) and tap BUY.
   Success: the failure surfaces with the chain's real error.
   Failure: the failure is silent, or shows a generic message instead of the chain's real error.

## Gotchas

- "The alert alone never spends money" is the load-bearing invariant — always run the no-click check, not just the happy path.
- The fill must be confirmed on-chain, not just optimistically reported; check the explorer in the recording.
