---
name: TypeScript 6 LTS step
overview: Step both Node repos to TypeScript 6.0.3 and Node 24 LTS (the current support floor), with the small dependency patches that already fit, and leave TypeScript 7 for later.
todos:
  - id: engine-deps
    content: Bump engine TypeScript to 6.0.3, @types/node to 24.19.1, engines to >=24, and lock the eslint/globals/typescript-eslint/vitest patches
    status: completed
  - id: engine-config
    content: "Add types: [\"node\"] to the engine tsconfig and set CI node-version to 24"
    status: completed
  - id: engine-verify
    content: Run engine lint, typecheck, and tests
    status: completed
  - id: game-deps
    content: Bump game TypeScript to 6.0.3, @types/node to 24.19.1, and engines to >=24
    status: completed
  - id: game-config
    content: "Add types: [\"node\"] to the game tsconfig and set CI node-version to 24"
    status: completed
  - id: game-verify
    content: Run game typecheck and tests
    status: completed
isProject: false
---

# TypeScript 6 and Node 24 LTS

**Status (reviewed 2026-11-11):** done, then superseded on Node. Both repos later moved to `engines.node >=26` and `@types/node ^26`, and CI reads `.node-version` instead of a fixed `"24"`. TypeScript stays on 6; Dependabot is told to ignore TypeScript 7.x (engine PR #266, closed 2026-11-11). Branches now use the `claude/` prefix, not `cursor/`.

Step [netrunner-engine](netrunner-engine) first, then [netrunner-game](netrunner-game). Each repo gets its own `cursor/` branch and pull request. Do not bump the game’s engine pin. Do not move either repo to TypeScript 7.0.2 (`typescript-eslint` still caps TypeScript at `<6.1.0`). Leave `ignoreDeprecations` unset.

Node 24.21.0 (Krypton) is the current LTS. Node 26 stays valid locally because the floor is `>=24`, but CI and `@types/node` stay on 24 so typecheck cannot accept APIs the floor does not have.

## netrunner-engine

In [netrunner-engine/package.json](netrunner-engine/package.json):

- `typescript`: `^5.8.2` to `^6.0.3`
- `@types/node`: `^26.6.3` to `^24.19.1`
- `engines.node`: `>=20` to `>=24`

The existing ranges already allow these lockfile moves: `eslint` 10.11.0 to 10.12.0, `globals` 17.12.0 to 17.13.0, `typescript-eslint` 8.71.0 to 8.71.1, `vitest` 5.0.2 to 5.0.3. `tsx` and `@eslint/js` stay as they are.

In [netrunner-engine/tsconfig.json](netrunner-engine/tsconfig.json), add `"types": ["node"]`. Keep `strict`, `NodeNext`, `rootDir: "src"`, and `target: ES2022`.

In [netrunner-engine/.github/workflows/ci.yml](netrunner-engine/.github/workflows/ci.yml), set `node-version` from `"22"` to `"24"`.

Install, then run the CI checks: `npm run lint`, `npm run typecheck`, `npm test`.

## netrunner-game

In [netrunner-game/package.json](netrunner-game/package.json):

- `typescript`: `^5.8.2` to `^6.0.3`
- `@types/node`: `^22.13.10` to `^24.19.1`
- `engines.node`: `>=20` to `>=24`

`tsx`, `ws`, and `@types/ws` are already current.

In [netrunner-game/tsconfig.json](netrunner-game/tsconfig.json), add the same `"types": ["node"]`.

In [netrunner-game/.github/workflows/ci.yml](netrunner-game/.github/workflows/ci.yml), set `node-version` from `"22"` to `"24"`.

Install, then `npm run typecheck` and `npm test`. Cards and rules CI are Python and stay unchanged.
