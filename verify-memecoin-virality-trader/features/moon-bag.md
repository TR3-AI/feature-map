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

- Devnet position past 2x; ProofShot recording; the positions view open; the token quantity remaining right after the 2x capital-recovery sell noted so the bag's 20% can be hand-checked precisely.

1. **Moon bag rule works end to end.** Run a devnet position past 2x with the positions view open, run the ladder to completion, then sell the bag manually from the UI.
   Success: the bag survives every automatic exit and moves only on the manual sell — all recorded.
   Failure: an automatic exit sells into the bag, or the bag can't be sold manually.
2. **flag.** Run a devnet position past 2x; hand-compute 20% of the token quantity left right after the 2x sell (not 20% of the original entry size).
   Success: the bag appears in the UI, marked manual-only, and its token quantity equals that hand-computed 20% of the post-2x remainder.
   Failure: no bag appears at 2x, it isn't marked manual-only, or its size is computed off the wrong base — the original position instead of the post-2x remainder.
3. **exclude.** Run the ladder to completion after the bag is flagged, checking each clip's size against the remainder with the bag subtracted out.
   Success: the bag stays untouched through every clip and stop, and each clip's percentage is visibly computed off the non-bag remainder, not the total holding.
   Failure: any automatic clip or stop sells into the bag, or a clip's size is computed as if the bag were still part of the sellable remainder.
4. **manual-home.** Sell the bag from the UI.
   Success: the bag is shown marked manual-only, and the manual sell closes it with a matching on-exchange fill (price and size) logged as a manual sell.
   Failure: the bag isn't shown as manual-only, the manual sell fails to close it, or the UI marks it closed while the exchange shows a partial fill or a rejected order.
5. **fixed-size.** Compare the bag's token quantity at flag time against its token quantity after the ladder runs, while its USD value is free to float with price.
   Success: the bag's token quantity stays exactly what it was at flag time even as its USD value rises or falls with price.
   Failure: the bag's token quantity changes as the ladder runs, or the system re-derives the quantity from a moving dollar target instead of holding the token count fixed.

## Gotchas

- Any automatic path touching the bag is an instant failure — test the full ladder, not just one clip.
- The bag's size is fixed at flag time; a bag that shrinks as the ladder runs is a math bug, not a feature.
- "Fixed size" means fixed token quantity, not fixed dollar value — the bag's USD value is supposed to move with price; don't mistake that for a bug.
- Research note: common moon-bag practice sizes the runner much larger than 20% (often half the position, or tiered exits at 5x/10x) vs the map's fixed 20% carved out once at 2x — the map stands.
