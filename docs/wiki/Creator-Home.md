<!-- Creator Home -->
<!-- Summary: Landing page for content creators making educational material about ConFigTree and typed UiPath configuration. -->

This page is for content creators who want to make educational material about ConFigTree. The aim is to give you enough context and ready-made assets that you can record or write without first reverse-engineering the project.

## What ConFigTree does, in one paragraph

ConFigTree reads a `Config.xlsx` and generates a C# class plus a short XAML loader snippet. You drop the class into a UiPath REFramework project, paste the snippet into `InitAllSettings.xaml`, and the result is a typed `ConFigTree` object that sits alongside the existing `Config` dictionary. The dictionary keeps working; the typed class adds compile-time names, types, and IntelliSense. That coexistence is deliberate — migration can be incremental.

The webpage at configtree.cprima.net does the heavy lifting: Your viewers do not write a single line of (so-called) pro-code. They drag the ubiquitous Config.xlsx onto the page, and get two artifacts to copy&paste.

## Why this may be worth covering

Most UiPath content is tied to product announcements and ages with each release. A refactor like this — dictionary to typed class, inside Studio, with the old API still available — is rare in the public material, and stays relevant across Studio versions because it uses stable C# rather than new features.

This could be the ideal starter for a series of pro-code content; CodedConfig wants to break the ice of long-overdue adoption newer practices.

A note on naming: **CodedConfig** is a play on Studio's recent "Coded Source Files." Technically it is a plain .NET class with strong typing and a loader method. **ConFigTree** is both the generator and the hierarchical shape it produces. A fig-tree mascot is planned, on the grounds that `con-fig-tree` contains an actual fig tree.

## Teaching angles

Any of these is enough for a standalone piece. Pick the lens that fits your channel.

- Type safety vs `Dictionary(Of String, Object)` — what typed access looks like in the Studio, and what it catches.
- Compile-time error detection — a typo like `ConFigTree.Settings.FooBar` shows up in the Error List (BC30456), not at runtime.
- IntelliSense on a config tree — short to demo, hard to forget.
- Generator pattern — `Config.xlsx` is the source of truth, `.cs` is derived. Regenerate when the shape changes.
- Dual-mode migration — move a few properties at a time, ship, repeat. Rollback is trivial because the dictionary never went away.
- First Coded Workflow with a concrete purpose — the usual "hello world" is a demo; this one has a reason.
- Publish gate — Studio refuses to publish a project with validation errors, so a broken config typo becomes a failed build, not a failed run.

## Formats and sizes

| Format | Length | What to show |
|---|---|---|
| Short-form clip | 30–90 s | Drag-drop GIF + the BC30456 screenshot. |
| Walkthrough | 10–15 min | The getting-started loop end to end, with one `out_Config(...)` call replaced at the end. |
| Live-coding | 45–90 min | Migration section by section, including the dead ends. |
| Conference talk | 20–30 min | Problem, refactor, coexistence, Q&A. |
| Article + clips | 800–1500 words | GIF as hero, screenshots as evidence, zipped sample project linked. |

## Ready-made assets

### Downloads

| What | Download |
|---|---|
| **base** — unmodified REFramework v24.10.0 starting point. Upstream: [release/v24.10.0 template](https://github.com/UiPath-Services/StudioTemplates/tree/release/v24.10.0/REFramework/contentFiles/any/any/pt2/VisualBasic), Windows target, VisualBasic expressions. | [⬇ base.zip](https://github.com/rpapub/ConFigTree/raw/main/docs/downloads/reframework-min-v24.10.0-base.zip) |
| **gotten-started** — the same project after completing the walkthrough. Useful as a reference implementation. | [⬇ gotten-started.zip](https://github.com/rpapub/ConFigTree/raw/main/docs/downloads/reframework-min-v24.10.0-gotten-started.zip) |
| **sample-configs** — three curated `Config.xlsx` fixtures (Basic, Types, Reference) covering the datatype surface. | [⬇ sample-configs.zip](https://github.com/rpapub/ConFigTree/raw/main/docs/downloads/sample-configs.zip) |

> [!TIP]
> Download the base template and go through [[Illustrated Setup|Getting-Started-Illustrated]].

### Screenshots and diagrams

- [[Getting Started — Illustrated|Getting-Started-Illustrated]] — 51 captioned screenshots covering every step in Studio.
- Raw files: [`docs/images/getting-started/`](https://github.com/rpapub/ConFigTree/tree/main/docs/images/getting-started) and [`docs/images/features/`](https://github.com/rpapub/ConFigTree/tree/main/docs/images/features).
- [[Mermaid Diagrams|Mermaid-Diagrams]] — state, sequence, and journey diagrams. Lift into slides as-is or re-skin.

### Slides

Initial deck: [configtree.cprima.net/slides/getting-started](https://configtree.cprima.net/slides/getting-started/). Re-skin or rearrange as needed.

### Point viewers at

- Live tool: [configtree.cprima.net](https://configtree.cprima.net/)
- Starter projects and sample configs: [[Sample Files|Developer-Samples]]

## Reusing the material

The repo is under the [Apache 2.0 License](https://github.com/rpapub/ConFigTree/blob/main/LICENSE). In practice, that means:

- Code, fixtures, screenshots, diagrams, and the demo GIF can be embedded, adapted, and redistributed in your content.
- Upstream attribution stays with its files — the REFramework starter is MIT, credited in the sample project READMEs.
- ConFigTree is an independent open-source project, not affiliated with or endorsed by UiPath.

A short attribution line is enough:

> ConFigTree — [github.com/rpapub/ConFigTree](https://github.com/rpapub/ConFigTree) · [configtree.cprima.net](https://configtree.cprima.net/)

## Where to send viewer questions

> [!IMPORTANT]
> Send technical questions, bug reports, and feature requests to the [issue tracker](https://github.com/rpapub/ConFigTree/issues).
> Comment sections are not a good place to troubleshoot — answers get lost and the next viewer has to re-ask.

Common integration questions live in [[FAQ — Developers|FAQ-Developers]].

## Contact

If a demo is missing, a fixture would help, or you want a sanity check on an angle before recording, get in touch:

- [LinkedIn — cprima](https://www.linkedin.com/in/cprima/)
- Email: `cprior [at] gmail dot com`
