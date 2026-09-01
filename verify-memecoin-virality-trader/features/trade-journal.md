# Trade journal

One append-only record per trade: every gate verdict, the alert, Bobby's click, every fill, every ladder step — the whole trade replayable from the journal alone.

## Sub-features

- `record` opens per callout and appends in order.
- `one-schema` keeps every department on the same event shape.
- `replay` shows the complete trade in order with no gaps.
- `close` seals the record when flat, noting a surviving moon bag.

## How to get to it (user POV)

- The journal view in the UI.

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
   Success: Every event, regardless of which department produced it, uses the same event shape and fields.
   Failure: An event from one department has a different shape than the rest, or is missing expected fields.
4. **replay.** Read the completed trade's journal alone and cross-check two events against the exchange and the UI.
   Success: The journal shows every step in order with no gaps, matching what the exchange and UI show.
   Failure: There is a gap in the sequence, or an event in the journal disagrees with the exchange or UI.
5. **close.** Run the position to flat with a moon bag surviving.
   Success: At flat, the record is sealed and notes the surviving moon bag.
   Failure: The record isn't sealed at flat, or doesn't note the surviving moon bag.

## Gotchas

- The journal is the audit trail of last resort — a single missing event fails the feature, even if everything "worked".
- Append-only means append-only: no edited or deleted events anywhere in the record.
