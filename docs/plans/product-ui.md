# Product UI

*Drafted 2026-11-13 from a played test match on the local table and a read of both front ends in `netrunner-game`. Current versions are in the [pin table](../../README.md). Status: not started.*

## Why

The product client at `/play/` speaks the match protocol, and that is all Product Phase 5 asked of it. It is not yet a screen someone can play Netrunner on. No other plan covers it: the [CR audit program](cr-audit-standardization-program.md) is engine work, and [`discord-activity.md`](discord-activity.md) designs hosting, accounts, decks, and formats, and says only that the Activity serves "the Solid board".

This plan makes `/play/` playable for two people on the Learn to play decks. It writes only `netrunner-game`. It does not wait for the [Phase 6 gate](cr-audit-standardization-program.md#phase-6-gate): that gate is about putting matches in front of real opponents, and a local board is safe to build before it.

## Reference model

The board should play the way Magic: The Gathering Arena plays. This plan takes Arena's interaction model, which is common to digital card games. It does not copy Arena's visual design: no Arena art, card frames, fonts, effects, sounds, or exact layout. The board gets its own Netrunner look.

| Arena pattern | Netrunner version |
|---|---|
| You at the bottom, opponent at the top | Each seat sees its own side at the bottom. The Runner sees the rig near and the servers far. The Corp sees its servers near. Today the Corp is always at the top |
| Hand fanned along the bottom; hover enlarges; playable cards glow | The grip or HQ as a fan of card images. A card with a legal action glows. Hover or long-press zooms |
| Click or drag a card to play it; legal targets light up | Click a card, then a lit server or card. Drag does the same. An install is the card, then the server |
| One context button at the bottom right, and a key that presses it | One primary button whose label is the step's default: Pass, Continue the run, End turn, Keep hand. The space bar presses it |
| Automatic passing when you have no play; stops you set per phase; a mode that holds priority | The host already skips a window with nothing but Pass. Add per-seat stops on the turn and run tracks, a "pass until something happens" action, and a hold-priority toggle |
| Phase track | A turn track (draw, clicks as pips, discard) and, during a run, a run track (approach, encounter, movement, breach) |
| The stack shown as cards at the side | Pending abilities and the open choice as a column of source cards, newest on top. Simultaneous triggers are ordered there |
| Combat: attackers, blockers, damage assignment | The run. The attacked server's ice column comes forward, the Runner's position is marked, and the encounter pairs breaker actions with subroutines |
| Opponent's hand as card backs; library and graveyard as piles you can open | The opposing hand as a fan of backs with a count. R&D, the stack, Archives, and the heap as piles. Opening a pile shows what that seat may see (CR 1.21, CR 10.2.2a) |
| Player portrait with life total | The identity card with credits, clicks, tags, and agenda points beside it |
| Cards move between zones | Short transitions between zones, so a draw, install, trash, or access is seen and not only logged |
| Turn timer | Not in this plan |

## What exists

| Front end | Where | Size | Role |
|---|---|---|---|
| Verification table | `public/table.html`, served at `/` | 1,254 lines, plain JavaScript | Test harness. Shows every zone, CR citation links on each play, each visible card's Effect IR, and timing readouts. Stays as it is |
| Product client | `client/src/` (SolidJS, Vite), served at `/play/` | About 700 lines plus 242 of CSS; one commit | A board and a side panel. This plan's subject |

## What a test match showed

One Learn to play match, both seats, through the Corp's first turn and a Runner run on HQ.

| # | Finding | Detail |
|---|---|---|
| 1 | Every action is a button in one flat list | The Corp's first action offered 14 buttons. Installing is one button per card per server ("Install Whitespace protecting R&D"). No card or server on the board can be clicked |
| 2 | The list pushes the hand off the screen | At 1280×800 the hand sits below the fold once there are more than a few legal plays |
| 3 | The hand is title tiles | No image, cost, or text in hand. Installed cards do load images |
| 4 | Priority windows stop the game constantly | The host already resolves a window whose actor has nothing but Pass. With one unrezzed asset installed, the Corp still had to press Pass at every window: after each action, at discard, and three times before the Runner's first click |
| 5 | Waiting is nearly invisible | The seat without priority sees an empty play list. The only cue is one small line, "Corp has priority" |
| 6 | Steps with nothing to decide still ask | "Discard to hand size" appeared with four cards in HQ |
| 7 | A run has no shape | It is one text line ("Run on HQ · movement") and a tinted server. At movement the Runner is offered "Pass", "Jack out", and "Continue the run" as three equal buttons |
| 8 | An access leaves no trace | The accessed card was shown and gone in the same update. Only the log recorded that an access happened |
| 9 | Hidden cards are blank boxes | Unrezzed ice reads "Ice" and a facedown card reads "Card". No card back, no rezzed or unrezzed state beyond a border |
| 10 | Zones are missing | The board model carries score areas, set-aside cards, and removed-from-game cards. The table component draws none of them. Counters and advancement are not on the board |
| 11 | Card text is the host's paraphrase | The glossary builds text from engine fields. The printed text is in `data/printed/` in the cards data and is not sent |
| 12 | Narrow screens overflow | At 375 px wide the stat rows and server row run off the right edge |
| 13 | Rule step ids are shown raw | The header reads "Rules 11.3_1_f_ii — If yes, the Runner takes an action." That suits the test table, not a player |

## Principles

- **The client draws the seat snapshot and nothing else.** It never reads a deck list or another seat's data. Hidden information stays hidden (CR 10.2.2a, CR 1.21).
- **Every action still goes through the host.** A click builds one of the legal intents the snapshot offered. The client never invents an intent.
- **A new wire field is a visibility change.** It goes through the host's seat filter with a CR citation, and the visibility fuzz (audit tool 1.7) covers it.
- **A spectator's view may lag.** The roadmap gives product spectators a delayed feed. The board draws whatever snapshot it is sent and does not assume it is live.
- **The verification table is not the product.** It keeps its raw view. Nothing here changes it.
- **Printed text wins (CR 1.2.1).** A card a seat may see shows its printed text.
- **Arena's play, our look.** The interaction model follows the [reference model](#reference-model). The palette, card backs, panels, and motion are the project's own.

## Slices

Sizes: **S** ≈ half a session, **M** ≈ one session, **L** ≈ two or three. Each slice ends with the game suite passing and a played match on the Learn to play decks.

| # | Slice | Size | What it delivers | Closes findings |
|---|---|---|---|---|
| U0 | **Wire inventory and anchors** | S | List every intent type the engine can offer and what it points at (a card, a server, a subroutine, a choice option, nothing). The host adds to each legal entry an `anchor` (card id, server id, or none) and a `group` (basic action, install, play, run, ability, window, choice). The client stops reading engine intent fields directly. One legal entry per step is marked as the default, which is what the primary button does. Also list what the snapshot lacks for the later slices: counters, advancement, hosted cards, facedown Archives count, encounter position | Groundwork for 1, 7, 10 |
| U1 | **Play from the board** | L | Each seat sees its own side at the bottom. The hand is a fan of card images along the bottom edge, always visible; a card with a legal action glows, and hover or long-press zooms it. Click or drag a card to act; legal servers and cards light up as targets. Install is the card, then the server. Basic actions (gain a credit, draw, purge) sit in one fixed bar. The flat "Legal plays" list leaves the default view and stays behind a debug toggle | 1, 2, 3 |
| U2 | **Priority, passing, and waiting** | M | One primary button at the bottom right carries the step's default (Pass, Continue the run, End turn, Keep hand), and the space bar presses it. While the other seat decides, the button reads "Waiting for Corp" or "Waiting for Runner". A turn track shows draw, clicks as pips, and discard. Each seat sets stops on the track; without a stop, a window where that seat's only plays are ones it has chosen to skip passes by itself. "Pass until something happens" and a hold-priority toggle sit beside the button. The host resolves a step that has nothing to decide. Steps are named in plain words | 4, 5, 6, 13 |
| U3 | **Run flow** | L | A run takes the focus the way combat does. The attacked server's ice column comes forward, a run track shows approach, encounter, movement, and breach, and the Runner's position is marked on the ice. The encounter view lists the ice's subroutines and the Runner's breaker actions against them. Jack out and continue are the two choices at movement. The Corp's rez decision on approach is a prompt on that ice. An access holds the card on screen until the Runner acknowledges it, with trash and steal as its actions | 7, 8 |
| U4 | **Every zone, and card detail** | M | Identity panels with credits, clicks, tags, and agenda points. The opposing hand as a fan of backs with a count. R&D, the stack, Archives, and the heap as piles that open to show what that seat may see, with a facedown count for Archives. Score areas, set-aside and removed-from-game cards, hosted cards on their host, counters and advancement on cards. Card backs for hidden cards. A zoom view with the printed text. A spectator layout: the Corp at the top, the Runner at the bottom, both hands as backs with counts (CR 10.2.2a), and no primary button, stops, or targets. The run view, pending column, log, and motion show for a spectator as they do for a player | 9, 10, 11 |
| U5 | **Choices and targets** | M | Pending abilities and the open choice sit in a column of source cards at the side, newest on top, and simultaneous triggers are ordered there. A trace, a cost choice, and a "choose a card" each get a prompt that names the source card. Legal targets light up on the board and are chosen by clicking them | Rest of 1 |
| U6 | **Log and motion** | M | A log in plain sentences, in a side drawer that can be closed, naming only cards that seat may see. Cards move between zones with short transitions, so a draw, install, trash, or access is seen. The last change on the board is marked | 8, 13 |
| U7 | **Fit the frame, and our look** | M | A layout that holds from a phone-width frame to a desktop one without sideways scrolling, with touch-sized targets. This is the layout the Discord Activity frame will use. The project's own visual pass lands here: palette, card backs, panel style. The Discord SDK itself stays in Phase 6 | 12 |

Order: U0 → U1 → U2 → U3 → U4 → U5 → U6 → U7. U1 and U2 together are the first point at which a turn is playable without the list. U4 can move ahead of U3 if a played match shows missing zones hurt more than the run view.

## Decisions for a human

- **Automatic passing can leak information.** If a seat's window resolves at once when it has no play, the pause when it does have one tells the opponent something. The host already resolves empty windows. The working answer follows the reference model: skip empty windows, accept the tell, and give each seat stops and a hold-priority toggle to bluff with. Run `cr-checker` on CR 10.2 for whether the rules speak to this, and confirm the answer before U2 starts.
- **Printed text needs a data path.** The game pins the cards data, so `data/printed/` is available to the host at the pin. Sending it adds to the snapshot size. Decide in U0 whether text rides in the snapshot or is fetched once per card.
- **Card images.** They are fetched to a gitignored folder today. Whether a public host may serve them is a Phase 6 question and is not answered here.

## Tests

- Each slice adds tests for its board-model logic in `client/src/*.test.ts`, in the style of `board.test.ts`: a snapshot in, a model out.
- U0's host changes get tests in `src/match.test.ts`, including that an anchor never names a card the seat may not see.
- The visibility fuzz (audit tool 1.7, session P1-e) sweeps every seat snapshot. Any field this plan adds must be inside that sweep before the slice merges.
- Each slice ends with one full Learn to play match played by hand through `/play/`, both seats, with what broke written into the PR.

## Working beside the audit

- This plan and audit session P1-e both write `netrunner-game`. They go one at a time.
- Audit area 4 (visibility) changes how the host builds a seat view. U0 should land before area 4 or rebase onto it, not run across it.
- Nothing here needs an engine change. If a slice finds it does (a missing field in `getPublicView`, say), that is an engine PR with its own test and a maintenance release, per the [git hygiene](../git-hygiene.md) policy.

## Out of scope

- Discord sign-in, the embedded app SDK, matchmaking, the deck library, and deployment. Those are Phase 6.
- A deck builder. Decks come from NetrunnerDB, per the Phase 6 design.
- Sound, themes, cosmetics, emotes, and a turn timer.
- Arena's art, card frames, fonts, effects, sounds, and exact layout. The reference is how it plays.
- Changes to the verification table. Those are in the [verification table plan](verification-table.md).

## Done

Two people can play a full Learn to play match through `/play/` without the flat list, on a desktop and on a phone-width frame, and each sees only their seat. Each plays from their own side of the board with one primary button, and a turn with no decisions needs no clicks beyond the plays themselves. A spectator can follow that whole match and sees neither hand. Then this plan moves to `docs/plans/done/`.
