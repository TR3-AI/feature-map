# Immediate stop-loss

The 30% stop-loss placed on the exchange the moment the entry fills — a real, inspectable order, not a note in the bot. Cancellable and adjustable while live; cancels itself at 2x.

## Sub-features

- `place` puts the stop on the exchange at entry −30% at entry time.
- `inspect` shows it on the exchange's open-orders list.
- `adjust` supports manual cancel / price change while active.
- `self-cancel` removes it automatically when 2x fires.

## How to get to it (user POV)

- The exchange's open-orders list (the user-visible system of record).

## How it works in practice

- Exchanges offer two stop flavors: stop-market (triggers into a market order — fill guaranteed, price not, no partial-fill risk) and stop-limit (triggers into a limit order — price guaranteed, fill not, and can partial-fill or miss entirely in thin/fast markets).
- A triggered stop-market order can still slip in a fast-moving or thin memecoin market — the fill price differs from the trigger price by some amount; that gap is the accepted cost of a guaranteed exit, not a bug.
- Editing a live stop order is cancel-and-replace under the hood on most exchanges, not an in-place mutation — if the trigger fires mid-edit, the edit can lose the race while the order is mid-conversion.
- Existence: real, exchange-native stop orders sit on the exchange's own matching engine and fire independent of any bot's uptime; bot-simulated ("virtual") stops are just a price the bot watches locally and convert to a market order only if the bot is alive and connected when the price crosses — an outage or dropped connection leaves the position silently unprotected even though the bot's own state says a stop is active.
- Deviations from standard: none — research reinforced the spec; placing the stop as a real, inspectable exchange order (rather than a bot-side watcher) is exactly what real trading-bot practice favors for reliability, since it survives bot downtime that would otherwise leave a bot-simulated stop unarmed.

## Test stream

Preconditions:

- Devnet; ProofShot recording; the exchange's open-orders view open.

1. **Immediate stop-loss works end to end.** Enter a position on devnet and check the exchange's open-orders list, then cancel the stop manually on a second position, then run a third position down through the stop's trigger price to confirm it actually fills and closes the position, then run a fourth position to 2x.
   Success: the stop is visible on the exchange, cancellable by hand, actually fills and closes the position when the trigger price is hit (fill price and any slippage from the trigger visible in the recording), and self-cancels at 2x — every step recorded.
   Failure: the entry fills but no stop exists on the exchange, the stop triggers but leaves the position open (no fill or only a partial fill) with no alert, or the 2x self-cancel never fires.
2. **place.** Enter a position on devnet.
   Success: the open-orders list shows the stop placed at entry −30%.
   Failure: no stop order appears on the exchange, or it's placed at the wrong price.
3. **inspect.** Open the exchange's open-orders list after entry.
   Success: the stop is listed there as a real, inspectable order.
   Failure: the stop is not visible on the exchange's own list — only the bot's word for it.
4. **adjust.** Cancel the stop manually while it's active, then on another live stop change its price instead of cancelling.
   Success: the cancel makes it disappear from the exchange immediately; the price change shows as the old order gone and a new order live at the new price (real cancel-and-replace mechanics), not the same order silently mutated in place.
   Failure: the cancel has no effect, the exchange still shows the stop as live, or the price-changed order can't be found on the exchange's list under its new price.
5. **self-cancel.** Run a fresh position to 2x.
   Success: the recording shows the stop vanish from the exchange with no manual action.
   Failure: the stop remains active past 2x, or requires manual cancellation.

## Gotchas

- The bot saying "stop set" is not proof — only the exchange's own list counts (Bobby's rule).
- If placement fails, the position must surface as unprotected immediately — simulate a placement failure and check the alarm.
- A triggered stop is an immediate-or-cancel order — thin liquidity can partial-fill it and cancel the remainder, leaving part of the position exposed with no stop live anymore; the "hit" check must confirm the position is fully closed, not just that some sell happened.
- Order edits are cancel-and-replace under the hood, not an in-place mutation — if the trigger fires mid-adjust, the edit can lose the race and fail silently because the order already converted to a market/limit order in flight; check for that failure, not just the happy-path edit.
