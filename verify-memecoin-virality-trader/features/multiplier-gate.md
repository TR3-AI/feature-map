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

- Gate log visible; ProofShot recording; four test candidates with pinned values.

1. **Age-band multiplier gate works end to end.** Send four known candidates through the gate — 4x at 30 minutes, 4x at 3 hours, 60x at 2 days, any multiplier at 12 hours.
   Success: the log shows pass, reject, pass, reject — each verdict correct with its band and reason visible in the recording.
   Failure: any candidate passes or rejects against the band rule, or a verdict appears with no reason attached.
2. **band-select.** Send candidates at 30 minutes, 3 hours, and 2 days, plus one at 12 hours.
   Success: the log shows each candidate assigned to the correct age band (<1h, 1–6h, 24h+), and the 12h one flagged outside all bands.
   Failure: a candidate is assigned to the wrong band.
3. **band-check.** Send 4x at 30 minutes and 4x at 3 hours.
   Success: the verdicts match each band's threshold — pass for ≥3x under 1h, reject for below 10x in 1–6h.
   Failure: a candidate passes or rejects against its band's threshold rule.
4. **band-reject.** Send 4x at 3 hours and any multiplier at 12 hours.
   Success: the log records each rejection with its band and the specific reason.
   Failure: a rejection appears with no reason, or no band recorded.

## Gotchas

- Boundary values follow the rule exactly (exactly 3x under 1h passes) — test one boundary, not just mid-range values.
- Every verdict needs its reason; a bare pass/reject is a logging failure.
