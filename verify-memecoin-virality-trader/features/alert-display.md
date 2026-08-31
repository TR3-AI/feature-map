# Alert display

The alert card readable at a glance on the phone: coin, oscillator, freshness, scores, pre-filled size. Newest on top; resolved cards archive.

## Sub-features

- `glanceable` shows every field at phone width, no zoom or sideways scroll.
- `stack` orders multiple alerts newest-first.
- `archive` removes resolved alerts from the active list.

## How to get to it (user POV)

- The front-end UI's alert list, on the phone.

## Driving it with the harness

Preconditions:

- UI at 390px width; ProofShot recording; a test alert waiting.

- **Read.** Open the UI. Every field is readable without zooming or sideways scrolling.
- **Stack.** Add a second alert. The newer one sits on top.
- **Resolve.** Resolve an alert. It leaves the active list and appears in the archive.

## Gotchas

- Phone width is the pass/fail surface — a desktop-pretty card that clips at 390px fails.
- A resolved alert lingering in the active list is a failure, not a cosmetic issue.
