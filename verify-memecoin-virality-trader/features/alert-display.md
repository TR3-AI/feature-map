# Alert display

The alert card readable at a glance on the phone: coin, oscillator, freshness, scores, pre-filled size. Newest on top; resolved cards archive.

## Sub-features

- `glanceable` shows every field at phone width, no zoom or sideways scroll.
- `stack` orders multiple alerts newest-first.
- `archive` removes resolved alerts from the active list.

## How to get to it (user POV)

- The front-end UI's alert list, on the phone.

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** an alert payload arrives from Signal & trigger.
2. **Mechanism:** the UI renders a new card from the payload and pushes it to the top of the active list.
3. **Surface:** the card is readable at phone width — coin, oscillator, freshness, gate scores, pre-filled size all present.
4. **Aging:** the freshness label mechanically ticks older as time passes — a frozen "just now" means the data underneath has died (the "ghost quote").
5. **Breaks:** a field empty or clipped at 390px (render bug) · freshness frozen (dead feed behind a live-looking card) · a resolved card lingering in the active list (archive broken).

Existence: a standard UI pattern — nothing to simulate; all units run against the real UI.
Deviations from standard: none — research reinforced the spec (freshness honesty is already a spec behaviour).

## Test stream

Preconditions:

- UI at 390px width; ProofShot recording; a test alert waiting, plus a way to let time pass (or a pre-aged alert) so the freshness readout can be checked for honest aging.

1. **Alert display works end to end.** Open the UI on the phone-width screen: the waiting alert card shows the coin, which oscillator diverged, freshness, gate scores, and the pre-filled size. Let time pass (or use the pre-aged alert) and re-check the freshness readout.
   Success: the complete alert card is visible and correct in the recording, and the freshness readout visibly ages rather than staying frozen at "just now."
   Failure: the card is missing, blank, shows wrong fields, or the freshness readout looks fresher than the alert actually is (stuck or frozen age) — a stale alert masquerading as live.
2. **glanceable.** Read the card at 390px without zooming or sideways scrolling, including whether the gate scores and oscillator signal are readable without relying on color alone.
   Success: every field fits, is readable at phone width, and score/signal meaning is legible from text or icon, not color alone.
   Failure: any field is cut off, overlapping, needs zoom or sideways scroll to read, or a score/signal is only distinguishable by color.
3. **stack.** Add a second alert.
   Success: the newer alert sits on top of the older one.
   Failure: the order is wrong, or the list does not update.
4. **archive.** Resolve an alert.
   Success: it leaves the active list and appears in the archive.
   Failure: it lingers in the active list, or vanishes without reaching the archive.

## Gotchas

- Phone width is the pass/fail surface — a desktop-pretty card that clips at 390px fails.
- A resolved alert lingering in the active list is a failure, not a cosmetic issue.
- A freshness readout that stops updating while the card still renders as if live is the classic "ghost quote" failure — check it by letting time actually pass, not just that a freshness field is present at open.
