// ─────────────────────────────────────────────────────────────────────────────
// league.js — League season layer.
//
// All runs are structured round-robin seasons. Team count and match
// count are driven by CONFIG (leagueTeamCount, leagueHomeAway): current
// default is 8 teams (you + 7 opponents), each team plays every other
// twice — one home, one away — totalling 14 matches for the player.
//
// Key data structures on state:
//   state._leagueSeason = {
//     teams:     Array<OppTeam | {self: true}>
//     schedule:  Array<{round, matchNumber, isPlayer, homeTeamId, awayTeamId,
//                       played, result}>
//     standings: recomputed from schedule.played entries
//   }
// ─────────────────────────────────────────────────────────────────────────────

(() => {
  const KL = window.KL || (window.KL = {});

  // Generate the league opponents. Pulls unique placeIdx values so each
  // team gets a distinct place-name AND matching crest.
  //
  // If state._returningOppId is set (from last season's co-promotion or
  // co-relegation), the first opp slot is filled by that team's cached
  // data so rivalry memory carries forward and the player sees a
  // familiar crest in the new tier.
  function generateLeagueOpponents(state) {
    const genOpp = window.KL?.entities?.generateOpponent;
    if (!genOpp) {
      console.warn('[league] generateOpponent missing — cannot build season');
      return [];
    }
    const placeCount = window.DATA?.opponents?.places?.length || 15;
    const needed = (window.CONFIG?.leagueTeamCount || 8) - 1;
    if (needed > placeCount) {
      console.warn('[league] need ' + needed + ' opponents but only ' + placeCount + ' places');
    }

    const tierId = state?._currentTier || 'amateur';
    const pool = Array.from({ length: placeCount }, (_, i) => i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const picked = [];

    // If we have a returning opp from last season (co-promoted /
    // co-relegated rival), generate them first at current tier power
    // but preserve their old id so rivalry memory keys still match.
    const returningId = state?._returningOppId;
    const returningCache = state?._returningOppCache;
    if (returningId && returningCache) {
      const opp = genOpp(Math.ceil(needed / 2), {
        placeIdx: returningCache.placeIdx,
        tier: tierId
      });
      opp.id = returningId;  // Preserve id for memory lookup
      opp.name = returningCache.name;
      opp.logo = returningCache.logo;
      opp._returning = true;  // Flag for UI hint
      picked.push(opp);
    }

    const startIdx = picked.length;
    // Opponents are pre-generated at season start. Previously every team
    // got `genOpp(Math.ceil(needed / 2))` — i.e. matchNumber=4 for an
    // 8-team league — which pinned the whole table to a single flat
    // power tier. Result: no internal variance (all teams 330-347) and
    // the second-leg fixtures felt identical to first-leg ones.
    //
    // Fix: spread the per-team baseline across the season power curve.
    // Team 0 is generated at matchNumber=2 (weakest opponent), team 6
    // at matchNumber=8 (toughest). The player's league table still has
    // the natural spread real leagues have — some teams are legitimately
    // weaker, some are legitimately stronger. Combined with the second-
    // leg runtime bonus applied in flow.js when the player faces each
    // team again, the difficulty curve genuinely climbs across a season.
    const seasonSpan = Math.max(1, needed - 1);
    for (let i = startIdx; i < needed; i++) {
      // Skip the returning team's placeIdx so we don't get duplicate names
      let placeIdx = pool[i % pool.length];
      if (returningCache && placeIdx === returningCache.placeIdx) {
        placeIdx = pool[(i + 1) % pool.length];
      }
      // Spread baseline power across the season. Index 0 → matchNumber
      // ~2, last index → matchNumber ~needed-1. Cap intentionally pulled
      // BELOW mid-season after amateur-tier feedback: with the previous
      // ceiling (needed+1 = 9 for an 8-team league) the worst-seeded
      // opponent could land on the player's first fixture via round-robin
      // ordering and present a +44% stat gap — boss-tier toughness in
      // week 1. Two side-effects of the lower cap:
      //   - matchNumber=7 is no longer assigned, so the legacy
      //     bossMatches.includes() check in entities.generateOpponent
      //     can't accidentally apply a +90 boss bonus to a league team.
      //   - matchNumber>=9 late-game power coefficient stays reserved
      //     for cup bosses where it belongs.
      // Late-season toughness still climbs via the runtime statMul
      // applied in flow.js (+18% by the final fixture) plus the
      // player's own growth amplifying any stat differential.
      const t = (i - startIdx) / seasonSpan;
      const opponentMatchNumber = Math.round(2 + t * (needed - 3));
      const opp = genOpp(opponentMatchNumber, {
        placeIdx,
        tier: tierId
      });
      opp.id = 'lg-' + tierId + '-s' + (state?._seasonNumber || 1) + '-' + i + '-'
             + (opp.name || 'team').replace(/\s+/g, '-').toLowerCase();
      // Tag the power tier so the runtime second-leg bonus can scale
      // proportionally to how the team was generated. Stored as a hint,
      // not authoritative — the opp's actual stats remain the source
      // of truth.
      opp._baseMatchNumber = opponentMatchNumber;
      picked.push(opp);
    }
    return picked;
  }

  // Build a round-robin schedule using the circle method. Returns the
  // complete schedule (all team pairings), not just the player's games.
  // Each entry has { round, matchNumber, homeTeamId, awayTeamId, isPlayer,
  // played, result }. The player's own matches are flagged isPlayer:true
  // and their matchNumber is 1..10 (1..N). Other matches share the same
  // round index so we can simulate them in parallel when the player plays.
  function buildSchedule(teams) {
    const n = teams.length;
    if (n < 2 || n % 2 !== 0) {
      console.warn('[league] team count must be even, got', n);
      return [];
    }
    const firstLeg = roundRobinLeg(teams);
    const secondLeg = firstLeg.map(g => ({
      homeTeamId: g.awayTeamId,
      awayTeamId: g.homeTeamId,
      round: g.round + (n - 1)   // second leg rounds continue after first
    }));
    const all = [...firstLeg, ...secondLeg];
    const selfId = teams.find(t => t.self)?.id || 'self';
    // Assign matchNumber only to player games, starting at 1
    let playerMatchCount = 0;
    return all.map(g => {
      const isPlayer = g.homeTeamId === selfId || g.awayTeamId === selfId;
      if (isPlayer) playerMatchCount++;
      return {
        round: g.round,
        matchNumber: isPlayer ? playerMatchCount : null,
        isPlayer,
        homeTeamId: g.homeTeamId,
        awayTeamId: g.awayTeamId,
        played: false,
        result: null
      };
    });
  }

  // Circle method for single-leg round-robin. Returns array of
  // {homeTeamId, awayTeamId} pairings covering every combination once.
  function roundRobinLeg(teams) {
    const n = teams.length;
    const ids = teams.map(t => t.id);
    const pairings = [];
    const fixed = ids[0];
    let rotating = ids.slice(1);
    for (let round = 0; round < n - 1; round++) {
      const all = [fixed, ...rotating];
      for (let i = 0; i < n / 2; i++) {
        const home = all[i];
        const away = all[n - 1 - i];
        if (round % 2 === 0) {
          pairings.push({ round, homeTeamId: home, awayTeamId: away });
        } else {
          pairings.push({ round, homeTeamId: away, awayTeamId: home });
        }
      }
      rotating = [rotating[rotating.length - 1], ...rotating.slice(0, rotating.length - 1)];
    }
    return pairings;
  }

  // Initialize the league season at run start. Called from flow.js.
  // Sets state._leagueSeason with teams, schedule, standings.
  function initSeason(state) {
    const opps = generateLeagueOpponents(state);
    if (opps.length === 0) return null;
    const selfTeam = {
      id: 'self',
      self: true,
      name: state._teamName || 'My Team'
    };
    const teams = [selfTeam, ...opps];
    const schedule = buildSchedule(teams);
    state._leagueSeason = {
      teams,
      schedule,
      standings: computeStandings(teams, schedule)
    };
    return state._leagueSeason;
  }

  // Get the next scheduled opponent for the player. Called by flow.js
  // in league mode instead of the random-generator.
  function getNextOpponent(state) {
    const season = state._leagueSeason;
    if (!season) return null;
    // Only look at player matches that haven't been played yet
    const nextGame = season.schedule.find(g => g.isPlayer && !g.played);
    if (!nextGame) return null;
    const selfId = 'self';
    const oppId = nextGame.homeTeamId === selfId ? nextGame.awayTeamId : nextGame.homeTeamId;
    const oppTeam = season.teams.find(t => t.id === oppId);
    return oppTeam;
  }

  // Simulate one pairing between two opp teams. Uses stat-diff to bias
  // outcome probability — stronger team favored to win, but enough noise
  // that upsets happen. Score distributions are modest to match the
  // game's existing scoring (usually 0-4 goals per team).
  function simulatePairing(homeTeam, awayTeam) {
    const homeStr = (homeTeam.stats?.offense || 50) + (homeTeam.stats?.defense || 50) / 2;
    const awayStr = (awayTeam.stats?.offense || 50) + (awayTeam.stats?.defense || 50) / 2;
    // Home advantage: +8 strength
    const diff = (homeStr + 8) - awayStr;

    // Outcome probability: logistic-ish, clamped
    // diff ~ -30 → 20% home, -10 → 35%, 0 → 50%, +10 → 65%, +30 → 85%
    const pHomeWin = Math.max(0.10, Math.min(0.85, 0.50 + diff / 60));
    const pAwayWin = Math.max(0.10, Math.min(0.70, 0.45 - diff / 60));
    const pDraw = Math.max(0.05, 1 - pHomeWin - pAwayWin);

    const roll = Math.random();
    let outcome;
    if (roll < pHomeWin) outcome = 'home_win';
    else if (roll < pHomeWin + pDraw) outcome = 'draw';
    else outcome = 'away_win';

    // Score: 0-3 base, with a "more offense → more goals" skew
    const homeGoals = Math.floor(Math.random() * 3) + (outcome === 'home_win' ? 1 : 0);
    const awayGoals = Math.floor(Math.random() * 3) + (outcome === 'away_win' ? 1 : 0);
    // Enforce outcome consistency
    let finalHome = homeGoals, finalAway = awayGoals;
    if (outcome === 'draw') {
      finalHome = finalAway = Math.floor(Math.random() * 3);
    } else if (outcome === 'home_win' && finalHome <= finalAway) {
      finalHome = finalAway + 1;
    } else if (outcome === 'away_win' && finalAway <= finalHome) {
      finalAway = finalHome + 1;
    }
    return { homeScore: finalHome, awayScore: finalAway };
  }

  // Simulate all non-player pairings in the same round as the just-played
  // player game. Called from recordResult after the player's result lands.
  function simulateRoundForOthers(state, playerRound) {
    const season = state._leagueSeason;
    if (!season) return;
    const otherGames = season.schedule.filter(g =>
      g.round === playerRound && !g.isPlayer && !g.played
    );
    for (const g of otherGames) {
      const homeTeam = season.teams.find(t => t.id === g.homeTeamId);
      const awayTeam = season.teams.find(t => t.id === g.awayTeamId);
      if (!homeTeam || !awayTeam) continue;
      const sim = simulatePairing(homeTeam, awayTeam);
      g.played = true;
      g.result = {
        homeScore: sim.homeScore,
        awayScore: sim.awayScore,
        outcome: sim.homeScore > sim.awayScore ? 'home_win'
               : sim.homeScore < sim.awayScore ? 'away_win' : 'draw',
        simulated: true
      };
    }
  }

  // Record match result into the season schedule. Recomputes standings.
  // Also writes to state._oppMemory so future matches vs the same team
  // (the reverse leg, or recurring appearances across seasons) can
  // reference "what happened last time we met."
  function recordResult(state, scoreMe, scoreOpp) {
    const season = state._leagueSeason;
    if (!season) return;
    const game = season.schedule.find(g => g.isPlayer && !g.played);
    if (!game) return;
    const isHome = game.homeTeamId === 'self';
    const oppId = game.homeTeamId === 'self' ? game.awayTeamId : game.homeTeamId;
    const outcome = scoreMe > scoreOpp ? 'win'
                  : scoreMe < scoreOpp ? 'loss' : 'draw';
    game.played = true;
    game.result = {
      scoreMe, scoreOpp, outcome,
      homeScore: isHome ? scoreMe : scoreOpp,
      awayScore: isHome ? scoreOpp : scoreMe
    };

    // Opp memory — per-team history. Tracks meetings this season,
    // total encounters across seasons, the latest outcome, and a
    // "grudge level" that grows when we smash them or they smash us.
    // Consumed by getRivalryContext() when the same team shows up
    // again.
    if (!state._oppMemory) state._oppMemory = {};
    const mem = state._oppMemory[oppId] || {
      totalMeetings: 0,
      wins: 0, draws: 0, losses: 0,
      scoreForTotal: 0, scoreAgainstTotal: 0,
      lastOutcome: null,
      lastScoreMe: null,
      lastScoreOpp: null,
      grudge: 0,          // rivalry intensity (0-10); decays slowly
      humiliations: 0,    // times we or they won by 3+ goals
      firstSeenMatchNumber: game.matchNumber
    };
    mem.totalMeetings++;
    if (outcome === 'win') mem.wins++;
    else if (outcome === 'loss') mem.losses++;
    else mem.draws++;
    mem.scoreForTotal += scoreMe;
    mem.scoreAgainstTotal += scoreOpp;
    mem.lastOutcome = outcome;
    mem.lastScoreMe = scoreMe;
    mem.lastScoreOpp = scoreOpp;
    // Grudge math: margin ≥3 goals in either direction escalates the
    // rivalry. Grudge drops by 1 per match against this team if the
    // margin was tight (≤1 goal).
    const margin = Math.abs(scoreMe - scoreOpp);
    if (margin >= 3) {
      mem.humiliations++;
      mem.grudge = Math.min(10, mem.grudge + 2);
    } else if (margin >= 2) {
      mem.grudge = Math.min(10, mem.grudge + 1);
    } else if (margin <= 1) {
      mem.grudge = Math.max(0, mem.grudge - 1);
    }
    state._oppMemory[oppId] = mem;

    simulateRoundForOthers(state, game.round);
    season.standings = computeStandings(season.teams, season.schedule);
  }

  // Get rivalry context for a team BEFORE a match starts. Returns
  // null if no history exists (first meeting ever). Otherwise returns
  // { meetings, lastOutcome, lastScore, grudge, flavor } — consumed
  // by UI to render a pre-match rivalry banner.
  function getRivalryContext(state, oppId) {
    const mem = state?._oppMemory?.[oppId];
    if (!mem || mem.totalMeetings === 0) return null;
    // Flavor tag helps the UI pick the right banner style + narration.
    // Derived from the cumulative meeting history, not just the last
    // match.
    let flavor = 'neutral';
    if (mem.humiliations >= 2) flavor = 'blood';      // multiple blowouts
    else if (mem.grudge >= 5) flavor = 'grudge';       // sustained close hostility
    else if (mem.lastOutcome === 'loss') flavor = 'revenge';  // we owe them
    else if (mem.lastOutcome === 'win' && mem.wins > mem.losses) flavor = 'dominant';
    return {
      meetings: mem.totalMeetings,
      wins: mem.wins, draws: mem.draws, losses: mem.losses,
      lastOutcome: mem.lastOutcome,
      lastScoreMe: mem.lastScoreMe,
      lastScoreOpp: mem.lastScoreOpp,
      grudge: mem.grudge,
      humiliations: mem.humiliations,
      flavor
    };
  }

  // Compute current standings. Each team tracks: played, won, drawn,
  // lost, gf (goals for), ga (goals against), gd (goal difference),
  // points. Sorted by: points → gd → gf.
  function computeStandings(teams, schedule) {
    const table = {};
    for (const t of teams) {
      table[t.id] = {
        id: t.id, name: t.name, self: t.self,
        played: 0, won: 0, drawn: 0, lost: 0,
        gf: 0, ga: 0, gd: 0, points: 0
      };
    }
    const P = window.CONFIG?.leaguePoints || { win: 3, draw: 1, loss: 0 };
    for (const g of schedule) {
      if (!g.played || !g.result) continue;
      const hRow = table[g.homeTeamId];
      const aRow = table[g.awayTeamId];
      if (!hRow || !aRow) continue;
      hRow.played++; aRow.played++;
      hRow.gf += g.result.homeScore; hRow.ga += g.result.awayScore;
      aRow.gf += g.result.awayScore; aRow.ga += g.result.homeScore;
      if (g.result.homeScore > g.result.awayScore) {
        hRow.won++; hRow.points += P.win;
        aRow.lost++; aRow.points += P.loss;
      } else if (g.result.homeScore < g.result.awayScore) {
        aRow.won++; aRow.points += P.win;
        hRow.lost++; hRow.points += P.loss;
      } else {
        hRow.drawn++; hRow.points += P.draw;
        aRow.drawn++; aRow.points += P.draw;
      }
      hRow.gd = hRow.gf - hRow.ga;
      aRow.gd = aRow.gf - aRow.ga;
    }
    // Simulate other teams' matches (opp vs opp) so the table fills up
    // realistically even though the player only plays their own matches.
    // For MVP: simple deterministic "both teams have same strength"
    // → random 50/50 outcome per unplayed opp-vs-opp game.
    // (Better heuristics come in v42 balance pass.)
    const allLegs = buildSchedule(teams.slice(0).sort(() => Math.random() - 0.5));
    // Actually: for v40, just leave opp-vs-opp unplayed and show player row as truth.
    // Full simulation is v41 polish. Avoid fake data for now.
    return Object.values(table).sort((a, b) =>
      b.points - a.points
      || b.gd - a.gd
      || b.gf - a.gf
    );
  }

  // Is the season complete?
  function isSeasonComplete(state) {
    const season = state._leagueSeason;
    if (!season) return false;
    // Season ends when all PLAYER games are done (sim games don't count)
    return season.schedule.every(g => !g.isPlayer || g.played);
  }

  // Player's current position (1-indexed).
  function getPlayerPosition(state) {
    const season = state._leagueSeason;
    if (!season || !season.standings) return null;
    const idx = season.standings.findIndex(s => s.self);
    return idx >= 0 ? idx + 1 : null;
  }

  // ─── Cup tournament layer (end-game) ─────────────────────────────────
  // Standalone 3-match knockout that fires after Pro-league promotion.
  // Each round is a boss match against a uniquely-generated super-opp:
  //   QUARTER (round 0): big boss
  //   SEMI    (round 1): harder boss
  //   FINAL   (round 2): SUPER BOSS — the run climax
  // Winning all 3 = run champion. Losing any round = runner-up.

  function initCupBracket(state) {
    if (!window.CONFIG?.cupEnabled) return null;
    const genOpp = window.KL?.entities?.generateOpponent;
    if (!genOpp) return null;

    const placeCount = window.DATA?.opponents?.places?.length || 15;
    const muls = window.CONFIG.cupBossPowerMultipliers || [1.25, 1.40, 1.65];
    const extras = window.CONFIG.cupBossExtraStat || [80, 120, 180];
    const roundsCount = window.CONFIG.cupRoundsCount || 3;
    const roundNames = ['quarter', 'semi', 'final'];

    // Pick 3 unique placeIdx for the 3 cup bosses
    const pool = Array.from({ length: placeCount }, (_, i) => i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const opps = [];
    for (let r = 0; r < roundsCount; r++) {
      // Mid-late matchNumber for cup matches; the per-round multiplier
      // and extraBoss stat give them their bite.
      const opp = genOpp(14, {
        placeIdx: pool[r],
        tier: state?._currentTier || 'pro',
        cupBossLevel: r + 1   // hint for entities.generateOpponent if desired
      });
      // Manually amplify since cup-bosses go beyond standard scaling
      const mul = muls[r] || 1.0;
      const extra = extras[r] || 0;
      for (const k of Object.keys(opp.stats)) {
        opp.stats[k] = Math.min(150, Math.round(opp.stats[k] * mul) + Math.round(extra / 5));
      }
      opp.power = Object.values(opp.stats).reduce((a, b) => a + b, 0);
      opp.isBoss = true;
      opp.id = 'cup-' + roundNames[r] + '-' + (opp.name || 'boss').replace(/\s+/g, '-').toLowerCase();
      // Mark cup-round so UI can label correctly
      opp._cupRound = roundNames[r];
      opps.push(opp);
    }

    state._cupBracket = {
      rounds: roundNames.slice(0, roundsCount).map((name, i) => ({
        name,
        opp: opps[i],
        played: false,
        result: null
      })),
      currentRound: 0,
      playerEliminated: false,
      playerWon: false,
      cupMatchesPlayed: 0
    };
    state._cupMode = true;       // flag for flow.js
    state._cupOpponents = opps;
    return state._cupBracket;
  }

  // Get the next cup opponent (or null if cup over).
  function getNextCupOpponent(state) {
    const bracket = state?._cupBracket;
    if (!bracket || bracket.playerEliminated || bracket.playerWon) return null;
    const round = bracket.rounds[bracket.currentRound];
    if (!round || round.played) return null;
    return round.opp;
  }

  // Record cup match result — advance bracket OR end cup if lost/won.
  // Note: cup ties are resolved inside the engine (extratime → penalties)
  // before this is called, so scoreMe === scoreOpp shouldn't occur in
  // practice. The random-coin fallback remains only for degenerate cases
  // where something upstream skipped the tie-resolution path.
  function recordCupResult(state, scoreMe, scoreOpp) {
    const bracket = state?._cupBracket;
    if (!bracket) return;
    const round = bracket.rounds[bracket.currentRound];
    if (!round || round.played) return;
    const playerWon = scoreMe > scoreOpp ||
      (scoreMe === scoreOpp && Math.random() < 0.5);
    round.played = true;
    round.result = { scoreMe, scoreOpp, playerWon };
    bracket.cupMatchesPlayed++;

    if (!playerWon) {
      bracket.playerEliminated = true;
      return;
    }
    bracket.currentRound++;
    if (bracket.currentRound >= bracket.rounds.length) {
      bracket.playerWon = true;
    }
  }

  // Is the cup completed (won, eliminated, or all rounds played)?
  function isCupComplete(state) {
    const bracket = state?._cupBracket;
    if (!bracket) return false;
    return bracket.playerWon || bracket.playerEliminated;
  }

  KL.league = {
    initSeason,
    getNextOpponent,
    recordResult,
    computeStandings,
    isSeasonComplete,
    getPlayerPosition,
    getRivalryContext,
    buildSchedule,
    // Cup
    initCupBracket,
    getNextCupOpponent,
    recordCupResult,
    isCupComplete
  };
})();
