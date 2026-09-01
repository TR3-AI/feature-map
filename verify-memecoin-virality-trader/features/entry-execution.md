# Entry execution

Executes the sized entry on-chain — only after Bobby's click; the alert alone never spends money. One click, one fill, verified on-chain before reporting.

## Sub-features

- `click-gated` executes only on a buy click, never on the alert alone.
- `onchain-fill` captures the real fill: size, price, venue.
- `no-replay` re-clicks never re-enter.
- `failure-visible` reports chain failures with the real error.

## How to get to it (user POV)

- The BUY button (user action); the fill feed (proof).

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** a buy clears the click-gate.
2. **Mechanism:** quote → build → sign → submit the swap (Jupiter/Raydium) with a slippage tolerance and a priority-fee bid → wait for on-chain confirmation. No order book guarantees the quoted price holds until the trade lands.
3. **Surface:** the fill on the chain's own record, at the real executed price — checked there, never against the pre-trade quote.
4. **Breaks:** lands-and-reverts (price moved past slippage tolerance — fee charged, swap amount kept; a deliberate rejection, not a crash) · never-lands (outbid on priority fee during congestion, transaction expires ~2 minutes — no fee at all) · sandwiched (MEV bots buy ahead and sell after; the transaction confirms normally at a worse price with no error — only the chain record shows it).

Existence: standard on-chain swap mechanics — Jupiter/Raydium natively provide slippage tolerance and priority-fee bidding; nothing here needs bot-simulation beyond the click-gate and the on-chain confirmation check the map already specifies.
Deviations from standard: none — the map's two-failure-mode split (lands-and-reverts-with-fee vs never-lands-and-no-fee) and its sandwiched-but-confirmed-fill case both match standard Solana swap behavior; research reinforced the file's existing gotchas rather than changing them.

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
5. **failure-visible.** Force a swap that will revert on-chain the way real memecoin trades commonly do — set a price move beyond the slippage tolerance so the transaction lands but reverts (not just an unfunded-wallet case that never gets submitted) — and tap BUY.
   Success: the failure surfaces with the chain's real program error (e.g. a slippage-exceeded revert), and the wallet is only out the network fee, not the swap amount.
   Failure: the failure is silent, shows a generic message instead of the chain's real error, or the wallet is charged as though the swap succeeded.

## Gotchas

- "The alert alone never spends money" is the load-bearing invariant — always run the no-click check, not just the happy path.
- The fill must be confirmed on-chain, not just optimistically reported; check the explorer in the recording.
- A transaction can fail two different ways: it lands and reverts (e.g. slippage exceeded — the wallet still pays the network fee) or it never lands at all (dropped for too low a priority fee, no fee charged); the failure-visible check should tell which one happened, since "no fill" alone doesn't say whether money moved.
- Even a fill that lands can be sandwiched — a worse-than-quoted price with no error at all — so "a real price" in the onchain-fill check means the actual chain-recorded price, not the pre-trade quote.
