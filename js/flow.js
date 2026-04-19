const FLOW = {
  newRun() {
    state = freshState();
    UI.renderDraft();
  },

  chooseStarterTeam(team) {
    const players = team.lineup.map(archId => makePlayer(archId, { teamId: team.id }));
    state.roster = players;
    state.lineupIds = players.map(p => p.id);
    state.teamName = team.name;
    state.teamColor = team.color;
    state.starterTeamId = team.id;
    FLOW.advance();
  },

  advance() {
    if (state.matchNumber >= CONFIG.runLength) {
      FLOW.winRun();
      return;
    }
    state.currentOpponent = generateOpponent(state.matchNumber + 1);
    UI.renderHub();
  },

  async startMatch() {
    const opp = state.currentOpponent;
    const lineup = getLineup();
    if (lineup.length !== CONFIG.teamSize) {
      alert(I18N.t('ui.flow.lineupIncomplete'));
      return;
    }
    UI.renderMatch(opp, lineup);
    state._skipAnim = false;
    state._paused = false;
    state._preKickoff = true;
    state._matchLogBuffer = [];
    const pb = document.getElementById('match-pause-btn');
    if (pb) pb.textContent = I18N.t('ui.match.pause');
    const sb = document.getElementById('match-speed-btn');
    if (sb) sb.textContent = I18N.t('ui.match.speed');

    const result = await startMatch(lineup, opp, async (ev) => {
      if (state._skipAnim) ev.match && (ev.match.fastSkip = true);
      return FLOW.handleMatchEvent(ev);
    });

    state._lastMatchLog = (state._matchLogBuffer || []).slice();
    state._matchLogBuffer = [];

    state.matchNumber++;
    state.matchHistory.push({
      md: state.matchNumber,
      opp: opp.name,
      scoreMe: result.scoreMe,
      scoreOpp: result.scoreOpp,
      result: result.result
    });
    if (result.result === 'win') {
      state.wins++;
      state.seasonPoints += 3;
      state.currentLossStreak = 0;
    } else if (result.result === 'loss') {
      state.losses++;
      state.currentLossStreak++;
    } else {
      state.draws++;
      state.seasonPoints += 1;
      state.currentLossStreak = 0;
    }
    state.goalsFor += result.scoreMe;
    state.goalsAgainst += result.scoreOpp;
    const isWin = result.result === 'win';
    const isDraw = result.result === 'draw';
    const teamBonus = isWin ? 2 : isDraw ? 1 : 0;
    let totalAwarded = 0;
    for (const p of state.roster) {
      const playedInMatch = state.lineupIds.includes(p.id);
      const ms = p._matchStats || {};
      let xp;
      if (!playedInMatch) {
        xp = 1 + (isWin ? 1 : 0);
      } else {
        xp = 2 + teamBonus;
        if (p.role === 'ST') {
          const shots = ms.shots || 0;
          const onTarget = ms.shotsOnTarget || 0;
          const goals = ms.goals || 0;
          xp += onTarget * 1;
          xp += goals * 2;
          if (shots >= 2) {
            const accuracy = onTarget / shots;
            if (accuracy >= 0.67) xp += 2;
            else if (accuracy >= 0.50) xp += 1;
            else if (accuracy === 0 && shots >= 3) xp -= 2;
            else if (accuracy === 0 && shots >= 1) xp -= 1;
          } else if (shots === 0) {
            xp -= 1;
          }
        } else if (p.role === 'LF') {
          xp += (ms.goals || 0) * 2;
          xp += Math.min(3, (ms.counters || 0));
        } else if (p.role === 'PM') {
          const ok = ms.buildupsOk || 0;
          const fail = (ms.buildups || 0) - ok;
          xp += Math.min(5, ok);
          xp -= Math.floor(fail / 3);
        } else if (p.role === 'VT') {
          xp += Math.floor((ms.defendedAttacks || 0) / 2);
          xp -= Math.floor((ms.goalsConceded || 0) / 2);
        } else if (p.role === 'TW') {
          xp += Math.min(6, ms.saves || 0);
          xp -= Math.min(3, ms.goalsConceded || 0);
        }
        xp = Math.max(1, xp);
      }
      if (playedInMatch && result.match._teamFormLabel === 'KRISE' && (isWin || isDraw)) {
        xp = Math.round(xp * 1.5);
      }
      p._lastMatchXp = xp;
      p.lastPerformance = xp;
      p._formDelta = 0;
      if (playedInMatch) {
        if (xp >= 6) {
          const newForm = clamp((p.form || 0) + 1, -3, 3);
          p._formDelta = newForm - (p.form || 0);
          p.form = newForm;
        } else if (xp <= 2) {
          const newForm = clamp((p.form || 0) - 1, -3, 3);
          p._formDelta = newForm - (p.form || 0);
          p.form = newForm;
        }
      }
      p.xp += xp;
      p.goals = 0;
      totalAwarded += xp;
    }
    const reward = I18N.t('ui.flow.reward', { avg: (totalAwarded / state.roster.length).toFixed(1) });
    await sleep(400);
    UI.renderResult(result.result, result.scoreMe, result.scoreOpp, reward, result.match);
    if (result.result === 'win' && CONFIG.bossMatches.includes(state.matchNumber) && getBench().length < CONFIG.maxBench) {
      state.pendingRecruit = true;
    }
    if (state.currentLossStreak >= 3) {
      await sleep(1500);
      FLOW.gameOver(I18N.t('ui.flow.gameOverStreak'));
      return;
    }
    if (state.losses >= 6) {
      await sleep(1500);
      FLOW.gameOver(I18N.t('ui.flow.gameOverLosses', { losses: state.losses }));
      return;
    }
  },

  // ─── handleMatchEvent ───────────────────────────────────────────────────────
  // Central event handler for all match interrupts:
  //   log        — append to match log
  //   roundEnd   — update score display
  //   interrupt  — show modal for kickoff / halftime / final / event
  //
  // Halftime flow (Schritte C + D):
  //   1. Show tactic modal (3 options) → resolve tactic choice
  //   2. Determine second slot: focus (always available) vs sub (only if bench not empty)
  //      Priority: focus > sub per briefing (Fokus ist die interessantere Entscheidung)
  //      If both available: show focus first, sub is skipped for simplicity
  //      (briefing note: "restriktive Variante zuerst — Sub-Modal nur wenn kein Fokus")
  //   3. Show second modal → resolve focus or sub choice
  //   Both decisions go through applyDecision() channel.
  //
  // Event flow (Schritt E):
  //   Shows event modal with gold accent header.
  //   Chosen option is returned to checkSituativeEvents for apply().

  async handleMatchEvent(ev) {
    if (ev.type === 'log') {
      if (!state._matchLogBuffer) state._matchLogBuffer = [];
      state._matchLogBuffer.push({ msg: ev.msg, cls: ev.cls || '' });
      UI.appendLog(ev.msg, ev.cls);
      let base;
      if (ev.cls === 'goal-me' || ev.cls === 'goal-opp') base = 2500;
      else if (ev.cls === 'trigger') base = 1200;
      else if (ev.cls === 'round-header') base = 900;
      else if (ev.cls === 'kickoff') base = 1200;
      else if (ev.cls === 'decision') base = 900;
      else base = 700;
      if (state._skipAnim) base = Math.min(base, 150);
      if (state._preKickoff) base = 0;
      await sleep(base);
      while (state._paused) { await sleep(120); }
      return;
    }

    if (ev.type === 'roundEnd') {
      UI.updateMatchScore(ev.match);
      return;
    }

    if (ev.type === 'interrupt') {
      state._preKickoff = false;
      const m = ev.match;

      // ── Ensure tactic pools exist ───────────────────────────────────────
      if (!m._tacticPools) {
        const team = DATA.starterTeams.find(t => t.id === state.starterTeamId) || DATA.starterTeams[0];
        m._tacticPools = {
          kickoff:  pickThemedTactics(DATA.kickoffTactics,  3, team, 'kickoff'),
          halftime: pickThemedTactics(DATA.halftimeOptions, 3, team, 'halftime'),
          final:    pickThemedTactics(DATA.finalOptions,    3, team, 'final')
        };
      }

      // ── Kickoff ──────────────────────────────────────────────────────────
      if (ev.phase === 'kickoff') {
        const hints = (typeof buildContextHint === 'function')
          ? buildContextHint(m, 'kickoff', state)
          : [];
        return new Promise(resolve => {
          UI.showInterrupt(
            I18N.t('ui.flow.kickoffTitle'),
            I18N.t('ui.flow.kickoffSubtitle'),
            m._tacticPools.kickoff,
            (picked) => resolve(picked),
            m,
            'kickoff',
            hints
          );
        });
      }

      // ── Halftime — extended two-step flow ────────────────────────────────
      if (ev.phase === 'halftime') {
        // Step 1: tactic choice
        const tacticHints = (typeof buildContextHint === 'function')
          ? buildContextHint(m, 'halftime', state)
          : [];
        const tacticChoice = await new Promise(resolve => {
          UI.showInterrupt(
            I18N.t('ui.flow.halftimeTitle'),
            I18N.t('ui.flow.scoreSubtitle', { me: m.scoreMe, opp: m.scoreOpp }),
            m._tacticPools.halftime,
            (picked) => resolve(picked),
            m,
            'halftime',
            tacticHints
          );
        });

        // Apply tactic through applyDecision channel
        if (typeof applyDecision === 'function') {
          applyDecision(m, tacticChoice, 'halftime', state);
        }

        // Step 2: focus or sub (second modal)
        // Priority: focus > sub. Sub only shown when bench not empty and no focus candidate.
        // Per briefing: "restriktive Variante" — one slot, focus preferred.
        const currentLineup = m.squad || getLineup();
        const bench = getBench();
        const hasBench = bench.length > 0;

        let secondOptions = null;
        let secondTitle = '';
        let secondSubtitle = '';
        let secondPhase = '';

        // Focus is always available (outfield players exist)
        const focusOptions = (typeof generateFocusOptions === 'function')
          ? generateFocusOptions(currentLineup, m)
          : [];

        if (focusOptions.length > 1) {
          // More than just "no focus" → offer focus
          secondOptions = focusOptions;
          secondTitle = I18N.t('ui.decisions.focusTitle');
          secondSubtitle = I18N.t('ui.decisions.focusSubtitle');
          secondPhase = 'halftime_focus';
        } else if (hasBench) {
          // No meaningful focus candidates, but bench available
          const subOptions = (typeof generateSubOptions === 'function')
            ? generateSubOptions(currentLineup, m, state)
            : [];
          if (subOptions.length > 1) {
            secondOptions = subOptions;
            secondTitle = I18N.t('ui.decisions.subTitle');
            secondSubtitle = I18N.t('ui.decisions.subSubtitle');
            secondPhase = 'halftime_sub';
          }
        }

        if (secondOptions) {
          const secondChoice = await new Promise(resolve => {
            UI.showInterrupt(
              secondTitle,
              secondSubtitle,
              secondOptions,
              (picked) => resolve(picked),
              m,
              secondPhase,
              [] // no hints for second modal — keeps it clean
            );
          });

          // Apply focus/sub through applyDecision channel
          if (typeof applyDecision === 'function' && secondChoice && secondChoice.id !== 'focus_none' && secondChoice.id !== 'sub_none') {
            applyDecision(m, secondChoice, secondPhase, state);
          } else if (secondChoice && typeof secondChoice.apply === 'function') {
            // fallback: direct apply (no-op options)
            secondChoice.apply(m, { mult: 1.0, phase: secondPhase, state });
          }
        }

        // Return the tactic choice to core.js (it uses this for halftimeAction)
        return tacticChoice;
      }

      // ── Final ────────────────────────────────────────────────────────────
      if (ev.phase === 'final') {
        const hints = (typeof buildContextHint === 'function')
          ? buildContextHint(m, 'final', state)
          : [];
        return new Promise(resolve => {
          UI.showInterrupt(
            I18N.t('ui.flow.finalTitle'),
            I18N.t('ui.flow.roundScoreSubtitle', { me: m.scoreMe, opp: m.scoreOpp }),
            m._tacticPools.final,
            (picked) => resolve(picked),
            m,
            'final',
            hints
          );
        });
      }

      // ── Situative event modal (Schritt E) ─────────────────────────────────
      // phase === 'event'
      // Returns the chosen option object directly to checkSituativeEvents,
      // which calls option.apply(match, ctx).
      if (ev.phase === 'event') {
        const event = ev.event;
        const eventCtx = ev.eventCtx || {};
        if (!event) return null;

        // Build option list from event definition
        // Each option needs name + desc resolved from i18n
        const options = event.options.map(opt => {
          const i18nBase = `ui.events.${event.id}.option_${opt.id}`;
          const name = I18N.t(i18nBase + '.name', eventCtx.eventPlayer
            ? { name: eventCtx.eventPlayer.name, bonus: 8, stat: 'offense', deficit: eventCtx.deficit || 0, n: eventCtx.oppFailedBuildups || 0, opp: m.opp?.name || '' }
            : { name: eventCtx.legendaryPlayer?.name || '', deficit: eventCtx.deficit || 0, n: eventCtx.oppFailedBuildups || 0, opp: m.opp?.name || '' }
          );
          const desc = I18N.t(i18nBase + '.desc', {
            bonus: 8, stat: 'offense',
            deficit: eventCtx.deficit || 0,
            n: eventCtx.oppFailedBuildups || 0,
            opp: m.opp?.name || '',
            name: eventCtx.eventPlayer?.name || eventCtx.legendaryPlayer?.name || ''
          });
          return {
            ...opt,
            name,
            desc
          };
        });

        // Resolve subtitle with event context
        const subtitleVars = {
          name: eventCtx.eventPlayer?.name || eventCtx.legendaryPlayer?.name || '',
          deficit: eventCtx.deficit || 0,
          n: eventCtx.oppFailedBuildups || 0,
          opp: m.opp?.name || '',
          points: eventCtx.currentPoints || 0
        };
        const subtitle = I18N.t(`ui.events.${event.id}.subtitle`, subtitleVars);

        return new Promise(resolve => {
          UI.showInterrupt(
            I18N.t('ui.flow.eventTitle'),
            subtitle,
            options,
            (picked) => resolve(picked),
            m,
            'event',
            [] // Events are surprises — no hints per briefing
          );
        });
      }
    }
  },

  async processLevelUps() {
    for (const p of state.roster) {
      while (p.xp >= p.xpToNext) {
        p.xp -= p.xpToNext;
        p.level++;
        p.xpToNext = Math.round(p.xpToNext * 1.4);
        if (CONFIG.evolutionLevels.includes(p.level) && p.stage < 2) {
          await FLOW.triggerEvolution(p);
        }
      }
    }
  },

  triggerEvolution(player) {
    return new Promise(resolve => {
      const currentId = player.evoPath[player.evoPath.length - 1];
      const options = DATA.evolutions[currentId] || [];
      if (!options.length) { resolve(); return; }
      UI.showEvolution(player, options, (chosenId) => {
        const evo = DATA.evoDetails[chosenId];
        if (!evo) { resolve(); return; }
        for (const [k,v] of Object.entries(evo.boosts || {})) {
          player.stats[k] = clamp((player.stats[k] || 0) + v, 20, 99);
        }
        if (!player.traits.includes(evo.trait)) player.traits.push(evo.trait);
        if (evo.parentTrait && !player.traits.includes(evo.parentTrait)) {
          player.traits.push(evo.parentTrait);
        }
        player.archetype = chosenId;
        player.label = evo.label;
        player.stage += 1;
        player.evoPath.push(chosenId);
        resolve();
      });
    });
  },

  async continueRun() {
    await FLOW.processLevelUps();
    if (state.pendingRecruit) {
      state.pendingRecruit = false;
      FLOW.startRecruit();
    } else {
      FLOW.advance();
    }
  },

  startRecruit() {
    const opts = [generateLegendaryPlayer(), generateLegendaryPlayer(), generateLegendaryPlayer()];
    state._recruitOptions = opts;
    UI.renderRecruit(opts);
  },

  pickRecruit(player) {
    if (getBench().length >= CONFIG.maxBench) {
      alert(I18N.t('ui.flow.benchFull'));
      return;
    }
    state.roster.push(player);
    state._recruitOptions = null;
    FLOW.advance();
  },

  skipRecruit() {
    state._recruitOptions = null;
    FLOW.advance();
  },

  openLineup() { UI.renderLineup(); },

  closeLineup() {
    if (!isLineupValid(state.lineupIds)) {
      alert(I18N.t('ui.flow.lineupInvalid'));
      return;
    }
    UI.renderHub();
  },

  swapPlayer(id1, id2) {
    const in1 = state.lineupIds.indexOf(id1);
    const in2 = state.lineupIds.indexOf(id2);
    if (in1 >= 0 && in2 < 0) state.lineupIds[in1] = id2;
    else if (in2 >= 0 && in1 < 0) state.lineupIds[in2] = id1;
    UI.renderLineup();
  },

  winRun() {
    const pts = state.seasonPoints;
    let outcome, title, titleColor;
    if (pts >= 36) { outcome = 'champion'; title = 'CHAMPION!'; titleColor = 'win'; }
    else if (pts >= 24) { outcome = 'survivor'; title = I18N.t('ui.flow.safe'); titleColor = 'draw'; }
    else { outcome = 'survivor'; title = I18N.t('ui.flow.rescued'); titleColor = 'draw'; }
    const entry = buildHighscoreEntry(state, outcome);
    const isNewBest = saveHighscore(entry);
    const best = loadHighscore();
    const summary = $('#victory-summary');
    summary.innerHTML = '';
    const h1 = $('#screen-victory h1');
    if (h1) { h1.textContent = title; h1.className = titleColor; }
    const statsBox = el('div', { class:'pixel', style:{ color:'var(--fg)', marginBottom:'16px', lineHeight:'1.6' } }, [
      el('div', { style:{ fontFamily:'var(--font-display)', fontSize:'14px', color:'var(--accent)', marginBottom:'8px' } },
        [I18N.t('ui.flow.points', { points: pts })]),
      el('div', {}, [`${state.wins}W  ${state.draws}D  ${state.losses}L`]),
      el('div', {}, [`${I18N.t('ui.statsPanel.goals')}: ${state.goalsFor}:${state.goalsAgainst}  (${(state.goalsFor - state.goalsAgainst >= 0 ? '+' : '') + (state.goalsFor - state.goalsAgainst)})`]),
      isNewBest
        ? el('div', { style:{ color:'var(--gold)', marginTop:'12px', fontFamily:'var(--font-display)', fontSize:'12px' } }, [I18N.t('ui.flow.record')])
        : (best ? el('div', { style:{ color:'var(--muted)', marginTop:'8px', fontSize:'12px' } },
            [I18N.t('ui.flow.bestScore', { points: best.points, team: best.teamName })]) : null)
    ]);
    summary.appendChild(statsBox);
    const sq = el('div', { class:'squad-display' });
    state.roster.forEach(p => sq.appendChild(UI.renderPlayerCard(p)));
    summary.appendChild(sq);
    UI.showScreen('screen-victory');
  },

  gameOver(reason) {
    const entry = buildHighscoreEntry(state, 'fired');
    const isNewBest = saveHighscore(entry);
    const best = loadHighscore();
    const reasonEl = $('#gameover-reason');
    reasonEl.innerHTML = '';
    reasonEl.appendChild(el('div', {}, [reason]));
    reasonEl.appendChild(el('div', { style:{ marginTop:'16px', color:'var(--fg)', fontFamily:'var(--font-display)' } },
      [I18N.t('ui.flow.afterMatches', { points: state.seasonPoints, matches: state.matchNumber })]));
    reasonEl.appendChild(el('div', { style:{ fontSize:'11px' } },
      [`${state.wins}W ${state.draws}D ${state.losses}L · ${I18N.t('ui.statsPanel.goals')} ${state.goalsFor}:${state.goalsAgainst}`]));
    if (isNewBest) {
      reasonEl.appendChild(el('div', { style:{ color:'var(--gold)', marginTop:'12px', fontFamily:'var(--font-display)' } }, [I18N.t('ui.flow.bestRun')]));
    } else if (best) {
      reasonEl.appendChild(el('div', { style:{ color:'var(--muted)', marginTop:'8px', fontSize:'10px' } },
        [I18N.t('ui.flow.bestScore', { points: best.points, team: best.teamName })]));
    }
    UI.showScreen('screen-gameover');
  },

  togglePause() {
    state._paused = !state._paused;
    const btn = document.getElementById('match-pause-btn');
    if (btn) btn.textContent = state._paused ? I18N.t('ui.match.resume') : I18N.t('ui.match.pause');
  },

  toggleSpeed() {
    state._skipAnim = !state._skipAnim;
    const btn = document.getElementById('match-speed-btn');
    if (btn) btn.textContent = state._skipAnim ? I18N.t('ui.match.fast') : I18N.t('ui.match.speed');
    if (state._skipAnim && state._paused) {
      state._paused = false;
      const pb = document.getElementById('match-pause-btn');
      if (pb) pb.textContent = I18N.t('ui.match.pause');
    }
  },

  skipMatchAnim() { FLOW.toggleSpeed(); }
};
document.addEventListener('DOMContentLoaded', () => {
  setState(freshState());
  I18N.applyDom();
  UI.renderStart();
});
window.FLOW = FLOW;
