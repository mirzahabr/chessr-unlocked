#!/usr/bin/env python3
"""Apply the 3.7.2 unlock edits to a copy of the restored baseline.

This is the generator behind `versions/3.7.2/patches/0000-unlocked.patch`. It edits
three files — `content-scripts/content.js`, `chunks/stream-l1H6Qjn3.js` and
`manifest.json` — and nothing else; every other file in the build is byte-identical to
the baseline.

Why a script and not a hand-written patch: the two bundles are ~2.7 MB of
Prettier-formatted code with hashed identifiers. Hand-maintaining a multi-megabyte
diff is how a patch series rots. The script asserts that every anchor matches
exactly once, fails loudly if the baseline moved, and produces the same output on
every run, so `scripts/make-patches.sh` can turn its result into a reviewable diff.

Usage:
    scripts/unlock-3.7.2.py <baseline-dir> <output-dir>
    scripts/unlock-3.7.2.py --check <build-dir>      # is this tree unlocked?

Edits applied (both bundles unless noted):
  1. auth store    initial state is a permanent premium session (no sign-in)
  2. initialize    no-op; never contacts Supabase, never clears the session
  3. fetchPlan     no-op; the premium plan cannot be overwritten
  4. signOut       no-op; the panel cannot drop back to the login screen
  5. isPremium()   always true
  6. isFree()      always false
  7. engine gate   every engine is selectable (both bundles)
  8. link gate     the "link your account" screen is never requested
  9. local engines a 3.4.0 UCI engine fallback (Komodo/Dragon, Stockfish) is
                   spliced in and preferred over the server when its assets are
                   installed — a documented, non-upstream forced measure
"""

from __future__ import annotations

import os
import re
import shutil
import sys

BUNDLES = ("content-scripts/content.js", "chunks/stream-l1H6Qjn3.js")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCAL_ENGINES = os.path.join(ROOT, "versions", "3.7.2", "vendor", "local-engines.js")

SERVER_ENGINE_CLASS = "  var _0x3f7f66 = class {"

FACTORY_OLD = """  async function _0xa804b4(_0x404a4b) {
    let _0x507fbb = new _0x3f7f66(_0x404a4b);
    await _0x507fbb.init();
    _0x2c7423({
      slot: "suggestion",
      engineId: _0x404a4b,
      mode: "server",
      success: true,
    });
    return _0x507fbb;
  }"""

FACTORY_NEW = """  async function _0xa804b4(_0x404a4b) {
    // Local-engine fallback first: if the 3.4.0 engine assets are installed, the
    // suggestion engine runs in this browser instead of on Chessr's server.
    let _0x1f0d5c = _0x4c1d1e[_0x404a4b];
    if (_0x1f0d5c) {
      try {
        let _0x2d8f41 = new _0x1f0d5c();
        // A local engine that hangs must not hang the panel: give init 20 s and
        // fall through to the server path on timeout.
        await Promise.race([
          _0x2d8f41.init(),
          new Promise((_0x2f0b11, _0x4c9c7a) =>
            setTimeout(() => _0x4c9c7a(Error("local engine init timeout")), 20000),
          ),
        ]);
        _0x2c7423({
          slot: "suggestion",
          engineId: _0x404a4b,
          mode: "wasm",
          success: true,
          detail: "local 3.4.0 engine",
        });
        return _0x2d8f41;
      } catch (_0x3a7e42) {
        _0x2c7423({
          slot: "suggestion",
          engineId: _0x404a4b,
          mode: "wasm",
          success: false,
          detail: _0x3a7e42 instanceof Error ? _0x3a7e42.message : String(_0x3a7e42),
        });
      }
    }
    let _0x507fbb = new _0x3f7f66(_0x404a4b);
    await _0x507fbb.init();
    _0x2c7423({
      slot: "suggestion",
      engineId: _0x404a4b,
      mode: "server",
      success: true,
    });
    return _0x507fbb;
  }"""

ANON_STATE = """user: {
  id: "anon",
  email: "anonymous@chessr.local",
  email_confirmed_at: new Date(0).toISOString(),
  created_at: new Date(0).toISOString(),
},
session: {
  access_token: "anon-token",
  refresh_token: "anon-refresh",
  user: { id: "anon" },
},
plan: "premium",
planExpiry: null,
freetrialEndedAt: null,
guidelinesAcceptedAt: new Date(0),
freetrialUsed: false,
flags: [],
gatedRegions: [],
planLoading: false,
initializing: false,"""

STATE_RE = re.compile(
    r"^ *user: null,\n"
    r" *session: null,\n"
    r' *plan: "free",\n'
    r" *planExpiry: null,\n"
    r" *freetrialEndedAt: null,\n"
    r" *guidelinesAcceptedAt: null,\n"
    r" *freetrialUsed: false,\n"
    r" *flags: \[\],\n"
    r" *gatedRegions: \[\],\n"
    r" *planLoading: true,\n"
    r" *initializing: true,",
    re.M,
)


class EditError(RuntimeError):
    pass


def replace_block(text: str, header: str, comments: list[str]) -> str:
    """Replace the body of the function whose declaration starts with `header`.

    `comments` become the whole body, indented to the header's own block level.
    """
    start = text.find(header)
    if start < 0:
        raise EditError(f"header not found: {header!r}")
    if text.find(header, start + 1) >= 0:
        raise EditError(f"header is ambiguous: {header!r}")
    line_start = text.rfind("\n", 0, start) + 1
    indent = re.match(r"[ \t]*", text[line_start:]).group(0)
    open_brace = text.index("{", start + len(header))
    depth = 0
    i = open_brace
    while i < len(text):
        c = text[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                break
        i += 1
    if depth != 0:
        raise EditError(f"unbalanced braces after {header!r}")
    body = "\n" + "".join(f"{indent}  // {c}\n" for c in comments) + indent
    return text[: open_brace + 1] + body + text[i:]


def sub_once(pattern: str, repl, text: str, label: str) -> str:
    matches = list(re.finditer(pattern, text, re.M))
    if len(matches) != 1:
        raise EditError(f"{label}: expected 1 match, found {len(matches)}")
    m = matches[0]
    return text[: m.start()] + repl(m) + text[m.end() :]


def unlock_bundle(text: str, is_stream: bool) -> str:
    # 1. Permanent premium session, no account.
    def _state(m: re.Match) -> str:
        indent = re.match(r" *", m.group(0)).group(0)
        return "\n".join(indent + line for line in ANON_STATE.split("\n"))

    text = sub_once(STATE_RE.pattern, _state, text, "auth store initial state")

    # 2. initialize(): never talk to Supabase, never clear the session.
    text = replace_block(
        text,
        "  initialize: async () =>",
        ["Unlocked build: the session is permanent and never touches Supabase."],
    )

    # 3. fetchPlan(): the premium plan cannot be overwritten by a server lookup.
    text = replace_block(
        text,
        "  fetchPlan: async (",
        ["Unlocked build: the premium plan cannot be downgraded."],
    )

    # 4. signOut(): never drop to the login screen.
    text = replace_block(
        text,
        "  signOut: async () =>",
        ["Unlocked build: signing out is not a reachable state."],
    )

    # 5. isPremium(): every plan predicate resolves to premium.
    text = sub_once(
        r'^( *)return \w+\.has\(\w+ \?\? ""\);$',
        lambda m: f"{m.group(1)}return true;",
        text,
        "isPremium()",
    )

    # 6. isFree(): and nothing resolves to free.
    text = sub_once(
        r'^( *)return \w+ === "free" && !\w+ && !\w+;$',
        lambda m: f"{m.group(1)}return false;",
        text,
        "isFree()",
    )

    # 7. Engine gate: every engine is available.
    text = sub_once(
        r'^ *if \(\w+ === "komodo" \|\| \w+ === "stockfish"\) \{\n'
        r" *return true;\n"
        r" *\} else \{\n"
        r' *return \w+ === "lc0" && \w+ === "custom";\n'
        r" *\}$",
        lambda m: re.match(r" *", m.group(0)).group(0) + "return true;",
        text,
        "engine availability",
    )

    # 9. Local engine fallback: splice the transplanted 3.4.0 UCI engines in
    # front of the server engine and prefer them when they initialise.
    if not is_stream:
        with open(LOCAL_ENGINES, encoding="utf-8") as fh:
            local = fh.read()
        if text.count(SERVER_ENGINE_CLASS) != 1:
            raise EditError("ServerEngine class anchor not found exactly once")
        text = text.replace(SERVER_ENGINE_CLASS, local + "\n" + SERVER_ENGINE_CLASS)
        if text.count(FACTORY_OLD) != 1:
            raise EditError("suggestion engine factory not found exactly once")
        text = text.replace(FACTORY_OLD, FACTORY_NEW)

    # 8. Link-account gate: the panel never demands a linked account.
    def _needs_linking(m: re.Match) -> str:
        indent = m.group(1)
        return (
            f"{indent}setNeedsLinking: ({m.group(2)}, {m.group(3)} = null) => {{\n"
            f"{indent}  // Unlocked build: no account can be linked, so never ask for one.\n"
            f"{indent}}},"
        )

    text = sub_once(
        r"^( *)setNeedsLinking: \((\w+), (\w+) = null\) => \{\n"
        r" *\w+\(\{\n"
        r" *needsLinking: \w+,\n"
        r" *pendingProfile: \w+,\n"
        r" *\}\);\n"
        r" *\},$",
        _needs_linking,
        text,
        "setNeedsLinking()",
    )

    return text


def unlock_tree(src: str, dst: str) -> None:
    if not os.path.isdir(src):
        raise SystemExit(f"baseline not found: {src}")
    if os.path.exists(dst):
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    for rel in BUNDLES:
        path = os.path.join(dst, rel)
        with open(path, encoding="utf-8") as fh:
            text = fh.read()
        text = unlock_bundle(text, is_stream=rel.startswith("chunks/"))
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(text)
        print(f"unlocked {rel}")
    unlock_manifest(os.path.join(dst, "manifest.json"))
    print("unlocked manifest.json")


def unlock_manifest(path: str) -> None:
    """Identify the build as its own extension, so both can be installed at once."""
    import json

    with open(path, encoding="utf-8") as fh:
        manifest = json.load(fh)
    manifest["name"] = "Chessr.io Unlocked"
    manifest["short_name"] = "Chessr Unlocked"
    manifest["description"] = (
        "Chessr.io 3.7.2 — unofficial build: account system removed, premium UI unlocked. "
        "Analysis is server-side and still needs a real subscription."
    )
    manifest["version"] = "3.7.2.1"
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2, ensure_ascii=False)
        fh.write("\n")


def check(root: str) -> int:
    import json

    with open(os.path.join(root, "manifest.json"), encoding="utf-8") as fh:
        manifest = json.load(fh)
    if manifest.get("version") != "3.7.2.1" or manifest.get("name") != "Chessr.io Unlocked":
        print(f"NOT UNLOCKED manifest.json: {manifest.get('name')} {manifest.get('version')}")
        return 1
    print("unlocked     manifest.json")

    for rel in BUNDLES:
        with open(os.path.join(root, rel), encoding="utf-8") as fh:
            text = fh.read()
        problems = []
        if STATE_RE.search(text):
            problems.append("baseline auth state still present")
        if 'plan: "premium",' not in text:
            problems.append("premium plan not initialised")
        if not re.search(r"setNeedsLinking: \(\w+, \w+ = null\) => \{\n *//", text):
            problems.append("link gate not stubbed")
        if problems:
            print(f"NOT UNLOCKED {rel}: {', '.join(problems)}")
            return 1
        print(f"unlocked     {rel}")
    return 0


def main(argv: list[str]) -> int:
    if len(argv) == 3 and argv[1] == "--check":
        return check(argv[2])
    if len(argv) != 3:
        print(__doc__, file=sys.stderr)
        return 2
    try:
        unlock_tree(argv[1], argv[2])
    except EditError as exc:
        print(f"unlock failed: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
