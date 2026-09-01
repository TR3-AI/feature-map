# Fill reporting

One event per fill on the frozen schema, delivered to both consumers — Position manager (ladder state) and Trade journal (record) — with acknowledged delivery.

## Sub-features

- `one-event` emits exactly one event per fill, no duplicates.
- `both-consumers` delivers to ladder and journal alike.
- `ack-retry` retries until both acknowledge; unacknowledged escalates.

## How to get to it (user POV)

- Indirect: the journal feed and the ladder state in the UI.

## How it works in practice

- Delivering one event per real-world occurrence to multiple independent consumers reliably is standard distributed-systems practice: the transport guarantees at-least-once delivery (retry until acknowledged) because it genuinely can't tell "never arrived" from "arrived but the ack was lost" — duplicates are an expected outcome, not a bug in the wire.
- The standard way to still get exactly-once *behavior* on top is at-least-once delivery plus an idempotent consumer: every event carries a stable identity (FIX's ExecID field on execution reports is the classic version — unique per fill, and a retransmit with the same ID is recognized as the same fill, not a new one), and consumers dedupe on that ID rather than trusting the wire.
- Per-consumer retry isolation is the other standard piece: each subscriber (ladder, journal) gets its own delivery/retry path so one down or slow consumer's backlog doesn't hold up delivery to a healthy one — a shared queue instead causes head-of-line blocking, where one stuck message stalls everything behind it.
- Unacknowledged events are expected to keep retrying and eventually escalate visibly, never silently drop — a missed fill event is state corruption (the ladder or journal quietly falls behind), so a visible escalation path is the standard design, not optional.
- Existence: standard event-delivery architecture (the same shape as FIX execution reports or at-least-once webhook delivery) — nothing here is bot-simulated; it's a design pattern the fill pipeline has to implement correctly.
- Deviations from standard: none — the map's ack-until-acknowledged retry plus consumer-side dedup on a stable ID is exactly the standard at-least-once + idempotent-consumer pattern, reinforcing the file's existing gotcha that real delivery underneath is at-least-once, not literally exactly-once.

## Test stream

Preconditions:

- Devnet; ProofShot recording; journal feed and ladder state visible.

1. **Fill reporting works end to end.** Execute a devnet entry plus one clip and check the journal feed and ladder state.
   Success: Every on-chain fill appears once in both places, exactly as executed — verifiable in the recording.
   Failure: A fill executed on-chain is missing from the journal or the ladder — a silent gap.
2. **one-event.** Execute the entry plus one clip, then force a redelivery of one already-acknowledged fill (simulating the retry a real at-least-once delivery layer sends after a lost ack), and count the events for each fill in both the journal and the ladder.
   Success: exactly one event appears per fill — two fills, two events — and the forced redelivery does not add a second visible event for the fill it repeats.
   Failure: a fill produces zero events, more than one, or the forced redelivery shows up as a second fill downstream.
3. **both-consumers.** Execute the entry plus one clip and check both the journal feed and the Position manager's ladder state.
   Success: both the journal feed and the ladder state reflect the same two fills.
   Failure: one consumer shows a fill that the other is missing.
4. **ack-retry.** Block one consumer (say, the journal) during a fill while leaving the other (the ladder) reachable, then restore the blocked one.
   Success: the reachable consumer updates immediately and is never stalled by the blocked one; the blocked consumer's event keeps retrying until it acknowledges, or raises a visible escalation if it never does.
   Failure: the reachable consumer also stalls waiting on the blocked one, or the event is dropped with no retry and no escalation.

## Gotchas

- A missed fill corrupts the ladder silently — the chain-vs-journal comparison is the real check, not either view alone.
- Duplicate events are as bad as missing ones; count them.
- Real delivery underneath "ack-retry" is at-least-once, not literally exactly-once — the no-duplicates guarantee has to come from the consumer deduping a stable event ID, not from the wire only ever sending once. The forced-redelivery check in one-event is what actually proves that; a natural-fill event count alone doesn't.
