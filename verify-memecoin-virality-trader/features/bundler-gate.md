# Bundler gate

Gate 3: reject anything over 10–15% bundlers (below 10% preferred), harder if the share is increasing. Low is good; rising is bad — the direction is the rule.

## Sub-features

- `limit` enforces the 10–15% ceiling.
- `direction` rejects increasing shares harder.
- `bundle-reject` logs %, trend, and the fired rule per verdict.

## How to get to it (user POV)

- Indirect: verdicts appear in the gate log / candidate view.

## Driving it with the harness

Preconditions:

- Gate log visible; ProofShot recording; three candidates with pinned % and trend.

- **Clean pass.** 5% decreasing. Log shows pass.
- **Over-limit reject.** 20% decreasing. Log shows reject, rule "over 15%".
- **Rising reject.** 12% increasing. Log shows reject, rule "increasing share".

## Gotchas

- The direction check is the one that drifts (Bobby's example): an increasing share passing at any % is the critical failure — test it first.
- Verdicts need all three of %, trend, rule; a verdict missing one is a logging failure.
