# Fill reporting

One event per fill on the frozen schema, delivered to both consumers — Position manager (ladder state) and Trade journal (record) — with acknowledged delivery.

## Sub-features

- `one-event` emits exactly one event per fill, no duplicates.
- `both-consumers` delivers to ladder and journal alike.
- `ack-retry` retries until both acknowledge; unacknowledged escalates.

## How to get to it (user POV)

- Indirect: the journal feed and the ladder state in the UI.

## Test stream

Preconditions:

- Devnet; ProofShot recording; journal feed and ladder state visible.

1. **Fill reporting works end to end.** Execute a devnet entry plus one clip and check the journal feed and ladder state.
   Success: Every on-chain fill appears once in both places, exactly as executed — verifiable in the recording.
   Failure: A fill executed on-chain is missing from the journal or the ladder — a silent gap.
2. **one-event.** Execute the entry plus one clip and count the events for each fill.
   Success: exactly one event appears per fill — two fills, two events, no duplicates.
   Failure: a fill produces zero events, or more than one, for the same fill.
3. **both-consumers.** Execute the entry plus one clip and check both the journal feed and the Position manager's ladder state.
   Success: both the journal feed and the ladder state reflect the same two fills.
   Failure: one consumer shows a fill that the other is missing.
4. **ack-retry.** Block one consumer temporarily during a fill, then restore it.
   Success: the event keeps retrying until the consumer acknowledges, or raises a visible escalation if it never does.
   Failure: the event is dropped with no retry and no escalation after the consumer is blocked.

## Gotchas

- A missed fill corrupts the ladder silently — the chain-vs-journal comparison is the real check, not either view alone.
- Duplicate events are as bad as missing ones; count them.
