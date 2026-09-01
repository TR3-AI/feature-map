# 30-day baseline builder

Pulls the callout account's last 30 days of tweets and averages likes + retweets into the baseline number every later judgement is measured against.

## Sub-features

- `pull` fetches the 30-day tweet history via the X API.
- `average` computes the baseline from likes + retweets.
- `thin-history` flags accounts with too little history instead of inventing a number.

## How to get to it (user POV)

- Indirect: the baseline appears on the candidate in the scorer view.

## Test stream

Preconditions:

- Scorer view visible; ProofShot recording; a test account whose metrics are known beforehand.

1. **30-day baseline builder works end to end.** Feed the test account with known metrics through the scorer.
   Success: the displayed baseline equals the real 30-day average, and thin accounts are visibly flagged.
   Failure: no baseline appears, the number disagrees with the hand check, or a thin account gets a confident fake number.
2. **pull.** Feed the test account and inspect the raw pull output before any average appears.
   Success: the full 30-day tweet history for the test account is visibly present as the pull's raw output.
   Failure: no history appears, or the average is computed before the pull completes or with partial data.
3. **average.** With the pulled history visible, compare the baseline number to the average computed by hand beforehand.
   Success: the baseline on screen matches the hand-computed average.
   Failure: the number disagrees with the hand check.
4. **thin-history.** Feed an account with almost no tweet history.
   Success: the view shows the low-history flag instead of a number.
   Failure: the account gets a confident baseline number instead of the flag.

## Gotchas

- Compute the expected average before the run; checking afterwards invites rationalizing.
- A partial pull (rate limit) must wait, not score with half the data.
