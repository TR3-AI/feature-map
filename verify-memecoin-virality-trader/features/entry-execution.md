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

- A Solana DEX market buy (via an aggregator like Jupiter, or direct to an AMM like Raydium) is a swap transaction: get a quote, build the transaction, sign, submit, wait for on-chain confirmation — there's no order book guaranteeing the quoted price holds until the trade lands.
- Slippage tolerance is the safety valve: if the price would land outside the tolerance, the swap program reverts on-chain — the wallet still pays the network fee (and any priority fee), but keeps the swap amount; that's a deliberate rejection, not a crash.
- A transaction that never lands is a different failure mode entirely: Solana transactions expire after roughly two minutes and get dropped, usually from being outbid on priority fee during congestion — nothing executes, so no fee at all is charged.
- Priority fees (a per-compute-unit bid layered on the base fee) are the standard lever for landing a transaction fast when competing bots and traders are all racing the same block — a memecoin buy with too low a priority fee simply won't get included, independent of slippage settings.
- Sandwich attacks are the other standard on-chain risk: because Solana has no public mempool, MEV bots use private bundles to buy ahead of a detected large swap and sell right after it; the victim's transaction still confirms normally, just at a worse price than quoted, with no error at all.
- Existence: standard on-chain swap mechanics — Jupiter/Raydium natively provide slippage tolerance and priority-fee bidding; nothing here needs bot-simulation beyond the click-gate and the on-chain confirmation check the map already specifies.
- Deviations from standard: none — the map's two-failure-mode split (lands-and-reverts-with-fee vs never-lands-and-no-fee) and its sandwiched-but-confirmed-fill case both match standard Solana swap behavior; research reinforced the file's existing gotchas rather than changing them.

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
