// ─────────────────────────────────────────────────────────────────────────────
// tools/sim-env.js — Headless simulation environment for Kicklike.
//
// Loads every gameplay JS module into a shared Node vm context in the
// same order index.html does. Stubs the minimum browser surface the
// engine actually touches: document, localStorage, and window (which
// is the context itself). Replaces Math.random with a seedable RNG so
// every Match outcome is reproducible from a seed.
//
// WHAT THIS DOES NOT STUB:
//   * UI / ui.js / fx.js / match-hud.js — these touch DOM heavily and
//     aren't needed for match simulation. Skipped.
//   * flow.js — it orchestrates SCREEN flow, not matches. The engine
//     is called directly via KL.engine.startMatch instead.
//
// Exports:
//   loadEnv(seed)     → { ctx, rand, resetRng(seed), summarize(match) }
//   runMatch(ctx, squad, opp, options) → async { ...summary }
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

// ── Seedable RNG (Mulberry32) ────────────────────────────────────────
// Simple, fast, well-behaved for our needs. Same seed → same sequence,
// forever. Used for deterministic snapshots; production code keeps
// using Math.random unchanged at runtime.
function makeRng(seed) {
  let s = seed >>> 0;
  return function rand() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Minimal DOM stub ─────────────────────────────────────────────────
// Just enough for util.js's $ / $$ / el helpers to not throw if the
// engine accidentally reaches them. All queries return null; creation
// yields a detached "element" that records children but renders
// nowhere. The match loop doesn't call into DOM, but loading-time
// module code sometimes does (e.g. for event wiring).
function makeDocument() {
  const makeNode = (tag = 'div') => ({
    tagName: (tag || '').toUpperCase(),
    children: [],
    childNodes: [],
    attributes: {},
    classList: {
      _classes: new Set(),
      add(c)     { this._classes.add(c); },
      remove(c)  { this._classes.delete(c); },
      contains(c){ return this._classes.has(c); },
      toggle(c)  { this._classes.has(c) ? this._classes.delete(c) : this._classes.add(c); }
    },
    style: {},
    dataset: {},
    textContent: '',
    innerHTML: '',
    appendChild(child) { this.childNodes.push(child); this.children.push(child); return child; },
    removeChild(child) { this.childNodes = this.childNodes.filter(c => c !== child); return child; },
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k)    { return this.attributes[k] || null; },
    removeAttribute(k) { delete this.attributes[k]; },
    addEventListener() {},
    removeEventListener() {},
    querySelector()    { return null; },
    querySelectorAll() { return []; },
    insertBefore(n)    { return n; },
    cloneNode()        { return makeNode(this.tagName); },
    hasAttribute(k)    { return k in this.attributes; }
  });

  return {
    documentElement: makeNode('html'),
    body: makeNode('body'),
    head: makeNode('head'),
    createElement: (tag) => makeNode(tag),
    createTextNode: (text) => ({ nodeType: 3, textContent: String(text) }),
    createDocumentFragment: () => makeNode('#fragment'),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

// ── Minimal localStorage stub ────────────────────────────────────────
// Map-backed. Persistence.js, i18n.js (language pref) and config-data.js
// (highscore) all call into it; none of them are required for a match
// sim but loading-time code hits them.
function makeLocalStorage() {
  const store = new Map();
  return {
    getItem: (k)     => store.has(k) ? store.get(k) : null,
    setItem: (k, v)  => store.set(k, String(v)),
    removeItem: (k)  => store.delete(k),
    clear: ()        => store.clear(),
    key: (i)         => [...store.keys()][i] || null,
    get length()     { return store.size; }
  };
}

// ── Load order mirrors index.html exactly ────────────────────────────
const LOAD_ORDER = [
  'js/i18n.js',
  'js/lang/de.js',
  'js/lang/en.js',
  'js/lang/es.js',
  'js/util.js',
  'js/achievements.js',
  'js/config-data.js',
  'js/state.js',
  'js/persistence.js',
  'js/stats.js',
  'js/roles.js',
  'js/traits.js',
  'js/tooltip.js',
  'js/entities.js',
  'js/intel.js',
  'js/opp-moves.js',
  'js/engine.js',
  'js/decisions.js',
  'js/league.js',
  'js/cards.js',
  'js/codex.js'
  // skip: fx.js, match-hud.js, ui.js, flow.js — DOM-heavy, match-sim-irrelevant
];

function loadEnv(seed = 1) {
  const document = makeDocument();
  const localStorage = makeLocalStorage();

  // The vm context IS the window. Matches browser semantics where
  // `window === globalThis` and top-level `var` lands on it.
  const ctx = {
    document,
    localStorage,
    console,
    setTimeout, clearTimeout, setInterval, clearInterval,
    Promise, Date, Math, Array, Object, Number, String, Boolean,
    Set, Map, WeakSet, WeakMap, Symbol,
    JSON, RegExp, Error, TypeError, RangeError,
    parseInt, parseFloat, isNaN, isFinite,
    encodeURIComponent, decodeURIComponent,
    // Window-level no-op event handlers. tooltip.js, ui.js etc. wire
    // scroll / resize / visibility listeners at module-load time; in a
    // headless sim these events never fire anyway, so accepting them
    // silently is fine.
    addEventListener:    () => {},
    removeEventListener: () => {},
    dispatchEvent:       () => true,
    // requestAnimationFrame is sometimes reached by animation-adjacent
    // code loaded at module scope. Fall back to setTimeout(0) — only
    // runs if something actually queues a frame, which match-sim code
    // shouldn't.
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    cancelAnimationFrame:  (id) => clearTimeout(id),
    // getComputedStyle stub — returns an object with get accessors
    // that return empty strings. Nothing in match-sim needs real CSS.
    getComputedStyle: () => new Proxy({}, { get: () => '' })
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  ctx.self = ctx;

  vm.createContext(ctx);

  // Replace Math.random with the seedable RNG. The engine and every
  // module reads from either rand() (which ends up in Math.random via
  // util.js) or Math.random directly, so replacing the global covers
  // both paths.
  let rng = makeRng(seed);
  ctx.Math.random = () => rng();

  function resetRng(newSeed) {
    rng = makeRng(newSeed);
    ctx.Math.random = () => rng();
  }

  for (const rel of LOAD_ORDER) {
    const file = path.join(ROOT, rel);
    const src = fs.readFileSync(file, 'utf8');
    try {
      vm.runInContext(src, ctx, { filename: rel });
    } catch (e) {
      throw new Error(`Loading ${rel} failed: ${e.message}\n${e.stack}`);
    }
  }

  return { ctx, rand: () => rng(), resetRng };
}

// Summarise a finished match into a stable, comparable shape. Only
// includes fields that are load-bearing for regression testing — no
// timestamps, no derived trivia, no stringly-typed UI labels.
//
// The field names mirror what the engine writes to match.stats. See
// engine.js around line 2900 for the full set; we pick the ones that
// are stable across refactors and tell us whether the simulation
// behaved the same as before.
function summarize(match, squad, opp) {
  const s = match.stats || {};
  return {
    final: { me: match.scoreMe, opp: match.scoreOpp },
    rounds: match.round,
    stats: {
      myShots:          s.myShots          || 0,
      myShotsOnTarget:  s.myShotsOnTarget  || 0,
      myBuildups:       s.myBuildups       || 0,
      myBuildupsOk:     s.myBuildupsSuccess || 0,
      oppShots:         s.oppShots         || 0,
      oppShotsOnTarget: s.oppShotsOnTarget || 0,
      oppBuildups:      s.oppBuildups      || 0
    },
    triggers: match.triggersTotal || 0,
    finalMomentum: match.matchMomentum || 0,
    squadConditions: squad.map(p => ({
      role: p.role, cond: Math.round(p.condition || 0)
    })),
    oppPower: opp.power
  };
}

module.exports = { loadEnv, summarize, makeRng };
