# Immediate Stop-Loss

The 30% stop-loss armed the moment the entry fills: enforceable, not just a note in the bot. On a native-stop venue (the Robinhood Chain perps venue, Lighter) it rests on the venue's own engine and is inspectable on the open-orders list; on a Solana memecoin spot venue (pump.fun / PumpSwap) it is a bot-armed trigger that fires a market sell on breach. Cancellable and adjustable while live; cancels itself at 2x.

## Sub-features

- `place` arms the stop at entry −30% at entry time (a native venue order, or a bot-held trigger).
- `inspect` shows it on the venue's own surface: the open-orders list on a native-stop venue, or the armed trigger plus the on-chain sell that fires on a Solana spot venue.
- `adjust` supports manual cancel / price change while active.
- `self-cancel` removes it automatically when 2x fires.

## How to get to it (user POV)

- The venue's own system of record: an open-orders list where the venue has native stops (Robinhood Chain perps, Lighter); on a Solana spot venue, the bot's armed-trigger view plus the on-chain sell that fires.

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** an entry fills. The bot arms the 30% stop at entry −30% on the routed venue: a native stop order on the venue's own engine where one exists, otherwise a bot-held trigger.
2. **Mechanism:** on a native-stop venue (Lighter perps on Robinhood Chain supports reduce-only SL/TP), price touches the trigger and the venue's engine converts it (stop-market: fill guaranteed, price not; stop-limit: price guaranteed, fill not, so it can partial-fill or miss in thin markets), firing independent of any bot's uptime. On a Solana memecoin spot venue there is no bot-placeable resting stop: pump.fun's native stop-loss is an app feature with no public API, and AMM spot (PumpSwap) has no resting-order engine, so the bot watches price and submits a market sell/swap on breach, which depends on the bot being alive and connected.
3. **Surface:** on a native-stop venue, the stop sitting inspectably in the open-orders list, then the fill and closed position on the venue's record; on a Solana spot venue, the bot's armed trigger and then the on-chain market-sell that closes the position.
4. **Breaks:** slippage on the triggered fill in a fast or thin market (the gap from trigger price is the accepted cost of a guaranteed exit, not a bug) · an edit losing the cancel-and-replace race when the trigger fires mid-conversion · a bot-armed stop silently unarmed during an outage, which is exactly why a native venue stop is preferred wherever the venue offers one, and why the Solana spot fallback needs a liveness guard.

Existence: venue-dependent, and the source pins only Solana and Robinhood Chain adapters, no order venue. Exchange-native resting stops that fire independent of the bot and sit inspectably on an open-orders list are real on order-book / perps venues: Lighter on Robinhood Chain offers native SL/TP, automatically reduce-only, with an open-orders and positions view. They are NOT established on the Solana memecoin spot path the idea centers on: pump.fun added an app-level stop-loss but exposes no official public data/trading API, and AMM spot (PumpSwap, post-graduation) has no resting-order engine, so a bot there falls back to a locally-watched trigger that fires a market swap and is only as reliable as the bot's uptime.
Deviations from standard: the spec (and this file's original wording) asserted a universal exchange-native resting stop inspectable on an open-orders list, firing independent of the bot. That holds on the Robinhood Chain perps venue (Lighter) but NOT on the Solana memecoin spot venue the idea centers on, where the stop is a bot-armed trigger plus a market sell with no on-chain open-orders list. The exact per-venue stop protocol and the user-proof surface are PRE-BUILD until the executor venue is pinned.

## Test stream

Preconditions:

- Devnet; ProofShot recording; the routed venue's own proof surface open (the open-orders list on a native-stop venue, or the bot's armed-trigger view plus the on-chain sell feed on a Solana spot venue).

1. **Immediate Stop-Loss works end to end.** Enter a position on devnet and check the routed venue's own proof surface, then cancel the stop manually on a second position, then run a third position down through the trigger price to confirm it actually fills and closes the position, then run a fourth position to 2x.
   Success: the stop is provable on the venue's own surface (a native resting order on the open-orders list, or the bot's armed trigger), cancellable by hand, actually fills and closes the position when the trigger price is hit (fill price and any slippage from the trigger visible in the recording), and self-cancels at 2x, every step recorded.
   Failure: the entry fills but no enforceable stop exists (no native resting order and no armed trigger), the stop triggers but leaves the position open (no fill or only a partial fill) with no alert, or the 2x self-cancel never fires.
2. **place.** Enter a position on devnet.
   Success: the venue's own surface shows the stop armed at entry −30% (a native resting order, or the bot's armed trigger).
   Failure: no stop appears armed on the venue's surface, or it's armed at the wrong price.
3. **inspect.** Open the routed venue's own proof surface after entry.
   Success: on a native-stop venue the stop is listed on the open-orders list as a real, inspectable order; on a Solana spot venue the bot's armed trigger is shown, with the on-chain sell as the proof that fires on breach.
   Failure: neither a native resting order nor an armed trigger is provable on the venue's surface, only the bot's word for it.
4. **adjust.** Cancel the stop manually while it's active, then on another live stop change its price instead of cancelling.
   Success: the cancel removes it from the venue's surface immediately (a native order gone from the open-orders list, or the trigger disarmed); the price change shows as the old stop gone and a new one live at the new price (real cancel-and-replace mechanics), not the same one silently mutated in place.
   Failure: the cancel has no effect, the venue's surface still shows the stop as live, or the re-priced stop can't be found on the venue's surface under its new price.
5. **self-cancel.** Run a fresh position to 2x.
   Success: the recording shows the stop vanish from the exchange with no manual action.
   Failure: the stop remains active past 2x, or requires manual cancellation.

## Gotchas

- The bot saying "stop set" is not proof (Bobby's rule). Proof is the venue's real surface: a native venue's open-orders list, or on a Solana spot venue the on-chain sell that actually fires on breach.
- If placement fails, the position must surface as unprotected immediately. Simulate a placement failure and check the alarm.
- A triggered stop is an immediate-or-cancel order: thin liquidity can partial-fill it and cancel the remainder, leaving part of the position exposed with no stop live anymore. The "hit" check must confirm the position is fully closed, not just that some sell happened.
- Order edits are cancel-and-replace under the hood, not an in-place mutation. If the trigger fires mid-adjust, the edit can lose the race and fail silently because the order already converted to a market/limit order in flight; check for that failure, not just the happy-path edit.
- Research note: the map assumed one universal exchange-native stop with an open-orders list. In reality it is venue-split: Lighter on Robinhood Chain has native reduce-only SL/TP with an open-orders view, but the Solana memecoin spot path (pump.fun / PumpSwap) has no bot-placeable resting stop (pump.fun's native stop-loss is app-only with no public API; AMM spot has no resting-order engine), so there the stop is a bot-armed trigger plus a market sell. Tester action: pin the stop protocol for the actual routed venue before grading; only assert an open-orders list where the venue truly has native stops, and on a Solana spot venue prove the stop by the armed trigger plus the on-chain sell that fires, never by an open-orders list that does not exist there.
