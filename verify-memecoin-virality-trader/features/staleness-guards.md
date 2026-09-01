# Staleness guards

Two guards end a stale watch: price +30% from the call-out (distance), or more than 15 one-minute candles (time). Either fires, the watch stops, the reason is logged.

## Sub-features

- `distance-guard` ends the watch at +30% from call-out.
- `time-guard` ends the watch after 15 one-minute candles.
- `stop-reason` logs which guard fired; stopped watches never resume.

## How to get to it (user POV)

- Indirect: the watch state and stop reason appear in the trigger view / log.

## Test stream

Preconditions:

- Trigger view visible; ProofShot recording; chart replay loaded.

1. **Staleness guards works end to end.** Replay a chart running +31% with no divergence, then replay 16 flat candles.
   Success: Both replays end the watch with the correct reason, and stopped watches stay stopped — all in the recording.
   Failure: A watch runs past a guard, stops with the wrong reason, or quietly resumes.
2. **distance-guard.** Replay a chart running +31% from the call-out with no divergence.
   Success: The watch stops with reason "distance".
   Failure: The watch keeps running past +30%, or stops with a different reason.
3. **time-guard.** Replay 16 flat one-minute candles with no divergence.
   Success: The watch stops with reason "time" once the 16th candle passes.
   Failure: The watch keeps running past 15 candles, or stops with a different reason.
4. **stop-reason.** After a guard fires, drop the price back to the call-out level.
   Success: The stop reason (distance or time) stays logged, and the watch stays stopped — it does not resume.
   Failure: No reason is logged, or the watch resumes tracking after the price drops back.

## Gotchas

- Candle 15 exactly: the rule is *more than* 15 — pin which side the boundary falls on and test it.
- A stopped-then-resumed watch is the silent failure; always run the no-resume check.
