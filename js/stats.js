(() => {
  const KL = window.KL;
  const { rand, clamp } = KL.util;
  const { DATA } = KL.config;

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

  // Rogue-like tuning knobs — controls how deterministic the decision screen is.
  //   SIG_CHANCE   — probability the team's signature tactic appears at all.
  //                  Lower = more variance, higher = stronger team identity.
  //   Shuffle at end ensures the signature (if drawn) isn't always position 0;
  //   stops "click first option" muscle memory from being a viable strategy.
  const SIG_CHANCE = 0.55;

  function pickThemedTactics(pool, n, team, phase, match) {
    const sigIds = team?.signatureTactics?.[phase] || [];
    const tagWeights = team?.tacticTags || {};
    const result = [];

    // Context-sensitive: Taktiken mit condition() die 'miss' liefern werden
    // nur aufgenommen wenn der Kontext passt (Führung, Rückstand, Power-Diff).
    const filtered = pool.filter(t => {
      if (typeof t.condition !== 'function') return true;
      if (!match) return true; // ohne Match-Kontext alles zulassen (nie zutreffend)
      const res = t.condition(match);
      return res !== 'miss' && res !== null;
    });

    const sigOptions = filtered.filter(t => sigIds.includes(t.id));
    if (sigOptions.length && rand() < SIG_CHANCE) {
      result.push(sigOptions[Math.floor(rand() * sigOptions.length)]);
    }
    const remaining = filtered.filter(t => !result.includes(t));
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

    // Fisher-Yates shuffle — signature (if present) gets a random slot.
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    // Kickoff safety net: with the widened 1.35/0.55 fit spread, a round where
    // all three drawn options misfit the squad becomes a near-auto-loss. If
    // that happens, swap the last slot for 'balanced' (fit: () => true) so
    // the player always has an escape hatch. No-op for halftime/final — those
    // phases don't apply fit/misfit penalties.
    if (phase === 'kickoff' && match?.squad?.length) {
      const FIT = window.TACTIC_FIT || {};
      const anyFit = result.some(t => {
        const def = FIT[t.id];
        if (!def) return true;
        const fits = def.fit(match.squad, match.opp, match);
        const breached = def.opponentBreachFn ? def.opponentBreachFn(match.opp) : false;
        return fits && !breached;
      });
      if (!anyFit) {
        const balanced = pool.find(t => t.id === 'balanced');
        if (balanced && !result.includes(balanced) && result.length) {
          result[result.length - 1] = balanced;
        }
      }
    }

    return result;
  }

  // Focus-System bewusst entfernt (siehe flow.js halftime-Block). Die
  // applyActiveFocusState + Focus-Resolve-Pipeline sind weg; computePlayerStats
  // beschränkt sich auf Form, Traits, Streaks und Team-Buffs.

  function computePlayerStats(player, match) {
    if (KL.engine?.isSuspended && KL.engine.isSuspended(player, match)) {
      return { offense: 0, defense: 0, tempo: 0, vision: 0, composure: 0 };
    }

    const stats = { ...player.stats };
    const focusStat = DATA.roles.find(r => r.id === player.role)?.focusStat;

    if (focusStat && player.form) {
      // `disciplined` kickoff-Tactic nullifiziert NEGATIVE Form-Penalties
      // für das gesamte Match. Positive Form bleibt — die Tactic ist ein
      // Anti-Krise-Tool, kein Pauschalboost.
      const formForCalc = (match._formPenaltiesDisabled && player.form < 0) ? 0 : player.form;
      if (formForCalc) {
        stats[focusStat] = (stats[focusStat] || 0) + formForCalc * 2;
      }
    }
    if (match._teamFormBonus) {
      for (const k of Object.keys(stats)) stats[k] += match._teamFormBonus;
    }

    const ctx = { stats, player, match };
    if (KL.traits?.dispatch) KL.traits.dispatch('statCompute', ctx);

    if (KL.engine?.applyStreakStatMod) {
      KL.engine.applyStreakStatMod(player, match, stats);
    }

    if (match.teamBuffs) {
      for (const [k, v] of Object.entries(match.teamBuffs)) {
        if (k in stats) stats[k] += v;
      }
    }
    return stats;
  }

  function computeOppStats(opp, role, match) {
    const base = { ...opp.stats };
    const ctx = { oppStats: base, oppRole: role, match };
    if (KL.traits?.dispatch) KL.traits.dispatch('oppStatCompute', ctx);
    return base;
  }

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
