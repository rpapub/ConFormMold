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

// --- C# class generator (#24 CodeWriter refactor) ---

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
        const propName  = toPascalCase(node.name);
        const cls       = toClassName(node.name);
        const varName   = `t_${propName}`;
        const hasRows   = node.properties.length > 0 || node.children.length > 0;
        if (hasRows) {
          w.write(`if (tables.TryGetValue("${node.name}", out var ${varName})) cfg.${propName} = ${cls}.FromDataTable(${varName});`);
        }
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
      const accessor = config.generateReadonly ? "init" : "set";
      if (prop.isAsset) {
        w.write(`public OrchestratorAsset ${propName} { get; ${accessor}; } = new();`);
      } else {
        const def = defaultInitializer(prop.csType);
        w.write(`public ${prop.csType} ${propName} { get; ${accessor}; }${def ? ` ${def};` : ""}`);
      }
    }
    // Child section properties (reference nested classes defined below)
    for (const child of node.children) {
      const accessor = config.generateReadonly ? "init" : "set";
      w.write(`public ${toClassName(child.name)} ${toPascalCase(child.name)} { get; ${accessor}; } = new();`);
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

      if (config.generateReadonly) {
        // Collect into locals first, then construct with object initializer (#38)
        for (const prop of node.properties) {
          const propName = toPascalCase(prop.name);
          if (prop.isAsset) {
            w.write(`string loc_${propName}_AssetName = "";`);
            w.write(`string loc_${propName}_Folder    = "";`);
          } else {
            const zero = { string: '""', int: "0", double: "0.0", bool: "false" }[prop.csType] ?? "default";
            w.write(`${prop.csType} loc_${propName} = ${zero};`);
          }
        }
        w.write("foreach (DataRow row in dt.Rows)");
        w.write("{").indent();
        w.write("var key   = row[0]?.ToString()?.Trim();");
        w.write(`var value = row[1]?.ToString()?.Trim() ?? "";`);
        w.write("switch (key)").write("{").indent();
        for (const prop of node.properties) {
          const propName = toPascalCase(prop.name);
          if (prop.isAsset) {
            w.write(`case "${prop.name}":`).indent();
            w.write(`loc_${propName}_AssetName = row[1]?.ToString()?.Trim() ?? "";`);
            w.write(`loc_${propName}_Folder    = row[2]?.ToString()?.Trim() ?? "";`);
            w.write("break;").dedent();
          } else if (prop.csType === "string") {
            w.write(`case "${prop.name}": loc_${propName} = value; break;`);
          } else if (prop.csType === "int") {
            w.write(`case "${prop.name}":`).indent();
            w.write(`if (int.TryParse(value, out var tmp_${propName})) loc_${propName} = tmp_${propName};`);
            w.write("break;").dedent();
          } else if (prop.csType === "double") {
            w.write(`case "${prop.name}":`).indent();
            w.write(`if (double.TryParse(value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var tmp_${propName})) loc_${propName} = tmp_${propName};`);
            w.write("break;").dedent();
          } else if (prop.csType === "bool") {
            w.write(`case "${prop.name}":`).indent();
            w.write(`if (bool.TryParse(value, out var tmp_${propName})) loc_${propName} = tmp_${propName};`);
            w.write("break;").dedent();
          } else if (prop.csType === "DateOnly") {
            w.write(`case "${prop.name}":`).indent();
            w.write(`if (DateOnly.TryParse(value, out var tmp_${propName})) loc_${propName} = tmp_${propName};`);
            w.write("break;").dedent();
          } else if (prop.csType === "DateTime") {
            w.write(`case "${prop.name}":`).indent();
            w.write(`if (DateTime.TryParse(value, out var tmp_${propName})) loc_${propName} = tmp_${propName};`);
            w.write("break;").dedent();
          } else if (prop.csType === "TimeOnly") {
            w.write(`case "${prop.name}":`).indent();
            w.write(`if (TimeOnly.TryParse(value, out var tmp_${propName})) loc_${propName} = tmp_${propName};`);
            w.write("break;").dedent();
          }
        }
        w.dedent().write("}");
        w.dedent().write("}");
        w.write(`return new ${cls}`);
        w.write("{").indent();
        for (const prop of node.properties) {
          const propName = toPascalCase(prop.name);
          if (prop.isAsset) {
            w.write(`${propName} = new OrchestratorAsset { AssetName = loc_${propName}_AssetName, Folder = loc_${propName}_Folder },`);
          } else {
            w.write(`${propName} = loc_${propName},`);
          }
        }
        w.dedent().write("};");
      } else {
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
      }

      w.dedent().write("}");
    }

    // ToString() for sub-class — lists leaf properties so ConFigTree.ToString() is useful (#46)
    if (config.generateToString && node.properties.length > 0) {
      const className = toClassName(node.name);
      const parts = node.properties.map(p => {
        const pn = toPascalCase(p.name);
        return `${pn}={${pn}}`;
      }).join(", ");
      w.blank();
      w.write("public override string ToString() =>").indent();
      w.write(`$"${className} {{ ${parts} }}";`).dedent();
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

if (typeof module !== "undefined") module.exports = { generateCSharp };
