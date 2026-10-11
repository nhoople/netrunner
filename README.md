# Netrunner

Unofficial Android: Netrunner rules engine, card data, and Comprehensive Rules data. Solo-maintained with coding agents.

These four repositories are one project. Consume them by release tag.

| Repository | Role | Current pin |
| --- | --- | --- |
| [netrunner-engine](https://github.com/nhoople/netrunner-engine) | Headless rules library: game state, legality, and card effects | [`v1.145.0`](https://github.com/nhoople/netrunner-engine/releases/tag/v1.145.0) |
| [netrunner-cards-data](https://github.com/nhoople/netrunner-cards-data) | JSON card definitions for the engine. Printed text is Null Signal Games reference material | [`v1.145.0`](https://github.com/nhoople/netrunner-cards-data/releases/tag/v1.145.0) |
| [netrunner-comprehensive-rules-data](https://github.com/nhoople/netrunner-comprehensive-rules-data) | Machine-readable Null Signal Games Comprehensive Rules, as JSON and JSONL | [`v26.03`](https://github.com/nhoople/netrunner-comprehensive-rules-data/releases/tag/v26.03) |
| [netrunner-game](https://github.com/nhoople/netrunner-game) | Two-seat web table for playing and verifying the engine | Pins the three releases above |

Pair netrunner-engine and netrunner-cards-data on the same version tag. The Comprehensive Rules pin is `v26.03`.
