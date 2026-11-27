#!/usr/bin/env node
/**
 * Plays one Learn to play match on a fresh game host and saves screenshots of
 * `/play/` for each seat at phone and desktop widths, at the moments a person
 * would look: the opening, each new turn, each run, each access, and the end.
 * Writes a contact sheet (`index.html`) and `summary.json` into the out folder.
 *
 * The match is driven through the host's own WebSocket protocol, the same
 * messages the client sends, so the script keeps working as the board's
 * buttons change. It only ever submits an intent from a seat's own legal list.
 * The pages are watchers: they draw what the host sends them.
 *
 *   node .claude/skills/play-check/play-check.mjs [--game <dir>] [--out <dir>]
 *     [--steps 400] [--seed 1] [--widths phone,desktop] [--seats corp,runner,spectator]
 *     [--turns 6] [--runs 3] [--accesses 3] [--policy weighted|default|random] [--build]
 *     [--a11y on|off]
 *
 * At every screenshot it also runs axe-core (WCAG 2.2 A and AA rules) on each
 * seat's page and reports each failing rule once, with where it was seen.
 * Accessibility failures are reported, not fatal.
 *
 * Needs the game's dependencies and Playwright's Chromium (the game's
 * `test:browser` setup), and `@axe-core/playwright` in the game for the
 * accessibility pass. Read-only for the repos; writes only under --out.
 */
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, cpSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function arg(name, fallback) {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 && process.argv[at + 1] !== undefined ? process.argv[at + 1] : fallback;
}
const flag = (name) => process.argv.includes(`--${name}`);

if (flag("help")) {
  console.log(
    "node .claude/skills/play-check/play-check.mjs [--game <dir>] [--out <dir>] [--steps N] [--seed N]\n" +
      "  [--widths phone,desktop] [--seats corp,runner,spectator] [--turns N] [--runs N] [--accesses N]\n" +
      "  [--policy weighted|default|random] [--build] [--a11y on|off]",
  );
  process.exit(0);
}

const gameDir = resolve(arg("game", join(workspace, "netrunner-game")));
const outDir = resolve(arg("out", join(gameDir, "test-results", "play-check")));
const maxSteps = Number(arg("steps", "400"));
const seed = Number(arg("seed", "1"));
const policy = arg("policy", "weighted");
const maxTurns = Number(arg("turns", "6"));
const maxRuns = Number(arg("runs", "3"));
const maxAccesses = Number(arg("accesses", "3"));

const WIDTHS = {
  phone: { width: 375, height: 812 },
  desktop: { width: 1280, height: 900 },
};
const widths = arg("widths", "phone,desktop").split(",").filter(Boolean);
const seats = arg("seats", "corp,runner,spectator").split(",").filter(Boolean);
for (const w of widths) if (!(w in WIDTHS)) throw new Error(`Unknown width ${w}; use ${Object.keys(WIDTHS).join(", ")}`);
for (const s of seats) if (!["corp", "runner", "spectator"].includes(s)) throw new Error(`Unknown seat ${s}`);
if (!["weighted", "default", "random"].includes(policy)) throw new Error(`Unknown policy ${policy}`);

if (!existsSync(join(gameDir, "package.json"))) throw new Error(`No game checkout at ${gameDir}`);
const requireFromGame = createRequire(join(gameDir, "package.json"));
const { chromium } = requireFromGame("playwright");
const WebSocket = requireFromGame("ws");

// ---- accessibility (axe-core, open source; no account)

const A11Y_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const IMPACT_ORDER = ["critical", "serious", "moderate", "minor"];
const a11yMode = arg("a11y", "on");
if (!["on", "off"].includes(a11yMode)) throw new Error(`Unknown --a11y ${a11yMode}; use on or off`);
let AxeBuilder = null;
let axeVersion = null;
let a11ySkipped = a11yMode === "off" ? "turned off with --a11y off" : null;
if (!a11ySkipped) {
  try {
    const mod = requireFromGame("@axe-core/playwright");
    AxeBuilder = mod.default ?? mod.AxeBuilder ?? mod;
    try {
      const axeRequire = createRequire(requireFromGame.resolve("@axe-core/playwright"));
      axeVersion = axeRequire("axe-core/package.json").version;
    } catch {}
  } catch {
    a11ySkipped = "@axe-core/playwright is not installed in the game (npm install in netrunner-game)";
    console.log(`Accessibility pass skipped: ${a11ySkipped}.`);
  }
}
/** Failing rules by id, merged across every seat, width, and checkpoint. */
const a11yRules = new Map();
const a11yErrors = [];
let a11yRuns = 0;

function recordA11y(violations, checkpoint, seatName, width) {
  for (const v of violations) {
    let rule = a11yRules.get(v.id);
    if (!rule) {
      rule = {
        id: v.id,
        impact: v.impact ?? "minor",
        help: v.help,
        helpUrl: v.helpUrl,
        firstSeen: checkpoint,
        where: new Set(),
        targets: new Set(),
        example: { target: v.nodes[0]?.target?.join(" ") ?? "", html: v.nodes[0]?.html ?? "", failure: v.nodes[0]?.failureSummary ?? "" },
      };
      a11yRules.set(v.id, rule);
    }
    rule.where.add(`${seatName} ${width}`);
    for (const n of v.nodes) rule.targets.add(n.target.join(" "));
  }
}

function a11ySummary() {
  const violations = [...a11yRules.values()]
    .sort((a, b) => IMPACT_ORDER.indexOf(a.impact) - IMPACT_ORDER.indexOf(b.impact) || b.targets.size - a.targets.size)
    .map((r) => ({ ...r, where: [...r.where], elements: r.targets.size, targets: [...r.targets].slice(0, 10) }));
  const byImpact = Object.fromEntries(IMPACT_ORDER.map((i) => [i, violations.filter((v) => v.impact === i).length]));
  return {
    engine: axeVersion ? `axe-core ${axeVersion}` : "axe-core",
    tags: A11Y_TAGS,
    ...(a11ySkipped ? { skipped: a11ySkipped } : {}),
    pagesChecked: a11yRuns,
    rulesFailing: violations.length,
    byImpact,
    errors: a11yErrors,
    violations,
  };
}

if (flag("build") || !existsSync(join(gameDir, "public", "play", "index.html"))) {
  if (!flag("build")) console.log("The product client is not built; building it (npm run build:client).");
  const built = spawnSync("npm", ["run", "build:client"], { cwd: gameDir, stdio: "inherit" });
  if (built.status !== 0) throw new Error("npm run build:client failed");
}

// ---- seeded choice, so the same seed makes the same picks from the same lists

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = mulberry32(seed);

/** Weights that keep a match moving toward the views worth seeing: installs, runs, accesses. */
function weightOf(entry) {
  if (policy === "random") return 1;
  if (policy === "default") return entry.default ? 1 : 0;
  let w = 1;
  if (entry.default) w += 3;
  if (entry.group === "run") w += 3;
  if (entry.group === "install" || entry.group === "play") w += 2;
  if (entry.group === "ability") w += 1;
  return w;
}

function pick(options) {
  const weighted = options.map((o) => ({ o, w: weightOf(o.entry) })).filter((x) => x.w > 0);
  const pool = weighted.length ? weighted : options.map((o) => ({ o, w: 1 }));
  const total = pool.reduce((sum, x) => sum + x.w, 0);
  let r = random() * total;
  for (const x of pool) {
    r -= x.w;
    if (r < 0) return x.o;
  }
  return pool[pool.length - 1].o;
}

// ---- host

function freePort() {
  return new Promise((ok, fail) => {
    const probe = createServer();
    probe.once("error", fail);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => ok(port));
    });
  });
}

async function startHost(matchDir) {
  const port = await freePort();
  const child = spawn(process.execPath, ["--import", "tsx", "src/server.ts"], {
    cwd: gameDir,
    env: { ...process.env, PORT: String(port), MATCH_DIR: matchDir },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  await new Promise((ok, fail) => {
    const timer = setTimeout(() => fail(new Error(`The game host did not start:\n${output}`)), 30_000);
    const onData = (chunk) => {
      output += chunk.toString();
      if (output.includes(`listening on http://127.0.0.1:${port}`)) {
        clearTimeout(timer);
        ok();
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.once("exit", (code) => {
      clearTimeout(timer);
      fail(new Error(`The game host exited with code ${code}:\n${output}`));
    });
  });
  return { child, origin: `http://127.0.0.1:${port}` };
}

/** One seat's socket: keeps the latest snapshot and lets a caller wait for the next. */
function connectSeat(origin, token) {
  const url = new URL("/", origin.replace(/^http/, "ws"));
  url.searchParams.set("token", token);
  const socket = new WebSocket(url.toString());
  const seat = { socket, snap: null, errors: [], waiters: [] };
  socket.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === "snapshot") {
      seat.snap = msg;
      for (const w of seat.waiters.splice(0)) w();
    } else if (msg.type === "error") {
      seat.errors.push(msg.message);
      for (const w of seat.waiters.splice(0)) w();
    }
  });
  seat.ready = new Promise((ok, fail) => {
    socket.once("error", fail);
    seat.waiters.push(ok);
  });
  seat.next = () =>
    new Promise((ok, fail) => {
      const timer = setTimeout(() => fail(new Error("No reply from the host in 15 s")), 15_000);
      seat.waiters.push(() => {
        clearTimeout(timer);
        ok();
      });
    });
  return seat;
}

// ---- checkpoints

function runOf(snap) {
  return snap?.view?.run ?? null;
}

const counts = { turn: 0, run: 0, access: 0 };
let lastTurnKey = null;
let inRun = false;
let lastAccess = null;

/** Names the moment this snapshot shows, if it is one worth a picture. */
function checkpointFor(snap) {
  const marks = [];
  const view = snap.view ?? {};
  const turnKey = `${view.turnNumber ?? "?"}-${view.activeSide ?? snap.timing?.activeSide ?? "?"}`;
  if (turnKey !== lastTurnKey) {
    const first = lastTurnKey === null;
    lastTurnKey = turnKey;
    counts.turn += 1;
    // The opening picture already shows the first turn's start.
    if (!first && counts.turn <= maxTurns) marks.push(`turn-${turnKey}`);
  }
  const run = runOf(snap);
  if (run && !inRun) {
    counts.run += 1;
    if (counts.run <= maxRuns) marks.push(`run-${counts.run}-${run.attackedServerId ?? "server"}`);
  }
  inRun = Boolean(run);
  const accessing = run?.accessingCardId ?? (snap.access ? snap.access.title : null);
  if (accessing && accessing !== lastAccess) {
    counts.access += 1;
    if (counts.access <= maxAccesses) marks.push(`access-${counts.access}`);
  }
  lastAccess = accessing ?? null;
  return marks;
}

async function settle(page) {
  await page.waitForTimeout(300);
  await page
    .waitForFunction(() => Array.from(document.images).every((i) => i.complete), undefined, { timeout: 5_000 })
    .catch(() => undefined);
}

// ---- main

const shotsDir = join(outDir, "shots");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(shotsDir, { recursive: true });
const matchDir = mkdtempSync(join(tmpdir(), "play-check-"));

const started = Date.now();
const host = await startHost(matchDir);
const browser = await chromium.launch();
const pageErrors = [];
const checkpoints = [];
let steps = 0;
let rejected = 0;
let ended = "budget";
let detail;
let matchId;
let finalResult = null;

try {
  const res = await fetch(`${host.origin}/matches`, { method: "POST" });
  if (res.status !== 201) throw new Error(`POST /matches returned ${res.status}`);
  const created = await res.json();
  matchId = created.matchId;
  const tokens = created.seats;

  const pages = {};
  for (const seatName of seats) {
    const context = await browser.newContext({ viewport: WIDTHS[widths[0]] });
    const page = await context.newPage();
    page.on("pageerror", (e) => pageErrors.push(`${seatName}: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error") pageErrors.push(`${seatName} console: ${m.text()}`);
    });
    const url = new URL("/play/", host.origin);
    url.searchParams.set("token", tokens[seatName]);
    await page.goto(url.toString());
    pages[seatName] = page;
  }

  const drivers = { corp: connectSeat(host.origin, tokens.corp), runner: connectSeat(host.origin, tokens.runner) };
  await Promise.all([drivers.corp.ready, drivers.runner.ready]);

  async function shoot(name) {
    const latest = drivers.corp.snap;
    const entry = { name, step: steps, step_label: latest?.timing?.label ?? "", images: {} };
    for (const seatName of seats) {
      const page = pages[seatName];
      entry.images[seatName] = {};
      for (const w of widths) {
        await page.setViewportSize(WIDTHS[w]);
        await settle(page);
        const file = join(shotsDir, `${String(checkpoints.length).padStart(2, "0")}-${name}-${seatName}-${w}.png`);
        await page.screenshot({ path: file, fullPage: true });
        entry.images[seatName][w] = relative(outDir, file);
        if (AxeBuilder) {
          try {
            const result = await new AxeBuilder({ page }).withTags(A11Y_TAGS).analyze();
            a11yRuns += 1;
            recordA11y(result.violations, name, seatName, w);
          } catch (e) {
            a11yErrors.push(`${name} ${seatName} ${w}: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
      }
    }
    checkpoints.push(entry);
    console.log(`  shot ${name} (step ${steps}: ${entry.step_label})`);
  }

  await shoot("opening");
  checkpointFor(drivers.corp.snap); // the opening is turn 0's picture

  while (steps < maxSteps) {
    const snap = drivers.corp.snap;
    if (snap?.result?.done) {
      ended = "done";
      break;
    }
    const options = [
      ...(drivers.corp.snap?.legal ?? []).map((entry) => ({ seat: "corp", entry })),
      ...(drivers.runner.snap?.legal ?? []).map((entry) => ({ seat: "runner", entry })),
    ];
    if (options.length === 0) {
      ended = "no_legal_action";
      break;
    }
    const choice = pick(options);
    const actor = drivers[choice.seat];
    const errorsBefore = actor.errors.length;
    const reply = actor.next();
    actor.socket.send(JSON.stringify({ v: 1, type: "intent", intentId: randomUUID(), intent: choice.entry.intent }));
    await reply;
    // Both sockets get the broadcast; wait until they show the same log position.
    for (let i = 0; i < 250 && drivers.corp.snap?.logPosition !== drivers.runner.snap?.logPosition; i += 1) {
      await new Promise((ok) => setTimeout(ok, 20));
    }
    steps += 1;
    if (actor.errors.length > errorsBefore) {
      rejected += 1;
      if (rejected > 20) {
        ended = "too_many_rejections";
        detail = actor.errors.at(-1);
        break;
      }
      continue;
    }
    for (const mark of checkpointFor(drivers.corp.snap)) await shoot(mark);
  }
  if (drivers.corp.snap?.result?.done) ended = "done";
  finalResult = drivers.corp.snap?.result ?? null;
  await shoot(ended === "done" ? "end" : `stopped-${ended}`);
  drivers.corp.socket.close();
  drivers.runner.socket.close();
} catch (error) {
  ended = "crash";
  detail = error instanceof Error ? error.stack ?? error.message : String(error);
} finally {
  await browser.close();
  host.child.kill();
}

// Keep the stored match, so it can be opened again on a host with MATCH_DIR pointing here.
cpSync(matchDir, join(outDir, "match"), { recursive: true });
rmSync(matchDir, { recursive: true, force: true });

const summary = {
  matchId,
  ended,
  ...(detail ? { detail } : {}),
  result: finalResult,
  steps,
  rejected,
  seed,
  policy,
  seconds: Math.round((Date.now() - started) / 1000),
  seats,
  widths,
  pageErrors,
  accessibility: a11ySummary(),
  checkpoints,
};
writeFileSync(join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const rows = checkpoints
  .map(
    (c) => `<section><h2>${esc(c.name)} <small>step ${c.step} · ${esc(c.step_label)}</small></h2><div class="row">${seats
      .flatMap((s) =>
        widths.map(
          (w) =>
            `<figure class="${w}"><a href="${esc(c.images[s][w])}"><img loading="lazy" src="${esc(c.images[s][w])}" alt="${esc(`${s} at ${w} width, ${c.name}`)}"></a><figcaption>${esc(s)} · ${esc(w)}</figcaption></figure>`,
        ),
      )
      .join("")}</div></section>`,
  )
  .join("\n");
const a11y = summary.accessibility;
const a11ySection = a11y.skipped
  ? `<h2>Accessibility</h2><p class="meta">Skipped: ${esc(a11y.skipped)}.</p>`
  : `<h2>Accessibility <small>${esc(a11y.engine)}, WCAG 2.2 A and AA · ${a11y.pagesChecked} page checks</small></h2>
${
  a11y.violations.length
    ? `<p class="meta">${a11y.rulesFailing} rules fail: ${IMPACT_ORDER.filter((i) => a11y.byImpact[i]).map((i) => `${a11y.byImpact[i]} ${i}`).join(", ")}.</p>
<table><thead><tr><th>Impact</th><th>Rule</th><th>What it means</th><th>Elements</th><th>Seen at</th><th>Example</th></tr></thead><tbody>
${a11y.violations
  .map(
    (v) =>
      `<tr><td class="impact ${esc(v.impact)}">${esc(v.impact)}</td><td><a href="${esc(v.helpUrl)}">${esc(v.id)}</a></td><td>${esc(v.help)}</td><td>${v.elements}</td><td>${esc(v.where.join(", "))}<br><small>first at ${esc(v.firstSeen)}</small></td><td><code>${esc(v.example.target)}</code></td></tr>`,
  )
  .join("\n")}
</tbody></table>`
    : '<p class="meta">No failing rules.</p>'
}${a11y.errors.length ? `<pre class="errors">${esc(a11y.errors.slice(0, 10).join("\n"))}</pre>` : ""}`;
writeFileSync(
  join(outDir, "index.html"),
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Play check</title>
<style>
:root{--bg:#f6f6f4;--fg:#1d1d1b;--muted:#6b6b66;--line:#d9d9d4}
@media (prefers-color-scheme:dark){:root{--bg:#161615;--fg:#ececea;--muted:#9a9a95;--line:#33332f}}
body{background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,sans-serif;margin:0;padding:16px}
h1{font-size:20px;margin:0 0 4px}h2{font-size:16px;margin:24px 0 8px}small{color:var(--muted);font-weight:400}
.meta{color:var(--muted);margin:0 0 8px}.errors{color:#c0392b}
.row{display:flex;gap:12px;overflow-x:auto;align-items:flex-start;padding-bottom:8px}
figure{margin:0;flex:none}figure img{display:block;border:1px solid var(--line);border-radius:4px;max-height:420px}
figure.phone img{width:150px;object-fit:cover;object-position:top}figure.desktop img{width:420px;object-fit:cover;object-position:top}
figcaption{color:var(--muted);font-size:13px;margin-top:4px}
table{border-collapse:collapse;margin:4px 0 8px;font-size:14px}th,td{border-bottom:1px solid var(--line);padding:6px 10px 6px 0;text-align:left;vertical-align:top}
th{color:var(--muted);font-weight:500}a{color:inherit}code{font-size:12px;word-break:break-all}
.impact.critical,.impact.serious{color:#c0392b;font-weight:600}
</style>
<h1>Play check</h1>
<p class="meta">Match ${esc(matchId ?? "none")} · ended: ${esc(ended)} · ${steps} steps (${rejected} rejected) · policy ${esc(policy)}, seed ${seed} · ${summary.seconds} s</p>
${detail ? `<pre class="errors">${esc(detail)}</pre>` : ""}
${pageErrors.length ? `<p class="errors">Page errors (${pageErrors.length}):</p><pre class="errors">${esc(pageErrors.slice(0, 20).join("\n"))}</pre>` : '<p class="meta">No page errors.</p>'}
${a11ySection}
${rows}
`,
);

console.log(
  `${ended} after ${steps} steps (${rejected} rejected), ${checkpoints.length} checkpoints, ${pageErrors.length} page errors, ${summary.seconds} s`,
);
console.log(
  a11y.skipped
    ? `accessibility: skipped (${a11y.skipped})`
    : `accessibility: ${a11y.rulesFailing} rules failing (${IMPACT_ORDER.map((i) => `${a11y.byImpact[i]} ${i}`).join(", ")}) over ${a11y.pagesChecked} page checks`,
);
console.log(`contact sheet: ${join(outDir, "index.html")}`);
if (ended === "crash" || pageErrors.length) process.exitCode = 1;
