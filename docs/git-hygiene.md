# Git hygiene (Netrunner repos)

Repos: `nhoople/netrunner-engine`, `nhoople/netrunner-cards-data`, `nhoople/netrunner-comprehensive-rules-data`, `nhoople/netrunner-game`. The parent `Netrunner` folder is the checkout of the meta repo [nhoople/netrunner](https://github.com/nhoople/netrunner) (branch `main`): the pin table in `README.md`, plus `CLAUDE.md`, `docs/`, and `.claude/agents/`. It gitignores the four repo folders and `notes.md`.



## Releases

Three kinds of release; do not invent bumps outside these.

### 1. Engine maintenance release (common)

When an engine PR changes **`src/`** and the game (or another consumer) should pick it up — outcome-test fix batches, bug fixes, small mechanics — cut a patch tag on engine after squash-merge, then in the same pass:

1. Bump `netrunner-game` `data/engine-pin.json` (tag / notes; keep cards pin unless cards also moved).
2. Update the pin table in [nhoople/netrunner](https://github.com/nhoople/netrunner).

Cards pin stays put when the card corpus is unchanged. Semver patch on engine alone is fine.

### 2. Test-only / validator-only (no release)

Engine or cards PRs that change only tests, validators, coverage baselines, or docs: squash-merge and stop. No tag, no pin bump. (Example: one-off-kind outcome batch V.)

### 3. Set-complete / paired cards+engine (milestones)

Set-complete milestones (or an explicit manual cut) share one semver on cards-data and engine. After a set-complete, leave cards and engine on that paired tag. CR-data uses its own scheme. When any release tag changes, update [nhoople/netrunner](https://github.com/nhoople/netrunner) in the same pass.

**Today:** a maintenance floor, not a set-complete pair. The current tags are in the [pin table](../README.md); each release's notes are on its GitHub Releases page. Do not invent bumps from version numbers quoted in older docs.

#### Set-complete checklist

Run when a pack reaches **100% clear** (or explicit deferrals documented) and `pool.json` marks the wave **`supported`**. Do **not** run after every IR slice or semver tag.

1. **Pool** — Set the wave to `supported` in `netrunner-cards-data` `data/pool.json`. Every listed card must have empty `unsupported` (or an explicit reason in `data/supported-unsupported-allowlist.json`); CI enforces this.
2. **Pin pair** — Final cards annotated tag `vX.Y.0` and matching engine `data/cards-pin.json` bump + annotated engine tag on the pin merge commit (same semver on both repos at set-complete). An engine-only maintenance release may advance the engine tag alone when the card corpus does not change.
3. **Milestone Releases** — Official GitHub Releases on **both** cards-data and engine at that set-complete tag (or an explicit manual release). Engine-only maintenance releases (patch tags when `src/` changes and consumers should pick them up) are separate — see [`git-hygiene.md`](git-hygiene.md).
4. **README pairing** — Update Cards ↔ engine pairing sections in both repo READMEs.
5. **Project docs** — Refresh [`roadmap.md`](roadmap.md) (baseline semver, the supported / not-in-corpus summary, wait/next kickoff).
6. **Gate summary** — Record set-complete outcome (counts, smoke, deferrals) on the set-complete PR. An optional short note in the project store stays a receipt, not a second plan.
7. **CR adherence pass** — Sample high-risk cards in the wave against [`cr-adherence-gate.md`](https://github.com/nhoople/netrunner-engine/blob/master/docs/cr-adherence-gate.md) (timing, cannot/prevent, damage/tags/traces, install/rez, run structure). Fix **mismatch**-class findings or document explicit deferrals with CR cites on the set-complete PR.
8. **Interaction smoke** — Sample cross-card pairs from [`interaction-smoke-samples.md`](https://github.com/nhoople/netrunner-engine/blob/master/docs/interaction-smoke-samples.md) (prevent×cost, blank×host, interrupt chains, etc.); record pass/fail/defer in the set-complete summary. Required at set-complete for each **new** pack. One-time Gateway→VP corpus pass already shipped via engine [#193](https://github.com/nhoople/netrunner-engine/pull/193) (`tests/confidence-*.test.ts`).
9. **Context prune** — Delete mid-wave progress, pin/tag status, and handoff notes after set-complete; keep `internal/` small (`README`, optional in-flight wave only). Fix broken `docs/` links. Do **not** recreate `internal/archive/` bulk.

## End of session

Do this when the day's work stops, for each of the four repos. Pins stay on the current release tags unless a release in this session was intended (including an engine maintenance release above).

1. If `master` has commits that are not on `origin/master`, move them onto a new `claude/<descriptive-name>` branch. `master` is protected and cannot take a direct push.
2. Push the `claude/*` branch. Open a pull request if one is not already open, or update the open one.
3. When that repo's required check is green, squash-merge. GitHub deletes the branch.
4. Check out `master` and pull. Local `master` then matches GitHub.
5. Leave the checkout on `master` unless a new task has already started on a branch.
6. After a wave of merges, prune stale **local** `claude/*` branches whose remotes are gone (`git fetch --prune origin`, then delete local branches whose tips are in `master`).

Then do the same for the meta repo (the `Netrunner` folder itself), with these differences: its branch is `main`; it has no CI and no branch protection, so squash-merge once the PR is open; and `delete_branch_on_merge` is off, so merge with `gh pr merge --squash --delete-branch`. Leave it on `main`.

If the session ends without this pass, the next session runs it before new work.

## `claude/*` branch lifecycle

1. **Create** `claude/<descriptive-name>` off current `master`.
2. **Open PR** → squash-merge (merge commits off; `delete_branch_on_merge` on).
3. **After merge**, remote head usually auto-deletes. If a merged/closed `claude/*` remote remains, delete it. Local leftovers are safe to delete once the tip is on `master`.
4. **Leave alone:** open-PR heads, tags, Releases (current floor tags), and anything not clearly a leftover draft.

## When to prune

- After a set-complete Release or a large wave of merges, when remote or local `claude/*` piles up.
- Safe delete only if the PR is **merged or closed** (or the tip is fully contained in `master` with no open PR).
- Then `git fetch --prune origin` on each checkout to drop stale local tracking refs.
- If a ruleset blocks a delete, report and skip — do not force-push `master`.

## What NOT to delete

- Open PR branches
- Tags and GitHub Releases (unless clearly erroneous **drafts**)
- `master` history (no force-push)
- Paired floor tags on cards/engine (and current maintenance floor tags)

## Repo settings (live)

| Item | engine | cards-data | CR-data | game |
|------|--------|------------|---------|------|
| Squash + rebase on; merge commits **off** | ✅ | ✅ | ✅ | ✅ |
| Squash title `PR_TITLE` / message `COMMIT_MESSAGES` | ✅ | ✅ | ✅ | ✅ |
| `delete_branch_on_merge` | ✅ | ✅ | ✅ | ✅ |
| Branch ruleset `master-protection` | ✅ | ✅ | ✅ | ✅ |
| Tag ruleset `release-tags` (`v*`) | ✅ | ✅ | ✅ | ✅ |
| Dependabot | Actions+npm minor/patch | Actions | Actions | Actions only (npm omitted; engine is a path pin) |
| CI workflow job | `test` | `validate` | `transform-validate` | `test` |
| CODEOWNERS / required reviews | absent (intentional) | same | same | same |

### Ruleset notes

- **`master-protection`:** no deletions, no force-push; require PR; **0** approvals; required check `test` (engine and game) / `validate` (cards) / `transform-validate` (CR).
- **`release-tags`:** protects `refs/tags/v*` from deletion and force-push.
- Agents typically cannot PATCH settings / POST rulesets (403); Nathaniel applies changes. Recreate payloads (if ever needed) live in git history of this doc / prior receipts — not outstanding work.

## CI gate

Do not continue the next pack (or cut a set-complete or maintenance Release) while engine or cards `master` CI is red — pause, fix, resume when green. Do not merge game work while game `master` CI is red.
