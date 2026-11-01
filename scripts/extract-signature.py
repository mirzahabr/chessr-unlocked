#!/usr/bin/env python3
"""Extract a structural fingerprint (signature) from a restored build.

The signature is the mechanically-derived half of the knowledge base: counts of the
browser/JS surfaces a build uses, the endpoints it can reach, the message vocabulary it
speaks, and the manifest facts. It is regenerated for each processed version and compared
by eye — a diff between two signatures is the fastest way to spot a behaviour change that
the prose missed.

    scripts/extract-signature.py versions/3.7.2/chessr-original-restored \
        > knowledge-base/signatures/3.7.2.json
"""

from __future__ import annotations

import json
import os
import re
import sys

JS_FILES = (
    "background.js",
    "content-scripts/content.js",
    "content-scripts/pageContext.js",
    "content-scripts/chesscomAnon.js",
    "content-scripts/chesscomFakeTitle.js",
    "chunks/stream-l1H6Qjn3.js",
)

COUNT_PATTERNS = {
    "MutationObserver": r"\bMutationObserver\b",
    "WebSocket": r"\bnew WebSocket\b",
    "addEventListener": r"\.addEventListener\(",
    "chrome.runtime.sendMessage": r"\bruntime\.sendMessage\(",
    "chrome.storage.local": r"\bstorage\.local\.",
    "fetch": r"(?<![\w.])fetch\(",
    "postMessage": r"\.postMessage\(",
    "setInterval": r"\bsetInterval\(",
    "setTimeout": r"\bsetTimeout\(",
    "WebAssembly.instantiate": r"WebAssembly\.instantiate(?:Streaming)?\(",
    "debugger.attach": r"\.debugger\.attach\(",
}

ENDPOINT_RE = re.compile(r"""["'](https?://[^"'\\\s]{4,120})["']""")
WS_RE = re.compile(r"""["'](wss?://[^"'\\\s]{4,120})["']""")
PATH_RE = re.compile(r"""["'](/[a-z][a-z0-9/-]{2,60})["']""")


def read(root: str, rel: str) -> str:
    path = os.path.join(root, rel)
    if not os.path.isfile(path):
        return ""
    with open(path, encoding="utf-8", errors="replace") as fh:
        return fh.read()


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__, file=sys.stderr)
        return 2
    root = argv[1]
    manifest = json.load(open(os.path.join(root, "manifest.json"), encoding="utf-8"))

    corpus = "\n".join(read(root, f) for f in JS_FILES)
    html = read(root, "stream.html")

    counts = {name: len(re.findall(pat, corpus)) for name, pat in COUNT_PATTERNS.items()}

    endpoints = sorted(set(ENDPOINT_RE.findall(corpus)))
    ws_endpoints = sorted(set(WS_RE.findall(corpus)))
    # Root-relative API paths, filtered to the ones that read as backend routes.
    paths = sorted(
        {p for p in PATH_RE.findall(corpus) if p.count("/") >= 1 and not p.startswith("/icons/")}
    )

    post_types = sorted(set(re.findall(r'type: "([a-z_]+)"', corpus)))
    store_keys = sorted(set(re.findall(r'"(chessr-[a-z-]+)"', corpus)))
    wasm = sorted(
        os.path.relpath(os.path.join(dirpath, name), root)
        for dirpath, _, names in os.walk(root)
        for name in names
        if name.endswith(".wasm")
    )
    engine_files = sorted(
        os.path.relpath(os.path.join(dirpath, name), root)
        for dirpath, _, names in os.walk(os.path.join(root, "engine"))
        for name in names
    ) if os.path.isdir(os.path.join(root, "engine")) else []

    signature = {
        "schema_version": 2,
        "extension_version": manifest.get("version"),
        "source_build": "chessr-original-restored",
        "manifest": {
            "name": manifest.get("name"),
            "version": manifest.get("version"),
            "manifest_version": manifest.get("manifest_version"),
            "permissions": sorted(manifest.get("permissions", [])),
            "host_permissions": sorted(manifest.get("host_permissions", [])),
            "content_scripts_count": len(manifest.get("content_scripts", [])),
            "has_background": bool(manifest.get("background")),
            "web_accessible_resources": manifest.get("web_accessible_resources", []),
            "manifest_keys": sorted(manifest.keys()),
        },
        "counts": counts,
        "surfaces": {
            "endpoints": endpoints,
            "websocket_endpoints": ws_endpoints,
            "relative_api_paths": paths,
            "message_types": post_types,
            "storage_keys": store_keys,
            "wasm_files": wasm,
            "stream_html_script_type": re.search(
                r'<script[^>]*type="([^"]+)"', html
            ).group(1) if "<script" in html else None,
            "chrome_apis": sorted(set(re.findall(r"chrome\.([a-z]+)\.", corpus))),
        },
        "engine_files": engine_files,
    }
    json.dump(signature, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
