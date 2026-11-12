---
name: CR glossary standardize
overview: "Align the stack with CR terminology: fix known mismatches (zones, windows, pass, RAL, counters, damage, link, UI), build a full terms.json inventory with per-term status, and add a synonym denylist CI guard. Card printings stay authoritative (CR 1.2.1)."
todos:
  - id: term-inventory
    content: Generate full CR term inventory from pinned terms.json with status (aligned/alias/ui-only/unmodeled/card-text/na) into cr-glossary.md + machine-readable map
    status: completed
  - id: denylist
    content: Add synonym denylist + vitest guard for engine src and game UI/match strings; seed with known bad terms from this plan
    status: completed
  - id: engine-zones
    content: Rename PlayerState/PublicView bags + ZoneId runner:rig→runner:installed; add zones.ts accessors; CORP/RUNNER_STEPS.actionWindow→actionPaw
    status: completed
  - id: engine-terms
    content: "Rename/align engine terms: interrupt windows vs PAW, accessRemaining→randomAccessLimit, advancementTokens→advancementCounters, brainDamage→coreDamage; intent pass labels"
    status: completed
  - id: engine-tests
    content: Update engine tests for renames; run npm test
    status: completed
  - id: game-align
    content: Align match API/UI/tests to CR terms; run game tests against local engine
    status: completed
  - id: inventory-closeout
    content: After renames, re-scan inventory; mark fixed terms aligned; leave unmodeled list as explicit backlog in glossary
    status: completed
isProject: false
---

# CR terminology: mismatch fix + full coverage scaffold

**Status (reviewed 2026-11-11):** done. `docs/cr-glossary.md`, `data/cr-term-map.json`, and `scripts/build-cr-term-map.mjs` exist; the denylist guard landed as `tests/term-denylist.test.ts` (not `cr-term-denylist.test.ts`). In engine `src/`, `runner:rig`, `accessRemaining`, `advancementTokens`, and `*_interrupt_paw` are gone, and `actionPaw`, `randomAccessLimit`, `advancementCounters`, `coreDamage`, `discardPile`, and `scoreArea` are in use; `brainDamage` remains only as the CR 10.4.2c alias citation. The game no longer shows “Continue” or “Finish accessing”.

## Goal

**Align our stack** (engine model, game UI, docs, CI) with Comprehensive Rules terminology — including a **complete inventory** of every CR term from the pinned dataset.

**Not the goal:** rewrite printed card text / NRDB titles to CR jargon. Card text wins on contradiction (**CR 1.2.1**). Those entries are status `card-text`.

Coverage levels this plan delivers:

| Level | Deliverable |
|---|---|
| **1. Glossary inventory** | Every unique term/subtype in pinned `terms.json` (~240) has a row: status + code id / notes / cite |
| **2. Model + UI fixes** | Known mismatches renamed (sections A–D below) |
| **5. Denylist CI** | Banned synonyms fail tests in engine `src/` and game match/UI strings |

Later waves (backlog, not this PR set): close remaining `unmodeled` / `alias` rows one cluster at a time.

---

## E. Full term inventory + denylist (expanded)

### Inventory

Source of truth: pinned CR data (`vendor/cr-data` / fetch pin **v26.03**) [`data/terms.json`](netrunner-comprehensive-rules-data/data/terms.json).

Add:

- [`netrunner-engine/docs/cr-glossary.md`](netrunner-engine/docs/cr-glossary.md) — human tables (zones, windows, and the full term list or a generated include)
- [`netrunner-engine/data/cr-term-map.json`](netrunner-engine/data/cr-term-map.json) — machine-readable map keyed by normalized term text

Each entry:

```json
{
  "term": "random access limit",
  "type": "term",
  "status": "aligned",
  "code": ["run.randomAccessLimit"],
  "aliasesBanned": ["accessRemaining"],
  "notes": "CR 7.3.5",
  "cite": "7.3.5"
}
```

Statuses:

- `aligned` — CR name used in code/UI where modeled
- `alias` — CR allows synonym; code may keep alias with glossary note (`brain`↔`core`)
- `ui-only` — display string only
- `unmodeled` — CR term exists; engine has no dedicated id yet (honest gap)
- `card-text` — appears on cards; not an engine rename target
- `na` — CR term not applicable to digital host (e.g. pure layout/flavor)

Script (optional but preferred): `scripts/build-cr-term-map.mjs` reads pinned `terms.json`, merges hand-maintained overrides for `code` / `status`, writes `cr-term-map.json` + regenerates the inventory section of the glossary. First landing may hand-seed statuses for known rows and default the rest to `unmodeled` or `card-text` by heuristic (subtypes → often `card-text` unless engine has the subtype).

Link glossary from [`cr-adherence-gate.md`](netrunner-engine/docs/cr-adherence-gate.md) §3 and [`docs/roadmap.md`](docs/roadmap.md).

### Denylist guard

[`netrunner-engine/tests/cr-term-denylist.test.ts`](netrunner-engine/tests/cr-term-denylist.test.ts) (+ game-side check or shared list consumed by game test):

- Load banned strings from `cr-term-map.json` (`aliasesBanned` where status is `aligned`) plus a fixed seed list from this plan: `runner:rig`, `.discard` bag name, `advancementTokens`, `accessRemaining`, `brainDamage` (field), `*_interrupt_paw`, UI “Continue” for `pass_window`, etc.
- Scan `src/**/*.ts` (and game `src/match.ts`, `public/table.html`) for banned identifiers/labels
- Allowlist comments / glossary / the map file itself
- Fail with the CR term to use instead

After renames, denylist encodes the old names so they cannot return.

### Inventory closeout

Re-run/build map after A–D renames. Every term fixed in this pass → `aligned`. Remaining `unmodeled` rows stay listed as backlog (no silent “done”).

---

## A. Zones (CR ch. 4)

### Player bags

| Bag today | Rename to | CR |
|---|---|---|
| `hand` | keep `hand` | **4.3.1** |
| `deck` | keep `deck` | **4.2** |
| `discard` | `discardPile` | **4.4.1** |
| `score` | `scoreArea` | **4.5** |
| `rig` | `installed` | play area **4.6** |

ZoneId `runner:rig` → `runner:installed`.

Play-area partitions (document, do not merge): `server:*`, `runner:installed`, `corp:play-area` / `runner:play-area`.

Add [`netrunner-engine/src/state/zones.ts`](netrunner-engine/src/state/zones.ts) (`isPlayAreaZone`, side-name helpers).

---

## B. Timing / windows / pass (high)

| Today | Target | CR |
|---|---|---|
| Interrupt kinds under `PaidAbilityWindow` as `*_interrupt_paw` | Distinct interrupt window type/ids (drop `_paw` on interrupt kinds); labels say interrupt window | **9.2.5**, **9.2.9** |
| `CORP_STEPS`/`RUNNER_STEPS`.actionWindow | `.actionPaw`; glossary: action window ≠ PAW | **9.2.6–9.2.7** |
| `pass_window` → “Continue” | **Pass** | **9.2.4b** |
| `finish_access` → “Finish accessing” | **Pass** / “Pass (mid-access)” | **9.2.10** |
| `continue_run` | Prefer real CR step verbs; do not treat “continue the run” as a defined term | **6.6** |

---

## C. Counters, RAL, damage, link, points (medium)

| Today | Target | CR |
|---|---|---|
| `accessRemaining` | `randomAccessLimit` | **7.3.5** |
| `advancementTokens` | `advancementCounters` | **1.9.5f** |
| `brainDamage` (permanent) | `coreDamage` (`brain` type alias kept) | **10.4.2b–c** |
| UI “Link” | **Link value** | **10.7.1** |
| Stat “Score” | **Agenda points** | **1.17** |
| Ability flags ad hoc | Glossary map **9.3.6** ↔ encoding; thin `flags?` only if no behavior change | **9.3.6** |

---

## D. Low / UI polish

| Today | Target |
|---|---|
| “N points” | “N agenda points” |
| Badge “str” | strength (label or tooltip) |
| Dividends / trigger cost / inactive player | glossary status `unmodeled` or `alias` notes — no new primitives |

---

## Execution order

1. Scaffold inventory + denylist (seed banned list; many terms still `unmodeled`).
2. Engine renames A → C → B.
3. Engine `npm test` (including denylist).
4. Local game against sibling engine (no pin bump); game UI/match renames; game tests.
5. Rebuild inventory closeout; commit glossary + map with updated statuses.

Work lands on `claude/…` branches per repo; no release/pin bump unless intended later.

---

## Out of scope

- Splitting Corp/Runner `PlayerState` types
- Merging play-area ZoneId partitions
- Renaming `hand`/`deck` bags to side-specific field names
- New Dividends (or other keyword) primitives
- Rewriting card JSON printed text to CR terms
- Forcing every `unmodeled` term to an engine field in this pass
- Semver / GitHub Release / pin bump

## Verification

- Full term map row count matches unique `terms.json` entries
- Denylist red on old synonyms; green after renames
- Engine + game tests green
- Glossary linked from adherence gate + roadmap
- Closeout: zero `unmodeled` for terms fixed in A–D; remaining gaps explicit
