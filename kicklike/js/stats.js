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

  // v0.49 — Engine-aligned Team-Stats. Die Engine nutzt rollen-gewichtete
  // Kombinationen (nicht plain averages) um die Team-Werte zu bilden,
  // gegen die opp.stats direkt verrechnet werden. Diese Funktion stellt
  // exakt diese Gewichte nach, damit die Preview-Scorecard das zeigt
  // was die Engine tatsächlich rechnet — statt falscher Avg-Werte die
  // gegen Opp-Team-Aggregate gestellt werden.
  //
  // Gewichtungen aus js/engine.js:
  //   offense   — ST×0.50 + LF×0.28 + PM.vision×0.12 + PM.offense×0.10
  //   defense   — VT×0.45 + TW×0.55  (nur die defensiven Rollen zählen)
  //   tempo     — LF×0.50 + ST×0.30 + PM×0.20
  //   vision    — PM×0.42 + ST×0.18 + LF×0.18 + VT×0.12 + TW×0.10
  //   composure — avg aller 5 (die einzige echte Team-Mittelwert-Stat)
  //
  // Fallback: fehlt eine Rolle (z.B. kein Keeper im Preview-Kontext),
  // wird der letzte bekannte Spieler dieser Rolle eingesetzt, sonst 0.
  function teamStatsEngineAligned(lineup) {
    const byRole = {};
    for (const p of (lineup || [])) {
      if (p && p.role && !byRole[p.role]) byRole[p.role] = p.stats || {};
    }
    const st = byRole.ST || {};
    const lf = byRole.LF || st;
    const pm = byRole.PM || {};
    const vt = byRole.VT || {};
    const tw = byRole.TW || vt;

    const offense   = (st.offense || 0) * 0.50
                    + (lf.offense || 0) * 0.28
                    + (pm.vision  || 0) * 0.12
                    + (pm.offense || 0) * 0.10;
    const defense   = (vt.defense || 0) * 0.45
                    + (tw.defense || 0) * 0.55;
    const tempo     = (lf.tempo   || 0) * 0.50
                    + (st.tempo   || 0) * 0.30
                    + (pm.tempo   || 0) * 0.20;
    const vision    = (pm.vision  || 0) * 0.42
                    + (st.vision  || 0) * 0.18
                    + (lf.vision  || 0) * 0.18
                    + (vt.vision  || 0) * 0.12
                    + (tw.vision  || 0) * 0.10;
    const n = Math.max(1, (lineup || []).length);
    const composure = (lineup || []).reduce((s, p) => s + (p?.stats?.composure || 0), 0) / n;

    return {
      offense:   Math.round(offense),
      defense:   Math.round(defense),
      tempo:     Math.round(tempo),
      vision:    Math.round(vision),
      composure: Math.round(composure)
    };
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

    // ── Condition penalty ───────────────────────────────────────────────
    // A player's condition (0-100) ticks down each round from a fresh 100
    // at kickoff. Once it drops below a threshold, every stat takes a
    // cumulative hit — the player slows down, loses focus, stops finding
    // the clean touch. Sub from the bench or play a restore card to fix.
    // This is the feedback loop the Condition system creates: early
    // rounds are cheap, late rounds need maintenance.
    if (typeof player.condition === 'number') {
      let pen = 0;
      if (player.condition < 25) pen = 6;
      else if (player.condition < 50) pen = 3;
      if (pen > 0) {
        for (const k of Object.keys(stats)) stats[k] = Math.max(0, stats[k] - pen);
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
    teamStatsEngineAligned,
    teamTotalPower,
    teamStrengthLabel,
    pickThemedTactics,
    computePlayerStats,
    computeOppStats
  };

  Object.assign(window, {
    totalPower,
    squadPowerAvg,
    aggregateTeamStats,
    teamStatsEngineAligned,
    teamTotalPower,
    teamStrengthLabel,
    pickThemedTactics,
    computePlayerStats,
    computeOppStats
  });
})();
