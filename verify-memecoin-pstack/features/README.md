# Memecoin virality trader — P-stack pass — verification map

This directory is the maintained source for verifying the user-facing behavior of the memecoin P-stack trader. Read this index before driving the app, then use the matching feature file as the recipe. Generated from the idea-slicer map (issue #13) before the app exists — every recipe names its intended surface; ground exact commands against the real repo at first build.

This is a P-stack re-slice of `verify-memecoin-virality-trader` (issue #4): 7 departments instead of 9, one shared Candidate Record running three qualification gates, one shared Position Record running sizing + the exit ladder.

## Baseline preconditions

- The tester agent performs every action — never Bobby. Bobby witnesses the ProofShot recording.
- Every run happens inside a **ProofShot** session: video + screenshots of each checkpoint.
- UI drives at phone width (390px) — the primary screen.
- Exchange-side checks run on devnet/test networks only, with disposable wallets referenced by secret name.
- Run the kit's doctor check first; never drive an instance this run did not start.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Prefer ARIA labels and stable data attributes over coordinates or tab order.
- Gate tests feed known candidates directly at the gate under test; watcher tests replay charts with known divergences; execution tests run on devnet with the exchange's own views as proof.
- Restore seeded fixtures after a mutation; never remove proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof shows the action and the visible end state in the recording.
- Exchange proof shows the venue's own open-orders / positions list in the recording.
- Mutation proof includes a second, read-only view of the stored value (journal, candidate stamp log, position record).
- Record the feature ID and entry point used with every artifact.
- Report an unreachable path with the attempted route and the unmet precondition — never report a skipped path as verified through another.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior, then exactly five H2s in this order: `Sub-features`, `How to get to it (user POV)`, `How it works in practice`, `Test stream`, `Gotchas`. Keep implementation details out of the map: user paths, stable handles, required state, commands, observable proof only.

## Features

Callout Intake:
- [Source List Config](./source-list-config.md) — the watched-traders list, editable, safe when empty.
- [Callout Listener & Normalizer](./callout-listener.md) — stream → four-field candidate, malformed rejected.

Candidate Qualification — one shared Candidate Record, three gates:
- [Candidate Record](./candidate-record.md) — the shared record: stamp log, gate order, Clean vs Rejected-at-gate-X.
- [Virality Gate](./virality-gate.md) — 30-day baseline + age-band multiplier (3x/10x/50x), no-tweet bypass.
- [Narrative Gate](./narrative-gate.md) — Grok 4.6 five fields + dual score threshold (≥6 with tweet, >8 without).
- [Bundler Gate](./bundler-gate.md) — creation-block % + trend, ≤10–15% ceiling, increasing rejected harder.

Divergence Signal:
- [Divergence Watcher](./divergence-watcher.md) — OBV/RSI divergence only, either oscillator qualifies.
- [Staleness Guards](./staleness-guards.md) — +30% price or 15 candles ends the watch.
- [Divergence Alert](./divergence-alert.md) — the payload with the pre-filled size, once.

Trader Console:
- [Alert Display](./alert-display.md) — glanceable on the phone in seconds.
- [Buy Button](./buy-button.md) — one tap, exactly the pre-filled size, no double-fire.
- [Positions & Moon Bag View](./positions-view.md) — live positions; the bag's manual home.

Trade Execution:
- [Venue Router](./venue-router.md) — Solana vs Robinhood Chain by listing.
- [Entry Execution](./entry-execution.md) — only after the click; one fill per click.
- [Immediate Stop-Loss](./immediate-stop-loss.md) — on the exchange at entry −30%, self-cancels at 2x.
- [Sell-Into-Volume Filter](./sell-into-volume.md) — exits only into green candles + volume.
- [Fill Reporting](./fill-reporting.md) — one event per fill, acknowledged by both consumers.

Position & Exit Ladder — one shared Position Record, sizing + ladder:
- [Position Record](./position-record.md) — the shared ledger: quantity, realized/unrealized, moon-bag carve-out, reconciliation.
- [Fractional Kelly Sizer](./kelly-sizer.md) — size pre-filled at alert; Grok never an input.
- [2x Capital Recovery](./capital-recovery.md) — initial out at 2x, stop cancelled.
- [Moon Bag Rule](./moon-bag.md) — 20% manual-only, untouched by automation.
- [Divergence Clip Ladder](./clip-ladder.md) — 15–20% clips into volume, bag excluded.

Trade Journal:
- [Trade Journal](./trade-journal.md) — the whole trade replaying from one record.
