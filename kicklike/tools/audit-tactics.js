// ─────────────────────────────────────────────────────────────────────────────
// tools/audit-tactics.js — Tactic handler coverage check.
//
// For each phase (kickoff / halftime / final), verifies that every tactic
// declared in config-data.js has a matching handler in the corresponding
// registry in engine.js, and flags any orphan handlers (handler present
// but no tactic declaration) as dead code.
//
// Run from the project root:
//   node tools/audit-tactics.js
//
// Exits 1 if any tactic has a missing handler, or any handler is orphaned.
// The final-phase .condition()-only tactics (all_in, park_bus, kamikaze,
// clockwatch, poker) are explicitly registry-exempt — they use the
// dynamic stat path instead.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const cfg = fs.readFileSync(path.join(ROOT, 'js', 'config-data.js'), 'utf8');
const eng = fs.readFileSync(path.join(ROOT, 'js', 'engine.js'), 'utf8');

function extractIds(src, sectionRe) {
  const m = src.match(sectionRe);
  if (!m) return new Set();
  const s = new Set();
  for (const mm of m[1].matchAll(/id:\s*"(\w+)"/g)) s.add(mm[1]);
  return s;
}

function extractHandlers(src, name) {
  const openRe = new RegExp(`const ${name}\\s*=\\s*\\{`, 'g');
  const m = openRe.exec(src);
  if (!m) return new Set();
  let depth = 1;
  let i = m.index + m[0].length;
  while (i < src.length && depth > 0) {
    const c = src[i++];
    if (c === '{') depth++;
    else if (c === '}') depth--;
  }
  const body = src.slice(m.index + m[0].length, i - 1);
  const s = new Set();
  for (const mm of body.matchAll(/^\s{4}(\w+)\s*\(match,\s*layer/gm)) {
    s.add(mm[1]);
  }
  return s;
}

const kickoffCfg  = extractIds(cfg, /kickoffTactics:\s*\[([\s\S]*?)\]\s*,\s*\n\s*halftimeOptions/);
const halftimeCfg = extractIds(cfg, /halftimeOptions:\s*\[([\s\S]*?)\]\s*,\s*\n\s*finalOptions/);
const finalCfg    = extractIds(cfg, /finalOptions:\s*\[([\s\S]*?)\]\s*\n\s*\}\s*;/);

const kickoffReg  = extractHandlers(eng, 'KICKOFF_HANDLERS');
const halftimeReg = extractHandlers(eng, 'HALFTIME_HANDLERS');
const finalReg    = extractHandlers(eng, 'FINAL_HANDLERS');

// Final tactics that legitimately skip the registry because they use the
// tactic.condition(match) dynamic-stat path. Keep this list in sync with
// config-data.js:finalOptions.
const FINAL_CONDITION_ONLY = new Set(['all_in', 'park_bus', 'kamikaze', 'clockwatch', 'poker']);

let failed = false;

function report(label, cfgSet, regSet, conditionOnly = new Set()) {
  console.log(`── ${label} ─────────────────────────────────────`);
  console.log(`  config:   ${cfgSet.size} tactics`);
  console.log(`  registry: ${regSet.size} handlers`);
  const missingHandler = [...cfgSet].filter(id => !regSet.has(id) && !conditionOnly.has(id));
  const orphanHandler  = [...regSet].filter(id => !cfgSet.has(id));
  if (missingHandler.length) {
    console.log(`  ❌ in config but no handler: ${missingHandler.join(', ')}`);
    failed = true;
  } else {
    console.log(`  ✅ every config tactic has a handler`);
  }
  if (orphanHandler.length) {
    console.log(`  ❌ handler but no config: ${orphanHandler.join(', ')}`);
    failed = true;
  } else {
    console.log(`  ✅ no orphan handlers`);
  }
  const condOnly = [...cfgSet].filter(id => conditionOnly.has(id));
  if (condOnly.length) {
    console.log(`  (.condition()-only tactics, registry-exempt: ${condOnly.join(', ')})`);
  }
}

report('KICKOFF',  kickoffCfg,  kickoffReg);
report('HALFTIME', halftimeCfg, halftimeReg);
report('FINAL',    finalCfg,    finalReg, FINAL_CONDITION_ONLY);

process.exit(failed ? 1 : 0);
