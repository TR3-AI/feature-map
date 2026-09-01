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

- ProofShot recording; chart replay driving the tape — a genuine green-volume candle, a thin/wash-traded green candle too small to absorb the full clip, and a red window; an exit order ready.

1. **Sell-into-volume filter works end to end.** Replay a red window followed by a green window with the exit order ready.
   Success: The exit fills in the green window and visibly holds through the red one — both in the recording.
   Failure: A sell prints on a red candle, or a waiting exit vanishes instead of pending.
2. **volume-check.** Replay a red window, then a thin/wash-traded green candle sized too small to absorb the full clip, and watch the exit order.
   Success: The exit does not fill while the tape is red, and on the thin candle it fills only what that candle can genuinely absorb — the unfilled remainder keeps waiting instead of forcing through.
   Failure: The exit fills against a red or non-qualifying candle, or the full clip forces through a candle that can't actually absorb it.
3. **green-only.** Replay a genuine green-volume window sized to fully absorb the clip.
   Success: The exit fills exactly on the qualifying green candle, in full.
   Failure: The exit fills on a non-qualifying candle, only partially fills a candle that could have absorbed it in full, or fails to fill on the qualifying one.
4. **wait-visible.** Replay a red window, then flip to a qualifying green candle, and watch the pending exit's state throughout.
   Success: The pending exit visibly shows its waiting state for as long as the tape stays red, then fires on its own the moment a qualifying candle appears — no manual nudge needed.
   Failure: The waiting exit shows no state, silently cancels instead of showing pending, or needs a manual retry to fire once the tape turns green.

## Gotchas

- One red-candle fill fails the whole feature — the replay log and the fill's candle must both be visible in the recording.
- A waiting exit that silently cancels instead of pending is a failure.
- A green candle can carry wash-traded or self-crossed volume (same price, same size, round-tripped) that reads as buy pressure on a naive check but offers no real fillable depth — test data should include one such candle distinct from a genuine one, and it must not fully absorb the clip.
