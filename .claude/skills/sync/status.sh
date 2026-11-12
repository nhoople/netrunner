#!/usr/bin/env bash
# Read-only report of the five Netrunner checkouts for /sync.
# Run from anywhere: bash .claude/skills/sync/status.sh
set -u
root="$(cd "$(dirname "$0")/../../.." && pwd)"

report() {
  local dir="$1" repo="$2" base="$3"
  echo "== $repo ($dir, base $base)"
  if ! git -C "$dir" rev-parse --git-dir >/dev/null 2>&1; then
    echo "   MISSING checkout"
    return
  fi
  git -C "$dir" fetch -q --prune origin 2>/dev/null || echo "   fetch failed"
  local branch ahead behind
  branch="$(git -C "$dir" rev-parse --abbrev-ref HEAD)"
  ahead="$(git -C "$dir" rev-list --count "origin/$base..$base" 2>/dev/null || echo '?')"
  behind="$(git -C "$dir" rev-list --count "$base..origin/$base" 2>/dev/null || echo '?')"
  echo "   on: $branch | local $base ahead $ahead, behind $behind"
  local dirty
  dirty="$(git -C "$dir" status --porcelain | head -10)"
  [ -n "$dirty" ] && printf '   uncommitted:\n%s\n' "$(sed 's/^/     /' <<<"$dirty")"
  local b
  for b in $(git -C "$dir" for-each-ref --format='%(refname:short)' refs/heads/); do
    [ "$b" = "$base" ] && continue
    local up="gone" merged="no"
    git -C "$dir" rev-parse -q --verify "origin/$b" >/dev/null && up="on origin"
    git -C "$dir" merge-base --is-ancestor "$b" "origin/$base" 2>/dev/null && merged="tip in $base"
    echo "   branch $b: $up, $merged, $(git -C "$dir" rev-list --count "origin/$base..$b") commit(s) not in $base"
  done
  local prs
  prs="$(gh pr list -R "nhoople/$repo" --state open --json number,headRefName,title \
    -q '.[] | "   open PR #\(.number) \(.headRefName): \(.title)"' 2>/dev/null)"
  [ -n "$prs" ] && echo "$prs"
  local ci
  ci="$(gh run list -R "nhoople/$repo" --branch "$base" --limit 1 --json status,conclusion \
    -q 'if length == 0 then "none (no workflow runs)" else .[0] | "\(.status) \(.conclusion // "")" end' 2>/dev/null)"
  [ -n "$ci" ] && echo "   $base CI: $ci"
}

report "$root" netrunner main
report "$root/netrunner-engine" netrunner-engine master
report "$root/netrunner-cards-data" netrunner-cards-data master
report "$root/netrunner-comprehensive-rules-data" netrunner-comprehensive-rules-data master
report "$root/netrunner-game" netrunner-game master

echo "== pins"
python3 -I - "$root" <<'EOF'
import json, sys, subprocess
root = sys.argv[1]
def tag(path):
    try: return json.load(open(f"{root}/{path}"))["tag"]
    except Exception as e: return f"? ({e.__class__.__name__})"
def latest(repo):
    r = subprocess.run(["git", "-C", f"{root}/{repo}", "describe", "--tags", "--abbrev=0", "origin/master"],
                       capture_output=True, text=True)
    return r.stdout.strip() or "?"
print(f"   engine latest tag {latest('netrunner-engine')} | game pins engine {tag('netrunner-game/data/engine-pin.json')}")
print(f"   cards latest tag {latest('netrunner-cards-data')} | engine pins cards {tag('netrunner-engine/data/cards-pin.json')} | game pins cards {tag('netrunner-game/data/cards-pin.json')}")
print(f"   CR latest tag {latest('netrunner-comprehensive-rules-data')} | engine pins CR {tag('netrunner-engine/data/cr-pin.json')}")
r = subprocess.run(["git", "-C", f"{root}/netrunner-engine", "log", "--oneline",
                    f"{latest('netrunner-engine')}..origin/master", "--", "src/"], capture_output=True, text=True)
n = len([l for l in r.stdout.splitlines() if l.strip()])
print(f"   engine src/ commits on master since latest tag: {n}")

# Docs should link the pin table, not restate current versions. Flag tracked
# Markdown lines that state a current pin by version (the phrasings that
# drifted before), outside the pin table and the history and plan records.
import re
skip = re.compile(r"^(README\.md|docs/history\.md|docs/plans/|tests/)")
pinword = re.compile(r"(Pins today|\| \*\*Current\*\* \||pinned to tag|pins this tag|[Ff]loor today|Shipped floor|Current floor:\*\* \*\*`v|Floor:\*\* `?v1|Floor `v1)")
ver = re.compile(r"`?v1\.147\.\d+`?")
hits = []
for repo in ["", "netrunner-engine", "netrunner-cards-data", "netrunner-comprehensive-rules-data", "netrunner-game"]:
    path = f"{root}/{repo}" if repo else root
    files = subprocess.run(["git", "-C", path, "ls-files", "*.md"], capture_output=True, text=True).stdout.split()
    for f in files:
        if not repo and skip.match(f):
            continue
        if repo and f.startswith("tests/"):
            continue
        try:
            lines = open(f"{path}/{f}", encoding="utf-8", errors="ignore").read().splitlines()
        except OSError:
            continue
        for i, line in enumerate(lines, 1):
            if line.startswith("Last residual check"):
                continue
            if ver.search(line) and pinword.search(line):
                hits.append(f"{repo or 'netrunner'}/{f}:{i}")
print(f"   docs restating a pinned version: {len(hits)}" + ("" if not hits else " (link the pin table instead)"))
for h in hits[:15]:
    print(f"     {h}")
EOF
