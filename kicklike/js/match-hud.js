// ============================================================================
// js/match-hud.js — Match Clock + Highlight Stripe
// ============================================================================
//
// Ersetzt den Inhalt des #round-indicator-Containers durch:
//   1. Eine Uhr (aktuelle Minute + Phase), abgeleitet aus match.round.
//   2. Einen horizontalen Highlight-Streifen mit Ereignissen des Matches:
//      Tore (eigene/Gegner), Opp-Karten, Spieler-Entscheidungen (Kickoff/
//      Halbzeit/Final). Hover zeigt Tooltip, Klick springt zur Log-Zeile.
//
// Das Modul ändert KEINE anderen Teile des Match-Headers (Score, Teamnamen,
// Logos bleiben unberührt). Nur der bestehende #round-indicator (der vorher
// die 6 Punkte zeigte) wird umfunktioniert.
//
// Integration in ui.js:
//   - `renderMatch()` ruft statt round-dots-Loop `KL.matchHud.initMatch()` auf.
//   - `updateRoundIndicator(round)` delegiert an `KL.matchHud.updateRound()`.
//   - `appendLog(msg, cls)` ruft am Ende `KL.matchHud.onLogLine(...)` auf.
//
// Runden→Minuten-Mapping: 6 Runden × 15 Min = 90 Min. R1 startet bei 0',
// Halbzeit nach R3 bei 45', Final-Taktik bei 75', Abpfiff bei 90'.
// Einzelne Events innerhalb einer Runde werden auf Sub-Minuten verteilt,
// sodass die Reihenfolge im Log der Reihenfolge im Streifen entspricht.

(() => {
  'use strict';
  const KL = window.KL || (window.KL = {});

  // Runden-Konstanten — 6 Runden × 15 Min. Falls CONFIG.rounds irgendwann
  // vom Default abweicht (Balance-Experimente), zieht sich das Mapping
  // automatisch nach.
  const MINUTES_TOTAL = 90;
  const roundsTotal = () => (KL.config?.CONFIG?.rounds) || 6;
  const minutesPerRound = () => MINUTES_TOTAL / roundsTotal();
  const roundStartMin = (r) => Math.round((r - 1) * minutesPerRound());

  // Internal state — eine einzige Instanz, lebt so lange wie die Seite.
  // Bei jedem neuen Match wird sie per initMatch() zurückgesetzt.
  const S = {
    match: null,
    round: 0,            // 0 = noch keine Runde gestartet (pre-match)
    minute: 0,           // aktuelle Minute auf der Clock
    events: [],          // { id, type, team, minute, ...data, logEl }
    eventSeq: 0,
    eventsInRound: 0,
    logObserver: null,   // MutationObserver auf #match-log; fängt auch direct-DOM-Appends
    el: {
      container: null,
      minute: null,
      phase: null,
      stripe: null,
      events: null,
      playhead: null,
      pastOverlay: null,
    },
  };

  // ── Minuten-Rechner ─────────────────────────────────────────────────────
  // Vorher: feste Slots bei rStart+3, +6, +10, +13. Bei 1-2 Events pro Runde
  // landeten die Marker deshalb alle dicht am Rundenanfang ("Klumpen um den
  // Interrupt"). Jetzt: uniforme Random-Verteilung innerhalb der nutzbaren
  // Rundenspanne (rStart+2 bis rStart+mpr-2), mit Monotonie-Garantie gegen
  // die zuletzt vergebene Minute. So streuen die Events natürlich über die
  // ganze Runde, auch wenn nur wenige vorkommen.
  function minuteForNewEvent() {
    const rStart = roundStartMin(S.round || 1);
    const mpr = minutesPerRound();
    // Nutzbare Spanne: 2 Minuten Puffer am Rundenende, damit kein Marker
    // direkt am Übergang zur nächsten Runde / zum Interrupt landet.
    const minMinute = Math.max(S.minute + 2, rStart + 2);
    const maxMinute = Math.max(minMinute, rStart + mpr - 2);
    const range = maxMinute - minMinute;
    if (range <= 0) return minMinute;
    return minMinute + Math.floor(Math.random() * (range + 1));
  }

  // Interrupts haben feste Anker, keine Slot-Verteilung. Kickoff bei 0'
  // (flush am Zeitleisten-Start), Halbzeit am Ende der 1. Halbzeit,
  // Final zu Beginn der letzten Runde.
  function interruptAnchorMinute(phase, round) {
    if (phase === 'kickoff') return 0;
    return roundStartMin(round);
  }

  // Helper: lookup via I18N mit defensivem Fallback auf den Key selbst
  // (macht Missing-Keys sichtbar statt stumme Leerstrings zu produzieren).
  function T(key, vars) {
    return window.I18N?.t ? window.I18N.t(key, vars) : key;
  }

  // Liefert das Label für die aktuelle Match-Phase. Bevorzugt die echte
  // Engine-Phase (match.matchPhase: buildup/possession/attack/transition/
  // recovery/defensive), die sich WÄHREND einer Runde live ändert. Wenn
  // noch keine gesetzt ist (vor Kickoff), fällt auf Halbzeit-Orientierung
  // zurück, damit die Anzeige nicht leer bleibt.
  function phaseLabel() {
    if (S.round === 0) return '';
    const match = S.match || window.state?.currentMatch;
    const mp = match?.matchPhase;
    if (mp) {
      const key = 'ui.matchHud.phase.' + mp;
      const translated = T(key);
      if (translated && translated !== key) return translated;
    }
    const halfSplit = Math.ceil(roundsTotal() / 2);
    return S.round <= halfSplit
      ? T('ui.matchHud.phase.firstHalf')
      : T('ui.matchHud.phase.secondHalf');
  }

  function displayMinute() {
    return Math.max(0, Math.floor(S.minute));
  }

  function minuteToX(minute, widthPx) {
    return (minute / MINUTES_TOTAL) * widthPx;
  }

  // ── DOM-Bau ─────────────────────────────────────────────────────────────
  // Zwei getrennte Anker:
  //   1. Clock-Block wird in `.match-header .score` eingehängt (unter die
  //      Score-Spans). Dadurch steht die Minute mittig unterm 0:0 — spart
  //      eine separate Zeile und reduziert Augensprünge.
  //   2. Stripe-Block landet im alten `#round-indicator` (spannt als grid-
  //      column: 1/-1 über die ganze Breite). Past-Overlay verdunkelt den
  //      bereits gespielten Bereich links vom Playhead.
  function buildDom(stripeContainer) {
    // Clock in die Score-Zelle einhängen (oder bestehende neu bestücken).
    const scoreCell = document.querySelector('.match-header .score');
    if (scoreCell) {
      let clock = scoreCell.querySelector('.mh-clock');
      if (!clock) {
        clock = document.createElement('div');
        clock.className = 'mh-clock';
        const minuteSpan = document.createElement('span');
        minuteSpan.className = 'mh-clock-minute';
        const phaseSpan = document.createElement('span');
        phaseSpan.className = 'mh-clock-phase';
        clock.appendChild(minuteSpan);
        clock.appendChild(phaseSpan);
        scoreCell.appendChild(clock);
      }
      S.el.minute = clock.querySelector('.mh-clock-minute');
      S.el.phase  = clock.querySelector('.mh-clock-phase');
      S.el.minute.textContent = "0'";
      S.el.phase.textContent = '';
    }

    // Stripe in den Runden-Indicator-Container (jetzt nur noch Stripe).
    stripeContainer.innerHTML = '';
    stripeContainer.classList.add('mh-root');

    const stripeWrap = document.createElement('div');
    stripeWrap.className = 'mh-stripe-wrap';

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'mh-stripe');
    svg.setAttribute('viewBox', '0 0 640 54');
    svg.setAttribute('preserveAspectRatio', 'none');

    const pitch = document.createElementNS(NS, 'rect');
    pitch.setAttribute('class', 'mh-pitch');
    pitch.setAttribute('x', '0'); pitch.setAttribute('y', '0');
    pitch.setAttribute('width', '640'); pitch.setAttribute('height', '54');
    svg.appendChild(pitch);

    // Mittellinie horizontal (trennt me-Halbfeld oben vs opp-Halbfeld unten).
    const midline = document.createElementNS(NS, 'line');
    midline.setAttribute('class', 'mh-midline');
    midline.setAttribute('x1', '0'); midline.setAttribute('y1', '27');
    midline.setAttribute('x2', '640'); midline.setAttribute('y2', '27');
    svg.appendChild(midline);

    // Halbzeitlinie vertikal (bei 45 Min = x=320 im viewBox).
    const htLine = document.createElementNS(NS, 'line');
    htLine.setAttribute('class', 'mh-ht-line');
    htLine.setAttribute('x1', '320'); htLine.setAttribute('y1', '0');
    htLine.setAttribute('x2', '320'); htLine.setAttribute('y2', '54');
    svg.appendChild(htLine);

    // Mittelkreis (dekorativ — gibt dem Streifen "Fußballfeld"-Identität).
    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('class', 'mh-ht-circle');
    circle.setAttribute('cx', '320'); circle.setAttribute('cy', '27');
    circle.setAttribute('r', '12');
    svg.appendChild(circle);

    // Past-Overlay: verdunkelt den bereits gespielten Bereich links vom
    // Playhead. Width bleibt auf voller Stripe-Breite; die Position wird
    // per CSS-Transform (scaleX mit transform-origin:0 0) in updateClockUi
    // animiert. Dadurch glider das Overlay mit, statt zu springen.
    const pastOverlay = document.createElementNS(NS, 'rect');
    pastOverlay.setAttribute('class', 'mh-past');
    pastOverlay.setAttribute('x', '0'); pastOverlay.setAttribute('y', '0');
    pastOverlay.setAttribute('width', '640'); pastOverlay.setAttribute('height', '54');
    pastOverlay.style.transform = 'scaleX(0)';
    svg.appendChild(pastOverlay);

    // Playhead ZUERST, Events DANACH — so liegen Marker (Tore, Opp-Karten,
    // Interrupts) optisch über dem blauen Indikator, nicht darunter.
    const playhead = document.createElementNS(NS, 'line');
    playhead.setAttribute('class', 'mh-playhead');
    playhead.setAttribute('x1', '0'); playhead.setAttribute('y1', '0');
    playhead.setAttribute('x2', '0'); playhead.setAttribute('y2', '54');
    svg.appendChild(playhead);

    const eventsGroup = document.createElementNS(NS, 'g');
    eventsGroup.setAttribute('class', 'mh-events');
    svg.appendChild(eventsGroup);

    stripeWrap.appendChild(svg);
    stripeContainer.appendChild(stripeWrap);

    // Einmaliger Tooltip, an <body> angehängt (bleibt zwischen Matches
    // erhalten, wird nur versteckt).
    S.el.container = stripeContainer;
    S.el.stripe = svg;
    S.el.events = eventsGroup;
    S.el.playhead = playhead;
    S.el.pastOverlay = pastOverlay;
  }

  // ── Marker-Bau ──────────────────────────────────────────────────────────
  // Jeder Event-Typ hat eine eigene Marker-Form. SVG statt HTML, weil das
  // Stripe-Element selbst ein SVG ist und gleichmäßig skalieren soll.
  function buildMarker(ev) {
    const NS = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', `mh-marker mh-${ev.type} mh-team-${ev.team}`);
    g.dataset.mhId = ev.id;
    const x = minuteToX(ev.minute, 640);

    if (ev.type === 'goal') {
      // Ring oben bei me-Toren, unten bei opp-Toren — stille Konvention.
      const y = ev.team === 'me' ? 16 : 38;
      g.setAttribute('transform', `translate(${x}, ${y})`);
      const ring = document.createElementNS(NS, 'circle');
      ring.setAttribute('class', 'mh-goal-ring');
      ring.setAttribute('r', '6');
      g.appendChild(ring);
      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('class', 'mh-goal-dot');
      dot.setAttribute('r', '2.2');
      g.appendChild(dot);
    } else if (ev.type === 'oppCard') {
      g.setAttribute('transform', `translate(${x}, 27)`);
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('class', 'mh-card-rect');
      rect.setAttribute('x', '-5'); rect.setAttribute('y', '-7');
      rect.setAttribute('width', '10'); rect.setAttribute('height', '14');
      rect.setAttribute('rx', '1.5');
      g.appendChild(rect);
      const letter = document.createElementNS(NS, 'text');
      letter.setAttribute('class', 'mh-card-letter');
      letter.setAttribute('y', '3'); letter.setAttribute('text-anchor', 'middle');
      letter.textContent = T('ui.matchHud.badge.oppCard');
      g.appendChild(letter);
    } else if (ev.type === 'shield') {
      // Shield: kleine accent-grüne Badge in der Me-Hälfte (y=13 zentriert,
      // also 6..20). Klar getrennt vom Opp-Card-Marker auf der Mittellinie
      // und von den Me-Toren bei y=16 (die sind größer und offensichtlich
      // anders geformt).
      g.setAttribute('transform', `translate(${x}, 13)`);
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('class', 'mh-shield-rect');
      rect.setAttribute('x', '-5'); rect.setAttribute('y', '-7');
      rect.setAttribute('width', '10'); rect.setAttribute('height', '14');
      rect.setAttribute('rx', '1.5');
      g.appendChild(rect);
      const letter = document.createElementNS(NS, 'text');
      letter.setAttribute('class', 'mh-shield-letter');
      letter.setAttribute('y', '3'); letter.setAttribute('text-anchor', 'middle');
      letter.textContent = T('ui.matchHud.badge.shield');
      g.appendChild(letter);
    } else if (ev.type === 'counter') {
      // Counter-Play: Player-Kartentyp counter. Liegt nahe an der
      // Mittellinie in der Me-Hälfte (y=20), also direkt über dem
      // Opp-Card-Marker-Level — visuell "ich reagiere auf die Opp-Seite".
      // Gleiche Größe wie Shield/Opp-Card für Typ-Konsistenz, aber
      // anderer Buchstabe zur Unterscheidung.
      g.setAttribute('transform', `translate(${x}, 20)`);
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('class', 'mh-counter-rect');
      rect.setAttribute('x', '-5'); rect.setAttribute('y', '-7');
      rect.setAttribute('width', '10'); rect.setAttribute('height', '14');
      rect.setAttribute('rx', '1.5');
      g.appendChild(rect);
      const letter = document.createElementNS(NS, 'text');
      letter.setAttribute('class', 'mh-counter-letter');
      letter.setAttribute('y', '3'); letter.setAttribute('text-anchor', 'middle');
      letter.textContent = T('ui.matchHud.badge.counter');
      g.appendChild(letter);
    } else if (ev.type === 'interrupt') {
      // Keine Group-Translation: Linie steht auf ihrer Anker-Minute, aber
      // das Badge darf bei Rand-Nähe (KO am Zeitleisten-Anfang) nach rechts
      // rutschen, damit es nicht halb über die Kante ragt.
      // Alles strikt innerhalb des viewBox [0..54], sonst clippt das
      // overflow-x:auto des Scroll-Wrappers Teile der Badge weg.
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('class', 'mh-interrupt-line');
      line.setAttribute('x1', String(x)); line.setAttribute('y1', '0');
      line.setAttribute('x2', String(x)); line.setAttribute('y2', '54');
      g.appendChild(line);

      const badgeW = ev.phase === 'final' ? 24 : 18;
      const idealLeft = x - badgeW / 2;
      const badgeLeft = Math.max(0, Math.min(640 - badgeW, idealLeft));
      const badgeCenterX = badgeLeft + badgeW / 2;

      const badge = document.createElementNS(NS, 'rect');
      badge.setAttribute('class', 'mh-interrupt-badge');
      badge.setAttribute('x', String(badgeLeft));
      badge.setAttribute('y', '0');
      badge.setAttribute('width', String(badgeW));
      badge.setAttribute('height', '10');
      badge.setAttribute('rx', '1.5');
      g.appendChild(badge);

      const lbl = document.createElementNS(NS, 'text');
      lbl.setAttribute('class', 'mh-interrupt-label');
      lbl.setAttribute('x', String(badgeCenterX));
      lbl.setAttribute('y', '7');
      lbl.setAttribute('text-anchor', 'middle');
      lbl.textContent = T('ui.matchHud.badge.' + ev.phase);
      g.appendChild(lbl);
    }

    // Tooltip-Content als strukturiertes JSON ans Element hängen — das
    // globale KL.tip-Modul (js/tooltip.js) fängt Hover per Delegation und
    // zeigt den Tooltip an. Keine eigenen Hover-Handler hier.
    g.setAttribute('data-kl-tip', JSON.stringify(tooltipPayload(ev)));

    g.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.KL?.tip?.hide) window.KL.tip.hide();
      jumpToLog(ev);
    });

    return g;
  }

  // Baut das strukturierte Tooltip-Objekt für KL.tip aus einem HUD-Event.
  // Format: { head, body, sub, tone }. Tone steuert die Farbe des Kopfs
  // ('me' = grün, 'opp' = pink, 'neutral' = gold).
  function tooltipPayload(ev) {
    const min = ev.minute + "'";
    if (ev.type === 'goal') {
      const headKey = ev.team === 'me' ? 'meGoal' : 'oppGoal';
      return {
        head: `${min} · ${T('ui.matchHud.event.' + headKey)}`,
        body: ev.scorer || '',
        sub:  ev.note || '',
        tone: ev.team === 'me' ? 'me' : 'opp',
      };
    }
    if (ev.type === 'oppCard') {
      return {
        head: `${min} · ${T('ui.matchHud.event.oppCard')}`,
        body: ev.cardName || '',
        sub:  ev.note || '',
        tone: 'opp',
      };
    }
    if (ev.type === 'shield') {
      return {
        head: `${min} · ${T('ui.matchHud.event.shield')}`,
        body: ev.note || '',
        tone: 'me',
      };
    }
    if (ev.type === 'counter') {
      return {
        head: `${min} · ${T('ui.matchHud.event.counter')}`,
        body: ev.note || '',
        tone: 'me',
      };
    }
    if (ev.type === 'interrupt') {
      return {
        head: `${min} · ${T('ui.matchHud.interrupt.' + ev.phase)}`,
        body: ev.tactic || '',
        sub:  ev.note || '',
        tone: 'neutral',
      };
    }
    return { head: min };
  }

  // ── Log-Anchor ──────────────────────────────────────────────────────────
  function jumpToLog(ev) {
    if (!ev.logEl) return;
    try {
      ev.logEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ev.logEl.classList.add('mh-log-highlight');
      setTimeout(() => ev.logEl.classList.remove('mh-log-highlight'), 1600);
    } catch (_) { /* scrollIntoView kann in alten Browsern fehlschlagen */ }
  }

  // ── Rendering ───────────────────────────────────────────────────────────
  function renderEvents() {
    if (!S.el.events) return;
    // Inkrementell: nur neue Events anhängen. Jedes Event hat eine ID, die
    // wir als dataset.mhId am g-Element setzen. Vorhandene nicht neu bauen.
    const seen = new Set(
      Array.from(S.el.events.children).map(c => c.dataset.mhId)
    );
    for (const ev of S.events) {
      if (seen.has(ev.id)) continue;
      S.el.events.appendChild(buildMarker(ev));
    }
  }

  function updateClockUi() {
    if (S.el.minute) S.el.minute.textContent = displayMinute() + "'";
    if (S.el.phase) S.el.phase.textContent = phaseLabel();
    const x = minuteToX(S.minute, 640);
    if (S.el.playhead) {
      // Playhead glatt schieben per CSS-Transform statt x1/x2-Attribut-Sprung.
      // Die Linie bleibt bei x=0 gezeichnet; der Transform macht den Offset,
      // und die CSS-Transition in .mh-playhead easet den Wechsel aus.
      S.el.playhead.style.transform = `translateX(${x}px)`;
    }
    if (S.el.pastOverlay) {
      // Verdunkelt die bereits gespielte Zeit links vom Playhead.
      // Gleiches Prinzip wie beim Playhead: Rect bleibt bei voller Breite,
      // und wir skalieren per Transform (mit transform-origin links). Das
      // erlaubt CSS-transition, während reines width-Setzen springt.
      const frac = Math.max(0, Math.min(1, S.minute / MINUTES_TOTAL));
      S.el.pastOverlay.style.transform = `scaleX(${frac})`;
    }
    autoScrollToPlayhead();
  }

  function autoScrollToPlayhead() {
    // Bei Mobile (horizontales Scrollen) den Playhead ins Sichtfeld halten.
    const wrap = S.el.stripe?.parentElement;
    if (!wrap) return;
    if (wrap.scrollWidth <= wrap.clientWidth) return;   // kein Scroll nötig
    const frac = S.minute / MINUTES_TOTAL;
    const targetCenter = frac * wrap.scrollWidth;
    const want = Math.max(0, targetCenter - wrap.clientWidth / 2);
    // Nur scrollen, wenn der Playhead aus dem Viewport läuft — nicht bei
    // jedem Minuten-Tick (sonst jittert es).
    const visibleLeft = wrap.scrollLeft;
    const visibleRight = visibleLeft + wrap.clientWidth;
    if (targetCenter < visibleLeft + 40 || targetCenter > visibleRight - 40) {
      wrap.scrollLeft = want;
    }
  }

  // ── Log-Klassifikator ───────────────────────────────────────────────────
  // Nimmt Log-Zeilen (element + message + className) entgegen und entscheidet,
  // ob daraus ein Stripe-Marker wird. Gibt das Event-Objekt zurück oder null.
  //
  // Wichtig: cls kann eine KOMPOUND-Klasse sein wie "direct-action goal-me
  // is-goal t-me". Deshalb Word-Boundary-Regex statt strikter Gleichheit,
  // sonst würden z.B. Tore, die aus Karten-Direct-Actions entstehen, still
  // verschwinden.
  function classify(logEl, msg, cls) {
    if (!cls) return null;
    const has = (c) => new RegExp('(?:^|\\s)' + c + '(?:\\s|$)').test(cls);

    if (has('goal-me')) {
      return {
        type: 'goal',
        team: 'me',
        scorer: parseScorer(msg),
        note: excerpt(msg, 110),
      };
    }
    if (has('goal-opp')) {
      return {
        type: 'goal',
        team: 'opp',
        scorer: parseScorer(msg),
        note: excerpt(msg, 110),
      };
    }
    if (has('opp-card')) {
      return {
        type: 'oppCard',
        team: 'opp',
        cardName: parseCardName(msg),
        note: excerpt(msg, 110),
      };
    }
    if (has('player-shield')) {
      // Player-Shield ist das klarste "meine Karte hat gegriffen"-Signal:
      // Shield-Karte war vorher aktiv und hat jetzt eine Opp-Karte
      // blockiert, halbiert oder aufgedeckt. Pro Match typisch 1-2.
      return {
        type: 'shield',
        team: 'me',
        note: excerpt(msg, 110),
      };
    }
    // Player-Counter-Play: eine Counter-Karte vom Spieler, die auf eine
    // Opp-Drohung reagiert. Detection über die neue card-type-counter-
    // Klasse, die in ui.js an card-play-Log-Elementen angehängt wird.
    // Pro Match typisch 1-3 Counter-Plays — pro Halbzeit wenige.
    if (has('card-type-counter')) {
      return {
        type: 'counter',
        team: 'me',
        note: excerpt(msg, 110),
      };
    }
    if (has('interrupt-choice') && S.round > 0) {
      const phase = phaseForRound(S.round);
      if (!phase) return null;
      return {
        type: 'interrupt',
        team: 'me',
        phase,
        tactic: parseTactic(msg),
        note: null,
        // Interrupts haben feste Minuten-Anker und verbrauchen keinen
        // Event-Slot. Dadurch liegt der KO-Marker ganz am Anfang der
        // Zeitleiste und das erste "normale" Event derselben Runde
        // startet nicht direkt über dem KO.
        minuteOverride: interruptAnchorMinute(phase, S.round),
        skipSlotIncrement: true,
      };
    }
    return null;
  }

  function phaseForRound(r) {
    const total = roundsTotal();
    const halfSplit = Math.ceil(total / 2);   // 6 → 3
    if (r === 1) return 'kickoff';
    if (r === halfSplit + 1) return 'halftime';   // R4 bei 6 Runden
    if (r === total) return 'final';              // R6 bei 6 Runden
    return null;
  }

  function parseScorer(msg) {
    // Spielernamen in Kicklike sind PascalCase-Bigramme ("Finn Bauer").
    // Erster Name-Token nach dem "R{r}:"-Präfix wird mitgenommen.
    const stripped = msg.replace(/^R\d+:\s*/, '').replace(/[⚽🥅]/g, '');
    const m = stripped.match(/([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?)/);
    return m ? m[1] : null;
  }

  function parseCardName(msg) {
    // Opp-Card-Logs sehen aus wie: "R3: 🃏 PARK THE BUS — narrative · OFF -9"
    const m = msg.match(/🃏\s+([^—–·\n]+?)\s*(?:[—–]|·|$)/);
    if (m) return m[1].trim();
    // Fallback: alles nach dem ersten Trenner in Caps könnte der Name sein.
    const m2 = msg.match(/\b([A-Z][A-Z\s]{3,})\b/);
    return m2 ? m2[1].trim() : null;
  }

  function parseTactic(msg) {
    // "R1:   → Kickoff: Hohe Linie  [OFF +3]" → "Hohe Linie"
    let s = msg.replace(/^R\d+:\s*/, '');
    s = s.replace(/\[.*?\]/g, '');
    // Prefix "  → " und optional "Kickoff:" / "Halbzeit:" / "Finale:" / etc
    s = s.replace(/^\s*→\s*/, '');
    s = s.replace(/^[A-Za-zÄÖÜäöüß\s]+:\s*/, '');
    return s.trim();
  }

  function excerpt(msg, n) {
    const clean = msg
      .replace(/^R\d+:\s*/, '')
      .replace(/[🃏🛡👁⚽🥅📊📋]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return clean.length > n ? clean.slice(0, n - 1) + '…' : clean;
  }

  // ── Public API ──────────────────────────────────────────────────────────
  function initMatch(match) {
    const container = document.getElementById('round-indicator');
    if (!container) return;
    S.match = match || null;
    S.round = 0;
    S.minute = 0;
    S.events = [];
    S.eventSeq = 0;
    S.eventsInRound = 0;
    buildDom(container);
    updateClockUi();
    attachLogObserver();
  }

  // v53 — MutationObserver auf #match-log. Fängt JEDE neu angehängte
  // .log-line, auch die, die per direct-DOM-Append geschrieben werden
  // (z.B. card-play und direct-action-Lines in ui.js, die nicht durch
  // appendLog laufen). So werden Tore aus Direct-Actions nicht mehr
  // übersehen. Dedup über dataset.mhSeen — der synchrone appendLog-Pfad
  // setzt das Flag sofort, Observer sieht es beim Next-Microtask und
  // überspringt schon verarbeitete Zeilen.
  function attachLogObserver() {
    const logEl = document.getElementById('match-log');
    if (!logEl) return;
    if (S.logObserver) S.logObserver.disconnect();
    S.logObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (!node.classList || !node.classList.contains('log-line')) continue;
          if (node.dataset.mhSeen === '1') continue;
          const cls = node.className || '';
          const msg = node.textContent || '';
          try { onLogLine(node, msg, cls); } catch (_) { /* nice-to-have */ }
        }
      }
    });
    S.logObserver.observe(logEl, { childList: true });
  }

  function updateRound(round) {
    if (!round || round === S.round) return;
    S.round = round;
    S.eventsInRound = 0;
    // Clock mindestens auf Round-Start vorrücken.
    const rStart = roundStartMin(round);
    if (S.minute < rStart) S.minute = rStart;
    updateClockUi();
  }

  function onLogLine(logEl, msg, cls) {
    if (!S.el.events) return;   // noch nicht initialisiert
    // Dedup — appendLog- und Observer-Pfad triggern beide. Flag am Element
    // verhindert Doppel-Verarbeitung.
    if (logEl && logEl.dataset) {
      if (logEl.dataset.mhSeen === '1') return;
      logEl.dataset.mhSeen = '1';
    }
    const payload = classify(logEl, msg, cls);
    if (!payload) return;
    const id = 'mh-' + (++S.eventSeq);
    const minute = (payload.minuteOverride != null)
      ? payload.minuteOverride
      : minuteForNewEvent();
    S.minute = Math.max(S.minute, minute);
    if (!payload.skipSlotIncrement) S.eventsInRound++;
    // Override/Skip-Flags rausfiltern, bevor wir das Event ablegen — nur
    // die anzeigerelevanten Felder sollen im Event-Objekt landen.
    const { minuteOverride: _mo, skipSlotIncrement: _ssi, ...rest } = payload;
    const ev = { id, minute, logEl, ...rest };
    S.events.push(ev);
    if (logEl) logEl.dataset.mhEventId = id;
    renderEvents();
    updateClockUi();
  }

  // v53 — Öffentlicher Refresh-Hook. Kann von außen aufgerufen werden,
  // wenn sich match.matchPhase geändert hat ohne dass ein Log-Event
  // dranhängt (z.B. Round-Start-Reset vor dem ersten Simulations-Log der
  // neuen Runde). UI.renderStatDiffChips ruft das nach Setzen des
  // cp-Phase-Chips auf, damit Clock und cp-Chip synchron laufen.
  // v53 — Match-Ende-Abschluss: Playhead noch sichtbar bis 90' laufen
  // lassen, dann den Result-Screen öffnen. Der bestehende transform-
  // transition auf .mh-playhead (0.6s linear) macht das Gleiten; wir
  // setzen nur S.minute auf MINUTES_TOTAL und triggern updateClockUi.
  function completeMatch() {
    S.minute = MINUTES_TOTAL;
    updateClockUi();
  }

  function refresh() {
    updateClockUi();
  }

  // Styles einmalig injizieren. CSS-Variablen (--accent, --accent-2, etc.)
  // kommen aus :root in styles.css; wir bauen nur oben drauf.
  function injectStyles() {
    if (document.getElementById('mh-styles')) return;
    const style = document.createElement('style');
    style.id = 'mh-styles';
    style.textContent = `
.match-header .round-indicator.mh-root {
  grid-column: 1 / -1;
  display: block;
  margin-top: 10px;
  padding: 0;
}

/* Die Uhr sitzt als Block-Kind in .match-header .score unter den
   Score-Spans. .score hat bereits text-align: center — dadurch
   zentrieren sich die Inline-Texte der Uhr automatisch. Wichtig:
   nichts an .score selbst überschreiben, sonst kippen die 0-:-0
   Spans aus ihrer Anordnung. */
.match-header .score .mh-clock {
  display: block;
  margin-top: 4px;
  font-family: var(--font-display);
  font-size: 14px;
  line-height: 1;
  letter-spacing: 0.05em;
  text-shadow: none;            /* parent's 3px-shadow wegnehmen — nur der 0:0 soll glimmern */
}
.mh-clock-minute {
  color: var(--accent-3);
  letter-spacing: 0.04em;
}
.mh-clock-phase {
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-left: 8px;
}
.mh-stripe-wrap {
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--dim) transparent;
  border: 1px solid var(--dim);
  background: var(--bg);
}
.mh-stripe-wrap::-webkit-scrollbar { height: 6px; }
.mh-stripe-wrap::-webkit-scrollbar-thumb { background: var(--dim); }
.mh-stripe {
  display: block;
  width: 100%;
  min-width: 480px;
  height: 56px;
  overflow: visible;
}
.mh-pitch {
  fill: var(--bg-3);
}
.mh-past {
  fill: #000;
  opacity: 0.38;
  pointer-events: none;
  /* scaleX-Transition für weiches Mitwandern des Dunkel-Overlays. */
  transform-origin: 0 0;
  transition: transform 0.6s linear;
}
.mh-midline, .mh-ht-line {
  stroke: var(--dim);
  stroke-width: 0.5;
  pointer-events: none;
}
.mh-ht-line {
  stroke-dasharray: 2 3;
  opacity: 0.55;
}
.mh-midline { opacity: 0.3; }
.mh-ht-circle {
  fill: none;
  stroke: var(--dim);
  stroke-width: 0.5;
  opacity: 0.4;
  pointer-events: none;
}
.mh-playhead {
  stroke: var(--accent-3);
  stroke-width: 1.5;
  pointer-events: none;
  filter: drop-shadow(0 0 2px var(--accent-3));
  /* Glatt wandern statt springen. Die Position wird von updateClockUi per
     style.transform gesetzt, Easing übernimmt CSS. linear, weil Minuten
     gleichförmig fließen — ease-out würde am Ende jeder Runde abbremsen
     und dadurch ungleichmäßig wirken. */
  transition: transform 0.6s linear;
}

/* ── Marker ────────────────────────────────────────────────────────────
   Wichtig: KEINE transform- oder size-Transitions auf Hover (sonst
   jittern Marker mit nicht-zentrierter transform-origin). Stattdessen
   nur ein dezenter Helligkeits-Filter, der die Geometrie unberührt
   lässt. */
.mh-marker { cursor: pointer; }
.mh-marker:hover { filter: brightness(1.25); }
.mh-marker .mh-goal-ring {
  fill: var(--bg-2);
  stroke-width: 1.5;
}
.mh-team-me .mh-goal-ring { stroke: var(--accent); }
.mh-team-me .mh-goal-dot  { fill:   var(--accent); }
.mh-team-opp .mh-goal-ring { stroke: var(--accent-2); }
.mh-team-opp .mh-goal-dot  { fill:   var(--accent-2); }
.mh-card-rect { fill: var(--accent-2); }
.mh-card-letter {
  fill: var(--bg);
  font-family: var(--font-display);
  font-size: 7px;
  pointer-events: none;
}
.mh-shield-rect { fill: var(--accent); }
.mh-shield-letter {
  fill: var(--bg);
  font-family: var(--font-display);
  font-size: 7px;
  pointer-events: none;
}
.mh-counter-rect { fill: var(--accent); }
.mh-counter-letter {
  fill: var(--bg);
  font-family: var(--font-display);
  font-size: 7px;
  pointer-events: none;
}
.mh-interrupt-line {
  stroke: var(--gold);
  stroke-width: 1.25;
  opacity: 0.85;
  pointer-events: none;
}
.mh-interrupt-badge { fill: var(--gold); }
.mh-interrupt-label {
  fill: var(--bg);
  font-family: var(--font-display);
  font-size: 6px;
  letter-spacing: 0.03em;
  pointer-events: none;
}

.log-line.mh-log-highlight {
  animation: mh-log-pulse 1.6s ease-out;
  border-left: 2px solid var(--accent-3);
  padding-left: 4px;
}
@keyframes mh-log-pulse {
  0%   { background: rgba(42,228,255,0.25); }
  100% { background: transparent; }
}

/* Defensive Absicherung: das alte round-dot-Styling darf nicht mehr
   greifen — es gibt keine round-dots mehr. */
.match-hud .round-dot { display: none; }

@media (max-width: 640px) {
  .match-header .score .mh-clock { font-size: 12px; }
  .mh-stripe { min-width: 560px; }
}
`;
    document.head.appendChild(style);
  }

  // ── Recap-Mount ─────────────────────────────────────────────────────────
  // Baut einen statischen Stripe in einen beliebigen Container (z.B. den
  // Result-Screen). Rendert alle Events des abgeschlossenen Matches ohne
  // Live-Clock oder Playhead. Klicks auf Marker sind no-ops (keine Log-
  // Zeile mehr zum Springen). Tooltips bleiben aktiv — die sind auf der
  // Recap-Page auch nützlich, weil man nochmal draufschauen will.
  function mountRecap(container) {
    if (!container) return;
    container.innerHTML = '';
    container.classList.add('mh-root');
    container.classList.add('mh-recap');

    const NS = 'http://www.w3.org/2000/svg';
    const wrap = document.createElement('div');
    wrap.className = 'mh-stripe-wrap';

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'mh-stripe');
    svg.setAttribute('viewBox', '0 0 640 54');
    svg.setAttribute('preserveAspectRatio', 'none');

    // Pitch + Orientierungslinien: wie im Live-Stripe, nur ohne past-
    // overlay und ohne Playhead.
    const pitch = document.createElementNS(NS, 'rect');
    pitch.setAttribute('class', 'mh-pitch');
    pitch.setAttribute('x', '0'); pitch.setAttribute('y', '0');
    pitch.setAttribute('width', '640'); pitch.setAttribute('height', '54');
    svg.appendChild(pitch);

    const midline = document.createElementNS(NS, 'line');
    midline.setAttribute('class', 'mh-midline');
    midline.setAttribute('x1', '0'); midline.setAttribute('y1', '27');
    midline.setAttribute('x2', '640'); midline.setAttribute('y2', '27');
    svg.appendChild(midline);

    const htLine = document.createElementNS(NS, 'line');
    htLine.setAttribute('class', 'mh-ht-line');
    htLine.setAttribute('x1', '320'); htLine.setAttribute('y1', '0');
    htLine.setAttribute('x2', '320'); htLine.setAttribute('y2', '54');
    svg.appendChild(htLine);

    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('class', 'mh-ht-circle');
    circle.setAttribute('cx', '320'); circle.setAttribute('cy', '27');
    circle.setAttribute('r', '12');
    svg.appendChild(circle);

    const eventsGroup = document.createElementNS(NS, 'g');
    eventsGroup.setAttribute('class', 'mh-events');
    svg.appendChild(eventsGroup);

    // Alle Events aus S (die letzte Match-Session) durchiterieren und
    // Marker bauen. buildMarker hängt eh click-Handler an, aber die
    // rufen jumpToLog → ev.logEl ist im Result-Screen nicht mehr im DOM,
    // also kein visueller Effekt — no-op via try/catch.
    for (const ev of S.events) {
      eventsGroup.appendChild(buildMarker(ev));
    }

    wrap.appendChild(svg);
    container.appendChild(wrap);
  }

  injectStyles();

  KL.matchHud = {
    initMatch,
    updateRound,
    onLogLine,
    mountRecap,
    refresh,
    completeMatch,
    // Debug / Test-Helfer (nicht für Produktion nötig, aber praktisch).
    _state: S,
  };
})();
