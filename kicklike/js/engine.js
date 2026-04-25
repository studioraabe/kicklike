(() => {
  const KL = window.KL;
  const { rand, clamp, sleep, pick, pickLog } = KL.util;
  const { CONFIG, DATA, TACTIC_FIT } = KL.config;

  const computePlayerStats  = (...a) => KL.stats.computePlayerStats(...a);
  const aggregateTeamStats  = (...a) => KL.stats.aggregateTeamStats(...a);
  const dispatchTrigger     = (...a) => KL.traits.dispatch(...a);
  const flushTriggerLog     = (...a) => KL.traits.flushLog(...a);
  const applyOppTraitEffect = (...a) => KL.traits.applyOppTraitEffect(...a);

  // Lazy-Binding: applyDecision ist in decisions.js definiert, das erst nach
  // engine.js geladen wird. Bei Aufruf (zur Match-Zeit) ist es verfügbar.
  // Wendet die Synergy/Conflict/Legendary-Multiplier auf Taktik-Buff-Layer an.
  const applyDecision = (match, decision, phase, state) => {
    if (typeof window.applyDecision === 'function') {
      window.applyDecision(match, decision, phase, state);
    } else {
      applyTactic(match, decision, phase);
    }
  };

  // Erfolgs-Events, die Entscheidungs-XP triggern wenn der Spieler
  // eine Focus-Rolle der aktiven Taktik hat.
  const DECISION_SUCCESS_EVENTS = new Set([
    'goals', 'saves', 'buildupsOk', 'defendedAttacks', 'counters'
  ]);

  // Micro-Boost-Schwellen pro Rolle (Scenario B — rollenspezifisch balanciert).
  // VT farmt strukturell die meisten Decision-XP (defendedAttacks pro Match),
  // ST die wenigsten (goals sind selten). Schwellen gleichen das aus, damit
  // jede Rolle etwa 3-4 Boosts über einen 15-Match-Run bekommt.
  const MICRO_BOOST_THRESHOLD = {
    TW: 3,
    VT: 6,
    PM: 3,
    LF: 3,
    ST: 2
  };

  // Focus-Stat pro Rolle — das ist der Stat, der beim Micro-Boost +1 bekommt.
  const ROLE_FOCUS_STAT = {
    TW: 'defense',
    VT: 'defense',
    PM: 'vision',
    LF: 'tempo',
    ST: 'offense'
  };

  function bumpPlayerStat(player, key, delta = 1, match) {
    if (!player) return;
    if (!player._matchStats) player._matchStats = {};
    player._matchStats[key] = (player._matchStats[key] || 0) + delta;

    // Entscheidungs-XP: wenn aktuell eine Taktik-Phase aktiv ist, deren
    // Focus-Rollen diesen Spieler einschließen, und das ein Erfolgs-Event
    // ist — Bonus-XP buchen. Der Multiplier skaliert mit dem Run, damit
    // Spät-Matches echte XP-Abhängigkeit von guten Entscheidungen haben.
    if (!match || !DECISION_SUCCESS_EVENTS.has(key)) return;
    const r = match.round || 1;
    const focus = match._decisionFocus;
    if (!focus) return;

    for (const phase of Object.keys(focus)) {
      const info = focus[phase];
      if (r < info.range[0] || r > info.range[1]) continue;
      if (!info.roles.includes(player.role)) continue;

      // Bonus-XP: 1 pro Event, skaliert sanft mit Match-Nummer für
      // Rogue-like-Charakter (späte Matches hängen stärker an Entscheidungen).
      const matchNum = (window.state?.matchNumber || 0) + 1;
      const scale = matchNum >= 10 ? 2 : matchNum >= 5 ? 1.5 : 1;
      const bonusXp = Math.ceil(delta * scale);

      player._matchStats.decisionXp = (player._matchStats.decisionXp || 0) + bonusXp;
      // Track die Taktik, die den Bonus ausgelöst hat (für Result-Anzeige)
      player._matchStats._decisionXpSources = player._matchStats._decisionXpSources || {};
      const srcKey = info.tacticName || info.tacticId;
      player._matchStats._decisionXpSources[srcKey] =
        (player._matchStats._decisionXpSources[srcKey] || 0) + bonusXp;

      // --- Micro-Boost-Trigger ---
      // Spieler akkumulieren Decision-XP über den gesamten Run in
      // p._decisionXpBank. Bei Überschreiten der rollen-spezifischen
      // Schwelle wird +1 auf den Focus-Stat gebucht (permanent).
      player._decisionXpBank = (player._decisionXpBank || 0) + bonusXp;
      const threshold = MICRO_BOOST_THRESHOLD[player.role] || 5;
      while (player._decisionXpBank >= threshold) {
        player._decisionXpBank -= threshold;
        const stat = ROLE_FOCUS_STAT[player.role];
        if (stat && player.stats[stat] !== undefined) {
          // Clamp wie im Rest der Engine: 20-99
          player.stats[stat] = Math.min(99, Math.max(20, player.stats[stat] + 1));
          // Track die Boosts für Result-Anzeige und Match-Log-Toast
          player._matchStats._microBoosts = player._matchStats._microBoosts || [];
          player._matchStats._microBoosts.push({
            stat, newValue: player.stats[stat], round: r
          });
          // Match merkt sich einen Queue fürs Log-Rendering (ui.js kann
          // das abgreifen und als Toast zeigen)
          match._microBoostQueue = match._microBoostQueue || [];
          match._microBoostQueue.push({
            playerId: player.id, playerName: player.name, role: player.role, stat, newValue: player.stats[stat]
          });
        }
      }
      break; // ein Phase-Match reicht — keine doppelte Buchung
    }
  }

  function resetPlayerMatchStats(players = []) {
    for (const p of players) {
      p._matchStats = {
        shots: 0, shotsOnTarget: 0, goals: 0,
        buildups: 0, buildupsOk: 0,
        saves: 0, goalsConceded: 0,
        defendedAttacks: 0, counters: 0
      };
    }
  }

  function freshPlayerMemory() {
    return {
      consecutiveMisses: 0,
      consecutiveGoals: 0,
      savesInRow: 0,
      concededInRow: 0,
      okBuildupsInRow: 0,
      failedBuildupsInRow: 0,
      frustration: 0,
      confidence: 0,
      lastAction: null,
      streakState: null,
      roundsInState: 0,
      pushPending: false
    };
  }

  function initMatchMemory(match) {
    const mem = {
      myPlayerStates: {},
      oppPlayerStates: {},
      consecutiveConceded: 0,
      consecutiveScored: 0,
      lastRoundConceded: null,
      lastRoundScored: null,
      myAttackDrought: 0,
      oppAttackDrought: 0,
      hotFlank: null,
      flankStreak: 0,
      yellowCards: {},
      redCards: new Set()
    };
    for (const p of match.squad || []) {
      mem.myPlayerStates[p.id] = freshPlayerMemory();
    }
    for (const op of match.opp?.lineup || []) {
      mem.oppPlayerStates[op.id] = freshPlayerMemory();
    }
    match.memory = mem;
  }

  function getMemState(match, playerOrId, isOpp) {
    if (!match.memory) return null;
    const id = (typeof playerOrId === 'string') ? playerOrId : playerOrId?.id;
    if (!id) return null;
    const bucket = isOpp ? match.memory.oppPlayerStates : match.memory.myPlayerStates;
    if (!bucket[id]) bucket[id] = freshPlayerMemory();
    return bucket[id];
  }

  function recordAction(match, playerOrId, action, isOpp) {
    const mem = getMemState(match, playerOrId, isOpp);
    if (!mem) return;
    mem.lastAction = action;
    switch (action) {
      case 'goal':
        mem.consecutiveGoals++;
        mem.consecutiveMisses = 0;
        mem.confidence = Math.min(5, mem.confidence + 2);
        mem.frustration = Math.max(0, mem.frustration - 2);
        break;
      case 'miss':
        mem.consecutiveMisses++;
        mem.consecutiveGoals = 0;
        mem.frustration = Math.min(5, mem.frustration + 1);
        mem.confidence = Math.max(-3, mem.confidence - 1);
        break;
      case 'save':
        mem.savesInRow++;
        mem.concededInRow = 0;
        mem.confidence = Math.min(5, mem.confidence + 1);
        break;
      case 'concede':
        mem.concededInRow++;
        mem.savesInRow = 0;
        mem.confidence = Math.max(-3, mem.confidence - 2);
        mem.frustration = Math.min(5, mem.frustration + 1);
        break;
      case 'buildup_ok':
        mem.okBuildupsInRow++;
        mem.failedBuildupsInRow = 0;
        mem.confidence = Math.min(5, mem.confidence + 1);
        break;
      case 'buildup_fail':
        mem.failedBuildupsInRow++;
        mem.okBuildupsInRow = 0;
        mem.frustration = Math.min(5, mem.frustration + 1);
        break;
      case 'defended':
        mem.confidence = Math.min(5, mem.confidence + 1);
        break;
    }
  }

  function evalStreakStates(match, isOpp) {
    if (!match.memory) return [];
    const bucket = isOpp ? match.memory.oppPlayerStates : match.memory.myPlayerStates;
    const players = isOpp ? (match.opp?.lineup || []) : (match.squad || []);
    const newlyEntered = [];

    for (const p of players) {
      const mem = bucket[p.id];
      if (!mem) continue;
      const prev = mem.streakState;
      let next = null;

      if (p.role === 'TW') {
        if (mem.savesInRow >= 3) next = 'zone';
        else if (mem.concededInRow >= 2) next = 'cold';
      } else if (p.role === 'ST' || p.role === 'LF') {
        if (mem.consecutiveGoals >= 2) next = 'zone';
        else if (mem.consecutiveMisses >= 3) next = 'cold';
        else if (mem.consecutiveMisses >= 2 && match.round >= 4) next = 'frustrated';
      } else if (p.role === 'PM') {
        if (mem.okBuildupsInRow >= 3) next = 'zone';
        else if (mem.failedBuildupsInRow >= 3) next = 'cold';
      }

      const hasIceInVeins = !isOpp && p.traits?.includes('ice_in_veins');
      if (hasIceInVeins && (next === 'cold' || next === 'frustrated')) next = null;

      if (next !== prev) {
        mem.streakState = next;
        mem.roundsInState = 0;
        if (next) newlyEntered.push({ player: p, state: next, isOpp });
      } else if (next) {
        mem.roundsInState++;
      }
    }
    return newlyEntered;
  }

  async function logStreakEntries(entries, onEvent) {
    for (const entry of entries) {
      const { player, state, isOpp } = entry;
      const teamName = isOpp ? (window.state?.currentOpponent?.name || '') : '';
      const ns = isOpp ? 'oppTeam' : 'myTeam';
      const key = `ui.log.streak.${ns}.${state}`;
      const msg = window.I18N.t(key, { name: player.name, team: teamName });
      await onEvent({ type: 'log', cls: 'streak', msg });
    }
  }

  function isSuspended(player, match) {
    if (!match?.memory) return false;
    return match.memory.redCards?.has(player?.id);
  }

  function applyStreakStatMod(player, match, stats, isOpp = false) {
    if (!match?.memory) return;
    const bucket = isOpp ? match.memory.oppPlayerStates : match.memory.myPlayerStates;
    const mem = bucket?.[player.id];
    if (!mem?.streakState) return;
    if (mem.streakState === 'zone') {
      if (player.role === 'ST' || player.role === 'LF') {
        stats.offense = (stats.offense || 0) + 10;
        stats.composure = (stats.composure || 0) + 4;
      } else if (player.role === 'TW') {
        stats.defense = (stats.defense || 0) + 8;
        stats.composure = (stats.composure || 0) + 6;
      } else if (player.role === 'PM') {
        stats.vision = (stats.vision || 0) + 8;
      }
    } else if (mem.streakState === 'cold') {
      if (player.role === 'ST' || player.role === 'LF') {
        stats.offense = (stats.offense || 0) - 6;
        stats.composure = (stats.composure || 0) - 8;
      } else if (player.role === 'TW') {
        stats.defense = (stats.defense || 0) - 4;
        stats.composure = (stats.composure || 0) - 6;
      } else if (player.role === 'PM') {
        stats.vision = (stats.vision || 0) - 5;
      }
    } else if (mem.streakState === 'frustrated') {
      stats.composure = (stats.composure || 0) - 5;
    }
  }

  function getTeamDisplayName(squad) {
    return (window.state?.teamName) || window.I18N.t('ui.hub.yourTeam');
  }

  function oppPlayer(opp, role) {
    if (!opp?.lineup) return null;
    return opp.lineup.find(p => p.role === role) || null;
  }

  function pickOppScorer(opp) {
    if (!opp?.lineup) return { name: opp?.name || 'Opponent', role: 'ST' };
    const holders = opp.traitHolders || {};
    if (holders.sniper) return holders.sniper;
    if (holders.sturm) return holders.sturm;
    if (holders.clutch_opp) return holders.clutch_opp;
    const st = opp.lineup.find(p => p.role === 'ST');
    if (st && rand() < 0.72) return st;
    const lf = opp.lineup.find(p => p.role === 'LF');
    if (lf && rand() < 0.60) return lf;
    return st || lf || opp.lineup[0];
  }

  function pickOppPlaymaker(opp) {
    return oppPlayer(opp, 'PM') || { name: opp.name, role: 'PM' };
  }

  function pickOppKeeper(opp) {
    return oppPlayer(opp, 'TW') || { name: opp.name, role: 'TW' };
  }

  function pickOppDefender(opp) {
    return oppPlayer(opp, 'VT') || { name: opp.name, role: 'VT' };
  }

  // v0.44 — Elfmeter-Schütze aus der eigenen Elf. Höchster Composure
  // gewinnt, bei Gleichstand höchste Offense. Fallback auf den
  // eigentlichen Scorer, falls squad aus irgendeinem Grund leer ist.
  function pickOurPenaltyShooter(squad, fallbackScorer) {
    if (!Array.isArray(squad) || squad.length === 0) return fallbackScorer;
    const sorted = squad.slice().sort((a, b) => {
      const cDiff = (b.stats?.composure || 0) - (a.stats?.composure || 0);
      if (cDiff !== 0) return cDiff;
      return (b.stats?.offense || 0) - (a.stats?.offense || 0);
    });
    return sorted[0] || fallbackScorer;
  }

  function getOppPlayerStats(player, match) {
    const opp = match?.opp;
    const baseTeamStats = opp?.stats || {};
    const rb = opp?._roundBuffs || {};
    const stats = {
      offense: player?.stats?.offense ?? baseTeamStats.offense ?? 50,
      defense: player?.stats?.defense ?? baseTeamStats.defense ?? 50,
      tempo: player?.stats?.tempo ?? baseTeamStats.tempo ?? 50,
      vision: player?.stats?.vision ?? baseTeamStats.vision ?? 50,
      composure: player?.stats?.composure ?? baseTeamStats.composure ?? 50
    };

    if (player?.role === 'TW' || player?.role === 'VT') {
      stats.defense += (rb.defense || 0);
    }
    if (player?.role === 'ST' || player?.role === 'LF') {
      stats.offense += (rb.offense || 0);
      stats.tempo += (rb.tempo || 0);
    }
    // v52.2 — composure applies to every role's save/attack calculations
    // (TW/VT/PM feed save composure; ST/LF feed attack composure), so
    // the _roundBuffs.composure debuff from mindgames must reach all
    // of them. Previously this line didn't exist and the entire
    // mindgames mechanical effect was silent — debuff written to
    // _roundBuffs.composure, never read anywhere.
    stats.composure += (rb.composure || 0);

    // Passive opp aura (Phase D). Bosse bekommen garantiert einen Aura-
    // Trait, der auf jeden Gegner-Spieler wirkt — Spiegel der passiven
    // Spieler-Traits wie captain_boost. Der Zähler läuft gededupt, max.
    // 1 Fire pro Runde.
    if (opp?.traits?.includes('boss_aura')) {
      const boost = KL.config.CONFIG.bossAuraStatBonus || 6;
      stats.offense   += boost;
      stats.defense   += boost;
      stats.tempo     += Math.round(boost * 0.7);
      stats.vision    += Math.round(boost * 0.7);
      stats.composure += boost;
      if (match?.stats) {
        match._oppAuraSeen = match._oppAuraSeen || {};
        const key = `boss_aura:${match.round || 0}`;
        if (!match._oppAuraSeen[key]) {
          match._oppAuraSeen[key] = true;
          match.stats.oppTriggersFired = (match.stats.oppTriggersFired || 0) + 1;
          match._oppTraitFireCounts = match._oppTraitFireCounts || {};
          match._oppTraitFireCounts.boss_aura = (match._oppTraitFireCounts.boss_aura || 0) + 1;
        }
      }
    }

    // Spieler-Traits auf oppStatCompute dispatchen — intimidate und
    // Artverwandte wirken hier auf Gegner-Werte. Die frühere Dispatch-
    // Stelle in computeOppStats war tot (wird nirgends aufgerufen), der
    // Pfad ist über getOppPlayerStats der einzig aktive.
    if (KL.traits?.dispatch && player?.role) {
      const ctx = { oppStats: stats, oppRole: player.role, match };
      KL.traits.dispatch('oppStatCompute', ctx);
    }

    applyStreakStatMod(player, match, stats, true);
    return stats;
  }

  function averageEffectiveTeamStats(lineup, match) {
    const totals = { offense: 0, defense: 0, tempo: 0, vision: 0, composure: 0 };
    const players = (lineup || []).filter(Boolean);
    const count = Math.max(1, players.length);
    for (const player of players) {
      const stats = computePlayerStats(player, match);
      for (const key of Object.keys(totals)) totals[key] += (stats[key] || 0);
    }
    for (const key of Object.keys(totals)) totals[key] = totals[key] / count;
    return totals;
  }

  function log(onEvent, cls, msg) {
    return onEvent({ type: 'log', cls, msg });
  }

  // Phase-shift log line — writes a narrative beat describing the phase
  // change. Called from engine events that trigger phase transitions.
  // Skips redundant shifts (same-phase transitions) and very early /
  // late windows where the narrative would feel forced.
  async function logPhaseShift(match, onEvent, toPhase, trigger) {
    const from = match._loggedPhase || match.matchPhase;
    if (from === toPhase) return;   // dedupe
    match._loggedPhase = toPhase;
    const keyMap = {
      'ownGoal':      'ui.phase.shiftOwnGoal',
      'conceded':     'ui.phase.shiftConceded',
      'save':         'ui.phase.shiftSave',
      'miss':         'ui.phase.shiftMiss',
      'laneOpen':     'ui.phase.shiftLaneOpen',
      'possession':   'ui.phase.shiftPossession',
      'defensive':    'ui.phase.shiftDefensive'
    };
    const fallbacks = {
      'ownGoal':      'Back to build-up — restart from the keeper.',
      'conceded':     'Defensive mode — pull back, absorb the blow.',
      'save':         'Transition! Quick ball forward — counter lane opens.',
      'miss':         'Chance gone — possession swings back, regroup.',
      'laneOpen':     'Attack phase — lane is open, press forward.',
      'possession':   'Possession phase — the team is orchestrating.',
      'defensive':    'Defensive reset — back into shape after two rough rounds.'
    };
    const key = keyMap[trigger];
    let msg = null;
    if (window.I18N && key) {
      // pickText picks randomly from variant array at the key path.
      const picked = window.I18N.pickText(key);
      // Returns path if missing/empty → detect fallback needed.
      if (picked && picked !== key) msg = picked;
    }
    if (!msg) msg = fallbacks[trigger];
    if (!msg) return;
    await log(onEvent, 'phase-shift', `${msg}`);
  }

  const TACTIC_HANDLERS = {
    pressing_trigger: async (match, squad, onEvent) => {
      if (rand() < 0.25) {
        match.counterPending = true;
        await log(onEvent, 'trigger', window.I18N.t('ui.log.tacticPressingTrigger'));
      }
    },
    counter_trigger: async (match, squad, onEvent) => {
      if (rand() < 0.30) {
        match.nextBuildupBonus = (match.nextBuildupBonus || 0) + 0.12;
        await log(onEvent, 'trigger', window.I18N.t('ui.log.tacticCounterTrigger'));
      }
    },
    rally_trigger: async (match, squad, onEvent) => {
      const deficit = match.scoreOpp - match.scoreMe;
      if (deficit > 0) {
        const bonus = Math.round(deficit * 3);
        match.teamBuffs.offense = (match.teamBuffs.offense || 0) + bonus;
        await log(onEvent, 'trigger', window.I18N.t('ui.log.tacticRallyTrigger', { bonus }));
      }
    },
    high_press_trigger: async (match, squad, onEvent) => {
      if (rand() < 0.20) {
        match.counterPending = true;
        await log(onEvent, 'trigger', window.I18N.t('ui.log.tacticHighPressTrigger'));
      }
    },
    final_press_trigger: async (match, squad, onEvent) => {
      if (rand() < 0.35) {
        match.counterPending = true;
        await log(onEvent, 'trigger', window.I18N.t('ui.log.tacticFinalPressTrigger'));
      }
    }
  };

  async function dispatchTacticTrigger(triggerName, match, squad, onEvent) {
    if (!triggerName) return;
    const handler = TACTIC_HANDLERS[triggerName];
    if (handler) await handler(match, squad, onEvent);
  }

  // Effective opp stat = base + any match-level buff. The `oppBuffs` slot
  // exists on the match object as a future extension point (team-level
  // buffs that aren't per-player). Currently no code writes to it, but
  // the read is kept so a future feature can enable match-level opp
  // boosts without requiring every call site to be updated. Per-round
  // opp debuffs from tactics (mindgames, cold_read, tactical_foul) live
  // in `opp._roundBuffs` and are applied at `getOppPlayerStats`-read time,
  // not here.
  function oppStat(match, key) {
    const base = match.opp?.stats?.[key] || 0;
    const buff = match.oppBuffs?.[key] || 0;
    return base + buff;
  }

  // Match-difficulty curve — a multiplier in the 1.02…1.50 range that
  // scales several opp-advantage calculations (offense output, defense
  // save chance, buildup resistance) with match number. Was inlined
  // in three places with different variable names after the v52.2
  // snowball-balance work; unified here so a future tuning pass
  // touches exactly one spot. Curve stays identical to what those
  // three inlines computed:
  //
  //   M1-5  (onboarding): 2% per match → up to +10% at first boss (M5)
  //   M6-10 (mid-run)   : 3% per match → up to +25% at second boss (M10)
  //   M11-15 (late)     : 5% per match → up to +50% at league final (M14/15)
  //
  // Returns a full multiplier (1 + boost), not just the boost portion,
  // because every caller uses it that way.
  // v0.52 — Format tactic personal-mutation deltas for the picker
  // preview. Reads `match._lastTacticPersonalMutations`, an array of
  // `{ role, stat, delta }` entries that applyTactic stashes when a
  // tactic handler directly mutated `player.stats.X` instead of
  // pushing a buff layer. Groups by role+stat (so "TW DEF +27, VT
  // DEF +13" reads naturally), drops the team-stat suffix the buff
  // string already shows, and wraps in parentheses to visually
  // separate from the team-buff bracket.
  //
  // Returns '' when there were no personal mutations.
  function formatTacticPersonalMutations(match) {
    const muts = match?._lastTacticPersonalMutations;
    if (!Array.isArray(muts) || !muts.length) return '';
    const STAT_LABEL = { offense: 'OFF', defense: 'DEF', tempo: 'TMP', vision: 'VIS', composure: 'CMP' };
    // Group identical role+stat entries (in case a future handler
    // mutated the same stat in two passes — current handlers don't,
    // but defensive against future churn).
    const merged = {};
    for (const m of muts) {
      const key = m.role + ':' + m.stat;
      merged[key] = (merged[key] || 0) + m.delta;
    }
    const parts = Object.entries(merged).map(([key, d]) => {
      const [role, stat] = key.split(':');
      const sign = d > 0 ? '+' : '';
      return `${role} ${STAT_LABEL[stat] || stat.toUpperCase()} ${sign}${d}`;
    });
    return '(' + parts.join(', ') + ')';
  }

  function matchDifficulty() {
    const mn = (window.state?.matchNumber || 0) + 1;
    if (mn <= 5)  return 1 + mn * 0.02;
    if (mn <= 10) return 1 + 0.10 + (mn - 5) * 0.03;
    return 1 + 0.25 + (mn - 10) * 0.05;
  }

  // Match-internal opponent adaptation — see full implementation below
  // near line 695. (An earlier scaffold lived here and has been removed;
  // the later declaration is the canonical one.)

  function recomputeTeamBuffs(match) {
    const r = match.round || 1;
    const prev = match.teamBuffs || {};
    const agg = { offense: 0, defense: 0, tempo: 0, vision: 0, composure: 0 };
    const STICKY_KEYS = ['saveBonus', 'buildupMalus', 'tempoBonus'];
    for (const key of STICKY_KEYS) {
      if (typeof prev[key] === 'number') agg[key] = prev[key];
    }
    for (const layer of match.buffLayers || []) {
      if (r < layer.range[0] || r > layer.range[1]) continue;
      for (const [k, v] of Object.entries(layer.stats || {})) {
        agg[k] = (agg[k] || 0) + v;
      }
      if (layer.special === 'rally' && r >= 4) {
        agg.offense += match.scoreOpp * 6;
        agg.defense += match.scoreMe  * 6;
      }
    }
    // v0.36 — Buff cap reworked from hard ceiling to diminishing returns.
    //
    // Before: every over-cap contribution just got clipped to 25, so once
    // the player had 2-3 offense buffs in range the stat pinned at the
    // cap for the rest of the match. Telemetry from 0.35.0 showed offense
    // sitting at the cap for 67% of Match 7's card plays — the cap was
    // functioning as a "resting maximum" rather than a ceiling.
    //
    // Now: contributions above a SOFT cap (default 15) only count at half
    // weight. A hard cap (default 25) stays as safety net. The result is
    // that stacking the same stat has a genuine opportunity cost — the
    // fourth +8 offense layer adds only +4 to the effective stat, not +8.
    // Mirrored symmetrically for negative buffs (malus stacking also
    // diminishes past the -15 floor).
    const softCap   = CONFIG.teamBuffSoftCap   ?? 15;
    const softFloor = CONFIG.teamBuffSoftFloor ?? -15;
    const hardCap   = CONFIG.teamBuffHardCap   ?? 25;
    const hardFloor = CONFIG.teamBuffHardFloor ?? -25;
    const SOFT_FACTOR = CONFIG.teamBuffSoftFactor ?? 0.5;
    for (const k of ['offense','defense','tempo','vision','composure']) {
      let v = agg[k];
      if (v > softCap) {
        v = softCap + (v - softCap) * SOFT_FACTOR;
      } else if (v < softFloor) {
        v = softFloor + (v - softFloor) * SOFT_FACTOR;
      }
      if (v > hardCap)   v = hardCap;
      if (v < hardFloor) v = hardFloor;
      agg[k] = Math.round(v);
    }
    match.teamBuffs = agg;
  }

  // Opp-Mood State Machine.
  //
  // In-match emotional state for the opposition team. Reacts to score
  // differential and round number. Produces stat-buff layers that apply
  // to the opp side — previously their stats were flat across a match.
  //
  // Moods:
  //   neutral     — default, no modifiers
  //   cruising    — they lead, late rounds, complacent: -3 OFF / -3 TMP
  //   bottling    — they led but we caught up, late: -4 OFF / -5 CMP / +2 DEF
  //                 (afraid to lose the lead — play it safe, get nervous)
  //   rattled     — they trail by 2+, mid-match: -4 OFF / +3 DEF
  //                 (retreat into shell, try to stop bleeding)
  //   desperate   — they trail by 2+, late rounds: +8 OFF / -6 DEF / -3 CMP
  //                 (all-in, nothing to lose mode — dangerous on counters)
  //
  // Each mood is a single buff layer on oppBuffLayers that spans remaining
  // rounds. Only ONE mood active at a time — transitions replace the
  // previous layer. Initial check at round start.
  function checkOppMood(match) {
    const r = match.round || 1;
    const me = match.scoreMe || 0;
    const opp = match.scoreOpp || 0;
    const diff = opp - me;   // positive = they lead, negative = we lead
    const late = r >= 4;
    const mid  = r >= 2 && r <= 4;

    let newMood = 'neutral';
    if (late && diff >= 1 && diff < 3) {
      newMood = 'cruising';   // small lead late — complacent
    } else if (late && opp >= 2 && me >= opp) {
      newMood = 'bottling';   // had lead, now caught or behind — nerves
    } else if (late && diff <= -2) {
      newMood = 'desperate';  // behind by 2+ late — all-in
    } else if (mid && diff <= -2) {
      newMood = 'rattled';    // behind by 2+ early — shell up
    }

    if (match._oppMood === newMood) return null;   // no change

    // Remove any previous mood layer
    if (match.oppBuffLayers && match._oppMoodLayerIdx != null) {
      const idx = match._oppMoodLayerIdx;
      if (idx >= 0 && idx < match.oppBuffLayers.length) {
        match.oppBuffLayers.splice(idx, 1);
      }
      match._oppMoodLayerIdx = null;
    }

    // Add new mood layer if not neutral
    if (newMood !== 'neutral') {
      const MOOD_STATS = {
        cruising:  { offense: -3, tempo: -3 },
        bottling:  { offense: -4, composure: -5, defense: 2 },
        rattled:   { offense: -4, defense: 3 },
        desperate: { offense: 8, defense: -6, composure: -3 }
      };
      if (!match.oppBuffLayers) match.oppBuffLayers = [];
      match.oppBuffLayers.push({
        source: 'mood:' + newMood,
        range: [r, 6],
        stats: MOOD_STATS[newMood] || {},
        special: null
      });
      match._oppMoodLayerIdx = match.oppBuffLayers.length - 1;
    }

    const prevMood = match._oppMood;
    match._oppMood = newMood;
    return { from: prevMood || 'neutral', to: newMood };
  }

  // ─── Opp adaptation (v38) ──────────────────────────────────────────
  // Six behaviors called once per round from the round loop. Each checks
  // its own preconditions and fires at most once per match. Pushes
  // buffLayers into match for the opp side (via negative stat values
  // since our buffLayers are team-positive — opp equivalents push
  // negative stats against us, conceptually boosting their opposition).
  //
  // i18n string keys under ui.oppAdapt.<id>. All pools are 5+ variants.

  async function applyOppAdaptation(match, onEvent, r) {
    if (!match._oppAdaptLog) match._oppAdaptLog = new Set();
    const fired = match._oppAdaptLog;
    const oppName = match.opp?.name || 'opponents';
    const lead = (match.scoreMe || 0) - (match.scoreOpp || 0);
    const I18N = window.I18N;

    const pickPoolLine = (key) => {
      const pool = I18N?.list?.(key);
      if (pool && pool.length) {
        return pool[Math.floor(Math.random() * pool.length)];
      }
      return null;
    };
    const logLine = (cls, msg) => {
      if (!msg) return;
      onEvent({ type: 'log', msg: msg.replace(/\{opp\}/g, oppName), cls });
    };

    // 1) HALFTIME ADJUSTMENT — R4, reactive to score
    if (r === 4 && !fired.has('halftime_adj')) {
      fired.add('halftime_adj');
      if (lead > 0) {
        // We lead — opp tightens up defensively for 2nd half
        // v52.8 — was { offense: -3, defense: -5 }: the defense -5 had no
        // narrative basis (opp tightening defensively shouldn't weaken our
        // keeper). Re-aligned to penalize OFFENSE (their compact shape
        // suffocates our scoring) and VISION (harder to find the killer
        // pass). Same total magnitude (-9 vs -8 before).
        match.buffLayers.push({
          source: 'opp_adapt:halftime_defensive',
          range: [4, 6],
          stats: { offense: -6, vision: -3 },
          special: null
        });
        logLine('opp-adapt', pickPoolLine('ui.oppAdapt.halftimeDefensive')
          || '{opp} regroup at the break — tighter shape expected second half.');
      } else if (lead < 0) {
        // We trail — opp comes out aggressive to kill the match
        // v52.8 — was { offense: -4, defense: 2 }: aggressive opp should
        // OPEN UP the game (our counters viable, +offense) AND threaten
        // our backline (-defense), not the inverse. Fixed alongside rage,
        // desperation, equaliserPush.
        match.buffLayers.push({
          source: 'opp_adapt:halftime_aggressive',
          range: [4, 6],
          stats: { offense: 3, defense: -7 },
          special: null
        });
        logLine('opp-adapt', pickPoolLine('ui.oppAdapt.halftimeAggressive')
          || '{opp} come out firing after the break — going for the throat.');
      } else {
        // Tied — opp makes a measured adjustment
        match.buffLayers.push({
          source: 'opp_adapt:halftime_balanced',
          range: [4, 6],
          stats: { tempo: -2, vision: -2 },
          special: null
        });
        logLine('opp-adapt', pickPoolLine('ui.oppAdapt.halftimeBalanced')
          || '{opp} cool heads at the break — subtle tactical tweaks.');
      }
    }

    // 2) RAGE THRESHOLD — we lead by 2+, opp goes all-out-attack
    if (lead >= 2 && !fired.has('rage')) {
      fired.add('rage');
      // v52.8 — was { offense: -6, defense: 4, composure: 3 }: narrative
      // says "leaving gaps at the back" → MY OFFENSE should rise, not
      // fall. And "throw everything" → MY DEFENSE should suffer, not get
      // buffed. Composure -3 stays player-side because the chaos rattles
      // both teams. Fixed semantics, slightly negative net (-7) — still
      // dangerous to leak goals despite the counter chances.
      match.buffLayers.push({
        source: 'opp_adapt:rage',
        range: [r, 6],
        stats: { offense: 4, defense: -8, composure: -3 },
        special: null
      });
      logLine('opp-adapt', pickPoolLine('ui.oppAdapt.rage')
        || '{opp} throw everything at it now — leaving gaps at the back.');
    }

    // 3) READ TACTIC — we've played 3+ combo/trigger cards, opp defends smarter
    const combosPlayed = (match._cardsPlayedThisMatch || []).filter(c => {
      const def = window.KL?.cards?.getCardDef?.(c.id);
      return def && (def.type === 'combo' || def.type === 'trigger');
    }).length;
    if (combosPlayed >= 3 && !fired.has('read_tactic')) {
      fired.add('read_tactic');
      match.buffLayers.push({
        source: 'opp_adapt:read_tactic',
        range: [r, 6],
        stats: { offense: -4 },
        special: null
      });
      logLine('opp-adapt', pickPoolLine('ui.oppAdapt.readTactic')
        || '{opp} are onto us — they see the pattern now.');
    }

    // 4) SCOUT LAYER — only fires R1 of boss matches (from CONFIG,
    //    currently M7 and M14 in the 14-match league season).
    const matchNum = window.state?.matchNumber ? (window.state.matchNumber) : 0;
    const bossList = window.CONFIG?.bossMatches || [];
    const isBoss = bossList.includes(matchNum);
    if (r === 1 && isBoss && !fired.has('scout')) {
      fired.add('scout');
      match.buffLayers.push({
        source: 'opp_adapt:scout',
        range: [1, 6],
        stats: { offense: -4, defense: -3, vision: -4 },   // was -2/-2/-3, bumped for scaling
        special: null
      });
      logLine('opp-adapt', pickPoolLine('ui.oppAdapt.scout')
        || "{opp}'s staff have studied us — they know our go-to plays.");
    }

    // 5) LATE-GAME DESPERATION — R5+ and opp behind, all-out push
    if (r >= 5 && lead >= 1 && !fired.has('desperation')) {
      fired.add('desperation');
      // v52.8 — was { offense: -8, defense: 5, tempo: -3 }: same inverted
      // semantics as rage / equaliserPush. Late desperation push opens
      // up the game — our counters get viable, their attacks get scary,
      // tempo stretches. Net -3 (player slightly disadvantaged), with
      // each stat moving in its narratively-coherent direction.
      match.buffLayers.push({
        source: 'opp_adapt:desperation',
        range: [r, 6],
        stats: { offense: 4, defense: -10, tempo: 3 },
        special: null
      });
      logLine('opp-adapt', pickPoolLine('ui.oppAdapt.desperation')
        || '{opp} have thrown caution away — full-back becomes wing-back becomes striker.');
    }

    // 6) TACTICAL SUB — R4, opp upgrades one position stat silently.
    // Narrative only — the stat push lives in the layer.
    if (r === 4 && !fired.has('sub')) {
      fired.add('sub');
      const pos = ['offense', 'defense', 'tempo'][Math.floor(Math.random() * 3)];
      const boost = -3;
      match.buffLayers.push({
        source: 'opp_adapt:sub_' + pos,
        range: [4, 6],
        stats: { [pos]: boost },
        special: null
      });
      const posWord = pos === 'offense' ? 'up top'
                    : pos === 'defense' ? 'at the back'
                    : 'in the middle';
      logLine('opp-adapt', pickPoolLine('ui.oppAdapt.sub')?.replace('{pos}', posWord)
        || `{opp} make a change ${posWord} — fresh legs, fresh threat.`);
    }

    // 7) OPP CARD — situational card-play. v52.8 — was max 1× per match
    // which made opp feel passive vs the player's 18-24 cards. Now max 1
    // per ROUND with a 3-per-match cap, drawing from a 7-card pool that
    // spans early/mid/late game. Each card still only fires once per
    // match (no duplicates) so the variety stays intact.
    // v51: if the player has an active shield, it intercepts here.

    // i18n-Hilfe: Opp-Card-Name aus ui.oppCardNames.{id} ziehen, mit
    // Fallback auf den in OPP_CARDS hart verdrahteten Namen falls die
    // Locale einen Key nicht kennt. Dadurch sind Log-Ausgabe und Stripe-
    // Tooltip konsistent übersetzt.
    const oppCardName = (card) => {
      const key = 'ui.oppCardNames.' + card.id;
      const translated = window.I18N?.t?.(key);
      return (translated && translated !== key) ? translated : card.name;
    };

    const playedIds      = match._oppCardsPlayedThisMatch || [];
    const lastFireRound  = match._oppCardLastRound || 0;
    // v53 — war 3. In 6-Runden-Matches fiel das zu knapp aus: mit r>1-Guard
    // bleiben dem Gegner effektiv 5 Runden, und die bisherige Obergrenze
    // ließ das Spiel in der 2. Halbzeit bei Blowouts komplett ruhig werden.
    // 4 gibt dem Gegner mindestens eine Chance auf eine späte Aktion.
    const MATCH_CAP      = 4;
    // v53 — Runde 1 ist Kickoff-Terrain: der Spieler trifft seine erste
    // taktische Entscheidung, bevor der Gegner etwas macht. applyOppAdaptation
    // läuft im Flow VOR dem Kickoff-Interrupt, also würde eine Opp-Karte
    // sonst auf dem Stripe landen bevor die Kickoff-Taktik steht. Opp-Karten
    // erst ab R2 erlauben.
    const canPlayThisRound = r > 1 && playedIds.length < MATCH_CAP && lastFireRound < r;
    if (canPlayThisRound) {
      const cards = OPP_CARDS.filter(c => !playedIds.includes(c.id));
      const playable = cards.filter(c => c.condition(r, lead, match));
      if (playable.length > 0) {
        const card = playable[Math.floor(Math.random() * playable.length)];
        const shield = match._playerShield;
        const state = window.state;

        // Helper: mark card as played (replaces the old single _oppCardPlayed
        // flag). Called from all three paths (block, halve, normal play).
        const markPlayed = (id) => {
          match._oppCardsPlayedThisMatch = match._oppCardsPlayedThisMatch || [];
          match._oppCardsPlayedThisMatch.push(id);
          match._oppCardLastRound = r;
          // Legacy flag kept around for any UI code that still reads it
          // (e.g. tooltips, stat displays). Holds the most recent card id.
          match._oppCardPlayed = id;
        };

        // ── BLOCK shield: cancel the opp-card entirely ───────────────
        if (shield && shield.type === 'block') {
          markPlayed(card.id);                // still lock so opp doesn't retry
          match._playerShield = null;         // consume shield
          if (state) state._oppCardBlocksThisRun = (state._oppCardBlocksThisRun || 0) + 1;
          onEvent({
            type: 'log',
            msg: '🛡 ' + (I18N.t('ui.log.shieldBlocked', {
              shield: I18N.t('ui.cards.tactical_discipline.name') || 'TACTICAL DISCIPLINE',
              oppCard: oppCardName(card)
            }) || 'Shield absorbs the play — cancelled.').replace(/\{opp\}/g, oppName),
            cls: 'player-shield'
          });
          return;   // don't push the opp-card buff layer
        }

        // ── HALVE shield: card plays at 50% stats, shield consumed ───
        if (shield && shield.type === 'halve') {
          const halvedStats = {};
          for (const [k, v] of Object.entries(card.stats || {})) {
            halvedStats[k] = Math.round(v * 0.5);
          }
          match._playerShield = null;
          if (state) state._oppCardBlocksThisRun = (state._oppCardBlocksThisRun || 0) + 1;
          markPlayed(card.id);
          match.buffLayers.push({
            source: 'opp_card:' + card.id + ':halved',
            range: [r, Math.min(6, r + (card.duration || 1))],
            stats: halvedStats,
            special: null
          });
          // v52.8 — same recompute as the no-shield path so the halved
          // layer takes effect in the current round.
          recomputeTeamBuffs(match);
          const baseLine = pickPoolLine('ui.oppCards.' + card.id) || card.fallback;
          // v52.8 — show the halved stat impact too so the player sees
          // the shield's value (full → half).
          const STAT_LABEL_H = { offense: 'OFF', defense: 'DEF', tempo: 'TMP', vision: 'VIS', composure: 'CMP' };
          const halvedParts = Object.entries(halvedStats)
            .filter(([, v]) => v !== 0)
            .map(([k, v]) => `${STAT_LABEL_H[k] || k} ${v > 0 ? '+' : ''}${v}`);
          const dur_h = card.duration || 1;
          const halvedSuffix = halvedParts.length
            ? ` · ${halvedParts.join(' / ')}${dur_h > 1 ? ` (${dur_h}r)` : ''}`
            : '';
          onEvent({
            type: 'log',
            msg: '🛡 ' + (I18N.t('ui.log.shieldHalved', {
              shield: I18N.t('ui.cards.counter_read.name') || 'COUNTER READ',
              oppCard: oppCardName(card)
            }) || 'Counter read — half effect.').replace(/\{opp\}/g, oppName),
            cls: 'player-shield'
          });
          onEvent({
            type: 'log',
            msg: '   ' + (oppCardName(card) + ' — ' + baseLine).replace(/\{opp\}/g, oppName) + halvedSuffix,
            cls: 'opp-card'
          });
          return;
        }

        // ── REVEAL shield: log the incoming card, don't block ────────
        // Shield stays consumed (single-use) even on reveal since it
        // already did its job (gave information). Card plays normally.
        if (shield && shield.type === 'reveal') {
          match._playerShield = null;
          onEvent({
            type: 'log',
            msg: '👁 ' + (I18N.t('ui.log.shieldRevealed', {
              oppCard: oppCardName(card)
            }) || 'Intel leak — opponent loading {oppCard}.').replace(/\{opp\}/g, oppName),
            cls: 'player-shield'
          });
          // fall through to normal opp-card play below
        }

        // ── NO SHIELD (or reveal already fell through): normal play ──
        markPlayed(card.id);
        match.buffLayers.push({
          source: 'opp_card:' + card.id,
          range: [r, Math.min(6, r + (card.duration || 1))],
          stats: card.stats,
          special: null
        });
        // v52.8 — force teamBuffs recompute so the layer's effect is
        // visible in the current round's sim immediately, not only after
        // the next round-start recompute. Without this, an opp card
        // played in R5 wouldn't bite until R6 — making the "stats really
        // changed?" question genuinely hard to answer for the player.
        recomputeTeamBuffs(match);
        const baseLine = pickPoolLine('ui.oppCards.' + card.id) || card.fallback;
        // v52.8 — Surface the actual mechanical impact of the opp card
        // alongside the narrative line. Previously only flavor text was
        // shown ("Sie wittern Blut..."), leaving the player to guess
        // whether the event actually changed any stats. Now: same line
        // ends with a "· OFF -8 / DEF +4 (2r)" suffix mirroring how our
        // own card-plays already display their stat deltas. ME-frame
        // perspective: positive = bonus to my team, negative = penalty.
        const STAT_LABEL = { offense: 'OFF', defense: 'DEF', tempo: 'TMP', vision: 'VIS', composure: 'CMP' };
        const statParts = Object.entries(card.stats || {})
          .filter(([, v]) => v !== 0)
          .map(([k, v]) => `${STAT_LABEL[k] || k} ${v > 0 ? '+' : ''}${v}`);
        const dur = card.duration || 1;
        const statSuffix = statParts.length
          ? ` · ${statParts.join(' / ')}${dur > 1 ? ` (${dur}r)` : ''}`
          : '';
        // Distinct CSS class for opp-card events — visually separate
        // from regular opp-adapt lines so they read as "the opp played
        // a card", not just generic narration.
        onEvent({
          type: 'log',
          msg: '🃏 ' + (oppCardName(card) + ' — ' + baseLine).replace(/\{opp\}/g, oppName) + statSuffix,
          cls: 'opp-card'
        });
      }
    }
  }

  // ─── Opp Cards Pool ──────────────────────────────────────────────────
  // 7 contextual cards the opp can play, max 1 per round and capped at 3
  // per match (was 4 cards / 1 per match in v52.7 — opp felt passive given
  // the player plays 18-24 cards per match). Each has a condition (when
  // it fires) and a buff (negative stats = opp better, applied to the
  // PLAYER's teamBuffs as a debuff). v52.8 — semantic audit of the four
  // original cards plus three new entries (pressOverload, setPiece,
  // chainCounter) covering the early/mid-game window the original pool
  // didn't reach.
  const OPP_CARDS = [
    {
      id: 'tacticalFoul',
      name: 'TACTICAL FOUL',
      condition: (r, lead, m) => r >= 3 && r <= 5 && lead < 0 && lead >= -2,
      stats: { tempo: -5, offense: -3 },
      duration: 1,
      fallback: '{opp} stop our build-up cold — hard fouls, set-piece resets.'
    },
    {
      id: 'parkTheBus',
      name: 'PARK THE BUS',
      // v52.8 — was { defense: -7 } which weakened MY keeper; the
      // narrative is opp packing their box, which makes MY scoring
      // harder. Now hits offense + tempo (build-up stalls against the
      // wall). Stronger total impact (-9/-3) reflects how brutal a
      // parked bus actually is to break down.
      condition: (r, lead, m) => r >= 5 && lead < 0,
      stats: { offense: -9, tempo: -3 },
      duration: 2,
      fallback: '{opp} pull every player behind the ball. We have to break a wall.'
    },
    {
      id: 'equaliserPush',
      name: 'EQUALISER PUSH',
      // v52.8 — was { offense: -8, defense: 4 } which read as "opp
      // pushes → MY defense BUFFS up", semantically inverted. A real
      // equaliser push opens the game: MY counter chances grow
      // (+offense), their dangerous overload threatens my back line
      // (-defense), and the match gets stretched out (+tempo). Net
      // impact roughly neutral — the chaos cuts both ways — but each
      // stat moves in the direction the narrative suggests.
      // v53 — condition war lead === 1 (exakt), was bei Blowouts nie
      // abfeuerte. Jetzt lead >= 1: sobald der Spieler führt, ist die
      // Ausgleichspush möglich — narrativ passt's auch bei -3/-4.
      condition: (r, lead, m) => r >= 5 && lead >= 1,
      stats: { offense: 6, defense: -8, tempo: 3 },
      duration: 2,
      fallback: '{opp} send the keeper forward — all-or-nothing chase.'
    },
    {
      id: 'timeWasting',
      name: 'TIME WASTING',
      condition: (r, lead, m) => r >= 5 && lead < 0,
      stats: { tempo: -4 },
      duration: 2,
      fallback: '{opp} slow the game to a crawl — every set-piece takes forever.'
    },
    {
      id: 'desperateRally',
      name: 'DESPERATE RALLY',
      // v53 — Blowout-Antwort: wenn der Gegner in der 2. Hälfte hoffnungslos
      // hinten liegt, fliegt trotzdem noch mal was. Narrativ: die Fans
      // brüllen, die Spieler kippen alle nach vorne, die Ordnung zerfällt.
      // Nicht als Komeback-Tool gedacht (hohe Offense bei schlechter Defense),
      // sondern um spät im Match noch Druck zu machen.
      condition: (r, lead, m) => r >= 5 && lead >= 2,
      stats: { offense: 8, defense: -6, composure: -2 },
      duration: 2,
      fallback: '{opp} go full chaos — everybody forward, nothing to lose.'
    },
    // ── v52.8 NEW CARDS — fill the early/mid-game window ─────────────
    {
      id: 'pressOverload',
      name: 'PRESS OVERLOAD',
      // Early-game (R1-3) opp tactic: high press chokes our build-up.
      // Hits OFF + TMP — we struggle to play out under pressure.
      condition: (r, lead, m) => r >= 1 && r <= 3 && Math.abs(lead) <= 1,
      stats: { offense: -5, tempo: -4 },
      duration: 2,
      fallback: '{opp} swarm our half from the kickoff — no time on the ball.'
    },
    {
      id: 'setPiece',
      name: 'SET-PIECE THREAT',
      // Mid-game (R2-5) standalone: opp earns a dangerous dead-ball
      // moment. Single-round defense malus — if we don't clear the
      // first ball it bites. Fires regardless of score (set-pieces
      // happen).
      condition: (r, lead, m) => r >= 2 && r <= 5,
      stats: { defense: -6 },
      duration: 1,
      fallback: '{opp} earn a dangerous set-piece — wall up, hold your nerve.'
    },
    {
      id: 'chainCounter',
      name: 'CHAIN COUNTER',
      // Mid-game (R2-4) opp counter-attack window. Fires when our
      // build-up rate has been poor (more turnovers feed their break).
      // Hits DEF + CMP — the counter is fast and our shape is broken.
      condition: (r, lead, m) => {
        if (r < 2 || r > 4) return false;
        const s = m.stats || {};
        const builds = s.myBuildups || 0;
        const ok = s.myBuildupsSuccess || 0;
        // Opp counters when WE have been losing the ball (build success rate < 50%)
        return builds >= 2 && (ok / builds) < 0.5;
      },
      stats: { defense: -5, composure: -3 },
      duration: 1,
      fallback: '{opp} read the turnover, three passes and they are at our box.'
    }
  ];

  // ─── Tactic handler registries (data-driven dispatch) ───────────────
  //
  // Each phase (kickoff / halftime / final) gets a registry keyed by
  // tactic.id. Handlers share the signature:
  //
  //   (match, layer, ctx) => void
  //
  // where ctx = { phase, squad, onEvent, deficit, lead, isLeading }.
  // Contract:
  //   * Handler can mutate layer.stats, layer.range, layer.special.
  //   * Handler can set side-effect flags on `match` (e.g.
  //     match.aggressiveRoundsLeft, match._formPenaltiesDisabled).
  //   * Handler can push additional entries onto match.buffLayers for
  //     multi-layer tactics (e.g. slow_burn, wet_start, quick_strike).
  //   * ctx.squad is the live squad array (same reference as match.squad,
  //     see the contract comment in startMatch). Handlers that boost a
  //     specific role must look it up via ctx.squad.find(p => p.role ===
  //     'ST') — this is what role_switch, wingman, wing_overload need.
  //   * Handler is ONLY called when the phase matches — so halftime-
  //     specific logic (checking match.matchMomentum at halftime) is
  //     safe inside HALFTIME_HANDLERS.
  //   * All pre-conditions are expected to have been filtered by
  //     pickThemedTactics / the decision UI before dispatch. Handlers
  //     don't re-validate (would create contradictory behaviour).
  //
  // Migration status:
  //   * KICKOFF_HANDLERS  — implemented below.
  //   * HALFTIME_HANDLERS — implemented below.
  //   * FINAL_HANDLERS    — implemented below.
  //   (audit-tactics.js verifies handler↔config coverage on every run.)
  //
  // Why not put these in config-data.js?
  //   Because config-data.js is JSON-esque and gets decorated with i18n
  //   strings. Mixing function values into it would either fight the
  //   decoration pass or hide the engine logic from anyone reading the
  //   config. Keeping handlers in engine.js — next to the rest of
  //   match-loop logic they depend on (momentum, _roundBuffs, etc) —
  //   is the right separation-of-concerns: config describes WHAT the
  //   player picks, engine describes WHAT IT DOES.
  const KICKOFF_HANDLERS = {
    aggressive(match, layer, ctx) {
      layer.stats = { offense: 18, defense: -8 };
      match.aggressiveRoundsLeft = 3;
    },
    defensive(match, layer, ctx) {
      layer.stats = { defense: 18, offense: -8 };
    },
    balanced(match, layer, ctx) {
      layer.stats = { offense: 5, defense: 5, tempo: 5, vision: 5, composure: 5 };
      match.guaranteedFirstBuildup = true;
      match.momentumCounter = 0;
    },
    tempo(match, layer, ctx) {
      layer.stats = { tempo: 22, composure: -6 };
      match.aggressiveRoundsLeft = 3;
    },
    pressing(match, layer, ctx) {
      layer.stats = { defense: 14, tempo: 10 };
      match.pressingRoundsLeft = 3;
    },
    possession(match, layer, ctx) {
      layer.stats = { vision: 18, composure: 10 };
      match.possessionActive = true;
    },
    counter(match, layer, ctx) {
      layer.stats = { defense: 22, tempo: 10, offense: -6 };
      match.autoCounterRoundsLeft = 3;
    },
    flank_play(match, layer, ctx) {
      layer.stats = { tempo: 14, offense: 14 };
      match.flankRoundsLeft = 3;
    },
    // Structured defensive between pressing (active) and lockdown (extreme).
    zone_defense(match, layer, ctx) {
      layer.stats = { defense: 12, composure: 12, tempo: -5 };
    },
    // Explosive R1 burst, then milder R2-3 all-rounder. Custom layered
    // approach: R1-only +25 offense on top of the base +5/5/5/5/5 R1-3.
    quick_strike(match, layer, ctx) {
      layer.stats = { offense: 5, defense: 5, tempo: 5, vision: 5, composure: 5 };
      match.buffLayers.push({
        source: 'quick_strike_burst',
        range: [1, 1],
        stats: { offense: 25 },
        special: null
      });
    },
    // +10 all stats R1-3 AND neutralizes negative form for this match.
    // The flag is read by stats.js:computePlayerStats.
    disciplined(match, layer, ctx) {
      layer.stats = { offense: 10, defense: 10, tempo: 10, vision: 10, composure: 10 };
      match._formPenaltiesDisabled = true;
    },
    // Cerebral open — no tempo component, rewards reading the opponent.
    read_the_room(match, layer, ctx) {
      layer.stats = { vision: 15, composure: 10, defense: 8 };
    },
    // ── v52.2 retroactive handlers — tactics defined in config-data.js
    // but lacking engine implementation before v52.2. Values mirror
    // intel.js:TACTIC_STAT_DELTAS which was the de-facto spec the
    // intel panel had been advertising.

    // Config desc: -4 attack R1-2, then +22 attack R3+. Base layer
    // carries the negative window; a separate R3-only layer fires the
    // payoff. Punishing if the match is decided before R3.
    slow_burn(match, layer, ctx) {
      layer.stats = { offense: -4 };
      layer.range = [1, 2];
      match.buffLayers.push({
        source: 'slow_burn_payoff',
        range: [3, 3],
        stats: { offense: 22 },
        special: null
      });
    },
    // Config desc: +24 attack R1-3, accuracy unreliable. The "unreliable"
    // surfaces as a -6 composure penalty — the shot resolver pulls
    // composure for accuracy rolls, so no new flag needed.
    shot_flood(match, layer, ctx) {
      layer.stats = { offense: 24, composure: -6 };
    },
    // Config desc: +28 defense R1-3, -12 attack, -8 tempo.
    lockdown(match, layer, ctx) {
      layer.stats = { defense: 28, offense: -12, tempo: -8 };
    },
    // Config desc: +14 vision, +10 composure, enemy -6 composure.
    // Direct _roundBuffs covers R1; the decay block at round-start
    // re-applies the debuff for R2 and R3. Counter = 2 (R1 direct +
    // 2 re-applies = 3 rounds total).
    mindgames(match, layer, ctx) {
      layer.stats = { vision: 14, composure: 10 };
      match.opp._roundBuffs = match.opp._roundBuffs || {};
      match.opp._roundBuffs.composure = (match.opp._roundBuffs.composure || 0) - 6;
      match._mindgamesRoundsLeft = 2;
    },
    // Config desc: only if opp power +60: +14 all stats R1-6.
    // pickThemedTactics already gates availability; by the time we're
    // here the condition was met. Range is [1,6] — a whole-match
    // commitment.
    underdog(match, layer, ctx) {
      layer.stats = { offense: 14, defense: 14, tempo: 14, vision: 14, composure: 14 };
      layer.range = [1, 6];
    },
    // Config desc: only if you lead in power: +10 vision, +6 tempo,
    // momentum built. The momentum seed puts the player at +20 from
    // kickoff — translates "strut" into a real mechanical advantage.
    favorite(match, layer, ctx) {
      layer.stats = { vision: 10, tempo: 6 };
      if (typeof match.matchMomentum === 'number' && match.matchMomentum < 20) {
        match.matchMomentum = 20;
      }
    },
    // Config desc: R1-2 pure defense, R3 explodes +24 attack.
    // Two layers: defensive base R1-2, single-round R3 offense burst.
    // Mirrors slow_burn inverted (defense first, offense later).
    wet_start(match, layer, ctx) {
      layer.stats = { defense: 18 };
      layer.range = [1, 2];
      match.buffLayers.push({
        source: 'wet_start_strike',
        range: [3, 3],
        stats: { offense: 24 },
        special: null
      });
    },
    // Config desc: random +20 to one stat, -10 to two others each round.
    // Per-round re-rolls are handled by the round-tick that reads
    // _chaosRerollActive / _chaosPick. The base layer carries a small
    // positive so the tactic isn't "nothing" in the worst dice-roll.
    chaos(match, layer, ctx) {
      const keys = ['offense', 'defense', 'tempo', 'vision', 'composure'];
      const shuffled = keys.slice().sort(() => Math.random() - 0.5);
      const boost = shuffled[0];
      const drain1 = shuffled[1];
      const drain2 = shuffled[2];
      layer.stats = { [boost]: 20, [drain1]: -10, [drain2]: -10 };
      match._chaosRerollActive = true;
      match._chaosPick = { boost, drain1, drain2 };
    }
  };

  // Halftime tactic registry. Same (match, layer, ctx) signature.
  //
  // A handler may return `true` to signal "skip the remaining applyTactic
  // post-processing" (layer push, zero-effect detection, fit/misfit scaling,
  // decision-focus marking). This matches the behaviour of the legacy
  // `shift` tactic, whose effect is purely a direct player stat boost —
  // no team layer, no warning intended. The short-circuit is explicit
  // now instead of a mid-function `return` that was easy to miss.
  const HALFTIME_HANDLERS = {
    // Attacking comeback: offence scales with goal deficit at halftime,
    // defence pays 10. Aggressive-rounds flag reuses the kickoff machinery.
    push(match, layer, ctx) {
      const offBoost = 20 + ctx.deficit * 8;
      layer.stats = { offense: offBoost, defense: -10 };
      match.aggressiveRoundsLeft = 3;
    },
    // Game-management: defence scales with lead, pressing on if ahead.
    stabilize(match, layer, ctx) {
      const defBoost = 18 + ctx.lead * 6;
      layer.stats = { defense: defBoost, composure: 10 };
      if (ctx.isLeading) match.pressingRoundsLeft = Math.max(match.pressingRoundsLeft, 3);
    },
    // Hot-hand boost: find the best-performing starter (form-weighted by
    // focus stat), pump their focus stat by 18. No team layer — the
    // return:true keeps zero-effect warning from firing despite the
    // empty layer.stats.
    shift(match, layer, ctx) {
      const subject = (match.squad || [])
        .slice()
        .sort((a, b) => {
          const aFocus = DATA.roles.find(r => r.id === a.role)?.focusStat || 'offense';
          const bFocus = DATA.roles.find(r => r.id === b.role)?.focusStat || 'offense';
          return ((b.form || 0) * 10 + (b.stats?.[bFocus] || 0)) - ((a.form || 0) * 10 + (a.stats?.[aFocus] || 0));
        })[0] || pick(match.squad);
      const focus = DATA.roles.find(r => r.id === subject.role)?.focusStat || 'offense';
      subject.stats[focus] = clamp(subject.stats[focus] + 18, 20, 99);
      match._shiftSubject = subject;
      return true;   // skip layer push and zero-effect warning
    },
    // Inverse of shift: worst-form player eats -5 across the board,
    // team gets +12 offence. Picks by lowest (form * 10 + focus stat);
    // stable ordering means ties resolve by array order.
    shake_up(match, layer, ctx) {
      const victim = (match.squad || [])
        .slice()
        .sort((a, b) => {
          const aFocus = DATA.roles.find(r => r.id === a.role)?.focusStat || 'offense';
          const bFocus = DATA.roles.find(r => r.id === b.role)?.focusStat || 'offense';
          return ((a.form || 0) * 10 + (a.stats?.[aFocus] || 0)) - ((b.form || 0) * 10 + (b.stats?.[bFocus] || 0));
        })[0] || pick(match.squad);
      if (victim?.stats) {
        for (const k of ['offense', 'defense', 'tempo', 'vision', 'composure']) {
          victim.stats[k] = Math.max(20, (victim.stats[k] || 50) - 5);
        }
        match._shakeUpVictim = victim;
      }
      layer.stats = { offense: 12 };
    },
    // Rally: special-effect tactic. Attempts to score immediately at
    // halftime's reaction step; the layer.special string is the flag
    // the engine reads. No stat layer.
    rally(match, layer, ctx) {
      layer.special = 'rally';
      match.rallyReactionPending = false;
      match._rallyActive = true;
    },
    // All-round modest bump.
    reset(match, layer, ctx) {
      layer.stats = { offense: 7, defense: 7, tempo: 7, vision: 7, composure: 7 };
    },
    counter_h(match, layer, ctx) {
      layer.stats = { tempo: 24, defense: 14 };
      match.autoCounterRoundsLeft = 3;
    },
    high_press(match, layer, ctx) {
      layer.stats = { defense: 22, composure: -6 };
      match.pressingRoundsLeft = 3;
    },
    vision_play(match, layer, ctx) {
      layer.stats = { vision: 22, offense: 10 };
      match.possessionActive = true;
    },
    // Amplifies the CURRENT biggest team buff by +40%. Reads teamBuffs
    // at pick-time; rewards tactical momentum over boilerplate picks.
    //
    // v0.57 — Bug fix: only amplifies POSITIVE buffs now. Pre-fix used
    // Math.abs() to find the "largest" entry, so a tempo debuff of −7
    // (e.g. from an opp Slow Tempo trait) became "biggest" and got
    // amplified to −10 ("Double Down made TMP −3 worse"). The desc says
    // "rewards momentum", which the player rightly reads as "your good
    // form pays off" — amplifying a debuff is the opposite. New rule:
    // pick the largest POSITIVE buff. If none ≥ 5, fall back to the
    // modest all-round bump.
    double_down(match, layer, ctx) {
      const buffs = match.teamBuffs || {};
      const keys = ['offense', 'defense', 'tempo', 'vision', 'composure'];
      let topKey = null, topVal = 0;
      for (const k of keys) {
        const v = buffs[k] || 0;
        if (v > topVal) { topVal = v; topKey = k; }
      }
      if (topKey && topVal >= 5) {
        layer.stats = { [topKey]: Math.round(topVal * 0.4) };
      } else {
        // Nothing positive to amplify — fall back to a modest all-round bump.
        layer.stats = { offense: 6, defense: 6, composure: 6 };
      }
    },
    // +8 defence for you, -12 tempo on opp via _roundBuffs. Debuff lasts
    // R4-5: direct set covers R4, decay re-applies for R5 (counter = 1).
    tactical_foul(match, layer, ctx) {
      layer.stats = { defense: 8 };
      match.opp._roundBuffs = match.opp._roundBuffs || {};
      match.opp._roundBuffs.tempo = (match.opp._roundBuffs.tempo || 0) - 12;
      match._tacticalFoulRoundsLeft = 1;
    },
    // LF +20 off +20 tempo personal (stacks into squad stats); team
    // pays -6 defence. Personal boost applied directly — doesn't decay
    // past R6.
    wing_overload(match, layer, ctx) {
      const lf = (match.squad || []).find(p => p.role === 'LF');
      if (lf?.stats) {
        lf.stats.offense = clamp((lf.stats.offense || 50) + 20, 20, 99);
        lf.stats.tempo   = clamp((lf.stats.tempo   || 50) + 20, 20, 99);
        match._wingOverloadSubject = lf;
      }
      layer.stats = { defense: -6 };
    },
    // Conditional (drawing/leading only) enforced by pickThemedTactics;
    // here we just lay the stat profile.
    shell_defense(match, layer, ctx) {
      layer.stats = { defense: 24, composure: 14, offense: -10 };
    },
    // Conditional (leading only) — shouldn't be offered when behind.
    lock_bus(match, layer, ctx) {
      layer.stats = { defense: 30, offense: -20 };
    },
    // Conditional (trailing 2+): big attack push + defensive sacrifice +
    // keeper condition drain ("keeper at risk"). The condition drain on
    // TW is the visible sacrifice — no dedicated "keeper risk" flag path.
    desperate(match, layer, ctx) {
      layer.stats = { offense: 32, defense: -20 };
      const tw = (match.squad || []).find(p => p.role === 'TW');
      if (tw && typeof tw.condition === 'number') {
        tw.condition = Math.max(0, tw.condition - 6);
      }
    },
    // Losing-at-half motivator: team form +1 next match, +14 offence R4-6.
    coach_fire(match, layer, ctx) {
      layer.stats = { offense: 14 };
      match._coachFireNextMatchForm = true;
    },
    // LF/ST role-swap approximation. Team-wide +10 tempo, +10 off, -8 vis;
    // LF gains offence, ST gains tempo. The role FIELDS aren't swapped
    // (would break downstream role lookups) — stats reshuffle instead.
    role_switch(match, layer, ctx) {
      layer.stats = { tempo: 10, offense: 10, vision: -8 };
      const lf = (match.squad || []).find(p => p.role === 'LF');
      const st = (match.squad || []).find(p => p.role === 'ST');
      if (lf?.stats) lf.stats.offense = clamp((lf.stats.offense || 50) + 8, 20, 99);
      if (st?.stats) st.stats.tempo   = clamp((st.stats.tempo   || 50) + 8, 20, 99);
    },
    // +20 defence, opp -8 attack R4-6. Direct set covers R4, decay re-
    // applies R5-6 (counter = 2).
    cold_read(match, layer, ctx) {
      layer.stats = { defense: 20 };
      match.opp._roundBuffs = match.opp._roundBuffs || {};
      match.opp._roundBuffs.offense = (match.opp._roundBuffs.offense || 0) - 8;
      match._coldReadRoundsLeft = 2;
    },
    // LF +25 tempo +15 offence personal. Team -4 composure. Personal
    // boost applied directly (mirrors wing_overload) so it persists.
    wingman(match, layer, ctx) {
      const lf = (match.squad || []).find(p => p.role === 'LF');
      if (lf?.stats) {
        lf.stats.tempo   = clamp((lf.stats.tempo   || 50) + 25, 20, 99);
        lf.stats.offense = clamp((lf.stats.offense || 50) + 15, 20, 99);
        match._wingmanSubject = lf;
      }
      layer.stats = { composure: -4 };
    },
    // Wipes negative form on every starter and nulls form penalties for
    // the rest of the match. No team layer — effect is the form reset.
    mind_reset(match, layer, ctx) {
      for (const p of (match.squad || [])) {
        if (p.form < 0) p.form = 0;
      }
      match._formPenaltiesDisabled = true;
    }
  };

  // Final-phase tactic registry. Same (match, layer, ctx) contract as
  // KICKOFF_HANDLERS / HALFTIME_HANDLERS. Two handlers use the return-
  // true short-circuit:
  //   * hero_ball — pure personal boost, no team layer intended.
  //   * sacrifice — manually pushes the layer and recomputes team buffs
  //     to preserve exact legacy ordering of side-effects.
  //
  // Tactics with a .condition() function in config-data.js (all_in,
  // park_bus, kamikaze, clockwatch, poker) don't have entries here —
  // the dispatch wrapper handles them by reading layer.stats directly
  // from tactic.condition(match). That wrapper and the per-id handler
  // dispatch are independent: a tactic can have both (none currently do).
  const FINAL_HANDLERS = {
    // Group A: simple R6-only stat layers.
    keep_cool(match, layer, ctx) {
      layer.stats = { composure: 20, vision: 12 };
    },
    long_ball(match, layer, ctx) {
      layer.stats = { offense: 28, vision: -10 };
    },
    midfield(match, layer, ctx) {
      layer.stats = { vision: 20, tempo: 16, composure: 14 };
    },
    sneaky(match, layer, ctx) {
      layer.stats = { defense: 28, tempo: 18, offense: -14 };
    },
    final_press(match, layer, ctx) {
      layer.stats = { tempo: 24, defense: 18, offense: -10 };
    },
    // R6-only defense bonanza + auto-counter. Range is implicit in phase.
    rope_a_dope(match, layer, ctx) {
      layer.stats = { defense: 35 };
      match.autoCounterRoundsLeft = Math.max(match.autoCounterRoundsLeft || 0, 3);
    },
    // Best-form player gains +30 focus stat, permanent for the match.
    // No team layer — return true to skip layer push and zero-effect check.
    hero_ball(match, layer, ctx) {
      const heroSquad = match.squad || ctx.squad || [];
      const hero = heroSquad.slice().sort((a, b) => (b.form || 0) - (a.form || 0))[0] || pick(heroSquad);
      const focus = DATA.roles.find(r => r.id === hero.role)?.focusStat || 'offense';
      hero.stats[focus] = clamp(hero.stats[focus] + 30, 20, 99);
      match._hero = hero;
      return true;
    },
    // Best-form player eats a -15 focus-stat debuff; team gets +35 offence.
    // Legacy behaviour: push layer manually and recompute team buffs, then
    // return early. Preserving that ordering for exact parity.
    sacrifice(match, layer, ctx) {
      const heroSquad = match.squad || ctx.squad || [];
      const victim = heroSquad.slice().sort((a, b) => (b.form || 0) - (a.form || 0))[0] || pick(heroSquad);
      const focus = DATA.roles.find(r => r.id === victim.role)?.focusStat || 'offense';
      victim.stats[focus] = Math.max(20, victim.stats[focus] - 15);
      match._sacrificeVictim = victim;
      layer.stats = { offense: 35 };
      match.buffLayers.push(layer);
      recomputeTeamBuffs(match);
      return true;
    },
    // True 50/50. Outcome is logged so the player sees which way it broke.
    gamble(match, layer, ctx) {
      if (rand() < 0.5) {
        layer.stats = { offense: 35 };
        match._gambleOutcome = 'win';
        match._triggerLogBuffer = match._triggerLogBuffer || [];
        match._triggerLogBuffer.push(window.I18N.t('ui.log.tacticGambleWin'));
      } else {
        layer.stats = { offense: -15, defense: -15, tempo: -15, vision: -15, composure: -15 };
        match._gambleOutcome = 'loss';
        match._triggerLogBuffer = match._triggerLogBuffer || [];
        match._triggerLogBuffer.push(window.I18N.t('ui.log.tacticGambleLoss'));
      }
    },
    // ST gets +40 off +20 tempo direct; team pays -6 offence (forced-through
    // play funnelled via one player). Direct mutation persists past R6.
    lone_wolf(match, layer, ctx) {
      const st = (match.squad || ctx.squad || []).find(p => p.role === 'ST');
      if (st?.stats) {
        st.stats.offense = clamp((st.stats.offense || 50) + 40, 20, 99);
        st.stats.tempo   = clamp((st.stats.tempo   || 50) + 20, 20, 99);
        match._loneWolfSubject = st;
      }
      layer.stats = { offense: -6 };
    },
    // TW and VT both +40 defense; team -20 offence.
    fortress(match, layer, ctx) {
      const tw = (match.squad || ctx.squad || []).find(p => p.role === 'TW');
      const vt = (match.squad || ctx.squad || []).find(p => p.role === 'VT');
      if (tw?.stats) tw.stats.defense = clamp((tw.stats.defense || 50) + 40, 20, 99);
      if (vt?.stats) vt.stats.defense = clamp((vt.stats.defense || 50) + 40, 20, 99);
      match._fortressApplied = true;
      layer.stats = { offense: -20 };
    },
    // PM personal +30 vision +20 composure; team +12 offence.
    masterclass(match, layer, ctx) {
      const pm = (match.squad || ctx.squad || []).find(p => p.role === 'PM');
      if (pm?.stats) {
        pm.stats.vision    = clamp((pm.stats.vision    || 50) + 30, 20, 99);
        pm.stats.composure = clamp((pm.stats.composure || 50) + 20, 20, 99);
        match._masterclassSubject = pm;
      }
      layer.stats = { offense: 12 };
    },
    // +25% attackBonus gated to successful buildups (consumed by shot step).
    // No layer.stats — effect is gated, not team-wide.
    set_piece(match, layer, ctx) {
      match._setPieceBonus = 0.25;
    },
    // Clean all-round late-game pressure.
    siege_mode(match, layer, ctx) {
      layer.stats = { offense: 20, tempo: 10, vision: 10 };
    },
    // +18 def; after any save or successful stop, next own attack gets +30
    // offense. Flag + bonus slot set here, consumed in attack resolution.
    bus_and_bike(match, layer, ctx) {
      layer.stats = { defense: 18 };
      match._busAndBikeActive = true;
      match._busAndBikeNextAttackBonus = 0;
    },
    // Clutch nerves: +25 composure team-wide, opp shot accuracy -8% (1 round).
    face_pressure(match, layer, ctx) {
      layer.stats = { composure: 25 };
      match._oppShotMalus = Math.max(match._oppShotMalus || 0, 0.08);
      match._oppShotMalusRounds = Math.max(match._oppShotMalusRounds || 0, 1);
    }
  };


  function applyTactic(match, tactic, phase, squad, onEvent) {
    if (!tactic) return;

    // v52.2: reset the tactic-feedback slot at the start of each
    // applyTactic call. Populated below when a condition-gated tactic
    // fails its condition (silent no-op previously) and when role
    // drains fire (silent condition loss previously). The caller
    // flushes this via flushTacticFeedback() after applyDecision()
    // returns so each decision gets one clean log-line per kind.
    match._tacticFeedback = { drains: null, missedCondition: false };

    // v0.52 — Personal-stat mutation diff. Ten tactics directly mutate
    // `player.stats.X` (fortress/lone_wolf/masterclass/hero_ball/
    // wing_overload/wingman/role_switch/shift/sacrifice/shake_up). The
    // post-applyDecision picker preview reads `match.teamBuffs` only,
    // so these mutations were invisible in the [OFF +x  DEF +y] line —
    // and worse, when a personal +40 hit a player already at the 99
    // cap (TW defense after evolutions, ST offense after upgrades),
    // the entire buff was silently swallowed. Now: snapshot stats
    // before handlers run, diff after, expose deltas as
    // `match._lastTacticPersonalMutations` for the logger to render.
    // Cleared each applyTactic call so the value reflects only the
    // current decision, not residue from the previous phase.
    const _personalSnapshot = (match.squad || squad || []).map(p => ({
      id:    p.id,
      role:  p.role,
      stats: { ...(p.stats || {}) }
    }));
    match._lastTacticPersonalMutations = null;

    // v52.2 — snapshot all side-effect flags the zero-effect detector
    // reads, so the detector can tell whether the CURRENT applyTactic
    // call set any of them (vs a previous tactic still having its
    // flag set). Without this snapshot, picking any tactic with a
    // personal-player effect (hero_ball, wing_overload, fortress, etc)
    // in one phase would mask zero-effect warnings for later-phase
    // tactics because the flag is still truthy at detector-read time.
    const _flagsBefore = {
      _hero:                        match._hero,
      _sacrificeVictim:             match._sacrificeVictim,
      _masterclassSubject:          match._masterclassSubject,
      _shakeUpVictim:               match._shakeUpVictim,
      _shiftSubject:                match._shiftSubject,
      _wingOverloadSubject:         match._wingOverloadSubject,
      _rallyActive:                 match._rallyActive,
      _setPieceBonus:               match._setPieceBonus,
      _busAndBikeActive:            match._busAndBikeActive,
      _fortressApplied:             match._fortressApplied,
      _oppShotMalus:                match._oppShotMalus,
      _wingmanSubject:              match._wingmanSubject,
      _chaosRerollActive:           match._chaosRerollActive,
      _mindgamesRoundsLeft:         match._mindgamesRoundsLeft,
      _coldReadRoundsLeft:          match._coldReadRoundsLeft,
      _coachFireNextMatchForm:      match._coachFireNextMatchForm,
      _formPenaltiesDisabled:       match._formPenaltiesDisabled
    };

    const RANGES = { kickoff: [1, 3], halftime: [4, 6], final: [6, 6] };
    const range = RANGES[phase] || [1, 6];
    const layer = { source: tactic.id + '@' + phase, range, stats: {}, special: null };

    const deficit = Math.max(0, match.scoreOpp - match.scoreMe);
    const lead    = Math.max(0, match.scoreMe  - match.scoreOpp);
    const isLeading = lead > 0;

    if (phase === 'kickoff') {
      // Dispatch via KICKOFF_HANDLERS registry (declared above applyTactic).
      // Every kickoff tactic has its own handler keyed by id. Migrating off
      // the old 146-line if-chain removes a class of bug where a tactic's
      // id gets referenced before its handler is defined (the chain order
      // didn't matter but made the code hard to read / search).
      const handler = KICKOFF_HANDLERS[tactic.id];
      if (handler) {
        const ctx = { phase, squad, onEvent, deficit, lead, isLeading };
        handler(match, layer, ctx);
      }
    }

    if (phase === 'halftime') {
      // Dispatch via HALFTIME_HANDLERS registry. Handlers share the
      // (match, layer, ctx) contract; a handler returning true
      // short-circuits the remaining applyTactic post-processing
      // (layer push, zero-effect check, fit/misfit scaling, focus
      // marking). `shift` is the only current user of the short-
      // circuit — its effect is a pure personal stat boost with no
      // intended team layer and no zero-effect warning.
      const handler = HALFTIME_HANDLERS[tactic.id];
      if (handler) {
        const ctx = { phase, squad, onEvent, deficit, lead, isLeading };
        if (handler(match, layer, ctx) === true) return;
      }
    }

    if (phase === 'final') {
      // Dispatch via FINAL_HANDLERS registry. Two independent paths:
      //   1. tactic.condition(match) — 5 tactics (all_in, park_bus,
      //      kamikaze, clockwatch, poker) compute their stats dynamically
      //      from the live score state. Defensive `|| {}` guards the
      //      null-return case (kamikaze/clockwatch/poker return null when
      //      their precondition doesn't hold).
      //   2. FINAL_HANDLERS[tactic.id] — per-id handler for the other 16
      //      final tactics. A handler returning true short-circuits the
      //      rest of applyTactic (used by hero_ball and sacrifice).
      // Both paths are independent: a tactic could theoretically have both
      // (none currently do, but the dispatch tolerates it).
      if (tactic.condition) {
        layer.stats = tactic.condition(match) || {};
      }
      const handler = FINAL_HANDLERS[tactic.id];
      if (handler) {
        const ctx = { phase, squad, onEvent, deficit, lead, isLeading };
        if (handler(match, layer, ctx) === true) return;
      }
    }

    if (phase === 'kickoff') {
      const fitDef = TACTIC_FIT[tactic.id];
      if (fitDef) {
        const currentSquad = match.squad || squad || [];
        const isFit = fitDef.fit(currentSquad, match.opp, match);
        const oppBreached = fitDef.opponentBreachFn ? fitDef.opponentBreachFn(match.opp) : false;

        if (isFit && !oppBreached) {
          match._tacticFit = true;
          match._tacticMisfit = null;
          match._fitTraitAmp = CONFIG.tacticFitTraitAmp ?? 1.25;
          for (const k of Object.keys(layer.stats)) {
            if (layer.stats[k] > 0) {
              layer.stats[k] = Math.round(layer.stats[k] * (1 + CONFIG.tacticFitBonus));
            }
          }
        } else {
          match._tacticFit = false;
          match._tacticMisfit = {
            effects: fitDef.misfitEffects || {},
            logKey: fitDef.misfitKey,
            oppBreached
          };
          match._fitTraitAmp = CONFIG.tacticMisfitTraitAmp ?? 0.80;
          for (const k of Object.keys(layer.stats)) {
            if (layer.stats[k] > 0) {
              layer.stats[k] = Math.round(layer.stats[k] * (1 - CONFIG.tacticMisfitPenalty));
            }
          }
        }
      }
    }

    match.buffLayers.push(layer);
    recomputeTeamBuffs(match);

    // Per-role condition cost (v52.1) — tactics that demand physical
    // work from specific roles drain their condition extra. Aggressive
    // pressing hammers the forwards' legs; possession drains the
    // playmaker's focus; defensive tactics tax the keeper & defender's
    // concentration. Tactics not in the map cost nothing extra (still
    // the baseline drain from generic match load).
    //
    // Balance note: drains are small on purpose (3-6 per tactic choice),
    // applied ONCE when the tactic is picked rather than ticking per
    // round. Over a full match with kickoff + halftime + final picks,
    // the worst case is ~15 condition drained on a single role — enough
    // to matter when you chain aggressive plays, not enough to gut the
    // whole tactic system in one match.
    const TACTIC_CONDITION_COST = {
      // Aggressive pressing taxes all forwards physically.
      aggressive:     { LF: 6, RF: 6, ST: 6 },
      pressing:       { LF: 4, RF: 4, PM: 4 },
      high_press:     { LF: 4, RF: 4, PM: 4 },
      // Tempo/quick-strike tactics punish the sprinting roles.
      tempo:          { LF: 5, RF: 5, ST: 5 },
      quick_strike:   { LF: 5, RF: 5, ST: 5 },
      // Wing-focused tactics: wingers do the actual running.
      flank_play:     { LF: 6, RF: 6 },
      wing_overload:  { LF: 6, RF: 6 },
      // Possession/vision tactics drain the playmaker mentally.
      possession:     { PM: 5 },
      vision_play:    { PM: 5 },
      // Counter tactics require wingers but less sustained sprints.
      counter:        { LF: 3, RF: 3 },
      counter_h:      { LF: 3, RF: 3 },
      // Defensive tactics: keeper & defender hold mental focus.
      defensive:      { VT: 3, TW: 3 },
      zone_defense:   { VT: 3, TW: 3 },
      // Tactical foul costs the defender making it.
      tactical_foul:  { VT: 3 }
      // balanced / read_the_room / disciplined / reset / rally /
      // double_down / shift / shake_up / push / stabilize:
      // no extra cost — they're either neutral or pay in other ways.
    };
    const drains = TACTIC_CONDITION_COST[tactic.id];
    if (drains && match.squad) {
      const drainSummary = [];
      for (const p of match.squad) {
        const d = drains[p.role];
        if (d && typeof p.condition === 'number') {
          p.condition = Math.max(0, p.condition - d);
          drainSummary.push({ role: p.role, name: p.name, amount: d, after: Math.round(p.condition) });
        }
      }
      if (drainSummary.length) {
        // Stash so the caller can flushTacticFeedback() after applyDecision
        // returns. Previously the drain was silent — the player's ST lost
        // 6 condition from picking Aggressive and there was no signal.
        match._tacticFeedback.drains = {
          tacticName: tactic.name,
          entries: drainSummary
        };
      }
    }

    // Zero-stats check: surface when a picked tactic produced no team-buff
    // stats AND didn't set a personal-player effect the engine recognises
    // (hero, sacrifice, masterclass subject, etc.). Covers:
    //   - condition-gated tactics whose condition was not met
    //     (e.g. lock_bus picked but match is tied, condition() returns 'miss')
    //   - latent "no handler defined" IDs that slip through the config
    //     (many v52.1 kickoff/halftime additions have no engine branch)
    // The feedback is descriptive, not mechanical — we don't retroactively
    // add stats, just surface the silent no-op so the player doesn't lose
    // a decision to a bug or a condition they couldn't anticipate.
    {
      const hasTeamStats = layer.stats && Object.keys(layer.stats)
        .some(k => Math.abs(layer.stats[k] || 0) > 0);
      // v52.2 — compare flag state against the pre-call snapshot, not
      // against "truthy". Only flags the CURRENT applyTactic call
      // actually changed count as evidence the tactic had an effect.
      // Without this, a hero_ball pick at halftime would mask a
      // condition-miss warning on the final-phase tactic because
      // _hero stays set for the rest of the match.
      const flagChanged = (key) => match[key] !== _flagsBefore[key];
      const hadPersonalEffect =
        flagChanged('_hero') || flagChanged('_sacrificeVictim') ||
        flagChanged('_masterclassSubject') || flagChanged('_shakeUpVictim') ||
        flagChanged('_shiftSubject') || flagChanged('_wingOverloadSubject') ||
        flagChanged('_rallyActive') || flagChanged('_setPieceBonus') ||
        flagChanged('_busAndBikeActive') || flagChanged('_fortressApplied') ||
        flagChanged('_oppShotMalus') || flagChanged('_wingmanSubject') ||
        flagChanged('_chaosRerollActive') || flagChanged('_mindgamesRoundsLeft') ||
        flagChanged('_coldReadRoundsLeft') || flagChanged('_coachFireNextMatchForm') ||
        flagChanged('_formPenaltiesDisabled');
      const hasSpecial = !!layer.special;
      if (!hasTeamStats && !hadPersonalEffect && !hasSpecial) {
        // Missed condition detection: if the tactic has a condition() that
        // currently returns 'miss'/null, flag that specifically so the
        // user gets "LOCK THE BUS — condition not met (need to be leading)"
        // instead of just "no effect".
        let conditionMissed = false;
        if (typeof tactic.condition === 'function') {
          const res = tactic.condition(match);
          conditionMissed = (res === 'miss' || res === null);
        }
        match._tacticFeedback.missedCondition = true;
        match._tacticFeedback.missedTactic = tactic.name || tactic.id;
        match._tacticFeedback.conditionGated = conditionMissed;
      }
    }

    // Decision-Focus: markiere die Rollen, die diese Taktik boostet.
    // Erfolgreiche Aktionen dieser Spieler in der Taktik-Range bekommen
    // Bonus-XP (siehe bumpPlayerStat). Das macht Entscheidungen spürbar
    // im Spieler-Kader.
    if (window.getTacticFocusRoles) {
      const focusRoles = window.getTacticFocusRoles(tactic.id, phase);
      if (focusRoles.length) {
        match._decisionFocus = match._decisionFocus || {};
        match._decisionFocus[phase] = {
          roles: focusRoles,
          range: range,
          tacticId: tactic.id,
          tacticName: tactic.name
        };
      }
    }

    // v0.52 — diff personal-stat snapshot against post-handler state
    // and stash deltas for the picker preview to render. Empty deltas
    // (no change at all, or all changes clamped away by the 99 cap)
    // are kept distinct from "tactic mutated stats" — when we detect
    // an intent that was fully clamped we mark _allClamped:true so
    // the UI can surface "(capped — no effect)" instead of staying
    // silent.
    {
      const liveSquad = match.squad || squad || [];
      const deltas = [];
      for (const before of _personalSnapshot) {
        const after = liveSquad.find(p => p.id === before.id);
        if (!after?.stats) continue;
        for (const k of Object.keys(before.stats)) {
          const d = (after.stats[k] || 0) - (before.stats[k] || 0);
          if (d !== 0) {
            deltas.push({ role: before.role, stat: k, delta: d });
          }
        }
      }
      if (deltas.length) {
        match._lastTacticPersonalMutations = deltas;
      }
    }
  }

  // v52.2: surface any silent side-effects that applyTactic stashed on
  // match._tacticFeedback. Call once per decision, immediately after
  // applyDecision() returns and before the tactic's headline log line,
  // so drain / condition-miss notices sit right next to the "You picked
  // X" line in the match log.
  //
  // Two kinds of feedback:
  //   1. drains — roles that lost condition to the tactic pick (e.g.
  //      Aggressive costs ST/LF/RF 6 condition each).
  //   2. missedCondition — the tactic produced no team stats AND no
  //      personal effect. Usually a conditional like Lock the Bus
  //      being picked when no longer leading; occasionally a tactic
  //      whose engine handler is missing (latent config gap).
  //
  // Both render as muted log-lines with the 'tactic-feedback' class so
  // they're visually quieter than the primary decision line.
  async function flushTacticFeedback(match, onEvent) {
    const fb = match?._tacticFeedback;
    if (!fb || !onEvent) return;
    const T = window.I18N;
    if (fb.drains && fb.drains.entries && fb.drains.entries.length) {
      const parts = fb.drains.entries.map(e =>
        `${e.role} ${e.name} −${e.amount}`
      ).join(' · ');
      const tplKey = 'ui.log.tacticDrain';
      const tpl = T?.t?.(tplKey);
      const msg = (!tpl || tpl === tplKey)
        ? `⚡ Tactic cost: ${parts}`
        : tpl.replace('{parts}', parts);
      await log(onEvent, 'tactic-feedback', msg);
    }
    if (fb.missedCondition) {
      const tplKey = fb.conditionGated
        ? 'ui.log.tacticConditionMiss'
        : 'ui.log.tacticNoEffect';
      const tpl = T?.t?.(tplKey);
      const missedName = fb.missedTactic || 'tactic';
      const msg = (!tpl || tpl === tplKey)
        ? (fb.conditionGated
            ? `⚠ ${missedName}: condition not met — no effect this phase.`
            : `⚠ ${missedName}: no effect applied.`)
        : tpl.replace('{name}', missedName);
      await log(onEvent, 'tactic-feedback', msg);
    }
    // Reset so a second decision within the same match doesn't inherit
    // stale feedback (applyTactic resets on entry anyway, but cleaning
    // here makes the contract explicit).
    match._tacticFeedback = null;
  }

  async function recordOwnGoal(match, squad, onEvent, scorer, ctx) {
    // v0.43 — Lattentreffer (beidseitig, 4%). Der Schuss würde ein Tor
    // werden, kracht aber statt dessen ans Aluminium. Priorität VOR
    // dem Bulwark-Check: ein Pfostenschuss ist semantisch ein Schützen-
    // Fehltreffer, kein Keeper/Abwehr-Save. match.stats.myPostHits
    // wird als separater Zähler geführt (nicht als myGoals-).
    if (rand() < 0.04) {
      match.stats.myPostHits = (match.stats.myPostHits || 0) + 1;
      try {
        const narrative = window.KL?.narrative?.composePostHitMine?.(match, squad, scorer);
        if (narrative) await log(onEvent, 'narrative', narrative);
      } catch (_) { /* narrative is nice-to-have */ }
      // Phasen-Shift: wie ein Save — der Angriff endet, Team geht in
      // Transition. Momentum bleibt neutral (kein Tor, aber kein Verlust).
      match.matchPhase = 'transition';
      await logPhaseShift(match, onEvent, 'transition', 'post_hit');
      return;
    }

    // v0.44 — Abseits (beidseitig, 3%). Das Tor fällt zwar, wird aber
    // wegen Abseits aberkannt. Semantisch Fehllauf des Schützen, kein
    // Keeper-Save; daher ebenfalls VOR dem Bulwark-Check. match.stats.
    // myOffsides als separater Zähler — keine Shots/Goals-Verschiebung.
    if (rand() < 0.03) {
      match.stats.myOffsides = (match.stats.myOffsides || 0) + 1;
      try {
        const narrative = window.KL?.narrative?.composeOffsideMine?.(match, scorer);
        if (narrative) await log(onEvent, 'narrative', narrative);
      } catch (_) { /* narrative is nice-to-have */ }
      match.matchPhase = 'transition';
      await logPhaseShift(match, onEvent, 'transition', 'offside');
      return;
    }

    // v0.44 — Elfmeter (beidseitig, 1.5%). Der Tor-Moment wird zum
    // Elfmeter-Moment. Inline-Ablauf: Intro → Outcome. Outcome kann
    // goal/save/miss sein (Formel in narrative.penaltyGoalProb). Bei
    // Tor: gleicher Score-Effekt wie ein normales Tor, aber mit
    // Elfmeter-Narrative-Framing statt Aufbau-Kette. Bei Nicht-Tor:
    // Transition-Phase, kein Score.
    if (rand() < 0.015) {
      const penShooter = pickOurPenaltyShooter(squad, scorer);
      const oppKeeper = pickOppKeeper(match.opp);
      match.stats.myPenalties = (match.stats.myPenalties || 0) + 1;

      try {
        const intro = window.KL?.narrative?.composePenaltyIntro?.(match, penShooter, true);
        if (intro) await log(onEvent, 'narrative', intro);
      } catch (_) { /* narrative is nice-to-have */ }

      const goalProb = (window.KL?.narrative?.penaltyGoalProb?.(penShooter, oppKeeper)) ?? 0.73;
      const outcome = (window.KL?.narrative?.resolvePenaltyOutcome?.(goalProb, rand)) || 'save';

      try {
        const outcomeMsg = window.KL?.narrative?.composePenaltyOutcome?.(match, penShooter, oppKeeper, outcome, true);
        if (outcomeMsg) await log(onEvent, 'narrative', outcomeMsg);
      } catch (_) { /* narrative is nice-to-have */ }

      if (outcome === 'goal') {
        match.scoreMe += 1;
        match.stats.myPenaltiesScored = (match.stats.myPenaltiesScored || 0) + 1;
        match.matchMomentum = Math.min(100, (match.matchMomentum || 0) + 30);
        match.matchPhase = 'buildup';
        penShooter.goals = (penShooter.goals || 0) + 1;
        bumpPlayerStat(penShooter, 'goals', 1, match);
        recordAction(match, penShooter, 'goal', false);
        bumpPlayerStat(oppKeeper, 'goalsConceded', 1);
        if (match.memory) {
          match.memory.consecutiveScored = (match.memory.consecutiveScored || 0) + 1;
          match.memory.consecutiveConceded = 0;
          match.memory.lastRoundScored = match.round;
          match.memory.roundGoalCountMe = (match.memory.roundGoalCountMe || 0) + 1;
        }
        await log(onEvent, 'goal-me', window.I18N.t('ui.log.ownGoal', {
          name: penShooter.name, suffix: ' (Elfer)', me: match.scoreMe, opp: match.scoreOpp
        }));
        await logPhaseShift(match, onEvent, 'buildup', 'penalty_goal');
      } else {
        match.matchPhase = 'transition';
        await logPhaseShift(match, onEvent, 'transition', 'penalty_miss');
      }
      return;
    }

    const bulwarkCtx = applyOppTraitEffect(match.opp, match, 'ownGoal', { goalCancelled: false });
    for (const msg of (bulwarkCtx.logMsgs || [])) await log(onEvent, 'trigger', msg);
    if (bulwarkCtx.goalCancelled) {
      match.stats.myShotsBulwarkSaved = (match.stats.myShotsBulwarkSaved || 0) + 1;
      match.matchPhase = 'transition';
      await logPhaseShift(match, onEvent, 'transition', 'bulwark');
      return;
    }

    let goalValue = 1;
    let suffix = '';
    if (match.tripleNextGoal) {
      goalValue = 3;
      match.tripleNextGoal = false;
      match.doubleNextGoal = false;
      suffix = ' (×3 GOD MODE!)';
    } else if (match.doubleNextGoal) {
      goalValue = 2;
      match.doubleNextGoal = false;
      suffix = ' (×2 COMBO!)';
    }
    match.scoreMe += goalValue;
    // Momentum shift — scoring a goal swings match momentum toward us.
    // Combo goals (doubleNextGoal) swing more aggressively since the
    // team is clearly dominant in that moment.
    match.matchMomentum = Math.min(100, (match.matchMomentum || 0) + (goalValue > 1 ? 45 : 30));
    // Phase: scoring ends the attack — next round is a kickoff /
    // rebuild moment. Goes to buildup so the player isn't expected
    // to immediately chain another attack.
    match.matchPhase = 'buildup';
    await logPhaseShift(match, onEvent, 'buildup', 'ownGoal');
    scorer.goals += 1;
    bumpPlayerStat(scorer, 'goals', 1, match);
    const oppKeeper = pickOppKeeper(match.opp);
    const oppVT = pickOppDefender(match.opp);
    recordAction(match, oppKeeper, 'concede', true);
    bumpPlayerStat(oppKeeper, 'goalsConceded', goalValue);
    bumpPlayerStat(oppVT, 'goalsConceded', goalValue);

    recordAction(match, scorer, 'goal', false);
    if (match.memory) {
      match.memory.consecutiveScored = (match.memory.consecutiveScored || 0) + 1;
      match.memory.consecutiveConceded = 0;
      match.memory.lastRoundScored = match.round;
      match.memory.roundGoalCountMe = (match.memory.roundGoalCountMe || 0) + 1;
    }

    // ── v52.7 — Opp Streak-Awareness wake-up ─────────────────────────────
    // When the player scores 2+ in a row, the opponent "wakes up": a
    // 2-round debuff layer hits the player team (-3 OFF, -2 TMP, -2 VIS),
    // narratively framed as "{opp} reorganizes the defense — they have
    // you on their radar". Fires ONCE per scoring streak (re-arms when
    // the opp scores and breaks our streak). Solves the "opp feels like
    // dead furniture" feeling by giving them a visible reactive moment.
    // The debuff is moderate so it doesn't cancel the player's lead but
    // makes the next 2 rounds noticeably tougher — they have to earn it.
    const streak = match.memory?.consecutiveScored || 0;
    if (streak >= 2 && !match._oppWakeUpFiredThisStreak) {
      match._oppWakeUpFiredThisStreak = true;
      match.buffLayers.push({
        source: 'opp_wake_up',
        range: [match.round + 1, match.round + 2],
        stats: { offense: -3, tempo: -2, vision: -2 },
        special: null
      });
      const oppName = match.opp?.name || 'They';
      const wakeMsg = window.I18N.t('ui.log.oppWakeUp', { opp: oppName });
      const fallback = `${oppName} reorganize the defense — they have you on their radar.`;
      const useMsg = (wakeMsg && wakeMsg !== 'ui.log.oppWakeUp') ? wakeMsg : fallback;
      await log(onEvent, 'decision', `${useMsg}`);
      if (window.recomputeTeamBuffs) window.recomputeTeamBuffs(match);
    }
    // ── /v52.7 ───────────────────────────────────────────────────────────

    if (ctx._synergyPair && ctx._synergyPair.a && ctx._synergyPair.b && !suffix) {
      const combo = pickLog('ui.log.synergyCombo', {
        a: ctx._synergyPair.a.name, b: ctx._synergyPair.b.name
      });
      await log(onEvent, 'goal-me', window.I18N.t('ui.log.ownGoalCombo', {
        name: scorer.name, combo, me: match.scoreMe, opp: match.scoreOpp
      }));
    } else {
      // v0.42 — Narrativ-Layer: Aufbau-Kette vor dem Tor-Log einstreuen.
      // Das Narrativ-Modul entscheidet selbst, ob genug Kontext da ist;
      // gibt null zurück wenn nicht — dann bleibt der Log unverändert.
      // Kommt NUR im "Solo-Tor"-Zweig, nicht im Synergy-Combo-Zweig —
      // da fliesst die Synergy bereits als Combo-Formulierung mit ein.
      try {
        const buildup = window.KL?.narrative?.composeGoalBuildup?.(match, squad, scorer);
        if (buildup) {
          await log(onEvent, 'narrative', buildup);
        }
      } catch (_) { /* narrative is nice-to-have, never block the goal */ }
      await log(onEvent, 'goal-me', window.I18N.t('ui.log.ownGoal', {
        name: scorer.name, suffix, me: match.scoreMe, opp: match.scoreOpp
      }));
    }

    dispatchTrigger('ownGoal', { ...ctx, scorer });
    await flushTriggerLog(match, onEvent);
  }

  async function attemptAttack(match, squad, onEvent, extra = {}) {
    const cap = CONFIG.playerAttackCapPerRound ?? 4;
    match._playerAttacksThisRound = (match._playerAttacksThisRound || 0) + 1;
    if (match._playerAttacksThisRound > cap) {
      const factor   = CONFIG.suppressedAttackBonusFactor ?? 0.4;
      const minBonus = CONFIG.suppressedAttackBonusMin ?? 0.03;
      const maxBonus = CONFIG.suppressedAttackBonusMax ?? 0.15;
      const raw      = Math.max(minBonus, (extra.bonusAttack || 0) * factor);
      const bonus    = Math.min(maxBonus, raw);
      match.nextBuildupBonus = (match.nextBuildupBonus || 0) + bonus;
      match._suppressedAttacksThisRound = (match._suppressedAttacksThisRound || 0) + 1;
      const key = 'ui.log.attackCapped';
      const txt = window.I18N?.t?.(key);
      const msg = (txt && txt !== key)
        ? txt
        : `⚠ Angriff gebündelt — nächste Chance +${Math.round(bonus * 100)}%`;
      await onEvent({ type: 'log', cls: 'trigger', msg });
      return;
    }

    const st = squad.find(p => p.role === 'ST');
    const lf = squad.find(p => p.role === 'LF');
    const pm = squad.find(p => p.role === 'PM');
    const vt = squad.find(p => p.role === 'VT');
    if (!st) return;

    const stStats = computePlayerStats(st, match);
    const lfStats = lf ? computePlayerStats(lf, match) : stStats;
    const pmStats = pm ? computePlayerStats(pm, match) : stStats;

    const teamOffense   = stStats.offense * 0.50 + lfStats.offense * 0.28 + pmStats.vision * 0.12 + pmStats.offense * 0.10;
    const teamTempoBase = lfStats.tempo   * 0.50 + stStats.tempo   * 0.30 + pmStats.tempo  * 0.20;
    // tempoBonus wird von whirlwind_rush als multiplikativer Bonus gesetzt
    // (+0.5 pro Halbzeiten-Feuerung, Beschreibung: "verdoppelt Tempo").
    // Stacking ist begrenzt, damit mehrfach getriggerte Buffs nicht durch
    // die Decke gehen.
    const teamTempo     = teamTempoBase * (1 + Math.min(1.0, match.teamBuffs?.tempoBonus || 0));
    const teamComposure = squad.reduce((s, p) => s + computePlayerStats(p, match).composure, 0) / squad.length;
    const teamVision    = pmStats.vision * 0.42 + stStats.vision * 0.18 + lfStats.vision * 0.18
      + (vt ? computePlayerStats(vt, match).vision : 50) * 0.12
      + (squad.find(p => p.role === 'TW') ? computePlayerStats(squad.find(p => p.role === 'TW'), match).vision : 50) * 0.10;

    const ctx = {
      match,
      attackBonus:      extra.bonusAttack || 0,
      ownBuildupSuccess: false,
      guaranteedBuildup: false,
      autoGoal:         false,
      scorer:           st,
      oppAvgDefense:    match.opp.avgDefense + (match.opp._roundBuffs?.defense || 0)
    };

    if (match.guaranteedFirstBuildup && match.stats.myBuildups === 0) {
      ctx.guaranteedBuildup = true;
      match.guaranteedFirstBuildup = false;
    }

    const synergyActive = match._lastBuildupByPM && (pm !== st);
    if (synergyActive && rand() < 0.55) {
      ctx.attackBonus += 0.04;
      ctx._synergyPair = { a: pm, b: st };
    }
    match._lastBuildupByPM = false;
    match._buildupSucceededThisAttack = false;  // reset per-attack — set later if buildup lands

    dispatchTrigger('ownAttack', ctx);
    await flushTriggerLog(match, onEvent);

    const oppPressCtx = applyOppTraitEffect(match.opp, match, 'ownBuildupChance', { malus: 0 });

    let misfitBuildupMalus = 0;
    const mf = match._tacticMisfit;
    if (mf) {
      if (mf.effects.buildupChanceMult) {
        misfitBuildupMalus = (1 - mf.effects.buildupChanceMult) * 0.30;
      }
      if (mf.effects.pressingCollapseRound && match.round > mf.effects.pressingCollapseRound) {
        misfitBuildupMalus += 0.12;
      }
    }

    const fatigueBuildupMalus = match._fatigue * 0.4;

    // v52.2 — opp-vision symmetric counter to player PM vision growth.
    // Previously the formula read (pmVision - 55) * scale with no
    // counterpart; PM vision rises with every level-up (hits ~85 by
    // M10) while the opp had no symmetric scaling at all. The player's
    // buildup success drifted upward independently of opp progress,
    // contributing to the snowball.
    //
    // New term: (oppTeamVision - 55) * scale * matchDifficulty, applied
    // as a subtraction. Uses the shared matchDifficulty() helper that
    // also gates opp offense and save-chance scaling, so the three axes
    // stay consistent. Opp team vision is read via oppStat which
    // accounts for tier multipliers and traits.
    const oppBuildupVisionMalus = Math.max(0,
      (oppStat(ctx.match, 'vision') - 55) * CONFIG.buildupVisionScale * matchDifficulty()
    );

    const buildupChance = clamp(
      0.27
      + (pmStats.vision - 55) * CONFIG.buildupVisionScale
      + (pmStats.composure - 55) * 0.003
      + (teamTempo - oppStat(ctx.match, 'tempo')) * 0.0015
      + (match.nextBuildupBonus || 0)
      + ctx.attackBonus * 0.5
      - (oppPressCtx.malus || 0)
      - misfitBuildupMalus
      - fatigueBuildupMalus
      - (match.teamBuffs?.buildupMalus || 0)
      - oppBuildupVisionMalus
      - (match._oppMoveBuildupMalus || 0),
      0.05, 0.92
    );
    match.nextBuildupBonus = 0;
    match.stats.myBuildups++;
    bumpPlayerStat(pm, 'buildups');

    const buildupOk = ctx.guaranteedBuildup || rand() < buildupChance;
    match._lastBuildupFailed = !buildupOk;

    const oppPM = pickOppPlaymaker(match.opp);
    const oppVT = pickOppDefender(match.opp);

    if (!buildupOk) {
      recordAction(match, pm, 'buildup_fail', false);
      if (oppPressCtx._presserActive && rand() < 0.60) {
        await log(onEvent, 'trigger', window.I18N.t('ui.log.oppTrait.presserDisrupt', {
          name: oppPM.name, team: match.opp.name
        }));
      }
      if (match.aggressiveRoundsLeft > 0 && rand() < 0.55) {
        await log(onEvent, 'decision', pickLog('ui.log.aggressiveError'));
      } else if (match.possessionActive && rand() < 0.40) {
        await log(onEvent, 'decision', pickLog('ui.log.possessionLost', { opp: oppPM.name }));
        match.counterPending = true;
      }
      await log(onEvent, '', `${pickLog('logs.ownBuildFail', {
        pm: pm?.name || 'PM', vt: vt?.name || 'Defense',
        oppVT: oppVT.name, oppPM: oppPM.name
      })}`);

      const counterCtx = applyOppTraitEffect(match.opp, match, 'counterAttack', {});
      if (counterCtx.triggered) {
        await log(onEvent, 'trigger', window.I18N.t('ui.log.oppBlitzCounter', {
          name: pickOppScorer(match.opp).name, team: match.opp.name
        }));
        await attemptOppAttack(match, squad, onEvent);
      }
      return;
    }

    match.stats.myBuildupsSuccess++;
    bumpPlayerStat(pm, 'buildupsOk', 1, match);
    match._lastBuildupByPM = true;
    match._buildupSucceededThisAttack = true;   // consumed + cleared by shot-bonus step for set_piece
    recordAction(match, pm, 'buildup_ok', false);
    dispatchTrigger('ownBuildupSuccess', ctx);
    await flushTriggerLog(match, onEvent);
    await log(onEvent, '', `${pickLog('logs.ownBuildSuccess', {
      pm: pm?.name || 'PM', lf: lf?.name || 'Runner', vt: vt?.name || 'Defender'
    })}`);

    if (ctx.autoGoal) {
      const autoScorer = ctx.scorer || st;
      match.stats.myShots++;
      match.stats.myShotsOnTarget++;
      bumpPlayerStat(autoScorer, 'shots');
      bumpPlayerStat(autoScorer, 'shotsOnTarget');
      await recordOwnGoal(match, squad, onEvent, autoScorer, ctx);
      return;
    }

    const behindDeficit = Math.max(0, match.scoreOpp - match.scoreMe);
    const isPressure = behindDeficit > 0 || match.round >= 5;
    const composureAdvantage = isPressure
      ? (teamComposure - oppStat(ctx.match, 'composure')) * 0.0015
      : 0;
    const visionAdvantage = (teamVision - oppStat(ctx.match, 'vision')) * 0.001;

    if ((match.teamBuffs?.offense || 0) < -5 && rand() < 0.45) {
      await log(onEvent, 'decision', pickLog('ui.log.defensiveLackOfPunch'));
    }
    const lead = Math.max(0, match.scoreMe - match.scoreOpp);
    if (lead >= 2 && match.round >= 4 && rand() < 0.40) {
      await log(onEvent, 'decision', pickLog('ui.log.leadComplacency'));
    }
    const deficit2 = Math.max(0, match.scoreOpp - match.scoreMe);
    if (deficit2 >= 2 && match.round >= 4 && rand() < 0.35) {
      await log(onEvent, 'decision', pickLog('ui.log.deficitNervousness'));
    }

    let scorer;
    if (extra._forceScorer === 'LF' && lf)        scorer = lf;
    else if (extra._forceScorer === 'ST')         scorer = st;
    else if (match._eventImmediateAttackForceScorer === 'LF' && lf) {
      scorer = lf;
      match._eventImmediateAttackForceScorer = null;
    } else if (match._eventImmediateAttackForceScorer === 'ST') {
      scorer = st;
      match._eventImmediateAttackForceScorer = null;
    } else if (lfStats.tempo > stStats.tempo + 10 && rand() < 0.35) {
      scorer = lf;
    } else {
      scorer = st;
    }
    ctx.scorer = scorer;

    if (match._nextAttackVisionMode) {
      match._nextAttackVisionMode = false;
      const visionBonus = ((pmStats.vision || 50) - 55) * 0.006;
      ctx.attackBonus += Math.max(-0.05, Math.min(0.18, visionBonus));
    }
    if (match._nextAttackPushThrough && match._nextAttackPushPlayer === scorer.id) {
      match._nextAttackPushThrough = false;
      match._nextAttackPushPlayer = null;
      ctx.attackBonus += 0.14;
    }
    // bus_and_bike: one-shot attack bonus after a save/stop. Consumed here.
    if (match._busAndBikeNextAttackBonus && match._busAndBikeNextAttackBonus > 0) {
      ctx.attackBonus += match._busAndBikeNextAttackBonus;
      match._busAndBikeNextAttackBonus = 0;
    }
    // set_piece: only lands when this attack came from a successful buildup
    // (match._buildupSucceededThisAttack is set in the buildup resolution).
    if (match._setPieceBonus && match._buildupSucceededThisAttack) {
      ctx.attackBonus += match._setPieceBonus;
    }

    if (match.memory) {
      if (scorer.role === 'LF') {
        if (match.memory.hotFlank === 'mine') match.memory.flankStreak = (match.memory.flankStreak || 0) + 1;
        else { match.memory.hotFlank = 'mine'; match.memory.flankStreak = 1; }
      } else {
        if (match.memory.hotFlank === 'mine' && match.memory.flankStreak > 0) {
          match.memory.flankStreak = Math.max(0, match.memory.flankStreak - 1);
        }
      }
    }

    await log(onEvent, '', `${pickLog('logs.chance', { scorer: scorer.name })}`);

    match.stats.myShots++;
    bumpPlayerStat(scorer, 'shots');

    const rawScoringChance =
      CONFIG.attackBase
      + (teamOffense - ctx.oppAvgDefense) * CONFIG.attackStatScale
      + (teamTempo > oppStat(ctx.match, 'tempo') ? CONFIG.tempoAdvantage : -CONFIG.tempoAdvantage * 0.5)
      + composureAdvantage
      + visionAdvantage
      + ctx.attackBonus;

    const overflowThreshold = CONFIG.chanceOverflowWarnThreshold ?? 1.25;
    if (rawScoringChance > overflowThreshold) {
      match._chanceOverflowCount = (match._chanceOverflowCount || 0) + 1;
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[kicklike balance] scoring chance overflow:',
          rawScoringChance.toFixed(2), 'round', match.round,
          'cap at', CONFIG.attackBase, '+', overflowThreshold);
      }
    }

    const baseScoringChance = clamp(rawScoringChance, 0.05, CONFIG.scoringChanceCap ?? 0.75);

    const oppKeeper = pickOppKeeper(match.opp);
    const oppPMStats = getOppPlayerStats(pickOppPlaymaker(match.opp), match);
    const oppVTStats = getOppPlayerStats(pickOppDefender(match.opp), match);
    const oppKeeperStats = getOppPlayerStats(oppKeeper, match);
    const shotOnTargetChance = clamp(baseScoringChance + 0.18, 0.12, 0.97);

    if (rand() >= shotOnTargetChance) {
      recordAction(match, scorer, 'miss', false);
      // Phase: missed chance = possession swing back to opp — we lose
      // the attack, go into a recovery phase where counter-cards shine.
      // Renamed from 'loss' in v52.1 because players read it as "match
      // lost" which is a totally different concept.
      match.matchPhase = 'recovery';
      // Flag for micro-event check next round — corner kick chance.
      match._justMissed = true;
      await log(onEvent, '', `${pickLog('logs.miss', { scorer: scorer.name })}`);
      await logPhaseShift(match, onEvent, 'recovery', 'miss');
      return;
    }

    match.stats.myShotsOnTarget++;
    bumpPlayerStat(scorer, 'shotsOnTarget');

    const oppComposure = (oppKeeperStats.composure || 50) * 0.55
      + (oppVTStats.composure || 50) * 0.20
      + (oppPMStats.composure || 50) * 0.25;
    const composureSaveBonus = (oppComposure - teamComposure) * 0.001;

    const oppVisionForDef = (oppVTStats.vision || 50) * 0.30
      + (oppKeeperStats.vision || 50) * 0.45
      + (oppPMStats.vision || 50) * 0.25;
    const visionSaveBonus = (oppVisionForDef - teamVision) * 0.002;

    const shotPressure = teamOffense * 0.70 + teamTempo * 0.15 + (scorer.role === 'ST' ? stStats.composure : lfStats.composure) * 0.15;
    const oppBlock = (oppKeeperStats.defense || oppStat(match, 'defense')) * 0.72
      + (oppVTStats.defense || oppStat(match, 'defense')) * 0.28;

    // v52.2 — match-difficulty scaling applied symmetrically to opp
    // defense. Previously only opp OFFENSE was match-scaled (see
    // attemptOppAttack), meaning late-match opps got scarier as
    // scorers but NOT as stoppers. Combined with compounding player
    // power (level-ups × evolutions × card upgrades × role affinity),
    // this produced the early-run snowball where R3+ matches became
    // 11:1 routs. Applying the shared matchDifficulty() curve here
    // makes opps scale as a two-way threat: they still save shots,
    // they still block buildups.
    const oppBlockScaled = oppBlock * matchDifficulty();

    const oppSaveCtx = applyOppTraitEffect(match.opp, match, 'savePenalty', { penalty: 0 });
    for (const msg of (oppSaveCtx.logMsgs || [])) await log(onEvent, 'trigger', msg);

    let oppSaveChance = 0.40
      + (oppBlockScaled - shotPressure) * CONFIG.defenseStatScale
      + composureSaveBonus
      + visionSaveBonus
      + (oppSaveCtx.penalty || 0)
      + (match._oppMoveSaveBonus || 0);
    if (match.round <= (match._oppKeeperRattledUntilRound || 0)) {
      oppSaveChance -= (match._oppKeeperRattledBonus || 0);
    }
    oppSaveChance = clamp(oppSaveChance, 0.08, 0.86);

    if (rand() < oppSaveChance) {
      recordAction(match, oppKeeper, 'save', true);
      bumpPlayerStat(oppKeeper, 'saves');
      match.stats.oppSaves = (match.stats.oppSaves || 0) + 1;
      await log(onEvent, 'opp-save', `${pickLog('logs.oppKeeperSave', {
        scorer: scorer.name, keeper: oppKeeper.name, team: match.opp.name
      })}`);
      return;
    }

    await recordOwnGoal(match, squad, onEvent, scorer, ctx);
  }

  async function attemptOppAttack(match, squad, onEvent) {
    const ctx = { match, oppAttackNegated: false, oppShotSaved: false, oppGoalCancelled: false };
    const opp = match.opp;
    const vt = squad.find(p => p.role === 'VT');
    const tw = squad.find(p => p.role === 'TW');

    if (match._oppAttackCancel) {
      match._oppAttackCancel = false;
      bumpPlayerStat(vt, 'defendedAttacks', 1, match);
      recordAction(match, vt, 'defended', false);
      dispatchTrigger('oppAttackFailed', { match });
      await flushTriggerLog(match, onEvent);
      return;
    }

    const oppST = pickOppScorer(opp);
    const oppPM = pickOppPlaymaker(opp);
    const oppVT = pickOppDefender(opp);
    ctx.oppShooter = oppST;

    dispatchTrigger('oppAttack', ctx);
    await flushTriggerLog(match, onEvent);

    if (ctx.oppAttackNegated) {
      if (match.pressingRoundsLeft > 0) match._htPressingBlocks = (match._htPressingBlocks || 0) + 1;
      if (match.autoCounterRoundsLeft > 0) {
        match._htCountersFired = (match._htCountersFired || 0) + 1;
        const lf = squad.find(p => p.role === 'LF');
        bumpPlayerStat(lf, 'counters', 1, match);
        await log(onEvent, 'trigger', window.I18N.t('ui.log.autoCounter'));
        await attemptAttack(match, squad, onEvent, { bonusAttack: 0.20 });
      }
      dispatchTrigger('oppAttackFailed', { match });
      await flushTriggerLog(match, onEvent);
      return;
    }

    const pressMalus   = match.pressingRoundsLeft > 0 ? 0.20 : 0;
    const eventOppMalus = match._oppBuildupPenalty || 0;

    // _fatigue (weiter unten in der Runden-Schleife) behandelt Aggressiv/Pressing-
    // Ermüdung auf der SPIELER-Seite. Das frühere _aggressiveFatigue wirkte
    // versehentlich auf den GEGNER-Buildup — entfernt.
    const oppBuildup = clamp(
      0.35 + (oppStat(match, 'vision') - 55) * 0.005 - pressMalus - eventOppMalus,
      0.10, 0.85
    );
    match.stats.oppBuildups++;

    if (rand() > oppBuildup) {
      recordAction(match, oppPM, 'buildup_fail', true);
      await log(onEvent, '', `${pickLog('logs.oppBuildFail', {
        opp: oppPM.name, team: opp.name, vt: vt?.name || 'Defense'
      })}`);
      bumpPlayerStat(vt, 'defendedAttacks', 1, match);
      recordAction(match, vt, 'defended', false);
      if (match.pressingRoundsLeft > 0) match._htPressingBlocks = (match._htPressingBlocks || 0) + 1;
      if (match.autoCounterRoundsLeft > 0) {
        match._htCountersFired = (match._htCountersFired || 0) + 1;
        const lf = squad.find(p => p.role === 'LF');
        bumpPlayerStat(lf, 'counters', 1, match);
        await log(onEvent, 'trigger', window.I18N.t('ui.log.autoCounter'));
        await attemptAttack(match, squad, onEvent, { bonusAttack: 0.20 });
      }
      dispatchTrigger('oppAttackFailed', { match });
      await flushTriggerLog(match, onEvent);
      return;
    }
    match.stats.oppBuildupsSuccess++;
    recordAction(match, oppPM, 'buildup_ok', true);

    const vtStats = vt ? computePlayerStats(vt, match) : { defense: 55 };
    const twStats = tw ? computePlayerStats(tw, match) : { defense: 55 };
    const rb = opp._roundBuffs || {};

    let pressBreakBonus = 0;
    if (match.pressingRoundsLeft > 0) {
      pressBreakBonus = 0.12 + rand() * 0.08;
      await log(onEvent, 'decision', pickLog('ui.log.pressingBeaten', {
        opp: oppST.name, team: opp.name
      }));
    }

    // Difficulty curve by match number — opp offense ramps so late
    // matches require real defense. Now sourced from the shared
    // matchDifficulty() helper (see oppStat vicinity). Curve:
    //
    //   M1-5  (early): 2%/match, +10% total at first boss
    //   M6-10 (mid):   3%/match, +25% total at second boss
    //   M11-15 (late): 5%/match, +50% total at final
    //
    // At equal teams this moves final match from 3.90 → ~4.5 expected
    // goals-against, forcing real defensive play. Combined with
    // condition drain plus card cancel/dampen mechanics, the final
    // leg feels like a true gauntlet rather than a marginally harder
    // early match.
    const oppOffScaled = ((oppStat(match, 'offense') + (rb.offense || 0)) + (oppStat(match, 'tempo') + (rb.tempo || 0)) * 0.2) * matchDifficulty();
    const myDef  = vtStats.defense * 0.45 + twStats.defense * 0.55;
    await log(onEvent, '', `${pickLog('logs.oppApproach', {
      opp: oppST.name, team: opp.name, oppPM: oppPM.name
    })}`);

    match.stats.oppShots++;

    // Direct-action flags from cards played this round. Each is a
    // one-shot consumption: the flag is checked, respected, cleared.
    if (match._cardOppNextAttackFails) {
      match._cardOppNextAttackFails = false;
      await log(onEvent, '', `${opp.name} spills it — attack fizzles.`);
      return;
    }
    if (match._cardAbsorbNextOppShot) {
      match._cardAbsorbNextOppShot = false;
      match.stats.saves++;
      bumpPlayerStat(tw, 'saves', 1, match);
      await log(onEvent, '', `Block! The attack dies at the line.`);
      return;
    }
    if (match._cardGuaranteedSave) {
      match._cardGuaranteedSave = false;
      match.stats.saves++;
      bumpPlayerStat(tw, 'saves', 1, match);
      match.matchMomentum = Math.min(100, (match.matchMomentum || 0) + 8);
      await log(onEvent, '', `${tw?.name || 'Keeper'} — massive save! Ready and waiting.`);
      return;
    }

    dispatchTrigger('oppShot', ctx);
    await flushTriggerLog(match, onEvent);

    if (ctx.oppShotSaved) {
      match.stats.saves++;
      bumpPlayerStat(tw, 'saves', 1, match);
      if (match._busAndBikeActive) match._busAndBikeNextAttackBonus = 0.30;
      dispatchTrigger('postSave', { match });
      await flushTriggerLog(match, onEvent);
      return;
    }

    const myComposure = squad.reduce((s, p) => s + computePlayerStats(p, match).composure, 0) / squad.length;
    const composureDefBonus = (myComposure - oppStat(match, 'composure')) * 0.001;

    const pmForDef = squad.find(p => p.role === 'PM');
    const pmStatsForDef = pmForDef ? computePlayerStats(pmForDef, match) : { vision: 50 };
    const myVisionForDef = (vtStats.vision || 50) * 0.35
      + (twStats.vision || 50) * 0.40
      + (pmStatsForDef.vision || 50) * 0.25;
    const visionDefBonus = (myVisionForDef - oppStat(match, 'vision')) * 0.002;

    // Save-chance base: 0.44. Earlier at 0.50 was too easy (run-stomp),
    // then dropped to 0.40 which combined with the v21 progressive
    // difficulty curve made late matches unreachable even for strong
    // decks. 0.44 sits between: equal teams concede ~56% of opp attempts
    // at match 1, still pushes 75%+ by final thanks to difficulty scale,
    // but leaves enough headroom that full-engagement runs are winnable.
    let saveChance = 0.44
      + (myDef - oppOffScaled) * CONFIG.defenseStatScale
      + composureDefBonus
      + visionDefBonus
      + (match.nextSaveBonus || 0)
      - pressBreakBonus;
    if (match.teamBuffs?.saveBonus) saveChance += match.teamBuffs.saveBonus;

    // Card-based opp-trait interference — Ball Recovery, Gegenpress,
    // Possession Lock can pre-load a cancel/dampen that triggers once on
    // the opp's next shot. Cancel nullifies both shot-chance and save-
    // penalty bonuses from opp traits; Dampen halves them. One-shot use.
    const oppShotCtx = applyOppTraitEffect(opp, match, 'oppShotChance', { bonus: 0, shooter: oppST });
    for (const msg of (oppShotCtx.logMsgs || [])) await log(onEvent, 'trigger', msg);

    const oppSaveCtx = applyOppTraitEffect(opp, match, 'savePenalty', { penalty: 0 });
    for (const msg of (oppSaveCtx.logMsgs || [])) await log(onEvent, 'trigger', msg);

    let oppShotBonus = (oppShotCtx.bonus || 0);
    let oppSavePenalty = (oppSaveCtx.penalty || 0);

    if (match._cardOppTraitCancelPending) {
      match._cardOppTraitCancelPending = false;
      if (oppShotBonus > 0 || oppSavePenalty > 0) {
        await log(onEvent, 'trigger', window.I18N.t('ui.log.cardCancelOppTrait') || '✦ Card effect nullified their trait.');
        oppShotBonus = 0;
        oppSavePenalty = 0;
      }
    } else if (match._cardOppTraitDampenPending) {
      match._cardOppTraitDampenPending = false;
      if (oppShotBonus > 0 || oppSavePenalty > 0) {
        await log(onEvent, 'trigger', window.I18N.t('ui.log.cardDampenOppTrait') || '✦ Card effect weakened their trait.');
        oppShotBonus *= 0.5;
        oppSavePenalty *= 0.5;
      }
    }

    saveChance -= oppShotBonus;
    saveChance -= oppSavePenalty;
    saveChance -= (match._oppMoveShotBonus || 0);

    if (match._oppStrikerMalus && (oppST.role === 'ST' || oppST.role === 'LF')) {
      saveChance += match._oppStrikerMalus;
    }
    if (match._oppShotMalus) {
      saveChance += match._oppShotMalus;
    }
    if (match._keeperZoneBonus) {
      saveChance += match._keeperZoneBonus;
    }

    const misfitDef = match._tacticMisfit;
    if (misfitDef) {
      if (misfitDef.effects.oppCounterBonus) saveChance -= misfitDef.effects.oppCounterBonus;
      if (misfitDef.effects.lossConsequenceMult && match._lastBuildupFailed) {
        saveChance -= 0.10 * (misfitDef.effects.lossConsequenceMult - 1);
      }
      if (misfitDef.effects.paceyCounterBonus && opp.special?.id === 'pacey') {
        saveChance -= misfitDef.effects.paceyCounterBonus;
      }
    }

    if (match._fatigue > 0) saveChance -= match._fatigue * 0.35;
    saveChance = clamp(saveChance, 0.12, 0.92);
    match.nextSaveBonus = 0;

    const forceGoal = !!match._eventForceOppGoal;
    if (forceGoal) match._eventForceOppGoal = false;

    if (!forceGoal && rand() < saveChance) {
      match.stats.saves++;
      bumpPlayerStat(tw, 'saves', 1, match);
      recordAction(match, tw, 'save', false);
      // A decisive save lifts momentum toward us — the team rallies.
      match.matchMomentum = Math.min(100, (match.matchMomentum || 0) + 8);
      // Phase: save creates a transition moment — keeper catches
      // it, quick restart, team is upfield-ready. Counter-lane opens.
      match.matchPhase = 'transition';
      // Flag for micro-event check next round — counter-press chance.
      match._justSaved = true;
      if (match._busAndBikeActive) match._busAndBikeNextAttackBonus = 0.30;
      await log(onEvent, '', `${pickLog('logs.save', {
        tw: tw?.name || 'Keeper', vt: vt?.name || 'Defense',
        shooter: oppST.name, team: opp.name
      })}`);
      await logPhaseShift(match, onEvent, 'transition', 'save');
      dispatchTrigger('postSave', { match });
      await flushTriggerLog(match, onEvent);
    } else {
      match.stats.oppShotsOnTarget++;

      // v0.43 — Lattentreffer Gegnerseite (4%, symmetrisch zu unserer Seite).
      // Gegner war durch (Keeper geschlagen), aber der Ball geht an den
      // Pfosten / die Latte. Kein Gegentor, reiner Erleichterungs-Moment.
      // Schuss WAR auf's Tor (oppShotsOnTarget zählt weiter hoch), aber
      // recordAction 'goal' wird bewusst NICHT gefeuert — es ist kein
      // Tor, auch wenn der Schuss sauber war.
      if (rand() < 0.04) {
        match.stats.oppPostHits = (match.stats.oppPostHits || 0) + 1;
        try {
          const narrative = window.KL?.narrative?.composePostHitOpp?.(match, oppST);
          if (narrative) await log(onEvent, 'narrative', narrative);
        } catch (_) { /* narrative is nice-to-have */ }
        match.matchPhase = 'transition';
        await logPhaseShift(match, onEvent, 'transition', 'opp_post_hit');
        return;
      }

      // v0.44 — Abseits Gegnerseite (3%). Gegner trifft, aber war im
      // Abseits. Symmetrisch zur Eigen-Seite.
      if (rand() < 0.03) {
        match.stats.oppOffsides = (match.stats.oppOffsides || 0) + 1;
        try {
          const narrative = window.KL?.narrative?.composeOffsideOpp?.(match, oppST);
          if (narrative) await log(onEvent, 'narrative', narrative);
        } catch (_) { /* narrative is nice-to-have */ }
        match.matchPhase = 'transition';
        await logPhaseShift(match, onEvent, 'transition', 'opp_offside');
        return;
      }

      // v0.44 — Elfmeter Gegnerseite (1.5%, symmetrisch). Der Gegner-
      // Angriff wird zum Elfmeter gegen uns. pickOppScorer liefert den
      // Schützen; unser Keeper (tw aus Funktion-Scope) ist der Gegner.
      if (rand() < 0.015) {
        const oppPenShooter = pickOppScorer(match.opp);
        match.stats.oppPenalties = (match.stats.oppPenalties || 0) + 1;

        try {
          const intro = window.KL?.narrative?.composePenaltyIntro?.(match, oppPenShooter, false);
          if (intro) await log(onEvent, 'narrative', intro);
        } catch (_) { /* narrative is nice-to-have */ }

        const goalProb = (window.KL?.narrative?.penaltyGoalProb?.(oppPenShooter, tw)) ?? 0.73;
        const outcome = (window.KL?.narrative?.resolvePenaltyOutcome?.(goalProb, rand)) || 'save';

        try {
          const outcomeMsg = window.KL?.narrative?.composePenaltyOutcome?.(match, oppPenShooter, tw, outcome, false);
          if (outcomeMsg) await log(onEvent, 'narrative', outcomeMsg);
        } catch (_) { /* narrative is nice-to-have */ }

        if (outcome === 'goal') {
          match.scoreOpp += 1;
          match.stats.oppPenaltiesScored = (match.stats.oppPenaltiesScored || 0) + 1;
          match.matchMomentum = Math.max(-100, (match.matchMomentum || 0) - 30);
          match.matchPhase = 'defensive';
          recordAction(match, tw, 'concede', false);
          bumpPlayerStat(tw, 'goalsConceded');
          bumpPlayerStat(vt, 'goalsConceded');
          if (match.memory) {
            match.memory.consecutiveConceded = (match.memory.consecutiveConceded || 0) + 1;
            match.memory.consecutiveScored = 0;
            match.memory.lastRoundConceded = match.round;
            match.memory.roundGoalCountOpp = (match.memory.roundGoalCountOpp || 0) + 1;
          }
          match._oppWakeUpFiredThisStreak = false;
          await log(onEvent, 'goal-opp', window.I18N.t('ui.log.oppGoal', {
            name: oppPenShooter.name, team: opp.name, me: match.scoreMe, opp: match.scoreOpp
          }));
          await logPhaseShift(match, onEvent, 'defensive', 'opp_penalty_goal');
        } else {
          match.matchPhase = 'transition';
          bumpPlayerStat(tw, 'saves', 1, match);
          match.stats.saves = (match.stats.saves || 0) + (outcome === 'save' ? 1 : 0);
          await logPhaseShift(match, onEvent, 'transition', 'opp_penalty_miss');
        }
        return;
      }

      recordAction(match, oppST, 'goal', true);
      recordAction(match, tw, 'concede', false);
      if (match.memory) {
        match.memory.consecutiveConceded = (match.memory.consecutiveConceded || 0) + 1;
        match.memory.consecutiveScored = 0;
        match.memory.lastRoundConceded = match.round;
        match.memory.roundGoalCountOpp = (match.memory.roundGoalCountOpp || 0) + 1;
      }
      // v52.7 — opp scored, our streak is broken → re-arm wake-up trigger
      // so a future 2+ player-scoring streak fires it again.
      match._oppWakeUpFiredThisStreak = false;
      dispatchTrigger('oppGoal', ctx);
      await flushTriggerLog(match, onEvent);
      if (ctx.oppGoalCancelled) return;

      match.scoreOpp += 1;
      // Momentum swings toward opp on conceded goal. -30 is a significant
      // but not crippling shift — matches can be reclaimed from behind.
      // Storm Warning card can halve this drop one-shot.
      {
        let momentumDrop = 30;
        if (match._cardMomentumShield) {
          match._cardMomentumShield = false;
          momentumDrop = 15;
        }
        match.matchMomentum = Math.max(-100, (match.matchMomentum || 0) - momentumDrop);
      }
      // Phase: conceding shifts us into defensive mode — regroup,
      // stop the bleeding. Card affinities reward defense cards next.
      match.matchPhase = 'defensive';
      bumpPlayerStat(tw, 'goalsConceded');
      bumpPlayerStat(vt, 'goalsConceded');

      if (match.finalAction?.id === 'all_in' && match.round === 6) {
        await log(onEvent, 'decision', pickLog('ui.log.allInExposed', { opp: oppST.name, team: opp.name }));
      } else if ((match.teamBuffs?.offense || 0) > 20 && (match.teamBuffs?.defense || 0) < -8) {
        await log(onEvent, 'decision', pickLog('ui.log.attackingExposed', { opp: oppST.name, team: opp.name }));
      } else if (match.aggressiveRoundsLeft > 0 && rand() < 0.50) {
        await log(onEvent, 'decision', pickLog('ui.log.aggressiveExposed', { opp: oppST.name, team: opp.name }));
      }

      // v0.42 — Narrativ-Layer: Gegentor-Aufbau vor dem Gegentor-Log.
      // Parallel zum Eigen-Tor-Hook, aber mit composeOppGoalBuildup,
      // das unseren tactical state als narrativen Context nutzt (was
      // lief bei UNS schief) statt Karten (Gegner hat keine).
      // Defensive in try/catch — Narrativ darf nie die Engine blocken.
      try {
        const buildup = window.KL?.narrative?.composeOppGoalBuildup?.(match, oppST);
        if (buildup) {
          await log(onEvent, 'narrative', buildup);
        }
      } catch (_) { /* nice-to-have */ }
      await log(onEvent, 'goal-opp', window.I18N.t('ui.log.oppGoal', {
        name: oppST.name, team: opp.name, me: match.scoreMe, opp: match.scoreOpp
      }));
      await logPhaseShift(match, onEvent, 'defensive', 'conceded');

      if (match._rallyActive) match.rallyReactionPending = true;
      dispatchTrigger('afterOppGoal', { match });
      await flushTriggerLog(match, onEvent);
    }
  }

  // ─── Cup Extratime — runs when a cup match is tied after R6 ──────────────
  // Two "halves" of extra time with a shared fatigue malus (-3 offense on
  // both sides → more tentative play). Lightweight: one chance per side per
  // half, stat-driven probability. If still tied at the end, the caller falls
  // through to runPenaltyShootout. League-final ties still go straight to
  // penalties (no extratime) — extratime is a cup-only experience.
  async function runExtratime(match, squad, onEvent) {
    const I18N = window.I18N;
    await log(onEvent, 'kickoff', I18N.t('ui.log.extratimeIntro', {
      me: match.scoreMe,
      opp: match.scoreOpp
    }));

    const myTeam       = averageEffectiveTeamStats(squad, match);
    const theirOffBase = oppStat(match, 'offense') || 60;
    const theirDefBase = oppStat(match, 'defense') || 60;

    // Fatigue: -3 offense both sides. Defense untouched — ET is famously
    // a war of attrition where chances dry up but blocks still land.
    const myOffense    = Math.max(30, myTeam.offense - 3);
    const theirOffense = Math.max(30, theirOffBase - 3);
    const myDefense    = myTeam.defense;
    const theirDefense = theirDefBase;

    const oppName = match.opp?.name || '';

    for (let half = 1; half <= 2; half++) {
      match.round = 6 + half;   // R7, R8
      await log(onEvent, 'phase-shift', I18N.t('ui.log.extratimeHalf', { n: half }));

      // Player chance first (home-advantage convention).
      const myGoalProb = clamp(0.22 + (myOffense - theirDefense) * 0.005, 0.10, 0.50);
      if (rand() < myGoalProb) {
        match.scoreMe++;
        const scorer = squad.find(p => p.role === 'ST') || squad.find(p => p.role === 'LF') || squad[0];
        if (scorer) {
          scorer._matchStats = scorer._matchStats || { goals: 0, assists: 0, saves: 0 };
          scorer._matchStats.goals = (scorer._matchStats.goals || 0) + 1;
        }
        await log(onEvent, 'goal-me', I18N.t('ui.log.extratimeGoalMe', {
          name: scorer?.name || '',
          me:   match.scoreMe,
          opp:  match.scoreOpp
        }));
      } else {
        await log(onEvent, '', I18N.t('ui.log.extratimeNoGoalMe'));
      }
      if (match.fastSkip !== 'test') await sleep(match.fastSkip ? 150 : 500);

      // Opp chance.
      const oppGoalProb = clamp(0.22 + (theirOffense - myDefense) * 0.005, 0.10, 0.50);
      if (rand() < oppGoalProb) {
        match.scoreOpp++;
        const oppScorer = pickOppScorer(match.opp);
        await log(onEvent, 'goal-opp', I18N.t('ui.log.extratimeGoalOpp', {
          scorer: oppScorer?.name || oppName,
          opp:    oppName,
          me:     match.scoreMe,
          oppScore: match.scoreOpp
        }));
      } else {
        await log(onEvent, '', I18N.t('ui.log.extratimeNoGoalOpp', { opp: oppName }));
      }
      if (match.fastSkip !== 'test') await sleep(match.fastSkip ? 150 : 600);

      await onEvent({ type: 'roundEnd', match });
    }

    await log(onEvent, 'decision', I18N.t('ui.log.extratimeEnd', {
      me:  match.scoreMe,
      opp: match.scoreOpp
    }));
  }

  async function runPenaltyShootout(match, squad, onEvent) {
    await log(onEvent, 'kickoff', window.I18N.t('ui.log.penaltiesIntro', { me: match.scoreMe, opp: match.scoreOpp }));
    await log(onEvent, 'decision', window.I18N.t('ui.log.penaltiesTitle'));

    const myComposure = squad.reduce((s, p) => s + (p.stats.composure || 0), 0) / squad.length;
    const oppComposure = oppStat(match, 'composure') || 60;
    const diff = myComposure - oppComposure;
    const myHitProb  = clamp(0.72 + diff * 0.005, 0.55, 0.90);
    const oppHitProb = clamp(0.72 - diff * 0.005, 0.55, 0.90);

    let myPens = 0, oppPens = 0;
    for (let i = 0; i < 5; i++) {
      if (rand() < myHitProb)  { myPens++;  await log(onEvent, '', window.I18N.t('ui.log.penaltyScored',    { num: i + 1, me: myPens, opp: oppPens })); }
      else                     {            await log(onEvent, '', window.I18N.t('ui.log.penaltyMissed',    { num: i + 1, me: myPens, opp: oppPens })); }
      if (rand() < oppHitProb) { oppPens++; await log(onEvent, '', window.I18N.t('ui.log.oppPenaltyScored', { name: match.opp.name, me: myPens, opp: oppPens })); }
      else                     {            await log(onEvent, '', window.I18N.t('ui.log.oppPenaltyMissed', { name: match.opp.name, me: myPens, opp: oppPens })); }
      const remaining = 5 - i - 1;
      if (Math.abs(myPens - oppPens) > remaining) break;
    }
    let sdRounds = 0;
    const SD_MAX = 15;
    while (myPens === oppPens && sdRounds < SD_MAX) {
      sdRounds++;
      const mHit = rand() < myHitProb;
      const oHit = rand() < oppHitProb;
      if (mHit) myPens++;
      if (oHit) oppPens++;
      if (mHit !== oHit) {
        await log(onEvent, '', window.I18N.t('ui.log.suddenDeath', { me: myPens, opp: oppPens }));
      } else {
        // Auch gleiche Ausgänge loggen, damit kein stiller Hänger entsteht.
        await log(onEvent, '', window.I18N.t('ui.log.suddenDeath', { me: myPens, opp: oppPens }));
      }
    }
    // Safety-Tiebreak: bei unwahrscheinlichem Pattstand nach SD_MAX Runden
    // entscheidet Composure.
    if (myPens === oppPens) {
      if (myComposure >= oppComposure) myPens++;
      else oppPens++;
    }
    match.scoreMe  += myPens;
    match.scoreOpp += oppPens;

    if (myPens > oppPens) {
      await log(onEvent, 'goal-me', window.I18N.t('ui.log.penaltiesWin'));
      return 'win';
    } else {
      await log(onEvent, 'goal-opp', window.I18N.t('ui.log.penaltiesLoss'));
      return 'loss';
    }
  }

  async function startMatch(squad, opp, onEvent) {
    // Pre-Match Win-Prob als Baseline für den Result-Highlight
    // ("Eure Entscheidungen waren +X pp wert").
    let preMatchWinProb = null;
    if (KL.intel?.estimateWinProbability) {
      const est = KL.intel.estimateWinProbability(squad, opp);
      preMatchWinProb = est ? est.win : null;
    }

    // Stat-Snapshot: damit der Result-Screen zeigen kann, welche Werte
    // sich während des Matches geändert haben (durch Shift/Sacrifice/
    // Focus-Fail/Evolutionen). Wir speichern auf dem Spieler-Objekt,
    // damit die Diff auch nach Match-Ende verfügbar ist.
    for (const p of squad) {
      p._statsBeforeMatch = { ...p.stats };
      p._levelBeforeMatch = p.level;
    }

    const match = {
      round: 0,
      scoreMe: 0,
      scoreOpp: 0,
      // v0.45 — Per-round score snapshots for end-of-match drama
      // classifier (comeback/collapse detection). Initialized empty,
      // appended at roundEnd. Entry shape: { round, me, opp }.
      scoreTimeline: [],
      // match.squad shares its array reference with the `squad` closure
      // parameter used throughout runMatch. In-match substitutions
      // (halftime sub, event-driven swaps in decisions.js) MUST mutate
      // in-place via `match.squad[idx] = incoming`. Reassigning (i.e.
      // `match.squad = [...new]`) would leave the closure `squad`
      // pointing at the old array, and every attemptAttack /
      // attemptOppAttack call — which captures `squad` in its signature
      // — would continue reading the pre-sub lineup. The current three
      // swap sites (decisions.js:759, 1643, 2466) all honor this
      // contract. Keep it that way, or refactor every helper below to
      // read `match.squad` freshly instead of taking `squad` as a
      // parameter.
      squad,
      opp,

      _preMatchWinProb: preMatchWinProb,

      teamBuffs: { offense: 0, defense: 0, tempo: 0, vision: 0, composure: 0 },
      buffLayers: [],
      activeTacticTags: [],

      log: [],
      triggersThisRound: 0,
      firstShotTaken: false,
      _oppTraitLogged: {},
      _traitFireCounts: {},
      triggerLog: [],

      counterPending: false,
      chainAttack: false,
      pouncePending: false,
      shadowStrikeTriggered: false,
      doubleNextGoal: false,
      tripleNextGoal: false,
      ghostChancePending: false,
      rallyReactionPending: false,
      comboCounter: 0,
      nextBuildupBonus: 0,
      nextSaveBonus: 0,
      puzzleBonus: 0,

      lastTactic: null,
      halftimeAction: null,
      finalAction: null,

      // Match phase — football-structural state that reshapes which
      // card types are strong this round. Evolves via events: goal
      // conceded → recovery, own goal → kickoff, save → transition,
      // failed attack → loss-phase, successful setup → possession.
      // Start: neutral buildup. Rotates naturally with play.
      //
      //   buildup    — standard, no modifiers
      //   possession — setups strong (+20% flow), triggers weak
      //   transition — triggers strong (+25% shot-chance), setups weak
      //   attack     — combos strong (+30% payoff), defenses weak
      //   loss       — counters strong (+25%), offense weak
      //   defensive  — defenses strong (+25%), offense weak
      matchPhase: 'buildup',
      _lastMatchPhase: 'buildup',

      // Match-level momentum: -100 (opp dominates) to +100 (we dominate).
      // Shifts via events (goals, saves, cards, misses). Applies as a
      // zone-based buff/malus to next round rolls. Dampens 50% at halftime.
      // Unlike `momentumCounter` (which is a discrete streak counter for
      // Balanced-tactic buildup bonus), this is the full match arc.
      matchMomentum: 0,
      _lastMomentumZone: 'neutral',

      _tacticFit: null,
      _tacticMisfit: null,

      autoCounterRoundsLeft: 0,
      doubleCounterPending: false,
      pressingRoundsLeft: 0,
      possessionActive: false,
      aggressiveRoundsLeft: 0,
      flankRoundsLeft: 0,
      momentumCounter: 0,
      guaranteedFirstBuildup: false,
      _fatigue: 0,

      _htPressingBlocks: 0,
      _htCountersFired: 0,

      // Focus-Felder entfernt — System deprecated.

      _oppKeeperRattledBonus: 0,
      _oppKeeperRattledUntilRound: 0,

      _teamTalkFailed: false,

      _firedEvents: new Set(),
      _eventsThisMatch: 0,
      _eventImmediateAttack: false,
      _oppBuildupPenalty: 0,
      _oppBuildupPenaltyRounds: 0,

      stats: {
        myShots: 0, myShotsOnTarget: 0, myBuildups: 0, myBuildupsSuccess: 0,
        oppShots: 0, oppShotsOnTarget: 0, oppBuildups: 0, oppBuildupsSuccess: 0,
        triggersFired: 0, oppTriggersFired: 0, saves: 0
      }
    };

    for (const p of squad) {
      delete p._usedAcrobat;
      delete p._usedNineLives;
      delete p._readGameUsed;
      delete p._chessUsed;
      delete p._speedBurstUsed;
      delete p._whirlwindUsed;
      delete p._whirlwindUsed1h;
      delete p._whirlwindUsed2h;
      delete p._bloodScentStacks;
      delete p._chameleonTrait;
      delete p._chameleonUsed;
      delete p._metronomeBonus;
      delete p._dribbleStack;
      delete p._triggerCount;
      delete p._unbreakableUsed;
      delete p._godModeUsed;
    }
    resetPlayerMatchStats(squad);
    resetPlayerMatchStats(opp.lineup || []);
    initMatchMemory(match);
    if (window.state) window.state.currentMatch = match;

    // Rivalry-based buff/malus on the opponent. Pulled from
    // state._oppMemory via league.getRivalryContext. If the opp has
    // history with us, they come into this match in a specific mood:
    //   - revenge: we beat them, they're angry   → +4 offense/tempo
    //   - dominant-against-us (we lost): they smell more  → +3 offense
    //   - blood / grudge: sharpened all round     → +3 to all stats
    //   - neutral: quiet, no buff
    // Stored as a buff layer with source 'rivalry' so it surfaces in
    // the normal stat pipeline without special-casing.
    const rivalry = window.KL?.league?.getRivalryContext?.(window.state, opp.id);
    if (rivalry) {
      let stats = {};
      if (rivalry.flavor === 'revenge' || rivalry.flavor === 'dominant') {
        // We beat them last — they want it back.
        if (rivalry.lastOutcome === 'loss') {
          // We lost to them last. They're confident, not angry.
          stats = { offense: 3, composure: 2 };
        } else {
          // We won. They're mad.
          stats = { offense: 4, tempo: 3, composure: -1 };
        }
      } else if (rivalry.flavor === 'blood') {
        stats = { offense: 5, defense: 3, tempo: 4 };
      } else if (rivalry.flavor === 'grudge') {
        stats = { offense: 3, defense: 3, tempo: 2 };
      }
      if (Object.keys(stats).length) {
        // Applied as a player-side malus layer (negated stats on OUR
        // team). Mechanically this makes the rivalry match harder for
        // the player without touching opp.stats — zero-sum in feel,
        // but technically a debuff on us rather than a buff on them.
        // Layer is match-long (rounds 1-6) so a grudge match feels
        // consistently sharper, not just a one-round bump.
        const negatedStats = {};
        for (const [k, v] of Object.entries(stats)) negatedStats[k] = -v;
        match.buffLayers.push({
          source: 'rivalry:' + rivalry.flavor,
          range: [1, 6],
          stats: negatedStats,
          special: null
        });
        match._rivalryFlavor = rivalry.flavor;
      }
    }

    // v0.48 — Win-Confidence-Bonus (Balance Option C). State.confidence-
    // Bonus wird pro Liga-Win um +1 erhöht, cappe bei +4. Hier als match-
    // weiter buffLayer appliziert auf ALLE fünf Stats. Reset beim
    // Saison-Ende. Narrativ: "Team spielt mit Selbstvertrauen". Belohnt
    // Streaks ohne Niederlagen zusätzlich zu bestrafen (kein negatives
    // Gegenstück, anders als currentLossStreak).
    const confidence = window.state?.confidenceBonus || 0;
    if (confidence > 0) {
      match.buffLayers.push({
        source: 'confidence',
        range: [1, 6],
        stats: { offense: confidence, defense: confidence, tempo: confidence, vision: confidence, composure: confidence },
        special: null
      });
      match._confidenceBonus = confidence;
    }

    // Team chemistry: shared trait-tags across 3+ starters trigger a
    // small team-wide bonus. Rewards cohesive lineup choices — picking
    // composure-heavy players gives everyone a nerve boost, picking
    // aggressive players tilts the team forward. Small numbers (~3 pts)
    // to avoid overshadowing individual stats; stacks additively.
    const CHEM_TRAIT_TAGS = {
      composure:  { stat: 'composure', amount: 4, label: 'Cool Heads' },
      aggressive: { stat: 'offense',   amount: 4, label: 'Hunters' },
      pressing:   { stat: 'tempo',     amount: 4, label: 'Relentless' },
      vision:     { stat: 'vision',    amount: 4, label: 'All Eyes' },
      defensive:  { stat: 'defense',   amount: 4, label: 'Back Wall' }
    };
    const traitTagCounts = {};
    for (const p of squad) {
      const tags = [];
      // Player's trait IDs treated as tags; plus any explicit tag property
      for (const t of (p.traits || [])) {
        if (typeof t === 'string') tags.push(t);
      }
      // Normalize tag-like strings to see matching groups
      for (const tag of tags) {
        for (const tagKey of Object.keys(CHEM_TRAIT_TAGS)) {
          if (tag.includes(tagKey) || tag.toLowerCase().includes(tagKey)) {
            traitTagCounts[tagKey] = (traitTagCounts[tagKey] || 0) + 1;
          }
        }
      }
    }
    const chemistryActive = [];
    for (const [tagKey, count] of Object.entries(traitTagCounts)) {
      if (count >= 3) {
        const chem = CHEM_TRAIT_TAGS[tagKey];
        match.buffLayers.push({
          source: 'chemistry:' + tagKey,
          range: [1, 6],   // whole match
          stats: { [chem.stat]: chem.amount },
          special: null
        });
        chemistryActive.push({ label: chem.label, tagKey, count, stat: chem.stat, amount: chem.amount });
      }
    }
    match._activeChemistry = chemistryActive;

    const teamFormAvg = squad.reduce((s, p) => s + (p.form || 0), 0) / squad.length;
    if      (teamFormAvg >=  2) match._teamFormBonus =  3;
    else if (teamFormAvg <= -2) match._teamFormBonus = -3;
    else                         match._teamFormBonus =  0;
    match._teamFormLabel = teamFormAvg >=  2 ? 'HEISSER LAUF'
                        :  teamFormAvg <= -2 ? 'KRISE' : null;

    // Trait-Dispatch für matchStart. Muss VOR onEvent + vor dem
    // Kickoff-Tactic laufen, damit Traits wie wall_effect ihre
    // teamBuffs (saveBonus, buildupMalus) setzen können, bevor
    // die erste Runde startet.
    dispatchTrigger('matchStart', { match });
    await flushTriggerLog(match, onEvent);

    await onEvent({ type: 'matchStart', match });
    await log(onEvent, 'kickoff', pickLog('ui.log.matchIntro', {
      me: getTeamDisplayName(squad), opp: opp.name
    }));
    if (match._teamFormLabel === 'HEISSER LAUF') await log(onEvent, 'trigger', pickLog('ui.log.formHot'));
    else if (match._teamFormLabel === 'KRISE')    await log(onEvent, 'trigger', pickLog('ui.log.formCrisis'));

    // Announce active chemistry bonuses (team-wide trait synergies).
    for (const chem of (match._activeChemistry || [])) {
      const msg = `✦ Team Chemistry: ${chem.label} (${chem.count}× shared) — +${chem.amount} ${chem.stat.toUpperCase()} team-wide.`;
      await log(onEvent, 'trigger', msg);
    }

    if (opp.special || opp.traits?.length) {
      const parts = [];
      if (opp.special) parts.push(opp.special.name);
      if (opp.traits?.length) {
        for (const tid of opp.traits) {
          const tdef = KL.traits.OPP_TRAITS.find(x => x.id === tid);
          const holder = opp.traitHolders?.[tid];
          if (tdef && holder) {
            parts.push(`${tdef.name} (${holder.name})`);
          } else if (tdef) {
            parts.push(tdef.name);
          }
        }
      }
      await log(onEvent, 'decision', window.I18N.t('ui.log.opponentIntro', { parts: parts.join(' / ') }));
    }

    if (CONFIG.oppMoveSystemEnabled !== false && KL.oppMoves) {
      const mn = (window.state?.matchNumber || 0) + 1;
      KL.oppMoves.initOppDeck(opp, mn);
      const archKey = 'ui.oppArchetype.' + opp.archetype;
      const archMsg = window.I18N?.t?.(archKey, { opp: opp.name });
      if (archMsg && archMsg !== archKey) {
        await log(onEvent, 'decision', archMsg);
      }
    }

    for (let r = 1; r <= CONFIG.rounds; r++) {
      match.round = r;
      match.triggersThisRound = 0;
      match._playerAttacksThisRound = 0;
      match._suppressedAttacksThisRound = 0;

      if (CONFIG.oppMoveSystemEnabled !== false && KL.oppMoves) {
        KL.oppMoves.consumePerRoundFlags(match);
        const move = KL.oppMoves.drawMove(match);
        if (move) {
          KL.oppMoves.applyMoveOnDraw(match, move, onEvent);
          const nameKey = 'ui.oppMove.' + move.id + '.name';
          const descKey = 'ui.oppMove.' + move.id + '.telegraph';
          const name = window.I18N?.t?.(nameKey) || move.id;
          const desc = window.I18N?.t?.(descKey) || '';
          const severityMark = '●'.repeat(move.severity) + '○'.repeat(3 - move.severity);
          const logKey = move.severity >= 2 ? 'ui.log.oppMoveTelegraph' : 'ui.log.oppMoveQuiet';
          const logMsg = window.I18N?.t?.(logKey, { name, desc, sev: severityMark, opp: opp.name });
          if (logMsg && logMsg !== logKey) {
            await log(onEvent, 'trigger', logMsg);
          } else {
            await log(onEvent, 'trigger', `▸ ${opp.name} lädt: ${name} [${severityMark}]`);
          }
          // v0.47 — Counter-Hint unter dem Telegraph. Telemetrie zeigte
          // 0 defused Opp-Moves in 36 Fällen — Spieler sieht nicht,
          // welche Karten-Kategorie den Move kontern würde. Jetzt: bei
          // severity ≥ 2 erscheint ein zweiter Log-Eintrag mit dem
          // generischen Counter-Tipp pro Opp-Move-Kategorie. Für rare
          // Opp-Moves reichen die Kategorien (aggressive/lockdown/
          // disruption/setup/big) als erster Wegweiser — spezifische
          // Karten-Namen im Deck wären Phase 2.
          if (move.severity >= 2 && move.category) {
            const hintKey = 'ui.oppMoveCounter.' + move.category;
            const hint = window.I18N?.t?.(hintKey);
            if (hint && hint !== hintKey) {
              await log(onEvent, 'trigger', hint);
            }
          }
          if (typeof window.recomputeTeamBuffs === 'function') window.recomputeTeamBuffs(match);
        }
      }

      match._traitFireRankRoundMe = 0;

      // ── Momentum zone application ──────────────────────────────────
      // Translate match.matchMomentum (continuous, -100..+100) into a
      // discrete zone that pushes a BuffLayer for this round only.
      // Zones have BOTH upsides and downsides — the team in a rush
      // scores easier but leaves gaps; the team under pressure defends
      // tight but creates less; desperation opens the counter-window.
      // Keeps football authenticity: leading is never "free".
      (() => {
        const mm = match.matchMomentum || 0;
        let zone, stats;
        if      (mm >=  60) { zone = 'rush';     stats = { offense:  8, defense: -2 }; }
        else if (mm >=  20) { zone = 'leading';  stats = { offense:  4, defense: -1 }; }
        else if (mm >  -20) { zone = 'neutral';  stats = null; }
        else if (mm >  -60) { zone = 'pressured';stats = { defense: 3, composure: -4 }; }
        else                { zone = 'desperate';stats = { defense: -4, offense: 3, tempo: 4 }; }

        if (stats) {
          match.buffLayers.push({
            source: 'momentum:' + zone,
            range: [r, r],
            stats,
            special: null
          });
          if (typeof window.recomputeTeamBuffs === 'function') window.recomputeTeamBuffs(match);
        }

        // Overconfidence: 10% chance during "rush" to fumble — team loses
        // the bubble. Momentum resets to 0, a flavor log fires. Punishes
        // snowball, keeps the feedback loop from running away.
        if (zone === 'rush' && Math.random() < 0.10) {
          match.matchMomentum = 0;
          match._momentumFumbled = true;
        }

        // Zone transition log — only when the zone *changes* so we don't
        // spam. Uses a single i18n line per transition, no new UI.
        if (zone !== match._lastMomentumZone) {
          match._lastMomentumZone = zone;
          const key = 'ui.log.momentumZone.' + zone;
          const txt = window.I18N?.t?.(key);
          if (txt && txt !== key && zone !== 'neutral') {
            // fire async, but don't await — we want this to land as a
            // flavor line, not a blocking beat. Use a tag that log styling
            // renders with a subtle muted tone.
            onEvent({ type: 'log', msg: txt, cls: 'trigger' });
          }
          if (match._momentumFumbled) {
            match._momentumFumbled = false;
            const fKey = 'ui.log.momentumFumble';
            const fTxt = window.I18N?.t?.(fKey);
            if (fTxt && fTxt !== fKey) {
              onEvent({ type: 'log', msg: fTxt, cls: 'trigger' });
            }
          }
        }
      })();

      // ── Opp adaptation (v38) ───────────────────────────────────────
      // Six interlocking behaviors that make the opponent feel alive
      // mid-match rather than statically resolving. Each fires at most
      // once per match (logged via match._oppAdaptLog set).
      //   1) Halftime adjustment (R4): reactive to score
      //   2) Rage threshold: lead ≥ 2 for us
      //   3) Read tactic: we've played 3+ combos, they adapt
      //   4) Scout layer: only at boss matches (R1, stat-boost)
      //   5) Late-game desperation: R5+ when opp behind
      //   6) Tactical sub (R4): opp swaps out weak trait for stronger
      if (!match._oppAdaptLog) match._oppAdaptLog = new Set();
      await applyOppAdaptation(match, onEvent, r);
      if (typeof window.recomputeTeamBuffs === 'function') window.recomputeTeamBuffs(match);

      // Condition drain — per-role multiplier so the squad doesn't
      // flatline at identical values. Runners (ST/WG) burn harder,
      // keeper sits easier, playmaker sits in the middle-high.
      //
      //   TW: 0.55  (keeper barely moves)
      //   VT: 0.90  (defender, solid work)
      //   PM: 1.15  (orchestrator, dictates tempo)
      //   LF: 1.10  (forward/wing, overlapping runs)
      //   ST: 1.25  (striker, sprints chasing every chance)
      //
      // Base drain after v52.2.1 is 9 — multiplier tunes individual burn rates.
      // With drain 9 + halftime floor-80-add-20 + new recovery tiers,
      // typical match-1 end: TW ≈ 72, VT ≈ 63, PM ≈ 56, LF ≈ 58, ST ≈ 54.
      // Heavy-card-use can push ST toward 35-40 territory, which is the
      // tier boundary that triggers the condition penalty on stats —
      // the "overplayed" feeling is at 40-50% like it should be.
      //
      // v52.2 — Halftime recovery softened. Was a flat floor-to-80 which
      // made intra-match card drain disappear every halftime: a player
      // who spent 25 condition on cards in H1 was restored for free at
      // R4, so the drain had no second-half consequence. New rule: add
      // +20 condition, cap at 80. Heavy H1 spending still costs something
      // in H2; light spending still fully recovers. Narrative match
      // (halftime gives a break, not a reset).
      // v52.2.1 — Drain rate reduced from 12 to 9 base. The old 12
      // was tuned for the old flat-floor-80 halftime AND unlimited
      // post-match recovery (starters snapped back to 100 next match).
      // Under the new regime (tiered post-match + asymmetric halftime),
      // drain-12 produced unrealistic exhaustion: ST at rate 15/round
      // ended match 1 at ~30 and could hit single-digit condition by
      // match 2 R6. Drain-9 makes ST lose 11/round, ending match 1 at
      // ~58, starting match 2 fresh enough to perform, but still with
      // meaningful gradient if overplayed. Multipliers unchanged so
      // role diversity (TW/VT/PM/LF/ST) stays intact; only base scale.
      const DRAIN_BY_ROLE = { TW: 0.55, VT: 0.90, PM: 1.15, LF: 1.10, ST: 1.25 };
      // Evolution-based drain reduction — experienced players burn less
      // condition per round. Stage 0 (fresh) = full drain, Stage 1 = 0.92×,
      // Stage 2 (fully evolved) = 0.82×. Over 6 rounds this saves an
      // evolved striker ~10 condition — meaningful padding that makes
      // Stage-3 evolutions feel like a systemic upgrade, not just
      // numeric stat boosts. Ties evolution to the condition system.
      const EVO_DRAIN_MULT = [1.0, 0.92, 0.82];
      const isHalftime = (r === 4);
      let recoveredCount = 0;
      for (const p of match.squad || []) {
        if (r === 1) {
          if (typeof p.condition !== 'number') p.condition = 100;
        } else {
          if (isHalftime) {
            // Halftime boost — +20 condition capped at 80, then apply R4 drain.
            // Asymmetric: a starter at 30 comes out at 50 (still tired),
            // a starter at 70 comes out at 80 (mostly fresh).
            const before = p.condition ?? 100;
            p.condition = Math.min(80, before + 20);
            if (p.condition > before) recoveredCount++;
          }
          const roleMult = DRAIN_BY_ROLE[p.role] ?? 1.0;
          const evoMult  = EVO_DRAIN_MULT[p.stage || 0] ?? 1.0;
          const drop = Math.round(9 * roleMult * evoMult);
          p.condition = Math.max(0, (p.condition ?? 100) - drop);
        }
      }

      // Surface the halftime recovery in the log so the player sees the
      // structural event. Uses i18n if available, otherwise a plain fallback.
      if (isHalftime && recoveredCount > 0) {
        const key = 'ui.log.halftimeRecovery';
        const txt = window.I18N?.t?.(key);
        const msg = (txt && txt !== key)
          ? txt.replace('{count}', String(recoveredCount))
          : `Halftime — ${recoveredCount} player(s) recovered to 80.`;
        await log(onEvent, 'decision', msg);
      }

      // Snapshot per-starter condition at kickoff for the post-match
      // bilanz view. Taken AFTER the R1 init so fresh players start
      // from 100 (or their carried value if already set).
      if (r === 1) {
        match._conditionStartSnapshot = {};
        for (const p of match.squad || []) {
          if (typeof p.condition === 'number') {
            match._conditionStartSnapshot[p.id] = p.condition;
          }
        }
      }

      recomputeTeamBuffs(match);

      // Opp-Mood state machine — checks scoreline + round and may
      // shift the opponent into cruising/bottling/rattled/desperate.
      // Mood applies a buff layer on match.oppBuffLayers; recomputed
      // immediately so the new values take effect THIS round.
      const moodChange = checkOppMood(match);
      if (moodChange) {
        recomputeTeamBuffs(match);   // re-aggregate with the new mood layer
        if (moodChange.to !== 'neutral') {
          const moodMsg = window.I18N?.pickText?.('ui.log.oppMood.' + moodChange.to, { opp: match.opp.name })
            || `${match.opp.name}: mood shifts.`;
          await log(onEvent, 'trigger', moodMsg);
        }
      }

      if (match.autoCounterRoundsLeft > 0) match.autoCounterRoundsLeft--;
      if (match.pressingRoundsLeft    > 0) match.pressingRoundsLeft--;
      if (match.aggressiveRoundsLeft  > 0) match.aggressiveRoundsLeft--;
      if (match.flankRoundsLeft       > 0) match.flankRoundsLeft--;

      if (r > 1) {
        const buffEntries = Object.entries(match.teamBuffs)
          .filter(([k, v]) => Math.abs(v) >= 5 && ['offense','defense','tempo','vision','composure'].includes(k));
        if (buffEntries.length > 0) {
          const buffStr = buffEntries.map(([k, v]) => `${k.substring(0,3).toUpperCase()} ${v>0?'+':''}${v}`).join(' ');
          await log(onEvent, 'decision', window.I18N.t('ui.log.activeBuffs', { buffs: buffStr }));
        }
      }

      const lateCtx  = applyOppTraitEffect(match.opp, match, 'lateGameBoost', {});
      const earlyCtx = applyOppTraitEffect(match.opp, match, 'earlyDefense',  {});
      match.opp._roundBuffs = {
        offense: (lateCtx.offense || 0),
        tempo:   (lateCtx.tempo   || 0),
        defense: (earlyCtx.defense || 0)
      };
      // v52.2 — Re-apply tactic-based opp debuffs after the roundBuffs
      // reset. The reset above rebuilds _roundBuffs from scratch each
      // round (trait effects only), so multi-round debuffs set by
      // tactics (mindgames, cold_read, tactical_foul) would otherwise
      // only last 1 round. The decrement happens here (at start of the
      // round being "spent") so the counter semantics are
      // "rounds remaining to apply, inclusive of current round".
      //
      // Execution order matters:
      //   1. _roundBuffs reset (above)
      //   2. Debuff re-apply (this block)
      //   3. Kickoff tactic pick on R1 — applyTactic may further
      //      modify _roundBuffs (e.g. tactical_foul sets its OWN
      //      tempo debuff), which stacks correctly.
      if (match._tacticalFoulRoundsLeft > 0) {
        match.opp._roundBuffs.tempo = (match.opp._roundBuffs.tempo || 0) - 12;
        match._tacticalFoulRoundsLeft--;
      }
      if (match._mindgamesRoundsLeft > 0) {
        match.opp._roundBuffs.composure = (match.opp._roundBuffs.composure || 0) - 6;
        match._mindgamesRoundsLeft--;
      }
      if (match._coldReadRoundsLeft > 0) {
        match.opp._roundBuffs.offense = (match.opp._roundBuffs.offense || 0) - 8;
        match._coldReadRoundsLeft--;
      }
      for (const msg of (lateCtx.logMsgs  || [])) await log(onEvent, 'trigger', msg);
      for (const msg of (earlyCtx.logMsgs || [])) await log(onEvent, 'trigger', msg);

      if (match.opp.traits?.includes('lucky') && !match.opp._luckyUsed && r >= 2 && rand() < 0.25) {
        match.opp._luckyUsed = true;
        match._oppLuckyPending = true;
        match.stats.oppTriggersFired = (match.stats.oppTriggersFired || 0) + 1;
        match._oppTraitFireCounts = match._oppTraitFireCounts || {};
        match._oppTraitFireCounts.lucky = (match._oppTraitFireCounts.lucky || 0) + 1;
      }

      if (r === 1) {
        window.UI?.updateRoundIndicator?.(r);
        const tactic = await onEvent({ type: 'interrupt', phase: 'kickoff', match });
        match.lastTactic = tactic;
        applyDecision(match, tactic, 'kickoff', window.state);
        match.activeTacticTags = [...(tactic.tags || [])];
        recomputeTeamBuffs(match);
        await onEvent({ type: 'buffsUpdated', match });
        const buffAfter = match.teamBuffs;
        const buffStr = Object.entries(buffAfter)
          .filter(([k, v]) => Math.abs(v) >= 3 && ['offense','defense','tempo','vision','composure'].includes(k))
          .map(([k, v]) => `${k.substring(0,3).toUpperCase()} ${v>0?'+':''}${v}`)
          .join('  ');
        const personalStr = formatTacticPersonalMutations(match);
        await log(onEvent, 'decision interrupt-choice',
          window.I18N.t('ui.log.kickoffChoice', { name: tactic.name })
          + (buffStr ? `  [${buffStr}]` : '')
          + (personalStr ? `  ${personalStr}` : ''));
        await flushTacticFeedback(match, onEvent);
        if (match._tacticFit === true) {
          await log(onEvent, 'trigger', window.I18N.t('ui.log.tacticFit', { name: tactic.name }));
        } else if (match._tacticMisfit) {
          const mf = match._tacticMisfit;
          if (mf.logKey) await log(onEvent, 'trigger', window.I18N.t(mf.logKey, { opp: opp.name }));
        }
        await dispatchTacticTrigger(tactic.tacticTrigger, match, squad, onEvent);
      }

      if (r === 4) {
        window.UI?.updateRoundIndicator?.(r);
        const htParts = [];
        if (match._htPressingBlocks > 0) htParts.push(window.I18N.t('ui.log.htSummaryPressing', { n: match._htPressingBlocks }));
        if (match._htCountersFired  > 0) htParts.push(window.I18N.t('ui.log.htSummaryCounters', { n: match._htCountersFired  }));
        if (match.momentumCounter  >= 2) htParts.push(window.I18N.t('ui.log.htSummaryMomentum'));
        if (htParts.length) await log(onEvent, 'decision', '  📋 ' + htParts.join(' · '));
        match._htPressingBlocks = 0;
        match._htCountersFired  = 0;
        match._halftimeScoreMe = match.scoreMe;
        match._halftimeScoreOpp = match.scoreOpp;

        // Halftime damps momentum 50% toward neutral — the break resets
        // emotional state. Teams don't come out feeling the same as they
        // left. Mirrors real-football halftime team-talk pacing.
        if (typeof match.matchMomentum === 'number') {
          match.matchMomentum = Math.round(match.matchMomentum * 0.5);
        }

        const halftime = await onEvent({ type: 'interrupt', phase: 'halftime', match });
        match.halftimeAction = halftime;
        applyDecision(match, halftime, 'halftime', window.state);
        for (const tag of (halftime.tags || [])) {
          if (!match.activeTacticTags.includes(tag)) match.activeTacticTags.push(tag);
        }
        await log(onEvent, 'round-header', window.I18N.t('ui.log.halftimeHeader'));
        recomputeTeamBuffs(match);
        await onEvent({ type: 'buffsUpdated', match });
        const buffAfter = match.teamBuffs;
        const buffStr = Object.entries(buffAfter)
          .filter(([k, v]) => Math.abs(v) >= 3 && ['offense','defense','tempo','vision','composure'].includes(k))
          .map(([k, v]) => `${k.substring(0,3).toUpperCase()} ${v>0?'+':''}${v}`)
          .join('  ');
        const personalStr = formatTacticPersonalMutations(match);
        await log(onEvent, 'decision interrupt-choice',
          window.I18N.t('ui.log.halftimeChoice', { name: halftime.name })
          + (buffStr ? `  [${buffStr}]` : '')
          + (personalStr ? `  ${personalStr}` : ''));
        await flushTacticFeedback(match, onEvent);
        for (const p of squad) delete p._speedBurstUsed;
        dispatchTrigger('halftime', { match });
        await flushTriggerLog(match, onEvent);
        await dispatchTacticTrigger(halftime.tacticTrigger, match, squad, onEvent);
      }

      if (r === 6) {
        window.UI?.updateRoundIndicator?.(r);
        const final = await onEvent({ type: 'interrupt', phase: 'final', match });
        match.finalAction = final;
        applyDecision(match, final, 'final', window.state);
        for (const tag of (final.tags || [])) {
          if (!match.activeTacticTags.includes(tag)) match.activeTacticTags.push(tag);
        }
        recomputeTeamBuffs(match);
        await onEvent({ type: 'buffsUpdated', match });
        const buffAfter = match.teamBuffs;
        const buffStr = Object.entries(buffAfter)
          .filter(([k, v]) => Math.abs(v) >= 3 && ['offense','defense','tempo','vision','composure'].includes(k))
          .map(([k, v]) => `${k.substring(0,3).toUpperCase()} ${v>0?'+':''}${v}`)
          .join('  ');
        const personalStr = formatTacticPersonalMutations(match);
        await log(onEvent, 'decision interrupt-choice',
          window.I18N.t('ui.log.finalChoice', { name: final.name })
          + (buffStr ? `  [${buffStr}]` : '')
          + (personalStr ? `  ${personalStr}` : ''));
        await flushTacticFeedback(match, onEvent);
        await dispatchTacticTrigger(final.tacticTrigger, match, squad, onEvent);
      }

      await log(onEvent, 'round-header', window.I18N.t('ui.log.roundHeader', { round: r }));
      if (r > 1) {
        const me = match.scoreMe, opp2 = match.scoreOpp;
        let introKey;
        if (r === 6)            introKey = 'ui.log.roundIntroFinal';
        else if (me > opp2)     introKey = 'ui.log.roundIntroLeading';
        else if (me < opp2)     introKey = 'ui.log.roundIntroTrailing';
        else                    introKey = 'ui.log.roundIntroTied';
        await log(onEvent, 'decision', pickLog(introKey, { me, opp: opp2 }));
      }

      // ── Card-play phase (feature-gated) ────────────────────────────────
      // Fires every round before any engine resolution. Flow layer opens
      // the hand UI, blocks on End-Turn, and returns. Card effects have
      // already been pushed onto buffLayers by the UI click handlers, so
      // we just need to make sure teamBuffs are recomputed afterward.
      if (CONFIG.cardsEnabled && KL.cards) {
        await onEvent({ type: 'interrupt', phase: 'round_card', match });
        recomputeTeamBuffs(match);
        await onEvent({ type: 'buffsUpdated', match });
      }

      dispatchTrigger('roundStart', { match });
      await flushTriggerLog(match, onEvent);

      // Opp-adaptation is already called earlier in this same round
      // (see the roundStart block above). This call was a leftover from
      // an earlier scaffold and has been removed to avoid double-firing
      // opp buff layers per round.
      recomputeTeamBuffs(match);

      if (match.memory) {
        match.memory.roundGoalCountMe = 0;
        match.memory.roundGoalCountOpp = 0;
        const myNew = evalStreakStates(match, false);
        const oppNew = evalStreakStates(match, true);
        await logStreakEntries(myNew, onEvent);
        await logStreakEntries(oppNew, onEvent);
      }

      if (typeof window.checkSituativeEvents === 'function') {
        await window.checkSituativeEvents(match, onEvent, window.state);
        await flushTriggerLog(match, onEvent);
      }

      if (match._pendingCardLog) {
        const info = match._pendingCardLog;
        match._pendingCardLog = null;
        const cls = info.type === 'red' ? 'card-red' : 'card-yellow';
        const key = info.type === 'red' ? 'ui.log.cardRed' : 'ui.log.cardYellow';
        await log(onEvent, cls, window.I18N.t(key, { name: info.name }));
      }

      if (match._eventImmediateAttack) {
        match._eventImmediateAttack = false;
        const bonus = match._eventImmediateAttackBonus || 0.18;
        match._eventImmediateAttackBonus = 0;
        await log(onEvent, 'trigger', window.I18N.t('ui.log.eventOppMistakeExploit'));
        await attemptAttack(match, squad, onEvent, { bonusAttack: bonus });
      }

      if (match.shadowStrikeTriggered) {
        await attemptAttack(match, squad, onEvent, { bonusAttack: 0.15 });
        match.shadowStrikeTriggered = false;
      }
      if (match.ghostChancePending) {
        await attemptAttack(match, squad, onEvent, { bonusAttack: 0.10 });
        match.ghostChancePending = false;
      }

      const effMy = averageEffectiveTeamStats(squad, match);
      const rb = match.opp._roundBuffs || {};
      const effOpp = {
        vision:    oppStat(match, 'vision'),
        composure: oppStat(match, 'composure'),
        tempo:     oppStat(match, 'tempo') + (rb.tempo || 0)
      };
      const myControl  = effMy.vision  + effMy.composure * 0.95 + effMy.tempo  * 0.60;
      const oppControl = effOpp.vision + effOpp.composure * 0.95 + effOpp.tempo * 0.60;
      const myPossRaw = myControl / (myControl + oppControl);
      const myPoss = clamp(myPossRaw, 0.25, 0.75);
      match._lastPoss = Math.round(myPoss * 100);
      match.stats.possAccum  = (match.stats.possAccum  || 0) + myPoss;
      match.stats.possRounds = (match.stats.possRounds || 0) + 1;

      let myAttacks = 1, oppAttacks = 1;
      if (match.possessionActive) {
        myAttacks = effMy.vision > oppStat(match, 'vision') + 8 ? 2 : 1;
        oppAttacks = 1;
      } else {
        if (myPoss >= 0.60) {
          if (rand() < (myPoss - 0.50) * 2.5) myAttacks = 2;
        } else if (myPoss <= 0.40) {
          if (rand() < (0.50 - myPoss) * 2.5) myAttacks = 0;
        }
        const oppPoss2 = 1 - myPoss;
        if (oppPoss2 >= 0.60) {
          if (rand() < (oppPoss2 - 0.50) * 2.5) oppAttacks = 2;
        } else if (oppPoss2 <= 0.40) {
          if (rand() < (0.50 - oppPoss2) * 2.5) oppAttacks = 0;
        }
      }

      const resistMap = CONFIG.tacticResistantArchetypes || {};
      const oppArch = match.opp?.archetype || null;

      const aggressiveResisted = resistMap.aggressive?.includes(oppArch);
      const pressingResisted   = resistMap.pressing?.includes(oppArch);

      if (match.pressingRoundsLeft > 0 && oppAttacks > 1 && !pressingResisted) {
        oppAttacks = 1;
        await log(onEvent, 'trigger', window.I18N.t('ui.log.pressingCap'));
      } else if (match.pressingRoundsLeft > 0 && pressingResisted && r === 1) {
        const key = 'ui.log.pressingResisted';
        const txt = window.I18N?.t?.(key, { opp: match.opp?.name || '' });
        await log(onEvent, 'trigger', (txt && txt !== key) ? txt : `⚠ ${match.opp?.name || 'opponent'} shrugs off the press — they thrive on it.`);
      }

      if (match.aggressiveRoundsLeft > 0) {
        if (!aggressiveResisted) {
          if (myAttacks === 2 && rand() < 0.40) {
            myAttacks = 3;
            await log(onEvent, 'trigger', window.I18N.t('ui.log.aggressiveThird'));
          }
        } else if (r === 1) {
          const key = 'ui.log.aggressiveResisted';
          const txt = window.I18N?.t?.(key, { opp: match.opp?.name || '' });
          await log(onEvent, 'trigger', (txt && txt !== key) ? txt : `⚠ ${match.opp?.name || 'opponent'} counter-presses — your aggression bounces back.`);
        }
        // Ermüdung durch Aggressivität wird direkt über match._fatigue unten
        // in diesem Block gebucht (0.022/Runde × fatigueMult).
      }

      if (match.aggressiveRoundsLeft > 0 || match.pressingRoundsLeft > 0) {
        const mf = match._tacticMisfit;
        const fatigueMult = mf?.effects?.fatigueMult || 1.0;
        match._fatigue = Math.min(0.30, (match._fatigue || 0) + 0.022 * fatigueMult);
      }

      if (match._tacticMisfit?.effects?.pressingCollapseRound
          && match.round === match._tacticMisfit.effects.pressingCollapseRound + 1
          && !match._pressingCollapsedLogged) {
        match._pressingCollapsedLogged = true;
        await log(onEvent, 'trigger', window.I18N.t('ui.log.misfitPressingCollapse'));
      }

      if      (myPoss >= 0.60) await log(onEvent, 'decision', pickLog('ui.log.possessionPressure',  { pct: Math.round(myPoss * 100) }));
      else if (myPoss <= 0.40) await log(onEvent, 'decision', pickLog('ui.log.possessionDominated', { pct: Math.round(myPoss * 100) }));

      for (let a = 0; a < myAttacks; a++) {
        await attemptAttack(match, squad, onEvent, a > 0 ? { bonusAttack: -0.05 } : {});
      }
      if (match.chainAttack) {
        match.chainAttack = false;
        await log(onEvent, 'trigger', window.I18N.t('ui.log.chainAttack'));
        await attemptAttack(match, squad, onEvent, { bonusAttack: 0.10 });
      }

      if (match._oppMoveQuickStrike) {
        match._oppMoveQuickStrike = false;
        const key = 'ui.log.oppMove.quickStrike';
        const txt = window.I18N?.t?.(key, { opp: match.opp?.name || '' });
        await log(onEvent, 'trigger', (txt && txt !== key) ? txt : `▸ ${match.opp?.name || 'Gegner'} — Blitzschuss!`);
        await attemptOppAttack(match, squad, onEvent);
      }

      const oppAttacksThisRound = oppAttacks;
      let oppAttacksFailed = 0;
      for (let a = 0; a < oppAttacks; a++) {
        const beforeOppScore = match.scoreOpp;
        await attemptOppAttack(match, squad, onEvent);
        if (match.scoreOpp === beforeOppScore) oppAttacksFailed++;
      }

      const extraAttacksFromMove = match._oppMoveExtraAttacks || 0;
      if (extraAttacksFromMove > 0) {
        match._oppMoveExtraAttacks = 0;
        for (let a = 0; a < extraAttacksFromMove; a++) {
          const key = 'ui.log.oppMove.extraAttack';
          const txt = window.I18N?.t?.(key, { opp: match.opp?.name || '' });
          await log(onEvent, 'trigger', (txt && txt !== key) ? txt : `▸ ${match.opp?.name || 'Gegner'} setzt nach!`);
          await attemptOppAttack(match, squad, onEvent);
        }
      }

      if (match._oppMoveCounterBlitzArmed && match.stats.oppSaves > (match._oppSavesBeforeRound || 0)) {
        match._oppMoveCounterBlitzArmed = false;
        const key = 'ui.log.oppMove.counterBlitz';
        const txt = window.I18N?.t?.(key, { opp: match.opp?.name || '' });
        await log(onEvent, 'trigger', (txt && txt !== key) ? txt : `▸ ${match.opp?.name || 'Gegner'} — Konter!`);
        await attemptOppAttack(match, squad, onEvent);
      }
      match._oppSavesBeforeRound = match.stats.oppSaves;

      {
        const deficit = match.scoreMe - match.scoreOpp;
        const rageThreshold = CONFIG.oppRageDeficitThreshold ?? 2;
        const rageMinRound  = CONFIG.oppRageMinRound ?? 3;
        const rageChance    = CONFIG.oppRageExtraAttackChance ?? 0.35;
        let extraTriggered  = false;
        let extraLabel      = match.opp?.name || 'Gegner';

        if (deficit >= rageThreshold && r >= rageMinRound && rand() < rageChance) {
          extraTriggered = true;
        }

        const rageTraitCtx = applyOppTraitEffect(match.opp, match, 'rageCheck', { deficit, extraAttack: false });
        for (const msg of (rageTraitCtx.logMsgs || [])) await log(onEvent, 'trigger', msg);
        if (rageTraitCtx.extraAttack) {
          extraTriggered = true;
          if (rageTraitCtx.rageName) extraLabel = rageTraitCtx.rageName;
        }

        if (extraTriggered) {
          const key = 'ui.log.oppRageAttack';
          const txt = window.I18N?.t?.(key, { team: extraLabel });
          const msg = (txt && txt !== key)
            ? txt
            : `🔥 ${extraLabel} — Rage-Offensive!`;
          await log(onEvent, 'trigger', msg);
          await attemptOppAttack(match, squad, onEvent);
        }
      }

      if (match.autoCounterRoundsLeft > 0 && oppAttacksThisRound >= 2 && oppAttacksFailed >= 2) {
        await log(onEvent, 'trigger', window.I18N.t('ui.log.doubleCounter'));
        await attemptAttack(match, squad, onEvent, { bonusAttack: 0.25 });
      }

      if (match._oppLuckyPending) {
        match._oppLuckyPending = false;
        await log(onEvent, 'trigger', window.I18N.t('ui.log.luckyDouble', { name: match.opp.name }));
        await attemptOppAttack(match, squad, onEvent);
      }

      if (match.counterPending || match.pouncePending) {
        match.counterPending = false;
        match.pouncePending = false;
        const lfForCounter = squad.find(p => p.role === 'LF');
        bumpPlayerStat(lfForCounter, 'counters', 1, match);

        const counterMisfitMult = match._tacticMisfit?.effects?.counterBonusMult || 1.0;
        const counterBonus = 0.15 * counterMisfitMult;
        if (counterMisfitMult < 1.0 && !match._counterMisfitLogged) {
          match._counterMisfitLogged = true;
          await log(onEvent, 'trigger', window.I18N.t('ui.log.misfitCounterStall'));
        }
        await log(onEvent, 'trigger', window.I18N.t('ui.log.counter'));
        await attemptAttack(match, squad, onEvent, { bonusAttack: counterBonus });
      }

      if (match.rallyReactionPending) {
        match.rallyReactionPending = false;
        await log(onEvent, 'trigger', window.I18N.t('ui.log.rallyReaction'));
        await attemptAttack(match, squad, onEvent, { bonusAttack: 0.12 });
      }

      if (match.flankRoundsLeft > 0) {
        const lf = squad.find(p => p.role === 'LF');
        if (lf) {
          const lfStats = computePlayerStats(lf, match);
          const flankChance = clamp(0.25 + (lfStats.tempo - oppStat(match, 'tempo')) * 0.006, 0.10, 0.65);
          if (rand() < flankChance) {
            await log(onEvent, 'trigger', window.I18N.t('ui.log.flankRun', { name: lf.name }));
            match.stats.myShots++;
            bumpPlayerStat(lf, 'shots');
            const flankScore = clamp(0.28 + lfStats.offense * 0.004, 0.15, 0.55);
            if (rand() < flankScore) {
              match.stats.myShotsOnTarget++;
              bumpPlayerStat(lf, 'shotsOnTarget');
              await recordOwnGoal(match, squad, onEvent, lf, { match, attackBonus: 0, scorer: lf });
            } else {
              const oppKeeper = pickOppKeeper(match.opp);
              match.stats.myShotsOnTarget++;
              bumpPlayerStat(lf, 'shotsOnTarget');
              recordAction(match, oppKeeper, 'save', true);
              bumpPlayerStat(oppKeeper, 'saves');
              match.stats.oppSaves = (match.stats.oppSaves || 0) + 1;
              await log(onEvent, '', `${pickLog('logs.oppKeeperSave', {
                scorer: lf.name, keeper: oppKeeper.name, team: match.opp.name
              })}`);
            }
          }
        }
      }

      if (CONFIG.oppMoveSystemEnabled !== false && KL.oppMoves) {
        // v0.50 — Soft-Counter: wenn der Spieler in dieser Runde eine
        // Defense- oder Counter-Karte gespielt hat UND teamBuffs.defense
        // signifikant ist (≥ 8), zählt der Opp-Move als "soft-defused".
        // Das Tracking zählt es als defusal, UND der Spieler sieht
        // Feedback im Log dass sein Defense-Spiel abgefangen hat.
        // Bedingung an beides (card + buff) verhindert Tracking bei
        // Karten die zwar defense-type sind aber keinen großen Buff
        // geben (z.B. nur einen directAction).
        const softDefuseActive = (
          match._oppMoveCurrent
          && match._lastDefenseRound === match.round
          && (match.teamBuffs?.defense || 0) >= 8
        );
        if (softDefuseActive) {
          const moveName = window.I18N?.t?.('ui.oppMove.' + match._oppMoveCurrent + '.name')
                        || match._oppMoveCurrent;
          const softKey = 'ui.log.oppMoveSoftDefused';
          const fallback = `  ✓ Defense-Puffer absorbiert ${moveName}.`;
          const softMsg = window.I18N?.t?.(softKey, { name: moveName });
          await log(onEvent, 'player-shield',
            (softMsg && softMsg !== softKey) ? softMsg : fallback);
        }
        KL.oppMoves.applyMoveOnResolve(match, onEvent);
        if (match._eventForceOppGoal) {
          const key = 'ui.log.oppMove.signatureGoal';
          const txt = window.I18N?.t?.(key, { opp: match.opp?.name || '' });
          await log(onEvent, 'trigger', (txt && txt !== key) ? txt : `▸ ${match.opp?.name || 'Gegner'} — Signature-Play durchgebrochen!`);
          await attemptOppAttack(match, squad, onEvent);
        }
      }

      if (match.guaranteedFirstBuildup !== undefined) {
        const hadControl = (myAttacks >= 1 && oppAttacksFailed >= oppAttacksThisRound * 0.5);
        if (hadControl) {
          match.momentumCounter = (match.momentumCounter || 0) + 1;
          if (match.momentumCounter >= 2) {
            match.nextBuildupBonus = (match.nextBuildupBonus || 0) + 0.15;
            if (match.momentumCounter === 2) await log(onEvent, 'trigger', window.I18N.t('ui.log.momentumBuilt'));
          }
        } else {
          match.momentumCounter = 0;
        }
      }

      // v52.2 — chaos: per-round re-roll of the +20/-10/-10 distribution.
      // The base layer applied at kickoff covers R1; here R2+ get fresh
      // dice each round so the tactic actually feels chaotic instead of
      // locking in a single random outcome at R1.
      if (match._chaosRerollActive && match.round <= 3) {
        const keys = ['offense', 'defense', 'tempo', 'vision', 'composure'];
        const shuffled = keys.slice().sort(() => Math.random() - 0.5);
        const stats = { [shuffled[0]]: 20, [shuffled[1]]: -10, [shuffled[2]]: -10 };
        match.buffLayers.push({
          source: 'chaos_reroll',
          range: [match.round, match.round],
          stats,
          special: null
        });
        match._chaosPick = { boost: shuffled[0], drain1: shuffled[1], drain2: shuffled[2] };
      }
      // v52.2 — clear the chaos flag once the effect window closes.
      // Without this, the flag stays true for R4-6 and the halftime/
      // final-phase zero-effect detector would see it as a non-empty
      // side-effect, suppressing legitimate "no effect applied"
      // warnings for other tactics picked later in the match.
      if (match._chaosRerollActive && match.round >= 3) {
        match._chaosRerollActive = false;
      }

      // Phase natural drift: if the round didn't trigger a transition
      // to a non-buildup phase (no goal, no save, no miss — e.g. a
      // quiet possession round), evolve based on the card play that
      // happened. High flow at round-end = possession phase. Lane open
      // at round-end = attack phase imminent.
      if (match.matchPhase === 'buildup') {
        const flow = match._cardFlow || 0;
        const laneOpen = !!match._cardLaneOpen;
        if (laneOpen) {
          match.matchPhase = 'attack';
          await logPhaseShift(match, onEvent, 'attack', 'laneOpen');
        } else if (flow >= 2) {
          match.matchPhase = 'possession';
          await logPhaseShift(match, onEvent, 'possession', 'possession');
        }
      }
      // Possession → attack if a lane's now open mid-match.
      if (match.matchPhase === 'possession' && match._cardLaneOpen) {
        match.matchPhase = 'attack';
        await logPhaseShift(match, onEvent, 'attack', 'laneOpen');
      }
      // Defensive recovery: after 2 rounds of defensive/recovery, drift
      // back to buildup so the player has a chance to reset.
      if ((match.matchPhase === 'defensive' || match.matchPhase === 'recovery')
          && match._phaseStuck >= 2) {
        match.matchPhase = 'buildup';
        await logPhaseShift(match, onEvent, 'buildup', 'defensive');
        match._phaseStuck = 0;
      }
      if (match.matchPhase === 'defensive' || match.matchPhase === 'recovery') {
        match._phaseStuck = (match._phaseStuck || 0) + 1;
      } else {
        match._phaseStuck = 0;
      }

      // v0.45 — Snapshot score timeline for end-of-match drama detection
      // (comeback if we were once ≥2 behind and ended winning; collapse
      // if ahead and ended losing; etc.). Pushed before the roundEnd
      // event so any consumer can already read the history.
      match.scoreTimeline.push({ round: r, me: match.scoreMe, opp: match.scoreOpp });

      await onEvent({ type: 'roundEnd', match });
      if (match.fastSkip !== 'test') await sleep(match.fastSkip ? 100 : 700);
    }

    let result;
    if      (match.scoreMe > match.scoreOpp) result = 'win';
    else if (match.scoreMe < match.scoreOpp) result = 'loss';
    else                                      result = 'draw';

    // Cup matches can't end in a draw — extratime first, penalties if still
    // tied. Flag comes from league.initCupBracket (opp._cupRound is set for
    // all cup bosses). League-finale ties go straight to penalties as before.
    const isCupMatch     = !!match.opp?._cupRound;
    const isLeagueFinale = match.opp.matchNumber === CONFIG.runLength;

    if (result === 'draw' && isCupMatch) {
      await runExtratime(match, squad, onEvent);
      if      (match.scoreMe > match.scoreOpp) result = 'win';
      else if (match.scoreMe < match.scoreOpp) result = 'loss';
      else {
        await log(onEvent, 'decision', window.I18N.t('ui.log.extratimeStillTied'));
        result = await runPenaltyShootout(match, squad, onEvent);
      }
    } else if (result === 'draw' && isLeagueFinale) {
      result = await runPenaltyShootout(match, squad, onEvent);
    }

    await log(onEvent, 'kickoff', window.I18N.t('ui.log.fullTime', {
      me: match.scoreMe, opp: match.scoreOpp
    }));
    // v0.45 — Dramaturgische Match-End-Narrative. Nur emitten wenn das
    // Match in eine memorable Kategorie fällt (Comeback, Collapse, 
    // Last-Minute, Shutout, Blowout, Nail-Biter, Goal-Fest). Bei 
    // "normalen" Matches returnt classifyMatchEnd null, dann läuft nur
    // der Standard-Epilog. Defensive in try/catch.
    try {
      const drama = window.KL?.narrative?.composeMatchEndDrama?.(match, result);
      if (drama) await log(onEvent, 'narrative', drama);
    } catch (_) { /* narrative is nice-to-have */ }
    const epilogueKey = result === 'win'  ? 'ui.log.epilogueWin'
                      : result === 'loss' ? 'ui.log.epilogueLoss'
                      :                      'ui.log.epilogueDraw';
    await log(onEvent, 'decision', pickLog(epilogueKey));
    await onEvent({ type: 'matchEnd', match, result });
    return { scoreMe: match.scoreMe, scoreOpp: match.scoreOpp, result, match };
  }

  KL.engine = {
    startMatch,
    attemptAttack,
    attemptOppAttack,
    recordOwnGoal,
    applyTactic,
    recomputeTeamBuffs,
    bumpPlayerStat,
    resetPlayerMatchStats,
    getTeamDisplayName,
    pickOppScorer,
    pickOppKeeper,
    pickOppPlaymaker,
    pickOppDefender,
    getOppPlayerStats,
    TACTIC_HANDLERS,
    dispatchTacticTrigger,
    initMatchMemory,
    getMemState,
    recordAction,
    evalStreakStates,
    applyStreakStatMod,
    isSuspended
  };

  Object.assign(window, {
    startMatch,
    attemptAttack,
    attemptOppAttack,
    recordOwnGoal,
    applyTactic,
    recomputeTeamBuffs,
    bumpPlayerStat,
    resetPlayerMatchStats,
    getTeamDisplayName,
    TACTIC_HANDLERS,
    dispatchTacticTrigger,
    applyStreakStatMod,
    getOppPlayerStats,
    isSuspended
  });
})();
