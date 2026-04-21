<!-- Developer Samples -->
<!-- Summary: Sample REFramework projects that show the base, complete, and extended paths for developers using CodedConfig. -->

## Reference implementation

REFramework with ConFigTree fully wired up. The finished result after completing the "Getting-Started" walkthrough.

[⬇ Download gotten-started.zip](https://github.com/rpapub/ConFigTree/raw/main/docs/downloads/reframework-min-v24.10.0-gotten-started.zip)

## Sample Config.xlsx files

Drop any of these onto [configtree.cprima.net](https://configtree.cprima.net/) to see the generator in action without crafting a workbook yourself.

[⬇ Download sample-configs.zip](https://github.com/rpapub/ConFigTree/raw/main/docs/downloads/sample-configs.zip)

The zip contains three curated fixtures, each meant to demonstrate a different part of the surface:

- **Config_Basic.xlsx** — the minimal case. Settings + Constants with `string` and `int` values and an empty Assets sheet. Best starting point to see what the generator produces with almost no input.
- **Config_Types.xlsx** — every supported C# datatype on one sheet. `string`, `int`, `double`, `bool`, `DateOnly`, `DateTime`, `TimeOnly`, typed `OrchestratorAsset<T>`, plus the `DataType=credential` / `DataType=asset` markers and the `_TargetType` directive.
- **Config_Reference.xlsx** — the documentation master. All datatypes, multiple extra config sheets (`Environments`, `Features`), both typed and classic asset sheets, and hidden `_Meta` / `_Notes` sheets that the generator skips.
