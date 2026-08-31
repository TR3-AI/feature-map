---
name: verify-memecoin-virality-trader
description: Drive the memecoin virality trader the way a user does — front-end alert UI, exchange order lists, journal feed — and capture proof for every feature. Use when verifying any feature in features/, before declaring any build work done, or when Bobby asks "prove it works".
---

# Verify: memecoin virality trader

Generated from `maps/memecoin-virality-trader.md` (idea-slicer issue #4) by the featuremap skill — **before the app exists**. The `features/` map is complete and authoritative (it is user-POV; the idea defines it). Sections marked `PRE-BUILD` below name the intended surface from the idea; ground them against the real repo the day code exists. **This kit is a draft until its first executed proof run** — never report it as proven before then.

## Launch

`PRE-BUILD — ground me against the real repo.`

Intended surfaces from the idea map:

- **Front-end UI** (the primary surface, phone-first): divergence alerts with pre-filled Kelly size, BUY button, positions + moon bag view. Expected local dev URL + readiness signal: to be grounded (look for the repo's own dev command and a port answering).
- **Trade executor**: Solana (devnet for verification) + Robinhood Chain (testnet if offered). Wallet keys come from Bobby's secret store, referenced by secret name — never raw.
- **Trade journal**: the event feed backing the journal view.
- Supporting harness: chart replay for the watcher/guard tests (a replayed chart with known divergences and known candle sequences), test candidates with known metrics for the gate tests.

Teardown: stop what this run started; never kill by process name. Devnet wallets used for a run are disposable.

## Doctor

`PRE-BUILD — ground me against the real repo.`

One read-only check answering "is this instance worth driving?": UI up on the expected port, expected build, devnet wallet funded, chart replay loaded, exchange connections pointing at test networks — never mainnet. Run it before the first drive, after any failed drive, and after anything surprising.

## Drive

`PRE-BUILD — ground me against the real repo.`

Harness recipe: drive the UI in a real browser at phone width (390px — the primary screen) inside a **ProofShot** recording session; the tester agent performs every action, Bobby only watches the recording. Prefer stable handles (ARIA labels, data attributes) over coordinates. Exchange-side checks read the venue's own open-orders / positions views (devnet explorer, exchange dashboard). Gate and watcher tests drive the harness inputs (test candidates, replayed charts), then read the visible verdicts.

## Evidence

Capture the action **and** the resulting state, not just the final screen. UI proof = recording showing the user path plus the visible end state. Exchange proof = the venue's own order/position list visible in the recording. Mutation proof = a second, read-only view of the stored value (journal entry, position state). Record the feature ID and entry point with every artifact. Artifacts go to `artifacts/<feature-id>/` and **survive cleanup** — a cleanup that eats the proof fails the run. Never report a skipped entry point as verified through a different path.

## Cleanup

Tear down instances this run created; keep evidence. Restore seeded fixtures (test candidates, replayed charts, seeded alerts) after mutations. Devnet balances are disposable; never touch anything on a live network.

## Helpers

`PRE-BUILD` — none yet. Any helper script added later must be executable with its invocation documented here; a helper the reader has to reverse-engineer is not a helper.

## The feature map

`features/README.md` is the maintained source for verifying every user-facing feature — 25 features, from source list config to the trade journal. Read it before driving; use the matching feature file as the recipe.
