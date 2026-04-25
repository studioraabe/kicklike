# Kicklike 2 — Umsetzungsbriefing

**Status:** Pre-Production / Konzeptphase
**Vorgänger:** Kicklike v0.50.0-beta (Web-Sim, eingefroren als Referenz)
**Endplatform:** Steam (Godot 4)
**Genre:** Tactics-Roguelite-Deckbuilder mit 5-a-side Football als Kernmechanik
**Arbeitstitel:** Kicklike 2 (Codename — finaler Name TBD)

---

## 0. Mission Statement

Wir bauen **Slay the Spire mit Fußball-Skin — aber nur strukturell**. Das Match selbst soll
sich nicht wie ein Kartenkampf anfühlen, sondern wie ein **rundenbasierter Fußball-Spielzug**,
der durch Karten gesteuert wird. Der Spieler ist Akteur auf dem Feld, nicht Zuschauer einer
Simulation.

Die zentrale Designwette: **Push-your-Luck-Drives** (Blood-Bowl-Logik) erzeugen
fußballförmige Sequenzen — Aufbau hinten, Verlagerung, Steilpass, Abschluss — und machen
Ballverlust mechanisch schmerzhaft, nicht nur statistisch.

**Ambition:** Steam-Indie mit AAA-Anspruch im Detail. Wir scheuen den Aufwand für
Polish und Art-Direction nicht, aber wir bauen erst die Mechanik fertig bevor
wir Geld in Visuals stecken. Web-Prototyp = Mechanik-Test, Godot = Produktion.

### Was wir nicht bauen

- Kein FIFA-Echtzeit-Sim. Keine Pixel-genaue Bewegung. Keine Joystick-Steuerung.
- Keine unsichtbaren Wahrscheinlichkeits-Sims wie in Kicklike 1.
- Kein offenes Live-Feld. Diskrete Zonen, diskrete Züge, klare Lesbarkeit.
- Keine Manager-Sim. Wir sind Coach UND Spieler-am-Ball, nicht Vorstand.

### Was wir bauen

- Ein **rundenbasiertes Karten-Spiel auf einem 3×3-Zonen-Feld**, in dem jeder Drive
  (Ballbesitz-Sequenz) ein Mini-Push-Your-Luck-Mechanismus ist.
- Eine **Roguelite-Liga-Struktur**, in der jeder Run ein Aufstieg durch
  Liga-Pyramiden ist, mit Rivalen, Events, Deck-Drafts und Squad-Evolution.
- Ein **Squad-als-zweites-Deck-System**, in dem deine 5 Spieler permanente Karten in Play
  sind und Traits jede gespielte Aktion modifizieren.

---

## 1. Designprinzipien (nicht verhandelbar)

1. **Lesbarkeit vor Realismus.** Jede Wahrscheinlichkeit, jeder Modifier, jede
   Gegner-Absicht muss vor dem Klick sichtbar sein. Keine versteckten Würfel.
   *Vorbild: Into the Breach — alle Gegner-Aktionen werden telegrafiert.*
2. **Sequenzen vor Aktionen.** Eine einzelne Karte allein soll nicht "den Spielzug machen".
   Der Spielzug ist die Verkettung — das ist der Job des Drive-Systems.
3. **Squad ist Charakter, nicht Statistenliste.** Spieler-Verlust durch Verletzung
   muss wehtun. Spieler-Aufstieg muss neue Karten oder Synergien freischalten.
4. **Tactical Philosophies sind Spielmodi, nicht Buffs.** Tiki-Taka soll sich anders
   *spielen* als Catenaccio, nicht nur andere Zahlen produzieren.
5. **Defensiv-Asymmetrie.** Ohne Ball spielst du nicht passiv. Du legst Reaktionen.
6. **Jede Niederlage ist Material.** Rivalen erinnern sich. Verlorene Matches färben
   die nächste Begegnung — narrativ und mechanisch.

---

## 2. Match-Loop — Die Kernschleife

### 2.1 Feldarchitektur

**3×3 Zonen.** Drei Reihen (Defensive / Mittelfeld / Offensive), drei Spuren (Links / Mitte / Rechts).

```
┌─────────┬─────────┬─────────┐
│  OFF-L  │  OFF-M  │  OFF-R  │  ← Offensive (gegen Tor)
├─────────┼─────────┼─────────┤
│  MID-L  │  MID-M  │  MID-R  │
├─────────┼─────────┼─────────┤
│  DEF-L  │  DEF-M  │  DEF-R  │  ← Defensive (eigenes Tor)
└─────────┴─────────┴─────────┘
```

- Spieler stehen IN Zonen, nicht auf Pixeln.
- Pro Zone: 0-3 Spieler beider Teams kombiniert, sichtbar als Sprite-Stapel
  oder als 2-Spalten-Layout in der Zone.
- Ball ist immer in EINER Zone.
- Jede Zone kann pro Match einen **Modifier** haben ("Regen: Pässe -10%",
  "Auswärtsfans: Composure -5"). Modifier kommen aus Events oder Stadion-Karten.
- Distanz zwischen Zonen ist **Karten-relevant**:
  - Kurzpass: 1 Zone (orthogonal) = sicher (~85% Erfolg)
  - Querpass: 1 Zone (lateral, gleiche Reihe) = sicher (~80%)
  - Steilpass: 2 Zonen = riskant (~60%)
  - Lange Schlag: 3 Zonen = kühn (~40%)

### 2.2 Drive-Mechanismus (Kernwette)

Ein Match besteht aus **Drives**. Ein Drive ist eine Possession-Sequenz, die so lange
läuft, wie du erfolgreich Karten spielst — ODER bis du freiwillig endest.

**Ablauf eines Drives:**

1. Ball startet in einer Zone bei einem deiner Spieler.
2. Du ziehst eine **Drive-Hand** (5 Karten aus deinem Deck).
3. Du spielst Karten der Reihe nach. Jede Karte hat:
   - **Energy-Kosten** (gemeinsamer Drive-Pool, z.B. 3 Energy)
   - **Erfolgschance** (sichtbar, modifiziert durch Zone, Spieler-Stats, Traits)
   - **Erfolg-Outcome** (was passiert bei Treffer)
   - **Fail-Outcome** (was passiert bei Fail — Turnover, Ballverlust, Konter-Trigger)
4. **Erfolg** → Karte wirkt, Drive läuft weiter, du darfst weitere Karten spielen.
5. **Fail** → **Turnover.** Drive endet sofort. Restliche Hand wandert in den Discard.
   Gegner ist dran.
6. Auch bei Erfolg: Energy ist endlich. Wenn Energy < Karten-Kosten → Drive-Ende
   freiwillig (du wählst: Schuss riskieren, sicher zurückspielen, oder Karte
   ausspielen die einen sauberen Reset erlaubt).
7. **Ein Tor** (Schusskarte erfolgreich aus Offensive-Zone) beendet den Drive
   automatisch und ist der Sieg-Reward dieses Drives.

**Warum push your luck:** Jeder zusätzliche Pass nähert sich dem Tor, aber das
Risiko-Budget wächst. Ein Schuss aus MID-M ist 25%; ein Schuss aus OFF-M nach
3 Aufbau-Karten ist 65%. Aber jede Aufbau-Karte hatte selbst eine Fail-Chance.

**Match-Länge — variable Zeit-Ressource statt fixer Drive-Anzahl:**

Statt fester "10-15 Drives" verwenden wir einen **Time-Pressure-Counter** (0-100),
der pro Drive abnimmt:

- Schneller Drive (1-2 Karten, Turnover): ~3-5 Time
- Standard-Drive (3-4 Karten, Schussende): ~7-10 Time
- Langer Possession-Drive (5+ Karten, Tiki-Taka): ~12-15 Time

**Phasen-Trigger:**
- Halftime bei Time = 50 (egal wie viele Drives bisher gespielt wurden)
- Final Phase bei Time = 80 (Coach-Moment "All-In oder Lockdown")
- Match-Ende bei Time = 100

**Erwartete Real-Spielzeit:** 8-15 Minuten pro Match.
**Erwartete Drive-Anzahl:** 8-20, je nach Spielstil. Schnelle Pressing-Matches haben
mehr Drives, langsame Possession-Matches weniger — beide spielen sich anders.

**Tempo-Modifier** sind dadurch echte Karten-Achsen:
- "Hurry-up Tempo" — alle Drives kosten -2 Time (gut bei Rückstand, mehr Versuche)
- "Park the Bus" — Gegner-Drives kosten +3 Time (Uhr runterspielen)
- "Time-Wasting" Tactic in Final-Phase — pro eigener erfolgreicher Karte +1 Time

**Ø-Tor-Chance pro Drive:** ~10-15%, modifiziert durch Manager-Philosophy.
Realistische Endstände 2:1, 1:1, 3:0 — fußballförmig.

**Vorbild:** Magic the Gathering hat keine fixe Spiellänge, aber klare Druckventile
(Lebenspunkte, Library). Hades-Runs sind variabel lang, aber jeder Encounter ist
vorhersagbar. Wir nehmen die Variabilität, packen aber Phasen-Anker rein, damit die
Coach-Momente an spannenden Stellen liegen.

### 2.3 Defensiv-Asymmetrie

Wenn der Gegner am Ball ist, spielst du **nicht aktiv**. Stattdessen:

1. Du siehst den Gegner-Drive in **Stages telegrafiert**:
   `[Pass MID-M → MID-R]` `[Schuss OFF-R]` — als Vorhersage-Schiene.
2. Du legst pro Drive **1-2 Reaktionskarten** in **Trigger-Slots**:
   - "Wenn Pass nach MID-R, dann Tackle (45%)"
   - "Wenn Schuss aus OFF-R, dann Block (Composure-roll)"
3. Erfolgreiche Reaktion = Ballgewinn = du übernimmst, dein Drive startet.
4. Unausgelöste Reaktionen wandern zurück ins Deck (oder Discard, je nach Karten-Tag).

**Reaktions-Slot-Anzahl skaliert mit Tactical Philosophy:**
- Catenaccio: 3 Slots
- Standard: 2 Slots
- All-Out-Attack: 1 Slot

*Vorbild: Othercide-Timeline-Falle, Wildfrost-Companion-Trigger.*

### 2.4 Karten-Kategorien

Karten haben einen **Type** (bestimmt UI-Farbe wie im Screenshot) und eine **Funktion**.

| Type | Farbe | Beispiele | Wann spielbar |
|---|---|---|---|
| **Skill** | Grün | Quick Pass, One-Two, Drop Deep | In Possession, kostengünstig |
| **Attack** | Orange/Gold | Power Shot, Through Ball, Long Range | In Possession, Ziel-Zonen-Beschränkung |
| **Tactic** | Lila | Pressed!, Gegenpressing | Möglich in/aus Possession (Modifier) |
| **Defense** | Blau | Defensive Wall, Tackle, Block, Hold Shape | In Reaktions-Slots (out of possession) |
| **Coach** | Gelb (Sonderslot) | Halbzeitansprache, Wechsel | Nur an Coach-Momenten (Kickoff/Halbzeit/Endphase) |

**Karten-Effektklassen (von atomar zu komplex):**

1. **Atom** — eine Aktion, ein Outcome. *"Pass: Ball zur Nachbarzone."*
2. **Combo** — verkettet 2 Atome bei Erfolg. *"Doppelpass: Pass + sofort Pass zurück."*
3. **Modifier** — verändert nächste N Karten. *"Tiki-Taka aktiv: nächste 3 Pässe -1 Energy."*
4. **Conditional** — triggert nur unter Bedingung. *"Counter Strike: nur in Drive nach Turnover, Auto-Steilpass."*
5. **Sticky** — bleibt mehrere Drives aktiv. *"Hoch verteidigen: nächste 2 Gegner-Drives bekommen +1 Reaktions-Slot."*

**Wir brauchen alle 5 Klassen schon im Prototyp**, sonst können keine
mehrphasigen Spielzüge entstehen.

### 2.4.1 Pass-Targeting — Zone vs Spieler

Wie löst man "Wenn 2 Mitspieler in einer Zone, wer nimmt den Ball"? Vorbilder:
Marvel Snap (Lane-getrieben, Spieler-Identität egal), Wildfrost (Companion-spezifisch),
Football Manager (best-option Default mit Override).

**Hybrid-Lösung:** Zone ist Default-Target, Spieler-Targeting ist Spezialkarten-Privileg.

- **Standard-Pässe** (Quick Pass, Through Ball, Long Switch) → targeten Zonen.
  Bei mehreren Mitspielern in Zone: der mit höchstem Vision nimmt den Ball.
  Klar, lesbar, schnell entscheidbar.
- **Spezialkarten mit Spieler-Targeting** ("Find the Striker", "Wing Combination",
  "Captain's Call") → targeten Rolle/Spieler explizit, ignorieren Zonen-Default.
  Das macht Spieler-Identität mechanisch wertvoll, ohne jede Karte komplex zu machen.

Bonus-Effekt: Bestimmte Traits (z.B. "Magnet" auf Striker) modifizieren das Default —
"Pässe in Striker-Zone gehen primär an mich, auch wenn Vision niedriger". Das macht
Trait-Builds Squad-relevant.

### 2.5 Coach-Momente (3 pro Match)

An drei festen Punkten unterbricht das System den Drive-Flow für eine
**Coach-Entscheidung**. Übernommen aus Kicklike, aber stärker eingebettet.

1. **Kickoff** — vor Match-Start: Wahl einer Kickoff-Tactic (z.B. "Aggressive Start")
2. **Halftime** — zwischen Halbzeiten: Wahl einer Halftime-Tactic plus optionalem Wechsel
3. **Final Phase** — vor letzten 2-3 Drives: Wahl einer Final-Tactic (Park the Bus,
   All-In, Clockwatch...)

Jede Coach-Entscheidung ist ein **3-Wege-Choice** mit klaren Trade-offs, wie im Screenshot
("Rally the Squad / Play Through It / Extra Time Waste"). Keine "richtige" Wahl —
Strategie-Variabilität.

Tactics werden teilweise aus Kicklike übernommen (56 existierende Designs als Steinbruch),
teilweise neu gebaut, da das Drive-System neue Mechaniken braucht.

### 2.6 Sieg-Bedingung

- **Match:** mehr Tore nach Schlussphase. Bei Gleichstand → Elfmeterschießen
  (eigener Mini-Modus, später).
- **Run:** Saison gewinnen (Liga-Tabelle Platz 1) oder Pokal gewinnen.
- **Scheitern:** Saison-Ende mit Abstieg ODER Pokal-K.O. → Run zu Ende.

### 2.7 Schiedsrichter & Set-Pieces — emergent statt separater Layer

**Ursprüngliche Sorge:** Schiri-System wäre +30% Komplexität. Nach Recherche:
realistisch +10%, wenn von Anfang an als Teil der Drive-Mechanik gebaut, nicht
nachträglich draufgesetzt.

**Vorbilder:**
- **Blood Bowl** behandelt Refs als verstecktes Würfeln über Foul-Aktionen. Foulen
  ist ein erlaubter Move mit hohem Reward (Gegner-Verletzung), aber Ref-Wurf kann
  dich rauswerfen. Push-your-luck innerhalb push-your-luck.
- **For the King** macht aus kritischen Würfel-Fails dramatische Mini-Events.
- **Magic the Gathering** hat keine Refs, aber das Stack-Reaktionsprinzip ist
  strukturell identisch zu unseren Reaktions-Slots.

**Unsere Lösung:**

1. **Foul-Tag auf bestimmten Karten.** Tackle-Karten, Pressing-Karten,
   physische Defensiv-Karten haben einen versteckten Foul-Roll bei kritischem Fail
   (Würfel <15% von Erfolg).
2. **Foul-Outcomes telegrafiert:**
   - **Gelb** — nächste physische Karte des Spielers hat +15% Fail-Chance,
     Spieler-Karte sichtbar markiert
   - **Rot** — Spieler raus für Rest des Matches (oder 1-2 weitere Matches),
     Squad runter auf 4 Spieler bis Ende
3. **Set-Pieces als Mini-Drives.** Bei Foul/Auspiel/Eckball pausiert der normale
   Drive-Loop. Stattdessen: 1-2-Karten-Sub-Drive aus einem Set-Piece-Sub-Deck.
   - Freistoß: Wahl zwischen direktem Schuss (riskant) und Aufbau (sicher)
   - Ecke: 1 Karte aus Corner-Sub-Deck (Header, Kurz-Variante, Fake)
   - Penalty: 1-Karten-Drama-Moment, hohe Erfolgschance, hoher Composure-Modifier
4. **Set-Piece-Karten** sind Run-relevante Sammelobjekte — bessere Ecken-Karten
   im Markt kaufbar, definieren defensive vs offensive Set-Piece-Identität.

**Foul-Spiel als taktische Achse:** "Aggressive Defense" Build setzt bewusst auf
viele Tackle-Karten mit Foul-Risiko, weil Reward (Ballgewinn) hoch ist.
"Sauber spielen" Build vermeidet Foul-Karten, ist langsamer aber sicherer. Macht
zwei Defensive-Spielstile mechanisch unterscheidbar.

**Implementation in Prototyp:** Phase 1 (Step 1) NICHT enthalten — wir testen erst
Drive-Loop pur. Phase 2 (Step 3-4) integrieren wir Fouls + Penalty als Set-Piece-Test.

---

## 3. Squad-System — Spieler als zweites Deck

### 3.1 Rollen & Archetypen (aus Kicklike übernommen)

5 Rollen, jede besetzt 1 Slot in Startelf:

| Rolle | Code | Focus-Stat | Zonen-Präferenz |
|---|---|---|---|
| Goalkeeper | TW | defense | DEF-M (statisch) |
| Defender | VT | defense | DEF-L/M/R |
| Playmaker | PM | vision | MID-M |
| Winger | LF | tempo | MID-L/R oder OFF-L/R |
| Striker | ST | offense | OFF-M |

15 Archetypen (3 pro Rolle), je mit Base-Stat-Verteilung. Beispiele aus Kicklike-Daten:
- Keeper: Block-Keeper (def-fokussiert) / Sweeper-Keeper (vision-fokussiert) / Reflex-Keeper (tempo-fokussiert)
- Defender: Betonwand / Beißer / Libero
- usw.

Diese Daten **übernehmen wir 1:1 als JSON aus Kicklike** (`config-data.js → DATA.archetypes`).

### 3.2 Stats (5 Achsen)

Übernommen aus Kicklike — funktioniert dort gut, ist gut balanced:

- **Offense** — Schuss-Erfolg, Steilpass-Aggression
- **Defense** — Tackle-Erfolg, Block-Werte
- **Tempo** — Initiativ-Würfe, Konter-Speed, Reaktions-Trigger
- **Vision** — Pass-Genauigkeit, Karten-Synergien lesen
- **Composure** — unter Druck (späte Drives, Final-Phase, Pressure-Mechanik)

Skala 1-100. Stat-Werte modifizieren Erfolgschancen der Karten direkt.
Beispiel: "Power Shot" Base 50% → Striker mit Offense 80 → Final 50% + (80-50)·0.5% = 65%.

### 3.3 XP & Evolution (StS-Karten-Upgrade-Äquivalent)

**Pro Match XP-Vergabe:**
- Tor: +3 XP
- Assist: +2 XP
- Erfolgreicher Drive (ohne Tor): +1 XP für Drive-Beteiligte
- Erfolgreiche Reaktion: +2 XP für Reaktor
- Verloren: -1 XP-Penalty (max nicht unter 0)

**Level-Up:**
- xpToNext startet bei 4, skaliert: 4 → 6 → 9 → 13 → 18 ...
- Bei Level-Up: +1 in einem Stat (Spieler wählt zwischen 2 vom Archetyp gepushten Stats)
- Bei **Level 5, 9, 13** = Evolution möglich (Choice aus 3 Pfaden, exponentielles Tree wie Kicklike)

**Evolution-Konsequenz:**
- Stat-Boost (z.B. +15 Defense)
- Neuer Trait (passive Auto-Wirkung in Drives)
- **Optional: neue Karte ins Deck.** Z.B. "Architect"-PM-Evo schaltet "Killer Pass" frei.

→ Squad-Aufstieg = automatisches Deck-Wachstum. Macht Squad-Investition sinnvoll
und integriert die zwei Deck-Layer.

**Evolution-Daten:** ~150 Evolution-Knoten existieren in Kicklike, davon nutzen wir
Stage-1 (45) und Stage-2 (45) komplett. Stage-3 (~60) als Endgame-Long-Tail.

### 3.4 Traits

~150 Traits existieren in Kicklike (`DATA.traits`). Beispiele:
- *Killer Pass* — bei Pass-Erfolg 25% Chance auf Bonus-Aktion (Chain-Trigger)
- *Speed Burst* — 1× pro Halbzeit garantierter Pass-Erfolg
- *Predator Pounce* — nach Gegner-Fail-Drive: erstes Schusskarten +30%

**Übertragung:** Trait-Logik wird teilweise neu geschrieben, weil sie in Kicklike auf
Sim-Buffs basiert. Im neuen System triggern Traits an konkreten Karten-Events
(`onPassSuccess`, `onTackleFail`, `onDriveStart`, `onShotAttempt`, `onTurnover`).

### 3.5 Condition / Fatigue

Aus Kicklike übernommen. 0-100, sinkt bei Karten-Plays mit Player-Tag.
- > 50: keine Penalty
- 25-50: -3 alle Stats
- < 25: -6 alle Stats, sichtbares "Müde"-Icon

Wechsel auf der Bank = Recovery zwischen Drives.

### 3.6 Bank, Rotation & Karriere-Length

**Squad-Größe:** 7-Mann-Squad (5 Starter + 2 Bank).

**Wechsel** passieren an Coach-Momenten oder bei Verletzung. Bank-Spieler regenerieren
Condition zwischen Drives.

**Verletzungen:**
- Trigger bei kritischem Fail (Würfel <15%) auf Karten mit "physical"-Tag
- Schwere: leicht (1 Match Pause), mittel (3 Matches), schwer (komplette Halbsaison)
- Kicklike hatte das nicht — neu für KL2

**Karriere-Length statt Permadeath:**

Vorbilder-Recherche: Darkest Dungeon nutzt harten Permadeath als Identitätskern,
das schmerzt aber funktioniert weil Squad ohnehin als auswechselbar konzipiert ist.
Football Manager macht Spieler altern, retiren, mit emotionaler Bindung über
Karrieren. XCOM macht Permadeath ikonisch, jeder Squad-Toter wird Story.

Für KL2: Mittelweg. **Spieler haben Alter (24-38) und retiren freiwillig**, statt
zu sterben.

- Jeder Spieler hat ein **Karriere-Match-Counter** (z.B. 30-50 Matches Restkarriere
  bei Recruitment, abhängig vom Alter beim Beitritt)
- Nach jedem Match: Counter -1
- Bei Counter = 5: warnung, Spieler erwägt Karriere-Ende
- Bei Counter = 0: **Karriere-End-Match** — narratives Moment vor letztem Spiel,
  optionaler Boost-Trait für 1 jungen Nachfolger ("Mentor's Gift")
- Spieler verlässt Squad nach diesem Match endgültig

**Konsequenzen:**
- Squad-Investition emotional bedeutsam (Star-Spieler kann nicht ewig leben)
- Natürlicher Druck, junge Talente nachzuziehen (Scouting wird Run-Aktivität)
- Keine Run-zerstörende Permadeath-Frustration
- Veteran-Spieler-Karriere-Ende = potentieller Story-Moment

**Spezialfall: rote Karten in entscheidenden Matches** können dazu führen, dass
Veteranen mit niedrigem Karriere-Counter "die Schuhe an den Nagel hängen" — eine
Karte, die wir narrativ nutzen können.

---

## 4. Run-Struktur — Die Meta-Schleife

### 4.1 Liga-Pyramide statt Acts

Statt StS-Tower: **vertikales Liga-System**.

```
                ┌─── CUP (Endgame, einmalig pro Run) ──┐
                                  ▲
                          [ELITE LIGA]   ← Run-Sieg-Ziel
                                  ▲
                        [PROFI-LIGA]
                                  ▲
                       [AMATEUR-LIGA]    ← Run-Start
```

- **Saison = 14 Matches** (Round-Robin mit 8 Teams, hin/rück) — Daten aus Kicklike.
- **Aufstieg** bei Platz 1-2 → nächste Tier.
- **Abstieg** bei Platz 7-8 → eine Tier runter (oder Run-Ende, wenn schon Amateur).
- **Cup parallel** — 4-Runden-K.O. außerhalb der Liga, Preis = Permanent-Boon für nächste Saison.
- **Endgame:** Elite-Liga + Cup = Run gewonnen. Unlock: neue Manager-Archetypen.

**Vorteil gegenüber StS-Acts:** Lateral-Bewegung, mehrere Pfade zum Ziel, Risiko-Management
(absteigen ist möglich aber nicht Run-Ende).

### 4.2 Season-Path / Node-Map (Screenshot-Element)

Innerhalb einer Saison läuft das Match-Schedule als **visuelle Node-Map**, exakt wie
im Screenshot links unten zu sehen:

- Knoten = Matches und Inter-Match-Events
- Linien = mögliche Pfade
- Farben/Icons = Knotentyp:
  - 🏟️ Liga-Match (Pflicht-Knoten)
  - 🛒 Markt (Karten kaufen, Spieler scouten)
  - ❓ Mystery-Event (random Event)
  - 💀 Boss-Match (Rivalen-Encounter)
  - 🏆 Cup-Match (parallel zum Liga-Schedule)
  - 🛡️ Trainings-Lager (Squad-XP, Heilung)

Spieler wählt zwischen Liga-Pflicht (linear) und optionalen Side-Knoten (Markt, Event,
Training) zwischen den Match-Wochen. **Ressource: Wochen.** Die Saison hat 14 Match-Wochen,
und Side-Knoten kosten 1-2 Wochen, also Trade-off zwischen Squad-Wachstum und Match-Vorbereitung.

### 4.3 Events & Decisions

Aus Kicklike: **Decisions-System** mit narrativen Events vor/nach Matches.
Beispiel im Screenshot rechts: "Rival Fans" — 3 Optionen mit Trade-offs.

Übertragung: ~50 Event-Karten, jede mit 2-3 Choices, jede Choice mit klarem
mechanischen Outcome (Karten/XP/Cash/Squad-Effekt).

Beispiele neu für Drive-System:
- **Verletzungstrubel:** Star-Spieler streikt. (a) Bestechung +200 Cash → bleibt;
  (b) Bank schicken → -10 Squad-Chemistry; (c) verkaufen → +400 Cash, -1 Spieler-Slot
- **Stadion-Atmosphäre:** Heimspiel-Pyro. (a) Power-Match → +1 Energy alle Drives;
  (b) Kontrolle → Composure +5 ganzes Match; (c) Eskalation → Pressure +1 Stage

### 4.4 Manager-Archetypen (StS-Charakter-Äquivalent)

5 Manager als Run-Start-Wahl, jeder mit:
- **Start-Squad** (siehe Kicklike-Starter-Teams: Konter / Kraft / Technik / Pressing — wir bauen Pyre-mäßige narrative Identität dazu)
- **Start-Deck** (15 Karten, philosophie-passend)
- **Start-Philosophy** (Tiki-Taka / Catenaccio / Gegenpressing / Long Ball / Counter)
- **Manager-Trait** (passiv für gesamten Run, z.B. "Underdog" → +10% gegen Gegner mit höherer Wertung)
- **Exklusive Karten** (8-10 Karten, die nur bei diesem Manager im Pool sind)

**Unlock-Path:** 1 Manager start, weitere durch Run-Erfolge unlockbar (StS-Modell).

### 4.5 Rivalen-System (Long-Tail-Bindung)

Aus Kicklike: `_oppMemory` speichert Begegnungen pro Gegner-Team.
Erweitert für KL2:

- Bestimmte Gegner werden **named Rivalen** ab Begegnung 2.
- Rivalen haben:
  - Persistente Identität über Runs hinweg (anders als Kicklike, wo Run-Reset alles tilgt)
  - Steigende Schwierigkeit
  - Eigene Boss-Encounter mit Custom-Mechaniken (Stadion-Modifier, Special-Karten gegen dich)
  - **Spezielle Drop-Belohnung** beim Sieg
- *Vorbild: Hades-Theseus.* Maximal 3-5 Named-Rivalen pro Run, davon meist 1-2 wiederkehrend.

---

## 5. UI/UX — Layout-Architektur

Basis: dein Reference-Screenshot. Wir behalten das Grid streng, weil es Coach-Sicht
(global) und Match-Sicht (lokal) sauber trennt.

### 5.1 Layout-Grid (Hauptscreen während Match)

```
┌───────────────────────┬──────────────────────────────────────┬───────────────────────┐
│ TEAM-HEADER (links)   │ MATCH-CENTER                         │ EVENT/CONTEXT (rechts)│
│ - Logo + Slogan       │ - Phase-Badge (1ST HALF)             │ - Event-Card oder     │
│ - Squad/Evo Tabs      │ - Score: TEAM A 2-1 TEAM B           │   Coach-Choice oder   │
│ - 5 Spieler-Zeilen    │ - Pressure-Bar                       │   Drive-Telegraph     │
│   (#, Foto, Stats)    │ - 3×3 ZONEN-FELD (zentral)           │ - Reward-Preview      │
│ - Chemistry-Bar       │   • Sprites in Zonen                 │                       │
│                       │   • Ball-Highlight                   │                       │
│ SEASON PATH (Node-Map)│   • Reaction-Slots als Overlay       │                       │
│ - Aktueller Knoten    │ - Energy-Counter | END TURN          │                       │
│ - 4 WEEKS REMAINING   │ - Hand: 5 KARTEN (bottom-center)     │                       │
│                       │                                      │                       │
│ DECK | DISCARD        │                                      │ RETREAT | PAUSE       │
└───────────────────────┴──────────────────────────────────────┴───────────────────────┘
```

**Top-Bar (full width):**
- Season X / Week Y
- Achievement-Slots (4 Icons mit Hover-Preview)
- Currency: Coins + Gems
- XP-Bar mit aktueller Saison
- Inventory / Codex / Settings

**Bottom-Bar (full width):**
- Retreat (links) / Pause (rechts)
- Hand-Slot mit 5 Karten als zentrales Element

### 5.2 Karten-Render (UI)

Wie im Screenshot, jede Karte zeigt:
- **Cost-Badge** (oben links, Energy-Zahl)
- **Player-Art** (Hintergrund, je nach Karten-Type/Rarity)
- **Erfolgs-Chance** (oben rechts, kleiner Prozent-Wert mit Modifier-Stack)
- **Name** (unten, Caps)
- **Type-Label** (unter Name, farbcodiert)
- **Effekt-Text** (klein, max 2 Zeilen)
- **Synergy-Tags** (unten rechts, kleine Icons für Combo-Trigger)

Beim Hover: Karten-Detail-Panel mit:
- Berechnung der Erfolgschance (Base + alle Modifier offen)
- Was bei Erfolg/Fail passiert
- Welche Spieler involved sind
- Combo-Vorschau wenn Synergie aktiv

### 5.3 Zonen-Feld-Render

**Visuelle Stufe wird in Phase 3+ (Godot-Port) entschieden, nicht jetzt.**

Für den Web-Prototyp: schlichtes 2D-Top-Down mit SVG-Linien für Zonen, Kreise für
Spieler, gelber Ball-Indikator. Reicht völlig für Mechanik-Test.

Für Steam-Release sind beide Optionen offen:
- **Stilisiertes 2D-Iso** (z.B. wie Pyre, OlliOlli, DanderdomeIO) — mittlerer
  Aufwand, sehr distinct look, niedrige Performance-Anforderungen
- **3D-Rendering** wie im Reference-Screenshot — hoher Aufwand, aber AAA-Look,
  konkurrenzfähig auf Steam-Wishlists

**Entscheidungs-Trigger:** wenn Mechanik solide ist und wir Wishlists sammeln
wollen, lohnt sich der Investment in 3D. Wenn wir früh launchen wollen, 2D-Iso.
**Kein Lock-in jetzt.** Was wir aber JETZT richtig machen müssen: Datenstrukturen
und State-Machine sind render-agnostisch.

**Layout-Prinzipien (renderübergreifend):**
- 3×3 Grid sichtbar als Zonen-Trennung (Linien oder farbliche Abstufung)
- Zonen-Modifier als kleines Icon in Zonen-Ecke
- Ball als Highlight, immer in einer Zone, deutliche Animation beim Wechsel
- Spieler-Sprites in Zone, max 4 pro Zone (overflow → kompakter Stapel)
- Ballträger pulsiert, Ziel-Zone bei aktiver Karte hervorgehoben
- Reaktions-Slots als kleine Karten-Slots am Spielfeld-Rand

### 5.4 Animation-Prinzipien

- Karten-Play: Karte fliegt aus Hand zur Ziel-Zone, Outcome-Animation in Zone
  (Ball wandert, Stats-Roll-Visualisierung wenn Würfel sichtbar)
- Drive-Ende: harter visueller Marker (z.B. Pfeilschwenk: Ball kehrt zur
  Gegner-Seite)
- Tor: kurzer Slow-Motion-Highlight, Score-Tick, dann Reset

### 5.5 Out-of-Match-Screens

- **Season-Map** (Vollbild): Node-Map größer dargestellt, Klick auf Knoten = Encounter starten
- **Squad-Screen:** Detail jedes Spielers, Stats, Traits, Evolution-Tree, Form
- **Deck-Screen:** alle Karten im Deck, Filter nach Type, Upgrade-Pfade
- **Coach-Screen** (zwischen Drives an Coach-Momenten): Tactic-Choice mit 3 Optionen
- **Run-Übersicht:** Liga-Tabelle, Cup-Tableau, Rivalen-Status, Saison-Statistiken

---

## 6. Prototyp Step 1 — Was wir zuerst bauen

**Scope-Frage:** beantwortet der Prototyp, ob der Push-Your-Luck-Drive als
Kernmechanik trägt? Wenn nein → zurück. Wenn ja → alles andere obendrauf.

### 6.1 Was rein muss

- 3×3-Zonen-Feld als SVG, einfache Grafik, keine Sprites (Kreise mit Initialen)
- 3v3 (genug, um Zonen-Distanzen zu testen, weniger Komplexität als 5v5)
- Drive-System komplett: Hand ziehen, Karten ausspielen, Energy, Erfolg/Fail-Rolls,
  Turnover-Mechanik
- 8-10 Karten:
  - 3 Setup/Pass-Karten (kurz, quer, steil)
  - 2 Schuss-Karten (close, far)
  - 2 Defensive/Reaktions-Karten
  - 1-2 Combo-Karten (Doppelpass, Verlagerung)
- 1 Tactical-Philosophy-Modifier ("Tiki-Taka" als Demo)
- Dumbe KI mit 3 Verhalten:
  - Pass-bevorzugt nach vorn
  - Schuss bei Offensive-Zone
  - Pressing-Reaktion bei Spieler-Pass
- Match-Format: 10 Drives total, danach Score-Vergleich
- HUD: Energy-Counter, Karten-Hand, Score, Drive-Log (klein, optional)

### 6.2 Was raus bleibt

- Squad-Verwaltung (3v3 fix gespawnt)
- XP/Level-Up
- Traits
- Coach-Momente (Match startet ohne Tactic-Choice)
- Events / Season-Path
- Liga / Run-Struktur
- Mehrere Manager-Archetypen
- Sound, Animation-Polish, Sprites, Hintergründe
- Persistenz (kein localStorage, jede Page-Reload startet frisch)
- i18n (englisch reicht)

### 6.3 Erfolgskriterien

Wir wissen, dass die Mechanik trägt, wenn nach 10-15 Match-Sessions:

1. ✅ **Spannung steigt mit jedem zusätzlichen Karten-Play** (subjektiv)
2. ✅ **Mehrphasige Spielzüge entstehen organisch** — du baust hinten auf,
   verlagerst, schießt vorne. Mindestens 3 Drives pro Match haben ≥4 Karten-Plays.
3. ✅ **Fail-Outcomes fühlen sich nach Spielentscheidung an, nicht nach Pech.**
   Du kannst rückblickend sagen "ich hätte vorher den sicheren Pass nehmen sollen".
4. ✅ **Defensive ist nicht passives Warten** — Reaktions-Slots schaffen
   Lese-Aufgabe, die spannend ist.
5. ✅ **Match-Outcomes sind fußballförmig** (1-3 Tore pro Match meistens, nicht
   Hockey-Score).

Wenn 4 von 5 ✓ → Erweitern.
Wenn nur 1-2 ✓ → Drive-System hinterfragen (Energy zu hoch? Fail-Penalty zu
weich? Zu wenig Stages?).

### 6.4 Iterationsplan

1. **Woche 1:** Skelett bauen — Zonen, Spieler, Hand, Karten-Play-Loop, Turnover.
   Eine spielbare Match-Sequenz, ohne Polish.
2. **Woche 2:** KI tunen, Karten balancieren, 10-15 Test-Sessions selbst spielen.
3. **Woche 3:** Defensiv-Asymmetrie + Reaktions-Slots integrieren. Schwer, weil
   das die Drive-Logik um eine Achse erweitert.
4. **Woche 4:** Externes Testing (du + 2-3 Bekannte). Erfolgskriterien-Check.
5. Entscheidungspunkt: Erweitern, Refactoren, oder Tot-Ende.

### 6.5 Technologie-Stack Prototyp

- **Vanilla JS + HTML + CSS** (keine Frameworks)
- SVG für Feld-Render (Sprites später)
- Daten als JSON-Files (importierbar nach Godot später)
- Keine Build-Tools, keine Dependencies, statisch hostbar
- Optional: kleine RNG-Library (Mulberry32 wie in Kicklike, für Determinismus
  beim Debuggen)

---

## 7. Daten-Migration aus Kicklike

Was übernehmen wir 1:1, was bauen wir neu?

| Kicklike-Asset | KL2-Strategie | Format |
|---|---|---|
| 5 Stats | übernehmen | Schema |
| 5 Rollen | übernehmen | JSON |
| 15 Archetypen + Stats | übernehmen | JSON |
| ~100 Evolutions Stage 1+2 | übernehmen Daten, Trait-Logik neu | JSON + Code |
| ~150 Traits | übernehmen Namen/Beschreibungen, Effekt-Code neu | JSON + Code |
| 4 Starter-Teams | erweitern auf 5 Manager-Archetypen | JSON |
| 56 Tactics (Kickoff/HT/Final) | grob 30 davon übernehmbar, rest neu | JSON + Code |
| ~30 Karten | Designs als Inspiration, Code komplett neu (Sim → Drive) | Code neu |
| Liga-System (8/14) | übernehmen | JSON + Code |
| Tier-System | übernehmen | Code |
| Rivalry-Memory | übernehmen, ausbauen | Code |
| Decision-Events (~50) | Daten übernehmbar, Outcomes anpassen | JSON + Code |
| Namens-Generator | übernehmen | JSON |
| Stadion-Logos (Pixel-Art) | übernehmen wenn rechtefrei, sonst neu | Assets |
| Narrative-Zeilen | übernehmen | JSON |

**Plan:** Vor Prototyp-Step-1 schreiben wir ein kleines Extraction-Script
(`tools/extract-from-kicklike.js`), das diese Daten aus dem Kicklike-Repo zieht
und in saubere JSONs für KL2 packt. Das machen wir JETZT NICHT — erst wenn
Step-1-Prototyp grundlegende Mechanik erprobt hat. Aber wir wissen: das Material
ist da, portabel, dokumentiert.

---

## 8. Godot-Migrationsplan

Nicht zu früh denken, aber Architekturentscheidungen schon jetzt vorbereiten:

### 8.1 Was muss Godot-kompatibel bleiben?

- **Datenformate.** Alle Karten, Stats, Archetypen, Events als JSON oder GDScript-Resources.
  KEINE JS-Closures als Effekte — Effekte als deklarative Beschreibung
  (`{ type: "buff", target: "self", stat: "vision", amount: 8, duration: 1 }`),
  die ein generisches Effekt-System ausführt.
- **State-Machine.** Match-State als endlicher Automat: `IdleAtKickoff` →
  `DrivePlanning` → `DriveExecution` → `Turnover` → ... — gut auf Godot's
  StateMachine portierbar.
- **UI-Komponenten.** Karten, Zonen, Spieler — als wiederverwendbare Komponenten
  designen. In JS Web Components, in Godot als Scenes.

### 8.2 Was darf Web-spezifisch sein?

- Konkretes CSS / DOM-Layout
- SVG-Rendering (in Godot: Control-Nodes oder Custom-Drawing)
- Browser-API-Specifics (localStorage etc.)

### 8.3 Wann Godot starten?

**Erst wenn der Web-Prototyp die Erfolgskriterien aus 6.3 erfüllt** UND die
Mechanik durch ~3-5 Iterationen stabilisiert ist. Schätzung: 3-4 Monate
Web-Iteration, dann Godot-Port.

Beim Port:
- Daten 1:1 nach Godot-Resources
- State-Machine in GDScript spiegeln
- UI in Godot Scenes neu (kein Versuch, HTML zu portieren)
- Visual/Audio-Polish jetzt erst sinnvoll
- Steam-Integration (Cloud-Save, Achievements) am Ende

---

## 9. Endgame-Vision (Vollausbau)

Damit wir wissen, wofür wir bauen — Skizze des Endprodukts:

- **5-7 Manager-Archetypen** mit 100% unterschiedlichen Spielgefühlen
- **~150 Karten** im Pool, davon ~80 Common, ~50 Uncommon, ~20 Rare
- **3 Tactical Philosophies × 5 Tactics-Slots × 3 Coach-Momente** = riesige
  Build-Variabilität
- **150+ Traits**, aber Player-Squad nutzt typischerweise nur 8-15 davon pro Run
- **3 Liga-Tiers + Cup-Pyramide** = ~14 Saisons in einem perfekten Run nicht
  möglich, eher 1-3 Saisons bis Run-Ende
- **20-50 Stunden** für ersten Run-Sieg (StS-Vergleich), 200+ Stunden
  Long-Tail durch:
  - Daily Modifiers
  - Ascensions (StS-Modell — höhere Schwierigkeitsstufen pro Manager)
  - Achievement-Hunt
  - Manager-Unlocks
  - Special Events (saisonale Liga-Modifier)
- **Multiplayer-Async (Daily Challenge):** GEPLANT, Post-Launch-Phase. Asynchroner
  Wettkampf: täglicher Run mit fixem Seed (alle Spieler haben gleiche Karten-Drops,
  Events, Gegner-Verteilung). Highscore-Liste basierend auf Saison-Endplatz +
  Tordifferenz. Determinismus-Architektur (Mulberry32-Seeds) ist von Anfang an
  eingeplant — Kicklike hatte das schon, wir übernehmen es. Synchroner PvP wird
  EXPLIZIT NICHT gebaut: Turn-Latenz würde Drive-System brechen.

---

## 10. Risiken & offene Fragen

### Risiko 1: Drive-System wirkt mechanisch statt fußballerisch
**Mitigation:** früh testen (Step-1-Erfolgskriterium #2 + #5). Wenn organische
Spielzüge nicht entstehen, Mechanik überarbeiten BEVOR wir UI/Squad-Layer drauf
bauen.

### Risiko 2: Komplexitäts-Wand am Onboarding
**Mitigation:** progressive Komplexität:
- Match 1-2: nur Hand + Drives, keine Reaktions-Slots
- Match 3-5: Reaktionen freigeschaltet
- Match 6+: Coach-Momente und Tactical Philosophies
**Offene Frage:** wie kommunizieren ohne Text-Wall?

### Risiko 3: Squad-als-Deck schmerzt zu viel bei Verletzung
**Mitigation:** Bank-Spieler verfügbar, Verletzungen kurz (1-3 Matches), Coaching-Karte
"Comeback Boost" in Pool. Tuning durch Playtests.

### Risiko 4: Karten-Pool-Inflation (zu viele Karten = chaotisch)
**Mitigation:** strenge Karten-Distribution pro Manager (jeder sieht nur ~50% des Pools).
Manager-exklusive Karten als Identitäts-Anker.

### Offene Designfragen

- **Schiri-Layer:** ✅ ENTSCHIEDEN — emergent über Foul-Tag auf Karten + Set-Pieces
  als Mini-Drives. Phase 2 implementieren. Siehe Section 2.7.
- **Pässe-Targeting:** ✅ ENTSCHIEDEN — Hybrid: Standard-Pässe zu Zone, Spezialkarten
  zu Spieler. Siehe Section 2.4.1.
- **Permadeath:** ✅ ENTSCHIEDEN — Karriere-Length-System statt Permadeath. Siehe
  Section 3.6.
- **Match-Länge:** ✅ ENTSCHIEDEN — Time-Pressure-Counter (variabel, organisch).
  Siehe Section 2.6 Update.
- **2D vs 3D:** ✅ OFFEN GELASSEN — Entscheidung in Phase 3 (Godot-Port), nicht
  jetzt. Datenstrukturen sind render-agnostisch. Siehe Section 5.3.
- **Multiplayer Async-Daily:** ✅ EINGEPLANT — Post-Launch, Determinismus-Architektur
  von Anfang an mitgedacht. Siehe Section 9.

### Noch wirklich offene Fragen

- **Zwischen-Saison-Phase.** Transfermarkt? Trainings-Lager? Wie viel Hub-Time?
  *Pyre als Vorbild — kurz aber wichtig für Charakter-Bindung.* Tendenz: kurzer Hub
  zwischen Saisons (3-5 "Wochen" mit 1-2 Aktivitäten), nicht ausgewachsene
  Manager-Sim.
- **Wie viele Manager-Archetypen für Launch?** 3 minimum (StS-Modell), 5 ideal,
  7 könnte zu viel Balancing sein. Tendenz: 3 für Launch, 2 als Post-Launch-DLC.
- **Karten-Upgrade-System.** StS hat einfaches +1-Upgrade pro Karte. Wir könnten
  etwas Tiefes machen (Branch-Upgrades), aber das verdoppelt Balancing-Aufwand.
  Tendenz: einfaches Upgrade für Launch, Branches für Post-Launch.
- **Rivalität-Persistenz über Manager-Wechsel.** Wenn Run mit Manager A scheitert
  und mit Manager B startet, behalten Rivalen Erinnerung? Tendenz: nein, frischer
  Manager = frische Begegnungen. Aber Cross-Run-Achievements zählen weiter.

---

## 11. Nächste Schritte

1. ✅ **Briefing absegnen** (du jetzt). Punkte zur Diskussion: Liste von dir.
2. ⬜ **Prototyp-Step-1 starten:** neuer Ordner, Vanilla-JS, ~3 Wochen Scope.
3. ⬜ **Selbst-Test + 2-3 externe Tester** nach Woche 4.
4. ⬜ **Erfolgskriterien-Review:** weiter, refactoren, oder ab.
5. ⬜ **Asset-Extraktion aus Kicklike** wenn Step-1 trägt.
6. ⬜ **Phase 2:** Squad-Layer, XP, Traits einbauen.
7. ⬜ **Phase 3:** Run-Layer, Liga, Events, Manager.
8. ⬜ **Godot-Port** wenn Web-Version stabil.
9. ⬜ **Steam-Page** für Wishlist-Sammlung 6 Monate vor Release.
10. ⬜ **Beta-Release** auf itch.io vor Steam.

---

## Anhang A — Datenstruktur-Skizzen

### Karte (KL2-Format, Godot-portabel)
```json
{
  "id": "through_ball",
  "name": "Through Ball",
  "type": "skill",
  "cost": 2,
  "rarity": "uncommon",
  "tags": ["pass", "vertical"],
  "needs": ["flow"],
  "successFormula": {
    "base": 0.55,
    "modifiers": [
      { "stat": "vision", "owner": "playmaker", "scale": 0.005 },
      { "zoneDistance": "vertical", "amount": -0.1 }
    ]
  },
  "onSuccess": [
    { "type": "ballMove", "to": "twoZonesForward" },
    { "type": "tag", "name": "flow", "value": 1 }
  ],
  "onFail": [
    { "type": "turnover", "ballAt": "interceptZone" },
    { "type": "trigger", "name": "counterAttack", "owner": "opponent" }
  ]
}
```

### Spieler (KL2-Format)
```json
{
  "id": "p_uuid",
  "name": "Rico Marsh",
  "role": "PM",
  "archetype": "pm_regista",
  "stage": 1,
  "evoPath": ["pm_regista", "metronome"],
  "stats": { "offense": 50, "defense": 40, "tempo": 50, "vision": 88, "composure": 70 },
  "level": 7,
  "xp": 3,
  "xpToNext": 9,
  "traits": ["metronome_tempo"],
  "condition": 84,
  "form": 1
}
```

### Match-State (FSM)
```
states:
  idleAtKickoff
  preDriveCoachMoment       (only at kickoff/halftime/finalPhase)
  drivePlanning             (player draws hand, sees opp telegraph)
  driveExecution            (player plays cards in sequence)
  reactionPhase             (when opp drives, player places reactions)
  oppDriveExecution
  turnover
  goalScored
  driveComplete
  halftimeBreak
  matchEnd
```

---

## Anhang B — Glossar

- **Drive** — eine Possession-Sequenz, dauert 1-N Karten-Plays bis Tor/Turnover/Energy-out
- **Reaction-Slot** — Defensiv-Karte vorab, triggert auf Gegner-Aktion
- **Coach-Moment** — Match-Pause mit Tactic-Choice (3 pro Match)
- **Tactical Philosophy** — Run-weite Karten-Modifier (Tiki-Taka, Catenaccio, ...)
- **Telegraph** — vorab gezeigte Gegner-Drive-Stages
- **Stage** — Evolution-Level eines Spielers (0/1/2)
- **Tier** — Liga-Stufe im Run (Amateur/Profi/Elite)
- **Boon** — Permanent-Buff aus Cup-Sieg oder Event
