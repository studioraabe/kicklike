I18N.registerLocale('es', {
  ui: {
    meta: { title: 'KICKLIKE · Autobattler de 5 jugadores' },
    start: {
      tagline: '> autobattler de 5 jugadores_',
      sub: '15 partidos · 4 equipos iniciales · sinergias emergentes',
      newRun: '▶ Nueva Partida',
      howTitle: 'Cómo funciona:',
      howBody: 'Elige un equipo inicial entre 4 conceptos. Cada uno de tus 5 jugadores evoluciona por una de 3 rutas durante la partida. Los encuentros se juegan como auto-battles, pero tú decides el rumbo en 3 momentos clave. Los rasgos se activan entre sí. Consigue puntos (3 por victoria, 1 por empate) y evita 3 derrotas seguidas. Objetivo: 36+ puntos = Campeón, 24+ puntos = Permanencia.'
    },
    draft: {
      title: 'Elige tu equipo inicial',
      body: 'Cada equipo tiene un tema, una fortaleza y una debilidad. Su identidad se define después mediante evoluciones.'
    },
    hub: {
      yourTeam: 'Tu Equipo',
      opponent: 'Rival',
      squad: 'Plantilla',
      bench: 'Banquillo',
      lineup: '⚙ Alineación',
      startMatch: '▶ Empezar Partido',
      bossTag: 'JEFE',
      suspendedAlert: '{name} está sancionado este partido',
      suspendedAlertTooltip: '{name}: tarjeta roja en el último partido. Sanción por {n} partidos más. Sustitúyelo desde el banquillo antes de empezar.'
    },
    lineup: {
      title: 'ALINEACIÓN',
      tapToSwap: 'Toca jugadores para cambiar',
      defaultHint: 'Haz clic en un titular y luego en un suplente para intercambiarlos. El portero (POR) es obligatorio.',
      starters: 'Titulares',
      bench: 'Banquillo',
      done: '✓ Listo'
    },
    recruit: {
      title: 'ELECCIÓN LEGENDARIA',
      subtitle: '> jefe derrotado — un nuevo héroe elige tu club_',
      body: 'Elige un jugador. Irá al banquillo — máximo 2 plazas.',
      decline: 'Rechazar'
    },
    match: {
      pause: '⏸ Pausa',
      resume: '▶ Seguir',
      speed: '⏩ Velocidad',
      fast: '⏩ Rápido'
    },
    result: {
      win: 'VICTORIA',
      loss: 'DERROTA',
      draw: 'EMPATE',
      continue: '▶ Continuar',
      analysis: 'Resumen del Partido',
      players: 'Resumen de Jugadores',
      sacrificeNote: '⚠ {name} lo dio todo — pérdida permanente de estadística.',
      hlOverperform:  'Por encima de lo esperado (pre-partido: {pre}% victoria)',
      hlUnderperform: 'Por debajo de lo esperado (pre-partido: {pre}% victoria)',
      decisionsTitle: 'Tus decisiones',
      decisionsSum:   'Total',
      matchFlowTitle: 'Flujo del Partido',
      matchFlowHint:  'Evolución de las estadísticas del equipo durante el partido (buffs, forma, habilidades).',
      decisionPhase: {
        kickoff:  'Inicio',
        halftime: 'Descanso',
        final:    'Final'
      }
    },
    prob: {
      win:  'Victoria',
      draw: 'Empate',
      loss: 'Derrota',
      currentWin: 'Probabilidad actual de victoria'
    },
    scorecard: {
      threat: 'AMENAZA',
      edge:   'VENTAJA',
      off:    'ATQ',
      def:    'DEF',
      tmp:    'RIT',
      vis:    'VIS',
      cmp:    'TEM',
      traitActivity: '~{n} disparos de rasgo esperados · {p} pasivas activas',
      edgeTooltip:   'Tus ventajas: rasgos que contrarrestan a este rival más cualquier superávit de stats. Independiente de Amenaza — pueden ser altas ambas.',
      threatTooltip: 'Su peligro para ti: rasgos rivales que dañan a tu plantilla más cualquier brecha de poder. Independiente de Ventaja — pueden ser altas ambas.'
    },
    cards: {
      yellow: 'Tarjeta amarilla — una más en este partido = expulsión y sanción para el siguiente.',
      secondYellow: 'Segunda amarilla — expulsado de este partido, sancionado para el próximo.',
      red: 'Tarjeta roja — expulsado de este partido, sancionado para el próximo.',
      suspendedNext: 'Sancionado — no puede jugar el próximo partido.',
      academyTooltip: 'Suplente de la cantera — reemplazo temporal, estadísticas muy reducidas, sin habilidades. Abandona el equipo tras este partido.'
    },
    decisions: {
      // Focus-Keys entfernt — Focus-System deprecated.
    },
    optionBadges: {
      fitsSquad: 'ENCAJA',
      risky:    'ARRIESGADO',
      synergy:  'SINERGIA ×{mult}',
      conflict: 'CONFLICTO ×{mult}',
      synergyShort:  'SINERGIA',
      conflictShort: 'CONFLICTO'
    },
    optionHints: {
      scalesDeficit: '↑ crece con tu desventaja',
      scalesLead:    '↑ crece con tu ventaja'
    },
    gameover: { title: 'GAME OVER' },
    victory: { survived: '15 partidos superados' },
    labels: {
      power: 'Poder',
      standard: 'Estándar',
      hotStreak: 'RACHA ARDIENTE',
      goodForm: 'Buen Momento',
      crisis: 'CRISIS',
      badForm: 'Mal Momento',
      losingWarning: '⚠ 2 derrotas seguidas — otra más y despiden al entrenador.',
      noBench: 'Aún no hay suplentes — gana a un jefe para conseguir uno.',
      swapSelected: '→ {name} seleccionado. Haz clic en otro jugador para intercambiar.',
      swapRejected: 'Cambio rechazado: la alineación necesita exactamente 1 portero.',
      benchSlots: '{count} / {max} plazas',
      highscore: '✦ MEJOR MARCA: {points} PTS · {wins}V-{draws}E-{losses}D · {outcome} ✦',
      outcomeChampion: 'Campeón',
      outcomeSurvivor: 'Permanencia',
      outcomeFired: 'Despedido',
      compactTeamMeta: '{lineup} + {bench}B',
      matchLabel: 'Partido {num}: {me}:{opp} vs {name}',
      bossTell: 'Combate contra jefe — todas las estadísticas elevadas, sin margen de error',
      academy: 'CANTERA'
    },
    statsPanel: {
      possession: 'Posesión',
      shots: 'Tiros',
      accuracy: 'Precisión',
      buildup: 'Salida %',
      saves: 'Paradas',
      goals: 'Goles',
      abilitiesTriggered: 'Habilidades Activadas',
      currentTeamStats: 'Valores Actuales del Equipo',
      own: 'Tú',
      diff: 'Dif',
      opponent: 'Rival',
      buffsFootnote: 'Los buffs se acumulan entre inicio, descanso y fase final'
    },
    eventReasons: {
      strikerMisses: '{name} ha fallado {n} ocasiones — el lenguaje corporal está roto.',
      keeperStreak: '{name} ha encadenado {n} paradas — está en racha.',
      oppStrikerMisses: 'Su delantero {name} ha fallado {n} ocasiones — se rompe bajo presión.',
      concededStreak: '{conceded} goles encajados seguidos — hay que reaccionar ya.',
      hotCorridor: '{name} está rompiendo por la banda una y otra vez.',
      oppPmStreak: 'Su creador {name} ha encadenado {n} salidas limpias.',
      heatedMoment: 'Ambiente caldeado — las tarjetas están cerca.',
      loose: '{name} se ha escapado — alguien tiene que decidir.',
      clearChance: '{name} tiene balón, ángulo y la portería entera ante sí.',
      oppTacticSwitch: '{opp} cambia a presión alta — su entrenador reacciona.',
      playmakerPulse: '{name} dicta el ritmo. Momento de aprovecharlo.',
      oppKeeperRattled: '{name} titubea. La próxima jugada puede convertir la presión en colapso.',
      backlineStepUp: '{name} lee el juego cada vez mejor — la defensa puede marcar el ritmo.',
      redCardRisk: '{name} está encendido — una mala entrada y fuera.',
      weatherRain: 'Empieza a llover — campo pesado, balones largos impredecibles.',
      weatherWind: 'Viento racheado — los balones largos son lotería.',
      weatherHeat: 'El calor es brutal — las piernas pesan.',
      fanRevolt: 'Pitidos en las gradas tras el {opp}:{me} en contra.',
      oppStarDown: '{name} cojea fuera del campo — su jugador clave podría estar fuera.',
      coachWhisperDirect: 'El segundo entrenador al oído: "Olvida la salida, balón directo."',
      coachWhisperPatient: 'El segundo entrenador al oído: "Bájale el ritmo, desarma la estructura."',
      setPieceAwarded: 'Falta cerca del área — ocasión de oro a balón parado.',
      legsGone: 'Piernas pesadas del ritmo inicial — el equipo necesita ritmo, no sprints.',
      tacticalClashPressing: 'Tu presión choca contra su temple — está costando forma.',
      tacticalClashPossession: 'Su ritmo atraviesa tu posesión — ya están al contraataque.',
      refereeStern: 'El árbitro pita rápido hoy — cada duelo es un riesgo.'
    },
    events: {
      striker_frustrated: {
        title: 'Delantero Frustrado',
        subtitle: '{name} ha fallado {n} ocasiones — el lenguaje corporal no cuadra.',
        option_layoff_pm: {
          name: 'Descargar al creador',
          desc: 'Enfoque del creador: goleador forzado ST, bonus escala con visión del PM.'
        },
        option_push_through: {
          name: 'Insistir',
          desc: '+14% en el próximo tiro de {name}. Confía en que romperá la mala racha.'
        },
        option_swap_off: {
          name: 'Sustituirlo',
          desc: 'Delantero fresco del banquillo. Reinicia la racha, cuesta química.'
        }
      },
      keeper_in_zone: {
        title: 'Portero en Estado',
        subtitle: '{name} ha encadenado {n} paradas — en plena racha.',
        option_launch_counter: {
          name: 'Contragolpe inmediato',
          desc: 'Ataque inmediato con +22% bonus. Aprovechar la inercia.'
        },
        option_stay_solid: {
          name: 'Mantenerse sólido',
          desc: '+12% en la próxima parada. Continuar la portería a cero.'
        }
      },
      opp_striker_frustrated: {
        title: 'Se Están Rompiendo',
        subtitle: 'Su delantero {name} ha fallado {n} ocasiones — cede bajo presión.',
        option_press_high: {
          name: 'Presionar alto',
          desc: '-18% precisión de tiro rival durante 2 rondas. Apretar más.'
        },
        option_guard_desperate: {
          name: 'Cubrir el disparo desesperado',
          desc: '+20% en la próxima parada. Los delanteros frustrados tiran sin control.'
        }
      },
      momentum_shift: {
        title: 'Pérdida de Inercia',
        subtitle: '{conceded} goles seguidos encajados — algo tiene que cambiar ya.',
        option_timeout: {
          name: 'Charla técnica',
          desc: '+12 temple, +6 defensa resto del partido. Calma al equipo.'
        },
        option_switch_tactic: {
          name: 'Cambiar esquema',
          desc: 'Postura contragolpe defensivo. Auto-contra activo 2 rondas.'
        }
      },
      hot_corridor: {
        title: 'Banda Caliente',
        subtitle: '{name} rompe por la banda una y otra vez.',
        option_double_down: {
          name: 'Insistir por la banda',
          desc: '{name} toma el próximo disparo con +15% bonus. Carreras por banda extendidas.'
        },
        option_switch_center: {
          name: 'Pasar al centro',
          desc: '+14 visión, +6 ataque. Sorpréndelos por dentro.'
        }
      },
      opp_pm_dirigent: {
        title: 'Su Director',
        subtitle: 'Su creador {name} ha encadenado {n} salidas limpias.',
        option_push_vt_high: {
          name: 'Subir al defensa',
          desc: '-18% salida rival durante 2 rondas, pero -6 defensa (línea alta arriesgada).'
        },
        option_double_mark: {
          name: 'Doble marca',
          desc: '-25% salida rival durante 3 rondas. Ahogar al creador.'
        },
        option_bait_counter: {
          name: 'Cebar el contra',
          desc: 'Auto-contra armado 2 rondas. Déjalo que se crea el control.'
        }
      },
      hitziger_moment: {
        title: 'Momento Caliente',
        subtitle: 'Los ánimos subieron tras el último duelo.',
        option_captain_calm: {
          name: 'Capitán calma',
          desc: '+10 temple resto del partido. Cabezas frías imponen.'
        },
        option_go_harder: {
          name: 'Ir más duros',
          desc: '+10 defensa, +5 ritmo. Riesgo de tarjeta: 37% (18% roja). Jugada grande.'
        },
        option_ignore: {
          name: 'Ignorar',
          desc: 'Sin cambio. Dejar respirar al partido.'
        }
      },
      freier_mann: {
        title: 'Hombre Suelto',
        subtitle: '{name} se ha escapado — alguien debe decidir.',
        option_foul_stop: {
          name: 'Falta táctica',
          desc: 'Corta el ataque. VT ve amarilla (roja si era la segunda).'
        },
        option_retreat: {
          name: 'Replegar y cubrir',
          desc: '-15% tiro rival esta ronda. Más seguro, menos decisivo.'
        },
        option_keeper_out: {
          name: 'Portero sale',
          desc: '50/50: victoria limpia o gol forzado. Cara o cruz.'
        }
      },
      clear_chance: {
        title: 'Portería Abierta',
        subtitle: '{name} tiene balón, ángulo y toda la portería a la vista.',
        option_place_flat: {
          name: 'Colocar raso',
          desc: '+18% bonus de tiro inmediato. Conservador, fiable.'
        },
        option_chip_keeper: {
          name: 'Vaselina',
          desc: 'Depende del temple: +30% si compuesto, -10% si nervioso.'
        },
        option_square_lf: {
          name: 'Pase al corredor',
          desc: '+22% el LF toma el tiro. Desinteresado, a menudo letal.'
        }
      },
      taktikwechsel_opp: {
        title: 'Cambian de Forma',
        subtitle: '{opp} pasa a presión alta — su entrenador reacciona.',
        option_long_balls: {
          name: 'Balonazos por encima',
          desc: '+14 ataque, -6 visión resto del partido. Saltarse la presión.'
        },
        option_hold_possession: {
          name: 'Mantener posesión',
          desc: '+14 visión, +8 temple. Bloqueo de posesión activo.'
        },
        option_match_aggression: {
          name: 'Igualar agresión',
          desc: '+12 ritmo, +8 defensa, -4 temple. Presión activa.'
        }
      },
      playmaker_pulse: {
        title: 'Pulso del Creador',
        subtitle: '{name} marca el ritmo. Es el momento de apoyarse en él.',
        option_release_runner: {
          name: 'Liberar al corredor',
          desc: 'Ataque abierto inmediato con visión extra. Forzar la siguiente jugada por la banda.'
        },
        option_dictate_tempo: {
          name: 'Dictar el ritmo',
          desc: 'Visión y temple suben el resto del partido. Fijar el juego a tu ritmo.'
        },
        option_thread_risk: {
          name: 'Pases al filo',
          desc: 'La próxima salida recibe un gran empujón, el creador sigue forzando pases más afilados.'
        }
      },
      opp_keeper_rattled: {
        title: 'Portero Sacudido',
        subtitle: '{name} se tambalea. La próxima decisión puede convertir la presión en colapso.',
        option_shoot_early: {
          name: 'Tirar a la primera',
          desc: 'Su tasa de parada baja 2 rondas. Menos paciencia, más volumen.'
        },
        option_crash_box: {
          name: 'Saturar el área',
          desc: 'Ataque y ritmo suben de inmediato. Segundos balones y rechaces asegurados.'
        },
        option_reset_probe: {
          name: 'Rehacer y tantear',
          desc: 'Empuje a la próxima salida y afina el último pase antes del tiro.'
        }
      },
      backline_step_up: {
        title: 'Defensa Adelantada',
        subtitle: '{name} sigue leyendo el juego. La defensa puede marcar el tono ahora.',
        option_step_in: {
          name: 'Entrar al medio',
          desc: 'La próxima salida gana fuerza y todo el bloque sube cinco metros.'
        },
        option_hold_shape: {
          name: 'Mantener forma',
          desc: 'Bloque más seguro 2 rondas. Calidad de tiro rival baja y temple sube.'
        },
        option_spring_trap: {
          name: 'Cerrar la trampa',
          desc: 'Postura de contragolpe armada y sus próximas salidas se tambalean.'
        }
      },
      red_card_risk: {
        title: 'Al Filo',
        subtitle: '{name} está encendido — una mala entrada es un desastre.',
        option_play_hard: { name: 'Jugar al filo', desc: '+14 defensa, +6 ritmo. Pero 25% de amarilla.' },
        option_play_clean: { name: 'Calmarlo', desc: '+10 temple, +5 defensa. Seguro, inteligente, más lento.' },
        option_substitute_def: { name: 'Sustituir', desc: 'Defensa fresco del banquillo. Reiniciar el fusible.' }
      },
      weather_shift: {
        title: 'Cambio de Clima',
        subtitle: 'Las condiciones cambiaron — nuevo plan necesario.',
        option_adapt_tempo: { name: 'Adaptar', desc: 'Ralentizar el juego, aguantar las condiciones. Boost defensivo.' },
        option_push_through_weather: { name: 'Insistir', desc: 'Ignorar el clima, atacar igual. +12 ataque, -6 temple.' }
      },
      fan_revolt: {
        title: 'Inquietud en la Grada',
        subtitle: 'La grada está inquieta — empiezan los silbidos.',
        option_rally_crowd: { name: 'Usarlo como combustible', desc: '+14 ataque, +8 ritmo. Canalizar la rabia hacia adelante.' },
        option_ignore_noise: { name: 'Aislarse del ruido', desc: '+16 temple, +8 visión. Fútbol clínico y enfocado.' }
      },
      opp_star_down: {
        title: 'Su Estrella se Apaga',
        subtitle: '{name} no llega al ritmo — el lenguaje corporal dice acabado.',
        option_capitalize: { name: 'A por ellos', desc: '+18 ataque, +10 ritmo, -4 defensa. No dejar que se recuperen.' },
        option_stay_disciplined: { name: 'Mantener disciplina', desc: '+10 defensa, +10 temple, +6 visión. Aguantar.' }
      },
      coach_whisper: {
        title: 'Sugerencia del Segundo',
        subtitle: 'Tu ayudante tiene una idea.',
        option_trust_coach: { name: 'Confiar en la lectura', desc: 'Seguir el ajuste sugerido. Situacional pero dirigido.' },
        option_trust_instinct: { name: 'Ir con el instinto', desc: 'Equilibrado +8 en ataque, defensa, temple.' }
      },
      hot_player: {
        title: 'En Llamas',
        subtitle: '{name} ha marcado y se ve imparable.',
        option_boost: { name: 'Mantenerlo así', desc: 'Permanente +{bonus} a {stat}.' },
        option_stabilize: { name: 'Mantener la forma', desc: 'Proteger la ventaja — estabilidad defensiva.' }
      },
      crisis_moment: {
        title: 'Cabezas Caídas',
        subtitle: '{deficit} abajo — el vestuario necesita una chispa.',
        option_team_talk: { name: 'Charla de equipo', desc: '70% boost de temple+ataque, 30% fracaso.' },
        option_focus: { name: 'Foco en uno', desc: 'Presión sobre un jugador para dar la vuelta.' },
        option_accept: { name: 'Aceptar y apretar', desc: 'Mantenerse compactos — recuperación de forma.' }
      },
      opp_mistake: {
        title: 'Se Rompen',
        subtitle: '{opp} ha fallado {n} salidas. La presión hace efecto.',
        option_exploit: { name: 'Ir a por ello', desc: 'Ataque inmediato con bonus.' },
        option_sustain: { name: 'Mantener la presión', desc: 'Malus de salida sostenido.' }
      },
      legendary_demand: {
        title: '{name} Quiere Entrar',
        subtitle: 'Tu legendario mira desde el banquillo.',
        option_bring_on: { name: 'Meter a {name}', desc: 'Sustituirlo — impacto legendario completo.' },
        option_morale: { name: 'Todavía no', desc: 'Mantenerlo fresco — pequeño boost al equipo.' }
      },
      season_finale: {
        title: 'Lucha por el Título',
        subtitle: 'Último partido — puntos en juego, nervios a flor de piel.',
        option_allin: { name: 'Jugárselo todo', desc: 'Arriesgarlo todo — techo más alto, suelo más alto.' },
        option_controlled: { name: 'Enfoque controlado', desc: 'Constante y clínico.' }
      },
      set_piece_awarded: {
        title: 'Balón Parado',
        subtitle: 'Falta cerca de su área — ¿cómo ejecutarla?',
        option_quick_surprise: { name: 'Rápido y sorpresa', desc: 'Ataque inmediato, +24% bonus. Sorpréndelos desordenados.' },
        option_delivery_focus: { name: 'Trabajar la jugada', desc: '+14% próxima salida, equipo +6 temple/visión durante 2 rondas.' }
      },
      legs_gone: {
        title: 'Piernas Pesadas',
        subtitle: 'Final de partido y el equipo corre de reservas.',
        option_push_anyway: { name: 'Insistir igual', desc: '+6 ritmo, +4 ataque, -8 temple. Esperar que la adrenalina nos lleve.' },
        option_manage_rhythm: { name: 'Gestionar el ritmo', desc: '-6 ritmo, +8 defensa, +10 temple. Preservar y controlar.' }
      },
      tactical_clash: {
        title: 'Choque Táctico',
        subtitle: 'Tu planteamiento choca con su fuerza — ¿ajustar o insistir?',
        option_adapt: { name: 'Adaptar', desc: '-5 ataque, +10 defensa, +8 visión. Ajustar el plan en pleno partido.' },
        option_double_down: { name: 'Doblar la apuesta', desc: '+14 ataque, +6 ritmo, -8 defensa. Vencerles en su terreno.' }
      },
      referee_stern: {
        title: 'Árbitro Estricto',
        subtitle: 'El pitido llega rápido hoy — tarjetas para quien cruce la línea.',
        option_play_clean: { name: 'Jugar limpio', desc: '+10 temple, -4 ritmo. Sin riesgo de tarjeta, ritmo controlado.' },
        option_normal_game: { name: 'Seguir normal', desc: 'Ellos también están alerta: rival -5 ritmo durante 2 rondas. Cautela mutua.' }
      }
    },
    evolution: {
      title: '¡EVOLUCIÓN!',
      reachedLevel: '{name} ({role}) alcanza el nivel {level}',
      traitLabel: 'Habilidad: {name}',
      keepsTrait: 'mantiene: {name} (+30%)'
    },
    flow: {
      lineupIncomplete: '¡Alineación incompleta! Elige 5 jugadores.',
      benchFull: '¡El banquillo está lleno!',
      lineupInvalid: '¡Alineación inválida! Necesitas exactamente 1 portero y 5 jugadores en total.',
      lineupSuspended: '{name} está sancionado — por favor, sustitúyelo con un jugador del banquillo.',
      academyCalledUp: 'Banquillo vacío — se llama a suplentes de la cantera: {list}. Sus estadísticas son notablemente inferiores.',
      kickoffTitle: 'Táctica Inicial',
      kickoffSubtitle: '¿Cómo empezamos?',
      halftimeTitle: 'Ajuste al Descanso',
      scoreSubtitle: 'Marcador: {me}:{opp}',
      finalTitle: 'Decisión Final',
      roundScoreSubtitle: 'Ronda 6 — Marcador: {me}:{opp}',
      reward: 'Ø {avg} XP/jugador — según rendimiento',
      gameOverStreak: '3 derrotas seguidas — ¡entrenador despedido!',
      gameOverLosses: '{losses} derrotas acumuladas — temporada terminada.',
      safe: 'SALVADO',
      rescued: 'SALVADO POR POCO',
      points: '{points} PUNTOS',
      record: '✦ NUEVO RÉCORD ✦',
      bestScore: 'Mejor marca: {points} pts ({team})',
      afterMatches: '{points} puntos tras {matches} partidos',
      bestRun: '✦ Nueva mejor campaña ✦'
    },
    perf: {
      buildups: '{ok}/{all} salidas',
      defenses: '{count} despejes',
      keeper: '{saves} paradas  {conceded} encajados'
    },
    log: {
      opponentIntro: '  ↳ Rival: {parts}',
      kickoffChoice: '  → Inicio: {name}',
      halftimeHeader: '––– DESCANSO –––',
      halftimeChoice: '  → Descanso: {name}',
      finalChoice: '  → Fase final: {name}',
      possessionPressure: '  Posesión: {pct}% — fase de presión',
      possessionDominated: '  Posesión: {pct}% — domina el rival',
      chainAttack: '  ⚡ ¡Ataque en cadena!',
      luckyDouble: '  🍀 {name} tiene suerte — ¡doble ataque!',
      counter: '  🔁 ¡Contraataque!',
      activeBuffs: '  📊 Buffs activos: {buffs}',
      synergyBonus: '  🔗 Sinergia: {name} ({trait}) +{bonus}% ataque',
      tacticPressingTrigger: '  🏃 La presión surte efecto — robo y contraataque!',
      tacticCounterTrigger: '  🔁 Táctica de contra activa — siguiente salida reforzada!',
      tacticRallyTrigger: '  💪 ¡La reacción se dispara! +{bonus} ataque por el marcador!',
      tacticHighPressTrigger: '  🏃 Presión alta — ¡balón recuperado!',
      tacticFinalPressTrigger: '  ⚡ Presión final — ¡contraataque lanzado!',
      tacticGambleWin: '  🎲 La apuesta sale — +35 ataque del equipo.',
      tacticGambleLoss: '  🎲 La apuesta falla — -15 en cada stat.',
      tacticShakeUp: '  🔄 Sacudida: {name} cae, el equipo se afila.',
      tacticLoneWolf: '  🐺 Lobo solitario: {name} carga con todo.',
      tacticFortress: '  🛡 Fortaleza: {tw} y {vt} cierran atrás.',
      tacticMasterclass: '  🎼 Clase magistral: {name} dirige el juego.',
      laserPass: '🎯 {name} PASE LÁSER — ¡contra activada!',
      bulldoze: '🛡 {name} BULLDOZE — robo y contraataque!',
      hardTackle: '🥾 {name} ENTRADA DURA — ¡contra!',
      chessPredict: '♟ {name} CHESS PREDICT — leyó el gol rival!',
      speedBurst: '💨 {name} SPEED BURST — salida garantizada!',
      pounce: '🐆 {name} INSTINTO DE CAZA — ¡contra inmediata!',
      oppBlitzCounter: '  ⚡ {name} sale disparado al contraataque!',
      shadowStrike: '{name} GOLPE SOMBRA - ataque oculto!',
      streetTrick: '{name} TRUCO CALLEJERO - defensor superado!',
      silentKiller: '{name} ASESINO SILENCIOSO - primer disparo potenciado!',
      cannonBlast: '{name} CANONAZO!',
      ghostRun: '{name} CARRERA FANTASMA - ocasion oculta!',
      puzzleConnect: '{name} PUZLE CONECTADO!',
      nineLives: '🐱 {name} NUEVE VIDAS — ¡gol anulado!',
      killerPass: '⚡ {name} PASE LETAL — ¡cadena en la siguiente ronda!',
      maestroCombo: '🎼 {name} COMBO MAESTRO — ¡el próximo gol vale doble!',
      unstoppable: '🚀 {name} IMPARABLE — ¡gol sin respuesta!',
      godMode: '⭐ {name} MODO DIOS — ¡siguiente gol x3!',
      unbreakable: '🛡 {name} IRROMPIBLE — ¡gol anulado!',
      roundHeader: 'RONDA {round}',
      ownGoal: '⚽ GOL {name}!{suffix}   {me}:{opp}',
      oppGoal: '💥 Gol encajado — marca {name}   {me}:{opp}',
      fullTime: '🏁 FINAL — {me}:{opp}',
      penaltiesIntro: '🏁 90 MINUTOS TERMINADOS — {me}:{opp}',
      penaltiesTitle: '⚽ TANDA DE PENALTIS — ¡no hay empate en el último partido!',
      penaltyScored: '  {num}. ⚽ convertido — {me}:{opp}',
      penaltyMissed: '  {num}. ⚠ fallado — {me}:{opp}',
      oppPenaltyScored: '  {name} marca — {me}:{opp}',
      oppPenaltyMissed: '  {name} falla — {me}:{opp}',
      suddenDeath: '  Muerte súbita: {me}:{opp}',
      penaltiesWin: '🏆 VICTORIA EN LOS PENALTIS',
      penaltiesLoss: '💥 DERROTA EN LOS PENALTIS',
      eventSetPieceQuick: '  ⚡ Ejecución rápida — ¡los pillamos fríos!',
      eventSetPieceDelivery: '  🎯 Trabajar el balón parado — salida paciente.',
      eventLegsPush: '  💢 Piernas pesadas — insistir igual.',
      eventLegsManage: '  🧘 Gestionar el ritmo — preservar y controlar.',
      eventClashAdapt: '  🔄 Adaptando — dejar el enfoque que choca.',
      eventClashCommit: '  ⚔ Doblando apuesta — entrar a la pelea.',
      eventRefClean: '  ✓ Jugar limpio — temple sobre agresión.',
      eventRefNormal: '  ⚖ Ambos cautos con el árbitro — partido contenido.',
      eventCoachTrust: '  📋 Siguiendo la lectura del ayudante — plan activado.',
      eventCoachInstinct: '  🎯 Decisión de instinto — enfoque equilibrado.'
    }
  },
  stats: {
    offense: 'Ataque',
    defense: 'Defensa',
    tempo: 'Ritmo',
    vision: 'Visión',
    composure: 'Temple'
  },
  generated: {
    masteryName: 'Maestría de {label}',
    masteryDesc: 'Evolución desde {parent}: potencia {stats}. El rasgo anterior es un 30% más fuerte.'
  },
  logs: {
    ownBuildFail: [
      '{pm} pierde el balón en el medio',
      'El rival intercepta el pase de {pm}',
      'Un mal pase de {vt} deja espacio para la contra',
      '{pm} se pasa con el balón vertical',
      'La presión obliga a {pm} a jugar hacia atrás',
      'Pérdida en la línea de medio campo'
    ],
    ownBuildSuccess: [
      '{pm} rompe líneas con un pase filtrado',
      '{pm} encuentra el hueco entre líneas',
      'Pared rápida entre {pm} y {lf}',
      '{pm} cambia el juego hacia la banda',
      '{lf} acelera por fuera',
      '{vt} inicia bien la jugada — {pm} toma el mando',
      '{pm} conduce hasta el último tercio'
    ],
    chance: [
      '{scorer} remata...',
      '{scorer} se impone en el área...',
      '{scorer} tiene la ocasión...',
      '{scorer} acecha frente al arco...',
      '{scorer} recibe dentro del área...'
    ],
    miss: [
      '{scorer} la manda por poco fuera',
      '{scorer} pega en el poste!',
      '{scorer} remata centrado — el portero ataja',
      '{scorer} la manda arriba',
      '{scorer} es bloqueado en el último instante',
      '{scorer} perdona la ocasión',
      '{scorer} revienta el larguero!'
    ],
    oppBuildFail: [
      '{opp} pierde el balón en la salida',
      '{opp} falla completamente el pase',
      '{vt} corta la jugada',
      '{opp} se ve frenado en la construcción',
      'La contrapresión obliga a {opp} a equivocarse'
    ],
    oppApproach: [
      '{opp} llega por la banda',
      '{opp} acelera el juego hacia delante',
      '{opp} busca el remate',
      'El delantero rival rompe la línea defensiva',
      '{opp} progresa por el centro'
    ],
    save: [
      '{tw} saca una gran mano!',
      '{tw} atrapa con seguridad',
      '{vt} bloquea el disparo en el último instante',
      'Disparo desviado — {tw} lo tenía controlado',
      '{tw} aparece con una parada brillante!',
      'Cabezazo fuera'
    ]
  },
  data: {
    evoLabels: {
      titan: 'Titán',
      fortress: 'Fortaleza',
      shotstopper: 'Parador',
      libero_keeper: 'Portero Líbero',
      distributor: 'Distribuidor',
      highline: 'Línea Alta',
      acrobat: 'Acróbata',
      wall: 'Muro',
      catman: 'Hombre Gato',
      enforcer: 'Ejecutor',
      bulldozer: 'Bulldozer',
      captain_cool: 'Capitán Frío',
      shark: 'Tiburón',
      terminator: 'Terminator',
      whirlwind: 'Torbellino',
      orchestrator: 'Orquestador',
      late_bloomer: 'Tardío',
      scholar: 'Erudito',
      metronome: 'Metrónomo',
      architect: 'Arquitecto',
      whisperer: 'Susurrador',
      hunter: 'Cazador',
      gegenpress: 'Gegenpress',
      shadow: 'Sombra',
      maestro_mid: 'Maestro',
      chess: 'Maestro del Ajedrez',
      conductor_mid: 'Director',
      speedster: 'Velocista',
      rocket: 'Cohete',
      freight: 'Tren de Carga',
      magician: 'Mago',
      street: 'Jugador Callejero',
      trickster: 'Tramposo',
      ironman: 'Ironman',
      dynamo: 'Dínamo',
      eternal: 'Eterno',
      assassin: 'Asesino',
      predator_s: 'Depredador',
      opportunist: 'Oportunista',
      cannon: 'Cañón',
      skyscraper: 'Rascacielos',
      brick: 'Muro',
      ghost: 'Fantasma',
      puzzle: 'Rompecabezas',
      chameleon: 'Camaleón'
    },
    roles: {
      TW: { label: 'Portero', desc: 'Resuelve el uno contra uno' },
      VT: { label: 'Defensa', desc: 'Muro de la zaga' },
      PM: { label: 'Creador', desc: 'Ordena las jugadas' },
      LF: { label: 'Corredor', desc: 'Factor caos' },
      ST: { label: 'Delantero', desc: 'Definición' }
    },
    archetypes: {
      keeper_block: 'Portero Bloqueador',
      keeper_sweep: 'Portero Líbero',
      keeper_reflex: 'Portero de Reflejos',
      def_wall: 'Muralla',
      def_tackle: 'Mordedor',
      def_sweeper: 'Líbero',
      pm_regista: 'Regista',
      pm_press: 'Presionador',
      pm_playmaker: 'Organizador',
      lf_winger: 'Extremo Eléctrico',
      lf_dribbler: 'Regateador',
      lf_box: 'Box-to-Box',
      st_poacher: 'Cazagoles',
      st_target: 'Hombre Referencia',
      st_false9: 'Falso Nueve'
    },
    traits: {
      titan_stand: { name: 'Postura Titán', desc: 'Ante disparos rivales: 30% de parar cuando el marcador está ajustado (≤1 dif).' },
      fortress_aura: { name: 'Aura Fortaleza', desc: 'El defensa recibe +6 de defensa mientras el portero está activo.' },
      clutch_save: { name: 'Parada Clutch', desc: 'En las rondas 5-6: +20% de índice de parada.' },
      sweep_assist: { name: 'Apoyo de Barrida', desc: 'Tras una parada del portero: +8% a la siguiente salida.' },
      laser_pass: { name: 'Pase Láser', desc: 'Tras una parada: 20% de probabilidad de activar una contra inmediata.' },
      offside_trap: { name: 'Trampa del Fuera de Juego', desc: 'Se anula el 15% de los ataques rivales (basado en ritmo).' },
      acrobat_parry: { name: 'Acrobacia', desc: 'Tras una parada: +12% a la siguiente, una vez por partido.' },
      wall_effect: { name: 'Muro', desc: '+15% permanente al índice de parada, pero -10% a tu salida.' },
      nine_lives: { name: 'Nueve Vidas', desc: 'Una vez por partido: se anula el primer gol recibido.' },
      intimidate: { name: 'Intimidar', desc: 'El delantero rival recibe -5 de ataque.' },
      bulldoze: { name: 'Bulldozer', desc: 'Cada ronda: 10% de robar el balón antes del disparo rival.' },
      captain_boost: { name: 'Capitán', desc: 'Todo el equipo recibe +3 de temple.' },
      blood_scent: { name: 'Olor a Sangre', desc: 'Después de cada gol rival: +5 de defensa durante el resto del partido.' },
      hard_tackle: { name: 'Entrada Dura', desc: '20% de romper el ataque rival y lanzar una contra.' },
      whirlwind_rush: { name: 'Torbellino', desc: 'Una vez por cada parte: duplica el ritmo de este jugador durante una ronda.' },
      build_from_back: { name: 'Salida Desde Atrás', desc: 'El creador recibe +8 de visión.' },
      late_bloom: { name: 'Explosión Tardía', desc: 'Desde la ronda 4: +10 de ataque y +5 de visión.' },
      read_game: { name: 'Leer el Juego', desc: 'Una vez por partido: anula automáticamente un ataque rival.' },
      metronome_tempo: { name: 'Metrónomo', desc: 'Cada ronda: +2% a tu salida (acumulable).' },
      killer_pass: { name: 'Pase Letal', desc: 'En tu ataque: 25% de activar un disparo en cadena.' },
      whisper_boost: { name: 'Susurro', desc: 'El delantero recibe +8 de temple y +4 de ataque.' },
      hunter_press: { name: 'Fiebre de Caza', desc: '15% por ronda de recuperar el balón mediante presión.' },
      gegenpress_steal: { name: 'Gegenpress', desc: 'Tras cada pérdida rival: +15% a tu siguiente salida.' },
      shadow_strike: { name: 'Golpe Sombra', desc: 'En las rondas 3 y 6: 20% de probabilidad de un ataque oculto.' },
      maestro_combo: { name: 'Combo Maestro', desc: 'Si PM, LF y ST marcan: tu siguiente gol vale doble.' },
      chess_predict: { name: 'Predicción', desc: 'Una vez por parte: convierte un gol rival en parada.' },
      symphony_pass: { name: 'Sinfonía', desc: 'Si 2+ compañeros activan rasgos: +10% de ataque para el equipo.' },
      speed_burst: { name: 'Aceleración', desc: 'Una vez por parte: salida garantizada.' },
      launch_sequence: { name: 'Lanzamiento', desc: 'En la ronda 1: +20% de éxito en tu ataque.' },
      unstoppable_run: { name: 'Imparable', desc: 'Si el ritmo supera la defensa rival: 10% de gol automático.' },
      dribble_chain: { name: 'Cadena de Regates', desc: 'Cada ataque exitoso da +5% al siguiente (acumulable).' },
      street_trick: { name: 'Truco Callejero', desc: '15% de superar por completo al defensor.' },
      nutmeg: { name: 'Caño', desc: '20% en tu ataque de ignorar la defensa rival.' },
      ironman_stamina: { name: 'Ironman', desc: 'En las rondas 5-6: sin desgaste y +2 de ritmo para el equipo.' },
      dynamo_power: { name: 'Dínamo', desc: 'Cada dos rondas: +6 de ataque para el equipo en esa ronda.' },
      never_stop: { name: 'No Parar', desc: 'Si vas perdiendo: +8 de ataque por cada gol recibido.' },
      silent_killer: { name: 'Asesino Silencioso', desc: 'El primer disparo del partido recibe +30% de ataque.' },
      predator_pounce: { name: 'Salto Depredador', desc: 'Tras un ataque rival fallido: 25% de probabilidad de gol instantáneo.' },
      opportunity: { name: 'Oportunidad', desc: 'Cada salida exitosa suma +3% de opción de gol.' },
      cannon_blast: { name: 'Cañonazo', desc: 'Cada disparo tiene un 10% de convertirse en gol automático, pero la probabilidad de fallo sube un 5%.' },
      header_power: { name: 'Bestia Aérea', desc: 'Con alta visión de equipo: +15% de opción de gol.' },
      brick_hold: { name: 'Sujeción de Balón', desc: 'Estabiliza al equipo: -10% a la presión rival.' },
      ghost_run: { name: 'Carrera Fantasma', desc: '15% por ronda de aparecer de repente para generar una ocasión.' },
      puzzle_connect: { name: 'Pieza de Puzle', desc: 'Si marca el creador: +25% a tu siguiente opción de gol.' },
      chameleon_adapt: { name: 'Adaptación', desc: 'Copia el rasgo del compañero más activo en la ronda 4.' }
    },
    starterTeams: {
      konter: { name: 'Especialistas al Contraataque', theme: 'rápidos, defensivos, castigan errores', desc: 'Fuertes en el medio y por fuera. Marcan en transición.' },
      kraft: { name: 'Potencia Bruta', theme: 'físico, juego aéreo, desgaste', desc: 'Gana por pura presencia física. Muy fuerte al final del partido.' },
      technik: { name: 'Magos Técnicos', theme: 'basado en visión, combinaciones por pase', desc: 'Construye ataques de la nada. Lento, pero preciso.' },
      pressing: { name: 'Bestias de la Presión', theme: 'agresivos, rompen la salida rival', desc: 'Fuerza errores con presión constante. Fútbol de riesgo y nervios frágiles.' }
    },
    opponents: {
      prefixes: ['SC ', 'FC ', 'Atlético ', 'Unión ', 'Deportivo ', 'Dínamo ', 'Real ', 'Racing ', 'Estrella Roja ', 'Albión '],
      places: ['Bosquenoche', 'Fortatormenta', 'Peñafría', 'Vallehierro', 'Puenteáspero', 'Monte Trueno', 'Puerto Viento', 'Ventisca', 'Campo Cuervo', 'Valle Sombrío', 'Cuerno de Fuego', 'Niebla Alta', 'Páramo', 'Rocasangre', 'Arboleda Tempestad'],
      specials: {
        offensive: 'Enfoque Ofensivo',
        defensive: 'Fortaleza',
        pacey: 'Velocidad Pura',
        cerebral: 'Táctico',
        stoic: 'De Hierro',
        balanced: 'Equilibrado'
      }
    },
    oppTells: {
      offensive: 'Muy ofensivo — priorizar la organización defensiva',
      defensive: 'Completamente cerrado — necesita velocidad o visión para abrirlo',
      pacey: 'Extremadamente rápido — peligro de contra en ambos extremos',
      cerebral: 'Tácticamente pulido — el juego de posesión es peligroso',
      stoic: 'Inquebrantable — los nervios decidirán en el tramo final',
      balanced: 'Sin debilidad evidente — mantente adaptable',
      trait_sturm: 'Muy peligroso ante el arco — los disparos son muy precisos',
      trait_riegel: 'Contrarresta activamente el remate — las paradas son más difíciles',
      trait_konter_opp: 'Espera los errores — contra inmediata ante cualquier pérdida',
      trait_presser_opp: 'Presión agresiva — la salida está bajo tensión constante',
      trait_clutch_opp: 'Más fuerte en el tramo final — las rondas 5-6 son peligrosas',
      trait_lucky: 'Suerte impredecible — espera ataques inesperados',
      trait_ironwall: 'Muy defensivo al inicio — las rondas 1-2 son difíciles de romper',
      trait_sniper: 'Tirador de precisión — cada disparo es una amenaza'
    },
    tactics: {
      kickoff: {
        aggressive: { name: 'Inicio Agresivo', desc: '+18 ataque R1-3, -8 defensa. Presión total desde el primer silbato.' },
        defensive: { name: 'Inicio Defensivo', desc: '+18 defensa R1-3, -8 ataque. Dejarles venir y golpear al contra.' },
        balanced: { name: 'Equilibrado', desc: '+8 a TODAS las stats R1-3. Primera salida garantizada — nada de arranque frío.' },
        tempo: { name: 'Ritmo Alto', desc: '+22 ritmo R1-3, -6 temple. Arrollar antes de que se asienten.' },
        pressing: { name: 'Presión', desc: '+14 defensa, +10 ritmo R1-3. Su salida cae fuerte — pero aparecen huecos.' },
        possession: { name: 'Posesión', desc: '+18 visión, +10 temple R1-3. Controlar el juego — una pérdida invita al contra.' },
        counter: { name: 'Emboscada al Contra', desc: '+22 defensa, +10 ritmo, -6 ataque. Cada ataque rival fallido dispara un contra.' },
        flank_play: { name: 'Juego por Bandas', desc: '+14 ritmo, +14 ataque R1-3. Anchos y rápidos desde el principio.' },
        slow_burn: { name: 'Fuego Lento', desc: 'Castigar su paciencia: -4 ataque R1-2, luego +22 ataque R3. Primero adormecer.' },
        shot_flood: { name: 'Lluvia de Disparos', desc: '+24 ataque R1-3. Cantidad sobre calidad — esperar fallos, forzar errores.' },
        lockdown: { name: 'Candado', desc: '+28 defensa R1-3, -12 ataque, -8 ritmo. Ni encajar ni marcar.' },
        mindgames: { name: 'Juegos Mentales', desc: '+14 visión, +10 temple. Rival -6 temple R1-3. Meterse en sus cabezas.' },
        underdog: { name: 'Modo Outsider', desc: 'Solo ante rivales muy superiores: +14 a TODAS las stats R1-6. El equipo se crece.' },
        favorite: { name: 'Chulería', desc: 'Solo si eres claro favorito: +10 visión, +6 ritmo, momentum más rápido. Jugar con desparpajo.' },
        wet_start: { name: 'Absorber y Golpear', desc: 'R1-2 defensa pura, luego R3 explosión: +24 ataque al saque de la ronda 3.' },
        chaos: { name: 'Fútbol Caótico', desc: 'Cada ronda: +20 a una stat aleatoria, -10 a dos. Alta varianza — aceptarlo.' },
        zone_defense: { name: 'Defensa en Zona', desc: '+12 defensa, +12 temple, -5 ritmo R1-3. Estructurada, no agresiva. Entre presión y candado.' },
        quick_strike: { name: 'Golpe Rápido', desc: 'R1: +30 ataque explosivo. R2-3: +5 a todas las stats. Primero explosión, luego medido.' },
        disciplined: { name: 'Disciplinado', desc: '+10 a todas las stats R1-3. Penalizaciones de forma negativa ignoradas — jugadores en crisis juegan normal.' },
        read_the_room: { name: 'Leer el Partido', desc: '+15 visión, +10 temple, +8 defensa R1-3. Cabeza, no ritmo.' }
      },
      halftime: {
        push: { name: 'Arriesgar', desc: '+20 ataque R4-6, -10 defensa. Si vas perdiendo, el bonus crece por cada gol.' },
        stabilize: { name: 'Estabilizar', desc: '+18 defensa, +10 temple R4-6. Si vas ganando, el muro crece por cada gol.' },
        shift: { name: 'Reubicar', desc: 'Un jugador gana ahora +18 permanente en su estadística clave.' },
        rally: { name: 'Reacción', desc: '+6 ataque por gol recibido, +6 defensa por gol marcado. Enorme potencial de vuelco.' },
        reset: { name: 'Reordenar', desc: '+12 a TODAS las stats R4-6. Borrar la pizarra — sin guion.' },
        counter_h: { name: 'Ir al Contra', desc: '+24 ritmo, +14 defensa R4-6. Ataque rival fallido dispara un contra.' },
        high_press: { name: 'Presión Alta', desc: '+22 defensa R4-6, -6 temple. Aprieta su salida — pero los huecos son reales.' },
        vision_play: { name: 'Abrir el Juego', desc: '+22 visión, +10 ataque R4-6. Crear huecos y aprovecharlos.' },
        shake_up: { name: 'Sacudida', desc: 'El jugador en peor forma sufre -5 permanente en todas sus stats. Equipo responde: +12 ataque R4-6.' },
        lock_bus: { name: 'Cerrar el Autobús', desc: 'Solo si vas ganando: +30 defensa, -20 ataque R4-6. Impenetrable pero sin colmillos.' },
        desperate: { name: 'Ataque Desesperado', desc: 'Solo con 2+ de desventaja: +32 ataque R4-6, -20 defensa. Portero a su suerte. Todo o nada.' },
        role_switch: { name: 'Cambio de Rol', desc: 'LF y ST intercambian roles R4-6. +10 ritmo, +10 ataque, -8 visión. Nuevos ángulos de ataque.' },
        coach_fire: { name: 'Bronca Apasionada', desc: 'Solo si vas perdiendo: próximo partido +1 forma de equipo, este +14 ataque R4-6. La rabia los mueve.' },
        cold_read: { name: 'Leer el Juego', desc: 'Descifrar sus tácticas. +20 defensa, ataque rival -8 R4-6. Más listos, no más duros.' },
        wingman: { name: 'Liberar al Extremo', desc: 'LF: +25 ritmo, +15 ataque personal. Equipo -4 temple. Riesgo del hombre-espectáculo.' },
        mind_reset: { name: 'Reinicio Mental', desc: 'Borra todos los deltas de forma del equipo. Pizarra en blanco para R4-6 — sin lastre, sin impulso.' },
        double_down: { name: 'Doblar la Apuesta', desc: 'Amplifica tu mayor bonus de equipo actual un +40%. Recompensa el impulso — sin efecto si no lo tienes.' },
        tactical_foul: { name: 'Faltas Tácticas', desc: '+8 defensa, ritmo rival -12 durante 2 rondas. Interrumpir, no mejorarse.' },
        wing_overload: { name: 'Sobrecarga en Banda', desc: 'LF: +20 ataque, +20 ritmo personal R4-6. Equipo -6 defensa. Espectáculo unipersonal.' },
        shell_defense: { name: 'Defensa en Caparazón', desc: 'Solo con empate o ventaja: +24 defensa, +14 temple, -10 ataque R4-6. Preservar la situación.' }
      },
      final: {
        all_in: { name: 'Todo o Nada', desc: 'Última ronda: +15 ataque, -15 defensa. Crece si vas perdiendo. Completamente abiertos atrás.' },
        park_bus: { name: 'Autobús', desc: 'Última ronda: +15 defensa, -10 ataque. Crece por cada gol de ventaja.' },
        hero_ball: { name: 'Héroe del Día', desc: 'Jugador en mejor forma gana ahora +30 permanente en su estadística clave.' },
        keep_cool: { name: 'Mantener la Calma', desc: 'Última ronda: +20 temple, +12 visión. Nervios de acero.' },
        final_press: { name: 'Presión Final', desc: 'Última ronda: +24 ritmo, +18 defensa, -10 ataque. Alta probabilidad de contra.' },
        long_ball: { name: 'Balón Largo', desc: 'Última ronda: +28 ataque, -10 visión. Directo y duro.' },
        midfield: { name: 'Control del Medio', desc: 'Última ronda: +20 visión, +16 ritmo, +14 temple.' },
        sneaky: { name: 'Emboscada', desc: 'Última ronda: +28 defensa, +18 ritmo, -14 ataque. Atraer y saltar.' },
        sacrifice: { name: 'Sacrificio', desc: 'Un jugador pierde 15 de stat clave permanentemente. Equipo: ahora +35 ataque.' },
        kamikaze: { name: 'Kamikaze', desc: 'Solo si vas perdiendo: +40 ataque, -40 defensa. Portero expuesto. A esperar y rezar.' },
        clockwatch: { name: 'Esperar el Reloj', desc: 'Solo si vas ganando: +25 defensa, +18 temple. Dejar que el tiempo trabaje por ti.' },
        poker: { name: 'Cara de Póker', desc: 'Solo con empate: +15 a cada una de las stats. Clutch puro — todo en juego.' },
        lone_wolf: { name: 'Lobo Solitario', desc: 'Delantero: +40 ataque, +20 ritmo personal. Resto: -6 ataque. Un tiro, un gol.' },
        fortress: { name: 'Fortaleza', desc: 'TW/VT: +40 defensa. Equipo -20 ataque. Convertir la portería en un búnker.' },
        gamble: { name: 'Apuesta', desc: 'Cara o cruz: +35 ataque si cara, -15 a todas las stats si cruz. Caos puro.' },
        masterclass: { name: 'Clase Magistral', desc: 'PM: +30 visión, +20 temple personal. Equipo +12 ataque. Dejar dirigir al maestro.' },
        rope_a_dope: { name: 'Cuerda Rota', desc: 'Solo R6: +35 defensa. Cada ataque rival dispara un auto-contra. Atraer, luego golpear.' },
        set_piece: { name: 'Maestro de Jugadas', desc: 'R6: +25 ataque, pero SOLO en ataques tras salida exitosa. Agudeza quirúrgica.' },
        siege_mode: { name: 'Modo Asedio', desc: 'R6: +20 ataque, +10 ritmo, +10 visión. Presión limpia sin penalización.' },
        bus_and_bike: { name: 'Autobús y Bicicleta', desc: 'R6: +18 defensa. Cada parada/stop carga +30 ataque en tu próximo balón.' },
        face_pressure: { name: 'Afrontar la Presión', desc: 'R6: +25 temple, tiros rivales -8% precisión. Nervios clutch bajo los focos.' }
      }
    },
    teamNamePools: {
      konter: {
        first: ['Jairo','Iker','Asier','Kai','Zeta','Rex','Vico','Nico','Roco','Brío','Llama','Corvo','Dani','Eco','Ravi','Pizarra','Voltio','Zane','Kito','Milo'],
        last: ['Rápido','Cruce','Finta','Cielo','Reeve','Llama','Quino','Golpe','Caída','Racha','Borde','Veloz','Hale','Rastro','Vórtice','Destello','Cifra']
      },
      pressing: {
        first: ['Bruno','Vargo','Krago','Brais','Toro','Rael','Brunox','Bjorn','Krogh','Ulises','Magnus','Ragnar','Broko','Vídar','Harald','Ívor','Oriol','Knut'],
        last: ['Maza','Choque','Lobo','Sangre','Acero','Colmillo','Garra','Ruina','Martillo','Hierro','Piedra','Mutilador','Tusk','Gruñido','Forja','Hierrofrío','Grimwald']
      },
      technik: {
        first: ['Luca','Nico','Rafa','Mateo','Dante','Enzo','Alessio','Marco','Gianni','Xavi','Theo','Renzo','Leandro','Diego','Seba','Liam','Silas'],
        last: ['Bellucci','Corelli','Ferrando','Moretti','Salvatore','Laurent','Rossi','Valenti','Monti','Rinaldi','Serra','Piazza','Viale','Lioncourt','Delacroix']
      },
      kraft: {
        first: ['Bruno','Héctor','Reinhold','Klaus','Kurt','Manuel','Detlef','Sigfrido','Hartmut','Werner','Friedhelm','Heinrich','Günter','Egon','Rolf','Ulrich'],
        last: ['Truenomonte','Puñohierro','Piedrabrück','Martilloacero','Bosquetormenta','Cuervocresta','Lobomonte','Ackermann','Rothmann','Herrero','Gruber','Baluarte','Rocadura']
      }
    },
    legendaryNames: ['Nicolás Vega','Rasmus Orth','Idris Tormenta','Jago Arena','Milo Rivera','Octavio Kross','Darian Lux','Suren Vex','León Trax','Rune Kainz','Ashe Quandt','Zephyr Böhm','Malik Kroos','Nils Falk','Soberano Reinhardt','Maksim Thoma'],
    oppTraits: {
      sturm: { name: 'Vendaval', desc: '+8% de precisión de tiro.' },
      riegel: { name: 'Cerrojo', desc: '+5% para impedir paradas en cada ronda.' },
      konter_opp: { name: 'Contra Letal', desc: 'Si fallas la salida: 30% de opción de tiro inmediato.' },
      presser_opp: { name: 'Máquina de Presión', desc: 'Tus salidas fallan un 10% más.' },
      clutch_opp: { name: 'Sangre Fría', desc: 'Últimas 2 rondas: +10 ataque, +5 ritmo.' },
      lucky: { name: 'Afortunados', desc: 'Una vez por partido: ataque extra aleatorio.' },
      ironwall: { name: 'Muro de Hierro', desc: 'Primeras 2 rondas: +10 defensa.' },
      sniper: { name: 'Francotirador', desc: '+15% de precisión, pero -5 ritmo.' },
      boss_aura: { name: 'Presencia Dominante', desc: 'Aura exclusiva de jefes: todos los jugadores rivales reciben un bonus permanente de estadísticas en cada ronda.' }
    },
    legendaryTraits: {
      god_mode: { name: 'Modo Dios', desc: 'Una vez por partido: el siguiente gol vale triple.' },
      clutch_dna: { name: 'ADN Decisivo', desc: 'En la última ronda: +20 ataque, +10 temple.' },
      field_general: { name: 'General del Campo', desc: 'Todo el equipo: +4 a todas las estadísticas.' },
      unbreakable: { name: 'Irrompible', desc: 'Primer gol recibido en cada partido: anulado.' },
      big_game: { name: 'Jugador de Grandes Citas', desc: 'Contra jefes: +15 a la estadística clave.' },
      conductor: { name: 'Director', desc: 'Por cada salida exitosa: +8% al siguiente gol.' },
      phoenix: { name: 'Fénix', desc: 'Si pierde por 2 o más: +12 ataque durante el resto del partido.' },
      ice_in_veins: { name: 'Hielo en las Venas', desc: 'Ignora por completo las mejoras de temple del rival.' }
    }
  }
});