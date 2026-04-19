I18N.registerLocale('de', {
  ui: {
    meta: { title: 'KICKLIKE · 5-Mann-Autobattler' },
    start: {
      tagline: '> 5-mann-autobattler_',
      sub: '15 matches · 4 starter-teams · emergente synergien',
      newRun: '▶ Neuer Run',
      howTitle: 'So funktioniert\'s:',
      howBody: 'Wähle ein Starter-Team aus 4 Konzepten. Jeder deiner 5 Spieler evolviert über den Run in einen von 3 Pfaden. Matches laufen als Auto-Battle, aber an 3 Schlüsselpunkten entscheidest du die Richtung. Traits triggern sich gegenseitig. Sammle Punkte (3 pro Sieg, 1 pro Unentschieden), vermeide 3 Niederlagen in Folge. Ziel: 36+ Punkte = Champion, 24+ Punkte = Klasse gehalten.'
    },
    draft: {
      title: 'Wähle dein Starter-Team',
      body: 'Jedes Team hat ein Thema, eine Stärke und einen Schwachpunkt. Identität entwickelst du später durch Evolutionen.'
    },
    hub: {
      yourTeam: 'Dein Team',
      opponent: 'Gegner',
      squad: 'Kader',
      bench: 'Bank',
      lineup: '⚙ Aufstellung',
      startMatch: '▶ Match starten'
    },
    lineup: {
      title: 'AUFSTELLUNG',
      tapToSwap: 'Tippe Spieler zum Tauschen',
      defaultHint: 'Klicke einen Startelf-Spieler, dann einen Bank-Spieler um zu tauschen. Keeper (TW) ist Pflicht.',
      starters: 'Startelf',
      bench: 'Bank',
      done: '✓ Fertig'
    },
    recruit: {
      title: 'LEGENDÄRER PICK',
      subtitle: '> boss besiegt — ein neuer held wählt deinen verein_',
      body: 'Wähle einen Spieler. Er landet auf deiner Bank — maximal 2 Bank-Slots.',
      decline: 'Ablehnen'
    },
    match: {
      pause: '⏸ Pause',
      resume: '▶ Weiter',
      speed: '⏩ Speed',
      fast: '⏩ Schnell'
    },
    result: {
      win: 'SIEG',
      loss: 'NIEDERLAGE',
      draw: 'UNENTSCHIEDEN',
      continue: '▶ Weiter',
      analysis: 'Match-Bilanz',
      players: 'Spieler-Bilanz'
    },
    gameover: { title: 'GAME OVER' },
    victory: { survived: '15 matches survived' },
    labels: {
      power: 'Power',
      standard: 'Standard',
      hotStreak: 'HEISSER LAUF',
      goodForm: 'Gute Form',
      crisis: 'KRISE',
      badForm: 'Schlechte Form',
      losingWarning: '⚠ 2 Niederlagen in Folge — nächste = Trainer entlassen!',
      noBench: 'Keine Bank-Spieler — gewinne einen Boss!',
      swapSelected: '→ {name} ausgewählt. Klicke einen anderen Spieler um zu tauschen.',
      swapRejected: 'Swap abgelehnt: Aufstellung bräuchte genau 1 Keeper.',
      benchSlots: '{count} / {max} Plätze',
      highscore: '✦ BESTWERT: {points} PKT · {wins}S-{draws}U-{losses}N · {outcome} ✦',
      outcomeChampion: 'Champion',
      outcomeSurvivor: 'Klasse gehalten',
      outcomeFired: 'Entlassen',
      compactTeamMeta: '{lineup} + {bench}B',
      matchLabel: 'Match {num}: {me}:{opp} vs {name}'
    },
    statsPanel: {
      possession: 'Ballbesitz',
      shots: 'Schüsse',
      accuracy: 'Präzision',
      buildup: 'Aufbau-%',
      saves: 'Paraden',
      goals: 'Tore',
      abilitiesTriggered: 'Fähigkeiten gefeuert',
      currentTeamStats: 'Team-Werte (aktuell)',
      own: 'Eigen',
      diff: 'Diff',
      opponent: 'Gegner',
      buffsFootnote: 'Buffs addieren sich über Kickoff + Halbzeit + Finale'
    },
    evolution: {
      title: 'EVOLUTION!',
      reachedLevel: '{name} ({role}) erreicht Level {level}',
      traitLabel: 'Fähigkeit: {name}',
      keepsTrait: 'behält: {name} (+30%)'
    },
    flow: {
      lineupIncomplete: 'Aufstellung unvollständig! Bitte 5 Spieler wählen.',
      benchFull: 'Bank ist voll!',
      lineupInvalid: 'Aufstellung ungültig! Du brauchst genau 1 Keeper und 5 Spieler insgesamt.',
      kickoffTitle: 'Kickoff-Taktik',
      kickoffSubtitle: 'Wie starten?',
      halftimeTitle: 'Halbzeit-Anpassung',
      scoreSubtitle: 'Stand: {me}:{opp}',
      finalTitle: 'Finale Entscheidung',
      roundScoreSubtitle: 'Runde 6 — Stand: {me}:{opp}',
      reward: 'Ø {avg} XP/Spieler — Performance-basiert',
      gameOverStreak: '3 Niederlagen in Folge — Trainer entlassen!',
      gameOverLosses: '{losses} Niederlagen angesammelt — Saisonabbruch.',
      safe: 'KLASSE GEHALTEN',
      rescued: 'KNAPP GERETTET',
      points: '{points} PUNKTE',
      record: '✦ NEUER REKORD ✦',
      bestScore: 'Bestwert: {points} Pkt ({team})',
      afterMatches: '{points} Punkte nach {matches} Spielen',
      bestRun: '✦ Neue Bestleistung ✦'
    },
    perf: {
      buildups: '{ok}/{all} Aufbauten',
      defenses: '{count} Abwehren',
      keeper: '{saves} Paraden  {conceded} kassiert'
    },
    log: {
      opponentIntro: '  ↳ Gegner: {parts}',
      kickoffChoice: '  → Kickoff: {name}',
      halftimeHeader: '––– HALBZEIT –––',
      halftimeChoice: '  → Halbzeit: {name}',
      finalChoice: '  → Finale: {name}',
      possessionPressure: '  Ballbesitz: {pct}% — Druckphase',
      possessionDominated: '  Ballbesitz: {pct}% — Gegner dominiert',
      chainAttack: '  ⚡ Chain-Angriff!',
      luckyDouble: '  🍀 {name} hat Glück — Doppelangriff!',
      counter: '  🔁 Konter!',
      laserPass: '🎯 {name} LASER-PASS — Konter eingeleitet!',
      bulldoze: '🛡 {name} BULLDOZE — Ballgewinn + Konter!',
      hardTackle: '🥾 {name} HARTES TACKLING — Konter!',
      chessPredict: '♟ {name} CHESS PREDICT — Gegnertor vorhergesehen!',
      speedBurst: '💨 {name} SPEED BURST — Aufbau garantiert!',
      pounce: '🐆 {name} HETZJAGD — sofort-Konter!',
      oppBlitzCounter: '  ⚡ {name} kontert blitzschnell!',
      shadowStrike: '{name} SCHATTENSCHLAG - versteckter Angriff!',
      streetTrick: '{name} STREET-TRICK - Verteidiger ausgespielt!',
      silentKiller: '{name} SILENT KILLER - erster Schuss verstaerkt!',
      cannonBlast: '{name} KANONENSCHUSS!',
      ghostRun: '{name} GEISTERLAUF - versteckte Chance!',
      puzzleConnect: '{name} PUZZLE VERBUNDEN!',
      nineLives: '🐱 {name} NEUN LEBEN — Tor annulliert!',
      killerPass: '⚡ {name} KILLER-PASS — nächste Runde Chain!',
      maestroCombo: '🎼 {name} MAESTRO-COMBO — nächstes Tor zählt doppelt!',
      unstoppable: '🚀 {name} UNAUFHALTBAR — Tor ohne Gegenwehr!',
      godMode: '⭐ {name} GOD MODE — nächstes Tor x3!',
      unbreakable: '🛡 {name} UNZERBRECHLICH — Tor annulliert!',
      roundHeader: 'RUNDE {round}',
      ownGoal: '⚽ TOR {name}!{suffix}   {me}:{opp}',
      oppGoal: '💥 Gegentor — {name} trifft   {me}:{opp}',
      fullTime: '🏁 ABPFIFF — {me}:{opp}',
      penaltiesIntro: '🏁 90 MIN. VORBEI — {me}:{opp}',
      penaltiesTitle: '⚽ ELFMETERSCHIESSEN — kein Unentschieden in der letzten Partie!',
      penaltyScored: '  {num}. ⚽ verwandelt — {me}:{opp}',
      penaltyMissed: '  {num}. ⚠ vorbei — {me}:{opp}',
      oppPenaltyScored: '  {name} trifft — {me}:{opp}',
      oppPenaltyMissed: '  {name} verschießt — {me}:{opp}',
      suddenDeath: '  Sudden Death: {me}:{opp}',
      penaltiesWin: '🏆 SIEG IM ELFMETERSCHIESSEN',
      penaltiesLoss: '💥 NIEDERLAGE IM ELFMETERSCHIESSEN'
    }
  },
  stats: {
    offense: 'Angriff',
    defense: 'Abwehr',
    tempo: 'Tempo',
    vision: 'Übersicht',
    composure: 'Nerven'
  },
  generated: {
    masteryName: '{label} Meisterschaft',
    masteryDesc: 'Evolution aus {parent}: verstärkt {stats}. Trait des Vorgängers wirkt +30%.'
  },
  logs: {
    ownBuildFail: [
      '{pm} verliert den Ball im Mittelfeld',
      'Gegner fängt den Pass von {pm} ab',
      'Fehlpass von {vt} — Konter droht',
      '{pm}s Vertikalpass gerät zu lang',
      'Pressing zwingt {pm} zum Rückpass',
      'Ballverlust an der Mittellinie'
    ],
    ownBuildSuccess: [
      '{pm} öffnet das Mittelfeld mit einem Steilpass',
      '{pm} findet den Weg durch die Linien',
      'Schneller Doppelpass zwischen {pm} und {lf}',
      '{pm} spielt diagonal auf die Außenbahn',
      '{lf} zieht auf der Flanke durch',
      '{vt} eröffnet stark — {pm} nimmt auf',
      '{pm} treibt den Ball ins letzte Drittel'
    ],
    chance: [
      '{scorer} kommt zum Abschluss...',
      '{scorer} setzt sich im Strafraum durch...',
      '{scorer} hat die Chance...',
      '{scorer} lauert vorm Tor...',
      '{scorer} wird im Strafraum angespielt...'
    ],
    miss: [
      '{scorer} zielt knapp vorbei',
      '{scorer} trifft nur den Pfosten!',
      'Abschluss von {scorer} zu zentral — Keeper hält',
      '{scorer} schießt drüber',
      '{scorer}s Schuss wird im letzten Moment geblockt',
      '{scorer} verzieht — Chance vertan',
      '{scorer} trifft die Latte!'
    ],
    oppBuildFail: [
      '{opp} verliert den Ball im Aufbau',
      '{opp}s Pass landet im Niemandsland',
      '{vt} fängt ab',
      '{opp} wird beim Aufbau gestört',
      'Gegen-Pressing zwingt {opp} zum Fehler'
    ],
    oppApproach: [
      '{opp} kommt über die Flanke',
      '{opp} zieht das Spiel schnell vor',
      '{opp} sucht den Abschluss',
      'Gegner-Stürmer enteilt der Abwehr',
      '{opp} spielt sich durchs Mittelfeld'
    ],
    save: [
      '{tw} pariert stark!',
      '{tw} fängt sicher ab',
      '{vt} blockt den Schuss im letzten Moment',
      'Schuss zu ungenau — {tw} hat ihn',
      '{tw} hält mit Glanzparade!',
      'Kopfball neben das Tor'
    ]
  },
  data: {
    evoLabels: {
      titan: 'Titan',
      fortress: 'Festung',
      shotstopper: 'Shotstopper',
      libero_keeper: 'Libero-Keeper',
      distributor: 'Dirigent',
      highline: 'High-Liner',
      acrobat: 'Akrobat',
      wall: 'Mauer',
      catman: 'Katze',
      enforcer: 'Enforcer',
      bulldozer: 'Bulldozer',
      captain_cool: 'Käpt’n',
      shark: 'Hai',
      terminator: 'Terminator',
      whirlwind: 'Wirbelwind',
      orchestrator: 'Dirigent',
      late_bloomer: 'Spätzünder',
      scholar: 'Scholar',
      metronome: 'Metronom',
      architect: 'Architekt',
      whisperer: 'Flüsterer',
      hunter: 'Jäger',
      gegenpress: 'Gegenpresser',
      shadow: 'Schatten',
      maestro_mid: 'Maestro',
      chess: 'Schachmeister',
      conductor_mid: 'Dirigent',
      speedster: 'Speedster',
      rocket: 'Rakete',
      freight: 'Güterzug',
      magician: 'Magier',
      street: 'Straßenfußballer',
      trickster: 'Trickser',
      ironman: 'Ironman',
      dynamo: 'Dynamo',
      eternal: 'Ewige',
      assassin: 'Assassin',
      predator_s: 'Raubtier',
      opportunist: 'Opportunist',
      cannon: 'Kanone',
      skyscraper: 'Wolkenkratzer',
      brick: 'Brecher',
      ghost: 'Geist',
      puzzle: 'Puzzle',
      chameleon: 'Chamäleon'
    },
    starterTeams: {
      konter: { name: 'Konter-Spezialisten', theme: 'schnell, defensiv, bestraft Gegner-Fehler', desc: 'Stark im Mittelfeld und auf dem Flügel. Tor durch Tempo-Übergang.', difficultyLabel: 'Einsteiger' },
      kraft: { name: 'Kraftpaket', theme: 'physisch, Kopfbälle, Zermürbung', desc: 'Gewinnt durch pure Physis. Besonders stark spät im Match.', difficultyLabel: 'Moderat' },
      technik: { name: 'Technik-Magier', theme: 'vision-basiert, Kombos über Pässe', desc: 'Baut Angriffe aus dem Nichts. Langsam, aber präzise.', difficultyLabel: 'Fordernd' },
      pressing: { name: 'Pressing-Bestien', theme: 'aggressiv, brechen Gegner-Aufbau', desc: 'Zwingt Fehler mit permanentem Druck. Risikofußball mit schwachen Nerven.', difficultyLabel: 'Experte' }
    },
    opponents: {
      prefixes: ['SC ', 'FC ', 'VfL ', 'TSV ', 'BSG ', 'Dynamo ', 'Eintracht ', 'Wacker ', 'Rot-Weiß ', 'Alemannia '],
      places: ['Nachtwald', 'Sturmhof', 'Kaltenfels', 'Eisental', 'Rauhbruck', 'Donnerberg', 'Windheim', 'Eissturm', 'Rabenfeld', 'Schattental', 'Feuerhorn', 'Nebelburg', 'Ödland', 'Blutfels', 'Gewitterhain'],
      specials: {
        offensive: 'Offensiv-Fokus',
        defensive: 'Bollwerk',
        pacey: 'Temposchnell',
        cerebral: 'Taktiker',
        stoic: 'Eisenhart',
        balanced: 'Ausgewogen'
      }
    },
    teamNamePools: {
      konter: {
        first: ['Fox','Jet','Ash','Kai','Zed','Rex','Vex','Nyx','Rook','Swift','Blaze','Corvo','Dash','Echo','Ravi','Slate','Volt','Zane','Kit','Milo'],
        last: ['Sharp','Cross','Dash','Skye','Reeve','Blaze','Quinn','Striker','Fall','Rush','Edge','Swift','Hale','Stryder','Vortex','Flicker','Cipher']
      },
      pressing: {
        first: ['Grim','Vargr','Krag','Brax','Thor','Raze','Grunt','Bjorn','Krogh','Ulf','Magnus','Ragnar','Brokk','Vidar','Harald','Ivor','Orin','Knut'],
        last: ['Bulk','Crush','Wolf','Blood','Steel','Fang','Claw','Bane','Hammer','Iron','Stone','Mauler','Tusk','Growl','Graf','Forge','Grimwald']
      },
      technik: {
        first: ['Luca','Nico','Rafa','Mateo','Dante','Enzo','Alessio','Marco','Giovani','Xavi','Theo','Renzo','Leandro','Diego','Seb','Liam','Silas'],
        last: ['Bellucci','Corelli','Ferrando','Moretti','Salvatore','Laurent','Rossi','Valenti','Monti','Rinaldi','Serra','Piazza','Viale','Lionheart','Delacroix']
      },
      kraft: {
        first: ['Bernd','Horst','Reinhold','Klaus','Kurt','Manfred','Detlef','Siegfried','Hartmut','Werner','Friedhelm','Heinrich','Günter','Egon','Rolf','Ulli'],
        last: ['Donnerberg','Eisenfaust','Steinbruck','Stahlhammer','Sturmwald','Rabenhorst','Wolfsberg','Ackermann','Rothmann','Schmied','Gruber','Bollwerk','Hartstein']
      }
    },
    legendaryNames: ['Nikolaus Vega','Rasmus Orth','Idris Storm','Jago Sand','Milo Rivera','Octavian Kross','Darian Lux','Suren Vex','Leon Trax','Rune Kainz','Ashe Quandt','Zephyr Böhm','Malik Kroos','Nils Falk','Sovereign Reinhardt','Maksim Thoma']
  }
});
