// ─────────────────────────────────────────────────────────────────────────────
// roles.js — Role specialization / evolution layer.
//
// Each outfield role has two evolution paths. Player picks once for each
// starter at special draft moments (Match 6 and Match 11). Evolution:
//   1) Stat reshape (+N to one stat, -M from another)
//   2) Chemistry tag added (feeds into match-start chemistry detection)
//   3) Card affinity shift (certain cards +15% effect for this player)
//
// Evolution is PERMANENT and tied to the player, not the role. State is
// persisted on the player object as player.evolution = 'poacher' etc.
// ─────────────────────────────────────────────────────────────────────────────

(() => {
  const KL = window.KL || (window.KL = {});

  // ─── Evolution catalog ───────────────────────────────────────────────────
  const EVOLUTIONS = {
    // ── ST paths ──
    poacher: {
      id: 'poacher',
      baseRole: 'ST',
      nameKey: 'ui.evolutions.poacher.name',
      descKey: 'ui.evolutions.poacher.desc',
      statShift: { offense: +8, vision: -4 },
      addTraitTag: 'finisher',
      // v52.2: lone_striker + final_whistle are ST-centric payoff cards
      // that reward a fresh / trailing-late-game striker. Natural fits
      // for the finisher archetype.
      cardAffinity: ['clinical_finish', 'stone_cold', 'hope_shot', 'scrappy_goal', 'lone_striker', 'final_whistle'],
      cardBonus: 0.15
    },
    false9: {
      id: 'false9',
      baseRole: 'ST',
      nameKey: 'ui.evolutions.false9.name',
      descKey: 'ui.evolutions.false9.desc',
      statShift: { vision: +8, offense: -4 },
      addTraitTag: 'playmaker',
      // v52.2: study_opposition + triangle_play reward vision/playmaking
      // over raw finishing — false9 identity.
      cardAffinity: ['through_ball', 'quick_build', 'drop_deep', 'study_opposition', 'triangle_play'],
      cardBonus: 0.15
    },
    // ── LF paths ──
    inverted_winger: {
      id: 'inverted_winger',
      baseRole: 'LF',
      nameKey: 'ui.evolutions.invertedWinger.name',
      descKey: 'ui.evolutions.invertedWinger.desc',
      statShift: { offense: +6, tempo: -3 },
      addTraitTag: 'cutInside',
      cardAffinity: ['hero_moment', 'clinical_finish', 'set_piece'],
      cardBonus: 0.15
    },
    traditional_winger: {
      id: 'traditional_winger',
      baseRole: 'LF',
      nameKey: 'ui.evolutions.traditionalWinger.name',
      descKey: 'ui.evolutions.traditionalWinger.desc',
      statShift: { tempo: +6, defense: -3 },
      addTraitTag: 'wide',
      cardAffinity: ['cross', 'overlap_run', 'wing_trap'],
      cardBonus: 0.15
    },
    // ── PM paths ──
    regista: {
      id: 'regista',
      baseRole: 'PM',
      nameKey: 'ui.evolutions.regista.name',
      descKey: 'ui.evolutions.regista.desc',
      statShift: { vision: +6, composure: +3, tempo: -4 },
      addTraitTag: 'deepLying',
      // v52.2: field_commander and endgame_plan are PM-orchestration cards;
      // quick_scout's reconnaissance fits the regista's game-reading role.
      cardAffinity: ['through_ball', 'masterclass', 'drop_deep', 'field_commander', 'endgame_plan', 'quick_scout'],
      cardBonus: 0.15
    },
    box_to_box: {
      id: 'box_to_box',
      baseRole: 'PM',
      nameKey: 'ui.evolutions.boxToBox.name',
      descKey: 'ui.evolutions.boxToBox.desc',
      statShift: { tempo: +6, defense: +3, vision: -4 },
      addTraitTag: 'allAction',
      cardAffinity: ['gegenpress', 'forward_burst', 'running_hot', 'field_commander'],
      cardBonus: 0.15
    },
    // ── VT paths ──
    ball_playing_defender: {
      id: 'ball_playing_defender',
      baseRole: 'VT',
      nameKey: 'ui.evolutions.ballPlayingDefender.name',
      descKey: 'ui.evolutions.ballPlayingDefender.desc',
      statShift: { vision: +6, defense: -3 },
      addTraitTag: 'buildup',
      cardAffinity: ['quick_build', 'drop_deep', 'intercept_counter', 'team_unity'],
      cardBonus: 0.15
    },
    stopper: {
      id: 'stopper',
      baseRole: 'VT',
      nameKey: 'ui.evolutions.stopper.name',
      descKey: 'ui.evolutions.stopper.desc',
      statShift: { defense: +6, tempo: +3, vision: -4 },
      addTraitTag: 'hardman',
      // v52.2: deep_defense + last_stand + pressure_trap are all the
      // "grind out a result" cards the stopper exists for.
      cardAffinity: ['tight_shape', 'hold_the_line', 'desperate_foul', 'block', 'deep_defense', 'last_stand', 'pressure_trap'],
      cardBonus: 0.15
    },
    // ── TW paths ──
    sweeper_keeper: {
      id: 'sweeper_keeper',
      baseRole: 'TW',
      nameKey: 'ui.evolutions.sweeperKeeper.name',
      descKey: 'ui.evolutions.sweeperKeeper.desc',
      statShift: { tempo: +5, vision: +3, defense: -3 },
      addTraitTag: 'modernKeeper',
      cardAffinity: ['quick_build', 'drop_deep', 'keeper_rush'],
      cardBonus: 0.15
    },
    shot_stopper: {
      id: 'shot_stopper',
      baseRole: 'TW',
      nameKey: 'ui.evolutions.shotStopper.name',
      descKey: 'ui.evolutions.shotStopper.desc',
      statShift: { defense: +7, tempo: -3 },
      addTraitTag: 'lineKeeper',
      cardAffinity: ['keeper_save', 'hold_the_line', 'deep_defense'],
      cardBonus: 0.15
    }
  };

  // Options for a given role: returns the two paths available.
  function getEvolutionOptions(role) {
    return Object.values(EVOLUTIONS).filter(e => e.baseRole === role);
  }

  function getEvolutionDef(id) {
    return EVOLUTIONS[id] || null;
  }

  // Apply evolution to a player. PERMANENT — mutates player stats + traits.
  function applyEvolution(player, evolutionId) {
    const def = EVOLUTIONS[evolutionId];
    if (!def) return false;
    if (!player.stats) return false;
    if (player.evolution) return false;       // already evolved, no stacking
    for (const [stat, delta] of Object.entries(def.statShift)) {
      player.stats[stat] = Math.max(0, Math.min(99, (player.stats[stat] || 50) + delta));
    }
    if (!player.traits) player.traits = [];
    if (def.addTraitTag && !player.traits.includes(def.addTraitTag)) {
      player.traits.push(def.addTraitTag);
    }
    player.evolution = evolutionId;
    return true;
  }

  // Card affinity bonus — checked during playCard to amplify effect for
  // evolved players whose specialization matches the card. Returns a
  // multiplier: 1.0 (no bonus) or 1.15 (bonus applies).
  function getCardAffinityBonus(match, cardId) {
    if (!match?.squad) return 1.0;
    for (const p of match.squad) {
      if (!p.evolution) continue;
      const def = EVOLUTIONS[p.evolution];
      if (!def) continue;
      if ((def.cardAffinity || []).includes(cardId)) {
        return 1 + def.cardBonus;
      }
    }
    return 1.0;
  }

  // Which matches offer evolution drafts. Placed after players have run-in.
  function isEvolutionMatch(matchNumber) {
    return matchNumber === 6 || matchNumber === 11;
  }

  // Pick the best candidate for evolution — the starter with the most
  // play-time (most match actions) and no existing evolution.
  function getEvolutionCandidate(state) {
    const starters = (state.currentSquad || state.roster || []).filter(p => p._isStarter);
    const eligible = starters.filter(p => !p.evolution);
    if (eligible.length === 0) return null;
    // Rank by activity — prefer players who've been playing more
    eligible.sort((a, b) => {
      const ap = (a._careerMatchesPlayed || 0);
      const bp = (b._careerMatchesPlayed || 0);
      return bp - ap;
    });
    return eligible[0];
  }

  KL.roles = {
    EVOLUTIONS,
    getEvolutionOptions,
    getEvolutionDef,
    applyEvolution,
    getCardAffinityBonus,
    isEvolutionMatch,
    getEvolutionCandidate
  };
})();
