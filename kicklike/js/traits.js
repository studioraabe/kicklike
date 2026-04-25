(() => {
  const KL = window.KL;
  const { rand, localeData } = KL.util;
  const { DATA } = KL.config;

  const TRIGGER_HANDLERS = {
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
      // Stacks akkumulieren pro Gegentor, Bonus läuft über ctx.stats beim
      // statCompute — damit werden Base-Stats nicht permanent mutiert.
      if (ctx.event === 'afterOppGoal') {
        p._bloodScentStacks = (p._bloodScentStacks || 0) + 1;
        ctx.log('🩸 ' + p.name + ' BLUTRAUSCH +5 Def.');
      }
      if (ctx.event === 'statCompute' && ctx.player === p && p._bloodScentStacks) {
        ctx.stats.defense += 5 * p._bloodScentStacks;
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
      if (ctx.event !== 'roundStart') return;
      const r = ctx.match.round;
      // Getrennte Flags für 1. und 2. Halbzeit, damit beide Feuerungen stattfinden.
      if (r === 2 && !p._whirlwindUsed1h) {
        ctx.match.teamBuffs.tempoBonus = (ctx.match.teamBuffs.tempoBonus || 0) + 0.5;
        p._whirlwindUsed1h = true;
        ctx.log('🌪 ' + p.name + ' WIRBELWIND — doppeltes Tempo!');
      } else if (r === 5 && !p._whirlwindUsed2h) {
        ctx.match.teamBuffs.tempoBonus = (ctx.match.teamBuffs.tempoBonus || 0) + 0.5;
        p._whirlwindUsed2h = true;
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
      if (ctx.event === 'statCompute' && ctx.player === p && ctx.match.round >= 5) {
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

  function buildMasteryHandlers() {
    const MASTERY_BOOST = 0.2;

    for (const [traitKey] of Object.entries(DATA.traits)) {
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

  const LEGENDARY_TRAITS = localeData().legendaryTraits || {};
  for (const [key, def] of Object.entries(LEGENDARY_TRAITS)) {
    DATA.traits[key] = def;
  }

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

  function dispatchTrigger(type, ctx) {
    ctx.event = type;
    ctx.triggersThisRound = ctx.triggersThisRound || 0;
    if (ctx.match && !ctx.match._triggerLogBuffer) ctx.match._triggerLogBuffer = [];
    ctx.log = (msg) => {
      if (ctx.match?._triggerLogBuffer) ctx.match._triggerLogBuffer.push(msg);
    };

    // Fit-driven trait amplifier: a well-fitting kickoff tactic boosts the
    // output of passive traits (statCompute/oppStatCompute), a misfit dampens
    // them. Delta is measured per handler, then scaled — handlers themselves
    // stay unchanged and keep reading intuitively.
    const amp = ctx.match?._fitTraitAmp ?? 1.0;
    const isPassiveEvent = (type === 'statCompute' || type === 'oppStatCompute');
    const ampActive = amp !== 1.0 && isPassiveEvent;
    const statKey = type === 'statCompute' ? 'stats' : 'oppStats';

    // Passive-Fire-Dedup (v52.6): zuvor nur auf statCompute/oppStatCompute
    // beschränkt. Dadurch zählten Active-Event-Traits (shotResolve, buildupResolve,
    // save, …) bei 5 Startern × 3 Traits explosionsartig hoch — führte zu 20:1
    // "Abilities Triggered"-Verhältnissen vs. Gegner. Jetzt deduped pro
    // (Runde × Spieler × Trait) für ALLE Events. Effekt feuert wie zuvor
    // (Handler läuft IMMER, before/after-Snapshot bleibt unverändert) — nur
    // der Counter und der Match-Report-Stat bekommen den Cap.
    const dedupEnabled = KL.config.CONFIG.passiveFireDedup && ctx.match;
    if (dedupEnabled && !ctx.match._passiveFireSeen) {
      ctx.match._passiveFireSeen = {};  // key: "round:playerId:traitId" → true
    }

    const squad = ctx.match?.squad || window.state?.roster || [];
    for (const p of squad) {
      if (!p.traits?.length) continue;
      for (const traitId of p.traits) {
        const handler = TRIGGER_HANDLERS[traitId];
        if (!handler) continue;
        // v53 — Diminishing returns auf Trait-Fires pro Runde (nur ME,
        // statCompute). Begrenzt das Compound-Stacking bei evolvierten
        // Squads: die ersten 3 Fires/Runde wirken voll (1.0×), ab der
        // 4. greift 0.80, 5. = 0.60, 6.+ = 0.40. Opp-Seite ist eh dünn
        // (1-3 Traits/Match), braucht keine Bremse. Wirkt nur passiv —
        // Active-Events (Goal, Shot, Save) bleiben unbegrenzt.
        let diminish = 1.0;
        if (type === 'statCompute' && ctx.match) {
          const rank = ctx.match._traitFireRankRoundMe || 0;
          if (rank >= 3) diminish = rank === 3 ? 0.8 : rank === 4 ? 0.6 : 0.4;
        }
        const effectiveAmp = amp * diminish;
        const willScale = effectiveAmp !== 1.0 && isPassiveEvent;
        const statsBefore = (willScale && ctx[statKey]) ? { ...ctx[statKey] } : null;
        const before = snapshotTriggerState(ctx);
        try {
          handler(p, ctx);
        } catch (e) {
          if (typeof console !== 'undefined' && console.warn) {
            console.warn('[Trait-Error]', traitId, 'on', p.name, '—', e.message);
          }
        }
        if (statsBefore && ctx[statKey]) {
          for (const k of Object.keys(ctx[statKey])) {
            const delta = (ctx[statKey][k] || 0) - (statsBefore[k] || 0);
            if (delta !== 0) {
              ctx[statKey][k] = (statsBefore[k] || 0) + delta * effectiveAmp;
            }
          }
        }
        const after = snapshotTriggerState(ctx);
        if (before !== after) {
          // v52.8 — Stats counter is now ALWAYS incremented on real fires
          // (before !== after), regardless of dedup. The dedup only affects
          // the per-player/per-trait fire counts that feed UI tooltips and
          // the trait-fire-count map. Previous behavior tied stats.triggersFired
          // to the dedup gate, which produced "abilities triggered: 0" in the
          // endgame panel under certain trait/event combinations. Opp side
          // mirrors this: track() always increments stats.oppTriggersFired
          // without dedup. Symmetric, accurate, comparable.
          if (ctx.match?.stats) {
            ctx.match.stats.triggersFired = (ctx.match.stats.triggersFired || 0) + 1;
          }
          ctx.triggersThisRound++;

          // v53 — Rank-Counter nur bei first-time-dieser-Runde-Fires
          // erhöhen (gleiche Dedup-Keys wie unten). Damit zählt derselbe
          // Trait bei derselben Spielerin nicht mehrfach pro Runde gegen
          // das Diminishing.
          if (type === 'statCompute' && ctx.match && dedupEnabled) {
            const r = ctx.match.round || 0;
            const key = r + ':' + p.id + ':' + traitId;
            if (!ctx.match._passiveFireSeen[key]) {
              ctx.match._traitFireRankRoundMe = (ctx.match._traitFireRankRoundMe || 0) + 1;
            }
          }

          // Per-player/per-trait counters DO get the dedup treatment, so
          // the trait-pip glow + per-trait counts in tooltips don't visually
          // explode. Same (round × player × trait) cap as before.
          let countPerTrait = true;
          if (dedupEnabled) {
            const r = ctx.match.round || 0;
            const dedupKey = `${r}:${p.id}:${traitId}`;
            if (ctx.match._passiveFireSeen[dedupKey]) countPerTrait = false;
            else ctx.match._passiveFireSeen[dedupKey] = true;
          }
          if (countPerTrait) {
            p._triggerCount = (p._triggerCount || 0) + 1;
            if (ctx.match) {
              ctx.match._traitFireCounts = ctx.match._traitFireCounts || {};
              ctx.match._traitFireCounts[traitId] = (ctx.match._traitFireCounts[traitId] || 0) + 1;
            }
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

  const OPP_TRAITS = Object.entries(localeData().oppTraits || {})
    .map(([id, def]) => ({ id, ...def }));

  // v0.47 — Kategorisierung der 45 Player-Traits nach ihrem Timing-
  // Verhalten. Hilft im Player-Detail-Modal zu sortieren und zu
  // erkennen, wann ein Trait greift:
  //   passive     — permanent aktiv, kein Trigger nötig
  //   event       — bei spezifischem Ereignis (Save, Gegentor, Angriff)
  //   conditional — nur unter bestimmten Bedingungen (Runde, Stat-
  //                 Verhältnis, Spielstand)
  //   once        — limitiert auf 1x pro Match oder 1x pro Halbzeit
  //
  // "Passive" schließt auch Traits mit generellem pro-Runde-Prozent-
  // Trigger ein (hunter_press 15%, bulldoze 10%), weil sie keinen
  // spezifischen Auslöser brauchen — sie laufen "im Hintergrund".
  const TRAIT_CATEGORY = {
    // Passiv — permanent oder pro-Runde-Wahrscheinlichkeit
    fortress_aura:    'passive',
    offside_trap:     'passive',
    wall_effect:      'passive',
    intimidate:       'passive',
    bulldoze:         'passive',
    captain_boost:    'passive',
    hard_tackle:      'passive',
    build_from_back:  'passive',
    metronome_tempo:  'passive',
    killer_pass:      'passive',
    whisper_boost:    'passive',
    hunter_press:     'passive',
    street_trick:     'passive',
    nutmeg:           'passive',
    cannon_blast:     'passive',
    brick_hold:       'passive',
    ghost_run:        'passive',
    // Event-getriggert — reagieren auf spezifische Match-Events
    sweep_assist:     'event',
    laser_pass:       'event',
    blood_scent:      'event',
    gegenpress_steal: 'event',
    maestro_combo:    'event',
    dribble_chain:    'event',
    predator_pounce:  'event',
    opportunity:      'event',
    puzzle_connect:   'event',
    // Conditional — nur unter bestimmten Zuständen aktiv
    titan_stand:      'conditional',
    clutch_save:      'conditional',
    late_bloom:       'conditional',
    shadow_strike:    'conditional',
    symphony_pass:    'conditional',
    launch_sequence:  'conditional',
    unstoppable_run:  'conditional',
    ironman_stamina:  'conditional',
    dynamo_power:     'conditional',
    never_stop:       'conditional',
    silent_killer:    'conditional',
    header_power:     'conditional',
    chameleon_adapt:  'conditional',
    // Einmalig — hard-limitiert pro Match oder Halbzeit
    acrobat_parry:    'once',
    nine_lives:       'once',
    whirlwind_rush:   'once',
    read_game:        'once',
    chess_predict:    'once',
    speed_burst:      'once'
  };

  function holderFor(opp, traitId) {
    return opp?.traitHolders?.[traitId] || null;
  }

  function applyOppTraitEffect(opp, match, point, ctx = {}) {
    if (!opp.traits) return ctx;
    if (!ctx.logMsgs) ctx.logMsgs = [];

    // ── v52.7 — Score-adaptive opp-trait multiplier ─────────────────────
    // The opp's trait effects scale with the score gap, so trailing
    // opponents push harder for the comeback and leading opponents lock
    // down what they have. Categorized by trait disposition:
    //   offensive   — sturm, sniper, konter_opp, clutch_opp
    //   defensive   — riegel, ironwall, presser_opp
    // Multiplier curve (trailing opp, +50% on offense max):
    //   gap >= 3 → 1.5×   (desperate comeback push)
    //   gap == 2 → 1.3×
    //   gap == 1 → 1.15×
    //   gap == 0 → 1.0×   (neutral)
    //   gap == -1 → 1.0×
    //   gap == -2 → 1.15×  (defending the lead)
    //   gap <= -3 → 1.30×  (parking the bus)
    // Where "gap" = scoreMe - scoreOpp from the OPP's perspective is the
    // negative of that — we compute it as (scoreMe - scoreOpp) and flip
    // the sign for clarity. Only adjusts the relevant trait category, so
    // a leading opp's offensive sturm doesn't get nerfed when they're
    // ahead — it just doesn't get the comeback boost.
    const scoreGap = (match.scoreMe || 0) - (match.scoreOpp || 0);
    let offenseMult = 1.0;
    let defenseMult = 1.0;
    if (scoreGap >= 3)       offenseMult = 1.5;
    else if (scoreGap === 2) offenseMult = 1.3;
    else if (scoreGap === 1) offenseMult = 1.15;
    if (scoreGap <= -3)       defenseMult = 1.3;
    else if (scoreGap === -2) defenseMult = 1.15;
    const OFFENSE_TRAITS = new Set(['sturm', 'sniper', 'konter_opp', 'clutch_opp']);
    const DEFENSE_TRAITS = new Set(['riegel', 'ironwall', 'presser_opp']);
    const traitMult = (id) => {
      if (OFFENSE_TRAITS.has(id)) return offenseMult;
      if (DEFENSE_TRAITS.has(id)) return defenseMult;
      return 1.0;
    };
    // ── /v52.7 ───────────────────────────────────────────────────────────

    const once = (key, msgPath, vars = {}) => {
      // v52.6 — vorher per-Match-Dedup (token = key + '@' + point). Das
      // unterdrückte Opp-Trait-Logs nach dem ersten Feuer für den Rest des
      // Matches und ließ das Spiel einseitig wirken. Jetzt per-Runde:
      // ein Opp-Trait darf einmal pro (key × point × round) loggen, was
      // sich konsistent über Match anfühlt und zur Symmetrie mit dem
      // Player-Trait-Dedup (per-Runde) passt.
      if (!match._oppTraitLogged) match._oppTraitLogged = {};
      const token = key + '@' + point + '@r' + (match.round || 0);
      if (match._oppTraitLogged[token]) return;
      match._oppTraitLogged[token] = true;
      ctx.logMsgs.push(window.I18N.t(msgPath, vars));
    };

    // Track opponent trigger activity for the post-match stats panel.
    // Counts once per actual effect application, mirroring how player
    // trait fires are counted in dispatchTrigger.
    const track = (traitId) => {
      if (!match?.stats) return;
      match.stats.oppTriggersFired = (match.stats.oppTriggersFired || 0) + 1;
      match._oppTraitFireCounts = match._oppTraitFireCounts || {};
      match._oppTraitFireCounts[traitId] = (match._oppTraitFireCounts[traitId] || 0) + 1;
    };

    for (const traitId of opp.traits) {
      const t = OPP_TRAITS.find(x => x.id === traitId);
      if (!t) continue;
      const holder = holderFor(opp, traitId);
      const playerName = holder?.name || opp.name;

      if (point === 'oppShotChance') {
        if (traitId === 'sturm') {
          ctx.bonus = (ctx.bonus || 0) + 0.08 * traitMult('sturm');
          track('sturm');
          once('sturm', 'ui.log.oppTrait.sturmShot', { name: playerName, team: opp.name });
        }
        if (traitId === 'sniper') {
          ctx.bonus = (ctx.bonus || 0) + 0.15 * traitMult('sniper');
          track('sniper');
          once('sniper', 'ui.log.oppTrait.sniperShot', { name: playerName, team: opp.name });
        }
      }

      if (point === 'savePenalty') {
        if (traitId === 'riegel') {
          ctx.penalty = (ctx.penalty || 0) + 0.05 * traitMult('riegel');
          track('riegel');
          once('riegel', 'ui.log.oppTrait.riegelDeny', { name: playerName, team: opp.name });
        }
      }

      if (point === 'ownBuildupChance') {
        if (traitId === 'presser_opp') {
          ctx.malus = (ctx.malus || 0) + 0.10 * traitMult('presser_opp');
          ctx._presserActive = true;
          ctx._presserName = playerName;
          track('presser_opp');
        }
      }

      if (point === 'lateGameBoost') {
        if (traitId === 'clutch_opp' && match.round >= 5) {
          ctx.offense = (ctx.offense || 0) + 10 * traitMult('clutch_opp');
          ctx.tempo   = (ctx.tempo   || 0) +  5 * traitMult('clutch_opp');
          track('clutch_opp');
          once('clutch_opp', 'ui.log.oppTrait.clutchSurge', { name: playerName, team: opp.name });
        }
      }

      if (point === 'earlyDefense') {
        if (traitId === 'ironwall' && match.round <= 2) {
          ctx.defense = (ctx.defense || 0) + 10 * traitMult('ironwall');
          track('ironwall');
          once('ironwall', 'ui.log.oppTrait.ironwallEarly', { name: playerName, team: opp.name });
        }
      }

      if (point === 'counterAttack') {
        // v52.7 — counter chance scales with score gap. Trailing opp gets
        // a higher counter probability (chasing the comeback). Capped at
        // 0.45 to keep early-round counters from feeling unavoidable.
        if (traitId === 'konter_opp') {
          const counterChance = Math.min(0.45, 0.30 * traitMult('konter_opp'));
          if (rand() < counterChance) {
            ctx.triggered = true;
            ctx.counterBy = playerName;
            track('konter_opp');
          }
        }
        if (traitId === 'counter_threat') {
          const counterChance = Math.min(0.55, 0.35 * traitMult('counter_threat'));
          if (rand() < counterChance) {
            ctx.triggered = true;
            ctx.counterBy = playerName;
            track('counter_threat');
          }
        }
      }

      if (point === 'ownGoal') {
        if (traitId === 'bulwark' && !opp._bulwarkUsed) {
          if (rand() < 0.35) {
            opp._bulwarkUsed = true;
            ctx.goalCancelled = true;
            track('bulwark');
            once('bulwark', 'ui.log.oppTrait.bulwarkDeny', { name: playerName, team: opp.name });
          }
        }
      }

      if (point === 'ownBuildupChance') {
        if (traitId === 'pressing_wall') {
          ctx.malus = (ctx.malus || 0) + 0.15 * traitMult('pressing_wall');
          ctx._presserActive = true;
          ctx._presserName = playerName;
          track('pressing_wall');
        }
      }

      if (point === 'rageCheck') {
        if (traitId === 'rage_mode' && (ctx.deficit || 0) >= 2) {
          const chance = Math.min(0.55, 0.25 * traitMult('rage_mode') + ctx.deficit * 0.08);
          if (rand() < chance) {
            ctx.extraAttack = true;
            ctx.rageName = playerName;
            track('rage_mode');
          }
        }
      }
    }
    return ctx;
  }

  KL.traits = {
    TRIGGER_HANDLERS,
    OPP_TRAITS,
    LEGENDARY_TRAITS,
    TRAIT_CATEGORY,
    dispatch:            dispatchTrigger,
    flushLog:            flushTriggerLog,
    applyOppTraitEffect,
    holderFor
  };

  Object.assign(window, {
    TRIGGER_HANDLERS,
    OPP_TRAITS,
    LEGENDARY_TRAITS,
    TRAIT_CATEGORY,
    dispatchTrigger,
    flushTriggerLog,
    applyOppTraitEffect
  });
})();
