---
name: CR ability records
overview: Replace per-hook effect fields with one Comprehensive Rules ability record per printed ability, then move all cards onto that record so the engine resolves the CR 9.3 class instead of a hook name.
todos:
  - id: record-type
    content: Add the CR 9.3 ability record to the engine IR, card type, and cards schema.
    status: completed
  - id: resolver
    content: Resolve abilities by class and trigger, and keep old hooks working until a card moves.
    status: completed
  - id: validate
    content: Reject records that break CR 9.3 (static with instructions, paid without a cost, conditional without a trigger).
    status: completed
  - id: gateway
    content: Move System Gateway onto ability records and cover one ability of each class with tests.
    status: completed
  - id: corpus
    content: Move the remaining packs in corpus order, including additional costs as restrictions and continuous fields as declarations.
    status: completed
  - id: release
    content: When no card uses the old hooks, cut the paired cards and engine release. Leave the CR pin at v26.03.
    status: completed
isProject: false
---

# CR ability records

CR 9.3 is the classification the engine will resolve. Card text still wins on a direct contradiction (CR 1.2.1). The Comprehensive Rules pin stays `v26.03`. No pin bump until the corpus has moved and a release is cut.

## The record

Add one `abilities` array on the card. Each entry is one printed ability:

- `class`: `static`, `paid`, `conditional`, `play`, or `subroutine` (CR 9.3.7).
- `flag`: `access`, `interface`, `interrupt`, `persistent`, `once_per_turn`, or `threat` with N (CR 9.3.6). Omit when the printed ability has no flag.
- `cost`: the bold cost of a paid ability (CR 9.3.2a). Required for `paid`.
- `trigger`: the timing window of a conditional ability (CR 9.3.2b). Required for `conditional`. This is the current hook, named as the window (`turn_begin`, `score`, `play`, `rez`, …).
- `condition`: an `if` for a static or nested condition (CR 9.3.2c).
- `restrictions`: constraints on playing or using the ability, including an additional cost (CR 9.3.3, 9.3.3a). They apply to the whole ability.
- `instructions`: `do` / `seq` / `choose` / `prevent`, in the order written (CR 9.3.4d). Forbidden on `static` (CR 9.3.7a, 9.4.1).
- `declaration`: the continuous effect of a static ability. Only `static` may have one.

A play ability such as Sure Gamble in [`netrunner-cards-data/data/system-gateway/sure-gamble.json`](https://github.com/nhoople/netrunner-cards-data/tree/master/data/system-gateway/sure-gamble.json) becomes `class: "play"` with the existing `gain_credits` instruction. Witch Hunt’s end-of-action text becomes `class: "conditional"` with the scored-this-turn condition and the same instruction sequence. The effect tree stays hand-authored. This is not a compiler from `nodes.json`.

## Engine

Today [`netrunner-engine/src/actions/play.ts`](https://github.com/nhoople/netrunner-engine/blob/master/src/actions/play.ts) evaluates `card.onPlay`, and [`netrunner-engine/src/timing/graph.ts`](https://github.com/nhoople/netrunner-engine/blob/master/src/timing/graph.ts) evaluates `card.onTurnBegin`. [`netrunner-engine/src/cards/load.ts`](https://github.com/nhoople/netrunner-engine/blob/master/src/cards/load.ts) has about 204 `on*` hooks plus `paidAbilities` and `subroutines`.

- Define the record next to `Effect` in [`netrunner-engine/src/effects/ir.ts`](https://github.com/nhoople/netrunner-engine/blob/master/src/effects/ir.ts) and on the card type in `load.ts`.
- Resolve `abilities` when present. A `play` ability fires where `onPlay` fires. A `paid` ability fires through [`netrunner-engine/src/actions/paidAbility.ts`](https://github.com/nhoople/netrunner-engine/blob/master/src/actions/paidAbility.ts). A `subroutine` fires where `subroutines` fire. A `conditional` ability fires at its `trigger` window. A `static` declaration is read by the rule that already applies that continuous effect, and it does not enter the effect resolver (CR 9.4.1).
- While a card still has only the old hook, keep resolving that hook. Cards move one pack at a time without a flag day. Engine tests stay on the pinned catalog until the release.

## Cards

- Extend [`netrunner-cards-data/data/schema.json`](https://github.com/nhoople/netrunner-cards-data/blob/master/data/schema.json) and `scripts/validate-cards.py` so a `static` ability cannot contain instructions, a `paid` ability has a cost, a `conditional` ability has a trigger and an instruction, and a `play` or `subroutine` ability is one of those classes.
- Migrate in `corpusOrder`, starting with `system-gateway`. For each ability whose body is already an effect, move it into `abilities` and delete the old hook on that card in the same change. Generators for that pack emit the record.
- Additional-cost fields (`playAdditionalCost`, `stealAdditionalCost`, and the same family) become `restrictions` on the ability they modify.
- Continuous fields the engine already applies (`link`, strength modifiers, “cannot”) become `declaration` entries, and the reader of that field consults the declaration. Do not invent a free-form declaration language. A declaration the engine cannot apply yet stays `unsupported`.
- Kind names stay the procedure. When an instruction is rewritten, use the Comprehensive Rules word for that procedure. The 530 grandfathered names are not renamed in a separate pass.

## Tests and release

- Engine tests for one ability of each class: a play instruction, a paid cost plus instruction, a conditional trigger, a subroutine, and a static declaration that does not resolve.
- Run the engine file tests, then `scripts/validate-cards.py`, for each pack.
- After every pack is on `abilities` and the old hooks are gone, cut a paired cards and engine release. Until then, do not bump either pin.
- Update the checklist in [`netrunner-engine/docs/cr-adherence-gate.md`](https://github.com/nhoople/netrunner-engine/blob/master/docs/cr-adherence-gate.md) so a new card is classified under CR 9.3 before it is written.
