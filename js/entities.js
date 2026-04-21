(() => {
  const KL = window.KL;
  const { rand, randi, pick, pickN, clamp, uid, localeData } = KL.util;
  const { DATA } = KL.config;

  const teamNamePools = () => localeData().teamNamePools || {};
  const opponentNamePools = () => localeData().opponentNamePools || {};

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

    for (const [k, v] of Object.entries(evo.boosts)) {
      player.stats[k] = clamp((player.stats[k] || 0) + v, 20, 99);
    }
    if (evo.trait) player.traits.push(evo.trait);

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

    const focusStat = DATA.roles.find(r => r.id === role).focusStat;
    player.stats[focusStat] = clamp(player.stats[focusStat] + 15, 20, 99);
    const otherStats = ['offense', 'defense', 'tempo', 'vision', 'composure'].filter(s => s !== focusStat);
    for (let i = 0; i < 5; i++) {
      const s = pick(otherStats);
      player.stats[s] = clamp(player.stats[s] + 5, 20, 99);
    }

    const legTraitKey = pick(Object.keys(legendaryTraits));
    player.traits.push(legTraitKey);

    return player;
  }

  function pickOpponentName(style) {
    const pools = opponentNamePools();
    const pool = pools[style] || pools.neutral || null;
    if (pool) return `${pick(pool.first)} ${pick(pool.last)}`;
    const allFirst = Object.values(pools).flatMap(p => p?.first || []);
    const allLast  = Object.values(pools).flatMap(p => p?.last  || []);
    if (!allFirst.length) return 'Reinhardt';
    return `${pick(allFirst)} ${pick(allLast)}`;
  }

  function nameStyleFor(special) {
    if (!special) return 'neutral';
    if (special.id === 'offensive' || special.id === 'pacey')   return 'sharp';
    if (special.id === 'defensive' || special.id === 'stoic')   return 'heavy';
    if (special.id === 'cerebral')                              return 'cerebral';
    return 'neutral';
  }

  function buildOpponentLineup(opp) {
    const style = nameStyleFor(opp.special);
    const roles = ['TW', 'VT', 'PM', 'LF', 'ST'];
    const lineup = [];

    const teamTotal = Object.values(opp.stats).reduce((a, b) => a + b, 0);

    for (const role of roles) {
      const node = {
        id: uid('opp'),
        name: pickOpponentName(style),
        role
      };

      if (role === 'TW') {
        const base = Math.round(opp.stats.defense * 0.55 + opp.stats.composure * 0.30 + opp.stats.vision * 0.15);
        node.stats = {
          defense:   clamp(base + randi(-4, 6), 30, 130),
          composure: clamp(opp.stats.composure + randi(-3, 5), 30, 130),
          vision:    clamp(opp.stats.vision + randi(-3, 3), 30, 130)
        };
      } else if (role === 'VT') {
        const base = Math.round(opp.stats.defense * 0.62 + opp.stats.vision * 0.20 + opp.stats.composure * 0.18);
        node.stats = {
          defense:   clamp(base + randi(-4, 5), 30, 130),
          vision:    clamp(opp.stats.vision + randi(-4, 4), 30, 130),
          composure: clamp(opp.stats.composure + randi(-3, 4), 30, 130),
          tempo:     clamp(opp.stats.tempo + randi(-5, 3), 30, 130)
        };
      } else if (role === 'PM') {
        const base = Math.round(opp.stats.vision * 0.58 + opp.stats.composure * 0.22 + opp.stats.tempo * 0.20);
        node.stats = {
          vision:    clamp(base + randi(-4, 5), 30, 130),
          composure: clamp(opp.stats.composure + randi(-3, 4), 30, 130),
          tempo:     clamp(opp.stats.tempo + randi(-3, 4), 30, 130),
          offense:   clamp(opp.stats.offense + randi(-5, 3), 30, 130)
        };
      } else if (role === 'LF') {
        const base = Math.round(opp.stats.tempo * 0.52 + opp.stats.offense * 0.30 + opp.stats.composure * 0.18);
        node.stats = {
          tempo:     clamp(base + randi(-4, 5), 30, 130),
          offense:   clamp(opp.stats.offense + randi(-4, 4), 30, 130),
          composure: clamp(opp.stats.composure + randi(-4, 4), 30, 130),
          vision:    clamp(opp.stats.vision + randi(-4, 3), 30, 130)
        };
      } else if (role === 'ST') {
        const base = Math.round(opp.stats.offense * 0.70 + opp.stats.composure * 0.20 + opp.stats.tempo * 0.10);
        node.stats = {
          offense:   clamp(base + randi(-3, 6), 30, 130),
          composure: clamp(opp.stats.composure + randi(-4, 4), 30, 130),
          tempo:     clamp(opp.stats.tempo + randi(-3, 4), 30, 130)
        };
      }

      lineup.push(node);
    }

    return lineup;
  }

  const OPP_TRAIT_ROLE_AFFINITY = {
    sturm:       'ST',
    sniper:      'ST',
    konter_opp:  'LF',
    presser_opp: 'PM',
    clutch_opp:  'ST',
    lucky:       'LF',
    ironwall:    'VT',
    riegel:      'TW'
  };

  function bindTraitsToLineup(traitIds, lineup) {
    const holders = {};
    for (const t of traitIds || []) {
      const preferredRole = OPP_TRAIT_ROLE_AFFINITY[t] || 'ST';
      const holder = lineup.find(p => p.role === preferredRole)
        || lineup.find(p => p.role !== 'TW')
        || lineup[0];
      holders[t] = holder;
    }
    return holders;
  }

  function generateOpponent(matchNumber, opts = {}) {
    const isBoss = KL.config.CONFIG.bossMatches.includes(matchNumber);
    // Pick place by index so we can look up the matching logo. i18n-translated
    // `places[]` arrays share the same ordering across de/en/es — the index is
    // the stable identifier.
    // Optional: opts.placeIdx wird vom Season-Generator übergeben, damit der
    // Run ohne Duplikate gezogen wird (15 Plätze, 15 Matches → ein Platz pro
    // Run). Ohne Angabe fällt der Code auf Zufall zurück (Legacy-Saves,
    // standalone-Nutzung in Tests).
    const places = DATA.opponents.places;
    const placeIdx = (typeof opts.placeIdx === 'number' && opts.placeIdx >= 0 && opts.placeIdx < places.length)
      ? opts.placeIdx
      : Math.floor(rand() * places.length);
    const placeName = places[placeIdx];
    const name = pick(DATA.opponents.prefixes) + placeName;
    const logo = DATA.opponents.placeLogos?.[placeIdx] || null;

    let basePower = 270 + Math.round(matchNumber * 14 + Math.pow(matchNumber, 1.6));
    if (matchNumber >= 8)  basePower += (matchNumber - 7) * 8;
    if (matchNumber >= 12) basePower += (matchNumber - 11) * 10;
    const bossBonus = isBoss ? 55 : 0;
    const totalStat = basePower + bossBonus;

    const special = pick(DATA.opponents.specials);

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
    for (const [k, v] of Object.entries(special.stats || {})) baseStats[k] += v;
    const actualPower = Object.values(baseStats).reduce((a, b) => a + b, 0);

    let traitCount = 0;
    if (matchNumber >= 6)  traitCount = 1;
    if (matchNumber >= 10) traitCount = 2;
    if (matchNumber >= 13) traitCount = 3;
    if (isBoss && matchNumber >= 5) traitCount = Math.max(traitCount, 2);

    const oppTraits = KL.traits?.OPP_TRAITS || [];
    // Der Aura-Trait ist kein zufälliger Roll — er wird garantiert und
    // separat an Bosse vergeben. Deshalb aus dem Random-Pool ausschließen.
    const rollablePool = oppTraits.filter(t => t.id !== 'boss_aura');
    const traits = traitCount > 0
      ? pickN(rollablePool, traitCount).map(t => t.id)
      : [];
    if (isBoss) {
      // Narrativer Hebel: "der Boss dominiert das Spielfeld mental". Mechanisch
      // passiver Stat-Buff auf alle Gegner-Spieler, wirkt jede Runde.
      traits.push('boss_aura');
    }

    const opp = {
      name, isBoss, matchNumber, logo,
      power: actualPower,
      stats: baseStats,
      special, traits,
      avgDefense: baseStats.defense,
      avgOffense: baseStats.offense
    };

    opp.lineup = buildOpponentLineup(opp);
    opp.traitHolders = bindTraitsToLineup(traits, opp.lineup);

    return opp;
  }

  // ─── Academy Player ───────────────────────────────────────────────────────
  // Erzeugt einen temporären Notfall-Spieler, der nur eingewechselt wird,
  // wenn ein Starter gesperrt ist UND die Bank keinen passenden Ersatz hat.
  // Akademie-Spieler sind:
  //   — Rollen-passend zum gesperrten Spieler
  //   — ~20 unter Archetyp-Basis auf allen Stats (deterministisch schlecht)
  //   — ohne Traits, ohne Evolution, ohne Level-Fortschritt
  //   — NICHT Teil des Rosters (leben nur für dieses eine Match)
  // Damit bleibt eine rote Karte Early-Run ein ernster Nachteil, wird aber
  // kein Auto-Game-Over.
  const ACADEMY_STAT_PENALTY = 20;

  function archetypeForRole(role) {
    const entry = Object.entries(DATA.archetypes).find(([, a]) => a.role === role);
    return entry ? { id: entry[0], data: entry[1] } : null;
  }

  function makeAcademyPlayer(role, opts = {}) {
    const base = archetypeForRole(role);
    if (!base) return null;

    const stats = {};
    for (const [k, v] of Object.entries(base.data.stats)) {
      stats[k] = clamp(v - ACADEMY_STAT_PENALTY, 25, 99);
    }

    return {
      id: uid('aca'),
      name: generateName(opts.teamId),
      role,
      archetype: base.id,
      // Label wird in der UI via i18n zu "Aushilfe" / "Academy" gerendert.
      // Wir halten hier einen stabilen Schlüssel-Fallback.
      label: 'Academy',
      stage: 0,
      evoPath: [base.id],
      stats,
      traits: [],
      level: 1,
      xp: 0,
      xpToNext: 999,
      goals: 0,
      pendingLevelUp: false,
      evolutionLevel: null,
      isLegendary: false,
      isAcademy: true,
      form: 0,
      lastPerformance: 0
    };
  }

  KL.entities = {
    generateName,
    makePlayer,
    makeAcademyPlayer,
    generateLegendaryPlayer,
    generateOpponent,
    pickOpponentName,
    buildOpponentLineup,
    bindTraitsToLineup,
    OPP_TRAIT_ROLE_AFFINITY
  };

  Object.assign(window, {
    generateName,
    makePlayer,
    makeAcademyPlayer,
    generateLegendaryPlayer,
    generateOpponent
  });
})();
