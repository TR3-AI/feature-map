# Immediate stop-loss

The 30% stop-loss placed on the exchange the moment the entry fills — a real, inspectable order, not a note in the bot. Cancellable and adjustable while live; cancels itself at 2x.

## Sub-features

- `place` puts the stop on the exchange at entry −30% at entry time.
- `inspect` shows it on the exchange's open-orders list.
- `adjust` supports manual cancel / price change while active.
- `self-cancel` removes it automatically when 2x fires.

## How to get to it (user POV)

- The exchange's open-orders list (the user-visible system of record).

## Driving it with the harness

Preconditions:

- Devnet; ProofShot recording; the exchange's open-orders view open.

- **Place.** Enter a position. The open-orders list shows the stop at entry −30%.
- **Cancel by hand.** Cancel it manually. It disappears from the exchange.
- **Self-cancel.** Run a fresh position to 2x. The recording shows the stop vanish with no manual action.

## Gotchas

- The bot saying "stop set" is not proof — only the exchange's own list counts (Bobby's rule).
- If placement fails, the position must surface as unprotected immediately — simulate a placement failure and check the alarm.
