# Positions + moon bag view

The live positions screen: open positions with stop and ladder state, and the moon bag as a separate manual-only holding. Updates from position events without a refresh.

## Sub-features

- `live-view` shows open positions with stop and ladder state.
- `live-update` refreshes on fill/ladder events without a manual reload.
- `bag-section` shows the moon bag separately, marked manual-only.
- `flat-clear` removes closed positions; the bag remains.

## How to get to it (user POV)

- The positions view in the front-end UI.

## How it works in practice

- Live trading dashboards typically stream unrealized P&L, entry-vs-current price, and position/order state in real time off a market-data feed — no manual refresh — while closed positions drop out of the active view and remain queryable in history.
- The classic failure mode is silent staleness: the UI keeps rendering the last-known price or state as if live when the underlying feed actually dropped, and a frozen screen looks identical to a healthy one unless staleness is explicitly signaled.
- Cross-checking the UI's displayed order/stop state against the venue's own order list is standard due diligence in practice — a dashboard's local cache can lag a real fill or cancellation, so the two can briefly disagree.
- Separating automated holdings (open position with live stop/ladder) from manual-only holdings (a moon bag with no automated field) into distinct sections is a common UX pattern for keeping the boundary of automation visually unambiguous.
- Existence: live position + P&L dashboards are a standard, off-the-shelf UI pattern across trading platforms — this exists directly in the requested format; nothing needs bot-simulation beyond wiring it to real position events.
- Deviations from standard: none — research reinforced the spec; the file's own gotcha about visibly flagging a stale/disconnected feed rather than silently sitting on last-known numbers matches how real live dashboards distinguish themselves from unreliable ones.

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
