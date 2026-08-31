# Divergence watcher

Gate 4: watches the chart from the call-out moment for an OBV or RSI divergence — either oscillator works, both together is stronger. Patterns are parked; divergence only.

## Sub-features

- `anchor` starts every watch at the call-out price and time.
- `detect` spots divergence on OBV, RSI, or both (strength recorded).
- `handoff` passes a spotted divergence to the alert emitter.

## How to get to it (user POV)

- Indirect: a spotted divergence becomes the alert in the UI; the watch state is visible in the trigger view.

## Driving it with the harness

Preconditions:

- Trigger view visible; ProofShot recording; chart replay loaded.

- **Known divergence.** Replay a chart containing a known OBV divergence. The flag appears with the oscillator named and strength recorded.
- **Clean replay.** Replay a chart with no divergence. Nothing is flagged.

## Gotchas

- The anchor is the call-out price — a divergence measured from the wrong anchor is a false pass; verify the anchor in the recording.
- Deterministic: the same replay must give the same result on a second run.
