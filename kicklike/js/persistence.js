// ─────────────────────────────────────────────────────────────────────────────
// persistence.js — Run save/load across tab closes and reloads.
//
// Roguelike runs span ~30 matches and ~2 hours of real play. Without
// persistence a single dropped tab / iOS tab-kill / browser crash wipes
// the entire run — unacceptable UX on mobile. This module snapshots the
// player-owned state slice into localStorage at safe points and offers
// a "Continue Run" affordance on the start screen when a save exists.
//
// Design constraints:
//   * PURE DATA only — all persisted values must be JSON-serializable.
//     No Sets, Maps, functions, or class instances. If a new run-scoped
//     field with a non-primitive type is added, extend serializeValue /
//     deserializeValue below to wrap it.
//   * EXPLICIT allowlist. PERSIST_FIELDS lists every key that survives
//     a reload; everything else is treated as per-match / per-session
//     noise. Adding a field requires touching this file deliberately,
//     which prevents accidentally persisting transient UI flags.
//   * SCHEMA_VERSION gates future migrations of the persisted SHAPE.
//     Loads with a mismatched schema version return null (player
//     restarts from the menu with their highscore intact). Bump when
//     the persisted shape changes.
//   * KL.VERSION (release) is a second, orthogonal gate: saves are
//     tied to the release they were created in. Gameplay constants,
//     card ids, and balance values may drift between releases without
//     the persisted shape changing. Any version mismatch on load →
//     discard. Bumped on every release (version.js).
//
// Integration: flow.js calls autoSave() at safe transitions (hub entry,
// starter-team pick, season transitions) and clear() on run end
// (gameOver / winRun). New run also clears to avoid ghost-save
// surprises.
//
// API: KL.persistence = { save, load, apply, autoSave, hasSave, clear,
//                         summary, SCHEMA_VERSION, SAVE_KEY, PERSIST_FIELDS }
// ─────────────────────────────────────────────────────────────────────────────

(() => {
  const KL = window.KL || (window.KL = {});

  const SAVE_KEY = 'kicklike_save_v1';
  const SCHEMA_VERSION = 1;

  // Every run-scoped field that MUST persist across tab reload. Grouped
  // by origin so the mapping back to state.js:freshSeason / flow.js
  // handoffs is easy to audit.
  const PERSIST_FIELDS = [
    // ─── Season slice (mirrors SEASON_KEYS in state.js) ────────────────
    'run', 'matchNumber', 'wins', 'losses', 'draws',
    'goalsFor', 'goalsAgainst', 'seasonPoints',
    'currentLossStreak', 'currentWinStreak', 'longestWinStreak',
    'confidenceBonus',
    'runTraitFires', 'runEvoCount', 'achievements', 'pendingPointsPop',
    'startedAt', 'teamName', 'teamColor', 'starterTeamId', 'matchHistory',
    'seasonOpponents', '_currentTier', '_seasonNumber',
    '_oppMemory', '_returningOppId', '_returningOppCache',

    // ─── Roster ────────────────────────────────────────────────────────
    'roster', 'lineupIds',

    // ─── Run-cumulative trackers (flow.js:chooseStarterTeam) ──────────
    'teamLogo',
    '_runTotalWins', '_runTotalDraws', '_runTotalLosses',
    '_runTotalGoalsFor', '_runTotalGoalsAgainst',

    // ─── League + cup structure ────────────────────────────────────────
    '_leagueSeason', '_cupMode', '_cupBracket', '_cupOpponents',
    '_pendingSeasonOutcome',

    // ─── Stats / counters used across matches in a run ─────────────────
    '_consecutiveWinsByOpp', '_draftsTakenThisSeason',
    '_oppCardBlocksThisRun',
    '_runCardTypePlays', '_runCardsPlayed', '_runFramesFired',

    // ─── Card layer (deck shape survives between matches) ─────────────
    // v0.37 — _cardDiscard joined the persisted set. Previously only
    // _cardDeck was persisted because of the "per-match, rebuilt on
    // startMatch" reasoning. That was wrong: autoSave fires at HUB
    // ENTRY, which is the window between matches where the discard
    // pile holds the majority of cards played last match (a typical
    // 20-card deck ends a 6-round match with ~16 cards in discard,
    // ~4 left in deck). If the player closed the tab at that point,
    // _cardDeck restored with 4 cards, _cardDiscard lost → next
    // initMatchDeck merged to a 4-card deck. Reports of "only 2 or
    // 0 cards in deck" after resume traced to exactly this.
    // _cardHand stays per-match because it's cleared at round end
    // (discardHand pushes everything to _cardDiscard); safe at every
    // autoSave boundary.
    '_cardDeck', '_cardDiscard', '_cardUpgrades',

    // ─── In-flight between-match decision state ───────────────────────
    // Saving these lets a tab reload mid-draft/recruit resume on the
    // right screen instead of silently dropping the pending choice.
    'pendingRecruit', '_recruitOptions',
    '_cardDraftPendingSecond', '_cardDraftOptions',
    '_cardDraftMode', '_cardDraftReplacedId',
    '_evolutionCandidateId'
  ];

  // Wrap non-JSON values so they round-trip cleanly. Plain objects /
  // arrays / primitives pass through. Covers future-proofing for Sets
  // and Maps; currently nothing on state uses them, but the match
  // object does (_firedEvents), so if anything migrates to state-scope
  // later this is ready.
  function serializeValue(v) {
    if (v instanceof Set) return { __type: 'Set', values: [...v] };
    if (v instanceof Map) return { __type: 'Map', entries: [...v.entries()] };
    return v;
  }

  function deserializeValue(v) {
    if (v && typeof v === 'object' && v.__type === 'Set')
      return new Set(Array.isArray(v.values) ? v.values : []);
    if (v && typeof v === 'object' && v.__type === 'Map')
      return new Map(Array.isArray(v.entries) ? v.entries : []);
    return v;
  }

  function buildSnapshot(state) {
    const snap = {
      _schemaVersion: SCHEMA_VERSION,
      _gameVersion:   (window.KL && window.KL.VERSION) || null,
      _savedAt: Date.now()
    };
    for (const f of PERSIST_FIELDS) {
      const v = state[f];
      if (v === undefined) continue;
      snap[f] = serializeValue(v);
    }
    return snap;
  }

  // Serialize current state and write to localStorage. Returns true on
  // success, false on any failure (quota exceeded, serialization error,
  // localStorage blocked). Callers treat failure as "save didn't
  // happen" and continue — never crashes the game.
  function save(state) {
    if (!state) return false;
    try {
      const snap = buildSnapshot(state);
      const json = JSON.stringify(snap);
      localStorage.setItem(SAVE_KEY, json);
      return true;
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[persistence] save failed:', e?.message || e);
      }
      return false;
    }
  }

  // Read and parse the saved snapshot. Returns the restored plain-object
  // shape (ready to pass to apply()) or null if no save / corrupt /
  // wrong schema version.
  function load() {
    let raw;
    try {
      raw = localStorage.getItem(SAVE_KEY);
    } catch (e) { return null; }
    if (!raw) return null;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[persistence] load: corrupt JSON, discarding');
      }
      return null;
    }

    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed._schemaVersion !== SCHEMA_VERSION) {
      if (typeof console !== 'undefined' && console.info) {
        console.info('[persistence] load: schema mismatch (have',
          parsed._schemaVersion, 'want', SCHEMA_VERSION, ') — discarding save');
      }
      return null;
    }
    // Release-version gate. Saves are tied to the release they were
    // created in: gameplay constants, card definitions, tactic handlers
    // and balance values may have shifted between releases in ways the
    // schema version doesn't capture. Discarding the save is strictly
    // safer than resurrecting it into a world where a referenced card
    // id no longer exists. Highscore survives (separate localStorage
    // key), so the player doesn't lose their meta-progression.
    const currentVersion = (window.KL && window.KL.VERSION) || null;
    if (currentVersion && parsed._gameVersion &&
        parsed._gameVersion !== currentVersion) {
      if (typeof console !== 'undefined' && console.info) {
        console.info('[persistence] load: game version mismatch (have',
          parsed._gameVersion, 'want', currentVersion, ') — discarding save');
      }
      return null;
    }
    // Pre-versioning saves (no _gameVersion field written): treat as
    // invalid rather than best-effort resume. Anything in flight before
    // this gate existed can't be trusted to line up with current data.
    if (currentVersion && !parsed._gameVersion) {
      if (typeof console !== 'undefined' && console.info) {
        console.info('[persistence] load: save predates version gate — discarding');
      }
      return null;
    }

    const restored = {};
    for (const k of Object.keys(parsed)) {
      if (k === '_schemaVersion' || k === '_savedAt' || k === '_gameVersion') continue;
      restored[k] = deserializeValue(parsed[k]);
    }
    return restored;
  }

  // Apply a loaded snapshot to window.state. state.js's window.state
  // setter handles the fresh()-then-copy cycle for us: it resets all
  // three slices (season, roster, session) and then routes each entry
  // via the proxy back into the correct slice.
  function apply(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return false;
    window.state = snapshot;
    return true;
  }

  // Is there a save worth offering? Returns true without actually
  // parsing — used by UI to decide whether to show "Continue Run".
  function hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  }

  // Wipe the save. Called on run end (gameOver / winRun) and at the
  // start of newRun to prevent a stale save from popping back.
  function clear() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  }

  // Called from flow.js at safe transitions. Wraps save() with a guard
  // that no-ops if the state isn't in a meaningful run state (no team
  // picked yet, or match 0 with no league setup). Prevents an empty
  // menu-visit from overwriting a real save.
  function autoSave() {
    const s = window.state;
    if (!s) return false;
    if (!s.starterTeamId) return false;   // no run in progress
    return save(s);
  }

  // Compact summary for the "Continue Run" button — doesn't require a
  // full apply(), just peeks at the save to display team + progress.
  function summary() {
    const snap = load();
    if (!snap) return null;
    return {
      teamName:      snap.teamName || '',
      teamColor:     snap.teamColor || '',
      teamLogo:      snap.teamLogo || null,
      tier:          snap._currentTier || 'amateur',
      seasonNumber:  snap._seasonNumber || 1,
      matchNumber:   snap.matchNumber || 0,
      wins:          snap.wins || 0,
      draws:         snap.draws || 0,
      losses:        snap.losses || 0,
      seasonPoints:  snap.seasonPoints || 0,
      cupMode:       !!snap._cupMode,
      savedAt:       (() => {
        try { return JSON.parse(localStorage.getItem(SAVE_KEY))?._savedAt || null; }
        catch (e) { return null; }
      })()
    };
  }

  KL.persistence = {
    save, load, apply, autoSave, hasSave, clear, summary,
    SCHEMA_VERSION, SAVE_KEY, PERSIST_FIELDS
  };
})();
