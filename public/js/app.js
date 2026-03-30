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

let lastOutput = "";
let lastXaml   = "";
let activeTab  = "cs";

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



