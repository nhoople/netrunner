# CR audit and standardization program

*Drafted 2026-11-11 from an inventory of engine `v1.147.251` (master `aec05b54`), cards `v1.147.22`, and CR `v26.03`. Current versions are in the [pin table](../../README.md). The brief named `v1.147.250` as the floor, but the pin is already `v1.147.251` (the Midori choice-key fix, engine #895).*

*Revised 2026-11-12: added the card flag inventory (1.10), the generated kind reference (1.11), two Phase 2 guards, area 10, and the Phase 6 gate.*

*Revised 2026-11-13: added the playout blockers step between Phase 2 and area 1.*

*Revised 2026-11-14: Phase 2 done (engine #928); inventory counts corrected from its baselines.*

*Revised 2026-11-15: playout blockers done (engine #930 and #932, releases `v1.147.259` and `v1.147.260`); the playouts drop System Gateway (engine #931).*

*Revised 2026-11-19: added the kind and phrase check (1.12) and the [printed-text sweep](#printed-text-sweep-beside-phase-3-before-the-phase-6-gate) of the whole Eternal corpus; the Phase 6 gate now waits for every format to be clean and opens them all at once.*

*Revised 2026-11-19: the kind and phrase check (1.12) done in engine #941; its findings are listed under the printed-text sweep for the sweep sessions to confirm.*

*Revised 2026-11-19: area 1 (hosting and trash) done: engine #942 (release `v1.147.264`), game #313. Its new findings are filed under areas 2, 5, 6, 9 and 11.*

*Revised 2026-11-19: sweep S1 (Startup) done in engine #943–#945: 164 cards match, 35 wrong, 26 filed. PF-S1 (engine #948, release `v1.147.265`, game #314) fixed 14 wrong cards and the area 1 trash-hook finding, moved 6 to their areas, and left 15 for paired cut A ([S1 results](#s1-results-2026-11-19)). The S1 filed cards are in the findings table.*

*Revised 2026-11-19: sweep S2 (Standard) done in engine #946, #947 and #949: 388 cards, 271 match, 76 wrong, 41 filed ([S2 results](#s2-results-2026-11-19)). PF-S2 is next, then a fix-now session for icebreaker strength.*

*Revised 2026-11-19: PF-S2 (engine #950, release `v1.147.266`, game #315) closed the six S2 visibility leaks and worked all 76 wrong cards: 21 fixed, 26 moved to their areas, 29 left for paired cut A ([S2 results](#s2-results-2026-11-19)). FX-breakers is next.*

*Revised 2026-11-19: FX-breakers (engine #953, release `v1.147.267`, game #318) makes every break check the icebreaker's strength through one helper, `src/state/procedures/break.ts`, the start of area 11's break helper. It closed the two area 11 breaking rows and filed six new area 11 rows.*

*Revised 2026-11-19: sweep S2a (Ashes, engine #947) and S2b (Borealis, engine #946) done; S2c (Liberation) started. Added [Shared pieces](#shared-pieces) and [Out of scope](#out-of-scope), which the coordinate skill needs for every area brief.*

*Revised 2026-11-19: added the CR section coverage map (1.13) and its [first pass](#cr-section-owners-first-pass-2026-11-19): 24 CR sections, plus three deck-construction characteristics, had no area and no earlier program. They get areas 14 (run flow), 15 (keywords and credits) and 16 (game setup and end), and the Phase 6 gate waits for them. Added the [re-audit of the earlier programs and the interaction check](#re-audit-of-the-earlier-programs-and-interaction-check), which start now beside area 2.*

*Revised 2026-11-19: added six checks that reduce what the audit can still miss: official rulings as tests (1.14), the timing walk in the playouts (1.15), a second reader on another model (1.16), subrule citation coverage (1.17), ability fire coverage (1.18), and the cited-rule change check (1.19).*

## Why

Much of the engine was written card by card. A card that needed a procedure (swap, install, trash, host) often got its own copy of that procedure instead of a call to a shared one. The copies skip parts of the CR, and their tests check what the code does, not what the CR says. Engine #893 and #894 fixed three such swap copies. The inventory below shows the same pattern in every zone-moving procedure.

The earlier programs never covered this. The fidelity program (phases 1–5) standardized *timing*: ability records, trigger predicates, the 10.3.1a mark, and 9.9.9 replacement. The standardization program (S0–S6) standardized *continuous effects*: the 9.12 layer, 9.10 lingerings, choices, and the visibility module. Neither one audited how cards move between zones.

This program builds tools that find CR violations across the whole engine. It then routes each procedure through one shared helper that follows the CR, and adds guardrails so new copies can't come back.

### What it serves

*Added 2026-11-12.* The project has three goals, and the program is measured against each.

| Goal | What serves it here |
|---|---|
| A CR-cited engine | Phase 1 tools, the Phase 2 guards, and the shared helpers of areas 1–9 |
| A documented card format | The flag inventory (1.10), the generated kind reference (1.11), the count guard (Phase 2), the kind merges in each area, and area 10 |
| Discord-native play | Area 4 (visibility), the [printed-text sweep](#printed-text-sweep-beside-phase-3-before-the-phase-6-gate), and the [Phase 6 gate](#phase-6-gate), which starts the Activity once every format is clean |

## Shared pieces

*Added 2026-11-19.* Each area builds one helper for its procedure, and every later slice calls it instead of writing its own. A slice that needs a piece its area has not built yet stops and says so; it does not write a local copy. The names and CR rules come from the [Areas](#areas) table and the area results.

| Procedure | Owner | CR | State |
|---|---|---|---|
| Hosting | `src/state/procedures/host.ts`: `hostCard`, `unhostCard`, `unhostAllFrom`, the only writers of `hostId` and `hostedCardIds` | 1.13.13, 10.3.1g | Built (area 1) |
| Trash and discard, both sides | `src/state/procedures/trash.ts`: `trashCard(state, id, { by, cause, faceup, preventable, simultaneousSet })`, `discardCard` | 1.14.5, 4.4.6b, 10.3.1g | Built (area 1) |
| Run position and redirects | `src/state/runPosition.ts`: `setRunnerPosition`, `moveRunnerInward`, `noteIceUninstalled`, `addOutermostIce` | 6.2.4, 6.2.6, 6.2.7a/c/e | Exists; area 2 routes every position write through it |
| Uninstall and ice removal | `src/state/procedures/uninstall.ts`: `uninstallCard(id, destination)`, which calls `noteIceUninstalled`, fires `onUninstall`, and releases hosted cards through area 1 | 8.5.10 | Area 2 |
| Rearrange | `src/state/procedures/rearrange.ts`, with a run guard and position fix-up | 8.3.1, 8.8.2 | Area 2 |
| Swap | `src/state/procedures/swap.ts`: `swapCards(a, b)`, built on the uninstall helper and the three ice-swap helpers | 8.8.1–8.8.4d | Area 3 |
| What a seat can see | One seat-view filter in the engine (`seatVisibility.ts`, `getPublicView`) that redacts every payload; the game's spectator view built from it | 1.21.1–1.21.6, 10.2.1–10.2.3b | Area 4 |
| Corp install | `installCorp` with `{ source, destination, costMode, rezAfter, advancements, faceup }` | 8.5.1–8.5.11 | Area 5 |
| Runner install | `installRunner` with the same options, MU and console limits | 8.5 | Area 6 |
| Rez and derez | `src/state/procedures/rez.ts`: `rezCard(id, { costMode })`, `derezCard(id)` | rez and derez rules in ch. 8 (area 7 cites them) | Area 7 |
| Access | the `access_card` kind | 7.1–7.5 | Area 8 |
| Damage and prevention | `dealDamage` / `resolveDamage`; one prevent helper for the `prevent_*` kinds | damage and prevention rules in ch. 10 (area 9 cites them) | Damage exists; prevention is area 9 |
| Counters and advancement | `src/state/procedures/counters.ts`: `placeCounters(id, type, n)`, `removeCounters` | ch. 1 and 8 (area 12 cites them) | Area 12 |
| Search, shuffle and deck order | `src/state/procedures/deck.ts`: one search and one shuffle helper on the game's seeded random | area 13 cites them | Area 13 |
| Run flow | `src/state/procedures/run.ts`: the 6.9 steps, their paid-ability windows, and one hook table for start, approach, pass, success and end | 6.1, 6.3, 6.4, 6.6–6.9 | Area 14 |
| Tags, bad publicity and credits | `src/state/procedures/tags.ts`; bad publicity in one place; one credit-spend helper with spending restrictions and recurring credits | 10.5, 10.6, 1.10 | Area 15 |
| Setup and winning | `src/state/procedures/gameEnd.ts` (one win check); setup in 1.6's order; the game's deck check | 1.4–1.7 | Area 16 |
| Actions, breaking, play costs | `src/state/procedures/action.ts`, which records an action once with its type; one break helper, `src/state/procedures/break.ts` (`interfaceBlock`, `paidAbilityBreakBlock`, `runnerBreakBlock`, `subroutineBreakBlock`, `markSubroutineBroken`, `breakActionCost`); play costs charged in one place | 5.1–5.7, 6.5, 9.8.5, 8.6.2, 1.16, 3.9.5g | Break checks built (FX-breakers, engine #953); the Runner's choice of subroutine, bioroid breaks and the rest are area 11 |

Tools every slice uses: the `lookup` skill for CR and card text, the `cr-checker` agent, `expectStateDelta` (`tests/kind-coverage.ts`) for state assertions, the invariants in `src/debug/invariants.ts`, the Phase 1 baselines in `tests/baselines/`, and the game's verification table (V3 positions, V5 fixture export) for hand checks.

## Inventory (engine `v1.147.251`, cards `v1.147.22`)

### Corpus and Effect IR

| Measure | Count |
|---|---|
| Cards in the catalog | 2,016 |
| Printed abilities | 4,418 (2,123 static, 873 conditional, 545 paid, 563 subroutine, 314 play) |
| Kinds in `KNOWN_PRIMITIVE_KINDS` (`src/effects/ir.ts`) | 1,540 (1,537 at engine `v1.147.257`) |
| Kinds used by card JSON | 887 |
| Kinds used by exactly one card | 735 (746 at cards `v1.147.24`, counted per card id) |
| Kinds no card uses but the engine builds (continuations, flag-driven effects, `fx.*` helpers) | 633 (161 of them end in `_resolve`/`_pick`/`_continue`-style suffixes) |
| Dead kinds: no card uses them and nothing builds them, but each still has a dispatch `case` | 19 |
| Engine-built kinds with a card or pack name (`dtwn_wari_name_subtype`, `win_embezzle_named`, `tdatd_amani_bounce`, `glenn_host_card`, …) | in the 214-entry `tests/effect-ir-legacy-names.json` (272 after Phase 2 added 58 engine-built kinds that name a card) |
| Static declaration fields | 652 distinct fields; `CardDef` has 602 optional flag fields, 333 boolean and 269 number (`src/state/types.ts`; tool 1.10's count, not the 616 first estimated) |

The 19 dead kinds: `add_pending_damage`, `brain_damage`, `give_bad_publicity_unless_corp_pays`, `host_stack_card_on_source`, `increase_hand_size`, `may_breach_instead_eden_shard`, `may_breach_instead_keyhole`, `may_place_advancement_on_self_meat`, `may_swap_drawn`, `net_mercur_place_or_draw`, `pay_or_net`, `refresh_khondi_plaza_recurring`, `return_subliminal_from_archives`, `rez_installed_paying`, `set_skip_breach`, `swap_two_ice`*, `trace_white_hat`, `trash_hq_gain_credits_finalize`, `trash_rezzed_copy`.

\* **Correction to the brief.** `swap_two_ice` is not unused. No card JSON names it, but `src/actions/score.ts:334` builds it from Tāo Salonga: Telepresence Magician's static flag `maySwapIceOnAgendaScoredOrStolen`. Every option is `gain_credits 0`, so **Tāo's printed ability does nothing in play today.** That makes it a live card bug, not dead code. It also shows a blind spot: a flag can hide a kind from any search of card JSON.

### Ability labels

| Class | Labelled | Unlabelled |
|---|---|---|
| Paid (`label`) | 545 | 0 |
| Subroutine (`text`) | 563 | 0 |
| Conditional | 0 | 873 |
| Play | 0 | 314 |
| Static (declarations; no label expected) | — | 2,123 |

So 1,187 non-static abilities on 1,078 cards have no label. Midori and Mitra Aman are two of them. Nothing in either repo compares labels with `data/printed/<id>.json`, and `scripts/validate-cards.py` `check_printed` cross-checks only a few phrases.

### Procedure paths

"Bypass" means the code does the procedure itself instead of calling the shared helper.

| Procedure | Shared helper | Bypassing paths | What the bypasses skip |
|---|---|---|---|
| Corp install (8.5) | `installCorp` (`actions/installCorp.ts`), reached via `applyInstallCorpCard` | **42 kinds** write `server.ice`/`root` and `zone` directly. `applyCorpInstallPrimitive` (`effects/corpInstall.ts`) is four more copies, not a shared path | Only 5 keep `run.position` when ice is added. None apply the root limit, region trash, Server Diagnostics, or first-install/power-counter hooks |
| Runner install | `installRunner` (`actions/installRunner.ts`) | **30 kinds**, plus 8 semi-shared helpers in `effects/runnerInstall.ts` and `eval.ts` that push to `runner.installed` themselves; graph.ts ×4 | 19 kinds skip the MU limit, `fireOnInstall`, P/H hooks, link, console uniqueness, and the new-object reset. Compile and DaVinci set `rezzed` on Runner cards |
| Uninstall (non-trash) | **none.** `removeCardFromCurrentZone` (`state/scoring.ts:389`) only removes from arrays | ~40 sites; 9 use `removeCardFromCurrentZone`, the rest write arrays directly | `onUninstall`/`rfgOnUninstall` fire only inside the trash path, so **no non-trash uninstall fires them**. Direct ice removals skip `noteIceUninstalled`. `rfgRunnerInstalled` orphans hosted cards |
| Swap (8.8) | `trashHostedOnSwapOut`, `occurSwapCheckpoint`, `canSwapIntoPlaceOf` (private to `swapKinds.ts`) | 4 kinds use them; **13 don't**: Daruma `swap_pick`, Sakai `swap_execute`, `swap_with_grip_subtype_resolve`, ice↔ice swaps (Mumbad doesn't update `zone`), Tāo stub; 3 duplicate ice-swap helpers | 8.8.4b hosted trash, 8.8.2 legal location, swap checkpoint. Sakai keeps `rezzed` and counters in HQ |
| Trash | `trashToHeap`→`moveRunnerCardToHeap`, `trashCorpCardToArchives`, `trashByCheckpoint`, `releaseHostedCardsOnTrash` | **21 local re-implementations** in `effects/primitives/*`; ~115 of 123 `discardPile.push` sites are outside the helpers | Trash prevention, `onTrash`/`onUninstall`, pending-ability cancel, first-trash markers, hosted release |
| Hosting | **none** | ~40 sites write `hostId`; ~25 also write `hostedCardIds`, ~11 write `hostId` only | Two representations: code reading `hostedCardIds` misses hostId-only cards, and code clearing `hostId` hides cards from the 10.3.1g checkpoint |
| Rez | `rezIce`, `rezAsset`, `rezInstalledIgnoringCosts`, `rezAfterInstall` | 12 direct `rezzed = true` with hooks; **21 with no hooks** | `onCardRezzed`, `fireOnRez`, rezzed-this-turn tracking |
| Derez | **none** (`derez_card` is the de facto one) | ~9 with host triggers but no Keros/Maui; ~11 with no hooks | Derez triggers, `iceDerezzedThisRun` |
| Ice rearrange (8.3) | none | Sunset `rearrange_server_ice`, `escher_rearrange_server_ice`, Mandatory Seed `rearrange_ice_protecting_all_servers` | No run guard and no position fix-up. Mandatory Seed empties every `server.ice` up front, so during its choices every ice has a `server:X:ice` zone but sits in no array |
| Run position (ch. 6) | `state/runPosition.ts` (`setRunnerPosition`, `noteIceUninstalled`, `addOutermostIce`) | 18 setter calls outside the graph; **4 direct writes** (`installCorp.ts:422,488`, `checkpoints.ts:4042`, Mind Game `redirect_resolve` writing −1); 13 `attackedServerId` writes; 7 run objects built outside `run.ts` | Nothing checks `encounter.iceId === iceAtRunnerPosition()` after a move or swap. The source-scan guard in `tests/ice-uninstalled-during-run.test.ts` misses `+=`, `-=`, and cast writes |
| Access (ch. 7) | `beginBreachAccess`, `access_card`, `completeStealAgenda` | 3 of 69 kinds: Khusyuk `access_set_aside`, `resolve_deep_dive`, Detente `access_random_hq` | No trash option and no on-access triggers. Detente isn't random and leaves the card faceup in HQ |
| Damage | `dealDamage`/`resolveDamage` (`state/damage.ts`) | none found | Clean. ~50 grip mutations are printed trash/shuffle effects, not damage |
| Visibility (1.21) | `state/seatVisibility.ts`, `getPublicView` | game `spectatorView` (`netrunner-game/src/match.ts:1319`) is a second builder | `getPublicView` passes `run`, `pendingAbilities`, `pendingEffectContinuation`, `reactionStack`, `lingeringEffects`, `reveals` and the full `log` through as raw clones. The game deletes the log, but the rest is unswept |

### Direct state writes (Phase 2 baseline candidates, `src/**/*.ts`)

*The type-checked counts from the Phase 2 write guard are in [Phase 2 results](#phase-2-results-2026-11-14). They replace this regex estimate.*

| Pattern | Sites | Files |
|---|---|---|
| `.zone =` | 550 | 86 |
| `hostId =` | 113 | 45 |
| `hostedCardIds =` / `.push`/`.splice` | 87 | ~35 |
| `server.ice =` / mutators | 50 | ~20 |
| `.root =` / mutators | 54 | ~25 |
| `installed =` / mutators | 140 | ~55 |
| `discardPile.push` | 123 | — |
| hand, deck, score area, removed-from-game mutators | ~600 | — |

### Known bugs this inventory confirmed

1. **Off-Campus Apartment.** The brief's claim is confirmed, and it is worse than stated. In `releaseHostedCardsOnTrash` (`state/trashHooks.ts:370–406`), a hosted Runner card is pushed to the heap but stays in `runner.installed`. `hostId` is cleared first, so the second loop and the 10.3.1g checkpoint skip it, and no trash triggers or prevention run. In the other direction, trashing a hosted card through `moveRunnerCardToHeap` never removes it from the host's `hostedCardIds`.
2. **Tāo Salonga's swap does nothing** (above).
3. **Mandatory Seed Replacement leaves ice in no array** while its choices are open. A checkpoint in that window could delete an ice-only remote.
4. **Citations.** `seatVisibility.ts`, `api/library.ts:352` and `types.ts:6057` cite CR 1.18 for visibility (3 sites; the other 5 CR 1.18 citations are correctly about advancing). At `v26.03`, 1.18 is Advancing Cards; visibility is 1.21. `state/currents.ts` cites 3.5.1d, which doesn't exist at the pin.
5. **Access.** Detente and Khusyuk bypass access (above).
6. **`.claude/agents/cr-checker.md` is wrong about labels.** It says printed wording is in each ability's `label`, but conditional, play and static abilities have none. It should read `data/printed/<id>.json` at the cards tag.

## What held up in the earlier programs

Checked against the code, not the roadmap text.

| Claim | Verdict | Evidence |
|---|---|---|
| Fidelity 3: `fireStoredConditionals` / `fireInlineConditional` removed | Holds | 0 references; 42 `noteInlineConditional` callers on the note path |
| Fidelity 1, 2, 4, 5 | Not contradicted | Not re-audited in depth. Phase 1 tools cover them indirectly (playouts, CR examples) |
| S3 lingering single-write | Holds | The old maps are gone. `markServerId` survives only as a public-view field |
| S4: `pendingChoice = {` only inside the helper | Mostly holds | 2 direct writes remain: `actions/costCards.ts:216`, `state/msKeywords.ts:65` |
| S5: one visibility module | Partly holds | The engine module exists but cites the wrong rule, `getPublicView` clones run and pending state raw, and the game builds spectator views separately |
| S6: static declarations; no new one-off flags | Narrow | True for subtype grants and gained subs only. 616 boolean card flags remain, and flags hide procedures, as Tāo shows |
| `tests/one-off-kind-coverage.test.ts` | Weak | It passes when a test *mentions* the kind name, and its baseline is already empty. Yagi-Uda passed this way |
| `tests/rule-cite-map.test.ts` | Holds, narrow | Checks only the `CR` object in `labels.ts`, both ways. Nothing checks comment citations or that a citation means what the code says |
| `boardProblems` in `tests/learn-to-play-playout.test.ts` | Reusable | The seed of the invariant checker, but it is local to one test (2 seeds × 40 steps, Gateway decks only) |
| CR examples | 232 of 243 referenced | Missing: 1.15.1.ex1–4, 1.4.5a.ex1, 1.4.6d.ex1, 10.1.5.ex2, 9.11.2a.ex1–2, 9.11.4a.ex1, 9.3.3f.ex1. Nothing enforces coverage |
| jnet ports | Exist, not run | 199 manifest entries (40 ported, adapted or promoted; 159 deferred), 69 `it()`s. `vitest.config.ts` excludes them, so CI doesn't run them |
| Game leak tests | Narrow | They check the other seat's hand and deck ids on the opening state only. No sweep of titles, pending, priority, or run payloads |

Keep and reuse: `runPosition.ts`, the three swap helpers, `installCorp`/`installRunner`, `trashToHeap`/`trashCorpCardToArchives`, `dealDamage`, `openPendingChoose`, `seatVisibility.ts`, `boardProblems`, the one-off-kind baseline mechanism, `rule-cite-map`, and the jnet manifest.

## Phase 0: housekeeping (meta repo, docs only, S) — done 2026-11-12

- Fix `.claude/agents/cr-checker.md` so it reads printed text from `data/printed/<id>.json` at the cards tag and treats `label`/`text` as the engine's paraphrase.
- Note this program in `docs/roadmap.md`. Rewrite the S5 and S6 rows to match the "held up" table.
- Record the Tāo, Mandatory Seed and OCA bugs as known gaps, with links to the areas that fix them.

## Phase 1: verification tools

Sizes: **S** ≈ half a session, **M** ≈ one session, **L** ≈ two or three. "Release" says whether `src/` changes.

They are ordered by expected bugs found per hour. Each tool writes a baseline JSON under `tests/baselines/` that may only shrink. Each new entry needs a fix or a dated human decision. Test-only tools merge with no tag. Tools that add a `src/` debug hook ship in one engine maintenance release at the end of Phase 1.

| # | Tool | Size | Builds on | Expected to find | Release |
|---|---|---|---|---|---|
| 1.1 | **State invariant checker.** `src/debug/invariants.ts` exports `checkInvariants(state): Problem[]`. A vitest `setupFiles` hook wraps `applyIntent`/`applyAction` so it runs after every action in every test. Checks: each card in exactly one zone array, matching `zone`; `hostId` ↔ `hostedCardIds` agree both ways and the host is installed; nothing in heap, Archives, HQ, grip, stack, R&D or score is listed installed or hosted; `run.position` is in range or null (never −1); `encounter.iceId === iceAtRunnerPosition()` unless `iceUninstalled`/`positionVacated`; every `server:X:ice` card is in that server's `ice`; Runner cards are never `rezzed` | M | `boardProblems` | OCA double zone; hostId-only cards; Mandatory Seed orphans; Mumbad `zone`; Compile/DaVinci `rezzed`; `rfgRunnerInstalled` orphans; position drift from the 37 install bypasses. Expect a large initial baseline, keyed by test name + problem code | Engine maintenance (one, end of Phase 1) |
| 1.2 | **No-op and dead-kind sweep.** `tests/kind-liveness.test.ts`: (a) the 19 dead kinds; (b) each `choose`/`options` builder where every non-decline option is a no-op (`gain_credits 0`, empty `seq`); (c) card flags whose consumer builds a no-op kind | S | IR walk in `one-off-kind-coverage` | 19 dead kinds, Tāo, and more stubs like it | Test-only |
| 1.3 | **Seeded random playouts.** Extend the learn-to-play playout: (a) every Learn to play list; (b) random legal decks per format from `pool.json` (fixed seeds); (c) N seeds × 200 steps, with N set per CI budget and a larger nightly-style local script. Invariant checker on. A failing seed is saved to `tests/fixtures/playout-seeds.json` and replayed as a regression test | M | 1.1, `queryLegality` | Crashes, refused legal actions, and invariant failures from card combinations no hand-written test covers | Test-only |
| 1.4 | **Printed-text check.** `scripts/check_labels.py` in cards-data (written in Python to match that repo's CI; baseline in `scripts/baselines/labels.json`), run by CI as a report and a baseline, never a hard fail on wording: (a) conditional and play abilities with no label (1,187); (b) labels whose normalized text isn't a substring of `printed/<id>.strippedText`; (c) cards with non-empty `unsupported` | S | `data/printed/` | 1,187 missing labels; paraphrase drift. Labels get added area by area in Phase 3 | Cards test-only |
| 1.5 | **Citation test.** Extend `rule-cite-map.test.ts`: (a) every literal `CR n.n…` in `src/**` exists at the pin (now: 1 miss, 3.5.1d); (b) a topic check that compares keywords near the citation (visibility, swap, install, trash, host, rez, access, damage, run) with the cited node's section title and text, and records mismatches in a baseline for cr-checker review | S (a) + M (b) | `vendor/cr-data/nodes.json` | 1.18 → 1.21 (3 sites); citations like 6.2.7e used where the rule doesn't apply | Test-only (comment fixes ship with each area) |
| 1.6 | **CR example coverage table.** `tests/cr-example-coverage.test.ts` lists every `.exN` at the pin and the `it()` that cites it; unreferenced examples go in a shrink-only baseline. It also emits a per-area table that Phase 3 reads | S | `cr-examples-ch*.test.ts` | 11 gaps now. Adequacy, not presence, is checked by mutation (1.9) | Test-only |
| 1.7 | **Game visibility fuzz.** In netrunner-game, play seeded matches through `Match` and, after each intent, walk each seat's and the spectator's snapshot JSON for any hidden card id or title the CR 1.21 / 10.2 rules give that seat no right to see. Uses the engine's own facedown/hidden sets as the oracle | M | game test harness, 1.3 seeds | Leaks through raw `run`/`pending*`/`reactionStack`/`reveals` clones; spectator builder drift | Game test-only |
| 1.8 | **jnet in CI and disagreement list.** Run `npm run test:jnet` in CI as a non-blocking job. Classify the 159 deferred entries: where the CR is silent or unclear and jnet differs, add a `disagreement` status with a CR cite and leave it **for a human decision**, never auto-fixed | M | `tests/jnet/manifest.json` | Rules the CR doesn't settle; a reading list per area | Test-only |
| 1.9 | **Mutation testing.** Stryker with the vitest runner, configured per area (`mutate` = that area's helper files, test filter = that area's tests), run locally rather than in CI. Score recorded per area in `docs/mutation-scores.md` in the engine | M setup + S per area | — | Tests that check code shape, not outcome (the Yagi-Uda pattern). Used in each Phase 3 area | Test-only (devDependency) |
| 1.10 | **Card flag inventory.** `tests/card-flag-inventory.test.ts` lists every optional boolean and number field on `CardDef` (`src/state/types.ts`) and every top-level property in the pinned `schema.json`. For each it records the cards that set it, the sites in `src/` that read it, and the kind that reader builds, if any. It also reports a flag nothing reads and a flag no card sets. Baseline `tests/baselines/card-flags.json`, shrink-only. Tool 1.2(c) reads its flag-to-kind map | S | `CardDef`, `vendor/cards-data` | Flags that hide a procedure the way Tāo's does; unread and unset flags. Starting size: 616 boolean flags on `CardDef`, and 854 top-level schema properties (333 boolean, 268 integer, 220 object) | Test-only |
| 1.11 | **Generated kind reference.** `scripts/build-kind-reference.mjs` writes `docs/effect-ir-kinds.md` in the engine from `KNOWN_PRIMITIVE_KINDS` and the `Effect` type in `src/effects/ir.ts`: each kind, its fields, how many cards use it, and whether a card or the engine builds it. A test fails when the file is stale, the way `scripts/jnet-status.mjs --write` guards its generated block. `docs/effect-ir.md` links to it | S | `ir.ts`, the IR walk in `one-off-kind-coverage` | Nothing on its own. It makes the card format readable without the engine source, and each area's kind merges show up as a shorter file | Test-only |
| 1.12 | **Kind and phrase check.** *Added 2026-11-19. Done in engine #941 (test-only): the baseline `tests/baselines/printed-phrases.json` holds 14 cards and 15 hits, and 706 of 905 kinds are paired with a phrase.* `tests/printed-phrases.test.ts` pairs effect kinds with the phrases their printed text should hold (`deal_net_damage` and "net damage", `end_the_run` and "end the run", `gain_credits` and "gain"), and checks each card's kinds against `vendor/cards-data/printed/<id>.json`. It includes the kinds a card flag's reader builds, from the 1.10 map, so a flag can't hide a kind the way Tāo's did. It also flags polarity ("if you do" against "if you do not"). Report and a shrink-only baseline `tests/baselines/printed-phrases.json`. It generalizes the [stale-text audit](done/stale-text-audit.md) | S | 1.10, `vendor/cards-data/printed` | Wrong models whose kind names an effect the card never prints, and guards each card the sweep checks against a later regression | Test-only |
| 1.13 | **CR section coverage map.** *Added 2026-11-19.* `tests/cr-section-owners.test.ts` reads every section (`n.n`) at the pin from `vendor/cr-data/nodes.json`, and an owner table in `tests/cr-section-owners.json`. Each section has one owner: an area, an earlier program (`fidelity` or `standardization`, both in `docs/plans/done/`), `reference` (definitions with no procedure of their own), or `none`. A section split between owners lists its subrules (8.5 Corp install to area 5, Runner install to area 6, uninstall to area 2). The test fails when a section at the pin is missing from the table, so a CR pin bump shows its new sections. Sections marked `none` go in a shrink-only baseline. The generated table also counts, per section, the `src/` citations and the tests that cite it, from the 1.5 map. It does not check interactions between cards or whether a reading of a rule is right | S | 1.5, 1.6, `vendor/cr-data` | Rules that no area and no earlier program audits; the [first pass](#cr-section-owners-first-pass-2026-11-19) found 24 sections | Test-only |
| 1.14 | **Official rulings as tests.** *Added 2026-11-19.* `tests/rulings.test.ts` lists every ruling at the cards pin (`vendor/cards-data/rulings/`: 275 rulings on 134 cards at cards `v1.147.25`) and the `it()` that cites it by card and ruling number. Uncited rulings go in a shrink-only baseline `tests/baselines/rulings.json`. A ruling the engine plays wrong is a finding filed under its area, the way the sweep works, not a fix in the tool's session. Only three engine tests mention a ruling today | M–L, in batches | 1.6's pattern, `vendor/cards-data/rulings` | Misreadings and card interactions that the rules body has already answered | Test-only |
| 1.15 | **Timing walk in the playouts.** *Added 2026-11-19.* During the seeded playouts (1.3), the apply hook records each step of the timing graph (`src/timing/graph.ts`, `machine.ts`) the engine passes through. A checker compares each turn, run, breach and access with the chapter 11 chart that `tests/timing-chart.test.ts` already reads: steps in chart order, none skipped unless an ability skips it (6.1.3), and at a step marked (P), (R) or (S) the matching window is offered when the player can use it. Failures go in the playout baseline. Today the chart is checked against the graph and in hand-built tests; this checks the order the engine really follows with every card in the pools | M | 1.3, `timing-chart.test.ts`, `src/debug/applyHook.ts` | Skipped or misplaced windows and steps across every card in play (Panic Button and Mamba's narrow windows are this kind) | Test-only; engine maintenance if `src/debug/` changes |
| 1.16 | **Second reader on another model.** *Added 2026-11-19.* A session on a model other than the one that wrote the fix gets only the CR text, the printed text, the rulings and a board position (a V5 fixture), never the engine code or tests, and writes the expected outcome to `tests/second-reader/<batch>.json` with the model's name. A test runs the engine on each position and compares. Each difference goes to cr-checker; one the CR leaves open goes on the disagreement list for Nathaniel. Batches: the CR examples (1.6), the rulings (1.14), the jinteki scenarios (P1-l), then each area's hand checks | M per batch | 1.6, 1.14, P1-l, the V5 fixture export | A rule read the same wrong way by the agent that wrote the fix and by cr-checker | Test-only |
| 1.17 | **Subrule citation coverage.** *Added 2026-11-19.* `tests/cr-subrule-coverage.test.ts` lists every rule below section level at the pin, other than examples, and the `it()` titles that cite it. Uncited subrules go in a shrink-only baseline, grouped by the owner from 1.13, so each area's evidence step reads its own list. It is 1.6 one level finer | S | 1.6, 1.13 | Rules with an owner but no test, such as 6.3.2a before engine #932 | Test-only |
| 1.18 | **Ability fire coverage.** *Added 2026-11-19.* The playouts record each card ability (by its 9.3 record) that resolves. `tests/generated/ability-fire-coverage.json` lists, per supported card, the abilities that never fired across the seeded playouts; they go in a shrink-only baseline, and each area's evidence step reads its cards' entries and adds a hand-built test for each | S–M | 1.3, the 9.3 records | Abilities no test and no game ever runs | Test-only |
| 1.19 | **Cited-rule change check.** *Added 2026-11-19.* `tests/cr-cited-text.test.ts` keeps the text of every rule node that `src/` or a test cites at the pin, in `tests/baselines/cr-cited-text.json`. On a CR pin bump, each cited rule whose text changed fails until someone re-reads the code and tests that cite it and updates the entry with a note. It automates the engine's `docs/cr-pin-bump-checklist.md`; 1.13 already catches new sections | S | 1.5, 1.13 | Changed wording in a rule the engine already follows | Test-only |

Order 1.1 → 1.2 → 1.3 → 1.4 → 1.5a → 1.6 → 1.7 → 1.5b → 1.8 → 1.9. 1.1 comes first because 1.3 and 1.7 need it. 1.2, 1.4, 1.5 and 1.6 don't depend on each other or on 1.1 and can run in parallel. 1.10 runs beside 1.2, which reads its map. 1.11 depends on nothing and can run at any point in Phase 1. 1.12 was added after Phase 1 closed. It depends only on 1.10 and runs now, beside area 1. 1.13 was added on the same day. It depends on nothing new and runs before the areas it adds start.

1.14–1.19 were added on 2026-11-19 after 1.13. 1.17 and 1.19 can run at any time. 1.14 and 1.18 run beside the areas. 1.15 runs before area 14, whose evidence step reads it. 1.16 runs after 1.14 and P1-l, since their cases are its first batches.

### CR section owners, first pass (2026-11-19)

*Read from the CR `v26.03` section list against the areas. Citation counts are `CR n.n` mentions in the engine's `src/` and `tests/` at `v1.147.267`. Tool 1.13 replaces this list with its table.*

- **Owned by an area:** 1.9, 1.11, 1.12, 1.13, 1.16, 1.17, 1.18, 1.19, 1.20, 1.21; 4.2–4.6, 4.8; chapter 5; 6.2, 6.5; chapter 7; 8.1–8.3, 8.5–8.8; 9.5, 9.7, 9.8; 10.2, 10.4, 10.8, 10.14.
- **Owned by an earlier program, re-audited here:** 9.1–9.4, 9.6, 9.9–9.12 and 10.3 (the fidelity program: ability records, triggers, checkpoints, replacement; the standardization program: continuous effects, lingering effects, static declarations). The [re-audit](#re-audit-of-the-earlier-programs-and-interaction-check) checks them; until it reports, findings in them go to area 11, as Femme Fatale's did.
- **Reference:** 1.1, 1.2, 1.3, 1.8, 4.1, 4.7, 10.1, and chapter 11, which restates chapters 5–7. The sweep checks 1.2.1 card by card. Chapters 2 and 3 are printed characteristics; a subrule there that describes a procedure belongs to the area of that procedure (3.5.1 currents and 3.9.5 breaking to area 11).
- **No owner:**

| Group | Sections | Engine citations (`src/` / tests) | Owner (decided 2026-11-19) |
|---|---|---|---|
| Run flow | 6.1 General, 6.3 Initiation, 6.4 Approach Ice, 6.6 Movement, 6.7 Success, 6.8 Run Ends Phase, 6.9 Steps of a Run | 5/6, 2/2, 2/0, 1/2, 3/2, 26/14, 22/68 | New area 14 |
| Keywords | 10.5 Tags, 10.6 Bad Publicity, 10.7 Link, 10.9 Load and Empty, 10.10 Charge, 10.11 Mark, 10.12 Sabotage, 10.13 Dividends; 1.10 Credits | 1/0, 5/0, 0/0, 0/1, 0/0, 3/6, 13/11, 9/5; 8/11 | New area 15 |
| Game setup and end | 1.4 Deck Construction, 1.5 Extra Cards, 1.6 Starting the Game, 1.7 Ending the Game; 2.11 Minimum Deck Size, 2.12 Influence Limit, 2.14 Influence Cost | 6/24, 15/4, 16/5, 5/3; 2/0, 2/0, 2/0 | New area 16, engine and game (deck legality is in the game's `decks.ts`) |
| Ownership and targets | 1.14 Ownership and Control, 1.15 Targets | 60/22, 39/35 | Area 11; the four uncovered 1.15 examples go with it |
| Remove from the game | 4.9 | 0/0 | Area 2, beside `rfgOnUninstall` |
| Drawing | 8.4 Drawing Cards | 14/7 | Area 13 |

Two findings already sit in these sections without an owner of their own: the Runner flatlined at the wrong moment (1.7.2b, filed under area 9) and psi bids that can't spend bad publicity credits (10.6.2, filed under area 11).

## Phase 1 results (2026-11-14)

Phase 1 is done. All tools are on master: engine #898–#907 (release `v1.147.252` for the `src/debug/` hook), cards #293 and #294, game #283 and #284. The baselines are in each repo's tests; this section records what they found, and what is still open. Each Phase 3 area reads its own entries in its Evidence step.

**Corrections to the inventory above**

- 3 sites cite CR 1.18 for visibility, not 8 (fixed above).
- 17 dead kinds, not 19 (`tests/baselines/kind-liveness.json`), plus 4 no-op choice builders, including `swap_two_ice`.
- 12 uncovered CR examples, not 11 (`tests/baselines/cr-examples.json`).
- Label drift: 395 paid and subroutine labels don't match the printed text. A triage on 2026-11-14 rebuilt the list (393 by its criterion, all paid abilities) and sorted it: 371 paraphrases (abbreviations, shortened "use only" notes, reworded counter costs, 42 `Pump <Title> +N strength`), 12 wrong labels on a correct model (the area 11 rows below), and 9 wrong models. Four are serious enough to fix now, one engine session each, outside the areas: Security Nexus (auto-resolved trace, usable outside an encounter), N-Pot and Hákarl 1.0 together (the Runner can't use the break), False Lead (trashed, not forfeited), and Vladisibirsk City Grid (a click in the cost). The other four are area 11 rows below: Labyrinthine Servers, Corporate Troubleshooter, Panic Button and Mamba. Unregistered S&W '35 is fixed (engine #918, cards #297).
- Two kinds carry a pack prefix, against the naming rule: `cotc_no_one_home` and `win_gebrselassie_host`.

**Findings by area**

| Area | Finding | Source | CR |
|---|---|---|---|
| ~~1 Hosting and trash~~ | ~~A played current is also pushed to its discard pile while still active (`trashActiveCurrentsBeforePlay`)~~ Fixed in engine #942: an ended current is trashed at the next checkpoint, by its controller | jnet, invariants | 3.5.1b, 8.6.6c |
| 2 Uninstall and run position | A host that moves from installed to a score area keeps its hosted cards: `leftPlay` in `checkpoints.ts` leaves out score areas (Casting Call). Track "this host was uninstalled" in the uninstall helper | cr-checker (engine #942) | 1.13.13, 10.3.1g |
| 2 Uninstall and run position | About 20 ability hosting sites call `hostCard(…, { installed: true })` for cards that are not installed and then set `zone` by hand. Same result; use `hostCard` without `installed` when the move helper lands | cr-checker (engine #942) | 1.13.2a, 1.13.12 |
| 5 Corp install | Architect installs and rezzes, ignoring all costs (1.12) | kind and phrase check (engine #941) | 1.2.1, 8.5 |
| 5 Corp install | The install-time trash in `installCorp.ts` passes no `faceup`, so a card the Runner is looking at goes faceup; the region-limit path already keeps the installed face | cr-checker (engine #942) | 8.5.7 |
| 6 Runner install | The memory-limit trash at checkpoint 10.3.1e records no player; the Runner carries it out | cr-checker (engine #942) | 3.9.3c, 1.14.5a |
| 9 Damage and prevention | No test observes Director Haas's pending record (`controller`, `mandatory`, `independentOfSource`); its ability resolves in the same instruction. 7 surviving mutants in `procedures/trash.ts` | Stryker (engine #942) | 9.6.12 |
| 3 Swap | Cordyceps and Tatu-Bola write the ice arrays directly, outside the swap helpers | sweep S2a, S2c (engine #947, #949) | 8.8 |
| 4 Visibility | `mustRevealWhenAccessedFromRd` only writes a log line; nothing records a reveal (Ganked!, Increased Drop Rates, Behold!) | sweep S2a, S2c | 1.21 |
| 5 Corp install | Effect installs through inline copies or `may_install_from_hq_paying_costs`, which always makes a new remote, skips trashing a card already in the root, or skips install triggers: Kakurenbo, Red Level Clearance, Secure and Protect, Vaporframe Fabricator, Digital Rights Management, Architect Deployment Test, A Teia, Active Policing, Eminent Domain, Greasing the Palm, Janaína "JK" Dumont Kindelán, Warm Reception | sweep S2a, S2c | 8.5 |
| 6 Runner install | Effect installs drop programs over free MU, trojans and install-on-ice cards: Into the Depths, Rigging Up, Spark of Inspiration, World Tree, Gachapon, Self-modifying Code, The Artist, Rejig, Simulchip, Arissana Rocha Nahu, Bahia Bands, Privileged Access, The Price, Window of Opportunity | sweep S2a–S2c | 8.5, MU rules |
| 10 Card flags | The "not rezzed and not persistent, skip" test at 12 sites treats an unrezzed persistent card as active; persistence applies only to a rezzed card the Runner trashes (Daniela Jorge Inácio, Tucana) | sweep S2c | 9.12.5a |
| ~~11 Turn structure~~ | ~~Paid-ability breaks check no strength, and the paid-break path skips Hammer's break limit (Audrey v2, Curupira, Lobisomem, Living Mural, Slap Vandal, Umbrella, Banner). Fix-now session after PF-S2~~ Fixed in engine #953 | sweep S2c | 3.9.5g, 9.3.6c |
| 11 Turn structure | Additional costs are not checked for payability before the effect: End of the Line plays with no tags, Vasilisa places its counter unpaid | sweep S2b | 1.16.10b, 1.16.11a |
| 12 Counters and advancement | `place_advancements` candidate lists keep only agendas and advanceable cards, but placing counters is not advancing (Big Deal, Akhet, La Costa Grid, Remastered Edition, Sericulture Expansion, Cohort Guidance Program, Stoke the Embers, The Holo Man); no split mode for "a total of" (Shipment from Vladisibirsk) | sweep S2a–S2c | 1.18.2 |
| 13 Search and shuffle | `search_rd_type_to_hq` takes the first match and does not shuffle on a miss (Gaslight, Wave, Fast Track, Levy University, Executive Boot Camp, Digital Rights Management) | sweep S2a, S2b | 8.7.2, 8.7.3 |
| 11 Turn structure | An ended current is trashed at the checkpoint after the new current resolves, not at the 8.6.7e checkpoint before it | cr-checker (engine #942) | 8.6.7d–f, 3.5.1b |
| 11 Turn structure | Lockdowns are trashed in the turn-begin step just before the checkpoint, not during it | cr-checker (engine #942) | 3.5.1c |
| 3 Swap | Mutation score 32% (61% of covered). Removing the hosted-card trash, the swap checkpoint's install handling, or any legality gate in `canSwapIntoPlaceOf` survives | Stryker | 8.8.4b, 8.8.2 |
| 4 Visibility | The Corp's view shows its own R&D card ids in `run.accessCandidates`, `accessingCardId` and `accessedCardIds` during an R&D access | game fuzz | 4.1.5, 10.2.2a |
| 4 Visibility | The Runner loses sight of HQ cards already accessed this breach (`stripSecrets` nulls them) | game fuzz | 7.3.1a |
| 4 Visibility | Harishchandra Ent.: the engine lists the Runner's grip in `opponent.revealedHand`, but the game strips the ids to `null`, so the Corp loses information it may see | fuzz scenarios (game #297) | 1.21.3 |
| 4 Visibility | ~~Invasion of Privacy shows the grip by setting `faceup` on the cards, not by a reveal in `state.reveals`.~~ Fixed in engine #929 and game #298 | fuzz scenarios (game #297) | 1.21.3, 1.21.6 |
| 4 Visibility | The game's visibility oracle allows a reveal's titles only at the step of the reveal, so the host log line and `view.reveals` written at the next action are flagged. These are records of a reveal both players saw. Three Invasion of Privacy entries are baselined as allowed. Teach the oracle that a reveal record stays open | game #298 | 1.21.3 |
| 4 Visibility | 3 CR 1.18 citations for visibility; 2 CR 1.16.1b citations for additional costs (1.16.10); 1 CR 10.1 for ignoring costs (1.16.5c, area 5) | citation topics | — |
| 4 Visibility | cr-checker review of the citation baseline (2026-11-14). `seatVisibility.ts` CR 1.18 → 1.21 (1.21.1, 1.21.2a). `api/library.ts` and `types.ts` ice-counter docs: drop 1.18.1 and keep 10.2.3a, adding 4.6.3. Earth Station's run cost (`runInitiateTax.ts`, `types.ts` `additionalRunInitiateCredits`) cites 1.16.1b / 4.6.8f; it should be 6.3.2b with 1.16.10. Howler's log (`installKinds.ts`) CR 10.1 → 1.16.5c (area 5). 9.3.7d (`cardLifecycleHooks.ts`) and 9.3.7e (`graph.ts`) are false positives, recorded with their verdicts | citation topics, cr-checker | 1.21, 4.6.3, 6.3.2b, 1.16.5c |
| ~~8 Access~~ | ~~Stealing an agenda mid-breach (Bacterial Programming) stalls at `access.stealAgenda`: `finish_breach` is offered and refused.~~ Fixed by the playout blockers (engine #930): a 4-card R&D breach that steals it and declines its ability goes on to access all 4 | jnet, playouts | 7.4.7 |
| 8 Access | `refreshRdDeckCandidate` keys on card id, so cards the Corp rearranges in R&D (new objects) can't be accessed again | jnet | 1.12.3, 7.4.7a |
| 2 Uninstall and run position | The attacked remote ceases to exist mid-encounter, and passing the position crashes (`run.passIce`, `s.servers[attackedServerId]` undefined). The remote-deleted-mid-run cluster as a crash. Startup seed 66 | playout blockers sweep | 4.6.8e, 6.2.7 |
| 2 Uninstall and run position | A run object survives into `runner.takeAction`, so no basic action is legal. Standard seed 70 | playout blockers sweep | 6.9.6d, 5.2 |
| 2 Uninstall and run position | Rigged Results' run loops at `run.initiatePaw` (`closeEmptyRunPaw` never advances) until the walk's step budget runs out. Eternal seed 32 | playout blockers sweep | 6.9.1 |
| 2 Uninstall and run position | Always Have a Backup Plan's bypass: `backupPlanBypassIceId` is cleared after the first match (the card bypasses that ice on every encounter), and it sets `bypassFirstEncounter`, which can bypass the next ice instead when an upgrade blocks the bypass | cr-checker (engine #932) | 6.5.8a, 1.2.1 |
| 2 Uninstall and run position | Runs started through `pendingStartRun` never call `isRunTargetAllowed` (Off the Grid, Replicating Perfection) | cr-checker (engine #932) | 6.3.2a |
| 9 Damage | The Runner is flatlined as soon as core damage drops max hand size below 0, not at the discard step | jnet | 1.7.2b |
| 8 Access | Imp (`accessTrashWithVirus`), Neutralize All Threats (`mustTrashFirstAccessedCardWithTrashCostEachTurn`) and Mumbad Virtual Tour (`mustTrashWhenAccessedWhileInstalled`) are read in `advanceFromMidAccess`, whose choice options are all no-ops and are resolved by option id in `apply.ts` | kind liveness (c) | 7.4 |
| 10 Card flags | Jesminder Sareen prints "the first time each **run**", but the engine models it as `preventFirstTagThisTurn`, and `canPayTakeTagsNestedCost` checks `tagsGivenThisTurn`. A second run in a turn that already gave a tag would not prevent. Not confirmed by a test. If one confirms it, the triage rule makes it a fix-now (a supported card plays wrong) | cr-checker, citation review | 1.2.1 |
| All (step 5) | 58 engine-built kinds pass the verb rule but name a card (`swap_raman_rai_resolve`, `install_street_peddler_hosted_card`, `move_credits_to_sealed_vault`, …). They are now in `effect-ir-legacy-names.json`; each area renames its own when it merges kinds | IR names guard | — |
| 10 Card flags | Sportsmetal never triggers: `fireOnAgendaScoredOrStolen` never passes the Corp identity | jnet | 9.3.7c |
| 11 Turn structure | After a terminal operation the Corp can still score in the 5.6.2a window | jnet | 5.4.3a, 5.6.2 |
| 11 Turn structure | Psi bids during a run can't spend bad publicity credits | jnet | 10.6.2, 10.14.3 |
| 11 Turn structure | Operations whose play opens a choice, Subcontract's plays, and Corp identity click abilities are counted as actions. Found while fixing action counting (engine #915–#917) | hand check | 5.2.5b, 5.2.1a |
| 11 Turn structure | The generic break on Markus-style ice always breaks the first unbroken subroutine instead of letting the Runner choose | hand check | 6.5.4, 9.8.5 |
| 11 Turn structure | Consulting Visit's play from R&D does not charge the play cost | hand check | 8.6.2, 1.16 |
| 11 Turn structure | Labels drop the [click] cost, hiding that the ability is an action: Ronin, Reversed Accounts, Elizabeth Mills, Contract Killer, Fermenter, Red Team, Professional Contacts, Sneakdoor Beta, Conduit, Ayla "Bios" Rahim, Pennyshaver. The model is right; fix the labels in paired cut C | label triage | 5.2.1 |
| 11 Turn structure | Unity's label says +1 strength; the engine gives +X (X = installed icebreakers), as printed. Fix the label in paired cut C | label triage | 1.2.1 |
| 11 Turn structure | Labyrinthine Servers' jack-out prevention sits in `end_the_run_interrupt`, which scans only Runner cards, so the Corp likely can never use it. Not confirmed by a test | label triage | 9.3.6d, 6.1.5, 6.6.3 |
| 11 Turn structure | Corporate Troubleshooter pays only `trashSelf` and picks X during resolution: with 0 credits it trashes for nothing, and X=0 is never offered | label triage | 1.16 (costs paid together) |
| 11 Turn structure | Panic Button ("only during a run on HQ") and Mamba ("only during a run") open only in `encounter_paw`, not at approach or movement | label triage | 9.2.7b |
| 11 Turn structure | Traces auto-resolve with no Corp spend and no Runner link boost at about 10 `autoResolveTrace` callers (`scoreTraceOffer`, `boostRezTrace`, non-interactive `trace`). Security Nexus is fixed separately; check the rest here | label triage | 10.8.2–10.8.3 |
| 11 Turn structure | A trace that opens a prompt leaves a pending Tollbooth-style encounter effect unresumed | Security Nexus fix (engine #921) | 10.8, 6.9.3 |
| 11 Turn structure | Security Nexus is offered at encounter start, but Femme Fatale's encounter trigger can resolve in the wrong order around it | Security Nexus fix (engine #921) | 9.2.8d |
| 11 Turn structure | Security Nexus's card data still models the ability as unconditional; the encounter-only limit lives in the engine. Make it a conditional ability in the card data | Security Nexus fix (engine #921) | 9.6, 6.9.3a |
| 11 Turn structure | AU Co.: The Gold Standard in Clones offers "remove 2 power counters" with fewer than 2; it resolves as a no-op. A `choose` option's nested cost sits inside its kind (`remove_co_2_look_rd`), so legality can't see it. Gate the option on the cost (an `if` on the counters, or a cost or condition field on `ChoiceOption`). The paid path also skips the cost-paid checkpoint before the look | playout blockers, cr-checker; confirmed by sweep S1b (engine #945) | 1.16.1, 1.16.11a, 1.16.3 |
| 11 Turn structure | Nothing is legal at `corp.takeAction` with 3 clicks (Standard seed 118, the same before and after the playout blockers) | playout blockers sweep | 5.2, 5.6.2 |
| 11 Turn structure | Hired Help's additional cost to run forfeits the agenda; the card says trash it | cr-checker (engine #932) | 1.2.1, 8.2.5 |
| 11 Turn structure | Service Outage's first-run credit is charged only by the basic run action, not when a run event makes the turn's first run | cr-checker (engine #932) | 6.3.2b |
| 11 Turn structure | `payStealAdditionalCosts` stops at the first cost that opens a choice, and clicks and credits are spent before the effect costs, so a set of steal costs is not checked as a whole | cr-checker (engine #932) | 1.16.10b |
| 11 Turn structure | `autoWalk` runs an auto step's `onResolve` again each time the walk is parked on it, and `applyAction` now walks after every action (engine #930). `corp.turnBegins`, `runner.turnBegins` and `run.ends` are guarded; check the other auto steps that can open a choice for the same once-only guard | playout blockers, cr-checker | 9.6.6, 9.2.2 |
| 11 Turn structure | `candidateRun.ts` offers `break_bioroid_subroutine` (spend [click]: break) on any ice with the bioroid subtype, whether or not that ice prints the ability. Not yet checked against the printed text of every bioroid. Ansel 2.0 prints lose [click][click]: break up to 2, which is not offered (sweep S1c) | N-Pot fix (engine #922), sweep S1c (engine #944) | 1.2.1, 6.5 |
| 11 Turn structure | ChiLo City Grid and Spinal Modem have no test for a tied trace (engine #923 fixed ties in `traceSucceeds`) | trace tie fix (engine #923) | 10.8.4 |
| 11 Turn structure | `corp.turnBegins` has the shape `runner.turnBegins` had before engine #929: `autoWalk` re-runs the whole step after a turn-begin ability's choice, so a Corp "when your turn begins" ability with a choice may be noted again. Not confirmed by a test | Apex fix (engine #929) | 9.6.6 |
| 13 Search and shuffle | Touch-ups: the card model (`seq[place_advancements, choose_type_shuffle_grip]`) doesn't make the reveal depend on "If you do", and `choose_type_shuffle_grip` offers the Corp a Decline the text doesn't allow. Needs card JSON (paired cut) | Touch-ups fix (engine #929), cr-checker | 1.2.1, 1.15.2 |
| 10 Card flags | The pack generator scripts in `netrunner-cards-data/scripts/` (Uprising, Midnight Sun, Elevation, and others) still write the shapes cards #298 and #299 replaced; regenerating a pack would undo those fixes. `generate-midnight-sun.py` also still gives Drago Ivanov's ability a click cost; the checked-in data is right | N-Pot, False Lead and Vladisibirsk fixes | — |
| ~~1 Hosting and trash~~ | ~~`noteFirstCorpCardTrashEachTurn` called `noteRunnerStoleOrTrashedCorpCard` before its `trashedBy` check, so the Corp trashing its own card met the Runner's trigger (Cacophony, Epiphany Analytica); the installed-only trigger shared one first-time record with the any-card one (Aggressive Trendsetting, NBN: Controlling the Message)~~ Fixed in engine #948 | sweep S1b (engine #945) | 1.14.5a, 9.6.5c |
| 2 Uninstall and run position | Proprionegation: `move_runner_to_archives_outermost` (and `move_runner_to_outermost_attacked`) sets only the attacked server and position. It does not end an encounter in progress, does not go to the approach-ice step (or the movement phase with no ice), and has no Success or Run Ends guard | sweep S1b (engine #945) | 6.2.8b, 6.1.3d, 6.2.8c |
| 2 Uninstall and run position | Beta Build's return to the top of the stack is inline and leaves hosted counters (its install half is area 6) | sweep S1c (engine #944) | 1.13.13, 1.12.1 |
| 4 Visibility | An expendable card's "reveal and trash this from HQ" cost never reveals the card (Tocsin and every expendable) | sweep S1c (engine #944) | 1.21.3 |
| 5 Corp install | `install_hq_card_paying_costs` always makes a new remote and installs there, ice included: no existing server or central root, no like-card trash, no server restrictions (Humanoid Resources, Peer Review, Poétrï Luxury Brands, Scatter Field, Top-Down Solutions). Poétrï's scored half (`install_rd_looked_card_paying_costs`) also routes the R&D card through HQ faceup and pays the cost twice | sweep S1b (engine #945) | 8.5.2a, 8.5.2c |
| 5 Corp install | `install_hq_card_ignore_costs` and `install_archives_card_ignore_costs` place the card inline: no upgrade in a central root, no new remote for ice, no trash of an agenda or asset already in the root; the HQ variant installs faceup (Off the Books, Project Ingatan, Synapse Global) | sweep S1b (engine #945) | 8.5.2, 8.5.2a, 8.5.6a, 1.21.3 |
| 5 Corp install | Mercia B4LL4RD: `may_install_ice_from_hq_discount_then_move_source` lists no new remote, and `install_hq_ice_protecting_server_paying_costs` skips the ice-trash option and when-installed triggers | sweep S1b (engine #945) | 8.5.2a, 8.5.6b, 8.5.16f |
| 5 Corp install | `install_ice_from_hq_ignore_costs` lists only existing servers, never a new remote (Key Performance Indicators) | sweep S1b (engine #945) | 8.5.2a |
| 5 Corp install | IP Enforcement: `install_runner_score_agenda_on_server` places the agenda inline and faceup, offers no new remote (errors after the tags are removed when there is none), takes it out of the score area before checking the server, and skips the root trash | sweep S1b (engine #945) | 8.5.2, 8.5.2a, 8.5.6a, 1.16.2c |
| 5 Corp install | `install_archives_card_paying` writes the root and ice lists directly: no root limit, no optional trash, a bare install cost, no new-remote hooks, no new remote for ice (Retirement Plan, Crick) | sweep S1c (engine #944) | 8.5.6a, 4.6.6e, 8.5.6b, 1.16.4a, 8.5.2a |
| 5 Corp install | Reanimation Protocol (with area 7): `install_and_rez_archives_ice` installs and rezzes inline, with the printed rez cost only, no additional rez costs, no ice trash, and rezzes before the install triggers; the play fails when only the rez is unaffordable | sweep S1c (engine #944) | 8.1.2e, 1.16.4b, 1.16.4c, 8.5.15, 8.5.16c, 8.5.16e |
| 5 Corp install | Mycoweb: `may_install_from_archives_ignore_costs` offers no new remote for ice (its type filter waits for paired cut A) | sweep S1b (engine #945) | 8.5.2a |
| 6 Runner install | The effect install helpers (`may_install_from_grip`, `install_from_grip_discount`, `canInstallHeapCard`) drop a program that would exceed free MU instead of letting the Runner trash programs to make room, and drop trojans and install-on-ice cards (Illumination, Magdalene Keino-Chemutai, Scrounge, Topan). Topan also checks the credit pool, not credits available for installs | sweep S1b (engine #945) | 8.5.6c, 3.9.3b, 1.13.6c |
| 6 Runner install | Beta Build: `install_stack_program_ignore_costs_track` installs inline (no MU check, no install-on-ice limits, no recurring credits, no new object, no `installRunner` bookkeeping); the search has no decline and tracks the program by id | sweep S1c (engine #944) | 8.5.6c, 1.13.6c, 8.7.2b, 8.7.2e, 1.10.5b |
| 6 Runner install | Mutual Favor: `search_stack_icebreaker_resolve` installs inline (raw credits, no MU check, no install-cost modifiers) and installs without offering the choice | sweep S1a (engine #943) | 8.5.16, 8.5.6c, 9.6.9c |
| 8 Access | René "Loup" Arcemont: the gain and draw are inline in the pay-trash-cost access path only. Carnivore, virus and other access trashes never trigger it or mark the turn's first trash; it resolves at once and does not check blanking. Fix at the shared access-trash point | sweep S1a (engine #943) | 9.3.2b, 1.19.1, 9.6.2 |
| 8 Access | Detente: `host_random_hq` takes the last HQ card, `access_random_hq` bypasses `access_card`, and "add 2 hosted cards to HQ" is a cost inside the effect, so the ability is usable with fewer than 2 hosted cards and takes the first two without a choice | sweep S1b (engine #945) | 7.1, 1.16.1 |
| 10 Card flags | A conditional ability's `condition` is an `if` read at resolution, but a stipulation in the trigger condition must hold when the trigger occurs (Syailendra's "if it has 3 or more hosted advancement counters") | PF-S1 (engine #948) | 9.6.5c, 9.6.5d |
| 11 Turn structure | A pay option inside `choose` is not gated on being able to pay: with too few credits `lose_credits` takes what there is and the effect still resolves (Byte, PT Untaian; Vasilisa in S2) | sweep S1b (engine #945) | 1.16.11a, 1.16.1 |
| 11 Turn structure | LEO Construction: the bioroid trash is modelled as part of the effect with a 0-credit cost. Once per turn is recorded before the trash, no checkpoint follows the cost, and a prevented trash would still end the run | sweep S1b (engine #945) | 1.16.9, 1.16.3, 1.16.1b |
| 11 Turn structure | The basic break action (`breakSubroutine.ts`) never gives The Tungsten Tailor's first-break credit; only `break_encounter_subroutine` does | PF-S1 (engine #948) | 9.3.2b |
| 11 Turn structure | Aircheck: between its run and the follow-up run the credit pool is locked, but its hosted credits are spendable only as a run's `eventCredits`, so in that window the Runner can pay nothing | PF-S1 cr-checker (engine #948) | 8.6.5, 1.2.1 |
| ~~12 Counters and advancement~~ | ~~`place_advancements` used the first candidate when there was no pick, and always added a Decline with pick choose~~ Fixed in engine #948 | sweep S1b (engine #945) | 1.15.2, 1.15.2e |
| 12 Counters and advancement | Cacophony: `remove_power_counter` removes what is there, so sabotage resolves with fewer than 2 counters | sweep S1b (engine #945) | 1.16.11a, 1.16.1 |
| 13 Search and shuffle | `search_rd_operation_to_top_rd` takes the first operation in R&D, with no Corp choice and no option to find nothing, and leaves a stale faceup flag (Embedded Reporting, Lily Lockwell) | sweep S1b (engine #945) | 8.7.2, 8.7.2e, 1.15.2, 1.21.1a |
| 13 Search and shuffle | `search_rd_up_to_one_each_subtype_to_hq` takes the first barrier and sentry, with no Corp choice or option to find fewer, and adds them before the shuffle (Tocsin) | sweep S1c (engine #944) | 8.7.2, 8.7.2e, 8.7.3 |
| 1 Hosting and trash | About 78 `trashCard` calls on Runner cards pass no `by`, so Boi-tatá counts unrecorded Corp trashes and Storgotic Resonator counts unrecorded Runner trashes as the Corp's. `trash_own_program` and `trash_runner_rig_card` are shared by cards where different players trash (Ichi 2.0, SDS Drone Deployment: the Corp; Spec Work, Scavenge, Burke Bugs: the Runner), so they need a per-card field; Ichi 2.0 also lets the Runner choose. Each area's callers pass `by` as they move to its helper | PF-S2 (engine #950) | 1.14.5 |
| 5 Corp install | Pivot's Threat 3 play-or-install, Epiphany Analytica's install (routed as an HQ install, cost checked twice; Poétrï shares it) and Architect Deployment Test's install-and-rez offer only a new remote; Mitosis installs the first 2 HQ cards with no choice and no "up to". Their visibility leaks were fixed in PF-S2 | sweep S2a, S2b, S2c; PF-S2 (engine #950) | 8.5.2a |
| 9 Damage and prevention | Edge of World's core damage (`may_pay_credits_for_core_damage_per_ice_protecting_this_server`) sets the click-loss prevention it does not print; PF-S2 removed the same flag from Cerebral Overwriter | PF-S2 (engine #950) | 1.2.1 |
| 10 Card flags | Inline offers built by flag readers (Brasília Government Grid and similar) are skipped while another choice is open, instead of becoming pending conditional abilities | PF-S2 (engine #950) | 9.6.2 |
| ~~11 Turn structure~~ | ~~Breaking (for FX-breakers): Banner's interface ability checks no strength; Hammer's limit counts killer and unprinted breaks; Anvil's no-break flag lives on the card and can outlast the encounter; the declared-breaker break cost never applies Boi-tatá's discount~~ Fixed in engine #953 | sweep S2b, S2c; PF-S2 (engine #950) | 3.9.5g, 9.3.6c, 9.10.1 |
| 11 Turn structure | Midway Station Grid's and Interrupt 0's additional costs apply only to the basic break action, not to paid-ability breaks (nor Midway's to other icebreaker abilities); `breakActionCost` adds Interrupt 0's before the discounts and Midway's after | FX-breakers cr-checker (engine #953) | 1.16.2a, 1.16.10b |
| 11 Turn structure | Bioroid click breaks (`breakBioroidSubroutine`, `breakBioroidSubroutines`) skip Inazuma's no-break and NEXT Activation Command; they should call `subroutineBreakBlock` and `runnerBreakBlock` in `procedures/break.ts` | FX-breakers cr-checker (engine #953) | 1.2.2, 6.5 |
| 11 Turn structure | Semak-samun's "cannot break the printed subroutine … except using a fracter" applies to every subroutine on it, not only printed ones | FX-breakers cr-checker (engine #953) | 1.2.1 |
| 11 Turn structure | Cyber-Cypher's "use this program only during runs on the chosen server" gates its breaks but not its pump | FX-breakers cr-checker (engine #953) | 1.2.1 |
| 11 Turn structure | A break ability stays on offer after its breaker can break nothing more on the encounter (Curupira after breaking Wall of Static's only subroutine); using it pays its cost and breaks nothing | FX-breakers verification table (game #318) | 1.2.1 |
| 11 Turn structure | Endless Hunger breaks any subroutine whose text contains "end the run", including "End the run unless …"; it prints "[subroutine] End the run." | FX-breakers cr-checker (engine #953) | 1.2.1 |
| 11 Turn structure | Regenesis counts the agenda it adds to the score area in `agendaPointsScoredThisTurn`, though that is not scoring | PF-S2 (engine #950) | 1.17.3f |
| 4 Visibility | Hyoubu Institute: "you reveal" is keyed to the source card's side, not the player who reveals, so Runner cards that make the Corp reveal (Enhanced Vision, Reflection, Shred) are missed; `revealCards` needs the revealing player | PF-S2 cr-checker (engine #950) | 1.14.5a |
| 13 Search and shuffle | Asmund Pudlat: `search_stack_host_virus_or_weapon` takes the first matches; the Runner cannot choose, take fewer, or fail to find | sweep S2b; PF-S2 (engine #950) | 8.7.1, 8.7.2e |

Area 11 was added on 2026-11-14. It takes the two jnet findings that had no area (terminal operation, psi bids) and three found by hand while fixing action counting.

**Triage rule (2026-11-14).** Moved on 2026-11-19 to [how we work, Findings](../how-we-work.md#findings), which applies it to every plan. Rules findings that are not fixed right away are filed in this table. A fix-now engine session still runs alone, since there is one engine writer at a time.

**Open items**

- ~~Tool 1.2(c), card flags whose reader builds a no-op kind, is an `it.todo`.~~ Done in Phase 2 (engine #928).
- 51 of the 159 deferred jnet scenarios are unclassified (list in the engine's `docs/jnet-test-ports.md`). No `disagreement` case has turned up yet.
- ~~The visibility fuzz rarely reaches facedown Runner installs, facedown set-aside cards, or grip reveals.~~ Done in game #297: eight hand-built scenarios (`src/visibility-scenarios.test.ts`). Their fix-now findings go to one engine session under the triage rule: Read-Write Share's and Bookmark's [trash] send the facedown hosted cards to the heap faceup instead of shuffling them into the stack (a leak to the Corp and spectator, CR 4.1.5, 10.2.2a), `basic_remove_tag` is never offered to the Runner (`actorFor` returns `system`, CR 5.2.7g), Touch-ups lets the Runner pick and stops after one card, Invasion of Privacy's trash options are unusable and leave the grip faceup, and Apex's turn-begin trigger fires again after every resolution. All five fixed in engine #929 (release `v1.147.258`, 2026-11-15) and game #298, which also stops hiding a revealed card's id from the Corp. Their follow-ups are in the findings table (Touch-ups, `corp.turnBegins`, the oracle's reveal record).
- Cards #294 (Hedge Fund and PAD Campaign store `influence: 0`) shipped in cards `v1.147.23` on 2026-11-14, ahead of paired cut A, with the verification table follow-ups (engine `v1.147.255`).
- Mutation scores exist only for area 3. Each area measures its own in Phase 3.

## Phase 2: guardrails (S–M, test-only) — done 2026-11-14

1. **Write guard** `tests/procedure-write-guard.test.ts`. A TypeScript-AST scan (the `typescript` package is already a dependency) over `src/**` for assignments and mutating calls on `.zone`, `.hostId`, `.hostedCardIds`, `server.ice`, `server.root`, `runner.installed`, `*.hand`, `*.deck`, `discardPile`, score areas, `removedFromGame`, `.rezzed`, `run.position`, and `run.attackedServerId`. It covers `=`, `+=`, `-=`, casts, `push`/`splice`/`unshift`/`shift`/`pop`, and `filter` reassignments. An allowlist names the helper modules. Baseline is `tests/baselines/direct-writes.json`, keyed by file + property + count (not line numbers) so it doesn't churn. It replaces the regex in `ice-uninstalled-during-run.test.ts`.
   - Starting baseline is roughly the table above: ~550 `zone`, ~200 host, ~100 ice/root, ~140 installed, ~120 discard, 4 position, 13 attacked-server.
2. **Kind liveness and effect guard**, replacing the mention rule in `one-off-kind-coverage.test.ts`. Every kind in `KNOWN_PRIMITIVE_KINDS` must (a) be reachable from card JSON, a card flag consumer, or a named engine builder, and (b) appear in a test that **asserts a state change** through a shared outcome helper (`expectStateDelta(before, after, {...})`). Each test registers its kind as `coversKind("x")`, so a name mention no longer counts. The baseline starts at the current non-compliant set and only shrinks.
3. **Engine-built kind names.** Extend `effect-ir-names.test.ts` to engine-built kinds as well, using the existing 215-entry legacy list as their baseline.
4. **Counts may only shrink.** `tests/baselines/format-counts.json` holds three numbers: kinds in `KNOWN_PRIMITIVE_KINDS` (1,540 at the inventory), kinds used by exactly one card (735), and `CardDef` flags (616). A change that raises one fails unless the baseline is edited with a dated reason. No target number is set now. Each Phase 3 area records the counts it leaves behind.
5. **Citation topics.** Tool 1.5b starts as a report. Once cr-checker has reviewed its baseline, a new topic mismatch fails the test instead of being recorded.

## Phase 2 results (2026-11-14)

All five guards are on engine master (#928, test-only, no release). Each baseline may only shrink: a lower count fails until it is recorded, the regenerate command refuses to raise one, and a raise needs a hand edit with a dated reason.

| Guard | Test | Baseline | Starting size |
|---|---|---|---|
| 1 Write guard | `procedure-write-guard.test.ts` (scanner `tests/direct-writes.ts`) | `tests/baselines/direct-writes.json` | 1,952 writes in 97 files |
| 2 Kind effect coverage | `kind-effect-coverage.test.ts` (helpers `tests/kind-coverage.ts`) | `tests/baselines/kind-effect-coverage.json` | 1,533 of 1,537 kinds without a `coversKind` + `expectStateDelta` test |
| 2 Tool 1.2(c) | `kind-liveness.test.ts` (c) | `noOpFlags` in `tests/baselines/kind-liveness.json` | 4 |
| 3 Engine-built kind names | `effect-ir-names.test.ts` | `tests/effect-ir-legacy-names.json` | 272 (214 verb-rule names + 58 engine-built kinds that name a card) |
| 4 Format counts | `format-counts.test.ts` | `tests/baselines/format-counts.json` | 1,537 kinds; 746 one-card kinds; 602 `CardDef` flags |
| 5 Citation topics | `cr-citation-topics.test.ts` | `tests/baselines/cr-citation-topics.json`, with cr-checker's verdict per entry | 8 (4 wrong, 2 partly wrong, 2 false positives) |

Write guard counts by property, all of `src/**` (the 3 `runPosition.ts` writes are allowlisted, the rest are the baseline):

| Property | Writes | Files |
|---|---|---|
| `zone` | 549 | 87 |
| `hostId` / `hostedCardIds` | 102 / 88 | 40 / 27 |
| `server.ice` / `server.root` | 50 / 54 | 21 / 25 |
| `installed` | 80 | 37 |
| `hand` / `deck` / `discardPile` / `scoreArea` | 251 / 268 / 194 / 30 | 70 / 71 / 69 / 12 |
| `removedFromGame` | 59 | 19 |
| `rezzed` | 205 | 66 |
| `run.position` | 7 (4 outside `runPosition.ts`) | 4 |
| `run.attackedServerId` | 18 | 11 |

How the guards differ from the plan text:

- **Write guard.** It uses the type checker, so a field counts only on the state type that owns it (`CardInstance`, `Server`, `PlayerState`, `GameState`, `RunState`); public-view objects don't count. It doesn't see writes through an alias (`const ice = server.ice; ice.push(x)`). The allowlist is `src/state/procedures/` (the Phase 3 helpers, empty today) and `runPosition.ts` for `position` and `attackedServerId`. Today's partial helpers (`installCorp`, `trashHooks`, …) are in the baseline, because they are under audit too. Each area adds its procedure module to the allowlist.
- **Kind coverage.** Reachability, half (a), stays in `kind-liveness.test.ts` (a) and (c). The new test enforces half (b) for every kind, not only one-card kinds. Four `one-off-kind-outcomes` tests use the helpers now (Fester, High-Risk Investment, Chronos Project, Profiteering). `one-off-kind-coverage.test.ts` and its empty `one-off-kind-untested.json` are gone.
- **Engine-built kind names.** The `Primitive` union and `KNOWN_PRIMITIVE_KINDS` are the same 1,537 kinds, and every kind `src/` builds is registered, so the verb rule already covered engine-built kinds. What was missing was the card-title half of the naming rule. Engine-built kinds (no card JSON names them) may not contain a multi-word card title. A new test also fails on a built kind that isn't registered.
- **Format counts.** `cardDefFlags` is tool 1.10's count of boolean and number fields (602), read from `card-flags.json`.

## Playout blockers (after Phase 2, before area 1) — done 2026-11-15

*Added 2026-11-13 from the first playout sweep (tool 1.3, engine #903): 30 seeds per format, no crashes, failures in every format.*

Two failure clusters are not procedure copies, so no early area owns them. They are also the ones that hit the Learn to play starter list most, and the [Phase 6 gate](#phase-6-gate) needs that list to run clean. Fix them first, in one engine session.

| # | Cluster | Seen in | What happens | CR to read first |
|---|---|---|---|---|
| B1 | **Breach actions offered, then refused** | 38 seeds, every format; 9 of 30 on the Learn to play starter list | `queryLegality` offers `finish_breach` or `access_card` at `access.stealAgenda`, and `applyAction` refuses with "No breach access window" | ch. 7 (accessing and breaching), 9.2 (timing and priority) |
| B2 | **A turn with no legal action** | 42 seeds, at `corp.turnBegins` and `runner.turnBegins` | Legality offers an ability whose cost cannot be paid (AU Co. with fewer than 2 power counters is one case). Taking it leaves the turn with nothing legal | 1.16 (costs), 9.5 (paid abilities), 9.2, ch. 5 (turns) |

How to run it:

- Reproduce each from its entry in `tests/fixtures/playout-seeds.json`. Find the rule before changing code, and run cr-checker on the diff.
- The fix is where legality and apply disagree. Make one of them the source for the other; do not patch the single card.
- Each fix gets a test that cites the CR rule and asserts state, and its entries leave the seeds fixture.
- One engine maintenance release, with the game pin and the meta pin table in the same pass.

Exit: no `REFUSED` at a breach step and no `NO_LEGAL_ACTION` at a turn start in the CI seeds or the nightly sweep, on any format.

### Playout blockers results (2026-11-15)

Done in engine #930 (`v1.147.259`) and #932 (`v1.147.260`), with the game pin (#299, #300) and this pin table. The 200-seed nightly sweep, 200 steps each:

| Engine | Formats | Breach-step `REFUSED` | Turn-start `NO_LEGAL_ACTION` | `CRASH` |
|---|---|---|---|---|
| `v1.147.258` (before) | 7, with System Gateway | 205 | 238 | 0 |
| `v1.147.260` (after) | 6, without System Gateway | 0 | 0 | 1 (area 2, below) |

Root causes. Neither cluster was a single card:

- **B1.** After a steal, a "when stolen" choice (Send a Message) was answered and the run stayed on `access.stealAgenda` with no card being accessed. Legality gated `access_card`/`finish_breach` on `step.kind === "access"`, which also matches the nested access steps; apply gated on `breach.awaitAccess`. Now an access whose card has left it completes (CR 7.1.7, 7.2.4), and both use `actionAllowedHere` (11.5_4_a). The sweep on `v1.147.259` then found legality offering a steal whose additional cost could not be paid (SDS Drone Deployment with no program). Legality now tries the steal on a copy and offers it only when apply takes it (CR 1.16.1, 1.16.10b, 7.1.6a).
- **B2.** Not AU Co.'s cost: any "when your turn begins" choice (AU Co., Clearinghouse, MuslihaT) left the turn parked on the auto step `corp.turnBegins`/`runner.turnBegins`. The game host hid this with `autoWalk`, and the Corp step then re-ran its `onResolve` and noted the same abilities again, so in the game the prompt came back each time. `applyAction` now walks to the next step where a player acts (CR 9.2.2), and the Corp's turn begins once per turn (CR 9.6.6).
- **Exposed by the walk.** `run.ends` crashed when Always Have a Backup Plan's run-end choice was answered after the run was over. It returns once the run is over (CR 6.9.6d, 10.3.6). Backup Plan's rerun had never started a run; it now goes through `startRun`, ignoring additional costs to run (CR 1.16.5a, 6.3.2b).

System Gateway left the playouts (engine #931, test-only): it is a product, not a sanctioned format, and the Phase 6 gate names only the Learn to play lists and Startup.

New findings from these sweeps and cr-checker are in the findings table above under areas 2 and 11.

The sweep's other clusters stay with their areas, and are evidence for the order below: a trashed card pushed to Archives twice (about 20 seeds) and broken hosting links on Botulus, Tranquilizer, Stowaway, Slap Vandal, and Ekomind go to area 1; an attacked remote deleted mid-run (20 seeds) and a position out of range on an unprotected HQ go to area 2; install legality mismatches (Egret, Research Station, The Red Room, Flagship, region-only upgrades, Earth Station's remote limit) go to area 5.

## Printed-text sweep (beside Phase 3, before the Phase 6 gate)

*Added 2026-11-19.* Nothing checks every card's Effect IR against its printed text. The label check (1.4) compares wording, and its triage still found 9 wrong models in 395 labels. The 1,078 abilities with no label have never been looked at. Each area reads the printed text of its own cards, but only for the procedure it audits. The sweep reads every card in the corpus once, so no format reaches real opponents with a card known to play wrong (CR 1.2.1: the card text wins).

### Batches

The formats nest, so each batch holds only the cards the earlier batches did not cover. Counts are from cards `v1.147.24`.

| Batch | Cards | Printed words | Covers |
|---|---|---|---|
| S1 Startup | 225 | ~6,400 | Startup, and all 28 Learn to play cards |
| S2 Standard | 388 more | ~13,400 | Standard, and all of Core Sets (Core Sets adds no card beyond Startup and Standard) |
| S3 Eternal | 1,403 more | ~36,100 | Eternal, including Random Access Memories. This is the whole catalog of 2,016 cards |

Each batch is split into sessions by cycle, about 60–100 cards each, roughly 25 sessions in all. They run in order S1, S2, S3, beside the areas. A sweep session only reads and reports, so it doesn't collide with an area's engine work.

### Per-session recipe

1. For each card in the cycle, read `printed/<id>.json` and the card's Effect IR, including any kind a card flag builds (1.10 map), with the `lookup` skill.
2. Decide for each ability: matches, wrong, or unsure. Run cr-checker on every wrong or unsure ability, with the card title.
3. Leave labels alone. Labels are added in each area's paired cards release.
4. The PR adds the session's cards to `tests/baselines/printed-sweep.json` in the engine with their results, and lists every card and its result in its body: matches, wrong (and where it went), or filed. That list is the proof for the maintainer.
5. Remove each checked card's entries from the 1.12 baseline once its result is "matches", so 1.12 guards it from then on.

### Found by 1.12 and area 1

For the sweep sessions to confirm against the printed text, then fix with their batch (a card's own mistake) or file under an area (a shared procedure).

- Cerebral Cast and The Future Perfect: the psi outcome is reversed (1.12).
- Tri-Maf Contact: gives a tag instead of 3 meat damage (1.12).
- Hermes: draws instead of adding an unrezzed card to HQ (1.12).
- Flower Sermon and GlobalSec Security Clearance: reveal instead of look, so the Runner is shown information (1.12).
- Lionsmane and Flip Switch: end the run instead of jacking out (1.12). Lionsmane confirmed by S1c; it waits for paired cut A.
- Alexa Belsky: trashes the HQ cards it should keep (area 1, cr-checker).
- Marilyn Campaign: always shuffles itself into R&D; the text says "you may" (area 1, cr-checker).
- Simulchip: "an installed program has already been trashed this turn" is met by any installed Runner card's trash, by either player (area 1, hand check).

### Fixes

- **A card's own mistake** (a wrong amount, a missing condition, the wrong kind for that card) is fixed in one engine session per batch, after the batch's sweep sessions. That session follows the normal engine rules: CR first, cr-checker on the diff, a test that cites the rule, one maintenance release, pins.
- **A bug in a shared procedure** (install, swap, rez, and so on) goes in that area's row of the findings table above, with the card titles. The area fixes it once when it replaces the copy. It is not fixed card by card first.
- A fix that needs card JSON rides with the next paired cut, or its own paired cards release if no cut is near.
- The gate below needs every wrong card fixed. If one area holds most of the shared-procedure findings, run that area earlier.

### S1 results (2026-11-19)

Sweep sessions S1a–S1c (engine #943, #945, #944) read all 225 Startup cards. Fix session PF-S1 (engine #948, release `v1.147.265`, game #314) then worked the wrong cards. The record is the engine's `tests/baselines/printed-sweep.json`; a fixed card names its PR and the test that proves it.

| Cycle | Cards | Match | Wrong | Filed | After PF-S1: fixed / filed / wrong |
|---|---|---|---|---|---|
| System Gateway (S1a, #943) | 77 | 66 | 9 | 2 | 3 / 0 / 6 |
| Elevation (S1b, #945) | 82 | 47 | 14 | 21 | 4 / 4 / 6 |
| Vantage Point (S1c, #944) | 66 | 51 | 12 | 3 | 7 / 2 / 3 |
| **Startup** | **225** | **164** | **35** | **26** | **14 / 6 / 15** |

- **Fixed (14):** Aircheck, Cookbook, ezaM, Flagship, Lampades, Madani, Mahkota Langit Grid, Malapert Data Vault, Plutus, Ryō "Phoenix" Ōno, Scapegoat, Sipa, Stowaway, Weyland Consortium: Built to Last.
- **Fixed once in a shared kind:** `place_advancements` (the Corp chooses the target; no Decline), `may_derez_installed` (the ability's controller chooses), `fortify_all_ice` (lasts the run), and the area 1 trash hooks (only a Runner trash meets "the Runner trashes"; the installed variant has its own first-time record). These also fix part of S2 cards (see engine #948, Found, not fixed).
- **Moved to filed (6):** Key Performance Indicators (area 5), IP Enforcement (area 5), Embedded Reporting (area 13), Tocsin (areas 13 and 4), Ansel 2.0 (area 11), Syailendra (area 10). They are in the findings table.
- **Left for paired cut A (15):** each needs card JSON. Cut A adds these with the engine pieces they need:
  - Aggressive Trendsetting and NBN: Controlling the Message: move to the trigger `first_installed_corp_card_trash_each_turn` (engine #948 added it); Aggressive Trendsetting also needs a `runner_turn` condition.
  - Anthill Excavation Contract: `trashWhenHostedCreditsEmpty`.
  - Conduit: the counter trigger on the run ending, and X read at the R&D breach (engine), together.
  - Diviner: a condition on the printed cost of the card the net damage trashed.
  - Event Horizon: every run window for its [trash] ability.
  - Fransofia Ward: a conditional ability on encounter, not a paid ability.
  - Lionsmane: `offer_jack_out` instead of `end_the_run`.
  - Maglectric Rapid: derez without a Decline once the cost is paid.
  - Mycoweb: an ice-only install field, and a non-may resolve-subroutine kind.
  - Ping: a rez-during-a-run-on-this-server condition.
  - Seamless Launch and Sericulture Expansion: `place_advancements` fields for "not installed this turn" (strict) and any installed card. Akhet, Stoke the Embers, Cohort Guidance Program and Clairvoyant Monitor also print "an installed card".
  - Smartware Distributor: a turn-begins conditional ability.
  - The Tungsten Tailor: drop the `muBonus` it does not print.
  - Urtica Cipher: `onAccessRequiresInstalled`.
  - From S2 (PF-S2, engine #950): Afterimage, Backstitching, Curupira, Devil Charm, Laser Pointer, Malandragem and Physarum Entangler: the bypass as an optional conditional ability met when the encounter begins (Devil Charm also a run-duration weaken). Afshar: a "this ice protects HQ" condition. Amanuensis: a hosted-counter condition on the draw. Boto: the third subroutine repeats the second. Chekist Scion: `onAccessRequiresInstalled`. Daily Quest: an action-phase-only rez flag and its reader. Fencer Fueno: its own "spendable once successful" field. Flip Switch: `jack_out`. Flower Sermon: its paid ability rewritten. Hermes: the Runner adds an installed unrezzed card to HQ. Lobisomem: a code-gate condition on the fully-break trigger. Loot Box: `trash_self` (its engine half is fixed). M.I.C.: every run window, on its server. Mavirus: a paid [trash], the R&D reveal, purge before damage. Midnight-3 Arcology: a mandatory skip. Mindscaping: one mode. Muse: drop `daemonHost`. Nyusha: `first_successful_mark_run`. Pichação: a click-gained-during-a-run-this-turn condition and its op. Stegodon MK IV: a run-begins trigger, once per turn used on the derez. Time Bomb: the counter on the "otherwise" branch only. Unsmiling Tsarevna: printed subroutine order with the draw. Valentina Ferreira Carvalho: a "during your turn" condition and its op.
  - From FX-breakers (engine #953): the `interface` flag comes off the 69 pump abilities and Corsair's −3 strength, which do not print it, and goes on Banner's, Flashbang's and Wyrm's interface abilities (the engine then drops its `wyrm-weaken` ability id). Alias, Breach and Passport: a "cannot interface with ice protecting a remote server" field, read in `interfaceBlock`; supported Eternal cards that break remote ice today. Sharpshooter: drop the `once_per_turn` flag it does not print.
  - Also for cut A: rename `host_all_programs_from_grip` (Madani picks any number now), add Flagship's `persistent` flag, and IP Enforcement's play cost once confirmed against the printed card (the NSG catalog stores it as null, as it does X; jnet charges X).

### S2 results (2026-11-19)

| Cycle | Cards | Match | Wrong | Filed |
|---|---|---|---|---|
| Ashes (S2a, #947) | 130 | 93 | 19 | 18 |
| Borealis (S2b, #946) | 128 | 95 | 27 | 6 |
| Liberation (S2c, #949) | 130 | 83 | 30 | 17 |
| **Standard** | **388** | **271** | **76** | **41** |

- **Fix-now (visibility).** Six wrong cards show a seat information it should not see (CR 10.2.2a, 10.2.2b): Vera Ivanovna Shuyskaya shows the Corp the grip before any reveal; Complete Image shows the Corp the titles in the Runner's grip and stack; Whistleblower shows the Runner every card title in HQ and R&D; Architect Deployment Test installs an agenda faceup (8.5.2); Pivot leaves the card it found faceup in HQ, and Epiphany Analytica does the same when its install is refused (1.21.3, 1.21.6). The sweep PRs recorded them as wrong and left the call to the coordinator. Decided 2026-11-19: PF-S2 starts right after S2c and fixes these six first.
- PF-S1's shared fix to `place_advancements` (the Corp chooses) may already cover part of the S2 `place_advancements` cards (Big Deal, Pravdivost Consulting, Shipment from Vladisibirsk, Vasilisa, Vladisibirsk City Grid). PF-S2 re-checks each before changing them.
- ~~**Fix-now (breaking).**~~ Done in FX-breakers (engine #953, release `v1.147.267`). Paid-ability breaks (`break_encounter_subroutine`, `break_host_subroutine`) check no strength, so a strength-1 Curupira breaks a strength-3 Wall of Static (CR 3.9.5g, 9.3.6c). About 38 breakers break only this way. Decided 2026-11-19: a session of its own right after PF-S2, before area 2. cr-checker's caution: 69 programs carry an `interface` flag on their pump that the printed cards do not, so a gate keyed on that flag would stop them pumping.
- Arissana Rocha Nahu cannot install trojans or install-on-ice programs. Decided 2026-11-19: it stays with area 6, with the rest of that cluster.
- The record is `tests/baselines/printed-sweep.json`; each PR's "Found, not fixed" section lists the filed cards by area, and the findings table below has a row per area.

**PF-S2 (engine #950, release `v1.147.266`, game #315).** The fix session worked all 76 wrong cards. The record is `printed-sweep.json`; each fixed card names its test in `tests/sweep-fixes-s2.test.ts`.

| Cycle | Wrong | After PF-S2: fixed / filed / wrong |
|---|---|---|
| Ashes (S2a) | 19 | 3 / 8 / 8 |
| Borealis (S2b) | 27 | 12 / 8 / 7 |
| Liberation (S2c) | 30 | 6 / 10 / 14 |
| **Standard** | **76** | **21 / 26 / 29** |

- **Visibility leaks (6), all closed without card JSON.** Vera Ivanovna Shuyskaya asks before revealing the grip; Complete Image and Whistleblower name from the card catalog (`src/effects/cardNames.ts`), not from the game's cards; Architect Deployment Test installs an agenda facedown and reveals it; Pivot and Epiphany Analytica no longer leave a card faceup in HQ. Vera, Complete Image and Whistleblower are fixed; the other three moved to area 5 for their install.
- **Fixed (21):** Brasília Government Grid, Cerebral Overwriter, Complete Image, Hearts and Minds, Hostile Architecture, Info Bounty, Juli Moreira Lee, Mercury, Nuvem SA, Ob Superheavy Logistics, Pinhole Threading, Pretty Mary da Silva, Regenesis, Stavka, The Twinning, Tsakhia "Bankhar" Gantulga, Vera Ivanovna Shuyskaya, Whistleblower, Yakov Erikovich Avdakov; Pravdivost Consulting and Vladisibirsk City Grid were already fixed by PF-S1's `place_advancements` change and are confirmed by test.
- **Moved to filed (26):** area 1: Storgotic Resonator (Runner trashes that record no player); area 4: Hyoubu Institute (Runner cards that make the Corp reveal; Corp-ability reveals are fixed); area 5: Architect Deployment Test, Pivot, Epiphany Analytica, Mitosis; area 6: Simulchip; area 10: Daniela Jorge Inácio, Tucana; area 11: Banner, Hammer, Anvil, Boi-tatá (the break path, for FX-breakers), Vasilisa (cost payability); area 12: Big Deal, Akhet, La Costa Grid, Remastered Edition, Cohort Guidance Program, Stoke the Embers, The Holo Man (the placing filter), Shipment from Vladisibirsk (split mode); area 13: Digital Rights Management, Gaslight, Wave, Asmund Pudlat. They are in the findings table.
- **Left for paired cut A (29):** each needs card JSON, listed with what it needs under [S1 results](#s1-results-2026-11-19).
- **Fix-now finding:** Salem's Hospitality names from every card in the game, so the Corp sees the Runner's grip and stack titles; Quest Completed's access kind needs a run and blocks stealing. Both are supported Eternal cards; a session was proposed for them.

## Re-audit of the earlier programs, and interaction check

*Added 2026-11-19.* The audit assumed the timing and continuous-effect rules were right, because two earlier programs had standardized them. Both were built by Cursor's agent between 2026-10-29 and 2026-11-01 (engine `v1.147.216`–`v1.147.221` and #872–#877), before the CR-first loop in `docs/how-we-work.md`, cr-checker on every engine diff, or the Phase 1 tools existed. Nathaniel decided to re-check them. Area 4 already re-checks S5, the seat visibility module.

| Session | CR sections | What it checks | Repo | Release |
|---|---|---|---|---|
| RA-1 timing | 9.1–9.3, 9.6, 9.9, 9.11, 10.3 | Ability records, trigger conditions, conditional abilities marked at 10.3.1a, interrupts and 9.9.9 replacement, the instruction and checkpoint order of 9.11 and 10.3 | engine, tests and baseline only | None |
| RA-2 continuous effects | 9.4, 9.10, 9.12 | Static abilities, lingering effects and their expiry at 10.3.1b, continuous characteristics and blanking, and the S4 choice path | engine, tests and baseline only | None |
| RF re-audit fixes | the sections RA-1 and RA-2 found wrong | Fix what the CR settles; file a copied procedure under its area | engine (+ game, meta pins) | Engine maintenance |
| P1-l interactions | the sections each scenario touches | Classify the 51 jinteki scenarios tool 1.8 left unclassified (20 run, 15 rules, 12 multi-card, 4 other): port the ones the CR settles as engine tests, file each engine bug under its area, and add a `disagreement` entry for each the CR leaves open | engine, tests and baseline only | None |

Each RA session runs steps 1–3 and 6 of the [per-area recipe](#the-per-area-recipe-applies-to-every-area): inventory the sections' code paths, collect their entries from the Phase 1 baselines (invariants, citations, CR examples, jnet, Stryker on the timing and continuous-effect helpers), run cr-checker on each path with the cards that use it, and write a test that cites the rule for each path the CR settles. A wrong path is a finding, not a fix, the way the sweep works. RF then fixes them. It cites the rule, runs cr-checker on the diff, and cuts one maintenance release.

P1-l's run-timing and forced-encounter scenarios are evidence for area 14 and RA-1; the replace-access ones for area 8. Its disagreement entries come to Nathaniel.

## Phase 3: audit and standardize by procedure

### Order and why

Risk = how often the procedure runs × how bad a wrong result is × how many paths bypass the helper. Dependencies also matter: trash and hosting sit under swap, uninstall and install.

- **Area 1: Hosting and trash** (done 2026-11-19, [results](#area-1-results-2026-11-19)). Two confirmed bugs (OCA, the stale `hostedCardIds`). No hosting helper, two representations, 21 trash copies plus ~90 inline sites. Every later area calls these.
- **Area 2: Uninstall, ice removal and run position (8.5.10, ch. 6, 8.3 rearrange).** No uninstall helper; `onUninstall` never fires outside trash; position drift touches every run; Mandatory Seed orphan ice. Needs area 1's hosted release.
- **Area 3: Swap (8.8).** Finish what #893/#894 started: 13 kinds outside the helpers, plus Tāo. Needs the uninstall helper from area 2.
- **Area 4: Visibility (1.21, 10.2).** Moved up because Phase 6, the Discord Activity, puts hidden information in front of real opponents. Wrong citations and raw state clones.
- **Area 5: Corp install (8.5).** 42 bypasses; every ice bypass can desync the position (made safe by area 2).
- **Area 6: Runner install (8.5).** 30 bypasses plus 8 semi-shared helpers; MU limit and hook gaps.
- **Area 7: Rez and derez (8.2 rez / derez rules).** 21 rez sites without hooks; no derez helper.
- **Area 8: Access (ch. 7).** 3 bypasses. Small, but Detente is visibly wrong.
- **Area 9: Damage and prevention.** No damage bypass found, but 23 `prevent_*` kinds route prevention card by card. Run the full recipe on prevention; confirm damage itself with tools and mutation testing.
- **Area 12: Counters and advancement.** Runs after 9. 36 `place_*` kinds, many card-specific (`place_adv_on_ice`, `may_place_up_to_advancements_on_remote_root_then_access_unless_pay`), and `counterPrimitives`. Advancement feeds scoring in area 11, which runs after it.
- **Area 13: Search, shuffle and deck order.** Runs after 12. 53 `search_*` and 46 `shuffle_*` kinds, mostly one-offs; Code Siphon shuffles with inline `random()`. Deck order is hidden information. Access (area 8) runs before it; its three bypasses don't depend on the deck helpers, and area 13 re-checks access to rearranged R&D.
- **Area 11: Turn structure, actions, breaking and psi (ch. 5, 6.5, 9.8, 8.6, 1.16, 10.14).** Runs after 13 and before 10. Also owns scoring, stealing and forfeiting agendas (13 `score_*`, 7 `forfeit_*` kinds). Action counting has no shared path: engine #915–#917 fixed three ways an ability was counted as an action or not, and three more are known. Breaking subroutines and play costs have no owner either.
- **Area 10: Card flags and declarations.** Last, because areas 1–9 and 11–16 each move the flags that hide their own procedure. What is left is the flags that describe a card, and this area sorts them.
- **Area 14: Run flow (6.1, 6.3, 6.4, 6.6–6.9).** *Added 2026-11-19 from tool 1.13's first pass.* Runs after area 4 and before area 5. It needs area 2's position helpers, and every run passes through it. 23 modules in `src/state` hold run hooks, one per timing point.
- **Area 15: Keywords and credits (10.5–10.7, 10.9–10.13, 1.10).** *Added 2026-11-19.* Runs after area 9 and before area 12, because tags and bad publicity meet damage and prevention.
- **Area 16: Game setup and end (1.4–1.7).** *Added 2026-11-19.* Runs beside areas 8 and 9. It writes the game's deck rules and the engine's setup and win checks, not a procedure another area replaces. The winner is written in 15 places across six files.

Add an area when Phase 1 shows another procedure copied often. Areas 11–13 were added on 2026-11-14 from the kind counts in `docs/effect-ir-kinds.md` and the findings above. Kind counts measure duplication, not bugs: an area whose evidence step comes back clean closes like area 9.

### The per-area recipe (applies to every area)

1. **Inventory.** Start from the table above. Re-run the explorer query at the current master and list every path (file, kind, cards using it via `use.json`-style walk plus flag consumers).
2. **Evidence.** Collect this area's entries from each Phase 1 baseline: invariant failures, playout seeds, citations, missing CR examples, missing labels, jnet disagreements. Run Stryker on the area's helpers and record surviving mutants.
3. **CR check.** Run cr-checker on the area's helper and on each bypass family, with the card titles. Read each affected card's `printed/<id>.json` at `v1.147.22`. A printed override (CR 1.2.1) is kept as a field on the shared helper, not as a copy.
4. **Standardize.** One exported helper per procedure, in `src/state/procedures/<procedure>.ts`. Each bypass becomes a call to it. Card-specific behaviour becomes options (cost mode, destination, face, rez-after, chooser). The guard allowlist gains only that module.
5. **Effect IR.** Merge card-specific kinds that differ only in fields into a general kind (verb then object; amounts, zones, sides, filters as camelCase fields), following CLAUDE.md. Old kinds stay as engine-side aliases until the paired cards release rewrites the JSON, then they're deleted. Add missing labels to the area's conditional and play abilities in the same cards release. A card flag whose reader builds one of this area's kinds moves in this area too: it becomes a field on the general kind or a declared ability, and leaves the flag baseline (1.10).
6. **Tests.** For each fixed path, a hand check on the game's verification table: start from a position (V3), play the path from the debug page, and read the what-changed and invariant panels. A bug found by hand is exported (V5) as an engine fixture. Then: a test that fails on the old code, cites the CR rule, and asserts state through `expectStateDelta`; the area's CR examples from 1.6; the invariant baseline entries for the area removed; the mutation score recorded, aiming at no surviving mutants in the helper's CR-cited branches.
7. **Delivery.** Findings and open items go in the PR body and this plan's findings table, not in a notes file: that is where the next area's evidence step reads. One engine PR and one engine maintenance release per area (routing only, no card JSON change). Bump the game pin and the meta pin table in the same pass. Card JSON changes (kind merges, labels) are batched into **three paired cards+engine releases**: cut A after areas 1–4; cut B after area 9, covering 14, 5–9 and 16; cut C after area 10, covering 15, 12, 13, 11 and 10. Three cuts keep each card JSON rewrite small enough to review. Each is an explicit manual paired cut under `docs/git-hygiene.md`, so pins don't churn. Run cr-checker on the diff before each engine commit.

### Areas

| # | Area | Scope | Cards affected (examples; full list from the area inventory) | CR rules | Standardization target | Release |
|---|---|---|---|---|---|---|
| 1 | Hosting and trash | `releaseHostedCardsOnTrash`, `moveRunnerCardToHeap`, `trashCorpCardToArchives`, the 21 local trash copies, ~90 inline trashes, the ~40 `hostId` writers | Off-Campus Apartment, Dinosaurus, daemons (Djinn, Leprechaun), Personal Workshop, Street Peddler, Oversight AI, Egret, Hush, Gebrselassie, Glenn, the trash-on-access set | 10.3.1g, 8.x trash rules, 1.x hosting | `procedures/host.ts` (`hostCard`, `unhostCard`) with one representation: `hostedCardIds` derived from `hostId`, or kept in step only by the helper. `procedures/trash.ts` (`trashCard(state, id, {cause, by})`) with prevention, triggers, hosted release, and Corp/Runner symmetry | Engine maintenance |
| 2 | Uninstall, ice removal, run position, rearrange | `removeCardFromCurrentZone` callers, ~40 uninstall sites, 4 direct position writes, 18 setter calls, 13 attacked-server writes, run objects built outside `run.ts`, 3 rearrange kinds | Mandatory Seed Replacement, Sunset, Escher, Mind Game, Formicary, Builder, Miraju, Howler, Bait and Switch-style bounces, Jua, Amani | 8.5.10, 6.2.4, 6.2.6, 6.2.7a/c/e, 8.3.1, 8.8.2 | `procedures/uninstall.ts` (`uninstallCard(id, destination)`) that always calls `noteIceUninstalled`, fires `onUninstall`/`rfgOnUninstall`, and releases hosted cards via area 1. `procedures/rearrange.ts` with a run guard and position fix-up. All position and redirect writes go through `runPosition.ts` | Engine maintenance |
| 3 | Swap | 13 kinds outside the helpers; 3 duplicate ice-swap helpers; Tāo | Tāo Salonga, Daruma, Sakai, Mumbad Virtual Tour-era swaps, Surfer, Inversificator, Metamorph, Allele, Nihongai, Raman Rai, Turntable, plus re-verify Yagi-Uda, Midori, Mitra Aman | 8.8.1–8.8.4d | `procedures/swap.ts` exporting `swapCards(a, b)` built on area 2's uninstall and the existing three helpers (made public); every swap kind becomes a call to it. Tāo gets a real swap | Engine maintenance |
| 4 | Visibility | `seatVisibility.ts`, `getPublicView` raw clones, game `spectatorView`, `stripSecrets` | Facedown installs, Archives facedown, reveals and looks (Hayley, Raman Rai), set-aside cards | 1.21.1–1.21.6, 10.2.1–10.2.3b | One seat-view filter in the engine that redacts every payload (run, pending, reaction stack, reveals, log); the game spectator view built from `getPublicView("spectator")`. Fix the 1.18 citations | Engine maintenance + game release with the pin |
| 5 | Corp install | 42 bypass kinds, `applyCorpInstallPrimitive` | Ablative Barrier, Architect, Jinja City Grid, Advertisement, Casting Call, MTI, Mushin, Priority Construction, Enforcement, ASA, Haas Pet Project, Next Design, Mutate | 8.5.1–8.5.11, 4.6.8, 1.16.6b | `installCorp` exposes options `{source, destination, costMode: pay|ignore|discount, rezAfter, advancements, faceup}`; all 42 call it | Engine maintenance |
| 6 | Runner install | 30 kinds, 8 semi-shared helpers, graph.ts pushes | Street Peddler, Hayley, Compile, DaVinci, Crowdfunding, Rosetta, Supplier, Kabonesa, Emergent, Diana, Reclaim, Chatterjee, Code Siphon | 8.5, MU rules, console uniqueness | `installRunner` with the same options; Runner cards never `rezzed` | Engine maintenance |
| 7 | Rez and derez | 33 direct rez sites, ~20 derez sites | Surat, Sensor Net, Worlds Plaza, Advertisement, Mutate, Keros, Maui, Brasília, Miraju, Realloc | rez/derez rules in ch. 8, 9.x triggers | `procedures/rez.ts` (`rezCard(id, {costMode})`) and `derezCard(id)` carrying `derez_card`'s hooks | Engine maintenance |
| 8 | Access | Khusyuk, Deep Dive, Detente | those three | 7.1–7.5 | All access goes through `access_card`; Detente picks a random card and does not turn it faceup | Engine maintenance |
| 9 | Damage and prevention | `dealDamage`/`resolveDamage`, 23 `prevent_*` kinds | Prevention cards from the area inventory | damage and prevention rules in ch. 10 | Damage: confirm with mutation score and CR examples. Prevention: one prevent helper the `prevent_*` kinds call | Engine maintenance if prevention changes; test-only otherwise |
| 11 | Turn structure, actions, breaking, scoring, psi and traces | `costBeginsWithClick`, the `score_*` and `forfeit_*` kinds, `corpActionTypeCounts` and their writers, the operation play path, ability plays of operations, the break kinds, psi bids, the `autoResolveTrace` callers, paid-ability windows narrower than the printed text | MirrorMorph, Nebula Talent Management, Petty Cash, Plutus, Subcontract, Corp identity click abilities, Markus 1.0 and the bioroid breaks, Consulting Visit, psi ice and upgrades | 5.1–5.7, 6.5 and 9.8.5 (encounter and breaking), 8.6.2 and 1.16 (play costs), 10.14 (psi), 10.8 (traces) | `procedures/action.ts` that records an action once, with its type, for every path that is one, and no path that is not; one break helper with a Runner choice of subroutine; play costs charged in one place | Engine maintenance |
| 12 | Counters and advancement | `counterPrimitives`, 36 `place_*` kinds, advancement writers | Cards from the area inventory that place or move counters and advancements | advancement and counter rules (ch. 1, 8), from the area's cr-checker pass | `procedures/counters.ts` (`placeCounters(id, type, n)`, `removeCounters`) that every `place_*` kind calls | Engine maintenance |
| 13 | Search, shuffle and deck order | 53 `search_*` and 46 `shuffle_*` kinds, inline `random()` (Code Siphon), R&D rearrange | Code Siphon and the search and shuffle cards from the area inventory | search, shuffle and deck rules, from the area's cr-checker pass | `procedures/deck.ts` with one search and one shuffle helper using the game's seeded random; search kinds merged into a filter field | Engine maintenance |
| 10 | Card flags and declarations | The flags left in `tests/baselines/card-flags.json` after areas 1–9 and 11–13 have moved the ones that hide a procedure | Full list from the 1.10 baseline at that point | 9.3 ability records; 9.12 for continuous declarations; the rule each flag's reader cites | Each flag family becomes one of three things: a declared static ability (the S6 `continuousSubtypeGrants` pattern), a field on an existing kind, or a printed characteristic that stays (cost, strength, link). No new flag for a one-off | Engine maintenance; card JSON in paired cut C |
| 14 | Run flow | `actions/run.ts` and the run-hook modules in `src/state`: `runStart.ts`, `runBeginHooks.ts`, `runBeginEffectHooks.ts`, `runInitiateTax.ts`, `runLegality.ts`, `approachIceHooks.ts`, `approachServerHooks.ts`, `passIceHooks.ts`, `bypassHooks.ts`, `runTimingHooks.ts`, `endTheRun.ts`, the `successfulRun*` and `unsuccessfulRunHooks.ts` modules; the 26 `run_`, 6 `jack_out` and 7 `bypass` kinds | Off the Grid and Replicating Perfection (6.3.2a), Panic Button and Mamba (paid-ability windows), Labyrinthine Servers (jack-out prevention), and the bypass and run-event cards from the area inventory | 6.1, 6.3, 6.4, 6.6–6.9, 11.4 | `src/state/procedures/run.ts`: one run procedure that walks the 6.9 steps, opens each paid-ability window the CR names, and fires the start, approach, pass, success and end hooks from one table. Every run start goes through `isRunTargetAllowed` (6.3.2a) | Engine maintenance; card JSON in paired cut B |
| 15 | Keywords and credits | `tags.ts`, `badPublicityHooks.ts`, `outsidePoolSpend.ts`, `hostedCredits.ts`, the spending checks in `costs.ts`, the link input to `trace.ts`, the bad publicity fund in `psi.ts`; the kinds with `tag` (34), `bad_publicity` (15), `charge`, `sabotage`, `dividends`, `identify_mark` and the other mark kinds, and the `load` kinds | Jesminder Sareen, End of the Line, psi bids with bad publicity credits (10.6.2), and the mark, charge, sabotage, dividend and load cards from the area inventory | 10.5–10.7, 10.9–10.13, 1.10 | `src/state/procedures/tags.ts` (give, remove and avoid, 10.5); bad publicity gain, loss and fund in one place (10.6); one credit-spend helper that applies spending restrictions and recurring credits (1.10); keyword kinds merged where they differ only in fields | Engine maintenance; card JSON in paired cut C |
| 16 | Game setup and end | `createGame.ts`, `startingHand.ts` (mulligan), `beforeFirstTurnHooks.ts`, `identityFace.ts`; the winner writes in `scoring.ts`, `damage.ts`, `emptyRnd.ts`, `returnKinds.ts` and `otherKinds.ts`; the game's deck check in `decks.ts` | Adam: Compulsive Hacker (1.5.3), Jinteki Biotech and Méliès U (1.5.2), the flatline finding (1.7.2b), cards that change influence or deck size | 1.4–1.7, 2.11, 2.12, 2.14 | `src/state/procedures/gameEnd.ts` with one win check called where the CR puts it (agenda points, flatline at the discard step, an empty R&D at the draw); setup in one place in 1.6's order; the game's deck check cites 1.4 and applies each format's rules | Engine maintenance + game release with the pin; card JSON in paired cut B |

Area 10 exits when no flag's reader builds an effect kind, and the flag baseline holds only printed characteristics and declarations.

### Area 1 results (2026-11-19)

Done in engine #942 (release `v1.147.264`) and game #313.

- **Helpers.** `src/state/procedures/host.ts` (`hostCard`, `unhostCard`, `unhostAllFrom`) is the only writer of `hostId` and `hostedCardIds`; both fields stay, kept in step by the helper. `src/state/procedures/trash.ts` (`trashCard(state, id, { by, cause, faceup, preventable, simultaneousSet })`, `discardCard`) is the one trash for both sides, with prevention, triggers, faces (CR 4.4.6b) and who trashed (CR 1.14.5).
- **Hosted release.** A host leaving play no longer moves its hosted cards. The 10.3.1g checkpoint trashes them (CR 1.13.13). This fixed Off-Campus Apartment and the stale hosted lists, and hosts bounced to the grip now lose their hosted cards.
- **Write guard.** `hostId` 100 → 0, `hostedCardIds` 88 → 0, `discardPile` 194 → 75. The rest of `discardPile` is 4 swap pushes (area 3), 1 forfeit (area 11) and about 70 removals from discard piles (areas 5, 6, 13).
- **Baselines.** All host-link invariant entries are gone (27 entries out, none in). Playout seeds 19 → 11, including both "pushed to Archives twice" seeds and the Stowaway and Street Peddler host links.
- **IR.** `host_self_as_condition` replaces three engine-built kinds; kinds 1,537 → 1,535. No card JSON changed, so paired cut A has nothing from area 1.
- **Mutation score** (`procedures/host.ts`, `procedures/trash.ts`): 57.37% at start, 88.96% at close. No survivor changes a CR-cited outcome; the list is in the engine's `docs/mutation-scores.md`.
- **CR examples.** None of the 12 uncovered examples belongs to area 1.
- **Hand check** (game #313): Off-Campus Apartment trashed by the Corp sends its hosted Kati Jones to the heap with both ends of the link cleared; the invariant panel is clean.
- **CI.** The playout-blocker replays took over 5 s on CI on master too; engine #942 gave them the playout suites' 60 s timeout.
- **Fix-now findings** (reported to the program session, not fixed here): Alexa Belsky trashes the HQ cards it should keep; Marilyn Campaign always shuffles, though its text says "you may"; Simulchip's "an installed program has already been trashed this turn" is met by any installed Runner card's trash, by either player.

### Phase 6 gate

*Added 2026-11-12. Revised 2026-11-19: every format is clean before the gate, and all formats open at once.* Phase 6, the Discord Activity ([`discord-activity.md`](discord-activity.md)), does not wait for the whole program. It starts when all of these are true:

- Phase 1 and Phase 2 are done, and so are the [playout blockers](#playout-blockers-after-phase-2-before-area-1--done-2026-11-15).
- Areas 1–4 are done and paired cut A has shipped. Area 4 is the one that puts hidden information in front of real opponents.
- Areas 14–16 are done (decided 2026-11-19): every game has runs, many cards use the keywords, and the Activity starts games and checks decks.
- RA-1 and RA-2 have reported and RF has shipped, which happens before cut A.
- The [printed-text sweep](#printed-text-sweep-beside-phase-3-before-the-phase-6-gate) has checked all three batches, and every card it found wrong is fixed, in every format. That includes the shared-procedure findings, so every area that holds one is done.
- The 1.12 baseline holds no card the sweep marked as matching.
- The seeded playouts (1.3) and the visibility fuzz (1.7) run clean on the Learn to play lists and on the Startup, Core Sets, Standard, and Eternal pools.

The Activity then opens with Learn to play, Startup, Core Sets, Standard, and Eternal at once. The remaining areas continue beside Phase 6, one writer per repo at a time.

### Exit criteria per area

- No invariant-baseline entries tagged with the area's procedure codes.
- The write-guard baseline for the area's properties is down to the helper module.
- Every CR example for the area is covered.
- No surviving mutants in CR-cited branches of the helper.
- cr-checker returns `follows` on the area diff.
- The kind and flag counts in `tests/baselines/format-counts.json` did not rise, and `docs/effect-ir-kinds.md` is regenerated.
- Engine, cards and game suites pass, and the release and pins move together.

## Running it in sessions

Each phase and area runs in its own session. A session ends with its PR merged, its release cut if `src/` changed, and pins bumped. Sessions that write the same repo go one at a time. Phase 1 tools in different files can run side by side in their own worktrees.

| Session | Repo(s) | Can run alongside | Brief |
|---|---|---|---|
| P0 docs | meta | anything | Fix cr-checker's printed-text source, record the three known gaps, add this program to the roadmap, and correct the S5/S6 rows. |
| P1-a invariants | engine | P1-b, P1-d, P1-e, P1-f | Build `src/debug/invariants.ts` from `boardProblems` with the checks in 1.1, and a vitest setup hook that runs it after every action. Record failures in `tests/baselines/invariants.json` by test name and problem code. No fixes. |
| P1-b static sweeps | engine | P1-a | 1.2 kind liveness/no-op sweep, 1.5a citation existence, 1.6 CR example coverage table; three baselines; test-only. |
| P1-c playouts | engine | after P1-a | 1.3: Learn to play lists and random legal decks per format, fixed seeds, invariants on; save failing seeds as fixtures. Cut the Phase 1 engine maintenance release for the debug hook. |
| P1-d labels | cards-data | P1-a | 1.4 label report and baseline in CI; no label edits yet. |
| P1-e visibility fuzz | game | after P1-c seeds exist (can start on Learn to play) | 1.7: seeded matches, sweep every seat and spectator snapshot for hidden ids and titles after each intent; baseline leaks. |
| P1-f jnet + mutation setup | engine | P1-a | 1.8 non-blocking jnet CI job and disagreement classification (human decision list); 1.9 Stryker config per area, scores doc. |
| P1-g citation topics | engine | after P1-b | 1.5b topic-match report and baseline for cr-checker review. |
| P1-h flag inventory | engine | P1-a; before or with P1-b | 1.10: list every `CardDef` flag and schema property with its cards, readers, and the kind each reader builds; baseline; test-only. |
| P1-i kind reference | engine | P1-a | 1.11: generate `docs/effect-ir-kinds.md` from `ir.ts`, add the stale-file test, and link it from `effect-ir.md`; test-only. |
| P2 guardrails | engine | after P1 | AST write guard with baseline replacing the regex guard; kind liveness and state-change coverage replacing the mention rule; engine-built kind names; the shrink-only kind and flag counts; the citation-topic test made failing after cr-checker's review. |
| PB playout blockers | engine (+ game, meta pins) | after P2, before P3-1 | Fix clusters B1 and B2 from the [playout blockers](#playout-blockers-after-phase-2-before-area-1--done-2026-11-15) table: CR first, cr-checker on the diff, tests that cite the rule, seeds fixture entries removed, one maintenance release, pins. |
| P3-1 … P3-16 | engine (+ cards, game) | areas 8 and 9 may run alongside 5–7; 14 runs after 4 and before 5; 16 may run alongside 8 and 9; 15, 12, 13 and 11 run in that order after 9; area 10 goes last; the rest go in order | The per-area recipe on the area's row: inventory, evidence, cr-checker, shared helper, IR merge (aliases until the paired cut), tests citing CR, one maintenance release, pins. |
| Paired cut A / B / C | cards + engine + game + meta | after P3-4 / after P3-9 (P3-14, P3-5 … P3-9, P3-16) / after P3-10 (P3-15, P3-12, P3-13, P3-11, P3-10) | Rewrite card JSON to the merged kinds, add the areas' labels, drop the aliases, paired release, pins. |
| ~~P1-j kind and phrase check~~ (done, engine #941) | engine | now, beside P3-1 | 1.12: the kind-to-phrase table, the check against `printed/`, flag-built kinds from the 1.10 map, polarity; baseline; test-only. |
| P1-k section map | engine (tests only) | beside any session that writes another repo; before areas 14–16 start | 1.13: the owner table for every CR section at the pin, the test that fails on a missing section, the shrink-only `none` baseline, and citation counts per section. Test-only. |
| RA-1, RA-2 re-audit | engine (tests and baseline only) | now, beside area 2, like the sweep | The [re-audit](#re-audit-of-the-earlier-programs-and-interaction-check) of timing (RA-1) and continuous effects (RA-2): inventory, baseline evidence, cr-checker on each path, tests citing the rule. Findings, no fixes. |
| RF re-audit fixes | engine (+ game, meta pins) | after RA-1 and RA-2; one writer per repo, so between areas | Fix what RA-1 and RA-2 found that the CR settles; file copied procedures under their area. CR first, cr-checker on the diff, tests citing the rule, one maintenance release, pins. |
| P1-l interactions | engine (tests and baseline only) | now, beside area 2 | Classify the 51 unclassified jinteki scenarios under tool 1.8: port the settled ones, file engine bugs under their area, list disagreements for Nathaniel. |
| P1-m rulings | engine (tests and baseline only) | beside the areas; in batches by card type | 1.14: a test per ruling citing the card and ruling, the shrink-only baseline, findings filed under their area. No fixes. |
| P1-n timing walk | engine (tests; `src/debug/` if needed) | before area 14 | 1.15: record the timing steps in the playouts, check each turn, run, breach and access against the chapter 11 chart, baseline the failures. |
| P1-o second reader | engine (tests only) | after P1-m and P1-l; on another model | 1.16: expected outcomes written blind from the CR, printed text and rulings; the comparison test; differences to cr-checker, open ones to Nathaniel. |
| P1-p subrule coverage | engine (tests and baseline only) | any time after P1-k | 1.17: every subrule and the tests citing it, the shrink-only baseline grouped by owner. |
| P1-q ability coverage | engine (tests and baseline only) | beside the areas | 1.18: record resolved abilities in the playouts, the never-fired baseline per card. |
| P1-r cited-rule check | engine (tests and baseline only) | any time | 1.19: the cited-rule text baseline and the test that fails on changed wording. |
| PS-S1 … PS-S3 sweep | engine (tests and baseline only) | beside the areas; S1, then S2, then S3; one cycle per session | The [per-session recipe](#per-session-recipe): read each card's printed text against its IR, cr-checker on wrong or unsure abilities, record results in `printed-sweep.json`, list every card in the PR, shrink the 1.12 baseline. No fixes. |
| ~~FX-breakers~~ (done: engine #953, release `v1.147.267`, game #318) | engine (+ game, meta pins) | after PF-S2, before P3-2 | The paid-ability break path checks strength (CR 3.9.5g) and the break limits, without the `interface` pump flag stopping printed pumps. CR first, cr-checker, tests citing the rule, one maintenance release, pins. |
| PF-S1 … PF-S3 sweep fixes (PF-S1 done: engine #948, [S1 results](#s1-results-2026-11-19); PF-S2 done: engine #950, [S2 results](#s2-results-2026-11-19)) | engine (+ cards, game, meta pins) | after that batch's sweep sessions; one writer per repo, so between areas | Fix the batch's card-own mistakes; file shared-procedure bugs under their area. CR first, cr-checker on the diff, tests citing the rule, one maintenance release, pins. |
| Phase 6 start | game | after the sweep, its fixes, and every area holding a sweep finding | Check the [Phase 6 gate](#phase-6-gate), then turn `discord-activity.md` into tasks for all formats at once. |

## Decisions for a human

| Date | Decision | Reason |
|---|---|---|
| 2026-11-19 | Add a check of every card's Effect IR against its printed text: tool 1.12 and the printed-text sweep | Nothing checked behavior against text across the corpus. The label triage found 9 wrong models by accident (CR 1.2.1) |
| 2026-11-19 | 1.12 lives in the engine, as a report with a shrink-only baseline | Only the engine sees the kinds card flags build. It matches the other Phase 1 tools |
| 2026-11-19 | Sweep the whole Eternal corpus, in batches by format with only the cards each adds: Startup, then Standard, then Eternal. Core Sets needs no batch | Every card gets read once, in the order players meet them |
| 2026-11-19 | The sweep starts now and runs beside the areas | It only reads, so it doesn't collide with area work, and its findings can reorder the areas |
| 2026-11-19 | Card-own fixes are grouped, one engine session per batch. Shared-procedure bugs go to their area | Fixing a procedure copy card by card is redone when the area replaces it (`docs/how-we-work.md`, Findings) |
| 2026-11-19 | Before the Phase 6 gate, every format is swept and every wrong card is fixed, including the ones an area owns. The gate waits for those areas; run an area early if it holds most of the findings | No player meets a card known to play wrong |
| 2026-11-19 | The Activity opens all formats at once: Learn to play, Startup, Core Sets, Standard, and Eternal | One launch and one checklist, since every format is clean before the gate |
| 2026-11-19 | The sweep leaves labels alone | It reads the printed text directly. Labels stay in each area's paired cards release |
| 2026-11-19 | The four S2 visibility leaks (Vera Ivanovna Shuyskaya, Complete Image, Whistleblower, Architect Deployment Test) are fixed first in PF-S2, which starts right after S2c, not in a session of their own | The engine has one writer at a time, so no session could start sooner; one session and one release (CR 10.2.2a) |
| 2026-11-19 | Paid-ability icebreakers that ignore strength get a fix-now session of their own right after PF-S2, before area 2 | A supported card plays wrong in normal use, and area 11 runs late; PF-S2 is already about 76 cards (CR 3.9.5g) |
| 2026-11-19 | Pivot and Epiphany Analytica join the visibility leaks PF-S2 fixes first; Arissana Rocha Nahu stays with area 6 | Same class as the four already decided (CR 10.2.2a); Arissana is one copy of the Runner install cluster area 6 replaces |
| 2026-11-19 | Re-audit the sections the fidelity and standardization programs own (RA-1, RA-2, RF) | Another agent built them before the CR-first loop and the Phase 1 tools existed, and this audit had assumed them correct |
| 2026-11-19 | Add a check of interactions between cards: classify the 51 jinteki scenarios left unclassified (P1-l) | Each area checks one procedure and the sweep reads one card at a time, so nothing else checks cards meeting |
| 2026-11-19 | The 24 CR sections with no owner get three new areas (14 run flow, 15 keywords and credits, 16 game setup and end); 1.14 and 1.15 go to area 11, 4.9 to area 2, 8.4 to area 13 | Tool 1.13's first pass found no area and no earlier program auditing them, and findings already sit in them (1.7.2b, 10.6.2) |
| 2026-11-19 | Area 14 runs after area 4 and before area 5, with its card JSON in paired cut B. Area 15 runs after area 9 and before area 12, with its card JSON in cut C. Area 16 runs beside areas 8 and 9, with its card JSON in cut B | Area 14 needs area 2's position helpers; tags and bad publicity meet damage and prevention; area 16 writes the game's deck rules and the engine's setup and win checks, not a procedure another area replaces |
| 2026-11-19 | The Phase 6 gate waits for areas 14–16 | Every game has runs, many supported cards give tags or use the keywords, and the Activity starts games and checks decks |
| 2026-11-19 | RA-1, RA-2 and P1-l start now, beside area 2. RF follows them, between areas, before paired cut A | They write only tests and baselines, as the sweep does; every later area builds on timing |
| 2026-11-19 | Add tools 1.14–1.19: rulings as tests, the timing walk, a second reader on another model, subrule coverage, ability fire coverage, and the cited-rule change check | They reduce what the audit can still miss: a shared misreading, untried card interactions, rules or abilities with no test, and changed CR wording |
| 2026-11-19 | Keep the plan order for areas 5–13 after the sweep | Nathaniel kept the order. The gate still waits for every area that holds a sweep finding |

## Not yet decided

- ~~**The order of areas 5–13 after the sweep.**~~ Decided 2026-11-19: keep the plan order (see Decisions for a human).
- ~~**Owners for the 24 unowned CR sections.**~~ Decided 2026-11-19 (see Decisions for a human).
- ~~**When the new areas run.**~~ Decided 2026-11-19.
- ~~**Whether the Phase 6 gate waits for areas 14–16.**~~ Decided 2026-11-19.
- ~~**Whether to re-audit the sections the earlier programs own.**~~ Decided 2026-11-19: re-audit them (see Decisions for a human).
- ~~**When RA-1, RA-2 and P1-l run.**~~ Decided 2026-11-19.
- **Which model the second reader (1.16) uses.** Recommended: another Claude model than the one that writes the engine sessions (Opus 5.5), such as Sonnet 5.5 or Fable 5.2. It needs no new account. A model from another company would be more independent but needs its own account and API key. Blocks P1-o.
- **Whether the Phase 6 gate waits for these checks.** Recommended: the gate waits for 1.14 (every ruling tested, or filed in an area that is done) and for 1.15 running clean on the playouts. 1.16–1.19 feed the areas but do not hold the gate. Blocks the gate's wording.

## Out of scope

- Phase 6 itself. The Discord Activity is [`discord-activity.md`](discord-activity.md); this plan only decides when it may start.
- Fixing a shared procedure card by card before its area runs (see [Fixes](#fixes)).
- Labels outside an area's paired cut, and card JSON outside the three paired cuts or a paired cards release.
- New card support, and UI beyond the verification table's hand checks.
- Changing the release model: the repos stay separate and consume each other by tag.

## Verification of the program itself

- After Phase 1 the baselines exist and CI is green with them.
- At each area exit the area's baseline entries are gone and the guard counts shrink. `npm test`, `npm run lint` and `npm run typecheck` pass in the engine; the cards CI validate passes; `npm test` passes in the game.
- The seeded playouts and the visibility fuzz run clean at the end of each area.
- Final state:
  - the invariant baseline is empty;
  - the direct-write baseline has only the procedure modules;
  - no dead or no-op kinds remain;
  - every conditional and play ability has a label;
  - the 11 CR examples are covered;
  - no card flag's reader builds an effect kind;
  - `docs/effect-ir-kinds.md` is generated and current;
  - every card in the catalog has a result in `printed-sweep.json`, and none is wrong;
  - every CR section at the pin has an owner in tool 1.13's table, and none is `none`;
  - RA-1 and RA-2 have reported and RF has fixed every finding the CR settles;
  - every jinteki scenario is classified, and each disagreement has a decision;
  - the rulings baseline (1.14) is empty, and the timing walk (1.15) runs clean in the playouts;
  - every second-reader difference (1.16) is resolved or decided;
  - the subrule (1.17) and ability fire (1.18) baselines hold only entries with a dated reason;
  - the cited-rule text baseline (1.19) matches the CR pin;
  - the 1.12 baseline is empty;
  - Phase 6 began at the gate, not after the last area;
  - the roadmap names this program done and the plan moves to `docs/plans/done/`.
