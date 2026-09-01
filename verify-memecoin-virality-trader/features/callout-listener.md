# Callout listener + normalizer

Watches the tracked streams and turns each callout into a normalized candidate — coin address, attached tweet, timestamp, source — rejecting malformed callouts at the door.

## Sub-features

- `listen` ingests callouts from tracked streams continuously.
- `normalize` extracts the four required fields.
- `validate` rejects malformed callouts with a logged reason.
- `dedupe` emits exactly one candidate per callout.

## How to get to it (user POV)

- Indirect: post a callout on a tracked stream; the candidate appears in the intake view.

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
