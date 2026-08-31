# BUY button

The only way money moves. One tap sends the buy click to the Position manager executing exactly the pre-filled size — no typing, no sizing at the button, no double-fire. Ignoring logs "no trade".

## Sub-features

- `enabled` is tappable only with an alert present.
- `single-fire` sends exactly one buy click per decision.
- `exact-size` executes the shown size, nothing else.
- `ignore` logs "no trade" as a first-class outcome.

## How to get to it (user POV)

- The BUY button on the alert card, on the phone.

## Driving it with the harness

Preconditions:

- UI at 390px; ProofShot recording; a test alert present and a Position manager test receiver watching.

- **States.** With no alert, the button is greyed out; with an alert, it is tappable.
- **Tap.** Tap once. The receiver gets exactly one buy click carrying the size shown on the card.
- **Double-tap.** Tap twice fast. Still exactly one buy click.
- **Ignore.** Dismiss the next alert. The log shows "no trade".

## Gotchas

- The size sent must equal the size *displayed* — compare them in the recording, not from logs alone.
- Greyed-out must mean truly inert: a disabled button that still fires is the worst failure here.
