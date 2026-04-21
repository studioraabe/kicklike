function getEffectiveTeamStats(match) {
  const totals = { offense: 0, defense: 0, tempo: 0, vision: 0, composure: 0 };
  const squad = match?.squad || [];
  const count = Math.max(1, squad.length);
  for (const player of squad) {
    const stats = computePlayerStats(player, match);
    for (const key of Object.keys(totals)) totals[key] += (stats[key] || 0);
  }
  for (const key of Object.keys(totals)) totals[key] = Math.round(totals[key] / count);
  return totals;
}

function getRoleEffectiveStats(match, role) {
  const player = (match?.squad || []).find(p => p.role === role);
  return player ? computePlayerStats(player, match) : { offense: 50, defense: 50, tempo: 50, vision: 50, composure: 50 };
}

function getMatchRates(match) {
  const s = match?.stats || {};
  return {
    myBuildupRate: s.myBuildups ? Math.round((s.myBuildupsSuccess / s.myBuildups) * 100) : 0,
    oppBuildupRate: s.oppBuildups ? Math.round((s.oppBuildupsSuccess / s.oppBuildups) * 100) : 0,
    myAccuracy: s.myShots ? Math.round((s.myShotsOnTarget / s.myShots) * 100) : 0,
    oppAccuracy: s.oppShots ? Math.round((s.oppShotsOnTarget / s.oppShots) * 100) : 0
  };
}

function buildPhaseGuide(match, phase) {
  const normalizedPhase = (phase === 'halftime_focus' || phase === 'halftime_sub') ? 'halftime' : phase;
  const lines = [];
  const effTeam = getEffectiveTeamStats(match);
  const pmStats = getRoleEffectiveStats(match, 'PM');
  const lfStats = getRoleEffectiveStats(match, 'LF');
  const twStats = getRoleEffectiveStats(match, 'TW');
  const vtStats = getRoleEffectiveStats(match, 'VT');
  const rates = getMatchRates(match);
  const opp = match?.opp;
  if (!opp) return lines;

  if (normalizedPhase === 'kickoff') {
    const controlMe = effTeam.vision + Math.round(effTeam.composure * 0.95) + Math.round(effTeam.tempo * 0.60);
    const controlOpp = opp.stats.vision + Math.round(opp.stats.composure * 0.95) + Math.round((opp.stats.tempo + (opp._roundBuffs?.tempo || 0)) * 0.60);
    lines.push(I18N.t('ui.phaseGuide.kickoffBuildUp', { vision: pmStats.vision, composure: pmStats.composure }));
    lines.push(I18N.t('ui.phaseGuide.kickoffControl', { delta: `${controlMe - controlOpp >= 0 ? '+' : ''}${controlMe - controlOpp}` }));
    lines.push(I18N.t('ui.phaseGuide.kickoffWide', {
      lfTempo: lfStats.tempo,
      oppTempo: opp.stats.tempo,
      hold: Math.round(vtStats.defense * 0.45 + twStats.defense * 0.55),
      oppOffense: opp.stats.offense
    }));
  } else if (normalizedPhase === 'halftime') {
    lines.push(I18N.t('ui.phaseGuide.halftimeBuildUp', { myRate: rates.myBuildupRate, oppRate: rates.oppBuildupRate }));
    lines.push(I18N.t('ui.phaseGuide.halftimeAccuracy', { myAcc: rates.myAccuracy, oppAcc: rates.oppAccuracy }));
    lines.push(I18N.t('ui.phaseGuide.halftimeDefense', {
      hold: Math.round(vtStats.defense * 0.45 + twStats.defense * 0.55),
      saves: match.stats?.saves || 0
    }));
  } else if (normalizedPhase === 'final') {
    const scoreDiff = (match?.scoreMe || 0) - (match?.scoreOpp || 0);
    if (scoreDiff < 0) {
      lines.push(I18N.t('ui.phaseGuide.finalChaseStatus', { buildup: rates.myBuildupRate, accuracy: rates.myAccuracy }));
      lines.push(I18N.t('ui.phaseGuide.finalChaseAdvice'));
    } else if (scoreDiff > 0) {
      lines.push(I18N.t('ui.phaseGuide.finalProtectStatus', {
        oppRate: rates.oppBuildupRate,
        hold: Math.round(vtStats.defense * 0.45 + twStats.defense * 0.55)
      }));
      lines.push(I18N.t('ui.phaseGuide.finalProtectAdvice'));
    } else {
      lines.push(I18N.t('ui.phaseGuide.finalLevelStatus', {
        buildup: rates.myBuildupRate,
        accuracy: rates.myAccuracy,
        saves: match.stats?.saves || 0
      }));
      lines.push(I18N.t('ui.phaseGuide.finalLevelAdvice'));
    }
  }

  return lines.slice(0, 3);
}

// Extrahiert Bedeutungsträger aus einem Hint/Guide-Text zur Deduplikation.
// Wirft Stopwords, Satzzeichen und Prozent-/Punktations-Boilerplate raus.
// Behält Stats-Namen (vis, com, off, def, tmp), Rollen (pm, lf, st, tw, vt),
// Konzepte (build-up, control, pressing, counter) und Zahlen.
const HINT_STOPWORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being',
  'and','or','but','if','then','than','that','this','these','those',
  'for','of','to','in','on','at','by','with','from','as','into',
  'it','its','you','your','they','their','them','we','our',
  'has','have','had','will','would','should','could','can','may',
  'not','no','yes','so','too','very','just','only','more','most','less',
  'through','best','full','value','help','helps','helpful','looks','look',
  'most','some','any','many','now','early','late'
]);

function extractHintTokens(text) {
  if (!text) return new Set();
  // Split on non-word chars; keep hyphenated terms together (build-up)
  const raw = String(text).toLowerCase()
    .replace(/[,.!?:;()'"`]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const tokens = new Set();
  for (const t of raw) {
    if (t.length < 2) continue;
    if (HINT_STOPWORDS.has(t)) continue;
    // Strip trailing % from numbers but keep the number
    const cleaned = t.replace(/%$/, '');
    tokens.add(cleaned);
  }
  return tokens;
}

function buildContextHint(match, phase, state) {
  const normalizedPhase = (phase === 'halftime_focus' || phase === 'halftime_sub') ? 'halftime' : phase;
  const hints = [];
  const opp = match?.opp;
  if (!opp) return hints;
  const pmStats = getRoleEffectiveStats(match, 'PM');
  const lfStats = getRoleEffectiveStats(match, 'LF');
  const twStats = getRoleEffectiveStats(match, 'TW');
  const vtStats = getRoleEffectiveStats(match, 'VT');
  const effTeam = getEffectiveTeamStats(match);
  const rates = getMatchRates(match);

  const push = (type, text) => { if (hints.length < 3 && text) hints.push({ type, text }); };

  if (normalizedPhase === 'kickoff') {
    if (opp.isBoss) {
      push('warn', I18N.t('ui.hints.bossWarning'));
    }
    if (opp.traits?.includes('ironwall')) {
      push('warn', I18N.t('ui.hints.ironwallEarly'));
    }
    if (opp.traits?.includes('sniper') && hints.length < 2) {
      push('warn', I18N.t('ui.hints.sniperWarning'));
    }
    const lf = match.squad?.find(p => p.role === 'LF');
    if (hints.length < 3 && lf) {
      const diff = lfStats.tempo - opp.stats.tempo;
      if (diff >= 8) {
        push('good', I18N.t('ui.hints.lfTempoEdgeExact', { name: lf.name, myTempo: lfStats.tempo, oppTempo: opp.stats.tempo }));
      } else if (diff <= -8) {
        push('warn', I18N.t('ui.hints.lfTempoRiskExact', { myTempo: lfStats.tempo, oppTempo: opp.stats.tempo }));
      }
    }
    if (hints.length < 3 && (pmStats.vision < opp.stats.vision - 4 || pmStats.composure < opp.stats.composure - 4)) {
      push('warn', I18N.t('ui.hints.shakyBuildUp', { vision: pmStats.vision, composure: pmStats.composure }));
    }
    if (hints.length < 3) {
      const myHold = Math.round(vtStats.defense * 0.45 + twStats.defense * 0.55);
      if (myHold < opp.stats.offense - 4) {
        push('warn', I18N.t('ui.hints.backlineUnderPressure', { hold: myHold, oppOffense: opp.stats.offense }));
      } else if (effTeam.vision + effTeam.composure > opp.stats.vision + opp.stats.composure + 8) {
        push('good', I18N.t('ui.hints.earlyControl'));
      }
    }
    if (hints.length < 3 && opp.traits?.includes('presser_opp')) {
      push('warn', I18N.t('ui.hints.presserOppActive'));
    }
  }

  if (normalizedPhase === 'halftime') {
    const deficit = match.scoreOpp - match.scoreMe;
    const lead = match.scoreMe - match.scoreOpp;
    if (deficit >= 2) {
      push('warn', I18N.t('ui.hints.scoreTrailing'));
    } else if (lead >= 2) {
      push('good', I18N.t('ui.hints.scoreLeading'));
    }
    if (hints.length < 3 && rates.myBuildupRate <= 45) {
      push('warn', I18N.t('ui.hints.buildupLow', { rate: rates.myBuildupRate }));
    }
    if (hints.length < 3 && rates.myBuildupRate >= 50 && rates.myAccuracy <= 40 && (match.stats?.myShots || 0) >= 2) {
      push('warn', I18N.t('ui.hints.accuracyLow', { rate: rates.myAccuracy }));
    }
    if (hints.length < 3 && rates.oppBuildupRate >= 55) {
      push('warn', I18N.t('ui.hints.oppBuildupHigh', { rate: rates.oppBuildupRate }));
    }
    if (hints.length < 3 && (match._htPressingBlocks || 0) > 0) {
      push('info', I18N.t('ui.hints.pressingBlocked', { n: match._htPressingBlocks }));
    }
    if (hints.length < 3 && (match._htCountersFired || 0) > 0) {
      push('info', I18N.t('ui.hints.countersFired', { n: match._htCountersFired }));
    }
    if (hints.length < 3 && match.squad) {
      const hotPlayers = match.squad.filter(p => (p.form || 0) >= 2);
      const crisisPlayers = match.squad.filter(p => (p.form || 0) <= -2);
      if (crisisPlayers.length > 0) {
        push('warn', I18N.t('ui.hints.squadInCrisis'));
      } else if (hotPlayers.length >= 2) {
        push('good', I18N.t('ui.hints.squadInForm'));
      }
    }
    if (hints.length < 3 && opp.traits?.includes('clutch_opp')) {
      push('warn', I18N.t('ui.hints.clutchOppLate'));
    }
  }

  if (normalizedPhase === 'final') {
    const deficit = match.scoreOpp - match.scoreMe;
    const lead = match.scoreMe - match.scoreOpp;
    if (deficit > 0) {
      push('warn', I18N.t('ui.hints.scoreTrailing'));
    } else if (lead > 0) {
      push('good', I18N.t('ui.hints.scoreLeading'));
    }
    if (hints.length < 3 && deficit > 0) {
      if (rates.myBuildupRate <= 45) push('warn', I18N.t('ui.hints.finalNeedEntry', { rate: rates.myBuildupRate }));
      else push('warn', I18N.t('ui.hints.finalNeedPressure', { rate: rates.myAccuracy }));
    } else if (hints.length < 3 && lead > 0) {
      if (rates.oppBuildupRate >= 55) push('warn', I18N.t('ui.hints.oppBuildupHigh', { rate: rates.oppBuildupRate }));
      else push('good', I18N.t('ui.hints.finalProtectionWorking'));
    }
    if (hints.length < 3 && typeof getBench === 'function') {
      const bench = getBench();
      const leg = bench.find(p => p.isLegendary);
      if (leg) {
        push('info', I18N.t('ui.hints.finalLegendaryOnBench', { name: leg.name }));
      }
    }
    if (hints.length < 3 && match.activeTacticTags?.length) {
      const tags = new Set(match.activeTacticTags);
      if (tags.has('pressing') || tags.has('aggressiv')) {
        push('info', I18N.t('ui.hints.tacticSynergyKickoff'));
      }
    }
  }

  return hints;
}

const UI = {
  // Rolle-ID → englische UI-Abkürzung. Interne IDs bleiben deutsch (TW/VT/LF)
  // um Daten-Breaking zu vermeiden. Nur Display ist englisch.
  ROLE_DISPLAY: { TW:'GK', VT:'DF', PM:'PM', LF:'WG', ST:'ST' },
  roleAbbr(role) { return this.ROLE_DISPLAY[role] || role; },

  showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  },

  renderStart() {
    const hsEl = document.getElementById('start-highscore');
    if (hsEl) {
      const best = loadHighscore();
      if (best) {
        const outcomeLabel = I18N.t(`ui.labels.outcome${best.outcome.charAt(0).toUpperCase() + best.outcome.slice(1)}`);
        hsEl.textContent = I18N.t('ui.labels.highscore', { points: best.points, wins: best.wins, draws: best.draws, losses: best.losses, outcome: outcomeLabel });
      } else {
        hsEl.textContent = '';
      }
    }
    UI.showScreen('screen-start');
  },

  renderDraft() {
    const grid = $('#draft-grid');
    grid.innerHTML = '';
    DATA.starterTeams.forEach(team => {
      const preview = team.lineup.map(a => DATA.archetypes[a].label);
      const card = el('div', { class:'team-card', style:{ '--team-color': team.color } }, [
        team.logo ? el('img', { class:'team-card-logo', src: team.logo, alt: team.name }, []) : null,
        el('h2', {}, [team.name]),
        el('div', { class:'theme' }, [team.theme]),
        el('div', { class:'desc' }, [team.desc]),
        el('div', { class:'roster' }, preview.map(n => el('span', { class:'roster-chip' }, [n])))
      ]);
      card.addEventListener('click', () => FLOW.chooseStarterTeam(team));
      grid.appendChild(card);
    });
    UI.showScreen('screen-draft');
  },

  renderOpponentKeyPlayers(opp) {
    if (!opp?.lineup?.length) return null;
    const holders = opp.traitHolders || {};
    const holderEntries = Object.entries(holders);
    const wrap = el('div', { class: 'opp-keys' });

    const keeper = opp.lineup.find(p => p.role === 'TW');
    const striker = opp.lineup.find(p => p.role === 'ST');

    const shown = new Set();
    const rows = [];

    for (const [traitId, holder] of holderEntries) {
      if (!holder) continue;
      const traitDef = OPP_TRAITS.find(t => t.id === traitId);
      if (!traitDef) continue;
      rows.push({ holder, label: traitDef.name, highlight: true });
      shown.add(holder.id);
      if (rows.length >= 2) break;
    }

    if (rows.length < 2 && striker && !shown.has(striker.id)) {
      const off = striker.stats?.offense || opp.stats.offense;
      rows.push({ holder: striker, label: `${off} OFF`, highlight: false });
      shown.add(striker.id);
    }
    if (rows.length < 2 && keeper && !shown.has(keeper.id)) {
      const def = keeper.stats?.defense || opp.stats.defense;
      rows.push({ holder: keeper, label: `${def} DEF`, highlight: false });
    }

    if (!rows.length) return null;

    for (const row of rows) {
      const rowEl = el('div', { class: 'opp-key-row' + (row.highlight ? ' highlight' : '') }, [
        el('span', { class: 'opp-key-role' }, [UI.roleAbbr(row.holder.role)]),
        el('span', { class: 'opp-key-name' }, [row.holder.name]),
        el('span', { class: 'opp-key-tag' }, [row.label])
      ]);
      wrap.appendChild(rowEl);
    }

    return wrap;
  },

  renderHub() {
    // --- Zone A: Chrome ---
    $('#hub-match-num').textContent = state.matchNumber + 1;
    const matchTotal = $('#hub-match-total');
    if (matchTotal) matchTotal.textContent = CONFIG.runLength;
    $('#hub-wins').textContent = state.wins;
    $('#hub-losses').textContent = state.losses;

    const pointsEl = $('#hub-points');
    pointsEl.textContent = state.seasonPoints;
    if (state.pendingPointsPop > 0) {
      const delta = state.pendingPointsPop;
      pointsEl.classList.remove('points-pop');
      void pointsEl.offsetWidth;
      pointsEl.classList.add('points-pop');
      // Flying +3 / +1
      const flying = el('span', { class:'points-flyup' }, [`+${delta}`]);
      const host = pointsEl.parentElement;
      host.style.position = 'relative';
      host.appendChild(flying);
      setTimeout(() => flying.remove(), 1300);
      state.pendingPointsPop = 0;
    }

    const lossCell = $('#hub-losses').parentElement;
    if (state.currentLossStreak >= 2) lossCell.classList.add('danger');
    else lossCell.classList.remove('danger');

    const prog = $('#run-progress');
    prog.innerHTML = '';
    const seasonOpps = state.seasonOpponents || [];
    for (let i = 0; i < CONFIG.runLength; i++) {
      const isFinal = (i + 1) === CONFIG.runLength;
      const cell = el('div', { class:'progress-cell' + (isFinal ? ' final' : '') }, []);
      if (CONFIG.bossMatches.includes(i+1)) cell.classList.add('boss');
      if (i < state.matchHistory.length) {
        cell.classList.add('done');
        const hist = state.matchHistory[i];
        cell.classList.add(hist.result);
        cell.title = I18N.t('ui.labels.matchLabel', { num: i + 1, me: hist.scoreMe, opp: hist.scoreOpp, name: hist.opp });
      } else if (i === state.matchNumber) {
        cell.classList.add('current');
      }

      // Show the opponent logo for upcoming and finished matches when known.
      // The trophy on the final match still wins over the logo — a visible
      // tournament marker is more useful than yet another crest there.
      const oppHere = seasonOpps[i];
      if (isFinal) {
        cell.appendChild(document.createTextNode('🏆'));
      } else if (oppHere?.logo) {
        const logo = el('img', {
          class: 'progress-logo',
          src: oppHere.logo,
          alt: oppHere.name || '',
          title: oppHere.name || ''
        }, []);
        cell.appendChild(logo);
      }
      prog.appendChild(cell);
    }

    // --- Zone B: Anchor (the one picture of the match) ---
    const opp = state.currentOpponent;
    const lineup = getLineup();
    const intel = (typeof buildMatchupIntel === 'function')
      ? buildMatchupIntel(lineup, opp, state)
      : null;

    const teamFormAvg = lineup.reduce((s, p) => s + (p.form || 0), 0) / Math.max(1, lineup.length);
    const oneLiner = intel && (typeof buildIntelOneLiner === 'function')
      ? buildIntelOneLiner(intel, {
          isBoss: !!opp.isBoss,
          teamFormAvg,
          lossStreak: state.currentLossStreak || 0,
          matchNumber: state.matchNumber
        })
      : null;

    const myName = state.teamName || I18N.t('ui.hub.yourTeam');
    const oppName = opp.name;
    const myPower = intel ? intel.myEffectivePower : 0;
    const oppPower = intel ? intel.oppEffectivePower : (opp.power || 0);

    // Form indicator — small, unter dem Team-Namen
    let formChip = null;
    if (teamFormAvg >= 2)       formChip = { cls:'form-chip hot',  text:'🔥 ' + I18N.t('ui.labels.hotStreak') };
    else if (teamFormAvg >= 1)  formChip = { cls:'form-chip up',   text:'↑ '  + I18N.t('ui.labels.goodForm') };
    else if (teamFormAvg <= -2) formChip = { cls:'form-chip cold', text:'❄ '  + I18N.t('ui.labels.crisis') };
    else if (teamFormAvg <= -1) formChip = { cls:'form-chip down', text:'↓ '  + I18N.t('ui.labels.badForm') };

    // Opponent identity
    const oppTraitChips = (opp.traits || [])
      .map(tid => OPP_TRAITS.find(x => x.id === tid)?.name)
      .filter(Boolean)
      .slice(0, 2);
    const oppSpecial = opp.special?.name;

    // Win-Probability wurde durch das Matchup-Scorecard ersetzt (siehe unten).
    // Die Funktion bleibt in intel.js exportiert — die Engine nutzt sie noch
    // für interne Pre-Match-Events.

    const anchor = $('#hub-anchor');
    anchor.innerHTML = '';

    const topRow = el('div', { class:'anchor-top' }, [
      el('div', { class:'anchor-side me' }, [
        el('div', { class:'anchor-side-label mono-sm' }, [I18N.t('ui.hub.yourTeam')]),
        state.teamLogo
          ? el('img', { class:'anchor-logo', src: state.teamLogo, alt: myName }, [])
          : null,
        el('div', { class:'anchor-side-name' }, [myName]),
        formChip ? el('div', { class: formChip.cls }, [formChip.text]) : null
      ]),
      el('div', { class:'anchor-mid' }, [
        el('div', { class:'anchor-vs' }, [I18N.t('ui.hub.vs')]),
        el('div', { class:'anchor-match-num' }, [`#${state.matchNumber + 1}`])
      ]),
      el('div', { class:'anchor-side opp' }, [
        el('div', { class:'anchor-side-label mono-sm' }, [I18N.t('ui.hub.opponent')]),
        opp.logo
          ? el('img', { class:'anchor-logo', src: opp.logo, alt: oppName }, [])
          : null,
        el('div', { class:'anchor-side-name ' + (opp.isBoss ? 'boss' : '') }, [(opp.isBoss ? '🏆 ' : '') + oppName]),
        opp.isBoss || oppSpecial || oppTraitChips.length
          ? el('div', { class:'anchor-opp-tags' }, [
              opp.isBoss   ? el('span', { class:'opp-tag boss' },    [(() => { const v = I18N.t('ui.hub.bossTag'); return v === 'ui.hub.bossTag' ? 'BOSS' : v; })()]) : null,
              oppSpecial   ? el('span', { class:'opp-tag special' }, [oppSpecial]) : null,
              ...oppTraitChips.map(t => el('span', { class:'opp-tag' }, [t]))
            ])
          : null
      ])
    ]);
    anchor.appendChild(topRow);

    // Matchup Scorecard — replaces the old Win/Draw/Loss bar.
    // Three rows: (1) threat/edge chip row, (2) five attribute split bars,
    // (3) trait activity line. The estimator is still exported for the
    // engine, but no longer shapes the hub UI.
    const scorecard = (typeof window.buildMatchupScorecard === 'function')
      ? window.buildMatchupScorecard(lineup, opp)
      : null;

    if (scorecard) {
      const T = I18N.t.bind(I18N);
      // I18N.t returns the key itself when the key is missing, so a plain
      // `|| 'FALLBACK'` never triggers. This helper inspects the return value
      // and falls back to the English literal if no translation was found.
      const tOr = (key, fallback) => {
        const v = T(key);
        return (v === key) ? fallback : v;
      };
      const chip = (count, max = 5) =>
        '▰'.repeat(count) + '▱'.repeat(Math.max(0, max - count));

      // Row 1: edge (left, matches your team) & threat (right, matches opp).
      // Tooltips via native title attr — explain what the chips actually mean
      // for this specific matchup.
      const threatText = tOr('ui.scorecard.threat', 'THREAT');
      const edgeText   = tOr('ui.scorecard.edge',   'EDGE');
      const edgeTooltip = tOr('ui.scorecard.edgeTooltip',
        'Your advantages: traits that counter this opponent plus any stat surplus. ' +
        'Independent of Threat — you can have both high.');
      const threatTooltip = tOr('ui.scorecard.threatTooltip',
        'Their danger to you: opponent traits that hurt your squad plus any raw power gap. ' +
        'Independent of Edge — you can have both high.');
      const topEdgeLine = scorecard.topEdge   ? '\n• ' + scorecard.topEdge   : '';
      const topThreatLine = scorecard.topThreat ? '\n• ' + scorecard.topThreat : '';

      const chipRow = el('div', { class:'sc-chips' }, [
        el('div', {
          class:'sc-chip sc-edge',
          title: edgeTooltip + (topEdgeLine ? '\n\nThis match:' + topEdgeLine : '')
        }, [
          el('span', { class:'sc-chip-label' }, [edgeText]),
          el('span', { class:'sc-chip-level' }, [chip(scorecard.edge)])
        ]),
        el('div', {
          class:'sc-chip sc-threat',
          title: threatTooltip + (topThreatLine ? '\n\nThis match:' + topThreatLine : '')
        }, [
          el('span', { class:'sc-chip-label' }, [threatText]),
          el('span', { class:'sc-chip-level' }, [chip(scorecard.threat)])
        ])
      ]);
      anchor.appendChild(chipRow);

      // Row 2: five attribute split bars. Each bar is split proportionally
      // between "me" (green) and "opp" (red), so visual weight = stat size.
      const statLabels = {
        offense:   tOr('ui.scorecard.off', 'OFF'),
        defense:   tOr('ui.scorecard.def', 'DEF'),
        tempo:     tOr('ui.scorecard.tmp', 'TMP'),
        vision:    tOr('ui.scorecard.vis', 'VIS'),
        composure: tOr('ui.scorecard.cmp', 'CMP')
      };
      const barsRow = el('div', { class:'sc-bars' }, scorecard.stats.map(s => {
        const total = Math.max(1, s.me + s.opp);
        const mePct  = (s.me  / total * 100).toFixed(1);
        const oppPct = (s.opp / total * 100).toFixed(1);
        const leading = s.diff > 0 ? 'me' : (s.diff < 0 ? 'opp' : 'even');
        return el('div', { class:'sc-bar-row' }, [
          el('span', { class:'sc-bar-label' }, [statLabels[s.stat] || s.stat.toUpperCase()]),
          el('span', { class:'sc-bar-me-val' },  [String(s.me)]),
          el('div',  { class:'sc-bar lead-' + leading }, [
            el('div', { class:'sc-bar-me',  style:{ width: mePct  + '%' } }, []),
            el('div', { class:'sc-bar-opp', style:{ width: oppPct + '%' } }, [])
          ]),
          el('span', { class:'sc-bar-opp-val' }, [String(s.opp)])
        ]);
      }));
      anchor.appendChild(barsRow);

      // Row 3: trait activity line.
      const traitLineText = tOr('ui.scorecard.traitActivity',
        '~{n} trait triggers expected · {p} passives active')
        .replace('{n}', scorecard.triggersExpected)
        .replace('{p}', scorecard.passiveCount);
      const traitLine = el('div', { class:'sc-trait-line mono-sm' }, [traitLineText]);
      anchor.appendChild(traitLine);
    }

    if (oneLiner && oneLiner.headline) {
      // Verdict-Bar ("New Challenger", "Close match", etc.) wurde entfernt —
      // das meiste davon ist bei Threat/Edge-Chips und Form-Chip bereits
      // sichtbar. Die Headline bleibt als einzige Freitext-Insight, weil sie
      // matchup-spezifisch ist ("Stat-driven match, no big trait matchups").
      // Boss-Status kommt über das 🏆-Prefix im opp-Namen + BOSS-Tag.
      anchor.appendChild(el('div', { class:'anchor-headline' }, [oneLiner.headline]));
    }

    // --- Run-Chips: Traits / Goals / Evos / Streak — kleine Dopamin-Zähler ---
    const chipsBox = $('#hub-run-chips');
    if (chipsBox) {
      chipsBox.innerHTML = '';
      const maxEvos = 5 * 3;
      const evoCount = state.runEvoCount || 0;
      const traitFires = state.runTraitFires || 0;
      const runGoals = state.goalsFor || 0;
      const winStreak = state.currentWinStreak || 0;

      const chips = [
        { icon:'🎯', text: I18N.t('ui.hub.chipTraits', { n: traitFires }), tone: traitFires >= 50 ? 'hot' : '' },
        { icon:'⚽', text: I18N.t('ui.hub.chipGoals',  { n: runGoals }),   tone: runGoals   >= 10 ? 'hot' : '' },
        { icon:'✦',  text: I18N.t('ui.hub.chipEvos',   { done: evoCount, max: maxEvos }), tone: evoCount >= 10 ? 'hot' : '' }
      ];
      if (winStreak >= 2) chips.push({ icon:'🔥', text: I18N.t('ui.hub.chipStreak', { n: winStreak }), tone: 'streak' });

      for (const c of chips) {
        chipsBox.appendChild(el('div', { class:'run-chip ' + (c.tone || '') }, [
          el('span', { class:'chip-icon' }, [c.icon]),
          el('span', { class:'chip-text' }, [c.text])
        ]));
      }
    }

    // --- Achievement-Flash: gerade gefallene Achievements ---
    const flashBox = $('#hub-achievement-flash');
    if (flashBox) {
      flashBox.innerHTML = '';
      const pending = state.pendingAchievementPop || [];
      for (const ach of pending) {
        flashBox.appendChild(el('div', { class:'achievement-flash' }, [
          el('span', { class:'ach-star' }, ['✦']),
          el('div', { class:'ach-body' }, [
            el('div', { class:'ach-title' }, [ach.title]),
            el('div', { class:'ach-desc' }, [ach.desc])
          ])
        ]));
      }
      state.pendingAchievementPop = [];
    }

    // --- Alerts ---
    const alertsBox = $('#hub-alerts');
    alertsBox.innerHTML = '';
    for (const p of lineup) {
      const suspendedNext = p._suspendedUntil && p._suspendedUntil > state.matchNumber;
      if (suspendedNext) {
        const matchesLeft = p._suspendedUntil - state.matchNumber;
        const tipKey = 'ui.hub.suspendedAlertTooltip';
        let tip = I18N.t(tipKey, { name: p.name, n: matchesLeft });
        if (tip === tipKey) {
          // Fallback, falls der i18n-Key noch nicht übersetzt ist.
          tip = `${p.name}: red card in the previous match. `
              + `Suspended for ${matchesLeft} more match${matchesLeft === 1 ? '' : 'es'}. `
              + `Substitute from the bench before starting.`;
        }
        alertsBox.appendChild(el('div', { class:'hub-alert suspend', title: tip }, [
          '⏸ ' + I18N.t('ui.hub.suspendedAlert', { name: p.name })
        ]));
      }
    }
    if (state.currentLossStreak === 2) {
      alertsBox.appendChild(el('div', { class:'hub-alert danger' }, [
        I18N.t('ui.labels.losingWarning')
      ]));
    }

    // --- Squad ---
    const sqBox = $('#hub-squad');
    sqBox.innerHTML = '';
    lineup.forEach(p => {
      const card = UI.renderPlayerCard(p, { showStatDiff: true });
      sqBox.appendChild(card);
    });

    const bench = getBench();
    const benchWrap = $('#hub-bench-wrap');
    if (bench.length > 0) {
      benchWrap.style.display = 'block';
      const benchBox = $('#hub-bench');
      benchBox.innerHTML = '';
      bench.forEach(p => {
        const card = UI.renderPlayerCard(p, { bench: true, showStatDiff: true });
        benchBox.appendChild(card);
      });
    } else {
      benchWrap.style.display = 'none';
    }

    UI.showScreen('screen-hub');
  },

  // Tap-Detail: Spieler anklicken im Hub → volles Info-Modal.
  showPlayerDetail(p) {
    if (!p) return;
    const T = I18N.t.bind(I18N);
    const stageSymbols = ['★', '★★', '★★★'];
    const roleLabel = DATA.roles.find(r => r.id === p.role)?.label || p.role;
    const suspendedNext = p._suspendedUntil && window.state && p._suspendedUntil > window.state.matchNumber;
    const runGoals = p._runGoals || 0;

    const modal = $('#interrupt-modal');
    const overlay = $('#interrupt-overlay');
    modal.innerHTML = '';
    modal.classList.remove('interrupt-modal--event');

    // Header: Rolle + Stage + Name
    modal.appendChild(el('div', { class:'pd-head' }, [
      el('div', { class:'pd-role-line' }, [
        el('span', { class:'pd-role' }, [UI.roleAbbr(p.role)]),
        el('span', { class:'pd-stage' }, [stageSymbols[p.stage] || '★']),
        el('span', { class:'pd-role-label' }, [roleLabel])
      ]),
      el('h2', { class:'pd-name' }, [p.name]),
      p.label ? el('div', { class:'pd-archetype mono-sm' }, [p.label]) : null
    ]));

    // Status-Badges (Sperre, Karte)
    const statusBadges = [];
    if (suspendedNext) statusBadges.push({ cls:'pd-badge warn', text:'⏸ ' + T('ui.detail.suspended') });
    if (statusBadges.length) {
      modal.appendChild(el('div', { class:'pd-status-row' },
        statusBadges.map(b => el('div', { class:b.cls }, [b.text]))
      ));
    }

    // Level + XP-Bar
    const xpPct = Math.min(100, (p.xp / p.xpToNext) * 100);
    modal.appendChild(el('div', { class:'pd-level' }, [
      el('div', { class:'pd-level-row' }, [
        el('span', { class:'pd-level-label' }, [T('ui.detail.level', { lv: p.level })]),
        el('span', { class:'pd-xp-text' }, [T('ui.detail.xpProgress', { xp: p.xp, next: p.xpToNext })])
      ]),
      el('div', { class:'pd-xp-bar' }, [
        el('div', { class:'pd-xp-fill', style:{ width: xpPct + '%' } })
      ])
    ]));

    // Stats-Grid
    const statsBlock = el('div', { class:'pd-section' }, [
      el('div', { class:'pd-section-title' }, [T('ui.detail.stats')]),
      el('div', { class:'pd-stats-grid' }, [
        el('div', { class:'pd-stat' }, [ el('span', { class:'pd-stat-label' }, ['OFF']), el('span', { class:'pd-stat-val' }, [String(p.stats.offense)]) ]),
        el('div', { class:'pd-stat' }, [ el('span', { class:'pd-stat-label' }, ['DEF']), el('span', { class:'pd-stat-val' }, [String(p.stats.defense)]) ]),
        el('div', { class:'pd-stat' }, [ el('span', { class:'pd-stat-label' }, ['TMP']), el('span', { class:'pd-stat-val' }, [String(p.stats.tempo)]) ]),
        el('div', { class:'pd-stat' }, [ el('span', { class:'pd-stat-label' }, ['VIS']), el('span', { class:'pd-stat-val' }, [String(p.stats.vision)]) ]),
        el('div', { class:'pd-stat' }, [ el('span', { class:'pd-stat-label' }, ['CMP']), el('span', { class:'pd-stat-val' }, [String(p.stats.composure)]) ])
      ])
    ]);
    modal.appendChild(statsBlock);

    // Run Stats
    if (runGoals > 0 || p.goals) {
      modal.appendChild(el('div', { class:'pd-section' }, [
        el('div', { class:'pd-section-title' }, [T('ui.detail.runStats')]),
        el('div', { class:'pd-run-stats' }, [
          el('div', { class:'pd-run-stat' }, [
            el('span', { class:'pd-run-label' }, [T('ui.detail.runGoals')]),
            el('span', { class:'pd-run-val' }, [String(runGoals || p.goals || 0)])
          ])
        ])
      ]));
    }

    // Traits
    const traitsBody = el('div', { class:'pd-traits' });
    if (p.traits?.length) {
      for (const tid of p.traits) {
        const tr = DATA.traits[tid];
        if (!tr) continue;
        traitsBody.appendChild(el('div', { class:'pd-trait' }, [
          el('div', { class:'pd-trait-name' }, [tr.name]),
          el('div', { class:'pd-trait-desc' }, [tr.desc || ''])
        ]));
      }
    } else {
      traitsBody.appendChild(el('div', { class:'pd-trait-empty' }, [T('ui.detail.noTraits')]));
    }
    modal.appendChild(el('div', { class:'pd-section' }, [
      el('div', { class:'pd-section-title' }, [T('ui.detail.traits')]),
      traitsBody
    ]));

    // Close
    const closeBtn = el('button', { class:'btn primary', style:{ width:'100%', marginTop:'12px' } }, [T('ui.detail.close')]);
    closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
    modal.appendChild(closeBtn);

    overlay.classList.add('active');
    // Close beim Klick außerhalb
    overlay.onclick = (ev) => { if (ev.target === overlay) overlay.classList.remove('active'); };
  },

  renderLineup() {
    const lineup = getLineup();
    const bench = getBench();
    const slotsBox = $('#lineup-starters');
    slotsBox.innerHTML = '';
    lineup.forEach(p => {
      const card = UI.renderPlayerCard(p, { swapTarget: true });
      card.addEventListener('click', () => UI.handleSwapClick(p.id));
      if (state._swapSelected === p.id) card.classList.add('selected');
      slotsBox.appendChild(card);
    });
    $('#bench-count').textContent = I18N.t('ui.labels.benchSlots', { count: bench.length, max: CONFIG.maxBench });
    const benchBox = $('#lineup-bench');
    benchBox.innerHTML = '';
    if (bench.length === 0) {
      benchBox.appendChild(el('div', { class:'slot-empty' }, [I18N.t('ui.labels.noBench')]));
    } else {
      bench.forEach(p => {
        const card = UI.renderPlayerCard(p, { swapTarget: true, bench: true });
        card.addEventListener('click', () => UI.handleSwapClick(p.id));
        if (state._swapSelected === p.id) card.classList.add('selected');
        benchBox.appendChild(card);
      });
    }
    const hint = $('#lineup-hint');
    if (state._swapSelected) {
      const sel = state.roster.find(p => p.id === state._swapSelected);
      hint.textContent = I18N.t('ui.labels.swapSelected', { name: sel.name });
    } else {
      hint.textContent = I18N.t('ui.lineup.defaultHint');
    }
    UI.showScreen('screen-lineup');
  },

  handleSwapClick(playerId) {
    if (!state._swapSelected) {
      state._swapSelected = playerId;
    } else if (state._swapSelected === playerId) {
      state._swapSelected = null;
    } else {
      const id1 = state._swapSelected;
      const id2 = playerId;
      const in1 = state.lineupIds.includes(id1);
      const in2 = state.lineupIds.includes(id2);
      if (in1 === in2) {
        state._swapSelected = playerId;
      } else {
        const newLineupIds = state.lineupIds.slice();
        if (in1) {
          const idx = newLineupIds.indexOf(id1);
          newLineupIds[idx] = id2;
        } else {
          const idx = newLineupIds.indexOf(id2);
          newLineupIds[idx] = id1;
        }
        if (isLineupValid(newLineupIds)) {
          state.lineupIds = newLineupIds;
        } else {
          alert(I18N.t('ui.labels.swapRejected'));
        }
        state._swapSelected = null;
      }
    }
    UI.renderLineup();
  },

  renderMatchupIntelPanel(intel) {
    if (!intel) return null;
    const hasContent = intel.advantages.length || intel.warnings.length;
    if (!hasContent) return null;

    const delta = intel.powerDelta;
    let deltaText, deltaColor;
    // Schwelle synchron mit intel.js buildIntelOneLiner (dort: <= 25).
    if (Math.abs(delta) <= 25) {
      deltaText = I18N.t('ui.intel.deltaEven');
      deltaColor = 'var(--gold)';
    } else if (delta > 0) {
      deltaText = I18N.t('ui.intel.deltaAhead', { delta });
      deltaColor = 'var(--accent)';
    } else {
      deltaText = I18N.t('ui.intel.deltaBehind', { delta });
      deltaColor = 'var(--accent-2)';
    }

    const panel = el('div', { class: 'interrupt-panel intel-panel', style: { marginBottom: '14px', padding: '10px 12px' } });

    panel.appendChild(el('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px',
        paddingBottom: '8px',
        marginBottom: '8px',
        borderBottom: '1px dashed var(--dim)'
      }
    }, [
      el('span', {
        style: {
          fontFamily: 'var(--font-display)',
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--accent-3)'
        }
      }, [I18N.t('ui.intel.title')]),
      el('span', {
        style: {
          fontFamily: 'var(--font-display)',
          fontSize: '10px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: deltaColor,
          padding: '2px 6px',
          border: `1px solid ${deltaColor}`,
          background: 'rgba(0,0,0,0.3)'
        }
      }, [deltaText])
    ]));

    const columns = el('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px'
      },
      class: 'intel-columns'
    });

    const advCol = el('div', {});
    advCol.appendChild(el('div', {
      style: { color: 'var(--accent)', marginBottom: '6px', fontFamily: 'var(--font-display)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }
    }, ['✓ ' + I18N.t('ui.intel.advantagesTitle')]));
    if (intel.advantages.length) {
      for (const adv of intel.advantages) {
        advCol.appendChild(el('div', { class: 'hint-line hint-good', style: { marginBottom: '4px', fontSize: '10px' } }, [adv.text]));
      }
    } else {
      advCol.appendChild(el('div', {
        style: { fontSize: '10px', color: 'var(--muted)', fontStyle: 'italic', padding: '4px 0' }
      }, [I18N.t('ui.intel.noAdvantages')]));
    }
    columns.appendChild(advCol);

    const warnCol = el('div', {});
    warnCol.appendChild(el('div', {
      style: { color: 'var(--accent-2)', marginBottom: '6px', fontFamily: 'var(--font-display)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }
    }, ['⚠ ' + I18N.t('ui.intel.warningsTitle')]));
    if (intel.warnings.length) {
      for (const warn of intel.warnings) {
        warnCol.appendChild(el('div', { class: 'hint-line hint-warn', style: { marginBottom: '4px', fontSize: '10px' } }, [warn.text]));
      }
    } else {
      warnCol.appendChild(el('div', {
        style: { fontSize: '10px', color: 'var(--muted)', fontStyle: 'italic', padding: '4px 0' }
      }, [I18N.t('ui.intel.noWarnings')]));
    }
    columns.appendChild(warnCol);

    panel.appendChild(columns);
    return panel;
  },

  renderRecruit(options) {
    const box = $('#recruit-options');
    box.innerHTML = '';
    options.forEach(p => {
      const card = UI.renderPlayerCard(p, { legendary: true });
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => FLOW.pickRecruit(p));
      box.appendChild(card);
    });
    UI.showScreen('screen-recruit');
  },

  renderComparedStatBars(stats, compareAgainst, highlight={}, opts={}) {
    const wrap = el('div', { class: 'compared-bars' + (opts.compact ? ' compact' : '') });
    const keys = ['offense', 'defense', 'tempo', 'vision', 'composure'];
    const labels = {
      offense: I18N.t('stats.offense'),
      defense: I18N.t('stats.defense'),
      tempo: I18N.t('stats.tempo'),
      vision: I18N.t('stats.vision'),
      composure: I18N.t('stats.composure')
    };
    keys.forEach(k => {
      const v = stats[k] || 0;
      const pct = Math.min(100, (v/120)*100);
      let cmpClass = '';
      if (compareAgainst) {
        const other = compareAgainst[k] || 0;
        if (v > other) cmpClass = 'higher';
        else if (v < other) cmpClass = 'lower';
        else cmpClass = 'equal';
      }
      const trendVal = (highlight || {})[k] || 0;
      let trendEl = null;
      if (trendVal !== 0) {
        const _isUp = trendVal > 0;
        const _isDbl = Math.abs(trendVal) >= 2;
        const _col = _isUp ? 'var(--good)' : 'var(--danger)';
        let _svg;
        if (!_isDbl) {
          _svg = _isUp
            ? `<line x1="4" y1="11" x2="4" y2="4" stroke="${_col}" stroke-width="1.2" stroke-linecap="round"/><path d="M1.5 7 L4 2.5 L6.5 7" fill="none" stroke="${_col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`
            : `<line x1="4" y1="1" x2="4" y2="8" stroke="${_col}" stroke-width="1.2" stroke-linecap="round"/><path d="M1.5 5 L4 9.5 L6.5 5" fill="none" stroke="${_col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`;
        } else {
          _svg = _isUp
            ? `<line x1="2" y1="11" x2="2" y2="4" stroke="${_col}" stroke-width="1.2" stroke-linecap="round"/><path d="M0 7 L2 2.5 L4 7" fill="none" stroke="${_col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><line x1="7" y1="11" x2="7" y2="4" stroke="${_col}" stroke-width="1.2" stroke-linecap="round"/><path d="M5 7 L7 2.5 L9 7" fill="none" stroke="${_col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`
            : `<line x1="2" y1="1" x2="2" y2="8" stroke="${_col}" stroke-width="1.2" stroke-linecap="round"/><path d="M0 5 L2 9.5 L4 5" fill="none" stroke="${_col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><line x1="7" y1="1" x2="7" y2="8" stroke="${_col}" stroke-width="1.2" stroke-linecap="round"/><path d="M5 5 L7 9.5 L9 5" fill="none" stroke="${_col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`;
        }
        trendEl = el('span', { class:'cb-trend ' + (_isUp ? 'trend-up' : 'trend-down') });
        trendEl.innerHTML = `<svg viewBox="0 0 8 12" width="8" height="12" style="vertical-align:middle;margin-left:4px;flex-shrink:0;overflow:visible">${_svg}</svg>`;
      }
      const labelChildren = [labels[k]];
      if (trendEl) labelChildren.push(trendEl);
      const row = el('div', { class:'cb-row' }, [
        el('div', { class:'cb-header' }, [
          el('span', { class:'cb-label' }, labelChildren),
          el('span', { class:'cb-value ' + cmpClass }, [String(v)])
        ]),
        el('div', { class:'cb-bar' }, [
          el('div', { class:'cb-fill ' + cmpClass, style:{ width: pct + '%' } })
        ])
      ]);
      wrap.appendChild(row);
    });
    return wrap;
  },

  renderPlayerCard(p, opts={}) {
    const roleAbbr = UI.roleAbbr(p.role);
    const stageSymbols = ['★', '★★', '★★★'];
    const classes = ['p-card'];
    if (opts.selected)        classes.push('selected');
    if (p.pendingLevelUp)     classes.push('level-up-pending');
    if (p.isLegendary || opts.legendary) classes.push('legendary');
    if (p.isAcademy)          classes.push('academy');
    if (opts.bench)           classes.push('bench');
    if (opts.swapTarget)      classes.push('swap-target');

    const match = window.state?.currentMatch;
    const mem = match?.memory?.myPlayerStates?.[p.id];
    const streakState = mem?.streakState;
    const yellowCount = match?.memory?.yellowCards?.[p.id] || 0;
    const hasRed = match?.memory?.redCards?.has?.(p.id);
    const suspendedNext = p._suspendedUntil && window.state && p._suspendedUntil > window.state.matchNumber;

    if (hasRed) classes.push('red-carded');
    if (suspendedNext && !opts.inMatch) classes.push('suspended');

    // --- Default (Hub, Lineup, Recruit, Draft, In-Match): volle Karte ---
    // Strafkarten werden inline neben dem Namen gerendert (siehe nameLine
    // unten). Nur die Sperre bleibt als overlay-Badge — die ist eine
    // Rundenstatus-Info, keine Karte.
    const overlays = [];
    if (suspendedNext && !opts.inMatch) overlays.push(el('span', { class:'p-card-suspended-badge', title: I18N.t('ui.cards.suspendedNext') }, ['⏸']));
    if (p.isAcademy) {
      const tipKey = 'ui.cards.academyTooltip';
      let tip = I18N.t(tipKey);
      if (tip === tipKey) tip = 'Academy call-up — temporary replacement, stats reduced, no traits, leaves after this match.';
      overlays.push(el('span', { class:'p-card-academy-badge', title: tip }, ['⚑']));
    }

    // Strafkarten-Chips für die Name-Zeile
    const cardChips = [];
    if (hasRed) cardChips.push(el('span', { class:'p-card-chip red', title: I18N.t('ui.cards.red') }, ['🟥']));
    else if (yellowCount >= 2) cardChips.push(el('span', { class:'p-card-chip red', title: I18N.t('ui.cards.secondYellow') }, ['🟥']));
    else if (yellowCount === 1) cardChips.push(el('span', { class:'p-card-chip yellow', title: I18N.t('ui.cards.yellow') }, ['🟨']));

    const playerPower = Object.values(p.stats).reduce((a, b) => a + b, 0);

    // Stat-Diffs gegen den Stand vor dem letzten Match — nur zeigen wenn
    // explizit angefragt (Hub, Result) und ein Snapshot existiert.
    // Anzeige: kleiner Pfeil LINKS vom Wert, Wert in Akzentfarbe (grün=up,
    // rot=down). Kein Zahlen-Suffix, damit das Stat-Grid nicht verschoben wird.
    const showDiff = opts.showStatDiff && p._statsBeforeMatch;
    const before = p._statsBeforeMatch || p.stats;
    const powerBefore = Object.values(before).reduce((a, b) => a + b, 0);
    const powerDelta = playerPower - powerBefore;

    function statCell(key, label) {
      const cur = p.stats[key] || 0;
      const prev = before[key] || 0;
      const diff = showDiff ? cur - prev : 0;
      const cls = diff > 0 ? ' stat-up' : (diff < 0 ? ' stat-down' : '');
      const arrow = diff > 0 ? '▲' : (diff < 0 ? '▼' : '');
      return el('div', { class: 'stat' + cls }, [
        label,
        el('span', { class:'stat-val' }, [
          arrow ? el('span', { class:'stat-arrow' }, [arrow]) : null,
          el('b', {}, [String(cur)])
        ])
      ]);
    }

    const powerChildren = [];
    if (showDiff && powerDelta !== 0) {
      powerChildren.push(el('span', {
        class: 'p-card-power-arrow ' + (powerDelta > 0 ? 'up' : 'down')
      }, [powerDelta > 0 ? '▲' : '▼']));
    }
    powerChildren.push(el('span', {
      class: 'p-card-power-val' + (showDiff && powerDelta > 0 ? ' up' : showDiff && powerDelta < 0 ? ' down' : '')
    }, [String(playerPower)]));

    const card = el('div', { class: classes.join(' ') }, [
      overlays.length ? el('div', { class:'p-card-overlays' }, overlays) : null,
      el('div', { class:'p-card-head' }, [
        el('div', { class:'p-card-head-left' }, [
          el('span', { class:'role' }, [roleAbbr]),
          el('span', { class:'stage' }, [stageSymbols[p.stage] || '★'])
        ]),
        el('span', { class:'p-card-power' }, powerChildren)
      ]),
      el('div', { class:'name' }, [
        el('span', { class:'name-text' }, [p.name]),
        cardChips.length ? el('span', { class:'name-cards' }, cardChips) : null
      ]),
      el('div', { class:'mono-sm', style:{ marginBottom:'6px' } }, [
        p.isAcademy
          ? (I18N.t('ui.labels.academy') === 'ui.labels.academy' ? 'ACADEMY' : I18N.t('ui.labels.academy'))
          : p.label
      ]),
      el('div', { class:'stats' }, [
        statCell('offense', 'OFF'),
        statCell('defense', 'DEF'),
        statCell('tempo', 'TMP'),
        statCell('vision', 'VIS'),
        statCell('composure', 'CMP')
      ]),
      el('div', { class:'xp-bar' }, [
        el('div', { class:'xp-fill', style:{ width: Math.min(100, (p.xp / p.xpToNext)*100) + '%' } })
      ]),
      el('div', { class:'xp-label' }, (() => {
        const base = `LV ${p.level} · ${p.xp}/${p.xpToNext} XP${p.goals ? ' · ' + p.goals + '⚽' : ''}`;
        const f = p.form || 0;
        if (f === 0) return [base];
        const isUp = f > 0, isDbl = Math.abs(f) >= 2;
        const col = isUp ? 'var(--good)' : 'var(--danger)';
        let svg;
        if (!isDbl) {
          svg = isUp
            ? `<line x1="4" y1="11" x2="4" y2="4" stroke="${col}" stroke-width="1.2" stroke-linecap="round"/><path d="M1.5 7 L4 2.5 L6.5 7" fill="none" stroke="${col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`
            : `<line x1="4" y1="1" x2="4" y2="8" stroke="${col}" stroke-width="1.2" stroke-linecap="round"/><path d="M1.5 5 L4 9.5 L6.5 5" fill="none" stroke="${col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`;
        } else {
          svg = isUp
            ? `<line x1="2" y1="11" x2="2" y2="4" stroke="${col}" stroke-width="1.2" stroke-linecap="round"/><path d="M0 7 L2 2.5 L4 7" fill="none" stroke="${col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><line x1="7" y1="11" x2="7" y2="4" stroke="${col}" stroke-width="1.2" stroke-linecap="round"/><path d="M5 7 L7 2.5 L9 7" fill="none" stroke="${col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`
            : `<line x1="2" y1="1" x2="2" y2="8" stroke="${col}" stroke-width="1.2" stroke-linecap="round"/><path d="M0 5 L2 9.5 L4 5" fill="none" stroke="${col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><line x1="7" y1="1" x2="7" y2="8" stroke="${col}" stroke-width="1.2" stroke-linecap="round"/><path d="M5 5 L7 9.5 L9 5" fill="none" stroke="${col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`;
        }
        const span = document.createElement('span');
        span.style.cssText = 'display:inline-flex;align-items:center;gap:3px;';
        span.textContent = base;
        const icon = document.createElement('span');
        icon.innerHTML = `<svg viewBox="0 0 8 12" width="8" height="12" style="vertical-align:middle;overflow:visible">${svg}</svg>`;
        span.appendChild(icon);
        return [span];
      })()),
      p.traits.length ? el('div', { class:'traits' }, p.traits.map(t =>
        el('span', { class:'trait-dot', title: DATA.traits[t]?.desc || '' }, [DATA.traits[t]?.name || t])
      )) : null
    ]);
    return card;
  },

  renderMatch(opp, squad) {
    // Rebuild the me-side team block: logo + name + optional form chip.
    // Mirrors the hub's visual language so the match screen doesn't feel like
    // a completely different surface.
    const meBlock = $('#match-me-name');
    meBlock.innerHTML = '';
    if (state.teamLogo) {
      meBlock.appendChild(el('img', {
        class: 'match-header-logo',
        src: state.teamLogo,
        alt: getTeamDisplayName(squad)
      }, []));
    }
    meBlock.appendChild(el('span', { class: 'match-header-name' }, [getTeamDisplayName(squad)]));

    const teamFormAvg = squad.reduce((s, p) => s + (p.form || 0), 0) / Math.max(1, squad.length);
    let formChip = null;
    if (teamFormAvg >= 2)       formChip = { cls:'form-chip hot',  text:'🔥 ' + I18N.t('ui.labels.hotStreak') };
    else if (teamFormAvg >= 1)  formChip = { cls:'form-chip up',   text:'↑ '  + I18N.t('ui.labels.goodForm') };
    else if (teamFormAvg <= -2) formChip = { cls:'form-chip cold', text:'❄ '  + I18N.t('ui.labels.crisis') };
    else if (teamFormAvg <= -1) formChip = { cls:'form-chip down', text:'↓ '  + I18N.t('ui.labels.badForm') };
    if (formChip) {
      meBlock.appendChild(el('div', { class: formChip.cls }, [formChip.text]));
    }

    // Opp-side: logo + name + special/trait chips. Same chip markup (.opp-tag)
    // as the hub, so the visual language carries through.
    const oppBlock = $('#match-opp-name');
    oppBlock.innerHTML = '';
    if (opp.logo) {
      oppBlock.appendChild(el('img', {
        class: 'match-header-logo',
        src: opp.logo,
        alt: opp.name
      }, []));
    }
    oppBlock.appendChild(el('span', { class: 'match-header-name' + (opp.isBoss ? ' boss' : '') },
      [(opp.isBoss ? '🏆 ' : '') + opp.name]));

    const oppSpecial = opp.special?.name;
    const oppTraitChips = (opp.traits || [])
      .map(tid => (window.OPP_TRAITS || []).find(x => x.id === tid)?.name)
      .filter(Boolean)
      .slice(0, 2);
    if (oppSpecial || oppTraitChips.length) {
      oppBlock.appendChild(el('div', { class:'match-header-tags' }, [
        oppSpecial ? el('span', { class:'opp-tag special' }, [oppSpecial]) : null,
        ...oppTraitChips.map(t => el('span', { class:'opp-tag' }, [t]))
      ]));
    }

    $('#score-me').textContent = '0';
    $('#score-opp').textContent = '0';
    const ri = $('#round-indicator');
    ri.innerHTML = '';
    for (let i = 0; i < CONFIG.rounds; i++) {
      ri.appendChild(el('div', { class:'round-dot', 'data-round':(i+1) }));
    }
    $('#match-log').innerHTML = '';

    // Player-Pulse-Tiles: zeigen Aufstellung live während des Matches.
    // Aufbau analog zu Result-Perf-Cards, mit Live-Daten pro Runde.
    // WICHTIG: _matchStats hier zurücksetzen, sonst zeigen die Tiles noch
    // die Werte aus dem Vormatch bis zum ersten Trigger (Bug-Fix).
    for (const p of squad) {
      p._matchStats = {
        shots: 0, shotsOnTarget: 0, goals: 0,
        buildups: 0, buildupsOk: 0,
        saves: 0, goalsConceded: 0,
        defendedAttacks: 0, counters: 0
      };
    }

    const pulse = $('#match-pulse');
    if (pulse) {
      pulse.innerHTML = '';
      squad.forEach(p => {
        const tile = el('div', {
          class:'mp-tile',
          'data-player-id': p.id,
          title: `${UI.roleAbbr(p.role)} · ${p.name}`
        }, [
          el('div', { class:'mp-role' }, [UI.roleAbbr(p.role)]),
          el('div', { class:'mp-name' }, [p.name]),
          el('div', { class:'mp-line', 'data-field':'line' }, [])
        ]);
        pulse.appendChild(tile);
      });
      UI.updatePulseStats(squad);
    }

    // Momentum reset — Bar auf 50/50 und Info-Strip leeren. Die Chips/
    // Deltas/Cause werden sofort neu gesetzt, sobald das matchStart-Event
    // durchläuft (siehe flow.js:handleMatchEvent).
    UI.updateMomentum(50);
    const momIds = ['mom-chip-edge', 'mom-chip-threat', 'mom-cause'];
    for (const id of momIds) {
      const el = document.getElementById(id);
      if (el) { el.textContent = ''; el.className = el.className.replace(/\s+(pos|neg|zero)\b/g, ''); }
    }
    const deltasBox = document.getElementById('mom-deltas');
    if (deltasBox) {
      deltasBox.querySelectorAll('.mom-delta').forEach(cell => {
        cell.classList.remove('pos', 'neg');
        cell.classList.add('zero');
        const v = cell.querySelector('.md-val');
        if (v) v.textContent = '';
      });
    }

    UI.renderMatchFooter(squad, opp);
    UI.showScreen('screen-match');
  },

  // Schreibt eine kompakte Live-Zeile pro Tile (Wert + Label in einer Zeile).
  // Rollen-spezifisch: ST/LF → Tore, PM → Build-Up-Quote, VT → Stops, TW → Paraden.
  updatePulseStats(squad) {
    if (!squad) return;
    for (const p of squad) {
      const tile = document.querySelector(`.mp-tile[data-player-id="${p.id}"]`);
      if (!tile) continue;
      const ms = p._matchStats || {};
      let value = '—';
      let label = '';
      let tone = '';

      if (p.role === 'ST' || p.role === 'LF') {
        const g = ms.goals || 0;
        const shots = ms.shots || 0;
        const shotsOn = ms.shotsOnTarget || 0;
        if (shots > 0) {
          value = `${g}⚽ · ${shotsOn}/${shots}`;
          label = '🎯';
        } else {
          value = `${g}`;
          label = '⚽';
        }
        if (g >= 1) tone = 'good';
      } else if (p.role === 'PM') {
        const ok = ms.buildupsOk || 0;
        const total = ms.buildups || 0;
        value = `${ok}/${total}`;
        label = I18N.t('ui.match.pulseBuildup');
        if (total >= 2) {
          const rate = ok / total;
          if (rate >= 0.7) tone = 'good';
          else if (rate < 0.4) tone = 'bad';
        }
      } else if (p.role === 'VT') {
        const stops = ms.defendedAttacks || 0;
        const conceded = ms.goalsConceded || 0;
        value = String(stops);
        label = I18N.t('ui.match.pulseDefense');
        if (stops >= 2 && conceded === 0) tone = 'good';
        else if (conceded >= 2) tone = 'bad';
      } else if (p.role === 'TW') {
        const saves = ms.saves || 0;
        const conceded = ms.goalsConceded || 0;
        value = String(saves);
        label = I18N.t('ui.match.pulseSaves');
        if (saves >= 2 && conceded < 2) tone = 'good';
        else if (conceded >= 2) tone = 'bad';
      }

      const lineEl = tile.querySelector('[data-field="line"]');
      if (lineEl) {
        lineEl.innerHTML = '';
        const valueSpan = document.createElement('span');
        valueSpan.className = 'mp-value' + (tone ? ' ' + tone : '');
        valueSpan.textContent = value;
        const labelSpan = document.createElement('span');
        labelSpan.className = 'mp-label';
        labelSpan.textContent = label;
        lineEl.appendChild(valueSpan);
        if (label) lineEl.appendChild(labelSpan);
      }
    }
  },

  // Lässt ein Player-Tile kurz aufleuchten. tone: 'fire' (trait/goal) | 'hit' (got scored on)
  pulsePlayer(playerId, tone = 'fire') {
    const tile = document.querySelector(`.mp-tile[data-player-id="${playerId}"]`);
    if (!tile) return;
    tile.classList.remove('pulse-fire', 'pulse-hit');
    // Reflow für Neu-Animation bei Folge-Triggern
    void tile.offsetWidth;
    tile.classList.add(tone === 'hit' ? 'pulse-hit' : 'pulse-fire');
  },

  // Momentum (0-100) — 50 ist ausgeglichen. >50 = eigene Seite, <50 = Gegner.
  updateMomentum(meValue) {
    const v = Math.max(0, Math.min(100, meValue));
    const mePct  = v;
    const oppPct = 100 - v;
    const meFill  = $('#mom-fill-me');
    const oppFill = $('#mom-fill-opp');
    if (meFill)  meFill.style.width  = mePct  + '%';
    if (oppFill) oppFill.style.width = oppPct + '%';
  },

  // Live-Scorecard im Match-Screen. Zeigt Edge/Threat, die größte Stat-
  // Verschiebung seit Kickoff, und einen One-Liner, der den aktuellen
  // Haupt-Einfluss benennt ("Pressing aktiv · Heißer Lauf · …").
  // Wird auf matchStart (Baseline) sowie bei roundEnd und buffsUpdated
  // (nach Taktik-Wahl) aufgerufen — selten genug, dass die Berechnung
  // pro Call nicht performance-relevant ist.
  updateMatchMomentum(match) {
    const strip = document.getElementById('match-momentum');
    if (!strip || !match) return;

    const squad = match.squad || [];
    const opp = match.opp;
    if (!squad.length || !opp) return;

    // Live Team-Stats mit allen Buffs/Traits/Form via computePlayerStats.
    // aggregateEffectiveStats existiert in engine.js, aber wir inlinen es
    // hier klein, damit die UI-Schicht autark bleibt.
    const computeLive = (arr) => {
      const totals = { offense:0, defense:0, tempo:0, vision:0, composure:0 };
      if (!arr.length) return totals;
      for (const p of arr) {
        const s = typeof computePlayerStats === 'function'
          ? computePlayerStats(p, match) : (p.stats || {});
        for (const k of Object.keys(totals)) totals[k] += (s[k] || 0);
      }
      for (const k of Object.keys(totals)) totals[k] = Math.round(totals[k] / arr.length);
      return totals;
    };

    const me = computeLive(squad);
    const oppLive = { ...opp.stats };
    const rb = opp._roundBuffs || {};
    for (const k of Object.keys(oppLive)) oppLive[k] += (rb[k] || 0);

    // Baseline beim ersten Aufruf speichern — Match-spezifisch, nicht global.
    if (!match._momentumBaseline) {
      match._momentumBaseline = { me: { ...me }, opp: { ...oppLive } };
    }
    const base = match._momentumBaseline;

    // Edge/Threat: Summe positiver/negativer Diffs über die 5 Stats,
    // skaliert zu 0-5 Chips. Bewusst roh gehalten — die Bars zeigen
    // Feinheiten, die Chips zeigen das Big Picture.
    const statKeys = ['offense','defense','tempo','vision','composure'];

    // Explizite Stat→Label-Map, weil einfacher .slice(0,3) falsche Keys
    // produziert: 'tempo'.slice(0,3) = 'tem' (Key ist 'tmp'),
    // 'composure'.slice(0,3) = 'com' (Key ist 'cmp'). Zusätzlich greift
    // der `|| fallback` nicht, weil I18N.t bei fehlendem Key den Key
    // selbst zurückgibt (truthy string) statt null.
    const STAT_SHORT = {
      offense: 'off', defense: 'def', tempo: 'tmp', vision: 'vis', composure: 'cmp'
    };
    const statLabelOf = (statKey) => {
      const shortKey = STAT_SHORT[statKey] || statKey.slice(0,3);
      const i18nKey = 'ui.scorecard.' + shortKey;
      const translated = I18N.t(i18nKey);
      return (translated === i18nKey ? shortKey : translated).toUpperCase();
    };
    const i18nOr = (key, fallback) => {
      const v = I18N.t(key);
      return (v === key) ? fallback : v;
    };

    let edgePts = 0, threatPts = 0;
    for (const k of statKeys) {
      const diff = me[k] - oppLive[k];
      if (diff > 0) edgePts += diff; else threatPts += -diff;
    }
    const toChips = (pts) => Math.max(0, Math.min(5, Math.round(pts / 25)));
    const edge   = toChips(edgePts);
    const threat = toChips(threatPts);
    const chip = (n, max = 5) => '▰'.repeat(n) + '▱'.repeat(max - n);

    const edgeEl   = document.getElementById('mom-chip-edge');
    const threatEl = document.getElementById('mom-chip-threat');
    if (edgeEl)   edgeEl.textContent   = `${i18nOr('ui.scorecard.edge',   'EDGE')} ${chip(edge)}`;
    if (threatEl) threatEl.textContent = `${i18nOr('ui.scorecard.threat', 'THREAT')} ${chip(threat)}`;

    // Größte-Verschiebung-Shift wurde durch einen kompletten 5-Stat-Strip
    // ersetzt (feste Positionen, alle Werte sichtbar). Der einzelne Shift
    // hatte das Problem, dass die Zelle springt, je nachdem welcher Stat
    // gerade der größte ist — das irritiert und lässt kleinere, aber evtl.
    // wichtige Verschiebungen unsichtbar werden.
    const deltasEl = document.getElementById('mom-deltas');
    if (deltasEl) {
      for (const k of statKeys) {
        const delta = me[k] - base.me[k];
        const valEl = deltasEl.querySelector(`[data-stat-val="${k}"]`);
        const cellEl = deltasEl.querySelector(`[data-stat="${k}"]`);
        if (!valEl || !cellEl) continue;
        if (Math.abs(delta) >= 1) {
          valEl.textContent = (delta > 0 ? '+' : '') + delta;
          cellEl.classList.remove('pos', 'neg', 'zero');
          cellEl.classList.add(delta > 0 ? 'pos' : 'neg');
        } else {
          valEl.textContent = '0';
          cellEl.classList.remove('pos', 'neg');
          cellEl.classList.add('zero');
        }
      }
    }

    // Cause-Line — priorisierte Auswahl des "gerade dominanten" Einflusses.
    // Früher mit Top-2-Buffs-Listing, jetzt nur noch narrativer Hinweis
    // (Taktikname / Form / Focus) — die Zahlen sind links bereits da.
    const causeEl = document.getElementById('mom-cause');
    let cause = '';
    if (match.lastTactic?.name) {
      cause = match._tacticMisfit ? '⚠ ' + match.lastTactic.name
            : match._tacticFit === true ? '✓ ' + match.lastTactic.name
            : match.lastTactic.name;
    }
    if (match._teamFormLabel === 'HEISSER LAUF') {
      cause = (cause ? cause + ' · ' : '') + '🔥 ' + i18nOr('ui.labels.hotStreak', 'HOT STREAK');
    } else if (match._teamFormLabel === 'KRISE') {
      cause = (cause ? cause + ' · ' : '') + '❄ ' + i18nOr('ui.labels.crisis', 'CRISIS');
    }
    // Focus-Zeile entfernt — Focus-System deprecated.
    if (causeEl) causeEl.textContent = cause;
  },

  renderMatchFooter(squad, opp) {
    const foot = $('#match-footer');
    if (!foot) return;
    foot.innerHTML = '';
    const teamStats = aggregateTeamStats(squad);
    const oppStats = opp.stats;
    const keys = [
      { id:'offense',   label:'OFF' },
      { id:'defense',   label:'DEF' },
      { id:'tempo',     label:'TMP' },
      { id:'vision',    label:'VIS' },
      { id:'composure', label:'CMP' }
    ];
    keys.forEach(k => {
      const mine = teamStats[k.id];
      const theirs = oppStats[k.id];
      const total = Math.max(1, mine + theirs);
      const myPct = (mine / total) * 100;
      const theirPct = (theirs / total) * 100;
      const row = el('div', { class:'match-footer-row' }, [
        el('div', { class:'mf-label' }, [k.label]),
        el('div', { class:'mf-val-me' }, [String(mine)]),
        el('div', { class:'mf-bar' }, [
          el('div', { class:'mf-bar-me', style:{ width: myPct + '%' } }),
          el('div', { class:'mf-bar-opp', style:{ width: theirPct + '%' } })
        ]),
        el('div', { class:'mf-val-opp' }, [String(theirs)])
      ]);
      foot.appendChild(row);
    });
  },

  updateRoundIndicator(round) {
    $$('.round-dot').forEach(d => {
      const r = Number(d.dataset.round);
      d.classList.remove('active', 'past');
      if (r < round) d.classList.add('past');
      else if (r === round) d.classList.add('active');
    });
  },

  // Blended momentum: Ballbesitz (60%) + Score-Differenz (40%). Ohne die
  // Score-Komponente bleibt die Bar bei 4:0 optisch zentriert, was die
  // tatsächliche Dominanz unterschreibt. Score-Factor saturiert bei ±4
  // Tor-Differenz, damit späte Klatschen nicht weiter ausschlagen.
  computeBlendedMomentum(match) {
    const s = match?.stats || {};
    const possession = s.possRounds
      ? Math.round((s.possAccum / s.possRounds) * 100)
      : 50;
    const diff = (match?.scoreMe || 0) - (match?.scoreOpp || 0);
    const scoreFactor = Math.max(10, Math.min(90, 50 + diff * 10));
    return Math.round(possession * 0.6 + scoreFactor * 0.4);
  },

  updateMatchScore(match) {
    $('#score-me').textContent = String(match.scoreMe);
    $('#score-opp').textContent = String(match.scoreOpp);
    UI.updateRoundIndicator(match.round);
    UI.renderMatchFooter(match.squad, match.opp);
    UI.updatePulseStats(match.squad);
    UI.updateMomentum(UI.computeBlendedMomentum(match));
  },

  appendLog(msg, cls='') {
    if (window.FX) {
      if (cls === 'goal-me') window.FX.goalMe();
      else if (cls === 'goal-opp') window.FX.goalOpp();
    }

    // Player Pulse: bei Trigger- und Goal-Events den Dot aufleuchten lassen.
    // Matching: squad-Spielernamen im Log-Text suchen.
    try {
      const match = window.state?.currentMatch;
      const squad = match?.squad;
      if (squad && (cls === 'trigger' || cls === 'goal-me')) {
        for (const p of squad) {
          if (p.name && msg.includes(p.name)) {
            UI.pulsePlayer(p.id, 'fire');
            break;
          }
        }
      }
      // Bei Gegentor: Keeper pulst "hit"
      if (squad && cls === 'goal-opp') {
        const keeper = squad.find(p => p.role === 'TW');
        if (keeper) UI.pulsePlayer(keeper.id, 'hit');
      }

      // Momentum: Tore verschieben den Balken sichtbar. Gleiche Blend-
      // Formel wie im Update pro Runde, damit das Bild konsistent bleibt.
      if (match && (cls === 'goal-me' || cls === 'goal-opp')) {
        UI.updateMomentum(UI.computeBlendedMomentum(match));
      }
    } catch (_) { /* Log-Visual ist nice-to-have, nie kritisch */ }

    const log = $('#match-log');
    const line = el('div', { class:'log-line ' + cls }, [msg]);
    log.appendChild(line);

    // Micro-Boost-Queue leeren: während der vorherigen bumpPlayerStat-Kette
    // können Schwellen überschritten worden sein. Toast-Zeilen direkt nach
    // dem auslösenden Event einblenden, damit die Kausalität sichtbar ist.
    try {
      const match = window.state?.currentMatch;
      const q = match?._microBoostQueue;
      if (q && q.length) {
        const STAT_LABEL = { offense:'OFF', defense:'DEF', tempo:'TMP', vision:'VIS', composure:'CMP' };
        while (q.length) {
          const mb = q.shift();
          const label = STAT_LABEL[mb.stat] || mb.stat.toUpperCase();
          const text = I18N.t('ui.log.microBoost', {
            name: mb.playerName, stat: label, value: mb.newValue
          });
          const toast = el('div', { class:'log-line micro-boost' }, [text]);
          log.appendChild(toast);
          UI.pulsePlayer(mb.playerId, 'fire');
        }
      }
    } catch (_) { /* Toast ist nice-to-have, nie kritisch */ }

    log.scrollTop = log.scrollHeight;
  },

  renderHalftimeSummary(match, opts={}) {
    const s = match.stats;
    const myAcc  = s.myShots  ? Math.round(s.myShotsOnTarget  / s.myShots  * 100) : null;
    const myBR   = s.myBuildups ? Math.round(s.myBuildupsSuccess / s.myBuildups * 100) : null;
    const poss   = s.possRounds ? Math.round((s.possAccum / s.possRounds) * 100) : 50;

    const mechanics = [];
    if (match.autoCounterRoundsLeft > 0) mechanics.push({ icon:'⚡', label: I18N.t('ui.ht.mechanicCounter') });
    if (match.pressingRoundsLeft    > 0) mechanics.push({ icon:'🏃', label: I18N.t('ui.ht.mechanicPressing') });
    if (match.possessionActive)          mechanics.push({ icon:'🎯', label: I18N.t('ui.ht.mechanicPossession') });
    if (match.aggressiveRoundsLeft  > 0) mechanics.push({ icon:'💥', label: I18N.t('ui.ht.mechanicAggressive') });
    if (match.flankRoundsLeft       > 0) mechanics.push({ icon:'🏃', label: I18N.t('ui.ht.mechanicFlank') });
    if (match._rallyActive)              mechanics.push({ icon:'💢', label: I18N.t('ui.ht.mechanicRally') });

    const happened = [];
    if ((match._htPressingBlocks || 0) > 0)
      happened.push(`🛡 ${I18N.t('ui.ht.pressBlocked', { n: match._htPressingBlocks })}`);
    if ((match._htCountersFired || 0) > 0)
      happened.push(`⚡ ${I18N.t('ui.ht.countersFired', { n: match._htCountersFired })}`);
    if ((match.momentumCounter || 0) >= 2)
      happened.push(`🔄 ${I18N.t('ui.ht.momentumActive', { bonus: 15 })}`);

    const panel = el('div', { class:'interrupt-panel ht-summary' }, [
      el('div', { class:'ip-title' }, [opts.title || I18N.t('ui.ht.title')]),
      el('div', { class:'ht-score-strip' }, [
        el('div', { class:'ht-score-me' }, [String(match.scoreMe)]),
        el('div', { class:'ht-score-mid' }, [
          el('div', { class:'ht-poss-bar' }, [
            el('div', { class:'ht-poss-fill', style:{ width: poss + '%' } })
          ]),
          el('div', { class:'ht-poss-label' }, [`${poss}% — ${I18N.t('ui.statsPanel.possession')}`])
        ]),
        el('div', { class:'ht-score-opp' }, [String(match.scoreOpp)])
      ]),
      el('div', { class:'ht-stats-row' }, [
        el('div', { class:'ht-stat' }, [
          el('div', { class:'ht-stat-val' }, [`${s.myShots}`]),
          el('div', { class:'ht-stat-label' }, [I18N.t('ui.statsPanel.shots')])
        ]),
        el('div', { class:'ht-stat' }, [
          el('div', { class:'ht-stat-val' }, [myAcc !== null ? `${myAcc}%` : '—']),
          el('div', { class:'ht-stat-label' }, [I18N.t('ui.statsPanel.accuracy')])
        ]),
        el('div', { class:'ht-stat' }, [
          el('div', { class:'ht-stat-val' }, [myBR !== null ? `${myBR}%` : '—']),
          el('div', { class:'ht-stat-label' }, [I18N.t('ui.statsPanel.buildup')])
        ]),
        el('div', { class:'ht-stat' }, [
          el('div', { class:'ht-stat-val' }, [String(s.saves || 0)]),
          el('div', { class:'ht-stat-label' }, [I18N.t('ui.statsPanel.saves')])
        ])
      ]),
      happened.length ? el('div', { class:'ht-happened' },
        happened.map(h => el('div', { class:'ht-happened-item' }, [h]))
      ) : null,
      mechanics.length ? el('div', { class:'ht-mechanics' }, [
        el('div', { class:'ht-mechanics-title' }, [I18N.t('ui.ht.activeIntoSecondHalf')]),
        ...mechanics.map(m => el('div', { class:'ht-mechanic-tag' }, [m.icon + ' ' + m.label]))
      ]) : null
    ]);
    return panel;
  },

  renderHintBox(hints) {
    if (!hints || !hints.length) return null;
    const box = el('div', { class: 'hint-box' });
    for (const hint of hints.slice(0, 3)) {
      const line = el('div', { class: `hint-line hint-${hint.type}` }, [hint.text]);
      box.appendChild(line);
    }
    return box;
  },

  renderPhaseGuide(match, phase) {
    const lines = buildPhaseGuide(match, phase);
    if (!lines.length) return null;
    return el('div', { class:'interrupt-panel' }, [
      el('div', { class:'ip-title' }, [I18N.t('ui.statsPanel.whatMattersNow')]),
      ...lines.map(line => el('div', { class:'ht-happened-item' }, [line]))
    ]);
  },

  // Kondensiert den Halftime/Final-Snapshot auf eine Zeile.
  // Zeigt: Score · Ballbesitz · ein prägnanter "wo steht ihr"-Satz.
  buildInterruptSnapshot(match, phase) {
    if (!match) return null;
    const normalizedPhase = (phase === 'halftime_focus' || phase === 'halftime_sub') ? 'halftime' : phase;
    const s = match.stats || {};
    const poss = s.possRounds ? Math.round((s.possAccum / s.possRounds) * 100) : 50;

    // Erste Zeile vom PhaseGuide ist meistens der entscheidende Satz.
    const guideLines = buildPhaseGuide(match, phase);
    const primaryLine = guideLines[0] || null;

    return {
      scoreMe: match.scoreMe || 0,
      scoreOpp: match.scoreOpp || 0,
      possession: poss,
      phase: normalizedPhase,
      showScore: normalizedPhase === 'halftime' || normalizedPhase === 'final',
      primaryLine
    };
  },

  renderInterruptSnapshot(snapshot) {
    if (!snapshot) return null;
    const children = [];

    // Score + Possession nur wenn Match läuft (halftime, final) — beim Kickoff
    // steht es 0:0, das ist leer.
    if (snapshot.showScore) {
      const diff = snapshot.scoreMe - snapshot.scoreOpp;
      const scoreCls = diff > 0 ? 'ahead' : (diff < 0 ? 'behind' : 'level');
      children.push(el('div', { class:'isnap-score-row' }, [
        el('span', { class:'isnap-score ' + scoreCls }, [
          `${snapshot.scoreMe} : ${snapshot.scoreOpp}`
        ]),
        el('div', { class:'isnap-poss' }, [
          el('div', { class:'isnap-poss-bar' }, [
            el('div', { class:'isnap-poss-fill', style:{ width: snapshot.possession + '%' } })
          ]),
          el('div', { class:'isnap-poss-label mono-sm' }, [
            `${snapshot.possession}% ${I18N.t('ui.statsPanel.possession')}`
          ])
        ])
      ]));
    }

    if (snapshot.primaryLine) {
      children.push(el('div', { class:'isnap-headline' }, [snapshot.primaryLine]));
    }

    if (!children.length) return null;
    return el('div', { class:'interrupt-snapshot' }, children);
  },

  showInterrupt(title, subtitle, options, onPick, match, phase, hints) {
    const modal = $('#interrupt-modal');
    modal.innerHTML = '';

    const isEvent = phase === 'event';
    const isFocusSub = phase === 'halftime_sub';

    // --- Header ---
    if (isEvent) {
      modal.classList.add('interrupt-modal--event');
      modal.appendChild(el('div', { class: 'event-modal-header' }, [
        el('div', { class: 'event-modal-badge' }, ['⚡ ' + I18N.t('ui.flow.eventTitle')]),
        el('h2', { class: 'event-modal-title' }, [title])
      ]));
    } else {
      modal.classList.remove('interrupt-modal--event');
      modal.appendChild(el('h2', {}, [title]));
    }

    // Subtitle (kann einen "__REASON__"-Teil haben der separat hervorgehoben wird)
    let subtitleText = subtitle;
    let reasonText = null;
    if (typeof subtitle === 'string' && subtitle.includes('__REASON__')) {
      const parts = subtitle.split('__REASON__');
      subtitleText = parts[0].trim();
      reasonText = parts[1];
    }
    modal.appendChild(el('div', { class:'sub' }, [subtitleText]));
    if (reasonText) {
      modal.appendChild(el('div', { class:'event-modal-reason' }, ['↳ ' + reasonText]));
    }

    // --- Subtle directional headline (replaces the score/possession box) ---
    // Früher: eine große Box mit Score-Wiederholung, Possession-Bar und
    // primaryLine. Der Score stand schon im Subtitle und die Possession war
    // aus dem Live-Dashboard bekannt — die Box war visuell laut und
    // redundant. Jetzt nur noch primaryLine als eine dünne Zeile unter dem
    // Subtitle; die Hint-Chips weiter unten tragen die konkreten Analysen.
    let primaryLine = null;
    const showSnapshot = match && !isFocusSub && !isEvent
      && (phase === 'kickoff' || phase === 'halftime' || phase === 'final');
    if (showSnapshot) {
      const snapshot = UI.buildInterruptSnapshot(match, phase);
      primaryLine = snapshot?.primaryLine || null;
      if (primaryLine) {
        modal.appendChild(el('div', { class:'interrupt-headline' }, [primaryLine]));
      }
    }

    // Hints: gegen primaryLine deduplizieren, damit nicht derselbe Gedanke
    // zweimal erscheint (Headline oben + Hint unten).
    let filteredHints = hints || [];
    if (primaryLine) {
      const primaryTokens = extractHintTokens(primaryLine);
      filteredHints = filteredHints.filter(h => {
        const hintText = typeof h === 'string' ? h : h.text;
        if (!hintText) return true;
        const hintTokens = extractHintTokens(hintText);
        // Wenn ≥2 signifikante Tokens übereinstimmen, Duplikat verwerfen.
        let overlap = 0;
        for (const t of hintTokens) if (primaryTokens.has(t)) overlap++;
        return overlap < 2;
      });
    }
    const trimmedHints = filteredHints.slice(0, 2);
    const hintBox = UI.renderHintBox(trimmedHints);
    if (hintBox) modal.appendChild(hintBox);

    // --- Optionen — DIREKT nach dem Snapshot, nicht vergraben ---
    // Für taktische Entscheidungen (kickoff/halftime/final) zeigen wir
    // unter jeder Option die Spieler, die von der Wahl bevorzugt werden.
    // Erfolgreiche Aktionen dieser Spieler während der Phase geben
    // Bonus-XP — das verbindet die Entscheidung direkt mit der Progression.
    const showFocus = match && !isEvent && !isFocusSub
      && (phase === 'kickoff' || phase === 'halftime' || phase === 'final')
      && typeof previewTacticFocusPlayers === 'function';

    const squadForPreview = showFocus ? (match.squad || getLineup?.() || []) : null;

    const list = el('div', { class:'choice-list' });
    options.forEach(opt => {
      // desc can be a plain string (legacy) or an array of lines (new format
      // from generateFocusOptions / decorateOptionsForDisplay). Render each
      // line as its own row so we get honest vertical rhythm instead of a
      // pipe-separated wall of text.
      const descChildren = Array.isArray(opt.desc)
        ? opt.desc.filter(Boolean).map(line => el('div', { class:'choice-desc-line' }, [line]))
        : (opt.desc ? [el('div', { class:'choice-desc-line' }, [opt.desc])] : []);

      // cornerBadge: single prominent tag pinned to the top-right of the box
      // (used for Player Focus success chance — the most important number on
      // that card). Kept separate from inline badges so the visual hierarchy
      // is clear: corner = headline, inline = modifiers.
      const cornerBadge = opt.cornerBadge
        ? el('span', { class:'choice-corner-badge ' + (opt.cornerBadge.kind || 'info') }, [opt.cornerBadge.text])
        : null;

      // badges: qualitative inline tags (FIT, SYNERGY). Rendered as a pill row
      // between title and desc so they catch the eye after the title.
      const badgeRow = (opt.badges && opt.badges.length)
        ? el('div', { class:'choice-badges' },
            opt.badges.map(b => el('span', { class:'choice-badge ' + (b.kind || 'info') }, [b.text])))
        : null;

      const children = [
        cornerBadge,
        el('div', { class:'choice-title' }, [opt.name]),
        badgeRow,
        el('div', { class:'choice-desc' }, descChildren)
      ].filter(Boolean);

      if (showFocus && squadForPreview?.length) {
        const focusPlayers = previewTacticFocusPlayers(squadForPreview, opt.id, phase);
        if (focusPlayers.length) {
          const focusChips = focusPlayers.map(fp =>
            el('span', { class: 'focus-chip role-' + fp.role }, [
              el('span', { class: 'fc-role' }, [UI.roleAbbr(fp.role)]),
              el('span', { class: 'fc-name' }, [fp.name])
            ])
          );
          children.push(el('div', { class: 'choice-focus' }, [
            el('span', { class: 'cf-label' }, [I18N.t('ui.prob.boosts') || 'Boostet']),
            ...focusChips
          ]));
        }
      }

      const btn = el('button', { class:'choice' }, children);
      btn.addEventListener('click', () => {
        $('#interrupt-overlay').classList.remove('active');
        // Decision-History für Result-Screen speichern (Taktik-Name + Phase)
        if (showFocus) {
          match._decisionHistory = match._decisionHistory || [];
          match._decisionHistory.push({
            phase,
            tacticId: opt.id,
            tacticName: opt.name
          });
        }
        onPick(opt);
      });
      list.appendChild(btn);
    });
    modal.appendChild(list);

    // Stats-Panel in allen Modals: schlank gehalten wie in den situativen
    // Events — nur die Phase-Relevant-Stats-Tabelle, keine Summary und
    // kein Prose-Guide mehr. Begründung: die vorherige Kombi (Summary +
    // Guide + Panel) war informationsüberladen, und die Summary-Werte
    // (Shots/Accuracy/Buildup/Saves) sind bereits aus dem Live-Match-
    // Dashboard sichtbar. Der Entscheidungsraum wird durch Stats-Tabelle
    // plus Option-Descriptions abgedeckt, Prose-Guide war redundant.
    if (match && (phase === 'kickoff' || phase === 'halftime' || phase === 'final' || isEvent)) {
      const panel = el('div', { class:'interrupt-stats-always' });
      panel.appendChild(UI.renderTeamStatsPanel(match, { phase: isEvent ? 'kickoff' : phase }));
      modal.appendChild(panel);
    }

    $('#interrupt-overlay').classList.add('active');
  },

  getOpponentSaveCount(match) {
    const recorded = (match?.opp?.lineup || []).reduce((sum, player) => sum + (player._matchStats?.saves || 0), 0);
    const goalEvents = (match?.squad || []).reduce((sum, player) => sum + (player._matchStats?.goals || 0), 0);
    const inferred = Math.max(0, (match?.stats?.myShotsOnTarget || 0) - goalEvents);
    return Math.max(recorded, inferred);
  },

  getOnTargetLabel() {
    const label = I18N.t('ui.statsPanel.onTarget');
    return label === 'ui.statsPanel.onTarget' ? 'On Target' : label;
  },

  renderMatchStatsPanel(match) {
    const s = match.stats;
    const myAccuracy = s.myShots ? Math.round(s.myShotsOnTarget / s.myShots * 100) : 0;
    const oppAccuracy = s.oppShots ? Math.round(s.oppShotsOnTarget / s.oppShots * 100) : 0;
    const myBuildupRate = s.myBuildups ? Math.round(s.myBuildupsSuccess / s.myBuildups * 100) : 0;
    const oppBuildupRate = s.oppBuildups ? Math.round(s.oppBuildupsSuccess / s.oppBuildups * 100) : 0;
    const possession = s.possRounds ? Math.round((s.possAccum / s.possRounds) * 100) : 50;
    const oppSaves = UI.getOpponentSaveCount(match);
    UI._lastOppSaveCount = oppSaves;
    const panel = el('div', { class:'interrupt-panel' }, [
      el('div', { class:'ip-title' }, [I18N.t('ui.result.analysis')]),
      UI.renderMatchStatRow(I18N.t('ui.statsPanel.possession'), possession + '%', (100-possession) + '%'),
      UI.renderMatchStatRow(I18N.t('ui.statsPanel.shots'), s.myShots, s.oppShots),
      UI.renderMatchStatRow(UI.getOnTargetLabel(), s.myShotsOnTarget, s.oppShotsOnTarget),
      UI.renderMatchStatRow(I18N.t('ui.statsPanel.accuracy'), myAccuracy + '%', oppAccuracy + '%'),
      UI.renderMatchStatRow(I18N.t('ui.statsPanel.buildup'), myBuildupRate + '%', oppBuildupRate + '%'),
      UI.renderMatchStatRow(I18N.t('ui.statsPanel.saves'), s.saves, '–')
    ]);
    return panel;
  },

  renderMatchStatRow(label, meVal, oppVal) {
    let resolvedLabel = label;
    let resolvedOpp = oppVal;

    if (label === I18N.t('ui.statsPanel.saves') && (oppVal === 'â€“' || oppVal === '–')) {
      resolvedOpp = UI._lastOppSaveCount ?? oppVal;
    }

    return el('div', { class:'ip-match-row' }, [
      el('span', { class:'ip-match-me' }, [String(meVal)]),
      el('span', { class:'ip-match-label' }, [resolvedLabel]),
      el('span', { class:'ip-match-opp' }, [String(resolvedOpp)])
    ]);
  },

  renderTeamStatsPanel(match, opts={}) {
    const phase = opts.phase || 'kickoff';
    const normalizedPhase = (phase === 'halftime_focus' || phase === 'halftime_sub') ? 'halftime' : phase;
    const baseStats = getEffectiveTeamStats(match);
    const buffs = match.teamBuffs || {};
    const formBonus = match._teamFormBonus || 0;
    const phaseOrders = {
      kickoff: ['vision','composure','tempo','defense','offense'],
      halftime: ['vision','defense','composure','offense','tempo'],
      final: match.scoreMe > match.scoreOpp
        ? ['defense','composure','vision','tempo','offense']
        : ['offense','vision','composure','tempo','defense']
    };
    const keys = phaseOrders[normalizedPhase] || ['offense','defense','tempo','vision','composure'];
    const labels = { offense:I18N.t('stats.offense'), defense:I18N.t('stats.defense'), tempo:I18N.t('stats.tempo'), vision:I18N.t('stats.vision'), composure:I18N.t('stats.composure') };
    const phaseNotes = normalizedPhase === 'kickoff'
      ? { vision:'build-up', composure:'control', tempo:'pressure', defense:'cover', offense:'finish' }
      : (normalizedPhase === 'halftime'
        ? { vision:'entry', defense:'hold', composure:'stability', offense:'finish', tempo:'tempo' }
        : { defense:'hold', composure:'nerve', vision:'entry', tempo:'swing', offense:'finish' });
    const rows = keys.map(k => {
      const base = baseStats[k];
      const buff = (buffs[k] || 0);
      const effective = base;
      const oppVal = match.opp?.stats[k] || 0;
      const diff = effective - oppVal;
      const cmp = effective > oppVal ? 'ip-higher' : (effective < oppVal ? 'ip-lower' : '');
      const diffCls = diff > 0 ? 'ip-buff-pos' : (diff < 0 ? 'ip-buff-neg' : 'ip-buff-neutral');
      const diffStr = diff > 0 ? '+' + diff : String(diff);
      return el('div', { class:'ip-stat-row' }, [
        el('span', { class:'ip-stat-label' }, [`${labels[k]}  ${phaseNotes[k] ? '· ' + phaseNotes[k] : ''}`]),
        el('span', { class:'ip-stat-main ' + cmp }, [String(effective)]),
        el('span', { class:'ip-stat-buff ' + diffCls }, [diffStr]),
        el('span', { class:'ip-stat-opp' }, [String(oppVal)])
      ]);
    });
    return el('div', { class:'interrupt-panel' }, [
      el('div', { class:'ip-title' }, [normalizedPhase === 'kickoff' ? I18N.t('ui.statsPanel.phaseRelevantStats') : I18N.t('ui.statsPanel.currentTeamStats')]),
      el('div', { class:'ip-stat-header' }, [
        el('span', {}, ['']),
        el('span', {}, [I18N.t('ui.statsPanel.own')]),
        el('span', {}, [I18N.t('ui.statsPanel.diff')]),
        el('span', {}, [I18N.t('ui.statsPanel.opponent')])
      ]),
      ...rows,
      el('div', { class:'ip-footnote' }, [I18N.t('ui.statsPanel.liveFootnote')])
    ]);
  },

  showEvolution(player, options, onPick) {
    const modal = $('#interrupt-modal');
    modal.innerHTML = '';
    modal.classList.remove('interrupt-modal--event');
    modal.appendChild(el('h2', { style:{ color:'var(--gold)' } }, [I18N.t('ui.evolution.title')]));
    modal.appendChild(el('div', { class:'sub' }, [I18N.t('ui.evolution.reachedLevel', { name: player.name, role: DATA.roles.find(r=>r.id===player.role)?.label, level: player.level })]));
    const opts = el('div', { class:'evo-options' });
    options.forEach(evoId => {
      const evo = DATA.evoDetails[evoId];
      if (!evo) return;
      const boostText = Object.entries(evo.boosts).map(([k,v]) => `${k.substring(0,3).toUpperCase()} ${v>=0?'+':''}${v}`).join('  ');
      const traitDef = DATA.traits[evo.trait];
      const card = el('div', { class:'evo-option' }, [
        el('div', { class:'evo-name' }, [evo.label]),
        el('div', { class:'evo-role' }, [DATA.roles.find(r=>r.id===evo.role)?.label || evo.role]),
        el('div', { class:'evo-boost' }, [boostText]),
        traitDef ? el('div', { class:'evo-trait' }, [
          el('b', {}, [I18N.t('ui.evolution.traitLabel', { name: traitDef.name })]),
          el('span', {}, [traitDef.desc])
        ]) : null,
        evo.parentTrait ? el('div', { class:'mono-sm', style:{ marginTop:'6px', color:'var(--accent-2)' } }, [
          I18N.t('ui.evolution.keepsTrait', { name: DATA.traits[evo.parentTrait]?.name || evo.parentTrait })
        ]) : null
      ]);
      card.addEventListener('click', () => {
        $('#interrupt-overlay').classList.remove('active');
        onPick(evoId);
      });
      opts.appendChild(card);
    });
    modal.appendChild(opts);
    $('#interrupt-overlay').classList.add('active');
  },

  // Extrahiert die 2-3 wichtigsten Momente aus einem Match.
  // Gibt Objekte mit {icon, text, tone}.
  buildResultHighlights(match, result) {
    if (!match?.squad) return [];
    const highlights = [];
    const squad = match.squad;

    // Top scorer
    const scorers = squad
      .filter(p => (p._matchStats?.goals || 0) > 0)
      .sort((a, b) => (b._matchStats.goals || 0) - (a._matchStats.goals || 0));
    if (scorers.length) {
      const top = scorers[0];
      const g = top._matchStats.goals;
      const key = g >= 3 ? 'ui.result.hlHatTrick'
                : g >= 2 ? 'ui.result.hlBraceOrHat'
                : 'ui.result.hlGoal';
      highlights.push({
        icon: '⚽',
        text: I18N.t(key, { name: top.name, n: g }),
        tone: 'good'
      });
    }

    // Keeper save count
    const keeper = squad.find(p => p.role === 'TW');
    if (keeper) {
      const saves = keeper._matchStats?.saves || 0;
      if (saves >= 4) {
        highlights.push({
          icon: '🧤',
          text: I18N.t('ui.result.hlKeeperBig', { name: keeper.name, n: saves }),
          tone: 'good'
        });
      } else if (saves >= 2 && result !== 'loss') {
        highlights.push({
          icon: '🧤',
          text: I18N.t('ui.result.hlKeeperSolid', { name: keeper.name, n: saves }),
          tone: 'good'
        });
      }
    }

    // Big XP gainer (breakout)
    const breakout = squad
      .map(p => ({ p, xp: p._lastMatchXp || 0 }))
      .filter(({ xp }) => xp >= 8)
      .sort((a, b) => b.xp - a.xp)[0];
    if (breakout && highlights.length < 3) {
      highlights.push({
        icon: '✦',
        text: I18N.t('ui.result.hlBreakout', { name: breakout.p.name, xp: breakout.xp }),
        tone: 'neutral'
      });
    }

    // Low performer (nur bei Niederlage, nur wenn wirklich unterirdisch)
    if (result === 'loss' && highlights.length < 3) {
      const flop = squad
        .map(p => ({ p, xp: p._lastMatchXp || 0 }))
        .filter(({ xp }) => xp <= 1)
        .sort((a, b) => a.xp - b.xp)[0];
      if (flop) {
        highlights.push({
          icon: '✗',
          text: I18N.t('ui.result.hlFlop', { name: flop.p.name }),
          tone: 'warn'
        });
      }
    }

    // Sacrifice (falls vorhanden) — das ist erzählerisch wichtig
    if (match._sacrificeVictim) {
      highlights.push({
        icon: '⚠',
        text: I18N.t('ui.result.sacrificeNote', { name: match._sacrificeVictim.name }),
        tone: 'warn'
      });
    }

    // Decision-Wert: Vergleich Pre-Match-Win-Prob gegen tatsächliches
    // Ergebnis. Ein Sieg bei 30% Pre-Match-Prob war +70pp "over expectation",
    // eine Niederlage bei 70% war -70pp. Das ist nicht exakt der Wert der
    // Entscheidungen (Random ist auch dabei), aber es gibt dem Spieler
    // Feedback dazu, ob er über oder unter Erwartung performt hat.
    // Nur zeigen wenn Pre-Match-Prob vorhanden und das Delta signifikant ist.
    if (typeof match._preMatchWinProb === 'number' && highlights.length < 3) {
      const preWin = match._preMatchWinProb * 100; // war 0..1
      let actualPoints;
      if (result === 'win')       actualPoints = 100;
      else if (result === 'draw') actualPoints = 50;
      else                        actualPoints = 0;
      const delta = Math.round(actualPoints - preWin);
      if (Math.abs(delta) >= 15) {
        const tone = delta > 0 ? 'good' : 'warn';
        const key = delta > 0 ? 'ui.result.hlOverperform' : 'ui.result.hlUnderperform';
        highlights.push({
          icon: delta > 0 ? '▲' : '▼',
          text: I18N.t(key, { delta: Math.abs(delta), pre: Math.round(preWin) }),
          tone
        });
      }
    }

    return highlights.slice(0, 3);
  },

  renderResult(result, scoreMe, scoreOpp, reward, match) {
    if (window.FX) {
      if (result === 'win') window.FX.winResult();
      else if (result === 'loss') window.FX.lossResult();
    }
    const cls = result === 'win' ? 'win' : (result === 'loss' ? 'loss' : 'draw');
    const title = result === 'win' ? I18N.t('ui.result.win')
                 : result === 'loss' ? I18N.t('ui.result.loss')
                 : I18N.t('ui.result.draw');
    const content = $('#result-content');
    content.innerHTML = '';

    // --- Zone A: Hero — Result title + Score. Nur das. ---
    content.appendChild(el('div', { class:'result-hero' }, [
      el('h1', { class: cls }, [title]),
      el('div', { class:'result-score' }, [`${scoreMe} : ${scoreOpp}`]),
      reward ? el('div', { class:'result-reward' }, [reward]) : null
    ]));

    // --- Zone B: Highlights — was erzählerisch zählt ---
    if (match) {
      const highlights = UI.buildResultHighlights(match, result);
      if (highlights.length) {
        const hlBox = el('div', { class:'result-highlights' });
        highlights.forEach(h => {
          hlBox.appendChild(el('div', { class:'result-hl tone-' + h.tone }, [
            el('span', { class:'hl-icon' }, [h.icon]),
            el('span', { class:'hl-text' }, [h.text])
          ]));
        });
        content.appendChild(hlBox);
      }

      // --- Zone C: Player Cards — exakt wie Hub/Lineup, mit Stat-Diffs ---
      // Plus Result-spezifischer Footer pro Karte: XP-Gewinn, Form-Delta,
      // rollenspezifische Match-Performance.
      const perfBox = el('div', { class:'result-perf-grid squad-display' });
      for (const p of match.squad) {
        const xp = p._lastMatchXp || 0;
        const ms = p._matchStats || {};
        const formDelta = p._formDelta || 0;

        let detail = '';
        if (p.role === 'ST' || p.role === 'LF') detail = `${ms.goals || 0}⚽ · ${ms.shotsOnTarget || 0}/${ms.shots || 0}🎯`;
        else if (p.role === 'PM') detail = `${ms.buildupsOk || 0}/${ms.buildups || 0} ${I18N.t('ui.statsPanel.buildup')}`;
        else if (p.role === 'VT') detail = `${ms.defendedAttacks || 0} ${I18N.t('ui.result.stopsLabel')}`;
        else if (p.role === 'TW') detail = `${ms.saves || 0} ${I18N.t('ui.statsPanel.saves')}`;

        const xpTone = xp >= 6 ? 'good' : (xp <= 2 ? 'bad' : 'dim');
        // Früher: inline-Split "+17 XP (7+10★)" der die Meta-Zeile
        // verbreitet und den Form-Chip inkonsistent nach unten umbrach.
        // Die vollständige Decision-XP-Aufschlüsselung steht weiter
        // unten in der Details-Sektion ("Deine Entscheidungen").
        const xpChildren = [`+${xp} XP`];

        const formMark = formDelta > 0 ? '↑' : (formDelta < 0 ? '↓' : '');
        const formColor = formDelta > 0 ? 'var(--good)' : (formDelta < 0 ? 'var(--danger)' : 'var(--muted)');
        const formLabelKey = formDelta > 0 ? 'ui.labels.goodForm' : 'ui.labels.badForm';

        // Academy-Spieler: kein XP-Chip, keine Form-Anzeige — beides gibt
        // es für Aushilfen nicht und die "+0 XP bad"-Darstellung wäre
        // irreführend (sie haben nicht schlecht gespielt, sie bekommen
        // per Design keine XP).
        const metaChildren = p.isAcademy
          ? [el('span', { class:'rcf-xp dim', style:{ fontStyle:'italic' } }, [I18N.t('ui.labels.academy') || 'ACADEMY'])]
          : [
              el('span', { class:'rcf-xp ' + xpTone }, xpChildren),
              formMark
                ? el('span', { class:'rcf-form', style:{ color: formColor } }, [formMark + ' ' + I18N.t(formLabelKey).toLowerCase()])
                : null
            ];

        // Wrapper: Standard-Card oben + Result-Footer drunter
        const wrap = el('div', { class:'result-card-wrap' });
        wrap.appendChild(UI.renderPlayerCard(p, { showStatDiff: true }));
        wrap.appendChild(el('div', { class:'result-card-foot' }, [
          el('div', { class:'rcf-detail' }, [detail || '—']),
          el('div', { class:'rcf-meta' }, metaChildren)
        ]));
        perfBox.appendChild(wrap);
      }
      content.appendChild(perfBox);

      // --- Zone D: Ausklappbare Details (Stats + Log + Trait-Report) ---
      const detailsWrap = el('div', { class:'result-details' });
      const detailsHeader = el('button', { class:'btn result-details-toggle' },
        ['▶ ' + I18N.t('ui.result.detailsToggle')]);
      const detailsBody = el('div', { class:'result-details-body', style:{ display:'none' } });

      // Match log (falls vorhanden)
      const logEntries = (window.getState?.()?._lastMatchLog) || [];
      if (logEntries.length) {
        const logCard = el('div', { class:'result-sub-card' });
        logCard.appendChild(el('div', { class:'result-sub-title' }, [I18N.t('ui.result.matchLogTitle')]));
        const logBody = el('div', { class:'match-log', style:{ maxHeight:'200px', fontSize:'14px' } });
        logEntries.forEach(({ msg, cls }) => logBody.appendChild(el('div', { class:'log-line ' + cls }, [msg])));
        logCard.appendChild(logBody);
        detailsBody.appendChild(logCard);
      }

      // Match-Flow-Karte: zeigt wie sich die Team-Stats vom Kickoff bis zum
      // Match-Ende entwickelt haben. Die Live-Momentum-Baseline wird nach
      // jeder Taktik neu berechnet, also misst sie den "Snowball-Effekt"
      // der Buffs + Traits + Form + Streak. Nützlich um zu verstehen WARUM
      // ein knappes Match am Ende klar ausging.
      if (match._momentumBaseline) {
        const base = match._momentumBaseline.me;
        const current = (() => {
          const totals = { offense:0, defense:0, tempo:0, vision:0, composure:0 };
          for (const p of match.squad) {
            const s = (typeof computePlayerStats === 'function')
              ? computePlayerStats(p, match) : (p.stats || {});
            for (const k of Object.keys(totals)) totals[k] += (s[k] || 0);
          }
          for (const k of Object.keys(totals)) totals[k] = Math.round(totals[k] / match.squad.length);
          return totals;
        })();
        const deltas = Object.keys(base)
          .map(k => ({ stat: k, from: base[k], to: current[k], delta: current[k] - base[k] }))
          .filter(d => Math.abs(d.delta) >= 2)
          .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
        if (deltas.length) {
          const STAT_LABEL = { offense:'OFF', defense:'DEF', tempo:'TMP', vision:'VIS', composure:'CMP' };
          const flowCard = el('div', { class:'result-sub-card' });
          flowCard.appendChild(el('div', { class:'result-sub-title' }, [
            I18N.t('ui.result.matchFlowTitle') || 'Match Flow'
          ]));
          flowCard.appendChild(el('div', { class:'result-sub-hint' }, [
            I18N.t('ui.result.matchFlowHint') || 'Team-Stat-Entwicklung während des Matches (Buffs, Form, Traits).'
          ]));
          for (const d of deltas) {
            const sign = d.delta > 0 ? '+' : '';
            const tone = d.delta > 0 ? 'good' : 'bad';
            flowCard.appendChild(el('div', { class:'decision-row' }, [
              el('span', { class:'dec-phase' }, [STAT_LABEL[d.stat] || d.stat.toUpperCase()]),
              el('span', { class:'dec-name' },  [`${d.from} → ${d.to}`]),
              el('span', { class:'dec-delta tone-' + tone }, [`${sign}${d.delta}`])
            ]));
          }
          detailsBody.appendChild(flowCard);
        }
      }

      // Decision-History — was deine Taktik-Wahlen an XP eingebracht haben
      const decisions = match._decisionHistory || [];
      if (decisions.length) {
        const decCard = el('div', { class:'result-sub-card' });
        decCard.appendChild(el('div', { class:'result-sub-title' }, [
          I18N.t('ui.result.decisionsTitle') || 'Deine Entscheidungen'
        ]));
        // Pro-Taktik-XP-Quellen aus _decisionXpSources aggregieren
        const perTactic = {};
        for (const p of match.squad) {
          const sources = p._matchStats?._decisionXpSources || {};
          for (const [tacticName, xp] of Object.entries(sources)) {
            perTactic[tacticName] = perTactic[tacticName] || { total: 0, players: [] };
            perTactic[tacticName].total += xp;
            perTactic[tacticName].players.push({ name: p.name, role: p.role, xp });
          }
        }
        let grandTotal = 0;
        for (const d of decisions) {
          const phaseLabel = I18N.t('ui.result.decisionPhase.' + d.phase) || d.phase;
          const entry = perTactic[d.tacticName] || { total: 0, players: [] };
          grandTotal += entry.total;
          const xpText = entry.total > 0
            ? `+${entry.total} XP (${entry.players.map(x => UI.roleAbbr(x.role)).join(', ')})`
            : I18N.t('ui.result.decisionNoXp') || 'keine XP';
          const tone = entry.total > 0 ? 'good' : 'neutral';
          decCard.appendChild(el('div', { class:'decision-row' }, [
            el('span', { class:'dec-phase' }, [phaseLabel]),
            el('span', { class:'dec-name' },  [d.tacticName]),
            el('span', { class:'dec-delta tone-' + tone }, [xpText])
          ]));
        }
        if (grandTotal > 0) {
          decCard.appendChild(el('div', { class:'decision-row decision-total' }, [
            el('span', { class:'dec-phase' }, []),
            el('span', { class:'dec-name' }, [I18N.t('ui.result.decisionsSum') || 'Summe']),
            el('span', { class:'dec-delta tone-good' }, [`+${grandTotal} XP`])
          ]));
        }
        detailsBody.appendChild(decCard);
      }

      // Micro-Boost-Summary — welche Spieler haben in diesem Match Stats
      // akkumuliert. Einzeiler pro Boost mit Rolle, Spieler, Stat, neuer
      // Wert. Kommt nur wenn mindestens ein Boost aufgetreten ist.
      const allBoosts = [];
      for (const p of match.squad) {
        const boosts = p._matchStats?._microBoosts || [];
        for (const mb of boosts) {
          allBoosts.push({ name: p.name, role: p.role, ...mb });
        }
      }
      if (allBoosts.length) {
        const STAT_LABEL = { offense:'OFF', defense:'DEF', tempo:'TMP', vision:'VIS', composure:'CMP' };
        const mbCard = el('div', { class:'result-sub-card' });
        mbCard.appendChild(el('div', { class:'result-sub-title' }, [
          I18N.t('ui.result.microBoostsTitle')
        ]));
        mbCard.appendChild(el('div', { class:'result-sub-hint' }, [
          I18N.t('ui.result.microBoostsHint')
        ]));
        for (const b of allBoosts) {
          mbCard.appendChild(el('div', { class:'decision-row' }, [
            el('span', { class:'dec-phase' }, [UI.roleAbbr(b.role)]),
            el('span', { class:'dec-name' },  [b.name]),
            el('span', { class:'dec-delta tone-good' }, [
              `${STAT_LABEL[b.stat] || b.stat.toUpperCase()} ↑ ${b.newValue}`
            ])
          ]));
        }
        detailsBody.appendChild(mbCard);
      }

      // Stats-Tabelle
      const s = match.stats;
      const myAccuracy  = s.myShots   ? Math.round(s.myShotsOnTarget / s.myShots * 100) : 0;
      const oppAccuracy = s.oppShots  ? Math.round(s.oppShotsOnTarget / s.oppShots * 100) : 0;
      const myBuildupRate  = s.myBuildups  ? Math.round(s.myBuildupsSuccess / s.myBuildups * 100) : 0;
      const oppBuildupRate = s.oppBuildups ? Math.round(s.oppBuildupsSuccess / s.oppBuildups * 100) : 0;
      const possession = s.possRounds ? Math.round((s.possAccum / s.possRounds) * 100) : 50;
      const oppSaves = UI.getOpponentSaveCount(match);
      UI._lastOppSaveCount = oppSaves;
      const statsCard = el('div', { class:'result-sub-card' });
      statsCard.appendChild(el('div', { class:'result-sub-title' }, [I18N.t('ui.result.analysis')]));
      [
        [I18N.t('ui.statsPanel.possession'), possession + '%', (100 - possession) + '%'],
        [I18N.t('ui.statsPanel.goals'),      scoreMe,           scoreOpp],
        [I18N.t('ui.statsPanel.shots'),      s.myShots,         s.oppShots],
        [UI.getOnTargetLabel(),              s.myShotsOnTarget, s.oppShotsOnTarget],
        [I18N.t('ui.statsPanel.accuracy'),   myAccuracy + '%',  oppAccuracy + '%'],
        [I18N.t('ui.statsPanel.buildup'),    myBuildupRate + '%', oppBuildupRate + '%'],
        [I18N.t('ui.statsPanel.saves'),      s.saves,           oppSaves],
        [I18N.t('ui.statsPanel.abilitiesTriggered'), s.triggersFired || 0, s.oppTriggersFired || 0]
      ].forEach(([label, me, opp]) => statsCard.appendChild(UI.renderMatchStatRow(label, me, opp)));
      detailsBody.appendChild(statsCard);

      // Trait-Report
      if (typeof buildMatchTraitReport === 'function') {
        const report = buildMatchTraitReport(match);
        if (report.length) {
          const traitCard = el('div', { class:'result-sub-card' });
          traitCard.appendChild(el('div', { class:'result-sub-title' }, [I18N.t('ui.result.traitReportTitle')]));
          const list = el('div', { class:'result-perf-list' });
          for (const entry of report) {
            const fireLabel = entry.isPassive
              ? I18N.t('ui.result.traitReportPassive')
              : I18N.t('ui.result.traitReportFires', { count: entry.count });
            list.appendChild(el('div', { class:'result-perf-row' }, [
              el('span', { class:'perf-role' }, [entry.role ? UI.roleAbbr(entry.role) : '—']),
              el('span', { class:'perf-name' }, [entry.traitName]),
              el('span', { class:'perf-detail' }, [entry.playerName]),
              el('span', { class:'perf-xp good' }, [fireLabel]),
              el('span', { class:'perf-impact' }, [I18N.t('ui.result.traitReportImpact', { value: entry.estimatedImpact })])
            ]));
          }
          traitCard.appendChild(list);
          detailsBody.appendChild(traitCard);
        }
      }

      detailsHeader.addEventListener('click', () => {
        const open = detailsBody.style.display !== 'none';
        detailsBody.style.display = open ? 'none' : 'block';
        detailsHeader.textContent = (open ? '▶ ' : '▼ ') + I18N.t('ui.result.detailsToggle');
      });
      detailsWrap.appendChild(detailsHeader);
      detailsWrap.appendChild(detailsBody);
      content.appendChild(detailsWrap);
    }

    content.appendChild(el('div', { class:'btn-row', style:{ justifyContent:'center', marginTop:'20px' } }, [
      el('button', { class:'btn primary', onClick: () => FLOW.continueRun() }, [I18N.t('ui.result.continue')])
    ]));
    UI.showScreen('screen-result');
  }
};

window.buildContextHint = buildContextHint;
window.extractHintTokens = extractHintTokens;
window.UI = UI;
