# AGENTS.md — binding rules for any agent working in this repo

This repo runs **feature-map**: stage 2 of idea-slicer. `maps/<slug>.md` files are the source of truth; the HTML pages are rendered from them by an agent (no robot here). Site: https://tr3-ai.github.io/feature-map/. Everything below is mandatory.

## Layout

- `maps/<slug>.md` — one feature map per idea, source of truth. Slug matches the idea-slicer slug.
- `<slug>.html` — rendered from `maps/<slug>.md` via `template.html`. Regenerate the whole file on every update — never patch in place.
- `pages.json` — manifest; new entries go at the TOP (newest first).
- `index.html`, `nav.js`, `template.html` — shared shell.

## The connection (the whole point)

Every feature map tracks an idea-slicer map (`maps/<slug>.md` in `TR3-AI/idea-slicer`, live page `https://tr3-ai.github.io/idea-slicer/<slug>.html`). When a thought is sliced into an idea over there, the feature map here is updated **in the same turn** — new or changed features only; keep stable features untouched. The rendered page always links back to its idea-slicer page.

## The rules

1. **Smallest useful feature.** Break features down as small as possible without reducing them so much they stop being features. A portion is still a feature when it does one observable thing for a user or another feature. If splitting removes anything observable, stop.
2. **Anti-over-split.** If two candidate portions can never be triggered, failed, or verified independently, they are one feature.
3. **Three aspects per feature, always.** The feature (what it is + smallest build steps) · the behaviour (states, what can happen to it, variants) · the lifecycle (every trigger point → progression → every end state).
4. **Verification from the user's endpoint.** Checkpoints start at the user surface ("can the user click the button?") and end at visible proof on a system the user can see (the exchange's open-orders list). Never backend tests, never a reported "done".
5. **Success and failure parameters, always.** Success = visible proof it works. Failure = the observable gap that proves it does not (click registers, nothing reaches the exchange).
6. **No user-visible checkpoint? Flag it, don't skip it.** Name the surface where proof would appear and mark it as needing a user-endpoint view.
7. **Mobile is the primary screen.** No visual change is done until verified at ~390px as well as desktop.
8. **Contradictions stop the line.** If the source idea map conflicts (thresholds, directions), quote both sides and ask Bobby — never map over a conflict.
9. **Terse chat, rich page.** Plain everyday English; technical terms glossed in a few plain words on first use.

## Publish rhythm

Straight to the branch in use; the site updates ~1 min after push. Verify with a curl grep on the live URL.
