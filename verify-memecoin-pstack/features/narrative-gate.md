# Narrative Gate

Gate 2 of Candidate Qualification. Grok 4.6 extracts a narrative, thesis, sentiment, and two separate scores (veracity, virality) for every candidate that reaches this gate, then a combined score is compared against a threshold that shifts depending on whether the candidate has an attached tweet. Merges what used to be two checkpoints (the Grok call and the combined-score comparison) into the one verdict a candidate/tester actually observes: did narrative pass.

## Sub-features

- `extract` pulls the five fields, narrative, thesis, sentiment, veracity score, virality score, from the pinned Grok 4.6 prompt.
- `two-scores` keeps veracity and virality as two separate numbers, never merged or renamed into each other.
- `api-failure` fails closed on any Grok error, including a schema-valid response with the wrong shape or values.
- `branch` selects the tweet vs. no-tweet threshold from the candidate's tweet field alone.
- `threshold` compares the combined score against the selected branch's bar (≥6 with a tweet, >8 without).
- `verdict-log` logs every verdict, whether pass or reject, with the score, branch, and threshold together.

## How to get to it (user POV)

- Indirect: the extracted fields, both scores, the branch, and the verdict all appear on the candidate's second stamp in the candidate view.

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** a candidate reaches this gate from Virality Gate, having either passed there with a tweet attached or bypassed there with no tweet attached.
2. **Mechanism:** `extract` sends the candidate's data through the pinned, versioned prompt to Grok 4.6 with structured-output/JSON-mode enforcement, forcing the response into the five-field shape. `api-failure` layers an app-side schema validator on top of that structured output, checking that required fields are present and that veracity and virality are two distinct in-range numbers, with a bounded retry before a hard fail. A dead API and a clean 200 that fails schema validation (valid JSON, wrong shape) both trip the same fail-closed block, and so does a schema-valid response whose values are simply implausible (a fabricated-but-well-formed narrative or an out-of-range score). `two-scores` keeps veracity (is the narrative real) and virality (is it getting attention, via X search) as separate fields all the way through extraction. They are never combined until the next step. `branch` reads the candidate's tweet field to pick a bar: present and non-empty selects the tweet branch (≥6); absent or present-but-empty both select the no-tweet branch (>8). The tweet field is the only input to this choice. `threshold` combines the two scores with the pinned formula into one number and compares it against the selected branch's bar with the correct operator (`≥` for the tweet branch, strict `>` for the no-tweet branch). `verdict-log` writes the verdict either way.
3. **Surface:** the five extracted fields, the two separate scores, the branch, the threshold, and the verdict all shown together on the candidate view, becoming the candidate record's second stamp.
4. **Breaks:** fail-open on a dead API or on a schema-violating 200 waved through as if scored. The schema-valid-but-wrong-shape case is the more common and more dangerous of the two because it looks like a normal response · the two scores silently merged into one figure at any point, even if the resulting number looks sensible · the wrong branch applied because an empty-but-present tweet field is mistaken for a real tweet · a verdict logged with no score, branch, or threshold attached · unbounded retry, or a silent pass on the final retry attempt.

Existence: prompt → LLM call → schema-validated JSON is standard, off-the-shelf tooling today. Structured outputs / JSON mode plus an app-side validator exist directly, nothing here needs bot-simulation beyond forcing the two failure shapes for the test. Combining scored inputs into one number and gating it against a calibrated, context-shifted bar with a logged verdict is a standard trading risk-gate pattern. The virality (attention) score depends on Grok's live X access. As of 2026-09-07 that path is the server-side `x_search` tool on the xAI Responses API (`/v1/responses`), with extraction pinned by `response_format` `json_schema` (strict). xAI retired the legacy Live Search `search_parameters` path on 2026-01-12, and it now returns 410 Gone, so a build wired to the old path fails at the source rather than at the schema check. The exact call path stays PRE-BUILD until the repo exists.
Deviations from standard: none on either merged half. Research reinforced both specs. The dual-threshold/branch design matches the fail-closed norm precisely because its own upstream never hands this gate a fabricated or default score: Virality Gate rejects or bypasses-with-a-stamp rather than passing a candidate through with missing data, and a no-tweet candidate arrives here via Virality Gate's own bypass stamp, its tweet field honestly empty, never a placeholder.

## Test stream

Preconditions:

- Candidate view visible; ProofShot recording; a known test coin; four candidates with pinned combined scores (6.5 with a tweet, 5 with a tweet, 8.5 without a tweet, 7 without a tweet); the exact threshold boundary pairs (6.0 and 5.9 with a tweet, 8.0 and 8.01 without a tweet); tweet-field edge cases (a tweet present but empty, and a tweet field absent entirely); a way to kill the API outright and, separately, a way to force a 200 response that fails schema validation (malformed JSON, a missing field, or a score outside its valid range).

1. **Narrative Gate works end to end.** Feed all four pinned-score candidates through the gate and read the verdicts.
   Success: all four verdicts match the dual rule with the applied branch and threshold visible in the recording.
   Failure: any verdict contradicts the rule, or the wrong branch was used for a candidate.
2. **extract.** Feed the known test coin and check the candidate view.
   Success: all five fields, narrative, thesis, sentiment, veracity, virality, show filled from the pinned prompt.
   Failure: any field is missing or blank.
3. **two-scores.** Read the same view for the veracity and virality figures.
   Success: veracity and virality show as two distinct numbers throughout, including after they feed into the combined score.
   Failure: the two scores arrive merged into one figure at any point.
4. **api-failure.** Kill the API and feed a candidate; separately, feed a candidate for which the API returns a 200 that fails schema validation.
   Success: both the network failure and the schema-violating response show the candidate as blocked/rejected with the specific error, never advancing.
   Failure: either candidate advances despite the failure, or blocks silently with no error shown.
5. **branch.** Feed a candidate with a genuine tweet, one with no tweet field at all, and one with a tweet field present but empty.
   Success: the log shows branch "tweet" only for the genuinely non-empty tweet, and branch "no-tweet" for both the absent and the empty-but-present cases.
   Failure: a candidate is evaluated against the wrong branch's threshold, or an empty-but-present tweet field is treated as branch "tweet".
6. **threshold.** Feed the exact boundary scores: 6.0 and 5.9 with a tweet, 8.0 and 8.01 without a tweet.
   Success: the log shows pass, reject, reject, pass. 6.0 passes at ≥6, 5.9 rejects; 8.0 rejects because the no-tweet bar is strictly >8, 8.01 passes.
   Failure: any score lands on the wrong side of its threshold, especially the exact boundary values.
7. **verdict-log.** Read the reject log entries from the two reject cases above.
   Success: each entry shows the score, the branch, and the threshold that fired.
   Failure: any reject entry is missing the score, branch, or threshold, or the reject isn't logged.

## Gotchas

- The two-score separation is the whole point (ruling #10, virality and veracity are both kept, never collapsed into each other); a single merged score is a failure even if the number looks sensible.
- A blocked or rejected candidate must show *why*. A silent stall is not a pass.
- A live API can still hand back garbage: a schema-conforming but fabricated narrative, or a plausible-looking score outside the valid range, is a distinct failure from a dead API. Testing only the killed-API case misses the more common one.
- The branch comes from the tweet field only. An empty-but-present tweet field is a trap; pin the test data precisely.
- 8 exactly without a tweet fails (`>8`, not `≥8`). Include this boundary in every threshold test.
- The virality score's data path moved under the feature. Use the current `x_search` Agent Tool on the xAI Responses API, never the retired Live Search `search_parameters` (410 Gone since 2026-01-12). Tester action: once the repo exists, confirm the X-search call uses the current tool path and returns a non-empty virality score. A 410 or an always-empty virality score means the gate is wired to the dead endpoint.
