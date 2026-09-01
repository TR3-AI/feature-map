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

- pump.fun and FOMO work the SAME way for this feature: both are trading platforms with a social layer on top — a real-time feed plus comments attached to tokens and trades. A callout is a tracked source's activity surfacing there: a post, a comment, a buy, a launch.
- On pump.fun: every coin page carries comments and recent trades, and a real-time social feed, livestreams with chat, and leaderboards push what is moving — the listener watches that stream for tracked source names.
- On FOMO (fomo.family): the feed shows followed traders' buys and sells in real time, with optional written theses attached to trades and comment threads under token charts; following a source triggers notifications on their moves.
- Programmatic access exists on both sides: pump.fun has free WebSocket feeds (e.g. PumpPortal's `subscribeNewToken`), and FOMO has a social-trading data API (fomoapi.io) — the exact capture path gets grounded against the real app once the repo exists.
- Because a callout is a loose social post, not a structured order ticket, the four required fields (coin address, attached tweet, timestamp, source) are extracted from free text — slang, hype, and commentary around the address are the normal shape, not the exception.
- Existence: feed-based callout watching is native to both platforms — same mechanic, two feeds; nothing needs bot-simulation beyond driving test posts through the test stream.
- Deviations from standard: none — research reinforced the spec.

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
