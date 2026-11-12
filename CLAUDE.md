# Netrunner workspace

This folder is the checkout of `nhoople/netrunner` (branch `main`), the meta repo. It tracks the pin table in `README.md` (which engine, cards, and Comprehensive Rules versions go together), this file, `docs/`, and `.claude/agents/`. It is public: keep secrets, local paths, and personal notes out of it. `notes.md` stays local (gitignored).

Inside it are four separate git repositories, gitignored by the meta repo (not submodules):

- `netrunner-engine`: the rules engine
- `netrunner-cards-data`: card definitions (dataset with its own versions and CI)
- `netrunner-comprehensive-rules-data`: the Comprehensive Rules (CR) dataset
- `netrunner-game`: the match host

Run git for one of the four inside its folder (`git -C netrunner-engine ...`). Git run from this folder acts on the meta repo.

The repos stay separate. The game and the engine consume the others by release tag, not by `master` and not as workspace packages. Do not recommend merging the repositories, an npm workspace, or Turborepo unless asked to change that release model.

Engine setup: `npm install && npm run fetch-cr` in `netrunner-engine`.

Project docs live in `docs/` (roadmap, git hygiene, audits). Long-running plans live in `docs/plans/`; move a plan to `docs/plans/done/` when its todos are complete. Current versions live only in the pin files and the README pin table: link the table instead of restating a version.

## Check the Comprehensive Rules

Before changing engine behavior, what a seat can see, or how the table presents a zone, read the relevant nodes in `netrunner-comprehensive-rules-data` (pin `v26.03`). Card text wins on a direct contradiction (CR 1.2.1).

- Cite the rule number the change follows.
- Do not hide information that rule says that seat may see, and do not reveal information it says they may not.
- If the pinned engine disagrees with the CR, say so. Do not paper over it in the table, and do not bump the pin unless a release is intended.
- Before committing an engine rules change, run the `cr-checker` agent on the diff and address what it reports.

## Tests before updating a repo

Rules belong in `netrunner-engine`, card definitions in `netrunner-cards-data`, and the match host in `netrunner-game`. `deps/` and `vendor/` are local checkouts and are not the repos.

Before committing in any of those repos:

- Add or update a test there for the behavior. A game test does not cover an engine rules change.
- Run that repo's tests and leave them passing. Engine: `npm test` in `netrunner-engine` (the affected file first, then the suite for a rules change). Cards: the cards CI validate script. Game: `npm test`.
- If a change needs card data the engine pin does not have yet, the engine suite still has to pass against the pinned catalog.

## Effect IR names

Applies when editing `netrunner-engine/src/effects/**/*.ts`, `netrunner-cards-data/data/**/*.json`, or `netrunner-cards-data/scripts/**/*.py`.

Kinds are snake_case. A kind names the procedure: verb, then object (`trash_program`, `gain_credits`, `unless`). The allowed verbs are `PROCEDURE_VERBS` in `netrunner-engine/src/effects/primitiveNames.ts`.

- `may_` means the player may decline. `corp_` or `runner_` may name the actor before the verb.
- Amounts, sides, zones, and filters are fields. Do not mint a new kind for a new number.
- Do not prefix a kind with a pack code (`dtwn_`, `cotc_`, `tdatd_`, `win_`, and the rest of `PACK_CODE_PREFIXES`) or a card title.
- The card title goes in the comment on the primitive. A one-off stays composed from `seq`, `do`, `if`, `prevent`, and `choose` when that composition is clear.
- `_resolve`, `_pick`, and `_continue` are follow-ups the engine builds during an open choice. They are not the name of the printed ability.
- Fields are camelCase. `choose_card` fills `$chosen` into `then`.

Cards `v1.145.0` writes the procedure names. A new kind that skips the verb rule fails `tests/effect-ir-names.test.ts`. Do not bump the cards pin unless a release is intended.

## End-of-session sync

When Nathaniel ends the session or the day's work, run `/sync` (`.claude/skills/sync/`) before stopping. It follows the end-of-session steps and release policy in `docs/git-hygiene.md`, which is the one source for them. If a later session finds a repo off that state, finish the sync before new work.
