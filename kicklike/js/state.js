(() => {
  const KL = window.KL || (window.KL = {});
  const CONFIG = () => KL.config.CONFIG;

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
      currentWinStreak:  0,
      longestWinStreak:  0,
      // v0.48 — Win-Confidence-Bonus. +1 per league win, capped at +4
      // for the season. Applied as a team-wide buff layer in engine.js
      // (all five stats). Reset to 0 at season-end alongside wins/losses
      // (flow.js:advance handlers). Persisted across tab reload via
      // PERSIST_FIELDS so a saved streak survives the close/resume cycle
      // — fixed in v0.60.1, was previously falling through to the
      // session slice and getting wiped on snapshot/restore.
      confidenceBonus:   0,
      runTraitFires:     0,
      runEvoCount:       0,
      achievements:      [],
      pendingPointsPop:  0,
      startedAt:         Date.now(),
      teamName:          '',
      teamColor:         '',
      starterTeamId:     null,
      matchHistory:      [],
      // Pre-generated opponents for the full season (14 league matches,
      // populated from _leagueSeason.schedule). Lets the run bracket be
      // drawn up-front (logos in the progress row etc.) instead of
      // creating an opponent fresh each match. null before a run starts.
      seasonOpponents:   null,

      // ─── Meta-progression across seasons ─────────────────────────────────
      // Tier the player is currently competing in. Amateur at the very
      // start of a new run; promoted/relegated between seasons based on
      // finish position. Persists across season transitions within the
      // same run (new run resets back to amateur).
      _currentTier:      'amateur',
      _seasonNumber:     1,
      // Opp memory — persistent per-team rivalry data. Written by
      // league.recordResult, consumed by league.getRivalryContext.
      // Survives season transitions so returning teams (e.g. a rival
      // who promoted with you) remember the history.
      _oppMemory:        {},
      // Teams that will reappear in next season. Populated on promotion/
      // relegation with the co-promoted/co-relegated team's id so the
      // new league's opponent roster includes that known rival.
      _returningOppId:   null
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
      currentOpponent:   null,
      currentMatch:      null,
      pendingRecruit:    false,
      recruitOptions:    null,
      swapSelected:      null,
      skipAnim:          false,
      paused:            false,
      preKickoff:        false,
      matchLogBuffer:    [],
      lastMatchLog:      []
    };
  }

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
    if (keepers !== 1) return false;
    const mn = season.matchNumber;
    const banned = players.filter(p => p._suspendedUntil && p._suspendedUntil > mn);
    if (banned.length) return false;
    return true;
  }

  function isPlayerAvailable(player) {
    if (!player) return false;
    const mn = season.matchNumber;
    if (player._suspendedUntil && player._suspendedUntil > mn) return false;
    return true;
  }

  const SEASON_KEYS = new Set([
    'run', 'matchNumber', 'wins', 'losses', 'draws',
    'goalsFor', 'goalsAgainst', 'seasonPoints',
    'currentLossStreak', 'currentWinStreak', 'longestWinStreak',
    'confidenceBonus',
    'runTraitFires', 'runEvoCount', 'achievements', 'pendingPointsPop',
    'startedAt',
    'teamName', 'teamColor', 'starterTeamId', 'matchHistory',
    // Meta-progression & season-scoped data. These live in freshSeason()
    // (see top of file) and must route to the season slice too — without
    // them here, the proxy falls through to session, the freshSeason()
    // defaults are dead code, and initial reads return undefined instead
    // of the declared values ('amateur', 1, {}, null).
    'seasonOpponents', '_currentTier', '_seasonNumber',
    '_oppMemory', '_returningOppId'
  ]);

  const ROSTER_KEY_MAP = {
    roster:    'players',
    lineupIds: 'lineupIds'
  };

  const SESSION_KEY_MAP = {
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
    const key = prop.startsWith('_') ? prop.slice(1) : prop;
    return { slice: session, key };
  }

  const legacyStateProxy = new Proxy({}, {
    get(_, prop) {
      if (prop === 'roster')    return roster.players;
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

  KL.state = {
    season,
    roster,
    session,
    fresh,
    getLineup,
    getBench,
    isLineupValid,
    isPlayerAvailable,
    legacy: legacyStateProxy
  };

  Object.defineProperty(window, 'state', {
    configurable: true,
    get() { return legacyStateProxy; },
    set(v) {
      fresh();
      if (v && typeof v === 'object') {
        for (const [k, val] of Object.entries(v)) {
          legacyStateProxy[k] = val;
        }
      }
    }
  });

  window.freshState = () => {
    fresh();
    return legacyStateProxy;
  };
  window.getState           = () => legacyStateProxy;
  window.setState           = (next) => { window.state = next; return legacyStateProxy; };
  window.getLineup          = getLineup;
  window.getBench           = getBench;
  window.isLineupValid      = isLineupValid;
  window.isPlayerAvailable  = isPlayerAvailable;

  // Dev-only sanity check: every freshSeason() key must be routable to
  // the season slice. A key declared in freshSeason() but missing from
  // SEASON_KEYS falls through routeFor() to the session slice, which
  // means its default is dead code and reads return undefined. This
  // assert catches that drift the next time someone adds a field.
  // Non-fatal — warn only, so a packaging mistake never blocks startup.
  (function assertSeasonKeysCover() {
    const sampleKeys = Object.keys(freshSeason());
    const missing = sampleKeys.filter(k => !SEASON_KEYS.has(k));
    if (missing.length && typeof console !== 'undefined' && console.warn) {
      console.warn('[state.js] freshSeason() keys missing from SEASON_KEYS:',
        missing, '— these will route to the session slice and lose their defaults.');
    }
  })();
})();
