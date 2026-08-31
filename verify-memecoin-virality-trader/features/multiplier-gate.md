# Age-band multiplier gate

Gate 1: the coin's tweet must beat its baseline by the age-band multiplier — under 1h ≥3x, 1–6h ≥10x, 24h+ ≥50x. Anything outside the bands, including 6–24h, is rejected.

## Sub-features

- `band-select` picks the band from the coin's age.
- `band-check` compares the multiplier against the band threshold.
- `band-reject` logs every rejection with band and reason.

## How to get to it (user POV)

- Indirect: verdicts appear in the gate log / candidate view.

## Driving it with the harness

Preconditions:

- Gate log visible; ProofShot recording; four test candidates with pinned values.

- **Under 1h pass.** Send 4x at 30 minutes. The log shows pass, band "<1h".
- **Mid band reject.** Send 4x at 3 hours. The log shows reject, band "1–6h", reason "below 10x".
- **24h+ pass.** Send 60x at 2 days. The log shows pass, band "24h+".
- **Dead zone.** Send any multiplier at 12 hours. The log shows reject, reason "outside all bands".

## Gotchas

- Boundary values follow the rule exactly (exactly 3x under 1h passes) — test one boundary, not just mid-range values.
- Every verdict needs its reason; a bare pass/reject is a logging failure.
