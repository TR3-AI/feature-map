# AGENTS.md — binding rules for any agent working in this repo

This repo runs **feature map** — its own skill that works together with Idea Slicer (one of its input formats, alongside pasted PRDs, plans, SDDs, and repository links). It is not a stage or part of Idea Slicer; they are two different skills that connect. Feature Map works for ANY idea in ANY industry: the rules below name no industry and lean on no worked example, so nothing here ties the tool to one kind of product. `maps/<slug>.md` files are the source of truth; the HTML pages are rendered from them by an agent (no robot here). Site: https://tr3-ai.github.io/feature-map/. Everything below is mandatory.

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
4. **Verification from the user's endpoint, performed by the tester agent.** Checkpoints start at the user surface ("can the button be clicked?") and end at visible proof on a system the user can see (the real target system's own visible state). The **tester agent** performs every step — never Bobby — inside a **ProofShot** recording session, so the evidence is video/screenshots Bobby can witness. Never backend tests, never a reported "done".
5. **Success and failure parameters, always.** Success = visible proof it works. Failure = the observable gap that proves it does not (the click registers, but nothing reaches the target system).
6. **No user-visible checkpoint? Flag it, don't skip it.** Name the surface where proof would appear and mark it as needing a user-endpoint view.
7. **Mobile is the primary screen.** No visual change is done until verified at ~390px as well as desktop.
8. **Contradictions stop the line.** If the source idea map conflicts (thresholds, directions), quote both sides and ask Bobby — never map over a conflict.
9. **Terse chat, rich page.** Plain everyday English; technical terms glossed in a few plain words on first use.
10. **The verification unit: feature + sub-features, tested on build completion.** What gets verified is never a feature ticket — a ticket can be very large. The unit is a built feature plus every one of its sub-features, checked whenever an agent finishes building that feature. A sub-feature is one part of the feature's life cycle: how it works, what it does, every variation it can handle. A feature counts as "working" only when the feature AND all its sub-features are proven on the front end. The mechanism is the **test stream**: in each kit recipe, the `## Test stream` section carries numbered units — unit 1 proves the feature end to end, then exactly one unit per sub-feature — each stating how to test it plus its own `Success:` and `Failure:` lines. The tester agent must never have to guess how to test something.
11. **Ground every test stream in real-world research.** We cannot know how to test something from the user's idea alone — the idea names WHAT exists; external know-how says how it WORKS. Before writing units, research how this kind of feature normally works in the real world (its states, its failure modes). Unique composites have no write-up as a whole but their parts do: decompose and research the parts, then recompose. Anchor the research to the specific sources YOUR INPUT names — whatever platforms, APIs, or tools the idea, PRD, SDD, slice, or repo actually mentions, research those through their actual access paths, never the generic category. Generic category research writes know-how for a feature nobody asked for.


12. **Rules for rules (the meta-rule).** A new rule is not a rule until it is enforceable by any agent on any model. In the same turn it is decided: (1) written into EVERY synced copy — the skill's SKILL.md, the profile copies (5, him, moon — checksums must match), this AGENTS.md, and rulebook.html; (2) written as an enforceable instruction — imperative, specific, observable outcome — never a bare principle; (3) given a mechanical check where one can exist (a format the renderer parses, a grep-able page element); (4) verified active before the turn ends — profiles synced, repo pushed, live page greps pass. Models inherit rules only through these files; a rule in only some copies, or one no agent can check, does not exist.

13. **P-stack below governs every map — and it is enforceable.** A Feature Map output is only done when it was generated under these principles and skills; an output that ignores them fails the run. Copied character-for-character from pstack v0.14.8 (`github.com/cursor/plugins/tree/main/pstack`) — the full bodies, frontmatter omitted. Do NOT run `/poteto-mode Feature` while writing the map: one feature file = behaviors + proof — execution comes later. Feature Map is not "part two" of Idea Slicer — they are two different skills that work together: Feature Map takes PRDs and SDDs as input, and another input format it accepts is an Idea Slicer link.

## P-stack index — vendored frontmatter (from pstack v0.14.8)

pstack ships each principle and skill as its own `SKILL.md` with YAML frontmatter; rule 13 vendors the bodies below with that frontmatter omitted. It is gathered here instead of left scattered — copied verbatim from pstack v0.14.8 (`cursor/plugins@7314f723a4`), one table each, the way pstack's own README lists them (the `group` column is pstack's README grouping). The `name` column is pstack's own; each body heading below is the same item, title-cased. Every entry also sets `disable-model-invocation: true`.

**Principles**

| Principle (`name`) | Group | Description (frontmatter) |
|---|---|---|
| `principle-experience-first` | core | Apply when product, UX, or feature-scope tradeoffs come up. Choose user delight over implementation convenience; ship fewer polished features over more rough ones. |
| `principle-prove-it-works` | verification | Apply after completing a task, before declaring done. Verify against the real artifact (run the feature, read the actual value, inspect the diff), not a proxy, self-report, or 'it compiles.' |
| `principle-model-the-domain` | architecture | Apply when writing stateful logic, or when code branches a lot or repeats a shape assumption across files. Encode the domain in a structure instead of scattered conditionals. |
| `principle-minimize-reader-load` | core | Apply when reviewing or shaping code that's hard to trace. Count layers between question and answer, and hidden state in the reader's head; collapse one-caller wrappers and shrink mutable scope. |
| `principle-build-the-lever` | core | Apply to any non-trivial work, not just bulk work: edits, migrations, analyses, checks. Build the tool that does it or proves it (codemod, script, generator, or a skill your subagents follow) instead of working by hand. The tool is the artifact a reviewer can rerun. |
| `principle-make-operations-idempotent` | architecture | Apply when designing commands, lifecycle steps, or processing loops that run amid crashes, restarts, and retries. Converge to the same end state regardless of partial prior runs. |
| `principle-boundary-discipline` | architecture | Apply when wiring validation, error handling, or framework adapters. Concentrate guards at system boundaries (CLI, config, network, external APIs); trust internal types and keep business logic in pure functions. |
| `principle-laziness-protocol` | core | Apply when refactoring, evaluating diff size, or tempted to add abstractions, layers, or signal threading. Bias toward deletion and the smallest change that solves the problem. |

**Skills**

| Skill (`name`) | Description (frontmatter) |
|---|---|
| `technical-writing` | Layered technical-writing standard: Diátaxis structure, Google developer style sentences, STE instruction rules, Global English syntax. Use for /technical-writing or when writing or reviewing docs, RFCs, readmes, PR descriptions, or commit messages. |
| `unslop` | Cut AI tells from any writing. Must always apply. |
| `create-verification-skill` | Generate a project-local verification skill that drives your app the way a user does — any language, framework, or platform. Use for /create-verification-skill, "make a control skill for this repo", or when a project has no scripted way to prove UI/CLI/service behavior. |
| `maintain-verification-skill` | Periodic pass that keeps a project's verification skill and feature map honest: parallel source readers per feature, one live session driving every feature, at most one PR of proven corrections. Use for /maintain-verification-skill or "audit the verify skill". |
| `how` | Use for "how does X work", code walkthroughs before changing something, and placement / ownership / layering questions ("where should this live", "which package owns this", "is this the right layer"). Explains subsystem architecture, runtime flow, onboarding mental models. Can critique architecture. Use why for motivation. |

## P-stack principles (governing every map)

# Experience First

The product is the experience. Every technical decision either helps or hurts it. When implementation convenience conflicts with user delight, choose delight.

- Say no to 1,000 things (every feature, control, and option must earn its place)
- Ship less, ship better (polished experience with three features beats rough one with ten)
- Prototype before committing (design decisions are cheaper in throwaway HTML than production code)
- Sweat the details (transitions, alignment, spacing, feedback, error states)
- Tighten the core loop (every feature should serve the central workflow or get out of the way)

The user is whoever consumes the work. For a UI that is the end user. For a library or an internal API it is the colleague who imports it. The engineer who maintains the code next is a user too. Weigh their experience the same way, and explain impact from their seat.

Foundations should serve the experience, not the other way around. Foundational thinking governs the *sequence* of work; this principle governs the *target*.

---

# Prove It Works

Verify every task output by checking the real thing directly. Do not infer from proxies, self-reports, or "it compiles."

**Why:** Unverified work has unknown correctness. Indirect verification (file mtimes, output freshness, agent self-reports, cached screenshots) feels cheaper than direct observation. Acting on a wrong inference costs far more than checking the source.

**Pattern:** After completing any task, ask: "how do I prove this actually works?"

Check the real thing, not a proxy:
- Check process liveness directly, not indirectly through derived state
- Read the actual value, not a cached or derived representation
- When verification fails, suspect the observation method before suspecting the system

Code and features:
1. Build it (necessary but not sufficient)
2. Run it and exercise the actual feature path
3. Check the full chain: does data flow from input to output?
4. For integrations, test the full communication path end-to-end

Delegation: trust artifacts, not self-reports.
When verifying delegated work, inspect the actual output artifact (git diff, file contents, runtime behavior), not the delegate's summary. Agents report what they intended, not always what happened.

## Script the check when you can

The strongest proof is a deterministic script that re-runs the same comparison, not a one-time eyeball. Write the script, run it, and keep its output as an artifact a reviewer can re-run instead of trusting your word. A script comparing the old and new compiled output catches what a glance misses.

Keep the artifact visible for the human. Commit it only for large or complex work where the trail has to be auditable later, like a big port or migration (the **show-me-your-work** skill). Most work just needs it visible, not committed.

---

# Model the Domain

Encode the real domain in a data structure instead of scattering it across conditionals.

**Why:** Scattered booleans, repeated shape assumptions, and branching spread across files are accidental complexity. A structure that matches the domain makes invalid states unrepresentable and deletes branches. Choosing it at write time is cheap; recovering it later reads as a refactor and gets deferred.

**Reach for structures like these:**

- A state machine instead of scattered booleans, phases, or lifecycle checks.
- A typed object/model instead of loose parameters or repeated shape assumptions.
- A map, registry, lookup table, or discriminated union instead of branching spread across files.
- A reducer or command/event model instead of ad hoc state mutations.
- A module organized around one body of domain knowledge instead of a sequence such as load, validate, transform, and save. Execution order is not ownership.
- A small module boundary that gathers repeated behavior, ownership, or invariants.
- A queue, cache, index, graph/tree, or normalized collection where the data access pattern calls for it.
- Any other structure that fits. The list above covers the common cases only. When none fits, work out what the code must never allow and how the data gets read, then find the structure that encodes exactly that.

Do not force an abstraction. Prefer boring code if the current shape is already clear, local, and unlikely to grow. Be skeptical of an abstraction that adds indirection without removing branches, duplicated rules, invalid states, or lifecycle risk.

The tell that you skipped this is a new feature that grows an existing if/else chain by one more branch, or a second boolean that must stay in sync with the first. Temporal decomposition is another tell. Phase-named modules repeat the same domain rules across steps.

---

# Minimize Reader Load

Maintainability is the work a reader must do to understand code. Track two axes:
1. **Layers to trace.** How many indirections sit between the question and the answer.
2. **State to hold.** How much hidden or mutable context the reader must keep in their head.

**Why:** Code is read far more than it is written. LOC, cyclomatic complexity, and "clean architecture" are proxies. Reader load is the thing that matters. The two axes are independent. A flat file with 50 globals can be as hard to reason about as a 6-layer adapter stack. Guard both. This is the human analog of [Guard the Context Window](../principle-guard-the-context-window/SKILL.md): working memory is finite for readers too.

**The pattern:**
- **Collapse layers** that do not earn their keep: wrappers with one caller, adapters with no second implementation, indirection introduced for a future that never came. Inline them.
- **Make adjacent layers change the abstraction.** A layer that repeats the same methods and arguments adds reader load without compression. Collapse pass-through layers.
- **Demand interface compression.** A broad interface that hides little complexity makes readers learn both the surface and the implementation. Prefer boundaries that hide meaningful decisions.
- **Shrink state scope:** prefer pure functions (returns over mutations), locals over fields, fields over module state, and module state over globals. Derive instead of sync.
- **Name the invariant at the boundary,** not in every consumer, so the reader learns it once.
- Before adding a layer or a piece of state, ask: does this reduce reader load somewhere else by at least as much?

**The test:** Can a new reader answer "where does X come from?" and "what can change X?" in under 30 seconds? If not, cut layers or cut state.

---

# Build the Lever

When the work isn't trivial, build the tool that does it instead of doing it by hand.

**Why:** Two payoffs. Throughput: a codemod, generator, or script does the work the same way every time and reruns for free. Confidence: the tool is one artifact a reviewer can read and rerun to check the work. Hand-done changes can only be re-verified by redoing them. A deterministic script turns "trust me" into "run this".

**Pattern:** Default to building the lever. Skip it only when the task is genuinely trivial, a couple of obvious edits you can see at a glance.

- Do the first unit by hand to learn the recipe, then build the tool. Prove it by rerunning it on that unit and diffing against your hand-done version. Make the lever safe to rerun. A reviewer will.
- Codemod or script for edits, generator for repetitive files, a dump-to-sqlite query for analysis, a rerunnable check for verification.
- A deterministic lever beats fan-out. If the tool can process every unit in one pass, run it yourself; don't fan out delegates to hand-apply what a script can do.
- When you fan work out to subagents, write the lever as a skill they all read: the recipe, the verification contract, and the do-not-touch fences in one artifact, so every delegate inherits the same hardened version instead of re-explaining it per prompt and watching each one drift. Keep it outside the delegates' write scope so they can't quietly edit the contract.
- Applying this principle produces a file. If you cited it and there is no codemod, script, generator, or delegate skill in the diff, you didn't apply it.
- Commit the lever when the work outlives the session, so the next run reruns it instead of redoing it.

**Balance:** The bar is triviality, not repetition. A one-off still earns a lever when the lever is what makes the work checkable. Per the [Laziness Protocol](../principle-laziness-protocol/SKILL.md), build the smallest script that does or proves the job, never a framework.

Distinct from [Encode Lessons in Structure](../principle-encode-lessons-in-structure/SKILL.md), which makes a recurring instruction a durable guardrail. This is throughput and reviewability on the work in front of you. For scripting the verification itself, see [Prove It Works](../principle-prove-it-works/SKILL.md).

---

# Make Operations Idempotent

Design operations so they converge to the correct state regardless of how many times they run or where they start from. Every state-mutating operation should answer: "What happens if this runs twice? What happens if the previous run crashed halfway?"

**Why:** Commands, lifecycle operations, and processing loops run where crashes, restarts, and retries are normal. If partial state changes the next run's outcome, every restart becomes a debugging session.

**The pattern:**
- Convergent startup: scan for existing state, clean stale artifacts, adopt live sessions
- Content-based cleanup: compare by content equivalence, not creation order
- Self-healing locks: use PID-based stale lock detection
- Idempotent scheduling: failed work respawns cleanly, fresh input regenerated after each cycle

**The test:**
1. What happens if this runs twice in a row?
2. What happens if the previous run crashed at every possible point?
3. Does re-execution converge to the same end state?

If any answer is "it depends on what state was left behind," the operation needs a reconciliation step.

---

# Boundary Discipline

Place validation, type narrowing, and error handling at system boundaries. Trust internal code unconditionally. Business logic lives in pure functions; the shell is thin and mechanical.

**Why:** Scattered validation is noisy, redundant, and gives a false sense of safety. Validate data once at the boundary. Keep logic out of framework wiring so it can be tested without the framework.

**The pattern:**
- **At boundaries** (CLI args, config files, external APIs, network protocols): validate, return errors, handle defensively.
- **Inside the system:** typed data, error propagation, no re-validation. Trust the types.
- **Across the boundary.** Expose domain concepts, not the boundary's private representation. Keep general-purpose mechanism inside and special-purpose policy at the edge.

**Applications:**

Validation and error handling:
- Validate config at parse time (the boundary), not inside business logic
- Parse raw data into domain types at the boundary
- Do not re-export transport, storage, framework, or wire types through the public surface
- No redundant nil checks deep in call chains if the boundary already validated

Code organization:
- Business logic in pure functions with no framework dependencies
- Parse functions: pure transforms from raw bytes to typed state
- Prompt construction: structured state in, string out
- Scoring and assessment: pure transforms from state to results

**The tests:**
- "Is this data crossing a system boundary right now?" If not, validation is redundant.
- "Can this be a pure function that the shell just calls?" If yes, extract it.

---

# Laziness Protocol

Writing code is cheap for you, which makes over-engineering easy. Counter it by borrowing a human maintainer's fatigue. Aim for the most result with the least code and complexity.

- **Prefer deletion.** When asked to refactor or improve, look for removals before additions.
- **Maintain a flat call hierarchy.** Avoid deep call chains. A rich interface that hides substantial work is not a deep call chain. If answering a question requires tracing through more than 3 files or layers, flatten it.
- **Consolidate decisions.** Do not repeat the same choice in several places. Put it behind one source of truth and pass the result as a simple flag.
- **Minimize the diff.** Make the smallest change that solves the problem. Fewer lines beat "elegant" boilerplate.
- **Question the threading.** If a task asks you to pass a new signal through types, schemas, pipelines, or similar layers, stop and look for a more direct path.
- **Sweat the small leaks.** Remove tiny pass-throughs, representation leaks, and duplicated choices before they spread. Small leaks compound into permanent coordination costs.

**Prime directive:** If a human developer would find the code exhausting to maintain, it is a bad solution. Be lazy. Stay simple.

---

## P-stack skills (governing every map)

# Technical writing

The goal is writing a tired engineer understands on the first read. Four layers get you there, one question each: what kind of document is this, how do sentences address the reader, how much does each sentence carry, and can any sentence be read two ways. Apply all four.

Three rules sit above the layers:

- **Cut every word that does no work.** If the sentence survives without a word, the word goes. "In order to" is "to". "It is important to note that" is nothing.
- **Use the short, everyday word.** "Use", not "utilize". "Help", not "facilitate". "Do", not "perform". A long word has to buy its length with precision.
- **When a rule makes a sentence worse, fix the sentence another way or leave it alone.** The rules serve the reader. A sentence that follows every rule and sounds like a machine wrote it has failed.

The codebase is the word list. Write the real symbol, file, flag, or command name, not a synonym or a description of it.

Don't invent jargon. Use the words a developer would say out loud: "move", "delete", "a budget that only decreases", not "evacuate", "ratchet", or "endgame". A named pattern is fine when the doc says what it means the first time. Add new offenders to `unslop`'s abstract-metaphor rule with their replacement.

## Vary the rhythm

The layers decide what a document says and how much each sentence carries. A doc can obey all of them and still read machine-written: every sentence clipped short, no view anywhere, nothing specific.

- Mix sentence lengths on purpose. Short sentences land a point. Longer ones that take their time carry a fact with its condition or consequence.
- One thought per sentence does not mean one length per sentence. Split the sentence that carries two thoughts. Keep the long sentence that carries one.
- Have a view where the mode allows it. Explanation weighs trade-offs, so say what you make of them instead of listing pros and cons. Reference stays dry.
- Be specific over sterile. Not "schema changes can cause issues" but "a column rename fails the build".

## Pick the mode first (Diátaxis)

One document, one mode. Two questions pick it: does the content inform action (doing) or understanding (thinking), and does it serve learning or work?

- Action + learning: **tutorial**.
- Action + work: **how-to**.
- Understanding + work: **reference**.
- Understanding + learning: **explanation**.

Use the compass on a whole document or on one sentence. Reach for it whenever you feel unsure what you are writing. Gut feel is often wrong here.

**Tutorial: learning by doing.** You are the teacher. The learner's success is your job, not theirs. Open by saying what the learner will build, not what they will "learn". Every step produces a visible result, early and often. Tell them what they should see: the expected output, the prompt change, the log line. Cut explanation to one clause and a link. Teaching pauses break the lesson. Stay concrete. Write as "we", in commands: "First, do x. Now, do y."

**How-to: steps to a goal.** Solve a problem a person has, not an operation the machine can perform. Assume competence. Skip teaching. Action only: no digressions, no background, no completeness for its own sake. Link those instead. Allow forks and judgment: "If you want x, do y." Name the guide by the task: "How to calibrate the radar array", not "Radar array calibration".

**Reference: facts for lookup.** Describe. Only describe. No instruction, no persuasion, no opinion. Be dry, complete, and sure: state facts, options, limits, and errors with no hedging. Mirror the structure of the thing described, so code and docs can be navigated together. Put material where readers expect it. Generate from code where possible, so it stays true.

**Explanation: understanding and why.** One bounded topic, readable away from the product. Each title should tolerate an implicit "About..." in front. Anchor on a real why question. Give context: design decisions, history, constraints, alternatives. Opinion is allowed here and nowhere else.

Don't mix modes: no reference tables inside a tutorial, no tutorial hand-holding inside reference, no arguing inside a how-to. Split and link instead.

Source: diataxis.fr, fetched 2026-07-18.

## Write sentences to the reader (Google developer style)

- Talk to the reader as "you", in the present tense. "Will" only for things that genuinely happen later.
- Say who does what: "the compiler checks", not "is checked". Passive is fine only when the actor is unknown or beside the point.
- Write instructions as commands: "Click Submit." State facts plainly. Never "should be done".
- Put the condition before the instruction: "To delete the document, click Delete." The reader skips what does not apply.
- Put the common case first. Exceptions after.
- Sound like a knowledgeable friend. No buzzwords, no figurative language, no "please" in instructions, and never "simply", "easy", or "quickly" in a procedure. If it were simple, the reader would not be here.
- Don't pre-announce ("we will soon support...") and don't start consecutive sentences with the same phrase.
- Read the awkward sentence aloud. If it stays awkward, rewrite it.
- Link with words that say where the link goes: the page title or a short description. Never "click here". Prefer a sentence of context on the page over a link off it.
- Headings carry the point, not just the topic ("Pick the mode first", not "Modes"). Sentence case. A task heading is a bare verb phrase ("Create an instance"). A concept heading is a noun phrase. One h1 per page, no skipped levels.
- Numbered lists for sequences, bullets for everything else. Introduce a list with a complete sentence. Keep items parallel.
- Code goes in code font. UI elements go in bold. Use serial commas. Drop "etc." and say up front that a list is partial.

Source: developers.google.com/style, fetched 2026-07-18.

## Make statements load one at a time (STE rules)

- One instruction per sentence. One thought per sentence everywhere else.
- Split instructions longer than about 20 words and other sentences longer than about 25.
- Put the warning or condition before the step it guards: "If hot oil touches your skin, injuries can occur."
- Keep "the" and "a": "Remove backup file" reads two ways. "Remove the backup file" reads one.
- Give each word one meaning and one job, then keep it. If "check" means inspect, don't also use it for restrain.
- Pick one word per action and stick to it: "start", not "start" here and "initiate" there.
- Write procedures as direct commands, never as narration and never in the passive: "Install the component", not "the component must be installed".
- Avoid "-ing" words where you can. They take too many grammatical jobs and breed misreadings.

Source: asd-ste100.org (Issue 9, 2025), fetched 2026-07-18. The numbered rules and dictionary live in the spec PDF. The principles above are the transferable core.

## Leave no sentence open to two readings (Global English)

- Keep words like "only" and "not" next to the word they change: "only fails on growth" and "fails only on growth" say different things.
- Break up long noun strings: "the proto import budget check script" becomes "the script that checks the proto-import budget".
- Make every "it", "they", and "this" point at one obvious thing. Repeat the noun when in doubt. Never use "this" or "which" to point at a whole clause.
- Don't drop verbs: "Phase 1 moves the converters and Phase 2 the runtime" leaves Phase 2 without one. Give it one.
- Keep the small words that show structure. "Ensure that the switch is off" keeps "that" because it makes the sentence parse one way. Never trade clarity for word count.
- Repeat the article in a series when it prevents a misread: "the client and the host", not "the client and host", when they are two things.
- Say which parts "and" or "or" joins when a sentence can group two ways. "Both...and", "either...or", and "if...then" are free disambiguators.
- Use periods, not semicolons. Replace an em dash with a new sentence.
- Make text in parentheses a full grammatical unit or its own sentence. Never form plurals with "(s)".
- No slashes: write "a, b, or both" instead of "a/b" or "and/or".
- Call each thing by one name, everywhere. A doc that says "the gate", "the ratchet", and "the budget check" for one thing teaches three things. Rewording an unchanged sentence between edits costs the same way: don't churn what didn't change.
- Skip idioms, colloquialisms, Latin abbreviations, and metaphors. A non-native reader, a translator, and an agent all parse plain constructions best.

Source: Kohl, The Global English Style Guide (SAS Press). Guideline text fetched from the Internet Archive and the SAS sample chapter, 2026-07-18.

## Voice and repo specifics

- Apply the **unslop** skill to every doc this skill touches. That skill owns the slop-pattern catalog: AI vocabulary, filler, hedging, formatting tells.
- PR descriptions and commit messages are writing too. Every layer except Diátaxis applies to them.
- Product UI strings are not documentation. Use your product's copy guidelines for those.
- Indent code snippets with tabs. Write real paths and real symbols. Make every count or tree claim true at the commit that lands it, and include the command that regenerates it.

## Worked example

Before:

> Configuration of the proto import ratchet budget script parameters is performed via budget.json. Note that it's important to remember that running with --write, which updates the committed budget to reflect the current count, should only be done when lowering it. If exceeded, CI fails.

After:

> `budget.mjs` reads the committed budget from `budget.json` and counts the files that import protos. If the count exceeds the budget, CI fails. Run `budget.mjs --write` only to lower the budget.

The fixes, by layer: "configuration is performed" becomes "`budget.mjs` reads", so someone does something (Google). "Ratchet" goes away. The script's real filename does the naming (jargon rule). The five-noun string breaks up into plain clauses (Global English). The hedge "note that it's important to remember" is deleted (cut every word that does no work). The failure condition moves ahead of the step it explains (STE). The buried "should only be done when lowering" becomes a command with "only" next to its verb (STE). "If exceeded" gets a subject: the count (Global English).

## Review checklist

Apply to any prose this skill covers. Item 1 applies only to document sets:

1. Is each file one Diátaxis mode, with links where modes meet?
2. Is every instruction written as a command, with its condition in front?
3. Does any sentence carry two instructions or two thoughts? Split it.
4. Can any word be cut without losing meaning? Cut it.
5. Is "only" next to the word it changes? Does every "it" point at one thing? Does every clause keep its verb?
6. Does each thing have exactly one name across the docs?
7. Would a developer say these words out loud? Replace invented metaphors and fancy synonyms with the plain word or the real symbol name.
8. Are all symbols, paths, and counts real at this commit, with the commands that regenerate the counts?

---

# Unslop

Edit text to remove AI patterns and add human voice.

## Process

1. Scan for the patterns below.
2. Rewrite. Preserve meaning, match intended tone.
3. Add soul (see next section).
4. Self-audit: "What makes this obviously AI generated?" Fix remaining tells.

## Adding soul

Removing patterns is half the job. Sterile, voiceless writing is just as obvious.

- **Have opinions.** React to facts instead of neutrally listing pros and cons.
- **Vary rhythm.** Short sentences. Then longer ones that take their time. Mix it up.
- **Acknowledge complexity.** "Impressive but also kind of unsettling" beats "impressive."
- **Use "I" when it fits.** First person isn't unprofessional.
- **Let some mess in.** Perfect structure looks machine-made.
- **Be specific.** Not "this is concerning" but "there's something unsettling about agents churning away at 3am."

## Patterns to detect and fix

### Content

1. **Puffery.** "pivotal moment", "testament to", "evolving landscape", "setting the stage for", "indelible mark", "deeply rooted". Cut puffery, state what happened.
2. **Name-dropping.** Listing media outlets without context. Pick one, say what was said.
3. **Superficial -ing phrases.** "highlighting...", "ensuring...", "reflecting...", "showcasing...", "fostering...". Delete or expand with real sources.
4. **Promotional language.** "nestled", "vibrant", "breathtaking", "groundbreaking", "renowned", "stunning", "must-visit". Use neutral descriptions.
5. **Vague attributions.** "Experts believe", "Industry reports suggest", "Some critics argue". Name the source or delete.
6. **Formulaic challenges.** "Despite challenges... continues to thrive." Replace with specific facts.

### Language

7. **AI vocabulary.** Additionally, crucial, delve, enduring, enhance, fostering, garner, interplay, intricate, landscape (abstract), pivotal, showcase, tapestry (abstract), testament, underscore, vibrant. Replace with plain words.
8. **Fancy ways to say "is".** "serves as", "stands as", "boasts", "features". Just say "is" or "has".
9. **"Not just X, but Y."** State the point directly instead.
10. **Rule of three.** Forcing ideas into groups of three. Use the natural number.
11. **Synonym cycling.** Protagonist, main character, central figure, hero all in one paragraph. Pick one, repeat it.
12. **False ranges.** "from X to Y" where X and Y aren't on a meaningful scale. List topics directly.

### Style

13. **Em dash overuse.** Avoid em dashes entirely. Use periods or commas only (no parentheses, no en dashes, no hyphen-as-dash substitutes). Em dashes are an AI tell, and reaching for parentheses instead just trades one tell for another. If a thought needs separation, end the sentence or use a comma.
14. **Colon overuse.** Colons are fine before a list or example. Not as mid-sentence connectors. "If you're coming from traditional automation: instead of registering event handlers, you describe conditions" adds nothing with the colon. Rewrite to let the point stand on its own without comparison framing. "Describing when the scheduler should fire works best as plain English." Same meaning, no crutch punctuation.
15. **Boldface overuse.** Don't bold every proper noun or acronym.
16. **Inline-header lists.** The tell is a bold label and colon that restates the line: "**Performance:** Performance improved...". Convert those to prose. A bold lead-in that ends in a period, names the item, and is followed by genuinely new detail ("**Schema in TypeScript.** Tables live in one file.") is fine, not a tell.
17. **Title case headings.** Use sentence case.
18. **Decorative emojis.** Remove from headings and bullets.
19. **Curly quotes.** Replace with straight quotes.

### Communication artifacts

20. **Chatbot phrases.** "I hope this helps!", "Let me know if...", "Of course!", "Certainly!", "Found the smoking gun!" Remove.
21. **Cutoff disclaimers.** "While specific details are limited..." Find sources or remove.
22. **Sycophantic tone.** "Great question! You're absolutely right!" Respond directly.

### Filler

23. **Filler phrases.** "In order to" becomes "To". "Due to the fact that" becomes "Because". "It is important to note that" gets deleted.
24. **Excessive hedging.** "could potentially possibly be argued that it might" becomes "may".
25. **Generic conclusions.** "The future looks bright." State specific plans or facts.

### Jargon

26. **Abstract metaphor nouns.** Substrate, wedge, vector, locus, vantage, nexus, primitive (as noun), harness (as metaphor), surface (as in "API surface"), bedrock, scaffolding (as metaphor), modality, paradigm, gold-plating, ratchet (as metaphor), evacuate (for moving code), endgame, north star, flywheel. These read as technical but usually have a plainer concrete word. "Substrate" becomes "base". "Wedge in" becomes "add". "Vector" becomes "way" or "method". "Gold-plating" becomes "more than the job needs". "Ratchet" becomes the mechanism's real name or "a limit that only tightens". "Evacuate" becomes "move out". "Endgame" becomes "the last phase". Pick the concrete word.

### Plain speech

27. **Say what it does, not how it feels.** "the database stays close at hand", "SQL you can read", "types that follow your schema" name a feeling. The fix names the mechanism or a number: "`.toSQL()` returns the exact string sent to the database", "a column rename fails the build". Ask what the sentence tells the reader to do or know, then write that. If you can't restate it as a concrete instruction, fact, or number, cut it. One more check: if the sentence could appear unchanged in another project's docs, it says nothing about this one. Cut it.
28. **Shorten or split dense sentences.** If the reader has to backtrack to parse a sentence, break it in two or drop clauses. One idea per sentence.
29. **Active voice.** Prefer it. Catch "is/are/was/were + past participle" and name the actor: "queries are validated" becomes "the compiler validates queries", "the file is parsed by the loader" becomes "the loader parses the file". Passive is fine only when the actor is unknown or genuinely doesn't matter.
30. **Cut adverbs, or use a stronger verb.** "runs quickly" becomes "is fast" or the number. "significantly improves" becomes the measured delta. An adverb propping up a weak verb means the verb is wrong.
31. **Prefer the plain word.** "utilize" becomes "use", "leverage" becomes "use", "facilitate" becomes "help", "numerous" becomes "many", "in the event that" becomes "if". The fancier synonym is rarely clearer.

---

# Create a verification skill

Every serious project needs a scripted way to drive the real app and prove behavior: launch it, exercise a feature the way a user would, and capture evidence. This skill generates that as a project-local skill (`.cursor/skills/verify-<app>/`) tailored to the repo. You write the generator's output for the next agent, not for a human: it will be read cold, mid-task, by an agent that has never seen the app.

## 1. Interview the repo, not the user

Answer these from the codebase and only ask the user what you cannot observe:

- **Surface:** what does a user actually touch? A web UI, a CLI/TUI, a desktop app, an API, a mobile app, a library? A repo can have several; pick the primary one and note the rest.
- **Run:** how does the app start locally? Prefer the repo's own documented dev command (package scripts, Makefile, README quickstart). Note ports, env vars, seed data, auth.
- **Drive:** how can an agent interact with it programmatically? Existing harnesses first — Playwright/Cypress specs, expect scripts, PTY helpers, curl-able endpoints, a debug port. Only then pick a generic recipe: browser/CDP for web and Electron, a tmux/PTY harness for CLI/TUI, plain HTTP for services.
- **Observe:** what evidence can be captured? Screenshots, terminal transcripts, response bodies, logs, exit codes, DB state.
- **Isolate:** can two instances run side by side (ports, data dirs, profiles)? If not, say so in the generated skill: refusing to double-drive a shared instance beats corrupting the user's session.

If the checkout doesn't build or start as-is, fix that first (or report it precisely) before generating; a skill written against a broken base teaches wrong steps. When an irrelevant missing asset blocks startup (a static dir the API never serves, a sample config), the generated skill may create it, clearly marked as verification scaffolding, and remove it in cleanup.

## 2. Generate the skill

Write `.cursor/skills/verify-<app>/SKILL.md` with YAML frontmatter (`name: verify-<app>` and a `description` that names the app, the surface, and when to reach for it — without frontmatter the skill never registers) and these sections, each grounded in what the interview actually found (no placeholders left):

- **Launch:** the exact command that starts the app for verification, and how to tell it's ready (a log line, a port answering, a prompt). Include teardown. For a short-lived CLI or TUI there is no server to keep alive: launch means build the binary (or install deps) once, then start each drive in its own isolated PTY or tmux session.
- **Doctor:** one read-only check that answers "is this instance worth driving?" — process up, right version/build, port owned by us, auth valid. An agent runs this first whenever anything looks off.
- **Drive:** the harness recipe with real selectors/commands from this repo, not examples. Prefer stable handles (ARIA labels, data attributes, prompt strings, route paths) over coordinates and tab order.
- **Evidence:** what to capture for a proof and where it goes. State the proof standards: exercise the real user path, not internal setters or test-only endpoints; capture the action and the resulting state, not just the final screen; verify side effects (files written, rows inserted, messages sent) alongside what's visible; mocks only where a production boundary already isolates the external system. When the safe path is a dry-run or test mode, verify what it actually skips by observing (files, network, git refs) rather than trusting its name: some dry-runs still touch the network or open a browser.
- **Cleanup:** how to tear down instances the run created. Never kill by process name; kill what you started. Cleanup removes instances and scratch state, never the evidence: proof artifacts survive the teardown, in a location the skill names.
- **Helpers:** any script the skill ships is executable and its invocation is shown in the skill body. A helper the reader has to reverse-engineer is not a helper.

## 3. Seed the feature map

Create `.cursor/skills/verify-<app>/features/README.md` plus one file per user-facing feature you can identify (aim for the top 3-5 to start, from routes, commands, menus, or docs). Follow the shape in [`references/feature-map-example/`](references/feature-map-example/), with a README index and one file per feature. Each file answers, from the user's point of view: what the feature is, how to reach it, how to drive it with the harness, and what observable end state proves it works. The four H2s are `Sub-features`, `How to get to it (user POV)`, `Driving it with <harness>`, and `Gotchas`. The map is the repo's maintained verification source; a proof that drives one convenient entry point is incomplete when the map lists others.

## 4. Prove the generated skill before handing it over

Run its own instructions end to end once: launch, doctor, drive ONE mapped feature (one is enough; the map exists so later runs can cover the rest), capture evidence, clean up. After cleanup, confirm the evidence still exists at the named location — a cleanup that eats the proof fails this step. Fix what fails, and run the generated cleanup after every failed iteration too, so broken attempts don't strand processes and ports. A generated skill that was never executed is a draft, not a deliverable.

## 5. Offer the maintenance loop

Point the user at `/maintain-verification-skill` for keeping the map honest as the app changes. Suggest a cadence only if they ask.

---

# Maintain a verification skill

A feature map rots the moment the app changes. This skill is the upkeep loop for a skill generated by `/create-verification-skill` (or any project-local verification skill with a feature map). The unit of rigor is the feature, not every sentence: cover every feature file from source and exercise every feature live, without terminalising every bullet.

## Outcomes

Pick one, and say which:

- **clean** — every feature got source and live coverage; nothing worth shipping. No branch, no PR.
- **changed** — one PR ships proven doc, harness, or map corrections.
- **blocked** — coverage could not finish or a proven fix could not ship safely. Say exactly what blocked it.

## Edit scope

Only edit the verification skill's own directory (its SKILL.md, features/, and any harness scripts it owns). Never edit product code during a run: a behavior the map describes that the app no longer does is either doc drift (fix the map) or a product regression (report it, don't paper over it in docs).

## Pass

0. **Locate the target.** Find the verification skill to maintain: the project-local skill whose body has launch/drive sections and a feature map (usually `.cursor/skills/verify-*/`). Several candidates → ask which one; none → stop and point at `/create-verification-skill` instead of inventing a target.

1. **Index hygiene.** Read the feature map README and glob its sibling files. Fix missing, extra, duplicate, or dead entries. Lightweight; no generated inventory.

2. **Source wave.** One read-only subagent per feature file, launched concurrently. Each explains "how does this user-facing feature work?" from source, flags likely doc drift with citations, and returns one concise live-verification recipe. Children never drive the app and never edit files. Return shape: feature summary / source entry points / likely drift or none / one recipe.

3. **Reconcile.** Every feature file has a returned summary. Merge overlapping recipes into as few app states as practical. Spot-check cited drift; don't re-prove clean claims. Sweep recent churn for user-facing surfaces missing from the map — require a concrete source path before calling one missing.

4. **Live pass.** Required even when source looks clean. The coordinator owns all driving; follow the verification skill's own launch model — one long-lived instance driven serially for servers and UIs, or a fresh isolated session per drive for short-lived CLIs (the skill's Launch section decides, not this one). Exercise every feature at least once, and hold three invariants the whole pass, whatever the failure: (1) never drive an instance you haven't health-checked since it last did something surprising — doctor before first drive, doctor on each fresh session where sessions are the unit, doctor again after any failed drive, and where doctor can't see the failure (a wedged UI state on a healthy process), reset to a known state or relaunch rather than hoping; (2) evidence captured so far survives every cleanup, checked at its named location, not assumed; (3) nothing a drive started outlives that drive's usefulness — failed-iteration residue is cleaned whether the session is stuck, exited, or shared (for a shared instance, clean the residue, not the instance). A doctor failure caused by skill drift is drift: fix it under edit scope and retry once — restart whatever the fix invalidated, nothing more — before calling the pass `blocked`. A feature that can't be reached is `verified-unreachable` only with the concrete prerequisite (auth, entitlement, OS, external state) and the route attempted; if the map omits that prerequisite, that's drift. Any harness fix from triage gets re-driven live before it ships. Final teardown happens after the last drive of the run — including those re-proofs — so nothing outlives the run (evidence stays, per the skill).

5. **Triage.** Wrong or missing user-POV description → doc drift, fix it. Working behavior the harness can't drive → harness gap, fix it; a harness fix follows the same helpers rule as generation (scripts executable, invocation documented in the skill body). App behavior that's actually broken → product gap; record it for the user, keep it out of this PR.

6. **Ship or stop.** For changed: one PR of proven corrections, re-read every changed file first. For clean or blocked: no PR, report the outcome and the coverage honestly.

Keep concise run notes (features covered, unreachable prerequisites, confirmed drift, outcome) in a scratch location; don't commit them.

---

# How

Explore the codebase to answer "how does X work?" questions. Produce clear architectural explanations at the level of a senior engineer onboarding onto a subsystem. Enough to build a working mental model, not annotated source code.

Two modes:

1. **Explain** (default). Explore the codebase and produce a clear explanation
2. **Critique.** Explain first, then spawn multiple models to independently identify architectural issues

## Explain Mode

### Step 1. Understand the Question and Assess Complexity

Parse what the user is asking about:

- "How does the rate limiter work?", a subsystem
- "How do we handle billing for on-demand usage?", a feature flow
- "How is the auth service structured?", an architectural overview
- "Walk me through what happens when a user submits a form", a runtime trace

Identify the scope. If ambiguous, state your best-guess interpretation before exploring. Don't ask. Let the user redirect if you're off.

**Assess complexity to decide the approach:**

- **Simple** (a single module, a small utility, a narrow question like "how does function X work"): skip explorer agents; the explainer explores and explains in a single pass. Go to Step 2b.
- **Complex** (a subsystem spanning multiple files/services, a cross-cutting feature, a full architectural overview): spawn parallel explorer agents first, then hand off to the explainer. Go to Step 2a.

When in doubt, lean simple. You can always spawn explorers if the explainer hits a wall.

### Step 2a. Explore (complex questions only)

Decompose the question into 2-4 parallel exploration angles, each a distinct slice of the subsystem so explorers don't duplicate work. Example split for "how does the rate limiter work?":

- Explorer 1: data model and state management
- Explorer 2: request path and enforcement
- Explorer 3: configuration and metrics infrastructure

The right decomposition depends on the question. Use your judgment. Narrow questions: 2 explorers is fine. Broad subsystems: up to 4.

Spawn all explorers in a single message:

- `subagent_type`: `generalPurpose`
- `model`: your configured how-explorer model (default `grok-4.6-fast-xhigh`)
- `readonly`: `true`

Each explorer gets the same base prompt from `references/explorer-prompt.md` plus a specific exploration angle naming its slice. Each explorer should:
- Start broad: Glob for relevant directories, Grep for key types/interfaces/class names
- Follow the thread: from an entry point, trace the call chain (callers, callees, data flow, type definitions)
- Read the actual code, don't guess from file names
- Stop when it can describe the full path from input to output (or trigger to effect) without hand-waving any step
- Note things that are surprising, non-obvious, or that a newcomer would get wrong

Each explorer returns structured findings: components found, flow traced, files read, anything non-obvious. Overlap between explorers is fine; the explainer reconciles.

Then proceed to Step 3.

### Step 2b. Direct Explain (simple questions)

Spawn a single Task subagent that explores and explains in one pass:

- `subagent_type`: `generalPurpose`
- `model`: your configured how-explainer model (default `claude-fable-5-1-thinking-max`)
- `readonly`: `true`

The agent does its own exploration (Glob, Grep, Read) and writes the explanation directly. Read `references/explainer-prompt.md` for the communication style and output format. Same structure, just no explorer findings as input.

Proceed to Step 4.

### Step 3. Synthesize (complex questions only)

Once all explorers return, spawn a single Task subagent to synthesize their findings into one coherent explanation:

- `subagent_type`: `generalPurpose`
- `model`: your configured how-explainer model (default `claude-fable-5-1-thinking-max`)
- `readonly`: `true`

The explainer gets all explorers' findings and writes the human-facing explanation (output format below). Read `references/explainer-prompt.md` for the full prompt template. The explainer reconciles overlapping findings, resolves contradictions, and weaves the slices into a unified picture.

### Step 4. Present

Present the explainer's output to the user. You may lightly edit for clarity or add context from the conversation, but don't substantially rewrite. The explainer's communication is the product.

### Output Format

Follow this structure, adapted to the question. Not every section is needed for every question.

**Overview.** 1-2 paragraphs. What it is, what it does, why it exists. Enough to decide whether to keep reading.

**Key Concepts.** The important types, services, or abstractions. Brief definition of each. Not exhaustive, just the ones needed to understand the rest.

**How It Works.** The core of the explanation. Walk through the flow: what triggers it, what happens step by step, where data goes, the decision points. Prose, not pseudocode. Reference specific files and functions so the reader can go look, but don't dump code blocks unless a snippet is genuinely necessary.

**Where Things Live.** A brief map of the relevant files/directories. Not every file, just the ones needed to start working in this area.

**Gotchas.** Non-obvious or surprising things that would trip someone up. Historical context that explains why something looks weird. Known sharp edges.

## Critique Mode

Triggered when the user asks for architectural issues, problems, or improvements, not just understanding.

### Step 1. Explain First

Run the full explain flow above (Steps 1-4). You must understand the architecture before critiquing it.

### Step 2. Spawn Critics

After the explanation is complete, spawn one architectural critic per model in your configured how-critics list (defaults `claude-fable-5-1-thinking-max`, `gpt-5.6-sol-max`, `grok-4.6-fast-xhigh`, `claude-opus-5-thinking-xhigh`), all in a single message.

For each critic:
- `subagent_type`: `generalPurpose`
- `model`: one model from the configured how-critics list. These are minimum reasoning levels. The lead should escalate any model when the architecture warrants deeper analysis.
- `readonly`: `true`

Read `references/critic-prompt.md` for the prompt template. Each critic gets:
1. The explanation from Step 1 (so they don't re-explore)
2. The relevant file paths (so they can read the actual code)
3. The architectural critique rubric from `references/critique-rubric.md`

### Step 3. Lead Judgment

Same framework as the interrogate skill. You're a pragmatic lead, not an aggregator.

Categorize findings:
- **Act on.** Architectural problems worth fixing now
- **Consider.** Real concerns, but the cost/benefit is unclear
- **Noted.** Valid observations, low priority
- **Dismissed.** Wrong, missing context, or style preference

Present the explanation first (from Step 1), then the critique verdict below it. The explanation should stand on its own; someone who just wants to understand the system shouldn't wade through critique.


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
