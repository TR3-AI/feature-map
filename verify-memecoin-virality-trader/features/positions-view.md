# Positions + moon bag view

The live positions screen: open positions with stop and ladder state, and the moon bag as a separate manual-only holding. Updates from position events without a refresh.

## Sub-features

- `live-view` shows open positions with stop and ladder state.
- `live-update` refreshes on fill/ladder events without a manual reload.
- `bag-section` shows the moon bag separately, marked manual-only.
- `flat-clear` removes closed positions; the bag remains.

## How to get to it (user POV)

- The positions view in the front-end UI.

## Driving it with the harness

Preconditions:

- UI visible; ProofShot recording; a devnet test position running.

- **Open position.** The view shows the position with its stop and ladder state.
- **To 2x.** Run it to 2x. The moon bag appears as a separate holding, marked manual-only.
- **Close out.** Close the rest. The position clears; the moon bag remains in its section.

## Gotchas

- "Updates live" means without a manual refresh — sit and watch; don't reload between events.
- Anything offering an automatic sell of the bag from this view is an instant failure.
