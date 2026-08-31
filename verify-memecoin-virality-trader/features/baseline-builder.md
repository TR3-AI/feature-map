# 30-day baseline builder

Pulls the callout account's last 30 days of tweets and averages likes + retweets into the baseline number every later judgement is measured against.

## Sub-features

- `pull` fetches the 30-day tweet history via the X API.
- `average` computes the baseline from likes + retweets.
- `thin-history` flags accounts with too little history instead of inventing a number.

## How to get to it (user POV)

- Indirect: the baseline appears on the candidate in the scorer view.

## Driving it with the harness

Preconditions:

- Scorer view visible; ProofShot recording; a test account whose metrics are known beforehand.

- **Known account.** Feed the test account. The baseline on screen matches the average computed by hand beforehand.
- **Thin account.** Feed an account with almost no history. The view shows the low-history flag, not a confident number.

## Gotchas

- Compute the expected average before the run; checking afterwards invites rationalizing.
- A partial pull (rate limit) must wait, not score with half the data.
