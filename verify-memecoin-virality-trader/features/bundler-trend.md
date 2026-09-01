# Bundler trend classification

Reads the bundler share over time and labels it decreasing, stagnating, or increasing (0% ideal). A single snapshot classifies as unknown — never as safe.

## Sub-features

- `history` reads the share over the pinned window.
- `label` assigns decreasing / stagnating / increasing.
- `unknown` marks single-snapshot tokens honestly.

## How to get to it (user POV)

- Indirect: the trend label appears on the candidate in the checker view.

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** a candidate's bundled-supply % has been pulled once.
2. **Mechanism:** the bot polls the pinned provider on a schedule and diffs the readings over a pinned window — providers sell single snapshots, so the trend itself is bot-built.
3. **Surface:** a direction label — diluting (organic buyers shrinking the bundle's relative control) · flat-or-climbing (danger) · unknown for a lone snapshot.
4. **Breaks:** one reading labeled as a trend (a single snapshot must read unknown, never the friendliest label) · a falling % read as safe when it's bundlers dumping into demand — indistinguishable from dilution without a price/volume read, so the label stays a label, not a safety guarantee.

Existence: multi-point trend tracking must be bot-built on top of a snapshot-only provider — poll the pinned provider on a schedule and diff the readings yourself; there's no off-the-shelf "bundle trend" feed to pull.
Deviations from standard: most public bundle checkers surface only a single point-in-time %, not a tracked trend — the map's requirement for multiple readings over a pinned window (and "unknown" for a lone snapshot) goes beyond typical tooling rigor, not below it; the map stands.

## Test stream

Preconditions:

- Checker view visible; ProofShot recording; four test tokens — decreasing, increasing, single snapshot, and one whose readings wobble slightly around a flat level with no real trend.

1. **Bundler trend classification works end to end.** Feed three test tokens — decreasing, increasing, single snapshot — through the checker.
   Success: both trending tokens get the correct label, and the single-snapshot token shows unknown — all visible in the recording.
   Failure: a rising share is labelled decreasing, or a single snapshot passes as a real trend.
2. **history.** Feed a token with multiple readings over the window and open the underlying readings alongside the label.
   Success: the readings over the pinned window are visible and match what the label is based on.
   Failure: the readings are missing, or only a single reading backs a trend label.
3. **label.** Feed the token whose share visibly falls, the one whose share visibly rises, and the one whose readings wobble slightly around a flat level with no real trend.
   Success: the label reads decreasing for the falling token, increasing for the rising token, and stagnating for the noisy-flat token — noise isn't read as a real trend.
   Failure: either directional label is flipped, a token that clearly moves reads stagnating, or small noise around a flat level gets labelled as a real trend.
4. **unknown.** Feed the token with one reading.
   Success: the label reads unknown, not decreasing, increasing, or stagnating.
   Failure: the single-reading token gets a real trend label instead of unknown.

## Gotchas

- The label must match what the underlying readings visibly show; open the readings in the recording, not just the label.
- "Unknown" must not be treated as a pass by the gate downstream — check the hand-off.
- A decreasing bundler share can mean bundlers are diluting away (good) or bundlers actively dumping into retail (bad) — the label alone doesn't distinguish the two; that distinction is out of scope for this classifier (price/divergence signals handle it downstream), but a "decreasing" label is not by itself a safety guarantee.
