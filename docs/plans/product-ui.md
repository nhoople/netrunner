# Product UI

*Drafted 2026-11-13 from a played test match on the local table and a read of both front ends in `netrunner-game`. Current versions are in the [pin table](../../README.md).*

## Where it stands

**Status:** paused. Updated 2026-11-23.

U0 (game #302) and the automatic-passing leak fix (engine #934, game #304) are done, and the plan was grilled on 2026-11-23. It waits for the [repository layout plan](repo-layout.md) and then the whole [CR audit program](cr-audit-standardization-program.md). U1, play from the board, is next when they are done. It starts by playing clickable layout prototypes before the layout is fixed (see [Not yet decided](#not-yet-decided)).

## Waiting on you

Nothing.

## Why

The product client at `/play/` speaks the match protocol, and that is all Product Phase 5 asked of it. It is not yet a screen someone can play Netrunner on. No other plan covers it: the [CR audit program](cr-audit-standardization-program.md) is engine work, and [`discord-activity.md`](discord-activity.md) designs hosting, accounts, decks, and formats, and says only that the Activity serves "the Solid board".

This plan makes `/play/` playable for two people on the Learn to play decks. It writes only `netrunner-game`. It runs after the repository layout plan and the whole CR audit program, and before the Discord Activity (see [Decisions](#decisions-for-a-human)).

## Reference model

The board should play the way Magic: The Gathering Arena plays. This plan takes Arena's interaction model, which is common to digital card games. It does not copy Arena's visual design: no Arena art, card frames, fonts, effects, sounds, or exact layout. The board gets its own Netrunner look. Where Arena has no pattern (servers, ice), the board follows Netrunner's own table conventions, and takes nothing from jinteki.net's look. The board layout itself is [not yet decided](#not-yet-decided); the rows below that place cards on the screen describe the leading choice.

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
- **One layout, drawn from one board model.** The layout reads only the board model (see [Shared pieces](#shared-pieces)), so a second layout could be added later without touching game logic. Which layout, and whether it stays flat, is [not yet decided](#not-yet-decided). The first client's angled felt (`rotateX`) shrank the far side and made cards harder to read, so it was removed.
- **Landscape, desktop to phone.** Phones and tablets are locked to landscape in the Activity settings. Desktop is not locked; the one layout scales with the window, down to a phone held sideways. Every slice works on desktop and on a sideways phone.
- **Arena's play, our look.** The interaction model follows the [reference model](#reference-model). The palette, card backs, panels, and motion are the project's own.

## Technology

*Added 2026-11-15.* The client keeps its current stack: SolidJS, Vite, and TypeScript. The board is mostly text and layout (printed text, prompts, the log, a frame that runs from phone width to desktop), and the DOM handles that better than a canvas. Solid's small bundle suits the Discord Activity's mobile webview.

| Need | Choice | Slice |
|---|---|---|
| Snapshot state | `createStore` plus `reconcile`, keyed by card id, in place of the one snapshot signal in `app.tsx`. A card that changes zones keeps its object and its DOM node, which the motion in U6 needs | U1 |
| Click and drag to play | Native Pointer Events, which treat mouse and touch alike. A drop only picks one of the legal intents already lit. Use `@thisbeyond/solid-dnd` only if this turns out too thin | U1 |
| Fanned hand, glow, card backs | CSS transforms and custom properties. A card's place in the fan is computed from its index and set as a CSS variable | U1, U4 |
| Cards moving between zones | The View Transitions API, with a `view-transition-name` from each card id. Spike it first in Discord's mobile webview; if it falls short, use [Motion](https://motion.dev) or FLIP by hand | U6 |
| Styling | Plain CSS. Design tokens (palette, spacing, radii, motion timing) are custom properties on `:root`. `@layer` sets the order, container queries fit the Activity frame, and card states are `data-*` attributes (`data-state="playable"`). Split into one file per component, or CSS Modules, if it grows | All; tokens settle in U7 |

Not adopted:

- **Tailwind.** The board's dynamic values (fan positions, transition names, drag offsets) end up in CSS variables either way, and card states read better as named selectors than as long class strings. It can still be added later for panels and prompts without changing the tokens.
- **A canvas or WebGL renderer** (PixiJS, Phaser). It would mean rebuilding text layout, hit-testing, accessibility, and responsive layout. Consider it only if U7's visual pass needs effects the DOM can't do, and then as a layer under the DOM interface.
- **Another framework** (React with Framer Motion, Svelte), or a game framework that owns state and rules (boardgame.io). The engine and host already own both.

## Shared pieces

*Added 2026-11-23.* Each piece is built once, by the first slice that needs it, and later slices call it instead of writing their own. A slice that needs a piece not built yet builds it here, not as a local copy.

| Piece | What it is | Used by |
|---|---|---|
| Board model | One function turns the seat snapshot into the board's data, keyed by card id (`createStore` plus `reconcile`, see [Technology](#technology)). The layout reads only this, never the snapshot, which keeps a second layout possible | All; built in U1 |
| Card view | One component draws a card everywhere: hand, board, piles, zoom, the pending column. Its states (playable, target, chosen, facedown, rezzed, accessed) are `data-*` attributes, and the card back lives here | U1, U3, U4, U5 |
| Targeting | One rule for what lights up, from the `anchor` and `group` on each legal entry (U0), and one pick flow: the card, then the target | U1, U3, U5 |
| Pile view | One pile that opens to show only what that seat may see (CR 1.21, CR 10.2.2a): R&D, the stack, Archives with its facedown count, the heap, score areas, set-aside, removed from game | U3 (access), U4, U5 |
| Main button | The step's default action, the "Waiting for Corp" or "Waiting for Runner" state, and the space bar, in one place | U2, U3, U5 |
| Step names | One table that turns rule step ids into plain words | U2, U3, U6 |
| Card text | Printed text fetched once per card by its code and cached in the client | U4, U5, U6 |
| Design tokens | Palette, spacing, radii, and motion timing as custom properties on `:root` | All; settled in U7 |

## Slices

Sizes: **S** ≈ half a session, **M** ≈ one session, **L** ≈ two or three. Each slice ends with the game suite passing and a played match on the Learn to play decks.

| # | Slice | Status | PR | Size | What it delivers | Closes findings |
|---|---|---|---|---|---|---|
| U0 | **Wire inventory and anchors** | done | game #302 | S | List every intent type the engine can offer and what it points at (a card, a server, a subroutine, a choice option, nothing). The host adds to each legal entry an `anchor` (card id, server id, or none) and a `group` (basic action, install, play, run, ability, window, choice). The client stops reading engine intent fields directly. One legal entry per step is marked as the default, which is what the primary button does. Also list what the snapshot lacks for the later slices: counters, advancement, hosted cards, facedown Archives count, encounter position | Groundwork for 1, 7, 10 |
| AP | **Automatic-passing leak fix** | done | engine #934, game #304 | S | The host passes a window only on open information, and the engine no longer skips the second seat's priority based on hidden cards. See [Decisions](#decisions-for-a-human) | 4 |
| U1 | **Play from the board** | next |  | L | Starts with clickable layout prototypes, played in the browser pane, that settle the layout under [Not yet decided](#not-yet-decided). Each seat sees its own side at the bottom. The hand is a fan of card images along the bottom edge, always visible; a card with a legal action glows, and hover or long-press zooms it. Click or drag a card to act; legal servers and cards light up as targets. Install is the card, then the server. Basic actions (gain a credit, draw, purge) sit in one fixed bar. The flat "Legal plays" list leaves the default view and stays behind a debug toggle | 1, 2, 3 |
| U2 | **Priority, passing, and waiting** | to do |  | M | One primary button at the bottom right carries the step's default (Pass, Continue the run, End turn, Keep hand), and the space bar presses it. While the other seat decides, the button reads "Waiting for Corp" or "Waiting for Runner". A turn track shows draw, clicks as pips, and discard. Each seat sets stops on the track; without a stop, a window where that seat's only plays are ones it has chosen to skip passes by itself. "Pass until something happens" and a hold-priority toggle sit beside the button. The host resolves a step that has nothing to decide. Steps are named in plain words | 4, 5, 6, 13 |
| U3 | **Run flow** | to do |  | L | A run takes the focus the way combat does. The attacked server's ice column comes forward, a run track shows approach, encounter, movement, and breach, and the Runner's position is marked on the ice. The encounter view lists the ice's subroutines and the Runner's breaker actions against them. Jack out and continue are the two choices at movement. The Corp's rez decision on approach is a prompt on that ice. An access holds the card on screen until the Runner acknowledges it, with trash and steal as its actions | 7, 8 |
| U4 | **Every zone, and card detail** | to do |  | M | Identity panels with credits, clicks, tags, and agenda points. The opposing hand as a fan of backs with a count. R&D, the stack, Archives, and the heap as piles that open to show what that seat may see, with a facedown count for Archives. Score areas, set-aside and removed-from-game cards, hosted cards on their host, counters and advancement on cards. Card backs for hidden cards. A zoom view with the printed text, which the client fetches once per card and caches instead of receiving it in every update. A spectator layout: the Corp at the top, the Runner at the bottom, both hands as backs with counts (CR 10.2.2a), and no primary button, stops, or targets. The run view, pending column, log, and motion show for a spectator as they do for a player | 9, 10, 11 |
| U5 | **Choices and targets** | to do |  | M | Pending abilities and the open choice sit in a column of source cards at the side, newest on top, and simultaneous triggers are ordered there. A trace, a cost choice, and a "choose a card" each get a prompt that names the source card. Legal targets light up on the board and are chosen by clicking them | Rest of 1 |
| U6 | **Log and motion** | to do |  | M | A log in plain sentences, in a side drawer that can be closed, naming only cards that seat may see. Cards move between zones with short transitions, so a draw, install, trash, or access is seen. The last change on the board is marked | 8, 13 |
| U7 | **Fit the frame, and our look** | to do |  | M | The final fit from a sideways phone frame to a desktop one without scrolling, with touch-sized targets; every earlier slice already works at both sizes. This is the layout the Discord Activity frame will use. The project's own visual pass lands here: palette, card backs, panel style. The Discord SDK itself stays in Phase 6 | 12 |

Order: U0 → AP → U1 → U2 → U3 → U4 → U5 → U6 → U7. U1 starts after the repository layout plan and the CR audit program are done. U1 and U2 together are the first point at which a turn is playable without the list. U4 can move ahead of U3 if a played match shows missing zones hurt more than the run view.

## Findings

| Finding | Source | Status |
|---|---|---|
| axe-core reports `scrollable-region-focusable` (serious) on `.servers` at phone width: the server row scrolls but cannot take keyboard focus. It was there before the layout move, which changed no client code | layout G1 (game #343, `play-check`) | open |
| ~~`tests/client/board.test.ts` was never typechecked (the client tsconfig excluded it and the root one covered only `src/`). It has 3 type errors; the root tsconfig still excludes `tests/client`, with a comment~~ Fixed in game #344: `tests/client/` has its own tsconfig on the client's settings, `npm run typecheck:client` checks it in CI, and the 3 errors are fixed | layout G1 (game #341) | fixed |

## Decisions for a human

- **Automatic passing can leak information.** *Decided 2026-11-15.* `cr-checker` found that the CR allows automatic passing when Pass is a seat's only option (CR 9.2.7f), and allows stops, "pass until something happens", and a hold-priority toggle that a seat sets for itself (CR 9.2.4b, 9.2.4c). It does not allow the host's current test. `settleEmptyWindows` treats a window as empty from the engine's legal plays, and some of those depend on facedown cards: approach-ice `rez_ice` and `rez_asset` are offered only when affordable, and scoring is offered only for an agenda that can be scored. So whether the game pauses tells the Runner a rez cost, a card type, or a scorable agenda (CR 10.2.2a, 10.2.2b). *Fixed 2026-11-16:* engine `v1.147.261` (nhoople/netrunner-engine#934) no longer skips the second seat's priority based on hidden cards, and the host passes a window only on open information (nhoople/netrunner-game#304). The fix ran as its own session right after U0 and before U1: judge "nothing to decide" only from what the opponent can see, with a test for each of the three tells. U2 then builds on that, and must:
  - never auto-pass in an action window (CR 9.2.6b), or spend clicks or end the turn with clicks left;
  - never auto-pass with pending mandatory abilities, and not drop optional ones unless the seat asked (CR 9.2.8e, 9.2.9f);
  - never pay a 0 cost automatically (CR 1.16.1d);
  - send every automatic pass through the engine's `pass_window`, so the checkpoint runs (CR 9.2.4e, 10.3.3);
  - keep each seat's stops and toggles private to that seat.
- **Order of plans.** *Decided 2026-11-23.* The [repository layout plan](repo-layout.md) runs in full, through slice X, so U1 is written into the game's new folders and never moved. Then the whole [CR audit program](cr-audit-standardization-program.md), through "Phase 6 start". Then this plan, from U1. Then the [Discord Activity](discord-activity.md), which serves this board and is grilled when it starts. One plan at a time, so there is no longer a "working beside the audit" arrangement.
- **Interaction model.** *Decided 2026-11-23.* Keep Arena's (see [Reference model](#reference-model)). Marvel Snap and Hearthstone have too few response windows for Netrunner, and jinteki.net is dense, desktop-first, and asks most questions as text prompts. Netrunner's own table conventions fill the gaps Arena leaves.
- **One layout.** *Decided 2026-11-23.* Each extra layout would have to be built, screenshotted, and played in every slice. The board model keeps a second layout cheap to add later; choosing a layout is out of scope until after Done.
- **Orientation.** *Decided 2026-11-23.* Phones and tablets are locked to landscape in the Activity's settings; a portrait layout would be a second layout. Desktop is not locked. Every slice works on desktop and on a sideways phone from U1 on, rather than being fitted to phones at the end; U7 keeps the visual polish and final fitting.
- **Printed text.** *Decided 2026-11-23.* Fetched once per card by its code and cached, in U4. U0 measured it at about 9% of each seat update, repeated for every copy. It reveals nothing new, because a seat only asks for cards it has already been shown (CR 10.2.2a).
- **Design plugins.** *Decided 2026-11-23; accessibility changed 2026-11-27.* frontend-design sets visual direction while each slice builds. UI Design Review reviews each slice's `play-check` screenshots before its PR, and the slice fixes what it ranks highest. Accessibility is checked by axe-core, the open-source engine behind the Axe plugin, which `play-check` runs on every seat's page at every screenshot (WCAG 2.2 A and AA, including target size). It needs no account; the Axe plugin needs a Deque account, which the project does not have. axe-core does not judge keyboard play, so U1 and U2 add keyboard browser tests. Design is used only for wording (plain step names in U2, log sentences in U6) and for design tokens in U7.
- **Card images.** The host sends each visible card's link on Null Signal Games' image host (`card-images.netrunnerdb.com`), and clients load and cache the image from there. The game does not store or serve image files. A link names the card, so it is sent only where the title is (CR 10.2.2a).

## Not yet decided

- **The board layout.** Blocks: U1. The leading choice is the mirrored table: each seat's own side at the bottom, servers as columns with ice hanging toward the Runner, drawn flat, and during a run the attacked server's ice comes forward to a center stage. The others compared on 2026-11-23 were a stage and strip (servers shrink to a strip, the center shows what matters now) and sideways lanes (each server a row, ice pointing across at the Runner's rig). U1 starts by building clickable prototypes of the leading choice, and of the stage and strip if wanted, on a Learn to play match in the browser pane. The maintainer plays them before the layout is fixed.
- **How the layout fits a sideways phone.** Blocks: U1. Depends on the layout. The leading idea is a hand that shows as a low row of card tops on a short screen and rises when tapped, so the board keeps its room.

## Tests

- Each slice adds tests for its board-model logic in `tests/client/*.test.ts`, in the style of `board.test.ts`: a snapshot in, a model out.
- U0's host changes get tests in `src/match.test.ts`, including that an anchor never names a card the seat may not see.
- The visibility fuzz (audit tool 1.7, session P1-e) sweeps every seat snapshot. Any field this plan adds must be inside that sweep before the slice merges.
- Each slice ends with one full Learn to play match played by hand through `/play/`, both seats, with what broke written into the PR.
- Each slice's PR also carries a `play-check` contact sheet (every seat, sideways phone and desktop, at each turn, run, access, and the end), a UI Design Review of those screenshots, and a `seat-view-checker` report on the diff. Before U1, `play-check`'s phone screenshots move from a portrait phone width to a landscape phone size.
- The `play-check` contact sheet carries an axe-core accessibility table. A slice leaves no new critical or serious failure in what it built, and lists any it did not fix under "Found, not fixed". U7 clears the critical and serious failures that remain.
- U1 and U2 add keyboard tests to the browser tests (`npm run test:browser`): the board can be played without a mouse, focus moves in a sensible order, and the space bar presses the primary button.
- Nothing here needs an engine change. If a slice finds it does (a missing field in `getPublicView`, say), that is an engine PR with its own test and a maintenance release, per the [git hygiene](../git-hygiene.md) policy.

## Out of scope

- Discord sign-in, the embedded app SDK, matchmaking, the deck library, and deployment. Those are Phase 6.
- A deck builder. Decks come from NetrunnerDB, per the Phase 6 design.
- Sound, themes, cosmetics, emotes, and a turn timer.
- Arena's art, card frames, fonts, effects, sounds, and exact layout. The reference is how it plays.
- Changes to the verification table. Those are in the [verification table plan](done/verification-table.md).
- A second layout, or letting the player choose one. Revisit after Done if playing shows a need.
- A portrait layout for phones or tablets.

## Done

Two people can play a full Learn to play match through `/play/` without the flat list, on a desktop and on a phone-sized landscape frame, and each sees only their seat. Each plays from their own side of the board with one primary button, and a turn with no decisions needs no clicks beyond the plays themselves. A spectator can follow that whole match and sees neither hand. Then this plan moves to `docs/plans/done/`.
