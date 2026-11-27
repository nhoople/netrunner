#!/usr/bin/env node
// SessionStart hook: check that the five checkouts are in the state /sync
// leaves them in (docs/git-hygiene.md), and tell the session what is not.
// Silent when everything matches GitHub. Never blocks.
//
// CLAUDE.md: "If a later session finds a repo off that state, finish the sync
// before new work." Slice sessions keep branches in worktrees on purpose, so
// the report separates this checkout's problems from branches a running
// session may own.
//
// Test: node --test .claude/hooks/

import { spawn, spawnSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REPOS = [
  { dir: ".", name: "netrunner", base: "main" },
  { dir: "netrunner-engine", name: "netrunner-engine", base: "master" },
  { dir: "netrunner-cards-data", name: "netrunner-cards-data", base: "master" },
  { dir: "netrunner-comprehensive-rules-data", name: "netrunner-comprehensive-rules-data", base: "master" },
  { dir: "netrunner-game", name: "netrunner-game", base: "master" },
];

const FETCH_TIMEOUT_MS = 8000;

function git(cwd, args) {
  const r = spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
  return { ok: r.status === 0, out: (r.stdout || "").trim() };
}

function fetch(cwd) {
  return new Promise((done) => {
    const p = spawn("git", ["-C", cwd, "fetch", "-q", "--prune", "origin"], { stdio: "ignore" });
    const t = setTimeout(() => { p.kill(); done(false); }, FETCH_TIMEOUT_MS);
    p.on("close", (code) => { clearTimeout(t); done(code === 0); });
    p.on("error", () => { clearTimeout(t); done(false); });
  });
}

// The main checkout's folder, also from inside a worktree of the meta repo.
export function mainRoot(from) {
  const r = git(from, ["rev-parse", "--path-format=absolute", "--git-common-dir"]);
  return r.ok ? dirname(r.out) : from;
}

export function parseWorktrees(porcelain) {
  const out = [];
  let cur = null;
  for (const line of porcelain.split("\n")) {
    if (line.startsWith("worktree ")) { cur = { path: line.slice(9), branch: null }; out.push(cur); }
    else if (cur && line.startsWith("branch refs/heads/")) cur.branch = line.slice(18);
  }
  return out;
}

// Read one checkout's state. Pure git reads; the fetch happens before.
export function readRepo(root, repo, fetched) {
  const path = resolve(root, repo.dir);
  if (!git(path, ["rev-parse", "--git-dir"]).ok) return { ...repo, path, missing: true };
  const branch = git(path, ["rev-parse", "--abbrev-ref", "HEAD"]).out;
  const dirty = git(path, ["status", "--porcelain"]).out.split("\n").filter(Boolean);
  const [ahead, behind] = git(path, ["rev-list", "--left-right", "--count", `${repo.base}...origin/${repo.base}`])
    .out.split(/\s+/).map(Number);
  const worktrees = parseWorktrees(git(path, ["worktree", "list", "--porcelain"]).out)
    .filter((w) => resolve(w.path) !== path);
  const branches = git(path, ["for-each-ref", "--format=%(refname:short)\t%(upstream:track)", "refs/heads/"]).out
    .split("\n").filter(Boolean)
    .map((l) => l.split("\t"))
    .filter(([b]) => b !== repo.base && b !== branch)
    .map(([b, track]) => ({
      name: b,
      gone: /gone/.test(track || ""),
      merged: git(path, ["merge-base", "--is-ancestor", b, `origin/${repo.base}`]).ok,
      worktree: worktrees.find((w) => w.branch === b)?.path ?? null,
    }));
  return { ...repo, path, fetched, branch, dirty, ahead: ahead || 0, behind: behind || 0, worktrees, branches };
}

// Turn the state of every checkout into the report, or null when all is in sync.
export function summarize(repos, { root, projectDir }) {
  const rel = (p) => relative(root, p) || ".";
  const mine = (p) => projectDir && resolve(p) === resolve(projectDir);
  const fix = [], inUse = [], leftover = [], unmerged = [], notes = [];

  for (const r of repos) {
    if (r.missing) { fix.push(`${r.name}: checkout missing at ${rel(r.path)}`); continue; }
    if (!r.fetched) notes.push(`${r.name}: fetch failed, so ahead/behind is from the last fetch`);
    if (r.branch !== r.base) fix.push(`${r.name}: main checkout is on ${r.branch === "HEAD" ? "a detached HEAD" : r.branch}, not ${r.base}`);
    if (r.dirty.length) fix.push(`${r.name}: ${r.dirty.length} uncommitted change(s) in the main checkout (${r.dirty.slice(0, 3).map((l) => l.slice(3)).join(", ")}${r.dirty.length > 3 ? ", ..." : ""})`);
    if (r.ahead) fix.push(`${r.name}: local ${r.base} has ${r.ahead} commit(s) not on origin`);
    if (r.behind) fix.push(`${r.name}: local ${r.base} is ${r.behind} commit(s) behind origin (fast-forward it)`);

    for (const b of r.branches) {
      const why = b.gone ? "deleted on GitHub" : b.merged ? `nothing beyond ${r.base}` : null;
      const label = `${r.name} ${b.name}`;
      if (b.worktree) {
        const tags = [`worktree ${rel(b.worktree)}`, mine(b.worktree) && "this session", why].filter(Boolean);
        inUse.push(`${label} (${tags.join(", ")})`);
      } else if (why) leftover.push(`${label} (${why})`);
      else unmerged.push(label);
    }
    for (const w of r.worktrees.filter((w) => !w.branch)) {
      inUse.push(`${r.name} detached worktree ${rel(w.path)}${mine(w.path) ? " (this session)" : ""}`);
    }
  }

  if (!fix.length && !inUse.length && !leftover.length && !unmerged.length) return null;

  const lines = ["Workspace sync check (session start; see CLAUDE.md, End-of-session sync):"];
  const section = (title, items) => { if (items.length) lines.push(title, ...items.map((i) => `- ${i}`)); };
  section("Off the synced state (finish the sync before new work):", fix);
  section("Leftover branches with no worktree (/sync can delete them):", leftover);
  section("Branches with unmerged work and no worktree (find whose they are before deleting):", unmerged);
  section("Branches and worktrees in use, likely by a slice session (leave them; check mcp__ccd_session_mgmt__list_sessions before touching):", inUse);
  section("Notes:", notes);
  lines.push("Never sync, delete or rebase another session's branch or worktree. Tell Nathaniel what this found in one or two lines before starting his request.");

  const counts = [
    fix.length && `${fix.length} to fix`,
    leftover.length && `${leftover.length} leftover branch(es)`,
    unmerged.length && `${unmerged.length} unmerged branch(es)`,
    inUse.length && `${inUse.length} in use by sessions`,
  ].filter(Boolean).join(", ");
  return { context: lines.join("\n"), banner: `Sync check: ${counts}.`, needsSync: fix.length + leftover.length + unmerged.length > 0 };
}

async function main() {
  let input = {};
  try {
    let raw = "";
    for await (const c of process.stdin) raw += c;
    input = raw ? JSON.parse(raw) : {};
  } catch {}
  const here = dirname(fileURLToPath(import.meta.url));
  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || resolve(here, "../..");
  const root = mainRoot(projectDir);
  const fetched = await Promise.all(REPOS.map((r) => fetch(join(root, r.dir))));
  const repos = REPOS.map((r, i) => readRepo(root, r, fetched[i]));
  const report = summarize(repos, { root, projectDir });
  if (!report) return;
  const out = { hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: report.context } };
  if (report.needsSync) out.systemMessage = report.banner;
  process.stdout.write(JSON.stringify(out));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => {}).finally(() => process.exit(0));
}
