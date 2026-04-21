<!-- XAML Snippet -->
<!-- Summary: Explains the generated UiPath clipboard snippet, what it contains, and how to paste it into InitAllSettings.xaml. -->

The **XAML snippet** tab generates a UiPath Studio clipboard snippet that wires the generated C# class into your REFramework project.

## What it contains

For `.xlsx` sources with the Loader feature enabled, the snippet contains:

1. A `ForEach` loop that reads each config sheet into a `Dictionary<string, DataTable>`
2. An `Assign` activity that calls `YourClass.Load(dt_Tables)` and assigns the result to the configured variable
3. (If asset sheets are present) A `ForEach` loop over `GetAllAssets()` with a `GetRobotAsset` call per asset

For non-Excel sources (JSON, TOML, YAML), a single `Assign` with the appropriate `LoadJson` / `LoadToml` / `LoadYaml` method is generated.

```mermaid

%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#eee8d5', 'primaryTextColor': '#073642', 'primaryBorderColor': '#93a1a1', 'lineColor': '#586e75', 'edgeLabelBackground': '#fdf6e3', 'secondaryColor': '#fdf6e3', 'tertiaryColor': '#eee8d5'}}}%%
sequenceDiagram
    participant RF as REFramework
    participant CT as CodedConfig
    participant OC as Orchestrator

    RF->>CT: Load(dt_Tables)
    CT-->>RF: out_ConFigTree (AssetName + Folder set, Value empty)
    loop ForEach asset in GetAllAssets()
        RF->>OC: GetRobotAsset(AssetName, FolderPath)
        OC-->>RF: assetValue
        RF->>CT: asset.ValueAsObject = assetValue
    end
    note over RF: out_ConFigTree fully populated
```

## How to paste into Studio

1. Switch to the **XAML snippet** tab in ConFigTree
2. Click **Copy**
3. In UiPath Studio, open `Framework/InitAllSettings.xaml`
4. Click inside the workflow canvas
5. Press **Ctrl+V** — the activities paste directly from the clipboard

![023](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/023_studio_scroll-to-the-bottom-of-initallsettings_2880x1620.png)

## Variable name

The variable name in the snippet is controlled by the **Variable name** setting in the UiPath section of the sidebar. Default: `out_ConFigTree`.

By default, the Clipboard snippet will only create a variable of type `Object`. This must be one-time converted to an aout argument of the type `CodedConfig`.

## Requirements

- UiPath Studio 2023.10 or later
- REFramework project (Windows or Windows-Legacy)
- The generated `.cs` file added to the project's `Config/` folder and compiled
