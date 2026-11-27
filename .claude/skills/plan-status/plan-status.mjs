#!/usr/bin/env node
// Reads the roadmap (docs/roadmap.md) and the active plans in docs/plans/*.md,
// and reports where each stands.
// The plan format is in docs/how-we-work.md (Plan). This script is the one
// reader of it: the plan check in CI, the progress visual in chat, and the
// pinned status page all come from here.
//
//   node .claude/skills/plan-status/plan-status.mjs           JSON on stdout
//   node .claude/skills/plan-status/plan-status.mjs --check   fail on format problems
//   node .claude/skills/plan-status/plan-status.mjs --out DIR write DIR/plan-status.json
//        (plans, slices, waiting, findings, path) for the status page
//   --plans DIR reads another folder, and the roadmap.md beside it

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');

export const PLAN_STATUSES = ['not started', 'active', 'paused', 'done'];
export const SLICE_STATUSES = ['done', 'running', 'next', 'to do', 'dropped'];
export const FINDING_STATUSES = ['open', 'fixed', 'dropped'];
const REQUIRED = ['Where it stands', 'Waiting on you', 'Done'];

// Markdown to plain text, for labels.
export function plain(s) {
  // Code spans are set aside first, so asterisks inside them (`src/**/*.ts`) survive.
  const code = [];
  return s
    .replace(/`([^`]*)`/g, (_, c) => `\u0000${code.push(c) - 1}\u0000`)
    .replace(/~~/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1$2')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/\u0000(\d+)\u0000/g, (_, i) => code[i])
    .trim();
}

const FENCE = /^\s*(```|~~~)/;

function splitRow(line) {
  const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/);
  return cells.map((c) => c.trim());
}

// Sections by "## " heading; each holds its lines, with "### " groups kept inline.
// Headings inside code fences are text. A name used twice is listed in out.duplicates.
function sections(text) {
  const out = new Map();
  out.duplicates = [];
  let name = null;
  let fenced = false;
  for (const line of text.split('\n')) {
    if (FENCE.test(line)) fenced = !fenced;
    const h = !fenced && /^## (.+?)\s*$/.exec(line);
    if (h) {
      name = h[1];
      if (out.has(name)) out.duplicates.push(name);
      else out.set(name, []);
    } else if (name) out.get(name).push(line);
  }
  return out;
}

// Tables in a block of lines, each tagged with the nearest "### " heading above it.
function tables(lines, defaultGroup) {
  const found = [];
  let group = defaultGroup;
  let i = 0;
  let fenced = false;
  while (i < lines.length) {
    if (FENCE.test(lines[i])) fenced = !fenced;
    if (fenced) {
      i++;
      continue;
    }
    const h = /^### (.+?)\s*$/.exec(lines[i]);
    if (h) group = plain(h[1]);
    if (/^\|/.test(lines[i]) && i + 1 < lines.length && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const header = splitRow(lines[i]).map(plain);
      const rows = [];
      let j = i + 2;
      while (j < lines.length && /^\|/.test(lines[j])) {
        rows.push({ cells: splitRow(lines[j]), line: j });
        j++;
      }
      found.push({ group, header, rows, line: i });
      i = j;
      continue;
    }
    i++;
  }
  return found;
}

function col(header, names) {
  return header.findIndex((h) => names.includes(h.toLowerCase()));
}

// "Where it stands": the status line, then a short paragraph.
function readWhere(secs, problems) {
  let status = null;
  let updated = null;
  let summary = '';
  const where = secs.get('Where it stands');
  if (where) {
    const body = where.join('\n').trim();
    const m = /^\*\*Status:\*\* ([a-z ]+)\. Updated (\d{4}-\d{2}-\d{2})\.\s*$/m.exec(body);
    if (!m) {
      problems.push('"Where it stands" needs a line "**Status:** <status>. Updated YYYY-MM-DD."');
    } else {
      status = m[1];
      updated = m[2];
      if (!PLAN_STATUSES.includes(status)) problems.push(`plan status "${status}" is not one of: ${PLAN_STATUSES.join(', ')}`);
      summary = plain(body.replace(m[0], ''));
    }
    const words = summary.split(' ').filter(Boolean).length;
    if (words > 120) problems.push(`"Where it stands" is ${words} words; keep it to a short paragraph (120 at most)`);
  }
  return { status, updated, summary };
}

// "Waiting on you": bullets with a bold question and a recommended answer, or "Nothing."
function readWaiting(secs, slug, problems) {
  const waiting = [];
  const wait = secs.get('Waiting on you');
  if (!wait) return waiting;
  const body = wait.join('\n').trim();
  // A bullet runs on through its indented continuation lines.
  const items = [];
  for (const l of body.split('\n')) {
    if (/^- /.test(l)) items.push(l);
    else if (items.length && /^\s+\S/.test(l)) items[items.length - 1] += ' ' + l.trim();
  }
  if (!items.length && body !== 'Nothing.') problems.push('"Waiting on you" holds bullets, or the one word "Nothing."');
  for (const item of items) {
    if (/~~/.test(item)) problems.push('"Waiting on you" has a crossed-out item; move the answer to "Decisions for a human" and delete it here');
    const q = /^- \*\*(.+?)\*\*\s*(.*)$/.exec(item);
    if (!q) {
      problems.push(`"Waiting on you" item does not start with a bold question: ${item.slice(0, 60)}`);
      continue;
    }
    // The answer runs from "Recommended:" to the sentence end before "Blocks:", or to the end.
    const rec = /Recommended: (.+?)[.!?]?(?=\s+Blocks:|\s*$)/.exec(q[2]);
    if (!rec) problems.push(`"Waiting on you" item has no "Recommended: …." answer: ${plain(q[1]).slice(0, 60)}`);
    waiting.push({ plan: slug, question: plain(q[1]), detail: plain(q[2]), recommended: rec ? plain(rec[1]) : '' });
  }
  return waiting;
}

// Sections in the order a plan needs them first; also used by the roadmap.
function checkOrderAndRequired(secs, required, problems) {
  for (const name of secs.duplicates) problems.push(`two "## ${name}" sections; give one another name`);
  for (const name of required) {
    if (!secs.has(name)) problems.push(`no "## ${name}" section`);
  }
  const order = [...secs.keys()];
  if (order[0] !== 'Where it stands') problems.push('"## Where it stands" must be the first section');
  if (order[1] !== 'Waiting on you') problems.push('"## Waiting on you" must come right after "Where it stands"');
}

function checkNotYetDecided(secs, problems) {
  const nyd = secs.get('Not yet decided');
  if (nyd && nyd.some((l) => /^- .*~~/.test(l))) {
    problems.push('"Not yet decided" has crossed-out items; decided ones belong in "Decisions for a human" only');
  }
}

export function readPlan(file) {
  const text = readFileSync(file, 'utf8');
  const slug = basename(file, '.md');
  const problems = [];
  const title = plain((/^# (.+)$/m.exec(text) || [, slug])[1]);
  const secs = sections(text);

  checkOrderAndRequired(secs, REQUIRED, problems);

  text.split('\n').forEach((line, n) => {
    if (/^\*Revised \d{4}-\d{2}-\d{2}/.test(line)) {
      problems.push(`line ${n + 1}: a "*Revised" history line. Rewrite "Where it stands" instead; history is in git and the PRs`);
    }
  });

  const { status, updated, summary } = readWhere(secs, problems);
  const waiting = readWaiting(secs, slug, problems);

  // Not yet decided: open questions only.
  checkNotYetDecided(secs, problems);

  // Slices
  const slices = [];
  const sl = secs.get('Slices');
  const sliceTables = sl ? tables(sl, 'Slices').filter((t) => col(t.header, ['status']) >= 0) : [];
  if (!sliceTables.length && status !== 'not started') {
    problems.push('"## Slices" needs at least one table with a Status column (a plan with no slices yet is "not started")');
  }
  for (const t of sliceTables) {
    const si = col(t.header, ['status']);
    const pi = col(t.header, ['pr', 'prs']);
    // The first column is the id; a later Slice, Session, Area or Name column is its name.
    const ni = col(t.header, ['slice', 'session', 'area', 'name']);
    for (const r of t.rows) {
      const s = plain(r.cells[si] || '').toLowerCase();
      if (!SLICE_STATUSES.includes(s)) {
        problems.push(`slice "${plain(r.cells[0])}" has status "${s}", not one of: ${SLICE_STATUSES.join(', ')}`);
      }
      if (s === 'done' && pi >= 0 && !plain(r.cells[pi] || '')) {
        problems.push(`slice "${plain(r.cells[0])}" is done but names no PR`);
      }
      slices.push({
        plan: slug,
        group: t.group,
        id: plain(r.cells[0]),
        name: ni > 0 ? plain(r.cells[ni] || '') : '',
        status: s,
        pr: pi >= 0 ? plain(r.cells[pi] || '') : '',
        order: slices.length,
      });
    }
  }

  // Findings: a "## Findings" section, or docs/plans/<slug>/findings.md.
  const findings = { open: 0, fixed: 0, dropped: 0, byGroup: {} };
  const sources = [];
  if (secs.has('Findings')) sources.push(secs.get('Findings'));
  const side = join(dirname(file), slug, 'findings.md');
  if (existsSync(side)) sources.push(readFileSync(side, 'utf8').split('\n'));
  for (const lines of sources) {
    for (const t of tables(lines, 'Findings')) {
      const si = col(t.header, ['status']);
      if (si < 0) {
        problems.push(`a findings table (line ${t.line + 1}) has no Status column`);
        continue;
      }
      for (const r of t.rows) {
        const s = plain(r.cells[si] || '').toLowerCase();
        if (!FINDING_STATUSES.includes(s)) {
          problems.push(`finding "${plain(r.cells[0]).slice(0, 40)}" has status "${s}", not one of: ${FINDING_STATUSES.join(', ')}`);
          continue;
        }
        findings[s]++;
        const g = plain(r.cells[0]);
        findings.byGroup[g] ??= { open: 0, fixed: 0, dropped: 0 };
        findings.byGroup[g][s]++;
      }
    }
  }

  return { slug, file: `docs/plans/${slug}.md`, title, status, updated, summary, waiting, slices, findings, problems };
}

export function readPlans(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => readPlan(join(dir, f)));
}

// The roadmap (docs/roadmap.md) is the one overall plan. It has no slices: its
// "Order of work" is a numbered list of plans, the path to version 1. Each step
// links the plan it runs, or links none while that plan is not written yet.
const ROADMAP_REQUIRED = ['Where it stands', 'Waiting on you', 'Order of work', 'Decisions', 'Not yet decided'];

export function readRoadmap(file, plans = []) {
  const problems = [];
  if (!existsSync(file)) return { file, status: null, updated: null, summary: '', waiting: [], path: [], problems: ['no roadmap file'] };
  const text = readFileSync(file, 'utf8');
  const secs = sections(text);
  checkOrderAndRequired(secs, ROADMAP_REQUIRED, problems);
  const { status, updated, summary } = readWhere(secs, problems);
  const waiting = readWaiting(secs, 'roadmap', problems);
  checkNotYetDecided(secs, problems);

  // Decisions: a table with a Date column, each row dated.
  const dec = secs.get('Decisions');
  if (dec) {
    const t = tables(dec, 'Decisions').find((x) => col(x.header, ['date']) >= 0);
    if (!t) problems.push('"## Decisions" needs a table with a Date column');
    else {
      const di = col(t.header, ['date']);
      for (const r of t.rows) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(plain(r.cells[di] || ''))) {
          problems.push(`decision "${plain(r.cells[di + 1] || '').slice(0, 40)}" has no YYYY-MM-DD date`);
        }
      }
    }
  }

  // Order of work: "1. [Plan](plans/<slug>.md) ..." steps.
  const byslug = Object.fromEntries(plans.map((p) => [p.slug, p]));
  const path = [];
  const order = secs.get('Order of work') || [];
  for (const line of order) {
    const m = /^(\d+)\. (.+)$/.exec(line);
    if (!m) continue;
    const link = /\[([^\]]+)\]\((?:\.\/)?plans\/(done\/)?([a-z0-9-]+)\.md(?:#[^)]*)?\)/.exec(m[2]);
    const text = plain(m[2]);
    let plan = null;
    let state = 'not written';
    let title = '';
    if (link) {
      plan = link[3];
      if (link[2]) state = 'done';
      else if (byslug[plan]) {
        state = byslug[plan].status || 'not started';
        title = byslug[plan].title;
      } else problems.push(`"Order of work" step ${m[1]} links plans/${plan}.md, which is not a plan in docs/plans`);
    }
    // A linked plan goes by its own title; an unwritten step by its words up to the first stop.
    const label = title || (link ? plain(link[1]) : text.split(/[.:]\s/)[0].replace(/[.:]$/, ''));
    path.push({ step: Number(m[1]), label, detail: text, plan, title, status: state, current: false });
  }
  if (secs.has('Order of work') && !path.length) problems.push('"## Order of work" needs a numbered list of steps');
  path.forEach((s, i) => {
    if (s.step !== i + 1) problems.push(`"Order of work" step ${s.step} is out of order; number the steps 1, 2, 3`);
  });
  // The current step is the first one not done.
  const cur = path.find((s) => s.status !== 'done');
  if (cur) cur.current = true;

  return { file, status, updated, summary, waiting, path, problems };
}

function main() {
  const args = process.argv.slice(2);
  for (const flag of ['--plans', '--out']) {
    const at = args.indexOf(flag);
    if (at >= 0 && !args[at + 1]) {
      console.error(`${flag} needs a folder after it. Usage is at the top of plan-status.mjs.`);
      process.exit(2);
    }
  }
  const pi = args.indexOf('--plans');
  const dir = pi >= 0 ? resolve(args[pi + 1]) : join(root, 'docs/plans');
  const plans = readPlans(dir);
  const roadmapFile = join(dir, '..', 'roadmap.md');
  const roadmap = readRoadmap(roadmapFile, plans);
  roadmap.file = 'docs/roadmap.md';

  if (args.includes('--check')) {
    let bad = 0;
    for (const p of [roadmap, ...plans]) {
      for (const msg of p.problems) {
        console.log(`${p.file}: ${msg}`);
        bad++;
      }
    }
    if (bad) {
      console.log(`\n${bad} problem(s). The plan format is in docs/how-we-work.md, under Plan.`);
      process.exit(1);
    }
    console.log(`The roadmap and ${plans.length} plans follow the format.`);
    return;
  }

  const oi = args.indexOf('--out');
  if (oi >= 0) {
    const out = resolve(args[oi + 1]);
    mkdirSync(out, { recursive: true });
    const source = readFileSync(fileURLToPath(import.meta.url), 'utf8');
    const meta = [
      { label: 'plan-status.mjs', value: source, type: 'code', lang: 'javascript' },
      { label: 'Input', value: 'docs/roadmap.md and docs/plans/*.md in nhoople/netrunner' },
      { label: 'Generated', value: new Date().toISOString() },
    ];
    const rows = {
      plans: plans.map((p) => ({
        plan: p.slug,
        title: p.title,
        status: p.status,
        updated: p.updated,
        summary: p.summary,
        waiting: p.waiting.length,
        slices: p.slices.length,
        done: p.slices.filter((s) => s.status === 'done').length,
        running: p.slices.filter((s) => s.status === 'running').length,
        findingsOpen: p.findings.open,
        findingsFixed: p.findings.fixed,
        findingsDropped: p.findings.dropped,
      })),
      slices: plans.flatMap((p) => p.slices),
      waiting: [...roadmap.waiting, ...plans.flatMap((p) => p.waiting)],
      findings: plans.flatMap((p) =>
        Object.entries(p.findings.byGroup).map(([group, c]) => ({ plan: p.slug, group, ...c })),
      ),
      path: roadmap.path,
    };
    // One file, so a refresh is one upload. The page splits it into five datasets.
    const file = join(out, 'plan-status.json');
    writeFileSync(file, JSON.stringify({ ...rows, meta }, null, 1));
    console.log(`Wrote ${file}: ${Object.entries(rows).map(([n, r]) => `${r.length} ${n}`).join(', ')}`);
    return;
  }

  const { problems: _, ...road } = roadmap;
  console.log(JSON.stringify({ roadmap: road, plans: plans.map(({ problems, ...p }) => p) }, null, 1));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
