#!/usr/bin/env node
// PreToolUse hook (Bash): when a session runs `git commit` in netrunner-engine
// or netrunner-game with source changes staged, remind it of the CLAUDE.md
// rules for that commit. Never blocks.
//
// - Source changed, no test file staged: "add or update a test there".
// - Engine source changed and this session has not run the cr-checker agent:
//   "run cr-checker on the diff before committing a rules change".

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

const REPOS = {
  "netrunner-engine": {
    isSource: (f) => f.startsWith("src/"),
    isTest: (f) => f.startsWith("tests/"),
    testHint: "Engine: a test under tests/, in the folder that mirrors the src/ folder or names its kind of check (tests/README.md), then `npm test` (the affected file first, then the suite for a rules change).",
    crChecker: true,
  },
  "netrunner-game": {
    isSource: (f) => f.startsWith("src/"),
    isTest: (f) => f.startsWith("tests/"),
    testHint: "Game: a test under tests/, in the folder that mirrors the src/ folder, then `npm test`. A game test does not cover an engine rules change.",
    crChecker: false,
  },
};

const unquote = (s) => s.replace(/^["']|["']$/g, "");

// The folder the commit runs in: `git -C <dir> commit`, else the last `cd <dir>`
// before it, else the session's cwd.
function commitDir(cmd, cwd) {
  const m = cmd.match(/\bgit\s+(?:-C\s+("[^"]+"|'[^']+'|\S+)\s+)?commit\b/);
  if (!m) return null;
  let dir = cwd;
  const before = cmd.slice(0, m.index);
  const cds = [...before.matchAll(/(?:^|[;&|(]\s*)cd\s+("[^"]+"|'[^']+'|[^\s;&|)]+)/g)];
  if (cds.length) dir = resolve(dir, unquote(cds.at(-1)[1]));
  if (m[1]) dir = resolve(dir, unquote(m[1]));
  // The hook runs before the command, so `git add ... && git commit` has
  // staged nothing yet: count unstaged and untracked files too.
  const all =
    /\bcommit\b[^;&|]*\s-(?:-all\b|[a-zA-Z]*a)/.test(cmd.slice(m.index)) ||
    /\bgit\s+(?:-C\s+\S+\s+)?add\b/.test(before);
  return { dir, all };
}

const git = (dir, ...args) =>
  execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 3000 }).trim();

function repoName(dir) {
  try {
    const url = git(dir, "remote", "get-url", "origin");
    return Object.keys(REPOS).find((r) => new RegExp(`[/:]nhoople/${r}(?:\\.git)?$`).test(url)) ?? null;
  } catch {
    return null;
  }
}

function changedFiles(dir, all) {
  const lines = [git(dir, "diff", "--cached", "--name-only")];
  if (all) lines.push(git(dir, "diff", "--name-only"), git(dir, "ls-files", "--others", "--exclude-standard"));
  return [...new Set(lines.join("\n").split("\n").filter(Boolean))];
}

function ranCrChecker(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) return false;
  try {
    return /subagent_type\\?"\s*:\s*\\?"cr-checker\\?"/.test(readFileSync(transcriptPath, "utf8"));
  } catch {
    return false;
  }
}

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }
  if (input.tool_name !== "Bash") process.exit(0);
  const cwd = input.cwd && isAbsolute(input.cwd) ? input.cwd : process.cwd();
  const target = commitDir(input.tool_input?.command ?? "", cwd);
  if (!target) process.exit(0);
  const name = repoName(target.dir);
  if (!name) process.exit(0);
  const repo = REPOS[name];
  let files;
  try { files = changedFiles(target.dir, target.all); } catch { process.exit(0); }
  if (!files.some(repo.isSource)) process.exit(0);

  const notes = [];
  if (!files.some(repo.isTest)) {
    notes.push(`This ${name} commit changes source but stages no test file. CLAUDE.md "Tests before updating a repo": add or update a test there for the behavior. ${repo.testHint} If the change truly has no behavior to test (a rename, a comment), say so in the PR's Review section.`);
  }
  if (repo.crChecker && !ranCrChecker(input.transcript_path)) {
    notes.push("This session has not run the cr-checker agent. If this commit changes engine behavior, run cr-checker on the diff and address what it reports before committing (CLAUDE.md \"Check the Comprehensive Rules\"), and cite the rule number the change follows.");
  }
  if (!notes.length) process.exit(0);
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: notes.join(" ") },
  }));
  process.exit(0);
});
