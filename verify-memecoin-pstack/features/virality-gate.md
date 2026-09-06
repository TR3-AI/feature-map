# Virality Gate

Gate 1 of Candidate Qualification — a tweet-attached candidate must beat its own account's 30-day engagement baseline by a multiplier tied to the coin's age; a candidate with no tweet skips this gate entirely. Merges what used to be two separate checkpoints (the 30-day baseline pull and the age-band multiplier comparison) into the one verdict a candidate/tester actually observes: did virality pass.

## Sub-features

- `baseline` pulls the callout account's last 30 days of tweets via the X API and averages likes + retweets into the number every later comparison is measured against.
- `age-band` picks the band from the coin's age since callout (under 1h / 1–6h / 24h+) and requires the callout tweet's engagement to clear that band's multiplier (≥3x / ≥10x / ≥50x) over the baseline.
- `low-history-flag` fails closed on an account with too little tweet history instead of averaging it into a fake confident number.
- `no-tweet-bypass` skips straight past this gate for a candidate with no attached tweet, still leaving a stamp.
- `verdict-log` records every verdict — pass, reject, or bypass — with the band, multiplier, and baseline behind it.

## How to get to it (user POV)

- Indirect: the verdict, band, multiplier, and baseline all appear on the candidate's first stamp in the candidate view.

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** a freshly created candidate record reaches the front of the gate sequence.
2. **Mechanism:** no tweet attached → the gate bypasses straight to Narrative Gate, stamping a pass-through verdict rather than silently skipping. Tweet attached → `baseline` walks the X API's cursor pages (`next_token`) pulling the account's last 30 days of tweets, pausing and resuming across a 429 rate limit rather than accepting a short/partial page as complete, then averages likes + retweets with a plain arithmetic mean (viral outliers count in full, never trimmed). `low-history-flag` catches an account whose pulled history is too thin to trust — rather than leaving the candidate to average into a misleadingly confident number, or to hang waiting for history that will never arrive, the gate fails closed: insufficient history rejects immediately with that reason named, the same way it would reject a real multiplier miss. `age-band` reads the coin's age since callout, selects the matching band (6–24h and anything else outside the three named bands is a hard reject — no band applies), and requires the callout tweet's own likes + retweets to clear that band's multiplier over the just-computed baseline via a `≥` comparison at the boundary.
3. **Surface:** one verdict — pass, reject, or bypass — shown with its band, multiplier, and baseline together on the candidate view, becoming the candidate record's first stamp.
4. **Breaks:** a rate-limited or short-paged pull treated as a complete 30-day history (the baseline looks confident but is built on partial data) · a thin-history account silently averaged into a number instead of failing closed · band off-by-one at the exact edges (30 minutes vs. 1 hour, 3x vs. 2.9x) · a spike judged by raw degree alone regardless of coin age (the generic multiplier-framework behavior this gate deliberately does not use) · the no-tweet bypass treated as "nothing happens" instead of writing its own stamp, leaving a hole in the candidate's gate history.

Existence: 30-day tweet-history pulls with cursor-based pagination are native to the X API — nothing bot-simulated except forcing a mid-pull rate limit, which has to be induced deliberately for the test. Age-banded engagement-multiplier gating itself is bespoke bot logic with no off-the-shelf equivalent — no social-analytics product ships "spike vs. your own 30-day baseline, scaled by how old the coin is"; this gate is built from a standard data pull but a domain-specific comparison.
Deviations from standard: production engagement baselines commonly use outlier-resistant averaging (trimmed mean, rolling median) to blunt viral-tweet skew — this gate deliberately keeps a plain likes+retweets mean instead; outliers count in full rather than being filtered. Generic virality-detection frameworks flag a spike by degree alone (percentile/z-score/flat multiplier), independent of how old the post is — this gate instead bands the required multiplier by time-since-callout, a domain-specific adaptation for memecoin timing. Neither the old baseline pull nor the old multiplier gate ever named what verdict a low-history flag itself produces; merging the two into one gate forces that gap closed — the merged spec makes fail-closed-on-thin-history an explicit, first-class rule rather than an implied one.

## Test stream

Preconditions:

- Candidate view visible; ProofShot recording; a test account with known 30-day metrics including at least one high-engagement outlier tweet; a thin-history test account; a way to force an X API rate limit mid-pull; four representative candidates (4x/30min, 4x/3h, 60x/2days, any-multiplier/12h); exact-boundary pairs per band (3x vs. 2.9x at 30 minutes, 10x vs. 9.9x at 3 hours) plus three candidates aged exactly at the band edges (1h, 6h, 24h); one no-tweet candidate.

1. **Virality Gate works end to end.** Feed a normal tweet-pass candidate, a normal tweet-reject candidate, a thin-history candidate, and a no-tweet candidate through the gate.
   Success: the candidate view shows pass, reject, reject (insufficient-history), and bypass respectively, each with its reason and supporting numbers visible in the recording.
   Failure: any of the four verdicts is wrong, missing its reason, or the thin-history/no-tweet cases are treated identically to a normal reject or pass.
2. **baseline.** Feed the known test account and inspect the raw pull before any average appears; separately, force a rate limit partway through a second pull.
   Success: the full 30-day history is visible as the pull's raw output with the outlier tweet's numbers folded into the mean untouched, and the rate-limited pull visibly pauses and resumes rather than completing early on a partial page.
   Failure: the average is computed before the pull completes, the outlier is silently excluded, or the rate-limited pull returns a truncated history without visibly pausing.
3. **age-band.** Send candidates at 30 minutes, 3 hours, and 2 days, one at 12 hours, three at the exact band edges (1h, 6h, 24h), plus the exact-threshold/just-under pairs (3x/2.9x at 30 min, 10x/9.9x at 3h).
   Success: each candidate lands in the correct band (edge-age candidates fall into the band the rule implies, not the neighboring one), the 12-hour candidate is flagged outside all bands, and the exact-threshold multipliers pass while the just-under values reject in both bands tested.
   Failure: a candidate lands in the wrong band, an edge-age candidate slips into the neighboring band, or any boundary multiplier lands on the wrong side of its threshold.
4. **low-history-flag.** Feed the thin-history test account.
   Success: the gate rejects immediately with a reason naming insufficient history — never a confident number, and never an indefinite wait.
   Failure: the account gets a baseline number and a normal verdict, or the candidate hangs with no verdict at all.
5. **no-tweet-bypass.** Feed the no-tweet candidate.
   Success: the candidate view shows this gate's own bypass stamp (band/multiplier fields empty or marked not-applicable) and the candidate proceeds straight to Narrative Gate.
   Failure: the candidate shows no stamp at all for this gate, or it is blocked here waiting for a tweet that will never arrive.
6. **verdict-log.** Check the log entries produced by every case above.
   Success: every verdict — pass, reject, or bypass — carries its band, multiplier, and baseline (where applicable) together, never a bare pass/reject.
   Failure: any verdict is missing its supporting numbers or reason.

## Gotchas

- Boundary values follow the rule exactly (exactly 3x under 1h passes) — test the boundary itself, not just mid-range values.
- Engagement counts keep climbing after the callout — pin the tweet's likes/retweets at the moment you compute the hand-check, or a real but later count will make a correct verdict look wrong.
- A partial X API pull must wait and resume, never score off a partial page.
- The no-tweet bypass must still leave a stamp — a "skip" with no gate-history entry breaks the candidate record's invariant that a Clean candidate always shows exactly three stamps.
- Research note: production baselines commonly use trimmed-mean/rolling-median averaging, and generic virality frameworks flag by degree alone regardless of age — this gate deliberately does neither. Tester action: don't "fix" the plain-mean outlier handling or expect degree-only flagging; both are deliberate deviations — pin the map's own numbers and bands.
