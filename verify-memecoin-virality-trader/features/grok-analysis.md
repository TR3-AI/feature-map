# Grok analysis

Gate 2's input: Grok 4.6 extracts narrative, thesis, sentiment, a veracity score, and a virality (attention) score for each qualified candidate — veracity and virality as two separate components.

## Sub-features

- `extract` pulls the five fields from the pinned prompt.
- `two-scores` keeps veracity and virality as separate numbers.
- `api-failure` blocks the candidate on API errors, never auto-passes.

## How to get to it (user POV)

- Indirect: the analysis view shows the fields and scores per candidate.

## Test stream

Preconditions:

- Analysis view visible; ProofShot recording; a known test coin.

1. **Grok analysis works end to end.** Feed a known test coin through the Grok call. The analysis view shows all five fields filled — narrative, thesis, sentiment, veracity score, virality score.
   Success: all five fields and both separate scores are visible and correct in the recording.
   Failure: a field is empty, the two scores arrive merged, or an API failure lets the candidate through.
2. **extract.** Feed the test coin and check the analysis view.
   Success: all five fields — narrative, thesis, sentiment, veracity, virality — show filled from the pinned prompt.
   Failure: any field is missing or blank.
3. **two-scores.** Read the same view for the veracity and virality figures.
   Success: veracity and virality show as two distinct numbers.
   Failure: the two scores arrive merged into one figure.
4. **api-failure.** Kill the API and feed a candidate; separately, feed a candidate for which the API returns a 200 response that fails to parse as the expected schema (malformed JSON, a missing field, or a score outside the valid range) — a distinct failure that, in practice, is more common than a dead API.
   Success: both the network failure and the schema-violating response show the candidate as blocked with the error, never advancing.
   Failure: either candidate advances despite the failure, or blocks silently with no error shown.

## Gotchas

- The two-score separation is the whole point (ruling #10); a single merged score is a failure even if the number looks sensible.
- A blocked candidate must show *why* — a silent stall is not a pass.
- A live API can still hand back garbage: a schema-conforming but wrong narrative, or a plausible-looking score outside the valid range, is a distinct failure from a dead API — both must trip the same block, and testing only the killed-API case misses the more common one.
