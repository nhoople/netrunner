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
 *
 * Needs the game's dependencies and Playwright's Chromium (the game's
 * `test:browser` setup). Read-only for the repos; writes only under --out.
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
      "  [--policy weighted|default|random] [--build]",
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
</style>
<h1>Play check</h1>
<p class="meta">Match ${esc(matchId ?? "none")} · ended: ${esc(ended)} · ${steps} steps (${rejected} rejected) · policy ${esc(policy)}, seed ${seed} · ${summary.seconds} s</p>
${detail ? `<pre class="errors">${esc(detail)}</pre>` : ""}
${pageErrors.length ? `<p class="errors">Page errors (${pageErrors.length}):</p><pre class="errors">${esc(pageErrors.slice(0, 20).join("\n"))}</pre>` : '<p class="meta">No page errors.</p>'}
${rows}
`,
);

console.log(
  `${ended} after ${steps} steps (${rejected} rejected), ${checkpoints.length} checkpoints, ${pageErrors.length} page errors, ${summary.seconds} s`,
);
console.log(`contact sheet: ${join(outDir, "index.html")}`);
if (ended === "crash" || pageErrors.length) process.exitCode = 1;
