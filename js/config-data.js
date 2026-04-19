const CONFIG = {
  runLength: 15,
  rounds: 6,
  teamSize: 5,
  maxBench: 2,
  evolutionLevels: [4, 7, 10],
  xpPerWin: 4,
  xpPerDraw: 2,
  xpPerLoss: 1,
  bossMatches: [5, 10, 15],
  attackBase: 0.38,
  attackStatScale: 0.006,
  defenseStatScale: 0.005,
  tempoAdvantage: 0.04,
};
const DATA = {
  roles: [
    { id: "TW", label: "Keeper",     focusStat: "defense", desc: "Hält im 1-vs-1" },
    { id: "VT", label: "Verteidiger",focusStat: "defense", desc: "Bollwerk" },
    { id: "PM", label: "Playmaker",  focusStat: "vision",  desc: "Orchestriert Spielzüge" },
    { id: "LF", label: "Läufer",     focusStat: "tempo",   desc: "Chaos-Faktor" },
    { id: "ST", label: "Stürmer",    focusStat: "offense", desc: "Abschluss" }
  ],
  archetypes: {
    "keeper_block":    { role:"TW", label:"Block-Keeper",  stats:{ offense:20, defense:75, tempo:50, vision:55, composure:70 } },
    "keeper_sweep":    { role:"TW", label:"Sweeper-Keeper",stats:{ offense:35, defense:65, tempo:60, vision:65, composure:60 } },
    "keeper_reflex":   { role:"TW", label:"Reflex-Keeper", stats:{ offense:15, defense:70, tempo:65, vision:50, composure:65 } },
    "def_wall":        { role:"VT", label:"Betonwand",    stats:{ offense:25, defense:80, tempo:40, vision:45, composure:70 } },
    "def_tackle":      { role:"VT", label:"Beißer",       stats:{ offense:35, defense:70, tempo:60, vision:50, composure:55 } },
    "def_sweeper":     { role:"VT", label:"Libero",       stats:{ offense:45, defense:65, tempo:55, vision:65, composure:65 } },
    "pm_regista":      { role:"PM", label:"Regista",       stats:{ offense:50, defense:40, tempo:50, vision:80, composure:70 } },
    "pm_press":        { role:"PM", label:"Presser",       stats:{ offense:55, defense:55, tempo:65, vision:60, composure:50 } },
    "pm_playmaker":    { role:"PM", label:"Spielmacher",   stats:{ offense:55, defense:35, tempo:55, vision:75, composure:65 } },
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
      difficulty: 1,
      difficultyLabel: "Einsteiger",
      lineup: ["keeper_block", "def_sweeper", "pm_regista", "lf_winger", "st_poacher"],
      signatureTactics: { kickoff:["counter"], halftime:["counter_h"], final:["sneaky"] },
      tacticTags: { konter:3, tempo:2, defensiv:2 }
    },
    {
      id: "kraft",
      name: "Kraftpaket",
      theme: "physisch, Kopfbälle, Zermürbung",
      color: "#ffd23a",
      desc: "Gewinnt durch pure Physis. Besonders stark spät im Match.",
      difficulty: 2,
      difficultyLabel: "Moderat",
      lineup: ["keeper_block", "def_wall", "pm_regista", "lf_box", "st_target"],
      signatureTactics: { kickoff:["defensive"], halftime:["stabilize"], final:["park_bus"] },
      tacticTags: { defensiv:3, physisch:2, kontrolle:1 }
    },
    {
      id: "technik",
      name: "Technik-Magier",
      theme: "vision-basiert, Kombos über Pässe",
      color: "#aaff2a",
      desc: "Baut Angriffe aus dem Nichts. Langsam, aber präzise.",
      difficulty: 3,
      difficultyLabel: "Fordernd",
      lineup: ["keeper_reflex", "def_sweeper", "pm_playmaker", "lf_box", "st_false9"],
      signatureTactics: { kickoff:["possession"], halftime:["vision_play"], final:["midfield"] },
      tacticTags: { ballbesitz:3, technik:2, vision:2 }
    },
    {
      id: "pressing",
      name: "Pressing-Bestien",
      theme: "aggressiv, brechen Gegner-Aufbau",
      color: "#ff3c6e",
      desc: "Zwingt Fehler mit permanentem Druck. Risikofußball mit schwachen Nerven.",
      difficulty: 4,
      difficultyLabel: "Experte",
      lineup: ["keeper_sweep", "def_tackle", "pm_press", "lf_dribbler", "st_false9"],
      signatureTactics: { kickoff:["pressing"], halftime:["high_press"], final:["final_press"] },
      tacticTags: { pressing:3, aggressiv:2, tempo:1 }
    }
  ],
  opponents: {
    prefixes: ["SC ", "FC ", "VfL ", "TSV ", "BSG ", "Dynamo ", "Eintracht ", "Wacker ", "Rot-Weiß ", "Alemannia "],
    places:   ["Nachtwald", "Sturmhof", "Kaltenfels", "Eisental", "Rauhbruck", "Donnerberg", "Windheim",
               "Eisstorm", "Rabenfeld", "Schattental", "Feuerhorn", "Nebelburg", "Ödland", "Blutfels", "Gewitterhain"],
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
    { id:"aggressive",  tags:["aggressiv"],          name:"Aggressiver Start",  desc:"+6 Offense für Runden 1-3, -4 Defense."        },
    { id:"defensive",   tags:["defensiv"],           name:"Defensiver Start",   desc:"+6 Defense für Runden 1-3, -4 Offense."        },
    { id:"balanced",    tags:["kontrolle"],          name:"Ausgewogen",         desc:"+3 auf alle Stats für Runden 1-3."             },
    { id:"tempo",       tags:["tempo"],              name:"Tempo-Spiel",        desc:"+8 Tempo für Runden 1-3, -3 Composure."        },
    { id:"pressing",    tags:["pressing","aggressiv"], name:"Pressing",         desc:"+5 Defense und +4 Tempo für Runden 1-3."       },
    { id:"possession",  tags:["ballbesitz","vision"], name:"Ballbesitz",        desc:"+6 Vision und +4 Composure für Runden 1-3."    },
    { id:"counter",     tags:["konter","defensiv"],  name:"Konter-Lauer",       desc:"+8 Defense, +4 Tempo für Runden 1-3, -2 Off."  },
    { id:"flank_play",  tags:["tempo","technik"],    name:"Flügelspiel",        desc:"+5 Tempo und +5 Offense für Runden 1-3."       }
  ],
  halftimeOptions: [
    { id:"push",        tags:["aggressiv"],          name:"Risiko",             desc:"+8 Offense für Runden 4-6, -6 Defense."        },
    { id:"stabilize",   tags:["defensiv","kontrolle"], name:"Stabilisieren",    desc:"+6 Defense und +4 Composure für Runden 4-6."   },
    { id:"shift",       tags:["technik"],            name:"Umstellen",          desc:"Ein Spieler erhält permanent +10 auf Fokusstat." },
    { id:"rally",       tags:["physisch","aggressiv"], name:"Mobilisieren",     desc:"Pro kassiertem Tor: +3 Off; pro eigenem: +3 Def." },
    { id:"reset",       tags:["kontrolle"],          name:"Neu sortieren",      desc:"+5 auf alle Stats für Runden 4-6."             },
    { id:"counter_h",   tags:["konter","tempo"],     name:"Auf Konter",         desc:"+10 Tempo und +5 Defense für Runden 4-6."      },
    { id:"high_press",  tags:["pressing"],           name:"Hohes Pressing",     desc:"+8 Defense für Runden 4-6, -3 Composure."      },
    { id:"vision_play", tags:["ballbesitz","vision"], name:"Spiel öffnen",      desc:"+8 Vision und +4 Offense für Runden 4-6."      }
  ],
  finalOptions: [
    { id:"all_in",      tags:["aggressiv"],          name:"All-In",             desc:"Letzte Runde: +15 Offense, -15 Defense."       },
    { id:"park_bus",    tags:["defensiv"],           name:"Bus parken",         desc:"Letzte Runde: +15 Defense, -10 Offense."       },
    { id:"hero_ball",   tags:["technik"],            name:"Held des Tages",     desc:"Ein zufälliger Spieler: permanent +20 Fokus-Stat." },
    { id:"keep_cool",   tags:["kontrolle","vision"], name:"Cool bleiben",       desc:"Letzte Runde: +8 Composure und +5 Vision."     },
    { id:"final_press", tags:["pressing"],           name:"Schlusspressing",    desc:"Letzte Runde: +10 Tempo und +8 Defense, -5 Off." },
    { id:"long_ball",   tags:["physisch","aggressiv"], name:"Lange Bälle",      desc:"Letzte Runde: +12 Offense, -5 Vision."         },
    { id:"midfield",    tags:["ballbesitz","kontrolle"], name:"Mittelfeldkontrolle", desc:"Letzte Runde: +8 Vision, +6 Tempo, +6 Composure." },
    { id:"sneaky",      tags:["konter","defensiv"],  name:"Hinterhalt",         desc:"Letzte Runde: +12 Defense, +8 Tempo, -8 Offense." }
  ]
};
function deriveStage2Details() {
  const parents = Object.keys(DATA.evolutions);
  for (const parent of parents) {
    const kids = DATA.evolutions[parent];
    for (const kid of kids) {
      if (DATA.evoDetails[kid]) continue;
      const p = DATA.evoDetails[parent];
      if (!p) continue;
      const boosts = {};
      for (const [k,v] of Object.entries(p.boosts)) boosts[k] = Math.floor(v * 1.3);
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
        label: capitalizeFirst(kid.replace(/_/g,' ')),
        boosts,
        trait: traitKey,
        parentTrait: p.trait,
        inheritedFrom: parent
      };
    }
  }
}
function capitalizeFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
deriveStage2Details();
const HIGHSCORE_KEY = 'kicklike_highscore_v1';

function loadHighscore() {
  try {
    const raw = localStorage.getItem(HIGHSCORE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) { return null; }
}

function saveHighscore(entry) {
  try {
    const current = loadHighscore();
    if (!current || entry.points > current.points ||
        (entry.points === current.points && entry.goalDiff > current.goalDiff)) {
      localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(entry));
      return true;
    }
    return false;
  } catch(e) { return false; }
}

function buildHighscoreEntry(state, outcome) {
  return {
    points: state.seasonPoints,
    wins: state.wins,
    draws: state.draws,
    losses: state.losses,
    goalsFor: state.goalsFor,
    goalsAgainst: state.goalsAgainst,
    goalDiff: state.goalsFor - state.goalsAgainst,
    matchesPlayed: state.matchNumber,
    outcome,
    teamName: state.teamName,
    date: new Date().toISOString().slice(0, 10)
  };
}
let state = null;

function freshState() {
  return {
    run: 1,
    matchNumber: 0,
    wins: 0, losses: 0, draws: 0,
    roster: [],
    lineupIds: [],
    matchHistory: [],
    currentOpponent: null,
    currentMatch: null,
    startedAt: Date.now(),
    teamName: '',
    teamColor: '',
    pendingRecruit: false,
    seasonPoints: 0,
    currentLossStreak: 0,
    goalsFor: 0,
    goalsAgainst: 0
  };
}
function getLineup() {
  return state.lineupIds.map(id => state.roster.find(p => p.id === id)).filter(Boolean);
}
function getBench() {
  return state.roster.filter(p => !state.lineupIds.includes(p.id));
}
function isLineupValid(ids) {
  if (ids.length !== CONFIG.teamSize) return false;
  const players = ids.map(id => state.roster.find(p => p.id === id)).filter(Boolean);
  if (players.length !== CONFIG.teamSize) return false;
  const keepers = players.filter(p => p.role === 'TW').length;
  if (keepers !== 1) return false;
  return true;
}
const rand   = () => Math.random();
const randi  = (a,b) => Math.floor(rand()*(b-a+1))+a;
const pick   = arr => arr[Math.floor(rand()*arr.length)];
const pickN  = (arr, n) => {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
};

window.CONFIG = CONFIG;
window.DATA = DATA;
window.loadHighscore = loadHighscore;
window.saveHighscore = saveHighscore;
window.buildHighscoreEntry = buildHighscoreEntry;
window.freshState = freshState;
