# Divergence alert

The payload delivered to the UI when a divergence fires: coin, gate scores, which oscillator diverged, freshness — and the fractional Kelly size pre-filled. Once per candidate, never twice.

## Sub-features

- `payload` assembles coin, scores, oscillator, freshness.
- `prefill` attaches the Position manager's Kelly size.
- `once` fires exactly one alert per candidate.

## How to get to it (user POV)

- The alert card in the front-end UI.

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** a candidate passes the gates with a divergence event — one alert payload is assembled with everything pre-attached: coin, gate scores, which oscillator diverged, freshness, pre-filled size.
2. **Mechanism:** the emitter fingerprints the alert on stable identity fields only — the candidate — and fires once; freshness and timestamp never enter the key.
3. **Surface:** exactly one complete card per candidate in the alert list — nothing fills in lazily after the card renders.
4. **Breaks:** a re-trigger differing only by freshness produces a duplicate card (a volatile field leaked into the fingerprint — the classic duplicate-storm cause that trains users to ignore the channel) · a card arriving incomplete and back-filling later.

Existence: a standard event/payload-assembly pattern — no simulation needed; the part actually worth testing is the dedup key design, since "once per candidate" only holds if freshness/timestamp never enters the fingerprint.
Deviations from standard: none — the map's rule that identity is the candidate alone, never freshness, matches standard alert-dedup practice and reinforces the file's existing gotcha on the same point.

## Test stream

Preconditions:

- UI visible at phone width; ProofShot recording; a way to trigger a test divergence end-to-end.

1. **Divergence alert works end to end.** Trigger the test divergence end-to-end and check the alert that arrives in the UI.
   Success: One complete alert arrives — coin, oscillator, freshness, size — and never duplicates.
   Failure: The alert is missing, has empty fields, arrives without a size, or fires twice.
2. **payload.** Trigger the test divergence and read the alert card's fields.
   Success: the alert shows the coin, gate scores, which oscillator diverged, and freshness, all filled in.
   Failure: any of those fields is missing, blank, or wrong.
3. **prefill.** Trigger the test divergence and check the size shown on the alert against the Position manager's fractional Kelly calculation.
   Success: the size in the payload matches the Kelly size, present without needing a refresh.
   Failure: the size is missing, wrong, or only shows up after a refresh.
4. **once.** Trigger the same divergence a second time after enough candles pass that freshness/age would read differently.
   Success: no second alert appears for the same candidate, regardless of how much the freshness value has shifted between triggers.
   Failure: a second alert appears for the same candidate, especially one that differs only by an updated freshness/timestamp value.

## Gotchas

- The size must be present *in the payload* — a size that appears only after a refresh is a wiring failure.
- Freshness must be honest (the divergence's real age), not "just now" forever.
- Freshness/age must never be part of what makes an alert "new" — identity for dedup is the candidate alone; a payload whose only change is an updated freshness value is still the same alert, not a second one.
