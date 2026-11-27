---
name: coordinate
description: Brief and check the slice sessions of a plan in docs/plans/. Gives the template every brief to a fresh slice session must fill in (slice, shared pieces, done, proof, review, findings, scope, stop rule, who else is writing), the model and effort to start it with, and what to verify when a slice reports back. Use when a session coordinates a plan, starts a session for a slice, or checks a slice's result.
---

# /coordinate

Stage 3 (Build) and stage 4 (Prove) of the loop in [`docs/how-we-work.md`](../../../docs/how-we-work.md), seen from the session that hands out the slices. That doc holds the rules. This skill is how a coordinator passes them on, so every slice gets the same ones.

A slice session starts with only `CLAUDE.md` and your brief. No persona, memory, or earlier conversation carries over. Anything it must know that `CLAUDE.md` does not say, the brief says or links.

## Before starting a slice

1. Read the plan. The slice must be listed under "Slices", and every slice the plan's order puts before it must be merged.
2. If the plan lacks something the brief needs (a "Shared pieces" section for engine work, a "Done", the slice's proof), fix the plan first. That is stage 2, and Nathaniel approves it.
3. Check which slice sessions are still running (`list_sessions` with `linked: true`) and which repos they write. Two sessions never write the same repo at once. Wait, or pick a slice that writes a different repo.
4. When the session starts, set the slice's Status to `running` in the plan and rewrite "Where it stands". The coordinator edits the plan; slice sessions do not.

## Starting the session

- One fresh session per slice: `start_session` with `context: "fresh"`. Never fork for a slice, and never send a new slice to a session that ran an earlier one.
- Always pass `model` and `effort` from the "Model and effort" table under Build in `docs/how-we-work.md`. Do not rely on the session inheriting yours.
- Check the model took: `get_session` right after the start. `start_session` has ignored `model` for Fable 5.2. When it does, start the session with a prompt that only asks it to reply with its model and stop, switch it with `set_session_model`, then send the brief with `SendMessage`, and check `get_session` again.
- The brief follows the template below, every heading filled. Write "none" rather than leaving a heading out, so a missing item is visible.

## Brief template

```
Slice: <plan link>, slice <id>: <name>. Repo(s): <which>.
<What the slice delivers, in your own words, from its row in the plan.>

Read first: the plan's sections for this slice, and docs/how-we-work.md
whole, with the Read tool, not a shell command. Its Build, Findings, and
Prove sections apply as written.

Shared pieces: <each piece from the plan's "Shared pieces" this slice uses:
the one function, module, screen, or model that owns it, and its CR rule for
engine work>. Call these. Do not copy them. If one is missing or does not
fit, stop and say so rather than writing a local version.

Setup: you start in this session's meta worktree. For each inner repo you
write, add a worktree of it here on a claude/* branch, so the main
checkouts stay on their default branch for other sessions. From this
worktree's root:
  git -C "$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")/<repo>" \
    worktree add "$PWD/<repo>" -b claude/<name> origin/master

Done: the claude/* PR is merged with CI green. <If engine src/ changes: the
maintenance release, the game pin, and the meta pin table, per
docs/git-hygiene.md.> Do not edit the plan; the coordinator records the
slice there from your report.

Merging: bind each PR with the ccd_pr tools and turn on Auto-fix
(set_monitor auto_fix), then squash-merge once its required checks pass. Do
not turn on auto-merge. Engine master refuses a PR that is behind it, so
rebase on origin/master first, then re-run tests/cr-cited-text.test.ts and
tests/cr-subrule-coverage.test.ts: their baselines change when other PRs
land.

Waiting: end a turn that promises a next step only when something will
bring you back to it: a run_in_background job (a test suite, `gh run watch
<id> --exit-status`, `gh pr checks <n> --watch`) or a subagent. Auto-fix
wakes you on a failure, not on a pass. Nothing else wakes you, so a turn
that ends with "I'll do X once Y finishes" and nothing running stalls the
slice.

Proof: <the proof from the plan's "Tests" for this slice: a played match or
part of one, a before-and-after screenshot or recording, or a test named for
the behavior in plain words>. Name it in the PR.

Review: <"code" if the slice changes code or tests in engine src/, the game,
or a cards script; "none" for docs, plan, or card-data-only slices>. For a
code slice, run /code-review on the diff before opening the PR (high for
engine src/, medium otherwise). It reviews in a fresh context, so it can
catch a test that checks the wrong thing. Fix what it confirms, and give the
PR a "Review" line: the level, what it found, and what you fixed or why not.

Found, not fixed: the PR has this section, listing each finding, where it
went, and why, per the Findings table in docs/how-we-work.md. Only a
fix-now finding gets a proposed session.

Out of scope: <from the plan's "Out of scope", plus anything belonging to
other slices that this one is likely to drift into>.

Stop rule: if the slice reaches a question under the plan's "Not yet
decided" (<list the ones this slice may reach, or none>), stop and grill it
with Nathaniel before building past it.

Running alongside: <other slice sessions now running and the repos they
write, or none>. Do not write those repos.
```

## While a slice runs

A slice session ends many turns before it is done, and each one sends the coordinator a note. A note that says "waiting on X" or "I'll do Y next" is not proof the session will carry on: it resumes only when a background job or subagent it started finishes, or when someone messages it.

- On each note that promises a next step, check that something will bring the session back. Ask the session what will wake it if unsure. `get_session`'s `isRunning` can read false while a background job is still running, so don't treat it as proof either way. If nothing will, message it to continue at once.
- On a status question, compare each slice's PRs with the time since its last step (for example, an engine release with no game PR half an hour later). Don't explain a gap with the session's last claim.

## When a slice reports back

Its report is a claim, not proof. Check before telling Nathaniel the slice is done:

- The PR is merged, and its required check passed (`gh pr view <n> --json state,statusCheckRollup`).
- The PR names the proof the brief asked for.
- If the brief asked for a code review, the PR has its "Review" line, and nothing it confirmed is left unfixed without a reason.
- The PR has a "Found, not fixed" section, and each filed finding is where the PR says.
- If engine `src/` changed, the release tag, game pin, and meta pin table line up (`bash .claude/skills/sync/status.sh` prints this).
- The plan records it: the slice's row says `done` and names its PRs; each filed finding is a row in the plan's Findings table marked `open`, and each it fixed is marked `fixed`; "Where it stands" is rewritten; any question for Nathaniel is a bullet under "Waiting on you" with a recommended answer. `node .claude/skills/plan-status/plan-status.mjs --check` passes.

Then give Nathaniel the proof to accept or reject, and put any fix-now finding to him. A gap in the list above goes back to the same session.

## Messages to an old session

Message a slice's session only about its own slice: its CI failing, a review comment on its PR, a missing item from the list above, or a question about what it did. New work always gets a fresh session, even when the old one knows the context.
