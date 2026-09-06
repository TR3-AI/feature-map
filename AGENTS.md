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
11. **Ground every test stream in real-world research.** We cannot know how to test something from the user's idea alone — the idea names WHAT exists; external know-how says how it WORKS. Before writing units, research how this kind of feature normally works (a stop-loss on a real exchange, its states, its failure modes). Unique composites have no write-up as a whole but their parts do: decompose and research the parts (dynamic stop-loss = standard stop-loss + trailing offset), then recompose. Anchor research to the specific sources the idea NAMES (pump.fun, FOMO, X, Grok), not the generic category — "callouts" are whatever the named platform actually emits, through its actual access path; generic category research writes know-how for a feature nobody asked for. The research output is WRITTEN DOWN: each recipe carries a `## How it works in practice` section (before the test stream, rendered on the page) that writes the feature's **mechanical chain** — not what the feature IS, but how it FUNCTIONS hop by hop: TRIGGER (the real-world event) · MECHANISM (what the platform mechanically does) · DELIVERY (how the result reaches us — push/stream/poll; exact path PRE-BUILD until the repo exists) · SURFACE (where the outcome appears for the user) · BREAKS (what breaks at each hop). The stream's steps are: cause the trigger, watch each hop, prove every break visible. It closes with Existence: (native vs bot-simulated) and Deviations from standard:. Then compare the spec against the know-how element by element: align → test normally; misalign (spec says the stop moves up, standard says down) → flag a mechanics disagreement on that element. The flag doesn't disprove the feature — it makes the test correct: the stream still tests the spec's version (the idea stays the source of truth), but knowingly, so the agent never tests against standard behavior by habit and fails a correct implementation. **Broadcast, never silent:** flagged elements land in a strip after the LAST feature on the page, stay as `Research note:` gotchas on the feature, and every note ends with a `Tester action:` line (its own distinct chip) — the exact thing to pin or check — then go to Bobby with a keep-or-drop suggestion per element. Never quietly rewrite the spec from research; never drop a disagreement silently.
12. **Rules for rules (the meta-rule).** A new rule is not a rule until it is enforceable by any agent on any model. In the same turn it is decided: (1) written into EVERY synced copy — the skill's SKILL.md, the profile copies (5, him, moon — checksums must match), this AGENTS.md, and rulebook.html; (2) written as an enforceable instruction — imperative, specific, observable outcome — never a bare principle; (3) given a mechanical check where one can exist (a format the renderer parses, a grep-able page element); (4) verified active before the turn ends — profiles synced, repo pushed, live page greps pass. Models inherit rules only through these files; a rule in only some copies, or one no agent can check, does not exist.

13. **P-stack below governs every map — and it is enforceable.** A Feature Map output is only done when it was generated under these principles and skills; an output that ignores them fails the run. Copied like-for-like from pstack v0.14.8 (`github.com/cursor/plugins/tree/main/pstack`). Do NOT run `/poteto-mode Feature` while writing the map: one feature file = behaviors + proof — execution comes later. Feature Map is not "part two" of Idea Slicer — they are two different skills that work together: Feature Map takes PRDs and SDDs as input, and another input format it accepts is an Idea Slicer link.

## P-stack principles (governing every map)

name: principle-experience-first
description: "Apply when product, UX, or feature-scope tradeoffs come up. Choose user delight over implementation convenience; ship fewer polished features over more rough ones."
disable-model-invocation: true

name: principle-prove-it-works
description: "Apply after completing a task, before declaring done. Verify against the real artifact (run the feature, read the actual value, inspect the diff), not a proxy, self-report, or 'it compiles.'"
disable-model-invocation: true

name: principle-model-the-domain
description: "Apply when writing stateful logic, or when code branches a lot or repeats a shape assumption across files. Encode the domain in a structure instead of scattered conditionals."
disable-model-invocation: true

name: principle-minimize-reader-load
description: "Apply when reviewing or shaping code that's hard to trace. Count layers between question and answer, and hidden state in the reader's head; collapse one-caller wrappers and shrink mutable scope."
disable-model-invocation: true

name: principle-build-the-lever
description: "Apply to any non-trivial work, not just bulk work: edits, migrations, analyses, checks. Build the tool that does it or proves it (codemod, script, generator, or a skill your subagents follow) instead of working by hand. The tool is the artifact a reviewer can rerun."
disable-model-invocation: true

name: principle-make-operations-idempotent
description: "Apply when designing commands, lifecycle steps, or processing loops that run amid crashes, restarts, and retries. Converge to the same end state regardless of partial prior runs."
disable-model-invocation: true

name: principle-boundary-discipline
description: "Apply when wiring validation, error handling, or framework adapters. Concentrate guards at system boundaries (CLI, config, network, external APIs); trust internal types and keep business logic in pure functions."
disable-model-invocation: true

name: principle-laziness-protocol
description: "Apply when refactoring, evaluating diff size, or tempted to add abstractions, layers, or signal threading. Bias toward deletion and the smallest change that solves the problem."
disable-model-invocation: true

## P-stack skills (governing every map)

name: technical-writing
description: "Layered technical-writing standard: Diátaxis structure, Google developer style sentences, STE instruction rules, Global English syntax. Use for /technical-writing or when writing or reviewing docs, RFCs, readmes, PR descriptions, or commit messages."
disable-model-invocation: true

name: unslop
description: Cut AI tells from any writing. Must always apply.
disable-model-invocation: true

name: create-verification-skill
description: "Generate a project-local verification skill that drives your app the way a user does — any language, framework, or platform. Use for /create-verification-skill, \"make a control skill for this repo\", or when a project has no scripted way to prove UI/CLI/service behavior."
disable-model-invocation: true

name: maintain-verification-skill
description: "Periodic pass that keeps a project's verification skill and feature map honest: parallel source readers per feature, one live session driving every feature, at most one PR of proven corrections. Use for /maintain-verification-skill or \"audit the verify skill\"."
disable-model-invocation: true

name: how
description: "Use for \"how does X work\", code walkthroughs before changing something, and placement / ownership / layering questions (\"where should this live\", \"which package owns this\", \"is this the right layer\"). Explains subsystem architecture, runtime flow, onboarding mental models. Can critique architecture. Use why for motivation."
disable-model-invocation: true


## The standard flow (every idea, every time)

Input in — an Idea Slicer link, source text pasted straight into the chat (a PRD, a plan, an SDD, or both — command, space, pasted text), **or a repository link** (the agent clones/reads the repo and derives the feature list from what the code actually does — never guesses from the URL; an unreadable repo means stop and say so, never fabricate) → all three artifacts generated **together, in the same turn, before any code exists**:

1. `maps/<slug>.md` — the feature inventory (three aspects per feature).
2. `verify-<slug>/` — the tester kit (pstack-format SKILL.md + `features/` driving recipes).
3. `<slug>.html` — the rendered page, via `node render.js <slug>` (never hand-edit it), merging both.

## The page — structure and identity (Bobby's rulings)

- **Its own visual identity.** Not the Idea Slicer look, ever: engineering-blueprint theme (grid paper, monospace labels, blue feature boxes, teal verification boxes). No purple, no pill cards.
- **Detail is the product.** Every aspect is written out in full — numbered build steps, behaviour bullets, the lifecycle as a trigger→steps→end chain. One-line summaries fail the page.
- **Two linked boxes per feature.** The feature box (header + feature steps + **sub-feature chips** + behaviour + lifecycle flow), a teal connector line with a "verified by" chip, then the verification box below. The connector makes the pairing obvious.
- **The verification box carries the merged pstack recipe:** how to get to it (user POV) · how it works in practice (external research) · preconditions · the test stream (numbered units: the feature end to end, then one per sub-feature, each with steps + its own success/failure) · gotchas (amber) · feature-level success/failure verdict.
- **One unified page.** No separate kit page — the pstack content is merged into the boxes. The raw kit stays on GitHub for the tester agent (footer link "raw tester kit").

## Publish rhythm

Straight to `main` by Bobby's standing instruction (same as Idea Slicer and ELI5links — overrides the protected-main rule for this repo). The site updates ~1 min after push. Verify with a curl grep on the live URL.
