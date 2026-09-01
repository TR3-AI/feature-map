# Fractional Kelly sizer

The entry size, computed by fractional Kelly the moment the alert fires and shown pre-filled — from Bobby's bankroll, win-rate/payoff estimates, and chosen fraction. The Grok score is never an input: Grok decides whether, Kelly decides how much.

## Sub-features

- `compute` runs the fractional Kelly calculation at alert time.
- `prefill` attaches the size to the alert payload.
- `no-grok` guarantees the Grok score never touches the size.
- `missing-inputs` shows an honest empty state instead of guessing.

## How to get to it (user POV)

- The pre-filled size on the alert card in the UI.

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** an alert needs a position size.
2. **Mechanism:** bankroll + win-rate + payoff + chosen fraction → the formula returns a deterministic size; at zero or negative edge (win-rate × payoff at/below break-even) it returns zero or negative — the math correctly saying "don't bet", not an edge case to patch.
3. **Surface:** the pre-filled size on the alert — or the honest empty state (no number) for missing inputs or no edge.
4. **Breaks:** the fraction knob not actually applied (size identical across different fractions — secretly running full Kelly, the dangerous default) · a no-edge input producing a negative or nonsensical size instead of the empty state · unpinned inputs (small win-rate errors swing the size dramatically — pin before hand-checking).

Existence: fractional Kelly is a standard, well-documented sizing formula from quant/betting practice — it exists exactly in the requested format (bankroll, win-rate, payoff, chosen fraction → deterministic size), nothing needs simulation, only a correct implementation.
Deviations from standard: none — research reinforced the spec; treating a zero/negative Kelly result the same as missing inputs (both produce the honest empty state, per the file's own gotcha) is exactly how the formula is meant to be used.

## Test stream

Preconditions:

- ProofShot recording; pinned test inputs (bankroll, win-rate, payoff, fraction); the expected number computed by hand beforehand; a second pinned fraction (e.g. quarter vs half) with the same odds for a scaling check; a pinned no-edge input set (win-rate × payoff at or below break-even) where the Kelly formula itself goes to zero or negative.

1. **Fractional Kelly sizer works end to end.** Fire a test alert with the pinned inputs.
   Success: the alert's pre-filled size equals the hand-computed fractional Kelly number.
   Failure: the size disagrees with the hand check, or the system invents a size when inputs are missing.
2. **compute.** Fire a test alert with the pinned inputs, then fire a second alert with the same odds but the other pinned fraction (e.g. quarter instead of half).
   Success: both sizes match their hand-computed fractional Kelly numbers, and the size scales with the fraction (half-Kelly comes out roughly double quarter-Kelly for the same odds) — proving the fraction is actually applied, not decorative.
   Failure: either result doesn't match its hand check, or the size stays the same across fractions — the sizer is silently running one fixed (possibly full) Kelly regardless of the fraction input.
3. **prefill.** Check the alert card after firing.
   Success: the computed size is attached to the alert payload and shows pre-filled — nothing left for Bobby to type.
   Failure: the alert arrives without a size, or asks Bobby to enter one.
4. **no-grok.** Fire two alerts with identical Kelly inputs but different Grok scores.
   Success: both alerts show identical sizes.
   Failure: the sizes differ because the Grok score leaked into the calculation.
5. **missing-inputs.** Remove the Kelly inputs and fire again; separately, fire an alert with the pinned no-edge input set.
   Success: the alert shows "no size — inputs missing" when inputs are absent, and shows the same honest empty state (never a bet) when the inputs imply no real edge.
   Failure: the alert shows a guessed or default size instead of the honest empty state, or shows a negative or nonsensical size when the Kelly formula returns zero or negative for a no-edge input set.

## Gotchas

- Compute the expected number before the run — never "verify" against whatever the system produced.
- The score-independence check is the one that proves the ruling; don't skip it because the happy path passed.
- Fractional Kelly's whole point is the fraction: a sizer that returns the same number regardless of the chosen fraction is quietly running full Kelly, which real practice treats as dangerously overbet, not just untested.
- A zero or negative Kelly result means "no real edge, don't bet" — that's the same honest-empty-state case as literally-missing inputs, not a separate bug class.
