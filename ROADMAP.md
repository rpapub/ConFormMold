# Roadmap

## v0.1 — Working proof of concept

Goal: upload a real `Config.xlsx` and get valid C# output in the browser.

- [ ] Single HTML page with file upload and output panel
- [ ] SheetJS integration — parse workbook, list sheets
- [ ] Sheet mapper — detect schema (standard vs. asset), skip empty rows
- [ ] Type inference — string / int / double / bool from cell values
- [ ] Class generator — emit one C# class per sheet + root aggregator
- [ ] Copy-to-clipboard button on output

No styling polish. No edge case handling. Just the happy path working end-to-end.

---

## Feedback checkpoint

After v0.1 is usable, share it and collect feedback on:

- Are the generated class/property names what people expect?
- Is the type inference accurate enough, or do manual overrides matter?
- Which sheets do people actually want to include/exclude?
- Is the Assets sheet schema handled correctly?

---

## v0.2 — Usable by others

Goal: good enough to hand to a colleague without explanation.

- [ ] Sheet selection UI — checkboxes to include/exclude sheets
- [ ] Root class name override
- [ ] Download as `.cs` file
- [ ] Basic error handling — wrong file type, missing header row, empty sheet
- [ ] Minimal styling — readable layout, mobile-tolerant
- [ ] XML doc comments from Description column (opt-in toggle)
