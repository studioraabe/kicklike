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
      // v52.5 — initialize condition at creation time. Previously this was
      // lazily set in flow.js's post-match recovery loop (`if (typeof
      // p.condition !== 'number') p.condition = 100`), but a freshly-built
      // player wouldn't get a condition value until AFTER their first match
      // wrapup. That window left newly-recruited legendaries (added between
      // matches) with no condition tracked during their debut match — the
      // fatigue UI, condition-aware decisions and "min condition" tooltip
      // all silently skipped them. Bake it in here so every player has it
      // from frame zero.
      condition: 100,
      form: 0,
      lastPerformance: 0
    };
  }

  function generateLegendaryPlayer(forceRole = null) {
    const legendaryTraits = localeData().legendaryTraits || {};
    const legendaryNames  = localeData().legendaryNames  || ['Nikolaus Vega'];

    // v0.40 — Role can be forced by the caller. Lets startRecruit
    // stratify the 3 offers across 3 different roles instead of
    // uniform-random (which could yield 3×ST by chance). Falls back
    // to the original uniform pick when no role is passed — keeps
    // existing callers unchanged.
    const role = forceRole || pick(['TW', 'VT', 'PM', 'LF', 'ST']);
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
      // v52.5 — match makePlayer: bake condition in at creation time so a
      // freshly-recruited legendary participates in fatigue tracking from
      // their debut match (was previously missing until first post-match
      // cleanup, leaving condition-aware decisions/UI silently skipping
      // legendaries during their first appearance).
      condition: 100,
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
    // Boss flag: comes from CONFIG.bossMatches by default, but can be
    // forced via opts.forceBoss (used by cup tournament where every
    // tie is against a boss). opts.bossLevel scales the boss bonus —
    // 1 = standard boss (+90), 2 = semi (+135), 3 = final super-boss
    // (+200). Only used when isBoss is true.
    const isBoss = !!opts.forceBoss
      || KL.config.CONFIG.bossMatches.includes(matchNumber);
    const bossLevel = opts.bossLevel || 1;
    // Pick place by index so we can look up the matching logo. i18n-translated
    // `places[]` arrays share the same ordering across de/en/es — the index is
    // the stable identifier.
    // Optional: opts.placeIdx wird vom Season-Generator übergeben, damit der
    // Run ohne Duplikate gezogen wird (~15 Plätze im Pool, 14 Liga-Matches
    // pro Saison → ein Platz pro Gegner). Ohne Angabe fällt der Code auf
    // Zufall zurück (Legacy-Saves, standalone-Nutzung in Tests).
    const places = DATA.opponents.places;
    const placeIdx = (typeof opts.placeIdx === 'number' && opts.placeIdx >= 0 && opts.placeIdx < places.length)
      ? opts.placeIdx
      : Math.floor(rand() * places.length);
    const placeName = places[placeIdx];
    const name = pick(DATA.opponents.prefixes) + placeName;
    const logo = DATA.opponents.placeLogos?.[placeIdx] || null;

    // Opponent power curve — HARD-tuned in v42.1 after feedback that
    // player squads were winning 13-1-0 with 67:9 without touching
    // cards. Base pool is more generous and the late-season climb is
    // aggressive so evolved starters (two +6/-3 reshapes compounded
    // with upgrades + affinity) can't steamroll the table.
    // v52.1: steepened the late-match coefficients because player
    // squads compound faster than this formula anticipated once you
    // factor in card-adds × upgrades × evolutions × legendaries. The
    // 9+ and 12+ multipliers got bumped so matches 11-14 reliably
    // land as real tests instead of 10:0 routs.
    let basePower = 310 + Math.round(matchNumber * 17 + Math.pow(matchNumber, 1.8));
    if (matchNumber >= 5)  basePower += (matchNumber - 4) * 13;
    if (matchNumber >= 9)  basePower += (matchNumber - 8) * 24;   // was 17
    if (matchNumber >= 12) basePower += (matchNumber - 11) * 38;  // was 22
    // Boss bonus scales with bossLevel. Standard boss (level 1) +90.
    // Cup semi-final (level 2) +135. Cup grand final super-boss (3) +200.
    const bossBonusByLevel = { 1: 90, 2: 135, 3: 200 };
    const bossBonus = isBoss ? (bossBonusByLevel[bossLevel] || 90) : 0;

    // Tier multiplier — opps in higher tiers are meaningfully tougher.
    // Amateur (0.85) means first-tier runs aren't punishing. Pro (1.00)
    // is the baseline curve above. Championship (1.18) creates real
    // end-game challenge where even a maxed-out roster feels threatened.
    const tierId = opts.tier || (window.state?._currentTier || 'amateur');
    const tierDef = (window.CONFIG?.leagueTiers || []).find(t => t.id === tierId);
    const tierMul = tierDef?.powerMul || 1.0;
    const totalStat = Math.round((basePower + bossBonus) * tierMul);

    // Give opp teams a "specialist" role — one stat pushed well above
    // the rest. Mimics the player's evolution system so the opp isn't
    // permanently a flat stat pool. Weighted in SPECIAL_BIAS below via
    // a spotlight role chosen here, passed to the weights adjustment.
    const SPOTLIGHT_ROLES = ['offense', 'defense', 'tempo', 'vision'];
    const spotlightRole = SPOTLIGHT_ROLES[Math.floor(rand() * SPOTLIGHT_ROLES.length)];

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
    // Spotlight bonus — mimics player's evolution stat reshape (+6/-3).
    // Pushes the opp's signature stat higher so they're not a flat
    // stat pool at level. Scales with matchNumber so mid-late opps
    // get sharper specialists. Compensated by a tax on other stats.
    if (matchNumber >= 3) {
      const spotlightBoost = 0.05 + (matchNumber * 0.005);  // 0.055..0.12
      weights[spotlightRole] = (weights[spotlightRole] || 0) + spotlightBoost;
      const tax = spotlightBoost / 4;
      for (const k of Object.keys(weights)) {
        if (k !== spotlightRole) weights[k] = Math.max(0.08, weights[k] - tax);
      }
    }
    const wSum = Object.values(weights).reduce((a, b) => a + b, 0);
    for (const k in weights) weights[k] /= wSum;

    const baseStats = {
      offense:   Math.round(totalStat * weights.offense),
      defense:   Math.round(totalStat * weights.defense),
      tempo:     Math.round(totalStat * weights.tempo),
      vision:    Math.round(totalStat * weights.vision),
      composure: Math.round(totalStat * weights.composure)
    };
    for (const k in baseStats) baseStats[k] = clamp(baseStats[k] + randi(-4, 4), 20, 140);

    const progCfg = window.CONFIG?.oppProgressionBonusPerStage || { amateur:0, pro:6, cup:14 };
    const progBonus = progCfg[tierId] ?? 0;
    const bossExtra = isBoss ? (window.CONFIG?.oppProgressionBonusBossExtra ?? 4) : 0;
    const progTotal = progBonus + bossExtra;
    if (progTotal > 0) {
      for (const k of Object.keys(baseStats)) {
        baseStats[k] = clamp(baseStats[k] + progTotal, 20, 140);
      }
    }
    for (const [k, v] of Object.entries(special.stats || {})) baseStats[k] += v;

    // Opp adaptation (v52.1) — if the player leans heavily on one card
    // type across the run, future opponents get a small stat bump in the
    // counter-stat for that type. Kicks in after 12+ total plays (enough
    // signal, not M1 noise) and only when one type has 40%+ share. This
    // makes "spam triggers all day" visibly meet resistance instead of
    // a silent wall of the same base stats every match.
    //
    // Type → counter-stat mapping:
    //   setup    → vision     (opp reads the build-up)
    //   trigger  → composure  (opp resists the effect spike)
    //   combo    → defense    (opp disrupts the combo setup)
    //   defense  → offense    (opp punches through the wall)
    //   counter  → composure  (opp stops giving the counter a trigger)
    let adaptationMeta = null;
    const typePlays = window.state?._runCardTypePlays;
    if (typePlays) {
      const total = Object.values(typePlays).reduce((a, b) => a + b, 0);
      if (total >= 12) {
        let dominantType = null, dominantShare = 0;
        for (const [t, n] of Object.entries(typePlays)) {
          const share = n / total;
          if (share > dominantShare) { dominantShare = share; dominantType = t; }
        }
        if (dominantShare >= 0.40) {
          const counterMap = {
            setup:   'vision',
            trigger: 'composure',
            combo:   'defense',
            defense: 'offense',
            counter: 'composure',
            // v52.2 — draw type (added in the v52 card expansion) was
            // silently missing from this map, so a draw-heavy deck
            // got no opp adaptation at all. "Draw spam" means the
            // player cycles their deck fast to find combo pieces;
            // the counter-axis is tempo — opps that can hurry the
            // match keep the player from reaching their setup pieces
            // before a decision-round forces a play. Tempo is the
            // only stat not already mapped elsewhere, which also
            // keeps the axis unique per type.
            draw:    'tempo'
          };
          const counterStat = counterMap[dominantType];
          if (counterStat) {
            // Bump scales with how dominant: 40% → +5, 60%+ → +12.
            // Clamped so a single runaway type doesn't break opponents.
            const bump = Math.round(5 + Math.min(1, (dominantShare - 0.40) / 0.30) * 7);
            baseStats[counterStat] = clamp(baseStats[counterStat] + bump, 20, 160);
            adaptationMeta = {
              against: dominantType,
              stat: counterStat,
              bump,
              share: dominantShare
            };
          }
        }
      }
    }
    const actualPower = Object.values(baseStats).reduce((a, b) => a + b, 0);

    let traitCount = 0;
    // v52.2 — traits granted earlier to reduce the player-vs-opp ability
    // asymmetry that drove early-run snowball wins. Previous curve:
    // opps had ZERO traits until match 6 while the player had 2 per
    // starter from match 1, producing routinely one-sided ability
    // triggers (e.g. 20:0 in the result panel). New curve:
    //   M1     : 0 traits (onboarding grace)
    //   M2-5   : 1 trait
    //   M6-9   : 2 traits (was 1-2)
    //   M10-12 : 2 traits (was 2)
    //   M13+   : 3 traits (unchanged)
    if (matchNumber >= 2)  traitCount = 1;
    if (matchNumber >= 6)  traitCount = 2;
    if (matchNumber >= 13) traitCount = 3;
    if (isBoss && matchNumber >= 5) traitCount = Math.max(traitCount, 2);

    // v53 — Zusätzliche Skalierung an die reale Player-Squad-Entwicklung,
    // nicht nur an matchNumber. Evolvierte Starter bringen pro Evolution
    // einen Trait-Bonus für den Gegner. So zieht der Gegner mit, wenn
    // der Spieler früh auf Entwicklung setzt — nicht erst in M13. Cap
    // bei +2 damit die Trait-Dichte nicht in absurde Höhen kippt.
    const roster = window.state?.roster || [];
    const evolvedStarters = roster.filter(p => p.evolution && (window.state?.lineupIds || []).includes(p.id)).length;
    const evolutionBonus = Math.min(2, Math.floor(evolvedStarters / 2));
    traitCount += evolutionBonus;

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
      avgOffense: baseStats.offense,
      _placeIdx: placeIdx,  // used by league returning-opp carryover
      _adaptation: adaptationMeta   // null if no adaptation, else {against,stat,bump,share}
    };

    if (KL.oppMoves && KL.oppMoves.pickArchetype) {
      opp.archetype = KL.oppMoves.pickArchetype(matchNumber, isBoss);
    }

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
      // v52.5 — bake condition: 100 in at creation time, mirroring makePlayer.
      // Academy fill-ins live for one match only; the condition tracking
      // matters for that single match (tooltips, decisions, fatigue UI).
      condition: 100,
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
