# Callout listener + normalizer

Watches the tracked streams and turns each callout into a normalized candidate — coin address, attached tweet, timestamp, source — rejecting malformed callouts at the door.

## Sub-features

- `listen` ingests callouts from tracked streams continuously.
- `normalize` extracts the four required fields.
- `validate` rejects malformed callouts with a logged reason.
- `dedupe` emits exactly one candidate per callout.

## How to get to it (user POV)

- Indirect: post a callout on a tracked stream; the candidate appears in the intake view.

## How it works in practice

- The map's sources are two specific platforms, and a "callout" means something different on each. On **pump.fun** (the Solana launchpad) it is an on-chain event: a tracked source launches or trades a token, and the event arrives already structured — mint address, creator wallet, market cap, timestamp.
- pump.fun watching is machine-native: free WebSocket feeds (e.g. PumpPortal's `subscribeNewToken`, no API key) stream every launch and trade in near real time — no polling, no scraping.
- On **FOMO (fomo.family)** — a social trading app — a callout is a followed trader's buy: you track sources (KOLs, leaderboard wallets) and their buys surface in a real-time feed with notifications. No public bot API is documented, so ingestion means notification/feed capture or an unofficial endpoint — the fragile half of the pair, and the part the reconnect and dedupe tests must exercise hardest.
- The "attached tweet" field maps to the token's linked X post (pump.fun tokens can carry social links at creation) — but socials are optional there, so launches without a linked tweet exist in the wild.
- WebSocket streams have no replay cursor: events missed during a drop are simply gone unless the provider replays them. Dedupe keys on the event's own signature (mint + timestamp), matching the map's address+timestamp rule.
- Existence: pump.fun ingestion is native and documented (structured WebSocket events); FOMO ingestion is not publicly documented — its capture path must be proven against the real app once built.
- Deviations from standard: the spec makes the attached tweet a REQUIRED field while pump.fun socials are optional — tweet-less launches will be rejected at intake; flagged as a Research note below (likely deliberate: the virality scorer needs the tweet to score).

## Test stream

Preconditions:

- Test stream connected; intake view visible; ProofShot recording.

1. **Callout listener + normalizer works end to end.** Post a complete test callout on the tracked test stream.
   Success: the good callout shows as a complete candidate with all four fields filled within seconds; a malformed one is visibly rejected with a reason — both in the recording.
   Failure: the callout is posted but no candidate appears, a field is blank, or the malformed callout flows downstream.
2. **listen.** Post a test callout on the connected test stream; then drop and restore the stream connection and post a second one.
   Success: both callouts flow into processing within seconds, the connection recovers on its own, and no candidate is duplicated across the reconnect.
   Failure: the callout is posted but the listener never picks it up, or the reconnect drops or duplicates a callout.
3. **normalize.** Post a complete test callout and inspect the resulting candidate.
   Success: the intake view shows a candidate with all four required fields filled — coin address, attached tweet, timestamp, source.
   Failure: the candidate is missing, or any of the four fields is blank.
4. **validate.** Post two malformed callouts: one with no coin address, another with a garbled address that fails the chain's own format check (wrong length/charset, not merely absent).
   Success: both are rejected, each with a reason specific to its own defect (missing vs invalid-format address); nothing reaches the intake view.
   Failure: either malformed callout produces a candidate anyway, or the reject log doesn't name the specific defect.
5. **dedupe.** Post the same callout twice.
   Success: exactly one candidate exists for the callout.
   Failure: two candidates appear, or the second post is dropped without producing the first.

## Gotchas

- A candidate with a blank field is a failure, not a partial pass.
- The reject log entry must name the reason — a silent drop is not a pass.
- Real callout sources rarely use one fixed template — test with more than the canonical shape (extra slang/commentary around the address), not just a clean textbook callout.
- Research note: pump.fun launch events only optionally carry a linked tweet vs the map's four-required-fields spec, which rejects callouts missing one — likely deliberate (the virality scorer needs the tweet to score), but it means tweet-less launches never become candidates — the map stands.
