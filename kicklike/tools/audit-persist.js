// ─────────────────────────────────────────────────────────────────────────────
// tools/audit-persist.js — Static coverage check for save/load allowlist.
//
// Verifies that every `state.*` field referenced anywhere in js/ is
// either (a) in PERSIST_FIELDS (will survive a save/load), or (b) in
// the KNOWN_TRANSIENT deny-list below (intentionally per-session).
//
// Run from the project root:
//   node tools/audit-persist.js
//
// Exits with code 1 if any field is uncategorised so this can be wired
// into CI / pre-commit.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JS_DIR = path.join(ROOT, 'js');

// Collect every `state.foo` reference from the JS codebase.
const rawFields = execSync(
  `grep -rhoE 'state\\.[_a-zA-Z]+' ${JSON.stringify(JS_DIR)} | sort -u`,
  { encoding: 'utf8' }
).trim().split('\n').map(s => s.replace(/^state\./, ''));

// Parse PERSIST_FIELDS out of persistence.js. Strip // line comments
// first so apostrophes inside prose ("isn't persisted") can't sneak
// in as fake string entries. Only match quoted valid JS identifiers.
const persistSrcRaw = fs.readFileSync(path.join(JS_DIR, 'persistence.js'), 'utf8');
const persistSrc = persistSrcRaw.replace(/\/\/[^\n]*/g, '');
const pfMatch = persistSrc.match(/const PERSIST_FIELDS = \[([\s\S]*?)\];/);
if (!pfMatch) {
  console.error('Could not locate PERSIST_FIELDS declaration in persistence.js');
  process.exit(2);
}
const persistFields = [...pfMatch[1].matchAll(/'([A-Za-z_][A-Za-z0-9_]*)'/g)].map(m => m[1]);

// SEASON_KEYS too, for reporting the layering.
const stateSrcRaw = fs.readFileSync(path.join(JS_DIR, 'state.js'), 'utf8');
const stateSrc = stateSrcRaw.replace(/\/\/[^\n]*/g, '');
const skMatch = stateSrc.match(/const SEASON_KEYS = new Set\(\[([\s\S]*?)\]\);/);
const seasonKeys = skMatch
  ? [...skMatch[1].matchAll(/'([A-Za-z_][A-Za-z0-9_]*)'/g)].map(m => m[1])
  : [];

// Per-session / per-match fields that are intentionally NOT persisted.
// Adding a transient field? Drop it here so it stops showing up as
// "uncategorised". Persisting it? Add it to PERSIST_FIELDS instead.
const KNOWN_TRANSIENT = new Set([
  // Active-match references — rebuilt when startMatch creates a match.
  'currentOpponent', 'currentMatch', '_currentMatch', '_activeMatch',
  '_cardPhaseMatch',
  // Match log buffers — per-match scratch space.
  '_matchLogBuffer', '_lastMatchLog',
  // UI / session flags — no meaning across reloads.
  '_skipAnim', '_paused', '_preKickoff',
  '_swapSelected',
  '_quickSim',               // per-match auto-pilot flag, reset to false in advance()
  // Card hand/discard — rebuilt from deck on startMatch.
  '_cardHand', '_cardDiscard',
  '_cardsNeedMatchInit', '_deckJustReshuffled',
  // One-match academy roster additions.
  '_academyActiveIds',
  // Dead aliases / historic holdovers:
  'currentSquad',            // alias; roster is the canonical copy
  '_teamName',               // dead alias; teamName is canonical
  'pendingAchievementPop',   // animation queue, rebuilt from achievements
  'js',                      // grep artifact (filename token)
  '_isCupMatch'              // derivable from _cupMode at runtime
]);

const persistSet  = new Set(persistFields);
const uncategorised = rawFields.filter(f => !persistSet.has(f) && !KNOWN_TRANSIENT.has(f));

console.log(`State fields seen in code  : ${rawFields.length}`);
console.log(`PERSIST_FIELDS entries     : ${persistFields.length}`);
console.log(`KNOWN_TRANSIENT entries    : ${KNOWN_TRANSIENT.size}`);
console.log(`SEASON_KEYS entries        : ${seasonKeys.length}  (subset of PERSIST_FIELDS)`);
console.log();

if (uncategorised.length === 0) {
  console.log('✅ Every state field is explicitly classified.');
  process.exit(0);
}

console.log('❌ Uncategorised state fields:');
for (const f of uncategorised) {
  console.log('   state.' + f);
}
console.log();
console.log('Each field above must either be added to PERSIST_FIELDS in');
console.log('js/persistence.js, or added to KNOWN_TRANSIENT in this file.');
process.exit(1);
