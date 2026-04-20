// ─────────────────────────────────────────────────────────────────────────────
// state.js — Game state, split into three concerns
//
//   KL.state.season  — persistent run data (Highscore-relevant)
//   KL.state.roster  — players + lineup
//   KL.state.session — transient UI / match-loop flags (never saved)
//
// A legacy `state` proxy on window exposes all three as if they were one flat
// object, so existing code that reads `state.wins` or `state.roster` keeps
// working. New code should reach for KL.state.season.wins etc. directly.
//
// Also exports:
//   KL.state.fresh()        — reset everything to a new run
//   KL.state.getLineup()    — current starting 5
//   KL.state.getBench()     — current bench
//   KL.state.isLineupValid(ids) — keeper + count check
// ─────────────────────────────────────────────────────────────────────────────

(() => {
  const KL = window.KL || (window.KL = {});
  const CONFIG = () => KL.config.CONFIG;

  // ─── Fresh state factories ─────────────────────────────────────────────────
  // Each sub-slice is built here. Touching one slice never mutates another.

  function freshSeason() {
    return {
      run:               1,
      matchNumber:       0,
      wins:              0,
      losses:            0,
      draws:             0,
      goalsFor:          0,
      goalsAgainst:      0,
      seasonPoints:      0,
      currentLossStreak: 0,
      startedAt:         Date.now(),
      teamName:          '',
      teamColor:         '',
      starterTeamId:     null,
      matchHistory:      []
    };
  }

  function freshRoster() {
    return {
      players:   [],
      lineupIds: []
    };
  }

  function freshSession() {
    return {
      // Current-turn data
      currentOpponent:   null,
      currentMatch:      null,
      pendingRecruit:    false,
      recruitOptions:    null,
      // UI / match-loop flags
      swapSelected:      null,
      skipAnim:          false,
      paused:            false,
      preKickoff:        false,
      matchLogBuffer:    [],
      lastMatchLog:      []
    };
  }

  // Slot-objects that get mutated — never reassigned — so outside references
  // stay valid across `fresh()` calls.
  const season  = freshSeason();
  const roster  = freshRoster();
  const session = freshSession();

  function resetSlice(target, source) {
    for (const k of Object.keys(target)) delete target[k];
    Object.assign(target, source);
  }

  function fresh() {
    resetSlice(season,  freshSeason());
    resetSlice(roster,  freshRoster());
    resetSlice(session, freshSession());
  }

  // ─── Roster queries ────────────────────────────────────────────────────────
  function getLineup() {
    return roster.lineupIds
      .map(id => roster.players.find(p => p.id === id))
      .filter(Boolean);
  }

  function getBench() {
    return roster.players.filter(p => !roster.lineupIds.includes(p.id));
  }

  function isLineupValid(ids) {
    const cfg = CONFIG();
    if (ids.length !== cfg.teamSize) return false;
    const players = ids.map(id => roster.players.find(p => p.id === id)).filter(Boolean);
    if (players.length !== cfg.teamSize) return false;
    const keepers = players.filter(p => p.role === 'TW').length;
    return keepers === 1;
  }

  // ─── Legacy flat proxy ─────────────────────────────────────────────────────
  // Old code says `state.wins++`, `state.roster.push(...)`, `state._skipAnim = true`.
  // This proxy routes each property to the right slice. New fields default to
  // session (the most permissive).
  //
  // Mapping rule: a fixed route table for known fields, fallback = session.
  //
  // Most awkward legacy names (`state.roster`, `state.lineupIds`) collide with
  // our slice names. We resolve them by routing to roster.players / roster.lineupIds.

  const SEASON_KEYS = new Set([
    'run', 'matchNumber', 'wins', 'losses', 'draws',
    'goalsFor', 'goalsAgainst', 'seasonPoints',
    'currentLossStreak', 'startedAt',
    'teamName', 'teamColor', 'starterTeamId', 'matchHistory'
  ]);

  const ROSTER_KEY_MAP = {
    // Legacy `state.roster` → roster.players array
    roster:    'players',
    lineupIds: 'lineupIds'
  };

  const SESSION_KEY_MAP = {
    // The old code sprinkled underscores liberally. Strip them transparently.
    _skipAnim:        'skipAnim',
    _paused:          'paused',
    _preKickoff:      'preKickoff',
    _matchLogBuffer:  'matchLogBuffer',
    _lastMatchLog:    'lastMatchLog',
    _swapSelected:    'swapSelected',
    _recruitOptions:  'recruitOptions',
    currentOpponent:  'currentOpponent',
    currentMatch:     'currentMatch',
    pendingRecruit:   'pendingRecruit'
  };

  function routeFor(prop) {
    if (SEASON_KEYS.has(prop))                return { slice: season,  key: prop };
    if (ROSTER_KEY_MAP[prop] !== undefined)   return { slice: roster,  key: ROSTER_KEY_MAP[prop] };
    if (SESSION_KEY_MAP[prop] !== undefined)  return { slice: session, key: SESSION_KEY_MAP[prop] };
    // Fallback: treat anything else as a session property. This is where ad-hoc
    // flags land (mostly UI). Stripping a leading underscore keeps legacy code
    // working without name collisions.
    const key = prop.startsWith('_') ? prop.slice(1) : prop;
    return { slice: session, key };
  }

  const legacyStateProxy = new Proxy({}, {
    get(_, prop) {
      if (prop === 'roster')    return roster.players;     // legacy shape
      if (prop === 'lineupIds') return roster.lineupIds;
      const { slice, key } = routeFor(prop);
      return slice[key];
    },
    set(_, prop, value) {
      if (prop === 'roster')    { roster.players   = value; return true; }
      if (prop === 'lineupIds') { roster.lineupIds = value; return true; }
      const { slice, key } = routeFor(prop);
      slice[key] = value;
      return true;
    },
    has(_, prop) {
      if (prop === 'roster' || prop === 'lineupIds') return true;
      const { slice, key } = routeFor(prop);
      return key in slice;
    },
    deleteProperty(_, prop) {
      const { slice, key } = routeFor(prop);
      delete slice[key];
      return true;
    }
  });

  // ─── Namespace ─────────────────────────────────────────────────────────────
  KL.state = {
    season,
    roster,
    session,
    fresh,
    getLineup,
    getBench,
    isLineupValid,
    // Exposed for code that specifically needs the proxy
    legacy: legacyStateProxy
  };

  // Legacy global `state` — all old code reads this
  Object.defineProperty(window, 'state', {
    configurable: true,
    get() { return legacyStateProxy; },
    set(v) {
      // Old code does `state = freshState()` to reset. Honour that by
      // running fresh() and, if a partial state was passed, merging it.
      fresh();
      if (v && typeof v === 'object') {
        for (const [k, val] of Object.entries(v)) {
          legacyStateProxy[k] = val;
        }
      }
    }
  });

  // Legacy bare-name fresh-state factory
  window.freshState = () => {
    fresh();
    return legacyStateProxy;
  };
  window.getState = () => legacyStateProxy;
  window.setState = (next) => { window.state = next; return legacyStateProxy; };
  window.getLineup       = getLineup;
  window.getBench        = getBench;
  window.isLineupValid   = isLineupValid;
})();
