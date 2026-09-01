# BUY button

The only way money moves. One tap sends the buy click to the Position manager executing exactly the pre-filled size — no typing, no sizing at the button, no double-fire. Ignoring logs "no trade".

## Sub-features

- `enabled` is tappable only with an alert present.
- `single-fire` sends exactly one buy click per decision.
- `exact-size` executes the shown size, nothing else.
- `ignore` logs "no trade" as a first-class outcome.

## How to get to it (user POV)

- The BUY button on the alert card, on the phone.

## How it works in practice

- One-tap/one-click trading is a real, named mode on trading platforms (TradingView, CMC Markets, Capital.com) — it executes instantly with no confirmation dialog, trading the safety net of a confirm screen for speed.
- The classic double-fire failure comes from two directions: a fast double-tap on the same button, and a network-level retry (a timeout causes the client or a gateway to resend the same request) — both must collapse to exactly one order, not two.
- The standard fix is layered: client-side, the button visually locks the instant the first tap registers (debouncing) so a second tap can't fire; server-side, an idempotency key tags the intent so a retried send resolves to the original order instead of creating a second one.
- Idempotency-by-key is the same pattern payment APIs (Stripe, Airbnb) use to stop duplicate charges — same intent submitted twice yields one consistent outcome.
- Existence: one-tap execution is a native toggleable mode on several trading platforms; the idempotency/lock-on-first-tap plumbing behind it is standard engineering, not something that needs bot-simulation — a fast double-tap and a forced retry are both directly reproducible in a test.
- Deviations from standard: crypto UX guidance often calls for an explicit confirmation step before an irreversible transaction; the map deliberately skips it for one-tap speed (see Research note in Gotchas) — the map stands.

## Test stream

Preconditions:

- UI at 390px; ProofShot recording; a test alert present and a Position manager test receiver watching.

1. **BUY button works end to end.** With a test alert present, tap BUY once.
   Success: one tap sends one buy click with the shown size to the receiver; ignoring logs cleanly; no double-fires — all recorded.
   Failure: the button can't be tapped, fires twice, sends a different size than shown, or the click never arrives.
2. **enabled.** With no alert present, check the button; then let an alert arrive and check again.
   Success: the button is greyed out with no alert, and tappable once an alert is present.
   Failure: the button is tappable with no alert, or stays greyed out once an alert arrives.
3. **single-fire.** Tap the button twice fast, then separately force a delayed/retried send of the same buy intent (e.g. a network timeout that causes a resend).
   Success: the button visibly locks the instant the first tap registers, the receiver gets exactly one buy click despite the double-tap, and a retried send resolves to the original order instead of creating a second one.
   Failure: the button stays tappable after the first tap, the receiver gets two buy clicks, or a retried send creates a second order.
4. **exact-size.** Compare the size shown on the card against the size the receiver got.
   Success: the buy click carries exactly the size shown on the card.
   Failure: the size sent differs from the size displayed.
5. **ignore.** Dismiss the next alert instead of tapping BUY.
   Success: the log shows "no trade" for the dismissed alert.
   Failure: no log entry appears, or a buy click fires anyway.

## Gotchas

- The size sent must equal the size *displayed* — compare them in the recording, not from logs alone.
- Greyed-out must mean truly inert: a disabled button that still fires is the worst failure here.
- Research note: crypto UX guidance often calls for an explicit confirmation step before an irreversible transaction, vs the map's one-tap-only design (no typing, no sizing, one click executes) — the map stands.
