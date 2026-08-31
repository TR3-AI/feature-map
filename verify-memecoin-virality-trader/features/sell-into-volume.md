# Sell-into-volume filter

Exits fill only into buy pressure — green candles with real volume, never into red. A clip that can't fill into volume waits and retries; it is never dumped.

## Sub-features

- `volume-check` qualifies the tape before every exit.
- `green-only` fills only on qualifying candles.
- `wait-visible` shows a pending exit's waiting state while red.

## How to get to it (user POV)

- Indirect: the fill feed and the pending-exit state in the UI.

## Driving it with the harness

Preconditions:

- ProofShot recording; chart replay driving the tape; an exit order ready.

- **Green window.** Replay a green-volume window. The exit fills.
- **Red window.** Replay a red window. No fill prints; the exit shows as pending with its waiting state.
- **Recovery.** Follow red with green. The pending exit fills.

## Gotchas

- One red-candle fill fails the whole feature — the replay log and the fill's candle must both be visible in the recording.
- A waiting exit that silently cancels instead of pending is a failure.
