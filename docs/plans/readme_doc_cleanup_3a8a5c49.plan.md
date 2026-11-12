---
name: README doc cleanup
overview: "Fork Null-Signal-Games/netrunner-cards-json and open one pull request that updates README.md: replace the dead Travis badge, correct the stale v2 section, and add a short contributing note that matches the current scripts and CI."
todos:
  - id: fork-clone
    content: Fork and clone into ~/Projects/netrunner-cards-json, then move the agent into that repo
    status: completed
  - id: readme
    content: "Update README.md: Actions badge, v2 section, contributing note, and the two copy fixes"
    status: completed
  - id: pr
    content: Open a docs-only pull request against Null-Signal-Games/netrunner-cards-json main
    status: completed
isProject: false
---

# README cleanup for netrunner-cards-json

**Status (reviewed 2026-11-11):** the PR was opened as [Null-Signal-Games/netrunner-cards-json#999](https://github.com/Null-Signal-Games/netrunner-cards-json/pull/999) and closed without merging on 2026-10-09, with no comment. The README fix is not upstream.

Contribute a docs-only pull request to [Null-Signal-Games/netrunner-cards-json](https://github.com/Null-Signal-Games/netrunner-cards-json). No card JSON, tests, or git history changes. You do not have a fork yet, and you do not have write access, so stale upstream branches stay as a maintainer task.

## What is wrong

[`README.md`](https://github.com/Null-Signal-Games/netrunner-cards-json/blob/main/README.md) still describes the old Alsciende / Travis / `master` setup, and the v2 note points at a file that no longer exists.

- Build badge links to `travis-ci.org/Alsciende/netrunner-cards-json` on `master`. CI is [`.github/workflows/ci.yml`](https://github.com/Null-Signal-Games/netrunner-cards-json/blob/main/.github/workflows/ci.yml): on pull requests and pushes to `main` it runs `npm run format-check`, `npm run lint`, `npm run build`, and `npm run test`.
- “Unstable Changes” says new work lives in `v2/set_types.json`. That path is gone. The file is [`v2/card_set_types.json`](https://github.com/Null-Signal-Games/netrunner-cards-json/blob/main/v2/card_set_types.json). v2 is the active model (`v2/cards`, `v2/printings`, `v2/formats`, `v2/restrictions`, `v2/translations`). The property lists below that section still describe the v1 files at the repo root (`cycles.json`, `packs.json`, `pack/`).
- There is no contributing section. [`package.json`](https://github.com/Null-Signal-Games/netrunner-cards-json/blob/main/package.json) scripts are `format`, `format-check`, `lint`, and `test`.
- Small copy errors in the same file: “Faction this cards belongs to”, and “Wireless Net Pavillion”.

Leave the v1 field list in place. It still matches the root JSON. Do not document every v2 field in this PR; point readers at `schema/v2/` as the source of truth.

`package.json` still lists `repository` as `NetrunnerDB/netrunner-cards-json` and the npm name is `@project-nisei/netrunner-cards-json`. Leave that alone so this PR stays documentation.

## Changes in README.md

- Replace the Travis badge with the GitHub Actions badge for `ci.yml` on `main`.
- Replace “Unstable Changes” with a short “v2 data” section: v2 is the current card data; the schema lists that follow are for the v1 files; `v2/card_set_types.json` is the set-type list; schemas live under `schema/v2/`.
- Add a short Contributing section: fork, branch from `main`, `npm install`, then `npm run format-check`, `npm run lint`, and `npm run test` before opening a pull request. Note that CI runs those plus `npm run build`.
- Fix the two copy errors above. If the UTF-8 converter URL in the editing tips no longer resolves, drop that specific link and keep the advice that raw UTF-8 is allowed.

## How we will land it

- Create `~/Projects` (neither `~/Projects` nor `~/Developer` exists), fork `Null-Signal-Games/netrunner-cards-json` as `nhoople/netrunner-cards-json`, and clone it to `~/Projects/netrunner-cards-json`.
- Call `move_agent_to_root` into that clone before editing.
- Branch from `main`, edit only `README.md`, and open a pull request against `Null-Signal-Games/netrunner-cards-json` `main`.
