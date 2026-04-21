<!-- Home -->
<!-- Summary: Public landing page for ConFigTree with a short product pitch and links into the user-facing docs. -->

**Drop the Dict! Your Config deserves better.**

ConFigTree is a browser-based tool that generates typed C# configuration classes from structured data files (Excel, JSON, TOML, YAML) for use in UiPath REFramework projects.

Use it when you want configuration that is explicit, typed, and easier to keep in sync with your REFramework project.

![Drag a Config.xlsx onto configtree.cprima.net and get a typed CodedConfig class](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/features/REFrameworkConfigDragDropConfigtree.gif)

## Benefits

![Typed IntelliSense autocomplete for CodedConfig in UiPath Studio](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/features/CodedConfig-Intellisense-Typed-Autocomplete.png)

1. It was never so easy to navigate your configuration!

![Studio flags a missing config property at compile time](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/features/CodedConfig-Compile-Missing-Config-Item-Flagged-in-Studio.png)

2. If you keep .xlsx and CodedConfig in sync, then you will catch missing config items early!

![Studio blocks publish when the project has validation errors](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/features/CodedConfig-Packaging-Error-Dialog.png)

3. Even your CI/CD pipeline will not publish a broken package!

## Start Here

- [[Getting Started|Getting-Started]] — generate your first typed config
- [[Excel Format|Excel-Format]] — understand the `.xlsx` contract
- [[TOML Format|TOML-Format]] — use TOML as an alternative input format
- [[XAML Snippet|XAML-Snippet]] — paste the generated loader into UiPath Studio

## Learn More

- [[Migration (Dual Mode)|Migration-Dual-Mode]] — keep dictionary and typed config side by side while migrating
- [[REFramework Configuration|REFramework-Config-Pain-and-Coded-Config-to-the-Rescue]] — how CodedConfig fits into REFramework
- [[Configuration]] — generator settings and feature toggles

## Live Tool

[![screenshot of the webpage with all data safely remaining in your borwser](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/001_browser_open-configtree-cprima-net-one-page_2880x1620.png)](https://configtree.cprima.net/)

👉 [configtree.cprima.net](https://configtree.cprima.net/)

## Your Journey Ahead

```mermaid

%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#eee8d5', 'primaryTextColor': '#073642', 'primaryBorderColor': '#93a1a1', 'lineColor': '#586e75', 'edgeLabelBackground': '#fdf6e3', 'secondaryColor': '#fdf6e3', 'tertiaryColor': '#eee8d5'}}}%%
journey
    title RPA Developer adopting ConFigTree
    section Discovery
        Hits Dict pain in REFramework: 2: Developer
        Finds ConFigTree: 4: Developer
    section First output
        Drops Config.xlsx: 3: Developer
        Copies CSharp class: 3: Developer
        Pastes XAML snippet: 4: Developer
    section Studio integration
        Adds .cs to Config/: 3: Developer
        First typed property in workflow: 5: Developer
    section Migration
        Uses both old and new config: 4: Developer
        Retires Config dictioanry: 5: Developer
```
