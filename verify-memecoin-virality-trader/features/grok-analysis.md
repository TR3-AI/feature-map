# Grok analysis

Gate 2's input: Grok 4.6 extracts narrative, thesis, sentiment, a veracity score, and a virality (attention) score for each qualified candidate — veracity and virality as two separate components.

## Sub-features

- `extract` pulls the five fields from the pinned prompt.
- `two-scores` keeps veracity and virality as separate numbers.
- `api-failure` blocks the candidate on API errors, never auto-passes.

## How to get to it (user POV)

- Indirect: the analysis view shows the fields and scores per candidate.

## Driving it with the harness

Preconditions:

- Analysis view visible; ProofShot recording; a known test coin.

- **Known coin.** Feed the test coin. The analysis view shows all five fields filled.
- **Separate scores.** The same view shows veracity and virality as two distinct numbers, not one merged figure.
- **API down.** Kill the API and feed another candidate. It shows as blocked with the error — it does not advance.

## Gotchas

- The two-score separation is the whole point (ruling #10); a single merged score is a failure even if the number looks sensible.
- A blocked candidate must show *why* — a silent stall is not a pass.
