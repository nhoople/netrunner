---
name: sync
description: End-of-session sync for the Netrunner workspace. Brings all five checkouts (the meta repo and netrunner-engine, -cards-data, -comprehensive-rules-data, -game) back to their default branch matching GitHub, shipping any local work through a claude/* PR and squash-merge, and checks that pins and release tags line up. Use when Nathaniel ends the session or the day's work, says "sync", or when a session finds a repo off master/main before new work.
---

# /sync

The policy lives in `docs/git-hygiene.md` (End of session, releases, `claude/*` lifecycle). Read it first if anything below seems to disagree; the doc wins. This skill is the procedure.

## 1. Look before acting

Run `bash .claude/skills/sync/status.sh` from the workspace root. It is read-only. It fetches each repo and prints, per repo: current branch, local commits ahead of or behind origin, uncommitted files, other local branches (whether their remote is gone and whether the tip is already merged), open PRs, and the default branch's latest CI run. Then it compares release tags with the pins.

If every repo is on its default branch, level with origin, clean, with no extra branches or open `claude/*` PRs, and the pins line up, say so in one line and stop.

## 2. Per repo, in this order

Meta (`netrunner`, branch `main`, the workspace folder itself), then cards, CR, engine, game. Cards and engine come before the game so a pin bump can follow in the same pass.

- **Uncommitted changes:** do not commit them blind. Show the files. Commit only what this session made for a task Nathaniel asked for, after that repo's tests pass (CLAUDE.md: a test for the behavior, and the repo's suite). Anything else: ask.
- **Local commits on the default branch not on origin:** move them to a new `claude/<descriptive-name>` branch (`git switch -c claude/x`, then reset the default branch to `origin/<base>`), push, and open a PR. Never push `master` or `main` directly; never force-push.
- **A pushed `claude/*` branch without a PR:** open one. Commit and PR text follow the conventions in the repo's recent history.
- **Open `claude/*` PR:** watch its CI run (`gh run watch <id> --exit-status`), not `gh pr checks --watch`, which exits early while the run is only queued. When the required check is green (`test` for engine and game, `validate` for cards, `transform-validate` for CR), squash-merge with `--match-head-commit`. The meta repo has no CI: merge once it is open, with `--delete-branch` since its auto-delete is off.
- **A run stuck in "queued":** check githubstatus.com for an Actions incident. Once Actions is healthy, if `gh run cancel`/`rerun` refuse, close and reopen the PR to start a fresh run; ask Nathaniel before doing that.
- **Red CI:** stop on that repo and report the failing step. Do not merge, and per the CI gate do not start new pack or release work while engine or cards `master` is red.
- **Open PRs that are not `claude/*`** (Dependabot, others): list them; do not merge or close them in a sync.
- **After merges:** `git checkout <base> && git pull --ff-only && git fetch --prune origin`, then delete local branches whose tip is in `<base>` (`git branch -D`). Leave branches that are not merged and say why.

## 3. Pins and releases

From the status report's pins section:

- **Engine `src/` commits on `master` since the latest tag** mean a maintenance release may be due (git-hygiene "Releases" 1). Test-only, validator-only, docs, and dependency changes are not. Do not cut a release on your own: say what changed and ask. If Nathaniel says release: bump `package.json` (`npm version <x> --no-git-tag-version`), README and CONTRIBUTING pins in the PR; after merge, `gh release create <tag> --target <merge sha>` with notes in the style of the previous release; then bump `netrunner-game/data/engine-pin.json` (run `npm run fetch-engine`, `npm install`, `npm run build:engine`, `npm run fetch-data`, then the game's CI steps), and update the pin table and floor references in the meta `README.md`, `docs/roadmap.md`, and `docs/git-hygiene.md`.
- **Game pins behind the latest engine or cards tag**, or **engine pins behind the latest cards or CR tag:** report it. Bump only when a release in this session intended it.
- Never move a pin to `master`; pins name release tags.

## 4. Finish

- Every checkout on its default branch (`main` for meta, `master` for the four), level with origin, clean.
- Update the "Last residual check" line at the top of `docs/git-hygiene.md` when this pass merged or released anything; that edit ships through the meta repo like any other.
- Report per repo in a few lines: what merged (PR links), what was released, anything left and why.
