// Resolución DTCG sin dependencias. Lo usan el generador CSS y el gate de contraste.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function parseOklch(input) {
  const m = String(input)
    .trim()
    .match(/^oklch\(\s*([0-9.]+%?)\s+(-?[0-9.]+)\s+(-?[0-9.]+)(?:\s*\/\s*([0-9.]+%?))?\s*\)$/i);
  if (!m) throw new Error(`OKLCH invalido: ${input}`);
  const num = (v, name) => {
    const n = v.endsWith("%") ? parseFloat(v) / 100 : parseFloat(v);
    if (!Number.isFinite(n)) throw new Error(`OKLCH invalido (${name}): ${input}`);
    return n;
  };
  const l = num(m[1], "L");
  const c = parseFloat(m[2]);
  const h = parseFloat(m[3]);
  const a = m[4] === undefined ? 1 : num(m[4], "alpha");
  if (!(l >= 0 && l <= 1)) throw new Error(`OKLCH fuera de rango (L): ${input}`);
  if (!(c >= 0 && c <= 0.5)) throw new Error(`OKLCH fuera de rango (C): ${input}`);
  if (!(h >= 0 && h <= 360)) throw new Error(`OKLCH fuera de rango (H): ${input}`);
  if (!(a >= 0 && a <= 1)) throw new Error(`OKLCH fuera de rango (alpha): ${input}`);
  return { l, c, h, a };
}

function oklchToRgb({ l, c, h }) {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;
  return {
    r: 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    g: -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    b: -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  };
}

function linearToSrgb(channel) {
  const v = Math.min(1, Math.max(0, channel));
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
}

export function oklchToHex(input) {
  const { r, g, b } = oklchToRgb(parseOklch(input));
  const hx = (channel) =>
    Math.round(linearToSrgb(channel) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${hx(r)}${hx(g)}${hx(b)}`.toLowerCase();
}

function hexWithAlpha(hex, alpha) {
  if (alpha >= 1) return hex;
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

export function fallbackCss(value) {
  if (!/oklch\(/i.test(value)) return null;
  return String(value).replace(/oklch\([^)]*\)/gi, (inner) => {
    const parsed = parseOklch(inner);
    return hexWithAlpha(oklchToHex(inner), parsed.a);
  });
}

function isLeaf(node) {
  return !!node && typeof node === "object" && !Array.isArray(node) && typeof node.$value === "string";
}

function collectLeaves(node, path, out) {
  for (const key of Object.keys(node).sort()) {
    if (key.startsWith("$")) continue;
    const child = node[key];
    if (isLeaf(child)) out.push({ path: [...path, key], node: child });
    else if (child && typeof child === "object") collectLeaves(child, [...path, key], out);
  }
}

export function varName(path) {
  return `--nb-${path.join("-")}`;
}

export function loadIndex(tokensDir) {
  const files = readdirSync(tokensDir)
    .filter((f) => f.endsWith(".tokens.json"))
    .sort();
  if (files.length === 0) throw new Error(`Sin ficheros ${tokensDir}/*.tokens.json`);
  const index = new Map();
  const docs = [];
  for (const file of files) {
    const json = JSON.parse(readFileSync(join(tokensDir, file), "utf-8"));
    if (json.$meta?.version !== "1.0") {
      throw new Error(`${file}: $meta.version debe ser "1.0"`);
    }
    docs.push({ file, json });
    const leaves = [];
    collectLeaves(json, [], leaves);
    for (const leaf of leaves) {
      const key = leaf.path.join(".");
      if (index.has(key)) throw new Error(`Token duplicado: ${key} (en ${file})`);
      index.set(key, { ...leaf, file });
    }
  }
  return { files, index, docs };
}

function resolveForMode(raw, mode, index, stack) {
  return String(raw).replace(/\{([a-z0-9._-]+)\}/gi, (_m, ref) => {
    if (stack.includes(ref)) throw new Error(`Referencia circular: ${[...stack, ref].join(" -> ")}`);
    const target = index.get(ref);
    if (!target) throw new Error(`Referencia sin resolver: {${ref}}`);
    const targetRaw = target.node.$extensions?.mode?.[mode] ?? target.node.$value;
    return resolveForMode(targetRaw, mode, index, [...stack, ref]);
  });
}

export function resolveModes(index) {
  const light = new Map();
  const dark = new Map();
  const types = new Map();
  for (const [key, leaf] of [...index.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const modes = leaf.node.$extensions?.mode;
    const lightRaw = modes?.light ?? leaf.node.$value;
    const darkRaw = modes?.dark ?? lightRaw;
    const lightValue = resolveForMode(lightRaw, "light", index, [key]);
    const darkValue = resolveForMode(darkRaw, "dark", index, [key]);
    if (leaf.node.$type === "color" && !/^oklch\(/i.test(lightValue)) {
      throw new Error(`Color sin OKLCH resuelto (${key} light): ${lightValue}`);
    }
    if (leaf.node.$type === "color" && !/^oklch\(/i.test(darkValue)) {
      throw new Error(`Color sin OKLCH resuelto (${key} dark): ${darkValue}`);
    }
    for (const value of [lightValue, darkValue]) {
      const found = value.match(/oklch\([^)]*\)/gi) || [];
      for (const inner of found) parseOklch(inner);
    }
    light.set(key, lightValue);
    dark.set(key, darkValue);
    types.set(key, leaf.node.$type || "");
  }
  return { light, dark, types };
}

function hexToRgb(hex) {
  const raw = hex.replace("#", "").slice(0, 6);
  return {
    r: parseInt(raw.slice(0, 2), 16) / 255,
    g: parseInt(raw.slice(2, 4), 16) / 255,
    b: parseInt(raw.slice(4, 6), 16) / 255,
  };
}

function lin(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function contrastRatio(fgHex, bgHex) {
  const lum = (hex) => {
    const { r, g, b } = hexToRgb(hex);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const a = lum(fgHex);
  const b = lum(bgHex);
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

export function hexForColor(value) {
  const m = String(value).match(/oklch\([^)]*\)/i);
  if (!m) return null;
  return oklchToHex(m[0]);
}
