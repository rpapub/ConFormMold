#!/usr/bin/env node
/**
 * Regenerate `<!-- BEGIN AUTO: X -->` / `<!-- END AUTO: X -->` fenced blocks
 * in docs/reference.md from the current source tree.
 *
 * Usage:
 *   node scripts/extract-docs.mjs          # regenerate (writes if changed)
 *   node scripts/extract-docs.mjs --check  # exit 1 if regeneration would change the file
 *
 * Add new blocks by:
 *   1. adding a `<!-- BEGIN AUTO: name -->` … `<!-- END AUTO: name -->` pair in docs/reference.md
 *   2. registering a generator below in BLOCK_GENERATORS
 */

import fs   from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import parsersModule from "../public/js/parsers.js";
const { VOCAB, ALLOWED, VOCAB_DOCS, ALLOWED_DOCS } = parsersModule;

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = path.resolve(__dirname, "..");
const REF_PATH   = path.join(REPO_ROOT, "docs", "reference.md");

// --- Filesystem helpers (wc-l semantics: count newline bytes) ---

function readFile(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

function countLines(relPath) {
  return (readFile(relPath).match(/\n/g) || []).length;
}

function countFileBytes(relPath) {
  return fs.statSync(path.join(REPO_ROOT, relPath)).size;
}

function countFunctions(relPath) {
  const matches = readFile(relPath).match(/^function\s+\w+/gm);
  return matches ? matches.length : 0;
}

// --- Block: loc ---

const LOC_FILES = [
  { path: "public/js/app.js",                         cat: "app (UI glue)" },
  { path: "public/js/cs-generator.js",                cat: "app (C# emitter)" },
  { path: "public/js/parsers.js",                     cat: "app (xlsx/json/toml parsers)" },
  { path: "public/js/xaml-generator.js",              cat: "app (XAML emitter)" },
  { path: "public/js/version.js",                     cat: "app (version stamp)" },
  { path: "public/index.html",                        cat: "UI" },
  { path: "public/css/app.css",                       cat: "UI" },
  { path: "public/slides/getting-started/index.html", cat: "content (tutorial)" },
  { path: "test/run-generators.mjs",                  cat: "tests (golden runner)" },
  { path: "test/fixtures/generate_fixtures.py",       cat: "tests (fixture generator)" },
];

const VENDOR = "public/vendor/xlsx-0.20.3.js";

function generateLocBlock() {
  const rows = LOC_FILES.map(f => ({ ...f, lines: countLines(f.path) }));
  const sumBy = pred => rows.filter(pred).reduce((s, r) => s + r.lines, 0);
  const appJs = sumBy(r => r.cat.startsWith("app ("));
  const ui    = sumBy(r => r.cat === "UI");
  const tests = sumBy(r => r.cat.startsWith("tests"));
  const total = rows.reduce((s, r) => s + r.lines, 0);

  const vendorLines = countLines(VENDOR);
  const vendorKB    = Math.floor(countFileBytes(VENDOR) / 1000);

  const out = [];
  out.push("| File | Lines | Category |");
  out.push("|---|--:|---|");
  for (const r of rows) {
    out.push(`| \`${r.path}\` | ${r.lines} | ${r.cat} |`);
  }
  out.push(`| **App code (JS)** | **${appJs}** | |`);
  out.push(`| **UI (HTML + CSS)** | **${ui}** | |`);
  out.push(`| **Tests** | **${tests}** | |`);
  out.push(`| **Total (excl. vendor)** | **${total}** | |`);
  out.push("");
  out.push(`Excluded: \`${VENDOR}\` (minified SheetJS, ${vendorKB} KB / ${vendorLines} lines).`);
  return out.join("\n");
}

// --- Block: functions ---

const FN_FILES = [
  "public/js/app.js",
  "public/js/parsers.js",
  "public/js/cs-generator.js",
  "public/js/xaml-generator.js",
  "public/js/version.js",
];

function generateFunctionsBlock() {
  const rows = FN_FILES.map(p => ({ path: p, count: countFunctions(p) }));
  const total = rows.reduce((s, r) => s + r.count, 0);

  const out = [];
  out.push("| File | Functions |");
  out.push("|---|--:|");
  for (const r of rows) out.push(`| \`${r.path}\` | ${r.count} |`);
  out.push(`| **Total** | **${total}** |`);
  return out.join("\n");
}

// --- Block: vocab ---

function assertKeysMatch(name, obj, docs) {
  const keys    = Object.keys(obj).sort();
  const docKeys = Object.keys(docs).sort();
  if (keys.length !== docKeys.length || keys.some((k, i) => k !== docKeys[i])) {
    throw new Error(
      `${name}_DOCS key mismatch in public/js/parsers.js.\n` +
      `  ${name}:      ${JSON.stringify(keys)}\n` +
      `  ${name}_DOCS: ${JSON.stringify(docKeys)}`
    );
  }
}

function generateVocabBlock() {
  assertKeysMatch("VOCAB",   VOCAB,   VOCAB_DOCS);
  assertKeysMatch("ALLOWED", ALLOWED, ALLOWED_DOCS);

  const out = [];
  out.push("#### Reserved sentinels (`VOCAB`)");
  out.push("");
  out.push("| Constant | Value | Match | Purpose |");
  out.push("|---|---|---|---|");
  for (const [key, value] of Object.entries(VOCAB)) {
    const doc = VOCAB_DOCS[key];
    out.push(`| \`VOCAB.${key}\` | \`"${value}"\` | ${doc.match} | ${doc.purpose} |`);
  }
  out.push("");
  out.push("#### Validation sets (`ALLOWED`)");
  out.push("");
  out.push("| Constant | Values | Context | Purpose |");
  out.push("|---|---|---|---|");
  for (const [key, value] of Object.entries(ALLOWED)) {
    const doc = ALLOWED_DOCS[key];
    const values = value.map(v => `\`${v}\``).join(", ");
    out.push(`| \`ALLOWED.${key}\` | ${values} | ${doc.context} | ${doc.purpose} |`);
  }
  out.push("");
  out.push("Source of truth: `public/js/parsers.js`. Edit the registry there; this block regenerates via `just docs`.");
  return out.join("\n");
}

// --- Fence replacement ---

const BLOCK_GENERATORS = {
  loc:       generateLocBlock,
  functions: generateFunctionsBlock,
  vocab:     generateVocabBlock,
};

function replaceBlock(source, name, body) {
  const pattern = new RegExp(
    `(<!-- BEGIN AUTO: ${name} -->)[\\s\\S]*?(<!-- END AUTO: ${name} -->)`,
  );
  if (!pattern.test(source)) {
    throw new Error(`No fence pair for "${name}" in ${path.relative(REPO_ROOT, REF_PATH)}`);
  }
  return source.replace(pattern, `$1\n${body}\n$2`);
}

// --- Main ---

const original = fs.readFileSync(REF_PATH, "utf8");
let updated = original;
for (const [name, gen] of Object.entries(BLOCK_GENERATORS)) {
  updated = replaceBlock(updated, name, gen());
}

const checkMode = process.argv.includes("--check");
if (checkMode) {
  if (updated !== original) {
    console.error("docs/reference.md is out of date. Run: node scripts/extract-docs.mjs");
    process.exit(1);
  }
  console.log("docs/reference.md AUTO blocks are up to date");
} else if (updated !== original) {
  fs.writeFileSync(REF_PATH, updated);
  console.log(`Regenerated ${Object.keys(BLOCK_GENERATORS).length} block(s) in docs/reference.md`);
} else {
  console.log("docs/reference.md AUTO blocks already up to date");
}
