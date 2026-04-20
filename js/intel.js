// ─────────────────────────────────────────────────────────────────────────────
// intel.js — Information layer
//
// Pure, read-only calculations that help the player see why a match is or
// isn't winnable beyond raw stat totals. Three things live here:
//
//   1. Trait power estimation — each trait has a hand-tuned stat-equivalent
//      value, calibrated so direct comparison with opponent trait power is
//      meaningful.
//   2. Matchup intel — pre-match comparison with concrete advantage/warning
//      callouts (shown in the hub).
//   3. Post-match trait report — which traits fired this match, how often,
//      and estimated impact. Uses the fire counts tracked by traits.js.
//
// Nothing here mutates state. All public entry points are on KL.intel.
// ─────────────────────────────────────────────────────────────────────────────

(() => {
  const KL = window.KL;
  const { DATA } = KL.config;

  // ─── Trait power values ────────────────────────────────────────────────────
  // Rough calibration reference:
  //   +8 recurring stat bonus per round    ≈ 10 power
  //   Once-per-match goal cancel           ≈ 22–25 power
  //   Conditional 15–25% chance trigger    ≈ 12–18 power
  //   Team-wide permanent buff             ≈ 18–25 power
  //   Late-game boost (rounds 5-6 only)    ≈ 8–12 power
  //
  // Keeping these as flat data rather than deriving them from trait handlers
  // — the trait code is full of conditionals and probabilities, so automatic
  // scoring would be unreliable. Hand-tuned numbers track better with how
  // matches actually play out.
  const TRAIT_POWER_VALUES = {
    // Keeper
    titan_stand:     14, fortress_aura:   16, clutch_save:     10,
    sweep_assist:     6, laser_pass:       8, offside_trap:    12,
    acrobat_parry:    7, wall_effect:     14, nine_lives:      22,

    // Defender
    intimidate:       7, bulldoze:        10, captain_boost:   14,
    blood_scent:      9, hard_tackle:     12, whirlwind_rush:  10,
    build_from_back: 10, late_bloom:      14, read_game:       18,

    // Playmaker
    metronome_tempo: 11, killer_pass:     13, whisper_boost:   12,
    hunter_press:    10, gegenpress_steal:11, shadow_strike:    9,
    maestro_combo:   18, chess_predict:   20, symphony_pass:   10,

    // Runner
    speed_burst:     12, launch_sequence:  9, unstoppable_run: 10,
    dribble_chain:   11, street_trick:     9, nutmeg:          13,
    ironman_stamina: 10, dynamo_power:    10, never_stop:      12,

    // Striker
    silent_killer:   12, predator_pounce: 16, opportunity:      8,
    cannon_blast:    11, header_power:    13, brick_hold:       8,
    ghost_run:       10, puzzle_connect:  14, chameleon_adapt: 11,

    // Legendary (premium tier)
    god_mode:        28, clutch_dna:      16, field_general:   25,
    unbreakable:     24, big_game:        14, conductor:       18,
    phoenix:         14, ice_in_veins:     8
  };

  // Opponent traits use the same 10-point-ish scale. Most are modest stat
  // modifiers, which is why the raw stat gap + opponent trait score often
  // undersells how winnable a match really is for a trait-loaded squad.
  const OPP_TRAIT_POWER_VALUES = {
    sturm:       6, riegel:      5, konter_opp:  10, presser_opp: 8,
    clutch_opp:  9, lucky:       6, ironwall:    5, sniper:      8
  };

  // ─── Player trait power ────────────────────────────────────────────────────
  // Mastery traits aren't in the lookup table; we derive their value by
  // tracing back to the parent trait and scaling +30%. Unknown traits
  // (future additions or malformed data) fall back to a neutral 8.
  function estimatePlayerTraitPower(player) {
    if (!player?.traits?.length) return 0;
    let total = 0;
    for (const t of player.traits) {
      if (TRAIT_POWER_VALUES[t] != null) {
        total += TRAIT_POWER_VALUES[t];
        continue;
      }
      if (t.endsWith('_mastery')) {
        const parentId = t.replace(/_mastery$/, '');
        const evo = DATA.evoDetails?.[parentId];
        const parentTrait = evo?.parentTrait;
        const parentValue = parentTrait ? TRAIT_POWER_VALUES[parentTrait] : null;
        if (parentValue != null) {
          total += Math.round(parentValue * 1.3);
          continue;
        }
      }
      total += 8;
    }
    return total;
  }

  function estimateSquadTraitPower(squad) {
    if (!squad?.length) return 0;
    return squad.reduce((sum, p) => sum + estimatePlayerTraitPower(p), 0);
  }

  function estimateOppTraitPower(opp) {
    if (!opp?.traits?.length) return 0;
    return opp.traits.reduce((sum, t) => sum + (OPP_TRAIT_POWER_VALUES[t] || 5), 0);
  }

  // ─── Matchup intel (pre-match) ─────────────────────────────────────────────
  // Returns structured advantages/warnings. Only specific, named callouts —
  // no generic "you should win" text. If nothing concrete pops, the lists
  // stay empty and the UI shows "stat-driven match".
  //
  // Returned shape is consumed by ui.js → renderMatchupIntelPanel.
  function buildMatchupIntel(squad, opp /*, state */) {
    if (!squad?.length || !opp) return null;

    const { teamTotalPower, aggregateTeamStats } = KL.stats;

    const myBasePower  = teamTotalPower(squad);
    const myTraitPower = estimateSquadTraitPower(squad);
    const myEffectivePower = myBasePower + myTraitPower;

    const oppBasePower  = opp.power || Object.values(opp.stats).reduce((a, b) => a + b, 0);
    const oppTraitPower = estimateOppTraitPower(opp);
    const oppEffectivePower = oppBasePower + oppTraitPower;

    const advantages = [];
    const warnings = [];

    const myTraitSet = new Set(squad.flatMap(p => p.traits || []));
    const oppTraits  = new Set(opp.traits || []);
    const isBoss = opp.isBoss;

    const T = window.I18N.t.bind(window.I18N);

    // ── Advantages ────────────────────────────────────────────────────────
    // Weights here decide display order (descending). Kept mostly equal;
    // field-general and big-game outrank other generics because they're
    // match-wide rather than per-condition.

    // Predator Pounce thrives vs pressing/offensive opponents
    if (myTraitSet.has('predator_pounce')
        && (oppTraits.has('presser_opp') || opp.special?.id === 'offensive')) {
      const p = squad.find(p => p.traits?.includes('predator_pounce'));
      advantages.push({ text: T('ui.intel.advPredatorVsPresser', { name: p?.name || 'ST' }), weight: 3 });
    }

    if (myTraitSet.has('late_bloom')) {
      const p = squad.find(p => p.traits?.includes('late_bloom'));
      advantages.push({ text: T('ui.intel.advLateBloom', { name: p?.name || 'VT' }), weight: 2 });
    }

    if ((myTraitSet.has('clutch_save') || myTraitSet.has('clutch_dna')) && oppTraits.has('clutch_opp')) {
      advantages.push({ text: T('ui.intel.advClutchMatchup'), weight: 2 });
    }

    if (isBoss && myTraitSet.has('big_game')) {
      const p = squad.find(p => p.traits?.includes('big_game'));
      advantages.push({ text: T('ui.intel.advBigGame', { name: p?.name || '?' }), weight: 3 });
    }

    if (myTraitSet.has('field_general')) {
      advantages.push({ text: T('ui.intel.advFieldGeneral'), weight: 3 });
    }

    if ((myTraitSet.has('fortress_aura') || myTraitSet.has('wall_effect') || myTraitSet.has('nine_lives'))
        && (opp.special?.id === 'offensive' || oppTraits.has('sniper'))) {
      advantages.push({ text: T('ui.intel.advKeeperWall'), weight: 2 });
    }

    const lf = squad.find(p => p.role === 'LF');
    if (lf && lf.stats.tempo >= opp.stats.tempo + 15) {
      advantages.push({ text: T('ui.intel.advTempo', { name: lf.name }), weight: 2 });
    }

    // ── Warnings ──────────────────────────────────────────────────────────

    if (oppTraits.has('sniper'))     warnings.push({ text: T('ui.intel.warnSniper'),   weight: 3 });
    if (oppTraits.has('konter_opp')) warnings.push({ text: T('ui.intel.warnCounter'),  weight: 3 });
    if (oppTraits.has('ironwall'))   warnings.push({ text: T('ui.intel.warnIronwall'), weight: 2 });

    if (oppTraits.has('clutch_opp') && !myTraitSet.has('clutch_save') && !myTraitSet.has('clutch_dna')) {
      warnings.push({ text: T('ui.intel.warnClutchUnanswered'), weight: 3 });
    }

    if (oppTraits.has('presser_opp')) {
      const pm = squad.find(p => p.role === 'PM');
      if (!pm || pm.stats.vision < 65) {
        warnings.push({ text: T('ui.intel.warnPresserNoVision'), weight: 3 });
      }
    }

    if (oppBasePower > myBasePower + 100) {
      warnings.push({ text: T('ui.intel.warnStatGap', { diff: oppBasePower - myBasePower }), weight: 3 });
    }

    if (isBoss) warnings.push({ text: T('ui.intel.warnBoss'), weight: 1 });

    advantages.sort((a, b) => b.weight - a.weight);
    warnings.sort(   (a, b) => b.weight - a.weight);

    const myAgg = aggregateTeamStats(squad);
    const statComparisons = ['offense', 'defense', 'tempo', 'vision', 'composure'].map(k => ({
      stat: k,
      me:   myAgg[k],
      opp:  opp.stats[k] || 0,
      diff: myAgg[k] - (opp.stats[k] || 0)
    }));

    return {
      myBasePower, myTraitPower, myEffectivePower,
      oppBasePower, oppTraitPower, oppEffectivePower,
      powerDelta: myEffectivePower - oppEffectivePower,
      advantages: advantages.slice(0, 3),
      warnings:   warnings.slice(0, 3),
      statComparisons
    };
  }

  // ─── Post-match trait report ───────────────────────────────────────────────
  // Reads match._traitFireCounts (written by traits.dispatch during the
  // match). Per-fire value is a proxy: baseValue / 3 (min 2). This isn't
  // precise — the same trait fire can be tiny or decisive — but it gives
  // a reasonable "where did my edge come from" feel.
  function buildMatchTraitReport(match) {
    if (!match?._traitFireCounts) return [];
    const fires = match._traitFireCounts;
    const squad = match.squad || [];

    // Cache who owns each trait to decorate the report with player/role
    const traitOwners = {};
    for (const p of squad) {
      for (const t of (p.traits || [])) {
        if (!traitOwners[t]) traitOwners[t] = p;
      }
    }

    const report = [];
    for (const [traitId, count] of Object.entries(fires)) {
      if (count <= 0) continue;

      // Base value, including the mastery fallback
      const baseValue = TRAIT_POWER_VALUES[traitId]
        || (traitId.endsWith('_mastery')
            ? Math.round((TRAIT_POWER_VALUES[DATA.evoDetails[traitId.replace(/_mastery$/, '')]?.parentTrait] || 8) * 1.3)
            : 8);
      const perFireValue = Math.max(2, Math.round(baseValue / 3));
      const estimatedImpact = count * perFireValue;

      const traitDef = DATA.traits[traitId];
      const traitName = traitDef?.name || traitId;
      const owner = traitOwners[traitId];

      report.push({
        traitId,
        traitName,
        playerName: owner?.name || '—',
        role:       owner?.role || '',
        count,
        estimatedImpact
      });
    }

    report.sort((a, b) => b.estimatedImpact - a.estimatedImpact);
    return report;
  }

  // ─── Namespace + legacy exports ────────────────────────────────────────────
  KL.intel = {
    TRAIT_POWER_VALUES,
    OPP_TRAIT_POWER_VALUES,
    estimatePlayerTraitPower,
    estimateSquadTraitPower,
    estimateOppTraitPower,
    buildMatchupIntel,
    buildMatchTraitReport
  };

  Object.assign(window, {
    TRAIT_POWER_VALUES,
    OPP_TRAIT_POWER_VALUES,
    estimatePlayerTraitPower,
    estimateSquadTraitPower,
    estimateOppTraitPower,
    buildMatchupIntel,
    buildMatchTraitReport
  });
})();
