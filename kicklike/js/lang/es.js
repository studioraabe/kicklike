I18N.registerLocale('es', {
  ui: {
    meta: { title: 'KICKLIKE · Roguelite de Fútbol 5' },
    start: {
      tagline: '> roguelite de fútbol 5_',
      sub: 'deckbuilder · evolución del equipo · temporadas',
      newRun: '▶ Nueva Partida',
      continueRun: '▶ Continuar Partida',
      newRunConfirm: 'Empezar una nueva partida borrará tu progreso guardado. ¿Continuar?',
      leagueMatch: 'Partido {n}',
      cupMatch: 'Copa P{n}',
      openCodex: '📖 Códice',
      openManual: '→ Manual completo',
      changelog: 'Cambios',
      howTitle: 'Cómo funciona:',
      howBody: 'Elige un equipo inicial. Cada temporada son 14 partidos de liga (8 equipos, ida y vuelta). Top 2 ascienden, bottom 2 descienden — Amateur → Pro → COPA. Cada partido: 6 rondas. Tú robas cartas, el rival roba sus propias jugadas — oleadas ofensivas, bloques férreos, faltas tácticas, jugadas estrella — y el banner OPP THREAT te dice lo que viene. Ganar la copa = CAMPEÓN DE RUN.'
    },
    changelog: {
      title: 'KICKLIKE · Cambios',
      versions: [
        {
          version: '0.60.2',
          title: 'Panel de Situaciones Probables — corregidos dos frames que disparaban en casi todos los partidos',
          entries: [
            {
              title: 'GOALIE STREAK ya no dispara con porteros débiles',
              body: 'La predicción pre-partido de **GOALIE STREAK** tenía la fórmula al revés: sumaba la defensa de tu portero a la ofensiva del rival, lo que hacía que **un delantero rival fuerte empujara la probabilidad hacia arriba**. Un portero débil (def 40) contra un rival fuerte (off 70) hacía saltar el frame como "probable" — sin sentido narrativo, ese es justo el partido donde a tu portero le *pasan por encima*, no donde encadena paradas. La fórmula ahora usa la diferencia (TW def vs Opp off) — el frame solo dispara cuando tu portero tiene una ventaja real frente a la presión ofensiva esperada.'
            },
            {
              title: 'THEY ARE RATTLED ya no está hardcoded para disparar siempre',
              body: '**THEY ARE RATTLED** era un pseudo-predictor — disparaba con 0.35 de likelihood fijo (un punto, low) en cada partido en el que el rival tenía algún trait holder. Como todo equipo generado tiene trait holders, el frame disparaba **siempre**. Ahora escala con la composure del rival: menor composure rival → más probable que el frame dispare durante el partido. Los rivales con composure sólida (65+) no reciben la predicción — el análisis pre-partido no puede afirmarla con fiabilidad para plantillas mentalmente estables.'
            },
            {
              title: 'Efecto en el panel',
              body: 'En partidos equilibrados sin un edge claro, ambos frames ahora permanecen en silencio — lo que libera los huecos del top-3 para frames que sí son relevantes al partido (`LANE IS WIDE OPEN`, `STRIKER FRUSTRATED`, etc), o muestra menos filas cuando no se predice nada específico. Antes el panel mostraba los mismos dos frames en casi todos los partidos con `NO PAYOFFS` al lado; ese patrón debería ser sustancialmente menos común ahora.'
            }
          ]
        },
        {
          version: '0.60.1',
          title: 'Hotfix pre-stable — persistencia del bonus de confianza + actualizaciones de cadenas pendientes',
          entries: [
            {
              title: 'El bonus de confianza ahora sobrevive a recargar la pestaña',
              body: 'El bonus de confianza de +1 por victoria (con tope de +4 en las cinco stats) se borraba en cada ciclo de guardado/carga — al campo le faltaba estar en la lista de persistencia. Construyes una racha de 4 victorias, cierras la pestaña, vuelves a abrir y el buff había desaparecido en silencio. Ahora persiste con el resto del estado de temporada, y se resetea al final de temporada como siempre.'
            },
            {
              title: 'Dos descripciones de cartas en ES corregidas',
              body: '**Running Hot (En Racha)** y **Doping (Todo al Rojo)** seguían mostrando los números pre-v0.59 en español, aunque v0.59 afirmaba que las siete cartas habían sido reescritas en EN/DE/ES. Ambas cadenas ES ahora coinciden con lo que hace el handler — mismo fix que EN y DE ya tenían.'
            },
            {
              title: 'Rope-a-Dope: cualificador "Solo" eliminado también en DE/ES',
              body: 'v0.60.0 quitó el cualificador redundante "only" de rope_a_dope en EN ("R6:" en vez de "R6 only:"). DE y ES seguían publicando "Nur R6:" / "Solo R6:" — arreglado. Las tres locales se leen ahora de forma uniforme con el resto de las tácticas de fase final.'
            }
          ]
        },
        {
          version: '0.60.0',
          title: 'Limpieza de backlog — segunda pasada de auditoría de cartas, rangos, causas de derrota',
          entries: [
            {
              title: 'Tres cartas más mentían sobre sus números',
              body: 'Tras la auditoría v0.59, tres cartas pasaron sin arreglarse:\n\n- **Anticipar** decía "+16 DEF" — el handler entrega en realidad +22 DEF / +12 TMP / +8 CMP / +10 OFF al anular con éxito. Aproximadamente **el triple** de buff respecto a la descripción, con tres stats no documentadas. Descripción reescrita con los cuatro números más "+Flow 2 / roba 1".\n- **Contraataque** decía "+22 OFF / +8 TMP" en hit, "+8 OFF" base — el handler hace +28/+10 en hit, +10 OFF base. Off por 6/2/2. Además el trigger de auto-contra (cuando otra carta ha cargado un auto-contra para esta ronda) no se mencionaba.\n- **Pase en Profundidad** describía qué tipos de descarte disparaban qué outcomes, pero nunca mencionaba el buff de +4 OFF / +4 TMP en la rama de descarte-Setup, ni la acción de pase filtrado garantizado cuando Setup acierta.\n\nLas tres actualizadas en EN, DE, ES.'
            },
            {
              title: 'Prefijos de tácticas finales estandarizados',
              body: 'Las descripciones de tácticas en la fase final usaban tres estilos de prefijo distintos: "Última ronda: ...", "R6: ..." y "R6 solo: ...". Las siete descripciones con "Última ronda:" convertidas a "R6:" para que coincida con la convención R6/R4-6 de número de ronda usada por las otras tácticas. El cualificador "solo" eliminado de rope_a_dope (todas las tácticas de fase final son R6-only por definición). Se lee más uniforme ahora en el selector.'
            },
            {
              title: 'La pantalla de derrota muestra ahora hasta 2 causas secundarias bajo el veredicto',
              body: 'El veredicto de v0.56 diagnosticaba una derrota en una línea cursiva ("Al equipo se le acabaron las piernas — Antony Dembélé, Jadon Chiesa bajaron de 35 condición."). En derrotas donde múltiples señales disparaban — fatiga MÁS ocasiones falladas MÁS rival convirtiendo todo — solo la señal dominante llegaba a la cabecera; las demás se descartaban en silencio.\n\nAhora `computeMatchVerdict` recoge cada señal que dispara y devuelve las tres principales. La primera es la cabecera (sin cambios). Las dos siguientes se renderizan como filas más pequeñas en cursiva atenuada debajo, cada una con un prefijo de punto — así el jugador obtiene un desglose de 2-3 líneas de lo que realmente pasó, no solo la peor señal individual.\n\nLas victorias se saltan las causas secundarias — no necesitamos diseccionar una victoria así. Las victorias morales (empate o derrota ajustada contra rival mucho mejor) reciben el framing moral como cabecera más las cuestiones mecánicas reales como causas — "Aguantasteis a un rival claramente mejor — puntos al favorito." con "La construcción se atascó — solo el 42% de intentos encontró al receptor." debajo. Ambas verdaderas, ambas útiles.'
            }
          ]
        },
        {
          version: '0.59.0',
          title: 'Auditoría de descripciones de cartas: las cartas dicen la verdad',
          entries: [
            {
              title: 'Siete cartas mentían sobre sus números',
              body: 'Tras la auditoría de descripciones de tácticas en v0.57, apliqué el mismo barrido handler-vs-descripción sobre las cartas. Siete cartas hacían afirmaciones numéricamente erróneas:\n\n- **A Sangre Fría** decía "+55 OFF" — el handler entrega en realidad +30 OFF / +8 CMP más un pase filtrado garantizado de direct-action. Los +55 nunca eran alcanzables; el pase filtrado faltaba en la descripción.\n- **Golpe de Gracia** decía "+45 OFF / +8 CMP" — la fórmula real es `min(35, 22 + lead*3)`, con tope en +35. Los +45 nunca eran alcanzables; el comentario obsoleto en el handler también afirmaba +40/+50/+60.\n- **En Racha** decía "+5 OFF por victoria de racha (máx +25)" — la fórmula real es `streak * 3` (máx +15). 40% de error.\n- **Disparo a la Esperanza** decía "+6 OFF solo con Flow = 0" — el handler no hace NINGÚN buff de stat. La carta es una probabilidad del 20% de gol a la desesperada y nada más.\n- **Todo al Rojo (doping)** decía "condición +40, +14 OFF / +8 TMP, 25% amarilla" — en realidad: condición +30, +10 OFF / +6 TMP base (+4 OFF con táctica agresiva/tempo), 15-30% de riesgo de backfire modulado por momentum, con backfire forzado a la 3ª jugada del partido.\n- **Segundo Tiempo** decía "+8 CMP / +4 TMP" — en realidad +6 CMP / +3 TMP. 25% de error.\n- **Cebo al Contragolpe** decía "Próximo ataque rival: −18 OFF" — no hay debuff rival en el handler. En realidad: +8 DEF / +4 TMP esta ronda, más un resultado de +Flow 2 si el rival no marca la próxima ronda.\n\nLas siete descripciones reescritas en EN, DE, ES para que coincidan con lo que hacen los handlers. El comentario obsoleto en el handler de killing_blow también corregido a la fórmula real.'
            },
            {
              title: 'Seis cartas más documentan mecánicas ocultas',
              body: 'Durante la auditoría aparecieron seis cartas con mecánicas que el jugador no podía conocer solo por la descripción:\n\n- **Bloque Cerrado**, **Aguantar la Línea**, **Portero Adelantado** todas escalan 1.3× cuando el rival tiene una amenaza telegrafiada cargada — recompensa leer el banner de amenaza antes de jugar la carta defensiva. La descripción ahora menciona el escalado.\n- **Gegenpress** escala 1.5× cuando el momentum del partido va contra ti — amplificador de remontada. Descripción actualizada.\n- **Desmarque** otorga silenciosamente +6 TMP además del buff de OFF. Ahora en la descripción.\n- **Momento Heroico** otorga silenciosamente +6 CMP además del buff de OFF. Ahora en la descripción.\n- **Arrancada** cuesta silenciosamente −4 CMP y obtiene +6 OFF con tácticas agresivas/tempo. Ambos documentados ahora.\n\nEl escalado en las tres cartas defensivas reactivas a telegraph era una mecánica de profundidad oculta deliberada — el jugador que lee la amenaza recibe la recompensa — pero la descripción nunca lo insinuaba. Ahora se menciona brevemente sin detallar el comportamiento exacto del multiplicador, así que queda espacio de descubrimiento pero el jugador sabe que la mecánica existe.'
            }
          ]
        },
        {
          version: '0.58.0',
          title: 'Rediseño del modal de táctica: hechos arriba, intel como una lista',
          entries: [
            {
              title: 'Reorden: cabecera → stats → intel → opciones',
              body: 'El modal de táctica de saque/descanso/final tenía el layout al revés. El panel de referencia de stats del equipo (PHASE BUILD · OFF 51-77 · DEF 48-91 · ...) vivía en la parte INFERIOR del modal, tras las tarjetas de opción. El jugador veía primero las opciones, las escaneaba, y solo llegaba a los datos de referencia factuales cuando ya estaba mentalmente comprometido con una opción. El flujo natural de decisión es al revés — primero hechos, luego interpretación, luego acción.\n\nEl panel de stats se renderiza ahora directamente bajo el subtítulo, antes de cualquier intel-hint, antes de la lista de opciones. Los intel-hints (que interpretan esas stats) siguen. Las tarjetas de opción van al final — reciben el máximo peso visual cuando el jugador ya tiene el contexto para evaluarlas.\n\nNuevo orden: cabecera → stats → intel → opciones.'
            },
            {
              title: 'Tres banners en competencia consolidados en una caja INTEL',
              body: 'Los intel-hints entre el subtítulo y las opciones se renderizaban como tres elementos visualmente distintos: una línea cursiva en gris ("Build-up corre a través de PM visión/temple: 85 VIS / 67 CMP"), luego un banner verde-sobre-verde ("Nicolás tiene la ventaja de ritmo"), luego un banner rojo-sobre-rojo ("Línea defensiva bajo presión"). Tres tratamientos visuales diferentes, tres severities en competencia, todos ruidosos. La línea cursiva no tenía marcador de severity; los banners tenían fondos coloreados Y texto coloreado — doble-señal de la misma severity vía borde y color de texto.\n\nNuevo diseño: un contenedor, tres filas, todas con la misma forma — una franja izquierda de 3px coloreada y texto gris. La severity va solo en la franja (gris atenuado para neutral, verde para oportunidad, rojo para amenaza). Sin fondos coloreados, sin texto coloreado en línea. El contenedor tiene bordes punteados sutiles arriba/abajo para marcarlo como grupo.\n\nSe lee como una lista ahora, no como tres cajas peleando por atención.'
            }
          ]
        },
        {
          version: '0.57.0',
          title: 'Auditoría de descripciones: las tácticas dicen la verdad',
          entries: [
            {
              title: 'Doblar la Apuesta dejó de amplificar debuffs',
              body: 'La táctica debía premiar el impulso — pícala cuando tienes un bonus activo y Doblar la Apuesta lo amplifica un 40%. El handler usaba `Math.abs()` para encontrar el mayor buff, lo que significaba que un *debuff* de ritmo de −7 (p.ej. de un rasgo rival Slow Tempo) calificaba como "el mayor" y se amplificaba a −10. Jugadores que picaban Doblar la Apuesta esperando un buff veían la previa decir "−3 TMP" y razonablemente decían "¿qué?". Arreglado: solo cuentan los buffs positivos. Si no hay nada positivo ≥ 5, vuelve a un modesto +6 OFF / +6 DEF / +6 CMP todoterreno. Descripción ajustada a la lógica.'
            },
            {
              title: 'Las descripciones de tácticas dejaron de decir "permanente"',
              body: 'v0.52 introdujo restauración post-partido de stats para arreglar un bug de snowball donde Fortress, Lone Wolf, Masterclass y compañía filtraban sus boosts al run permanentemente. El fix funcionó — pero seis descripciones de tácticas seguían diciendo que el boost era "permanente" o que el jugador "gana permanentemente" un stat. Mentían desde v0.52.\n\nTácticas actualizadas — Reubicar, Sacudida, Sacrificio, Héroe del Día — ahora se leen como boosts durante el partido (lo que es la verdad). La descripción de Cambio de Rol ganó la nota personal-stat que faltaba (LF +8 OFF, ST +8 TMP). Juegos Mentales ganó la duración "durante 2 rondas" que faltaba en el debuff de temple rival.'
            },
            {
              title: 'Tooltips del log reescritos — leen la línea, no la definen',
              body: 'Los tooltips al pasar el ratón sobre las líneas del log antes definían la *categoría* ("Activación de rasgo — el efecto del jugador se aplica esta ronda") pero no ayudaban al jugador a leer la línea concreta delante de él. Ahora se han reescrito como guías de lectura: cada uno dice qué buscar, dónde están los valores y qué significan los paréntesis.\n\nEjemplos:\n\n- **Rasgo dispara** → "Se lee como: jugador · rasgo · efecto. Los valores de buff van entre paréntesis."\n- **Carta resuelta** → "Lee los chips de stat uno a uno. El chip de fase indica encaje — verde para boost, dorado para neutral, rojo para misfit (efecto a la mitad)."\n- **Coste de fatiga** → "Recuerda los umbrales: <50 → −3 todas las stats, <25 → −6."\n\n17 claves de tooltip, en los tres idiomas.'
            }
          ]
        },
        {
          version: '0.56.0',
          title: 'Pase de calidad de vida: menos clutter, derrotas más claras, runs más rápidos',
          entries: [
            {
              title: 'Banner OPP THREAT en una sola línea',
              body: 'El banner OPP THREAT encima del log se rompía rutinariamente a dos líneas. La frase-verbo ("carga", "prepara") y la descripción del trait ("el delantero rival fuerza una entrada, +25 ataque") iban en línea junto al pin, etiqueta, dots de severidad y nombre del trait. Ahora el banner se queda en una fila apretada — pin, etiqueta, dots, nombre del trait, etiqueta opcional TELEGRAPHED — y la frase-verbo más la descripción completa viven en el tooltip al pasar el ratón, donde tienen espacio. El banner se lee de un vistazo otra vez.\n\nEl ⚠ parpadeante en la esquina de los banners telegrafiados se ha ido. La animación duplicaba la misma información (cambio de color por severidad + chip + marca telegraph + parpadeo), y el movimiento competía con el contenido del log al lado. La marca queda como un glyph estático y atenuado; el chip TELEGRAPHED en línea ya etiqueta la info accionable.'
            },
            {
              title: 'El resultado del partido ahora abre con un veredicto de una línea',
              body: 'Perder costaba leer. El marcador y la etiqueta de resultado decían qué pasó, el log contaba la jugada-a-jugada, pero el *por qué* quedaba entre medias. Nuevo: el héroe de la pantalla de resultado ahora encabeza con una sola línea en cursiva que lee la telemetría y apunta a la causa dominante.\n\nUna escalera de prioridad elige la señal más explicativa:\n\n- Aguantasteis a un rival claramente mejor → "Aguantasteis a un rival claramente mejor — puntos al favorito."\n- Múltiples titulares por debajo de 35 condición → "Al equipo se le acabaron las piernas — Antony Dembélé, Jadon Chiesa bajaron de 35 condición."\n- La construcción encontró al receptor menos del 50% → "La construcción se atascó — solo el 42% de intentos encontró al receptor."\n- Ocasiones generadas, no rematadas → "9 disparos, un gol — las ocasiones llegaron, la finalización no."\n- El rival convirtió quirúrgicamente → "Sus 3 ocasiones acabaron en 3 goles — quirúrgico."\n- Fallbacks genéricos por tipo de resultado para el resto.\n\nFalsos positivos filtrados: una victoria nunca recibe veredicto de fatiga (ganaste, da igual), el veredicto moral de underdog solo dispara en derrotas ajustadas (no se activa en una paliza 4:1 en la que casualmente eras leve favorito). Los colores del veredicto encajan con el tono del resultado (verde en victorias, cálido apagado en derrotas, dorado en empates).'
            },
            {
              title: 'Panel "Situaciones probables" oculto hasta el partido 3',
              body: 'El panel "Situaciones probables" — nombre de frame + dots de probabilidad + conteo contra/remate — es uno de los elementos más densos en la pantalla pre-partido. Los nuevos jugadores mirando "GOALIE STREAK · ▰▰▰ · 2 REMATES" mientras todavía descifraban su mano no tenían ninguna oportunidad de decodificarlo. El panel ahora espera al partido 3 para aparecer, espejando el v0.51-trait-severity-gating de los rivales. Al llegar al partido 3 ha corrido el segundo tutorial (v0.55), el jugador ha jugado un partido completo, y el panel llega explicado. Los frames siguen ocurriendo en partidos 1 y 2 — solo la previa pre-partido espera.'
            },
            {
              title: 'Botón Sim Rápida para partidos de trámite',
              body: 'A media run el jugador a menudo se enfrenta a un partido que tiene clara la victoria — un equipo de mitad de tabla amateur con racha ganadora, +30% ventaja de poder. La fase de cartas sigue durando 4-5 minutos, así que una temporada de 7 partidos en Pro-Liga empieza a sentirse a relleno.\n\nNuevo: un botón ⏩ Sim Rápida aparece en el hub cuando *todas* estas condiciones se cumplen — 25%+ ventaja de poder, sin boss, sin partido de copa, en racha de victorias (≥1), partido 3 o posterior. Un clic juega el partido en pocos segundos sin fase de cartas, las tácticas se auto-eligen del slot recomendado, animación acelerada. La fatiga sigue ticando, las jugadas rivales siguen disparando, el motor sin cambios — solo se colapsa la entrada del jugador.\n\nConservador a propósito: cada guardia debe cumplirse, botón oculto si no. Partidos de copa, partidos boss y cualquier partido donde el jugador esté incluso ligeramente en desventaja pasan por el flujo completo — los momentos donde las decisiones importan. La bandera se resetea tras cada partido, así que optar por ello es por partido — nunca un ajuste que se cuele a partidos importantes.'
            }
          ]
        },
        {
          version: '0.55.0',
          title: 'Segunda etapa de onboarding',
          entries: [
            {
              title: 'Nuevo: overlay "un par de cosas más" tras el partido 2',
              body: 'Los nuevos jugadores recibían un overlay de 5 pasos en la primera fase de cartas — Mano / Energía / Flow / Situaciones / Terminar Turno. Suficiente para el partido 1, pero dejaba mucha UI sin descifrar: las palabras de fase en la cabecera de ronda, los chips ★ en las cartas, el panel de Situaciones probables que ya es visible desde el hub.\n\nAhora aparece un segundo overlay una sola vez al iniciar la fase de cartas del partido 3. Solo tres puntos, sin jerga: cómo leer FASE en la cabecera (ATTACK potencia combos, DEFENSIVE potencia defensa), qué significa el chip ★ en una carta (impacto de gol esperado este turno, oculto en soft-disconnect), y la diferencia Contra vs Remate en el panel de Situaciones. Se cierra con botón o clic en el fondo; se guarda en localStorage para que los saves existentes lo vean una sola vez.'
            }
          ]
        },
        {
          version: '0.54.0',
          title: 'Tooltip del pulse-tile localizado',
          entries: [
            {
              title: 'El pulse-tile mostraba texto en alemán en EN/ES',
              body: 'El tooltip del pulse-tile en partido enumeraba la fuente de cada cambio de stat (penalización por condición, forma del jugador, forma de equipo, buffs de cartas/táctica). Cuatro de esas etiquetas estaban hardcodeadas en alemán — "Kondition 42 → −3 alle Stats", "Form +1 → +2 OFF", "Team-Form → +3 alle Stats", "Karten/Taktik → +6 DEF, +2 OFF". Funcionaban en DE pero se filtraban sin cambios a EN y ES.\n\nNuevas claves i18n `ui.match.pulseTipCondition` / `pulseTipForm` / `pulseTipTeamForm` / `pulseTipCardsTactic` llevan las plantillas. Cada idioma tiene su propia versión con la terminología correcta (`Condition` / `Kondition` / `Condición`; `Cards/Tactic` / `Karten/Taktik` / `Cartas/Táctica`). La misma línea al pasar el ratón que indica *por qué* cayó un stat se lee ahora correctamente en el idioma activo.'
            },
            {
              title: 'Confirmado: la condición baja stats en umbrales 50/25',
              body: 'Recordatorio para los curiosos: la `condición` del jugador reduce directamente sus cinco stats al cruzar dos umbrales. Por debajo de 50, todos los stats reciben −3. Por debajo de 25, todos reciben −6. El golpe se aplica cada ronda del partido, no solo al saque inicial. El desglose del pulse-tile muestra esta línea exacta para que se pueda leer la causa cuando un titular parece más débil que los stats de su carta.\n\nLa mecánica de recuperación entre partidos (≥60 → restaurado a 90, 40-59 → 80, 20-39 → 70, por debajo de 20 → 55) existe justo para evitar que un titular se quede en bandas −3/−6 entre partidos. Rotar a un titular sobreusado normalmente lo arregla. No hay cambio de mecánica — solo aclaración de un sistema ya existente.'
            }
          ]
        },
        {
          version: '0.53.0',
          title: 'Descripciones de cartas y semántica de remates',
          entries: [
            {
              title: 'Las cartas ya no muestran {st} literal',
              body: 'Lone Striker, Team Unity, Masterclass, Clinical Finish, Stone Cold y unas 20 cartas más describían sus efectos con tokens de rol como "{st} condición ≥ 70" o "+15 a {pm}". La narración de flavor tras jugar una carta ("{st} se va solo — y marca") tenía un interpolador funcional desde v0.39, pero la **descripción** estática iba por otro camino de render que llamaba al lookup i18n sin variables — los placeholders entre llaves se quedaban tal cual donde aparecían.\n\nLas capturas que lo destaparon: la carta Lone Striker en draft con **"Si {st} condición ≥ 70: +22 OFF"** en lugar del nombre del jugador.\n\nNuevo helper `UI.resolveCardDescription(cardId, match)` espeja el interpolador de flavor existente. Seis sitios lo usan ahora: cuerpo de la carta en mano, tooltip cuando no se puede jugar, tooltip del panel de mazo, lista de cartas en codex, chips de cartas-arquetipo en selección de equipo, y la propia carta del draft. En partido ves nombres reales ("Si Antony Dembélé condición ≥ 70…"); en codex/draft, sin contexto de plantilla, aparecen abreviaturas de rol ("Si ST condición ≥ 70…"). En cualquier caso, ningún `{st}` crudo más.'
            },
            {
              title: '"Situaciones probables" ya no llama "contra" a todo',
              body: 'El panel de pre-partido listaba hasta tres frames próximos con etiqueta a la derecha tipo **1 CONTRAS** o **SIN CONTRAS**. Se trackean ocho frames y cinco de ellos — `RACHA DEL PORTERO`, `ESTÁN INQUIETOS`, `PASILLO CALIENTE`, `ESTRELLA RIVAL CAÍDA`, `PORTERO RIVAL INSEGURO`, `DEFENSA RIVAL ESTIRADA` — son favorables al jugador. Llamar "contras" a las cartas que **explotan** una ventaja es la palabra equivocada: las contras combaten amenazas, los remates cobran ventajas.\n\nLa etiqueta ahora cambia según el mismo mapa de severidad que pinta el color de la fila:\n\n- **warn / danger** → "1 contra" / "sin contras"\n- **good / opportunity** → "1 remate" / "sin remates"\n\nLos tooltips de fila y chip se ajustan también. "Contras en tu mazo:" pasa a "Remates en tu mazo:" para frames favorables; el tooltip de cero-conteo dice "ningún carta que explote esta situación" en vez de "ningún carta que aborde específicamente esta situación". El código de color (`aip-tone-*` / `aip-sev-*`) ya era correcto desde v0.45/v0.52 — esto arregla la palabra que lo contradecía.'
            }
          ]
        },
        {
          version: '0.52.0',
          title: 'Cura del snowball: los stats de tácticas ya no se filtran',
          entries: [
            {
              title: 'Diez tácticas mutaban stats de jugadores de forma permanente',
              body: 'Fortress, Lone Wolf, Masterclass, Hero Ball, Wing Overload, Wingman, Role Switch, Shift, Sacrifice, Shake-Up — diez tácticas de kickoff/halftime/final mutaban `player.stats.X` directamente en lugar de empujar capas de buff con decay. Los handlers decían "persiste pasada la ronda 6" y se referían a *dentro del partido*, pero sin restauración post-partido los boosts (y los dos handlers de debuff) se filtraban a la ejecución del run permanentemente.\n\nUn dump de telemetría de un run de Pro-Liga de 14 partidos mostró el caso canónico: **un Fortress en match 5 subió la defensa del portero de 72 a 99 y la dejó clavada ahí los siguientes nueve partidos**. La progresión de marcadores confirmó la consecuencia: M1–M10 con media 4.3:1.0, M11–M14 con media 10.5:0.3. El snowball tardío inatribuible era la fuga.\n\nFix: snapshot de los stats de cada titular antes del partido, restauración al terminar. Las tácticas siguen pegando fuerte dentro del partido (su ventana de efecto pretendida) pero el daño a nivel de run desaparece. La telemetría de un run v0.52 confirma crecimiento orgánico únicamente: el mismo portero subió de 77 → 96 a lo largo de 12 partidos vía niveles y evoluciones, sin spike de Fortress.'
            },
            {
              title: 'El selector de tácticas ya muestra dónde aterriza el boost personal',
              body: 'La preview del selector kickoff/halftime/final solo leía `match.teamBuffs`. Cuando Fortress metía +40 defensa **directamente sobre** el portero y central, la preview decía `[OFF +4  DEF -25  COM -6]` — los +40 no aparecían en ningún sitio, y peor: si el jugador ya estaba al 99 de cap, el boost entero desaparecía en silencio.\n\nNueva línea en la preview saca a la luz las mutaciones personales: `→ Fortress  [OFF +4  DEF -25  COM -6]  (TW DEF +27, VT DEF +13)`. Los deltas reflejan lo que realmente aterrizó — incluyendo pérdidas por cap a 99 (un +40 capado a +13 sale como +13, señalando el cap discretamente). Cuando todas las mutaciones aterrizan en stats al cap y los deltas son cero, no se imprime el paréntesis — misma forma que las tácticas sin efecto personal.'
            },
            {
              title: 'La telemetría por fin pobla los campos de tiros/buildup/paradas',
              body: 'El payload post-partido leía de campos que no existían (`match._shotsMe`, `_savesMe`, `_buildupAttempts`). El motor escribe a otra ruta (`match.stats.myShots`, `match.stats.saves`, `match.stats.myBuildups`). Resultado: cada export de telemetría tenía cada conteo de tiro, buildup, parada y trait-fire emitido como 0 o null en todo el run, escondiendo la señal más útil de auditoría de balance.\n\nArreglado en la fuente. El payload incluye ahora también shotsOnTarget, intentos/éxitos de buildup rival, y un valor de posesión-media. Los totales de trait-fire se separan en `{me, opp, oppByTrait}` en lugar de un único hash que nunca se poblaba.'
            },
            {
              title: 'Los puntos de probabilidad del panel de situaciones siguen al título',
              body: 'Títulos de frame como `RACHA DEL PORTERO` se renderizaban en verde (situación favorable) pero los puntos de likelihood al lado en rojo-naranja (alta probabilidad). Misma fila, señales contradictorias. La severidad gana ahora: puntos verdes en frames favorables, rojos en amenazas. El conteo de puntos (▰▱▱ / ▰▰▱ / ▰▰▰) sigue codificando probabilidad por separado.'
            }
          ]
        },
        {
          version: '0.51.0',
          title: 'Onboarding amateur: balance del arranque',
          entries: [
            {
              title: 'Tier de poder rival capado en el partido 1',
              body: 'Reportes de jugadores mostraban rivales amateur en el primer partido con líneas de stats tipo 65/104/140/67/81 contra plantillas iniciales de 52/72/61/63/68 — un gap de tempo lo bastante grande para que el partido inaugural se sintiera como pegarse contra un muro. Causa: el calendario round-robin sacaba rivales de una curva de poder que distribuía la fuerza por toda la temporada (partidos 2 al 9), de modo que el peor caso del partido 1 podía ser un rival de tier 9.\n\nLa curva de poder ahora capa en tier 6 para una liga de 8 equipos. El peor caso del partido 1 cayó de 502 a 394 de poder (gap reducido de +44% a +19%). Efecto colateral: un check de boss-bonus obsoleto que aplicaba +90 stat a cualquier rival sembrado en tier 7 quedó inerte (ningún rival alcanza ese tier en el calendario regular).'
            },
            {
              title: 'Traits severos limitados a media temporada',
              body: 'La complejidad de traits estaba ligada al tier de poder del rival, no a la posición del jugador en el run. Así un rival de tier 6 en match 2 podía aparecer con traits de severidad 3 (Counter Specialist, Clutch Finisher) — mecánicas devastadoras contra las que el jugador todavía no tiene cartas de contra.\n\nLa severidad de trait ahora se clamps por número de partido. Match 1: ningún trait. Matches 2–5: máximo un trait, severidad 1–2. Matches 6–12: hasta dos traits, severidad 3 desbloqueada. Match 13+: complejidad completa. Los partidos boss conservan su aura — son los picos de dificultad explícitos.'
            }
          ]
        },
        {
          version: '0.50.0',
          title: 'Soft-counter: la defensa cuenta por fin',
          entries: [
            {
              title: 'Cartas de defensa tracked como soft counters',
              body: 'La telemetría 0/36 de defused era engañosa — las cartas de defensa funcionaban cada vez con buffs de stats (+6 DEF etc.), pero nunca contaban como "contra". Solo los triggers explícitos de shield (cuando un trait rival era cancelado) contaban.\n\nNuevo: si juegas una carta de defensa o contra en una ronda Y `teamBuffs.defense ≥ 8` está activo, la jugada rival se registra como "soft-defused". También recibes una nueva línea en el log:\n\n> ✓ Búfer de defensa absorbe Park the Bus — amortigua el efecto.\n\nLa condición dual (carta jugada Y buff suficientemente alto) impide que cartas de defensa sin buff real (cartas puramente directAction) cuenten erróneamente como contras. La línea del log corre con la clase `player-shield` — así queda tracked automáticamente como `defused: true` en telemetría.'
            },
            {
              title: 'Auditoría del sistema de contra: imagen completa',
              body: 'Check sistemático de todas las cartas con patrones "espera-evento-rival":\n\n- 2 cartas con `opp-trait-cancel`: ball_recovery, high_press_trap\n- 1 carta con `opp-trait-dampen`: wing_trap\n- 1 carta con `absorb-next-shot`: clutch_defense\n- 1 carta con `yellow-absorb`: desperate_foul\n- 1 carta con `bait-counter`: bait_counter\n- 3 cartas con `intent-absorb`: block, preempt, pressure_trap\n- **20 cartas con `flow-requirement`**: juegan efecto base con flow<2, efecto premium con flow≥2\n- 10 cartas con `lane-open`: setup para cartas siguientes\n\nEs un tema más grande de lo esperado — especialmente las 20 cartas de flow tienen el mismo problema de tracking (el trigger premium suele ser invisible). Eso para un release aparte — aquí solo soft-counter para cartas de defensa/contra.'
            }
          ]
        },
        {
          version: '0.49.0',
          title: 'Fix de escala de stats, alivio en partidos iniciales',
          entries: [
            {
              title: 'Display de stats alineado al motor — fix de escala real',
              body: 'La captura mostraba "OFF 46 vs 123" contra un rival amateur — parecía una brecha enorme, pero era una comparación manzanas-naranjas:\n\n**Nuestro valor** venía de `aggregateTeamStats()` = **promedio** de los 5 jugadores (avg OFF ~46). **Valor rival** venía de `opp.stats.offense` = **agregado del equipo** desde la división de poder del motor (~120). Ambos lados puestos uno al lado del otro en escalas distintas.\n\nEl motor en sí calcula **ponderado por rol**:\n\n- Ofensiva: DL×0.50 + EX×0.28 + PM×0.22 (centrado en DL)\n- Defensa: DF×0.45 + POR×0.55 (solo roles defensivos)\n- Ritmo: EX×0.50 + DL×0.30 + PM×0.20\n- Visión: PM×0.42 + DL×0.18 + EX×0.18 + DF×0.12 + POR×0.10\n- Temple: promedio de los 5\n\nNuevo helper `teamStatsEngineAligned()` reproduce estos pesos exactamente. Scorecard (previa de partido en el hub), footer del partido y probabilidad de victoria ahora lo usan — sin brecha distorsionada. La previa por fin muestra lo que el motor realmente calcula.'
            },
            {
              title: 'Jugadas rivales: tope de severity en partidos iniciales',
              body: 'Telemetría + feedback del usuario: "las amenazas rivales vienen demasiado pronto en los primeros partidos, no hay chance de bloquear nada". El viejo filtro `stageMin` ya permitía 4 jugadas de severity 2 en M1 (Quick Strike, Pressing Surge, Rage Offensive, Park the Bus) — demasiado duro cuando el jugador no tiene repertorio de contra.\n\nNuevo tope de severity por número de partido:\n\n- **M1-2**: solo severity 1 (Overload Flank, Long Ball, Counter Blitz, Bunker, Training Focus, Captain Speech — jugadas "suaves")\n- **M3-5**: hasta severity 2 (Quick Strike & Co. de vuelta)\n- **M6+**: todas las severities (hasta 3, una vez alcanzado stageMin)\n\nPartidos de copa y bosses no evitan el tope — pero esos no aparecen antes de M5+. Resultado: el onboarding respira, los partidos tardíos siguen afilados.'
            },
            {
              title: 'Auditoría del sistema de contra: aclaración, no rediseño',
              body: 'Pregunta del usuario: "si las cartas de contra eran inefectivas, ¿esto aplica también a otras relaciones?". Auditoría de las 10 cartas de contra:\n\n- 3 cartas (gegenpress, block, preempt) — **incondicionales**: siempre se activan con buff de stat\n- 3 cartas (ball_recovery, wing_trap, high_press_trap) — **pendientes**: ponen una flag que solo se dispara si el rival juega un trait de bono-disparo esta ronda\n- 4 cartas (desperate_foul, bait_counter, pressure_trap, counterpunch) — **situacionales**: esperan eventos específicos (tarjeta amarilla, intent-absorb, counter-blitz)\n\nEl 0/36 de defused vino de las cartas pendientes y situacionales — cuando el evento no ocurre, nada cuenta como "defused". **Pero**: el efecto de stat-buff seguía corriendo. `ball_recovery` seguía dando +6 DEF / +4 TMP esta ronda incluso si el trait rival no se disparaba.\n\nSin rediseño ahora — eso sería trabajo de balance-de-diseño a gran escala. Pero el tracking es claramente engañoso. Fase 2 sería: contar cartas de defensa como soft counters en el tracking para que la señal "defused" no quede subrepresentada.'
            }
          ]
        },
        {
          version: '0.48.0',
          title: 'Balance, sin barra, tooltips en el log',
          entries: [
            {
              title: 'Balance: rampa rival abajo, bonus de confianza por victoria',
              body: 'La telemetría 0.44.0 mostró goleadas en los partidos 9/10 (0:5, 0:2) con defensa rival 152/154. Dos ajustes juntos (Balance Opción C):\n\n**Rampa del rival suavizada**: el multiplicador estacional de stats del rival baja de +22% a +18% en el último partido. +0% en M1, +8% al final de la primera vuelta, +18% al último. Sin quiebres de curva — solo picos de final de temporada algo más suaves.\n\n**Bonus de confianza por victoria**: tras cada victoria de liga, +1 persistente en los cinco stats del equipo, con tope de +4 durante la temporada. Empates/derrotas sin penalización. Se reinicia al cambiar de temporada. Aplicado como buffLayer de partido completo (source: `confidence`, rango 1-6) — aparece en el desglose del tooltip como parte de la línea cartas/táctica.\n\nNarrativa: el equipo juega con confianza tras victorias pero no pierde el momentum por una sola derrota. Deliberadamente sutil (+4 es ~7-8% de un stat base 55) — perceptible, no bola de nieve.'
            },
            {
              title: 'Barra de tile pulse eliminada',
              body: 'La barra Unicode (▰▰▰▰▰▰▱▱▱▱) añadida en v0.47 se retira. Sin un tope duro como en Fifa, los stats pasan de 99 con buffs de cartas y rasgos (base 88 + buff +20 = 108) — la barra de 10 segmentos desborda o miente. El formato Base→Effective con delta se queda ("OFF 55→65 (+10)") — expresivo también sin barra.'
            },
            {
              title: 'Líneas del log con tooltips',
              body: 'Al pasar el ratón por las líneas del log ahora aparece una breve explicación mecánica de la categoría. 17 categorías con tooltip: triggers de rasgos, cartas propias/rivales, escudos de contra, micro-boosts, ganancia de condición, afinidad de rol, feedback táctico, rachas, parada/adaptación rival, coste de fatiga, tarjetas (amarilla/roja), cambios de fase.\n\nEjemplos:\n\n> Activación de rasgo — el efecto del jugador se aplica esta ronda.\n> Carta rival — el efecto está activo. Cartas de contra/defensa ayudan.\n> Coste de fatiga: la condición cae — los titulares pierden stats.\n\nAtiende el feedback "¿no deberían algunos logs tener tooltips también?". Las líneas estructurales (cabeceras de ronda, saque inicial) y las auto-explicativas (goles, direct actions) se quedan sin tooltip a propósito.'
            }
          ]
        },
        {
          version: '0.47.0',
          title: 'Transparencia: stats, contras, rasgos',
          entries: [
            {
              title: 'Tooltip del pulse: valores totales + barra en vez de solo deltas',
              body: 'El tooltip al pasar el ratón sobre las tiles del player-pulse mostraba solo diferencias de stats ("DEF −4") — sin contexto de dónde cae el valor absoluto. Rediseñado por completo: **los 5 stats** con flecha Base → Effective y barra Unicode (10 segmentos, 0-99 → 0-10):\n\n> OFF 55→65 (+10) ▰▰▰▰▰▰▱▱▱▱\n> DEF 48→42 (−6)  ▰▰▰▰▱▱▱▱▱▱\n> TMP 72      ▰▰▰▰▰▰▰▱▱▱\n\nStats sin delta muestran solo el valor actual; stats con delta muestran base, efectivo y cambio. Tabular-nums mantiene las barras alineadas.'
            },
            {
              title: 'Desglose de stats: causas de los deltas',
              body: 'Bajo la lista de stats ahora hay un desglose con las **fuentes** de los cambios:\n\n> Kondition 42 → −3 alle Stats · Karten/Taktik → +6 DEF, +2 OFF\n\nResponde directamente a la confusión "la carta dice +8 DEF pero el stat está más bajo que antes". Fuentes mostradas: penalización por condición (<50 = −3, <25 = −6), forma del jugador (±2 por nivel de forma sobre el stat focus), bonus de forma de equipo, buffs activos de equipo desde cartas y tácticas.'
            },
            {
              title: 'Pistas de contra en el telegraph rival',
              body: 'La telemetría mostró: en 36 jugadas rivales durante 10 partidos, NINGUNA fue neutralizada. El sistema de contra era invisible para el jugador — no sabías qué carta ayuda contra qué jugada. Nuevo: en telegraphs con severity ≥ 2 aparece una segunda línea con la pista de contra por categoría:\n\n> ▸ Albion Windhaven carga: Bunker [●○○]\n>   ↳ Contra: carta combo con Flow ≥ 2 rompe el muro.\n\nCategorías: `aggressive` (cartas de defensa), `lockdown` (combo con Flow), `disruption` (medic/defensa), `setup` (cartas de trigger), `big` (Flow + contra/combo). Mantenido general como guía — mapeo preciso por jugada es fase 2.'
            },
            {
              title: 'Categorización de rasgos en el detalle del jugador',
              body: 'Los 45 rasgos de jugador están ahora agrupados por su timing, con cabeceras de categoría coloreadas:\n\n- **Pasivo** (cyan): permanente o probabilidad por ronda — 17 rasgos\n- **Evento** (dorado): ante un evento específico del partido (tras parada, gol encajado, etc.) — 9 rasgos\n- **Condicional** (magenta): solo bajo ciertos estados (R5-6, delta de ritmo, yendo por detrás) — 13 rasgos\n- **Único** (verde): 1x por partido o por parte — 6 rasgos\n\nEl hover sobre la cabecera de categoría explica el comportamiento de timing. Más fácil de captar cuándo se activa cada rasgo — sobre todo en legendarios con 2-3 rasgos a la vez.'
            },
            {
              title: 'Avisos del hub sobre la progresión del partido',
              body: 'Las sanciones y avisos críticos aparecen ahora **encima** de la fila de progresión de la temporada, ya no entre la previa del partido y el acordeón. Los avisos deben verse pronto en el flujo de lectura, no esconderse al hacer scroll.'
            },
            {
              title: 'Celda del partido final: sin estilo especial',
              body: 'La celda del partido final en la progresión se armonizó por última vez en v0.45 (sólido + tinte dorado amortiguado). Ahora eliminada del todo: los partidos finales se ven como las demás celdas. El reconocimiento va por el número de partido y la info del rival en el hub, no por el chrome de la celda.'
            }
          ]
        },
        {
          version: '0.46.0',
          title: 'Fix de sub-pulse, brillo de triggers y aclaración de tooltips',
          entries: [
            {
              title: 'Bugfix: match-pulse se actualiza en los cambios',
              body: 'Tras un cambio al descanso ("Zinedine Zidane on for Riyad Doku"), la tile de pulse del jugador sustituido se mantenía — nombre viejo, rol viejo. Solo las barras de stats del footer se actualizaban (fix de v0.38), no la tile en sí. Ahora el cambio llama a `UI.replacePulseTile()`, que reemplaza la tile vieja en su sitio por una fresca para el entrante, incluidos rol/nombre/barra de condición/stat-tip.'
            },
            {
              title: 'Brillo de trigger en activaciones de rasgos',
              body: 'Las líneas de trigger de rasgos en el log del partido reciben un flash dorado sutil al aparecer (1.2s con desvanecido suave) para que las activaciones no se pierdan entre otros mensajes. La animación de slide-in de las demás líneas del log queda igual de suave.'
            },
            {
              title: 'Tooltip de Falta Táctica más claro',
              body: 'El tooltip viejo ("+8 defensa, ritmo rival -12. Interrumpir, no mejorarse.") era críptico. Nuevo enfoque: quién hace qué (el DF comete la falta deliberada), a qué coste (3 de condición perdida por el DF), y por qué (rompedor de ritmo, no mejora del propio juego).'
            }
          ]
        },
        {
          version: '0.45.0',
          title: 'Drama de final de partido y correcciones de UI',
          entries: [
            {
              title: 'Feedback dramatúrgico al final del partido',
              body: 'El pitido final ya no es neutral. Antes del epílogo estándar aparece ahora una **línea narrativa adicional** cuando el partido cae en una categoría memorable: remontada, derrumbe, gol/gol encajado en el último minuto, victoria/derrota sin encajar/sin marcar, goleada, partido al filo, empate con lluvia de goles. En partidos normales solo corre el epílogo estándar como antes.\n\nEjemplos:\n\n> El equipo convierte una derrota en victoria — 3:2. Chapó.\n> Derrumbe en el tramo final — la ventaja se convierte en derrota. 3:4.\n> Portería a cero — la defensa aguantó como un muro. 3:0.\n> Perdido al filo — 2:3. Tan cerca.\n\n11 categorías × ~3 variantes × 3 locales. Requiere una nueva timeline de marcador por ronda en el estado del partido (`match.scoreTimeline`) para que la detección de remontada/derrumbe funcione.'
            },
            {
              title: 'Bugfix: los rasgos legendarios del Codex mostraban claves i18n crudas',
              body: 'En la vista de legendarios del Codex, los nombres de rasgos se mostraban como "data.traits.big_game.name" en crudo porque el lookup i18n solo buscaba en el namespace `data.traits.*`. Los rasgos legendarios específicos viven bajo `data.legendaryTraits.*`. Fix: el lookup prueba primero `data.traits.*`, luego `data.legendaryTraits.*`, y por último cae al valor en crudo.'
            },
            {
              title: 'Bugfix: desajuste de fondo en la celda "final boss"',
              body: 'La celda del partido final en la fila de progresión usaba un linear-gradient mientras todas las demás celdas usan `--bg-3` sólido. Esto creaba un corte visual molesto en la fila. Nuevo: sólido como las demás, más un tinte dorado amortiguado via `box-shadow: inset` para que la celda final siga siendo reconocible sin romper la consistencia de la rejilla.'
            },
            {
              title: 'Bugfix: situaciones probables — ¿quién se beneficia?',
              body: 'En el panel "Situaciones Probables" del hub no se distinguía si un frame iba A FAVOR o EN CONTRA de nosotros. "GOALIE STREAK" por ejemplo es un evento positivo (nuestro portero en racha) pero se renderizaba igual que frames negativos.\n\nNuevo: la etiqueta del frame recibe color según severidad — verde para positivo (good/opportunity), amarillo para warn, rojo para peligro. El contador a la derecha mantiene su propio tono (preparación de mazo) para que ambos ejes sean legibles de forma independiente.'
            }
          ]
        },
        {
          version: '0.44.0',
          title: 'Penaltis, fuera de juego y tooltips de rasgos',
          entries: [
            {
              title: 'Penalti inline (1.5%)',
              body: 'Nueva situación de gol: en vez del ataque normal puede surgir un penalti (1.5% de probabilidad a ambos lados, aprox. 1 cada 20-30 partidos). Resuelto **inline**, sin modal — la secuencia corre directa en el log del partido.\n\nIntroducción → desenlace en dos líneas narrativas:\n\n> ¡Falta en el área! El árbitro señala el punto — penalti a favor.\n> Gakpo la convierte con frialdad.\n\nEl **lanzador** es el jugador con más temple (ataque como desempate). El **portero** es el GK rival. La probabilidad de gol viene de ambos stats: base 73%, modificada por temple/ataque del lanzador (+) y defensa del portero (-), rango 55-92%. Tres desenlaces: gol, parada, fallo (palo/fuera). El gol funciona como uno normal (marcador +1, momentum +30, matchPhase=buildup). Fallo: momentum neutral, matchPhase=transition.\n\nStats: myPenalties/oppPenalties + myPenaltiesScored/oppPenaltiesScored.\n\n4 variantes de intro por lado + 4 gol + 4 parada + 4 fallo = 24 líneas de penalti por locale, anti-repetición por partido y por escena.'
            },
            {
              title: 'Fuera de juego a ambos lados (3%)',
              body: 'Paralelo al palo: el gol entra pero se anula. 3% por evento de gol, ambos lados. Cinco variantes por lado:\n\n> ¡Fuera de juego! Gakpo iba un hombro adelantado.\n> El banderín nos salva — Kagawa estaba tres pasos por delante.\n\nSin efecto en el marcador, matchPhase=transition. Stats: myOffsides/oppOffsides.'
            },
            {
              title: 'Tooltips de rasgos reescritos en clave narrativa (45 rasgos)',
              body: 'Los 45 rasgos de jugador en los 3 locales reescritos de "mecánica primero" a "narrativa primero", mismo estilo que la pasada anterior de rasgos rivales y rasgos legendarios. Ejemplos:\n\n- Antes: "Una vez por partido: se anula el primer gol recibido."\n- Ahora: "Cae de pie como un gato, el primer golpe rebota — una vez por partido, el primer gol recibido se anula."\n\n- Antes: "Todo el equipo recibe +3 de temple."\n- Ahora: "Transmite calma a todo el equipo en el campo — cada compañero recibe +3 de temple."\n\nLa mecánica permanece igual (sin cambio de balance), solo el tooltip se vuelve más explicativo y atmosférico. Los nombres de los rasgos no cambian.'
            }
          ]
        },
        {
          version: '0.43.0',
          title: 'Palos',
          entries: [
            {
              title: 'Palos de ambos lados (4%)',
              body: 'Los cuasi-goles ahora tienen su propio drama: 4% de probabilidad por evento de gol de que el disparo se estrelle en el aluminio en lugar de entrar. **A ambos lados**: mis disparos pueden dar en el palo/larguero (frustración "estuvo cerquísima") Y los disparos rivales igual (alivio "menuda suerte"). La tasa neta de goles se reduce en ambos lados ~4%, el balance se mantiene.\n\nEl momento recibe su propia línea narrativa. Ejemplos:\n\n> Construido a través de un cambio de banda — Gakpo la estrella en el larguero.\n> ¡Palo! Gakpo no tiene suerte.\n> Una desmarcada por fuera deja a Gakpo solo — y solo el palo se lo niega.\n\nLado rival:\n\n> ¡Palo! Kagawa estaba solo — y el marco nos salva.\n> El larguero le niega a Kagawa.\n> Kagawa estrella en el palo — el balón corre por la línea y se va.\n\n8 variantes lado propio + 6 variantes lado rival por locale. Anti-repetición por partido, rastreada por separado por escena.'
            },
            {
              title: 'Stats: myPostHits / oppPostHits',
              body: 'Dos nuevos contadores en match.stats. Aún no expuestos en la UI pero disponibles para futura telemetría y posibles stats de tipo "El palo te odia hoy".'
            }
          ]
        },
        {
          version: '0.42.0',
          title: 'Capa narrativa: construcción del gol',
          entries: [
            {
              title: 'Tus goles ahora muestran la cadena de construcción',
              body: 'Antes: jugar carta, ⚽ gol, listo. Ahora: antes del evento de gol, el juego cuenta **cómo se construyó la jugada** — usando la última carta de setup, la última carta de trigger y la carta de combo (si la hay) de esta ronda o la anterior. Ejemplos:\n\n> Construido a través de un cambio de banda — Gakpo remata.\n> La cadena de un cambio de banda a una desmarcada por fuera deja a Gakpo de cara.\n> ¡la Clase Maestra! Müller sella la jugada.\n\n9 variantes de plantilla por locale, 16 cartas con pistas narrativas. Anti-repetición por partido — la misma variante no aparece dos veces seguidas. Variantes cuyos placeholders no pueden rellenarse con el estado actual del partido se descartan automáticamente del pool (sin texto de "{setupHint}-fallback").'
            },
            {
              title: 'Goles en contra con contexto — "¿por qué encajamos?"',
              body: 'En paralelo a la narrativa de goles propios, los goles encajados también reciben contexto ahora. Como el rival no tiene sistema de cartas, el contexto viene de **nuestro estado táctico** al encajar (¿estábamos adelantados, a todo o nada, presionando agresivamente, sin cartas?) más una pista de traits rivales temáticamente relevantes (Francotirador, Contra, Sangre fría, etc.). Ejemplos:\n\n> Tras nuestro avance ofensivo — Kagawa contraataca.\n> Contragolpe letal encuentra nuestro riesgo a todo o nada — Gomez cumple.\n> Clásico disparo de francotirador: Kagawa lo clava.'
            },
            {
              title: 'Infraestructura técnica: módulo narrativo',
              body: 'Nuevo `js/narrative.js` con registro de escenas y sistema de plantillas. Cada escena tiene un pool de variantes con anti-repetición por partido. Tier de log propio `is-narrative` con CSS sutil en cursiva. Los hooks del motor son defensivos con try/catch — la narrativa nunca puede bloquear el flujo del motor. La infraestructura sirve ahora como base para más escenas (palos, lesiones, penaltis en próximas versiones).'
            }
          ]
        },
        {
          version: '0.41.0',
          title: 'Pulido de tooltips ronda 2',
          entries: [
            {
              title: 'Chips de plantilla en selección de equipo con tooltip',
              body: 'Las 5 chips de arquetipo en la pantalla de selección de equipo ("Portero Bloqueador", "Defensa Líbero", etc.) solo mostraban el label. Ahora el tooltip muestra: abreviatura del rol, perfil completo de stats y destaca las dos stats más altas. Si existe un texto descriptivo del arquetipo en i18n, también aparece.'
            },
            {
              title: 'Descripciones de traits rivales reescritas',
              body: 'Las 13 descripciones de traits de rivales eran specs de stats sin contexto ("+8% de precisión de tiro") — cero atmósfera, cero comprensión táctica. Ahora lideradas por lo narrativo con la mecánica como anclaje: "Rematan con precisión quirúrgica — cada disparo llega un 8% más peligroso al marco del portero." Afecta a sturm, riegel, konter_opp, presser_opp, clutch_opp, lucky, ironwall, sniper, boss_aura, bulwark, counter_threat, rage_mode, pressing_wall — en DE, EN y ES.'
            },
            {
              title: 'Descripciones de traits legendarios reescritas',
              body: 'Los 8 traits legendarios recibieron el mismo tratamiento. "Por cada salida exitosa: +8% al siguiente gol." se convierte en "Cada pase arma el siguiente. Cada salida exitosa eleva la probabilidad de gol del siguiente remate un +8%." Aplica a: god_mode, clutch_dna, field_general, unbreakable, big_game, conductor, phoenix, ice_in_veins.'
            }
          ]
        },
        {
          version: '0.40.0',
          title: 'Identidad de equipo y pulido de tooltips',
          entries: [
            {
              title: 'Elección de equipo: mazos iniciales arquetípicos',
              body: 'Hasta 0.39 la elección de equipo al inicio de partida era prácticamente cosmética — distintos legendarios en el banquillo pero mazo inicial idéntico para todos. Ahora cada uno de los cuatro equipos marca su mazo con **4 cartas arquetípicas** (más 10 cartas core compartidas), para que la identidad del equipo se note desde el partido 1:\n\n- **Especialistas del Contragolpe:** hope_shot, long_ball, ball_recovery, grind_through — fútbol directo al contragolpe\n- **Potencia Bruta:** long_ball, deep_defense, grind_through, lone_striker — desgaste físico con rematador target-man\n- **Magos de la Técnica:** masterclass, triangle_play, clinical_finish, quick_scout — el starter con más combos, orientado a la visión\n- **Bestias del Pressing:** forward_burst, high_press_trap, counterpunch, running_hot — triggers agresivos más dos counters\n\nLas 4 cartas arquetípicas aparecen ahora como chips con código de color en la pantalla de selección de equipo (el color del borde refleja el tipo de carta), cada una con tooltip.'
            },
            {
              title: 'Reclutas: ofertas estratificadas + sesgo hacia el rol débil',
              body: 'Las ofertas de legendarios tras los jefes eran tres picks uniformemente aleatorios — un equipo que no necesitaba delantero podía recibir tres STs por mala suerte. Ahora **tres roles distintos garantizados**, y uno de los slots tiene **sesgo hacia el rol del titular más débil** para que la oferta siempre incluya un relleno plausible de hueco de plantilla. Deliberadamente NO es temático de equipo: los traits legendarios y rutas de evolución siguen siendo totalmente aleatorios, manteniendo builds híbridos y sinergias inesperadas sobre la mesa.'
            },
            {
              title: 'UI: chips del panel de mazo desambiguadas',
              body: 'Las chips del panel de mazo ("2 MASTERCLASS" / "1 BREATHER") mostraban el coste de energía a la izquierda del nombre — visualmente indistinguible de un conteo de copias. Los jugadores no podían saber si "2" significaba "cuesta 2 energía" o "2 copias en el mazo". Fix: **prefijo ⚡** ("⚡2 MASTERCLASS"). Los duplicados conservan su marca separada "×N" a la derecha. Tooltip por chip ahora estructurado: nombre, tipo, coste de energía, coste de desgaste, copias — todo claro.'
            },
            {
              title: 'UI: tooltips faltantes rellenados',
              body: 'Tres clases de chip visibles no tenían tooltip — el jugador veía marcas sin saber por qué. Ahora cada una se explica: **fila de jugador clave del rival** (quién es la amenaza principal y por qué), **focus-chip en decisiones tácticas** (qué jugador recibe el boost y por qué), **tag de mecánica de descanso** (qué se mantiene en la segunda parte).'
            }
          ]
        },
        {
          version: '0.39.0',
          title: 'Fixes de variedad del mazo',
          entries: [
            {
              title: 'Balance: dominancia de switch_lane rota',
              body: 'La telemetría de 0.37 mostró **switch_lane con 59 de 155 jugadas = 38%** — apilaba tres utilidades en una carta de coste 1: Flow, apertura de banda y +8/+4 stats. Cada mano la elegía primero; drop_deep y quick_build se jugaron tres veces menos. Fix: **ahora laneOpen requiere Flow ≥ 1 ya construido**, y el desgaste sube de 3 a 4 (coincide con la reequilibración defensiva de 0.37). Un switch_lane al inicio de ronda sigue funcionando como setup normal; la banda solo se abre encadenada tras otro generador de Flow.'
            },
            {
              title: 'Balance: pool de draft estratificado',
              body: 'Hasta 0.38 el pool de draft (58 cartas en 6 tipos) distribuía las 3 ofertas uniformemente — tipos grandes como setup (21% del pool) aparecían en el 72% de los drafts, finos como draw (10%) solo en el 24%. Durante una temporada de 11 drafts, los arquetipos de counter y draw podían quedarse **invisibles toda la partida**. Fix: cada draft ahora ofrece **3 tipos DIFERENTES** — la probabilidad de ver un arquetipo draw por draft sube del 24% al ~42%. Pequeño trade-off: ya no hay drafts con tres setups seguidos — aceptable ya que el mazo inicial ya es setup-intensivo.'
            }
          ]
        },
        {
          version: '0.38.0',
          title: 'Condición & tooltips',
          entries: [
            {
              title: 'Balance: estado-atrapado de condición resuelto',
              body: 'La telemetría de 0.37.0 mostró un patrón de bucle mortal: tres titulares quedaron atrapados a 45/100 de condición desde el partido 4 hasta el final de la temporada — exactamente el valor del tier de recuperación `<20 → 45` y a la vez bajo el umbral de 50 donde empieza el malus de -3 a todas las stats. Terminar el partido bajo 20 → volver a 45 → jugar el siguiente con -3 → terminar bajo 20 otra vez → bucle. Curva de recuperación subida +10: uso ligero 88 (antes 82), moderado 76 (70), intenso 65 (58), sobreexplotado 55 (45). Crítico: **el nuevo piso de 55 queda por encima del umbral 50 del malus**, un titular sobreexplotado entra al siguiente partido cansado pero SIN penalización permanente a sus stats.'
            },
            {
              title: 'UI: abreviaturas de rol consistentes',
              body: 'Los chips de condición en las cartas de la mano y la fila de advertencia de fatiga en modo-carta mostraban aún los códigos internos TW/VT/PM/LF/ST en vez de las abreviaturas de jugador GK/DF/PM/WG/ST usadas en el resto de la UI. Ahora consistente en todo el juego.'
            },
            {
              title: 'UI: fila de advertencia de fatiga ordenada',
              body: 'La fila "💨 FATIGUE" bajo el banner de fase no tenía CSS — etiqueta y chips de jugador se pegaban ("FATIGUELF Gakpo"), y se encendía para cualquiera bajo 40 de condición (demasiadas falsas alarmas porque los chips por carta ya cubrían ese rango). Ahora con layout adecuado, y solo visible cuando al menos un titular de campo está bajo 30 — el tier realmente próximo a la zona peligrosa.'
            },
            {
              title: 'UI: tooltips de traits rivales completos',
              body: 'Cinco traits del rival (Baluarte, Doble Contra, Modo Furia, Muro de Presión, Aura de Jefe) no tenían tooltip — el código de renderizado solo miraba la tabla de traducción oppTells, y esos cinco no estaban ahí. Ahora los 13 traits tienen consejo orientado a la acción.'
            },
            {
              title: 'UI: malus de fatiga en tooltip de jugador',
              body: 'El tooltip de la barra de condición de una carta de jugador ahora muestra arriba del todo el **malus de stat actualmente activo**: "Critical fatigue — all stats currently reduced by 6" bajo 25, "-3" bajo 50. La explicación de recuperación abajo actualizada a los nuevos valores (88/76/65/55).'
            },
            {
              title: 'Fix: match-pulse ahora reacciona a las sustituciones',
              body: 'Tras una sustitución al descanso, la barra de stats y la fila de puntos de pulso de jugadores seguían mostrando al jugador saliente hasta el siguiente tick natural (gol, fin de ronda). Ahora se re-renderiza inmediatamente tras la sustitución.'
            }
          ]
        },
        {
          version: '0.37.0',
          title: 'Validación de balance y fixes de recarga',
          entries: [
            {
              title: 'La prueba confirma que el fix del snowball funciona, pero no del todo',
              body: 'Segunda partida de prueba bajo 0.36 (juego de spam, sin optimización táctica) produjo **la primera derrota** (2:6 contra el equipo más fuerte de la liga) y **dos empates** — comparado con 0.35.0 donde 11/11 partidos fueron paseos. La tabla de liga ahora tiene rango real (poder del rival 329-583 en lugar de los 330-347 planos). Impactos al cap de buffs cayeron del 22% al 11% de las jugadas de carta. **Aún pendiente:** contra rivales de media tabla en la vuelta, los partidos siguen cayendo en 9-0 / 10-1 — no es solo un problema de escalado del rival, también de composición del mazo.'
            },
            {
              title: 'Balance: defensa más cara, combos más baratas',
              body: 'La telemetría reveló incentivos invertidos: las cartas de defensa promediaban 3.1 de desgaste/jugada (las más baratas) Y representaban el 41% de todas las jugadas; las combos promediaban 6.4 de desgaste (las más caras) con solo el 6% de las jugadas. La estabilidad debería costar, el premio debería ser alcanzable — los números decían lo contrario. Cartas defensivas clave (tight_shape, hold_the_line, block, deep_defense, pressure_trap) ahora cuestan 4, combos top (masterclass, stone_cold, break_the_line, late_winner, final_whistle, lone_striker) reducidas a 5. Cartas de recuperación (breather, medic) se quedan en 0.'
            },
            {
              title: 'Balance: carta combo añadida al mazo inicial',
              body: 'El mazo inicial contenía solo **una** carta combo (hero_moment) entre 13 — densidad de combo del 7.7%. Los premios de combo apenas aparecían en los primeros 9-10 partidos, la cadena setup→combo era efectivamente invisible. `masterclass` se une — 2/14 = 14% densidad de combo, las combos ahora son tangibles desde el partido 1.'
            },
            {
              title: 'Telemetría: goles y jugadas del rival ahora capturadas',
              body: 'El grabador tenía dos huecos — `recordGoal` y `recordOppMove` estaban definidos pero la engine nunca los llamaba. La exportación de 0.36.2 mostró 0 goles y 0 jugadas del rival aunque realmente se habían marcado 51:15. Solución: ambos eventos ahora se derivan directamente del flujo de logs (clases de log `goal-me`/`goal-opp`/`opp-card`/`player-shield`). Sin cambios en la engine, totalmente retrocompatible. Futuras partidas de prueba tendrán datos completos.'
            },
            {
              title: 'Fix: el mazo pierde cartas al reanudar',
              body: 'Una recarga de pestaña entre dos partidos podía dejar a los jugadores empezando el siguiente juego con el mazo parcialmente vacío — 2 cartas o 0 en lugar de las ~20 esperadas. Causa raíz: el autoguardado al entrar al hub guardaba solo `_cardDeck` (el mazo para robar), no `_cardDiscard` (la pila de descarte). Después de 6 rondas hay ~16 cartas en descarte y ~4 en el mazo — el siguiente inicio de partido los fusiona, y con el descarte ausente solo quedan los 4. Fix: la pila de descarte ahora también se persiste. Los guardados tomados antes de esta actualización están afectados — iniciar una nueva partida restaura el estado correcto.'
            },
            {
              title: 'Fix: tabla de liga — fila propia ya no verde',
              body: 'La fila de tu propio equipo en la tabla de liga compartía el mismo color verde que la zona de ascenso (top 2). Estando en el puesto 3, tu fila parecía estar en rango de ascenso aunque solo los dos primeros suben. La fila propia ahora se renderiza en **cian** en lugar de verde — claramente legible como marcador de identidad. Los colores de zona (verde/rojo) se reservan para ascenso/descenso.'
            }
          ]
        },
        {
          version: '0.36.0',
          title: 'Fix del snowball',
          entries: [
            {
              title: 'Balance: la vuelta escala contigo',
              body: 'La telemetría de 0.35.0 mostró un acantilado en el partido 7: antes resultados realistas de 1-3 goles, después goleadas de 10-12. Cuatro fixes dirigidos contra el power creep: **los rivales ahora escalan dentro de una temporada** — la liga tiene una tabla real con equipos débiles y fuertes (antes todos al mismo nivel de poder), y los partidos de vuelta traen hasta +22% de stats en el rival proporcional al avance de temporada. **Los buffs de equipo ahora tienen rendimientos decrecientes** — por encima de +15 por stat cada aporte cuenta solo a mitad, en vez de pegarse al cap duro de +25. **Jugar la misma carta varias veces en un partido se amortigua** — el segundo set_piece al 80% de efecto, el tercero al 60%, suelo de 40% desde el cuarto. **Recuperación de condición más estricta** — los titulares acaban a 58 después de un partido duro en lugar de 70, lo que convierte la rotación en una palanca real.'
            }
          ]
        },
        {
          version: '0.35.0',
          title: 'Lanzamiento beta',
          entries: [
            {
              title: 'Fase beta & grabador de test-run',
              body: 'El juego está oficialmente en **beta**. Para pruebas de balance hay un **grabador de test-run** opcional: actívalo con `?telemetry=1` en la URL (o `KL.telemetry.setEnabled(true)` en la consola). Registra todos los partidos de una partida — contexto del rival, alineación, fases de ronda, cada carta jugada con desgaste y multiplicadores, cada decisión táctica, jugadas del rival y si fueron anuladas, goles, y estadísticas post-partido (disparos, condición, activaciones de rasgo). Exporta como JSON estructurado desde el pie de página cuando al menos un partido se haya jugado. Los datos quedan en local; nada se sube.'
            },
            {
              title: 'Continuar partida',
              body: 'Las partidas ahora sobreviven al cierre de pestaña y al reinicio del navegador. En el menú principal aparece un botón **Continuar Partida** con un resumen (equipo · categoría · temporada · partido · balance) cuando existe un guardado. Empezar una nueva partida pide confirmación para no borrar el guardado por accidente.'
            },
            {
              title: 'Estado físico visible en las cartas',
              body: 'El chip de coste de cada carta ahora muestra **quién** paga el desgaste y **dónde queda**: `⚡−4 ST 32→28` en vez de solo `⚡−4 ST`. Con código de color — neutro, ámbar por debajo de 50, rojo por debajo de 25 — igualando los umbrales de penalización de la engine. Las cartas encadenadas cuestan extra; el tooltip muestra el desglose ("Jugadas cuestan 6 (base 2 + 4)") para que el número inflado no parezca arbitrario.'
            },
            {
              title: 'Fix: el frame "defensa estirada" no hacía nada',
              body: 'El frame de card-mode "Defensa rival estirada" prometía un malus al siguiente aufbau del rival pero solo fijaba el contador de rondas, no la magnitud. El buff de equipo (+8 OFF / +6 VIS) sí funcionaba; el malus anunciado no. Ahora se fijan ambos.'
            },
            {
              title: 'Fix: contadores de efectos temporizados en card-mode',
              body: 'Cuatro contadores de rondas (malus aufbau, malus delantero, malus disparo, zona del portero) nunca decrementaban en card-mode — y fuera de card-mode el decremento corría una ronda antes de tiempo. Los efectos con **duración de 2 rondas** a menudo duraban solo una. Corregido; los efectos ahora duran lo que anuncian.'
            },
            {
              title: 'Guardados ligados al release',
              body: 'Los guardados ahora están explícitamente ligados a la versión del juego. Un release nuevo descarta limpiamente los guardados antiguos en lugar de cargarlos en un mundo donde los ids de cartas o los valores de balance pueden haber cambiado. La puntuación máxima y el progreso del códice se conservan.'
            }
          ]
        }
      ]
    },
    telemetry: {
      emptyNotice: 'Aún no hay datos de test-run. Juega al menos un partido con el grabador activo.',
      downloadFailed: 'La descarga falló. Revisa la consola del navegador para más detalles.'
    },
    manual: {
      title: 'KICKLIKE · Manual',
      close: '✕ Cerrar',
      sections: [
        {
          title: 'Temporada y Liga',
          body: 'Una temporada son catorce partidos — cada equipo rival uno en casa y otro fuera. Termina entre los dos primeros y subes; entre los dos últimos y cae el hacha.\n\nUn Run completo escala tres niveles: Liga Amateur, luego Liga Pro, luego la Copa. Ocho equipos por liga, tres rondas eliminatorias en la Copa. Unos treinta y un partidos si llegas hasta el final.\n\nDos formas de perder un Run antes de tiempo:\n\n- **Racha negativa.** Tres partidos seguidos sin puntuar, y el entrenador se va. Sin avisos, sin apelaciones.\n- **Descenso en Amateur.** Si acabas entre los dos últimos en la Liga Amateur, el Run termina — no hay nivel inferior al que bajar.'
        },
        {
          title: 'Desarrollo del partido',
          body: 'Seis rondas por partido, unos quince minutos simulados cada una. Tú eliges el saque inicial, reaccionas al descanso y cierras el partido en la última ronda — tres decisiones reales. Los otros ochenta y siete minutos corren sobre las estadísticas del plantel, los traits que se disparan y las cartas que has logrado jugar.\n\nCada ronda vive en una fase — construcción, posesión, ataque, transición, recuperación, defensa — y la fase cambia con el impulso. La misma carta combo ruge en ATAQUE y susurra en DEFENSA. Lee el partido, calcula tu momento.\n\nSobre el log se fija el banner OPP THREAT: lo que el rival está cargando esta ronda. Cada ronda roba **una jugada** de su propio mazo — oleada ofensiva, lockdown, disrupción, setup o big-move — y el banner la muestra con severidad de uno a tres puntos. Un punto es ruido de fondo. **Dos o tres puntos están telegrafiados** — una carta de contra o bloqueo en la misma ronda la tacha, y una etiqueta "DEFUSED" cae en el log. Los big-moves de tres puntos pegan más fuerte: goles garantizados, ataques triples, oleadas ofensivas de tres rondas. Los big-moves sin bloquear rompen partidos. Lee el banner y reserva un Block o Clutch Defense para el momento clave.'
        },
        {
          title: 'Cartas y energía',
          body: 'Cada ronda robas cuatro cartas y recibes tres de energía. Gástala, no la acumules — la energía se resetea al pitido, las cartas no jugadas van al descarte (salvo que lleven el tag *retain*). Cada carta drena la condición de un titular apropiado al jugarla; el jugador que encaja con la carta carga el peso.\n\nSeis tipos de carta, cada uno con un trabajo:\n\n- **Setup** prepara el ataque. Abre carriles, construye flow.\n- **Trigger** dispara un efecto ya — el obrero del bump de estadística.\n- **Combo** necesita que caiga primero el setup, luego paga fuerte.\n- **Defense** aprieta al portero y a la zaga.\n- **Counter** castiga amenazas rivales cargadas.\n- **Draw** convierte una carta en más cartas.\n\nEncima viven los multiplicadores de fase. Una carta combo canta en ATAQUE y susurra en DEFENSA. La mayoría de mazos llegan al ataque jugando primero una carta setup — un mazo lleno de combos sin ancla apenas ve el bonus de ataque. Planea al menos un setup.\n\n**Cartas reactivas** entran en el pool de draft según avanza el Run — Médico cura al titular falteado, Cara de Póker inmuniza la próxima carta contra disrupción, Defensa Clutch garantiza el bloqueo de un big-move telegrafiado, Contragolpe al Contra voltea su contra en la tuya, Romper la Línea destroza un lockdown, Informe de Scout revela sus próximos dos movimientos. Silenciosas en la mayoría de rondas, decisivas en las equivocadas. Mete algunas en tu mazo antes de llegar a Pro.\n\n**Mulligan.** ¿Mano de salida horrible? En la ronda 1, *antes* de jugar nada, puedes tirar la mano entera y robar de nuevo. Una vez por partido, gratis.\n\n**Coste de pasar.** Una ronda sin jugar ninguna carta no es gratis. El equipo juega descoordinado — las cinco estadísticas reciben un golpe esa ronda, y un malus de tempo se queda pegado el resto del partido. El primer skip es suave; dos o tres se acumulan feo.\n\n**Rendimientos decrecientes.** Jugar varias cartas en la misma ronda se premia, pero a partir de la segunda los bonus de estadística se amortiguan — 82%, 64%, 46%, suelo del 35%. El spam es posible pero menos rentable que el juego medido. Además, los buffs del equipo tienen un tope duro de ±25 por estadística por ronda — apilar hacia el infinito ya no es estrategia.\n\n**Bonus de cadena.** Tres tipos de carta distintos en una ronda y el equipo encaja: *VERSATILE PLAY*, un bump plano general. Cuatro o cinco tipos es *TOTAL FOOTBALL* — notablemente más fuerte. Los mazos que apilan un solo tipo enseñan números de sinergia preciosos y pierden el bonus de cadena. La variedad deliberada paga.'
        },
        {
          title: 'Construcción del mazo a lo largo del Run',
          body: 'Después de casi cada partido, tu mazo cambia. Una decisión de draft por partido, los modos se alternan:\n\n- **Add** — tres cartas nuevas sobre la mesa, te quedas con una.\n- **Remove** — descarta una carta que ya no te convence.\n- **Upgrade** — marca una carta para un refuerzo permanente.\n- **Replace** — una fuera, una dentro.\n- **Evolution** — en hitos clave (partido seis y trece), especialización de rol en vez de cartas.\n\nLos partidos contra jefes son la excepción: si ganas, eliges **dos** cartas en vez de una. Tras la final de liga no hay draft — la nueva temporada arranca limpia.'
        },
        {
          title: 'Condición y fatiga',
          body: 'Cada titular lleva un medidor de forma física que se vacía poco a poco durante el Run. Jugar una carta drena al jugador que encaja — el delantero paga cuando juegas un remate, el portero cuando juegas una parada.\n\nEntre partidos la plantilla se recupera, pero el desgaste acumulado queda. Un titular que ha corrido duro tres partidos aún arrastra en el cuarto. Los suplentes se recuperan más rápido y salen frescos con más frecuencia — rotar es una herramienta, no una obligación.\n\nUn puñado de cartas (Breather, Rotación, Doping) recargan la forma a mitad de Run. Un titular críticamente agotado activa *CRITICAL FATIGUE* — un marco visible con penalización a todo el equipo hasta que hagas algo al respecto.'
        },
        {
          title: 'Rasgos y Evolución',
          body: 'Cada jugador puede llevar hasta dos traits pasivos — pase láser, chess predict, ghost run y similares. Se disparan en segundo plano durante los partidos, dando forma a ataques y paradas sin que tengas que hacer clic.\n\nGana partidos, los jugadores ganan experiencia, los jugadores suben de nivel. Al alcanzar el nivel tres se abre un nuevo slot de trait — elige de una lista curada.\n\nEn algunos niveles superiores el jugador se hace elegible para una **evolución** en vez de un nivel-up normal. Las evoluciones reconfiguran estadísticas y desbloquean una especialización de rol — regista, extremo invertido, portero-líbero — con el bono de afinidad de carta correspondiente. El jugador conserva todo lo que tenía; gana una firma encima.'
        },
        {
          title: 'Jefes y leyendas',
          body: 'Cada temporada de liga tiene dos **partidos contra jefes** — el test de media temporada y la final. Los jefes tienen estadísticas elevadas en todas las posiciones, más traits en más jugadores y juegan como si fueran turbo.\n\nVence a un jefe y en el siguiente draft aparecerá un **fichaje legendario**: un jugador con estadísticas altas y un trait firma que no encontrarás en ningún otro lado. Hasta dos en el banquillo a la vez.\n\nLa Copa es todo jefes, todo el rato. Tres rondas eliminatorias, la final un super-jefe — más traits, estadísticas más altas, cero piedad.'
        },
        {
          title: 'Rival vivo',
          body: 'Los rivales no son bloques de estadísticas. Cada equipo juega uno de cinco **arquetipos**:\n\n- **Catenaccio** — defensivo, paciente, mortal al contraataque. Aparca el autobús, castiga pérdidas.\n- **Gegenpressing** — presión alta, desgastante. Drena tu condición, interrumpe tus cartas.\n- **Tiki-Taka** — posesión, martillo tardío. Paciente en construcción, brutal tras el descanso.\n- **Juego Directo** — agresivo, de alto riesgo. Dispara sin pensarlo, va a la yugular.\n- **Caos** — impredecible. Todas las categorías en juego, sin respetar cooldowns.\n\nCada arquetipo lleva su propio **mazo de jugadas**. Cada ronda el rival roba una jugada de ese mazo, y el banner OPP THREAT la anuncia. Las jugadas caen en cinco categorías:\n\n- **Aggressive** — disparos extra, sobrecargas de banda, contras relámpago.\n- **Lockdown** — aparcar el autobús, búnker, bloque bajo, muro mental.\n- **Disruption** — faltas tácticas, presión falsa, pérdida de tiempo, entradas duras que drenan a tus titulares.\n- **Setup** — estudio de cinta, charla del capitán, subida silenciosa de estadísticas.\n- **Big-move** — jugadas estrella, empujones desesperados, presión tiki-taka. Severidad 3, siempre telegrafiados, devastadores si no se bloquean. Cada arquetipo solo tiene uno o dos en su pool.\n\n**La inteligencia del rival escala con el Run.**\n\n- **Amateur (M1-7)** — pool pequeño, sin big-moves, jugadas medio aleatorias. Los planes son legibles pero no transparentes.\n- **Pro (M8-14)** — pool completo, ponderado por contexto. Ven el marcador, recuerdan tus últimos tres tipos de carta, cronometran la presión contra tu spam de combos.\n- **Copa (M15+)** — adversarial. Todos los big-moves desbloqueados. Los equipos jefe encadenan dos jugadas por ronda y guardan jugadas estrella entre partidos.\n\nLos rivales **te siguen estudiando en la temporada**. Si te apoyas en un tipo de carta partido tras partido, los próximos rivales aparecerán con un bono de estadística contraria y una etiqueta *ADAPTED*. Nada gratis para los mono-mazos.\n\n**Lee el banner.** Un punto es silencio. Dos puntos significan: planea respuesta. Tres puntos significan: necesitas Block, Vorwegnehmen, Defensa Clutch o un contra adecuado *esta ronda*, o la jugada cae sin oposición — un gol gratis, un ataque triple, tres rondas de ofensiva elevada. Cronometra tus contras.'
        },
        {
          title: 'Copa, campeones y códice',
          body: 'La Copa se sienta en la cima — tres partidos eliminatorios, todos jefes, tras la Liga Pro. Empate en el tiempo regular: prórroga, luego penaltis. Un solo tiro, sin repetición.\n\nGana la Copa y eres **Run Champion**. Es el logro máximo que un solo Run puede alcanzar.\n\nEl **Codex** en la pantalla de inicio lleva registro de tu carrera entre Runs: los logros que has desbloqueado, las cartas que has descubierto, los legendarios que has fichado alguna vez. Continuidad de Run a Run — lo único que sobrevive al despido del entrenador.'
        }
      ]
    },
    draft: {
      title: 'Elige tu equipo inicial',
      body: 'Cada equipo tiene un tema, una fortaleza y una debilidad. Su identidad se define después mediante evoluciones.',
      starterCards: 'Cartas de arquetipo:'
    },
    hub: {
      yourTeam: 'Tu Equipo',
      opponent: 'Rival',
      squad: 'Plantilla',
      bench: 'Banquillo',
      deck: 'MAZO',
      lineup: '⚙ Alineación',
      startMatch: '▶ Empezar Partido',
      quickSim: '⏩ Sim Rápida',
      bossTag: 'JEFE',
      suspendedAlert: '{name} está sancionado este partido',
      suspendedAlertTooltip: '{name}: tarjeta roja en el último partido. Sanción por {n} partidos más. Sustitúyelo desde el banquillo antes de empezar.',
      vs: 'VS',
      nextUp: 'Siguiente',
      powerGap: 'Poder {me} vs {opp}',
      cardAlert: '{name} en amarilla — una más y está fuera',
      benchEmpty: 'Sin banquillo aún',
      tapForDetails: 'Toca un jugador para detalles',
      chipTraits: '{n}× activado',
      chipGoals:  '{n} goles',
      chipEvos:   '{done}/{max} evos',
      chipStreak: 'Racha {n}V',
      tilePower:  'Poder',
      tileTraits: 'Rasgos activados',
      tileEvos:   'Evoluciones',
      // v52.2 — Etiquetas del acordeón de stats
      stats:           'Stats',
      statsWins:       'Victorias',
      statsDraws:      'Empates',
      statsLosses:     'Derrotas',
      statsGoalDiff:   'Dif. goles',
      statsGoals:      'Goles',
      statsTraits:     'Rasgos',
      statsEvos:       'Evos',
      statsStreakNow:  'Racha',
      statsStreakBest: 'Mejor',
      conditionTooltip: 'Jugar partidos desgasta la condición. Entre partidos: ≥60 → 90, 40-59 → 80, 20-39 → 70, por debajo de 20 → 55. Los suplentes se recuperan del todo (+30 hasta 100). Rotar a titulares muy desgastados ayuda, pero no es obligatorio.',
      adaptationTag: 'ADAPTADO',
      adaptationTooltip: 'Han estudiado tu mazo — enfocado en {type} ({share} de tus jugadas). +{bump} {stat} en esta plantilla para contrarrestarlo.'
    },
    detail: {
      traits: 'Rasgos',
      traitCategory: {
        passive:     'Pasivo',
        event:       'Evento',
        conditional: 'Condicional',
        once:        'Único'
      },
      traitCategoryHint: {
        passive:     'Permanente o probabilidad por ronda',
        event:       'Se activa con un evento del partido',
        conditional: 'Solo bajo ciertas condiciones',
        once:        '1x por partido o por parte'
      },
      noTraits: 'Aún sin rasgos — se desbloquean al evolucionar.',
      stats: 'Stats',
      runStats: 'Este Run',
      runGoals: 'Goles',
      runAssists: 'Asistencias',
      runMinutes: 'Minutos',
      close: '✕ Cerrar',
      level: 'Nivel {lv}',
      suspended: 'Sancionado próximo partido',
      yellow: 'Con tarjeta amarilla',
      xpProgress: '{xp} / {next} XP'
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
      fast: '⏩ Rápido',
      pulseBuildup: 'construcción',
      pulseDefense: 'paradas',
      pulseSaves: 'paradas',
      noModifiers: 'Sin modificadores activos',
      pulseTipCondition:    'Condición {value} → −{pen} todas las stats',
      pulseTipForm:         'Forma {form} → {sign}{delta} {stat}',
      pulseTipTeamForm:     'Forma de equipo → {sign}{value} todas las stats',
      pulseTipCardsTactic:  'Cartas/Táctica → {parts}'
    },
    matchHud: {
      phase: {
        firstHalf:   '1.ª parte',
        secondHalf:  '2.ª parte',
        buildup:     'Construcción',
        possession:  'Posesión',
        transition:  'Transición',
        attack:      'Ataque',
        recovery:    'Recuperación',
        defensive:   'Defensa'
      },
      event: {
        meGoal:  'Gol',
        oppGoal: 'Gol en contra',
        oppCard: 'Carta rival',
        shield:  'Escudo bloquea',
        counter: 'Contra jugada'
      },
      interrupt: {
        kickoff:  'Táctica de saque',
        halftime: 'Decisión de descanso',
        final:    'Táctica final'
      },
      badge: {
        kickoff:  'KO',
        halftime: 'DES',
        final:    'FIN',
        oppCard:  'C',
        shield:   'S',
        counter:  '↯'
      }
    },
    phase: {
      shiftOwnGoal: [
        'Vuelta al inicio — saque desde el portero.',
        'Gol marcado — reorganizar, sin prisa.',
        'Saque inicial — el partido se reinicia.'
      ],
      shiftConceded: [
        'Modo defensivo — replegarse, encajar el golpe.',
        'Nos marcaron — línea más baja, compactos.',
        'Reagrupar atrás — paciencia.'
      ],
      shiftSave: [
        '¡Transición! Balón rápido al frente — se abre el carril del contragolpe.',
        'Parada se vuelve ataque — volar hacia delante.',
        'Portero atrapa, saque largo — ¡nos escapamos!'
      ],
      shiftMiss: [
        'Ocasión desperdiciada — la posesión cambia de bando, reorganizar.',
        'Fuera — volverán, mantener la forma.',
        'Se fue fuera — saque de puerta para ellos.'
      ],
      shiftLaneOpen: [
        'Fase de ataque — el carril está abierto, empujar adelante.',
        'Desmarque por fuera — la banda es nuestra, vamos.',
        'Espacio por el pasillo — aprovecharlo.'
      ],
      shiftPossession: [
        'Fase de posesión — el equipo orquesta el juego.',
        'Mantener el balón — cansarlos.',
        'Ralentizar — nosotros dictamos.'
      ],
      shiftDefensive: [
        'Defensa estabilizada — de vuelta en forma tras dos rondas duras.',
        'Reagrupados — paró la hemorragia, ahora construir.',
        'Estabilizados — la forma aguanta de nuevo.'
      ]
    },
    matchEvents: {
      cornerKick: [
        'Córner — balón al área. Prepara ahora y capitalízalo.',
        'Bandera arriba — córner a favor. Un buen centro vive de una jugada.',
        'El árbitro señala el córner. Área abarrotada — ¿quién salta?'
      ],
      counterPressChance: [
        'Momento de cambio — presionar antes de que se reorganicen.',
        'Están descolocados tras la parada — a por el balón.',
        'Pies rápidos, línea alta — aquí se rompen.'
      ],
      oneOnOne: [
        'Mano a mano con el portero — sangre fría o nervios?',
        'Delantero solo ante el gol — el tiempo se detiene.',
        'Cara a cara con el portero — solo uno sobrevive.'
      ],
      injuryScare: [
        'Un jugador cojea — rotar o aguantar?',
        'Alguien se agarra el muslo — hace falta descanso.',
        'El banquillo observa — condición crítica.'
      ],
      yellowCardThreat: [
        'Último aviso — una entrada más y es amarilla.',
        'El árbitro pierde la paciencia — medir o dejar correr?',
        'Libreta fuera — cuidado con las entradas.'
      ]
    },
    result: {
      win: 'VICTORIA',
      loss: 'DERROTA',
      draw: 'EMPATE',
      continue: '▶ Continuar',
      verdict: {
        underdogStood:    'Aguantasteis a un rival claramente mejor — puntos al favorito.',
        squadGassed:      'Al equipo se le acabaron las piernas — {players} bajaron de 35 condición.',
        buildupStruggled: 'La construcción se atascó — solo el {pct}% de intentos encontró al receptor.',
        chancesMissed:    '{shots} disparos, un gol — las ocasiones llegaron, la finalización no.',
        oppRuthless:      'Sus {shots} ocasiones acabaron en {goals} goles — quirúrgico.',
        dominantWin:      'Victoria de oficio — la diferencia se notó.',
        gritWin:          'Victoria sufrida.',
        shareSpoils:      'Reparto justo de puntos.',
        toughLoss:        'Duro — toca volver a la pizarra.'
      },
      analysis: 'Resumen del Partido',
      players: 'Resumen de Jugadores',
      matchLogTitle: 'Log del Partido',
      cardSummaryTitle: 'Juego de Cartas',
      highlightsTitle: 'Destacados & Próximo',
      detailsToggle: 'Resumen Completo',
      stopsLabel: 'paradas',
      sacrificeNote: '⚠ {name} lo dio todo — pérdida permanente de estadística.',
      cardsTitle: 'Juego de Cartas',
      cardsPlayed: 'CARTAS JUGADAS',
      cardsSkipped: 'Sin cartas jugadas',
      flowPeak: 'FLOW MÁX',
      deckAfter: 'MAZO',
      mostPlayed: 'Más jugadas',
      framesFired: 'Situaciones',
      condBilanz: 'Condición',
      hlGoal:         '{name} en el marcador',
      hlBraceOrHat:   '{name} con doblete',
      hlHatTrick:     '{name} hat-trick — {n} goles',
      hlKeeperBig:    '{name} muro — {n} paradas',
      hlKeeperSolid:  '{name} firme — {n} paradas',
      hlBreakout:     '{name} explota — +{xp} XP',
      hlFlop:         '{name} fuera de ritmo — necesita reset',
      hlOverperform:  'Por encima de lo esperado (pre-partido: {pre}% victoria)',
      hlUnderperform: 'Por debajo de lo esperado (pre-partido: {pre}% victoria)',
      decisionsTitle: 'Tus decisiones',
      decisionsSum:   'Total',
      decisionNoXp:   'sin XP bonus',
      microBoostsTitle: 'Boosts de stats ganados',
      microBoostsHint:  'Los éxitos por decisión subieron permanentemente estos atributos.',
      matchFlowTitle: 'Flujo del Partido',
      matchFlowHint:  'Evolución de las estadísticas del equipo durante el partido (buffs, forma, habilidades).',
      decisionPhase: {
        kickoff:  'Inicio',
        halftime: 'Descanso',
        final:    'Final'
      },
      traitReportTitle: 'De dónde vino tu ventaja',
      traitReportEmpty: 'No se activó ninguna habilidad en este partido.',
      traitReportFires: '{count} activaciones',
      traitReportPassive: 'ACTIVO',
      traitReportImpact: 'impacto ~{value}',
      traitReportFooter: 'Activaciones × peso por habilidad. Más alto = más influencia en este partido.',
      // v52.2 — franja de logros nuevos en la pantalla de resultado
      achievementsBanner: '🏆 NUEVOS LOGROS',
      achievementsBannerOne: '🏆 Logro desbloqueado'
    },
    optionNotes: {
      kickoffAggressive: 'volumen de tiros temprano',
      kickoffDefensive:  'primeras tres rondas más seguras',
      kickoffBalanced:   'primera salida garantizada',
      kickoffTempo:      'ritmo sobre control',
      kickoffPressing:   'corta sus ataques si pega',
      kickoffPossession: 'lo mejor para salida limpia',
      kickoffCounter:    'ataques fallidos del rival disparan contras',
      kickoffFlank:      'apuesta fuerte al ritmo del LF',
      halftimePush:      'ideal cuando llegas al área pero no rematas',
      halftimeStabilize: 'ideal cuando les crean ocasiones limpias',
      halftimeShift:     'sube la {stat} de {name}',
      halftimeRally:     'escala con el marcador',
      halftimeReset:     'parche seguro para varios puntos débiles',
      halftimeCounter:   'ideal si se sobreexponen',
      halftimeHighPress: 'ideal si su salida es demasiado limpia',
      halftimeVisionPlay: 'ideal si la salida es el verdadero problema',
      finalAllIn:        'persecución pura del gol',
      finalParkBus:      'proteger la ventaja',
      finalHeroBall:     '{name} gana +30 {stat}',
      finalKeepCool:     'ideal cuando fallan nervios o salida',
      finalPress:        'presión de última ronda con upside de contra',
      finalLongBall:     'saltarse parte de la salida para presión directa',
      finalMidfield:     'ideal para una posesión limpia',
      finalSneaky:       'proteger y contraatacar',
      finalSacrifice:    '-15 de foco a un jugador por ofensiva de equipo ya',
      fitFullValue:      'encaja con la plantilla: valor pleno',
      misfitReduced:     'misfit: valor reducido, riesgo sube',
      synergyMult:       'sinergia ×{mult}',
      conflictMult:      'conflicto ×{mult}'
    },
    prob: {
      win:  'Victoria',
      draw: 'Empate',
      loss: 'Derrota',
      currentWin: 'Probabilidad actual de victoria',
      boosts:     'Boosts'
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
    momentum: {
      barTooltip:
        'Flujo del partido — quién controla el juego ahora mismo.\n\n' +
        'Derecha (verde) = tu lado, izquierda (rojo) = rival. Centro = igualado.\n\n' +
        'Mezcla tres señales:\n' +
        '· Posesión (60%) — promedio móvil sobre las rondas jugadas\n' +
        '· Diferencia de goles (10%) — cada gol desplaza ±10 puntos (con tope)\n' +
        '· Momentum del motor (30%) — oscila con goles, paradas y cambios de zona\n\n' +
        'Se actualiza cada ronda. Casa bien con los chips EDGE / THREAT debajo.'
    },
    intel: {
      probableFrames: 'SITUACIONES PROBABLES',
      counters:       'contras',
      noCounters:     'sin contras',
      payoffs:        'remates',
      noPayoffs:      'sin remates',
      title: 'Intel del Enfrentamiento',
      effectivePowerTitle: 'Poder Efectivo',
      basePowerLabel: 'Base',
      traitPowerLabel: 'Rasgos',
      effectiveLabel: 'Efectivo',
      powerBreakdown: '{base} +{traits} = {effective}',
      deltaAhead: '+{delta} ventaja',
      deltaBehind: '{delta} de desventaja',
      deltaEven: 'Partido parejo',
      advantagesTitle: 'Tu ventaja',
      warningsTitle: 'Sus amenazas',
      noAdvantages: 'Sin ventajas de rasgos destacables — partido de stats.',
      noWarnings: 'Sin amenazas específicas del rival.',
      verdictDominant: 'Los deberías arrollar',
      verdictAhead:    'Favorito',
      verdictEven:     'Cara o cruz',
      verdictBehind:   'Hueso duro',
      verdictUnderdog: 'Cuesta arriba',
      headlineBoth:    '{adv} — pero {warn}',
      headlineNothing: 'Partido de stats — sin grandes duelos de rasgos.',
      advPredatorVsPresser: 'El instinto depredador de {name} castiga sus errores de presión.',
      advLateBloom: '{name} entra en racha en rondas 4-6.',
      advClutchMatchup: 'Tus rasgos clutch igualan los suyos en los minutos finales.',
      advBigGame: '{name} vive para los jefes — +15 de stat de foco.',
      advFieldGeneral: 'Field General eleva a toda la plantilla +4 en todo.',
      advKeeperWall: 'El rasgo de tu portero neutraliza su amenaza aérea.',
      advTempo: '{name} corre más que toda su defensa.',
      warnSniper: '{name} (sniper) — cada disparo es una amenaza.',
      warnCounter: '{name} castiga cada pérdida al contragolpe.',
      warnIronwall: '{name} cierra las rondas iniciales — 1-2 se ven impenetrables.',
      warnClutchUnanswered: '{name} acelera tarde — no tenéis respuesta clutch.',
      warnPresserNoVision: '{name} presiona alto y sin visión de PM para escapar.',
      warnStatGap: '{diff} de poder de stats por debajo — los rasgos deben cargar con esto.',
      warnBoss: 'Rival jefe — todas las stats elevadas.'
    },
    verdict: {
      close:       'Ajustado',
      favored:     'Favorito',
      strongEdge:  'Gran ventaja',
      tough:       'Pelea dura',
      bossFight:   'Combate de jefe',
      trustTraits: 'Confía en tus rasgos',
      rideForm:    'La forma rueda',
      riskyStreak: 'No pierdas un tercero',
      newRival:    'Nuevo rival'
    },
    hints: {
      lfTempoEdgeExact: '{name} tiene ventaja de ritmo: {myTempo} TEM vs {oppTempo}.',
      lfTempoRiskExact: 'Su ritmo puede castigar la banda: {myTempo} TEM vs {oppTempo}.',
      shakyBuildUp: 'Salida tambaleante: PM {vision} VIS / {composure} COM. Opciones de control son la mejor vía.',
      backlineUnderPressure: 'La defensa arranca bajo presión: {hold} hold vs {oppOffense} OFF rival.',
      earlyControl: 'Deberías controlar el inicio. Posesión o balanced pueden hacer bola de nieve.',
      buildupLow: 'Tu salida solo al {rate}%. Visión/temple son la primera corrección.',
      accuracyLow: 'Llegas a los remates pero no defines: {rate}% de acierto. Ataque/directo ayuda más que control.',
      oppBuildupHigh: 'Salen demasiado limpio: {rate}% su construcción. Defensa/presión/portero ayudan.',
      finalNeedEntry: 'Primero una entrada más limpia: salida {rate}%.',
      finalNeedPressure: 'Entrada OK. Ahora presión ofensiva: acierto {rate}%.',
      finalProtectionWorking: 'La protección funciona. Defensa/temple pueden cerrar esto.',
      ironwallEarly: 'Rasgo Ironwall: rondas 1-2 su defensa casi impenetrable.',
      sniperWarning: 'Rematador de precisión — cada intento es peligroso.',
      clutchOppLate: 'Se hacen más fuertes tarde — rondas 5-6 ojo.',
      presserOppActive: 'Presión alta llegando — la salida se verá interrumpida.',
      bossWarning: 'Combate de jefe — todas sus stats elevadas.',
      lfTempoAdvantage: '{name} tiene ventaja de ritmo — el juego por banda puede ser decisivo.',
      lfTempoDisadvantage: 'Su ritmo es más alto — amenaza de contra por las bandas.',
      squadInForm: 'El equipo vuela — tácticas de presión amplificadas.',
      squadInCrisis: 'Confianza baja — opciones seguras conllevan menos riesgo.',
      pressingBlocked: 'La presión bloqueó {n} ataques en la primera mitad.',
      countersFired: 'Sistema de contra disparado {n}× — funciona.',
      scoreLeading: 'Vas por delante — consolidar es una opción.',
      scoreTrailing: 'Vas persiguiendo — la urgencia cuenta ahora.',
      tacticSynergyKickoff: 'Esta táctica encaja con las fortalezas de tu plantilla.',
      tacticConflict: 'Esta táctica puede chocar con tu configuración actual.',
      legendaryOnBench: '{name} está en el banquillo y listo.',
      finalLegendaryOnBench: 'Leyenda en el banquillo — la ronda final podría ser su momento.',
      oppBuildupLow: 'La salida rival solo al {pct}% — son vulnerables.',
      noHint: ''
    },
    phaseGuide: {
      kickoffBuildUp: 'La salida pasa por visión/temple del PM: {vision} VIS / {composure} COM.',
      kickoffControl: 'Ventaja de control ahora: {delta}.',
      kickoffWide: 'La amenaza por banda es el ritmo del LF: {lfTempo} vs {oppTempo}. Hold defensivo: {hold} vs {oppOffense} OFF rival.',
      halftimeBuildUp: 'Arregla la salida primero si está baja: {myRate}% tuyo vs {oppRate}% suyo.',
      halftimeAccuracy: 'Si la salida va bien pero falta definición, ahora precisión: {myAcc}% tuyo vs {oppAcc}% suyo.',
      halftimeDefense: 'La defensa vive ahora en el hold de TW/VT: {hold} de hold y {saves} paradas hasta ahora.',
      finalChaseStatus: 'Necesitas un gol ya. La salida está al {buildup}%, la precisión al {accuracy}%.',
      finalChaseAdvice: 'Si la salida es el bloqueo, favorece control/visión. Si son los remates, favorece ataque/directo.',
      finalProtectStatus: 'Proteges una ventaja. Su salida está al {oppRate}% y tu línea de hold es {hold}.',
      finalProtectAdvice: 'Defensa y temple valen más que ataque puro ahora mismo.',
      finalLevelStatus: 'Partido parejo. Elige si el bloqueo es entrada, finalización o protección: salida {buildup}%, precisión {accuracy}%, paradas {saves}.',
      finalLevelAdvice: 'Opciones de medio/control crean una posesión limpia; directo/ataque persiguen varianza.'
    },
    ht: {
      title: 'DESCANSO',
      detailsToggle: 'Detalles del Partido',
      pressBlocked: 'La presión bloqueó {n} ataques',
      countersFired: 'Sistema de contra disparó {n}×',
      momentumActive: 'Momentum: +{bonus}% bonus de salida próxima ronda',
      activeIntoSecondHalf: 'Activo en la 2ª mitad →',
      mechanicCounter: 'Trampa de contra activa',
      mechanicPressing: 'Presión activa',
      mechanicPossession: 'Bloqueo de posesión',
      mechanicAggressive: 'Oleada ofensiva',
      mechanicFlank: 'Carreras por banda',
      mechanicRally: 'Modo rally'
    },
    cards: {
      yellow: 'Tarjeta amarilla — una más en este partido = expulsión y sanción para el siguiente.',
      secondYellow: 'Segunda amarilla — expulsado de este partido, sancionado para el próximo.',
      red: 'Tarjeta roja — expulsado de este partido, sancionado para el próximo.',
      suspendedNext: 'Sancionado — no puede jugar el próximo partido.',
      academyTooltip: 'Suplente de la cantera — reemplazo temporal, estadísticas muy reducidas, sin habilidades. Abandona el equipo tras este partido.',

      // Card-play layer (hand/deck/discard UI + card catalog)
      endTurn:      "TERMINAR TURNO",
      mulliganBtn:  "MULLIGAN",
      deckLabel:    "MAZO",
      discardLabel: "DESC",
      deckTooltip:    "Mazo — cartas por robar en este partido. Cuando se vacía, la pila de descarte se baraja de nuevo como mazo (bucle estándar de deckbuilder).",
      discardTooltip: "Descarte — cartas ya jugadas o descartadas este partido. Vuelve a barajarse al mazo cuando este se agota.",
      flowHint:       "Las cartas de Setup generan Flow. Las cartas Trigger y Combo lo consumen para efectos más fuertes.",
      laneHint:       "Lane Open desbloquea cartas que consumen lane con un gran empuje ofensivo.",
      pressHint:      "Press Resist absorbe la presión del rival — reduce su bono defensivo esta ronda.",
      oppIntent:    "AMENAZA RIVAL",
      oppIntentVerbs: [
        "cargando",
        "preparando",
        "montando",
        "apuntando",
        "listo para"
      ],
      telegraphed:  "ANUNCIADA",
      absorbed:     "NEUTRALIZADA",
      handEmpty:    "Mano vacía — termina el turno para continuar.",
      energyLabel:  "ENERGÍA",
      skipMalus:    "Sin cartas jugadas — equipo en piloto automático (−4 TMP / −3 VIS).",
      fatigueNarrative: [
        "{name} empieza a arrastrar las piernas — la intensidad pasa factura.",
        "{name} pide un respiro — las rondas pesan en todos.",
        "El ritmo baja claramente — {name} busca el aire.",
        "{name} pierde el timing — el depósito está vacío."
      ],
      types: {
        setup:   "PREPARACIÓN",
        trigger: "DISPARO",
        combo:   "COMBO",
        defense: "DEFENSA",
        counter: "CONTRA",
        draw:    "ROBO"
      },
      drop_deep:       { name: "Retroceder",        desc: "+8 DEF / +4 VIS. Genera 1 Flow, 2 Press Resist.",
        flavor: [
          "{pm} baja al hueco — presión desactivada.",
          "El equipo retrocede — {opp} pierde el disparador.",
          "{pm} lee la línea, toca hacia atrás."
        ]
      },
      switch_lane:     { name: "Cambio de Banda",   desc: "+8 TMP / +4 OFF. Genera 1 Flow, abre un carril.",
        flavor: [
          "Cambio de orientación — nuevo ángulo se abre.",
          "{pm} encuentra la diagonal — {opp} llega tarde.",
          "Basculación rápida — hombre libre al otro lado."
        ]
      },
      quick_build:     { name: "Salida Rápida",     desc: "+10 VIS / +3 CMP esta ronda. Genera 1 Flow.",
        flavor: [
          "{pm} elige el triángulo rápido — limpio.",
          "Combinación corta por el centro.",
          "{pm} se zafa de la presión."
        ]
      },
      tight_shape:     { name: "Bloque Cerrado",    desc: "+14 DEF esta ronda. Escala 1.3× contra amenazas telegrafiadas.",
        flavor: [
          "Líneas compactas — sin espacios en el medio.",
          "{opp} obligado a irse a la banda.",
          "Bloque firme, presión tranquila."
        ]
      },
      hold_the_line:   { name: "Aguantar la Línea", desc: "Gratis. +8 DEF / +6 CMP, +8 a próxima parada. Escala 1.3× contra amenazas telegrafiadas.",
        flavor: [
          "{tw} organiza la línea — paciencia.",
          "{vt} dirige, nadie muerde el anzuelo.",
          "Equipo mantiene forma — once detrás del balón."
        ]
      },
      keeper_rush:     { name: "Portero Adelantado",desc: "+10 DEF, próxima parada +15. Escala 1.3× contra amenazas telegrafiadas.",
        flavor: [
          "{tw} se adelanta — barre el peligro.",
          "{tw} manda en el área, blanca atrapada.",
          "{tw} sale en un relámpago."
        ]
      },
      overlap_run:     { name: "Desmarque",         desc: "+15 OFF / +6 TMP, escala +4 OFF por cada Flow (tope +16). Carta de remate.",
        flavor: [
          "{lf} desborda — superioridad por la banda.",
          "{lf} pasa al lateral, carrera por la línea.",
          "{lf} llega al último tercio — y el pase."
        ]
      },
      forward_burst:   { name: "Arrancada",         desc: "+14 OFF / −4 CMP (+12 OFF con Lane Open, +6 OFF con táctica agresiva/tempo). Consume Lane Open.",
        flavor: [
          "{lf} y {st} rompen — dos contra dos.",
          "Contraataque lanzado — {st} está solo.",
          "{lf} acelera — zaga desorganizada."
        ]
      },
      ball_recovery:   { name: "Recuperación",      desc: "+6 DEF / +4 TMP. Amortigua el próximo rasgo rival.",
        flavor: [
          "{pm} se mete — intercepción limpia.",
          "{vt} lo lee — balón de nuevo a los pies de {pm}.",
          "La presión funciona — {opp} lo pierde."
        ]
      },
      hero_moment:     { name: "Momento Heroico",   desc: "+18 OFF / +6 CMP. Se vuelve +34 OFF con Flow ≥ 2 (consume 2 Flow).",
        flavorHit: [
          "{st} encuentra el momento — ¡portero sin opciones!",
          "{st} se zafa del marcador — disparo clavado.",
          "{st} clava el tempo — un toque, un disparo."
        ],
        flavorMiss: [
          "{st} intenta forzarlo — sin construcción.",
          "{st} coge la ocasión pero sin ritmo.",
          "{st} se saca el disparo pero nada cuaja."
        ]
      },
      wing_trap:       { name: "Trampa en Banda",   desc: "+12 DEF / +6 TMP. Cancela el próximo rasgo rival.",
        flavor: [
          "{lf} lo atrae a la banda — trampa cerrada.",
          "{vt} cierra el carril — jugador de {opp} atrapado.",
          "Doblaje en la línea — robo limpio."
        ]
      },
      masterclass:     { name: "Clase Magistral",   desc: "+40 OFF / +12 VIS con Flow ≥ 3. Si no, solo +10 OFF.",
        flavorHit: [
          "{pm} dirige toda la función — diez pases, una ocasión.",
          "{pm} domina el partido — {opp} persigue sombras.",
          "{pm} lo pinta — el equipo se mueve como uno."
        ],
        flavorMiss: [
          "{pm} intenta orquestar — las piezas no encajan.",
          "{pm} busca la combinación, no está ahí todavía."
        ]
      },
      stamina_boost:   { name: "Chute de Fondo",    desc: "+5 TMP / +5 CMP / +3 DEF durante 2 rondas. Genera Flow.",
        flavor: [
          "El equipo encuentra un segundo aire.",
          "Intensidad arriba por todo el campo.",
          "Banquillo manda: presionar más y más tiempo."
        ]
      },
      clinical_finish: { name: "Definición Letal",  desc: "+16 OFF (+16 más con carril abierto). Consume Lane Open.",
        flavorHit: [
          "{st} entra por el carril — definición fría.",
          "{st} mira, toca, y la mete.",
          "{lf} le pasa atrás — {st} la desvía a la red."
        ],
        flavorMiss: [
          "{st} saca el disparo — directo al portero.",
          "{st} lo intenta pronto — se le va fuera.",
          "{st} apura el remate, sin ángulo."
        ]
      },
      deep_focus:      { name: "Concentración",     desc: "+12 VIS / +6 CMP durante 2 rondas. Doble generador de Flow.",
        flavor: [
          "{pm} baja el ritmo — todos respiran.",
          "Tempo pausado a propósito — {pm} dicta.",
          "Equipo entra en ritmo de posesión."
        ]
      },

      // Cartas de acción (lógica reactiva — no solo cambios de stats)
      desperate_foul:  { name: "Falta Desesperada",  desc: "+12 DEF esta ronda. El VT recibe amarilla (−1 CMP permanente este partido).",
        flavor: [
          "{vt} lo derriba — la amarilla vale la pena.",
          "{vt} comete la falta táctica en el hueco.",
          "{vt} se sacrifica — amarilla asumida."
        ]
      },
      bait_counter:    { name: "Cebo al Contragolpe",desc: "+8 DEF / +4 TMP. Si el rival no marca la próxima ronda, +Flow 2.",
        flavor: [
          "Equipo los invita a subir — esperando el hueco.",
          "Bloque bajo — {opp} estirado, buscando el pase.",
          "Trampa tendida — un mal balón y es nuestro."
        ]
      },
      through_ball:    { name: "Pase en Profundidad",desc: "Descarta 1 carta al azar. Setup → +4 OFF / +4 TMP, +Flow 2, Lane Open, más una acción de pase filtrado. Trigger/Combo → −4 DEF. Defense/Counter → nada.",
        flavorHit: [
          "{pm} ve el desmarque — ¡pase filtrado!",
          "{pm} encuentra la grieta — {lf} está libre.",
          "{pm} habilita a {st} con un pase disfrazado."
        ],
        flavorMiss: [
          "{pm} la juega larga — zaga de {opp} despeja.",
          "{pm} la intenta a la primera — pasada.",
          "Balón se cuela — nadie en la carrera."
        ]
      },
      stone_cold:      { name: "A Sangre Fría",      desc: "Requiere Flow ≥ 2 Y Lane Open. Consume ambos. +30 OFF / +8 CMP — más un pase filtrado garantizado al ST.",
        flavorHit: [
          "¡{st} la cruza al portero — a sangre fría!",
          "{st} lo regatea — al fondo de la red.",
          "{st} toma un toque, mira, la pone abajo."
        ],
        flavorMiss: [
          "{st} apura el momento — nada que definir.",
          "{st} sin apoyos — ocasión se enfría.",
          "{st} lo fuerza — portero lo lee fácil."
        ]
      },

      // Cartas iniciales débiles intencionadamente — candidatas a retirar.
      grind_through:   { name: "Aguantar",           desc: "+4 DEF / +2 TMP. Fiable pero anodina.",
        flavor: [
          "Equipo se pelea cada balón — nada bonito.",
          "Fútbol funcional — uno por ciento a la vez.",
          "Pase seguro, movimiento seguro, ronda segura."
        ]
      },
      long_ball:       { name: "Pelotazo",           desc: "+5 OFF / −3 VIS. Esperanza y desperdicio.",
        flavor: [
          "{tw} la despeja larga — 50/50 en el mejor caso.",
          "Balón vuela al frente — nadie lo lee.",
          "Lanzamiento esperanzado al carril."
        ]
      },
      hope_shot:       { name: "Disparo a la Esperanza", desc: "20% de gol a la desesperada. Sin buff de stat — pura desesperación.",
        flavor: [
          "{st} la ve, dispara desde lejos — toque de fe.",
          "{lf} suelta desde 30 metros.",
          "Disparo especulativo — vale la pena probar."
        ]
      },

      // Tactic-synergy (v4)
      gegenpress: { name: "Gegenpress", desc: "+8 DEF / +6 TMP. Se duplica a +16/+12 si la táctica es agresiva, tempo o pressing. Escala 1.5× cuando vas por detrás en momentum.",
        flavorHit: [
          "El equipo dispara el contrapresión — ¡{opp} sin aire!",
          "Regla de seis segundos — {vt} la recupera al instante.",
          "La unidad entera caza — táctica y carta cantan a una voz."
        ],
        flavorMiss: [
          "{vt} cierra — presión normal.",
          "Equipo sube, mantiene forma.",
          "{pm} los dirige hacia fuera, paciente."
        ]
      },
      possession_lock: { name: "Candado de Posesión", desc: "+8 VIS / +4 CMP, +Flow 1. Con táctica de posesión: roba una carta extra.",
        flavorHit: [
          "{pm} marca el metrónomo — veinte pases sin presión.",
          "{opp} persiguiendo fantasmas — cada pase encuentra un pie.",
          "Equipo mantiene el balón en su mitad."
        ],
        flavorMiss: [
          "{pm} hace circular — ritmo cauto.",
          "Equipo recicla la posesión — nada forzado.",
          "Hacia los lados, paciente — {pm} busca el hueco."
        ]
      },
      killing_blow: { name: "Golpe de Gracia", desc: "+25 a +35 OFF (escala con la ventaja, tope con 5+ goles arriba) / +8 CMP. Inútil si vas empatando o perdiendo.",
        flavorHit: [
          "{st} siente que el partido está ahí — ¡clava el puñal!",
          "Los equipos que van delante no tiemblan — {pm} dirige el acto final.",
          "{st} cierra el partido — ¡definición a sangre fría!"
        ],
        flavorMiss: [
          "{st} busca el K.O. — el marcador no lo permite.",
          "El equipo intenta cerrar — pero no hay nada que cerrar.",
          "{pm} busca el pase letal — situación equivocada."
        ]
      },

      // Telegraph counters
      block: { name: "Bloquear", desc: "Contrarresta una amenaza anunciada por +28 DEF / +6 CMP. Sin anuncio: solo +8 DEF.",
        flavorHit: [
          "¡{vt} lo lee perfecto — peligro neutralizado antes de empezar!",
          "{pm} ve el patrón — entra en la línea de pase.",
          "{tw} ya se movía — la amenaza muere en frío."
        ],
        flavorMiss: [
          "{vt} aguanta su línea — defensa rutinaria.",
          "Equipo se mantiene compacto, nada que contrarrestar.",
          "{pm} baja a cubrir — por si acaso."
        ]
      },
      preempt: { name: "Anticipar", desc: "Anula la amenaza anunciada. Con cancel: +22 DEF / +12 TMP / +8 CMP / +10 OFF, +Flow 2, roba 1. Sin anuncio: +Flow 1, roba 1, sin buff de stat.",
        flavorHit: [
          "¡{pm} lee la jugada tres segundos antes — ROBAMOS el momento!",
          "{vt} intercepta el pase antes de que se juegue — {opp} paralizado.",
          "La trampa estaba lista — cayeron directamente."
        ],
        flavorMiss: [
          "{pm} se mantiene alerta — nada que anticipar.",
          "Equipo busca la lectura — aún sin pista clara.",
          "{vt} escanea los carriles — momento tranquilo."
        ]
      },

      // Tactic-specific synergy
      counter_strike: { name: "Contraataque", desc: "+28 OFF / +10 TMP / +Flow 1 con táctica de contra activa O auto-contra cargada. Si no: +10 OFF.",
        flavorHit: [
          "¡{lf} los castiga al contraataque — la táctica paga!",
          "Contra como un reloj — {st} solo ante el portero.",
          "De defensa a ataque en tres pases — manual del contragolpe."
        ],
        flavorMiss: [
          "{st} intenta la escapada — nadie sube a acompañarlo.",
          "Demasiado pronto, aún sin estructura de contra — disparo forzado.",
          "La transición se corta — {lf} aislado en el sprint."
        ]
      },
      high_press_trap: { name: "Trampa de Presión", desc: "+14 DEF / +6 TMP + Lane Open + cancela próximo rasgo rival con táctica de pressing. Si no: +8 DEF.",
        flavorHit: [
          "¡La trampa de presión se cierra — {opp} sin salida!",
          "Bloque alto los pilla — pérdida forzada en zona rival.",
          "{vt} dispara la presión — robo en su mitad de campo."
        ],
        flavorMiss: [
          "La trampa no se cierra — {opp} encuentra el pase suelto.",
          "El pressing pierde la forma — equipo corre en vacío.",
          "{opp} salta la presión con un pase largo — defensa expuesta."
        ]
      },
      possession_web: { name: "Red de Posesión", desc: "+14 VIS / +6 OFF / +6 DEF durante 2 rondas, +Flow 2 con táctica de posesión. Si no: +8 VIS / +4 CMP.",
        flavorHit: [
          "{pm} teje la red — {opp} no toca el balón.",
          "Dominio absoluto — veinte pases en su mitad de campo.",
          "Equipo controla todo — {opp} persiguiendo sombras."
        ],
        flavorMiss: [
          "La red no se cierra — {opp} corta el circuito con un despeje.",
          "Pases laterales sin ambición — {pm} no encuentra el hueco.",
          "La posesión se queda estéril — balón sin penetración."
        ]
      },
      flank_overload: { name: "Sobrecarga de Banda", desc: "+22 OFF / +10 TMP durante 2 rondas + Lane Open persistente con táctica de banda. Si no: +10 OFF / +4 TMP.",
        flavorHit: [
          "¡{lf} y lateral sobrecargan la banda — tres contra uno!",
          "Juego de banda funciona — {lf} llega dos veces al fondo.",
          "La sobrecarga los abre — el carril se rompe de par en par."
        ],
        flavorMiss: [
          "La banda se atasca — {lf} sin ángulo para centrar.",
          "Doblaje mal sincronizado — el lateral llega tarde al apoyo.",
          "{opp} cierra el carril — la sobrecarga se queda en el saque."
        ]
      },

      // Discard-synergy
      second_wind: { name: "Segundo Aire", desc: "+4 TMP / +2 CMP, +Flow 1. Escala: +2 TMP / +1 CMP por cada carta ya descartada (máx 5).",
        flavorHit: [
          "El equipo encuentra otra marcha — el banquillo lo ve venir.",
          "{pm} sube con el ritmo — piernas aún ahí, jugando largo.",
          "Se va el cansancio — la presión se ve fresca de repente."
        ],
        flavorMiss: [
          "Queda poco en el tanque — el segundo aire se hace esperar.",
          "Cuerpo dice sí, piernas dicen no — el ritmo baja igual.",
          "La ráfaga de energía no llega — {lf} se queda atrás."
        ]
      },
      dig_deep: { name: "Rascar", desc: "Descarta 1 carta al azar. +20 OFF / +4 TMP esta ronda. Nulo si no hay mano.",
        flavorHit: [
          "¡{st} rasca — pura voluntad encuentra la ocasión!",
          "{lf} abandona el plan, la lleva solo — y funciona.",
          "El equipo lo fuerza — alguien debía intentarlo y sale bien."
        ],
        flavorMiss: [
          "{st} rasca sin fortuna — el desgaste pasa factura.",
          "La improvisación no llega a buen puerto — pérdida forzada.",
          "Tirar y rezar — {lf} desperdicia la ocasión de la jornada."
        ]
      },
      tactical_pause: { name: "Pausa Táctica", desc: "Roba 2 cartas. +6 CMP / +4 VIS esta ronda. Cambia impacto por velocidad de cartas.",
        flavor: [
          "{pm} lo ralentiza — relee el partido.",
          "Reset rápido en la banda — nueva forma, nuevas opciones.",
          "El míster pide repensar — las cartas fluyen más rápido."
        ]
      },
      second_half: { name: "Segundo Tiempo", desc: "Baraja el descarte en el mazo, roba 3. +Flow 1, +6 CMP / +3 TMP. El botón de reset.",
        flavor: [
          "Silbato, agua, plan nuevo — el equipo sale renovado.",
          "El descanso funciona — {pm} marca el nuevo ritmo.",
          "Reset total — este es otro partido ahora."
        ]
      },

      // Condition cards
      breather: { name: "Respiro", desc: "El titular más cansado recupera +20 condición. Ligero apoyo defensivo.",
        flavorHit: [
          "{target} pide un momento — el equipo baja, recupera el aire.",
          "Pausa rápida de agua — {target} respira, las piernas vuelven.",
          "El míster pide posesión — {target} se reubica."
        ],
        flavor: [
          "El equipo baja un momento, recupera el aire.",
          "Pausa rápida de agua — las piernas vuelven.",
          "El míster pide posesión controlada."
        ]
      },
      rotation: { name: "Rotación", desc: "El titular más cansado se recupera a 90. +Tempo / +CMP durante 2 rondas.",
        flavorHit: [
          "Piernas frescas para {target} — revive, toda la unidad con él.",
          "El cambio de posición refresca a {target} — la energía fluye.",
          "Rotación inteligente libera a {target} — el ritmo vuelve a subir."
        ],
        flavor: [
          "Piernas frescas marcan la diferencia — la energía fluye.",
          "El equipo encuentra una rotación que funciona.",
          "El cambio de posiciones refresca toda la línea."
        ]
      },
      doping: { name: "Todo al Rojo", desc: "El delantero +30 condición. +10 OFF / +6 TMP esta ronda (+4 OFF con táctica agresiva/tempo). 15-30% de riesgo de backfire: −4 CMP el resto del partido. Backfire forzado al 3er uso.",
        flavorHit: [
          "¡{st} sube a otro nivel — energía pura inunda el ataque!",
          "{st} toca algo especial — imparable por un momento.",
          "El delantero va a por todas — está a tope."
        ],
        flavorMiss: [
          "{st} empuja demasiado — el árbitro saca la amarilla.",
          "{st} lo da todo — una entrada fea, una tarjeta.",
          "El empuje le cuesta — {st} pasa de raya y se lleva amarilla."
        ],
        flavorForced: [
          "{st} tira el último resto — el árbitro ya tuvo suficiente, amarilla directa.",
          "El cuerpo no aguanta un tercer empuje — {st} arrolla, tarjeta.",
          "Tercer Todo al Rojo — y {st} cruza la línea que todo árbitro ve."
        ]
      },

      burn_plan: { name: "Plan al Fuego", desc: "Exilia una carta aleatoria de tu mano (vuelve el próximo partido). +22 OFF / +10 TMP esta ronda.",
        flavorHit: [
          "El banquillo quema una opción — todos los ojos se afilan en el plan restante.",
          "Sacrificio en la pizarra — el equipo se compromete con lo que queda.",
          "Un plan al basurero, y de pronto el campo se ve más claro."
        ],
        flavorMiss: [
          "Nada que quemar — el plan ya era justo.",
          "Mano vacía, sin sacrificio — el esfuerzo se apaga.",
          "Plan al Fuego sin combustible — chispa sin fuego."
        ]
      },

      running_hot: { name: "En Racha", desc: "+4 OFF / +2 TMP base, más +3 OFF por victoria de racha actual (máx +15). Escala más con momentum y tácticas agresivas/tempo.",
        flavorHit: [
          "El equipo está en racha — la confianza los hace un metro más rápidos.",
          "Mentalidad ganadora se activa — todos se mueven con convicción.",
          "Energía de cinco victorias seguidas inunda el campo."
        ],
        flavorMiss: [
          "Piernas frías, cabezas frías — no hay racha que surfear.",
          "Sin victorias para aprovechar — el bonus queda en nada.",
          "En Racha necesita momentum — hoy sólo hay hielo."
        ]
      },

      second_wave: { name: "Segunda Ola", desc: "Roba 1 carta. Repite la última carta jugada al 60% de efecto.",
        flavorHit: [
          "La misma jugada un compás después — su defensa no se recupera.",
          "Repite el patrón — todavía caen en él.",
          "Una vez es una jugada. Dos veces es tendencia — no la paran."
        ],
        flavorMiss: [
          "Nada que ecoar — la ola choca con agua vacía.",
          "Sin jugada previa que repetir — sólo un robo fresco.",
          "Primera ola del partido — los ecos vendrán después."
        ]
      },

      tide_turner: { name: "Dar la Vuelta", desc: "Solo con momentum negativo. Resetea a +10, +18 OFF / +8 CMP, contragolpe.",
        flavorHit: [
          "Cambia la marea — y el equipo lo siente.",
          "Una oportunidad para voltearlo — {pm} la agarra.",
          "Grito de guerra — la defensa sube."
        ],
        flavorMiss: [
          "Muy pronto — no hay nada que voltear.",
          "El público aún nos apoya — guárdala.",
          "Momentum bien — no hace falta remontar."
        ]
      },

      ride_the_wave: { name: "Montar la Ola", desc: "Solo con momentum ≥ +40. +24 OFF / +10 TMP / +6 CMP y un centro al área.",
        flavorHit: [
          "Todo encaja — {lf} pone el centro en bandeja.",
          "La racha — {st} está volando.",
          "Imparables — el área es un caos."
        ],
        flavorMiss: [
          "No lo siento — la ola no se ha formado.",
          "No hay momentum suficiente — guárdala.",
          "Necesita forma — hoy no."
        ]
      },

      storm_warning: { name: "Aviso de Tormenta", desc: "+10 DEF / +4 CMP por 2 rondas. Siguiente gol encajado: pérdida de momentum a la mitad.",
        flavorHit: [
          "Posición de aguante — saben lo que viene.",
          "{vt} grita el aviso — la línea se cierra.",
          "Ven la tormenta, refuerzan atrás."
        ]
      },

      tactical_discipline: { name: "Disciplina Táctica", desc: "Coste 2 · ESCUDO. +4 DEF / +3 CMP hasta que se active. Bloquea por completo la siguiente carta rival.",
        flavor: [
          "Cabezas frías — no nos pillan fuera de sitio.",
          "{pm} pide disciplina — sin faltas tontas, sin picar anzuelos.",
          "Preparados mentalmente — conocemos su jugada."
        ]
      },

      counter_read: { name: "Lectura del Contra", desc: "Coste 2 · ESCUDO. +6 VIS / +3 CMP esta ronda. La siguiente carta rival surte medio efecto.",
        flavor: [
          "{pm} lee la jugada — vamos medio paso por delante.",
          "Contar sus triggers — entrar antes de que resuelvan.",
          "Su forma lo delata — reducir el daño."
        ]
      },

      regroup: { name: "Reagrupar", desc: "Coste 3 · ESCUDO. +10 DEF / +6 CMP / +4 TMP esta ronda. Elimina todas las adaptaciones y cartas rivales activas.",
        flavor: [
          "Resetear el plan — todo lo que montaron se disipa.",
          "Tiempo muerto en todo menos el nombre. Su ola rompe en el vacío.",
          "Vuelta a cero — base nueva, piernas nuevas."
        ]
      },

      intel_leak: { name: "Filtración", desc: "Coste 1 · ESCUDO. +5 VIS esta ronda. Revela la siguiente carta rival antes de que se juegue.",
        flavor: [
          "{pm} pilla la señal — lo vamos a ver venir.",
          "Pista del scout — su plan ya no es secreto.",
          "Leer la banda — la señal está clara."
        ]
      },

      // ── v52.2 Arquetipo draw ──
      quick_scout: { name: "Escaneo rápido", desc: "Roba 2 cartas. +5 VIS / +2 TMP esta ronda. Etiqueta flow.",
        flavor: [
          "{pm} levanta la vista — dos opciones nuevas en la cabeza.",
          "Escaneo breve, imagen clara — el siguiente movimiento sale solo.",
          "Un instante para mirar — {pm} relee los carriles."
        ]
      },

      study_opposition: { name: "Estudiar al rival", desc: "Roba 2 cartas. +8 VIS / +3 CMP. Cualquier intención rival queda marcada esta ronda, incluso las menores pueden bloquearse.",
        flavorHit: [
          "Patrón detectado — cada movimiento suyo es ahora telegrafiado.",
          "{pm} lee su construcción — nada les saldrá por sorpresa.",
          "Señal descifrada — sabemos lo que viene, aunque susurren."
        ]
      },

      endgame_plan: { name: "Plan final", desc: "Roba 3 cartas. Desde ronda 4: +Flow 1, +10 CMP / +6 VIS. Velocidad de cartas en la recta final.",
        flavorHit: [
          "{pm} sabe el reloj — cada jugada cuenta. Tres opciones nuevas.",
          "El briefing del vestuario surte efecto — el equipo sabe qué hacer.",
          "Hora de cerrar. {pm} saca el plan del bolsillo."
        ],
        flavorMiss: [
          "Demasiado pronto para el plan final — pero tres cartas frescas son tres cartas frescas.",
          "El playbook espera — por ahora, simplemente reabastecer la mano.",
          "Las jugadas grandes vienen después. Ahora: solo robar."
        ]
      },

      // ── v52.2 Relleno de inventario ──
      quick_screen: { name: "Pantalla rápida", desc: "+6 DEF / +3 TMP esta ronda. Press-resist +1.",
        flavor: [
          "Línea rápida, compacta — no encuentran hueco.",
          "{vt} desplaza pronto — su presión cae en el vacío.",
          "Línea arriba, balón fuera — simple y limpio."
        ]
      },

      triangle_play: { name: "Triángulo", desc: "+6 TMP / +4 VIS / +2 OFF. Genera 1 Flow Y abre un carril.",
        flavor: [
          "Corto-corto-largo — {pm} encuentra el paso por el centro.",
          "Tres hombres, tres toques — el carril se abre.",
          "{pm} y {lf} juegan libres — triángulo armado, espacio listo."
        ]
      },

      pressure_trap: { name: "Trampa de presión", desc: "Coste 1 · CONTRA. Ante amenaza rival telegrafiada: +14 DEF / +6 CMP / +4 TMP y +Flow 1; absorbe la amenaza. Si no, pequeño efecto base.",
        flavorHit: [
          "Se meten dentro — {vt} cierra la trampa, balón recuperado.",
          "Cebo tragado — trampa cerrada, la posesión es nuestra.",
          "El timing es perfecto — su ataque colapsa, giramos la jugada."
        ],
        flavorMiss: [
          "Trampa puesta — pero nadie muerde.",
          "Sin amenaza clara — la trampa queda vacía.",
          "Listos para reaccionar, pero no se mueven."
        ]
      },

      set_piece: { name: "Balón parado", desc: "Coste 1 · COMBO. Necesita Flow ≥ 2. Entonces +26 OFF / +4 CMP más disparo — sin necesidad de carril abierto.",
        flavorHit: [
          "Córner. Ensayado. {st} llega al primer palo — ¡disparo!",
          "Falta, variante corta — {pm} a {st}, ¡zapatazo completo!",
          "El balón parado sale — todos saben dónde, {st} remata."
        ],
        flavorMiss: [
          "Jugada lista — pero sin preparación, la rutina se apaga.",
          "Sin flow en el equipo — la variante del córner no lleva a nada.",
          "Ensayada pero sin armado — nada atraviesa."
        ]
      },

      deep_defense: { name: "Defensa profunda", desc: "+20 DEF / +4 CMP esta ronda. Press-resist +1.",
        flavor: [
          "Toda la línea atrás — el autobús delante de la portería.",
          "{vt} organiza la masa defensiva — no pueden pasar.",
          "Todos detrás del balón — 'ya tuvieron su turno'."
        ]
      },

      lone_striker: { name: "Delantero solitario", desc: "Coste 1 · COMBO. Si {st} tiene condición ≥ 70: +22 OFF / +6 CMP más disparo. {st} cansado: efecto base mínimo.",
        flavorHit: [
          "{st} va solo — y la empuja dentro.",
          "{st} quema la defensa — disparo, gol al alcance.",
          "{st} por su cuenta — a las piernas aún les queda."
        ],
        flavorMiss: [
          "{st} lo intenta — las piernas pesan demasiado para el solo.",
          "A {st} le falta pegada — el contragolpe se diluye.",
          "{st} no se escapa — demasiado cansado para hacerlo solo."
        ]
      },

      team_unity: { name: "Unidad del equipo", desc: "Coste 2. Cada titular bajo 60 de condición recibe +10. Hasta +12 CMP / +2 VIS escalando con jugadores levantados.",
        flavorHit: [
          "Círculo rápido en el centro — respiro, podemos con esto.",
          "{pm} los reúne — un último empuje concentrado.",
          "Miradas, puños juntos — el equipo despierta."
        ],
        flavorMiss: [
          "Unidad invocada — pero las piernas estaban bien de todas formas.",
          "Sin necesidad de reinicio — todos siguen enchufados.",
          "El discurso cae suave — nadie lo necesitaba."
        ]
      },

      final_whistle: { name: "Pitido final", desc: "Coste 1 · COMBO · RETAIN. Desde ronda 5 si no vamos por delante: +20 OFF / +10 TMP / +6 CMP, carril abierto, +Flow 1 más disparo. Si no, efecto base pequeño.",
        flavorHit: [
          "Última oportunidad — {st} la siente, TODO o nada.",
          "El reloj corre hacia cero — y el equipo sube. ¡El pitido está cerca!",
          "El ataque final — {pm} lanza a {st} al camino."
        ],
        flavorMiss: [
          "Demasiado pronto en el partido — guardamos el cierre para luego.",
          "Ventaja en la mano — no hay razón para la palanca.",
          "El pitido aún calla — la gran jugada espera."
        ]
      },

      last_stand: { name: "Última resistencia", desc: "Coste 1 · DEFENSA. Si vamos por detrás: +24 DEF / +10 CMP, el próximo gol encajado causa la mitad de caída de momentum. Si no, pequeño efecto base.",
        flavorHit: [
          "Espalda contra la pared — y el equipo tensa las líneas.",
          "{vt} arenga la cadena — por aquí no pasa nadie.",
          "La desventaja los despertó — defensa sin concesiones."
        ],
        flavorMiss: [
          "Sin desventaja, sin energía de última bala — defendemos tranquilos.",
          "Defensa sin drama — no es el momento.",
          "Vamos por delante — el freno de emergencia se queda guardado."
        ]
      },

      field_commander: { name: "Comandante de campo", desc: "Coste 2 · DISPARADOR. {pm} fresco (≥50 condición): +14 OFF / +10 TMP / +6 CMP / +6 VIS más +Flow 1. {pm} cansado: efecto mínimo.",
        flavorHit: [
          "{pm} toma el mando — todos saben a dónde van, el balón vuela.",
          "El capitán dirige — el equipo corre sobre raíles.",
          "{pm} se convierte en director — cuatro corridas arrancan a la vez."
        ],
        flavorMiss: [
          "{pm} intenta dirigir — pero el aire se ha ido.",
          "La voz es más baja — {pm} ya no puede marcar el tempo.",
          "Las órdenes llegan tarde — las piernas cansadas tragan la precisión."
        ]
      },

      break_the_line: { name: "Romper la Línea", desc: "Coste 2 · COMBO · Flow ≥ 2. Gasta Flow 2, abre Carril. +22 OFF, +8 TMP (+15 contra Lockdown o Big-Move). Tiro extra.",
        flavorHit: [
          "{st} encuentra el hueco en el muro — a través de la cadena.",
          "Un pase por el medio — {lf} corre sin oposición.",
          "El búnker se rompe — {pm} da el balón decisivo."
        ],
        flavorMiss: [
          "Poco flujo — la línea aguanta.",
          "Sin apertura — el plan se pierde."
        ]
      },
      medic: { name: "Médico", desc: "Coste 1 · DEFENSA. Recupera 25 de condición (prioriza a la víctima). +4 CMP / +3 DEF.",
        flavor: [
          "Spray rápido, de vuelta en pie — {name} sigue.",
          "El fisio corre a ayudar — {name} se levanta.",
          "Tratamiento veloz — {name} continúa."
        ]
      },
      poker_face: { name: "Cara de Póker", desc: "Coste 1 · DEFENSA. La próxima carta es inmune a la disrupción. Cancela Presión Falsa / Estudio de Cinta. +8 CMP / +4 VIS.",
        flavor: [
          "{pm} no muestra nada — ni una pista.",
          "Mirada impenetrable — no la pueden leer.",
          "El equipo no revela nada — el plan queda oculto."
        ]
      },
      read_the_game: { name: "Leer el Juego", desc: "Coste 1 · DRAW. Revela el próximo movimiento rival. Roba 1, +1 Flow, +10 VIS / +3 CMP.",
        flavor: [
          "{pm} lee el ritmo — sabe lo que viene.",
          "Dos segundos por delante — {pm} ha descifrado el plan.",
          "Las señales son claras — el rival es transparente."
        ]
      },
      late_winner: { name: "Gol Tardío", desc: "Coste 2 · COMBO. Ronda 5+: +28 OFF, +10 CMP, +6 TMP, ignora buffs defensivos rivales. Tiro extra. Pronto: sólo +5 CMP.",
        flavorHit: [
          "Minutos finales — {st} encuentra el momento.",
          "Cuando importa, {st} está ahí — héroe tardío.",
          "El reloj corre, {st} dispara — timing perfecto."
        ],
        flavorMiss: [
          "Demasiado pronto — la carta necesita el final.",
          "El timing no llega — el efecto se pierde."
        ]
      },
      clutch_defense: { name: "Defensa Clutch", desc: "Coste 2 · DEFENSA. Bloqueo GARANTIZADO de un big-move anunciado. +30 DEF / +12 CMP. Sin big-move: +12 DEF y absorbe el próximo tiro.",
        flavorHit: [
          "{tw} lee el big-move — parado en seco.",
          "La cadena aguanta — su jugada estrella se esfuma.",
          "{vt} se tira de cabeza — en el momento decisivo."
        ],
        flavorMiss: [
          "Sin amenaza grande a la vista — mantener forma.",
          "Medida de seguridad — por si acaso."
        ]
      },
      counterpunch: { name: "Contragolpe al Contra", desc: "Coste 1 · COUNTER. Contra Counter-Blitz anunciado: +18 OFF, +8 TMP, +6 DEF, dispara contra. Sin: +6 OFF / +4 TMP.",
        flavorHit: [
          "{lf} da la vuelta a la tortilla — en su área.",
          "Su contra se vuelve nuestra — {st} corre.",
          "La recuperación enciende — contracontra con potencia."
        ],
        flavorMiss: [
          "Sin contra a la vista — pequeña cobertura.",
          "Nada que voltear — simple subida de ritmo."
        ]
      },
      scout_report: { name: "Informe de Scout", desc: "Coste 2 · DRAW. Revela los próximos 2 movimientos rivales. Roba 2, +2 Flow, +14 VIS / +4 CMP.",
        flavor: [
          "{pm} ha visto el vídeo — lo sabe todo.",
          "Dos jugadas por delante — el equipo tiene el ritmo.",
          "El plan rival queda expuesto — los barremos."
        ]
      }
    },

    oppMove: {
      overload_flank: { name: "Sobrecarga de Banda", telegraph: "Cargan la banda — el próximo tiro pega más fuerte." },
      quick_strike: { name: "Disparo Rápido", telegraph: "Tiro instantáneo al inicio — sin aviso." },
      long_ball: { name: "Balón Largo", telegraph: "Todo al delantero — pase arriesgado, ofensiva fuerte." },
      pressing_surge: { name: "Oleada de Presión", telegraph: "Salen arriba — las salidas se complicarán." },
      counter_blitz: { name: "Contra Blitz", telegraph: "Tras parada: cambian al instante." },
      rage_offensive: { name: "Ofensiva de Rabia", telegraph: "Todo adelante — ataque extra." },
      park_the_bus: { name: "Aparcar el Autobús", telegraph: "Cadena completa atrás — difícil pasar." },
      bunker: { name: "Búnker", telegraph: "El portero se concentra — paradas más seguras." },
      low_block: { name: "Bloque Bajo", telegraph: "Llenan el área — los combos se apagan." },
      mental_wall: { name: "Muro Mental", telegraph: "Juegan con los nervios — el temple cae." },
      tactical_foul: { name: "Falta Táctica", telegraph: "El delantero cae — se pierde condición." },
      fake_press: { name: "Presión Falsa", telegraph: "Presión fingida — tu próxima carta se debilita." },
      time_waste: { name: "Pérdida de Tiempo", telegraph: "Retrasan el juego — robas menos cartas." },
      dirty_tackle: { name: "Entrada Dura", telegraph: "Brutal — un titular pierde condición grave." },
      study_tape: { name: "Estudio de Cinta", telegraph: "Te analizan — dos rondas de juego transparente." },
      training_focus: { name: "Foco de Entrenamiento", telegraph: "Ajustan una estadística permanente para este partido." },
      captain_speech: { name: "Charla del Capitán", telegraph: "Empujón motivacional — temple durante tres rondas." },
      signature_play: { name: "Jugada Estrella", telegraph: "Su ensayo asesino — ¡gol GARANTIZADO si no se bloquea!" },
      desperation_push: { name: "Empujón Desesperado", telegraph: "Todos adelante — ¡tres ataques esta ronda!" },
      tiki_taka_press: { name: "Presión Tiki-Taka", telegraph: "Dominio de balón — ¡tres rondas de ofensiva aumentada!" }
    },

    oppArchetype: {
      catenaccio: "{opp} juega CATENACCIO — defensivo, paciente, mortal al contraataque.",
      gegenpressing: "{opp} juega GEGENPRESSING — presión alta, desgastante.",
      tiki_taka: "{opp} juega TIKI-TAKA — posesión, martillo tardío.",
      direct_play: "{opp} juega JUEGO DIRECTO — agresivo, de alto riesgo.",
      chaos: "{opp} juega CAOS — impredecible."
    },

    // Marcos de situación en línea — reemplazan eventos modales cuando hay cartas.
    frames: {
      strikerFrustrated: {
        title:  "DELANTERO FRUSTRADO",
        text:   "{name} ha fallado {n} ocasiones y está al rojo vivo.",
        effect: "−6 OFF esta ronda",
        hint:   "Juega un Setup sobre él — Salida Rápida o Retroceder lo sacude."
      },
      keeperInZone: {
        title:  "RACHA DEL PORTERO",
        text:   "{name} ha parado {n} disparos seguidos — imbatible ahora mismo.",
        effect: "Defensa +10 · próxima parada +12",
        hint:   "Aprovecha con una carta de ataque."
      },
      hotCorridor: {
        title:  "CARRIL ABIERTO",
        text:   "{name} tiene la banda para él solo.",
        effect: "Lane Open · +5 TMP · +4 OFF",
        hint:   "Arrancada o Definición Letal sacan tajada."
      },
      oppStarDown: {
        title:  "ESTÁN TOCADOS",
        text:   "{opp} ha perdido el ritmo.",
        effect: "+8 OFF · +6 TMP · próximo rasgo rival amortiguado",
        hint:   "Insiste. Una carta Combo cierra el partido."
      },
      redCardRisk: {
        title:  "AL BORDE",
        text:   "{name} está a una entrada mala de la roja.",
        effect: "−4 CMP · jugar agresivo arriesga expulsión",
        hint:   "Las defensas son seguras. Presionar es una apuesta."
      },
      oppKeeperShaky: {
        title:  "SU PORTERO ESTÁ BATIDO",
        text:   "El portero de {opp} ha perdido la orientación.",
        effect: "+10 OFF · su próxima parada amortiguada",
        hint:   "Acábalo con cualquier carta de definición — lee mal las carreras."
      },
      oppDefenseStretched: {
        title:  "SU FORMA SE QUIEBRA",
        text:   "{opp} persigue — se abren huecos.",
        effect: "+8 OFF · +6 VIS · su próxima salida más difícil",
        hint:   "Combo por el centro — nadie cubre."
      },
      conditionCritical: {
        title:  "FATIGA CRÍTICA",
        text:   "{name} corre con la reserva — piernas fuera, timing roto.",
        effect: "−2 CMP en todo el equipo · penalizaciones acumulándose",
        hint:   "Respiro o Rotación YA, o acepta el colapso."
      }
    },

    cardDraft: {
      addTitle:      "AÑADIR UNA CARTA",
      addSubtitle:   "Elige una para tu mazo. Tu build se afina.",
      removeTitle:   "AFINAR MAZO",
      removeSubtitle:"Elige una carta para retirar permanentemente. Menos mazo = más consistencia.",
      bossTitle:     "RECOMPENSA DE JEFE",
      bossSubtitle:  "Derribaste a un jefe. Coge dos cartas para afilar tu mazo.",
      replaceStep1Title:    "REEMPLAZAR — PASO 1/2",
      replaceStep1Subtitle: "Elige una carta para eliminar. Su reemplazo vendrá después.",
      replaceStep2Title:    "REEMPLAZAR — PASO 2/2",
      replaceStep2Subtitle: "Elige el reemplazo de la carta eliminada.",
      upgradeTitle:         "MEJORAR",
      upgradeSubtitle:      "Elige una carta para mejorar — efecto permanente +25%.",
      actionAdd:     "+ AÑADIR",
      actionRemove:  "− RETIRAR",
      actionUpgrade: "↑ MEJORAR",
      skipAdd:       "Saltar",
      skipRemove:    "Mantener todas",
      skipUpgrade:   "Saltar mejora"
    },
    decisions: {
      // Focus-Keys entfernt — Focus-System deprecated.
      subTitle: 'Sustitución',
      subSubtitle: 'Saca a alguien del banquillo.',
      subOption: 'Meter a {name} ({role}) — sale: {out}',
      subDone: '{incoming} por {outgoing}.',
      subLegendary: 'Leyenda entrando — impacto amplificado.',
      subRoleMismatch: 'Rol desajustado — {role} jugando fuera de posición. -8 Defensa esta ronda.',
      noSub: 'Sin Sustitución',
      noSubDesc: 'Mantener la alineación actual.'
    },
    optionBadges: {
      fitsSquad: 'ENCAJA',
      risky:    'ARRIESGADO',
      synergy:  'SINERGIA ×{mult}',
      conflict: 'CONFLICTO ×{mult}',
      synergyShort:  'SINERGIA',
      conflictShort: 'CONFLICTO',
      fitsSquadTooltip: 'Esta táctica encaja con tu plantilla — efecto pleno.',
      riskyTooltip:     'Esta táctica no encaja con tu plantilla — efecto reducido.',
      synergyTooltip:   'Sinergia con tus decisiones previas del partido — amplificado.',
      conflictTooltip:  'Entra en conflicto con decisiones previas — efecto reducido.'
    },
    optionHints: {
      scalesDeficit: '↑ crece con tu desventaja',
      scalesLead:    '↑ crece con tu ventaja'
    },
    gameover: { title: 'GAME OVER' },
    victory: {
      survived: '{n} partidos superados',
      promotion: 'Ascenso · temporada completa',
      relegation: 'Descenso · temporada terminada',
      champion: 'Campeón de liga · temporada completa',
      cupChampion: 'Copa ganada — partida completa',
      cupRunnerUp: 'Eliminado en la copa — partida termina',
      stats: 'ESTADÍSTICAS',
      squad: 'PLANTILLA'
    },
    transition: {
      welcomeTo: 'BIENVENIDO A',
      dropTo: 'DESCENSO A',
      cupTitle: '¡LA COPA!',
      cupSub: '3 RIVALES ENTRE TÚ Y EL TROFEO',
      cupNarration: 'Has dominado la Liga Pro. Ahora: eliminatoria. Tres bosses, dificultad creciente. Pierdes una ronda y tu partida termina.',
      promoSub: 'NUEVA TEMPORADA · RIVALES MÁS DUROS',
      promoNarration: 'Estás en una liga superior. Los rivales son más fuertes, los bosses más difíciles. Tu plantilla continúa — adapta tu táctica.',
      dropSub: 'REINICIO · LIGA INFERIOR',
      dropNarration: 'La última temporada fue mala. Reinicias en una liga inferior. Aprovecha la oportunidad.',
      staySub: 'MISMA LIGA · NUEVA TEMPORADA',
      stayNarration: 'Te quedas en la liga. Rivales diferentes, mismo desafío — ¿esta vez quizás más arriba?',
      companionPromo: 'ASCENDIDO CONTIGO:',
      companionDrop: 'DESCENDIDO CONTIGO:',
      continue: 'CONTINUAR'
    },
    oppCards: {
      tacticalFoul: [
        '{opp} nos derriban cínicamente al contraataque — falta, nuestro impulso desaparece.',
        'Dos amarillas en un minuto — {opp} cambian gustosos faltas por nuestro ritmo.',
        'Los defensas de {opp} van directos al tobillo. Cínico, efectivo, feo.'
      ],
      parkTheBus: [
        '{opp} bajan a ambos extremos a la línea defensiva — once detrás del balón.',
        'Búnker defensivo de diez hombres por {opp}. Nos estrellamos contra un muro.',
        '{opp} han renunciado al ataque — modo control de daños puro.'
      ],
      equaliserPush: [
        'El portero de {opp} corre adelante en el córner — momento desesperado.',
        '{opp} meten tres delanteros. Huelen sangre y no les importa atrás.',
        '{opp} en caos total — extremos como delanteros, laterales como extremos, todo o nada.'
      ],
      timeWasting: [
        'El portero de {opp} tarda 90 segundos en cada saque. El tiempo se escapa.',
        '{opp} estiran cada saque, cada falta. El reloj es su amigo.',
        'Simulaciones, lesiones falsas, reanudaciones lentas — {opp} consumen el tiempo.'
      ],
      pressOverload: [
        '{opp} nos asfixian en nuestra mitad — tres hombres al balón cada vez.',
        'Presión sofocante de {opp} — nuestros defensas ni pueden levantar la cabeza.',
        '{opp} entran a contrapresión total desde el saque inicial. Ni un segundo para pensar.'
      ],
      setPiece: [
        '{opp} sacan una falta peligrosa al borde del área. Barrera arriba.',
        'Córner para {opp}, cuerpos grandes entrando — tenemos que despejar el primer balón.',
        'La jugada ensayada de {opp} tiene pinta de haberse entrenado. Esto va a ser ajustado.'
      ],
      chainCounter: [
        '{opp} leen la pérdida, tres pases rápidos y ya están en nuestra área.',
        'Contra relámpago de {opp} — nuestra forma estaba completamente rota.',
        '{opp} encadenan seis pases tras el robo — clínico y rápido.'
      ],
      desperateRally: [
        '{opp} lanzan todo adelante — el portero ya está pasada la línea de medio campo.',
        'Caos total de {opp} — no tienen nada que perder y así juegan.',
        '{opp} meten cuatro hombres en nuestra área cada ataque — sin estructura.'
      ]
    },
    oppCardNames: {
      tacticalFoul:   'Falta táctica',
      parkTheBus:     'Defensa cerrada',
      equaliserPush:  'Empate a toda costa',
      timeWasting:    'Pérdida de tiempo',
      pressOverload:  'Presión intensa',
      setPiece:       'Balón parado',
      chainCounter:   'Contra encadenada',
      desperateRally: 'Ataque desesperado'
    },
    nextUp: {
      title: 'SIGUIENTE',
      legendaryRecruit: 'Oferta de fichaje legendario',
      cardDraftAdd: 'Elige una carta nueva para tu mazo',
      cardDraftRemove: 'Retira una carta de tu mazo',
      cardDraftReplace: 'Reemplazar carta — cambia una por otra',
      cardDraftDoubleAdd: 'Recompensa de jefe — elige DOS cartas',
      cardDraftUpgrade: 'Mejorar carta — efecto +25%',
      roleEvolution: 'Evolución de rol — especializa un titular',
      nextMatch: 'Próximo partido'
    },
    league: {
      title: 'TABLA DE LA LIGA',
      team: 'Equipo',
      teams: 'equipos',
      season: 'Temporada {n}',
      seasonComplete: 'Temporada Completada',
      position: 'Puesto {pos} de {total}',
      nextOpponent: 'Siguiente: {name}',
      rivalry: 'Duelo de rivales — ya nos conocemos'
    },
    codex: {
      title: 'CÓDICE',
      back: '← Volver',
      tabs: {
        achievements: 'LOGROS',
        cards:        'CARTO-DEX',
        legendaries:  'LEYENDAS'
      },
      progressAchievements: '{got} / {total} desbloqueados',
      progressCards:        '{got} / {total} descubiertas',
      progressLegendaries:  '{count} reclutados',
      locked:       '??? — aún no desbloqueado',
      cardLocked:   'Aún no vista — draftéala o juégala para descubrirla.',
      emptyLegendaries: 'Aún sin leyendas. Vence a un jefe y recluta uno para empezar la colección.',
      rarity: {
        common:   'COMMON',
        uncommon: 'UNCOMMON',
        rare:     'RARE'
      }
    },
    rivalry: {
      banner: 'RIVALIDAD',
      narration: {
        revenge: [
          '{opp} nos destrozó la última vez ({lastOpp}-{lastMe}). Esta noche respondemos.',
          '{lastOpp}-{lastMe} en la última. {opp} no nos debe nada — nosotros a nosotros mismos, sí.',
          'Nos ganaron antes. Este campo se acuerda.'
        ],
        dominant: [
          'Última vez: {lastMe}-{lastOpp}. {opp} viene con las uñas fuera.',
          'Les rompimos {lastMe}-{lastOpp} en el primer cruce. Espera enfado.',
          '{opp} no ha olvidado ese resultado. Esta noche más afilados.'
        ],
        grudge: [
          '{meetings} partidos, ni un cuartel. Partido con rencor.',
          '{opp} — simplemente no nos caemos bien. Cada balón, un combate.',
          'La rivalidad vive al margen de cada encuentro reciente.'
        ],
        blood: [
          'Mala sangre. {humiliations} palizas en {meetings} cruces — esto no es amistoso.',
          '{opp} no olvidará. Nosotros tampoco. Rencor puro.',
          'Sangre en el campo cada vez. Esta noche, igual.'
        ],
        neutral: [
          'Segundo encuentro con {opp}. Vuelta.',
          'Revancha. Misma cancha, forma distinta.'
        ]
      }
    },
    achievements: {
      hatTrickRunner: { title: 'Hat-Trick',          desc: '{name} marcó 3 en un partido' },
      runScorer10:    { title: 'Dos Dígitos',        desc: '{name} llega a 10 goles en el run' },
      runScorer20:    { title: 'Goleador Serial',    desc: '{name} llega a 20 goles en el run' },
      triggers50:     { title: 'Motor de Sinergia',  desc: '50 disparos de rasgo en el run' },
      triggers150:    { title: 'Cadena Imparable',   desc: '150 disparos de rasgo en el run' },
      win3:           { title: 'Racha Caliente',     desc: '3 victorias seguidas' },
      win5:           { title: 'Dinastía',           desc: '5 victorias seguidas' },
      bossDown:       { title: 'Caza-Gigantes',      desc: 'Derrotaste a un jefe' },
      cleanSheet:     { title: 'Portería a Cero',    desc: 'Victoria sin encajar' },
      comeback:       { title: 'Reyes del Remonte',  desc: 'Ganaste tras ir perdiendo al descanso' },
      cupChampion:    { title: 'Campeón de Copa',    desc: 'Ganaste la final de la copa' },
      cupRunnerUp:    { title: 'Finalista',          desc: 'Llegaste a la final' },
      cupShutout:     { title: 'Muralla de Copa',    desc: 'Venciste a un jefe de copa sin encajar' },
      cupUpset:       { title: 'Sorpresa en Copa',   desc: 'Ganaste con menos potencia' },
      firstPromotion: { title: 'Ascensión',          desc: 'Primer ascenso desde Amateur' },
      proSurvivor:    { title: 'Superviviente Pro',  desc: 'Temporada Pro sin descender' },
      seasonChampion: { title: 'Campeón de Liga',    desc: 'Ganaste la Liga Pro' },
      dominantSeason: { title: 'Dominio',            desc: '12+ victorias en una temporada' },
      grudgeSlayer:   { title: 'Verdugo',            desc: 'Venciste a un rival con rencor ≥ 3' },
      bloodRivalWin:  { title: 'Rival de Sangre',    desc: 'Ganaste un duelo a sangre' },
      nemesis:        { title: 'Némesis',            desc: 'Venciste al mismo equipo 3× seguidas' },
      perfectDeck:    { title: 'Dibujante Perfecto', desc: 'Usaste cada draft de la temporada' },
      shieldMaster:   { title: 'Maestro Escudo',     desc: 'Bloqueaste 5 cartas rivales' },
      comebackCup:    { title: 'Remontada Copera',   desc: 'Remontaste un partido de copa tras ir abajo en R3' }
    },
    cup: {
      title: 'COPA',
      quarter: 'CUARTOS',
      semi: 'SEMI',
      final: 'FINAL',
      eliminated: 'FUERA',
      champion: 'CAMPEÓN DE COPA'
    },
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
      highscore: '✦ MEJOR: {runScore} PTS · {wins}V-{draws}E-{losses}D · {outcome} ✦',
      outcomeChampion: 'Campeón',
      outcomeSurvivor: 'Permanencia',
      outcomeFired: 'Despedido',
      outcomeCupChampion: '🏆 Campeón de Copa',
      outcomeCupRunnerUp: 'Subcampeón de Copa',
      outcomePromotion: 'Ascendido',
      outcomeRelegation: 'Descendido',
      outcomeSafe: 'Salvado',
      seasons: 'temporadas',
      seasonLabel: 'T{n}',
      cupModeLabel: 'COPA',
      tier: {
        amateur: 'AMATEUR',
        pro: 'PRO'
      },
      compactTeamMeta: '{lineup} + {bench}B',
      matchLabel: 'Partido {num}: {me}:{opp} vs {name}',
      bossTell: 'Combate contra jefe — todas las estadísticas elevadas, sin margen de error',
      academy: 'CANTERA'
    },
    statsPanel: {
      title: 'Estadísticas',
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
      buffsFootnote: 'Los buffs se acumulan entre inicio, descanso y fase final',
      onTarget: 'A Puerta',
      phaseRelevantStats: 'Stats Relevantes de Fase',
      whatMattersNow: 'Qué Importa Ahora',
      liveFootnote: 'Valores en vivo incluyen forma, rachas, foco y efectos de ronda activos.'
    },
    eventActors: {
      format: '{owner} {role} {name}',
      owners: {
        my:  'vuestro',
        opp: 'su'
      },
      roles: {
        TW:     'portero',
        VT:     'defensor',
        PM:     'creador',
        ST:     'delantero',
        LF:     'extremo',
        player: 'jugador'
      }
    },
    streaks: {
      zone:       'En la zona',
      cold:       'Racha fría',
      frustrated: 'Frustrado'
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
      refereeStern: 'El árbitro pita rápido hoy — cada duelo es un riesgo.',
      freierMann: '{name} está rompiendo — hay un corredor suelto.',
      hitzigerMoment: 'Los ánimos están caldeados tras el último gol.',
      keeperSaves: '{name} ha encadenado {n} paradas — totalmente enchufado.',
      legendaryDemand: '{name} mira desde el banquillo, ansioso por entrar.',
      momentumShift: '{n} goles encajados seguidos — el partido se escapa.',
      oppPmDirigent: 'Su creador {name} está orquestando — {n} salidas limpias en fila.',
      taktikwechsel: '{opp} no encuentra el ritmo — cambiarán de forma enseguida.'
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
    evolutions: {
      title: 'EVOLUCIÓN DE ROL',
      subtitle: '{name} ({role}) ha corrido los kilómetros. Elige una especialización.',
      actionChoose: '↑ EVOLUCIONAR',
      skip: 'Saltar — mantener generalista',
      poacher: {
        name: 'DEPREDADOR',
        desc: 'Vive en el área. Todo instinto, todo remate. Olvida el juego asociativo.'
      },
      false9: {
        name: 'FALSO 9',
        desc: 'Baja profundo, teje el juego. Un delantero que odia marcar solo.'
      },
      invertedWinger: {
        name: 'EXTREMO INVERTIDO',
        desc: 'Encara hacia dentro con su pierna buena. Siempre el tiro, casi nunca el centro.'
      },
      traditionalWinger: {
        name: 'EXTREMO CLÁSICO',
        desc: 'Se mantiene pegado a la banda, quema la línea, centra. A la vieja usanza, mortal.'
      },
      regista: {
        name: 'REGISTA',
        desc: 'Organizador retrasado. Lee dos pases por delante, juega uno.'
      },
      boxToBox: {
        name: 'BOX-TO-BOX',
        desc: 'De un área a la otra. Motor del mediocampo.'
      },
      ballPlayingDefender: {
        name: 'CENTRAL CON SALIDA',
        desc: 'Construye desde atrás. Sube, rompe líneas, confía en la forma.'
      },
      stopper: {
        name: 'ZAGUERO DURO',
        desc: 'Sin rodeos. Entra al delantero, gana el primer balón, sin excepciones.'
      },
      sweeperKeeper: {
        name: 'PORTERO-LÍBERO',
        desc: 'Línea alta, reclama todo fuera del área. Juega como un líbero.'
      },
      shotStopper: {
        name: 'ATAJA-PENALES',
        desc: 'Vive en la línea. Si va al arco, él llega primero.'
      }
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
      promotion: '¡ASCENSO!',
      relegation: 'DESCENSO',
      seasonComplete: 'TEMPORADA COMPLETA',
      continueTo: 'CONTINUAR A',
      dropTo: 'DESCENDER A',
      defendTitle: 'DEFENDER TÍTULO',
      nextSeason: 'PRÓXIMA TEMPORADA',
      enterCup: 'A LA COPA',
      cupChampion: '¡CAMPEÓN DE COPA!',
      cupRunnerUp: 'SUBCAMPEÓN DE COPA',
      points: '{points} PUNTOS',
      record: '✦ NUEVO RÉCORD ✦',
      bestScore: 'Mejor marca: {points} pts ({team})',
      afterMatches: '{points} puntos tras {matches} partidos',
      bestRun: '✦ Nueva mejor campaña ✦',
      eventTitle: 'SITUACIÓN',
      eventSubtitle: 'Algo está pasando en el campo.'
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
      halftimeRecovery: 'Descanso en vestuario — {count} jugador(es) vuelve(n) a 80 condición.',
      cardCancelOppTrait: '✦ Efecto de carta neutraliza su rasgo cargado.',
      cardDampenOppTrait: '✦ Efecto de carta debilita su rasgo cargado.',
      // v52.7 — el rival reacciona tras nuestra racha de 2 goles
      oppWakeUp: '⚠ {opp} reorganiza la defensa — te tienen fichado.',
      momentumZone: {
        rush:      '  El equipo está desatado — todo sale bien.',
        leading:   '  Ahora dominamos el partido.',
        neutral:   '',
        pressured: '  Bajo presión — a aguantar atrás.',
        desperate: '  Contra las cuerdas — al ataque final.'
      },
      momentumFumble: '  💥 ¡Exceso de confianza! El equipo pierde el hilo.',
      finalChoice: '  → Fase final: {name}',
      // v52.2 — feedback silencioso de tácticas (drain / sin efecto)
      tacticDrain:           '  ⚡ Coste táctico: {parts}',
      tacticConditionMiss:   '  ⚠ {name}: condición no cumplida — sin efecto en esta fase.',
      tacticNoEffect:        '  ⚠ {name}: sin efecto aplicado.',
      possessionPressure: '  Posesión: {pct}% — fase de presión',
      possessionDominated: '  Posesión: {pct}% — domina el rival',
      chainAttack: '  ⚡ ¡Ataque en cadena!',
      luckyDouble: '  🍀 {name} tiene suerte — ¡doble ataque!',
      counter: '  🔁 ¡Contraataque!',
      activeBuffs: '  📊 Buffs activos: {buffs}',
      oppMood: {
        cruising: [
          '{opp} baja una marcha — comienzan a caminar.',
          '{opp} afloja el acelerador — la ventaja les hace cómodos.',
          '{opp} parece satisfecho — menos sprints, más pases laterales.'
        ],
        bottling: [
          '{opp} se tensa — nervios visibles en las caras.',
          '{opp} defiende profundo ahora — sienten que volvemos.',
          '{opp} juega como queriendo aguantar — miedo en la forma.'
        ],
        rattled: [
          '{opp} se mete en su caparazón — parando la hemorragia.',
          '{opp} se vuelve conservador — cada toque hacia atrás.',
          '{opp} estaciona el autobús — han dejado de intentar jugar.'
        ],
        desperate: [
          '{opp} manda a todos al ataque — a todo o nada.',
          '{opp} juega kamikaze — la línea defensiva abandonó el barco.',
          '{opp} presiona todo — frenéticos, peligrosos, abiertos.'
        ]
      },
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
      extratimeIntro: '⏱ PRÓRROGA — {me}:{opp} tras 90 minutos. ¿Quién aguanta?',
      extratimeHalf: '🕐 PRÓRROGA · {n}ª PARTE',
      extratimeGoalMe: '⚽ ¡{name} golpea en la prórroga! {me}:{opp}',
      extratimeGoalOpp: '😱 {scorer} marca para {opp} — {me}:{oppScore}',
      extratimeNoGoalMe: '  Ocasión en la prórroga — por encima.',
      extratimeNoGoalOpp: '  {opp} la manda arriba — suerte para nosotros.',
      extratimeEnd: '⏱ FIN DE LA PRÓRROGA — {me}:{opp}',
      extratimeStillTied: '  Sigue el empate. Deciden los penaltis.',
      shieldBlocked:  '{shield} — {oppCard} absorbida, la jugada muere en seco.',
      shieldHalved:   '{shield} — leyendo el armado. {oppCard} llega con medio efecto.',
      shieldRevealed: '👁 Filtración — {oppCard} cargando. Lo vamos a ver venir.',
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
      eventCoachInstinct: '  🎯 Decisión de instinto — enfoque equilibrado.',

      // ─── Match-Intro / Form-Status / Contexto de kickoff ─────────────────
      matchIntro: [
        '{me} se enfrenta a {opp}.',
        'Saque inicial: {me} contra {opp}.',
        '{me} vs {opp} — el árbitro da la señal.',
        'Ambos listos. {me} vs {opp}.'
      ],
      formHot: [
        '🔥 El equipo vuela — afilado y con hambre.',
        '🔥 Racha caliente — confianza por las nubes.',
        '🔥 En forma. Hoy toca fútbol limpio.'
      ],
      formCrisis: [
        '❄ Confianza tambaleante. Necesitan un resultado urgente.',
        '❄ Piernas y cabezas pesadas. Será una batalla.',
        '❄ Tres malas actuaciones. Algo tiene que cambiar hoy.'
      ],
      opponentIntro: '  ↳ {parts}',
      kickoffChoice: '  → {name}',
      halftimeHeader: '––– DESCANSO –––',
      halftimeChoice: '  → {name}',
      halftimeRecovery: 'Descanso en vestuario — {count} jugador(es) vuelven a 80 de condición.',
      cardCancelOppTrait: '✦ Efecto de carta anula su rasgo cargado.',
      cardDampenOppTrait: '✦ Efecto de carta debilita su rasgo cargado.',
      finalChoice: '  → {name}',

      // ─── Eventos narrativos (acciones de las 6 rondas) ───────────────────
      eventPlaymakerRelease: '  ↗ {name} suelta al corredor pronto.',
      eventPlaymakerDictate: '  🎼 {name} frena el juego a tu ritmo.',
      eventPlaymakerThread: '  🧵 {name} empieza a hilar pases más finos.',
      eventOppKeeperTarget: '  🎯 {name} recibe disparos desde todas partes.',
      eventCrashBox: '  🧨 Cuerpos inundan el área — cada rechace está vivo.',
      eventResetProbe: '  🧭 Una jugada limpia más — luego al hueco.',
      eventBacklineStepIn: '  ⬆ {name} adelanta la línea y comprime el campo.',
      eventBacklineHold: '  🧱 La línea aguanta compacta — menos huecos, cabezas frías.',
      eventBacklineTrap: '  🪤 La defensa espera agazapada — un mal pase y rompes.',
      eventPlayHardYellow: '  🟨 {name} entra fuerte — amarilla. Al borde del filo.',
      eventPlayHardClean: '  💢 {name} gana el duelo limpio — sin tarjeta, impacto pleno.',
      eventPlayClean: '  ✓ {name} se frena — juego inteligente, temple arriba.',
      eventSubDefender: '  ⇄ {out} sale, {in} entra — defensor fresco tapa el hueco.',
      eventWeatherAdapt: '  ☔ Formación se cierra, ritmo baja — adaptarse al clima.',
      eventWeatherPush: '  💨 Ignorar el clima — directo hacia adelante.',
      eventFanRally: '  📣 La grada empuja — el equipo canaliza la energía.',
      eventFanIgnore: '  🔇 Jugadores se aíslan — concentración clínica.',
      eventStarCapitalize: '  ⚡ Su estrella no está — presión máxima.',
      eventStarDiscipline: '  🛡 Mantener la forma — que no vuelvan gratis.',
      eventHotPlayerBoost: '  🔥 {name} recibe el guiño — boost permanente de {stat}.',
      eventHotPlayerStabilize: '  🛡 Forma mantenida — talento individual canalizado por la estabilidad colectiva.',
      eventCrisisTeamTalk: '  📢 El mensaje cala — equipo animado.',
      eventCrisisTeamTalkFailed: '  El mensaje no cala.',
      eventCrisisFocus: '  🎯 Uno se echa el peso al hombro.',
      eventCrisisAccept: '  Cabezas abajo y a currar.',
      eventOppMistakeExploit: '  ⚡ Ataque inmediato — capitalizando su error.',
      eventOppMistakeSustain: '  🏃 Presión sostenida — el rival bajo tensión continua.',
      eventLegendaryBringOn: '  ⚜ {name} está dentro. Esto acaba de cambiar.',
      eventLegendaryMorale: '  El banquillo anima — pequeño empujón generalizado.',
      eventSeasonFinaleAllIn: '  🔥 Todo por el título — sin reservas.',
      eventSeasonFinaleControlled: '  Compuestos y controlados — que el partido venga a ellos.',
      eventStrikerLayoff: '  ↺ {name} baja — balón reciclado por medio campo.',
      eventStrikerPush: '  💪 {name} insiste — confianza en el disparo.',
      eventStrikerSwap: '  ⇄ {out} sale, {in} entra — piernas frescas arriba.',
      eventKeeperLaunch: '  🧤→⚡ {name} lanza largo — contra en marcha.',
      eventKeeperSolid: '  🛡 {name} mantiene la calma — colchón para el resto.',
      eventOppStrikerPress: '  🏃 Presionar al delantero frustrado — {name} bajo presión.',
      eventOppStrikerGuard: '  🛡 Cuidar el disparo desesperado de {name}.',
      eventMomentumTimeout: '  🕐 Tiempo muerto — el equipo se recompone.',
      eventMomentumSwitch: '  ⚙ Cambio de forma — postura defensiva de contra activada.',
      eventCorridorDouble: '  ↪ {name} va otra vez — mismo canal, mismo caos.',
      eventCorridorSwitch: '  ↔ Balón al centro — el eje se abre.',
      eventOppPmHigh: '  ⬆ Presionar alto a {name} — apostando por la línea alta.',
      eventOppPmMark: '  🎯 {name} doblemente marcado — servicio cortado.',
      eventOppPmBait: '  🎣 Dejarlo jugar — trampa de contra armada.',
      eventHitzigCalm: '  🧘 El capitán calma a la tropa.',
      eventHitzigClean: '  😤 {name} se mantiene listo — sin tarjeta.',
      eventHitzigYellow: '  🟨 {name} — amarilla.',
      eventHitzigSecondYellow: '  🟨🟥 {name} — segunda amarilla. Expulsado.',
      eventHitzigRed: '  🟥 {name} — roja directa. Expulsado.',
      eventHitzigIgnore: '  La tensión se queda.',
      eventFreierFoul: '  🟨 {name} derriba al corredor — amarilla.',
      eventFreierFoulRed: '  🟨🟥 {name} — segunda amarilla. Expulsado.',
      eventFreierRetreat: '  Repliegue para cubrir — calidad de disparo reducida.',
      eventFreierKeeperWin: '  🧤 {name} lo gana a sus pies — ¡despejado!',
      eventFreierKeeperLose: '  ⚽ {opp} rodea a {name} — puerta vacía.',
      eventClearFlat: '  📏 {name} — raso, calmado, al rincón.',
      eventClearChip: '  🌙 {name} pica el balón — alto riesgo, alta recompensa.',
      eventClearSquare: '  ⇄ {st} asiste a {lf} — intento a puerta vacía.',
      eventTaktikLong: '  📏 Pelotazos por encima.',
      eventTaktikHold: '  🎯 Aguantar el balón — bloqueo de posesión activo.',
      eventTaktikMatch: '  💥 Igualar su agresividad — presión activada.',

      // ─── Intros de ronda ─────────────────────────────────────────────────
      roundIntroTied: [
        'Iguales {me}:{opp} — partido abierto.',
        'Aún sin goles. Tensión subiendo.',
        '{me}:{opp} — ninguno cede un metro.',
        'Empate. El próximo gol puede decidirlo todo.'
      ],
      roundIntroLeading: [
        '{me}:{opp} — ventaja en el bolsillo.',
        'Por delante {me}:{opp}. Mantener la forma.',
        '{me}:{opp} — control, de momento.',
        'Liderando {me}:{opp}. No invitarlos de vuelta.'
      ],
      roundIntroTrailing: [
        '{me}:{opp} — hay que encontrar el camino de vuelta.',
        'Persiguiendo el partido a {me}:{opp}.',
        '{me}:{opp} — la presión crece.',
        'Por detrás en {me}:{opp}. Algo tiene que cambiar.'
      ],
      roundIntroFinal: [
        'Última ronda. Todo se juega en {me}:{opp}.',
        'Minutos finales. {me}:{opp}. Sin margen de error.',
        'Todo se reduce a esto. {me}:{opp}.',
        'Queda una ronda. {me}:{opp}. Que valga.'
      ],

      // ─── Posesión / Estructura ───────────────────────────────────────────
      possessionPressure: [
        '  Posesión dominante al {pct}% — empujando para abrir.',
        '  {pct}% del balón — acampados en su mitad.',
        '  Controlando al {pct}% — presión constante.'
      ],
      possessionDominated: [
        '  Replegados al {pct}% de posesión.',
        '  Empujados atrás — apenas tocan el balón.',
        '  {pct}% — luchando por mantener la forma.'
      ],
      activeBuffs: '  📊 {buffs}',
      oppMood: {
        cruising: [
          '{opp} baja una marcha — empiezan a pasear.',
          '{opp} levanta el pie del acelerador — la ventaja los relaja.',
          '{opp} se ve conforme — menos sprints, más pases laterales.'
        ],
        bottling: [
          '{opp} se tensa — nervios visibles.',
          '{opp} defiende profundo — sienten nuestra remontada.',
          '{opp} juega para aguantar — miedo en la formación.'
        ],
        rattled: [
          '{opp} se mete atrás — detener la sangría.',
          '{opp} se pone conservador — cada toque hacia atrás.',
          '{opp} aparca el autobús — ya no juegan.'
        ],
        desperate: [
          '{opp} lanza a todos arriba — a por todas, nada que perder.',
          '{opp} va al kamikaze — la línea defensiva se ha disuelto.',
          '{opp} presiona todo — en pánico, peligrosos, abiertos.'
        ]
      },

      // ─── Pequeños eventos de partido / contras / cadenas ─────────────────
      chainAttack: '  ⚡ Combinación rápida — otra ocasión sigue.',
      luckyDouble: '  🍀 {name} roba posesión — ¡segundo ataque!',
      counter: '  🔁 Robo — contra en marcha.',
      autoCounter: '  ⚡ Lo regalan — aprovechamos.',
      microBoost: '  ⚡ {name} · {stat} ↑ {value} (decisión rindiendo)',
      doubleCounter: '  ⚡⚡ Dos ataques perdidos — ¡doble contra!',
      pressingCap: '  La presión corta su segunda carrera.',
      aggressiveThird: '  💥 Ola tras ola — tercer ataque.',
      rallyReaction: '  💢 Respuesta inmediata tras el gol encajado.',
      flankRun: '  {name} se va por la banda — ocasión extra.',
      momentumBuilt: '  Momentum creciendo — control sostenido dando frutos.',
      momentumZone: {
        rush:      '  El equipo en racha — todo encaja.',
        leading:   '  Tenemos la sartén por el mango.',
        neutral:   '',
        pressured: '  Bajo presión — replegándose, aguantando.',
        desperate: '  Contra la pared — último cartucho ahora.'
      },
      momentumFumble: '  💥 ¡Sobreconfianza! El equipo pierde la burbuja.',

      // ─── Resumen de descanso ─────────────────────────────────────────────
      htSummaryPressing: 'Presión bloqueó {n} ataques',
      htSummaryCounters: 'Sistema de contra disparó {n}x',
      htSummaryMomentum: 'Momentum activo',

      // ─── Pools de forma ──────────────────────────────────────────────────
      pressingBeaten: [
        '  {opp} encuentra el hueco — se abre espacio tras la presión.',
        '  Línea batida — {opp} está en la espalda.',
        '  Presión sobrepasada — {opp} tiene superioridad arriba.'
      ],
      aggressiveError: [
        '  Demasiado ansiosos — la jugada se rompe en transición.',
        '  Sobrecomprometidos — balón perdido.',
        '  La urgencia les cuesta — balón suelto en medio campo.'
      ],
      possessionLost: [
        '  Balón regalado — {opp} ya sale.',
        '  Mal toque — {opp} presiona alto al instante.',
        '  Robado en salida — {opp} listo para contragolpear.'
      ],
      defensiveLackOfPunch: [
        '  Compactos pero sin mordida — nadie llega arriba.',
        '  La forma está, pero al ataque le falta fuelle.',
        '  Demasiado cautos al avanzar.'
      ],
      leadComplacency: [
        '  Ventaja cómoda — la urgencia se apaga.',
        '  Dos arriba — quizás un pelín relajados.',
        '  Con colchón las piernas ya no pisan tan fuerte.'
      ],
      deficitNervousness: [
        '  Persiguiendo el partido — la tensión pesa en el pase.',
        '  El marcador pesa — decisiones precipitadas.',
        '  Por detrás y empujando — aparecen errores.'
      ],
      allInExposed: [
        '  Todo fuera y pillados abiertos — {opp} encuentra el espacio.',
        '  El órdago sale mal — {opp} tiene hectáreas detrás.',
        '  Todos arriba — {opp} encuentra el hueco.'
      ],
      attackingExposed: [
        '  Forma atacante deja huecos — {opp} lo aprovecha.',
        '  Línea alta, cobertura fina — {opp} cruza de lado a lado.',
        '  Ir arriba cuesta caro — {opp} pega al contragolpe.'
      ],
      aggressiveExposed: [
        '  Presión agresiva castigada — {opp} solo ante el gol.',
        '  Demasiado alto, demasiado abierto — {opp} encuentra el canal.',
        '  La agresividad se vuelve en contra — {opp} en espacio.'
      ],
      synergyCombo: [
        '{a} y {b} combinan',
        '{a} asiste a {b}',
        'Intercambio rápido — {b} finaliza',
        '{a} encuentra a {b} en espacio',
        'Uno-dos: {a} a {b}'
      ],
      ownGoalCombo: '⚽ ¡GOL {name}! {combo}   {me}:{opp}',

      // ─── Epílogos ────────────────────────────────────────────────────────
      epilogueWin: [
        'Tres puntos. Trabajo hecho.',
        'Duro, pero bien ganado.',
        'El equipo responde cuando importa.',
        'Merecido. Clínicos cuando tocaba.'
      ],
      epilogueDraw: [
        'Un punto cada uno. Ambos dejan algo en el campo.',
        'Honores repartidos — pudo caer de cualquier lado.',
        'Empate peleado. A lo siguiente.'
      ],
      epilogueLoss: [
        'Cabezas abajo. Duro de tragar.',
        'Hoy no fue suficiente. A reagruparse.',
        'Ellos estuvieron más finos. Lección aprendida.'
      ],

      // ─── Narrativa de disparadores tácticos ──────────────────────────────
      tacticPressingTrigger: '  La presión paga — balón recuperado.',
      tacticCounterTrigger: '  Contra armada — próxima jugada potenciada.',
      tacticRallyTrigger: '  💪 Rally activo — +{bonus} desde el déficit.',
      tacticHighPressTrigger: '  Presión alta — balón recuperado.',
      tacticFinalPressTrigger: '  ⚡ Presión final — contra lanzada.',
      tacticGambleWin: '  🎲 El órdago sale — +35 ataque de equipo.',
      tacticGambleLoss: '  🎲 El órdago falla — -15 a todas las stats.',
      tacticShakeUp: '  🔄 Sacudida: {name} castigado, equipo se enfoca.',
      tacticLoneWolf: '  🐺 Lobo solitario: {name} lo carga.',
      tacticFortress: '  🛡 Fortaleza: {tw} y {vt} cierran atrás.',
      tacticMasterclass: '  🎼 Clase magistral: {name} dirige.',
      tacticFit: '  ✓ {name} — condiciones cumplidas, bonus aplicado.',

      // ─── Disparadores de rasgos (jugador) ────────────────────────────────
      laserPass: '🎯 {name} — pase láser, contra en marcha.',
      bulldoze: '🛡 {name} — arrolla, balón ganado.',
      hardTackle: '🥾 {name} — entrada dura, ¡contra!',
      chessPredict: '♟ {name} — lo lee perfecto, gol anulado.',
      speedBurst: '💨 {name} — salida garantizada.',
      pounce: '🐆 {name} — aprovecha el error.',
      oppBlitzCounter: '  ⚡ {name} ({team}) responde al instante.',
      shadowStrike: '{name} — carrera fantasma, ocasión súbita.',
      streetTrick: '{name} — deja al defensor clavado.',
      silentKiller: '{name} — primer toque, daño máximo.',
      cannonBlast: '{name} — dispara.',
      ghostRun: '{name} — aparece de la nada.',
      puzzleConnect: '{name} — la pieza final.',
      nineLives: '🐱 {name} — despejado sobre la línea. Sigue vivo.',
      killerPass: '⚡ {name} — ese pase abre otra ocasión.',
      maestroCombo: '🎼 {name} — la combinación encaja. Próximo gol cuenta doble.',
      unstoppable: '🚀 {name} — solo ante el gol, imparable.',
      godMode: '⭐ {name} — todo encaja. Próximo gol cuenta triple.',
      unbreakable: '🛡 {name} — firme. Gol anulado.',

      // ─── Sinergias / conflictos / misfits ────────────────────────────────
      synergyAmplified: '  🔗 Sinergia de presión — decisión amplificada.',
      synergyConflict: '  ⚠ Conflicto táctico — decisión reducida.',
      synergyPressingCombo: '  🔗 Presión + decisión de presión — en la zona.',
      synergyPossessionPM: '  🔗 Posesión + foco de playmaker — bonus de estilo.',
      conflictPressingAfterPossession: '  ⚠ Presión tras kickoff de posesión — energía mal alineada.',
      conflictPressingCollapse: '  ⚠ Misfit preexistente — decisión de presión arriesgada.',
      conflictPlayerCrisis: '  ⚠ Jugador en crisis — focalizarlo es arriesgado.',
      conflictPlayerHot: '  🔗 Jugador en forma — foco amplificado.',
      conflictLegendarySub: '  🔗 Leyenda entrando — impacto amplificado.',
      misfitPressingCollapse: '  ⚠ La presión colapsa — las piernas no aguantan.',
      misfitCounterStall: '  ⚠ La contra se estanca — nadie rápido para correr.',

      // ─── Tarjetas (amarilla/roja en el log) ──────────────────────────────
      cardYellow: '  🟨 {name} — amarilla.',
      cardRed:    '  🟥 {name} — roja. Suspendido para el próximo partido.',

      // ─── Rachas ──────────────────────────────────────────────────────────
      streak: {
        myTeam: {
          zone:       '  🔥 {name} en la zona — afilado como un cristal.',
          cold:       '  ❄ {name} está frío — la confianza se fue.',
          frustrated: '  😤 {name} frustrado — mecha corta.'
        },
        oppTeam: {
          zone:       '  🔥 {name} ({team}) en la zona — ojo con él.',
          cold:       '  ❄ {name} ({team}) se ha enfriado.',
          frustrated: '  😤 {name} ({team}) pierde la cabeza.'
        }
      },

      // ─── Disparadores de rasgos del rival ────────────────────────────────
      oppTrait: {
        sturmShot: '  {name} ({team}) — disparo de precisión, cada tiro cuenta.',
        sniperShot: '  {name} ({team}) — elige la esquina, remate clínico.',
        riegelDeny: '  {name} ({team}) — las paradas cuestan cada vez más.',
        presserDisrupt: '  {name} ({team}) — la presión alta desarma la salida.',
        ironwallEarly: '  {name} ({team}) — muro defensivo pronto, casi impenetrable.',
        clutchSurge: '  {name} ({team}) — acelerón tardío, energía al alza.',
        bulwarkDeny: '  🛡 {name} ({team}) — ¡baluarte! El balón se despeja en la línea.'
      },
      oppRageAttack: '  🔥 {team} — ofensiva de rabia: se lanzan todos al ataque.',
      attackCapped: '  ⚠ Demasiada presión a la vez — el impulso de ataque pasa a la siguiente ocasión.',
      pressingResisted: '  ⚠ {opp} se alimenta de la presión — tu press rebota.',
      aggressiveResisted: '  ⚠ {opp} contra-presiona — tu agresividad no abre huecos.',
      oppMoveTelegraph: '  ▸ {opp} carga: {name} [{sev}]',
      oppMoveQuiet: '  · {opp}: {name}',
      // v0.50 — Log de soft-defuse. Emitido cuando el jugador jugó una
      // carta de defensa/contra esta ronda y el buff de defensa activo
      // es ≥ 8. cls='player-shield' para que el tracking cuente como
      // defused.
      oppMoveSoftDefused: '  ✓ Búfer de defensa absorbe {name} — amortigua el efecto.',
      oppMove: {
        quickStrike: '  ⚡ {opp} — ¡disparo rápido!',
        extraAttack: '  ▸ ¡{opp} insiste!',
        counterBlitz: '  ↺ {opp} — ¡contra tras parada!',
        signatureGoal: '  🎯 {opp} ejecuta la jugada estrella — ¡sin bloqueo!'
      }
    },
    // v0.47 — Pistas de contra por categoría de movimiento rival. Se
    // muestran como segunda línea tras el telegraph (solo severity ≥ 2)
    // para que el jugador sepa qué tipo de carta contrarresta. Mantenido
    // general — mapeo preciso "carta X contra jugada Y" es fase 2.
    // Deliberadamente una guía, no una garantía.
    oppMoveCounter: {
      aggressive: '    ↳ Contra: cartas de defensa suavizan el ataque (Salida Profunda, Compactos, Zona).',
      lockdown:   '    ↳ Contra: carta combo con Flow ≥ 2 rompe el muro (Rompelíneas, Hero Moment, Clase Maestra).',
      disruption: '    ↳ Contra: Medic absorbe el daño de faltas. Cartas de defensa amortiguan la disrupción.',
      setup:      '    ↳ Contra: interrumpe pronto — Recuperación de Balón o cartas de trigger rompen su setup.',
      big:        '    ↳ Contra: amenaza pesada — acumula Flow, lanza carta de contra o combo.'
    },
    // v0.48 — Tooltips en las líneas del log. Una explicación mecánica
    // corta por clase cls. Se añade en ui.js:appendLog via data-kl-tip,
    // mostrado al pasar el ratón por el sistema global KL.tip. Objetivo:
    // el jugador entiende qué significa una categoría sin ir al codex.
    logTip: {
      trigger:         'Un rasgo dispara. Se lee como: jugador · rasgo · efecto. Los valores de buff van entre paréntesis.',
      cardPlay:        'Carta resuelta. Lee los chips de stat uno a uno. El chip de fase indica encaje — verde para boost, dorado para neutral, rojo para misfit (efecto a la mitad).',
      cardSummary:     'Resumen de cartas al cierre de ronda. Suma el desplazamiento total de stat de todo lo que jugaste.',
      playerShield:    'Una carta de contra surtió efecto. Una jugada rival fue bloqueada, amortiguada o absorbida. Compara con el banner de amenaza arriba.',
      microBoost:      'Pequeño empujón de stat de corta duración — racha de victorias, afinidad de rol o ventana de evento. No de una carta.',
      conditionGain:   'El jugador recuperó condición. Por encima de 50 mantiene stats limpias; por debajo de 50 → −3 todas; por debajo de 25 → −6.',
      roleAffinity:    'Bonus por encaje de rol. La carta correcta cayó en el jugador correcto — valor extra de stat esta ronda.',
      interruptChoice: 'Tu táctica para esta fase. El paréntesis muestra el bonus neto de equipo; cualquier cola (TW DEF +N) indica boosts directos a stats personales.',
      tacticFeedback:  'Táctica activa disparando esta ronda. Los paréntesis muestran lo que se mueve ahora — separado de los buffs de cartas.',
      streak:          'Empujón por forma: las rachas calientes suman, las frías restan. Atadas a partidos recientes, no a este.',
      oppCard:         'El rival jugó una carta. Efecto durante la ronda (o más en jugadas estrella). Una carta de contra o defensa puede amortiguarla la próxima ronda.',
      oppSave:         'Su portero ataja. Su DEF + CMP contra tu OFF + condición del ST decide — la fatiga mata más disparos de lo que parece.',
      oppAdapt:        'El rival se adaptó al tipo de carta que más juegas — pequeño bump defensivo dirigido en su lado. Diversifica para esquivarlo.',
      fatigueCost:     'La carta cuesta condición al rol correspondiente. Recuerda los umbrales: <50 → −3 todas las stats, <25 → −6. Las cartas de recuperación (breather, rotation, medic) no cuestan condición.',
      cardYellow:      'Amarilla — una segunda amarilla pasa a roja. Cambia al jugador antes de tentar la suerte.',
      cardRed:         'Roja — fuera este partido, sancionado el próximo. La cantera cubre el hueco hasta que vuelva.',
      phaseShift:      'Cambio de fase del partido (Buildup → Attack, etc.). Las cartas se reevalúan por encaje de fase; los chips ★ de tu mano se actualizan.'
    }
  },
  tactic: {
    misfit: {
      aggressiveSlow: '  ⚠ Plantilla sin ritmo para presión agresiva — riesgo de fatiga elevado.',
      defensiveNoVision: '  ⚠ Sin visión del PM — bloque bajo sin salida.',
      tempoOutpaced: '  ⚠ El plan de ritmo se vuelve en contra — el rival es más rápido.',
      pressingNoLegs: '  ⚠ No hay piernas para presión sostenida — colapso en camino.',
      possessionNoVision: '  ⚠ Sin visión para mantener el balón — las pérdidas dolerán.',
      counterNoRunner: '  ⚠ Sin corredor rápido — la amenaza del contragolpe se apaga.',
      flankCutOut: '  ⚠ Llegadas por banda cortadas — el rival neutraliza el ancho.'
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
      'Pérdida en la línea de medio campo',
      // v52.6 — variantes con acción/reacción encadenada
      '{pm} es desposeído — {opp} sale a la contra de inmediato',
      'El despeje de {vt} cae en {opp} — vuelven a presionar',
      '{pm} busca el filtrado pero el rival lo lee perfectamente',
      'La presión rival ahoga a {pm} — pase forzado interceptado',
      '{vt} falla el pase largo, {opp} arranca desde nuestro campo',
      'La construcción se atasca — {pm} no encuentra salida'
    ],
    ownBuildSuccess: [
      '{pm} rompe líneas con un pase filtrado',
      '{pm} encuentra el hueco entre líneas',
      'Pared rápida entre {pm} y {lf}',
      '{pm} cambia el juego hacia la banda',
      '{lf} acelera por fuera',
      '{vt} inicia bien la jugada — {pm} toma el mando',
      '{pm} conduce hasta el último tercio',
      // v52.6 — variantes encadenadas
      '{pm} amaga, filtra para {lf} — el defensa se queda clavado',
      '{vt} la pone larga, {pm} la controla y habilita a {lf}',
      '{lf} encara al lateral, recorta — y se va',
      'Pared entre {pm} y {lf} — abre el carril limpio',
      '{pm} levanta la cabeza, asiste a {lf} que rompe al espacio',
      '{vt} sale jugando, encuentra a {pm} entre líneas — pase rápido'
    ],
    chance: [
      '{scorer} remata...',
      '{scorer} se impone en el área...',
      '{scorer} tiene la ocasión...',
      '{scorer} acecha frente al arco...',
      '{scorer} recibe dentro del área...',
      // v52.6 — variantes
      '{scorer} gira en el área y dispara...',
      '{scorer} encuentra el hueco entre defensores...',
      '{scorer} llega al centro de cabeza...',
      '{scorer} arma la pierna con tiempo y espacio...'
    ],
    miss: [
      '{scorer} la manda por poco fuera',
      '{scorer} pega en el poste!',
      '{scorer} remata centrado — el portero ataja',
      '{scorer} la manda arriba',
      '{scorer} es bloqueado en el último instante',
      '{scorer} perdona la ocasión',
      '{scorer} revienta el larguero!',
      // v52.6 — variantes con reacción
      '{scorer} dispara — el defensor se interpone justo a tiempo',
      'Remate centrado de {scorer} — el portero la atrapa sin problemas',
      '{scorer} intenta picarla — demasiado alta',
      '{scorer} curva el balón — roza la madera y se va',
      'Mal control de {scorer} — el portero se le adelanta',
      '{scorer} se inclina y manda el balón a las nubes'
    ],
    oppBuildFail: [
      '{opp} pierde el balón en la salida',
      '{opp} falla completamente el pase',
      '{vt} corta la jugada',
      '{opp} se ve frenado en la construcción',
      'La contrapresión obliga a {opp} a equivocarse',
      // v52.6 — variantes
      '{vt} se anticipa al pase y despeja al ataque',
      '{opp} pierde tiempo con el balón — robo limpio',
      'La presión sofoca el juego de {opp} — recuperamos',
      '{opp} intenta el pase vertical — interceptado',
      '{vt} llega justo al deslizamiento — {opp} reclama'
    ],
    oppApproach: [
      '{opp} llega por la banda',
      '{opp} acelera el juego hacia delante',
      '{opp} busca el remate',
      'El delantero rival rompe la línea defensiva',
      '{opp} progresa por el centro',
      // v52.6 — variantes
      '{opp} combina con criterio hacia el último tercio',
      'Contraataque por la banda derecha — {opp} viene con velocidad',
      '{opp} hace pared en el borde del área',
      'Disputa aérea por el balón largo — {opp} la gana',
      '{opp} arrastra a la banda y busca el centro'
    ],
    save: [
      '{tw} saca una gran mano!',
      '{tw} atrapa con seguridad',
      '{vt} bloquea el disparo en el último instante',
      'Disparo desviado — {tw} lo tenía controlado',
      '{tw} aparece con una parada brillante!',
      'Cabezazo fuera',
      // v52.6 — variantes con reacción
      '{tw} saca el balón de la escuadra — ¡qué parada!',
      '{tw} reacciona magistralmente, la envía al poste',
      '{vt} se tira al disparo — bloqueado',
      '{tw} está bien colocado y atrapa con firmeza',
      '¡Doble parada de {tw}! — también detiene el rebote',
      '{tw} sale y resuelve el mano a mano'
    ]
  },
  // v0.42 — Capa narrativa (nivel superior, hermano de `ui` y `data`).
  // Ver de.js para la nota completa de diseño. Mismos placeholders:
  // {shooter}, {role}, {setupHint}, {triggerHint}, {comboHint}.
  narrative: {
    goalBuildup: {
      variants: [
        'Construido a través de {setupHint} — {shooter} remata.',
        '{setupHint} abre la brecha, {shooter} está justo ahí.',
        'Tras {setupHint}: {shooter} la manda dentro.',
        '{setupHint}, luego {triggerHint} — {shooter} golpea.',
        'La cadena de {setupHint} a {triggerHint} deja a {shooter} de cara.',
        '{triggerHint} rompe líneas — {shooter} convierte.',
        '¡{comboHint}! {shooter} sella la jugada.',
        '{shooter} encuentra el hueco.',
        '{shooter} la cruza con precisión.'
      ]
    },
    cards: {
      switch_lane:    { buildupHint: 'un cambio de banda' },
      drop_deep:      { buildupHint: 'una salida profunda' },
      quick_build:    { buildupHint: 'una transición rápida' },
      triangle_play:  { buildupHint: 'una triangulación' },
      long_ball:      { buildupHint: 'un balón largo' },
      overlap_run:    { buildupHint: 'una desmarcada por fuera' },
      forward_burst:  { buildupHint: 'un arranque en carrera' },
      hope_shot:      { buildupHint: 'un centro desde medio campo' },
      grind_through:  { buildupHint: 'un empuje físico' },
      hero_moment:    { buildupHint: 'el Hero Moment' },
      masterclass:    { buildupHint: 'la Clase Maestra' },
      clinical_finish:{ buildupHint: 'el remate clínico' },
      lone_striker:   { buildupHint: 'la carrera en solitario' },
      set_piece:      { buildupHint: 'una jugada a balón parado' },
      flank_overload: { buildupHint: 'la sobrecarga de banda' },
      break_the_line: { buildupHint: 'un rompimiento de líneas' }
    },
    // Narrativa de gol encajado. El contexto viene de NUESTRO estado
    // táctico (exposureHint) y de un rasgo rival temáticamente
    // relevante (oppTraitHint). Las plantillas responden "¿por qué
    // encajamos?" en lugar de solo registrar el evento.
    oppGoalBuildup: {
      variants: [
        'Nuestro {exposureHint} castigado — {oppScorer} convierte.',
        'Tras nuestro {exposureHint} — {oppScorer} contraataca.',
        '{exposureHint} nos dejó al descubierto — {oppScorer} aprovecha.',
        '{oppTraitHint} rompe — {oppScorer} remata.',
        'Clásico {oppTraitHint}: {oppScorer} lo clava.',
        '{oppTraitHint} encuentra nuestro {exposureHint} — {oppScorer} cumple.',
        '{oppScorer} castiga el desajuste posicional.',
        '{oppScorer} queda libre y marca.',
        '{oppScorer} tira y marca.'
      ],
      exposure: {
        all_in:        'riesgo a todo o nada',
        attack_phase:  'avance ofensivo',
        aggressive:    'empuje agresivo',
        no_cards:      'momento sin cartas'
      },
      oppTrait: {
        sniper:         'disparo de francotirador',
        sturm:          'embate del vendaval',
        konter_opp:     'contragolpe letal',
        clutch_opp:     'momento de sangre fría',
        lucky:          'rebote afortunado',
        rage_mode:      'arranque de furia',
        counter_threat: 'doble contragolpe'
      }
    },
    // v0.43 — Palos (ambos lados). 4% de probabilidad por evento de gol
    // de que el disparo se estrelle en el aluminio en lugar de entrar.
    // Nombre de escena separado por lado (anti-repetición por separado).
    postHitMine: {
      variants: [
        'Construido a través de {setupHint} — {shooter} la estrella en el larguero.',
        'Tras {setupHint} — {shooter} solo encuentra el palo.',
        '{triggerHint} deja a {shooter} solo — y solo el palo se lo niega.',
        '{shooter} la estrella en el palo — reacción del público.',
        '¡Palo! {shooter} no tiene suerte.',
        'El larguero los salva — {shooter} estuvo cerquísima.',
        '{shooter} tira de lejos — solo aluminio.',
        '{shooter} solo encuentra el palo.'
      ]
    },
    postHitOpp: {
      variants: [
        '¡{oppScorer} al palo! — menuda suerte.',
        '¡Palo! {oppScorer} estaba solo — y el marco nos salva.',
        'El larguero le niega a {oppScorer}.',
        'El aluminio nos salva — {oppScorer} incrédulo.',
        '{oppScorer} solo encuentra hierro — nuestra suerte.',
        '{oppScorer} estrella en el palo — el balón corre por la línea y se va.'
      ]
    },
    // v0.44 — Fuera de juego (ambos lados, 3%). El gol se anula porque
    // alguien estaba un paso por delante. Anti-repetición por partido,
    // separada por escena.
    offsideMine: {
      variants: [
        '{shooter} encuentra la red — pero el banderín se levanta. Fuera de juego.',
        '¡Fuera de juego! {shooter} iba un hombro adelantado.',
        '{shooter} salió demasiado pronto — gol anulado.',
        'Silbato y banderín — {shooter} en fuera de juego.',
        '{shooter} la mete, pero el árbitro señala la línea.'
      ]
    },
    offsideOpp: {
      variants: [
        '{oppScorer} encuentra la red — pero el banderín sube. Fuera de juego, suerte la nuestra.',
        '¡Fuera de juego! {oppScorer} iba un hombro adelantado — gol anulado.',
        '{oppScorer} salió antes de tiempo — silbato, no hay gol.',
        'El banderín nos salva — {oppScorer} estaba tres pasos por delante.',
        '{oppScorer} celebra — pero el gol no cuenta. Fuera de juego.'
      ]
    },
    // v0.44 — Penalti inline. Tres fases por penalti: intro, desenlace
    // (cubriendo los tres resultados gol/parada/fallo). Pools separados
    // por lado (Mine/Opp) para anti-repetición y encuadre correcto.
    penaltyIntroMine: {
      variants: [
        '¡Falta en el área! El árbitro señala el punto — penalti a favor.',
        '¡Penalti! {shooter} coloca el balón.',
        'Entrada fea dentro del área — {shooter} se prepara.',
        'Silbato dentro del área. {shooter} agarra el balón.'
      ]
    },
    penaltyIntroOpp: {
      variants: [
        'Falta en nuestra propia área. Penalti en contra.',
        '¡Penalti para el rival! {shooter} coloca el balón.',
        'Entrada innecesaria dentro del área — pitido de penalti.',
        'El árbitro señala el punto. {shooter} se adelanta.'
      ]
    },
    penaltyGoalMine: {
      variants: [
        '{shooter} la convierte con frialdad.',
        '{shooter} la clava raso al palo — gol.',
        '{shooter} la pone donde quiere. {keeper} se tiró al lado contrario.',
        '{shooter} engaña a {keeper} — y marca.'
      ]
    },
    penaltyGoalOpp: {
      variants: [
        '{shooter} la convierte con seguridad. {keeper} no tuvo opción.',
        '{shooter} la manda a la escuadra — gol.',
        '{shooter} remata con sangre fría desde el punto. {keeper} se tiró al lado contrario.',
        '{shooter} la coloca raso — imposible para {keeper}.'
      ]
    },
    penaltySaveMine: {
      variants: [
        '¡{keeper} para! El penalti queda en sus manos.',
        '{keeper} se lanza — parada del partido.',
        '{keeper} lo adivina — {shooter} no se lo cree.',
        '{keeper} la saca con el pie — menudo reflejo.'
      ]
    },
    penaltySaveOpp: {
      variants: [
        '¡{keeper} para! Menudo reflejo.',
        '{keeper} adivina el lado y la despeja — el estadio estalla.',
        '{keeper} se estira a lo largo y la atrapa — {shooter} incrédulo.',
        '¡La tiene {keeper}! Parada en la escuadra.'
      ]
    },
    penaltyMissMine: {
      variants: [
        '{shooter} la manda por encima — la cabeza entre las manos.',
        '{shooter} estrella en el palo — el balón vuelve fuera.',
        '{shooter} la levanta por encima del larguero — desperdiciada.',
        '{shooter} la cruza fuera — ocasión perdida.'
      ]
    },
    penaltyMissOpp: {
      variants: [
        '{shooter} la manda por encima — menuda suerte.',
        '{shooter} estrella en el palo — el balón sale.',
        '{shooter} la levanta por encima del larguero — respiramos.',
        '{shooter} la cruza fuera — fallada.'
      ]
    },
    // v0.45 — Drama de final de partido: línea narrativa adicional
    // antes del epílogo estándar cuando el partido cae en una
    // categoría dramatúrgica. Placeholders {me} y {opp} son los
    // marcadores finales.
    matchEndDrama: {
      comeback_win: [
        'Remontada del partido — estuvimos contra las cuerdas, final {me}:{opp}.',
        'Le dimos la vuelta al marcador — menudo esfuerzo. Final {me}:{opp}.',
        'El equipo convierte una derrota en victoria — {me}:{opp}. Chapó.',
        'El partido se nos escapaba, pero lo rescatamos. {me}:{opp}.'
      ],
      collapse_loss: [
        'Derrumbe en el tramo final — la ventaja se convierte en derrota. {me}:{opp}.',
        'Tiramos la ventaja. No puede ser más amargo. {me}:{opp}.',
        'Teníamos el partido en la mano — y se nos escurrió. {me}:{opp}.',
        'Por delante, al final derrotados. {me}:{opp} — esto duele.'
      ],
      last_minute_win: [
        'Gol en el último minuto — el estadio estalla. {me}:{opp}.',
        'Un disparo tardío decide el partido. {me}:{opp}.',
        'Marcamos en el descuento — {me}:{opp}. Menudo thriller.'
      ],
      last_minute_loss: [
        'Gol encajado en el descuento — los puntos se van. {me}:{opp}.',
        'Encajamos en el último suspiro. {me}:{opp} — brutal.',
        'Perdimos al final lo que creíamos tener ganado. {me}:{opp}.'
      ],
      shutout_win: [
        'Portería a cero — la defensa aguantó como un muro. {me}:{opp}.',
        'Sin goles en contra, victoria clara. {me}:{opp}. Esta defensa aguanta.',
        'El cero se mantiene — con {me} propios. {me}:{opp}.'
      ],
      shutout_loss: [
        'Ni un solo gol nuestro, y la defensa se rompe. {me}:{opp} — aleccionador.',
        'Bloqueados en ataque, superados en defensa. {me}:{opp}.',
        'Nada hacia delante, todo hacia atrás. {me}:{opp}.'
      ],
      blowout_win: [
        'Festival de goles — arrollamos al rival. {me}:{opp}.',
        'El marcador habla por sí solo: {me}:{opp}. No puede ser más claro.',
        'Una demostración de poder en el campo. {me}:{opp}.'
      ],
      blowout_loss: [
        'Nos arrollan — {me}:{opp}. Nada que rascar hoy.',
        'Una lección dolorosa. {me}:{opp} — hay que asimilarla.',
        'El rival fue superior en todos los aspectos. {me}:{opp}.'
      ],
      nail_biter_win: [
        'Un thriller hasta el final — ganamos por los pelos. {me}:{opp}.',
        'Victoria por la mínima. {me}:{opp} — los nervios aguantaron.',
        'Fue al filo. {me}:{opp}, con suerte de llevárnoslo.'
      ],
      nail_biter_loss: [
        'Perdido al filo — {me}:{opp}. Tan cerca.',
        'Un solo gol nos separa de los puntos. {me}:{opp}.',
        'Cerca pero no cuenta. {me}:{opp}.'
      ],
      goal_fest_draw: [
        'Festival de goles con final abierto — ambos equipos lo dejan todo. {me}:{opp}.',
        'Un espectáculo que nadie gana. {me}:{opp}. Pero entretenimiento puro.',
        'Nueve goles en noventa minutos — fiesta del fútbol. {me}:{opp}.'
      ]
    }
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
      titan_stand: { name: 'Postura Titán', desc: 'Se planta como un muro cuando todo está en juego — con diferencia ≤1 gol, +30% de probabilidad de parar los disparos.' },
      fortress_aura: { name: 'Aura Fortaleza', desc: 'Su presencia se refleja en la línea defensiva — mientras el portero juegue, el defensa recibe +6 de defensa.' },
      clutch_save: { name: 'Parada Clutch', desc: 'Crece exactamente cuando el reloj aprieta — en las rondas 5-6: +20% de índice de parada.' },
      sweep_assist: { name: 'Apoyo de Barrida', desc: 'Atrapa el balón y lo lanza directo al ataque — tras cualquier parada +8% a la siguiente salida.' },
      laser_pass: { name: 'Pase Láser', desc: 'La contra sale de sus manos en segundos — tras una parada, 20% de activar una contra inmediata.' },
      offside_trap: { name: 'Trampa del Fuera de Juego', desc: 'Salir sincronizado, romper la línea — 15% de los ataques rivales se anulan según ritmo.' },
      acrobat_parry: { name: 'Acrobacia', desc: 'Parada acrobática de seguimiento, balón aún vivo — tras una parada, una vez por partido: +12% a la siguiente.' },
      wall_effect: { name: 'Muro', desc: 'Un muro entre balón y red, pero la chispa ofensiva se apaga — +15% permanente al índice de parada, pero -10% a tu salida.' },
      nine_lives: { name: 'Nueve Vidas', desc: 'Cae de pie como un gato, el primer golpe rebota — una vez por partido, el primer gol recibido se anula.' },
      intimidate: { name: 'Intimidar', desc: 'Su mirada por sí sola intimida al delantero rival — el ST rival recibe -5 de ataque.' },
      bulldoze: { name: 'Bulldozer', desc: 'Se lanza a cada disparo rival — 10% por ronda de robar el balón antes del remate.' },
      captain_boost: { name: 'Capitán', desc: 'Transmite calma a todo el equipo en el campo — cada compañero recibe +3 de temple.' },
      blood_scent: { name: 'Olor a Sangre', desc: 'Cada gol encajado aviva aún más su fuego — tras cada gol rival, +5 de defensa durante el resto del partido.' },
      hard_tackle: { name: 'Entrada Dura', desc: 'Entrada agresiva que lanza la contra — 20% de romper el ataque rival y activar una contra de inmediato.' },
      whirlwind_rush: { name: 'Torbellino', desc: 'Explosión repentina de ritmo durante un instante — una vez por parte, su ritmo se duplica durante una ronda.' },
      build_from_back: { name: 'Salida Desde Atrás', desc: 'Estructura el juego desde atrás — el creador recibe +8 de visión.' },
      late_bloom: { name: 'Explosión Tardía', desc: 'Encuentra su ritmo solo en la segunda parte — desde la ronda 4: +10 de ataque y +5 de visión.' },
      read_game: { name: 'Leer el Juego', desc: 'Juega con la cabeza, no con los pies — una vez por partido, un ataque rival se anula automáticamente.' },
      metronome_tempo: { name: 'Metrónomo', desc: 'Ritmo constante, más control cada ronda — cada ronda +2% a tu salida (acumulable).' },
      killer_pass: { name: 'Pase Letal', desc: 'Pase letal que corta entre líneas — en tu ataque, 25% de activar un disparo en cadena.' },
      whisper_boost: { name: 'Susurro', desc: 'Director silencioso tras el delantero, le da confianza — el ST recibe +8 de temple y +4 de ataque.' },
      hunter_press: { name: 'Fiebre de Caza', desc: 'Persigue al portador del balón, sin salida — 15% por ronda de recuperar el balón mediante presión.' },
      gegenpress_steal: { name: 'Gegenpress', desc: 'Ataca de inmediato tras la pérdida rival — tras cada pérdida del rival, +15% a la siguiente salida.' },
      shadow_strike: { name: 'Golpe Sombra', desc: 'Ataque inesperado desde la nada en rondas clave — en las rondas 3 y 6, 20% de probabilidad de un ataque oculto.' },
      maestro_combo: { name: 'Combo Maestro', desc: 'Cuando todo el equipo marca, suena como una sinfonía — si PM, LF y ST marcan, el siguiente gol vale doble.' },
      chess_predict: { name: 'Predicción', desc: 'Ve el disparo antes de que el delantero lo ejecute — una vez por parte, un gol rival se convierte en parada.' },
      symphony_pass: { name: 'Sinfonía', desc: 'Cuantos más compañeros se enciendan, más fuerte el equipo — si 2+ compañeros activan rasgos, +10% de ataque para el equipo.' },
      speed_burst: { name: 'Aceleración', desc: 'Explosión de ritmo en el momento justo — una vez por parte, una salida está garantizada.' },
      launch_sequence: { name: 'Lanzamiento', desc: 'Arranque en vuelo, sin calentamiento — en la ronda 1, el equipo recibe +20% a los ataques.' },
      unstoppable_run: { name: 'Imparable', desc: 'Cuando el ritmo acompaña, nadie lo alcanza — si el ritmo supera la defensa rival, 10% de gol automático.' },
      dribble_chain: { name: 'Cadena de Regates', desc: 'Un regate enciende el siguiente — cada ataque exitoso da +5% al siguiente (acumulable).' },
      street_trick: { name: 'Truco Callejero', desc: 'Freestyle callejero, defensor plantado — 15% de superar por completo al defensor.' },
      nutmeg: { name: 'Caño', desc: 'Túnel inesperado entre las piernas — en tu ataque, 20% de ignorar por completo la defensa rival.' },
      ironman_stamina: { name: 'Ironman', desc: 'Se mantiene fresco hasta el final y arrastra al equipo — rondas 5-6: sin desgaste, +2 de ritmo para el equipo.' },
      dynamo_power: { name: 'Dínamo', desc: 'Olas de poder rítmicas al equipo — cada dos rondas, el equipo recibe +6 de ataque para esa ronda.' },
      never_stop: { name: 'No Parar', desc: 'Ir por detrás lo hace más agresivo — si vas perdiendo, +8 de ataque por cada gol recibido.' },
      silent_killer: { name: 'Asesino Silencioso', desc: 'El primer disparo cae perfecto, inesperado — el primer disparo del partido recibe +30% de ataque.' },
      predator_pounce: { name: 'Salto Depredador', desc: 'Espera el error rival y ataca al instante — tras un ataque rival fallido, 25% de probabilidad de gol instantáneo.' },
      opportunity: { name: 'Oportunidad', desc: 'Convierte pequeñas ocasiones en goles reales — cada salida exitosa suma +3% de opción de gol.' },
      cannon_blast: { name: 'Cañonazo', desc: 'Disparos martillo peligrosos, pero con más riesgo de errar — cada disparo: 10% de gol automático, +5% de probabilidad de fallo.' },
      header_power: { name: 'Bestia Aérea', desc: 'Dueño del aire, ama el balón largo — con alta visión de equipo, +15% de opción de gol.' },
      brick_hold: { name: 'Sujeción de Balón', desc: 'Estabilizador en el campo, ninguna presión pasa — el equipo sufre -10% a la presión rival.' },
      ghost_run: { name: 'Carrera Fantasma', desc: 'Aparece de repente en el área cuando nadie mira — 15% por ronda de aparecer súbitamente para una ocasión.' },
      puzzle_connect: { name: 'Pieza de Puzle', desc: 'Conexión invisible con el creador — si marca el PM, este jugador recibe +25% a la siguiente opción de gol.' },
      chameleon_adapt: { name: 'Adaptación', desc: 'Se adapta al juego como un camaleón — en la ronda 4, copia el rasgo del compañero más activo.' }
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
      trait_sniper: 'Tirador de precisión — cada disparo es una amenaza',
      trait_bulwark: 'Defensa hasta el último milímetro — un gol seguro se despeja en la línea una vez por partido',
      trait_counter_threat: 'Doble acechador al contragolpe — un fallo de tu construcción invita a un disparo inmediato',
      trait_rage_mode: 'Se vuelve más feroz cuando pierde — el déficit de goles alimenta su ataque',
      trait_pressing_wall: 'Presión asfixiante — muchas de tus construcciones se rompen pronto',
      trait_boss_aura: 'Presencia de jefe — todo el equipo rival sube un punto en cada ronda'
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
        mindgames: { name: 'Juegos Mentales', desc: '+14 VIS, +10 CMP equipo. Rival −6 CMP durante 2 rondas. Meterse en sus cabezas.' },
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
        shift: { name: 'Reubicar', desc: 'Jugador en mejor forma: +18 stat clave (boost durante el partido).' },
        rally: { name: 'Reacción', desc: '+6 ataque por gol recibido, +6 defensa por gol marcado. Enorme potencial de vuelco.' },
        reset: { name: 'Reordenar', desc: '+12 a TODAS las stats R4-6. Borrar la pizarra — sin guion.' },
        counter_h: { name: 'Ir al Contra', desc: '+24 ritmo, +14 defensa R4-6. Ataque rival fallido dispara un contra.' },
        high_press: { name: 'Presión Alta', desc: '+22 defensa R4-6, -6 temple. Aprieta su salida — pero los huecos son reales.' },
        vision_play: { name: 'Abrir el Juego', desc: '+22 visión, +10 ataque R4-6. Crear huecos y aprovecharlos.' },
        shake_up: { name: 'Sacudida', desc: 'Jugador en peor forma apartado en espíritu: −5 todas las stats. Equipo responde: +12 OFF R4-6.' },
        lock_bus: { name: 'Cerrar el Autobús', desc: 'Solo si vas ganando: +30 defensa, -20 ataque R4-6. Impenetrable pero sin colmillos.' },
        desperate: { name: 'Ataque Desesperado', desc: 'Solo con 2+ de desventaja: +32 ataque R4-6, -20 defensa. Portero a su suerte. Todo o nada.' },
        role_switch: { name: 'Cambio de Rol', desc: 'LF y ST intercambian roles R4-6. Equipo: +10 TMP, +10 OFF, −8 VIS. LF +8 OFF, ST +8 TMP personal. Nuevos ángulos de ataque.' },
        coach_fire: { name: 'Bronca Apasionada', desc: 'Solo si vas perdiendo: próximo partido +1 forma de equipo, este +14 ataque R4-6. La rabia los mueve.' },
        cold_read: { name: 'Leer el Juego', desc: 'Descifrar sus tácticas. +20 defensa, ataque rival -8 R4-6. Más listos, no más duros.' },
        wingman: { name: 'Liberar al Extremo', desc: 'LF: +25 TMP, +15 OFF personal R4-6. Equipo −4 CMP. Riesgo del hombre-espectáculo.' },
        mind_reset: { name: 'Reinicio Mental', desc: 'Borra todos los deltas de forma del equipo. Pizarra en blanco para R4-6 — sin lastre, sin impulso.' },
        double_down: { name: 'Doblar la Apuesta', desc: 'Amplifica tu mayor bonus de equipo POSITIVO un +40%. Vuelve a +6 OFF/DEF/CMP modesto si aún no tienes uno real.' },
        tactical_foul: { name: 'Faltas Tácticas', desc: 'Rompedor de ritmo: el DF comete faltas deliberadas para cortar contraataques. +8 defensa, ritmo rival -12 durante R4-5. El DF pierde 3 de condición (compromiso). Interrumpir, no mejorar tu propio juego.' },
        wing_overload: { name: 'Sobrecarga en Banda', desc: 'LF: +20 ataque, +20 ritmo personal R4-6. Equipo -6 defensa. Espectáculo unipersonal.' },
        shell_defense: { name: 'Defensa en Caparazón', desc: 'Solo con empate o ventaja: +24 defensa, +14 temple, -10 ataque R4-6. Preservar la situación.' }
      },
      final: {
        all_in: { name: 'Todo o Nada', desc: 'R6: +15 ataque, -15 defensa. Crece si vas perdiendo. Completamente abiertos atrás.' },
        park_bus: { name: 'Autobús', desc: 'R6: +15 defensa, -10 ataque. Crece por cada gol de ventaja.' },
        hero_ball: { name: 'Héroe del Día', desc: 'Jugador en mejor forma: +30 stat clave (durante el partido).' },
        keep_cool: { name: 'Mantener la Calma', desc: 'R6: +20 temple, +12 visión. Nervios de acero.' },
        final_press: { name: 'Presión Final', desc: 'R6: +24 ritmo, +18 defensa, -10 ataque. Alta probabilidad de contra.' },
        long_ball: { name: 'Balón Largo', desc: 'R6: +28 ataque, -10 visión. Directo y duro.' },
        midfield: { name: 'Control del Medio', desc: 'R6: +20 visión, +16 ritmo, +14 temple.' },
        sneaky: { name: 'Emboscada', desc: 'R6: +28 defensa, +18 ritmo, -14 ataque. Atraer y saltar.' },
        sacrifice: { name: 'Sacrificio', desc: 'Jugador en mejor forma: −15 stat clave. Equipo: ahora +35 OFF este partido.' },
        kamikaze: { name: 'Kamikaze', desc: 'Solo si vas perdiendo: +40 ataque, -40 defensa. Portero expuesto. A esperar y rezar.' },
        clockwatch: { name: 'Esperar el Reloj', desc: 'Solo si vas ganando: +25 defensa, +18 temple. Dejar que el tiempo trabaje por ti.' },
        poker: { name: 'Cara de Póker', desc: 'Solo con empate: +15 a cada una de las stats. Clutch puro — todo en juego.' },
        lone_wolf: { name: 'Lobo Solitario', desc: 'Delantero: +40 ataque, +20 ritmo personal. Resto: -6 ataque. Un tiro, un gol.' },
        fortress: { name: 'Fortaleza', desc: 'TW/VT: +40 defensa. Equipo -20 ataque. Convertir la portería en un búnker.' },
        gamble: { name: 'Apuesta', desc: 'Cara o cruz: +35 ataque si cara, -15 a todas las stats si cruz. Caos puro.' },
        masterclass: { name: 'Clase Magistral', desc: 'PM: +30 visión, +20 temple personal. Equipo +12 ataque. Dejar dirigir al maestro.' },
        rope_a_dope: { name: 'Cuerda Rota', desc: 'R6: +35 defensa. Cada ataque rival dispara un auto-contra. Atraer, luego golpear.' },
        set_piece: { name: 'Maestro de Jugadas', desc: 'R6: +25 ataque, pero SOLO en ataques tras salida exitosa. Agudeza quirúrgica.' },
        siege_mode: { name: 'Modo Asedio', desc: 'R6: +20 ataque, +10 ritmo, +10 visión. Presión limpia sin penalización.' },
        bus_and_bike: { name: 'Autobús y Contra', desc: 'R6: +18 defensa. Cada parada/stop carga +30 ataque en tu próximo balón.' },
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
      sturm:          { name: 'Vendaval',            desc: 'Rematan con precisión quirúrgica — cada disparo llega un 8% más peligroso al marco del portero.' },
      riegel:         { name: 'Cerrojo',             desc: 'Cierran el área sin concesiones — tus paradas se vuelven un 5% más difíciles de convertir en despejes por ronda.' },
      konter_opp:     { name: 'Contra Letal',        desc: 'Acechan tus errores. Cualquier salida fallida les da un 30% de opción de remate al contragolpe.' },
      presser_opp:    { name: 'Máquina de Presión',  desc: 'Presionan alto y atacan cada pase. Tus salidas se rompen un 10% más bajo la presión sostenida.' },
      clutch_opp:     { name: 'Sangre Fría',         desc: 'Se crecen cuando el reloj aprieta. Rondas 5-6: +10 ataque, +5 ritmo — justo cuando más duele.' },
      lucky:          { name: 'Afortunados',         desc: 'Siempre algo les funciona. Una vez por partido sale un ataque bonus impredecible de la nada.' },
      ironwall:       { name: 'Muro de Hierro',      desc: 'Empiezan el partido blindados. Primeras 2 rondas casi impenetrables — +10 defensa.' },
      sniper:         { name: 'Francotirador',       desc: 'Cazadores pacientes esperando la ocasión limpia. Cada disparo +15% precisión, pero más lentos con el balón (-5 ritmo).' },
      boss_aura:      { name: 'Presencia Dominante', desc: 'Curtidos por la carrera, cada ronda añade un pequeño bonus de stats a cada rival — cuanto más se alarga, más dura se pone.' },
      bulwark:        { name: 'Baluarte',            desc: 'Uno de esos jugadores que saca el balón de la línea. Una vez por partido un gol cantado se despeja en el último instante.' },
      counter_threat: { name: 'Doble Contra',        desc: 'Dos acechadores cazando tu error. Una salida fallida trae 35% de riesgo de remate — y ese valor escala si van perdiendo.' },
      rage_mode:      { name: 'Modo Furia',          desc: 'Ir por detrás enciende la chispa. A 2+ goles abajo reciben opción extra de ataque bonus cada ronda.' },
      pressing_wall:  { name: 'Muro de Presión',     desc: 'Presión alta coordinada en todo el mediocampo. Tus salidas colapsan un 15% más.' }
    },
    legendaryTraits: {
      god_mode:      { name: 'Modo Dios',               desc: 'Se elevan por encima del momento. Una vez por partido, el siguiente gol propio vale triple — el partido puede girar en un instante.' },
      clutch_dna:    { name: 'ADN Decisivo',            desc: 'Cuanto más tarde el partido, más clara la cabeza. Última ronda: +20 ataque, +10 temple — justo cuando cuenta.' },
      field_general: { name: 'General del Campo',       desc: 'Organiza a todo el equipo desde el campo. La plantilla entera recibe +4 a todas las estadísticas — en todas partes, siempre.' },
      unbreakable:   { name: 'Irrompible',              desc: 'El primer gol en contra rebota sin consecuencia. Una vez por partido un gol encajado queda anulado por completo.' },
      big_game:      { name: 'Jugador de Grandes Citas',desc: 'Los partidos normales son rutina, pero los jefes los sacan a la luz. +15 a la estadística clave en partidos de jefe.' },
      conductor:     { name: 'Director',                desc: 'Cada pase arma el siguiente. Cada salida exitosa eleva la probabilidad de gol del siguiente remate un +8%.' },
      phoenix:       { name: 'Fénix',                   desc: 'Ir perdiendo los despierta. A 2+ goles abajo desbloquean +12 ataque para el resto del partido — la remontada empieza aquí.' },
      ice_in_veins:  { name: 'Hielo en las Venas',      desc: 'Ningún truco, ningún juego mental, ninguna mejora de temple del rival les alcanza. Su juicio se mantiene afilado — los buffs de temple rivales simplemente no aplican.' }
    }
  }
});