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
      runTraitFires:     0,
      runEvoCount:       0,
      achievements:      [],
      pendingPointsPop:  0,
      startedAt:         Date.now(),
      teamName:          '',
      teamColor:         '',
      starterTeamId:     null,
      matchHistory:      [],
      // Pre-generated opponents for all 15 matches. Populated on chooseStarterTeam.
      // Lets the run bracket be drawn up-front (logos in the progress row etc.)
      // instead of creating an opponent fresh each match. null before a run starts.
      seasonOpponents:   null
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
    'runTraitFires', 'runEvoCount', 'achievements', 'pendingPointsPop',
    'startedAt',
    'teamName', 'teamColor', 'starterTeamId', 'matchHistory'
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
})();
