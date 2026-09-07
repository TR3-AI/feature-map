# Immediate Stop-Loss

The 30% stop-loss placed on the exchange the moment the entry fills: a real, inspectable order, not a note in the bot. Cancellable and adjustable while live; cancels itself at 2x.

## Sub-features

- `place` puts the stop on the exchange at entry −30% at entry time.
- `inspect` shows it on the exchange's open-orders list.
- `adjust` supports manual cancel / price change while active.
- `self-cancel` removes it automatically when 2x fires.

## How to get to it (user POV)

- The exchange's open-orders list (the user-visible system of record).

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** an entry fills. The bot places a venue-native stop (a trigger order) at entry −30% through the venue that offers one. On Solana that is a Jupiter trigger order or pump.fun's in-app take-profit/stop-loss.
2. **Mechanism:** the venue's keeper watches the price. When it crosses the trigger, the keeper fires a swap that exits the position. The order is stored off-chain and monitored by the venue, not resting on an on-chain order book, but it fires independent of the bot's uptime. Thin liquidity still means slippage or a partial fill on the exit.
3. **Surface:** the stop sitting inspectably in the venue's own trigger-order (open-orders) list, then the fill and closed position on the venue's record.
4. **Breaks:** slippage on the triggered fill in a fast or thin market (the gap from trigger price is the accepted cost of a guaranteed exit, not a bug) · an edit losing the cancel-and-replace race when the trigger fires mid-conversion · a bot-simulated stop silently unarmed during an outage: the exact reason the spec is exchange-native.

Existence: venue-native stops are real on Solana. Jupiter trigger orders (with stop-loss, since late 2025) and pump.fun's in-app take-profit/stop-loss are stored off-chain and fired by the venue's keeper independent of any bot's uptime. A bot-simulated ("virtual") stop is only a price the bot watches locally, converted to a market sell if and only if the bot is alive and connected when price crosses. An outage leaves the position silently unprotected even though the bot's own state says a stop is active. A Raydium-only flow with no keeper still forces that bot-simulated path.
Deviations from standard: the venue stop is a keeper-fired off-chain trigger order, not a resting order on an on-chain matching engine, but it still meets the spec's intent, a real, inspectable, venue-held stop that survives bot downtime. Placing it venue-side rather than watching it bot-side is what real trading-bot practice favors for reliability.

## Test stream

Preconditions:

- Devnet; ProofShot recording; the exchange's open-orders view open.

1. **Immediate Stop-Loss works end to end.** Enter a position on devnet and check the exchange's open-orders list, then cancel the stop manually on a second position, then run a third position down through the stop's trigger price to confirm it actually fills and closes the position, then run a fourth position to 2x.
   Success: the stop is visible on the exchange, cancellable by hand, actually fills and closes the position when the trigger price is hit (fill price and any slippage from the trigger visible in the recording), and self-cancels at 2x, every step recorded.
   Failure: the entry fills but no stop exists on the exchange, the stop triggers but leaves the position open (no fill or only a partial fill) with no alert, or the 2x self-cancel never fires.
2. **place.** Enter a position on devnet.
   Success: the open-orders list shows the stop placed at entry −30%.
   Failure: no stop order appears on the exchange, or it's placed at the wrong price.
3. **inspect.** Open the exchange's open-orders list after entry.
   Success: the stop is listed there as a real, inspectable order.
   Failure: the stop is not visible on the exchange's own list, only the bot's word for it.
4. **adjust.** Cancel the stop manually while it's active, then on another live stop change its price instead of cancelling.
   Success: the cancel makes it disappear from the exchange immediately; the price change shows as the old order gone and a new order live at the new price (real cancel-and-replace mechanics), not the same order silently mutated in place.
   Failure: the cancel has no effect, the exchange still shows the stop as live, or the price-changed order can't be found on the exchange's list under its new price.
5. **self-cancel.** Run a fresh position to 2x.
   Success: the recording shows the stop vanish from the exchange with no manual action.
   Failure: the stop remains active past 2x, or requires manual cancellation.

## Gotchas

- The bot saying "stop set" is not proof. Only the exchange's own list counts (Bobby's rule).
- If placement fails, the position must surface as unprotected immediately. Simulate a placement failure and check the alarm.
- A triggered stop is an immediate-or-cancel order: thin liquidity can partial-fill it and cancel the remainder, leaving part of the position exposed with no stop live anymore. The "hit" check must confirm the position is fully closed, not just that some sell happened.
- Order edits are cancel-and-replace under the hood, not an in-place mutation. If the trigger fires mid-adjust, the edit can lose the race and fail silently because the order already converted to a market/limit order in flight; check for that failure, not just the happy-path edit.
- The venue stop is a Jupiter or pump.fun trigger order, not an on-chain order-book entry. Inspect it on the venue's own trigger-order list, and confirm the keeper fires the exit with the bot process stopped. Surviving bot downtime is the whole point of venue-native over bot-simulated.
