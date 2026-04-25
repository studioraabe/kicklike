// js/narrative.js — Narrative-Layer für Match-Events.
//
// v0.42 — Phase A.1 des Narrativ-Plans: Tor-Aufbau-Kette.
//
// Zentrale Idee: zwischen der reinen Engine-Mechanik (Tore, Gegentore,
// Saves, Karten) und dem Match-Log eine Schicht einziehen, die
// Situationen in **narrativ kohärente Szenen** übersetzt. Engine bleibt
// deterministisch und unberührt — das Narrativ-Modul liest nur lesend
// aus dem Match-State und liefert Strings, die der Log vor dem
// eigentlichen Mechanik-Log einstreut.
//
// API-Kontrakt:
//   compose(sceneType, ctx) → string | null
//
// Das Narrativ-Modul entscheidet selbst, ob eine Szene in diesem Moment
// sinnvoll ist (context genug vorhanden, nicht zu häufig nacheinander).
// Gibt es kein gutes Narrativ: null zurück, Log läuft unverändert weiter.
//
// Template-System:
// - Szenen haben mehrere VARIANTEN pro Locale (via i18n-Array).
// - Jede Variante ist ein Template mit Platzhaltern wie {shooter},
//   {setupCard}, {triggerCard}, {setupHint}, {role}.
// - compose() wählt zufällig eine Variante AUS DEN PASSENDEN (jene, deren
//   Platzhalter sich alle mit ctx füllen lassen). So fallen Varianten
//   weg, die z.B. {triggerCard} verlangen, wenn keine Trigger-Karte
//   kürzlich gespielt wurde — statt mit Leerstellen ins Log zu geraten.
// - Anti-Wiederholung: pro Match wird protokolliert welche Varianten-
//   Indizes einer Szene bereits verwendet wurden. Solange nicht alle
//   durch sind, wird aus den unbenutzten gewählt. Erst danach neu
//   gelost. Das verhindert dass dieselbe Tor-Beschreibung dreimal in
//   einem Match erscheint.

(function () {
  const KL = window.KL || (window.KL = {});

  // ─── Helpers ───────────────────────────────────────────────────────────

  // Lies zuletzt gespielte Karte eines Typs aus _cardsPlayedThisMatch.
  // Window: aktuelle oder vorherige Runde (Tor passiert am Rundenende,
  // ein Setup in Runde N legt gut die Kette in Runde N fest).
  function lastPlayedCardOfType(match, type, roundWindow = 2) {
    const played = match?._cardsPlayedThisMatch || [];
    const minRound = (match?.round || 0) - roundWindow + 1;
    for (let i = played.length - 1; i >= 0; i--) {
      const p = played[i];
      if ((p.round || 0) < minRound) break;
      const def = window.KL?.cards?.getCardDef?.(p.id);
      if (def && def.type === type) return { id: p.id, def, round: p.round };
    }
    return null;
  }

  // Resolve card name via i18n. Fallback auf die id, wenn kein Label
  // hinterlegt ist (dürfte nicht vorkommen, ist aber defensive).
  function cardLabel(cardId) {
    if (!cardId) return null;
    const label = window.I18N?.t?.('ui.cards.' + cardId + '.name');
    return (label && label !== 'ui.cards.' + cardId + '.name') ? label : cardId;
  }

  // i18n-Hint pro Karte (kurzes narratives Bild statt blankem Kartenname)
  // — optional. Fallback auf den Namen wenn der Hint-Key nicht existiert.
  function cardHint(cardId) {
    if (!cardId) return null;
    const key = 'narrative.cards.' + cardId + '.buildupHint';
    const hint = window.I18N?.t?.(key);
    if (hint && hint !== key) return hint;
    return cardLabel(cardId);
  }

  // ─── Variant picker mit Anti-Wiederholung ──────────────────────────────

  // Pro Match protokolliert, welche Varianten pro Szene schon genutzt
  // wurden. Wird in compose() entlang des match-state gehalten.
  function pickVariant(match, sceneKey, candidates) {
    if (!candidates || candidates.length === 0) return null;
    match._narrativeUsed = match._narrativeUsed || {};
    const used = match._narrativeUsed[sceneKey] || new Set();
    const available = candidates.filter(c => !used.has(c.index));
    const pool = available.length > 0 ? available : candidates;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    // Wenn wir aus "available" pickten, den Index merken. Wenn der Pool
    // erschöpft war, Reset — frische Runde.
    if (available.length === 0) {
      match._narrativeUsed[sceneKey] = new Set([picked.index]);
    } else {
      used.add(picked.index);
      match._narrativeUsed[sceneKey] = used;
    }
    return picked.template;
  }

  // ─── Template-Interpolation ────────────────────────────────────────────

  function fillTemplate(template, values) {
    // Template-Schema: "Aufbau über {setupHint}. {shooter} vollendet."
    // Ersetzt alle {key}-Placeholder mit values[key]. Template gilt als
    // NICHT verwendbar wenn ein Placeholder fehlt — Aufrufer filtert
    // solche Varianten aus. Hier passiert die reine String-Substitution.
    return template.replace(/\{(\w+)\}/g, (m, k) => {
      return values[k] != null ? values[k] : m;
    });
  }

  // Prüft ob ein Template mit den gegebenen Werten komplett gefüllt
  // werden kann (alle Placeholder haben Werte).
  function templateFits(template, values) {
    const placeholders = [...template.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
    return placeholders.every(p => values[p] != null && values[p] !== '');
  }

  // ─── Szene: goalBuildup ────────────────────────────────────────────────

  // Erzeugt den Aufbau-Satz vor einem eigenen Tor. Liest Match-State
  // read-only; entscheidet selbst ob das Material reicht. Rückgabe ist
  // ein String (der vor dem Tor-Log-Eintrag ausgegeben wird) oder null.
  function composeGoalBuildup(match, squad, scorer) {
    if (!scorer || !match) return null;

    // Kartenbasierte Hinweise sammeln (die letzten Setup- und Trigger-
    // Karten aus Runde N-1/N — das ist die Aufbau-Kette, die zu diesem
    // Tor geführt hat).
    const setupCard = lastPlayedCardOfType(match, 'setup', 2);
    const triggerCard = lastPlayedCardOfType(match, 'trigger', 2);
    const comboCard = lastPlayedCardOfType(match, 'combo', 1);

    // Match-State-Indikatoren (keine Karten, aber auch Narrativ-Brennstoff)
    const flowLevel = match._cardFlow || 0;
    const laneOpen = !!match._cardLaneOpen;

    // Template-Werte. Undefined/leer = "nicht verfügbar" → filtert
    // ungeeignete Varianten automatisch aus.
    const values = {
      shooter: scorer.name,
      role: scorer.role,
      setupHint: setupCard ? cardHint(setupCard.id) : null,
      triggerHint: triggerCard ? cardHint(triggerCard.id) : null,
      comboHint: comboCard ? cardHint(comboCard.id) : null
    };

    // Varianten aus i18n (Array). Fehlt die Locale-Key: still geben wir
    // null zurück und nutzen den alten engine-log unverändert.
    const templates = window.I18N?.t?.('narrative.goalBuildup.variants');
    if (!Array.isArray(templates) || templates.length === 0) return null;

    // Filtere Varianten, deren Placeholder nicht alle gefüllt sind.
    const eligible = templates
      .map((template, index) => ({ template, index }))
      .filter(({ template }) => templateFits(template, values));
    if (eligible.length === 0) return null;

    const picked = pickVariant(match, 'goalBuildup', eligible);
    return picked ? fillTemplate(picked, values) : null;
  }

  // ─── Szene: oppGoalBuildup ─────────────────────────────────────────────
  //
  // Erzeugt den Aufbau-Satz vor einem Gegentor. Im Gegensatz zu unseren
  // Toren hat der Gegner KEIN Karten-System — der narrative Context
  // kommt stattdessen aus UNSEREM taktischen State beim Gegentor:
  // standen wir aufgerückt (attack phase)? All-in gegangen? Pressing
  // gerannt? Karten-Pause? Plus ein "opp trait"-Hint, wenn eine
  // thematische Trait-Karte des Gegners aktiv ist (Sniper, Konter, etc.)
  //
  // Das füllt den Spieler mit Information: "warum haben wir das
  // Gegentor gefangen?" statt nur "Gegner hat getroffen."

  // Mapped unseren Match-State auf eine Expose-Kategorie. Reihenfolge
  // ist Priorität: spezifische Zustände schlagen generische. Null wenn
  // nichts Thematisches greift — dann zieht die Narrativ-Funktion auf
  // Fallback-Varianten.
  function detectOurExposure(match) {
    if (match?.finalAction?.id === 'all_in' && match.round === 6) return 'all_in';
    if (match?.matchPhase === 'attack') return 'attack_phase';
    if ((match?.aggressiveRoundsLeft || 0) > 0) return 'aggressive';
    if ((match?._cardsThisRound || 0) === 0 && (match?.round || 1) > 1) return 'no_cards';
    return null;
  }

  // Sucht eine thematische "opp trait"-Aktivierung beim Gegentor. Wenn
  // z.B. der Gegner sniper hat und der schuss aus der Distanz fällt,
  // lohnt sich der Hint. Erste passende Trait aus traitHolders —
  // perfekt ist das nicht (wir wissen ja nicht wirklich welche Trait
  // diesen Schuss verursacht hat), aber thematisch passt es meistens.
  function detectOppTraitHint(match) {
    const holders = match?.opp?.traitHolders || {};
    const ids = Object.keys(holders).filter(k => holders[k]);
    if (ids.length === 0) return null;
    // Bevorzuge "schuss-thematische" Traits, die zum Gegentor direkt
    // passen. Andere (boss_aura, pressing_wall) sind weniger passend
    // als narrativer Trigger für den Tor-Moment selbst.
    const GOAL_RELEVANT = ['sniper', 'sturm', 'konter_opp', 'clutch_opp', 'lucky', 'rage_mode', 'counter_threat'];
    const pick = ids.find(id => GOAL_RELEVANT.includes(id)) || ids[0];
    const key = 'narrative.oppGoalBuildup.oppTrait.' + pick;
    const hint = window.I18N?.t?.(key);
    return (hint && hint !== key) ? hint : null;
  }

  function composeOppGoalBuildup(match, scorer) {
    if (!scorer || !match) return null;

    const exposureKey = detectOurExposure(match);
    const exposureHint = exposureKey
      ? (window.I18N?.t?.('narrative.oppGoalBuildup.exposure.' + exposureKey) || null)
      : null;
    const oppTraitHint = detectOppTraitHint(match);

    const values = {
      oppScorer: scorer.name,
      oppRole: scorer.role,
      exposureHint: (exposureHint && exposureHint !== 'narrative.oppGoalBuildup.exposure.' + exposureKey)
        ? exposureHint : null,
      oppTraitHint
    };

    const templates = window.I18N?.t?.('narrative.oppGoalBuildup.variants');
    if (!Array.isArray(templates) || templates.length === 0) return null;

    const eligible = templates
      .map((template, index) => ({ template, index }))
      .filter(({ template }) => templateFits(template, values));
    if (eligible.length === 0) return null;

    const picked = pickVariant(match, 'oppGoalBuildup', eligible);
    return picked ? fillTemplate(picked, values) : null;
  }

  // ─── Szene: postHitMine (wir schießen an Latte/Pfosten) ────────────────
  //
  // v0.43 — beidseitiger Lattentreffer. Diese Szene beschreibt unseren
  // Schuss, der statt ins Tor ans Aluminium geht. Wird vor dem eigentlichen
  // Tor-Event gerollt (4% Chance) — wenn trifft, gibt es KEIN Tor und
  // diese Szene läuft stattdessen. Nutzt dieselben Setup/Trigger-Hints
  // wie die Tor-Aufbau-Szene, damit der Nachbau-Moment ("war fast ein
  // Tor") für den Spieler nachvollziehbar ist.

  function composePostHitMine(match, squad, scorer) {
    if (!scorer || !match) return null;
    const setupCard = lastPlayedCardOfType(match, 'setup', 2);
    const triggerCard = lastPlayedCardOfType(match, 'trigger', 2);
    const values = {
      shooter: scorer.name,
      role: scorer.role,
      setupHint: setupCard ? cardHint(setupCard.id) : null,
      triggerHint: triggerCard ? cardHint(triggerCard.id) : null
    };
    const templates = window.I18N?.t?.('narrative.postHitMine.variants');
    if (!Array.isArray(templates) || templates.length === 0) return null;
    const eligible = templates
      .map((template, index) => ({ template, index }))
      .filter(({ template }) => templateFits(template, values));
    if (eligible.length === 0) return null;
    const picked = pickVariant(match, 'postHitMine', eligible);
    return picked ? fillTemplate(picked, values) : null;
  }

  // ─── Szene: postHitOpp (Gegner schießt an Latte/Pfosten) ───────────────
  //
  // Reine Erleichterungs-Szene — der Gegner war durch, aber der Ball geht
  // an den Pfosten. Kein zusätzlicher Kontext, der narrative Moment ist
  // das Glück selbst. Ein paar Varianten mit dramatischer Bildsprache.

  function composePostHitOpp(match, scorer) {
    if (!scorer || !match) return null;
    const values = {
      oppScorer: scorer.name,
      oppRole: scorer.role
    };
    const templates = window.I18N?.t?.('narrative.postHitOpp.variants');
    if (!Array.isArray(templates) || templates.length === 0) return null;
    const eligible = templates
      .map((template, index) => ({ template, index }))
      .filter(({ template }) => templateFits(template, values));
    if (eligible.length === 0) return null;
    const picked = pickVariant(match, 'postHitOpp', eligible);
    return picked ? fillTemplate(picked, values) : null;
  }

  // ─── Szene: offsideMine / offsideOpp (Abseits) ──────────────────────────
  //
  // v0.44 — Abseits-Szene. 3% Chance pro Tor-Event (beidseitig) dass
  // das Tor wegen Abseits aberkannt wird. Kein Setup/Trigger-Kontext
  // nötig — Abseits ist ein positioneller Fehler, kein Aufbau-Moment.
  // Unterschied zu Lattentreffer: Abseits betrifft den LAUF, nicht den
  // Schuss. Die Narrative hebt das hervor.

  function composeOffsideMine(match, scorer) {
    if (!scorer || !match) return null;
    const values = {
      shooter: scorer.name,
      role: scorer.role
    };
    const templates = window.I18N?.t?.('narrative.offsideMine.variants');
    if (!Array.isArray(templates) || templates.length === 0) return null;
    const eligible = templates
      .map((template, index) => ({ template, index }))
      .filter(({ template }) => templateFits(template, values));
    if (eligible.length === 0) return null;
    const picked = pickVariant(match, 'offsideMine', eligible);
    return picked ? fillTemplate(picked, values) : null;
  }

  function composeOffsideOpp(match, scorer) {
    if (!scorer || !match) return null;
    const values = {
      oppScorer: scorer.name,
      oppRole: scorer.role
    };
    const templates = window.I18N?.t?.('narrative.offsideOpp.variants');
    if (!Array.isArray(templates) || templates.length === 0) return null;
    const eligible = templates
      .map((template, index) => ({ template, index }))
      .filter(({ template }) => templateFits(template, values));
    if (eligible.length === 0) return null;
    const picked = pickVariant(match, 'offsideOpp', eligible);
    return picked ? fillTemplate(picked, values) : null;
  }

  // ─── Szene: penalty (Elfmeter inline) ──────────────────────────────────
  //
  // v0.44 — Elfmeter als inline-Szene (kein Modal, keine Unterbrechung).
  // Drei Phasen: Intro (Schiedsrichter zeigt), Outcome (Tor/Save/Miss),
  // optional Followup. Jeder Aufruf gibt einen EINZELNEN Satz zurück —
  // der Aufrufer (engine.js) verkettet Intro → Outcome mit await log()
  // dazwischen, damit die Reihenfolge im Log sauber ist.
  //
  // Anti-Wiederholung: pro Match-State separat für intro/goal/save/miss,
  // damit bei mehreren Elfmetern pro Match die Formulierungen variieren.

  function composePenaltyIntro(match, shooter, forUs) {
    if (!shooter || !match) return null;
    const values = {
      shooter: shooter.name,
      role: shooter.role
    };
    const scene = forUs ? 'penaltyIntroMine' : 'penaltyIntroOpp';
    const templates = window.I18N?.t?.('narrative.' + scene + '.variants');
    if (!Array.isArray(templates) || templates.length === 0) return null;
    const eligible = templates
      .map((template, index) => ({ template, index }))
      .filter(({ template }) => templateFits(template, values));
    if (eligible.length === 0) return null;
    const picked = pickVariant(match, scene, eligible);
    return picked ? fillTemplate(picked, values) : null;
  }

  function composePenaltyOutcome(match, shooter, keeper, outcome, forUs) {
    if (!shooter || !keeper || !match) return null;
    const values = {
      shooter: shooter.name,
      role: shooter.role,
      keeper: keeper.name
    };
    // scene-Keys: penaltyGoalMine, penaltySaveMine, penaltyMissMine,
    //             penaltyGoalOpp,  penaltySaveOpp,  penaltyMissOpp.
    // 6 getrennte Pools — Anti-Wiederholung jeweils separat.
    const side = forUs ? 'Mine' : 'Opp';
    const outKey = outcome === 'goal' ? 'Goal'
                 : outcome === 'save' ? 'Save'
                 : 'Miss';
    const scene = 'penalty' + outKey + side;
    const templates = window.I18N?.t?.('narrative.' + scene + '.variants');
    if (!Array.isArray(templates) || templates.length === 0) return null;
    const eligible = templates
      .map((template, index) => ({ template, index }))
      .filter(({ template }) => templateFits(template, values));
    if (eligible.length === 0) return null;
    const picked = pickVariant(match, scene, eligible);
    return picked ? fillTemplate(picked, values) : null;
  }

  // Berechnet die Elfmeter-Trefferwahrscheinlichkeit aus Schütze vs
  // Keeper-Stats. Keine Engine-Nähe — nur Math.
  //
  // Formel-Ziel: realistische Conversion ~70-85% bei durchschnittlichen
  // Werten, Spanne 50-90% je nach Stat-Delta. Basisrate 73% kommt aus
  // den realen Elfmeter-Statistiken grob (75% in Top-Ligen). Die Stat-
  // Einflüsse sind moderat damit Elfmeter als "meist reinkommende"
  // Torchance Gefühl behalten und Comebacks nicht trivial ermöglichen.
  function penaltyGoalProb(shooter, keeper) {
    const sComposure = shooter?.stats?.composure || 50;
    const sOffense = shooter?.stats?.offense || 50;
    const kDefense = keeper?.stats?.defense || 50;
    const sAvg = (sComposure + sOffense) / 2;
    const base = 0.73;
    const boost = (sAvg - 50) * 0.004;
    const keeperCut = Math.max(0, kDefense - 50) * 0.004;
    const prob = base + boost - keeperCut;
    return Math.max(0.40, Math.min(0.92, prob));
  }

  // Entscheidet das Elfmeter-Ergebnis: 'goal', 'save', oder 'miss'.
  // goalProb = Tor-Chance. Der Rest (1 - goalProb) teilt sich in
  // 60% Save und 40% Miss auf — narrative Variation, mechanisch
  // gleichwertig (kein Tor).
  function resolvePenaltyOutcome(goalProb, randFn) {
    const r = (randFn || Math.random)();
    if (r < goalProb) return 'goal';
    // Remaining range: save vs miss 60/40 split
    const nonGoalR = (r - goalProb) / (1 - goalProb);
    return nonGoalR < 0.60 ? 'save' : 'miss';
  }

  // ─── Szene: matchEndDrama ──────────────────────────────────────────────
  //
  // v0.45 — Dramaturgische Match-End-Klassifizierung. Liest den finalen
  // Spielstand + scoreTimeline (per-round-Snapshots) und entscheidet ob
  // das Match eine "memorable" Kategorie trifft. Wenn ja → eigene
  // Narrativ-Zeile vor dem regulären Epilog. Wenn nein → null, und der
  // Standard-Epilog läuft alleine.
  //
  // Kategorien (Priorität von oben nach unten — erste passende gewinnt):
  //   comeback_win    : wir lagen ≥2 hinten, haben am Ende gewonnen
  //   collapse_loss   : wir führten ≥2, haben am Ende verloren
  //   last_minute_win : in R5 noch unentschieden/hinten, R6 entscheidend
  //   last_minute_loss: in R5 noch vorne/unentschieden, R6 reißt es weg
  //   shutout_win     : Sieg mit 0 Gegentoren (≥2 eigene Tore)
  //   shutout_loss    : Niederlage mit 0 eigenen Toren (≥2 Gegner)
  //   blowout_win     : ≥4 Tore Differenz, Sieg
  //   blowout_loss    : ≥4 Tore Differenz, Niederlage
  //   nail_biter_win  : 1-Tor-Sieg mit ≥2 Toren beidseits
  //   nail_biter_loss : 1-Tor-Niederlage mit ≥2 Toren beidseits
  //   goal_fest_draw  : Unentschieden ≥3:3
  //   (default)       : null — kein Drama-Layer, Standard-Epilog genügt
  //
  // Per-Match-Anti-Wiederholung ist nicht nötig (pro Match nur ein
  // matchEnd), aber Variation über mehrere Matches durch Template-
  // Varianten.

  function classifyMatchEnd(match, result) {
    if (!match) return null;
    const me = match.scoreMe || 0;
    const opp = match.scoreOpp || 0;
    const diff = me - opp;
    const timeline = Array.isArray(match.scoreTimeline) ? match.scoreTimeline : [];

    // War ich jemals ≥2 hinten? (Comeback-Kriterium)
    const wasBehindBy2 = timeline.some(t => (t.opp - t.me) >= 2);
    // War ich jemals ≥2 vorne? (Collapse-Kriterium)
    const wasAheadBy2 = timeline.some(t => (t.me - t.opp) >= 2);

    // Stand nach R5 (falls da) — für last-minute-Kategorie
    const afterR5 = timeline.find(t => t.round === 5);
    const afterR6 = timeline.find(t => t.round === 6);
    const r5Diff = afterR5 ? (afterR5.me - afterR5.opp) : null;
    const r6DeltaMe = (afterR6 && afterR5) ? (afterR6.me - afterR5.me) : 0;
    const r6DeltaOpp = (afterR6 && afterR5) ? (afterR6.opp - afterR5.opp) : 0;

    if (result === 'win') {
      if (wasBehindBy2) return 'comeback_win';
      if (r5Diff !== null && r5Diff <= 0 && r6DeltaMe > 0 && diff > 0) return 'last_minute_win';
      if (opp === 0 && me >= 2) return 'shutout_win';
      if (diff >= 4) return 'blowout_win';
      if (diff === 1 && me >= 2 && opp >= 2) return 'nail_biter_win';
    } else if (result === 'loss') {
      if (wasAheadBy2) return 'collapse_loss';
      if (r5Diff !== null && r5Diff >= 0 && r6DeltaOpp > 0 && diff < 0) return 'last_minute_loss';
      if (me === 0 && opp >= 2) return 'shutout_loss';
      if (diff <= -4) return 'blowout_loss';
      if (diff === -1 && me >= 2 && opp >= 2) return 'nail_biter_loss';
    } else if (result === 'draw') {
      if (me >= 3 && opp >= 3) return 'goal_fest_draw';
    }
    return null;
  }

  function composeMatchEndDrama(match, result) {
    if (!match) return null;
    const category = classifyMatchEnd(match, result);
    if (!category) return null;

    const values = {
      me: match.scoreMe || 0,
      opp: match.scoreOpp || 0
    };
    const templates = window.I18N?.t?.('narrative.matchEndDrama.' + category);
    if (!Array.isArray(templates) || templates.length === 0) return null;

    const eligible = templates
      .map((template, index) => ({ template, index }))
      .filter(({ template }) => templateFits(template, values));
    if (eligible.length === 0) return null;

    const picked = pickVariant(match, 'matchEndDrama_' + category, eligible);
    return picked ? fillTemplate(picked, values) : null;
  }

  // ─── Public API ────────────────────────────────────────────────────────
  KL.narrative = {
    composeGoalBuildup,
    composeOppGoalBuildup,
    composePostHitMine,
    composePostHitOpp,
    composeOffsideMine,
    composeOffsideOpp,
    composePenaltyIntro,
    composePenaltyOutcome,
    penaltyGoalProb,
    resolvePenaltyOutcome,
    composeMatchEndDrama,
    classifyMatchEnd,
    // Low-level-Helpers als Export — nützlich für Tests und zukünftige
    // Szenen (Elfmeter-Aufbau, Verletzung, ...).
    _helpers: {
      lastPlayedCardOfType,
      cardLabel,
      cardHint,
      pickVariant,
      fillTemplate,
      templateFits,
      detectOurExposure,
      detectOppTraitHint
    }
  };
})();
