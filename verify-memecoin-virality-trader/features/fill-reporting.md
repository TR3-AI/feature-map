# Fill reporting

One event per fill on the frozen schema, delivered to both consumers — Position manager (ladder state) and Trade journal (record) — with acknowledged delivery.

## Sub-features

- `one-event` emits exactly one event per fill, no duplicates.
- `both-consumers` delivers to ladder and journal alike.
- `ack-retry` retries until both acknowledge; unacknowledged escalates.

## How to get to it (user POV)

- Indirect: the journal feed and the ladder state in the UI.

## Driving it with the harness

Preconditions:

- Devnet; ProofShot recording; journal feed and ladder state visible.

- **Two fills.** Execute an entry plus one clip. The journal shows both, with sizes and prices matching the chain.
- **Ladder advances.** The ladder state reflects both fills.
- **No gaps.** Compare the chain's fill list against the journal — identical.

## Gotchas

- A missed fill corrupts the ladder silently — the chain-vs-journal comparison is the real check, not either view alone.
- Duplicate events are as bad as missing ones; count them.
