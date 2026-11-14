#!/usr/bin/env node
// PreToolUse hook (Bash): when a foreground command waits with `sleep N`
// (N >= 5) or blocks on `gh run watch`, remind the session of the tools that
// wait without holding the turn. Never blocks.
//
// Past sessions spent most of these on `sleep 15; gh run list ...` loops
// waiting for CI after a push. Fires on the 1st match, then every NUDGE_EVERY.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const NUDGE_EVERY = 5;
const MIN_SLEEP = 5;

function waitKind(cmd) {
  const sleeps = [...cmd.matchAll(/(?:^|[;&|(]|\b(?:do|then|else))\s*sleep\s+(\d+(?:\.\d+)?)([smh]?)\b/g)].map(([, n, u]) =>
    Number(n) * (u === "m" ? 60 : u === "h" ? 3600 : 1),
  );
  const ci = /\bgh\s+(run|pr)\s+(list|view|checks|watch)\b/.test(cmd);
  if (/\bgh\s+run\s+watch\b/.test(cmd)) return "ci";
  if (sleeps.some((s) => s >= MIN_SLEEP)) return ci ? "ci" : "sleep";
  return null;
}

function shouldNudge(sessionId) {
  const dir = join(tmpdir(), "claude-wait-nudge");
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
  if (input.tool_name !== "Bash" || input.tool_input?.run_in_background) process.exit(0);
  const kind = waitKind(input.tool_input?.command ?? "");
  if (!kind || !shouldNudge(input.session_id)) process.exit(0);
  const msg =
    kind === "ci"
      ? "This waits on CI in the foreground. For a PR, the ccd_pr tools (`get_status`, Auto-fix) track checks without polling. " +
        "Otherwise run `gh run watch <id> --exit-status` with run_in_background: true; you are re-invoked when it exits. " +
        "Do not loop `sleep; gh run list`."
      : "This waits with sleep in the foreground. Run long commands with run_in_background: true (you are re-invoked when they exit), " +
        "or use the Monitor tool (deferred: ToolSearch \"select:Monitor\") to wait until a condition holds, such as a log line or a file appearing.";
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: msg },
  }));
  process.exit(0);
});
