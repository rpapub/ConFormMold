# Roadmap

## v0.1 — Hardcoded happy path

Goal: prove the pipeline works end-to-end with zero configuration.

- [ ] Single HTML page with file upload and output panel
- [ ] SheetJS parses the workbook client-side
- [ ] Three hardcoded sheet names: `Settings`, `Constants`, `CPMForge.M365`
- [ ] Type inference — string / int / double / bool from cell values
- [ ] Class generator — one C# class per sheet + root aggregator `AppConfig`
- [ ] Copy-to-clipboard on output

No options, no flexibility. Just upload and get C#.

---

## Feedback checkpoint

Share v0.1 and collect feedback before expanding scope.

---

## v0.2 — Output options

Goal: more useful output formats.

- [ ] `.ToString()` override on generated classes
- [ ] `.ToJson()` / JSON serialization helper
- [ ] PII annotation support (e.g. flag properties containing sensitive data)
- [ ] Download as `.cs` file
- [ ] Minimal styling

---

## v0.3 — Dynamic sheet handling

Goal: works with any workbook, not just the REFramework template.

- [ ] Read all actual sheet names from the uploaded file
- [ ] Sheet selection UI — checkboxes to include/exclude
- [ ] Root class name override
- [ ] Basic error handling — wrong file type, missing header, empty sheet
