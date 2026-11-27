// The session-start sync check: run with `node --test .claude/hooks/`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseWorktrees, readRepo, summarize } from "./sync-check.mjs";

const root = "/w";
const clean = (over = {}) => ({
  dir: ".", name: "netrunner", base: "main", path: "/w", fetched: true,
  branch: "main", dirty: [], ahead: 0, behind: 0, worktrees: [], branches: [], ...over,
});

test("silent when every checkout is synced", () => {
  assert.equal(summarize([clean(), clean({ name: "netrunner-engine", base: "master", branch: "master" })], { root }), null);
});

test("flags the main checkout off its branch, dirty, ahead, or behind", () => {
  const r = summarize([clean({ branch: "claude/x", dirty: [" M README.md"], ahead: 2, behind: 1 })], { root });
  assert.match(r.context, /main checkout is on claude\/x, not main/);
  assert.match(r.context, /1 uncommitted change\(s\) in the main checkout \(README\.md\)/);
  assert.match(r.context, /has 2 commit\(s\) not on origin/);
  assert.match(r.context, /1 commit\(s\) behind origin/);
  assert.equal(r.needsSync, true);
  assert.match(r.banner, /4 to fix/);
});

test("sorts branches into leftover, unmerged, and in use", () => {
  const r = summarize([clean({
    worktrees: [{ path: "/w/.claude/worktrees/s1", branch: "claude/s1" }, { path: "/w/.claude/worktrees/old", branch: null }],
    branches: [
      { name: "claude/done", gone: true, merged: false, worktree: null },
      { name: "claude/empty", gone: false, merged: true, worktree: null },
      { name: "claude/wip", gone: false, merged: false, worktree: null },
      { name: "claude/s1", gone: false, merged: false, worktree: "/w/.claude/worktrees/s1" },
    ],
  })], { root, projectDir: "/w/.claude/worktrees/s1" });
  const [, leftover] = r.context.split("Leftover branches");
  assert.match(leftover, /netrunner claude\/done \(deleted on GitHub\)/);
  assert.match(leftover, /netrunner claude\/empty \(nothing beyond main\)/);
  assert.match(r.context, /unmerged work and no worktree[^]*- netrunner claude\/wip/);
  assert.match(r.context, /in use[^]*claude\/s1 \(worktree \.claude\/worktrees\/s1, this session\)/);
  assert.match(r.context, /detached worktree \.claude\/worktrees\/old/);
  assert.match(r.context, /Never sync, delete or rebase another session's branch/);
});

test("only branches in use is reported without a banner", () => {
  const r = summarize([clean({
    branches: [{ name: "claude/s1", gone: false, merged: false, worktree: "/w/.claude/worktrees/s1" }],
  })], { root });
  assert.equal(r.needsSync, false);
  assert.match(r.context, /in use/);
});

test("a missing checkout or failed fetch is reported", () => {
  const r = summarize([clean({ fetched: false }), { name: "netrunner-game", path: "/w/netrunner-game", missing: true }], { root });
  assert.match(r.context, /netrunner-game: checkout missing at netrunner-game/);
  assert.match(r.context, /netrunner: fetch failed/);
});

test("parses git worktree list --porcelain", () => {
  const wts = parseWorktrees("worktree /w\nHEAD abc\nbranch refs/heads/main\n\nworktree /w/t\nHEAD def\ndetached\n");
  assert.deepEqual(wts, [{ path: "/w", branch: "main" }, { path: "/w/t", branch: null }]);
});

test("reads a real checkout: off branch, gone, merged, unmerged, and worktree branches", () => {
  const tmp = mkdtempSync(join(tmpdir(), "sync-check-"));
  const g = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const env = ["-c", "user.name=t", "-c", "user.email=test@example.com", "-c", "init.defaultBranch=main"];
  const origin = join(tmp, "origin.git");
  const work = join(tmp, "work");
  execFileSync("git", [...env, "init", "-q", "--bare", origin]);
  execFileSync("git", [...env, "clone", "-q", origin, work], { stdio: "ignore" });
  const commit = (msg) => { writeFileSync(join(work, "f"), msg); g(work, "add", "f"); g(work, ...env, "commit", "-qm", msg); };
  commit("one");
  g(work, "push", "-q", "-u", "origin", "main");
  // gone: pushed, then deleted on the remote.
  g(work, "switch", "-qc", "claude/gone"); commit("two");
  g(work, "push", "-q", "-u", "origin", "claude/gone");
  g(work, "push", "-q", "origin", "--delete", "claude/gone");
  g(work, "fetch", "-q", "--prune");
  // unmerged: local commit, never pushed.
  g(work, "switch", "-qc", "claude/wip", "main"); commit("three");
  // in a worktree.
  g(work, "worktree", "add", "-q", "-b", "claude/s1", join(tmp, "wt"), "main");
  // the main checkout is left on a fresh branch with a change.
  g(work, "switch", "-qc", "claude/here", "main");
  writeFileSync(join(work, "f"), "dirty");

  const r = readRepo(tmp, { dir: "work", name: "work", base: "main" }, true);
  assert.equal(r.branch, "claude/here");
  assert.equal(r.dirty.length, 1);
  assert.equal(r.ahead, 0);
  const byName = Object.fromEntries(r.branches.map((b) => [b.name, b]));
  assert.equal(byName["claude/here"], undefined, "the checked-out branch is reported once, as off-branch");
  assert.equal(byName["claude/gone"].gone, true);
  assert.equal(byName["claude/wip"].merged, false);
  assert.equal(byName["claude/wip"].worktree, null);
  assert.match(byName["claude/s1"].worktree, /wt$/);
});
