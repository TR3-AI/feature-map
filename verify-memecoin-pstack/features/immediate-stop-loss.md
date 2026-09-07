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
4. **Breaks:** slippage on the triggered fill in a fast or thin market (the gap from trigger price is the accepted cost of a guaranteed exit, not a bug) · a partial fill in thin liquidity that keeps the order working instead of closing the position cleanly · a bot-simulated stop silently unarmed during an outage, the exact reason the spec is venue-native.

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
   Success: on Jupiter, editing the stop updates its trigger price on the same order in place, and the open-orders list shows the one order at the new price. Cancelling moves the order to a ready-to-cancel state and then clears it from the list. On a venue that instead does cancel-and-replace, or on a bot-managed stop, the exact edit and cancel semantics are PRE-BUILD; verify against the real venue.
   Failure: the edit is rejected or the price never changes, the cancelled stop stays live on the list, or the edit spawns a duplicate so two stops sit on the same position.
5. **self-cancel.** Run a fresh position to 2x.
   Success: the recording shows the stop vanish from the exchange with no manual action.
   Failure: the stop remains active past 2x, or requires manual cancellation.

## Gotchas

- The bot saying "stop set" is not proof. Only the exchange's own list counts (Bobby's rule).
- If placement fails, the position must surface as unprotected immediately. Simulate a placement failure and check the alarm.
- Partial fills are not immediate-or-cancel on Jupiter. A triggered trigger order keeps executing across partial fills rather than cancelling the remainder, so a thin market can leave the exit half-done and still working. The "hit" check must confirm the position is fully closed, not just that some sell printed. Other venues or a bot-managed stop may cancel the remainder instead, which is PRE-BUILD.
- Edit and cancel semantics are venue-specific. Jupiter Trigger V2 updates the price and slippage on the existing order in place, with no cancel-and-replace, and a cancel first moves the order to a ready-to-cancel state before it clears. Do not assume an atomic cancel-and-replace or an instant disappearance; verify the real venue's state transitions, not the happy path. Cross-venue and bot-managed edit and cancel semantics are PRE-BUILD.
- The venue stop is a Jupiter or pump.fun trigger order, not an on-chain order-book entry. Inspect it on the venue's own trigger-order list, and confirm the keeper fires the exit with the bot process stopped. Surviving bot downtime is the whole point of venue-native over bot-simulated.
