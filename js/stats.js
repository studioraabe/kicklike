// ─────────────────────────────────────────────────────────────────────────────
// stats.js — Aggregation and scoring helpers for squads
//
// Pure functions. No state mutation, no side effects. Given a squad (and
// optionally a match/opp), return numbers and labels.
//
// Exposed on KL.stats and as legacy bare-name window globals.
// ─────────────────────────────────────────────────────────────────────────────

(() => {
  const KL = window.KL;
  const { rand, clamp } = KL.util;
  const { DATA } = KL.config;

  // ─── Raw totals ────────────────────────────────────────────────────────────
  function totalPower(squad) {
    return squad.reduce(
      (sum, p) => sum + Object.values(p.stats).reduce((a, b) => a + b, 0),
      0
    );
  }

  function squadPowerAvg(squad) {
    return Math.round(totalPower(squad) / squad.length);
  }

  function aggregateTeamStats(lineup) {
    const totals = { offense: 0, defense: 0, tempo: 0, vision: 0, composure: 0 };
    for (const p of lineup) {
      for (const k of Object.keys(totals)) totals[k] += (p.stats[k] || 0);
    }
    const n = Math.max(1, lineup.length);
    for (const k of Object.keys(totals)) totals[k] = Math.round(totals[k] / n);
    return totals;
  }

  function teamTotalPower(lineup) {
    const agg = aggregateTeamStats(lineup);
    return Object.values(agg).reduce((a, b) => a + b, 0);
  }

  // Most-prominent team stat as a human label — used in hub summary.
  function teamStrengthLabel(teamStats) {
    const entries = Object.entries(teamStats).sort((a, b) => b[1] - a[1]);
    const labels = {
      offense:   window.I18N.t('stats.offense'),
      defense:   window.I18N.t('stats.defense'),
      tempo:     window.I18N.t('stats.tempo'),
      vision:    window.I18N.t('stats.vision'),
      composure: window.I18N.t('stats.composure')
    };
    return labels[entries[0][0]] || window.I18N.t('ui.labels.standard');
  }

  // ─── Synergy bonus ─────────────────────────────────────────────────────────
  // Detects players whose role naturally aligns with the active tactic tags
  // and rewards a small attack bonus. Only the first 1-2 contributors count —
  // the idea is a nod, not a stacking modifier.
  const ROLE_TAGS = {
    TW: ['defensiv', 'kontrolle'],
    VT: ['defensiv', 'physisch', 'pressing'],
    PM: ['ballbesitz', 'vision', 'technik', 'kontrolle'],
    LF: ['tempo', 'konter', 'aggressiv'],
    ST: ['aggressiv', 'physisch', 'technik']
  };

  function computeSynergyBonus(squad, activeTacticTags) {
    if (!activeTacticTags || !activeTacticTags.length) return { bonus: 0, logLines: [] };
    const tagSet = new Set(activeTacticTags);

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
      logLines: [window.I18N.t('ui.log.synergyBonus', { name: names, trait: traitName, bonus: bonusPct })]
    };
  }

  // ─── Themed tactic picking ─────────────────────────────────────────────────
  // Uses the starter-team's signature bias to pre-seed one tactic that fits
  // their identity, then weights the remainder by tag overlap with the team's
  // tactic tags. Always returns n tactics.
  function pickThemedTactics(pool, n, team, phase) {
    const sigIds = team?.signatureTactics?.[phase] || [];
    const tagWeights = team?.tacticTags || {};
    const result = [];
    const sigOptions = pool.filter(t => sigIds.includes(t.id));
    if (sigOptions.length) {
      result.push(sigOptions[Math.floor(rand() * sigOptions.length)]);
    }
    const remaining = pool.filter(t => !result.includes(t));
    const scored = remaining.map(t => {
      let score = 1;
      for (const tag of (t.tags || [])) score += (tagWeights[tag] || 0);
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

  // ─── Per-player stat computation for a match round ─────────────────────────
  // Applies, in order:
  //   1. form bias to the focus stat
  //   2. team-wide form bonus
  //   3. halftime focus effect (with fail/success resolution)
  //   4. stat-computing traits via the trigger dispatcher
  //   5. team-wide buffs from layered tactic effects
  //
  // Focus logic lives here (not in decisions.js) because it's resolved during
  // a specific round and needs to be applied consistently every time stats are
  // requested for the focused player in that round. See match._focus.* fields
  // set by decisions.js.
  function computePlayerStats(player, match) {
    const stats = { ...player.stats };
    const focusStat = DATA.roles.find(r => r.id === player.role)?.focusStat;

    if (focusStat && player.form) {
      stats[focusStat] = (stats[focusStat] || 0) + player.form * 2;
    }
    if (match._teamFormBonus) {
      for (const k of Object.keys(stats)) stats[k] += match._teamFormBonus;
    }

    // ── Focus effect: fires exactly once in _focusRound ──────────────────
    // _focusPlayerId is set in decisions.js on halftime; resolved here in the
    // round it fires. See match schema comments in engine.js.
    if (
      match._focusPlayerId &&
      player.id === match._focusPlayerId &&
      match.round === match._focusRound &&
      !match._focusResolved
    ) {
      match._focusResolved = true;
      const failRoll = Math.random();
      match._triggerLogBuffer = match._triggerLogBuffer || [];
      if (failRoll < (match._focusFailChance || 0)) {
        stats[match._focusStat] = Math.max(20, (stats[match._focusStat] || 0) - 15);
        player.form = clamp((player.form || 0) - 1, -3, 3);
        match._triggerLogBuffer.push(
          window.I18N.t('ui.log.focusFailed', { name: player.name })
        );
      } else {
        stats[match._focusStat] = clamp(
          (stats[match._focusStat] || 0) + match._focusBonus, 20, 99
        );
        match._triggerLogBuffer.push(
          window.I18N.t('ui.log.focusApplied', {
            name: player.name, stat: match._focusStat, round: match._focusRound
          })
        );
        if (match._focusRedemption) {
          player.form = clamp((player.form || 0) + 1, -3, 3);
          match.buffLayers.push({
            source: 'focus_redemption',
            range: [match.round, 6],
            stats: { composure: 4 },
            special: null
          });
          // engine.recomputeTeamBuffs is attached on KL.engine once that loads;
          // guard for the (rare) case stats is called before engine.
          if (KL.engine?.recomputeTeamBuffs) KL.engine.recomputeTeamBuffs(match);
          match._triggerLogBuffer.push(
            window.I18N.t('ui.log.focusRedemption', { name: player.name })
          );
        }
      }
    }

    // Stat-computing traits (late_bloom, fortress_aura, whisper_boost, etc.)
    const ctx = { stats, player, match };
    if (KL.traits?.dispatch) KL.traits.dispatch('statCompute', ctx);

    // Team-wide buffs — applied last so tactic effects win over trait effects.
    if (match.teamBuffs) {
      for (const [k, v] of Object.entries(match.teamBuffs)) {
        if (k in stats) stats[k] += v;
      }
    }
    return stats;
  }

  // Per-opponent-role stat computation. Mirrors computePlayerStats but uses
  // opponent traits that react to our defensive setup ("intimidate" drops the
  // opposing striker's offense, etc.).
  function computeOppStats(opp, role, match) {
    const base = { ...opp.stats };
    const ctx = { oppStats: base, oppRole: role, match };
    if (KL.traits?.dispatch) KL.traits.dispatch('oppStatCompute', ctx);
    return base;
  }

  // ─── Namespace + legacy exports ────────────────────────────────────────────
  KL.stats = {
    totalPower,
    squadPowerAvg,
    aggregateTeamStats,
    teamTotalPower,
    teamStrengthLabel,
    computeSynergyBonus,
    pickThemedTactics,
    computePlayerStats,
    computeOppStats
  };

  Object.assign(window, {
    totalPower,
    squadPowerAvg,
    aggregateTeamStats,
    teamTotalPower,
    teamStrengthLabel,
    computeSynergyBonus,
    pickThemedTactics,
    computePlayerStats,
    computeOppStats
  });
})();
