# Source list config

The list of tracked traders/devs — only callouts from these sources produce candidates. Visible in the UI, editable between runs, and safe when empty (nothing flows, no trades possible).

## Sub-features

- `list-view` shows the active source list in the UI.
- `list-filter` admits callouts from listed sources only.
- `list-edit` applies edits on the next run.
- `list-empty` treats a missing/empty list as a safe stop.

## How to get to it (user POV)

- Open the config view in the front-end UI.
- Edit the list file directly between runs (owner action).

## How it works in practice

The mechanical chain the test stream walks:

1. **Trigger:** Bobby edits the source list file.
2. **Mechanism:** the watcher validates the edit — names/handles only, never keys or secrets; a malformed or empty file is a safe stop, never a partial apply — and the new list takes effect on the next restart: load once, hold in memory, refresh per run.
3. **Surface:** the active list on screen (plain names/handles only), deciding whose callouts can become candidates.
4. **Breaks:** a wallet key or API key sitting in the list view (secrets hygiene breach) · a malformed or unparseable file silently applying instead of failing safe · an edit appearing to apply live, without the restart the spec requires.

Existence: exists in the requested format — a config file plus an in-memory list is the standard shape for this feature; nothing needs bot-simulation, though "restart to reload" specifically must be tested by actually restarting the watcher rather than editing live.
Deviations from standard: yes, deliberately. Production practice increasingly favors hot-reloading whitelist config live (watch, validate, atomic swap, no restart) — the map instead requires a restart/reload between runs for edits to take effect. This matches the file's existing Research-note gotcha; the map stands on this choice.

## Test stream

Preconditions:

- UI up; ProofShot recording; a test stream with one listed and one unlisted source.

1. **Source list config works end to end.** Open the config view, then post a test callout from the listed source and one from the unlisted source.
   Success: The visible list matches what Bobby supplied, and only the listed source's callout produces a candidate — all visible in the recording.
   Failure: The list can't be displayed, or the unlisted source's callout produces a candidate too.
2. **list-view.** Open the config view and inspect the recording.
   Success: The recording shows Bobby's source list rendered correctly, by plain name or handle only — no wallet keys, API keys, or other secrets appear.
   Failure: The config view is blank, missing, shows the wrong list, or exposes a key/secret instead of (or alongside) a plain handle.
3. **list-filter.** Post a test callout from the listed source, then one from the unlisted source.
   Success: The listed source's callout produces a candidate in the intake view; the unlisted source's callout produces nothing.
   Failure: The unlisted source's callout slips a candidate through, or the listed source's callout is blocked.
4. **list-edit.** Edit the source list to add a new source, post a callout from it without restarting, then restart and post again.
   Success: The callout posted before the restart produces nothing; the same callout after the restart produces a candidate.
   Failure: The edit applies before the restart, or still doesn't apply after it.
5. **list-empty.** Point the watcher at an empty list and restart; separately, point it at a malformed/unparseable list file and restart.
   Success: Both cases show zero candidates in the intake view and no error storm — a safe stop either way.
   Failure: The watcher errors out, crashes, or still produces candidates despite the empty or malformed list.

## Gotchas

- A restart (or reload) is needed for edits to apply; a mid-run edit proves nothing.
- An unlisted-source callout must produce *nothing* — do not accept a candidate with a warning as a pass.
- Research note: production config-management practice favors hot-reloading isolated whitelist config live (file watcher, validated before swap) without a restart — vs the map's requirement that source-list edits apply only via restart/reload between runs — the map stands. Tester action: edit the list, restart the watcher, and assert the edit takes effect only after the restart — a live hot-reload is the standard behavior the map deliberately skips.
