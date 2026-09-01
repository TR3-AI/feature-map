# Fractional Kelly sizer

The entry size, computed by fractional Kelly the moment the alert fires and shown pre-filled — from Bobby's bankroll, win-rate/payoff estimates, and chosen fraction. The Grok score is never an input: Grok decides whether, Kelly decides how much.

## Sub-features

- `compute` runs the fractional Kelly calculation at alert time.
- `prefill` attaches the size to the alert payload.
- `no-grok` guarantees the Grok score never touches the size.
- `missing-inputs` shows an honest empty state instead of guessing.

## How to get to it (user POV)

- The pre-filled size on the alert card in the UI.

## Test stream

Preconditions:

- ProofShot recording; pinned test inputs (bankroll, win-rate, payoff, fraction); the expected number computed by hand beforehand.

1. **Fractional Kelly sizer works end to end.** Fire a test alert with the pinned inputs.
   Success: the alert's pre-filled size equals the hand-computed fractional Kelly number.
   Failure: the size disagrees with the hand check, or the system invents a size when inputs are missing.
2. **compute.** Fire a test alert with the pinned inputs.
   Success: the fractional Kelly calculation runs at alert time and produces the hand-computed number.
   Failure: no calculation runs, or the result doesn't match the hand check.
3. **prefill.** Check the alert card after firing.
   Success: the computed size is attached to the alert payload and shows pre-filled — nothing left for Bobby to type.
   Failure: the alert arrives without a size, or asks Bobby to enter one.
4. **no-grok.** Fire two alerts with identical Kelly inputs but different Grok scores.
   Success: both alerts show identical sizes.
   Failure: the sizes differ because the Grok score leaked into the calculation.
5. **missing-inputs.** Remove the Kelly inputs and fire again.
   Success: the alert shows "no size — inputs missing".
   Failure: the alert shows a guessed or default size instead of the honest empty state.

## Gotchas

- Compute the expected number before the run — never "verify" against whatever the system produced.
- The score-independence check is the one that proves the ruling; don't skip it because the happy path passed.
