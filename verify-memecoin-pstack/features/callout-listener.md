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
3. **Delivery:** neither platform ships a first-party callout stream. pump.fun has no official public data API, so a caller's action is captured through a third party: a PumpPortal WebSocket subscription to the tracked account (`wss://pumpportal.fun/api/data`, `subscribeAccountTrade`), an on-chain Solana event stream (Bitquery, Moralis, or a direct RPC), or the coin-page post read directly. FOMO's programmatic path is the third-party `fomoapi.io`, which resolves a trader's handle to their Solana/EVM wallet and serves live trade history plus a realtime WebSocket. Which provider, and whether the free-text callout is captured as a post or inferred from the caller's on-chain buy, is PRE-BUILD until the repo exists.
4. **Extraction:** the parser mechanically pulls the four fields out of the free-text post: coin address, attached tweet, timestamp, source. The validator drops any post missing a field, with the reason logged.
5. **Surface:** a valid callout lands as a normalized candidate in the intake view; a rejected one lands in the reject log with its reason.
6. **Breaks:** the stream drops silently (reconnect must resume without duplicating or skipping) · a field absent in the raw post (must reject, never half-fill) · the same callout arriving twice (must dedupe to one candidate).

Existence: real-time watching is possible for both platforms, but through third-party data providers, not first-party APIs. pump.fun ships no official public data API (the ecosystem runs on aggregators such as PumpPortal, Bitquery, and Moralis); FOMO's trader-callout data is served by the third-party fomoapi.io. The listener is a real stream consumer of one of those providers, nothing simulated. The exact provider and capture path are PRE-BUILD until the app repo exists.
Deviations from standard: the map assumes a per-platform callout feed, but in practice that feed is third-party, and the raw callout as a free-text post is not itself a documented first-party stream on pump.fun. This does not change the spec's four-field candidate; it means the capture path is a provider choice, not a given.

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
- pump.fun has no first-party callout API; real-time capture is third-party (a PumpPortal WebSocket or an on-chain Solana event stream), and FOMO's path is fomoapi.io. Tester action: when grounding the kit against the real repo, confirm the listener reads a real provider stream and that a tracked caller's action produces a candidate. Never assert a native pump.fun callout feed that does not exist.
