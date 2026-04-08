#!/usr/bin/env node
// Test runner — no test framework required.
// Run: node test/run-generators.mjs
//
// Uses the same parsing pipeline as the browser (SheetJS for xlsx, built-in for JSON/TOML).
// First run: generates golden fixtures under test/fixtures/expected/ and exits 0.
// Subsequent runs: compares output against golden fixtures; exits 1 on mismatch.
//
// Format dispatch table: add entries here when new format parsers are implemented.

import assert            from "node:assert";
import fs                from "node:fs";
import path              from "node:path";
import { fileURLToPath } from "node:url";
import { parse as tomlParse } from "smol-toml";

import xlsxModule    from "../public/vendor/xlsx-0.20.3.js";
import parsersModule from "../public/js/parsers.js";
import csGenModule   from "../public/js/cs-generator.js";
import xamlGenModule from "../public/js/xaml-generator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// --- Browser globals required by parsers and generators ---

globalThis.XLSX  = xlsxModule;
globalThis.TOML  = { parse: tomlParse };
globalThis.jsyaml = undefined;   // js-yaml not installed — YAML tests remain skipped

globalThis.config = {
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

globalThis.lastSourceFormat    = "xlsx";
globalThis.CONFORMMOLD_VERSION = fs.readFileSync(path.join(__dirname, "../VERSION"), "utf8").trim();

// --- Load parsers and generators ---

const { mapSheet, parseJson, parseToml, nodeHasAssets, escapeXml } = parsersModule;

// escapeXml and nodeHasAssets are used as bare globals by cs-generator.js and xaml-generator.js
globalThis.escapeXml     = escapeXml;
globalThis.nodeHasAssets = nodeHasAssets;
const { generateCSharp }                 = csGenModule;
const { generateXamlSnippet }            = xamlGenModule;

// --- Format dispatch table ---
// Each entry: { name, sourceFormat, parse() → SchemaNode[] }
// Add entries here as new format parsers are implemented.

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const EXPECTED_DIR = path.join(__dirname, "fixtures", "expected");

const formats = [
  {
    name:         "Config_Types.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_Types.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames
        .filter(s => !s.startsWith("_"))
        .map(s => mapSheet(wb, s));
    },
  },
  {
    name:         "Config_Basic.json",
    sourceFormat: "json",
    parse() {
      const text = fs.readFileSync(path.join(FIXTURES_DIR, "Config_Basic.json"), "utf8");
      return parseJson(text);
    },
  },
  // #84: stem field avoids collision with Config_Basic.json golden
  {
    name:         "Config_Basic.toml",
    stem:         "Config_Basic_Toml",
    sourceFormat: "toml",
    parse() {
      return parseToml(fs.readFileSync(path.join(FIXTURES_DIR, "Config_Basic.toml"), "utf8"));
    },
  },
  {
    name:         "Config_TypedAssets.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_TypedAssets.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames
        .filter(s => !s.startsWith("_"))
        .map(s => mapSheet(wb, s));
    },
  },
  {
    name:         "Config_Reference.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_Reference.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames
        .filter(s => !s.startsWith("_"))
        .map(s => mapSheet(wb, s));
    },
  },
  // Regression fixture for #59: ValueType column at position 5 (not 4).
  // row[4] would read the "Tags" column; header.findIndex resolves it correctly.
  {
    name:         "Config_ValueTypeOffset.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_ValueTypeOffset.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames
        .filter(s => !s.startsWith("_"))
        .map(s => mapSheet(wb, s));
    },
  },
  // Fixture for #79: _TargetType directive row → ToXxx() mapping method
  {
    name:         "Config_TargetType.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_TargetType.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames
        .filter(s => !s.startsWith("_"))
        .map(s => mapSheet(wb, s));
    },
  },
  // Fixture for #80: DataType=credential → string + companion getters (Folder, Name)
  {
    name:         "Config_CredentialRef.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_CredentialRef.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames
        .filter(s => !s.startsWith("_"))
        .map(s => mapSheet(wb, s));
    },
  },
  // Fixture for #81: DataType=asset → identical companion getters as credential (#80)
  {
    name:         "Config_AssetRef.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_AssetRef.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames.filter(s => !s.startsWith("_")).map(s => mapSheet(wb, s));
    },
  },
  // Fixture for #84: Config_Types.toml covers all TOML-supported types
  {
    name:         "Config_Types.toml",
    stem:         "Config_Types_Toml",
    sourceFormat: "toml",
    parse() {
      return parseToml(fs.readFileSync(path.join(FIXTURES_DIR, "Config_Types.toml"), "utf8"));
    },
  },
  // #83: existing fixtures not previously in test runner
  {
    name:         "Config_Assets.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_Assets.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames.filter(s => !s.startsWith("_")).map(s => mapSheet(wb, s));
    },
  },
  {
    name:         "Config_BadHeader.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_BadHeader.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames.filter(s => !s.startsWith("_")).map(s => mapSheet(wb, s));
    },
  },
  {
    name:         "Config_CustomSheets.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_CustomSheets.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames.filter(s => !s.startsWith("_")).map(s => mapSheet(wb, s));
    },
  },
  {
    name:         "Config_MultiSheet.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_MultiSheet.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames.filter(s => !s.startsWith("_")).map(s => mapSheet(wb, s));
    },
  },
  {
    name:         "Config_Test.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_Test.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames.filter(s => !s.startsWith("_")).map(s => mapSheet(wb, s));
    },
  },
  // Fixture for #85: DataType column type override (int→double, empty, bogus, credential, asset)
  {
    name:         "Config_DataType.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_DataType.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames.filter(s => !s.startsWith("_")).map(s => mapSheet(wb, s));
    },
  },
  // Fixture for #86: _TargetType + DataType=credential + DataType=asset in same sheet
  {
    name:         "Config_Combined.xlsx",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_Combined.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames.filter(s => !s.startsWith("_")).map(s => mapSheet(wb, s));
    },
  },
  // Future entries:
  // { name: "Config_Basic.yaml", sourceFormat: "yaml", parse() { ... } },
];

// --- Readonly pass fixtures (#82) ---
// A focused subset exercising init accessors, local-variable FromDataTable pattern,
// and companion getters alongside init.
const readonlyFormats = [
  {
    name:         "Config_CredentialRef.xlsx",
    stem:         "Config_CredentialRef_Readonly",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_CredentialRef.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames.filter(s => !s.startsWith("_")).map(s => mapSheet(wb, s));
    },
  },
  {
    name:         "Config_Types.xlsx",
    stem:         "Config_Types_Readonly",
    sourceFormat: "xlsx",
    parse() {
      const buf = fs.readFileSync(path.join(FIXTURES_DIR, "Config_Types.xlsx"));
      const wb  = XLSX.read(buf, { type: "buffer", cellDates: true });
      return wb.SheetNames.filter(s => !s.startsWith("_")).map(s => mapSheet(wb, s));
    },
  },
];

// --- Run and compare ---

if (!fs.existsSync(EXPECTED_DIR)) fs.mkdirSync(EXPECTED_DIR, { recursive: true });

function runPass(fmtList, results) {
  let allNew = true;
  for (const fmt of fmtList) {
    const nodes = fmt.parse();
    globalThis.lastSourceFormat = fmt.sourceFormat;

    const csOut   = generateCSharp(nodes, fmt.sourceFormat);
    const xamlOut = generateXamlSnippet(nodes);

    const stem     = fmt.stem ?? fmt.name.replace(/\.[^.]+$/, "");
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
      if (!ok) return { allNew, passed: false };
    }
  }
  return { allNew, passed: true };
}

let overallAllNew = true;
let passed = true;
const results = [];

// Pass 1: default (readonly=false)
const p1 = runPass(formats, results);
if (!p1.allNew) overallAllNew = false;
if (!p1.passed) passed = false;

// Pass 2: readonly=true
globalThis.config.generateReadonly = true;
const p2 = runPass(readonlyFormats, results);
if (!p2.allNew) overallAllNew = false;
if (!p2.passed) passed = false;
globalThis.config.generateReadonly = false;

results.forEach(r => console.log(r));

if (overallAllNew) {
  console.log("\nGolden fixtures written. Re-run to compare against goldens.");
  process.exit(0);
}

process.exit(passed ? 0 : 1);
