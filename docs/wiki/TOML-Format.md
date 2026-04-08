[//]: # (TOML Format)

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

Asset properties are typed as `OrchestratorAsset<T>` in the generated class. Add `valueType` to specify the C# type (`string`, `int`, `bool`); defaults to `object`.

## `_TargetType` directive

A key named `_TargetType` inside a section maps the generated class to an external type via a `ToXxx()` method. The key is excluded from code generation.

```toml
[Sap]
_TargetType        = "DHL.ITS.RPAForge.SAP.SapConfig"
Language           = "DE"
MultiLogonOption   = "Single"
SapLogonDescription = ""
```

Generates:

```csharp
public DHL.ITS.RPAForge.SAP.SapConfig ToSapConfig() =>
    new DHL.ITS.RPAForge.SAP.SapConfig
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
namespace     = "DHL.ITS.RPAForge.SAP"

[Sap]
_TargetType          = "DHL.ITS.RPAForge.SAP.SapConfig"
Language             = "DE"
MultiLogonOption     = "Single"
SapLogonDescription  = ""
Username             = ""
NavigateOnEntry      = true
```
