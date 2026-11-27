---
name: plan-status
description: Show where the roadmap and every plan in docs/plans stand, check that they follow the plan format, and refresh Nathaniel's pinned plan status page. Use when he asks where things stand, what is done or next, or what is waiting on him; when a session edits a plan (run the check); and in /sync, which refreshes the page.
---

# /plan-status

The plan format is in [`docs/how-we-work.md`](../../../docs/how-we-work.md) under Plan. `plan-status.mjs` is its one reader: the `Plan check` CI, the visual in chat and the status page all come from it, so they always agree with the plans.

It also reads [`docs/roadmap.md`](../../../docs/roadmap.md), the one overall plan. The roadmap has no slices. Its "Order of work" is a numbered list of plans, the path to version 1: each step links the plan it runs (`plans/<slug>.md`, or `plans/done/<slug>.md` once finished), or links none while that plan is not written. The check requires the roadmap's "Where it stands" (first), "Waiting on you" (second), "Order of work", "Decisions" (a table with a dated Date column) and "Not yet decided". The first step not done is the current one.

## Check a plan

```bash
node .claude/skills/plan-status/plan-status.mjs --check
```

Run it after editing the roadmap or any plan in `docs/plans/`. The meta repo's `Plan check` workflow runs it, and its tests (`plan-status.test.mjs`), on every PR.

## Where things stand, in chat

1. Run `node .claude/skills/plan-status/plan-status.mjs` from the workspace root. It prints `{ roadmap, plans }`: the roadmap's status, paragraph, questions and path to version 1, then each plan's status, its "Where it stands" paragraph, its slices with their status and PRs, what is waiting on Nathaniel, and the findings counts.
2. Draw it with `show_widget`: the path to version 1 first, one box per step with the current one marked, then a card per plan (active first, then paused, not started, done) with its status and paragraph, then a row of pills per slice group in plan order. Pills are colored by status: done teal, running amber, next outlined, to do gray. Put anything waiting on him at the top, each with its recommended answer.
3. Under it, a few lines of prose: what is next, and what needs his answer.

Say what the plans say. If a plan looks out of date (a merged PR whose slice still says `running`), say so and offer to fix the plan instead of drawing over it.

## Refresh the page

The page is an Artifact made from the Data type. Its address is in `notes.md` (local, not in git) under "Plan status page". Its page is [`page.html`](page.html), stored in the artifact as `files/index.html`. Its five datasets (`plans`, `slices`, `waiting`, `findings`, `path`) all read one uploaded file, `plan-status.json`. The roadmap's questions are rows of `waiting` with `plan: "roadmap"`.

From the meta checkout on `main`, after it is level with origin:

1. `node .claude/skills/plan-status/plan-status.mjs --out <scratchpad>/plan-status` writes `plan-status.json`.
2. Upload it: `Artifact` `publish` with the page's `url`, `asset: true` and that `file_path`. Note the new `/_blob/<id>`.
3. `ArtifactData` `get` each of `datasets/plans`, `datasets/slices`, `datasets/waiting`, `datasets/findings`, `datasets/path` for its `version` and old `source.url`. Then one `batch` of five `update`s, each pinned with `if_version`: `{"source": {"url": "/_blob/<new id>"}, "updated": {"at": "<now, ISO>", "by": "Claude, plan-status script"}}`.
4. If `page.html` changed since the last refresh, also `set` `files/index.html` to `{"text": <page.html>}` in that batch, pinned to its version.
5. Delete the old upload (`Artifact` `delete` with the `url` and the old id as `path`) once no dataset names it.
6. Read `data/users/me/check` (and `runs`, if it exists) with `ArtifactData`. `passed` means the page drew without errors. `checking` that stays put means nobody has it open, which is fine.

Report the refresh in one line. Never put anything in the page that the public meta repo would not hold: it shows the plans as they are on `main`.
