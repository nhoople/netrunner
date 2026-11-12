# Stale-text audit (ability `text` vs pinned printed)

Heuristic scan of cards-data ability `text` fields against `data/printed` (`cardId` / `strippedText`).

Signals: multi-word phrases present in IR text but absent from printed (`net damage`, `meat damage`, `core damage`, `brain damage`, `end the run`, …), plus `if you do` vs `if you do not` polarity.

Run date: 2026-10-24. Closed: 2026-10-24. Floor now: engine `v1.147.244`, cards `v1.147.19`, CR `v26.03`. The findings below record the tags that closed them.

**Hits: 2** — both fixed.

## Shiro (`shiro`) — done

- was: FFG `may_corp_pay_net` / “If you do, do 1 net damage”
- now: `may_corp_pay_credits_else_breach` (pay 1¢ or Runner breaches R&D, no root); cards `v1.147.12`, engine `v1.147.40`–`41`
- closed: [cards #268](https://github.com/nhoople/netrunner-cards-data/issues/268), [engine #368](https://github.com/nhoople/netrunner-engine/issues/368)

## Inazuma (`inazuma`) — done

- was: FFG `end_the_run` on the second subroutine
- now: `forbid_jack_out_until_next_encounter`; cards `v1.147.13`, engine `v1.147.42`–`43`
- closed: [cards #269](https://github.com/nhoople/netrunner-cards-data/issues/269), [engine #383](https://github.com/nhoople/netrunner-engine/issues/383)

## Method notes

Ability `text` annotations are sparse; many cards only have kinds. This scan catches prose that contradicts printed. Expand later with kind→printed expectation tables if needed.

## Related (not stale-text)

- Mandatory Seed Replacement cross-server rearrange: engine `v1.147.39` ([#370](https://github.com/nhoople/netrunner-engine/issues/370))
- Rebirth identity switch: engine `v1.147.44` ([#369](https://github.com/nhoople/netrunner-engine/issues/369))
- One-off-kind untested baseline: empty
