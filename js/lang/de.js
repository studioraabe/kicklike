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
      startMatch: '▶ Match starten',
      bossTag: 'BOSS',
      suspendedAlert: '{name} ist für dieses Match gesperrt',
      suspendedAlertTooltip: '{name}: Rote Karte im letzten Match. Noch {n} Spiele Sperre. Vor dem Start muss ein Bank-Spieler eingewechselt werden.'
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
      players: 'Spieler-Bilanz',
      sacrificeNote: '⚠ {name} hat alles gegeben — dauerhafter Stat-Verlust.',
      hlOverperform:  'Über Erwartung (vor Match: {pre}% Sieg)',
      hlUnderperform: 'Unter Erwartung (vor Match: {pre}% Sieg)',
      decisionsTitle: 'Deine Entscheidungen',
      decisionsSum:   'Summe',
      matchFlowTitle: 'Match-Verlauf',
      matchFlowHint:  'Entwicklung der Team-Werte während des Matches (Buffs, Form, Traits).',
      decisionPhase: {
        kickoff:  'Start',
        halftime: 'Halbzeit',
        final:    'Finale'
      }
    },
    prob: {
      win:  'Sieg',
      draw: 'Remis',
      loss: 'Niederlage',
      currentWin: 'Aktuelle Siegchance'
    },
    scorecard: {
      threat: 'GEFAHR',
      edge:   'VORTEIL',
      off:    'OFF',
      def:    'DEF',
      tmp:    'TMP',
      vis:    'VIS',
      cmp:    'CMP',
      traitActivity: '~{n} Trait-Trigger erwartet · {p} Passive aktiv',
      edgeTooltip:   'Deine Vorteile: Traits, die gegen diesen Gegner wirken, plus Stat-Überhang. Unabhängig von Gefahr — beide können hoch sein.',
      threatTooltip: 'Gefahr durch Gegner: ihre Traits, die dein Team treffen, plus rohe Power-Differenz. Unabhängig von Vorteil — beide können hoch sein.'
    },
    cards: {
      yellow: 'Gelbe Karte — eine weitere in diesem Match = Platzverweis und Sperre für das nächste Match.',
      secondYellow: 'Gelb-Rot — Platzverweis in diesem Match, gesperrt fürs nächste.',
      red: 'Rote Karte — Platzverweis in diesem Match, gesperrt fürs nächste.',
      suspendedNext: 'Gesperrt — kann im nächsten Match nicht aufgestellt werden.',
      academyTooltip: 'Aushilfe aus der Akademie — temporärer Ersatz, deutlich schwächere Werte, keine Traits. Verlässt das Team nach diesem Match.'
    },
    decisions: {
      // Focus-Keys entfernt — Focus-System deprecated.
    },
    optionBadges: {
      fitsSquad: 'PASST',
      risky:    'GEWAGT',
      synergy:  'SYNERGIE ×{mult}',
      conflict: 'KONFLIKT ×{mult}',
      synergyShort:  'SYNERGIE',
      conflictShort: 'KONFLIKT'
    },
    optionHints: {
      scalesDeficit: '↑ wächst mit deinem Rückstand',
      scalesLead:    '↑ wächst mit deiner Führung'
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
      matchLabel: 'Match {num}: {me}:{opp} vs {name}',
      bossTell: 'Bosskampf — alle Stats erhöht, kein Fehler erlaubt',
      academy: 'AUSHILFE'
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
    eventReasons: {
      strikerMisses: '{name} hat {n} Chancen liegen gelassen — die Körpersprache ist zerrissen.',
      keeperStreak: '{name} hat {n} Paraden in Serie — auf Betriebstemperatur.',
      oppStrikerMisses: 'Ihr Stürmer {name} hat {n} Chancen vergeben — zerbricht unter Druck.',
      concededStreak: '{conceded} in Folge kassiert — sofort reagieren.',
      hotCorridor: '{name} bricht auf dem Flügel einmal nach dem anderen durch.',
      oppPmStreak: 'Ihr Spielmacher {name} hat {n} saubere Aufbauten aneinandergereiht.',
      heatedMoment: 'Gemüter erhitzt — gleich fliegen Karten.',
      loose: '{name} ist durchgebrochen — jemand muss entscheiden.',
      clearChance: '{name} hat Ball, Winkel und freies Tor vor sich.',
      oppTacticSwitch: '{opp} stellt auf hohes Pressing um — ihr Trainer reagiert.',
      playmakerPulse: '{name} diktiert den Rhythmus. Moment zum Zuschlagen.',
      oppKeeperRattled: '{name} wackelt. Eine weitere Aktion kann ihn umwerfen.',
      backlineStepUp: '{name} liest das Spiel immer besser — die Abwehr kann jetzt diktieren.',
      redCardRisk: '{name} ist aufgeheizt — eine schlechte Grätsche und der Abend ist rum.',
      weatherRain: 'Regen setzt ein — der Rasen wird schwer, lange Bälle unberechenbar.',
      weatherWind: 'Böiger Wind — lange Bälle werden zur Lotterie.',
      weatherHeat: 'Die Hitze ist brutal — die Beine werden schwer.',
      fanRevolt: 'Pfiffe von den Rängen nach dem {opp}:{me}-Rückstand.',
      oppStarDown: '{name} humpelt vom Platz — ihr Schlüsselspieler scheint raus.',
      coachWhisperDirect: 'Co-Trainer ins Ohr: „Schluss mit Aufbau, direkt nach vorn."',
      coachWhisperPatient: 'Co-Trainer ins Ohr: „Spiel verlangsamen, auseinandernehmen."',
      setPieceAwarded: 'Foul kurz vor dem Strafraum — goldene Standard-Chance.',
      legsGone: 'Schwere Beine vom frühen Tempo — das Team braucht Rhythmus, keine Sprints.',
      tacticalClashPressing: 'Euer Pressing läuft in ihre Nerven-Wand — kostet Form.',
      tacticalClashPossession: 'Ihr Tempo durchbricht euer Ballbesitz-Spiel — sie sind schon im Konter.',
      refereeStern: 'Der Schiri pfeift heute schnell — jedes Duell ist ein Risiko.'
    },
    events: {
      striker_frustrated: {
        title: 'Stürmer frustriert',
        subtitle: '{name} hat {n} Chancen vergeben — die Körpersprache stimmt nicht mehr.',
        option_layoff_pm: {
          name: 'Ablegen zum Spielmacher',
          desc: 'Spielmacher-getrieben: Torschütze zwangsweise ST, Bonus skaliert mit PM-Vision.'
        },
        option_push_through: {
          name: 'Durchziehen',
          desc: '+14% auf {name}s nächsten Schuss. Vertrau ihm, den Bann zu brechen.'
        },
        option_swap_off: {
          name: 'Auswechseln',
          desc: 'Frischer Stürmer von der Bank. Serie zurückgesetzt, Chemie leidet.'
        }
      },
      keeper_in_zone: {
        title: 'Keeper heiß',
        subtitle: '{name} hat {n} Paraden in Folge — absolut in Form.',
        option_launch_counter: {
          name: 'Sofort kontern',
          desc: 'Sofortangriff mit +22% Bonus. Momentum nutzen.'
        },
        option_stay_solid: {
          name: 'Stabil bleiben',
          desc: '+12% auf nächste Parade. Clean Sheet weiterführen.'
        }
      },
      opp_striker_frustrated: {
        title: 'Sie sind verunsichert',
        subtitle: 'Ihr Stürmer {name} hat {n} Chancen vergeben — zerbricht unter dem Druck.',
        option_press_high: {
          name: 'Hoch pressen',
          desc: '-18% Gegner-Schusspräzision für 2 Runden. Fester zudrücken.'
        },
        option_guard_desperate: {
          name: 'Verzweifelten Schuss absichern',
          desc: '+20% auf nächste Parade. Frustrierte Stürmer ziehen wild ab.'
        }
      },
      momentum_shift: {
        title: 'Momentum kippt',
        subtitle: '{conceded} in Folge kassiert — jetzt muss sich was ändern.',
        option_timeout: {
          name: 'Auszeit-Ansprache',
          desc: '+12 Composure, +6 Defense Rest des Matches. Team beruhigen.'
        },
        option_switch_tactic: {
          name: 'System umstellen',
          desc: 'Defensive Konter-Haltung. Auto-Konter 2 Runden aktiv.'
        }
      },
      hot_corridor: {
        title: 'Heißer Flügel',
        subtitle: '{name} bricht immer wieder auf dem Flügel durch.',
        option_double_down: {
          name: 'Auf dem Flügel nachlegen',
          desc: '{name} bekommt den nächsten Schuss mit +15% Bonus. Flanken-Läufe ausgedehnt.'
        },
        option_switch_center: {
          name: 'Ins Zentrum wechseln',
          desc: '+14 Vision, +6 Offense. Überraschung durchs Zentrum.'
        }
      },
      opp_pm_dirigent: {
        title: 'Ihr Dirigent',
        subtitle: 'Ihr Spielmacher {name} hat {n} saubere Aufbauten aneinandergereiht.',
        option_push_vt_high: {
          name: 'VT hoch stellen',
          desc: '-18% Gegner-Aufbau für 2 Runden, aber -6 Defense (Risiko hohe Linie).'
        },
        option_double_mark: {
          name: 'Doppelt decken',
          desc: '-25% Gegner-Aufbau für 3 Runden. Den Kreativkopf ersticken.'
        },
        option_bait_counter: {
          name: 'Konter ködern',
          desc: 'Auto-Konter 2 Runden scharf. Lass ihn denken er hat Kontrolle.'
        }
      },
      hitziger_moment: {
        title: 'Hitzige Szene',
        subtitle: 'Gemüter erhitzt nach dem letzten Zweikampf.',
        option_captain_calm: {
          name: 'Kapitän beruhigt',
          desc: '+10 Composure Rest des Matches. Kühle Köpfe setzen sich durch.'
        },
        option_go_harder: {
          name: 'Härter gehen',
          desc: '+10 Defense, +5 Tempo. Kartenrisiko: 37% (18% Rot). Hohes Spiel.'
        },
        option_ignore: {
          name: 'Ignorieren',
          desc: 'Keine Änderung. Das Spiel laufen lassen.'
        }
      },
      freier_mann: {
        title: 'Durchbruch',
        subtitle: '{name} ist durchgebrochen — jemand muss entscheiden.',
        option_foul_stop: {
          name: 'Taktisches Foul',
          desc: 'Stoppt den Angriff. VT bekommt Gelb (evtl. Rot bei zweiter).'
        },
        option_retreat: {
          name: 'Zurückziehen und absichern',
          desc: '-15% Gegner-Schuss diese Runde. Sicherer, weniger entscheidend.'
        },
        option_keeper_out: {
          name: 'Keeper rausrücken',
          desc: '50/50: sauberer Gewinn oder erzwungenes Tor. Münzwurf.'
        }
      },
      clear_chance: {
        title: 'Freie Sicht aufs Tor',
        subtitle: '{name} hat Ball, Winkel und das ganze Tor vor sich.',
        option_place_flat: {
          name: 'Flach platzieren',
          desc: '+18% sofortiger Schussbonus. Konservativ, zuverlässig.'
        },
        option_chip_keeper: {
          name: 'Keeper überlupfen',
          desc: 'Composure-abhängig: +30% wenn stabil, -10% wenn nervös.'
        },
        option_square_lf: {
          name: 'Quer zum Mitspieler',
          desc: '+22% — LF nimmt den Schuss. Uneigennützig, oft tödlich.'
        }
      },
      taktikwechsel_opp: {
        title: 'Sie stellen um',
        subtitle: '{opp} wechselt auf hohes Pressing — ihr Trainer reagiert.',
        option_long_balls: {
          name: 'Lange Bälle übers Pressing',
          desc: '+14 Offense, -6 Vision Rest des Matches. Pressing umgehen.'
        },
        option_hold_possession: {
          name: 'Ballbesitz halten',
          desc: '+14 Vision, +8 Composure. Ballbesitz-Lock aktiv.'
        },
        option_match_aggression: {
          name: 'Aggression spiegeln',
          desc: '+12 Tempo, +8 Defense, -4 Composure. Pressing aktiv.'
        }
      },
      playmaker_pulse: {
        title: 'Spielmacher-Puls',
        subtitle: '{name} diktiert den Rhythmus. Jetzt nachlegen.',
        option_release_runner: {
          name: 'Läufer freispielen',
          desc: 'Sofortiger Flankenangriff mit extra Vision. Nächster Zug durchs Halbfeld.'
        },
        option_dictate_tempo: {
          name: 'Tempo diktieren',
          desc: 'Vision und Composure steigen Rest des Matches. Spiel auf euren Rhythmus fixieren.'
        },
        option_thread_risk: {
          name: 'Riskante Pässe',
          desc: 'Nächster Aufbau bekommt einen massiven Boost, der Spielmacher erzwingt schärfere Pässe.'
        }
      },
      opp_keeper_rattled: {
        title: 'Keeper verunsichert',
        subtitle: '{name} wackelt. Jetzt kann Druck zur Panik werden.',
        option_shoot_early: {
          name: 'Aus jeder Lage',
          desc: 'Ihre Keeper-Save-Rate sinkt 2 Runden. Weniger Geduld, mehr Volumen.'
        },
        option_crash_box: {
          name: 'Box fluten',
          desc: 'Offense und Tempo steigen sofort. Zweite Bälle und Abpraller sichern.'
        },
        option_reset_probe: {
          name: 'Zurück und abtasten',
          desc: 'Nächsten Aufbau verstärken und finalen Pass vor dem Schuss schärfen.'
        }
      },
      backline_step_up: {
        title: 'Abwehr rückt auf',
        subtitle: '{name} liest das Spiel immer besser. Die Abwehrkette setzt jetzt den Ton.',
        option_step_in: {
          name: 'Ins Mittelfeld rücken',
          desc: 'Nächster Aufbau wird stärker, das ganze Team rückt fünf Meter höher.'
        },
        option_hold_shape: {
          name: 'Formation halten',
          desc: 'Sicherer Block für 2 Runden. Gegner-Schussqualität sinkt, Composure steigt.'
        },
        option_spring_trap: {
          name: 'Falle zuschnappen',
          desc: 'Konter-Haltung scharf, ihre nächsten Aufbauten werden wackliger.'
        }
      },
      red_card_risk: {
        title: 'Auf der Kippe',
        subtitle: '{name} ist aufgeheizt — eine schlechte Grätsche und es ist vorbei.',
        option_play_hard: { name: 'Auf der Kippe spielen', desc: '+14 Defense, +6 Tempo. Aber 25% Chance auf Gelb.' },
        option_play_clean: { name: 'Zurückziehen', desc: '+10 Composure, +5 Defense. Sicher, schlau, langsamer.' },
        option_substitute_def: { name: 'Auswechseln', desc: 'Frischer Verteidiger von der Bank. Die Sicherung zurücksetzen.' }
      },
      weather_shift: {
        title: 'Wetterumschwung',
        subtitle: 'Bedingungen haben sich gerade geändert — neues Konzept nötig.',
        option_adapt_tempo: { name: 'Anpassen', desc: 'Spiel verlangsamen, Bedingungen aussitzen. Defense-lastiger Boost.' },
        option_push_through_weather: { name: 'Durchziehen', desc: 'Wetter ignorieren, trotzdem angreifen. +12 Offense, -6 Composure.' }
      },
      fan_revolt: {
        title: 'Zuschauer-Unruhe',
        subtitle: 'Die Tribünen werden unruhig — Pfiffe setzen ein.',
        option_rally_crowd: { name: 'Als Treibstoff nutzen', desc: '+14 Offense, +8 Tempo. Wut nach vorn kanalisieren.' },
        option_ignore_noise: { name: 'Ausblenden', desc: '+16 Composure, +8 Vision. Kaltschnäuziger, fokussierter Fußball.' }
      },
      opp_star_down: {
        title: 'Ihr Star erlischt',
        subtitle: '{name} kommt nicht mehr hinterher — die Körpersprache sagt erledigt.',
        option_capitalize: { name: 'Durchziehen', desc: '+18 Offense, +10 Tempo, -4 Defense. Lasst sie nicht erholen.' },
        option_stay_disciplined: { name: 'Diszipliniert bleiben', desc: '+10 Defense, +10 Composure, +6 Vision. Aussitzen.' }
      },
      coach_whisper: {
        title: 'Co-Trainer redet',
        subtitle: 'Dein Co-Trainer hat eine Idee.',
        option_trust_coach: { name: 'Vorschlag vertrauen', desc: 'Der empfohlenen Anpassung folgen. Situativ aber gezielt.' },
        option_trust_instinct: { name: 'Bauchgefühl', desc: 'Ausgewogen +8 auf Offense, Defense, Composure.' }
      },
      hot_player: {
        title: 'In Form',
        subtitle: '{name} hat getroffen und sieht unaufhaltsam aus.',
        option_boost: { name: 'Weiter so', desc: 'Permanent +{bonus} auf {stat}.' },
        option_stabilize: { name: 'Formation halten', desc: 'Führung schützen — defensive Stabilität.' }
      },
      crisis_moment: {
        title: 'Köpfe hängen',
        subtitle: '{deficit} zurück — die Kabine braucht einen Funken.',
        option_team_talk: { name: 'Team-Ansprache', desc: '70% Composure+Offense Boost, 30% Fehlschlag.' },
        option_focus: { name: 'Einzel-Fokus', desc: 'Druck auf einen Spieler, Wende erzwingen.' },
        option_accept: { name: 'Akzeptieren & durchbeißen', desc: 'Kompakt bleiben — Form-Erholung.' }
      },
      opp_mistake: {
        title: 'Sie zerbrechen',
        subtitle: '{opp} hat {n} Aufbauten verloren. Der Druck zeigt Wirkung.',
        option_exploit: { name: 'Zuschlagen', desc: 'Sofortangriff mit Bonus.' },
        option_sustain: { name: 'Druck aufrechterhalten', desc: 'Anhaltender Aufbau-Malus.' }
      },
      legendary_demand: {
        title: '{name} will rein',
        subtitle: 'Deine Legende schaut von der Bank.',
        option_bring_on: { name: '{name} einwechseln', desc: 'Einwechseln — voller Legenden-Effekt.' },
        option_morale: { name: 'Noch nicht', desc: 'Frisch halten — kleiner Team-weiter Boost.' }
      },
      season_finale: {
        title: 'Titelrennen',
        subtitle: 'Letztes Match — Punkte auf dem Tisch, Nerven blank.',
        option_allin: { name: 'Volles Risiko', desc: 'Alles riskieren — höhere Spitze, höherer Boden.' },
        option_controlled: { name: 'Kontrollierter Ansatz', desc: 'Stetig und klinisch.' }
      },
      set_piece_awarded: {
        title: 'Standard-Situation',
        subtitle: 'Foul kurz vor dem Strafraum — wie ausführen?',
        option_quick_surprise: { name: 'Schnell & überraschend', desc: 'Sofortangriff, +24% Bonus. Überrasche sie ungeordnet.' },
        option_delivery_focus: { name: 'Standard spielen', desc: '+14% nächster Aufbau, Team +6 Composure/Vision für 2 Runden.' }
      },
      legs_gone: {
        title: 'Beine werden schwer',
        subtitle: 'Spät im Match und das Team läuft auf Reserve.',
        option_push_anyway: { name: 'Trotzdem pushen', desc: '+6 Tempo, +4 Offense, -8 Composure. Auf Adrenalin hoffen.' },
        option_manage_rhythm: { name: 'Rhythmus steuern', desc: '-6 Tempo, +8 Defense, +10 Composure. Erhalten und kontrollieren.' }
      },
      tactical_clash: {
        title: 'Taktik-Zusammenstoß',
        subtitle: 'Euer Ansatz läuft direkt in ihre Stärke — anpassen oder durchziehen?',
        option_adapt: { name: 'Anpassen', desc: '-5 Offense, +10 Defense, +8 Vision. Plan mitten im Spiel anpassen.' },
        option_double_down: { name: 'Verdoppeln', desc: '+14 Offense, +6 Tempo, -8 Defense. Sie mit ihren Waffen schlagen.' }
      },
      referee_stern: {
        title: 'Strenger Schiri',
        subtitle: 'Die Pfeife sitzt heute locker — Karten warten für jedes Übertreten.',
        option_play_clean: { name: 'Sauber spielen', desc: '+10 Composure, -4 Tempo. Kein Kartenrisiko, kontrolliertes Tempo.' },
        option_normal_game: { name: 'Normal weiterspielen', desc: 'Sie sind auch vorsichtig: Gegner -5 Tempo für 2 Runden. Gegenseitige Vorsicht.' }
      }
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
      lineupSuspended: '{name} ist gesperrt — bitte wechsle einen Bank-Spieler ein.',
      academyCalledUp: 'Bank leer — Aushilfen werden eingewechselt: {list}. Ihre Werte sind deutlich reduziert.',
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
      activeBuffs: '  📊 Aktive Buffs: {buffs}',
      synergyBonus: '  🔗 Synergie: {name} ({trait}) +{bonus}% Angriff',
      tacticPressingTrigger: '  🏃 Pressing wirkt — Ballgewinn + Konter!',
      tacticCounterTrigger: '  🔁 Konter-Taktik greift — nächster Aufbau verstärkt!',
      tacticRallyTrigger: '  💪 Mobilisierung zündet — +{bonus} Offense durch Rückstand!',
      tacticHighPressTrigger: '  🏃 Hohes Pressing — Ballgewinn!',
      tacticFinalPressTrigger: '  ⚡ Schlusspressing — Konter eingeleitet!',
      tacticGambleWin: '  🎲 Risiko zahlt sich aus — +35 Team-Offense!',
      tacticGambleLoss: '  🎲 Risiko verpufft — -15 auf jeden Stat.',
      tacticShakeUp: '  🔄 Umstellung: {name} muss runter, Team schärft sich.',
      tacticLoneWolf: '  🐺 Lone Wolf: {name} trägt das Spiel allein.',
      tacticFortress: '  🛡 Festung: {tw} & {vt} riegeln hinten zu.',
      tacticMasterclass: '  🎼 Meisterklasse: {name} dirigiert das Spiel.',
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
      penaltiesLoss: '💥 NIEDERLAGE IM ELFMETERSCHIESSEN',
      eventSetPieceQuick: '  ⚡ Schnell ausgeführt — eiskalt erwischt!',
      eventSetPieceDelivery: '  🎯 Standard wird einstudiert — geduldiger Aufbau.',
      eventLegsPush: '  💢 Beine schwer — trotzdem durchziehen.',
      eventLegsManage: '  🧘 Rhythmus steuern — erhalten und kontrollieren.',
      eventClashAdapt: '  🔄 Anpassen — das kollidierende Konzept fallen lassen.',
      eventClashCommit: '  ⚔ Verdoppeln — auf die Konfrontation einlassen.',
      eventRefClean: '  ✓ Sauber spielen — Composure über Aggression.',
      eventRefNormal: '  ⚖ Beide Seiten vorsichtig — zurückhaltendes Spiel.',
      eventCoachTrust: '  📋 Dem Co-Trainer folgen — Plan läuft.',
      eventCoachInstinct: '  🎯 Bauchgefühl — ausgewogener Ansatz.'
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
      captain_cool: 'Käptn',
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
      konter: { name: 'Konter-Spezialisten', theme: 'schnell, defensiv, bestraft Gegner-Fehler', desc: 'Stark im Mittelfeld und auf dem Flügel. Tor durch Tempo-Übergang.' },
      kraft: { name: 'Kraftpaket', theme: 'physisch, Kopfbälle, Zermürbung', desc: 'Gewinnt durch pure Physis. Besonders stark spät im Match.' },
      technik: { name: 'Technik-Magier', theme: 'vision-basiert, Kombos über Pässe', desc: 'Baut Angriffe aus dem Nichts. Langsam, aber präzise.' },
      pressing: { name: 'Pressing-Bestien', theme: 'aggressiv, brechen Gegner-Aufbau', desc: 'Zwingt Fehler mit permanentem Druck. Risikofußball mit schwachen Nerven.' }
    },
    roles: {
      TW: { label: 'Torwart', desc: 'Hält Eins-gegen-eins' },
      VT: { label: 'Verteidiger', desc: 'Abwehr-Anker' },
      PM: { label: 'Spielmacher', desc: 'Orchestriert Angriffe' },
      LF: { label: 'Flügel', desc: 'Chaos-Motor' },
      ST: { label: 'Stürmer', desc: 'Vollstrecker' }
    },
    archetypes: {
      keeper_block: 'Blockender Keeper', keeper_sweep: 'Libero-Keeper', keeper_reflex: 'Reflex-Keeper',
      def_wall: 'Betonwand', def_tackle: 'Beißer', def_sweeper: 'Libero',
      pm_regista: 'Regista', pm_press: 'Press-Maschine', pm_playmaker: 'Spielmacher',
      lf_winger: 'Flügel-Flitzer', lf_dribbler: 'Dribbler', lf_box: 'Box-to-Box',
      st_poacher: 'Wilderer', st_target: 'Zielspieler', st_false9: 'Falsche Neun'
    },
    traits: {
      titan_stand:      { name: 'Titan-Stand',        desc: 'Bei knappem Spielstand (≤1 Tor Diff): 30% Chance Schüsse zu halten.' },
      fortress_aura:    { name: 'Festungs-Aura',      desc: 'Verteidiger bekommt +6 Defense, solange der Keeper spielt.' },
      clutch_save:      { name: 'Clutch-Save',        desc: 'In Runden 5-6: +20% Save-Rate.' },
      sweep_assist:     { name: 'Sweep-Assist',       desc: 'Nach einer Parade: +8% auf den nächsten Aufbau.' },
      laser_pass:       { name: 'Laser-Pass',         desc: 'Nach einer Parade: 20% Chance auf Sofort-Konter.' },
      offside_trap:     { name: 'Abseitsfalle',       desc: '15% aller Gegner-Angriffe werden neutralisiert (tempobasiert).' },
      acrobat_parry:    { name: 'Akrobatik',          desc: 'Nach einer Parade: +12% Save-Chance auf nächsten Schuss (einmal pro Match).' },
      wall_effect:      { name: 'Mauer',              desc: '+15% permanente Save-Rate, aber -10% auf eigenen Aufbau.' },
      nine_lives:       { name: 'Neun Leben',         desc: 'Einmal pro Match: erstes Gegentor wird annulliert.' },
      intimidate:       { name: 'Einschüchtern',      desc: 'Gegner-Stürmer bekommt -5 Offense.' },
      bulldoze:         { name: 'Bulldozer',          desc: 'Jede Runde: 10% Chance den Ball vor dem Gegner-Schuss abzufangen.' },
      captain_boost:    { name: 'Kapitän',            desc: 'Gesamtes Team bekommt +3 Composure.' },
      blood_scent:      { name: 'Blutspur',           desc: 'Nach jedem Gegentor: +5 Defense für den Rest des Matches.' },
      hard_tackle:      { name: 'Harter Tackle',      desc: '20% Chance den Gegner-Angriff zu brechen und Konter auszulösen.' },
      whirlwind_rush:   { name: 'Wirbelwind',         desc: 'Einmal pro Halbzeit: verdoppelt das Tempo dieses Spielers für eine Runde.' },
      build_from_back:  { name: 'Spielaufbau hinten', desc: 'Spielmacher bekommt +8 Vision.' },
      late_bloom:       { name: 'Spätzünder',         desc: 'Ab Runde 4: +10 Offense und +5 Vision.' },
      read_game:        { name: 'Spiel lesen',        desc: 'Einmal pro Match: neutralisiert automatisch einen Gegner-Angriff.' },
      metronome_tempo:  { name: 'Metronom',           desc: 'Jede Runde: +2% auf eigenen Aufbau (kumulativ).' },
      killer_pass:      { name: 'Killerpass',         desc: 'Bei eigenem Angriff: 25% Chance auf Ketten-Schuss.' },
      whisper_boost:    { name: 'Flüstern',           desc: 'Stürmer bekommt +8 Composure und +4 Offense.' },
      hunter_press:     { name: 'Jagdfieber',         desc: '15% Chance pro Runde den Ball per Pressing zu gewinnen.' },
      gegenpress_steal: { name: 'Gegenpressing',      desc: 'Nach jedem Gegner-Ballverlust: +15% auf nächsten eigenen Aufbau.' },
      shadow_strike:    { name: 'Schatten-Schlag',    desc: 'In Runden 3 und 6: 20% Chance auf verdeckten Angriff.' },
      maestro_combo:    { name: 'Maestro-Kombo',      desc: 'Wenn PM, LF und ST alle treffen: nächstes Tor zählt doppelt.' },
      chess_predict:    { name: 'Voraussicht',        desc: 'Einmal pro Halbzeit: verwandelt ein Gegentor in eine Parade.' },
      symphony_pass:    { name: 'Symphonie',          desc: 'Wenn 2+ Mitspieler Traits auslösen: +10% Team-Offense.' },
      speed_burst:      { name: 'Speed-Burst',        desc: 'Einmal pro Halbzeit: garantiert erfolgreicher Aufbau.' },
      launch_sequence:  { name: 'Start',              desc: 'In Runde 1: +20% auf eigenen Angriff.' },
      unstoppable_run:  { name: 'Unaufhaltsam',       desc: 'Wenn Tempo > Gegner-Defense: 10% Chance auf automatisches Tor.' },
      dribble_chain:    { name: 'Dribbel-Kette',      desc: 'Jeder erfolgreiche Angriff gibt +5% auf den nächsten (stacking).' },
      street_trick:     { name: 'Straßentrick',       desc: '15% Chance den Verteidiger komplett zu stehen zu lassen.' },
      nutmeg:           { name: 'Tunnel',             desc: '20% Chance bei eigenem Angriff die Gegner-Defense zu ignorieren.' },
      ironman_stamina:  { name: 'Ironman',            desc: 'In Runden 5-6: kein Stat-Zerfall und Team bekommt +2 Tempo.' },
      dynamo_power:     { name: 'Dynamo',             desc: 'Jede zweite Runde: +6 Team-Offense für diese Runde.' },
      never_stop:       { name: 'Nie aufgeben',       desc: 'Bei Rückstand: +8 Offense pro kassiertem Tor.' },
      silent_killer:    { name: 'Stiller Killer',     desc: 'Erster Schuss im Match bekommt +30% Offense.' },
      predator_pounce:  { name: 'Raubtiersprung',     desc: 'Nach gescheitertem Gegner-Angriff: 25% Chance auf Sofort-Tor.' },
      opportunity:      { name: 'Gelegenheit',        desc: 'Jeder erfolgreiche Aufbau gibt +3% Torchance.' },
      cannon_blast:     { name: 'Kanonen-Schuss',     desc: 'Jeder Schuss: 10% Chance auf Auto-Tor, aber Fehlschuss-Risiko +5%.' },
      header_power:     { name: 'Kopfball-Monster',   desc: 'Bei hoher Team-Vision: +15% Torchance.' },
      brick_hold:       { name: 'Ballhalter',         desc: 'Stabilisiert das Team: -10% Gegner-Pressing.' },
      ghost_run:        { name: 'Geister-Lauf',       desc: '15% Chance pro Runde plötzlich für eine Chance aufzutauchen.' },
      puzzle_connect:   { name: 'Puzzleteil',         desc: 'Wenn der Spielmacher trifft: +25% auf deine nächste Torchance.' },
      chameleon_adapt:  { name: 'Anpassung',          desc: 'Kopiert in Runde 4 den Trait des aktivsten Mitspielers.' }
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
    oppTells: {
      offensive: 'Sehr offensiv — Deckung priorisieren',
      defensive: 'Mauert komplett — braucht Schnelligkeit oder Vision',
      pacey: 'Extrem schnell — Konter-Gefahr auf beiden Seiten',
      cerebral: 'Taktisch ausgefeilt — Ballbesitz-Spiel gefährlich',
      stoic: 'Unerschütterlich — Nerven entscheiden im Finish',
      balanced: 'Ausgewogen — keine klare Schwäche erkennbar',
      trait_sturm: 'Hochgefährlich vor dem Tor — Schüsse sehr präzise',
      trait_riegel: 'Abschlüsse werden aktiv konterkariert — Paraden leiden',
      trait_konter_opp: 'Lauert auf Fehler — bei Ballverlust sofort Konter',
      trait_presser_opp: 'Aggressives Pressing — Aufbau unter Dauerdruck',
      trait_clutch_opp: 'Stärker in der Schlussphase — in Runden 5-6 besonders gefährlich',
      trait_lucky: 'Unberechenbares Glück — rechne mit unerwarteten Angriffen',
      trait_ironwall: 'Früh sehr defensiv — Runden 1-2 schwer zu knacken',
      trait_sniper: 'Präzisionsschütze — jeder Schuss ein Risiko'
    },
    tactics: {
      kickoff: {
        aggressive: { name: 'Aggressiver Start', desc: '+18 Offense R1-3, -8 Defense. Volldampf ab der ersten Minute.' },
        defensive: { name: 'Defensiver Start', desc: '+18 Defense R1-3, -8 Offense. Sie kommen lassen und auskontern.' },
        balanced: { name: 'Ausgewogen', desc: '+8 auf ALLE Stats R1-3. Erster Aufbau garantiert — kein Kaltstart.' },
        tempo: { name: 'Tempo-Spiel', desc: '+22 Tempo R1-3, -6 Composure. Überrollen, bevor sie ins Spiel finden.' },
        pressing: { name: 'Pressing', desc: '+14 Defense, +10 Tempo R1-3. Ihr Aufbau bricht — aber Lücken entstehen.' },
        possession: { name: 'Ballbesitz', desc: '+18 Vision, +10 Composure R1-3. Spielkontrolle — Ballverlust wird bestraft.' },
        counter: { name: 'Konter-Lauer', desc: '+22 Defense, +10 Tempo, -6 Offense. Jeder gescheiterte Gegnerangriff triggert Konter.' },
        flank_play: { name: 'Flügelspiel', desc: '+14 Tempo, +14 Offense R1-3. Breit und schnell von Anfang an.' },
        slow_burn: { name: 'Schleichangriff', desc: 'Bestraft ihre Geduld: -4 Offense R1-2, dann +22 Offense R3. Erst einlullen.' },
        shot_flood: { name: 'Schussflut', desc: '+24 Offense R1-3. Masse statt Klasse — Fehler provozieren, Fehler nutzen.' },
        lockdown: { name: 'Riegel', desc: '+28 Defense R1-3, -12 Offense, -8 Tempo. Keine Tore — weder so noch so.' },
        mindgames: { name: 'Psychospiel', desc: '+14 Vision, +10 Composure. Gegner -6 Composure R1-3. In ihre Köpfe rein.' },
        underdog: { name: 'Außenseiter-Modus', desc: 'Nur gegen deutlich Stärkere: +14 auf ALLE Stats R1-6. Das Team wächst über sich hinaus.' },
        favorite: { name: 'Souverän', desc: 'Nur wenn klarer Favorit: +10 Vision, +6 Tempo, Momentum baut schneller. Mit Schwung spielen.' },
        wet_start: { name: 'Einlullen & Zuschlagen', desc: 'R1-2 volle Defensive, R3 Explosion: +24 Offense beim Anstoß Runde 3.' },
        chaos: { name: 'Chaos-Fußball', desc: 'Jede Runde: +20 auf einen zufälligen Stat, -10 auf zwei andere. Hohe Varianz — akzeptieren.' },
        zone_defense: { name: 'Zonenverteidigung', desc: '+12 Defense, +12 Composure, -5 Tempo R1-3. Strukturiert statt aggressiv. Zwischen Pressing und Riegel.' },
        quick_strike: { name: 'Blitzstart', desc: 'R1: +30 Offense Peak. R2-3: +5 auf alle Stats. Erst explosiv, dann kontrolliert.' },
        disciplined: { name: 'Diszipliniert', desc: '+10 auf alle Stats R1-3. Negative Form-Penalties ignoriert — Krisenspieler spielen normal.' },
        read_the_room: { name: 'Situationsgespür', desc: '+15 Vision, +10 Composure, +8 Defense R1-3. Kopf statt Tempo.' }
      },
      halftime: {
        push: { name: 'Risiko', desc: '+20 Offense R4-6, -10 Defense. Bei Rückstand wächst der Bonus pro Tor.' },
        stabilize: { name: 'Stabilisieren', desc: '+18 Defense, +10 Composure R4-6. Bei Führung wächst die Mauer pro Tor.' },
        shift: { name: 'Umstellen', desc: 'Ein Spieler erhält jetzt permanent +18 auf seinen Fokus-Stat.' },
        rally: { name: 'Mobilisieren', desc: '+6 Offense pro kassiertem Tor, +6 Defense pro eigenem. Massives Swing-Potenzial.' },
        reset: { name: 'Neu sortieren', desc: '+12 auf ALLE Stats R4-6. Weißes Blatt — kein Drehbuch mehr.' },
        counter_h: { name: 'Auf Konter', desc: '+24 Tempo, +14 Defense R4-6. Gescheiterter Gegnerangriff triggert Konter.' },
        high_press: { name: 'Hohes Pressing', desc: '+22 Defense R4-6, -6 Composure. Ihr Aufbau bricht — aber Lücken sind real.' },
        vision_play: { name: 'Spiel öffnen', desc: '+22 Vision, +10 Offense R4-6. Lücken schaffen, Lücken nutzen.' },
        shake_up: { name: 'Aufrütteln', desc: 'Schwächster Spieler kassiert permanent -5 auf alle Stats. Team reagiert: +12 Offense R4-6.' },
        lock_bus: { name: 'Bus einbetonieren', desc: 'Nur mit Führung: +30 Defense, -20 Offense R4-6. Undurchdringlich, aber zahnlos.' },
        desperate: { name: 'Verzweiflungstat', desc: 'Nur bei 2+ Rückstand: +32 Offense R4-6, -20 Defense. Keeper auf sich gestellt. Alles oder nichts.' },
        role_switch: { name: 'Rollentausch', desc: 'LF und ST tauschen Rollen R4-6. +10 Tempo, +10 Offense, -8 Vision. Neue Angriffswinkel.' },
        coach_fire: { name: 'Donnerwetter', desc: 'Nur bei Rückstand: nächstes Match +1 Team-Form, dieses Match +14 Offense R4-6. Wut treibt an.' },
        cold_read: { name: 'Durchschauen', desc: 'Taktiken lesen. +20 Defense, Gegner-Offense -8 R4-6. Überlisten statt überrennen.' },
        wingman: { name: 'Flügel freigeben', desc: 'LF: +25 Tempo, +15 Offense persönlich. Team -4 Composure. Einzelkämpfer-Risiko.' },
        mind_reset: { name: 'Mentaler Reset', desc: 'Wischt alle Form-Deltas im Kader. Weißes Blatt in R4-6 — kein Ballast, kein Schwung.' },
        double_down: { name: 'Verdoppeln', desc: 'Amplifiziert deinen größten aktuellen Team-Buff um +40%. Belohnt Momentum — wirkungslos ohne.' },
        tactical_foul: { name: 'Taktische Fouls', desc: '+8 Defense, Gegner-Tempo -12 für 2 Runden. Stören statt verbessern.' },
        wing_overload: { name: 'Flügel-Offensive', desc: 'LF: +20 Offense, +20 Tempo persönlich R4-6. Team -6 Defense. Einzelspieler-Show.' },
        shell_defense: { name: 'Schalen-Defensive', desc: 'Nur bei Unentschieden oder Führung: +24 Defense, +14 Composure, -10 Offense R4-6. Zustand wahren.' }
      },
      final: {
        all_in: { name: 'All-In', desc: 'Letzte Runde: +15 Offense, -15 Defense. Wächst bei Rückstand. Hinten komplett offen.' },
        park_bus: { name: 'Bus parken', desc: 'Letzte Runde: +15 Defense, -10 Offense. Wächst mit jedem Tor Führung.' },
        hero_ball: { name: 'Held des Tages', desc: 'Spieler in Topform erhält jetzt permanent +30 auf seinen Fokus-Stat.' },
        keep_cool: { name: 'Cool bleiben', desc: 'Letzte Runde: +20 Composure, +12 Vision. Nerven aus Stahl.' },
        final_press: { name: 'Schlusspressing', desc: 'Letzte Runde: +24 Tempo, +18 Defense, -10 Offense. Hohe Konter-Chance.' },
        long_ball: { name: 'Lange Bälle', desc: 'Letzte Runde: +28 Offense, -10 Vision. Direkt und hart.' },
        midfield: { name: 'Mittelfeldkontrolle', desc: 'Letzte Runde: +20 Vision, +16 Tempo, +14 Composure.' },
        sneaky: { name: 'Hinterhalt', desc: 'Letzte Runde: +28 Defense, +18 Tempo, -14 Offense. Ködern und zuschlagen.' },
        sacrifice: { name: 'Opferlamm', desc: 'Ein Spieler verliert dauerhaft 15 Fokus-Stat. Team: jetzt +35 Offense.' },
        kamikaze: { name: 'Kamikaze', desc: 'Nur bei Rückstand: +40 Offense, -40 Defense. Keeper exponiert. Hoffen und beten.' },
        clockwatch: { name: 'Uhr spielen lassen', desc: 'Nur mit Führung: +25 Defense, +18 Composure. Zeit für dich arbeiten lassen.' },
        poker: { name: 'Pokerface', desc: 'Nur bei Gleichstand: +15 auf jeden einzelnen Stat. Pure Clutch — alles drin.' },
        lone_wolf: { name: 'Einzelkämpfer', desc: 'Stürmer: +40 Offense, +20 Tempo persönlich. Rest: -6 Offense. Ein Schuss, ein Treffer.' },
        fortress: { name: 'Festung', desc: 'TW/VT: +40 Defense. Team -20 Offense. Das Tor in einen Bunker verwandeln.' },
        gamble: { name: 'Zock', desc: 'Münzwurf: +35 Offense bei Kopf, -15 auf alle Stats bei Zahl. Pures Chaos.' },
        masterclass: { name: 'Meisterklasse', desc: 'PM: +30 Vision, +20 Composure persönlich. Team +12 Offense. Den Maestro dirigieren lassen.' },
        rope_a_dope: { name: 'Rope-a-Dope', desc: 'Nur R6: +35 Defense. Jeder Gegnerangriff triggert Auto-Konter. Ködern, dann zuschlagen.' },
        set_piece: { name: 'Standard-Meister', desc: 'R6: +25 Offense, aber NUR nach erfolgreichem Aufbau. Chirurgische Schärfe.' },
        siege_mode: { name: 'Belagerung', desc: 'R6: +20 Offense, +10 Tempo, +10 Vision. Sauberer Rundum-Druck, keine Strafe.' },
        bus_and_bike: { name: 'Abfangen & Kontern', desc: 'R6: +18 Defense. Jede Parade/Stop lädt +30 Offense auf den nächsten eigenen Ball.' },
        face_pressure: { name: 'Druck aushalten', desc: 'R6: +25 Composure, Gegner-Schüsse -8% Genauigkeit. Clutch-Nerven im Rampenlicht.' }
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
    legendaryNames: ['Nikolaus Vega','Rasmus Orth','Idris Storm','Jago Sand','Milo Rivera','Octavian Kross','Darian Lux','Suren Vex','Leon Trax','Rune Kainz','Ashe Quandt','Zephyr Böhm','Malik Kroos','Nils Falk','Sovereign Reinhardt','Maksim Thoma'],
    oppTraits: {
      sturm: { name: 'Sturmwalze', desc: '+8% Schussgenauigkeit.' },
      riegel: { name: 'Schlosskette', desc: '+5% Save-Verhinderung pro Runde.' },
      konter_opp: { name: 'Konter-Drohung', desc: 'Bei deinem fehlgeschlagenen Aufbau: 30% Chance auf sofortigen Schuss.' },
      presser_opp: { name: 'Pressing-Maschine', desc: 'Deine Aufbauten scheitern 10% häufiger.' },
      clutch_opp: { name: 'Eiskalt', desc: 'Letzte 2 Runden: +10 Angriff, +5 Tempo.' },
      lucky: { name: 'Glückspilze', desc: 'Einmal pro Match: zufälliger Bonus-Angriff.' },
      ironwall: { name: 'Eisenwand', desc: 'Erste 2 Runden: +10 Verteidigung.' },
      sniper: { name: 'Scharfschütze', desc: '+15% Schussgenauigkeit, aber -5 Tempo.' },
      boss_aura: { name: 'Dominante Präsenz', desc: 'Boss-Aura: Alle Gegner-Spieler erhalten jede Runde einen dauerhaften Stat-Bonus.' }
    },
    legendaryTraits: {
      god_mode:      { name: 'Gott-Modus',        desc: 'Einmal pro Match: das nächste Tor zählt dreifach.' },
      clutch_dna:    { name: 'Clutch-DNA',        desc: 'In der letzten Runde: +20 Offense, +10 Composure.' },
      field_general: { name: 'Feldmarschall',     desc: 'Gesamtes Team: +4 auf alle Stats.' },
      unbreakable:   { name: 'Unzerbrechlich',    desc: 'Erstes Gegentor pro Match: annulliert.' },
      big_game:      { name: 'Big-Game-Spieler',  desc: 'Gegen Bosse: +15 auf Fokus-Stat.' },
      conductor:     { name: 'Dirigent',          desc: 'Pro erfolgreichem Aufbau: +8% auf das nächste Tor.' },
      phoenix:       { name: 'Phönix',            desc: 'Bei 2+ Rückstand: +12 Offense für den Rest des Matches.' },
      ice_in_veins:  { name: 'Eis in den Adern',  desc: 'Ignoriert Gegner-Composure-Buffs komplett.' }
    }
  }
});