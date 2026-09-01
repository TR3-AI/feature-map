# Divergence clip ladder

Each bearish divergence after entry sells a 15–20% clip of the remaining position — moon bag excluded — filled only into green candles with volume. The ladder ends when only the bag remains.

## Sub-features

- `clip-trigger` fires one clip per bearish divergence.
- `clip-size` sizes 15–20% of the remaining position, bag excluded.
- `into-volume` routes every clip through the sell-into-volume filter.
- `ladder-end` stops when only the moon bag remains.

## How to get to it (user POV)

- Indirect: clip fills in the fill feed; the ladder state in the positions view.

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
