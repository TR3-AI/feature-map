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

## Driving it with the harness

Preconditions:

- UI up; ProofShot recording; a test stream with one listed and one unlisted source.

- **View list.** Open the config view. The recording shows Bobby's source list rendered.
- **Listed source.** Post a test callout from a listed source. A candidate appears in the intake view.
- **Unlisted source.** Post a test callout from an unlisted source. No candidate appears.
- **Empty list.** Point the watcher at an empty list and restart. The intake view shows zero candidates and no error storm — a safe stop.

## Gotchas

- A restart (or reload) is needed for edits to apply; a mid-run edit proves nothing.
- An unlisted-source callout must produce *nothing* — do not accept a candidate with a warning as a pass.
