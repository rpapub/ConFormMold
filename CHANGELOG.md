# Changelog

## v0.1 — 2026-03-23

Initial release. Hardcoded happy path: upload a UiPath REFramework `Config.xlsx` and get valid C# output in the browser.

### Added

- Static web app — HTML, CSS, vanilla JavaScript, no build step
- File upload via drag-and-drop or file picker
- SheetJS 0.20.3 client-side Excel parsing
- Three hardcoded sheets: `Settings`, `Constants`, `Assets`
- Full C# type inference from SheetJS cell types:
  `string`, `int`, `double`, `bool`, `DateOnly`, `DateTime`, `TimeOnly`
- C# class generator:
  - One class per sheet, PascalCase property names
  - Root aggregator class `AppConfig`
  - `OrchestratorAsset` helper type for Assets sheet
  - `using System;` emitted when needed
  - XML doc comments from Description column
  - Namespace configurable via in-memory config object (default: `Cpmf.Config`)
- Syntax-highlighted output via highlight.js 11.9.0 (Solarized Light theme)
- Copy-to-clipboard button
- In-memory config object with defaults (ADR-004)
- Web Awesome UI components, Solarized Light color scheme, orange header bar
- GitHub Actions deployment to GitHub Pages
- Product brief, ADRs (001–004), and ROADMAP in `docs/`
- Test fixtures in `test/fixtures/` covering all supported types
