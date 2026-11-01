#!/usr/bin/env bash
# Build a loadable unlocked extension folder from the baseline + patches.
#
# Usage:
#   scripts/build-unlocked.sh 3.4.0            -> dist/chessr-unlocked-all-features-3.4.0
#   scripts/build-unlocked.sh 3.4.0 /tmp/out   -> /tmp/out
#
# The result is what you load with "Load unpacked"; it is never committed.
set -euo pipefail

version="${1:?usage: scripts/build-unlocked.sh <version> [out-dir]}"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
vdir="$root/versions/$version"
base="$vdir/chessr-original-restored"
patches="$vdir/patches"
out="${2:-$root/dist/chessr-unlocked-all-features-$version}"

[ -d "$base" ] || { echo "missing baseline: $base" >&2; exit 1; }
[ -d "$patches" ] || { echo "missing $patches — run scripts/make-patches.sh $version first" >&2; exit 1; }

rm -rf "$out"
mkdir -p "$out"
cp -R "$base/." "$out/"

shopt -s nullglob
for patch_file in "$patches"/*.patch; do
  echo "applying $(basename "$patch_file")"
  patch -p1 --batch --forward --directory "$out" < "$patch_file"
done
shopt -u nullglob

if find "$out" -name '*.rej' -o -name '*.orig' | grep -q .; then
  echo "patches left rejects behind:" >&2
  find "$out" \( -name '*.rej' -o -name '*.orig' \) >&2
  exit 1
fi

echo "built $out"
echo "load it with chrome://extensions/ -> Load unpacked"
