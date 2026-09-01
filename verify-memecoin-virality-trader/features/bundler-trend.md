# Bundler trend classification

Reads the bundler share over time and labels it decreasing, stagnating, or increasing (0% ideal). A single snapshot classifies as unknown — never as safe.

## Sub-features

- `history` reads the share over the pinned window.
- `label` assigns decreasing / stagnating / increasing.
- `unknown` marks single-snapshot tokens honestly.

## How to get to it (user POV)

- Indirect: the trend label appears on the candidate in the checker view.

## Test stream

Preconditions:

- Checker view visible; ProofShot recording; three test tokens.

1. **Bundler trend classification works end to end.** Feed three test tokens — decreasing, increasing, single snapshot — through the checker.
   Success: both trending tokens get the correct label, and the single-snapshot token shows unknown — all visible in the recording.
   Failure: a rising share is labelled decreasing, or a single snapshot passes as a real trend.
2. **history.** Feed a token with multiple readings over the window and open the underlying readings alongside the label.
   Success: the readings over the pinned window are visible and match what the label is based on.
   Failure: the readings are missing, or only a single reading backs a trend label.
3. **label.** Feed the token whose share visibly falls, and the one whose share visibly rises.
   Success: the label reads decreasing for the falling token and increasing for the rising token.
   Failure: either label is flipped, or reads stagnating when the data clearly moves.
4. **unknown.** Feed the token with one reading.
   Success: the label reads unknown, not decreasing, increasing, or stagnating.
   Failure: the single-reading token gets a real trend label instead of unknown.

## Gotchas

- The label must match what the underlying readings visibly show; open the readings in the recording, not just the label.
- "Unknown" must not be treated as a pass by the gate downstream — check the hand-off.
