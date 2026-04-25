(() => {
  const KL = window.KL || (window.KL = {});
  const { rand, clamp, pick } = KL.util;

  const ARCHETYPES = {
    catenaccio: {
      id: 'catenaccio',
      categoryBias: { lockdown: 0.50, aggressive: 0.15, disruption: 0.20, setup: 0.05, big: 0.10 },
      aggressiveFilter: ['counter_blitz', 'quick_strike'],
      preferredTraits: ['riegel', 'ironwall', 'counter_threat', 'bulwark'],
      bigMoves: ['signature_play']
    },
    gegenpressing: {
      id: 'gegenpressing',
      categoryBias: { lockdown: 0.10, aggressive: 0.25, disruption: 0.45, setup: 0.10, big: 0.10 },
      aggressiveFilter: null,
      preferredTraits: ['pressing_wall', 'presser_opp', 'rage_mode'],
      bigMoves: ['desperation_push']
    },
    tiki_taka: {
      id: 'tiki_taka',
      categoryBias: { lockdown: 0.20, aggressive: 0.20, disruption: 0.15, setup: 0.35, big: 0.10 },
      aggressiveFilter: null,
      preferredTraits: ['clutch_opp', 'sniper', 'bulwark'],
      bigMoves: ['tiki_taka_press']
    },
    direct_play: {
      id: 'direct_play',
      categoryBias: { lockdown: 0.05, aggressive: 0.50, disruption: 0.10, setup: 0.10, big: 0.25 },
      aggressiveFilter: null,
      preferredTraits: ['sturm', 'sniper', 'rage_mode'],
      bigMoves: ['signature_play', 'desperation_push']
    },
    chaos: {
      id: 'chaos',
      categoryBias: { lockdown: 0.20, aggressive: 0.20, disruption: 0.20, setup: 0.20, big: 0.20 },
      aggressiveFilter: null,
      preferredTraits: ['lucky'],
      bigMoves: ['signature_play', 'desperation_push', 'tiki_taka_press']
    }
  };

  const OPP_MOVES = {
    overload_flank: {
      id: 'overload_flank', category: 'aggressive', severity: 1, cooldown: 2, stageMin: 1,
      onDraw(m) { m._oppMoveShotBonus = (m._oppMoveShotBonus || 0) + 0.12; },
      onResolve() {}
    },
    quick_strike: {
      id: 'quick_strike', category: 'aggressive', severity: 2, cooldown: 3, stageMin: 1,
      onDraw(m) { m._oppMoveQuickStrike = true; },
      onResolve() {}
    },
    long_ball: {
      id: 'long_ball', category: 'aggressive', severity: 1, cooldown: 2, stageMin: 1,
      onDraw(m) {
        m.opp._roundBuffs = m.opp._roundBuffs || {};
        m.opp._roundBuffs.offense = (m.opp._roundBuffs.offense || 0) + 18;
        m.opp._roundBuffs.defense = (m.opp._roundBuffs.defense || 0) - 8;
      },
      onResolve() {}
    },
    pressing_surge: {
      id: 'pressing_surge', category: 'aggressive', severity: 2, cooldown: 3, stageMin: 1,
      onDraw(m) { m._oppMoveBuildupMalus = (m._oppMoveBuildupMalus || 0) + 0.18; },
      onResolve() {}
    },
    counter_blitz: {
      id: 'counter_blitz', category: 'aggressive', severity: 1, cooldown: 2, stageMin: 1,
      onDraw(m) { m._oppMoveCounterBlitzArmed = true; },
      onResolve() {}
    },
    rage_offensive: {
      id: 'rage_offensive', category: 'aggressive', severity: 2, cooldown: 2, stageMin: 1,
      condition(m) { return (m.scoreOpp < m.scoreMe - 1); },
      onDraw(m) { m._oppMoveExtraAttacks = (m._oppMoveExtraAttacks || 0) + 1; },
      onResolve() {}
    },
    park_the_bus: {
      id: 'park_the_bus', category: 'lockdown', severity: 2, cooldown: 4, stageMin: 1,
      onDraw(m) {
        m.buffLayers.push({
          source: 'oppmove:park_the_bus',
          range: [m.round, Math.min(m.round + 1, 6)],
          stats: { defense: -5, tempo: -5 }, special: null
        });
        m.opp._roundBuffs = m.opp._roundBuffs || {};
        m.opp._roundBuffs.defense = (m.opp._roundBuffs.defense || 0) + 16;
      },
      onResolve() {}
    },
    bunker: {
      id: 'bunker', category: 'lockdown', severity: 1, cooldown: 2, stageMin: 1,
      onDraw(m) { m._oppMoveSaveBonus = (m._oppMoveSaveBonus || 0) + 0.15; },
      onResolve() {}
    },
    low_block: {
      id: 'low_block', category: 'lockdown', severity: 3, cooldown: 5, stageMin: 2,
      onDraw(m) { m._oppMoveComboDampen = 0.5; },
      onResolve() {}
    },
    mental_wall: {
      id: 'mental_wall', category: 'lockdown', severity: 2, cooldown: 4, stageMin: 2,
      onDraw(m) {
        m.buffLayers.push({
          source: 'oppmove:mental_wall',
          range: [m.round, Math.min(m.round + 1, 6)],
          stats: { composure: -8 }, special: null
        });
      },
      onResolve() {}
    },
    tactical_foul: {
      id: 'tactical_foul', category: 'disruption', severity: 2, cooldown: 3, stageMin: 2,
      onDraw(m) {
        const st = m.squad?.find(p => p.role === 'ST');
        if (st) st.condition = Math.max(0, (st.condition ?? 100) - 15);
        m._oppMoveFoulPending = true;
      },
      onResolve() {}
    },
    fake_press: {
      id: 'fake_press', category: 'disruption', severity: 2, cooldown: 3, stageMin: 2,
      onDraw(m) { m._oppMoveFakePress = true; },
      onResolve() {}
    },
    time_waste: {
      id: 'time_waste', category: 'disruption', severity: 1, cooldown: 3, stageMin: 2,
      onDraw(m) { m._oppMoveCardDrawMalus = (m._oppMoveCardDrawMalus || 0) + 1; },
      onResolve() {}
    },
    dirty_tackle: {
      id: 'dirty_tackle', category: 'disruption', severity: 3, cooldown: 5, stageMin: 2,
      onDraw(m) {
        const starters = (m.squad || []).filter(p => ['ST','LF','PM','VT'].includes(p.role));
        if (starters.length) {
          const victim = pick(starters);
          victim.condition = Math.max(0, (victim.condition ?? 100) - 20);
          m._oppMoveDirtyTackleVictim = victim.id;
        }
      },
      onResolve() {}
    },
    study_tape: {
      id: 'study_tape', category: 'setup', severity: 1, cooldown: 4, stageMin: 2,
      onDraw(m) { m._oppMoveStudyTapeRoundsLeft = 2; },
      onResolve() {}
    },
    training_focus: {
      id: 'training_focus', category: 'setup', severity: 1, cooldown: 6, stageMin: 1,
      onDraw(m) {
        const keys = ['offense','defense','tempo','vision','composure'];
        const stat = pick(keys);
        m.opp._permanentMatchBuffs = m.opp._permanentMatchBuffs || {};
        m.opp._permanentMatchBuffs[stat] = (m.opp._permanentMatchBuffs[stat] || 0) + 8;
        m._oppMoveTrainingStat = stat;
      },
      onResolve() {}
    },
    captain_speech: {
      id: 'captain_speech', category: 'setup', severity: 1, cooldown: 5, stageMin: 1,
      onDraw(m) {
        m.oppBuffLayers = m.oppBuffLayers || [];
        m.oppBuffLayers.push({
          source: 'oppmove:captain_speech',
          range: [m.round, Math.min(m.round + 2, 6)],
          stats: { composure: 5 }
        });
      },
      onResolve() {}
    },
    signature_play: {
      id: 'signature_play', category: 'big', severity: 3, cooldown: 99, stageMin: 2, bigMove: true,
      onDraw(m) { m._oppMoveSignatureArmed = true; },
      onResolve(m, onEvent) {
        if (m._oppMoveSignatureArmed && !m._oppMoveSignatureBlocked) {
          m._eventForceOppGoal = true;
        }
        if (m._oppMoveSignatureBlocked) {
          m.matchMomentum = Math.min(100, (m.matchMomentum || 0) + 25);
        }
        m._oppMoveSignatureArmed = false;
        m._oppMoveSignatureBlocked = false;
      }
    },
    desperation_push: {
      id: 'desperation_push', category: 'big', severity: 3, cooldown: 99, stageMin: 2, bigMove: true,
      condition(m) { return m.scoreOpp <= m.scoreMe; },
      onDraw(m) {
        if (!m._oppMoveDesperationBlocked) {
          m._oppMoveExtraAttacks = (m._oppMoveExtraAttacks || 0) + 2;
          m._oppMoveShotBonus = (m._oppMoveShotBonus || 0) + 0.08;
        }
      },
      onResolve() {}
    },
    tiki_taka_press: {
      id: 'tiki_taka_press', category: 'big', severity: 3, cooldown: 99, stageMin: 3, bigMove: true,
      onDraw(m) {
        if (!m._oppMoveTikiTakaBlocked) {
          m.oppBuffLayers = m.oppBuffLayers || [];
          m.oppBuffLayers.push({
            source: 'oppmove:tiki_taka_press',
            range: [m.round, Math.min(m.round + 2, 6)],
            stats: { offense: 12, vision: 8 }
          });
          m._oppMoveTikiTakaActive = 3;
        }
      },
      onResolve() {}
    }
  };

  function getIntelligenceStage(matchNumber) {
    if (matchNumber <= 7)  return 1;
    if (matchNumber <= 14) return 2;
    return 3;
  }

  // v0.49 — Severity-Cap für frühe Matches. Der stageMin-Filter oben
  // entfernt zwar disruption/big Moves in M1-7, aber selbst im erlaubten
  // Pool gibt es für M1 vier severity-2-Moves (quick_strike, pressing_
  // surge, rage_offensive, park_the_bus). Das ist zu hart, wenn der
  // Spieler noch kein Counter-Karten-Repertoire hat und die Mechanik
  // erst kennenlernt. User-Feedback: "opp threats kommen in den ersten
  // spiele zu früh, da hat man noch gar keine chance etwas zu blocken".
  //
  //   M1-2  → nur severity 1 (milde Moves: overload_flank, long_ball,
  //           counter_blitz, bunker, training_focus, captain_speech)
  //   M3-5  → bis severity 2 (quick_strike & Co. wieder verfügbar)
  //   M6+   → alle Severities (bis 3, sobald stageMin erreicht)
  //
  // Cup-Matches (forceBoss) umgehen den Cap nicht — die sind explizit
  // als Herausforderung geframed, und Boss-Matches treffen nicht auf M1.
  function getSeverityCap(matchNumber) {
    if (matchNumber <= 2) return 1;
    if (matchNumber <= 5) return 2;
    return 3;
  }

  function pickArchetype(matchNumber, forceBoss) {
    const r = rand();
    if (forceBoss) {
      if (r < 0.30) return 'catenaccio';
      if (r < 0.55) return 'direct_play';
      if (r < 0.80) return 'tiki_taka';
      if (r < 0.95) return 'gegenpressing';
      return 'chaos';
    }
    if (r < 0.22) return 'catenaccio';
    if (r < 0.44) return 'gegenpressing';
    if (r < 0.66) return 'tiki_taka';
    if (r < 0.88) return 'direct_play';
    return 'chaos';
  }

  function initOppDeck(opp, matchNumber) {
    const stage = getIntelligenceStage(matchNumber);
    const severityCap = getSeverityCap(matchNumber);
    if (!opp.archetype) opp.archetype = pickArchetype(matchNumber, opp.isBoss);
    const archetype = ARCHETYPES[opp.archetype] || ARCHETYPES.chaos;

    const available = Object.values(OPP_MOVES).filter(m => {
      if (m.stageMin > stage) return false;
      if (m.severity > severityCap) return false;   // v0.49 — early-match cap
      if (m.category === 'big' && !archetype.bigMoves.includes(m.id)) return false;
      if (m.category === 'aggressive' && archetype.aggressiveFilter
          && !archetype.aggressiveFilter.includes(m.id)) return false;
      return true;
    });

    opp._oppDeck = available.map(m => m.id);
    opp._oppCooldowns = {};
    opp._oppDrawHistory = [];
    opp._oppStage = stage;
    return opp._oppDeck;
  }

  function weightForMove(moveId, match, opp) {
    const move = OPP_MOVES[moveId];
    if (!move) return 0;

    const cdUntil = opp._oppCooldowns[moveId] || 0;
    if (match.round < cdUntil) return 0;

    if (move.condition && !move.condition(match)) return 0;

    const archetype = ARCHETYPES[opp.archetype] || ARCHETYPES.chaos;
    const categoryBias = archetype.categoryBias[move.category] || 0.1;

    let w = categoryBias * 100;

    const stage = opp._oppStage || 1;
    if (!KL.config.CONFIG.oppMoveAdaptiveWeighting || stage === 1) {
      return w * (0.6 + rand() * 0.8);
    }

    const gap = match.scoreMe - match.scoreOpp;

    if (gap >= 2) {
      if (move.category === 'aggressive') w *= 2.5;
      if (move.category === 'big' && match.round >= 4) w *= 3.0;
      if (move.category === 'setup') w *= 0.4;
    } else if (gap <= -2) {
      if (move.category === 'lockdown') w *= 2.2;
      if (move.category === 'disruption') w *= 1.6;
      if (move.category === 'aggressive') w *= 0.6;
    }

    const recentTypes = match._playerCardTypesLast3 || [];
    const comboCount = recentTypes.filter(t => t === 'combo').length;
    const setupCount = recentTypes.filter(t => t === 'setup').length;
    const defenseCount = recentTypes.filter(t => t === 'defense').length;

    if (comboCount >= 2 && move.category === 'disruption') w *= 2.0;
    if (setupCount >= 2 && move.category === 'aggressive') w *= 1.6;
    if (defenseCount >= 2 && move.category === 'lockdown') w *= 0.6;

    if (match.round >= 5 && move.category === 'big') w *= 2.8;
    if (match.round === 1 && move.category === 'big') w *= 0.1;

    if (match._cardsPlayedThisMatch && match._cardsPlayedThisMatch.length >= 6
        && move.category === 'disruption') w *= 1.4;

    if (match.round === 6 && move.category === 'setup') w *= 0.2;

    if (stage === 3) {
      if (gap <= -1 && move.bigMove) w *= 1.4;
      if (match._oppMoveSuccessChain >= 2) w *= 1.3;
    }

    w *= (0.85 + rand() * 0.3);

    return Math.max(0, w);
  }

  function drawMove(match) {
    const opp = match.opp;
    if (!opp._oppDeck || opp._oppDeck.length === 0) return null;

    const weighted = opp._oppDeck.map(id => ({ id, w: weightForMove(id, match, opp) }));
    const total = weighted.reduce((s, e) => s + e.w, 0);
    if (total <= 0) {
      const available = weighted.filter(e => {
        const move = OPP_MOVES[e.id];
        const cdUntil = opp._oppCooldowns[e.id] || 0;
        if (match.round < cdUntil) return false;
        if (move.condition && !move.condition(match)) return false;
        return true;
      });
      if (available.length === 0) return null;
      return OPP_MOVES[pick(available).id];
    }

    let r = rand() * total;
    for (const e of weighted) {
      r -= e.w;
      if (r <= 0) {
        const move = OPP_MOVES[e.id];
        opp._oppCooldowns[e.id] = match.round + move.cooldown;
        opp._oppDrawHistory.push({ round: match.round, id: e.id });
        return move;
      }
    }
    return OPP_MOVES[weighted[weighted.length - 1].id];
  }

  function applyMoveOnDraw(match, move, onEvent) {
    if (!move || !move.onDraw) return;
    try {
      move.onDraw(match);
    } catch (e) {
      if (typeof console !== 'undefined') console.error('opp move onDraw failed', move.id, e);
    }
    match._oppMoveCurrent = move.id;
    match._oppMoveCurrentCategory = move.category;
  }

  function applyMoveOnResolve(match, onEvent) {
    const currentId = match._oppMoveCurrent;
    if (!currentId) return;
    const move = OPP_MOVES[currentId];
    if (move && move.onResolve) {
      try { move.onResolve(match, onEvent); } catch (e) {}
    }
    match._oppMoveCurrent = null;
    match._oppMoveCurrentCategory = null;
  }

  function consumePerRoundFlags(match) {
    match._oppMoveShotBonus = 0;
    match._oppMoveBuildupMalus = 0;
    match._oppMoveSaveBonus = 0;
    match._oppMoveQuickStrike = false;
    match._oppMoveCounterBlitzArmed = false;
    match._oppMoveExtraAttacks = 0;
    match._oppMoveComboDampen = 1.0;
    match._oppMoveFakePress = false;
    match._oppMoveFoulPending = false;
    match._oppMoveDirtyTackleVictim = null;
    if (match._oppMoveStudyTapeRoundsLeft > 0) match._oppMoveStudyTapeRoundsLeft--;
    if (match._oppMoveTikiTakaActive > 0) match._oppMoveTikiTakaActive--;
  }

  function blockSignalledMove(match, moveId, onEvent) {
    if (match._oppMoveCurrent !== moveId) return false;
    if (moveId === 'signature_play') {
      match._oppMoveSignatureBlocked = true;
      match._oppMoveSignatureArmed = false;
      return true;
    }
    if (moveId === 'desperation_push') {
      match._oppMoveDesperationBlocked = true;
      match._oppMoveExtraAttacks = Math.max(0, (match._oppMoveExtraAttacks || 0) - 2);
      return true;
    }
    if (moveId === 'tiki_taka_press') {
      match._oppMoveTikiTakaBlocked = true;
      match._oppMoveTikiTakaActive = 0;
      return true;
    }
    return false;
  }

  function blockAnyBigMove(match) {
    const cur = match._oppMoveCurrent;
    if (!cur) return false;
    const move = OPP_MOVES[cur];
    if (!move || !move.bigMove) return false;
    return blockSignalledMove(match, cur, null);
  }

  function getTelegraphedThreat(match) {
    const cur = match._oppMoveCurrent;
    if (!cur) return null;
    const move = OPP_MOVES[cur];
    if (!move) return null;
    const minSev = KL.config?.CONFIG?.oppMoveTelegraphMinSeverity ?? 2;
    if (move.severity < minSev) return null;
    return { id: cur, severity: move.severity, category: move.category, name: cur };
  }

  KL.oppMoves = {
    OPP_MOVES,
    ARCHETYPES,
    initOppDeck,
    drawMove,
    applyMoveOnDraw,
    applyMoveOnResolve,
    consumePerRoundFlags,
    blockSignalledMove,
    blockAnyBigMove,
    getTelegraphedThreat,
    getIntelligenceStage,
    pickArchetype,
    weightForMove
  };
})();
