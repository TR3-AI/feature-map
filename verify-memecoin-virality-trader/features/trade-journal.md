# Trade journal

One append-only record per trade: every gate verdict, the alert, Bobby's click, every fill, every ladder step — the whole trade replayable from the journal alone.

## Sub-features

- `record` opens per callout and appends in order.
- `one-schema` keeps every department on the same event shape.
- `replay` shows the complete trade in order with no gaps.
- `close` seals the record when flat, noting a surviving moon bag.

## How to get to it (user POV)

- The journal view in the UI.

## Driving it with the harness

Preconditions:

- Devnet; ProofShot recording; one full trade run end to end.

- **Full trade.** Run one complete trade. The journal shows every step in order: gates, alert, click, fills, ladder.
- **No gaps.** Cross-check two events against the exchange and the UI — they match.
- **Closed record.** At flat, the record is sealed and notes any surviving moon bag.

## Gotchas

- The journal is the audit trail of last resort — a single missing event fails the feature, even if everything "worked".
- Append-only means append-only: no edited or deleted events anywhere in the record.
