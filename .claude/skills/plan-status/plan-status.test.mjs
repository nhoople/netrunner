// The plan check fails on each way a plan used to drift: run with `node --test .claude/skills/plan-status/`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readPlan, readPlans, readRoadmap } from './plan-status.mjs';

const GOOD = `# A plan

*Drafted 2026-11-22.*

## Where it stands

**Status:** active. Updated 2026-11-22.

S1 is done. S2 is next.

## Waiting on you

- **Which colour?** It sets the board. Recommended: blue. Blocks: S2.

## Slices

| ID | Slice | Status | PR | What it does |
|---|---|---|---|---|
| S1 | **First** | done | game #1 | One |
| S2 | **Second** | next | | Two |

## Findings

| Area | Finding | Status |
|---|---|---|
| 1 | A bug | open |
| 1 | ~~Another~~ | fixed |

## Not yet decided

- **Later question.** Blocks S2.

## Done

It works.
`;

function plan(text) {
  const dir = mkdtempSync(join(tmpdir(), 'plan-status-'));
  const file = join(dir, 'a-plan.md');
  writeFileSync(file, text);
  return readPlan(file);
}

const problems = (text) => plan(text).problems.join('\n');

test('a plan in the format reads cleanly', () => {
  const p = plan(GOOD);
  assert.deepEqual(p.problems, []);
  assert.equal(p.status, 'active');
  assert.equal(p.summary, 'S1 is done. S2 is next.');
  assert.deepEqual(p.slices.map((s) => [s.id, s.name, s.status, s.pr]), [
    ['S1', 'First', 'done', 'game #1'],
    ['S2', 'Second', 'next', ''],
  ]);
  assert.equal(p.waiting[0].question, 'Which colour?');
  assert.equal(p.waiting[0].recommended, 'blue');
  assert.deepEqual([p.findings.open, p.findings.fixed], [1, 1]);
});

test('a "*Revised" history line fails', () => {
  assert.match(problems(GOOD.replace('*Drafted 2026-11-22.*', '*Drafted 2026-11-22.*\n\n*Revised 2026-11-23: did a thing.*')), /Revised/);
});

test('a crossed-out question under "Not yet decided" fails', () => {
  assert.match(problems(GOOD.replace('- **Later question.**', '- ~~**Later question.**~~ Decided.')), /crossed-out/);
});

test('a missing or unknown status fails', () => {
  assert.match(problems(GOOD.replace('**Status:** active. Updated 2026-11-22.', 'Status: going well.')), /Status:\*\* <status>/);
  assert.match(problems(GOOD.replace('**Status:** active.', '**Status:** busy.')), /plan status "busy"/);
});

test('a slice with an unknown status, or done with no PR, fails', () => {
  assert.match(problems(GOOD.replace('| S2 | **Second** | next |', '| S2 | **Second** | half done |')), /status "half done"/);
  assert.match(problems(GOOD.replace('| done | game #1 |', '| done | |')), /done but names no PR/);
});

test('a question waiting on Nathaniel needs a recommended answer', () => {
  assert.match(problems(GOOD.replace(' Recommended: blue.', '')), /Recommended/);
});

test('a findings row needs a status', () => {
  assert.match(problems(GOOD.replace('| 1 | A bug | open |', '| 1 | A bug | maybe |')), /status "maybe"/);
});

test('the required sections are there, in order', () => {
  assert.match(problems(GOOD.replace('## Waiting on you\n\n- **Which colour?** It sets the board. Recommended: blue. Blocks: S2.\n', '')), /Waiting on you/);
  assert.match(problems(GOOD.replace('## Done\n\nIt works.\n', '')), /"## Done"/);
});

test('a plan with no slices yet must say it has not started', () => {
  const noSlices = GOOD.replace(/## Slices[\s\S]*?## Findings/, '## Findings');
  assert.match(problems(noSlices), /not started/);
  assert.equal(problems(noSlices.replace('**Status:** active.', '**Status:** not started.')), '');
});

test('findings can live in docs/plans/<plan>/findings.md', () => {
  const dir = mkdtempSync(join(tmpdir(), 'plan-status-'));
  writeFileSync(join(dir, 'a-plan.md'), GOOD.replace(/## Findings[\s\S]*?## Not yet decided/, '## Not yet decided'));
  mkdirSync(join(dir, 'a-plan'));
  writeFileSync(join(dir, 'a-plan', 'findings.md'), '| Area | Finding | Status |\n|---|---|---|\n| 2 | X | open |\n| 2 | Y | dropped |\n');
  const [p] = readPlans(dir);
  assert.deepEqual([p.findings.open, p.findings.dropped], [1, 1]);
});

test('a wrapped "Waiting on you" bullet keeps its continuation lines', () => {
  const p = plan(GOOD.replace('- **Which colour?** It sets the board. Recommended: blue. Blocks: S2.',
    '- **Which colour?** It sets the board\n  and the cards. Recommended: blue, e.g. navy. Blocks: S2.'));
  assert.deepEqual(p.problems, []);
  assert.equal(p.waiting[0].recommended, 'blue, e.g. navy');
  assert.match(p.waiting[0].detail, /and the cards/);
});

test('asterisks inside code spans survive', () => {
  const p = plan(GOOD.replace('S1 is done. S2 is next.', 'S1 moved `src/**/*.ts`. S2 is next.'));
  assert.equal(p.summary, 'S1 moved src/**/*.ts. S2 is next.');
});

test('headings and tables inside a code fence are text', () => {
  const p = plan(GOOD.replace('## Done', '```markdown\n## Slices\n\n| ID | Status |\n|---|---|\n| Z | nonsense |\n```\n\n## Done'));
  assert.deepEqual(p.problems, []);
  assert.equal(p.slices.length, 2);
});

test('two sections with the same name fail', () => {
  assert.match(problems(GOOD.replace('## Done', '## Findings\n\nMore.\n\n## Done')), /two "## Findings"/);
});

const ROADMAP = `# Roadmap

## Where it stands

**Status:** active. Updated 2026-11-27.

The layout plan runs.

## Waiting on you

Nothing.

## Order of work

1. [Old work](plans/done/old-work.md), finished.
2. [The plan](plans/a-plan.md): the one running.
3. The casual queue. Its plan is written later.

## Decisions

| Date | Decision | Reason |
|---|---|---|
| 2026-11-27 | Public | Built for it |

## Not yet decided

- **Queue formats.** Blocks: the queue.
`;

function roadmap(text, planText = GOOD) {
  const dir = mkdtempSync(join(tmpdir(), 'plan-status-'));
  mkdirSync(join(dir, 'plans'));
  writeFileSync(join(dir, 'plans', 'a-plan.md'), planText);
  writeFileSync(join(dir, 'roadmap.md'), text);
  return readRoadmap(join(dir, 'roadmap.md'), readPlans(join(dir, 'plans')));
}

test('the roadmap reads its path to version 1 from "Order of work"', () => {
  const r = roadmap(ROADMAP);
  assert.deepEqual(r.problems, []);
  assert.equal(r.status, 'active');
  assert.deepEqual(r.path.map((s) => [s.step, s.label, s.plan, s.status, s.current]), [
    [1, 'Old work', 'old-work', 'done', false],
    [2, 'A plan', 'a-plan', 'active', true],
    [3, 'The casual queue', null, 'not written', false],
  ]);
});

test('a roadmap question waiting on Nathaniel reaches the page', () => {
  const r = roadmap(ROADMAP.replace('## Waiting on you\n\nNothing.', '## Waiting on you\n\n- **Which formats?** For the queue. Recommended: all five.'));
  assert.deepEqual(r.problems, []);
  assert.deepEqual([r.waiting[0].plan, r.waiting[0].question, r.waiting[0].recommended], ['roadmap', 'Which formats?', 'all five']);
});

test('the roadmap keeps its sections, in order', () => {
  assert.match(roadmap(ROADMAP.replace(/## Decisions[\s\S]*?## Not yet decided/, '## Not yet decided')).problems.join('\n'), /"## Decisions"/);
  assert.match(roadmap(ROADMAP.replace(/## Order of work[\s\S]*?## Decisions/, '## Decisions')).problems.join('\n'), /"## Order of work"/);
  assert.match(roadmap(ROADMAP.replace('**Status:** active. Updated 2026-11-27.', 'Going well.')).problems.join('\n'), /Status:\*\* <status>/);
});

test('a roadmap step that links a missing plan, or a misnumbered step, fails', () => {
  assert.match(roadmap(ROADMAP.replace('plans/a-plan.md', 'plans/no-such-plan.md')).problems.join('\n'), /no-such-plan/);
  assert.match(roadmap(ROADMAP.replace('3. The casual queue', '4. The casual queue')).problems.join('\n'), /out of order/);
});

test('an undated decision or a crossed-out open question fails', () => {
  assert.match(roadmap(ROADMAP.replace('| 2026-11-27 | Public |', '| soon | Public |')).problems.join('\n'), /no YYYY-MM-DD date/);
  assert.match(roadmap(ROADMAP.replace('- **Queue formats.**', '- ~~**Queue formats.**~~')).problems.join('\n'), /crossed-out/);
});
