# Netrunner

Unofficial Android: Netrunner rules engine, card data, and Comprehensive Rules data, plus a web table to play on them. Solo-maintained with coding agents.

These four repositories are one project. Each is consumed by release tag, never by `master`. This table is the record of which versions go together.

| Repository | Role | Current pin |
| --- | --- | --- |
| [netrunner-engine](https://github.com/nhoople/netrunner-engine) | Headless rules library: game state, legality, and card effects | [`v1.147.252`](https://github.com/nhoople/netrunner-engine/releases/tag/v1.147.252) |
| [netrunner-cards-data](https://github.com/nhoople/netrunner-cards-data) | JSON card definitions for the engine. Printed text is Null Signal Games reference material | [`v1.147.22`](https://github.com/nhoople/netrunner-cards-data/releases/tag/v1.147.22) |
| [netrunner-comprehensive-rules-data](https://github.com/nhoople/netrunner-comprehensive-rules-data) | Machine-readable Null Signal Games Comprehensive Rules, as JSON and JSONL | [`v26.03`](https://github.com/nhoople/netrunner-comprehensive-rules-data/releases/tag/v26.03) |
| [netrunner-game](https://github.com/nhoople/netrunner-game) | Verification table and the product client at `/play/`. A restart replays the applied-intent log | Pins engine `v1.147.252`, cards `v1.147.22`, and Comprehensive Rules `v26.03` |

## Status

Product Phase 5 (local table and `/play/`) is done. Next is **Phase 6, a Discord Activity**. The card corpus is idle until the next Null Signal Games pack or a Comprehensive Rules update. See the [roadmap](docs/roadmap.md).

## What is in this repo

| Path | Contents |
| --- | --- |
| [`docs/roadmap.md`](docs/roadmap.md) | Product phases, engine fidelity, and what is next |
| [`docs/git-hygiene.md`](docs/git-hygiene.md) | Branches, pull requests, releases, and the end-of-session sync |
| [`docs/plans/`](docs/plans/) | Active long-running plans; finished ones are in [`docs/plans/done/`](docs/plans/done/) |
| [`docs/history.md`](docs/history.md) | How the floor got here, release by release |
| [`docs/format-coverage-audit.md`](docs/format-coverage-audit.md) | Which formats the card corpus covers |
| [`CLAUDE.md`](CLAUDE.md), [`.claude/`](.claude/) | Instructions, agents, skills, and settings for Claude Code sessions |

## Releases

Release notes live on each repository's GitHub Releases page. An engine `src/` change ships as a maintenance release, and the game's pin and this table move with it. Test-only and docs-only changes do not release. The full policy is in [`docs/git-hygiene.md`](docs/git-hygiene.md#releases).

## Legal

Unofficial and not affiliated with Null Signal Games. Card text and the Comprehensive Rules are Null Signal Games reference material; see each data repository's `NOTICE`. Code is MIT ([LICENSE](LICENSE)).
