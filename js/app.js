// --- CodeWriter (#24) ---

class CodeWriter {
  #depth = 0;
  #lines = [];
  #tab   = "    ";

  write(line = "") { this.#lines.push(this.#tab.repeat(this.#depth) + line); return this; }
  blank()          { this.#lines.push(""); return this; }
  indent()         { this.#depth++; return this; }
  dedent()         { this.#depth--; return this; }
  toString()       { return this.#lines.join("\n"); }
}

// --- Config registry ---
// Each entry: { value, type, inputId }
// type: "text" | "select" | "switch"
// Adding a new setting = add one entry here. No other structural changes needed.

const CONFIG_DEFAULTS = {
  namespace:        { value: "Cpmf.Config", type: "text",   inputId: "cfg-namespace" },
  rootClassName:    { value: "AppConfig",   type: "text",   inputId: "cfg-root-class" },
  outputFilename:   { value: "Config",      type: "text",   inputId: "cfg-filename" },
  dotnetVersion:    { value: "net6",        type: "select", inputId: "cfg-dotnet-version" },
  xmlDocComments:   { value: true,  type: "switch", inputId: "cfg-xml-docs" },
  generateToString: { value: false, type: "switch", inputId: "cfg-tostring" },
  generateToJson:   { value: false, type: "switch", inputId: "cfg-tojson"    },
  generatePristine: { value: false, type: "switch", inputId: "cfg-pristine"  },
  generateLoader:   { value: false, type: "switch", inputId: "cfg-loader"    },
};

const STORAGE_KEY = "conformmold.config";

const config = loadConfig();

function loadConfig() {
  const defaults = Object.fromEntries(
    Object.entries(CONFIG_DEFAULTS).map(([k, v]) => [k, v.value])
  );
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) Object.assign(defaults, JSON.parse(saved));
  } catch (_) {}
  return defaults;
}

function saveConfig() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (_) {}
}

function initSettings() {
  for (const [key, def] of Object.entries(CONFIG_DEFAULTS)) {
    const el = document.getElementById(def.inputId);
    if (!el) continue;

    // Sync input → current config value (may differ from default if loaded from storage)
    if (def.type === "switch") {
      el.checked = config[key];
    } else {
      el.value = config[key];
    }

    // Wire input → config → storage
    // wa-input/wa-change are not reliable; use native DOM events instead
    const event = def.type === "text" ? "input" : "change";
    el.addEventListener(event, () => {
      config[key] = def.type === "switch" ? el.checked : el.value;
      saveConfig();
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof XLSX === "undefined") {
    console.error("SheetJS failed to load.");
  } else {
    console.info(`SheetJS loaded: ${XLSX.version}`);
  }

  // Wait for Web Awesome custom elements to upgrade before setting values on them
  await Promise.all([
    customElements.whenDefined("wa-input"),
    customElements.whenDefined("wa-select"),
    customElements.whenDefined("wa-switch"),
    customElements.whenDefined("wa-file-input"),
  ]);
  initSettings();

  const fileInput = document.getElementById("file-input");
  fileInput.addEventListener("wa-invalid", () => {
    document.getElementById("status-text").textContent = "Error: only .xlsx files are supported.";
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) {
      handleFile(fileInput.files[0]);
    } else {
      // File removed — clear output and status
      lastSheets = null;
      lastOutput = "";
      document.getElementById("output").textContent = "";
      document.getElementById("status-text").textContent = "";
      document.getElementById("regenerate-btn").setAttribute("disabled", "");
      document.getElementById("download-btn").setAttribute("disabled", "");
      document.getElementById("uipath-snippet").style.display = "none";
      clearSheetSelection();
      clearWarnings();
    }
  });

  document.getElementById("regenerate-btn").addEventListener("click", () => {
    if (lastSheets) regenerateFromSelection();
  });

  document.getElementById("sheets-regenerate-btn").addEventListener("click", () => {
    if (lastSheets) regenerateFromSelection();
  });

  document.getElementById("xaml-copy-btn").addEventListener("click", () => {
    navigator.clipboard.writeText(generateXamlSnippet()).then(() => {
      const btn = document.getElementById("xaml-copy-btn");
      btn.textContent = "Copied!";
      setTimeout(() => { btn.innerHTML = '<wa-icon slot="start" name="clipboard"></wa-icon> Copy Assign'; }, 1500);
    });
  });

  document.getElementById("download-btn").addEventListener("click", () => {
    if (!lastOutput) return;
    const filename = (config.outputFilename || "Config") + ".cs";
    const blob = new Blob([lastOutput], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  });
});

function handleFile(file) {
  const status = document.getElementById("status-text");
  clearWarnings();

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    status.textContent = "Error: only .xlsx files are supported.";
    return;
  }

  status.textContent = `Loading: ${file.name}`;

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const workbook = XLSX.read(e.target.result, { type: "array", cellDates: true });
      status.textContent = `Loaded: ${file.name} (${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(", ")})`;
      console.info("Workbook loaded:", workbook.SheetNames);
      onWorkbookLoaded(workbook);
    } catch (err) {
      status.textContent = `Error: could not parse file — ${err.message}`;
      console.error("Failed to parse workbook:", err);
    }
  };

  reader.onerror = () => {
    status.textContent = "Error: could not read file.";
  };

  reader.readAsArrayBuffer(file);
}

// --- Sheet mapper (#24 SchemaNode IR) ---
//
// SchemaNode: { name, properties: Property[], children: SchemaNode[], warning? }
// Property:   { name, csType, description, isAsset, assetName?, folder? }
//
// xlsx path: children is always [] — nesting only used by future JSON/TOML/YAML parsers.

let lastSheets = null;

function onWorkbookLoaded(workbook) {
  lastSheets = workbook.SheetNames.map((name) => mapSheet(workbook, name));
  lastSheets.filter((s) => s.warning).forEach((s) => showWarning(s.warning));
  renderSheetSelection(lastSheets);
  regenerateFromSelection();
}

function regenerateFromSelection() {
  const sheets = selectedSheets();
  if (sheets.length === 0) {
    lastOutput = "";
    document.getElementById("output").textContent = "";
    document.getElementById("download-btn").setAttribute("disabled", "");
  } else {
    onSheetsReady(sheets);
  }
}

function renderSheetSelection(nodes) {
  const container = document.getElementById("sheet-checkboxes");
  container.innerHTML = "";
  for (const node of nodes) {
    const item = document.createElement("div");
    item.className = "sheet-item";

    const cb = document.createElement("wa-checkbox");
    cb.checked = true;
    cb.dataset.sheet = node.name;

    const label = document.createElement("span");
    label.textContent = node.name;

    item.appendChild(cb);
    item.appendChild(label);

    if (node.properties.some((p) => p.isAsset)) {
      const badge = document.createElement("wa-badge");
      badge.setAttribute("variant", "neutral");
      badge.setAttribute("pill", "");
      badge.textContent = "asset";
      item.appendChild(badge);
    }

    container.appendChild(item);
  }
  document.getElementById("sheet-selection").style.display = "";
}

function selectedSheets() {
  const checkboxes = document.querySelectorAll("#sheet-checkboxes wa-checkbox");
  const selected = new Set([...checkboxes].filter((cb) => cb.checked).map((cb) => cb.dataset.sheet));
  return lastSheets.filter((s) => selected.has(s.name));
}

function clearSheetSelection() {
  document.getElementById("sheet-checkboxes").innerHTML = "";
  document.getElementById("sheet-selection").style.display = "none";
}

function showWarning(message) {
  const alert = document.createElement("wa-alert");
  alert.setAttribute("variant", "warning");
  alert.setAttribute("open", "");
  alert.textContent = message;
  document.getElementById("warnings").appendChild(alert);
}

function clearWarnings() {
  document.getElementById("warnings").innerHTML = "";
}

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
      properties.push({
        name,
        csType:      "OrchestratorAsset",
        description: row[3] != null ? String(row[3]).trim() : "",
        isAsset:     true,
        assetName:   row[1] != null ? String(row[1]).trim() : "",
        folder:      row[2] != null ? String(row[2]).trim() : "",
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

  return { name: sheetName, properties, children: [] };
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

// --- Class generator (#24 CodeWriter refactor) ---

let lastOutput = "";

function onSheetsReady(sheets) {
  lastOutput = generateCSharp(sheets);
  const el = document.getElementById("output");
  el.textContent = lastOutput;
  if (typeof hljs !== "undefined") {
    requestAnimationFrame(() => {
      delete el.dataset.highlighted;
      hljs.highlightElement(el);
    });
  } else {
    console.error("highlight.js not loaded");
  }
  document.getElementById("regenerate-btn").removeAttribute("disabled");
  document.getElementById("download-btn").removeAttribute("disabled");
  document.getElementById("uipath-snippet").style.display = "";
}

function generateCSharp(nodes) {
  const w = new CodeWriter();

  // Usings
  w.write("using System;");
  if (config.generateToJson)    w.write("using System.Text.Json;");
  if (config.generateLoader)    w.write("using System.Data;");
  if (config.generatePristine)  w.write("using System.Collections.Generic;").write("using System.Linq;");
  if (config.generateLoader && !config.generatePristine) w.write("using System.Collections.Generic;");
  w.blank();

  w.write(`namespace ${config.namespace}`).write("{").indent();

  // Root aggregator class
  if (config.xmlDocComments) w.write("/// <summary>Root configuration object.</summary>");
  w.write(`public class ${config.rootClassName}`).write("{").indent();

  for (const node of nodes) {
    w.write(`public ${toClassName(node.name)} ${toPascalCase(node.name)} { get; set; } = new();`);
  }

  if (config.generateToString) {
    const props = nodes.map((n) => {
      const p = toPascalCase(n.name);
      return `${p}={${p}}`;
    }).join(", ");
    w.write(`public override string ToString() =>`).indent();
    w.write(`$"${config.rootClassName} {{ ${props} }}";`).dedent();
  }

  if (config.generateToJson) {
    w.write(`public string ToJson() => JsonSerializer.Serialize(this);`);
  }

  if (config.generateLoader) {
    w.blank();
    const rootClass = config.rootClassName;
    w.write(`public static ${rootClass} Load(Dictionary<string, DataTable> tables)`);
    w.write("{").indent();
    w.write(`var cfg = new ${rootClass}();`);
    for (const node of nodes) {
      const propName = toPascalCase(node.name);
      const cls      = toClassName(node.name);
      const varName  = `t_${propName}`;
      w.write(`if (tables.TryGetValue("${node.name}", out var ${varName})) cfg.${propName} = ${cls}.FromDataTable(${varName});`);
    }
    w.write("return cfg;");
    w.dedent().write("}");
  }

  if (config.generatePristine) {
    w.blank();
    w.write("public static readonly IReadOnlyDictionary<string, IReadOnlyList<string>> Schema =");
    w.indent().write("new Dictionary<string, IReadOnlyList<string>>").write("{").indent();
    const paths = [];
    for (const node of nodes) collectSchemaPaths(node, "", paths);
    for (const entry of paths) w.write(entry);
    w.dedent().write("};").dedent();
    w.blank();
    w.write("public DriftReport CheckPristine(IDictionary<string, IEnumerable<string>> actualKeys)");
    w.write("{").indent();
    w.write("var missing = new List<string>();");
    w.write("var extra   = new List<string>();");
    w.write("foreach (var (sheet, expected) in Schema)");
    w.write("{").indent();
    w.write("var actual      = actualKeys.TryGetValue(sheet, out var k)");
    w.write("    ? new HashSet<string>(k) : new HashSet<string>();");
    w.write("var expectedSet = new HashSet<string>(expected);");
    w.write(`missing.AddRange(expectedSet.Where(e => !actual.Contains(e)).Select(e => $"{sheet}.{e}"));`);
    w.write(`extra.AddRange(actual.Where(a => !expectedSet.Contains(a)).Select(a => $"{sheet}.{a}"));`);
    w.dedent().write("}");
    w.write("return new DriftReport(missing, extra);");
    w.dedent().write("}");
  }

  w.dedent().write("}");

  // DriftReport class — emitted once when generatePristine is on
  if (config.generatePristine) {
    w.blank();
    w.write("public class DriftReport").write("{").indent();
    w.write("public IReadOnlyList<string> MissingKeys { get; }");
    w.write("public IReadOnlyList<string> ExtraKeys   { get; }");
    w.write("public bool IsPristine => !MissingKeys.Any() && !ExtraKeys.Any();");
    w.blank();
    w.write("public DriftReport(IReadOnlyList<string> missing, IReadOnlyList<string> extra)");
    w.write("{").indent();
    w.write("MissingKeys = missing;");
    w.write("ExtraKeys   = extra;");
    w.dedent().write("}");
    w.blank();
    w.write("public override string ToString() =>").indent();
    w.write("IsPristine");
    w.write(`    ? "Pristine"`);
    w.write(`    : $"Drift detected — Missing: [{string.Join(", ", MissingKeys)}] Extra: [{string.Join(", ", ExtraKeys)}]";`);
    w.dedent();
    w.dedent().write("}");
  }

  // OrchestratorAsset helper — emitted once if any node has asset properties
  if (nodes.some(nodeHasAssets)) {
    w.blank();
    w.write("public class OrchestratorAsset").write("{").indent();
    w.write('public string AssetName { get; set; } = "";');
    w.write('public string Folder { get; set; } = "";');
    w.dedent().write("}");
  }

  // One class per top-level node (recurses into children for nested sections)
  for (const node of nodes) {
    emitClass(w, node);
  }

  w.dedent().write("}");
  return w.toString();
}

// Recursively emit a class for a SchemaNode and all its children (nested classes, Option A).
// Called at namespace depth — children are emitted as nested classes inside their parent.
function emitClass(w, node) {
  const className = toClassName(node.name);
  w.blank().write(`public class ${className}`).write("{").indent();

  if (node.properties.length === 0 && node.children.length === 0) {
    w.write("// No data rows found in source sheet.");
  } else {
    // Leaf properties
    for (const prop of node.properties) {
      if (config.xmlDocComments && prop.description)
        w.write(`/// <summary>${escapeXml(prop.description)}</summary>`);
      const propName = toPascalCase(prop.name);
      if (prop.isAsset) {
        w.write(`public OrchestratorAsset ${propName} { get; set; } = new();`);
      } else {
        const def = defaultInitializer(prop.csType);
        w.write(`public ${prop.csType} ${propName} { get; set; }${def ? ` ${def}` : ""}`);
      }
    }
    // Child section properties (reference nested classes defined below)
    for (const child of node.children) {
      w.write(`public ${toClassName(child.name)} ${toPascalCase(child.name)} { get; set; } = new();`);
    }
    // Nested class definitions (Option A — scoped inside parent)
    for (const child of node.children) {
      emitClass(w, child);
    }

    // DataTable loader (#27)
    if (config.generateLoader) {
      const cls = toClassName(node.name);
      w.blank();
      w.write(`public static ${cls} FromDataTable(DataTable dt)`);
      w.write("{").indent();
      w.write(`var cfg = new ${cls}();`);
      w.write("foreach (DataRow row in dt.Rows)");
      w.write("{").indent();
      w.write("var key   = row[0]?.ToString()?.Trim();");
      w.write(`var value = row[1]?.ToString()?.Trim() ?? "";`);
      w.write("switch (key)").write("{").indent();
      for (const prop of node.properties) {
        const propName = toPascalCase(prop.name);
        if (prop.isAsset) {
          w.write(`case "${prop.name}":`).indent();
          w.write(`cfg.${propName}.AssetName = row[1]?.ToString()?.Trim() ?? "";`);
          w.write(`cfg.${propName}.Folder    = row[2]?.ToString()?.Trim() ?? "";`);
          w.write("break;").dedent();
        } else if (prop.csType === "string") {
          w.write(`case "${prop.name}": cfg.${propName} = value; break;`);
        } else if (prop.csType === "int") {
          w.write(`case "${prop.name}":`).indent();
          w.write(`if (int.TryParse(value, out var v_${propName})) cfg.${propName} = v_${propName};`);
          w.write("break;").dedent();
        } else if (prop.csType === "double") {
          w.write(`case "${prop.name}":`).indent();
          w.write(`if (double.TryParse(value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var v_${propName})) cfg.${propName} = v_${propName};`);
          w.write("break;").dedent();
        } else if (prop.csType === "bool") {
          w.write(`case "${prop.name}":`).indent();
          w.write(`if (bool.TryParse(value, out var v_${propName})) cfg.${propName} = v_${propName};`);
          w.write("break;").dedent();
        } else if (prop.csType === "DateOnly") {
          w.write(`case "${prop.name}":`).indent();
          w.write(`if (DateOnly.TryParse(value, out var v_${propName})) cfg.${propName} = v_${propName};`);
          w.write("break;").dedent();
        } else if (prop.csType === "DateTime") {
          w.write(`case "${prop.name}":`).indent();
          w.write(`if (DateTime.TryParse(value, out var v_${propName})) cfg.${propName} = v_${propName};`);
          w.write("break;").dedent();
        } else if (prop.csType === "TimeOnly") {
          w.write(`case "${prop.name}":`).indent();
          w.write(`if (TimeOnly.TryParse(value, out var v_${propName})) cfg.${propName} = v_${propName};`);
          w.write("break;").dedent();
        }
      }
      w.dedent().write("}");
      w.dedent().write("}");
      w.write("return cfg;");
      w.dedent().write("}");
    }
  }

  w.dedent().write("}");
}

// Collect (path → property names) pairs for the Schema manifest (#22).
// For flat xlsx nodes: path = node.name (no dots).
// For nested nodes: path = "Parent.Child" (dotted).
function collectSchemaPaths(node, prefix, out) {
  const path = prefix ? `${prefix}.${node.name}` : node.name;
  if (node.children.length > 0) {
    for (const child of node.children) collectSchemaPaths(child, path, out);
  } else {
    const keys = node.properties.map((p) => `"${p.name}"`).join(", ");
    out.push(`["${path}"] = new[] { ${keys} },`);
  }
}

function toClassName(name) {
  return name.split(/[.\-_]/).map(toPascalCase).join("") + "Config";
}

function toPascalCase(str) {
  return str
    .replace(/[_\-]/g, " ")
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function defaultInitializer(csType) {
  switch (csType) {
    case "string":            return '= ""';
    case "OrchestratorAsset": return "= new()";
    default:                  return "";
  }
}

// --- UiPath clipboard snippet (#28) ---

function generateXamlSnippet() {
  const className = config.rootClassName || "AppConfig";
  const refId     = "__ReferenceID0";

  // UiPath Studio clipboard envelope — utf-16 declaration is required by Studio's paste handler
  return `<?xml version="1.0" encoding="utf-16"?>`
    + `<ClipboardData Version="1.0"`
    + ` xmlns="http://schemas.microsoft.com/netfx/2009/xaml/activities/presentation"`
    + ` xmlns:p="http://schemas.microsoft.com/netfx/2009/xaml/activities"`
    + ` xmlns:sap2010="http://schemas.microsoft.com/netfx/2010/xaml/activities/presentation"`
    + ` xmlns:scg="clr-namespace:System.Collections.Generic;assembly=System.Private.CoreLib"`
    + ` xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">`
    + `<ClipboardData.Data>`
    + `<scg:List x:TypeArguments="x:Object" Capacity="1">`
    + `<p:Assign x:Name="${refId}" VirtualizedContainerService.HintSize="449.6,165.6">`
    + `<p:Assign.To><p:OutArgument x:TypeArguments="x:Object">[Config]</p:OutArgument></p:Assign.To>`
    + `<p:Assign.Value><p:InArgument x:TypeArguments="x:Object">[${className}.Load(tables)]</p:InArgument></p:Assign.Value>`
    + `</p:Assign>`
    + `</scg:List>`
    + `</ClipboardData.Data>`
    + `<ClipboardData.Metadata>`
    + `<scg:List x:TypeArguments="x:Object" Capacity="4">`
    + `<scg:List x:TypeArguments="x:Object" Capacity="1">`
    + `<x:Reference>${refId}</x:Reference>`
    + `</scg:List></scg:List>`
    + `</ClipboardData.Metadata>`
    + `</ClipboardData>`;
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

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
