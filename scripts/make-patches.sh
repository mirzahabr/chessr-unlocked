#!/usr/bin/env bash
# Regenerate versions/<version>/patches/ from that version's two builds.
#
# The patch layer is optional: it lets a clone store the unlocked build as a diff
# against the baseline instead of a second full copy (about 190 MB per build,
# most of it vendored engines that are byte-identical in both). See
# docs/repository-layout.md §"Optional: patch layer" for the trade-off.
#
# Usage: scripts/make-patches.sh 3.4.0
set -euo pipefail

version="${1:?usage: scripts/make-patches.sh <version>}"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
vdir="$root/versions/$version"

[ -d "$vdir/chessr-original-restored" ] || { echo "missing baseline: $vdir/chessr-original-restored" >&2; exit 1; }
[ -d "$vdir/chessr-unlocked-all-features" ] || { echo "missing build: $vdir/chessr-unlocked-all-features" >&2; exit 1; }

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# diff -p1 patches need the two trees to sit at the same depth, so stage them.
cp -R "$vdir/chessr-original-restored" "$tmp/a"
cp -R "$vdir/chessr-unlocked-all-features" "$tmp/b"

mkdir -p "$vdir/patches"
rm -f "$vdir/patches"/*.patch

set +e
(cd "$tmp" && diff -ruN --exclude=.DS_Store a b > "$vdir/patches/0000-unlocked.patch")
status=$?
set -e
# diff exits 1 when the trees differ, which is exactly the case we want.
if [ "$status" -gt 1 ]; then
  echo "diff failed with status $status" >&2
  exit 1
fi

if grep -q '^Binary files' "$vdir/patches/0000-unlocked.patch"; then
  echo "refusing to write a patch containing binary blobs:" >&2
  grep '^Binary files' "$vdir/patches/0000-unlocked.patch" >&2
  echo "engine/ must be byte-identical between the two builds — run scripts/verify.py" >&2
  exit 1
fi

lines=$(wc -l < "$vdir/patches/0000-unlocked.patch" | tr -d ' ')
echo "wrote versions/$version/patches/0000-unlocked.patch ($lines lines)"
