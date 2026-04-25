// ─────────────────────────────────────────────────────────────────────────────
// config-data.js — Static game data + highscore persistence
//
// Exports on KL.config:
//   CONFIG         — tuning constants
//   DATA           — all static game data (archetypes, evolutions, traits, …)
//   TACTIC_FIT     — tactic fit/misfit rule definitions
//   HIGHSCORE_KEY  — localStorage key
//
// Exports on KL.highscore:
//   load()              — read from localStorage
//   save(entry)         — write if better than existing
//   buildEntry(season, outcome) — construct an entry from season state
//
// This file has no game logic — just data and lookups. The derived mastery
// evolutions (stage 2) are computed at load time since they're purely a
// function of the stage-1 definitions.
// ─────────────────────────────────────────────────────────────────────────────

(() => {
  const KL = window.KL || (window.KL = {});
  const { capitalizeFirst } = KL.util;

  // ─── Tuning constants ──────────────────────────────────────────────────────
  const CONFIG = {
    // Fallback "season length" for the rare case that no _leagueSeason is
    // active (early boot or test harness). Real seasons drive off the
    // schedule: 8 teams × 2 legs = 14 matches. runLength stays a safety
    // net so the flow loop always has a number to compare against.
    runLength: 14,
    rounds: 6,
    teamSize: 5,
    maxBench: 2,
    evolutionLevels: [5, 9, 13],
    xpPerWin: 3,
    xpPerDraw: 1,
    xpPerLoss: 0,
    bossMatches: [7, 14],
    attackBase: 0.32,
    attackStatScale: 0.008,
    defenseStatScale: 0.008,
    tempoAdvantage: 0.05,
    buildupVisionScale: 0.007,

    playerAttackCapPerRound: 3,
    suppressedAttackBonusFactor: 0.4,
    suppressedAttackBonusMin: 0.03,
    suppressedAttackBonusMax: 0.15,
    oppRageExtraAttackChance: 0.35,
    oppRageDeficitThreshold: 2,
    oppRageMinRound: 3,
    cardStatDampenAfter: 2,
    cardStatDampenStep: 0.18,
    cardStatDampenFloor: 0.35,
    // v0.36 — Per-match repeat dampen. Applied to the buff layers pushed
    // by the Nth play of the same card in the same match. 1st play full,
    // 2nd at 1 - 1*0.20 = 0.80, 3rd at 0.60, 4th at 0.40 (floor). The
    // floor is intentionally the same as the per-round spam floor so
    // worst-case stacking doesn't blow past what the round-spam rule
    // already permits.
    cardRepeatDampenStep: 0.20,
    cardRepeatDampenFloor: 0.40,
    chanceOverflowWarnThreshold: 1.25,

    teamBuffHardCap: 25,
    teamBuffHardFloor: -25,
    // v0.36 — Soft cap introduces diminishing returns above/below this
    // threshold instead of the stat pinning at the hard ceiling. See
    // engine.js:recomputeTeamBuffs for the fold logic. Raw contribution
    // above softCap counts at SoftFactor (default 0.5) — so pushing a
    // stat from 15→25 now requires as many points as 0→15 did.
    teamBuffSoftCap: 15,
    teamBuffSoftFloor: -15,
    teamBuffSoftFactor: 0.5,
    scoringChanceCap: 0.75,
    cardMultiplierMode: 'max',
    oppMoveSystemEnabled: true,
    oppMoveTelegraphMinSeverity: 2,
    oppMoveAdaptiveWeighting: true,

    tacticResistantArchetypes: {
      aggressive: ['direct_play', 'gegenpressing'],
      pressing: ['direct_play']
    },
    oppProgressionBonusPerStage: {
      amateur: 0,
      pro: 6,
      cup: 14
    },
    oppProgressionBonusBossExtra: 4,
    // Rogue-like tuning: fit/misfit spread decides how much tactical
    // coherence matters. Widened from 0.12/0.14 to 0.35/0.45 so a misfit
    // kickoff is genuinely dangerous, not just mildly suboptimal.
    tacticFitBonus: 0.20,
    tacticMisfitPenalty: 0.30,
    // Extra layer: fit also scales passive trait output (+25% / -20%).
    // Lets traits and tactics reinforce each other instead of traits
    // dominating autonomously. See engine.js:applyTactic and traits.js:dispatchTrigger.
    tacticFitTraitAmp: 1.12,
    tacticMisfitTraitAmp: 0.88,

    // ─── Per-level attribute growth (Phase A) ──────────────────────────────
    // Jedes Level-Up (außerhalb von Evolutions) gibt dem Spieler automatisch
    // Stat-Zuwachs. Ziel: Leveln soll sich spürbar lohnen, nicht nur auf die
    // 3 Evolution-Sprünge bei 5/9/13 warten. Summe pro Level = 3 Punkte,
    // fokussiert auf Rollen-Kernstat (Focus) plus einen Nebenstat.
    statGrowthPerLevel: {
      focusBonus:     2,   // +2 auf Focus-Stat pro Level
      secondaryBonus: 1    // +1 auf einen rollen-spezifischen Nebenstat
    },

    // ─── Passive trait dedup (Phase C) ─────────────────────────────────────
    // statCompute/oppStatCompute feuert pro Runde mehrfach (ein Schuss löst
    // Buildup-Check, Attack-Check, Save-Check usw. aus). Ohne Dedup zählt
    // jeder passive Trait dutzendfach pro Runde. Mit Dedup: max. ein Fire
    // pro (Spieler × Trait × Runde). Zahl im Match-Report wird realistisch
    // und mit Gegner-Auras vergleichbar.
    passiveFireDedup: true,

    // ─── Boss aura (Phase D) ───────────────────────────────────────────────
    // Bosse bekommen garantiert einen passiven Aura-Trait zusätzlich zu den
    // zufälligen Traits. Narrativ: "der Boss dominiert das Spielfeld mental".
    // Mechanisch: Stat-Boost auf alle Gegner-Spieler.
    bossAuraStatBonus: 6,

    // ─── Card layer (MVP) ──────────────────────────────────────────────────
    // Feature flag for the card-play system living on top of the existing
    // auto-battler. When true, each round starts with a card-play phase
    // (hand of N, E energy, play until empty or End Turn). Effects push
    // layers onto match.buffLayers — identical mechanism to tactics.
    // When false, match loop runs exactly as before.
    cardsEnabled:     true,
    handSize:         4,
    energyPerRound:   3,
    cardDraftPostMatch: true,   // offer 1-of-3 uncommon card after each match

    // ─── League season structure ───────────────────────────────────────────
    // All runs are league seasons: 14 matches, 8 teams, H+R round-robin.
    // 8 teams → 7 opponents × 2 legs = 14 player matches.
    leagueTeamCount:  8,
    leagueHomeAway:   true,
    leaguePoints:     { win: 3, draw: 1, loss: 0 },
    // Promotion/relegation-style visual zones for the standings table.
    // Top 2 = promotion (green), bottom 2 = relegation (red).
    leaguePromotionZone: 2,
    leagueRelegationZone: 2,

    // ─── League tiers — meta-progression across seasons ─────────────────────
    // Two tiers of ascending difficulty. Player starts in amateur.
    // Finish top 2 in amateur → promote to pro. Finish top 2 in pro →
    // enter the standalone CUP (end-game knockout, see cupEnabled below).
    // Finish bottom 2 → relegate to the tier below (amateur bottom 2
    // ends the run). Each tier has its own name prefix pool (Amateur
    // "Amateur Dynamo X", Pro "Pro Rangers X") and a power multiplier
    // so pro-tier opps are tangibly tougher.
    leagueTiers: [
      { id: 'amateur',      name: 'AMATEUR',      powerMul: 0.85, order: 0 },
      { id: 'pro',          name: 'PRO',          powerMul: 1.05, order: 1 }
    ],

    // ─── Cup tournament — end-game after Pro promotion ────────────────────
    // The cup is a standalone 3-match knockout that triggers AFTER the
    // player promotes from the Pro league (top 2 finish). Three rounds
    // of escalating boss difficulty:
    //   QUARTER → tough boss (~Pro top opponent)
    //   SEMI    → harder boss
    //   FINAL   → SUPER BOSS (run climax — toughest opponent in the game)
    // Win the cup = run champion. Lose any round = runner-up finish.
    cupEnabled: true,
    cupRoundsCount: 3,                  // quarter, semi, final
    cupBossPowerMultipliers: [1.25, 1.40, 1.65],   // per-round opp boost
    cupBossExtraStat: [80, 120, 180]                // additional bossBonus per round
  };

  // ─── Tactic fit rules ──────────────────────────────────────────────────────
  // Each entry defines:
  //   fit(squad, opp, match)   → true = conditions met, full effect
  //   misfitKey                → i18n key for the "this tactic doesn't fit" log line
  //   misfitEffects            → mechanical penalties when conditions fail
  //   opponentBreachFn(opp)    → extra condition from opp side that breaks the fit
  const TACTIC_FIT = {
    aggressive: {
      fit: (squad) => {
        const lf = squad.find(p => p.role === 'LF');
        return lf && lf.stats.tempo >= 62;
      },
      misfitKey: 'tactic.misfit.aggressiveSlow',
      misfitEffects: {
        fatigueMult: 1.6,
        counterVulnMult: 1.4,
        paceyCounterBonus: 0.12
      }
    },
    defensive: {
      fit: (squad) => {
        const pm = squad.find(p => p.role === 'PM');
        return pm && pm.stats.vision >= 58;
      },
      misfitKey: 'tactic.misfit.defensiveNoVision',
      misfitEffects: {
        buildupChanceMult: 0.55,
        pmVisionMalus: 12
      }
    },
    balanced: {
      fit: () => true,
      misfitKey: null,
      misfitEffects: {}
    },
    tempo: {
      fit: (squad, opp) => {
        const lf = squad.find(p => p.role === 'LF');
        const lfTempo = lf ? lf.stats.tempo : 50;
        return lfTempo > opp.stats.tempo + 8;
      },
      misfitKey: 'tactic.misfit.tempoOutpaced',
      misfitEffects: {
        oppCounterBonus: 0.15,
        composureMalusExtra: 8
      }
    },
    pressing: {
      fit: (squad) => {
        const avgTempo = squad.reduce((s, p) => s + p.stats.tempo, 0) / squad.length;
        return avgTempo >= 60;
      },
      misfitKey: 'tactic.misfit.pressingNoLegs',
      misfitEffects: {
        pressingCollapseRound: 3,
        fatigueMult: 1.8,
        visionBreachBonus: 0.10
      },
      opponentBreachFn: (opp) => opp.stats.vision >= 68
    },
    possession: {
      fit: (squad) => {
        const pm = squad.find(p => p.role === 'PM');
        return pm && pm.stats.vision >= 65;
      },
      misfitKey: 'tactic.misfit.possessionNoVision',
      misfitEffects: {
        lossConsequenceMult: 2.2,
        buildupFailCounterChance: 0.45
      },
      opponentBreachFn: (opp) =>
        opp.traits?.some(t => ['presser_opp', 'konter_opp'].includes(t))
    },
    counter: {
      fit: (squad) => {
        const lf = squad.find(p => p.role === 'LF');
        return lf && lf.stats.tempo >= 65;
      },
      misfitKey: 'tactic.misfit.counterNoRunner',
      misfitEffects: {
        counterBonusMult: 0.45,
        ownBuildupMalusMult: 0.70
      },
      opponentBreachFn: (opp) => opp.special?.id === 'defensive'
    },
    flank_play: {
      fit: (squad, opp) => {
        const lf = squad.find(p => p.role === 'LF');
        return lf && lf.stats.tempo > opp.stats.defense - 5;
      },
      misfitKey: 'tactic.misfit.flankCutOut',
      misfitEffects: {
        flankRunChanceMult: 0.40,
        oppDefenseBonus: 6
      },
      opponentBreachFn: (opp) => opp.traits?.includes('ironwall')
    }
  };

  // ─── DATA: archetypes, evolutions, traits, tactics, opponents, starter teams ─
  const DATA = {
    roles: [
      { id: "TW", label: "Goalkeeper", focusStat: "defense", desc: "Holds the 1-vs-1" },
      { id: "VT", label: "Defender",   focusStat: "defense", desc: "The wall" },
      { id: "PM", label: "Playmaker",  focusStat: "vision",  desc: "Orchestrates attacks" },
      { id: "LF", label: "Winger",     focusStat: "tempo",   desc: "Chaos on the flank" },
      { id: "ST", label: "Striker",    focusStat: "offense", desc: "The finisher" }
    ],
    archetypes: {
      "keeper_block":    { role:"TW", label:"Block-Keeper",  stats:{ offense:20, defense:75, tempo:50, vision:55, composure:70 } },
      "keeper_sweep":    { role:"TW", label:"Sweeper-Keeper",stats:{ offense:35, defense:65, tempo:60, vision:65, composure:60 } },
      "keeper_reflex":   { role:"TW", label:"Reflex-Keeper", stats:{ offense:15, defense:70, tempo:65, vision:50, composure:65 } },
      "def_wall":        { role:"VT", label:"Betonwand",     stats:{ offense:25, defense:80, tempo:40, vision:45, composure:70 } },
      "def_tackle":      { role:"VT", label:"Beißer",        stats:{ offense:35, defense:70, tempo:60, vision:50, composure:55 } },
      "def_sweeper":     { role:"VT", label:"Libero",        stats:{ offense:45, defense:65, tempo:55, vision:65, composure:65 } },
      "pm_regista":      { role:"PM", label:"Regista",       stats:{ offense:50, defense:40, tempo:50, vision:80, composure:70 } },
      "pm_press":        { role:"PM", label:"Presser",       stats:{ offense:55, defense:55, tempo:65, vision:60, composure:50 } },
      "pm_playmaker":    { role:"PM", label:"Playmaker",   stats:{ offense:55, defense:35, tempo:55, vision:75, composure:65 } },
      "lf_winger":       { role:"LF", label:"Flügelflitzer", stats:{ offense:60, defense:35, tempo:80, vision:55, composure:45 } },
      "lf_dribbler":     { role:"LF", label:"Dribbler",      stats:{ offense:65, defense:30, tempo:75, vision:60, composure:50 } },
      "lf_box":          { role:"LF", label:"Box-to-Box",    stats:{ offense:55, defense:55, tempo:70, vision:55, composure:60 } },
      "st_poacher":      { role:"ST", label:"Poacher",       stats:{ offense:80, defense:20, tempo:55, vision:50, composure:60 } },
      "st_target":       { role:"ST", label:"Wand",          stats:{ offense:70, defense:45, tempo:45, vision:55, composure:70 } },
      "st_false9":       { role:"ST", label:"Falsche Neun",  stats:{ offense:70, defense:35, tempo:60, vision:70, composure:55 } }
    },
    evolutions: {
      "keeper_block":    ["titan", "fortress", "shotstopper"],
      "keeper_sweep":    ["libero_keeper", "distributor", "highline"],
      "keeper_reflex":   ["acrobat", "wall", "catman"],
      "titan":           ["colossus", "the_wall", "veteran"],
      "fortress":        ["panic_room", "iron_curtain", "citadel"],
      "shotstopper":     ["denier", "spider", "wallah"],
      "libero_keeper":   ["quarterback", "anchor", "pioneer"],
      "distributor":     ["pitchmap", "vision_king", "laserarm"],
      "highline":        ["raumdecker", "adventurer", "offside_trap"],
      "acrobat":         ["spiderman", "bouncer", "circus"],
      "wall":            ["permafrost", "gargoyle", "zen_master"],
      "catman":          ["nine_lives", "reflexking", "lucky_one"],
      "def_wall":        ["enforcer", "bulldozer", "captain_cool"],
      "def_tackle":      ["shark", "terminator", "whirlwind"],
      "def_sweeper":     ["orchestrator", "late_bloomer", "scholar"],
      "enforcer":        ["godfather", "hammer", "villain"],
      "bulldozer":       ["freight_train", "big_man", "anchor_man"],
      "captain_cool":    ["ice_man", "oracle", "veteran_voice"],
      "shark":           ["apex", "piranha", "bloodhound"],
      "terminator":      ["machine", "hunter", "nightmare"],
      "whirlwind":       ["tornado", "juggler", "flash"],
      "orchestrator":    ["maestro", "conductor", "field_marshal"],
      "late_bloomer":    ["renaissance", "polymath", "hidden_gem"],
      "scholar":         ["professor", "tactician", "philosopher"],
      "pm_regista":      ["metronome", "architect", "whisperer"],
      "pm_press":        ["hunter", "gegenpress", "shadow"],
      "pm_playmaker":    ["maestro_mid", "chess", "conductor_mid"],
      "metronome":       ["pendulum", "clockwork", "atomic"],
      "architect":       ["designer", "engineer", "planner"],
      "whisperer":       ["mind_reader", "sensei", "oracle_mid"],
      "hunter":          ["wolf", "predator", "stalker"],
      "gegenpress":      ["relentless", "bulldog", "pitbull"],
      "shadow":          ["phantom", "lurker", "specter"],
      "maestro_mid":     ["virtuoso", "composer", "harmony"],
      "chess":           ["grandmaster", "strategist", "gambit"],
      "conductor_mid":   ["symphony", "overture", "crescendo"],
      "lf_winger":       ["speedster", "rocket", "freight"],
      "lf_dribbler":     ["magician", "street", "trickster"],
      "lf_box":          ["ironman", "dynamo", "eternal"],
      "speedster":       ["lightning", "mach_speed", "sonic"],
      "rocket":          ["launcher", "supersonic", "nasa"],
      "freight":         ["express", "bullet", "warp"],
      "magician":        ["illusionist", "david_c", "wizard"],
      "street":          ["freestyle", "rooftop", "concrete"],
      "trickster":       ["jester", "fox", "mischief"],
      "ironman":         ["perpetual", "immortal", "titanic"],
      "dynamo":          ["volt", "reactor", "generator"],
      "eternal":         ["ageless", "legacy", "forever_young"],
      "st_poacher":      ["assassin", "predator_s", "opportunist"],
      "st_target":       ["cannon", "skyscraper", "brick"],
      "st_false9":       ["ghost", "puzzle", "chameleon"],
      "assassin":        ["silent", "killer", "shadow_s"],
      "predator_s":      ["apex_s", "carnivore", "hunter_s"],
      "opportunist":     ["vulture", "scavenger", "gambler"],
      "cannon":          ["nuke", "bazooka", "demolisher"],
      "skyscraper":      ["tower", "giant", "mountain"],
      "brick":           ["boulder", "monolith", "bastion"],
      "ghost":           ["wraith", "phantom_s", "specter_s"],
      "puzzle":          ["enigma", "riddler", "labyrinth"],
      "chameleon":       ["shapeshifter", "mimic", "kaleidoscope"]
    },
    evoDetails: {
      "titan":         { role:"TW", label:"Titan",         boosts:{ defense:+15, composure:+10 }, trait:"titan_stand" },
      "fortress":      { role:"TW", label:"Festung",       boosts:{ defense:+12, vision:+8 },     trait:"fortress_aura" },
      "shotstopper":   { role:"TW", label:"Shotstopper",   boosts:{ defense:+10, tempo:+10 },     trait:"clutch_save" },
      "libero_keeper": { role:"TW", label:"Libero-Keeper", boosts:{ defense:+8, vision:+12, tempo:+5 }, trait:"sweep_assist" },
      "distributor":   { role:"TW", label:"Dirigent",      boosts:{ vision:+15, composure:+8 },   trait:"laser_pass" },
      "highline":      { role:"TW", label:"High-Liner",    boosts:{ defense:+8, tempo:+10 },       trait:"offside_trap" },
      "acrobat":       { role:"TW", label:"Akrobat",       boosts:{ defense:+12, tempo:+8 },       trait:"acrobat_parry" },
      "wall":          { role:"TW", label:"Mauer",         boosts:{ defense:+18, composure:+5 },   trait:"wall_effect" },
      "catman":        { role:"TW", label:"Katze",         boosts:{ defense:+10, tempo:+12 },      trait:"nine_lives" },
      "enforcer":      { role:"VT", label:"Enforcer",      boosts:{ defense:+15, offense:+5 },     trait:"intimidate" },
      "bulldozer":     { role:"VT", label:"Bulldozer",     boosts:{ defense:+12, composure:+5 },   trait:"bulldoze" },
      "captain_cool":  { role:"VT", label:"Käpt'n",        boosts:{ defense:+8, composure:+15 },   trait:"captain_boost" },
      "shark":         { role:"VT", label:"Hai",           boosts:{ defense:+10, tempo:+10 },      trait:"blood_scent" },
      "terminator":    { role:"VT", label:"Terminator",    boosts:{ defense:+15, tempo:+5 },       trait:"hard_tackle" },
      "whirlwind":     { role:"VT", label:"Wirbelwind",    boosts:{ defense:+8, tempo:+12 },       trait:"whirlwind_rush" },
      "orchestrator":  { role:"VT", label:"Dirigent",      boosts:{ defense:+8, vision:+10 },      trait:"build_from_back" },
      "late_bloomer":  { role:"VT", label:"Spätzünder",    boosts:{ offense:+8, vision:+8, defense:+6 }, trait:"late_bloom" },
      "scholar":       { role:"VT", label:"Scholar",       boosts:{ vision:+12, composure:+8 },    trait:"read_game" },
      "metronome":     { role:"PM", label:"Metronom",      boosts:{ vision:+12, composure:+10 },   trait:"metronome_tempo" },
      "architect":     { role:"PM", label:"Architekt",     boosts:{ vision:+15, offense:+5 },      trait:"killer_pass" },
      "whisperer":     { role:"PM", label:"Flüsterer",     boosts:{ vision:+10, composure:+12 },   trait:"whisper_boost" },
      "hunter":        { role:"PM", label:"Jäger",         boosts:{ offense:+8, tempo:+12 },       trait:"hunter_press" },
      "gegenpress":    { role:"PM", label:"Gegenpresser",  boosts:{ offense:+5, tempo:+10, defense:+5 }, trait:"gegenpress_steal" },
      "shadow":        { role:"PM", label:"Schatten",      boosts:{ tempo:+10, composure:+8 },     trait:"shadow_strike" },
      "maestro_mid":   { role:"PM", label:"Maestro",       boosts:{ offense:+10, vision:+10 },     trait:"maestro_combo" },
      "chess":         { role:"PM", label:"Schachmeister", boosts:{ vision:+15, composure:+5 },    trait:"chess_predict" },
      "conductor_mid": { role:"PM", label:"Dirigent",      boosts:{ offense:+8, vision:+12 },      trait:"symphony_pass" },
      "speedster":     { role:"LF", label:"Speedster",     boosts:{ tempo:+15, offense:+5 },       trait:"speed_burst" },
      "rocket":        { role:"LF", label:"Rakete",        boosts:{ tempo:+12, offense:+8 },       trait:"launch_sequence" },
      "freight":       { role:"LF", label:"Güterzug",      boosts:{ tempo:+10, composure:+8 },     trait:"unstoppable_run" },
      "magician":      { role:"LF", label:"Magier",        boosts:{ offense:+10, vision:+10 },     trait:"dribble_chain" },
      "street":        { role:"LF", label:"Straßenfußballer",boosts:{ offense:+8, tempo:+10 },     trait:"street_trick" },
      "trickster":     { role:"LF", label:"Trickser",      boosts:{ offense:+12, vision:+8 },      trait:"nutmeg" },
      "ironman":       { role:"LF", label:"Ironman",       boosts:{ tempo:+8, defense:+8, composure:+6 }, trait:"ironman_stamina" },
      "dynamo":        { role:"LF", label:"Dynamo",        boosts:{ tempo:+12, offense:+5, defense:+5 }, trait:"dynamo_power" },
      "eternal":       { role:"LF", label:"Ewige",         boosts:{ tempo:+10, composure:+10 },    trait:"never_stop" },
      "assassin":      { role:"ST", label:"Assassin",      boosts:{ offense:+15, composure:+8 },   trait:"silent_killer" },
      "predator_s":    { role:"ST", label:"Raubtier",      boosts:{ offense:+12, tempo:+10 },      trait:"predator_pounce" },
      "opportunist":   { role:"ST", label:"Opportunist",   boosts:{ offense:+10, vision:+10 },     trait:"opportunity" },
      "cannon":        { role:"ST", label:"Kanone",        boosts:{ offense:+18, composure:+5 },   trait:"cannon_blast" },
      "skyscraper":    { role:"ST", label:"Wolkenkratzer", boosts:{ offense:+12, defense:+10 },    trait:"header_power" },
      "brick":         { role:"ST", label:"Brecher",       boosts:{ offense:+10, composure:+12 },  trait:"brick_hold" },
      "ghost":         { role:"ST", label:"Geist",         boosts:{ offense:+10, tempo:+10 },      trait:"ghost_run" },
      "puzzle":        { role:"ST", label:"Puzzle",        boosts:{ offense:+8, vision:+15 },      trait:"puzzle_connect" },
      "chameleon":     { role:"ST", label:"Chamäleon",     boosts:{ offense:+10, vision:+8, tempo:+5 }, trait:"chameleon_adapt" }
    },
    traits: {
      "titan_stand":    { name:"Titanenstand",   desc:"Gegner-Abschluss: 30% Chance abwehren wenn Spielstand eng (≤1 Diff)." },
      "fortress_aura":  { name:"Festungs-Aura",  desc:"Verteidiger +6 Defense solange Keeper in Aktion." },
      "clutch_save":    { name:"Clutch Save",    desc:"In Runde 5-6: +20% Save-Rate." },
      "sweep_assist":   { name:"Sweep-Assist",   desc:"Nach Torwart-Save: +8% nächster Aufbau." },
      "laser_pass":     { name:"Laser-Pass",     desc:"Nach Save: 20% Chance auf direkten Konter-Trigger." },
      "offside_trap":   { name:"Abseitsfalle",   desc:"15% alle Gegner-Angriffe werden negiert (Tempo-based)." },
      "acrobat_parry":  { name:"Akrobatik",      desc:"Nach Parade: +12% Save auf nächsten Schuss (1x pro Match)." },
      "wall_effect":    { name:"Mauer",          desc:"+15% Save-Rate permanent, aber -10% eigener Aufbau." },
      "nine_lives":     { name:"Neun Leben",     desc:"1x pro Match: erstes kassiertes Tor wird annulliert." },
      "intimidate":     { name:"Einschüchtern",  desc:"Gegner-Stürmer: -5 Offense." },
      "bulldoze":       { name:"Bulldozer",      desc:"Jede Runde 10% Chance: stiehlt Ball vor Gegner-Abschluss." },
      "captain_boost":  { name:"Kapitän",        desc:"Gesamtes Team: +3 Composure." },
      "blood_scent":    { name:"Blutrausch",     desc:"Nach jedem Gegner-Tor: +5 Defense für Rest des Matches." },
      "hard_tackle":    { name:"Hartes Tackling",desc:"20% Chance: Gegner-Sturm gebrochen + Konter." },
      "whirlwind_rush": { name:"Wirbelwind",     desc:"1x pro Halbzeit: verdoppelt eigenen Tempo-Wert in einer Runde." },
      "build_from_back":{ name:"Spielaufbau",    desc:"Playmaker +8 Vision." },
      "late_bloom":     { name:"Spätzünder",     desc:"Ab Runde 4: +10 Offense und +5 Vision." },
      "read_game":      { name:"Spielintelligenz",desc:"Einmal pro Match: negiert Gegner-Angriff automatisch." },
      "metronome_tempo":{ name:"Metronom",       desc:"Jede Runde: +2% auf den eigenen Aufbau (kumulativ)." },
      "killer_pass":    { name:"Killer-Pass",    desc:"Bei eigenem Sturm: 25% Chance auf Chain-Trigger (2. Schuss)." },
      "whisper_boost":  { name:"Flüstern",       desc:"Stürmer +8 Composure und +4 Offense." },
      "hunter_press":   { name:"Jagdfieber",     desc:"15% Chance pro Runde: Ballgewinn durch Pressing." },
      "gegenpress_steal":{ name:"Gegenpressing", desc:"Nach jedem Gegner-Ballverlust: +15% eigener Aufbau." },
      "shadow_strike":  { name:"Schattenschlag", desc:"Runde 3 & 6: 20% Chance auf versteckten Angriff." },
      "maestro_combo":  { name:"Maestro-Combo",  desc:"Wenn PM+LF+ST alle treffen: verdoppelt nächstes Tor." },
      "chess_predict":  { name:"Vorhersage",     desc:"1x pro Halbzeit: wandelt Gegner-Tor in Parade um." },
      "symphony_pass":  { name:"Symphonie",      desc:"Wenn 2+ Teammates Traits triggern: +10% Team-Offense." },
      "speed_burst":    { name:"Speed Burst",    desc:"Einmal pro Halbzeit: garantierter Aufbau-Erfolg." },
      "launch_sequence":{ name:"Launch",         desc:"Runde 1: +20% eigener Angriffserfolg." },
      "unstoppable_run":{ name:"Unaufhaltbar",   desc:"Wenn Tempo > Gegner-Defense: 10% Auto-Tor." },
      "dribble_chain":  { name:"Dribbel-Chain",  desc:"Pro erfolgreichem Sturm: +5% nächster Sturm (stack)." },
      "street_trick":   { name:"Street-Trick",   desc:"15% Chance: umspielt Verteidiger komplett." },
      "nutmeg":         { name:"Tunnel",         desc:"20% Chance pro eigenem Angriff: Gegner-Defense ignoriert." },
      "ironman_stamina":{ name:"Ironman",        desc:"Runden 5-6: kein Stat-Decay + team +2 Tempo." },
      "dynamo_power":   { name:"Dynamo",         desc:"Jede 2. Runde: +6 Team-Offense für diese Runde." },
      "never_stop":     { name:"Niemals stoppen",desc:"Bei Rückstand: +8 Offense pro kassiertem Tor." },
      "silent_killer":  { name:"Silent Killer",  desc:"Erster Schuss im Match: +30% Offense." },
      "predator_pounce":{ name:"Hetzjagd",       desc:"Nach Gegner-Fehlangriff: 25% sofort-Tor." },
      "opportunity":    { name:"Gelegenheit",    desc:"Pro eigenem Aufbau: +3% Tor-Chance (ohne Sturm nötig)." },
      "cannon_blast":   { name:"Kanonenschuss",  desc:"Jeder Schuss: 10% Chance auf Auto-Tor, aber Missrate +5%." },
      "header_power":   { name:"Kopfballungeheuer",desc:"Bei hoher Vision im Team: +15% Tor-Chance." },
      "brick_hold":     { name:"Ballhalten",     desc:"Stabilisiert Team: -10% Gegner-Pressing." },
      "ghost_run":      { name:"Geisterlauf",    desc:"15% Chance pro Runde: erscheint plötzlich für Chance." },
      "puzzle_connect": { name:"Puzzlestück",    desc:"Wenn PM trifft: +25% eigenes Tor in nächster Runde." },
      "chameleon_adapt":{ name:"Anpassung",      desc:"Kopiert Trait des aktivsten Teammates in Runde 4." }
    },
    starterTeams: [
      {
        id: "konter",
        name: "Konter-Spezialisten",
        theme: "schnell, defensiv, bestraft Gegner-Fehler",
        color: "#2ae4ff",
        desc: "Stark im Mittelfeld und auf dem Flügel. Tor durch Tempo-Übergang.",
        lineup: ["keeper_block", "def_sweeper", "pm_regista", "lf_winger", "st_poacher"],
        signatureTactics: { kickoff:["counter"], halftime:["counter_h"], final:["sneaky"] },
        tacticTags: { konter:3, tempo:2, defensiv:2 },
        logo: "img/counter_attack.png"
      },
      {
        id: "kraft",
        name: "Kraftpaket",
        theme: "physisch, Kopfbälle, Zermürbung",
        color: "#ffd23a",
        desc: "Gewinnt durch pure Physis. Besonders stark spät im Match.",
        lineup: ["keeper_block", "def_wall", "pm_regista", "lf_box", "st_target"],
        signatureTactics: { kickoff:["defensive"], halftime:["stabilize"], final:["park_bus"] },
        tacticTags: { defensiv:3, physisch:2, kontrolle:1 },
        logo: "img/powerhouse.png"
      },
      {
        id: "technik",
        name: "Technik-Magier",
        theme: "vision-basiert, Kombos über Pässe",
        color: "#aaff2a",
        desc: "Baut Angriffe aus dem Nichts. Langsam, aber präzise.",
        lineup: ["keeper_reflex", "def_sweeper", "pm_playmaker", "lf_box", "st_false9"],
        signatureTactics: { kickoff:["possession"], halftime:["vision_play"], final:["midfield"] },
        tacticTags: { ballbesitz:3, technik:2, vision:2 },
        logo: "img/technique_magicians.png"
      },
      {
        id: "pressing",
        name: "Pressing-Bestien",
        theme: "aggressiv, brechen Gegner-Aufbau",
        color: "#ff3c6e",
        desc: "Zwingt Fehler mit permanentem Druck. Risikofußball mit schwachen Nerven.",
        lineup: ["keeper_sweep", "def_tackle", "pm_press", "lf_dribbler", "st_false9"],
        signatureTactics: { kickoff:["pressing"], halftime:["high_press"], final:["final_press"] },
        tacticTags: { pressing:3, aggressiv:2, tempo:1 },
        logo: "img/pressing_beasts.png"
      }
    ],
    opponents: {
      prefixes: ["SC ", "FC ", "VfL ", "TSV ", "BSG ", "Dynamo ", "Eintracht ", "Wacker ", "Rot-Weiß ", "Alemannia "],
      places:   ["Nachtwald", "Sturmhof", "Kaltenfels", "Eisental", "Rauhbruck", "Donnerberg", "Windheim",
                 "Eisstorm", "Rabenfeld", "Schattental", "Feuerhorn", "Nebelburg", "Ödland", "Blutfels", "Gewitterhain"],
      // Logos in gleicher Reihenfolge wie places[] (DE + EN beide nutzen diesen Index).
      // null = kein Logo verfügbar → Render fällt auf Initial-Letter zurück.
      placeLogos: [
        "img/nightwood.png",    // Nachtwald / Nightwood
        "img/stormhold.png",    // Sturmhof / Stormhold
        "img/coldcrag.png",     // Kaltenfels / Coldcrag
        "img/ironvale.png",     // Eisental / Ironvale
        "img/roughbridge.png",  // Rauhbruck / Roughbridge
        "img/thunderpeak.png",  // Donnerberg / Thunder Peak
        "img/windhaven.png",    // Windheim / Windhaven
        "img/froststorm.png",   // Eisstorm / Froststorm
        "img/ravenfield.png",   // Rabenfeld / Ravenfield
        "img/shadowvale.png",   // Schattental / Shadowvale
        "img/firehorn.png",     // Feuerhorn / Firehorn
        "img/mistkeep.png",     // Nebelburg / Mistkeep
        "img/wastemark.png",    // Ödland / Wastemark
        "img/bloodrock.png",    // Blutfels / Bloodrock
        "img/tempest_grove.png" // Gewitterhain / Tempest Grove
      ],
      specials: [
        { id:"offensive",    name:"Offensiv-Fokus",  stats:{ offense:+18, defense:-8 } },
        { id:"defensive",    name:"Bollwerk",         stats:{ defense:+18, offense:-8 } },
        { id:"pacey",        name:"Temposchnell",    stats:{ tempo:+18, composure:-6 } },
        { id:"cerebral",     name:"Taktiker",        stats:{ vision:+15, tempo:-5 } },
        { id:"stoic",        name:"Eisenhart",       stats:{ composure:+12, defense:+8, offense:-8 } },
        { id:"balanced",     name:"Ausgewogen",      stats:{ offense:+5, defense:+5, vision:+3 } }
      ]
    },
    kickoffTactics: [
      // — Existing 8 —
      { id:"aggressive",  tags:["aggressiv"],            name:"Aggressive Start",  desc:"+18 attack in R1-3, -8 defense.",        tacticTrigger: null },
      { id:"defensive",   tags:["defensiv"],             name:"Defensive Start",   desc:"+18 defense in R1-3, -8 attack.",        tacticTrigger: null },
      { id:"balanced",    tags:["kontrolle"],            name:"Balanced",          desc:"+8 all stats in R1-3.",                  tacticTrigger: null },
      { id:"tempo",       tags:["tempo"],                name:"Tempo Game",        desc:"+22 tempo in R1-3, -6 composure.",       tacticTrigger: null },
      { id:"pressing",    tags:["pressing","aggressiv"], name:"Pressing",          desc:"+14 defense, +10 tempo in R1-3.",        tacticTrigger: "pressing_trigger" },
      { id:"possession",  tags:["ballbesitz","vision"],  name:"Possession",        desc:"+18 vision, +10 composure in R1-3.",     tacticTrigger: null },
      { id:"counter",     tags:["konter","defensiv"],    name:"Counter Trap",      desc:"+22 defense, +10 tempo, -6 attack.",     tacticTrigger: "counter_trigger" },
      { id:"flank_play",  tags:["tempo","technik"],      name:"Wing Play",         desc:"+14 tempo, +14 attack in R1-3.",         tacticTrigger: null },

      // — Prior 8 additions —
      { id:"slow_burn",   tags:["ballbesitz","kontrolle"], name:"Slow Burn",       desc:"-4 attack R1-2, then +22 attack R3+.",   tacticTrigger: null },
      { id:"shot_flood",  tags:["aggressiv","tempo"],      name:"Shot Flood",      desc:"+24 attack R1-3, accuracy unreliable.", tacticTrigger: null },
      { id:"lockdown",    tags:["defensiv","pressing"],    name:"Lockdown",        desc:"+28 defense R1-3, -12 attack, -8 tempo.",tacticTrigger: null },
      { id:"mindgames",   tags:["technik","vision"],       name:"Mind Games",      desc:"+14 VIS, +10 CMP team. Opp −6 CMP for 2 rounds.",tacticTrigger: null },
      { id:"underdog",    tags:["physisch","aggressiv"],   name:"Underdog Mode",   desc:"Only if opp power +60: +14 all stats R1-6.",tacticTrigger: null, condition: (match) => ((match.opp?.power || 0) - (match._myBasePower || 0)) >= 60 ? null : 'miss' },
      { id:"favorite",    tags:["kontrolle","vision"],     name:"Strut",           desc:"Only if you lead in power: +10 vision, +6 tempo, momentum built.",tacticTrigger: null, condition: (match) => ((match._myBasePower || 0) - (match.opp?.power || 0)) >= 40 ? null : 'miss' },
      { id:"wet_start",   tags:["defensiv","kontrolle"],   name:"Soak & Strike",   desc:"R1-2 pure defense, R3 explodes: +24 attack at kickoff of round 3.", tacticTrigger: null },
      { id:"chaos",       tags:["aggressiv","tempo"],      name:"Chaos Football",  desc:"Random: +20 to one stat, -10 to two others each round.",tacticTrigger: null },

      // — NEW: 4 additions (this turn) —
      { id:"zone_defense",  tags:["defensiv","kontrolle"], name:"Zone Defense",    desc:"+12 defense, +12 composure, -5 tempo R1-3. Structured not aggressive.", tacticTrigger: null },
      { id:"quick_strike",  tags:["aggressiv","tempo"],    name:"Quick Strike",    desc:"R1: +30 attack burst. R2-3: +5 all stats. Explosive then measured.", tacticTrigger: null },
      { id:"disciplined",   tags:["kontrolle","technik"],  name:"Disciplined",     desc:"+10 all stats R1-3. Negative form penalties ignored this match.", tacticTrigger: null },
      { id:"read_the_room", tags:["vision","defensiv"],    name:"Read the Room",   desc:"+15 vision, +10 composure, +8 defense R1-3. Cerebral opening.", tacticTrigger: null }
    ],

    halftimeOptions: [
      // — Existing 8 —
      { id:"push",        tags:["aggressiv"],              name:"Risk Push",        desc:"+20 attack R4-6, -10 defense. If trailing, grows per goal.",  tacticTrigger: null },
      { id:"stabilize",   tags:["defensiv","kontrolle"],   name:"Stabilize",        desc:"+18 defense, +10 composure. If leading, grows per goal.",     tacticTrigger: null },
      { id:"shift",       tags:["technik"],                name:"Reassign",         desc:"Top-form player: +18 focus stat (match-long boost on the strongest fit).",                 tacticTrigger: null },
      { id:"rally",       tags:["physisch","aggressiv"],   name:"Rally",            desc:"+6 attack per goal conceded, +6 defense per goal scored.",     tacticTrigger: "rally_trigger" },
      { id:"reset",       tags:["kontrolle"],              name:"Reset Shape",      desc:"+12 to ALL stats in R4-6.",                                   tacticTrigger: null },
      { id:"counter_h",   tags:["konter","tempo"],         name:"Lean Into Counters",desc:"+24 tempo, +14 defense, auto-counter on failed enemy attack.",tacticTrigger: "counter_trigger" },
      { id:"high_press",  tags:["pressing"],               name:"High Press",       desc:"+22 defense R4-6, -6 composure.",                              tacticTrigger: "high_press_trigger" },
      { id:"vision_play", tags:["ballbesitz","vision"],    name:"Open the Game",    desc:"+22 vision, +10 attack in R4-6.",                             tacticTrigger: null },

      // — NEW: 8 additions —
      { id:"shake_up",    tags:["technik","aggressiv"],    name:"Shake-Up",         desc:"Worst-form player benched in spirit: −5 all stats. Team +12 OFF R4-6.", tacticTrigger: "shake_trigger" },
      { id:"lock_bus",    tags:["defensiv"],               name:"Lock the Bus",     desc:"Only if leading: +30 defense, -20 attack R4-6. Impenetrable.", tacticTrigger: null, condition: (match) => (match.scoreMe > match.scoreOpp) ? null : 'miss' },
      { id:"desperate",   tags:["aggressiv","physisch"],   name:"Desperate Attack", desc:"Only if trailing by 2+: +32 attack R4-6, -20 defense, keeper at risk.",tacticTrigger: null, condition: (match) => (match.scoreOpp - match.scoreMe) >= 2 ? null : 'miss' },
      { id:"role_switch", tags:["technik","tempo"],        name:"Role Switch",      desc:"LF and ST swap roles R4-6. Team: +10 TMP, +10 OFF, −8 VIS. LF +8 OFF, ST +8 TMP personal.",tacticTrigger: null },
      { id:"coach_fire",  tags:["aggressiv","physisch"],   name:"Fiery Team Talk",  desc:"If losing at half: team form +1 next match, +14 attack R4-6.", tacticTrigger: null, condition: (match) => (match.scoreOpp > match.scoreMe) ? null : 'miss' },
      { id:"cold_read",   tags:["vision","kontrolle"],     name:"Cold Read",        desc:"Analyze enemy: +20 defense, enemy attack -8 R4-6.",            tacticTrigger: null },
      { id:"wingman",     tags:["tempo","technik"],        name:"Free the Wingman", desc:"LF gets +25 tempo, +15 attack R4-6 (personal). Team -4 composure.",tacticTrigger: null },
      { id:"mind_reset",  tags:["kontrolle"],              name:"Mental Reset",     desc:"Wipes all form deltas in squad. Fresh slate into R4-6.",       tacticTrigger: null },

      // — NEW: 4 additions (this turn) —
      { id:"double_down",   tags:["kontrolle","aggressiv"], name:"Double Down",     desc:"Amplifies your biggest POSITIVE team buff by +40%. Modest +6 OFF/DEF/CMP if no buff yet.", tacticTrigger: null },
      { id:"tactical_foul", tags:["defensiv","physisch"],   name:"Tactical Fouls",  desc:"+8 defense, opp tempo -12 R4-5. Disruption over improvement.", tacticTrigger: null },
      { id:"wing_overload", tags:["tempo","technik"],       name:"Wing Overload",   desc:"LF: +20 offense +20 tempo personal R4-6. Team -6 defense.", tacticTrigger: null },
      { id:"shell_defense", tags:["defensiv","kontrolle"],  name:"Shell Defense",   desc:"Only drawing/leading: +24 defense, +14 composure, -10 attack R4-6.", tacticTrigger: null, condition: (match) => (match.scoreMe >= match.scoreOpp) ? null : 'miss' }
    ],

    finalOptions: [
      // — Existing 9 —
      { id:"all_in",      tags:["aggressiv"],              name:"All In",           desc:"Final round: +15 attack, -15 defense. Scales with deficit.",
        tacticTrigger: null,
        condition: (match) => {
          const deficit = match.scoreOpp - match.scoreMe;
          return deficit > 0 ? { offense: 15 + deficit * 5, defense: -15 } : { offense: 15, defense: -15 };
        }
      },
      { id:"park_bus",    tags:["defensiv"],               name:"Park the Bus",     desc:"Final round: +15 defense, -10 attack. Scales with lead.",
        tacticTrigger: null,
        condition: (match) => {
          const lead = match.scoreMe - match.scoreOpp;
          return lead > 0 ? { defense: 15 + lead * 5, offense: -10 } : { defense: 15, offense: -10 };
        }
      },
      { id:"hero_ball",   tags:["technik"],                name:"Hero Ball",        desc:"Top-form player: +30 focus stat (match-long).",  tacticTrigger: null },
      { id:"keep_cool",   tags:["kontrolle","vision"],     name:"Stay Cool",        desc:"Final round: +20 composure, +12 vision.",             tacticTrigger: null },
      { id:"final_press", tags:["pressing"],               name:"Final Press",      desc:"Final round: +24 tempo, +18 defense, -10 attack.",   tacticTrigger: "final_press_trigger" },
      { id:"long_ball",   tags:["physisch","aggressiv"],   name:"Long Balls",       desc:"Final round: +28 attack, -10 vision. Direct.",       tacticTrigger: null },
      { id:"midfield",    tags:["ballbesitz","kontrolle"], name:"Midfield Control", desc:"Final round: +20 vision, +16 tempo, +14 composure.",  tacticTrigger: null },
      { id:"sneaky",      tags:["konter","defensiv"],      name:"Ambush",           desc:"Final round: +28 defense, +18 tempo, -14 attack.",   tacticTrigger: null },
      { id:"sacrifice",   tags:["aggressiv","physisch"],   name:"Sacrifice",        desc:"Top-form player: −15 focus stat. Team: +35 OFF this match.",tacticTrigger: "sacrifice_trigger" },

      // — NEW: 8 additions —
      { id:"kamikaze",    tags:["aggressiv","physisch"],   name:"Kamikaze",         desc:"Only if trailing: +40 attack, -40 defense, keeper risk.",
        tacticTrigger: null,
        condition: (match) => (match.scoreOpp > match.scoreMe) ? { offense: 40, defense: -40 } : null },
      { id:"clockwatch",  tags:["defensiv","kontrolle"],   name:"Clock Watching",   desc:"Only if leading: +25 defense, +18 composure, time runs down.",
        tacticTrigger: null,
        condition: (match) => (match.scoreMe > match.scoreOpp) ? { defense: 25, composure: 18 } : null },
      { id:"poker",       tags:["vision","technik"],       name:"Poker Face",       desc:"+15 to every stat if even. Nothing if leading/trailing.",
        tacticTrigger: null,
        condition: (match) => (match.scoreMe === match.scoreOpp) ? { offense: 15, defense: 15, tempo: 15, vision: 15, composure: 15 } : null },
      { id:"lone_wolf",   tags:["aggressiv"],              name:"Lone Wolf",        desc:"ST: +40 attack, +20 tempo personal. Rest of team: -6 attack.", tacticTrigger: null },
      { id:"fortress",    tags:["defensiv"],               name:"Fortress",         desc:"+40 defense for TW/VT, -20 attack for team.",                tacticTrigger: null },
      { id:"gamble",      tags:["aggressiv"],              name:"Gamble",           desc:"50/50: +35 attack OR -15 all stats. Roll the dice.",         tacticTrigger: "gamble_trigger" },
      { id:"masterclass", tags:["technik","vision"],       name:"Masterclass",      desc:"PM: +30 vision, +20 composure personal. Team +12 attack.",    tacticTrigger: null },
      { id:"rope_a_dope", tags:["konter","defensiv"],      name:"Rope-a-Dope",      desc:"R6 only: +35 defense, auto-counter on every enemy attack.",  tacticTrigger: "counter_trigger" },

      // — NEW: 4 additions (this turn) —
      { id:"set_piece",     tags:["technik","aggressiv"],   name:"Set Piece Master",desc:"R6: +25 attack, but ONLY on successful buildups. Narrow boost.", tacticTrigger: null },
      { id:"siege_mode",    tags:["aggressiv","kontrolle"], name:"Siege Mode",      desc:"R6: +20 attack, +10 tempo, +10 vision. Clean all-around pressure.", tacticTrigger: null },
      { id:"bus_and_bike",  tags:["defensiv","konter"],     name:"Bus & Counter",      desc:"R6: +18 defense. Each save/stop triggers +30 attack on next ball.", tacticTrigger: null },
      { id:"face_pressure", tags:["kontrolle","defensiv"],  name:"Face the Pressure",desc:"R6: +25 composure, opp shots -8% accuracy. Clutch nerves.", tacticTrigger: null }
    ]
  };

  // ─── Derive stage-2 evolution details from stage-1 definitions ────────────
  // Children inherit the parent's trait effect at +30% strength (applied at
  // dispatch time in traits/handlers), and add a stage-2 mastery trait whose
  // name/desc is generated from the parent label. This keeps stage-2 data
  // fully derivable — no hand-authored duplication.
  function deriveStage2Details() {
    const parents = Object.keys(DATA.evolutions);
    for (const parent of parents) {
      const kids = DATA.evolutions[parent];
      for (const kid of kids) {
        if (DATA.evoDetails[kid]) continue;
        const p = DATA.evoDetails[parent];
        if (!p) continue;

        const boosts = {};
        for (const [k, v] of Object.entries(p.boosts)) boosts[k] = Math.floor(v * 1.3);
        const idx = kids.indexOf(kid);
        const emphases = [
          ['offense', 'tempo'],
          ['defense', 'composure'],
          ['vision', 'composure']
        ][idx] || ['offense'];
        for (const e of emphases) boosts[e] = (boosts[e] || 0) + 5;

        const traitKey = `${kid}_mastery`;
        const emphasisLabels = {
          offense:"+Offense", defense:"+Defense", tempo:"+Tempo",
          vision:"+Vision", composure:"+Composure"
        };
        const descBits = emphases.map(e => emphasisLabels[e]).join(", ");
        DATA.traits[traitKey] = {
          name: `${capitalizeFirst(kid)} Meisterschaft`,
          desc: `Evolution aus ${p.label}: verstärkt ${descBits}. Trait des Vorgängers wirkt +30%.`
        };
        DATA.evoDetails[kid] = {
          role: p.role,
          label: capitalizeFirst(kid.replace(/_/g, ' ')),
          boosts,
          trait: traitKey,
          parentTrait: p.trait,
          inheritedFrom: parent
        };
      }
    }
  }
  deriveStage2Details();

  if (window.I18N) {
    window.I18N.decorateConfigData(DATA);
  }

  // ─── Highscore persistence ─────────────────────────────────────────────────
  const HIGHSCORE_KEY = 'kicklike_highscore_v1';

  function loadHighscore() {
    try {
      const raw = localStorage.getItem(HIGHSCORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // Outcome ranking — what counts as a "better" run end. Cup wins
  // beat league finishes; league finishes beat mid-table grinds.
  // Same outcome → fewer seasons = better (efficiency); then more
  // total points; then better goal-diff. Stops players from inflating
  // their score by sitting in mid-table forever.
  const OUTCOME_RANK = {
    cup_champion: 100,
    cup_runner_up: 80,
    champion: 60,         // league champion of pro
    promotion: 50,        // promoted (non-champion)
    survivor: 30,         // mid-table — finished safely
    safe: 30,             // legacy alias
    relegation: 20,       // relegated
    fired: 0              // ran out of options
  };

  function saveHighscore(entry) {
    try {
      const current = loadHighscore();
      if (!current || isHigherScore(entry, current)) {
        localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(entry));
        return true;
      }
      return false;
    } catch (e) { return false; }
  }

  // Comparison: runScore is the primary metric (post-v48). Falls back to
  // the old outcome-rank → seasons → points chain when runScore is missing
  // (legacy entries from older saves).
  function isHigherScore(a, b) {
    if (typeof a.runScore === 'number' && typeof b.runScore === 'number') {
      return a.runScore > b.runScore;
    }
    const aRank = OUTCOME_RANK[a.outcome] || 0;
    const bRank = OUTCOME_RANK[b.outcome] || 0;
    if (aRank !== bRank) return aRank > bRank;
    const aSeas = a.seasonsPlayed || 1;
    const bSeas = b.seasonsPlayed || 1;
    if (aSeas !== bSeas) return aSeas < bSeas;
    if ((a.points || 0) !== (b.points || 0)) return (a.points || 0) > (b.points || 0);
    return (a.goalDiff || 0) > (b.goalDiff || 0);
  }

  // Compute the run-score from a finished run's state. Bigger = better.
  // Formula prioritizes Cup outcomes (the run-end achievement), then
  // Pro promotion, then Amateur. Mid-table looping is mildly punished
  // via a per-season tax so a player who grinds 30 amateur seasons
  // doesn't out-score one who reached the cup in 3.
  function computeRunScore(s, outcome) {
    let score = 0;
    if (outcome === 'cup_champion')        score += 5000;
    else if (outcome === 'cup_runner_up')  score += 3000;
    if (outcome === 'promotion' || outcome === 'champion') {
      const tier = s._currentTier || 'amateur';
      if (tier === 'pro')          score += 2000;
      else if (tier === 'amateur') score += 800;
    }
    // Run-cumulative goals/wins (across all seasons within the run)
    score += (s._runTotalGoalsFor   || s.goalsFor   || 0) * 5;
    score += (s._runTotalWins       || s.wins       || 0) * 30;
    // Season-loop tax — discourages farming mid-table for points
    const seasons = s._seasonNumber || 1;
    score -= (seasons - 1) * 50;
    return Math.max(0, score);
  }

  function buildHighscoreEntry(stateLike, outcome) {
    const s = stateLike;
    return {
      // Headline: the new run-score (replaces raw seasonPoints as the
      // primary highscore metric). seasonPoints kept for context.
      runScore:       computeRunScore(s, outcome),
      points:         s.seasonPoints,
      wins:           s._runTotalWins || s.wins,
      draws:          s._runTotalDraws || s.draws,
      losses:         s._runTotalLosses || s.losses,
      goalsFor:       s._runTotalGoalsFor || s.goalsFor,
      goalsAgainst:   s._runTotalGoalsAgainst || s.goalsAgainst,
      goalDiff:       (s._runTotalGoalsFor || s.goalsFor) - (s._runTotalGoalsAgainst || s.goalsAgainst),
      matchesPlayed:  s.matchNumber,
      seasonsPlayed:  s._seasonNumber || 1,
      outcome,
      tier:           s._currentTier || 'amateur',
      teamName:       s.teamName,
      date:           new Date().toISOString().slice(0, 10)
    };
  }

  // ─── Namespace + legacy exports ────────────────────────────────────────────
  KL.config = { CONFIG, DATA, TACTIC_FIT, HIGHSCORE_KEY };
  KL.highscore = {
    load:       loadHighscore,
    save:       saveHighscore,
    buildEntry: buildHighscoreEntry
  };

  // Legacy bare-name exports
  Object.assign(window, {
    CONFIG, DATA, TACTIC_FIT,
    loadHighscore, saveHighscore, buildHighscoreEntry
  });
})();
