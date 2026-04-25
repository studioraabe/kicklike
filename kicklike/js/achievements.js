// Achievement-Checker — läuft nach jedem Match, nach Cup-Ende und nach Saison-Ende.
// Schreibt neue achievements in state.achievements: [{ id, title, desc, matchNumber }]
// state.pendingAchievementPop speichert die in diesem Match neu gefallenen IDs, damit
// der Hub sie einmalig als gold-Flash rendern kann (derzeit nicht konsumiert,
// reserved für v52 Codex-Page Live-Feedback).

(() => {
  const KL = window.KL || (window.KL = {});

  function has(state, id) {
    return (state.achievements || []).some(a => a.id === id);
  }

  function award(state, id, vars = {}) {
    if (has(state, id)) return;
    const T = window.I18N.t.bind(window.I18N);
    const title = T(`ui.achievements.${id}.title`);
    const desc  = T(`ui.achievements.${id}.desc`, vars);
    const entry = { id, title, desc, matchNumber: state.matchNumber };
    if (!state.achievements) state.achievements = [];
    state.achievements.push(entry);
    if (!state.pendingAchievementPop) state.pendingAchievementPop = [];
    state.pendingAchievementPop.push(entry);
    // Persist to the meta-codex (across runs). This is what drives the
    // v52 Codex page's "unlocked ever" state.
    if (window.KL?.codex?.recordAchievementUnlock) {
      window.KL.codex.recordAchievementUnlock(id);
    }
  }

  // Small helper — returns an opp's rivalry memory slot or null.
  function rivalryMem(state, oppId) {
    return state._oppMemory?.[oppId] || null;
  }

  // Average team power for cup-upset check. Stats.power isn't pre-computed
  // on player rosters, so we sum effective-ish stats. Good enough for the
  // "weaker team" heuristic — this isn't game-balance-critical.
  function approxSquadPower(squad) {
    if (!squad || !squad.length) return 0;
    let sum = 0;
    for (const p of squad) {
      const s = p.stats || {};
      sum += (s.offense || 0) + (s.defense || 0) + (s.tempo || 0) + (s.vision || 0) + (s.composure || 0);
    }
    return sum;
  }

  // ─── Per-match check — runs after every match (league or cup) ───────────────
  function checkAchievements(state, result) {
    if (!state || !result) return;
    const match        = result.match;
    const squad        = match?.squad || [];
    const isWin        = result.result === 'win';
    const isBossMatch  = match?.opp?.isBoss;
    const isCupMatch   = !!match?.opp?._cupRound;
    const oppId        = match?.opp?.id;

    // ─── Existing (unchanged) ─────────────────────────────────────────────

    // Hat-Trick
    for (const p of squad) {
      const g = p._matchStats?.goals || 0;
      if (g >= 3) award(state, 'hatTrickRunner', { name: p.name });
    }

    // Run-Goals-Scorer — braucht Total pro Spieler über Run.
    for (const p of squad) {
      const g = p._matchStats?.goals || 0;
      if (g > 0) {
        p._runGoals = (p._runGoals || 0) + g;
        if (p._runGoals >= 20) award(state, 'runScorer20', { name: p.name });
        else if (p._runGoals >= 10) award(state, 'runScorer10', { name: p.name });
      }
    }

    // Trait-Triggers
    const fires = state.runTraitFires || 0;
    if (fires >= 150) award(state, 'triggers150');
    else if (fires >= 50) award(state, 'triggers50');

    // Win streak
    const ws = state.currentWinStreak || 0;
    if (ws >= 5) award(state, 'win5');
    else if (ws >= 3) award(state, 'win3');

    // Boss slayer
    if (isWin && isBossMatch) award(state, 'bossDown');

    // Clean sheet (Win ohne Gegentor)
    if (isWin && result.scoreOpp === 0) award(state, 'cleanSheet');

    // Comeback — zum Halbzeit hinten, am Ende gewonnen
    const htMe  = match?._halftimeScoreMe;
    const htOpp = match?._halftimeScoreOpp;
    if (isWin && htMe !== undefined && htOpp !== undefined && htMe < htOpp) {
      award(state, 'comeback');
    }

    // ─── Cup-category (v50.2 new) ─────────────────────────────────────────

    // Cup-Shutout: cup-win without conceding
    if (isWin && isCupMatch && result.scoreOpp === 0) {
      award(state, 'cupShutout');
    }

    // Cup-Upset: cup-win with weaker team power (5% margin to avoid
    // near-equal edge cases triggering on rounding noise)
    if (isWin && isCupMatch) {
      const myPower  = approxSquadPower(squad);
      const oppPower = match.opp?.power || approxSquadPower(match.opp?.lineup || []);
      if (oppPower > 0 && myPower < oppPower * 0.95) {
        award(state, 'cupUpset');
      }
    }

    // Cup-Comeback: cup-win after trailing at R3
    // R3-score snapshot isn't stored by the engine today, so fall back to
    // halftime score (R3 end = halftime in a 6-round match).
    if (isWin && isCupMatch && htMe !== undefined && htOpp !== undefined && htMe < htOpp) {
      award(state, 'comebackCup');
    }

    // ─── Rivalry-category (v50.2 new) ─────────────────────────────────────

    // Grudge-Slayer: beat a team with grudge ≥ 3. Note: _oppMemory is
    // updated by league.recordResult AFTER this runs, so the grudge value
    // here still reflects the pre-match state (i.e. what this match had
    // to overcome).
    if (isWin && oppId) {
      const mem = rivalryMem(state, oppId);
      if (mem && (mem.grudge || 0) >= 3) {
        award(state, 'grudgeSlayer');
      }
    }

    // Blood-Rival-Win: won a match flagged as blood-rivalry. Flavor is
    // computed in league.getRivalryContext; engine stamps it onto match
    // via match._rivalryFlavor when rivalry-buff-layer is applied.
    if (isWin && match?._rivalryFlavor === 'blood') {
      award(state, 'bloodRivalWin');
    }

    // Nemesis: beat the same opp 3× in a row. We track consecutive wins
    // per opp on state._consecutiveWinsByOpp. A loss/draw resets that
    // opp's counter. Cup matches count toward nemesis too.
    if (oppId) {
      if (!state._consecutiveWinsByOpp) state._consecutiveWinsByOpp = {};
      if (isWin) {
        state._consecutiveWinsByOpp[oppId] = (state._consecutiveWinsByOpp[oppId] || 0) + 1;
        if (state._consecutiveWinsByOpp[oppId] >= 3) award(state, 'nemesis');
      } else {
        state._consecutiveWinsByOpp[oppId] = 0;
      }
    }

    // ─── Card-Mastery (v50.2 scaffolding, v51 activates shieldMaster) ─────

    // Shield-Master: 5 opp-card-blocks this run. Counter _oppCardBlocksThisRun
    // is written by v51 shield cards on successful block. Placeholder until
    // then — never fires in v50.2.
    if ((state._oppCardBlocksThisRun || 0) >= 5) {
      award(state, 'shieldMaster');
    }
  }

  // ─── Cup-end hook — runs once when the cup bracket resolves ─────────────────
  // Called from flow.endCup() just before winRun(). `bracket.playerWon` is
  // true if the final round was won; `playerEliminated` is true if any
  // earlier round was lost.
  function checkCupEndAchievements(state) {
    const bracket = state?._cupBracket;
    if (!bracket) return;

    if (bracket.playerWon) {
      award(state, 'cupChampion');
    } else if (bracket.playerEliminated) {
      // Runner-up = reached at least the final (currentRound when lost
      // equals the final-round index).
      const finalIdx = (bracket.rounds?.length || 1) - 1;
      if (bracket.currentRound === finalIdx) {
        award(state, 'cupRunnerUp');
      }
    }
  }

  // ─── Season-end hook — runs when a league season completes ──────────────────
  // Called from flow.continueSeason() BEFORE season-state is reset. `outcome`
  // has { outcome: 'promotion'|'champion'|'survivor'|'relegation', tier, ... }
  // and state.wins still reflects the just-completed season.
  function checkSeasonEndAchievements(state, outcome) {
    if (!state || !outcome) return;

    const tier     = outcome.tier || state._currentTier || 'amateur';
    const result   = outcome.outcome;
    const promoted = result === 'promotion' || result === 'champion';

    // First-Promotion: first time leaving Amateur
    if (promoted && tier === 'amateur') {
      award(state, 'firstPromotion');
    }

    // Pro-Survivor: finished a Pro season without relegation
    if (tier === 'pro' && result !== 'relegation') {
      award(state, 'proSurvivor');
    }

    // Season-Champion: won the Pro league outright (not just top-2)
    if (tier === 'pro' && result === 'champion') {
      award(state, 'seasonChampion');
    }

    // Dominant-Season: 12+ wins in one season
    if ((state.wins || 0) >= 12) {
      award(state, 'dominantSeason');
    }

    // Perfect-Drafter: took every draft this season. Counter incremented
    // in flow when a draft is completed. 11 draft windows per 14-match
    // season (M1-M13, excluding M14 which is season-finale).
    if ((state._draftsTakenThisSeason || 0) >= 11) {
      award(state, 'perfectDeck');
    }

    // Reset season-scoped counters for next season
    state._draftsTakenThisSeason = 0;
  }

  KL.achievements = {
    checkAchievements,
    checkCupEndAchievements,
    checkSeasonEndAchievements,
    // v52 codex — canonical list of every achievement id the game awards.
    // Order here = order shown in the Codex page (grouped by category).
    ALL_IDS: [
      // Original (pre-v50.2)
      'hatTrickRunner', 'runScorer10', 'runScorer20',
      'triggers50', 'triggers150',
      'win3', 'win5',
      'bossDown', 'cleanSheet', 'comeback',
      // Cup category (v50.2)
      'cupChampion', 'cupRunnerUp', 'cupShutout', 'cupUpset', 'comebackCup',
      // Season category (v50.2)
      'firstPromotion', 'proSurvivor', 'seasonChampion', 'dominantSeason', 'perfectDeck',
      // Rivalry category (v50.2)
      'grudgeSlayer', 'bloodRivalWin', 'nemesis',
      // Card-mastery (v50.2 / activated in v51)
      'shieldMaster'
    ]
  };
  window.checkAchievements          = checkAchievements;
  window.checkCupEndAchievements    = checkCupEndAchievements;
  window.checkSeasonEndAchievements = checkSeasonEndAchievements;
})();
