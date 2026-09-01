# Divergence watcher

Gate 4: watches the chart from the call-out moment for an OBV or RSI divergence — either oscillator works, both together is stronger. Patterns are parked; divergence only.

## Sub-features

- `anchor` starts every watch at the call-out price and time.
- `detect` spots divergence on OBV, RSI, or both (strength recorded).
- `handoff` passes a spotted divergence to the alert emitter.

## How to get to it (user POV)

- Indirect: a spotted divergence becomes the alert in the UI; the watch state is visible in the trigger view.

## Test stream

Preconditions:

- Trigger view visible; ProofShot recording; chart replay loaded.

1. **Divergence watcher works end to end.** Replay a chart with a known OBV divergence, then a clean chart with no divergence.
   Success: The known divergence is caught and named; the clean replay stays quiet — both visible in the recording.
   Failure: The known divergence is missed, or a flat chart produces a signal.
2. **anchor.** Replay a chart from a known call-out price and time, and check where the watch starts.
   Success: the watch's starting price and time match the call-out's price and time exactly.
   Failure: the watch starts from a different price or time than the call-out.
3. **detect.** Replay the chart with the known OBV divergence.
   Success: the flag names the correct oscillator that diverged, with its strength recorded.
   Failure: the wrong oscillator is named, or the strength is missing or wrong.
4. **handoff.** After the known divergence is detected, check the front-end UI.
   Success: the detected divergence produces a divergence alert in the UI.
   Failure: the divergence is detected but no alert ever appears downstream.

## Gotchas

- The anchor is the call-out price — a divergence measured from the wrong anchor is a false pass; verify the anchor in the recording.
- Deterministic: the same replay must give the same result on a second run.
