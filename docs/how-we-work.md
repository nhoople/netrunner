# How we work

This project has one maintainer, who is not a software engineer, and coding agents do the engineering. The maintainer owns the goals, the decisions, and whether a result is accepted. The agents own the code, the tests, and the reviews. This page describes how the two divide each piece of work. Releases, branches, and the end-of-session sync are in [`git-hygiene.md`](git-hygiene.md). What to build next is in the [roadmap](roadmap.md).

## Why this page exists

Three engine programs in a row were cleanup of work that came before them. Cards were first built one at a time, often each with its own copy of a procedure. The [fidelity program](plans/done/full-cr-fidelity-program.md) then standardized timing, the [standardization program](plans/done/engine-standardization-program.md) standardized continuous effects, and the [CR audit program](plans/cr-audit-standardization-program.md) standardizes how cards move between zones. The CR audit's own "Why" section says the copies skip parts of the CR.

Agents take the shortest path that passes the tests. They do not stop to ask whether three cards should share one procedure unless the plan makes them. So the loop below adds steps before building (decide, and name the shared pieces) and after it (prove the result in a way the maintainer can see, and turn corrections into checks).

## The loop

Each piece of work goes through five stages: decide, plan, build, prove, sustain. Small fixes can skip the first two. A new plan in `docs/plans/` cannot.

| Stage | What happens | The maintainer | The agents | Done when |
|---|---|---|---|---|
| 1. Decide | Claude interviews the maintainer with the [`grill` skill](../.claude/skills/grill/SKILL.md) until no open question is left unasked | Answers each question, usually by accepting the recommended answer | Look up facts (CR text, cards, current code) before asking, and recommend an answer to every question | The plan's "Decisions for a human" is filled in, and "Not yet decided" holds only what was knowingly put off |
| 2. Plan | The plan names its slices and the shared pieces they build on | Approves the plan by what it promises, not how it is built | Write the plan in the format below. For engine work, name each shared procedure and the CR rule it follows before any card uses it | The maintainer approves the plan |
| 3. Build | One slice per session, with tests, `cr-checker` for rules changes, and a PR | Nothing, unless a session stops on a decision | Follow [`CLAUDE.md`](../CLAUDE.md) and [`git-hygiene.md`](git-hygiene.md) | The PR is merged and CI passes |
| 4. Prove | The slice is shown working in a way the maintainer can check without reading code | Looks, plays, and accepts or rejects | Show a played match, a screenshot, the verification table, or a test whose name says the behavior in plain words | The maintainer accepts it |
| 5. Sustain | A mistake that happens twice becomes a check that fails | Says so when correcting the same thing twice | Fix the mistake, then add a test, hook, or lint that fails on it | The check is merged, and the prose rule it replaces is deleted |

### 1. Decide

Grilling works through a plan as a tree of decisions, one round at a time. Each round asks only the questions whose prerequisites are settled. Each question carries a recommended answer, and "yes" accepts it. Facts are the agents' job: a question about what the CR says, what a card does, or what the code does now is looked up, not asked. Decisions are the maintainer's.

An open question that a subagent can settle alone (a CR reading, a code search, a measurement) is settled before the maintainer is asked anything. Only product, scope, and priority calls reach the maintainer.

### 2. Plan

A plan in `docs/plans/` has these sections, in this order. Leave out a section that has nothing in it, except "Done".

| Section | Holds |
|---|---|
| Why | The problem and what it serves |
| Shared pieces | For engine work: each procedure the slices share, the one function that owns it, and the CR rule it follows. For product work: each screen or model the slices share. Slices call these; they do not copy them |
| Slices | Each unit of work, sized for one session, and the order they run in |
| Decisions for a human | Each decision made, its date, and the reason, with CR citations where they apply |
| Not yet decided | Questions known to be open but not yet sharp enough to answer, and which slice they block. A slice that reaches one stops and grills it |
| Tests | What each slice must test, and the proof the maintainer will see |
| Out of scope | What this plan will not do, so a session does not drift into it |
| Done | What is true when the plan is finished. Then the plan moves to `docs/plans/done/` |

### 3. Build

Unchanged from today: one fresh session per slice, a test for the behavior in the repo that owns it, `cr-checker` before an engine rules commit, and a `claude/*` PR. The rules are in [`CLAUDE.md`](../CLAUDE.md).

#### Model and effort

A session started by another session gets the same model and effort as the one that started it, unless the starter picks lower. It can never pick higher. So a coordinator runs at the highest level any of its slices needs, and picks lower from this table when it starts each slice.

| Work | Model | Effort |
|---|---|---|
| Coordinating a plan, grilling, engine rules slices, CR audit areas | Opus | high |
| Game and UI slices, card data, plans and other docs | Opus | high |
| `/sync`, the monthly health check, read-only searches and counts | Sonnet | medium |

The Sonnet row is for speed, not cost: that work is mechanical and finishes sooner on a faster model.

- A forked session always keeps the starter's model and effort. Only a fresh session can be started lower.
- A cloud session uses its cloud environment's settings, not this table.
- A subagent does not follow its session's effort. Its model and effort come from its definition in `.claude/agents/`, so set both there when they matter. `cr-checker` pins Opus at high.

#### Findings

A finding is anything a session notices that its slice did not set out to change: a bug, a gap against the CR, a stale doc, a check that should exist. The slice's PR does not fix it, so each PR still does only what its slice promised. Each finding goes to exactly one of these:

| Where it goes | When | What the session does |
|---|---|---|
| Fix now, in a session of its own | A card marked supported plays wrong in normal use, or a seat can see information it should not (CR 1.21, 10.2.2a) | Proposes a new session for the fix. This is the only kind of finding the maintainer is asked about, because it starts work |
| Filed | Anything else worth doing | Rules gaps go in the [CR audit](plans/cr-audit-standardization-program.md) findings table under their area, with the source and CR number. Other findings go under "Not yet decided" in the plan that owns that area, or on the [roadmap](roadmap.md) if no plan does |
| Dropped | Not worth doing, or already covered | Nothing beyond the PR line below |

Every PR lists its findings in a "Found, not fixed" section: each one, where it went, and why. The engine's dead code sweep ([engine #937](https://github.com/nhoople/netrunner-engine/pull/937)) is the model. Its "Kept on purpose" table found four supported currents with no effect in play, which went to a fix-now session.

Why only two kinds of finding get fixed right away: fixing one copy of a procedure turns up the copies next to it, so fixing each finding as it appears does not converge. The CR audit's per-area recipe replaces all the copies with one shared helper. When an area lands, compare how many of its findings were filed with how many were fixed. The filed rate should drop afterward.

### 4. Prove

"The tests pass" is the agents' bar. The maintainer's bar is seeing it work. Every slice ends with one of these, named in its PR:

- A match, or the part of one that the slice changed, played through `/play/` or the verification table.
- A screenshot or short recording, before and after.
- A test whose name states the behavior in plain words, such as "the Runner cannot tell a rez cost from whether the game pauses".

### 5. Sustain

A rule written in [`CLAUDE.md`](../CLAUDE.md) works only if the agent reads it and obeys. A check works every time. When the same correction happens twice, the agent fixes the mistake and then makes it fail automatically, in this order of preference:

1. Change the structure so the mistake cannot be written. For example, one shared function, with the old copies deleted.
2. A type, lint, or test that fails and names the right thing to use. [`tests/effect-ir-names.test.ts`](https://github.com/nhoople/netrunner-engine/blob/master/tests/effect-ir-names.test.ts) in the engine is the model.
3. A hook in `.claude/hooks/` that reminds a session at the moment it goes wrong, like `lsp-nudge` and `wait-nudge`.
4. Text in `CLAUDE.md`, only for judgment calls nothing can check.

When a check replaces a rule in `CLAUDE.md`, delete the rule. `CLAUDE.md` should get shorter over time.

## Monthly health check

Once a month, a session collects these numbers and adds a dated row to [`health.md`](health.md), which also says how to collect each one. A number that keeps growing is an early warning that the maintainer can read without reading code.

| Number | Where it comes from | Healthy direction |
|---|---|---|
| Primitive kinds defined, and kinds used by card JSON | `KNOWN_PRIMITIVE_KINDS` in the engine, and the card data | The two move closer together |
| Dead kinds | The engine's kind-liveness baseline | Shrinking |
| The five largest engine source files, in lines | `netrunner-engine/src` | Not growing |
| Engine test files and CI run time | The engine's tests and its latest CI run | Tests grow, CI time stays level |
| Copies of a procedure the CR audit has standardized | The audit's guards | Zero |
| Rules in `CLAUDE.md` that a check now enforces | `CLAUDE.md` against the tests and hooks | Zero, because they get deleted |

## What we do not do

- No team process (sprints, stand-ups, story points). It coordinates people, and this project's limits are the maintainer's decisions and the proof they can check.
- No change to the four-repository, release-by-tag model. See [`CLAUDE.md`](../CLAUDE.md).
- No new plan without stage 1 and a "Shared pieces" section.
