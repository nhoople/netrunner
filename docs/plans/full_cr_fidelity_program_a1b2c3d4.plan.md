---
name: Full CR fidelity program
overview: "Adopted 2026-10-29. Executable CR fidelity without compiling nodes.json/prose. Phases 1–4 complete through v1.147.219 (records-only → predicates → 10.3.1a note/mark → general 9.9.9). Next: Eternal 9.12 when intentional."
todos:
  - id: phase-1-records-only
    content: "Resolve only CR 9.3 ability records at runtime; cut dual-path leftover on* hook fields as mark/fire surface"
    status: completed
  - id: phase-1-play
    content: "Play (9.3.7d): instances keep abilities; playEffectFromCard; fireOnPlay syncs onPlay — catalog dual-write remains for shape tests"
    status: completed
  - id: phase-1-paid
    content: "Paid (9.3.7b): paidAbilitiesFromCard / sync on findPaidAbility; preserve extras + oncePerTurnPaidAbilities"
    status: completed
  - id: phase-1-subs
    content: "Subroutine (9.3.7e): subroutinesFromCard / sync at create + encounter start; preserve extras + Hive trim"
    status: completed
  - id: phase-2-predicates
    content: "Declarative conditional triggers as predicates over CheckpointFacts/Diff (+ turn flags), not hook names"
    status: completed
  - id: phase-2-had-family
    content: "Had-family predicates (advancement/tags from zero); BtL + Sebastião mark via evaluateTriggerPredicate"
    status: completed
  - id: phase-2-expose-draw
    content: "Expose + draw-set-aside predicates; Blackguard / on-draw mark via evaluateTriggerPredicate"
    status: completed
  - id: phase-2-zone
    content: "Remote-install + breached-root predicates; swap / 10.3.1j mark via evaluateTriggerPredicate"
    status: completed
  - id: phase-3-scanner
    content: "Universal markConditionalAbilities / note→checkpoint→mark at 10.3.1a; fireStoredConditionals removed (v1.147.216)"
    status: completed
  - id: phase-3-seidr
    content: "Seidr first-click-during-run: click hooks set flag; mark at 10.3.1a via seidr_first_click_during_run"
    status: completed
  - id: phase-3-bp
    content: "First/each bad-publicity take: hooks set flags; mark at 10.3.1a (#642 / v1.147.153)"
    status: completed
  - id: phase-3-event
    content: "First event trashed: trash hooks set flag; mark at 10.3.1a (Aniccam; #645 / v1.147.154)"
    status: completed
  - id: phase-3-mm
    content: "MirrorMorph third-distinct: corpActionHooks set flag; mark at 10.3.1a (#648 / v1.147.155)"
    status: completed
  - id: phase-4-replacement
    content: "General replacement-effect layer (CR 9.9.9) beyond Gebrselassie host-duration (v1.147.219 / #840)"
    status: completed
  - id: phase-4-system-seizure
    content: "System Seizure run-duration grant via shared strength-duration resolver (v1.147.217 / #834)"
    status: completed
  - id: phase-4-gamedragon
    content: "Gamedragon Pro run-duration rewrite 9.9.9a host-leave tracking (v1.147.218 / #837)"
    status: completed
  - id: phase-5-eternal-912
    content: "Eternal-only 9.12 gained-subtype→further-grant chains (Mother Goddess / Egret / Fatuma) when Eternal is intentional"
    status: completed
isProject: false
---

# Full CR fidelity program

**Status (reviewed 2026-11-11):** phases 1–5 are done. Phase 5 (gained-subtype → further-grant chains) shipped as engine standardization S1 (`engine_standardization_program_761c2b4b.plan.md`); `tests/continuous-subtype-layer.test.ts` covers Mother Goddess gaining Egret-granted subtypes. Current floor is engine `v1.147.248`, cards `v1.147.22`; the floors below are historical.

**Decision:** Nathaniel, 2026-10-29 (side chat → main). North star = full **executable** CR fidelity for the corpus. Still **not** a Comprehensive Rules prose / `nodes.json` → AST compiler (`docs/roadmap.md`, engine README). Card text wins on direct contradiction (**CR 1.2.1**).

**Floor:** engine [`v1.147.221`](https://github.com/nhoople/netrunner-engine/releases/tag/v1.147.221), cards `v1.147.13`, CR `v26.03`.

**Parent tracking:** [`stack_tracking_assessment_eadbad4f.plan.md`](stack_tracking_assessment_eadbad4f.plan.md)  
**Records precursor (cards already have `abilities`):** [`cr_ability_records_6a90f553.plan.md`](cr_ability_records_6a90f553.plan.md) — phase 1 is **runtime** cutover, not re-declaring the corpus.  
**Handoff for agents:** agent store `full-cr-fidelity-handoff.md`  
**Roadmap:** Phase 5 note in [`docs/roadmap.md`](../roadmap.md)

## What “fully” means here

| In | Out |
|----|-----|
| Timing graph + real **10.3** checkpoints | Compiling CR prose / `nodes.json` |
| **9.3** records as only ability surface at runtime | Magic-style stack |
| Conditionals pending only via **10.3.1a** scan / note drain | Inventing visibility CR forbids |
| **9.9** interrupts + expected effects | Big-bang rewrite of every test in one PR |
| **9.10** lingerings expire at **10.3.1b** | Punch-listing hook fire sites |
| **9.9.9** replacement (general) | |
| Eternal **9.12** subtype chains when product wants Eternal | Required for Standard today |

## Phases (do not reorder)

### 1. Records-only runtime — **done**

Dual path ends: engine resolves **class / trigger / instructions** from **9.3** records. Leftover materialized `on*` / flag fields stop being the mark/fire surface (may remain as load-time projections until deleted). Builds on completed cards-data ability-record migration.

### 2. Trigger predicates — **done**

Each conditional’s condition is machine-checkable data over `CheckpointFacts` / `CheckpointDiff` (and turn/run flags), not “invoke this named hook.” Expand fact capture as families need it (credits/tags/faceup/rezzed deltas already scaffolded).

### 3. Universal scanner — **done** (`v1.147.216`)

Production conditionals become pending via `markConditionalAbilities` / note→checkpoint→mark at **10.3.1a** (play marks at **8.6.7e**, resolves at **8.6.7f**). `fireStoredConditionals` deleted. `fireCardConditional` notes + checkpoints rather than immediate fire. Jeitinho heap bypass and `fireInlineConditional` leftovers closed at **`v1.147.221`**. Accept later reaction windows (**10.3.2**).

### 4. Replacement — **done** (`v1.147.219`)

One general **9.9.9** replacement layer beyond Gebrselassie host-duration rewrite. Duration class: shared strength-duration resolver; System Seizure grant (`v1.147.217`); Gamedragon Pro **9.9.9a** host-leave (`v1.147.218`). General API: **9.9.9b** apply-at-interrupt-open + **9.9.9c** once-per-effect (`replacements.ts`; `#840` / `v1.147.219`). System Seizure strength-increase interrupt window (`#843` / `v1.147.220`).

### 5. Eternal continuous

Gained-subtype → further-grant chains (Mother Goddess / Egret / Warden Fatuma) **only when Eternal support is intentional**. Not a Standard gate; not a prose compiler.

## Near-term

- Fidelity **phase 5** only when Eternal is intentional.
- Product Phase 5 local-table work in `netrunner-game` continues in parallel.
- Do not reopen punch lists of legacy fire sites; leftovers above are named and intentional.

## Exit criteria (phase 3) — met

- Production conditionals mark at **10.3.1a** (or play **8.6.7e**), not via immediate `fireStoredConditionals`.
- Phase-3 leftovers closed at `v1.147.221` (Jeitinho note path; `fireInlineConditional` removed).
- Goldens / timing tests updated for checkpoint-timed pending where required.

## Exit criteria (phase 4) — met

- First-class **9.9.9** API (`replacements.ts`) plus duration class in `hostDuration.ts`.
- **9.9.9b** hooked on interrupt-window open for damage / tags / ETR / expose / trash / break / strength-increase.
- **9.9.9c** bookkeeping (Vacheron + shared `tryApplyReplacement`).
- System Seizure resolves as a mandatory strength-increase interrupt (`strengthIncrease.ts`; `v1.147.220`).
