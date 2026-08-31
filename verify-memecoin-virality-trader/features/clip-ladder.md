# Divergence clip ladder

Each bearish divergence after entry sells a 15–20% clip of the remaining position — moon bag excluded — filled only into green candles with volume. The ladder ends when only the bag remains.

## Sub-features

- `clip-trigger` fires one clip per bearish divergence.
- `clip-size` sizes 15–20% of the remaining position, bag excluded.
- `into-volume` routes every clip through the sell-into-volume filter.
- `ladder-end` stops when only the moon bag remains.

## How to get to it (user POV)

- Indirect: clip fills in the fill feed; the ladder state in the positions view.

## Driving it with the harness

Preconditions:

- Devnet position past entry with a flagged bag; ProofShot recording; replay of two bearish divergences.

- **Two clips.** Replay two divergences. Two clip fills appear, each 15–20% of the then-remaining position.
- **Green only.** Both clips fill on green candles with volume — the candle is visible in the recording.
- **Bag intact.** After both clips, the moon bag is exactly as flagged.
- **Ladder ends.** Clip until only the bag remains. No further clips fire.

## Gotchas

- Clip size is of the *remaining* position at that moment, not the original — check the second clip's math against the first clip's remainder.
- A repeated signal on the same divergence must not double-clip.
