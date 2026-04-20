<!-- TOML Format -->
<!-- Summary: Detailed contract for TOML inputs, including section naming, metadata overrides, scalar typing, and asset/reference handling. -->

ConFigTree reads `.toml` files where each top-level table represents one config section.

## Section naming

- Each top-level TOML table (`[SectionName]`) becomes a C# class property on the root config class.
- A table named `[_meta]` (case-insensitive) is reserved for file-level settings overrides and excluded from code generation.
- Flat TOML files with no tables default to a single `Settings` section.

## `[_meta]` table (optional)

A top-level table named `[_meta]` is excluded from code generation and read as settings overrides. Overrides apply for the current upload only and do not modify stored defaults.

| Key | Example value | Description |
|---|---|---|
| `namespace` | `MyCompany.Invoicing` | C# namespace |
| `rootClassName` | `InvoicingConfig` | Root class name |
| `outputFilename` | `InvoicingConfig` | Downloaded filename (no extension) |
| `dotnetVersion` | `net8` | `net6` or `net8` |
| `xmlDocComments` | `true` | Enable XML doc comments |
| `generateToString` | `true` | Emit a `ToString()` override listing all properties |
| `generateToJson` | `true` | Emit a `ToJson()` method using `System.Text.Json` |
| `generatePristine` | `true` | Emit an `IsPristine` property that checks drift from defaults |
| `generateLoader` | `false` | Include `Load()` method |
| `generateReadonly` | `true` | Generate readonly properties |
| `uipathVariableName` | `out_InvoicingConfig` | UiPath variable name in XAML snippet |

## Standard properties

A standard property is a bare scalar key inside a table:

```toml
[Settings]
QueueName    = "rpa_input_queue"   # string (inferred)
MaxRetries   = 3                   # int (inferred)
EnableLogging = true               # bool (inferred)
Threshold    = 1.5                 # double (inferred)
```

Types are inferred from the native TOML value type. An explicit `csType` can be provided via the `{ value, csType }` wrapper form:

```toml
[Settings]
SampleRate = { value = 4, csType = "double" }   # force double even though value is int
```

## Asset properties

An asset property uses the `{ assetName, folder }` wrapper:

```toml
[Assets]
QueueName = { assetName = "cfgtree_queue_name", folder = "CPMForge", description = "Input queue name" }
```

Add `valueType` to specify the emitted C# type (`string`, `int`, or `bool`, case-insensitive); anything else — including a missing `valueType` — emits `object?`. The runtime XAML snippet does the Orchestrator fetch and the typed cast.

> **Section names have no magic in TOML.** Unlike `.xlsx`, where a sheet whose col B header is literally `asset` is flagged as an **asset sheet** (`isAssetSheet: true`), TOML detects assets **per property, by value shape**. The section name `[Assets]` in the example above is just a conventional label — `[Orchestrator]`, `[Shared]`, or `[Settings]` would work identically. What makes a value an asset is the presence of `assetName` and `folder` keys, not the section it's in. You can mix scalar properties and asset properties inside the same section.

## `_TargetType` directive

A key named `_TargetType` (case-insensitive — `_TargetType`, `_targettype`, `_TARGETTYPE` all match) inside a section maps the generated class to an external type via a `ToXxx()` method. The key is excluded from code generation.

```toml
[Sap]
_TargetType        = "CPMForge.SAP.SapConfig"
Language           = "DE"
MultiLogonOption   = "Single"
SapLogonDescription = ""
```

Generates:

```csharp
public CPMForge.SAP.SapConfig ToSapConfig() =>
    new CPMForge.SAP.SapConfig
    {
        Language           = string.IsNullOrEmpty(Language)           ? "DE"     : Language,
        MultiLogonOption   = string.IsNullOrEmpty(MultiLogonOption)   ? "Single" : MultiLogonOption,
        SapLogonDescription = SapLogonDescription,
    };
```

String properties with a non-empty default get an `IsNullOrEmpty` guard so library defaults are preserved when a process bridge passes an empty string.

## Nested sections

Nested TOML tables become nested C# classes:

```toml
[Environments.UAT]
BaseUrl = "https://uat.example.com"
Timeout = 30

[Environments.Prod]
BaseUrl = "https://prod.example.com"
Timeout = 10
```

## Full example

```toml
[_meta]
rootClassName = "SapLibConfig"
namespace     = "CPMForge.SAP"

[Sap]
_TargetType          = "CPMForge.SAP.SapConfig"
Language             = "DE"
MultiLogonOption     = "Single"
SapLogonDescription  = ""
Username             = ""
NavigateOnEntry      = true
```
