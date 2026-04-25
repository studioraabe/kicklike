// ─────────────────────────────────────────────────────────────────────────────
// util.js — Foundation utilities
//
// Exports on window.KL.util:
//   rand, randi, pick, pickN         — random helpers
//   clamp, sleep                     — math / async
//   uid                              — id generator
//   $, $$, el                        — DOM helpers
//   tt, pickLog, localeData          — i18n shortcuts
//   formIndicator                    — form arrow helper
//   capitalizeFirst                  — string helper
//
// Also re-exported on window directly for legacy inline handlers (onclick=…)
// and for modules that still reference bare names. This is a compatibility
// shim — new code should use KL.util.* consistently.
// ─────────────────────────────────────────────────────────────────────────────

(() => {
  const KL = window.KL || (window.KL = {});

  // ─── RNG ───────────────────────────────────────────────────────────────────
  const rand  = () => Math.random();
  const randi = (a, b) => Math.floor(rand() * (b - a + 1)) + a;
  const pick  = arr => arr[Math.floor(rand() * arr.length)];
  const pickN = (arr, n) => {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(n, copy.length));
  };

  // ─── Math / async ──────────────────────────────────────────────────────────
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ─── Id generator ──────────────────────────────────────────────────────────
  const uid = (prefix = 'x') => prefix + '_' + Math.random().toString(36).slice(2, 9);

  // ─── DOM helpers ───────────────────────────────────────────────────────────
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class')                                 e.className = v;
      else if (k === 'html')                             e.innerHTML = v;
      else if (k === 'onClick')                          e.addEventListener('click', v);
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'style' && typeof v === 'object')   Object.assign(e.style, v);
      else                                                e.setAttribute(k, v);
    }
    for (const c of [].concat(children)) {
      if (c == null) continue;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }

  // ─── i18n shortcuts ────────────────────────────────────────────────────────
  // Thin wrappers — kept here so callers don't repeat `window.I18N?.` checks.
  // I18N itself is set up in i18n.js; by the time these are called, it exists.
  const tt         = (path, vars = {}) => window.I18N.t(path, vars);
  const pickLog    = (path, vars = {}) => window.I18N.pickText(path, vars);
  const localeData = ()                => window.I18N.locale().data || {};

  // ─── Form indicator (legacy — used in a few places) ────────────────────────
  function formIndicator(form) {
    if (!form)         return '';
    if (form >= 2)     return ' ^^';
    if (form === 1)    return ' ^';
    if (form <= -2)    return ' vv';
    if (form === -1)   return ' v';
    return '';
  }

  // ─── String helper (was in config-data) ────────────────────────────────────
  function capitalizeFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // ─── Namespace + legacy window exports ─────────────────────────────────────
  KL.util = {
    rand, randi, pick, pickN,
    clamp, sleep, uid,
    $, $$, el,
    tt, pickLog, localeData,
    formIndicator, capitalizeFirst
  };

  // Legacy bare-name exports for inline HTML handlers and older code paths.
  // These ensure `rand()`, `clamp()`, `el(...)` etc. work without the KL prefix.
  Object.assign(window, {
    rand, randi, pick, pickN,
    clamp, sleep, uid,
    $, $$, el,
    tt, pickLog, localeData,
    formIndicator, capitalizeFirst
  });
})();
