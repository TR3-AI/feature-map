# Moon bag rule

After 2x, 20% of the remaining position is flagged as the moon bag — manual-only, excluded from every automatic exit, ending only on Bobby's manual sell from the UI.

## Sub-features

- `flag` marks 20% of the remainder as the bag at 2x.
- `exclude` keeps the bag out of every clip and stop.
- `manual-home` shows the bag in the UI with a manual sell only.
- `fixed-size` never recalculates the bag after flagging.

## How to get to it (user POV)

- The moon bag section of the positions view; its manual sell button.

## Driving it with the harness

Preconditions:

- Devnet position past 2x; ProofShot recording; the positions view open.

- **Flag.** After 2x, the bag appears in the UI, marked manual-only.
- **Survives ladder.** Run the ladder to completion. The bag is still there, untouched.
- **Manual sell.** Sell the bag from the UI. It closes, logged as a manual sell.

## Gotchas

- Any automatic path touching the bag is an instant failure — test the full ladder, not just one clip.
- The bag's size is fixed at flag time; a bag that shrinks as the ladder runs is a math bug, not a feature.
