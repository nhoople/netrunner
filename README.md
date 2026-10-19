# Netrunner

Unofficial Android: Netrunner rules engine, card data, and Comprehensive Rules data. Solo-maintained with coding agents.

These four repositories are one project. Consume them by release tag.

| Repository | Role | Current pin |
| --- | --- | --- |
| [netrunner-engine](https://github.com/nhoople/netrunner-engine) | Headless rules library: game state, legality, and card effects | [`v1.147.9`](https://github.com/nhoople/netrunner-engine/releases/tag/v1.147.9) |
| [netrunner-cards-data](https://github.com/nhoople/netrunner-cards-data) | JSON card definitions for the engine. Printed text is Null Signal Games reference material | [`v1.147.7`](https://github.com/nhoople/netrunner-cards-data/releases/tag/v1.147.7) |
| [netrunner-comprehensive-rules-data](https://github.com/nhoople/netrunner-comprehensive-rules-data) | Machine-readable Null Signal Games Comprehensive Rules, as JSON and JSONL | [`v26.03`](https://github.com/nhoople/netrunner-comprehensive-rules-data/releases/tag/v26.03) |
| [netrunner-game](https://github.com/nhoople/netrunner-game) | Two-seat web table for playing and verifying the engine | Pins engine `v1.147.9`, cards `v1.147.6`, and Comprehensive Rules `v26.03` |

Released engine `v1.147.9` still pins cards `v1.147.6` and loads pack directories. Cards `v1.147.7` stores files by side and type. Instruction names lead with the Comprehensive Rules word for the procedure. The Comprehensive Rules pin is `v26.03`.
