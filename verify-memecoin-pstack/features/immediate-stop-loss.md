# Immediate Stop-Loss

The 30% stop placed the moment the entry fills, at entry −30%: a real, inspectable order that fires independent of the trading bot, not a note in the bot. On Solana it is a Jupiter Trigger stop-loss order (keeper-executed); on an order-book venue it rests on the venue's engine. Cancellable and adjustable while live; cancels itself at 2x.

## Sub-features

- `place` places the stop at entry −30% at entry time: on Solana a Jupiter Trigger stop-loss order, on an order-book venue a resting stop on the venue's engine.
- `inspect` shows it as a live order — Jupiter's active trigger-orders list on Solana, the venue's open-orders list on an order-book venue — not just the bot's word.
- `adjust` supports manual cancel / price change while active.
- `self-cancel` removes it automatically when 2x fires.

## How to get to it (user POV)

- The venue's live order list (Jupiter's active trigger orders on Solana; the venue's open-orders list on an order-book venue) — the user-visible system of record.

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** an entry fills. The bot places the stop at entry −30% — a Jupiter Trigger stop-loss order on Solana, a resting stop on an order-book venue.
2. **Mechanism:** Solana → Jupiter's Trigger Order API holds the order (state off-chain, private) and a Jupiter keeper monitors the on-chain price, filling it through Jupiter routing when −30% is crossed, independent of the trading bot's uptime; it can partial-fill or wait if liquidity is thin. Order-book venue → the venue's own engine converts the stop (stop-market: fill guaranteed, price not; stop-limit: the reverse) when price touches the trigger.
3. **Surface:** the stop sitting inspectably in the venue's live order list (Jupiter's active trigger orders, or the venue's open-orders list), then the fill/closed position on the chain's or venue's record.
4. **Breaks:** slippage on the triggered fill in a fast or thin market (the gap from trigger price is the cost of a guaranteed exit, not a bug) · a fresh pre-graduation bonding-curve token not yet routable by Jupiter, so a Trigger stop can't be placed until the token is routable · keeper price-update latency that fills a step late · an edit racing a fill mid-adjust (Jupiter updates the price in place on the same order id and guards cancels with a two-step ready_to_cancel state; an order-book venue does cancel-and-replace, which can lose the race).

Existence: native stop-loss orders exist on Solana today via Jupiter's Trigger Order API (USD-price stop-loss via slPriceUsd, OCO take-profit/stop-loss, OTOCO, and a trailing stop of 0.5–90%), keeper-executed through Jupiter Ultra and independent of the trading bot's uptime; order-book venues provide the same on their own matching engine. A bot-simulated ("virtual") stop — a price the bot watches locally and converts to a market swap only while it is alive — is a fallback, not the only option.
Deviations from standard: none in principle — the 30% stop is achievable as a real, keeper- or engine-fired order. PRE-BUILD: the exact venue and order type (Jupiter Trigger stop-loss vs an order-book venue's stop vs a bot-simulated fallback for tokens not yet routable by Jupiter) is a build-time choice to ground against the real repo, and the Jupiter path depends on the token being routable with enough liquidity for the keeper to fill.

## Test stream

Preconditions:

- Devnet; ProofShot recording; the venue's live order list open (Jupiter's active trigger orders on Solana, or the order-book venue's open-orders view).

1. **Immediate Stop-Loss works end to end.** Enter on devnet and check the venue's live order list for the stop, cancel it manually on a second position, run a third position down through −30% to confirm it actually fills and closes the position, then run a fourth position to 2x.
   Success: the stop is visible in the venue's order list, cancellable by hand, actually fills and closes the position when −30% is hit (fill price and any slippage from the trigger visible in the recording), and self-cancels at 2x, every step recorded.
   Failure: the entry fills but no stop is placed, the stop triggers but leaves the position open (no fill or only a partial fill) with no alert, or the 2x self-cancel never fires.
2. **place.** Enter a position on devnet.
   Success: the venue's order list shows the stop placed at entry −30% (a Jupiter Trigger stop-loss on Solana).
   Failure: no stop order appears, or it's placed at the wrong price.
3. **inspect.** Open the venue's live order list after entry.
   Success: the stop is listed there as a real, inspectable order (Jupiter's active trigger orders on Solana, the open-orders list on an order-book venue).
   Failure: the stop is not visible on the venue's own list, only the bot's word for it.
4. **adjust.** Change the stop's price on a live stop, then cancel a second live stop, and check the behaviour against the chosen mechanism.
   Success: Jupiter → the price update is in place (a PATCH on the same order id, which stays the same order in the trigger-orders list at the new price), and a cancel moves it open → ready_to_cancel → gone once the withdrawal confirms. Order-book venue → the price change is cancel-and-replace (old order gone, new order live at the new price) and the cancel removes it immediately.
   Failure: the update or cancel has no effect, the stop stays live at the old price, or the mechanism's documented behaviour isn't followed (a Jupiter update spawning a new order id instead of editing in place, or a venue cancel silently leaving the order live).
5. **self-cancel.** Run a fresh position to 2x.
   Success: the recording shows the stop vanish from the venue's order list with no manual action.
   Failure: the stop remains active past 2x, or requires manual cancellation.

## Gotchas

- The bot saying "stop set" is not proof. Only the venue's own order list counts — Jupiter's active trigger orders on Solana, or the order-book venue's open-orders list (Bobby's rule).
- If placement fails, the position must surface as unprotected immediately. Simulate a placement failure and check the alarm.
- A triggered stop is an immediate-or-cancel order: thin liquidity can partial-fill it and cancel the remainder, leaving part of the position exposed with no stop live anymore. The "hit" check must confirm the position is fully closed, not just that some sell happened.
- Editing behaviour depends on the mechanism: Jupiter updates the trigger price/slippage in place via PATCH on the same order id (a new order id would be a bug), and cancels through a two-step ready_to_cancel withdrawal that closes the fill-during-cancel race; an order-book venue does cancel-and-replace, which can lose the race if the trigger fires mid-adjust. Test the path the chosen mechanism actually uses, not a blanket cancel-and-replace assumption.
- PRE-BUILD: pin the exact stop mechanism against the real repo — a Jupiter Trigger stop-loss order (slPriceUsd / OCO), an order-book venue's native stop, or a bot-simulated fallback. On Solana the Jupiter keeper fills only if the token is routable with enough liquidity, so a fresh pre-graduation bonding-curve token may not accept a Trigger stop yet; test the not-yet-routable case, not just the happy path.
