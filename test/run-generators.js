#!/usr/bin/env node
// Option A test runner — no test framework required.
// Run: node test/run-generators.js
//
// First run: generates golden fixtures under test/fixtures/expected/ and exits 0.
// Subsequent runs: compares output against golden fixtures; exits 1 on mismatch.

"use strict";

const assert = require("assert");
const fs     = require("fs");
const path   = require("path");

// --- Browser globals required by the generators ---

global.config = {
  namespace:           "Cpmf.Config",
  rootClassName:       "CodedConfig",
  outputFilename:      "Config",
  dotnetVersion:       "net6",
  xmlDocComments:      true,
  generateToString:    true,
  generateToJson:      false,
  generatePristine:    false,
  generateLoader:      true,
  generateReadonly:    false,
  uipathVariableName:  "out_ConFigTree",
};

global.lastSourceFormat = "xlsx";

global.nodeHasAssets = (node) =>
  node.properties.some((p) => p.isAsset) || node.children.some(global.nodeHasAssets);

global.escapeXml = (str) => str
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

// --- Load generators ---

const { generateCSharp }      = require("../js/cs-generator.js");
const { generateXamlSnippet } = require("../js/xaml-generator.js");

// --- Known input: SchemaNodes mirroring Config_Types.xlsx ---
// Two standard sheets (Settings, Constants) + one empty asset sheet.

const nodes = [
  {
    name: "Settings",
    isAssetSheet: false,
    properties: [
      { name: "FeatureName", csType: "string",   description: "string",                                isAsset: false },
      { name: "MaxItems",    csType: "int",       description: "int",                                   isAsset: false },
      { name: "Threshold",   csType: "double",    description: "double",                                isAsset: false },
      { name: "IsEnabled",   csType: "bool",      description: "bool",                                  isAsset: false },
      { name: "CutoffDate",  csType: "DateOnly",  description: "DateOnly \u2014 date only, time is 00:00:00", isAsset: false },
      { name: "ScheduledAt", csType: "DateTime",  description: "DateTime \u2014 has time component",    isAsset: false },
      { name: "DailyRunTime",csType: "TimeOnly",  description: "TimeOnly \u2014 time only, no date",    isAsset: false },
    ],
    children: [],
  },
  {
    name: "Constants",
    isAssetSheet: false,
    properties: [
      { name: "Pi",               csType: "double",   description: "double \u2014 mathematical constant", isAsset: false },
      { name: "MaxRetryNumber",   csType: "int",      description: "int",                                  isAsset: false },
      { name: "StrictMode",       csType: "bool",     description: "bool",                                 isAsset: false },
      { name: "ExpiresOn",        csType: "DateOnly", description: "DateOnly",                             isAsset: false },
      { name: "CreatedAt",        csType: "DateTime", description: "DateTime",                             isAsset: false },
      { name: "WindowOpen",       csType: "TimeOnly", description: "TimeOnly",                             isAsset: false },
      { name: "WindowClose",      csType: "TimeOnly", description: "TimeOnly",                             isAsset: false },
    ],
    children: [],
  },
  {
    name: "Assets",
    isAssetSheet: true,
    properties: [],
    children: [],
  },
];

// --- Run generators ---

const csOut   = generateCSharp(nodes, "xlsx");
const xamlOut = generateXamlSnippet();

// --- Compare or write golden fixtures ---

const expectedDir = path.join(__dirname, "fixtures", "expected");
if (!fs.existsSync(expectedDir)) fs.mkdirSync(expectedDir, { recursive: true });

const csFile   = path.join(expectedDir, "Config_Types.cs");
const xamlFile = path.join(expectedDir, "Config_Types.xaml");

let goldensExist = fs.existsSync(csFile) && fs.existsSync(xamlFile);

if (!goldensExist) {
  fs.writeFileSync(csFile,   csOut,   "utf8");
  fs.writeFileSync(xamlFile, xamlOut, "utf8");
  console.log("Golden fixtures written:");
  console.log("  " + csFile);
  console.log("  " + xamlFile);
  console.log("Re-run to compare against goldens.");
  process.exit(0);
}

let passed = true;

try {
  assert.strictEqual(csOut, fs.readFileSync(csFile, "utf8"), "C# output differs from golden");
  console.log("  PASS  Config_Types.cs");
} catch (e) {
  console.error("  FAIL  Config_Types.cs");
  console.error(e.message);
  passed = false;
}

try {
  assert.strictEqual(xamlOut, fs.readFileSync(xamlFile, "utf8"), "XAML output differs from golden");
  console.log("  PASS  Config_Types.xaml");
} catch (e) {
  console.error("  FAIL  Config_Types.xaml");
  console.error(e.message);
  passed = false;
}

process.exit(passed ? 0 : 1);
