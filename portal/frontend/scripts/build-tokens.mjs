#!/usr/bin/env node
// Genera CSS variables desde tokens DTCG OKLCH. Sin dependencias.
//   node scripts/build-tokens.mjs
//   node scripts/build-tokens.mjs --check
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fallbackCss, loadIndex, resolveModes, varName } from "./token-lib.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOKENS_DIR = join(root, "tokens");
const OUT_CSS = join(TOKENS_DIR, "generated", "variables.css");
const OUT_HEX = join(TOKENS_DIR, "generated", "fallback-hex.json");

const REQUIRED = {
  "primitive.color.tokens.json": ["color"],
  "primitive.dimension.tokens.json": ["space", "radius", "shadow", "motion", "z", "breakpoint"],
  "semantic.color.tokens.json": ["bg", "text", "border", "action", "feedback"],
  "semantic.typography.tokens.json": ["typography"],
  "component.alias.tokens.json": ["button", "card", "input"],
};

const COLOR_GROUPS = ["brand", "neutral", "success", "warning", "danger", "focus"];

function assertShape(docs) {
  const byFile = new Map(docs.map((d) => [d.file, d.json]));
  for (const [file, groups] of Object.entries(REQUIRED)) {
    const json = byFile.get(file);
    if (!json) throw new Error(`Falta ${file}`);
    for (const group of groups) {
      if (!json[group] || typeof json[group] !== "object") {
        throw new Error(`${file} sin grupo ${group}`);
      }
    }
  }
  const color = byFile.get("primitive.color.tokens.json").color;
  for (const group of COLOR_GROUPS) {
    if (!color[group]) throw new Error(`primitive.color sin ${group}`);
  }
  const semantic = byFile.get("semantic.color.tokens.json");
  for (const group of ["bg", "text", "border", "action", "feedback"]) {
    const leaves = JSON.stringify(semantic[group]);
    if (!leaves.includes('"light"') || !leaves.includes('"dark"')) {
      throw new Error(`semantic.color ${group} sin modos light|dark`);
    }
  }
}

function render(light, dark) {
  const names = [...light.keys()].sort();
  const lightDecls = [];
  const darkDecls = [];
  const fallbackLight = [];
  const fallbackDark = [];
  const hexLight = {};
  const hexDark = {};
  for (const key of names) {
    const cssName = varName(key.split("."));
    lightDecls.push(`  ${cssName}: ${light.get(key)};`);
    darkDecls.push(`  ${cssName}: ${dark.get(key)};`);
    const fbLight = fallbackCss(light.get(key));
    const fbDark = fallbackCss(dark.get(key));
    if (fbLight) {
      hexLight[cssName] = fbLight.match(/#[0-9a-f]{6,8}/i)?.[0] ?? fbLight;
      fallbackLight.push(`    ${cssName}: ${fbLight};`);
    }
    if (fbDark) {
      hexDark[cssName] = fbDark.match(/#[0-9a-f]{6,8}/i)?.[0] ?? fbDark;
      fallbackDark.push(`    ${cssName}: ${fbDark};`);
    }
  }
  const css = `/* Generado por scripts/build-tokens.mjs. No editar a mano. Contrato DTCG OKLCH 1.0. */
:root {
  color-scheme: light;
${lightDecls.join("\n")}
}

.dark {
  color-scheme: dark;
${darkDecls.join("\n")}
}

@supports not (color: oklch(0% 0 0)) {
  :root {
${fallbackLight.join("\n")}
  }

  .dark {
${fallbackDark.join("\n")}
  }
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --nb-motion-duration-fast: 0.01ms;
    --nb-motion-duration-base: 0.01ms;
    --nb-motion-duration-slow: 0.01ms;
  }
}
`;
  const hexOut = `${JSON.stringify({ light: hexLight, dark: hexDark }, null, 2)}\n`;
  return { css, hexOut, count: names.length };
}

const { index, docs } = loadIndex(TOKENS_DIR);
assertShape(docs);
const { light, dark } = resolveModes(index);
const { css, hexOut, count } = render(light, dark);

if (process.argv.includes("--check")) {
  let currentCss = "";
  let currentHex = "";
  try {
    currentCss = readFileSync(OUT_CSS, "utf-8");
    currentHex = readFileSync(OUT_HEX, "utf-8");
  } catch {
    console.error("tokens: faltan ficheros generados. Ejecuta node portal/frontend/scripts/build-tokens.mjs");
    process.exit(1);
  }
  if (currentCss !== css || currentHex !== hexOut) {
    console.error("tokens: variables.css desactualizado. Ejecuta node portal/frontend/scripts/build-tokens.mjs");
    process.exit(1);
  }
  console.log(`tokens: ${count} variables al día`);
  process.exit(0);
}

mkdirSync(dirname(OUT_CSS), { recursive: true });
writeFileSync(OUT_CSS, css);
writeFileSync(OUT_HEX, hexOut);
console.log(`tokens: ${count} variables → tokens/generated/variables.css`);
