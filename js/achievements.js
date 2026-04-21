// Achievement-Checker — läuft nach jedem Match.
// Schreibt neue achievements in state.achievements: [{ id, title, desc, matchNumber }]
// state.pendingAchievementPop speichert die in diesem Match neu gefallenen IDs, damit
// der Hub sie einmalig als gold-Flash rendern kann.

(() => {
  const KL = window.KL || (window.KL = {});

  function has(state, id) {
    return (state.achievements || []).some(a => a.id === id);
  }

  function award(state, id, vars = {}) {
    if (has(state, id)) return;
    const T = window.I18N.t.bind(window.I18N);
    const title = T(`ui.achievements.${id}.title`);
    const desc  = T(`ui.achievements.${id}.desc`, vars);
    const entry = { id, title, desc, matchNumber: state.matchNumber };
    if (!state.achievements) state.achievements = [];
    state.achievements.push(entry);
    if (!state.pendingAchievementPop) state.pendingAchievementPop = [];
    state.pendingAchievementPop.push(entry);
  }

  function checkAchievements(state, result) {
    if (!state || !result) return;
    const match = result.match;
    const squad = match?.squad || [];
    const isWin = result.result === 'win';
    const isBossMatch = match?.opp?.isBoss;

    // Hat-Trick
    for (const p of squad) {
      const g = p._matchStats?.goals || 0;
      if (g >= 3) award(state, 'hatTrickRunner', { name: p.name });
    }

    // Run-Goals-Scorer — braucht Total pro Spieler über Run.
    // Wir tracken das in p._runGoals (wird hier akkumuliert).
    for (const p of squad) {
      const g = p._matchStats?.goals || 0;
      if (g > 0) {
        p._runGoals = (p._runGoals || 0) + g;
        if (p._runGoals >= 20) award(state, 'runScorer20', { name: p.name });
        else if (p._runGoals >= 10) award(state, 'runScorer10', { name: p.name });
      }
    }

    // Trait-Triggers
    const fires = state.runTraitFires || 0;
    if (fires >= 150) award(state, 'triggers150');
    else if (fires >= 50) award(state, 'triggers50');

    // Win streak
    const ws = state.currentWinStreak || 0;
    if (ws >= 5) award(state, 'win5');
    else if (ws >= 3) award(state, 'win3');

    // Boss slayer
    if (isWin && isBossMatch) award(state, 'bossDown');

    // Clean sheet (Win ohne Gegentor)
    if (isWin && result.scoreOpp === 0) award(state, 'cleanSheet');

    // Comeback — zum Halbzeit hinten, am Ende gewonnen
    if (isWin && match?._halftimeScoreMe !== undefined && match?._halftimeScoreOpp !== undefined) {
      if (match._halftimeScoreMe < match._halftimeScoreOpp) {
        award(state, 'comeback');
      }
    }
  }

  KL.achievements = { checkAchievements };
  window.checkAchievements = checkAchievements;
})();
