const UI = {
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
        team.difficultyLabel ? el('div', { class:'team-diff-badge' }, [team.difficultyLabel]) : null,
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

  _buildOppTell(opp) {
    const parts = [];
    const locTells = I18N.locale().data?.oppTells || {};
    if (opp.special?.id && locTells[opp.special.id]) parts.push(locTells[opp.special.id]);
    for (const traitId of (opp.traits || [])) {
      if (locTells['trait_' + traitId]) parts.push(locTells['trait_' + traitId]);
    }
    if (opp.isBoss) parts.push(I18N.t('ui.labels.bossTell'));
    return parts.length ? parts[0] : null;
  },

  renderHub() {
    $('#hub-match-num').textContent = state.matchNumber + 1;
    $('#hub-wins').textContent = state.wins;
    $('#hub-losses').textContent = state.losses;
    $('#hub-points').textContent = state.seasonPoints;
    if (state.currentLossStreak >= 2) {
      $('#hub-losses').style.color = 'var(--danger)';
    } else {
      $('#hub-losses').style.color = '';
    }
    const prog = $('#run-progress');
    prog.innerHTML = '';
    for (let i = 0; i < CONFIG.runLength; i++) {
      const isFinal = (i + 1) === CONFIG.runLength;
      const children = isFinal ? ['🏆'] : [];
      const cell = el('div', { class:'progress-cell' + (isFinal ? ' final' : '') }, children);
      if (CONFIG.bossMatches.includes(i+1)) cell.classList.add('boss');
      if (i < state.matchHistory.length) {
        cell.classList.add('done');
        const hist = state.matchHistory[i];
        cell.classList.add(hist.result);
        cell.title = I18N.t('ui.labels.matchLabel', { num: i + 1, me: hist.scoreMe, opp: hist.scoreOpp, name: hist.opp });
      } else if (i === state.matchNumber) {
        cell.classList.add('current');
      }
      prog.appendChild(cell);
    }
    const opp = state.currentOpponent;
    const lineup = getLineup();
    const teamStats = aggregateTeamStats(lineup);
    const teamPower = teamTotalPower(lineup);
    const teamTheme = teamStrengthLabel(teamStats);
    $('#hub-team-meta').textContent = I18N.t('ui.labels.compactTeamMeta', { lineup: lineup.length, bench: getBench().length });
    const sumBox = $('#hub-team-summary');
    sumBox.innerHTML = '';
    const teamFormAvg = lineup.reduce((s, p) => s + (p.form || 0), 0) / Math.max(1, lineup.length);
    let teamFormText = '';
    if (teamFormAvg >= 2)       teamFormText = ' · 🔥 ' + I18N.t('ui.labels.hotStreak');
    else if (teamFormAvg >= 1)  teamFormText = ' · ↑ ' + I18N.t('ui.labels.goodForm');
    else if (teamFormAvg <= -2) teamFormText = ' · ❄ ' + I18N.t('ui.labels.crisis');
    else if (teamFormAvg <= -1) teamFormText = ' · ↓ ' + I18N.t('ui.labels.badForm');
    sumBox.appendChild(el('div', { class:'matchup-meta' }, [
      el('div', { class:'name me' }, [state.teamName || I18N.t('ui.hub.yourTeam')]),
      el('div', { class:'meta-line' }, [`${I18N.t('ui.labels.power')} ${teamPower} · ${teamTheme}${teamFormText}`])
    ]));
    if (state.currentLossStreak === 2) {
      sumBox.appendChild(el('div', {
        style: {
          background: 'rgba(255,60,110,0.15)',
          border: '1px solid var(--accent-2)',
          padding: '6px 8px',
          marginBottom: '8px',
          fontSize: '10px',
          color: 'var(--accent-2)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-display)'
        }
      }, [I18N.t('ui.labels.losingWarning')]));
    }
    const teamTrends = {};
    for (const p of lineup) {
      const focus = DATA.roles.find(r => r.id === p.role)?.focusStat;
      if (!focus) continue;
      teamTrends[focus] = (teamTrends[focus] || 0) + (p.form || 0);
    }
    sumBox.appendChild(UI.renderComparedStatBars(teamStats, opp.stats, teamTrends, { compact:true }));
    const oppBox = $('#next-opponent');
    oppBox.innerHTML = '';
    const traitNames = (opp.traits || [])
      .map(tid => OPP_TRAITS.find(x => x.id === tid)?.name)
      .filter(Boolean);
    const ausrichtungParts = [opp.special?.name || I18N.t('ui.labels.standard')];
    if (traitNames.length) ausrichtungParts.push(...traitNames);
    const oppMeta = [
      el('div', { class:'name ' + (opp.isBoss ? 'boss' : 'opp') }, [
        (opp.isBoss ? '🏆 ' : '') + opp.name
      ]),
      el('div', { class:'meta-line' }, [
        `${I18N.t('ui.labels.power')} ${opp.power} · ${ausrichtungParts.join(' / ')}`
      ])
    ];
    oppBox.appendChild(el('div', { class:'matchup-meta' }, oppMeta));
    const tell = UI._buildOppTell(opp);
    if (tell) {
      oppBox.appendChild(el('div', {
        style: {
          background: 'rgba(255,210,58,0.10)',
          border: '1px solid rgba(255,210,58,0.35)',
          padding: '5px 8px',
          margin: '6px 0',
          fontSize: '10px',
          color: 'var(--gold)',
          letterSpacing: '0.04em',
          fontFamily: 'var(--font-display)',
          textTransform: 'uppercase'
        }
      }, ['⚠ ' + tell]));
    }
    oppBox.appendChild(UI.renderComparedStatBars(opp.stats, teamStats, {}, { compact:true }));
    const sqBox = $('#hub-squad');
    sqBox.innerHTML = '';
    lineup.forEach(p => sqBox.appendChild(UI.renderPlayerCard(p)));
    const bench = getBench();
    const benchWrap = $('#hub-bench-wrap');
    if (bench.length > 0) {
      benchWrap.style.display = 'block';
      const benchBox = $('#hub-bench');
      benchBox.innerHTML = '';
      bench.forEach(p => benchBox.appendChild(UI.renderPlayerCard(p, { bench:true })));
    } else {
      benchWrap.style.display = 'none';
    }
    UI.showScreen('screen-hub');
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
    const stageSymbols = ['★', '★★', '★★★'];
    const classes = ['p-card'];
    if (opts.selected) classes.push('selected');
    if (p.pendingLevelUp) classes.push('level-up-pending');
    if (p.isLegendary || opts.legendary) classes.push('legendary');
    if (opts.bench) classes.push('bench');
    if (opts.swapTarget) classes.push('swap-target');
    const card = el('div', { class: classes.join(' ') }, [
      el('div', { class:'role' }, [p.role + ' · ' + (DATA.roles.find(r=>r.id===p.role)?.label || '')]),
      el('div', { class:'stage' }, [stageSymbols[p.stage] || '★']),
      el('div', { class:'name' }, [p.name]),
      el('div', { class:'mono-sm', style:{ marginBottom:'6px' } }, [p.label]),
      el('div', { class:'stats' }, [
        el('div', { class:'stat' }, ['OFF', el('b', {}, [String(p.stats.offense)])]),
        el('div', { class:'stat' }, ['DEF', el('b', {}, [String(p.stats.defense)])]),
        el('div', { class:'stat' }, ['TMP', el('b', {}, [String(p.stats.tempo)])]),
        el('div', { class:'stat' }, ['VIS', el('b', {}, [String(p.stats.vision)])]),
        el('div', { class:'stat' }, ['CMP', el('b', {}, [String(p.stats.composure)])])
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
    $('#match-me-name').textContent = getTeamDisplayName(squad);
    $('#match-opp-name').textContent = opp.name;
    $('#score-me').textContent = '0';
    $('#score-opp').textContent = '0';
    const ri = $('#round-indicator');
    ri.innerHTML = '';
    for (let i = 0; i < CONFIG.rounds; i++) {
      ri.appendChild(el('div', { class:'round-dot', 'data-round':(i+1) }));
    }
    $('#match-log').innerHTML = '';
    UI.renderMatchFooter(squad, opp);
    UI.showScreen('screen-match');
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

  updateMatchScore(match) {
    $('#score-me').textContent = String(match.scoreMe);
    $('#score-opp').textContent = String(match.scoreOpp);
    UI.updateRoundIndicator(match.round);
    UI.renderMatchFooter(match.squad, match.opp);
  },

  appendLog(msg, cls='') {
    if (window.FX) {
      if (cls === 'goal-me') window.FX.goalMe();
      else if (cls === 'goal-opp') window.FX.goalOpp();
    }
    const log = $('#match-log');
    const line = el('div', { class:'log-line ' + cls }, [msg]);
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  },

  // ── Halftime summary panel ────────────────────────────────────────────────
  renderHalftimeSummary(match, opts={}) {
    const s = match.stats;
    const myAcc  = s.myShots  ? Math.round(s.myShotsOnTarget  / s.myShots  * 100) : null;
    const myBR   = s.myBuildups ? Math.round(s.myBuildupsSuccess / s.myBuildups * 100) : null;
    const poss   = s.possRounds ? Math.round((s.possAccum / s.possRounds) * 100) : 50;

    // Active mechanic tags carrying into 2nd half
    const mechanics = [];
    if (match.autoCounterRoundsLeft > 0) mechanics.push({ icon:'⚡', label: I18N.t('ui.ht.mechanicCounter') });
    if (match.pressingRoundsLeft    > 0) mechanics.push({ icon:'🏃', label: I18N.t('ui.ht.mechanicPressing') });
    if (match.possessionActive)          mechanics.push({ icon:'🎯', label: I18N.t('ui.ht.mechanicPossession') });
    if (match.aggressiveRoundsLeft  > 0) mechanics.push({ icon:'💥', label: I18N.t('ui.ht.mechanicAggressive') });
    if (match.flankRoundsLeft       > 0) mechanics.push({ icon:'🏃', label: I18N.t('ui.ht.mechanicFlank') });
    if (match._rallyActive)              mechanics.push({ icon:'💢', label: I18N.t('ui.ht.mechanicRally') });

    // What the mechanics actually did in the first half
    const happened = [];
    if ((match._htPressingBlocks || 0) > 0)
      happened.push(`🛡 ${I18N.t('ui.ht.pressBlocked', { n: match._htPressingBlocks })}`);
    if ((match._htCountersFired || 0) > 0)
      happened.push(`⚡ ${I18N.t('ui.ht.countersFired', { n: match._htCountersFired })}`);
    if ((match.momentumCounter || 0) >= 2)
      happened.push(`🔄 ${I18N.t('ui.ht.momentumActive', { bonus: 15 })}`);

    const panel = el('div', { class:'interrupt-panel ht-summary' }, [
      el('div', { class:'ip-title' }, [opts.title || I18N.t('ui.ht.title')]),

      // Score + possession strip
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

      // 4 key numbers — own values only, no colour coding, no opponent comparison
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

      // What mechanics fired — only shown if something actually happened
      happened.length ? el('div', { class:'ht-happened' },
        happened.map(h => el('div', { class:'ht-happened-item' }, [h]))
      ) : null,

      // Active mechanics carrying into 2nd half
      mechanics.length ? el('div', { class:'ht-mechanics' }, [
        el('div', { class:'ht-mechanics-title' }, [I18N.t('ui.ht.activeIntoSecondHalf')]),
        ...mechanics.map(m => el('div', { class:'ht-mechanic-tag' }, [m.icon + ' ' + m.label]))
      ]) : null
    ]);
    return panel;
  },

  showInterrupt(title, subtitle, options, onPick, match, phase) {
    const modal = $('#interrupt-modal');
    modal.innerHTML = '';
    modal.appendChild(el('h2', {}, [title]));
    modal.appendChild(el('div', { class:'sub' }, [subtitle]));
    const list = el('div', { class:'choice-list' });
    options.forEach(opt => {
      const btn = el('button', { class:'choice' }, [
        el('div', { class:'choice-title' }, [opt.name]),
        el('div', { class:'choice-desc' }, [opt.desc])
      ]);
      btn.addEventListener('click', () => {
        $('#interrupt-overlay').classList.remove('active');
        onPick(opt);
      });
      list.appendChild(btn);
    });
    modal.appendChild(list);

    if (match) {
      if (phase === 'halftime' || phase === 'final') {
        // ── Halftime + Final: show match summary panel ───────────────────────
        const title = phase === 'final' ? I18N.t('ui.flow.finalTitle') : undefined;
        modal.appendChild(UI.renderHalftimeSummary(match, { title }));
      }
      // ── Kickoff: no panels — no data yet ────────────────────────────────
    }

    $('#interrupt-overlay').classList.add('active');
  },

  renderMatchStatsPanel(match) {
    const s = match.stats;
    const myAccuracy = s.myShots ? Math.round(s.myShotsOnTarget / s.myShots * 100) : 0;
    const oppAccuracy = s.oppShots ? Math.round(s.oppShotsOnTarget / s.oppShots * 100) : 0;
    const myBuildupRate = s.myBuildups ? Math.round(s.myBuildupsSuccess / s.myBuildups * 100) : 0;
    const oppBuildupRate = s.oppBuildups ? Math.round(s.oppBuildupsSuccess / s.oppBuildups * 100) : 0;
    const possession = s.possRounds ? Math.round((s.possAccum / s.possRounds) * 100) : 50;
    const panel = el('div', { class:'interrupt-panel' }, [
      el('div', { class:'ip-title' }, [I18N.t('ui.result.analysis')]),
      UI.renderMatchStatRow(I18N.t('ui.statsPanel.possession'), possession + '%', (100-possession) + '%'),
      UI.renderMatchStatRow(I18N.t('ui.statsPanel.shots'), s.myShots, s.oppShots),
      UI.renderMatchStatRow(I18N.t('ui.statsPanel.accuracy'), myAccuracy + '%', oppAccuracy + '%'),
      UI.renderMatchStatRow(I18N.t('ui.statsPanel.buildup'), myBuildupRate + '%', oppBuildupRate + '%'),
      UI.renderMatchStatRow(I18N.t('ui.statsPanel.saves'), s.saves, '–')
    ]);
    return panel;
  },

  renderMatchStatRow(label, meVal, oppVal) {
    return el('div', { class:'ip-match-row' }, [
      el('span', { class:'ip-match-me' }, [String(meVal)]),
      el('span', { class:'ip-match-label' }, [label]),
      el('span', { class:'ip-match-opp' }, [String(oppVal)])
    ]);
  },

  renderTeamStatsPanel(match) {
    const baseStats = aggregateTeamStats(match.squad);
    const buffs = match.teamBuffs || {};
    const formBonus = match._teamFormBonus || 0;
    const keys = ['offense','defense','tempo','vision','composure'];
    const labels = { offense:I18N.t('stats.offense'), defense:I18N.t('stats.defense'), tempo:I18N.t('stats.tempo'), vision:I18N.t('stats.vision'), composure:I18N.t('stats.composure') };
    const rows = keys.map(k => {
      const base = baseStats[k];
      const buff = (buffs[k] || 0) + formBonus;
      const effective = base + buff;
      const oppVal = match.opp?.stats[k] || 0;
      const diff = effective - oppVal;
      const cmp = effective > oppVal ? 'ip-higher' : (effective < oppVal ? 'ip-lower' : '');
      const diffCls = diff > 0 ? 'ip-buff-pos' : (diff < 0 ? 'ip-buff-neg' : 'ip-buff-neutral');
      const diffStr = diff > 0 ? '+' + diff : String(diff);
      return el('div', { class:'ip-stat-row' }, [
        el('span', { class:'ip-stat-label' }, [labels[k]]),
        el('span', { class:'ip-stat-main ' + cmp }, [String(effective)]),
        el('span', { class:'ip-stat-buff ' + diffCls }, [diffStr]),
        el('span', { class:'ip-stat-opp' }, [String(oppVal)])
      ]);
    });
    return el('div', { class:'interrupt-panel' }, [
      el('div', { class:'ip-title' }, [I18N.t('ui.statsPanel.currentTeamStats')]),
      el('div', { class:'ip-stat-header' }, [
        el('span', {}, ['']),
        el('span', {}, [I18N.t('ui.statsPanel.own')]),
        el('span', {}, [I18N.t('ui.statsPanel.diff')]),
        el('span', {}, [I18N.t('ui.statsPanel.opponent')])
      ]),
      ...rows,
      el('div', { class:'ip-footnote' }, [I18N.t('ui.statsPanel.buffsFootnote')])
    ]);
  },

  showEvolution(player, options, onPick) {
    const modal = $('#interrupt-modal');
    modal.innerHTML = '';
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

  renderResult(result, scoreMe, scoreOpp, reward, match) {
    if (window.FX) {
      if (result === 'win') window.FX.winResult();
      else if (result === 'loss') window.FX.lossResult();
    }
    const cls = result === 'win' ? 'win' : (result === 'loss' ? 'loss' : 'draw');
    const title = result === 'win' ? I18N.t('ui.result.win') : (result === 'loss' ? I18N.t('ui.result.loss') : I18N.t('ui.result.draw'));
    const content = $('#result-content');
    content.innerHTML = '';
    content.appendChild(el('div', { class:'result-big', style:{ paddingBottom:'16px' } }, [
      el('h1', { class: cls }, [title]),
      el('div', { class:'big-score' }, [`${scoreMe} : ${scoreOpp}`]),
      reward ? el('div', { class:'reward' }, [reward]) : null,
      match?._sacrificeVictim ? el('div', { style:{ color:'var(--accent-2)', fontFamily:'var(--font-display)', fontSize:'11px', marginTop:'8px' } },
        [I18N.t('ui.result.sacrificeNote', { name: match._sacrificeVictim.name })]) : null
    ]));
    if (match) {
		
	     // ── Match log viewer — collapsible, replaces team stats ───────────────
      const logEntries = (window.getState?.()?._lastMatchLog) || [];
      if (logEntries.length) {
        const logWrap = el('div', { style:{ marginBottom:'16px' } });
        const logToggle = el('button', { class:'btn', style:{ width:'100%', marginBottom:'0', fontSize:'11px', padding:'8px 14px' } }, ['▶ Match Log']);
        const logBody = el('div', {
          class:'match-log',
          style:{ display:'none', maxHeight:'220px', marginTop:'4px', fontSize:'15px' }
        });
        logEntries.forEach(({ msg, cls }) => {
          const line = el('div', { class:'log-line ' + cls }, [msg]);
          logBody.appendChild(line);
        });
        logToggle.addEventListener('click', () => {
          const open = logBody.style.display !== 'none';
          logBody.style.display = open ? 'none' : 'block';
          logToggle.textContent = open ? '▶ Match Log' : '▼ Match Log';
          if (!open) logBody.scrollTop = logBody.scrollHeight;
        });
        logWrap.appendChild(logToggle);
        logWrap.appendChild(logBody);
        content.appendChild(logWrap);
      }	
      const s = match.stats;
      const myAccuracy = s.myShots ? Math.round(s.myShotsOnTarget / s.myShots * 100) : 0;
      const oppAccuracy = s.oppShots ? Math.round(s.oppShotsOnTarget / s.oppShots * 100) : 0;
      const myBuildupRate = s.myBuildups ? Math.round(s.myBuildupsSuccess / s.myBuildups * 100) : 0;
      const oppBuildupRate = s.oppBuildups ? Math.round(s.oppBuildupsSuccess / s.oppBuildups * 100) : 0;
      const possession = s.possRounds ? Math.round((s.possAccum / s.possRounds) * 100) : 50;
      const statsPanel = el('div', { class:'interrupt-panel', style:{ margin:'0 0 16px' } }, [
        el('div', { class:'ip-title' }, [I18N.t('ui.result.analysis')]),
        UI.renderMatchStatRow(I18N.t('ui.statsPanel.possession'), possession + '%', (100 - possession) + '%'),
        UI.renderMatchStatRow(I18N.t('ui.statsPanel.goals'), scoreMe, scoreOpp),
        UI.renderMatchStatRow(I18N.t('ui.statsPanel.shots'), s.myShots, s.oppShots),
        UI.renderMatchStatRow(I18N.t('ui.statsPanel.accuracy'), myAccuracy + '%', oppAccuracy + '%'),
        UI.renderMatchStatRow(I18N.t('ui.statsPanel.buildup'), myBuildupRate + '%', oppBuildupRate + '%'),
        UI.renderMatchStatRow(I18N.t('ui.statsPanel.saves'), s.saves, '–'),
        UI.renderMatchStatRow(I18N.t('ui.statsPanel.abilitiesTriggered'), s.triggersFired || 0, '–')
      ]);
      content.appendChild(statsPanel);

 
      const perfTitle = el('div', { class:'card-title', style:{ marginTop:'16px' , display:'none' } }, [I18N.t('ui.result.players')]);
      const perfList = el('div', { class:'result-perf-list' });
      for (const p of match.squad) {
        const xp = p._lastMatchXp || 0;
        const ms = p._matchStats || {};
        const formDelta = p._formDelta || 0;
        let detail = '';
        if (p.role === 'ST' || p.role === 'LF') detail = `${ms.goals || 0}⚽  ${ms.shotsOnTarget || 0}/${ms.shots || 0}🎯`;
        else if (p.role === 'PM') detail = I18N.t('ui.perf.buildups', { ok: ms.buildupsOk || 0, all: ms.buildups || 0 });
        else if (p.role === 'VT') detail = I18N.t('ui.perf.defenses', { count: ms.defendedAttacks || 0 });
        else if (p.role === 'TW') detail = I18N.t('ui.perf.keeper', { saves: ms.saves || 0, conceded: ms.goalsConceded || 0 });
        const xpCls = xp >= 6 ? 'good' : (xp <= 2 ? 'bad' : 'dim');
        const formArrow = formDelta !== 0 ? (() => {
          const isUp = formDelta > 0;
          const col = isUp ? 'var(--good)' : 'var(--danger)';
          const svg = isUp
            ? `<line x1="4" y1="11" x2="4" y2="4" stroke="${col}" stroke-width="1.2" stroke-linecap="round"/><path d="M1.5 7 L4 2.5 L6.5 7" fill="none" stroke="${col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`
            : `<line x1="4" y1="1" x2="4" y2="8" stroke="${col}" stroke-width="1.2" stroke-linecap="round"/><path d="M1.5 5 L4 9.5 L6.5 5" fill="none" stroke="${col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`;
          const s = document.createElement('span');
          s.innerHTML = `<svg viewBox="0 0 8 12" width="8" height="12" style="vertical-align:middle;overflow:visible">${svg}</svg>`;
          return s;
        })() : null;
        const row = el('div', { class:'result-perf-row' }, [
          el('span', { class:'perf-role' }, [p.role]),
          el('span', { class:'perf-name' }, [p.name]),
          el('span', { class:'perf-detail' }, [detail]),
          el('span', { class:'perf-xp ' + xpCls }, [`+${xp} XP`]),
          formArrow ? el('span', { class:'perf-form' }, [formArrow]) : el('span', {}, [''])
        ]);
        perfList.appendChild(row);
      }
      content.appendChild(perfTitle);
      content.appendChild(perfList);
    }
    content.appendChild(el('div', { class:'btn-row', style:{ justifyContent:'center', marginTop:'24px' } }, [
      el('button', { class:'btn primary', onClick: () => FLOW.continueRun() }, [I18N.t('ui.result.continue')])
    ]));
    UI.showScreen('screen-result');
  }
};

window.UI = UI;