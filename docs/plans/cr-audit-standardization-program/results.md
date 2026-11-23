# CR audit results

What each finished phase, sweep and area of the [CR audit](../cr-audit-standardization-program.md) found and changed, moved here from the plan on 2026-11-22. The plan keeps what is still to do; each slice's PR has the full detail.

## Phase 1 results (2026-11-14)

Phase 1 is done. All tools are on master: engine #898–#907 (release `v1.147.252` for the `src/debug/` hook), cards #293 and #294, game #283 and #284. The baselines are in each repo's tests; this section records what they found, and what is still open. Each Phase 3 area reads its own entries in its Evidence step.

**Corrections to the inventory above**

- 3 sites cite CR 1.18 for visibility, not 8 (fixed above).
- 17 dead kinds, not 19 (`tests/baselines/kind-liveness.json`), plus 4 no-op choice builders, including `swap_two_ice`.
- 12 uncovered CR examples, not 11 (`tests/baselines/cr-examples.json`).
- Label drift: 395 paid and subroutine labels don't match the printed text. A triage on 2026-11-14 rebuilt the list (393 by its criterion, all paid abilities) and sorted it: 371 paraphrases (abbreviations, shortened "use only" notes, reworded counter costs, 42 `Pump <Title> +N strength`), 12 wrong labels on a correct model (the area 11 rows below), and 9 wrong models. Four are serious enough to fix now, one engine session each, outside the areas: Security Nexus (auto-resolved trace, usable outside an encounter), N-Pot and Hákarl 1.0 together (the Runner can't use the break), False Lead (trashed, not forfeited), and Vladisibirsk City Grid (a click in the cost). The other four are area 11 rows below: Labyrinthine Servers, Corporate Troubleshooter, Panic Button and Mamba. Unregistered S&W '35 is fixed (engine #918, cards #297).
- Two kinds carry a pack prefix, against the naming rule: `cotc_no_one_home` and `win_gebrselassie_host`.


**Triage rule (2026-11-14).** Moved on 2026-11-19 to [how we work, Findings](../../how-we-work.md#findings), which applies it to every plan. Rules findings that are not fixed right away are filed in this table. A fix-now engine session still runs alone, since there is one engine writer at a time.

**Open items**

- ~~Tool 1.2(c), card flags whose reader builds a no-op kind, is an `it.todo`.~~ Done in Phase 2 (engine #928).
- 51 of the 159 deferred jnet scenarios are unclassified (list in the engine's `docs/jnet-test-ports.md`). No `disagreement` case has turned up yet.
- ~~The visibility fuzz rarely reaches facedown Runner installs, facedown set-aside cards, or grip reveals.~~ Done in game #297: eight hand-built scenarios (`src/visibility-scenarios.test.ts`). Their fix-now findings go to one engine session under the triage rule: Read-Write Share's and Bookmark's [trash] send the facedown hosted cards to the heap faceup instead of shuffling them into the stack (a leak to the Corp and spectator, CR 4.1.5, 10.2.2a), `basic_remove_tag` is never offered to the Runner (`actorFor` returns `system`, CR 5.2.7g), Touch-ups lets the Runner pick and stops after one card, Invasion of Privacy's trash options are unusable and leave the grip faceup, and Apex's turn-begin trigger fires again after every resolution. All five fixed in engine #929 (release `v1.147.258`, 2026-11-15) and game #298, which also stops hiding a revealed card's id from the Corp. Their follow-ups are in the findings table (Touch-ups, `corp.turnBegins`, the oracle's reveal record).
- Cards #294 (Hedge Fund and PAD Campaign store `influence: 0`) shipped in cards `v1.147.23` on 2026-11-14, ahead of paired cut A, with the verification table follow-ups (engine `v1.147.255`).
- Mutation scores exist only for area 3. Each area measures its own in Phase 3.

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

## Playout blockers results (2026-11-15)

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

## S1 results (2026-11-19)

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

## S2 results (2026-11-19)

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
- **Fix-now finding:** Salem's Hospitality names from every card in the game, so the Corp sees the Runner's grip and stack titles; Quest Completed's access kind needs a run and blocks stealing. Both are supported Eternal cards. Not fixed yet: the [FX-salem](../cr-audit-standardization-program.md#slices) session row holds it, and it runs before area 2.

## S3 results (2026-11-20)

| Session | Cycle | Cards | Match | Wrong | Filed |
|---|---|---|---|---|---|
| S3a (#959) | Core Set | 111 | 92 | 8 | 11 |
| S3b (#958) | Genesis | 119 | 100 | 14 | 5 |
| S3c (#967) | Creation and Control, Honor and Profit | 107 | 53 | 36 | 18 |
| S3d (#963) | Spin | 100 | 65 | 29 | 6 |
| S3e (#968) | Lunar | 120 | 85 | 33 | 2 |
| S3f (#970) | Order and Chaos, Data and Destiny | 110 | 57 | 40 | 13 |
| S3h (#974) | Mumbad | 114 | 77 | 26 | 11 |
| S3i (#973) | Flashpoint | 100 | 62 | 20 | 18 |
| S3g (#975) | SanSan | 120 | 89 | 13 | 18 |
| S3j (#978) | Red Sand | 120 | 60 | 40 | 20 |
| S3k (#977) | Kitara | 120 | 80 | 28 | 12 |
| S3l (#982) | Reign and Reverie, Magnum Opus | 66 | 33 | 9 | 24 |
| S3m (#981) | Terminal Directive, Revised Core, Stalwart, Twenty-Three Seconds and the rest | 96 | 62 | 25 | 9 |

- **Wrong, for PF-S3.** S3a: Accelerated Beta Test, Adonis Campaign, Corporate Troubleshooter, Data Raven, Net Shield, Parasite, Rabbit Hole, Sacrificial Construct. S3b: Compromised Employee, Dinosaurus, Cortez Chip, The Helpful AI, Doppelgänger, Midori, Snitch, Edge of World, Eve Campaign, Private Contracts, Faerie, Muresh Bodysuit, Retrieval Run, Test Run. *PF-S3a (engine #997, cards #308, `v1.147.280`, cards `v1.147.26`): 15 fixed (Adonis Campaign, Corporate Troubleshooter, Data Raven, Sacrificial Construct, Burke Bugs, Compromised Employee, Cortez Chip, Dinosaurus, Doppelgänger, Edge of World, Eve Campaign, Faerie, Midori, Private Contracts, The Helpful AI); 8 moved to their areas, 5 of them with their own part fixed (Accelerated Beta Test 5/13, Net Shield 9, Parasite 6, Rabbit Hole 6/13, Muresh Bodysuit 9, Retrieval Run 6/14, Snitch 14, Test Run 6); none left for cut A.*
- **Filed.** S3a: area 4 Infiltration, Lemuria Codecracker, Forged Activation Orders, Tinkering; area 5 Shipment from MirrorMorph; area 6 The Personal Touch; area 10 Red Herrings; area 11 Snare!, Matrix Analyzer; area 15 Cyberfeeder, The Toolbox. S3b: area 1 Burke Bugs; area 4 Fetal AI; area 7 Chimera; area 14 Jinteki: Replicating Perfection; area 15 Spinal Modem.
- **Fix-now candidates go to PF-S3 or their area.** Decided 2026-11-20 for the seven Genesis cards (Burke Bugs, Edge of World, Faerie, Compromised Employee, Dinosaurus, Retrieval Run, Test Run): fold them into PF-S3. Phase 6 waits for the whole program, so no player meets them first, and a session of their own would hold up area 2. The coordinator applied the same rule to S3a's: Adonis Campaign and Corporate Troubleshooter go to PF-S3, and the facedown-title leak to area 4, which owns it.
- **S3c–S3f.** Each PR's body lists every card; `printed-sweep.json` holds the record. Wrong so far in S3: 180 cards, about a third of those read, against a fifth in S2. Cross-cutting findings:
  - **34 supported icebreakers cannot pump** (Alias, Breach, Cyber-Cypher, Dagger, Gingerbread, Passport, Eater, GS Sherman M3, GS Shrike M2, GS Striker M1, and 24 in later cycles). Their pump cost and strength sit in card fields the engine never reads; only a separate pump ability raises strength. Nine programs also start below their printed strength. One engine change that builds the pump from those fields may replace 34 card fixes (S3c, S3f). See Not yet decided.
  - **Facedown installed Runner cards keep their abilities** (Apocalypse, Apex, Harbinger; RA-2 found the same path), CR 8.1.4a. Area 6.
  - **Many cards set a value nothing reads** (S3f: The Board, Checkpoint, Satellite Grid, Improved Tracers, Security Chip, Jak Sinclair, Qianju PT, Hivemind, Prey, Rebranding Team, Dedicated Technician Team). The 1.2 liveness check does not catch a field that is written but never read.
  - **Visibility (area 4):** GlobalSec Security Clearance shows the Corp the top of R&D instead of letting it look; Glenn Station's log names a facedown hosted card in the Runner's view.
  - **Game gets stuck:** Paintbrush (no legal Runner action after it), Vovô Ozetti and Konjin and Caprice Nisei loops (P1-l).
- **PF-S3 is now about 180 cards** and will grow with S3g–S3m. See Not yet decided.
- **S3i** sends Top Hat, Psychokinesis, Credit Crash, Mind Game and Anson Rose to PF-S3 as fix-now cards, and four log lines that name hidden cards to area 4.

## Area 1 results (2026-11-19)

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

## Area 2 results (2026-11-20)

Done in engine #971 (release `v1.147.270`) and #972 (release `v1.147.271`), game #321 and meta #316.

- **Helpers.** `src/state/procedures/uninstall.ts`: `uninstallCard(state, id, destination)` (hand, deck top/bottom/shuffle, removed from game, score area), `removeCardFromGame` (CR 4.9.2), `ceaseVacantPositions` (10.3.1i, moved out of checkpoints.ts). `src/state/procedures/rearrange.ts`: `rearrangeIce` (8.3.1, 8.3.2 swaps, 8.3.2a; Runner follows encountered ice 6.2.7d, else keeps position 6.2.7b/e) and `moveIce` (6.2.2a/b, 6.2.7a, 6.2.7d). `src/state/runPosition.ts` gains `moveRunnerToOutermost` (6.2.8b), `moveRunnerToIce` (6.2.8a), `runnerCanMoveToPosition` (6.2.8c), `setAttackedServer`, `notePositionsCeased`, `followEncounteredIce`. `removeCardFromCurrentZone` records `turn.hostsUninstalled` so 10.3.1g trashes cards hosted on a host that went installed → score area.
- **Routed.** ~35 uninstall sites, the three rearrange kinds (now one `rearrange_ice`), the ice moves (Bullfrog, Sand Storm, Tributary, Formicary, Builder), every redirect (Mind Game, Susanoo, AgInfusion, Proprionegation, Cell Portal, Letheia, Mirāju, Baker, Copycat, Slipstream, Maintenance Access, Omar, nested/queued breaches). Four trash sites no longer pre-remove the card.
- **Write guard.** `position` 4 → 0 and `attackedServerId` 18 → 0 outside runPosition.ts; `ice` 47 → 31 (rest are installs, area 5, and swaps, area 3); `installed` 67 → 49; `removedFromGame` 53 → 23; `root` 44 → 39.
- **Baselines.** Invariant entries with area 2 codes 88 → 35 (all 35 left are hand-built test states in 13 test files). Playout seeds 11 → 10 (core seed 14). Area 2 uncited subrules (1.17) 39 → 23.
- **IR.** `rearrange_ice` replaces `rearrange_server_ice`, `escher_rearrange_pick_server`, `escher_rearrange_server_ice` and the two MSR continuations (all engine-built; no card JSON change). Kinds 1,532 → 1,528. `set_skip_breach` is now live (left the dead list). Nothing for paired cut A.
- **Mutation score** (three helpers): 85.40% at first draft, 93.43% at close. No survivor changes a CR-cited outcome (`docs/mutation-scores.md`).
- **CR examples.** None of the 12 uncovered examples is area 2's.
- **Hand check** (game #321): run through Jua bouncing Muertos Gang Member; on v1.147.271 the Corp is asked and rezzes Ice Wall free; invariants clean. On v1.147.270 the panel showed the uninstall ability CANCELLED, which led to #972 (CR 9.1.8g).
- **Behavior changes.** MSR keeps per-server ice counts (cr-checker confirmed CR 8.3.2); Mind Game no position instead of −1; Susanoo now moves position; AgInfusion outermost not innermost; Baker/Maintenance Access approach the server not its ice; rearrange labels/log hide unrezzed ice titles; uninstalled cards lose counters (1.17.5, 1.13.13).
- **Process.** #971 named a Muertos Gang Member test that only checked a log line; the hand check caught the bug, fixed in #972 (CR 9.1.8g). A proof test that fails on the old code should assert state, not a log line.
