# Memecoin virality trader — P-stack pass — feature map
Source: maps/memecoin-pstack.md · issue #13 (TR3-AI/idea-slicer)
Updated: 2026-09-07
Features: 23


## Source List Config
From: Callout Intake
Feature:
1. A config file Bobby supplies, listing the tracked traders and devs. Only callouts from sources on this list count.
2. The watcher loads this list at startup and keeps it in memory for every stream check.
3. Sources are referenced by plain names or handles, never keys, never secrets.
4. A config view in the UI shows the active list, so Bobby can see exactly who is being watched.
Behaviour:
- The list can be edited between runs; a restart picks up the new version.
- An empty or missing list is a **safe failure**: the watcher picks up nothing, no candidates flow, no trades can happen.
- A source that stops existing (deleted account) stays in the list but simply produces no callouts.
Lifecycle:
1. TRIGGER: Bobby supplies or edits the list.
2. The list is stored in the config location the watcher reads.
3. On every run the watcher loads it and filters all incoming callouts against it.
4. END: The list is replaced the next time Bobby updates it. It never expires on its own.
Verification:
1. The tester agent opens the config view (ProofShot recording): Bobby's source list is visible.
2. It posts a test callout from a **listed** source: a candidate appears in the intake view.
3. It posts a test callout from an **unlisted** source: nothing appears.
Success: The visible list matches what Bobby supplied, and only listed sources ever produce candidates. All of it is visible in the recording.
Failure: The list can't be displayed, or an unlisted source slips a candidate through. The filter is not really applied.

## Callout Listener & Normalizer
From: Callout Intake
Feature:
1. A stream connection to pump.fun / FOMO watching for callouts from tracked sources.
2. A parser that extracts the four required fields from each callout: **coin address, attached tweet, timestamp, source**.
3. A validator that rejects malformed callouts (missing address, no timestamp) at intake.
4. An emitter that hands each valid, normalized candidate to Candidate Qualification, opening a new Candidate Record.
Behaviour:
- Runs continuously; a dropped stream reconnects and resumes without duplicating candidates.
- Malformed callouts are rejected with the reason logged. They are never passed downstream half-filled.
- Each callout produces exactly one candidate (deduplicated by address + timestamp).
Lifecycle:
1. TRIGGER: A callout arrives on a tracked stream.
2. The four fields are extracted and validated.
3. The normalized candidate is emitted to Candidate Qualification, which opens its Candidate Record.
4. END: The listener is done with this callout and waits for the next one; rejected callouts end in the reject log.
Verification:
1. The tester agent posts a test callout from a tracked source on the test stream (ProofShot recording).
2. In the intake view: the candidate appears with all four fields filled.
3. It posts a malformed test callout (no address): the reject log shows it with the reason.
Success: The good callout shows as a complete candidate within seconds; the bad one is visibly rejected with a reason.
Failure: The callout is posted but no candidate appears, a field is blank, or the malformed callout flows downstream.

## Candidate Record
From: Candidate Qualification
Feature:
1. A record is created the instant a normalized candidate arrives from Callout Intake, seeded with its coin address, attached tweet (or none), timestamp, and source.
2. An append-only stamp log on the record: each gate, Virality, Narrative, and Bundler, writes exactly one stamp bearing its name, its verdict, and, on reject, the reason. No gate ever overwrites a prior stamp.
3. An advance rule: the record only reaches the next gate once the current gate's stamp reads pass; a gate can never be skipped, reordered, or re-run once stamped.
4. Two exclusive terminal states: Clean, once all three gates have passed, forwarded to Divergence Signal with the call-out time and price; or Rejected-at-gate-X, closed the moment any gate's stamp reads fail, forwarded to Trade Journal with that stamp's reason.
5. A candidate view / qualification queue surfacing every record's current stage and its complete stamp history, queryable per coin.
Behaviour:
- The stamp log only grows. No stamp is ever edited or removed once written, the same append-only discipline a real case-management audit trail relies on.
- A no-tweet candidate still receives a Virality Gate stamp. It is a documented bypass verdict, not a missing one, so a Clean record always shows exactly three stamps, never two.
- A record can sit "in-flight" waiting on a gate's own external dependency (X API, Grok, chain analytics); the candidate view shows that honestly rather than looking identical to a fresh, unstamped record.
- A rejected record is terminal: it never re-enters a later gate, even if the same coin/tweet pair is fed through the pipeline again.
Lifecycle:
1. TRIGGER: a normalized candidate arrives from Callout Intake.
2. The record is created and enters Virality Gate first.
3. Each gate runs in fixed order, first Virality, then Narrative, then Bundler. Each reads the record, does its own work, and writes exactly one stamp before handing the record on.
4. END: Clean, all three stamps read pass, forwarded to Divergence Signal; or Rejected-at-gate-X, the first failing stamp closes the record immediately, forwarded to Trade Journal with the reason.
Verification:
1. The tester agent drives one candidate to a full Clean close and a second to a Rejected-at-gate-2 close end to end (ProofShot recording), then opens both in the candidate view.
2. It checks each stamp log in order, three passing stamps for the clean candidate, exactly two stamps (pass, then a named reject reason) for the rejected one, and confirms the rejected candidate never shows a third gate's stamp. It then forces a duplicate evaluation of one gate to confirm the log still shows only one stamp for it.
Success: The candidate view shows the clean candidate closed Clean with all three gate stamps present and correctly ordered, and the rejected candidate closed Rejected-at-gate-2 with exactly two stamps and a visible reason on the second. A forced duplicate gate evaluation still produces only one stamp for that gate, all inside the recording.
Failure: Either candidate shows the wrong terminal state, a missing or out-of-order stamp, a reject with no reason attached, a rejected candidate carrying a stamp from a gate it never should have reached, or a duplicate gate evaluation produces two stamps for the same gate.

## Virality Gate
From: Candidate Qualification
Feature:
1. A 30-day X API pull of the callout account's tweet history, averaged into a baseline number of likes + retweets. Recomputed fresh per candidate, never cached, never reused across candidates.
2. A history check on that pull: an account with too little tweet history is flagged and fails closed with a named reason, instead of being averaged into a misleadingly confident baseline.
3. An age-band comparison for candidates with a tweet: the callout tweet's own engagement must clear a multiplier over the baseline set by the coin's age. Under 1 hour needs ≥3x, 1–6 hours needs ≥10x, 24 hours or more needs ≥50x. Anything outside those three bands, including 6–24 hours, rejects outright with no band applying.
4. A no-tweet bypass: a candidate with no attached tweet skips the baseline and age-band comparison entirely and moves straight to Narrative Gate, but still receives this gate's own bypass stamp.
5. A verdict log recording every outcome, whether pass, reject, or bypass, together with the band, multiplier, and baseline that produced it, feeding the candidate record's first stamp.
Behaviour:
- The gate is pure given its inputs: the same tweet metrics and the same baseline always produce the same verdict.
- API rate limits pause the pull rather than letting the candidate score against a partial 30-day window; the candidate waits for the full history, it is never scored short.
- Boundary values follow the rule exactly. Exactly 3x under 1 hour passes, 2.9x does not.
- Every verdict, including a pass or a bypass, carries its supporting numbers; a bare pass or reject with nothing behind it is itself a defect.
Lifecycle:
1. TRIGGER: a freshly created candidate record reaches this gate, first in the sequence.
2. No tweet attached: the gate stamps its bypass verdict and hands the record to Narrative Gate immediately.
3. Tweet attached: the 30-day baseline is pulled and averaged (or the low-history flag fires), the coin's age selects its band, and the callout tweet's engagement is compared against that band's multiplier.
4. END: Pass, the record moves to Narrative Gate; reject, the record closes Rejected-at-gate-1 with the reason logged; bypass, the record moves to Narrative Gate with this gate's pass-through stamp already written.
Verification:
1. The tester agent sends four known candidates through the gate, 4x at 30 minutes, 4x at 3 hours, 60x at 2 days, any multiplier at 12 hours, plus a thin-history candidate and a no-tweet candidate (ProofShot recording).
2. It reads the candidate view for all six: verdict, band, multiplier, and baseline for each, then separately forces an X API rate limit mid-pull to confirm the pull pauses and resumes instead of scoring a partial window.
Success: The candidate view shows pass, reject, pass, reject for the four age-band candidates, a fail-closed reject naming insufficient history for the thin account, and a bypass stamp for the no-tweet candidate that still lets it proceed to Narrative Gate. Each verdict shows its band, multiplier, and baseline, and the rate-limited pull visibly resumes rather than completing on a partial page, all in the recording.
Failure: Any age-band verdict contradicts the rule, a verdict is missing its supporting numbers, the thin-history account receives a confident baseline instead of failing closed, the no-tweet candidate is left with no stamp at all for this gate, or a rate-limited pull scores off a partial page.

## Narrative Gate
From: Candidate Qualification
Feature:
1. A call to Grok 4.6 (xAI API, Bobby's account) with the pinned, versioned prompt for every candidate that reaches this gate, whether it arrived via a Virality Gate pass/bypass or with no tweet at all.
2. Extraction of five fields via structured-output/JSON-mode enforcement: narrative, thesis, sentiment, a veracity score, and a virality (attention) score via X search.
3. An app-side schema validator on top of that structured response checks that required fields are present and that veracity and virality are two distinct in-range numbers, with a bounded retry before a hard, fail-closed block. A dead API and a schema-valid-but-wrong-shape response are both treated as the same failure.
4. Veracity and virality stay separate score components through extraction and combination. Neither is ever merged or renamed into the other.
5. A branch selection from the candidate's tweet field alone: present and non-empty picks the tweet threshold, absent or empty-but-present both pick the no-tweet threshold.
6. A dual-threshold comparison: the combined score must be ≥6 with a genuine tweet, >8 without one.
7. A verdict log recording every outcome, pass or reject, with the combined score, the branch, and the threshold that applied, feeding the candidate record's second stamp.
Behaviour:
- An API failure or a schema-violating response blocks the candidate. It never auto-passes, and the two failure kinds are logged distinguishably.
- The prompt version is pinned; a prompt change is a deliberate edit, not silent drift.
- Every raw Grok response is stored alongside the parsed fields and scores for audit.
- The combining formula is pinned. The same two scores always produce the same combined number.
- The branch is chosen by the tweet field's presence and non-emptiness alone, nothing else about the candidate.
Lifecycle:
1. TRIGGER: a candidate arrives from Virality Gate, having either passed there with a tweet attached or bypassed there with no tweet attached.
2. The pinned prompt and candidate data go to Grok 4.6; the five fields and two separate scores are extracted and schema-validated.
3. The branch is selected from the tweet field, the two scores combine into one number, and that number is compared against the branch's threshold.
4. END: Pass, the record moves to Bundler Gate; reject, the record closes Rejected-at-gate-2 with the score, branch, and threshold logged; API/schema failure, the record blocks with the specific error, never advancing.
Verification:
1. The tester agent feeds four known combined-score candidates through the gate, 6.5 with a tweet, 5 with a tweet, 8.5 without a tweet, 7 without a tweet, plus the exact threshold boundaries and tweet-field edge cases (present-but-empty vs. absent) (ProofShot recording).
2. It separately kills the API on one run and, on another, forces a 200 response that fails schema validation, checking that both show the candidate blocked with a specific, distinguishable error rather than a silent stall or an auto-pass.
Success: All four scored candidates verdict correctly against the dual rule with the branch and threshold visible, the boundary values (6.0/5.9, 8.0/8.01) land on the correct side of their thresholds, the empty-but-present tweet field is treated as the no-tweet branch, both extracted scores stay visibly separate throughout, and both the dead-API and the schema-violating-200 cases show the candidate blocked with a specific error. All of this is visible in the recording.
Failure: Any verdict contradicts the dual rule, either score is merged into the other at any point, the wrong branch is applied to a candidate, a verdict is logged without its score/branch/threshold, or either failure case (dead API or schema-violating response) lets the candidate advance or blocks with no visible reason.

## Bundler Gate
From: Candidate Qualification
Feature:
1. A query to the pinned chain-analytics provider for the wallets that bought in the candidate token's creation block, for every candidate that reaches this final gate.
2. Calculation of their combined supply % excluding program-owned accounts (the bonding curve), using one pinned counting method. Tools disagree on this number, so the method itself is part of the contract.
3. A wait-not-wave-through rule: if the provider is rate-limited or down, the candidate waits for a real number; it is never scored with a zeroed or invented %.
4. A bot-built trend read of that % over a pinned polling window, classified as decreasing, stagnating, or increasing. A single snapshot always classifies as unknown, never a safe label, since providers only sell point-in-time snapshots.
5. A ceiling rule rejecting anything over 10–15% bundlers (below 10% preferred, exactly 15% tolerated).
6. A direction modifier stacked on top of the ceiling: an increasing share is rejected even at a % that would otherwise be tolerated, because low is good and rising is bad regardless of the raw number.
7. A verdict log recording every outcome, pass or reject, with the %, the trend, and the exact rule that fired, closing the candidate record's third stamp into Clean or Rejected-at-gate-3.
Behaviour:
- The pull is against one pinned provider and counting method only. A different tool's number is expected to disagree and is never used as a cross-check inside the gate itself.
- The gate is strict: no overrides, no "close enough" on the ceiling.
- A single bundler-share reading is never treated as a trend. The underlying readings are visible alongside the label so a tester can confirm the label matches what the data actually shows.
- Every verdict shows the numbers behind it: %, trend, and the specific rule that fired. The preferred band (<10%), the tolerated band (10–15%), and the reject band are all visibly distinct.
Lifecycle:
1. TRIGGER: a candidate arrives at this gate having passed (or bypassed) Virality Gate and passed Narrative Gate.
2. The provider pull runs against the pinned method; the bundler % is computed with the bonding curve excluded (or the candidate waits/flags on a provider failure).
3. The share is polled again over the pinned window to produce a trend label, then the % and trend are checked together against the ceiling-plus-direction rule.
4. END: Pass, the candidate record closes Clean, forwarded to Divergence Signal with the call-out time and price; reject, the record closes Rejected-at-gate-3 with the %, trend, and fired rule logged, forwarded to Trade Journal.
Verification:
1. The tester agent feeds three known candidates through the gate, 5% decreasing, 20% decreasing, 12% increasing, plus a token pinned exactly at the 15% ceiling boundary, and a single-snapshot token (ProofShot recording).
2. It opens the underlying readings alongside each trend label to confirm the label matches the data, then blocks and later restores the provider mid-pull to confirm the candidate waits and resumes with a fresh number rather than a stale or fabricated one.
Success: The three known candidates verdict pass, reject, reject with the %, trend, and fired rule all visible; the exact 15% boundary passes rather than rejects; the single-snapshot token shows unknown rather than any real trend; and the blocked provider produces a visible wait followed by a fresh, not stale, not fabricated, number on restore. All of this is visible in the recording.
Failure: Any of the three known verdicts is wrong, the 15% boundary rejects as if the ceiling were inclusive, an increasing candidate passes at any %, a single-snapshot token gets a real trend label, or a blocked provider lets the candidate advance without a genuine number.

## Divergence Watcher
From: Divergence Signal
Feature:
1. A chart feed (pinned provider) supplying OHLC + OBV + RSI from the call-out moment.
2. Divergence detection: price makes new lows while OBV or RSI does not. Either oscillator works; both together is stronger.
3. Chart patterns (descending triangle, pennant) are parked; divergence only.
4. On detection, the watcher hands off to the Divergence Alert.
Behaviour:
- The watch always starts anchored to the call-out price and time.
- Detection strength (one oscillator vs both) is recorded with the signal.
- A replayed chart always produces the same detection; the logic is deterministic.
Lifecycle:
1. TRIGGER: A clean candidate arrives from the Bundler Gate. The watch starts.
2. Candles stream in; OBV and RSI are tracked against price pivots.
3. A divergence is spotted → hand-off to the Divergence Alert.
4. END: Divergence spotted (alert path), or a staleness guard fires (watch ends, no alert).
Verification:
1. The tester agent points the watcher at a replayed chart with a known OBV divergence (ProofShot recording).
2. The flag appears with the oscillator named and the strength recorded.
3. It replays a chart with no divergence: nothing is flagged.
Success: The known divergence is caught and named; the clean replay stays quiet. Both are visible in the recording.
Failure: The known divergence is missed, or a flat chart produces a signal.

## Staleness Guards
From: Divergence Signal
Feature:
1. A distance guard: stop tracking if price runs +30% from the call-out.
2. A time guard: stop tracking if more than 15 one-minute candles pass.
3. The two guards are combinable: either one firing ends the watch.
4. The stop reason (distance or time) is logged with the watch.
Behaviour:
- Guards tick on every incoming candle; there is no path where a watch lives forever.
- The stop is final for that candidate; it does not resume later.
- Guard parameters (+30%, 15 candles) are pinned, not drifting config.
Lifecycle:
1. TRIGGER: The divergence watch starts. Both guards arm.
2. Each candle updates distance-from-call-out and candle count.
3. A guard fires → the watch ends with the reason logged.
4. END: Watch stopped (guard fired), the candidate is done; or the watch ends earlier via a divergence (alert path).
Verification:
1. The tester agent replays a chart running +31% with no divergence (ProofShot recording): the watch stops with reason "distance".
2. It replays 16 flat candles: the watch stops with reason "time".
3. It drops the price back after the stop: the watch does not resume.
Success: Both replays end the watch with the correct reason, and stopped watches stay stopped. All of it is in the recording.
Failure: A watch runs past a guard, stops with the wrong reason, or quietly resumes.

## Divergence Alert
From: Divergence Signal
Feature:
1. Assembly of the alert payload: coin, gate scores, which oscillator diverged, freshness (age of the divergence).
2. The pre-filled size from the Fractional Kelly Sizer's calculation in Position & Exit Ladder, attached to the payload.
3. Delivery to the Trader Console: once per candidate, never duplicated.
Behaviour:
- The alert never asks Bobby to pick a number; the size arrives pre-filled.
- Freshness decays as candles pass; the payload carries the age so the console can show it.
- One candidate = one alert; re-detections on the same candidate do not re-fire.
Lifecycle:
1. TRIGGER: The Divergence Watcher spots a divergence.
2. The payload is assembled; the Fractional Kelly Sizer's pre-computed size is attached.
3. The alert is delivered to the Trader Console.
4. END: The alert waits in the console for Bobby, resolved by his click or his ignore.
Verification:
1. The tester agent triggers a test divergence end-to-end (ProofShot recording).
2. The alert arrives in the console with every field filled, including the pre-filled size.
3. It triggers the same divergence again: no second alert appears.
Success: One complete alert arrives with coin, oscillator, freshness, and size, and it never duplicates.
Failure: The alert is missing, has empty fields, arrives without a size, or fires twice.

## Alert Display
From: Trader Console
Feature:
1. An alert card in the UI showing: coin, which oscillator diverged, freshness, gate scores, and the pre-filled size.
2. Layout designed for the phone (the primary screen): glanceable in seconds, no zooming, no sideways scroll.
3. Newest alert on top; resolved alerts archive out of the way.
Behaviour:
- The card is read-only. The only actions are BUY or ignore; nothing on it is editable.
- A stale alert shows its age honestly; it does not look fresher than it is.
- Multiple alerts stack in arrival order.
Lifecycle:
1. TRIGGER: An alert payload arrives from Divergence Signal.
2. The card renders with all fields.
3. Bobby decides: BUY (moves to the buy path) or ignore (logs "no trade").
4. END: The card resolves and archives, whatever Bobby chose.
Verification:
1. The tester agent opens the UI on a phone-width screen with a test alert waiting (ProofShot recording).
2. Every field is readable without zooming or sideways scrolling.
3. It resolves the alert: the card archives and leaves the active list.
Success: The recording shows the full alert glanceable on the phone, then the card archiving cleanly once Bobby decides.
Failure: Fields are cut off or unreadable, or a resolved alert stays in the active list.

## Buy Button
From: Trader Console
Feature:
1. One obvious BUY button on the alert card. It is the only way money ever moves.
2. One click sends the buy click to Position & Exit Ladder, executing exactly the pre-filled size. No typing, no sizing at the button.
3. Guard states: disabled with no alert present; single-fire (no double-click double-buy).
4. Ignoring the alert is a first-class choice and logs "no trade".
Behaviour:
- The button shows the size it will execute. What you see is what you buy.
- A second tap while the first is in flight does nothing (idempotent).
- Without an alert, the button is visibly disabled.
Lifecycle:
1. TRIGGER: Bobby taps BUY (or chooses to ignore).
2. The buy click travels to Position & Exit Ladder with the pre-filled size.
3. Position & Exit Ladder takes over; the button's job is done.
4. END: The buy click reaches Position & Exit Ladder, or the alert is ignored and logged as no trade.
Verification:
1. The tester agent checks the button on a phone-width screen (ProofShot recording): tappable with an alert present, greyed out without one.
2. It taps once: Position & Exit Ladder receives exactly one buy click with the shown size.
3. It ignores the next alert: "no trade" appears in the log.
Success: The recording shows one tap sending exactly one buy click at the size shown, and an ignored alert logging cleanly as no trade, with no double-fires.
Failure: The button can't be tapped, fires twice, sends a different size than shown, or the click never arrives.

## Positions & Moon Bag View
From: Trader Console
Feature:
1. A positions view reading Position & Exit Ladder's feed: open positions with their stop and ladder state.
2. A separate moon bag section, the bag's manual home. View it, sell it manually; nothing automatic.
3. Live updates from position events (fills, ladder steps) without a refresh.
Behaviour:
- Read-only except the moon bag's manual sell. No other edits are possible here.
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

## Venue Router
From: Trade Execution
Feature:
1. A routing decision per order, based on which chain lists this coin: Solana or the Robinhood Chain (EVM L2).
2. Hand-off of the order to the matching chain adapter with the correct wallet keys.
3. The venue is recorded on every fill report.
Behaviour:
- Routing is by listing, never by guess: an unroutable coin blocks the order with a reason.
- Each venue uses its own wallet keys (secret names, never raw).
- The routing decision is visible per order, before and after execution.
Lifecycle:
1. TRIGGER: A sized order arrives from Position & Exit Ladder.
2. The listing check picks the venue (or blocks with a reason).
3. The order goes to that chain's adapter.
4. END: The fill report carries the venue; a blocked order ends with the reason logged.
Verification:
1. The tester agent sends a test order for a Solana-only coin and one for a Robinhood Chain coin (ProofShot recording).
2. Each fill report shows the correct venue.
3. It sends an unroutable test coin: the order blocks with the reason shown.
Success: Each order lands on the right chain with the venue named; unroutable coins block visibly.
Failure: An order goes to the wrong chain, the venue isn't recorded, or an unroutable coin gets forced through.

## Entry Execution
From: Trade Execution
Feature:
1. Transaction construction for the entry when the sized order arrives, but only after Bobby's click. The alert alone never spends money.
2. Signing with the routed venue's wallet key, selected upstream by Venue Router.
3. Submission to the chain and capture of the fill (price, size, venue).
4. Failure handling: a failed transaction is reported, never silently retried.
Behaviour:
- Exactly one entry per buy click. Replayed clicks don't re-enter.
- The fill is verified on-chain before being reported.
- Every failure surfaces with the chain's error, not a generic "something went wrong".
Lifecycle:
1. TRIGGER: The sized order arrives from Position & Exit Ladder (post-click).
2. The transaction is built, signed, and submitted on the routed venue.
3. The fill (or failure) is captured.
4. END: A fill hands off to Fill Reporting; a failure ends with the chain's error surfaced instead.
Verification:
1. The tester agent clicks buy on a devnet test alert (ProofShot recording).
2. The fill appears in the fill feed with size, price, and venue.
3. It clicks again on the same alert: no second entry appears.
Success: One click produces one on-chain fill matching the pre-filled size. A re-click produces nothing, both outcomes visible in the recording.
Failure: The click produces no fill, a fill appears without any click, or one click enters twice.

## Immediate Stop-Loss
From: Trade Execution
Feature:
1. A 30% stop-loss armed at the exact moment of entry. The automation starts here.
2. The stop is enforceable, not just a note in the bot. On a venue with native stop orders (the Robinhood Chain perps venue, Lighter, has reduce-only SL/TP) it rests on the venue's own engine, inspectable and firing independent of the bot; on a Solana memecoin spot venue (pump.fun / PumpSwap) it is a bot-armed trigger that fires a market sell on breach.
3. While active it can be cancelled or adjusted (front end or back end).
4. It cancels itself automatically when the 2x rule fires.
Behaviour:
- If the stop placement fails, the position is treated as unprotected and the failure is surfaced immediately.
- The stop's price is always entry −30%; adjustments are deliberate actions, logged.
- The stop mechanism is pinned per venue in the executor contract: a native venue stop order (market or limit, where a limit stop needs a trigger price) where the venue offers one, otherwise a bot-armed market sell. The source pins only Solana and Robinhood Chain adapters, so the exact order type and the user-proof surface are PRE-BUILD.
Lifecycle:
1. TRIGGER: The entry fill confirms (bot path), or a manual placement happens via the UI/API (manual path): two trigger points.
2. The stop is armed at entry −30% on the routed venue (a native venue order, or a bot-armed trigger).
3. It stays armed: cancellable, adjustable, and provable on the routed venue's own surface.
4. END: Hit (position sold), cancelled at 2x, or placement failed (alerted): three end states.
Verification:
1. The tester agent enters on devnet, then opens the routed venue's own proof surface (ProofShot recording): on a native-stop venue (Robinhood Chain perps, Lighter) the open-orders list shows the stop at entry −30%; on a Solana spot venue the bot's armed trigger is shown, and on breach the market-sell swap that closes the position.
2. It cancels the stop manually: the native order or armed trigger is gone from that surface.
3. It runs a position to 2x: the stop cancels itself. The recording shows it vanish with no manual action.
Success: The stop is provably armed on the routed venue's own surface, cancellable by hand, and self-cancels at 2x. Every step is recorded.
Failure: The entry fills but no enforceable stop exists (no native resting order and no armed trigger): no proof of protection beyond the bot's word.

## Sell-Into-Volume Filter
From: Trade Execution
Feature:
1. A pre-trade check on every exit Position & Exit Ladder routes here, the 2x withdrawal and each divergence clip: is there buy pressure, a green candle with real volume?
2. Execution only into qualifying candles; never into a red tape.
3. Retry logic: an exit that can't fill into volume waits and retries. It is never dumped.
Behaviour:
- The qualification rule (green candle + volume threshold) is pinned in the contract.
- Waiting is visible: a pending exit shows why it hasn't filled.
- The filter covers every automatic ladder exit. It never gates the stop-loss, which fires on the exchange on its own, independent of this check.
Lifecycle:
1. TRIGGER: An exit order arrives from Position & Exit Ladder: the 2x withdrawal or a divergence clip.
2. The volume check runs against the current tape.
3. Qualifying candle → fill; red tape → wait and retry.
4. END: Fill reported with the candle it filled on; abandoned only if the position state changes first.
Verification:
1. The tester agent replays a green-volume window (ProofShot recording): the exit fills.
2. It replays a red window: the exit waits. No fill prints.
3. The pending exit shows its waiting state while the tape stays red.
Success: The exit fills in the green window and visibly holds through the red one, both shown in the recording.
Failure: A sell prints on a red candle, or a waiting exit vanishes instead of pending.

## Fill Reporting
From: Trade Execution
Feature:
1. One event per fill (entry, stop, or clip) on the frozen fill-event schema.
2. Delivery to both consumers: Position & Exit Ladder (ladder state) and Trade Journal (record).
3. Acknowledged delivery: reporting retries until both consumers confirm.
Behaviour:
- One fill = exactly one event; no duplicates, no gaps.
- A missed fill corrupts the ladder, so unacknowledged events keep retrying and raise visibly.
- The event carries everything downstream needs: size, price, venue, time, order type.
Lifecycle:
1. TRIGGER: A fill executes on-chain.
2. The fill event is built on the frozen schema.
3. It is delivered to Position & Exit Ladder and Trade Journal; both acknowledge.
4. END: Event acknowledged and stored; unacknowledged events escalate.
Verification:
1. The tester agent executes a devnet entry, runs a second position to its stop trigger, and takes one divergence clip (ProofShot recording).
2. The journal feed shows all three fills with matching sizes and prices.
3. Position & Exit Ladder's ladder state advances on each.
Success: Every on-chain fill (entry, stop, or clip) appears once in both places, exactly as executed, verifiable in the recording.
Failure: A fill executed on-chain is missing from the journal or the ladder: a silent gap.

## Position Record
From: Position & Exit Ladder
Feature:
1. A position ledger created the moment Bobby's buy click sends the Kelly-sized entry order, populated with a real quantity and cost basis once the entry fill confirms.
2. A running realized/unrealized split and live quantity, updated one fill at a time off the frozen fill-event schema, whether the fill is the 2x withdrawal, a clip, or a stop-loss.
3. Serialized mutation so two triggers landing close together never both compute their size off the same stale remainder.
4. A permanent moon-bag carve-out, held out of the sellable remainder the instant the Moon Bag Rule flags it.
5. A periodic reconciliation check against the venue's own position/balance record, surfacing any drift instead of trusting internal state indefinitely.
6. A terminal close, flat via the ladder (moon bag aside) or fully closed via an early stop-loss, with the result handed to the Trade Journal.
Behaviour:
- No open position exists until the entry fill actually confirms. A click alone never shows a position.
- Quantity, realized, and unrealized all move together, fill by fill; none of them is inferred from the others alone.
- The moon-bag quantity is fixed the moment it's flagged and never re-enters the ladder's math.
- A drift against the venue's own position surfaces as a visible mismatch, never a silent overwrite.
- Two near-simultaneous triggers apply one after the other, never against the same stale remainder.
Lifecycle:
1. TRIGGER: Bobby's buy click sends the Kelly-sized entry order.
2. The entry fill confirms. The record opens for real with a live quantity and cost basis (a click whose entry never lands leaves no open position).
3. Fills post one at a time, whether the 2x withdrawal, the moon-bag flag, a divergence clip, or a stop-loss. The record's quantity and realized/unrealized split advance after every one, checked periodically against the venue's own position.
4. END: flat via the full ladder, sellable remainder at zero, moon bag left running, result logged; or fully closed via an early stop-loss fill before 2x ever fired, no moon bag ever carved, result logged.
Verification:
1. The tester agent clicks buy on a devnet test alert and drives it through entry, 2x, the moon-bag flag, and two clips to flat, watching the Positions view and the venue's own position record throughout (ProofShot recording).
2. It replays two exit triggers landing together (the 2x withdrawal and a clip) and checks the record's quantity/realized figures reflect both applied in sequence, never double-counted.
3. It forces one fill event to drop before reaching the record and confirms the resulting mismatch against the venue's own position surfaces rather than sitting silent.
4. It runs a second position to an early stop-loss close and confirms no moon bag ever appears, since 2x never fired.
Success: the Positions view's quantity, realized/unrealized split, and moon-bag carve-out track every fill exactly, concurrent triggers never double-count, a forced drift surfaces visibly, and both the ladder-flat and early-stop paths log a single closing result, all in the recording.
Failure: the tracked quantity disagrees with the fills that actually landed, a double-counted clip or a silent drift against the venue's position goes unflagged, or a position closes without a logged result (or logs one twice).

## Fractional Kelly Sizer
From: Position & Exit Ladder
Feature:
1. The sizing calculation is **fractional Kelly**, a safer slice of the Kelly-optimal size, run when the alert fires.
2. Bobby's inputs (owner dependency): bankroll, win-rate + payoff estimates, chosen fraction (half? quarter?).
3. The size is attached to the alert so the UI shows it pre-filled.
4. The Grok score is **never an input**. Grok decides whether, Kelly decides how much.
Behaviour:
- Missing Kelly inputs → no size is shown; the alert says so instead of guessing.
- A zero or negative edge (win-rate × payoff at or below break-even) produces that same honest empty state, never a negative or nonsensical size.
- Same inputs + same odds always produce the same size (deterministic).
- The calculation and its inputs are inspectable per alert.
Lifecycle:
1. TRIGGER: A divergence alert fires.
2. The fractional Kelly size is computed from the pinned inputs.
3. The size is attached to the alert payload.
4. END: The size executes as-is on Bobby's click, opening the Position Record at that size; or the alert dies unclicked and the size with it.
Verification:
1. The tester agent pins test inputs (bankroll, win-rate, payoff, fraction) and fires a test alert (ProofShot recording).
2. The pre-filled size matches the fractional Kelly number it computed by hand beforehand.
3. It removes the inputs, and separately fires an alert with inputs that imply no real edge: both show the honest empty state, never a guess.
Success: the alert's size equals the hand check, and both missing inputs and a no-edge input set produce the same honest empty state.
Failure: the size disagrees with the hand check, or the system invents a size, or shows a negative one, when inputs are missing or imply no edge.

## 2x Capital Recovery
From: Position & Exit Ladder
Feature:
1. A price watch on the open position for the **2x mark** from entry.
2. At 2x: a sell order withdrawing exactly the initial capital, routed through the sell-into-volume filter.
3. Simultaneous cancellation of the stop-loss order on the exchange.
4. After firing, the position runs on house money. The ladder continues with moon bag + clips against the shared Position Record.
Behaviour:
- Fires exactly once per position.
- The withdrawal amount equals the initial capital, not "about" the initial.
- If the withdrawal can't fill into volume, it keeps trying. The stop stays live until the initial is out.
Lifecycle:
1. TRIGGER: Price reaches 2x from entry.
2. The initial-capital sell executes into volume.
3. The stop-loss is cancelled on the exchange.
4. END: Initial secured, the Position Record's realized/unrealized split updates and the position continues on house money; the 2x rule never fires again on this position.
Verification:
1. The tester agent runs a devnet position to 2x (ProofShot recording).
2. The withdrawal fill appears, equal to the initial capital.
3. The exchange's open-orders list no longer shows the stop.
Success: At 2x the initial is visibly out and the stop is gone from the exchange, both in the recording.
Failure: Price crosses 2x and the initial is still in, or the stop is still live on the exchange.

## Moon Bag Rule
From: Position & Exit Ladder
Feature:
1. Once the 2x withdrawal confirms, **20% of the remaining position** is flagged as the moon bag in the shared Position Record.
2. The flag is exclusion: the clip ladder and every automatic exit skip the bag.
3. The bag's home is Trader Console's Positions & Moon Bag View, where Bobby views it and sells it manually. No automation touches it.
Behaviour:
- The bag is untouchable by every automatic path, including clips, stops, everything.
- The bag's size is fixed at flag time; ladder math never recalculates it.
- The only end for the bag is Bobby's manual sell.
Lifecycle:
1. TRIGGER: The 2x withdrawal fill confirms.
2. 20% of the remainder is flagged as the moon bag on the Position Record.
3. The bag lives in the Positions & Moon Bag View as a manual-only holding through every later exit.
4. END: Bobby sells it himself, the only way it ever ends.
Verification:
1. The tester agent runs a devnet position past 2x (ProofShot recording): the moon bag shows in the UI, marked manual-only.
2. It runs the ladder to completion: the bag is still there, untouched.
3. It sells the bag manually from the UI: it closes, logged as a manual sell.
Success: The bag survives every automatic exit and moves only on a manual action, all recorded.
Failure: An automatic exit sells into the bag, or the bag can't be sold manually.

## Divergence Clip Ladder
From: Position & Exit Ladder
Feature:
1. A bearish-divergence listener (from Divergence Signal) active while the position runs.
2. On each bearish divergence: a **15–20% clip** sell of the remaining position, moon bag excluded.
3. Clips route through the sell-into-volume filter and never into red candles.
4. The ladder stops when only the moon bag remains.
Behaviour:
- One clip per divergence. A repeated signal on the same divergence doesn't double-clip.
- Clip size is of the remaining position at that moment, excluding the bag.
- Every clip updates the Position Record for the next rung.
Lifecycle:
1. TRIGGER: A bearish divergence arrives while the position is open.
2. The clip order is sized (15–20% of remaining, bag excluded).
3. The clip fills into volume; the Position Record updates.
4. END: Only the moon bag remains (ladder done) or the position closes another way first.
Verification:
1. The tester agent replays two bearish divergences on a devnet position (ProofShot recording).
2. Two clip fills appear, each 15–20% of the then-remaining position, each into a green candle.
3. The moon bag is untouched after both.
Success: Both clips fill at the right size into volume; the bag is intact, all in the recording.
Failure: A divergence passes with no clip, a clip prints on red, or a clip eats the moon bag.

## Trade Journal
From: Trade Journal
Feature:
1. One append-only record per trade, opened when the callout arrives.
2. Every department writes through the shared event schema: gate verdicts, the alert, Bobby's click, every fill, every ladder step.
3. A queryable view: the whole trade replays in order from the journal alone.
Behaviour:
- Append-only: events are never edited or deleted, only added.
- One schema for all departments. No department invents its own event shape.
- The record closes when the position is flat, noting any surviving moon bag.
Lifecycle:
1. TRIGGER: A callout arrives. The record opens.
2. Every event across all seven departments appends in order.
3. The position goes flat (or the candidate dies at a gate).
4. END: The record closes, complete, with the moon bag noted if one survives.
Verification:
1. The tester agent runs one full devnet trade end to end (ProofShot recording).
2. The journal shows every step in order, gates, alert, click, fills, ladder, with no gaps.
3. It cross-checks two events against the exchange and the UI: they match.
Success: The complete trade replays from the journal alone, matching reality.
Failure: Any event that happened is missing from the record, or the journal disagrees with the exchange.
