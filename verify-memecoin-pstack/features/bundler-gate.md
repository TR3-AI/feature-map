# Bundler Gate

Gate 3 — the last gate — of Candidate Qualification: pulls the % of supply held by wallets that bought in the token's creation block, tracks how that share moves over time, and rejects anything over a strict 10–15% ceiling, harder still if the share is rising. Merges what used to be three checkpoints (the provider pull, the trend classification, and the threshold+direction comparison) into the one verdict a candidate/tester actually observes: did the bundler check pass.

## Sub-features

- `pull` queries the pinned chain-analytics provider for the wallets that bought in the token's creation block and their combined supply share.
- `exclude-curve` strips program-owned accounts (the bonding curve) out of that share so it isn't miscounted as a bundler.
- `provider-down` makes the candidate wait on a rate limit or outage — never wave it through with a fabricated number.
- `trend-classify` polls the share over a pinned window and labels it decreasing, stagnating, or increasing — a single snapshot always reads unknown, never a safe label.
- `threshold-rule` rejects anything over 10–15% (below 10% preferred; exactly 15% is the tolerated edge, not a reject).
- `trend-modifier` rejects an increasing share harder than the raw % alone would — low-and-flat-or-falling is the only combination treated as safe.
- `verdict-log` records every verdict — pass or reject — with the %, the trend, and the exact rule that fired.

## How to get to it (user POV)

- Indirect: the %, trend label, underlying readings, and verdict all appear on the candidate's third and final stamp in the candidate view.

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** a candidate reaches this gate having already passed (or bypassed) Virality Gate and passed Narrative Gate — the last checkpoint before Clean.
2. **Mechanism:** `pull` queries the pinned provider, which scans the token's launch transactions for wallets that bought in the same block or near-simultaneously. `exclude-curve` removes the program-owned bonding-curve account from that combined share, since it isn't a buyer. `provider-down` collapses a 429 rate limit and a 5xx outage into the same behavior: the candidate waits, it never gets a zeroed or invented % just to keep moving. `trend-classify` is where this gate does work no single pull can: chain-analytics providers sell single point-in-time snapshots, not a trend, so the bot itself polls the pinned provider on a schedule and diffs the readings over a pinned window to produce a direction label — decreasing, stagnating, or increasing — and a lone reading always reads unknown, because one point can never show direction; this means the trend cannot resolve on a candidate's very first pass through the gate — a candidate arriving soon after its first bundler pull can only produce unknown until enough readings accumulate, which is a genuine timing characteristic of a bot-built trend, not a failure. `threshold-rule` then compares the latest % against the reject ceiling (over 10–15% rejects, below 10% is preferred, exactly 15% is tolerated). `trend-modifier` applies direction on top of that raw number: an increasing share is rejected even when the % alone sits inside the tolerated band, because a rising bundler share means bundlers are gaining control, not losing it — direction is treated as part of the rule, not a footnote. `verdict-log` writes the pass or reject either way with all three numbers attached.
3. **Surface:** the %, the exclusion detail, the trend label with its underlying readings, and the fired rule, all shown together on the candidate view — becoming the candidate record's third stamp and its Clean/Rejected-at-gate-3 close.
4. **Breaks:** provider disagreement (different chain-analytics tools cluster wallets differently — pin one provider and method, never average across tools) · an outage waved through as if a number exists · the stealth-bundling blind spot, where an atomic create-plus-buy reads as many unlinked holders to any provider — a provider limitation, not a pull bug · a single reading labeled as a real trend instead of unknown · a falling % read as unconditionally safe when it can also mean bundlers dumping into demand rather than diluting away · the ceiling treated as advisory ("close enough") · the direction check skipped in favor of the raw % alone — the single most dangerous failure, since a rising share is exactly what this rule exists to catch · a boundary off-by-one (exactly 15% wrongly rejected) · a verdict logged missing the %, trend, or fired rule.

Existence: bundle-percentage pulls with curve exclusion are native to Bubblemaps-style chain-analytics providers today — scanning launch transactions, excluding program-owned accounts, and aggregating a holder share is exactly what these tools already do. Multi-point trend tracking is not off-the-shelf — providers sell snapshots, so tracking a trend over a pinned window has to be bot-built by polling and diffing. Threshold-plus-direction gating on a provider-supplied % is standard comparison logic once both inputs exist.
Deviations from standard: none on the pull mechanics — pinned provider/method, curve exclusion, and wait-not-wave-through on outage all match how production bundle checkers already behave; the stealth-bundling blind spot is a known provider limit, not a design gap. On trend tracking: most public bundle checkers surface only a single point-in-time %, not a tracked trend — this gate's requirement for multiple readings over a pinned window, with an explicit unknown for a lone snapshot, goes beyond typical tooling rigor, not below it. On the threshold itself: public bundler-detection tooling commonly treats 25–40% combined bundler/sniper holdings as only a caution zone (some sniper-filter frameworks use a 30% cutoff) versus this gate's much stricter 10–15% reject ceiling — the gate is deliberately more conservative than public tooling norms, not a bug.

## Test stream

Preconditions:

- Candidate view visible; ProofShot recording; a test token with a known bundler setup and the provider's own dashboard open for side-by-side comparison; a way to block and later restore the provider; four trend test tokens (visibly decreasing, visibly increasing, a single snapshot, and one whose readings wobble slightly around a flat level with no real trend); candidates pinned at %/trend combinations (5% decreasing, 20% decreasing, 12% increasing, and 15% decreasing at the exact ceiling boundary).

1. **Bundler Gate works end to end.** Feed three known candidates — 5% decreasing, 20% decreasing, 12% increasing — through the gate.
   Success: all three verdicts are correct — pass, reject, reject — with the %, trend, and fired rule all visible in the recording.
   Failure: an over-limit or increasing candidate passes — the direction of the rule is broken.
2. **pull.** Run the test token with the known bundler setup and inspect the raw provider query before any % appears.
   Success: the query returns the creation-block wallets from the pinned provider, visible in the candidate view, and the resulting % matches the provider's own dashboard for that token shown side by side.
   Failure: no wallets are returned, the query silently fails, or the displayed % disagrees with the provider's own dashboard.
3. **exclude-curve.** Compare the displayed % against the raw wallet list from the pull.
   Success: the % excludes the program-owned bonding-curve account from the combined supply calculation.
   Failure: the bonding-curve account is counted into the %, inflating it.
4. **provider-down.** Block the provider and run another candidate; then restore the provider and confirm the resumed pull is fresh, not stale.
   Success: the candidate visibly waits and never advances without a number while blocked; once restored, it advances only with a newly pulled %, not a cached number left over from before the outage.
   Failure: the candidate advances while blocked, gets a zeroed/fake % instead of waiting, or resumes with a stale % instead of a fresh pull.
5. **trend-classify.** Feed the decreasing, increasing, single-snapshot, and flat-noisy tokens; open the underlying readings alongside each label.
   Success: decreasing and increasing tokens get the correct directional label with their readings visible, the single-snapshot token shows unknown rather than any real trend, and the flat-noisy token shows stagnating rather than a false directional label.
   Failure: a directional label is flipped, the single-snapshot token gets a real trend label, or the noisy-flat token is read as a genuine trend.
6. **threshold-rule.** Feed 5% decreasing, 20% decreasing, and 15% decreasing (the exact ceiling boundary).
   Success: the log shows pass for 5%, pass for 15% (the boundary is tolerated, not rejected), and reject with rule "over ceiling" for 20%.
   Failure: any of the three verdicts is flipped, or the 15% boundary is rejected as if the ceiling were inclusive of it.
7. **trend-modifier.** Feed 12% increasing.
   Success: the log shows reject with rule "increasing share" even though 12% alone sits inside the tolerated band.
   Failure: the increasing candidate passes at any %.
8. **verdict-log.** Check every verdict logged across the cases above.
   Success: every entry shows the %, the trend, and the fired rule together, whether the verdict was pass or reject.
   Failure: any verdict is missing its %, trend, or rule.

## Gotchas

- The direction check is the one that drifts: an increasing share passing at any % is the critical failure — test it first, not last.
- Verdicts need all three of %, trend, and rule; a verdict missing one is a logging failure even if the pass/reject itself is correct.
- The pull comparison is against the *same* counting method — a different tool's number is expected to disagree; use the pinned provider's own dashboard, not a competitor's.
- A token whose creation block can't be read must flag, not report a clean 0%.
- 429 (rate limit) and 5xx (outage) look different in the logs but must collapse to the same wait-never-fabricate behavior — test both, not just a hard block.
- "Unknown" must not be silently treated as a pass by `threshold-rule` — check that specific hand-off.
- A decreasing % can mean bundlers diluting away (good) or bundlers dumping into retail demand (bad) — the label alone doesn't distinguish the two; that's out of scope for this gate.
- Research note: public bundler-detection tools commonly treat 25–40% combined bundler/sniper holdings as only a caution zone versus this gate's 10–15% ceiling. Tester action: pin the boundary at the gate's own numbers — 15% exactly passes, anything over rejects — never test against the industry 25–40% band.
