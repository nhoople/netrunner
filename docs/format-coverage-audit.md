# Format coverage audit (cards v1.147.6, engine v1.147.9)

**Overall: Core Sets, Standard, Startup, Eternal, and RAM are fully covered for unique-title play** (NSG set lists). Magnum Opus (`mo`/`mor`) cleared at milestone **v1.142.0**. The printed corpus is unchanged from **v1.143.0**.

| Field | Value |
|-------|--------|
| Audited | 2026-10-01 |
| Floor | cards **`v1.147.6`**, engine **`v1.147.9`** (updated 2026-10-17; ice, asset, and upgrade install cost follows the Comprehensive Rules) |
| Criterion | “Support play” = every **unique title** in the format’s legal **card pool** exists as supported Effect IR in `pool.json` / card data. Ban lists, points lists, and MWL documents are in cards `v1.147.18` (`data/formats/`, `data/card-pools/`, `data/restrictions/`). Enforcement is **out of scope**. |
| Corpus | [`roadmap.md`](roadmap.md) Phase 3 (68/68 `pool.json` waves supported, including Magnum Opus). Outside: skip `napd`, draft, championship; defer `tdc`; `sm` reprints only |
| Preferences | [project store `preferences.md`](/cursor/stores/bc-ff07fe61-a54b-4ec3-9ab4-08ea6799859d/preferences.md) — Magnum Opus included (user override) |

---

## Verdict table

| Format | Verdict | Missing for play (unique titles) |
|--------|---------|----------------------------------|
| **Netrunner Core Sets** | **Fully covered** | none |
| **Standard** (NSG) | **Fully covered** | none |
| **Startup** | **Fully covered** | none |
| **Eternal** | **Fully covered** (NSG set list) | none for unique-title play; optional NRDB-only NAPD ID still skipped |
| **Random Access Memories** | **Fully covered** (unique titles) | none — Magnum Opus Reprint’s 6 playables cleared; `sm` adds 0 new titles |

---

## What “Netrunner Core Sets” means

Per [Null Signal Supported Formats](https://nullsignal.games/players/supported-formats/) (as of 2026-10-01):

> The combination of **System Gateway** and **Elevation** is the **Netrunner Core Sets**. These two sets form the non-rotating core for Standard and Startup, and the recommended self-contained starter pool beyond Gateway alone. No ban list.

**Not** Revised Core (`core2`), System Core 2019 (`sc19`), original FFG Core, Magnum Opus, or System Update 2021. Those are separate products; SC19 / Revised Core / Magnum Opus remain supported in our corpus for Eternal/absorb use, but they are **not** this format.

NRDB v3 format id: `core` → card pool `core` (cycles `system_gateway` + `elevation`, **159** cards).

---

## Sources (format definitions)

| Source | Role |
|--------|------|
| [NSG Supported Formats](https://nullsignal.games/players/supported-formats/) | Authoritative set lists for Core Sets, Standard (post–Vantage Point), Startup (post–VP rotation), Eternal, historical RAM |
| [Standard Balance Update 26.09](https://nullsignal.games/blog/standard-balance-update-26-09/) | Confirms Standard Ban List **26.08** unchanged through Worlds (banlist only; not required for this audit) |
| [NRDB API v3 formats](https://api.netrunnerdb.com/api/v3/public/formats) | Live `active_card_pool_id` / set membership cross-check (2026-10-01) |
| [NRDB API v3 card_pools](https://api.netrunnerdb.com/api/v3/public/card_pools/{id}) | Pool sizes: Core 159 · Startup 225 · Standard 613 · Eternal 2017 · RAM `ram_7` 399 |
| [RAM format announcement](https://nisei.net/blog/random-access-memories-format-and-tournament/) | Draw-bag rules (MO community cards excluded; `mor` + `sm` eligible as small packs) |
| Local | `data/pool.json` @ cards `v1.147.6`; pinned NSG [netrunner-cards-json](https://github.com/Null-Signal-Games/netrunner-cards-json) for unique-title analysis (NRDB API not preferred ingest) |

**NRDB vs NSG notes:** NRDB Standard restriction id still shows `standard_ban_list_26_03` while NSG active banlist is **26.08** — irrelevant for card-pool coverage. NRDB Eternal includes `napd_multiplayer` and `salvaged_memories` cycles; NSG’s published Eternal set list includes **Magnum Opus Set** but **not** NAPD or Salvaged Memories by name. This audit treats **NSG set lists as primary** and notes NRDB extras separately.

---

## Corpus mapping baseline

All waves needed below (except intentional skips) are `supported` in `pool.json` with **0** non-empty `unsupported` card files (see [`roadmap.md`](roadmap.md) Phase 3).

| Product | NRDB code(s) | Pool wave | Status |
|---------|--------------|-----------|--------|
| System Gateway | `sg` | `system-gateway` | supported |
| Elevation | `elev` | `elevation` | supported |
| Vantage Point | `vp` | `vantage-point` | supported |
| Ashes | `df`, `ur` (+ `urbp` absorb) | `downfall`, `uprising` | supported |
| Borealis | `ms`, `ph` (+ `msbp` absorb) | `midnight-sun`, `parhelion` | supported |
| Liberation | `tai`, `rwr` | `the-automata-initiative`, `rebellion-without-rehearsal` | supported |
| Full FFG mainline + SC19 + SU21 + RaR + TD cards | roadmap Phase 3 | all in `corpusOrder` | supported |
| Magnum Opus / Reprint | `mo` / `mor` | `magnum-opus` (`mor` absorbed) | **supported** (v1.142.0) |
| Salvaged Memories | `sm` | — | outside declared corpus (all **reprints**) |
| NAPD / draft / TDC | `napd` / `draft` / `tdc` | — | skip / defer |

---

## Per-format detail

### 1–3. Netrunner Core Sets / Standard / Startup — Fully covered

Unchanged from prior audit at v1.141.0: Gateway + Elevation (+ Ashes/Borealis/Liberation/VP for Standard; VP for Startup). **No gaps.** Magnum Opus is not part of these formats.

### 4. Eternal — Fully covered (NSG)

**NSG Eternal-legal sets** include full FFG mainline, Magnum Opus Set, SC19, Ashes, SU21, Gateway, Borealis, Liberation, Elevation, Vantage Point.

| Bucket | Coverage |
|--------|----------|
| All FFG cycles in NSG list (incl. `td` cards, `core2`, Kitara, `rar`) | **supported** |
| NSG legacy + forward (`sc19`, `df`/`ur`, `su21`, `sg`, Borealis, Liberation, `elev`, `vp`) | **supported** |
| Magnum Opus Set (`mo`) | **supported** — wave `magnum-opus` **8/8** @ v1.142.0 |
| `tdc` / draft | not on Eternal playable set list / skipped |
| Salvaged Memories (`sm`) | NSG list omits; NRDB includes — **0 unique titles** |
| NAPD (`napd`) | NSG list omits; NRDB includes — **1** unique ID skipped |

#### Magnum Opus titles (all mapped)

| Title | Packs | Notes |
|-------|-------|-------|
| Labor Rights | `mo`, `mor` | playable |
| Embolus | `mo`, `mor` | playable |
| Crowdfunding | `mo`, `mor` | playable (Eternal points) |
| Timely Public Release | `mo`, `mor` | playable |
| Slot Machine | `mo`, `mor` | playable |
| Border Control | `mo`, `mor` | playable |
| Hired Help | `mo` only | Eternal-banned community; IR mapped |
| Watch the World Burn | `mo` only | Eternal-banned community; IR mapped |

**Play gap for legal Eternal decks: 0** unique supported-IR missing titles.

#### NRDB-only extra

| Title | Pack | Note |
|-------|------|------|
| Cyber Bureau: Keeping the Peace | `napd` | Multiplayer identity; skipped per preferences |

---

### 5. Random Access Memories (RAM) — Fully covered (unique titles)

**Published historical pool (`ram_7`):** Magnum Opus Reprint’s **6** unique playables are now supported. Salvaged Memories still adds **0** new titles. MO community cards remain excluded from the RAM draw bag.

**Verdict:** historical RAM and typical draws are playable for unique titles, including when **`mor`** is drawn.

---

## Gap list (actionable)

| Gap | Formats hit | Unique titles | Policy |
|-----|-------------|----------------|--------|
| ~~Magnum Opus / Reprint (`mo`/`mor`)~~ | — | **0** remaining | **Cleared** @ v1.142.0 |
| Salvaged Memories (`sm`) | Eternal (NRDB only); RAM | **0** new titles | Outside corpus; reprints already supported |
| NAPD (`napd`) | Eternal (NRDB only) | Cyber Bureau (1) | Skip; not on NSG Eternal set list |
| Draft / `tdc` | none of the five formats’ deck pools | — | Skip / defer |

---

## Summary

At cards **v1.147.6** / engine **v1.147.9**, the project **fully supports** NSG **Netrunner Core Sets**, **Standard**, **Startup**, **Eternal** (unique-title play on NSG set list), and **RAM** (unique titles including Magnum Opus Reprint). Remaining intentional skips: `napd`, draft, championship; `tdc` deferred.
