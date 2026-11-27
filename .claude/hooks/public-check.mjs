#!/usr/bin/env node
// PreToolUse hook (Bash): before a `git commit` or `git push` in the meta
// repo, run the Public check (.github/scripts/check-public.sh) on the lines
// that would be committed or pushed, and block the command if any looks like
// a local path, an email address, or a secret. The meta repo is public, so
// this catches them before CI does, and before a push makes them public.
//
// Commit: the staged diff; with `-a` or a `git add` earlier in the same
// command, also unstaged and untracked files (the hook runs before the
// command, so nothing is staged yet). Push: origin/main...HEAD, as in CI.
// Other repos, `git push --delete`, and any error inside the hook: allowed.
//
// Test: node --test .claude/hooks/

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = ".github/scripts/check-public.sh";
const EXCLUDE = `:(exclude)${SCRIPT}`;
const META = /[/:]nhoople\/netrunner(?:\.git)?$/;
const unquote = (s) => s.replace(/^["']|["']$/g, "");

// Each `git commit` and `git push` in the command, with the folder it runs
// in: `git -C <dir>`, else the last `cd <dir>` before it, else the cwd.
export function gitTargets(cmd, cwd) {
  const out = [];
  const re = /\bgit\s+(?:-C\s+("[^"]+"|'[^']+'|\S+)\s+)?(commit|push)\b([^;&|]*)/g;
  for (const m of cmd.matchAll(re)) {
    const before = cmd.slice(0, m.index);
    let dir = cwd;
    const cds = [...before.matchAll(/(?:^|[;&|(]\s*)cd\s+("[^"]+"|'[^']+'|[^\s;&|)]+)/g)];
    if (cds.length) dir = resolve(dir, unquote(cds.at(-1)[1]));
    if (m[1]) dir = resolve(dir, unquote(m[1]));
    const [, , kind, args] = m;
    if (kind === "push") {
      if (/(?:^|\s)(?:--delete|-d)\b|(?:^|\s):\S/.test(args)) continue;
      out.push({ kind, dir });
    } else {
      const all = /(?:^|\s)(?:--all\b|-[a-zA-Z]*a)/.test(args) || /\bgit\s+(?:-C\s+\S+\s+)?add\b/.test(before);
      out.push({ kind, dir, all });
    }
  }
  return out;
}

const git = (dir, ...args) =>
  execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 5000 });

export function isMetaRepo(dir) {
  try { return META.test(git(dir, "remote", "get-url", "origin").trim()); } catch { return false; }
}

// The diff a commit would add, as check-public.sh reads it on stdin.
export function commitDiff(top, all) {
  const parts = [git(top, "diff", "--cached", "--unified=0", "--no-color", "--", ".", EXCLUDE)];
  if (all) {
    parts.push(git(top, "diff", "--unified=0", "--no-color", "--", ".", EXCLUDE));
    const untracked = git(top, "ls-files", "--others", "--exclude-standard").split("\n").filter((f) => f && f !== SCRIPT);
    for (const f of untracked) {
      // --no-index exits 1 when the files differ, which they always do here.
      const r = spawnSync("git", ["-C", top, "diff", "--no-index", "--unified=0", "--no-color", "--", "/dev/null", f], { encoding: "utf8", timeout: 5000 });
      parts.push(r.stdout || "");
    }
  }
  return parts.join("\n");
}

// Run the Public check for one target. Returns its report when it fails, else null.
export function check(target) {
  if (!isMetaRepo(target.dir)) return null;
  const top = git(target.dir, "rev-parse", "--show-toplevel").trim();
  const script = join(top, SCRIPT);
  if (!existsSync(script)) return null;
  const r = target.kind === "push"
    ? spawnSync("bash", [script, "origin/main"], { cwd: top, encoding: "utf8", timeout: 20000 })
    : spawnSync("bash", [script, "-"], { cwd: top, input: commitDiff(top, target.all), encoding: "utf8", timeout: 20000 });
  return r.status === 1 ? (r.stdout || "").trim() : null;
}

function main(raw) {
  let input;
  try { input = JSON.parse(raw); } catch { return; }
  if (input.tool_name !== "Bash") return;
  const cwd = input.cwd && isAbsolute(input.cwd) ? input.cwd : process.cwd();
  for (const t of gitTargets(input.tool_input?.command ?? "", cwd)) {
    let report = null;
    try { report = check(t); } catch { continue; }
    if (!report) continue;
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason:
          `Blocked this git ${t.kind}: the meta repo is public and the Public check (${SCRIPT}) failed locally.\n${report}\n` +
          (t.kind === "push"
            ? "Fix the commits on this branch (amend or a new commit that removes the lines), then push again."
            : "Remove or placeholder those lines, then commit again."),
      },
    }));
    return;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let raw = "";
  process.stdin.on("data", (c) => (raw += c));
  process.stdin.on("end", () => { try { main(raw); } finally { process.exit(0); } });
}
