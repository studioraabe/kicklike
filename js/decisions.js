// decisions.js — Situative events, focus options, sub options
// Part of KICKLIKE match decisions v4 implementation (Step A)
//
// Exports (window.*):
//   SITUATIVE_EVENTS       — array of 5 event definitions
//   generateFocusOptions() — returns focus option array for halftime modal
//   generateSubOptions()   — returns valid sub options for halftime modal
//   computeDecisionImpact()— computes impact multiplier for a decision
//   applyDecision()        — single entry point for all player decisions

// ─── Situative Events ─────────────────────────────────────────────────────────
// Each event has:
//   id          — unique string key
//   window      — [minRound, maxRound] when it can fire
//   condition   — fn(match, state) → bool: trigger condition
//   fireChance  — probability when condition is met (default 0.60)
//   options     — array of { id, apply(match, ctx) } — effects executed before
//                 regular round logic, after the event modal resolves
//
// match._firedEvents  (Set)  — tracks which event ids fired this match
// match._eventsThisMatch (number) — count of events fired this match

const SITUATIVE_EVENTS = [
  {
    id: 'hot_player',
    window: [2, 3],
    fireChance: 0.60,
    condition(match) {
      if (!match.squad) return false;
      return match.squad.some(p => {
        const ms = p._matchStats || {};
        return (ms.goals || 0) >= 1 && (p.form || 0) >= 1;
      });
    },
    // Resolved in flow — picks the qualifying player and passes as ctx.eventPlayer
    resolveContext(match) {
      const player = match.squad.find(p => {
        const ms = p._matchStats || {};
        return (ms.goals || 0) >= 1 && (p.form || 0) >= 1;
      });
      return { eventPlayer: player };
    },
    options: [
      {
        id: 'boost',
        // _eventPlayer set by flow before apply() is called
        apply(match, ctx) {
          const p = ctx.eventPlayer;
          if (!p) return;
          const focusStat = (typeof DATA !== 'undefined' && DATA.roles.find(r => r.id === p.role)?.focusStat) || 'offense';
          const bonus = 8;
          p.stats[focusStat] = clamp(p.stats[focusStat] + bonus, 20, 99);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(
            I18N.t('ui.log.eventHotPlayerBoost', { name: p.name, stat: focusStat, bonus })
          );
        }
      },
      {
        id: 'stabilize',
        apply(match) {
          // Push a small defensive layer for rounds remaining
          const range = [match.round, 6];
          match.buffLayers.push({ source: 'event_hot_stabilize', range, stats: { defense: 6 }, special: null });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventHotPlayerStabilize'));
        }
      }
    ]
  },

  {
    id: 'crisis_moment',
    window: [3, 4],
    fireChance: 0.60,
    condition(match) {
      return match.scoreOpp >= 2 && match.scoreOpp > match.scoreMe;
    },
    resolveContext(match) {
      const deficit = match.scoreOpp - match.scoreMe;
      return { deficit };
    },
    options: [
      {
        id: 'team_talk',
        apply(match) {
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          // 30% chance the message doesn't land
          if (Math.random() < 0.30) {
            match._teamTalkFailed = true; // _teamTalkFailed: set here, read in log flush, never reset (match-scoped)
            match._triggerLogBuffer.push(I18N.t('ui.log.eventCrisisTeamTalkFailed'));
            return;
          }
          match._teamTalkFailed = false;
          const range = [match.round, 6];
          match.buffLayers.push({ source: 'event_crisis_talk', range, stats: { composure: 10, offense: 8 }, special: null });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer.push(I18N.t('ui.log.eventCrisisTeamTalk'));
        }
      },
      {
        id: 'focus',
        apply(match, ctx) {
          // Delegates to focus logic — pick worst-form outfield player
          const candidate = match.squad
            .filter(p => p.role !== 'TW')
            .sort((a, b) => (a.form || 0) - (b.form || 0))[0];
          if (!candidate) return;
          ctx.focusTarget = candidate;
          _applyFocusEffect(match, candidate, ctx);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventCrisisFocus'));
        }
      },
      {
        id: 'accept',
        apply(match) {
          // Form recovery for worst-off player, small composure tick
          const worst = match.squad
            .filter(p => p.role !== 'TW')
            .sort((a, b) => (a.form || 0) - (b.form || 0))[0];
          if (worst) {
            worst.form = clamp((worst.form || 0) + 1, -3, 3);
          }
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventCrisisAccept'));
        }
      }
    ]
  },

  {
    id: 'opp_mistake',
    window: [2, 4],
    fireChance: 0.60,
    condition(match) {
      const s = match.stats;
      if (!s || s.oppBuildups < 2) return false;
      const oppBuildupRate = s.oppBuildupsSuccess / s.oppBuildups;
      return oppBuildupRate < 0.40;
    },
    resolveContext(match) {
      const s = match.stats;
      const n = s.oppBuildups - s.oppBuildupsSuccess;
      return { oppFailedBuildups: n, oppName: match.opp?.name || 'Opponent' };
    },
    options: [
      {
        id: 'exploit',
        apply(match) {
          // _eventImmediateAttack: set here, read in flow's round loop, reset after use
          match._eventImmediateAttack = true;
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventOppMistakeExploit'));
        }
      },
      {
        id: 'sustain',
        apply(match) {
          // _oppBuildupPenalty / _oppBuildupPenaltyRounds: set here, read in attemptOppAttack, decremented per round
          match._oppBuildupPenalty = 0.12;
          match._oppBuildupPenaltyRounds = Math.max(1, 6 - match.round);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventOppMistakeSustain'));
        }
      }
    ]
  },

  {
    id: 'legendary_demand',
    window: [3, 4],
    fireChance: 0.60,
    condition(match, state) {
      if (!state) return false;
      const bench = (typeof getBench === 'function') ? getBench() : [];
      return bench.some(p => p.isLegendary);
    },
    resolveContext(match, state) {
      const bench = (typeof getBench === 'function') ? getBench() : [];
      const leg = bench.find(p => p.isLegendary);
      return { legendaryPlayer: leg };
    },
    options: [
      {
        id: 'bring_on',
        apply(match, ctx) {
          const incoming = ctx.legendaryPlayer || ctx.eventPlayer;
          if (!incoming) return;
          // Validate lineup: find player to swap out (worst form, same role preferred)
          const currentSquad = match.squad;
          let outgoing = currentSquad
            .filter(p => p.role === incoming.role && p.role !== 'TW')
            .sort((a, b) => (a.form || 0) - (b.form || 0))[0];
          if (!outgoing) {
            outgoing = currentSquad
              .filter(p => p.role !== 'TW')
              .sort((a, b) => (a.form || 0) - (b.form || 0))[0];
          }
          if (!outgoing) return;

          // Mutate squad array in-place (match.squad is the live lineup reference)
          const idx = currentSquad.indexOf(outgoing);
          if (idx >= 0) {
            currentSquad[idx] = incoming;
          }

          // Update state.lineupIds if accessible
          if (typeof window !== 'undefined' && window.getState) {
            const st = window.getState();
            if (st && st.lineupIds) {
              const lineupIdx = st.lineupIds.indexOf(outgoing.id);
              if (lineupIdx >= 0) st.lineupIds[lineupIdx] = incoming.id;
            }
          }

          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(
            I18N.t('ui.log.eventLegendaryBringOn', { name: incoming.name })
          );
        }
      },
      {
        id: 'morale',
        apply(match) {
          // Small team-wide composure boost from bench presence
          const range = [match.round, 6];
          match.buffLayers.push({ source: 'event_leg_morale', range, stats: { composure: 5, offense: 3 }, special: null });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventLegendaryMorale'));
        }
      }
    ]
  },

  {
    id: 'season_finale',
    window: [1, 1],
    fireChance: 0.60,
    condition(match, state) {
      if (!state) return false;
      const isLast = state.matchNumber >= 14; // 0-indexed, match 15 = index 14
      const pts = state.seasonPoints || 0;
      return isLast && pts >= 28 && pts <= 44;
    },
    resolveContext(match, state) {
      return { currentPoints: state?.seasonPoints };
    },
    options: [
      {
        id: 'allin',
        apply(match) {
          match.buffLayers.push({
            source: 'event_finale_allin',
            range: [match.round, 6],
            stats: { offense: 14, tempo: 8, defense: -10 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventSeasonFinaleAllIn'));
        }
      },
      {
        id: 'controlled',
        apply(match) {
          match.buffLayers.push({
            source: 'event_finale_controlled',
            range: [match.round, 6],
            stats: { composure: 10, vision: 8, defense: 6 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventSeasonFinaleControlled'));
        }
      }
    ]
  }
];

// ─── Focus helper ─────────────────────────────────────────────────────────────
// Shared logic for applying a focus effect to a player.
// Called by generateFocusOptions apply() and by the crisis_moment focus option.
//
// match._focusPlayerId    — id of focused player, set here, read in computePlayerStats
// match._focusRound       — round the focus fires (always 4 = first second-half round)
// match._focusFailChance  — probability of failure
// match._focusRedemption  — bool: crisis player gets form recovery on success

function _applyFocusEffect(match, player, ctx) {
  const focusStat = (typeof DATA !== 'undefined' && DATA.roles.find(r => r.id === player.role)?.focusStat) || 'offense';
  const form = player.form || 0;

  let bonus, failChance, redemption;
  if (form >= 2) {
    bonus = 28; failChance = 0.08; redemption = false;
  } else if (form <= -2) {
    bonus = 28; failChance = 0.40; redemption = true;
  } else if (form === -1) {
    bonus = 20; failChance = 0.22; redemption = false;
  } else {
    bonus = 20; failChance = 0.08; redemption = false;
  }

  // Store on match — computePlayerStats reads these in round _focusRound
  match._focusPlayerId   = player.id;      // set in halftime apply, read in computePlayerStats round 4, never reset (match-scoped)
  match._focusRound      = 4;             // always round 4 (first second-half round)
  match._focusFailChance = failChance;    // read in computePlayerStats
  match._focusBonus      = bonus;         // read in computePlayerStats
  match._focusStat       = focusStat;     // read in computePlayerStats
  match._focusRedemption = redemption;    // read in computePlayerStats on success
  match._focusResolved   = false;         // set to true after the round fires, prevents double-apply

  if (ctx) {
    ctx.focusPlayer = player;
    ctx.focusStat = focusStat;
    ctx.focusBonus = bonus;
    ctx.focusFailChance = failChance;
  }
}

// ─── generateFocusOptions ─────────────────────────────────────────────────────
// Returns up to 4 options: up to 3 player candidates + a "no focus" option.
// Only outfield players (non-TW) are candidates.
// Sorted by: hot form first, then normal, then poor/crisis last.
//
// @param {Array}  squad  — current starting lineup
// @param {Object} match  — current match object (unused here but kept for API symmetry)
// @returns {Array} of decision option objects

function generateFocusOptions(squad, match) {
  if (!squad || !squad.length) return [];

  const outfield = squad.filter(p => p.role !== 'TW');

  // Sort: hot (form>=2) → good (form>=1) → normal (form=0) → poor → crisis
  const sorted = outfield.slice().sort((a, b) => (b.form || 0) - (a.form || 0));
  const candidates = sorted.slice(0, 3);

  const options = candidates.map(player => {
    const form = player.form || 0;
    const focusStat = (typeof DATA !== 'undefined' && DATA.roles.find(r => r.id === player.role)?.focusStat) || 'offense';
    let descKey;
    if (form >= 2)       descKey = 'ui.decisions.focusHot';
    else if (form === -1) descKey = 'ui.decisions.focusPoorForm';
    else if (form <= -2) descKey = 'ui.decisions.focusCrisis';
    else                 descKey = 'ui.decisions.focusNormal';

    const bonus = (form >= 2 || form <= -2) ? 28 : 20;
    const desc = I18N.t(descKey, { name: player.name, bonus, stat: focusStat });

    return {
      id: 'focus_' + player.id,
      name: player.name + ' (' + player.role + ')',
      desc,
      _player: player,
      phase: 'halftime_focus',
      apply(m, ctx) {
        _applyFocusEffect(m, player, ctx);
      }
    };
  });

  // "No focus" option always appended last
  options.push({
    id: 'focus_none',
    name: I18N.t('ui.decisions.noFocus'),
    desc: I18N.t('ui.decisions.noFocusDesc'),
    phase: 'halftime_focus',
    apply() {}
  });

  return options;
}

// ─── generateSubOptions ───────────────────────────────────────────────────────
// Returns valid substitution options from the bench.
// Guarantees every proposed option leaves a valid lineup (exactly 1 TW, 5 players).
// Role mismatch is allowed but flagged with a small defense malus layer.
//
// @param {Array}  squad  — current starting lineup
// @param {Object} match  — current match object
// @param {Object} state  — game state (for bench access)
// @returns {Array} of decision option objects

function generateSubOptions(squad, match, state) {
  if (!squad || !match || !state) return [];
  const bench = (typeof getBench === 'function') ? getBench() : (state.roster || []).filter(p => !(state.lineupIds || []).includes(p.id));
  if (!bench.length) return [];

  const options = [];

  for (const incoming of bench) {
    // Find best outgoing candidate:
    // 1. Same role, not TW (unless incoming is TW — only swap TW for TW)
    // 2. If no same-role, pick worst-form non-TW player
    let outgoing = null;

    if (incoming.role === 'TW') {
      // Keeper sub: only swap for the current keeper
      outgoing = squad.find(p => p.role === 'TW') || null;
    } else {
      // Prefer same role, then worst form (excluding TW)
      const sameRole = squad.filter(p => p.role === incoming.role);
      if (sameRole.length) {
        outgoing = sameRole.sort((a, b) => (a.form || 0) - (b.form || 0))[0];
      } else {
        outgoing = squad.filter(p => p.role !== 'TW').sort((a, b) => (a.form || 0) - (b.form || 0))[0] || null;
      }
    }

    if (!outgoing) continue;

    // Validate resulting lineup
    const testLineup = squad.map(p => p.id === outgoing.id ? incoming : p);
    const keeperCount = testLineup.filter(p => p.role === 'TW').length;
    if (keeperCount !== 1 || testLineup.length !== 5) continue;

    const isRoleMismatch = incoming.role !== outgoing.role && incoming.role !== 'TW';
    const isLegendary = !!incoming.isLegendary;

    const desc = I18N.t('ui.decisions.subOption', {
      name: incoming.name,
      role: incoming.role,
      out: outgoing.name
    }) + (isRoleMismatch ? ' ' + I18N.t('ui.decisions.subRoleMismatch', { role: incoming.role }) : '')
       + (isLegendary ? ' ' + I18N.t('ui.decisions.subLegendary') : '');

    options.push({
      id: 'sub_' + incoming.id,
      name: incoming.name + ' (' + incoming.role + ')',
      desc,
      _incoming: incoming,
      _outgoing: outgoing,
      _isRoleMismatch: isRoleMismatch,
      _isLegendary: isLegendary,
      phase: 'halftime_sub',
      apply(m, ctx) {
        const inIdx = m.squad.indexOf(outgoing);
        if (inIdx >= 0) m.squad[inIdx] = incoming;

        // Update state lineupIds
        if (typeof window !== 'undefined' && window.getState) {
          const st = window.getState();
          if (st && st.lineupIds) {
            const li = st.lineupIds.indexOf(outgoing.id);
            if (li >= 0) st.lineupIds[li] = incoming.id;
          }
        }

        // Role mismatch: -8 Defense layer for round 4 only
        if (isRoleMismatch) {
          m.buffLayers.push({ source: 'sub_mismatch', range: [4, 4], stats: { defense: -8 }, special: null });
          recomputeTeamBuffs(m);
          m._triggerLogBuffer = m._triggerLogBuffer || [];
          m._triggerLogBuffer.push(I18N.t('ui.decisions.subRoleMismatch', { role: incoming.role }));
        }

        m._triggerLogBuffer = m._triggerLogBuffer || [];
        m._triggerLogBuffer.push(I18N.t('ui.decisions.subDone', { incoming: incoming.name, outgoing: outgoing.name }));

        if (ctx) ctx.subDone = true;
      }
    });
  }

  // Always offer a "no sub" escape
  options.push({
    id: 'sub_none',
    name: I18N.t('ui.decisions.noSub'),
    desc: I18N.t('ui.decisions.noSubDesc'),
    phase: 'halftime_sub',
    apply() {}
  });

  return options;
}

// ─── computeDecisionImpact ────────────────────────────────────────────────────
// Returns a multiplier in [0.30, 2.00] based on:
//   - active tactic tag synergies / conflicts
//   - player form (for focus decisions)
//   - legendary sub bonus
//   - PM/possession style coherence
//
// @param {Object} match      — current match
// @param {string} decisionId — id of the decision being evaluated
// @param {Object} state      — game state
// @returns {number} multiplier

function computeDecisionImpact(match, decisionId, state) {
  const tags = match.activeTacticTags || [];
  const tagSet = new Set(tags);

  let mult = 1.0;
  const reasons = [];

  // ── Synergy: tactic tag alignment ────────────────────────────────────────
  if (decisionId === 'pressing' || decisionId === 'high_press' || decisionId === 'final_press') {
    if (tagSet.has('pressing')) {
      mult *= 1.35;
      reasons.push({ type: 'synergy', key: 'ui.log.synergyAmplified' });
    }
    // Pressing after possession kickoff = conflict
    if (tagSet.has('ballbesitz') && !tagSet.has('pressing')) {
      mult *= 0.70;
      reasons.push({ type: 'conflict', key: 'ui.log.conflictPressingAfterPossession' });
    }
    // Pre-existing pressing misfit
    if (match._tacticMisfit?.effects?.pressingCollapseRound) {
      mult *= 0.50;
      reasons.push({ type: 'conflict', key: 'ui.log.conflictPressingCollapse' });
    }
  }

  // ── Synergy: possession + PM focus ───────────────────────────────────────
  if (decisionId.startsWith('focus_') && tagSet.has('ballbesitz')) {
    const focusPlayer = match.squad?.find(p => 'focus_' + p.id === decisionId);
    if (focusPlayer?.role === 'PM') {
      mult *= 1.20;
      reasons.push({ type: 'synergy', key: 'ui.log.synergyPossessionPM' });
    }
  }

  // ── Player form modifiers (focus decisions) ───────────────────────────────
  if (decisionId.startsWith('focus_') && decisionId !== 'focus_none') {
    const focusPlayer = match.squad?.find(p => 'focus_' + p.id === decisionId);
    if (focusPlayer) {
      const form = focusPlayer.form || 0;
      if (form >= 2) {
        mult *= 1.25;
        reasons.push({ type: 'synergy', key: 'ui.log.conflictPlayerHot' });
      } else if (form <= -2) {
        mult *= 0.65;
        reasons.push({ type: 'conflict', key: 'ui.log.conflictPlayerCrisis' });
      }
    }
  }

  // ── Legendary sub bonus ───────────────────────────────────────────────────
  if (decisionId.startsWith('sub_') && decisionId !== 'sub_none') {
    const incoming = match.squad ? null : null; // resolved by caller context
    // We check via event context if legendary — mark on decision object if needed
    // Bonus applied in applyDecision via ctx.isLegendary flag
    mult *= 1.0; // adjusted in applyDecision when ctx.isLegendary is set
  }

  // Clamp
  mult = clamp(mult, 0.30, 2.00);
  return { mult, reasons };
}

// ─── applyDecision ────────────────────────────────────────────────────────────
// Single entry point for all player decisions (tactic, focus, sub, event option).
// Applies the impact multiplier once inside decision.apply(), never again.
//
// For kickoff / halftime / final tactic decisions, delegates to applyTactic().
// For all other phases, calls decision.apply(match, ctx) directly.
//
// match._triggerLogBuffer receives synergy/conflict log lines (max 1 synergy + 1 conflict).
//
// @param {Object} match    — current match
// @param {Object} decision — decision object with id, apply(match, ctx), phase
// @param {string} phase    — 'kickoff' | 'halftime' | 'final' | 'halftime_focus' |
//                            'halftime_sub' | 'event'
// @param {Object} state    — game state

function applyDecision(match, decision, phase, state) {
  if (!decision || !match) return;

  const { mult, reasons } = computeDecisionImpact(match, decision.id, state);
  const ctx = { mult, phase, state };

  // Legendary sub boost applied here
  if (decision._isLegendary) {
    ctx.mult = clamp(mult * 1.30, 0.30, 2.00);
    reasons.push({ type: 'synergy', key: 'ui.log.conflictLegendarySub' });
  }

  // Log synergy/conflict lines — max 1 synergy + 1 conflict
  match._triggerLogBuffer = match._triggerLogBuffer || [];
  let synergyLogged = false, conflictLogged = false;
  for (const r of reasons) {
    if (r.type === 'synergy' && !synergyLogged) {
      match._triggerLogBuffer.push(I18N.t(r.key));
      synergyLogged = true;
    } else if (r.type === 'conflict' && !conflictLogged) {
      match._triggerLogBuffer.push(I18N.t(r.key));
      conflictLogged = true;
    }
    if (synergyLogged && conflictLogged) break;
  }

  // Route: tactic phases delegate to existing applyTactic(), then scale the
  // resulting buff layer by the synergy/conflict multiplier so mult actually
  // affects gameplay (not just log lines).
  if (phase === 'kickoff' || phase === 'halftime' || phase === 'final') {
    if (typeof applyTactic === 'function') {
      const layersBefore = (match.buffLayers || []).length;
      applyTactic(match, decision, phase);
      const layersAfter = (match.buffLayers || []).length;
      if (layersAfter > layersBefore && ctx.mult !== 1.0) {
        for (let i = layersBefore; i < layersAfter; i++) {
          const layer = match.buffLayers[i];
          if (!layer || !layer.stats) continue;
          for (const k of Object.keys(layer.stats)) {
            layer.stats[k] = Math.round(layer.stats[k] * ctx.mult);
          }
        }
        if (typeof recomputeTeamBuffs === 'function') recomputeTeamBuffs(match);
      }
    }
    return;
  }

  // All other phases: call decision.apply directly with ctx
  if (typeof decision.apply === 'function') {
    decision.apply(match, ctx);
  }
}

// ─── checkSituativeEvents ─────────────────────────────────────────────────────
// Called after roundStart trigger. Checks all events for the current round,
// fires at most 1 per round, at most 2 per match.
//
// match._firedEvents        (Set<string>)  — which event ids fired this match; init in startMatch
// match._eventsThisMatch    (number)       — total events fired this match; init in startMatch
// match._oppBuildupPenalty  (number|undef) — sustained build-up malus from opp_mistake sustain
// match._oppBuildupPenaltyRounds (number)  — rounds remaining for the penalty
// match._eventImmediateAttack (bool)       — sofort-Angriff flag from opp_mistake exploit
//
// @param {Object}   match   — current match
// @param {Function} onEvent — async event callback (same signature as in startMatch)
// @param {Object}   state   — game state
// @returns {Promise<void>}

async function checkSituativeEvents(match, onEvent, state) {
  if (!match || !onEvent) return;

  // Init safeguard (should be done in startMatch, but defensive)
  if (!match._firedEvents)     match._firedEvents     = new Set();
  if (!match._eventsThisMatch) match._eventsThisMatch = 0;

  // Hard cap: max 2 events per match
  if (match._eventsThisMatch >= 2) return;

  for (const event of SITUATIVE_EVENTS) {
    // Window check
    if (match.round < event.window[0] || match.round > event.window[1]) continue;

    // Already fired this match
    if (match._firedEvents.has(event.id)) continue;

    // Condition check
    if (!event.condition(match, state)) continue;

    // Probabilistic gate
    if (Math.random() >= (event.fireChance || 0.60)) continue;

    // Mark as fired
    match._firedEvents.add(event.id);
    match._eventsThisMatch++;

    // Build context
    const eventCtx = event.resolveContext ? event.resolveContext(match, state) : {};

    // Show event modal via onEvent interrupt
    const chosen = await onEvent({ type: 'interrupt', phase: 'event', match, event, eventCtx });

    if (chosen && typeof chosen.apply === 'function') {
      const applyCtx = { mult: 1.0, phase: 'event', state, ...eventCtx };
      chosen.apply(match, applyCtx);
    }

    // Flush any log lines produced by the apply
    if (typeof flushTriggerLog === 'function') {
      await flushTriggerLog(match, onEvent);
    }

    // Max 1 event per round
    break;
  }

  // Decrement sustained opp build-up penalty
  if (match._oppBuildupPenaltyRounds > 0) {
    match._oppBuildupPenaltyRounds--;
    if (match._oppBuildupPenaltyRounds <= 0) {
      match._oppBuildupPenalty = 0;
    }
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────
window.SITUATIVE_EVENTS        = SITUATIVE_EVENTS;
window.generateFocusOptions    = generateFocusOptions;
window.generateSubOptions      = generateSubOptions;
window.computeDecisionImpact   = computeDecisionImpact;
window.applyDecision           = applyDecision;
window.checkSituativeEvents    = checkSituativeEvents;