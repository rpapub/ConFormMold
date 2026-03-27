// --- Config registry ---
// Each entry: { value, type, inputId }
// type: "text" | "select" | "switch"
// Adding a new setting = add one entry here. No other structural changes needed.

const CONFIG_DEFAULTS = {
  namespace:        { value: "Cpmf.Config", type: "text",   inputId: "cfg-namespace" },
  rootClassName:    { value: "CodedConfig",  type: "text",   inputId: "cfg-root-class" },
  outputFilename:   { value: "Config",      type: "text",   inputId: "cfg-filename" },
  dotnetVersion:    { value: "net6",        type: "select", inputId: "cfg-dotnet-version" },
  xmlDocComments:   { value: true,  type: "switch", inputId: "cfg-xml-docs" },
  generateToString: { value: false, type: "switch", inputId: "cfg-tostring" },
  generateToJson:   { value: false, type: "switch", inputId: "cfg-tojson"    },
  generatePristine: { value: false, type: "switch", inputId: "cfg-pristine"  },
  generateLoader:      { value: true,         type: "switch", inputId: "cfg-loader"     },
  generateReadonly:    { value: false,        type: "switch", inputId: "cfg-readonly"   },
  uipathVariableName:  { value: "out_ConFigTree", type: "text",   inputId: "cfg-uipath-var" },
};

const STORAGE_KEY = "configtree.config";

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
      const visibleNames = workbook.SheetNames.filter((n) => !n.startsWith("."));
      const nodes = visibleNames.map((name) => mapSheet(workbook, name));
      return { nodes, label: `${visibleNames.length} sheets: ${visibleNames.join(", ")}`, sourceFormat: "xlsx" };
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
  onNodesLoaded(workbook.SheetNames.filter((n) => !n.startsWith(".")).map((name) => mapSheet(workbook, name)));
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

    if (node.isAssetSheet || node.properties.some((p) => p.isAsset)) {
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
