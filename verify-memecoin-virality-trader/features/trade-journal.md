# Trade journal

One append-only record per trade: every gate verdict, the alert, Bobby's click, every fill, every ladder step — the whole trade replayable from the journal alone.

## Sub-features

- `record` opens per callout and appends in order.
- `one-schema` keeps every department on the same event shape.
- `replay` shows the complete trade in order with no gaps.
- `close` seals the record when flat, noting a surviving moon bag.

## How to get to it (user POV)

- The journal view in the UI.

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** any trade state change — gate verdict, click, fill, close.
2. **Mechanism:** the journal appends an immutable event (monotonic per-trade sequence number, timestamp, type, payload) — event sourcing: current state (open? flat?) is derived by replaying events in order, never read from a mutable record.
3. **Surface:** the full trade reconstructable from the journal alone, matching what the exchange and UI show.
4. **Breaks:** a dropped write (silent — nothing else fails loudly; only replay against the exchange catches it) · a gap or out-of-order delivery (the monotonic sequence exposes it; a plain timestamp can't under retries or clock skew) · a redelivered close applied twice (must be recognized by the already-sealed record and dropped).

Existence: exists in the requested format — append-only event logs with idempotent replay are a standard, well-documented pattern (event sourcing); nothing about the mechanic needs bot-simulation, only the specific nine-department schema is bespoke to this map.
Deviations from standard: none — research reinforced the spec. Deduplicating a redelivered closing event by checking for an already-sealed record (rather than trusting "if it arrives, apply it") is exactly the idempotency practice standard event-sourced systems use, and matches this file's redelivery gotcha.

## Test stream

Preconditions:

- Devnet; ProofShot recording; one full trade run end to end.

1. **Trade journal works end to end.** Run one complete devnet trade end to end and read the journal.
   Success: The complete trade replays from the journal alone, matching reality.
   Failure: Any event that happened is missing from the record, or the journal disagrees with the exchange.
2. **record.** Run a trade starting from the callout.
   Success: The journal record opens at the callout and appends each event in the order it happened.
   Failure: The record opens late, misses an early event, or events appear out of order.
3. **one-schema.** Compare events from different departments in the journal, such as a gate verdict and a fill.
   Success: Every event, regardless of which department produced it, uses the same event shape and fields — including a monotonic sequence number and a timestamp.
   Failure: An event from one department has a different shape than the rest, is missing expected fields, or its sequence number/timestamp is missing or out of step with its neighbors.
4. **replay.** Read the completed trade's journal alone and cross-check two events against the exchange and the UI.
   Success: The journal shows every step in order with no gaps — each event's sequence number follows the last with none skipped — matching what the exchange and UI show.
   Failure: There is a gap or skip in the sequence, or an event in the journal disagrees with the exchange or UI.
5. **close.** Run the position to flat with a moon bag surviving, then redeliver the same closing fill event a second time (simulating a retried delivery).
   Success: At flat, the record is sealed once and notes the surviving moon bag; the redelivered event does not reopen the record, re-seal it, or add a duplicate closing entry.
   Failure: The record isn't sealed at flat, doesn't note the surviving moon bag, or the redelivered event produces a duplicate seal or a second closing entry.

## Gotchas

- The journal is the audit trail of last resort — a single missing event fails the feature, even if everything "worked".
- Append-only means append-only: no edited or deleted events anywhere in the record.
- A redelivered event that silently produces a second closing entry breaks append-only in spirit even if no existing row was edited — the ledger's tail after redelivery must show exactly one seal, not two.
