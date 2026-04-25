I18N.registerLocale('de', {
  ui: {
    meta: { title: 'KICKLIKE · 5-Mann-Football-Roguelite' },
    start: {
      tagline: '> 5-mann-football-roguelite_',
      sub: 'deckbuilder · team-evolution · saisons',
      newRun: '▶ Neuer Run',
      continueRun: '▶ Run fortsetzen',
      newRunConfirm: 'Einen neuen Run zu starten löscht deinen gespeicherten Fortschritt. Fortfahren?',
      leagueMatch: 'Match {n}',
      cupMatch: 'Pokal M{n}',
      openCodex: '📖 Codex',
      openManual: '→ Detailanleitung',
      changelog: 'Changelog',
      howTitle: 'So funktioniert\'s:',
      howBody: 'Wähle ein Starter-Team. Jede Saison sind 14 Liga-Matches (8 Teams, Hin und Rück). Top 2 steigen auf, Bottom 2 ab — Amateur → Pro → POKAL. Jedes Match: 6 Runden. Du ziehst Karten, der Gegner zieht seine eigenen Moves — aggressive Angriffswellen, defensive Bollwerke, taktische Fouls, Signature-Plays — und das OPP-THREAT-Banner zeigt dir, was kommt. Den Pokal gewinnen = RUN CHAMPION.'
    },
    changelog: {
      title: 'KICKLIKE · Changelog',
      versions: [
        {
          version: '0.60.2',
          title: 'Probable-Situations-Panel — zwei Frames gefixt die in fast jedem Match feuerten',
          entries: [
            {
              title: 'GOALIE STREAK feuert nicht mehr bei schwachem Keeper',
              body: 'Die Pre-Match-Vorhersage für **GOALIE STREAK** hatte die Formel falsch herum: sie addierte die Defense deines Keepers zur Offense des Gegners, wodurch ein **starker gegnerischer Stürmer die Wahrscheinlichkeit nach oben** trieb. Ein schwacher Keeper (Def 40) gegen starken Gegner (Off 70) feuerte das Frame als "wahrscheinlich" — narrativ Unsinn, das ist genau das Matchup wo dein Keeper *zerlegt* wird, nicht in Form geht. Formel nutzt jetzt die Differenz (TW Def vs Opp Off) — das Frame feuert nur wenn dein Keeper einen echten Edge gegenüber dem erwarteten Druck hat.'
            },
            {
              title: 'THEY ARE RATTLED feuert nicht mehr garantiert in jedem Match',
              body: '**THEY ARE RATTLED** war ein Pseudo-Predictor — feuerte mit fester 0.35 Likelihood (ein Dot, low) in jedem Match wo der Gegner irgendwelche Trait-Holder hatte. Da jedes generierte Team Trait-Holder hat, feuerte das Frame **immer**. Jetzt skaliert mit der gegnerischen Composure: niedrigere Opp-Composure → wahrscheinlicher dass das Frame im Match feuert. Gegner mit solider Composure (65+) bekommen die Vorhersage nicht — Pre-Match-Analyse kann das für mental stabile Squads nicht verlässlich callen.'
            },
            {
              title: 'Auswirkung auf das Panel',
              body: 'In ausgeglichenen Matchups ohne klaren Edge bleiben beide Frames jetzt still — wodurch die Top-3-Slots frei werden für Frames die *wirklich* relevant sind (`LANE IS WIDE OPEN`, `STRIKER FRUSTRATED`, etc), oder das Panel weniger Zeilen zeigt wenn nichts Spezifisches vorhergesagt wird. Bisher zeigte das Panel in fast jedem Match dieselben zwei Frames mit `NO PAYOFFS` daneben; das sollte deutlich seltener werden.'
            }
          ]
        },
        {
          version: '0.60.1',
          title: 'Pre-Stable-Hotfix — Confidence-Bonus-Persistenz + verpasste String-Updates',
          entries: [
            {
              title: 'Win-Confidence-Bonus übersteht jetzt einen Tab-Reload',
              body: 'Der +1-pro-Sieg Confidence-Bonus (cappt bei +4 auf alle fünf Stats) wurde bei jedem Save/Load-Roundtrip verworfen — das Feld fehlte in der Persist-Allowlist. Vier Siege in Folge bauen, Tab schließen, neu öffnen und der Buff war still weg. Jetzt persistiert er mit dem Rest des Saison-States und resettet zum Saison-Ende wie immer.'
            },
            {
              title: 'Zwei ES-Kartenbeschreibungen korrigiert',
              body: '**Running Hot (En Racha)** und **Doping (Todo al Rojo)** zeigten auf Spanisch immer noch die Pre-v0.59-Zahlen, obwohl v0.59 behauptete alle sieben Karten seien in EN/DE/ES neu geschrieben worden. Beide ES-Strings matchen jetzt was der Handler tatsächlich macht — gleicher Fix, den EN und DE schon hatten.'
            },
            {
              title: 'Rope-a-Dope: "Nur"-Zusatz auch in DE/ES rausgenommen',
              body: 'v0.60.0 hat den redundanten "only"-Zusatz aus rope_a_dope in EN entfernt ("R6:" statt "R6 only:"). DE und ES lieferten weiter "Nur R6:" / "Solo R6:" aus — gefixt. Alle drei Locales lesen sich jetzt gleichförmig mit dem Rest der Final-Phase-Tactics.'
            }
          ]
        },
        {
          version: '0.60.0',
          title: 'Backlog-Sweep — Second-Pass Card-Audit, Range-Cleanup, Loss-Screen-Causes',
          entries: [
            {
              title: 'Drei weitere Karten haben über ihre Zahlen gelogen',
              body: 'Nach dem v0.59 Card-Description-Audit haben drei Karten noch echte Fixes gebraucht, die durchgerutscht waren:\n\n- **Vorwegnehmen** sagte "+16 DEF" — der Handler liefert tatsächlich +22 DEF / +12 TMP / +8 CMP / +10 OFF bei erfolgreichem Cancel. Etwa **dreifacher** Buff verglichen mit der Beschreibung, plus drei undokumentierte Stats. Description neu geschrieben mit allen vier Zahlen plus "+Flow 2 / ziehe 1".\n- **Konter-Schlag** sagte "+22 OFF / +8 TMP" Hit, "+8 OFF" Base — Handler macht +28/+10 Hit, +10 OFF Base. 6/2/2 daneben. Plus der Auto-Konter-Trigger (wenn eine andere Karte einen Auto-Konter für diese Runde geladen hat) war nicht erwähnt.\n- **Pass in die Tiefe** beschrieb welche Discard-Typen welche Outcomes triggern, hat aber nie den +4 OFF / +4 TMP Buff im Setup-Discard-Branch erwähnt, auch nicht die garantierte Steilpass-Aktion bei Setup-Hit.\n\nAlle drei in EN, DE, ES aktualisiert.'
            },
            {
              title: 'Final-Round-Tactic-Prefixes vereinheitlicht',
              body: 'Tactic-Beschreibungen in der Final-Phase nutzten drei unterschiedliche Prefix-Stile: "Letzte Runde: ...", "R6: ..." und "R6 nur: ...". Alle sieben "Letzte Runde:"-Descriptions auf "R6:" umgestellt damit es dem existierenden R6/R4-6-Rundennummer-Pattern der anderen Tactics matcht. Der "nur"-Zusatz aus rope_a_dope rausgenommen (alle Final-Phase-Tactics sind per Definition R6-only). Liest sich uniform jetzt im Picker.'
            },
            {
              title: 'Loss-Screen zeigt jetzt bis zu 2 Sekundär-Ursachen unter dem Verdict',
              body: 'Die v0.56 Match-Verdict-Headline diagnostizierte eine Niederlage in einem italic Einzeiler ("Dem Team gingen die Beine aus — Antony Dembélé, Jadon Chiesa unter 35 Kondition."). Bei Niederlagen wo mehrere Signale feuerten — sagen wir Fatigue PLUS verschossene Chancen PLUS eiskaltes Verwerten des Gegners — schaffte nur das dominante Signal in die Headline; die anderen wurden still gedroppt.\n\nJetzt sammelt `computeMatchVerdict` jedes feuernde Signal und gibt die Top 3 zurück. Das erste wird die Headline (unverändert). Die nächsten zwei rendern als kleinere gedimmte italic Zeilen darunter, jede mit kleinem Punkt-Prefix — der Spieler bekommt also eine 2-3-Zeilen-Aufschlüsselung was wirklich passiert ist, nicht nur das schlimmste Einzelsignal.\n\nSiege überspringen die Sekundär-Ursachen — wir müssen einen Sieg nicht so dissektieren. Underdog-Moral-Wins (Unentschieden oder knappe Niederlage gegen klar stärkeres Team) bekommen das moralische Framing als Headline plus die tatsächlichen mechanischen Probleme als Causes — "Klar stärkeren Gegner gehalten — Punkte gegen den Favoriten." mit "Aufbauspiel stockte — nur 42% der Versuche fanden den Mitspieler." darunter. Beides wahr, beides nützlich.'
            }
          ]
        },
        {
          version: '0.59.0',
          title: 'Card-Description-Audit: Karten sagen die Wahrheit',
          entries: [
            {
              title: 'Sieben Karten haben über ihre Zahlen gelogen',
              body: 'Nach dem v0.57 Tactic-Description-Audit habe ich denselben Handler-vs-Description-Sweep auf Cards angewendet. Sieben Karten machen numerisch falsche Behauptungen:\n\n- **Eiskalt einschenken** sagte "+55 OFF" — der Handler liefert tatsächlich +30 OFF / +8 CMP plus einen garantierten Steilpass-Direct-Action. Die +55 waren nie erreichbar; der Steilpass fehlte in der Beschreibung.\n- **Entscheidungs-Schlag** sagte "+45 OFF / +8 CMP" — die echte Formel ist `min(35, 22 + lead*3)`, gedeckelt bei +35. Die +45 in der Beschreibung waren nie erreichbar; der veraltete Kommentar im Handler behauptete auch noch +40/+50/+60.\n- **Auf der Welle** sagte "+5 OFF pro Sieg, max +25" — die echte Formel ist `streak * 3` (max +15). 40% daneben.\n- **Hoffnungsschuss** sagte "+6 OFF nur bei Flow = 0" — der Handler macht KEINEN Stat-Buff. Die Karte ist eine 20%-Chance auf ein Glückstor-Direct-Action und sonst nichts.\n- **Alles auf eine Karte (doping)** sagte "Kondition +40, +14 OFF / +8 TMP, 25% Gelbe" — tatsächlich: Kondition +30, +10 OFF / +6 TMP Basis (+4 OFF bei aggressiv/tempo Tactic), 15-30% Backfire-Risiko nach Momentum moduliert, mit erzwungenem Backfire ab dem 3. Spiel im Match.\n- **Halbzeit** sagte "+8 CMP / +4 TMP" — tatsächlich +6 CMP / +3 TMP. 25% daneben.\n- **Kontern lassen** sagte "Nächster Gegner-Angriff: −18 OFF" — kein Opp-Debuff im Handler. Tatsächlich: +8 DEF / +4 TMP diese Runde, plus ein Flow +2 Outcome wenn der Gegner nächste Runde nicht trifft.\n\nAlle sieben Beschreibungen in EN, DE, ES neu geschrieben damit sie matchen was die Handler tatsächlich tun. Der veraltete Kommentar im killing_blow-Handler ist auch auf die echte Formel korrigiert.'
            },
            {
              title: 'Sechs weitere Karten dokumentieren jetzt versteckte Mechaniken',
              body: 'Beim Audit fanden sich sechs Karten mit Mechaniken, die der Spieler aus der Beschreibung allein nicht kennen konnte:\n\n- **Kompakte Ordnung**, **Linie halten**, **Keeper voraus** skalieren alle 1.3× wenn der Gegner eine telegraphierte Bedrohung geladen hat — belohnt das Lesen des Threat-Banners vor dem Defense-Karten-Spielen. Skalierung jetzt in der Beschreibung erwähnt.\n- **Gegenpressing** skaliert 1.5× wenn das Match-Momentum gegen dich läuft — Comeback-Amplifier. Beschreibung aktualisiert.\n- **Überlauf-Lauf** gibt heimlich +6 TMP zusätzlich zum OFF-Buff. Jetzt in der Beschreibung.\n- **Held des Spiels** gibt heimlich +6 CMP zusätzlich zum OFF-Buff. Jetzt in der Beschreibung.\n- **Vorwärtsdrang** kostet heimlich −4 CMP und bekommt +6 OFF bei aggressiv/tempo Tactics. Beides jetzt dokumentiert.\n\nDie Skalierung auf den drei telegraph-reaktiven Defense-Karten war eine bewusste versteckte Tiefenmechanik — der Spieler, der die Threat liest, bekommt die Belohnung — aber die Beschreibung hat das nie auch nur angedeutet. Jetzt kurz erwähnt ohne den exakten Multiplikator auszubuchstabieren, also bleibt Entdeckungsraum aber der Spieler weiß dass die Mechanik existiert.'
            }
          ]
        },
        {
          version: '0.58.0',
          title: 'Tactic-Modal-Redesign: Fakten oben, Intel als eine Liste',
          entries: [
            {
              title: 'Reihenfolge geändert: Header → Stats → Intel → Choices',
              body: 'Das Kickoff/Halbzeit/Final-Tactic-Modal hatte sein Layout verkehrt. Die Team-Stats-Referenz-Leiste (PHASE BUILD · OFF 51-77 · DEF 48-91 · ...) lebte am UNTEREN Ende des Modals, nach den Choice-Karten. Der Spieler sah also zuerst die Choices, scannte sie, und kam erst zur Fakten-Referenz wenn er sich mental schon für eine Option entschieden hatte. Der natürliche Entscheidungs-Flow ist umgekehrt — erst Fakten, dann Interpretation, dann Aktion.\n\nDie Stats-Leiste rendert jetzt direkt unter dem Subtitle, vor jedem Intel-Hint, vor der Choice-Liste. Die Intel-Hints (die diese Stats interpretieren) folgen. Die Choice-Karten kommen zuletzt — bekommen das maximale visuelle Gewicht, wenn der Spieler den Kontext hat, sie zu bewerten.\n\nNeue Reihenfolge: Header → Stats → Intel → Choices.'
            },
            {
              title: 'Drei konkurrierende Banner konsolidiert zu einer INTEL-Box',
              body: 'Die Intel-Hints zwischen Subtitle und Choices wurden als drei visuell unterschiedliche Elemente gerendert: eine italic graue Zeile ("Build-up läuft über PM vision/composure: 85 VIS / 67 CMP"), dann ein Grün-auf-Grün-Banner-Hint ("Nicolás hat den Pace-Edge"), dann ein Rot-auf-Rot-Banner-Hint ("Abwehr unter Druck"). Drei unterschiedliche visuelle Behandlungen, drei konkurrierende Severities, alle laut. Die italic-Zeile hatte keinen Severity-Marker; die Banner hatten volle farbige Backgrounds UND farbigen Text — die gleiche Severity wurde doppelt signalisiert über Border und Text-Farbe.\n\nNeues Design: ein Container, drei Zeilen, alle in derselben Form — ein 3px farbiger Border-Stripe links, dann grauer Text. Severity reitet allein auf dem Stripe (gedimmt-grau für neutral, grün für Opportunity, rot für Threat). Keine Background-Tints, kein farbiger Inline-Text. Der Container hat subtile gestrichelte Top/Bottom-Borders um ihn als Gruppe zu markieren.\n\nLiest sich jetzt als Liste, nicht mehr als drei um Aufmerksamkeit kämpfende Boxen.'
            }
          ]
        },
        {
          version: '0.57.0',
          title: 'Beschreibungs-Audit: Tactics sagen die Wahrheit',
          entries: [
            {
              title: 'Double Down amplified keine Debuffs mehr',
              body: 'Die Taktik sollte Momentum belohnen — pick sie wenn du einen Buff aktiv hast und Double Down verstärkt ihn um 40%. Der Handler nutzte `Math.abs()` um den größten Buff zu finden, was bedeutete: ein Tempo-*Debuff* von −7 (z.B. durch einen Opp Slow-Tempo-Trait) qualifizierte als "größter" und wurde auf −10 verstärkt. Spieler, die Double Down picken in Erwartung eines Buffs, sahen die Picker-Vorschau "−3 TMP" sagen und gingen zurecht "was?". Gefixt: nur positive Buffs zählen. Wenn nichts Positives ≥ 5 da ist, Fallback auf moderate +6 OFF / +6 DEF / +6 CMP. Description an die Logik angepasst.'
            },
            {
              title: 'Tactic-Beschreibungen sagen kein "permanent" mehr',
              body: 'v0.52 hat die Post-Match-Stat-Restoration eingeführt, um den Snowball-Bug zu fixen, bei dem Fortress, Lone Wolf, Masterclass & Co ihre Stat-Boosts permanent in den Run leaken. Der Fix funktionierte — aber sechs Tactic-Beschreibungen behaupteten weiter, der Boost sei "permanent" oder der Spieler "gewinnt dauerhaft" einen Stat. Sie haben seit v0.52 gelogen.\n\nAktualisierte Tactics — Umstellen, Aufrütteln, Opferlamm, Held des Tages — lesen sich jetzt als Match-Lange Boosts (die Wahrheit). Rollentausch-Beschreibung bekam die fehlende Personal-Stat-Notiz (LF +8 OFF, ST +8 TMP). Mind Games bekam die fehlende "für 2 Runden"-Duration auf den Opp-Composure-Debuff.'
            },
            {
              title: 'Log-Tooltips neu geschrieben — die Zeile lesen statt sie zu definieren',
              body: 'Hover-Tooltips auf Log-Zeilen definierten vorher die *Kategorie* ("Trait-Aktivierung — der Spieler-Effekt läuft jetzt in dieser Runde"), halfen dem Spieler aber nicht, die tatsächliche Zeile vor sich zu parsen. Sie sind jetzt Lese-Hilfen: jede sagt, worauf zu achten ist, wo die Werte stehen, und was die Klammern bedeuten.\n\nBeispiele:\n\n- **Trait feuert** → "Liest sich als: Spieler · Trait · Effekt. Buff-Werte stehen in Klammern."\n- **Karte aufgelöst** → "Lies die Stat-Chips einzeln. Phase-Chip zeigt Fit — grün = Boost, gold = neutral, rot = Misfit (Effekt halbiert)."\n- **Ermüdungskosten** → "Schwellen merken: <50 → −3 alle Stats, <25 → −6."\n\n17 Tooltip-Keys, alle drei Sprachen.'
            }
          ]
        },
        {
          version: '0.56.0',
          title: 'QoL-Welle: weniger Clutter, klarere Niederlagen, schnellere Runs',
          entries: [
            {
              title: 'Opp-Threat-Banner einzeilig',
              body: 'Das OPP-THREAT-Banner über dem Log brach regelmäßig auf zwei Zeilen. Die Verb-Phrase ("lädt nach", "baut auf") und die Trait-Beschreibung ("Stürmer erzwingt Tackle, +25 Angriff") standen inline neben Pin, Label, Severity-Dots und Trait-Name. Jetzt bleibt das Banner eine knappe Zeile — Pin, Label, Dots, Trait-Name, optionales TELEGRAPHED-Tag — und Verb-Phrase plus volle Beschreibung wandern in den Hover-Tooltip, wo sie Platz haben. Das Banner ist auf einen Blick lesbar.\n\nDas blinkende ⚠ in der Ecke telegraphierter Banner ist weg. Die Animation hat dieselbe Information dreifach signalisiert (Severity-Farbe + Tag + ⚠ + Blink), und die Bewegung hat mit dem Log-Inhalt daneben konkurriert. Das ⚠ bleibt als statisches, dezent abgedimmtes Glyph; das inline-TELEGRAPHED-Chip beschriftet bereits die handlungsrelevante Info.'
            },
            {
              title: 'Match-Ergebnis öffnet jetzt mit einem Verdict-Einzeiler',
              body: 'Verlieren war schwer zu lesen. Das Score und das Result-Tag haben gesagt was passiert ist, das Log hat den Hergang erzählt — aber das *Warum* lag dazwischen. Neu: der Result-Screen-Hero führt jetzt mit einer einzelnen kursiven Zeile, die die Telemetrie liest und auf die dominante Ursache zeigt.\n\nEine Prioritäts-Reihe wählt das aussagekräftigste Signal:\n\n- Gegen klar stärkeres Team gehalten → "Klar stärkeren Gegner gehalten — Punkte gegen den Favoriten."\n- Mehrere Starter unter 35 Kondition → "Dem Team gingen die Beine aus — Antony Dembélé, Jadon Chiesa unter 35 Kondition."\n- Aufbauspiel fand Mitspieler weniger als 50% → "Aufbauspiel stockte — nur 42% der Versuche fanden den Mitspieler."\n- Chancen kreiert, nicht verwertet → "9 Schüsse, ein Tor — Chancen kamen, die Verwertung nicht."\n- Opp eiskalt verwertet → "Ihre 3 Chancen brachten 3 Tore — eiskalt."\n- Generic Fallbacks pro Result-Typ für den Rest.\n\nFalsch-Positive werden gefiltert: Ein Sieg bekommt nie ein Fatigue-Verdict (du hast gewonnen, egal), ein Underdog-Moral-Verdict nur bei knappen Verläufen (löst nicht auf 4:1-Abrissen aus, in denen du zufällig leicht Favorit warst). Verdict-Farben passen zum Result-Ton (Grün für Siege, gedämpft-warm für Niederlagen, Gold für Draws).'
            },
            {
              title: 'Wahrscheinliche-Situationen-Panel erst ab Match 3',
              body: 'Das Wahrscheinliche-Situationen-Panel — Frame-Name + Likelihood-Dots + Konter/Hebel-Count — ist eines der dichtesten UI-Elemente im Matchup-Screen. Neue Spieler, die "GOALIE STREAK · ▰▰▰ · 2 HEBEL" anstarren während sie noch ihre Hand sortieren, hatten keine Chance es zu dekodieren. Das Panel wartet jetzt bis Match 3, spiegelt das v0.51-Trait-Severity-Gating der Gegner. Bis Match 3 ist das zweite Tutorial (v0.55) gelaufen, der Spieler hat ein Match komplett gespielt, und das Panel kommt erklärt rein. Frames laufen mechanisch von M1 — nur die Pre-Match-Vorschau wartet.'
            },
            {
              title: 'Schnell-Sim-Button für Routine-Fixtures',
              body: 'Mitten im Run trifft der Spieler oft auf ein Spiel, das er klar gewinnen sollte — Mittelfeld-Amateur, Win-Streak, +30% Power-Vorteil. Die Karten-Phase dauert trotzdem 4-5 Minuten, also fängt eine 7-Match-Pro-Liga-Saison an, sich nach Padding anzufühlen.\n\nNeu: ein ⏩ Schnell-Sim-Button taucht im Hub auf, wenn *alle* Bedingungen halten — 25%+ Power-Vorteil, kein Boss, kein Pokal, Win-Streak (≥1), Match 3 oder später. Ein Klick spielt das Match in wenigen Sekunden ohne Karten-Phase, Tactics werden aus der Empfehlungsslot automatisch gepickt, Animation beschleunigt. Fatigue tickt weiter, Opp-Moves feuern, Engine unverändert — nur der Spieler-Input ist eingeklappt.\n\nKonservativ auf Absicht: jede Bedingung muss halten, sonst Button verborgen. Pokal-Spiele, Boss-Matches und jedes Spiel wo der Spieler auch nur leicht unterlegen ist, gehen weiter durch den vollen Flow — die Momente, wo Entscheidungen zählen. Das Flag setzt sich nach jedem Match zurück, also ist Opt-In pro Match — nie ein Setting, das in wichtige Spiele rüberkippt.'
            }
          ]
        },
        {
          version: '0.55.0',
          title: 'Zweite Onboarding-Stufe',
          entries: [
            {
              title: 'Neu: "ein paar Dinge noch"-Overlay nach Match 2',
              body: 'Neue Spieler bekamen beim ersten Kartenzug ein 5-Punkt-Overlay zu Hand / Energie / Flow / Situationen / Zug beenden. Reicht für Match 1, ließ aber viel UI ungelesen — die Phase-Wörter im Runden-Header, die ★-Chips auf Karten, das Wahrscheinliche-Situationen-Panel das schon im Hub sichtbar ist.\n\nEin zweites Overlay erscheint jetzt einmalig zu Beginn der Kartenphase von Match 3. Nur drei Punkte, ohne Jargon: wie man PHASE im Runden-Header liest (ATTACK pusht Combos, DEFENSIVE pusht Defense), was der ★-Chip auf einer Karte bedeutet (erwarteter Tor-Impact diese Runde, ausgeblendet bei Soft-Disconnect), und der Unterschied Konter vs Hebel im Situations-Panel. Schließbar per Button oder Backdrop-Klick; via localStorage gespeichert damit Bestandsspieler es genau einmal sehen.'
            }
          ]
        },
        {
          version: '0.54.0',
          title: 'Pulse-Tile-Tooltip lokalisiert',
          entries: [
            {
              title: 'Pulse-Tile zeigte in EN/ES deutsche Texte',
              body: 'Der Matchday-Pulse-Tile-Tooltip listet die Quellen jeder Stat-Änderung (Kondition-Malus, Spielerform, Team-Form, Karten/Taktik-Buffs). Vier dieser Quellen-Labels waren hartkodierte deutsche Strings — "Kondition 42 → −3 alle Stats", "Form +1 → +2 OFF", "Team-Form → +3 alle Stats", "Karten/Taktik → +6 DEF, +2 OFF". Funktionierten auf DE, blieben aber in EN und ES unverändert deutsch stehen.\n\nNeue i18n-Keys `ui.match.pulseTipCondition` / `pulseTipForm` / `pulseTipTeamForm` / `pulseTipCardsTactic` halten die Templates. Jede Sprache bekommt ihre eigene Version mit der passenden Terminologie (`Condition` / `Kondition` / `Condición`; `Cards/Tactic` / `Karten/Taktik` / `Cartas/Táctica`). Dieselbe Hover-Zeile, die zeigt warum ein Stat abgefallen ist, liest sich jetzt in der aktiven Sprache korrekt.'
            },
            {
              title: 'Bestätigt: Kondition senkt Stats bei 50/25-Schwellen',
              body: 'Zur Erinnerung: die Kondition eines Spielers reduziert direkt alle fünf Stats, sobald sie zwei Schwellen unterschreitet. Unter 50 bekommen alle Stats −3. Unter 25 bekommen alle Stats −6. Der Malus wirkt jede Runde im Match, nicht nur beim Anstoß. Der Pulse-Tile-Breakdown zeigt genau diese Zeile, damit du die Ursache lesen kannst wenn ein Starter schwächer wirkt als seine Karten-Stats.\n\nDie Zwischenspiel-Recovery (≥60 → wieder 90, 40-59 → 80, 20-39 → 70, unter 20 → 55) existiert genau deswegen — um zu verhindern, dass Spieler über mehrere Matches in die −3/−6-Bänder rutschen. Ein überspielter Starter rotiert das normalerweise weg. Keine Mechanik-Änderung — nur Klarstellung eines bereits vorhandenen Systems.'
            }
          ]
        },
        {
          version: '0.53.0',
          title: 'Karten-Beschreibungen & Hebel-Semantik',
          entries: [
            {
              title: 'Karten zeigen keine rohen {st}-Platzhalter mehr',
              body: 'Lone Striker, Team Unity, Masterclass, Clinical Finish, Stone Cold und etwa 20 weitere Karten beschreiben ihre Effekte mit Rollen-Tokens wie "{st} Kondition ≥ 70" oder "+15 für {pm}". Die Flavor-Narration nach dem Spielen einer Karte ("{st} zieht alleine los — und trifft") hatte seit v0.39 einen funktionierenden Interpolator, aber die statische **Beschreibung** lief durch einen anderen Render-Pfad, der den i18n-Lookup ohne Variablen aufrief — Curly-Brace-Platzhalter blieben überall stehen, wo sie auftauchten.\n\nDie Screenshots, die das aufgedeckt haben: das Lone-Striker-Draft-Tile mit **"Wenn {st} Kondition ≥ 70: +22 OFF"** statt mit dem Spielernamen.\n\nNeuer Helper `UI.resolveCardDescription(cardId, match)` spiegelt den existierenden Flavor-Text-Interpolator. Sechs Call-Sites laufen jetzt durch ihn: Hand-Card-Body, Hand-Card-Unplayable-Tooltip, Deck-Panel-Tooltip, Codex-Karten-Liste, Team-Auswahl-Archetyp-Chips und das Card-Draft-Tile selbst. In einem laufenden Match siehst du echte Spielernamen ("Wenn Antony Dembélé Kondition ≥ 70…"); im Codex/Draft-Kontext, wo kein Squad bekannt ist, springen Rollen-Abkürzungen ein ("Wenn ST Kondition ≥ 70…"). So oder so: kein rohes `{st}` mehr.'
            },
            {
              title: 'Wahrscheinliche Situationen nennt nicht mehr alles "Konter"',
              body: 'Das Match-Vorbereitungs-Panel listete bis zu drei kommende Frame-Situationen mit einem Label rechts wie **1 KONTER** oder **KEINE KONTER**. Acht Frames werden getrackt, fünf davon — `GOALIE STREAK`, `SIE SIND ANGESCHLAGEN`, `HOT CORRIDOR`, `OPP STAR DOWN`, `OPP KEEPER UNSICHER`, `OPP DEFENSE GEDEHNT` — sind FÜR den Spieler. Karten, die einen Vorteil **ausnutzen**, "Konter" zu nennen ist das falsche Wort: Konter wehren Bedrohungen ab, Hebel cashen Vorteile ein.\n\nDas Label richtet sich jetzt nach der gleichen Severity-Map, die auch die Reihen-Farbe steuert:\n\n- **warn / danger** → "1 Konter" / "keine Konter"\n- **good / opportunity** → "1 Hebel" / "keine Hebel"\n\nTooltips auf Reihe und Chip ziehen mit. "Konter in deinem Deck:" wird zu "Hebel in deinem Deck:" bei guten Frames; der Zero-Count-Tooltip sagt "keine Karten, die diese Situation ausnutzen" statt "keine Karten, die diese Situation adressieren". Die Farbcodierung (`aip-tone-*` / `aip-sev-*`) war bereits in v0.45/v0.52 korrekt — das hier behebt die Wortwahl, die ihr widersprochen hat.'
            }
          ]
        },
        {
          version: '0.52.0',
          title: 'Snowball-Heilung: Tactic-Stats lecken nicht mehr',
          entries: [
            {
              title: 'Zehn Tactics mutierten Spieler-Stats permanent',
              body: 'Fortress, Lone Wolf, Masterclass, Hero Ball, Wing Overload, Wingman, Role Switch, Shift, Sacrifice, Shake-Up — zehn Kickoff/Halftime/Final-Tactics mutierten `player.stats.X` direkt, statt abklingende Buff-Layer zu pushen. Die Handler-Kommentare sagten "wirkt über Runde 6 hinaus" und meinten *innerhalb des Matches* — aber ohne Post-Match-Restore-Schritt sickerten die Boosts (und die zwei Debuff-Handler) dauerhaft in den Run.\n\nEin Telemetrie-Dump aus einem 14-Match-Pro-Liga-Run zeigte den kanonischen Fall: **ein Fortress-Pick in Match 5 hob die Defense des Keepers von 72 auf 99 und sperrte sie dort für die nächsten neun Spiele**. Die Score-Progression bestätigte die Folge: M1–M10 mit Ø 4.3:1.0, M11–M14 mit Ø 10.5:0.3. Das nicht zuzuordnende späte Snowball war das Leck.\n\nFix: jeder Starter-Stats-Wert wird vor dem Match per Snapshot festgehalten und am Ende restauriert. Tactics knallen weiter hart innerhalb des Matches (ihr beabsichtigtes Effekt-Fenster) — aber der Run-Schaden ist weg. Telemetrie aus einem v0.52-Run bestätigt rein organisches Wachstum: derselbe Keeper stieg über 12 Matches von 77 → 96 via Levels und Evolutions, kein Fortress-Carryover-Spike.'
            },
            {
              title: 'Tactic-Picker zeigt jetzt wo direkte Stat-Boosts landen',
              body: 'Die Kickoff/Halftime/Final-Picker-Vorschau las nur `match.teamBuffs`. Wenn Fortress +40 Defense **direkt auf** Keeper und Innenverteidiger schob, sagte die Vorschau `[OFF +4  DEF -25  COM -6]` — die +40 waren nirgends sichtbar, und schlimmer: war ein Spieler schon am 99er-Cap, verschwand der gesamte Boost lautlos.\n\nNeue Vorschau-Zeile macht die personellen Mutationen sichtbar: `→ Fortress  [OFF +4  DEF -25  COM -6]  (TW DEF +27, VT DEF +13)`. Die Deltas zeigen was wirklich gelandet ist — inklusive 99-Cap-Verluste (eine +40-Absicht zum +13 gekappt erscheint als +13, signalisiert den Cap leise). Wenn jede Mutation auf einem 99er-Cap landet und das Delta null ist, kommt keine Klammer — gleiches Bild wie Tactics ohne personelle Wirkung.'
            },
            {
              title: 'Telemetrie populiert Schuss/Aufbau/Save-Felder endlich',
              body: 'Das Post-Match-Telemetrie-Payload las aus Feldern, die nicht existierten (`match._shotsMe`, `_savesMe`, `_buildupAttempts`). Die Engine schreibt aber an einen anderen Pfad (`match.stats.myShots`, `match.stats.saves`, `match.stats.myBuildups`). Resultat: jede Telemetrie-Ausgabe hatte jeden Schuss-, Aufbau-, Save- und Trait-Fire-Count als 0 oder null, das nützlichste Balance-Audit-Signal war verdeckt.\n\nAn der Quelle gefixt. Das Payload enthält jetzt zusätzlich shotsOnTarget, Opp-Aufbau-Versuche/Erfolge und einen Durchschnittsbesitz-Wert. Trait-Fire-Totals splitten in `{me, opp, oppByTrait}` statt in einem nie befüllten Hash.'
            },
            {
              title: 'Likelihood-Dots in Situations-Panel folgen jetzt dem Titel',
              body: 'Frame-Titel wie `GOALIE STREAK` waren grün (Situation FÜR uns), aber die Likelihood-Dots daneben rot-orange (high-likelihood). Gleiche Reihe, widersprüchliche Signale. Severity gewinnt jetzt: grüne Dots bei guten Frames, rot bei Bedrohungen. Die Dot-Anzahl (▰▱▱ / ▰▰▱ / ▰▰▰) kodiert weiter Likelihood, unabhängig.'
            }
          ]
        },
        {
          version: '0.51.0',
          title: 'Amateur-Liga: Onboarding-Balance',
          entries: [
            {
              title: 'Match-1-Gegner-Power-Tier gekappt',
              body: 'Spieler-Reports zeigten Match-1-Amateur-Gegner mit Stat-Linien wie 65/104/140/67/81 gegen Starter-Kader von 52/72/61/63/68 — ein Tempo-Gap groß genug, dass das Eröffnungs-Spiel sich anfühlte wie eine Mauer. Ursache: der Round-Robin-Spielplan zog Gegner aus einer Power-Kurve, die Stärke über die ganze Saison verteilte (Matches 2 bis 9), so konnte das Worst-Case-Match-1-Spiel ein Tier-9-Gegner sein.\n\nDie Power-Kurve cappt jetzt bei Tier 6 in einer 8-Team-Liga. Worst-Case-Match-1-Power fiel von 502 auf 394 (Gap schrumpfte von +44% auf +19%). Side-Effect: ein veralteter Boss-Bonus-Check, der jedem Tier-7-Gegner +90 Stat-Boost gab, wurde wirkungslos (kein Gegner erreicht im normalen Spielplan jetzt diesen Tier).'
            },
            {
              title: 'Schwere Traits erst Mid-Season',
              body: 'Die Trait-Komplexität hing vom Power-Tier des Gegners ab, nicht von der Spielposition im Run. Ein Tier-6-Gegner in Match 2 konnte mit Severity-3-Traits aufkreuzen (Counter Specialist, Clutch Finisher) — verheerende Mechanik, gegen die der Spieler noch keine Counter-Karten hat.\n\nTrait-Severity ist jetzt nach Match-Nummer geclamped. Match 1: keine Traits überhaupt. Matches 2–5: max ein Trait, Severity 1–2. Matches 6–12: bis zwei Traits, Severity-3 freigeschaltet. Match 13+: volle Komplexität. Boss-Matches behalten ihre Aura — das sind die expliziten Schwierigkeitsspitzen.'
            }
          ]
        },
        {
          version: '0.50.0',
          title: 'Soft-Counter: Defense zählt endlich',
          entries: [
            {
              title: 'Defense-Karten als Soft-Counter getrackt',
              body: 'Die 0/36-defused-Telemetrie war irreführend — Defense-Karten wirkten jedes Mal mit Stat-Buffs (+6 DEF etc.), wurden aber nie als "Counter" gezählt. Nur explizite Shield-Trigger (wenn Opp-Trait gecancelt wurde) zählten.\n\nNeu: wenn du in einer Runde eine Defense- oder Counter-Karte spielst UND `teamBuffs.defense ≥ 8` aktiv ist, wird der Opp-Move als "soft-defused" getrackt. Du bekommst dazu eine neue Log-Zeile:\n\n> ✓ Defense-Puffer absorbiert Park the Bus — dämpft den Effekt.\n\nDie Kondition an beides (Karte gespielt UND Buff hoch genug) verhindert dass Defense-Karten ohne echten Buff (reine directAction-Karten) falsch als Counter zählen. Die Log-Zeile läuft als `player-shield`-Klasse — also wird automatisch im Telemetrie-Tracking als `defused: true` eingetragen.'
            },
            {
              title: 'Counter-System-Audit: Vollbild',
              body: 'Systematischer Check aller Karten mit "wartet-auf-Opp-Event"-Patterns:\n\n- 2 Karten mit `opp-trait-cancel`: ball_recovery, high_press_trap\n- 1 Karte mit `opp-trait-dampen`: wing_trap\n- 1 Karte mit `absorb-next-shot`: clutch_defense\n- 1 Karte mit `yellow-absorb`: desperate_foul\n- 1 Karte mit `bait-counter`: bait_counter\n- 3 Karten mit `intent-absorb`: block, preempt, pressure_trap\n- **20 Karten mit `flow-requirement`**: spielen Basis-Effekt wenn Flow<2, Premium-Effekt wenn Flow≥2\n- 10 Karten mit `lane-open`: Setup für folgende Karten\n\nDas ist ein größeres Thema als gedacht — besonders die 20 Flow-Karten haben dasselbe Tracking-Problem (Premium-Trigger ist oft unsichtbar). Das ist für ein eigenes Release — hier nur soft-counter für defense/counter-Cards.'
            }
          ]
        },
        {
          version: '0.49.0',
          title: 'Stat-Skalen-Fix, Early-Match-Entlastung',
          entries: [
            {
              title: 'Stat-Display engine-aligned — echter Skalen-Fix',
              body: 'Der Screenshot zeigte "OFF 46 vs 123" gegen einen amateur-Liga-Gegner — das sah nach riesiger Lücke aus, aber war ein Apples-vs-Oranges-Vergleich:\n\n**Unser Wert** kam aus `aggregateTeamStats()` = **Durchschnitt** der 5 Spieler (Avg-OFF ~46). **Opp-Wert** kam aus `opp.stats.offense` = **Team-Aggregat** aus dem Power-Split der Engine (~120). Beide Seiten auf unterschiedlicher Skala gegenübergestellt.\n\nDie Engine selbst rechnet aber **rollen-gewichtet**:\n\n- Offense: ST×0.50 + LF×0.28 + PM×0.22 (ST-zentriert)\n- Defense: VT×0.45 + TW×0.55 (nur defensive Rollen)\n- Tempo: LF×0.50 + ST×0.30 + PM×0.20\n- Vision: PM×0.42 + ST×0.18 + LF×0.18 + VT×0.12 + TW×0.10\n- Composure: Avg aller 5\n\nNeuer Helper `teamStatsEngineAligned()` stellt diese Gewichte exakt nach. Scorecard (Match-Vorschau im Hub), Match-Footer und Win-Probability nutzen ihn jetzt — keine verzerrte Lücke mehr. Die Preview zeigt endlich das was die Engine tatsächlich rechnet.'
            },
            {
              title: 'Opp-Moves: Severity-Cap in frühen Matches',
              body: 'Telemetrie + User-Feedback: "opp threats kommen in den ersten spiele zu früh, da hat man noch gar keine chance etwas zu blocken". Der alte `stageMin`-Filter ließ in M1 schon 4 severity-2 Moves zu (Quick Strike, Pressing Surge, Rage Offensive, Park the Bus) — zu hart wenn der Spieler noch kein Counter-Repertoire hat.\n\nNeuer Severity-Cap auf Match-Nummer:\n\n- **M1-2**: nur severity 1 (Overload Flank, Long Ball, Counter Blitz, Bunker, Training Focus, Captain Speech — "milde" Moves)\n- **M3-5**: bis severity 2 (Quick Strike & Co. wieder verfügbar)\n- **M6+**: alle Severities (bis 3, sobald stageMin erreicht)\n\nCup-Matches und Boss-Games umgehen den Cap nicht — kommen aber erst ab M5+. Ergebnis: Onboarding hat Luft zum Atmen, späte Matches bleiben scharf.'
            },
            {
              title: 'Counter-System-Audit: Klarstellung statt Re-Design',
              body: 'User-Frage: "wenn counter karten wirkungslos waren, trifft das auch auf andere beziehungen zu?". Audit der 10 Counter-Karten ergab:\n\n- 3 Karten (gegenpress, block, preempt) — **unconditional**: wirken immer direkt mit Stat-Buff\n- 3 Karten (ball_recovery, wing_trap, high_press_trap) — **pending**: setzen einen Flag, der nur triggert wenn Opp in dieser Runde einen Trait-Shot-Bonus spielt\n- 4 Karten (desperate_foul, bait_counter, pressure_trap, counterpunch) — **situational**: warten auf spezifische Events (gelbe Karte, Intent-Absorb, Counter-Blitz)\n\nDie 0/36-defused-Telemetrie kam von den pending- und situational-Karten — wenn das Event nicht auftritt, zählt nichts als "defused". **Aber**: die Stat-Buff-Wirkung lief trotzdem. `ball_recovery` gab trotzdem +6 DEF / +4 TMP diese Runde, auch wenn der Opp-Trait nicht feuerte.\n\nKein Re-Design jetzt — das würde Design-Balance-Work in großem Scope bedeuten. Aber das Tracking ist klar irreführend. Phase 2 wäre: Defense-Karten als soft-counter im Tracking zählen, damit das "defused" Signal nicht unterrepräsentiert ist.'
            }
          ]
        },
        {
          version: '0.48.0',
          title: 'Balance, Bar weg, Log-Tooltips',
          entries: [
            {
              title: 'Balance: Gegner-Ramp runter, Win-Confidence-Bonus',
              body: 'Telemetrie 0.44.0 zeigte Match-9/10-Wipeouts (0:5, 0:2) mit Opp-Defense 152/154. Zwei Schrauben (Balance Option C), zusammen geplant:\n\n**Gegner-Ramp geglättet**: Der saisonale Stat-Multiplikator der Gegner sinkt von +22% auf +18% am letzten Match. +0% bei M1, +8% Ende erste Runde, +18% beim letzten Match. Keine großen Kurvenknicke — nur etwas entspanntere Late-Season-Peaks.\n\n**Win-Confidence-Bonus**: Nach jedem Liga-Win +1 persistent auf alle fünf Team-Stats, capped bei +4 über die Saison. Draws/Losses ohne Straffaktor. Reset beim Saisonwechsel. Als match-weiter buffLayer (source: `confidence`, Range 1-6) — erscheint im Stat-Breakdown-Tooltip als Teil der Karten/Taktik-Zeile.\n\nNarrativ: Team spielt mit Selbstvertrauen nach Siegen, verliert aber das Momentum nicht durch einzelne Niederlagen. Effekt ist bewusst zart (+4 ist ~7-8% eines Basis-Stats bei 55) — spürbar, aber nicht snowball-artig.'
            },
            {
              title: 'Pulse-Tile-Bar entfernt',
              body: 'Die in v0.47 hinzugefügte Unicode-Bar-Skala (▰▰▰▰▰▰▱▱▱▱) ist wieder raus. Ohne harten Cap wie bei Fifa gehen Stats durch Karten- und Trait-Buffs über 99 hinaus (Base 88 + Buff +20 = 108) — die 10-Segment-Bar läuft dann über oder lügt. Das Base→Effective-Format mit Delta bleibt ("OFF 55→65 (+10)") — aussagekräftig auch ohne Bar.'
            },
            {
              title: 'Log-Zeilen bekommen Tooltips',
              body: 'Hover über Log-Zeilen zeigt jetzt eine kurze mechanische Erklärung der Kategorie. 17 Kategorien mit Tooltip: Trait-Trigger, eigene/gegnerische Karten, Counter-Schilde, Micro-Boosts, Kondition-Gain, Rollen-Affinität, Taktik-Feedback, Streaks, Opp-Save/Adapt, Fatigue-Kosten, Karten (gelb/rot), Phasen-Wechsel.\n\nBeispiele:\n\n> Trait-Aktivierung — der Spieler-Effekt läuft jetzt in dieser Runde.\n> Gegner-Karte — der Effekt wirkt. Counter/Defense-Karten können helfen.\n> Ermüdungskosten: Kondition fällt — Starter verlieren Stats spürbar.\n\nAdressiert Feedback "sollten nicht auch einige Logs tooltips erhalten?". Strukturelle Zeilen (Runden-Header, Anstoß) und selbsterklärende (Tore, Direct Actions) bleiben bewusst ohne Tooltip.'
            }
          ]
        },
        {
          version: '0.47.0',
          title: 'Transparenz: Stats, Counter, Traits',
          entries: [
            {
              title: 'Pulse-Tooltip: Gesamtwerte + Bar-Skala statt nur Deltas',
              body: 'Der Hover-Tooltip der Player-Pulse-Tiles zeigte bisher nur Stat-Differenzen ("DEF −4") — ohne Kontext wo der Wert absolut landet. Neu komplett überarbeitet: **alle 5 Stats** mit Base → Effective Pfeil und Unicode-Bar (10 Segmente, 0-99 → 0-10):\n\n> OFF 55→65 (+10) ▰▰▰▰▰▰▱▱▱▱\n> DEF 48→42 (−6)  ▰▰▰▰▱▱▱▱▱▱\n> TMP 72      ▰▰▰▰▰▰▰▱▱▱\n\nStats ohne Delta zeigen nur den aktuellen Wert, Stats mit Delta zeigen Base, Effective und Änderung. Tabular-nums sorgt dafür dass die Bars aligned bleiben.'
            },
            {
              title: 'Stat-Breakdown: Ursachen der Deltas',
              body: 'Unter der Stat-Liste steht jetzt ein Breakdown mit den **Quellen** der Änderungen:\n\n> Kondition 42 → −3 alle Stats · Karten/Taktik → +6 DEF, +2 OFF\n\nAdressiert direkt die Verwirrung "Karte sagt +8 DEF, aber der Stat ist tiefer als vorher". Gezeigte Quellen: Kondition-Malus (<50 = −3, <25 = −6), Spieler-Form (±2 pro Form-Stufe auf Focus-Stat), Team-Form-Bonus, aktive Team-Buffs aus Karten und Taktiken.'
            },
            {
              title: 'Counter-Hints beim Opp-Move-Telegraph',
              body: 'Telemetrie zeigte: in 36 Opp-Moves über 10 Matches wurde KEINER defused. Das Counter-System war für den Spieler unsichtbar — man wusste nicht welche Karte gegen welchen Move hilft. Neu: bei Telegraphs mit severity ≥ 2 erscheint eine zweite Log-Zeile mit dem Counter-Tipp pro Kategorie:\n\n> ▸ Albion Windhaven lädt: Bunker [●○○]\n>   ↳ Counter: Combo-Karte mit Flow ≥ 2 bricht die Mauer.\n\nKategorien: `aggressive` (Defense-Karten), `lockdown` (Combo mit Flow), `disruption` (Medic/Defense), `setup` (Trigger-Karten), `big` (Flow + Counter/Combo). Allgemein gehalten als Wegweiser, präzises Karte-pro-Move-Mapping ist Phase 2.'
            },
            {
              title: 'Trait-Kategorisierung im Player-Detail',
              body: 'Die 45 Player-Traits sind jetzt nach ihrem Timing gruppiert, mit farbigen Kategorie-Headern:\n\n- **Passiv** (cyan): permanent aktiv oder pro-Runde-Chance — 17 Traits\n- **Event** (gold): bei spezifischem Match-Event (nach Save, Gegentor, etc.) — 9 Traits\n- **Bedingt** (magenta): nur unter bestimmten Zuständen (R5-6, Tempo-Delta, bei Rückstand) — 13 Traits\n- **Einmalig** (grün): 1x pro Match oder Halbzeit — 6 Traits\n\nHover über den Kategorie-Header erklärt das Timing-Verhalten. Leichter zu erfassen wann welcher Trait greift — besonders bei Legendaries mit 2-3 Traits gleichzeitig.'
            },
            {
              title: 'Hub-Alerts über der Match-Progression',
              body: 'Sperren und kritische Warnungen erscheinen jetzt **über** der Saison-Progression-Reihe, nicht mehr zwischen Match-Vorschau und Akkordeon. Warnungen sollen früh im Blickfluss stehen, nicht beim Scrollen verschwinden.'
            },
            {
              title: 'Final-Match-Zelle: kein Sonderstil mehr',
              body: 'Die Final-Match-Zelle in der Progression wurde zuletzt v0.45 harmonisiert (solid + gedämpfter Gold-Tint). Jetzt ganz entfernt: Final-Matches sehen wie normale Match-Zellen aus. Erkennung läuft über Match-Nummer und Gegner-Informationen im Match-Hub, nicht über Tile-Chrome.'
            }
          ]
        },
        {
          version: '0.46.0',
          title: 'Sub-Pulse-Fix, Trigger-Glow & Tooltip-Klarstellungen',
          entries: [
            {
              title: 'Bugfix: Match-Pulse updated bei Einwechslung',
              body: 'Nach einem Halftime-Sub ("Zinedine Zidane on for Riyad Doku") blieb das Player-Pulse-Tile des Ausgewechselten stehen — alter Name, alte Rolle. Nur die Stat-Leisten am Footer wurden aktualisiert (v0.38-Fix), das Tile selbst nicht. Jetzt ruft der Sub `UI.replacePulseTile()` auf, das das alte Tile in-place durch ein frisches für den neuen Spieler ersetzt, inklusive Rolle/Name/Condition-Bar/Stat-Tip.'
            },
            {
              title: 'Trigger-Glow bei Trait-Aktivierungen',
              body: 'Trait-Trigger-Zeilen im Match-Log bekommen beim Erscheinen einen dezenten Gold-Flash (1.2s weich ausblendend), damit Aktivierungen nicht zwischen anderen Meldungen untergehen. Slide-in-Animation der übrigen Log-Einträge bleibt unverändert zart.'
            },
            {
              title: 'Tactical-Foul-Tooltip verständlicher',
              body: 'Der alte Tooltip ("+8 Defense, Gegner-Tempo -12. Stören statt verbessern.") war kryptisch. Neu mit klarerer Framing: Wer macht was (VT foult bewusst), mit welchem Preis (3 Kondition beim VT), und warum (Rhythmusbrecher, kein eigenes Spiel-Upgrade).'
            }
          ]
        },
        {
          version: '0.45.0',
          title: 'Match-End-Drama & UI-Bugfixes',
          entries: [
            {
              title: 'Dramaturgisches Match-End-Feedback',
              body: 'Der Abpfiff ist jetzt nicht mehr neutral. Vor dem Standard-Epilog kommt eine **zusätzliche narrative Zeile**, wenn das Match in eine memorable Kategorie fällt: Comeback, Collapse, Last-Minute-Tor/Gegentor, Shutout-Sieg/-Niederlage, Blowout, Nail-Biter, Goal-Fest-Unentschieden. Bei normalen Matches läuft wie bisher nur der Standard-Epilog.\n\nBeispiele:\n\n> Die Mannschaft dreht einen Rückstand in einen Sieg — 3:2. Chapeau.\n> Einbruch in letzter Minute — aus einer Führung wird Niederlage. 3:4.\n> Portière a cero — die Abwehr stand wie eine Mauer. 3:0.\n> Auf Messers Schneide verloren — 2:3. So nah dran.\n\n11 Kategorien × ~3 Varianten × 3 Locales. Erfordert eine neue per-round score-Timeline im Match-State (`match.scoreTimeline`), damit Comeback/Collapse-Detection funktioniert.'
            },
            {
              title: 'Bugfix: Codex-Legendary-Traits zeigten Raw-i18n-Keys',
              body: 'Beim Codex-Legendary-Overview wurden Trait-Namen wie "data.traits.big_game.name" roh angezeigt, weil der i18n-Lookup nur im `data.traits.*`-Namespace suchte. Legendary-spezifische Traits wohnen aber unter `data.legendaryTraits.*`. Fix: Lookup probiert jetzt erst `data.traits.*`, dann `data.legendaryTraits.*`, dann fällt zurück auf den Raw-Key.'
            },
            {
              title: 'Bugfix: Progress-Cell "final boss" Hintergrund-Abweichung',
              body: 'Die Final-Match-Zelle in der Match-Progression hatte ein linear-gradient, während alle anderen Zellen solides `--bg-3` nutzen. Das erzeugte einen visuell störenden Bruch in der Reihe. Neu: solid wie alle anderen Zellen, plus ein gedämpfter Gold-Tint via `box-shadow: inset`, damit die Final-Zelle erkennbar bleibt ohne visuell auszubrechen.'
            },
            {
              title: 'Bugfix: Probable-Situations — wer profitiert?',
              body: 'Im "Probable Situations"-Panel (Match-Vorschau im Hub) war nicht erkennbar ob eine Frame FÜR oder GEGEN uns läuft. "GOALIE STREAK" z.B. ist ein positives Event (unser Keeper in Form), wurde aber gleich neutral dargestellt wie negative Frames.\n\nNeu: Frame-Titel bekommt severity-basierte Farbe — grün für positive (good/opportunity), gelb für Warnung, rot für Gefahr. Die Counter-Anzahl rechts behält ihre eigene Tone-Färbung (Deck-Readiness), damit beide Achsen unabhängig lesbar bleiben.'
            }
          ]
        },
        {
          version: '0.44.0',
          title: 'Elfmeter, Abseits & Trait-Tooltips',
          entries: [
            {
              title: 'Elfmeter inline (1.5%)',
              body: 'Neue Tor-Situation: statt Normal-Angriff kann ein Elfmeter entstehen (1.5% Chance beidseitig, ca. 1 pro 20-30 Matches). **Inline** gelöst, kein Modal — die Sequenz läuft direkt im Match-Log.\n\nIntro → Outcome in zwei Narrative-Zeilen:\n\n> Foul im Strafraum! Der Schiedsrichter zeigt auf den Punkt — Elfmeter für uns.\n> Gakpo verwandelt souverän.\n\nDer **Schütze** ist der Spieler mit höchstem Composure (bei Gleichstand Offense). Der **Keeper** ist der Gegner-TW. Trefferwahrscheinlichkeit aus beiden Stats: Basis 73%, modifiziert durch Schütze-Composure/Offense (+) und Keeper-Defense (-), Spanne 55-92%. Drei Ausgänge: Tor, Parade, verschossen (Aluminium/Drüber). Tor wirkt wie normales Tor (Score +1, Momentum +30, matchPhase=buildup). Fehlschuss: Momentum neutral, matchPhase=transition.\n\nStats: myPenalties/oppPenalties + myPenaltiesScored/oppPenaltiesScored.\n\n4 Intro-Varianten pro Seite + 4 Goal + 4 Save + 4 Miss = 24 Elfer-Zeilen pro Locale, Anti-Wiederholung pro Match und pro Szene.'
            },
            {
              title: 'Abseits beidseitig (3%)',
              body: 'Parallel zum Lattentreffer: das Tor fällt, wird aber aberkannt. 3% pro Tor-Event, beidseitig. Fünf Varianten pro Seite:\n\n> Abseits! Gakpo war eine Schulter zu weit.\n> Die Fahne rettet uns — Kagawa stand drei Schritte vor der Linie.\n\nKein Score-Effekt, matchPhase=transition. Stats: myOffsides/oppOffsides.'
            },
            {
              title: 'Player-Trait Tooltips narrativ (45 Traits)',
              body: 'Alle 45 Player-Traits in allen 3 Locales von "Mechanik-first" auf "Narrativ-first" umgeschrieben, im gleichen Stil wie zuvor die Opp-Traits und Legendary-Traits. Beispiele:\n\n- Alt: "Einmal pro Match: erstes Gegentor wird annulliert."\n- Neu: "Aufstehen wie eine Katze, der erste Treffer prallt ab — einmal pro Match wird das erste Gegentor annulliert."\n\n- Alt: "Gesamtes Team bekommt +3 Composure."\n- Neu: "Gibt dem ganzen Team Ruhe auf dem Platz — jeder Mitspieler +3 Composure."\n\nDie Mechanik-Details bleiben erhalten (keine Stat-Änderung), nur der Tooltip wird erklärender und atmosphärischer. Namen der Traits unverändert.'
            }
          ]
        },
        {
          version: '0.43.0',
          title: 'Lattentreffer',
          entries: [
            {
              title: 'Beidseitiger Pfostenschuss (4%)',
              body: 'Fast-Tore haben jetzt ihr eigenes Drama: 4% Chance pro Tor-Event, dass der Schuss ans Aluminium geht statt ins Netz. **Beidseitig**: meine Schüsse können an Latte/Pfosten gehen (Frust-Moment "wäre fast rein") UND gegnerische ebenso (Erleichterung "nochmal Glück"). Netto Tor-Rate auf beiden Seiten um ~4% gesenkt, Balance bleibt gleich.\n\nDer Moment bekommt eine eigene Narrative-Zeile. Beispiele:\n\n> Aufbau über Seitenwechsel — Gakpo knallt ihn an die Latte.\n> Pfosten! Gakpo hat kein Glück.\n> Überlapp-Lauf setzt Gakpo frei — und nur der Pfosten.\n\nGegnerseite:\n\n> Pfosten! Kagawa war durch — und wir atmen auf.\n> Die Latte vereitelt Kagawas Schuss.\n> Pfostenschuss von Kagawa — der Ball rollt an der Linie entlang und weg.\n\n8 Varianten eigene Seite + 6 Varianten Gegnerseite pro Locale. Anti-Wiederholung pro Match separat pro Szene.'
            },
            {
              title: 'Stats: myPostHits / oppPostHits',
              body: 'Zwei neue Zähler in match.stats. Bisher nicht UI-exponiert, aber für spätere Telemetrie und potenzielle "Der Pfosten hasst dich heute"-Stats verfügbar.'
            }
          ]
        },
        {
          version: '0.42.0',
          title: 'Narrativ-Schicht: Tor-Aufbau',
          entries: [
            {
              title: 'Eigene Tore mit Aufbau-Kette',
              body: 'Bis jetzt: Karte legen, ⚽ Tor, fertig. Jetzt: vor dem Tor-Event erzählt das Spiel **wie der Angriff zustande kam** — basierend auf der letzten Setup-Karte, letzten Trigger-Karte und ggf. Combo-Karte aus dieser oder der Vorrunde. Beispiele:\n\n> Aufbau über Seitenwechsel — Gakpo vollendet.\n> Die Kette Seitenwechsel → Überlapp-Lauf, Gakpo verwertet.\n> Meisterwerk! Müller setzt den Schlusspunkt.\n\n9 Template-Varianten pro Locale, 16 Karten mit narrativem Hint. Anti-Wiederholung pro Match — gleiche Variante kommt nicht zweimal in Folge. Varianten, deren Platzhalter im aktuellen Match-State fehlen, werden automatisch aus der Auswahl gefiltert (kein "{setupHint}-Fallback"-Text).'
            },
            {
              title: 'Gegentore mit Kontext — "warum ließen wir das zu?"',
              body: 'Parallel zur Eigen-Tor-Narrative jetzt auch für Gegentore. Da der Gegner kein Karten-System hat, kommt der Kontext aus **unserem tactical state** beim Gegentor (waren wir aufgerückt, all-in, aggressiv, in Karten-Pause?) plus einem Hint aus aktiven schuss-thematischen Opp-Traits (Sniper, Konter, Clutch etc.). Beispiele:\n\n> Nach unserem Aufrücken — Kagawa schlägt zu.\n> Konter-Schlag trifft unser All-In-Vabanque — Gomez vollendet.\n> Typisch Scharfschützen-Schuss: Kagawa trifft.'
            },
            {
              title: 'Technische Infrastruktur: narrative-Modul',
              body: 'Neues `js/narrative.js` mit Szenen-Registry und Template-System. Jede Szene hat einen Varianten-Pool mit Anti-Wiederholung pro Match. Eigenes Log-Tier `is-narrative` mit dezenter Kursiv-CSS. Engine-Hooks sind defensive in try/catch — Narrativ darf nie Engine-Flow blockieren. Infrastruktur steht jetzt als Fundament für weitere Szenen (Lattentreffer, Verletzung, Elfmeter in kommenden Releases).'
            }
          ]
        },
        {
          version: '0.41.0',
          title: 'Tooltip-Politur Runde 2',
          entries: [
            {
              title: 'Roster-Chips im Team-Auswahl mit Tooltip',
              body: 'Die 5 Archetyp-Chips im Team-Auswahl-Screen ("Blocking Keeper", "Sweeper-Verteidiger" etc.) waren nur Labels ohne weitere Info. Jetzt mit Tooltip: Rolle (Abkürzung), Stat-Profil komplett, und die zwei stärksten Stats hervorgehoben. Wenn ein Archetyp-Beschreibungstext in der i18n existiert, steht der zusätzlich drin.'
            },
            {
              title: 'Opp-Trait-Beschreibungen neu geschrieben',
              body: 'Alle 13 Gegner-Trait-Descriptions waren Stat-Specs ("+8% Schussgenauigkeit"), null Atmosphäre, null Spielverständnis. Jetzt narrativ-angeführt mit Mechanik als Anker: "Drückt den Abschluss mit Präzision durch — jeder Schuss landet 8% häufiger gefährlich beim Keeper." Betrifft sturm, riegel, konter_opp, presser_opp, clutch_opp, lucky, ironwall, sniper, boss_aura, bulwark, counter_threat, rage_mode, pressing_wall — alles in DE, EN und ES.'
            },
            {
              title: 'Legendary-Trait-Beschreibungen neu geschrieben',
              body: 'Die 8 Legendary-Traits wurden im gleichen Format überarbeitet. Aus "Pro erfolgreichem Aufbau: +8% auf das nächste Tor." wird "Jeder Pass ebnet den nächsten. Jedes erfolgreiche Aufbau-Spiel erhöht die Tor-Wahrscheinlichkeit des nächsten Abschlusses um +8%." Gilt für: god_mode, clutch_dna, field_general, unbreakable, big_game, conductor, phoenix, ice_in_veins.'
            }
          ]
        },
        {
          version: '0.40.0',
          title: 'Team-Identität & Tooltip-Politur',
          entries: [
            {
              title: 'Team-Wahl: archetypische Starter-Decks',
              body: 'Bis 0.39 war die Team-Auswahl beim Run-Start praktisch kosmetisch — andere Legendaries auf der Bank, identisches Deck für alle. Ab sofort prägt jedes der vier Teams sein Deck mit **4 archetypischen Karten** (plus 10 gemeinsame Core-Karten), sodass die Team-Identität von Match 1 spürbar ist:\n\n- **Konter-Spezialisten:** hope_shot, long_ball, ball_recovery, grind_through — direkter Konter-Fußball\n- **Kraftpaket:** long_ball, deep_defense, grind_through, lone_striker — physische Zermürbung mit Target-Striker\n- **Technik-Magier:** masterclass, triangle_play, clinical_finish, quick_scout — combo-dichtestes Deck, visions-lastig\n- **Pressing-Bestien:** forward_burst, high_press_trap, counterpunch, running_hot — aggressive Trigger + zwei Counter\n\nIm Team-Auswahl-Screen sind die 4 Karten jetzt als farb-kodierte Chips sichtbar (Border-Color nach Kartentyp), mit Tooltip pro Karte.'
            },
            {
              title: 'Recruits: stratifizierte Angebote + Bias auf schwache Rolle',
              body: 'Legendary-Angebote nach Boss-Matches waren drei uniform-zufällige Picks — ein Team das keinen Stürmer braucht konnte durch Pech trotzdem drei ST-Legendaries angeboten bekommen. Jetzt **drei unterschiedliche Rollen garantiert**, und ein Slot hat **Bias auf die Rolle des schwächsten Starters**, sodass das Angebot immer einen plausiblen Kaderlücken-Füller enthält. Bewusst NICHT team-thematisch: Legendary-Traits und Evolutionspfade bleiben voll zufällig, damit Hybrid-Builds und überraschende Synergien weiter möglich sind.'
            },
            {
              title: 'UI: Deck-Panel-Chips entmehrdeutigt',
              body: 'Die Chips im Deck-Panel ("2 MASTERCLASS" / "1 BREATHER") haben die Energie-Kosten links vom Namen gezeigt — visuell ununterscheidbar von einer Kopien-Anzahl. Player konnten nicht sicher sagen, ob "2" = "kostet 2 Energie" oder "2 Karten dieses Typs im Deck". Fix: **⚡-Prefix** ("⚡2 MASTERCLASS"). Duplikate werden weiter separat als "×N" rechts angezeigt. Plus erweiterter Tooltip pro Chip: Name, Typ, Energie-Kosten, Fatigue-Kosten, Anzahl-Kopien — alles strukturiert.'
            },
            {
              title: 'UI: Fehlende Tooltips an Chips gefüllt',
              body: 'Drei sichtbare Chip-Klassen hatten keine Tooltips — der Spieler sah Markierungen, aber nicht warum. Jetzt mit erklärendem Tooltip: **Gegner-Key-Player** (welcher Spieler ist die Hauptbedrohung und warum), **Focus-Chip** bei taktischen Entscheidungen (welcher Spieler wird geboostet und weshalb), **Halbzeit-Mechanik-Tag** (was bleibt in der zweiten Halbzeit aktiv).'
            }
          ]
        },
        {
          version: '0.39.0',
          title: 'Deck-Breiten-Fixes',
          entries: [
            {
              title: 'Balance: switch_lane entdominiert',
              body: 'Die 0.37-Telemetrie zeigte **switch_lane bei 59 von 155 gespielten Karten = 38%** — die Karte stapelte drei Utilities in einer cost-1-Karte: Flow, Lane-Öffnung und +8/+4 Stats. Jede Hand griff sie zuerst, andere Setup-Karten (drop_deep, quick_build) wurden dreimal seltener gespielt. Fix: **laneOpen nur noch, wenn Flow ≥ 1 aufgebaut ist**, und die Fatigue-Kosten steigen von 3 auf 4 (passt sich der Defense-Rebalance aus 0.37 an). Ein Turn-Start-switch_lane bleibt nützlich als plain Setup; die Lane öffnet sich erst als Kette nach einem anderen Flow-Geber.'
            },
            {
              title: 'Balance: Draft-Pool stratifiziert',
              body: 'Bis 0.38 gab der Draft-Pool (58 Karten über 6 Typen) die 3 Angebotskarten uniform verteilt — dicke Typen wie Setup (21% des Pools) zeigten sich in 72% aller Drafts, dünne wie Draw (10%) nur in 24%. Über eine 11-Draft-Saison blieben Counter/Draw-Archetypen oft **komplett unsichtbar**. Fix: jeder Draft bietet jetzt **3 unterschiedliche Typen** — die Wahrscheinlichkeit einen Draw-Archetyp zu sehen steigt von 24% auf ~42% pro Draft. Kleiner Trade-off: keine Drafts mehr mit dreifach Setup — das ist akzeptabel, da das Starter-Deck ohnehin setup-lastig ist.'
            }
          ]
        },
        {
          version: '0.38.0',
          title: 'Kondition & Tooltips',
          entries: [
            {
              title: 'Balance: Kondition-Stuck-State aufgelöst',
              body: 'Die 0.37.0-Telemetrie zeigte ein Todesschleifen-Muster: drei Starter blieben ab Match 4 für den Rest der Saison bei 45/100 Kondition hängen — das war genau der Wert der `<20 → 45`-Recovery-Stufe und gleichzeitig unter der 50er-Schwelle, ab der -3 auf alle Stats greift. Ende des Matches unter 20 → zurück auf 45 → im nächsten Match mit -3 Malus gespielt → wieder unter 20 → Kreislauf. Recovery-Kurve um +10 angehoben: light use 88 (vorher 82), moderate 76 (70), heavy 65 (58), überspielt 55 (45). Kritisch: **der neue Boden bei 55 liegt über der 50er-Schwelle**, ein überspielter Spieler startet zwar müde ins nächste Match, aber ohne Permamanent-Malus.'
            },
            {
              title: 'UI: Rollen-Abkürzungen konsistent',
              body: 'Die Condition-Chips an Handkarten und die Fatigue-Übersicht im Card-Mode zeigten noch die internen Rollen-Codes TW/VT/PM/LF/ST statt der Spieler-Abkürzungen GK/DF/PM/WG/ST. Jetzt konsistent über das ganze UI.'
            },
            {
              title: 'UI: Fatigue-Warnzeile im Card-Mode aufgeräumt',
              body: 'Die "💨 FATIGUE"-Zeile unter dem Phase-Banner hatte kein CSS — Label und Spieler-Chips klebten aneinander ("FATIGUELF Gakpo"), dazu erschien sie bei jedem Spieler unter 40 Kondition (zu viele Fehlalarme, weil die Per-Karten-Chips dieselbe Info schon lieferten). Jetzt mit sauberem Layout, und nur sichtbar wenn jemand unter 30 Kondition (also kurz vor oder in der Gefahrenzone) ist.'
            },
            {
              title: 'UI: Gegner-Trait-Tooltips vervollständigt',
              body: 'Fünf Gegner-Traits (Bollwerk, Doppel-Konter, Rage-Modus, Pressing-Wand, Boss-Aura) hatten keine Tooltips — der Rendering-Code prüfte nur die "oppTells"-Übersetzungstabelle, und die fünf standen dort nicht. Jetzt alle 13 Traits mit Action-orientierter Tooltip-Beschreibung.'
            },
            {
              title: 'UI: Stat-Malus durch Fatigue in Spieler-Tooltip',
              body: 'Der Tooltip auf der Condition-Leiste einer Spielerkarte zeigt jetzt ganz oben den **aktuell aktiven Stat-Malus**: "Critical fatigue — all stats currently reduced by 6" bei <25, "-3" bei <50. Die Recovery-Erklärung dahinter ist auf die neuen Werte (88/76/65/55) aktualisiert.'
            },
            {
              title: 'Fix: Match-Pulse reagiert jetzt auf Einwechslungen',
              body: 'Nach einer Halbzeit-Einwechslung zeigte die Stat-Leiste und die Spieler-Pulse-Punkt-Reihe weiter den ausgewechselten Spieler, bis das nächste Ereignis (Tor, Rundenwechsel) ein Re-Render auslöste. Jetzt wird direkt nach dem Sub neu gezeichnet.'
            }
          ]
        },
        {
          version: '0.37.0',
          title: 'Balance-Validierung & Reload-Fixes',
          entries: [
            {
              title: 'Spieltest zeigt: Snowball-Fix greift, aber unvollständig',
              body: 'Zweiter Testrun unter 0.36 (Spammen statt taktisch) lieferte erstmals **eine Niederlage** (2:6 gegen das stärkste Ligateam) und **zwei Unentschieden** — gegen 0.35.0 wo 11/11 Spielen ohne Gegenwehr gewonnen wurden. Liga-Tabelle zeigt jetzt echte Bandbreite (Gegner-Power 329-583 statt flach 330-347). Buff-Cap-Treffer sind von 22% auf 11% der Kartenaktionen gefallen. **Noch offen:** gegen mittelstarke Rückrunden-Gegner kippen Matches immer noch in 9-0 / 10-1 — das ist nicht nur eine Gegner-Skalierungsfrage, sondern auch eine Frage der Spieler-Deckzusammensetzung.'
            },
            {
              title: 'Balance: Defense teurer, Combos billiger',
              body: 'Telemetrie zeigte verkehrte Anreize: Defense-Karten waren mit Ø 3.1 Fatigue/Play die günstigsten UND meistgespielt (41% aller Aktionen), Combos mit Ø 6.4 Fatigue die teuersten und seltensten (6%). Stabilität sollte kosten, Payoff sollte zugänglich sein — bisher war es umgekehrt. Defense-Kernkarten (tight_shape, hold_the_line, block, deep_defense, pressure_trap) jetzt bei 4, Top-Combos (masterclass, stone_cold, break_the_line, late_winner, final_whistle, lone_striker) auf 5 reduziert. Recovery-Karten (breather, medic) bleiben bei 0.'
            },
            {
              title: 'Balance: Combo-Karte im Starter-Deck',
              body: 'Das Starter-Deck enthielt nur **eine** Combo-Karte (hero_moment) unter 13 Karten — Combo-Dichte 7.7%. Damit kamen Combo-Payoffs in den ersten 9-10 Matches kaum zum Tragen, die Setup→Combo-Pipeline blieb unsichtbar. `masterclass` kommt dazu — 2/14 = 14% Combo-Dichte, Combos jetzt von Match 1 an erlebbar.'
            },
            {
              title: 'Telemetrie: Tore und Gegner-Karten werden jetzt erfasst',
              body: 'Die Aufzeichnung hatte zwei Lücken — `recordGoal` und `recordOppMove` waren definiert, aber die Engine rief sie nie auf. In der 0.36.2-Auswertung standen 0 Tore und 0 Gegner-Moves in der JSON-Datei, obwohl real 51:15 gefallen waren. Fix: beide Events werden jetzt direkt aus dem Log-Stream abgeleitet (Log-Klassen `goal-me`/`goal-opp`/`opp-card`/`player-shield`). Keine Engine-Änderung, voll rückwärtskompatibel. Zukünftige Test-Runs liefern vollständige Daten.'
            },
            {
              title: 'Fix: Deck verliert Karten beim Fortsetzen',
              body: 'Bei einem Tab-Reload zwischen zwei Matches kamen Spieler mit teilweise leerem Deck zurück ins Spiel — 2 Karten oder gar 0 statt der erwarteten 20. Ursache: der Autosave beim Hub-Entry sicherte nur `_cardDeck` (den Ziehstapel), nicht `_cardDiscard` (den Ablagestapel). Nach 6 Runden sind ~16 Karten im Ablagestapel und nur ~4 im Ziehstapel — beim nächsten Match-Start werden die merge, bei fehlendem Ablagestapel blieben nur 4. Fix: Ablagestapel wird jetzt mitpersistiert. Laufende Saves vor diesem Update sind betroffen — ein Neustart stellt den korrekten Zustand wieder her.'
            },
            {
              title: 'Fix: Tabelle — eigene Zeile nicht mehr grün',
              body: 'Die eigene Mannschaft wurde in der Liga-Tabelle mit derselben grünen Farbe hinterlegt wie die Aufstiegszone (Top 2). Auf Platz 3 stehend sah die Zeile dadurch aus, als wäre man in Aufstiegsreichweite, obwohl nur Top 2 aufsteigen. Eigene Zeile jetzt in **Cyan** statt Grün — klar erkennbar als Identitätsmarker. Zonenfarben (Grün/Rot) bleiben für Aufstieg/Abstieg reserviert.'
            }
          ]
        },
        {
          version: '0.36.0',
          title: 'Snowball-Fix',
          entries: [
            {
              title: 'Balance: Rückrunde skaliert mit',
              body: '0.35.0 Telemetrie zeigte einen Cliff bei Match 7: davor realistische 1-3 Tore, danach 10-12 Tore pro Spiel. Vier gezielte Fixes gegen den Power-Creep: **Gegner skalieren jetzt innerhalb der Saison** — die Liga hat eine echte Tabelle mit schwachen und starken Teams (statt alle bei gleichem Power-Level), und Rückspiele bringen dynamisch bis zu +22% Gegner-Power mit, proportional zum Spielfortschritt. **Team-Buffs haben jetzt Diminishing Returns** — über +15 pro Stat zählt jede Zugabe nur noch halb, statt am harten +25-Cap zu kleben. **Wiederholte Kartenaktionen im selben Match dämpfen sich** — zweites set_piece nur 80% Wirkung, drittes 60%, ab viertem Floor bei 40%. **Kondition-Regeneration strenger** — Starter landen nach einem harten Match bei 58 statt 70, Rotation wird echter Hebel.'
            }
          ]
        },
        {
          version: '0.35.0',
          title: 'Beta-Launch',
          entries: [
            {
              title: 'Beta-Phase & Test-Run-Recorder',
              body: 'Das Spiel ist offiziell in der **Beta**. Für Balance-Tests gibt es einen optionalen **Test-Run-Recorder**: aktivieren mit `?telemetry=1` im URL-Query (oder `KL.telemetry.setEnabled(true)` in der Konsole). Aufgezeichnet werden alle Matches eines Runs — Gegner-Kontext, Aufstellung, Runden-Phasen, jede Kartenaktion mit Fatigue und Multiplikatoren, jede taktische Entscheidung, Gegner-Moves und ihre Defusal, Tore und Post-Match-Stats (Schüsse, Conditions, Trait-Fires). Export als strukturiertes JSON über den Footer-Link, sobald mindestens ein Match gespielt wurde. Daten bleiben lokal; nichts wird hochgeladen.'
            },
            {
              title: 'Run fortsetzen',
              body: 'Runs überleben jetzt Tab-Schließen und Browser-Neustart. Im Startmenü erscheint ein **Run fortsetzen**-Button mit Zusammenfassung (Team · Liga · Saison · Match · Bilanz), sobald ein Speicherstand existiert. Ein neuer Run bittet vorher um Bestätigung, damit der Speicherstand nicht versehentlich verloren geht.'
            },
            {
              title: 'Kondition auf Handkarten sichtbar',
              body: 'Der Kosten-Chip auf jeder Karte zeigt jetzt, **wer** die Kondition zahlt und **wohin** sie fällt: `⚡−4 ST 32→28` statt nur `⚡−4 ST`. Farblich abgestuft — neutral, gelb ab unter 50, rot ab unter 25 — passend zu den Stat-Mali der Engine. Karten in Ketten kosten zusätzlich: der Tooltip zeigt jetzt die Aufschlüsselung ("Plays kosten 6 (Basis 2 + 4)"), damit die höhere Zahl nicht willkürlich wirkt.'
            },
            {
              title: 'Fix: Defense-Stretched-Frame hatte Leereffekt',
              body: 'Das Card-Mode-Frame "Gegnerische Abwehr gedehnt" versprach einen Aufbau-Malus gegen den Gegner in der nächsten Runde, setzte aber nur den Rundenzähler ohne Stärke. Das Team-Buff (+8 OFF / +6 VIS) wirkte — der angekündigte Aufbau-Malus nicht. Jetzt wird beides gesetzt.'
            },
            {
              title: 'Fix: Timed-Effect-Counter im Card-Mode',
              body: 'Vier Rundenzähler (Aufbau-Malus, Stürmer-Malus, Schuss-Malus, Keeper-Zone) wurden im Card-Mode nie heruntergezählt — und im Nicht-Card-Mode lief der Dekrement eine Runde zu früh. Effekte mit **Dauer 2 Runden** lebten deshalb oft nur eine Runde. Korrigiert; Effekte halten jetzt die angekündigte Anzahl Runden.'
            },
            {
              title: 'Speicherstände an Release gekoppelt',
              body: 'Speicherstände sind jetzt fest an die Spielversion gebunden. Ein neuer Release verwirft alte Stände sauber statt in einen Zustand zu laden, in dem Karten oder Balance nicht mehr passen. Highscore und Codex-Fortschritt bleiben erhalten.'
            }
          ]
        }
      ]
    },
    telemetry: {
      emptyNotice: 'Noch keine Test-Run-Daten. Spiel mindestens ein Match mit aktiviertem Recorder.',
      downloadFailed: 'Download fehlgeschlagen. Details in der Browser-Konsole.'
    },
    manual: {
      title: 'KICKLIKE · Anleitung',
      close: '✕ Schließen',
      sections: [
        {
          title: 'Saison & Liga',
          body: 'Eine Saison sind vierzehn Spiele — jedes andere Team einmal daheim, einmal auswärts. Oben zwei landen: du steigst auf. Unten zwei: das Beil fällt.\n\nEin voller Run klettert drei Stufen hoch: Amateur-Liga, dann Profi-Liga, dann der Pokal. Jeweils acht Teams pro Liga, drei K.-o.-Runden im Pokal. Rund einunddreißig Matches, wenn du alles durchspielst.\n\nZwei Wege, einen Run vor dem Ende zu verlieren:\n\n- **Negativserie.** Drei Spiele in Folge ohne Punkt, und der Trainer fliegt. Keine Warnung, keine Berufung.\n- **Amateur-Abstieg.** Unten zwei in der Amateur-Liga, und der Run endet — tiefer geht\'s nicht.'
        },
        {
          title: 'Match-Ablauf',
          body: 'Sechs Runden pro Spiel, je etwa fünfzehn simulierte Minuten. Du wählst den Auftakt beim Anstoß, reagierst zur Halbzeit, bestimmst das Ende in der Schlussrunde — drei echte Entscheidungen. Die anderen siebenundachtzig Minuten laufen auf Kader-Stats, Trait-Auslösern und den Karten, die du spielen konntest.\n\nJede Runde steht in einer Phase — Aufbau, Ballbesitz, Angriff, Umschaltspiel, Regeneration, Defensive — und die Phase kippt mit dem Momentum. Dieselbe Combo-Karte brüllt im ANGRIFF und murmelt in der DEFENSIVE. Lies das Spiel, setze deine Karten im richtigen Moment.\n\nÜber dem Log sitzt das OPP-THREAT-Banner: was der Gegner diese Runde auflädt. Jede Runde zieht er **einen Move** aus seinem eigenen Deck — Angriffswelle, Lockdown, Disruption, Setup oder Big-Move — und das Banner zeigt ihn mit Schwere-Grad von einem bis drei Punkten an. Ein Punkt ist Hintergrundrauschen. **Zwei oder drei Punkte sind telegraphiert** — eine Konter- oder Block-Karte in derselben Runde streicht den Move durch, und "DEFUSED" landet im Log. Drei-Punkt-Big-Moves treffen am härtesten: garantierte Tore, Dreifach-Angriffe, dreirundige Offensiv-Wellen. Ungeblockte Big-Moves brechen Matches. Lies das Banner und halte eine Block- oder Clutch-Defense-Karte für den richtigen Moment bereit.'
        },
        {
          title: 'Karten & Energie',
          body: 'Jede Runde ziehst du vier Karten und bekommst drei Energie. Ausgeben, nicht horten — Energie verfällt beim Pfiff, ungespielte Karten landen im Ablagestapel (außer sie tragen das *retain*-Tag). Jede Karte entzieht beim Spielen einem passenden Stammspieler Kondition; wer zur Karte passt, trägt die Last.\n\nSechs Kartentypen, jeder mit einer Aufgabe:\n\n- **Setup** baut den Angriff auf. Öffnet Bahnen, erzeugt Flow.\n- **Trigger** zündet jetzt einen Effekt — das Arbeitstier unter den Stat-Boosts.\n- **Combo** braucht erst Setup-Vorarbeit, zahlt dann hart aus.\n- **Defense** stabilisiert Keeper und Kette.\n- **Counter** bestraft geladene Gegner-Drohungen.\n- **Draw** macht aus einer Karte mehrere.\n\nDarüber liegen die Phasen-Multiplikatoren. Eine Combo-Karte brüllt im ANGRIFF und murmelt in der DEFENSIVE. Die meisten Decks erreichen den Angriff, indem sie zuerst eine Setup-Karte spielen — ein Combo-geladenes Deck ohne Anker trifft den Angriffs-Bonus selten. Plane mindestens einen Setup.\n\n**Reaktive Karten** erscheinen im Draft-Pool, während der Run voranschreitet — Kabinenruf (Medic) heilt ein gefoultes Opfer, Pokerface macht die nächste Karte disruptions-immun, Clutch-Defense blockt einen angekündigten Big-Move garantiert, Konter-Gegenkonter dreht ihren Konter um, Kette durchbrechen zertrümmert einen Lockdown, Scouting-Bericht enthüllt die nächsten zwei Gegner-Moves. Still an den meisten Runden, entscheidend an den falschen. Baue ein paar in dein Deck, bevor du die Profi-Liga erreichst.\n\n**Mulligan.** Startblatt nicht im Griff? In Runde 1, *bevor* du etwas spielst, kannst du die ganze Hand abwerfen und neu ziehen. Einmal pro Spiel, kostenlos.\n\n**Skip-Kosten.** Eine Runde ohne gespielte Karte ist nicht gratis. Das Team wirkt unkoordiniert — alle fünf Stats leiden in dieser Runde, und ein Tempo-Malus klebt für den Rest des Matches. Der erste Skip ist mild; zwei oder drei häufen sich übel.\n\n**Diminishing Returns.** Mehrere Karten in einer Runde zu spielen lohnt sich, aber ab der zweiten dämpfen die Stat-Boni — 82%, 64%, 46%, Untergrenze 35%. Spam ist möglich, aber weniger profitabel als kontrolliertes Spiel. Ein Team-Buff ist zusätzlich bei ±25 pro Stat pro Runde hart gedeckelt — Stacking in die Stratosphäre ist keine Strategie mehr.\n\n**Chain-Bonus.** Drei verschiedene Kartentypen in einer Runde — das Team greift ineinander: *VERSATILE PLAY*, ein flacher Stat-Bump über die Bank. Vier oder fünf Typen werden zu *TOTAL FOOTBALL* — spürbar stärker. Decks, die einen Typ stapeln, sehen hübsche Synergie-Zahlen und verlieren den Chain-Bonus. Absicht zur Vielfalt zahlt sich aus.'
        },
        {
          title: 'Deck-Building über den Run',
          body: 'Nach fast jedem Spiel verändert sich dein Deck. Eine Draft-Entscheidung pro Match, Modi wechseln sich ab:\n\n- **Add** — drei neue Karten auf dem Tisch, eine behältst du.\n- **Remove** — eine Karte rauswerfen, die dich nervt.\n- **Upgrade** — eine Karte dauerhaft verstärken.\n- **Replace** — eine raus, eine rein.\n- **Evolution** — bei bestimmten Meilensteinen (Spiel sechs und dreizehn) eine Rollen-Spezialisierung statt Karten.\n\nBoss-Spiele sind die Ausnahme: wer gewinnt, darf **zwei** Karten statt einer ziehen. Nach dem Saisonfinale gibt\'s keinen Draft mehr — die neue Saison startet frisch.'
        },
        {
          title: 'Kondition & Ermüdung',
          body: 'Jeder Stammspieler trägt eine Fitness-Anzeige, die während des Runs langsam leerer wird. Karten entleeren den passenden Spieler — der Stürmer zahlt, wenn du einen Abschluss spielst, der Keeper, wenn du eine Parade spielst.\n\nZwischen den Spielen regeneriert der Kader, aber alte Überbeanspruchung bleibt hängen. Ein Stammspieler, der drei Matches hart gelaufen ist, schleppt noch im vierten. Bank-Spieler regenerieren schneller und starten häufiger frisch — Rotation ist ein Werkzeug, keine Pflicht.\n\nEin paar Karten (Breather, Rotation, Doping) pumpen die Fitness mitten im Run wieder hoch. Ein kritisch ausgezehrter Stammspieler löst *CRITICAL FATIGUE* aus — ein sichtbarer Rahmen mit Malus auf das ganze Team, solange du nicht gegensteuerst.'
        },
        {
          title: 'Traits & Evolution',
          body: 'Jeder Spieler kann bis zu zwei passive Traits tragen — Laserpass, Chess-Predict, Ghost-Run und ähnliche. Sie feuern im Hintergrund während der Matches und formen Angriffe und Paraden, ohne dass du klicken musst.\n\nGewinne Matches, Spieler sammeln Erfahrung, Spieler steigen auf. Auf Level drei öffnet sich ein neuer Trait-Slot — du wählst aus einer kuratierten Auswahl.\n\nAuf ein paar höheren Levels wird der Spieler für eine **Evolution** statt eines regulären Level-ups verfügbar. Evolutionen formen Stats um und schalten eine Rollen-Spezialisierung frei — Regista, Inverser Flügel, Sweeper-Keeper — mit passendem Karten-Affinitäts-Bonus. Der Spieler behält alles, was er hatte; er bekommt eine Signatur obendrauf.'
        },
        {
          title: 'Bosse & Legenden',
          body: 'Jede Liga-Saison hat zwei **Boss-Spiele** — den Halbsaison-Test und das Finale. Boss-Gegner haben erhöhte Stats auf allen Positionen, mehr Traits auf mehr Spielern, und spielen generell wie auf Speed.\n\nBesiege einen Boss, und im nächsten Draft erscheint eine **legendäre Verpflichtung**: ein Spieler mit hohen Stats und einem Signature-Trait, den du sonst nirgends findest. Bis zu zwei auf der Bank gleichzeitig.\n\nDer Pokal ist Boss-Only. Drei K.-o.-Runden, das Finale ein Super-Boss — mehr Traits, höhere Stats, keine Gnade.'
        },
        {
          title: 'Lebender Gegner',
          body: 'Gegner sind keine Stat-Blöcke. Jedes Team spielt einen von fünf **Archetypen**:\n\n- **Catenaccio** — defensiv, geduldig, tödlich im Konter. Parkt den Bus, bestraft Ballverluste.\n- **Gegenpressing** — hohes Pressing, zermürbend. Leert deine Kondition, stört deine Karten.\n- **Tiki-Taka** — Ballbesitz, später Hammer. Geduldig im Aufbau, brutal nach der Halbzeit.\n- **Direct Play** — aggressiv, risikoreich. Schießt aus jeder Lage, geht auf die Kehle.\n- **Chaos** — unberechenbar. Jede Kategorie im Spiel, keine Cooldowns respektiert.\n\nJeder Archetyp trägt sein eigenes **Move-Deck**. Pro Runde zieht der Gegner einen Move aus diesem Deck, und das OPP-THREAT-Banner kündigt ihn an. Moves fallen in fünf Kategorien:\n\n- **Aggressive** — Extra-Schüsse, Flügel-Überladungen, Konter-Blitze.\n- **Lockdown** — Bus parken, Bunker, Tiefer Block, Mentale Wand.\n- **Disruption** — Taktisches Foul, Fake-Pressing, Zeitspiel, schwere Tacklings, die deine Starter Kondition kosten.\n- **Setup** — Videoanalyse, Kapitäns-Ansprache, stiller Stat-Aufbau.\n- **Big-Move** — Signature-Plays, Verzweiflungs-Pushes, Tiki-Taka-Druck. Severity 3, immer telegraphiert, verheerend wenn ungeblockt. Jeder Archetyp hat nur ein oder zwei davon im Pool.\n\n**Gegner-Intelligenz skaliert mit dem Run.**\n\n- **Amateur (M1-7)** — kleiner Move-Pool, keine Big-Moves, halbzufällige Züge. Pläne sind lesbar, aber nicht transparent.\n- **Pro (M8-14)** — voller Pool, kontextgewichtet. Er sieht den Spielstand, merkt sich deine letzten drei Kartentypen, setzt Druck gegen deinen Combo-Spam.\n- **Pokal (M15+)** — adversariell. Alle Big-Moves freigeschaltet. Bosse ziehen zwei Moves pro Runde und halten Signature-Plays über mehrere Matches zurück.\n\nGegner **studieren dich weiterhin über die Saison**. Wenn du Match für Match auf einen Kartentyp setzt, erscheinen kommende Gegner mit einem Counter-Stat-Bonus und einem *ADAPTED*-Tag. Kein Freifahrtschein für Mono-Decks.\n\n**Lies das Banner.** Ein Punkt ist ruhig. Zwei Punkte heißen: plane eine Antwort. Drei Punkte heißen: du brauchst Block, Vorwegnehmen, Clutch-Defense oder einen passenden Counter *in dieser Runde*, sonst landet der Move ungebremst — ein Gratis-Tor, ein Dreifach-Angriff, drei Runden erhöhte Offensivkraft. Setze deine Konter mit Bedacht.'
        },
        {
          title: 'Pokal, Champions & Codex',
          body: 'Der Pokal sitzt ganz oben auf dem Berg — drei K.-o.-Matches, alle Bosse, nach der Profi-Saison. Unentschieden nach regulärer Spielzeit: Verlängerung, dann Elfmeterschießen. Ein Versuch, keine Wiederholung.\n\nGewinnst du den Pokal, bist du **Run Champion**. Das ist die höchste Auszeichnung, die ein einzelner Run erreichen kann.\n\nDas **Codex** auf dem Startbildschirm führt Buch über deine Karriere runübergreifend: Erfolge, die du freigeschaltet hast, Karten, die du entdeckt hast, legendäre Verpflichtungen, die du jemals gemacht hast. Run-zu-Run-Kontinuität — das Einzige, was die Trainer-Entlassung überlebt.'
        }
      ]
    },
    draft: {
      title: 'Wähle dein Starter-Team',
      body: 'Jedes Team hat ein Thema, eine Stärke und einen Schwachpunkt. Identität entwickelst du später durch Evolutionen.',
      starterCards: 'Archetyp-Karten:'
    },
    hub: {
      yourTeam: 'Dein Team',
      opponent: 'Gegner',
      squad: 'Kader',
      bench: 'Bank',
      deck: 'DECK',
      lineup: '⚙ Aufstellung',
      startMatch: '▶ Match starten',
      quickSim: '⏩ Schnell-Sim',
      bossTag: 'BOSS',
      suspendedAlert: '{name} ist für dieses Match gesperrt',
      suspendedAlertTooltip: '{name}: Rote Karte im letzten Match. Noch {n} Spiele Sperre. Vor dem Start muss ein Bank-Spieler eingewechselt werden.',
      vs: 'VS',
      nextUp: 'Nächstes',
      powerGap: 'Power {me} vs {opp}',
      cardAlert: '{name} auf Gelb — eine weitere und er ist raus',
      benchEmpty: 'Noch keine Bank',
      tapForDetails: 'Tippe einen Spieler für Details',
      chipTraits: '{n}× ausgelöst',
      chipGoals:  '{n} Tore',
      chipEvos:   '{done}/{max} Evos',
      chipStreak: '{n}S-Serie',
      tilePower:  'Power',
      tileTraits: 'Traits gefeuert',
      tileEvos:   'Evolutionen',
      // v52.2 — Stats accordion labels
      stats:           'Stats',
      statsWins:       'Siege',
      statsDraws:      'Remis',
      statsLosses:     'Niederlagen',
      statsGoalDiff:   'Tordiff.',
      statsGoals:      'Tore',
      statsTraits:     'Traits',
      statsEvos:       'Evos',
      statsStreakNow:  'Serie',
      statsStreakBest: 'Rekord',
      conditionTooltip: 'Match-Einsatz kostet Kondition. Zwischen Matches: ≥60 → 90, 40-59 → 80, 20-39 → 70, unter 20 → 55. Bank-Spieler regenerieren voll (+30 bis max 100). Überbeanspruchte Starter rotieren lohnt sich, ist aber keine Pflicht.',
      adaptationTag: 'ADAPTIERT',
      adaptationTooltip: 'Sie haben dein Deck studiert — {type}-lastig ({share} der Plays). +{bump} {stat} auf dieser Mannschaft um dagegen zu halten.'
    },
    detail: {
      traits: 'Traits',
      traitCategory: {
        passive:     'Passiv',
        event:       'Event',
        conditional: 'Bedingt',
        once:        'Einmalig'
      },
      traitCategoryHint: {
        passive:     'Permanent aktiv oder pro-Runde-Chance',
        event:       'Bei spezifischem Match-Ereignis',
        conditional: 'Nur unter bestimmten Bedingungen',
        once:        '1x pro Match oder Halbzeit'
      },
      noTraits: 'Noch keine Traits — Traits werden bei Evolutionen freigeschaltet.',
      stats: 'Stats',
      runStats: 'Dieser Run',
      runGoals: 'Tore',
      runAssists: 'Assists',
      runMinutes: 'Minuten',
      close: '✕ Schließen',
      level: 'Level {lv}',
      suspended: 'Nächstes Match gesperrt',
      yellow: 'Auf gelber Karte',
      xpProgress: '{xp} / {next} XP'
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
      fast: '⏩ Schnell',
      pulseBuildup: 'Aufbau',
      pulseDefense: 'Paraden',
      pulseSaves: 'Paraden',
      noModifiers: 'Keine aktiven Modifikatoren',
      pulseTipCondition:    'Kondition {value} → −{pen} alle Stats',
      pulseTipForm:         'Form {form} → {sign}{delta} {stat}',
      pulseTipTeamForm:     'Team-Form → {sign}{value} alle Stats',
      pulseTipCardsTactic:  'Karten/Taktik → {parts}'
    },
    matchHud: {
      phase: {
        firstHalf:   '1. Halbzeit',
        secondHalf:  '2. Halbzeit',
        buildup:     'Aufbau',
        possession:  'Ballbesitz',
        transition:  'Umschaltspiel',
        attack:      'Angriff',
        recovery:    'Regeneration',
        defensive:   'Defensive'
      },
      event: {
        meGoal:  'Tor',
        oppGoal: 'Gegentor',
        oppCard: 'Gegner-Karte',
        shield:  'Schild greift',
        counter: 'Konter gespielt'
      },
      interrupt: {
        kickoff:  'Anstoß-Taktik',
        halftime: 'Halbzeit-Entscheidung',
        final:    'Final-Taktik'
      },
      badge: {
        kickoff:  'KO',
        halftime: 'HZ',
        final:    'FIN',
        oppCard:  'K',
        shield:   'S',
        counter:  '↯'
      }
    },
    phase: {
      shiftOwnGoal: [
        'Zurück zum Aufbau — Abstoß von hinten.',
        'Tor gemacht — neu sortieren, nicht hetzen.',
        'Anstoß — das Match startet neu.'
      ],
      shiftConceded: [
        'Defensive — zurückziehen, den Schlag wegstecken.',
        'Das Tor schmerzt — Kette tiefer, kompakt bleiben.',
        'Neu formieren — Geduld hinten.'
      ],
      shiftSave: [
        'Umschalten! Schneller Ball nach vorn — die Konter-Lane öffnet sich.',
        'Parade wird zum Angriff — nach vorn fliegen.',
        'Keeper fängt, Abwurf raus — wir brechen!'
      ],
      shiftMiss: [
        'Chance vergeben — der Ballbesitz kippt, neu sortieren.',
        'Am Tor vorbei — sie kommen wieder, Stellung halten.',
        'Neben das Tor — Abstoß für den Gegner.'
      ],
      shiftLaneOpen: [
        'Angriffsphase — der Flügel ist offen, jetzt nachlegen.',
        'Hinterlaufen — die Seite gehört uns, los.',
        'Raum auf der Seite — ausnutzen.'
      ],
      shiftPossession: [
        'Ballbesitzphase — das Team spielt den Gegner müde.',
        'Ball halten — die Kräfte absaugen.',
        'Tempo raus — wir diktieren.'
      ],
      shiftDefensive: [
        'Defensive stabilisiert — nach zwei harten Runden wieder in Form.',
        'Neu formiert — die Blutung gestoppt, jetzt aufbauen.',
        'Stabilisiert — die Stellung hält wieder.'
      ]
    },
    matchEvents: {
      cornerKick: [
        'Eckball — der Ball wird scharf reingeschlagen. Setup jetzt, dann zuschlagen.',
        'Fahne steht — Ecke für uns. Eine gute Flanke lebt von einer Aktion.',
        'Schiedsrichter zeigt zur Ecke. Strafraum voll — wer steigt?'
      ],
      counterPressChance: [
        'Umschaltmoment — bevor sie sortieren, draufgehen.',
        'Sie sind nach der Parade auf dem falschen Fuß — jagt den Ball.',
        'Schnelle Füße, hohe Linie — jetzt brechen sie.'
      ],
      oneOnOne: [
        'Freie Sicht zum Keeper — kaltes Blut oder Nerven?',
        'Stürmer allein durch — die Zeit bleibt stehen.',
        'Auge in Auge mit dem Keeper — nur einer lebt.'
      ],
      injuryScare: [
        'Ein Spieler humpelt — wechseln oder durchbeißen?',
        'Jemand greift sich den Oberschenkel — Atempause nötig.',
        'Die Bank schaut besorgt — Kondition kritisch.'
      ],
      yellowCardThreat: [
        'Letzte Ermahnung — nächstes Foul wird Gelb.',
        'Der Schiri wird ungeduldig — dosiert rein oder laufen lassen?',
        'Buch ist draußen — Zweikämpfe gut überlegen.'
      ]
    },
    result: {
      win: 'SIEG',
      loss: 'NIEDERLAGE',
      draw: 'UNENTSCHIEDEN',
      continue: '▶ Weiter',
      verdict: {
        underdogStood:    'Klar stärkeren Gegner gehalten — Punkte gegen den Favoriten.',
        squadGassed:      'Dem Team gingen die Beine aus — {players} unter 35 Kondition.',
        buildupStruggled: 'Aufbauspiel stockte — nur {pct}% der Versuche fanden den Mitspieler.',
        chancesMissed:    '{shots} Schüsse, ein Tor — Chancen kamen, die Verwertung nicht.',
        oppRuthless:      'Ihre {shots} Chancen brachten {goals} Tore — eiskalt.',
        dominantWin:      'Routinier-Sieg — die Lücke war spürbar.',
        gritWin:          'Erkämpfter Sieg.',
        shareSpoils:      'Punkteteilung auf Augenhöhe.',
        toughLoss:        'Bitter — zurück ans Reißbrett.'
      },
      analysis: 'Match-Bilanz',
      players: 'Spieler-Bilanz',
      matchLogTitle: 'Match-Log',
      cardSummaryTitle: 'Kartenspiel',
      highlightsTitle: 'Highlights & Nächstes',
      detailsToggle: 'Vollständige Bilanz',
      stopsLabel: 'Paraden',
      sacrificeNote: '⚠ {name} hat alles gegeben — dauerhafter Stat-Verlust.',
      cardsTitle: 'Kartenspiel',
      cardsPlayed: 'KARTEN GESPIELT',
      cardsSkipped: 'Keine Karten gespielt',
      flowPeak: 'FLOW HOCH',
      deckAfter: 'DECK-GRÖSSE',
      mostPlayed: 'Meistgespielt',
      framesFired: 'Situationen',
      condBilanz: 'Kondition',
      hlGoal:         '{name} auf der Torschützenliste',
      hlBraceOrHat:   '{name} mit Doppelpack',
      hlHatTrick:     '{name} Hattrick — {n} Tore',
      hlKeeperBig:    '{name} Wall — {n} Paraden',
      hlKeeperSolid:  '{name} stand sicher — {n} Paraden',
      hlBreakout:     '{name} Durchbruch — +{xp} XP',
      hlFlop:         '{name} fand nicht rein — braucht einen Reset',
      hlOverperform:  'Über Erwartung (vor Match: {pre}% Sieg)',
      hlUnderperform: 'Unter Erwartung (vor Match: {pre}% Sieg)',
      decisionsTitle: 'Deine Entscheidungen',
      decisionsSum:   'Summe',
      decisionNoXp:   'kein Bonus-XP',
      microBoostsTitle: 'Erkämpfte Stat-Boosts',
      microBoostsHint:  'Entscheidungs-getriebene Erfolge haben diese Attribute dauerhaft gehoben.',
      matchFlowTitle: 'Match-Verlauf',
      matchFlowHint:  'Entwicklung der Team-Werte während des Matches (Buffs, Form, Traits).',
      decisionPhase: {
        kickoff:  'Start',
        halftime: 'Halbzeit',
        final:    'Finale'
      },
      traitReportTitle: 'Woher euer Vorteil kam',
      traitReportEmpty: 'Keine Fähigkeiten sind in diesem Match ausgelöst.',
      traitReportFires: '{count} Trigger',
      traitReportPassive: 'AKTIV',
      traitReportImpact: 'Impact ~{value}',
      // v52.2 — Achievement-Pop-Streifen auf der Result-Page
      achievementsBanner: '🏆 NEU FREIGESCHALTET',
      achievementsBannerOne: '🏆 Achievement freigeschaltet',
      traitReportFooter: 'Trigger-Anzahl × Gewichtung je Fähigkeit. Höher = mehr Einfluss auf dieses Match.'
    },
    optionNotes: {
      kickoffAggressive: 'früher Schussdruck',
      kickoffDefensive:  'sicherere erste drei Runden',
      kickoffBalanced:   'erster Aufbau garantiert',
      kickoffTempo:      'Tempo vor Kontrolle',
      kickoffPressing:   'kappt ihre Angriffe, wenn es sitzt',
      kickoffPossession: 'beste Wahl für sauberen Aufbau',
      kickoffCounter:    'gescheiterte Gegner-Angriffe feuern Konter',
      kickoffFlank:      'setzt voll auf LF-Tempo',
      halftimePush:      'am besten wenn ihr reinkommt, aber nicht trefft',
      halftimeStabilize: 'am besten wenn sie saubere Chancen kriegen',
      halftimeShift:     'boostet {name}s {stat}',
      halftimeRally:     'skaliert mit dem Spielstand',
      halftimeReset:     'sicherer Patch für mehrere Schwachstellen',
      halftimeCounter:   'am besten wenn sie sich übernehmen',
      halftimeHighPress: 'am besten wenn ihr Aufbau zu sauber ist',
      halftimeVisionPlay: 'am besten wenn Aufbau das eigentliche Problem ist',
      finalAllIn:        'reine Tor-Jagd',
      finalParkBus:      'Führung schützen',
      finalHeroBall:     '{name} bekommt +30 {stat}',
      finalKeepCool:     'am besten wenn Nerven oder Aufbau fehlschlagen',
      finalPress:        'Schluss-Pressing mit Konter-Potential',
      finalLongBall:     'Aufbau überspringen für direkten Druck',
      finalMidfield:     'am besten für eine saubere Ballbesitz-Phase',
      finalSneaky:       'schützen und kontern',
      finalSacrifice:    '-15 Fokus bei einem Spieler für sofortige Team-Offense',
      fitFullValue:      'passt zum Kader: voller Wert',
      misfitReduced:     'Misfit: Wert reduziert, Downside steigt',
      synergyMult:       'Synergie ×{mult}',
      conflictMult:      'Konflikt ×{mult}'
    },
    prob: {
      win:  'Sieg',
      draw: 'Remis',
      loss: 'Niederlage',
      currentWin: 'Aktuelle Siegchance',
      boosts:     'Boosts'
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
    momentum: {
      barTooltip:
        'Match-Flow — wer hat das Spiel gerade unter Kontrolle.\n\n' +
        'Rechts (grün) = deine Seite, links (rot) = Gegner. Mitte = ausgeglichen.\n\n' +
        'Mischt drei Signale:\n' +
        '· Ballbesitz (60%) — gleitender Durchschnitt über die gespielten Runden\n' +
        '· Tor-Differenz (10%) — jedes Tor verschiebt ±10 Punkte (gedeckelt)\n' +
        '· Engine-Momentum (30%) — schwingt mit Toren, Paraden, Zonen-Wechseln\n\n' +
        'Aktualisiert jede Runde. Passt zu den EDGE / THREAT-Chips darunter.'
    },
    intel: {
      probableFrames: 'WAHRSCHEINLICHE SITUATIONEN',
      counters:       'Konter',
      noCounters:     'keine Konter',
      payoffs:        'Hebel',
      noPayoffs:      'keine Hebel',
      title: 'Matchup-Intel',
      effectivePowerTitle: 'Effektive Power',
      basePowerLabel: 'Basis',
      traitPowerLabel: 'Traits',
      effectiveLabel: 'Effektiv',
      powerBreakdown: '{base} +{traits} = {effective}',
      deltaAhead: '+{delta} Vorteil',
      deltaBehind: '{delta} Rückstand',
      deltaEven: 'Ausgeglichen',
      advantagesTitle: 'Euer Vorteil',
      warningsTitle: 'Ihre Drohungen',
      noAdvantages: 'Keine herausragenden Trait-Vorteile — Stats entscheiden das Match.',
      noWarnings: 'Keine spezifischen Gegner-Drohungen.',
      verdictDominant: 'Solltet ihr nehmen',
      verdictAhead:    'Favorit',
      verdictEven:     'Auf der Kippe',
      verdictBehind:   'Harter Brocken',
      verdictUnderdog: 'Schwerer Gang',
      headlineBoth:    '{adv} — aber {warn}',
      headlineNothing: 'Stat-gesteuertes Match — keine großen Trait-Duelle.',
      advPredatorVsPresser: '{name}s Raubtier-Instinkt bestraft ihre Pressing-Fehler.',
      advLateBloom: '{name} kommt ab Runde 4-6 in Fahrt.',
      advClutchMatchup: 'Eure Clutch-Traits matchen ihre in der Schlussphase.',
      advBigGame: '{name} lebt für Boss-Matches — +15 Fokus-Stat.',
      advFieldGeneral: 'Field General hebt die ganze Truppe +4 überall.',
      advKeeperWall: 'Euer Keeper-Trait entschärft ihre Luftdrohung.',
      advTempo: '{name} läuft ihrer ganzen Hintermannschaft davon.',
      warnSniper: '{name} (Sniper) — jeder Schuss eine Drohung.',
      warnCounter: '{name} bestraft jeden Ballverlust im Umschaltmoment.',
      warnIronwall: '{name} verriegelt die frühen Runden — 1-2 wirken undurchdringlich.',
      warnClutchUnanswered: '{name} legt spät nach — ihr habt keine Clutch-Antwort.',
      warnPresserNoVision: '{name} presst hoch und keine PM-Vision um rauszukommen.',
      warnStatGap: '{diff} Stat-Power zurück — Traits müssen es tragen.',
      warnBoss: 'Boss-Gegner — alle Stats erhöht.'
    },
    verdict: {
      close:       'Knapp',
      favored:     'Favorit',
      strongEdge:  'Klar im Vorteil',
      tough:       'Harter Kampf',
      bossFight:   'Boss-Match',
      trustTraits: 'Vertrau deinen Traits',
      rideForm:    'Die Form rollt',
      riskyStreak: 'Keine dritte Niederlage',
      newRival:    'Neuer Herausforderer'
    },
    hints: {
      lfTempoEdgeExact: '{name} hat Tempo-Vorteil: {myTempo} TEM vs {oppTempo}.',
      lfTempoRiskExact: 'Ihr Tempo kann die Flanke bestrafen: {myTempo} TEM vs {oppTempo}.',
      shakyBuildUp: 'Aufbau wirkt wackelig: PM {vision} VIS / {composure} COM. Kontroll-Optionen helfen am meisten.',
      backlineUnderPressure: 'Abwehr startet unter Druck: {hold} Hold vs {oppOffense} Gegner-OFF.',
      earlyControl: 'Ihr solltet die Eröffnung kontrollieren. Ballbesitz oder Balanced können Wellen erzeugen.',
      buildupLow: 'Euer Aufbau nur {rate}%. Vision/Composure zuerst beheben.',
      accuracyLow: 'Schüsse kommen durch, aber kein Treffer: {rate}% Quote. Offense/Direktspiel mehr als Kontrolle.',
      oppBuildupHigh: 'Sie bauen zu sauber auf: {rate}%. Defense/Pressing/Keeper helfen.',
      finalNeedEntry: 'Erst sauberer Übergang nötig: Aufbau {rate}%.',
      finalNeedPressure: 'Übergang passt. Jetzt Schussdruck: Quote {rate}%.',
      finalProtectionWorking: 'Schutzsystem läuft. Defense/Composure bringen es ins Ziel.',
      ironwallEarly: 'Ironwall-Trait: Runden 1-2 nahezu undurchdringlich.',
      sniperWarning: 'Präziser Schütze — jeder Versuch gefährlich.',
      clutchOppLate: 'Sie werden spät stärker — Runden 5-6 aufpassen.',
      presserOppActive: 'Hoher Druck kommt — Aufbau wird gestört.',
      bossWarning: 'Boss-Match — alle Stats erhöht.',
      lfTempoAdvantage: '{name} hat Tempo-Vorteil — Flügelspiel kann entscheiden.',
      lfTempoDisadvantage: 'Ihr Tempo ist höher — Konter-Gefahr über die Flügel.',
      squadInForm: 'Die Truppe fliegt — Pressing-Taktiken verstärkt.',
      squadInCrisis: 'Vertrauen am Boden — sichere Optionen mit weniger Risiko.',
      pressingBlocked: 'Pressing blockiert {n} Angriffe in der ersten Halbzeit.',
      countersFired: 'Konter-System hat {n}× ausgelöst — es läuft.',
      scoreLeading: 'Ihr führt — absichern ist eine Option.',
      scoreTrailing: 'Ihr jagt — Dringlichkeit zählt jetzt.',
      tacticSynergyKickoff: 'Diese Taktik passt zu eurer Stärke.',
      tacticConflict: 'Diese Taktik könnte mit eurem Setup kollidieren.',
      legendaryOnBench: '{name} sitzt auf der Bank und ist bereit.',
      finalLegendaryOnBench: 'Legende auf der Bank — Schlussrunde könnte ihr Moment sein.',
      oppBuildupLow: 'Gegner-Aufbau nur zu {pct}% erfolgreich — sie sind verwundbar.',
      noHint: ''
    },
    phaseGuide: {
      kickoffBuildUp: 'Aufbau läuft über PM Vision/Composure: {vision} VIS / {composure} COM.',
      kickoffControl: 'Kontroll-Vorteil jetzt: {delta}.',
      kickoffWide: 'Breitendrohung ist LF-Tempo: {lfTempo} vs {oppTempo}. Abwehr-Hold: {hold} vs {oppOffense} OFF.',
      halftimeBuildUp: 'Zuerst Aufbau fixen wenn niedrig: {myRate}% für euch vs {oppRate}% für sie.',
      halftimeAccuracy: 'Wenn Aufbau passt, aber Abschluss fehlt: Quote {myAcc}% vs {oppAcc}%.',
      halftimeDefense: 'Verteidigung lebt jetzt im TW/VT-Hold: {hold} Hold und {saves} Paraden bisher.',
      finalChaseStatus: 'Ihr braucht ein Tor. Aufbau {buildup}%, Quote {accuracy}%.',
      finalChaseAdvice: 'Wenn Aufbau der Blocker: Kontrolle/Vision. Wenn Schüsse der Blocker: Offense/Direktspiel.',
      finalProtectStatus: 'Ihr schützt eine Führung. Ihr Aufbau {oppRate}%, euer Hold {hold}.',
      finalProtectAdvice: 'Defense und Composure jetzt wertvoller als rohe Offense.',
      finalLevelStatus: 'Ausgeglichen. Entscheidet was der Blocker ist: Aufbau {buildup}%, Quote {accuracy}%, Paraden {saves}.',
      finalLevelAdvice: 'Mittelfeld/Kontroll-Entscheidungen erzeugen eine saubere Chance; Direkt/Offense-Entscheidungen jagen die Varianz.'
    },
    ht: {
      title: 'HALBZEIT',
      detailsToggle: 'Match-Details',
      pressBlocked: 'Pressing blockiert {n} Angriffe',
      countersFired: 'Konter-System hat {n}× gefeuert',
      momentumActive: 'Momentum: +{bonus}% Aufbau-Bonus nächste Runde',
      activeIntoSecondHalf: 'Aktiv in die 2. Halbzeit →',
      mechanicCounter: 'Konter-Falle aktiv',
      mechanicPressing: 'Pressing aktiv',
      mechanicPossession: 'Ballbesitz-Lock',
      mechanicAggressive: 'Angriffs-Welle',
      mechanicFlank: 'Flügelläufe',
      mechanicRally: 'Rally-Modus'
    },
    cards: {
      yellow: 'Gelbe Karte — eine weitere in diesem Match = Platzverweis und Sperre für das nächste Match.',
      secondYellow: 'Gelb-Rot — Platzverweis in diesem Match, gesperrt fürs nächste.',
      red: 'Rote Karte — Platzverweis in diesem Match, gesperrt fürs nächste.',
      suspendedNext: 'Gesperrt — kann im nächsten Match nicht aufgestellt werden.',
      academyTooltip: 'Aushilfe aus der Akademie — temporärer Ersatz, deutlich schwächere Werte, keine Traits. Verlässt das Team nach diesem Match.',

      // Card-play layer (hand/deck/discard UI + card catalog)
      endTurn:      "ZUG BEENDEN",
      mulliganBtn:  "NEU ZIEHEN",
      deckLabel:    "DECK",
      discardLabel: "ABL.",
      deckTooltip:    "Deck — noch ungezogene Karten dieses Matches. Wenn's leer ist, wird der Ablagestapel neu gemischt und als Deck verwendet (Standard-Deckbuilder-Loop).",
      discardTooltip: "Ablage — bereits gespielte oder abgeworfene Karten dieses Matches. Wird neu ins Deck gemischt, wenn das Deck leer ist.",
      flowHint:       "Setup-Karten erzeugen Flow. Trigger- und Combo-Karten verbrauchen ihn für stärkere Effekte.",
      laneHint:       "Lane Open schaltet lane-verbrauchende Karten mit großem Offensiv-Kicker frei.",
      pressHint:      "Press Resist dämpft das Pressing des Gegners — reduziert seinen Defensiv-Bonus in dieser Runde.",
      oppIntent:    "GEGNER-BEDROHUNG",
      oppIntentVerbs: [
        "lädt",
        "bereitet",
        "zieht auf",
        "spannt",
        "macht sich bereit für"
      ],
      telegraphed:  "ANGEKÜNDIGT",
      absorbed:     "ENTSCHÄRFT",
      handEmpty:    "Hand leer — Zug beenden zum Fortfahren.",
      energyLabel:  "ENERGIE",
      skipMalus:    "Keine Karten gespielt — Team auf Autopilot (−4 TMP / −3 VIS).",
      fatigueNarrative: [
        "{name} zieht die Beine nach — das Team spürt die Intensität.",
        "{name} winkt nach einer Pause — die Runden zehren an allen.",
        "Das Tempo sinkt spürbar — {name} sucht den Atem.",
        "{name} verliert das Timing — der Tank ist leer."
      ],
      types: {
        setup:   "SETUP",
        trigger: "AUSLÖSER",
        combo:   "COMBO",
        defense: "ABWEHR",
        counter: "KONTER",
        draw:    "ZIEHEN"
      },
      drop_deep:       { name: "Zurückfallen",        desc: "+8 DEF / +4 VIS. Erzeugt 1 Flow, 2 Press-Resist.",
        flavor: [
          "{pm} kippt ab — das Pressing läuft ins Leere.",
          "Team zieht sich zurück — {opp} verliert den Zugriff.",
          "{pm} liest die Linie, nimmt Tempo raus."
        ]
      },
      switch_lane:     { name: "Seitenwechsel",       desc: "+8 TMP / +4 OFF. Erzeugt 1 Flow, öffnet eine Bahn.",
        flavor: [
          "Ball wechselt die Seite — neuer Winkel öffnet sich.",
          "{pm} findet den Diagonalball — {opp} verschiebt zu spät.",
          "Schnelle Verlagerung — freier Mann auf der anderen Seite."
        ]
      },
      quick_build:     { name: "Schneller Aufbau",    desc: "+10 VIS / +3 CMP diese Runde. Erzeugt 1 Flow.",
        flavor: [
          "{pm} spielt das schnelle Dreieck — sauber raus.",
          "Kurze Kombination durchs Zentrum.",
          "{pm} fädelt sich durchs Pressing."
        ]
      },
      tight_shape:     { name: "Kompakte Ordnung",    desc: "+14 DEF diese Runde. Skaliert 1.3× gegen telegraphierte Bedrohungen.",
        flavor: [
          "Linien bleiben eng — kein Raum im Mittelfeld.",
          "Team wird kompakt — {opp} muss außen bleiben.",
          "Ordnung hält, das Anlaufen geht locker."
        ]
      },
      hold_the_line:   { name: "Linie halten",        desc: "Gratis. +8 DEF / +6 CMP, +8 auf nächste Parade. Skaliert 1.3× gegen telegraphierte Bedrohungen.",
        flavor: [
          "{tw} dirigiert die Kette — alles in Position.",
          "{vt} organisiert, keiner geht aufs Angebot ein.",
          "Team bleibt in Formation — elf Mann hinter dem Ball."
        ]
      },
      keeper_rush:     { name: "Keeper voraus",       desc: "+10 DEF, nächste Parade +15. Skaliert 1.3× gegen telegraphierte Bedrohungen.",
        flavor: [
          "{tw} rauscht raus — klärt die Gefahrenzone.",
          "{tw} kommandiert den Strafraum.",
          "{tw} ist blitzschnell aus seinem Kasten."
        ]
      },
      overlap_run:     { name: "Überlauf-Lauf",       desc: "+15 OFF / +6 TMP, skaliert +4 OFF pro Flow-Stack (Cap +16). Payoff-Karte.",
        flavor: [
          "{lf} überläuft — Überzahl auf dem Flügel.",
          "{lf} stürmt am Außenverteidiger vorbei.",
          "{lf} dringt ins letzte Drittel — jetzt der Pass."
        ]
      },
      forward_burst:   { name: "Vorwärtsdrang",       desc: "+14 OFF / −4 CMP (+12 OFF bei Lane Open, +6 OFF bei aggressiv/tempo Tactic). Verbraucht Lane Open.",
        flavor: [
          "{lf} und {st} brechen durch — zwei gegen zwei.",
          "Konter läuft — {st} ist weg.",
          "{lf} zieht das Tempo an — Abwehr strauchelt."
        ]
      },
      ball_recovery:   { name: "Ball-Eroberung",      desc: "+6 DEF / +4 TMP. Dämpft nächsten Gegner-Trait.",
        flavor: [
          "{pm} geht dazwischen — saubere Balleroberung.",
          "{vt} liest die Situation — Ball wieder bei {pm}.",
          "Das Anlaufen zahlt sich aus — {opp} verliert billig."
        ]
      },
      hero_moment:     { name: "Held des Spiels",     desc: "+18 OFF / +6 CMP. Wird +34 OFF bei Flow ≥ 2 (verbraucht 2 Flow).",
        flavorHit: [
          "{st} findet den Moment — der Keeper hat keine Chance!",
          "{st} setzt sich ab — Schuss ist unten drin!",
          "{st} nimmt einen Kontakt, ein Schuss — eiskalt."
        ],
        flavorMiss: [
          "{st} versucht es zu erzwingen — kein Aufbau da.",
          "{st} greift zur Chance, aber der Rhythmus fehlt.",
          "{st} zieht ab, aber nichts hält ihn zusammen."
        ]
      },
      wing_trap:       { name: "Flügel-Falle",        desc: "+12 DEF / +6 TMP. Cancelt nächsten Gegner-Trait.",
        flavor: [
          "{lf} lockt ihn nach außen — Falle zugeschnappt.",
          "{vt} schließt den Kanal — {opp}-Spieler in der Zange.",
          "Doppelung an der Linie — sauberer Ballgewinn."
        ]
      },
      masterclass:     { name: "Sternstunde",         desc: "+40 OFF / +12 VIS bei Flow ≥ 3. Sonst nur +10 OFF.",
        flavorHit: [
          "{pm} dirigiert das ganze Stück — zehn Stationen, eine Chance.",
          "{pm} beherrscht das Spiel — {opp} läuft Schatten hinterher.",
          "{pm} malt es — die Mannschaft bewegt sich wie ein Körper."
        ],
        flavorMiss: [
          "{pm} versucht zu orchestrieren — die Teile passen nicht.",
          "{pm} sucht die Kombination, aber es ist noch nicht da.",
          "{pm} greift nach dem Moment, kein Fundament gelegt."
        ]
      },
      stamina_boost:   { name: "Konditionsschub",     desc: "+5 TMP / +5 CMP / +3 DEF für 2 Runden. Erzeugt Flow.",
        flavor: [
          "Team findet den zweiten Wind — Beine sind noch frisch.",
          "Intensität hoch — überall auf dem Platz.",
          "Signal von der Bank: härter pressen, länger durchhalten."
        ]
      },
      clinical_finish: { name: "Eiskalter Abschluss", desc: "+16 OFF (+16 mehr bei offener Bahn). Verbraucht Lane Open.",
        flavorHit: [
          "{st} zieht in die Bahn — kühler Abschluss!",
          "{st} schaut einmal, ein Kontakt, drin.",
          "{lf} legt auf — {st} schiebt ein."
        ],
        flavorMiss: [
          "{st} schießt aufs Tor — direkt auf den Keeper.",
          "{st} versucht es früh — zieht daneben.",
          "{st} hetzt den Abschluss, kein Winkel."
        ]
      },
      deep_focus:      { name: "Tiefer Fokus",        desc: "+12 VIS / +6 CMP für 2 Runden. Doppelter Flow-Erzeuger.",
        flavor: [
          "{pm} nimmt Tempo raus — alle atmen durch.",
          "Tempo mit Absicht runter — {pm} diktiert jetzt.",
          "Team findet in den Ballbesitz-Rhythmus."
        ]
      },

      // Action-Karten (reaktive Logik — nicht nur Zahlen)
      desperate_foul:  { name: "Foul der Verzweiflung", desc: "+12 DEF diese Runde. VT kassiert eine Gelbe (−1 CMP dauerhaft dieses Match).",
        flavor: [
          "{vt} haut ihn um — die Gelbe ist es wert.",
          "{vt} zieht die Notbremse — taktisches Foul im Halbraum.",
          "{vt} opfert sich — Gelb in Kauf genommen."
        ]
      },
      bait_counter:    { name: "Kontern lassen",        desc: "+8 DEF / +4 TMP. Trifft der Gegner nächste Runde nicht, +Flow 2.",
        flavor: [
          "Team lockt sie nach vorne — warte auf die Lücke.",
          "Tiefer Block — {opp} gestreckt, sucht den Pass.",
          "Das Pressing wird eingeladen — ein Fehlpass und wir haben ihn."
        ]
      },
      through_ball:    { name: "Pass in die Tiefe",     desc: "Wirf 1 zufällige Karte ab. Setup → +4 OFF / +4 TMP, +Flow 2, Lane Open, plus Steilpass-Aktion. Trigger/Combo → −4 DEF. Defense/Counter → nichts.",
        flavorHit: [
          "{pm} sieht den Lauf — durchgesteckt!",
          "{pm} findet die Schnittstelle — {lf} ist durch.",
          "{pm} bedient {st} mit einem verdeckten Pass."
        ],
        flavorMiss: [
          "{pm} spielt lang — {opp}-Verteidiger putzt weg.",
          "{pm} schlägt ihn direkt — zu lang.",
          "Ball rutscht durch — keiner läuft mit."
        ]
      },
      stone_cold:      { name: "Eiskalt einschenken",   desc: "Braucht Flow ≥ 2 UND Lane Open. Verbraucht beides. +30 OFF / +8 CMP — plus garantierter Steilpass auf den ST.",
        flavorHit: [
          "{st} fädelt ihn am Keeper vorbei — eiskalt!",
          "{st} umkurvt ihn — ins leere Tor.",
          "{st} nimmt einen Kontakt, schaut einmal, drin."
        ],
        flavorMiss: [
          "{st} überstürzt den Moment — nichts zu verwerten.",
          "{st} steht allein — Chance stirbt unterkühlt.",
          "{st} versucht es zu erzwingen — Keeper liest es."
        ]
      },

      // Absichtlich schwache Starterkarten — Kandidaten zum Entfernen.
      grind_through:   { name: "Durchbeißen",           desc: "+4 DEF / +2 TMP. Zuverlässig aber langweilig. Spätes Spiel Ballast.",
        flavor: [
          "Team kämpft sich durch — nichts Schönes.",
          "Zweckfußball — ein Prozent pro Minute.",
          "Sicherer Pass, sicherer Zug, sichere Runde."
        ]
      },
      long_ball:       { name: "Langer Ball",           desc: "+5 OFF / −3 VIS. Hoffnung und Ressourcenverschwendung.",
        flavor: [
          "{tw} schlägt ihn lang — 50/50 bestenfalls.",
          "Ball segelt nach vorne — keiner liest ihn.",
          "Hoffnungsschlag in die Bahn."
        ]
      },
      hope_shot:       { name: "Hoffnungsschuss",       desc: "20% Chance auf einen Glückstor-Versuch. Kein Stat-Buff — pure Verzweiflung.",
        flavor: [
          "{st} sieht die Lücke, zieht aus der Distanz ab.",
          "{lf} knallt drauf aus 30 Metern.",
          "Spekulativer Schuss — einen Versuch wert."
        ]
      },

      // Tactic-Synergie-Karten (v4)
      gegenpress: { name: "Gegenpressing", desc: "+8 DEF / +6 TMP. Verdoppelt auf +16/+12 wenn Taktik aggressiv, tempo oder pressing ist. Skaliert 1.5× wenn das Match-Momentum gegen dich läuft.",
        flavorHit: [
          "Team löst das Gegenpressing aus — {opp} hat keine Zeit zum Atmen!",
          "Sechs-Sekunden-Regel — {vt} erobert sofort zurück.",
          "Die ganze Einheit jagt — Taktik und Karte singen dasselbe Lied."
        ],
        flavorMiss: [
          "{vt} geht ran — normaler Druck.",
          "Team rückt auf, hält die Ordnung.",
          "{pm} dirigiert sie nach außen, geduldig."
        ]
      },
      possession_lock: { name: "Ballbesitz-Sperre", desc: "+8 VIS / +4 CMP, +Flow 1. Bei Possession-orientierter Taktik: 1 Karte extra ziehen.",
        flavorHit: [
          "{pm} gibt das Metronom vor — zwanzig Pässe ohne Druck.",
          "{opp} läuft Schatten hinterher — jeder Pass findet einen Fuß.",
          "Team hält den Ball auf seiner Spielhälfte."
        ],
        flavorMiss: [
          "{pm} lässt zirkulieren — vorsichtig.",
          "Team recycelt Ballbesitz — nichts erzwungen.",
          "Quer, geduldig — {pm} sucht die Öffnung."
        ]
      },
      killing_blow: { name: "Entscheidungs-Schlag", desc: "+25 bis +35 OFF (skaliert mit Führung, gedeckelt bei 5+ Toren Vorsprung) / +8 CMP. Wirkungslos bei Gleichstand oder Rückstand.",
        flavorHit: [
          "{st} spürt: das Spiel liegt bereit — rammt den Dolch rein!",
          "Führende Teams zucken nicht — {pm} dirigiert den letzten Akt.",
          "{st} macht den Deckel drauf — eiskalter Abschluss!"
        ],
        flavorMiss: [
          "{st} greift nach dem K.o. — der Spielstand lässt es nicht zu.",
          "Team versucht zuzumachen — aber nichts zu schließen.",
          "{pm} sucht den Killerpass — falsche Spielsituation."
        ]
      },

      // Telegraph-Counter — brillieren gegen angekündigte Gegner-Bedrohung
      block: { name: "Blocken", desc: "Kontert eine angekündigte Gegner-Bedrohung für +28 DEF / +6 CMP. Ohne Telegraph: nur +8 DEF.",
        flavorHit: [
          "{vt} liest es perfekt — Gefahr entschärft bevor sie beginnt!",
          "{pm} sieht das Muster — stellt die Passlinie zu.",
          "{tw} war schon in Bewegung — die Aktion stirbt unterkühlt."
        ],
        flavorMiss: [
          "{vt} hält die Linie — Routineverteidigung.",
          "Team bleibt kompakt — noch nichts zu kontern.",
          "{pm} fällt in die Sicherung — vorsorglich."
        ]
      },
      preempt: { name: "Vorwegnehmen", desc: "Neutralisiert angekündigte Bedrohung. Bei Cancel: +22 DEF / +12 TMP / +8 CMP / +10 OFF, +Flow 2, ziehe 1. Ohne Telegraph: +Flow 1, ziehe 1, kein Stat-Buff.",
        flavorHit: [
          "{pm} liest den Zug drei Sekunden bevor er passiert — wir STEHLEN den Moment!",
          "{vt} fängt den Pass ab bevor er gespielt wird — {opp} paralysiert.",
          "Die Falle war gestellt — sie sind reingelaufen."
        ],
        flavorMiss: [
          "{pm} bleibt wach — nichts vorwegzunehmen.",
          "Team sucht den Read — noch kein offensichtlicher Hinweis.",
          "{vt} scannt die Linien — ruhiger Moment."
        ]
      },

      // Taktik-spezifische Synergie-Karten
      counter_strike: { name: "Konter-Schlag", desc: "+28 OFF / +10 TMP / +Flow 1 mit Konter-Taktik aktiv ODER Auto-Konter geladen. Sonst nur +10 OFF.",
        flavorHit: [
          "{lf} sticht im Umschaltspiel zu — die Taktik zahlt sich aus!",
          "Konter läuft wie ein Uhrwerk — {st} allein vorm Keeper.",
          "Von Abwehr auf Angriff in drei Pässen — Lehrbuch-Konter."
        ],
        flavorMiss: [
          "{st} versucht den Ausbruch — keine Unterstützung dahinter.",
          "Zu früh, noch keine Konter-Struktur — erzwungener Schuss.",
          "{lf} sprintet allein — keine Überzahl."
        ]
      },
      high_press_trap: { name: "Pressing-Falle", desc: "+14 DEF / +6 TMP + Lane Open + cancelt nächsten Gegner-Trait bei Pressing-Taktik. Sonst +8 DEF.",
        flavorHit: [
          "Pressing-Falle schnappt zu — {opp} hat keinen Ausweg!",
          "Hoher Block erwischt sie kalt — Ballverlust.",
          "{vt} löst den Druck aus — Ballgewinn in deren Hälfte."
        ],
        flavorMiss: [
          "Team rückt hoch zum Pressing — erste Linie umspielt.",
          "Falle zu tief gestellt — {opp} spielt sauber raus.",
          "{vt} hält den Druck — Standard-Eindämmung."
        ]
      },
      possession_web: { name: "Ballbesitz-Netz", desc: "+14 VIS / +6 OFF / +6 DEF für 2 Runden, +Flow 2 mit Possession-Taktik. Sonst +8 VIS / +4 CMP.",
        flavorHit: [
          "{pm} spinnt das Netz — {opp} kommt nicht an den Ball.",
          "Ballbesitz-Dominanz — zwanzig Pässe in deren Hälfte.",
          "Team kontrolliert alles — {opp} nur noch am Hinterherlaufen."
        ],
        flavorMiss: [
          "{pm} versucht zu weben — noch zu locker.",
          "Zirkulation langsam, kein Rhythmus da.",
          "Team hält den Ball — {opp} lässt sie gewähren."
        ]
      },
      flank_overload: { name: "Flügel-Überlast", desc: "+22 OFF / +10 TMP für 2 Runden + persistente Lane Open mit Flügelspiel-Taktik. Sonst +10 OFF / +4 TMP.",
        flavorHit: [
          "{lf} und Außenverteidiger überladen den Flügel — drei gegen einen!",
          "Flügelspiel zündet — {lf} kommt zweimal auf die Grundlinie.",
          "Überlast zieht sie nach außen — der Kanal ist weit offen."
        ],
        flavorMiss: [
          "{lf} zieht alleine durch — keiner überläuft.",
          "Versuch der Überlast — nur zwei gegen zwei.",
          "{lf} isoliert auf dem Flügel — muss es allein versuchen."
        ]
      },

      // Discard-Synergie Archetyp
      second_wind: { name: "Zweiter Wind", desc: "+4 TMP / +2 CMP, +Flow 1. Skaliert: +2 TMP / +1 CMP pro bereits abgeworfener Karte (cap 5).",
        flavorHit: [
          "Team findet den zweiten Gang — die Bank sieht's auch.",
          "{pm} steigt mit dem Rhythmus — Beine sind noch da.",
          "Müdigkeit verzieht sich — das Pressing wirkt wieder frisch."
        ],
        flavorMiss: [
          "Team holt Luft — moderater Reset.",
          "{pm} zieht das Tempo eine Stufe an.",
          "Leichter Gangwechsel, nichts Dramatisches."
        ]
      },
      dig_deep: { name: "Alles reinlegen", desc: "Wirf 1 zufällige Karte ab. +20 OFF / +4 TMP diese Runde. Wirkungslos bei leerer Hand.",
        flavorHit: [
          "{st} gräbt es raus — purer Wille findet die Chance!",
          "{lf} lässt den Plan fallen, macht's allein.",
          "Team erzwingt es — jemand muss den Versuch wagen."
        ],
        flavorMiss: [
          "{st} versucht zu erzwingen — nichts zum Ausgraben.",
          "Hand leer — keine Reserven mehr.",
          "Team hat nichts mehr reinzuwerfen."
        ]
      },

      // Draw-basiert
      tactical_pause: { name: "Taktische Pause", desc: "Ziehe 2 Karten. +6 CMP / +4 VIS diese Runde. Tauscht Durchschlagskraft gegen Karten-Geschwindigkeit.",
        flavor: [
          "{pm} verlangsamt das Ganze — liest das Match neu.",
          "Kurzer Reset an der Seitenlinie — neue Ordnung, neue Optionen.",
          "Trainer signalisiert Umdenken — Karten fließen schneller."
        ]
      },
      second_half: { name: "Halbzeit", desc: "Mischt Abwurfstapel ins Deck, ziehe 3. +Flow 1, +6 CMP / +3 TMP. Der Reset-Knopf.",
        flavor: [
          "Pfiff, Wasser, neuer Plan — Team kommt neu heraus.",
          "Halbzeit-Behandlung wirkt — {pm} führt den neuen Rhythmus.",
          "Reset über die ganze Linie — das ist jetzt ein anderes Match."
        ]
      },

      // Condition-Karten
      breather: { name: "Verschnaufpause", desc: "Müdester Spieler regeneriert +20 Kondition. Leichte defensive Unterstützung.",
        flavorHit: [
          "{target} winkt kurz ab — Team fällt zurück, holt Luft.",
          "Schnelle Trinkpause — {target} atmet durch, Beine kommen wieder.",
          "Trainer signalisiert Kontrolle — {target} setzt sich zurück."
        ],
        flavor: [
          "Team fällt einen Moment zurück, holt Luft.",
          "Schnelle Trinkpause beim Pfiff — die Beine kommen wieder.",
          "Trainer signalisiert kontrollierten Ballbesitz."
        ]
      },
      rotation: { name: "Rotation", desc: "Müdester Spieler erholt sich auf 90 Kondition. +Tempo / +CMP für 2 Runden. Selten, günstig.",
        flavorHit: [
          "Frische Beine für {target} — er lebt auf, die ganze Einheit mit ihm.",
          "Positionswechsel erfrischt {target} — Energie fließt durch das Team.",
          "Schlaue Rotation gibt {target} Luft — das Tempo knallt zurück."
        ],
        flavor: [
          "Frische Beine machen den Unterschied — Energie breitet sich aus.",
          "Team findet eine funktionierende Rotation — das Momentum kippt.",
          "Positionsverschiebung erfrischt die ganze Reihe."
        ]
      },
      doping: { name: "Alles auf eine Karte", desc: "Stürmer +30 Kondition. +10 OFF / +6 TMP diese Runde (+4 OFF bei aggressiv/tempo Tactic). 15-30% Backfire-Risiko: −4 CMP für den Match-Rest. Erzwungener Backfire ab 3. Spiel.",
        flavorHit: [
          "{st} hebt es auf ein anderes Level — rohe Energie flutet den Angriff!",
          "{st} zapft etwas an — einen Moment lang unaufhaltsam.",
          "Der Stürmer geht aufs Ganze — er brennt auf allen Zylindern."
        ],
        flavorMiss: [
          "{st} drückt zu hart — der Schiri zieht die Gelbe.",
          "{st} gibt alles — ein raues Tackling, eine Verwarnung.",
          "Der Push rächt sich — {st} übertritt und wird verwarnt."
        ],
        flavorForced: [
          "{st} wirft das Letzte rein — der Schiri hat genug gesehen, direkt Gelb.",
          "Der Körper verträgt keinen dritten Push mehr — {st} reißt jemanden um, Verwarnung.",
          "Drittes All-In — und {st} überschreitet die Linie die jeder Schiri sieht."
        ]
      },

      burn_plan: { name: "Verbrannter Plan", desc: "Verbanne eine zufällige andere Handkarte (kehrt nächstes Match zurück). +22 OFF / +10 TMP diese Runde.",
        flavorHit: [
          "Die Bank verbrennt eine Option — alle Augen schärfen sich auf den Rest.",
          "Opfer an der Taktiktafel — das Team zieht voll durch was übrig bleibt.",
          "Ein Plan wandert in den Müll, und plötzlich wirkt der Platz klarer."
        ],
        flavorMiss: [
          "Nichts mehr zu verbrennen — der Plan war schon schlank.",
          "Hand leer, kein Opfer — der Versuch stottert.",
          "Verbrannter Plan ohne Brennstoff — ein Funke, kein Feuer."
        ]
      },

      running_hot: { name: "Auf der Welle", desc: "+4 OFF / +2 TMP Basis, plus +3 OFF pro Sieg der aktuellen Serie (max +15). Skaliert weiter mit Momentum und aggressiv/tempo Tactics.",
        flavorHit: [
          "Das Team ist im Lauf — Selbstvertrauen macht sie einen Meter schneller.",
          "Sieger-Mentalität greift — alle bewegen sich mit Überzeugung.",
          "Fünf-Siege-am-Stück-Energie flutet den Platz."
        ],
        flavorMiss: [
          "Kalte Beine, kalte Köpfe — keine Welle zum Reiten.",
          "Keine Siege zum Anzapfen — der Boost bleibt gedämpft.",
          "Auf der Welle braucht Momentum — heute nur Frost."
        ]
      },

      second_wave: { name: "Zweite Welle", desc: "Ziehe 1 Karte. Spiele die letzte Karte diese Runde mit 60% Wirkung erneut.",
        flavorHit: [
          "Derselbe Zug, einen Takt später — ihre Abwehr kommt nicht zurück.",
          "Muster wiederholen — sie fallen noch drauf rein.",
          "Einmal ist ein Zug. Zweimal ist ein Trend — und Trends sind nicht zu stoppen."
        ],
        flavorMiss: [
          "Nichts zu echoen — die Welle schlägt in leeres Wasser.",
          "Kein früherer Zug zum Wiederholen — nur ein frischer Zug.",
          "Erste Welle des Matches — Echos kommen später."
        ]
      },

      tide_turner: { name: "Wende herbeiführen", desc: "Wirkt nur bei negativem Momentum. Reset auf +10, +18 OFF / +8 CMP, plus Konter.",
        flavorHit: [
          "Das Blatt wendet sich — und das Team spürt es.",
          "Eine Chance zum Kippen — {pm} greift zu.",
          "Aufschrei — die Abwehr rückt auf."
        ],
        flavorMiss: [
          "Zu früh — noch keine Wende nötig.",
          "Die Kurve ist noch bei uns — heb's für später auf.",
          "Momentum passt — kein Comeback nötig."
        ]
      },

      ride_the_wave: { name: "Auf der Welle", desc: "Nur bei Momentum ≥ +40. +24 OFF / +10 TMP / +6 CMP plus Flanke in den Strafraum.",
        flavorHit: [
          "Alles klappt — {lf} legt die Flanke auf den Kopf.",
          "Der Rausch kommt — {st} fliegt.",
          "Nicht zu stoppen — der Strafraum ist Chaos."
        ],
        flavorMiss: [
          "Fühlt sich nicht an — die Welle ist noch flach.",
          "Nicht genug Momentum — heb's auf.",
          "Auf der Welle braucht Momentum — heute nur Frost."
        ]
      },

      storm_warning: { name: "Sturmwarnung", desc: "+10 DEF / +4 CMP für 2 Runden. Nächstes Gegentor: Momentum-Verlust halbiert.",
        flavorHit: [
          "Stellung einnehmen — sie wissen, was kommt.",
          "{vt} ruft die Warnung — die Kette schließt auf.",
          "Sturm sehen, Abwehr verdichten."
        ]
      },

      tactical_discipline: { name: "Taktische Disziplin", desc: "Kosten 2 · SCHILD. +4 DEF / +3 CMP bis zum Trigger. Blockt die nächste Gegner-Karte komplett.",
        flavor: [
          "Köpfe bleiben kühl — keine Nickligkeiten, keine Fouls.",
          "{pm} ruft Disziplin — wir lassen uns nicht ködern.",
          "Mental vorbereitet — wir kennen ihren Plan."
        ]
      },

      counter_read: { name: "Gegenlesen", desc: "Kosten 2 · SCHILD. +6 VIS / +3 CMP diese Runde. Nächste Gegner-Karte wirkt nur zur Hälfte.",
        flavor: [
          "{pm} liest den Aufbau — einen halben Schritt voraus.",
          "Trigger zählen — rein bevor sie auslösen.",
          "Ihre Formation verrät den Plan — Schaden halbieren."
        ]
      },

      regroup: { name: "Neu ordnen", desc: "Kosten 3 · SCHILD. +10 DEF / +6 CMP / +4 TMP diese Runde. Löscht alle aktiven Gegner-Anpassungen und -Karten.",
        flavor: [
          "Plan zurücksetzen — alles was sie aufgebaut haben verpufft.",
          "Quasi-Auszeit. Ihre Welle bricht an der Null.",
          "Zurück auf Start — frische Basis, frische Beine."
        ]
      },

      intel_leak: { name: "Informantentipp", desc: "Kosten 1 · SCHILD. +5 VIS diese Runde. Zeigt die nächste Gegner-Karte bevor sie gespielt wird.",
        flavor: [
          "{pm} erkennt die Geste — wir sehen's kommen.",
          "Scout-Hinweis — ihr Plan ist nicht mehr geheim.",
          "Seitenlinie lesen — ihr Signal ist klar."
        ]
      },

      // ── v52.2 Draw-Archetyp ──
      quick_scout: { name: "Schneller Blick", desc: "Ziehe 2 Karten. +5 VIS / +2 TMP diese Runde. Flow-Tag.",
        flavor: [
          "{pm} schaut auf — zwei neue Optionen im Kopf.",
          "Kurzes Scannen, Bild klar — nächster Zug kommt von allein.",
          "Blickwechsel — {pm} liest die Räume neu."
        ]
      },

      study_opposition: { name: "Gegner lesen", desc: "Ziehe 2 Karten. +8 VIS / +3 CMP. Macht selbst schwache Gegner-Absichten blockbar für diese Runde.",
        flavorHit: [
          "Muster erkannt — jede Bewegung von ihnen ist jetzt angekündigt.",
          "{pm} studiert ihren Aufbau — nichts kommt mehr überraschend.",
          "Das Signal ist gelesen — wir wissen was kommt, auch wenn's leise war."
        ]
      },

      endgame_plan: { name: "Endphasen-Plan", desc: "Ziehe 3 Karten. Ab Runde 4 zusätzlich +Flow 1, +10 CMP / +6 VIS.",
        flavorHit: [
          "{pm} kennt die Uhr — jeder Zug zählt jetzt. Drei neue Optionen.",
          "Dressing-Room-Briefing verinnerlicht — das Team weiß was zu tun ist.",
          "Closing Time. {pm} zieht den Plan aus der Tasche."
        ],
        flavorMiss: [
          "Noch zu früh für den Endplan — aber drei frische Karten.",
          "Der Plan wartet — erstmal einfach die Hand auffrischen.",
          "Das Playbook kommt später. Jetzt: nur ziehen."
        ]
      },

      // ── v52.2 Inventory-Fill ──
      quick_screen: { name: "Schneller Schirm", desc: "+6 DEF / +3 TMP diese Runde. Press-Resist +1.",
        flavor: [
          "Schnelle Kette, kompakt — sie finden keine Lücke.",
          "{vt} verschiebt früh — das Anlaufen verpufft.",
          "Linie auf, Ball weg — simpel und sauber."
        ]
      },

      triangle_play: { name: "Dreieck-Spiel", desc: "+6 TMP / +4 VIS / +2 OFF. Erzeugt 1 Flow UND öffnet eine Bahn.",
        flavor: [
          "Kurz-kurz-lang — {pm} findet den Weg durchs Zentrum.",
          "Drei Mann, drei Berührungen — die Bahn ist auf.",
          "{pm} und {lf} spielen sich frei — Dreieck steht, Raum da."
        ]
      },

      pressure_trap: { name: "Druckfalle", desc: "Kosten 1 · KONTER. Bei Gegner-Angekündigt: +14 DEF / +6 CMP / +4 TMP und +Flow 1. Entschärft die Bedrohung. Sonst kleiner Basiseffekt.",
        flavorHit: [
          "Sie laufen rein — {vt} schließt die Falle, Ball zurück.",
          "Köder angenommen — Druckfalle zu, wir haben den Ball.",
          "Das Timing ist perfekt — ihr Angriff zerfällt, wir drehen um."
        ],
        flavorMiss: [
          "Falle gestellt — aber kein Zugriff zum Zuschnappen.",
          "Keine klare Bedrohung — die Falle bleibt leer stehen.",
          "Bereit zu reagieren, aber sie halten die Füße still."
        ]
      },

      set_piece: { name: "Standard-Routine", desc: "Kosten 1 · COMBO. Braucht Flow ≥ 2. Dann +26 OFF / +4 CMP plus Schuss — unabhängig von offener Bahn.",
        flavorHit: [
          "Ecke. Einstudiert. {st} kommt am ersten Pfosten — Schuss!",
          "Freistoß, kurze Variante — {pm} auf {st}, volle Breitseite!",
          "Standard läuft durch — jeder weiß wohin, {st} zieht ab."
        ],
        flavorMiss: [
          "Standard steht — aber ohne Vorbereitung verpufft die Routine.",
          "Kein Flow im Team — die Eckenvariante läuft ins Leere.",
          "Einstudiert, aber unvorbereitet — nichts geht durch."
        ]
      },

      deep_defense: { name: "Tief stehen", desc: "+20 DEF / +4 CMP diese Runde. Press-Resist +1.",
        flavor: [
          "Komplette Kette fällt zurück — Bus vor dem Tor.",
          "{vt} organisiert die Massen-Abwehr — sie kommen nicht durch.",
          "Alle Mann hinten — 'mal reicht's dem Gegner.'"
        ]
      },

      lone_striker: { name: "Ein-Mann-Sturm", desc: "Kosten 1 · COMBO. Wenn {st} ≥ 70 Kondition: +22 OFF / +6 CMP plus Schuss. Müder {st}: winziger Basiseffekt.",
        flavorHit: [
          "{st} wirft sich allein nach vorn — und trifft.",
          "{st} verbrennt die Abwehr — Schuss, Tor in Reichweite.",
          "{st} auf eigene Faust — die Beine haben noch Kraft."
        ],
        flavorMiss: [
          "{st} versucht's — die Beine sind zu schwer für den Solodurchbruch.",
          "{st} fehlt der Wumms — der Allein-Vorstoß versandet.",
          "{st} kommt nicht mehr weg — zu müde für den eigenen Weg."
        ]
      },

      team_unity: { name: "Mannschaftsgeist", desc: "Kosten 2. Jeder Startspieler unter 60 Kondition erhält +10. Bis zu +12 CMP + 2 VIS skalierend mit Anzahl erholter Spieler.",
        flavorHit: [
          "Kurze Einheit am Mittelkreis — Atem holen, wir schaffen das.",
          "{pm} ruft die Truppe zusammen — noch mal konzentrieren.",
          "Blicke austauschen, Fäuste zusammen — das Team wacht auf."
        ],
        flavorMiss: [
          "Einheit beschworen — aber die Beine sind eh frisch.",
          "Kein Bedarf an Neustart — alle noch im Saft.",
          "Die Ansage läuft ins Leere — alle sind wach genug."
        ]
      },

      final_whistle: { name: "Schlusspfiff", desc: "Kosten 1 · COMBO · RETAIN. Ab Runde 5, wenn nicht in Führung: +20 OFF / +10 TMP / +6 CMP, Bahn auf, +Flow 1 plus Schuss. Sonst reiner Kleinsteffekt.",
        flavorHit: [
          "Letzte Chance — {st} spürt's, ALLES oder nichts.",
          "Uhr läuft runter — und das Team dreht auf. Schlusspfiff naht!",
          "Die letzte Attacke — {pm} schickt {st} auf die Reise."
        ],
        flavorMiss: [
          "Zu früh im Match — den Endlauf heben wir uns auf.",
          "Führung in der Hand — kein Grund für die Brechstange.",
          "Pfeife schweigt noch — der große Zug wartet."
        ]
      },

      last_stand: { name: "Letzte Bastion", desc: "Kosten 1 · ABWEHR. Bei Rückstand: +24 DEF / +10 CMP, nächstes Gegentor halber Momentum-Verlust. Sonst kleiner Basiseffekt.",
        flavorHit: [
          "Rücken zur Wand — und das Team zieht die Leinen straff.",
          "{vt} brüllt die Kette zusammen — hier kommt keiner mehr durch.",
          "Der Rückstand hat sie geweckt — kompromisslose Verteidigung."
        ],
        flavorMiss: [
          "Kein Rückstand, keine Letzte-Bastion-Energie — wir verteidigen ruhig.",
          "Defensiv gehalten — aber ohne Drama, nicht der Moment.",
          "Wir führen — die Notbremse bleibt im Schrank."
        ]
      },

      field_commander: { name: "Spielführer", desc: "Kosten 2 · AUSLÖSER. Fit {pm} (≥50 Kondition): +14 OFF / +10 TMP / +6 CMP / +6 VIS plus +Flow 1. Müder {pm}: Kleinsteffekt.",
        flavorHit: [
          "{pm} übernimmt — jeder weiß wohin, der Ball fliegt.",
          "Der Kapitän dirigiert — das Team läuft wie auf Schienen.",
          "{pm} wird zum Regisseur — vier Mann laufen gleichzeitig los."
        ],
        flavorMiss: [
          "{pm} versucht zu dirigieren — aber die Luft ist raus.",
          "Die Stimme ist leiser — {pm} kann nicht mehr Taktgeber sein.",
          "Kommandos kommen spät — müde Beine schlucken die Präzision."
        ]
      },

      break_the_line: { name: "Kette durchbrechen", desc: "Kosten 2 · COMBO · Flow ≥ 2. Verbraucht Flow 2, öffnet Lane. +22 OFF, +8 TMP (+15 gegen Lockdown oder Big-Move). Bonus-Schuss.",
        flavorHit: [
          "{st} findet die Lücke im Beton — durch die Kette durch.",
          "Ein Pass durchs Zentrum — {lf} läuft ungehindert.",
          "Der Bunker bricht — {pm} spielt den entscheidenden Ball."
        ],
        flavorMiss: [
          "Zu wenig Flow — die Kette hält.",
          "Keine Öffnung — der Plan läuft ins Leere."
        ]
      },
      medic: { name: "Kabinenruf", desc: "Kosten 1 · DEFENSE. Heilt 25 Kondition (bevorzugt das gefoulte Opfer). +4 CMP / +3 DEF.",
        flavor: [
          "Kurz raus, Spray drauf — {name} kommt wieder.",
          "Der Betreuer jagt hoch, hilft {name} auf die Beine.",
          "Schnelle Behandlung — {name} spielt weiter."
        ]
      },
      poker_face: { name: "Pokerface", desc: "Kosten 1 · DEFENSE. Nächste Karte ist immun gegen Disruption. Hebt Fake-Press / Study-Tape auf. +8 CMP / +4 VIS.",
        flavor: [
          "{pm} zeigt nichts — keine Regung im Gesicht.",
          "Unbewegter Blick — der Gegner kann nicht lesen.",
          "Das Team verrät nichts — der Plan bleibt verdeckt."
        ]
      },
      read_the_game: { name: "Spiel lesen", desc: "Kosten 1 · DRAW. Zeigt den nächsten Gegner-Zug an. Ziehe 1, +1 Flow, +10 VIS / +3 CMP.",
        flavor: [
          "{pm} liest den Rhythmus — er weiß was kommt.",
          "Zwei Sekunden voraus — {pm} hat den Plan geknackt.",
          "Die Signale sind klar — der Gegner ist durchschaubar."
        ]
      },
      late_winner: { name: "Später Knockout", desc: "Kosten 2 · COMBO. Ab Runde 5: +28 OFF, +10 CMP, +6 TMP, ignoriert Gegner-Defensivbuffs. Bonus-Schuss. Früh: nur +5 CMP.",
        flavorHit: [
          "Die Schlussminuten — {st} findet den Moment.",
          "Wenn's zählt, ist {st} da — später Held.",
          "Die Zeit tickt, {st} zieht ab — perfekter Timing."
        ],
        flavorMiss: [
          "Zu früh — die Karte braucht das Ende.",
          "Der Timing stimmt nicht — die Wirkung bleibt aus."
        ]
      },
      clutch_defense: { name: "Clutch-Defense", desc: "Kosten 2 · DEFENSE. Blockt angekündigten Big-Move GARANTIERT. +30 DEF / +12 CMP. Ohne Big-Move: +12 DEF und fängt den nächsten Schuss.",
        flavorHit: [
          "{tw} liest den Big-Move — zu Null abgewehrt.",
          "Die Kette stellt sich — ihr Signature-Play verpufft.",
          "{vt} wirft sich rein — im entscheidenden Moment."
        ],
        flavorMiss: [
          "Keine große Drohung in der Luft — Ruhe-Position.",
          "Sicherheit einbauen — falls doch was kommt."
        ]
      },
      counterpunch: { name: "Konter-Gegenkonter", desc: "Kosten 1 · COUNTER. Bei Counter-Blitz angekündigt: +18 OFF, +8 TMP, +6 DEF, löst Konter aus. Ohne: +6 OFF / +4 TMP.",
        flavorHit: [
          "{lf} dreht den Spieß um — aus dem Nichts vor ihr Tor.",
          "Ihr Konter wird zum unseren — {st} läuft durch.",
          "Die Balleroberung zündet — Gegenkonter mit Wucht."
        ],
        flavorMiss: [
          "Kein Konter in Sicht — kleine Absicherung.",
          "Nichts zum Drehen — einfacher Tempo-Push."
        ]
      },
      scout_report: { name: "Scouting-Bericht", desc: "Kosten 2 · DRAW. Enthüllt die nächsten 2 Gegner-Züge. Ziehe 2, +2 Flow, +14 VIS / +4 CMP.",
        flavor: [
          "{pm} hat die Video-Analyse drauf — er weiß alles.",
          "Zwei Züge voraus — das Team hat den Rhythmus geknackt.",
          "Der Plan des Gegners liegt offen — wir spielen sie aus."
        ]
      }
    },

    oppMove: {
      overload_flank: { name: "Flügel-Überladung", telegraph: "Sie laden die Flanke auf — nächster Schuss wird gefährlicher." },
      quick_strike: { name: "Blitzschuss", telegraph: "Sofortiger Schuss am Rundenanfang — keine Vorwarnung." },
      long_ball: { name: "Langer Ball", telegraph: "Alles auf den Stürmer — riskanter Pass, starke Offense." },
      pressing_surge: { name: "Pressing-Welle", telegraph: "Sie gehen früh drauf — Aufbauten werden gestört." },
      counter_blitz: { name: "Konter-Blitz", telegraph: "Bei Parade: sie schalten sofort um." },
      rage_offensive: { name: "Rage-Offensive", telegraph: "Sie werfen alles nach vorne — Extra-Angriff." },
      park_the_bus: { name: "Bus parken", telegraph: "Komplette Kette zurück — schwer durchzukommen." },
      bunker: { name: "Bunker", telegraph: "Der Keeper konzentriert sich — Paraden werden sicherer." },
      low_block: { name: "Tiefer Block", telegraph: "Sie stellen sich massiv hinten rein — Combos dämpfen." },
      mental_wall: { name: "Mentale Wand", telegraph: "Sie spielen auf die Nerven — unsere Composure leidet." },
      tactical_foul: { name: "Taktisches Foul", telegraph: "Der Stürmer geht zu Boden — Kondition verloren." },
      fake_press: { name: "Fake-Pressing", telegraph: "Sie täuschen Druck vor — unsere nächste Karte schwächer." },
      time_waste: { name: "Zeitspiel", telegraph: "Sie spielen auf Zeit — wir ziehen weniger Karten." },
      dirty_tackle: { name: "Schweres Tackling", telegraph: "Rude — ein Starter verliert massiv Kondition." },
      study_tape: { name: "Videoanalyse", telegraph: "Sie studieren uns — zwei Runden offener Spielplan." },
      training_focus: { name: "Trainings-Fokus", telegraph: "Sie justieren einen Wert dauerhaft für dieses Match." },
      captain_speech: { name: "Kapitäns-Ansprache", telegraph: "Motivationsboost — Composure-Plus über drei Runden." },
      signature_play: { name: "Signature-Play", telegraph: "Ihr einstudierter Killer-Move — garantiertes Tor wenn ungeblockt!" },
      desperation_push: { name: "Verzweiflungs-Push", telegraph: "Alle Mann nach vorne — drei Angriffe in dieser Runde!" },
      tiki_taka_press: { name: "Tiki-Taka-Druck", telegraph: "Ballbesitz-Dominanz — drei Runden erhöhte Offensivkraft!" }
    },

    oppArchetype: {
      catenaccio: "{opp} spielt CATENACCIO — defensiv, geduldig, tödlich im Konter.",
      gegenpressing: "{opp} spielt GEGENPRESSING — hohes Pressing, zermürbend.",
      tiki_taka: "{opp} spielt TIKI-TAKA — Ballbesitz, später Hammer.",
      direct_play: "{opp} spielt DIRECT PLAY — aggressiv, risikoreich.",
      chaos: "{opp} spielt CHAOS — unberechenbar."
    },

    // Inline-Situationsframes — ersetzen alte Modal-Events wenn Karten an sind.
    frames: {
      strikerFrustrated: {
        title:  "STÜRMER FRUSTRIERT",
        text:   "{name} hat {n} Chancen verbrannt und kocht.",
        effect: "−6 OFF diese Runde",
        hint:   "Spiel ein Setup auf ihn — Schneller Aufbau oder Zurückfallen holt ihn raus."
      },
      keeperInZone: {
        title:  "TORWART-SERIE",
        text:   "{name} hat {n} Schüsse in Folge gehalten — unhaltbar gerade.",
        effect: "Abwehr +10 · nächste Parade +12",
        hint:   "Druck machen mit einer Angriffskarte."
      },
      hotCorridor: {
        title:  "BAHN IST WEIT OFFEN",
        text:   "{name} hat den Kanal für sich.",
        effect: "Lane Open · +5 TMP · +4 OFF",
        hint:   "Vorwärtsdrang oder Eiskalter Abschluss zahlen sich aus."
      },
      oppStarDown: {
        title:  "SIE SIND ANGESCHLAGEN",
        text:   "{opp} hat den Rhythmus verloren.",
        effect: "+8 OFF · +6 TMP · nächster Gegner-Trait gedämpft",
        hint:   "Nachsetzen. Eine Combo-Karte macht den Sack zu."
      },
      redCardRisk: {
        title:  "AUF MESSERS SCHNEIDE",
        text:   "{name} ist ein falsches Tackling vom Platzverweis entfernt.",
        effect: "−4 CMP · aggressives Spiel riskiert Feldverweis",
        hint:   "Defensivkarten sind sicher. Pressing ist Glücksspiel."
      },
      oppKeeperShaky: {
        title:  "IHR KEEPER IST GESCHLAGEN",
        text:   "Der Keeper von {opp} hat die Orientierung verloren.",
        effect: "+10 OFF · nächste gegnerische Parade gedämpft",
        hint:   "Mit einer Abschluss-Karte durchziehen — er liest die Läufe falsch."
      },
      oppDefenseStretched: {
        title:  "IHRE ORDNUNG BRICHT",
        text:   "{opp} läuft hinterher — Lücken tun sich auf.",
        effect: "+8 OFF · +6 VIS · ihr nächster Aufbau erschwert",
        hint:   "Combo durchs Zentrum — niemand deckt mehr."
      },
      conditionCritical: {
        title:  "KRITISCHE ERMÜDUNG",
        text:   "{name} läuft auf Reservetank — Beine weg, Timing zerstört.",
        effect: "−2 CMP team-weit · Ermüdungsstrafen stapeln sich",
        hint:   "Verschnaufpause oder Rotation JETZT, sonst bricht es ein."
      }
    },

    cardDraft: {
      addTitle:      "KARTE HINZUFÜGEN",
      addSubtitle:   "Wähle eine Karte für dein Deck. Dein Build wird schärfer.",
      removeTitle:   "DECK AUSDÜNNEN",
      removeSubtitle:"Wähle eine Karte zum dauerhaften Entfernen. Weniger Deck = mehr Konsistenz.",
      bossTitle:     "BOSS-BELOHNUNG",
      bossSubtitle:  "Du hast einen Boss gestürzt. Nimm zwei Karten um dein Deck zu schärfen.",
      replaceStep1Title:    "AUSTAUSCHEN — SCHRITT 1/2",
      replaceStep1Subtitle: "Wähle eine Karte zum Entfernen. Der Ersatz kommt als Nächstes.",
      replaceStep2Title:    "AUSTAUSCHEN — SCHRITT 2/2",
      replaceStep2Subtitle: "Wähle den Ersatz für die entfernte Karte.",
      upgradeTitle:         "AUFWERTEN",
      upgradeSubtitle:      "Wähle eine Karte zum Aufwerten — dauerhafter +25% Effekt.",
      actionAdd:     "+ NEHMEN",
      actionRemove:  "− ENTFERNEN",
      actionUpgrade: "↑ AUFWERTEN",
      skipAdd:       "Karte auslassen",
      skipRemove:    "Alle behalten",
      skipUpgrade:   "Aufwertung auslassen"
    },
    decisions: {
      // Focus-Keys entfernt — Focus-System deprecated.
      subTitle: 'Auswechslung',
      subSubtitle: 'Jemanden von der Bank holen.',
      subOption: '{name} ({role}) einwechseln — raus: {out}',
      subDone: '{incoming} für {outgoing}.',
      subLegendary: 'Legende kommt — Impact verstärkt.',
      subRoleMismatch: 'Rollen-Mismatch — {role} spielt positionsfremd. -8 Defense diese Runde.',
      noSub: 'Keine Auswechslung',
      noSubDesc: 'Aktuelle Aufstellung beibehalten.'
    },
    optionBadges: {
      fitsSquad: 'PASST',
      risky:    'GEWAGT',
      synergy:  'SYNERGIE ×{mult}',
      conflict: 'KONFLIKT ×{mult}',
      synergyShort:  'SYNERGIE',
      conflictShort: 'KONFLIKT',
      fitsSquadTooltip: 'Diese Taktik passt zu deinem Kader — voller Effekt.',
      riskyTooltip:     'Diese Taktik passt nicht zu deinem Kader — reduzierter Effekt.',
      synergyTooltip:   'Synergiert mit deinen vorherigen Entscheidungen — verstärkt.',
      conflictTooltip:  'Steht im Konflikt zu deinen vorherigen Entscheidungen — reduzierter Effekt.'
    },
    optionHints: {
      scalesDeficit: '↑ wächst mit deinem Rückstand',
      scalesLead:    '↑ wächst mit deiner Führung'
    },
    gameover: { title: 'GAME OVER' },
    victory: {
      survived: '{n} Matches gespielt',
      promotion: 'Aufstieg · Saison abgeschlossen',
      relegation: 'Abstieg · Saison beendet',
      champion: 'Meister · Saison abgeschlossen',
      cupChampion: 'Pokal gewonnen — Run komplett',
      cupRunnerUp: 'Im Pokal ausgeschieden — Run vorbei',
      stats: 'RUN-STATS',
      squad: 'KADER'
    },
    transition: {
      welcomeTo: 'WILLKOMMEN IN',
      dropTo: 'ABSTIEG IN',
      cupTitle: 'DER POKAL!',
      cupSub: '3 BOSSE STEHEN ZWISCHEN DIR UND DER TROPHÄE',
      cupNarration: 'Du hast die Pro Liga gemeistert. Jetzt: Knockout. Drei Bosse, eskalierende Härte. Verlierst du eine Runde, ist dein Run vorbei.',
      promoSub: 'NEUE SAISON · STÄRKERE GEGNER',
      promoNarration: 'Du bist eine Liga höher. Die Gegner sind härter, die Bosse fordernder. Dein Roster bleibt — pass deine Taktik an.',
      dropSub: 'NEUSTART · LIGA TIEFER',
      dropNarration: 'Die letzte Saison lief schlecht. Du fängst eine Liga tiefer wieder an. Nutze die Chance.',
      staySub: 'GLEICHE LIGA · NEUE SAISON',
      stayNarration: 'Du bleibst in der Liga. Andere Gegner, gleiche Herausforderung — diesmal vielleicht oben?',
      companionPromo: 'MITAUFSTEIGER:',
      companionDrop: 'MITABSTEIGER:',
      continue: 'WEITER'
    },
    oppCards: {
      tacticalFoul: [
        '{opp} hauen uns im Gegenangriff zynisch um — Standardsituation, unser Schwung weg.',
        'Zwei Gelbe binnen einer Minute — {opp} tauschen gerne Fouls gegen unseren Rhythmus.',
        '{opp}s Verteidiger gehen direkt durch den Knöchel. Zynisch, effektiv, hässlich.'
      ],
      parkTheBus: [
        '{opp} ziehen beide Flügelspieler in die Abwehr — elf Mann hinter dem Ball.',
        'Zehn-Mann-Defensiv-Bunker bei {opp}. Wir laufen gegen eine Wand.',
        '{opp} haben den Angriff aufgegeben — reines Schadensbegrenzungs-Modus.'
      ],
      equaliserPush: [
        '{opp}s Torwart rennt zur Ecke nach vorne — Brechstange-Zeit.',
        '{opp} bringen drei Stürmer. Sie wittern Blut und scheren sich nicht um die Abwehr.',
        '{opp} im Vollchaos — Flügel als Stürmer, Außenverteidiger als Flügel, All-In.'
      ],
      timeWasting: [
        '{opp}s Torwart braucht 90 Sekunden pro Abstoß. Die Zeit verrinnt.',
        '{opp} melken jeden Einwurf, jeden Standard. Die Uhr ist ihr Freund.',
        'Schwalben, falsche Verletzungen, langsame Anstöße — {opp} spielen die Zeit runter.'
      ],
      pressOverload: [
        '{opp} überfallen uns in der eigenen Hälfte — drei Mann am Ball, jedes Mal.',
        'Erstickendes Pressing von {opp} — unsere Verteidiger können nicht mal aufschauen.',
        '{opp} gehen vom Anstoß weg ins Vollpressing. Keine Sekunde zum Nachdenken.'
      ],
      setPiece: [
        '{opp} holen einen gefährlichen Freistoß am Strafraumrand. Mauer aufstellen.',
        'Ecke für {opp}, große Körper stürmen rein — wir müssen den ersten Ball klären.',
        '{opp}s Standard-Routine sieht einstudiert aus. Das wird eng.'
      ],
      chainCounter: [
        '{opp} lesen den Ballverlust, drei schnelle Pässe und sie sind in unserem Strafraum.',
        'Blitzkonter von {opp} — unsere Ordnung war komplett auseinander.',
        '{opp} ketten sechs Pässe nach dem Ballgewinn — klinisch und schnell.'
      ],
      desperateRally: [
        '{opp} werfen alles nach vorne — der Torwart steht auf der Mittellinie.',
        'Kompletter Wahnsinn bei {opp} — sie haben nichts zu verlieren und spielen so.',
        '{opp} packen in jeder Aktion vier Mann in unseren Strafraum — keine Struktur mehr.'
      ]
    },
    oppCardNames: {
      tacticalFoul:   'Taktisches Foul',
      parkTheBus:     'Abwehrschlacht',
      equaliserPush:  'Ausgleichs-Sturm',
      timeWasting:    'Zeitspiel',
      pressOverload:  'Pressing-Welle',
      setPiece:       'Standard-Gefahr',
      chainCounter:   'Konter-Kette',
      desperateRally: 'Verzweifelter Angriff'
    },
    nextUp: {
      title: 'ALS NÄCHSTES',
      legendaryRecruit: 'Legendärer Spieler im Angebot',
      cardDraftAdd: 'Wähle eine neue Karte für dein Deck',
      cardDraftRemove: 'Entferne eine Karte aus deinem Deck',
      cardDraftReplace: 'Karte ersetzen — tausche eine gegen eine neue',
      cardDraftDoubleAdd: 'Boss-Belohnung — wähle ZWEI Karten',
      cardDraftUpgrade: 'Karte aufwerten — +25% Effekt',
      roleEvolution: 'Rollen-Evolution — spezialisiere einen Stammspieler',
      nextMatch: 'Nächstes Match'
    },
    league: {
      title: 'LIGA-TABELLE',
      team: 'Team',
      teams: 'Teams',
      season: 'Saison {n}',
      seasonComplete: 'Saison Abgeschlossen',
      position: 'Platz {pos} von {total}',
      nextOpponent: 'Als Nächstes: {name}',
      rivalry: 'Rivalen-Duell — wir kennen sie'
    },
    codex: {
      title: 'CODEX',
      back: '← Zurück',
      tabs: {
        achievements: 'ACHIEVEMENTS',
        cards:        'KARTEN-DEX',
        legendaries:  'LEGENDEN'
      },
      progressAchievements: '{got} / {total} freigeschaltet',
      progressCards:        '{got} / {total} entdeckt',
      progressLegendaries:  '{count} rekrutiert',
      locked:       '??? — noch nicht freigeschaltet',
      cardLocked:   'Noch nicht gesehen — drafte oder spiele die Karte um sie zu entdecken.',
      emptyLegendaries: 'Noch keine Legenden. Besiege einen Boss und rekrutiere einen, um die Sammlung zu starten.',
      rarity: {
        common:   'COMMON',
        uncommon: 'UNCOMMON',
        rare:     'RARE'
      }
    },
    rivalry: {
      banner: 'RIVALITÄT',
      narration: {
        revenge: [
          '{opp} hat uns letztes Mal zerlegt ({lastOpp}-{lastMe}). Heute wird zurückgezahlt.',
          '{lastOpp}-{lastMe} stand es beim letzten Mal. {opp} schulden uns nichts — aber wir uns selbst.',
          'Sie haben uns damals geschlagen. Dieser Platz hat ein Gedächtnis.'
        ],
        dominant: [
          'Zuletzt: {lastMe}-{lastOpp}. {opp} kommen mit viel Wut im Bauch.',
          '{lastMe}-{lastOpp} haben wir sie beim ersten Aufeinandertreffen aufgerieben. Heute sind sie scharf.',
          '{opp} haben das letzte Ergebnis nicht vergessen. Heute klarer im Kopf.'
        ],
        grudge: [
          '{meetings} Begegnungen, keine Gnade. Grudge-Match.',
          '{opp} — wir mögen uns einfach nicht. Jeder Ball ist Kampf.',
          'Rivalität steht am Rand jeder einzelnen Begegnung.'
        ],
        blood: [
          'Schlechtes Blut. {humiliations} Kantersiege in {meetings} Duellen — hier endet die Freundlichkeit.',
          '{opp} vergessen nichts. Wir auch nicht. Blanker Grudge.',
          'Jedes Mal fließt Blut auf dem Platz. Heute nicht anders.'
        ],
        neutral: [
          'Zweites Duell mit {opp}. Rückspiel.',
          'Rematch. Gleicher Platz, andere Form.'
        ]
      }
    },
    achievements: {
      hatTrickRunner: { title: 'Dreierpack',         desc: '{name} drei Buden in einem Match' },
      runScorer10:    { title: 'Zweistellig',        desc: '{name} knackt 10 Tore im Run' },
      runScorer20:    { title: 'Torgarant',          desc: '{name} knackt 20 Tore im Run' },
      triggers50:     { title: 'Synergie-Motor',     desc: '50 Trait-Trigger im Run' },
      triggers150:    { title: 'Unaufhaltsam',       desc: '150 Trait-Trigger im Run' },
      win3:           { title: 'Heißer Lauf',        desc: '3 Siege in Folge' },
      win5:           { title: 'Dynastie',           desc: '5 Siege in Folge' },
      bossDown:       { title: 'Boss-Killer',        desc: 'Boss besiegt' },
      cleanSheet:     { title: 'Zu Null',            desc: 'Sieg ohne Gegentor' },
      comeback:       { title: 'Comeback-Könige',    desc: 'Sieg nach Halbzeit-Rückstand' },
      cupChampion:    { title: 'Pokalsieger',        desc: 'Pokal-Finale gewonnen' },
      cupRunnerUp:    { title: 'Pokal-Finalist',     desc: 'Finale erreicht, knapp verpasst' },
      cupShutout:     { title: 'Pokal-Mauer',        desc: 'Cup-Boss ohne Gegentor bezwungen' },
      cupUpset:       { title: 'Pokal-Überraschung', desc: 'Unterlegenen Cup-Sieg geholt' },
      firstPromotion: { title: 'Aufsteiger',         desc: 'Erster Aufstieg aus Amateur' },
      proSurvivor:    { title: 'Pro-Überlebender',   desc: 'Pro-Saison ohne Abstieg abgeschlossen' },
      seasonChampion: { title: 'Meister',            desc: 'Pro-Liga als Tabellenerster gewonnen' },
      dominantSeason: { title: 'Dominanz',           desc: '12+ Siege in einer Saison' },
      grudgeSlayer:   { title: 'Fehden-Bezwinger',   desc: 'Team mit grudge ≥ 3 besiegt' },
      bloodRivalWin:  { title: 'Blutsfehde',         desc: 'Blood-Rivalität-Match gewonnen' },
      nemesis:        { title: 'Nemesis',            desc: 'Selben Gegner 3× in Folge besiegt' },
      perfectDeck:    { title: 'Perfekter Drafter',  desc: 'Jedes Draft der Saison genutzt' },
      shieldMaster:   { title: 'Schild-Meister',     desc: '5× Gegner-Karte geblockt' },
      comebackCup:    { title: 'Pokal-Comeback',     desc: 'Cup-Match nach R3-Rückstand gedreht' }
    },
    cup: {
      title: 'POKAL',
      quarter: 'VIERTEL',
      semi: 'HALBFINALE',
      final: 'FINALE',
      eliminated: 'AUS',
      champion: 'POKALSIEGER'
    },
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
      highscore: '✦ BEST: {runScore} PKT · {wins}S-{draws}U-{losses}N · {outcome} ✦',
      outcomeChampion: 'Champion',
      outcomeSurvivor: 'Klasse gehalten',
      outcomeFired: 'Entlassen',
      outcomeCupChampion: '🏆 Pokalsieger',
      outcomeCupRunnerUp: 'Pokal-Finalist',
      outcomePromotion: 'Aufstieg',
      outcomeRelegation: 'Abstieg',
      outcomeSafe: 'Klasse gehalten',
      seasons: 'Saisons',
      seasonLabel: 'S{n}',
      cupModeLabel: 'POKAL',
      tier: {
        amateur: 'AMATEUR',
        pro: 'PROFI'
      },
      compactTeamMeta: '{lineup} + {bench}B',
      matchLabel: 'Match {num}: {me}:{opp} vs {name}',
      bossTell: 'Bosskampf — alle Stats erhöht, kein Fehler erlaubt',
      academy: 'AUSHILFE'
    },
    statsPanel: {
      title: 'Statistik',
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
      buffsFootnote: 'Buffs addieren sich über Kickoff + Halbzeit + Finale',
      onTarget: 'Aufs Tor',
      phaseRelevantStats: 'Phasenrelevante Stats',
      whatMattersNow: 'Worauf es jetzt ankommt',
      liveFootnote: 'Live-Werte inkl. Form, Streaks, Fokus und aktiver Rundeneffekte.'
    },
    eventActors: {
      format: '{owner} {role} {name}',
      owners: {
        my:  'euer',
        opp: 'ihr'
      },
      roles: {
        TW:     'Torwart',
        VT:     'Verteidiger',
        PM:     'Spielmacher',
        ST:     'Stürmer',
        LF:     'Flügelspieler',
        player: 'Spieler'
      }
    },
    streaks: {
      zone:       'In der Zone',
      cold:       'Kalter Lauf',
      frustrated: 'Frustriert'
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
      refereeStern: 'Der Schiri pfeift heute schnell — jedes Duell ist ein Risiko.',
      freierMann: '{name} bricht durch — ein Läufer ist frei.',
      hitzigerMoment: 'Die Gemüter kochen nach dem letzten Tor.',
      keeperSaves: '{name} hat {n} Paraden in Folge — voll drin.',
      legendaryDemand: '{name} schaut von der Bank zu, will endlich rein.',
      momentumShift: '{n} Gegentore in Folge — das Match rutscht weg.',
      oppPmDirigent: 'Ihr Spielmacher {name} dirigiert — {n} saubere Aufbauten in Serie.',
      taktikwechsel: '{opp} tut sich schwer — sie werden gleich umstellen.'
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
    evolutions: {
      title: 'ROLLEN-EVOLUTION',
      subtitle: '{name} ({role}) hat die Kilometer in den Beinen. Wähle eine Spezialisierung.',
      actionChoose: '↑ ENTWICKELN',
      skip: 'Überspringen — generalistisch belassen',
      poacher: {
        name: 'STRAFRAUMSTÜRMER',
        desc: 'Lebt im Sechzehner. Instinkt und Abschluss. Aufbau ist nicht sein Ding.'
      },
      false9: {
        name: 'FALSCHE NEUN',
        desc: 'Fällt zurück, fädelt das Spiel ein. Ein Stürmer der nicht allein treffen will.'
      },
      invertedWinger: {
        name: 'INVERSER FLÜGEL',
        desc: 'Zieht auf den starken Fuß. Immer der Abschluss, selten die Flanke.'
      },
      traditionalWinger: {
        name: 'KLASSISCHER FLÜGEL',
        desc: 'Bleibt außen, brennt die Linie, zieht rein. Altmodisch, immer noch tödlich.'
      },
      regista: {
        name: 'REGISTA',
        desc: 'Tiefliegender Spielmacher. Denkt zwei Pässe voraus, spielt einen.'
      },
      boxToBox: {
        name: 'BOX-TO-BOX',
        desc: 'Von Strafraum zu Strafraum. Motor des Mittelfelds.'
      },
      ballPlayingDefender: {
        name: 'SPIELAUFBAUER',
        desc: 'Baut von hinten auf. Aufrücken, Linien brechen, der Form vertrauen.'
      },
      stopper: {
        name: 'BEINHARTER VERTEIDIGER',
        desc: 'Keine Show. Geht in den Stürmer, gewinnt den ersten Ball, ohne Ausnahme.'
      },
      sweeperKeeper: {
        name: 'TORHÜTER-LIBERO',
        desc: 'Hohe Linie, sichert alles vor dem Strafraum. Spielt wie ein Libero.'
      },
      shotStopper: {
        name: 'REAKTIONS-KEEPER',
        desc: 'Auf der Linie zuhause. Wenn es aufs Tor kommt, ist er zuerst da.'
      }
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
      promotion: 'AUFSTIEG!',
      relegation: 'ABSTIEG',
      seasonComplete: 'SAISON BEENDET',
      continueTo: 'WEITER IN',
      dropTo: 'ABSTIEG IN',
      defendTitle: 'TITEL VERTEIDIGEN',
      nextSeason: 'NÄCHSTE SAISON',
      enterCup: 'IN DEN POKAL',
      cupChampion: 'POKALSIEGER!',
      cupRunnerUp: 'POKAL-FINALIST',
      points: '{points} PUNKTE',
      record: '✦ NEUER REKORD ✦',
      bestScore: 'Bestwert: {points} Pkt ({team})',
      afterMatches: '{points} Punkte nach {matches} Spielen',
      bestRun: '✦ Neue Bestleistung ✦',
      eventTitle: 'SITUATION',
      eventSubtitle: 'Auf dem Platz passiert etwas.'
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
      halftimeRecovery: 'Kabinen-Pause — {count} Spieler zurück auf 80 Kondition.',
      cardCancelOppTrait: '✦ Karten-Effekt neutralisiert ihren geladenen Trait.',
      cardDampenOppTrait: '✦ Karten-Effekt schwächt ihren geladenen Trait ab.',
      // v52.7 — Opp wakes up after our 2-goal scoring streak
      oppWakeUp: '⚠ {opp} reorganisiert die Defensive — sie haben dich auf dem Schirm.',
      momentumZone: {
        rush:      '  Das Team ist im Rausch — alles klappt.',
        leading:   '  Wir haben jetzt die Oberhand.',
        neutral:   '',
        pressured: '  Unter Druck — alles zurück, durchstehen.',
        desperate: '  Mit dem Rücken zur Wand — jetzt alles nach vorn.'
      },
      momentumFumble: '  💥 Übermut! Das Team verliert den Faden.',
      finalChoice: '  → Finale: {name}',
      // v52.2 — stilles Taktik-Feedback (Drain / Keine Wirkung)
      tacticDrain:           '  ⚡ Taktik-Kosten: {parts}',
      tacticConditionMiss:   '  ⚠ {name}: Bedingung nicht erfüllt — keine Wirkung in dieser Phase.',
      tacticNoEffect:        '  ⚠ {name}: keine Wirkung angewendet.',
      possessionPressure: '  Ballbesitz: {pct}% — Druckphase',
      possessionDominated: '  Ballbesitz: {pct}% — Gegner dominiert',
      chainAttack: '  ⚡ Chain-Angriff!',
      luckyDouble: '  🍀 {name} hat Glück — Doppelangriff!',
      counter: '  🔁 Konter!',
      activeBuffs: '  📊 Aktive Buffs: {buffs}',
      oppMood: {
        cruising: [
          '{opp} schaltet einen Gang runter — sie beginnen zu schlendern.',
          '{opp} nimmt den Fuß vom Gas — die Führung macht sie bequem.',
          '{opp} wirkt zufrieden — weniger Sprints, mehr Querpässe.'
        ],
        bottling: [
          '{opp} zieht sich zusammen — Nervosität in den Gesichtern.',
          '{opp} verteidigt jetzt tief — sie spüren unser Kommen.',
          '{opp} spielt wie beim Halten einer Führung — Angst in der Form.'
        ],
        rattled: [
          '{opp} zieht sich ins Schneckenhaus zurück — Schadensbegrenzung.',
          '{opp} wird defensiv — jeder Ball nach hinten.',
          '{opp} parkt den Bus — sie versuchen nicht mehr zu spielen.'
        ],
        desperate: [
          '{opp} wirft alle nach vorne — All-in, nichts zu verlieren.',
          '{opp} geht Kamikaze — die Abwehr hat das Schiff verlassen.',
          '{opp} presst alles — panisch, gefährlich, offen.'
        ]
      },
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
      extratimeIntro: '⏱ VERLÄNGERUNG — {me}:{opp} nach 90 Minuten. Wer hält noch durch?',
      extratimeHalf: '🕐 EXTRATIME · {n}. HALBZEIT',
      extratimeGoalMe: '⚽ {name} schlägt in der Verlängerung zu! {me}:{opp}',
      extratimeGoalOpp: '😱 {scorer} trifft für {opp} — {me}:{oppScore}',
      extratimeNoGoalMe: '  Chance in der Verlängerung — vorbei.',
      extratimeNoGoalOpp: '  {opp} drüber — Glück gehabt.',
      extratimeEnd: '⏱ ENDE DER VERLÄNGERUNG — {me}:{opp}',
      extratimeStillTied: '  Immer noch Gleichstand. Jetzt entscheiden die Elfmeter.',
      shieldBlocked:  '{shield} — {oppCard} abgefangen, der Angriff verpufft.',
      shieldHalved:   '{shield} — Aufbau gelesen. {oppCard} nur halb so stark.',
      shieldRevealed: '👁 Informantentipp — {oppCard} lädt. Wir sehen es kommen.',
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
      eventCoachInstinct: '  🎯 Bauchgefühl — ausgewogener Ansatz.',

      // ─── Match-Intro / Form-Status / Kickoff-Kontext ─────────────────────
      matchIntro: [
        '{me} trifft auf {opp}.',
        'Anpfiff: {me} gegen {opp}.',
        '{me} vs {opp} — der Schiri gibt frei.',
        'Beide bereit. {me} vs {opp}.'
      ],
      formHot: [
        '🔥 Die Mannschaft fliegt — scharf und hungrig.',
        '🔥 Heißer Lauf — Selbstvertrauen durch die Decke.',
        '🔥 In Form. Heute wird sauber gekickt.'
      ],
      formCrisis: [
        '❄ Wackelige Form. Sie brauchen dringend ein Ergebnis.',
        '❄ Schwere Beine, schwere Köpfe. Das wird zäh.',
        '❄ Drei schlechte Auftritte in Folge. Heute muss was kommen.'
      ],
      opponentIntro: '  ↳ {parts}',
      kickoffChoice: '  → {name}',
      halftimeHeader: '––– HALBZEIT –––',
      halftimeChoice: '  → {name}',
      halftimeRecovery: 'Kabinen-Pause — {count} Spieler wieder bei 80 Kondition.',
      cardCancelOppTrait: '✦ Karteneffekt neutralisiert ihren geladenen Trait.',
      cardDampenOppTrait: '✦ Karteneffekt schwächt ihren geladenen Trait.',
      finalChoice: '  → {name}',

      // ─── Event-Narrationen (Spielverlauf-Events in 6 Runden) ─────────────
      eventPlaymakerRelease: '  ↗ {name} schickt den Läufer früh.',
      eventPlaymakerDictate: '  🎼 {name} drosselt das Spiel auf euer Tempo.',
      eventPlaymakerThread: '  🧵 {name} fädelt schärfere Pässe ein.',
      eventOppKeeperTarget: '  🎯 {name} wird von überall angeschossen.',
      eventCrashBox: '  🧨 Körper flutet den Strafraum — jeder Abpraller lebt.',
      eventResetProbe: '  🧭 Ein sauberer Zug noch — dann in die Lücke.',
      eventBacklineStepIn: '  ⬆ {name} rückt auf, Raum verengt sich.',
      eventBacklineHold: '  🧱 Die Linie bleibt kompakt — weniger Lücken, ruhigere Köpfe.',
      eventBacklineTrap: '  🪤 Die Kette sitzt auf dem Sprung — ein Fehlpass und ihr brecht durch.',
      eventPlayHardYellow: '  🟨 {name} geht voll rein — Karte vom Schiri. Jetzt auf der Kippe.',
      eventPlayHardClean: '  💢 {name} holt sich den Ball sauber — ohne Karte, voller Impact.',
      eventPlayClean: '  ✓ {name} zieht die Beine — mit Köpfchen gespielt, Composure hoch.',
      eventSubDefender: '  ⇄ {out} raus, {in} rein — frischer Abwehrmann stopft die Lücke.',
      eventWeatherAdapt: '  ☔ Formation enger, Tempo raus — an die Bedingungen anpassen.',
      eventWeatherPush: '  💨 Wetter ignorieren — volles Risiko nach vorn.',
      eventFanRally: '  📣 Fankurve brüllt — Team kanalisiert das Tempo.',
      eventFanIgnore: '  🔇 Spieler schalten ab — klinische Konzentration.',
      eventStarCapitalize: '  ⚡ Ihr Star ist nicht da — Druck hoch.',
      eventStarDiscipline: '  🛡 Form halten — sie nicht billig reinkommen lassen.',
      eventHotPlayerBoost: '  🔥 {name} bekommt das Vertrauen — permanenter {stat}-Boost.',
      eventHotPlayerStabilize: '  🛡 Struktur halten — individuelle Brillanz für Teamstabilität gezügelt.',
      eventCrisisTeamTalk: '  📢 Die Ansprache kommt an — Mannschaft aufgewacht.',
      eventCrisisTeamTalkFailed: '  Die Ansprache verpufft.',
      eventCrisisFocus: '  🎯 Einer trägt die Last.',
      eventCrisisAccept: '  Köpfe runter und durchbeißen.',
      eventOppMistakeExploit: '  ⚡ Sofortangriff — ihren Ausrutscher ausnutzen.',
      eventOppMistakeSustain: '  🏃 Druck aufrechterhalten — Gegner bleibt unter Dauerstress.',
      eventLegendaryBringOn: '  ⚜ {name} kommt. Das ändert alles.',
      eventLegendaryMorale: '  Die Bank pusht — kleiner Boost über alle.',
      eventSeasonFinaleAllIn: '  🔥 Alles auf den Titel — nichts zurückhalten.',
      eventSeasonFinaleControlled: '  Ruhig und kontrolliert — das Spiel zu euch kommen lassen.',
      eventStrikerLayoff: '  ↺ {name} fällt zurück — Ball über die Zentrale recyclet.',
      eventStrikerPush: '  💪 {name} zieht durch — Vertrauen in den Abschluss.',
      eventStrikerSwap: '  ⇄ {out} raus, {in} rein — frische Beine vorn.',
      eventKeeperLaunch: '  🧤→⚡ {name} schlägt lang — Konter läuft.',
      eventKeeperSolid: '  🛡 {name} bleibt ruhig — Rückhalt für den Rest.',
      eventOppStrikerPress: '  🏃 Frustrierten Stürmer pressen — {name} unter Druck.',
      eventOppStrikerGuard: '  🛡 Den Verzweiflungsschuss von {name} absichern.',
      eventMomentumTimeout: '  🕐 Auszeit — das Team sammelt sich.',
      eventMomentumSwitch: '  ⚙ Formation gewechselt — defensiver Konter-Modus an.',
      eventCorridorDouble: '  ↪ {name} geht nochmal — selber Kanal, selbes Chaos.',
      eventCorridorSwitch: '  ↔ Ball ins Zentrum — die Mitte geht auf.',
      eventOppPmHigh: '  ⬆ {name} hoch anlaufen — hohe Linie riskiert.',
      eventOppPmMark: '  🎯 {name} doppelt decken — Anspiel gekappt.',
      eventOppPmBait: '  🎣 Lasst ihn spielen — Konterfalle scharf.',
      eventHitzigCalm: '  🧘 Captain beruhigt die Truppe.',
      eventHitzigClean: '  😤 {name} bleibt cool — keine Karte.',
      eventHitzigYellow: '  🟨 {name} — gelbe Karte.',
      eventHitzigSecondYellow: '  🟨🟥 {name} — Gelb-Rot. Feldverweis.',
      eventHitzigRed: '  🟥 {name} — glatt Rot. Feldverweis.',
      eventHitzigIgnore: '  Die Spannung bleibt hängen.',
      eventFreierFoul: '  🟨 {name} holt den Läufer runter — gelbe Karte.',
      eventFreierFoulRed: '  🟨🟥 {name} — Gelb-Rot. Feldverweis.',
      eventFreierRetreat: '  Zurückziehen zur Absicherung — Schussqualität sinkt.',
      eventFreierKeeperWin: '  🧤 {name} holt ihn zu Füßen — geklärt!',
      eventFreierKeeperLose: '  ⚽ {opp} umkurvt {name} — leeres Tor.',
      eventClearFlat: '  📏 {name} — flach, ruhig, in die Ecke.',
      eventClearChip: '  🌙 {name} hebt — hohes Risiko, hohe Belohnung.',
      eventClearSquare: '  ⇄ {st} quer zu {lf} — Abstauber-Versuch.',
      eventTaktikLong: '  📏 Lange Bälle über die Kette.',
      eventTaktikHold: '  🎯 Ball halten — Ballbesitz-Lock aktiv.',
      eventTaktikMatch: '  💥 Aggression kontern — Pressing an.',

      // ─── Runden-Intros ───────────────────────────────────────────────────
      roundIntroTied: [
        'Gleichstand {me}:{opp} — alles drin.',
        'Noch torlos. Spannung steigt.',
        '{me}:{opp} — keiner gibt einen Meter her.',
        'Unentschieden. Das nächste Tor könnte alles entscheiden.'
      ],
      roundIntroLeading: [
        '{me}:{opp} — Vorteil verwalten.',
        'Führung {me}:{opp}. Form halten.',
        '{me}:{opp} — Kontrolle, vorerst.',
        'Vorne mit {me}:{opp}. Sie nicht zurückholen.'
      ],
      roundIntroTrailing: [
        '{me}:{opp} — Weg zurück finden.',
        'Rückstand bei {me}:{opp}.',
        '{me}:{opp} — der Druck wächst.',
        'Hinten bei {me}:{opp}. Jetzt muss was passieren.'
      ],
      roundIntroFinal: [
        'Letzte Runde. Alles oder nichts bei {me}:{opp}.',
        'Schlussphase. {me}:{opp}. Kein Fehler erlaubt.',
        'Jetzt entscheidet sich alles. {me}:{opp}.',
        'Eine Runde noch. {me}:{opp}. Das muss sitzen.'
      ],

      // ─── Possession / Struktur ───────────────────────────────────────────
      possessionPressure: [
        '  Ballbesitz {pct}% — Druck aufs Tor.',
        '  {pct}% Ball — eingebunkert in ihrer Hälfte.',
        '  Kontrolle bei {pct}% — Dauerdruck.'
      ],
      possessionDominated: [
        '  Eingezwängt bei {pct}% Ballbesitz.',
        '  Tief gedrängt — kaum am Ball.',
        '  {pct}% — am Limit, um die Form zu halten.'
      ],
      activeBuffs: '  📊 {buffs}',
      oppMood: {
        cruising: [
          '{opp} schaltet einen Gang runter — beginnen zu flanieren.',
          '{opp} nimmt Tempo raus — die Führung macht sie bequem.',
          '{opp} wirkt zufrieden — weniger Sprints, mehr Querpässe.'
        ],
        bottling: [
          '{opp} wird fest — Nerven sichtbar.',
          '{opp} verteidigt tief — spüren unseren Comeback-Druck.',
          '{opp} spielt auf Halten — Angst in der Formation.'
        ],
        rattled: [
          '{opp} zieht sich ganz zurück — Blutung stoppen.',
          '{opp} wird konservativ — jede Berührung geht rückwärts.',
          '{opp} stellt den Bus ab — sie spielen nicht mehr.'
        ],
        desperate: [
          '{opp} schickt alle nach vorn — all-in, nichts zu verlieren.',
          '{opp} geht Kamikaze — die Abwehr ist aufgelöst.',
          '{opp} presst alles — panisch, gefährlich, offen.'
        ]
      },

      // ─── Kleine Match-Events / Counter / Chain ───────────────────────────
      chainAttack: '  ⚡ Schnelle Kombination — noch eine Chance folgt.',
      luckyDouble: '  🍀 {name} erobert den Ball — zweiter Angriff!',
      counter: '  🔁 Ballgewinn — Konter läuft.',
      autoCounter: '  ⚡ Sie verschenken ihn — wir schlagen zu.',
      microBoost: '  ⚡ {name} · {stat} ↑ {value} (Entscheidung zahlt sich aus)',
      doubleCounter: '  ⚡⚡ Zwei Angriffe verpufft — Doppelkonter!',
      pressingCap: '  Pressing unterbindet ihren zweiten Lauf.',
      aggressiveThird: '  💥 Welle um Welle — dritter Angriff folgt.',
      rallyReaction: '  💢 Sofortantwort nach Gegentor.',
      flankRun: '  {name} sprintet die Außenbahn runter — Extra-Chance.',
      momentumBuilt: '  Momentum baut sich auf — Dauerkontrolle zahlt sich aus.',
      momentumZone: {
        rush:      '  Die Mannschaft ist im Rausch — alles klickt.',
        leading:   '  Wir haben jetzt die Oberhand.',
        neutral:   '',
        pressured: '  Unter Druck — zurückfallen, durchstehen.',
        desperate: '  Rücken zur Wand — letzter Versuch jetzt.'
      },
      momentumFumble: '  💥 Überheblich! Das Team verliert die Blase.',

      // ─── Halbzeit-Summary ────────────────────────────────────────────────
      htSummaryPressing: 'Pressing blockiert {n} Angriffe',
      htSummaryCounters: 'Konter-System hat {n}x ausgelöst',
      htSummaryMomentum: 'Momentum aktiv',

      // ─── Form-Pools ──────────────────────────────────────────────────────
      pressingBeaten: [
        '  {opp} findet die Lücke — hinter dem Pressing tut sich Raum auf.',
        '  Die Linie ist durchbrochen — {opp} ist durch.',
        '  Pressing ausgespielt — {opp} hat Überzahl vorn.'
      ],
      aggressiveError: [
        '  Zu hektisch — der Zug bricht in der Umschaltung zusammen.',
        '  Übereifrig — Ball verloren.',
        '  Die Dringlichkeit rächt sich — loser Ball im Mittelfeld.'
      ],
      possessionLost: [
        '  Ball verschenkt — {opp} läuft schon.',
        '  Schlampiger Kontakt — {opp} presst sofort hoch.',
        '  Im Aufbau verloren — {opp} zum Konter bereit.'
      ],
      defensiveLackOfPunch: [
        '  Kompakt, aber zahnlos — keine Läufer nach vorn.',
        '  Die Form stimmt, aber dem Angriff fehlt Biss.',
        '  Zu zaghaft nach vorn.'
      ],
      leadComplacency: [
        '  Bequeme Führung — die Dringlichkeit schwindet.',
        '  Zwei vorne — vielleicht einen Tick zu entspannt.',
        '  Mit Polster arbeiten die Beine nicht mehr so hart.'
      ],
      deficitNervousness: [
        '  Dem Spiel hinterher — die Anspannung zeigt sich im Passspiel.',
        '  Rückstand macht sich bemerkbar — Entscheidungen überstürzt.',
        '  Hinten und drängend — Fehler schleichen sich ein.'
      ],
      allInExposed: [
        '  All-in und offen erwischt — {opp} findet den Raum.',
        '  Das Vabanque geht schief — {opp} hat Morgenland hinter sich.',
        '  Alle nach vorn — {opp} findet die Lücke.'
      ],
      attackingExposed: [
        '  Offensive Form lässt Räume — {opp} nutzt es.',
        '  Hohe Kette, dünne Absicherung — {opp} läuft durch.',
        '  Nach vorn zu gehen kostet — {opp} trifft im Umschaltmoment.'
      ],
      aggressiveExposed: [
        '  Aggressives Pressing bestraft — {opp} durch.',
        '  Zu hoch, zu offen — {opp} findet den Kanal.',
        '  Die Aggression dreht sich gegen sie — {opp} im Raum.'
      ],
      synergyCombo: [
        '{a} & {b} kombinieren',
        '{a} leitet {b} ein',
        'Schneller Austausch — {b} schließt ab',
        '{a} findet {b} im Raum',
        'Doppelpass: {a} zu {b}'
      ],
      ownGoalCombo: '⚽ TOR {name}! {combo}   {me}:{opp}',

      // ─── Epiloge ──────────────────────────────────────────────────────────
      epilogueWin: [
        'Drei Punkte. Job erledigt.',
        'Hart erkämpft — aber verdient.',
        'Die Mannschaft liefert, wenn es zählt.',
        'Verdient. Eiskalt, wenn es drauf ankam.'
      ],
      epilogueDraw: [
        'Ein Punkt für jeden. Beide Seiten lassen was liegen.',
        'Ehre gewahrt — hätte in beide Richtungen kippen können.',
        'Hart erkämpftes Unentschieden. Weiter.'
      ],
      epilogueLoss: [
        'Köpfe runter. Schwer zu schlucken.',
        'Heute nicht gut genug. Neu formieren.',
        'Sie waren schärfer. Lektion gelernt.'
      ],

      // ─── Tactic-Trigger-Narrationen ──────────────────────────────────────
      tacticPressingTrigger: '  Pressing zahlt sich aus — Ballgewinn.',
      tacticCounterTrigger: '  Konter vorbereitet — nächster Zug verstärkt.',
      tacticRallyTrigger: '  💪 Rally feuert — +{bonus} aus dem Rückstand.',
      tacticHighPressTrigger: '  Hoher Druck — Ball erobert.',
      tacticFinalPressTrigger: '  ⚡ Schlusspressing — Konter gestartet.',
      tacticGambleWin: '  🎲 Gamble glückt — +35 Team-Offense.',
      tacticGambleLoss: '  🎲 Gamble verpufft — -15 auf alle Stats.',
      tacticShakeUp: '  🔄 Shake-up: {name} bestraft, Team schärft.',
      tacticLoneWolf: '  🐺 Einzelkämpfer: {name} trägt es.',
      tacticFortress: '  🛡 Festung: {tw} & {vt} schließen die Hintermannschaft.',
      tacticMasterclass: '  🎼 Masterclass: {name} dirigiert.',
      tacticFit: '  ✓ {name} — Bedingungen erfüllt, Bonus angewendet.',

      // ─── Trait-Trigger (Spieler-Traits) ─────────────────────────────────
      laserPass: '🎯 {name} — Laserpass, Konter läuft.',
      bulldoze: '🛡 {name} — walzt durch, Ball erobert.',
      hardTackle: '🥾 {name} — harte Grätsche, Konter!',
      chessPredict: '♟ {name} — liest es perfekt, Tor annulliert.',
      speedBurst: '💨 {name} — Aufbau garantiert.',
      pounce: '🐆 {name} — stürzt sich auf den Fehler.',
      oppBlitzCounter: '  ⚡ {name} ({team}) schlägt sofort zurück.',
      shadowStrike: '{name} — Phantomlauf, plötzliche Chance.',
      streetTrick: '{name} — lässt den Verteidiger stehen.',
      silentKiller: '{name} — erster Kontakt, maximale Wirkung.',
      cannonBlast: '{name} — hält drauf.',
      ghostRun: '{name} — taucht aus dem Nichts auf.',
      puzzleConnect: '{name} — das letzte Puzzleteil.',
      nineLives: '🐱 {name} — auf der Linie geklärt. Noch am Leben.',
      killerPass: '⚡ {name} — der Pass öffnet die nächste Chance.',
      maestroCombo: '🎼 {name} — die Kombination sitzt. Nächstes Tor zählt doppelt.',
      unstoppable: '🚀 {name} — durch aufs Tor, nicht mehr zu stoppen.',
      godMode: '⭐ {name} — alles klappt. Nächstes Tor zählt dreifach.',
      unbreakable: '🛡 {name} — steht. Tor annulliert.',

      // ─── Synergien / Konflikte / Misfits ─────────────────────────────────
      synergyAmplified: '  🔗 Pressing-Synergie — Entscheidung verstärkt.',
      synergyConflict: '  ⚠ Taktik-Konflikt — Entscheidung reduziert.',
      synergyPressingCombo: '  🔗 Pressing + Pressing-Entscheidung — in der Zone.',
      synergyPossessionPM: '  🔗 Ballbesitz + Playmaker-Focus — Stil-Kohärenz-Bonus.',
      conflictPressingAfterPossession: '  ⚠ Pressing nach Ballbesitz-Kickoff — Energie falsch verteilt.',
      conflictPressingCollapse: '  ⚠ Bestehender Misfit — Pressing-Entscheidung risikoreich.',
      conflictPlayerCrisis: '  ⚠ Spieler in Krise — Fokus riskant.',
      conflictPlayerHot: '  🔗 Spieler in Form — Fokus verstärkt.',
      conflictLegendarySub: '  🔗 Legende kommt — Impact verstärkt.',
      misfitPressingCollapse: '  ⚠ Pressing kollabiert — Beine tragen es nicht.',
      misfitCounterStall: '  ⚠ Konter stockt — niemand schnell genug zum Durchlaufen.',

      // ─── Karten (gelb/rot im Match-Log) ──────────────────────────────────
      cardYellow: '  🟨 {name} — gelbe Karte.',
      cardRed:    '  🟥 {name} — rote Karte. Nächstes Match gesperrt.',

      // ─── Streaks ─────────────────────────────────────────────────────────
      streak: {
        myTeam: {
          zone:       '  🔥 {name} ist in der Zone — scharf wie Glas.',
          cold:       '  ❄ {name} ist kalt — das Selbstvertrauen weg.',
          frustrated: '  😤 {name} ist frustriert — kurze Zündschnur.'
        },
        oppTeam: {
          zone:       '  🔥 {name} ({team}) ist in der Zone — aufpassen.',
          cold:       '  ❄ {name} ({team}) ist kalt geworden.',
          frustrated: '  😤 {name} ({team}) verliert die Nerven.'
        }
      },

      // ─── Gegner-Trait-Trigger ────────────────────────────────────────────
      oppTrait: {
        sturmShot: '  {name} ({team}) — präzise im Abschluss, jeder Schuss zählt.',
        sniperShot: '  {name} ({team}) — wählt die Ecke, klinische Verwertung.',
        riegelDeny: '  {name} ({team}) — Paraden werden immer schwerer.',
        presserDisrupt: '  {name} ({team}) — hohes Pressing stört den Aufbau.',
        ironwallEarly: '  {name} ({team}) — Abwehrbollwerk früh aufgebaut, nahezu undurchdringlich.',
        clutchSurge: '  {name} ({team}) — später Schub, Energielevel steigt.',
        bulwarkDeny: '  🛡 {name} ({team}) — Bollwerk! Der Ball wird von der Linie gekratzt.'
      },
      oppRageAttack: '  🔥 {team} — Rage-Offensive: sie werfen alles nach vorne.',
      attackCapped: '  ⚠ Zu viel Druck auf einmal — Angriffswucht wird auf die nächste Chance übertragen.',
      pressingResisted: '  ⚠ {opp} lebt vom Druck — dein Pressing prallt ab.',
      aggressiveResisted: '  ⚠ {opp} konter-presst — deine Aggressivität öffnet keine Räume.',
      oppMoveTelegraph: '  ▸ {opp} lädt: {name} [{sev}]',
      oppMoveQuiet: '  · {opp}: {name}',
      // v0.50 — Soft-Defuse-Log. Emittiert wenn der Spieler eine
      // Defense/Counter-Karte in dieser Runde gespielt hat und aktiver
      // Defense-Buff ≥ 8 ist. cls='player-shield' damit das Telemetrie-
      // Tracking es als defused zählt.
      oppMoveSoftDefused: '  ✓ Defense-Puffer absorbiert {name} — dämpft den Effekt.',
      oppMove: {
        quickStrike: '  ⚡ {opp} — Blitzschuss!',
        extraAttack: '  ▸ {opp} setzt nach!',
        counterBlitz: '  ↺ {opp} — Konter nach Parade!',
        signatureGoal: '  🎯 {opp} zieht den Signature-Play durch — ungeblockt!'
      }
    },
    // v0.47 — Counter-Hinweise pro Opp-Move-Kategorie. Werden als
    // zweite Zeile nach dem Telegraph eingeblendet (nur bei severity
    // ≥ 2), damit der Spieler weiß welche Art von Karte kontern kann.
    // Allgemein gehalten — präzise "Karte X kontert Move Y"-Mapping
    // wäre Phase 2. Bewusst als Wegweiser, nicht als Garantie.
    oppMoveCounter: {
      aggressive: '    ↳ Counter: Defense-Karten dämpfen den Angriff (Zurückfallen, Kompakte Ordnung, Zonenverteidigung).',
      lockdown:   '    ↳ Counter: Combo-Karte mit Flow ≥ 2 bricht die Mauer (Linienbruch, Held des Spiels, Meisterwerk).',
      disruption: '    ↳ Counter: Medic absorbiert Foul-Schaden. Defense-Karten dämpfen die Störung.',
      setup:      '    ↳ Counter: Früh stören — Ball-Eroberung oder Trigger-Karten unterbrechen ihren Aufbau.',
      big:        '    ↳ Counter: Großes Geschütz — Flow aufbauen, dann Counter- oder Combo-Karte zünden.'
    },
    // v0.48 — Tooltips auf Log-Zeilen. Pro cls-Klasse ein kurzer Satz
    // der mechanisch erklärt was die Zeile bedeutet. Greift über
    // data-kl-tip in ui.js:appendLog, wird vom globalen KL.tip-System
    // beim Hover gezeigt. Ziel: Spieler versteht ohne Codex-Anfrage
    // wofür eine Log-Kategorie steht.
    logTip: {
      trigger:         'Trait feuert. Liest sich als: Spieler · Trait · Effekt. Buff-Werte stehen in Klammern.',
      cardPlay:        'Karte aufgelöst. Lies die Stat-Chips einzeln. Phase-Chip zeigt den Fit — grün = Boost, gold = neutral, rot = Misfit (Effekt halbiert).',
      cardSummary:     'Karten-Recap am Rundenende. Aggregiert die Gesamt-Stat-Verschiebung aller Plays dieser Runde.',
      playerShield:    'Counter-Karte gegriffen. Eine Gegner-Aktion wurde geblockt, gedämpft oder absorbiert. Vergleiche mit dem Threat-Banner oben.',
      microBoost:      'Kleiner kurzfristiger Stat-Schub — durch Win-Streak, Rollen-Affinität oder Event-Fenster. Nicht aus einer Karte.',
      conditionGain:   'Spieler hat Kondition zurückgewonnen. Über 50 hält Stats sauber; unter 50 → −3 alle Stats; unter 25 → −6.',
      roleAffinity:    'Rollen-Match-Bonus. Die richtige Karte landete beim richtigen Spieler — extra Stat-Wert diese Runde.',
      interruptChoice: 'Deine Taktik-Wahl für diese Phase. Klammer zeigt Netto-Team-Buff; ein (TW DEF +N)-Anhang zeigt direkte personelle Stat-Boosts.',
      tacticFeedback:  'Aktive Taktik feuert diese Runde. Klammern zeigen was gerade verschoben wird — getrennt von Karten-Buffs.',
      streak:          'Form-getriebener Schub: heiße Streaks addieren, kalte ziehen ab. An jüngste Matches gebunden, nicht an dieses.',
      oppCard:         'Gegner hat eine Karte gespielt. Effekt hält die Runde (oder länger bei Big-Moves). Counter- oder Defense-Karte kann nächste Runde dämpfen.',
      oppSave:         'Ihr Keeper hält. Ihr DEF + CMP gegen deinen OFF + ST-Kondition entscheidet — Müdigkeit killt Schüsse mehr als gedacht.',
      oppAdapt:        'Gegner hat sich auf deinen meistgespielten Karten-Typ eingestellt — kleiner zielgerichteter Defensiv-Stat-Bump auf ihrer Seite. Diversifiziere zum Ausweichen.',
      fatigueCost:     'Karte kostet Kondition für die passende Rolle. Schwellen merken: <50 → −3 alle Stats, <25 → −6. Recovery-Karten (Breather, Rotation, Medic) kosten keine Kondition.',
      cardYellow:      'Gelbe Karte — eine zweite Gelbe wird Rot. Spieler austauschen, bevor du weiter zockst.',
      cardRed:         'Rote Karte — Spieler raus dieses Match, nächstes gesperrt. Academy-Fallback füllt den Slot bis er zurück ist.',
      phaseShift:      'Spielphase gewechselt (Aufbau → Angriff, etc.). Karten werden nach Phase-Fit neu bewertet; die EV-Chips in deiner Hand aktualisieren sich.'
    }
  },
  tactic: {
    misfit: {
      aggressiveSlow: '  ⚠ Kader zu langsam für aggressives Pressing — erhöhtes Fatigue-Risiko.',
      defensiveNoVision: '  ⚠ Kein PM-Weitblick — tiefe Abwehr ohne Ausgang.',
      tempoOutpaced: '  ⚠ Tempo-Plan geht nach hinten los — Gegner ist schneller.',
      pressingNoLegs: '  ⚠ Zu wenig Beine für dauerhaftes Pressen — Kollaps droht.',
      possessionNoVision: '  ⚠ Keine Übersicht für Ballbesitz — Ballverluste werden wehtun.',
      counterNoRunner: '  ⚠ Kein schneller Läufer — Konter-Drohung läuft ins Leere.',
      flankCutOut: '  ⚠ Flügelläufe abgefangen — Gegner neutralisiert die Breite.'
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
      'Ballverlust an der Mittellinie',
      // v52.6 — variants with built-in action/reaction texture
      '{pm} sucht den Steilpass — abgefangen, Konter rollt los',
      '{vt} unter Druck, der Klärungsversuch landet beim Gegner',
      '{pm} dribbelt sich fest, Doppelpass am Sechser hängen geblieben',
      'Aufbau gestoppt — {opp} setzt sofort nach',
      'Ballannahme misslingt {pm}, Gegner-LF spritzt dazwischen',
      '{vt} verschätzt sich beim Kopfball — zweiter Ball gehört dem Gegner'
    ],
    ownBuildSuccess: [
      '{pm} öffnet das Mittelfeld mit einem Steilpass',
      '{pm} findet den Weg durch die Linien',
      'Schneller Doppelpass zwischen {pm} und {lf}',
      '{pm} spielt diagonal auf die Außenbahn',
      '{lf} zieht auf der Flanke durch',
      '{vt} eröffnet stark — {pm} nimmt auf',
      '{pm} treibt den Ball ins letzte Drittel',
      // v52.6 — chained variants
      '{pm} dreht ab, sieht die Lücke — Pass auf {lf}, der durchstartet',
      '{vt} chippt auf {pm}, Ball klebt direkt am Fuß',
      '{lf} kommt in den Lauf, Verteidiger reagiert zu spät',
      '{pm} mit Tempodribbling, zwei Gegner ausgespielt',
      'Konterspiel über {lf} — Außenverteidiger kommt nicht hinterher',
      '{pm} mit dem No-Look auf {lf}, Halbraum offen'
    ],
    chance: [
      '{scorer} kommt zum Abschluss...',
      '{scorer} setzt sich im Strafraum durch...',
      '{scorer} hat die Chance...',
      '{scorer} lauert vorm Tor...',
      '{scorer} wird im Strafraum angespielt...',
      // v52.6 — variants
      '{scorer} zieht aus der zweiten Reihe ab...',
      '{scorer} tunnelt den Verteidiger und schließt ab...',
      '{scorer} kommt frei zum Kopfball...',
      '{scorer} mit der Direktabnahme...',
      '{scorer} dreht sich im Sechzehner und wuchtet...'
    ],
    miss: [
      '{scorer} zielt knapp vorbei',
      '{scorer} trifft nur den Pfosten!',
      'Abschluss von {scorer} zu zentral — Keeper hält',
      '{scorer} schießt drüber',
      '{scorer}s Schuss wird im letzten Moment geblockt',
      '{scorer} verzieht — Chance vertan',
      '{scorer} trifft die Latte!',
      // v52.6 — chained reactions baked in
      '{scorer} legt sich den Ball zu weit vor — Keeper schnappt sich die Kugel',
      '{scorer} mit dem Versuch über den Keeper, der Ball segelt drüber',
      'Abschluss von {scorer} aus spitzem Winkel — am Außennetz',
      '{scorer} probiert den Heber — kein Druck dahinter',
      'Schuss von {scorer} zentral auf den Keeper, der packt sicher zu',
      'Verteidiger wirft sich rein und blockt {scorer} im letzten Moment'
    ],
    oppBuildFail: [
      '{opp} verliert den Ball im Aufbau',
      '{opp}s Pass landet im Niemandsland',
      '{vt} fängt ab',
      '{opp} wird beim Aufbau gestört',
      'Gegen-Pressing zwingt {opp} zum Fehler',
      // v52.6 — variants
      '{vt} antizipiert den Pass und klärt nach vorn',
      '{opp} verzettelt sich — Ball erobert',
      'Pressing-Welle erstickt {opp}s Spielaufbau',
      '{opp} probiert den Vertikalpass — abgefangen',
      'Ballgewinn im Mittelfeld, sofort weiter nach vorn'
    ],
    oppApproach: [
      '{opp} kommt über die Flanke',
      '{opp} zieht das Spiel schnell vor',
      '{opp} sucht den Abschluss',
      'Gegner-Stürmer enteilt der Abwehr',
      '{opp} spielt sich durchs Mittelfeld',
      // v52.6 — variants
      '{opp} kombiniert sich klug ins letzte Drittel',
      'Konter über die rechte Seite — {opp} kommt mit Tempo',
      '{opp} mit dem Doppelpass am Sechzehner',
      'Hoher Ball auf den Stürmer, Kopfball-Duell läuft',
      '{opp} startet einen Sprint hinter die Kette'
    ],
    save: [
      '{tw} pariert stark!',
      '{tw} fängt sicher ab',
      '{vt} blockt den Schuss im letzten Moment',
      'Schuss zu ungenau — {tw} hat ihn',
      '{tw} hält mit Glanzparade!',
      'Kopfball neben das Tor',
      // v52.6 — variants with reaction phrasing
      '{tw} fischt den Ball aus dem Winkel — was für eine Parade',
      '{tw} reagiert glänzend, lenkt um den Pfosten',
      '{vt} wirft sich in den Schuss — abgeblockt',
      '{tw} steht goldrichtig und nimmt den Ball auf',
      'Doppelparade von {tw} — der Nachschuss wird auch entschärft',
      '{tw} kommt raus und entschärft das Eins-gegen-eins'
    ]
  },
  // v0.42 — Narrativ-Layer (Top-Level, Schwester von `ui` und `data`).
  // Jede Szene ist ein Template-Varianten-Pool (anti-Wiederholung via
  // `_narrativeUsed` im Match-State). Placeholder in geschweiften
  // Klammern: {shooter}, {role}, {setupHint}, {triggerHint}, {comboHint}.
  // Eine Variante fällt automatisch aus der Auswahl, wenn nicht alle
  // ihre Placeholder im aktuellen Match-State Material haben.
  narrative: {
    goalBuildup: {
      variants: [
        // Mit setupHint + shooter — Reporter/Live-Ticker-Stil, kasusfrei
        'Aufbau über {setupHint} — {shooter} vollendet.',
        '{setupHint} öffnet die Lücke, {shooter} steht goldrichtig.',
        'Nach {setupHint} — {shooter} macht es rein.',
        // Mit setupHint + triggerHint + shooter
        '{setupHint}, dann {triggerHint} — {shooter} trifft.',
        'Die Kette {setupHint} → {triggerHint}, {shooter} verwertet.',
        // Mit triggerHint + shooter (ohne Setup)
        '{triggerHint} bricht durch — {shooter} verwandelt.',
        // Mit comboHint + shooter (direkter Kombinations-Abschluss)
        '{comboHint}! {shooter} setzt den Schlusspunkt.',
        // Pure shooter-Linie als Fallback
        '{shooter} findet die Lücke.',
        '{shooter} schiebt eiskalt ein.'
      ]
    },
    // DE-Hints sind Einwort-Substantive ohne Artikel und ohne Adjektiv
    // — das ist "Live-Ticker-Deutsch" und funktioniert kasusfrei in den
    // Templates (Nominativ = Akkusativ = Dativ in dieser Form). Vermeidet
    // Tautologien wie "Aufbau über schnellen Aufbau" und grammatikalische
    // Fehler wie "schnellen Aufbau öffnet...".
    cards: {
      switch_lane:    { buildupHint: 'Seitenwechsel' },
      drop_deep:      { buildupHint: 'Tiefen-Eröffnung' },
      quick_build:    { buildupHint: 'Direktspiel' },
      triangle_play:  { buildupHint: 'Dreieckspiel' },
      long_ball:      { buildupHint: 'Steilpass' },
      overlap_run:    { buildupHint: 'Überlapp-Lauf' },
      forward_burst:  { buildupHint: 'Antritt' },
      hope_shot:      { buildupHint: 'Halbfeld-Flanke' },
      grind_through:  { buildupHint: 'Körper-Einsatz' },
      hero_moment:    { buildupHint: 'Hero-Moment' },
      masterclass:    { buildupHint: 'Meisterwerk' },
      clinical_finish:{ buildupHint: 'Präzisions-Abschluss' },
      lone_striker:   { buildupHint: 'Sturmlauf' },
      set_piece:      { buildupHint: 'Standard' },
      flank_overload: { buildupHint: 'Flanken-Überladung' },
      break_the_line: { buildupHint: 'Liniendurchbruch' }
    },
    // Gegentor-Narrativ. Kontext kommt aus UNSEREM tactical state
    // (exposureHint) und aus einer thematisch-relevanten Opp-Trait
    // (oppTraitHint). Templates sind "Warum haben wir das gefangen?"-
    // Story-Shots statt reiner Mechanik-Logs. Reporter-Stil, kasusfrei.
    oppGoalBuildup: {
      variants: [
        // Mit exposureHint
        '{exposureHint} bestraft — {oppScorer} trifft.',
        'Nach unserem {exposureHint} — {oppScorer} schlägt zu.',
        '{exposureHint} — {oppScorer} nutzt die Lücke.',
        // Mit oppTraitHint
        '{oppTraitHint} schlägt zu — {oppScorer} verwandelt.',
        'Typisch {oppTraitHint}: {oppScorer} trifft.',
        // Mit beiden
        '{oppTraitHint} trifft unser {exposureHint} — {oppScorer} vollendet.',
        // Pure Fallback (nur oppScorer)
        '{oppScorer} bestraft den Stellungsfehler.',
        '{oppScorer} steht sträflich frei und trifft.',
        '{oppScorer} zieht ab und trifft.'
      ],
      // Unser tactical state beim Gegentor — narrative Phrase.
      exposure: {
        all_in:        'All-In-Vabanque',
        attack_phase:  'Aufrücken',
        aggressive:    'Pressing-Anflug',
        no_cards:      'Karten-Verzicht'
      },
      // Thematische Opp-Traits — wenn der Gegner eine aktive hat, liefert
      // sie den narrativen Auslöser. Nur die schuss-thematischen Traits,
      // andere (boss_aura, pressing_wall) bleiben auf der generischen
      // oppTraits-desc-Beschreibung und tauchen hier nicht als Hint auf.
      oppTrait: {
        sniper:         'Scharfschützen-Schuss',
        sturm:          'Sturmwalzen-Moment',
        konter_opp:     'Konter-Schlag',
        clutch_opp:     'Eiskalt-Moment',
        lucky:          'Glücksvolltreffer',
        rage_mode:      'Rage-Ausbruch',
        counter_threat: 'Doppel-Konter'
      }
    },
    // v0.43 — Lattentreffer (beidseitig). 4% Chance pro Tor-Event dass
    // der Schuss ans Aluminium geht statt ins Netz. Eigener Szenen-Name
    // pro Seite (Anti-Wiederholung separat pro Match).
    postHitMine: {
      variants: [
        // Mit setupHint
        'Aufbau über {setupHint} — {shooter} knallt ihn an die Latte.',
        'Nach {setupHint} — {shooter} trifft nur Aluminium.',
        // Mit triggerHint
        '{triggerHint} setzt {shooter} frei — und nur der Pfosten.',
        // Pure Fallback
        '{shooter} hämmert ihn an den Pfosten — Raunen im Stadion.',
        'Pfosten! {shooter} hat kein Glück.',
        'Die Latte rettet den Gegner — {shooter} war unhaltbar nahe dran.',
        '{shooter} zieht aus der Distanz — nur Alu.',
        '{shooter} trifft nur Aluminium.'
      ]
    },
    postHitOpp: {
      variants: [
        '{oppScorer} hämmert an den Pfosten — Glück gehabt.',
        'Pfosten! {oppScorer} war durch — und wir atmen auf.',
        'Die Latte vereitelt {oppScorer}s Schuss.',
        'Aluminium rettet — {oppScorer} entsetzt.',
        '{oppScorer} trifft nur Eisen — unser Glück.',
        'Pfostenschuss von {oppScorer} — der Ball rollt an der Linie entlang und weg.'
      ]
    },
    // v0.44 — Abseits (beidseitig, 3%). Tor wird aberkannt weil
    // jemand zu früh hinter der letzten Linie stand. Anti-Wiederholung
    // pro Match separat pro Szene.
    offsideMine: {
      variants: [
        '{shooter} trifft — aber die Fahne hebt sich. Abseits.',
        'Abseits! {shooter} war eine Schulter zu weit.',
        '{shooter} zu früh losgelaufen — Tor aberkannt.',
        'Pfeife und Fahne — {shooter} im Abseits.',
        '{shooter} macht den Ball rein, aber der Schiedsrichter zeigt auf die Position.'
      ]
    },
    offsideOpp: {
      variants: [
        '{oppScorer} trifft — aber die Fahne hebt sich. Abseits, glück gehabt.',
        'Abseits! {oppScorer} war eine Schulter zu weit — Tor aberkannt.',
        '{oppScorer} zu früh los — Pfeife, kein Tor.',
        'Die Fahne rettet uns — {oppScorer} stand drei Schritte vor der Linie.',
        '{oppScorer} jubelt — aber das Tor zählt nicht. Abseits.'
      ]
    },
    // v0.44 — Elfmeter inline. Drei Phasen pro Elfer: Intro, Outcome,
    // (und die Outcome-Szene deckt alle drei Ausgänge goal/save/miss ab).
    // Je Seite (Mine/Opp) getrennte Varianten-Pools für Anti-
    // Wiederholung und passende Framings ("wir" vs "sie").
    penaltyIntroMine: {
      variants: [
        'Foul im Strafraum! Der Schiedsrichter zeigt auf den Punkt — Elfmeter für uns.',
        'Elfmeter! {shooter} legt sich den Ball zurecht.',
        'Unfaires Einsteigen im Sechzehner — {shooter} tritt an.',
        'Pfiff im Strafraum. {shooter} schnappt sich den Ball.'
      ]
    },
    penaltyIntroOpp: {
      variants: [
        'Foul im eigenen Strafraum. Elfmeter gegen uns.',
        'Elfmeter für den Gegner! {shooter} legt sich den Ball zurecht.',
        'Ein unnötiges Einsteigen im Sechzehner — Elfmeter-Pfiff.',
        'Schiedsrichter zeigt auf den Punkt. {shooter} kommt.'
      ]
    },
    penaltyGoalMine: {
      variants: [
        '{shooter} verwandelt souverän.',
        '{shooter} hämmert ihn flach ins Eck — Tor.',
        '{shooter} schiebt kühl ein. {keeper} war in die falsche Ecke.',
        '{shooter} täuscht {keeper} an — und trifft.'
      ]
    },
    penaltyGoalOpp: {
      variants: [
        '{shooter} verwandelt sicher. {keeper} hat keine Chance.',
        '{shooter} jagt ihn ins lange Eck — Tor.',
        '{shooter} trifft eiskalt vom Punkt. {keeper} ist in der falschen Ecke.',
        '{shooter} schiebt flach ein — unhaltbar für {keeper}.'
      ]
    },
    penaltySaveMine: {
      variants: [
        '{keeper} pariert! Der Elfer bleibt in seinen Händen.',
        '{keeper} kommt runter — Parade des Matches.',
        '{keeper} ahnt die Ecke — {shooter} enttäuscht.',
        '{keeper} hält mit der Fußspitze — was für eine Parade.'
      ]
    },
    penaltySaveOpp: {
      variants: [
        '{keeper} pariert! Was für ein Reflex.',
        '{keeper} ahnt die Ecke und hält — Stadion explodiert.',
        '{keeper} streckt sich lang und packt zu — {shooter} fassungslos.',
        '{keeper} hat ihn! Parade in der Top-Ecke.'
      ]
    },
    penaltyMissMine: {
      variants: [
        '{shooter} schießt über das Tor — Kopf nach unten.',
        '{shooter} trifft nur den Pfosten — Ball springt zurück.',
        '{shooter} jagt ihn übers Aluminium — vertan.',
        '{shooter} zieht weit drüber — Chance vergeben.'
      ]
    },
    penaltyMissOpp: {
      variants: [
        '{shooter} schießt über das Tor — Glück gehabt.',
        '{shooter} trifft nur den Pfosten — Ball springt weg.',
        '{shooter} jagt ihn übers Aluminium — wir atmen auf.',
        '{shooter} zieht weit vorbei — verschossen.'
      ]
    },
    // v0.45 — Match-End-Drama: zusätzliche narrative Zeile vor dem
    // Standard-Epilog, wenn das Match in eine dramaturgische Kategorie
    // fällt. Platzhalter {me} und {opp} sind die finalen Scores.
    matchEndDrama: {
      comeback_win: [
        'Comeback des Matches — wir lagen uns schon die Hände, am Ende stehts {me}:{opp}.',
        'Von hinten zurück — was für ein Kraftakt. Endstand {me}:{opp}.',
        'Die Mannschaft dreht einen Rückstand in einen Sieg — {me}:{opp}. Chapeau.',
        'Die Partie stand schon auf der Kippe, aber wir haben sie zurückgedreht. {me}:{opp}.'
      ],
      collapse_loss: [
        'Einbruch in letzter Minute — aus einer Führung wird Niederlage. {me}:{opp}.',
        'Die Führung verspielt. Bitterer geht es kaum. {me}:{opp}.',
        'Wir hatten das Spiel in der Hand — und haben es aus den Händen gleiten lassen. {me}:{opp}.',
        'Vorne gelegen, am Ende verloren. {me}:{opp} — das tut weh.'
      ],
      last_minute_win: [
        'Tor in letzter Minute — Stadion explodiert. {me}:{opp}.',
        'Last-Minute-Treffer entscheidet das Match. {me}:{opp}.',
        'In der Schlussphase noch zugeschlagen — {me}:{opp}. Ein Thriller.'
      ],
      last_minute_loss: [
        'Gegentor in der Schlussphase — die Punkte sind weg. {me}:{opp}.',
        'Kurz vor Schluss noch kassiert. {me}:{opp} — bitter.',
        'Am Ende verloren, was schon gewonnen schien. {me}:{opp}.'
      ],
      shutout_win: [
        'Zu-Null-Sieg — die Abwehr stand wie eine Mauer. {me}:{opp}.',
        'Keine Gegentore, klarer Sieg. {me}:{opp}. Diese Abwehr hält.',
        'Die Null steht — und dazu {me} eigene Tore. {me}:{opp}.'
      ],
      shutout_loss: [
        'Kein einziger Treffer, und hinten kracht es. {me}:{opp} — ernüchternd.',
        'Offensiv blockiert, defensiv ausgespielt. {me}:{opp}.',
        'Nichts nach vorn, alles nach hinten. {me}:{opp}.'
      ],
      blowout_win: [
        'Torfestival — wir überrollen den Gegner. {me}:{opp}.',
        'Das Ergebnis spricht für sich: {me}:{opp}. Deutlicher geht es nicht.',
        'Eine Machtdemonstration auf dem Platz. {me}:{opp}.'
      ],
      blowout_loss: [
        'Wir werden überrollt — {me}:{opp}. Nichts zu holen heute.',
        'Eine schmerzhafte Lektion. {me}:{opp} — das müssen wir aufarbeiten.',
        'Der Gegner war in allen Belangen überlegen. {me}:{opp}.'
      ],
      nail_biter_win: [
        'Ein Krimi bis zum Ende — wir ziehen knapp durch. {me}:{opp}.',
        'Hauchdünn gewonnen. {me}:{opp} — die Nerven haben mitgespielt.',
        'Das war auf Messers Schneide. {me}:{opp}, glücklich nach Hause.'
      ],
      nail_biter_loss: [
        'Auf Messers Schneide verloren — {me}:{opp}. So nah dran.',
        'Ein einziges Tor trennt uns vom Punktgewinn. {me}:{opp}.',
        'Knapp daneben ist auch vorbei. {me}:{opp}.'
      ],
      goal_fest_draw: [
        'Torfestival mit offenem Ausgang — beide Mannschaften geben alles. {me}:{opp}.',
        'Ein Spektakel, das niemand gewinnt. {me}:{opp}. Aber Unterhaltung pur.',
        'Neun Tore in 90 Minuten — ein Gegen-Fußball-Fest. {me}:{opp}.'
      ]
    }
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
      titan_stand:      { name: 'Titan-Stand',        desc: 'Bei knappem Spielstand steht er wie eine Mauer vor dem Tor — bei max. 1 Tor Differenz: +30% Halte-Chance bei Schüssen.' },
      fortress_aura:    { name: 'Festungs-Aura',      desc: 'Seine Präsenz strahlt auf die Hintermannschaft zurück — solange der Keeper spielt, bekommt der Verteidiger +6 Defense.' },
      clutch_save:      { name: 'Clutch-Save',        desc: 'Blüht genau in den finalen Minuten auf — Runden 5-6: +20% Save-Rate.' },
      sweep_assist:     { name: 'Sweep-Assist',       desc: 'Fängt den Ball und wirft ihn als Angriffsstart hinaus — nach jeder Parade +8% auf den nächsten Aufbau.' },
      laser_pass:       { name: 'Laser-Pass',         desc: 'Sekundenschnell zündet der Konter aus seinen Händen — nach einer Parade 20% Chance auf Sofort-Konter.' },
      offside_trap:     { name: 'Abseitsfalle',       desc: 'Synchron losziehen, Linie aufreißen — 15% aller Gegner-Angriffe werden tempobasiert neutralisiert.' },
      acrobat_parry:    { name: 'Akrobatik',          desc: 'Spektakuläre Folge-Parade, Ball noch im Spiel — nach einer Parade einmal pro Match +12% Save-Chance auf den nächsten Schuss.' },
      wall_effect:      { name: 'Mauer',              desc: 'Eine Wand zwischen Ball und Tor, aber der offensive Funke ist gedämpft — +15% permanente Save-Rate, dafür -10% eigener Aufbau.' },
      nine_lives:       { name: 'Neun Leben',         desc: 'Aufstehen wie eine Katze, der erste Treffer prallt ab — einmal pro Match wird das erste Gegentor annulliert.' },
      intimidate:       { name: 'Einschüchtern',      desc: 'Sein Blick allein verunsichert den gegnerischen Stürmer — der Gegner-ST bekommt -5 Offense.' },
      bulldoze:         { name: 'Bulldozer',          desc: 'Wirft sich in jeden gegnerischen Schuss — pro Runde 10% Chance den Ball vor dem Gegner-Abschluss abzufangen.' },
      captain_boost:    { name: 'Kapitän',            desc: 'Gibt dem ganzen Team Ruhe auf dem Platz — jeder Mitspieler +3 Composure.' },
      blood_scent:      { name: 'Blutspur',           desc: 'Jedes Gegentor facht sein Feuer weiter an — nach jedem kassierten Tor +5 Defense für den Rest des Matches.' },
      hard_tackle:      { name: 'Harter Tackle',      desc: 'Aggressives Einsteigen, das den Konter einläutet — 20% Chance den Gegner-Angriff zu brechen und sofort einen Konter zu starten.' },
      whirlwind_rush:   { name: 'Wirbelwind',         desc: 'Plötzliche Tempo-Explosion für einen Moment — einmal pro Halbzeit wird sein Tempo eine Runde lang verdoppelt.' },
      build_from_back:  { name: 'Spielaufbau hinten', desc: 'Baut das Spiel aus der Tiefe strukturiert auf — der Spielmacher bekommt +8 Vision.' },
      late_bloom:       { name: 'Spätzünder',         desc: 'Kommt erst in der zweiten Matchhälfte in Fahrt — ab Runde 4: +10 Offense und +5 Vision.' },
      read_game:        { name: 'Spiel lesen',        desc: 'Spielt den Ball mit dem Kopf, nicht den Füßen — einmal pro Match wird ein Gegner-Angriff automatisch neutralisiert.' },
      metronome_tempo:  { name: 'Metronom',           desc: 'Gleichmäßiger Takt, jede Runde mehr Kontrolle — jede Runde +2% auf den eigenen Aufbau (kumulativ).' },
      killer_pass:      { name: 'Killerpass',         desc: 'Tödlicher Pass zwischen die Ketten, der Reihen durchschneidet — bei eigenem Angriff 25% Chance auf einen Ketten-Schuss.' },
      whisper_boost:    { name: 'Flüstern',           desc: 'Ruhiger Dirigent hinter dem Sturm, gibt ihm Selbstvertrauen — der Stürmer bekommt +8 Composure und +4 Offense.' },
      hunter_press:     { name: 'Jagdfieber',         desc: 'Jagd auf den Ballführenden, kein Ausweg — 15% Chance pro Runde den Ball per Pressing zu gewinnen.' },
      gegenpress_steal: { name: 'Gegenpressing',      desc: 'Bohrt nach Gegner-Ballverlust sofort nach — nach jedem Gegner-Ballverlust +15% auf den nächsten eigenen Aufbau.' },
      shadow_strike:    { name: 'Schatten-Schlag',    desc: 'Unerwarteter Angriff aus dem Nichts in Schlüssel-Runden — in Runden 3 und 6: 20% Chance auf einen verdeckten Angriff.' },
      maestro_combo:    { name: 'Maestro-Kombo',      desc: 'Wenn das ganze Team trifft, klingt es wie eine Symphonie — wenn PM, LF und ST alle treffen, zählt das nächste Tor doppelt.' },
      chess_predict:    { name: 'Voraussicht',        desc: 'Sieht den Schuss kommen bevor der Stürmer zieht — einmal pro Halbzeit wird ein Gegentor in eine Parade verwandelt.' },
      symphony_pass:    { name: 'Symphonie',          desc: 'Je mehr Mitspieler zünden, desto stärker das Team — wenn 2+ Mitspieler-Traits triggern: +10% Team-Offense.' },
      speed_burst:      { name: 'Speed-Burst',        desc: 'Explosiver Tempo-Antritt im richtigen Moment — einmal pro Halbzeit ist ein Aufbau garantiert erfolgreich.' },
      launch_sequence:  { name: 'Start',              desc: 'Fliegender Start, keine Anlaufzeit — in Runde 1 bekommt das Team +20% auf eigene Angriffe.' },
      unstoppable_run:  { name: 'Unaufhaltsam',       desc: 'Wenn das Tempo passt, hält ihn niemand mehr auf — wenn Tempo > Gegner-Defense: 10% Chance auf ein automatisches Tor.' },
      dribble_chain:    { name: 'Dribbel-Kette',      desc: 'Ein Dribbling zündet das nächste — jeder erfolgreiche Angriff gibt +5% auf den folgenden (stacking).' },
      street_trick:     { name: 'Straßentrick',       desc: 'Straßen-Freestyle, der Defender steht wie bestellt — 15% Chance den Verteidiger komplett stehen zu lassen.' },
      nutmeg:           { name: 'Tunnel',             desc: 'Unverhoffter Tunnel zwischen den Beinen — 20% Chance bei eigenem Angriff die Gegner-Defense zu ignorieren.' },
      ironman_stamina:  { name: 'Ironman',            desc: 'Bleibt in den Schlussminuten topfit und reißt das Team mit — Runden 5-6: kein Stat-Zerfall, und das Team bekommt +2 Tempo.' },
      dynamo_power:     { name: 'Dynamo',             desc: 'Rhythmische Power-Wellen ans Team — jede zweite Runde bekommt das Team +6 Offense für diese Runde.' },
      never_stop:       { name: 'Nie aufgeben',       desc: 'Rückstand macht ihn aggressiver — bei Rückstand +8 Offense pro kassiertem Tor.' },
      silent_killer:    { name: 'Stiller Killer',     desc: 'Der erste Schuss sitzt perfekt, unerwartet — der erste Schuss im Match bekommt +30% Offense.' },
      predator_pounce:  { name: 'Raubtiersprung',     desc: 'Wartet auf den gegnerischen Fehler und schlägt sofort zu — nach gescheitertem Gegner-Angriff 25% Chance auf ein Sofort-Tor.' },
      opportunity:      { name: 'Gelegenheit',        desc: 'Macht aus kleinen Gelegenheiten echte Tore — jeder erfolgreiche Aufbau gibt +3% Torchance.' },
      cannon_blast:     { name: 'Kanonen-Schuss',     desc: 'Gefährliche Hammer-Schüsse, aber auch mehr Risiko zu verziehen — jeder Schuss: 10% Auto-Tor, dafür +5% Fehlschuss-Risiko.' },
      header_power:     { name: 'Kopfball-Monster',   desc: 'Herr der Luft, liebt hohe Bälle — bei hoher Team-Vision +15% Torchance.' },
      brick_hold:       { name: 'Ballhalter',         desc: 'Stabilisator auf dem Platz, kein Pressing kommt durch — das Team bekommt -10% weniger Gegner-Pressing.' },
      ghost_run:        { name: 'Geister-Lauf',       desc: 'Taucht plötzlich im Strafraum auf, wenn niemand hinguckt — 15% Chance pro Runde plötzlich für eine Chance frei zu sein.' },
      puzzle_connect:   { name: 'Puzzleteil',         desc: 'Unsichtbare Verbindung zum Spielmacher — wenn der PM trifft, bekommt dieser Spieler +25% auf die nächste Torchance.' },
      chameleon_adapt:  { name: 'Anpassung',          desc: 'Passt sich an das Spiel an wie ein Chamäleon — in Runde 4 kopiert er den Trait des aktivsten Mitspielers.' }
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
      trait_sniper: 'Präzisionsschütze — jeder Schuss ein Risiko',
      trait_bulwark: 'Schützen den Kasten aufs Äußerste — ein sicheres Tor wird einmal pro Match geklärt',
      trait_counter_threat: 'Doppelter Konter-Jäger — bei deinem Aufbau-Fehler droht ein sofortiger Gegenangriff',
      trait_rage_mode: 'Wird gefährlicher bei eigenem Rückstand — sie werden nicht müde, wenn sie hinten liegen',
      trait_pressing_wall: 'Massiver Druck im Aufbau — viele deiner Spielzüge brechen frühzeitig ab',
      trait_boss_aura: 'Boss-Präsenz — das gesamte gegnerische Team wird jede Runde einen Tick stärker'
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
        mindgames: { name: 'Psychospiel', desc: '+14 VIS, +10 CMP Team. Gegner −6 CMP für 2 Runden. In ihre Köpfe rein.' },
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
        shift: { name: 'Umstellen', desc: 'Topform-Spieler: +18 Fokus-Stat (Match-Lang auf den stärksten Fit).' },
        rally: { name: 'Mobilisieren', desc: '+6 Offense pro kassiertem Tor, +6 Defense pro eigenem. Massives Swing-Potenzial.' },
        reset: { name: 'Neu sortieren', desc: '+12 auf ALLE Stats R4-6. Weißes Blatt — kein Drehbuch mehr.' },
        counter_h: { name: 'Auf Konter', desc: '+24 Tempo, +14 Defense R4-6. Gescheiterter Gegnerangriff triggert Konter.' },
        high_press: { name: 'Hohes Pressing', desc: '+22 Defense R4-6, -6 Composure. Ihr Aufbau bricht — aber Lücken sind real.' },
        vision_play: { name: 'Spiel öffnen', desc: '+22 Vision, +10 Offense R4-6. Lücken schaffen, Lücken nutzen.' },
        shake_up: { name: 'Aufrütteln', desc: 'Schwächster Spieler aussortiert: −5 alle Stats. Team reagiert: +12 OFF R4-6.' },
        lock_bus: { name: 'Bus einbetonieren', desc: 'Nur mit Führung: +30 Defense, -20 Offense R4-6. Undurchdringlich, aber zahnlos.' },
        desperate: { name: 'Verzweiflungstat', desc: 'Nur bei 2+ Rückstand: +32 Offense R4-6, -20 Defense. Keeper auf sich gestellt. Alles oder nichts.' },
        role_switch: { name: 'Rollentausch', desc: 'LF und ST tauschen Rollen R4-6. Team: +10 TMP, +10 OFF, −8 VIS. LF +8 OFF, ST +8 TMP persönlich. Neue Angriffswinkel.' },
        coach_fire: { name: 'Donnerwetter', desc: 'Nur bei Rückstand: nächstes Match +1 Team-Form, dieses Match +14 Offense R4-6. Wut treibt an.' },
        cold_read: { name: 'Durchschauen', desc: 'Taktiken lesen. +20 Defense, Gegner-Offense -8 R4-6. Überlisten statt überrennen.' },
        wingman: { name: 'Flügel freigeben', desc: 'LF: +25 TMP, +15 OFF persönlich R4-6. Team −4 CMP. Einzelkämpfer-Risiko.' },
        mind_reset: { name: 'Mentaler Reset', desc: 'Wischt alle Form-Deltas im Kader. Weißes Blatt in R4-6 — kein Ballast, kein Schwung.' },
        double_down: { name: 'Verdoppeln', desc: 'Amplifiziert deinen größten POSITIVEN Team-Buff um +40%. Fällt auf moderate +6 OFF/DEF/CMP zurück, wenn noch kein echter Buff aktiv ist.' },
        tactical_foul: { name: 'Taktische Fouls', desc: 'Rhythmusbrecher: VT setzt bewusst Fouls, um den Gegenangriff zu stoppen. +8 Defense, Gegner-Tempo -12 für R4-5. VT verliert 3 Kondition (Einsatz). Stören statt eigenes Spiel verbessern.' },
        wing_overload: { name: 'Flügel-Offensive', desc: 'LF: +20 Offense, +20 Tempo persönlich R4-6. Team -6 Defense. Einzelspieler-Show.' },
        shell_defense: { name: 'Schalen-Defensive', desc: 'Nur bei Unentschieden oder Führung: +24 Defense, +14 Composure, -10 Offense R4-6. Zustand wahren.' }
      },
      final: {
        all_in: { name: 'All-In', desc: 'R6: +15 Offense, -15 Defense. Wächst bei Rückstand. Hinten komplett offen.\nAlle nach vorn — die Abwehr ist verwaist. Siegen oder untergehen.' },
        park_bus: { name: 'Bus parken', desc: 'R6: +15 Defense, -10 Offense. Wächst mit jedem Tor Führung.\nZehn Mann hinter dem Ball, kein Anspruch auf Angriff. Nur die Führung halten.' },
        hero_ball: { name: 'Held des Tages', desc: 'Topform-Spieler: +30 Fokus-Stat (Match-Lang).\nEiner nimmt den Ball und die Last. Das Team lebt durch ihn.' },
        keep_cool: { name: 'Cool bleiben', desc: 'R6: +20 Composure, +12 Vision. Nerven aus Stahl.\nDurchatmen, einfach spielen, dem Prozess vertrauen. Der Moment darf uns nicht erschüttern.' },
        final_press: { name: 'Schlusspressing', desc: 'R6: +24 Tempo, +18 Defense, -10 Offense. Hohe Konter-Chance.\nHohe Linie, Mannorientierung, den Ball jagen. Sie sollen zuerst brechen.' },
        long_ball: { name: 'Lange Bälle', desc: 'R6: +28 Offense, -10 Vision. Direkt und hart.\nBall nach vorne, hinterherjagen. Das Mittelfeld wird einfach übersprungen.' },
        midfield: { name: 'Mittelfeldkontrolle', desc: 'R6: +20 Vision, +16 Tempo, +14 Composure.\nDas Zentrum dominieren. Wer den Ball nicht hat, kann nicht treffen.' },
        sneaky: { name: 'Hinterhalt', desc: 'R6: +28 Defense, +18 Tempo, -14 Offense. Ködern und zuschlagen.' },
        sacrifice: { name: 'Opferlamm', desc: 'Topform-Spieler: −15 Fokus-Stat. Team: jetzt +35 OFF dieses Match.\nEiner gibt seinen Körper, damit das Team fliegt. Er wird zahlen.' },
        kamikaze: { name: 'Kamikaze', desc: 'Nur bei Rückstand: +40 Offense, -40 Defense. Keeper exponiert. Hoffen und beten.\nNichts zu verlieren — Keeper kommt bei Ecken mit nach vorn. Alles oder nichts.' },
        clockwatch: { name: 'Uhr spielen lassen', desc: 'Nur mit Führung: +25 Defense, +18 Composure. Zeit für dich arbeiten lassen.\nJeder Ballkontakt etwas länger. Jeder Einwurf genau studiert. Zeit ist unser Mitspieler.' },
        poker: { name: 'Pokerface', desc: 'Nur bei Gleichstand: +15 auf jeden einzelnen Stat. Pure Clutch — alles drin.\nAlle hellwach, keine Anzeichen, keine Panik. Das nächste Tor entscheidet alles.' },
        lone_wolf: { name: 'Einzelkämpfer', desc: 'Stürmer: +40 Offense, +20 Tempo persönlich. Rest: -6 Offense. Ein Schuss, ein Treffer.\nBall zum Stürmer, den lasst machen. Der Rest hält die Ordnung.' },
        fortress: { name: 'Festung', desc: 'TW/VT: +40 Defense. Team -20 Offense. Das Tor in einen Bunker verwandeln.\nKeeper und IV verrammeln die Tür. Alles andere ist Lärm.' },
        gamble: { name: 'Zock', desc: 'Münzwurf: +35 Offense bei Kopf, -15 auf alle Stats bei Zahl. Pures Chaos.\nVorsicht raus. Entweder wir überrollen sie oder wir kollabieren. Wählt eine Seite.' },
        masterclass: { name: 'Meisterklasse', desc: 'PM: +30 Vision, +20 Composure persönlich. Team +12 Offense. Den Maestro dirigieren lassen.\nDer Spielmacher leitet alles durch sich. Sein Auge, sein Rhythmus, sein Match.' },
        rope_a_dope: { name: 'Rope-a-Dope', desc: 'R6: +35 Defense. Jeder Gegnerangriff triggert Auto-Konter. Ködern, dann zuschlagen.\nEinladen. Abfedern. Konter zünden. Ihre Erschöpfung, unsere Chance.' },
        set_piece: { name: 'Standard-Meister', desc: 'R6: +25 Offense, aber NUR nach erfolgreichem Aufbau. Chirurgische Schärfe.\nGeduldig aufbauen, dann aus der Ruhe zuschlagen. Klinisch aus Standards.' },
        siege_mode: { name: 'Belagerung', desc: 'R6: +20 Offense, +10 Tempo, +10 Vision. Sauberer Rundum-Druck, keine Strafe.\nDauerhaft in der Hälfte, Welle nach Welle. Irgendwann bricht etwas.' },
        bus_and_bike: { name: 'Bus & Konter', desc: 'R6: +18 Defense. Jede Parade/Stop lädt +30 Offense auf den nächsten eigenen Ball.\nAbfedern, parieren, nach vorn katapultieren. Ihre Chance wird unsere Chance.' },
        face_pressure: { name: 'Druck aushalten', desc: 'R6: +25 Composure, Gegner-Schüsse -8% Genauigkeit. Clutch-Nerven im Rampenlicht.\nIhnen in die Augen sehen. Ihre Schüsse zittern, unsere nicht. Mentalität gewinnt das hier.' }
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
      sturm:          { name: 'Sturmwalze',       desc: 'Drückt den Abschluss mit Präzision durch — jeder Schuss landet 8% häufiger gefährlich beim Keeper.' },
      riegel:         { name: 'Schlosskette',     desc: 'Schließt vor dem Tor konsequent die Räume — deine Paraden werden jede Runde 5% schwerer durchzubringen.' },
      konter_opp:     { name: 'Konter-Drohung',   desc: 'Lauern auf deinen Aufbau-Fehler. Jedes missratene Buildup gibt 30% Chance auf einen sofortigen Schuss aus der Umschaltung.' },
      presser_opp:    { name: 'Pressing-Maschine',desc: 'Pressen hoch und attackieren jeden Pass. Deine Aufbauten scheitern 10% häufiger unter dem Dauerdruck.' },
      clutch_opp:     { name: 'Eiskalt',          desc: 'Unter Druck in den Schlussminuten blühen sie auf. Runden 5-6: +10 Angriff, +5 Tempo.' },
      lucky:          { name: 'Glückspilze',      desc: 'Irgendwas klappt immer. Einmal pro Match ein unvorhersehbarer Bonus-Angriff aus dem Nichts.' },
      ironwall:       { name: 'Eisenwand',        desc: 'Starten bombensicher ins Spiel. Erste 2 Runden praktisch uneinnehmbar — +10 Verteidigung.' },
      sniper:         { name: 'Scharfschütze',    desc: 'Warten auf den einen perfekten Moment. Jeder Schuss +15% Genauigkeit, dafür langsamer am Ball (-5 Tempo).' },
      boss_aura:      { name: 'Dominante Präsenz',desc: 'Spielen mit der Erfahrung einer ganzen Karriere. Jede Runde bekommt jeder Gegner-Spieler einen weiteren kleinen Stat-Bonus — das Match wird mit der Zeit härter.' },
      bulwark:        { name: 'Bollwerk',         desc: 'Einer dieser Spieler, der auf der Linie noch alles rausholt. Einmal pro Match wird ein sicher geglaubtes Tor in letzter Not geklärt.' },
      counter_threat: { name: 'Doppel-Konter',    desc: 'Zwei Spieler lauern auf deinen Fehler. Missratener Aufbau bringt 35% Schuss-Risiko — und der Wert steigt wenn sie hinten liegen.' },
      rage_mode:      { name: 'Rage-Modus',       desc: 'Rückstand entfacht sie. Bei 2+ Toren im Rückstand kommt jede Runde eine zusätzliche Chance auf einen Extra-Angriff.' },
      pressing_wall:  { name: 'Pressing-Wand',    desc: 'Hohes Pressing koordiniert aufs ganze Mittelfeld. Deine Aufbauten brechen 15% häufiger ab.' }
    },
    legendaryTraits: {
      god_mode:      { name: 'Gott-Modus',       desc: 'Hebt sich einen Moment auf. Einmal pro Match zählt das nächste eigene Tor dreifach — das Spiel kann in einer Sekunde kippen.' },
      clutch_dna:    { name: 'Clutch-DNA',       desc: 'Je später das Match, desto klarer der Kopf. Letzte Runde: +20 Offense, +10 Composure — genau dann wenn es zählt.' },
      field_general: { name: 'Feldmarschall',    desc: 'Organisiert die Mannschaft im Spielaufbau. Das gesamte Team bekommt +4 auf alle Stats, egal wo.' },
      unbreakable:   { name: 'Unzerbrechlich',   desc: 'Das erste Gegentor prallt an ihnen ab. Einmal pro Match wird ein geschossenes Gegentor komplett annulliert.' },
      big_game:      { name: 'Big-Game-Spieler', desc: 'Gewöhnliche Matches sind Routine, aber gegen Bosse spielen sie sich frei. +15 auf ihren Fokus-Stat in Boss-Matches.' },
      conductor:     { name: 'Dirigent',         desc: 'Jeder Pass ebnet den nächsten. Jedes erfolgreiche Aufbau-Spiel erhöht die Tor-Wahrscheinlichkeit des nächsten Abschlusses um +8%.' },
      phoenix:       { name: 'Phönix',           desc: 'Rückstand weckt sie. Bei 2+ Toren im Rückstand aktivieren sie +12 Offense für den Rest des Matches — der Kampf gegen die Niederlage beginnt.' },
      ice_in_veins:  { name: 'Eis in den Adern', desc: 'Kein Trick, kein Psycho-Spiel, kein Composure-Buff des Gegners erreicht sie. Ihr Urteil bleibt scharf — Composure-Buffs der Gegner werden ignoriert.' }
    }
  }
});