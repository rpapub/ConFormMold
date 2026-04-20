<!-- Mermaid Diagrams -->
<!-- Summary: Unlisted exploration page that collects candidate Mermaid diagrams for the wiki and product story. -->

Unlisted page. 12 diagram candidates across different Mermaid types.
Not linked from the sidebar.

---

## 1. System Overview

```mermaid

%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#eee8d5', 'primaryTextColor': '#073642', 'primaryBorderColor': '#93a1a1', 'lineColor': '#586e75', 'edgeLabelBackground': '#fdf6e3', 'secondaryColor': '#fdf6e3', 'tertiaryColor': '#eee8d5'}}}%%
flowchart LR
    F[".xlsx / .json\n.toml / .yaml"] --> P["Parser\nparsers.js"]
    P --> IR["SchemaNode[]\nIR"]
    IR --> CS["C# Generator\ncs-generator.js"]
    IR --> XA["XAML Generator\nxaml-generator.js"]
    CS --> OUT1[".cs file"]
    XA --> OUT2["XAML snippet\nClipboardData"]
```

---

## 2. Format Dispatch

```mermaid

%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#eee8d5', 'primaryTextColor': '#073642', 'primaryBorderColor': '#93a1a1', 'lineColor': '#586e75', 'edgeLabelBackground': '#fdf6e3', 'secondaryColor': '#fdf6e3', 'tertiaryColor': '#eee8d5'}}}%%
flowchart TD
    F["File dropped or selected"] --> EXT["Detect extension"]
    EXT -->|".xlsx"| XLSX["SheetJS\nbinary → workbook"]
    EXT -->|".json"| JSON["JSON.parse\ntext → object"]
    EXT -->|".toml"| TOML["smol-toml\ntext → object"]
    EXT -->|".yaml / .yml"| YAML["js-yaml\ntext → object"]
    XLSX & JSON & TOML & YAML --> IR["SchemaNode[]"]
```

---

## 3. SchemaNode IR

```mermaid

%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#eee8d5', 'primaryTextColor': '#073642', 'primaryBorderColor': '#93a1a1', 'lineColor': '#586e75', 'edgeLabelBackground': '#fdf6e3', 'secondaryColor': '#fdf6e3', 'tertiaryColor': '#eee8d5'}}}%%
classDiagram
    class SchemaNode {
        +string name
        +Property[] properties
        +SchemaNode[] children
        +string? warning
    }
    class Property {
        +string name
        +string csType
        +string description
        +bool isAsset
        +string? assetName
        +string? folder
        +string? valueType
    }
    SchemaNode "1" --> "*" Property
    SchemaNode "1" --> "*" SchemaNode : children
```

---

## 4. Migration (Dual Mode)

```mermaid

%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#eee8d5', 'primaryTextColor': '#073642', 'primaryBorderColor': '#93a1a1', 'lineColor': '#586e75', 'edgeLabelBackground': '#fdf6e3', 'secondaryColor': '#fdf6e3', 'tertiaryColor': '#eee8d5'}}}%%
stateDiagram-v2
    direction LR
    [*] --> Before
    Before --> Now : add coded ConFigTree
    Now --> SoonAfter : retire Config dictionary

    state Before {
        s1 : out_Config("Key").ToString
    }
    state Now {
        s2 : out_Config("Key").ToString
        s3 : out_ConFigTree.Section.Property
        s2 --> s3 : migrate sheet by sheet
    }
    state "Soon After" as SoonAfter {
        s4 : out_ConFigTree.Section.Property
    }
```

---

## 5. REFramework Integration Sequence

```mermaid

%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#eee8d5', 'primaryTextColor': '#073642', 'primaryBorderColor': '#93a1a1', 'lineColor': '#586e75', 'edgeLabelBackground': '#fdf6e3', 'secondaryColor': '#fdf6e3', 'tertiaryColor': '#eee8d5'}}}%%
sequenceDiagram
    participant Dev as Developer
    participant CT as ConFigTree
    participant Studio as UiPath Studio
    participant RF as REFramework

    Dev->>CT: Drop Config.xlsx
    CT->>Dev: .cs class + XAML snippet
    Dev->>Studio: Add .cs to Lib/
    Dev->>Studio: Ctrl+V snippet into InitAllSettings.xaml
    Studio->>RF: Build project
    RF->>RF: CodedConfig.Load(dt_Tables)
    RF->>Dev: out_ConFigTree.Section.Property
```

---

## 6. Excel Workbook Structure

```mermaid

%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#eee8d5', 'primaryTextColor': '#073642', 'primaryBorderColor': '#93a1a1', 'lineColor': '#586e75', 'edgeLabelBackground': '#fdf6e3', 'secondaryColor': '#fdf6e3', 'tertiaryColor': '#eee8d5'}}}%%
erDiagram
    WORKBOOK ||--|{ CONFIG_SHEET : contains
    WORKBOOK ||--o{ ASSET_SHEET : contains
    CONFIG_SHEET {
        string Name
        string Value
        string Type
        string Description
    }
    ASSET_SHEET {
        string Name
        string Asset
        string OrchestratorAssetFolder
        string Description
        string ValueType
    }
```

---

## 7. Generated C# Class Structure

```mermaid

%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#eee8d5', 'primaryTextColor': '#073642', 'primaryBorderColor': '#93a1a1', 'lineColor': '#586e75', 'edgeLabelBackground': '#fdf6e3', 'secondaryColor': '#fdf6e3', 'tertiaryColor': '#eee8d5'}}}%%
classDiagram
    class CodedConfig {
        +SettingsConfig Settings
        +AssetsConfig Assets
        +Load(Dictionary~string,DataTable~)$ CodedConfig
        +ToString() string
    }
    class SettingsConfig {
        +string QueueName
        +int MaxRetries
        +bool EnableLogging
    }
    class AssetsConfig {
        +OrchestratorAsset~string~ ApiKey
        +OrchestratorAsset~int~ MaxItems
    }
    class OrchestratorAsset~T~ {
        +string AssetName
        +string Folder
        +T Value
    }
    CodedConfig --> SettingsConfig
    CodedConfig --> AssetsConfig
    AssetsConfig --> "2" OrchestratorAsset
```

---

## 8. Settings Mind Map

```mermaid

%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#eee8d5', 'primaryTextColor': '#073642', 'primaryBorderColor': '#93a1a1', 'lineColor': '#586e75', 'edgeLabelBackground': '#fdf6e3', 'secondaryColor': '#fdf6e3', 'tertiaryColor': '#eee8d5'}}}%%
mindmap
    root((ConFigTree))
        Code Shape
            Namespace
            Root class
            Target .NET
            Readonly
        Code Content
            XML docs
            ToString
            ToJson
            IsPristine
        Runtime
            Loader
            UiPath variable name
        Output
            Filename
```

---

## 9. Asset Loading Sequence

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

---

## 10. Deployment Pipeline

```mermaid

%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#eee8d5', 'primaryTextColor': '#073642', 'primaryBorderColor': '#93a1a1', 'lineColor': '#586e75', 'edgeLabelBackground': '#fdf6e3', 'secondaryColor': '#fdf6e3', 'tertiaryColor': '#eee8d5'}}}%%
flowchart LR
    subgraph app ["App deploy"]
        P1["push main"] --> A1["deploy.yml"]
        A1 --> B1["write build.json"]
        B1 --> G1["GitHub Pages"]
        G1 --> L1["configtree.cprima.net"]
    end
    subgraph wiki ["Wiki sync"]
        P2["docs/wiki/** changed"] --> A2["sync-wiki.yml"]
        A2 --> W1["clone wiki repo"]
        W1 --> W2["copy + push"]
        W2 --> L2["github.com/.../wiki"]
    end
```

---

## 11. Wiki Authoring Flow

```mermaid

%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#eee8d5', 'primaryTextColor': '#073642', 'primaryBorderColor': '#93a1a1', 'lineColor': '#586e75', 'edgeLabelBackground': '#fdf6e3', 'secondaryColor': '#fdf6e3', 'tertiaryColor': '#eee8d5'}}}%%
flowchart TD
    S["stub\n— empty DRAFT block —"]
    D["draft\ncontent inside DRAFT block"]
    R["review\nDRAFT markers removed"]
    C["complete\npublished"]

    S --> D --> R --> C

    style S fill:#eeeeee,stroke:#aaa
    style D fill:#fff3cd,stroke:#aaa
    style R fill:#d1ecf1,stroke:#aaa
    style C fill:#d4edda,stroke:#aaa
```

---

## 12. RPA Developer Journey

```mermaid

%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#eee8d5', 'primaryTextColor': '#073642', 'primaryBorderColor': '#93a1a1', 'lineColor': '#586e75', 'edgeLabelBackground': '#fdf6e3', 'secondaryColor': '#fdf6e3', 'tertiaryColor': '#eee8d5'}}}%%
journey
    title RPA Developer adopting ConFigTree
    section Discovery
        Hits Dict pain in REFramework: 2: Developer
        Finds ConFigTree: 4: Developer
    section First output
        Drops Config.xlsx: 5: Developer
        Copies CSharp class: 5: Developer
        Pastes XAML snippet: 4: Developer
    section Studio integration
        Adds .cs to Lib/: 3: Developer
        First typed property in workflow: 5: Developer
    section Migration
        Retires first out_Config sheet: 4: Developer
        Fully typed project: 5: Developer
```
