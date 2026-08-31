# 2x capital recovery

At 2x from entry, the initial capital comes out (sold into volume) and the stop-loss is cancelled. The position runs on house money from there. Fires exactly once per position.

## Sub-features

- `watch-2x` tracks price against the 2x mark.
- `withdraw` sells exactly the initial capital into volume.
- `cancel-stop` removes the stop from the exchange at the same moment.
- `once` never fires twice on one position.

## How to get to it (user POV)

- Indirect: the withdrawal fill in the fill feed; the stop gone from the exchange's open-orders list.

## Driving it with the harness

Preconditions:

- Devnet position with a known initial capital; ProofShot recording; the exchange's open-orders view open.

- **Reach 2x.** Run the position to 2x. A withdrawal fill appears equal to the initial capital.
- **Stop gone.** The open-orders list no longer shows the stop.
- **Once only.** Push price past 2x, back below, past again. No second withdrawal fires.

## Gotchas

- The withdrawal must equal the *initial*, not a round number near it — compare exactly.
- Until the withdrawal fills, the stop must stay live; cancelling first and failing to sell leaves the position naked.
