# Candidate Record

The shared record a normalized candidate becomes the moment Callout Intake hands it off — one object that carries a single coin through all three qualification gates in a fixed order, picking up one stamp per gate, until it closes Clean or Rejected-at-gate-X. Candidate Qualification's other three features (Virality Gate, Narrative Gate, Bundler Gate) are computations that read and stamp this record; the record itself is what makes "one shared candidate, three gates" an observable, queryable thing rather than three departments quietly passing a blob between them.

## Sub-features

- `create` instantiates the record the instant a normalized candidate arrives from Callout Intake.
- `stamp` appends exactly one immutable entry per gate — name, verdict, reason if rejected — never overwriting a prior stamp.
- `advance` only lets the record reach gate N+1 once gate N's stamp reads pass; gates can't be skipped or reordered.
- `terminal` closes the record into exactly one of two end states: Clean or Rejected-at-gate-X.
- `candidate-view` surfaces every record's current stage and full stamp history, per coin.

## How to get to it (user POV)

- The candidate view / qualification queue — lists every in-flight and closed candidate with its current stage; opening any coin shows its full stamp-by-stamp history.

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** a normalized candidate (coin address, attached tweet or none, timestamp, source) arrives from Callout Intake.
2. **Mechanism:** the record is created with a unique ID and an append-only stamp log, then handed to Virality Gate first. This is the same shape as a case object moving through a loan-underwriting or fraud/AML review queue: one case ID, one sequential path through fixed review stages, and — per how real case-management platforms defend against exactly this — a status history that is machine-written and append-only (one row per stage transition, never edited in place) rather than a single mutable "current status" field. Each gate independently looks the record up by ID, does its own external work (X API, Grok, chain analytics), and writes back exactly one stamp for its own name before the record moves on; no gate ever touches another gate's stamp.
3. **Delivery:** the record itself is the only hand-off contract between the three independently-owned gates — each gate receives the same record by ID, not a copy, so its stamp lands on the one shared object and the next gate reads that stamp before it will run. (Exact storage — a database row, an event-sourced log, a queue message keyed by ID — is PRE-BUILD until the app repo exists; the append-only stamp-log *shape* is the pinned contract regardless of storage.)
4. **Surface:** the candidate view / qualification queue — current stage plus the full stamp history, open per coin.
5. **Breaks:** a record stuck mid-pipeline with no owner and no visible stuck/timeout state (the loan-underwriting failure mode: exceptions that can't route cleanly get worked around outside the system, and the audit trail goes with them) · a stamp applied twice by a racing double-evaluation of the same gate · a record that reads Clean or sits at gate N+1 without gate N's stamp ever actually reading pass — the documented real-world bug class where a conductor performs the visible action a gate calls for but the underlying write that persists it never lands, so the audit trail under-records what happened and downstream readers trust a state that never truly occurred · a reject stamp that writes its verdict but silently drops the reason field, leaving a reject nobody can audit.

Existence: this is a standard case-management / workflow-engine pattern — loan origination systems and AML/fraud review platforms already run one case object through fixed sequential stages with a machine-written, append-only status history for exactly this auditability reason; BPM engines (jBPM, Oracle BPM, ServiceNow Flow Designer's sequential approvals) implement the same one-record-many-gates shape natively.
Deviations from standard: production case-management systems assume a human caseworker who can manually reassign, escalate, or override a stuck case — Candidate Record has no such person; all three gates execute unattended, and the only human touchpoint in the whole pipeline is Trader Console's buy click, far downstream of this record's terminal state. "Stuck with no owner" here is therefore a structural question (does anything dead-letter or surface a hung gate call?), not a staffing gap. Tester action: don't look for a reassign/escalate control on the candidate view — verify instead that a candidate whose gate call hangs shows a distinguishable in-flight/stuck state, not a spinner indistinguishable from "just created."

## Test stream

Preconditions:

- Candidate view / qualification queue visible; ProofShot recording; the ability to feed the record pre-computed gate verdicts directly (this file tests the record's own bookkeeping — creation, stamping, advancing, closing — not the Virality/Narrative/Bundler gates' own math, which live in their own feature files); one scripted candidate that clears all three gates and one scripted to fail at the second gate.

1. **Candidate Record works end to end.** Run the clean-path candidate through all three gates and the fail-at-gate-2 candidate through its two gates, then open both in the candidate view.
   Success: the clean candidate shows Clean with all three stamps in order, and the rejected candidate shows Rejected-at-gate-2 with exactly two stamps — the second carrying its reject reason — both visible in the recording.
   Failure: either candidate shows the wrong terminal state, a missing stamp, a reject with no reason, or the rejected candidate carries a third gate's stamp it never should have reached.
2. **create.** Feed a normalized candidate from Callout Intake and immediately open the candidate view before any gate runs.
   Success: a record appears right away with the callout's fields (coin address, tweet or none, timestamp, source) and an empty stamp log, sitting at Virality Gate.
   Failure: no record appears, a field is missing, or the record already shows a stamp before any gate has run.
3. **stamp.** Force the same gate to evaluate the same candidate twice (a simulated race/retry).
   Success: the stamp log still shows exactly one entry for that gate — the second evaluation is rejected or ignored, never appended as a duplicate stamp.
   Failure: the stamp log shows two entries for the same gate, or the second write silently overwrites the first with different values.
4. **advance.** Attempt to force a candidate to Bundler Gate while Virality Gate's stamp is still missing or shows fail.
   Success: the record refuses to advance — it stays at Virality Gate (or closes Rejected-at-gate-1) and never shows a Bundler Gate stamp without a passing Virality Gate stamp first.
   Failure: the record shows a later gate's stamp despite the earlier gate never actually reading pass.
5. **terminal.** Run one candidate to a full Clean close and one to a Rejected-at-gate-1 close, then try to re-feed the rejected candidate's same coin/tweet pair through the pipeline again.
   Success: the two terminal states are visibly distinct (Clean vs Rejected-at-gate-X with reason), and the re-fed rejected candidate does not silently resume or skip into a later gate.
   Failure: the terminal states look identical, the reason is missing from the rejected close, or the re-fed candidate advances past where it was rejected.
6. **candidate-view.** With several candidates at different stages and outcomes seeded, open the queue.
   Success: the queue lists every candidate's current stage at a glance, and opening any one coin shows its complete, correctly ordered stamp history.
   Failure: a candidate is missing from the queue, its stage is wrong, or its stamp history is incomplete or out of order.

## Gotchas

- A rejected record is terminal — re-feeding the same coin/tweet pair must never let it resume from where it left off or skip into a gate it already failed.
- A dropped reject reason is a failure even when the reject verdict itself is correct — check the reason field, not just pass/fail.
- A no-tweet candidate still gets a Virality Gate stamp (that gate's own bypass/pass-through verdict, not a hole in the history) — a Clean record always shows exactly three stamps; a two-stamp "Clean" is itself a bug, not a shortcut.
- Research note: production case-management systems typically expose a human caseworker who can manually intervene mid-pipeline; this record has no such override. Tester action: verify a hung gate call surfaces as a distinguishable stuck/in-flight state on the candidate view — never assume "no manual override needed" also means "no stuck-state handling needed."
