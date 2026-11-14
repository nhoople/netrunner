# Verification table

*Drafted 2026-11-13 from a played test match and a read of `public/table.html`, `public/debug.html`, and `public/log.html` in `netrunner-game`. Current versions are in the [pin table](../../README.md). Status: V1 done (netrunner-game #285, 2026-11-14). V2 next.*

## Why

The verification table at `/` exists to check that the engine does what the Comprehensive Rules and the printed card say. It already shows every zone, CR citations on each play, each visible card's Effect IR, and timing readouts. The debug page shows both seat snapshots and the internal board, and steps an engine golden transcript. The log page restores an earlier position.

It is slow at the one thing the [CR audit program](cr-audit-standardization-program.md) will ask of it most: checking one card or one interaction. Today that means starting a match from a preset or a deck list, opening two seat links, and playing turns until the card shows up. Each Phase 3 area re-verifies dozens of cards.

This plan makes that check fast. It is separate from the [product UI plan](product-ui.md), which leaves this table alone. The table keeps its plain, show-everything view. None of this ships to players.

## What a test match showed

| # | Finding |
|---|---|
| 1 | A match starts only from the Learn to play presets or a posted deck list. There is no way to start from a position |
| 2 | Playing both seats means two links and a Pass in each. The debug page shows both snapshots but steps only a separate demo game, not the live match |
| 3 | The engine now exports `checkInvariants`. Nothing on the table runs it |
| 4 | The card inspector shows the Effect IR and the host's paraphrase. The printed text in `data/printed/` and a card's `unsupported` note are not shown |
| 5 | The opening and the applied-intent log are saved for every match. Nothing turns a match into an engine test |
| 6 | The table lists what is legal. It cannot say why something else is not |
| 7 | After an intent, the debug page shows the new internal board. It does not show what changed, or the pending abilities, lingering effects, and run state |

## Principles

- **Debug stays on the test table.** Anything here that names a hidden card or builds a position is behind the debug link and never on a product match. The Phase 6 design already says the debug view stays off the public host.
- **Seat views stay honest.** The Corp, Runner, and spectator links keep showing only what that seat may see (CR 1.21, CR 10.2.2a). New panels that show more live on the debug page.
- **A position is a recorded opening.** A match started from a position stores it as its opening, so a restart still replays the log.
- **The engine is not changed to suit the table.** If an item needs something the engine does not export, that is an engine PR with its own test and release.

## Items

Sizes: **S** ≈ half a session, **M** ≈ one session. Each item ends with the game suite passing.

| # | Item | Size | What it delivers | Needs | Closes |
|---|---|---|---|---|---|
| V1 | **Play both seats from one page** | S | The debug page acts on the live match for whichever seat has priority, with both hands shown. One page, no link swapping | Game only | 2 |
| V2 | **Printed text beside the engine's version** | S | The card inspector shows three things side by side: the printed text from `data/printed/` at the cards pin, the Effect IR, and the `unsupported` note when there is one. This is the comparison CR 1.2.1 asks for | Game only; the cards data is already vendored | 4 |
| V3 | **Start from a position** | M | A debug-only setup form and endpoint: identities, cards in each hand, installed cards and where, rezzed or not, credits, clicks, whose turn. The host builds the state and passes it through `createGame`'s existing `setup` option. The match record stores it as the opening and marks the match as a scenario | Game only. A scenario match is never offered a format check or a product seat | 1 |
| V4 | **Invariant panel** | S | After every applied intent the debug page lists what `checkInvariants` reports, with the problem code and the cards involved. A problem that was not there before the intent is marked new | The engine release that carries `src/debug/` (the Phase 1 release, session P1-c) | 3 |
| V5 | **Export a match as a test** | M | A debug button writes the opening and the intent log as a fixture the engine's golden-transcript tests can replay, with the invariant result at the end. A bug found by hand becomes a regression test | Game, plus a small loader in the engine tests. Line up the format with the playout seed fixtures (audit tool 1.3) | 5 |
| V6 | **What changed** | S | After each intent the debug page shows the difference in the internal board: cards that moved zone, counters, credits, flags, and new or resolved pending abilities. Pending abilities, lingering effects, and the run state get their own panel | Game only | 7 |
| V7 | **Why not** | S | On the debug page, pick a card and an action the table did not offer. The host asks the engine to apply it to a copy of the state and shows the refusal reason. The live match is not touched | Check first that `applyIntent`'s refusal carries a useful reason for most actions. If it does not, drop this item | 6 |

Order: V1 → V2 → V3 → V4 → V5 → V6 → V7. V1 and V2 are small and need nothing else. V3 gives the largest saving and should land before audit Phase 3 starts. V4 waits for the engine release.

## Tests

- V3: a scenario match restarts to the same position, and a scenario is refused on anything but a debug-created match.
- V1 and V3: the seat links for the same match still pass the existing leak tests, and the visibility fuzz (audit tool 1.7) runs over scenario matches too.
- V5: an exported fixture replays in the engine suite to the same final state.
- Each item ends with one card checked by hand through the new path, named in the PR.

## Working beside the other plans

- This plan, the product UI plan, and audit session P1-e all write `netrunner-game`. One writer at a time.
- V3 and V5 feed the audit's per-area recipe: a position for each fixed path, and a fixture for each bug found.
- Audit area 4 changes how the host builds a seat view. V1 reads both seat views and should rebase onto area 4, not run across it.

## Out of scope

- Any change to the look of the seat pages beyond the new panels.
- A scenario language or saved scenario library. V3 is a form and a JSON body.
- Editing a live match's state mid-game. A new position is a new match.
- Anything on the product client at `/play/`.

## Done

One card can be checked from a set position, on one page, with its printed text beside its Effect IR and the invariant result after each intent, and the check can be saved as an engine test. Then this plan moves to `docs/plans/done/`.
