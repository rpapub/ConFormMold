<!-- Getting Started Illustrated -->
<!-- Summary: Screenshot-driven walkthrough that shows the browser workflow and the UiPath Studio steps for installing typed config. -->

Step-by-step screenshots for the [[Getting Started|Getting-Started]] walkthrough.

> **Note on screenshots.** The studio screenshots were captured with the earlier default convention (folder `Lib`, filename `Config.cs`). Current defaults are folder `Config` and filename `CodedConfig.cs` — the captions reflect the current convention even when the underlying screenshot still shows the earlier name.

---

## Generate the class and snippet — browser

![Drop zone empty — browse or drop your Config.xlsx](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_001_browser_open-configtree-cprima-net-one-page_2880x1620.png)
*Open configtree.cprima.net. The drop zone accepts any Config.xlsx.*

![Copy tooltip on the drop zone](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_002_browser_the-drop-zone-accepts-the-same_2880x1620.png)
*The Copy button is available before and after loading a file.*

![C# tab showing the generated class](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_004_browser_drop-the-file-the-c-tab_2880x1620.png)
*The C# tab shows the generated class. Click Download to save it as CodedConfig.cs.*

![Browser Downloads panel — file saved](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_005_browser_click-download-the-file-lands-in_2880x1620.png)
*The browser's Downloads panel confirms the file was saved.*

![XAML tab with snippet and Copy button](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_006_browser_flip-to-the-xaml-tab-and_2880x1620.png)
*Switch to the XAML tab and click Copy — the snippet is now on the clipboard.*

---

## Prerequisites — a standard REFramework project

![Begin with a standard REFramework project](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_010_studio_start-from-a-fresh-reframework-project_2880x1620.png)
*Start from an unmodified REFramework project opened in UiPath Studio.*

---

## Install UiPath.CodedWorkflows

![Open Manage Packages](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_011_studio_open-manage-packages_2878x1620.png)
*Open Manage Packages from the Studio toolbar.*

![Search for the coded activities package](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_012_studio_search-the-official-feed-for-uipath_2878x1620.png)
*Search for `UiPath.CodedWorkflows` on the official feed.*

![Install the package](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_013_studio_install-studio-can-now-compile-cs_2878x1620.png)
*Install the package. This enables coded source files (.cs) in the project.*

---

## Add CodedConfig.cs to the project

![Right-click the Project panel](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_014_studio_right-click-the-project-panel_2880x1620.png)
*Right-click the Project panel to add a new folder.*

![Create the Lib folder](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_015_studio_create-lib-folder_600x172.png)
*Name the folder `Config` — or any name your team uses for shared code.*

![Add a code source file](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_016_studio_right-click-the-folder-→-add-→_2880x1620.png)
*Right-click the folder and choose Add > Code Source File.*

![Name the file CodedConfig.cs](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_017_studio_name-code-source-file-config-dot-cs_765x337.png)
*Name the file `CodedConfig.cs` (must match the filename in the ConFigTree Settings sidebar).*

![Paste the generated C# class](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_018_studio_paste-the-downloaded-c-class-into_2880x1620.png)
*Replace the file contents with the generated C# class copied from configtree.cprima.net.*

---

## Import the namespace in InitAllSettings

![Open InitAllSettings](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_019_studio_open-framework-initallsettings-xaml_2880x1620.png)
*Open `Framework/InitAllSettings.xaml`.*

![Open the Imports panel](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_020_studio_open-the-imports-panel_2880x1620.png)
*Open the Imports panel at the bottom of the Studio window.*

![Add the namespace](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_021_studio_type-the-namespace-from-the-generated_2880x1620.png)
*Type the namespace from the generated class — default is `Cpmf.Config`.*

![Namespace added](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_022_browser_copy-the-xaml-snippet-into-the_2880x1620.png)
*The namespace appears in the list. Studio now resolves `CodedConfig` from the .cs file.*

---

## Paste the XAML snippet

![Paste the XAML snippet at the end of the workflow](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_023_studio_scroll-to-the-bottom-of-initallsettings_2880x1620.png)
*Scroll to the bottom of InitAllSettings, click after the last activity, and press Ctrl+V to paste the snippet from the XAML tab on configtree.cprima.net.*

---

## Fix the variable — convert to argument and set the correct type

![Open the Variables panel](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_024_studio_open-the-variables-panel-note-the_2880x1620.png)
*Open the Variables panel. The pasted snippet added `out_ConFigTree` as a local variable.*

![Convert variable to argument](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_025_studio_right-click-it-→-convert-to-argument_2880x1620.png)
*Right-click `out_ConFigTree` and choose Convert to Argument.*

![Open the Arguments panel](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started_studio_026_open-arguments-panel_1920x1080.png)
*Switch to the Arguments panel to fix the direction and type.*

![Click the DataType to change it](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_026_studio_click-the-type-column_2880x1620.png)
*Click the DataType cell for `out_ConFigTree` — Studio generated `Object`, which needs to change.*

![Search for CodedConfig](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_027_studio_search-codedconfig-pick-it-from-cpmf_2840x1582.png)
*Type `CodedConfig` in the Browse and Select .NET Type dialog.*

![Confirm the type is CodedConfig](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_028_studio_type-is-now-codedconfig_2880x1620.png)
*Select `CodedConfig` from the `Cpmf.Config` namespace.*

![Click Direction to change it](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started_studio_030_click-direction-of-argument-to-change_1920x1080.png)
*Click the Direction cell — Studio generated `In`, which needs to change to `Out`.*

![Confirm direction is Out](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_029_studio_flip-it-to-out-two-down_2880x1620.png)
*Set direction to `Out`.*

![Save InitAllSettings](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started_studio_032_save-InitAllSettings_1920x1080.png)
*Save the workflow (Ctrl+S).*

---

## Wire up the argument in Main.xaml

![Find references of InitAllSettings](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_030_studio_right-click-initallsettings-→-find-references-studio_2880x1620.png)
*Right-click InitAllSettings.xaml in the Project panel and choose Find References.*

![Identify the reference in Main.xaml](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started_studio_034_identify-InitAllSettings-references-standard-REFramework-in-Main-dot-xaml_1920x1080.png)
*The reference is in `Main.xaml`. Open it.*

![Import updated arguments](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_031_studio_on-the-invokeworkflowfile-click-import-arguments_2880x1620.png)
*On the InvokeWorkflowFile activity for InitAllSettings, click Import Arguments to pull in the new `out_ConFigTree` argument.*

![Create a Main.xaml variable of type CodedConfig](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_032_studio_add-a-configtree-variable-type-codedconfig_1050x347.png)
*Create a variable `v_ConFigTree` of type `CodedConfig` in Main.xaml's Variables panel and map it to `out_ConFigTree`.*

![Verify the namespace is imported in Main.xaml](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_034_studio_confirm-the-namespace-is-listed-in_2880x1620.png)
*Confirm `Cpmf.Config` is in the Imports panel of Main.xaml.*

---

## Pass the config into Process.xaml

![Open Process.xaml](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_036_studio_add-an-in_configtree-argument-direction-in_2880x1620.png)
*Open `Framework/Process.xaml`.*

![Create an In argument for the config](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_037_studio_process-xaml-is-not-prepared-to_2880x1620.png)
*Add an `In` argument named `in_ConFigTree` of type `CodedConfig` to Process.xaml.*

![Find references of Process.xaml in Main.xaml](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_038_studio_back-to-main-find-process-s_2880x1620.png)
*Find references of Process.xaml — the InvokeWorkflowFile is in Main.xaml.*

![Add the ConFigTree argument to the InvokeWorkflow](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_040_studio_click-import-arguments-to-pick-up_2880x1620.png)
*On the InvokeWorkflowFile for Process, map `in_ConFigTree` to `v_ConFigTree`.*

![Process.xaml now has access to the coded config](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_042_studio_process-xaml-now-has-the-typed_2880x1620.png)
*Process.xaml can now use `in_ConFigTree` with full type safety and IntelliSense.*

---

## Use the typed config — or migrate gradually

![Replace or run in parallel with the Config dictionary](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/retakes/getting-started_043_studio_replace-in_config-maxretries-tostring-with-in_configtree_1438x262.png)
*Use `in_ConFigTree.Settings.QueueName` (typed, IntelliSense) alongside or instead of `in_Config("Settings_QueueName")` (string key lookup). Both work in the same workflow during migration.*

---

## Retake additions (slot into story)

12 new retake shots without a paired original in the previous revision.
Row numbers reference positions in `tmp/image-comparison/comparison.md`; rearrange into the narrative as needed.

### R#037 — seq 033

![](../images/retakes/getting-started_033_studio_ensure-the-variable-is-scoped-at_2880x1620.png)

*Ensure the variable is scoped at the level like the others.*

### R#039 — seq 035

![](../images/retakes/getting-started_035_studio_open-process-xaml-the-file-where_2880x1620.png)

*"Open Process.xaml — the file where the actual work happens."*

### R#043 — seq 039

![](../images/retakes/getting-started_039_studio_use-the-project-panel-to-find_2880x1620.png)

*Use the Project panel to find the references of `Process.xaml`.*

### R#045 — seq 041

![](../images/retakes/getting-started_041_studio_set-the-already-created-variable-configtree-to_1050x300.png)

*Set the already-created variable `ConFigTree` to be passed into `Process.xaml`.*

### R#049 — seq 044

![](../images/retakes/getting-started_044_studio_search-in-the-project-for-an_1500x675.png)

*Search in the project for an existing config item, like `maxConsecutiveSystemExceptions`.*

### R#050 — seq 045

![](../images/retakes/getting-started_045_studio_identify-a-nested-casted-use-of_1500x675.png)

*Identify a nested casted use of a config item.*

### R#051 — seq 046

![](../images/retakes/getting-started_046_studio_type-the-name-of-the-coded_1500x675.png)

*Type the name of the coded config variable, followed by a dot, and watch its sections appear.*

### R#052 — seq 047

![](../images/retakes/getting-started_047_studio_select-constants-like-the-sheet-name_1500x675.png)

*Select `Constants`, like the sheet name in REFramework's `Config.xlsx`.*

### R#053 — seq 048

![](../images/retakes/getting-started_048_studio_type-a-dot-and-watch-the_1500x675.png)

*Type a dot and watch the properties appear.*

### R#054 — seq 049

![](../images/retakes/getting-started_049_studio_identify-the-config-item-by-the_1500x675.png)

*Identify the config item by the property name.*

### R#055 — seq 050

![](../images/retakes/getting-started_050_studio_this-is-guaranteed-to-be-an_1500x675.png)

*This is guaranteed to be an Integer.*

### R#056 — seq 051

![](../images/retakes/getting-started_051_studio_also-replace-the-other-use-of_2880x1620.png)

*Also replace the other use of the config item.*

