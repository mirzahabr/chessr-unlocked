#!/usr/bin/env bash
# Build a loadable unlocked extension folder from the baseline + patches.
#
# Usage:
#   scripts/build-unlocked.sh 3.7.2                   -> dist/chessr-unlocked-all-features-3.7.2
#   scripts/build-unlocked.sh 3.7.2 /tmp/out          -> /tmp/out
#   scripts/build-unlocked.sh 3.7.2 --no-local-engines
#
# By default the 3.4.0 local engines (Komodo/Dragon, Stockfish) are extracted from
# git history into the build, because 3.7.2 removed them and moved analysis to the
# server. That is a deliberate, non-upstream forced measure — see
# docs/repository-layout.md §9 and scripts/install-local-engines.sh. Pass
# --no-local-engines to produce a build that matches the patched 3.7.2 tree alone;
# the engine factory then falls back to the server path unchanged.
#
# The result is what you load with "Load unpacked"; it is never committed.
set -euo pipefail

version="${1:?usage: scripts/build-unlocked.sh <version> [out-dir] [--no-local-engines]}"
shift || true

local_engines=1
out=""
for arg in "$@"; do
  case "$arg" in
    --no-local-engines) local_engines=0 ;;
    --local-engines) local_engines=1 ;;
    -*) echo "unknown option: $arg" >&2; exit 2 ;;
    *) out="$arg" ;;
  esac
done

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
vdir="$root/versions/$version"
base="$vdir/chessr-original-restored"
patches="$vdir/patches"
out="${out:-$root/dist/chessr-unlocked-all-features-$version}"

[ -d "$base" ] || { echo "missing baseline: $base" >&2; exit 1; }
[ -d "$patches" ] || { echo "missing $patches — run scripts/make-patches.sh $version first" >&2; exit 1; }

rm -rf "$out"
mkdir -p "$out"
cp -R "$base/." "$out/"

shopt -s nullglob
for patch_file in "$patches"/*.patch; do
  echo "applying $(basename "$patch_file")"
  patch -p1 --batch --forward -d "$out" < "$patch_file"
done
shopt -u nullglob

if find "$out" -name '*.rej' -o -name '*.orig' | grep -q .; then
  echo "patches left rejects behind:" >&2
  find "$out" \( -name '*.rej' -o -name '*.orig' \) >&2
  exit 1
fi

if [ "$local_engines" = 1 ]; then
  if ! bash "$root/scripts/install-local-engines.sh" "$out"; then
    echo "warning: local engines not installed; suggestions stay server-only" >&2
  fi
fi

echo "built $out"
echo "load it with chrome://extensions/ -> Load unpacked"
