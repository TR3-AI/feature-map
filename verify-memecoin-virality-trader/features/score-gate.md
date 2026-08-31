# Combined-score gate

Gate 2: the combined Grok score must be ≥6 with a tweet attached, >8 without one. The branch is chosen by the tweet field alone.

## Sub-features

- `branch` selects tweet vs no-tweet threshold from the candidate.
- `threshold` compares the combined score against the branch's bar.
- `score-reject` logs rejections with score, branch, and threshold.

## How to get to it (user POV)

- Indirect: verdicts appear in the gate log / candidate view.

## Driving it with the harness

Preconditions:

- Gate log visible; ProofShot recording; four candidates with pinned scores.

- **Tweet pass.** Score 6.5 with a tweet. Log shows pass at the ≥6 threshold.
- **Tweet reject.** Score 5 with a tweet. Log shows reject, branch "tweet".
- **No-tweet pass.** Score 8.5 without a tweet. Log shows pass at the >8 threshold.
- **No-tweet reject.** Score 7 without a tweet. Log shows reject, branch "no-tweet".

## Gotchas

- The branch comes from the tweet field only — a candidate with an empty-but-present tweet field is a trap; pin the test data precisely.
- 8 exactly without a tweet fails (>8, not ≥8) — include the boundary in a test.
