#!/usr/bin/env node
// Look up Comprehensive Rules nodes and cards at the versions the engine pins.
// Reads netrunner-engine/vendor/{cr-data,cards-data}; no dependencies.
//
//   lookup.mjs cr <number|id> [--depth N] [--examples]
//   lookup.mjs cr --search <text> [--limit N]
//   lookup.mjs card <title|id> [--ir] [--rulings]
//   lookup.mjs card --search <text> [--limit N]
//   lookup.mjs kind <effect_kind> [--limit N]
//
// --engine <dir> reads another engine checkout's vendor/ (a worktree, say).

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const META = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function parseArgs(argv) {
  const out = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (["search", "limit", "depth", "engine"].includes(key)) {
        out.flags[key] = next;
        i++;
      } else out.flags[key] = true;
    } else out._.push(a);
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const engine = resolve(args.flags.engine ?? process.env.LOOKUP_ENGINE ?? join(META, "netrunner-engine"));
const vendor = join(engine, "vendor");
const limit = Number(args.flags.limit ?? 20);

function die(msg) {
  console.error(msg);
  process.exit(1);
}

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const norm = (s) =>
  String(s ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Warn when vendor/ is older than the engine's pin file.
function checkPin(kind) {
  const dir = join(vendor, kind === "cr" ? "cr-data" : "cards-data");
  const pinFile = join(engine, "data", kind === "cr" ? "cr-pin.json" : "cards-pin.json");
  const fetch = kind === "cr" ? "npm run fetch-cr" : "npm run fetch-cards";
  if (!existsSync(join(dir, "PIN.json"))) die(`No ${dir}. Run \`${fetch}\` in ${engine}.`);
  const have = readJson(join(dir, "PIN.json")).tag;
  const want = existsSync(pinFile) ? readJson(pinFile).tag : have;
  if (have !== want) console.error(`warning: vendor has ${kind} ${have} but the engine pins ${want}. Run \`${fetch}\`.`);
  return { dir, tag: have };
}

// ---------- Comprehensive Rules ----------

function loadCr() {
  const { dir, tag } = checkPin("cr");
  const nodes = readJson(join(dir, "nodes.json"));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const byNumber = new Map(nodes.filter((n) => n.number).map((n) => [n.number, n]));
  return { nodes, byId, byNumber, tag };
}

function nodeLine(n) {
  const head = [n.number, n.title].filter(Boolean).join(" ");
  const text = n.text_plain ?? n.snippet_plain ?? "";
  return text && text !== n.title ?`${head}${n.title ? "." : ""} ${text}`.trim() : head;
}

function printNode(cr, n, depth, indent, withExamples) {
  console.log(`${"  ".repeat(indent)}${nodeLine(n)}`);
  if (withExamples) {
    for (const e of n.examples ?? []) console.log(`${"  ".repeat(indent + 1)}Example: ${e.text_plain}`);
  }
  if (depth <= 0) {
    const kids = (n.child_ids ?? []).filter((id) => cr.byId.get(id)?.kind !== "example");
    if (kids.length) console.log(`${"  ".repeat(indent + 1)}(${kids.length} child nodes; raise --depth to show)`);
    return;
  }
  for (const id of n.child_ids ?? []) {
    const c = cr.byId.get(id);
    if (c && c.kind !== "example") printNode(cr, c, depth - 1, indent + 1, withExamples);
  }
}

function cmdCr() {
  const cr = loadCr();
  if (args.flags.search) {
    const q = norm(args.flags.search);
    const hits = cr.nodes.filter((n) => n.kind !== "example" && norm(`${n.title ?? ""} ${n.text_plain ?? ""}`).includes(q));
    console.log(`CR ${cr.tag}: ${hits.length} match${hits.length === 1 ? "" : "es"} for "${args.flags.search}"`);
    for (const n of hits.slice(0, limit)) console.log(`  ${nodeLine(n).slice(0, 200)}`);
    if (hits.length > limit) console.log(`  ... ${hits.length - limit} more (--limit N)`);
    return;
  }
  const key = args._[1];
  if (!key) die("usage: lookup.mjs cr <number|id> | cr --search <text>");
  const n = cr.byNumber.get(key) ?? cr.byId.get(key);
  if (!n) die(`No CR node "${key}" in ${cr.tag}. Try: cr --search <text>`);
  const parent = n.parent_id && cr.byId.get(n.parent_id);
  console.log(`CR ${cr.tag} · ${n.kind} ${n.number ?? n.id}${parent ? ` · under ${[parent.number, parent.title].filter(Boolean).join(" ")}` : ""}`);
  if (n.url) console.log(n.url);
  printNode(cr, n, Number(args.flags.depth ?? 0), 0, Boolean(args.flags.examples));
}

// ---------- Cards ----------

function loadCards() {
  const { dir, tag } = checkPin("cards");
  const cards = [];
  for (const side of ["corp", "runner"]) {
    for (const type of readdirSync(join(dir, side))) {
      const tdir = join(dir, side, type);
      for (const f of readdirSync(tdir)) if (f.endsWith(".json")) cards.push(readJson(join(tdir, f)));
    }
  }
  const printed = (id) => {
    const p = join(dir, "printed", `${id}.json`);
    return existsSync(p) ? readJson(p) : null;
  };
  const rulings = (id) => {
    const p = join(dir, "rulings", `${id}.json`);
    return existsSync(p) ? readJson(p).rulings ?? [] : [];
  };
  return { cards, printed, rulings, tag };
}

function findCard(db, key) {
  const q = norm(key);
  const exact = db.cards.filter((c) => c.id === key || norm(c.title) === q || norm(c.id) === q);
  if (exact.length) return { card: exact[0], others: [] };
  const partial = db.cards.filter((c) => norm(c.title).includes(q));
  return partial.length === 1 ? { card: partial[0], others: [] } : { card: null, others: partial };
}

const STAT_KEYS = ["playCost", "installCost", "rezCost", "trashCost", "advancementRequirement", "agendaPoints", "strength", "memoryCost", "link", "influence", "deckLimit", "minimumDeckSize", "influenceLimit"];

function summarizeIr(node, out = new Set()) {
  if (Array.isArray(node)) node.forEach((x) => summarizeIr(x, out));
  else if (node && typeof node === "object") {
    if (typeof node.kind === "string") out.add(node.kind);
    if (typeof node.op === "string" && !["do", "seq"].includes(node.op)) out.add(`op:${node.op}`);
    Object.values(node).forEach((v) => summarizeIr(v, out));
  }
  return out;
}

function cmdCard() {
  const db = loadCards();
  if (args.flags.search) {
    const q = norm(args.flags.search);
    const hits = db.cards.filter((c) => norm(`${c.title} ${db.printed(c.id)?.strippedText ?? ""}`).includes(q));
    console.log(`cards ${db.tag}: ${hits.length} match${hits.length === 1 ? "" : "es"} for "${args.flags.search}"`);
    for (const c of hits.slice(0, limit)) console.log(`  ${c.title} (${c.id}) · ${c.side} ${c.type}`);
    if (hits.length > limit) console.log(`  ... ${hits.length - limit} more (--limit N)`);
    return;
  }
  const key = args._.slice(1).join(" ");
  if (!key) die("usage: lookup.mjs card <title|id> | card --search <text>");
  const { card, others } = findCard(db, key);
  if (!card) {
    if (!others.length) die(`No card matching "${key}" in cards ${db.tag}. Try: card --search <text>`);
    console.log(`"${key}" matches ${others.length} cards:`);
    for (const c of others.slice(0, limit)) console.log(`  ${c.title} (${c.id})`);
    process.exit(1);
  }
  const stats = STAT_KEYS.filter((k) => card[k] !== undefined).map((k) => `${k} ${card[k]}`);
  console.log(`${card.title} (${card.id}) · cards ${db.tag}`);
  console.log(`${card.side} ${card.type}${card.subtypes?.length ? ` · ${card.subtypes.join(", ")}` : ""} · ${card.faction ?? "-"}`);
  if (stats.length) console.log(stats.join(" · "));
  if (card.unsupported?.length) console.log(`unsupported: ${JSON.stringify(card.unsupported)}`);
  const p = db.printed(card.id);
  console.log(`\nPrinted text:\n${p?.text ?? "(none)"}`);
  const abilities = card.abilities ?? [];
  console.log(`\nAbilities (${abilities.length}):`);
  for (const a of abilities) {
    const label = [a.class, a.trigger, a.rule && `CR ${a.rule}`, a.id].filter(Boolean).join(" · ");
    console.log(`  - ${label}${a.text ? `: ${a.text}` : ""}`);
    if (!args.flags.ir) console.log(`    uses: ${[...summarizeIr(a.instructions ?? a)].join(", ") || "-"}`);
  }
  const rest = Object.fromEntries(Object.entries(card).filter(([k]) => !["id", "title", "side", "type", "subtypes", "faction", "abilities", "unsupported", "wave", ...STAT_KEYS].includes(k)));
  if (Object.keys(rest).length) console.log(`\nOther fields: ${JSON.stringify(rest)}`);
  if (args.flags.ir) console.log(`\nIR:\n${JSON.stringify(abilities, null, 2)}`);
  const rulings = db.rulings(card.id);
  if (args.flags.rulings) {
    console.log(`\nRulings (${rulings.length}):`);
    for (const r of rulings) {
      const clean = (s) => String(s ?? "").replace(/<[^>]+>/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/^#+.*\n/, "").trim();
      console.log(`  Q (${r.dateUpdate ?? "?"}): ${clean(r.question)}\n  A: ${clean(r.answer)}\n`);
    }
  } else if (rulings.length) console.log(`\n${rulings.length} ruling(s): add --rulings`);
}

function cmdKind() {
  const kind = args._[1];
  if (!kind) die("usage: lookup.mjs kind <effect_kind>");
  const db = loadCards();
  const hits = db.cards.filter((c) => summarizeIr(c.abilities ?? []).has(kind));
  console.log(`cards ${db.tag}: ${hits.length} card${hits.length === 1 ? "" : "s"} use kind "${kind}"`);
  for (const c of hits.slice(0, limit)) console.log(`  ${c.title} (${c.id})`);
  if (hits.length > limit) console.log(`  ... ${hits.length - limit} more (--limit N)`);
}

const cmd = args._[0];
if (cmd === "cr") cmdCr();
else if (cmd === "card") cmdCard();
else if (cmd === "kind") cmdKind();
else die("usage: lookup.mjs cr <number|id> | cr --search <text> | card <title|id> [--ir] [--rulings] | card --search <text> | kind <effect_kind>");
