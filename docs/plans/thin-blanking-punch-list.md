---
name: Thin blanking punch list
overview: "Thin Standard-scoped CR 9.12.1d abilitiesSuppressed punch list — COMPLETE through v1.147.142 (+ inactive cancel 143–144, Sebastião 145). Broader work is full CR fidelity program (not a fire-site inventory)."
todos:
  - id: batch-damage-suffer
    content: "Gate damage.ts continuous leftovers — Sentinel Defense onSufferCoreDamage (defense-in-depth), Respirocytes onFirstEmptyGripEachTurn"
    status: completed
  - id: batch-power-counters
    content: "Gate powerCounters.ts — onPowerCountersGte direct eval, powerCounterOnAnyCorpInstall / AnyCardRez, etrSubroutinesPer* rebuilds"
    status: completed
  - id: batch-hosted-credits-gte
    content: "Gate hostedCredits.ts onHostedCreditsGte direct evalEffect path"
    status: completed
  - id: batch-corp-action-hooks
    content: "Gate corpActionHooks.ts Wage Workers (wageWorkersTrackActions) continuous click gain"
    status: completed
  - id: batch-run-timing-ungated
    content: "Gate runTimingHooks.ts onPassUnrezzedIce + onPassRezzedIceProtectingThisServer loops"
    status: completed
  - id: batch-paid-ability-gain
    content: "Gate paidAbility.ts gainsPaidAbilitiesOfHostedIcebreakers continuous grant"
    status: completed
  - id: batch-graph-genetics
    content: "Gate timing/graph.ts geneticsAlsoTriggerSecondTime (and scan sibling ungated continuous reads in same batches)"
    status: completed
  - id: batch-static-steal-score
    content: "Gate leftover static locks — staticFlags cannotInstallNonVirtualResources; candidatePending steal locks; score cannotScoreIfInstalledThisTurn; runInitiateTax agenda-trash tax if still ungated"
    status: completed
  - id: batch-recurring-refill-audit
    content: "Audit recurringCreditsMax / refill sites in rez.ts / costs.ts / runnerInstall.ts / eval.ts — confirm blanked or gate remaining"
    status: completed
  - id: batch-ice-rez-hooks
    content: "Defense-in-depth early continues on iceRezHooks.ts multi-card scans (fireStoredConditionals already suppresses)"
    status: completed
  - id: backlog-hook-scanner
    content: "Promoted to full CR phase 3 (universal 10.3.1a scanner) — see stack_tracking_assessment; not a thin fire-site inventory"
    status: completed
  - id: backlog-bespoke-payloads
    content: "Broader: bespoke pending payloads (Bug / Geist / Chum / Amaze) — keep unless context moves to turn/window"
    status: pending
  - id: backlog-inactive-parity
    content: "Broader: inactive/imminent cancel parity — blank + Chum/Amaze (143); checkpoint/Bug/Hostile + identity/9.1.8g (144)"
    status: completed
  - id: deferred-replacement
    content: "Full CR phase 4: replacement-effect layer beyond Gebrselassie"
    status: completed
  - id: cancelled-compiler
    content: "Standard: no 9.12 CR→AST; Eternal gained-subtype chains = full CR phase 5 when intentional"
    status: cancelled
isProject: false
---

# Thin blanking punch list (Standard)

**Status (reviewed 2026-11-11):** complete. The universal scanner shipped as full CR phase 3 (`v1.147.216`) and the replacement layer as phase 4 (`v1.147.219`). Bespoke pending payloads (Bug / Geist / Chum / Amaze) stay intentional.

**Floor:** engine [`v1.147.145`](https://github.com/nhoople/netrunner-engine/releases/tag/v1.147.145) — thin punch list + inactive cancel + Sebastião had-no-tags (#619). Cards `v1.147.13`, CR `v26.03`.

**Parent assessment:** [`stack-tracking-assessment.md`](stack-tracking-assessment.md)

**Rule:** cite CR **9.12.1d**; gate continuous/static ability *reads* with `abilitiesSuppressed`; add a focused `blanked-*.test.ts`; maintenance release + pins when `src/` changes.

## Already covered (do not re-open)

- Hush×Magnet blanking solver (`continuousEffects.ts`).
- Broad per-site campaign through `v1.147.133` (strength, costs, taxes, access, trashHooks, install helpers, Aumakua expose, …).
- **Pending conditional fire path:** `fireStoredConditionals` / `fireCardConditional` / `fireInlineConditional` already skip blanked sources. Phase-end / lifecycle helpers that only mark via those are **sufficient for blanking**; early `continue`s are optional defense-in-depth.

## Punch list — thin blanking batches

Ship one small PR per batch (or tightly related pair). Tick when released.

| # | Batch | Primary sites | Notes |
|---|-------|---------------|-------|
| 1 | Damage suffer / empty grip | `src/state/damage.ts` — `onSufferCoreDamage`, `onFirstEmptyGripEachTurn` | ✅ `v1.147.136` |
| 2 | Power counters | `src/state/powerCounters.ts` | ✅ `v1.147.137` |
| 3 | Hosted credits ≥ N | `src/state/hostedCredits.ts` | ✅ `v1.147.136` |
| 4 | Wage Workers | `src/state/corpActionHooks.ts` | ✅ with batch 5 (`v1.147.138` pending) |
| 5 | Run-timing pass hooks | `src/state/runTimingHooks.ts` | ✅ with batch 4 (`v1.147.138` pending) |
| 6 | Gained paid abilities | `src/actions/paidAbility.ts` | ✅ (`v1.147.139` pending) |
| 7 | Genetics / graph continuous | `src/timing/graph.ts` | ✅ with batch 8 (`v1.147.140` pending) |
| 8 | Steal / score / install locks | `staticFlags.ts`, `candidatePending.ts`, `actions/score.ts`, `runInitiateTax.ts` | ✅ with batch 7 (`v1.147.140` pending) |
| 9 | Recurring refill audit | `rez.ts`, `costs.ts`, `runnerInstall.ts`, `eval.ts` | ✅ already covered by `v1.147.112` `refillRecurringCredits` |
| 10 | Ice rez / bypass hooks | `src/state/iceRezHooks.ts` | ✅ `v1.147.141` — Lethe on-bypass + Jeitinho heap |

## Out of this punch list (stay on assessment)

| Item | Status |
|------|--------|
| Hook-timed conditionals → universal checkpoint-diff scanner | **Adopted** as full CR phase 3 (assessment); not a fire-site punch list |
| Bespoke pending payloads | Intentional unless context moves |
| Inactive/imminent parity on bespoke queues | Done through `v1.147.144` |
| Replacement-effect layer | Full CR phase 4 |
| Full 9.12 CR→AST compiler | Eternal only = full CR phase 5 when intentional |

## Suggested order

1 → 3 → 2 → 4 → 5 → 6 → 8 → 9 → 7 → 10, then stop and re-scan for ungated continuous reads before opening broader tracking work.
