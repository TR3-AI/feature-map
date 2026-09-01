# Sell-into-volume filter

Exits fill only into buy pressure — green candles with real volume, never into red. A clip that can't fill into volume waits and retries; it is never dumped.

## Sub-features

- `volume-check` qualifies the tape before every exit.
- `green-only` fills only on qualifying candles.
- `wait-visible` shows a pending exit's waiting state while red.

## How to get to it (user POV)

- Indirect: the fill feed and the pending-exit state in the UI.

## How it works in practice

- Selling into volume is a form of participation-based execution (like VWAP/POV algos): instead of dumping full size immediately, the order fills only against candles/prints that show real buy-side participation, slicing into whatever the tape can genuinely absorb.
- Wash trading (same price, same size, rapid buy/sell round-trips between related wallets) is a known manipulation pattern in illiquid/crypto markets used specifically to fake buy pressure — detection compares trade pairs on price + size + a tight time window between the same or clustered wallets, since organic volume doesn't round-trip that cleanly.
- The classic failure mode for naive "green candle = sell here" logic is trusting candle color/volume totals without checking whether that volume is real, fillable depth — a candle can be green and "high volume" purely from wash trades with zero actual buyers waiting.
- The standard mitigation for thin liquidity is order fragmentation: fill only what the current print can absorb and retry the remainder on the next qualifying print rather than forcing the whole clip through — this matches the ladder's "wait and retry" behavior here.
- Existence: bot-simulated — no venue has a native "sell into green candles only" order type; this is a pre-trade check plus a retry loop wrapped around ordinary exit orders, so testing has to drive the underlying tape (replay) rather than relying on any exchange feature.
- Deviations from standard: none — research reinforced the spec. Treating wash-traded volume as non-qualifying (instead of trusting raw candle volume) is exactly the gap naive volume checks have in practice, and the map already specs this via the `volume-check` sub-feature and its wash-trade gotcha.

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
