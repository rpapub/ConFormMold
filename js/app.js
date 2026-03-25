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
      lastSheets       = null;
      lastSourceFormat = null;
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

// --- File picker dispatch (#29) ---
//
// FORMAT_PARSERS maps extension → { read: "text"|"binary", parse: fn }
// "binary" parsers receive an ArrayBuffer; "text" parsers receive a string.

const FORMAT_PARSERS = {
  ".xlsx": {
    read:  "binary",
    parse: (buf) => {
      const workbook = XLSX.read(buf, { type: "array", cellDates: true });
      const nodes = workbook.SheetNames.map((name) => mapSheet(workbook, name));
      return { nodes, label: `${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(", ")}`, sourceFormat: "xlsx" };
    },
  },
  ".json": {
    read:  "text",
    parse: (text) => ({ nodes: parseJson(text),  label: "JSON", sourceFormat: "json" }),
  },
  ".toml": {
    read:  "text",
    parse: (text) => ({ nodes: parseToml(text),  label: "TOML", sourceFormat: "toml" }),
  },
  ".yaml": {
    read:  "text",
    parse: (text) => ({ nodes: parseYaml(text),  label: "YAML", sourceFormat: "yaml" }),
  },
  ".yml": {
    read:  "text",
    parse: (text) => ({ nodes: parseYaml(text),  label: "YAML", sourceFormat: "yaml" }),
  },
};

function handleFile(file) {
  const status = document.getElementById("status-text");
  clearWarnings();

  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const parser = FORMAT_PARSERS[ext];

  if (!parser) {
    status.textContent = `Error: unsupported format "${ext}". Supported: ${Object.keys(FORMAT_PARSERS).join(", ")}`;
    return;
  }

  status.textContent = `Loading: ${file.name}`;

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const { nodes, label, sourceFormat } = parser.parse(e.target.result);
      status.textContent = `Loaded: ${file.name} (${label})`;
      console.info("File loaded:", file.name, nodes);
      onNodesLoaded(nodes, sourceFormat);
    } catch (err) {
      status.textContent = `Error: could not parse file — ${err.message}`;
      console.error("Failed to parse:", err);
    }
  };

  reader.onerror = () => { status.textContent = "Error: could not read file."; };

  if (parser.read === "binary") {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file);
  }
}

function onNodesLoaded(nodes, sourceFormat) {
  lastSheets = nodes;
  lastSourceFormat = sourceFormat;
  nodes.filter((n) => n.warning).forEach((n) => showWarning(n.warning));
  renderSheetSelection(nodes);
  regenerateFromSelection();
}

// --- Sheet mapper (#24 SchemaNode IR) ---
//
// SchemaNode: { name, properties: Property[], children: SchemaNode[], warning? }
// Property:   { name, csType, description, isAsset, assetName?, folder? }
//
// xlsx path: children is always [] — nesting only used by future JSON/TOML/YAML parsers.

let lastSheets       = null;
let lastSourceFormat = null;

function onWorkbookLoaded(workbook) {
  // Legacy entry point — still used by the xlsx branch in FORMAT_PARSERS
  onNodesLoaded(workbook.SheetNames.map((name) => mapSheet(workbook, name)));
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
  lastOutput = generateCSharp(sheets, lastSourceFormat);
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

function generateCSharp(nodes, sourceFormat = "xlsx") {
  const w = new CodeWriter();

  // Usings
  w.write("using System;");
  if (config.generateToJson)                                     w.write("using System.Text.Json;");
  if (config.generateLoader && sourceFormat === "xlsx")          w.write("using System.Data;");
  if (config.generatePristine)                                   w.write("using System.Collections.Generic;").write("using System.Linq;");
  if (config.generateLoader && !config.generatePristine)         w.write("using System.Collections.Generic;");
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
    if (sourceFormat === "xlsx") {
      // xlsx: Load from pre-read DataTables (one per sheet)
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
    } else if (sourceFormat === "json") {
      // JSON: deserialize directly with System.Text.Json
      w.write(`public static ${rootClass} LoadJson(string filePath)`);
      w.write("{").indent();
      w.write("var json = System.IO.File.ReadAllText(filePath);");
      w.write(`return System.Text.Json.JsonSerializer.Deserialize<${rootClass}>(json)`);
      w.write(`    ?? throw new InvalidOperationException("Failed to deserialize config.");`);
      w.dedent().write("}");
    } else if (sourceFormat === "toml") {
      // TOML: requires NuGet package Tomlyn
      w.write("// Requires NuGet: Tomlyn");
      w.write(`public static ${rootClass} LoadToml(string filePath)`);
      w.write("{").indent();
      w.write("var toml = System.IO.File.ReadAllText(filePath);");
      w.write(`return Tomlyn.Toml.ToModel<${rootClass}>(toml);`);
      w.dedent().write("}");
    } else if (sourceFormat === "yaml") {
      // YAML: requires NuGet package YamlDotNet
      w.write("// Requires NuGet: YamlDotNet");
      w.write(`public static ${rootClass} LoadYaml(string filePath)`);
      w.write("{").indent();
      w.write("var yaml = System.IO.File.ReadAllText(filePath);");
      w.write("var deserializer = new YamlDotNet.Serialization.DeserializerBuilder()");
      w.write("    .WithNamingConvention(YamlDotNet.Serialization.NamingConventions.PascalCaseNamingConvention.Instance)");
      w.write("    .Build();");
      w.write(`return deserializer.Deserialize<${rootClass}>(yaml);`);
      w.dedent().write("}");
    }
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

  // Section classes — emitted immediately after root class so developer reads top-down (#30)
  for (const node of nodes) {
    emitClass(w, node, sourceFormat);
  }

  // OrchestratorAsset helper — supporting value type referenced by section classes
  if (nodes.some(nodeHasAssets)) {
    w.blank();
    w.write("public class OrchestratorAsset").write("{").indent();
    w.write('public string AssetName { get; set; } = "";');
    w.write('public string Folder { get; set; } = "";');
    w.dedent().write("}");
  }

  // DriftReport class — infrastructure; emitted last when generatePristine is on
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

  w.dedent().write("}");
  return w.toString();
}

// Recursively emit a class for a SchemaNode and all its children (nested classes, Option A).
// Called at namespace depth — children are emitted as nested classes inside their parent.
// sourceFormat: "xlsx" | "json" | "toml" | "yaml" — only xlsx emits FromDataTable().
function emitClass(w, node, sourceFormat = "xlsx") {
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
      emitClass(w, child, sourceFormat);
    }

    // DataTable loader (#27) — xlsx only; JSON/TOML/YAML deserialize at root level
    if (config.generateLoader && sourceFormat === "xlsx") {
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
  const nodes     = lastSheets ?? [];
  const className = config.rootClassName || "AppConfig";
  const fmt       = lastSourceFormat ?? "xlsx";

  // Non-xlsx formats: simple Assign with the format-specific Load method
  if (fmt !== "xlsx") {
    const methodName = fmt === "json" ? "LoadJson" : fmt === "toml" ? "LoadToml" : "LoadYaml";
    if (!config.generateLoader) {
      return xamlEnvelope([xamlAssign("__ReferenceID0", "Config", `${className}.${methodName}(in_ConfigFilePath)`)], ["__ReferenceID0"]);
    }
    return xamlEnvelope([xamlAssign("__ReferenceID0", "Config", `${className}.${methodName}(in_ConfigFilePath)`)], ["__ReferenceID0"]);
  }

  // xlsx without the loader toggle: minimal single Assign
  if (!config.generateLoader || nodes.length === 0) {
    return xamlEnvelope([xamlAssign("__ReferenceID0", "Config", `${className}.Load(tables)`)], ["__ReferenceID0"]);
  }

  // Full snippet: ReadRange per sheet + Load() Assign + ForEach per asset sheet
  const acts = [];
  const refs = [];
  let   idx  = 0;
  const nextId = () => `__ReferenceID${idx++}`;

  const standardNodes = nodes.filter((n) => !n.properties.some((p) => p.isAsset));
  const assetNodes    = nodes.filter((n) =>  n.properties.some((p) => p.isAsset));

  // Block 1: ReadRange per sheet inside ExcelApplicationScope
  const rangeIds = nodes.map(() => nextId());
  const scopeId  = nextId();
  const readRanges = nodes.map((n, i) =>
    `<ui:ReadRange x:Name="${rangeIds[i]}" SheetName="${n.name}" DataTable="[dt_${toPascalCase(n.name)}]" AddHeaders="True" />`
  ).join("");
  acts.push(
    `<ui:ExcelApplicationScope x:Name="${scopeId}" WorkbookPath="[in_ConfigFilePath]">`
    + `<ui:ExcelApplicationScope.Body><p:ActivityAction x:TypeArguments="x:Object">`
    + `<p:ActivityAction.Handler><p:Sequence>${readRanges}</p:Sequence></p:ActivityAction.Handler>`
    + `</p:ActivityAction></ui:ExcelApplicationScope.Body></ui:ExcelApplicationScope>`
  );
  refs.push(scopeId, ...rangeIds);

  // Block 2: Load() Assign (standard sheets only)
  const dictEntries = standardNodes
    .map((n) => `{"${n.name}", dt_${toPascalCase(n.name)}}`)
    .join(", ");
  const loadId = nextId();
  acts.push(xamlAssign(loadId, "Config",
    `${className}.Load(New Dictionary(Of String, DataTable) From {${dictEntries}})`
  ));
  refs.push(loadId);

  // Block 3: ForEach loop per asset sheet
  for (const n of assetNodes) {
    const forId   = nextId();
    const catchId = nextId();
    acts.push(
      `<p:ForEach x:Name="${forId}" x:TypeArguments="sd:DataRow" Values="[dt_${toPascalCase(n.name)}.AsEnumerable()]">`
      + `<p:ActivityAction x:TypeArguments="sd:DataRow">`
      + `<p:ActivityAction.Argument><p:DelegateInArgument x:TypeArguments="sd:DataRow" Name="assetRow" /></p:ActivityAction.Argument>`
      + `<p:TryCatch x:Name="${catchId}">`
      + `<p:TryCatch.Try>`
      + `<!-- TODO: add GetRobotAsset activity here -->`
      + `<!-- AssetName  = assetRow("Asset").ToString() -->`
      + `<!-- FolderPath = assetRow("OrchestratorAssetFolder").ToString() -->`
      + `</p:TryCatch.Try>`
      + `<p:TryCatch.Catches><p:Catch x:TypeArguments="x:Exception" /></p:TryCatch.Catches>`
      + `</p:TryCatch>`
      + `</p:ActivityAction></p:ForEach>`
    );
    refs.push(forId, catchId);
  }

  return xamlEnvelope(acts, refs, /* hasUi */ true, /* hasSd */ assetNodes.length > 0);
}

function xamlAssign(id, to, value) {
  return `<p:Assign x:Name="${id}" VirtualizedContainerService.HintSize="449.6,165.6">`
    + `<p:Assign.To><p:OutArgument x:TypeArguments="x:Object">[${to}]</p:OutArgument></p:Assign.To>`
    + `<p:Assign.Value><p:InArgument x:TypeArguments="x:Object">[${value}]</p:InArgument></p:Assign.Value>`
    + `</p:Assign>`;
}

function xamlEnvelope(activities, refs, hasUi = false, hasSd = false) {
  const ns = `<?xml version="1.0" encoding="utf-16"?>`
    + `<ClipboardData Version="1.0"`
    + ` xmlns="http://schemas.microsoft.com/netfx/2009/xaml/activities/presentation"`
    + ` xmlns:p="http://schemas.microsoft.com/netfx/2009/xaml/activities"`
    + ` xmlns:sap2010="http://schemas.microsoft.com/netfx/2010/xaml/activities/presentation"`
    + ` xmlns:scg="clr-namespace:System.Collections.Generic;assembly=System.Private.CoreLib"`
    + ` xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"`
    + (hasUi ? ` xmlns:ui="http://schemas.uipath.com/workflow/activities"` : ``)
    + (hasSd ? ` xmlns:sd="clr-namespace:System.Data;assembly=System.Data.Common"` : ``);

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

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
