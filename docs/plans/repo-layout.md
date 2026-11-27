# Repository layout

*Drafted 2026-11-22 from a read of all five repositories and a grill with Nathaniel. Current versions are in the [pin table](../../README.md).*

## Where it stands

**Status:** active. Updated 2026-11-27.

D1, C1, R1, E0, G1, E1 and E2 are done. Every repo's README lists its folders, with a check. The engine fails a `src/` file over 2,000 lines. E1 and E2 split its two largest files, `effects/ir.ts` and `state/types.ts`, into `src/effects/ir/` and `src/state/types/`, with identical tests, playouts and transcripts, so 9 files remain on the size baseline. E0 named the area folders (see Shared pieces). E3 is running in the engine; it first settles where files with no area go (see Not yet decided). C2 waits for E-tests. The [CR audit](cr-audit-standardization-program.md) is paused until slice X merges.

## Waiting on you

Nothing.

## Why

Agents find their way through `CLAUDE.md`, each repo's `AGENTS.md` and README, and the folder layout. The layout has drifted, and parts of it were never organized:

- **Oversized engine files.** `effects/ir.ts` is 8,740 lines, `state/types.ts` 6,321 and `timing/graph.ts` 6,088. Four more files are over 4,000, including a catch-all named `effects/kinds/otherKinds.ts`. An agent reads about 2,000 lines at a time, so it never sees these whole. They are also still growing: `ir.ts` was 8,459 lines in the [2026-11-18 health check](../health.md).
- **Flat folders with names no one can guess.** `src/state/` holds 100 files in one folder. The 43 files in `effects/primitives/` are each named after three verbs (`trashGiveSwap.ts`). Five files are named after a card or pack (`fenris.ts`, `gamenet.ts`, `sansanValHooks.ts`, `azInstallDiscount.ts`, `msKeywords.ts`), against the naming rule in `CLAUDE.md`. Two different files are both called `breachReplacement.ts`.
- **Tests with no rule for where they go.** The engine has 312 test files in one folder, grouped only by name prefix. The game keeps tests in four places.
- **Card data mixed by purpose.** The engine's rules files, the printed text the table shows, format legality, rulings and the dataset's own bookkeeping all sit side by side in `data/`.
- **Docs that disagree with the folders.** `CLAUDE.md` and the engine's `AGENTS.md` give different setup commands. The engine README's layout leaves out `src/state/`, and the game README doesn't describe its own folders.

### What it serves

The CR audit's remaining areas (3–16) each rewrite one procedure across the engine. When each area's code, hooks and effect kinds sit in one folder named after it, an area session starts where its work is instead of searching 100 files. The same holds for every later card, rule and screen change.

## Shared pieces

| Piece | What it is | Used by |
|---|---|---|
| Area folder names | One folder per game procedure inside the engine's `state/` and `effects/`, named after the CR audit's areas (hosting and trash, uninstall and position, swap, visibility, install, rez, access, damage and prevention, counters, search and deck, turn and actions, card flags, run, keywords and credits, setup and end). Fixed by E0 (engine #1012), camelCase like `src/` file names: `hostingAndTrash`, `uninstallAndPosition`, `swap`, `visibility`, `install` (areas 5 and 6 together, decision 20), `rez`, `access`, `damageAndPrevention`, `cardFlags`, `turnAndActions`, `counters`, `searchAndDeck`, `run`, `keywordsAndCredits`, `setupAndEnd`. Where files that belong to no area go is under Not yet decided | Every engine move slice, the engine test move, and the CR audit when it resumes: each area's shared helper lives in its own folder, not in `state/procedures/` |
| No-change proof | A move changes no behavior. The full engine suite passes, and the golden transcripts and playouts come out identical before and after | Every move PR in every repo |
| Size check | An engine test that fails when a `src/` file passes 2,000 lines. Today's oversized files go on a shrink-only baseline | Built in E0; every later engine change |
| Layout map check | Each repo's README has a "Layout" section naming every folder. A test fails on a folder the map doesn't list | Built in each repo's own slice |
| Test placement | In the engine and the game, tests live in `tests/`, in folders that mirror the code folders, plus one folder per kind of check (CR examples, rulings, blanked cards, …). Browser tests go in `tests/browser/`. A test fails on a new test file in the top `tests/` folder | E-tests and G1 |
| Card data groups | `data/rules/` (what the engine runs: one rules file per card, `pool.json`, the schema, and the word lists cards are checked against), `data/print/` (what the card shows: printed text, printings, sets, cycles, layouts), `data/formats/` (formats, card pools, restrictions, rotations), `data/rulings/`. Bookkeeping (`manifests/`, the supported/unsupported allowlist, the catalog pin) leaves `data/` | C2, and the engine, game and `lookup` skill changes in X |

## Slices

One PR per move, each merged as a single commit, so GitHub's Revert button undoes exactly that move. A slice is one session and may open several move PRs in a row.

| Slice | Status | PR | Repo | Runs | What it does |
|---|---|---|---|---|---|
| D1 docs | done | meta #384, engine #1011, cards #312, CR data #13, game #339 | meta + all four | first, now | Make each repo's `AGENTS.md` the one home of its setup and test commands, and point `CLAUDE.md` to them instead of repeating them (fixes the engine setup mismatch). Add a one-line `CLAUDE.md` to each repo that loads its `AGENTS.md`. Fix `CLAUDE.md` and `git-hygiene.md` to say the meta repo tracks `.claude/` skills, hooks and agents, not only agents |
| C1 cards tools | done | cards #313, #314, #315, #316 | cards | after D1, beside R1, G1 and E | `scripts/` for commands, `tests/` for tests. Per-pack generators move to `scripts/generate/`. One naming style for script files. CI and README follow. Layout map check. No release |
| R1 rules data tools | done | CR data #14, #15 | CR data | after D1, beside C1, G1 and E | Rename `source/` to a name that can't be confused with `src/`. Same `scripts/` and `tests/` shape as cards. The published data (`data/`, `nodes/`) stays where it is. Layout map check. No release |
| G1 game | done | game #340, #341, #342, #343 | game | after D1, when no other session writes `netrunner-game` (product UI slices wait) | Group the 32 files in `src/` into folders (server, match, seat views, export, …). Tests into `tests/` mirroring them, browser tests into `tests/browser/`. `public/` stays, because its paths are the verification table's web addresses. Layout map and test placement checks. Rewrite the README layout |
| E0 engine checks and names | done | engine #1012 | engine (tests only) | after D1, beside C1, R1 and G1 | The size check and the layout map check. Fix the area folder names and record them in Shared pieces above. Record the safe point (the last engine, cards and game versions before E1) in [Pause and resume](#pause-and-resume) |
| E1 `effects/ir.ts` | done | engine #1013, #1014 | engine | after E0 | Split by kind family to match `effects/kinds/`. The old file stays as a pointer to the new files, so its 136 importers need not change in the same PR |
| E2 `state/types.ts` | done | engine #1015 | engine | after E1 | Split by what the types describe (cards, servers, players, runs, pending choices, …). The old file stays as a pointer for its 357 importers |
| E3 `state/` by procedure | running |  | engine | after E2 | Move the 100 `state/` files and `state/procedures/` into the area folders. Rename the card-named files for what they do. One PR per area folder |
| E4 `effects/` by procedure | to do |  | engine | after E3 | Sort the three-verb `primitives/` files, the `*Primitives.ts` files and the `kinds/` files into the area folders. Split `otherKinds.ts`, `installKinds.ts` and `trashKinds.ts` along the way |
| E5 the rest | to do |  | engine | after E4 | Split every file still on the size baseline below the limit: `timing/graph.ts`, `legality/checkpoints.ts`, `cards/load.ts`, `actions/apply.ts`, `state/costs.ts`, `effects/eval.ts`, and any other E0 lists. Give the two `breachReplacement.ts` files distinct names. Remove the pointer files left by E1 and E2 by updating their importers. The size baseline should then be empty |
| E-tests | to do |  | engine (tests only) | after E5, when no other session writes engine tests | Move all engine tests into folders that mirror the new code folders, in one go. Regenerate the baselines that record test file paths (about ten in `tests/baselines/`), update the mutation-test globs in `stryker/`, and add the test placement check. Write `tests/README.md` |
| C2 card data | to do |  | cards | after C1 and E-tests | Regroup `data/` into the card data groups. Move the bookkeeping out. Update the schema's `$id`, the validators, the generators and the README's "Consume the data" table. Not tagged until X |
| X paired cut | to do |  | engine, cards, game, meta | after C2 and G1 | Engine, game and the `lookup` skill read the new card data paths. Tag cards and engine `v1.148.0` together. The game moves to both pins, its tests pass and a `play-check` match is attached. Update the pin table, the [health log](../health.md) and the path references in meta docs, including the CR audit plan's Shared pieces table. Lift the pause |

## Findings

| Finding | Source | Goes to | Status |
|---|---|---|---|
| ~~The engine, game and CR data READMEs repeat setup commands for people. They agree with `AGENTS.md` today, except that the CR data README installs only `requirements.txt`, not `requirements-dev.txt` (`ruff`)~~ Fixed in CR data #15, engine #1012 and game #343: each README points to `AGENTS.md` | D1 (meta #384) | Each repo's README rewrite: R1 (CR data), G1 (game), E0 (engine) | fixed |
| ~~The cards and CR data PR templates list test commands without the `ruff` format check CI runs~~ Fixed in cards #313 and CR data #15 | D1 (meta #384) | C1 (cards), R1 (CR data) | fixed |
| About 20 `src/state/` files (continuous effects, triggers, replacements, pending choices, and shared ones such as `ids`, `rng`, `zones`) and generic `effects/` files belong to no CR audit area, so E3 and E4 have no folder rule for them | E0 (engine #1012) | Not yet decided; E3 settles it before its first move | open |
| ~~The engine's `docs/cr-adherence-gate.md` (line 84) still names the cards script `validate-cards.py`, now `validate_cards.py`~~ Fixed in engine #1013 | C1 (cards #315) | The next engine slice after E0 (E1), a one-line doc fix | fixed |
| `bottom_drawn_card` is declared twice: two identical `Primitive` members and two `KNOWN_PRIMITIVE_KINDS` entries (it was the same in the old `ir.ts`), so the kind reference lists it twice | E1 (engine #1014) | E4 or E5: drop the copy | open |
| Meta docs still name `src/state/types.ts` (the `docs/health.md` history and two CR audit plan rows about `CardDef`, which lives in `src/cards/load.ts`) | E2 (engine #1015) | X, which updates the path references in meta docs | open |
| `data/nsg-catalog-pin.json`'s notes still say "generate-*.py" | C1 (cards #314) | C2 | open |
| The cards README's Layout rows for `data/<side>/<type>/` accept any new folder under a side | C1 (cards #316) | C2, which regroups `data/` | open |
| The engine typechecks only `src/`: `tsconfig.json` excludes `tests/`, so about 360 test files (the top `tests/` folder and `tests/jnet`, `second-reader`, `playout`, `ability-fire`, `setup`, `fixtures`, `game-export`), `scripts/playouts.ts`, `scripts/update-ability-fire.ts`, `vitest.config.ts` and `vitest.jnet.config.ts` are never typechecked. The error count is not measured yet. `.mjs` scripts and `stryker/*.mjs` are plain JavaScript and not a gap | Typecheck coverage comparison (2026-11-27) | E-tests, which moves every engine test anyway: measure the errors first, then typecheck tests and scripts in CI; if there are many errors, a slice of its own after E-tests | open |
| Some checks never run on their own, and Nathaniel asked to be asked about them once X lands, before the CR audit resumes: (1) the engine playouts (`npm run playouts`, and `playouts:nightly` with 200 seeds) are not in CI, and no repo has a scheduled workflow; (2) the 12 `mutate:*` Stryker runs are manual only; (3) the game's full `fuzz:visibility` script is not in CI (whether its tests run a smaller version is not checked); (4) three of the meta repo's five hooks have no tests (`commit-nudge`, `lsp-nudge`, `wait-nudge`), and `commit-nudge` changed in meta #390 with only `node --check`. Recommended to put to him: a weekly scheduled job that runs the 200-seed playouts and the full visibility fuzz, with mutation runs staying manual | Side question from Nathaniel (2026-11-27) | Ask Nathaniel when X lands | open |

## Pause and resume

PF-S3d finished on 2026-11-22 (engine `v1.147.286`, cards `v1.147.29`). No CR audit session starts until slice X is merged, with one exception: FX-expose, the fix-now visibility slice scheduled after the weekly usage reset on 2026-11-26, takes the engine first (decision 17), and so does FX-faceup, the leak FX-expose found (decision 18). E0 starts after both merge. Slices that do not touch engine code (D1, C1, R1, G1) can start any time.

Safe point (from E0): engine `v1.147.288`, cards `v1.147.29`, CR data `v26.03`, the last releases before E1, which include FX-expose and FX-faceup. The game has no release tags; its pins on master hold those three values (game #337), so going back to the safe point means setting the game's three pins to them. Until X lands, the game stays on them. If X causes a problem, the game's pins go back to the safe point in one PR.

## Decisions for a human

| # | Decision | Date | Reason |
|---|---|---|---|
| 1 | A full reorganization of all five repositories, not only the engine's worst files | 2026-11-22 | Nathaniel asked for a full, organized reorg rather than the minimum |
| 2 | Pause the CR audit, do the reorg, then resume | 2026-11-22 | The oversized files are the ones the audit edits most (the most-changed `src/` files this month), and only one session writes engine code at a time. Moving them while the audit runs would collide with every area |
| 3 | One PR per move, no behavior change, proven by identical tests, recorded games and playouts. One engine release at the end, with the game tested before its pin moves, and the pre-reorg versions recorded as the safe point | 2026-11-22 | Safest and easiest to undo: each move reverts on its own, and the game never runs a half-moved engine |
| 4 | An engine `src/` file over 2,000 lines fails the tests, with a shrink-only baseline for today's files | 2026-11-22 | About what an agent reads at once. Without a check the files grow back |
| 5 | Engine tests move into folders in one go, when no other session writes engine tests. Agents pick the folder names, listed in `tests/README.md`. A new test in the top folder fails | 2026-11-22 | A gradual move leaves a mixed layout for months |
| 6 | Proof is numbers: before and after tables of the largest engine files, top-folder test files going from 312 to 0 with the same number of tests passing, and the next health check | 2026-11-22 | Nathaniel can check them without reading code |
| 7 | PF-S3d finishes, then the audit pauses, and its plan says so | 2026-11-22 | Stopping it midway wastes its work |
| 8 | The engine keeps its top-level split (actions, legality, timing, effects, state). Inside `state/` and `effects/`, files are grouped by game procedure under the CR audit's area names. Each area's shared helper lives in its area folder, not in `state/procedures/`. Card-named and three-verb files are renamed for what they do | 2026-11-22 | When the audit resumes, each area's code is in one place |
| 9 | The two data repos get the same tool layout (`scripts/`, `tests/`). The rules data repo's published data stays put, and its `source/` is renamed | 2026-11-22 | Moving published data breaks consumers for no gain to agents. Superseded for the cards repo's data by 13 |
| 10 | The game follows the engine's test rule, groups its `src/` into folders, and keeps `public/` | 2026-11-22 | One rule for both code repos. `public/` paths are web addresses |
| 11 | Order: doc fixes first. Cards, rules data and game reorgs alongside each other. The engine one move at a time, in parallel with them | 2026-11-22 | The engine is the long part, and nothing else needs to wait for it |
| 12 | Each repo's README lists every folder, and a test fails on a folder it doesn't list | 2026-11-22 | The engine's map went stale without a check |
| 13 | The cards repo's `data/` is regrouped by who uses it: rules, print, formats, rulings. Bookkeeping leaves `data/` | 2026-11-22 | Nathaniel noted some data is for the screen and some for the engine. Each kind of work then has its own folder |
| 14 | Each card's rules file stays one file, keeping title, faction and influence | 2026-11-22 | The engine uses them too. Two files per card that must agree is the copying the CR audit removes |
| 15 | The new layout ships as an explicit manual cut: cards and engine both at `v1.148.0`, the same release as decision 3's | 2026-11-22 | One version number then means "new layout". Old tags keep the old layout, so anything pinned to them keeps working |
| 16 | Keep each repo's `AGENTS.md` as the one home of that repo's setup and test commands. `CLAUDE.md` points to it, and a one-line `CLAUDE.md` in each repo loads it | 2026-11-22 | They are the only guidance an outside agent or a single-repo cloud session gets. One copy can't drift |
| 17 | A fix-now finding takes the engine before the reorg's engine slices, not after slice X. FX-expose (the expose-choice title leak, CR 10.2.2a) runs first on 2026-11-26, then E0 | 2026-11-22 | A leak of hidden cards is what the fix-now rule exists for, and it is one small slice against many moves |
| 18 | FX-faceup, a visibility leak FX-expose found (an accessed card stays faceup after the breach, CR 7.3.1a), also runs before E0 | 2026-11-27 | The same reason as 17; Nathaniel chose it on 2026-11-27 |
| 19 | No third fix-now slice before E0: the Snare! HQ access leak is filed under the CR audit's area 4, and D1 starts | 2026-11-27 | Nathaniel's choice on 2026-11-27 |
| 20 | Corp install (area 5) and Runner install (area 6) share one `install/` area folder | 2026-11-27 | Nathaniel's choice, as E0 recommended: CR 8.5 is one section, and `installCorp` and `installRunner` take the same options, so one folder keeps one procedure in one place. The mutation-test keys in `stryker/areas.mjs` stay `corp-install` and `runner-install`; they are config keys, not paths |
| 21 | Amends decision 3 for the move slices E3, E4 and E5: each move PR gets a local typecheck and GitHub CI (the full suite), not the full no-change proof. Each slice records one "before" digest on master and, after its last move, runs the full no-change proof once (the seeded playouts byte-identical, the golden transcripts unchanged, the same test names with the same status). If it differs, the session bisects across the move commits and reports the move. Each move stays its own PR and squash commit | 2026-11-27 | Nathaniel's choice: the full proof takes about 40 minutes per move on this computer, roughly 10 hours for E3 alone. A move changes only paths, CI still runs every test on each PR, and each move can still be reverted alone |

## Not yet decided

- **Where engine files that belong to no area go.** Blocks: E3 (and E4 for the generic `effects/` files). About 20 `src/state/` files came from the earlier programs, not an area: `continuousEffects.ts`, `lingeringEffects.ts`, `continuousSubs.ts`, `replacements.ts`, `storedTriggers.ts`, `pendingAbilities.ts`, `pendingChoice.ts`, `checkpointSnapshot.ts`, `ids.ts`, `rng.ts`, `zones.ts`, `active.ts`, `abilities.ts`; in `effects/`, `continuation.ts`, `chooseCard*.ts` and `abilityRecord.ts`. Nathaniel chose on 2026-11-27 to let E3 decide, from the files themselves, and report the rule before its first move. E0's suggestion to start from: a `continuous/` folder (CR 9.4, 9.10, 9.12, matching the stryker key `continuous`) and a `triggers/` folder for triggers, replacements and pending choices (CR 9.1–9.3, 9.6, 9.11; not `timing/`, which is already a top-level `src/` folder), with shared plumbing (`ids`, `rng`, `zones`, `types`) at the top of `state/`.

## Tests

| Slice | Must test | Proof Nathaniel sees |
|---|---|---|
| D1 | Each repo's `CLAUDE.md` loads its `AGENTS.md`. The meta `Public check` still passes | The setup command in `CLAUDE.md` and the engine's `AGENTS.md` now agree |
| C1, R1 | The repo's CI validate jobs pass unchanged. The layout map check | The folder list in each README, and the check failing on a made-up folder |
| G1 | `npm test`, the browser tests and `play-check` pass. Layout map and test placement checks | Test locations going from four places to one, with the same test count |
| E0 | The size check fails on a file over 2,000 lines. The layout map check | The size baseline: today's oversized files and their line counts |
| E1–E5 | E1 and E2: the no-change proof on every move PR. E3–E5: a typecheck and CI on every move PR, and the full no-change proof once at the end of each slice (decision 21) | A before and after table of the five largest engine files in each PR, and each slice's final no-change proof |
| E-tests | Same test count before and after. The test placement check | Top-folder test files going from 312 to 0 |
| C2 | The cards validators pass on the new paths | The new `data/` folder list |
| X | The game's tests and a `play-check` match on `v1.148.0` | The `play-check` contact sheet, and the next health check row |

## Out of scope

- Changing what any code does. A move that needs a behavior change stops and files it as a finding.
- Merging repositories, workspaces, or any change to the release-by-tag model.
- Moving the rules data repo's published `data/` and `nodes/`.
- Splitting a card's rules file.
- Moving `netrunner-game/public/`.
- Restyling the meta repo's `docs/` beyond the doc fixes.

## Done

- No engine `src/` file is over 2,000 lines, and the size baseline is empty.
- Engine `state/` and `effects/` code sits in area folders. No file is named after a card or pack.
- No test file is in the top `tests/` folder of the engine or the game.
- The cards repo's `data/` holds only the four groups.
- Every repo's README layout lists every folder, and its check passes.
- Cards and engine are at `v1.148.0`. The game and the pin table point to them.
- The CR audit plan's paths name the area folders, and the audit has resumed.
