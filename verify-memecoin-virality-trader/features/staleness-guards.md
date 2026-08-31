# Staleness guards

Two guards end a stale watch: price +30% from the call-out (distance), or more than 15 one-minute candles (time). Either fires, the watch stops, the reason is logged.

## Sub-features

- `distance-guard` ends the watch at +30% from call-out.
- `time-guard` ends the watch after 15 one-minute candles.
- `stop-reason` logs which guard fired; stopped watches never resume.

## How to get to it (user POV)

- Indirect: the watch state and stop reason appear in the trigger view / log.

## Driving it with the harness

Preconditions:

- Trigger view visible; ProofShot recording; chart replay loaded.

- **Distance.** Replay a chart running +31% with no divergence. The watch stops; reason "distance".
- **Time.** Replay 16 flat candles. The watch stops; reason "time".
- **No resume.** Drop the price back after the stop. The watch stays stopped.

## Gotchas

- Candle 15 exactly: the rule is *more than* 15 — pin which side the boundary falls on and test it.
- A stopped-then-resumed watch is the silent failure; always run the no-resume check.
