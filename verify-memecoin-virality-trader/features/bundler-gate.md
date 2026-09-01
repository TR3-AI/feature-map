# Bundler gate

Gate 3: reject anything over 10–15% bundlers (below 10% preferred), harder if the share is increasing. Low is good; rising is bad — the direction is the rule.

## Sub-features

- `limit` enforces the 10–15% ceiling.
- `direction` rejects increasing shares harder.
- `bundle-reject` logs %, trend, and the fired rule per verdict.

## How to get to it (user POV)

- Indirect: verdicts appear in the gate log / candidate view.

## Test stream

Preconditions:

- Gate log visible; ProofShot recording; three candidates with pinned % and trend.

1. **Bundler gate works end to end.** Feed three known candidates — 5% decreasing, 20% decreasing, 12% increasing — through the gate.
   Success: all three verdicts are correct with full reasons visible in the recording.
   Failure: an over-limit or increasing candidate passes — the direction of the rule is broken.
2. **limit.** Feed 5% decreasing and 20% decreasing.
   Success: the log shows pass for 5% and reject with rule "over 15%" for 20%.
   Failure: either verdict is flipped, or the ceiling isn't enforced at 15%.
3. **direction.** Feed 12% increasing.
   Success: the log shows reject with rule "increasing share" even though the % alone sits in the tolerated band.
   Failure: the increasing candidate passes at any %.
4. **bundle-reject.** Check each of the three verdicts just logged.
   Success: every verdict entry logs %, trend, and the fired rule together.
   Failure: any verdict is missing %, trend, or rule.

## Gotchas

- The direction check is the one that drifts (Bobby's example): an increasing share passing at any % is the critical failure — test it first.
- Verdicts need all three of %, trend, rule; a verdict missing one is a logging failure.
