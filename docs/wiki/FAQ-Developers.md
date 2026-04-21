<!-- FAQ Developers -->
<!-- Summary: Developer FAQ covering CodedConfig behavior, generator settings, schema rules, Studio quirks, and support. -->

## Concepts

### What are "coded source files" in UiPath Studio?

Starting with Studio 2023.10, a UiPath project can contain regular `.cs` (or `.vb`) files alongside the `.xaml` workflows. Studio compiles them as part of the project and makes any public types available to the workflow designer — visible in the Imports panel, usable in Assign expressions, surfaced by IntelliSense. ConFigTree generates one such `.cs` file: a plain class with typed properties plus a loader method.

The feature is gated on `UiPath.CodedWorkflows` being available on your package feed. The project target must be **Windows** or **Cross-platform**; Windows-Legacy does not support coded workflows at all.

### What is the Loader — what does it generate, when do I need it?

With the **Loader** toggle on (default), the generator emits a format-specific method on the root class:

- `.xlsx` → `public static CodedConfig Load(Dictionary<string, DataTable> tables)`
- `.toml` → `LoadToml(string)`
- `.json` → `LoadJson(string)`
- `.yaml` → `LoadYaml(string)`

The XAML snippet uses this method. If you switch the Loader off, you only get the typed class and are responsible for populating it yourself — useful if you want to reuse the class outside UiPath or feed it from a non-standard source.

### What formats are supported besides `.xlsx`?

TOML, JSON, and YAML. Drop any of those files onto the page and the same typed class is produced, with a format-matching `LoadToml` / `LoadJson` / `LoadYaml` method. The XAML snippet adjusts accordingly: no sheet-loading loop, one Assign, and (if the file has asset keys) the same `GetRobotAsset` loop for asset properties.

Asset-shaped entries are a special case for non-xlsx formats — see *"Does ConFigTree handle Orchestrator Assets?"* below.

### Can I use ConFigTree without REFramework?

Yes. The generated class is a plain C# class with no REFramework dependency. Any UiPath project with coded-workflow support (Windows / Cross-platform target, `UiPath.CodedWorkflows` installed) can use it. The XAML snippet is REFramework-shaped because that is the common integration path, but the class itself is framework-agnostic.

### Can I use the generated C# class outside UiPath?

Yes. It is a standalone C# file with no UiPath references. Drop it into any .NET 6+ project and compile. The `.xlsx` loader path depends on a `Dictionary<string, DataTable>` input, so you need to read the workbook into DataTables yourself (outside UiPath, you would typically use the same xlsx parsing library you use elsewhere). The TOML / JSON / YAML loaders take a string and do not require UiPath.

## Workflow and maintenance

### How do I update the generated class when the spreadsheet changes?

Edit `Config.xlsx`, open [configtree.cprima.net](https://configtree.cprima.net/), drop the file, download the new `.cs`, and replace the file in the project's `Config/` folder. Studio recompiles on save. That is the whole loop. No CLI, no Studio extension, no cached state between runs.

Regeneration is only needed when the **shape** changes — added / renamed / retyped properties, added / renamed / removed sheets. Editing only values in the spreadsheet does not require a regenerate; the loader reads values at runtime.

### Is it safe to regenerate during maintenance?

Yes, as long as your extensions live in a separate file (see below). The generated file is overwrite-safe. Property names and types track the xlsx exactly, so any shape drift between spreadsheet and code surfaces as a Studio compile error wherever the old name was referenced — which is the point. Drift is caught at design time instead of at 3 AM.

### How do I override or extend the generated code?

Use a partial class in a separate file. If the generated class is `CodedConfig`, create `Config/CodedConfig.Extensions.cs`:

```csharp
namespace Cpmf.Config;

public partial class CodedConfig
{
    public string ConnectionString => $"Host={ApiEndpoint};Timeout={Timeout}";
}
```

Your file is untouched on regeneration. Editing the generated file directly works, but anything you add will be gone the next time you replace it.

### How do I handle drift — the spreadsheet changed, what now?

Regenerate and let the compiler tell you what moved. If a property was renamed or removed in the xlsx, every reference in the workflows becomes a compile error (`BC30456: not a member of …`). Fix each one, verify, done. Added properties are non-breaking; existing references keep working.

For changes that are too mechanical to fix by hand, a find-and-replace across `.xaml` files is usually faster than clicking through Studio.

### How do I test that ConFigTree loaded the config correctly at runtime?

The quickest check is a `Log Message` immediately after the `Load ConFigTree` Assign in `InitAllSettings.xaml`. If the **ToString** feature is enabled, `out_ConFigTree.ToString()` prints every property and value. Scan the log for zeroes, empty strings, or `False` where real data is expected — those point at silent parse failures (a cell containing `"true"` where an `int` was declared, for example, parses as `0`).

For a structured check, enable the **Pristine** feature before generating and call `CheckPristine` after load — see the next question.

### What does CheckPristine / IsPristine actually check?

It compares the **schema** (property names) baked into the generated class at generation time against the keys actually present in the loaded data. It does not look at values.

The generated class gets a method:

```csharp
public DriftReport CheckPristine(IDictionary<string, IEnumerable<string>> actualKeys)
```

`DriftReport.IsPristine` is `true` only when `MissingKeys` and `ExtraKeys` are both empty — i.e. the deployed config file has exactly the keys the code was generated against, no more, no less. Extra keys indicate a config that was edited without regenerating the class (the new keys are ignored silently). Missing keys indicate a config that is older than the code (the missing keys take their compiled-in default).

This is a schema-drift smoke test, not a validation tool. It catches *"the spreadsheet and the code disagree about what fields exist"*, not *"this value is wrong."*

## Schema rules

### Why are sheets whose name starts with an underscore excluded?

By convention, sheets whose name starts with `_` (`_Meta`, `_Notes`, `_Draft`, …) are treated as author-facing metadata and skipped by the generator. This lets you keep notes, TODOs, or auxiliary data in the same workbook without them leaking into code.

The only special case is `_Meta` — if present, its key/value rows override the generator defaults (see *Configuration* for the list of keys).

### What is an asset sheet and how is it different from a config sheet?

The generator classifies each sheet by its column B header on the first row:

- `Value` → config sheet. Each row becomes a typed property on the corresponding class.
- `Asset` → asset sheet. Each row becomes an `OrchestratorAsset` entry; the value is fetched from Orchestrator at runtime via the generated `GetRobotAsset` loop in XAML.

An asset sheet has columns `Name | Asset | OrchestratorAssetFolder | Description` (classic, 4-column) or the same plus `ValueType` (typed, 5-column). A config sheet has `Name | Value | Description` or the same plus `DataType`.

### What is the ValueType column in an asset sheet?

Optional 5th column that narrows the asset's .NET type from the default `OrchestratorAsset<object>` to `OrchestratorAsset<string>`, `<int>`, `<double>`, or `<bool>`. Empty means object. With a typed ValueType, the asset value can be read without casting: `config.Assets.MaxItems.Value` is already an `int`.

### Does ConFigTree handle Orchestrator Assets?

Yes, in two places:

1. In `.xlsx` asset sheets, each row becomes an asset property. The loader does not fetch values; the generated XAML snippet adds a `ForEach` over `GetAllAssets()` with a `GetRobotAsset` activity that assigns the fetched value back onto the property.
2. In non-xlsx formats, asset properties follow the same pattern — the deserializer skips them (they carry `[JsonIgnore]` / `[YamlIgnore]` attributes), and the XAML `GetRobotAsset` loop populates them after load.

Either way, `AssetName` and `OrchestratorAssetFolder` are baked into the class from the source file; only the runtime `Value` is fetched.

### Can I nest config sections — sheets within sheets?

No. The hierarchy is flat: the workbook is the root class, each sheet is a section (nested class), each row is a property. There is no sheet-inside-sheet mechanism. If you want deeper nesting, use TOML (tables can nest arbitrarily) or split the config across multiple sheets named by convention (`Database`, `Database.Replica`, …) — the generator will emit them as sibling sections, not parent-child.

### What happens if a sheet has headers but no data rows?

The generator emits an empty class for that section. This is common on `Assets` sheets in greenfield projects: the schema exists, but no Orchestrator assets are defined yet. The class shows up in IntelliSense and the `GetAllAssets()` loop runs zero times at runtime — harmless.

## UiPath Studio quirks

### Why is there no support for Windows-Legacy projects?

Coded source files — the `.cs` files compiled inside a UiPath project — only work in the **Windows** and **Cross-platform** targets. Windows-Legacy runs on .NET Framework 4.6.1, which predates the coded workflows feature entirely. UiPath did not backport it. ConFigTree depends on it. Migrate the project to the Windows target first, then add ConFigTree.

### Why does the Namespace setting matter — can I use any name?

C# identifiers must start with a letter or underscore, not a digit or punctuation. A namespace like `1stProject.Config` or `My-Project.Config` is a compile error. UiPath project folders often contain characters that are illegal in C#: spaces, hyphens, leading digits. The **Namespace** setting exists so you can enter a clean C# name regardless of what the project folder is called. Default `Cpmf.Config` is safe. If you change it, stick to letters, digits (not first), dots, and underscores. Studio flags an invalid name immediately on save.

### Why does Studio mis-type the argument when I "Convert to Argument"?

Studio always creates `InArgument(Object)` when converting a local variable to an argument, regardless of the variable's inferred type. After converting `out_ConFigTree`, flip the direction to **Out** and change the type to the generated class (e.g. `CodedConfig` in the `Cpmf.Config` namespace). This is a known Studio behaviour; the correction takes about ten seconds.

### What is the XAML clipboard format and why does it use that mechanism?

When you copy activities inside UiPath Studio, Studio serialises them to the clipboard as XAML — the same XML format that `.xaml` workflow files use internally. Studio reconstructs the activities from that XAML on paste. ConFigTree generates a snippet in that same format, so pasting it into Studio is indistinguishable from pasting something you copied from another workflow. No Studio extension, no file import, no plugin — just Ctrl+C in the browser and Ctrl+V in Studio. The mechanism is not a hack; it is the documented way to author Studio workflows programmatically without the Studio API.

## Generator settings

Default values and meanings. Per-project overrides are remembered in the browser's `localStorage`; a `_Meta` sheet in the workbook can override these on a per-file basis. See [[Configuration]] for the full table.

| Setting | Default | Purpose |
|---|---|---|
| **Namespace** | `Cpmf.Config` | C# namespace for every emitted class. |
| **Root class** | `CodedConfig` | Name of the top-level aggregator class. |
| **Filename** | `CodedConfig` | Downloaded filename stem; `.cs` or `.xaml` appended. |
| **Target .NET** | `net6` | Controls emitted syntax — file-scoped namespaces, `init` accessors, etc. |
| **XML docs** | on | Emit `/// <summary>` from Description cells. |
| **ToString** | off | Emit `ToString()` listing every property and value. Useful for diagnostics logging. |
| **ToJson** | off | Emit `ToJson()` using `System.Text.Json`. |
| **Pristine** | off | Emit `Schema` manifest plus `CheckPristine(actualKeys)`. Schema-drift smoke test (see above). |
| **Loader** | on | Emit the format-specific `Load` method. Off = you populate the class yourself. |
| **Readonly** | off | Emit `init` accessors instead of `set` (C# 9 / .NET 5+). |
| **UiPath variable name** | `out_ConFigTree` | Name the XAML snippet uses for the loaded-config variable. |

## Support

### How do I get support?

ConFigTree is open source and support is best-effort via GitHub Issues. Open an issue at [github.com/rpapub/ConFigTree/issues](https://github.com/rpapub/ConFigTree/issues). Include the ConFigTree build hash (shown in the page footer), Studio version, and a one-sentence description of expected vs actual. Attaching a minimal `Config.xlsx` that reproduces the problem is the single most helpful thing you can do — it turns a 30-minute back-and-forth into a 5-minute fix.

### How do I contribute — add a format parser, fix a bug, open a PR?

Fork, branch, PR against `main`. Tests live under `test/` and are run with `just test` (via `node test/run-generators.mjs`). The test runner regenerates goldens on first miss and then asserts equality on subsequent runs — so new fixtures land as PASS after one run, and existing fixtures catch regressions. For format parsers, the extension points are in `public/js/parsers.js`; see the TOML and YAML implementations as a template.
