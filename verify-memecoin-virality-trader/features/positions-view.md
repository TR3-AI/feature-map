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

- UI visible; ProofShot recording; a devnet test position running.

1. **Positions + moon bag view works end to end.** Open the positions view with a devnet test position running, run it to 2x, then close the rest.
   Success: the recording shows the live position, then the separate moon bag that outlives the automation.
   Failure: the position doesn't appear, the moon bag vanishes after 2x, or something auto-sells the bag.
2. **live-view.** Open the positions view with a devnet position running.
   Success: the view shows the open position with its stop and ladder state.
   Failure: the position is missing, or the stop/ladder state isn't shown.
3. **live-update.** Sit and watch the view through a fill or ladder event without reloading.
   Success: the view updates on its own as events happen, with no manual refresh.
   Failure: the view only updates after a manual reload, or misses an event.
4. **bag-section.** Run the position to 2x.
   Success: the moon bag appears as a separate section, marked manual-only.
   Failure: the bag doesn't appear separately, or isn't marked manual-only.
5. **flat-clear.** Close out the rest of the position.
   Success: the position clears from the view while the moon bag remains in its section.
   Failure: the position lingers after closing, or the moon bag disappears along with it.

## Gotchas

- "Updates live" means without a manual refresh — sit and watch; don't reload between events.
- Anything offering an automatic sell of the bag from this view is an instant failure.
