(() => {
  const KL = window.KL;
  const { DATA } = KL.config;

  const TRAIT_POWER_VALUES = {
    titan_stand:     14, fortress_aura:   16, clutch_save:     10,
    sweep_assist:     6, laser_pass:       8, offside_trap:    12,
    acrobat_parry:    7, wall_effect:     14, nine_lives:      22,

    intimidate:       7, bulldoze:        10, captain_boost:   14,
    blood_scent:      9, hard_tackle:     12, whirlwind_rush:  10,
    build_from_back: 10, late_bloom:      14, read_game:       18,

    metronome_tempo: 11, killer_pass:     13, whisper_boost:   12,
    hunter_press:    10, gegenpress_steal:11, shadow_strike:    9,
    maestro_combo:   18, chess_predict:   20, symphony_pass:   10,

    speed_burst:     12, launch_sequence:  9, unstoppable_run: 10,
    dribble_chain:   11, street_trick:     9, nutmeg:          13,
    ironman_stamina: 10, dynamo_power:    10, never_stop:      12,

    silent_killer:   12, predator_pounce: 16, opportunity:      8,
    cannon_blast:    11, header_power:    13, brick_hold:       8,
    ghost_run:       10, puzzle_connect:  14, chameleon_adapt: 11,

    god_mode:        28, clutch_dna:      16, field_general:   25,
    unbreakable:     24, big_game:        14, conductor:       18,
    phoenix:         14, ice_in_veins:     8
  };

  const OPP_TRAIT_POWER_VALUES = {
    sturm:       6, riegel:      5, konter_opp:  10, presser_opp: 8,
    clutch_opp:  9, lucky:       6, ironwall:    5, sniper:      8
  };

  function estimatePlayerTraitPower(player) {
    if (!player?.traits?.length) return 0;
    let total = 0;
    for (const t of player.traits) {
      if (TRAIT_POWER_VALUES[t] != null) {
        total += TRAIT_POWER_VALUES[t];
        continue;
      }
      if (t.endsWith('_mastery')) {
        const parentId = t.replace(/_mastery$/, '');
        const evo = DATA.evoDetails?.[parentId];
        const parentTrait = evo?.parentTrait;
        const parentValue = parentTrait ? TRAIT_POWER_VALUES[parentTrait] : null;
        if (parentValue != null) {
          total += Math.round(parentValue * 1.3);
          continue;
        }
      }
      total += 8;
    }
    return total;
  }

  function estimateSquadTraitPower(squad) {
    if (!squad?.length) return 0;
    return squad.reduce((sum, p) => sum + estimatePlayerTraitPower(p), 0);
  }

  function estimateOppTraitPower(opp) {
    if (!opp?.traits?.length) return 0;
    return opp.traits.reduce((sum, t) => sum + (OPP_TRAIT_POWER_VALUES[t] || 5), 0);
  }

  function buildMatchupIntel(squad, opp) {
    if (!squad?.length || !opp) return null;

    const { teamTotalPower, aggregateTeamStats } = KL.stats;

    const myBasePower  = teamTotalPower(squad);
    const myTraitPower = estimateSquadTraitPower(squad);
    const myEffectivePower = myBasePower + myTraitPower;

    const oppBasePower  = opp.power || Object.values(opp.stats).reduce((a, b) => a + b, 0);
    const oppTraitPower = estimateOppTraitPower(opp);
    const oppEffectivePower = oppBasePower + oppTraitPower;

    const advantages = [];
    const warnings = [];

    const myTraitSet = new Set(squad.flatMap(p => p.traits || []));
    const oppTraits  = new Set(opp.traits || []);
    const holders    = opp.traitHolders || {};
    const isBoss = opp.isBoss;

    const T = window.I18N.t.bind(window.I18N);

    const holderName = (traitId, fallback) => holders[traitId]?.name || fallback || opp.name;

    if (myTraitSet.has('predator_pounce')
        && (oppTraits.has('presser_opp') || opp.special?.id === 'offensive')) {
      const p = squad.find(p => p.traits?.includes('predator_pounce'));
      advantages.push({ text: T('ui.intel.advPredatorVsPresser', { name: p?.name || 'ST' }), weight: 3 });
    }

    if (myTraitSet.has('late_bloom')) {
      const p = squad.find(p => p.traits?.includes('late_bloom'));
      advantages.push({ text: T('ui.intel.advLateBloom', { name: p?.name || 'VT' }), weight: 2 });
    }

    if ((myTraitSet.has('clutch_save') || myTraitSet.has('clutch_dna')) && oppTraits.has('clutch_opp')) {
      advantages.push({ text: T('ui.intel.advClutchMatchup'), weight: 2 });
    }

    if (isBoss && myTraitSet.has('big_game')) {
      const p = squad.find(p => p.traits?.includes('big_game'));
      advantages.push({ text: T('ui.intel.advBigGame', { name: p?.name || '?' }), weight: 3 });
    }

    if (myTraitSet.has('field_general')) {
      advantages.push({ text: T('ui.intel.advFieldGeneral'), weight: 3 });
    }

    if ((myTraitSet.has('fortress_aura') || myTraitSet.has('wall_effect') || myTraitSet.has('nine_lives'))
        && (opp.special?.id === 'offensive' || oppTraits.has('sniper'))) {
      advantages.push({ text: T('ui.intel.advKeeperWall'), weight: 2 });
    }

    const lf = squad.find(p => p.role === 'LF');
    if (lf && lf.stats.tempo >= opp.stats.tempo + 15) {
      advantages.push({ text: T('ui.intel.advTempo', { name: lf.name }), weight: 2 });
    }

    if (oppTraits.has('sniper')) {
      warnings.push({ text: T('ui.intel.warnSniper', { name: holderName('sniper') }), weight: 3 });
    }
    if (oppTraits.has('konter_opp')) {
      warnings.push({ text: T('ui.intel.warnCounter', { name: holderName('konter_opp') }), weight: 3 });
    }
    if (oppTraits.has('ironwall')) {
      warnings.push({ text: T('ui.intel.warnIronwall', { name: holderName('ironwall') }), weight: 2 });
    }

    if (oppTraits.has('clutch_opp') && !myTraitSet.has('clutch_save') && !myTraitSet.has('clutch_dna')) {
      warnings.push({ text: T('ui.intel.warnClutchUnanswered', { name: holderName('clutch_opp') }), weight: 3 });
    }

    if (oppTraits.has('presser_opp')) {
      const pm = squad.find(p => p.role === 'PM');
      if (!pm || pm.stats.vision < 65) {
        warnings.push({ text: T('ui.intel.warnPresserNoVision', { name: holderName('presser_opp') }), weight: 3 });
      }
    }

    if (oppBasePower > myBasePower + 100) {
      warnings.push({ text: T('ui.intel.warnStatGap', { diff: oppBasePower - myBasePower }), weight: 3 });
    }

    if (isBoss) warnings.push({ text: T('ui.intel.warnBoss'), weight: 1 });

    advantages.sort((a, b) => b.weight - a.weight);
    warnings.sort(   (a, b) => b.weight - a.weight);

    const myAgg = aggregateTeamStats(squad);
    const statComparisons = ['offense', 'defense', 'tempo', 'vision', 'composure'].map(k => ({
      stat: k,
      me:   myAgg[k],
      opp:  opp.stats[k] || 0,
      diff: myAgg[k] - (opp.stats[k] || 0)
    }));

    return {
      myBasePower, myTraitPower, myEffectivePower,
      oppBasePower, oppTraitPower, oppEffectivePower,
      powerDelta: myEffectivePower - oppEffectivePower,
      advantages: advantages.slice(0, 3),
      warnings:   warnings.slice(0, 3),
      statComparisons
    };
  }

  // Destilliert das volle Intel auf EINEN Entscheidungs-Satz plus ein
  // qualitatives Power-Verdict. Für den neuen Hub-Screen.
  // Context overrides Power-Delta: Boss fights, hot streaks, loss-streak-risk
  // und Early-Run-Mismatches bekommen eigene Labels.
  function buildIntelOneLiner(intel, ctx = {}) {
    if (!intel) return null;
    const T = window.I18N.t.bind(window.I18N);

    const delta = intel.powerDelta;
    const {
      isBoss = false,
      teamFormAvg = 0,
      lossStreak = 0,
      matchNumber = 0
    } = ctx;

    let verdict, tone;

    // Kontext hat Vorrang vor Power-Delta
    if (isBoss) {
      verdict = T('ui.verdict.bossFight');
      tone = 'warn';
    } else if (lossStreak >= 2) {
      verdict = T('ui.verdict.riskyStreak');
      tone = 'warn';
    } else if (teamFormAvg >= 1.5 && delta > -40) {
      verdict = T('ui.verdict.rideForm');
      tone = 'good';
    } else if (matchNumber <= 1) {
      verdict = T('ui.verdict.newRival');
      tone = 'even';
    } else if (Math.abs(delta) <= 25) {
      verdict = T('ui.verdict.close');
      tone = 'even';
    } else if (delta >= 60) {
      verdict = T('ui.verdict.strongEdge');
      tone = 'good';
    } else if (delta > 0) {
      verdict = T('ui.verdict.favored');
      tone = 'good';
    } else if (delta >= -90) {
      // Auch bei Rückstand positiv rahmen wenn Traits im Team sind
      verdict = T('ui.verdict.trustTraits');
      tone = 'even';
    } else {
      verdict = T('ui.verdict.tough');
      tone = 'warn';
    }

    const topWarn = intel.warnings[0];
    const topAdv  = intel.advantages[0];

    let headline;
    if (topWarn && topAdv) {
      headline = T('ui.intel.headlineBoth', { adv: topAdv.text, warn: topWarn.text });
    } else if (topWarn) {
      headline = topWarn.text;
    } else if (topAdv) {
      headline = topAdv.text;
    } else {
      headline = T('ui.intel.headlineNothing');
    }

    return { verdict, tone, delta, headline, hasThreat: !!topWarn, hasEdge: !!topAdv };
  }

  // ─── Matchup Scorecard ────────────────────────────────────────────────────
  // Replaces the Win/Draw/Loss % bar on the match hub. The probability
  // estimator is structurally blind to traits and produces numbers like
  // "2% win" for matches the player routinely wins — removing it in favour
  // of a multi-dimensional scorecard: threat/edge (0-5 chips), five attribute
  // split-bars, and a trait-activity line. No single number claims to predict
  // the outcome.
  function buildMatchupScorecard(squad, opp, ctx = {}) {
    const intel = buildMatchupIntel(squad, opp);
    if (!intel) return null;

    // Threat & Edge — combine intel weights with raw power delta.
    // Warnings/advantages are already weighted 1-3, typical sum 2-8.
    // Power delta adds up to ~3 more "points" per 100 delta, so a huge
    // power mismatch still shows up even without specific trait warnings.
    const warnPts = intel.warnings.reduce((s, w) => s + (w.weight || 1), 0);
    const advPts  = intel.advantages.reduce((s, a) => s + (a.weight || 1), 0);

    const delta = intel.powerDelta || 0;
    const threatRaw = warnPts + Math.max(0, -delta) / 35;
    const edgeRaw   = advPts  + Math.max(0,  delta) / 35;

    // Map to 0-5 chips. Thresholds chosen so a plain matchup lands around
    // 1-2 chips, a clearly dominant matchup 3-4, boss/mismatch 4-5.
    const toChips = (pts) => Math.max(0, Math.min(5, Math.round(pts / 1.6)));
    const threat = toChips(threatRaw);
    const edge   = toChips(edgeRaw);

    // Trait activity — estimated based on observed ~50-120 triggers per match
    // correlated with squad trait power (~60-90 range). Scale chosen so typical
    // squads read ~60-120 expected triggers. Not a contract with the engine,
    // just a readable approximation for the hub.
    const traitMultiplier = 1.4;
    const triggersExpected = Math.round(intel.myTraitPower * traitMultiplier);

    // Passive-trait roster count — how many of the player's traits affect
    // stat compute (vs one-shot event traits). Helps player see "this team
    // plays through its passives" vs "active triggers only".
    const passiveTraitIds = new Set([
      'fortress_aura', 'intimidate', 'captain_boost', 'blood_scent',
      'read_game', 'late_bloom', 'metronome_tempo', 'whisper_boost',
      'maestro_combo', 'ironman_stamina', 'never_stop', 'big_game',
      'conductor', 'ice_in_veins', 'god_mode', 'field_general', 'unbreakable'
    ]);
    let passiveCount = 0;
    for (const p of squad) {
      for (const t of (p.traits || [])) {
        if (passiveTraitIds.has(t)) passiveCount++;
      }
    }

    return {
      threat,
      edge,
      topThreat:  intel.warnings[0]?.text || null,
      topEdge:    intel.advantages[0]?.text || null,
      stats:      intel.statComparisons,      // [{ stat, me, opp, diff }] x5
      triggersExpected,
      passiveCount,
      powerDelta: delta
    };
  }

  function buildMatchTraitReport(match) {
    if (!match?._traitFireCounts) return [];
    const fires = match._traitFireCounts;
    const squad = match.squad || [];

    const traitOwners = {};
    for (const p of squad) {
      for (const t of (p.traits || [])) {
        if (!traitOwners[t]) traitOwners[t] = p;
      }
    }

    const report = [];
    const passiveMap = match._traitPassiveMap || {};
    for (const [traitId, count] of Object.entries(fires)) {
      if (count <= 0) continue;

      const baseValue = TRAIT_POWER_VALUES[traitId]
        || (traitId.endsWith('_mastery')
            ? Math.round((TRAIT_POWER_VALUES[DATA.evoDetails[traitId.replace(/_mastery$/, '')]?.parentTrait] || 8) * 1.3)
            : 8);
      const isPassive = !!passiveMap[traitId];
      // Passive Traits werden bereits auf 1 Fire/Match gecappt — der Impact
      // entspricht dem Basiswert direkt. Aktive Traits: Pro-Fire-Wert × Count.
      const perFireValue = Math.max(2, Math.round(baseValue / 3));
      const estimatedImpact = isPassive ? baseValue : count * perFireValue;

      const traitDef = DATA.traits[traitId];
      const traitName = traitDef?.name || traitId;
      const owner = traitOwners[traitId];

      report.push({
        traitId,
        traitName,
        playerName: owner?.name || '—',
        role:       owner?.role || '',
        count,
        estimatedImpact,
        isPassive
      });
    }

    report.sort((a, b) => b.estimatedImpact - a.estimatedImpact);
    return report;
  }

  // ─── Win Probability ──────────────────────────────────────────────────────
  // Analytische Schätzung, kalibriert gegen Monte-Carlo der Engine-Logik.
  // Eingang: aggregierte Team-Stats vs. Gegner. Optional:
  //   attackBonusFlat      — additiver Flat-Bonus auf Scoring-Chance pro Schuss
  //   statBuff             — Stat-Delta auf eigene Team-Stats (z.B. aus
  //                          geplantem Taktik-Layer)
  //   oppStatBuff          — dito für Gegner
  //   rounds               — verbleibende Runden (Default 6 = ganzes Match)
  //   currentScoreMe/Opp   — aktueller Spielstand (Default 0:0)
  //
  // Damit kann die Funktion sowohl Pre-Match als auch mitten im Match
  // aufgerufen werden: die Binomial-Verteilung rechnet die noch offenen
  // Runden, die Score-Klassifikation addiert den bestehenden Stand.
  function _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function estimateWinProbability(squad, opp, opts = {}) {
    if (!squad?.length || !opp) return null;
    const { aggregateTeamStats } = KL.stats;
    const my = aggregateTeamStats(squad);
    const oppS = opp.stats || {};
    const statBuff = opts.statBuff || {};
    const oppStatBuff = opts.oppStatBuff || {};

    // Traits aren't part of aggregateTeamStats but dominate match outcomes.
    // We fold estimated trait power into the attack/defense inputs so the
    // prognosis isn't systematically pessimistic (previously: predicts 2% win,
    // player goes 6-0). Split roughly 60/40 def-leaning because most starter
    // passives are defensive (fortress_aura, nine_lives, titan_stand, ...).
    // Opp side uses a simpler flat lookup — their traits are coarser.
    const myTraitPower = estimateSquadTraitPower(squad);
    const oppTraitPower = estimateOppTraitPower(opp);
    const TRAIT_TO_DEF = 0.18;
    const TRAIT_TO_OFF = 0.12;

    const myOff = (my.offense || 0) + (statBuff.offense || 0) + myTraitPower * TRAIT_TO_OFF;
    const myDef = (my.defense || 0) + (statBuff.defense || 0) + myTraitPower * TRAIT_TO_DEF;
    const oppOff = (oppS.offense || 0) + (oppStatBuff.offense || 0) + oppTraitPower * TRAIT_TO_OFF;
    const oppDef = (oppS.defense || 0) + (oppStatBuff.defense || 0) + oppTraitPower * TRAIT_TO_DEF;
    const attackBonusFlat = opts.attackBonusFlat || 0;
    const rounds = opts.rounds !== undefined ? opts.rounds : 6;
    const currentScoreMe = opts.currentScoreMe || 0;
    const currentScoreOpp = opts.currentScoreOpp || 0;

    // Engine-Parameter (siehe config-data.js + engine.js)
    const ATTACK_BASE = 0.32;
    const ATTACK_SCALE = 0.008;
    const DEF_SCALE = 0.008;
    const SHOT_ON_TARGET_OFFSET = 0.18;
    const OPP_BUILDUP_BASE = 0.35;
    const MY_BUILDUP_BASE = 0.27;
    const BUILDUP_VISION_SCALE = 0.007;

    // Vision-Werte für Buildup-Berechnung
    const myVision = (my.vision || 0) + (statBuff.vision || 0);
    const oppVision = (oppS.vision || 0) + (oppStatBuff.vision || 0);

    // Pro Aktion: erwartete Tore.
    // Mein Angriffsweg: Buildup → Schuss aufs Tor → Save.
    // Gegner-Angriffsweg: Buildup → Save (kein Schuss-aufs-Tor-Gate).
    const myBuildup = _clamp(
      MY_BUILDUP_BASE + (myVision - 55) * BUILDUP_VISION_SCALE,
      0.05, 0.92
    );
    const baseScoring = _clamp(
      ATTACK_BASE + (myOff - oppDef) * ATTACK_SCALE + attackBonusFlat,
      0.05, 0.90
    );
    const shotOnTarget = _clamp(baseScoring + SHOT_ON_TARGET_OFFSET, 0.12, 0.97);
    const oppSave = _clamp(0.40 + (oppDef - myOff) * DEF_SCALE, 0.08, 0.86);
    const myPGoal = myBuildup * shotOnTarget * (1 - oppSave);

    const oppBuildup = _clamp(
      OPP_BUILDUP_BASE + (oppVision - 55) * 0.005,
      0.10, 0.85
    );
    const mySave = _clamp(0.50 + (myDef - oppOff) * DEF_SCALE, 0.12, 0.92);
    const oppPGoal = oppBuildup * (1 - mySave);

    // Edge-Case: keine Runden mehr → Ergebnis aus bestehenden Score bestimmen
    if (rounds <= 0) {
      if (currentScoreMe > currentScoreOpp)
        return { win: 1, draw: 0, loss: 0, myExpectedGoals: currentScoreMe, oppExpectedGoals: currentScoreOpp };
      if (currentScoreMe < currentScoreOpp)
        return { win: 0, draw: 0, loss: 1, myExpectedGoals: currentScoreMe, oppExpectedGoals: currentScoreOpp };
      return { win: 0, draw: 1, loss: 0, myExpectedGoals: currentScoreMe, oppExpectedGoals: currentScoreOpp };
    }

    // Binomial über verbleibende Runden, dann Score addieren
    const myDist = _binomial(rounds, myPGoal);
    const oppDist = _binomial(rounds, oppPGoal);
    let win = 0, draw = 0, loss = 0;
    for (let m = 0; m < myDist.length; m++) {
      for (let o = 0; o < oppDist.length; o++) {
        const p = myDist[m] * oppDist[o];
        const totalMe = currentScoreMe + m;
        const totalOpp = currentScoreOpp + o;
        if (totalMe > totalOpp) win += p;
        else if (totalMe === totalOpp) draw += p;
        else loss += p;
      }
    }
    return {
      win, draw, loss,
      myExpectedGoals: currentScoreMe + rounds * myPGoal,
      oppExpectedGoals: currentScoreOpp + rounds * oppPGoal
    };
  }

  function _binomial(n, p) {
    // P(X = k) für k = 0..n
    const out = new Array(n + 1);
    let coef = 1;
    for (let k = 0; k <= n; k++) {
      out[k] = coef * Math.pow(p, k) * Math.pow(1 - p, n - k);
      coef = coef * (n - k) / (k + 1);
    }
    return out;
  }

  // Differenz in Prozentpunkten zwischen "ohne Bonus" und "mit Bonus".
  // Praktisch für Pre-/Post-Decision-Anzeige.
  function winProbDelta(squad, opp, attackBonusFlat) {
    const a = estimateWinProbability(squad, opp);
    const b = estimateWinProbability(squad, opp, { attackBonusFlat });
    if (!a || !b) return 0;
    return Math.round((b.win - a.win) * 100);
  }

  // ─── Tactic Focus Players ─────────────────────────────────────────────────
  // Eine Taktik boostet bestimmte Stats — die Rollen, deren Focus-Stat
  // geboostet wird, sind die "Spieler der Entscheidung". Diese Spieler
  // bekommen Bonus-XP für erfolgreiche Aktionen während der Taktik-Phase.
  //
  // Diese Tabelle spiegelt engine.js:applyTactic() wider. Wenn dort eine
  // Taktik-Wirkung geändert wird, muss dieser Eintrag nachgeführt werden.
  const TACTIC_STAT_DELTAS = {
    kickoff: {
      aggressive:  { offense:  18, defense:  -8 },
      defensive:   { offense:  -8, defense:  18 },
      balanced:    { offense:   5, defense:   5, tempo: 5, vision: 5, composure: 5 },
      tempo:       { tempo:    22, composure: -6 },
      pressing:    { defense:  14, tempo:    10 },
      possession:  { vision:   18, composure: 10 },
      counter:     { defense:  22, tempo:    10, offense: -6 },
      flank_play:  { tempo:    14, offense:  14 },
      slow_burn:   { offense:  10 },
      shot_flood:  { offense:  24 },
      lockdown:    { defense:  28, offense: -12, tempo: -8 },
      mindgames:   { vision:   14, composure: 10 },
      underdog:    { offense:  14, defense:  14, tempo: 14, vision: 14, composure: 14 },
      favorite:    { vision:   10, tempo:     6 },
      wet_start:   { defense:  18 },
      chaos:       { offense:   8 }
    },
    halftime: {
      push:        { offense:  20, defense: -10 },
      stabilize:   { defense:  18, composure: 10 },
      shift:       { offense:  12 },
      rally:       { offense:   8, defense:   8 },
      reset:       { offense:  12, defense:  12, tempo: 12, vision: 12, composure: 12 },
      counter_h:   { tempo:    24, defense:  14 },
      high_press:  { defense:  22, composure: -6 },
      vision_play: { vision:   22, offense:  10 },
      shake_up:    { offense:  12 },
      lock_bus:    { defense:  30, offense: -20 },
      desperate:   { offense:  32, defense: -20 },
      role_switch: { tempo:    10, offense:  10 },
      coach_fire:  { offense:  14 },
      cold_read:   { defense:  20 },
      wingman:     { tempo:    25, offense:  15 },
      mind_reset:  {}
    },
    final: {
      keep_cool:   { composure: 20, vision: 12 },
      long_ball:   { offense:  28 },
      midfield:    { vision:   20, tempo:  16, composure: 14 },
      sneaky:      { defense:  28, tempo:  18, offense: -14 },
      final_press: { tempo:    24, defense: 18, offense: -10 },
      hero_ball:   { offense:  30 },
      sacrifice:   { offense:  35 },
      all_in:      { offense:  15, defense: -15 }
    }
  };

  // Rolle → Focus-Stat-Mapping (aus DATA.roles.focusStat)
  const ROLE_FOCUS = {
    TW: 'defense',
    VT: 'defense',
    PM: 'vision',
    LF: 'tempo',
    ST: 'offense'
  };

  // Ermittelt, welche Rollen durch die Taktik geboostet werden.
  // Eine Rolle zählt als "Focus" wenn ihr Primär-Focus-Stat um ≥10 steigt
  // ODER wenn die Offense/Defense stark genug steigt um eine alternative
  // Rolle einzubinden.
  function getTacticFocusRoles(tacticId, phase) {
    const table = TACTIC_STAT_DELTAS[phase];
    const deltas = table?.[tacticId];
    if (!deltas) return [];

    const roles = new Set();
    // Jede Rolle prüft ihren Focus-Stat
    for (const [role, focusStat] of Object.entries(ROLE_FOCUS)) {
      if ((deltas[focusStat] || 0) >= 10) roles.add(role);
    }
    // Spezialfälle: Offense-Boost → ST + LF, Defense-Boost → TW + VT
    if ((deltas.offense || 0) >= 14) { roles.add('ST'); roles.add('LF'); }
    if ((deltas.defense || 0) >= 14) { roles.add('TW'); roles.add('VT'); }
    if ((deltas.vision  || 0) >= 14) { roles.add('PM'); }
    if ((deltas.tempo   || 0) >= 14) { roles.add('LF'); }

    return Array.from(roles);
  }

  // Liefert für die UI die konkreten Spieler, die eine Taktik-Wahl bevorzugt.
  // Rückgabe: [{ role, name }] — maximal 3 Einträge.
  function previewTacticFocusPlayers(squad, tacticId, phase) {
    const roles = getTacticFocusRoles(tacticId, phase);
    if (!roles.length || !squad?.length) return [];
    const out = [];
    for (const role of roles) {
      const player = squad.find(p => p.role === role);
      if (player) out.push({ role, name: player.name, id: player.id });
      if (out.length >= 3) break;
    }
    return out;
  }

  KL.intel = {
    TRAIT_POWER_VALUES,
    OPP_TRAIT_POWER_VALUES,
    estimatePlayerTraitPower,
    estimateSquadTraitPower,
    estimateOppTraitPower,
    buildMatchupIntel,
    buildIntelOneLiner,
    buildMatchupScorecard,
    buildMatchTraitReport,
    estimateWinProbability,
    winProbDelta,
    getTacticFocusRoles,
    previewTacticFocusPlayers,
    TACTIC_STAT_DELTAS,
    ROLE_FOCUS
  };

  Object.assign(window, {
    TRAIT_POWER_VALUES,
    OPP_TRAIT_POWER_VALUES,
    estimatePlayerTraitPower,
    estimateSquadTraitPower,
    estimateOppTraitPower,
    buildMatchupIntel,
    buildIntelOneLiner,
    buildMatchupScorecard,
    buildMatchTraitReport,
    estimateWinProbability,
    winProbDelta,
    getTacticFocusRoles,
    previewTacticFocusPlayers
  });
})();
