// ─────────────────────────────────────────────────────────────────────────────
// version.js — Single source of truth for the game release version.
//
// Loaded first (before i18n, before anything else) so every module can
// read `window.KL.VERSION` without ordering concerns. Two consumers today:
//
//   1. persistence.js — snapshots embed VERSION; load() discards a
//      snapshot whose VERSION string doesn't match the current release.
//      This is how we prevent a save from a previous release being
//      resumed in a newer build where gameplay constants, card shapes,
//      or balance values may have drifted. Savegames are tied to the
//      release they were created in, full stop.
//
//   2. ui.js footer — renders the version label + Changelog link on
//      the start screen.
//
// Bumping policy: bump VERSION on every public release. No granular
// "only bump if state shape changed" — that's what SCHEMA_VERSION in
// persistence.js is for. Release version is strictly a release marker.
// ─────────────────────────────────────────────────────────────────────────────

(() => {
  const KL = window.KL || (window.KL = {});
  KL.VERSION = '0.60.2';
  KL.VERSION_CHANNEL = 'beta';
})();
