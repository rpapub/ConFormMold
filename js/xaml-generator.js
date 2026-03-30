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
  `<ui:ForEach x:TypeArguments="x:String" CurrentIndex="{x:Null}" DisplayName="For each sheet — ReadRange into dt_Tables" Values="[New String() {{{CONFIG_SHEETS}}}]">` +
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

  // Asset sheets are excluded from the ReadRange loop — their values come from GetRobotAsset, not DataTable.
  const configSheetNames = (nodes || [])
    .filter(n => !n.isAssetSheet)
    .map(n => `&quot;${n.name}&quot;`)
    .join(", ");

  const assetProps = collectAssetProps(nodes || [], "");
  const hasAssets  = assetProps.length > 0;

  let body = XAML_CONFIGT_REF_TEMPLATE
    .replaceAll("{{CLASSNAME}}", className)
    .replaceAll("{{VARNAME}}", varName)
    .replaceAll("{{CONFIG_SHEETS}}", configSheetNames);

  if (hasAssets) {
    body = body.slice(0, -"</p:Sequence>".length)
      + assetProps.map(({ path, prop }) => xamlSingleAsset(varName, path, prop)).join("")
      + "</p:Sequence>";
  }

  return xamlEnvelope([body], ["__ReferenceID0"], /* hasUi */ true, /* hasSd */ true, /* hasS */ hasAssets);
}

// Collect all asset properties recursively from the schema tree.
// Returns [{ path: "SectionName", prop: { name, assetName, folder, valueType } }, ...]
function collectAssetProps(nodes, parentPath) {
  const result = [];
  for (const node of nodes) {
    const nodePath = parentPath ? `${parentPath}.${node.name}` : node.name;
    for (const prop of (node.properties || [])) {
      if (prop.isAsset) result.push({ path: nodePath, prop });
    }
    result.push(...collectAssetProps(node.children || [], nodePath));
  }
  return result;
}

// One TryCatch per asset: hardcoded AssetName/Folder literals, typed cast on Assign (#71).
// CType cast satisfies Option Strict On (#52).
function xamlSingleAsset(varName, sectionPath, prop) {
  const tmpVar       = `assetValue_${prop.name}`;
  const assignTarget = `${varName}.${sectionPath}.${prop.name}`;
  const vt           = prop.valueType ?? "object";
  const castFn       = vt === "string" ? "CStr" : vt === "int" ? "CInt" : vt === "bool" ? "CBool" : null;
  const valueExpr    = castFn ? `${castFn}(${tmpVar})` : tmpVar;
  const assetName    = (prop.assetName || "").replace(/&/g,"&amp;").replace(/"/g,"&quot;");
  const folder       = (prop.folder    || "").replace(/&/g,"&amp;").replace(/"/g,"&quot;");

  return `<p:TryCatch DisplayName="Get asset: ${prop.name}">`
    + `<p:TryCatch.Try>`
    + `<p:Sequence DisplayName="Fetch ${prop.name} from Orchestrator">`
    + `<p:Sequence.Variables><p:Variable x:TypeArguments="x:Object" Name="${tmpVar}" /></p:Sequence.Variables>`
    + `<ui:GetRobotAsset AssetName="${assetName}" FolderPath="${folder}" CacheStrategy="None" DisplayName="Get ${prop.name} from Orchestrator">`
    + `<ui:GetRobotAsset.Value><p:OutArgument x:TypeArguments="x:Object">[${tmpVar}]</p:OutArgument></ui:GetRobotAsset.Value>`
    + `</ui:GetRobotAsset>`
    + `<p:Assign DisplayName="Assign ${prop.name}">`
    + `<p:Assign.To><p:OutArgument x:TypeArguments="x:Object">[${assignTarget}]</p:OutArgument></p:Assign.To>`
    + `<p:Assign.Value><p:InArgument x:TypeArguments="x:Object">[${valueExpr}]</p:InArgument></p:Assign.Value>`
    + `</p:Assign>`
    + `</p:Sequence>`
    + `</p:TryCatch.Try>`
    + `<p:TryCatch.Catches><p:Catch x:TypeArguments="s:Exception">`
    + `<p:ActivityAction x:TypeArguments="s:Exception">`
    + `<p:ActivityAction.Argument><p:DelegateInArgument x:TypeArguments="s:Exception" Name="exception" /></p:ActivityAction.Argument>`
    + `<p:Sequence DisplayName="Body" /></p:ActivityAction></p:Catch></p:TryCatch.Catches>`
    + `</p:TryCatch>`;
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
