# Callout listener + normalizer

Watches the tracked streams and turns each callout into a normalized candidate — coin address, attached tweet, timestamp, source — rejecting malformed callouts at the door.

## Sub-features

- `listen` ingests callouts from tracked streams continuously.
- `normalize` extracts the four required fields.
- `validate` rejects malformed callouts with a logged reason.
- `dedupe` emits exactly one candidate per callout.

## How to get to it (user POV)

- Indirect: post a callout on a tracked stream; the candidate appears in the intake view.

## Driving it with the harness

Preconditions:

- Test stream connected; intake view visible; ProofShot recording.

- **Good callout.** Post a complete test callout. Within seconds the intake view shows a candidate with all four fields filled.
- **Malformed callout.** Post a callout with no coin address. The reject log shows it with the reason; nothing reaches the intake view.
- **Duplicate.** Post the same callout twice. Exactly one candidate exists.

## Gotchas

- A candidate with a blank field is a failure, not a partial pass.
- The reject log entry must name the reason — a silent drop is not a pass.
