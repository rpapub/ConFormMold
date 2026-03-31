[//]: # (Excel Format)

ConFigTree reads `.xlsx` workbooks where each sheet represents one config section.

## Sheet naming

- Each visible sheet becomes a C# class property on the root config class.
- Sheets whose name starts with `.` are excluded from code generation (use for metadata or scratch data).

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
