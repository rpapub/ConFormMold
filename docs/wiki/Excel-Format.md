[//]: # (Excel Format)

ConFigTree reads `.xlsx` workbooks where each sheet represents one config section.

## Sheet naming

- Each visible sheet becomes a C# class property on the root config class.
- Sheets whose name starts with `_` are excluded from code generation (use for metadata or scratch data).

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

## Config sheets (standard)

A config sheet has the following columns:

| Column | Name | Required | Description |
|--------|------|----------|-------------|
| A | Name | Yes | C# property name (PascalCase recommended) |
| B | Value | Yes | Default value |
| C | Type | No | C# type hint (`string`, `int`, `bool`, `double`, …). Defaults to `string`. |
| D | Description | No | XML doc comment text |

## Asset sheets

A sheet is treated as an asset sheet when its name contains `Asset` or when it follows the asset sheet column convention:

| Column | Name | Required | Description |
|--------|------|----------|-------------|
| A | Name | Yes | C# property name |
| B | Asset | Yes | Orchestrator asset name |
| C | OrchestratorAssetFolder | No | Orchestrator folder path |
| D | Description | No | XML doc comment text |
| E | ValueType | No | C# value type: `string`, `int`, `bool`. Defaults to `object`. |

Asset properties are typed as `OrchestratorAsset<T>` in the generated class.

## Example

| Name | Value | Type | Description |
|------|-------|------|-------------|
| QueueName | rpa_input_queue | string | Input queue name |
| MaxRetries | 3 | int | Maximum retry count |
| EnableLogging | true | bool | Enable detailed logging |
