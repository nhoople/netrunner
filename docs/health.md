# Health log

The monthly health check from [`how-we-work.md`](how-we-work.md#monthly-health-check), newest first. One row per check. A number that keeps moving the wrong way is worth a plan.

| Date | Engine | Kinds defined | Kinds in card JSON | Dead kinds | Largest engine files (lines) | Engine test files | Engine CI time | Notes |
|---|---|---|---|---|---|---|---|---|
| 2026-11-18 | `v1.147.261` | 1,537 | 900 | 17 | `effects/ir.ts` 8,459; `state/types.ts` 6,155; `timing/graph.ts` 5,827; `legality/checkpoints.ts` 4,851; `effects/kinds/otherKinds.ts` 4,726 | 267 | 3 min 19 s | Baseline. Dead kinds are from the shrink-only baseline `tests/baselines/kind-liveness.json`. Kinds in card JSON is every distinct `kind` value in the pinned cards, including the composition forms |

## How to collect

- **Kinds defined:** the entries in `KNOWN_PRIMITIVE_KINDS` in `netrunner-engine/src/effects/ir.ts`.
- **Kinds in card JSON:** the distinct `"kind"` values in `netrunner-engine/vendor/cards-data`, leaving out `printed/`.
- **Dead kinds:** the length of `deadKinds` in `netrunner-engine/tests/baselines/kind-liveness.json`. That test only lets it shrink.
- **Largest files:** `wc -l` over `netrunner-engine/src/**/*.ts`, top five.
- **Engine test files:** `*.test.ts` under `netrunner-engine/tests`.
- **Engine CI time:** the latest `ci.yml` run on `master` (`gh run list -R nhoople/netrunner-engine -w ci.yml -b master -L 1`).
