# Immediate stop-loss

The 30% stop-loss placed on the exchange the moment the entry fills — a real, inspectable order, not a note in the bot. Cancellable and adjustable while live; cancels itself at 2x.

## Sub-features

- `place` puts the stop on the exchange at entry −30% at entry time.
- `inspect` shows it on the exchange's open-orders list.
- `adjust` supports manual cancel / price change while active.
- `self-cancel` removes it automatically when 2x fires.

## How to get to it (user POV)

- The exchange's open-orders list (the user-visible system of record).

## Test stream

Preconditions:

- Devnet; ProofShot recording; the exchange's open-orders view open.

1. **Immediate stop-loss works end to end.** Enter a position on devnet and check the exchange's open-orders list, then cancel the stop manually on a second position, then run a fresh position to 2x.
   Success: the stop is visible on the exchange, cancellable by hand, and self-cancels at 2x — every step recorded.
   Failure: the entry fills but no stop exists on the exchange — no proof of protection beyond the bot's word.
2. **place.** Enter a position on devnet.
   Success: the open-orders list shows the stop placed at entry −30%.
   Failure: no stop order appears on the exchange, or it's placed at the wrong price.
3. **inspect.** Open the exchange's open-orders list after entry.
   Success: the stop is listed there as a real, inspectable order.
   Failure: the stop is not visible on the exchange's own list — only the bot's word for it.
4. **adjust.** Cancel the stop manually while it's active.
   Success: it disappears from the exchange the moment it's cancelled.
   Failure: the cancel has no effect, or the exchange still shows the stop as live.
5. **self-cancel.** Run a fresh position to 2x.
   Success: the recording shows the stop vanish from the exchange with no manual action.
   Failure: the stop remains active past 2x, or requires manual cancellation.

## Gotchas

- The bot saying "stop set" is not proof — only the exchange's own list counts (Bobby's rule).
- If placement fails, the position must surface as unprotected immediately — simulate a placement failure and check the alarm.
