# Dev tooling

*Drafted 2026-11-19 from a grill on lint, browser tests, dead code, and formatting. Current versions are in the [pin table](../../README.md). Status: not started.*

## Why

The checks the repos run today are uneven. The engine's CI runs lint, typecheck and tests. The game's CI runs typecheck, tests and the pin check, but no lint, and nothing in it opens `/play/` or the verification table in a browser. Neither TypeScript repo has a formatter, so each agent formats its own way and diffs carry style noise. A first knip run on the engine, with no configuration, reports 16 unused files, 126 unused exports and 62 unused exported types, left behind by earlier programs.

The [product UI plan](product-ui.md) is about to grow the Solid client in `netrunner-game`. These four slices put checks in place first, so U1 and later slices start with lint, a browser smoke test, and screenshots for proof ([how we work](../how-we-work.md), stages 4 and 5).

## Shared pieces

| Piece | Owner | Used by |
|---|---|---|
| A Playwright fixture that starts the game server on a free port with an empty temporary `MATCH_DIR`, creates a match through the server's own create-match request, and returns the seat, spectator, log and debug links | `netrunner-game`, one file beside the Playwright tests | Every `/play/` and verification table test. Tests do not start servers or create matches themselves |
| One screenshot helper that saves each named view at its widths into the Playwright output folder | `netrunner-game`, same place | Every screenshot taken for a PR's proof |
| Each repo's `lint`, `knip` and `format:check` npm scripts (or the Python equivalent), run by that repo's CI | Each repo | Agents and CI call the script, not the tool directly |

## Slices

One session each, in this order.

| # | Slice | Repo | Notes |
|---|---|---|---|
| T1 | Game lint | `netrunner-game` | ESLint with `typescript-eslint` recommended and `eslint-plugin-solid`, over `src/`, `client/src/`, `scripts/` and tests. Fix every existing finding in the same PR. Add `npm run lint` and a CI step. Test-only merge, no tag |
| T2 | Browser smoke tests | `netrunner-game` | Playwright with the shared fixture. `/play/` at phone (375 wide) and desktop widths: the page loads with no page error, and the hand, servers, prompt or primary button, and log are present. The verification table at desktop width: create a match, then open the Corp, Runner, spectator, log and debug pages with no page error and their main parts present. Screenshots saved every run and uploaded as a CI artifact. Add a CI step |
| T3 | Dead code sweep | `netrunner-engine`, then `netrunner-game` | Configure knip with the engine's real entry points (the package exports the game uses, tests, scripts, Stryker and vitest configs). Check each finding by hand before deleting it. Ship the deletions as an engine maintenance release with the game and meta pin updates in the same pass ([git hygiene](../git-hygiene.md)). Then add `npm run knip` to engine CI, and the same check to game CI |
| T4 | Formatter | All four repos | Prettier for TypeScript, JavaScript, CSS and config in the engine and the game. Ruff's formatter for the Python scripts in cards-data and rules-data. Card and CR JSON data are never reformatted. One reformat commit per repo, merged when no other PR is open in that repo, listed in `.git-blame-ignore-revs`. Then a CI step that fails on unformatted files. Prettier settings are chosen so ESLint and Prettier do not disagree (`eslint-config-prettier`) |

## Decisions for a human

All decided 2026-11-19.

| Decision | Reason |
|---|---|
| The order is lint, then Playwright, then knip, then the formatter | Lint is smallest and guards the Playwright code. The formatter touches every file, so it goes last |
| Game lint covers client and server code, and existing findings are fixed, not switched off | The code is small, and rules switched off at the start tend to stay off |
| A browser test fails on a page error or a missing board part, not on a picture difference | The board will change heavily during U1, so picture comparison would fail on every intended change |
| `/play/` is checked at phone and desktop widths, and its screenshots go in each client PR's description as proof | Proof the maintainer can see without opening CI |
| The verification table is covered too: create a match, then the Corp, Runner, spectator, log and debug pages | Those pages are how the table verifies the engine. A quiet break loses a card check |
| The table is checked at desktop width only. Its screenshots go in a PR only when that PR changes the table | It is a desktop test tool, and its screenshots on every PR would bury the `/play/` proof |
| Dead engine code is checked by hand, deleted, and shipped as a maintenance release with pin updates | The release policy requires a release when engine `src/` changes |
| Knip then runs in engine and game CI | Stage 5: a cleanup becomes a check that keeps it clean |
| Prettier for TypeScript, Ruff's formatter for Python, and data JSON left alone | Standard tools for each language. The data files are generated, and reformatting them would fight their generators |
| Each repo's reformat is one commit, merged when nothing else is open there, and skipped in blame | Avoids conflicts with open CR audit branches and keeps line history readable |

## Not yet decided

- Picture comparison for `/play/`, once the U1 board stops changing shape. Blocks nothing in this plan; revisit when the product UI plan is done.
- Ruff's linter (not only its formatter) for the Python repos. Blocks nothing; raise it if a Python mistake repeats.

## Tests

| Slice | Must test | Proof the maintainer sees |
|---|---|---|
| T1 | `npm run lint` passes in CI and fails on a Solid mistake (a destructured prop) | The PR shows the lint step passing, and one commit or test that shows the destructured-prop rule firing |
| T2 | The smoke tests pass in CI on `/play/` at both widths and on the table pages | `/play/` screenshots at phone and desktop width, and the table pages, in the PR description |
| T3 | The engine suite, lint and typecheck pass after the deletions. The game passes against the new pin. Knip passes in both CI runs | The knip counts before and after, in the PR description, and the release tag |
| T4 | `format:check` passes in each repo's CI. The engine and game suites, and the cards and rules CI, pass after the reformat | Each repo's reformat PR shows only formatting changes, and CI rejecting an unformatted file |

## Out of scope

- Switching the engine from ESLint to oxlint. Lint takes about 5 seconds today, and the engine's `openPendingChoose` guard uses ESLint selectors.
- React tooling. The client is SolidJS ([product UI plan](product-ui.md)).
- Pre-commit hooks. CI catches the same things.
- Stricter TypeScript flags such as `noUncheckedIndexedAccess`.
- A monorepo tool or shared config package across repos. The repos stay separate ([CLAUDE.md](../../CLAUDE.md)).
- Reformatting card or CR JSON data.

## Done

The game's CI runs lint, the Playwright smoke tests and knip. The engine's CI runs knip. All four repos check formatting in CI. The engine's dead code from the first sweep is released and pinned. The product UI's next slice can put `/play/` screenshots in its PR.
