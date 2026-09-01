# AGENTS.md — binding rules for any agent working in this repo

This repo runs **feature map**: stage 2 of Idea Slicer. `maps/<slug>.md` files are the source of truth; the HTML pages are rendered from them by an agent (no robot here). Site: https://tr3-ai.github.io/feature-map/. Everything below is mandatory.

## Layout

- `maps/<slug>.md` — one feature map per idea, source of truth. Slug matches the Idea Slicer slug.
- `verify-<slug>/` — the tester kit: `SKILL.md` (launch/doctor/drive/evidence/cleanup) + `features/` driving recipes, pstack format.
- `<slug>.html` — rendered from `maps/<slug>.md` + `verify-<slug>/` via `node render.js <slug>`. Regenerate the whole file on every update — never patch in place.
- `pages.json` — manifest; new entries go at the TOP (newest first).
- `index.html`, `nav.js`, `template.html`, `render.js` — shared shell + renderer.

## The connection (the whole point)

A feature map born from an Idea Slicer map tracks it (`maps/<slug>.md` in `TR3-AI/idea-slicer`, live page `https://tr3-ai.github.io/idea-slicer/<slug>.html`). When a thought is sliced into an idea over there, the feature map here is updated **in the same turn** — new or changed features only; keep stable features untouched. The rendered page then links back to its Idea Slicer page. A feature map born from pasted source text (PRD, plan, SDD) names that source instead — there is no Idea Slicer page to link back to.

**Every idea also gets its tester kit here, before anything is built:** `verify-<slug>/` (a SKILL.md + `features/` driving map, pstack format), generated from the feature map the moment the map exists. Harness sections a real repo can't ground yet are marked `PRE-BUILD` — the kit is a draft until its first executed proof run. When an app repo exists, the kit is copied into it, grounded against real code, and proven end to end once before it counts. The blueprint page is what Bobby reads; the kit is what the tester agent runs, recorded with ProofShot.

## The rules

1. **Smallest useful feature.** Break features down as small as possible without reducing them so much they stop being features. A portion is still a feature when it does one observable thing for a user or another feature. If splitting removes anything observable, stop.
2. **Anti-over-split.** If two candidate portions can never be triggered, failed, or verified independently, they are one feature.
3. **Three aspects per feature, always.** The feature (what it is + smallest build steps) · the behaviour (states, what can happen to it, variants) · the lifecycle (every trigger point → progression → every end state).
4. **Verification from the user's endpoint, performed by the tester agent.** Checkpoints start at the user surface ("can the button be clicked?") and end at visible proof on a system the user can see (the exchange's open-orders list). The **tester agent** performs every step — never Bobby — inside a **ProofShot** recording session, so the evidence is video/screenshots Bobby can witness. Never backend tests, never a reported "done".
5. **Success and failure parameters, always.** Success = visible proof it works. Failure = the observable gap that proves it does not (click registers, nothing reaches the exchange).
6. **No user-visible checkpoint? Flag it, don't skip it.** Name the surface where proof would appear and mark it as needing a user-endpoint view.
7. **Mobile is the primary screen.** No visual change is done until verified at ~390px as well as desktop.
8. **Contradictions stop the line.** If the source idea map conflicts (thresholds, directions), quote both sides and ask Bobby — never map over a conflict.
9. **Terse chat, rich page.** Plain everyday English; technical terms glossed in a few plain words on first use.
10. **The verification unit: feature + sub-features, tested on build completion.** What gets verified is never a feature ticket — a ticket can be very large. The unit is a built feature plus every one of its sub-features, checked whenever an agent finishes building that feature. A sub-feature is one part of the feature's life cycle: how it works, what it does, every variation it can handle. Stop-loss example: 1) cancel, 2) move price, 3) open-order display on the front end, 4) execution — when price reaches the trigger level the order actually fills; if it just stays open or never triggers, it is not a working stop-loss. A feature counts as "working" only when the feature AND all its sub-features are proven on the front end. The mechanism is the **test stream**: in each kit recipe, the `## Test stream` section carries numbered units — unit 1 proves the feature end to end, then exactly one unit per sub-feature — each stating how to test it plus its own `Success:` and `Failure:` lines. The tester agent must never have to guess how to test something.

## The standard flow (every idea, every time)

Input in — an Idea Slicer link **or** source text pasted straight into the chat (a PRD, a plan, an SDD, or both — command, space, pasted text) → all three artifacts generated **together, in the same turn, before any code exists**:

1. `maps/<slug>.md` — the feature inventory (three aspects per feature).
2. `verify-<slug>/` — the tester kit (pstack-format SKILL.md + `features/` driving recipes).
3. `<slug>.html` — the rendered page, via `node render.js <slug>` (never hand-edit it), merging both.

## The page — structure and identity (Bobby's rulings)

- **Its own visual identity.** Not the Idea Slicer look, ever: engineering-blueprint theme (grid paper, monospace labels, blue feature boxes, teal verification boxes). No purple, no pill cards.
- **Detail is the product.** Every aspect is written out in full — numbered build steps, behaviour bullets, the lifecycle as a trigger→steps→end chain. One-line summaries fail the page.
- **Two linked boxes per feature.** The feature box (header + feature steps + **sub-feature chips** + behaviour + lifecycle flow), a teal connector line with a "verified by" chip, then the verification box below. The connector makes the pairing obvious.
- **The verification box carries the merged pstack recipe:** how to get to it (user POV) · preconditions · the test stream (numbered units: the feature end to end, then one per sub-feature, each with steps + its own success/failure) · gotchas (amber) · feature-level success/failure verdict.
- **One unified page.** No separate kit page — the pstack content is merged into the boxes. The raw kit stays on GitHub for the tester agent (footer link "raw tester kit").

## Publish rhythm

Straight to `main` by Bobby's standing instruction (same as Idea Slicer and ELI5links — overrides the protected-main rule for this repo). The site updates ~1 min after push. Verify with a curl grep on the live URL.
