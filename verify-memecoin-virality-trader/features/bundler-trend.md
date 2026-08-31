# Bundler trend classification

Reads the bundler share over time and labels it decreasing, stagnating, or increasing (0% ideal). A single snapshot classifies as unknown — never as safe.

## Sub-features

- `history` reads the share over the pinned window.
- `label` assigns decreasing / stagnating / increasing.
- `unknown` marks single-snapshot tokens honestly.

## How to get to it (user POV)

- Indirect: the trend label appears on the candidate in the checker view.

## Driving it with the harness

Preconditions:

- Checker view visible; ProofShot recording; three test tokens.

- **Decreasing.** Feed a token whose share visibly falls over the window. The label reads decreasing.
- **Increasing.** Feed a token whose share visibly rises. The label reads increasing.
- **Single snapshot.** Feed a token with one reading. The label reads unknown — not decreasing, not safe.

## Gotchas

- The label must match what the underlying readings visibly show; open the readings in the recording, not just the label.
- "Unknown" must not be treated as a pass by the gate downstream — check the hand-off.
