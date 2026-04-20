/**
 * @file Parsers that turn input config files (xlsx / JSON / TOML / YAML) into the shared SchemaNode IR.
 *
 * Exports: VOCAB, ALLOWED, VOCAB_DOCS, ALLOWED_DOCS, mapSheet, readMetaSheet, nodeHasAssets, parseJson, parseToml, readTomlMeta, parseYaml, escapeXml
 * Consumes: global XLSX (SheetJS), global TOML (smol-toml), global jsyaml (js-yaml, optional)
 * Produces: SchemaNode[] (typedefs below) and MetaOverrides
 *
 * Related: (raw file) → parsers.js → cs-generator.js, xaml-generator.js, app.js
 */

// --- xlsx sheet mapper ---
//
// Depends on global XLSX (SheetJS). In the browser this is loaded from CDN.
// In Node.js tests: global.XLSX = require('xlsx') before requiring this file.

/**
 * @typedef {"string"|"int"|"double"|"bool"|"DateOnly"|"DateTime"|"TimeOnly"|"OrchestratorAsset"} CsType
 */

/**
 * @typedef {"xlsx"|"json"|"toml"|"yaml"} SourceFormat
 */

/**
 * @typedef {object} ScalarProperty
 * @property {string} name - key as it appears in the source
 * @property {CsType} csType
 * @property {*} [defaultValue] - literal default, emitted as a C# initializer
 * @property {string} [description] - XML doc comment text
 * @property {false} isAsset
 * @property {boolean} [isCredentialRef] - true for DataType=credential|asset columns
 */

/**
 * @typedef {object} AssetProperty
 * @property {string} name
 * @property {"OrchestratorAsset"} csType
 * @property {string} [description]
 * @property {true} isAsset
 * @property {string} assetName - Orchestrator asset name literal
 * @property {string} folder - Orchestrator folder path
 * @property {("string"|"int"|"bool"|null)} [valueType] - type cast used by the emitted XAML
 */

/**
 * @typedef {ScalarProperty | AssetProperty} Property
 */

/**
 * @typedef {object} SchemaNode
 * @property {string} name
 * @property {Property[]} properties
 * @property {SchemaNode[]} children
 * @property {string} [targetType] - _TargetType directive → emits ToXxx() mapping method
 * @property {boolean} [isAssetSheet] - col B header = "asset" (xlsx)
 * @property {string[]} [warnings] - surfaced to the UI via showWarning()
 */

/**
 * @typedef {Object<string, *>} MetaOverrides - partial override map for CONFIG_DEFAULTS keys
 */

// --- Tier 2 configuration surface ---
//
// VOCAB  — symbolic sentinels users must type literally in their input files.
// ALLOWED — validation sets: legal values at a given cell position.
//
// Docs for docs/reference.md auto-extract from VOCAB_DOCS / ALLOWED_DOCS.
// The extractor asserts key parity, so changes here must update both objects.

const VOCAB = {
  // Sheet schema detection (xlsx)
  ASSET_SHEET_TRIGGER:  "asset",          // col B header → asset sheet

  // Column name sentinels (xlsx; case-insensitive header match)
  COL_VALUETYPE:        "valuetype",
  COL_DATATYPE:         "datatype",

  // DataType cell values (case-insensitive)
  DT_CREDENTIAL:        "credential",
  DT_ASSET:             "asset",

  // Reserved directive names
  DIR_META:             "_meta",          // sheet / table name (CI)
  DIR_TARGET_TYPE_XLSX: "_targettype",    // xlsx row Name cell (CI)
  DIR_TARGET_TYPE_TOML: "_TargetType",    // TOML key (exact match)

  // Synthetic IR bucket names
  FLAT_TOML_BUCKET:     "Settings",       // synthetic node for flat TOML
};

const ALLOWED = {
  CS_TYPES:    ["string", "int", "double", "bool", "DateOnly", "DateTime", "TimeOnly"],
  ASSET_TYPES: ["string", "int", "bool"],
};

const VOCAB_DOCS = {
  ASSET_SHEET_TRIGGER:  { match: "col B header, CI",          purpose: "Triggers asset-sheet detection" },
  COL_VALUETYPE:        { match: "header name, CI",           purpose: "Asset-sheet typed cast column" },
  COL_DATATYPE:         { match: "header name, CI",           purpose: "Standard-sheet type override column" },
  DT_CREDENTIAL:        { match: "DataType cell, CI",         purpose: "Emit `…Folder` / `…Name` companion getters" },
  DT_ASSET:             { match: "DataType cell, CI",         purpose: "Emit `…Folder` / `…Name` companion getters" },
  DIR_META:             { match: "sheet / table name, CI",    purpose: "Per-file CONFIG_DEFAULTS override bag" },
  DIR_TARGET_TYPE_XLSX: { match: "row name cell, CI",         purpose: "Emit `ToXxx()` mapping method (xlsx)" },
  DIR_TARGET_TYPE_TOML: { match: "TOML key, exact",           purpose: "Emit `ToXxx()` mapping method (TOML)" },
  FLAT_TOML_BUCKET:     { match: "synthetic",                 purpose: "Name of auto-created section for flat TOML" },
};

const ALLOWED_DOCS = {
  CS_TYPES:    { context: "DataType cell, case-sensitive",    purpose: "Legal type override values" },
  ASSET_TYPES: { context: "ValueType cell, case-insensitive", purpose: "Legal asset typed-cast values" },
};

/**
 * Convert one xlsx sheet into a SchemaNode.
 * @param {object} workbook - SheetJS workbook
 * @param {string} sheetName
 * @returns {SchemaNode}
 */
function mapSheet(workbook, sheetName) {
  const ws = workbook.Sheets[sheetName];
  if (!ws) {
    console.warn(`Sheet "${sheetName}" not found — returning empty.`);
    return { name: sheetName, properties: [], children: [], warnings: [] };
  }

  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });

  // Detect missing or empty header row
  if (raw.length === 0 || (raw[0] || []).every((h) => !h)) {
    return {
      name: sheetName, properties: [], children: [],
      warnings: [`Sheet "${sheetName}": missing or empty header row.`],
    };
  }

  // Detect schema from header row: col B header "asset" → asset sheet
  const header = (raw[0] || []).map((h) => (h || "").toString().trim().toLowerCase());
  const isAssetSheet = header[1] === VOCAB.ASSET_SHEET_TRIGGER;
  const valueTypeColIdx = header.findIndex(
    (h) => h != null && String(h).trim().toLowerCase() === VOCAB.COL_VALUETYPE
  );
  const dataTypeColIdx = header.findIndex(
    (h) => h != null && String(h).trim().toLowerCase() === VOCAB.COL_DATATYPE
  );

  let targetType = null;
  const properties = [];
  const warnings = [];
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    const name = row[0] != null ? String(row[0]).trim() : null;
    if (!name) continue;

    if (name.startsWith('_')) {
      if (name.toLowerCase() === VOCAB.DIR_TARGET_TYPE_XLSX) {
        targetType = row[1] != null ? String(row[1]).trim() : null;
      } else {
        warnings.push(`Sheet "${sheetName}": skipped unknown directive '${name}'. Valid: _TargetType.`);
      }
      continue;
    }

    if (isAssetSheet) {
      const rawValueTypeCell = valueTypeColIdx >= 0 && row[valueTypeColIdx] != null
        ? String(row[valueTypeColIdx]).trim()
        : "";
      const rawType = rawValueTypeCell.toLowerCase();
      const valueType = ALLOWED.ASSET_TYPES.includes(rawType) ? rawType : "object";
      if (rawValueTypeCell !== "" && !ALLOWED.ASSET_TYPES.includes(rawType)) {
        warnings.push(`Sheet "${sheetName}": unknown ValueType '${rawValueTypeCell}' for asset '${name}' — emitting object?.`);
      }
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
      const rawDataType = dataTypeColIdx >= 0 && row[dataTypeColIdx] != null
        ? String(row[dataTypeColIdx]).trim()
        : "";
      const normalizedDT = rawDataType.toLowerCase();
      if (normalizedDT === VOCAB.DT_CREDENTIAL || normalizedDT === VOCAB.DT_ASSET) {
        properties.push({
          name,
          csType:          "string",
          description:     row[2] != null ? String(row[2]).trim() : "",
          isAsset:         false,
          isCredentialRef: true,
        });
        continue;
      }

      const csType = ALLOWED.CS_TYPES.includes(rawDataType) ? rawDataType : cell.csType;
      if (rawDataType !== "" && !ALLOWED.CS_TYPES.includes(rawDataType)) {
        warnings.push(`Sheet "${sheetName}": unknown DataType '${rawDataType}' for row '${name}' — falling back to inferred type (${cell.csType}).`);
      }
      properties.push({
        name,
        csType,
        defaultValue: cell.value,
        description:  row[2] != null ? String(row[2]).trim() : "",
        isAsset:      false,
      });
    }
  }

  return { name: sheetName, properties, children: [], isAssetSheet, targetType, warnings };
}

/**
 * Inspect a cell and return `{ value, csType }`, inferring type from SheetJS `cell.t`.
 * @param {object} ws - SheetJS worksheet
 * @param {number} rowIndex - zero-based row index
 * @param {number} colIndex - zero-based column index
 * @returns {{ value: *, csType: CsType }}
 */
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

/**
 * Return true if the node or any descendant has an asset property.
 * @param {SchemaNode} node
 * @returns {boolean}
 */
function nodeHasAssets(node) {
  return node.properties.some((p) => p.isAsset) || node.children.some(nodeHasAssets);
}

/**
 * Read a `_Meta` sheet (excluded from code gen) as a flat key/value override map.
 * @param {object} workbook - SheetJS workbook
 * @returns {MetaOverrides|null} map of recognised CONFIG_DEFAULTS keys, or null if absent
 */
function readMetaSheet(workbook) {
  const metaName = workbook.SheetNames.find((n) => n.toLowerCase() === VOCAB.DIR_META);
  if (!metaName) return null;
  const ws  = workbook.Sheets[metaName];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const meta = {};
  for (const row of raw) {
    const key = row[0] != null ? String(row[0]).trim() : null;
    const val = row[1] != null ? row[1]                : null;
    if (key && val != null) meta[key] = val;
  }
  return Object.keys(meta).length > 0 ? meta : null;
}

// --- TOML input parser (#26, #88) ---
//
// Uses smol-toml. Native TOML types map directly to C# types — no annotation needed.
// Bare scalars are inferred; { value, csType } wrappers allow explicit type override.
// Flat TOML (no [Section] headers) defaults to a "Settings" section.

/**
 * Parse TOML text into SchemaNodes; flat scalars roll up under a "Settings" node.
 * @param {string} text
 * @returns {SchemaNode[]}
 */
function parseToml(text) {
  if (typeof TOML === "undefined") throw new Error("TOML parser not loaded — check network.");
  const doc = TOML.parse(text);
  const entries = Object.entries(doc);

  const nodes = [];
  const rootScalars = {};

  for (const [name, val] of entries) {
    if (name.toLowerCase() === VOCAB.DIR_META) continue; // reserved — consumed by readTomlMeta
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      nodes.push(parseTomlNode(name, val));
    } else {
      rootScalars[name] = val;
    }
  }

  if (Object.keys(rootScalars).length > 0) {
    nodes.unshift(parseTomlNode(VOCAB.FLAT_TOML_BUCKET, rootScalars));
  }

  return nodes;
}

/**
 * Recursively convert one TOML table into a SchemaNode.
 * @param {string} name
 * @param {object} obj - TOML table
 * @returns {SchemaNode}
 */
function parseTomlNode(name, obj) {
  const properties = [];
  const children   = [];
  const warnings   = [];
  const node       = { name, properties, children, warnings };

  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith("_")) {
      if (key === VOCAB.DIR_TARGET_TYPE_TOML) {
        node.targetType = String(val);
      } else {
        warnings.push(`Section "${name}": skipped unknown directive '${key}'. Valid: _TargetType.`);
      }
      continue;
    }
    if (val && typeof val === "object" && !Array.isArray(val) && "assetName" in val && "folder" in val) {
      if (val.valueType != null && !ALLOWED.ASSET_TYPES.includes(String(val.valueType).toLowerCase())) {
        warnings.push(`Section "${name}": unknown valueType '${val.valueType}' for asset '${key}' — emitting object?.`);
      }
      properties.push({
        name:        key,
        csType:      "OrchestratorAsset",
        description: val.description ?? "",
        isAsset:     true,
        assetName:   val.assetName ?? "",
        folder:      val.folder ?? "",
        valueType:   val.valueType ?? null,
      });
    } else if (val && typeof val === "object" && !Array.isArray(val) && "value" in val) {
      if (val.csType != null && !ALLOWED.CS_TYPES.includes(String(val.csType))) {
        warnings.push(`Section "${name}": unknown csType '${val.csType}' for '${key}' — treated as literal.`);
      }
      properties.push({
        name:         key,
        csType:       val.csType ?? inferTomlCsType(val.value),
        defaultValue: val.value,
        description:  val.description ?? "",
        isAsset:      false,
      });
    } else if (val instanceof Date ||
               (val && typeof val === "object" && !Array.isArray(val) && "type" in val &&
                (val.type === "local-date" || val.type === "local-time" ||
                 val.type === "local-datetime" || val.type === "offset-datetime"))) {
      // smol-toml typed date/time scalars — treat as leaf property, not sub-table
      properties.push({
        name:         key,
        csType:       inferTomlCsType(val),
        defaultValue: val,
        description:  "",
        isAsset:      false,
      });
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      children.push(parseTomlNode(key, val));
    } else if (val === null || typeof val !== "object") {
      properties.push({
        name:         key,
        csType:       inferTomlCsType(val),
        defaultValue: val,
        description:  "",
        isAsset:      false,
      });
    }
  }

  return node;
}

/**
 * Read a top-level `[_meta]` table from a TOML document as an override map.
 * @param {string} text
 * @returns {MetaOverrides|null} map of recognised CONFIG_DEFAULTS keys, or null if absent
 */
function readTomlMeta(text) {
  if (typeof TOML === "undefined") return null;
  try {
    const doc     = TOML.parse(text);
    const metaKey = Object.keys(doc).find((k) => k.toLowerCase() === VOCAB.DIR_META);
    if (!metaKey) return null;
    const section = doc[metaKey];
    if (!section || typeof section !== "object" || Array.isArray(section)) return null;
    return Object.keys(section).length > 0 ? section : null;
  } catch (_) {
    return null;
  }
}

/**
 * Map a TOML scalar (including smol-toml typed date/time objects) to a CsType.
 * @param {*} value
 * @returns {CsType}
 */
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

/**
 * Parse YAML text into SchemaNodes (reuses the JSON node walker).
 * @param {string} text
 * @returns {SchemaNode[]}
 */
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

/**
 * Parse JSON text into SchemaNodes.
 * @param {string} text
 * @returns {SchemaNode[]}
 */
function parseJson(text) {
  const doc = JSON.parse(text);
  return Object.entries(doc).map(([name, section]) => parseJsonNode(name, section));
}

/**
 * Recursively convert one JSON object into a SchemaNode.
 * @param {string} name
 * @param {object} obj
 * @returns {SchemaNode}
 */
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
        name:         key,
        csType:       val.csType ?? inferCsType(val.value),
        defaultValue: val.value,
        description:  val.description ?? "",
        isAsset:      false,
      });
    } else if (val && typeof val === "object") {
      // Nested section → child SchemaNode
      children.push(parseJsonNode(key, val));
    }
    // null or primitive at top level: skip (not a valid property wrapper)
  }

  return { name, properties, children };
}

/**
 * Map a JSON/YAML scalar to a CsType; recognises ISO date/time string patterns.
 * @param {*} value
 * @returns {CsType}
 */
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

/**
 * Classify a Date into DateOnly / DateTime / TimeOnly based on UTC components.
 * @param {Date} d
 * @returns {"DateOnly"|"DateTime"|"TimeOnly"}
 */
function inferDateCsType(d) {
  if (d.getUTCFullYear() < 1900) return "TimeOnly";
  const hasTime = d.getUTCHours() !== 0 || d.getUTCMinutes() !== 0 || d.getUTCSeconds() !== 0;
  return hasTime ? "DateTime" : "DateOnly";
}

// --- Utility ---

/**
 * Escape `& < > "` for safe embedding in XML attributes or text.
 * @param {string} str
 * @returns {string}
 */
function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

if (typeof module !== "undefined") {
  module.exports = { VOCAB, ALLOWED, VOCAB_DOCS, ALLOWED_DOCS, mapSheet, readMetaSheet, nodeHasAssets, parseJson, parseToml, readTomlMeta, parseYaml, escapeXml };
}
