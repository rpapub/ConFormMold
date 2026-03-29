# Getting Started

<!--
DRAFT

-->

ConFigTree runs entirely in the browser — no installation required.

## 1. Open the tool

Navigate to [configtree.cprima.net](https://configtree.cprima.net/).

## 2. Load a file

Drop an `.xlsx`, `.json`, `.toml`, or `.yaml` file onto the drop zone, or click **Browse or drop file** to open the file picker.

For Excel files, each visible sheet (sheets whose name does not start with `.`) becomes a config section.

## 3. Configure settings

Use the settings sidebar to set:

- **Namespace** — the C# namespace for the generated class
- **Root class** — the name of the top-level config class
- **Filename** — the output filename (without extension)
- **Target .NET** — .NET 6 or .NET 8

Toggle features (XML docs, Loader, ToString, etc.) as needed.

## 4. Generate

Click **Regenerate** or change any setting to update the output.

The **C# class** tab shows the generated `.cs` file. The **XAML snippet** tab shows the UiPath Studio clipboard snippet.

## 5. Copy or download

- **Copy** — copies the active tab's content to the clipboard
- **Download** — saves the file (`.cs` or `.xaml` depending on the active tab)

See [[XAML Snippet|XAML-Snippet]] for how to paste into UiPath Studio.
