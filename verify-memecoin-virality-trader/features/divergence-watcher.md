# Divergence watcher

Gate 4: watches the chart from the call-out moment for an OBV or RSI divergence — either oscillator works, both together is stronger. Patterns are parked; divergence only.

## Sub-features

- `anchor` starts every watch at the call-out price and time.
- `detect` spots divergence on OBV, RSI, or both (strength recorded).
- `handoff` passes a spotted divergence to the alert emitter.

## How to get to it (user POV)

- Indirect: a spotted divergence becomes the alert in the UI; the watch state is visible in the trigger view.

## How it works in practice

- Divergence compares price structure to an oscillator: price sets a new extreme (e.g. a lower low) that OBV or RSI fails to confirm (a higher low) — the mismatch between the two is the signal, not either reading alone.
- Standard TA splits divergence into two kinds: "regular" divergence (a reversal signal — price extreme unconfirmed by the oscillator, read at trend extremes) and "hidden" divergence (a continuation signal — the opposite mismatch during a pullback within a healthy trend); this feature is explicitly the regular case only.
- A pivot (the local high/low a divergence is measured from) can't be fully confirmed until bars form after it — flagging or plotting a pivot before its candle closes is what causes "repainting": the flag can appear mid-candle, then silently shift or disappear once the candle finishes and the true pivot turns out to be somewhere else.
- The standard fix is bar-close confirmation: a signal only counts once the candle it depends on has closed; anything computed off a still-forming candle's live price is provisional, not a confirmed flag.
- Existence: bot-simulated — divergence detection isn't a vendor-provided exchange feature here; it's computed candle by candle from the chart feed's OHLC + OBV/RSI, which is exactly why the confirmed-vs-repainting distinction has to be built and verified deliberately rather than trusted from an off-the-shelf indicator.
- Deviations from standard: none — the map's "regular divergence only, confirmed on closed candles" spec matches standard TA practice and reinforces the file's existing repainting and regular-vs-hidden gotchas.

## Test stream

Preconditions:

- Trigger view visible; ProofShot recording; chart replay loaded.

1. **Divergence watcher works end to end.** Replay a chart with a known OBV divergence, then a clean chart with no divergence.
   Success: The known divergence is caught and named; the clean replay stays quiet — both visible in the recording.
   Failure: The known divergence is missed, or a flat chart produces a signal.
2. **anchor.** Replay a chart from a known call-out price and time, and check where the watch starts.
   Success: the watch's starting price and time match the call-out's price and time exactly.
   Failure: the watch starts from a different price or time than the call-out.
3. **detect.** Replay the chart with the known OBV divergence candle by candle, watching the flag both while the pivot candle is still forming and after it closes.
   Success: the flag names the correct oscillator that diverged, with its strength recorded, and only confirms once the pivot candle closes — no flag flip or vanish on the still-forming candle.
   Failure: the wrong oscillator is named, the strength is missing or wrong, or the flag fires (or changes) on an unclosed candle and repaints once it closes.
4. **handoff.** After the known divergence is detected, check the front-end UI.
   Success: the detected divergence produces a divergence alert in the UI.
   Failure: the divergence is detected but no alert ever appears downstream.

## Gotchas

- The anchor is the call-out price — a divergence measured from the wrong anchor is a false pass; verify the anchor in the recording.
- Deterministic: the same replay must give the same result on a second run.
- Divergence built on an unconfirmed (still-forming) pivot candle can repaint — the flag appears, then silently vanishes or changes once the candle closes; that's a distinct failure mode from run-to-run drift, and the replay-twice check alone doesn't catch it.
- This is "regular" divergence (price extreme not confirmed by the oscillator) in standard TA terms, not "hidden" divergence (a continuation signal that reads the opposite way) — confirm test fixtures use the regular case the spec calls for.
