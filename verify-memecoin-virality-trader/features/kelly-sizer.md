# Fractional Kelly sizer

The entry size, computed by fractional Kelly the moment the alert fires and shown pre-filled — from Bobby's bankroll, win-rate/payoff estimates, and chosen fraction. The Grok score is never an input: Grok decides whether, Kelly decides how much.

## Sub-features

- `compute` runs the fractional Kelly calculation at alert time.
- `prefill` attaches the size to the alert payload.
- `no-grok` guarantees the Grok score never touches the size.
- `missing-inputs` shows an honest empty state instead of guessing.

## How to get to it (user POV)

- The pre-filled size on the alert card in the UI.

## Driving it with the harness

Preconditions:

- ProofShot recording; pinned test inputs (bankroll, win-rate, payoff, fraction); the expected number computed by hand beforehand.

- **Known inputs.** Fire a test alert. The pre-filled size matches the hand-computed fractional Kelly number.
- **Missing inputs.** Remove the inputs and fire again. The alert shows "no size — inputs missing", not a guess.
- **Score independence.** Fire two alerts with identical inputs but different Grok scores. Identical sizes.

## Gotchas

- Compute the expected number before the run — never "verify" against whatever the system produced.
- The score-independence check is the one that proves the ruling; don't skip it because the happy path passed.
