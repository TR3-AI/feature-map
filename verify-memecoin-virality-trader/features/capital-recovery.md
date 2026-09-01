# 2x capital recovery

At 2x from entry, the initial capital comes out (sold into volume) and the stop-loss is cancelled. The position runs on house money from there. Fires exactly once per position.

## Sub-features

- `watch-2x` tracks price against the 2x mark.
- `withdraw` sells exactly the initial capital into volume.
- `cancel-stop` removes the stop from the exchange at the same moment.
- `once` never fires twice on one position.

## How to get to it (user POV)

- Indirect: the withdrawal fill in the fill feed; the stop gone from the exchange's open-orders list.

## How it works in practice

- Taking partial profits at a multiple and running the rest risk-free is standard trade management — bank the stake early, remove the stop's job of protecting capital that's already out, let the remainder ride.
- "House money" is a known psychological trap: traders who feel they're playing with winnings loosen their own discipline (bigger size, wider stops, worse entries) — exactly why this rule has to be mechanical, not a judgment call in the moment.
- The exit sell is a real AMM trade, not a guaranteed fill: thin memecoin pool depth can push the initial-capital sell's price outside tolerance and reject it, requiring a retry before the withdrawal actually lands.
- Cancelling the stop races the stop itself: if price wicks the stop level and the 2x mark close together, a naive "cancel" can return success from the exchange when the stop had, in fact, already filled first — the standard defense is sell-then-confirm-then-cancel, never cancel-first.
- Existence: bot-simulated — no exchange offers a native "withdraw initial at 2x, cancel stop" order type; it's the bot watching price and sequencing a market sell plus a cancel call against the exchange's own order state.
- Deviations from standard: none — the map's sell-before-cancel sequencing already matches the standard fix for this race, and research reinforced the existing gotcha about never cancelling before the sell confirms.

## Test stream

Preconditions:

- Devnet position with a known initial capital; ProofShot recording; the exchange's open-orders view open.

1. **2x capital recovery works end to end.** Run a devnet position to 2x and watch the fill feed and the exchange's open-orders list.
   Success: At 2x the initial is visibly out and the stop is gone from the exchange — both in the recording.
   Failure: Price crosses 2x and the initial is still in, or the stop is still live on the exchange.
2. **watch-2x.** Run the position up toward 2x, watching price the whole way.
   Success: the withdrawal fires exactly when price crosses the 2x mark, not before or after.
   Failure: the withdrawal fires early, late, or misses the 2x crossing entirely.
3. **withdraw.** Run the position to 2x and check the withdrawal fill against the exchange's own trade record, including one run where the first sell attempt is rejected by slippage and must retry.
   Success: the settled withdrawal fill equals the initial capital exactly, matching the exchange's own record, sold into a green candle with volume — even after a slippage-rejected attempt retries.
   Failure: the withdrawal is more or less than the initial capital, fills on a red or no-volume candle, or a slippage-rejected attempt is logged as a completed withdrawal when it wasn't.
4. **cancel-stop.** At the same 2x run, check the exchange's open-orders list; also replay a case where price wicks through the stop level and the 2x mark in close succession.
   Success: the stop disappears from the open-orders list at the same moment the withdrawal fills; if the stop had already filled first, the position shows as stopped-out rather than a falsely-successful cancel.
   Failure: the stop stays listed after the withdrawal fills, disappears before the withdrawal actually fills, or the system reports the cancel as successful when the exchange actually rejected it because the stop had already filled.
5. **once.** Push price past 2x, back below, then past again.
   Success: only one withdrawal fill ever appears, no matter how many times price re-crosses 2x.
   Failure: a second withdrawal fires on the second crossing.

## Gotchas

- The withdrawal must equal the *initial*, not a round number near it — compare exactly.
- Until the withdrawal fills, the stop must stay live; cancelling first and failing to sell leaves the position naked.
- Thin memecoin liquidity means a single trade can wick price through 2x for one tick and retreat — use a test replay with a real sustained crossing, not an artificial instantaneous spike, or the recording proves nothing.
