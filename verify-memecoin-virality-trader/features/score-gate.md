# Combined-score gate

Gate 2: the combined Grok score must be ≥6 with a tweet attached, >8 without one. The branch is chosen by the tweet field alone.

## Sub-features

- `branch` selects tweet vs no-tweet threshold from the candidate.
- `threshold` compares the combined score against the branch's bar.
- `score-reject` logs rejections with score, branch, and threshold.

## How to get to it (user POV)

- Indirect: verdicts appear in the gate log / candidate view.

## Test stream

Preconditions:

- Gate log visible; ProofShot recording; four candidates with pinned scores.

1. **Combined-score gate works end to end.** Feed all four candidates — 6.5 with a tweet, 5 with a tweet, 8.5 without a tweet, 7 without a tweet — through the gate and read the log.
   Success: All four verdicts match the dual rule with the applied threshold visible in the recording.
   Failure: Any verdict contradicts the rule, or the wrong branch was used for a candidate.
2. **branch.** Feed a candidate with a tweet and one without a tweet through the gate.
   Success: The log shows branch "tweet" for the first and branch "no-tweet" for the second, each compared against its own threshold.
   Failure: A candidate is evaluated against the other branch's threshold, or no branch is shown.
3. **threshold.** Feed the boundary scores: 6.5 and 5 with a tweet, 8.5 and 7 without a tweet.
   Success: The log shows pass, reject, pass, reject — matching ≥6 with a tweet and >8 without one.
   Failure: Any score lands on the wrong side of its threshold.
4. **score-reject.** Feed the two reject cases (5 with a tweet, 7 without a tweet) and read the reject log.
   Success: Each reject entry shows the score, the branch, and the threshold that fired.
   Failure: A reject entry is missing the score, branch, or threshold, or the reject isn't logged.

## Gotchas

- The branch comes from the tweet field only — a candidate with an empty-but-present tweet field is a trap; pin the test data precisely.
- 8 exactly without a tweet fails (>8, not ≥8) — include the boundary in a test.
