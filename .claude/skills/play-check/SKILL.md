---
name: play-check
description: Play one Learn to play match on a fresh game host and save screenshots of the product client (/play/) for the Corp, the Runner, and a spectator, at phone and desktop widths, at the opening, each new turn, each run, each access, and the end. Writes a contact sheet to look at and attach as proof. Use at the end of a product UI slice, before its PR, when asked to show how the board looks across a match, or to compare the board before and after a change.
---

# /play-check

The script lives in the workspace and drives the game in `netrunner-game` (or a worktree of it):

```
node .claude/skills/play-check/play-check.mjs                     # default: netrunner-game, all seats, both widths
node .claude/skills/play-check/play-check.mjs --game <worktree>   # a worktree of the game
node .claude/skills/play-check/play-check.mjs --out <dir> --seats runner --widths phone
node .claude/skills/play-check/play-check.mjs --policy default    # always take the primary button's intent
```

Options: `--steps` (most intents to submit, default 400), `--seed` (the script's choices; the host shuffles the decks itself, so two runs are not the same match), `--turns`, `--runs`, `--accesses` (how many of each to photograph, defaults 6, 3, 3), `--policy weighted|default|random`, `--build` (rebuild `/play/` first; it builds on its own when `public/play/` is missing).

A run takes about half a minute. Run it with `run_in_background` if you have other work to do meanwhile.

## What it does

1. Starts the game host on a free port with an empty match folder, the way `browser/fixture.ts` does, and creates a match with `POST /matches`.
2. Opens `/play/` for each seat in Chromium. The pages only watch.
3. Plays the match over the host's WebSocket protocol, sending only intents from a seat's own `legal` list. The `weighted` policy favors the default entry, runs, installs, and plays, so a short match still shows runs and accesses.
4. At each checkpoint it screenshots every seat at every width.
5. Writes `index.html` (contact sheet), `summary.json` (result, steps, page errors, checkpoints), `shots/`, and `match/` (the stored match) under the out folder. The default out folder is `netrunner-game/test-results/play-check/`, which is gitignored.

It exits 1 on a crash or any page error or console error.

## If it fails

- **`Cannot find package .../netrunner-engine/dist/index.js`**: the game's local engine copy is not built. Run `npm run fetch-engine && npm run build:engine` in `netrunner-game`.
- **Chromium missing**: `npx playwright install chromium` in `netrunner-game`.
- **`no_legal_action` or `too_many_rejections`**: the host offered nothing or kept refusing what it offered. That is a host or engine finding; say so with the step label from the summary.

## Using the result

- Look at the contact sheet yourself before reporting. Open it in the browser pane, or `Read` single PNGs from `shots/`. Name what is wrong in plain words, using the plan's finding numbers where they fit.
- In a slice's PR, attach the contact sheet's key pictures (or the folder) as the slice's proof. Say which checkpoints show the slice's change.
- For before and after, run once on `master` and once on the branch with different `--out` folders, and compare the same checkpoint names.

## What it does not cover

It does not click the board. The plan's played match through `/play/` by hand (both seats, in the browser pane) still checks the interaction: clicking and dragging, the primary button, and the space bar. This skill covers how every seat sees a whole match at both widths. It also does not check visibility; the visibility fuzz and the `seat-view-checker` agent do that.
