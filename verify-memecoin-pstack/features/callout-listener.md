# Callout Listener & Normalizer

Watches the tracked streams and turns each callout into a normalized candidate: coin address, attached tweet, timestamp, source. Malformed callouts are rejected at the door.

## Sub-features

- `listen` ingests callouts from tracked streams continuously.
- `normalize` extracts the three required fields (coin address, timestamp, source) and the optional attached tweet.
- `validate` rejects malformed callouts with a logged reason.
- `dedupe` emits exactly one candidate per callout.
- `no-tweet` normalizes a callout that has no tweet, setting the tweet field to null and letting the candidate flow downstream instead of rejecting it.

## How to get to it (user POV)

- Indirect: post a callout on a tracked stream; the candidate appears in the intake view.

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** a tracked source acts on a coin, posting a callout into the platform's feed or coin-page comments (pump.fun or FOMO).
2. **Mechanism:** the platform broadcasts that activity to followers in real time. It appears in the social feed, on the coin page, and as a follow notification.
3. **Delivery:** the exact source and event shape are PRE-BUILD, and the two candidate paths are different things, not one drop-in callout feed. On-chain event streams (PumpPortal `wss://pumpportal.fun/api/data`, Bitquery, Solana Tracker, Codex) surface token creation, migration, and trades by wallet. Those can flag a tracked dev or trader acting on a coin, but they carry no social post and no attached tweet. A social callout source (a pump.fun or FOMO feed, or the third-party fomoapi.io alerts stream) would carry the call itself, but pump.fun has no official API, "FOMO" is ambiguous, and only fomoapi.io has a documented WebSocket. So the callout event shape, especially the attached tweet and the calling source, and the capture path are PRE-BUILD until the product and source are pinned.
4. **Extraction:** the parser pulls the three required fields (coin address, timestamp, source) and the optional attached tweet out of the raw event. The validator drops a post only when a required field is missing, with the reason logged. A post with no tweet is kept, its tweet set to null, and flows on as a no-tweet candidate.
5. **Surface:** a valid callout lands as a normalized candidate in the intake view; a rejected one lands in the reject log with its reason.
6. **Breaks:** the stream drops silently (reconnect must resume without duplicating or skipping) · a required field absent (must reject, never half-fill), while a missing tweet must normalize to a null tweet, not a reject · the same callout arriving twice (must dedupe to one candidate).

Existence: no confirmed drop-in feed carries a pump.fun or FOMO "callout" with an attached tweet. pump.fun offers no official public API (its own terms) and its frontend is behind Cloudflare, so scraping is not a viable standing feed. On-chain streams (PumpPortal and peers) are real and reliable but expose token-creation, migration, and trade events by wallet, not social callout posts or tweets. "FOMO" resolves to three products, and only the third-party fomoapi.io has a documented WebSocket. The listener is a real stream consumer, but the source, the event shape, and the four-field mapping are PRE-BUILD until the repo pins them.
Deviations from standard: the spec reads as if pump.fun and FOMO each expose a native callout feed carrying coin address, attached tweet, timestamp, and source together. No single confirmed feed does. The four fields likely come from more than one source (an on-chain event plus a social or tweet lookup), which the build must assemble. See the PRE-BUILD note below.

## Test stream

Preconditions:

- Test stream connected; intake view visible; ProofShot recording.

1. **Callout Listener & Normalizer works end to end.** Post a complete test callout on the tracked test stream.
   Success: the good callout shows as a complete candidate with its three required fields filled and its tweet present within seconds. A malformed one is visibly rejected with a reason. Both show in the recording.
   Failure: the callout is posted but no candidate appears, a required field is blank, or the malformed callout flows downstream.
2. **listen.** Post a test callout on the connected test stream; then drop and restore the stream connection and post a second one.
   Success: both callouts flow into processing within seconds, the connection recovers on its own, and no candidate is duplicated across the reconnect.
   Failure: the callout is posted but the listener never picks it up, or the reconnect drops or duplicates a callout.
3. **normalize.** Post a complete test callout and inspect the resulting candidate.
   Success: the intake view shows a candidate with the three required fields filled (coin address, timestamp, source) and the tweet present when the callout has one.
   Failure: the candidate is missing, or any required field is blank.
4. **validate.** Post one callout missing a required field (no coin address), one with a garbled address that fails the chain's format check (wrong length or charset, not merely absent), and one missing the timestamp.
   Success: all three are rejected, each with a reason naming its own defect (missing address, invalid-format address, missing timestamp); nothing reaches the intake view.
   Failure: any of them produces a candidate anyway, or the reject log doesn't name the specific defect.
5. **dedupe.** Post the same callout twice.
   Success: exactly one candidate exists for the callout.
   Failure: two candidates appear, or the second post is dropped without producing the first.
6. **no-tweet.** Post a callout with no attached tweet from a tracked source.
   Success: a candidate appears with the tweet field explicitly null (none) and flows on to qualification, reaching Virality Gate's no-tweet bypass, never rejected for the missing tweet.
   Failure: the no-tweet callout is rejected or dropped, or the candidate shows a blank or placeholder tweet instead of an explicit null.

## Gotchas

- A candidate missing a required field (coin address, timestamp, or source) is a failure, not a partial pass. A missing tweet is not a blank field; it is a valid no-tweet candidate with the tweet set to null.
- The reject log entry must name the reason. A silent drop is not a pass.
- Real callout sources rarely use one fixed template. Test with more than the canonical shape, such as extra slang or commentary around the address, not just a clean textbook callout.
- PRE-BUILD: the idea reads as if pump.fun and FOMO each expose a native callout feed delivering coin address, attached tweet, timestamp, and source in one event. Primary sources show no such feed. pump.fun has no official public API (and its frontend is Cloudflare-blocked); the reliable third-party streams (PumpPortal `wss://pumpportal.fun/api/data`, Bitquery, Solana Tracker, Codex) carry on-chain token-creation, migration, and trade events by wallet, not social callout posts or attached tweets; and "FOMO" is three different products (the Fomo app, the FOMO.gg launchpad, and the third-party fomoapi.io API), only the last with a documented WebSocket. Tester action: pin the exact source or sources and the full callout event shape before driving this feature, including where the attached tweet comes from, then test against that real feed or a recorded capture, never a presumed one-shot pump.fun or FOMO callout API.
