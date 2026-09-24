#!/usr/bin/env node
// Gate WCAG 2.2 AA: texto/fondo ≥ 4.5:1, UI/bordes ≥ 3:1, claro y oscuro.
// Lee los tokens DTCG (no el CSS) y convierte OKLCH → sRGB solo para el ratio.
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { contrastRatio, hexForColor, loadIndex, resolveModes } from "./token-lib.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { index } = loadIndex(join(root, "tokens"));
const { light, dark } = resolveModes(index);

const PAIRS = [
  { name: "text/base sobre bg/base", fg: "text.base", bg: "bg.base", min: 4.5 },
  { name: "text/muted sobre bg/base", fg: "text.muted", bg: "bg.base", min: 4.5 },
  { name: "text/link sobre bg/base", fg: "text.link", bg: "bg.base", min: 4.5 },
  { name: "text/base sobre bg/surface", fg: "text.base", bg: "bg.surface", min: 4.5 },
  { name: "text/muted sobre bg/surface", fg: "text.muted", bg: "bg.surface", min: 4.5 },
  { name: "text/base sobre bg/muted", fg: "text.base", bg: "bg.muted", min: 4.5 },
  { name: "text/muted sobre bg/muted", fg: "text.muted", bg: "bg.muted", min: 4.5 },
  { name: "text/base sobre card/bg", fg: "text.base", bg: "card.bg", min: 4.5 },
  { name: "text/muted sobre card/bg", fg: "text.muted", bg: "card.bg", min: 4.5 },
  { name: "text/base sobre input/bg", fg: "input.text", bg: "input.bg", min: 4.5 },
  { name: "action/on-primary sobre primary-bg", fg: "action.on-primary", bg: "action.primary-bg", min: 4.5 },
  { name: "action/on-primary sobre primary-bg-hover", fg: "action.on-primary", bg: "action.primary-bg-hover", min: 4.5 },
  { name: "button/on-primary sobre button/primary-bg", fg: "button.on-primary", bg: "button.primary-bg", min: 4.5 },
  { name: "action/on-secondary sobre secondary-bg", fg: "action.on-secondary", bg: "action.secondary-bg", min: 4.5 },
  { name: "feedback/success-text sobre success-bg", fg: "feedback.success-text", bg: "feedback.success-bg", min: 4.5 },
  { name: "feedback/warning-text sobre warning-bg", fg: "feedback.warning-text", bg: "feedback.warning-bg", min: 4.5 },
  { name: "feedback/danger-text sobre danger-bg", fg: "feedback.danger-text", bg: "feedback.danger-bg", min: 4.5 },
  { name: "border/base sobre bg/base (UI)", fg: "border.base", bg: "bg.base", min: 3 },
  { name: "border/strong sobre bg/base (UI)", fg: "border.strong", bg: "bg.base", min: 3 },
  { name: "border/base sobre bg/surface (UI)", fg: "border.base", bg: "bg.surface", min: 3 },
  { name: "card/border sobre card/bg (UI)", fg: "card.border", bg: "card.bg", min: 3 },
  { name: "input/border sobre input/bg (UI)", fg: "input.border", bg: "input.bg", min: 3 },
  { name: "focus-ring sobre bg/base (UI)", fg: "action.focus-ring", bg: "bg.base", min: 3 },
  { name: "input/border-focus sobre input/bg (UI)", fg: "input.border-focus", bg: "input.bg", min: 3 },
];

const modes = { light, dark };
let failed = false;
for (const mode of ["light", "dark"]) {
  console.log(`== modo ${mode} ==`);
  for (const pair of PAIRS) {
    const fgRaw = modes[mode].get(pair.fg);
    const bgRaw = modes[mode].get(pair.bg);
    if (!fgRaw || !bgRaw) {
      console.error(`FAIL ${pair.name}: token ausente`);
      failed = true;
      continue;
    }
    const fg = hexForColor(fgRaw);
    const bg = hexForColor(bgRaw);
    if (!fg || !bg) {
      console.error(`FAIL ${pair.name}: sin color resoluble (${fgRaw} / ${bgRaw})`);
      failed = true;
      continue;
    }
    const ratio = contrastRatio(fg, bg);
    const ok = ratio >= pair.min;
    if (!ok) failed = true;
    console.log(
      `${ok ? "OK  " : "FAIL"} ${pair.name}: ${ratio.toFixed(2)}:1 (min ${pair.min}) [${fg} sobre ${bg}]`
    );
  }
}

if (failed) {
  console.error("Contraste bajo umbral. Revisa tokens/semantic.color.tokens.json");
  process.exit(1);
}
console.log("Contraste WCAG AA verificado (claro y oscuro)");
