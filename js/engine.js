// ─────────────────────────────────────────────────────────────────────────────
// engine.js — Match engine
//
// Responsibilities:
//   - startMatch: lifecycle + round loop
//   - attemptAttack / attemptOppAttack / recordOwnGoal
//   - applyTactic (kickoff, halftime, final) + fit/misfit evaluation
//   - recomputeTeamBuffs from layered tactic effects
//   - Per-player match-stat bookkeeping
//   - Penalty shootout for a drawn final match
//
// Match object structure (flat, for compatibility — see schema comments
// near the match literal in startMatch):
//   scoreMe, scoreOpp, round, squad, opp
//   teamBuffs { offense, defense, tempo, vision, composure, saveBonus, ... }
//   buffLayers [{ source, range:[from,to], stats:{...}, special }]
//   stats { myShots, myBuildups, saves, ... }
//   pending flags: counterPending, chainAttack, pouncePending, doubleNextGoal, ...
//   tactic counters: autoCounterRoundsLeft, pressingRoundsLeft, aggressiveRoundsLeft, ...
//   focus fields:   _focusPlayerId, _focusRound, _focusStat, _focusBonus, ...
//   events fields:  _firedEvents, _eventsThisMatch, _eventImmediateAttack, ...
//
// All fields prefixed with `_` are "internal bookkeeping": they're read by
// one module and written by another, but nothing outside the engine/traits/
// decisions trio should touch them.
// ─────────────────────────────────────────────────────────────────────────────

(() => {
  const KL = window.KL;
  const { rand, clamp, sleep, pick, pickLog } = KL.util;
  const { CONFIG, DATA, TACTIC_FIT } = KL.config;

  // Accessors we'll use often — resolved at call time because some of these
  // modules load after engine.js registers, and the functions may be patched.
  const computePlayerStats  = (...a) => KL.stats.computePlayerStats(...a);
  const aggregateTeamStats  = (...a) => KL.stats.aggregateTeamStats(...a);
  const dispatchTrigger     = (...a) => KL.traits.dispatch(...a);
  const flushTriggerLog     = (...a) => KL.traits.flushLog(...a);
  const applyOppTraitEffect = (...a) => KL.traits.applyOppTraitEffect(...a);

  // ─── Per-player per-match stats ────────────────────────────────────────────
  function bumpPlayerStat(player, key, delta = 1) {
    if (!player) return;
    if (!player._matchStats) player._matchStats = {};
    player._matchStats[key] = (player._matchStats[key] || 0) + delta;
  }

  function resetPlayerMatchStats(squad) {
    for (const p of squad) {
      p._matchStats = {
        shots: 0, shotsOnTarget: 0, goals: 0,
        buildups: 0, buildupsOk: 0,
        saves: 0, goalsConceded: 0,
        defendedAttacks: 0, counters: 0
      };
    }
  }

  // ─── Convenience: team display name ────────────────────────────────────────
  function getTeamDisplayName(squad) {
    return (window.state?.teamName) || window.I18N.t('ui.hub.yourTeam');
  }

  // ─── Log helper ────────────────────────────────────────────────────────────
  // onEvent({type:'log', cls, msg}) is the callback injected by the UI layer;
  // we wrap it so log() awaits like a normal promise.
  function log(onEvent, cls, msg) {
    return onEvent({ type: 'log', cls, msg });
  }

  // ─── Tactic triggers ───────────────────────────────────────────────────────
  // Each tactic can optionally declare a `tacticTrigger` name; when matched
  // here, we run the corresponding side effect. These are separate from
  // regular buff layers because they fire once at tactic-apply time.
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
    },
    sacrifice_trigger: async (/* match, squad, onEvent */) => {
      // The permanent stat cost is applied inside applyTactic directly,
      // so this handler is intentionally a no-op. Kept here for symmetry.
    }
  };

  async function dispatchTacticTrigger(triggerName, match, squad, onEvent) {
    if (!triggerName) return;
    const handler = TACTIC_HANDLERS[triggerName];
    if (handler) await handler(match, squad, onEvent);
  }

  // ─── Buff layer recomputation ──────────────────────────────────────────────
  // Tactics push entries into match.buffLayers with a [from, to] round range.
  // We sum only the layers whose range covers the current round. Rally has
  // a dynamic bonus that depends on score — handled as a `special:'rally'`
  // flag so the formula stays in one place.
  function recomputeTeamBuffs(match) {
    const r = match.round || 1;
    const agg = { offense: 0, defense: 0, tempo: 0, vision: 0, composure: 0 };
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

  // ─── Tactic application ───────────────────────────────────────────────────
  // Pushes a layer onto match.buffLayers and runs any one-shot side-effects
  // (sacrifice stat loss, hero_ball stat gain, shift player buff, etc.).
  // Phase-specific round ranges: kickoff [1,3], halftime [4,6], final [6,6].
  //
  // Fit/misfit is evaluated once at kickoff for the kickoff tactic only; the
  // result is stored on match._tacticFit / match._tacticMisfit and consumed
  // throughout the match by attack/defense code.
  function applyTactic(match, tactic, phase, squad, onEvent) {
    if (!tactic) return;

    const RANGES = { kickoff: [1, 3], halftime: [4, 6], final: [6, 6] };
    const range = RANGES[phase] || [1, 6];
    const layer = { source: tactic.id + '@' + phase, range, stats: {}, special: null };

    const deficit = Math.max(0, match.scoreOpp - match.scoreMe);
    const lead    = Math.max(0, match.scoreMe  - match.scoreOpp);
    const isTrailing = deficit > 0;
    const isLeading  = lead    > 0;

    // ── Kickoff ────────────────────────────────────────────────────────────
    if (phase === 'kickoff') {
      if (tactic.id === 'aggressive') {
        layer.stats = { offense: 18, defense: -8 };
        match.aggressiveRoundsLeft = 3;
      }
      if (tactic.id === 'defensive') { layer.stats = { defense: 18, offense: -8 }; }
      if (tactic.id === 'balanced') {
        layer.stats = { offense: 8, defense: 8, tempo: 8, vision: 8, composure: 8 };
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
    }

    // ── Halftime ───────────────────────────────────────────────────────────
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
        // One-shot permanent focus-stat gain to a random squad member.
        const subject = pick(match.squad);
        const focus = DATA.roles.find(r => r.id === subject.role)?.focusStat || 'offense';
        subject.stats[focus] = clamp(subject.stats[focus] + 18, 20, 99);
        match._shiftSubject = subject;
        return;
      }
      if (tactic.id === 'rally') {
        layer.special = 'rally';
        match.rallyReactionPending = false;
        match._rallyActive = true;
      }
      if (tactic.id === 'reset') { layer.stats = { offense: 12, defense: 12, tempo: 12, vision: 12, composure: 12 }; }
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
    }

    // ── Final ──────────────────────────────────────────────────────────────
    if (phase === 'final') {
      if (tactic.condition) {
        layer.stats = tactic.condition(match);
      } else {
        if (tactic.id === 'keep_cool')   { layer.stats = { composure: 20, vision: 12 }; }
        if (tactic.id === 'long_ball')   { layer.stats = { offense: 28, vision: -10 }; }
        if (tactic.id === 'midfield')    { layer.stats = { vision: 20, tempo: 16, composure: 14 }; }
        if (tactic.id === 'sneaky')      { layer.stats = { defense: 28, tempo: 18, offense: -14 }; }
        if (tactic.id === 'final_press') { layer.stats = { tempo: 24, defense: 18, offense: -10 }; }
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
    }

    // ── Fit / misfit (kickoff only) ────────────────────────────────────────
    if (phase === 'kickoff') {
      const fitDef = TACTIC_FIT[tactic.id];
      if (fitDef) {
        const currentSquad = match.squad || squad || [];
        const isFit = fitDef.fit(currentSquad, match.opp, match);
        const oppBreached = fitDef.opponentBreachFn ? fitDef.opponentBreachFn(match.opp) : false;

        if (isFit && !oppBreached) {
          match._tacticFit = true;
          match._tacticMisfit = null;
          // Amplify positive buffs; negative buffs stay as designed.
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
          // Dampen positive buffs; misfit effects are applied at consumption time.
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
  }

  // ─── Own goal bookkeeping ──────────────────────────────────────────────────
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
    bumpPlayerStat(scorer, 'goals');

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

  // ─── Our attack resolution ─────────────────────────────────────────────────
  // Flow:
  //   1. Fire the ownAttack trigger — traits can modify attackBonus, force
  //      guaranteedBuildup, auto-goal, or shift oppAvgDefense.
  //   2. Resolve build-up (PM-driven) — vision-scaled with misfit malus,
  //      fatigue malus, opponent build-up penalty (from events/traits).
  //   3. If build-up fails, maybe the opponent counters and we return early.
  //   4. If build-up succeeds, determine scorer (LF or ST), compute scoring
  //      chance, roll for goal.
  async function attemptAttack(match, squad, onEvent, extra = {}) {
    const st = squad.find(p => p.role === 'ST');
    const lf = squad.find(p => p.role === 'LF');
    const pm = squad.find(p => p.role === 'PM');
    const vt = squad.find(p => p.role === 'VT');
    if (!st) return;

    const stStats = computePlayerStats(st, match);
    const lfStats = lf ? computePlayerStats(lf, match) : stStats;
    const pmStats = pm ? computePlayerStats(pm, match) : stStats;

    const teamOffense   = stStats.offense * 0.45 + lfStats.offense * 0.35 + pmStats.vision * 0.20;
    const teamTempo     = lfStats.tempo   * 0.50 + stStats.tempo   * 0.30 + pmStats.tempo  * 0.20;
    const teamComposure = squad.reduce((s, p) => s + computePlayerStats(p, match).composure, 0) / squad.length;
    const teamVision    = pmStats.vision * 0.50 + stStats.vision * 0.20 + lfStats.vision * 0.20
      + (vt ? computePlayerStats(vt, match).vision : 50) * 0.10;

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

    // PM→ST synergy — if the PM just drove the last buildup, there's a chance
    // of a choreographed combination with the striker.
    const synergyActive = match._lastBuildupByPM && (pm !== st);
    if (synergyActive && rand() < 0.55) {
      ctx.attackBonus += 0.04;
      ctx._synergyPair = { a: pm, b: st };
    }
    match._lastBuildupByPM = false;

    dispatchTrigger('ownAttack', ctx);
    await flushTriggerLog(match, onEvent);

    // Opp-trait penalty to our build-up chance (presser_opp).
    const oppPressCtx = applyOppTraitEffect(match.opp, match, 'ownBuildupChance', { malus: 0 });

    // Misfit-driven build-up penalties.
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

    // Build-up chance composition:
    //   baseline 0.30
    //   + PM vision scaling
    //   + pending buildup bonus (consumed below)
    //   + half of attack bonus (carries over for the shot phase too)
    //   - opp press malus
    //   - misfit malus
    //   - fatigue malus
    // Note: match._oppBuildupPenalty is on opponent build-up; does NOT apply here.
    const buildupChance = clamp(
      0.30
      + (pmStats.vision - 55) * CONFIG.buildupVisionScale
      + (match.nextBuildupBonus || 0)
      + ctx.attackBonus * 0.5
      - (oppPressCtx.malus || 0)
      - misfitBuildupMalus
      - fatigueBuildupMalus,
      0.05, 0.92
    );
    match.nextBuildupBonus = 0;
    match.stats.myBuildups++;
    bumpPlayerStat(pm, 'buildups');

    const buildupOk = ctx.guaranteedBuildup || rand() < buildupChance;
    match._lastBuildupFailed = !buildupOk;

    if (!buildupOk) {
      if (oppPressCtx._presserActive && rand() < 0.60) {
        await log(onEvent, 'trigger', window.I18N.t('ui.log.oppTrait.presserDisrupt', { name: match.opp.name }));
      }
      if (match.aggressiveRoundsLeft > 0 && rand() < 0.55) {
        await log(onEvent, 'decision', pickLog('ui.log.aggressiveError'));
      } else if (match.possessionActive && rand() < 0.40) {
        await log(onEvent, 'decision', pickLog('ui.log.possessionLost'));
        match.counterPending = true;
      }
      await log(onEvent, '', `R${match.round}: ${pickLog('logs.ownBuildFail', {
        pm: pm?.name || 'PM', vt: vt?.name || 'Defense'
      })}`);

      const counterCtx = applyOppTraitEffect(match.opp, match, 'counterAttack', {});
      if (counterCtx.triggered) {
        await log(onEvent, 'trigger', window.I18N.t('ui.log.oppBlitzCounter', { name: match.opp.name }));
        await attemptOppAttack(match, squad, onEvent);
      }
      return;
    }

    match.stats.myBuildupsSuccess++;
    bumpPlayerStat(pm, 'buildupsOk');
    match._lastBuildupByPM = true;
    dispatchTrigger('ownBuildupSuccess', ctx);
    await flushTriggerLog(match, onEvent);
    await log(onEvent, '', `R${match.round}: ${pickLog('logs.ownBuildSuccess', {
      pm: pm?.name || 'PM', lf: lf?.name || 'Runner', vt: vt?.name || 'Defender'
    })}`);

    // Trait-forced auto-goal (nutmeg, unstoppable_run, cannon_blast).
    if (ctx.autoGoal) {
      const autoScorer = ctx.scorer || st;
      match.stats.myShots++;
      match.stats.myShotsOnTarget++;
      bumpPlayerStat(autoScorer, 'shots');
      bumpPlayerStat(autoScorer, 'shotsOnTarget');
      await recordOwnGoal(match, squad, onEvent, autoScorer, ctx);
      return;
    }

    // Shot composition — pressure tightens composure's effect, vision helps
    // find the finish, tempo advantage adds a little, attack bonus adds a lot.
    const behindDeficit = Math.max(0, match.scoreOpp - match.scoreMe);
    const isPressure = behindDeficit > 0 || match.round >= 5;
    const composureAdvantage = isPressure
      ? (teamComposure - ctx.match.opp.stats.composure) * 0.0015
      : 0;
    const visionAdvantage = (teamVision - ctx.match.opp.stats.vision) * 0.001;

    const scoringChance = clamp(
      CONFIG.attackBase
      + (teamOffense - ctx.oppAvgDefense) * CONFIG.attackStatScale
      + (teamTempo > ctx.match.opp.stats.tempo ? CONFIG.tempoAdvantage : -CONFIG.tempoAdvantage * 0.5)
      + composureAdvantage
      + visionAdvantage
      + ctx.attackBonus,
      0.05, 0.90
    );

    // Narrative flourishes — drop occasional commentary when the match state
    // is noteworthy (heavy negative offense buff, big lead, big deficit).
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

    // Scorer choice — fast LFs steal some of ST's shots.
    const scorer = (lfStats.tempo > stStats.tempo + 10 && rand() < 0.35) ? lf : st;
    ctx.scorer = scorer;
    await log(onEvent, '', `R${match.round}: ${pickLog('logs.chance', { scorer: scorer.name })}`);

    match.stats.myShots++;
    bumpPlayerStat(scorer, 'shots');

    if (rand() < scoringChance) {
      match.stats.myShotsOnTarget++;
      bumpPlayerStat(scorer, 'shotsOnTarget');
      await recordOwnGoal(match, squad, onEvent, scorer, ctx);
    } else {
      await log(onEvent, '', `R${match.round}: ${pickLog('logs.miss', { scorer: scorer.name })}`);
    }
  }

  // ─── Opponent attack resolution ────────────────────────────────────────────
  // Mirrors attemptAttack but simpler — opponents don't have trait dispatchers
  // for their own build-up, just the flat opp-trait effects.
  async function attemptOppAttack(match, squad, onEvent) {
    const ctx = { match, oppAttackNegated: false, oppShotSaved: false, oppGoalCancelled: false };
    const opp = match.opp;
    const vt = squad.find(p => p.role === 'VT');
    const tw = squad.find(p => p.role === 'TW');

    dispatchTrigger('oppAttack', ctx);
    await flushTriggerLog(match, onEvent);

    if (ctx.oppAttackNegated) {
      if (match.pressingRoundsLeft > 0) match._htPressingBlocks = (match._htPressingBlocks || 0) + 1;
      if (match.autoCounterRoundsLeft > 0) {
        match._htCountersFired = (match._htCountersFired || 0) + 1;
        const lf = squad.find(p => p.role === 'LF');
        bumpPlayerStat(lf, 'counters');
        await log(onEvent, 'trigger', window.I18N.t('ui.log.autoCounter'));
        await attemptAttack(match, squad, onEvent, { bonusAttack: 0.20 });
      }
      dispatchTrigger('oppAttackFailed', { match });
      await flushTriggerLog(match, onEvent);
      return;
    }

    // Opp build-up malus from pressing, plus fatigue backlash, plus event-
    // driven opp buildup penalty (opp_mistake sustain).
    const pressMalus   = match.pressingRoundsLeft > 0 ? 0.20 : 0;
    const fatigueMalus = -(match._aggressiveFatigue || 0);
    const eventOppMalus = match._oppBuildupPenalty || 0;

    const oppBuildup = clamp(
      0.35 + (opp.stats.vision - 55) * 0.005 - pressMalus + fatigueMalus - eventOppMalus,
      0.10, 0.85
    );
    match.stats.oppBuildups++;

    if (rand() > oppBuildup) {
      await log(onEvent, '', `R${match.round}: ${pickLog('logs.oppBuildFail', {
        opp: opp.name, vt: vt?.name || 'Defense'
      })}`);
      bumpPlayerStat(vt, 'defendedAttacks');
      if (match.pressingRoundsLeft > 0) match._htPressingBlocks = (match._htPressingBlocks || 0) + 1;
      if (match.autoCounterRoundsLeft > 0) {
        match._htCountersFired = (match._htCountersFired || 0) + 1;
        const lf = squad.find(p => p.role === 'LF');
        bumpPlayerStat(lf, 'counters');
        await log(onEvent, 'trigger', window.I18N.t('ui.log.autoCounter'));
        await attemptAttack(match, squad, onEvent, { bonusAttack: 0.20 });
      }
      dispatchTrigger('oppAttackFailed', { match });
      await flushTriggerLog(match, onEvent);
      return;
    }
    match.stats.oppBuildupsSuccess++;

    // Shot resolution — defense-heavy blend of VT + TW stats, with composure
    // and vision kickers. Pressing "broken" adds a bonus to the shooter.
    const vtStats = vt ? computePlayerStats(vt, match) : { defense: 55 };
    const twStats = tw ? computePlayerStats(tw, match) : { defense: 55 };
    const rb = opp._roundBuffs || {};

    let pressBreakBonus = 0;
    if (match.pressingRoundsLeft > 0) {
      pressBreakBonus = 0.12 + rand() * 0.08;
      await log(onEvent, 'decision', pickLog('ui.log.pressingBeaten', { opp: opp.name }));
    }

    const oppOff = (opp.stats.offense + (rb.offense || 0)) + (opp.stats.tempo + (rb.tempo || 0)) * 0.2;
    const myDef  = vtStats.defense * 0.45 + twStats.defense * 0.55 + (match.teamBuffs?.defense || 0);
    await log(onEvent, '', `R${match.round}: ${pickLog('logs.oppApproach', { opp: opp.name })}`);

    match.stats.oppShots++;
    dispatchTrigger('oppShot', ctx);
    await flushTriggerLog(match, onEvent);

    if (ctx.oppShotSaved) {
      match.stats.saves++;
      bumpPlayerStat(tw, 'saves');
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

    const oppShotCtx = applyOppTraitEffect(opp, match, 'oppShotChance', { bonus: 0 });
    for (const msg of (oppShotCtx.logMsgs || [])) await log(onEvent, 'trigger', msg);

    const oppSaveCtx = applyOppTraitEffect(opp, match, 'savePenalty', { penalty: 0 });
    for (const msg of (oppSaveCtx.logMsgs || [])) await log(onEvent, 'trigger', msg);

    saveChance -= (oppShotCtx.bonus || 0);
    saveChance -= (oppSaveCtx.penalty || 0);

    const misfitDef = match._tacticMisfit;
    if (misfitDef) {
      if (misfitDef.effects.oppCounterBonus)       saveChance -= misfitDef.effects.oppCounterBonus;
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

    if (rand() < saveChance) {
      match.stats.saves++;
      bumpPlayerStat(tw, 'saves');
      await log(onEvent, '', `R${match.round}: ${pickLog('logs.save', {
        tw: tw?.name || 'Keeper', vt: vt?.name || 'Defense'
      })}`);
      dispatchTrigger('postSave', { match });
      await flushTriggerLog(match, onEvent);
    } else {
      match.stats.oppShotsOnTarget++;
      dispatchTrigger('oppGoal', ctx);
      await flushTriggerLog(match, onEvent);
      if (ctx.oppGoalCancelled) return;

      match.scoreOpp += 1;
      bumpPlayerStat(tw, 'goalsConceded');
      bumpPlayerStat(vt, 'goalsConceded');

      // Narrative on concede.
      if (match.finalAction?.id === 'all_in' && match.round === 6) {
        await log(onEvent, 'decision', pickLog('ui.log.allInExposed', { opp: opp.name }));
      } else if ((match.teamBuffs?.offense || 0) > 20 && (match.teamBuffs?.defense || 0) < -8) {
        await log(onEvent, 'decision', pickLog('ui.log.attackingExposed', { opp: opp.name }));
      } else if (match.aggressiveRoundsLeft > 0 && rand() < 0.50) {
        await log(onEvent, 'decision', pickLog('ui.log.aggressiveExposed', { opp: opp.name }));
      }

      await log(onEvent, 'goal-opp', window.I18N.t('ui.log.oppGoal', {
        name: opp.name, me: match.scoreMe, opp: match.scoreOpp
      }));

      if (match._rallyActive) match.rallyReactionPending = true;
      dispatchTrigger('afterOppGoal', { match });
      await flushTriggerLog(match, onEvent);
    }
  }

  // ─── Penalty shootout ──────────────────────────────────────────────────────
  // Only fires when the final match ends drawn. Composure diff biases both
  // teams' conversion rates within [0.55, 0.90].
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
    while (myPens === oppPens) {
      const mHit = rand() < myHitProb;
      const oHit = rand() < oppHitProb;
      if (mHit) myPens++;
      if (oHit) oppPens++;
      if (mHit !== oHit) {
        await log(onEvent, '', window.I18N.t('ui.log.suddenDeath', { me: myPens, opp: oppPens }));
      }
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

  // ─── Match lifecycle ───────────────────────────────────────────────────────
  // Creates the match object (with all the flags in documented sections),
  // runs 6 rounds with 3 interrupt points (kickoff / halftime / final),
  // resolves penalties if drawn on the final match, and returns the result.
  async function startMatch(squad, opp, onEvent) {
    const match = {
      // ── Core state ───────────────────────────────────────────────────────
      round: 0,
      scoreMe: 0,
      scoreOpp: 0,
      squad,
      opp,

      // ── Buffs and tactic layers ──────────────────────────────────────────
      teamBuffs: { offense: 0, defense: 0, tempo: 0, vision: 0, composure: 0 },
      buffLayers: [],
      activeTacticTags: [],

      // ── Logging + trait bookkeeping ──────────────────────────────────────
      log: [],
      triggersThisRound: 0,
      firstShotTaken: false,
      _oppTraitLogged: {},
      _traitFireCounts: {},
      triggerLog: [],

      // ── Pending effects (consume-once flags) ─────────────────────────────
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

      // ── Last-tactic memory (for logging / decisions) ─────────────────────
      lastTactic: null,
      halftimeAction: null,
      finalAction: null,

      // ── Tactic fit ───────────────────────────────────────────────────────
      _tacticFit: null,
      _tacticMisfit: null,

      // ── Tactic-driven round counters ─────────────────────────────────────
      autoCounterRoundsLeft: 0,
      doubleCounterPending: false,
      pressingRoundsLeft: 0,
      possessionActive: false,
      aggressiveRoundsLeft: 0,
      flankRoundsLeft: 0,
      momentumCounter: 0,
      guaranteedFirstBuildup: false,
      _fatigue: 0,

      // ── Halftime counter bookkeeping ─────────────────────────────────────
      _htPressingBlocks: 0,
      _htCountersFired: 0,

      // ── Focus decision (set by decisions.js on halftime) ─────────────────
      _focusPlayerId: null,
      _focusRound: null,
      _focusBonus: 0,
      _focusStat: null,
      _focusFailChance: 0,
      _focusRedemption: false,
      _focusResolved: false,

      // ── Team talk flag (set by crisis_moment event) ──────────────────────
      _teamTalkFailed: false,

      // ── Situative events ─────────────────────────────────────────────────
      _firedEvents: new Set(),
      _eventsThisMatch: 0,
      _eventImmediateAttack: false,
      _oppBuildupPenalty: 0,
      _oppBuildupPenaltyRounds: 0,

      // ── Running stats ────────────────────────────────────────────────────
      stats: {
        myShots: 0, myShotsOnTarget: 0, myBuildups: 0, myBuildupsSuccess: 0,
        oppShots: 0, oppShotsOnTarget: 0, oppBuildups: 0, oppBuildupsSuccess: 0,
        triggersFired: 0, saves: 0
      }
    };

    // Reset player-scoped trait state (these flags persist across the match
    // but must be cleared between matches).
    for (const p of squad) {
      delete p._usedAcrobat;
      delete p._usedNineLives;
      delete p._readGameUsed;
      delete p._chessUsed;
      delete p._speedBurstUsed;
      delete p._whirlwindUsed;
      delete p._chameleonTrait;
      delete p._chameleonUsed;
      delete p._metronomeBonus;
      delete p._dribbleStack;
      delete p._triggerCount;
      delete p._unbreakableUsed;
      delete p._godModeUsed;
    }
    resetPlayerMatchStats(squad);

    // Team form effect — influences all stat computations this match.
    const teamFormAvg = squad.reduce((s, p) => s + (p.form || 0), 0) / squad.length;
    if      (teamFormAvg >=  2) match._teamFormBonus =  3;
    else if (teamFormAvg <= -2) match._teamFormBonus = -3;
    else                         match._teamFormBonus =  0;
    match._teamFormLabel = teamFormAvg >=  2 ? 'HEISSER LAUF'
                        :  teamFormAvg <= -2 ? 'KRISE' : null;

    // ── Match intro ──────────────────────────────────────────────────────
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
        const tn = opp.traits.map(tid => KL.traits.OPP_TRAITS.find(x => x.id === tid)?.name || tid);
        parts.push(...tn);
      }
      await log(onEvent, 'decision', window.I18N.t('ui.log.opponentIntro', { parts: parts.join(' / ') }));
    }

    // ── Round loop ───────────────────────────────────────────────────────
    for (let r = 1; r <= CONFIG.rounds; r++) {
      match.round = r;
      match.triggersThisRound = 0;
      recomputeTeamBuffs(match);

      // Decrement tactic counters at start of each round
      if (match.autoCounterRoundsLeft > 0) match.autoCounterRoundsLeft--;
      if (match.pressingRoundsLeft    > 0) match.pressingRoundsLeft--;
      if (match.aggressiveRoundsLeft  > 0) match.aggressiveRoundsLeft--;
      if (match.flankRoundsLeft       > 0) match.flankRoundsLeft--;

      // Show active buff summary in the log for rounds 2+
      if (r > 1) {
        const buffEntries = Object.entries(match.teamBuffs)
          .filter(([k, v]) => Math.abs(v) >= 5 && ['offense','defense','tempo','vision','composure'].includes(k));
        if (buffEntries.length > 0) {
          const buffStr = buffEntries.map(([k, v]) => `${k.substring(0,3).toUpperCase()} ${v>0?'+':''}${v}`).join(' ');
          await log(onEvent, 'decision', window.I18N.t('ui.log.activeBuffs', { buffs: buffStr }));
        }
      }

      // Round-scoped opponent buffs (clutch_opp late game, ironwall early game)
      const lateCtx  = applyOppTraitEffect(match.opp, match, 'lateGameBoost', {});
      const earlyCtx = applyOppTraitEffect(match.opp, match, 'earlyDefense',  {});
      match.opp._roundBuffs = {
        offense: (lateCtx.offense || 0),
        tempo:   (lateCtx.tempo   || 0),
        defense: (earlyCtx.defense || 0)
      };
      for (const msg of (lateCtx.logMsgs  || [])) await log(onEvent, 'trigger', msg);
      for (const msg of (earlyCtx.logMsgs || [])) await log(onEvent, 'trigger', msg);

      // Lucky opp — maybe double-attack next turn
      if (match.opp.traits?.includes('lucky') && !match.opp._luckyUsed && r >= 2 && rand() < 0.25) {
        match.opp._luckyUsed = true;
        match._oppLuckyPending = true;
      }

      // ── Interrupts: kickoff / halftime / final ───────────────────────
      if (r === 1) {
        window.UI?.updateRoundIndicator?.(r);
        const tactic = await onEvent({ type: 'interrupt', phase: 'kickoff', match });
        match.lastTactic = tactic;
        applyTactic(match, tactic, 'kickoff');
        match.activeTacticTags = [...(tactic.tags || [])];
        recomputeTeamBuffs(match);
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
        // Post-first-half summary log lines
        const htParts = [];
        if (match._htPressingBlocks > 0) htParts.push(window.I18N.t('ui.log.htSummaryPressing', { n: match._htPressingBlocks }));
        if (match._htCountersFired  > 0) htParts.push(window.I18N.t('ui.log.htSummaryCounters', { n: match._htCountersFired  }));
        if (match.momentumCounter  >= 2) htParts.push(window.I18N.t('ui.log.htSummaryMomentum'));
        if (htParts.length) await log(onEvent, 'decision', '  📋 ' + htParts.join(' · '));
        match._htPressingBlocks = 0;
        match._htCountersFired  = 0;

        const halftime = await onEvent({ type: 'interrupt', phase: 'halftime', match });
        match.halftimeAction = halftime;
        applyTactic(match, halftime, 'halftime');
        for (const tag of (halftime.tags || [])) {
          if (!match.activeTacticTags.includes(tag)) match.activeTacticTags.push(tag);
        }
        await log(onEvent, 'round-header', window.I18N.t('ui.log.halftimeHeader'));
        recomputeTeamBuffs(match);
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
        applyTactic(match, final, 'final', squad, onEvent);
        for (const tag of (final.tags || [])) {
          if (!match.activeTacticTags.includes(tag)) match.activeTacticTags.push(tag);
        }
        recomputeTeamBuffs(match);
        const buffAfter = match.teamBuffs;
        const buffStr = Object.entries(buffAfter)
          .filter(([k, v]) => Math.abs(v) >= 3 && ['offense','defense','tempo','vision','composure'].includes(k))
          .map(([k, v]) => `${k.substring(0,3).toUpperCase()} ${v>0?'+':''}${v}`)
          .join('  ');
        await log(onEvent, 'decision',
          window.I18N.t('ui.log.finalChoice', { name: final.name }) + (buffStr ? `  [${buffStr}]` : ''));
        await dispatchTacticTrigger(final.tacticTrigger, match, squad, onEvent);
      }

      // Round header + intro flavour
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

      // Situative events — decisions.js injects checkSituativeEvents after init
      if (typeof window.checkSituativeEvents === 'function') {
        await window.checkSituativeEvents(match, onEvent, window.state);
        await flushTriggerLog(match, onEvent);
      }

      // Immediate attack from the opp_mistake:exploit event
      if (match._eventImmediateAttack) {
        match._eventImmediateAttack = false;
        await log(onEvent, 'trigger', window.I18N.t('ui.log.eventOppMistakeExploit'));
        await attemptAttack(match, squad, onEvent, { bonusAttack: 0.18 });
      }

      if (match.shadowStrikeTriggered) {
        await attemptAttack(match, squad, onEvent, { bonusAttack: 0.15 });
        match.shadowStrikeTriggered = false;
      }
      if (match.ghostChancePending) {
        await attemptAttack(match, squad, onEvent, { bonusAttack: 0.10 });
        match.ghostChancePending = false;
      }

      // ── Possession / attack-count computation ────────────────────────
      const myAgg = aggregateTeamStats(squad);
      const effMy = {
        vision:    myAgg.vision    + (match.teamBuffs?.vision    || 0),
        composure: myAgg.composure + (match.teamBuffs?.composure || 0),
        tempo:     myAgg.tempo     + (match.teamBuffs?.tempo     || 0)
      };
      const rb = match.opp._roundBuffs || {};
      const effOpp = {
        vision:    match.opp.stats.vision,
        composure: match.opp.stats.composure,
        tempo:     match.opp.stats.tempo + (rb.tempo || 0)
      };
      const myControl  = effMy.vision  + effMy.composure  + effMy.tempo  * 0.5;
      const oppControl = effOpp.vision + effOpp.composure + effOpp.tempo * 0.5;
      const myPossRaw = myControl / (myControl + oppControl);
      const myPoss = clamp(myPossRaw, 0.25, 0.75);
      match._lastPoss = Math.round(myPoss * 100);
      match.stats.possAccum  = (match.stats.possAccum  || 0) + myPoss;
      match.stats.possRounds = (match.stats.possRounds || 0) + 1;

      let myAttacks = 1, oppAttacks = 1;
      if (match.possessionActive) {
        const myVis = aggregateTeamStats(squad).vision + (match.teamBuffs?.vision || 0);
        myAttacks = myVis > match.opp.stats.vision + 10 ? 2 : 1;
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
        match._aggressiveFatigue = (match._aggressiveFatigue || 0) + 0.04;
      }

      // Fatigue accumulation from aggressive/pressing exertion, capped at 0.30
      if (match.aggressiveRoundsLeft > 0 || match.pressingRoundsLeft > 0) {
        const mf = match._tacticMisfit;
        const fatigueMult = mf?.effects?.fatigueMult || 1.0;
        match._fatigue = Math.min(0.30, (match._fatigue || 0) + 0.022 * fatigueMult);
      }

      // Pressing collapse log (misfit path, one-shot)
      if (match._tacticMisfit?.effects?.pressingCollapseRound
          && match.round === match._tacticMisfit.effects.pressingCollapseRound + 1
          && !match._pressingCollapsedLogged) {
        match._pressingCollapsedLogged = true;
        await log(onEvent, 'trigger', window.I18N.t('ui.log.misfitPressingCollapse'));
      }

      if      (myPoss >= 0.60) await log(onEvent, 'decision', pickLog('ui.log.possessionPressure',  { pct: Math.round(myPoss * 100) }));
      else if (myPoss <= 0.40) await log(onEvent, 'decision', pickLog('ui.log.possessionDominated', { pct: Math.round(myPoss * 100) }));

      // Our attacks — successive attacks are slightly worse (tired feet)
      for (let a = 0; a < myAttacks; a++) {
        await attemptAttack(match, squad, onEvent, a > 0 ? { bonusAttack: -0.05 } : {});
      }
      if (match.chainAttack) {
        match.chainAttack = false;
        await log(onEvent, 'trigger', window.I18N.t('ui.log.chainAttack'));
        await attemptAttack(match, squad, onEvent, { bonusAttack: 0.10 });
      }

      // Opponent attacks — track failures for counter-trap
      const oppAttacksThisRound = oppAttacks;
      let oppAttacksFailed = 0;
      for (let a = 0; a < oppAttacks; a++) {
        const beforeOppScore = match.scoreOpp;
        await attemptOppAttack(match, squad, onEvent);
        if (match.scoreOpp === beforeOppScore) oppAttacksFailed++;
      }

      // Counter-trap double-counter trigger
      if (match.autoCounterRoundsLeft > 0 && oppAttacksThisRound >= 2 && oppAttacksFailed >= 2) {
        await log(onEvent, 'trigger', window.I18N.t('ui.log.doubleCounter'));
        await attemptAttack(match, squad, onEvent, { bonusAttack: 0.25 });
      }

      // Lucky-opp pending bonus attack
      if (match._oppLuckyPending) {
        match._oppLuckyPending = false;
        await log(onEvent, 'trigger', window.I18N.t('ui.log.luckyDouble', { name: match.opp.name }));
        await attemptOppAttack(match, squad, onEvent);
      }

      // Counter / pounce resolution
      if (match.counterPending || match.pouncePending) {
        match.counterPending = false;
        match.pouncePending = false;
        const lfForCounter = squad.find(p => p.role === 'LF');
        bumpPlayerStat(lfForCounter, 'counters');

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

      // Flank runs (separate from build-up — direct chance)
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
              await log(onEvent, '', `R${match.round}: ${lf.name} fires from the wing — off target.`);
            }
          }
        }
      }

      // Momentum tracking — consecutive dominant rounds boost the next
      // build-up. Only active when the kickoff tactic declares it (balanced).
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

      await onEvent({ type: 'roundEnd', match });
      if (match.fastSkip !== 'test') await sleep(match.fastSkip ? 100 : 700);
    }

    // ── Result resolution ───────────────────────────────────────────────
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

  // ─── Namespace + legacy exports ────────────────────────────────────────────
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
    TACTIC_HANDLERS,
    dispatchTacticTrigger
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
    dispatchTacticTrigger
  });
})();
