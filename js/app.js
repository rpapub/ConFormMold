// --- Config registry ---
// Each entry: { value, type, inputId }
// type: "text" | "select" | "switch"
// Adding a new setting = add one entry here. No other structural changes needed.

const CONFIG_DEFAULTS = {
  namespace:      { value: "Cpmf.Config", type: "text",   inputId: "cfg-namespace" },
  rootClassName:  { value: "AppConfig",   type: "text",   inputId: "cfg-root-class" },
  dotnetVersion:  { value: "net6",        type: "select", inputId: "cfg-dotnet-version" },
  xmlDocComments: { value: true,          type: "switch", inputId: "cfg-xml-docs" },
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

    // Wire input → config → storage → regenerate
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
    }
  });

  document.getElementById("regenerate-btn").addEventListener("click", () => {
    console.log("Regenerate clicked. lastSheets:", lastSheets);
    if (lastSheets) onSheetsReady(lastSheets);
    else console.warn("Regenerate: no sheets loaded yet.");
  });
});

function handleFile(file) {
  const status = document.getElementById("status-text");
  status.textContent = `Loading: ${file.name}`;

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const workbook = XLSX.read(e.target.result, { type: "array", cellDates: true });
      status.textContent = `Loaded: ${file.name} (${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(", ")})`;
      console.info("Workbook loaded:", workbook.SheetNames);
      onWorkbookLoaded(workbook);
    } catch (err) {
      status.textContent = `Error: ${err.message}`;
      console.error("Failed to parse workbook:", err);
    }
  };

  reader.onerror = () => {
    status.textContent = "Error: could not read file.";
  };

  reader.readAsArrayBuffer(file);
}

// --- Sheet mapper (issue #4) ---

const HARDCODED_SHEETS = ["Settings", "Constants", "Assets"];

let lastSheets = null;

function onWorkbookLoaded(workbook) {
  lastSheets = HARDCODED_SHEETS.map((name) => mapSheet(workbook, name));
  console.info("Mapped sheets:", lastSheets);
  onSheetsReady(lastSheets);
}

function mapSheet(workbook, sheetName) {
  const ws = workbook.Sheets[sheetName];
  if (!ws) {
    console.warn(`Sheet "${sheetName}" not found — returning empty.`);
    return { name: sheetName, schema: "standard", rows: [] };
  }

  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });

  // Detect schema from header row
  const header = (raw[0] || []).map((h) => (h || "").toString().trim().toLowerCase());
  const schema = header[1] === "asset" ? "asset" : "standard";

  const rows = [];
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    const name = row[0] != null ? String(row[0]).trim() : null;
    if (!name) continue; // skip empty rows

    if (schema === "asset") {
      rows.push({
        name,
        assetName:   row[1] != null ? String(row[1]).trim() : "",
        folder:      row[2] != null ? String(row[2]).trim() : "",
        description: row[3] != null ? String(row[3]).trim() : "",
      });
    } else {
      const cell = getCellWithType(ws, i, 1);
      rows.push({
        name,
        value:       cell.value,
        csType:      cell.csType,
        description: row[2] != null ? String(row[2]).trim() : "",
      });
    }
  }

  return { name: sheetName, schema, rows };
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

// --- Class generator (issue #6) ---

let lastOutput = "";

function onSheetsReady(sheets) {
  console.log("onSheetsReady: config =", JSON.stringify(config));
  lastOutput = generateCSharp(sheets);
  console.log("onSheetsReady: output length =", lastOutput.length, "first line =", lastOutput.split("\n")[0]);
  const el = document.getElementById("output");
  console.log("onSheetsReady: el =", el);
  el.textContent = lastOutput;
  if (typeof hljs !== "undefined") {
    requestAnimationFrame(() => {
      delete el.dataset.highlighted;
      hljs.highlightElement(el);
      console.log("onSheetsReady: highlight done");
    });
  } else {
    console.error("highlight.js not loaded");
  }
  document.getElementById("regenerate-btn").removeAttribute("disabled");
}

function generateCSharp(sheets) {
  const lines = [];

  // Minimal usings to support all possible generated types
  lines.push("using System;");
  lines.push("");

  lines.push(`namespace ${config.namespace}`);
  lines.push("{");

  // Root aggregator
  if (config.xmlDocComments) lines.push("    /// <summary>Root configuration object.</summary>");
  lines.push(`    public class ${config.rootClassName}`);
  lines.push("    {");
  for (const sheet of sheets) {
    const className = toClassName(sheet.name);
    const propName  = toPascalCase(sheet.name);
    lines.push(`        public ${className} ${propName} { get; set; } = new();`);
  }
  lines.push("    }");

  // OrchestratorAsset helper — emit once if any asset sheet present
  const hasAssets = sheets.some((s) => s.schema === "asset");
  if (hasAssets) {
    lines.push("");
    lines.push("    public class OrchestratorAsset");
    lines.push("    {");
    lines.push('        public string AssetName { get; set; } = "";');
    lines.push('        public string Folder { get; set; } = "";');
    lines.push("    }");
  }

  // One class per sheet
  for (const sheet of sheets) {
    lines.push("");
    const className = toClassName(sheet.name);
    lines.push(`    public class ${className}`);
    lines.push("    {");

    if (sheet.rows.length === 0) {
      lines.push("        // No data rows found in source sheet.");
    } else if (sheet.schema === "asset") {
      for (const row of sheet.rows) {
        if (config.xmlDocComments && row.description) {
          lines.push(`        /// <summary>${escapeXml(row.description)}</summary>`);
        }
        const propName = toPascalCase(row.name);
        lines.push(`        public OrchestratorAsset ${propName} { get; set; } = new();`);
      }
    } else {
      for (const row of sheet.rows) {
        if (config.xmlDocComments && row.description) {
          lines.push(`        /// <summary>${escapeXml(row.description)}</summary>`);
        }
        const propName = toPascalCase(row.name);
        const def      = defaultInitializer(row.csType);
        lines.push(`        public ${row.csType} ${propName} { get; set; }${def ? ` ${def};` : "" }`);
      }
    }

    lines.push("    }");
  }

  lines.push("}");
  return lines.join("\n");
}

function toClassName(sheetName) {
  return sheetName
    .split(/[.\-_]/)
    .map(toPascalCase)
    .join("") + "Config";
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
    case "string":          return '= ""';
    case "OrchestratorAsset": return "= new()";
    default:                return "";
  }
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
