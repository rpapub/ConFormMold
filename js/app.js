const config = {
  namespace:      "Cpmf.Config",
  rootClassName:  "AppConfig",
  dotnetVersion:  "net6",
  xmlDocComments: true,
};

document.addEventListener("DOMContentLoaded", () => {
  if (typeof XLSX === "undefined") {
    console.error("SheetJS failed to load.");
  } else {
    console.info(`SheetJS loaded: ${XLSX.version}`);
  }

  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const status    = document.getElementById("status-text");

  dropZone.addEventListener("click", () => fileInput.click());

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  document.getElementById("copy-btn").addEventListener("click", () => {
    const text = document.getElementById("output").textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      status.textContent = "Copied to clipboard.";
      setTimeout(() => { status.textContent = ""; }, 2000);
    });
  });
});

function handleFile(file) {
  const status  = document.getElementById("status-text");
  const spinner = document.getElementById("spinner");

  spinner.style.display = "inline-block";
  status.textContent = `Loading: ${file.name}`;

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const workbook = XLSX.read(e.target.result, { type: "array", cellDates: true });
      spinner.style.display = "none";
      status.textContent = `Loaded: ${file.name} (${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(", ")})`;
      console.info("Workbook loaded:", workbook.SheetNames);
      onWorkbookLoaded(workbook);
    } catch (err) {
      spinner.style.display = "none";
      status.textContent = `Error: ${err.message}`;
      console.error("Failed to parse workbook:", err);
    }
  };

  reader.onerror = () => {
    spinner.style.display = "none";
    status.textContent = "Error: could not read file.";
  };

  reader.readAsArrayBuffer(file);
}

// --- Sheet mapper (issue #4) ---

const HARDCODED_SHEETS = ["Settings", "Constants", "Assets"];

function onWorkbookLoaded(workbook) {
  const sheets = HARDCODED_SHEETS.map((name) => mapSheet(workbook, name));
  console.info("Mapped sheets:", sheets);
  onSheetsReady(sheets);
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
      const epoch = new Date(1899, 11, 30); // Excel time-only epoch
      const isEpoch =
        d.getFullYear() === epoch.getFullYear() &&
        d.getMonth()    === epoch.getMonth()    &&
        d.getDate()     === epoch.getDate();
      if (isEpoch) return { value: d, csType: "TimeOnly" };

      const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0 || d.getSeconds() !== 0;
      return { value: d, csType: hasTime ? "DateTime" : "DateOnly" };
    }

    case "s":
    default:
      return { value: cell.v, csType: "string" };
  }
}

function onSheetsReady(sheets) {
  // stub — class generator implemented in issue #6
  console.info("onSheetsReady stub", sheets);
}
