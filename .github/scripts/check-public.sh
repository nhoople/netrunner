#!/usr/bin/env bash
# This repo is public. Fail if the lines a change adds contain a local path,
# an email address, or something shaped like a secret.
#
# Usage: .github/scripts/check-public.sh <base-ref>   (checks <base-ref>...HEAD)
#        .github/scripts/check-public.sh -            (checks a unified diff on stdin;
#                                                      used by .claude/hooks/public-check.mjs)
# Allowed: commit-trailer emails (noreply@anthropic.com, *@users.noreply.github.com)
# and placeholder domains (example.com/org/net).
set -euo pipefail

base="${1:?usage: check-public.sh <base-ref>}"

patterns=(
  '/home/[a-z_][a-z0-9_-]*/'          # Linux home folder
  '/Users/[A-Za-z][A-Za-z0-9._-]*/'   # macOS home folder
  '[A-Za-z]:\\Users\\'                # Windows home folder
  '~/(Projects|Documents|Desktop|Downloads)\b'
  '[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}'
  'gh[pousr]_[A-Za-z0-9]{30,}'        # GitHub tokens
  'github_pat_[A-Za-z0-9_]{20,}'
  'sk-ant-[A-Za-z0-9_-]{10,}'         # Anthropic keys
  'sk-[A-Za-z0-9]{32,}'
  'AKIA[0-9A-Z]{16}'                  # AWS access keys
  '-----BEGIN [A-Z ]*PRIVATE KEY-----'
)
allow='noreply@anthropic\.com|@users\.noreply\.github\.com|@example\.(com|org|net)'

regex=$(IFS='|'; echo "${patterns[*]}")

# Added lines only, as "file:line: text". This script is left out: it holds the patterns.
added_diff() {
  if [[ "$base" == "-" ]]; then cat; else
    git diff --unified=0 --no-color "$base"...HEAD -- . ':(exclude).github/scripts/check-public.sh'
  fi
}
hits=$(added_diff |
  awk '/^\+\+\+ b\//{f=substr($0,7)} /^@@/{split($3,a,/[+,]/); n=a[2]} /^\+[^+]/{print f":"n": "substr($0,2); n++} /^\+$/{n++}' |
  grep -E -- "$regex" | grep -Ev -- "$allow" || true)

if [[ -n "$hits" ]]; then
  echo "This repo is public. These added lines look like a local path, an email address, or a secret:"
  echo "$hits"
  echo
  echo "Remove them, or use a placeholder (<path>, someone@example.com). See CLAUDE.md: keep secrets, local paths, and personal notes out."
  exit 1
fi
echo "No local paths, emails, or secrets in the added lines."
