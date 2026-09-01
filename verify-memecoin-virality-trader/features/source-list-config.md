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

## Test stream

Preconditions:

- UI up; ProofShot recording; a test stream with one listed and one unlisted source.

1. **Source list config works end to end.** Open the config view, then post a test callout from the listed source and one from the unlisted source.
   Success: The visible list matches what Bobby supplied, and only the listed source's callout produces a candidate — all visible in the recording.
   Failure: The list can't be displayed, or the unlisted source's callout produces a candidate too.
2. **list-view.** Open the config view.
   Success: The recording shows Bobby's source list rendered correctly.
   Failure: The config view is blank, missing, or shows the wrong list.
3. **list-filter.** Post a test callout from the listed source, then one from the unlisted source.
   Success: The listed source's callout produces a candidate in the intake view; the unlisted source's callout produces nothing.
   Failure: The unlisted source's callout slips a candidate through, or the listed source's callout is blocked.
4. **list-edit.** Edit the source list to add a new source, post a callout from it without restarting, then restart and post again.
   Success: The callout posted before the restart produces nothing; the same callout after the restart produces a candidate.
   Failure: The edit applies before the restart, or still doesn't apply after it.
5. **list-empty.** Point the watcher at an empty list and restart.
   Success: The intake view shows zero candidates and no error storm — a safe stop.
   Failure: The watcher errors out, crashes, or still produces candidates despite the empty list.

## Gotchas

- A restart (or reload) is needed for edits to apply; a mid-run edit proves nothing.
- An unlisted-source callout must produce *nothing* — do not accept a candidate with a warning as a pass.
