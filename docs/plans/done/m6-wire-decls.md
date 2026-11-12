---
name: M6 wire decls
overview: Finish the M6 residual by making gained-sub and subtype collectors prefer the projected declaration arrays over one-off booleans, without cards-data schema changes.
todos:
  - id: wire-gained-subs
    content: Prefer continuousGainedSubDecls in Fatuma/Wetwork/Sub Boost collectors
    status: completed
  - id: wire-subtype-grants
    content: Prefer continuousSubtypeGrants in collectSubtypeGrantEffects
    status: completed
  - id: tests-ship
    content: Tests + PR + v1.147.231 + game/meta pins
    status: completed
isProject: false
---

# M6: Wire collectors to declaration projections

Floor: engine `v1.147.230`. Load already projects `continuousSubtypeGrants` and `continuousGainedSubDecls` in [`netrunner-engine/src/cards/load.ts`](https://github.com/nhoople/netrunner-engine/blob/master/src/cards/load.ts). Collectors in [`continuousSubs.ts`](https://github.com/nhoople/netrunner-engine/blob/master/src/state/continuousSubs.ts) still gate on the legacy booleans (`bioroidIceGainsLoseClickSubroutineBeforeOthers`, `hostGainsBarrierAndEtrSubroutine`, etc.).

## Scope (one engine PR)

1. **Gained-sub collectors** — Prefer `continuousGainedSubDecls`:
   - `collectFatumaGainedSubs`: match `{ kind: "fatuma_lose_click" }` (fallback boolean for unprojected instances).
   - `collectSubBoostEtrSubs`: match `{ kind: "sub_boost_etr" }`.
   - `collectHostedConditionSubsBeforePrinted`: keep using `hostGainsSubroutinesBeforePrinted` payload (the decl kind `wetwork_hosted_before` is a marker; sub list stays on the hosted field). Gate presence via decl **or** non-empty sub list.

2. **Subtype grants** — In [`continuousEffects.ts`](https://github.com/nhoople/netrunner-engine/blob/master/src/state/continuousEffects.ts) `collectSubtypeGrantEffects`, prefer `continuousSubtypeGrants` and drop redundant boolean OR branches where the load projection already covers them (keep boolean fallback only if a test stamps flags without going through load).

3. **Tests** — Extend or add a small test that a Fatuma/Wetwork/Sub Boost instance with decls set (and legacy boolean cleared) still gains the continuous subs / subtypes. Reuse patterns from [`tests/continuous-gained-subs.test.ts`](https://github.com/nhoople/netrunner-engine/blob/master/tests/continuous-gained-subs.test.ts).

4. **Out of scope** — No cards-data schema; no new strength/cost declaration arrays (those families already use typed continuous fields + [`continuousCosts.ts`](https://github.com/nhoople/netrunner-engine/blob/master/src/state/continuousCosts.ts)). No Product Phase 5 in this PR.

## Ship

`npm test` + lint → PR → maintenance tag `v1.147.231` → game + meta pins (standing release policy).

## After this

Engine migration residuals are closed. Next product track is Phase 5 local table (seat snapshot / golden / IR / timing inspect) per [`docs/roadmap.md`](../../roadmap.md).
