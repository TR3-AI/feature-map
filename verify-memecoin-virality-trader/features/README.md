# Memecoin virality trader — verification map

This directory is the maintained source for verifying the user-facing behavior of the memecoin virality trader. Read this index before driving the app, then use the matching feature file as the recipe. Generated from the idea-slicer map (issue #4) before the app exists — every recipe names its intended surface; ground exact commands against the real repo at first build.

## Baseline preconditions

- The tester agent performs every action — never Bobby. Bobby witnesses the ProofShot recording.
- Every run happens inside a **ProofShot** session: video + screenshots of each checkpoint.
- UI drives at phone width (390px) — the primary screen.
- Exchange-side checks run on devnet/test networks only, with disposable wallets referenced by secret name.
- Run the kit's doctor check first; never drive an instance this run did not start.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Prefer ARIA labels and stable data attributes over coordinates or tab order.
- Gate tests feed known inputs (test candidates with pinned metrics); watcher tests replay charts with known divergences; execution tests run on devnet with the exchange's own views as proof.
- Restore seeded fixtures after a mutation; never remove proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof shows the action and the visible end state in the recording.
- Exchange proof shows the venue's own open-orders / positions list in the recording.
- Mutation proof includes a second, read-only view of the stored value (journal, position state).
- Record the feature ID and entry point used with every artifact.
- Report an unreachable path with the attempted route and the unmet precondition — never report a skipped path as verified through another.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior, then exactly four H2s in this order: `Sub-features`, `How to get to it (user POV)`, `Driving it with the harness`, `Gotchas`. Keep implementation details out of the map: user paths, stable handles, required state, commands, observable proof only.

## Features

Callout intake:
- [Source list config](./source-list-config.md) — the watched-traders list, editable, safe when empty.
- [Callout listener + normalizer](./callout-listener.md) — stream → four-field candidate, malformed rejected.

Virality scorer:
- [30-day baseline builder](./baseline-builder.md) — the average the multiplier is judged against.
- [Age-band multiplier gate](./multiplier-gate.md) — gate 1: 3x / 10x / 50x by age, 6–24h rejected.

Narrative analysis:
- [Grok analysis](./grok-analysis.md) — five fields + veracity and virality as separate scores.
- [Combined-score gate](./score-gate.md) — gate 2: ≥6 with tweet, >8 without.

Bundler checker:
- [Bundler share pull](./bundler-pull.md) — creation-block wallets + supply %, one pinned method.
- [Bundler trend classification](./bundler-trend.md) — decreasing / stagnating / increasing.
- [Bundler gate](./bundler-gate.md) — gate 3: reject >10–15%, harder if increasing.

Signal & trigger:
- [Divergence watcher](./divergence-watcher.md) — gate 4: OBV/RSI divergence only.
- [Staleness guards](./staleness-guards.md) — +30% price or 15 candles ends the watch.
- [Divergence alert](./divergence-alert.md) — the payload with the pre-filled size, once.

Front-end UI:
- [Alert display](./alert-display.md) — glanceable on the phone in seconds.
- [BUY button](./buy-button.md) — one tap, exactly the pre-filled size, no double-fire.
- [Positions + moon bag view](./positions-view.md) — live positions; the bag's manual home.

Trade executor:
- [Venue router](./venue-router.md) — Solana vs Robinhood Chain by listing.
- [Entry execution](./entry-execution.md) — only after the click; one fill per click.
- [Immediate stop-loss](./immediate-stop-loss.md) — on the exchange at entry −30%, self-cancels at 2x.
- [Sell-into-volume filter](./sell-into-volume.md) — exits only into green candles + volume.
- [Fill reporting](./fill-reporting.md) — one event per fill, acknowledged by both consumers.

Position manager:
- [Fractional Kelly sizer](./kelly-sizer.md) — size pre-filled at alert; Grok never an input.
- [2x capital recovery](./capital-recovery.md) — initial out at 2x, stop cancelled.
- [Moon bag rule](./moon-bag.md) — 20% manual-only, untouched by automation.
- [Divergence clip ladder](./clip-ladder.md) — 15–20% clips into volume, bag excluded.

Trade journal:
- [Trade journal](./trade-journal.md) — the whole trade replaying from one record.
