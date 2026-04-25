// ─────────────────────────────────────────────────────────────────────────────
// telemetry.js — Structured test-run recorder.
//
// Purpose: capture a full playthrough in enough structured detail that a
// human reviewer (or an offline analysis script) can afterwards assess
//
//   (a) balance — are matches too easy / too hard at each tier, do card
//       plays actually swing outcomes, does opponent difficulty scale
//       the way it should;
//
//   (b) football plausibility — do the narrative and mechanical beats
//       read as something a real match would produce: goals at sensible
//       frequency, opp threats answered or not, tactical decisions with
//       visible downstream impact, phase transitions timed correctly.
//
// The module is OPT-IN. It adds zero overhead to a normal run. It turns
// on via either:
//   * URL query flag: ?telemetry=1           (enables persistently)
//   * URL query flag: ?telemetry=0           (disables persistently)
//   * Console toggle: KL.telemetry.setEnabled(true|false)
//
// When enabled, every interesting event during a match (log line, round
// tick, card play, opp intent, tactical decision, goal, match start/end)
// is appended to an in-memory run record. The record is flushed to
// localStorage at match boundaries so a tab reload doesn't lose it.
//
// A single run can be exported as a JSON file via
// KL.telemetry.download() or from the start-screen footer once the run
// is complete. The JSON is self-describing: runId, game version, per-
// match arrays of rounds + events, plus a rollup summary.
//
// Hook integration lives in flow.js (handleMatchEvent tee) and ui.js
// (card-play path). Those files call KL.telemetry.record* if present;
// when the module isn't loaded or telemetry is off, the calls are
// cheap no-ops routed through the dispatch helpers at the bottom.
// ─────────────────────────────────────────────────────────────────────────────

(() => {
  const KL = window.KL || (window.KL = {});

  const ENABLED_KEY = 'kicklike_telemetry_enabled_v1';
  const RUN_KEY     = 'kicklike_telemetry_run_v1';
  const MAX_LOGS_PER_MATCH = 2000;   // safety cap to keep localStorage sane
  const MAX_ROUNDS = 60;              // 6 rounds + penalties, generous ceiling

  // ─── Enable flag lifecycle ─────────────────────────────────────────────
  // Read URL flag on load so `?telemetry=1` flips the switch even across
  // a hard reload. Silently tolerant of missing localStorage.
  function readEnabled() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('telemetry')) {
        const v = params.get('telemetry');
        const on = (v === '1' || v === 'true' || v === 'on');
        try { localStorage.setItem(ENABLED_KEY, on ? '1' : '0'); } catch (_) {}
        return on;
      }
      return localStorage.getItem(ENABLED_KEY) === '1';
    } catch (_) {
      return false;
    }
  }

  let enabled = readEnabled();

  function setEnabled(on) {
    enabled = !!on;
    try { localStorage.setItem(ENABLED_KEY, enabled ? '1' : '0'); } catch (_) {}
    if (!enabled) clearRun();
    return enabled;
  }

  function isEnabled() { return enabled; }

  // ─── Run record shape ──────────────────────────────────────────────────
  // One active run held in memory. Persisted to localStorage after every
  // match. On boot, if a run is persisted AND telemetry is still on AND
  // the game version matches, we resume the record (so a tab reload
  // doesn't chop off mid-run telemetry). Cross-version runs are dropped
  // like save-games are dropped by persistence.js.
  let run = null;
  let activeMatch = null;
  let activeRound = null;

  function nowIso() {
    try { return new Date().toISOString(); } catch (_) { return String(Date.now()); }
  }

  // Round helpers — floats from buffLayer math make JSON diffs noisy.
  function roundNum(v) {
    if (typeof v !== 'number' || !isFinite(v)) return v;
    return Math.round(v * 1000) / 1000;
  }
  function snapStats(s) {
    if (!s || typeof s !== 'object') return null;
    const out = {};
    for (const k of Object.keys(s)) out[k] = roundNum(s[k]);
    return out;
  }

  function newRunRecord(ctx = {}) {
    return {
      runId: 'tr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
      gameVersion: (KL && KL.VERSION) || null,
      channel:     (KL && KL.VERSION_CHANNEL) || null,
      startedAt:   nowIso(),
      endedAt:     null,
      endedReason: null,
      team: ctx.team || null,
      runConfig: {
        cardsEnabled: !!(window.CONFIG && window.CONFIG.cardsEnabled)
      },
      matches: [],
      drafts: [],
      rosterChanges: [],
      summary: null
    };
  }

  function persistRun() {
    if (!enabled || !run) return;
    try {
      // Cap match logs defensively before write so a pathological match
      // doesn't blow past localStorage quota (~5MB).
      for (const m of run.matches) {
        if (m.logs && m.logs.length > MAX_LOGS_PER_MATCH) {
          m.logs = m.logs.slice(0, MAX_LOGS_PER_MATCH);
          m._logsTruncated = true;
        }
      }
      localStorage.setItem(RUN_KEY, JSON.stringify(run));
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[telemetry] persist failed:', e?.message || e);
      }
    }
  }

  function loadPersistedRun() {
    try {
      const raw = localStorage.getItem(RUN_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      // Cross-version telemetry is discarded — same policy as saves.
      const currentVersion = (KL && KL.VERSION) || null;
      if (currentVersion && parsed.gameVersion !== currentVersion) {
        try { localStorage.removeItem(RUN_KEY); } catch (_) {}
        return null;
      }
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function clearRun() {
    run = null;
    activeMatch = null;
    activeRound = null;
    try { localStorage.removeItem(RUN_KEY); } catch (_) {}
  }

  // ─── Lifecycle hooks ───────────────────────────────────────────────────

  function beginRun(ctx) {
    if (!enabled) return;
    run = newRunRecord(ctx);
    activeMatch = null;
    activeRound = null;
    persistRun();
  }

  function endRun(reason) {
    if (!enabled || !run) return;
    run.endedAt = nowIso();
    run.endedReason = reason || 'unknown';
    run.summary = computeRunSummary(run);
    persistRun();
  }

  function setTeam(team) {
    if (!enabled) return;
    if (!run) run = newRunRecord({ team });
    else run.team = team;
    persistRun();
  }

  // ─── Match bracket ─────────────────────────────────────────────────────

  function beginMatch(ctx) {
    if (!enabled) return;
    if (!run) run = newRunRecord({});
    activeMatch = {
      matchNumber:   ctx.matchNumber ?? null,
      seasonNumber:  ctx.seasonNumber ?? null,
      tier:          ctx.tier ?? null,
      cupMode:       !!ctx.cupMode,
      startedAt:     nowIso(),
      endedAt:       null,
      opponent:      ctx.opponent || null,
      myLineup:      ctx.lineup || null,
      teamForm:      ctx.teamForm ?? null,
      initialBuffs:  ctx.initialBuffs || null,
      // Round-keyed storage. Built lazily on first event per round.
      rounds:        [],
      // Flat event stream — a superset of rounds[] entries with logs.
      // Useful for offline tools that want chronological order without
      // round-bucket navigation.
      events:        [],
      // Flat log lines as emitted by the engine's onEvent({type:'log'}).
      logs:          [],
      cardPlays:     [],
      decisions:     [],
      oppMoves:      [],
      goals:         [],
      result:        null,
      postMatch:     null
    };
    activeRound = null;
    run.matches.push(activeMatch);
    persistRun();
  }

  function endMatch(result) {
    if (!enabled || !activeMatch) return;
    activeMatch.endedAt = nowIso();
    activeMatch.result = result || null;
    persistRun();
  }

  function roundTick(ctx) {
    if (!enabled || !activeMatch) return;
    activeRound = {
      round:       ctx.round ?? null,
      phase:       ctx.phase ?? null,
      momentum:    ctx.momentum ?? null,
      teamBuffs:   snapStats(ctx.teamBuffs),
      oppBuffs:    snapStats(ctx.oppBuffs),
      scoreMe:     ctx.scoreMe ?? null,
      scoreOpp:    ctx.scoreOpp ?? null,
      cardsPlayed: [],
      oppMoves:    [],
      decisions:   [],
      logs:        []
    };
    if (activeMatch.rounds.length < MAX_ROUNDS) activeMatch.rounds.push(activeRound);
    persistRun();
  }

  // ─── Event appenders ───────────────────────────────────────────────────

  function recordLog(entry) {
    if (!enabled || !activeMatch) return;
    const stamped = {
      round: activeRound?.round ?? null,
      cls:   entry.cls || '',
      msg:   entry.msg || ''
    };
    activeMatch.logs.push(stamped);
    activeMatch.events.push({ kind: 'log', ...stamped });
    if (activeRound) activeRound.logs.push(stamped);
  }

  function recordCardPlay(payload) {
    if (!enabled || !activeMatch) return;
    const entry = {
      round:    activeRound?.round ?? payload.round ?? null,
      cardId:   payload.cardId,
      cardType: payload.cardType || null,
      cost:     payload.cost ?? null,
      energyAfter: payload.energyAfter ?? null,
      chainIndex:  payload.chainIndex ?? null,    // nth card in this round
      fatigueTarget: payload.fatigueTarget || null,
      fatigueDrain:  payload.fatigueDrain ?? null,
      fatigueConditionAfter: payload.fatigueConditionAfter ?? null,
      combinedMultiplier: payload.combinedMultiplier ?? 1,
      upgraded:   !!payload.upgraded,
      roleAffinity:  payload.roleAffinity ?? null,
      phaseAffinity: payload.phaseAffinity ?? null,
      matchPhase:    payload.matchPhase || null,
      payoff:        payload.payoff ?? null,
      outcome:       payload.outcome || null,
      flowBefore:    payload.flowBefore ?? null,
      flowAfter:     payload.flowAfter ?? null,
      chainBonusFired: payload.chainBonusFired || null,
      chainBonusStats: snapStats(payload.chainBonusStats),
      teamBuffsBefore: snapStats(payload.teamBuffsBefore),
      teamBuffsAfter:  snapStats(payload.teamBuffsAfter)
    };
    activeMatch.cardPlays.push(entry);
    activeMatch.events.push({ kind: 'cardPlay', ...entry });
    if (activeRound) activeRound.cardsPlayed.push(entry);
  }

  function recordOppMove(payload) {
    if (!enabled || !activeMatch) return;
    const entry = {
      round:    activeRound?.round ?? payload.round ?? null,
      moveId:   payload.moveId,
      moveName: payload.moveName || null,
      kind:     payload.kind || null,        // 'surge' / 'lockdown' / ...
      severity: payload.severity ?? null,
      telegraphed: !!payload.telegraphed,
      defused:  !!payload.defused,
      defusedBy: payload.defusedBy || null,  // 'block' / 'counter' / ...
      statImpact: snapStats(payload.statImpact)
    };
    activeMatch.oppMoves.push(entry);
    activeMatch.events.push({ kind: 'oppMove', ...entry });
    if (activeRound) activeRound.oppMoves.push(entry);
  }

  function recordDecision(payload) {
    if (!enabled || !activeMatch) return;
    const entry = {
      round:   activeRound?.round ?? payload.round ?? null,
      phase:   payload.phase || null,        // 'kickoff' / 'halftime' / 'final' / 'event'
      kind:    payload.kind || null,         // 'tactic' / 'focus' / 'sub' / 'event'
      chosen:  payload.chosen || null,
      options: payload.options || null,
      mult:    payload.mult ?? null,
      ctx:     payload.ctx || null
    };
    activeMatch.decisions.push(entry);
    activeMatch.events.push({ kind: 'decision', ...entry });
    if (activeRound) activeRound.decisions.push(entry);
  }

  function recordGoal(payload) {
    if (!enabled || !activeMatch) return;
    const entry = {
      round:    activeRound?.round ?? payload.round ?? null,
      scorer:   payload.scorer || null,
      team:     payload.team || null,        // 'me' / 'opp'
      setup:    payload.setup || null,       // card chain / tactic tag, if any
      scoreMe:  payload.scoreMe ?? null,
      scoreOpp: payload.scoreOpp ?? null
    };
    activeMatch.goals.push(entry);
    activeMatch.events.push({ kind: 'goal', ...entry });
  }

  function recordDraft(payload) {
    if (!enabled || !run) return;
    run.drafts.push({
      at:          nowIso(),
      matchNumber: payload.matchNumber ?? null,
      mode:        payload.mode || null,     // 'add' / 'remove' / 'upgrade' / 'replace' / 'evolution' / 'recruit'
      options:     payload.options || null,
      chosen:      payload.chosen || null,
      skipped:     !!payload.skipped
    });
    persistRun();
  }

  function recordRosterChange(payload) {
    if (!enabled || !run) return;
    run.rosterChanges.push({
      at:    nowIso(),
      event: payload.event,                   // 'recruit' / 'evolution' / 'levelup' / ...
      playerId: payload.playerId || null,
      payload:  payload.payload || null
    });
    persistRun();
  }

  function recordPostMatch(payload) {
    if (!enabled || !activeMatch) return;
    activeMatch.postMatch = payload || {};
    persistRun();
  }

  // ─── Summary / export ──────────────────────────────────────────────────

  // Roll up a human-scannable summary of the run. Deliberately flat
  // numbers rather than narrative — the purpose of the run record is
  // to enable external analysis, and the summary is the quick-look
  // version of that same data.
  function computeRunSummary(r) {
    const s = {
      matchCount:   r.matches.length,
      wins: 0, draws: 0, losses: 0,
      goalsFor: 0, goalsAgainst: 0,
      totalCardPlays: 0,
      totalOppMoves:  0,
      totalOppMovesDefused: 0,
      totalDecisions: 0,
      totalGoals:     0,
      averageRoundsPerMatch: 0,
      cardPlaysByType: {},
      outcomeByTier:   {}
    };
    let roundSum = 0;
    for (const m of r.matches) {
      if (m.result) {
        if (m.result.result === 'win')  s.wins++;
        if (m.result.result === 'draw') s.draws++;
        if (m.result.result === 'loss') s.losses++;
        s.goalsFor     += m.result.scoreMe  ?? 0;
        s.goalsAgainst += m.result.scoreOpp ?? 0;
        if (m.tier) {
          const key = (m.cupMode ? 'cup' : m.tier);
          if (!s.outcomeByTier[key]) s.outcomeByTier[key] = { w:0, d:0, l:0 };
          s.outcomeByTier[key][m.result.result?.[0] || '?']++;
        }
      }
      s.totalCardPlays += (m.cardPlays || []).length;
      s.totalOppMoves  += (m.oppMoves  || []).length;
      s.totalOppMovesDefused += (m.oppMoves || []).filter(x => x.defused).length;
      s.totalDecisions += (m.decisions || []).length;
      s.totalGoals     += (m.goals || []).length;
      roundSum         += (m.rounds || []).length;
      for (const cp of (m.cardPlays || [])) {
        const k = cp.cardType || cp.cardId || '?';
        s.cardPlaysByType[k] = (s.cardPlaysByType[k] || 0) + 1;
      }
    }
    s.averageRoundsPerMatch = r.matches.length
      ? Math.round(roundSum / r.matches.length * 10) / 10
      : 0;
    return s;
  }

  // Serialize the current run to a standalone JSON string, with an
  // up-to-date summary computed at export time.
  function exportJson() {
    if (!run) return null;
    const snapshot = JSON.parse(JSON.stringify(run));
    snapshot.exportedAt = nowIso();
    snapshot.summary = computeRunSummary(snapshot);
    return JSON.stringify(snapshot, null, 2);
  }

  function download(filenameHint) {
    const json = exportJson();
    if (!json) {
      if (typeof console !== 'undefined') console.warn('[telemetry] no run to download');
      return false;
    }
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const name = filenameHint
      || ('kicklike-telemetry-' + (run.runId || 'run') + '.json');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 100);
    return true;
  }

  function getRunRef() { return run; }
  function hasRun() { return !!run && run.matches.length > 0; }

  // ─── Boot: restore persisted run if one exists ─────────────────────────
  // Only if telemetry is still on. A user who disabled telemetry between
  // sessions shouldn't have a ghost record resurrect itself.
  if (enabled) {
    const restored = loadPersistedRun();
    if (restored) {
      run = restored;
      // activeMatch/activeRound are intentionally nulled on restore —
      // we don't know whether the in-flight match is still live, so
      // the next beginMatch creates a fresh record.
    }
  }

  KL.telemetry = {
    // flag
    isEnabled,
    setEnabled,

    // run lifecycle
    beginRun,
    endRun,
    setTeam,
    clear: clearRun,
    getRun: getRunRef,
    hasRun,

    // match lifecycle
    beginMatch,
    endMatch,
    roundTick,
    recordPostMatch,

    // in-match events
    recordLog,
    recordCardPlay,
    recordOppMove,
    recordDecision,
    recordGoal,

    // run-scope events
    recordDraft,
    recordRosterChange,

    // export
    exportJson,
    download,
    computeSummary: () => run ? computeRunSummary(run) : null,

    // constants
    ENABLED_KEY,
    RUN_KEY
  };
})();
