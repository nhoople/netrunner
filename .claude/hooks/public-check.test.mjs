// The local Public check before commit and push: run with `node --test .claude/hooks/`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { gitTargets } from "./public-check.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const HOOK = join(here, "public-check.mjs");
const SCRIPT = join(here, "../../.github/scripts/check-public.sh");

// Built at runtime so this file's own lines pass the Public check.
const EMAIL = ["someone", "corp.io"].join("@");
const HOME_PATH = "/" + ["home", "alice", "notes.md"].join("/");
const TOKEN = "ghp_" + "a".repeat(36);

test("finds commits and pushes, with the folder each runs in", () => {
  assert.deepEqual(gitTargets("git status && git commit -qm x", "/w"), [{ kind: "commit", dir: "/w", all: false }]);
  assert.deepEqual(gitTargets("git -C sub commit -am x", "/w"), [{ kind: "commit", dir: "/w/sub", all: true }]);
  assert.deepEqual(gitTargets("cd /r && git add -A && git commit -m x", "/w"), [{ kind: "commit", dir: "/r", all: true }]);
  assert.deepEqual(gitTargets("git push -q -u origin claude/x", "/w"), [{ kind: "push", dir: "/w" }]);
  assert.deepEqual(gitTargets("git push -q origin --delete claude/x", "/w"), []);
  assert.deepEqual(gitTargets("git push origin :claude/x", "/w"), []);
  assert.deepEqual(gitTargets("git log --oneline", "/w"), []);
});

function repo(url) {
  const dir = mkdtempSync(join(tmpdir(), "public-check-"));
  const g = (...args) => execFileSync("git", ["-C", dir, "-c", "user.name=t", "-c", "user.email=test@example.com", ...args], { stdio: "ignore" });
  g("init", "-q", "-b", "main");
  g("remote", "add", "origin", url);
  mkdirSync(join(dir, ".github/scripts"), { recursive: true });
  copyFileSync(SCRIPT, join(dir, ".github/scripts/check-public.sh"));
  writeFileSync(join(dir, "README.md"), "base\n");
  g("add", "-A"); g("commit", "-qm", "base");
  g("update-ref", "refs/remotes/origin/main", "HEAD");
  return { dir, g, write: (f, s) => writeFileSync(join(dir, f), s) };
}

function runHook(cwd, command) {
  const r = spawnSync("node", [HOOK], { input: JSON.stringify({ tool_name: "Bash", cwd, tool_input: { command } }), encoding: "utf8" });
  return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput : null;
}

const META = "https://github.com/nhoople/netrunner.git";

test("blocks a commit that stages an email address", () => {
  const r = repo(META);
  r.write("doc.md", `contact ${EMAIL}\n`);
  r.g("add", "doc.md");
  const out = runHook(r.dir, "git commit -qm docs");
  assert.equal(out.permissionDecision, "deny");
  assert.match(out.permissionDecisionReason, /doc\.md:1: contact someone@corp\.io/);
});

test("checks untracked files when the command stages them first", () => {
  const r = repo(META);
  r.write("new.md", `see ${HOME_PATH}\n`);
  assert.equal(runHook(r.dir, "git add -A && git commit -qm new").permissionDecision, "deny");
  assert.equal(runHook(r.dir, "git commit -qm new"), null, "nothing staged, nothing to check");
});

test("allows a clean commit", () => {
  const r = repo(META);
  r.write("doc.md", "contact someone@example.com, see <path>\n");
  assert.equal(runHook(r.dir, "git add -A && git commit -qm docs"), null);
});

test("blocks a push whose commits add a token, allows deleting a branch", () => {
  const r = repo(META);
  r.g("switch", "-qc", "claude/x");
  r.write("cfg.md", `token ${TOKEN}\n`);
  r.g("add", "-A"); r.g("commit", "-qm", "cfg");
  assert.equal(runHook(r.dir, "git push -q -u origin claude/x").permissionDecision, "deny");
  assert.equal(runHook(r.dir, "git push -q origin --delete claude/x"), null);
});

test("leaves other repos alone", () => {
  const r = repo("https://github.com/nhoople/netrunner-engine.git");
  r.write("doc.md", `contact ${EMAIL}\n`);
  assert.equal(runHook(r.dir, "git add -A && git commit -qm docs"), null);
});
