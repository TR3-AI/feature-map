# Combined-score gate

Gate 2: the combined Grok score must be ≥6 with a tweet attached, >8 without one. The branch is chosen by the tweet field alone.

## Sub-features

- `branch` selects tweet vs no-tweet threshold from the candidate.
- `threshold` compares the combined score against the branch's bar.
- `score-reject` logs rejections with score, branch, and threshold.

## How to get to it (user POV)

- Indirect: verdicts appear in the gate log / candidate view.

## How it works in practice

- Weighted/multi-factor scoring gates combine several signal inputs into one number and compare it to a calibrated bar — weak signals below the bar get discarded before they can trigger a trade.
- The core design fork is fail-open vs fail-closed: when a gate can't produce a trustworthy score (an input is missing, an upstream API is down), does it block the trade (fail-closed) or wave it through anyway (fail-open)? Production trading risk gates default to fail-closed — uncertain state means "no trade," not "trade anyway."
- Thresholds are commonly context-dependent rather than one flat number — the bar shifts based on a corroborating signal (here: whether a tweet is attached), similar to how a classifier's confidence can shift a stop-loss threshold.
- A reject log (score, threshold, which branch fired) is what makes a scoring gate auditable instead of a black box — without it nobody can tell whether a specific reject was a bug or a correct call.
- Existence: this is a standard trading risk-gate pattern — combine inputs, compare to a pinned bar, log the verdict. Nothing needs bot-simulation; only the specific dual-threshold numbers and branch rule are bespoke to this map.
- Deviations from standard: none — research reinforced the spec. The dual-threshold/branch design matches the fail-closed norm: this gate's own upstream (Grok analysis) blocks candidates rather than passing them when its API is unavailable, so a candidate never reaches this gate with a fabricated or default score.

## Test stream

Preconditions:

- Gate log visible; ProofShot recording; candidates with pinned scores, including the exact threshold boundaries (6.0 with a tweet, 8.0 without one) and tweet-field edge cases (a tweet present but empty, and a tweet field absent entirely).

1. **Combined-score gate works end to end.** Feed all four candidates — 6.5 with a tweet, 5 with a tweet, 8.5 without a tweet, 7 without a tweet — through the gate and read the log.
   Success: All four verdicts match the dual rule with the applied threshold visible in the recording.
   Failure: Any verdict contradicts the rule, or the wrong branch was used for a candidate.
2. **branch.** Feed a candidate with a tweet, one with no tweet field at all, and one with a tweet field present but empty.
   Success: The log shows branch "tweet" only for the genuinely non-empty tweet, and branch "no-tweet" for both the absent and the empty-but-present cases, each compared against the no-tweet threshold.
   Failure: A candidate is evaluated against the wrong branch's threshold, no branch is shown, or an empty-but-present tweet field is treated as branch "tweet".
3. **threshold.** Feed the exact boundary scores: 6.0 and 5.9 with a tweet, 8.0 and 8.01 without a tweet.
   Success: The log shows pass, reject, reject, pass — 6.0 with a tweet passes (≥6) and 5.9 rejects; 8.0 without a tweet rejects (>8, not ≥8) and 8.01 passes.
   Failure: Any score lands on the wrong side of its threshold, especially the exact boundary values themselves.
4. **score-reject.** Feed the two reject cases (5.9 with a tweet, 8.0 without a tweet) and read the reject log.
   Success: Each reject entry shows the score, the branch, and the threshold that fired.
   Failure: A reject entry is missing the score, branch, or threshold, or the reject isn't logged.

## Gotchas

- The branch comes from the tweet field only — a candidate with an empty-but-present tweet field is a trap; pin the test data precisely.
- 8 exactly without a tweet fails (>8, not ≥8) — include the boundary in a test.
