<!-- Creator Demo Guide -->
<!-- Summary: Scene-by-scene shot list for producing a ConFigTree demo video, derived from the 43 illustrated steps in docs/images/. -->

This guide is a storyboard, not a walkthrough. It lists every shot you need to capture — derived one-for-one from the 43 screenshots in `docs/images/` — with a narration beat for each. Follow it top to bottom to produce a complete demo video of the ConFigTree workflow against a fresh REFramework project.

For the actual integration steps with deeper context, point viewers to [[Getting Started|Getting-Started]].

## Before you shoot

- Reset the test project to a pristine slate: `pwsh test/Reset-Projects.ps1 -Mode hard`.
- Open the chosen REFramework version (`test/projects/reframework-v24.10.0` or `v25.0.0`) in UiPath Studio.
- Have the target `Config.xlsx` ready (use one of the samples under `test/fixtures/` or a custom one).
- Check that your recording resolution matches the existing shots (`1920x1080` for Studio, `1920x1012` for browser, smaller crops for dialogs).

## Act 1 — Generate the artefacts (browser)

| Shot | File | Beat |
|---|---|---|
| 001 | `001_drop-zone-empty` | "Open configtree.cprima.net. One page, no install, no login." |
| 002 | `002_drop-zone-copy-tooltip` | "The drop zone accepts the same `Config.xlsx` you already have." |
| 003 | `003_drop-zone-copy-tooltip-2` | (optional second angle on the tooltip — use if 002 is unclear) |
| 004 | `004_xcsharp-tab-generated-snippet` | "Drop the file — the C# tab is already populated." |
| 005 | `005_cs-tab-browser-download-dialog-saved` | "Click Download. The file lands in your Downloads folder." |
| 006 | `006_xaml-tab-snippet-copied` | "Flip to the XAML tab and Copy. The clipboard now holds the loader snippet." |

## Act 1.5 — Context (optional, off-demo)

Use these only if the audience needs to see the project is real / open-source.

| Shot | File | Beat |
|---|---|---|
| 007 | `007_github-repo-file-tree` | "Everything lives on GitHub — code, fixtures, docs." |
| 008 | `008_github-issues-list` | "Issues and discussions are public." |
| 009 | `009_github-repo-readme` | "The README points you straight back to the page you just used." |

## Act 2 — Prepare Studio

| Shot | File | Beat |
|---|---|---|
| 010 | `010_begin-with-a-standard-REFramework` | "Start from a fresh REFramework project — nothing special." |
| 011 | `011_open-manage-packages` | "Open Manage Packages." |
| 012 | `012_search-coded-activities-package-from-official-feed` | "Search the official feed for `UiPath.CodedWorkflows`." |
| 013 | `013_install-coded-activities-package-from-official-feed` | "Install. Studio can now compile `.cs` files inside your project." |

## Act 3 — Install `CodedConfig.cs`

| Shot | File | Beat |
|---|---|---|
| 014 | `014_right-click-the-project-panel` | "Right-click the Project panel." |
| 015 | `015_create-config-folder` *(pending re-shoot)* | "Create a `Config` folder for your typed config." |
| 016 | `016_add-code-source-file` | "Right-click the folder → Add → Code Source File." |
| 017 | `017_name-code-source-file-CodedConfig-dot-cs` *(pending re-shoot)* | "Name it `CodedConfig.cs` — same as the filename in the ConFigTree sidebar." |
| 018 | `018_paste-from-configtree-dot-cprima-dot-net` | "Paste the downloaded C# class into the file. Save." |

## Act 4 — Import the namespace

| Shot | File | Beat |
|---|---|---|
| 019 | `019_open-InitAllSettings` | "Open `Framework/InitAllSettings.xaml`." |
| 020 | `020_open-namespace-panel` | "Open the Imports panel." |
| 021 | `021_add-namespace-from-cs-file` | "Type the namespace from the generated class — `Cpmf.Config` by default." |
| 022 | `022_namespace-is-added` | "Studio resolves the assembly reference automatically." |

## Act 5 — Load the config (paste the XAML snippet)

| Shot | File | Beat |
|---|---|---|
| 023 | `023_paste-xaml-snippet-at-end-of-workflow-from-configtree-dot-cprima-dot-net` | "Scroll to the bottom of InitAllSettings. Ctrl+V. The loader appears." |
| 024 | `024_open-variables-panel` | "Open the Variables panel — note the new `out_ConFigTree` variable." |
| 025 | `025_convert-variable-to-argument` | "Right-click it → Convert to Argument. Studio makes it an argument, but (as of today) gets two things wrong…" |
| 026 | `026_open-arguments-panel` | "Open the Arguments panel." |
| 027 | `027_click-datatype-of-argument-to-change` | "Click the Type column." |
| 028 | `028_search-datatype-CodedConfig` | "Search `CodedConfig`. Pick it from `Cpmf.Config`." |
| 029 | `029_check-argument-has-datatype-CodedConfig` | "Type is now `CodedConfig`. One down." |
| 030 | `030_click-direction-of-argument-to-change` | "Direction — Studio defaulted to `In`." |
| 031 | `031_check-argument-direction-is-out` | "Flip it to `Out`. Two down." |
| 032 | `032_save-InitAllSettings` | "Save. InitAllSettings is done." |

## Act 6 — Thread through `Main.xaml`

| Shot | File | Beat |
|---|---|---|
| 033 | `033_use-project-panel-find-refeences-of-file-InitAllSettings` | "Right-click InitAllSettings → Find References. Studio lists everywhere it's invoked." |
| 034 | `034_identify-InitAllSettings-references-standard-REFramework-in-Main-dot-xaml` | "Main.xaml first — expected for REFramework." |
| 035 | `035_import-updated-arguments-InvokeWorkflow-InitAllSettings` | "On the InvokeWorkflowFile, click Import Arguments to pick up the new one." |
| 036 | `036_create-main-xaml-variable-ConFigTree-type-CodedConfig` | "Add a `ConFigTree` variable, type `CodedConfig`. Map it to the out argument." |
| 037 | `037_verify-namespace-from-cs-file-is-imported` | "Confirm the namespace is listed in Main's Imports panel." |

## Act 7 — Thread through `Process.xaml`

| Shot | File | Beat |
|---|---|---|
| 038 | `038_open-Process-dot-xaml` | "Open Process.xaml — the file where the actual work happens." |
| 039 | `039_create-in-argument-inConfigTree-type-CodedConfig` | "Add an `in_ConFigTree` argument, direction `In`, type `CodedConfig`." |
| 040 | `040_identify-Process-dot-xaml-references-standard-REFramework-Main-dot-xaml` | "Back to Main. Find Process's InvokeWorkflowFile." |
| 041 | `041_add-InvokeWorkflow-argument-ConFigTree` | "Import Arguments → map the `ConFigTree` variable into `in_ConFigTree`." |
| 042 | `042_Process-dot-xaml-now-has-access-to-coded-config` | "Process.xaml now has the typed config. Autocomplete works. Types are enforced." |

## Act 8 — The punchline

| Shot | File | Beat |
|---|---|---|
| 043 | `043_replace-existing-use-of-Config-dictionary-or-work-in-parallel` | "Replace `in_Config("MaxRetries").ToString` with `in_ConFigTree.Settings.MaxRetries`. Typo-proof, refactor-safe, production-ready." |

## Suggested runtime

Pacing keeps the total viewable in 5–8 minutes:

- Act 1 (browser): 30-45 s
- Act 1.5 (GitHub context): skip or 15 s
- Act 2 (Studio prep): 30 s
- Act 3 (install .cs): 45 s
- Act 4 (namespace): 20 s
- Act 5 (load config + argument dance): 90 s — the richest act; don't rush the Convert-to-Argument bug
- Act 6 (Main): 45 s
- Act 7 (Process): 45 s
- Act 8 (punchline): 30 s with a typed-vs-dictionary side-by-side

## What to emphasize

1. **The `Convert to Argument` fix** (shots 027–031) — this is where Studio's built-in behaviour is wrong and the viewer sees ConFigTree's guidance pay off.
2. **Compile-time typo protection** (shot 042) — zoom on autocomplete; prove types are enforced.
3. **No build step on the dev machine** (shot 001) — browser generated the class, nothing installed locally.

## Assets to have ready

- A terminal recording of `just fixtures` or similar — optional, for a "behind the scenes" cut.
- The `Config.xlsx` you'll drop.
- A reset project (`pwsh test/Reset-Projects.ps1 -Mode hard`).
- Clipboard cleared between acts so paste isn't confusing.
