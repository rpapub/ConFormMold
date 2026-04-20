/**
 * @file Browser UI controller — file picker, config persistence, sheet selection, output rendering.
 *
 * Exports: none (classic browser script; runs on DOMContentLoaded)
 * Consumes: parsers.js (mapSheet, parseJson, parseToml, parseYaml, readMetaSheet, readTomlMeta),
 *           cs-generator.js (generateCSharp), xaml-generator.js (generateXamlSnippet),
 *           Web Awesome custom elements, highlight.js, localStorage
 * Produces: DOM updates and persisted config under key "configtree.config"
 *
 * Related: (user file) → app.js → parsers.js → generators → app.js output tabs
 */

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

/**
 * Load persisted config from localStorage, merged over CONFIG_DEFAULTS values.
 * Corrupt or missing data falls back to defaults silently.
 * @returns {Object<string, *>} plain config object (no wrappers)
 */
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

/**
 * Persist the current `config` object to localStorage.
 */
function saveConfig() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (_) {}
}

/**
 * Set `config[key]` and sync the corresponding DOM input.
 * No-op when the key is not in CONFIG_DEFAULTS or the input is not mounted yet.
 * @param {string} key - CONFIG_DEFAULTS key
 * @param {*} val
 */
function setConfigValue(key, val) {
  const def = CONFIG_DEFAULTS[key];
  if (!def) return;
  config[key] = val;
  const el = document.getElementById(def.inputId);
  if (!el) return;
  if (def.type === "switch") el.checked = val;
  else el.value = val;
}

/**
 * Wire every CONFIG_DEFAULTS entry to its DOM input; input events persist to localStorage.
 */
function initSettings() {
  for (const [key, def] of Object.entries(CONFIG_DEFAULTS)) {
    setConfigValue(key, config[key]);

    // Wire input → config → storage
    // wa-input/wa-change are not reliable; use native DOM events instead
    const el = document.getElementById(def.inputId);
    if (!el) continue;
    const event = def.type === "text" ? "input" : "change";
    el.addEventListener(event, () => {
      config[key] = def.type === "switch" ? el.checked : el.value;
      saveConfig();
    });
  }
}

/**
 * Revert all UI inputs to the last persisted config, discarding per-file meta overrides.
 */
function resetConfigToStored() {
  const stored = loadConfig();
  for (const key of Object.keys(CONFIG_DEFAULTS)) setConfigValue(key, stored[key]);
}

/**
 * Classic Levenshtein distance (small-input, O(mn)).
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const curr = [i + 1];
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      curr.push(Math.min(curr[j] + 1, prev[j + 1] + 1, prev[j] + cost));
    }
    prev = curr;
  }
  return prev[b.length];
}

/**
 * Return the nearest key (case-insensitive) within Levenshtein distance 2, or null.
 * @param {string} input
 * @param {string[]} keys
 * @returns {string|null}
 */
function nearestKey(input, keys) {
  let best = null;
  let bestDist = Infinity;
  for (const k of keys) {
    const d = levenshtein(input.toLowerCase(), k.toLowerCase());
    if (d < bestDist) { bestDist = d; best = k; }
  }
  return bestDist <= 2 ? best : null;
}

/**
 * Overlay `_Meta` / `[_meta]` values onto the in-memory config + UI.
 * Emits a warning for any meta key that is not in CONFIG_DEFAULTS, with a
 * "did you mean" suggestion when a near match exists.
 * No-op when `meta` is null or empty.
 * @param {MetaOverrides|null} meta
 */
function applyMetaOverrides(meta) {
  if (!meta) return;
  const validKeys = Object.keys(CONFIG_DEFAULTS);
  for (const metaKey of Object.keys(meta)) {
    if (metaKey in CONFIG_DEFAULTS) continue;
    const suggestion = nearestKey(metaKey, validKeys);
    showWarning(suggestion
      ? `_Meta: unknown key '${metaKey}' — ignored. Did you mean '${suggestion}'?`
      : `_Meta: unknown key '${metaKey}' — ignored.`);
  }
  for (const [key, def] of Object.entries(CONFIG_DEFAULTS)) {
    if (!(key in meta)) continue;
    const raw = meta[key];
    const val = def.type === "switch"
      ? (typeof raw === "boolean" ? raw : String(raw).toLowerCase() === "true")
      : String(raw);
    setConfigValue(key, val);
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
      document.getElementById("copy-btn").setAttribute("disabled", "");
      document.querySelector(".tab-btn[data-tab='xaml']").setAttribute("disabled", "");
      clearSheetSelection();
      clearWarnings();
    }
  });

  document.getElementById("regenerate-btn").addEventListener("click", () => {
    if (lastSheets) regenerateFromSelection();
  });

  // Tab switching
  document.querySelectorAll(".tab-btn[data-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      activeTab = btn.dataset.tab;
      document.querySelectorAll(".tab-btn[data-tab]").forEach(b => {
        b.classList.toggle("active", b.dataset.tab === activeTab);
        b.setAttribute("aria-selected", b.dataset.tab === activeTab);
      });
      document.querySelectorAll(".tab-panel[id^='tab-']").forEach(p => {
        p.style.display = p.id === `tab-${activeTab}` ? "" : "none";
      });
    });
  });

  document.getElementById("copy-btn").addEventListener("click", () => {
    const elId = activeTab === "xaml" ? "output-xaml" : "output";
    const text = document.getElementById(elId).textContent;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById("copy-btn");
      const prev = btn.innerHTML;
      btn.textContent = "Copied!";
      setTimeout(() => { btn.innerHTML = prev; }, 1500);
    });
  });

  document.getElementById("download-btn").addEventListener("click", () => {
    if (activeTab === "xaml") {
      if (!lastXaml) return;
      const filename = (config.outputFilename || "Config") + ".xaml";
      const blob = new Blob([lastXaml], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } else {
      if (!lastOutput) return;
      const filename = (config.outputFilename || "Config") + ".cs";
      const blob = new Blob([lastOutput], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    }
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
      const meta = readMetaSheet(workbook);
      const visibleNames = workbook.SheetNames.filter((n) => !n.startsWith("_"));
      const nodes = visibleNames.map((name) => mapSheet(workbook, name));
      return { nodes, label: `${visibleNames.length} sheets: ${visibleNames.join(", ")}`, sourceFormat: "xlsx", meta };
    },
  },
  ".json": {
    read:  "text",
    parse: (text) => ({ nodes: parseJson(text),  label: "JSON", sourceFormat: "json" }),
  },
  ".toml": {
    read:  "text",
    parse: (text) => ({ nodes: parseToml(text), meta: readTomlMeta(text), label: "TOML", sourceFormat: "toml" }),
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

/**
 * Dispatch on file extension to the right parser and wire FileReader callbacks.
 * Unknown extensions surface an error to `#status-text`.
 * @param {File} file - from the file input
 */
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
      const { nodes, label, sourceFormat, meta } = parser.parse(e.target.result);
      status.textContent = `Loaded: ${file.name} (${label})`;
      console.info("File loaded:", file.name, nodes);
      onNodesLoaded(nodes, sourceFormat, meta);
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

/**
 * Post-parse pipeline: apply meta overrides, render the sheet picker, regenerate output.
 * @param {SchemaNode[]} nodes
 * @param {SourceFormat} sourceFormat
 * @param {MetaOverrides|null} [meta]
 */
function onNodesLoaded(nodes, sourceFormat, meta) {
  resetConfigToStored();
  applyMetaOverrides(meta);
  lastSheets = nodes;
  lastSourceFormat = sourceFormat;
  nodes.forEach((n) => (n.warnings || []).forEach(showWarning));
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

/**
 * Legacy xlsx entry point retained for the existing FORMAT_PARSERS path.
 * @param {object} workbook - SheetJS workbook
 */
function onWorkbookLoaded(workbook) {
  // Legacy entry point — still used by the xlsx branch in FORMAT_PARSERS
  onNodesLoaded(workbook.SheetNames.filter((n) => !n.startsWith("_")).map((name) => mapSheet(workbook, name)));
}

/**
 * Re-run the generators using the currently-checked sheets.
 * Clears output when no sheet is selected.
 */
function regenerateFromSelection() {
  const sheets = selectedSheets();
  if (sheets.length === 0) {
    lastOutput = "";
    lastXaml   = "";
    document.getElementById("output").textContent = "";
    document.getElementById("output-xaml").textContent = "";
    document.getElementById("download-btn").setAttribute("disabled", "");
    document.getElementById("copy-btn").setAttribute("disabled", "");
    document.querySelector(".tab-btn[data-tab='xaml']").setAttribute("disabled", "");
  } else {
    onSheetsReady(sheets);
  }
}

/**
 * Render a checkbox list of sheets, tagging asset sheets with a badge.
 * @param {SchemaNode[]} nodes
 */
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

/**
 * Return the subset of `lastSheets` whose checkbox is checked.
 * @returns {SchemaNode[]}
 */
function selectedSheets() {
  const checkboxes = document.querySelectorAll("#sheet-checkboxes wa-checkbox");
  const selected = new Set([...checkboxes].filter((cb) => cb.checked).map((cb) => cb.dataset.sheet));
  return lastSheets.filter((s) => selected.has(s.name));
}

/**
 * Empty the sheet checkbox UI and hide the container.
 */
function clearSheetSelection() {
  document.getElementById("sheet-checkboxes").innerHTML = "";
  document.getElementById("sheet-selection").style.display = "none";
}

/**
 * Append a `<wa-alert variant="warning">` to `#warnings`.
 * @param {string} message
 */
function showWarning(message) {
  const alert = document.createElement("wa-alert");
  alert.setAttribute("variant", "warning");
  alert.setAttribute("open", "");
  alert.textContent = message;
  document.getElementById("warnings").appendChild(alert);
}

/**
 * Empty the `#warnings` container.
 */
function clearWarnings() {
  document.getElementById("warnings").innerHTML = "";
}

let lastOutput = "";
let lastXaml   = "";
let activeTab  = "cs";

/**
 * Generate C# + XAML from selected sheets, update the output tabs, and run hljs highlighting.
 * @param {SchemaNode[]} sheets
 */
function onSheetsReady(sheets) {
  lastOutput = generateCSharp(sheets, lastSourceFormat);
  lastXaml   = generateXamlSnippet(sheets);

  const elCs = document.getElementById("output");
  elCs.textContent = lastOutput;
  if (typeof hljs !== "undefined") {
    requestAnimationFrame(() => {
      delete elCs.dataset.highlighted;
      hljs.highlightElement(elCs);
    });
  } else {
    console.error("highlight.js not loaded");
  }

  const elXaml = document.getElementById("output-xaml");
  elXaml.textContent = lastXaml;
  if (typeof hljs !== "undefined") {
    requestAnimationFrame(() => {
      delete elXaml.dataset.highlighted;
      hljs.highlightElement(elXaml);
    });
  }

  document.getElementById("regenerate-btn").removeAttribute("disabled");
  document.getElementById("download-btn").removeAttribute("disabled");
  document.getElementById("copy-btn").removeAttribute("disabled");
  document.querySelector(".tab-btn[data-tab='xaml']").removeAttribute("disabled");
}



