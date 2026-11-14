---
name: lookup
description: Look up a Comprehensive Rules node or a card at the versions the engine pins, without writing a one-off parser. Use when you need CR text by number or keyword (with children and examples), a card's printed text, stats, abilities and effect IR, its rulings, or which cards use an effect kind. Reads netrunner-engine/vendor, so results match the engine's CR and cards pins.
---

# /lookup

Run the script with node from the workspace root (`node .claude/skills/lookup/lookup.mjs ...`) or from an inner repo (`node ../.claude/skills/lookup/lookup.mjs ...`). It is read-only and has no dependencies. Use it in place of inline `python3 -c` or `node -e` against the JSON.

## Comprehensive Rules

```
lookup.mjs cr 1.2.1                       # one node, with its parent and URL
lookup.mjs cr 7.1.5 --depth 1             # plus children (subrules carry exceptions)
lookup.mjs cr 1.5.4 --depth 1 --examples  # plus the CR's examples
lookup.mjs cr --search "trash cost"       # keyword search over titles and text
```

A node can also be looked up by id (`rule_card_precedence`). When citing, quote `text_plain` as printed and give the number.

## Cards

```
lookup.mjs card "Project Yagi-Uda"        # title or id; accents and case ignored
lookup.mjs card yagi                      # a unique partial title works; otherwise lists matches
lookup.mjs card afshar --ir               # full effect IR
lookup.mjs card algernon --rulings        # rulings, stripped of markup
lookup.mjs card --search "end the run"    # search titles and printed text
lookup.mjs kind lose_credits              # cards whose IR uses an effect kind
```

The default card view shows printed text, stats, and per ability its class, trigger, the CR rule it was modelled on, and the kinds it uses. Printed text wins over the model on a direct contradiction (CR 1.2.1).

## Versions

Data comes from `netrunner-engine/vendor/cr-data` and `vendor/cards-data`. Each output names the tag it read. If `vendor/` is behind `data/cr-pin.json` or `data/cards-pin.json`, the script warns; run `npm run fetch-cr` or `npm run fetch-cards` in the engine. To read another engine checkout (a worktree), pass `--engine <dir>`.

This reads the pinned datasets, not the working tree of `netrunner-cards-data` or `netrunner-comprehensive-rules-data`. For an unreleased card change, read that repo's files directly.
