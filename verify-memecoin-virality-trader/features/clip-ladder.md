# Divergence clip ladder

Each bearish divergence after entry sells a 15–20% clip of the remaining position — moon bag excluded — filled only into green candles with volume. The ladder ends when only the bag remains.

## Sub-features

- `clip-trigger` fires one clip per bearish divergence.
- `clip-size` sizes 15–20% of the remaining position, bag excluded.
- `into-volume` routes every clip through the sell-into-volume filter.
- `ladder-end` stops when only the moon bag remains.

## How to get to it (user POV)

- Indirect: clip fills in the fill feed; the ladder state in the positions view.

## How it works in practice

- Scaling out — exiting a winner in tranches instead of one shot — is standard trade management: it locks in gains progressively while leaving room to keep participating if the move continues, and each tranche resizes off whatever remains, not the original stake.
- Real DEX order sizing weighs price impact against pool depth: a sell that's a large slice of a shallow AMM pool moves price a lot (constant-product curve), so aggregators like Jupiter split big sells across multiple pools/venues to keep any one pool's impact small.
- This map skips that: clip size is a fixed 15–20% of the remaining position (bag excluded) with no price-impact cap or pool-depth check — deliberate, per the file's existing research note.
- The sell-into-volume filter does the impact-management job instead: clips wait for a green, liquid candle rather than routing around thin liquidity, so a clip landing in a candle too thin to absorb it should keep retrying the remainder, not report itself complete or spill into the next red candle.
- Classic failure modes: sizing a clip off the original position instead of the live remainder, letting a repeated signal on one divergence fire two clips, or letting a clip eat into the excluded moon bag.
- Existence: bot-simulated — clip-per-divergence laddering isn't a native exchange feature; it's the bot tracking remaining position state and firing sized market sells keyed to the divergence signal.
- Deviations from standard: deliberate — standard DEX exits cap price impact against pool depth by splitting orders; this map fixes clip size at 15–20% with no price-impact cap, consistent with the file's existing research-note gotcha; the map stands.

## Test stream

Preconditions:

- Devnet position past entry with a flagged bag; ProofShot recording; replay of two bearish divergences.

1. **Divergence clip ladder works end to end.** Replay two bearish divergences on the position and watch the fill feed and positions view.
   Success: Both clips fill at the right size into volume; the bag is intact — all in the recording.
   Failure: A divergence passes with no clip, a clip prints on red, or a clip eats the moon bag.
2. **clip-trigger.** Replay a single bearish divergence.
   Success: exactly one clip fill appears for that one divergence.
   Failure: no clip fires, or more than one clip fires from a single divergence.
3. **clip-size.** Replay two divergences and check each clip's size against the position remaining at that moment, bag excluded.
   Success: each clip is 15–20% of the remaining position at that moment, with the bag excluded from the math.
   Failure: a clip falls outside 15–20%, is sized off the original position instead of the remainder, or eats into the bag.
4. **into-volume.** Replay a divergence during a red, no-volume window, then let a green candle arrive with volume too thin to absorb the whole clip before it dries up again.
   Success: the clip only fills once qualifying volume shows up, and if the first qualifying candle can't absorb the full clip, the remainder keeps waiting/retrying rather than being marked filled or dumped into the next red candle.
   Failure: the clip fills on a red or no-volume candle, or a partially-filled clip is reported as complete or finishes filling into a red/no-volume candle.
5. **ladder-end.** Clip the position down until only the moon bag remains, then replay another divergence.
   Success: no further clip fires once only the bag is left.
   Failure: a clip fires after only the bag remains, eating into it.

## Gotchas

- Clip size is of the *remaining* position at that moment, not the original — check the second clip's math against the first clip's remainder.
- A repeated signal on the same divergence must not double-clip.
- Research note: real DEX exits often cap a single sell's price impact against pool depth (splitting the order if it would move the pool too far) vs the map's fixed 15–20% clip with no price-impact cap — the map stands.
