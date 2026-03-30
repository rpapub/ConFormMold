# Getting Started — Illustrated

Step-by-step screenshots for the [[Getting Started|Getting-Started]] walkthrough.

---

## Generate the class and snippet — browser

![Drop zone empty — browse or drop your Config.xlsx](../images/getting-started_browser_001_drop-zone-empty_3072x1620.png)
*Open configtree.cprima.net. The drop zone accepts any Config.xlsx.*

![Copy tooltip on the drop zone](../images/getting-started_browser_002_drop-zone-copy-tooltip_3072x1620.png)
*The Copy button is available before and after loading a file.*

![C# tab showing the generated class](../images/getting-started_browser_004_xcsharp-tab-generated-snippet_3072x1620.png)
*The C# tab shows the generated class. Click Download to save it as Config.cs.*

![Browser Downloads panel — file saved](../images/getting-started_browser_005_cs-tab-browser-download-dialog-saved_3072x1620.png)
*The browser's Downloads panel confirms the file was saved.*

![XAML tab with snippet and Copy button](../images/getting-started_browser_006_xaml-tab-snippet-copied_3072x1620.png)
*Switch to the XAML tab and click Copy — the snippet is now on the clipboard.*

---

## Prerequisites — a standard REFramework project

![Begin with a standard REFramework project](../images/getting-started_studio_010_begin-with-a-standard-REFramework_1920x1080.png)
*Start from an unmodified REFramework project opened in UiPath Studio.*

---

## Install UiPath.CodedWorkflows

![Open Manage Packages](../images/getting-started_studio_011_open-manage-packages_1536x960.png)
*Open Manage Packages from the Studio toolbar.*

![Search for the coded activities package](../images/getting-started_studio_012_search-coded-activities-package-from-official-feed_1536x960.png)
*Search for `UiPath.CodedWorkflows` on the official feed.*

![Install the package](../images/getting-started_studio_013_install-coded-activities-package-from-official-feed_1536x960.png)
*Install the package. This enables coded source files (.cs) in the project.*

---

## Add Config.cs to the project

![Right-click the Project panel](../images/getting-started_studio_014_right-click-the-project-panel_1920x1080.png)
*Right-click the Project panel to add a new folder.*

![Create the Lib folder](../images/getting-started_studio_015_create-lib-folder_600x172.png)
*Name the folder `Lib` — or any name your team uses for shared code.*

![Add a code source file](../images/getting-started_studio_016_add-code-source-file_1920x1080.png)
*Right-click the folder and choose Add > Code Source File.*

![Name the file Config.cs](../images/getting-started_studio_017_name-code-source-file-config-dot-cs_765x337.png)
*Name the file `Config.cs` (must match the filename in the ConFigTree Settings sidebar).*

![Paste the generated C# class](../images/getting-started_studio_018_paste-from-configtree-dot-cprima-dot-net_1920x1080.png)
*Replace the file contents with the generated C# class copied from configtree.cprima.net.*

---

## Import the namespace in InitAllSettings

![Open InitAllSettings](../images/getting-started_studio_019_open-InitAllSettings_1920x1080.png)
*Open `Framework/InitAllSettings.xaml`.*

![Open the Imports panel](../images/getting-started_studio_020_open-namespace-panel_1920x1080.png)
*Open the Imports panel at the bottom of the Studio window.*

![Add the namespace](../images/getting-started_studio_021_add-namespace-from-cs-file_1920x1080.png)
*Type the namespace from the generated class — default is `Cpmf.Config`.*

![Namespace added](../images/getting-started_studio_022_namespace-is-added_1920x1080.png)
*The namespace appears in the list. Studio now resolves `CodedConfig` from the .cs file.*

---

## Paste the XAML snippet

![Paste the XAML snippet at the end of the workflow](../images/getting-started_studio_023_paste-xaml-snippet-at-end-of-workflow-from-configtree-dot-cprima-dot-net_1920x1080.png)
*Scroll to the bottom of InitAllSettings, click after the last activity, and press Ctrl+V to paste the snippet from the XAML tab on configtree.cprima.net.*

---

## Fix the variable — convert to argument and set the correct type

![Open the Variables panel](../images/getting-started_studio_024_open-variables-panel_1920x1080.png)
*Open the Variables panel. The pasted snippet added `out_ConFigTree` as a local variable.*

![Convert variable to argument](../images/getting-started_studio_025_convert-variable-to-argument_1920x1080.png)
*Right-click `out_ConFigTree` and choose Convert to Argument.*

![Open the Arguments panel](../images/getting-started_studio_026_open-arguments-panel_1920x1080.png)
*Switch to the Arguments panel to fix the direction and type.*

![Click the DataType to change it](../images/getting-started_studio_027_click-datatype-of-argument-to-change_1920x1080.png)
*Click the DataType cell for `out_ConFigTree` — Studio generated `Object`, which needs to change.*

![Search for CodedConfig](../images/getting-started_studio_028_search-datatype-CodedConfig_1920x1080.png)
*Type `CodedConfig` in the Browse and Select .NET Type dialog.*

![Confirm the type is CodedConfig](../images/getting-started_studio_029_check-argument-has-datatype-CodedConfig_1920x1080.png)
*Select `CodedConfig` from the `Cpmf.Config` namespace.*

![Click Direction to change it](../images/getting-started_studio_030_click-direction-of-argument-to-change_1920x1080.png)
*Click the Direction cell — Studio generated `In`, which needs to change to `Out`.*

![Confirm direction is Out](../images/getting-started_studio_031_check-argument-direction-is-out_1920x1080.png)
*Set direction to `Out`.*

![Save InitAllSettings](../images/getting-started_studio_032_save-InitAllSettings_1920x1080.png)
*Save the workflow (Ctrl+S).*

---

## Wire up the argument in Main.xaml

![Find references of InitAllSettings](../images/getting-started_studio_033_use-project-panel-find-refeences-of-file-InitAllSettings_1920x1080.png)
*Right-click InitAllSettings.xaml in the Project panel and choose Find References.*

![Identify the reference in Main.xaml](../images/getting-started_studio_034_identify-InitAllSettings-references-standard-REFramework-in-Main-dot-xaml_1920x1080.png)
*The reference is in `Main.xaml`. Open it.*

![Import updated arguments](../images/getting-started_studio_035_import-updated-arguments-InvokeWorkflow-InitAllSettings_1920x1080.png)
*On the InvokeWorkflowFile activity for InitAllSettings, click Import Arguments to pull in the new `out_ConFigTree` argument.*

![Create a Main.xaml variable of type CodedConfig](../images/getting-started_studio_036_create-main-xaml-variable-ConFigTree-type-CodedConfig_1920x1080.png)
*Create a variable `v_ConFigTree` of type `CodedConfig` in Main.xaml's Variables panel and map it to `out_ConFigTree`.*

![Verify the namespace is imported in Main.xaml](../images/getting-started_studio_037_verify-namespace-from-cs-file-is-imported_1920x1080.png)
*Confirm `Cpmf.Config` is in the Imports panel of Main.xaml.*

---

## Pass the config into Process.xaml

![Open Process.xaml](../images/getting-started_studio_038_open-Process-dot-xaml_1920x1080.png)
*Open `Framework/Process.xaml`.*

![Create an In argument for the config](../images/getting-started_studio_039_create-in-argument-inConfigTree-type-CodedConfig_1920x1080.png)
*Add an `In` argument named `in_ConFigTree` of type `CodedConfig` to Process.xaml.*

![Find references of Process.xaml in Main.xaml](../images/getting-started_studio_040_identify-Process-dot-xaml-references-standard-REFramework-Main-dot-xaml_1920x1080.png)
*Find references of Process.xaml — the InvokeWorkflowFile is in Main.xaml.*

![Add the ConFigTree argument to the InvokeWorkflow](../images/getting-started_studio_041_add-InvokeWorkflow-argument-ConFigTree_1050x370.png)
*On the InvokeWorkflowFile for Process, map `in_ConFigTree` to `v_ConFigTree`.*

![Process.xaml now has access to the coded config](../images/getting-started_studio_042_Process-dot-xaml-now-has-access-to-coded-config_1920x1080.png)
*Process.xaml can now use `in_ConFigTree` with full type safety and IntelliSense.*

---

## Use the typed config — or migrate gradually

![Replace or run in parallel with the Config dictionary](../images/getting-started_studio_043_replace-existing-use-of-Config-dictionary-or-work-in-parallel_1920x1080.png)
*Use `in_ConFigTree.Settings.QueueName` (typed, IntelliSense) alongside or instead of `in_Config("Settings_QueueName")` (string key lookup). Both work in the same workflow during migration.*
