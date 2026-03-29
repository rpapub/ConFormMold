// --- UiPath clipboard snippet (#28) ---
//
// Fixes #44: XAML template is embedded verbatim from the validated reference file,
// not constructed attribute-by-attribute. Only {{CLASSNAME}} and {{VARNAME}} are substituted.
//
// Template source (read-only reference):
//   test/templates/reframework-v25.0.0/Framework/InitAllSettings.xaml
//   ReadRange at line 128, outer ForEach at line 111
//
// Namespace adaptation: default-ns activities → p: prefix (clipboard convention);
//   sd: and scg: prefixes added as required by ClipboardData envelope.

// prettier-ignore
const XAML_CONFIGT_REF_TEMPLATE =
  `<p:Sequence x:Name="__ReferenceID0" DisplayName="{{VARNAME}}" sap2010:Annotation.AnnotationText="{{VARNAME}} typed config loader&#xD;&#xA;@see https://rpapub.github.io/ConFigTree/">` +
  `<p:Sequence.Variables>` +
    `<p:Variable x:TypeArguments="scg:Dictionary(x:String, sd:DataTable)" Name="dt_Tables" />` +
    `<p:Variable x:TypeArguments="x:Object" Name="{{VARNAME}}" />` +
  `</p:Sequence.Variables>` +
  `<p:Assign DisplayName="Initialize dt_Tables">` +
    `<p:Assign.To><p:OutArgument x:TypeArguments="scg:Dictionary(x:String, sd:DataTable)">[dt_Tables]</p:OutArgument></p:Assign.To>` +
    `<p:Assign.Value><p:InArgument x:TypeArguments="scg:Dictionary(x:String, sd:DataTable)">[New Dictionary(Of String, DataTable)]</p:InArgument></p:Assign.Value>` +
  `</p:Assign>` +
  `<ui:ForEach x:TypeArguments="x:String" CurrentIndex="{x:Null}" DisplayName="For each sheet — ReadRange into dt_Tables" Values="[in_ConfigSheets]">` +
    `<ui:ForEach.Body><p:ActivityAction x:TypeArguments="x:String">` +
      `<p:ActivityAction.Argument><p:DelegateInArgument x:TypeArguments="x:String" Name="Sheet" /></p:ActivityAction.Argument>` +
      `<p:Sequence DisplayName="Read sheet into dt_Tables">` +
        `<p:Sequence.Variables><p:Variable x:TypeArguments="sd:DataTable" Name="dt_CurrentSheet" /></p:Sequence.Variables>` +
        `<ui:ReadRange AddHeaders="True" SheetName="[Sheet]" WorkbookPath="[in_ConfigFile]" DataTable="[dt_CurrentSheet]" Range="{x:Null}" />` +
        `<p:Assign DisplayName="Add sheet to dt_Tables">` +
          `<p:Assign.To><p:OutArgument x:TypeArguments="sd:DataTable">[dt_Tables(Sheet)]</p:OutArgument></p:Assign.To>` +
          `<p:Assign.Value><p:InArgument x:TypeArguments="sd:DataTable">[dt_CurrentSheet]</p:InArgument></p:Assign.Value>` +
        `</p:Assign>` +
      `</p:Sequence>` +
    `</p:ActivityAction></ui:ForEach.Body>` +
  `</ui:ForEach>` +
  `<p:Assign DisplayName="Load ConFigTree">` +
    `<p:Assign.To><p:OutArgument x:TypeArguments="x:Object">[{{VARNAME}}]</p:OutArgument></p:Assign.To>` +
    `<p:Assign.Value><p:InArgument x:TypeArguments="x:Object">[{{CLASSNAME}}.Load(dt_Tables)]</p:InArgument></p:Assign.Value>` +
  `</p:Assign>` +
  `</p:Sequence>`;

function generateXamlSnippet(nodes = []) {
  const className = config.rootClassName || "AppConfig";
  const varName   = config.uipathVariableName || "out_ConFigTree";
  const fmt       = lastSourceFormat ?? "xlsx";

  // Non-xlsx formats: simple Assign with the format-specific Load method
  if (fmt !== "xlsx") {
    const methodName = fmt === "json" ? "LoadJson" : fmt === "toml" ? "LoadToml" : "LoadYaml";
    return xamlEnvelope(
      [xamlAssign("__ReferenceID0", varName, `${className}.${methodName}(in_ConfigFilePath)`)],
      ["__ReferenceID0"]
    );
  }

  // xlsx without the loader toggle: minimal single Assign
  if (!config.generateLoader) {
    return xamlEnvelope(
      [xamlAssign("__ReferenceID0", varName, `${className}.Load(tables)`)],
      ["__ReferenceID0"]
    );
  }

  // xlsx + loader: substitute tokens into verbatim template (fixes #44)
  const assetSheetNames = (nodes || [])
    .filter(n => n.isAssetSheet && n.properties.length > 0)
    .map(n => n.name);

  let body = XAML_CONFIGT_REF_TEMPLATE
    .replaceAll("{{CLASSNAME}}", className)
    .replaceAll("{{VARNAME}}", varName);

  if (assetSheetNames.length > 0) {
    const namesExpr = assetSheetNames.map(n => `&quot;${n}&quot;`).join(", ");
    const assetLoop = xamlAssetLoop(namesExpr);
    // Insert before closing </p:Sequence>
    body = body.slice(0, -"</p:Sequence>".length) + assetLoop + "</p:Sequence>";
  }

  return xamlEnvelope([body], ["__ReferenceID0"], /* hasUi */ true, /* hasSd */ true, /* hasS */ assetSheetNames.length > 0);
}

function xamlAssetLoop(namesExpr) {
  return `<ui:ForEach x:TypeArguments="x:String" CurrentIndex="{x:Null}" DisplayName="For each asset sheet — load assets" Values="[New String() {${namesExpr}}]">`
    + `<ui:ForEach.Body><p:ActivityAction x:TypeArguments="x:String">`
    + `<p:ActivityAction.Argument><p:DelegateInArgument x:TypeArguments="x:String" Name="assetSheet" /></p:ActivityAction.Argument>`
    + `<p:TryCatch DisplayName="Load asset sheet">`
    + `<p:TryCatch.Try>`
    + `<p:Sequence DisplayName="Read and fetch assets">`
    + `<p:Sequence.Variables><p:Variable x:TypeArguments="sd:DataTable" Name="dt_AssetSheet" /></p:Sequence.Variables>`
    + `<ui:ReadRange Range="{x:Null}" AddHeaders="True" DataTable="[dt_AssetSheet]" SheetName="[assetSheet]" WorkbookPath="[in_ConfigFile]" />`
    + `<ui:ForEachRow DataTable="[dt_AssetSheet]" DisplayName="For each asset row">`
    + `<ui:ForEachRow.Body><p:ActivityAction x:TypeArguments="sd:DataRow">`
    + `<p:ActivityAction.Argument><p:DelegateInArgument x:TypeArguments="sd:DataRow" Name="assetRow" /></p:ActivityAction.Argument>`
    + `<p:TryCatch DisplayName="Try get asset">`
    + `<p:TryCatch.Try>`
    + `<p:Sequence DisplayName="Get asset from Orchestrator">`
    + `<p:Sequence.Variables><p:Variable x:TypeArguments="x:Object" Name="assetValue" /></p:Sequence.Variables>`
    + `<ui:GetRobotAsset AssetName="[assetRow(&quot;Asset&quot;).ToString]" FolderPath="[assetRow(&quot;OrchestratorAssetFolder&quot;).ToString]" CacheStrategy="None" DisplayName="Get Orchestrator asset">`
    + `<ui:GetRobotAsset.Value><p:OutArgument x:TypeArguments="x:Object">[assetValue]</p:OutArgument></ui:GetRobotAsset.Value>`
    + `</ui:GetRobotAsset>`
    + `</p:Sequence>`
    + `</p:TryCatch.Try>`
    + `<p:TryCatch.Catches><p:Catch x:TypeArguments="s:Exception">`
    + `<p:ActivityAction x:TypeArguments="s:Exception">`
    + `<p:ActivityAction.Argument><p:DelegateInArgument x:TypeArguments="s:Exception" Name="exception" /></p:ActivityAction.Argument>`
    + `<p:Sequence DisplayName="Body" />`
    + `</p:ActivityAction></p:Catch></p:TryCatch.Catches>`
    + `</p:TryCatch>`
    + `</p:ActivityAction></ui:ForEachRow.Body></ui:ForEachRow>`
    + `</p:Sequence>`
    + `</p:TryCatch.Try>`
    + `<p:TryCatch.Catches><p:Catch x:TypeArguments="s:Exception">`
    + `<p:ActivityAction x:TypeArguments="s:Exception">`
    + `<p:ActivityAction.Argument><p:DelegateInArgument x:TypeArguments="s:Exception" Name="exception" /></p:ActivityAction.Argument>`
    + `<p:Sequence DisplayName="Body" />`
    + `</p:ActivityAction></p:Catch></p:TryCatch.Catches>`
    + `</p:TryCatch>`
    + `</p:ActivityAction></ui:ForEach.Body></ui:ForEach>`;
}

function xamlAssign(id, to, value) {
  return `<p:Assign x:Name="${id}">`
    + `<p:Assign.To><p:OutArgument x:TypeArguments="x:Object">[${to}]</p:OutArgument></p:Assign.To>`
    + `<p:Assign.Value><p:InArgument x:TypeArguments="x:Object">[${value}]</p:InArgument></p:Assign.Value>`
    + `</p:Assign>`;
}

function xamlEnvelope(activities, refs, hasUi = false, hasSd = false, hasS = false) {
  const ns = `<?xml version="1.0" encoding="utf-16"?>`
    + `<ClipboardData Version="1.0"`
    + ` xmlns="http://schemas.microsoft.com/netfx/2009/xaml/activities/presentation"`
    + ` xmlns:p="http://schemas.microsoft.com/netfx/2009/xaml/activities"`
    + ` xmlns:sap2010="http://schemas.microsoft.com/netfx/2010/xaml/activities/presentation"`
    + ` xmlns:scg="clr-namespace:System.Collections.Generic;assembly=System.Private.CoreLib"`
    + ` xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"`
    + (hasUi ? ` xmlns:ui="http://schemas.uipath.com/workflow/activities"` : ``)
    + (hasSd ? ` xmlns:sd="clr-namespace:System.Data;assembly=System.Data.Common"` : ``)
    + (hasS ? ` xmlns:s="clr-namespace:System;assembly=System.Private.CoreLib"` : ``);

  const refItems = refs.map((r) => `<x:Reference>${r}</x:Reference>`).join("");

  return ns + `>`
    + `<ClipboardData.Data>`
    + `<scg:List x:TypeArguments="x:Object" Capacity="${activities.length}">`
    + activities.join("")
    + `</scg:List>`
    + `</ClipboardData.Data>`
    + `<ClipboardData.Metadata>`
    + `<scg:List x:TypeArguments="x:Object" Capacity="${refs.length}">`
    + `<scg:List x:TypeArguments="x:Object" Capacity="${refs.length}">${refItems}</scg:List>`
    + `</scg:List>`
    + `</ClipboardData.Metadata>`
    + `</ClipboardData>`;
}

if (typeof module !== "undefined") module.exports = { generateXamlSnippet };
