# Adding ConFigTree Assertions to TestCase_InitAllSettings

## Overview

Each REFramework version has two copies of `Tests/TestCase_InitAllSettings.xaml`:

| Folder | State | Invokes `out_ConFigTree` | ConFigTree assertions |
|---|---|---|---|
| `templates/reframework-vXX/` | Pristine REF — expected to **fail** | No | No |
| `projects/reframework-vXX/` | ConFigTree integrated — expected to **pass** | Yes | Yes |

The template TestCase tests that standard config loading (`out_Config`) works.
The project TestCase adds 7 additional assertions that verify the typed ConFigTree object.

---

## What changes between template and project

### 1. `<Activity>` opening tag — add `xmlns:cc`

```xml
xmlns:cc="clr-namespace:Cpmf.Config;assembly=ConFigTree_REF_v25.Core"
```

### 2. `<x:Members>` — add `out_ConFigTree` property

```xml
<x:Property Name="out_ConFigTree" Type="OutArgument(cc:CodedConfig)" />
```

### 3. `TextExpression.NamespacesForImplementation` — add `Cpmf.Config`

```xml
<x:String>Cpmf.Config</x:String>
```

### 4. `TextExpression.ReferencesForImplementation` — add assembly references

```xml
<AssemblyReference>ConFigTree_REF_v25.Core</AssemblyReference>
```

### 5. `InvokeWorkflowFile.Arguments` — add `out_ConFigTree` binding

```xml
<OutArgument x:TypeArguments="cc:CodedConfig" x:Key="out_ConFigTree">[out_ConFigTree]</OutArgument>
```

### 6. `... Then` sequence — add 2 ConFigTree assertions after the 6 existing ones

```xml
<uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + (out_ConFigTree IsNot Nothing).ToString()]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="ConFigTree: object is not Nothing" Expression="[out_ConFigTree IsNot Nothing]" sap:VirtualizedContainerService.HintSize="416,123" sap2010:WorkflowViewState.IdRef="VerifyExpression_7" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
<uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + out_ConFigTree.GetType().Name]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="ConFigTree: type is CodedConfig" Expression="[out_ConFigTree.GetType().Name = &quot;CodedConfig&quot;]" sap:VirtualizedContainerService.HintSize="416,114" sap2010:WorkflowViewState.IdRef="VerifyExpression_8" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
```

### 7. Add `... Then (ConFigTree typed properties)` sequence after `... Then`

```xml
<Sequence DisplayName="... Then (ConFigTree typed properties)" sap:VirtualizedContainerService.HintSize="450,48" sap2010:WorkflowViewState.IdRef="Sequence_5">
  <sap:WorkflowViewStateService.ViewState>
    <scg:Dictionary x:TypeArguments="x:String, x:Object">
      <x:Boolean x:Key="IsExpanded">False</x:Boolean>
      <x:Boolean x:Key="IsPinned">False</x:Boolean>
    </scg:Dictionary>
  </sap:WorkflowViewStateService.ViewState>
  <uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + out_ConFigTree.Settings.FeatureName]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="ConFigTree.Settings.FeatureName = TypesDemo" Expression="[out_ConFigTree.Settings.FeatureName = &quot;TypesDemo&quot;]" sap:VirtualizedContainerService.HintSize="416,123" sap2010:WorkflowViewState.IdRef="VerifyExpression_9" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
  <uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + out_ConFigTree.Settings.MaxItems.ToString()]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="ConFigTree.Settings.MaxItems = 42" Expression="[out_ConFigTree.Settings.MaxItems = 42]" sap:VirtualizedContainerService.HintSize="416,123" sap2010:WorkflowViewState.IdRef="VerifyExpression_10" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
  <uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + out_ConFigTree.Settings.IsEnabled.ToString()]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="ConFigTree.Settings.IsEnabled = True" Expression="[out_ConFigTree.Settings.IsEnabled = True]" sap:VirtualizedContainerService.HintSize="416,123" sap2010:WorkflowViewState.IdRef="VerifyExpression_11" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
  <uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + out_ConFigTree.Constants.MaxRetryNumber.ToString()]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="ConFigTree.Constants.MaxRetryNumber = 0" Expression="[out_ConFigTree.Constants.MaxRetryNumber = 0]" sap:VirtualizedContainerService.HintSize="416,123" sap2010:WorkflowViewState.IdRef="VerifyExpression_12" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
  <uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + out_ConFigTree.Constants.StrictMode.ToString()]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="ConFigTree.Constants.StrictMode = False" Expression="[out_ConFigTree.Constants.StrictMode = False]" sap:VirtualizedContainerService.HintSize="416,123" sap2010:WorkflowViewState.IdRef="VerifyExpression_13" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
</Sequence>
```

---

## Complete project TestCase XAML

All three versions (`v23.10.0`, `v24.10.0`, `v25.0.0`) use the same TestCase XAML.
The only version-sensitive value is the assembly name in `xmlns:cc` and `<AssemblyReference>` — currently `ConFigTree_REF_v25.Core` for all.

### v23.10.0 / v24.10.0 / v25.0.0

```xml
<Activity mc:Ignorable="sap sap2010" x:Class="TestCase_InitAllSettings" this:TestCase_InitAllSettings.in_ConfigFile="Data\Config_Test.xlsx" this:TestCase_InitAllSettings.in_ConfigSheets="[New String() {&quot;Settings&quot;, &quot;Constants&quot;}]" xmlns="http://schemas.microsoft.com/netfx/2009/xaml/activities" xmlns:cc="clr-namespace:Cpmf.Config;assembly=ConFigTree_REF_v25.Core" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:s="clr-namespace:System;assembly=System.Private.CoreLib" xmlns:sap="http://schemas.microsoft.com/netfx/2009/xaml/activities/presentation" xmlns:sap2010="http://schemas.microsoft.com/netfx/2010/xaml/activities/presentation" xmlns:scg="clr-namespace:System.Collections.Generic;assembly=System.Private.CoreLib" xmlns:sco="clr-namespace:System.Collections.ObjectModel;assembly=System.Private.CoreLib" xmlns:this="clr-namespace:" xmlns:ui="http://schemas.uipath.com/workflow/activities" xmlns:uta="clr-namespace:UiPath.Testing.Activities;assembly=UiPath.Testing.Activities" xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
  <x:Members>
    <x:Property Name="in_ConfigFile" Type="InArgument(x:String)" />
    <x:Property Name="in_ConfigSheets" Type="InArgument(s:String[])" />
    <x:Property Name="out_Config" Type="OutArgument(scg:Dictionary(x:String, x:Object))" />
    <x:Property Name="out_ConFigTree" Type="OutArgument(cc:CodedConfig)" />
  </x:Members>
  <VisualBasic.Settings>
    <x:Null />
  </VisualBasic.Settings>
  <sap2010:WorkflowViewState.IdRef>TestCase_InitAllSettings_1</sap2010:WorkflowViewState.IdRef>
  <TextExpression.NamespacesForImplementation>
    <sco:Collection x:TypeArguments="x:String">
      <x:String>System.Activities</x:String>
      <x:String>System.Activities.Statements</x:String>
      <x:String>System.Activities.Expressions</x:String>
      <x:String>System.Activities.Validation</x:String>
      <x:String>System.Activities.XamlIntegration</x:String>
      <x:String>Microsoft.VisualBasic</x:String>
      <x:String>Microsoft.VisualBasic.Activities</x:String>
      <x:String>System</x:String>
      <x:String>System.Collections</x:String>
      <x:String>System.Collections.Generic</x:String>
      <x:String>System.Collections.ObjectModel</x:String>
      <x:String>System.Data</x:String>
      <x:String>System.Diagnostics</x:String>
      <x:String>System.Drawing</x:String>
      <x:String>System.IO</x:String>
      <x:String>System.Linq</x:String>
      <x:String>System.Net.Mail</x:String>
      <x:String>System.Xml</x:String>
      <x:String>System.Xml.Linq</x:String>
      <x:String>UiPath.Core</x:String>
      <x:String>UiPath.Core.Activities</x:String>
      <x:String>System.Windows.Markup</x:String>
      <x:String>GlobalVariablesNamespace</x:String>
      <x:String>GlobalConstantsNamespace</x:String>
      <x:String>System.Runtime.Serialization</x:String>
      <x:String>UiPath.Testing.Activities</x:String>
      <x:String>UiPath.Shared.Activities</x:String>
      <x:String>System.Reflection</x:String>
      <x:String>Cpmf.Config</x:String>
    </sco:Collection>
  </TextExpression.NamespacesForImplementation>
  <TextExpression.ReferencesForImplementation>
    <sco:Collection x:TypeArguments="AssemblyReference">
      <AssemblyReference>Microsoft.VisualBasic</AssemblyReference>
      <AssemblyReference>mscorlib</AssemblyReference>
      <AssemblyReference>System</AssemblyReference>
      <AssemblyReference>System.Activities</AssemblyReference>
      <AssemblyReference>System.ComponentModel.TypeConverter</AssemblyReference>
      <AssemblyReference>System.Core</AssemblyReference>
      <AssemblyReference>System.Data</AssemblyReference>
      <AssemblyReference>System.Data.Common</AssemblyReference>
      <AssemblyReference>System.Data.DataSetExtensions</AssemblyReference>
      <AssemblyReference>System.Drawing</AssemblyReference>
      <AssemblyReference>System.Drawing.Common</AssemblyReference>
      <AssemblyReference>System.Drawing.Primitives</AssemblyReference>
      <AssemblyReference>System.Linq</AssemblyReference>
      <AssemblyReference>System.Net.Mail</AssemblyReference>
      <AssemblyReference>System.ObjectModel</AssemblyReference>
      <AssemblyReference>System.Private.CoreLib</AssemblyReference>
      <AssemblyReference>System.Xaml</AssemblyReference>
      <AssemblyReference>System.Xml</AssemblyReference>
      <AssemblyReference>System.Xml.Linq</AssemblyReference>
      <AssemblyReference>UiPath.System.Activities</AssemblyReference>
      <AssemblyReference>UiPath.UiAutomation.Activities</AssemblyReference>
      <AssemblyReference>UiPath.Studio.Constants</AssemblyReference>
      <AssemblyReference>System.Private.ServiceModel</AssemblyReference>
      <AssemblyReference>System.Private.DataContractSerialization</AssemblyReference>
      <AssemblyReference>System.Runtime.Serialization.Formatters</AssemblyReference>
      <AssemblyReference>System.Runtime.Serialization.Primitives</AssemblyReference>
      <AssemblyReference>UiPath.Testing.Activities</AssemblyReference>
      <AssemblyReference>UiPath.OCR.Activities</AssemblyReference>
      <AssemblyReference>UiPath.UIAutomationCore</AssemblyReference>
      <AssemblyReference>UiPath.Excel.Activities</AssemblyReference>
      <AssemblyReference>System.Reflection.DispatchProxy</AssemblyReference>
      <AssemblyReference>System.Reflection.TypeExtensions</AssemblyReference>
      <AssemblyReference>System.Reflection.Metadata</AssemblyReference>
      <AssemblyReference>ConFigTree_REF_v25.Core</AssemblyReference>
    </sco:Collection>
  </TextExpression.ReferencesForImplementation>
  <Sequence DisplayName="TestCase_InitAllSettings" sap:VirtualizedContainerService.HintSize="577,989.6566666666666" sap2010:WorkflowViewState.IdRef="Sequence_1">
    <sap:WorkflowViewStateService.ViewState>
      <scg:Dictionary x:TypeArguments="x:String, x:Object">
        <x:Boolean x:Key="IsExpanded">True</x:Boolean>
      </scg:Dictionary>
    </sap:WorkflowViewStateService.ViewState>
    <Sequence DisplayName="... Given" sap:VirtualizedContainerService.HintSize="450,122" sap2010:WorkflowViewState.IdRef="Sequence_2">
      <sap:WorkflowViewStateService.ViewState>
        <scg:Dictionary x:TypeArguments="x:String, x:Object">
          <x:Boolean x:Key="IsExpanded">True</x:Boolean>
        </scg:Dictionary>
      </sap:WorkflowViewStateService.ViewState>
    </Sequence>
    <Sequence DisplayName="... When" sap:VirtualizedContainerService.HintSize="450,260" sap2010:WorkflowViewState.IdRef="Sequence_3">
      <sap:WorkflowViewStateService.ViewState>
        <scg:Dictionary x:TypeArguments="x:String, x:Object">
          <x:Boolean x:Key="IsExpanded">True</x:Boolean>
        </scg:Dictionary>
      </sap:WorkflowViewStateService.ViewState>
      <ui:InvokeWorkflowFile ArgumentsVariable="{x:Null}" ContinueOnError="{x:Null}" DisplayName="InitAllSettings - Invoke Workflow File (Framework\InitAllSettings.xaml)" sap:VirtualizedContainerService.HintSize="416,168" sap2010:WorkflowViewState.IdRef="InvokeWorkflowFile_1" UnSafe="False" WorkflowFileName="Framework\InitAllSettings.xaml">
        <ui:InvokeWorkflowFile.Arguments>
          <InArgument x:TypeArguments="x:String" x:Key="in_ConfigFile">[in_ConfigFile]</InArgument>
          <InArgument x:TypeArguments="s:String[]" x:Key="in_ConfigSheets">[in_ConfigSheets]</InArgument>
          <OutArgument x:TypeArguments="scg:Dictionary(x:String, x:Object)" x:Key="out_Config">[out_Config]</OutArgument>
          <OutArgument x:TypeArguments="cc:CodedConfig" x:Key="out_ConFigTree">[out_ConFigTree]</OutArgument>
        </ui:InvokeWorkflowFile.Arguments>
      </ui:InvokeWorkflowFile>
    </Sequence>
    <Sequence DisplayName="... Then" sap:VirtualizedContainerService.HintSize="450,48" sap2010:WorkflowViewState.IdRef="Sequence_4">
      <sap:WorkflowViewStateService.ViewState>
        <scg:Dictionary x:TypeArguments="x:String, x:Object">
          <x:Boolean x:Key="IsExpanded">False</x:Boolean>
          <x:Boolean x:Key="IsPinned">False</x:Boolean>
        </scg:Dictionary>
      </sap:WorkflowViewStateService.ViewState>
      <uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + (out_Config IsNot Nothing).ToString()]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="Config is not Nothing" Expression="[out_Config IsNot Nothing]" sap:VirtualizedContainerService.HintSize="416,123" sap2010:WorkflowViewState.IdRef="VerifyExpression_1" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
      <uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + out_Config(&quot;FeatureName&quot;).ToString()]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="Settings: FeatureName = TypesDemo" Expression="[out_Config(&quot;FeatureName&quot;).ToString() = &quot;TypesDemo&quot;]" sap:VirtualizedContainerService.HintSize="416,123" sap2010:WorkflowViewState.IdRef="VerifyExpression_2" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
      <uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + CDbl(out_Config(&quot;MaxItems&quot;)).ToString()]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="Settings: MaxItems = 42" Expression="[CDbl(out_Config(&quot;MaxItems&quot;)) = 42]" sap:VirtualizedContainerService.HintSize="416,123" sap2010:WorkflowViewState.IdRef="VerifyExpression_3" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
      <uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + CBool(out_Config(&quot;IsEnabled&quot;)).ToString()]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="Settings: IsEnabled = True" Expression="[CBool(out_Config(&quot;IsEnabled&quot;)) = True]" sap:VirtualizedContainerService.HintSize="416,123" sap2010:WorkflowViewState.IdRef="VerifyExpression_4" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
      <uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + CDbl(out_Config(&quot;MaxRetryNumber&quot;)).ToString()]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="Constants: MaxRetryNumber = 0" Expression="[CDbl(out_Config(&quot;MaxRetryNumber&quot;)) = 0]" sap:VirtualizedContainerService.HintSize="416,123" sap2010:WorkflowViewState.IdRef="VerifyExpression_5" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
      <uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + CBool(out_Config(&quot;StrictMode&quot;)).ToString()]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="Constants: StrictMode = False" Expression="[CBool(out_Config(&quot;StrictMode&quot;)) = False]" sap:VirtualizedContainerService.HintSize="416,123" sap2010:WorkflowViewState.IdRef="VerifyExpression_6" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
      <uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + (out_ConFigTree IsNot Nothing).ToString()]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="ConFigTree: object is not Nothing" Expression="[out_ConFigTree IsNot Nothing]" sap:VirtualizedContainerService.HintSize="416,123" sap2010:WorkflowViewState.IdRef="VerifyExpression_7" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
      <uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + out_ConFigTree.GetType().Name]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="ConFigTree: type is CodedConfig" Expression="[out_ConFigTree.GetType().Name = &quot;CodedConfig&quot;]" sap:VirtualizedContainerService.HintSize="416,114" sap2010:WorkflowViewState.IdRef="VerifyExpression_8" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
    </Sequence>
    <Sequence DisplayName="... Then (ConFigTree typed properties)" sap:VirtualizedContainerService.HintSize="450,48" sap2010:WorkflowViewState.IdRef="Sequence_5">
      <sap:WorkflowViewStateService.ViewState>
        <scg:Dictionary x:TypeArguments="x:String, x:Object">
          <x:Boolean x:Key="IsExpanded">False</x:Boolean>
          <x:Boolean x:Key="IsPinned">False</x:Boolean>
        </scg:Dictionary>
      </sap:WorkflowViewStateService.ViewState>
      <uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + out_ConFigTree.Settings.FeatureName]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="ConFigTree.Settings.FeatureName = TypesDemo" Expression="[out_ConFigTree.Settings.FeatureName = &quot;TypesDemo&quot;]" sap:VirtualizedContainerService.HintSize="416,123" sap2010:WorkflowViewState.IdRef="VerifyExpression_9" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
      <uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + out_ConFigTree.Settings.MaxItems.ToString()]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="ConFigTree.Settings.MaxItems = 42" Expression="[out_ConFigTree.Settings.MaxItems = 42]" sap:VirtualizedContainerService.HintSize="416,123" sap2010:WorkflowViewState.IdRef="VerifyExpression_10" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
      <uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + out_ConFigTree.Settings.IsEnabled.ToString()]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="ConFigTree.Settings.IsEnabled = True" Expression="[out_ConFigTree.Settings.IsEnabled = True]" sap:VirtualizedContainerService.HintSize="416,123" sap2010:WorkflowViewState.IdRef="VerifyExpression_11" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
      <uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + out_ConFigTree.Constants.MaxRetryNumber.ToString()]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="ConFigTree.Constants.MaxRetryNumber = 0" Expression="[out_ConFigTree.Constants.MaxRetryNumber = 0]" sap:VirtualizedContainerService.HintSize="416,123" sap2010:WorkflowViewState.IdRef="VerifyExpression_12" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
      <uta:VerifyExpression AlternativeVerificationTitle="{x:Null}" KeepScreenshots="{x:Null}" OutputMessageFormat="[&quot;actual: &quot; + out_ConFigTree.Constants.StrictMode.ToString()]" Result="{x:Null}" ScreenshotsPath="{x:Null}" ContinueOnFailure="True" DisplayName="ConFigTree.Constants.StrictMode = False" Expression="[out_ConFigTree.Constants.StrictMode = False]" sap:VirtualizedContainerService.HintSize="416,123" sap2010:WorkflowViewState.IdRef="VerifyExpression_13" TakeScreenshotInCaseOfFailingAssertion="False" TakeScreenshotInCaseOfSucceedingAssertion="False" />
    </Sequence>
  </Sequence>
</Activity>
```

---

## Assertion summary

| # | DisplayName | Verifies |
|---|---|---|
| 1 | Config is not Nothing | `out_Config` was populated |
| 2 | Settings: FeatureName = TypesDemo | string value |
| 3 | Settings: MaxItems = 42 | numeric value |
| 4 | Settings: IsEnabled = True | boolean value |
| 5 | Constants: MaxRetryNumber = 0 | numeric value |
| 6 | Constants: StrictMode = False | boolean value |
| 7 | ConFigTree: object is not Nothing | `out_ConFigTree` was set |
| 8 | ConFigTree: type is CodedConfig | correct runtime type |
| 9 | ConFigTree.Settings.FeatureName = TypesDemo | typed property access |
| 10 | ConFigTree.Settings.MaxItems = 42 | typed property access |
| 11 | ConFigTree.Settings.IsEnabled = True | typed property access |
| 12 | ConFigTree.Constants.MaxRetryNumber = 0 | typed property access |
| 13 | ConFigTree.Constants.StrictMode = False | typed property access |

Assertions 1–6 pass for both template and project (standard REF config loading).
Assertions 7–13 pass only for the project (require ConFigTree integration in `InitAllSettings.xaml`).
