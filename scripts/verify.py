#!/usr/bin/env python3
"""Repository validation — the checklist from docs/repository-layout.md, executable.

Runs offline, needs only Python 3.8+ and (optionally) Node for JS syntax checks.
Exit code 0 means every hard check passed; warnings do not fail the build.

    python3 scripts/verify.py            # all checks
    python3 scripts/verify.py --verbose  # plus details for warnings
    python3 scripts/verify.py --only anchors,regions
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {"engine", "_metadata", "project-documentation", ".git", "node_modules"}

PASS, FAIL, WARN, SKIP = "PASS", "FAIL", "WARN", "SKIP"
results: list[tuple[str, str, str]] = []


def record(status: str, check: str, detail: str = "") -> None:
    results.append((status, check, detail))


def rel(path: str) -> str:
    return os.path.relpath(path, ROOT)


def tracked_files(pattern: str = "") -> list[str]:
    cmd = ["git", "-C", ROOT, "ls-files"]
    if pattern:
        cmd.append(pattern)
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, check=True).stdout
    except (OSError, subprocess.CalledProcessError):
        return []
    return [f for f in out.split("\n") if f]


def build_dirs() -> list[str]:
    versions = os.path.join(ROOT, "versions")
    if not os.path.isdir(versions):
        return []
    out = []
    for version in sorted(os.listdir(versions)):
        vdir = os.path.join(versions, version)
        if not os.path.isdir(vdir):
            continue
        out += [os.path.join(vdir, d) for d in sorted(os.listdir(vdir))
                if os.path.isdir(os.path.join(vdir, d)) and d.startswith("chessr-")]
    return out


def walk_files(base: str, exts: tuple[str, ...]) -> list[str]:
    out = []
    for root, dirs, files in os.walk(base):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        out += [os.path.join(root, f) for f in files if f.endswith(exts)]
    return out


# ── checks ──────────────────────────────────────────────────────────────────

def check_js_syntax() -> None:
    node = shutil.which("node")
    files = [f for b in build_dirs() for f in walk_files(b, (".js",))]
    if not node:
        record(SKIP, "js-syntax", "node not found; install Node to run this check")
        return
    bad = []
    for f in files:
        r = subprocess.run([node, "--check", f], capture_output=True, text=True)
        if r.returncode != 0:
            bad.append(f"{rel(f)}: {r.stderr.strip().splitlines()[-1] if r.stderr.strip() else 'parse error'}")
    if bad:
        record(FAIL, "js-syntax", "; ".join(bad[:5]))
    else:
        record(PASS, "js-syntax", f"{len(files)} files")


def check_json() -> None:
    files = [f for b in build_dirs() for f in walk_files(b, (".json",))]
    kb = os.path.join(ROOT, "knowledge-base")
    if os.path.isdir(kb):
        for root, _dirs, names in os.walk(kb):
            files += [os.path.join(root, n) for n in names if n.endswith(".json")]
    bad = []
    for f in files:
        try:
            json.load(open(f, encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as exc:
            bad.append(f"{rel(f)}: {exc}")
    if bad:
        record(FAIL, "json", "; ".join(bad[:5]))
    else:
        record(PASS, "json", f"{len(files)} files")


REGION_RE = r"<!-- BEGIN AUTO-GENERATED: {} -->(.*?)<!-- END AUTO-GENERATED: {} -->"


def check_regions() -> None:
    index = os.path.join(ROOT, "knowledge-base", ".regions.json")
    if not os.path.isfile(index):
        record(SKIP, "regions", "knowledge-base/.regions.json not found")
        return
    regions = json.load(open(index, encoding="utf-8")).get("regions", {})
    missing, drift = [], []
    for key, expected in regions.items():
        path, _, name = key.partition("#")
        fpath = os.path.join(ROOT, path)
        if not os.path.isfile(fpath):
            missing.append(f"{key} (file)")
            continue
        text = open(fpath, encoding="utf-8").read()
        match = re.search(REGION_RE.format(re.escape(name), re.escape(name)), text, re.S)
        if not match:
            missing.append(f"{key} (fence)")
            continue
        actual = hashlib.sha256(match.group(1).strip().encode()).hexdigest()
        if actual != expected:
            drift.append(f"{key} (expected {expected[:8]}, got {actual[:8]})")
    if missing or drift:
        record(FAIL, "regions", "; ".join(missing + drift)[:400])
    else:
        record(PASS, "regions", f"{len(regions)} regions match")


LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
FENCE_RE = re.compile(r"```.*?```", re.S)
CODE_SPAN_RE = re.compile(r"`[^`\n]+`")
HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$", re.M)


def slugify(heading: str) -> str:
    """Approximate GitHub's heading anchor: lowercase, drop punctuation, spaces to '-'."""
    text = heading.strip().lower()
    text = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE)
    return re.sub(r"\s", "-", text)


def anchors_in(path: str) -> set[str]:
    text = open(path, encoding="utf-8", errors="replace").read()
    return {slugify(m.group(2)) for m in HEADING_RE.finditer(strip_code(text))}


def strip_code(text: str) -> str:
    """Drop fenced blocks and inline spans so code samples are not parsed as links."""
    return CODE_SPAN_RE.sub("", FENCE_RE.sub("", text))


def check_links() -> None:
    broken, total = [], 0
    cache: dict[str, set[str]] = {}
    for f in tracked_files("*.md"):
        text = open(os.path.join(ROOT, f), encoding="utf-8", errors="replace").read()
        for target in LINK_RE.findall(strip_code(text)):
            target = target.strip()
            if target.startswith(("http://", "https://", "mailto:")):
                continue
            path, _, fragment = target.partition("#")
            total += 1
            resolved = (os.path.normpath(os.path.join(ROOT, os.path.dirname(f), path))
                        if path else os.path.join(ROOT, f))
            if not os.path.exists(resolved):
                broken.append(f"{f} -> {target}")
                continue
            if not fragment or not resolved.endswith(".md"):
                continue
            if resolved not in cache:
                cache[resolved] = anchors_in(resolved)
            if fragment not in cache[resolved]:
                broken.append(f"{f} -> {target} (no such heading)")
    if broken:
        record(FAIL, "links", "; ".join(broken[:5]))
    else:
        record(PASS, "links", f"{total} relative links")


def digest_tree(base: str) -> str:
    """Content hash of a directory tree: names + bytes, order-independent."""
    h = hashlib.sha256()
    for f in sorted(walk_files(base, ("",))):
        h.update(os.path.relpath(f, base).encode())
        h.update(hashlib.sha256(open(f, "rb").read()).digest())
    return h.hexdigest()


def check_engines() -> None:
    builds = build_dirs()
    versions = os.path.dirname(os.path.dirname(builds[0])) if builds else ""
    if not versions:
        record(SKIP, "engines", "no builds found")
        return
    problems, checked = [], 0
    for version in sorted(os.listdir(versions)):
        vdir = os.path.join(versions, version)
        if not os.path.isdir(vdir):
            continue
        base = os.path.join(vdir, "chessr-original-restored", "engine")
        unlocked = os.path.join(vdir, "chessr-unlocked-all-features", "engine")
        if not (os.path.isdir(base) and os.path.isdir(unlocked)):
            continue  # patch-layer version: engine/ exists once, guarded by check_patches
        checked += 1
        if digest_tree(base) != digest_tree(unlocked):
            problems.append(version)
    if problems:
        record(FAIL, "engines", f"engine/ differs between builds: {', '.join(problems)}")
    elif checked:
        record(PASS, "engines", f"{checked} version(s), byte-identical")
    else:
        record(SKIP, "engines",
               "patch-layer layout: engine/ exists once per version; check_patches guards it")


def check_anchors() -> None:
    manifest_path = os.path.join(ROOT, "knowledge-base", "unlock-manifest.json")
    if not os.path.isfile(manifest_path):
        record(SKIP, "anchors", "knowledge-base/unlock-manifest.json not found")
        return
    manifest = json.load(open(manifest_path, encoding="utf-8"))
    basis = manifest.get("version_basis")
    base = os.path.join(ROOT, "versions", basis or "", "chessr-original-restored")
    if not basis or not os.path.isdir(base):
        record(SKIP, "anchors", f"baseline for {basis!r} not found")
        return

    corpus = []
    for f in walk_files(base, (".js", ".html", ".json", ".css")):
        try:
            corpus.append(open(f, encoding="utf-8", errors="replace").read())
        except OSError:
            pass
    blob = "\n".join(corpus)

    missing, ambiguous, checked = [], [], 0  # 'missing' also collects count mismatches
    for unlock in manifest.get("unlocks", []):
        locate = unlock.get("locate", {})
        for anchor in locate.get("anchors", []):
            checked += 1
            count = blob.count(anchor)
            if count == 0:
                missing.append(f"{unlock['id']}: {anchor!r}")
                continue
            expected = locate.get("expected_count")
            if expected is not None:
                if count != expected:
                    missing.append(
                        f"{unlock['id']}: {anchor!r} expected {expected}, found {count}")
                continue
            if count > 3:
                ambiguous.append(f"{unlock['id']}: {anchor!r} x{count}")
    if missing:
        record(FAIL, "anchors", "; ".join(missing))
    elif ambiguous:
        record(WARN, "anchors", f"{checked} checked, ambiguous: " + "; ".join(ambiguous[:4]))
    else:
        record(PASS, "anchors", f"{checked} anchors resolve in {basis} baseline")


MAX_BYTES = 90 * 1024 * 1024


def check_sizes() -> None:
    out = subprocess.run(["git", "-C", ROOT, "ls-tree", "-r", "-l", "-z", "HEAD"],
                         capture_output=True, text=True)
    if out.returncode != 0:
        record(SKIP, "size-guard", "git ls-tree failed")
        return
    big = []
    for entry in out.stdout.split("\0"):
        if not entry.strip():
            continue
        meta, _, path = entry.partition("\t")
        parts = meta.split()
        if len(parts) < 4 or not parts[3].isdigit():
            continue
        size = int(parts[3])
        if size > MAX_BYTES:
            big.append(f"{path} ({size / 1024 / 1024:.1f} MiB)")
    if big:
        record(FAIL, "size-guard", "; ".join(big))
    else:
        record(PASS, "size-guard", "no tracked file above 90 MiB")


ABS_PATH_RE = re.compile(r'(?<![\w.])/(?:Users|home)/[A-Za-z0-9._-]+/|C:\\\\Users\\\\')


def check_absolute_paths() -> None:
    hits = []
    for f in tracked_files():
        if f.startswith("docs/") or not f.endswith((".md", ".json", ".py", ".sh", ".yml", ".yaml")):
            continue
        try:
            text = open(os.path.join(ROOT, f), encoding="utf-8", errors="replace").read()
        except OSError:
            continue
        if ABS_PATH_RE.search(text):
            hits.append(f)
    if hits:
        record(FAIL, "absolute-paths", ", ".join(hits[:5]))
    else:
        record(PASS, "absolute-paths", "no machine-specific paths")


def check_patches() -> None:
    """If a version stores its unlocked build as a patch series, prove it round-trips."""
    versions = os.path.join(ROOT, "versions")
    if not os.path.isdir(versions):
        record(SKIP, "patches", "no versions/ directory")
        return
    wanted = [v for v in sorted(os.listdir(versions))
              if os.path.isdir(os.path.join(versions, v, "patches"))]
    if not wanted:
        record(SKIP, "patches", "no patch layer in use")
        return
    patch_bin = shutil.which("patch")
    if not patch_bin:
        record(SKIP, "patches", "'patch' not installed")
        return
    problems, done = [], 0
    for version in wanted:
        vdir = os.path.join(versions, version)
        base = os.path.join(vdir, "chessr-original-restored")
        built = os.path.join(vdir, "chessr-unlocked-all-features")
        if not os.path.isdir(base):
            problems.append(f"{version}: missing baseline {rel(base)}")
            continue
        tmp = tempfile.mkdtemp()
        try:
            target = os.path.join(tmp, "out")
            shutil.copytree(base, target)
            ok = True
            for patch_file in sorted(glob.glob(os.path.join(vdir, "patches", "*.patch"))):
                # Only diff headers matter: engine/ paths legitimately appear in the
                # *content* of manifest.json and content.js.
                touched = []
                with open(patch_file, encoding="utf-8", errors="replace") as fh:
                    for line in fh:
                        if line.startswith(("--- ", "+++ ")) and "/engine/" in line:
                            touched.append(line.strip())
                if touched:
                    problems.append(f"{version}: {os.path.basename(patch_file)} touches engine/ "
                                    f"({touched[0]})")
                    ok = False
                    break
                r = subprocess.run([patch_bin, "-p1", "--batch", "-s", "-d", target],
                                   stdin=open(patch_file, "rb"),
                                   capture_output=True, text=True)
                if r.returncode != 0:
                    problems.append(f"{version}: {os.path.basename(patch_file)} does not apply")
                    ok = False
                    break
            if ok and os.path.isdir(built) and digest_tree(target) != digest_tree(built):
                problems.append(f"{version}: patched tree differs from the committed build")
            if ok:
                meta_path = os.path.join(vdir, "build.json")
                if not os.path.isfile(meta_path):
                    problems.append(f"{version}: patches/ exists without build.json")
                else:
                    meta = json.load(open(meta_path, encoding="utf-8"))
                    rebuilt = os.path.join(target, "manifest.json")
                    if not os.path.isfile(rebuilt):
                        problems.append(f"{version}: rebuilt tree has no manifest.json")
                    else:
                        manifest = json.load(open(rebuilt, encoding="utf-8"))
                        for key in ("name", "version"):
                            if str(manifest.get(key)) != str(meta.get(key)):
                                problems.append(
                                    f"{version}: build.json {key}={meta.get(key)!r} but the "
                                    f"patched manifest says {manifest.get(key)!r}")
            done += 1
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    if problems:
        record(FAIL, "patches", "; ".join(problems))
    else:
        record(PASS, "patches", f"{done} version(s) round-trip")


SCHEMA_COMPONENTS = {
    "unlock-manifest": "knowledge-base/unlock-manifest.json",
    "re-config": "knowledge-base/re-config.json",
    "region-store": "knowledge-base/.regions.json",
}


def check_schema_versions() -> None:
    """knowledge-base/README.md promises schema_version bumps stay in sync with repo-meta."""
    meta_path = os.path.join(ROOT, "knowledge-base", "repo-meta.json")
    if not os.path.isfile(meta_path):
        record(SKIP, "schemas", "knowledge-base/repo-meta.json not found")
        return
    meta = json.load(open(meta_path, encoding="utf-8"))
    declared = meta.get("components", {})
    problems, checked = [], 0
    for component, rel_path in SCHEMA_COMPONENTS.items():
        fpath = os.path.join(ROOT, rel_path)
        if not os.path.isfile(fpath):
            continue
        actual = json.load(open(fpath, encoding="utf-8")).get("schema_version")
        expected = declared.get(component)
        checked += 1
        if expected != actual:
            problems.append(f"{rel_path}: schema_version {actual}, repo-meta says {expected}")
    for sig in sorted(glob.glob(os.path.join(ROOT, "knowledge-base", "signatures", "*.json"))):
        actual = json.load(open(sig, encoding="utf-8")).get("schema_version")
        expected = declared.get("structural-signature")
        checked += 1
        if expected != actual:
            problems.append(f"{rel(os.path)}: schema_version {actual}, repo-meta says {expected}")
    if problems:
        record(FAIL, "schemas", "; ".join(problems[:5]))
    else:
        record(PASS, "schemas", f"{checked} documents agree with repo-meta.json")


def check_signatures() -> None:
    """A structural signature must still describe the baseline it claims to describe."""
    sigs = sorted(glob.glob(os.path.join(ROOT, "knowledge-base", "signatures", "*.json")))
    if not sigs:
        record(SKIP, "signatures", "no signatures/")
        return
    problems, checked = [], 0
    for sig_path in sigs:
        sig = json.load(open(sig_path, encoding="utf-8"))
        version = sig.get("extension_version")
        source = sig.get("source_build")
        if not version or not source:
            problems.append(f"{rel(sig_path)}: missing extension_version/source_build")
            continue
        manifest_path = os.path.join(ROOT, "versions", version, source, "manifest.json")
        if not os.path.isfile(manifest_path):
            problems.append(f"{rel(sig_path)}: no {version}/{source}/manifest.json")
            continue
        manifest = json.load(open(manifest_path, encoding="utf-8"))
        checked += 1
        if sig.get("manifest", {}).get("name") != manifest.get("name"):
            problems.append(f"{rel(sig_path)}: name does not match {source}")
        if str(manifest.get("version")) != str(version):
            problems.append(f"{rel(sig_path)}: version {manifest.get('version')} != {version}")
    if problems:
        record(FAIL, "signatures", "; ".join(problems[:5]))
    else:
        record(PASS, "signatures", f"{checked} signature(s) match their baseline")


def check_versions() -> None:
    """Version numbers must line up across the folder name, both manifests and the changelog."""
    versions = os.path.join(ROOT, "versions")
    if not os.path.isdir(versions):
        record(SKIP, "versions", "no versions/ directory")
        return
    problems, newest = [], None
    for version in sorted(os.listdir(versions)):
        vdir = os.path.join(versions, version)
        if not os.path.isdir(vdir):
            continue
        base = os.path.join(vdir, "chessr-original-restored", "manifest.json")
        unlocked = os.path.join(vdir, "chessr-unlocked-all-features", "manifest.json")
        if os.path.isfile(base):
            manifest = json.load(open(base, encoding="utf-8"))
            if str(manifest.get("version")) != version:
                problems.append(f"{version}: baseline manifest says {manifest.get('version')}")
            if manifest.get("manifest_version") != 3:
                problems.append(f"{version}: baseline is not Manifest V3")
        if not os.path.isfile(unlocked):
            meta_path = os.path.join(vdir, "build.json")
            if os.path.isfile(meta_path):
                meta = json.load(open(meta_path, encoding="utf-8"))
                if not str(meta.get("version", "")).startswith(f"{version}."):
                    problems.append(f"{version}: build.json version {meta.get('version')} "
                                    f"should be {version}.N")
                if meta.get("based_on") != version:
                    problems.append(f"{version}: build.json based_on={meta.get('based_on')!r}")
                newest = version
            continue
        if os.path.isfile(unlocked):
            manifest = json.load(open(unlocked, encoding="utf-8"))
            if not str(manifest.get("version", "")).startswith(f"{version}."):
                problems.append(f"{version}: unlocked build should be {version}.N, "
                                f"is {manifest.get('version')}")
            if manifest.get("manifest_version") != 3:
                problems.append(f"{version}: unlocked build is not Manifest V3")
            if manifest.get("name") == json.load(open(base, encoding="utf-8")).get("name"):
                problems.append(f"{version}: both builds share the name {manifest.get('name')!r}")
            newest = version

    changelog = os.path.join(ROOT, "CHANGELOG.md")
    if newest and os.path.isfile(changelog):
        text = open(changelog, encoding="utf-8").read()
        match = re.search(r"^## \[([^\]]+)\]", text, re.M)
        manifest_path = os.path.join(versions, newest,
                                     "chessr-unlocked-all-features", "manifest.json")
        build_json = os.path.join(versions, newest, "build.json")
        if os.path.isfile(manifest_path):
            expected = json.load(open(manifest_path, encoding="utf-8")).get("version")
        elif os.path.isfile(build_json):
            expected = json.load(open(build_json, encoding="utf-8")).get("version")
        else:
            expected = None
        if not match:
            problems.append("CHANGELOG.md has no '## [version]' entry")
        elif match.group(1) != expected:
            problems.append(f"CHANGELOG.md top entry {match.group(1)} != current build {expected}")
    if problems:
        record(FAIL, "versions", "; ".join(problems[:5]))
    else:
        record(PASS, "versions", f"{newest} is current; names, versions and changelog agree")


CHECKS = {
    "js-syntax": check_js_syntax,
    "json": check_json,
    "regions": check_regions,
    "links": check_links,
    "engines": check_engines,
    "anchors": check_anchors,
    "size-guard": check_sizes,
    "absolute-paths": check_absolute_paths,
    "patches": check_patches,
    "schemas": check_schema_versions,
    "signatures": check_signatures,
    "versions": check_versions,
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", help="comma-separated subset, e.g. anchors,regions")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    selected = list(CHECKS)
    if args.only:
        wanted = [c.strip() for c in args.only.split(",") if c.strip()]
        unknown = [c for c in wanted if c not in CHECKS]
        if unknown:
            print(f"unknown check(s): {', '.join(unknown)}", file=sys.stderr)
            return 2
        selected = wanted

    for name in selected:
        CHECKS[name]()

    width = max(len(c) for _s, c, _d in results)
    for status, check, detail in results:
        print(f"{status:4}  {check:<{width}}  {detail}")
        if args.verbose and status != PASS and detail:
            print(f"      {' ' * width}  {detail}")

    failed = [r for r in results if r[0] == FAIL]
    warned = [r for r in results if r[0] == WARN]
    print(f"\n{len(results) - len(failed) - len(warned)} passed, "
          f"{len(warned)} warning(s), {len(failed)} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
