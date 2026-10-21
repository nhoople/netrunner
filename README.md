# Netrunner

Unofficial Android: Netrunner rules engine, card data, and Comprehensive Rules data. Solo-maintained with coding agents.

These four repositories are one project. Consume them by release tag.

| Repository | Role | Current pin |
| --- | --- | --- |
| [netrunner-engine](https://github.com/nhoople/netrunner-engine) | Headless rules library: game state, legality, and card effects | [`v1.147.14`](https://github.com/nhoople/netrunner-engine/releases/tag/v1.147.14) |
| [netrunner-cards-data](https://github.com/nhoople/netrunner-cards-data) | JSON card definitions for the engine. Printed text is Null Signal Games reference material | [`v1.147.9`](https://github.com/nhoople/netrunner-cards-data/releases/tag/v1.147.9) |
| [netrunner-comprehensive-rules-data](https://github.com/nhoople/netrunner-comprehensive-rules-data) | Machine-readable Null Signal Games Comprehensive Rules, as JSON and JSONL | [`v26.03`](https://github.com/nhoople/netrunner-comprehensive-rules-data/releases/tag/v26.03) |
| [netrunner-game](https://github.com/nhoople/netrunner-game) | Two-seat web table for playing and verifying the engine | Pins engine `v1.147.14`, cards `v1.147.9`, and Comprehensive Rules `v26.03` |

Engine `v1.147.14` pins cards `v1.147.9` and loads cards by side and type. Cards v1.147.8 restores uniqueness and double-sided identity faces from the source catalog; engine v1.147.12 activates the faceup face (CR 3.1.1a). Cards v1.147.9 declares `onlyDuringOwnTurn` on the 'only during your turn' cards and fixes Drago Ivanov's tag cost to the printed text; engine v1.147.13 enforces paid-ability text timing restrictions in validation, not just in offers (CR 9.5.2f). Engine v1.147.14 adds printed-outcome tests for 92 single-card IR primitives and fixes 16 that failed their card text, including a class that read the top of the deck from the wrong end. Instruction names lead with the Comprehensive Rules word for the procedure. The Comprehensive Rules pin is `v26.03`.
