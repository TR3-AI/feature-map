# Positions + moon bag view

The live positions screen: open positions with stop and ladder state, and the moon bag as a separate manual-only holding. Updates from position events without a refresh.

## Sub-features

- `live-view` shows open positions with stop and ladder state.
- `live-update` refreshes on fill/ladder events without a manual reload.
- `bag-section` shows the moon bag separately, marked manual-only.
- `flat-clear` removes closed positions; the bag remains.

## How to get to it (user POV)

- The positions view in the front-end UI.

## Test stream

Preconditions:

- UI visible; ProofShot recording; a devnet test position running; the exchange's own open-orders list visible alongside the UI for cross-checking the displayed stop price.

1. **Positions + moon bag view works end to end.** Open the positions view with a devnet test position running, run it to 2x, then close the rest.
   Success: the recording shows the live position, then the separate moon bag that outlives the automation.
   Failure: the position doesn't appear, the moon bag vanishes after 2x, or something auto-sells the bag.
2. **live-view.** Open the positions view with a devnet position running, alongside the exchange's own order list.
   Success: the view shows the open position with a stop price and ladder state that match what the exchange's order list actually shows — not just a number the bot claims.
   Failure: the position is missing, the stop/ladder state isn't shown, or the displayed stop price disagrees with the exchange's real order.
3. **live-update.** Sit and watch the view through a fill or ladder event without reloading, noting the exact stop price or ladder step shown before and after.
   Success: the view updates on its own to the new stop price/ladder step within seconds of each event, with no manual refresh, and if the underlying feed ever drops it visibly flags itself as stale or disconnected rather than sitting on the last-known state.
   Failure: the view only updates after a manual reload, misses an event, or keeps showing old state as if it were current with no indication the feed is dead.
4. **bag-section.** Run the position to 2x, then let at least one ladder clip fire.
   Success: the moon bag shows in its own section with only a manual sell control (no stop price, no ladder step against it), while the rest of the position's stop/ladder state keeps updating independently in its own section.
   Failure: the bag doesn't appear separately, isn't marked manual-only, or shares stop/ladder fields with the still-automated remainder as if they were one holding.
5. **flat-clear.** Close out the rest of the position without reloading the view.
   Success: the position clears from the view on its own within seconds of the closing fill, while the moon bag remains, unaffected, in its section.
   Failure: the position lingers after closing, needs a manual reload to disappear, or the moon bag disappears along with it.

## Gotchas

- "Updates live" means without a manual refresh — sit and watch; don't reload between events.
- Anything offering an automatic sell of the bag from this view is an instant failure.
- A live view that goes stale should say so — a feed that silently stops updating while the last-known numbers sit on screen looks trustworthy and isn't; cross-check against the exchange's own order list rather than trusting the bot's display alone.
