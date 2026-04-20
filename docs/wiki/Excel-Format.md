<!-- Excel Format -->
<!-- Summary: Detailed contract for .xlsx inputs, including sheet naming, type inference, explicit overrides, assets, and directives. -->
[//]: # (Excel Format)

ConFigTree reads `.xlsx` workbooks where each sheet represents one config section. This page covers the full Excel contract: sheet layout, the two sheet shapes, implicit vs explicit typing, and the `_TargetType` directive.

## Sheet naming

- Each visible sheet becomes a C# class property on the root config class.
- Sheets whose name starts with `_` are excluded from code generation.
- The reserved sheet `_Meta` (case-insensitive) is consumed as a per-file settings-override map and is not emitted.

## `_Meta` sheet (optional)

A sheet named `_Meta` is excluded from code generation and read as key/value settings overrides. Overrides apply for the current upload only and do not modify stored defaults.

| Key | Example value | Description |
|---|---|---|
| `namespace` | `MyCompany.Invoicing` | C# namespace |
| `rootClassName` | `InvoicingConfig` | Root class name |
| `outputFilename` | `InvoicingConfig` | Downloaded filename (no extension) |
| `dotnetVersion` | `net8` | `net6` or `net8` |
| `xmlDocComments` | `true` | Enable XML doc comments |
| `generateLoader` | `false` | Include `Load()` method |
| `generateReadonly` | `true` | Generate readonly properties |
| `uipathVariableName` | `out_InvoicingConfig` | UiPath variable name in XAML snippet |

## Sheet shapes

ConFigTree recognises two sheet shapes, chosen by looking at the **header row**:

| Shape | Trigger (header row) | Purpose |
|---|---|---|
| Standard sheet | col B header is anything other than `asset` | Default values loaded from the spreadsheet |
| Asset sheet | col B header is `asset` (case-insensitive) | Orchestrator references, fetched at runtime via `GetRobotAsset` |

## Standard config sheets

### Column layout

| Col | Header | Required | Purpose |
|---|---|---|---|
| A | Name | yes | C# property name (PascalCase recommended) |
| B | Value | yes | Default value |
| C | Description | no | XML doc comment text |
| any | `DataType` | no | Explicit C# type override for that row (header matched case-insensitively) |

### Implicit typing — from the Value cell

Without a `DataType` column, ConFigTree picks the C# type from the Excel cell itself:

| Value cell content | Cell type (Excel) | C# type | Example |
|---|---|---|---|
| Text | Text | `string` | `BasicQueue` → `string = "BasicQueue"` |
| Whole number | Number | `int` | `10` → `int = 10` |
| Decimal number | Number | `double` | `3.14` → `double = 3.14` |
| `TRUE` / `FALSE` | Boolean | `bool` | `TRUE` → `bool = true` |
| Date only (midnight) | Date | `DateOnly` | `2025-12-31` → `DateOnly(2025, 12, 31)` |
| Date + time | Date | `DateTime` | `2025-06-15 09:30` → `DateTime(2025, 6, 15, 9, 30, 0)` |
| Time only | Date (serial < 1900) | `TimeOnly` | `08:00` → `TimeOnly(8, 0, 0)` |
| Empty | — | `string` (no default) | — |

**Example — implicit typing**

| Name | Value | Description |
|---|---|---|
| QueueName | BasicQueue | Orchestrator queue name |
| MaxRetries | 3 | Retry count |
| Threshold | 3.14 | Decision threshold |
| IsEnabled | TRUE | Feature flag |
| CutoffDate | 2025-12-31 | Run ends on this day |

Becomes:

```csharp
public string   QueueName  { get; set; } = "BasicQueue";
public int      MaxRetries { get; set; } = 3;
public double   Threshold  { get; set; } = 3.14;
public bool     IsEnabled  { get; set; } = true;
public DateOnly CutoffDate { get; set; } = new DateOnly(2025, 12, 31);
```

### Explicit typing — the `DataType` column

Add a column named `DataType` (any position, header matched case-insensitively). Its per-row value **overrides** the implicit guess.

| `DataType` cell | Effect |
|---|---|
| `string`, `int`, `double`, `bool`, `DateOnly`, `DateTime`, `TimeOnly` (case-**sensitive**) | Forces the C# type. The Value cell is still read for the default literal. |
| `credential` or `asset` (case-insensitive) | Credential / asset reference — emits `string` plus companion `…Folder` / `…Name` getters. See below. |
| empty or unknown (e.g. `STRING`, `float`) | Ignored — implicit typing applies. |

The seven C# type names are case-sensitive; `String` or `Double` will be ignored.

**Example — forcing `double`**

Excel stores `1` as a number cell; without an override, it becomes `int`. If you want `double`:

| Name | Value | Description | DataType |
|---|---|---|---|
| SampleRate | 1 | Sample rate multiplier | double |

```csharp
public double SampleRate { get; set; } = 1.0;
```

### Credential and asset references (`DataType=credential` or `asset`)

Writing `credential` or `asset` in the `DataType` column tells ConFigTree this property holds an Orchestrator reference stored as `"folder/name"`. The generator emits:

1. The property itself, typed `string`.
2. Two read-only companion properties — `…Folder` and `…Name` — that split the string on `/`.

**Example**

| Name | Value | Description | DataType |
|---|---|---|---|
| SapCredential |  | SAP Orchestrator credential | credential |
| QueueNameRef |  | Queue name Orchestrator asset | asset |

```csharp
public string SapCredential       { get; set; } = "";
public string SapCredentialFolder => SapCredential.Contains('/') ? SapCredential.Split('/')[0] : "";
public string SapCredentialName   => SapCredential.Contains('/') ? SapCredential.Split('/')[1] : SapCredential;

public string QueueNameRef       { get; set; } = "";
public string QueueNameRefFolder => QueueNameRef.Contains('/') ? QueueNameRef.Split('/')[0] : "";
public string QueueNameRefName   => QueueNameRef.Contains('/') ? QueueNameRef.Split('/')[1] : QueueNameRef;
```

At runtime your code fills in the `string` property (e.g. from an asset read) and reads `.Folder` / `.Name` without re-splitting.

> For **full asset objects** fetched from Orchestrator via `GetRobotAsset`, use an **asset sheet** instead — see below.

## Asset sheets

An asset sheet is a sheet whose **col B header is `asset`** (case-insensitive). Its rows describe Orchestrator assets fetched at runtime via `GetRobotAsset`. Asset sheets are never loaded from the DataTable — the spreadsheet row only tells ConFigTree which asset to fetch.

### Column layout

| Col | Header | Required | Purpose |
|---|---|---|---|
| A | Name | yes | C# property name |
| B | Asset | yes | Orchestrator asset name |
| C | OrchestratorAssetFolder | no | Folder path |
| D | Description | no | XML doc comment text |
| any | `ValueType` | no | C# type for the fetched value (header matched case-insensitively) |

### `ValueType` column

| `ValueType` cell | Emitted C# type |
|---|---|
| `string` (case-insensitive) | `string` |
| `int` (case-insensitive) | `int` |
| `bool` (case-insensitive) | `bool` |
| empty, missing header, or anything else | `object?` |

### Example

| Name | Asset | OrchestratorAssetFolder | Description | ValueType |
|---|---|---|---|---|
| CredentialM365 | sc_M365 | Shared | M365 service credential |  |
| QueueNameAsset | asset_InputQueue | Shared | Input queue name | string |
| MaxItemsAsset | asset_MaxItems | Shared | Items per run | int |
| StrictModeAsset | asset_StrictMode | Shared | Strict processing toggle | bool |

```csharp
public object? CredentialM365  { get; set; }
public string  QueueNameAsset  { get; set; } = "";
public int     MaxItemsAsset   { get; set; }
public bool    StrictModeAsset { get; set; }
```

The generated XAML snippet performs the Orchestrator fetch and the typed cast (`CStr`, `CInt`, `CBool`).

## `_TargetType` directive

A row whose Name cell is `_TargetType` (case-**insensitive**) binds the generated class to an external type via a `ToXxx()` mapping method. The row itself is not emitted as a property.

| Name | Value | Description |
|---|---|---|
| _TargetType | CPMForge.SAP.SapConfig |  |
| Language | DE | SAP logon language |
| MultiLogonOption | Single | Single vs Multi logon |

Generates:

```csharp
public CPMForge.SAP.SapConfig ToSapConfig() =>
    new CPMForge.SAP.SapConfig
    {
        Language         = string.IsNullOrEmpty(Language)         ? "DE"     : Language,
        MultiLogonOption = string.IsNullOrEmpty(MultiLogonOption) ? "Single" : MultiLogonOption,
    };
```

String properties with a non-empty default get an `IsNullOrEmpty` guard so library defaults are preserved when a process bridge passes an empty string.

Any other row starting with `_` is skipped silently.

## Gotchas and tips

- **`DataType=double` for whole numbers.** Excel stores `1` as a number cell; without an override it becomes `int`. Use `DataType = double` to force a decimal property.
- **Case-sensitive C# type names.** `string` ✔, `String` ✘ (ignored, falls back to implicit).
- **Column header matching is case-insensitive.** `DataType`, `datatype`, `DATATYPE` all work. Same for `ValueType` and `_TargetType`.
- **Empty cells default to `string` with no initializer** — handy for properties that will be filled at runtime.
- **Asset sheets don't load from the DataTable.** Their values come from Orchestrator, not the Excel row.

## See also

- [[TOML Format|TOML-Format]] — same concepts for `.toml` inputs
- [[Why Typed Config|Why-Typed-Config]] — why strong typing matters for RPA config
- [[XAML Snippet|XAML-Snippet]] — how assets are fetched at runtime
