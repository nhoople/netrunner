#!/usr/bin/env node
// Reads the active plans in docs/plans/*.md and reports where each stands.
// The plan format is in docs/how-we-work.md (Plan). This script is the one
// reader of it: the plan check in CI, the progress visual in chat, and the
// pinned status page all come from here.
//
//   node .claude/skills/plan-status/plan-status.mjs           JSON on stdout
//   node .claude/skills/plan-status/plan-status.mjs --check   fail on format problems
//   node .claude/skills/plan-status/plan-status.mjs --out DIR write DIR/plan-status.json
//        (plans, slices, waiting, findings) for the status page
//   --plans DIR reads another folder (the format test uses this)

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
  return s
    .replace(/~~/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1$2')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitRow(line) {
  const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/);
  return cells.map((c) => c.trim());
}

// Sections by "## " heading; each holds its lines, with "### " groups kept inline.
function sections(text) {
  const out = new Map();
  let name = null;
  for (const line of text.split('\n')) {
    const h = /^## (.+?)\s*$/.exec(line);
    if (h) {
      name = h[1];
      out.set(name, []);
    } else if (name) out.get(name).push(line);
  }
  return out;
}

// Tables in a block of lines, each tagged with the nearest "### " heading above it.
function tables(lines, defaultGroup) {
  const found = [];
  let group = defaultGroup;
  let i = 0;
  while (i < lines.length) {
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

export function readPlan(file) {
  const text = readFileSync(file, 'utf8');
  const slug = basename(file, '.md');
  const problems = [];
  const title = plain((/^# (.+)$/m.exec(text) || [, slug])[1]);
  const secs = sections(text);

  for (const name of REQUIRED) {
    if (!secs.has(name)) problems.push(`no "## ${name}" section`);
  }
  const order = [...secs.keys()];
  if (order[0] !== 'Where it stands') problems.push('"## Where it stands" must be the first section');
  if (order[1] !== 'Waiting on you') problems.push('"## Waiting on you" must come right after "Where it stands"');

  text.split('\n').forEach((line, n) => {
    if (/^\*Revised \d{4}-\d{2}-\d{2}/.test(line)) {
      problems.push(`line ${n + 1}: a "*Revised" history line. Rewrite "Where it stands" instead; history is in git and the PRs`);
    }
  });

  // Where it stands
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

  // Waiting on you
  const waiting = [];
  const wait = secs.get('Waiting on you');
  if (wait) {
    const body = wait.join('\n').trim();
    const items = body.split('\n').filter((l) => /^- /.test(l));
    if (!items.length && body !== 'Nothing.') problems.push('"Waiting on you" holds bullets, or the one word "Nothing."');
    for (const item of items) {
      if (/~~/.test(item)) problems.push('"Waiting on you" has a crossed-out item; move the answer to "Decisions for a human" and delete it here');
      const q = /^- \*\*(.+?)\*\*\s*(.*)$/.exec(item);
      if (!q) {
        problems.push(`"Waiting on you" item does not start with a bold question: ${item.slice(0, 60)}`);
        continue;
      }
      const rec = /Recommended: ([^.]*(?:\.[^ ][^.]*)*)\./.exec(q[2]);
      if (!rec) problems.push(`"Waiting on you" item has no "Recommended: …." answer: ${plain(q[1]).slice(0, 60)}`);
      waiting.push({ plan: slug, question: plain(q[1]), detail: plain(q[2]), recommended: rec ? plain(rec[1]) : '' });
    }
  }

  // Not yet decided: open questions only.
  const nyd = secs.get('Not yet decided');
  if (nyd && nyd.some((l) => /^- .*~~/.test(l))) {
    problems.push('"Not yet decided" has crossed-out items; decided ones belong in "Decisions for a human" only');
  }

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

function main() {
  const args = process.argv.slice(2);
  const pi = args.indexOf('--plans');
  const dir = pi >= 0 ? resolve(args[pi + 1]) : join(root, 'docs/plans');
  const plans = readPlans(dir);

  if (args.includes('--check')) {
    let bad = 0;
    for (const p of plans) {
      for (const msg of p.problems) {
        console.log(`${p.file}: ${msg}`);
        bad++;
      }
    }
    if (bad) {
      console.log(`\n${bad} problem(s). The plan format is in docs/how-we-work.md, under Plan.`);
      process.exit(1);
    }
    console.log(`${plans.length} plans follow the format.`);
    return;
  }

  const oi = args.indexOf('--out');
  if (oi >= 0) {
    const out = resolve(args[oi + 1]);
    mkdirSync(out, { recursive: true });
    const source = readFileSync(fileURLToPath(import.meta.url), 'utf8');
    const meta = [
      { label: 'plan-status.mjs', value: source, type: 'code', lang: 'javascript' },
      { label: 'Input', value: 'docs/plans/*.md in nhoople/netrunner' },
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
      waiting: plans.flatMap((p) => p.waiting),
      findings: plans.flatMap((p) =>
        Object.entries(p.findings.byGroup).map(([group, c]) => ({ plan: p.slug, group, ...c })),
      ),
    };
    // One file, so a refresh is one upload. The page splits it into four datasets.
    const file = join(out, 'plan-status.json');
    writeFileSync(file, JSON.stringify({ ...rows, meta }, null, 1));
    console.log(`Wrote ${file}: ${Object.entries(rows).map(([n, r]) => `${r.length} ${n}`).join(', ')}`);
    return;
  }

  console.log(JSON.stringify(plans.map(({ problems, ...p }) => p), null, 1));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
