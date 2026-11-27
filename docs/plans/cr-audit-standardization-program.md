# CR audit and standardization program

*Drafted 2026-11-11 from an inventory of engine `v1.147.251` (master `aec05b54`), cards `v1.147.22`, and CR `v26.03`. Current versions are in the [pin table](../../README.md). The brief named `v1.147.250` as the floor, but the pin is already `v1.147.251` (the Midori choice-key fix, engine #895).*

## Where it stands

**Status:** paused. Updated 2026-11-27.

Paused for the [repository layout plan](repo-layout.md) until its slice X merges, which moves `src/state/procedures/` into area folders. Fix-now slices take the engine first: FX-expose (engine `v1.147.287`) and FX-faceup (`v1.147.288`) are done, so no seat sees the titles of facedown cards the Runner chooses among or accesses in a server. A third leak, in HQ access (Snare!), is filed under area 4: Nathaniel chose on 2026-11-27 not to fix it early, so the layout plan's D1 started. After the pause: PF-S3e and PF-S3f, the second reader's last part beside them, then area 3. Every card has a sweep result: 1,348 match, 359 wrong, 259 filed, 50 fixed.

## Waiting on you

Nothing.

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
| Discord-native play | Area 4 (visibility), the [printed-text sweep](#printed-text-sweep-beside-phase-3-before-the-phase-6-gate), and the [Phase 6 gate](#phase-6-gate), which starts the Activity once the whole program is done |

## Shared pieces

*Added 2026-11-19.* Each area builds one helper for its procedure, and every later slice calls it instead of writing its own. A slice that needs a piece its area has not built yet stops and says so; it does not write a local copy. The names and CR rules come from the [Areas](#areas) table and the area results.

| Procedure | Owner | CR | State |
|---|---|---|---|
| Hosting | `src/state/procedures/host.ts`: `hostCard`, `unhostCard`, `unhostAllFrom`, the only writers of `hostId` and `hostedCardIds` | 1.13.13, 10.3.1g | Built (area 1) |
| Trash and discard, both sides | `src/state/procedures/trash.ts`: `trashCard(state, id, { by, cause, faceup, preventable, simultaneousSet })`, `discardCard` | 1.14.5, 4.4.6b, 10.3.1g | Built (area 1) |
| Run position and redirects | `src/state/runPosition.ts`: `setRunnerPosition`, `moveRunnerInward`, `noteIceUninstalled`, `addOutermostIce` | 6.2.4, 6.2.6, 6.2.7a/c/e | Built (area 2): every position and attacked-server write goes through it; adds `moveRunnerToOutermost`, `moveRunnerToIce`, `runnerCanMoveToPosition`, `setAttackedServer` |
| Uninstall and ice removal | `src/state/procedures/uninstall.ts`: `uninstallCard(id, destination)`, which calls `noteIceUninstalled`, fires `onUninstall`, and releases hosted cards through area 1 | 8.5.10, 4.9.2 | Built (area 2): `uninstallCard(state, id, destination)`, `removeCardFromGame`, `ceaseVacantPositions` |
| Rearrange | `src/state/procedures/rearrange.ts`: `rearrangeIce`, `moveIce`, with a run guard and position fix-up | 8.3.1, 8.3.2, 6.2.7 | Built (area 2); one `rearrange_ice` kind |
| Swap | `src/state/procedures/swap.ts`: `swapCards(a, b)`, built on the uninstall helper and the three ice-swap helpers | 8.8.1–8.8.4d | Area 3 |
| What a seat can see | One seat-view filter in the engine (`seatVisibility.ts`, `getPublicView`) that redacts every payload; the game's spectator view built from it | 1.21.1–1.21.6, 10.2.1–10.2.3b | Area 4 |
| Corp install | `installCorp` with `{ source, destination, costMode, rezAfter, advancements, faceup }` | 8.5.1–8.5.11 | Area 5 |
| Runner install | `installRunner` with the same options, MU and console limits | 8.5 | Area 6 |
| Rez and derez | `src/state/procedures/rez.ts`: `rezCard(id, { costMode })`, `derezCard(id)` | 8.1.1–8.1.3 | Area 7 |
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

So 1,187 non-static abilities on 1,078 cards have no label. Midori and Mitra Aman are two of them. Nothing in either repo compares labels with `data/printed/<id>.json`, and `scripts/validate_cards.py` `check_printed` cross-checks only a few phrases.

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

*The type-checked counts from the Phase 2 write guard are in [Phase 2 results](cr-audit-standardization-program/results.md#phase-2-results-2026-11-14). They replace this regex estimate.*

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

## Phase 2: guardrails (S–M, test-only) — done 2026-11-14

1. **Write guard** `tests/procedure-write-guard.test.ts`. A TypeScript-AST scan (the `typescript` package is already a dependency) over `src/**` for assignments and mutating calls on `.zone`, `.hostId`, `.hostedCardIds`, `server.ice`, `server.root`, `runner.installed`, `*.hand`, `*.deck`, `discardPile`, score areas, `removedFromGame`, `.rezzed`, `run.position`, and `run.attackedServerId`. It covers `=`, `+=`, `-=`, casts, `push`/`splice`/`unshift`/`shift`/`pop`, and `filter` reassignments. An allowlist names the helper modules. Baseline is `tests/baselines/direct-writes.json`, keyed by file + property + count (not line numbers) so it doesn't churn. It replaces the regex in `ice-uninstalled-during-run.test.ts`.
   - Starting baseline is roughly the table above: ~550 `zone`, ~200 host, ~100 ice/root, ~140 installed, ~120 discard, 4 position, 13 attacked-server.
2. **Kind liveness and effect guard**, replacing the mention rule in `one-off-kind-coverage.test.ts`. Every kind in `KNOWN_PRIMITIVE_KINDS` must (a) be reachable from card JSON, a card flag consumer, or a named engine builder, and (b) appear in a test that **asserts a state change** through a shared outcome helper (`expectStateDelta(before, after, {...})`). Each test registers its kind as `coversKind("x")`, so a name mention no longer counts. The baseline starts at the current non-compliant set and only shrinks.
3. **Engine-built kind names.** Extend `effect-ir-names.test.ts` to engine-built kinds as well, using the existing 215-entry legacy list as their baseline.
4. **Counts may only shrink.** `tests/baselines/format-counts.json` holds three numbers: kinds in `KNOWN_PRIMITIVE_KINDS` (1,540 at the inventory), kinds used by exactly one card (735), and `CardDef` flags (616). A change that raises one fails unless the baseline is edited with a dated reason. No target number is set now. Each Phase 3 area records the counts it leaves behind.
5. **Citation topics.** Tool 1.5b starts as a report. Once cr-checker has reviewed its baseline, a new topic mismatch fails the test instead of being recorded.

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

S3 sessions (cards with no `printed-sweep.json` entry, grouped by the cycle of their earliest printing; counts at cards `v1.147.25`):

| Session | Cycles | Cards |
|---|---|---|
| S3a | Core Set | 111 |
| S3b | Genesis | 119 |
| S3c | Creation and Control, Honor and Profit | 107 |
| S3d | Spin | 100 |
| S3e | Lunar | 120 |
| S3f | Order and Chaos, Data and Destiny | 110 |
| S3g | SanSan | 120 |
| S3h | Mumbad | 114 |
| S3i | Flashpoint | 100 |
| S3j | Red Sand | 120 |
| S3k | Kitara | 120 |
| S3l | Reign and Reverie, Magnum Opus, System Core 2019, System Update 2021 | 82 |
| S3m | Cards whose earliest printing is in a pack with no `card-sets.json` entry (Terminal Directive, Revised Core Set, Stalwart, Twenty-Three Seconds) | 80 |

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
- **A bug in a shared procedure** (install, swap, rez, and so on) goes in that area's row of the [findings table](cr-audit-standardization-program/findings.md), with the card titles. The area fixes it once when it replaces the copy. It is not fixed card by card first.
- A fix that needs card JSON rides with the next paired cut, or its own paired cards release if no cut is near.
- The gate below needs every wrong card fixed, and the whole program done.

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

- **Area 1: Hosting and trash** (done 2026-11-19, [results](cr-audit-standardization-program/results.md#area-1-results-2026-11-19)). Two confirmed bugs (OCA, the stale `hostedCardIds`). No hosting helper, two representations, 21 trash copies plus ~90 inline sites. Every later area calls these.
- **Area 2: Uninstall, ice removal and run position (8.5.10, ch. 6, 8.3 rearrange)** (done 2026-11-20, [results](cr-audit-standardization-program/results.md#area-2-results-2026-11-20)). No uninstall helper; `onUninstall` never fires outside trash; position drift touches every run; Mandatory Seed orphan ice. Needs area 1's hosted release.
- **Area 3: Swap (8.8).** Finish what #893/#894 started: 13 kinds outside the helpers, plus Tāo. Needs the uninstall helper from area 2.
- **Area 4: Visibility (1.21, 10.2).** Moved up because Phase 6, the Discord Activity, puts hidden information in front of real opponents. Wrong citations and raw state clones.
- **Area 5: Corp install (8.5).** 42 bypasses; every ice bypass can desync the position (made safe by area 2).
- **Area 6: Runner install (8.5).** 30 bypasses plus 8 semi-shared helpers; MU limit and hook gaps.
- **Area 7: Rez and derez (8.1.1–8.1.3).** 21 rez sites without hooks; no derez helper.
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
7. **Delivery.** Findings and open items go in the PR body and this plan's [findings table](cr-audit-standardization-program/findings.md), not in a notes file: that is where the next area's evidence step reads. One engine PR and one engine maintenance release per area (routing only, no card JSON change). Bump the game pin and the meta pin table in the same pass. Card JSON changes (kind merges, labels) are batched into **three paired cards+engine releases**: cut A after areas 1–4; cut B after area 9, covering 14, 5–9 and 16; cut C after area 10, covering 15, 12, 13, 11 and 10. Three cuts keep each card JSON rewrite small enough to review. Each is an explicit manual paired cut under `docs/git-hygiene.md`, so pins don't churn. Run cr-checker on the diff before each engine commit.

### Areas

| # | Area | Scope | Cards affected (examples; full list from the area inventory) | CR rules | Standardization target | Release |
|---|---|---|---|---|---|---|
| 1 | Hosting and trash | `releaseHostedCardsOnTrash`, `moveRunnerCardToHeap`, `trashCorpCardToArchives`, the 21 local trash copies, ~90 inline trashes, the ~40 `hostId` writers | Off-Campus Apartment, Dinosaurus, daemons (Djinn, Leprechaun), Personal Workshop, Street Peddler, Oversight AI, Egret, Hush, Gebrselassie, Glenn, the trash-on-access set | 10.3.1g, 8.x trash rules, 1.x hosting | `procedures/host.ts` (`hostCard`, `unhostCard`) with one representation: `hostedCardIds` derived from `hostId`, or kept in step only by the helper. `procedures/trash.ts` (`trashCard(state, id, {cause, by})`) with prevention, triggers, hosted release, and Corp/Runner symmetry | Engine maintenance |
| 2 | Uninstall, ice removal, run position, rearrange | `removeCardFromCurrentZone` callers, ~40 uninstall sites, 4 direct position writes, 18 setter calls, 13 attacked-server writes, run objects built outside `run.ts`, 3 rearrange kinds | Mandatory Seed Replacement, Sunset, Escher, Mind Game, Formicary, Builder, Miraju, Howler, Bait and Switch-style bounces, Jua, Amani | 8.5.10, 6.2.4, 6.2.6, 6.2.7a/c/e, 8.3.1, 8.8.2 | `procedures/uninstall.ts` (`uninstallCard(id, destination)`) that always calls `noteIceUninstalled`, fires `onUninstall`/`rfgOnUninstall`, and releases hosted cards via area 1. `procedures/rearrange.ts` with a run guard and position fix-up. All position and redirect writes go through `runPosition.ts` | Engine maintenance |
| 3 | Swap | 13 kinds outside the helpers; 3 duplicate ice-swap helpers; Tāo | Tāo Salonga, Daruma, Sakai, Mumbad Virtual Tour-era swaps, Surfer, Inversificator, Metamorph, Allele, Nihongai, Raman Rai, Turntable, plus re-verify Yagi-Uda, Midori, Mitra Aman | 8.8.1–8.8.4d | `procedures/swap.ts` exporting `swapCards(a, b)` built on area 2's uninstall and the existing three helpers (made public); every swap kind becomes a call to it. Tāo gets a real swap | Engine maintenance |
| 4 | Visibility | `seatVisibility.ts`, `getPublicView` raw clones, game `spectatorView`, `stripSecrets` | Facedown installs, Archives facedown, reveals and looks (Hayley, Raman Rai), set-aside cards | 1.21.1–1.21.6, 10.2.1–10.2.3b | One seat-view filter in the engine that redacts every payload (run, pending, reaction stack, reveals, log); the game spectator view built from `getPublicView("spectator")`. Fix the 1.18 citations | Engine maintenance + game release with the pin |
| 5 | Corp install | 42 bypass kinds, `applyCorpInstallPrimitive` | Ablative Barrier, Architect, Jinja City Grid, Advertisement, Casting Call, MTI, Mushin, Priority Construction, Enforcement, ASA, Haas Pet Project, Next Design, Mutate | 8.5.1–8.5.11, 4.6.8, 1.16.6b | `installCorp` exposes options `{source, destination, costMode: pay|ignore|discount, rezAfter, advancements, faceup}`; all 42 call it | Engine maintenance |
| 6 | Runner install | 30 kinds, 8 semi-shared helpers, graph.ts pushes | Street Peddler, Hayley, Compile, DaVinci, Crowdfunding, Rosetta, Supplier, Kabonesa, Emergent, Diana, Reclaim, Chatterjee, Code Siphon | 8.5, MU rules, console uniqueness | `installRunner` with the same options; Runner cards never `rezzed` | Engine maintenance |
| 7 | Rez and derez | 33 direct rez sites, ~20 derez sites | Surat, Sensor Net, Worlds Plaza, Advertisement, Mutate, Keros, Maui, Brasília, Miraju, Realloc | 8.1.1–8.1.3 (rez and derez), 9.x triggers | `procedures/rez.ts` (`rezCard(id, {costMode})`) and `derezCard(id)` carrying `derez_card`'s hooks | Engine maintenance |
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

### Phase 6 gate

*Added 2026-11-12. Revised 2026-11-19: every format is clean before the gate, and all formats open at once. Revised again 2026-11-19: Phase 6 waits for the whole program.* Phase 6, the Discord Activity ([`discord-activity.md`](discord-activity.md)), starts when this program is done: every item in the final state under [Verification of the program itself](#verification-of-the-program-itself) is true. In particular:

- Every phase, area (1–16), fix session (PF-S1 … PF-S3, RF) and paired cut (A, B, C) is done.
- The [printed-text sweep](#printed-text-sweep-beside-phase-3-before-the-phase-6-gate) has checked all three batches, and every card it found wrong is fixed, in every format.
- Every CR section has an owner (1.13), every ruling has a test (1.14), the timing walk (1.15) runs clean, and every second-reader difference (1.16) is resolved or decided.
- The seeded playouts (1.3) and the visibility fuzz (1.7) run clean on the Learn to play lists and on the Startup, Core Sets, Standard, and Eternal pools.

The Activity then opens with Learn to play, Startup, Core Sets, Standard, and Eternal at once. The [product UI plan](product-ui.md) does not wait for the gate.

### Exit criteria per area

- No invariant-baseline entries tagged with the area's procedure codes.
- The write-guard baseline for the area's properties is down to the helper module.
- Every CR example for the area is covered.
- No surviving mutants in CR-cited branches of the helper.
- cr-checker returns `follows` on the area diff.
- The kind and flag counts in `tests/baselines/format-counts.json` did not rise, and `docs/effect-ir-kinds.md` is regenerated.
- Engine, cards and game suites pass, and the release and pins move together.

## Slices

Each phase, area and fix runs in its own session. A session ends with its PR merged, its release cut if `src/` changed, and pins bumped. Sessions that write the same repo go one at a time. Phase 1 tools in different files can run side by side in their own worktrees. What each finished slice found is in [results](cr-audit-standardization-program/results.md), the [findings table](cr-audit-standardization-program/findings.md) and its PR.

### Setup and tools

| ID | Session | Status | PR | Repo(s) | Runs | What it does |
|---|---|---|---|---|---|---|
| P0 | Docs | done | meta #246 | meta | anything | Fix cr-checker's printed-text source, record the three known gaps, add this program to the roadmap, and correct the S5/S6 rows. |
| P1-a | Invariants | done | engine #898–#907 (Phase 1) | engine | beside P1-b, P1-d, P1-e, P1-f | Build `src/debug/invariants.ts` from `boardProblems` with the checks in 1.1, and a vitest setup hook that runs it after every action. Record failures in `tests/baselines/invariants.json` by test name and problem code. No fixes. |
| P1-b | Static sweeps | done | engine #898–#907 (Phase 1) | engine | beside P1-a | 1.2 kind liveness/no-op sweep, 1.5a citation existence, 1.6 CR example coverage table; three baselines; test-only. |
| P1-c | Playouts | done | engine #898–#907 (Phase 1), release `v1.147.252` | engine | after P1-a | 1.3: Learn to play lists and random legal decks per format, fixed seeds, invariants on; save failing seeds as fixtures. Cut the Phase 1 engine maintenance release for the debug hook. |
| P1-d | Labels | done | cards #293, #294 | cards-data | beside P1-a | 1.4 label report and baseline in CI; no label edits yet. |
| P1-e | Visibility fuzz | done | game #283, #284 | game | after P1-c seeds exist (can start on Learn to play) | 1.7: seeded matches, sweep every seat and spectator snapshot for hidden ids and titles after each intent; baseline leaks. |
| P1-f | jnet and mutation setup | done | engine #898–#907 (Phase 1) | engine | beside P1-a | 1.8 non-blocking jnet CI job and disagreement classification (human decision list); 1.9 Stryker config per area, scores doc. |
| P1-g | Citation topics | done | engine #898–#907 (Phase 1) | engine | after P1-b | 1.5b topic-match report and baseline for cr-checker review. |
| P1-h | Flag inventory | done | engine #898–#907 (Phase 1) | engine | beside P1-a; before or with P1-b | 1.10: list every `CardDef` flag and schema property with its cards, readers, and the kind each reader builds; baseline; test-only. |
| P1-i | Kind reference | done | engine #898–#907 (Phase 1) | engine | beside P1-a | 1.11: generate `docs/effect-ir-kinds.md` from `ir.ts`, add the stale-file test, and link it from `effect-ir.md`; test-only. |
| P2 | Guardrails | done | engine #928 | engine | after P1 | AST write guard with baseline replacing the regex guard; kind liveness and state-change coverage replacing the mention rule; engine-built kind names; the shrink-only kind and flag counts; the citation-topic test made failing after cr-checker's review. |
| PB | Playout blockers | done | engine #930, #932 | engine (+ game, meta pins) | after P2, before area 1 | Fix clusters B1 and B2 from the [playout blockers](#playout-blockers-after-phase-2-before-area-1--done-2026-11-15) table: CR first, cr-checker on the diff, tests that cite the rule, seeds fixture entries removed, one maintenance release, pins. |
| P1-j | Kind and phrase check | done | engine #941 | engine | beside area 1 | 1.12: the kind-to-phrase table, the check against `printed/`, flag-built kinds from the 1.10 map, polarity; baseline; test-only. |
| P1-k | Section map | done | engine #956 | engine (tests only) | beside any session that writes another repo; before areas 14–16 start | 1.13: the owner table for every CR section at the pin, the test that fails on a missing section, the shrink-only `none` baseline, and citation counts per section. Test-only. |
| P1-r | Cited-rule check | done | engine #961 | engine (tests and baseline only) | any time | 1.19: the cited-rule text baseline and the test that fails on changed wording. |
| P1-p | Subrule coverage | done | engine #962 | engine (tests and baseline only) | any time after P1-k | 1.17: every subrule and the tests citing it, the shrink-only baseline grouped by owner. |
| RA-1 | Timing re-audit | done | engine #960 | engine (tests and baseline only) | beside area 2, like the sweep | The [re-audit](#re-audit-of-the-earlier-programs-and-interaction-check) of timing: inventory, baseline evidence, cr-checker on each path, tests citing the rule. Findings, no fixes. |
| RA-2 | Continuous-effect re-audit | done | engine #964 | engine (tests and baseline only) | beside area 2, like the sweep | The [re-audit](#re-audit-of-the-earlier-programs-and-interaction-check) of continuous effects: inventory, baseline evidence, cr-checker on each path, tests citing the rule. Findings, no fixes. |
| P1-l | Interactions | done | engine #965 | engine (tests and baseline only) | beside area 2 | Classify the 51 unclassified jinteki scenarios under tool 1.8: port the settled ones, file engine bugs under their area, list disagreements for Nathaniel. |
| P1-m | Rulings | done | engine #969, #979, #985, #987 | engine (tests and baseline only) | beside the areas; in batches by card type | 1.14: a test per ruling citing the card and ruling, the shrink-only baseline, findings filed under their area. No fixes. 6 unreachable rulings are left in the baseline. |
| P1-q | Ability coverage | done | engine #984 | engine (tests and baseline only) | beside the areas | 1.18: record resolved abilities in the playouts, the never-fired baseline per card. |
| P1-n | Timing walk | done | engine #988 | engine (tests; `src/debug/` if needed) | before area 14 | 1.15: record the timing steps in the playouts, check each turn, run, breach and access against the chapter 11 chart, baseline the failures. |
| P1-o | Second reader, batch 1 | done | engine #990, #994, #995, #998, #999, #1000 | engine (tests only) | after P1-m and P1-l; on Fable 5.2 | 1.16: expected outcomes written blind from the CR, printed text and rulings; the comparison test; differences to cr-checker, open ones to Nathaniel. Covered the CR examples in all ten chapters, a rulings sample (27 of 134 cards) and the jinteki run scenarios (20 of 51). |
| P1-o2 | Second reader, the rest | to do | | engine (tests only) | beside PF-S3e; on Fable 5.2 | The same as P1-o for the other 107 rulings cards and the other 31 jinteki scenarios, then each area's hand checks. |

### Printed-text sweep

| ID | Session | Status | PR | Repo(s) | Runs | What it does |
|---|---|---|---|---|---|---|
| PS-S1 | Sweep: Startup | done | engine #943–#945 | engine (tests and baseline only) | beside the areas | The [per-session recipe](#per-session-recipe): read each card's printed text against its IR, cr-checker on wrong or unsure abilities, record results in `printed-sweep.json`, list every card in the PR, shrink the 1.12 baseline. No fixes. |
| PS-S2 | Sweep: Standard (S2a–S2c) | done | engine #946, #947, #949 | engine (tests and baseline only) | after PS-S1 | The same recipe, one cycle per session. |
| PS-S3 | Sweep: Eternal (S3a–S3m) | done | engine #958, #959, #963, #967, #968, #970, #973–#975, #977, #978, #981, #982 | engine (tests and baseline only) | after PS-S2 | The same recipe, one cycle per session. Every card in the catalog now has a result. |
| PF-S1 | Fixes from S1 | done | engine #948, game #314 | engine (+ cards, game, meta pins) | after PS-S1; one writer per repo | Fix the batch's card-own mistakes; file shared-procedure bugs under their area. CR first, cr-checker on the diff, tests citing the rule, one maintenance release, pins. |
| PF-S2 | Fixes from S2 | done | engine #950, game #315 | engine (+ cards, game, meta pins) | after PS-S2 | The same, for S2. |
| PF-S3a | Fixes from S3a and S3b | done | engine #997, cards #308, game #330, meta #345 | engine (+ cards, game, meta pins) | after its two sweep sessions; one engine `src/` writer at a time | Fix the cards those sweeps recorded wrong. |
| PF-S3b | Fixes from S3c and S3d | done | engine #1002, #1003, cards #309, game #332, meta #353 | engine (+ cards, game, meta pins) | as PF-S3a | The same. |
| PF-S3c | Fixes from S3e and S3f | done | engine #1005, cards #310, game #334, meta #359 | engine (+ cards, game, meta pins) | as PF-S3a | The same, plus Medical Breakthrough. |
| PF-S3d | Fixes from S3g and S3h | done | engine #1006, cards #311, game #335, meta #362 | engine (+ cards, game, meta pins) | as PF-S3a | The same. |
| PF-S3e | Fixes from S3i and S3j | to do | | engine (+ cards, game, meta pins) | after FX-expose | The same, plus the second reader's differences in these batches. |
| PF-S3f | Fixes from S3k, S3l and S3m | to do | | engine (+ cards, game, meta pins) | after PF-S3e | The same, plus the second reader's differences in these batches. |

### Fixes found on the way

Fix-now sessions (`docs/how-we-work.md`, Findings) and the fixes for what the re-audits found.

| ID | Session | Status | PR | Repo(s) | Runs | What it does |
|---|---|---|---|---|---|---|
| FX-breakers | Breakers check strength | done | engine #953, game #318 | engine (+ game, meta pins) | after PF-S2, before area 2 | The paid-ability break path checks strength (CR 3.9.5g) and the break limits, without the `interface` pump flag stopping printed pumps. CR first, cr-checker, tests citing the rule, one maintenance release, pins. |
| FX-salem | Salem's Hospitality and Quest Completed | done | engine #957, game #320, meta #310 | engine (+ game, meta pins) | after FX-breakers, before area 2 | Fix-now from PF-S2 (engine #950, Found, not fixed). Salem's Hospitality (`name_reveal_trash_grip_copies`) names from every card in the game, so the Corp's list shows the titles in the Runner's grip and stack (CR 10.2.2a): name from `catalogCardNames`, as PF-S2 did for Complete Image. Quest Completed uses `access_one_root_other_server`, which needs an active run and blocks stealing and trashing; the card is played outside a run and prints neither (CR 1.2.1, ch. 7). Check the kind's other users (Pinhole Threading) before changing it. CR first, cr-checker on the diff, tests citing the rule, one maintenance release, pins. |
| FX-pump | Icebreaker pumps | done | engine #976, game #322, meta #318 | engine (+ game, meta pins) | right after area 2 | Build each icebreaker's pump from its card fields for every breaker (CR 3.9.5); the S3c and S3f breaker lists are the test cases. CR first, cr-checker, tests citing the rule, one maintenance release, pins. |
| RF-1 | Timing fixes | done | engine #980, game #323 | engine (+ game, meta pins) | after FX-pump | RA-1's findings (engine #960, the RF (fidelity) rows): make each `it.fails` RF test a plain test, write tests first for the cr-checker-only rows, the 9.2.8a nested window. One release. |
| FX-legal-moves | Legal moves agree with apply | done | engine #983, game #324, meta #323 | engine (+ game, meta pins) | after RF-1, before RF-2 | The legal-move list and the apply path agree: Net Shield's prevention (9.9.4d), a Runner tag interrupt on the Corp's turn (9.2.9c–d) and Asteroid Belt's discounted rez (1.16.2a) are listed; a check fails when the two disagree. One release. |
| FX-small | Approach-step leak and Archives trash | done | engine #986, game #325, meta #328 | engine (+ game, meta pins) | after FX-legal-moves, before RF-2 | Two fix-now findings: decide the step after approaching the server from open information only, so a facedown Formicary-class ice does not change it (10.2.2b, 10.2.3a); no basic trash for a card accessed in Archives (7.1.5b). CR first, cr-checker, tests citing the rule, one maintenance release, pins. |
| RF-2 | Continuous-effect fixes | done | engine #989, game #326, meta #331 | engine (+ game, meta pins) | after RF-1, before area 3 | RA-2's findings (engine #964, the RF (standardization) row), encounter-length expiry first; Şifr on Wraparound per 9.12.1a; the 9.12.1d–e dependency sort for the ice subtype layer. One release. |
| RF-1b | Timing fixes, the rest | done | engine #991, #993, game #327, #328, meta #336, #339 | engine (+ game, meta pins) | after RF-2 | First the two fix-now run bugs folded in on 2026-11-21: resolved subroutines read as broken (Mason Bellamy, Chief Slee, Mirāju; 6.5.7a) and subroutines resolving after an encounter ability ends the run (Tollbooth, Funhouse; 6.1.4). Then what #980 left (its "Found, not fixed"): Spec Work's additional cost paid after 8.6.7c (1.16.10b); no pass for optional abilities in a reaction window (Tennin Institute, The Foundry; 9.2.8e, 9.6.9a); Muresh Bodysuit and No One Home in the damage interrupt window (9.2.9f, 9.9.5a); Patron with Security Testing and run-event replacements not ordered by the Runner (9.9.11); Test Run's return mark surviving reinstall (9.6.13c, 1.12.1); Bug marked at 8.4.5c; reaction windows still outside the checkpoint (Geist, search conditionals, Bug, AMAZE); Marilyn Campaign's optional interrupt and the Corp's order for Apocalypse trashing Hostile Infrastructure and Calvin B4L3Y (trash procedure's own checkpoint, `trashHooks.ts`); 9.2.8f not modelled; 9.6.10 checked only at resolution. Also the open RF (fidelity) rows, and from the second reader Apocalypse with Hostile Infrastructure (9.6.4b) and Atman's install spend (9.6.9c). Leftovers filed by area. |
| FX-access | Access limits, Boomerang, Adrian Seis | done | engine #996, game #329, meta #342 | engine (+ game, meta pins) | after RF-1b, before PF-S3a | R&D's random access limit ignores root upgrades (7.3.5), and the Archives breach cap (7.4.6d) if it is the same fix; the run closes after Boomerang's shuffle (6.9.6d); Adrian Seis's Psi Game resolves once (9.6.4b). Added 2026-11-21: The Foundry's search may fail to find and R&D is always shuffled (8.7.2e, 8.7.3); an unrezzed Architect can be trashed (10.2.2b). The second-reader tests un-skipped, their entries removed. CR first, cr-checker, tests citing the rule, one maintenance release, pins. |
| FX-window | Stuck run after a paid interrupt | done | engine #1001, game #331, meta #350 | engine (+ game, meta pins) | after PF-S3a, before PF-S3b | Fix-now from the second reader (engine #998, #999): clear the priority frame left after a paid interrupt on a subroutine's damage (9.2.4d), so the run goes on; ask a "choose one" encounter ability once, not again after an interrupt window inside it (9.12.3d; Data Raven, Funhouse with Decoy); The Cleaners' interrupt waits for the active player (9.2.9c) if it is the same window code. Un-skip the second-reader tests and remove their entries. CR first, cr-checker, tests citing the rule, one maintenance release, pins. |
| FX-view | Pending abilities in seat views | done | engine #1004, game #333, meta #356 | engine (+ game, meta pins) | after PF-S3b, before PF-S3c | Fix-now (visibility): filter `pendingAbilities` and `pendingEffectContinuation` in each seat's view (10.2.2a); keep Subliminal Messaging's turn-begin offer from a facedown copy private to the Corp (10.2.3a); Record Reconstructor shows only faceup Archives cards, the Runner chooses, declining breaches. A test per seat; seat-view-checker on the game side. CR first, cr-checker, one maintenance release, pins. |
| FX-expose | Expose choices show no titles | done | engine #1009, game #336, meta #372 | engine (+ game, meta pins) | first after the weekly usage reset (2026-11-26), before PF-S3e | Fix-now (visibility): when the Runner chooses among facedown Corp cards (expose, Forged Activation Orders, Tinkering, the generic `expose` kind), the choice shows no titles to the Runner (10.2.2a). A test per seat; seat-view-checker. One maintenance release, pins. |
| FX-faceup | Accessed cards turn facedown again | done | engine #1010, game #337, meta #380 | engine (+ game, meta pins) | after FX-expose's engine release, before the layout plan's E0 and PF-S3e | Fix-now (visibility), found by FX-expose: an unrezzed installed card the Runner accesses stays faceup after the breach (`access_card` in `src/actions/apply.ts` sets `faceup` and never clears it), so the spectator's log and board and the Runner's own view name it for the rest of the game. Access no longer turns an installed card faceup: the Runner sees the cards it accessed for the rest of the breach through the seat-view filter, and no other seat sees them (7.1.2, 7.3.1a, 10.2.2a). Stolen, trashed, rezzed, exposed and revealed cards still turn faceup through their own steps. Chosen 2026-11-27 over resetting the face at the breach's end, which leaves the spectator's board naming the card during the breach. A test per seat; seat-view-checker on the game side. CR first, cr-checker, one maintenance release, pins. |

### Areas, in run order

Each area follows the [per-area recipe](#the-per-area-recipe-applies-to-every-area) on its row of the [Areas](#areas) table: inventory, evidence, cr-checker, shared helper, IR merge (aliases until the paired cut), tests citing CR, one maintenance release, pins. Areas 8 and 9 may run alongside 5–7, and area 16 alongside 8 and 9. A paired cut rewrites card JSON to the merged kinds, adds the areas' labels, drops the aliases, and makes a paired release of cards, engine and game, with pins.

| ID | Area | Status | PR | Repo(s) | Runs | What it does |
|---|---|---|---|---|---|---|
| 1 | Hosting and trash | done | engine #942, game #313 | engine (+ cards, game) | first | See the [Areas](#areas) table. |
| 2 | Uninstall, ice removal, run position, rearrange | done | engine #971, #972, game #321, meta #316 | engine (+ cards, game) | after area 1 | See the [Areas](#areas) table. |
| 3 | Swap | to do | | engine (+ cards, game) | after area 2, PF-S3f and the [repository layout plan](repo-layout.md) | See the [Areas](#areas) table. |
| 4 | Visibility | to do | | engine (+ cards, game) | after area 3 | See the [Areas](#areas) table. |
| Cut A | Paired cut A | to do | | cards + engine + game + meta | after area 4 | Card JSON for areas 1–4. |
| 14 | Run flow | to do | | engine (+ cards, game) | after area 4, before area 5 | See the [Areas](#areas) table. |
| 5 | Corp install | to do | | engine (+ cards, game) | after area 14 | See the [Areas](#areas) table. |
| 6 | Runner install | to do | | engine (+ cards, game) | after area 5 | See the [Areas](#areas) table. |
| 7 | Rez and derez | to do | | engine (+ cards, game) | after area 6 | See the [Areas](#areas) table. |
| 8 | Access | to do | | engine (+ cards, game) | may run alongside 5–7 | See the [Areas](#areas) table. |
| 9 | Damage and prevention | to do | | engine (+ cards, game) | may run alongside 5–7 | See the [Areas](#areas) table. |
| 16 | Game setup and end | to do | | engine (+ cards, game) | beside areas 8 and 9 | See the [Areas](#areas) table. |
| Cut B | Paired cut B | to do | | cards + engine + game + meta | after area 9 | Card JSON for areas 14, 5–9 and 16. |
| 15 | Keywords and credits | to do | | engine (+ cards, game) | after area 9 | See the [Areas](#areas) table. |
| 12 | Counters and advancement | to do | | engine (+ cards, game) | after area 15 | See the [Areas](#areas) table. |
| 13 | Search, shuffle and deck order | to do | | engine (+ cards, game) | after area 12 | See the [Areas](#areas) table. |
| 11 | Turn structure, actions, breaking, scoring, psi and traces | to do | | engine (+ cards, game) | after area 13 | See the [Areas](#areas) table. |
| 10 | Card flags and declarations | to do | | engine (+ cards, game) | last | See the [Areas](#areas) table. |
| Cut C | Paired cut C | to do | | cards + engine + game + meta | after area 10 | Card JSON for areas 15, 12, 13, 11 and 10. |

### Finish

| ID | Session | Status | PR | Repo(s) | Runs | What it does |
|---|---|---|---|---|---|---|
| Phase 6 | Phase 6 start | to do | | game | after the whole program | Check the [Phase 6 gate](#phase-6-gate), then hand over to the [product UI plan](product-ui.md) at U1. `discord-activity.md` is turned into slices, for all formats at once, after that plan is done (decided 2026-11-23). |

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
| 2026-11-19 | The second reader (1.16) runs on Fable 5.2 | A different model from the one that writes the engine sessions (Opus 5.5), with no new account |
| 2026-11-19 | Phase 6 waits for the whole program: the gate is the final state under Verification of the program itself. This replaces the earlier gate, which opened after areas 1–4, 14–16, the sweep's areas and RF while the rest continued beside Phase 6 | Nathaniel's call: no player meets the engine before the full audit is done |
| 2026-11-19 | Salem's Hospitality and Quest Completed get their own fix-now session (FX-salem), after FX-breakers and before area 2 | Salem's Hospitality shows the Corp hidden Runner card titles (CR 10.2.2a); the plan had only a note that a session was proposed, so a new coordinator could miss it |
| 2026-11-19 | Keep the plan order for areas 5–13 after the sweep | Nathaniel kept the order. The gate still waits for every area that holds a sweep finding |
| 2026-11-20 | Section owners for tool 1.13: 1.12 → area 2; 4.3 → area 4 (4.3.6 → 11); 4.6 → area 5 (4.6.2–4.6.3 → 4, 4.6.4e and 4.6.5d → 11, 4.6.8e → 14, 4.6.9 → 2); 4.8 → area 13 (4.8.5 → 2, 4.8.6–4.8.7 → 4); 8.1 → area 7 (8.1.4 → 6); 8.2 → reference (8.2.2 → fidelity); 3.6.5 → 5; 3.8.5 and 3.9.3 → 6 | The first pass named no area for these; each subrule goes to the area of the procedure it describes. The table is `tests/cr-section-owners.json` (engine #956) |
| 2026-11-20 | The seven Genesis fix-now cards fold into PF-S3 rather than a session of their own | Phase 6 waits for the whole program, so no player meets them first; one engine writer at a time, so a separate session would delay area 2 |
| 2026-11-20 | RA-1's fix-now cards (Hostile Infrastructure, Chum, Singularity, Order of Sol) go to RF, after RA-2 | RF fixes what the re-audits found in one release; Phase 6 waits for the whole program |
| 2026-11-20 | A paused reaction window's leftovers and the abilities that became pending during it are not one group: the new ones get a nested window. A finding for RF, not an open question | CR 9.2.8a settles it, though RA-1 cited 9.6.11 and found no card where the order matters |
| 2026-11-20 | FX-pump: one engine session right after area 2 builds every icebreaker's pump from its card fields (pump cost and strength), so the 34 supported breakers that cannot pump today can, and the nine that start below printed strength start right | A supported card that plays wrong in normal use; one engine change instead of 34 card fixes (CR 3.9.5) |
| 2026-11-20 | RF runs after FX-pump and before area 3, split in two: RF-1 fixes RA-1's timing findings (fidelity), RF-2 fixes RA-2's continuous-effect findings (standardization), encounter-length effects that survive a run ending first | RA-2's encounter-length bug touches nearly every run; one release per half keeps each reviewable |
| 2026-11-20 | RF-2 also replaces the fixed order in the ice subtype layer (`resolveIceSubtypeMap`, `src/state/continuousEffects.ts`) with a CR 9.12.1d–e dependency sort shared with blanking order (`orderBlankingEffects`), including the hosted-object tie-break; a loop the tie-break cannot settle falls back to collection order and is reported as a CR gap. The odd-advancement subtype swap gets a blanking check | Mother Goddess is unique (10.1.1), so no loop is reachable today; this makes the layer follow the rule for future cards. Same file and layer as RA-2's blanking findings |
| 2026-11-20 | PF-S3 is split: one fix session per two S3 sweep sessions, started as their sweeps land | About 180 wrong cards after six sweep sessions; one session at the end would be too large to review |
| 2026-11-20 | Şifr on Wraparound follows CR 9.12.1a (strength 7), not the 2017 FAQ ruling | The CR at the pin wins; the FAQ predates it |
| 2026-11-20 | Flip Switch's jack-out during a forced encounter with no run ends the encounter, as jnet does | CR 6.1.5 and 6.1.4b apply by analogy; no rule says otherwise |
| 2026-11-20 | FX-legal-moves runs after RF-1 and before RF-2: one engine session makes the legal-move list agree with the apply path and adds a check for it | The game only accepts listed moves, so Net Shield, Decoy on the Corp's turn and Asteroid Belt cannot be used at all today |
| 2026-11-21 | FX-small: one short engine session before RF-2 fixes the Formicary-class approach-step leak (area 4) and the Archives basic trash (area 8) | The engine `src/` slot was free and each fix is a few lines and a test; folding them into later areas would leave a known leak in the engine for weeks |
| 2026-11-21 | RF-1b also fixes two general fix-now run bugs first: resolved subroutines read as broken (Mason Bellamy) and subroutines resolving after an encounter ability ends the run (Tollbooth). Single-card fix-now bugs (LLDS Energy Regulator, The Future Perfect, rulings batches 3 and 4) stay under their areas | Both are shared run procedures that many ice and cards meet, and RF-1b is the next engine `src/` writer; single-card bugs are what the areas and PF-S3 fix |
| 2026-11-21 | Accept the `NO_ZONE` invariant baseline entry engine #990 added for Accelerated Beta Test's looked-at cards | It is the same zone-list gap the Federal Fundraising row and the CR 1.12.3.ex1 test already record; area 13 fixes the class and shrinks the baseline |
| 2026-11-21 | Narrow "fix-now" (`docs/how-we-work.md`, Findings): fix early only a bug that skews the audit's checks (one most games or many tests meet) or a seat-visibility leak in a build anyone plays. Before Phase 6, a single card that plays wrong goes to its area or PF-S3, however wrong. The **Fix-now** marks already in the [findings table](cr-audit-standardization-program/findings.md) stay as a reading aid; the coordinator applies the new rule when it orders work | Phase 6 waits for the whole program, so no player meets a wrong card first, and each early fix costs a release, jumps the queue and is often rewritten by its area. Fixing early still pays when a bug makes the test games, timing walk, rulings and second-reader tests record wrong results, or when the product UI work plays the game |
| 2026-11-21 | Accept the six invariant baseline entries the second reader added (engine #994, #995): R&D arrange `NO_ZONE` (two), Slipstream, Shiro's nested breach, Raman Rai's swap, and a chapter 10 `POSITION_OUT_OF_RANGE` | Each is a filed bug whose area removes its entry with the fix; the program ends with the invariant baseline empty |
| 2026-11-21 | FX-access: one engine session after RF-1b, before PF-S3a, fixes R&D's access limit counting root upgrades (area 8), Boomerang's stuck run (area 14) and Adrian Seis's endless Psi Game (fidelity) | They meet the narrowed fix-now rule: the first skews every R&D run with a root upgrade in the test games, the other two stop a game from going on |
| 2026-11-21 | FX-access also fixes two visibility leaks found by RF-1b: The Foundry's search may find nothing (CR 8.7.2e) and an unrezzed Architect can be trashed (its "Players cannot trash this ice" is active only while rezzed) | Both show the Runner hidden information, and FX-access is the engine writer now, so no separate release |
| 2026-11-21 | The Foundry shuffles R&D every time, whether or not the Corp searches | "Shuffle R&D." is its own sentence, not part of the "you may"; CR 8.7.3 leaves it open |
| 2026-11-21 | FX-window: one engine session after PF-S3a, before PF-S3b, fixes the stuck run after a paid interrupt on a subroutine's damage and the "choose one" ability asked again (Funhouse with Decoy loops), plus The Cleaners' window order if it is the same code | A game cannot go on, in a shared timing step that many games meet (the narrowed fix-now rule) |
| 2026-11-21 | Accept the eleven invariant baseline entries P1-o part 3 added (engine #998, #999, #1000) | Each is a known bug owned by an area, which removes its entry with the fix; the Phase 6 gate needs the list empty |
| 2026-11-21 | Spin Doctor follows the CR, not its ruling 2: it may be used with fewer than 2 cards in R&D | The card says "up to 2", and CR v26.03 has no rule behind the ruling (9.5.2f); the engine already does this |
| 2026-11-21 | Medical Breakthrough: only copies in the Corp's or the Runner's score area lower the requirement (4, 3, 2) | The card's long-standing play; the CR does not settle whether 9.1.8e makes copies outside a score area count |
| 2026-11-21 | FX-view: one short engine session after PF-S3b, before PF-S3c, filters pending abilities and held-over effects in each seat's view, and fixes Record Reconstructor's facedown titles | Seat-visibility leaks in the game's seat view (the narrowed fix-now rule, (2)) |
| 2026-11-21 | Subliminal Messaging's turn-begin offer from a facedown copy in Archives is private to the Corp until it reveals | Seeing that the Corp is asked tells the Runner the facedown card is there (10.2.2b, 10.2.3a) |
| 2026-11-21 | The pause while the Corp weighs a private Subliminal Messaging offer: the host always stops at that step when the open facts allow one, built in area 4 | Then the stop tells the Runner nothing; the tell is narrow until area 4, which comes soon after area 3 |
| 2026-11-21 | A facedown installed card's pending ability is left out of the Runner's view entirely (area 4) | Matches the Subliminal Messaging decision; the CR does not settle it (10.2.2a, 10.2.3a) |
| 2026-11-22 | Accept the invariant baseline entry PF-S3c's Architect fix exposed (second-reader 9.11.4e.ex1, `NO_ZONE`) | The same R&D-look bug as the accepted Accelerated Beta Test entry; area 13 removes both with the fix |
| 2026-11-22 | Disposable HQ: the Corp orders the cards it adds to the bottom of R&D (the engine already does) | "You" is the Corp, and the player carrying out an effect makes its choices (1.14.5); the CR does not say otherwise |
| 2026-11-22 | FX-expose: the expose-choice title leak is fixed first after the weekly usage reset, before PF-S3e; the second reader's next part starts beside PF-S3e | A leak to a seat meets the narrowed fix-now rule; the weekly limit was at 88% |
| 2026-11-27 | FX-faceup: the accessed-card faceup leak FX-expose found is fixed next, right after FX-expose, before the layout plan's E0 | A leak to the spectator and the log in a playable build meets the fix-now rule, and the fix is one small slice |
| 2026-11-27 | The Snare! HQ access leak (a card accessed in HQ is faceup while a choice it opens is open, and the spectator's log names it) is filed under area 4, not fixed in a fix-now slice. The layout plan's D1 starts instead | Nathaniel's choice on 2026-11-27, over the recommended FX-hq-access slice |

## Not yet decided

- **Chum's +2: for the encounter or for the run?** The card says "The next piece of ice the Runner encounters during this run gets +2 strength," with no duration on the +2. One reading: "during this run" only picks which ice, and the bonus lasts for that encounter, which the second sentence ("When that encounter ends…") also points to. The other reading (Nathaniel's): "during this run" is the only span of time printed, so under CR 9.10.1 ("only for the duration specified") the +2 lasts until the run ends. The CR gives an implicit encounter duration only to icebreaker strength (3.9.5b, 9.10.4a), and the pinned cards have no Chum ruling. The FFG-era rulings cover the old wording and don't settle it. The engine and jinteki both use the encounter. The two readings differ only when that ice's strength matters later in the same run, such as a second encounter after a rearrange. Recommended: keep the encounter and ask the Null Signal rules team; settle it before RF fixes Chum.

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
  - Phase 6 has not started before this list is true;
  - the roadmap names this program done and the plan moves to `docs/plans/done/`.

## Done

The final state under [Verification of the program itself](#verification-of-the-program-itself) is true, and Phase 6 may start at the [Phase 6 gate](#phase-6-gate). Then this plan and its folder move to `docs/plans/done/`.
