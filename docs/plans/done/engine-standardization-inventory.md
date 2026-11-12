# Engine standardization inventory (S0)

Snapshot for the maximal standardization program. Snapshot taken at engine `v1.147.244` and cards `v1.147.19`; the current versions are in the [pin table](../../../README.md). Golden transcripts are an intent list. `deckbuildingReport` is exported for the match host. Docklands Pass, Snare, Verbal Plasticity, and Restoring Humanity are declarations. The effect switch is split by procedure under `src/effects/kinds/`. Printed play, paid, and subroutine text is the CR 9.3 record (`playEffectFromCard`, `paidAbilitiesFromCard`, `subroutinesFromCard`). Card-level once-per-turn paid is `paidAbilitiesOncePerTurn`. Load copies `continuousSubtypeGrants` and `continuousGainedSubDecls` only.

## Continuous readers

| Reader | File | Notes |
|--------|------|-------|
| Blanking | `src/state/continuousEffects.ts` → `abilitiesSuppressed` | **9.12.1d/e**; Klevetnik via `ability_blank` lingerings; Magnet continuous `hostedProgramsLoseAbilities` only (no stamp) |
| Ice subtypes | `continuousEffects.ts` `resolveIceSubtypes` via stubs `effectiveIceSubtypes` | Layered grants (Egret host, MG copies **layered** others, encounter/turn, morph) |
| Gained subs | `src/state/continuousSubs.ts` | Fatuma / Wetwork / Winchester-family / Sub Boost / Brainstorm collectors read declarations. Graph logs, Tour Guide sync, and advancement rebuild use the same declarations. |
| Ice/breaker strength | `src/effects/iceStrength.ts`, stubs | Temp pumps from lingerings only (map fields cleared at duration end; not read) |
| Rez / install costs | `src/state/continuousCosts.ts` | Increases + reductions + Runner install deltas |
| Declarations | `continuousSubtypeGrants` / `continuousGainedSubDecls` (`load.ts` + cards) | L1/L2 + W1 kinds (`v1.147.16`). Load copies those declarations only. |

## Lingering writes (`lingeringEffects.ts`)

Strength, MU, ability blanks, the mark, and end-of-turn subtype grants are registry single-write. Magnet blanks hosted programs via continuous **9.12** only (M1). Dead strength/MU duration maps removed (L4). `abilitiesBlanked` and `grantedSubtypesUntilEndOfTurn` are gone. `GameState.markServerId` is gone; `currentMark` reads the mark lingering, and the public view still reports that server.

## Graph mid-hook `pendingChoice`

Shared helper: `src/state/pendingChoice.ts` `openPendingChoose` (optional `loopCount` for CR 10.1.6a). Graph, action layer, `eval.ts`, and the procedure modules open choices through it. `pendingChoice = {` remains only inside the helper. Clears stay `pendingChoice = null`.

## Public view

`src/state/seatVisibility.ts` — zone/face/counter policy used by `getPublicView` (CR **1.18**).

## Printed abilities

Play (CR **9.3.7d**), paid (**9.3.7b**), and subroutine (**9.3.7e**) text is the ability record. A same-id stub does not replace that text. Runtime extras whose ids are not record ids stay on the paid and subroutine lists. `onPlay` is only the play text when the card has no play record. Resume of `effectKey` `"onPlay"` reads `playEffectFromCard`. `paidAbilitiesOncePerTurn` is the one card-level once-per-turn fact (CR **9.3.6g**).
