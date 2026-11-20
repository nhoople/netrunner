#!/usr/bin/env python3
"""Read-only report: what the upstream reference clones would bring in, and
whether it touches our cards or decks. Called by status.sh after it fetches.

Usage: python3 -I upstream_report.py <workspace-root> [--since NAME=REF ...]

The clones live in ../upstream beside the workspace. For each one the report
compares the local checkout (HEAD) with what was fetched (@{u}), so run it
before pulling. --since overrides HEAD for one clone (for testing).

netrunner-cards-json is compared with the cards repo's catalog pin instead,
since that is the version our card data comes from.

It never edits anything. Findings go to Nathaniel; a sync does not act on them.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

CAP = 12


def git(repo: Path, *args: str) -> str:
    r = subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else ""


def resolve(repo: Path, ref: str) -> str:
    return git(repo, "rev-parse", "-q", "--verify", f"{ref}^{{commit}}").strip()


def subjects(repo: Path, since: str, target: str) -> list[str]:
    out = git(repo, "log", "--no-merges", "--format=%h %s", f"{since}..{target}")
    return [line for line in out.splitlines() if "dependabot" not in line.lower()]


def say(line: str = "") -> None:
    print(f"   {line}" if line else "")


def capped(items: list[str], indent: str = "  ") -> None:
    for item in items[:CAP]:
        say(f"{indent}{item}")
    if len(items) > CAP:
        say(f"{indent}... and {len(items) - CAP} more")


def our_cards(root: Path) -> tuple[set[str], dict[str, str]]:
    """Our card ids, and printed title (lowercase) -> id."""
    printed = root / "netrunner-cards-data" / "data" / "printed"
    ids: set[str] = set()
    titles: dict[str, str] = {}
    for path in printed.glob("*.json"):
        ids.add(path.stem)
        try:
            title = json.loads(path.read_text(encoding="utf-8")).get("strippedTitle")
        except (OSError, ValueError):
            continue
        if isinstance(title, str):
            titles[title.lower()] = path.stem
    return ids, titles


def cards_json(root: Path, repo: Path, ids: set[str]) -> None:
    pin_path = root / "netrunner-cards-data" / "data" / "nsg-catalog-pin.json"
    try:
        pin = json.loads(pin_path.read_text(encoding="utf-8"))["ref"]
    except (OSError, ValueError, KeyError):
        say("  no catalog pin found")
        return
    target = resolve(repo, "@{u}")
    if not resolve(repo, pin):
        say(f"  pin {pin[:10]} is not in the clone; pull it, then rerun")
        return
    if resolve(repo, pin) == target:
        say("  pin matches upstream main")
        return
    count = git(repo, "rev-list", "--count", f"{pin}..{target}").strip()
    changed = git(repo, "diff", "--name-only", pin, target, "--", "v2", "rotations.json").split()
    say(f"  pin is {count} commit(s) behind upstream main; {len(changed)} catalog file(s) differ")
    if not changed:
        say("  no catalog data changed (tooling only)")
        return
    cards = [p for p in changed if p.startswith("v2/cards/")]
    ours = sorted(
        Path(p).stem.replace("_", "-") for p in cards if Path(p).stem.replace("_", "-") in ids
    )
    if cards:
        say(f"  card files: {len(cards)}, of which ours: {len(ours)}")
        capped(ours, "    ")
    other = [p for p in changed if not p.startswith("v2/cards/")]
    if other:
        say("  other catalog files:")
        capped(other, "    ")
    say("  -> field diffs: python3 scripts/nsg_catalog.py check (in netrunner-cards-data).")
    say("     Moving the pin is Nathaniel's call.")


DEFCARD = re.compile(r'^\(defcard "([^"]+)"')
DEFTEST = re.compile(r"^\(deftest ([a-z0-9-]+)")
HUNK = re.compile(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@")


def touched_forms(
    repo: Path, since: str, target: str, path: str, pattern: re.Pattern[str]
) -> set[str]:
    """Names of the top-level forms matching pattern that the diff touches."""
    diff = git(repo, "diff", "-U0", since, target, "--", path)
    found: set[str] = set()
    current = ""
    cache: dict[str, list[str]] = {}
    for line in diff.splitlines():
        if line.startswith("+++ b/"):
            current = line[6:]
            continue
        m = HUNK.match(line)
        if not m or not current:
            continue
        if current not in cache:
            cache[current] = git(repo, "show", f"{target}:{current}").splitlines()
        body = cache[current]
        for n in range(min(max(int(m.group(1)), 1), len(body)), 0, -1):
            form = pattern.match(body[n - 1])
            if form:
                found.add(form.group(1))
                break
    return found


def test_card(name: str, ids: set[str]) -> str | None:
    """Our card id for a jinteki test name: the longest id it starts with."""
    parts = name.split("-")
    for n in range(len(parts), 0, -1):
        if "-".join(parts[:n]) in ids:
            return "-".join(parts[:n])
    return None


def jinteki(repo: Path, since: str, target: str, ids: set[str], titles: dict[str, str]) -> None:
    subs = subjects(repo, since, target)
    say(f"  {len(subs)} new non-merge commit(s)")
    defs = touched_forms(repo, since, target, "src/clj/game/cards", DEFCARD)
    tests = touched_forms(repo, since, target, "test/clj/game/cards", DEFTEST)
    by_def = {titles[t.lower()] for t in defs if t.lower() in titles}
    by_test = {c for t in tests if (c := test_card(t, ids))}
    say(f"  card definitions changed: {len(defs)}; card tests changed: {len(tests)}")
    if by_def:
        say(f"  our cards whose definition changed: {len(by_def)}")
        capped(sorted(by_def), "    ")
    if by_test - by_def:
        say(f"  our cards whose test changed (a rules fix can sit in core): {len(by_test - by_def)}")
        capped(sorted(by_test - by_def), "    ")
    if by_def or by_test:
        say("  -> check these against our engine (CR at the engine pin wins).")
    core = git(repo, "diff", "--name-only", since, target, "--", "src/clj/game/core").split()
    if core:
        say("  core rules files changed:")
        capped(core, "    ")
    if subs:
        say("  commits:")
        capped(subs, "    ")


DECK_FILES = re.compile(r"deck_validator|restriction|format|card_pool|legal", re.I)


def api_server(repo: Path, since: str, target: str) -> None:
    subs = subjects(repo, since, target)
    files = git(repo, "diff", "--name-only", since, target).split()
    deck = [f for f in files if DECK_FILES.search(f)]
    say(f"  {len(subs)} new non-merge commit(s), {len(files)} file(s) changed")
    if deck:
        say("  deck legality or format files changed:")
        capped(deck, "    ")
        say("  -> check the game's deck rules against them.")
    elif files:
        say("  nothing touching deck legality or formats")


def main() -> int:
    root = Path(sys.argv[1]).resolve()
    since: dict[str, str] = {}
    args = sys.argv[2:]
    while args:
        if args[0] == "--since" and len(args) > 1 and "=" in args[1]:
            name, ref = args[1].split("=", 1)
            since[name] = ref
            args = args[2:]
        else:
            print(f"unknown argument {args[0]!r}", file=sys.stderr)
            return 2
    up = root.parent / "upstream"
    if not up.is_dir():
        say("none (no ../upstream folder)")
        return 0
    ids, titles = our_cards(root)
    for repo in sorted(p for p in up.iterdir() if (p / ".git").exists()):
        name = repo.name
        head = resolve(repo, since.get(name, "HEAD"))
        target = resolve(repo, "@{u}")
        behind = git(repo, "rev-list", "--count", f"{head}..{target}").strip() or "?"
        if name == "netrunner-cards-json":
            say(f"{name}: clone behind {behind}; catalog pin compared with upstream main")
            cards_json(root, repo, ids)
            continue
        if not head or not target or head == target:
            say(f"{name}: nothing new")
            continue
        say(f"{name}: behind {behind}")
        if name == "jinteki-netrunner":
            jinteki(repo, head, target, ids, titles)
        elif name == "netrunnerdb-api-server":
            api_server(repo, head, target)
    return 0


if __name__ == "__main__":
    sys.exit(main())
