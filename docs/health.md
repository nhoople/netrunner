# Health log

The monthly health check from [`how-we-work.md`](how-we-work.md#monthly-health-check), newest first. One row per check. A number that keeps moving the wrong way is worth a plan.

| Date | Engine | Kinds defined | Kinds in card JSON | Dead kinds | Largest engine files (lines) | Engine test files | Engine CI time | Notes |
|---|---|---|---|---|---|---|---|---|
| 2026-11-27 | `v1.148.0` | 1,526 | 903 | 16 | `effects/swap/swapKinds.ts` 1,947; `effects/hostingAndTrash/corpInstalledTrashKinds.ts` 1,947; `effects/hostingAndTrash/runnerInstalledTrashKinds.ts` 1,871; `effects/rez/rezKinds.ts` 1,838; `effects/visibility/visibilityKinds.ts` 1,835 | 324 | 3 min 55 s | After the repository layout cut (cards and engine `v1.148.0`). No `src/` file is over 2,000 lines, so the size baseline is empty; the largest was 8,459. Kinds in card JSON counted in `vendor/cards-data/rules/` (903 on cards `v1.147.29` too, counted the old way). Test files include the 13 jnet files. CI time includes the step that typechecks the tests, added in engine #1069 |
| 2026-11-18 | `v1.147.261` | 1,537 | 900 | 17 | `effects/ir.ts` 8,459; `state/types.ts` 6,155; `timing/graph.ts` 5,827; `legality/checkpoints.ts` 4,851; `effects/kinds/otherKinds.ts` 4,726 | 267 | 3 min 19 s | Baseline. Dead kinds are from the shrink-only baseline `tests/baselines/kind-liveness.json`. Kinds in card JSON is every distinct `kind` value in the pinned cards, including the composition forms |

## How to collect

- **Kinds defined:** the entries in `KNOWN_PRIMITIVE_KINDS` in `netrunner-engine/src/effects/ir/knownKinds.ts` (in `src/effects/ir.ts` before engine `v1.148.0`).
- **Kinds in card JSON:** the distinct `"kind"` values in the card rules files, `netrunner-engine/vendor/cards-data/rules/` (before cards `v1.148.0`, `vendor/cards-data` leaving out `printed/`).
- **Dead kinds:** the length of `deadKinds` in `netrunner-engine/tests/baselines/kind-liveness.json`. That test only lets it shrink.
- **Largest files:** `wc -l` over `netrunner-engine/src/**/*.ts`, top five.
- **Engine test files:** `*.test.ts` under `netrunner-engine/tests`.
- **Engine CI time:** the latest `ci.yml` run on `master` (`gh run list -R nhoople/netrunner-engine -w ci.yml -b master -L 1`).
