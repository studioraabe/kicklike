# KICKLIKE — Technisches Briefing: Match Decisions v3
**Version:** 3.0 — erweitert um Synergiebrücken, Situative Ereignisse, starke Impacts
**Ziel:** 7 situationsbezogene Eingriffe pro Match, die sich spürbar auf Spielstand und Spielverlauf auswirken. Entscheidungen sind mit dem bestehenden Taktik- und Trait-System verknüpft. Jeder Run fühlt sich durch situative Ereignisse anders an.

---

## Designprinzip: Starker Impact

Jede Entscheidung muss eine **sofort spürbare Konsequenz** haben — sichtbar im Match-Log, messbar im Spielstand. Kein "+3 auf alle Stats". Stattdessen:

- **Positiv:** Tor, Konter, Ballgewinn, sofortige Stat-Spitze für eine Runde
- **Negativ:** Gegentor, Gegner kommt durch, Spieler verliert Form, Lücke entsteht
- **Neutral/Sicher:** immer schwächer als die riskanten Optionen — sichere Wahl kostet Upside

**Faustregel für Zahlenwerte:**
- Kleine Entscheidungen: ±12–18 auf einen Stat für 1 Runde
- Mittlere Entscheidungen: ±20–28 auf einen Stat für 1–2 Runden, oder sofortige Szene
- Große Entscheidungen (Finale, Gamble): ±30–40, oder direkte Tor-/Gegentor-Chance

---

## Synergiebrücken: Neue Entscheidungen kennen bestehende Buffs

### Prinzip
Wenn eine neue Entscheidung auf eine bestehende Taktik trifft, addiert oder subtrahiert sich der Effekt. Das passiert über einen zentralen `computeDecisionImpact(match, decisionId)` Helper der **vor** `apply()` ausgeführt wird und Kontext liefert.

### Neue Funktion in `core.js`: `computeDecisionImpact()`

```js
function computeDecisionImpact(match, decisionId) {
  // Gibt einen Multiplikator zurück der den Effekt einer Entscheidung
  // basierend auf aktiven Taktiken und Squad-Zustand skaliert.
  // Wert > 1.0 = Synergie (Entscheidung passt zum bestehenden System)
  // Wert < 1.0 = Konflikt (Entscheidung arbeitet gegen bestehendes System)
  // Wert = 1.0 = neutral

  const activeTags = match.activeTacticTags || [];
  const squad = match.squad || [];
  const lf = squad.find(p => p.role === 'LF');
  const pm = squad.find(p => p.role === 'PM');
  const mf = match._tacticMisfit;

  let mult = 1.0;
  let synergyLog = null;   // optionaler Log-Eintrag wenn Synergie feuert
  let conflictLog = null;  // optionaler Log-Eintrag wenn Konflikt feuert

  // ── Pressing-Entscheidungen ────────────────────────────────────────────
  if (['press_now', 'gamble_press', 'r5_press_now'].includes(decisionId)) {
    // Kickoff-Pressing aktiv → Pressing-Entscheidung verstärkt
    if (activeTags.includes('pressing')) {
      mult *= 1.35;
      synergyLog = 'ui.log.synergyPressStack';
    }
    // Kickoff war Possession → Pressing-Entscheidung geschwächt (andere Grundordnung)
    if (activeTags.includes('ballbesitz')) {
      mult *= 0.70;
      conflictLog = 'ui.log.conflictPressVsPossession';
    }
    // Misfit-Pressing aus Kickoff → zweites Pressing ist fast sinnlos
    if (mf?.effects?.pressingCollapseRound) {
      mult *= 0.50;
      conflictLog = 'ui.log.conflictPressingAlreadyFailed';
    }
    // LF hat hohes Tempo → Pressing ist athletisch möglich
    if (lf && lf.stats.tempo >= 68) mult *= 1.15;
  }

  // ── Konter-Entscheidungen ──────────────────────────────────────────────
  if (['set_trap', 'false_press', 'r5_false_press'].includes(decisionId)) {
    if (activeTags.includes('konter')) {
      mult *= 1.40;
      synergyLog = 'ui.log.synergyCounterStack';
    }
    if (activeTags.includes('aggressiv')) {
      mult *= 0.75;
      conflictLog = 'ui.log.conflictCounterVsAggressive';
    }
    if (lf && lf.stats.tempo >= 65) mult *= 1.20;
  }

  // ── Offensive Entscheidungen ───────────────────────────────────────────
  if (['chase_game', 'push_advantage', 'seek_opening'].includes(decisionId)) {
    if (activeTags.includes('aggressiv')) {
      mult *= 1.30;
      synergyLog = 'ui.log.synergyAttackStack';
    }
    if (activeTags.includes('defensiv')) {
      mult *= 0.65;
      conflictLog = 'ui.log.conflictAttackVsDefensive';
    }
  }

  // ── Fokus-Entscheidungen ───────────────────────────────────────────────
  if (decisionId?.startsWith('focus_')) {
    // Wenn Spieler in guter Form: Fokus ist stärker
    const focusPlayer = squad.find(p => 'focus_' + p.id === decisionId);
    if (focusPlayer && (focusPlayer.form || 0) >= 2) {
      mult *= 1.30;
      synergyLog = 'ui.log.synergyFocusHotStreak';
    }
    if (focusPlayer && (focusPlayer.form || 0) <= -2) {
      mult *= 0.55;
      conflictLog = 'ui.log.conflictFocusCrisis';
    }
    // PM-Fokus + Ballbesitz-Taktik → sehr stark
    if (focusPlayer?.role === 'PM' && activeTags.includes('ballbesitz')) {
      mult *= 1.25;
      synergyLog = 'ui.log.synergyPMPossession';
    }
  }

  // ── Einwechslung ───────────────────────────────────────────────────────
  if (decisionId?.startsWith('sub_')) {
    // Legendary-Spieler kommt rein → immer stärker
    const subInId = decisionId.replace('sub_', '');
    const incoming = (typeof state !== 'undefined' ? state.roster : [])
      .find(p => p.id === subInId);
    if (incoming?.isLegendary) {
      mult *= 1.50;
      synergyLog = 'ui.log.synergyLegendarySub';
    }
  }

  return { mult: clamp(mult, 0.30, 2.00), synergyLog, conflictLog };
}
window.computeDecisionImpact = computeDecisionImpact;
```

### Integration in `applyDecision()`

```js
function applyDecision(match, decision) {
  if (!decision || !decision.apply) return;
  // Impact-Multiplikator berechnen
  const impact = computeDecisionImpact(match, decision.id);
  // Auf match übertragen damit apply() ihn nutzen kann
  match._currentDecisionMult = impact.mult;
  match._currentDecisionSynergyLog = impact.synergyLog;
  match._currentDecisionConflictLog = impact.conflictLog;
  // Entscheidung ausführen
  decision.apply(match, typeof state !== 'undefined' ? state : null);
  // Buff-Werte skalieren (alle _r*buff Felder)
  scaleMatchBuffs(match, impact.mult);
}

// Skaliert alle seit applyDecision() neu gesetzten _r*buff Felder
function scaleMatchBuffs(match, mult) {
  if (mult === 1.0) return;
  for (const key of ['_r2buff', '_r3buff', '_r5buff']) {
    if (!match[key]) continue;
    for (const stat of Object.keys(match[key])) {
      match[key][stat] = Math.round(match[key][stat] * mult);
    }
  }
}
```

### Synergielogs nach Entscheidung ausgeben

In `core.js`, direkt nach `applyDecision()`:

```js
applyDecision(match, decision);
if (match._currentDecisionSynergyLog) {
  await log(onEvent, 'trigger', I18N.t(match._currentDecisionSynergyLog));
}
if (match._currentDecisionConflictLog) {
  await log(onEvent, 'trigger', I18N.t(match._currentDecisionConflictLog));
}
match._currentDecisionMult = null;
match._currentDecisionSynergyLog = null;
match._currentDecisionConflictLog = null;
```

---

## 7 Entscheidungspunkte: Vollständige Spezifikation mit starkem Impact

### Entscheidung 1 — Kickoff (bestehend, Impact verstärkt)
**Phase:** `kickoff` | **Zeitpunkt:** Vor Runde 1

Alle Kickoff-Buffs werden auf die neuen Impact-Werte angehoben:

| Taktik | Neu (war) | Downside |
|---|---|---|
| Aggressive Start | +22 OFF, Runden 1-3 | -12 DEF (war -8) |
| Defensive Start | +22 DEF, Runden 1-3 | -12 OFF (war -8) |
| Balanced | +10 alle Stats, Runde 1-3 | kein Upside-Spike |
| Tempo Game | +28 TMP, -8 CMP | Bei Misfit: Lücken sofort spürbar |
| Pressing | +18 DEF, +14 TMP | Misfit → Kollaps ab R3, schwere Konter |
| Possession | +22 VIS, +12 CMP | Turnover = sofortiger Gegner-Konter |
| Counter Trap | +26 DEF, +14 TMP, -8 OFF | Kein LF-Speed → halbe Konter-Chance |
| Wing Play | +18 TMP, +18 OFF | Ironwall-Gegner → blocked completely R1-2 |

**Änderung in `applyTactic()`:** Alle `kickoff`-Werte auf obige Zahlen erhöhen.

---

### Entscheidung 2 — Spielstand-Reaktion (neu, starker Impact)
**Phase:** `round2_reaction` | **Zeitpunkt:** Nach Runde 2

Drei Pools (leading/trailing/level), je 3 Optionen. **Effekte gelten für Runde 3 + tragen in Runde 4 nach** (range [3,4] im buffLayer).

#### Pool: Führung

```js
leading: [
  {
    id: 'protect_lead',
    name: 'Eingraben',
    desc: '+24 Defense für Runden 3-4. Solide — aber du gewinnst kaum noch.',
    tags: ['defensiv'],
    apply: (match) => {
      const mult = match._currentDecisionMult || 1.0;
      match._r2buff = { defense: Math.round(24 * mult), offense: -10 };
      // Gegner bekommt in R3 nur noch 1 Angriff statt potenziell 2
      match._r2capOppAttacks = 1;
    }
  },
  {
    id: 'push_advantage',
    name: 'Nachlegen',
    desc: '+28 Offense für Runde 3. Defense offen — aber ein zweites Tor schließt das Spiel.',
    tags: ['aggressiv'],
    apply: (match) => {
      const mult = match._currentDecisionMult || 1.0;
      match._r2buff = { offense: Math.round(28 * mult), defense: -14 };
    }
  },
  {
    id: 'control_tempo',
    name: 'Tempo kontrollieren',
    desc: 'Ball halten — +16 Composure, +12 Vision für Runden 3-4. Gegner frustriert.',
    tags: ['kontrolle', 'ballbesitz'],
    apply: (match) => {
      const mult = match._currentDecisionMult || 1.0;
      match._r2buff = {
        composure: Math.round(16 * mult),
        vision:    Math.round(12 * mult)
      };
      match._r2slowOpp = true; // Gegner-Aufbau -15% für R3-4
    }
  }
]
```

#### Pool: Rückstand

```js
trailing: [
  {
    id: 'chase_game',
    name: 'Aufholjagd',
    desc: '+32 Offense für Runde 3, -18 Defense. Triffst du nicht, brennt das Spiel.',
    tags: ['aggressiv'],
    apply: (match) => {
      const mult = match._currentDecisionMult || 1.0;
      match._r2buff = {
        offense: Math.round(32 * mult),
        defense: Math.round(-18 * mult)
      };
    }
  },
  {
    id: 'regroup',
    name: 'Neu ordnen',
    desc: 'Reset — +18 Defense, +14 Composure für Runden 3-4. Dann Halbzeit entscheidet.',
    tags: ['defensiv'],
    apply: (match) => {
      const mult = match._currentDecisionMult || 1.0;
      match._r2buff = {
        defense:   Math.round(18 * mult),
        composure: Math.round(14 * mult)
      };
    }
  },
  {
    id: 'gamble_press',
    name: 'Pressing-Gamble',
    desc: 'Sofort pressen — 42% Ballgewinn + garantierter Konter. 58%: Gegner kommt durch und schießt.',
    tags: ['pressing', 'aggressiv'],
    apply: (match) => { match._r2pressGamble = true; }
    // Auswertung: sofortige Szene, kein Buff-Layer
  }
]
```

#### Pool: Unentschieden

```js
level: [
  {
    id: 'stay_patient',
    name: 'Geduldig bleiben',
    desc: '+14 auf alle Stats für Runden 3-4. Kein Risiko, kein Spike.',
    tags: ['kontrolle'],
    apply: (match) => {
      const mult = match._currentDecisionMult || 1.0;
      const b = Math.round(14 * mult);
      match._r2buff = { offense: b, defense: b, tempo: b, vision: b, composure: b };
    }
  },
  {
    id: 'seek_opening',
    name: 'Lücke suchen',
    desc: '+26 Vision, +14 Tempo für Runde 3. Aufbau-Erfolg deutlich erhöht — Fehler teuer.',
    tags: ['vision', 'technik'],
    apply: (match) => {
      const mult = match._currentDecisionMult || 1.0;
      match._r2buff = {
        vision: Math.round(26 * mult),
        tempo:  Math.round(14 * mult),
        defense: -10  // immer, kein Mult — du gehst volles Risiko
      };
    }
  },
  {
    id: 'set_trap',
    name: 'Falle stellen',
    desc: '+20 Tempo für Runde 3. Nächster Gegner-Fehlangriff triggert sofortigen Konter mit +30% Bonus.',
    tags: ['konter'],
    apply: (match) => {
      const mult = match._currentDecisionMult || 1.0;
      match._r2buff = { tempo: Math.round(20 * mult) };
      match._r2counterTrap = true;
      // Verknüpfung mit autoCounterRoundsLeft:
      match.autoCounterRoundsLeft = Math.max(match.autoCounterRoundsLeft, 2);
      match.nextBuildupBonus = (match.nextBuildupBonus || 0) + 0.30 * mult;
    }
  }
]
```

#### Auswertung `_r2pressGamble` in `core.js` (nach Runde 2):

```js
if (match._r2pressGamble) {
  match._r2pressGamble = false;
  const squad = match.squad;
  const avgTempo = squad.reduce((s, p) => s + p.stats.tempo, 0) / squad.length;
  // Basis 42%, +1% pro Tempo-Punkt über Gegner-Vision, max 65%
  const successChance = clamp(0.42 + (avgTempo - match.opp.stats.vision) * 0.008, 0.20, 0.65);
  // Synergie-Mult bereits in chance eingebaut via computeDecisionImpact
  if (rand() < successChance) {
    await log(onEvent, 'trigger', I18N.t('ui.log.r2GambleSuccess'));
    match.counterPending = true;
    match.nextBuildupBonus = (match.nextBuildupBonus || 0) + 0.35;
  } else {
    await log(onEvent, 'trigger', I18N.t('ui.log.r2GambleFail'));
    // Sofort ein voller Gegenangriff
    await attemptOppAttack(match, squad, onEvent);
    // Noch ein zweiter wenn der Gegner hoch tempo hat
    if (match.opp.stats.tempo > 70 && rand() < 0.45) {
      await log(onEvent, 'trigger', I18N.t('ui.log.r2GambleExposed'));
      await attemptOppAttack(match, squad, onEvent);
    }
  }
}
```

---

### Entscheidung 3 — Spieler-Fokus (neu, dynamisch)
**Phase:** `round3_focus` | **Zeitpunkt:** Nach Runde 3

Dynamisch generiert aus Squad. Effekt gilt für **Runde 4 genau** (range [4,4]).

#### `generateFocusOptions()` in `core.js`:

```js
function generateFocusOptions(squad, match) {
  const options = squad.map(p => {
    const role = DATA.roles.find(r => r.id === p.role);
    const focusStat = role?.focusStat || 'offense';
    const statLabel = I18N.t('stats.' + focusStat);
    const form = p.form || 0;
    const isHot    = form >= 2;
    const isCrisis = form <= -2;
    // Basis-Boost: 22, skaliert mit Form
    const boost = isHot ? 30 : isCrisis ? 12 : 22;
    // Risiko: Spieler in Krise kann unter Fokus komplett einbrechen
    const failChance = isCrisis ? 0.40 : (form <= -1 ? 0.25 : 0.10);

    return {
      id: 'focus_' + p.id,
      name: p.name,
      role: p.role,
      desc: I18N.t('ui.decisions.focusDesc', {
        role:  role?.label || p.role,
        stat:  statLabel,
        boost,
        risk:  isCrisis
                 ? I18N.t('ui.decisions.focusRiskCrisis')
                 : (form <= -1
                     ? I18N.t('ui.decisions.focusRiskHigh')
                     : I18N.t('ui.decisions.focusRiskLow'))
      }),
      playerId: p.id,
      focusStat,
      boost,
      failChance,
      isHot,
      apply: (match) => {
        const mult = match._currentDecisionMult || 1.0;
        match._focusPlayerId  = p.id;
        match._focusBoost     = Math.round(boost * mult);
        match._focusRound     = 4;
        match._focusFailChance = failChance;
        match._focusStat      = focusStat;
      }
    };
  });

  options.push({
    id: 'no_focus',
    name: I18N.t('ui.decisions.noFocus'),
    desc: I18N.t('ui.decisions.noFocusDesc'),
    apply: () => {}
  });
  return options;
}
window.generateFocusOptions = generateFocusOptions;
```

#### In `computePlayerStats()` — Fokus-Bonus + Fail-Risk:

```js
if (match._focusPlayerId && match._focusRound === match.round
    && player.id === match._focusPlayerId) {
  const focusStat = match._focusStat
    || DATA.roles.find(r => r.id === player.role)?.focusStat
    || 'offense';

  if (rand() < (match._focusFailChance || 0.10)) {
    // Fokus-Fail: Spieler bricht ein, gibt einen Penalty für die ganze Runde
    player._focusFailed = true;
    stats[focusStat] = Math.max(20, stats[focusStat] - 15);
    // Wird nach Runde 4 geloggt (match._focusFailLog)
    match._focusFailLog = I18N.t('ui.log.focusFail', { name: player.name });
    // Formverlust
    player.form = clamp((player.form || 0) - 1, -3, 3);
  } else {
    stats[focusStat] = clamp(stats[focusStat] + (match._focusBoost || 22), 20, 99);
  }
}
```

---

### Entscheidung 4 — Halbzeit (bestehend, Impact verstärkt)
**Phase:** `halftime` | **Zeitpunkt:** Nach Runde 3 / Vor Runde 4

Alle Halftime-Buffs auf starke Werte anheben (analog Kickoff):

| Taktik | Neu (war) | Downside |
|---|---|---|
| Risk Push | +28 OFF, skaliert mit Rückstand | -14 DEF |
| Stabilize | +24 DEF, skaliert mit Führung | -8 OFF |
| Reassign | +26 auf Fokus-Stat eines Spielers | dauerhaft, kein Rückgängig |
| Rally | +8 OFF/konzediertes Tor, +8 DEF/eigenes Tor | wirkt erst wenn Tore fallen |
| Reset | +16 alle Stats | nur 1 Runde (war 3) — kurzer Schub |
| Lean Into Counters | +30 TMP, +18 DEF | Aufbau-Rate sinkt leicht |
| High Press | +28 DEF, -8 CMP | R5-R6 Pressing-Collapse bei Misfit |
| Open the Game | +28 VIS, +14 OFF | Ballverlust = Gegner-Konter sofort |

---

### Entscheidung 5 — Pressing-Moment (neu, sofortige Szene)
**Phase:** `round5_press` | **Zeitpunkt:** Nach Runde 4

Drei Optionen. Pressing und Scheinpressing werten **sofort** eine Szene aus — nicht erst in der nächsten Runde.

```js
round5_press: [
  {
    id: 'r5_press_now',
    name: 'Jetzt pressen',
    desc: 'Sofortiger Angriff auf den Aufbau. Erfolg: Ballgewinn + starker Konter. Misserfolg: Gegner bricht durch — Gegentor wahrscheinlich.',
    tags: ['pressing', 'aggressiv'],
    apply: (match) => { match._r5pressAttempt = true; }
  },
  {
    id: 'r5_hold_shape',
    name: 'Linie halten',
    desc: '+20 Defense für Runde 5. Sicher — du verzichtest aber auf Initiative.',
    tags: ['defensiv'],
    apply: (match) => {
      const mult = match._currentDecisionMult || 1.0;
      match._r5buff = { defense: Math.round(20 * mult) };
    }
  },
  {
    id: 'r5_false_press',
    name: 'Scheinpressing',
    desc: 'Täuschungsmanöver — 40% der Gegner läuft in die Falle und verliert den Ball. Wenn erkannt: nichts.',
    tags: ['konter', 'technik'],
    apply: (match) => { match._r5falsePressAttempt = true; }
  }
]
```

#### Auswertung in `core.js` (direkt nach Runde 4, nach Halbzeit-Block):

```js
// Buff für hold_shape eintragen
if (match._r5buff) {
  match.buffLayers.push({
    source: 'round5@press', range: [5, 5], stats: match._r5buff
  });
  recomputeTeamBuffs(match);
  match._r5buff = null;
}

// Sofortszene: Pressing-Gamble
if (match._r5pressAttempt || match._r5falsePressAttempt) {
  const isFalse = !!match._r5falsePressAttempt;
  match._r5pressAttempt = false;
  match._r5falsePressAttempt = false;

  const successChance = computePressSuccessChance(match.squad, match, isFalse);

  if (rand() < successChance) {
    await log(onEvent, 'trigger', I18N.t('ui.log.r5PressSuccess'));
    // Sofort ein Angriff mit starkem Bonus
    match.counterPending = false; // kein doppelter Konter
    await attemptAttack(match, match.squad, onEvent, { bonusAttack: 0.40 });
    // Momentum für R5
    match.nextBuildupBonus = (match.nextBuildupBonus || 0) + 0.25;
  } else {
    await log(onEvent, 'trigger', I18N.t('ui.log.r5PressFail'));
    // Gegner kommt sofort durch — gefährliche Position
    await attemptOppAttack(match, match.squad, onEvent);
    // Bei False-Press der scheitert: gar kein Bonus, Gegner hat Momentum
    if (isFalse) {
      match.opp._pressBeaten = true; // Gegner-Aufbau +20% in R5
    }
  }
}
```

#### `computePressSuccessChance()` in `core.js`:

```js
function computePressSuccessChance(squad, match, isFalse) {
  const avgTempo  = squad.reduce((s, p) => s + p.stats.tempo, 0) / squad.length;
  const oppVision = match.opp.stats.vision;
  const base      = isFalse ? 0.40 : 0.38;
  // Synergien aus bestehendem System einrechnen:
  let chance = base + (avgTempo - oppVision) * 0.009;
  // Kickoff-Pressing aktiv → Pressing bleibt geübter
  if ((match.activeTacticTags || []).includes('pressing')) chance += 0.12;
  // Fatigue aus aggressiver Kickoff-Taktik → Beine schwer
  if (match._fatigue > 0.10) chance -= match._fatigue * 0.8;
  // Misfit-Pressing bereits kollabiert → sinnlos
  if (match._pressingCollapsedLogged) chance *= 0.40;
  return clamp(chance, 0.12, 0.72);
}
window.computePressSuccessChance = computePressSuccessChance;
```

---

### Entscheidung 6 — Einwechslung (neu, nur mit Bank)
**Phase:** `round6_sub` | **Zeitpunkt:** Nach Runde 5

Nur wenn `getBench().length > 0`. Einwechslung mutiert den Squad-Array sofort.

#### `generateSubOptions()` in `core.js`:

```js
function generateSubOptions(squad, bench, match) {
  // Kandidaten zum Rausnehmen: schlechteste Form zuerst
  const outCandidates = squad.slice().sort((a, b) => (a.form || 0) - (b.form || 0));

  const options = bench.map(incoming => {
    const target = outCandidates[0];
    const inRole  = DATA.roles.find(r => r.id === incoming.role)?.label || incoming.role;
    const outRole = DATA.roles.find(r => r.id === target.role)?.label || target.role;

    // Rollenmatch? Legendary? Bestimmt den Impact-Text
    const roleMatch  = incoming.role === target.role;
    const isLeg      = incoming.isLegendary;
    const formGain   = (incoming.form || 0) - (target.form || 0);

    let impactNote;
    if (isLeg && roleMatch)  impactNote = I18N.t('ui.decisions.subImpactLegendaryMatch');
    else if (isLeg)          impactNote = I18N.t('ui.decisions.subImpactLegendary');
    else if (!roleMatch)     impactNote = I18N.t('ui.decisions.subImpactRoleMismatch');
    else if (formGain >= 2)  impactNote = I18N.t('ui.decisions.subImpactFormBoost');
    else                     impactNote = I18N.t('ui.decisions.subImpactNeutral');

    return {
      id: 'sub_' + incoming.id,
      name: I18N.t('ui.decisions.subName', { inName: incoming.name, inRole }),
      desc: I18N.t('ui.decisions.subDesc', {
        inName: incoming.name, outName: target.name, impact: impactNote
      }),
      subIn:      incoming.id,
      subOut:     target.id,
      subInName:  incoming.name,
      subOutName: target.name,
      roleMatch,
      apply: (match, state) => {
        // lineupIds tauschen
        if (state) {
          const idx = state.lineupIds.indexOf(target.id);
          if (idx >= 0) state.lineupIds[idx] = incoming.id;
        }
        // squad-Array in-place für Rest des Matches mutieren
        const sqIdx = match.squad.findIndex(p => p.id === target.id);
        if (sqIdx >= 0) match.squad[sqIdx] = incoming;

        // Legendary-Sub: sofortiger Trait-Trigger-Check
        if (incoming.isLegendary) {
          match._legSubJustEntered = incoming.id;
        }
        // Rolle passt nicht: -8 DEF für R6 (Umstellungskosten)
        if (!roleMatch) {
          match.buffLayers.push({
            source: 'sub@mismatch', range: [6, 6], stats: { defense: -8 }
          });
          recomputeTeamBuffs(match);
        }
      }
    };
  });

  options.push({
    id: 'no_sub',
    name: I18N.t('ui.decisions.noSub'),
    desc: I18N.t('ui.decisions.noSubDesc'),
    apply: () => {}
  });
  return options;
}
window.generateSubOptions = generateSubOptions;
```

---

### Entscheidung 7 — Finale (bestehend, Impact verstärkt)
**Phase:** `final` | **Zeitpunkt:** Vor Runde 6

Alle Final-Buffs werden auf maximalen Impact gebracht:

| Taktik | Neu (war) | Mechanik |
|---|---|---|
| All In | +20 OFF + 8/Rückstandstor (war +15) | -20 DEF (war -15) |
| Park the Bus | +22 DEF + 8/Führungstor (war +15) | -14 OFF (war -10) |
| Hero Ball | +38 auf Fokus-Stat (war +30) | dauerhafter Verlust wenn Spieler in Krise |
| Stay Cool | +26 CMP, +16 VIS (war +20/+12) | kein Downside — aber kein Spike |
| Final Press | +30 TMP, +24 DEF, -14 OFF | 50% Konter-Chance (war 35%) |
| Long Balls | +36 OFF, -14 VIS (war +28/-10) | Aufbau-Rate sinkt um 20% |
| Midfield Control | +26 VIS, +22 TMP, +18 CMP | kein Downside — aber kein Spike |
| Ambush | +36 DEF, +24 TMP, -18 OFF | nur sinnvoll bei Führung |
| Sacrifice | -15 Fokus-Stat dauerhaft | +44 OFF für R6 (war +35) |

---

## Situative Ereignisse: Unerwartete Entscheidungen

### Konzept
Pro Match tauchen **0–2 situative Ereignisse** auf. Sie erscheinen als eigener Interrupt-Typ (`type: 'interrupt', phase: 'event'`) zwischen Runden und sind konditionsabhängig — kein Ereignis feuert zweimal pro Run.

### Neue Datenstruktur in `decisions.js`

```js
const SITUATIVE_EVENTS = [
  // ── Heiße Serie ───────────────────────────────────────────────────────
  {
    id: 'hot_player',
    // Bedingung: Ein Spieler hat ≥3 Tore in diesem Run UND gute Form
    trigger: (match, state) => {
      const hot = match.squad.find(p =>
        (p.goals || 0) + ((p._matchStats?.goals) || 0) >= 1
        && (p.form || 0) >= 2
      );
      return hot ? { player: hot } : null;
    },
    // Zeitpunkt: nach Runde 2 oder 3 (zufällig, aber nur einmal)
    window: [2, 3],
    options: (ctx) => [
      {
        id: 'hot_free_role',
        name: I18N.t('ui.events.hotFreeRole', { name: ctx.player.name }),
        desc: I18N.t('ui.events.hotFreeRoleDesc'),
        apply: (match) => {
          const p = match.squad.find(x => x.id === ctx.player.id);
          if (!p) return;
          const focusStat = DATA.roles.find(r => r.id === p.role)?.focusStat || 'offense';
          p.stats[focusStat] = clamp(p.stats[focusStat] + 20, 20, 99);
          match.buffLayers.push({
            source: 'event@hotFree', range: [match.round + 1, 6],
            stats: { offense: 10, tempo: 8 }
          });
          recomputeTeamBuffs(match);
        }
      },
      {
        id: 'hot_contain',
        name: I18N.t('ui.events.hotContain', { name: ctx.player.name }),
        desc: I18N.t('ui.events.hotContainDesc'),
        apply: (match) => {
          // Vorsichtig — kein Risiko, aber kein Upside
          match.buffLayers.push({
            source: 'event@hotContain', range: [match.round + 1, 6],
            stats: { defense: 12, composure: 8 }
          });
          recomputeTeamBuffs(match);
        }
      }
    ]
  },

  // ── Krise nach 2 Gegentreffern ────────────────────────────────────────
  {
    id: 'crisis_moment',
    trigger: (match) => match.scoreOpp >= 2 && match.scoreMe <= match.scoreOpp - 1,
    window: [3, 4],
    options: () => [
      {
        id: 'crisis_team_talk',
        name: I18N.t('ui.events.crisisTeamTalk'),
        desc: I18N.t('ui.events.crisisTeamTalkDesc'),
        apply: (match) => {
          // +20 CMP + +16 OFF für nächste 2 Runden
          // Aber: 30% Chance dass es nicht wirkt (Spieler zu frustriert)
          if (rand() < 0.70) {
            match.buffLayers.push({
              source: 'event@teamTalk',
              range: [match.round + 1, match.round + 2],
              stats: { composure: 20, offense: 16 }
            });
            recomputeTeamBuffs(match);
          } else {
            // Wirkt nicht — Log-Eintrag
            match._teamTalkFailed = true;
          }
        }
      },
      {
        id: 'crisis_individual',
        name: I18N.t('ui.events.crisisIndividual'),
        desc: I18N.t('ui.events.crisisIndividualDesc'),
        apply: (match) => {
          // Stürmer bekommt +28 OFF für die nächste Runde — alles auf eine Karte
          const st = match.squad.find(p => p.role === 'ST');
          if (st) {
            match._focusPlayerId = st.id;
            match._focusBoost    = 28;
            match._focusRound    = match.round + 1;
            match._focusStat     = 'offense';
            match._focusFailChance = 0.20;
          }
        }
      },
      {
        id: 'crisis_accept',
        name: I18N.t('ui.events.crisisAccept'),
        desc: I18N.t('ui.events.crisisAcceptDesc'),
        apply: (match) => {
          // Nichts tun — aber alle Spieler-Form stabilisiert sich (+1 Form Recovery)
          for (const p of match.squad) {
            if ((p.form || 0) < 0) p.form = clamp((p.form || 0) + 1, -3, 3);
          }
        }
      }
    ]
  },

  // ── Gegner macht Fehler: Momentum-Gelegenheit ─────────────────────────
  {
    id: 'opp_mistake',
    trigger: (match) =>
      match.stats.oppBuildupsSuccess < match.stats.oppBuildups * 0.35
      && match.round >= 2,
    window: [2, 4],
    options: () => [
      {
        id: 'exploit_mistake',
        name: I18N.t('ui.events.exploitMistake'),
        desc: I18N.t('ui.events.exploitMistakeDesc'),
        apply: (match) => {
          // Sofortangriff mit +35% Bonus
          match._eventImmediateAttack = { bonusAttack: 0.35 };
        }
      },
      {
        id: 'maintain_pressure',
        name: I18N.t('ui.events.maintainPressure'),
        desc: I18N.t('ui.events.maintainPressureDesc'),
        apply: (match) => {
          // Sustained pressure: Gegner-Aufbau-Erfolg -20% für nächste 2 Runden
          match._oppBuildupPenalty = 0.20;
          match._oppBuildupPenaltyRounds = 2;
        }
      }
    ]
  },

  // ── Legendary-Spieler verlangt Einsatz (nur wenn auf Bank) ───────────
  {
    id: 'legendary_demand',
    trigger: (match, state) => {
      if (!state) return null;
      const bench = state.roster.filter(p =>
        !state.lineupIds.includes(p.id) && p.isLegendary
      );
      return bench.length > 0 ? { legendary: bench[0] } : null;
    },
    window: [3, 4],
    options: (ctx) => [
      {
        id: 'leg_bring_on',
        name: I18N.t('ui.events.legBringOn', { name: ctx.legendary.name }),
        desc: I18N.t('ui.events.legBringOnDesc'),
        apply: (match, state) => {
          // Einwechslung: schlechtesten Spieler raus
          if (!state) return;
          const worst = match.squad.slice()
            .sort((a, b) => (a.form || 0) - (b.form || 0))[0];
          const idx = state.lineupIds.indexOf(worst.id);
          if (idx >= 0) state.lineupIds[idx] = ctx.legendary.id;
          const sqIdx = match.squad.findIndex(p => p.id === worst.id);
          if (sqIdx >= 0) match.squad[sqIdx] = ctx.legendary;
          match._legSubJustEntered = ctx.legendary.id;
        }
      },
      {
        id: 'leg_keep_bench',
        name: I18N.t('ui.events.legKeepBench', { name: ctx.legendary.name }),
        desc: I18N.t('ui.events.legKeepBenchDesc'),
        apply: (match) => {
          // Auf der Bank lassen — aber er gibt von dort Moral-Boost
          match.buffLayers.push({
            source: 'event@legBench',
            range: [match.round + 1, 6],
            stats: { composure: 10 }
          });
          recomputeTeamBuffs(match);
        }
      }
    ]
  },

  // ── Letzter Match der Saison, alles offen ─────────────────────────────
  {
    id: 'season_finale',
    trigger: (match, state) =>
      state && state.matchNumber === CONFIG.runLength - 1
      && Math.abs(state.seasonPoints - 36) <= 6, // Titel noch drin oder knapp weg
    window: [1, 2],
    options: () => [
      {
        id: 'finale_all_or_nothing',
        name: I18N.t('ui.events.finaleAllOrNothing'),
        desc: I18N.t('ui.events.finaleAllOrNothingDesc'),
        apply: (match) => {
          // +30 OFF, -20 DEF — für das gesamte Match
          match.buffLayers.push({
            source: 'event@finaleAoN', range: [1, 6],
            stats: { offense: 30, defense: -20 }
          });
          recomputeTeamBuffs(match);
        }
      },
      {
        id: 'finale_controlled',
        name: I18N.t('ui.events.finaleControlled'),
        desc: I18N.t('ui.events.finaleControlledDesc'),
        apply: (match) => {
          match.buffLayers.push({
            source: 'event@finaleCtrl', range: [1, 6],
            stats: { composure: 18, vision: 14, defense: 12 }
          });
          recomputeTeamBuffs(match);
        }
      }
    ]
  }
];

window.SITUATIVE_EVENTS = SITUATIVE_EVENTS;
```

### Event-Dispatcher in `core.js`

Wird **einmal pro Runde nach dem roundStart** geprüft. Maximal 2 Ereignisse pro Match. Jedes Event-ID wird im State markiert damit es nicht zweimal im Run feuert.

```js
async function checkSituativeEvents(match, onEvent) {
  if ((match._eventsThisMatch || 0) >= 2) return;
  if (!window.SITUATIVE_EVENTS) return;

  const firedThisRun = (typeof state !== 'undefined' && state._firedEvents) || new Set();

  for (const ev of SITUATIVE_EVENTS) {
    // Nicht zweimal pro Run
    if (firedThisRun.has(ev.id)) continue;
    // Nur im definierten Rundfenster
    if (!ev.window.includes(match.round)) continue;
    // Trigger-Bedingung
    const ctx = ev.trigger(match, typeof state !== 'undefined' ? state : null);
    if (!ctx) continue;
    // 65% Chance dass Ereignis wirklich erscheint (nicht jedes Match dasselbe)
    if (rand() > 0.65) continue;

    // Event auslösen
    match._eventsThisMatch = (match._eventsThisMatch || 0) + 1;
    firedThisRun.add(ev.id);
    if (typeof state !== 'undefined') state._firedEvents = firedThisRun;

    const options = ev.options(ctx || {});
    const decision = await onEvent({
      type: 'interrupt',
      phase: 'event',
      eventId: ev.id,
      match,
      options
    });
    applyDecision(match, decision);

    // Sofort-Angriff aus Event ausführen
    if (match._eventImmediateAttack) {
      const extra = match._eventImmediateAttack;
      match._eventImmediateAttack = null;
      await log(onEvent, 'trigger', I18N.t('ui.log.eventExploitAttack'));
      await attemptAttack(match, match.squad, onEvent, extra);
    }
    if (match._teamTalkFailed) {
      match._teamTalkFailed = false;
      await log(onEvent, 'trigger', I18N.t('ui.log.teamTalkFailed'));
    }

    break; // maximal 1 Event pro Runden-Check
  }
}
window.checkSituativeEvents = checkSituativeEvents;
```

### Integration in `startMatch()` (pro Runde, nach roundStart-Trigger):

```js
// Direkt nach: dispatchTrigger('roundStart', { match });
await checkSituativeEvents(match, onEvent);
```

### State-Reset in `freshState()` (in `config-data.js`):

```js
// In freshState():
_firedEvents: new Set()
```

---

## Hint-System: Erweitert für alle Phasen

### `buildContextHint()` — vollständige Version

```js
buildContextHint(match, phase) {
  const opp   = match.opp;
  const squad = match.squad || [];
  const hints = [];
  const lf    = squad.find(p => p.role === 'LF');
  const pm    = squad.find(p => p.role === 'PM');
  const vt    = squad.find(p => p.role === 'VT');

  // ── Kickoff ──────────────────────────────────────────────────────────
  if (phase === 'kickoff') {
    if (lf && lf.stats.tempo > opp.stats.tempo + 12)
      hints.push({ type: 'good', text: I18N.t('ui.hint.tempoAdvantage', { name: lf.name }) });
    if (pm && pm.stats.vision < 56)
      hints.push({ type: 'warn', text: I18N.t('ui.hint.lowVisionPossession') });
    if (opp.special?.id === 'pacey')
      hints.push({ type: 'warn', text: I18N.t('ui.hint.oppPacey') });
    if (opp.special?.id === 'defensive')
      hints.push({ type: 'info', text: I18N.t('ui.hint.oppDefensive') });
    if (opp.traits?.includes('ironwall'))
      hints.push({ type: 'warn', text: I18N.t('ui.hint.oppIronwall') });
    if (opp.isBoss)
      hints.push({ type: 'info', text: I18N.t('ui.hint.bossMatch') });
  }

  // ── Runde 2 Reaktion ─────────────────────────────────────────────────
  if (phase === 'round2_reaction') {
    if (match.scoreOpp > match.scoreMe + 1)
      hints.push({ type: 'warn', text: I18N.t('ui.hint.bigDeficit') });
    if (match._htPressingBlocks > 0)
      hints.push({ type: 'good', text: I18N.t('ui.hint.pressingWorking') });
    if (match._htCountersFired > 0)
      hints.push({ type: 'good', text: I18N.t('ui.hint.countersWorking') });
    if ((match.activeTacticTags || []).includes('aggressiv') && match.scoreOpp > match.scoreMe)
      hints.push({ type: 'warn', text: I18N.t('ui.hint.aggressiveExposed') });
  }

  // ── Runde 3 Fokus ────────────────────────────────────────────────────
  if (phase === 'round3_focus') {
    const hotPlayer = squad.find(p => (p.form || 0) >= 2);
    const crisisPlayer = squad.find(p => (p.form || 0) <= -2);
    if (hotPlayer)
      hints.push({ type: 'good', text: I18N.t('ui.hint.hotPlayerFocus', { name: hotPlayer.name }) });
    if (crisisPlayer)
      hints.push({ type: 'warn', text: I18N.t('ui.hint.crisisPlayerFocus', { name: crisisPlayer.name }) });
    if ((match.activeTacticTags || []).includes('ballbesitz') && pm)
      hints.push({ type: 'info', text: I18N.t('ui.hint.pmFocusPossession', { name: pm.name }) });
  }

  // ── Halbzeit ─────────────────────────────────────────────────────────
  if (phase === 'halftime') {
    const deficit = match.scoreOpp - match.scoreMe;
    const lead    = match.scoreMe - match.scoreOpp;
    if (deficit >= 2)
      hints.push({ type: 'warn', text: I18N.t('ui.hint.bigDeficitHT') });
    if (lead >= 2)
      hints.push({ type: 'good', text: I18N.t('ui.hint.bigLeadHT') });
    if (match.stats.myBuildupsSuccess / Math.max(1, match.stats.myBuildups) < 0.35)
      hints.push({ type: 'warn', text: I18N.t('ui.hint.poorBuildupHT') });
    if (match.stats.saves >= 3)
      hints.push({ type: 'info', text: I18N.t('ui.hint.keeperBusyHT') });
  }

  // ── Runde 5 Pressing ─────────────────────────────────────────────────
  if (phase === 'round5_press') {
    const avgTempo = squad.reduce((s, p) => s + p.stats.tempo, 0) / squad.length;
    if (match._pressingCollapsedLogged)
      hints.push({ type: 'warn', text: I18N.t('ui.hint.pressingAlreadyFailed') });
    else if (avgTempo > opp.stats.vision + 8)
      hints.push({ type: 'good', text: I18N.t('ui.hint.pressViable') });
    else if (avgTempo < opp.stats.vision - 5)
      hints.push({ type: 'warn', text: I18N.t('ui.hint.pressRisky') });
    if (opp.traits?.includes('konter_opp'))
      hints.push({ type: 'warn', text: I18N.t('ui.hint.oppCounterThreat') });
  }

  // ── Einwechslung ─────────────────────────────────────────────────────
  if (phase === 'round6_sub') {
    const worst = squad.slice().sort((a, b) => (a.form || 0) - (b.form || 0))[0];
    if (worst && (worst.form || 0) <= -2)
      hints.push({ type: 'warn', text: I18N.t('ui.hint.playerInCrisis', { name: worst.name }) });
    const bench = (typeof state !== 'undefined' ? state.roster : [])
      .filter(p => !(typeof state !== 'undefined' ? state.lineupIds : []).includes(p.id));
    const legOnBench = bench.find(p => p.isLegendary);
    if (legOnBench)
      hints.push({ type: 'good', text: I18N.t('ui.hint.legendaryOnBench', { name: legOnBench.name }) });
  }

  // ── Finale ───────────────────────────────────────────────────────────
  if (phase === 'final') {
    const deficit = match.scoreOpp - match.scoreMe;
    const lead    = match.scoreMe - match.scoreOpp;
    if (deficit > 0)
      hints.push({ type: 'warn', text: I18N.t('ui.hint.finalDeficit', { n: deficit }) });
    if (lead > 0)
      hints.push({ type: 'good', text: I18N.t('ui.hint.finalLead', { n: lead }) });
    if ((match.activeTacticTags || []).includes('konter'))
      hints.push({ type: 'info', text: I18N.t('ui.hint.finalCounterSynergy') });
  }

  // ── Situatives Ereignis ───────────────────────────────────────────────
  if (phase === 'event') {
    hints.push({ type: 'info', text: I18N.t('ui.hint.eventUnexpected') });
  }

  return hints.slice(0, 2); // max 2 Hints pro Modal
}
```

---

## Neue i18n-Keys (Ergänzung zu v2)

```js
// ui.flow
r2Title, r3Title, r3Subtitle, r5Title, r6Title, r6Subtitle  // wie v2
eventTitle: "Situation",
eventSubtitle: "Something unexpected — your call.",

// ui.decisions
focusDesc: "{role} — {stat} focus. +{boost} {stat} in round 4. Risk: {risk}.",
focusRiskCrisis: "very high (player in crisis)",
focusRiskHigh: "high (poor form)",
focusRiskLow: "low",
noFocus, noFocusDesc, subName, subDesc, noSub, noSubDesc  // wie v2
subImpactLegendaryMatch: "Legendary player, same role — maximum impact.",
subImpactLegendary:      "Legendary player — role mismatch, but quality wins.",
subImpactRoleMismatch:   "Role mismatch — -8 Defense in round 6.",
subImpactFormBoost:      "Fresh legs, much better form.",
subImpactNeutral:        "Stable swap.",

// ui.events
hotFreeRole: "Give {name} a free role",
hotFreeRoleDesc: "He's on fire — let him improvise. +20 focus stat permanently, +10 OFF/TMP for the rest of the match.",
hotContain: "Keep {name} disciplined",
hotContainDesc: "Don't risk it. +12 DEF, +8 CMP for the rest of the match.",
crisisTeamTalk: "Team talk",
crisisTeamTalkDesc: "Settle the squad — 70% chance: +20 CMP, +16 OFF for 2 rounds. 30%: doesn't land.",
crisisIndividual: "Single out the striker",
crisisIndividualDesc: "Put it all on him — +28 OFF for the next round. 20% chance it backfires.",
crisisAccept: "Accept it and reset",
crisisAcceptDesc: "No panic. All players in poor form recover 1 form point.",
exploitMistake: "Strike now",
exploitMistakeDesc: "They're shaky — immediate attack with +35% bonus.",
maintainPressure: "Keep the pressure on",
maintainPressureDesc: "Sustained press — their build-up success drops 20% for 2 rounds.",
legBringOn: "Bring on {name}",
legBringOnDesc: "Play him now — immediate squad boost. Worst-form player comes off.",
legKeepBench: "Keep {name} on the bench",
legKeepBenchDesc: "His presence lifts the team — +10 CMP for the rest of the match.",
finaleAllOrNothing: "All or nothing",
finaleAllOrNothingDesc: "+30 OFF, -20 DEF for the entire match. Win or burn.",
finaleControlled: "Stay controlled",
finaleControlledDesc: "+18 CMP, +14 VIS, +12 DEF for the match. Grind it out.",

// ui.hint (Ergänzungen zu v2)
oppDefensive: "They're parked — pace or vision needed to crack them.",
oppIronwall: "Ironwall trait: rounds 1-2 their defense is nearly impenetrable.",
aggressiveExposed: "Aggressive tactic left gaps — they've already scored.",
countersWorking: "Your counter system is working — lean into it.",
hotPlayerFocus: "{name} is in form — focusing on them is low risk, high reward.",
crisisPlayerFocus: "{name} is struggling — avoid focusing on them.",
pmFocusPossession: "Possession tactic active — PM focus ({name}) has strong synergy.",
bigDeficitHT: "Two down — safe options won't be enough in the second half.",
bigLeadHT: "Strong lead — stabilizing now protects your advantage.",
poorBuildupHT: "Build-up rate is poor — consider Vision Play or Reset.",
keeperBusyHT: "Your keeper has been busy — defense needs reinforcement.",
pressingAlreadyFailed: "Your pressing has collapsed — another press is near-useless.",
oppCounterThreat: "Counter Threat trait — pressing opens you up to immediate shots.",
finalDeficit: "Down by {n} — safe options won't save the match.",
finalLead: "Up by {n} — protecting now is a viable path.",
finalCounterSynergy: "Counter tactic active — Ambush has strong synergy here.",
legendaryOnBench: "{name} is on the bench — this is the moment.",
eventUnexpected: "Unexpected situation — no hint available. Trust your instincts.",

// ui.log (Ergänzungen zu v2)
r2GambleSuccess, r2GambleFail  // wie v2
r2GambleExposed: "  They had the numbers — second wave incoming.",
r5PressSuccess, r5PressFail  // wie v2
focusFail: "  {name} is overwhelmed — form drops, effectiveness down.",
substitution: "  ↔ {out} off, {in} on.",
synergyPressStack: "  🔗 Pressing synergy — decision amplified.",
synergyCounterStack: "  🔗 Counter synergy — trap is stronger.",
synergyAttackStack: "  🔗 Attacking synergy — offense amplified.",
conflictPressVsPossession: "  ⚠ Pressing conflicts with possession shape — reduced effect.",
conflictCounterVsAggressive: "  ⚠ Counter conflicts with aggressive setup — reduced effect.",
conflictAttackVsDefensive: "  ⚠ Attacking decision conflicts with defensive shape.",
conflictPressVsPossession: "  ⚠ Pressing and possession don't mix.",
conflictPressingAlreadyFailed: "  ⚠ Pressing already collapsed — near-useless.",
conflictFocusCrisis: "  ⚠ Player in crisis — focus is risky.",
synergyFocusHotStreak: "  🔗 Hot streak — focus amplified.",
synergyPMPossession: "  🔗 PM + Possession — strong synergy.",
synergyLegendarySub: "  ⭐ Legendary enters — impact amplified.",
teamTalkFailed: "  The message didn't land. They're still rattled.",
eventExploitAttack: "  Strike while they're shaky!",
r2counterTrapActive: "  Trap set — counter system armed."
```

---

## Implementierungsreihenfolge (Steps A–J)

| Step | Was | Testkriterium |
|---|---|---|
| A | `decisions.js` anlegen, `round2_reaction`-Pool (statisch) | `console.log(DECISIONS.round2_reaction.leading)` funktioniert |
| B | `computeDecisionImpact()` + `applyDecision()` + `scaleMatchBuffs()` | Synergielogs erscheinen im Match-Log |
| C | `round2_reaction` in `core.js` verdrahten, in `flow.js` + `ui.js` abfangen | Modal erscheint nach Runde 2 |
| D | `generateFocusOptions()`, Fokus-Bonus in `computePlayerStats()` | Spieler-Name erscheint als Option, Runde 4 zeigt erhöhten Stat |
| E | `round5_press` verdrahten, `computePressSuccessChance()`, Sofort-Szene | Pressing-Wahl erzeugt sofortigen Log-Eintrag |
| F | `generateSubOptions()`, Squad-Mutation, Rollen-Mismatch-Penalty | Einwechslung ändert Squad, R6 zeigt neuen Spieler im Log |
| G | `checkSituativeEvents()`, alle 5 Events implementieren | Hot-Player-Event erscheint bei Spieler in Form |
| H | `buildContextHint()` vollständig, in `showInterrupt()` einbinden, CSS | Kickoff-Modal zeigt korrekte Hints |
| I | Kickoff/Halftime/Final-Buff-Werte auf neue Zahlen anheben | Spürbar stärkere Matches in beiden Richtungen |
| J | Vollständiger i18n-Durchlauf alle drei Sprachen | Sprachwechsel zeigt korrekte neue Texte |

---

## Nicht ändern

- `CONFIG.rounds` bleibt 6
- `TACTIC_FIT`-System bleibt unverändert
- Bestehende Trait-Handler bleiben unverändert
- `applyTactic()` wird nur in den Buff-Werten geändert (Step I), nicht strukturell
- Promise-Pattern für Interrupts bleibt identisch

---

## Risiken & Mitigations

| Risiko | Mitigation |
|---|---|
| Zu viele Interrupts wirken überwältigend | Max 2 situative Ereignisse pro Match + sie erscheinen nicht in jedem Match (65% Chance) |
| Starke Negative Impacts frustrieren | Risiko immer im Desc kommuniziert; sichere Option immer verfügbar |
| Squad-Mutation bricht Trait-Handler | `squad`-Array wird in-place mutiert, alle Iterationen nutzen dieselbe Referenz |
| `_firedEvents` Set überlebt Run nicht richtig | In `freshState()` als leeres `new Set()` initialisieren |
| Synergiebrücken ergeben unbalancierte Extreme | `clamp(mult, 0.30, 2.00)` begrenzt den Multiplikator |
| Situative Events feuern in falscher Reihenfolge | `window`-Array und `break` nach erstem Treffer pro Runde verhindern das |
