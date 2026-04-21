function _eventRoleName(role) {
  const key = `ui.eventActors.roles.${role}`;
  const value = I18N.t(key);
  if (value && value !== key) return value;
  return I18N.t('ui.eventActors.roles.player');
}

function _eventActorLabel(player, side) {
  const ownerKey = `ui.eventActors.owners.${side === 'opp' ? 'opp' : 'my'}`;
  const owner = I18N.t(ownerKey);
  if (!player) return I18N.format(I18N.t('ui.eventActors.format'), {
    owner,
    role: I18N.t('ui.eventActors.roles.player'),
    name: ''
  }).trim();
  return I18N.format(I18N.t('ui.eventActors.format'), {
    owner,
    role: _eventRoleName(player.role),
    name: player.name
  });
}

const SITUATIVE_EVENTS = [
  {
    id: 'striker_frustrated',
    category: 'player',
    priority: 8,
    window: [3, 5],
    fireChance: 0.70,
    condition(match) {
      if (!match.squad || !match.memory) return false;
      const st = match.squad.find(p => p.role === 'ST');
      if (!st) return false;
      const mem = match.memory.myPlayerStates?.[st.id];
      if (!mem) return false;
      return (mem.consecutiveMisses || 0) >= 2;
    },
    resolveContext(match) {
      const st = match.squad.find(p => p.role === 'ST');
      const mem = match.memory.myPlayerStates?.[st.id] || {};
      return {
        eventPlayer: st,
        streakCount: mem.consecutiveMisses || 0,
        reason: I18N.t('ui.eventReasons.strikerMisses', {
          name: _eventActorLabel(st, 'my'),
          n: mem.consecutiveMisses || 0
        })
      };
    },
    options: [
      {
        id: 'layoff_pm',
        apply(match, ctx) {
          match._nextAttackVisionMode = true;
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventStrikerLayoff', { name: ctx.eventPlayer?.name || '' }));
        }
      },
      {
        id: 'push_through',
        apply(match, ctx) {
          const p = ctx.eventPlayer;
          if (!p) return;
          match._nextAttackPushThrough = true;
          match._nextAttackPushPlayer = p.id;
          if (match.memory.myPlayerStates[p.id]) {
            match.memory.myPlayerStates[p.id].pushPending = true;
          }
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventStrikerPush', { name: p.name }));
        }
      },
      {
        id: 'swap_off',
        condition(match, ctx) {
          const bench = (typeof getBench === 'function') ? getBench() : [];
          return bench.some(b => b.role === 'ST' || b.role === 'LF');
        },
        apply(match, ctx) {
          const bench = (typeof getBench === 'function') ? getBench() : [];
          const incoming = bench.find(b => b.role === 'ST') || bench.find(b => b.role === 'LF');
          const outgoing = ctx.eventPlayer;
          if (!incoming || !outgoing) return;
          const idx = match.squad.indexOf(outgoing);
          if (idx >= 0) match.squad[idx] = incoming;
          if (window.getState) {
            const st = window.getState();
            if (st?.lineupIds) {
              const li = st.lineupIds.indexOf(outgoing.id);
              if (li >= 0) st.lineupIds[li] = incoming.id;
            }
          }
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventStrikerSwap', { out: outgoing.name, in: incoming.name }));
        }
      }
    ]
  },

  {
    id: 'keeper_in_zone',
    category: 'player',
    priority: 7,
    window: [3, 6],
    fireChance: 0.75,
    condition(match) {
      if (!match.squad || !match.memory) return false;
      const tw = match.squad.find(p => p.role === 'TW');
      if (!tw) return false;
      const mem = match.memory.myPlayerStates?.[tw.id];
      if (!mem) return false;
      return (mem.savesInRow || 0) >= 3;
    },
    resolveContext(match) {
      const tw = match.squad.find(p => p.role === 'TW');
      const mem = match.memory.myPlayerStates?.[tw.id] || {};
      return {
        eventPlayer: tw,
        streakCount: mem.savesInRow || 0,
        reason: I18N.t('ui.eventReasons.keeperSaves', {
          name: _eventActorLabel(tw, 'my'),
          n: mem.savesInRow || 0
        })
      };
    },
    options: [
      {
        id: 'launch_counter',
        apply(match, ctx) {
          match._eventImmediateAttack = true;
          match._eventImmediateAttackBonus = 0.22;
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventKeeperLaunch', { name: ctx.eventPlayer?.name || '' }));
        }
      },
      {
        id: 'stay_solid',
        apply(match, ctx) {
          match.nextSaveBonus = (match.nextSaveBonus || 0) + 0.12;
          match._keeperZoneBonus = 0.08;
          match._keeperZoneRounds = Math.max(1, 6 - match.round + 1);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventKeeperSolid', { name: ctx.eventPlayer?.name || '' }));
        }
      }
    ]
  },

  {
    id: 'opp_striker_frustrated',
    category: 'opp',
    priority: 6,
    window: [3, 6],
    fireChance: 0.65,
    condition(match) {
      if (!match.opp?.lineup || !match.memory) return false;
      const oppST = match.opp.lineup.find(p => p.role === 'ST');
      if (!oppST) return false;
      const mem = match.memory.oppPlayerStates?.[oppST.id];
      if (!mem) return false;
      return (mem.consecutiveMisses || 0) >= 2;
    },
    resolveContext(match) {
      const oppST = match.opp.lineup.find(p => p.role === 'ST');
      const mem = match.memory.oppPlayerStates?.[oppST.id] || {};
      return {
        oppPlayer: oppST,
        streakCount: mem.consecutiveMisses || 0,
        reason: I18N.t('ui.eventReasons.oppStrikerMisses', {
          name: _eventActorLabel(oppST, 'opp'),
          n: mem.consecutiveMisses || 0
        })
      };
    },
    options: [
      {
        id: 'press_high',
        apply(match, ctx) {
          match._oppStrikerMalus = 0.18;
          match._oppStrikerMalusRounds = 2;
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventOppStrikerPress', { name: ctx.oppPlayer?.name || '' }));
        }
      },
      {
        id: 'guard_desperate',
        apply(match, ctx) {
          match.nextSaveBonus = (match.nextSaveBonus || 0) + 0.20;
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventOppStrikerGuard', { name: ctx.oppPlayer?.name || '' }));
        }
      }
    ]
  },

  {
    id: 'momentum_shift',
    category: 'match_state',
    priority: 9,
    window: [3, 6],
    fireChance: 0.80,
    condition(match) {
      if (!match.memory) return false;
      return (match.memory.consecutiveConceded || 0) >= 2;
    },
    resolveContext(match) {
      return {
        conceded: match.memory.consecutiveConceded || 0,
        reason: I18N.t('ui.eventReasons.momentumShift', { n: match.memory.consecutiveConceded || 0 })
      };
    },
    options: [
      {
        id: 'timeout',
        apply(match) {
          const range = [match.round, 6];
          match.buffLayers.push({ source: 'event_momentum_timeout', range, stats: { composure: 12, defense: 6 }, special: null });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventMomentumTimeout'));
        }
      },
      {
        id: 'switch_tactic',
        apply(match) {
          const range = [match.round, 6];
          match.buffLayers.push({ source: 'event_momentum_switch', range, stats: { defense: 14, tempo: 8, offense: -4 }, special: null });
          match.autoCounterRoundsLeft = Math.max(match.autoCounterRoundsLeft, 2);
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventMomentumSwitch'));
        }
      }
    ]
  },

  {
    id: 'hot_corridor',
    category: 'player',
    priority: 5,
    window: [2, 5],
    fireChance: 0.60,
    condition(match) {
      if (!match.memory || !match.squad) return false;
      const lf = match.squad.find(p => p.role === 'LF');
      if (!lf) return false;
      return (match.memory.flankStreak || 0) >= 2 && match.memory.hotFlank === 'mine';
    },
    resolveContext(match) {
      const lf = match.squad.find(p => p.role === 'LF');
      return {
        eventPlayer: lf,
        streakCount: match.memory.flankStreak || 0,
        reason: I18N.t('ui.eventReasons.hotCorridor', {
          name: lf ? _eventActorLabel(lf, 'my') : 'your winger'
        })
      };
    },
    options: [
      {
        id: 'double_down',
        apply(match, ctx) {
          match.flankRoundsLeft = Math.max(match.flankRoundsLeft, 2);
          match._eventImmediateAttack = true;
          match._eventImmediateAttackBonus = 0.15;
          match._eventImmediateAttackForceScorer = 'LF';
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventCorridorDouble', { name: ctx.eventPlayer?.name || '' }));
        }
      },
      {
        id: 'switch_center',
        apply(match) {
          const range = [match.round, Math.min(6, match.round + 2)];
          match.buffLayers.push({ source: 'event_corridor_switch', range, stats: { vision: 14, offense: 6 }, special: null });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventCorridorSwitch'));
        }
      }
    ]
  },

  {
    id: 'opp_pm_dirigent',
    category: 'opp',
    priority: 6,
    window: [3, 5],
    fireChance: 0.65,
    condition(match) {
      if (!match.opp?.lineup || !match.memory) return false;
      const oppPM = match.opp.lineup.find(p => p.role === 'PM');
      if (!oppPM) return false;
      const mem = match.memory.oppPlayerStates?.[oppPM.id];
      if (!mem) return false;
      return (mem.okBuildupsInRow || 0) >= 3;
    },
    resolveContext(match) {
      const oppPM = match.opp.lineup.find(p => p.role === 'PM');
      const mem = match.memory.oppPlayerStates?.[oppPM.id] || {};
      return {
        oppPlayer: oppPM,
        streakCount: mem.okBuildupsInRow || 0,
        reason: I18N.t('ui.eventReasons.oppPmDirigent', {
          name: _eventActorLabel(oppPM, 'opp'),
          n: mem.okBuildupsInRow || 0
        })
      };
    },
    options: [
      {
        id: 'push_vt_high',
        apply(match, ctx) {
          match._oppBuildupPenalty = 0.18;
          match._oppBuildupPenaltyRounds = 2;
          const range = [match.round, Math.min(6, match.round + 1)];
          match.buffLayers.push({ source: 'event_pm_push_vt', range, stats: { defense: -6 }, special: null });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventOppPmHigh', { name: ctx.oppPlayer?.name || '' }));
        }
      },
      {
        id: 'double_mark',
        apply(match, ctx) {
          match._oppBuildupPenalty = 0.25;
          match._oppBuildupPenaltyRounds = 3;
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventOppPmMark', { name: ctx.oppPlayer?.name || '' }));
        }
      },
      {
        id: 'bait_counter',
        apply(match) {
          match.autoCounterRoundsLeft = Math.max(match.autoCounterRoundsLeft, 2);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventOppPmBait'));
        }
      }
    ]
  },

  {
    id: 'hitziger_moment',
    category: 'match_state',
    priority: 7,
    window: [3, 5],
    fireChance: 0.55,
    condition(match) {
      if (!match.memory) return false;
      const recentConcede = (match.memory.consecutiveConceded || 0) >= 1 ||
                             (match.memory.lastRoundConceded === match.round - 1);
      return recentConcede;
    },
    resolveContext(match) {
      const candidates = (match.squad || []).filter(p => p.role !== 'TW');
      const target = candidates.sort((a, b) => (b.stats.tempo || 0) - (a.stats.tempo || 0))[0];
      return {
        eventPlayer: target,
        reason: I18N.t('ui.eventReasons.hitzigerMoment')
      };
    },
    options: [
      {
        id: 'captain_calm',
        apply(match) {
          const range = [match.round, 6];
          match.buffLayers.push({ source: 'event_hitzig_calm', range, stats: { composure: 10 }, special: null });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventHitzigCalm'));
        }
      },
      {
        id: 'go_harder',
        apply(match, ctx) {
          const p = ctx.eventPlayer;
          if (!p) return;
          const range = [match.round, Math.min(6, match.round + 1)];
          match.buffLayers.push({ source: 'event_hitzig_hard', range, stats: { defense: 10, tempo: 5 }, special: null });
          recomputeTeamBuffs(match);

          match.memory.yellowCards = match.memory.yellowCards || {};
          const existing = match.memory.yellowCards[p.id] || 0;

          const roll = rand();
          let outcome;
          if (roll < 0.18) outcome = 'red';
          else if (roll < 0.55) outcome = 'yellow';
          else outcome = 'clean';

          match._triggerLogBuffer = match._triggerLogBuffer || [];

          if (outcome === 'red') {
            match.memory.redCards = match.memory.redCards || new Set();
            match.memory.redCards.add(p.id);
            match.memory.yellowCards[p.id] = existing;
            p._suspendedUntil = (window.state?.matchNumber || 0) + 2;
            match._triggerLogBuffer.push(I18N.t('ui.log.eventHitzigRed', { name: p.name }));
            match._pendingCardLog = { type: 'red', playerId: p.id, name: p.name };
          } else if (outcome === 'yellow') {
            const newCount = existing + 1;
            match.memory.yellowCards[p.id] = newCount;
            if (newCount >= 2) {
              match.memory.redCards = match.memory.redCards || new Set();
              match.memory.redCards.add(p.id);
              p._suspendedUntil = (window.state?.matchNumber || 0) + 2;
              match._triggerLogBuffer.push(I18N.t('ui.log.eventHitzigSecondYellow', { name: p.name }));
              match._pendingCardLog = { type: 'red', playerId: p.id, name: p.name };
            } else {
              match._triggerLogBuffer.push(I18N.t('ui.log.eventHitzigYellow', { name: p.name }));
              match._pendingCardLog = { type: 'yellow', playerId: p.id, name: p.name };
            }
          } else {
            match._triggerLogBuffer.push(I18N.t('ui.log.eventHitzigClean', { name: p.name }));
          }
        }
      },
      {
        id: 'ignore',
        apply(match) {
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventHitzigIgnore'));
        }
      }
    ]
  },

  {
    id: 'freier_mann',
    category: 'tactical',
    priority: 7,
    window: [2, 4],
    fireChance: 0.55,
    condition(match) {
      if (!match.opp?.lineup || !match.memory || !match.squad) return false;
      const ourVT = match.squad.find(p => p.role === 'VT');
      if (!ourVT) return false;
      const vtMem = match.memory.myPlayerStates?.[ourVT.id];
      if (!vtMem) return false;
      const underPressure = (match.memory.oppAttackDrought || 0) === 0 &&
                            (match.stats?.oppShots || 0) >= 2;
      return underPressure && (match.opp.stats.tempo > match.squad.find(p => p.role === 'VT')?.stats.defense - 5);
    },
    resolveContext(match) {
      const oppLF = match.opp.lineup.find(p => p.role === 'LF') || match.opp.lineup.find(p => p.role === 'ST');
      return {
        oppPlayer: oppLF,
        reason: I18N.t('ui.eventReasons.freierMann', {
          name: oppLF ? _eventActorLabel(oppLF, 'opp') : 'their runner'
        })
      };
    },
    options: [
      {
        id: 'foul_stop',
        apply(match, ctx) {
          const vt = match.squad.find(p => p.role === 'VT');
          if (!vt) return;
          match.memory.yellowCards = match.memory.yellowCards || {};
          const existing = match.memory.yellowCards[vt.id] || 0;
          const newCount = existing + 1;
          match.memory.yellowCards[vt.id] = newCount;

          match._triggerLogBuffer = match._triggerLogBuffer || [];
          if (newCount >= 2) {
            match.memory.redCards = match.memory.redCards || new Set();
            match.memory.redCards.add(vt.id);
            vt._suspendedUntil = (window.state?.matchNumber || 0) + 2;
            match._triggerLogBuffer.push(I18N.t('ui.log.eventFreierFoulRed', { name: vt.name }));
            match._pendingCardLog = { type: 'red', playerId: vt.id, name: vt.name };
          } else {
            match._triggerLogBuffer.push(I18N.t('ui.log.eventFreierFoul', { name: vt.name }));
            match._pendingCardLog = { type: 'yellow', playerId: vt.id, name: vt.name };
          }
          match._oppAttackCancel = true;
        }
      },
      {
        id: 'retreat',
        apply(match) {
          match._oppShotMalus = 0.15;
          match._oppShotMalusRounds = 1;
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventFreierRetreat'));
        }
      },
      {
        id: 'keeper_out',
        apply(match, ctx) {
          const tw = match.squad.find(p => p.role === 'TW');
          if (!tw) return;
          const roll = rand();
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          if (roll < 0.50) {
            match._oppAttackCancel = true;
            match._triggerLogBuffer.push(I18N.t('ui.log.eventFreierKeeperWin', { name: tw.name }));
          } else {
            match._eventForceOppGoal = true;
            match._triggerLogBuffer.push(I18N.t('ui.log.eventFreierKeeperLose', { name: tw.name, opp: ctx.oppPlayer?.name || 'runner' }));
          }
        }
      }
    ]
  },

  {
    id: 'clear_chance',
    category: 'match_state',
    priority: 6,
    window: [2, 5],
    fireChance: 0.60,
    condition(match) {
      if (!match.squad || !match.memory) return false;
      const st = match.squad.find(p => p.role === 'ST');
      if (!st) return false;
      const mem = match.memory.myPlayerStates?.[st.id];
      if (!mem) return false;
      const confidence = (mem.confidence || 0);
      const hadRecentBuildup = (mem.okBuildupsInRow || 0) >= 1 || (match.stats?.myBuildupsSuccess || 0) >= 2;
      return confidence >= 1 && hadRecentBuildup;
    },
    resolveContext(match) {
      const st = match.squad.find(p => p.role === 'ST');
      const pm = match.squad.find(p => p.role === 'PM');
      const lf = match.squad.find(p => p.role === 'LF');
      return {
        eventPlayer: st,
        pmPlayer: pm,
        lfPlayer: lf,
        reason: I18N.t('ui.eventReasons.clearChance', {
          name: st ? _eventActorLabel(st, 'my') : 'your striker'
        })
      };
    },
    options: [
      {
        id: 'place_flat',
        apply(match, ctx) {
          match._eventImmediateAttack = true;
          match._eventImmediateAttackBonus = 0.18;
          match._eventImmediateAttackForceScorer = 'ST';
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventClearFlat', { name: ctx.eventPlayer?.name || '' }));
        }
      },
      {
        id: 'chip_keeper',
        apply(match, ctx) {
          const st = ctx.eventPlayer;
          const composure = st?.stats?.composure || 50;
          const bonus = composure > 70 ? 0.30 : (composure > 55 ? 0.15 : -0.10);
          match._eventImmediateAttack = true;
          match._eventImmediateAttackBonus = bonus;
          match._eventImmediateAttackForceScorer = 'ST';
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventClearChip', { name: st?.name || '' }));
        }
      },
      {
        id: 'square_lf',
        condition(match, ctx) {
          return !!ctx.lfPlayer;
        },
        apply(match, ctx) {
          match._eventImmediateAttack = true;
          match._eventImmediateAttackBonus = 0.22;
          match._eventImmediateAttackForceScorer = 'LF';
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventClearSquare', { st: ctx.eventPlayer?.name || '', lf: ctx.lfPlayer?.name || '' }));
        }
      }
    ]
  },

  {
    id: 'taktikwechsel_opp',
    category: 'opp',
    priority: 5,
    window: [4, 4],
    fireChance: 0.55,
    condition(match) {
      if (!match.stats) return false;
      const rate = match.stats.oppBuildups ? match.stats.oppBuildupsSuccess / match.stats.oppBuildups : 1;
      return rate < 0.55;
    },
    resolveContext(match) {
      return {
        oppName: match.opp?.name || 'Opponent',
        reason: I18N.t('ui.eventReasons.taktikwechsel', { opp: match.opp?.name || 'Opponent' })
      };
    },
    options: [
      {
        id: 'long_balls',
        apply(match) {
          const range = [match.round, 6];
          match.buffLayers.push({ source: 'event_taktik_long', range, stats: { offense: 14, vision: -6 }, special: null });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventTaktikLong'));
        }
      },
      {
        id: 'hold_possession',
        apply(match) {
          const range = [match.round, 6];
          match.buffLayers.push({ source: 'event_taktik_hold', range, stats: { vision: 14, composure: 8 }, special: null });
          match.possessionActive = true;
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventTaktikHold'));
        }
      },
      {
        id: 'match_aggression',
        apply(match) {
          const range = [match.round, 6];
          match.buffLayers.push({ source: 'event_taktik_match', range, stats: { tempo: 12, defense: 8, composure: -4 }, special: null });
          match.pressingRoundsLeft = Math.max(match.pressingRoundsLeft, 2);
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventTaktikMatch'));
        }
      }
    ]
  },

  {
    id: 'legendary_demand',
    category: 'tactical',
    priority: 4,
    window: [3, 5],
    fireChance: 0.60,
    condition(match, state) {
      if (!state) return false;
      const bench = (typeof getBench === 'function') ? getBench() : [];
      return bench.some(p => p.isLegendary && (!p._suspendedUntil || p._suspendedUntil <= state.matchNumber));
    },
    resolveContext(match, state) {
      const bench = (typeof getBench === 'function') ? getBench() : [];
      const leg = bench.find(p => p.isLegendary && (!p._suspendedUntil || p._suspendedUntil <= state.matchNumber));
      return {
        legendaryPlayer: leg,
        reason: I18N.t('ui.eventReasons.legendaryDemand', {
          name: leg ? _eventActorLabel(leg, 'my') : 'your legendary player'
        })
      };
    },
    options: [
      {
        id: 'bring_on',
        apply(match, ctx) {
          const incoming = ctx.legendaryPlayer || ctx.eventPlayer;
          if (!incoming) return;
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
          const idx = currentSquad.indexOf(outgoing);
          if (idx >= 0) currentSquad[idx] = incoming;
          if (window.getState) {
            const st = window.getState();
            if (st?.lineupIds) {
              const li = st.lineupIds.indexOf(outgoing.id);
              if (li >= 0) st.lineupIds[li] = incoming.id;
            }
          }
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventLegendaryBringOn', { name: incoming.name }));
        }
      },
      {
        id: 'morale',
        apply(match) {
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
    id: 'playmaker_pulse',
    category: 'player',
    priority: 6,
    window: [3, 6],
    fireChance: 0.58,
    condition(match) {
      if (!match.squad || !match.memory) return false;
      const pm = match.squad.find(p => p.role === 'PM');
      if (!pm) return false;
      const mem = match.memory.myPlayerStates?.[pm.id];
      return !!mem && (mem.okBuildupsInRow || 0) >= 2;
    },
    resolveContext(match) {
      const pm = match.squad.find(p => p.role === 'PM');
      const mem = match.memory.myPlayerStates?.[pm.id] || {};
      return {
        eventPlayer: pm,
        streakCount: mem.okBuildupsInRow || 0,
        reason: I18N.t('ui.eventReasons.playmakerPulse', {
          name: pm ? _eventActorLabel(pm, 'my') : _eventActorLabel(null, 'my'),
          n: mem.okBuildupsInRow || 0
        })
      };
    },
    options: [
      {
        id: 'release_runner',
        apply(match, ctx) {
          match._eventImmediateAttack = true;
          match._eventImmediateAttackBonus = 0.16;
          match._eventImmediateAttackForceScorer = 'LF';
          match._nextAttackVisionMode = true;
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventPlaymakerRelease', { name: ctx.eventPlayer?.name || '' }));
        }
      },
      {
        id: 'dictate_tempo',
        apply(match, ctx) {
          match.possessionActive = true;
          match.buffLayers.push({
            source: 'event_playmaker_dictate',
            range: [match.round, 6],
            stats: { vision: 12, composure: 8 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventPlaymakerDictate', { name: ctx.eventPlayer?.name || '' }));
        }
      },
      {
        id: 'thread_risk',
        apply(match, ctx) {
          match.nextBuildupBonus = (match.nextBuildupBonus || 0) + 0.18;
          // Die ehemalige PM-Personal-Bonus-Logik (_focusBuildupBonus/
          // PlayerId/UntilRound) wurde im Focus-Removal-Pass aus der
          // Engine entfernt — Werte zu setzen war toter Code. Der
          // nextBuildupBonus reicht als Effekt.
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventPlaymakerThread', { name: ctx.eventPlayer?.name || '' }));
        }
      }
    ]
  },

  {
    id: 'opp_keeper_rattled',
    category: 'opp',
    priority: 5,
    window: [3, 6],
    fireChance: 0.54,
    condition(match) {
      if (!match.opp?.lineup || !match.memory) return false;
      const oppTW = match.opp.lineup.find(p => p.role === 'TW');
      if (!oppTW) return false;
      const mem = match.memory.oppPlayerStates?.[oppTW.id];
      return !!mem && (((mem.concededInRow || 0) >= 1 && (match.stats?.myShotsOnTarget || 0) >= 2)
        || (match.memory.consecutiveScored || 0) >= 2);
    },
    resolveContext(match) {
      const oppTW = match.opp.lineup.find(p => p.role === 'TW');
      const mem = match.memory.oppPlayerStates?.[oppTW.id] || {};
      return {
        oppPlayer: oppTW,
        streakCount: mem.concededInRow || 0,
        reason: I18N.t('ui.eventReasons.oppKeeperRattled', {
          name: oppTW ? _eventActorLabel(oppTW, 'opp') : _eventActorLabel(null, 'opp')
        })
      };
    },
    options: [
      {
        id: 'shoot_early',
        apply(match, ctx) {
          match._oppKeeperRattledBonus = Math.max(match._oppKeeperRattledBonus || 0, 0.14);
          match._oppKeeperRattledUntilRound = Math.max(match._oppKeeperRattledUntilRound || 0, Math.min(6, match.round + 1));
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventOppKeeperTarget', { name: ctx.oppPlayer?.name || '' }));
        }
      },
      {
        id: 'crash_box',
        apply(match) {
          match.buffLayers.push({
            source: 'event_crash_box',
            range: [match.round, Math.min(6, match.round + 1)],
            stats: { offense: 10, tempo: 10 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventCrashBox'));
        }
      },
      {
        id: 'reset_probe',
        apply(match) {
          match.nextBuildupBonus = (match.nextBuildupBonus || 0) + 0.12;
          match._nextAttackVisionMode = true;
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventResetProbe'));
        }
      }
    ]
  },

  {
    id: 'backline_step_up',
    category: 'opp',
    priority: 5,
    window: [3, 6],
    fireChance: 0.56,
    condition(match) {
      if (!match.squad) return false;
      const vt = match.squad.find(p => p.role === 'VT');
      if (!vt) return false;
      const ms = vt._matchStats || {};
      return (ms.defendedAttacks || 0) >= 2 || ((match.stats?.oppBuildups || 0) >= 2 && (match.stats?.oppBuildupsSuccess || 0) <= 1);
    },
    resolveContext(match) {
      const vt = match.squad.find(p => p.role === 'VT');
      const ms = vt?._matchStats || {};
      return {
        eventPlayer: vt,
        reason: I18N.t('ui.eventReasons.backlineStepUp', {
          name: vt ? _eventActorLabel(vt, 'my') : _eventActorLabel(null, 'my'),
          n: ms.defendedAttacks || 0
        })
      };
    },
    options: [
      {
        id: 'step_in',
        apply(match, ctx) {
          match.nextBuildupBonus = (match.nextBuildupBonus || 0) + 0.16;
          match.buffLayers.push({
            source: 'event_backline_step_in',
            range: [match.round, Math.min(6, match.round + 1)],
            stats: { defense: 6, tempo: 6 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventBacklineStepIn', { name: ctx.eventPlayer?.name || '' }));
        }
      },
      {
        id: 'hold_shape',
        apply(match) {
          match._oppShotMalus = Math.max(match._oppShotMalus || 0, 0.12);
          match._oppShotMalusRounds = Math.max(match._oppShotMalusRounds || 0, 2);
          match.buffLayers.push({
            source: 'event_backline_hold',
            range: [match.round, 6],
            stats: { defense: 8, composure: 8 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventBacklineHold'));
        }
      },
      {
        id: 'spring_trap',
        apply(match) {
          match.autoCounterRoundsLeft = Math.max(match.autoCounterRoundsLeft, 2);
          match._oppBuildupPenalty = Math.max(match._oppBuildupPenalty || 0, 0.12);
          match._oppBuildupPenaltyRounds = Math.max(match._oppBuildupPenaltyRounds || 0, 2);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventBacklineTrap'));
        }
      }
    ]
  },

  // ─── NEW EVENTS ───────────────────────────────────────────────────────────

  // Tight match, physical battle brewing — player tempted to go in hard.
  {
    id: 'red_card_risk',
    category: 'match_state',
    priority: 7,
    window: [2, 5],
    fireChance: 0.55,
    condition(match) {
      if (!match.squad || !match.memory) return false;
      // Trigger when it's close, and a VT has already blocked multiple attacks
      // (= playing on the edge)
      const vt = match.squad.find(p => p.role === 'VT');
      if (!vt) return false;
      const ms = vt._matchStats || {};
      const close = Math.abs((match.scoreMe || 0) - (match.scoreOpp || 0)) <= 1;
      return close && (ms.defendedAttacks || 0) >= 2;
    },
    resolveContext(match) {
      const vt = match.squad.find(p => p.role === 'VT');
      return {
        eventPlayer: vt,
        reason: I18N.t('ui.eventReasons.redCardRisk', {
          name: vt ? _eventActorLabel(vt, 'my') : _eventActorLabel(null, 'my')
        })
      };
    },
    options: [
      {
        id: 'play_hard',
        apply(match, ctx) {
          const p = ctx.eventPlayer;
          if (!p) return;
          // Strong defensive boost, but 25% chance of yellow card
          match.buffLayers.push({
            source: 'event_redcard_hard',
            range: [match.round, 6],
            stats: { defense: 14, tempo: 6 },
            special: null
          });
          if (rand() < 0.25) {
            match.memory.yellowCards = match.memory.yellowCards || {};
            match.memory.yellowCards[p.id] = (match.memory.yellowCards[p.id] || 0) + 1;
            match._triggerLogBuffer = match._triggerLogBuffer || [];
            match._triggerLogBuffer.push(I18N.t('ui.log.eventPlayHardYellow', { name: p.name }));
          } else {
            match._triggerLogBuffer = match._triggerLogBuffer || [];
            match._triggerLogBuffer.push(I18N.t('ui.log.eventPlayHardClean', { name: p.name }));
          }
          recomputeTeamBuffs(match);
        }
      },
      {
        id: 'play_clean',
        apply(match, ctx) {
          match.buffLayers.push({
            source: 'event_redcard_clean',
            range: [match.round, 6],
            stats: { composure: 10, defense: 5 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventPlayClean', { name: ctx.eventPlayer?.name || '' }));
        }
      },
      {
        id: 'substitute_def',
        condition(match) {
          const bench = (typeof getBench === 'function') ? getBench() : [];
          return bench.some(p => p.role === 'VT');
        },
        apply(match, ctx) {
          const bench = (typeof getBench === 'function') ? getBench() : [];
          const replacement = bench.find(p => p.role === 'VT');
          if (!replacement || !ctx.eventPlayer) return;
          // Rotate fresh VT in
          const idx = match.squad.findIndex(p => p.id === ctx.eventPlayer.id);
          if (idx >= 0) {
            match.squad[idx] = replacement;
            replacement._matchStats = { shots: 0, shotsOnTarget: 0, goals: 0, buildups: 0, buildupsOk: 0, saves: 0, goalsConceded: 0, defendedAttacks: 0, counters: 0 };
          }
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventSubDefender', { out: ctx.eventPlayer.name, in: replacement.name }));
        }
      }
    ]
  },

  // Weather shift — random mid-match atmospheric change
  {
    id: 'weather_shift',
    category: 'external',
    priority: 4,
    window: [2, 5],
    fireChance: 0.30,
    condition() { return true; }, // Always a chance, but low fire chance
    resolveContext(match) {
      const kinds = ['rain', 'wind', 'heat'];
      const kind = kinds[Math.floor(rand() * kinds.length)];
      return {
        weatherKind: kind,
        reason: I18N.t('ui.eventReasons.weather' + (kind.charAt(0).toUpperCase() + kind.slice(1)))
      };
    },
    options: [
      {
        id: 'adapt_tempo',
        apply(match, ctx) {
          // Adapt to conditions — tempo-based approach
          const kind = ctx.weatherKind;
          const stats = kind === 'rain' ? { tempo: -6, defense: 10, composure: 8 }
                      : kind === 'wind' ? { vision: -4, tempo: 8, composure: 6 }
                      : { tempo: -8, composure: 12, defense: 6 }; // heat
          match.buffLayers.push({
            source: 'event_weather_adapt',
            range: [match.round, 6],
            stats,
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventWeatherAdapt'));
        }
      },
      {
        id: 'push_through_weather',
        apply(match) {
          // Ignore conditions, push attack
          match.buffLayers.push({
            source: 'event_weather_push',
            range: [match.round, 6],
            stats: { offense: 12, tempo: 8, composure: -6 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventWeatherPush'));
        }
      }
    ]
  },

  // Fan revolt — happens when things are going badly at home
  {
    id: 'fan_revolt',
    category: 'external',
    priority: 6,
    window: [3, 5],
    fireChance: 0.50,
    condition(match) {
      // Trigger when losing and conceded 2+ goals
      return (match.scoreOpp || 0) >= 2 && (match.scoreOpp || 0) > (match.scoreMe || 0);
    },
    resolveContext(match) {
      return {
        reason: I18N.t('ui.eventReasons.fanRevolt', {
          me: match.scoreMe || 0,
          opp: match.scoreOpp || 0
        })
      };
    },
    options: [
      {
        id: 'rally_crowd',
        apply(match) {
          // Use fans as fuel
          match.buffLayers.push({
            source: 'event_fan_rally',
            range: [match.round, 6],
            stats: { offense: 14, tempo: 8, composure: -4 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventFanRally'));
        }
      },
      {
        id: 'ignore_noise',
        apply(match) {
          // Tune them out, focus in
          match.buffLayers.push({
            source: 'event_fan_ignore',
            range: [match.round, 6],
            stats: { composure: 16, vision: 8 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventFanIgnore'));
        }
      }
    ]
  },

  // Opponent's star player injured — capitalize or not
  {
    id: 'opp_star_down',
    category: 'opp',
    priority: 8,
    window: [2, 5],
    fireChance: 0.40,
    condition(match) {
      // Trigger when opp has traits (star potential) and we've been pressing
      if (!match.opp?.traits?.length) return false;
      const myShots = match.stats?.myShots || 0;
      return myShots >= 3;
    },
    resolveContext(match) {
      // Pick the opp player holding the most valuable trait
      const holders = match.opp.traitHolders || {};
      const starTraits = ['sniper', 'clutch_opp', 'konter_opp'];
      let star = null;
      for (const tid of starTraits) {
        if (holders[tid]) { star = holders[tid]; break; }
      }
      if (!star && match.opp.lineup) {
        // Fallback: strongest opp player
        star = match.opp.lineup.reduce((best, p) => {
          const sum = Object.values(p.stats || {}).reduce((a,b) => a+b, 0);
          return !best || sum > (Object.values(best.stats || {}).reduce((a,b) => a+b, 0) || 0) ? p : best;
        }, null);
      }
      return {
        oppPlayer: star,
        reason: I18N.t('ui.eventReasons.oppStarDown', {
          name: star ? _eventActorLabel(star, 'opp') : _eventActorLabel(null, 'opp')
        })
      };
    },
    options: [
      {
        id: 'capitalize',
        apply(match) {
          // Press the advantage hard
          match.buffLayers.push({
            source: 'event_star_capitalize',
            range: [match.round, Math.min(6, match.round + 2)],
            stats: { offense: 18, tempo: 10, defense: -4 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventStarCapitalize'));
        }
      },
      {
        id: 'stay_disciplined',
        apply(match) {
          // Don't over-commit — they could regroup
          match.buffLayers.push({
            source: 'event_star_discipline',
            range: [match.round, 6],
            stats: { defense: 10, composure: 10, vision: 6 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventStarDiscipline'));
        }
      }
    ]
  },

  // Assistant coach suggests tactical shift
  {
    id: 'coach_whisper',
    category: 'external',
    priority: 5,
    window: [3, 5],
    fireChance: 0.40,
    condition(match) {
      // When the game is tight and we've had a few rounds of data
      return (match.round || 0) >= 3 && Math.abs((match.scoreMe || 0) - (match.scoreOpp || 0)) <= 1;
    },
    resolveContext(match) {
      const s = match.stats || {};
      const myBuildupRate = s.myBuildups ? Math.round(s.myBuildupsSuccess / s.myBuildups * 100) : 50;
      const suggestion = myBuildupRate < 50 ? 'direct' : 'patient';
      return {
        suggestion,
        reason: I18N.t('ui.eventReasons.coachWhisper' + (suggestion === 'direct' ? 'Direct' : 'Patient'))
      };
    },
    options: [
      {
        id: 'trust_coach',
        apply(match, ctx) {
          const sug = ctx.suggestion;
          const stats = sug === 'direct'
            ? { offense: 12, tempo: 10, vision: -4 }
            : { vision: 14, composure: 8, tempo: -4 };
          match.buffLayers.push({
            source: 'event_coach_trust',
            range: [match.round, 6],
            stats,
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventCoachTrust'));
        }
      },
      {
        id: 'trust_instinct',
        apply(match) {
          // Go with your gut — modest but balanced boost
          match.buffLayers.push({
            source: 'event_coach_instinct',
            range: [match.round, 6],
            stats: { offense: 8, defense: 8, composure: 8 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventCoachInstinct'));
        }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────
  // NEW situations (category-aware expansion). Keep the same schema as
  // above: id, category, priority, window, fireChance, condition,
  // resolveContext → { reason, ... ctx }, options[] with apply(match, ctx).
  // ─────────────────────────────────────────────────────────────────────

  // 1. Set piece awarded — foul deep in enemy half, delivery style choice.
  {
    id: 'set_piece_awarded',
    category: 'match_state',
    priority: 5,
    window: [2, 5],
    fireChance: 0.35,
    condition(match) {
      // Only if we're not already buried by 2+ goals — otherwise pointless.
      return (match.scoreOpp - match.scoreMe) < 2;
    },
    resolveContext() {
      return {
        reason: I18N.t('ui.eventReasons.setPieceAwarded')
      };
    },
    options: [
      {
        id: 'quick_surprise',
        apply(match) {
          // Quick short pass — immediate attack with tempo bonus. Caught out
          // of shape, higher chance but also lower forced-scorer specificity.
          match._eventImmediateAttack = true;
          match._eventImmediateAttackBonus = 0.24;
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventSetPieceQuick'));
        }
      },
      {
        id: 'delivery_focus',
        apply(match) {
          // Controlled delivery — buildup bonus next round + team composure.
          match.nextBuildupBonus = (match.nextBuildupBonus || 0) + 0.14;
          match.buffLayers.push({
            source: 'event_set_piece_focus',
            range: [match.round, Math.min(6, match.round + 1)],
            stats: { composure: 6, vision: 6 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventSetPieceDelivery'));
        }
      }
    ]
  },

  // 2. Legs gone — late-match fatigue for teams that ran hard early.
  {
    id: 'legs_gone',
    category: 'match_state',
    priority: 6,
    window: [5, 6],
    fireChance: 0.45,
    condition(match) {
      // Fires if we've been aggressive/pressing in R1-4 (fatigue proxy: tempo
      // buffs accumulated or pressingRoundsLeft was used).
      const usedPressing = (match._htPressingBlocks || 0) >= 1
                        || (match.pressingRoundsLeft > 0 && match.round >= 4);
      const usedTempo = (match.teamBuffs?.tempo || 0) >= 12;
      return usedPressing || usedTempo;
    },
    resolveContext() {
      return {
        reason: I18N.t('ui.eventReasons.legsGone')
      };
    },
    options: [
      {
        id: 'push_anyway',
        apply(match) {
          // Push through — small tempo bonus, composure penalty.
          match.buffLayers.push({
            source: 'event_legs_push',
            range: [match.round, 6],
            stats: { tempo: 6, composure: -8, offense: 4 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventLegsPush'));
        }
      },
      {
        id: 'manage_rhythm',
        apply(match) {
          // Drop tempo, preserve defense and composure.
          match.buffLayers.push({
            source: 'event_legs_manage',
            range: [match.round, 6],
            stats: { tempo: -6, defense: 8, composure: 10 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventLegsManage'));
        }
      }
    ]
  },

  // 3. Tactical clash — your active tactic directly counters enemy strength.
  {
    id: 'tactical_clash',
    category: 'tactical',
    priority: 6,
    window: [2, 5],
    fireChance: 0.40,
    condition(match) {
      // Only when the ACTIVE tactic has a concrete tag and the opp has a
      // tag that clashes. Simple: if our tactic is pressing and opp has
      // high composure (>= 58), their composure naturally beats our press.
      const myTags = match.activeTacticTags || [];
      if (!myTags.length) return false;
      const oppComposure = match.opp?.stats?.composure || 50;
      if (myTags.includes('pressing') && oppComposure >= 58) return true;
      if (myTags.includes('ballbesitz') && (match.opp?.stats?.tempo || 0) >= 72) return true;
      return false;
    },
    resolveContext(match) {
      const myTags = match.activeTacticTags || [];
      const reasonKey = myTags.includes('pressing')
        ? 'tacticalClashPressing'
        : 'tacticalClashPossession';
      return {
        reason: I18N.t('ui.eventReasons.' + reasonKey),
        clashKind: myTags.includes('pressing') ? 'pressing' : 'possession'
      };
    },
    options: [
      {
        id: 'adapt',
        apply(match, ctx) {
          // Switch away from the clashing tactic — give up some offense,
          // gain defense + vision.
          match.buffLayers.push({
            source: 'event_clash_adapt',
            range: [match.round, 6],
            stats: { offense: -5, defense: 10, vision: 8 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventClashAdapt'));
        }
      },
      {
        id: 'double_down',
        apply(match, ctx) {
          // Commit harder — big boost to offense but exposed defensively.
          match.buffLayers.push({
            source: 'event_clash_commit',
            range: [match.round, 6],
            stats: { offense: 14, tempo: 6, defense: -8 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventClashCommit'));
        }
      }
    ]
  },

  // 4. Stern referee — card-happy ref, play-it-safe vs normal risk.
  {
    id: 'referee_stern',
    category: 'external',
    priority: 4,
    window: [2, 5],
    fireChance: 0.25,
    condition(match) {
      // Don't fire if we already have a suspended player / pending card.
      return !match._pendingCardLog;
    },
    resolveContext() {
      return {
        reason: I18N.t('ui.eventReasons.refereeStern')
      };
    },
    options: [
      {
        id: 'play_clean',
        apply(match) {
          // Less physical — composure up, tempo down, no card risk.
          match.buffLayers.push({
            source: 'event_ref_clean',
            range: [match.round, 6],
            stats: { composure: 10, tempo: -4 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventRefClean'));
        }
      },
      {
        id: 'normal_game',
        apply(match) {
          // Play normal but opp has -5 tempo too (they're also aware of ref).
          // No direct benefit; wash case narrative-only.
          match.opp._roundBuffs = match.opp._roundBuffs || {};
          match.opp._roundBuffs.tempo = (match.opp._roundBuffs.tempo || 0) - 5;
          match.buffLayers.push({
            source: 'event_ref_normal',
            range: [match.round, Math.min(6, match.round + 1)],
            stats: { tempo: -3 },
            special: null
          });
          recomputeTeamBuffs(match);
          match._triggerLogBuffer = match._triggerLogBuffer || [];
          match._triggerLogBuffer.push(I18N.t('ui.log.eventRefNormal'));
        }
      }
    ]
  }
];

// Focus-Funktionen wurden bewusst entfernt (siehe flow.js halftime-Block
// für Begründung): _buildFocusProfile, _applyFocusEffect, _focusCandidateScore
// plus generateFocusOptions und _describeFocusRoleEffects weiter unten.
// Die role.focusStat-Daten bleiben unberührt — das ist der PRIMÄR-Stat pro
// Rolle (ST→offense), wird an vielen Stellen im Engine/Intel gebraucht.

function _formatSignedDecisionValue(value) {
  const num = Number(value || 0);
  return num > 0 ? '+' + num : String(num);
}

function _shortDecisionStatLabel(stat) {
  const labels = {
    offense: 'OFF',
    defense: 'DEF',
    tempo: 'TEM',
    vision: 'VIS',
    composure: 'COM'
  };
  return labels[stat] || String(stat || '').toUpperCase();
}

function _formatDecisionPlayerSummary(player, match) {
  const ms = player?._matchStats || {};
  const mem = match?.memory?.myPlayerStates?.[player.id] || {};
  const parts = ['form ' + _formatSignedDecisionValue(player?.form || 0)];

  if (player?.role === 'TW') {
    parts.push((ms.saves || 0) + ' saves');
    parts.push((ms.goalsConceded || 0) + ' allowed');
    if (mem.savesInRow >= 2) parts.push(mem.savesInRow + ' in a row');
  } else if (player?.role === 'VT') {
    parts.push((ms.defendedAttacks || 0) + ' stops');
    parts.push((ms.goalsConceded || 0) + ' allowed');
  } else if (player?.role === 'PM') {
    parts.push('build-up ' + (ms.buildupsOk || 0) + '/' + (ms.buildups || 0));
    if (mem.okBuildupsInRow >= 2) parts.push(mem.okBuildupsInRow + ' clean in a row');
  } else {
    parts.push((ms.goals || 0) + ' goals');
    parts.push((ms.shotsOnTarget || 0) + '/' + (ms.shots || 0) + ' on target');
  }

  return parts.join(' | ');
}

function _formatDecisionStatBundle(stats) {
  if (!stats) return '';
  const ordered = ['offense', 'defense', 'tempo', 'vision', 'composure'];
  return ordered
    .filter(k => Math.abs(stats[k] || 0) >= 1)
    .map(k => `${_shortDecisionStatLabel(k)} ${_formatSignedDecisionValue(Math.round(stats[k] || 0))}`)
    .join('  ');
}

function _pickShiftSubject(match) {
  return (match?.squad || [])
    .slice()
    .sort((a, b) => {
      const aFocus = DATA.roles.find(r => r.id === a.role)?.focusStat || 'offense';
      const bFocus = DATA.roles.find(r => r.id === b.role)?.focusStat || 'offense';
      return ((b.form || 0) * 10 + (b.stats?.[bFocus] || 0)) - ((a.form || 0) * 10 + (a.stats?.[aFocus] || 0));
    })[0] || null;
}

function _formatBenchPlayerPreview(player) {
  const roleMeta = (typeof DATA !== 'undefined' && DATA.roles.find(r => r.id === player?.role)) || null;
  const primary = roleMeta?.focusStat || (player?.role === 'VT' ? 'defense' : 'offense');
  const secondary = player?.role === 'TW'
    ? 'composure'
    : (player?.role === 'PM' ? 'vision' : (player?.role === 'VT' ? 'tempo' : 'composure'));
  const parts = ['form ' + _formatSignedDecisionValue(player?.form || 0)];
  parts.push(_shortDecisionStatLabel(primary) + ' ' + (player?.stats?.[primary] || 0));
  if (secondary !== primary) parts.push(_shortDecisionStatLabel(secondary) + ' ' + (player?.stats?.[secondary] || 0));
  return parts.join(' | ');
}

function _previewDecisionStats(match, decision, phase, state) {
  const stats = {};
  const notes = [];
  const decisionId = decision?.id;
  const deficit = Math.max(0, (match?.scoreOpp || 0) - (match?.scoreMe || 0));
  const lead = Math.max(0, (match?.scoreMe || 0) - (match?.scoreOpp || 0));

  if (!decisionId) return { stats, notes };

  if (phase === 'kickoff') {
    if (decisionId === 'aggressive') notes.push(I18N.t('ui.optionNotes.kickoffAggressive'));
    if (decisionId === 'defensive') notes.push(I18N.t('ui.optionNotes.kickoffDefensive'));
    if (decisionId === 'balanced') notes.push(I18N.t('ui.optionNotes.kickoffBalanced'));
    if (decisionId === 'tempo') notes.push(I18N.t('ui.optionNotes.kickoffTempo'));
    if (decisionId === 'pressing') notes.push(I18N.t('ui.optionNotes.kickoffPressing'));
    if (decisionId === 'possession') notes.push(I18N.t('ui.optionNotes.kickoffPossession'));
    if (decisionId === 'counter') notes.push(I18N.t('ui.optionNotes.kickoffCounter'));
    if (decisionId === 'flank_play') notes.push(I18N.t('ui.optionNotes.kickoffFlank'));
  }

  if (phase === 'halftime') {
    if (decisionId === 'push') notes.push(I18N.t('ui.optionNotes.halftimePush'));
    if (decisionId === 'stabilize') notes.push(I18N.t('ui.optionNotes.halftimeStabilize'));
    if (decisionId === 'shift') {
      const subject = _pickShiftSubject(match);
      if (subject) {
        const focus = DATA.roles.find(r => r.id === subject.role)?.focusStat || 'offense';
        notes.push(I18N.t('ui.optionNotes.halftimeShift', { name: subject.name, stat: _shortDecisionStatLabel(focus) }));
      }
      return { stats, notes };
    }
    if (decisionId === 'rally') notes.push(I18N.t('ui.optionNotes.halftimeRally'));
    if (decisionId === 'reset') notes.push(I18N.t('ui.optionNotes.halftimeReset'));
    if (decisionId === 'counter_h') notes.push(I18N.t('ui.optionNotes.halftimeCounter'));
    if (decisionId === 'high_press') notes.push(I18N.t('ui.optionNotes.halftimeHighPress'));
    if (decisionId === 'vision_play') notes.push(I18N.t('ui.optionNotes.halftimeVisionPlay'));
  }

  if (phase === 'final') {
    if (decisionId === 'all_in') notes.push(I18N.t('ui.optionNotes.finalAllIn'));
    if (decisionId === 'park_bus') notes.push(I18N.t('ui.optionNotes.finalParkBus'));
    if (decisionId === 'hero_ball') {
      const hero = (match?.squad || []).slice().sort((a, b) => (b.form || 0) - (a.form || 0))[0];
      if (hero) {
        const focus = DATA.roles.find(r => r.id === hero.role)?.focusStat || 'offense';
        notes.push(I18N.t('ui.optionNotes.finalHeroBall', { name: hero.name, stat: _shortDecisionStatLabel(focus) }));
      }
      return { stats, notes };
    }
    if (decisionId === 'keep_cool') notes.push(I18N.t('ui.optionNotes.finalKeepCool'));
    if (decisionId === 'final_press') notes.push(I18N.t('ui.optionNotes.finalPress'));
    if (decisionId === 'long_ball') notes.push(I18N.t('ui.optionNotes.finalLongBall'));
    if (decisionId === 'midfield') notes.push(I18N.t('ui.optionNotes.finalMidfield'));
    if (decisionId === 'sneaky') notes.push(I18N.t('ui.optionNotes.finalSneaky'));
    if (decisionId === 'sacrifice') notes.push(I18N.t('ui.optionNotes.finalSacrifice'));
  }

  if (phase === 'kickoff') {
    if (decisionId === 'aggressive') Object.assign(stats, { offense: 18, defense: -8 });
    if (decisionId === 'defensive') Object.assign(stats, { defense: 18, offense: -8 });
    if (decisionId === 'balanced') Object.assign(stats, { offense: 5, defense: 5, tempo: 5, vision: 5, composure: 5 });
    if (decisionId === 'tempo') Object.assign(stats, { tempo: 22, composure: -6 });
    if (decisionId === 'pressing') Object.assign(stats, { defense: 14, tempo: 10 });
    if (decisionId === 'possession') Object.assign(stats, { vision: 18, composure: 10 });
    if (decisionId === 'counter') Object.assign(stats, { defense: 22, tempo: 10, offense: -6 });
    if (decisionId === 'flank_play') Object.assign(stats, { tempo: 14, offense: 14 });
    if (decisionId === 'zone_defense') Object.assign(stats, { defense: 12, composure: 12, tempo: -5 });
    if (decisionId === 'quick_strike') Object.assign(stats, { offense: 30 });  // R1 peak; preview shows opener
    if (decisionId === 'disciplined') Object.assign(stats, { offense: 10, defense: 10, tempo: 10, vision: 10, composure: 10 });
    if (decisionId === 'read_the_room') Object.assign(stats, { vision: 15, composure: 10, defense: 8 });
  } else if (phase === 'halftime') {
    if (decisionId === 'push') Object.assign(stats, { offense: 20 + deficit * 8, defense: -10 });
    if (decisionId === 'stabilize') Object.assign(stats, { defense: 18 + lead * 6, composure: 10 });
    if (decisionId === 'reset') Object.assign(stats, { offense: 7, defense: 7, tempo: 7, vision: 7, composure: 7 });
    if (decisionId === 'counter_h') Object.assign(stats, { tempo: 24, defense: 14 });
    if (decisionId === 'high_press') Object.assign(stats, { defense: 22, composure: -6 });
    if (decisionId === 'vision_play') Object.assign(stats, { vision: 22, offense: 10 });
    if (decisionId === 'double_down') {
      // Preview the amplification: find current biggest buff stat.
      const buffs = match?.teamBuffs || {};
      const keys = ['offense','defense','tempo','vision','composure'];
      let topKey = null, topVal = 0;
      for (const k of keys) {
        if (Math.abs(buffs[k] || 0) > Math.abs(topVal)) { topVal = buffs[k]; topKey = k; }
      }
      if (topKey) stats[topKey] = Math.round(topVal * 0.4);
    }
    if (decisionId === 'tactical_foul') Object.assign(stats, { defense: 8 });
    if (decisionId === 'wing_overload') Object.assign(stats, { offense: 8, defense: -6 });  // net team effect; LF gets personal
    if (decisionId === 'shell_defense') Object.assign(stats, { defense: 24, composure: 14, offense: -10 });
  } else if (phase === 'final') {
    if (decisionId === 'all_in') Object.assign(stats, decision.condition ? decision.condition(match) : { offense: 15, defense: -15 });
    if (decisionId === 'park_bus') Object.assign(stats, decision.condition ? decision.condition(match) : { defense: 15, offense: -10 });
    if (decisionId === 'keep_cool') Object.assign(stats, { composure: 20, vision: 12 });
    if (decisionId === 'final_press') Object.assign(stats, { tempo: 24, defense: 18, offense: -10 });
    if (decisionId === 'long_ball') Object.assign(stats, { offense: 28, vision: -10 });
    if (decisionId === 'midfield') Object.assign(stats, { vision: 20, tempo: 16, composure: 14 });
    if (decisionId === 'sneaky') Object.assign(stats, { defense: 28, tempo: 18, offense: -14 });
    if (decisionId === 'sacrifice') Object.assign(stats, { offense: 35 });
    if (decisionId === 'set_piece') Object.assign(stats, { offense: 25 });   // only on buildups — engine gates this
    if (decisionId === 'siege_mode') Object.assign(stats, { offense: 20, tempo: 10, vision: 10 });
    if (decisionId === 'bus_and_bike') Object.assign(stats, { defense: 18 });
    if (decisionId === 'face_pressure') Object.assign(stats, { composure: 25 });
  }

  let fitStatus = null;     // 'fit' | 'misfit' | null (non-kickoff / no TACTIC_FIT entry)
  let fitMultValue = 1;
  let synergyStatus = null; // 'synergy' | 'conflict' | null
  let synergyMultValue = 1;

  if (phase === 'kickoff' && typeof TACTIC_FIT !== 'undefined' && TACTIC_FIT[decisionId]) {
    const fitDef = TACTIC_FIT[decisionId];
    const isFit = fitDef.fit(match?.squad || [], match?.opp, match);
    const oppBreached = fitDef.opponentBreachFn ? fitDef.opponentBreachFn(match?.opp) : false;
    // Preview must read same CONFIG values as engine.js:applyTactic so that
    // the number shown on the decision card matches the effect that lands.
    const fitMult = 1 + (window.CONFIG?.tacticFitBonus ?? 0.35);
    const misfitMult = 1 - (window.CONFIG?.tacticMisfitPenalty ?? 0.45);
    if (isFit && !oppBreached) {
      notes.push(I18N.t('ui.optionNotes.fitFullValue'));
      fitStatus = 'fit';
      fitMultValue = fitMult;
      for (const key of Object.keys(stats)) {
        if (stats[key] > 0) stats[key] = Math.round(stats[key] * fitMult);
      }
    } else {
      notes.push(I18N.t('ui.optionNotes.misfitReduced'));
      fitStatus = 'misfit';
      fitMultValue = misfitMult;
      for (const key of Object.keys(stats)) {
        if (stats[key] > 0) stats[key] = Math.round(stats[key] * misfitMult);
      }
    }
  }

  const { mult, reasons } = computeDecisionImpact(match, decisionId, state);
  if (mult !== 1) {
    for (const key of Object.keys(stats)) stats[key] = Math.round(stats[key] * mult);
    const reason = reasons.find(r => r.type === 'synergy' || r.type === 'conflict');
    if (reason?.type === 'synergy') {
      notes.push(I18N.t('ui.optionNotes.synergyMult', { mult: mult.toFixed(2) }));
      synergyStatus = 'synergy';
      synergyMultValue = mult;
    }
    if (reason?.type === 'conflict') {
      notes.push(I18N.t('ui.optionNotes.conflictMult', { mult: mult.toFixed(2) }));
      synergyStatus = 'conflict';
      synergyMultValue = mult;
    }
  }

  return { stats, notes, fitStatus, fitMultValue, synergyStatus, synergyMultValue };
}

function decorateOptionsForDisplay(options, match, phase, state) {
  return (options || []).map(opt => {
    if (!opt) return opt;
    if (phase === 'kickoff' || phase === 'halftime' || phase === 'final') {
      const preview = _previewDecisionStats(match, opt, phase, state);
      const statsText = _formatDecisionStatBundle(preview.stats);

      // Badges: qualitative status indicators. Fit/Misfit go to the corner
      // (headline info: does this tactic suit your squad?), synergy/conflict
      // stay inline (modifier info: interaction with other decisions this
      // match). Labels are qualitative ("FITS"/"RISKY") not percentages —
      // raw numbers felt too harsh and implied unjustified precision.
      const badges = [];
      let cornerBadge = null;
      if (preview.fitStatus === 'fit') {
        cornerBadge = { text: I18N.t('ui.optionBadges.fitsSquad'), kind: 'good' };
      } else if (preview.fitStatus === 'misfit') {
        cornerBadge = { text: I18N.t('ui.optionBadges.risky'), kind: 'risky' };
      }
      if (preview.synergyStatus === 'synergy') {
        badges.push({ text: I18N.t('ui.optionBadges.synergy', { mult: preview.synergyMultValue.toFixed(2) }), kind: 'good' });
      } else if (preview.synergyStatus === 'conflict') {
        badges.push({ text: I18N.t('ui.optionBadges.conflict', { mult: preview.synergyMultValue.toFixed(2) }), kind: 'risky' });
      }

      // desc: keep stats line + any non-badge notes (fallback — for now we've
      // pulled the known notes out into badges, so this is usually empty).
      const descLines = [statsText].filter(Boolean);

      return {
        ...opt,
        desc: descLines.length ? descLines : opt.desc,
        badges,
        cornerBadge
      };
    }
    return opt;
  });
}

function generateSubOptions(squad, match, state) {
  if (!squad || !match || !state) return [];
  const bench = (typeof getBench === 'function') ? getBench() : (state.roster || []).filter(p => !(state.lineupIds || []).includes(p.id));
  if (!bench.length) return [];

  const options = [];

  for (const incoming of bench) {
    let outgoing = null;

    if (incoming.role === 'TW') {
      outgoing = squad.find(p => p.role === 'TW') || null;
    } else {
      const sameRole = squad.filter(p => p.role === incoming.role);
      if (sameRole.length) {
        outgoing = sameRole.sort((a, b) => (a.form || 0) - (b.form || 0))[0];
      } else {
        outgoing = squad.filter(p => p.role !== 'TW').sort((a, b) => (a.form || 0) - (b.form || 0))[0] || null;
      }
    }

    if (!outgoing) continue;

    const testLineup = squad.map(p => p.id === outgoing.id ? incoming : p);
    const keeperCount = testLineup.filter(p => p.role === 'TW').length;
    if (keeperCount !== 1 || testLineup.length !== 5) continue;

    const isRoleMismatch = incoming.role !== outgoing.role && incoming.role !== 'TW';
    const isLegendary = !!incoming.isLegendary;

    const incomingRoleAbbr = (window.UI && typeof window.UI.roleAbbr === 'function')
      ? window.UI.roleAbbr(incoming.role)
      : incoming.role;

    const desc = I18N.t('ui.decisions.subOption', {
      name: incoming.name,
      role: incomingRoleAbbr,
      out: outgoing.name
    }) + ' | OUT: ' + _formatDecisionPlayerSummary(outgoing, match)
       + ' | IN: ' + _formatBenchPlayerPreview(incoming)
       + (isRoleMismatch ? ' ' + I18N.t('ui.decisions.subRoleMismatch', { role: incomingRoleAbbr }) : '')
       + (isLegendary ? ' ' + I18N.t('ui.decisions.subLegendary') : '');

    options.push({
      id: 'sub_' + incoming.id,
      name: incoming.name + ' (' + incomingRoleAbbr + ')',
      desc,
      _incoming: incoming,
      _outgoing: outgoing,
      _isRoleMismatch: isRoleMismatch,
      _isLegendary: isLegendary,
      phase: 'halftime_sub',
      apply(m, ctx) {
        const inIdx = m.squad.indexOf(outgoing);
        if (inIdx >= 0) m.squad[inIdx] = incoming;

        if (window.getState) {
          const st = window.getState();
          if (st && st.lineupIds) {
            const li = st.lineupIds.indexOf(outgoing.id);
            if (li >= 0) st.lineupIds[li] = incoming.id;
          }
        }

        if (isRoleMismatch) {
          m.buffLayers.push({ source: 'sub_mismatch', range: [4, 4], stats: { defense: -8 }, special: null });
          recomputeTeamBuffs(m);
          m._triggerLogBuffer = m._triggerLogBuffer || [];
          m._triggerLogBuffer.push(I18N.t('ui.decisions.subRoleMismatch', { role: incomingRoleAbbr }));
        }

        m._triggerLogBuffer = m._triggerLogBuffer || [];
        m._triggerLogBuffer.push(I18N.t('ui.decisions.subDone', { incoming: incoming.name, outgoing: outgoing.name }));

        if (ctx) ctx.subDone = true;
      }
    });
  }

  options.push({
    id: 'sub_none',
    name: I18N.t('ui.decisions.noSub'),
    desc: I18N.t('ui.decisions.noSubDesc'),
    phase: 'halftime_sub',
    apply() {}
  });

  return options;
}

function computeDecisionImpact(match, decisionId, state) {
  const tags = match.activeTacticTags || [];
  const tagSet = new Set(tags);

  let mult = 1.0;
  const reasons = [];

  if (decisionId === 'pressing' || decisionId === 'high_press' || decisionId === 'final_press') {
    if (tagSet.has('pressing')) {
      mult *= 1.35;
      reasons.push({ type: 'synergy', key: 'ui.log.synergyAmplified' });
    }
    if (tagSet.has('ballbesitz') && !tagSet.has('pressing')) {
      mult *= 0.70;
      reasons.push({ type: 'conflict', key: 'ui.log.conflictPressingAfterPossession' });
    }
    if (match._tacticMisfit?.effects?.pressingCollapseRound) {
      mult *= 0.50;
      reasons.push({ type: 'conflict', key: 'ui.log.conflictPressingCollapse' });
    }
  }

  if (decisionId.startsWith('focus_') && tagSet.has('ballbesitz')) {
    const focusPlayer = match.squad?.find(p => 'focus_' + p.id === decisionId);
    if (focusPlayer?.role === 'PM') {
      mult *= 1.20;
      reasons.push({ type: 'synergy', key: 'ui.log.synergyPossessionPM' });
    }
  }

  if (decisionId.startsWith('sub_') && decisionId !== 'sub_none') {
    mult *= 1.0;
  }

  mult = clamp(mult, 0.30, 2.00);
  return { mult, reasons };
}

function applyDecision(match, decision, phase, state) {
  if (!decision || !match) return;

  const { mult, reasons } = computeDecisionImpact(match, decision.id, state);
  const ctx = { mult, phase, state };

  if (decision._isLegendary) {
    ctx.mult = clamp(mult * 1.30, 0.30, 2.00);
    reasons.push({ type: 'synergy', key: 'ui.log.conflictLegendarySub' });
  }

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

  if (typeof decision.apply === 'function') {
    decision.apply(match, ctx);
  }
}

async function checkSituativeEvents(match, onEvent, state) {
  if (!match || !onEvent) return;

  if (!match._firedEvents)     match._firedEvents     = new Set();
  if (!match._eventsThisMatch) match._eventsThisMatch = 0;

  if (match._eventsThisMatch >= 5) return;

  const candidates = [];
  for (const event of SITUATIVE_EVENTS) {
    if (match.round < event.window[0] || match.round > event.window[1]) continue;
    if (match._firedEvents.has(event.id)) continue;
    if (!event.condition(match, state)) continue;
    candidates.push(event);
  }
  if (!candidates.length) return;

  const eligible = candidates.filter(event => rand() < (event.fireChance || 0.60));
  if (eligible.length) {
    const totalWeight = eligible.reduce((sum, event) => sum + Math.max(1, event.priority || 1), 0);
    let roll = rand() * totalWeight;
    let selected = eligible[0];

    for (const event of eligible) {
      roll -= Math.max(1, event.priority || 1);
      if (roll <= 0) {
        selected = event;
        break;
      }
    }

    match._firedEvents.add(selected.id);
    match._eventsThisMatch++;

    const eventCtx = selected.resolveContext ? selected.resolveContext(match, state) : {};
    const filteredOptions = (selected.options || []).filter(opt => {
      if (typeof opt.condition === 'function') return opt.condition(match, eventCtx);
      return true;
    });
    const runnableEvent = { ...selected, options: filteredOptions };

    const chosen = await onEvent({ type: 'interrupt', phase: 'event', match, event: runnableEvent, eventCtx });

    if (chosen && typeof chosen.apply === 'function') {
      const applyCtx = { mult: 1.0, phase: 'event', state, ...eventCtx };
      chosen.apply(match, applyCtx);
    }

    if (typeof flushTriggerLog === 'function') {
      await flushTriggerLog(match, onEvent);
    }
  }

  if (match._oppBuildupPenaltyRounds > 0) {
    match._oppBuildupPenaltyRounds--;
    if (match._oppBuildupPenaltyRounds <= 0) {
      match._oppBuildupPenalty = 0;
    }
  }
  if (match._oppStrikerMalusRounds > 0) {
    match._oppStrikerMalusRounds--;
    if (match._oppStrikerMalusRounds <= 0) {
      match._oppStrikerMalus = 0;
    }
  }
  if (match._oppShotMalusRounds > 0) {
    match._oppShotMalusRounds--;
    if (match._oppShotMalusRounds <= 0) {
      match._oppShotMalus = 0;
    }
  }
  if (match._keeperZoneRounds > 0) {
    match._keeperZoneRounds--;
    if (match._keeperZoneRounds <= 0) {
      match._keeperZoneBonus = 0;
    }
  }
}

window.SITUATIVE_EVENTS        = SITUATIVE_EVENTS;
window.generateSubOptions      = generateSubOptions;
window.decorateOptionsForDisplay = decorateOptionsForDisplay;
window.computeDecisionImpact   = computeDecisionImpact;
window.applyDecision           = applyDecision;
window.checkSituativeEvents    = checkSituativeEvents;
