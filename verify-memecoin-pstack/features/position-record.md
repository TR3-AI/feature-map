# Position Record

The shared position ledger — created the moment Bobby's buy click sends the Fractional Kelly Sizer's sized entry order, then updated fill by fill as it lives through 2x Capital Recovery, the Moon Bag Rule's carve-out, and repeated Divergence Clip Ladder cycles, until the sellable remainder is flat (moon bag aside) and the result is logged. One object, because sizing and the exit ladder share position state.

## Sub-features

- `open` opens the record at the buy click, confirmed into a real quantity only once the entry fill lands.
- `track` keeps quantity, cost basis, and the realized/unrealized split current as every fill posts.
- `serialize` applies concurrent triggers one at a time against the record's own just-updated state, never a stale read.
- `bag-split` holds the moon-bag quantity out of the sellable remainder for good, once flagged.
- `reconcile` checks the record's believed quantity against the venue's own position and surfaces any mismatch.
- `close` reaches a single logged terminal state, whichever path gets there.

## How to get to it (user POV)

- Indirect: the Positions view (Trader Console's Positions & Moon Bag View) — current quantity, realized/unrealized split, and the moon-bag carve-out, all read live off this record.

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** Bobby's buy click sends the Kelly-sized entry order; every fill that lands against this position afterward — the entry, the 2x withdrawal, each clip, or a stop-loss — is a further trigger on the same record.
2. **Mechanism:** the record is a position ledger in the same shape a broker's back-office system keeps — quantity, cost basis, and a realized/unrealized split, mutated one fill at a time off the frozen fill-event schema. Each fill applies against the record's current state, never a stale read, so two triggers landing close together (the 2x withdrawal and a clip, or two divergence-fired clips) serialize instead of racing. The moon-bag quantity, once the Moon Bag Rule flags it, comes out of the sellable remainder for good.
3. **Delivery:** fills arrive over Fill Reporting's at-least-once channel and dedupe on the fill's stable ID like every other consumer. The reconciliation pull itself — reading the wallet's real on-chain token balance (Solana) or account balance (Robinhood Chain EVM) against the record's believed quantity — is PRE-BUILD until the app repo and chart/chain-data provider are chosen (the idea slice's own Unresolved list leaves the provider open).
4. **Surface:** current quantity, the realized/unrealized split, and the moon-bag carve-out, live in the Positions view; on close, the final result is handed to the Trade Journal.
5. **Breaks:** a missed or dropped fill leaving the tracked quantity wrong while the venue's real position has already moved on · two exit triggers reading the same "remaining" before either writes, double-decrementing one clip's worth · the record never checked against the venue's own position, so either drift runs silently forever instead of surfacing.

Existence: this is a completely standard pattern — every broker/OMS maintains exactly this "position blotter" shape: quantity, cost basis, and a realized/unrealized split, updated fill by fill and periodically reconciled against the custodian's or venue's own record (the same discipline behind a broker's realized/unrealized statements, or a retail broker syncing its book against a custodian's Start-of-Day position file). The double-counting failure this feature guards against is a real, documented bug class in this exact shape of system, not a hypothetical one: a production algorithmic-trading position-reconciliation engine (Nautilus Trader) has an open issue where two code paths — an open order's partial fills and a synthetic reconciliation report — both credit the same fill against one position, double-counting it.
Deviations from standard: the idea slice doesn't spec a reconciliation cadence or a concurrency rule for the record on its own — but it already names this as the department's single biggest risk, not a gap research found independently: the "Exit management" correlated group (Trade Execution + Position & Exit Ladder) lists "a missed fill corrupts the ladder state (moon bag vs clip split goes wrong)" as its risk, and the fill-event schema tops the whole map's snap ranking for exactly that reason. Tester action: run `serialize` and `reconcile` every time as first-class checks, not edge cases skipped once the happy path passes.

## Test stream

Preconditions:

- Devnet position; ProofShot recording; the Positions view open alongside the venue's own position/balance view for cross-checking; a replay harness able to hold back one fill event and to fire two exit triggers within the same tick (both PRE-BUILD until the app repo exists).

1. **Position Record works end to end.** Click buy on a devnet test alert and drive the position through entry, 2x, the moon-bag flag, and two clips to flat, watching the Positions view throughout.
   Success: quantity, the realized/unrealized split, and the moon-bag carve-out update correctly at every step and land on flat (moon bag aside) with one result logged.
   Failure: the tracked quantity ever disagrees with the fills that actually landed, the bag leaks into the sellable remainder, or the record never reaches a logged close.
2. **open.** Fire a buy click and let the entry fill land normally; separately, fire a second buy click and force the entry to never land.
   Success: the first record shows no open position until the entry fill confirms, then opens with the confirmed on-chain quantity and cost basis; the second record shows no open position at all once the entry never lands.
   Failure: a record shows an open position before any fill confirms, or the never-landed click still leaves a phantom open position.
3. **track.** Run a position through the 2x withdrawal and one clip, checking quantity/realized/unrealized against each fill's own recorded price and size right after it lands.
   Success: after each fill, quantity decreases by exactly that fill's size, realized increases by exactly that fill's proceeds, and unrealized re-marks off the live price for what remains.
   Failure: quantity, realized, or unrealized disagrees with the fill that just landed, or a field doesn't move.
4. **serialize.** Replay two exit triggers landing within the same tick — the 2x withdrawal and a divergence-fired clip together, or two divergence signals back to back.
   Success: the record applies them one after another against its own just-updated state — the second trigger's size is computed off the remainder after the first already posted, and the total sold matches exactly what both triggers should sell, never double-counted.
   Failure: both triggers compute their size off the same pre-update remainder (double-selling one clip's worth), or the final quantity doesn't match the sum of what actually filled.
5. **bag-split.** Flag the moon bag at 2x, then run the clip ladder to completion, checking the bag's tracked quantity before and after.
   Success: the bag's quantity never changes once flagged, and every clip's size is computed off the remainder with the bag already excluded.
   Failure: a clip's size is computed as if the bag were still part of the sellable remainder, or the bag's tracked quantity moves during the ladder.
6. **reconcile.** Hold back one fill event from reaching the record — simulating a dropped delivery — while the venue's own position already reflects it, then let the record's reconciliation check run.
   Success: the mismatch between the record's believed quantity and the venue's own position surfaces visibly, rather than the record silently continuing to report its stale number as current.
   Failure: the record keeps reporting its pre-drift quantity with no indication it disagrees with the venue, or the reconciliation check never runs.
7. **close.** Run one position to flat through the full ladder, and a second position that gets stopped out before ever reaching 2x.
   Success: the first closes with the sellable remainder at zero, the moon bag still shown separately, and one result logged; the second closes fully — no moon bag ever carved, since 2x never fired — with its own single result logged.
   Failure: either position lingers open after its true closing fill, the first case leaves the moon bag merged into the closed record, or the second case shows a phantom moon bag despite 2x never happening, or either logs its result twice.

## Gotchas

- Check every quantity/realized/unrealized figure against the fill's own recorded size and price, never against what the record already believed — comparing a number to itself proves nothing about drift.
- A stop-loss fill landing before 2x is a full close, not a clip — the record must never sit around expecting a moon-bag carve that a stopped-out position will never reach.
- Research note: the double-counting race here isn't hypothetical — a real production trading engine has shipped this exact bug class (two paths crediting the same fill against one position). Tester action: run the `serialize` check with genuinely concurrent triggers, not two triggers spaced far enough apart that ordering was never actually in question.
