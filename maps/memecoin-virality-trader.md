# Memecoin virality trader — feature map
Source: maps/memecoin-virality-trader.md · issue #4 (TR3-AI/idea-slicer)
Updated: 2026-08-31
Features: 25

## Source list config
From: Callout intake
Feature: The list of tracked traders/devs — only callouts from these sources count. Build: a config Bobby supplies, stored by secret-free name, loaded by the watcher at startup.
Behaviour: Can be edited between runs; an empty or missing list means the watcher picks up nothing (safe failure — no candidates, no trades).
Lifecycle: Bobby supplies the list → stored → loaded on every run → replaced when Bobby updates it.
Verification:
1. Bobby opens the config view and sees his list of sources.
2. A callout from a listed source produces a candidate; a callout from an unlisted source does not.
Success: The list is visible and only listed sources produce candidates.
Failure: The list can't be shown, or an unlisted source slips a candidate through.

## Callout listener + normalizer
From: Callout intake
Feature: Watches pump.fun / FOMO streams and turns each callout into a normalized candidate: coin address, attached tweet, timestamp, source.
Behaviour: Runs continuously; a malformed callout (missing address) is rejected at intake, never passed downstream.
Lifecycle: Callout arrives on a tracked stream → normalized → emitted to the Virality scorer → done for this callout.
Verification:
1. Post a test callout from a tracked source on the test stream.
2. The candidate appears in the intake view with all four fields filled.
Success: The test callout shows up as a complete candidate within seconds.
Failure: The callout is posted but no candidate appears, or fields are blank.

## 30-day baseline builder
From: Virality scorer
Feature: Captures every tweet from the callout's account over 30 days and averages likes + retweets into a baseline.
Behaviour: Recomputed per candidate; an account with too little history is flagged, not averaged into a fake number.
Lifecycle: Candidate arrives → 30-day pull via X API → baseline number attached → passed to the multiplier gate.
Verification:
1. Feed a test account with known tweet metrics.
2. The baseline shown matches the hand-computed average.
Success: The displayed baseline equals the real 30-day average for the test account.
Failure: No baseline appears, or the number doesn't match the hand check.

## Age-band multiplier gate
From: Virality scorer
Feature: Gate 1 — the coin's tweet must beat the baseline by the age-band multiplier: under 1h ≥3x, 1–6h ≥10x, 24h+ ≥50x; anything else (including 6–24h) is rejected.
Behaviour: Thresholds are configurable; every reject logs its reason (failed band, or outside all bands).
Lifecycle: Candidate + baseline → band check → pass (to Narrative analysis) or reject (logged, end).
Verification:
1. Send test candidates at known multipliers: 4x at 30min (pass), 4x at 3h (reject), 60x at 2 days (pass), anything at 12h (reject).
2. Each verdict and reason is visible in the gate log.
Success: All four test candidates get the correct verdict with the reason shown.
Failure: A candidate passes or rejects against the band rule, or no reason is logged.

## Grok analysis
From: Narrative analysis
Feature: Gate 2 input — Grok 4.6 with the pre-generated prompt extracts narrative, thesis, sentiment, veracity score, and virality (attention) score via X search.
Behaviour: Both scores come back as separate components — veracity (is the narrative real) and virality (is it getting attention); an API failure blocks the candidate, never auto-passes it.
Lifecycle: Qualified candidate → Grok call → five extracted fields + two scores attached → combined-score gate.
Verification:
1. Feed a known test coin through the Grok call.
2. The analysis view shows all fields with veracity and virality as two separate numbers.
Success: The five fields and both separate scores are visible for the test coin.
Failure: The call errors silently, a field is empty, or the two scores arrive merged into one.

## Combined-score gate
From: Narrative analysis
Feature: Gate 2 — with a tweet the combined score must be ≥6; with no tweet it must be >8.
Behaviour: Dual threshold, fixed; rejects log the score and which threshold applied.
Lifecycle: Scored candidate → threshold check → pass (to Bundler checker) or reject (logged, end).
Verification:
1. Feed test scores: 6.5 with tweet (pass), 5 with tweet (reject), 8.5 without tweet (pass), 7 without tweet (reject).
2. Each verdict + score + applied threshold is visible.
Success: All four test scores get the correct verdict, threshold shown.
Failure: Any verdict contradicts the dual rule.

## Bundler share pull
From: Bundler checker
Feature: Pulls the wallets that bought in the creation block and their supply %, excluding program-owned accounts (the bonding curve).
Behaviour: Uses one pinned provider and counting method; if the provider is down, the candidate waits — it is never waved through.
Lifecycle: Scored candidate → provider pull → bundler % attached → trend classification.
Verification:
1. Run against a test token with a known bundler setup.
2. The bundler % shown matches the provider's own dashboard for that token.
Success: The displayed % matches the provider's number for the same token.
Failure: No number appears, or it disagrees with the provider's dashboard.

## Bundler trend classification
From: Bundler checker
Feature: Classifies the bundler share trend: decreasing, stagnating, or increasing (0% ideal).
Behaviour: Reads the share over time; a single snapshot classifies as unknown, not as safe.
Lifecycle: Bundler % history → trend label attached → bundler gate.
Verification:
1. Feed a test token whose bundler share is visibly decreasing and one whose share is rising.
2. The labels shown match the visible trend in the data.
Success: Both test tokens carry the correct trend label.
Failure: A rising share is labelled decreasing, or no label appears.

## Bundler gate
From: Bundler checker
Feature: Gate 3 — reject anything over 10–15% bundlers (below 10% preferred), especially if the share is increasing.
Behaviour: Strict; every reject logs the %, the trend, and the rule that fired.
Lifecycle: Labelled candidate → gate → pass (to Signal & trigger) or reject (logged, end).
Verification:
1. Feed test candidates: 5% decreasing (pass), 20% decreasing (reject), 12% increasing (reject).
2. Each verdict with %, trend, and fired rule is visible.
Success: All three get the correct verdict with full reason shown.
Failure: An over-limit or increasing candidate passes.

## Divergence watcher
From: Signal & trigger
Feature: Gate 4 — watches the chart for an OBV or RSI divergence against the call-out price (both oscillators = stronger, either works).
Behaviour: Starts at the call-out price and time; patterns (triangle/pennant) are parked — divergence only.
Lifecycle: Clean candidate → watch starts → divergence spotted (alert emitted) or staleness guard fires (watch ends) — two end states.
Verification:
1. Point the watcher at a replayed chart with a known OBV divergence.
2. The divergence is flagged with the oscillator named; a replay with no divergence is not flagged.
Success: The known divergence is caught and named; the clean replay stays quiet.
Failure: The known divergence is missed, or a flat chart produces an alert.

## Staleness guards
From: Signal & trigger
Feature: Stops tracking a call-out if price runs +30% from it or 15 one-minute candles pass (combinable).
Behaviour: Either guard ends the watch; the stop reason is logged (distance or time).
Lifecycle: Watch running → guard fires → watch ended + reason logged → candidate done.
Verification:
1. Replay a chart that runs +31% with no divergence: the watch must stop with "distance".
2. Replay 16 flat candles: the watch must stop with "time".
Success: Both replays end the watch with the correct reason shown.
Failure: The watch keeps running past a guard, or stops with the wrong reason.

## Divergence alert
From: Signal & trigger
Feature: Emits the alert payload to the Front-end UI: coin, scores, which oscillator diverged, freshness, and the Kelly pre-filled size.
Behaviour: Fires once per candidate; the size attached is computed by the Position manager — the alert never asks Bobby to pick a number.
Lifecycle: Divergence spotted → payload assembled (with pre-filled size) → delivered to the UI → alert waits for Bobby.
Verification:
1. Trigger a test divergence end-to-end.
2. The alert arrives in the UI with every field filled, including the size.
Success: The UI shows the complete alert — coin, oscillator, freshness, pre-filled size.
Failure: The alert is missing, has empty fields, or arrives without a size.

## Alert display
From: Front-end UI
Feature: Shows the divergence alert clearly enough to decide in seconds: coin, which oscillator diverged, how fresh it is, and the pre-filled size.
Behaviour: Newest alert on top; readable on a phone (the primary screen).
Lifecycle: Alert arrives → displayed → resolved (Bobby clicks buy or ignores it) → archived.
Verification:
1. On Bobby's phone: open the UI with a test alert waiting.
2. Every field is readable without zooming or sideways scrolling.
Success: The full alert is glanceable on the phone in seconds.
Failure: Fields are cut off, unreadable, or the alert never renders.

## BUY button
From: Front-end UI
Feature: One obvious BUY button — one click sends the buy click to the Position manager and executes exactly the pre-filled size. No typing, no sizing at the button.
Behaviour: Disabled until an alert is present; one click only (no double-fire); ignoring the alert is a valid choice that logs "no trade".
Lifecycle: Alert displayed → Bobby clicks (or ignores) → click sent to Position manager → button resolves.
Verification:
1. On the phone: the button is visibly clickable with an alert present, greyed out without one.
2. Click it: the Position manager receives exactly one buy click with the pre-filled size.
3. Ignore the next alert: it logs "no trade".
Success: One click = one buy click with the shown size; ignoring logs cleanly.
Failure: The button can't be tapped, fires twice, or sends a different size than shown.

## Positions + moon bag view
From: Front-end UI
Feature: Shows open positions and the moon bag status from the position feed — the moon bag's manual home (view + manual sell).
Behaviour: Read model updates from Position manager events; the moon bag is never auto-sold here.
Lifecycle: Position opens → appears in the view → updates on every fill → leaves the view when flat (moon bag stays until Bobby sells it manually).
Verification:
1. With a test position open: it appears in the view with its stop and ladder state.
2. After the 2x withdrawal: the moon bag shows as a separate, manual-only holding.
Success: The phone shows the live position and later the separate moon bag.
Failure: The position doesn't appear, or the moon bag vanishes after 2x.

## Venue router
From: Trade executor
Feature: Routes each order to the chain that lists the coin — Solana or the Robinhood Chain (EVM L2).
Behaviour: Routing is per order, by listing; an unroutable coin blocks the order, never guesses a venue.
Lifecycle: Sized order arrives → venue chosen by listing → order handed to that chain's adapter.
Verification:
1. Send a test order for a Solana-only coin and one for a Robinhood Chain coin.
2. Each fill report shows the correct venue.
Success: Each order lands on the right chain, venue named in the fill.
Failure: An order goes to the wrong chain, or the venue isn't recorded.

## Entry execution
From: Trade executor
Feature: Executes the entry when the sized order arrives from the Position manager — only after Bobby's click; the alert alone never spends money.
Behaviour: Uses the wallet keys (secret names, never raw); a failed transaction reports the failure and does not retry silently.
Lifecycle: Sized order → transaction built + signed → submitted → fill or failure reported.
Verification:
1. On devnet: Bobby clicks buy on a test alert.
2. The fill appears in the fill feed with size, price, and venue.
Success: One click produces one visible fill matching the pre-filled size.
Failure: The click produces no fill, or a fill appears without any click.

## Immediate stop-loss
From: Trade executor
Feature: Sets the 30% stop-loss at the moment of entry — the automation starts here.
Behaviour: Lives on the exchange as a real order; cancelled automatically when the 2x rule fires; adjustable while active.
Lifecycle: Entry fill → stop placed on the exchange → ends when hit (position sold), cancelled at 2x, or failed (alerted).
Verification:
1. After a devnet entry: the stop-loss shows on the exchange's open-orders list at entry price −30%.
2. Cancel it manually: it disappears from the exchange.
3. At 2x: it cancels itself without Bobby touching anything.
Success: The stop is visible on the exchange, cancellable, and self-cancels at 2x.
Failure: The entry fills but no stop exists on the exchange — no proof beyond the fill.

## Sell-into-volume filter
From: Trade executor
Feature: Executes exits only into buy pressure — green candles and real volume, never into red.
Behaviour: Waits for a qualifying candle; a clip that can't fill into volume is retried, never dumped into a falling tape.
Lifecycle: Exit order (clip or stop) → volume check → fill on a qualifying candle → fill reported.
Verification:
1. Replay a green-volume window: the exit fills.
2. Replay a red window: the exit waits — no fill prints.
Success: The exit fills in the green window and visibly holds in the red one.
Failure: A sell prints on a red candle.

## Fill reporting
From: Trade executor
Feature: Reports every fill (entry, stop, clip) to the Position manager and the Trade journal.
Behaviour: One fill = one event, schema frozen; a missed fill corrupts the ladder — so reporting is retried until acknowledged.
Lifecycle: Fill happens → event emitted → acknowledged by Position manager + journal → done.
Verification:
1. Execute a devnet entry + one clip.
2. Both fills appear in the journal feed with matching sizes and prices.
Success: The journal shows both fills exactly as executed.
Failure: A fill executed on-chain is missing from the journal.

## Fractional Kelly sizer
From: Position manager
Feature: Pre-computes the entry size with fractional Kelly (safer slice of the Kelly-optimal size) when the alert fires, using Bobby's inputs: bankroll, win-rate + payoff estimates, chosen fraction.
Behaviour: The Grok score is never an input; missing Kelly inputs means no size is shown — the alert says so instead of guessing.
Lifecycle: Alert fires → size computed → attached to the alert → executed as-is on Bobby's click.
Verification:
1. With pinned test inputs (bankroll, win-rate, payoff, fraction), fire a test alert.
2. The pre-filled size matches the hand-computed fractional Kelly number.
Success: The alert's size equals the hand check for the same inputs.
Failure: No size appears, or the size disagrees with the hand check.

## 2x capital recovery
From: Position manager
Feature: When price reaches 2x, withdraws the initial capital and cancels the stop-loss.
Behaviour: Fires once per position; after it, the position runs on house money (moon bag + clips).
Lifecycle: Position running → price hits 2x → initial capital sold + stop cancelled → ladder continues.
Verification:
1. Run a devnet position to 2x.
2. The withdrawal fill appears, equal to the initial capital; the stop vanishes from the exchange.
Success: At 2x the initial is visibly out and the stop is gone.
Failure: Price crosses 2x and the initial is still in, or the stop is still live.

## Moon bag rule
From: Position manager
Feature: After 2x, 20% of the remaining position becomes the moon bag — manual-only, never auto-sold.
Behaviour: The bag is flagged in position state; the clip ladder never touches it.
Lifecycle: 2x fires → 20% flagged as moon bag → lives in the UI until Bobby sells it himself → ends only on his manual sell.
Verification:
1. After the devnet 2x: the moon bag shows in the UI as manual-only.
2. Run the ladder to completion: the bag is still there, untouched.
Success: The bag survives every automatic exit and only moves on Bobby's click.
Failure: An automatic exit sells into the moon bag.

## Divergence clip ladder
From: Position manager
Feature: On each bearish divergence after entry, sells a 15–20% clip of the remaining position (moon bag excluded), executed via the sell-into-volume filter.
Behaviour: One clip per divergence; clips stop when only the moon bag remains.
Lifecycle: Bearish divergence → clip order → filled into volume → position state updated → next divergence or flat.
Verification:
1. Replay two bearish divergences on a devnet position.
2. Two clip fills appear, each 15–20%, each into a green candle.
Success: Both clips fill at the right size into volume; the moon bag is untouched.
Failure: A divergence passes with no clip, a clip prints on a red candle, or a clip eats the moon bag.

## Trade journal
From: Trade journal
Feature: Logs every event end to end — each gate verdict, the alert, Bobby's click, every fill, every ladder step — as one queryable record per trade.
Behaviour: Append-only; every department writes through one event schema.
Lifecycle: Callout arrives → record opens → every event appended → record closes when the position is flat (moon bag noted).
Verification:
1. Run one full devnet trade.
2. Open the journal: the whole story is there in order — gates, alert, click, fills, ladder — with no gaps.
Success: The complete trade replays from the journal alone.
Failure: Any event that happened is missing from the record.
