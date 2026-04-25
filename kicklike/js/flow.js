const FLOW = {
  newRun() {
    // Abandon any persisted run: the user explicitly asked for a fresh
    // start. Without this clear, a subsequent tab reload would still
    // surface the old run via Continue, which would feel like a bug.
    if (window.KL?.persistence) window.KL.persistence.clear();
    // Also start a fresh telemetry run. Wipes any in-flight test-run
    // record so the new run's data isn't mixed with old matches.
    if (window.KL?.telemetry?.isEnabled?.()) {
      window.KL.telemetry.clear();
      window.KL.telemetry.beginRun({});
    }
    state = freshState();
    UI.renderDraft();
  },

  // Resume a run from localStorage — counterpart to newRun. Wired to the
  // Continue-Run button on the start screen (renderStart in ui.js).
  // If the snapshot is missing or schema-mismatched, fall back to newRun
  // so the player isn't stranded on an empty menu. Note the method name
  // is intentionally distinct from the existing `continueRun` (which
  // handles the post-match hand-off through recruit/draft/evolution —
  // an unrelated concern despite the overlapping name).
  resumeRun() {
    const persistence = window.KL?.persistence;
    if (!persistence) { FLOW.newRun(); return; }
    const snap = persistence.load();
    if (!snap) {
      // Save turned out to be corrupt or schema-mismatched between click
      // and load. Don't silently fail; give the player a fresh run.
      persistence.clear();
      FLOW.newRun();
      return;
    }
    persistence.apply(snap);
    // Route back into the right screen. If the save was taken at a
    // normal hub entry, `advance()` is the correct destination. If the
    // save captured an in-flight recruit/draft (pendingRecruit /
    // _cardDraftMode set), continueRun routes to the matching screen.
    // Order matters: continueRun first (respects in-flight), then
    // advance as fallback.
    if (state.pendingRecruit || state._cardDraftMode || state._cardDraftPendingSecond) {
      FLOW.continueRun();
    } else {
      FLOW.advance();
    }
  },

  chooseStarterTeam(team) {
    const players = team.lineup.map(archId => makePlayer(archId, { teamId: team.id }));
    state.roster = players;
    state.lineupIds = players.map(p => p.id);
    state.teamName = team.name;
    state.teamColor = team.color;
    state.teamLogo = team.logo || null;
    state.starterTeamId = team.id;
    // Telemetry: anchor the team info so the exported run identifies
    // which starter was being tested. Roster snapshot is kept small —
    // per-player stat deltas over the run can be reconstructed from
    // each match's myLineup snapshot.
    if (window.KL?.telemetry?.isEnabled?.()) {
      window.KL.telemetry.setTeam({
        id:    team.id,
        name:  team.name,
        color: team.color,
        logo:  team.logo || null,
        initialRoster: players.map(p => ({
          id: p.id, name: p.name, role: p.role,
          archetype: p.archetype, stats: { ...p.stats }
        }))
      });
    }
    // Run-cumulative trackers — reset on new run, survive season
    // transitions so the highscore reflects the full run not just
    // the last season.
    state._runTotalWins = 0;
    state._runTotalDraws = 0;
    state._runTotalLosses = 0;
    state._runTotalGoalsFor = 0;
    state._runTotalGoalsAgainst = 0;

    // Card layer: build the run deck from the starter template.
    if (CONFIG.cardsEnabled && window.KL && window.KL.cards) {
      window.KL.cards.initRunDeck(state);
    }

    // Pre-generate the entire season bracket so future opponents (and their
    // logos) are stable from kickoff. If a run already has opponents — e.g.
    // on reload — keep them.
    //
    // Place-Indizes werden ohne Zurücklegen gezogen, damit kein Run zwei
    // Gegner mit gleichem zweiten Namen (und damit gleichem Wappen) enthält.
    // Bei 15 Plätzen = runLength passt das genau. Falls der Pool kleiner
    // würde, fällt der Code nach "Random mit Wiederholung" zurück.
    if (!state.seasonOpponents || !state.seasonOpponents.length) {
      // Build the 14-match league season via the league module. Opponents
      // come from league.getNextOpponent; we also populate seasonOpponents
      // from the schedule so downstream previews (next match card, run
      // progress strip) see league opponents at the right indices.
      if (window.KL?.league) {
        const season = window.KL.league.initSeason(state);
        if (season) {
          state.seasonOpponents = [];
          for (const game of season.schedule) {
            if (!game.isPlayer) continue;   // skip opp-vs-opp games
            const oppId = game.homeTeamId === 'self' ? game.awayTeamId : game.homeTeamId;
            const oppTeam = season.teams.find(t => t.id === oppId);
            if (oppTeam) state.seasonOpponents.push(oppTeam);
          }
          // Cup is no longer initialized at run start — it triggers
          // after Pro-league promotion as a separate end-game tournament.
        }
      }
    }
    FLOW.advance();
    // First save point of the run: starter team picked, league season
    // built, match 1 queued. From here on every hub render will save
    // too (via advance), but recording the initial run state here means
    // a tab close before match 1 still leaves something to resume.
    if (window.KL?.persistence) window.KL.persistence.autoSave();
  },

  advance() {
    // CUP MODE — playing the end-game knockout. 3 rounds of escalating
    // bosses; if we're in cup mode, the next opponent is a cup boss.
    if (state._cupMode) {
      const cupOpp = window.KL?.league?.getNextCupOpponent?.(state);
      if (cupOpp) {
        state.currentOpponent = cupOpp;
        state._isCupMatch = true;
        // Auto-save: hub entry is our stable persistence point. Writes
        // the full run snapshot to localStorage so a tab reload between
        // matches (or mid-cup) lands the player back on this hub.
        if (window.KL?.persistence) window.KL.persistence.autoSave();
        UI.renderHub();
        return;
      }
      // Cup over — endRun with cup outcome
      FLOW.endCup();
      return;
    }
    state._isCupMatch = false;

    // Standard league mode
    const effectiveRunLength = state._leagueSeason
      ? state._leagueSeason.schedule.filter(g => g.isPlayer).length
      : CONFIG.runLength;

    const leagueMatchesPlayed = state.matchHistory.filter(h => !h.cup).length;
    if (leagueMatchesPlayed >= effectiveRunLength) {
      FLOW.winRun();
      return;
    }
    const baseOpp = (state.seasonOpponents && state.seasonOpponents[leagueMatchesPlayed])
      || generateOpponent(leagueMatchesPlayed + 1);
    // Shallow-clone the opp so the runtime season-progression scaling
    // doesn't mutate the persisted entry in seasonOpponents. Without
    // this, a tab reload mid-season would re-apply the scaling on top
    // of an already-scaled opp, compounding exponentially over resumes.
    const opp = { ...baseOpp, stats: { ...(baseOpp.stats || {}) } };

    // Season-progression scaling on the opponent. Pre-generated opps
    // have a static stat pool — without this bump, the second-leg
    // fixture is played against an identical-strength opponent while
    // the player has grown (stat growth from levels + evolutions +
    // card upgrades + new traits + recruits). Telemetry from 0.35.0
    // showed goal diffs exploding in the return leg (3:0 → 12:0,
    // 3:1 → 11:2). The runtime bump applies ONLY to in-progress
    // league matches, scales with how deep the player is in the
    // season, and is transient (never persisted to the pre-gen opp).
    //
    // v0.48 — scale factor dialed from 0.22 → 0.18 (Balance Option C).
    // Telemetrie 0.44.0 zeigte Match-9/10-Wipeouts (0:5, 0:2) mit Opp-
    // Defense 152/154 — die +22%-Kurve war in Kombination mit den
    // stärksten Liga-Teams zu steil. Jetzt: +0% bei Match 1, +8% bei
    // Ende erste Runde, +18% bei letztem Match. Geglättet, aber
    // immer noch spürbar steigend.
    const lengthForScale = Math.max(2, effectiveRunLength);
    const progressRatio = leagueMatchesPlayed / (lengthForScale - 1);
    const statMul = 1 + progressRatio * 0.18;
    if (opp.stats && statMul > 1.001) {
      for (const k of Object.keys(opp.stats)) {
        opp.stats[k] = Math.round(opp.stats[k] * statMul);
      }
      opp._runtimeScale = statMul;
      opp.power = Object.values(opp.stats).reduce((a, b) => a + b, 0);
      opp.avgDefense = opp.stats.defense;
      opp.avgOffense = opp.stats.offense;
    }

    // v0.51 — Trait-complexity clamp at face time.
    //
    // Opponents are pre-generated at season start with traits matching
    // their power-tier seed (entities.js:generateOpponent uses the
    // matchNumber parameter to decide trait count, e.g. mn>=6 → 2
    // traits). Round-robin scheduling can place a high-power-tier team
    // in the player's first fixture, presenting 2 sev-3 traits in
    // week 1 — boss-tier "loaded threats" before the player has even
    // drafted Counter cards.
    //
    // Fix: at the moment the player faces a league opp, clamp the
    // active trait list by:
    //   1. SEVERITY ceiling — sev-3 nukes (konter_opp, clutch_opp)
    //      gated to mid-season+. Sev-2 standard threats stay live
    //      from M2 so opponents aren't toothless during onboarding.
    //   2. COUNT ceiling — same matchNumber-keyed thresholds the
    //      gen used (M1:0, M2-5:1, M6-12:2, M13+:3) but applied here
    //      against the PLAYER's actual position, not the seed.
    //   3. SORT by ascending severity so the easier traits surface
    //      first when the count limit cuts the list.
    //
    // boss_aura always passes through unchanged when present (cup
    // bosses retain their aura regardless of player position; league
    // teams won't have it because it's only added in the isBoss path).
    const playerMn = leagueMatchesPlayed + 1;
    const TRAIT_SEV = {
      ironwall: 1, lucky: 1,
      riegel: 2, presser_opp: 2, sturm: 2, sniper: 2,
      konter_opp: 3, clutch_opp: 3
    };
    const maxSev = playerMn >= 4 ? 3 : 2;
    const allowedCount = playerMn >= 13 ? 3
                       : playerMn >= 6  ? 2
                       : playerMn >= 2  ? 1
                       : 0;
    const sourceTraits = baseOpp.traits || [];
    const eligible = sourceTraits
      .filter(t => t !== 'boss_aura' && (TRAIT_SEV[t] || 2) <= maxSev)
      .sort((a, b) => (TRAIT_SEV[a] || 2) - (TRAIT_SEV[b] || 2))
      .slice(0, allowedCount);
    if (sourceTraits.includes('boss_aura')) eligible.push('boss_aura');
    opp.traits = eligible;
    if (window.KL?.entities?.bindTraitsToLineup) {
      opp.traitHolders = window.KL.entities.bindTraitsToLineup(eligible, opp.lineup);
    }
    opp._complexityClamp = {
      seedTraits:    sourceTraits.length,
      effectiveTraits: eligible.length,
      maxSev,
      playerMn
    };

    state.currentOpponent = opp;
    if (window.KL?.persistence) window.KL.persistence.autoSave();
    UI.renderHub();
  },

  // v0.56 — Quick-Sim entry point. Sets the per-match flag and
  // delegates to the regular startMatch flow. The flag is consumed
  // in handleMatchEvent (skips card phase, auto-picks tactics) and
  // reset post-match in advance() so each Quick-Sim is opt-in.
  // Also flips _skipAnim so the simulation animations run fast —
  // the player explicitly asked for a quick run, no reason to play
  // the round transitions at full speed.
  async startQuickSim() {
    state._quickSim = true;
    state._skipAnim = true;
    return FLOW.startMatch();
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

    // Card layer: reshuffle deck for this match. Deck-init-on-run happens
    // in chooseStarterTeam; this is per-match preparation.
    if (CONFIG.cardsEnabled && window.KL && window.KL.cards) {
      // Need to wait until startMatch creates match, so use a hook.
      // Simplest: stash a flag so handleMatchEvent can init on first event.
      state._cardsNeedMatchInit = true;
    }

    // ─── Telemetry: beginMatch ────────────────────────────────────────
    // Snapshot everything useful for post-hoc balance / realism analysis:
    // the opponent card (name, tier, power, traits, special), the full
    // lineup with role + stats + condition + traits, the tier + cup flag,
    // and team-form label. Safe under `?.` — module is opt-in, this is
    // a no-op when telemetry is off.
    if (window.KL?.telemetry?.isEnabled?.()) {
      const snapLineup = (lineup || []).map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        archetype: p.archetype,
        label: p.label,
        stage: p.stage,
        level: p.level,
        stats: { ...(p.stats || {}) },
        condition: p.condition,
        form: p.form,
        traits: (p.traits || []).slice(),
        isLegendary: !!p.isLegendary
      }));
      const snapOpp = {
        id:       opp.id || null,
        name:     opp.name,
        tier:     opp.tier || state._currentTier || null,
        power:    opp.power ?? null,
        isBoss:   !!opp.isBoss,
        traits:   (opp.traits || []).slice(),
        special:  opp.special ? { id: opp.special.id, name: opp.special.name } : null,
        stats:    opp.stats ? { ...opp.stats } : null
      };
      window.KL.telemetry.beginMatch({
        matchNumber:  (state.matchNumber ?? 0) + 1,
        seasonNumber: state._seasonNumber || 1,
        tier:         state._currentTier || null,
        cupMode:      !!state._isCupMatch,
        opponent:     snapOpp,
        lineup:       snapLineup,
        teamForm:     null,  // filled in on matchStart event (engine sets _teamFormLabel)
        initialBuffs: null
      });
    }

    // v0.52 — Match-scoped stat snapshot. Ten kickoff/halftime/final
    // tactics directly mutate `player.stats.X` during the match instead
    // of pushing decaying buff layers (fortress/lone_wolf/masterclass/
    // hero_ball/wing_overload/wingman/role_switch/shift/sacrifice/
    // shake_up). Comments in engine.js called this "persists past R6"
    // — meant within a single match — but with no post-match restore
    // path, the boosts (and debuffs) leaked into the run permanently.
    // Telemetry showed Fortress in M5 locking TW/VT defense at the 99
    // cap for the next nine fixtures, the single largest snowball
    // contributor in long runs.
    //
    // Fix: snapshot every starter's stats here (deep clone of stats
    // only — leave traits/level/condition/etc. untouched), let the
    // match mutate them freely, then restore from the snapshot once
    // startMatch returns. Restoration runs BEFORE the post-match
    // telemetry+recovery block so XP and level-up math computes
    // against the genuine pre-match baseline.
    const _statsSnapshot = lineup.map(p => ({
      id:    p.id,
      stats: { ...(p.stats || {}) }
    }));

    const result = await startMatch(lineup, opp, async (ev) => {
      if (state._skipAnim) ev.match && (ev.match.fastSkip = true);
      return FLOW.handleMatchEvent(ev);
    });

    // Restore pre-match stats. Tactics like fortress/lone_wolf are
    // intentionally explosive WITHIN the match; this prevents the
    // boost from carrying into subsequent matches.
    for (const snap of _statsSnapshot) {
      const p = lineup.find(x => x.id === snap.id);
      if (p) p.stats = snap.stats;
    }

    // ─── Telemetry: endMatch ──────────────────────────────────────────
    // Persist the final score and outcome so the per-match record is
    // self-contained. Extra post-match detail (condition drain, trait
    // fires) goes in after the recovery block below has snapshotted
    // `_conditionEndSnapshot` and counted fires.
    if (window.KL?.telemetry?.isEnabled?.()) {
      window.KL.telemetry.endMatch({
        scoreMe:  result.scoreMe,
        scoreOpp: result.scoreOpp,
        result:   result.result
      });
    }

    state._lastMatchLog = (state._matchLogBuffer || []).slice();
    state._matchLogBuffer = [];

    // Was this a cup match or a league match? Driven by the
    // _isCupMatch flag set in advance() when a cup tie was queued.
    const wasCupMatch = !!state._isCupMatch;
    if (wasCupMatch && window.KL?.league?.recordCupResult) {
      window.KL.league.recordCupResult(state, result.scoreMe, result.scoreOpp);
      state._isCupMatch = false;   // reset flag for next match
    } else if (window.KL?.league && state._leagueSeason) {
      // Standard league match — record into schedule, simulate opp-vs-opp
      window.KL.league.recordResult(state, result.scoreMe, result.scoreOpp);
    }

    state.matchNumber++;
    // v0.56 — Reset Quick-Sim flag after every match. Player must
    // opt in per match — prevents accidental skip of meaningful
    // games (e.g. Pro-Liga finale) by an old flag from a previous
    // routine fixture.
    state._quickSim = false;
    state.matchHistory.push({
      md: state.matchNumber,
      opp: opp.name,
      scoreMe: result.scoreMe,
      scoreOpp: result.scoreOpp,
      result: result.result,
      cup: wasCupMatch || undefined
    });
    // League standings updates only apply to league matches. Cup
    // matches don't count towards the season points / league W/D/L
    // — they live in their own bracket. Goals For/Against still
    // accumulate so the run-stats panel reflects the full season.
    if (!wasCupMatch) {
      if (result.result === 'win') {
        state.wins++;
        state.seasonPoints += 3;
        state.currentLossStreak = 0;
        state.currentWinStreak = (state.currentWinStreak || 0) + 1;
        if (state.currentWinStreak > (state.longestWinStreak || 0)) state.longestWinStreak = state.currentWinStreak;
        state.pendingPointsPop = 3;
        // v0.48 — Win-Confidence-Bonus (Balance Option C). Belohnt Wins
        // ohne Draws/Losses zu bestrafen: nach jedem Liga-Win +1 auf
        // confidenceBonus, capped bei +4 über die Saison. Wird beim
        // nächsten Match-Start als Team-Buff angewendet (alle 5 Stats).
        // Rollback bei Season-End zusammen mit wins/losses/draws.
        state.confidenceBonus = Math.min(4, (state.confidenceBonus || 0) + 1);
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
    }
    state.goalsFor += result.scoreMe;
    state.goalsAgainst += result.scoreOpp;

    // Run-cumulative totals — survive across season transitions so the
    // highscore can score on the FULL run, not just the last season.
    if (result.result === 'win')      state._runTotalWins   = (state._runTotalWins || 0) + 1;
    else if (result.result === 'loss') state._runTotalLosses = (state._runTotalLosses || 0) + 1;
    else                                state._runTotalDraws  = (state._runTotalDraws || 0) + 1;
    state._runTotalGoalsFor     = (state._runTotalGoalsFor || 0) + result.scoreMe;
    state._runTotalGoalsAgainst = (state._runTotalGoalsAgainst || 0) + result.scoreOpp;

    // ── Condition recovery between matches ─────────────────────────────
    // Starters finished the match with whatever condition the drain left
    // them at (usually 40 after a full 6-round run). They rest up PARTLY
    // for the next kickoff — floor of 80. Bench players didn't burn any
    // condition, and they get full rest → 100. This makes the bench a
    // strategic hedge: rotating a tired starter keeps them fresh for a
    // later match, without losing them entirely.
    //
    // Snapshot the match-end condition BEFORE recovery so renderResult's
    // bilanz view shows the actual drain (before → after during the match)
    // rather than the post-recovery value.
    const match = result.match;
    if (match) {
      match._conditionEndSnapshot = {};
      for (const p of match.squad || []) {
        if (typeof p.condition === 'number') {
          match._conditionEndSnapshot[p.id] = p.condition;
        }
      }
    }

    const lineupIds = new Set((lineup || []).map(p => p.id));
    for (const p of state.roster || []) {
      if (typeof p.condition !== 'number') p.condition = 100;
      if (lineupIds.has(p.id)) {
        // v0.38 — Loosened from 82/70/58/45 to 88/76/65/55.
        //
        // 0.37.0 telemetry (13 matches, 0.36-tier recovery with 0.38
        // fatigue rebalance) showed 3 outfield starters stuck at 45
        // condition from match 4 through match 13. The curve had no
        // escape valve: ending a match at <20 (easy with defense at
        // 4 fatigue + spam play) → recovered to 45 → -3 stat malus
        // (< 50 threshold) → ended next match at <20 again. Nine
        // matches locked in the penalty zone with no way out short
        // of manual rotation.
        //
        // New curve:
        //   ended ≥60 (light use)     → recover to 88 (was 82)
        //   ended 40-59 (moderate)    → recover to 76 (was 70)
        //   ended 20-39 (heavy)       → recover to 65 (was 58)
        //   ended <20 (overplayed)    → recover to 55 (was 45)
        //
        // Critical change: the <20 floor now lands at 55 — ABOVE the
        // 50 malus threshold. Heavy-use starters no longer get nailed
        // to the -3 penalty floor; they start the next match still
        // tired but at least playing at their base stats. Fatigue
        // still bites within a single match (heavy card-play can
        // still drop a starter below 25 → -6 malus), but the between-
        // match stuck state is gone.
        const ended = p.condition;
        let recovered;
        if (ended >= 60)      recovered = 88;
        else if (ended >= 40) recovered = 76;
        else if (ended >= 20) recovered = 65;
        else                  recovered = 55;
        p.condition = Math.min(100, recovered);
      } else {
        // v0.36 — Bench recovery tightened from +30 to +22. Bench players
        // still recover faster than starters (they didn't burn condition
        // in the live match), but the gap is now closer to realistic:
        // an unused sub starts the next match in the 90s if they were
        // already fresh, not necessarily at 100.
        p.condition = Math.min(100, p.condition + 22);
      }
    }
    if (match && match._traitFireCounts) {
      const totalFires = Object.values(match._traitFireCounts).reduce((a, b) => a + b, 0);
      state.runTraitFires = (state.runTraitFires || 0) + totalFires;
    }

    // ─── Telemetry: post-match details ────────────────────────────────
    // Condition drain per player (pre → post), trait-fire histogram,
    // and shot/buildup/save counts from the engine. This is the data
    // that lets an offline reviewer check "did fatigue scale correctly
    // over the match", "which traits fired too often or too rarely",
    // and "do shots per match line up with a 6-round football pace".
    if (window.KL?.telemetry?.isEnabled?.() && match) {
      try {
        const conditionSnapshot = {};
        if (match._conditionEndSnapshot) {
          for (const [pid, end] of Object.entries(match._conditionEndSnapshot)) {
            const player = (match.squad || []).find(p => p.id === pid);
            conditionSnapshot[pid] = {
              name:  player?.name || null,
              role:  player?.role || null,
              start: player?._startCondition ?? null,  // set by engine if instrumented
              end:   end
            };
          }
        }
        // v0.52 — Telemetry field names corrected. Previous payload
        // read `match._shotsMe` etc., which never existed — the engine
        // stores these on `match.stats.{myShots,oppShots,saves,...}`.
        // Pre-fix telemetry had every shot/buildup count emitted as 0
        // or null across an entire run, hiding the most useful data
        // for balance audits. Trait-fire totals now also pull from
        // the actual counters (`match.stats.triggersFired` for the
        // player squad, `match.stats.oppTriggersFired` for the opp).
        const ms = match.stats || {};
        window.KL.telemetry.recordPostMatch({
          conditionSnapshot,
          traitFires: {
            me:  ms.triggersFired    || 0,
            opp: ms.oppTriggersFired || 0,
            // Per-trait-id breakdown if available (opp side keeps a
            // typed counter; the player side currently doesn't, so
            // only the totals are reliable).
            oppByTrait: match._oppTraitFireCounts ? { ...match._oppTraitFireCounts } : {}
          },
          shotsMe:           ms.myShots          ?? null,
          shotsOnTargetMe:   ms.myShotsOnTarget  ?? null,
          shotsOpp:          ms.oppShots         ?? null,
          shotsOnTargetOpp:  ms.oppShotsOnTarget ?? null,
          savesMe:           ms.saves            ?? null,
          savesOpp:          ms.oppSaves         ?? null,
          buildupAttempts:   ms.myBuildups        ?? null,
          buildupSuccess:    ms.myBuildupsSuccess ?? null,
          oppBuildupAttempts: ms.oppBuildups        ?? null,
          oppBuildupSuccess:  ms.oppBuildupsSuccess ?? null,
          possessionAvgMe:   (ms.possRounds ? ms.possAccum / ms.possRounds : null),
          finalMomentum:     match.matchMomentum ?? match.momentum ?? null,
          finalPhase:        match.matchPhase || null,
          cardsPlayedCount:  Array.isArray(match._cardsPlayedThisMatch)
                                ? match._cardsPlayedThisMatch.length
                                : null,
          cardDrafts:        null  // drafts happen post-match, logged via recordDraft
        });
      } catch (_) { /* telemetry never crashes */ }
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
        // v52.2 — asymmetric form movement. Previous rule was:
        // xp ≥ 6 bumps form +1 (cap +3), xp ≤ 2 drops form −1 (floor −3).
        // That let strong runs drift form permanently positive because
        // once you're strong, "bad matches" (xp ≤ 2) rarely happen.
        // New rule:
        //   xp ≥ 8         → +1 form  (raised threshold — great, not just good)
        //   xp in 3..4     → passive drift −1 if form > 0  (good days neutral,
        //                    but mediocre drags hot streaks back)
        //   xp ≤ 2         → −1 form  (unchanged — bad remains bad)
        // Net effect: sustained +3 form requires sustained 8+ XP
        // matches, which is harder than "win and occasionally show up",
        // so form stops running away in the early-to-mid run.
        if (xp >= 8) {
          const newForm = clamp((p.form || 0) + 1, -3, 3);
          p._formDelta = newForm - (p.form || 0);
          p.form = newForm;
        } else if (xp <= 2) {
          const newForm = clamp((p.form || 0) - 1, -3, 3);
          p._formDelta = newForm - (p.form || 0);
          p.form = newForm;
        } else if (xp <= 4 && (p.form || 0) > 0) {
          // Mediocre match while riding hot form → small decay.
          const newForm = clamp((p.form || 0) - 1, -3, 3);
          p._formDelta = newForm - (p.form || 0);
          p.form = newForm;
        }
      }
      p.xp += xp;
      p.goals = 0;
      totalAwarded += xp;
    }
    // v52.2 — coach_fire halftime tactic: if picked and the match
    // was lost (the narrative trigger: "losing at half"), every
    // starter who played gets a +1 form bump for the next match.
    // Consumed here so the effect is persistent across matches, not
    // round-scoped like other tactic layers.
    if (result.match?._coachFireNextMatchForm) {
      for (const p of state.roster) {
        if (state.lineupIds.includes(p.id) && !p._replacedByAcademy) {
          p.form = clamp((p.form || 0) + 1, -3, 3);
        }
      }
      result.match._coachFireNextMatchForm = false;
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
    // v53 — Playhead zum Ende gleiten lassen, damit der Stripe visuell
    // komplett durchläuft bevor der Result-Screen kommt. Transition im
    // CSS ist 0.6s, dazu ein knapper Overhead für die Wahrnehmung.
    try { window.KL?.matchHud?.completeMatch?.(); } catch (_) { /* nice-to-have */ }
    await sleep(1500);
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
    // ─── Telemetry tee ────────────────────────────────────────────────
    // Every engine event that passes through here is mirrored into the
    // telemetry record when telemetry is active. Done before the type-
    // specific branches so the recording is independent of any early
    // returns below. Exceptions raised by the tee are swallowed — we
    // never want telemetry to crash a live match.
    if (window.KL?.telemetry?.isEnabled?.()) {
      try {
        const T = window.KL.telemetry;
        if (ev.type === 'log') {
          T.recordLog({ cls: ev.cls, msg: ev.msg });
          // v0.38 — Derive structured events from log classes the engine
          // already emits. Previously recordGoal and recordOppMove were
          // zero-called because no engine code invoked them; the
          // telemetry JSON showed 0 goals / 0 opp moves even though the
          // player scored 51 goals in a run. Rather than instrument the
          // engine at every emission site, we tee from the log stream
          // here — single choke point, keeps engine untouched.
          // Goal events: the engine emits 'goal-me' / 'goal-opp' log
          // classes at every scoring site (regular goals, extratime,
          // penalty shootout). Catching the class is cheaper than
          // parsing the flavor text and covers all future goal paths.
          if (ev.cls === 'goal-me' || ev.cls === 'goal-opp') {
            const team = (ev.cls === 'goal-me') ? 'me' : 'opp';
            const m = window.UI?._cardPhaseMatch;
            T.recordGoal({
              team,
              scorer:   null,    // flavor-text only in the log msg; leave null
              setup:    null,
              scoreMe:  m?.scoreMe  ?? null,
              scoreOpp: m?.scoreOpp ?? null
            });
          }
          // Opponent card plays: cls === 'opp-card'. Shield defusal has
          // its own class 'player-shield' — we record the defusal
          // separately so the telemetry reflects BOTH that the move
          // happened AND that it was blocked.
          if (ev.cls === 'opp-card') {
            // Format: "🃏 CARD NAME — flavor text · OFF +X / DEF +Y (2r)"
            // We extract the card name between the emoji and em-dash.
            const nameMatch = (ev.msg || '').match(/^🃏\s+([^—]+?)\s+—/);
            T.recordOppMove({
              moveId:   null,
              moveName: nameMatch ? nameMatch[1].trim() : null,
              kind:     null,
              severity: null,
              telegraphed: false,
              defused:  false
            });
          }
          if (ev.cls === 'player-shield') {
            // Shield lines come in three flavours: block (cancel),
            // counter-read (halve), reveal (info only). All three signal
            // a defusal event the reviewer cares about. Flavor is in
            // the msg, parsed loosely — not authoritative, good-enough
            // for balance review.
            const msg = ev.msg || '';
            let defusedBy = 'unknown';
            if (/absorb|block|cancel/i.test(msg))  defusedBy = 'block';
            else if (/counter.read|half/i.test(msg)) defusedBy = 'halve';
            else if (/reveal|intel|leak/i.test(msg)) defusedBy = 'reveal';
            T.recordOppMove({
              moveId:   null,
              moveName: null,
              kind:     'shield',
              severity: null,
              telegraphed: true,
              defused:  true,
              defusedBy
            });
          }
        } else if (ev.type === 'matchStart') {
          // Seed round 0 with initial team/opp buffs. Engine provides
          // the full match object; we snapshot only the fields worth
          // keeping in the record.
          T.roundTick({
            round: 0,
            phase: ev.match?.matchPhase || 'kickoff',
            momentum:  ev.match?.momentum ?? null,
            teamBuffs: ev.match?.teamBuffs || null,
            oppBuffs:  ev.match?.oppTeamBuffs || null,
            scoreMe:   ev.match?.scoreMe ?? 0,
            scoreOpp:  ev.match?.scoreOpp ?? 0
          });
        } else if (ev.type === 'roundEnd') {
          T.roundTick({
            round: ev.match?.round ?? null,
            phase: ev.match?.matchPhase || null,
            momentum:  ev.match?.momentum ?? null,
            teamBuffs: ev.match?.teamBuffs || null,
            oppBuffs:  ev.match?.oppTeamBuffs || null,
            scoreMe:   ev.match?.scoreMe ?? 0,
            scoreOpp:  ev.match?.scoreOpp ?? 0
          });
        }
        // 'interrupt' events are not recorded here — the decision sites
        // (kickoff / halftime / final / event / card-phase) log the
        // actual chosen option via recordDecision below at their
        // return points.
      } catch (_) { /* never let telemetry crash a match */ }
    }

    if (ev.type === 'log') {
      if (!state._matchLogBuffer) state._matchLogBuffer = [];
      state._matchLogBuffer.push({ msg: ev.msg, cls: ev.cls || '' });
      UI.appendLog(ev.msg, ev.cls);
      // Goal events update the scoreboard immediately — previously it
      // only refreshed at roundEnd, so mid-round goals looked delayed.
      // The match object is passed through state._currentMatch or
      // accessible via the engine's last-known match; we use the
      // scoreMe/scoreOpp already baked into the log string parsing
      // as a fallback. Simplest: pull from state._cardPhaseMatch (set
      // at match start) or state._activeMatch.
      if ((ev.cls === 'goal-me' || ev.cls === 'goal-opp') && UI._cardPhaseMatch) {
        UI.updateMatchScore(UI._cardPhaseMatch);
      }
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
      UI.updateMatchCardState?.(ev.match);
      // v52.5 — updateActiveEffects removed. Surface the persistent-card
      // outcomes as muted log lines instead, deduped per key.
      const m = ev.match;
      if (m?._cardBaitActive) {
        UI.appendAeLog?.(m, 'bait:' + m._cardBaitActive.round, 'dim',
          '└ ⚡ Bait armed — if opp does not score next round, Flow +2 after that.');
      }
      if (m?._oppIntentAbsorbed) {
        UI.appendAeLog?.(m, 'defused:' + m.round + ':' + m._oppIntentAbsorbed, 'dim',
          '└ ✓ Threat defused — opp\'s loaded trait suppressed this round.');
      }
      UI.updateMatchConditions?.(ev.match.squad);
      return;
    }

    if (ev.type === 'buffsUpdated') {
      // Feuert direkt nach Taktik-Anwendung (Kickoff/Halbzeit/Finale).
      // Momentum-Strip aktualisiert sich, bevor die Runde gespielt wird —
      // so sieht der Spieler den Impact seiner Wahl sofort.
      UI.updateMatchMomentum(ev.match);
      UI.updateMatchCardState?.(ev.match);
      // v52.5 — updateActiveEffects removed; buff changes are already
      // reflected via the momentum strip + match-card-state.
      return;
    }

    if (ev.type === 'interrupt') {
      state._preKickoff = false;
      const m = ev.match;

      // ── Card-play phase (runs every round) ──────────────────────────────
      // Non-modal: UI renders hand inline at bottom of match screen. This
      // Promise resolves when the player clicks "End Turn" (or energy is
      // exhausted + auto-end).
      if (ev.phase === 'round_card') {
        // Lazy per-match card init. Match object isn't known until first
        // event fires, so we do it here on the first card-phase of the match.
        if (state._cardsNeedMatchInit) {
          window.KL.cards.initMatchDeck(m, state);
          state._cardsNeedMatchInit = false;
        }

        // Round rollover: clear per-round card-layer flags so stale
        // flags from a previous round don't block new threats / new
        // telegraph counters.
        m._oppIntentAbsorbed = null;
        // v52.2: study_opposition sets _forceTelegraphThisRound so
        // severity-1 intents can be blocked for the rest of the round.
        // It must reset on rollover, otherwise the whole match stays
        // in "everything is telegraphed" mode after one play.
        m._forceTelegraphThisRound = false;

        // Tick active card effects: multi-round buffs count down,
        // pending effects may expire. Returns a list of resolved
        // effects for UI feedback.
        if (window.KL?.cards?.tickActiveEffects) {
          window.KL.cards.tickActiveEffects(m);
        }

        // Fatigue narrative — fires ONCE per match when the team first
        // shows meaningful condition loss. Players know to watch the
        // condition chip and consider Breather/Rotation cards.
        if (!m._fatigueLogged && m.round >= 4 && m.squad) {
          const scored = m.squad.filter(p => typeof p.condition === 'number');
          const tiredCount = scored.filter(p => p.condition < 55).length;
          if (tiredCount >= 2) {
            const mostTired = scored.reduce((a, b) => (a.condition < b.condition ? a : b));
            const logEl = document.getElementById('match-log');
            if (logEl && window.I18N?.pickText) {
              const raw = window.I18N.pickText('ui.cards.fatigueNarrative');
              if (raw && !raw.startsWith('ui.cards.')) {
                const line = raw.replace(/\{name\}/g, mostTired.name || mostTired.role);
                logEl.appendChild(el('div', { class: 'log-line card-narrative' }, [line]));
                logEl.scrollTop = logEl.scrollHeight;
              }
            }
            m._fatigueLogged = true;
          }
        }

        // Resolve delayed effects from cards played in prior rounds.
        // Bait The Counter: if opp did not score since bait was played,
        // the player earns +Flow 2 this round.
        if (m._cardBaitActive && m._cardBaitActive.round < m.round) {
          const succeeded = (m.scoreOpp || 0) === m._cardBaitActive.oppScoreSnapshot;
          if (succeeded) {
            m._cardFlow = (m._cardFlow || 0) + 2;
            window.KL.cards.setEffectStatus?.(m, 'bait_counter', 'success', '+Flow 2');
          } else {
            window.KL.cards.setEffectStatus?.(m, 'bait_counter', 'failed', 'opp scored');
          }
          m._cardBaitActive = null;
        }

        // Reset energy and top up hand for this round.
        m._cardEnergy = CONFIG.energyPerRound;
        window.KL.cards.drawToHandSize(state, CONFIG.handSize);
        // v53 — Per-Runden-Karten-Zähler zurücksetzen. Wird in playCard
        // inkrementiert und staffelt den Fatigue-Drain: jede zusätzliche
        // Karte in derselben Runde kostet mehr Kondition. Bremst Spam
        // ohne die Kartenökonomie zu brechen.
        m._cardsThisRound = 0;

        // v52.7 — Reset card-type-chain tracker per round so the bonus
        // is "earn it each round" and not "earn it once for the match".
        m._cardTypeChainThisRound = [];
        m._chainBonusTier = 0;

        // Snapshot buffs so endCardPhase can show the round's card impact
        // as a diff ("your cards this round: OFF +14, DEF +8").
        m._cardPhaseStartBuffs = { ...(m.teamBuffs || {}) };

        // v0.56 — Quick-Sim mode skips the card phase entirely. The
        // player has signaled "I'm going to win this comfortably, just
        // run it" via the Quick-Sim button in the hub. Fatigue still
        // ticks, opp moves still fire, but no cards play and no card
        // resources tick. The resolve(null) signal mirrors the
        // "End Turn with no cards played" path so the engine treats
        // it as an empty round (with the existing skip-cost penalty).
        // We skip applying that penalty in quick-sim — see the early
        // return below for that compensation.
        if (state._quickSim) {
          // Treat as a no-cards round but suppress the skip-cost
          // penalty by clearing the per-round flag the engine reads
          // when computing the "team looks uncoordinated" malus.
          m._quickSimRound = true;
          return Promise.resolve(null);
        }

        return new Promise(resolve => {
          UI.showCardPhase(m, state, () => resolve(null));
        });
      }

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

      // v0.56 — Quick-Sim auto-picks tactics. We pick the first option
      // (decorateOptionsForDisplay sorts by recommendation strength so
      // the first slot is typically a sound choice) and resolve
      // synchronously. Telemetry records the pick as kind:'auto-quicksim'
      // so balance audits can distinguish AI-pace runs from real ones.
      if (state._quickSim) {
        const phaseKey = ev.phase;            // 'kickoff' | 'halftime' | 'final'
        const pool = m._tacticPools[phaseKey] || [];
        const decorated = (typeof decorateOptionsForDisplay === 'function')
          ? decorateOptionsForDisplay(pool, m, phaseKey, state)
          : pool;
        const picked = decorated[0] || pool[0] || null;
        try {
          window.KL?.telemetry?.recordDecision?.({
            phase:   phaseKey,
            kind:    'auto-quicksim',
            chosen:  picked ? { id: picked.id, label: picked.label, tags: picked.tags || null } : null,
            options: (decorated || []).map(o => ({ id: o.id, label: o.label }))
          });
        } catch (_) {}
        return Promise.resolve(picked);
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
            (picked) => {
              // Record BEFORE resolving so the telemetry order reflects
              // the decision timing even if resolve's downstream is sync.
              try {
                window.KL?.telemetry?.recordDecision?.({
                  phase:   'kickoff',
                  kind:    'tactic',
                  chosen:  picked ? { id: picked.id, label: picked.label, tags: picked.tags || null } : null,
                  options: (kickoffOptions || []).map(o => ({ id: o.id, label: o.label }))
                });
              } catch (_) {}
              resolve(picked);
            },
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
            (picked) => {
              try {
                window.KL?.telemetry?.recordDecision?.({
                  phase:   'halftime',
                  kind:    'tactic',
                  chosen:  picked ? { id: picked.id, label: picked.label, tags: picked.tags || null } : null,
                  options: (halftimeOptions || []).map(o => ({ id: o.id, label: o.label })),
                  ctx:     { scoreMe: m.scoreMe, scoreOpp: m.scoreOpp }
                });
              } catch (_) {}
              resolve(picked);
            },
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
                (picked) => {
                  try {
                    window.KL?.telemetry?.recordDecision?.({
                      phase:   'halftime',
                      kind:    'sub',
                      chosen:  picked ? { id: picked.id, label: picked.label } : null,
                      options: (subOptions || []).map(o => ({ id: o.id, label: o.label }))
                    });
                  } catch (_) {}
                  resolve(picked);
                },
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
            (picked) => {
              try {
                window.KL?.telemetry?.recordDecision?.({
                  phase:   'final',
                  kind:    'tactic',
                  chosen:  picked ? { id: picked.id, label: picked.label, tags: picked.tags || null } : null,
                  options: (finalOptions || []).map(o => ({ id: o.id, label: o.label })),
                  ctx:     { scoreMe: m.scoreMe, scoreOpp: m.scoreOpp }
                });
              } catch (_) {}
              resolve(picked);
            },
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
            (picked) => {
              try {
                window.KL?.telemetry?.recordDecision?.({
                  phase:   'event',
                  kind:    'event',
                  chosen:  picked ? { id: picked.id, label: picked.label } : null,
                  options: (options || []).map(o => ({ id: o.id, label: o.label })),
                  ctx:     { eventId: event.id }
                });
              } catch (_) {}
              resolve(picked);
            },
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
    // v53 — Nur Stammspieler-Evolutionen anbieten. Bankspieler könnten
    // zwar per XP ein Evolution-Level erreichen, aber der Spieler kann
    // sie nicht ohne Not einwechseln, und die Rollen-Spezialisierung
    // wirkt nur im Match. Flag bleibt erhalten (kommt wieder zum Zug,
    // sollte der Spieler später in die Startelf rücken).
    const starterIds = new Set(state.lineupIds || []);
    for (const p of state.roster) {
      if (p._pendingEvolution && starterIds.has(p.id)) {
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
      return;
    }
    // Card draft: alternates ADD / REMOVE so deck reshaping is a real
    // axis. Boss matches (5, 10) grant DOUBLE_ADD — two picks back-to-back
    // as a tentpole reward.
    if (CONFIG.cardsEnabled && window.KL?.cards) {
      // Resume a pending second pick from a boss DOUBLE_ADD.
      if (state._cardDraftPendingSecond) {
        state._cardDraftPendingSecond = false;
        const options = window.KL.cards.generateCardDraftOptions();
        state._cardDraftOptions = options;
        state._cardDraftMode = 'add_second';
        UI.renderCardDraft(options, 'add_second');
        return;
      }

      const mode = window.KL.cards.pickDraftMode(state.matchNumber);
      if (mode === 'add') {
        const options = window.KL.cards.generateCardDraftOptions();
        state._cardDraftOptions = options;
        state._cardDraftMode = 'add';
        UI.renderCardDraft(options, 'add');
        return;
      }
      if (mode === 'double_add') {
        // First of two picks; flag so continueRun loops back after this
        // pick to offer the second.
        state._cardDraftPendingSecond = true;
        const options = window.KL.cards.generateCardDraftOptions();
        state._cardDraftOptions = options;
        state._cardDraftMode = 'add_first';
        UI.renderCardDraft(options, 'add_first');
        return;
      }
      if (mode === 'remove') {
        const options = window.KL.cards.generateRemovalOptions(state);
        if (options.length > 0) {
          state._cardDraftOptions = options;
          state._cardDraftMode = 'remove';
          UI.renderCardDraft(options, 'remove');
          return;
        }
      }
      if (mode === 'replace') {
        const removeOptions = window.KL.cards.generateRemovalOptions(state);
        if (removeOptions.length > 0) {
          state._cardDraftOptions = removeOptions;
          state._cardDraftMode = 'replace_step1';
          UI.renderCardDraft(removeOptions, 'replace_step1');
          return;
        }
      }
      if (mode === 'upgrade') {
        const upgradeOptions = window.KL.cards.generateUpgradeOptions(state);
        if (upgradeOptions.length > 0) {
          state._cardDraftOptions = upgradeOptions;
          state._cardDraftMode = 'upgrade';
          UI.renderCardDraft(upgradeOptions, 'upgrade');
          return;
        }
      }
      if (mode === 'evolution' && window.KL?.roles) {
        // Find all un-evolved starters and offer one candidate with
        // their two evolution paths. If all starters already evolved,
        // fall through to a normal add draft.
        const starters = getLineup();
        const eligible = starters.filter(p => !p.evolution);
        if (eligible.length > 0) {
          eligible.sort((a, b) =>
            (b._careerMatchesPlayed || 0) - (a._careerMatchesPlayed || 0)
          );
          const candidate = eligible[0];
          const paths = window.KL.roles.getEvolutionOptions(candidate.role);
          if (paths.length >= 2) {
            state._evolutionCandidateId = candidate.id;
            state._cardDraftMode = 'evolution';
            UI.renderEvolutionDraft?.(candidate, paths);
            return;
          }
        }
      }
    }
    FLOW.advance();
  },

  pickEvolution(evolutionId) {
    const candidateId = state._evolutionCandidateId;
    const candidate = getLineup().find(p => p.id === candidateId);
    if (!candidate || !window.KL?.roles) { FLOW.advance(); return; }
    window.KL.roles.applyEvolution(candidate, evolutionId);
    state._evolutionCandidateId = null;
    state._cardDraftMode = null;
    // Evolution counts as a draft window for perfectDeck.
    state._draftsTakenThisSeason = (state._draftsTakenThisSeason || 0) + 1;
    FLOW.advance();
  },

  skipEvolution() {
    state._evolutionCandidateId = null;
    state._cardDraftMode = null;
    FLOW.advance();
  },

  pickCardDraft(cardId) {
    const mode = state._cardDraftMode;
    // Snapshot the option set BEFORE the mode mutation below so the
    // telemetry record captures what the player was actually shown.
    const draftOptionsForTelemetry = Array.isArray(state._cardDraftOptions)
      ? state._cardDraftOptions.slice()
      : null;
    const isAdd = (mode === 'add' || mode === 'add_first' || mode === 'add_second' || mode === 'replace_step2');
    if (isAdd && cardId) {
      window.KL.cards.addCardToDeck(state, cardId);
    } else if (mode === 'remove' && cardId) {
      window.KL.cards.removeCardFromDeck(state, cardId);
    } else if (mode === 'upgrade' && cardId) {
      window.KL.cards.upgradeCard(state, cardId);
    } else if (mode === 'replace_step1' && cardId) {
      window.KL.cards.removeCardFromDeck(state, cardId);
      state._cardDraftReplacedId = cardId;
      state._cardDraftOptions = null;
      state._cardDraftMode = 'replace_step2';
      // Record the replace-step1 removal before we loop to step2.
      try {
        window.KL?.telemetry?.recordDraft?.({
          matchNumber: state.matchNumber,
          mode:        'replace_step1',
          options:     draftOptionsForTelemetry,
          chosen:      cardId
        });
      } catch (_) {}
      const options = window.KL.cards.generateCardDraftOptions();
      state._cardDraftOptions = options;
      UI.renderCardDraft(options, 'replace_step2');
      return;
    }
    // Record the finalized draft decision.
    try {
      window.KL?.telemetry?.recordDraft?.({
        matchNumber: state.matchNumber,
        mode:        mode,
        options:     draftOptionsForTelemetry,
        chosen:      cardId,
        replacedId:  state._cardDraftReplacedId || null
      });
    } catch (_) {}
    state._cardDraftOptions = null;
    const wasFirstBoss = (mode === 'add_first');
    state._cardDraftMode = null;
    // Track "draft taken" for the perfectDeck achievement. We count one
    // per completed draft window: single picks count once; double_add
    // only counts on the SECOND pick (the first half is part of the same
    // window); replace counts on step2 (step1 returns early above).
    if (cardId && !wasFirstBoss) {
      state._draftsTakenThisSeason = (state._draftsTakenThisSeason || 0) + 1;
    }
    // If we just finished the FIRST of a boss double_add, loop back to
    // continueRun which will pick up the second round via the pending flag.
    if (wasFirstBoss) {
      FLOW.continueRun();
      return;
    }
    FLOW.advance();
  },

  skipCardDraft() {
    const mode = state._cardDraftMode;
    try {
      window.KL?.telemetry?.recordDraft?.({
        matchNumber: state.matchNumber,
        mode:        mode,
        options:     Array.isArray(state._cardDraftOptions) ? state._cardDraftOptions.slice() : null,
        chosen:      null,
        skipped:     true
      });
    } catch (_) {}
    const wasFirstBoss = (mode === 'add_first');
    state._cardDraftOptions = null;
    state._cardDraftMode = null;
    if (wasFirstBoss) {
      FLOW.continueRun();
      return;
    }
    FLOW.advance();
  },

  startRecruit() {
    // v0.40 — Stratified role sampling + weak-role bias. Previously
    // generateLegendaryPlayer() was called three times with uniform
    // role selection, which could offer three ST legendaries to a
    // team that didn't need one. Now:
    //   1. Compute each starter's total stat sum (base stats only).
    //   2. Identify the weakest-role starter — their role becomes
    //      the "needs help" seed for slot 1.
    //   3. Slots 2 + 3 pick two other distinct roles at random from
    //      the remaining four. Three distinct roles guaranteed.
    // This is pure anti-RNG-frustration — not a team-archetype filter.
    // Legendary traits and evolution paths stay fully random, so build
    // creativity and hybrid surprises remain intact.
    const ALL_ROLES = ['TW', 'VT', 'PM', 'LF', 'ST'];
    const starters = (state.roster || []).filter(p => (state.lineupIds || []).includes(p.id));
    let weakestRole = null;
    let weakestSum = Infinity;
    for (const p of starters) {
      const sum = Object.values(p.stats || {}).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
      if (sum < weakestSum) {
        weakestSum = sum;
        weakestRole = p.role;
      }
    }
    // Build the 3-role slate: weakest first, then two random others.
    // Defensive: if weakestRole couldn't be determined (empty roster),
    // fall back to uniform 3 different roles.
    const rolesForOffers = [];
    const remaining = ALL_ROLES.slice();
    if (weakestRole && remaining.includes(weakestRole)) {
      rolesForOffers.push(weakestRole);
      remaining.splice(remaining.indexOf(weakestRole), 1);
    }
    while (rolesForOffers.length < 3 && remaining.length > 0) {
      const idx = Math.floor(Math.random() * remaining.length);
      rolesForOffers.push(remaining.splice(idx, 1)[0]);
    }
    // Shuffle the slate so the weakest-role offer isn't always slot 1.
    // (Players shouldn't learn a positional shortcut — the bias is in
    // the COMPOSITION of offers, not their order.)
    for (let i = rolesForOffers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rolesForOffers[i], rolesForOffers[j]] = [rolesForOffers[j], rolesForOffers[i]];
    }
    const opts = rolesForOffers.map(r => generateLegendaryPlayer(r));
    state._recruitOptions = opts;
    UI.renderRecruit(opts);
  },

  pickRecruit(player) {
    if (getBench().length >= CONFIG.maxBench) {
      alert(I18N.t('ui.flow.benchFull'));
      return;
    }
    state.roster.push(player);
    // Persist to the meta-codex — "legendaries ever recruited" collection
    // that drives the v52 Codex legendary tab. Pokémon-style completion goal.
    if (window.KL?.codex?.recordLegendary) {
      window.KL.codex.recordLegendary(player);
    }
    try {
      window.KL?.telemetry?.recordRosterChange?.({
        event:    'recruit',
        playerId: player.id,
        payload:  {
          name: player.name, role: player.role,
          archetype: player.archetype, stats: { ...(player.stats || {}) },
          traits: (player.traits || []).slice(), isLegendary: !!player.isLegendary
        }
      });
    } catch (_) {}
    state._recruitOptions = null;
    FLOW.advance();
  },

  skipRecruit() {
    try {
      window.KL?.telemetry?.recordDraft?.({
        matchNumber: state.matchNumber,
        mode:        'recruit',
        options:     Array.isArray(state._recruitOptions)
          ? state._recruitOptions.map(p => ({ id: p.id, name: p.name, role: p.role, archetype: p.archetype }))
          : null,
        chosen:      null,
        skipped:     true
      });
    } catch (_) {}
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
    // Run complete — clear the save. Offering "Continue Run" from a
    // finished run would resurrect a state the player already saw
    // closed out. New run / main menu is the only sensible next step.
    if (window.KL?.persistence) window.KL.persistence.clear();
    // Telemetry: finalize the run record with outcome + summary so the
    // exported JSON reflects the real endpoint. The record stays in
    // localStorage until the next newRun() or explicit clear(), giving
    // the tester a chance to download after returning to the menu.
    if (window.KL?.telemetry?.isEnabled?.()) {
      window.KL.telemetry.endRun('win');
    }
    const pts = state.seasonPoints;
    let outcome = 'survivor';
    let title = I18N.t('ui.flow.safe');
    let titleColor = 'draw';
    let subTagline = null;

    // Cup-mode end takes precedence over league-position logic
    const pendingCup = state._pendingSeasonOutcome;
    if (pendingCup?.cupComplete) {
      outcome = pendingCup.outcome;
      if (outcome === 'cup_champion') {
        title = I18N.t('ui.flow.cupChampion') || 'CUP CHAMPION!';
        titleColor = 'win';
        subTagline = I18N.t('ui.victory.cupChampion') || 'Cup won — run complete';
      } else {
        title = I18N.t('ui.flow.cupRunnerUp') || 'CUP RUNNER-UP';
        titleColor = 'draw';
        subTagline = I18N.t('ui.victory.cupRunnerUp') || 'Eliminated in the cup — run ends';
      }
    } else {
      const position = window.KL?.league?.getPlayerPosition?.(state) || null;
      const totalTeams = state._leagueSeason?.standings?.length || 0;
      const promoZone = CONFIG.leaguePromotionZone || 2;
      const relegZone = CONFIG.leagueRelegationZone || 2;
      const playedMatches = state._leagueSeason
        ? state._leagueSeason.schedule.filter(g => g.isPlayer && g.played).length
        : state.matchNumber;

      if (position === 1) {
        outcome = 'champion';
        title = 'CHAMPION!';
        titleColor = 'win';
        subTagline = I18N.t('ui.victory.champion') || 'League champion · season complete';
      } else if (position && position <= promoZone) {
        outcome = 'promotion';
        title = I18N.t('ui.flow.promotion') || 'PROMOTION';
        titleColor = 'win';
        subTagline = I18N.t('ui.victory.promotion') || 'Promoted · season complete';
      } else if (position && totalTeams && position > totalTeams - relegZone) {
        outcome = 'relegation';
        title = I18N.t('ui.flow.relegation') || 'RELEGATED';
        titleColor = 'loss';
        subTagline = I18N.t('ui.victory.relegation') || 'Relegated · season ends';
      } else {
        outcome = 'survivor';
        title = I18N.t('ui.flow.seasonComplete') || 'SEASON COMPLETE';
        titleColor = 'draw';
        subTagline = I18N.t('ui.victory.survived', { n: playedMatches })
          || `${playedMatches} matches played`;
      }
      // Stash for renderVictoryAction (cup-outcomes already populated)
      state._pendingSeasonOutcome = {
        outcome, position, totalTeams, promoZone, relegZone,
        tier: state._currentTier || 'amateur'
      };
    }
    const entry = buildHighscoreEntry(state, outcome);
    const isNewBest = saveHighscore(entry);
    const best = loadHighscore();
    const summary = $('#victory-summary');
    summary.innerHTML = '';
    const h1 = $('#screen-victory h1');
    if (h1) { h1.textContent = title; h1.className = titleColor; }
    const tagline = document.getElementById('victory-tagline');
    if (tagline) {
      tagline.textContent = subTagline ||
        I18N.t('ui.victory.survived', { n: state.matchNumber });
    }

    // Points + record + record-highlight line — short stanza above the
    // reusable stats panel.
    const headStanza = el('div', { class: 'rsp-head-stanza' }, [
      el('div', { class: 'rsp-points' }, [I18N.t('ui.flow.points', { points: pts })]),
      isNewBest
        ? el('div', { class: 'rsp-record-flash' }, [I18N.t('ui.flow.record')])
        : (best ? el('div', { class: 'rsp-best-ref' },
            [I18N.t('ui.flow.bestScore', { points: best.points, team: best.teamName })]) : null)
    ]);
    summary.appendChild(headStanza);

    // v53 — Victory-Sections in Accordions. Drei ausklappbare Bereiche:
    // Liga-Tabelle (offen by default — finales Season-Ergebnis ist der
    // Hauptpayoff), Run-Stats, Squad. Native <details>/<summary>, Styling
    // via .manual-section* wiederverwendet — konsistent mit dem Manual-
    // Look.
    const accWrap = el('div', { class: 'victory-accordion' });

    // 1) Final league standings — rendered via the shared helper so the
    //    victory view uses the same row format as the hub table.
    if (state._leagueSeason?.standings?.length) {
      const tableInner = UI.buildLeagueTableInner?.(state._leagueSeason.standings);
      if (tableInner) {
        const tableSection = el('details', { class: 'manual-section', open: 'open' }, [
          el('summary', { class: 'manual-section-title' },
            [I18N.tOr('ui.league.title', 'LEAGUE TABLE')]),
          el('div', { class: 'manual-section-body victory-section-body' }, [tableInner])
        ]);
        accWrap.appendChild(tableSection);
      }
    }

    // 2) Run stats panel
    const statsPanel = UI.buildRunStatsPanel();
    if (statsPanel) {
      const statsSection = el('details', { class: 'manual-section' }, [
        el('summary', { class: 'manual-section-title' },
          [I18N.tOr('ui.victory.stats', 'RUN STATS')]),
        el('div', { class: 'manual-section-body victory-section-body' }, [statsPanel])
      ]);
      accWrap.appendChild(statsSection);
    }

    // 3) Squad — roster that earned the championship.
    const sq = el('div', { class:'squad-display' });
    state.roster.forEach(p => sq.appendChild(UI.renderPlayerCard(p)));
    const squadSection = el('details', { class: 'manual-section' }, [
      el('summary', { class: 'manual-section-title' },
        [I18N.tOr('ui.victory.squad', 'SQUAD')]),
      el('div', { class: 'manual-section-body victory-section-body' }, [sq])
    ]);
    accWrap.appendChild(squadSection);

    summary.appendChild(accWrap);

    UI.renderVictoryAction?.();
    UI.showScreen('screen-victory');
  },

  // Transition to the next season within the same run. Called from the
  // victory screen's "Continue to Pro League" (or equivalent) button.
  // Handles tier promotion/relegation, picks the returning rival opp
  // to carry forward, increments season counter, rebuilds the league,
  // and drops the player back into the hub.
  continueSeason() {
    const outcome = state._pendingSeasonOutcome;
    if (!outcome) {
      FLOW.newRun();
      return;
    }
    // Check season-end achievements BEFORE state.wins/losses/draws get
    // reset below. checkSeasonEndAchievements inspects the just-completed
    // season's totals to award firstPromotion/seasonChampion/etc.
    if (typeof checkSeasonEndAchievements === 'function') {
      checkSeasonEndAchievements(state, outcome);
    }
    const tiers = CONFIG.leagueTiers || [];
    const currentTierIdx = tiers.findIndex(t => t.id === outcome.tier);
    const promoted = outcome.outcome === 'champion' || outcome.outcome === 'promotion';
    const isProTopFinish = promoted && tiers[currentTierIdx]?.id === 'pro';

    // PRO PROMOTION → Cup End-Game (instead of next season)
    if (isProTopFinish) {
      window.KL?.league?.initCupBracket?.(state);
      state._pendingSeasonOutcome = null;
      // Reset season-scoped fields (cup match-counter starts fresh)
      state.seasonPoints = 0;
      state.wins = 0;
      state.losses = 0;
      state.draws = 0;
      state.matchNumber = 0;
      state.matchHistory = [];
      state.currentWinStreak = 0;
      state.currentLossStreak = 0;
      state.confidenceBonus = 0;   // v0.48 — fresh season, fresh mindset
      state.currentOpponent = null;
      state._seasonNumber = (state._seasonNumber || 1) + 1;

      // Saison-Transition: Cup-Reveal mit allen 3 Bossen
      const bosses = state._cupOpponents || [];
      if (window.UI?.showSeasonTransition) {
        UI.showSeasonTransition({
          kind: 'cup',
          cupBosses: bosses,
          previousTier: tiers[currentTierIdx]
        });
      } else {
        FLOW.advance();
      }
      return;
    }

    // Standard tier transition (relegation, promotion, or mid-table → next season)
    // v52.5 bugfix — previously this block only incremented nextTierIdx for
    // relegation; the champion/promotion case fell through with nextTierIdx
    // unchanged, so Amateur → Pro promotion looped back into "Amateur Saison
    // 2". Now explicitly promote on champion/promotion outcomes (the Pro-top
    // case was already short-circuited into the Cup block above).
    let nextTierIdx = currentTierIdx;
    if (outcome.outcome === 'relegation') {
      nextTierIdx = Math.max(0, currentTierIdx - 1);
    } else if (promoted) {
      nextTierIdx = Math.min(tiers.length - 1, currentTierIdx + 1);
    }
    const nextTier = tiers[nextTierIdx]?.id || 'amateur';
    const tierChanged = nextTierIdx !== currentTierIdx;

    let returningId = null;
    let returningCache = null;
    const standings = state._leagueSeason?.standings || [];
    const teams = state._leagueSeason?.teams || [];
    if (tierChanged) {
      let companionPos = null;
      if (outcome.outcome === 'relegation') {
        companionPos = standings.findIndex((s, i) =>
          i >= standings.length - outcome.relegZone && !s.self
        );
      }
      if (companionPos != null && companionPos >= 0) {
        const companionRow = standings[companionPos];
        const companionTeam = teams.find(t => t.id === companionRow.id);
        if (companionTeam) {
          returningId = companionTeam.id;
          returningCache = {
            name: companionTeam.name,
            logo: companionTeam.logo,
            placeIdx: companionTeam._placeIdx
          };
        }
      }
    }

    state._currentTier = nextTier;
    state._seasonNumber = (state._seasonNumber || 1) + 1;
    state._returningOppId = returningId;
    state._returningOppCache = returningCache;
    state._pendingSeasonOutcome = null;

    state.seasonPoints = 0;
    state.wins = 0;
    state.losses = 0;
    state.draws = 0;
    state.matchNumber = 0;
    state.matchHistory = [];
    state.currentWinStreak = 0;
    state.currentLossStreak = 0;
    state.confidenceBonus = 0;   // v0.48 — fresh season, fresh mindset
    state.seasonOpponents = null;
    state._leagueSeason = null;
    state._cupBracket = null;
    state._cupMode = false;
    state.currentOpponent = null;

    if (window.KL?.league) {
      const season = window.KL.league.initSeason(state);
      if (season) {
        state.seasonOpponents = [];
        for (const game of season.schedule) {
          if (!game.isPlayer) continue;
          const oppId = game.homeTeamId === 'self' ? game.awayTeamId : game.homeTeamId;
          const oppTeam = season.teams.find(t => t.id === oppId);
          if (oppTeam) state.seasonOpponents.push(oppTeam);
        }
      }
    }

    // Saison-Transition: Tier-Reveal (Aufstieg / Abstieg / gleiche Liga)
    if (window.UI?.showSeasonTransition) {
      const returningOpp = returningCache ? {
        name: returningCache.name,
        logo: returningCache.logo
      } : null;
      UI.showSeasonTransition({
        kind: 'tier',
        newTier: tiers[nextTierIdx],
        previousTier: tiers[currentTierIdx],
        returningOpp
      });
    } else {
      FLOW.advance();
    }
  },

  // End the cup tournament — show victory screen with cup outcome.
  // Won = run champion, eliminated = runner-up.
  endCup() {
    const bracket = state._cupBracket;
    state._cupMode = false;
    state._isCupMatch = false;
    const won = bracket?.playerWon;
    // Check cup-end achievements BEFORE we clear cup state and before
    // winRun() pulls the highscore entry. Bracket state is still populated
    // at this point, giving cupChampion/cupRunnerUp the data they need.
    if (typeof checkCupEndAchievements === 'function') {
      checkCupEndAchievements(state);
    }
    state._pendingSeasonOutcome = {
      outcome: won ? 'cup_champion' : 'cup_runner_up',
      tier: state._currentTier || 'pro',
      cupComplete: true
    };
    FLOW.winRun();
  },

  gameOver(reason) {
    // Run ended — clear the save so the next start-screen visit doesn't
    // offer to continue a dead run. The highscore is written below via
    // buildHighscoreEntry; it persists independently.
    if (window.KL?.persistence) window.KL.persistence.clear();
    // Telemetry: mark run-ended with the reason string so a reviewer
    // can distinguish "fired (3-loss streak)" from "amateur relegation".
    if (window.KL?.telemetry?.isEnabled?.()) {
      window.KL.telemetry.endRun('gameOver:' + (reason || 'unknown'));
    }
    const entry = buildHighscoreEntry(state, 'fired');
    const isNewBest = saveHighscore(entry);
    const best = loadHighscore();

    // v52.1: align with winRun pattern — the loss screen used to dump
    // reason + stats + record all into one #gameover-reason block while
    // the win screen had a cleaner 3-part layout (tagline, head-stanza
    // with points+record, stats panel, squad). Same visual language now
    // across both end-of-run screens.
    const tagline = document.getElementById('gameover-tagline');
    if (tagline) {
      tagline.textContent = reason;
    }

    const summary = document.getElementById('gameover-summary');
    if (summary) {
      summary.innerHTML = '';

      // Sub-reason line — "after N matches, P points" context under the
      // reason tagline. Was inside the old reason block; kept as a
      // small muted line at the top of the summary.
      summary.appendChild(el('div', { class: 'rsp-reason-sub' },
        [I18N.t('ui.flow.afterMatches', { points: state.seasonPoints, matches: state.matchNumber })]));

      // Head stanza — points line + record-flash or best-ref. Matches
      // winRun's rsp-head-stanza so both screens communicate the same
      // short "here's your score vs your best" summary before diving
      // into the full stats panel.
      const headStanza = el('div', { class: 'rsp-head-stanza' }, [
        el('div', { class: 'rsp-points' }, [I18N.t('ui.flow.points', { points: state.seasonPoints })]),
        isNewBest
          ? el('div', { class: 'rsp-record-flash' }, [I18N.t('ui.flow.bestRun')])
          : (best ? el('div', { class: 'rsp-best-ref' },
              [I18N.t('ui.flow.bestScore', { points: best.points, team: best.teamName })]) : null)
      ]);
      summary.appendChild(headStanza);

      // Main stats panel — shared between both end screens.
      const statsPanel = UI.buildRunStatsPanel();
      if (statsPanel) summary.appendChild(statsPanel);

      // Final roster display — the squad you ran with. Was missing on
      // gameover; adds closure (here's the team I assembled, even if we
      // didn't make it).
      const sq = el('div', { class: 'squad-display' });
      (state.roster || []).forEach(p => sq.appendChild(UI.renderPlayerCard(p)));
      summary.appendChild(sq);
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
