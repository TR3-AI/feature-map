# Memecoin virality trader — feature map
Source: maps/memecoin-virality-trader.md · issue #4 (TR3-AI/idea-slicer)
Updated: 2026-08-31
Features: 25

## Source list config
From: Callout intake
Feature:
1. A config file Bobby supplies listing the tracked traders/devs — the only sources whose callouts count.
2. The watcher loads this list at startup and keeps it in memory for every stream check.
3. Sources are referenced by plain names or handles — never keys, never secrets.
4. The Front-end UI shows the active list so Bobby can see exactly who is being watched.
Behaviour:
- The list can be edited between runs; a restart picks up the new version.
- An empty or missing list is a **safe failure**: the watcher picks up nothing, no candidates flow, no trades can happen.
- A source that stops existing (deleted account) stays in the list but simply produces no callouts.
Lifecycle:
1. TRIGGER: Bobby supplies or edits the list.
2. The list is stored in the config location the watcher reads.
3. On every run the watcher loads it and filters all incoming callouts against it.
4. END: The list is replaced the next time Bobby updates it; it never expires on its own.
Verification:
1. The tester agent opens the config view (ProofShot recording): Bobby's source list is visible.
2. It posts a test callout from a **listed** source: a candidate appears in the intake view.
3. It posts a test callout from an **unlisted** source: nothing appears.
Success: The visible list matches what Bobby supplied, and only listed sources ever produce candidates — all visible in the recording.
Failure: The list can't be displayed, or an unlisted source slips a candidate through — the filter is not really applied.

## Callout listener + normalizer
From: Callout intake
Feature:
1. A stream connection to pump.fun / FOMO watching for callouts from tracked sources.
2. A parser that extracts the four required fields from each callout: **coin address, attached tweet, timestamp, source**.
3. A validator that rejects malformed callouts (missing address, no timestamp) at intake.
4. An emitter that hands each valid, normalized candidate to the Virality scorer.
Behaviour:
- Runs continuously; a dropped stream reconnects and resumes without duplicating candidates.
- Malformed callouts are rejected with the reason logged — never passed downstream half-filled.
- Each callout produces exactly one candidate (deduplicated by address + timestamp).
Lifecycle:
1. TRIGGER: A callout arrives on a tracked stream.
2. The four fields are extracted and validated.
3. The normalized candidate is emitted to the Virality scorer.
4. END: The listener is done with this callout and waits for the next one; rejected callouts end in the reject log.
Verification:
1. The tester agent posts a test callout from a tracked source on the test stream (ProofShot recording).
2. In the intake view: the candidate appears with all four fields filled.
3. It posts a malformed test callout (no address): the reject log shows it with the reason.
Success: The good callout shows as a complete candidate within seconds; the bad one is visibly rejected with a reason.
Failure: The callout is posted but no candidate appears, a field is blank, or the malformed callout flows downstream.

## 30-day baseline builder
From: Virality scorer
Feature:
1. An X API pull of every tweet from the callout's account over the last 30 days.
2. Averaging of likes + retweets across those tweets into a single **baseline number**.
3. A history check: accounts with too little history are flagged, not averaged into a fake number.
4. The baseline is attached to the candidate for the multiplier gate.
Behaviour:
- Recomputed fresh per candidate — no caching between candidates.
- API rate limits pause the pull; the candidate waits, it is never scored with a partial baseline.
- The baseline, tweet count, and any flag are all visible for inspection.
Lifecycle:
1. TRIGGER: A normalized candidate arrives from Callout intake.
2. The 30-day tweet history is pulled via the X API.
3. The baseline is computed (or the low-history flag is set).
4. END: The candidate carries its baseline into the age-band multiplier gate.
Verification:
1. The tester agent feeds a test account with known tweet metrics (ProofShot recording).
2. The baseline on screen matches the average it computed by hand beforehand.
3. It feeds an account with almost no history: the flag shows, not a number.
Success: The displayed baseline equals the real 30-day average, and thin accounts are visibly flagged.
Failure: No baseline appears, the number disagrees with the hand check, or a thin account gets a confident fake number.

## Age-band multiplier gate
From: Virality scorer
Feature:
1. Gate 1 logic comparing the coin's tweet metrics against the baseline by **age band**: under 1h needs ≥3x, 1–6h needs ≥10x, 24h+ needs ≥50x.
2. Anything outside the bands — including 6–24h — is rejected outright.
3. Configurable threshold values (owner dependency, supplied with the X API access).
4. A reject log recording which band applied and why the verdict fired.
Behaviour:
- The gate is pure: same candidate + same baseline always produces the same verdict.
- Every reject carries its reason (failed band multiplier, or outside all bands).
- Boundary values follow the rule exactly (exactly 3x under 1h passes).
Lifecycle:
1. TRIGGER: A candidate arrives with its baseline attached.
2. The coin's age is read from its timestamp; the matching band is selected.
3. The tweet multiplier is compared against the band threshold.
4. END: Pass — the candidate goes to Narrative analysis; reject — logged with reason, candidate done.
Verification:
1. The tester agent sends four known candidates — 4x at 30min, 4x at 3h, 60x at 2 days, any multiplier at 12h (ProofShot recording).
2. The gate log shows pass, reject, pass, reject — each verdict with its band and reason.
Success: All four verdicts are correct, each with its band and reason visible in the recording.
Failure: Any candidate passes or rejects against the band rule, or a verdict appears with no reason attached.

## Grok analysis
From: Narrative analysis
Feature:
1. A call to Grok 4.6 (xAI API, Bobby's account) with the pre-generated prompt for every qualified candidate.
2. Extraction of five fields: **narrative, thesis, sentiment, veracity score, virality (attention) score** via X search.
3. Veracity and virality are kept as **separate score components** — never merged, never renamed into each other.
4. The extracted fields and both scores are attached to the candidate for the combined-score gate.
Behaviour:
- An API failure or timeout **blocks** the candidate — it never auto-passes.
- The prompt version is pinned; a prompt change is a deliberate edit, not drift.
- Every response is stored raw alongside the parsed fields for audit.
Lifecycle:
1. TRIGGER: A qualified candidate arrives from the Virality scorer (or a no-tweet candidate direct from Callout intake).
2. The pinned prompt + candidate data go to Grok 4.6.
3. The five fields and two separate scores are extracted and attached.
4. END: The scored candidate moves to the combined-score gate; API failures end as blocked with the error logged.
Verification:
1. The tester agent feeds a known test coin through the Grok call (ProofShot recording).
2. The analysis view shows all five fields filled, with veracity and virality as **two separate numbers**.
3. It kills the API on a test run: the candidate shows as blocked, not passed.
Success: All fields and both separate scores are visible; failures block visibly.
Failure: A field is empty, the two scores arrive merged, or an API failure lets the candidate through.

## Combined-score gate
From: Narrative analysis
Feature:
1. Gate 2 logic combining the Grok output into one score.
2. The **dual threshold**: with a tweet the combined score must be ≥6; with no tweet it must be >8.
3. A reject log recording the score and which threshold applied.
Behaviour:
- The combining formula is pinned — same inputs always give the same combined score.
- The tweet/no-tweet branch is chosen by the candidate's attached tweet field, nothing else.
- Rejects show score, threshold, and branch.
Lifecycle:
1. TRIGGER: A scored candidate arrives from the Grok analysis.
2. The branch is selected (tweet present or not).
3. The combined score is computed and compared against that branch's threshold.
4. END: Pass — to the Bundler checker; reject — logged with score and threshold, candidate done.
Verification:
1. The tester agent feeds four known scores — 6.5 with tweet, 5 with tweet, 8.5 without tweet, 7 without tweet (ProofShot recording).
2. The gate log shows pass, reject, pass, reject — each with score, branch, and threshold.
Success: All four verdicts match the dual rule with the applied threshold visible in the recording.
Failure: Any verdict contradicts the rule, or the wrong branch was used for a candidate.

## Bundler share pull
From: Bundler checker
Feature:
1. A query to the pinned chain-analytics provider for the wallets that bought in the creation block.
2. Calculation of their combined supply % **excluding program-owned accounts** (the bonding curve).
3. The counting method is pinned in one place — tools disagree on this number, so the method is part of the contract.
4. The bundler % is attached to the candidate.
Behaviour:
- If the provider is down or rate-limited, the candidate **waits** — it is never waved through without a number.
- The provider response is stored raw for audit against the computed %.
- A token whose creation block can't be read is flagged, not zeroed.
Lifecycle:
1. TRIGGER: A scored candidate arrives from Narrative analysis.
2. The provider pull runs against the pinned method.
3. The bundler % is computed and attached (or the candidate waits/flags on failure).
4. END: The candidate carries its bundler % into trend classification.
Verification:
1. The tester agent runs a test token with a known bundler setup (ProofShot recording).
2. The bundler % on screen matches the provider's own dashboard for that token — both shown side by side in the recording.
3. It blocks the provider on a test run: the candidate visibly waits, never advances.
Success: The displayed % matches the provider's number, and failures wait instead of passing.
Failure: No number appears, the number disagrees with the provider, or a provider failure lets the candidate through.

## Bundler trend classification
From: Bundler checker
Feature:
1. A read of the bundler share **over time** (not one snapshot) for the candidate token.
2. Classification into one of three labels: **decreasing, stagnating, or increasing** (0% ideal).
3. The trend label is attached to the candidate for the bundler gate.
Behaviour:
- A single snapshot classifies as **unknown**, never as safe.
- The window and thresholds for "stagnating" are pinned in the contract.
- The label plus the underlying readings are both visible for inspection.
Lifecycle:
1. TRIGGER: A candidate arrives with its bundler % attached.
2. The share history is read over the pinned window.
3. The trend label is computed and attached.
4. END: The candidate carries its label into the bundler gate.
Verification:
1. The tester agent feeds a token with a visibly decreasing share and one with a rising share (ProofShot recording).
2. The labels on screen match the trend visible in the data.
3. It feeds a token with only one reading: the label shows "unknown", not a safe one.
Success: Both trending tokens get the correct label, and single-snapshot tokens show unknown.
Failure: A rising share is labelled decreasing, or a single snapshot passes as a real trend.

## Bundler gate
From: Bundler checker
Feature:
1. Gate 3 logic: reject anything over **10–15% bundlers** (below 10% preferred).
2. The trend modifier: an **increasing** share is rejected harder — low is good, rising is bad.
3. A reject log recording the %, the trend, and the exact rule that fired.
Behaviour:
- The gate is strict: no overrides, no "close enough".
- Every verdict shows the numbers behind it (%, trend, rule).
- The preferred band (<10%) vs tolerated band (10–15%) distinction is visible in the log.
Lifecycle:
1. TRIGGER: A candidate arrives with bundler % and trend label.
2. The % and trend are checked against the rule.
3. END: Pass — to Signal & trigger; reject — logged with %, trend, and fired rule, candidate done.
Verification:
1. The tester agent feeds three known candidates — 5% decreasing, 20% decreasing, 12% increasing (ProofShot recording).
2. The gate log shows pass, reject, reject — each with %, trend, and fired rule.
Success: All three verdicts are correct with full reasons visible in the recording.
Failure: An over-limit or increasing candidate passes — the direction of the rule is broken.

## Divergence watcher
From: Signal & trigger
Feature:
1. A chart feed (pinned provider) supplying OHLC + OBV + RSI from the call-out moment.
2. Divergence detection: price makes new lows while OBV or RSI does not — **either oscillator works, both together is stronger**.
3. Patterns (descending triangle/pennant) are **parked** — divergence only, per the signal change.
4. On detection, the watcher hands off to the divergence alert.
Behaviour:
- The watch always starts anchored to the call-out price and time.
- Detection strength (one oscillator vs both) is recorded with the signal.
- A replayed chart always produces the same detection — the logic is deterministic.
Lifecycle:
1. TRIGGER: A clean candidate arrives from the Bundler checker — the watch starts.
2. Candles stream in; OBV and RSI are tracked against price pivots.
3. A divergence is spotted → hand-off to the alert emitter.
4. END: Divergence spotted (alert path), or a staleness guard fires (watch ends, no alert).
Verification:
1. The tester agent points the watcher at a replayed chart with a known OBV divergence (ProofShot recording).
2. The flag appears with the oscillator named and the strength recorded.
3. It replays a chart with no divergence: nothing is flagged.
Success: The known divergence is caught and named; the clean replay stays quiet — both visible in the recording.
Failure: The known divergence is missed, or a flat chart produces a signal.

## Staleness guards
From: Signal & trigger
Feature:
1. A **distance guard**: stop tracking if price runs +30% from the call-out.
2. A **time guard**: stop tracking if more than 15 one-minute candles pass.
3. The two guards are combinable — either one firing ends the watch.
4. The stop reason (distance or time) is logged with the watch.
Behaviour:
- Guards tick on every incoming candle; there is no path where a watch lives forever.
- The stop is final for that candidate — it does not resume later.
- Guard parameters (+30%, 15 candles) are pinned, not drifting config.
Lifecycle:
1. TRIGGER: The divergence watch starts — both guards arm.
2. Each candle updates distance-from-call-out and candle count.
3. A guard fires → the watch ends with the reason logged.
4. END: Watch stopped (guard fired) — the candidate is done; or the watch ends earlier via a divergence (alert path).
Verification:
1. The tester agent replays a chart running +31% with no divergence (ProofShot recording): the watch stops with reason "distance".
2. It replays 16 flat candles: the watch stops with reason "time".
3. It drops the price back after the stop: the watch does not resume.
Success: Both replays end the watch with the correct reason, and stopped watches stay stopped — all in the recording.
Failure: A watch runs past a guard, stops with the wrong reason, or quietly resumes.

## Divergence alert
From: Signal & trigger
Feature:
1. Assembly of the alert payload: coin, gate scores, which oscillator diverged, freshness (age of the divergence).
2. The **pre-filled size** from the Position manager's fractional Kelly calculation, attached to the payload.
3. Delivery to the Front-end UI — once per candidate, never duplicated.
Behaviour:
- The alert never asks Bobby to pick a number — the size arrives pre-filled.
- Freshness decays as candles pass; the payload carries the age so the UI can show it.
- One candidate = one alert; re-detections on the same candidate do not re-fire.
Lifecycle:
1. TRIGGER: The divergence watcher spots a divergence.
2. The payload is assembled; the Position manager's pre-computed size is attached.
3. The alert is delivered to the Front-end UI.
4. END: The alert waits in the UI for Bobby — resolved by his click or his ignore.
Verification:
1. The tester agent triggers a test divergence end-to-end (ProofShot recording).
2. The alert arrives in the UI with every field filled, including the pre-filled size.
3. It triggers the same divergence again: no second alert appears.
Success: One complete alert arrives — coin, oscillator, freshness, size — and never duplicates.
Failure: The alert is missing, has empty fields, arrives without a size, or fires twice.

## Alert display
From: Front-end UI
Feature:
1. An alert card in the UI showing: coin, which oscillator diverged, freshness, gate scores, and the **pre-filled size**.
2. Layout designed for the phone (the primary screen): glanceable in seconds, no zooming, no sideways scroll.
3. Newest alert on top; resolved alerts archive out of the way.
Behaviour:
- The card is read-only — the only actions are BUY or ignore, nothing editable.
- A stale alert shows its age honestly; it does not look fresher than it is.
- Multiple alerts stack in arrival order.
Lifecycle:
1. TRIGGER: An alert payload arrives from Signal & trigger.
2. The card renders with all fields.
3. Bobby decides: BUY (moves to the buy path) or ignore (logs "no trade").
4. END: The card resolves and archives, whatever Bobby chose.
Verification:
1. The tester agent opens the UI on a phone-width screen with a test alert waiting (ProofShot recording).
2. Every field is readable without zooming or sideways scrolling.
3. It resolves the alert: the card archives and leaves the active list.
Success: The full alert is glanceable on the phone and archives cleanly after a decision — all recorded.
Failure: Fields are cut off or unreadable, or a resolved alert stays in the active list.

## BUY button
From: Front-end UI
Feature:
1. One obvious BUY button on the alert card — the only way money ever moves.
2. One click sends the buy click to the Position manager, executing **exactly the pre-filled size** — no typing, no sizing at the button.
3. Guard states: disabled with no alert present; single-fire (no double-click double-buy).
4. Ignoring the alert is a first-class choice and logs "no trade".
Behaviour:
- The button shows the size it will execute — what you see is what you buy.
- A second tap while the first is in flight does nothing (idempotent).
- Without an alert, the button is visibly disabled.
Lifecycle:
1. TRIGGER: Bobby taps BUY (or chooses to ignore).
2. The buy click travels to the Position manager with the pre-filled size.
3. The Position manager takes over — the button's job is done.
4. END: Click registered (automation path) or alert ignored (no-trade log).
Verification:
1. The tester agent checks the button on a phone-width screen (ProofShot recording): tappable with an alert present, greyed out without one.
2. It taps once: the Position manager receives exactly one buy click with the shown size.
3. It ignores the next alert: "no trade" appears in the log.
Success: One tap = one buy click with the shown size; ignoring logs cleanly; no double-fires — all recorded.
Failure: The button can't be tapped, fires twice, sends a different size than shown, or the click never arrives.

## Positions + moon bag view
From: Front-end UI
Feature:
1. A positions view reading the Position manager's feed: open positions with their stop and ladder state.
2. A separate **moon bag section** — the bag's manual home: view it, sell it manually, nothing automatic.
3. Live updates from position events (fills, ladder steps) without a refresh.
Behaviour:
- Read-only except the moon bag's manual sell — no other edits possible here.
- The moon bag is never auto-sold by anything shown in this view.
- Flat positions leave the view; the moon bag stays until Bobby sells it himself.
Lifecycle:
1. TRIGGER: A position opens (first entry fill).
2. The view shows the position and updates on every fill and ladder event.
3. At 2x, the moon bag appears as a separate, manual-only holding.
4. END: The position leaves the view when flat; the moon bag ends only on Bobby's manual sell.
Verification:
1. The tester agent opens the positions view with a test position running on devnet (ProofShot recording): stop and ladder state are visible.
2. It runs the position to 2x: the moon bag appears separately, marked manual-only.
3. It closes the rest: the position clears, the moon bag remains.
Success: The recording shows the live position, then the separate moon bag that outlives the automation.
Failure: The position doesn't appear, the moon bag vanishes after 2x, or something auto-sells the bag.

## Venue router
From: Trade executor
Feature:
1. A routing decision per order: which chain lists this coin — **Solana or the Robinhood Chain** (EVM L2).
2. Hand-off of the order to the matching chain adapter with the correct wallet keys.
3. The venue is recorded on every fill report.
Behaviour:
- Routing is by listing, never by guess: an unroutable coin **blocks** the order with a reason.
- Each venue uses its own wallet keys (secret names, never raw).
- The routing decision is visible per order, before and after execution.
Lifecycle:
1. TRIGGER: A sized order arrives from the Position manager.
2. The listing check picks the venue (or blocks with a reason).
3. The order goes to that chain's adapter.
4. END: The fill report carries the venue; a blocked order ends with the reason logged.
Verification:
1. The tester agent sends a test order for a Solana-only coin and one for a Robinhood Chain coin (ProofShot recording).
2. Each fill report shows the correct venue.
3. It sends an unroutable test coin: the order blocks with the reason shown.
Success: Each order lands on the right chain with the venue named; unroutable coins block visibly.
Failure: An order goes to the wrong chain, the venue isn't recorded, or an unroutable coin gets forced through.

## Entry execution
From: Trade executor
Feature:
1. Transaction construction for the entry when the sized order arrives — **only after Bobby's click**; the alert alone never spends money.
2. Signing with the venue wallet keys (referenced by secret name, never stored raw).
3. Submission to the chain and capture of the fill (price, size, venue).
4. Failure handling: a failed transaction is reported, never silently retried.
Behaviour:
- Exactly one entry per buy click — replayed clicks don't re-enter.
- The fill is verified on-chain before being reported.
- Every failure surfaces with the chain's error, not a generic "something went wrong".
Lifecycle:
1. TRIGGER: The sized order arrives from the Position manager (post-click).
2. The transaction is built, signed, and submitted on the routed venue.
3. The fill (or failure) is captured.
4. END: Fill reported to Position manager + journal; failure reported with the chain error.
Verification:
1. The tester agent clicks buy on a devnet test alert (ProofShot recording).
2. The fill appears in the fill feed with size, price, and venue.
3. It clicks again on the same alert: no second entry appears.
Success: One click produces one on-chain fill matching the pre-filled size; re-clicks do nothing — all recorded.
Failure: The click produces no fill, a fill appears without any click, or one click enters twice.

## Immediate stop-loss
From: Trade executor
Feature:
1. Placement of the **30% stop-loss** order on the exchange at the exact moment of entry — the automation starts here.
2. The stop lives on the exchange as a real, inspectable order — not just a note in the bot.
3. While active it can be cancelled or adjusted (front end or back end).
4. It cancels itself automatically when the 2x rule fires.
Behaviour:
- If the stop placement fails, the position is treated as unprotected and the failure is surfaced immediately.
- The stop's price is always entry −30%; adjustments are deliberate actions, logged.
- Market vs limit behaviour is pinned in the executor contract (a limit stop needs a trigger price).
Lifecycle:
1. TRIGGER: The entry fill confirms (bot path) — or a manual placement via the UI/API (manual path). Two trigger points.
2. The stop order is placed on the exchange at entry −30%.
3. It sits live: cancellable, adjustable, inspectable.
4. END: Hit (position sold), cancelled at 2x, or placement failed (alerted) — three end states.
Verification:
1. The tester agent enters on devnet, then opens the exchange's open-orders list (ProofShot recording): the stop shows at entry −30%.
2. It cancels the stop manually: it disappears from the exchange.
3. It runs a position to 2x: the stop cancels itself — the recording shows it vanish with no manual action.
Success: The stop is visible on the exchange, cancellable by hand, and self-cancels at 2x — every step recorded.
Failure: The entry fills but no stop exists on the exchange — no proof of protection beyond the bot's word.

## Sell-into-volume filter
From: Trade executor
Feature:
1. A pre-trade check on every exit order: is there **buy pressure** — green candles with real volume?
2. Execution only into qualifying candles; never into a red tape.
3. Retry logic: a clip that can't fill into volume waits and retries — it is never dumped.
Behaviour:
- The qualification rule (green candle + volume threshold) is pinned in the contract.
- Waiting is visible: a pending exit shows why it hasn't filled.
- The filter applies to every exit type — clips and stops alike.
Lifecycle:
1. TRIGGER: An exit order arrives (clip from the ladder, or stop trigger).
2. The volume check runs against the current tape.
3. Qualifying candle → fill; red tape → wait and retry.
4. END: Fill reported with the candle it filled on; abandoned only if the position state changes first.
Verification:
1. The tester agent replays a green-volume window (ProofShot recording): the exit fills.
2. It replays a red window: the exit waits — no fill prints.
3. The pending exit shows its waiting state while the tape stays red.
Success: The exit fills in the green window and visibly holds through the red one — both in the recording.
Failure: A sell prints on a red candle, or a waiting exit vanishes instead of pending.

## Fill reporting
From: Trade executor
Feature:
1. One event per fill — entry, stop, clip — on the frozen fill-event schema.
2. Delivery to both consumers: the Position manager (ladder state) and the Trade journal (record).
3. Acknowledged delivery: reporting retries until both consumers confirm.
Behaviour:
- One fill = exactly one event; no duplicates, no gaps.
- A missed fill corrupts the ladder — so unacknowledged events keep retrying and raise visibly.
- The event carries everything downstream needs: size, price, venue, time, order type.
Lifecycle:
1. TRIGGER: A fill executes on-chain.
2. The fill event is built on the frozen schema.
3. It is delivered to Position manager and Trade journal; both acknowledge.
4. END: Event acknowledged and stored; unacknowledged events escalate.
Verification:
1. The tester agent executes a devnet entry plus one clip (ProofShot recording).
2. The journal feed shows both fills with matching sizes and prices.
3. The Position manager's ladder state advances on both.
Success: Every on-chain fill appears once in both places, exactly as executed — verifiable in the recording.
Failure: A fill executed on-chain is missing from the journal or the ladder — a silent gap.

## Fractional Kelly sizer
From: Position manager
Feature:
1. The sizing calculation: **fractional Kelly** — a safer slice of the Kelly-optimal size — run when the alert fires.
2. Bobby's inputs (owner dependency): bankroll, win-rate + payoff estimates, chosen fraction (half? quarter?).
3. The size is attached to the alert so the UI shows it pre-filled.
4. The Grok score is **never an input** — Grok decides whether, Kelly decides how much.
Behaviour:
- Missing Kelly inputs → no size is shown; the alert says so instead of guessing.
- Same inputs + same odds always produce the same size (deterministic).
- The calculation and its inputs are inspectable per alert.
Lifecycle:
1. TRIGGER: A divergence alert fires.
2. The fractional Kelly size is computed from the pinned inputs.
3. The size is attached to the alert payload.
4. END: The size executes as-is on Bobby's click; or the alert dies unclicked and the size with it.
Verification:
1. The tester agent pins test inputs (bankroll, win-rate, payoff, fraction) and fires a test alert (ProofShot recording).
2. The pre-filled size matches the fractional Kelly number it computed by hand beforehand.
3. It removes the inputs: the alert shows "no size — inputs missing", not a guess.
Success: The alert's size equals the hand check, and missing inputs produce an honest empty state.
Failure: The size disagrees with the hand check, or the system invents a size when inputs are missing.

## 2x capital recovery
From: Position manager
Feature:
1. A price watch on the open position for the **2x mark** from entry.
2. At 2x: a sell order withdrawing exactly the initial capital, routed through the sell-into-volume filter.
3. Simultaneous cancellation of the stop-loss order on the exchange.
4. After firing, the position runs on house money — the ladder continues with moon bag + clips.
Behaviour:
- Fires exactly once per position.
- The withdrawal amount equals the initial capital, not "about" the initial.
- If the withdrawal can't fill into volume, it keeps trying — the stop stays live until the initial is out.
Lifecycle:
1. TRIGGER: Price reaches 2x from entry.
2. The initial-capital sell executes into volume.
3. The stop-loss is cancelled on the exchange.
4. END: Initial secured — the position continues on house money; the 2x rule never fires again on this position.
Verification:
1. The tester agent runs a devnet position to 2x (ProofShot recording).
2. The withdrawal fill appears, equal to the initial capital.
3. The exchange's open-orders list no longer shows the stop.
Success: At 2x the initial is visibly out and the stop is gone from the exchange — both in the recording.
Failure: Price crosses 2x and the initial is still in, or the stop is still live on the exchange.

## Moon bag rule
From: Position manager
Feature:
1. After 2x, **20% of the remaining position** is flagged as the moon bag in the position state.
2. The flag is exclusion: the clip ladder and every automatic exit skip the bag.
3. The bag's home is the Front-end UI — view it, sell it manually; no automation touches it.
Behaviour:
- The bag is untouchable by every automatic path — clips, stops, everything.
- The bag's size is fixed at flag time; ladder math never recalculates it.
- The only end for the bag is Bobby's manual sell.
Lifecycle:
1. TRIGGER: The 2x rule fires.
2. 20% of the remainder is flagged as the moon bag.
3. The bag lives in the UI as a manual-only holding through every later exit.
4. END: Bobby sells it himself — the only way it ever ends.
Verification:
1. The tester agent runs a devnet position past 2x (ProofShot recording): the moon bag shows in the UI, marked manual-only.
2. It runs the ladder to completion: the bag is still there, untouched.
3. It sells the bag manually from the UI: it closes, logged as a manual sell.
Success: The bag survives every automatic exit and moves only on a manual action — all recorded.
Failure: An automatic exit sells into the bag, or the bag can't be sold manually.

## Divergence clip ladder
From: Position manager
Feature:
1. A bearish-divergence listener (from Signal & trigger) active while the position runs.
2. On each bearish divergence: a **15–20% clip** sell of the remaining position, moon bag excluded.
3. Clips route through the sell-into-volume filter — never into red candles.
4. The ladder stops when only the moon bag remains.
Behaviour:
- One clip per divergence — a repeated signal on the same divergence doesn't double-clip.
- Clip size is of the remaining position at that moment, excluding the bag.
- Every clip updates the position state for the next rung.
Lifecycle:
1. TRIGGER: A bearish divergence arrives while the position is open.
2. The clip order is sized (15–20% of remaining, bag excluded).
3. The clip fills into volume; the position state updates.
4. END: Only the moon bag remains (ladder done) or the position closes another way first.
Verification:
1. The tester agent replays two bearish divergences on a devnet position (ProofShot recording).
2. Two clip fills appear, each 15–20% of the then-remaining position, each into a green candle.
3. The moon bag is untouched after both.
Success: Both clips fill at the right size into volume; the bag is intact — all in the recording.
Failure: A divergence passes with no clip, a clip prints on red, or a clip eats the moon bag.

## Trade journal
From: Trade journal
Feature:
1. One append-only record per trade, opened when the callout arrives.
2. Every department writes through the shared event schema: gate verdicts, the alert, Bobby's click, every fill, every ladder step.
3. A queryable view: the whole trade replays in order from the journal alone.
Behaviour:
- Append-only: events are never edited or deleted, only added.
- One schema for all departments — no department invents its own event shape.
- The record closes when the position is flat, noting any surviving moon bag.
Lifecycle:
1. TRIGGER: A callout arrives — the record opens.
2. Every event across all nine departments appends in order.
3. The position goes flat (or the candidate dies at a gate).
4. END: The record closes, complete, with the moon bag noted if one survives.
Verification:
1. The tester agent runs one full devnet trade end to end (ProofShot recording).
2. The journal shows every step in order — gates, alert, click, fills, ladder — with no gaps.
3. It cross-checks two events against the exchange and the UI: they match.
Success: The complete trade replays from the journal alone, matching reality.
Failure: Any event that happened is missing from the record, or the journal disagrees with the exchange.
