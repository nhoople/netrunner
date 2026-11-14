#!/usr/bin/env node
// PreToolUse hook (Bash, Grep): when a search looks for a TypeScript symbol in
// netrunner-engine or netrunner-game, remind the session that the LSP tool
// answers definitions and references better than text search. Never blocks.
//
// Fires on the 1st matching search in a session and then every NUDGE_EVERY
// matches after, so it stays a reminder rather than noise.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const NUDGE_EVERY = 10;
const TS_REPO = /netrunner-(engine|game)\b/;
// camelCase or PascalCase with at least one lower-to-upper hump: buildEffect,
// RunState. snake_case effect kinds and plain words are left to grep.
const TS_SYMBOL = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const HAS_HUMP = /[a-z0-9][A-Z]/;
const NON_TS_TARGET = /\.(json|md|py|txt|ya?ml|csv)\b|--include=?['"]?\*\.(json|md|py)|--type[= ](json|md|py)|-t (json|md|py)\b/;

function symbolsIn(text) {
  return text
    .split(/[\s'"|]+/)
    .map((t) => t.replace(/^\\b|\\b$/g, "").replace(/^\\</, "").replace(/\\>$/, ""))
    .filter((t) => TS_SYMBOL.test(t) && HAS_HUMP.test(t));
}

function findSymbol(input) {
  const { tool_name: tool, tool_input: ti = {}, cwd = "" } = input;
  if (tool === "Grep") {
    const scope = `${cwd} ${ti.path ?? ""}`;
    if (!TS_REPO.test(scope)) return null;
    if (NON_TS_TARGET.test(`${ti.glob ?? ""} ${ti.type ?? ""} ${ti.path ?? ""}`)) return null;
    return symbolsIn(ti.pattern ?? "")[0] ?? null;
  }
  if (tool === "Bash") {
    const cmd = ti.command ?? "";
    const m = cmd.match(/(?:^|[|;&(]\s*|\s)(?:git\s+grep|rg|grep|egrep)\s+([^|;&]*)/);
    if (!m) return null;
    if (!TS_REPO.test(`${cwd} ${cmd}`)) return null;
    if (NON_TS_TARGET.test(m[1])) return null;
    return symbolsIn(` ${m[1]}`.replace(/\s-{1,2}[A-Za-z][\w-]*(=\S*)?/g, " "))[0] ?? null;
  }
  return null;
}

function shouldNudge(sessionId) {
  const dir = join(tmpdir(), "claude-lsp-nudge");
  const file = join(dir, `${(sessionId || "unknown").replace(/[^\w-]/g, "")}.count`);
  let n = 0;
  try { n = Number(readFileSync(file, "utf8")) || 0; } catch {}
  try { mkdirSync(dir, { recursive: true }); writeFileSync(file, String(n + 1)); } catch {}
  return n % NUDGE_EVERY === 0;
}

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }
  const symbol = findSymbol(input);
  if (!symbol || !shouldNudge(input.session_id)) process.exit(0);
  const repo = `${input.cwd ?? ""} ${input.tool_input?.command ?? input.tool_input?.path ?? ""}`.match(TS_REPO)?.[0] ?? "netrunner-engine";
  const msg =
    `\`${symbol}\` looks like a TypeScript symbol. For its definition, callers, or type, ` +
    `the LSP tool (goToDefinition, findReferences, hover, workspaceSymbol) is more precise than text search. ` +
    `It is deferred: load it with ToolSearch "select:LSP". Run \`cd ${repo}\` in Bash first, or results from the meta root come back empty. ` +
    `Keep using grep for strings, comments, card JSON, and CR text.`;
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: msg },
  }));
  process.exit(0);
});
