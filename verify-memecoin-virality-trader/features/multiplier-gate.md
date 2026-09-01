# Age-band multiplier gate

Gate 1: the coin's tweet must beat its baseline by the age-band multiplier — under 1h ≥3x, 1–6h ≥10x, 24h+ ≥50x. Anything outside the bands, including 6–24h, is rejected.

## Sub-features

- `band-select` picks the band from the coin's age.
- `band-check` compares the multiplier against the band threshold.
- `band-reject` logs every rejection with band and reason.

## How to get to it (user POV)

- Indirect: verdicts appear in the gate log / candidate view.

## Test stream

Preconditions:

- Gate log visible; ProofShot recording; four representative test candidates with pinned values (4x/30min, 4x/3h, 60x/2days, any-multiplier/12h); exact-boundary pairs pinned per band — 3x vs 2.9x at 30 minutes, 10x vs 9.9x at 3 hours — plus three candidates aged exactly at the band edges: 1h, 6h, 24h.

1. **Age-band multiplier gate works end to end.** Send four known candidates through the gate — 4x at 30 minutes, 4x at 3 hours, 60x at 2 days, any multiplier at 12 hours.
   Success: the log shows pass, reject, pass, reject — each verdict correct with its band and reason visible in the recording.
   Failure: any candidate passes or rejects against the band rule, or a verdict appears with no reason attached.
2. **band-select.** Send candidates at 30 minutes, 3 hours, and 2 days, one at 12 hours, plus three at the exact band edges — exactly 1h, exactly 6h, exactly 24h old.
   Success: the log shows each candidate assigned to the correct age band (<1h, 1–6h, 24h+), the 12h one flagged outside all bands, and each edge-age candidate lands in the band the rule implies (1h and 6h old fall in 1–6h, 24h old falls in 24h+) — not the neighboring band.
   Failure: a candidate is assigned to the wrong band, or an edge-age candidate slips into the neighboring band — the off-by-one boundary bugs hide in.
3. **band-check.** Send exactly 3x at 30 minutes and 2.9x at 30 minutes; exactly 10x at 3 hours and 9.9x at 3 hours.
   Success: the exact-threshold multiplier passes and the just-under value rejects in both bands — the ≥ boundary holds precisely, not approximately.
   Failure: an exact-threshold value rejects, a just-under value passes, or either boundary is off by even a rounding step.
4. **band-reject.** Send 4x at 3 hours (fails its band's threshold) and any multiplier at 12 hours (falls outside every band).
   Success: the log records each rejection with its band and a reason that names which kind of failure it is — threshold not met vs. no band applies — not one generic "rejected".
   Failure: a rejection appears with no reason, no band recorded, or both rejections carry the same generic reason with no way to tell threshold-miss from out-of-band.

## Gotchas

- Boundary values follow the rule exactly (exactly 3x under 1h passes) — test one boundary, not just mid-range values.
- Every verdict needs its reason; a bare pass/reject is a logging failure.
- Engagement counts keep climbing after the callout — pin the tweet's likes/retweets at the moment you compute the hand-check, or a real (but later) count will make a correct verdict look wrong.
