---
name: Stack tracking assessment
overview: "North star = full CR fidelity (2026-10-29). Phases 1–4 complete through v1.147.219 (records-only, predicates, 10.3.1a note/mark, general 9.9.9). Next: Eternal 9.12 when intentional."
todos:
  - id: assess-done
    content: "Original assessment: windows/IR aligned; pending-conditional machine incomplete"
    status: completed
  - id: other-tracking
    content: Documented Tier 1–3 beneficial tracking beyond pending bag
    status: completed
  - id: optional-pending-bag
    content: "Shipped PendingAbilityInstance + fireStoredConditionals / fireCardConditional path (v1.147.46–68)"
    status: completed
  - id: effect-conditional-migration
    content: "Migrate card-field Effect conditionals onto pending bag (lifecycle, run-timing, off-graph, leftovers through v1.147.68)"
    status: completed
  - id: next-flag-to-effect
    content: "Flag→pending via inline_conditional through v1.147.74 (incl. on-advance); leftover bare evalEffect are costs / IR bodies / already-pending resolution"
    status: completed
  - id: next-checkpoint-diff-general
    content: "Checkpoint-diff markConditionalAbilities campaign complete (v1.147.75–79): BtL, root 10.3.1j, Blackguard, swap, draw set-aside"
    status: completed
  - id: next-lingering-continuous
    content: "9.12 blanking + strength campaign through v1.147.132 (unify/order/Şifr + Standard-scoped per-site abilitiesSuppressed)"
    status: completed
  - id: next-912-compiler
    content: "Full 9.12 CR→AST continuous compiler — not required for Standard (roadmap/README); Eternal gained-subtype chains only (Mother Goddess / Egret / Warden Fatuma)"
    status: cancelled
  - id: next-thin-blanking
    content: "Finish remaining thin ungated continuous/trigger read sites — see thin-blanking-punch-list.md"
    status: completed
  - id: next-inactive-blank-parity
    content: "Pending inactive/blank cancel parity — blank/Magnet/Chum/Amaze (v1.147.143); checkpoint/Bug/Hostile + identity zone + 9.1.8g independents (v1.147.144)"
    status: completed
  - id: next-hook-had-triage
    content: "Hook→checkpoint triage: Sebastião 'had no tags' (CR 9.6.6a) onto tag diff; remaining ~160 hook fires were intentional under Standard-good-enough"
    status: completed
  - id: full-cr-records-only
    content: "Full CR phase 1: resolve only CR 9.3 ability records at runtime; cut dual-path leftover hook fields"
    status: completed
  - id: full-cr-trigger-predicates
    content: "Full CR phase 2: declarative conditional triggers as predicates over checkpoint facts/diff (not hook names)"
    status: completed
  - id: full-cr-universal-scanner
    content: "Full CR phase 3: universal 10.3.1a markConditionalAbilities / note→checkpoint→mark; fireStoredConditionals removed (v1.147.216)"
    status: completed
  - id: next-replacement-layer
    content: "Full CR phase 4: broader replacement-effect layer beyond Gebrselassie (9.9.9); done at v1.147.219 (#840)"
    status: completed
  - id: next-912-compiler-eternal
    content: "Full CR phase 5 (Eternal only when intentional): 9.12 gained-subtype→further-grant chains"
    status: completed
isProject: false
---

# Cards / engine / Effect IR vs CR “stack”

**Status (reviewed 2026-11-11):** fidelity phases 1–5 are done. Phase 5 shipped as engine standardization S1 (`engine-standardization-program.md`); `tests/continuous-subtype-layer.test.ts` covers Mother Goddess gaining Egret-granted subtypes. Mentions of phase 5 as pending below are historical. Current floor is engine `v1.147.248`, cards `v1.147.22`.

**Floor (maintenance, not a set-complete pair):** engine [`v1.147.221`](https://github.com/nhoople/netrunner-engine/releases/tag/v1.147.221), cards `v1.147.13`, CR `v26.03`.

**Last revised:** 2026-11-01 — fidelity phases **1–4 complete** at `v1.147.221` (phase-3 leftovers closed). Program: [`full-cr-fidelity-program.md`](full-cr-fidelity-program.md). Thin blanking list complete: [`thin-blanking-punch-list.md`](thin-blanking-punch-list.md). Still **not** a `nodes.json` / prose compiler.

## Short verdict

**Core windows / pending bag / 9.12 blanking / checkpoints / 10.3.1a mark path are solid** through `v1.147.216`: priority/interrupt nesting, Effect IR continuations, declarative trigger predicates, note→checkpoint→mark and predicate marks at **10.3.1a**, play mark at **8.6.7e** / resolve at **8.6.7f**, **10.3.2** newly-marked scoop, Hush×Magnet + per-site `abilitiesSuppressed`. `fireStoredConditionals` deleted.

**North star (2026-10-29):** full **executable** CR fidelity for the corpus — not “Standard-good-enough.” Still not Magic-style stack (**4.2.8a** deck). Still not compiling CR prose. Card text wins (**1.2.1**). Phase-3 leftovers closed at `v1.147.221`.

### 9.12 continuous (Standard today / Eternal later)

Blanking order (**9.12.1d / 9.12.1e**) + Chromatophores / Hush / printed bioroid covers **Standard**. Gained-subtype → further-grant (Mother Goddess / Egret / Fatuma) is **full CR phase 5**, only when Eternal is intentional — not a Standard blocker and not a prose compiler.

**Open under the fidelity program** (see plan; do not reorder):

1. Records-only runtime — **done**.
2. Declarative trigger predicates — **done**.
3. Universal `markConditionalAbilities` / note→checkpoint→mark — **done** (`v1.147.216`).
4. Replacement layer (**9.9.9**) beyond Gebrselassie — **done** (`v1.147.219`).
5. Eternal **9.12** subtype chains when intentional.

**Near-term:** fidelity phase 5 only when Eternal is intentional. Product Phase 5 table work continues in parallel.

```mermaid
flowchart TD
  cardJSON["Card JSON abilities CR 9.3"] --> applyRec["applyAbilityRecords"]
  applyRec --> hooks["hooks / paidAbilities / onPlay / subs"]
  hooks --> graph["Timing graph + PAWs"]
  hooks --> note["note* / TriggerPredicate facts"]
  note --> cp["occurCheckpoint 10.3"]
  cp --> snap["checkpoint snapshot / diff"]
  cp --> mark["markConditionalAbilities 10.3.1a"]
  mark --> bag["PendingAbilityInstance"]
  bag --> react["Reaction window 10.3.2 / 9.2.8"]
  react --> evalIR["evalEffect IR"]
  graph --> evalIR
  evalIR -->|"opens interrupt / choice"| pending["pendingDamage / Tags / ..."]
  evalIR -->|"seq pauses"| cont["pendingEffectContinuation"]
  pending --> resume["resume continuation"]
  cont --> resume
```

## Who owns what

| Layer | Owns | Does not own |
|-------|------|----------------|
| [netrunner-cards-data](https://github.com/nhoople/netrunner-cards-data) | CR **9.3** ability records + Effect IR bodies | When/order of resolution |
| [netrunner-engine](https://github.com/nhoople/netrunner-engine) `src/effects/ir.ts` + `eval.ts` | Instruction AST, pause/resume, primitives | CR prose compilation |
| Engine timing / legality / `storedTriggers` / `*Hooks` | Priority stack, checkpoints, interrupt slots, PAWs, **pending conditional bag** | Card prose → Effect compilation |
| CR pin `v26.03` | Citations + timing IDs | Executable behavior |

Cards declare *what*; the engine owns *when*. That split matches the roadmap and **CR 1.2.1**.

## What is tracked correctly (aligned with CR)

- **Ability classes / flags** — `AbilityRecord` → static / paid / conditional / play / subroutine (**9.3.7**, **9.3.6**).
- **Priority / PAW nesting** — `priorityStack`, pass loop, nest after paid ability (**9.2.4**, **9.2.4d**).
- **Instruction nesting** — `PendingEffectContinuation` pause when an interrupt opens mid-`seq` (**9.1.2a**).
- **Interrupt windows** — single-slot pendings (`pendingDamage`, `pendingTags`, `pendingEndTheRun`, …) with paid interrupts (**9.9**, **9.2.9**); damage/tags carry **expectedEffects** (**9.9.2**).
- **Checkpoints** — frames for costs / draw / play / instruction (**9.11.1**, **10.3**); `previousCheckpointSnapshot` + diff helpers (**10.3.1a**).
- **Pending ability instances** — `PendingAbilityInstance` with lifecycle statuses, `independentOfSource`, reaction frames that own a fixed instance set (**9.6.2**, **9.2.8a**).
- **Effect-bearing conditionals** — migrated onto pending bag (`v1.147.46`–`v1.147.68`); production mark path is note/predicate → **10.3.1a** (`v1.147.216` removed `fireStoredConditionals`).
- **Flag / boolean conditionals** — `inline_conditional` path (`v1.147.69`–`v1.147.74`); production mid-graph `fireInlineConditional` retired and removed (`v1.147.221`).
- **Checkpoint-diff / predicate marks at 10.3.1a** — Built to Last (**9.6.6a**) through phase-3 families; play marks at **8.6.7e** / resolves at **8.6.7f**.
- **Simultaneous multi-card trash / set multiplicity** — grip/stack batches (**10.4.3**); Hostile Infrastructure vs Warroid.
- **Lingering registry scaffold** — `LingeringEffect` + expire at **10.3.1b**.
- **Source tracking for IR** — `EffectCtx.sourceId` + continuation / pending slots.
- **Continuous blanking (9.12.1d)** — `resolveBlankedCardIds` + per-site `abilitiesSuppressed` gates across strength, costs, numerics, taxes, access, and thin leftovers through `v1.147.132`.

## Remaining gaps (full CR fidelity program)

1. ~~**Dual-path ability surface**~~ — **phase 1 done**.
2. ~~**Hook-named triggers**~~ — **phase 2 done**.
3. ~~**Hook-timed marks**~~ — **phase 3 done** (`v1.147.216`); leftovers closed (`v1.147.221`).
4. **Replacement beyond Gebrselassie** — **phase 4** (**9.9.9**) — **done** (`v1.147.219`).
5. **Eternal 9.12 gained-subtype chains** — **phase 5**, only when Eternal is intentional.
6. **Bespoke pending payloads** — Bug / Geist / Chum / Amaze context; keep until turn/window state absorbs them.

## Practical answer to “are we properly tracking?”

| Concern | Status |
|---------|--------|
| Card abilities declared per CR 9.3 | Yes |
| Engine owns windows / resolution order | Yes |
| Interrupt + IR continuation nesting | Yes (tested) |
| Priority PAW pass / nest | Yes |
| Checkpoint scaffolding + snapshot/diff helpers | Yes |
| Effect-bearing conditionals + reaction windows | **Yes** (`v1.147.46`–`68`) |
| Flag/boolean conditionals as pending | **Yes** (`v1.147.69`–`74`) |
| Checkpoint-diff / predicate / note marks at 10.3.1a | **Yes** through `v1.147.216` (play **8.6.7e**/**8.6.7f**; `fireStoredConditionals` removed) |
| Interrupt expected-effects | **Yes** for damage/tags/ETR/trash/expose/break (`v1.147.81`); other bespoke slots stay custom |
| Lingering registry (9.10.1) | **Core durations covered** — mark / subtypes / MU / turn+run+encounter+checkpoint strength / Corp-turn blanks (`v1.147.82`–`88`); Gebrselassie host-duration is a **9.9.9a** replacement tracker, not a lingering |
| Inactive pending cancel (9.6.10) | **Core leave-play covered** — Runner+Corp trash + blanked resolve (`v1.147.89`–`91`); turn-begin leftovers cancel via bag (`v1.147.100`) |
| Turn-begin simultaneous pending (9.6.5d) | **Yes** — rig turn-begin marks together; resume bag leftovers after interrupts (`v1.147.100`); nested scoop gated by 10.3.2 (`v1.147.99`) |
| Continuous blanking (9.12.1d/e) for Standard | **Yes (sufficient)** — Hush×Magnet solver + broad per-site `abilitiesSuppressed` through `v1.147.132`; thin ungated leftovers remain |
| Full 9.12 CR→AST compiler | **Not required for Standard** — Eternal subtype chains only (roadmap/README) |
| Continuous rez/trash costs (9.12.1d) | **Yes** — Xanadu / Cat's Cradle / Vovô / Braintrust / Demolisher-class (`v1.147.103`) |
| Continuous hand/MU/clicks/install (9.12.1d) | **Yes** — Public Sympathy / Mem Chip / Akshara / TechnoCo-class (`v1.147.104`) |
| Continuous link / Corp install / Runner install discounts (9.12.1d) | **Yes** — Dyson / Network Exchange / Diwan / Eden / DZMZ-class (`v1.147.105`) |
| Continuous run-tax / advancement / Corp hand size (9.12.1d) | **Yes** — Ruhr / Cold Site / SanSan / The Source / Lewi-class (`v1.147.106`) |
| Continuous steal / play costs (9.12.1d) | **Yes** — Red Herrings / Predictive Algorithm / The Source steal tax / Ghosttongue / Rolling Brownout (`v1.147.107`) |
| Continuous draw / trace / access / MU-cost (9.12.1d) | **Yes** — Laguna / Rutherford / Flagship / self MU abilities / `rezzedWith` (`v1.147.108`) |
| Continuous bonus access / breach credits (9.12.1d) | **Yes** — HQ/R&D Interface / Manuel / Docklands / Gauntlet / Mwanza (+ Corp root read) (`v1.147.109`) |
| Continuous static locks / taxes (9.12.1d) | **Yes** — Midway break tax / Navi Mumbai / Wireless Net Pavilion / Blacklist / The Black File (`v1.147.110`) |
| Ice break locks / scored continuous / pavilion-trace (9.12.1d) | **Yes** — Turing/Hortum/Semak / The Cleaners / Net Quarantine / Genetics Pavilion / Power Tap (`v1.147.111`) |
| Recurring refill / server locks / grip reveal / Kessleroid (9.12.1d) | **Yes** — Cyberfeeder refill / Satellite Grid / Off the Grid / Harishchandra / Kessleroid / Hivemind (`v1.147.112`) |
| Underway / Guard / Tour Guide / SYNC remove-tag (9.12.1d) | **Yes** — bypass/expose locks, ETR-per-asset, remove-tag surcharge (`v1.147.113`) |
| Damage / jack-out / DBS / Franchise City (9.12.1d) | **Yes** — Chronos / Ribs / Defective Brainchips / Ancestral Imager / Au Revoir / Reflection / Stick and Poke / DBS / Franchise City / current-event locks (`v1.147.114`) |
| Clot / Interdiction / create-server / access (9.12.1d) | **Yes** — Clot / Interdiction / Hernando / Watchdog / Hijacked Router / Turtlebacks / Heliamphora / NAT (`v1.147.115`) |
| Patchwork / mid-access helpers (9.12.1d) | **Yes** — Patchwork / Corporate Defector / Carnivore / Imp / Salsette / Class Act / Cupellation (`v1.147.116`) |
| Ice strength (9.12.1a) | **Unified** — `iceStrength` → `effectiveIceStrength` (`v1.147.92`) |
| Breaker strength (9.12.1a) | **Unified** — `breakerStrength` → `effectiveBreakerStrength` after host-duration sync (`v1.147.93`) |
| Strength set layer (9.12.1a) | **Ice ordered** — set (Wraparound / Şifr) → increases (Sandburg) → decreases (Ice Carver) (`v1.147.94` / `v1.147.101`) |
| Breaker strength order (9.12.1a) | **Yes** — increases then decreases (Cradle / Stegodon); no breaker set in corpus (`v1.147.102`) |
| Blanked static strength (9.12.1d) | **Ice-own + external sources** — Wraparound/Ice Wall-class (`v1.147.95`) |
| Şifr hand-size recompute | **Yes** — penalty in `computeRunnerMaxHandSize` until Runner turn begin (`v1.147.96`) |
| Blanked breaker static strength (9.12.1d) | **Yes** — breaker-own + aura/host grants (`v1.147.98`) |
| Newly-marked checkpoint scoop (10.3.2) | **Yes** — reaction window opens only for ids marked at this checkpoint (`v1.147.99`) |

So: **yes for today’s playable Standard core** (blanking + windows/IR/pending/10.3/lingering + **10.3.1a** mark path + general **9.9.9**). Fidelity phases **1–4 done** at `v1.147.219`. Near-term: Eternal **9.12** only when intentional. Do **not** open a prose/`nodes.json` compiler.

## Flag campaign releases

| Tag | Scope |
|-----|--------|
| `v1.147.69` | Score/steal flags (#444) |
| `v1.147.70` | FC / BoN / Caïssa / Ashes / Mu (#446) |
| `v1.147.71` | Top Hat / Analog Dreamers / Puppet Master / DNN (#448) |
| `v1.147.72` | Encounter / run may flags (#450) |
| `v1.147.73` | Mandatory flag conditionals (#452) |
| `v1.147.74` | On-advance flag hooks (#454) |

## Checkpoint-diff releases

| Tag | Scope |
|-----|--------|
| `v1.147.75` | Built to Last from advancement diff (#456) |
| `v1.147.76` | Breached-root entries from zone diff (#458) |
| `v1.147.77` | Blackguard from exposure-count diff (#460) |
| `v1.147.78` | Swap first-remote-install from zone diff (#462) |
| `v1.147.79` | On-draw from draw set-aside zone diff (#464) |
| `v1.147.80` | Clear runner set-aside on draw-to-grip (#466) |
| `v1.147.81` | Expose + subroutine-break expectedEffects (#468) |

## Lingering / 9.12 / blanking releases

| Tag | Scope |
|-----|--------|
| `v1.147.82` | Mark designation on registry (CR 10.11.4; #470) |
| `v1.147.83` | Granted ice subtypes on registry (CR 9.10.1; #472) |
| `v1.147.84` | Runner MU modifiers on registry (CR 9.10.1; #474) |
| `v1.147.85` | This-turn breaker/ice strength boosts on registry (CR 9.10.1; #476) |
| `v1.147.86` | Corp-turn ability blanks on registry (CR 9.10.1; #478) |
| `v1.147.87` | Run/encounter breaker+ice strength pumps on registry (CR 9.10.1; #480) |
| `v1.147.88` | Until-checkpoint breaker strength pumps on registry (CR 9.10.1; #482) |
| `v1.147.89` | Cancel still-pending on Runner leave-play / blanked resolve (CR 9.6.10; #484) |
| `v1.147.90` | Cancel still-pending on Corp leave-play (CR 9.6.10; #486) |
| `v1.147.91` | Cancel turn-begin remaining ids on Runner leave-play (CR 9.6.10; #488) |
| `v1.147.92` | Unify ice strength onto effectiveIceStrength (CR 9.12.1a; #490) |
| `v1.147.93` | Unify breaker strength onto effectiveBreakerStrength (CR 9.12.1a; #492) |
| `v1.147.94` | Şifr encounter strength set on effectiveIceStrength (CR 9.12.1a; #494) |
| `v1.147.95` | Gate blanked ice static strength behind abilitiesSuppressed (CR 9.12.1d; #496) |
| `v1.147.96` | Fold Şifr hand-size into hand-size recompute (#498) |
| `v1.147.97` | Gebrselassie encounter/run boosts rewrite to turn (CR 9.9.9a; #500) |
| `v1.147.98` | Gate blanked icebreaker static strength (CR 9.12.1d; #502) |
| `v1.147.99` | Scoop only newly-marked pending after a checkpoint (CR 10.3.2; #504) |
| `v1.147.100` | Migrate Runner turn-begin leftovers onto the pending bag (CR 9.6.5d; #506) |
| `v1.147.101` | Ice strength set → increases → decreases (CR 9.12.1a; #508) |
| `v1.147.102` | Breaker strength increases then decreases (CR 9.12.1a; #510) |
| `v1.147.103` | Gate continuous rez/trash cost modifiers behind blanking (CR 9.12.1d; #512) |
| `v1.147.104` | Gate continuous hand-size / MU / allotted-click / install-cost increases (CR 9.12.1d; #514) |
| `v1.147.105` | Gate continuous link / Corp install-cost / Runner install discounts (CR 9.12.1d; #516) |
| `v1.147.106` | Gate continuous run-initiate tax / advancement / Corp hand-size (CR 9.12.1d; #518) |
| `v1.147.107` | Gate continuous steal / play costs + The Source installed steal tax (CR 9.12.1d; #520) |
| `v1.147.108` | Gate continuous draw / trace / Flagship access / MU-cost + `rezzedWith` (CR 9.12.1d; #522) |
| `v1.147.109` | Gate continuous bonus-access / breach credits + Corp-root Mwanza read (CR 9.12.1d; #524) |
| `v1.147.110` | Gate continuous static locks / taxes — Midway / Navi / Wireless Net / Blacklist / Black File (CR 9.12.1d; #526) |
| `v1.147.111` | Gate ice break locks, scored continuous, Genetics Pavilion, Power Tap (CR 9.12.1d; #528) |
| `v1.147.112` | Gate recurring refill, server locks, grip reveal, Kessleroid, Hivemind (CR 9.12.1d; #530) |
| `v1.147.113` | Gate Underway Grid / Guard / Tour Guide / SYNC remove-tag (CR 9.12.1d; #532) |
| `v1.147.114` | Gate Chronos / Ribs / Defective Brainchips / Ancestral Imager / Au Revoir / Reflection / Stick and Poke / DBS / Franchise City / current-event locks (CR 9.12.1d; #534) |
| `v1.147.115` | Gate Clot / Interdiction / Hernando / Watchdog / Hijacked Router / Turtlebacks / Heliamphora / NAT (CR 9.12.1d; #536) |
| `v1.147.116` | Gate Patchwork / Corporate Defector / Carnivore / Imp / Salsette / Class Act / Cupellation (CR 9.12.1d; #538) |
| `v1.147.117` | Gate Amazon Industrial Zone / Hacktivist Meeting / Lampades / Gourmand / Open Forum / Clot score-candidate (CR 9.12.1d; #540) |
| `v1.147.118` | Gate Keiko / Bling / Wasteland / Mark Yale / Cyberdelia / Keros / Rime (CR 9.12.1d; #542) |
| `v1.147.119` | Gate recurringSpendFor spend / ABR / Kim / Gantulga / Kit (CR 9.12.1d; #544) |
| `v1.147.120` | Gate hosted-credit spend / Debbie / Touchstone / first-run-event helpers (CR 9.12.1d; #546) |
| `v1.147.121` | Gate Tyr's Hand break interrupt / Mumbad Virtual Tour must-trash (CR 9.12.1d; #548) |
| `v1.147.122` | Gate psi hosted-credit spend / Jesminder / Zona Sul / Starlight (CR 9.12.1d; #550) |
| `v1.147.123` | Gate Sundew / Awakening Center / LLDS / Cybertrooper / Seidr (CR 9.12.1d; #551) |
| `v1.147.124` | Gate Fenris / Film Critic / CPC Generator / Long-Term Investment (CR 9.12.1d; #554) |
| `v1.147.125` | Gate Wasteland / Zamba / TechnoCo / Death and Taxes / Corporate Grant / score-agenda helpers (CR 9.12.1d; #556) |
| `v1.147.126` | Gate Pad Tap / Tech Trader / Surveillance Sweep / Net Analytics / Overseer / expose-path Zamba (CR 9.12.1d; #559) |
| `v1.147.127` | Gate GPI / Engolo / Comet / Manta / Mirror / Kasi / Better Citizen / scandal BP (CR 9.12.1d; #562) |
| `v1.147.128` | Gate Personal Workshop / Estelle / Oberth / Anson / Archivist (CR 9.12.1d; #568) |
| `v1.147.129` | Gate Maw / Hippo / Polyhistor / Bazaar / Deep Red / Rip Deal / Synth DNA / QPM (CR 9.12.1d; #571) |
| `v1.147.130` | Gate Friday Chip / Progenitor / on-virus-purge / trash-on-purge (CR 9.12.1d; #573) |
| `v1.147.131` | Gate trashHooks first-* / Reaver / Hostile Infrastructure (CR 9.12.1d; #576) |
| `v1.147.132` | Gate Grimoire virus placement / program·hardware install helpers (CR 9.12.1d; #580) |
| `v1.147.133` | Gate Aumakua expose virus placement (CR 9.12.1d; #583) |

## Recommended follow-up (current) — full CR fidelity

**Decision (2026-10-29, side-chat → main):** stop treating the universal scanner as deferred Standard-good-enough work. North star is **full CR fidelity** for executable procedures the corpus needs. Still **not** a `nodes.json` / prose compiler (roadmap / engine README). Card text wins on contradiction (**1.2.1**).

### Phased program (do not reorder)

1. **Records-only runtime** — **done**.
2. **Declarative trigger predicates** — **done**.
3. **Universal 10.3.1a scanner** — **done** through `v1.147.216` (`fireStoredConditionals` removed; play **8.6.7e**/**8.6.7f**).
4. **Replacement layer (**9.9.9**)** — **done** (`v1.147.219`).
5. **Eternal 9.12 continuous compiler** — only when Eternal support is intentional (Mother Goddess / Egret / Fatuma gained-subtype chains).

### Near-term

- Fidelity phase 5 Eternal **9.12** only when intentional.
- Phase 5 table work continues in parallel.
- Phase-3 leftovers closed at `v1.147.221`.

**Covered through `v1.147.216`:** dual-write cleanup through blanking gates (`55`–`145`); fidelity phases 1–3 (`146`–`216`) including declarative predicates, note→checkpoint→mark families, play mark/resolve order, and removal of `fireStoredConditionals`. Standard 9.12 blanking model = Hush×Magnet solver + per-site gates.
