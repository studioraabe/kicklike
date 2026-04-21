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

  function recomputeTeamBuffs(match) {
    const r = match.round || 1;
    const prev = match.teamBuffs || {};
    const agg = { offense: 0, defense: 0, tempo: 0, vision: 0, composure: 0 };
    // Sticky keys (saveBonus, buildupMalus, tempoBonus) kommen aus Traits und
    // Events außerhalb des Layer-Systems. Die recompute darf sie nicht wipen.
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
    match.teamBuffs = agg;
  }

  function applyTactic(match, tactic, phase, squad, onEvent) {
    if (!tactic) return;

    const RANGES = { kickoff: [1, 3], halftime: [4, 6], final: [6, 6] };
    const range = RANGES[phase] || [1, 6];
    const layer = { source: tactic.id + '@' + phase, range, stats: {}, special: null };

    const deficit = Math.max(0, match.scoreOpp - match.scoreMe);
    const lead    = Math.max(0, match.scoreMe  - match.scoreOpp);
    const isLeading = lead > 0;

    if (phase === 'kickoff') {
      if (tactic.id === 'aggressive') {
        layer.stats = { offense: 18, defense: -8 };
        match.aggressiveRoundsLeft = 3;
      }
      if (tactic.id === 'defensive') { layer.stats = { defense: 18, offense: -8 }; }
      if (tactic.id === 'balanced') {
        layer.stats = { offense: 5, defense: 5, tempo: 5, vision: 5, composure: 5 };
        match.guaranteedFirstBuildup = true;
        match.momentumCounter = 0;
      }
      if (tactic.id === 'tempo') {
        layer.stats = { tempo: 22, composure: -6 };
        match.aggressiveRoundsLeft = 3;
      }
      if (tactic.id === 'pressing') {
        layer.stats = { defense: 14, tempo: 10 };
        match.pressingRoundsLeft = 3;
      }
      if (tactic.id === 'possession') {
        layer.stats = { vision: 18, composure: 10 };
        match.possessionActive = true;
      }
      if (tactic.id === 'counter') {
        layer.stats = { defense: 22, tempo: 10, offense: -6 };
        match.autoCounterRoundsLeft = 3;
      }
      if (tactic.id === 'flank_play') {
        layer.stats = { tempo: 14, offense: 14 };
        match.flankRoundsLeft = 3;
      }
      // NEW (this turn): 4 kickoff tactics.
      if (tactic.id === 'zone_defense') {
        // Structured defensive between pressing (active) and lockdown (extreme).
        layer.stats = { defense: 12, composure: 12, tempo: -5 };
      }
      if (tactic.id === 'quick_strike') {
        // Explosive R1 burst, then milder R2-3 all-rounder. Use a custom
        // layered approach: R1-only +30 off, plus a baseline +5/5/5/5/5 R1-3.
        layer.stats = { offense: 5, defense: 5, tempo: 5, vision: 5, composure: 5 };
        match.buffLayers.push({
          source: 'quick_strike_burst',
          range: [1, 1],
          stats: { offense: 25 },   // +30 total in R1 (5 base + 25 burst)
          special: null
        });
      }
      if (tactic.id === 'disciplined') {
        // +10 all stats R1-3 AND neutralizes negative form for this match.
        // The form-nullification flag is checked in stats.js:computePlayerStats.
        layer.stats = { offense: 10, defense: 10, tempo: 10, vision: 10, composure: 10 };
        match._formPenaltiesDisabled = true;
      }
      if (tactic.id === 'read_the_room') {
        // Cerebral open — no tempo component, rewards reading the opponent.
        layer.stats = { vision: 15, composure: 10, defense: 8 };
      }
    }

    if (phase === 'halftime') {
      if (tactic.id === 'push') {
        const offBoost = 20 + deficit * 8;
        layer.stats = { offense: offBoost, defense: -10 };
        match.aggressiveRoundsLeft = 3;
      }
      if (tactic.id === 'stabilize') {
        const defBoost = 18 + lead * 6;
        layer.stats = { defense: defBoost, composure: 10 };
        if (isLeading) match.pressingRoundsLeft = Math.max(match.pressingRoundsLeft, 3);
      }
      if (tactic.id === 'shift') {
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
        return;
      }
      if (tactic.id === 'shake_up') {
        // Worst-form player eats a permanent -5 across the board, team gets
        // +12 attack for the rest of the match. Symmetrical inverse of shift:
        // picks by the lowest score (form-weighted + focus-stat). If multiple
        // players share the low score the first one wins — stable ordering.
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
      }
      if (tactic.id === 'rally') {
        layer.special = 'rally';
        match.rallyReactionPending = false;
        match._rallyActive = true;
      }
      if (tactic.id === 'reset') { layer.stats = { offense: 7, defense: 7, tempo: 7, vision: 7, composure: 7 }; }
      if (tactic.id === 'counter_h') {
        layer.stats = { tempo: 24, defense: 14 };
        match.autoCounterRoundsLeft = 3;
      }
      if (tactic.id === 'high_press') {
        layer.stats = { defense: 22, composure: -6 };
        match.pressingRoundsLeft = 3;
      }
      if (tactic.id === 'vision_play') {
        layer.stats = { vision: 22, offense: 10 };
        match.possessionActive = true;
      }
      // NEW (this turn): 4 halftime tactics.
      if (tactic.id === 'double_down') {
        // Amplifies the CURRENT biggest team buff by +40%. Reads the match
        // state at the time of choice — momentum rewarded, not boilerplate.
        const buffs = match.teamBuffs || {};
        const keys = ['offense','defense','tempo','vision','composure'];
        let topKey = null, topVal = 0;
        for (const k of keys) {
          if (Math.abs(buffs[k] || 0) > Math.abs(topVal)) { topVal = buffs[k]; topKey = k; }
        }
        if (topKey && Math.abs(topVal) >= 5) {
          layer.stats = { [topKey]: Math.round(topVal * 0.4) };
        } else {
          // Nothing meaningful to amplify — fall back to a modest all-round bump.
          layer.stats = { offense: 6, defense: 6, composure: 6 };
        }
      }
      if (tactic.id === 'tactical_foul') {
        // +8 defense for you, -12 tempo for the opponent via _roundBuffs.
        // Debuff lasts 2 rounds (R4-5). Stored on opp._roundBuffs with a
        // countdown — see recomputeTeamBuffs / opp round tick for decay.
        layer.stats = { defense: 8 };
        match.opp._roundBuffs = match.opp._roundBuffs || {};
        match.opp._roundBuffs.tempo = (match.opp._roundBuffs.tempo || 0) - 12;
        match._tacticalFoulRoundsLeft = 2;
      }
      if (tactic.id === 'wing_overload') {
        // LF gets +20 off +20 tempo personal (stacks into the squad stats),
        // team pays with -6 defense. Personal boost applied directly so it
        // doesn't decay after R6.
        const lf = (match.squad || []).find(p => p.role === 'LF');
        if (lf?.stats) {
          lf.stats.offense = clamp((lf.stats.offense || 50) + 20, 20, 99);
          lf.stats.tempo   = clamp((lf.stats.tempo   || 50) + 20, 20, 99);
          match._wingOverloadSubject = lf;
        }
        layer.stats = { defense: -6 };
      }
      if (tactic.id === 'shell_defense') {
        // Conditional was already enforced (can only pick if drawing/leading).
        // Here the numbers just land as a strong defensive layer.
        layer.stats = { defense: 24, composure: 14, offense: -10 };
      }
    }

    if (phase === 'final') {
      if (tactic.condition) {
        layer.stats = tactic.condition(match);
      } else {
        if (tactic.id === 'keep_cool')   { layer.stats = { composure: 20, vision: 12 }; }
        if (tactic.id === 'long_ball')   { layer.stats = { offense: 28, vision: -10 }; }
        if (tactic.id === 'midfield')    { layer.stats = { vision: 20, tempo: 16, composure: 14 }; }
        if (tactic.id === 'sneaky')      { layer.stats = { defense: 28, tempo: 18, offense: -14 }; }
        if (tactic.id === 'final_press') { layer.stats = { tempo: 24, defense: 18, offense: -10 }; }
        if (tactic.id === 'rope_a_dope') {
          // R6-only defense bonanza with auto-counter on every enemy attack.
          // Final-phase layer already covers R6 by definition, so the range
          // restriction in the description is implicit in the phase.
          layer.stats = { defense: 35 };
          match.autoCounterRoundsLeft = Math.max(match.autoCounterRoundsLeft || 0, 3);
        }
      }
      if (tactic.id === 'hero_ball') {
        const heroSquad = match.squad || squad || [];
        const hero = heroSquad.slice().sort((a, b) => (b.form || 0) - (a.form || 0))[0] || pick(heroSquad);
        const focus = DATA.roles.find(r => r.id === hero.role)?.focusStat || 'offense';
        hero.stats[focus] = clamp(hero.stats[focus] + 30, 20, 99);
        match._hero = hero;
        return;
      }
      if (tactic.id === 'sacrifice') {
        const heroSquad = match.squad || squad || [];
        const victim = heroSquad.slice().sort((a, b) => (b.form || 0) - (a.form || 0))[0] || pick(heroSquad);
        const focus = DATA.roles.find(r => r.id === victim.role)?.focusStat || 'offense';
        victim.stats[focus] = Math.max(20, victim.stats[focus] - 15);
        match._sacrificeVictim = victim;
        layer.stats = { offense: 35 };
        match.buffLayers.push(layer);
        recomputeTeamBuffs(match);
        return;
      }
      if (tactic.id === 'gamble') {
        // True 50/50 coin flip. Win: +35 team offense for R6. Lose: -15 to
        // every stat. Logged so the player knows which way it broke — a
        // silent flip would feel unfair regardless of outcome.
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
      }
      if (tactic.id === 'lone_wolf') {
        // ST gets a huge personal boost; the rest of the team takes a small
        // attack hit to represent play forced through one player. Stored on
        // the player directly, not a layer, so it's permanent for the match.
        const st = (match.squad || squad || []).find(p => p.role === 'ST');
        if (st?.stats) {
          st.stats.offense = clamp((st.stats.offense || 50) + 40, 20, 99);
          st.stats.tempo   = clamp((st.stats.tempo   || 50) + 20, 20, 99);
          match._loneWolfSubject = st;
        }
        layer.stats = { offense: -6 };
      }
      if (tactic.id === 'fortress') {
        // TW and VT both pick up +40 defense; team gives up -20 attack.
        const tw = (match.squad || squad || []).find(p => p.role === 'TW');
        const vt = (match.squad || squad || []).find(p => p.role === 'VT');
        if (tw?.stats) tw.stats.defense = clamp((tw.stats.defense || 50) + 40, 20, 99);
        if (vt?.stats) vt.stats.defense = clamp((vt.stats.defense || 50) + 40, 20, 99);
        match._fortressApplied = true;
        layer.stats = { offense: -20 };
      }
      if (tactic.id === 'masterclass') {
        // PM gets a personal upgrade (+30 vision, +20 composure) and the
        // whole team picks up +12 offense from cleaner distribution.
        const pm = (match.squad || squad || []).find(p => p.role === 'PM');
        if (pm?.stats) {
          pm.stats.vision    = clamp((pm.stats.vision    || 50) + 30, 20, 99);
          pm.stats.composure = clamp((pm.stats.composure || 50) + 20, 20, 99);
          match._masterclassSubject = pm;
        }
        layer.stats = { offense: 12 };
      }
      // NEW (this turn): 4 final tactics.
      if (tactic.id === 'set_piece') {
        // Narrow specialization: the +25 attack only lands on successful
        // buildups. Engine gates this in the buildup→shot pipeline via
        // match._setPieceBonus, which is consumed in the shot-bonus step.
        // No layer.stats — the effect is gated, not team-wide.
        match._setPieceBonus = 0.25;   // +25% attackBonus on successful buildups
      }
      if (tactic.id === 'siege_mode') {
        // Clean rounded late-game pressure — no penalties, no special gates.
        layer.stats = { offense: 20, tempo: 10, vision: 10 };
      }
      if (tactic.id === 'bus_and_bike') {
        // Defensive anchor with counter-punch: +18 def; after any save or
        // successful defensive stop, next own attack gets +30 offense.
        // Flag is consumed in engine attack-resolution.
        layer.stats = { defense: 18 };
        match._busAndBikeActive = true;
        match._busAndBikeNextAttackBonus = 0;   // populated by save/stop hooks
      }
      if (tactic.id === 'face_pressure') {
        // Clutch nerves: +25 composure team-wide, opp shot accuracy -8%.
        // The opp penalty is applied at shot-resolution via _oppShotMalus.
        layer.stats = { composure: 25 };
        match._oppShotMalus = Math.max(match._oppShotMalus || 0, 0.08);
        match._oppShotMalusRounds = Math.max(match._oppShotMalusRounds || 0, 1);
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
  }

  async function recordOwnGoal(match, squad, onEvent, scorer, ctx) {
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

    if (ctx._synergyPair && ctx._synergyPair.a && ctx._synergyPair.b && !suffix) {
      const combo = pickLog('ui.log.synergyCombo', {
        a: ctx._synergyPair.a.name, b: ctx._synergyPair.b.name
      });
      await log(onEvent, 'goal-me', window.I18N.t('ui.log.ownGoalCombo', {
        name: scorer.name, combo, me: match.scoreMe, opp: match.scoreOpp
      }));
    } else {
      await log(onEvent, 'goal-me', window.I18N.t('ui.log.ownGoal', {
        name: scorer.name, suffix, me: match.scoreMe, opp: match.scoreOpp
      }));
    }

    dispatchTrigger('ownGoal', { ...ctx, scorer });
    await flushTriggerLog(match, onEvent);
  }

  async function attemptAttack(match, squad, onEvent, extra = {}) {
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

    const buildupChance = clamp(
      0.27
      + (pmStats.vision - 55) * CONFIG.buildupVisionScale
      + (pmStats.composure - 55) * 0.003
      + (teamTempo - ctx.match.opp.stats.tempo) * 0.0015
      + (match.nextBuildupBonus || 0)
      + ctx.attackBonus * 0.5
      - (oppPressCtx.malus || 0)
      - misfitBuildupMalus
      - fatigueBuildupMalus
      - (match.teamBuffs?.buildupMalus || 0),
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
      await log(onEvent, '', `R${match.round}: ${pickLog('logs.ownBuildFail', {
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
    await log(onEvent, '', `R${match.round}: ${pickLog('logs.ownBuildSuccess', {
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
      ? (teamComposure - ctx.match.opp.stats.composure) * 0.0015
      : 0;
    const visionAdvantage = (teamVision - ctx.match.opp.stats.vision) * 0.001;

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

    await log(onEvent, '', `R${match.round}: ${pickLog('logs.chance', { scorer: scorer.name })}`);

    match.stats.myShots++;
    bumpPlayerStat(scorer, 'shots');

    const baseScoringChance = clamp(
      CONFIG.attackBase
      + (teamOffense - ctx.oppAvgDefense) * CONFIG.attackStatScale
      + (teamTempo > ctx.match.opp.stats.tempo ? CONFIG.tempoAdvantage : -CONFIG.tempoAdvantage * 0.5)
      + composureAdvantage
      + visionAdvantage
      + ctx.attackBonus,
      0.05, 0.90
    );

    const oppKeeper = pickOppKeeper(match.opp);
    const oppPMStats = getOppPlayerStats(pickOppPlaymaker(match.opp), match);
    const oppVTStats = getOppPlayerStats(pickOppDefender(match.opp), match);
    const oppKeeperStats = getOppPlayerStats(oppKeeper, match);
    const shotOnTargetChance = clamp(baseScoringChance + 0.18, 0.12, 0.97);

    if (rand() >= shotOnTargetChance) {
      recordAction(match, scorer, 'miss', false);
      await log(onEvent, '', `R${match.round}: ${pickLog('logs.miss', { scorer: scorer.name })}`);
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
    const oppBlock = (oppKeeperStats.defense || match.opp.stats.defense) * 0.72
      + (oppVTStats.defense || match.opp.stats.defense) * 0.28;

    const oppSaveCtx = applyOppTraitEffect(match.opp, match, 'savePenalty', { penalty: 0 });
    for (const msg of (oppSaveCtx.logMsgs || [])) await log(onEvent, 'trigger', msg);

    let oppSaveChance = 0.40
      + (oppBlock - shotPressure) * CONFIG.defenseStatScale
      + composureSaveBonus
      + visionSaveBonus
      + (oppSaveCtx.penalty || 0);
    if (match.round <= (match._oppKeeperRattledUntilRound || 0)) {
      oppSaveChance -= (match._oppKeeperRattledBonus || 0);
    }
    oppSaveChance = clamp(oppSaveChance, 0.08, 0.86);

    if (rand() < oppSaveChance) {
      recordAction(match, oppKeeper, 'save', true);
      bumpPlayerStat(oppKeeper, 'saves');
      await log(onEvent, 'opp-save', `R${match.round}: ${pickLog('logs.oppKeeperSave', {
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
      0.35 + (opp.stats.vision - 55) * 0.005 - pressMalus - eventOppMalus,
      0.10, 0.85
    );
    match.stats.oppBuildups++;

    if (rand() > oppBuildup) {
      recordAction(match, oppPM, 'buildup_fail', true);
      await log(onEvent, '', `R${match.round}: ${pickLog('logs.oppBuildFail', {
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

    const oppOff = (opp.stats.offense + (rb.offense || 0)) + (opp.stats.tempo + (rb.tempo || 0)) * 0.2;
    // vtStats.defense und twStats.defense haben teamBuffs.defense schon über
    // computePlayerStats eingerechnet — nicht nochmal addieren.
    const myDef  = vtStats.defense * 0.45 + twStats.defense * 0.55;
    await log(onEvent, '', `R${match.round}: ${pickLog('logs.oppApproach', {
      opp: oppST.name, team: opp.name, oppPM: oppPM.name
    })}`);

    match.stats.oppShots++;
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
    const composureDefBonus = (myComposure - opp.stats.composure) * 0.001;

    const pmForDef = squad.find(p => p.role === 'PM');
    const pmStatsForDef = pmForDef ? computePlayerStats(pmForDef, match) : { vision: 50 };
    const myVisionForDef = (vtStats.vision || 50) * 0.35
      + (twStats.vision || 50) * 0.40
      + (pmStatsForDef.vision || 50) * 0.25;
    const visionDefBonus = (myVisionForDef - opp.stats.vision) * 0.002;

    let saveChance = 0.50
      + (myDef - oppOff) * CONFIG.defenseStatScale
      + composureDefBonus
      + visionDefBonus
      + (match.nextSaveBonus || 0)
      - pressBreakBonus;
    if (match.teamBuffs?.saveBonus) saveChance += match.teamBuffs.saveBonus;

    const oppShotCtx = applyOppTraitEffect(opp, match, 'oppShotChance', { bonus: 0, shooter: oppST });
    for (const msg of (oppShotCtx.logMsgs || [])) await log(onEvent, 'trigger', msg);

    const oppSaveCtx = applyOppTraitEffect(opp, match, 'savePenalty', { penalty: 0 });
    for (const msg of (oppSaveCtx.logMsgs || [])) await log(onEvent, 'trigger', msg);

    saveChance -= (oppShotCtx.bonus || 0);
    saveChance -= (oppSaveCtx.penalty || 0);

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
      if (match._busAndBikeActive) match._busAndBikeNextAttackBonus = 0.30;
      await log(onEvent, '', `R${match.round}: ${pickLog('logs.save', {
        tw: tw?.name || 'Keeper', vt: vt?.name || 'Defense',
        shooter: oppST.name, team: opp.name
      })}`);
      dispatchTrigger('postSave', { match });
      await flushTriggerLog(match, onEvent);
    } else {
      match.stats.oppShotsOnTarget++;
      recordAction(match, oppST, 'goal', true);
      recordAction(match, tw, 'concede', false);
      if (match.memory) {
        match.memory.consecutiveConceded = (match.memory.consecutiveConceded || 0) + 1;
        match.memory.consecutiveScored = 0;
        match.memory.lastRoundConceded = match.round;
        match.memory.roundGoalCountOpp = (match.memory.roundGoalCountOpp || 0) + 1;
      }
      dispatchTrigger('oppGoal', ctx);
      await flushTriggerLog(match, onEvent);
      if (ctx.oppGoalCancelled) return;

      match.scoreOpp += 1;
      bumpPlayerStat(tw, 'goalsConceded');
      bumpPlayerStat(vt, 'goalsConceded');

      if (match.finalAction?.id === 'all_in' && match.round === 6) {
        await log(onEvent, 'decision', pickLog('ui.log.allInExposed', { opp: oppST.name, team: opp.name }));
      } else if ((match.teamBuffs?.offense || 0) > 20 && (match.teamBuffs?.defense || 0) < -8) {
        await log(onEvent, 'decision', pickLog('ui.log.attackingExposed', { opp: oppST.name, team: opp.name }));
      } else if (match.aggressiveRoundsLeft > 0 && rand() < 0.50) {
        await log(onEvent, 'decision', pickLog('ui.log.aggressiveExposed', { opp: oppST.name, team: opp.name }));
      }

      await log(onEvent, 'goal-opp', window.I18N.t('ui.log.oppGoal', {
        name: oppST.name, team: opp.name, me: match.scoreMe, opp: match.scoreOpp
      }));

      if (match._rallyActive) match.rallyReactionPending = true;
      dispatchTrigger('afterOppGoal', { match });
      await flushTriggerLog(match, onEvent);
    }
  }

  async function runPenaltyShootout(match, squad, onEvent) {
    await log(onEvent, 'kickoff', window.I18N.t('ui.log.penaltiesIntro', { me: match.scoreMe, opp: match.scoreOpp }));
    await log(onEvent, 'decision', window.I18N.t('ui.log.penaltiesTitle'));

    const myComposure = squad.reduce((s, p) => s + (p.stats.composure || 0), 0) / squad.length;
    const oppComposure = match.opp.stats.composure || 60;
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

    for (let r = 1; r <= CONFIG.rounds; r++) {
      match.round = r;
      match.triggersThisRound = 0;
      recomputeTeamBuffs(match);

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
        await log(onEvent, 'decision',
          window.I18N.t('ui.log.kickoffChoice', { name: tactic.name }) + (buffStr ? `  [${buffStr}]` : ''));
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
        await log(onEvent, 'decision',
          window.I18N.t('ui.log.halftimeChoice', { name: halftime.name }) + (buffStr ? `  [${buffStr}]` : ''));
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
        await log(onEvent, 'decision',
          window.I18N.t('ui.log.finalChoice', { name: final.name }) + (buffStr ? `  [${buffStr}]` : ''));
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

      dispatchTrigger('roundStart', { match });
      await flushTriggerLog(match, onEvent);

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
        vision:    match.opp.stats.vision,
        composure: match.opp.stats.composure,
        tempo:     match.opp.stats.tempo + (rb.tempo || 0)
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
        myAttacks = effMy.vision > match.opp.stats.vision + 8 ? 2 : 1;
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

      if (match.pressingRoundsLeft > 0 && oppAttacks > 1) {
        oppAttacks = 1;
        await log(onEvent, 'trigger', window.I18N.t('ui.log.pressingCap'));
      }

      if (match.aggressiveRoundsLeft > 0) {
        if (myAttacks === 2 && rand() < 0.40) {
          myAttacks = 3;
          await log(onEvent, 'trigger', window.I18N.t('ui.log.aggressiveThird'));
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

      const oppAttacksThisRound = oppAttacks;
      let oppAttacksFailed = 0;
      for (let a = 0; a < oppAttacks; a++) {
        const beforeOppScore = match.scoreOpp;
        await attemptOppAttack(match, squad, onEvent);
        if (match.scoreOpp === beforeOppScore) oppAttacksFailed++;
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
          const flankChance = clamp(0.25 + (lfStats.tempo - match.opp.stats.tempo) * 0.006, 0.10, 0.65);
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
              await log(onEvent, '', `R${match.round}: ${pickLog('logs.oppKeeperSave', {
                scorer: lf.name, keeper: oppKeeper.name, team: match.opp.name
              })}`);
            }
          }
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

      // tactical_foul: Gegner-Tempo-Debuff läuft 2 Runden, dann Reset.
      // Ohne das Reset bliebe der Debuff permanent, weil _roundBuffs nicht
      // automatisch verfällt. Nur die Tempo-Komponente zurücksetzen —
      // andere _roundBuffs-Einträge (z.B. boss_aura) dürfen nicht berührt werden.
      if (match._tacticalFoulRoundsLeft > 0) {
        match._tacticalFoulRoundsLeft--;
        if (match._tacticalFoulRoundsLeft <= 0 && match.opp._roundBuffs) {
          match.opp._roundBuffs.tempo = (match.opp._roundBuffs.tempo || 0) + 12;
          // Schlussergebnis: per Saldo 0 auf tempo aus dieser Tactic.
        }
      }

      await onEvent({ type: 'roundEnd', match });
      if (match.fastSkip !== 'test') await sleep(match.fastSkip ? 100 : 700);
    }

    let result;
    if      (match.scoreMe > match.scoreOpp) result = 'win';
    else if (match.scoreMe < match.scoreOpp) result = 'loss';
    else                                      result = 'draw';

    const isLastMatch = match.opp.matchNumber === CONFIG.runLength;
    if (result === 'draw' && isLastMatch) {
      result = await runPenaltyShootout(match, squad, onEvent);
    }

    await log(onEvent, 'kickoff', window.I18N.t('ui.log.fullTime', {
      me: match.scoreMe, opp: match.scoreOpp
    }));
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
