// --- xlsx sheet mapper ---
//
// Depends on global XLSX (SheetJS). In the browser this is loaded from CDN.
// In Node.js tests: global.XLSX = require('xlsx') before requiring this file.

function mapSheet(workbook, sheetName) {
  const ws = workbook.Sheets[sheetName];
  if (!ws) {
    console.warn(`Sheet "${sheetName}" not found — returning empty.`);
    return { name: sheetName, properties: [], children: [] };
  }

  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });

  // Detect missing or empty header row
  if (raw.length === 0 || (raw[0] || []).every((h) => !h)) {
    return {
      name: sheetName, properties: [], children: [],
      warning: `Sheet "${sheetName}": missing or empty header row.`,
    };
  }

  // Detect schema from header row: col B header "asset" → asset sheet
  const header = (raw[0] || []).map((h) => (h || "").toString().trim().toLowerCase());
  const isAssetSheet = header[1] === "asset";

  const properties = [];
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    const name = row[0] != null ? String(row[0]).trim() : null;
    if (!name) continue;

    if (isAssetSheet) {
      const rawType = row[4] != null ? String(row[4]).trim().toLowerCase() : "";
      const valueType = ["string", "int", "bool"].includes(rawType) ? rawType : "object";
      properties.push({
        name,
        csType:      "OrchestratorAsset",
        description: row[3] != null ? String(row[3]).trim() : "",
        isAsset:     true,
        assetName:   row[1] != null ? String(row[1]).trim() : "",
        folder:      row[2] != null ? String(row[2]).trim() : "",
        valueType,
      });
    } else {
      const cell = getCellWithType(ws, i, 1);
      properties.push({
        name,
        csType:      cell.csType,
        description: row[2] != null ? String(row[2]).trim() : "",
        isAsset:     false,
      });
    }
  }

  return { name: sheetName, properties, children: [], isAssetSheet };
}

function getCellWithType(ws, rowIndex, colIndex) {
  // SheetJS cell address is zero-based via utils.encode_cell
  const addr = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
  const cell = ws[addr];

  if (!cell || cell.v == null) return { value: null, csType: "string" };

  switch (cell.t) {
    case "b":
      return { value: cell.v, csType: "bool" };

    case "n": {
      const isInt = Number.isInteger(cell.v);
      return { value: cell.v, csType: isInt ? "int" : "double" };
    }

    case "d": {
      const d = cell.v;
      // SheetJS epoch is 1899-12-31 (UTC). Any pre-1900 date = time-only serial.
      if (d.getUTCFullYear() < 1900) return { value: d, csType: "TimeOnly" };
      const hasTime = d.getUTCHours() !== 0 || d.getUTCMinutes() !== 0 || d.getUTCSeconds() !== 0;
      return { value: d, csType: hasTime ? "DateTime" : "DateOnly" };
    }

    case "s":
    default:
      return { value: cell.v, csType: "string" };
  }
}

// True if node or any descendant has at least one asset property
function nodeHasAssets(node) {
  return node.properties.some((p) => p.isAsset) || node.children.some(nodeHasAssets);
}

// --- TOML input parser (#26) ---
//
// Uses @ltd/j-toml. Native TOML types map directly to C# types — no annotation needed.
// Section detection mirrors JSON: assetName+folder → asset, value key → standard, subtable → child.

function parseToml(text) {
  if (typeof TOML === "undefined") throw new Error("TOML parser not loaded — check network.");
  const doc = TOML.parse(text);
  return Object.entries(doc).map(([name, section]) => parseTomlNode(name, section));
}

function parseTomlNode(name, obj) {
  const properties = [];
  const children   = [];

  for (const [key, val] of Object.entries(obj)) {
    if (val && typeof val === "object" && !Array.isArray(val) && "assetName" in val && "folder" in val) {
      properties.push({
        name:        key,
        csType:      "OrchestratorAsset",
        description: val.description ?? "",
        isAsset:     true,
        assetName:   val.assetName ?? "",
        folder:      val.folder ?? "",
      });
    } else if (val && typeof val === "object" && !Array.isArray(val) && "value" in val) {
      properties.push({
        name:        key,
        csType:      val.csType ?? inferTomlCsType(val.value),
        description: val.description ?? "",
        isAsset:     false,
      });
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      children.push(parseTomlNode(key, val));
    }
  }

  return { name, properties, children };
}

function inferTomlCsType(value) {
  if (typeof value === "boolean") return "bool";
  if (typeof value === "number")  return Number.isInteger(value) ? "int" : "double";
  if (value instanceof Date)      return inferDateCsType(value);
  // smol-toml exposes local date/time as objects with a type tag
  if (value && typeof value === "object" && "type" in value) {
    if (value.type === "local-date")      return "DateOnly";
    if (value.type === "local-time")      return "TimeOnly";
    if (value.type === "local-datetime")  return "DateTime";
    if (value.type === "offset-datetime") return "DateTime";
  }
  return "string";
}

// --- YAML input parser (#26) ---
//
// Uses js-yaml. YAML native types map to bool/int/float/Date.
// Time-only strings need explicit csType annotation.

function parseYaml(text) {
  const doc = jsyaml.load(text);
  return Object.entries(doc).map(([name, section]) => parseJsonNode(name, section));
  // YAML scalars parse to the same JS types as JSON — reuse parseJsonNode + inferCsType
}

// --- JSON input parser (#25) ---
//
// Input format (see test/fixtures/Config_Basic.json):
//   Standard property: "Key": { "value": <scalar>, "description": "..." }
//   Asset property:    "Key": { "assetName": "...", "folder": "...", "description": "..." }
//   Nested section:    "Key": { "SubKey": { ... } }  — no "value" or "assetName" key at top level

function parseJson(text) {
  const doc = JSON.parse(text);
  return Object.entries(doc).map(([name, section]) => parseJsonNode(name, section));
}

function parseJsonNode(name, obj) {
  const properties = [];
  const children   = [];

  for (const [key, val] of Object.entries(obj)) {
    if (val && typeof val === "object" && "assetName" in val && "folder" in val) {
      // Asset property
      properties.push({
        name:        key,
        csType:      "OrchestratorAsset",
        description: val.description ?? "",
        isAsset:     true,
        assetName:   val.assetName ?? "",
        folder:      val.folder ?? "",
      });
    } else if (val && typeof val === "object" && "value" in val) {
      // Standard property — infer csType from JS value type
      properties.push({
        name:        key,
        csType:      val.csType ?? inferCsType(val.value),
        description: val.description ?? "",
        isAsset:     false,
      });
    } else if (val && typeof val === "object") {
      // Nested section → child SchemaNode
      children.push(parseJsonNode(key, val));
    }
    // null or primitive at top level: skip (not a valid property wrapper)
  }

  return { name, properties, children };
}

function inferCsType(value) {
  if (typeof value === "boolean") return "bool";
  if (typeof value === "number")  return Number.isInteger(value) ? "int" : "double";
  if (value instanceof Date)      return inferDateCsType(value);
  if (typeof value === "string") {
    // ISO date patterns
    if (/^\d{4}-\d{2}-\d{2}$/.test(value))                   return "DateOnly";
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value))        return "DateTime";
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(value))                 return "TimeOnly";
  }
  return "string";
}

function inferDateCsType(d) {
  if (d.getUTCFullYear() < 1900) return "TimeOnly";
  const hasTime = d.getUTCHours() !== 0 || d.getUTCMinutes() !== 0 || d.getUTCSeconds() !== 0;
  return hasTime ? "DateTime" : "DateOnly";
}

// --- Utility ---

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

if (typeof module !== "undefined") {
  module.exports = { mapSheet, nodeHasAssets, parseJson, parseToml, parseYaml, escapeXml };
}
