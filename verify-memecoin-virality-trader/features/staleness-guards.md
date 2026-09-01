# Staleness guards

Two guards end a stale watch: price +30% from the call-out (distance), or more than 15 one-minute candles (time). Either fires, the watch stops, the reason is logged.

## Sub-features

- `distance-guard` ends the watch at +30% from call-out.
- `time-guard` ends the watch after 15 one-minute candles.
- `stop-reason` logs which guard fired; stopped watches never resume.

## How to get to it (user POV)

- Indirect: the watch state and stop reason appear in the trigger view / log.

## How it works in practice

- Data-freshness guards in trading/market-data systems typically combine two axes: a magnitude/distance check (price moved too far from a reference point) and a time/staleness check (too long since a meaningful update) — either one firing ends the watch.
- The classic failure mode is the "ghost quote" or frozen feed: the connection stays technically open (no disconnect, no error) but the underlying ticks/candles simply stop arriving — a guard that only reacts to incoming data never notices, because there's no event to react to.
- Robust staleness checks (e.g. oracle price feeds) compare a wall-clock timestamp against "now" on every read — `now - last_update > threshold` — rather than counting only ticks that do arrive, specifically so a frozen feed still gets caught even when nothing new shows up.
- A guard defined purely as "count the candles that arrive" inherits a structural blind spot: if the candle stream itself stops (not just goes flat), the guard has nothing to count against and never fires — it needs a wall-clock fallback to catch that case.
- Existence: bot-simulated — there's no off-the-shelf "staleness guard" venue feature; distance and time guards are built in-house against the incoming candle stream, so testing has to drive the replay feed directly to exercise both trigger paths.
- Deviations from standard: yes, deliberately, and already flagged in this file's Research note. Standard stale-feed monitoring uses a wall-clock check that catches a fully frozen feed (zero candles arriving at all); these guards tick only on incoming candles, so a genuinely frozen tape (not just flat/sideways) could starve both — the map stands on this, treating the guards as per-candle rather than wall-clock by design.

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
4. **stop-reason.** After a guard fires, drop the price back to the call-out level; separately, replay a guard-firing candle that would also qualify as a divergence.
   Success: The stop reason (distance or time) stays logged and the watch stays stopped in both cases — it does not resume, and a same-candle divergence does not slip out an alert after the guard has already fired.
   Failure: No reason is logged, the watch resumes tracking after the price drops back, or a divergence alert fires despite the guard having already stopped the watch.

## Gotchas

- Candle 15 exactly: the rule is *more than* 15 — pin which side the boundary falls on and test it.
- A stopped-then-resumed watch is the silent failure; always run the no-resume check.
- Research note: production stale-feed monitoring shows a connection can stay open while ticks stop arriving entirely (a frozen tape) — since both guards here tick only on incoming candles, a fully frozen feed (zero candles, not just flat ones) could starve both guards, in tension with the map's "no path where a watch lives forever" guarantee — the map stands (guards are defined as per-candle, not wall-clock).
