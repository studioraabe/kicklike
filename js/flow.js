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
    state.teamLogo = team.logo || null;
    state.starterTeamId = team.id;
    // Pre-generate the entire season bracket so future opponents (and their
    // logos) are stable from kickoff. If a run already has opponents — e.g.
    // on reload — keep them.
    //
    // Place-Indizes werden ohne Zurücklegen gezogen, damit kein Run zwei
    // Gegner mit gleichem zweiten Namen (und damit gleichem Wappen) enthält.
    // Bei 15 Plätzen = runLength passt das genau. Falls der Pool kleiner
    // würde, fällt der Code nach "Random mit Wiederholung" zurück.
    if (!state.seasonOpponents || !state.seasonOpponents.length) {
      state.seasonOpponents = [];
      const placeCount = DATA.opponents.places.length;
      const placeOrder = [];
      if (placeCount >= CONFIG.runLength) {
        const pool = Array.from({ length: placeCount }, (_, i) => i);
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        placeOrder.push(...pool.slice(0, CONFIG.runLength));
      }
      for (let i = 1; i <= CONFIG.runLength; i++) {
        const placeIdx = placeOrder[i - 1];
        const opts = (typeof placeIdx === 'number') ? { placeIdx } : {};
        state.seasonOpponents.push(generateOpponent(i, opts));
      }
    }
    FLOW.advance();
  },

  advance() {
    if (state.matchNumber >= CONFIG.runLength) {
      FLOW.winRun();
      return;
    }
    // Prefer pre-generated opponent. Fall back to fresh generation for legacy
    // saves that don't have seasonOpponents populated yet.
    state.currentOpponent = (state.seasonOpponents && state.seasonOpponents[state.matchNumber])
      || generateOpponent(state.matchNumber + 1);
    UI.renderHub();
  },

  async startMatch() {
    const opp = state.currentOpponent;
    const lineup = getLineup();
    if (lineup.length !== CONFIG.teamSize) {
      alert(I18N.t('ui.flow.lineupIncomplete'));
      return;
    }
    const suspended = lineup.filter(p => p._suspendedUntil && p._suspendedUntil > state.matchNumber);
    if (suspended.length) {
      // Kann die Bank alle Sperren rollen-gerecht ersetzen? Weil die
      // Aufstellung genau 1 Keeper braucht, muss TW → TW und Feld → Feld
      // getauscht werden. Ein einzelner TW auf der Bank hilft gegen einen
      // gesperrten ST nicht — die zwei Keeper wären illegal.
      const bench = getBench();
      const benchPool = bench.filter(p => !(p._suspendedUntil && p._suspendedUntil > state.matchNumber));

      const canSwapAllFromBench = (() => {
        const pool = benchPool.slice();
        for (const susp of suspended) {
          const needsKeeper = susp.role === 'TW';
          const idx = pool.findIndex(p => (p.role === 'TW') === needsKeeper);
          if (idx < 0) return false;
          pool.splice(idx, 1);  // Bank-Spieler "reservieren"
        }
        return true;
      })();

      if (canSwapAllFromBench) {
        // User hat Optionen — bewusste Entscheidung.
        alert(I18N.t('ui.flow.lineupSuspended', { name: suspended[0].name }));
        UI.renderLineup();
        return;
      }
      // Bank bietet keinen regelgerechten Tausch → Notfall-Akademie.
      // Für jeden Gesperrten einen temporären, schwächeren Spieler gleicher
      // Rolle; nach dem Match weg (nicht im Roster).
      const replacedIds = [];
      const academyNames = [];
      for (const susp of suspended) {
        const academy = window.makeAcademyPlayer(susp.role, { teamId: state.starterTeamId });
        if (!academy) continue;
        const idx = lineup.indexOf(susp);
        if (idx >= 0) {
          lineup[idx] = academy;
          susp._replacedByAcademy = true;   // transientes Flag für den XP-Loop
          replacedIds.push(susp.id);
          academyNames.push(`${susp.name} → ${academy.name}`);
        }
      }
      if (replacedIds.length) {
        state._academyActiveIds = replacedIds;
        alert(I18N.t('ui.flow.academyCalledUp', {
          list: academyNames.join(', ')
        }));
      }
    } else {
      state._academyActiveIds = null;
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
      state.currentWinStreak = (state.currentWinStreak || 0) + 1;
      if (state.currentWinStreak > (state.longestWinStreak || 0)) state.longestWinStreak = state.currentWinStreak;
      state.pendingPointsPop = 3;
    } else if (result.result === 'loss') {
      state.losses++;
      state.currentLossStreak++;
      state.currentWinStreak = 0;
    } else {
      state.draws++;
      state.seasonPoints += 1;
      state.currentLossStreak = 0;
      state.currentWinStreak = 0;
      state.pendingPointsPop = 1;
    }
    state.goalsFor += result.scoreMe;
    state.goalsAgainst += result.scoreOpp;

    const match = result.match;
    if (match && match._traitFireCounts) {
      const totalFires = Object.values(match._traitFireCounts).reduce((a, b) => a + b, 0);
      state.runTraitFires = (state.runTraitFires || 0) + totalFires;
    }

    if (typeof checkAchievements === 'function') checkAchievements(state, result);
    const isWin = result.result === 'win';
    const isDraw = result.result === 'draw';
    const teamBonus = isWin ? 2 : isDraw ? 1 : 0;
    let totalAwarded = 0;
    for (const p of state.roster) {
      const wasReplaced = !!p._replacedByAcademy;
      const playedInMatch = state.lineupIds.includes(p.id) && !wasReplaced;
      const ms = p._matchStats || {};
      let xp;
      if (!playedInMatch) {
        // Bank-XP oder "gesperrt, nicht aufgestellt". Identisch behandelt:
        // kein Fleiß-Bonus, kein Malus. Gewinnboni gibt's normal mit.
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
            else if (accuracy === 0) xp -= shots >= 3 ? 2 : 1;
          } else if (shots === 1 && onTarget === 0) {
            xp -= 1;
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
      // Entscheidungs-XP: aus erfolgreichen Focus-Aktionen während
      // gewählter Taktik-Phasen. Wird separat getrackt für Result-Anzeige.
      // Bei Academy-ersetzten Spielern explizit 0, auch wenn _matchStats
      // noch alte Werte enthielten (engine resetet nur die aufgestellten).
      const decisionXp = wasReplaced ? 0 : (ms.decisionXp || 0);
      p._lastDecisionXp = decisionXp;
      xp += decisionXp;
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
    // Transiente Academy-Flags aufräumen — dürfen nicht in das nächste Match
    // lecken (der Spieler könnte im Folge-Match wieder aufgestellt sein).
    for (const p of state.roster) delete p._replacedByAcademy;
    state._academyActiveIds = null;
    // Level-Ups jetzt anwenden, damit die Stat-Diffs im Result-Screen
    // den Zuwachs vom Leveln sichtbar machen. Evolutions kommen separat
    // nach dem Result in continueRun — sie brauchen ihren eigenen Modal.
    await FLOW.applyPendingLevelUps();
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

    if (ev.type === 'matchStart') {
      // Baseline-Snapshot für die Live-Scorecard setzen + Initial-Render.
      UI.updateMatchMomentum(ev.match);
      return;
    }

    if (ev.type === 'roundEnd') {
      UI.updateMatchScore(ev.match);
      UI.updateMatchMomentum(ev.match);
      return;
    }

    if (ev.type === 'buffsUpdated') {
      // Feuert direkt nach Taktik-Anwendung (Kickoff/Halbzeit/Finale).
      // Momentum-Strip aktualisiert sich, bevor die Runde gespielt wird —
      // so sieht der Spieler den Impact seiner Wahl sofort.
      UI.updateMatchMomentum(ev.match);
      return;
    }

    if (ev.type === 'interrupt') {
      state._preKickoff = false;
      const m = ev.match;
      const team = DATA.starterTeams.find(t => t.id === state.starterTeamId) || DATA.starterTeams[0];

      // ── Ensure tactic pools exist ───────────────────────────────────────
      // Kickoff-Pool wird einmal pro Match vorgehalten.
      // Halftime/Final werden LAZY gezogen, damit Score-bedingte Taktiken
      // (Desperate, Kamikaze, Clockwatch, Poker Face) die reale Spielsituation
      // als Filter nutzen können.
      if (!m._tacticPools) {
        m._tacticPools = {
          kickoff: pickThemedTactics(DATA.kickoffTactics, 3, team, 'kickoff', m)
        };
      }
      if (ev.phase === 'halftime' && !m._tacticPools.halftime) {
        m._tacticPools.halftime = pickThemedTactics(DATA.halftimeOptions, 3, team, 'halftime', m);
      }
      if (ev.phase === 'final' && !m._tacticPools.final) {
        m._tacticPools.final = pickThemedTactics(DATA.finalOptions, 3, team, 'final', m);
      }

      // ── Kickoff ──────────────────────────────────────────────────────────
      if (ev.phase === 'kickoff') {
        const hints = (typeof buildContextHint === 'function')
          ? buildContextHint(m, 'kickoff', state)
          : [];
        const kickoffOptions = (typeof decorateOptionsForDisplay === 'function')
          ? decorateOptionsForDisplay(m._tacticPools.kickoff, m, 'kickoff', state)
          : m._tacticPools.kickoff;
        return new Promise(resolve => {
          UI.showInterrupt(
            I18N.t('ui.flow.kickoffTitle'),
            I18N.t('ui.flow.kickoffSubtitle'),
            kickoffOptions,
            (picked) => resolve(picked),
            m,
            'kickoff',
            hints
          );
        });
      }

      // ── Halftime — extended flow ─────────────────────────────────────────
      // Tactic choice is returned to the engine, which routes it through
      // applyDecision to pick up Synergy/Conflict/Legendary multipliers.
      // Focus and Sub decisions go through applyDecision directly here.
      if (ev.phase === 'halftime') {
        // Step 1: tactic choice
        const tacticHints = (typeof buildContextHint === 'function')
          ? buildContextHint(m, 'halftime', state)
          : [];
        const halftimeOptions = (typeof decorateOptionsForDisplay === 'function')
          ? decorateOptionsForDisplay(m._tacticPools.halftime, m, 'halftime', state)
          : m._tacticPools.halftime;
        const tacticChoice = await new Promise(resolve => {
          UI.showInterrupt(
            I18N.t('ui.flow.halftimeTitle'),
            I18N.t('ui.flow.scoreSubtitle', { me: m.scoreMe, opp: m.scoreOpp }),
            halftimeOptions,
            (picked) => resolve(picked),
            m,
            'halftime',
            tacticHints
          );
        });

        // Step 2 (Focus-Modal) wurde bewusst entfernt:
        // - Mechanisch redundant mit Tactics (beide geben Stat-Boosts).
        // - Keine echte Entscheidung: Focus war in 90% der Fälle "pick
        //   den Hot-Streak-Spieler". Kein Risiko, kein Trade-off.
        // - Isoliert vom Rest: triggerte nichts, koppelte mit keinem
        //   anderen System. Siehe auch Commit-Message für diese Änderung.
        // Ersparte Screen-Zeit ermöglicht längerfristig mehr Situations.

        // Step 2: sub modal — ONLY if bench is non-empty
        const currentLineup = m.squad || getLineup();
        const bench = getBench();
        if (bench.length > 0) {
          const subOptions = (typeof generateSubOptions === 'function')
            ? generateSubOptions(currentLineup, m, state)
            : [];
          if (subOptions.length > 1) {
            const subHints = (typeof buildContextHint === 'function')
              ? buildContextHint(m, 'halftime_sub', state)
              : [];
            const subChoice = await new Promise(resolve => {
              UI.showInterrupt(
                I18N.t('ui.decisions.subTitle'),
                I18N.t('ui.decisions.subSubtitle'),
                subOptions,
                (picked) => resolve(picked),
                m,
                'halftime_sub',
                subHints
              );
            });

            if (typeof applyDecision === 'function' && subChoice && subChoice.id !== 'sub_none') {
              applyDecision(m, subChoice, 'halftime_sub', state);
            } else if (subChoice && typeof subChoice.apply === 'function') {
              subChoice.apply(m, { mult: 1.0, phase: 'halftime_sub', state });
            }
          }
        }

        // Return the tactic choice to core.js. core.js will route it through
        // applyDecision for the actual buff layer application.
        return tacticChoice;
      }

      // ── Final ────────────────────────────────────────────────────────────
      if (ev.phase === 'final') {
        const hints = (typeof buildContextHint === 'function')
          ? buildContextHint(m, 'final', state)
          : [];
        const finalOptions = (typeof decorateOptionsForDisplay === 'function')
          ? decorateOptionsForDisplay(m._tacticPools.final, m, 'final', state)
          : m._tacticPools.final;
        return new Promise(resolve => {
          UI.showInterrupt(
            I18N.t('ui.flow.finalTitle'),
            I18N.t('ui.flow.roundScoreSubtitle', { me: m.scoreMe, opp: m.scoreOpp }),
            finalOptions,
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

        const resolveText = (inlineValue, key, vars) => {
          if (inlineValue) return I18N.format(inlineValue, vars);
          return I18N.t(key, vars);
        };

        const describeEventActor = (player, side) => {
          if (!player) return '';
          const owner = I18N.t(`ui.eventActors.owners.${side === 'opp' ? 'opp' : 'my'}`);
          const roleKey = `ui.eventActors.roles.${player.role}`;
          const role = I18N.t(roleKey);
          return I18N.format(I18N.t('ui.eventActors.format'), {
            owner,
            role: role === roleKey ? I18N.t('ui.eventActors.roles.player') : role,
            name: player.name
          });
        };

        const titleName = eventCtx.eventPlayer?.name || eventCtx.legendaryPlayer?.name || eventCtx.oppPlayer?.name || '';
        const subtitleName = eventCtx.eventPlayer
          ? describeEventActor(eventCtx.eventPlayer, 'my')
          : eventCtx.legendaryPlayer
            ? describeEventActor(eventCtx.legendaryPlayer, 'my')
            : eventCtx.oppPlayer
              ? describeEventActor(eventCtx.oppPlayer, 'opp')
              : titleName;

        // Build option list from event definition
        // Each option needs name + desc resolved from i18n
        const options = event.options.map(opt => {
          const i18nBase = `ui.events.${event.id}.option_${opt.id}`;
          const vars = {
            name: titleName,
            oppName: eventCtx.oppPlayer?.name || '',
            pmName: eventCtx.pmPlayer?.name || '',
            lfName: eventCtx.lfPlayer?.name || '',
            bonus: 8, stat: 'offense',
            deficit: eventCtx.deficit || 0,
            n: eventCtx.oppFailedBuildups || eventCtx.streakCount || 0,
            opp: m.opp?.name || '',
            streakCount: eventCtx.streakCount || 0
          };
          const name = resolveText(opt.name, i18nBase + '.name', vars);
          const desc = resolveText(opt.desc, i18nBase + '.desc', vars);
          return { ...opt, name, desc };
        });

        // Resolve subtitle with event context
        const titleVars = {
          name: titleName,
          deficit: eventCtx.deficit || 0,
          n: eventCtx.oppFailedBuildups || eventCtx.streakCount || 0,
          opp: m.opp?.name || '',
          points: eventCtx.currentPoints || 0,
          streakCount: eventCtx.streakCount || 0,
          conceded: eventCtx.conceded || 0
        };
        const subtitleVars = {
          name: subtitleName,
          deficit: eventCtx.deficit || 0,
          n: eventCtx.oppFailedBuildups || eventCtx.streakCount || 0,
          opp: m.opp?.name || '',
          points: eventCtx.currentPoints || 0,
          streakCount: eventCtx.streakCount || 0,
          conceded: eventCtx.conceded || 0
        };
        const titleText = resolveText(event.title, `ui.events.${event.id}.title`, titleVars);
        const subtitleBase = resolveText(event.subtitle, `ui.events.${event.id}.subtitle`, subtitleVars);
        const subtitle = eventCtx.reason
          ? `${subtitleBase}\n__REASON__${eventCtx.reason}`
          : subtitleBase;

        return new Promise(resolve => {
          UI.showInterrupt(
            titleText,
            subtitle,
            options,
            (picked) => resolve(picked),
            m,
            'event',
            []
          );
        });
      }
    }
  },

  // Stat-Growth vom Level-Up läuft VOR renderResult, damit die Stat-Diffs
  // auf den Spieler-Karten die Zuwächse sofort zeigen. Evolutions bleiben
  // ein eigenständiger Modal-Flow im continueRun, über pendingEvolution
  // verkettet.
  async applyPendingLevelUps() {
    const SECONDARY_STATS = {
      TW: ['composure', 'vision'],
      VT: ['composure', 'tempo'],
      PM: ['composure', 'tempo'],
      LF: ['offense',   'vision'],
      ST: ['composure', 'tempo']
    };
    const applyStatGrowth = (player) => {
      const growth = CONFIG.statGrowthPerLevel || { focusBonus: 0, secondaryBonus: 0 };
      const role = DATA.roles.find(r => r.id === player.role);
      if (!role) return;
      const focusStat = role.focusStat;
      if (growth.focusBonus && focusStat) {
        player.stats[focusStat] = Math.min(99, (player.stats[focusStat] || 0) + growth.focusBonus);
      }
      if (growth.secondaryBonus) {
        const secondaries = SECONDARY_STATS[player.role] || [];
        const idx = secondaries.length ? ((player.level - 1) % secondaries.length) : -1;
        const secStat = idx >= 0 ? secondaries[idx] : null;
        if (secStat) {
          player.stats[secStat] = Math.min(99, (player.stats[secStat] || 0) + growth.secondaryBonus);
        }
      }
    };

    for (const p of state.roster) {
      while (p.xp >= p.xpToNext) {
        p.xp -= p.xpToNext;
        p.level++;
        p.xpToNext = Math.round(p.xpToNext * 1.4);
        applyStatGrowth(p);
        if (CONFIG.evolutionLevels.includes(p.level) && p.stage < 2) {
          p._pendingEvolution = true;
        }
      }
    }
  },

  async processPendingEvolutions() {
    for (const p of state.roster) {
      if (p._pendingEvolution) {
        p._pendingEvolution = false;
        await FLOW.triggerEvolution(p);
      }
    }
  },

  // Legacy-Wrapper: sequenziell beides. Wird nirgends mehr direkt aufgerufen,
  // aber weiterhin exportiert für Abwärtskompatibilität.
  async processLevelUps() {
    await FLOW.applyPendingLevelUps();
    await FLOW.processPendingEvolutions();
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
        state.runEvoCount = (state.runEvoCount || 0) + 1;
        resolve();
      });
    });
  },

  async continueRun() {
    // Level-Ups sind bereits in applyPendingLevelUps (vor renderResult)
    // angewandt. Hier nur noch die aufgestauten Evolutions anfragen.
    await FLOW.processPendingEvolutions();
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
