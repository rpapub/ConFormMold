#!/usr/bin/env node
// Test runner — no test framework required.
// Run: node test/run-generators.js
//
// Uses the same parsing pipeline as the browser (SheetJS for xlsx, built-in for JSON).
// First run: generates golden fixtures under test/fixtures/expected/ and exits 0.
// Subsequent runs: compares output against golden fixtures; exits 1 on mismatch.
//
// Format dispatch table: add entries here when new format parsers are implemented.

"use strict";

const assert = require("assert");
const fs     = require("fs");
const path   = require("path");

// --- Browser globals required by parsers and generators ---

global.XLSX = require("../public/vendor/xlsx-0.20.3.js");

// TOML/jsyaml not loaded in Node — parsers.js guards with typeof checks
global.TOML    = undefined;
global.jsyaml  = undefined;

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

// --- Load parsers and generators ---

const { mapSheet, nodeHasAssets, parseJson, escapeXml } = require("../public/js/parsers.js");
global.nodeHasAssets = nodeHasAssets;
global.escapeXml     = escapeXml;

const { generateCSharp }      = require("../public/js/cs-generator.js");
const { generateXamlSnippet } = require("../public/js/xaml-generator.js");

// --- Format dispatch table ---
// Each entry: { parse(fixturePath) → SchemaNode[], sourceFormat }
// Add entries here as new format parsers are implemented.

const FIXTURES_DIR  = path.join(__dirname, "fixtures");
const EXPECTED_DIR  = path.join(__dirname, "fixtures", "expected");

const formats = [
  {
    name:        "Config_Types.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_Types.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames
        .filter(s => !s.startsWith("."))
        .map(s => mapSheet(wb, s));
    },
  },
  {
    name:        "Config_Basic.json",
    sourceFormat: "json",
    parse() {
      const text = fs.readFileSync(path.join(FIXTURES_DIR, "Config_Basic.json"), "utf8");
      return parseJson(text);
    },
  },
  {
    name:        "Config_TypedAssets.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_TypedAssets.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames
        .filter(s => !s.startsWith("."))
        .map(s => mapSheet(wb, s));
    },
  },
  {
    name:        "Config_Reference.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_Reference.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames
        .filter(s => !s.startsWith("."))
        .map(s => mapSheet(wb, s));
    },
  },
  // Regression fixture for #59: ValueType column at position 5 (not 4).
  // row[4] would read the "Tags" column; header.findIndex resolves it correctly.
  {
    name:        "Config_ValueTypeOffset.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_ValueTypeOffset.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames
        .filter(s => !s.startsWith("."))
        .map(s => mapSheet(wb, s));
    },
  },
  // Fixture for #79: .TargetType directive row → ToXxx() mapping method
  {
    name:        "Config_TargetType.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_TargetType.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames
        .filter(s => !s.startsWith("."))
        .map(s => mapSheet(wb, s));
    },
  },
  // Fixture for #80: DataType=credential → string + companion getters (Folder, Name)
  {
    name:        "Config_CredentialRef.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_CredentialRef.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames
        .filter(s => !s.startsWith("."))
        .map(s => mapSheet(wb, s));
    },
  },
  // Future entries:
  // { name: "Config_Basic.toml", sourceFormat: "toml", parse() { ... } },
  // { name: "Config_Basic.yaml", sourceFormat: "yaml", parse() { ... } },
];

// --- Run and compare ---

if (!fs.existsSync(EXPECTED_DIR)) fs.mkdirSync(EXPECTED_DIR, { recursive: true });

let allNew  = true;
let passed  = true;
const results = [];

for (const fmt of formats) {
  const nodes = fmt.parse();
  global.lastSourceFormat = fmt.sourceFormat;

  const csOut   = generateCSharp(nodes, fmt.sourceFormat);
  const xamlOut = generateXamlSnippet(nodes);

  const stem    = fmt.name.replace(/\.[^.]+$/, "");
  const csFile   = path.join(EXPECTED_DIR, `${stem}.cs`);
  const xamlFile = path.join(EXPECTED_DIR, `${stem}.xaml`);

  const goldensExist = fs.existsSync(csFile) && fs.existsSync(xamlFile);
  if (goldensExist) allNew = false;

  if (!goldensExist) {
    fs.writeFileSync(csFile,   csOut,   "utf8");
    fs.writeFileSync(xamlFile, xamlOut, "utf8");
    results.push(`  WROTE ${stem}.cs + .xaml`);
  } else {
    let ok = true;
    try {
      assert.strictEqual(csOut, fs.readFileSync(csFile, "utf8"), `${stem}.cs differs from golden`);
      results.push(`  PASS  ${stem}.cs`);
    } catch (e) {
      results.push(`  FAIL  ${stem}.cs\n         ${e.message}`);
      ok = false;
    }
    try {
      assert.strictEqual(xamlOut, fs.readFileSync(xamlFile, "utf8"), `${stem}.xaml differs from golden`);
      results.push(`  PASS  ${stem}.xaml`);
    } catch (e) {
      results.push(`  FAIL  ${stem}.xaml\n         ${e.message}`);
      ok = false;
    }
    if (!ok) passed = false;
  }
}

results.forEach(r => console.log(r));

if (allNew) {
  console.log("\nGolden fixtures written. Re-run to compare against goldens.");
  process.exit(0);
}

process.exit(passed ? 0 : 1);
