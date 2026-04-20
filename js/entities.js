// ─────────────────────────────────────────────────────────────────────────────
// entities.js — Player and opponent factories
//
// Pulls out of core.js:
//   generateName, makePlayer, generateLegendaryPlayer, generateOpponent
//
// Exposed on KL.entities and as legacy bare-name window globals. Opponents
// have their own OPP_TRAITS derived from the current locale; we re-read it
// each time generateOpponent is called, so language switches mid-run stay
// consistent.
// ─────────────────────────────────────────────────────────────────────────────

(() => {
  const KL = window.KL;
  const { rand, randi, pick, pickN, clamp, uid, localeData } = KL.util;
  const { DATA } = KL.config;

  // ─── Name generation ───────────────────────────────────────────────────────
  // Team-name pools live in the locale data, keyed by starter-team id.
  // If a team id is not in the locale, fall back to the union of all pools.
  const teamNamePools = () => localeData().teamNamePools || {};

  function generateName(teamId) {
    const pools = teamNamePools();
    const pool = teamId && pools[teamId] ? pools[teamId] : null;
    if (pool) {
      return `${pick(pool.first)} ${pick(pool.last)}`;
    }
    const allFirst = Object.values(pools).flatMap(p => p.first);
    const allLast  = Object.values(pools).flatMap(p => p.last);
    return `${pick(allFirst)} ${pick(allLast)}`;
  }

  // ─── makePlayer ────────────────────────────────────────────────────────────
  // Builds a fresh player from an archetype. opts:
  //   name        — override generated name
  //   teamId      — starter-team id, steers the name pool
  //   stage, level— starting stage/level (legendary recruits)
  //   traits      — pre-seeded traits
  //   noRandom    — skip the ±5 stat jitter (used nowhere in live code, kept for determinism)
  //   isLegendary — marks player as legendary recruit
  function makePlayer(archetypeId, opts = {}) {
    const a = DATA.archetypes[archetypeId];
    const stats = {};
    for (const [k, v] of Object.entries(a.stats)) {
      stats[k] = opts.noRandom ? v : clamp(v + randi(-5, 5), 20, 99);
    }
    return {
      id: uid('p'),
      name: opts.name || generateName(opts.teamId),
      role: a.role,
      archetype: archetypeId,
      label: a.label,
      stage: opts.stage || 0,
      evoPath: [archetypeId],
      stats,
      traits: opts.traits || [],
      level: opts.level || 1,
      xp: 0,
      xpToNext: 4,
      goals: 0,
      pendingLevelUp: false,
      evolutionLevel: null,
      isLegendary: !!opts.isLegendary,
      form: 0,
      lastPerformance: 0
    };
  }

  // ─── Legendary recruit ─────────────────────────────────────────────────────
  // Post-boss reward. Stage scales with how far along the run you are:
  //   match ≥5:  stage 1, level 5
  //   match ≥10: stage 2, level 9
  //   match ≥15: stage 2, level 13  (effectively unused — run ends at 15)
  //
  // Adds one random legendary-only trait on top of the evolution trait.
  function generateLegendaryPlayer() {
    const legendaryTraits = localeData().legendaryTraits || {};
    const legendaryNames  = localeData().legendaryNames  || ['Nikolaus Vega'];

    const role = pick(['TW', 'VT', 'PM', 'LF', 'ST']);
    const stage1Options = Object.keys(DATA.evoDetails)
      .filter(k => DATA.evoDetails[k].role === role && !DATA.evoDetails[k].inheritedFrom);
    const evoId = pick(stage1Options);
    const evo = DATA.evoDetails[evoId];

    const baseArch = Object.entries(DATA.archetypes).find(([, a]) => a.role === role);
    const [baseArchId, baseArchData] = baseArch;

    // Stage scaling from current run progress — read through legacy global,
    // since this is the cheapest way to stay locale-agnostic.
    const md = (window.state?.matchNumber) || 5;
    let stage = 1, level = 5;
    if (md >= 10) { stage = 2; level = 9; }
    if (md >= 15) { stage = 2; level = 13; }

    const player = {
      id: uid('leg'),
      name: pick(legendaryNames),
      role,
      archetype: evoId,
      label: evo.label + " ⚜",
      stage: 1,
      evoPath: [baseArchId, evoId],
      stats: { ...baseArchData.stats },
      traits: [],
      level,
      xp: 0,
      xpToNext: 6,
      goals: 0,
      pendingLevelUp: false,
      evolutionLevel: null,
      isLegendary: true,
      form: 0,
      lastPerformance: 0
    };

    // Apply stage-1 boost + trait
    for (const [k, v] of Object.entries(evo.boosts)) {
      player.stats[k] = clamp((player.stats[k] || 0) + v, 20, 99);
    }
    if (evo.trait) player.traits.push(evo.trait);

    // Stage-2 if mid/late run
    if (stage >= 2) {
      const stage2Options = DATA.evolutions[evoId] || [];
      if (stage2Options.length) {
        const s2Id = pick(stage2Options);
        const s2 = DATA.evoDetails[s2Id];
        if (s2) {
          for (const [k, v] of Object.entries(s2.boosts || {})) {
            player.stats[k] = clamp((player.stats[k] || 0) + v, 20, 99);
          }
          if (s2.trait && !player.traits.includes(s2.trait)) player.traits.push(s2.trait);
          player.label = s2.label + " ⚜";
          player.archetype = s2Id;
          player.evoPath.push(s2Id);
          player.stage = 2;
        }
      }
    }

    // Role-focus stat bump + scatter-boost five other stats
    const focusStat = DATA.roles.find(r => r.id === role).focusStat;
    player.stats[focusStat] = clamp(player.stats[focusStat] + 15, 20, 99);
    const otherStats = ['offense', 'defense', 'tempo', 'vision', 'composure'].filter(s => s !== focusStat);
    for (let i = 0; i < 5; i++) {
      const s = pick(otherStats);
      player.stats[s] = clamp(player.stats[s] + 5, 20, 99);
    }

    // One legendary trait on top
    const legTraitKey = pick(Object.keys(legendaryTraits));
    player.traits.push(legTraitKey);

    return player;
  }

  // ─── Opponent generation ───────────────────────────────────────────────────
  // Produces a match opponent scaled by match number. The total stat budget
  // is a quadratic curve biased up for late-run matches and again for bosses.
  // Traits unlock progressively: 1 from match 6, 2 from match 10, 3 from 13.
  // Bosses get at least 2 traits once they're past match 5.
  function generateOpponent(matchNumber) {
    const isBoss = KL.config.CONFIG.bossMatches.includes(matchNumber);
    const name = pick(DATA.opponents.prefixes) + pick(DATA.opponents.places);

    let basePower = 270 + Math.round(matchNumber * 14 + Math.pow(matchNumber, 1.6));
    if (matchNumber >= 8)  basePower += (matchNumber - 7) * 8;
    if (matchNumber >= 12) basePower += (matchNumber - 11) * 10;
    const bossBonus = isBoss ? 55 : 0;
    const totalStat = basePower + bossBonus;

    const special = pick(DATA.opponents.specials);

    // Weight distribution — base 0.18–0.22 per stat with jitter, plus a small
    // bias from the special type. Then normalised back to 1.0.
    const SPECIAL_BIAS = {
      offensive:  { offense: +0.04 },
      defensive:  { defense: +0.04 },
      pacey:      { tempo: +0.04 },
      cerebral:   { vision: +0.04 },
      stoic:      { defense: +0.02, composure: +0.02 },
      balanced:   {}
    };
    const bias = SPECIAL_BIAS[special.id] || {};
    const weights = {
      offense:   0.22 + (rand() - 0.5) * 0.08 + (bias.offense   || 0),
      defense:   0.22 + (rand() - 0.5) * 0.08 + (bias.defense   || 0),
      tempo:     0.20 + (rand() - 0.5) * 0.08 + (bias.tempo     || 0),
      vision:    0.18 + (rand() - 0.5) * 0.06 + (bias.vision    || 0),
      composure: 0.18 + (rand() - 0.5) * 0.06 + (bias.composure || 0)
    };
    const wSum = Object.values(weights).reduce((a, b) => a + b, 0);
    for (const k in weights) weights[k] /= wSum;

    const baseStats = {
      offense:   Math.round(totalStat * weights.offense),
      defense:   Math.round(totalStat * weights.defense),
      tempo:     Math.round(totalStat * weights.tempo),
      vision:    Math.round(totalStat * weights.vision),
      composure: Math.round(totalStat * weights.composure)
    };
    for (const k in baseStats) baseStats[k] = clamp(baseStats[k] + randi(-4, 4), 20, 130);

    // Special stat adjustments are applied on top of the weighted distribution,
    // which means a specialist's extremes can push stats well past the weights.
    for (const [k, v] of Object.entries(special.stats || {})) baseStats[k] += v;
    const actualPower = Object.values(baseStats).reduce((a, b) => a + b, 0);

    // Trait count progression
    let traitCount = 0;
    if (matchNumber >= 6)  traitCount = 1;
    if (matchNumber >= 10) traitCount = 2;
    if (matchNumber >= 13) traitCount = 3;
    if (isBoss && matchNumber >= 5) traitCount = Math.max(traitCount, 2);

    const oppTraits = KL.traits?.OPP_TRAITS || [];
    const traits = traitCount > 0
      ? pickN(oppTraits, traitCount).map(t => t.id)
      : [];

    return {
      name, isBoss, matchNumber,
      power: actualPower,
      stats: baseStats,
      special, traits,
      avgDefense: baseStats.defense,
      avgOffense: baseStats.offense
    };
  }

  // ─── Namespace + legacy exports ────────────────────────────────────────────
  KL.entities = {
    generateName,
    makePlayer,
    generateLegendaryPlayer,
    generateOpponent
  };

  Object.assign(window, {
    generateName,
    makePlayer,
    generateLegendaryPlayer,
    generateOpponent
  });
})();
