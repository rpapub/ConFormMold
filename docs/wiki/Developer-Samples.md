<!-- Developer Samples -->
<!-- Summary: Sample REFramework projects that show the base, complete, and extended paths for developers using CodedConfig. -->

Minimal REFramework starter projects for use with the [[Getting Started|Getting-Started]] walkthrough.

| base | complete | extended |
|:---:|:---:|:---:|
| Unmodified REFramework v24.10.0. The starting point for the Getting Started walkthrough. | REFramework with ConFigTree fully wired up. The finished result after completing the walkthrough. | REFramework + ConFigTree with additional patterns and extended examples. |
| [⬇ Download base.zip](https://github.com/rpapub/ConFigTree/raw/main/docs/downloads/reframework-min-v24.10.0-base.zip) | [⬇ Download gotten-started.zip](https://github.com/rpapub/ConFigTree/raw/main/docs/downloads/reframework-min-v24.10.0-gotten-started.zip) | *coming soon* |

---

## Sample Config.xlsx files

Drop any of these onto [configtree.cprima.net](https://configtree.cprima.net/) to see the generator in action without crafting a workbook yourself.

[⬇ Download sample-configs.zip](https://github.com/rpapub/ConFigTree/raw/main/docs/downloads/sample-configs.zip)

The zip contains three curated fixtures, each meant to demonstrate a different part of the surface:

- **Config_Basic.xlsx** — the minimal case. Settings + Constants with `string` and `int` values and an empty Assets sheet. Best starting point to see what the generator produces with almost no input.
- **Config_Types.xlsx** — every supported C# datatype on one sheet. `string`, `int`, `double`, `bool`, `DateOnly`, `DateTime`, `TimeOnly`, typed `OrchestratorAsset<T>`, plus the `DataType=credential` / `DataType=asset` markers and the `_TargetType` directive.
- **Config_Reference.xlsx** — the documentation master. All datatypes, multiple extra config sheets (`Environments`, `Features`), both typed and classic asset sheets, and hidden `_Meta` / `_Notes` sheets that the generator skips.

---

<!--
DRAFT

## Config_REFramework_Default.xlsx

[Download](https://github.com/rpapub/ConFigTree/raw/main/samples/Config_REFramework_Default.xlsx)

The unmodified Config.xlsx shipped with every REFramework project.
Source: https://github.com/UiPath-Services/StudioTemplates

### Sheet: Settings (3 rows)

| Name | Value | Description |
|------|-------|-------------|
| OrchestratorQueueName | ProcessABCQueue | Orchestrator queue name |
| OrchestratorQueueFolder | *(empty)* | Folder name — leave empty for classic folders |
| logF_BusinessProcessName | Framework | Logging field for grouping subprocesses |

### Sheet: Constants (11 rows)

| Name | Value | Description |
|------|-------|-------------|
| MaxRetryNumber | 0 | Must be 0 when using Orchestrator queues |
| MaxConsecutiveSystemExceptions | 0 | Stop job after N consecutive errors. 0 = disabled |
| ExScreenshotsFolderPath | Exceptions_Screenshots | Where to save exception screenshots |
| LogMessage_GetTransactionData | Processing Transaction Number: | Static log prefix |
| LogMessage_GetTransactionDataError | Error getting transaction data for Transaction Number: | Static log prefix |
| LogMessage_Success | Transaction Successful. | Static log prefix |
| LogMessage_BusinessRuleException | Business rule exception. | Static log prefix |
| LogMessage_ApplicationException | System exception. | Static log prefix |
| ExceptionMessage_ConsecutiveErrors | The maximum number of consecutive system exceptions was reached. | Faulted job message |
| RetryNumberGetTransactionItem | 2 | Retry count for Get Transaction Item |
| RetryNumberSetTransactionStatus | 2 | Retry count for Set Transaction Status |
| ShouldMarkJobAsFaulted | False | Mark job as Faulted on init error or max exceptions |

### Sheet: Assets (header only)

| Name | Asset | OrchestratorAssetFolder | Description |
|------|-------|------------------------|-------------|
| *(no data rows)* | | | |

---

## Config_Reference.xlsx

[Download](https://github.com/rpapub/ConFigTree/raw/main/samples/Config_Reference.xlsx)

ConFigTree's documentation master fixture — all sheet types, all column types.
Underscore-prefixed sheets (`_Meta`, `_Notes`) are excluded from code generation.

### Sheet: Settings

| Name | Value | Description |
|------|-------|-------------|
| OrchestratorQueueName | everything_input_queue | string |
| MaxItemsPerRun | 100 | int |
| Threshold | 3.14 | double |
| IsEnabled | true | bool |
| CutoffDate | 2025-12-31 | DateOnly |
| ScheduledAt | 2025-06-15 09:30 | DateTime |
| DailyRunTime | 08:00 | TimeOnly |

### Sheet: Constants

| Name | Value | Description |
|------|-------|-------------|
| MaxRetryNumber | 0 | int |
| MaxConsecutiveSystemExceptions | 3 | int |
| Pi | 3.14159 | double |
| StrictMode | false | bool |
| ExpiresOn | 2026-01-01 | DateOnly |
| CreatedAt | 2024-03-01 12:00 | DateTime |
| WindowOpen | 09:00 | TimeOnly |
| WindowClose | 17:30 | TimeOnly |

### Sheet: Environments

| Name | Value | Description |
|------|-------|-------------|
| BaseUrl | https://uat.example.com | string |
| Environment | UAT | string |
| Timeout | 30 | int |
| RetryDelay | 2.5 | double |

### Sheet: Features

| Name | Value | Description |
|------|-------|-------------|
| EnableNotifications | true | bool |
| EnableDryRun | false | bool |
| MaxParallelJobs | 4 | int |
| FeatureLabel | beta | string |

### Sheet: Assets (typed asset sheet)

| Name | Asset | OrchestratorAssetFolder | Description | ValueType |
|------|-------|------------------------|-------------|-----------|
| QueueName | cfgtree_queue_name | CPMForge | Input queue name | string |
| MaxItemsPerRun | cfgtree_max_items_per_run | CPMForge | Maximum items to process | int |
| StrictMode | cfgtree_strict_mode | CPMForge | Strict processing toggle | bool |
| GenericValue | cfgtree_generic_value | CPMForge | Untyped fallback asset | *(empty)* |

### Sheet: Connections (typed asset sheet)

| Name | Asset | OrchestratorAssetFolder | Description | ValueType |
|------|-------|------------------------|-------------|-----------|
| ApiEndpoint | cfgtree_api_endpoint | CPMForge | REST API endpoint URL | string |
| BaseUrl | cfgtree_base_url | CPMForge | Service base URL | string |
| OrchestratorFolder | cfgtree_orch_folder | CPMForge | Orchestrator folder path | string |

### Sheet: _Notes (hidden — not generated)

| Section | Note |
|---------|------|
| Settings | REFramework required — must always be present |
| Constants | REFramework required — must always be present |
| Environments | Extra config sheet example |
| Features | Extra config sheet example |
| Assets | 5-column typed asset sheet — process runtime values |
| Connections | 5-column typed asset sheet — endpoint/URL values |
| _Meta | Hidden — excluded from code generation (underscore prefix) |
| _Notes | Hidden — excluded from code generation (underscore prefix) |

-->
