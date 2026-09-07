# Callout Listener & Normalizer

Watches the tracked streams and turns each callout into a normalized candidate: coin address, attached tweet, timestamp, source. Malformed callouts are rejected at the door.

## Sub-features

- `listen` ingests callouts from tracked streams continuously.
- `normalize` extracts the four required fields.
- `validate` rejects malformed callouts with a logged reason.
- `dedupe` emits exactly one candidate per callout.

## How to get to it (user POV)

- Indirect: post a callout on a tracked stream; the candidate appears in the intake view.

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** a tracked source acts on a coin, posting a callout into the platform's feed or coin-page comments (pump.fun or FOMO).
2. **Mechanism:** the platform broadcasts that activity to followers in real time. It appears in the social feed, on the coin page, and as a follow notification.
3. **Delivery:** the exact source and event shape are PRE-BUILD, and the two candidate paths are different things, not one drop-in callout feed. On-chain event streams (PumpPortal `wss://pumpportal.fun/api/data`, Bitquery, Solana Tracker, Codex) surface token creation, migration, and trades by wallet. Those can flag a tracked dev or trader acting on a coin, but they carry no social post and no attached tweet. A social callout source (a pump.fun or FOMO feed, or the third-party fomoapi.io alerts stream) would carry the call itself, but pump.fun has no official API, "FOMO" is ambiguous, and only fomoapi.io has a documented WebSocket. So the callout event shape, especially the attached tweet and the calling source, and the capture path are PRE-BUILD until the product and source are pinned.
4. **Extraction:** the parser mechanically pulls the four fields out of the free-text post: coin address, attached tweet, timestamp, source. The validator drops any post missing a field, with the reason logged.
5. **Surface:** a valid callout lands as a normalized candidate in the intake view; a rejected one lands in the reject log with its reason.
6. **Breaks:** the stream drops silently (reconnect must resume without duplicating or skipping) · a field absent in the raw post (must reject, never half-fill) · the same callout arriving twice (must dedupe to one candidate).

Existence: no confirmed drop-in feed carries a pump.fun or FOMO "callout" with an attached tweet. pump.fun offers no official public API (its own terms) and its frontend is behind Cloudflare, so scraping is not a viable standing feed. On-chain streams (PumpPortal and peers) are real and reliable but expose token-creation, migration, and trade events by wallet, not social callout posts or tweets. "FOMO" resolves to three products, and only the third-party fomoapi.io has a documented WebSocket. The listener is a real stream consumer, but the source, the event shape, and the four-field mapping are PRE-BUILD until the repo pins them.
Deviations from standard: the spec reads as if pump.fun and FOMO each expose a native callout feed carrying coin address, attached tweet, timestamp, and source together. No single confirmed feed does. The four fields likely come from more than one source (an on-chain event plus a social or tweet lookup), which the build must assemble. See the PRE-BUILD note below.

## Test stream

Preconditions:

- Test stream connected; intake view visible; ProofShot recording.

1. **Callout Listener & Normalizer works end to end.** Post a complete test callout on the tracked test stream.
   Success: the good callout shows as a complete candidate with all four fields filled within seconds. A malformed one is visibly rejected with a reason. Both show in the recording.
   Failure: the callout is posted but no candidate appears, a field is blank, or the malformed callout flows downstream.
2. **listen.** Post a test callout on the connected test stream; then drop and restore the stream connection and post a second one.
   Success: both callouts flow into processing within seconds, the connection recovers on its own, and no candidate is duplicated across the reconnect.
   Failure: the callout is posted but the listener never picks it up, or the reconnect drops or duplicates a callout.
3. **normalize.** Post a complete test callout and inspect the resulting candidate.
   Success: the intake view shows a candidate with all four required fields filled: coin address, attached tweet, timestamp, source.
   Failure: the candidate is missing, or any of the four fields is blank.
4. **validate.** Post two malformed callouts: one with no coin address, another with a garbled address that fails the chain's own format check (wrong length/charset, not merely absent).
   Success: both are rejected, each with a reason specific to its own defect (missing vs invalid-format address); nothing reaches the intake view.
   Failure: either malformed callout produces a candidate anyway, or the reject log doesn't name the specific defect.
5. **dedupe.** Post the same callout twice.
   Success: exactly one candidate exists for the callout.
   Failure: two candidates appear, or the second post is dropped without producing the first.

## Gotchas

- A candidate with a blank field is a failure, not a partial pass.
- The reject log entry must name the reason. A silent drop is not a pass.
- Real callout sources rarely use one fixed template. Test with more than the canonical shape, such as extra slang or commentary around the address, not just a clean textbook callout.
- PRE-BUILD: the idea reads as if pump.fun and FOMO each expose a native callout feed delivering coin address, attached tweet, timestamp, and source in one event. Primary sources show no such feed. pump.fun has no official public API (and its frontend is Cloudflare-blocked); the reliable third-party streams (PumpPortal `wss://pumpportal.fun/api/data`, Bitquery, Solana Tracker, Codex) carry on-chain token-creation, migration, and trade events by wallet, not social callout posts or attached tweets; and "FOMO" is three different products (the Fomo app, the FOMO.gg launchpad, and the third-party fomoapi.io API), only the last with a documented WebSocket. Tester action: pin the exact source or sources and the full callout event shape before driving this feature, including where the attached tweet comes from, then test against that real feed or a recorded capture, never a presumed one-shot pump.fun or FOMO callout API.
