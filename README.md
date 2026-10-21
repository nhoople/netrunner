# Netrunner

Unofficial Android: Netrunner rules engine, card data, and Comprehensive Rules data. Solo-maintained with coding agents.

These four repositories are one project. Consume them by release tag.

| Repository | Role | Current pin |
| --- | --- | --- |
| [netrunner-engine](https://github.com/nhoople/netrunner-engine) | Headless rules library: game state, legality, and card effects | [`v1.147.12`](https://github.com/nhoople/netrunner-engine/releases/tag/v1.147.12) |
| [netrunner-cards-data](https://github.com/nhoople/netrunner-cards-data) | JSON card definitions for the engine. Printed text is Null Signal Games reference material | [`v1.147.8`](https://github.com/nhoople/netrunner-cards-data/releases/tag/v1.147.8) |
| [netrunner-comprehensive-rules-data](https://github.com/nhoople/netrunner-comprehensive-rules-data) | Machine-readable Null Signal Games Comprehensive Rules, as JSON and JSONL | [`v26.03`](https://github.com/nhoople/netrunner-comprehensive-rules-data/releases/tag/v26.03) |
| [netrunner-game](https://github.com/nhoople/netrunner-game) | Two-seat web table for playing and verifying the engine | Pins engine `v1.147.12`, cards `v1.147.8`, and Comprehensive Rules `v26.03` |

Engine `v1.147.12` pins cards `v1.147.8` and loads cards by side and type. Cards v1.147.8 restores uniqueness and double-sided identity faces from the source catalog; engine v1.147.12 activates the faceup face (CR 3.1.1a). Instruction names lead with the Comprehensive Rules word for the procedure. The Comprehensive Rules pin is `v26.03`.
