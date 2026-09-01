# Moon bag rule

After 2x, 20% of the remaining position is flagged as the moon bag — manual-only, excluded from every automatic exit, ending only on Bobby's manual sell from the UI.

## Sub-features

- `flag` marks 20% of the remainder as the bag at 2x.
- `exclude` keeps the bag out of every clip and stop.
- `manual-home` shows the bag in the UI with a manual sell only.
- `fixed-size` never recalculates the bag after flagging.

## How to get to it (user POV)

- The moon bag section of the positions view; its manual sell button.

## Test stream

Preconditions:

- Devnet position past 2x; ProofShot recording; the positions view open.

1. **Moon bag rule works end to end.** Run a devnet position past 2x with the positions view open, run the ladder to completion, then sell the bag manually from the UI.
   Success: the bag survives every automatic exit and moves only on the manual sell — all recorded.
   Failure: an automatic exit sells into the bag, or the bag can't be sold manually.
2. **flag.** Run a devnet position past 2x.
   Success: the bag appears in the UI, marked manual-only, sized at 20% of the remainder.
   Failure: no bag appears at 2x, or it isn't marked manual-only.
3. **exclude.** Run the ladder to completion after the bag is flagged.
   Success: the bag stays untouched through every clip and stop in the ladder.
   Failure: any automatic clip or stop sells into the bag.
4. **manual-home.** Sell the bag from the UI.
   Success: the bag is shown marked manual-only, and the manual sell closes it, logged as a manual sell.
   Failure: the bag isn't shown as manual-only, or the manual sell fails to close it or isn't logged.
5. **fixed-size.** Compare the bag's size at flag time against its size after the ladder runs.
   Success: the bag's size stays exactly what it was at flag time.
   Failure: the bag's size changes as the ladder runs.

## Gotchas

- Any automatic path touching the bag is an instant failure — test the full ladder, not just one clip.
- The bag's size is fixed at flag time; a bag that shrinks as the ladder runs is a math bug, not a feature.
