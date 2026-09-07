# Divergence Watcher

Watches a clean candidate's chart from the call-out moment for an OBV or RSI divergence. Either oscillator qualifies; both together is the stronger version. Chart patterns (descending triangle, pennant) are parked; divergence only.

## Sub-features

- `anchor` starts every watch at the call-out price and time.
- `detect` spots divergence on OBV, RSI, or both (strength recorded).
- `handoff` passes a spotted divergence to the Divergence Alert.

## How to get to it (user POV)

- Indirect: a spotted divergence becomes the alert in the Trader Console; the watch state is visible in the trigger view.

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** a clean candidate arrives from the Bundler Gate with call-out time and price pinned; each new candle closes on the chart feed after that.
2. **Mechanism:** the watcher compares price structure against the oscillator for regular divergence only: price sets a new extreme the OBV/RSI fails to confirm. The comparison runs strictly on closed candles, because a pivot can't be confirmed until bars form after it.
3. **Surface:** a confirmed divergence flag handed downstream to the Divergence Alert; provisional mid-candle reads never leave the watcher.
4. **Breaks:** repainting, a flag that appears mid-formation then shifts or vanishes once the candle closes · hidden divergence (a continuation signal during a pullback) mistaken for the regular case, the opposite-meaning signal.

Existence: bot-simulated, and more so than the map implies. No named Solana chart API (Dexscreener, Birdeye, GeckoTerminal, Helius) returns OBV or RSI. They return OHLCV candles only. So the bot computes OBV and RSI itself from the candles, then detects divergence candle by candle. That is exactly why the confirmed-versus-repainting distinction has to be built and verified deliberately, never trusted from an off-the-shelf indicator.
Deviations from standard: the map's "regular divergence only, confirmed on closed candles" logic matches standard TA practice. The one clarification is the feed. The pinned provider supplies OHLCV candles, not OBV/RSI, so both oscillators are the bot's own computation. See the research note below.

## Test stream

Preconditions:

- Trigger view visible; ProofShot recording; chart replay loaded with a clean candidate carrying a pinned call-out price and time.

1. **Divergence Watcher works end to end.** Replay a chart with a known OBV divergence, then a clean chart with no divergence.
   Success: The known divergence is caught and named; the clean replay stays quiet. Both are visible in the recording.
   Failure: The known divergence is missed, or a flat chart produces a signal.
2. **anchor.** Replay a chart from a known call-out price and time, and check where the watch starts.
   Success: the watch's starting price and time match the call-out's price and time exactly.
   Failure: the watch starts from a different price or time than the call-out.
3. **detect.** Replay the chart with the known OBV divergence candle by candle, watching the flag both while the pivot candle is still forming and after it closes.
   Success: the flag names the correct oscillator that diverged, with its strength recorded, and only confirms once the pivot candle closes. No flag flip or vanish on the still-forming candle.
   Failure: the wrong oscillator is named, the strength is missing or wrong, or the flag fires (or changes) on an unclosed candle and repaints once it closes.
4. **handoff.** After the known divergence is detected, check the Trader Console.
   Success: the detected divergence produces a divergence alert in the Trader Console.
   Failure: the divergence is detected but no alert ever appears downstream.

## Gotchas

- The anchor is the call-out price. A divergence measured from the wrong anchor is a false pass; verify the anchor in the recording.
- Deterministic: the same replay must give the same result on a second run.
- Divergence built on an unconfirmed (still-forming) pivot candle can repaint. The flag appears, then silently vanishes or changes once the candle closes; that's a distinct failure mode from run-to-run drift, and the replay-twice check alone doesn't catch it.
- This is "regular" divergence (price extreme not confirmed by the oscillator) in standard TA terms, not "hidden" divergence (a continuation signal that reads the opposite way). Confirm test fixtures use the regular case the spec calls for.
- Research note: the map lists the chart feed as supplying "OHLC + OBV + RSI," but primary API docs show Dexscreener, Birdeye, GeckoTerminal, and Helius return OHLCV candles only, with no OBV or RSI. Tester action: verify the bot's own OBV and RSI math against a known reference series first (a fixed candle set with hand-checked oscillator values), then test divergence on top. Do not assume the provider's numbers, because the provider does not send any.
