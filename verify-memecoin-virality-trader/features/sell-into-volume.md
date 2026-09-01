# Sell-into-volume filter

Exits fill only into buy pressure — green candles with real volume, never into red. A clip that can't fill into volume waits and retries; it is never dumped.

## Sub-features

- `volume-check` qualifies the tape before every exit.
- `green-only` fills only on qualifying candles.
- `wait-visible` shows a pending exit's waiting state while red.

## How to get to it (user POV)

- Indirect: the fill feed and the pending-exit state in the UI.

## Test stream

Preconditions:

- ProofShot recording; chart replay driving the tape; an exit order ready.

1. **Sell-into-volume filter works end to end.** Replay a red window followed by a green window with the exit order ready.
   Success: The exit fills in the green window and visibly holds through the red one — both in the recording.
   Failure: A sell prints on a red candle, or a waiting exit vanishes instead of pending.
2. **volume-check.** Replay a red window and watch the exit order.
   Success: The exit does not fill while the tape is red — the check holds it back.
   Failure: The exit fills against a red or non-qualifying candle.
3. **green-only.** Replay a green-volume window.
   Success: The exit fills exactly on the qualifying green candle.
   Failure: The exit fills on a non-qualifying candle, or fails to fill on the qualifying one.
4. **wait-visible.** Replay a red window and check the pending exit's state.
   Success: The pending exit visibly shows its waiting state for as long as the tape stays red.
   Failure: The waiting exit shows no state, or silently cancels instead of showing pending.

## Gotchas

- One red-candle fill fails the whole feature — the replay log and the fill's candle must both be visible in the recording.
- A waiting exit that silently cancels instead of pending is a failure.
