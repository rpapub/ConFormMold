<!-- Getting Started Illustrated -->
<!-- Summary: Screenshot-driven walkthrough of ConFigTree integration in UiPath Studio, captioned from the retake beats. -->

Step-by-step screenshots for the [[Getting Started|Getting-Started]] walkthrough. Captions describe what each screenshot shows; for deeper context on each step see [[Getting Started|Getting-Started]].

> **Note on screenshots.** These shots were captured against `reframework-v24.10.0` with the current default convention (folder `Config`, filename `CodedConfig.cs`).

---

## Generate the C# class and XAML snippet

All work here happens on [configtree.cprima.net](https://configtree.cprima.net/). No installation, no backend — just drop your `Config.xlsx` and download the generated C# and XAML.

![001](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/001_browser_open-configtree-cprima-net-one-page_2880x1620.png)
*Open configtree.cprima.net. One page, no install, no login.*

![002](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/002_browser_the-drop-zone-accepts-the-same_2880x1620.png)
*The drop zone accepts the same `Config.xlsx` you already have.*

![003](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/003_browser_optional-second-angle-on-the-tooltip_2880x1620.png)
*(optional second angle on the tooltip — use if 002 is unclear)*

![004](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/004_browser_drop-the-file-the-c-tab_2880x1620.png)
*Drop the file — the C# tab is already populated.*

![005](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/005_browser_click-download-the-file-lands-in_2880x1620.png)
*Click Download. The file lands in your Downloads folder.*

![006](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/006_browser_flip-to-the-xaml-tab-and_2880x1620.png)
*Flip to the XAML tab and Copy. The clipboard now holds the loader snippet.*

---

## Where the project lives — optional aside

Context for anyone who wants to see the source, raise an issue, or check progress. Skip if you're only here for the workflow.

![007](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/007_studio_everything-lives-on-github-code-fixtures_2880x1620.png)
*Everything lives on GitHub — code, fixtures, docs.*

![008](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/008_studio_issues-and-discussions-are-public_2880x1620.png)
*Issues and discussions are public.*

![009](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/009_studio_the-readme-points-you-straight-back_2880x1620.png)
*The README points you straight back to the page you just used.*

---

## Start from a clean REFramework project

![010](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/010_studio_start-from-a-fresh-reframework-project_2880x1620.png)
*Start from a fresh REFramework project — nothing special.*

---

## Install UiPath.CodedWorkflows

Required so Studio can compile the `.cs` file alongside the XAML workflows.

![011](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/011_studio_open-manage-packages_2878x1620.png)
*Open Manage Packages.*

![012](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/012_studio_search-the-official-feed-for-uipath_2878x1620.png)
*Search the official feed for `UiPath.CodedWorkflows`.*

![013](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/013_studio_install-studio-can-now-compile-cs_2878x1620.png)
*Install. Studio can now compile `.cs` files inside your project.*

---

## Add CodedConfig.cs to the project

Create a folder, add a code source file, paste the C# class you downloaded.

![014](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/014_studio_right-click-the-project-panel_2880x1620.png)
*Right-click the Project panel.*

![015](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/015_studio_create-lib-folder_600x172.png)
*Name the folder `Config` — or any name your team uses for shared code. (Older screenshot shows `Lib`; convention has since changed to `Config`.)*

![016](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/016_studio_right-click-the-folder-→-add-→_2880x1620.png)
*Right-click the folder → Add → Code Source File.*

![017](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/017_studio_name-code-source-file-config-dot-cs_765x337.png)
*Name the file `CodedConfig.cs` — must match the **Filename** shown in the ConFigTree Settings sidebar. (Older screenshot shows `Config.cs`; convention has since changed.)*

![018](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/018_studio_paste-the-downloaded-c-class-into_2880x1620.png)
*Paste the downloaded C# class into the file. Save.*

---

## Import the namespace in InitAllSettings

Studio needs the namespace from the generated class in the Imports panel before the types resolve.

![019](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/019_studio_open-framework-initallsettings-xaml_2880x1620.png)
*Open `Framework/InitAllSettings.xaml`.*

![020](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/020_studio_open-the-imports-panel_2880x1620.png)
*Open the Imports panel.*

![021](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/021_studio_type-the-namespace-from-the-generated_2880x1620.png)
*Type the namespace from the generated class — `Cpmf.Config` by default. Sometimes UiPath Studio needs the project to be closed and reopened to pick it up.*

![022](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/022_browser_copy-the-xaml-snippet-into-the_2880x1620.png)
*Copy the XAML snippet into the clipboard.*

---

## Paste the XAML snippet

![023](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/023_studio_scroll-to-the-bottom-of-initallsettings_2880x1620.png)
*Scroll to the bottom of InitAllSettings. Ctrl+V. The loader appears.*

---

## Promote `out_ConFigTree` to an Out argument with the right type

The pasted snippet adds `out_ConFigTree` as a local `Object` variable. Promote it to an argument and fix Studio's wrong defaults (Direction=In, Type=Object).

![024](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/024_studio_open-the-variables-panel-note-the_2880x1620.png)
*Open the Variables panel — note the new `out_ConFigTree` variable.*

![025](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/025_studio_right-click-it-→-convert-to-argument_2880x1620.png)
*Right-click it → Convert to Argument. Studio makes it an argument, but (as of today) gets two things wrong…*

![026](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/026_studio_click-the-type-column_2880x1620.png)
*Click the Type column.*

![027](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/027_studio_search-codedconfig-pick-it-from-cpmf_2840x1582.png)
*Search `CodedConfig`. Pick it from `Cpmf.Config`.*

![028](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/028_studio_type-is-now-codedconfig_2880x1620.png)
*Type is now `CodedConfig`.*

![029](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/029_studio_flip-it-to-out-two-down_2880x1620.png)
*Flip it to `Out`. Two down.*

---

## Wire the argument through Main.xaml

Find every caller of InitAllSettings and thread the new argument through each `InvokeWorkflowFile`.

![030](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/030_studio_right-click-initallsettings-→-find-references-studio_2880x1620.png)
*Right-click InitAllSettings → Find References. Studio lists everywhere it's invoked.*

![031](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/031_studio_on-the-invokeworkflowfile-click-import-arguments_2880x1620.png)
*On the InvokeWorkflowFile, click Import Arguments to pick up the new one.*

![032](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/032_studio_add-a-configtree-variable-type-codedconfig_1050x347.png)
*Add a `ConFigTree` variable, type `CodedConfig`. Map it to the out argument.*

![033](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/033_studio_ensure-the-variable-is-scoped-at_2880x1620.png)
*Ensure the variable is scoped at the level like the others.*

![034](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/034_studio_confirm-the-namespace-is-listed-in_2880x1620.png)
*Confirm the namespace is listed in Main's Imports panel.*

---

## Pass the config into Process.xaml

Process.xaml is where the business logic lives — give it the typed config as an `In` argument.

![035](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/035_studio_open-process-xaml-the-file-where_2880x1620.png)
*Open Process.xaml — the file where the actual work happens.*

![036](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/036_studio_add-an-in_configtree-argument-direction-in_2880x1620.png)
*Add an `in_ConFigTree` argument, direction `In`, type `CodedConfig`.*

![037](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/037_studio_process-xaml-is-not-prepared-to_2880x1620.png)
*`Process.xaml` is not prepared to use the CodedConfig.*

![038](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/038_studio_back-to-main-find-process-s_2880x1620.png)
*Back to Main. Find Process's InvokeWorkflowFile.*

![039](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/039_studio_use-the-project-panel-to-find_2880x1620.png)
*Use the Project panel to find the references of `Process.xaml`.*

![040](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/040_studio_click-import-arguments-to-pick-up_2880x1620.png)
*Click Import Arguments to pick up the new one.*

![041](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/041_studio_set-the-already-created-variable-configtree-to_1050x300.png)
*Set the already-created variable `ConFigTree` to be passed into `Process.xaml`.*

![042](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/042_studio_process-xaml-now-has-the-typed_2880x1620.png)
*Process.xaml now has the typed config. Autocomplete works. Types are enforced.*

---

## Migrate dictionary lookups to typed access

With the typed config wired in, replace dictionary lookups step by step. IntelliSense guides you; types are enforced at Verify Project time.

![043](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/043_studio_replace-in_config-maxretries-tostring-with-in_configtree_1438x262.png)
*Replace `in_Config("MaxRetries").ToString` with `in_ConFigTree.Settings.MaxRetries`. Typo-proof, refactor-safe, production-ready.*

![044](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/044_studio_search-in-the-project-for-an_1500x675.png)
*Search in the project for an existing config item, like `maxConsecutiveSystemExceptions`.*

![045](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/045_studio_identify-a-nested-casted-use-of_1500x675.png)
*Identify a nested casted use of a config item.*

![046](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/046_studio_type-the-name-of-the-coded_1500x675.png)
*Type the name of the coded config variable, followed by a dot, and watch its sections appear.*

![047](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/047_studio_select-constants-like-the-sheet-name_1500x675.png)
*Select `Constants`, like the sheet name in REFramework's `Config.xlsx`.*

![048](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/048_studio_type-a-dot-and-watch-the_1500x675.png)
*Type a dot and watch the properties appear.*

![049](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/049_studio_identify-the-config-item-by-the_1500x675.png)
*Identify the config item by the property name.*

![050](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/050_studio_this-is-guaranteed-to-be-an_1500x675.png)
*This is guaranteed to be an Integer.*

![051](https://raw.githubusercontent.com/rpapub/ConFigTree/main/docs/images/getting-started/051_studio_also-replace-the-other-use-of_2880x1620.png)
*Also replace the other use of the config item.*
