// ─────────────────────────────────────────────────────────────────────────────
// traits.js — Trait trigger registry + dispatcher
//
// Each trait has a handler function of signature (player, ctx) → void. The
// dispatcher fans out match events (statCompute, oppShot, ownGoal, roundStart,
// etc.) to every handler of every player's traits. Handlers mutate ctx to
// communicate effects back (e.g. ctx.oppShotSaved = true).
//
// To detect whether a trait actually fired this tick, we snapshot the
// observable parts of ctx around each handler call. Any diff counts as a fire
// — used for the post-match trait report.
//
// Mastery traits (suffix `_mastery`) wrap their parent's handler and apply a
// +30% multiplier to every effect the parent produced. This is implemented as
// a diff-after-call rather than a re-implementation, so mastery traits stay
// in sync with the parent's logic automatically.
//
// Opponent traits have their own small registry driven by a switch-per-point
// interface (applyOppTraitEffect), which is simpler since there are only 8.
// ─────────────────────────────────────────────────────────────────────────────

(() => {
  const KL = window.KL;
  const { rand, localeData } = KL.util;
  const { DATA } = KL.config;

  // ─── Trait handlers ────────────────────────────────────────────────────────
  // Organised here by role for readability. Logic unchanged from pre-refactor.
  const TRIGGER_HANDLERS = {
    // ── Keeper (TW) traits ─────────────────────────────────────────────────
    titan_stand(p, ctx) {
      if (ctx.event === 'oppShot' && Math.abs(ctx.match.scoreMe - ctx.match.scoreOpp) <= 1) {
        if (rand() < 0.30) {
          ctx.oppShotSaved = true;
          ctx.log('⛔ ' + p.name + ' TITANENSTAND — abgewehrt!');
        }
      }
    },
    fortress_aura(p, ctx) {
      if (ctx.event === 'statCompute' && ctx.player?.role === 'VT') ctx.stats.defense += 6;
    },
    clutch_save(p, ctx) {
      if (ctx.event === 'oppShot' && ctx.match.round >= 5 && rand() < 0.20) {
        ctx.oppShotSaved = true;
        ctx.log('🧤 ' + p.name + ' CLUTCH SAVE!');
      }
    },
    sweep_assist(p, ctx) {
      if (ctx.event === 'postSave') ctx.match.nextBuildupBonus = (ctx.match.nextBuildupBonus || 0) + 0.08;
    },
    laser_pass(p, ctx) {
      if (ctx.event === 'postSave' && rand() < 0.20) {
        ctx.match.counterPending = true;
        ctx.log(window.I18N.t('ui.log.laserPass', { name: p.name }));
      }
    },
    offside_trap(p, ctx) {
      if (ctx.event === 'oppAttack' && rand() < 0.15) {
        ctx.oppAttackNegated = true;
        ctx.log('🚩 ' + p.name + ' Abseitsfalle!');
      }
    },
    acrobat_parry(p, ctx) {
      if (ctx.event === 'oppShot' && !p._usedAcrobat) {
        ctx.match.nextSaveBonus = 0.12;
        p._usedAcrobat = true;
      }
    },
    wall_effect(p, ctx) {
      if (ctx.event === 'matchStart') {
        ctx.match.teamBuffs.saveBonus    = (ctx.match.teamBuffs.saveBonus    || 0) + 0.15;
        ctx.match.teamBuffs.buildupMalus = (ctx.match.teamBuffs.buildupMalus || 0) + 0.10;
      }
    },
    nine_lives(p, ctx) {
      if (ctx.event === 'oppGoal' && !p._usedNineLives) {
        ctx.oppGoalCancelled = true;
        p._usedNineLives = true;
        ctx.log(window.I18N.t('ui.log.nineLives', { name: p.name }));
      }
    },

    // ── Defender (VT) traits ───────────────────────────────────────────────
    intimidate(p, ctx) {
      if (ctx.event === 'oppStatCompute' && ctx.oppRole === 'ST') ctx.oppStats.offense -= 5;
    },
    bulldoze(p, ctx) {
      if (ctx.event === 'oppShot' && rand() < 0.10) {
        ctx.oppShotSaved = true;
        ctx.match.counterPending = true;
        ctx.log(window.I18N.t('ui.log.bulldoze', { name: p.name }));
      }
    },
    captain_boost(p, ctx) {
      if (ctx.event === 'statCompute') ctx.stats.composure += 3;
    },
    blood_scent(p, ctx) {
      if (ctx.event === 'afterOppGoal') {
        p.stats.defense += 5;
        ctx.log('🩸 ' + p.name + ' BLUTRAUSCH +5 Def.');
      }
    },
    hard_tackle(p, ctx) {
      if (ctx.event === 'oppAttack' && rand() < 0.20) {
        ctx.oppAttackNegated = true;
        ctx.match.counterPending = true;
        ctx.log(window.I18N.t('ui.log.hardTackle', { name: p.name }));
      }
    },
    whirlwind_rush(p, ctx) {
      if (ctx.event === 'roundStart' && !p._whirlwindUsed && (ctx.match.round === 2 || ctx.match.round === 5)) {
        ctx.match.teamBuffs.tempoBonus = (ctx.match.teamBuffs.tempoBonus || 0) + 0.5;
        p._whirlwindUsed = ctx.match.round <= 3 ? '1h' : '2h';
        ctx.log('🌪 ' + p.name + ' WIRBELWIND — doppeltes Tempo!');
      }
    },
    build_from_back(p, ctx) {
      if (ctx.event === 'statCompute' && ctx.player?.role === 'PM') ctx.stats.vision += 8;
    },
    late_bloom(p, ctx) {
      if (ctx.event === 'statCompute' && ctx.player === p && ctx.match.round >= 4) {
        ctx.stats.offense += 10;
        ctx.stats.vision += 5;
      }
    },
    read_game(p, ctx) {
      if (ctx.event === 'oppAttack' && !p._readGameUsed) {
        ctx.oppAttackNegated = true;
        p._readGameUsed = true;
        ctx.log('🧠 ' + p.name + ' liest das Spiel perfekt!');
      }
    },

    // ── Playmaker (PM) traits ──────────────────────────────────────────────
    metronome_tempo(p, ctx) {
      if (ctx.event === 'roundStart') {
        p._metronomeBonus = (p._metronomeBonus || 0) + 0.02;
      }
      if (ctx.event === 'ownAttack') {
        ctx.attackBonus += (p._metronomeBonus || 0);
      }
    },
    killer_pass(p, ctx) {
      if (ctx.event === 'ownGoal' && rand() < 0.25) {
        ctx.match.chainAttack = true;
        ctx.log(window.I18N.t('ui.log.killerPass', { name: p.name }));
      }
    },
    whisper_boost(p, ctx) {
      if (ctx.event === 'statCompute' && ctx.player?.role === 'ST') {
        ctx.stats.composure += 8;
        ctx.stats.offense += 4;
      }
    },
    hunter_press(p, ctx) {
      if (ctx.event === 'roundStart' && rand() < 0.15) {
        ctx.match.counterPending = true;
        ctx.log('🏹 ' + p.name + ' PRESSING-GEWINN!');
      }
    },
    gegenpress_steal(p, ctx) {
      if (ctx.event === 'oppAttackFailed') {
        ctx.match.nextBuildupBonus = (ctx.match.nextBuildupBonus || 0) + 0.15;
      }
    },
    shadow_strike(p, ctx) {
      if (ctx.event === 'roundStart' && (ctx.match.round === 3 || ctx.match.round === 6) && rand() < 0.20) {
        ctx.match.shadowStrikeTriggered = true;
        ctx.log(window.I18N.t('ui.log.shadowStrike', { name: p.name }));
      }
    },
    maestro_combo(p, ctx) {
      if (ctx.event === 'ownGoal') {
        ctx.match.comboCounter = (ctx.match.comboCounter || 0) + 1;
        if (ctx.match.comboCounter >= 3) {
          ctx.match.doubleNextGoal = true;
          ctx.match.comboCounter = 0;
          ctx.log(window.I18N.t('ui.log.maestroCombo', { name: p.name }));
        }
      }
    },
    chess_predict(p, ctx) {
      if (ctx.event === 'oppGoal' && !p._chessUsed) {
        ctx.oppGoalCancelled = true;
        p._chessUsed = true;
        ctx.log(window.I18N.t('ui.log.chessPredict', { name: p.name }));
      }
    },
    symphony_pass(p, ctx) {
      if (ctx.event === 'ownAttack' && (ctx.match.triggersThisRound || 0) >= 2) {
        ctx.attackBonus += 0.10;
      }
    },

    // ── Runner (LF) traits ─────────────────────────────────────────────────
    speed_burst(p, ctx) {
      if (ctx.event === 'ownAttack' && !p._speedBurstUsed) {
        ctx.guaranteedBuildup = true;
        p._speedBurstUsed = true;
        ctx.log(window.I18N.t('ui.log.speedBurst', { name: p.name }));
      }
      if (ctx.event === 'halftime') p._speedBurstUsed = false;
    },
    launch_sequence(p, ctx) {
      if (ctx.event === 'ownAttack' && ctx.match.round === 1) ctx.attackBonus += 0.20;
    },
    unstoppable_run(p, ctx) {
      if (ctx.event === 'ownAttack' && p.stats.tempo > (ctx.oppAvgDefense || 60) && rand() < 0.10) {
        ctx.autoGoal = true;
        ctx.log(window.I18N.t('ui.log.unstoppable', { name: p.name }));
      }
    },
    dribble_chain(p, ctx) {
      if (ctx.event === 'ownGoal') p._dribbleStack = Math.min(0.25, (p._dribbleStack || 0) + 0.05);
      if (ctx.event === 'ownAttack') ctx.attackBonus += (p._dribbleStack || 0);
    },
    street_trick(p, ctx) {
      if (ctx.event === 'ownAttack' && rand() < 0.15) {
        ctx.oppAvgDefense = Math.max(30, (ctx.oppAvgDefense || 60) - 20);
        ctx.log(window.I18N.t('ui.log.streetTrick', { name: p.name }));
      }
    },
    nutmeg(p, ctx) {
      if (ctx.event === 'ownAttack' && rand() < 0.20) {
        ctx.oppAvgDefense = 0;
        ctx.log('🧦 ' + p.name + ' TUNNEL — Defense ignoriert!');
      }
    },
    ironman_stamina(p, ctx) {
      if (ctx.event === 'statCompute' && ctx.match.round >= 5) {
        ctx.stats.tempo += 2;
      }
    },
    dynamo_power(p, ctx) {
      if (ctx.event === 'ownAttack' && ctx.match.round % 2 === 0) ctx.attackBonus += 0.06;
    },
    never_stop(p, ctx) {
      if (ctx.event === 'statCompute' && ctx.player === p) {
        ctx.stats.offense += (ctx.match.scoreOpp || 0) * 8;
      }
    },

    // ── Striker (ST) traits ────────────────────────────────────────────────
    silent_killer(p, ctx) {
      if (ctx.event === 'ownAttack' && !ctx.match.firstShotTaken) {
        ctx.attackBonus += 0.30;
        ctx.match.firstShotTaken = true;
        ctx.log(window.I18N.t('ui.log.silentKiller', { name: p.name }));
      }
    },
    predator_pounce(p, ctx) {
      if (ctx.event === 'oppAttackFailed' && rand() < 0.25) {
        ctx.match.pouncePending = true;
        ctx.log(window.I18N.t('ui.log.pounce', { name: p.name }));
      }
    },
    opportunity(p, ctx) {
      if (ctx.event === 'ownBuildupSuccess') ctx.attackBonus += 0.03;
    },
    cannon_blast(p, ctx) {
      if (ctx.event === 'ownAttack') {
        if (rand() < 0.10) {
          ctx.autoGoal = true;
          ctx.log(window.I18N.t('ui.log.cannonBlast', { name: p.name }));
        } else {
          ctx.attackBonus -= 0.05;
        }
      }
    },
    header_power(p, ctx) {
      if (ctx.event === 'ownAttack') {
        const teamVision = (ctx.match.squad || []).reduce((s, pp) => s + pp.stats.vision, 0) / 5;
        if (teamVision > 60) ctx.attackBonus += 0.15;
      }
    },
    brick_hold(p, ctx) {
      if (ctx.event === 'oppAttack' && rand() < 0.10) {
        ctx.oppAttackNegated = true;
        ctx.log('🧱 ' + p.name + ' BALLHALTEN — hält den Druck ab!');
      }
    },
    ghost_run(p, ctx) {
      if (ctx.event === 'roundStart' && rand() < 0.15) {
        ctx.match.ghostChancePending = true;
        ctx.log(window.I18N.t('ui.log.ghostRun', { name: p.name }));
      }
    },
    puzzle_connect(p, ctx) {
      if (ctx.event === 'ownGoal' && ctx.scorer?.role === 'PM') {
        ctx.match.puzzleBonus = 0.25;
      }
      if (ctx.event === 'ownAttack' && ctx.match.puzzleBonus) {
        ctx.attackBonus += ctx.match.puzzleBonus;
        ctx.match.puzzleBonus = 0;
        ctx.log(window.I18N.t('ui.log.puzzleConnect', { name: p.name }));
      }
    },
    chameleon_adapt(p, ctx) {
      if (ctx.event === 'roundStart' && ctx.match.round === 4 && !p._chameleonUsed) {
        const tmate = (ctx.match.squad || [])
          .filter(pp => pp !== p && pp.traits.length)
          .sort((a, b) => (b._triggerCount || 0) - (a._triggerCount || 0))[0];
        if (tmate) {
          p._chameleonTrait = tmate.traits[0];
          p._chameleonUsed = true;
          ctx.log('🦎 ' + p.name + ' kopiert ' + (DATA.traits[tmate.traits[0]]?.name || tmate.traits[0]) + '!');
        }
      }
      if (p._chameleonTrait && TRIGGER_HANDLERS[p._chameleonTrait]) {
        TRIGGER_HANDLERS[p._chameleonTrait](p, ctx);
      }
    },

    // ── Legendary traits ───────────────────────────────────────────────────
    // Each is a rare, match-shaping effect. Registered here so they live
    // alongside the rest of the registry and show up in the dispatcher.
    god_mode(p, ctx) {
      if (ctx.event === 'ownGoal' && !p._godModeUsed && ctx.match.scoreMe <= ctx.match.scoreOpp + 1) {
        p._godModeUsed = true;
        ctx.match.doubleNextGoal = true;
        ctx.match.tripleNextGoal = true;
        ctx.log(window.I18N.t('ui.log.godMode', { name: p.name }));
      }
    },
    clutch_dna(p, ctx) {
      if (ctx.event === 'statCompute' && ctx.player === p && ctx.match.round === 6) {
        ctx.stats.offense += 20;
        ctx.stats.composure += 10;
      }
    },
    field_general(p, ctx) {
      if (ctx.event === 'statCompute') {
        ctx.stats.offense += 4;
        ctx.stats.defense += 4;
        ctx.stats.tempo += 4;
        ctx.stats.vision += 4;
        ctx.stats.composure += 4;
      }
    },
    unbreakable(p, ctx) {
      if (ctx.event === 'oppGoal' && !p._unbreakableUsed) {
        p._unbreakableUsed = true;
        ctx.oppGoalCancelled = true;
        ctx.log(window.I18N.t('ui.log.unbreakable', { name: p.name }));
      }
    },
    big_game(p, ctx) {
      if (ctx.event === 'statCompute' && ctx.player === p && ctx.match.opp?.isBoss) {
        const focus = DATA.roles.find(r => r.id === p.role)?.focusStat || 'offense';
        ctx.stats[focus] += 15;
      }
    },
    conductor(p, ctx) {
      if (ctx.event === 'ownBuildupSuccess') {
        ctx.match._conductorStack = (ctx.match._conductorStack || 0) + 0.08;
      }
      if (ctx.event === 'ownAttack') {
        ctx.attackBonus += (ctx.match._conductorStack || 0);
      }
    },
    phoenix(p, ctx) {
      if (ctx.event === 'statCompute' && ctx.player === p) {
        if ((ctx.match.scoreOpp - ctx.match.scoreMe) >= 2) {
          ctx.stats.offense += 12;
        }
      }
    },
    ice_in_veins(p, ctx) {
      if (ctx.event === 'statCompute' && ctx.player === p) {
        ctx.stats.composure += 6;
      }
    }
  };

  // ─── Mastery handler synthesis ─────────────────────────────────────────────
  // For each stage-2 evolution with suffix `_mastery`, build a wrapper that
  // runs the parent handler, diffs ctx around the call, and amplifies any
  // observed effect by 20%. This keeps mastery logic automatically in sync.
  function buildMasteryHandlers() {
    const MASTERY_BOOST = 0.2;

    for (const [traitKey, def] of Object.entries(DATA.traits)) {
      if (!traitKey.endsWith('_mastery')) continue;
      if (TRIGGER_HANDLERS[traitKey]) continue;

      const evoId = traitKey.replace(/_mastery$/, '');
      const evo = DATA.evoDetails[evoId];
      if (!evo) continue;
      const parentTrait = evo.parentTrait;
      const parentHandler = TRIGGER_HANDLERS[parentTrait];
      if (!parentHandler) continue;

      TRIGGER_HANDLERS[traitKey] = (p, ctx) => {
        const captureStats    = ctx.stats    ? { ...ctx.stats    } : null;
        const captureOppStats = ctx.oppStats ? { ...ctx.oppStats } : null;
        const captureBuffs    = ctx.match?.teamBuffs ? { ...ctx.match.teamBuffs } : null;
        const prevAttackBonus = ctx.attackBonus || 0;

        parentHandler(p, ctx);

        if (ctx.stats && captureStats) {
          for (const k of Object.keys(ctx.stats)) {
            const delta = (ctx.stats[k] || 0) - (captureStats[k] || 0);
            if (delta !== 0) ctx.stats[k] += delta * MASTERY_BOOST;
          }
        }
        if (ctx.oppStats && captureOppStats) {
          for (const k of Object.keys(ctx.oppStats)) {
            const delta = (ctx.oppStats[k] || 0) - (captureOppStats[k] || 0);
            if (delta !== 0) ctx.oppStats[k] += delta * MASTERY_BOOST;
          }
        }
        if (ctx.match?.teamBuffs && captureBuffs) {
          for (const k of Object.keys(ctx.match.teamBuffs)) {
            const delta = (ctx.match.teamBuffs[k] || 0) - (captureBuffs[k] || 0);
            if (delta !== 0) ctx.match.teamBuffs[k] += delta * MASTERY_BOOST;
          }
        }
        if (ctx.attackBonus > prevAttackBonus) {
          const delta = ctx.attackBonus - prevAttackBonus;
          ctx.attackBonus += delta * MASTERY_BOOST;
        }
      };
    }
  }
  buildMasteryHandlers();

  // ─── Legendary trait definitions (merged into DATA.traits at load time) ────
  // Pulled from the active locale. Done once at module init — a language
  // switch after this point keeps the handlers bound to the same trait ids,
  // only the descriptive text changes (decorateConfigData handles that).
  const LEGENDARY_TRAITS = localeData().legendaryTraits || {};
  for (const [key, def] of Object.entries(LEGENDARY_TRAITS)) {
    DATA.traits[key] = def;
  }

  // ─── Fire-detection snapshot ───────────────────────────────────────────────
  // We compare a compact JSON hash of ctx's observable fields before and
  // after each handler to detect whether a handler actually did anything.
  // This is what drives the per-match trait fire report.
  function snapshotTriggerState(ctx) {
    const s = {
      attackBonus:      ctx.attackBonus,
      oppGoalCancelled: ctx.oppGoalCancelled,
      oppShotSaved:     ctx.oppShotSaved,
      oppAttackNegated: ctx.oppAttackNegated,
      autoGoal:         ctx.autoGoal,
      oppAvgDefense:    ctx.oppAvgDefense,
      guaranteedBuildup: ctx.guaranteedBuildup
    };
    if (ctx.stats) {
      s.statSum = (ctx.stats.offense || 0) + (ctx.stats.defense || 0)
        + (ctx.stats.tempo || 0) + (ctx.stats.vision || 0) + (ctx.stats.composure || 0);
    }
    if (ctx.oppStats) {
      s.oppStatSum = (ctx.oppStats.offense || 0) + (ctx.oppStats.defense || 0);
    }
    if (ctx.match) {
      const m = ctx.match;
      s.scoreMe = m.scoreMe;
      s.scoreOpp = m.scoreOpp;
      s.counterPending = m.counterPending;
      s.chainAttack = m.chainAttack;
      s.pouncePending = m.pouncePending;
      s.shadowStrikeTriggered = m.shadowStrikeTriggered;
      s.doubleNextGoal = m.doubleNextGoal;
      s.tripleNextGoal = m.tripleNextGoal;
      s.ghostChancePending = m.ghostChancePending;
      s.nextBuildupBonus = m.nextBuildupBonus;
      s.nextSaveBonus = m.nextSaveBonus;
      s.puzzleBonus = m.puzzleBonus;
      if (m.teamBuffs) {
        s.buffSum = (m.teamBuffs.offense || 0) + (m.teamBuffs.defense || 0)
          + (m.teamBuffs.tempo || 0) + (m.teamBuffs.vision || 0) + (m.teamBuffs.composure || 0);
      }
    }
    return JSON.stringify(s);
  }

  // ─── Dispatcher ────────────────────────────────────────────────────────────
  // Fires `type` to every player's every trait. Handlers push log messages
  // into match._triggerLogBuffer via a closure — we flush that buffer after
  // the round loop with flushTriggerLog.
  function dispatchTrigger(type, ctx) {
    ctx.event = type;
    ctx.triggersThisRound = ctx.triggersThisRound || 0;
    if (ctx.match && !ctx.match._triggerLogBuffer) ctx.match._triggerLogBuffer = [];
    ctx.log = (msg) => {
      if (ctx.match?._triggerLogBuffer) ctx.match._triggerLogBuffer.push(msg);
    };

    const squad = ctx.match?.squad || window.state?.roster || [];
    for (const p of squad) {
      if (!p.traits?.length) continue;
      for (const traitId of p.traits) {
        const handler = TRIGGER_HANDLERS[traitId];
        if (!handler) continue;
        const before = snapshotTriggerState(ctx);
        try {
          handler(p, ctx);
        } catch (e) {
          if (typeof console !== 'undefined' && console.warn) {
            console.warn('[Trait-Error]', traitId, 'on', p.name, '—', e.message);
          }
        }
        const after = snapshotTriggerState(ctx);
        if (before !== after) {
          ctx.triggersThisRound++;
          p._triggerCount = (p._triggerCount || 0) + 1;
          if (ctx.match) {
            ctx.match.stats.triggersFired = (ctx.match.stats.triggersFired || 0) + 1;
            // Per-trait counter for the post-match intel report
            ctx.match._traitFireCounts = ctx.match._traitFireCounts || {};
            ctx.match._traitFireCounts[traitId] = (ctx.match._traitFireCounts[traitId] || 0) + 1;
          }
        }
      }
    }
  }

  async function flushTriggerLog(match, onEvent) {
    if (!match?._triggerLogBuffer?.length) return;
    const msgs = match._triggerLogBuffer.slice();
    match._triggerLogBuffer.length = 0;
    for (const msg of msgs) {
      await onEvent({ type: 'log', cls: 'trigger', msg });
    }
  }

  // ─── Opponent traits ───────────────────────────────────────────────────────
  // Opponent traits are a flat list pulled from the locale. Their effects are
  // applied at specific evaluation points (shot chance, save penalty, build-up
  // malus, etc.) rather than via a full dispatcher — they're simpler and fewer.
  const OPP_TRAITS = Object.entries(localeData().oppTraits || {})
    .map(([id, def]) => ({ id, ...def }));

  function applyOppTraitEffect(opp, match, point, ctx = {}) {
    if (!opp.traits) return ctx;
    if (!ctx.logMsgs) ctx.logMsgs = [];

    // Log each trait effect at most once per evaluation point per match
    // (prevents identical log spam across rounds).
    const once = (key, msgPath, vars = {}) => {
      if (!match._oppTraitLogged) match._oppTraitLogged = {};
      const token = key + '@' + point;
      if (match._oppTraitLogged[token]) return;
      match._oppTraitLogged[token] = true;
      ctx.logMsgs.push(window.I18N.t(msgPath, vars));
    };

    for (const traitId of opp.traits) {
      const t = OPP_TRAITS.find(x => x.id === traitId);
      if (!t) continue;

      if (point === 'oppShotChance') {
        if (traitId === 'sturm') {
          ctx.bonus = (ctx.bonus || 0) + 0.08;
          once('sturm', 'ui.log.oppTrait.sturmShot', { name: opp.name });
        }
        if (traitId === 'sniper') {
          ctx.bonus = (ctx.bonus || 0) + 0.15;
          once('sniper', 'ui.log.oppTrait.sniperShot', { name: opp.name });
        }
      }

      if (point === 'savePenalty') {
        if (traitId === 'riegel') {
          ctx.penalty = (ctx.penalty || 0) + 0.05;
          once('riegel', 'ui.log.oppTrait.riegelDeny', { name: opp.name });
        }
      }

      if (point === 'ownBuildupChance') {
        if (traitId === 'presser_opp') {
          ctx.malus = (ctx.malus || 0) + 0.10;
          ctx._presserActive = true;
        }
      }

      if (point === 'lateGameBoost') {
        if (traitId === 'clutch_opp' && match.round >= 5) {
          ctx.offense = (ctx.offense || 0) + 10;
          ctx.tempo   = (ctx.tempo   || 0) + 5;
          once('clutch_opp', 'ui.log.oppTrait.clutchSurge', { name: opp.name });
        }
      }

      if (point === 'earlyDefense') {
        if (traitId === 'ironwall' && match.round <= 2) {
          ctx.defense = (ctx.defense || 0) + 10;
          once('ironwall', 'ui.log.oppTrait.ironwallEarly', { name: opp.name });
        }
      }

      if (point === 'counterAttack') {
        if (traitId === 'konter_opp' && rand() < 0.30) {
          ctx.triggered = true;
        }
      }
    }
    return ctx;
  }

  // ─── Namespace + legacy exports ────────────────────────────────────────────
  KL.traits = {
    TRIGGER_HANDLERS,
    OPP_TRAITS,
    LEGENDARY_TRAITS,
    dispatch:            dispatchTrigger,
    flushLog:            flushTriggerLog,
    applyOppTraitEffect
  };

  // Legacy bare-name exports so engine.js can call dispatchTrigger directly.
  Object.assign(window, {
    TRIGGER_HANDLERS,
    OPP_TRAITS,
    LEGENDARY_TRAITS,
    dispatchTrigger,
    flushTriggerLog,
    applyOppTraitEffect
  });
})();
