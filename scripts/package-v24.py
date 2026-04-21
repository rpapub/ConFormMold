#!/usr/bin/env python3
"""Build two downloads for the v24 REFramework demo:

  docs/downloads/reframework-min-v24.10.0-base.zip
      Source: test/templates/reframework-v24.10.0/
      Content: everything under that folder (pristine template).

  docs/downloads/reframework-min-v24.10.0-gotten-started.zip
      Source: test/projects/reframework-v24.10.0/
      Content: git-tracked files only, PLUS Config/CodedConfig.cs
               (which is gitignored but ships in this zip on purpose —
               it's the generated output a user has after completing
               the getting-started walkthrough).

Both zips wrap their contents in a single top-level directory matching
the zip stem, so `unzip` lands the project in one folder.
"""

import pathlib
import subprocess
import zipfile

REPO      = pathlib.Path(__file__).resolve().parent.parent
DOWNLOADS = REPO / "docs/downloads"

VERSION = "v24.10.0"
TEMPLATE_SRC = REPO / f"test/templates/reframework-{VERSION}"
PROJECT_SRC  = REPO / f"test/projects/reframework-{VERSION}"
EXTRA_FILES  = [pathlib.Path("Config/CodedConfig.cs")]  # un-gitignored additions


def write_zip(dst: pathlib.Path, src: pathlib.Path, files_rel):
    """Write files listed by relative path under src into dst, wrapped in a
    top-level directory whose name matches the zip stem."""
    wrapper = dst.stem  # e.g. "reframework-min-v24.10.0-base"
    with zipfile.ZipFile(dst, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for rel in sorted(files_rel):
            abs_path = src / rel
            if not abs_path.is_file():
                print(f"  skip (missing): {rel}")
                continue
            zf.write(abs_path, f"{wrapper}/{rel}")
    size_kb = dst.stat().st_size // 1024
    print(f"wrote {dst.relative_to(REPO)}  ({size_kb} KB)")


def tracked_files_in(src: pathlib.Path):
    """Ask git for every tracked file under src. Returns relative POSIX paths."""
    rel_src = src.relative_to(REPO).as_posix()
    out = subprocess.run(
        ["git", "-C", str(REPO), "ls-files", rel_src],
        capture_output=True, text=True, check=True
    )
    prefix = rel_src + "/"
    return [line[len(prefix):] for line in out.stdout.splitlines() if line.startswith(prefix)]


def main():
    DOWNLOADS.mkdir(exist_ok=True)

    # --- Base zip: the pristine template ---
    base_files = tracked_files_in(TEMPLATE_SRC)
    base_dst   = DOWNLOADS / f"reframework-min-{VERSION}-base.zip"
    write_zip(base_dst, TEMPLATE_SRC, base_files)

    # --- Gotten-started zip: tracked project files + un-gitignored Config/ ---
    gs_files = tracked_files_in(PROJECT_SRC)
    for extra in EXTRA_FILES:
        rel = extra.as_posix()
        if (PROJECT_SRC / rel).is_file() and rel not in gs_files:
            gs_files.append(rel)
        elif not (PROJECT_SRC / rel).is_file():
            print(f"  warning: {rel} not found under {PROJECT_SRC.relative_to(REPO)}")
    gs_dst = DOWNLOADS / f"reframework-min-{VERSION}-gotten-started.zip"
    write_zip(gs_dst, PROJECT_SRC, gs_files)


if __name__ == "__main__":
    main()
