#!/usr/bin/env bash
# Install the 3.4.0 local chess engines into a built extension folder.
#
# Upstream 3.7.2 ships no engine: analysis happens on Chessr's server. The unlock
# patch splices the 3.4.0 UCI engine classes back in, but the wasm/JS assets are
# 184 MB and are deliberately not committed to the 3.7.2 tree. They are still in
# git history (they were committed with the 3.4.0 build), so this script extracts
# them from there.
#
# This is a forced measure. The original 3.7.2 package was not supposed to
# contain engine binaries, and a build with them enabled is not a faithful copy
# of upstream — it is the 3.4.0 engine stack grafted onto the 3.7.2 client.
#
# Usage:
#   scripts/install-local-engines.sh dist/chessr-unlocked-all-features-3.7.2
#
# Environment:
#   CHESSR_ENGINE_COMMIT   commit that still has versions/3.4.0/.../engine/
#                          (default: the last commit before the 3.7.2 rebuild)
set -euo pipefail

out="${1:?usage: scripts/install-local-engines.sh <build-dir>}"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
commit="${CHESSR_ENGINE_COMMIT:-04c57c6}"

[ -f "$out/manifest.json" ] || { echo "not an extension folder: $out" >&2; exit 1; }

if ! git -C "$root" cat-file -e "$commit:versions/3.4.0/chessr-original-restored/engine/stockfish.js" 2>/dev/null; then
  echo "engine assets not found at $commit — skipping local engines" >&2
  exit 2
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

git -C "$root" archive "$commit" versions/3.4.0/chessr-original-restored/engine \
  | tar -x -C "$tmp"

src="$tmp/versions/3.4.0/chessr-original-restored/engine"
mkdir -p "$out/engine"

# Only the two engines the transplant supports, plus the book Komodo can use.
installed=0
for f in stockfish.js stockfish.wasm dragon.js dragon.wasm book.bin; do
  if [ -f "$src/$f" ]; then
    cp "$src/$f" "$out/engine/$f"
    installed=$((installed + 1))
  fi
done

echo "installed $installed engine file(s) from $commit into $out/engine"
du -sh "$out/engine"
