# 2x capital recovery

At 2x from entry, the initial capital comes out (sold into volume) and the stop-loss is cancelled. The position runs on house money from there. Fires exactly once per position.

## Sub-features

- `watch-2x` tracks price against the 2x mark.
- `withdraw` sells exactly the initial capital into volume.
- `cancel-stop` removes the stop from the exchange at the same moment.
- `once` never fires twice on one position.

## How to get to it (user POV)

- Indirect: the withdrawal fill in the fill feed; the stop gone from the exchange's open-orders list.

## Test stream

Preconditions:

- Devnet position with a known initial capital; ProofShot recording; the exchange's open-orders view open.

1. **2x capital recovery works end to end.** Run a devnet position to 2x and watch the fill feed and the exchange's open-orders list.
   Success: At 2x the initial is visibly out and the stop is gone from the exchange — both in the recording.
   Failure: Price crosses 2x and the initial is still in, or the stop is still live on the exchange.
2. **watch-2x.** Run the position up toward 2x, watching price the whole way.
   Success: the withdrawal fires exactly when price crosses the 2x mark, not before or after.
   Failure: the withdrawal fires early, late, or misses the 2x crossing entirely.
3. **withdraw.** Run the position to 2x and check the withdrawal fill.
   Success: the withdrawal fill equals the initial capital exactly, sold into a green candle with volume.
   Failure: the withdrawal is more or less than the initial capital, or fills on a red or no-volume candle.
4. **cancel-stop.** At the same 2x run, check the exchange's open-orders list.
   Success: the stop disappears from the open-orders list at the same moment the withdrawal fills.
   Failure: the stop stays listed after the withdrawal fills, or disappears before the withdrawal actually fills.
5. **once.** Push price past 2x, back below, then past again.
   Success: only one withdrawal fill ever appears, no matter how many times price re-crosses 2x.
   Failure: a second withdrawal fires on the second crossing.

## Gotchas

- The withdrawal must equal the *initial*, not a round number near it — compare exactly.
- Until the withdrawal fills, the stop must stay live; cancelling first and failing to sell leaves the position naked.
