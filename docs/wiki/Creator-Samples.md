<!-- Creator Samples -->
<!-- Summary: Example content and sample comparisons used to help creators tell the story of ConFigTree and typed config. -->

<!--
DRAFT

## The two files — the story they tell together

**Config_REFramework_Default.xlsx** is the file every RPA developer already has.
Three sheets: Settings, Constants, Assets (empty). Values accessed via
`out_Config("OrchestratorQueueName").ToString` — no types, no structure.

**Config_Reference.xlsx** is the ConFigTree version — same REFramework sheets
plus more, with explicit types, asset sheets with ValueType, and underscore-prefixed
hidden sheets. Values accessed as `out_ConFigTree.Settings.OrchestratorQueueName`
— typed, discoverable, verified by Verify Project.

This contrast is the demo. Open both in Excel side by side before touching Studio.

---

## Config_REFramework_Default.xlsx

[Download](https://github.com/rpapub/ConFigTree/raw/main/samples/Config_REFramework_Default.xlsx)

Source: https://github.com/UiPath-Services/StudioTemplates

| Sheet | Rows | What to show |
|-------|------|--------------|
| Settings | 3 | The minimum — queue name, folder, log label |
| Constants | 11 | The boilerplate every developer edits by hand |
| Assets | 0 | Header only — the empty promise |

Key demo moment: show `out_Config("MaxRetryNumber")` — it returns Object,
needs CInt() to be usable. Typo the key name. Nothing fails at design time.

---

## Config_Reference.xlsx

[Download](https://github.com/rpapub/ConFigTree/raw/main/samples/Config_Reference.xlsx)

| Sheet | Type | Rows | What to show |
|-------|------|------|--------------|
| Settings | config | 7 | All primitive types incl. DateTime, TimeOnly |
| Constants | config | 8 | Same type variety |
| Environments | config | 4 | Extra section — becomes its own class |
| Features | config | 4 | Feature flags as typed booleans |
| Assets | asset | 4 | Typed assets — string, int, bool, object |
| Connections | asset | 3 | Second asset sheet — all strings |
| _Meta | hidden | — | Underscore prefix — excluded from generation |
| _Notes | hidden | — | Underscore prefix — excluded from generation |

Key demo moment: drop this file into ConFigTree, switch to the XAML tab,
show `out_ConFigTree.Settings.IsEnabled` — bool, no cast, Verify Project catches typos.

-->
