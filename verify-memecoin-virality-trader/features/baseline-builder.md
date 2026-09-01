# 30-day baseline builder

Pulls the callout account's last 30 days of tweets and averages likes + retweets into the baseline number every later judgement is measured against.

## Sub-features

- `pull` fetches the 30-day tweet history via the X API.
- `average` computes the baseline from likes + retweets.
- `thin-history` flags accounts with too little history instead of inventing a number.

## How to get to it (user POV)

- Indirect: the baseline appears on the candidate in the scorer view.

## How it works in practice

- Rolling/trailing-window averages (here, 30 days) are the standard way to build a "normal" baseline before judging a new data point against it — recomputed fresh, never reused from a stale window.
- The X API (and similar) returns tweet history in pages behind a cursor (`next_token`); a correct pull follows every page until the cursor is exhausted — stopping at the first short page silently truncates history.
- Rate limits (429s, time-windowed) are a normal part of a real pull; production pulls pause and resume from the same cursor rather than returning a partial page as if it were complete.
- Thin-history handling mirrors real practice: flagging "not enough samples" instead of averaging a handful of tweets into a confident-looking number.
- Existence: 30-day history pulls with cursor-based pagination are native to the X API — nothing here is bot-simulated except forcing the mid-pull rate limit, which has to be induced deliberately for the test.
- Deviations from standard: production engagement baselines often use outlier-resistant averaging (trimmed mean, rolling median) to blunt viral-tweet skew; the map deliberately uses a plain likes+retweets mean instead (see Research note in Gotchas) — the map stands, outliers count in full rather than being filtered.

## Test stream

Preconditions:

- Scorer view visible; ProofShot recording; a test account whose known-beforehand metrics include at least one high-engagement outlier tweet in the window; a way to simulate a rate limit mid-pull.

1. **30-day baseline builder works end to end.** Feed the test account with known metrics through the scorer.
   Success: the displayed baseline equals the real 30-day average, and thin accounts are visibly flagged.
   Failure: no baseline appears, the number disagrees with the hand check, or a thin account gets a confident fake number.
2. **pull.** Feed the test account and inspect the raw pull output before any average appears. Then simulate a rate limit partway through a second pull.
   Success: the full 30-day tweet history for the test account is visibly present as the pull's raw output, and the rate-limited pull visibly pauses and resumes rather than stopping early with a partial page.
   Failure: no history appears, the average is computed before the pull completes or with partial data, or the rate-limited pull returns a truncated history without visibly pausing.
3. **average.** With the pulled history visible — including the outlier tweet — compare the baseline number to the average computed by hand beforehand.
   Success: the baseline on screen matches the hand-computed average, with the outlier tweet's likes/retweets folded into the arithmetic mean (no silent filtering).
   Failure: the number disagrees with the hand check, or the outlier tweet is silently excluded from the average.
4. **thin-history.** Feed an account with almost no tweet history.
   Success: the view shows the low-history flag instead of a number.
   Failure: the account gets a confident baseline number instead of the flag.

## Gotchas

- Compute the expected average before the run; checking afterwards invites rationalizing.
- A partial pull (rate limit) must wait, not score with half the data.
- A pull that stops early because one page came back shorter than the max page size (instead of stopping only when the API's pagination cursor is exhausted) silently under-counts history — check the raw pull's tweet count, not just that some history appeared.
- Research note: production engagement baselines commonly use outlier-resistant averaging (trimmed mean, rolling median) to blunt viral-tweet skew vs the map's plain likes+retweets average — the map stands; test with a viral outlier tweet in the window to confirm it's included, not silently filtered.
