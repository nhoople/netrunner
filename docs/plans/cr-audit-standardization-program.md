# CR audit and standardization program

*Drafted 2026-11-11 from an inventory of engine `v1.147.251` (master `aec05b54`), cards `v1.147.22`, and CR `v26.03`. Current versions are in the [pin table](../../README.md). The brief named `v1.147.250` as the floor, but the pin is already `v1.147.251` (the Midori choice-key fix, engine #895).*

*Revised 2026-11-12: added the card flag inventory (1.10), the generated kind reference (1.11), two Phase 2 guards, area 10, and the Phase 6 gate.*

*Revised 2026-11-13: added the playout blockers step between Phase 2 and area 1.*

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
| Discord-native play | Area 4 (visibility) and the [Phase 6 gate](#phase-6-gate), which starts the Activity before the whole program is done |

## Inventory (engine `v1.147.251`, cards `v1.147.22`)

### Corpus and Effect IR

| Measure | Count |
|---|---|
| Cards in the catalog | 2,016 |
| Printed abilities | 4,418 (2,123 static, 873 conditional, 545 paid, 563 subroutine, 314 play) |
| Kinds in `KNOWN_PRIMITIVE_KINDS` (`src/effects/ir.ts`) | 1,540 |
| Kinds used by card JSON | 887 |
| Kinds used by exactly one card | 735 |
| Kinds no card uses but the engine builds (continuations, flag-driven effects, `fx.*` helpers) | 633 (161 of them end in `_resolve`/`_pick`/`_continue`-style suffixes) |
| Dead kinds: no card uses them and nothing builds them, but each still has a dispatch `case` | 19 |
| Engine-built kinds with a card or pack name (`dtwn_wari_name_subtype`, `win_embezzle_named`, `tdatd_amani_bounce`, `glenn_host_card`, …) | in the 215-entry `tests/effect-ir-legacy-names.json` |
| Static declaration fields | 652 distinct fields; `CardDef` has 616 optional boolean flags (`src/state/types.ts`) |

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

Order 1.1 → 1.2 → 1.3 → 1.4 → 1.5a → 1.6 → 1.7 → 1.5b → 1.8 → 1.9. 1.1 comes first because 1.3 and 1.7 need it. 1.2, 1.4, 1.5 and 1.6 don't depend on each other or on 1.1 and can run in parallel. 1.10 runs beside 1.2, which reads its map. 1.11 depends on nothing and can run at any point in Phase 1.

## Phase 1 results (2026-11-14)

Phase 1 is done. All tools are on master: engine #898–#907 (release `v1.147.252` for the `src/debug/` hook), cards #293 and #294, game #283 and #284. The baselines are in each repo's tests; this section records what they found, and what is still open. Each Phase 3 area reads its own entries in its Evidence step.

**Corrections to the inventory above**

- 3 sites cite CR 1.18 for visibility, not 8 (fixed above).
- 17 dead kinds, not 19 (`tests/baselines/kind-liveness.json`), plus 4 no-op choice builders, including `swap_two_ice`.
- 12 uncovered CR examples, not 11 (`tests/baselines/cr-examples.json`).
- Label drift: 395 paid and subroutine labels don't match the printed text. Most are paraphrases (about 40 `Pump <Title> +N strength`). Security Nexus and Unregistered S&W '35 look like real errors.

**Findings by area**

| Area | Finding | Source | CR |
|---|---|---|---|
| 1 Hosting and trash | A played current is also pushed to its discard pile while still active (`trashActiveCurrentsBeforePlay`) | jnet, invariants | 3.5.1b, 8.6.6c |
| 3 Swap | Mutation score 32% (61% of covered). Removing the hosted-card trash, the swap checkpoint's install handling, or any legality gate in `canSwapIntoPlaceOf` survives | Stryker | 8.8.4b, 8.8.2 |
| 4 Visibility | The Corp's view shows its own R&D card ids in `run.accessCandidates`, `accessingCardId` and `accessedCardIds` during an R&D access | game fuzz | 4.1.5, 10.2.2a |
| 4 Visibility | The Runner loses sight of HQ cards already accessed this breach (`stripSecrets` nulls them) | game fuzz | 7.3.1a |
| 4 Visibility | 3 CR 1.18 citations for visibility; 2 CR 1.16.1b citations for additional costs (1.16.10); 1 CR 10.1 for ignoring costs (1.16.5c, area 5) | citation topics | — |
| 8 Access | Stealing an agenda mid-breach (Bacterial Programming) stalls at `access.stealAgenda`: `finish_breach` is offered and refused. The playouts' `NO_LEGAL_ACTION` cluster | jnet, playouts | 7.4.7 |
| 8 Access | `refreshRdDeckCandidate` keys on card id, so cards the Corp rearranges in R&D (new objects) can't be accessed again | jnet | 1.12.3, 7.4.7a |
| 9 Damage | The Runner is flatlined as soon as core damage drops max hand size below 0, not at the discard step | jnet | 1.7.2b |
| 10 Card flags | Sportsmetal never triggers: `fireOnAgendaScoredOrStolen` never passes the Corp identity | jnet | 9.3.7c |
| none | After a terminal operation the Corp can still score in the 5.6.2a window | jnet | 5.4.3a, 5.6.2 |
| none | Psi bids during a run can't spend bad publicity credits | jnet | 10.6.2, 10.14.3 |

The last two have no area. Decide at Phase 2: add an area 11 (turn structure and psi), or fold them into areas 8 and 10.

**Open items**

- Tool 1.2(c), card flags whose reader builds a no-op kind, is an `it.todo`. It can now read `tests/baselines/card-flags.json`; do it in Phase 2.
- 51 of the 159 deferred jnet scenarios are unclassified (list in the engine's `docs/jnet-test-ports.md`). No `disagreement` case has turned up yet.
- The visibility fuzz rarely reaches facedown Runner installs, facedown set-aside cards, or grip reveals with the Learn to play and Startup pools. Add hand-built scenarios for those before counting the Phase 6 gate's fuzz condition as met.
- Cards #294 (Hedge Fund and PAD Campaign store `influence: 0`) is on cards master, unreleased. It ships with paired cut A.
- Mutation scores exist only for area 3. Each area measures its own in Phase 3.

## Phase 2: guardrails (S–M, test-only)

1. **Write guard** `tests/procedure-write-guard.test.ts`. A TypeScript-AST scan (the `typescript` package is already a dependency) over `src/**` for assignments and mutating calls on `.zone`, `.hostId`, `.hostedCardIds`, `server.ice`, `server.root`, `runner.installed`, `*.hand`, `*.deck`, `discardPile`, score areas, `removedFromGame`, `.rezzed`, `run.position`, and `run.attackedServerId`. It covers `=`, `+=`, `-=`, casts, `push`/`splice`/`unshift`/`shift`/`pop`, and `filter` reassignments. An allowlist names the helper modules. Baseline is `tests/baselines/direct-writes.json`, keyed by file + property + count (not line numbers) so it doesn't churn. It replaces the regex in `ice-uninstalled-during-run.test.ts`.
   - Starting baseline is roughly the table above: ~550 `zone`, ~200 host, ~100 ice/root, ~140 installed, ~120 discard, 4 position, 13 attacked-server.
2. **Kind liveness and effect guard**, replacing the mention rule in `one-off-kind-coverage.test.ts`. Every kind in `KNOWN_PRIMITIVE_KINDS` must (a) be reachable from card JSON, a card flag consumer, or a named engine builder, and (b) appear in a test that **asserts a state change** through a shared outcome helper (`expectStateDelta(before, after, {...})`). Each test registers its kind as `coversKind("x")`, so a name mention no longer counts. The baseline starts at the current non-compliant set and only shrinks.
3. **Engine-built kind names.** Extend `effect-ir-names.test.ts` to engine-built kinds as well, using the existing 215-entry legacy list as their baseline.
4. **Counts may only shrink.** `tests/baselines/format-counts.json` holds three numbers: kinds in `KNOWN_PRIMITIVE_KINDS` (1,540 at the inventory), kinds used by exactly one card (735), and `CardDef` flags (616). A change that raises one fails unless the baseline is edited with a dated reason. No target number is set now. Each Phase 3 area records the counts it leaves behind.
5. **Citation topics.** Tool 1.5b starts as a report. Once cr-checker has reviewed its baseline, a new topic mismatch fails the test instead of being recorded.

## Playout blockers (after Phase 2, before area 1)

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

The sweep's other clusters stay with their areas, and are evidence for the order below: a trashed card pushed to Archives twice (about 20 seeds) and broken hosting links on Botulus, Tranquilizer, Stowaway, Slap Vandal, and Ekomind go to area 1; an attacked remote deleted mid-run (20 seeds) and a position out of range on an unprotected HQ go to area 2; install legality mismatches (Egret, Research Station, The Red Room, Flagship, region-only upgrades, Earth Station's remote limit) go to area 5.

## Phase 3: audit and standardize by procedure

### Order and why

Risk = how often the procedure runs × how bad a wrong result is × how many paths bypass the helper. Dependencies also matter: trash and hosting sit under swap, uninstall and install.

1. **Hosting and trash.** Two confirmed bugs (OCA, the stale `hostedCardIds`). No hosting helper, two representations, 21 trash copies plus ~90 inline sites. Every later area calls these.
2. **Uninstall, ice removal and run position (8.5.10, ch. 6, 8.3 rearrange).** No uninstall helper; `onUninstall` never fires outside trash; position drift touches every run; Mandatory Seed orphan ice. Needs area 1's hosted release.
3. **Swap (8.8).** Finish what #893/#894 started: 13 kinds outside the helpers, plus Tāo. Needs the uninstall helper from area 2.
4. **Visibility (1.21, 10.2).** Moved up because Phase 6, the Discord Activity, puts hidden information in front of real opponents. Wrong citations and raw state clones.
5. **Corp install (8.5).** 42 bypasses; every ice bypass can desync the position (made safe by area 2).
6. **Runner install (8.5).** 30 bypasses plus 8 semi-shared helpers; MU limit and hook gaps.
7. **Rez and derez (8.2 rez / derez rules).** 21 rez sites without hooks; no derez helper.
8. **Access (ch. 7).** 3 bypasses. Small, but Detente is visibly wrong.
9. **Damage.** No bypass found. Confirm with tools and mutation testing, then close.
10. **Card flags and declarations.** Last, because areas 1–9 each move the flags that hide their own procedure. What is left is the flags that describe a card, and this area sorts them.

Add an area when Phase 1 shows another procedure copied often. Candidates from the inventory: counters and advancement (`counterPrimitives`), and shuffling (Code Siphon uses inline `random()`).

### The per-area recipe (applies to every area)

1. **Inventory.** Start from the table above. Re-run the explorer query at the current master and list every path (file, kind, cards using it via `use.json`-style walk plus flag consumers).
2. **Evidence.** Collect this area's entries from each Phase 1 baseline: invariant failures, playout seeds, citations, missing CR examples, missing labels, jnet disagreements. Run Stryker on the area's helpers and record surviving mutants.
3. **CR check.** Run cr-checker on the area's helper and on each bypass family, with the card titles. Read each affected card's `printed/<id>.json` at `v1.147.22`. A printed override (CR 1.2.1) is kept as a field on the shared helper, not as a copy.
4. **Standardize.** One exported helper per procedure, in `src/state/procedures/<procedure>.ts`. Each bypass becomes a call to it. Card-specific behaviour becomes options (cost mode, destination, face, rez-after, chooser). The guard allowlist gains only that module.
5. **Effect IR.** Merge card-specific kinds that differ only in fields into a general kind (verb then object; amounts, zones, sides, filters as camelCase fields), following CLAUDE.md. Old kinds stay as engine-side aliases until the paired cards release rewrites the JSON, then they're deleted. Add missing labels to the area's conditional and play abilities in the same cards release. A card flag whose reader builds one of this area's kinds moves in this area too: it becomes a field on the general kind or a declared ability, and leaves the flag baseline (1.10).
6. **Tests.** For each fixed path: a test that fails on the old code, cites the CR rule, and asserts state through `expectStateDelta`; the area's CR examples from 1.6; the invariant baseline entries for the area removed; the mutation score recorded, aiming at no surviving mutants in the helper's CR-cited branches.
7. **Delivery.** One engine PR and one engine maintenance release per area (routing only, no card JSON change). Bump the game pin and the meta pin table in the same pass. Card JSON changes (kind merges, labels) are batched into **two paired cards+engine releases**: one after areas 1–4, one after 5–10. Each is an explicit manual paired cut under `docs/git-hygiene.md`, so pins don't churn. Run cr-checker on the diff before each engine commit.

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
| 9 | Damage | `dealDamage`/`resolveDamage` | — | damage rules in ch. 10 | Confirm only: mutation score, CR examples, close | Test-only unless a fix is found |
| 10 | Card flags and declarations | The flags left in `tests/baselines/card-flags.json` after areas 1–9 have moved the ones that hide a procedure | Full list from the 1.10 baseline at that point | 9.3 ability records; 9.12 for continuous declarations; the rule each flag's reader cites | Each flag family becomes one of three things: a declared static ability (the S6 `continuousSubtypeGrants` pattern), a field on an existing kind, or a printed characteristic that stays (cost, strength, link). No new flag for a one-off | Engine maintenance; card JSON in paired cut B |

Area 10 exits when no flag's reader builds an effect kind, and the flag baseline holds only printed characteristics and declarations.

### Phase 6 gate

*Added 2026-11-12.* Phase 6, the Discord Activity ([`discord-activity.md`](discord-activity.md)), does not wait for the whole program. It starts when all of these are true:

- Phase 1 and Phase 2 are done, and so are the [playout blockers](#playout-blockers-after-phase-2-before-area-1).
- Areas 1–4 are done and paired cut A has shipped. Area 4 is the one that puts hidden information in front of real opponents.
- The seeded playouts (1.3) and the visibility fuzz (1.7) run clean on the Learn to play lists and on the Startup card pool.

The first Activity matches offer Learn to play and Startup only. Core Sets, Standard, and Eternal open once the playouts and the fuzz run clean on that format's pool. Areas 5–10 continue beside Phase 6, one writer per repo at a time.

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
| PB playout blockers | engine (+ game, meta pins) | after P2, before P3-1 | Fix clusters B1 and B2 from the [playout blockers](#playout-blockers-after-phase-2-before-area-1) table: CR first, cr-checker on the diff, tests that cite the rule, seeds fixture entries removed, one maintenance release, pins. |
| P3-1 … P3-10 | engine (+ cards, game) | areas 8 and 9 may run alongside 5–7; area 10 goes last; the rest go in order | The per-area recipe on the area's row: inventory, evidence, cr-checker, shared helper, IR merge (aliases until the paired cut), tests citing CR, one maintenance release, pins. |
| Paired cut A / B | cards + engine + game + meta | after P3-4 / after P3-10 | Rewrite card JSON to the merged kinds, add the areas' labels, drop the aliases, paired release, pins. |
| Phase 6 start | game | after paired cut A, beside P3-5 … P3-10 | Check the [Phase 6 gate](#phase-6-gate), then turn `discord-activity.md` into tasks for Learn to play and Startup. |

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
  - Phase 6 began at the gate, not after the last area;
  - the roadmap names this program done and the plan moves to `docs/plans/done/`.
