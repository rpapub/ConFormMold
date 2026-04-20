<!-- Configuration -->
<!-- Summary: Browser settings reference for the ConFigTree generator, including defaults, feature toggles, and UiPath snippet options. -->

All settings are saved automatically to `localStorage` and restored on next visit. Use **Reset settings** in the footer to return to defaults.

Every setting here can also be overridden per file via the `_Meta` sheet (xlsx) or `[_meta]` table (TOML) — see the format pages.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Namespace | `Cpmf.Config` | C# namespace for all generated classes |
| Root class | `CodedConfig` | Name of the top-level config class |
| Filename | `Config` | Output filename (`.cs` or `.xaml` appended automatically) |
| Target .NET | `.NET 6` | Affects generated syntax (e.g. record types, required members) |

## Features

| Toggle | Default | Description |
|--------|---------|-------------|
| XML docs | On | Emit `/// <summary>` comments from the Description column |
| Loader | On | Emit a format-specific static load method. For xlsx: `Load(Dictionary<string, DataTable> tables)`. For TOML/JSON/YAML: `LoadToml(filePath)` / `LoadJson(filePath)` / `LoadYaml(filePath)`. |
| ToString | Off | Emit a `ToString()` override listing all property values |
| ToJson | Off | Emit a `ToJson()` method using `System.Text.Json` |
| IsPristine | Off | Emit a `Schema` manifest plus a `CheckPristine(actualKeys)` method that returns a `DriftReport` — lists keys present in the source but missing from the generated schema, and vice versa. Use `report.IsPristine` to check for drift. |
| Readonly | Off | Make all properties `init`-only (C# 9 / .NET 5+). |

## UiPath

| Setting | Default | Description |
|---------|---------|-------------|
| Variable name | `out_ConFigTree` | The Studio variable name used in the generated XAML snippet |

## Asset properties

Properties declared as assets (via the asset-sheet shape in xlsx, the `DataType=asset` / `DataType=credential` column, or the `{ assetName, folder }` wrapper in TOML/JSON/YAML) are **not populated from the config file at runtime**. The generator emits the property declaration in the `.cs` and a matching `GetRobotAsset` block in the `.xaml` snippet. Orchestrator fetches populate the property when the XAML runs inside UiPath Studio — for every source format.

For TOML/JSON/YAML, asset properties carry a deserialization-skip attribute (`[System.Text.Json.Serialization.JsonIgnore]` or `[YamlDotNet.Serialization.YamlIgnore]`) so the `LoadXxx(filePath)` path ignores the wrapper shape in the deployed file.
