[//]: # (Configuration)

All settings are saved automatically to `localStorage` and restored on next visit. Use **Reset settings** in the footer to return to defaults.

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
| Loader | On | Emit a static `Load()` method for deserializing from `Dictionary<string, DataTable>` |
| ToString | Off | Emit a `ToString()` override listing all property values |
| ToJson | Off | Emit a `ToJson()` method using `System.Text.Json` |
| IsPristine | Off | Emit an `IsPristine` property that returns `true` when all values match their defaults |
| Readonly | Off | Make all properties `init`-only (requires .NET 6+) |

## UiPath

| Setting | Default | Description |
|---------|---------|-------------|
| Variable name | `out_ConFigTree` | The Studio variable name used in the generated XAML snippet |
