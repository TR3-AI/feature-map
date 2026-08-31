# Divergence alert

The payload delivered to the UI when a divergence fires: coin, gate scores, which oscillator diverged, freshness — and the fractional Kelly size pre-filled. Once per candidate, never twice.

## Sub-features

- `payload` assembles coin, scores, oscillator, freshness.
- `prefill` attaches the Position manager's Kelly size.
- `once` fires exactly one alert per candidate.

## How to get to it (user POV)

- The alert card in the front-end UI.

## Driving it with the harness

Preconditions:

- UI visible at phone width; ProofShot recording; a way to trigger a test divergence end-to-end.

- **Fire.** Trigger the test divergence. The alert arrives with every field filled, including the pre-filled size.
- **Re-fire.** Trigger the same divergence again. No second alert appears.

## Gotchas

- The size must be present *in the payload* — a size that appears only after a refresh is a wiring failure.
- Freshness must be honest (the divergence's real age), not "just now" forever.
