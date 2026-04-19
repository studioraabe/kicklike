function pickThemedTactics(pool, n, team, phase) {
  const sigIds = team?.signatureTactics?.[phase] || [];
  const tagWeights = team?.tacticTags || {};
  const result = [];
  const sigOptions = pool.filter(t => sigIds.includes(t.id));
  if (sigOptions.length) {
    result.push(pick(sigOptions));
  }
  const remaining = pool.filter(t => !result.includes(t));
  const scored = remaining.map(t => {
    let score = 1;
    for (const tag of (t.tags || [])) {
      score += (tagWeights[tag] || 0);
    }
    return { tactic: t, score };
  });
  while (result.length < n && scored.length) {
    const totalScore = scored.reduce((s, x) => s + x.score, 0);
    let r = rand() * totalScore;
    let idx = 0;
    for (let i = 0; i < scored.length; i++) {
      r -= scored[i].score;
      if (r <= 0) { idx = i; break; }
    }
    result.push(scored[idx].tactic);
    scored.splice(idx, 1);
  }

  return result;
}
const clamp  = (v,a,b) => Math.max(a, Math.min(b, v));
const uid    = (prefix='x') => prefix + '_' + Math.random().toString(36).slice(2,9);
const $      = (sel, root=document) => root.querySelector(sel);
const $$     = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const sleep  = (ms) => new Promise(r => setTimeout(r, ms));
const tt     = (path, vars={}) => I18N.t(path, vars);
const pickLog = (path, vars={}) => I18N.pickText(path, vars);
const localeData = () => I18N.locale().data || {};

function el(tag, attrs={}, children=[]) {
  const e = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)) {
    if (k === 'class')       e.className = v;
    else if (k === 'html')   e.innerHTML = v;
    else if (k === 'onClick') e.addEventListener('click', v);
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else e.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
}
function formIndicator(form) {
  if (!form) return '';
  if (form >= 2)  return ' ^^';
  if (form === 1) return ' ^';
  if (form <= -2) return ' vv';
  if (form === -1) return ' v';
  return '';
}
const TEAM_NAME_POOLS = () => localeData().teamNamePools || {};

function generateName(teamId) {
  const pools = TEAM_NAME_POOLS();
  const pool = teamId && pools[teamId] ? pools[teamId] : null;
  if (pool) {
    return `${pick(pool.first)} ${pick(pool.last)}`;
  }
  const allFirst = Object.values(pools).flatMap(p => p.first);
  const allLast  = Object.values(pools).flatMap(p => p.last);
  return `${pick(allFirst)} ${pick(allLast)}`;
}

function makePlayer(archetypeId, opts={}) {
  const a = DATA.archetypes[archetypeId];
  const stats = {};
  for (const [k, v] of Object.entries(a.stats)) {
    stats[k] = opts.noRandom ? v : clamp(v + randi(-5, 5), 20, 99);
  }
  return {
    id: uid('p'),
    name: opts.name || generateName(opts.teamId),
    role: a.role,
    archetype: archetypeId,
    label: a.label,
    stage: opts.stage || 0,
    evoPath: [archetypeId],
    stats,
    traits: opts.traits || [],
    level: opts.level || 1,
    xp: 0,
    xpToNext: 4,
    goals: 0,
    pendingLevelUp: false,
    evolutionLevel: null,
    isLegendary: !!opts.isLegendary,
    form: 0,
    lastPerformance: 0
  };
}
const LEGENDARY_TRAITS = localeData().legendaryTraits || {};

function generateLegendaryPlayer() {
  const role = pick(['TW','VT','PM','LF','ST']);
  const stage1Options = Object.keys(DATA.evoDetails).filter(k => DATA.evoDetails[k].role === role && !DATA.evoDetails[k].inheritedFrom);
  const evoId = pick(stage1Options);
  const evo = DATA.evoDetails[evoId];
  const baseArch = Object.entries(DATA.archetypes).find(([,a]) => a.role === role);
  const [baseArchId, baseArchData] = baseArch;
  const md = (typeof state !== 'undefined' && state.matchNumber) || 5;
  let stage = 1, level = 5;
  if (md >= 10) { stage = 2; level = 9; }
  if (md >= 15) { stage = 2; level = 13; }
  const player = {
    id: uid('leg'),
    name: pick(localeData().legendaryNames || ['Nikolaus Vega']),
    role,
    archetype: evoId,
    label: evo.label + " ⚜",
    stage: 1,
    evoPath: [baseArchId, evoId],
    stats: { ...baseArchData.stats },
    traits: [],
    level,
    xp: 0,
    xpToNext: 6,
    goals: 0,
    pendingLevelUp: false,
    evolutionLevel: null,
    isLegendary: true,
    form: 0,
    lastPerformance: 0
  };
  for (const [k,v] of Object.entries(evo.boosts)) player.stats[k] = clamp((player.stats[k]||0) + v, 20, 99);
  if (evo.trait) player.traits.push(evo.trait);
  if (stage >= 2) {
    const stage2Options = (DATA.evolutions[evoId] || []);
    if (stage2Options.length) {
      const s2Id = pick(stage2Options);
      const s2 = DATA.evoDetails[s2Id];
      if (s2) {
        for (const [k,v] of Object.entries(s2.boosts || {})) player.stats[k] = clamp((player.stats[k]||0) + v, 20, 99);
        if (s2.trait && !player.traits.includes(s2.trait)) player.traits.push(s2.trait);
        player.label = s2.label + " ⚜";
        player.archetype = s2Id;
        player.evoPath.push(s2Id);
        player.stage = 2;
      }
    }
  }
  const focusStat = DATA.roles.find(r=>r.id===role).focusStat;
  player.stats[focusStat] = clamp(player.stats[focusStat] + 15, 20, 99);
  const otherStats = ['offense','defense','tempo','vision','composure'].filter(s => s !== focusStat);
  for (let i = 0; i < 5; i++) {
    const s = pick(otherStats);
    player.stats[s] = clamp(player.stats[s] + 5, 20, 99);
  }
  const legTraitKey = pick(Object.keys(LEGENDARY_TRAITS));
  player.traits.push(legTraitKey);
  return player;
}

function totalPower(squad) {
  return squad.reduce((sum, p) => sum + Object.values(p.stats).reduce((a,b)=>a+b,0), 0);
}

function squadPowerAvg(squad) {
  return Math.round(totalPower(squad) / squad.length);
}
function aggregateTeamStats(lineup) {
  const totals = { offense:0, defense:0, tempo:0, vision:0, composure:0 };
  for (const p of lineup) {
    for (const k of Object.keys(totals)) totals[k] += (p.stats[k] || 0);
  }
  const n = Math.max(1, lineup.length);
  for (const k of Object.keys(totals)) totals[k] = Math.round(totals[k] / n);
  return totals;
}
function teamTotalPower(lineup) {
  const agg = aggregateTeamStats(lineup);
  return Object.values(agg).reduce((a,b) => a+b, 0);
}
function teamStrengthLabel(teamStats) {
  const entries = Object.entries(teamStats).sort((a,b) => b[1] - a[1]);
  const labels = {
    offense:I18N.t('stats.offense'), defense:I18N.t('stats.defense'), tempo:I18N.t('stats.tempo'),
    vision:I18N.t('stats.vision'), composure:I18N.t('stats.composure')
  };
  return labels[entries[0][0]] || I18N.t('ui.labels.standard');
}

// ─── Synergy Bonus ───────────────────────────────────────────────────────────
function computeSynergyBonus(squad, activeTacticTags) {
  if (!activeTacticTags || !activeTacticTags.length) return { bonus: 0, logLines: [] };

  const tagSet = new Set(activeTacticTags);

  const ROLE_TAGS = {
    TW: ['defensiv', 'kontrolle'],
    VT: ['defensiv', 'physisch', 'pressing'],
    PM: ['ballbesitz', 'vision', 'technik', 'kontrolle'],
    LF: ['tempo', 'konter', 'aggressiv'],
    ST: ['aggressiv', 'physisch', 'technik']
  };

  const contributors = [];
  for (const p of squad) {
    if (!p.traits?.length) continue;
    const playerTags = ROLE_TAGS[p.role] || [];
    const overlap = playerTags.filter(t => tagSet.has(t)).length;
    if (overlap >= 2) {
      contributors.push(p);
    } else if (overlap === 1 && rand() < 0.35) {
      contributors.push(p);
    }
    if (contributors.length >= 2) break;
  }

  if (!contributors.length) return { bonus: 0, logLines: [] };

  const bonus = Math.min(0.06, contributors.length * 0.03);
  const bonusPct = Math.round(bonus * 100);
  const names = contributors.map(p => p.name).join(' & ');
  const traitName = contributors
    .map(p => DATA.traits[p.traits[0]]?.name || '')
    .filter(Boolean)
    .join('/');

  return {
    bonus,
    logLines: [I18N.t('ui.log.synergyBonus', { name: names, trait: traitName, bonus: bonusPct })]
  };
}

// ─── Tactic Trigger Handlers ─────────────────────────────────────────────────
const TACTIC_HANDLERS = {
  pressing_trigger: async (match, squad, onEvent) => {
    if (rand() < 0.25) {
      match.counterPending = true;
      await log(onEvent, 'trigger', I18N.t('ui.log.tacticPressingTrigger'));
    }
  },
  counter_trigger: async (match, squad, onEvent) => {
    if (rand() < 0.30) {
      match.nextBuildupBonus = (match.nextBuildupBonus || 0) + 0.12;
      await log(onEvent, 'trigger', I18N.t('ui.log.tacticCounterTrigger'));
    }
  },
  rally_trigger: async (match, squad, onEvent) => {
    const deficit = match.scoreOpp - match.scoreMe;
    if (deficit > 0) {
      match.teamBuffs.offense = (match.teamBuffs.offense || 0) + Math.round(deficit * 3);
      await log(onEvent, 'trigger', I18N.t('ui.log.tacticRallyTrigger', { bonus: Math.round(deficit * 3) }));
    }
  },
  high_press_trigger: async (match, squad, onEvent) => {
    if (rand() < 0.20) {
      match.counterPending = true;
      await log(onEvent, 'trigger', I18N.t('ui.log.tacticHighPressTrigger'));
    }
  },
  final_press_trigger: async (match, squad, onEvent) => {
    if (rand() < 0.35) {
      match.counterPending = true;
      await log(onEvent, 'trigger', I18N.t('ui.log.tacticFinalPressTrigger'));
    }
  },
  sacrifice_trigger: async (match, squad, onEvent) => {
    // handled in applyTactic directly
  }
};

async function dispatchTacticTrigger(triggerName, match, squad, onEvent) {
  if (!triggerName) return;
  const handler = TACTIC_HANDLERS[triggerName];
  if (handler) await handler(match, squad, onEvent);
}

const TRIGGER_HANDLERS = {
  "titan_stand": (p, ctx) => {
    if (ctx.event === 'oppShot' && Math.abs(ctx.match.scoreMe - ctx.match.scoreOpp) <= 1) {
      if (rand() < 0.30) { ctx.oppShotSaved = true; ctx.log('⛔ ' + p.name + ' TITANENSTAND — abgewehrt!'); }
    }
  },
  "fortress_aura": (p, ctx) => {
    if (ctx.event === 'statCompute' && ctx.player?.role === 'VT') ctx.stats.defense += 6;
  },
  "clutch_save": (p, ctx) => {
    if (ctx.event === 'oppShot' && ctx.match.round >= 5 && rand() < 0.20) {
      ctx.oppShotSaved = true; ctx.log('🧤 ' + p.name + ' CLUTCH SAVE!');
    }
  },
  "sweep_assist": (p, ctx) => {
    if (ctx.event === 'postSave') ctx.match.nextBuildupBonus = (ctx.match.nextBuildupBonus||0) + 0.08;
  },
  "laser_pass": (p, ctx) => {
    if (ctx.event === 'postSave' && rand() < 0.20) {
      ctx.match.counterPending = true;
      ctx.log(I18N.t('ui.log.laserPass', { name: p.name }));
    }
  },
  "offside_trap": (p, ctx) => {
    if (ctx.event === 'oppAttack' && rand() < 0.15) {
      ctx.oppAttackNegated = true;
      ctx.log('🚩 ' + p.name + ' Abseitsfalle!');
    }
  },
  "acrobat_parry": (p, ctx) => {
    if (ctx.event === 'oppShot' && !p._usedAcrobat) {
      ctx.match.nextSaveBonus = 0.12;
      p._usedAcrobat = true;
    }
  },
  "wall_effect": (p, ctx) => {
    if (ctx.event === 'matchStart') {
      ctx.match.teamBuffs.saveBonus = (ctx.match.teamBuffs.saveBonus||0) + 0.15;
      ctx.match.teamBuffs.buildupMalus = (ctx.match.teamBuffs.buildupMalus||0) + 0.10;
    }
  },
  "nine_lives": (p, ctx) => {
    if (ctx.event === 'oppGoal' && !p._usedNineLives) {
      ctx.oppGoalCancelled = true;
      p._usedNineLives = true;
      ctx.log(I18N.t('ui.log.nineLives', { name: p.name }));
    }
  },
  "intimidate": (p, ctx) => {
    if (ctx.event === 'oppStatCompute' && ctx.oppRole === 'ST') ctx.oppStats.offense -= 5;
  },
  "bulldoze": (p, ctx) => {
    if (ctx.event === 'oppShot' && rand() < 0.10) {
      ctx.oppShotSaved = true;
      ctx.match.counterPending = true;
      ctx.log(I18N.t('ui.log.bulldoze', { name: p.name }));
    }
  },
  "captain_boost": (p, ctx) => {
    if (ctx.event === 'statCompute') ctx.stats.composure += 3;
  },
  "blood_scent": (p, ctx) => {
    if (ctx.event === 'afterOppGoal') {
      p.stats.defense += 5; ctx.log('🩸 ' + p.name + ' BLUTRAUSCH +5 Def.');
    }
  },
  "hard_tackle": (p, ctx) => {
    if (ctx.event === 'oppAttack' && rand() < 0.20) {
      ctx.oppAttackNegated = true;
      ctx.match.counterPending = true;
      ctx.log(I18N.t('ui.log.hardTackle', { name: p.name }));
    }
  },
  "whirlwind_rush": (p, ctx) => {
    if (ctx.event === 'roundStart' && !p._whirlwindUsed && (ctx.match.round === 2 || ctx.match.round === 5)) {
      ctx.match.teamBuffs.tempoBonus = (ctx.match.teamBuffs.tempoBonus||0) + 0.5;
      p._whirlwindUsed = ctx.match.round <= 3 ? '1h' : '2h';
      ctx.log('🌪 ' + p.name + ' WIRBELWIND — doppeltes Tempo!');
    }
  },
  "build_from_back": (p, ctx) => {
    if (ctx.event === 'statCompute' && ctx.player?.role === 'PM') ctx.stats.vision += 8;
  },
  "late_bloom": (p, ctx) => {
    if (ctx.event === 'statCompute' && ctx.player === p && ctx.match.round >= 4) {
      ctx.stats.offense += 10; ctx.stats.vision += 5;
    }
  },
  "read_game": (p, ctx) => {
    if (ctx.event === 'oppAttack' && !p._readGameUsed) {
      ctx.oppAttackNegated = true; p._readGameUsed = true;
      ctx.log('🧠 ' + p.name + ' liest das Spiel perfekt!');
    }
  },
  "metronome_tempo": (p, ctx) => {
    if (ctx.event === 'roundStart') {
      p._metronomeBonus = (p._metronomeBonus||0) + 0.02;
    }
    if (ctx.event === 'ownAttack') {
      ctx.attackBonus += (p._metronomeBonus||0);
    }
  },
  "killer_pass": (p, ctx) => {
    if (ctx.event === 'ownGoal' && rand() < 0.25) {
      ctx.match.chainAttack = true;
      ctx.log(I18N.t('ui.log.killerPass', { name: p.name }));
    }
  },
  "whisper_boost": (p, ctx) => {
    if (ctx.event === 'statCompute' && ctx.player?.role === 'ST') {
      ctx.stats.composure += 8; ctx.stats.offense += 4;
    }
  },
  "hunter_press": (p, ctx) => {
    if (ctx.event === 'roundStart' && rand() < 0.15) {
      ctx.match.counterPending = true;
      ctx.log('🏹 ' + p.name + ' PRESSING-GEWINN!');
    }
  },
  "gegenpress_steal": (p, ctx) => {
    if (ctx.event === 'oppAttackFailed') {
      ctx.match.nextBuildupBonus = (ctx.match.nextBuildupBonus||0) + 0.15;
    }
  },
  "shadow_strike": (p, ctx) => {
    if (ctx.event === 'roundStart' && (ctx.match.round === 3 || ctx.match.round === 6) && rand() < 0.20) {
      ctx.match.shadowStrikeTriggered = true;
      ctx.log(I18N.t('ui.log.shadowStrike', { name: p.name }));
    }
  },
  "maestro_combo": (p, ctx) => {
    if (ctx.event === 'ownGoal') {
      ctx.match.comboCounter = (ctx.match.comboCounter||0) + 1;
      if (ctx.match.comboCounter >= 3) {
        ctx.match.doubleNextGoal = true;
        ctx.match.comboCounter = 0;
        ctx.log(I18N.t('ui.log.maestroCombo', { name: p.name }));
      }
    }
  },
  "chess_predict": (p, ctx) => {
    if (ctx.event === 'oppGoal' && !p._chessUsed) {
      ctx.oppGoalCancelled = true; p._chessUsed = true;
      ctx.log(I18N.t('ui.log.chessPredict', { name: p.name }));
    }
  },
  "symphony_pass": (p, ctx) => {
    if (ctx.event === 'ownAttack' && (ctx.match.triggersThisRound||0) >= 2) {
      ctx.attackBonus += 0.10;
    }
  },
  "speed_burst": (p, ctx) => {
    if (ctx.event === 'ownAttack' && !p._speedBurstUsed) {
      ctx.guaranteedBuildup = true; p._speedBurstUsed = true;
      ctx.log(I18N.t('ui.log.speedBurst', { name: p.name }));
    }
    if (ctx.event === 'halftime') p._speedBurstUsed = false;
  },
  "launch_sequence": (p, ctx) => {
    if (ctx.event === 'ownAttack' && ctx.match.round === 1) ctx.attackBonus += 0.20;
  },
  "unstoppable_run": (p, ctx) => {
    if (ctx.event === 'ownAttack' && p.stats.tempo > (ctx.oppAvgDefense||60) && rand() < 0.10) {
      ctx.autoGoal = true; ctx.log(I18N.t('ui.log.unstoppable', { name: p.name }));
    }
  },
  "dribble_chain": (p, ctx) => {
    if (ctx.event === 'ownGoal') p._dribbleStack = Math.min(0.25, (p._dribbleStack||0) + 0.05);
    if (ctx.event === 'ownAttack') ctx.attackBonus += (p._dribbleStack||0);
  },
  "street_trick": (p, ctx) => {
    if (ctx.event === 'ownAttack' && rand() < 0.15) {
      ctx.oppAvgDefense = Math.max(30, (ctx.oppAvgDefense||60) - 20);
      ctx.log(I18N.t('ui.log.streetTrick', { name: p.name }));
    }
  },
  "nutmeg": (p, ctx) => {
    if (ctx.event === 'ownAttack' && rand() < 0.20) {
      ctx.oppAvgDefense = 0;
      ctx.log('🧦 ' + p.name + ' TUNNEL — Defense ignoriert!');
    }
  },
  "ironman_stamina": (p, ctx) => {
    if (ctx.event === 'statCompute' && ctx.match.round >= 5) {
      ctx.stats.tempo += 2;
    }
  },
  "dynamo_power": (p, ctx) => {
    if (ctx.event === 'ownAttack' && ctx.match.round % 2 === 0) ctx.attackBonus += 0.06;
  },
  "never_stop": (p, ctx) => {
    if (ctx.event === 'statCompute' && ctx.player === p) {
      ctx.stats.offense += (ctx.match.scoreOpp || 0) * 8;
    }
  },
  "silent_killer": (p, ctx) => {
    if (ctx.event === 'ownAttack' && !ctx.match.firstShotTaken) {
      ctx.attackBonus += 0.30;
      ctx.match.firstShotTaken = true;
      ctx.log(I18N.t('ui.log.silentKiller', { name: p.name }));
    }
  },
  "predator_pounce": (p, ctx) => {
    if (ctx.event === 'oppAttackFailed' && rand() < 0.25) {
      ctx.match.pouncePending = true;
      ctx.log(I18N.t('ui.log.pounce', { name: p.name }));
    }
  },
  "opportunity": (p, ctx) => {
    if (ctx.event === 'ownBuildupSuccess') ctx.attackBonus += 0.03;
  },
  "cannon_blast": (p, ctx) => {
    if (ctx.event === 'ownAttack') {
      if (rand() < 0.10) { ctx.autoGoal = true; ctx.log(I18N.t('ui.log.cannonBlast', { name: p.name })); }
      else ctx.attackBonus -= 0.05;
    }
  },
  "header_power": (p, ctx) => {
    if (ctx.event === 'ownAttack') {
      const teamVision = (ctx.match.squad||[]).reduce((s,pp)=>s+pp.stats.vision, 0) / 5;
      if (teamVision > 60) ctx.attackBonus += 0.15;
    }
  },
  "brick_hold": (p, ctx) => {
    if (ctx.event === 'oppAttack' && rand() < 0.10) {
      ctx.oppAttackNegated = true;
      ctx.log('🧱 ' + p.name + ' BALLHALTEN — hält den Druck ab!');
    }
  },
  "ghost_run": (p, ctx) => {
    if (ctx.event === 'roundStart' && rand() < 0.15) {
      ctx.match.ghostChancePending = true;
      ctx.log(I18N.t('ui.log.ghostRun', { name: p.name }));
    }
  },
  "puzzle_connect": (p, ctx) => {
    if (ctx.event === 'ownGoal' && ctx.scorer?.role === 'PM') {
      ctx.match.puzzleBonus = 0.25;
    }
    if (ctx.event === 'ownAttack' && ctx.match.puzzleBonus) {
      ctx.attackBonus += ctx.match.puzzleBonus;
      ctx.match.puzzleBonus = 0;
      ctx.log(I18N.t('ui.log.puzzleConnect', { name: p.name }));
    }
  },
  "chameleon_adapt": (p, ctx) => {
    if (ctx.event === 'roundStart' && ctx.match.round === 4 && !p._chameleonUsed) {
      const tmate = (ctx.match.squad||[])
        .filter(pp => pp !== p && pp.traits.length)
        .sort((a,b) => (b._triggerCount||0) - (a._triggerCount||0))[0];
      if (tmate) {
        p._chameleonTrait = tmate.traits[0];
        p._chameleonUsed = true;
        ctx.log('🦎 ' + p.name + ' kopiert ' + (DATA.traits[tmate.traits[0]]?.name || tmate.traits[0]) + '!');
      }
    }
    if (p._chameleonTrait && TRIGGER_HANDLERS[p._chameleonTrait]) {
      TRIGGER_HANDLERS[p._chameleonTrait](p, ctx);
    }
  }
};
function buildMasteryHandlers() {
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
      const captureStats = ctx.stats ? { ...ctx.stats } : null;
      const captureOppStats = ctx.oppStats ? { ...ctx.oppStats } : null;
      const captureBuffs = ctx.match?.teamBuffs ? { ...ctx.match.teamBuffs } : null;
      const prevAttackBonus = ctx.attackBonus || 0;

      parentHandler(p, ctx);
      const MASTERY_BOOST = 0.2;
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
for (const [key, def] of Object.entries(LEGENDARY_TRAITS)) {
  DATA.traits[key] = def;
}
TRIGGER_HANDLERS["god_mode"] = (p, ctx) => {
  if (ctx.event === 'ownGoal' && !p._godModeUsed && ctx.match.scoreMe <= ctx.match.scoreOpp + 1) {
    p._godModeUsed = true;
    ctx.match.doubleNextGoal = true;
    ctx.match.tripleNextGoal = true;
    ctx.log(I18N.t('ui.log.godMode', { name: p.name }));
  }
};
TRIGGER_HANDLERS["clutch_dna"] = (p, ctx) => {
  if (ctx.event === 'statCompute' && ctx.player === p && ctx.match.round === 6) {
    ctx.stats.offense += 20; ctx.stats.composure += 10;
  }
};
TRIGGER_HANDLERS["field_general"] = (p, ctx) => {
  if (ctx.event === 'statCompute') {
    ctx.stats.offense += 4; ctx.stats.defense += 4;
    ctx.stats.tempo += 4; ctx.stats.vision += 4; ctx.stats.composure += 4;
  }
};
TRIGGER_HANDLERS["unbreakable"] = (p, ctx) => {
  if (ctx.event === 'oppGoal' && !p._unbreakableUsed) {
    p._unbreakableUsed = true;
    ctx.oppGoalCancelled = true;
    ctx.log(I18N.t('ui.log.unbreakable', { name: p.name }));
  }
};
TRIGGER_HANDLERS["big_game"] = (p, ctx) => {
  if (ctx.event === 'statCompute' && ctx.player === p && ctx.match.opp?.isBoss) {
    const focus = DATA.roles.find(r=>r.id===p.role)?.focusStat || 'offense';
    ctx.stats[focus] += 15;
  }
};
TRIGGER_HANDLERS["conductor"] = (p, ctx) => {
  if (ctx.event === 'ownBuildupSuccess') {
    ctx.match._conductorStack = (ctx.match._conductorStack||0) + 0.08;
  }
  if (ctx.event === 'ownAttack') {
    ctx.attackBonus += (ctx.match._conductorStack||0);
  }
};
TRIGGER_HANDLERS["phoenix"] = (p, ctx) => {
  if (ctx.event === 'statCompute' && ctx.player === p) {
    if ((ctx.match.scoreOpp - ctx.match.scoreMe) >= 2) {
      ctx.stats.offense += 12;
    }
  }
};
TRIGGER_HANDLERS["ice_in_veins"] = (p, ctx) => {
  if (ctx.event === 'statCompute' && ctx.player === p) {
    ctx.stats.composure += 6;
  }
};
const LEGENDARY_TRAIT_KEYS = new Set(Object.keys(LEGENDARY_TRAITS));
function _snapshotTriggerState(ctx) {
  const s = {
    attackBonus: ctx.attackBonus,
    oppGoalCancelled: ctx.oppGoalCancelled,
    oppShotSaved: ctx.oppShotSaved,
    oppAttackNegated: ctx.oppAttackNegated,
    autoGoal: ctx.autoGoal,
    oppAvgDefense: ctx.oppAvgDefense,
    guaranteedBuildup: ctx.guaranteedBuildup
  };
  if (ctx.stats) s.statSum = (ctx.stats.offense||0)+(ctx.stats.defense||0)+(ctx.stats.tempo||0)+(ctx.stats.vision||0)+(ctx.stats.composure||0);
  if (ctx.oppStats) s.oppStatSum = (ctx.oppStats.offense||0)+(ctx.oppStats.defense||0);
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
    if (m.teamBuffs) s.buffSum = (m.teamBuffs.offense||0)+(m.teamBuffs.defense||0)+(m.teamBuffs.tempo||0)+(m.teamBuffs.vision||0)+(m.teamBuffs.composure||0);
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
  const squad = ctx.match?.squad || state?.squad || [];
  for (const p of squad) {
    if (!p.traits?.length) continue;
    for (const traitId of p.traits) {
      const handler = TRIGGER_HANDLERS[traitId];
      if (!handler) continue;
      const before = _snapshotTriggerState(ctx);
      try {
        handler(p, ctx);
      } catch(e) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[Trait-Error]', traitId, 'on', p.name, '—', e.message);
        }
      }
      const after = _snapshotTriggerState(ctx);
      if (before !== after) {
        ctx.triggersThisRound++;
        p._triggerCount = (p._triggerCount||0) + 1;
        if (ctx.match) {
          ctx.match.stats.triggersFired = (ctx.match.stats.triggersFired||0) + 1;
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
    await log(onEvent, 'trigger', msg);
  }
}

function computePlayerStats(player, match) {
  const stats = { ...player.stats };
  const focusStat = DATA.roles.find(r => r.id === player.role)?.focusStat;
  if (focusStat && player.form) {
    stats[focusStat] = (stats[focusStat] || 0) + player.form * 2;
  }
  if (match._teamFormBonus) {
    for (const k of Object.keys(stats)) {
      stats[k] += match._teamFormBonus;
    }
  }
  const ctx = { stats, player, match };
  dispatchTrigger('statCompute', ctx);
  if (match.teamBuffs) {
    for (const [k,v] of Object.entries(match.teamBuffs)) {
      if (k in stats) stats[k] += v;
    }
  }
  return stats;
}

function computeOppStats(opp, role, match) {
  const base = { ...opp.stats };
  const ctx = { oppStats: base, oppRole: role, match };
  dispatchTrigger('oppStatCompute', ctx);
  return base;
}

const OPP_TRAITS = Object.entries(localeData().oppTraits || {}).map(([id, def]) => ({ id, ...def }));

// ─── Opponent trait effect with optional log messages ─────────────────────────
// Each call site passes a `point` string. When a trait fires visibly at that
// point the function pushes a human-readable message into ctx.logMsgs so the
// caller can flush it to the match log.  Log messages are only generated once
// per trait per match to avoid spam (tracked via match._oppTraitLogged).
function applyOppTraitEffect(opp, match, point, ctx={}) {
  if (!opp.traits) return ctx;

  if (!ctx.logMsgs) ctx.logMsgs = [];

  // Helper: fire a log message once per trait-point combo per match
  const once = (key, msgPath, vars={}) => {
    if (!match._oppTraitLogged) match._oppTraitLogged = {};
    const token = key + '@' + point;
    if (match._oppTraitLogged[token]) return;
    match._oppTraitLogged[token] = true;
    ctx.logMsgs.push(I18N.t(msgPath, vars));
  };

  for (const traitId of opp.traits) {
    const t = OPP_TRAITS.find(x => x.id === traitId);
    if (!t) continue;

    // ── sturm: accurate shots ────────────────────────────────────────────────
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

    // ── riegel: harder to save ───────────────────────────────────────────────
    if (point === 'savePenalty') {
      if (traitId === 'riegel') {
        ctx.penalty = (ctx.penalty || 0) + 0.05;
        once('riegel', 'ui.log.oppTrait.riegelDeny', { name: opp.name });
      }
    }

    // ── presser_opp: disrupts our build-up ───────────────────────────────────
    if (point === 'ownBuildupChance') {
      if (traitId === 'presser_opp') {
        ctx.malus = (ctx.malus || 0) + 0.10;
        // Log only when it actually costs us — checked by caller after rand()
        ctx._presserActive = true;
      }
    }

    // ── clutch_opp: late-game surge ──────────────────────────────────────────
    if (point === 'lateGameBoost') {
      if (traitId === 'clutch_opp' && match.round >= 5) {
        ctx.offense = (ctx.offense || 0) + 10;
        ctx.tempo   = (ctx.tempo   || 0) + 5;
        once('clutch_opp', 'ui.log.oppTrait.clutchSurge', { name: opp.name });
      }
    }

    // ── ironwall: early-game defensive wall ──────────────────────────────────
    if (point === 'earlyDefense') {
      if (traitId === 'ironwall' && match.round <= 2) {
        ctx.defense = (ctx.defense || 0) + 10;
        once('ironwall', 'ui.log.oppTrait.ironwallEarly', { name: opp.name });
      }
    }

    // ── konter_opp: instant counter on our turnover ──────────────────────────
    if (point === 'counterAttack') {
      if (traitId === 'konter_opp' && rand() < 0.30) {
        ctx.triggered = true;
        // log emitted at call site via oppBlitzCounter key (already exists)
      }
    }
  }
  return ctx;
}

// ─── Opponent generation ──────────────────────────────────────────────────────
function generateOpponent(matchNumber) {
  const isBoss = CONFIG.bossMatches.includes(matchNumber);
  const name = pick(DATA.opponents.prefixes) + pick(DATA.opponents.places);

  let basePower = 270 + Math.round(matchNumber * 14 + Math.pow(matchNumber, 1.6));
  if (matchNumber >= 8)  basePower += (matchNumber - 7) * 8;
  if (matchNumber >= 12) basePower += (matchNumber - 11) * 10;
  const bossBonus = isBoss ? 55 : 0;
  const totalStat = basePower + bossBonus;

  const special = pick(DATA.opponents.specials);
  const SPECIAL_BIAS = {
    offensive:  { offense: +0.04 },
    defensive:  { defense: +0.04 },
    pacey:      { tempo: +0.04 },
    cerebral:   { vision: +0.04 },
    stoic:      { defense: +0.02, composure: +0.02 },
    balanced:   {}
  };
  const bias = SPECIAL_BIAS[special.id] || {};
  const weights = {
    offense:   0.22 + (rand() - 0.5) * 0.08 + (bias.offense || 0),
    defense:   0.22 + (rand() - 0.5) * 0.08 + (bias.defense || 0),
    tempo:     0.20 + (rand() - 0.5) * 0.08 + (bias.tempo   || 0),
    vision:    0.18 + (rand() - 0.5) * 0.06 + (bias.vision  || 0),
    composure: 0.18 + (rand() - 0.5) * 0.06 + (bias.composure || 0)
  };
  const wSum = Object.values(weights).reduce((a,b)=>a+b, 0);
  for (const k in weights) weights[k] /= wSum;

  const baseStats = {
    offense:    Math.round(totalStat * weights.offense),
    defense:    Math.round(totalStat * weights.defense),
    tempo:      Math.round(totalStat * weights.tempo),
    vision:     Math.round(totalStat * weights.vision),
    composure:  Math.round(totalStat * weights.composure)
  };
  for (const k in baseStats) baseStats[k] = clamp(baseStats[k] + randi(-4, 4), 20, 130);
  for (const [k,v] of Object.entries(special.stats || {})) baseStats[k] += v;
  const actualPower = Object.values(baseStats).reduce((a,b) => a+b, 0);

  let traitCount = 0;
  if (matchNumber >= 6)  traitCount = 1;
  if (matchNumber >= 10) traitCount = 2;
  if (matchNumber >= 13) traitCount = 3;
  if (isBoss && matchNumber >= 5) traitCount = Math.max(traitCount, 2);
  const traits = traitCount > 0 ? pickN(OPP_TRAITS, traitCount).map(t => t.id) : [];

  return {
    name, isBoss, matchNumber,
    power: actualPower,
    stats: baseStats,
    special, traits,
    avgDefense: baseStats.defense,
    avgOffense: baseStats.offense
  };
}

async function startMatch(squad, opp, onEvent) {
  const match = {
    round: 0,
    scoreMe: 0,
    scoreOpp: 0,
    squad,
    opp,
    teamBuffs: { offense:0, defense:0, tempo:0, vision:0, composure:0 },
    buffLayers: [],
    log: [],
    triggersThisRound: 0,
    firstShotTaken: false,
    counterPending: false,
    chainAttack: false,
    pouncePending: false,
    shadowStrikeTriggered: false,
    doubleNextGoal: false,
    ghostChancePending: false,
    comboCounter: 0,
    nextBuildupBonus: 0,
    nextSaveBonus: 0,
    lastTactic: null,
    halftimeAction: null,
    finalAction: null,
    puzzleBonus: 0,
    activeTacticTags: [],
    autoCounterRoundsLeft: 0,
    doubleCounterPending: false,
    pressingRoundsLeft: 0,
    possessionActive: false,
    aggressiveRoundsLeft: 0,
    flankRoundsLeft: 0,
    rallyReactionPending: false,
    momentumCounter: 0,
    guaranteedFirstBuildup: false,
    _htPressingBlocks: 0,
    _htCountersFired: 0,
    _oppTraitLogged: {},
    _tacticFit: null,
    _tacticMisfit: null,
    _fatigue: 0,
    stats: {
      myShots: 0, myShotsOnTarget: 0, myBuildups: 0, myBuildupsSuccess: 0,
      oppShots: 0, oppShotsOnTarget: 0, oppBuildups: 0, oppBuildupsSuccess: 0,
      triggersFired: 0, saves: 0
    },
    triggerLog: []
  };
  for (const p of squad) {
    delete p._usedAcrobat; delete p._usedNineLives;
    delete p._readGameUsed; delete p._chessUsed;
    delete p._speedBurstUsed; delete p._whirlwindUsed;
    delete p._chameleonTrait; delete p._chameleonUsed;
    delete p._metronomeBonus; delete p._dribbleStack;
    delete p._triggerCount;
  }
  resetPlayerMatchStats(squad);
  const teamFormAvg = squad.reduce((s, p) => s + (p.form || 0), 0) / squad.length;
  if (teamFormAvg >= 2)       match._teamFormBonus = 3;
  else if (teamFormAvg <= -2) match._teamFormBonus = -3;
  else                        match._teamFormBonus = 0;
  match._teamFormLabel = teamFormAvg >= 2 ? 'HEISSER LAUF' : (teamFormAvg <= -2 ? 'KRISE' : null);

  await onEvent({ type:'matchStart', match });
  await log(onEvent, 'kickoff', pickLog('ui.log.matchIntro', { me: getTeamDisplayName(squad), opp: opp.name }));
  if (match._teamFormLabel === 'HEISSER LAUF') {
    await log(onEvent, 'trigger', pickLog('ui.log.formHot'));
  } else if (match._teamFormLabel === 'KRISE') {
    await log(onEvent, 'trigger', pickLog('ui.log.formCrisis'));
  }
  if (opp.special || opp.traits?.length) {
    const parts = [];
    if (opp.special) parts.push(opp.special.name);
    if (opp.traits?.length) {
      const tn = opp.traits.map(tid => OPP_TRAITS.find(x => x.id === tid)?.name || tid);
      parts.push(...tn);
    }
    await log(onEvent, 'decision', I18N.t('ui.log.opponentIntro', { parts: parts.join(' / ') }));
  }

  for (let r = 1; r <= CONFIG.rounds; r++) {
    match.round = r;
    match.triggersThisRound = 0;
    recomputeTeamBuffs(match);

    if (match.autoCounterRoundsLeft > 0) match.autoCounterRoundsLeft--;
    if (match.pressingRoundsLeft > 0)    match.pressingRoundsLeft--;
    if (match.aggressiveRoundsLeft > 0)  match.aggressiveRoundsLeft--;
    if (match.flankRoundsLeft > 0)       match.flankRoundsLeft--;

    if (r > 1) {
      const buffEntries = Object.entries(match.teamBuffs).filter(([k,v]) => Math.abs(v) >= 5 && ['offense','defense','tempo','vision','composure'].includes(k));
      if (buffEntries.length > 0) {
        const buffStr = buffEntries.map(([k,v]) => `${k.substring(0,3).toUpperCase()} ${v>0?'+':''}${v}`).join(' ');
        await log(onEvent, 'decision', I18N.t('ui.log.activeBuffs', { buffs: buffStr }));
      }
    }

    // ── Opponent late-game / early-defense trait boosts ──────────────────────
    const lateCtx = applyOppTraitEffect(match.opp, match, 'lateGameBoost', {});
    const earlyCtx = applyOppTraitEffect(match.opp, match, 'earlyDefense', {});
    match.opp._roundBuffs = {
      offense:  (lateCtx.offense || 0),
      tempo:    (lateCtx.tempo || 0),
      defense:  (earlyCtx.defense || 0)
    };
    // Flush any trait log messages from these checks
    for (const msg of (lateCtx.logMsgs || [])) await log(onEvent, 'trigger', msg);
    for (const msg of (earlyCtx.logMsgs || [])) await log(onEvent, 'trigger', msg);

    if (match.opp.traits?.includes('lucky') && !match.opp._luckyUsed && r >= 2 && rand() < 0.25) {
      match.opp._luckyUsed = true;
      match._oppLuckyPending = true;
    }
    if (r === 1) {
      UI && UI.updateRoundIndicator && UI.updateRoundIndicator(r);
      const tactic = await onEvent({ type:'interrupt', phase:'kickoff', match });
      match.lastTactic = tactic;
      applyTactic(match, tactic, 'kickoff');
      match.activeTacticTags = [...(tactic.tags || [])];
      recomputeTeamBuffs(match);
      const buffAfter = match.teamBuffs;
      const buffStr = Object.entries(buffAfter)
        .filter(([k,v]) => Math.abs(v) >= 3 && ['offense','defense','tempo','vision','composure'].includes(k))
        .map(([k,v]) => `${k.substring(0,3).toUpperCase()} ${v>0?'+':''}${v}`)
        .join('  ');
      await log(onEvent, 'decision', I18N.t('ui.log.kickoffChoice', { name: tactic.name }) + (buffStr ? `  [${buffStr}]` : ''));
      // ── Tactic fit/misfit feedback ─────────────────────────────────────────
      if (match._tacticFit === true) {
        await log(onEvent, 'trigger', I18N.t('ui.log.tacticFit', { name: tactic.name }));
      } else if (match._tacticMisfit) {
        const mf = match._tacticMisfit;
        if (mf.logKey) await log(onEvent, 'trigger', I18N.t(mf.logKey, { opp: opp.name }));
      }
      await dispatchTacticTrigger(tactic.tacticTrigger, match, squad, onEvent);
    }
    if (r === 4) {
      UI && UI.updateRoundIndicator && UI.updateRoundIndicator(r);
      const htParts = [];
      if (match._htPressingBlocks > 0) htParts.push(I18N.t('ui.log.htSummaryPressing', { n: match._htPressingBlocks }));
      if (match._htCountersFired > 0)  htParts.push(I18N.t('ui.log.htSummaryCounters', { n: match._htCountersFired }));
      if (match.momentumCounter >= 2)  htParts.push(I18N.t('ui.log.htSummaryMomentum'));
      if (htParts.length) await log(onEvent, 'decision', '  📋 ' + htParts.join(' · '));
      match._htPressingBlocks = 0;
      match._htCountersFired  = 0;

      const halftime = await onEvent({ type:'interrupt', phase:'halftime', match });
      match.halftimeAction = halftime;
      applyTactic(match, halftime, 'halftime');
      for (const tag of (halftime.tags || [])) { if (!match.activeTacticTags.includes(tag)) match.activeTacticTags.push(tag); }
      await log(onEvent, 'round-header', I18N.t('ui.log.halftimeHeader'));
      recomputeTeamBuffs(match);
      const buffAfter = match.teamBuffs;
      const buffStr = Object.entries(buffAfter)
        .filter(([k,v]) => Math.abs(v) >= 3 && ['offense','defense','tempo','vision','composure'].includes(k))
        .map(([k,v]) => `${k.substring(0,3).toUpperCase()} ${v>0?'+':''}${v}`)
        .join('  ');
      await log(onEvent, 'decision', I18N.t('ui.log.halftimeChoice', { name: halftime.name }) + (buffStr ? `  [${buffStr}]` : ''));
      for (const p of squad) { delete p._speedBurstUsed; }
      dispatchTrigger('halftime', { match });
      await flushTriggerLog(match, onEvent);
      await dispatchTacticTrigger(halftime.tacticTrigger, match, squad, onEvent);
    }
    if (r === 6) {
      UI && UI.updateRoundIndicator && UI.updateRoundIndicator(r);
      const final = await onEvent({ type:'interrupt', phase:'final', match });
      match.finalAction = final;
      applyTactic(match, final, 'final', squad, onEvent);
      for (const tag of (final.tags || [])) { if (!match.activeTacticTags.includes(tag)) match.activeTacticTags.push(tag); }
      recomputeTeamBuffs(match);
      const buffAfter = match.teamBuffs;
      const buffStr = Object.entries(buffAfter)
        .filter(([k,v]) => Math.abs(v) >= 3 && ['offense','defense','tempo','vision','composure'].includes(k))
        .map(([k,v]) => `${k.substring(0,3).toUpperCase()} ${v>0?'+':''}${v}`)
        .join('  ');
      await log(onEvent, 'decision', I18N.t('ui.log.finalChoice', { name: final.name }) + (buffStr ? `  [${buffStr}]` : ''));
      await dispatchTacticTrigger(final.tacticTrigger, match, squad, onEvent);
    }

    await log(onEvent, 'round-header', I18N.t('ui.log.roundHeader', { round: r }));
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
    if (match.shadowStrikeTriggered) {
      await attemptAttack(match, squad, onEvent, { bonusAttack: 0.15 });
      match.shadowStrikeTriggered = false;
    }
    if (match.ghostChancePending) {
      await attemptAttack(match, squad, onEvent, { bonusAttack: 0.10 });
      match.ghostChancePending = false;
    }
    const myAgg = aggregateTeamStats(squad);
    const effMy = {
      vision:    myAgg.vision + (match.teamBuffs?.vision || 0),
      composure: myAgg.composure + (match.teamBuffs?.composure || 0),
      tempo:     myAgg.tempo + (match.teamBuffs?.tempo || 0)
    };
    const rb = match.opp._roundBuffs || {};
    const effOpp = {
      vision:    match.opp.stats.vision,
      composure: match.opp.stats.composure,
      tempo:     match.opp.stats.tempo + (rb.tempo || 0)
    };
    const myControl  = effMy.vision + effMy.composure + effMy.tempo * 0.5;
    const oppControl = effOpp.vision + effOpp.composure + effOpp.tempo * 0.5;
    const myPossRaw = myControl / (myControl + oppControl);
    const myPoss = clamp(myPossRaw, 0.25, 0.75);
    match._lastPoss = Math.round(myPoss * 100);
    match.stats.possAccum = (match.stats.possAccum || 0) + myPoss;
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
      await log(onEvent, 'trigger', I18N.t('ui.log.pressingCap'));
    }

    if (match.aggressiveRoundsLeft > 0) {
      if (myAttacks === 2 && rand() < 0.40) {
        myAttacks = 3;
        await log(onEvent, 'trigger', I18N.t('ui.log.aggressiveThird'));
      }
      match._aggressiveFatigue = (match._aggressiveFatigue || 0) + 0.04;
    }

    // ── Cumulative fatigue from pressing/aggressive tactic ────────────────
    // Misfit amplifies the fatigue rate — a slow team pressing hard burns out faster.
    if (match.aggressiveRoundsLeft > 0 || match.pressingRoundsLeft > 0) {
      const mf = match._tacticMisfit;
      const fatigueMult = mf?.effects?.fatigueMult || 1.0;
      match._fatigue = Math.min(0.30, (match._fatigue || 0) + 0.022 * fatigueMult);
    }
    // Pressing collapse: misfit pressing stops working after round 2,
    // log once when it happens
    if (match._tacticMisfit?.effects?.pressingCollapseRound &&
        match.round === match._tacticMisfit.effects.pressingCollapseRound + 1 &&
        !match._pressingCollapsedLogged) {
      match._pressingCollapsedLogged = true;
      await log(onEvent, 'trigger', I18N.t('ui.log.misfitPressingCollapse'));
    }

    if (myPoss >= 0.60)      await log(onEvent, 'decision', pickLog('ui.log.possessionPressure', { pct: Math.round(myPoss*100) }));
    else if (myPoss <= 0.40) await log(onEvent, 'decision', pickLog('ui.log.possessionDominated', { pct: Math.round(myPoss*100) }));

    for (let a = 0; a < myAttacks; a++) {
      await attemptAttack(match, squad, onEvent, a > 0 ? { bonusAttack: -0.05 } : {});
    }
    if (match.chainAttack) {
      match.chainAttack = false;
      await log(onEvent, 'trigger', I18N.t('ui.log.chainAttack'));
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
      await log(onEvent, 'trigger', I18N.t('ui.log.doubleCounter'));
      await attemptAttack(match, squad, onEvent, { bonusAttack: 0.25 });
    }

    if (match._oppLuckyPending) {
      match._oppLuckyPending = false;
      await log(onEvent, 'trigger', I18N.t('ui.log.luckyDouble', { name: match.opp.name }));
      await attemptOppAttack(match, squad, onEvent);
    }
    if (match.counterPending || match.pouncePending) {
      match.counterPending = false;
      match.pouncePending = false;
      const lfForCounter = squad.find(p => p.role === 'LF');
      bumpPlayerStat(lfForCounter, 'counters');
      // Counter misfit: no fast runner — counter stalls, half the benefit
      const counterMisfitMult = match._tacticMisfit?.effects?.counterBonusMult || 1.0;
      const counterBonus = 0.15 * counterMisfitMult;
      if (counterMisfitMult < 1.0 && !match._counterMisfitLogged) {
        match._counterMisfitLogged = true;
        await log(onEvent, 'trigger', I18N.t('ui.log.misfitCounterStall'));
      }
      await log(onEvent, 'trigger', I18N.t('ui.log.counter'));
      await attemptAttack(match, squad, onEvent, { bonusAttack: counterBonus });
    }

    if (match.rallyReactionPending) {
      match.rallyReactionPending = false;
      await log(onEvent, 'trigger', I18N.t('ui.log.rallyReaction'));
      await attemptAttack(match, squad, onEvent, { bonusAttack: 0.12 });
    }

    if (match.flankRoundsLeft > 0) {
      const lf = squad.find(p => p.role === 'LF');
      if (lf) {
        const lfStats = computePlayerStats(lf, match);
        const flankChance = clamp(0.25 + (lfStats.tempo - match.opp.stats.tempo) * 0.006, 0.10, 0.65);
        if (rand() < flankChance) {
          await log(onEvent, 'trigger', I18N.t('ui.log.flankRun', { name: lf.name }));
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

    if (match.guaranteedFirstBuildup !== undefined) {
      const hadControl = (myAttacks >= 1 && oppAttacksFailed >= oppAttacksThisRound * 0.5);
      if (hadControl) {
        match.momentumCounter = (match.momentumCounter || 0) + 1;
        if (match.momentumCounter >= 2) {
          match.nextBuildupBonus = (match.nextBuildupBonus || 0) + 0.15;
          if (match.momentumCounter === 2) await log(onEvent, 'trigger', I18N.t('ui.log.momentumBuilt'));
        }
      } else {
        match.momentumCounter = 0;
      }
    }

    await onEvent({ type:'roundEnd', match });
    if (match.fastSkip !== 'test') await sleep(match.fastSkip ? 100 : 700);
  }
  let result;
  if (match.scoreMe > match.scoreOpp) result = 'win';
  else if (match.scoreMe < match.scoreOpp) result = 'loss';
  else result = 'draw';
  const isLastMatch = match.opp.matchNumber === CONFIG.runLength;
  if (result === 'draw' && isLastMatch) {
    await log(onEvent, 'kickoff', I18N.t('ui.log.penaltiesIntro', { me: match.scoreMe, opp: match.scoreOpp }));
    await log(onEvent, 'decision', I18N.t('ui.log.penaltiesTitle'));
    const myComposure = squad.reduce((s, p) => s + (p.stats.composure || 0), 0) / squad.length;
    const oppComposure = match.opp.stats.composure || 60;
    const diff = myComposure - oppComposure;
    const myHitProb = clamp(0.72 + diff * 0.005, 0.55, 0.90);
    const oppHitProb = clamp(0.72 - diff * 0.005, 0.55, 0.90);

    let myPens = 0, oppPens = 0;
    for (let i = 0; i < 5; i++) {
      if (rand() < myHitProb)  { myPens++;  await log(onEvent, '', I18N.t('ui.log.penaltyScored', { num: i + 1, me: myPens, opp: oppPens })); }
      else                     {            await log(onEvent, '', I18N.t('ui.log.penaltyMissed', { num: i + 1, me: myPens, opp: oppPens })); }
      if (rand() < oppHitProb) { oppPens++; await log(onEvent, '', I18N.t('ui.log.oppPenaltyScored', { name: match.opp.name, me: myPens, opp: oppPens })); }
      else                     {            await log(onEvent, '', I18N.t('ui.log.oppPenaltyMissed', { name: match.opp.name, me: myPens, opp: oppPens })); }
      const remaining = 5 - i - 1;
      if (Math.abs(myPens - oppPens) > remaining) break;
    }
    while (myPens === oppPens) {
      const mHit = rand() < myHitProb;
      const oHit = rand() < oppHitProb;
      if (mHit) myPens++;
      if (oHit) oppPens++;
      if (mHit !== oHit) await log(onEvent, '', I18N.t('ui.log.suddenDeath', { me: myPens, opp: oppPens }));
    }
    match.scoreMe += myPens;
    match.scoreOpp += oppPens;
    if (myPens > oppPens) {
      result = 'win';
      await log(onEvent, 'goal-me', I18N.t('ui.log.penaltiesWin'));
    } else {
      result = 'loss';
      await log(onEvent, 'goal-opp', I18N.t('ui.log.penaltiesLoss'));
    }
  }

  await log(onEvent, 'kickoff', I18N.t('ui.log.fullTime', { me: match.scoreMe, opp: match.scoreOpp }));
  const epilogueKey = result === 'win' ? 'ui.log.epilogueWin' : result === 'loss' ? 'ui.log.epilogueLoss' : 'ui.log.epilogueDraw';
  await log(onEvent, 'decision', pickLog(epilogueKey));
  await onEvent({ type:'matchEnd', match, result });
  return { scoreMe: match.scoreMe, scoreOpp: match.scoreOpp, result, match };
}

function applyTactic(match, tactic, phase, squad, onEvent) {
  if (!tactic) return;
  const RANGES = {
    kickoff:  [1, 3],
    halftime: [4, 6],
    final:    [6, 6]
  };
  const range = RANGES[phase] || [1, 6];
  const layer = { source: tactic.id + '@' + phase, range, stats: {}, special: null };

  const deficit  = Math.max(0, match.scoreOpp - match.scoreMe);
  const lead     = Math.max(0, match.scoreMe  - match.scoreOpp);
  const isTrailing = deficit > 0;
  const isLeading  = lead  > 0;

  if (phase === 'kickoff') {
    if (tactic.id === 'aggressive') {
      layer.stats = { offense: 18, defense: -8 };
      match.aggressiveRoundsLeft = 3;
    }
    if (tactic.id === 'defensive')  { layer.stats = { defense: 18, offense: -8 }; }
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
      const heroSquad = match.squad || (squad || []);
      const hero = heroSquad.slice().sort((a,b) => (b.form||0) - (a.form||0))[0] || pick(heroSquad);
      const focus = DATA.roles.find(r => r.id === hero.role)?.focusStat || 'offense';
      hero.stats[focus] = clamp(hero.stats[focus] + 30, 20, 99);
      match._hero = hero;
      return;
    }
    if (tactic.id === 'sacrifice') {
      const heroSquad = match.squad || (squad || []);
      const victim = heroSquad.slice().sort((a,b) => (b.form||0) - (a.form||0))[0] || pick(heroSquad);
      const focus = DATA.roles.find(r => r.id === victim.role)?.focusStat || 'offense';
      victim.stats[focus] = Math.max(20, victim.stats[focus] - 15);
      match._sacrificeVictim = victim;
      layer.stats = { offense: 35 };
      return match.buffLayers.push(layer) && recomputeTeamBuffs(match);
    }
  }

  // ── Tactic fit evaluation ─────────────────────────────────────────────────
  // Only evaluated on kickoff phase — that's where the structural decision is.
  // Halftime and final are reactive by design and never penalised.
  if (phase === 'kickoff' && typeof TACTIC_FIT !== 'undefined') {
    const fitDef = TACTIC_FIT[tactic.id];
    if (fitDef) {
      const currentSquad = match.squad || (squad || []);
      const isFit = fitDef.fit(currentSquad, match.opp, match);
      const oppBreached = fitDef.opponentBreachFn ? fitDef.opponentBreachFn(match.opp) : false;

      if (isFit && !oppBreached) {
        // Full tactic fit — bonus applied as a multiplier on the layer stats
        match._tacticFit = true;
        match._tacticMisfit = null;
        for (const k of Object.keys(layer.stats)) {
          if (layer.stats[k] > 0) layer.stats[k] = Math.round(layer.stats[k] * (1 + CONFIG.tacticFitBonus));
        }
      } else {
        // Misfit or opponent breaches the tactic
        match._tacticFit = false;
        match._tacticMisfit = {
          effects: fitDef.misfitEffects || {},
          logKey: fitDef.misfitKey,
          oppBreached
        };
        // Positive stat buffs reduced by misfit penalty
        for (const k of Object.keys(layer.stats)) {
          if (layer.stats[k] > 0) layer.stats[k] = Math.round(layer.stats[k] * (1 - CONFIG.tacticMisfitPenalty));
        }
      }
    }
  }

  match.buffLayers.push(layer);
  recomputeTeamBuffs(match);
}
function recomputeTeamBuffs(match) {
  const r = match.round || 1;
  const agg = { offense:0, defense:0, tempo:0, vision:0, composure:0 };
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
function bumpPlayerStat(player, key, delta=1) {
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

async function attemptAttack(match, squad, onEvent, extra={}) {
  const st = squad.find(p => p.role === 'ST');
  const lf = squad.find(p => p.role === 'LF');
  const pm = squad.find(p => p.role === 'PM');
  const vt = squad.find(p => p.role === 'VT');
  if (!st) return;

  const stStats = computePlayerStats(st, match);
  const lfStats = lf ? computePlayerStats(lf, match) : stStats;
  const pmStats = pm ? computePlayerStats(pm, match) : stStats;

  const teamOffense = (stStats.offense * 0.45 + lfStats.offense * 0.35 + pmStats.vision * 0.20);
  const teamTempo   = (lfStats.tempo * 0.5 + stStats.tempo * 0.3 + pmStats.tempo * 0.2);
  const teamComposure = squad.reduce((s, p) => s + computePlayerStats(p, match).composure, 0) / squad.length;
  const teamVision = (pmStats.vision * 0.5 + stStats.vision * 0.2 + lfStats.vision * 0.2
                   + (vt ? computePlayerStats(vt, match).vision : 50) * 0.1);
  const ctx = {
    match, attackBonus: extra.bonusAttack || 0,
    ownBuildupSuccess: false, guaranteedBuildup: false,
    autoGoal: false, scorer: st, oppAvgDefense: match.opp.avgDefense + (match.opp._roundBuffs?.defense || 0)
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

  dispatchTrigger('ownAttack', ctx);
  await flushTriggerLog(match, onEvent);

  // ── presser_opp build-up malus ────────────────────────────────────────────
  const oppPressCtx = applyOppTraitEffect(match.opp, match, 'ownBuildupChance', { malus: 0 });

  // ── Tactic misfit: buildup penalty ───────────────────────────────────────
  // defensive misfit (no vision PM) and possession misfit both reduce buildup.
  // pressing collapse after round 2 if team lacked tempo.
  let misfitBuildupMalus = 0;
  const mf = match._tacticMisfit;
  if (mf) {
    if (mf.effects.buildupChanceMult) {
      // defensive misfit: PM has no space to operate
      misfitBuildupMalus = (1 - mf.effects.buildupChanceMult) * 0.30;
    }
    if (mf.effects.pressingCollapseRound && match.round > mf.effects.pressingCollapseRound) {
      // pressing collapsed — now we're chasing with tired legs
      misfitBuildupMalus += 0.12;
    }
  }

  // ── Fatigue effect on buildup (cumulative from pressing/aggressive) ───────
  const fatigueBuildupMalus = match._fatigue * 0.4;

  const buildupChance = clamp(
    0.30 + (pmStats.vision - 55) * CONFIG.buildupVisionScale + (match.nextBuildupBonus || 0) + (ctx.attackBonus * 0.5)
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
    // Log presser_opp only when it visibly contributed to a failed build-up
    if (oppPressCtx._presserActive && rand() < 0.60) {
      await log(onEvent, 'trigger', I18N.t('ui.log.oppTrait.presserDisrupt', { name: match.opp.name }));
    }
    let buildFailKey = 'logs.ownBuildFail';
    if (match.aggressiveRoundsLeft > 0 && rand() < 0.55) {
      await log(onEvent, 'decision', pickLog('ui.log.aggressiveError'));
      buildFailKey = 'logs.ownBuildFail';
    } else if (match.possessionActive && rand() < 0.40) {
      await log(onEvent, 'decision', pickLog('ui.log.possessionLost'));
      match.counterPending = true;
    }
    await log(onEvent, '', `R${match.round}: ${pickLog(buildFailKey, { pm: pm?.name || 'PM', vt: vt?.name || 'Defense' })}`);
    const counterCtx = applyOppTraitEffect(match.opp, match, 'counterAttack', {});
    if (counterCtx.triggered) {
      await log(onEvent, 'trigger', I18N.t('ui.log.oppBlitzCounter', { name: match.opp.name }));
      await attemptOppAttack(match, squad, onEvent);
    }
    return;
  }
  match.stats.myBuildupsSuccess++;
  bumpPlayerStat(pm, 'buildupsOk');
  match._lastBuildupByPM = true;
  dispatchTrigger('ownBuildupSuccess', ctx);
  await flushTriggerLog(match, onEvent);
  await log(onEvent, '', `R${match.round}: ${pickLog('logs.ownBuildSuccess', { pm: pm?.name || 'PM', lf: lf?.name || 'Runner', vt: vt?.name || 'Defender' })}`);
  if (ctx.autoGoal) {
    const autoScorer = ctx.scorer || st;
    match.stats.myShots++; match.stats.myShotsOnTarget++;
    bumpPlayerStat(autoScorer, 'shots');
    bumpPlayerStat(autoScorer, 'shotsOnTarget');
    await recordOwnGoal(match, squad, onEvent, autoScorer, ctx);
    return;
  }
  const behindDeficit = Math.max(0, match.scoreOpp - match.scoreMe);
  const isPressure = behindDeficit > 0 || match.round >= 5;
  const composureAdvantage = isPressure
    ? ((teamComposure - ctx.match.opp.stats.composure) * 0.0015)
    : 0;
  const visionAdvantage = (teamVision - ctx.match.opp.stats.vision) * 0.001;

  const scoringChance = clamp(
    CONFIG.attackBase +
    (teamOffense - ctx.oppAvgDefense) * CONFIG.attackStatScale +
    (teamTempo > ctx.match.opp.stats.tempo ? CONFIG.tempoAdvantage : -CONFIG.tempoAdvantage*0.5) +
    composureAdvantage +
    visionAdvantage +
    ctx.attackBonus,
    0.05, 0.90
  );

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

async function recordOwnGoal(match, squad, onEvent, scorer, ctx) {
  let goalValue = 1;
  let suffix = '';
  if (match.tripleNextGoal) { goalValue = 3; match.tripleNextGoal = false; match.doubleNextGoal = false; suffix = ' (×3 GOD MODE!)'; }
  else if (match.doubleNextGoal) { goalValue = 2; match.doubleNextGoal = false; suffix = ' (×2 COMBO!)'; }
  match.scoreMe += goalValue;
  scorer.goals += 1;
  bumpPlayerStat(scorer, 'goals');
  if (ctx._synergyPair && ctx._synergyPair.a && ctx._synergyPair.b && !suffix) {
    const combo = pickLog('ui.log.synergyCombo', { a: ctx._synergyPair.a.name, b: ctx._synergyPair.b.name });
    await log(onEvent, 'goal-me', I18N.t('ui.log.ownGoalCombo', { name: scorer.name, combo, me: match.scoreMe, opp: match.scoreOpp }));
  } else {
    await log(onEvent, 'goal-me', I18N.t('ui.log.ownGoal', { name: scorer.name, suffix, me: match.scoreMe, opp: match.scoreOpp }));
  }
  dispatchTrigger('ownGoal', { ...ctx, scorer });
  await flushTriggerLog(match, onEvent);
}

async function attemptOppAttack(match, squad, onEvent) {
  const ctx = { match, oppAttackNegated: false, oppShotSaved: false, oppGoalCancelled: false };
  const opp = match.opp;
  const vt = squad.find(p => p.role === 'VT');
  const tw = squad.find(p => p.role === 'TW');

  dispatchTrigger('oppAttack', ctx);
  await flushTriggerLog(match, onEvent);
  if (ctx.oppAttackNegated) {
    if (match.pressingRoundsLeft > 0) {
      match._htPressingBlocks = (match._htPressingBlocks || 0) + 1;
    }
    if (match.autoCounterRoundsLeft > 0) {
      match._htCountersFired = (match._htCountersFired || 0) + 1;
      const lf = squad.find(p => p.role === 'LF');
      bumpPlayerStat(lf, 'counters');
      await log(onEvent, 'trigger', I18N.t('ui.log.autoCounter'));
      await attemptAttack(match, squad, onEvent, { bonusAttack: 0.20 });
    }
    dispatchTrigger('oppAttackFailed', { match });
    await flushTriggerLog(match, onEvent);
    return;
  }

  const pressMalus = match.pressingRoundsLeft > 0 ? 0.20 : 0;
  const fatigueMalus = -(match._aggressiveFatigue || 0);
  const oppBuildup = clamp(0.35 + (opp.stats.vision - 55) * 0.005 - pressMalus + fatigueMalus, 0.10, 0.85);
  match.stats.oppBuildups++;
  if (rand() > oppBuildup) {
    await log(onEvent, '', `R${match.round}: ${pickLog('logs.oppBuildFail', { opp: opp.name, vt: vt?.name || 'Defense' })}`);
    bumpPlayerStat(vt, 'defendedAttacks');
    if (match.pressingRoundsLeft > 0) {
      match._htPressingBlocks = (match._htPressingBlocks || 0) + 1;
    }
    if (match.autoCounterRoundsLeft > 0) {
      match._htCountersFired = (match._htCountersFired || 0) + 1;
      const lf = squad.find(p => p.role === 'LF');
      bumpPlayerStat(lf, 'counters');
      await log(onEvent, 'trigger', I18N.t('ui.log.autoCounter'));
      await attemptAttack(match, squad, onEvent, { bonusAttack: 0.20 });
    }
    dispatchTrigger('oppAttackFailed', { match });
    await flushTriggerLog(match, onEvent);
    return;
  }
  match.stats.oppBuildupsSuccess++;
  const vtStats = vt ? computePlayerStats(vt, match) : { defense: 55 };
  const twStats = tw ? computePlayerStats(tw, match) : { defense: 55 };

  const rb = opp._roundBuffs || {};
  let pressBreakBonus = 0;
  if (match.pressingRoundsLeft > 0) {
    pressBreakBonus = 0.12 + rand() * 0.08;
    await log(onEvent, 'decision', pickLog('ui.log.pressingBeaten', { opp: opp.name }));
  }
  const oppOff = (opp.stats.offense + (rb.offense || 0)) + (opp.stats.tempo + (rb.tempo || 0)) * 0.2;
  const myDef = vtStats.defense * 0.45 + twStats.defense * 0.55 + (match.teamBuffs?.defense || 0);
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
  const myVisionForDef = (vtStats.vision || 50) * 0.35 + (twStats.vision || 50) * 0.4 + (pmStatsForDef.vision || 50) * 0.25;
  const visionDefBonus = (myVisionForDef - opp.stats.vision) * 0.002;

  let saveChance = 0.50 + (myDef - oppOff) * CONFIG.defenseStatScale
                 + composureDefBonus + visionDefBonus
                 + (match.nextSaveBonus || 0)
                 - pressBreakBonus;
  if (match.teamBuffs?.saveBonus) saveChance += match.teamBuffs.saveBonus;

  // ── oppShotChance traits (sturm, sniper) ──────────────────────────────────
  const oppShotCtx = applyOppTraitEffect(opp, match, 'oppShotChance', { bonus: 0 });
  for (const msg of (oppShotCtx.logMsgs || [])) await log(onEvent, 'trigger', msg);

  // ── savePenalty traits (riegel) ───────────────────────────────────────────
  const oppSaveCtx = applyOppTraitEffect(opp, match, 'savePenalty', { penalty: 0 });
  for (const msg of (oppSaveCtx.logMsgs || [])) await log(onEvent, 'trigger', msg);

  saveChance -= (oppShotCtx.bonus || 0);
  saveChance -= (oppSaveCtx.penalty || 0);

  // ── Tactic misfit: defensive vulnerability ────────────────────────────────
  // tempo misfit: open space behind the line — opponent has an easier shot
  // possession misfit: ball loss leads to a more dangerous counter position
  // aggressive misfit vs pacey opponent: counter comes faster, harder to recover
  const misfitDef = match._tacticMisfit;
  if (misfitDef) {
    if (misfitDef.effects.oppCounterBonus) {
      // tempo game against faster opponent — space behind exposed
      saveChance -= misfitDef.effects.oppCounterBonus;
    }
    if (misfitDef.effects.lossConsequenceMult && match._lastBuildupFailed) {
      // possession misfit: ball was lost, now they come with numbers
      saveChance -= 0.10 * (misfitDef.effects.lossConsequenceMult - 1);
    }
    if (misfitDef.effects.paceyCounterBonus && opp.special?.id === 'pacey') {
      // aggressive misfit vs pacey opponent: worst case
      saveChance -= misfitDef.effects.paceyCounterBonus;
    }
  }

  // ── Fatigue effect on defense ─────────────────────────────────────────────
  // Tired legs mean slower tracking back and weaker positioning
  if (match._fatigue > 0) {
    saveChance -= match._fatigue * 0.35;
  }

  saveChance = clamp(saveChance, 0.12, 0.92);
  match.nextSaveBonus = 0;

  if (rand() < saveChance) {
    match.stats.saves++;
    bumpPlayerStat(tw, 'saves');
    await log(onEvent, '', `R${match.round}: ${pickLog('logs.save', { tw: tw?.name || 'Keeper', vt: vt?.name || 'Defense' })}`);
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
    if (match.finalAction?.id === 'all_in' && match.round === 6) {
      await log(onEvent, 'decision', pickLog('ui.log.allInExposed', { opp: opp.name }));
    } else if ((match.teamBuffs?.offense || 0) > 20 && (match.teamBuffs?.defense || 0) < -8) {
      await log(onEvent, 'decision', pickLog('ui.log.attackingExposed', { opp: opp.name }));
    } else if (match.aggressiveRoundsLeft > 0 && rand() < 0.50) {
      await log(onEvent, 'decision', pickLog('ui.log.aggressiveExposed', { opp: opp.name }));
    }
    await log(onEvent, 'goal-opp', I18N.t('ui.log.oppGoal', { name: opp.name, me: match.scoreMe, opp: match.scoreOpp }));
    if (match._rallyActive) match.rallyReactionPending = true;
    dispatchTrigger('afterOppGoal', { match });
    await flushTriggerLog(match, onEvent);
  }
}

function log(onEvent, cls, msg) {
  return onEvent({ type:'log', cls, msg });
}

function getTeamDisplayName(squad) {
  return (typeof state !== 'undefined' && state?.teamName) || tt('ui.hub.yourTeam');
}

window.getState = () => state;
window.setState = (nextState) => { state = nextState; return state; };
window.getLineup = getLineup;
window.getBench = getBench;
window.isLineupValid = isLineupValid;
window.pickThemedTactics = pickThemedTactics;
window.clamp = clamp;
window.uid = uid;
window.$ = $;
window.$$ = $$;
window.sleep = sleep;
window.el = el;
window.formIndicator = formIndicator;
window.generateName = generateName;
window.makePlayer = makePlayer;
window.generateLegendaryPlayer = generateLegendaryPlayer;
window.totalPower = totalPower;
window.squadPowerAvg = squadPowerAvg;
window.aggregateTeamStats = aggregateTeamStats;
window.teamTotalPower = teamTotalPower;
window.teamStrengthLabel = teamStrengthLabel;
window.computeSynergyBonus = computeSynergyBonus;
window.TACTIC_HANDLERS = TACTIC_HANDLERS;
window.dispatchTacticTrigger = dispatchTacticTrigger;
window.TRIGGER_HANDLERS = TRIGGER_HANDLERS;
window.dispatchTrigger = dispatchTrigger;
window.flushTriggerLog = flushTriggerLog;
window.computePlayerStats = computePlayerStats;
window.applyOppTraitEffect = applyOppTraitEffect;
window.generateOpponent = generateOpponent;
window.startMatch = startMatch;
window.applyTactic = applyTactic;
window.recomputeTeamBuffs = recomputeTeamBuffs;
window.bumpPlayerStat = bumpPlayerStat;
window.resetPlayerMatchStats = resetPlayerMatchStats;
window.getTeamDisplayName = getTeamDisplayName;