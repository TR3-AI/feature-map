# Alert display

The alert card readable at a glance on the phone: coin, oscillator, freshness, scores, pre-filled size. Newest on top; resolved cards archive.

## Sub-features

- `glanceable` shows every field at phone width, no zoom or sideways scroll.
- `stack` orders multiple alerts newest-first.
- `archive` removes resolved alerts from the active list.

## How to get to it (user POV)

- The front-end UI's alert list, on the phone.

## Test stream

Preconditions:

- UI at 390px width; ProofShot recording; a test alert waiting.

1. **Alert display works end to end.** Open the UI on the phone-width screen: the waiting alert card shows the coin, which oscillator diverged, freshness, gate scores, and the pre-filled size.
   Success: the complete alert card is visible and correct in the recording.
   Failure: the card is missing, blank, or shows wrong or stale fields.
2. **glanceable.** Read the card at 390px without zooming or sideways scrolling.
   Success: every field fits and is readable at phone width.
   Failure: any field is cut off, overlapping, or needs zoom or sideways scroll to read.
3. **stack.** Add a second alert.
   Success: the newer alert sits on top of the older one.
   Failure: the order is wrong, or the list does not update.
4. **archive.** Resolve an alert.
   Success: it leaves the active list and appears in the archive.
   Failure: it lingers in the active list, or vanishes without reaching the archive.

## Gotchas

- Phone width is the pass/fail surface — a desktop-pretty card that clips at 390px fails.
- A resolved alert lingering in the active list is a failure, not a cosmetic issue.
