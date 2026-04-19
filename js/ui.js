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
        const outcomeLabel = { champion:'Champion', survivor:'Klasse gehalten', fired:'Entlassen' }[best.outcome] || '';
        hsEl.textContent = `✦ BESTWERT: ${best.points} PKT · ${best.wins}S-${best.draws}U-${best.losses}N · ${outcomeLabel} ✦`;
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
        cell.title = `Match ${i+1}: ${hist.scoreMe}:${hist.scoreOpp} vs ${hist.opp}`;
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
    $('#hub-team-meta').textContent = `${lineup.length} + ${getBench().length}B`;
    const sumBox = $('#hub-team-summary');
    sumBox.innerHTML = '';
    const teamFormAvg = lineup.reduce((s, p) => s + (p.form || 0), 0) / Math.max(1, lineup.length);
    let teamFormText = '';
    if (teamFormAvg >= 2)       teamFormText = ' · 🔥 HEISSER LAUF';
    else if (teamFormAvg >= 1)  teamFormText = ' · ↑ Gute Form';
    else if (teamFormAvg <= -2) teamFormText = ' · ❄ KRISE';
    else if (teamFormAvg <= -1) teamFormText = ' · ↓ Schlechte Form';
    sumBox.appendChild(el('div', { class:'matchup-meta' }, [
      el('div', { class:'name me' }, [state.teamName || 'Dein Team']),
      el('div', { class:'meta-line' }, [`Power ${teamPower} · ${teamTheme}${teamFormText}`])
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
      }, ['⚠ 2 Niederlagen in Folge — nächste = Trainer entlassen!']));
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
    const ausrichtungParts = [opp.special?.name || 'Standard'];
    if (traitNames.length) ausrichtungParts.push(...traitNames);
    const oppMeta = [
      el('div', { class:'name ' + (opp.isBoss ? 'boss' : 'opp') }, [
        (opp.isBoss ? '🏆 ' : '') + opp.name
      ]),
      el('div', { class:'meta-line' }, [
        `Power ${opp.power} · ${ausrichtungParts.join(' / ')}`
      ])
    ];
    oppBox.appendChild(el('div', { class:'matchup-meta' }, oppMeta));
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
    $('#bench-count').textContent = `${bench.length} / ${CONFIG.maxBench} Plätze`;
    const benchBox = $('#lineup-bench');
    benchBox.innerHTML = '';
    if (bench.length === 0) {
      benchBox.appendChild(el('div', { class:'slot-empty' }, ['Keine Bank-Spieler — gewinne einen Boss!']));
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
      hint.textContent = `→ ${sel.name} ausgewählt. Klicke einen anderen Spieler um zu tauschen.`;
    } else {
      hint.textContent = 'Klicke einen Startelf-Spieler, dann einen Bank-Spieler um zu tauschen. Keeper (TW) ist Pflicht.';
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
          alert('Swap abgelehnt: Aufstellung bräuchte genau 1 Keeper.');
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
      offense: 'Angriff',
      defense: 'Abwehr',
      tempo: 'Tempo',
      vision: 'Übersicht',
      composure: 'Nerven'
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
      if (trendVal > 0) trendEl = el('span', { class:'cb-trend trend-up' }, [trendVal >= 2 ? ' ⬆⬆' : ' ⬆']);
      else if (trendVal < 0) trendEl = el('span', { class:'cb-trend trend-down' }, [trendVal <= -2 ? ' ⬇⬇' : ' ⬇']);
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
      el('div', { class:'xp-label' }, [
        `LV ${p.level} · ${p.xp}/${p.xpToNext} XP${p.goals ? ' · ' + p.goals + '⚽' : ''}${formIndicator(p.form)}`
      ]),
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

  updateMatchScore(match) {
    $('#score-me').textContent = String(match.scoreMe);
    $('#score-opp').textContent = String(match.scoreOpp);
    $$('.round-dot').forEach(d => {
      const r = Number(d.dataset.round);
      d.classList.remove('active', 'past');
      if (r < match.round) d.classList.add('past');
      else if (r === match.round) d.classList.add('active');
    });
    UI.renderMatchFooter(match.squad, match.opp);
  },

  appendLog(msg, cls='') {
    const log = $('#match-log');
    const line = el('div', { class:'log-line ' + cls }, [msg]);
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
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
      const stack = el('div', { class:'interrupt-panel-stack' });
      stack.appendChild(UI.renderTeamStatsPanel(match));
      if (phase !== 'kickoff') {
        stack.appendChild(UI.renderMatchStatsPanel(match));
      }
      modal.appendChild(stack);
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
      el('div', { class:'ip-title' }, ['Match-Analyse']),
      UI.renderMatchStatRow('Ballbesitz', possession + '%', (100-possession) + '%'),
      UI.renderMatchStatRow('Schüsse', s.myShots, s.oppShots),
      UI.renderMatchStatRow('Präzision', myAccuracy + '%', oppAccuracy + '%'),
      UI.renderMatchStatRow('Aufbau-%', myBuildupRate + '%', oppBuildupRate + '%'),
      UI.renderMatchStatRow('Paraden', s.saves, '–')
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
    const labels = { offense:'Angriff', defense:'Abwehr', tempo:'Tempo', vision:'Übersicht', composure:'Nerven' };

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
      el('div', { class:'ip-title' }, ['Team-Werte (aktuell)']),
      el('div', { class:'ip-stat-header' }, [
        el('span', {}, ['']),
        el('span', {}, ['Eigen']),
        el('span', {}, ['Diff']),
        el('span', {}, ['Gegner'])
      ]),
      ...rows,
      el('div', { class:'ip-footnote' }, ['Buffs addieren sich über Kickoff + Halbzeit + Finale'])
    ]);
  },

  showEvolution(player, options, onPick) {
    const modal = $('#interrupt-modal');
    modal.innerHTML = '';
    modal.appendChild(el('h2', { style:{ color:'var(--gold)' } }, ['EVOLUTION!']));
    modal.appendChild(el('div', { class:'sub' }, [`${player.name} (${DATA.roles.find(r=>r.id===player.role)?.label}) erreicht Level ${player.level}`]));
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
          el('b', {}, ['Trait: ' + traitDef.name]),
          el('span', {}, [traitDef.desc])
        ]) : null,
        evo.parentTrait ? el('div', { class:'mono-sm', style:{ marginTop:'6px', color:'var(--accent-2)' } }, [
          'behält: ' + (DATA.traits[evo.parentTrait]?.name || evo.parentTrait) + ' (+30%)'
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
    const cls = result === 'win' ? 'win' : (result === 'loss' ? 'loss' : 'draw');
    const title = result === 'win' ? 'SIEG' : (result === 'loss' ? 'NIEDERLAGE' : 'UNENTSCHIEDEN');
    const content = $('#result-content');
    content.innerHTML = '';
    content.appendChild(el('div', { class:'result-big', style:{ paddingBottom:'16px' } }, [
      el('h1', { class: cls }, [title]),
      el('div', { class:'big-score' }, [`${scoreMe} : ${scoreOpp}`]),
      reward ? el('div', { class:'reward' }, [reward]) : null
    ]));
    if (match) {
      const s = match.stats;
      const myAccuracy = s.myShots ? Math.round(s.myShotsOnTarget / s.myShots * 100) : 0;
      const oppAccuracy = s.oppShots ? Math.round(s.oppShotsOnTarget / s.oppShots * 100) : 0;
      const myBuildupRate = s.myBuildups ? Math.round(s.myBuildupsSuccess / s.myBuildups * 100) : 0;
      const oppBuildupRate = s.oppBuildups ? Math.round(s.oppBuildupsSuccess / s.oppBuildups * 100) : 0;
      const possession = s.possRounds ? Math.round((s.possAccum / s.possRounds) * 100) : 50;

      const statsPanel = el('div', { class:'interrupt-panel', style:{ margin:'0 0 16px' } }, [
        el('div', { class:'ip-title' }, ['Match-Bilanz']),
        UI.renderMatchStatRow('Ballbesitz', possession + '%', (100 - possession) + '%'),
        UI.renderMatchStatRow('Tore', scoreMe, scoreOpp),
        UI.renderMatchStatRow('Schüsse', s.myShots, s.oppShots),
        UI.renderMatchStatRow('Präzision', myAccuracy + '%', oppAccuracy + '%'),
        UI.renderMatchStatRow('Aufbau-%', myBuildupRate + '%', oppBuildupRate + '%'),
        UI.renderMatchStatRow('Paraden', s.saves, '–'),
        UI.renderMatchStatRow('Traits gefeuert', s.triggersFired || 0, '–')
      ]);
      content.appendChild(statsPanel);
      content.appendChild(UI.renderTeamStatsPanel(match));
      const perfTitle = el('div', { class:'card-title', style:{ marginTop:'16px' } }, ['Spieler-Bilanz']);
      const perfList = el('div', { class:'result-perf-list' });
      for (const p of match.squad) {
        const xp = p._lastMatchXp || 0;
        const ms = p._matchStats || {};
        const formDelta = p._formDelta || 0;
        let detail = '';
        if (p.role === 'ST' || p.role === 'LF') detail = `${ms.goals || 0}⚽  ${ms.shotsOnTarget || 0}/${ms.shots || 0}🎯`;
        else if (p.role === 'PM') detail = `${ms.buildupsOk || 0}/${ms.buildups || 0} Aufbauten`;
        else if (p.role === 'VT') detail = `${ms.defendedAttacks || 0} Abwehren`;
        else if (p.role === 'TW') detail = `${ms.saves || 0} Paraden  ${ms.goalsConceded || 0} kassiert`;
        const xpCls = xp >= 6 ? 'good' : (xp <= 2 ? 'bad' : 'dim');
        const formArrow = formDelta > 0 ? '↑' : (formDelta < 0 ? '↓' : '');
        const formArrowCls = formDelta > 0 ? 'good' : (formDelta < 0 ? 'bad' : '');
        const row = el('div', { class:'result-perf-row' }, [
          el('span', { class:'perf-role' }, [p.role]),
          el('span', { class:'perf-name' }, [p.name]),
          el('span', { class:'perf-detail' }, [detail]),
          el('span', { class:'perf-xp ' + xpCls }, [`+${xp} XP`]),
          formArrow ? el('span', { class:'perf-form ' + formArrowCls }, [formArrow]) : el('span', {}, [''])
        ]);
        perfList.appendChild(row);
      }
      content.appendChild(perfTitle);
      content.appendChild(perfList);
    }

    content.appendChild(el('div', { class:'btn-row', style:{ justifyContent:'center', marginTop:'24px' } }, [
      el('button', { class:'btn primary', onClick: () => FLOW.continueRun() }, ['▶ Weiter'])
    ]));
    UI.showScreen('screen-result');
  }
};

window.UI = UI;
