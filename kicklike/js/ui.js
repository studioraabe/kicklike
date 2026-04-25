function getEffectiveTeamStats(match) {
  const totals = { offense: 0, defense: 0, tempo: 0, vision: 0, composure: 0 };
  const squad = match?.squad || [];
  const count = Math.max(1, squad.length);
  for (const player of squad) {
    const stats = computePlayerStats(player, match);
    for (const key of Object.keys(totals)) totals[key] += (stats[key] || 0);
  }
  for (const key of Object.keys(totals)) totals[key] = Math.round(totals[key] / count);
  return totals;
}

function getRoleEffectiveStats(match, role) {
  const player = (match?.squad || []).find(p => p.role === role);
  return player ? computePlayerStats(player, match) : { offense: 50, defense: 50, tempo: 50, vision: 50, composure: 50 };
}

function getMatchRates(match) {
  const s = match?.stats || {};
  return {
    myBuildupRate: s.myBuildups ? Math.round((s.myBuildupsSuccess / s.myBuildups) * 100) : 0,
    oppBuildupRate: s.oppBuildups ? Math.round((s.oppBuildupsSuccess / s.oppBuildups) * 100) : 0,
    myAccuracy: s.myShots ? Math.round((s.myShotsOnTarget / s.myShots) * 100) : 0,
    oppAccuracy: s.oppShots ? Math.round((s.oppShotsOnTarget / s.oppShots) * 100) : 0
  };
}

function buildPhaseGuide(match, phase) {
  const normalizedPhase = (phase === 'halftime_focus' || phase === 'halftime_sub') ? 'halftime' : phase;
  const lines = [];
  const effTeam = getEffectiveTeamStats(match);
  const pmStats = getRoleEffectiveStats(match, 'PM');
  const lfStats = getRoleEffectiveStats(match, 'LF');
  const twStats = getRoleEffectiveStats(match, 'TW');
  const vtStats = getRoleEffectiveStats(match, 'VT');
  const rates = getMatchRates(match);
  const opp = match?.opp;
  if (!opp) return lines;

  if (normalizedPhase === 'kickoff') {
    const controlMe = effTeam.vision + Math.round(effTeam.composure * 0.95) + Math.round(effTeam.tempo * 0.60);
    const controlOpp = opp.stats.vision + Math.round(opp.stats.composure * 0.95) + Math.round((opp.stats.tempo + (opp._roundBuffs?.tempo || 0)) * 0.60);
    lines.push(I18N.t('ui.phaseGuide.kickoffBuildUp', { vision: pmStats.vision, composure: pmStats.composure }));
    lines.push(I18N.t('ui.phaseGuide.kickoffControl', { delta: `${controlMe - controlOpp >= 0 ? '+' : ''}${controlMe - controlOpp}` }));
    lines.push(I18N.t('ui.phaseGuide.kickoffWide', {
      lfTempo: lfStats.tempo,
      oppTempo: opp.stats.tempo,
      hold: Math.round(vtStats.defense * 0.45 + twStats.defense * 0.55),
      oppOffense: opp.stats.offense
    }));
  } else if (normalizedPhase === 'halftime') {
    lines.push(I18N.t('ui.phaseGuide.halftimeBuildUp', { myRate: rates.myBuildupRate, oppRate: rates.oppBuildupRate }));
    lines.push(I18N.t('ui.phaseGuide.halftimeAccuracy', { myAcc: rates.myAccuracy, oppAcc: rates.oppAccuracy }));
    lines.push(I18N.t('ui.phaseGuide.halftimeDefense', {
      hold: Math.round(vtStats.defense * 0.45 + twStats.defense * 0.55),
      saves: match.stats?.saves || 0
    }));
  } else if (normalizedPhase === 'final') {
    const scoreDiff = (match?.scoreMe || 0) - (match?.scoreOpp || 0);
    if (scoreDiff < 0) {
      lines.push(I18N.t('ui.phaseGuide.finalChaseStatus', { buildup: rates.myBuildupRate, accuracy: rates.myAccuracy }));
      lines.push(I18N.t('ui.phaseGuide.finalChaseAdvice'));
    } else if (scoreDiff > 0) {
      lines.push(I18N.t('ui.phaseGuide.finalProtectStatus', {
        oppRate: rates.oppBuildupRate,
        hold: Math.round(vtStats.defense * 0.45 + twStats.defense * 0.55)
      }));
      lines.push(I18N.t('ui.phaseGuide.finalProtectAdvice'));
    } else {
      lines.push(I18N.t('ui.phaseGuide.finalLevelStatus', {
        buildup: rates.myBuildupRate,
        accuracy: rates.myAccuracy,
        saves: match.stats?.saves || 0
      }));
      lines.push(I18N.t('ui.phaseGuide.finalLevelAdvice'));
    }
  }

  return lines.slice(0, 3);
}

// Extrahiert Bedeutungsträger aus einem Hint/Guide-Text zur Deduplikation.
// Wirft Stopwords, Satzzeichen und Prozent-/Punktations-Boilerplate raus.
// Behält Stats-Namen (vis, com, off, def, tmp), Rollen (pm, lf, st, tw, vt),
// Konzepte (build-up, control, pressing, counter) und Zahlen.
const HINT_STOPWORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being',
  'and','or','but','if','then','than','that','this','these','those',
  'for','of','to','in','on','at','by','with','from','as','into',
  'it','its','you','your','they','their','them','we','our',
  'has','have','had','will','would','should','could','can','may',
  'not','no','yes','so','too','very','just','only','more','most','less',
  'through','best','full','value','help','helps','helpful','looks','look',
  'most','some','any','many','now','early','late'
]);

function extractHintTokens(text) {
  if (!text) return new Set();
  // Split on non-word chars; keep hyphenated terms together (build-up)
  const raw = String(text).toLowerCase()
    .replace(/[,.!?:;()'"`]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const tokens = new Set();
  for (const t of raw) {
    if (t.length < 2) continue;
    if (HINT_STOPWORDS.has(t)) continue;
    // Strip trailing % from numbers but keep the number
    const cleaned = t.replace(/%$/, '');
    tokens.add(cleaned);
  }
  return tokens;
}

function buildContextHint(match, phase, state) {
  const normalizedPhase = (phase === 'halftime_focus' || phase === 'halftime_sub') ? 'halftime' : phase;
  const hints = [];
  const opp = match?.opp;
  if (!opp) return hints;
  const pmStats = getRoleEffectiveStats(match, 'PM');
  const lfStats = getRoleEffectiveStats(match, 'LF');
  const twStats = getRoleEffectiveStats(match, 'TW');
  const vtStats = getRoleEffectiveStats(match, 'VT');
  const effTeam = getEffectiveTeamStats(match);
  const rates = getMatchRates(match);

  const push = (type, text) => { if (hints.length < 3 && text) hints.push({ type, text }); };

  if (normalizedPhase === 'kickoff') {
    if (opp.isBoss) {
      push('warn', I18N.t('ui.hints.bossWarning'));
    }
    if (opp.traits?.includes('ironwall')) {
      push('warn', I18N.t('ui.hints.ironwallEarly'));
    }
    if (opp.traits?.includes('sniper') && hints.length < 2) {
      push('warn', I18N.t('ui.hints.sniperWarning'));
    }
    const lf = match.squad?.find(p => p.role === 'LF');
    if (hints.length < 3 && lf) {
      const diff = lfStats.tempo - opp.stats.tempo;
      if (diff >= 8) {
        push('good', I18N.t('ui.hints.lfTempoEdgeExact', { name: lf.name, myTempo: lfStats.tempo, oppTempo: opp.stats.tempo }));
      } else if (diff <= -8) {
        push('warn', I18N.t('ui.hints.lfTempoRiskExact', { myTempo: lfStats.tempo, oppTempo: opp.stats.tempo }));
      }
    }
    if (hints.length < 3 && (pmStats.vision < opp.stats.vision - 4 || pmStats.composure < opp.stats.composure - 4)) {
      push('warn', I18N.t('ui.hints.shakyBuildUp', { vision: pmStats.vision, composure: pmStats.composure }));
    }
    if (hints.length < 3) {
      const myHold = Math.round(vtStats.defense * 0.45 + twStats.defense * 0.55);
      if (myHold < opp.stats.offense - 4) {
        push('warn', I18N.t('ui.hints.backlineUnderPressure', { hold: myHold, oppOffense: opp.stats.offense }));
      } else if (effTeam.vision + effTeam.composure > opp.stats.vision + opp.stats.composure + 8) {
        push('good', I18N.t('ui.hints.earlyControl'));
      }
    }
    if (hints.length < 3 && opp.traits?.includes('presser_opp')) {
      push('warn', I18N.t('ui.hints.presserOppActive'));
    }
  }

  if (normalizedPhase === 'halftime') {
    const deficit = match.scoreOpp - match.scoreMe;
    const lead = match.scoreMe - match.scoreOpp;
    if (deficit >= 2) {
      push('warn', I18N.t('ui.hints.scoreTrailing'));
    } else if (lead >= 2) {
      push('good', I18N.t('ui.hints.scoreLeading'));
    }
    if (hints.length < 3 && rates.myBuildupRate <= 45) {
      push('warn', I18N.t('ui.hints.buildupLow', { rate: rates.myBuildupRate }));
    }
    if (hints.length < 3 && rates.myBuildupRate >= 50 && rates.myAccuracy <= 40 && (match.stats?.myShots || 0) >= 2) {
      push('warn', I18N.t('ui.hints.accuracyLow', { rate: rates.myAccuracy }));
    }
    if (hints.length < 3 && rates.oppBuildupRate >= 55) {
      push('warn', I18N.t('ui.hints.oppBuildupHigh', { rate: rates.oppBuildupRate }));
    }
    if (hints.length < 3 && (match._htPressingBlocks || 0) > 0) {
      push('info', I18N.t('ui.hints.pressingBlocked', { n: match._htPressingBlocks }));
    }
    if (hints.length < 3 && (match._htCountersFired || 0) > 0) {
      push('info', I18N.t('ui.hints.countersFired', { n: match._htCountersFired }));
    }
    if (hints.length < 3 && match.squad) {
      const hotPlayers = match.squad.filter(p => (p.form || 0) >= 2);
      const crisisPlayers = match.squad.filter(p => (p.form || 0) <= -2);
      if (crisisPlayers.length > 0) {
        push('warn', I18N.t('ui.hints.squadInCrisis'));
      } else if (hotPlayers.length >= 2) {
        push('good', I18N.t('ui.hints.squadInForm'));
      }
    }
    if (hints.length < 3 && opp.traits?.includes('clutch_opp')) {
      push('warn', I18N.t('ui.hints.clutchOppLate'));
    }
  }

  if (normalizedPhase === 'final') {
    const deficit = match.scoreOpp - match.scoreMe;
    const lead = match.scoreMe - match.scoreOpp;
    if (deficit > 0) {
      push('warn', I18N.t('ui.hints.scoreTrailing'));
    } else if (lead > 0) {
      push('good', I18N.t('ui.hints.scoreLeading'));
    }
    if (hints.length < 3 && deficit > 0) {
      if (rates.myBuildupRate <= 45) push('warn', I18N.t('ui.hints.finalNeedEntry', { rate: rates.myBuildupRate }));
      else push('warn', I18N.t('ui.hints.finalNeedPressure', { rate: rates.myAccuracy }));
    } else if (hints.length < 3 && lead > 0) {
      if (rates.oppBuildupRate >= 55) push('warn', I18N.t('ui.hints.oppBuildupHigh', { rate: rates.oppBuildupRate }));
      else push('good', I18N.t('ui.hints.finalProtectionWorking'));
    }
    if (hints.length < 3 && typeof getBench === 'function') {
      const bench = getBench();
      const leg = bench.find(p => p.isLegendary);
      if (leg) {
        push('info', I18N.t('ui.hints.finalLegendaryOnBench', { name: leg.name }));
      }
    }
    if (hints.length < 3 && match.activeTacticTags?.length) {
      const tags = new Set(match.activeTacticTags);
      if (tags.has('pressing') || tags.has('aggressiv')) {
        push('info', I18N.t('ui.hints.tacticSynergyKickoff'));
      }
    }
  }

  return hints;
}

// ============================================================================
// v53 — Log-Tier-Mapping.
// Jede semantische Log-Klasse, die aus Engine oder UI an appendLog geht,
// wird hier auf Tier + Ton abgebildet (siehe Tier-Block in styles.css).
// Unbekannte Klassen fallen auf T1 Narrativ (Default) zurück — das ist
// explizit gewollt, damit neue Klassen nicht versehentlich unauffällig
// bleiben, bis sie hier eingetragen werden.
// ============================================================================
const LOG_TIER_MAP = {
  // T2 Mechanik ────────────────────────────────────────────────────────────
  'trigger':          'is-mechanic t-trigger',  // Spieler-Trait gefeuert
  'card-play':        'is-mechanic t-me',       // Eigene Karte gespielt
  'card-narrative':   'is-mechanic t-me',       // Karten-Flavor
  'card-summary':     'is-mechanic t-me',       // Karten-Wirkung zusammengefasst
  'player-shield':    'is-mechanic t-me',       // Shield aktiv
  'micro-boost':      'is-mechanic t-me',       // Stat-Micro-Boost auf mich
  'condition-gain':   'is-mechanic t-me',       // Kondition regeneriert
  'role-affinity':    'is-mechanic t-me',       // Rollen-Affinität-Bonus
  'interrupt-choice': 'is-mechanic t-me',       // Kickoff/Halbzeit/Final-Taktik
  'tactic-feedback':  'is-mechanic t-neutral',  // Taktik-Wirkung sichtbar
  'streak':           'is-mechanic t-neutral',  // Hot/Cold-Streak-Wechsel
  'opp-card':         'is-mechanic t-opp',      // Gegner-Karte
  'opp-save':         'is-mechanic t-opp',      // Gegner-Keeper hält
  'opp-adapt':        'is-mechanic t-opp',      // Gegner stellt um
  'fatigue-cost':     'is-mechanic t-warn',     // Ermüdungskosten
  'card-yellow':      'is-mechanic t-warn',     // Gelbe Karte
  'card-red':         'is-mechanic t-warn',     // Rote Karte
  // T3 Strukturell ─────────────────────────────────────────────────────────
  'round-header':     'is-structural',
  'kickoff':          'is-structural',
  // T4 Tor ─────────────────────────────────────────────────────────────────
  'goal-me':          'is-goal t-me',
  'goal-opp':         'is-goal t-opp',
  // T1 Narrativ (kein Tier-Override, fällt auf Default) ────────────────────
  'decision':         '',   // Narrative Decision-Zeilen
  'phase-shift':      '',
  'match-event':      '',
  'fatigue-narration':'',
  'paused-hint':      '',
  'direct-action':    '',
  // v0.42 — Narrativ-Aufbau-Kette vor dem Tor-Event (Phase A des
  // Narrativ-Plans). Eigene Tier-Klasse 'is-narrative' damit CSS eine
  // subtilere, italische Formatierung geben kann — klar abgehoben vom
  // mechanischen Log, ohne das Tor-Event zu überstrahlen.
  'narrative':        'is-narrative',
};

// v0.48 — Log-Tooltip-Keys pro cls-Klasse. Der appendLog-Pfad hängt
// einen data-kl-tip an die Log-Zeile, sobald eine Klasse in der Map
// steht. Inhalte kommen aus ui.logTip.{key} in den Locales. Bewusst
// nicht für JEDE Klasse — strukturelle (round-header, kickoff) und
// selbsterklärende (goal-me, goal-opp, direct-action) brauchen keine
// Erklärung. Fokus: Klassen wo ein Spieler fragen könnte "was bedeutet
// das jetzt mechanisch?" — Traits, Counter, Streaks, Ermüdung, Karten.
const LOG_TIP_KEY = {
  'trigger':          'ui.logTip.trigger',
  'card-play':        'ui.logTip.cardPlay',
  'card-summary':     'ui.logTip.cardSummary',
  'player-shield':    'ui.logTip.playerShield',
  'micro-boost':      'ui.logTip.microBoost',
  'condition-gain':   'ui.logTip.conditionGain',
  'role-affinity':    'ui.logTip.roleAffinity',
  'interrupt-choice': 'ui.logTip.interruptChoice',
  'tactic-feedback':  'ui.logTip.tacticFeedback',
  'streak':           'ui.logTip.streak',
  'opp-card':         'ui.logTip.oppCard',
  'opp-save':         'ui.logTip.oppSave',
  'opp-adapt':        'ui.logTip.oppAdapt',
  'fatigue-cost':     'ui.logTip.fatigueCost',
  'card-yellow':      'ui.logTip.cardYellow',
  'card-red':         'ui.logTip.cardRed',
  'phase-shift':      'ui.logTip.phaseShift'
};

function logTipFor(cls) {
  if (!cls) return null;
  const parts = String(cls).split(/\s+/).filter(Boolean);
  for (const p of parts) {
    const key = LOG_TIP_KEY[p];
    if (key && window.I18N) {
      const txt = window.I18N.t(key);
      if (txt && txt !== key) return txt;
    }
  }
  return null;
}

// Tier-Mapping auf einen Class-String anwenden. `cls` kann mehrere
// space-separierte Klassen enthalten (z.B. "decision interrupt-choice");
// die erste, die im Map vorkommt, gewinnt. Dabei gewinnen spezifischere
// Klassen vor generischen — darum kommt interrupt-choice vor decision
// durch die Iteration in Array-Reihenfolge des Splits.
function tierClass(cls) {
  if (!cls) return '';
  const parts = String(cls).split(/\s+/).filter(Boolean);
  // Spezifischere zuerst: durchlaufe die Klassen, nimm die erste mit Map-Eintrag
  // ungleich Default. Bei mehreren Treffern gewinnt die zuerst gefundene.
  let fallback = null;
  for (const p of parts) {
    if (Object.prototype.hasOwnProperty.call(LOG_TIER_MAP, p)) {
      const tier = LOG_TIER_MAP[p];
      if (tier) return tier;
      if (fallback === null) fallback = '';
    }
  }
  return fallback || '';
}

// Convenience: baut den vollständigen class-String einer Log-Zeile,
// inkl. semantischer Klasse + Tier-Klasse. Für alle direkten log-line-
// DOM-Erzeuger in ui.js.
function logLineClass(cls) {
  const t = tierClass(cls);
  return 'log-line ' + cls + (t ? ' ' + t : '');
}

const UI = {
  // Rolle-ID → englische UI-Abkürzung. Interne IDs bleiben deutsch (TW/VT/LF)
  // um Daten-Breaking zu vermeiden. Nur Display ist englisch.
  ROLE_DISPLAY: { TW:'GK', VT:'DF', PM:'PM', LF:'WG', ST:'ST' },
  roleAbbr(role) { return this.ROLE_DISPLAY[role] || role; },

  showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  },

  renderStart() {
    // Continue-Run affordance. If a persisted run exists:
    //   1. Insert a "Continue Run" primary button at the top of the
    //      actions column (before the existing New-Run button).
    //   2. Insert a summary line below it (team · tier · season ·
    //      match · record).
    //   3. Wrap the existing New-Run button with a confirm-dialog so
    //      the player doesn't wipe their save accidentally.
    //
    // Previously we rebuilt the actions column via innerHTML with inline
    // onclick attributes. That pattern broke "New Run" because the
    // confirm message (containing double quotes and umlauts) had to be
    // quote-escaped and the naive JSON.stringify closed the outer
    // onclick="..." early. The chirurgical insert below avoids all
    // escaping issues — there are no user-authored strings in any
    // attribute. It's also idempotent: re-renders (e.g. on language
    // switch) don't stack duplicate buttons or dangling confirms.
    const actionsEl = document.querySelector('#screen-start .menu-actions');
    const persistence = window.KL?.persistence;
    const resumeInfo = persistence?.hasSave() ? persistence.summary() : null;
    if (actionsEl) {
      // ── (a) Tear down any leftover resume UI from a previous render ──
      const oldResumeBtn  = actionsEl.querySelector('[data-resume-btn]');
      const oldSummary    = actionsEl.querySelector('[data-resume-summary]');
      if (oldResumeBtn)  oldResumeBtn.remove();
      if (oldSummary)    oldSummary.remove();
      // Unwrap the New-Run button's confirm-wrapper if one was attached.
      // The wrapper handler is stashed on the element so we can remove it
      // surgically (replaceNode trick would also work but this is clearer).
      const existingNewRunBtn = actionsEl.querySelector('[onclick*="FLOW.newRun"]');
      if (existingNewRunBtn && existingNewRunBtn._resumeConfirmHandler) {
        existingNewRunBtn.removeEventListener('click', existingNewRunBtn._resumeConfirmHandler, true);
        existingNewRunBtn._resumeConfirmHandler = null;
      }

      // ── (b) If a save exists, build and insert the resume UI ─────────
      if (resumeInfo) {
        const t = (k, vars) => {
          const s = I18N.t(k, vars);
          return (s && s !== k) ? s : null;
        };
        const tierLabel = t('ui.labels.tier.' + resumeInfo.tier)
          || resumeInfo.tier.toUpperCase();
        const modeLabel = resumeInfo.cupMode
          ? (t('ui.labels.cupModeLabel') || 'CUP')
          : (t('ui.labels.seasonLabel', { n: resumeInfo.seasonNumber })
             || ('S' + resumeInfo.seasonNumber));
        const recordLabel = `${resumeInfo.wins}W ${resumeInfo.draws}D ${resumeInfo.losses}L`;
        const matchLabel = resumeInfo.cupMode
          ? (t('ui.start.cupMatch', { n: resumeInfo.matchNumber })
             || ('Cup M' + resumeInfo.matchNumber))
          : (t('ui.start.leagueMatch', { n: resumeInfo.matchNumber + 1 })
             || ('Match ' + (resumeInfo.matchNumber + 1)));
        const summaryLine =
          `${resumeInfo.teamName || '—'}  ·  ${tierLabel} ${modeLabel}  ·  ${matchLabel}  ·  ${recordLabel}`;
        const continueBtnLabel = t('ui.start.continueRun') || 'Continue Run';
        const newRunConfirm    = t('ui.start.newRunConfirm')
          || 'Starting a new run will delete your saved progress. Continue?';

        // Build nodes programmatically — textContent is safe against
        // any characters the player put in their team name.
        const continueBtn = document.createElement('button');
        continueBtn.className = 'btn primary';
        continueBtn.setAttribute('data-resume-btn', '');
        continueBtn.textContent = continueBtnLabel;
        continueBtn.addEventListener('click', () => FLOW.resumeRun());

        const summaryEl = document.createElement('div');
        summaryEl.className = 'menu-resume-summary';
        summaryEl.setAttribute('data-resume-summary', '');
        summaryEl.textContent = summaryLine;

        actionsEl.insertBefore(continueBtn, actionsEl.firstChild);
        actionsEl.insertBefore(summaryEl, continueBtn.nextSibling);

        // Wrap the existing New-Run click with a confirm. Capture-phase
        // listener so we intercept before the inline onclick fires.
        // If the user declines, stopImmediatePropagation prevents the
        // inline handler from running.
        if (existingNewRunBtn) {
          const handler = (e) => {
            if (!confirm(newRunConfirm)) {
              e.stopImmediatePropagation();
              e.preventDefault();
            }
          };
          existingNewRunBtn.addEventListener('click', handler, true);
          existingNewRunBtn._resumeConfirmHandler = handler;
          // Demote New-Run from primary to secondary so Continue is the
          // visual default. Remove the `primary` class only for as long
          // as the resume UI is active; the teardown in (a) doesn't
          // re-add it but renderStart always runs before showScreen, so
          // the class state is deterministic per render.
          existingNewRunBtn.classList.remove('primary');
        }
      } else {
        // No save — ensure the New-Run button is back in primary style.
        // Covers the case where a previous render had a save, demoted
        // the button, and now the save has been cleared.
        const newRunBtn = actionsEl.querySelector('[onclick*="FLOW.newRun"]');
        if (newRunBtn && !newRunBtn.classList.contains('primary')) {
          newRunBtn.classList.add('primary');
        }
      }
    }

    const hsEl = document.getElementById('start-highscore');
    if (hsEl) {
      const best = loadHighscore();
      if (best) {
        const outcomeLabel = I18N.t(`ui.labels.outcome${best.outcome.charAt(0).toUpperCase() + best.outcome.slice(1).replace(/_(.)/g, (_, c) => c.toUpperCase())}`);
        const seasons = best.seasonsPlayed || 1;
        const seasonLabel = seasons > 1
          ? ` · ${seasons} ${I18N.t('ui.labels.seasons') || 'seasons'}`
          : '';
        // Use runScore as the primary number (post v48). Falls back
        // to legacy `points` if old save data lacks runScore.
        const score = (typeof best.runScore === 'number') ? best.runScore : best.points;
        hsEl.textContent =
          '✦ ' + (outcomeLabel || best.outcome) +
          seasonLabel +
          ` · ${score} pts · ${best.wins}W ${best.draws}D ${best.losses}L ✦`;
      } else {
        hsEl.textContent = '';
      }
    }

    // Footer version label — populated from KL.VERSION each render so
    // the HTML stays static between releases. Silent if the constant
    // somehow isn't loaded (version.js is first script but be defensive).
    const versionEl = document.getElementById('footer-version');
    if (versionEl) {
      versionEl.textContent = (window.KL && window.KL.VERSION) || '–';
    }
    const channelEl = document.getElementById('footer-channel');
    if (channelEl) {
      const ch = (window.KL && window.KL.VERSION_CHANNEL) || '';
      if (ch && ch !== 'stable') {
        channelEl.textContent = ch.toUpperCase();
        channelEl.style.display = '';
      } else {
        channelEl.textContent = '';
        channelEl.style.display = 'none';
      }
    }

    // Telemetry footer controls — surface only while test-run recording
    // is active. The download link label reflects what's exportable: a
    // full run record if one exists, or a placeholder when nothing has
    // been captured yet (e.g. telemetry enabled mid-session).
    const telemOn = !!(window.KL?.telemetry?.isEnabled?.());
    const telemLink = document.getElementById('footer-telemetry-link');
    const telemOff  = document.getElementById('footer-telemetry-off');
    const telemElems = document.querySelectorAll('.menu-footer-telemetry-only');
    for (const el of telemElems) {
      el.style.display = telemOn ? '' : 'none';
    }
    if (telemLink) {
      const hasData = !!(window.KL?.telemetry?.hasRun?.());
      telemLink.textContent = hasData ? '⬇ TEST RUN (JSON)' : '⬇ TEST RUN (empty)';
      telemLink.classList.toggle('disabled', !hasData);
    }
    if (telemOff) {
      telemOff.classList.add('menu-footer-warn');
    }

    UI.showScreen('screen-start');
  },

  // ─── Meta-Codex (v52) ────────────────────────────────────────────────────
  // Three-tab persistent progress page. Data read through KL.codex which
  // backs onto localStorage. Codex lifecycle:
  //   openCodex()  → show screen + default to achievements tab
  //   closeCodex() → back to start
  //   switchCodexTab(name) → re-render content for the selected tab
  // No build step — content containers are flushed and rebuilt per switch.
  _codexCurrentTab: 'achievements',

  openCodex() {
    UI._codexCurrentTab = 'achievements';
    UI.renderCodex();
    UI.showScreen('screen-codex');
  },

  closeCodex() {
    UI.renderStart();
  },

  // ─── Manual modal (v52.1) ───────────────────────────────────────────────
  // Detailed in-game reference reachable from the start screen how-to
  // line. Separate from the codex (which is progress-tracking across
  // runs) — the manual is pure reference: what systems exist, how they
  // interact, what the numbers mean.
  //
  // Manual-Body-Helper: rendert einen Absatz-String aus der i18n-Datei
  // mit minimalem Markdown zu HTML. Unterstützt **bold** und *italic*
  // (der Rest wird escaped, um XSS zu vermeiden). Die Escape-Reihenfolge
  // ist wichtig: erst HTML-escapen, dann Markdown-Tags wieder zulassen
  // — sonst würden User-typable < > Zeichen durchschlagen.
  _escapeManualHtml(s) {
    return String(s).replace(/[&<>"']/g,
      c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  },

  openManual() {
    const body = document.getElementById('manual-body');
    const modal = document.getElementById('manual-modal');
    if (!body || !modal) return;
    body.innerHTML = '';
    UI._renderManualSections(body);
    modal.style.display = 'flex';
  },

  closeManual(ev) {
    // Called both as button-handler (no ev) and as overlay-click handler
    // (ev present). Overlay-click only closes when the click is on the
    // backdrop itself — child clicks have already stopped propagation.
    if (ev && ev.target.id !== 'manual-modal') return;
    const modal = document.getElementById('manual-modal');
    if (modal) modal.style.display = 'none';
  },

  // ─── Changelog modal ─────────────────────────────────────────────────
  // Player-facing release notes. Data lives in I18N under ui.changelog.
  // Shape v0.36.1: { title, versions: [{ version, title, entries: [{title,
  // body}] }] }. Each version is rendered as a <details> accordion block
  // so older versions stay accessible but don't clutter the current-release
  // view. The newest version (index 0) is open by default; older versions
  // collapse. Older data shape with a flat `entries` array is still
  // supported for backwards-compat — gets rendered as a single "Current"
  // version block.
  openChangelog() {
    const body = document.getElementById('changelog-body');
    const modal = document.getElementById('changelog-modal');
    const versionLabel = document.getElementById('changelog-version-label');
    if (!body || !modal) return;
    if (versionLabel) {
      const v = (window.KL && window.KL.VERSION) || '';
      versionLabel.textContent = v ? ' v' + v : '';
    }
    body.innerHTML = '';
    UI._renderChangelogVersions(body);
    modal.style.display = 'flex';
  },

  closeChangelog(ev) {
    // Overlay-click semantics mirror closeManual: the click must land
    // on the backdrop itself. Inner clicks have stopPropagation on them.
    if (ev && ev.target.id !== 'changelog-modal') return;
    const modal = document.getElementById('changelog-modal');
    if (modal) modal.style.display = 'none';
  },

  // ─── Telemetry UI (test-run recorder) ─────────────────────────────────
  // Thin UI wrappers over KL.telemetry. The module itself is self-
  // sufficient and fully invocable from the console; these methods
  // exist so the footer's small surface can call into it without every
  // caller having to null-check KL.telemetry first.

  downloadTelemetry() {
    const T = window.KL?.telemetry;
    if (!T) return;
    if (!T.hasRun || !T.hasRun()) {
      alert(I18N.t('ui.telemetry.emptyNotice') || 'No test-run data yet. Play at least one match with telemetry enabled.');
      return;
    }
    const ok = T.download();
    if (!ok) {
      alert(I18N.t('ui.telemetry.downloadFailed') || 'Telemetry download failed. See console for details.');
    }
  },

  toggleTelemetry(on) {
    const T = window.KL?.telemetry;
    if (!T) return;
    const result = T.setEnabled(!!on);
    // If the user just turned it off from the footer, re-render so the
    // footer loses the telemetry controls immediately.
    if (!result) UI.renderStart();
  },

  _renderChangelogVersions(container) {
    // Data shape (v0.36.1+):
    //   { versions: [ { version, title, entries: [{title, body}] }, ... ] }
    //
    // Backwards-compat fallback:
    //   { entries: [{title, body}] }  — rendered under a single "Current"
    //                                    version block with no accordion
    //
    // First version (index 0) opens by default; later versions stay
    // collapsed. Native <details>/<summary> gives us accordion behaviour
    // with zero JS and correct keyboard/screen-reader semantics.
    const data = I18N.t('ui.changelog');
    let versions = null;
    if (data && typeof data === 'object' && Array.isArray(data.versions)) {
      versions = data.versions;
    } else {
      // Legacy flat shape — wrap the flat entries list as a single
      // unlabelled version block.
      const flat = I18N.t('ui.changelog.entries');
      if (Array.isArray(flat) && flat.length) {
        versions = [{ version: null, title: null, entries: flat }];
      }
    }
    if (!versions || versions.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'dim';
      empty.textContent = '—';
      container.appendChild(empty);
      return;
    }
    versions.forEach((ver, idx) => {
      if (!ver || !Array.isArray(ver.entries) || ver.entries.length === 0) return;
      const details = document.createElement('details');
      details.className = 'changelog-version';
      if (idx === 0) details.setAttribute('open', '');
      const summary = document.createElement('summary');
      summary.className = 'changelog-version-head';
      const labelParts = [];
      if (ver.version) labelParts.push('v' + ver.version);
      if (ver.title)   labelParts.push(ver.title);
      summary.textContent = labelParts.join(' · ') || (I18N.t('ui.changelog.fallbackVersionLabel') || 'Release notes');
      details.appendChild(summary);
      const bodyBox = document.createElement('div');
      bodyBox.className = 'changelog-version-body';
      for (const entry of ver.entries) {
        if (!entry || typeof entry !== 'object') continue;
        const section = document.createElement('div');
        section.className = 'changelog-entry';
        if (entry.title) {
          const h = document.createElement('h3');
          h.className = 'changelog-entry-title';
          h.textContent = entry.title;
          section.appendChild(h);
        }
        if (entry.body) {
          const p = document.createElement('p');
          p.className = 'changelog-entry-body';
          const safe = UI._escapeManualHtml(entry.body)
            .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
          p.innerHTML = safe;
          section.appendChild(p);
        }
        bodyBox.appendChild(section);
      }
      details.appendChild(bodyBox);
      container.appendChild(details);
    });
  },

  _renderChangelogEntries(container) {
    // Legacy flat-entries renderer. Still referenced by older callers
    // and kept as a thin delegate to the new version-aware renderer
    // (which transparently handles the flat shape). Can be removed once
    // no code calls it directly.
    return UI._renderChangelogVersions(container);
  },

  _renderManualSections(container) {
    // Sections are a flat i18n array — one dict per section with
    // title + body. Lets us add/reorder sections purely in the lang
    // files without JS churn.
    //
    // v53 — Accordion-Form via native <details>/<summary>. Jede Sektion
    // ist standardmäßig eingeklappt; die erste ist offen, damit beim
    // Öffnen des Manuals direkt Inhalt sichtbar ist. Vorteil gegenüber
    // einer JS-Accordion: Tastatur-Navigation, Screen-Reader-Support und
    // Browser-Find-in-Page (Ctrl+F expandet die passende Sektion) sind
    // kostenlos dabei.
    //
    // Body kann mehrzeilig sein (mit '\n\n' als Absatzgrenze). Wir
    // splitten und erzeugen <p>-Elemente, damit der Reader Luft bekommt
    // statt einen einzigen Monster-Absatz zu sehen.
    const sections = I18N.t('ui.manual.sections');
    if (!Array.isArray(sections)) {
      container.appendChild(el('div', { class: 'manual-section' }, [
        'Manual content missing. Check i18n.'
      ]));
      return;
    }
    sections.forEach((sec, i) => {
      const details = document.createElement('details');
      details.className = 'manual-section';
      if (i === 0) details.open = true;

      const summary = document.createElement('summary');
      summary.className = 'manual-section-title';
      summary.textContent = sec.title || '';
      details.appendChild(summary);

      const bodyWrap = document.createElement('div');
      bodyWrap.className = 'manual-section-body';
      const raw = String(sec.body || '');
      const paragraphs = raw.split(/\n\n+/);
      for (const p of paragraphs) {
        if (!p.trim()) continue;
        // Markdown-Light: erst HTML escapen, dann **bold** / *italic* /
        // `code` wieder zulassen. List-Zeilen (die mit "- " beginnen)
        // werden als unsortierte Liste zusammengefasst, damit die in der
        // i18n-Datei als natürlicher Text geschrieben werden können.
        const lines = p.split(/\n/);
        const allList = lines.every(l => /^\s*[-•]\s+/.test(l));
        if (allList && lines.length > 1) {
          const ul = document.createElement('ul');
          ul.className = 'manual-list';
          for (const l of lines) {
            const text = l.replace(/^\s*[-•]\s+/, '');
            const li = document.createElement('li');
            li.innerHTML = UI._escapeManualHtml(text)
              .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
              .replace(/\*([^*]+)\*/g, '<em>$1</em>');
            ul.appendChild(li);
          }
          bodyWrap.appendChild(ul);
        } else {
          const para = document.createElement('p');
          para.innerHTML = UI._escapeManualHtml(p)
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');
          bodyWrap.appendChild(para);
        }
      }
      details.appendChild(bodyWrap);

      container.appendChild(details);
    });
  },

  switchCodexTab(tab) {
    UI._codexCurrentTab = tab;
    // Toggle tab-button active state
    const tabs = document.querySelectorAll('.codex-tab');
    tabs.forEach(t => t.classList.toggle('active', t.dataset.codexTab === tab));
    UI.renderCodex();
  },

  renderCodex() {
    const content = document.getElementById('codex-content');
    const progress = document.getElementById('codex-progress');
    if (!content || !progress) return;
    content.innerHTML = '';
    progress.innerHTML = '';

    const tab = UI._codexCurrentTab || 'achievements';
    if (tab === 'achievements') UI._renderCodexAchievements(content, progress);
    else if (tab === 'cards')    UI._renderCodexCards(content, progress);
    else if (tab === 'legendaries') UI._renderCodexLegendaries(content, progress);
  },

  _renderCodexAchievements(content, progress) {
    const allIds = window.KL?.achievements?.ALL_IDS || [];
    const unlocked = new Set(window.KL?.codex?.getUnlockedAchievements?.() || []);
    const total = allIds.length;
    const got = allIds.filter(id => unlocked.has(id)).length;

    progress.appendChild(el('div', { class: 'codex-progress-label' }, [
      I18N.t('ui.codex.progressAchievements', { got, total }) || `${got} / ${total} unlocked`
    ]));

    const grid = el('div', { class: 'codex-grid codex-grid-achievements' });
    for (const id of allIds) {
      const isUnlocked = unlocked.has(id);
      const title = I18N.t(`ui.achievements.${id}.title`) || id;
      // Desc uses placeholders like {name} for player-specific awards. In
      // the codex we don't have a specific player — show the template as-is.
      const desc = I18N.t(`ui.achievements.${id}.desc`) || '';
      const cls = 'codex-card codex-card-achievement' + (isUnlocked ? ' unlocked' : ' locked');
      const children = [
        el('div', { class: 'codex-card-title' }, [
          el('span', { class: 'codex-card-icon' }, [isUnlocked ? '✦' : '·']),
          title
        ]),
        el('div', { class: 'codex-card-desc' }, [
          isUnlocked ? desc : (I18N.t('ui.codex.locked') || '??? — not yet unlocked')
        ])
      ];
      grid.appendChild(el('div', { class: cls }, children));
    }
    content.appendChild(grid);
  },

  _renderCodexCards(content, progress) {
    const allIds = window.KL?.cards?.getAllCardIds?.() || [];
    const seen = new Set(window.KL?.codex?.getSeenCards?.() || []);
    const total = allIds.length;
    const got = allIds.filter(id => seen.has(id)).length;

    progress.appendChild(el('div', { class: 'codex-progress-label' }, [
      I18N.t('ui.codex.progressCards', { got, total }) || `${got} / ${total} discovered`
    ]));

    // Group by rarity for readability — commons first (common progression
    // baseline), then uncommons (the draft meat), then rares (standout cards).
    const byRarity = { common: [], uncommon: [], rare: [] };
    const getDef = window.KL?.cards?.getCardDef;
    for (const id of allIds) {
      const def = getDef?.(id);
      const r = def?.rarity || 'common';
      (byRarity[r] || byRarity.common).push(id);
    }

    const grid = el('div', { class: 'codex-grid codex-grid-cards' });
    const rarityOrder = ['common', 'uncommon', 'rare'];
    for (const r of rarityOrder) {
      const ids = byRarity[r] || [];
      if (!ids.length) continue;
      grid.appendChild(el('div', { class: 'codex-rarity-header' }, [
        (I18N.t('ui.codex.rarity.' + r) || r.toUpperCase()) + ' · ' + ids.length
      ]));
      for (const id of ids) {
        const isSeen = seen.has(id);
        const def = getDef?.(id);
        const name = I18N.t('ui.cards.' + id + '.name') || id;
        const desc = UI.resolveCardDescription(id, null);
        const cost = def?.cost != null ? ('· ' + def.cost + 'E') : '';
        const cls = 'codex-card codex-card-cardex ' + r + (isSeen ? ' unlocked' : ' locked');
        const children = [
          el('div', { class: 'codex-card-title' }, [
            el('span', { class: 'codex-card-icon' }, [isSeen ? '✦' : '·']),
            isSeen ? name : '???',
            el('span', { class: 'codex-card-meta' }, [' ' + cost])
          ]),
          el('div', { class: 'codex-card-desc' }, [
            isSeen ? desc : (I18N.t('ui.codex.cardLocked') || 'Not yet seen — draft or play this card to discover it.')
          ])
        ];
        grid.appendChild(el('div', { class: cls }, children));
      }
    }
    content.appendChild(grid);
  },

  _renderCodexLegendaries(content, progress) {
    const legs = window.KL?.codex?.getLegendaries?.() || [];
    progress.appendChild(el('div', { class: 'codex-progress-label' }, [
      I18N.t('ui.codex.progressLegendaries', { count: legs.length }) || `${legs.length} recruited`
    ]));

    if (legs.length === 0) {
      content.appendChild(el('div', { class: 'codex-empty' }, [
        I18N.t('ui.codex.emptyLegendaries')
          || 'No legendaries yet. Beat a boss and recruit one to start the collection.'
      ]));
      return;
    }

    // Sort newest first so the latest recruit is up-top.
    const sorted = legs.slice().sort((a, b) => (b.firstSeenAt || 0) - (a.firstSeenAt || 0));
    const grid = el('div', { class: 'codex-grid codex-grid-legendaries' });
    for (const p of sorted) {
      const roleLabel = UI.roleAbbr(p.role) || p.role || '?';
      // v0.45 — Legendary players can carry both regular traits (data.traits.*)
      // and legendary traits (data.legendaryTraits.*). Look up in both namespaces
      // before falling back to the raw key.
      const traitsLine = (p.traits || []).slice(0, 3)
        .map(t => {
          const regular = I18N.t('data.traits.' + t + '.name');
          if (regular && regular !== 'data.traits.' + t + '.name') return regular;
          const legendary = I18N.t('data.legendaryTraits.' + t + '.name');
          if (legendary && legendary !== 'data.legendaryTraits.' + t + '.name') return legendary;
          return t;
        })
        .join(' · ');
      const statsParts = p.stats ? Object.entries(p.stats)
        .filter(([k]) => ['offense','defense','tempo','vision','composure'].includes(k))
        .map(([k, v]) => (I18N.t('stats.' + k) || k) + ' ' + v)
        .join(' · ') : '';
      grid.appendChild(el('div', { class: 'codex-card codex-card-legendary' }, [
        el('div', { class: 'codex-card-title' }, [
          el('span', { class: 'codex-card-icon' }, ['★']),
          p.name || '?',
          el('span', { class: 'codex-card-meta' }, [' · ' + roleLabel])
        ]),
        traitsLine ? el('div', { class: 'codex-card-desc' }, [traitsLine]) : null,
        statsParts ? el('div', { class: 'codex-card-stats' }, [statsParts]) : null
      ].filter(Boolean)));
    }
    content.appendChild(grid);
  },

  renderDraft() {
    const grid = $('#draft-grid');
    grid.innerHTML = '';
    DATA.starterTeams.forEach(team => {
      // v0.41 — Roster-Chips bekommen Tooltips. Vorher war nur der
      // Archetyp-Label sichtbar ("Blocking Keeper"), keine Info zu
      // Rolle, Stat-Profil oder Spielstil. Tooltip zeigt jetzt:
      // Rolle (abbreviated), Stat-Profil, und einen kurzen Kommentar
      // zum Spielstil des Archetyps (falls i18n-key existiert).
      const rosterChips = team.lineup.map(archId => {
        const arch = DATA.archetypes[archId];
        if (!arch) return el('span', { class:'roster-chip' }, [archId]);
        const roleLabel = UI.roleAbbr(arch.role) || arch.role;
        // Stat-Profil inline, die zwei stärksten Stats highlighten
        const statEntries = Object.entries(arch.stats)
          .sort((a,b) => b[1] - a[1]);
        const STAT_ABBR = { offense:'OFF', defense:'DEF', tempo:'TMP', vision:'VIS', composure:'CMP' };
        const topStats = statEntries.slice(0, 2)
          .map(([k,v]) => `${STAT_ABBR[k]} ${v}`)
          .join(' · ');
        const allStats = statEntries
          .map(([k,v]) => `${STAT_ABBR[k]} ${v}`)
          .join(' · ');
        const descKey = 'data.archetypes.' + archId + '.desc';
        const descText = I18N.t(descKey);
        const styleLine = (descText && descText !== descKey) ? '\n\n' + descText : '';
        const title = `${arch.label} — ${roleLabel}\n\nStrongest: ${topStats}\nAll: ${allStats}${styleLine}`;
        return el('span', {
          class: 'roster-chip role-' + arch.role,
          title
        }, [arch.label]);
      });
      // v0.40 — Starter-Deck-Preview pro Team. Jedes Team startet mit
      // 10 gemeinsamen Core-Karten plus 4 archetypischen, die seine
      // Spielidentität von Match 1 prägen. Der Spieler sieht jetzt
      // WELCHE 4 Archetyp-Karten das sind — damit die Team-Wahl eine
      // echte strategische Entscheidung wird, nicht nur kosmetisch.
      const archetypeCards = (window.KL?.cards?.STARTER_ARCHETYPE || {})[team.id] || [];
      const archetypeChips = archetypeCards.map(cardId => {
        const cardName = I18N.t('ui.cards.' + cardId + '.name') || cardId;
        const cardDesc = UI.resolveCardDescription(cardId, null);
        const def = window.KL?.cards?.getCardDef?.(cardId);
        const typeLabel = def ? (I18N.t('ui.cards.types.' + def.type) || def.type) : '';
        return el('span', {
          class: 'starter-archetype-chip' + (def ? ' type-' + def.type : ''),
          title: `${cardName} (${typeLabel})\n\n${cardDesc}`
        }, [cardName]);
      });
      const card = el('div', { class:'team-card', style:{ '--team-color': team.color } }, [
        team.logo ? el('img', { class:'team-card-logo', src: team.logo, alt: team.name }, []) : null,
        el('h2', {}, [team.name]),
        el('div', { class:'theme' }, [team.theme]),
        el('div', { class:'desc' }, [team.desc]),
        el('div', { class:'roster' }, rosterChips),
        archetypeChips.length ? el('div', { class:'starter-archetype-box' }, [
          el('div', { class:'starter-archetype-label' }, [I18N.t('ui.draft.starterCards') || 'Archetyp-Karten:']),
          el('div', { class:'starter-archetype-list' }, archetypeChips)
        ]) : null
      ]);
      card.addEventListener('click', () => FLOW.chooseStarterTeam(team));
      grid.appendChild(card);
    });
    UI.showScreen('screen-draft');
  },

  renderOpponentKeyPlayers(opp) {
    if (!opp?.lineup?.length) return null;
    const holders = opp.traitHolders || {};
    const holderEntries = Object.entries(holders);
    const wrap = el('div', { class: 'opp-keys' });

    const keeper = opp.lineup.find(p => p.role === 'TW');
    const striker = opp.lineup.find(p => p.role === 'ST');

    const shown = new Set();
    const rows = [];

    for (const [traitId, holder] of holderEntries) {
      if (!holder) continue;
      const traitDef = OPP_TRAITS.find(t => t.id === traitId);
      if (!traitDef) continue;
      rows.push({ holder, label: traitDef.name, highlight: true });
      shown.add(holder.id);
      if (rows.length >= 2) break;
    }

    if (rows.length < 2 && striker && !shown.has(striker.id)) {
      const off = striker.stats?.offense || opp.stats.offense;
      rows.push({ holder: striker, label: `${off} OFF`, highlight: false });
      shown.add(striker.id);
    }
    if (rows.length < 2 && keeper && !shown.has(keeper.id)) {
      const def = keeper.stats?.defense || opp.stats.defense;
      rows.push({ holder: keeper, label: `${def} DEF`, highlight: false });
    }

    if (!rows.length) return null;

    for (const row of rows) {
      // v0.39 — Row-level tooltip explains WHY this player is flagged.
      // Previously the tag showed e.g. "45 OFF" but no context —
      // players would see a chip next to an opponent name without
      // knowing whether it was their strongest stat, a threat flag,
      // or something to target. Tooltip now narrates the intent.
      const rowTitle = row.highlight
        ? `${row.holder.name} is the opponent's KEY threat in this match — their highest-impact player. Breaking up their stats or targeting them with counters pays off.`
        : `${row.holder.name} (${UI.roleAbbr(row.holder.role)}) — ${row.label}. Notable piece of the opposing squad.`;
      const rowEl = el('div', {
        class: 'opp-key-row' + (row.highlight ? ' highlight' : ''),
        title: rowTitle
      }, [
        el('span', { class: 'opp-key-role' }, [UI.roleAbbr(row.holder.role)]),
        el('span', { class: 'opp-key-name' }, [row.holder.name]),
        el('span', { class: 'opp-key-tag' }, [row.label])
      ]);
      wrap.appendChild(rowEl);
    }

    return wrap;
  },

  // League table — compact standings above the run-progress strip.
  // Always renders now (since league mode is the only mode) — the
  // "classic mode fallback" this comment used to describe was removed
  // in v41 when the league system landed.
  // Build the victory-screen action button row based on the pending
  // season outcome. Promotion / champion → "Continue to <Next Tier>".
  // Relegation from amateur → "New Run" (no lower tier). Relegation
  // from higher tier → "Continue to <Lower Tier>". Safe mid-table →
  // "Continue season" (same tier next season). Final Championship →
  // "New Run" (end-game reached).
  renderVictoryAction() {
    const actions = document.getElementById('victory-actions');
    if (!actions) return;
    const outcome = state._pendingSeasonOutcome;
    actions.innerHTML = '';

    const tiers = CONFIG.leagueTiers || [];
    const currentTierIdx = tiers.findIndex(t => t.id === (outcome?.tier || 'amateur'));
    const currentTier = tiers[currentTierIdx];

    let btnLabel, btnAction, secondaryLabel = null;

    if (!outcome) {
      btnLabel = I18N.t('ui.start.newRun') || 'NEW RUN';
      btnAction = 'FLOW.newRun()';
    } else if (outcome.outcome === 'cup_champion' || outcome.outcome === 'cup_runner_up') {
      // Cup-Ende = Run-Ende. Nur new run möglich.
      btnLabel = I18N.t('ui.start.newRun') || 'NEW RUN';
      btnAction = 'FLOW.newRun()';
    } else if (outcome.outcome === 'champion' || outcome.outcome === 'promotion') {
      const fromPro = currentTier?.id === 'pro';
      if (fromPro) {
        // Pro promotion → Cup End-Game
        btnLabel = I18N.t('ui.flow.enterCup') || 'ENTER CUP';
        btnAction = 'FLOW.continueSeason()';
      } else {
        // Amateur → Pro
        const nextTier = tiers[currentTierIdx + 1];
        btnLabel = (I18N.t('ui.flow.continueTo') || 'CONTINUE TO') + ' ' + (nextTier?.name || '?');
        btnAction = 'FLOW.continueSeason()';
      }
      secondaryLabel = I18N.t('ui.start.newRun') || 'NEW RUN';
    } else if (outcome.outcome === 'relegation') {
      const lowerTier = tiers[currentTierIdx - 1];
      if (lowerTier) {
        btnLabel = (I18N.t('ui.flow.dropTo') || 'DROP TO') + ' ' + lowerTier.name;
        btnAction = 'FLOW.continueSeason()';
        secondaryLabel = I18N.t('ui.start.newRun') || 'NEW RUN';
      } else {
        btnLabel = I18N.t('ui.start.newRun') || 'NEW RUN';
        btnAction = 'FLOW.newRun()';
      }
    } else {
      btnLabel = (I18N.t('ui.flow.nextSeason') || 'NEXT SEASON') + ' — ' +
        (currentTier?.name || '?');
      btnAction = 'FLOW.continueSeason()';
      secondaryLabel = I18N.t('ui.start.newRun') || 'NEW RUN';
    }

    const primary = document.createElement('button');
    primary.className = 'btn primary';
    primary.textContent = btnLabel;
    primary.setAttribute('onclick', btnAction);
    actions.appendChild(primary);

    if (secondaryLabel) {
      const secondary = document.createElement('button');
      secondary.className = 'btn';
      secondary.textContent = secondaryLabel;
      secondary.setAttribute('onclick', 'FLOW.newRun()');
      actions.appendChild(secondary);
    }
  },

  // v53 — Gemeinsamer Tabellen-Builder für Hub- und Victory-Screen.
  // Erzeugt nur den inneren .league-table-Block (head + data rows).
  // Der Caller hängt das in ein Accordion / Wrapper rein.
  buildLeagueTableInner(standings) {
    if (!standings || !standings.length) return null;
    const tableInner = el('div', { class: 'league-table' });
    const headRow = el('div', { class: 'lt-row lt-head' }, [
      el('span', { class: 'lt-pos' }, ['#']),
      el('span', { class: 'lt-name' }, [I18N.t('ui.league.team') || 'Team']),
      el('span', { class: 'lt-num' }, ['P']),
      el('span', { class: 'lt-num' }, ['W']),
      el('span', { class: 'lt-num' }, ['D']),
      el('span', { class: 'lt-num' }, ['L']),
      el('span', { class: 'lt-num' }, ['GD']),
      el('span', { class: 'lt-num lt-pts' }, ['PTS'])
    ]);
    tableInner.appendChild(headRow);

    const totalTeams = standings.length;
    const promoCount = CONFIG.leaguePromotionZone || 0;
    const relegCount = CONFIG.leagueRelegationZone || 0;

    standings.forEach((row, idx) => {
      const gdStr = row.gd > 0 ? '+' + row.gd : row.gd.toString();
      let zoneClass = '';
      if (idx < promoCount) zoneClass = ' lt-zone-promotion';
      else if (idx >= totalTeams - relegCount) zoneClass = ' lt-zone-relegation';
      const tr = el('div', {
        class: 'lt-row' + (row.self ? ' lt-self' : '') + zoneClass
      }, [
        el('span', { class: 'lt-pos' }, [(idx + 1).toString()]),
        el('span', { class: 'lt-name' }, [row.name]),
        el('span', { class: 'lt-num' }, [row.played.toString()]),
        el('span', { class: 'lt-num' }, [row.won.toString()]),
        el('span', { class: 'lt-num' }, [row.drawn.toString()]),
        el('span', { class: 'lt-num' }, [row.lost.toString()]),
        el('span', { class: 'lt-num' }, [gdStr]),
        el('span', { class: 'lt-num lt-pts' }, [row.points.toString()])
      ]);
      tableInner.appendChild(tr);
    });
    return tableInner;
  },

  renderLeagueTable() {
    const existing = document.getElementById('hub-league-table');
    if (existing) existing.remove();
    if (!state._leagueSeason) return;
    const season = state._leagueSeason;
    const standings = season.standings || [];
    if (!standings.length) return;

    // Persist open/closed state across re-renders within the same hub
    // visit (renderLeagueTable gets called repeatedly). localStorage so
    // the user's preference survives match transitions too. Default open
    // on first visit — "einklappbar machen aber offen lassen" per v52.1
    // request.
    const STORAGE_KEY = 'kicklike_hub_league_collapsed_v1';
    let isOpen = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === '1') isOpen = false;
    } catch (e) { /* ignore */ }

    // Build the collapsible wrapper. Pattern intentionally mirrors
    // .hub-acc-section (squad/deck accordion below) so the whole hub
    // reads as one family of collapsibles — not three different widgets.
    // The wrapper is INDEPENDENT of the main accordion (no exclusive
    // open-one-at-a-time logic) so opening squad doesn't collapse the
    // league standings.
    const wrapper = el('div', {
      id: 'hub-league-table',
      class: 'hub-acc-section hub-league-accordion' + (isOpen ? ' open' : ''),
      'data-section': 'league'
    });

    const head = el('div', {
      class: 'hub-acc-head',
      onclick: ''
    }, [
      el('span', { class: 'hub-acc-label' }, [I18N.t('ui.league.title') || 'LEAGUE TABLE']),
      el('span', { class: 'hub-acc-meta', id: 'hub-league-meta' }, [
        standings.length + ' ' + (I18N.t('ui.league.teams') || 'teams')
      ]),
      el('span', { class: 'hub-acc-arrow' }, ['▾'])
    ]);
    // Wire toggle via addEventListener (so we can persist) rather than
    // inline onclick. Keeps the click handler colocated with the logic.
    head.addEventListener('click', () => {
      const nowOpen = !wrapper.classList.contains('open');
      wrapper.classList.toggle('open', nowOpen);
      try {
        localStorage.setItem(STORAGE_KEY, nowOpen ? '0' : '1');
      } catch (e) { /* ignore */ }
    });

    const body = el('div', { class: 'hub-acc-body' });
    // The actual table content goes inside the body. Uses the shared
    // buildLeagueTableInner helper so victory screen can reuse the
    // exact same row format.
    const tableInner = UI.buildLeagueTableInner(standings);
    if (tableInner) body.appendChild(tableInner);

    wrapper.appendChild(head);
    wrapper.appendChild(body);

    // Insert AFTER the hub-anchor (match preview) so the match focus
    // stays primary. League table is secondary context.
    const anchor = document.getElementById('hub-anchor');
    if (anchor && anchor.parentElement) {
      anchor.parentElement.insertBefore(wrapper, anchor.nextSibling);
    } else {
      const screen = document.getElementById('screen-hub');
      if (screen) screen.appendChild(wrapper);
    }

    // Cup bracket — small inline view below the table. Only renders
    // if cup is enabled and a bracket exists for this season.
    UI.renderCupBracket?.();
  },

  // Compact cup bracket — shows the 3 cup rounds with boss-opponent
  // names and round results. Only renders in cup mode (post Pro
  // promotion). Played rounds show score; current round highlighted;
  // future rounds show "?". Trophy when player wins the final.
  renderCupBracket() {
    const existing = document.getElementById('hub-cup-bracket');
    if (existing) existing.remove();
    const bracket = state?._cupBracket;
    if (!bracket || !state._cupMode) return;
    const nameOf = (opp) => opp?.name || '?';

    const box = el('div', { id: 'hub-cup-bracket', class: 'cup-bracket' });
    box.appendChild(el('div', { class: 'cup-title' }, [
      (I18N.t('ui.cup.title') || 'POKAL'),
      bracket.playerWon ? el('span', { class: 'cup-trophy' }, [' 🏆']) : null,
      bracket.playerEliminated ? el('span', { class: 'cup-eliminated' }, [' · ' + (I18N.t('ui.cup.eliminated') || 'AUS')]) : null
    ].filter(Boolean)));

    const cols = el('div', { class: 'cup-cols' });
    bracket.rounds.forEach((round, idx) => {
      const col = el('div', { class: 'cup-col cup-col-' + round.name });
      col.appendChild(el('div', { class: 'cup-col-label' }, [
        I18N.t('ui.cup.' + round.name) || round.name.toUpperCase()
      ]));
      const isCurrent = (idx === bracket.currentRound) && !round.played
        && !bracket.playerEliminated && !bracket.playerWon;
      const isReachable = idx <= bracket.currentRound;
      const cls = 'cup-match'
        + (isCurrent ? ' is-current' : '')
        + (round.played ? ' played' : '')
        + (round.played && round.result?.playerWon ? ' won' : '')
        + (round.played && !round.result?.playerWon ? ' lost' : '')
        + (!isReachable ? ' future' : '');
      const txt = round.played
        ? `vs ${nameOf(round.opp)} · ${round.result.scoreMe}–${round.result.scoreOpp}`
        : isReachable
          ? `vs ${nameOf(round.opp)}`
          : '?';
      col.appendChild(el('div', { class: cls }, [txt]));
      cols.appendChild(col);
    });
    box.appendChild(cols);

    const tableEl = document.getElementById('hub-league-table');
    if (tableEl && tableEl.parentElement) {
      tableEl.parentElement.insertBefore(box, tableEl.nextSibling);
    } else {
      const anchor = document.getElementById('hub-anchor');
      if (anchor && anchor.parentElement) {
        anchor.parentElement.insertBefore(box, anchor.nextSibling);
      }
    }
  },

  renderHub() {
    // --- Zone A: Chrome ---
    $('#hub-match-num').textContent = state.matchNumber + 1;
    const matchTotal = $('#hub-match-total');
    const effectiveRunLength = state._leagueSeason
      ? state._leagueSeason.schedule.filter(g => g.isPlayer).length
      : CONFIG.runLength;
    if (matchTotal) matchTotal.textContent = effectiveRunLength;
    $('#hub-wins').textContent = state.wins;
    $('#hub-losses').textContent = state.losses;

    // League mode label next to "MATCH N/14" — shows tier name, OR
    // cup round name if this match is a cup tie.
    const modeLabel = document.getElementById('hub-mode-label');
    if (modeLabel) {
      if (state._isCupMatch && state._cupBracket) {
        const round = state._cupBracket.rounds[state._cupBracket.currentRound];
        const roundName = round?.name || 'cup';
        const cupLabel = (I18N.t('ui.cup.title') || 'CUP') + ' · ' +
          (I18N.t('ui.cup.' + roundName) || roundName.toUpperCase());
        modeLabel.textContent = cupLabel + ' · ';
      } else if (state._leagueSeason) {
        const tiers = CONFIG.leagueTiers || [];
        const tier = tiers.find(t => t.id === (state._currentTier || 'amateur'));
        const tierName = tier?.name || '';
        modeLabel.textContent = tierName ? tierName + ' · ' : 'LIGA · ';
      } else {
        modeLabel.textContent = '';
      }
    }

    // League table banner — rendered AFTER the hub-anchor (match preview)
    // so the player's next-match focus stays at the top of the screen.
    UI.renderLeagueTable?.();

    const pointsEl = $('#hub-points');
    pointsEl.textContent = state.seasonPoints;
    if (state.pendingPointsPop > 0) {
      const delta = state.pendingPointsPop;
      pointsEl.classList.remove('points-pop');
      void pointsEl.offsetWidth;
      pointsEl.classList.add('points-pop');
      // Flying +3 / +1
      const flying = el('span', { class:'points-flyup' }, [`+${delta}`]);
      const host = pointsEl.parentElement;
      host.style.position = 'relative';
      host.appendChild(flying);
      setTimeout(() => flying.remove(), 1300);
      state.pendingPointsPop = 0;
    }

    const lossCell = $('#hub-losses').parentElement;
    if (state.currentLossStreak >= 2) lossCell.classList.add('danger');
    else lossCell.classList.remove('danger');

    const prog = $('#run-progress');
    prog.innerHTML = '';
    const seasonOpps = state.seasonOpponents || [];
    // Progress strip length = league schedule player-matches (10).
    const progressLength = state._leagueSeason
      ? state._leagueSeason.schedule.filter(g => g.isPlayer).length
      : CONFIG.runLength;
    // Drive CSS grid with dynamic column count so the strip stretches
    // to the container's full width (10 cells across instead of 15).
    prog.style.setProperty('--progress-count', progressLength);

    // Leg separator placement: at an even schedule, inject an explicit
    // gutter column between the two halves so the mid-season divider
    // (.run-progress::after at left:50%) lands inside a visibly wider
    // gap instead of being pressed against the adjacent tiles.
    //
    // Implementation note (v0.36.2): an earlier version used a 15th
    // grid column for the gutter and relied on CSS-Grid auto-placement
    // to "skip" it. That was wrong — auto-placement just fills every
    // column in order, so tile #8 of a 14-match schedule got squeezed
    // into the 14px gutter column and rendered as a tiny sliver.
    // We now emit a real DOM element (.leg-spacer) that consumes the
    // gutter column, and the 14 real tiles flow around it into the
    // 14 fr columns. Keeps aspect-ratio:1 on tiles intact (v50.1 margin
    // approach shrank neighbours; that bug stays fixed).
    const hasLegDivider = progressLength % 2 === 0;
    if (hasLegDivider) {
      const half = progressLength / 2;
      prog.style.gridTemplateColumns =
        `repeat(${half}, 1fr) var(--leg-gap, 14px) repeat(${half}, 1fr)`;
      prog.classList.add('has-leg-divider');
    } else {
      prog.style.gridTemplateColumns = '';
      prog.classList.remove('has-leg-divider');
    }

    for (let i = 0; i < progressLength; i++) {
      const isFinal = (i + 1) === progressLength;
      const cell = el('div', { class:'progress-cell' + (isFinal ? ' final' : '') }, []);
      if (CONFIG.bossMatches.includes(i+1)) cell.classList.add('boss');
      // Leg separator marker on the last tile of the first leg; retained
      // for future styling hooks but the actual visual divider is the
      // ::after line + the .leg-spacer below.
      if (hasLegDivider && (i + 1) === progressLength / 2) {
        cell.classList.add('leg-end');
      }
      let hist = null;
      if (i < state.matchHistory.length) {
        cell.classList.add('done');
        hist = state.matchHistory[i];
        cell.classList.add(hist.result);
        cell.title = I18N.t('ui.labels.matchLabel', { num: i + 1, me: hist.scoreMe, opp: hist.scoreOpp, name: hist.opp });
      } else if (i === state.matchNumber) {
        cell.classList.add('current');
      }

      // Show the opponent logo for all matches when known — including the
      // final. Previously the last tile showed a trophy icon; feedback was
      // that visual consistency across all tiles reads cleaner than a
      // special-case glyph. Boss/final status is already marked via the
      // .boss / .final CSS classes on the cell.
      const oppHere = seasonOpps[i];
      if (oppHere?.logo) {
        const logo = el('img', {
          class: 'progress-logo',
          src: oppHere.logo,
          alt: oppHere.name || '',
          title: oppHere.name || ''
        }, []);
        cell.appendChild(logo);
      }

      // Score row — visible on EVERY tile including the final. Previously
      // the final tile was special-cased out of the score row so the gold
      // trophy/border read as "this one's different". Feedback was that
      // the missing score broke the rhythm of the strip; the final tile
      // now follows the same logo-over-score layout and the gold border
      // alone carries the "final" signal. Unplayed matches get a dim
      // placeholder ("–:–"); played matches get the real result in
      // outcome-coloured text.
      const scoreText = hist
        ? `${hist.scoreMe}:${hist.scoreOpp}`
        : '–:–';
      cell.appendChild(el('div', {
        class: 'progress-score' + (hist ? '' : ' pending')
      }, [scoreText]));
      prog.appendChild(cell);

      // After inserting the last tile of the first leg, drop the spacer
      // element into the DOM so subsequent tiles flow into the 1fr
      // columns AFTER the gutter — not INTO it. The spacer is CSS-hidden
      // (empty box, no border, no background) but still occupies its
      // grid column with the declared 14px width.
      if (hasLegDivider && (i + 1) === progressLength / 2) {
        prog.appendChild(el('div', { class:'leg-spacer', 'aria-hidden':'true' }, []));
      }
    }

    // --- Zone B: Anchor (the one picture of the match) ---
    const opp = state.currentOpponent;
    const lineup = getLineup();
    const intel = (typeof buildMatchupIntel === 'function')
      ? buildMatchupIntel(lineup, opp, state)
      : null;

    const teamFormAvg = lineup.reduce((s, p) => s + (p.form || 0), 0) / Math.max(1, lineup.length);
    const oneLiner = intel && (typeof buildIntelOneLiner === 'function')
      ? buildIntelOneLiner(intel, {
          isBoss: !!opp.isBoss,
          teamFormAvg,
          lossStreak: state.currentLossStreak || 0,
          matchNumber: state.matchNumber
        })
      : null;

    const myName = state.teamName || I18N.t('ui.hub.yourTeam');
    const oppName = opp.name;
    const myPower = intel ? intel.myEffectivePower : 0;
    const oppPower = intel ? intel.oppEffectivePower : (opp.power || 0);

    // v0.56 — Quick-Sim button visibility. Surfaces only when the
    // player is going into a clearly favourable fixture: 25%+ power
    // advantage, no boss, no cup tie, on a win streak, and past
    // match 3 (so the second tutorial has run and the player has
    // a feel for the regular flow). All five conditions must hold —
    // any single guard failing hides the button. Conservative on
    // purpose: a player should never feel they "should have" used
    // Quick-Sim when the match was actually meaningful.
    {
      const btn = document.getElementById('hub-quick-sim-btn');
      if (btn) {
        const advantage = (oppPower > 0 && myPower > oppPower * 1.25);
        const winStreak = state.currentWinStreak || 0;
        const inLeague = !state._isCupMatch;
        const matchNum = state.matchNumber || 0;
        const visible = advantage && !opp.isBoss && inLeague
          && winStreak >= 1 && matchNum >= 3;
        btn.style.display = visible ? '' : 'none';
      }
    }

    // Form indicator — small, unter dem Team-Namen
    let formChip = null;
    if (teamFormAvg >= 2)       formChip = { cls:'form-chip hot',  text:'🔥 ' + I18N.t('ui.labels.hotStreak') };
    else if (teamFormAvg >= 1)  formChip = { cls:'form-chip up',   text:'↑ '  + I18N.t('ui.labels.goodForm') };
    else if (teamFormAvg <= -2) formChip = { cls:'form-chip cold', text:'❄ '  + I18N.t('ui.labels.crisis') };
    else if (teamFormAvg <= -1) formChip = { cls:'form-chip down', text:'↓ '  + I18N.t('ui.labels.badForm') };

    // Opponent identity
    // Keep IDs alongside display names so we can look up the `data.oppTells.*`
    // explanation strings and attach them as native HTML tooltips on the
    // tags. Without this, labels like "Eisenhart" / "Sniper" showed as bare
    // words with no hint of what they changed about the match.
    const oppTraitChips = (opp.traits || [])
      .map(tid => {
        const td = OPP_TRAITS.find(x => x.id === tid);
        return td ? { id: tid, name: td.name } : null;
      })
      .filter(Boolean)
      .slice(0, 2);
    const oppSpecialObj = opp.special || null;  // {id, name}

    // Win-Probability wurde durch das Matchup-Scorecard ersetzt (siehe unten).
    // Die Funktion bleibt in intel.js exportiert — die Engine nutzt sie noch
    // für interne Pre-Match-Events.

    const anchor = $('#hub-anchor');
    anchor.innerHTML = '';

    const topRow = el('div', { class:'anchor-top' }, [
      el('div', { class:'anchor-side me' }, [
        el('div', { class:'anchor-side-label mono-sm' }, [I18N.t('ui.hub.yourTeam')]),
        state.teamLogo
          ? el('img', { class:'anchor-logo', src: state.teamLogo, alt: myName }, [])
          : null,
        el('div', { class:'anchor-side-name' }, [myName]),
        formChip ? el('div', { class: formChip.cls }, [formChip.text]) : null
      ]),
      el('div', { class:'anchor-mid' }, [
        el('div', { class:'anchor-vs' }, [I18N.t('ui.hub.vs')]),
        el('div', { class:'anchor-match-num' }, [`#${state.matchNumber + 1}`])
      ]),
      el('div', { class:'anchor-side opp' }, [
        el('div', { class:'anchor-side-label mono-sm' }, [I18N.t('ui.hub.opponent')]),
        opp.logo
          ? el('img', { class:'anchor-logo', src: opp.logo, alt: oppName }, [])
          : null,
        el('div', { class:'anchor-side-name ' + (opp.isBoss ? 'boss' : '') }, [(opp.isBoss ? '🏆 ' : '') + oppName]),
        opp.isBoss || oppSpecialObj || oppTraitChips.length || opp._adaptation
          ? el('div', { class:'anchor-opp-tags' }, [
              opp.isBoss   ? el('span', {
                class:'opp-tag boss',
                title: I18N.t('ui.labels.bossTell') || 'Boss opponent — every stat is elevated.'
              }, [(() => { const v = I18N.t('ui.hub.bossTag'); return v === 'ui.hub.bossTag' ? 'BOSS' : v; })()]) : null,
              oppSpecialObj ? el('span', {
                class:'opp-tag special',
                title: (() => {
                  const k = 'data.oppTells.' + oppSpecialObj.id;
                  const t = I18N.t(k);
                  return (t && t !== k) ? t : '';
                })()
              }, [oppSpecialObj.name]) : null,
              ...oppTraitChips.map(t => el('span', {
                class:'opp-tag',
                title: (() => {
                  // Try trait-specific tell first (e.g. oppTells.trait_sturm), then
                  // fall back to just showing nothing if no tell defined.
                  const k = 'data.oppTells.trait_' + t.id;
                  const v = I18N.t(k);
                  return (v && v !== k) ? v : '';
                })()
              }, [t.name])),
              // Adaptation tag (v52.1) — visible cue that the opp has
              // tuned their setup against the player's dominant card
              // type. Without this, the stat bump would land silently.
              opp._adaptation ? el('span', {
                class: 'opp-tag adaptation',
                title: (() => {
                  const typeLabel = I18N.t('ui.cards.types.' + opp._adaptation.against) || opp._adaptation.against;
                  const statLabel = I18N.t('stats.' + opp._adaptation.stat) || opp._adaptation.stat.toUpperCase();
                  const tmpl = I18N.t('ui.hub.adaptationTooltip');
                  if (tmpl && tmpl !== 'ui.hub.adaptationTooltip') {
                    return tmpl
                      .replace('{type}', typeLabel)
                      .replace('{stat}', statLabel)
                      .replace('{bump}', String(opp._adaptation.bump))
                      .replace('{share}', Math.round(opp._adaptation.share * 100) + '%');
                  }
                  return `They've adapted to your ${typeLabel.toLowerCase()}-heavy deck (${Math.round(opp._adaptation.share * 100)}% of your plays). +${opp._adaptation.bump} ${statLabel} on this squad.`;
                })()
              }, [
                (I18N.t('ui.hub.adaptationTag') !== 'ui.hub.adaptationTag'
                  ? I18N.t('ui.hub.adaptationTag')
                  : 'ADAPTED')
              ]) : null
            ])
          : null
      ])
    ]);
    anchor.appendChild(topRow);

    // Rivalry banner — only renders when we've faced this team before.
    // Pulls context from league.getRivalryContext and picks a flavor-
    // tagged narration + styling. Positioned between the team-names
    // row and the matchup scorecard so it sets narrative stakes before
    // the stat breakdown.
    const rivalry = window.KL?.league?.getRivalryContext?.(state, opp.id);
    if (rivalry) {
      const rBox = el('div', {
        class: 'rivalry-banner flavor-' + rivalry.flavor,
        title: `Head-to-head: ${rivalry.wins}W-${rivalry.draws}D-${rivalry.losses}L across ${rivalry.meetings} meetings.`
      });

      // v52.2 — Narration pools moved to i18n (ui.rivalry.narration.*).
      // Previously hardcoded English strings in this file, which meant
      // DE/ES players saw a translated banner label "RIVALITÄT 2W 1D 1L"
      // over three lines of English text. Template variables: {opp},
      // {lastMe}, {lastOpp}, {meetings}, {humiliations}. I18N.pickText
      // picks a random entry from the array at the given key path.
      const narrationVars = {
        opp: oppName,
        lastMe: rivalry.lastScoreMe,
        lastOpp: rivalry.lastScoreOpp,
        meetings: rivalry.meetings,
        humiliations: rivalry.humiliations || 0
      };
      const narrationKey = 'ui.rivalry.narration.' + (rivalry.flavor || 'neutral');
      let line = I18N.pickText
        ? I18N.pickText(narrationKey, narrationVars)
        : null;
      // Fallback: if i18n returned the key unchanged (missing translation),
      // use a generic rematch line so we never surface the key as text.
      if (!line || line === narrationKey) {
        line = (I18N.t('ui.rivalry.narration.neutral.0', narrationVars))
          || `${oppName} — rematch.`;
      }

      const title = el('div', { class: 'rivalry-title' }, [
        el('span', { class: 'rivalry-badge' }, [
          rivalry.flavor === 'blood' ? '⚔' :
          rivalry.flavor === 'grudge' ? '🔥' :
          rivalry.flavor === 'revenge' ? '↺' :
          rivalry.flavor === 'dominant' ? '★' : '↷'
        ]),
        el('span', { class: 'rivalry-label' },
          [(I18N.t('ui.rivalry.banner') || 'RIVALRY') + ' · ' +
            rivalry.wins + 'W ' + rivalry.draws + 'D ' + rivalry.losses + 'L'])
      ]);
      const narration = el('div', { class: 'rivalry-narration' }, [line]);

      rBox.appendChild(title);
      rBox.appendChild(narration);
      anchor.appendChild(rBox);
    }

    // Matchup Scorecard — replaces the old Win/Draw/Loss bar.
    // Three rows: (1) threat/edge chip row, (2) five attribute split bars,
    // (3) trait activity line. The estimator is still exported for the
    // engine, but no longer shapes the hub UI.
    const scorecard = (typeof window.buildMatchupScorecard === 'function')
      ? window.buildMatchupScorecard(lineup, opp)
      : null;

    if (scorecard) {
      const T = I18N.t.bind(I18N);
      // I18N.t returns the key itself when the key is missing, so a plain
      // `|| 'FALLBACK'` never triggers. This helper inspects the return value
      // and falls back to the English literal if no translation was found.
      const tOr = (key, fallback) => {
        const v = T(key);
        return (v === key) ? fallback : v;
      };
      const chip = (count, max = 5) =>
        '▰'.repeat(count) + '▱'.repeat(Math.max(0, max - count));

      // Row 1: edge (left, matches your team) & threat (right, matches opp).
      // Tooltips via native title attr — explain what the chips actually mean
      // for this specific matchup.
      const threatText = tOr('ui.scorecard.threat', 'THREAT');
      const edgeText   = tOr('ui.scorecard.edge',   'EDGE');
      const edgeTooltip = tOr('ui.scorecard.edgeTooltip',
        'Your advantages: traits that counter this opponent plus any stat surplus. ' +
        'Independent of Threat — you can have both high.');
      const threatTooltip = tOr('ui.scorecard.threatTooltip',
        'Their danger to you: opponent traits that hurt your squad plus any raw power gap. ' +
        'Independent of Edge — you can have both high.');
      const topEdgeLine = scorecard.topEdge   ? '\n• ' + scorecard.topEdge   : '';
      const topThreatLine = scorecard.topThreat ? '\n• ' + scorecard.topThreat : '';

      const chipRow = el('div', { class:'sc-chips' }, [
        el('div', {
          class:'sc-chip sc-edge',
          title: edgeTooltip + (topEdgeLine ? '\n\nThis match:' + topEdgeLine : '')
        }, [
          el('span', { class:'sc-chip-label' }, [edgeText]),
          el('span', { class:'sc-chip-level' }, [chip(scorecard.edge)])
        ]),
        el('div', {
          class:'sc-chip sc-threat',
          title: threatTooltip + (topThreatLine ? '\n\nThis match:' + topThreatLine : '')
        }, [
          el('span', { class:'sc-chip-label' }, [threatText]),
          el('span', { class:'sc-chip-level' }, [chip(scorecard.threat)])
        ]),
        // Match difficulty chip — reflects the v9 matchDifficulty scaling.
        // Match 1 is 2% opp-offense bonus, final is 30%. 5-level scale so
        // it reads visually alongside Edge/Threat: 1-3 matches = 1 bar,
        // 4-6 = 2 bars, 7-9 = 3 bars, 10-12 = 4 bars, 13-15 = 5 bars.
        (() => {
          const mn = (window.state?.matchNumber || 0) + 1;
          const level = Math.min(5, Math.ceil(mn / 3));
          const pct = Math.round(mn * 2);
          const diffTooltip = tOr('ui.scorecard.diffTooltip',
            'Structural difficulty scales with match number. Late matches ' +
            'hit the opp offense harder (+' + pct + '% at this match). ' +
            'Defense cards and condition management matter more.');
          return el('div', {
            class:'sc-chip sc-diff sc-diff-' + level,
            title: diffTooltip
          }, [
            el('span', { class:'sc-chip-label' }, [tOr('ui.scorecard.diff', 'DIFF')]),
            el('span', { class:'sc-chip-level' }, [chip(level)])
          ]);
        })()
      ]);
      anchor.appendChild(chipRow);

      // Row 2: five attribute split bars. Each bar is split proportionally
      // between "me" (green) and "opp" (red), so visual weight = stat size.
      const statLabels = {
        offense:   tOr('ui.scorecard.off', 'OFF'),
        defense:   tOr('ui.scorecard.def', 'DEF'),
        tempo:     tOr('ui.scorecard.tmp', 'TMP'),
        vision:    tOr('ui.scorecard.vis', 'VIS'),
        composure: tOr('ui.scorecard.cmp', 'CMP')
      };
      const barsRow = el('div', { class:'sc-bars' }, scorecard.stats.map(s => {
        const total = Math.max(1, s.me + s.opp);
        const mePct  = (s.me  / total * 100).toFixed(1);
        const oppPct = (s.opp / total * 100).toFixed(1);
        const leading = s.diff > 0 ? 'me' : (s.diff < 0 ? 'opp' : 'even');
        return el('div', { class:'sc-bar-row' }, [
          el('span', { class:'sc-bar-label' }, [statLabels[s.stat] || s.stat.toUpperCase()]),
          el('span', { class:'sc-bar-me-val' },  [String(s.me)]),
          el('div',  { class:'sc-bar lead-' + leading }, [
            el('div', { class:'sc-bar-me',  style:{ width: mePct  + '%' } }, []),
            el('div', { class:'sc-bar-opp', style:{ width: oppPct + '%' } }, [])
          ]),
          el('span', { class:'sc-bar-opp-val' }, [String(s.opp)])
        ]);
      }));
      anchor.appendChild(barsRow);

      // Row 3: trait activity line.
      const traitLineText = tOr('ui.scorecard.traitActivity',
        '~{n} trait triggers expected · {p} passives active')
        .replace('{n}', scorecard.triggersExpected)
        .replace('{p}', scorecard.passiveCount);
      const traitLine = el('div', { class:'sc-trait-line mono-sm' }, [traitLineText]);
      anchor.appendChild(traitLine);
    }

    // ── Intel: Probable Frames this match ──────────────────────────────
    // Predicts 2-3 situations most likely to arise during this match based
    // on the squad/opp shape, and counts how many deck cards specifically
    // address each one. Turns pre-match intel from "who are they" into
    // "what will happen" — guides card picks and rotation decisions.
    //
    // v0.56 — Gated by match number. The panel adds five+ visual
    // signals (frame title, severity color, likelihood dots, counter
    // count, payoff vs counter wording) that a player just learning
    // the basics can't decode. Mirrors the v0.51 trait-severity gate:
    // Probable Situations doesn't appear until match 3, by which point
    // the player has played one full match plus the second-stage
    // tutorial (v0.55). Mechanically the frames still occur from match
    // 1 — just the pre-match preview waits.
    const matchNumber = (state?.matchNumber || 0);
    if (typeof window.predictProbableFrames === 'function' && matchNumber >= 2) {
      const predicted = window.predictProbableFrames(lineup, opp);
      if (predicted && predicted.length > 0) {
        const deckIds = (window.KL?.cards?.getFullDeckContents)
          ? window.KL.cards.getFullDeckContents(state).map(c => c.id || c)
          : [];
        const withCounters = window.countDeckFrameCounters
          ? window.countDeckFrameCounters(deckIds, predicted)
          : predicted.map(p => ({ ...p, frameId: p.id, counterCount: 0 }));

        const panel = el('div', { class: 'anchor-intel-panel' }, [
          el('div', { class: 'aip-title' }, [
            (I18N.t('ui.intel.probableFrames') === 'ui.intel.probableFrames'
              ? 'PROBABLE SITUATIONS'
              : I18N.t('ui.intel.probableFrames'))
          ])
        ]);

        for (const entry of withCounters) {
          // Likelihood → visual chips (3-level: low/med/high)
          const lvl = entry.likelihood >= 0.65 ? 'high'
                    : entry.likelihood >= 0.4  ? 'med'
                    : 'low';
          const frameKey = UI.frameIdToI18nKey(entry.frameId);
          const frameTitle = I18N.t('ui.frames.' + frameKey + '.title');
          const showTitle  = frameTitle.startsWith('ui.frames.')
            ? entry.frameId.replace(/_/g, ' ').toUpperCase()
            : frameTitle;

          // v0.45 — Severity-Tone: zeigt ob der Frame FÜR uns (good/
          // opportunity, grün) oder GEGEN uns (warn/danger, rot/orange)
          // läuft. Statische Map, da predictProbableFrames derzeit nur
          // id+likelihood liefert und der Severity-Wert im frame()-Hook
          // einen Match-State bräuchte.
          //
          // v0.53 — Severity hochgezogen vor counterLabel-Berechnung,
          // damit das Label kontextrichtig wird. Bisher hieß es überall
          // "1 counter", auch bei Frames die FÜR uns laufen
          // (keeper_in_zone, hot_corridor, opp_*) — semantisch falsch:
          // diese Karten KONTERN nicht, sie HEBELN den Vorteil. Der
          // FRAME_COUNTERS-Code-Kommentar nennt sie selbst "payoff
          // cards" für die guten Frames. Jetzt: counters/no counters
          // bei warn/danger, payoffs/no payoffs bei good/opportunity.
          // i18n-Keys bekommen Fallbacks, damit Locales ohne Übersetzung
          // sauber bleiben.
          const FRAME_SEVERITY = {
            striker_frustrated:    'warn',
            keeper_in_zone:        'good',
            hot_corridor:          'good',
            opp_star_down:         'opportunity',
            red_card_risk:         'danger',
            opp_keeper_shaky:      'opportunity',
            opp_defense_stretched: 'opportunity',
            condition_critical:    'danger'
          };
          const sev = FRAME_SEVERITY[entry.frameId] || 'neutral';
          const isPayoff = (sev === 'good' || sev === 'opportunity');

          const tOr = (key, fallback) => {
            const v = I18N.t(key);
            return v === key ? fallback : v;
          };
          const labelMany = isPayoff
            ? tOr('ui.intel.payoffs',   'payoffs')
            : tOr('ui.intel.counters',  'counters');
          const labelNone = isPayoff
            ? tOr('ui.intel.noPayoffs', 'no payoffs')
            : tOr('ui.intel.noCounters','no counters');

          const counterLabel = entry.counterCount > 0
            ? (entry.counterCount + ' ' + labelMany)
            : labelNone;

          const tone = entry.counterCount >= 2 ? 'ready'
                     : entry.counterCount >= 1 ? 'partial'
                     : 'exposed';

          // Tooltip: pull the full frame description from i18n so hover
          // surfaces "what does this situation mean mechanically".
          const frameText = I18N.t('ui.frames.' + frameKey + '.text');
          const frameEffect = I18N.t('ui.frames.' + frameKey + '.effect');
          const frameHint = I18N.t('ui.frames.' + frameKey + '.hint');
          const parts = [];
          if (!frameText.startsWith('ui.frames.'))   parts.push(frameText);
          if (!frameEffect.startsWith('ui.frames.')) parts.push('→ ' + frameEffect);
          if (!frameHint.startsWith('ui.frames.'))   parts.push('💡 ' + frameHint);
          // v0.53 — Tooltip-Suffix übernimmt die counter/payoff-Logik
          // (vorher war auch der Tooltip mit "Counters in your deck"
          // formuliert, selbst wenn die Karten den Vorteil hebeln).
          const cardsLabel = isPayoff ? 'Payoffs' : 'Counters';
          const rowTitle = (parts.length
            ? parts.join('\n')
            : 'This situation may occur during the match.')
            + (entry.counterCardIds?.length
              ? '\n\n' + cardsLabel + ' in your deck: ' + entry.counterCardIds
                  .map(id => I18N.t('ui.cards.' + id + '.name'))
                  .filter(n => !n.startsWith('ui.cards.'))
                  .join(', ')
              : '');
          const likelihoodText = lvl === 'high' ? 'HIGH likelihood'
                              : lvl === 'med'  ? 'MEDIUM likelihood'
                              : 'LOW likelihood';

          // v0.45/v0.53 — Severity-Tone bereits oben gesetzt; hier nur
          // an die Row-Klasse heften, damit aip-tone-* und aip-sev-*
          // gemeinsam stylen können.
          panel.appendChild(el('div', {
            class: 'aip-row aip-tone-' + tone + ' aip-sev-' + sev,
            title: rowTitle
          }, [
            el('span', {
              class: 'aip-lvl aip-lvl-' + lvl,
              title: likelihoodText
            }, [
              lvl === 'high' ? '▰▰▰' : lvl === 'med' ? '▰▰▱' : '▰▱▱'
            ]),
            el('span', { class: 'aip-frame' }, [showTitle]),
            el('span', {
              class: 'aip-counter',
              // v0.53 — auch das aip-counter-tooltip übernimmt counter/
              // payoff-Kontext, damit "your deck has no cards specifically
              // addressing" nicht für ein FÜR-uns-Frame stehen bleibt.
              title: entry.counterCount === 0
                ? (isPayoff
                    ? 'Your deck has no cards that exploit this situation.'
                    : 'Your deck has no cards specifically addressing this situation.')
                : (isPayoff
                    ? entry.counterCount + ' card(s) in your deck exploit this situation.'
                    : entry.counterCount + ' card(s) in your deck specifically address this situation.')
            }, [counterLabel])
          ]));
        }
        anchor.appendChild(panel);
      }
    }

    if (oneLiner && oneLiner.headline) {
      // Verdict-Bar ("New Challenger", "Close match", etc.) wurde entfernt —
      // das meiste davon ist bei Threat/Edge-Chips und Form-Chip bereits
      // sichtbar. Die Headline bleibt als einzige Freitext-Insight, weil sie
      // matchup-spezifisch ist ("Stat-driven match, no big trait matchups").
      // Boss-Status kommt über das 🏆-Prefix im opp-Namen + BOSS-Tag.
      anchor.appendChild(el('div', { class:'anchor-headline' }, [oneLiner.headline]));
    }

    // --- Run-Stats: accordion section absorbs the old dopamine-chip row.
    // Meta line always shows the hottest counter so players still get
    // an ambient peek without opening the section; the body (rendered
    // lazily when expanded) holds the full grid of run stats.
    UI.renderHubStatsSection();

    // Achievement-pop list: renderResult consumes this on the result
    // screen (v52.2 — see the result-achievements-strip block). The
    // clear here is a safety net that fires if we arrive at the hub
    // without a result screen in between (e.g. start of run, or after
    // the end-of-run overlay). Without the clear, stale pops would
    // re-surface on any later render path that reads the list.
    if (state.pendingAchievementPop) state.pendingAchievementPop = [];

    // --- Alerts ---
    const alertsBox = $('#hub-alerts');
    alertsBox.innerHTML = '';
    for (const p of lineup) {
      const suspendedNext = p._suspendedUntil && p._suspendedUntil > state.matchNumber;
      if (suspendedNext) {
        const matchesLeft = p._suspendedUntil - state.matchNumber;
        const tipKey = 'ui.hub.suspendedAlertTooltip';
        let tip = I18N.t(tipKey, { name: p.name, n: matchesLeft });
        if (tip === tipKey) {
          // Fallback, falls der i18n-Key noch nicht übersetzt ist.
          tip = `${p.name}: red card in the previous match. `
              + `Suspended for ${matchesLeft} more match${matchesLeft === 1 ? '' : 'es'}. `
              + `Substitute from the bench before starting.`;
        }
        alertsBox.appendChild(el('div', { class:'hub-alert suspend', title: tip }, [
          '⏸ ' + I18N.t('ui.hub.suspendedAlert', { name: p.name })
        ]));
      }
    }
    if (state.currentLossStreak === 2) {
      alertsBox.appendChild(el('div', { class:'hub-alert danger' }, [
        I18N.t('ui.labels.losingWarning')
      ]));
    }

    // --- Squad ---
    const sqBox = $('#hub-squad');
    sqBox.innerHTML = '';
    lineup.forEach(p => {
      const card = UI.renderPlayerCard(p, { showStatDiff: true, showCondition: true });
      sqBox.appendChild(card);
    });

    const bench = getBench();
    // Bench is rendered INSIDE the squad box now (below the starters)
    // rather than in its own accordion section — keeps all roster
    // players in one visual group so you compare starters ↔ bench at
    // a glance. Separator label marks the split. If no bench, nothing
    // is appended.
    if (bench.length > 0) {
      const divider = el('div', { class: 'squad-subdivider' }, [
        el('span', { class: 'sqd-label' }, [I18N.t('ui.hub.bench') || 'BENCH']),
        el('span', { class: 'sqd-count' }, [bench.length.toString()])
      ]);
      sqBox.appendChild(divider);
      bench.forEach(p => {
        const card = UI.renderPlayerCard(p, { bench: true, showStatDiff: true, showCondition: true });
        sqBox.appendChild(card);
      });
    }

    // Squad meta count = starters + bench for the accordion header
    const squadMeta = document.getElementById('hub-acc-squad-meta');
    if (squadMeta) squadMeta.textContent = lineup.length + (bench.length ? ' · ' + bench.length + ' ' + (I18N.t('ui.hub.bench') || 'BENCH').toLowerCase() : '');

    // Deck widget — inline panel version (not the chip).
    UI.renderHubDeckWidget();

    // Restore last-opened accordion section.
    // v42.1: no auto-open any longer. All accordions start closed on
    // hub render; the user chooses what to expand. Previous behaviour
    // forced at least one section open via localStorage restore, which
    // felt noisy once bench was merged into squad.

    UI.showScreen('screen-hub');
  },

  // Saison-Transition-Modal — overlay screen between seasons that
  // reveals the new tier, the returning companion ("Mitaufsteiger"),
  // and a brief flavor narration. For Cup-mode entry, shows the 3
  // upcoming boss-opponents as a bracket-preview. User clicks
  // CONTINUE to proceed into the new season's first match.
  //
  // Trigger: flow.continueSeason calls this BEFORE FLOW.advance.
  // The continue-button on the modal then triggers FLOW.advance.
  showSeasonTransition(opts) {
    // opts: { kind: 'tier' | 'cup', newTier?, returningOpp?, cupBosses? }
    const existing = document.getElementById('season-transition-modal');
    if (existing) existing.remove();

    const isCup = opts.kind === 'cup';
    const tierName = opts.newTier?.name || '?';
    const seasonNum = state._seasonNumber || 1;

    let title, sub, body, narration;
    if (isCup) {
      title = I18N.t('ui.transition.cupTitle') || 'POKAL!';
      sub = I18N.t('ui.transition.cupSub') || '3 BOSSES STAND BETWEEN YOU AND THE TROPHY';
      narration = I18N.t('ui.transition.cupNarration')
        || 'Du hast Pro Liga gemeistert. Jetzt: Knockout. Drei Bosse, eskalierende Härte. Verlierst du eine Runde, ist dein Run vorbei.';
    } else {
      const isUp = (opts.previousTier?.order ?? 0) < (opts.newTier?.order ?? 0);
      const isDown = (opts.previousTier?.order ?? 0) > (opts.newTier?.order ?? 0);
      if (isUp) {
        title = (I18N.t('ui.transition.welcomeTo') || 'WILLKOMMEN IN') + ' ' + tierName;
        sub = I18N.t('ui.transition.promoSub') || 'NEUE SAISON · STÄRKERE GEGNER';
        narration = I18N.t('ui.transition.promoNarration')
          || 'Du bist eine Liga höher. Die Gegner sind härter, die Bosse fordernder. Dein Roster bleibt — pass deine Taktik an.';
      } else if (isDown) {
        title = (I18N.t('ui.transition.dropTo') || 'ABSTIEG IN') + ' ' + tierName;
        sub = I18N.t('ui.transition.dropSub') || 'NEUSTART · LIGA TIEFER';
        narration = I18N.t('ui.transition.dropNarration')
          || 'Die letzte Saison lief schlecht. Du fängst eine Liga tiefer wieder an. Nutze die Chance.';
      } else {
        title = tierName + ' · SAISON ' + seasonNum;
        sub = I18N.t('ui.transition.staySub') || 'GLEICHE LIGA · NEUE SAISON';
        narration = I18N.t('ui.transition.stayNarration')
          || 'Du bleibst in der Liga. Andere Gegner, gleiche Herausforderung — diesmal vielleicht oben?';
      }
    }

    body = el('div', { class: 'transition-body' }, []);
    body.appendChild(el('div', { class: 'transition-narration' }, [narration]));

    // Returning opp (Mitaufsteiger) callout — only for tier transitions
    if (!isCup && opts.returningOpp) {
      const opp = opts.returningOpp;
      const reCallout = el('div', { class: 'transition-returning' }, [
        el('div', { class: 'tr-label' }, [
          (opts.previousTier?.order ?? 0) < (opts.newTier?.order ?? 0)
            ? (I18N.t('ui.transition.companionPromo') || 'MITAUFSTEIGER:')
            : (I18N.t('ui.transition.companionDrop')  || 'MITABSTEIGER:')
        ]),
        el('div', { class: 'tr-team' }, [
          opp.logo ? el('img', { src: opp.logo, class: 'tr-logo', alt: '' }) : null,
          el('span', { class: 'tr-name' }, [opp.name || '?'])
        ].filter(Boolean))
      ]);
      body.appendChild(reCallout);
    }

    // Cup-bosses preview — show all 3 bosses as a bracket
    if (isCup && opts.cupBosses?.length) {
      const bracket = el('div', { class: 'transition-cup-bracket' });
      const labels = ['VIERTEL', 'HALB', 'FINALE'];
      opts.cupBosses.forEach((b, i) => {
        bracket.appendChild(el('div', {
          class: 'tcb-round' + (i === opts.cupBosses.length - 1 ? ' tcb-final' : '')
        }, [
          el('div', { class: 'tcb-round-label' }, [
            I18N.t('ui.cup.' + ['quarter','semi','final'][i]) || labels[i]
          ]),
          b.logo ? el('img', { src: b.logo, class: 'tcb-logo', alt: '' }) : null,
          el('div', { class: 'tcb-name' }, [b.name || '?']),
          el('div', { class: 'tcb-power' }, ['POW ' + (b.power || '?')])
        ].filter(Boolean)));
      });
      body.appendChild(bracket);
    }

    const continueBtn = el('button', {
      class: 'btn primary transition-continue',
      onclick: 'UI.dismissSeasonTransition()'
    }, [I18N.t('ui.transition.continue') || 'WEITER']);

    const modal = el('div', {
      id: 'season-transition-modal',
      class: 'season-transition-modal' + (isCup ? ' is-cup' : '')
    }, [
      el('div', { class: 'transition-card' }, [
        el('div', { class: 'transition-header' }, [
          el('h1', { class: 'transition-title' }, [title]),
          el('div', { class: 'transition-sub' }, [sub])
        ]),
        body,
        el('div', { class: 'transition-actions' }, [continueBtn])
      ])
    ]);
    document.body.appendChild(modal);
  },

  dismissSeasonTransition() {
    const modal = document.getElementById('season-transition-modal');
    if (modal) modal.remove();
    if (window.FLOW?.advance) FLOW.advance();
  },

  // Open one accordion section, collapse the others. Section IDs:
  // 'squad' | 'deck'. Remembered in localStorage so switching
  // screens doesn't lose the player's last focus. (v42: bench merged
  // into the squad section, no longer a separate accordion.)
  hubAccOpen(sectionId) {
    if (sectionId === 'bench') sectionId = 'squad';
    const sections = document.querySelectorAll('.hub-acc-section');
    // Toggle behaviour: if the clicked section is already open, close
    // it (no section remains open). Otherwise open it exclusively.
    const target = Array.from(sections).find(s => s.dataset.section === sectionId);
    const targetWasOpen = target?.classList.contains('open');
    sections.forEach(sec => {
      if (targetWasOpen) {
        sec.classList.remove('open');
      } else {
        sec.classList.toggle('open', sec.dataset.section === sectionId);
      }
    });
  },

  // Renders the deck section of the hub accordion. Called from renderHub.
  renderHubDeckWidget() {
    const section = document.getElementById('hub-acc-deck-section');
    if (!section) return;
    const cfg = window.CONFIG || window.KL?.config?.CONFIG;
    if (!cfg?.cardsEnabled || !window.KL?.cards) {
      section.style.display = 'none';
      return;
    }
    const deckAll = window.KL.cards.getFullDeckContents(state);
    if (!deckAll.length) { section.style.display = 'none'; return; }

    section.style.display = '';
    const meta = document.getElementById('hub-acc-deck-meta');
    if (meta) meta.textContent = deckAll.length;

    const panel = document.getElementById('hub-deck-panel-inline');
    if (panel) UI.renderHubDeckPanel(panel, deckAll);
  },

  // ── v52.2: Run-Stats accordion section ────────────────────────────────
  // Replaces the old hub-run-chips row that sat between anchor and
  // accordion. Shows the same dopamine counters (traits fired, goals,
  // evolutions, win streak) plus richer run info (W/D/L, goal diff,
  // best streak) in a compact grid inside an accordion body. The
  // accordion-meta line stays visible and surfaces the hottest single
  // counter so the "ambient progress feedback" the chips used to
  // provide isn't lost when the section is collapsed.
  renderHubStatsSection() {
    const metaEl = document.getElementById('hub-acc-stats-meta');
    const gridEl = document.getElementById('hub-stats-grid');
    if (!metaEl && !gridEl) return;

    const evoCount   = state.runEvoCount       || 0;
    const traitFires = state.runTraitFires     || 0;
    const runGoals   = state.goalsFor          || 0;
    const runGA      = state.goalsAgainst      || 0;
    const winStreak  = state.currentWinStreak  || 0;
    const bestStreak = state.longestWinStreak  || 0;
    const wins       = state.wins              || 0;
    const draws      = state.draws             || 0;
    const losses     = state.losses            || 0;
    const maxEvos    = 5 * 3;
    const goalDiff   = runGoals - runGA;

    // Meta-peek — surface the single hottest counter so the collapsed
    // accordion still radiates progress. Priority: active win streak >
    // goals milestone > trait fires milestone > evolutions milestone >
    // plain goal count. Designed so a "hot" stat always wins the peek.
    if (metaEl) {
      let peek = '';
      if (winStreak >= 2) {
        peek = '🔥 ' + I18N.t('ui.hub.chipStreak', { n: winStreak });
      } else if (runGoals >= 10) {
        peek = '⚽ ' + runGoals;
      } else if (traitFires >= 50) {
        peek = '🎯 ' + traitFires;
      } else if (evoCount >= 10) {
        peek = '✦ ' + evoCount + '/' + maxEvos;
      } else if (runGoals > 0) {
        peek = '⚽ ' + runGoals;
      }
      metaEl.textContent = peek;
    }

    if (!gridEl) return;
    gridEl.innerHTML = '';

    // Compact cell builder — each tile shows icon + value + label in
    // the same visual language as the old chips, so players coming
    // from v52.1 recognise the numbers instantly.
    const mkTile = (icon, value, labelKey, tone, title) => {
      const tile = el('div', {
        class: 'hub-stats-tile' + (tone ? ' tone-' + tone : ''),
        title: title || ''
      }, [
        el('span', { class: 'hst-icon' }, [icon]),
        el('span', { class: 'hst-value' }, [String(value)]),
        el('span', { class: 'hst-label' }, [I18N.t(labelKey) || labelKey])
      ]);
      return tile;
    };

    // Record block — W / D / L across the run. Goal diff completes the
    // league-row snapshot so this tile set reads like a mini table row.
    gridEl.appendChild(mkTile('✓', wins,   'ui.hub.statsWins',
      wins >= 7 ? 'hot' : '', 'Wins this run.'));
    gridEl.appendChild(mkTile('—', draws,  'ui.hub.statsDraws', '', 'Draws this run.'));
    gridEl.appendChild(mkTile('✗', losses, 'ui.hub.statsLosses', '',
      'Losses this run. Three in a row ends the run.'));

    const diffStr = (goalDiff > 0 ? '+' : '') + goalDiff;
    gridEl.appendChild(mkTile('±', diffStr, 'ui.hub.statsGoalDiff',
      goalDiff >= 5 ? 'hot' : (goalDiff <= -5 ? 'cold' : ''),
      'Goal difference: ' + runGoals + ' scored, ' + runGA + ' conceded.'));

    // Dopamine counters — carry over from the old chip row so the
    // stats section feels continuous with what players are used to.
    gridEl.appendChild(mkTile('⚽', runGoals, 'ui.hub.statsGoals',
      runGoals >= 10 ? 'hot' : '',
      'Goals scored across the full run. 10+ = "hot".'));
    gridEl.appendChild(mkTile('🎯', traitFires, 'ui.hub.statsTraits',
      traitFires >= 50 ? 'hot' : '',
      'Total trait triggers across all matches in this run. 50+ = "hot".'));
    gridEl.appendChild(mkTile('✦', evoCount + '/' + maxEvos, 'ui.hub.statsEvos',
      evoCount >= 10 ? 'hot' : '',
      'Player evolutions this run (out of ' + maxEvos + ' max).'));

    // Streak row — only show the "best" streak as a separate tile when
    // it's greater than the current active streak. Otherwise the active
    // streak already implies the best and showing both would be noise.
    if (winStreak >= 2) {
      gridEl.appendChild(mkTile('🔥', winStreak, 'ui.hub.statsStreakNow',
        'streak',
        'Active win streak. Higher streaks boost XP and unlock Running Hot card scaling.'));
    }
    if (bestStreak > winStreak && bestStreak >= 2) {
      gridEl.appendChild(mkTile('★', bestStreak, 'ui.hub.statsStreakBest', '',
        'Longest win streak this run.'));
    }
  },

  renderHubDeckPanel(panel, cardIds) {
    panel.innerHTML = '';
    // Group cards by id so duplicates show once with a count.
    const counts = {};
    for (const id of cardIds) counts[id] = (counts[id] || 0) + 1;
    const sorted = Object.keys(counts).sort((a, b) => {
      // Weak basics at the bottom; uncommons/rares at the top.
      const defA = window.KL.cards.getCardDef(a);
      const defB = window.KL.cards.getCardDef(b);
      const rOrder = { rare: 0, uncommon: 1, common: 2 };
      return (rOrder[defA?.rarity] ?? 3) - (rOrder[defB?.rarity] ?? 3);
    });

    // Deck composition summary — role-count breakdown by card type so the
    // player sees at a glance how balanced the deck is. Sits above the
    // grid. Shows counts for the four main types; drops any type with 0
    // so the summary stays compact.
    const typeCounts = { setup: 0, combo: 0, trigger: 0, defense: 0, counter: 0 };
    for (const id of cardIds) {
      const def = window.KL.cards.getCardDef(id);
      if (def?.type && typeCounts[def.type] !== undefined) typeCounts[def.type]++;
    }
    const typeLabel = {
      setup:   I18N.t('ui.cards.types.setup'),
      combo:   I18N.t('ui.cards.types.combo'),
      trigger: I18N.t('ui.cards.types.trigger'),
      defense: I18N.t('ui.cards.types.defense'),
      counter: I18N.t('ui.cards.types.counter')
    };
    const TYPE_EXPLAIN = {
      setup:   'Setup cards generate Flow or unlock lanes. They don\'t deal big damage alone — they enable Triggers and Combos.',
      trigger: 'Trigger cards fire a mechanical effect. Often consume Flow for bigger payoffs.',
      combo:   'Combo cards need conditions (Flow, Lane Open) to deliver their full effect. Build-up pays off here.',
      defense: 'Defense cards protect your backline and keeper. Counter opp offense and boost saves.',
      counter: 'Counter cards specifically punish telegraphed opp threats. Needs a "loaded" opp intent to shine.'
    };
    const summaryChips = [];
    for (const t of Object.keys(typeCounts)) {
      if (typeCounts[t] > 0) {
        summaryChips.push(el('span', {
          class: 'deck-sum-chip deck-sum-' + t,
          title: TYPE_EXPLAIN[t] || ''
        }, [
          el('span', { class: 'dsc-count' }, [String(typeCounts[t])]),
          el('span', { class: 'dsc-label' }, [typeLabel[t]])
        ]));
      }
    }
    if (summaryChips.length > 0) {
      panel.appendChild(el('div', { class: 'deck-panel-summary' }, summaryChips));
    }

    const grid = el('div', { class: 'deck-panel-grid' });
    const upgrades = state._cardUpgrades || {};
    // Build affinity lookup: which card-ids are amplified by an evolved
    // starter? Helps the player see at a glance which deck cards
    // synergize with the squad they've shaped.
    const affinityCardIds = new Set();
    if (window.KL?.roles && state.roster) {
      for (const p of state.roster.filter(p => p.evolution)) {
        const def = window.KL.roles.getEvolutionDef?.(p.evolution);
        if (def?.cardAffinity) {
          for (const id of def.cardAffinity) affinityCardIds.add(id);
        }
      }
    }

    for (const id of sorted) {
      const def = window.KL.cards.getCardDef(id);
      if (!def) continue;
      const isUpgraded = !!upgrades[id];
      const isRetain = (def.tags || []).includes('retain');
      const hasAffinity = affinityCardIds.has(id);
      const fatigueCost = window.KL.cards.getFatigueCost?.(null, id);

      // v0.39 — Tooltip rewritten to be narrative-safe and actionable.
      // Previously: just ui.cards.<id>.desc. Players reported the deck-
      // panel numbers were unclear (cost vs. count) and the description
      // alone doesn't explain HOW to play the card. New tooltip leads
      // with a structured line (type · energy · fatigue · duplicates),
      // then the description, then any retain/upgrade/affinity notes.
      const cardName  = I18N.t('ui.cards.' + id + '.name') || id;
      const typeCaption = (typeLabel[def.type] || def.type).toUpperCase();
      const copies    = counts[id] || 1;
      const copiesNote = copies > 1 ? `  ·  ${copies} copies in deck` : '';
      const headLine = `${cardName}  —  ${typeCaption}  ·  Energy ${def.cost}`
                     + (fatigueCost && fatigueCost.amount > 0 ? `  ·  Fatigue ${fatigueCost.amount}` : '')
                     + copiesNote;

      let descTitle = headLine + '\n\n' + UI.resolveCardDescription(id, null);
      if (isUpgraded) descTitle += '\n\n✦ Upgraded — +25% effect.';
      if (isRetain)   descTitle += '\n\n⚓ Retain — stays in hand at round end.';
      if (hasAffinity)descTitle += '\n\n↑ Boosted by an evolved starter on your squad.';

      const entry = el('div', {
        class: 'deck-panel-entry rarity-' + def.rarity + ' type-' + def.type
          + (isUpgraded ? ' is-upgraded' : '')
          + (hasAffinity ? ' has-affinity' : ''),
        title: descTitle
      }, [
        // v0.39 — Energy cost prefixed with the ⚡ symbol to remove the
        // "is this a count or a cost?" ambiguity. A bare "2" at the
        // start of a deck-list row reads as "2 copies"; "⚡2" reads
        // unambiguously as "costs 2 energy" and matches the hand-card
        // fatigue chip's vocabulary.
        el('span', { class: 'dpe-cost', title: 'Energy cost to play' }, ['⚡' + String(def.cost)]),
        el('span', { class: 'dpe-name' }, [I18N.t('ui.cards.' + id + '.name')]),
        isUpgraded ? el('span', { class: 'dpe-badge dpe-upgraded' }, ['✦']) : null,
        isRetain ? el('span', { class: 'dpe-badge dpe-retain' }, ['⚓']) : null,
        hasAffinity ? el('span', { class: 'dpe-badge dpe-affinity' }, ['↑']) : null,
        counts[id] > 1
          ? el('span', { class: 'dpe-count', title: `${counts[id]} copies in deck` }, ['×' + counts[id]])
          : null
      ]);
      grid.appendChild(entry);
    }
    panel.appendChild(grid);
  },

  toggleDeckPanel() {
    const panel = document.getElementById('hub-deck-panel');
    const chip = document.getElementById('hub-deck-chip');
    if (!panel) return;
    const open = panel.style.display !== 'none';
    panel.style.display = open ? 'none' : 'block';
    if (chip) chip.classList.toggle('open', !open);
  },

  // Tap-Detail: Spieler anklicken im Hub → volles Info-Modal.
  showPlayerDetail(p) {
    if (!p) return;
    const T = I18N.t.bind(I18N);
    const stageSymbols = ['★', '★★', '★★★'];
    const roleLabel = DATA.roles.find(r => r.id === p.role)?.label || p.role;
    const suspendedNext = p._suspendedUntil && window.state && p._suspendedUntil > window.state.matchNumber;
    const runGoals = p._runGoals || 0;

    const modal = $('#interrupt-modal');
    const overlay = $('#interrupt-overlay');
    modal.innerHTML = '';
    modal.classList.remove('interrupt-modal--event');

    // Header: Rolle + Stage + Name
    modal.appendChild(el('div', { class:'pd-head' }, [
      el('div', { class:'pd-role-line' }, [
        el('span', { class:'pd-role' }, [UI.roleAbbr(p.role)]),
        el('span', { class:'pd-stage' }, [stageSymbols[p.stage] || '★']),
        el('span', { class:'pd-role-label' }, [roleLabel])
      ]),
      el('h2', { class:'pd-name' }, [p.name]),
      p.label ? el('div', { class:'pd-archetype mono-sm' }, [p.label]) : null
    ]));

    // Status-Badges (Sperre, Karte)
    const statusBadges = [];
    if (suspendedNext) statusBadges.push({ cls:'pd-badge warn', text:'⏸ ' + T('ui.detail.suspended') });
    if (statusBadges.length) {
      modal.appendChild(el('div', { class:'pd-status-row' },
        statusBadges.map(b => el('div', { class:b.cls }, [b.text]))
      ));
    }

    // Level + XP-Bar
    const xpPct = Math.min(100, (p.xp / p.xpToNext) * 100);
    modal.appendChild(el('div', { class:'pd-level' }, [
      el('div', { class:'pd-level-row' }, [
        el('span', { class:'pd-level-label' }, [T('ui.detail.level', { lv: p.level })]),
        el('span', { class:'pd-xp-text' }, [T('ui.detail.xpProgress', { xp: p.xp, next: p.xpToNext })])
      ]),
      el('div', { class:'pd-xp-bar' }, [
        el('div', { class:'pd-xp-fill', style:{ width: xpPct + '%' } })
      ])
    ]));

    // Stats-Grid
    const statsBlock = el('div', { class:'pd-section' }, [
      el('div', { class:'pd-section-title' }, [T('ui.detail.stats')]),
      el('div', { class:'pd-stats-grid' }, [
        el('div', { class:'pd-stat' }, [ el('span', { class:'pd-stat-label' }, ['OFF']), el('span', { class:'pd-stat-val' }, [String(p.stats.offense)]) ]),
        el('div', { class:'pd-stat' }, [ el('span', { class:'pd-stat-label' }, ['DEF']), el('span', { class:'pd-stat-val' }, [String(p.stats.defense)]) ]),
        el('div', { class:'pd-stat' }, [ el('span', { class:'pd-stat-label' }, ['TMP']), el('span', { class:'pd-stat-val' }, [String(p.stats.tempo)]) ]),
        el('div', { class:'pd-stat' }, [ el('span', { class:'pd-stat-label' }, ['VIS']), el('span', { class:'pd-stat-val' }, [String(p.stats.vision)]) ]),
        el('div', { class:'pd-stat' }, [ el('span', { class:'pd-stat-label' }, ['CMP']), el('span', { class:'pd-stat-val' }, [String(p.stats.composure)]) ])
      ])
    ]);
    modal.appendChild(statsBlock);

    // Run Stats
    if (runGoals > 0 || p.goals) {
      modal.appendChild(el('div', { class:'pd-section' }, [
        el('div', { class:'pd-section-title' }, [T('ui.detail.runStats')]),
        el('div', { class:'pd-run-stats' }, [
          el('div', { class:'pd-run-stat' }, [
            el('span', { class:'pd-run-label' }, [T('ui.detail.runGoals')]),
            el('span', { class:'pd-run-val' }, [String(runGoals || p.goals || 0)])
          ])
        ])
      ]));
    }

    // Traits
    // v0.47 — Kategorisiert angezeigt (passive/event/conditional/once)
    // statt alles in einem flachen Block. Hilft auf einen Blick zu
    // erkennen wann welcher Trait greift. Leere Kategorien werden nicht
    // gerendert; unbekannte Trait-IDs landen unter "passive" als Default.
    const traitsBody = el('div', { class: 'pd-traits' });
    if (p.traits?.length) {
      const CATEGORY_ORDER = ['passive', 'event', 'conditional', 'once'];
      const CATEGORY_MAP = window.KL?.traits?.TRAIT_CATEGORY || {};
      const grouped = { passive: [], event: [], conditional: [], once: [] };
      for (const tid of p.traits) {
        const tr = DATA.traits[tid];
        if (!tr) continue;
        const cat = CATEGORY_MAP[tid] || 'passive';
        (grouped[cat] || grouped.passive).push({ id: tid, ...tr });
      }
      for (const cat of CATEGORY_ORDER) {
        const bucket = grouped[cat];
        if (!bucket || bucket.length === 0) continue;
        const catLabel = T('ui.detail.traitCategory.' + cat);
        const catHint = T('ui.detail.traitCategoryHint.' + cat);
        const header = el('div', {
          class: 'pd-trait-cat pd-trait-cat-' + cat,
          title: catHint
        }, [catLabel]);
        traitsBody.appendChild(header);
        for (const tr of bucket) {
          traitsBody.appendChild(el('div', { class: 'pd-trait' }, [
            el('div', { class: 'pd-trait-name' }, [tr.name]),
            el('div', { class: 'pd-trait-desc' }, [tr.desc || ''])
          ]));
        }
      }
    } else {
      traitsBody.appendChild(el('div', { class: 'pd-trait-empty' }, [T('ui.detail.noTraits')]));
    }
    modal.appendChild(el('div', { class: 'pd-section' }, [
      el('div', { class: 'pd-section-title' }, [T('ui.detail.traits')]),
      traitsBody
    ]));

    // Close
    const closeBtn = el('button', { class:'btn primary', style:{ width:'100%', marginTop:'12px' } }, [T('ui.detail.close')]);
    closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
    modal.appendChild(closeBtn);

    overlay.classList.add('active');
    // Close beim Klick außerhalb
    overlay.onclick = (ev) => { if (ev.target === overlay) overlay.classList.remove('active'); };
  },

  renderLineup() {
    const lineup = getLineup();
    const bench = getBench();
    const slotsBox = $('#lineup-starters');
    slotsBox.innerHTML = '';
    lineup.forEach(p => {
      const card = UI.renderPlayerCard(p, { swapTarget: true, showCondition: true });
      card.addEventListener('click', () => UI.handleSwapClick(p.id));
      if (state._swapSelected === p.id) card.classList.add('selected');
      slotsBox.appendChild(card);
    });
    $('#bench-count').textContent = I18N.t('ui.labels.benchSlots', { count: bench.length, max: CONFIG.maxBench });
    const benchBox = $('#lineup-bench');
    benchBox.innerHTML = '';
    if (bench.length === 0) {
      benchBox.appendChild(el('div', { class:'slot-empty' }, [I18N.t('ui.labels.noBench')]));
    } else {
      bench.forEach(p => {
        const card = UI.renderPlayerCard(p, { swapTarget: true, bench: true, showCondition: true });
        card.addEventListener('click', () => UI.handleSwapClick(p.id));
        if (state._swapSelected === p.id) card.classList.add('selected');
        benchBox.appendChild(card);
      });
    }
    const hint = $('#lineup-hint');
    if (state._swapSelected) {
      const sel = state.roster.find(p => p.id === state._swapSelected);
      hint.textContent = I18N.t('ui.labels.swapSelected', { name: sel.name });
    } else {
      hint.textContent = I18N.t('ui.lineup.defaultHint');
    }
    UI.showScreen('screen-lineup');
  },

  handleSwapClick(playerId) {
    if (!state._swapSelected) {
      state._swapSelected = playerId;
    } else if (state._swapSelected === playerId) {
      state._swapSelected = null;
    } else {
      const id1 = state._swapSelected;
      const id2 = playerId;
      const in1 = state.lineupIds.includes(id1);
      const in2 = state.lineupIds.includes(id2);
      if (in1 === in2) {
        state._swapSelected = playerId;
      } else {
        const newLineupIds = state.lineupIds.slice();
        if (in1) {
          const idx = newLineupIds.indexOf(id1);
          newLineupIds[idx] = id2;
        } else {
          const idx = newLineupIds.indexOf(id2);
          newLineupIds[idx] = id1;
        }
        if (isLineupValid(newLineupIds)) {
          state.lineupIds = newLineupIds;
        } else {
          alert(I18N.t('ui.labels.swapRejected'));
        }
        state._swapSelected = null;
      }
    }
    UI.renderLineup();
  },

  renderMatchupIntelPanel(intel) {
    if (!intel) return null;
    const hasContent = intel.advantages.length || intel.warnings.length;
    if (!hasContent) return null;

    const delta = intel.powerDelta;
    let deltaText, deltaColor;
    // Schwelle synchron mit intel.js buildIntelOneLiner (dort: <= 25).
    if (Math.abs(delta) <= 25) {
      deltaText = I18N.t('ui.intel.deltaEven');
      deltaColor = 'var(--gold)';
    } else if (delta > 0) {
      deltaText = I18N.t('ui.intel.deltaAhead', { delta });
      deltaColor = 'var(--accent)';
    } else {
      deltaText = I18N.t('ui.intel.deltaBehind', { delta });
      deltaColor = 'var(--accent-2)';
    }

    const panel = el('div', { class: 'interrupt-panel intel-panel', style: { marginBottom: '14px', padding: '10px 12px' } });

    panel.appendChild(el('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px',
        paddingBottom: '8px',
        marginBottom: '8px',
        borderBottom: '1px dashed var(--dim)'
      }
    }, [
      el('span', {
        style: {
          fontFamily: 'var(--font-display)',
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--accent-3)'
        }
      }, [I18N.t('ui.intel.title')]),
      el('span', {
        style: {
          fontFamily: 'var(--font-display)',
          fontSize: '10px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: deltaColor,
          padding: '2px 6px',
          border: `1px solid ${deltaColor}`,
          background: 'rgba(0,0,0,0.3)'
        }
      }, [deltaText])
    ]));

    const columns = el('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px'
      },
      class: 'intel-columns'
    });

    const advCol = el('div', {});
    advCol.appendChild(el('div', {
      style: { color: 'var(--accent)', marginBottom: '6px', fontFamily: 'var(--font-display)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }
    }, ['✓ ' + I18N.t('ui.intel.advantagesTitle')]));
    if (intel.advantages.length) {
      for (const adv of intel.advantages) {
        advCol.appendChild(el('div', { class: 'hint-line hint-good', style: { marginBottom: '4px', fontSize: '10px' } }, [adv.text]));
      }
    } else {
      advCol.appendChild(el('div', {
        style: { fontSize: '10px', color: 'var(--muted)', fontStyle: 'italic', padding: '4px 0' }
      }, [I18N.t('ui.intel.noAdvantages')]));
    }
    columns.appendChild(advCol);

    const warnCol = el('div', {});
    warnCol.appendChild(el('div', {
      style: { color: 'var(--accent-2)', marginBottom: '6px', fontFamily: 'var(--font-display)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }
    }, ['⚠ ' + I18N.t('ui.intel.warningsTitle')]));
    if (intel.warnings.length) {
      for (const warn of intel.warnings) {
        warnCol.appendChild(el('div', { class: 'hint-line hint-warn', style: { marginBottom: '4px', fontSize: '10px' } }, [warn.text]));
      }
    } else {
      warnCol.appendChild(el('div', {
        style: { fontSize: '10px', color: 'var(--muted)', fontStyle: 'italic', padding: '4px 0' }
      }, [I18N.t('ui.intel.noWarnings')]));
    }
    columns.appendChild(warnCol);

    panel.appendChild(columns);
    return panel;
  },

  renderRecruit(options) {
    const box = $('#recruit-options');
    box.innerHTML = '';
    options.forEach(p => {
      const card = UI.renderPlayerCard(p, { legendary: true });
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => FLOW.pickRecruit(p));
      box.appendChild(card);
    });
    UI.showScreen('screen-recruit');
  },

  renderComparedStatBars(stats, compareAgainst, highlight={}, opts={}) {
    const wrap = el('div', { class: 'compared-bars' + (opts.compact ? ' compact' : '') });
    const keys = ['offense', 'defense', 'tempo', 'vision', 'composure'];
    const labels = {
      offense: I18N.t('stats.offense'),
      defense: I18N.t('stats.defense'),
      tempo: I18N.t('stats.tempo'),
      vision: I18N.t('stats.vision'),
      composure: I18N.t('stats.composure')
    };
    keys.forEach(k => {
      const v = stats[k] || 0;
      const pct = Math.min(100, (v/120)*100);
      let cmpClass = '';
      if (compareAgainst) {
        const other = compareAgainst[k] || 0;
        if (v > other) cmpClass = 'higher';
        else if (v < other) cmpClass = 'lower';
        else cmpClass = 'equal';
      }
      const trendVal = (highlight || {})[k] || 0;
      let trendEl = null;
      if (trendVal !== 0) {
        const _isUp = trendVal > 0;
        const _isDbl = Math.abs(trendVal) >= 2;
        const _col = _isUp ? 'var(--good)' : 'var(--danger)';
        let _svg;
        if (!_isDbl) {
          _svg = _isUp
            ? `<line x1="4" y1="11" x2="4" y2="4" stroke="${_col}" stroke-width="1.2" stroke-linecap="round"/><path d="M1.5 7 L4 2.5 L6.5 7" fill="none" stroke="${_col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`
            : `<line x1="4" y1="1" x2="4" y2="8" stroke="${_col}" stroke-width="1.2" stroke-linecap="round"/><path d="M1.5 5 L4 9.5 L6.5 5" fill="none" stroke="${_col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`;
        } else {
          _svg = _isUp
            ? `<line x1="2" y1="11" x2="2" y2="4" stroke="${_col}" stroke-width="1.2" stroke-linecap="round"/><path d="M0 7 L2 2.5 L4 7" fill="none" stroke="${_col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><line x1="7" y1="11" x2="7" y2="4" stroke="${_col}" stroke-width="1.2" stroke-linecap="round"/><path d="M5 7 L7 2.5 L9 7" fill="none" stroke="${_col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`
            : `<line x1="2" y1="1" x2="2" y2="8" stroke="${_col}" stroke-width="1.2" stroke-linecap="round"/><path d="M0 5 L2 9.5 L4 5" fill="none" stroke="${_col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><line x1="7" y1="1" x2="7" y2="8" stroke="${_col}" stroke-width="1.2" stroke-linecap="round"/><path d="M5 5 L7 9.5 L9 5" fill="none" stroke="${_col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`;
        }
        trendEl = el('span', { class:'cb-trend ' + (_isUp ? 'trend-up' : 'trend-down') });
        trendEl.innerHTML = `<svg viewBox="0 0 8 12" width="8" height="12" style="vertical-align:middle;margin-left:4px;flex-shrink:0;overflow:visible">${_svg}</svg>`;
      }
      const labelChildren = [labels[k]];
      if (trendEl) labelChildren.push(trendEl);
      const row = el('div', { class:'cb-row' }, [
        el('div', { class:'cb-header' }, [
          el('span', { class:'cb-label' }, labelChildren),
          el('span', { class:'cb-value ' + cmpClass }, [String(v)])
        ]),
        el('div', { class:'cb-bar' }, [
          el('div', { class:'cb-fill ' + cmpClass, style:{ width: pct + '%' } })
        ])
      ]);
      wrap.appendChild(row);
    });
    return wrap;
  },

  // Small gold chip showing a player's role evolution. Clicking (hover)
  // reveals the description. Used in hub, lineup, match-result cards.
  // Maps snake_case ids (poacher, inverted_winger, ...) to camelCase
  // i18n keys (poacher, invertedWinger, ...) where needed.
  buildEvolutionBadge(evolutionId) {
    if (!evolutionId) return null;
    const camel = evolutionId.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    const nameKey = 'ui.evolutions.' + camel + '.name';
    const descKey = 'ui.evolutions.' + camel + '.desc';
    let name = I18N.t(nameKey);
    if (!name || name === nameKey) name = evolutionId.toUpperCase();
    let desc = I18N.t(descKey);
    if (!desc || desc === descKey) desc = '';
    return el('span', {
      class: 'p-evolution-badge',
      title: desc
    }, [name]);
  },

  renderPlayerCard(p, opts={}) {
    const roleAbbr = UI.roleAbbr(p.role);
    const stageSymbols = ['★', '★★', '★★★'];
    const classes = ['p-card'];
    if (opts.selected)        classes.push('selected');
    if (p.pendingLevelUp)     classes.push('level-up-pending');
    if (p.isLegendary || opts.legendary) classes.push('legendary');
    if (p.isAcademy)          classes.push('academy');
    if (opts.bench)           classes.push('bench');
    if (opts.swapTarget)      classes.push('swap-target');

    const match = window.state?.currentMatch;
    const mem = match?.memory?.myPlayerStates?.[p.id];
    const streakState = mem?.streakState;
    const yellowCount = match?.memory?.yellowCards?.[p.id] || 0;
    const hasRed = match?.memory?.redCards?.has?.(p.id);
    const suspendedNext = p._suspendedUntil && window.state && p._suspendedUntil > window.state.matchNumber;

    if (hasRed) classes.push('red-carded');
    if (suspendedNext && !opts.inMatch) classes.push('suspended');

    // --- Default (Hub, Lineup, Recruit, Draft, In-Match): volle Karte ---
    // Strafkarten werden inline neben dem Namen gerendert (siehe nameLine
    // unten). Nur die Sperre bleibt als overlay-Badge — die ist eine
    // Rundenstatus-Info, keine Karte.
    const overlays = [];
    if (suspendedNext && !opts.inMatch) overlays.push(el('span', { class:'p-card-suspended-badge', title: I18N.t('ui.cards.suspendedNext') }, ['⏸']));
    if (p.isAcademy) {
      const tipKey = 'ui.cards.academyTooltip';
      let tip = I18N.t(tipKey);
      if (tip === tipKey) tip = 'Academy call-up — temporary replacement, stats reduced, no traits, leaves after this match.';
      overlays.push(el('span', { class:'p-card-academy-badge', title: tip }, ['⚑']));
    }

    // Strafkarten-Chips für die Name-Zeile
    const cardChips = [];
    if (hasRed) cardChips.push(el('span', { class:'p-card-chip red', title: I18N.t('ui.cards.red') }, ['🟥']));
    else if (yellowCount >= 2) cardChips.push(el('span', { class:'p-card-chip red', title: I18N.t('ui.cards.secondYellow') }, ['🟥']));
    else if (yellowCount === 1) cardChips.push(el('span', { class:'p-card-chip yellow', title: I18N.t('ui.cards.yellow') }, ['🟨']));

    const playerPower = Object.values(p.stats).reduce((a, b) => a + b, 0);

    // Stat-Diffs gegen den Stand vor dem letzten Match — nur zeigen wenn
    // explizit angefragt (Hub, Result) und ein Snapshot existiert.
    // Anzeige: kleiner Pfeil LINKS vom Wert, Wert in Akzentfarbe (grün=up,
    // rot=down). Kein Zahlen-Suffix, damit das Stat-Grid nicht verschoben wird.
    const showDiff = opts.showStatDiff && p._statsBeforeMatch;
    const before = p._statsBeforeMatch || p.stats;
    const powerBefore = Object.values(before).reduce((a, b) => a + b, 0);
    const powerDelta = playerPower - powerBefore;

    function statCell(key, label) {
      const cur = p.stats[key] || 0;
      const prev = before[key] || 0;
      const diff = showDiff ? cur - prev : 0;
      const cls = diff > 0 ? ' stat-up' : (diff < 0 ? ' stat-down' : '');
      const arrow = diff > 0 ? '▲' : (diff < 0 ? '▼' : '');
      return el('div', { class: 'stat' + cls }, [
        label,
        el('span', { class:'stat-val' }, [
          arrow ? el('span', { class:'stat-arrow' }, [arrow]) : null,
          el('b', {}, [String(cur)])
        ])
      ]);
    }

    const powerChildren = [];
    if (showDiff && powerDelta !== 0) {
      powerChildren.push(el('span', {
        class: 'p-card-power-arrow ' + (powerDelta > 0 ? 'up' : 'down')
      }, [powerDelta > 0 ? '▲' : '▼']));
    }
    powerChildren.push(el('span', {
      class: 'p-card-power-val' + (showDiff && powerDelta > 0 ? ' up' : showDiff && powerDelta < 0 ? ' down' : '')
    }, [String(playerPower)]));

    const card = el('div', { class: classes.join(' ') }, [
      overlays.length ? el('div', { class:'p-card-overlays' }, overlays) : null,
      el('div', { class:'p-card-head' }, [
        el('div', { class:'p-card-head-left' }, [
          el('span', { class:'role' }, [roleAbbr]),
          el('span', { class:'stage' }, [stageSymbols[p.stage] || '★'])
        ]),
        el('span', { class:'p-card-power' }, powerChildren)
      ]),
      el('div', { class:'name' }, [
        el('span', { class:'name-text' }, [p.name]),
        cardChips.length ? el('span', { class:'name-cards' }, cardChips) : null
        // Evolution badge was here — moved to the tags row below so it
        // sits alongside trait-dots (lineKeeper, Fortress Aura, etc.)
        // in the footer section of the card rather than interrupting
        // the name line with a big orange chip.
      ]),
      el('div', { class:'mono-sm', style:{ marginBottom:'6px' } }, [
        p.isAcademy
          ? (I18N.t('ui.labels.academy') === 'ui.labels.academy' ? 'ACADEMY' : I18N.t('ui.labels.academy'))
          : p.label
      ]),
      el('div', { class:'stats' }, [
        statCell('offense', 'OFF'),
        statCell('defense', 'DEF'),
        statCell('tempo', 'TMP'),
        statCell('vision', 'VIS'),
        statCell('composure', 'CMP')
      ]),
      el('div', { class:'xp-bar' }, [
        el('div', { class:'xp-fill', style:{ width: Math.min(100, (p.xp / p.xpToNext)*100) + '%' } })
      ]),
      el('div', { class:'xp-label' }, (() => {
        const base = `LV ${p.level} · ${p.xp}/${p.xpToNext} XP${p.goals ? ' · ' + p.goals + '⚽' : ''}`;
        const f = p.form || 0;
        if (f === 0) return [base];
        const isUp = f > 0, isDbl = Math.abs(f) >= 2;
        const col = isUp ? 'var(--good)' : 'var(--danger)';
        let svg;
        if (!isDbl) {
          svg = isUp
            ? `<line x1="4" y1="11" x2="4" y2="4" stroke="${col}" stroke-width="1.2" stroke-linecap="round"/><path d="M1.5 7 L4 2.5 L6.5 7" fill="none" stroke="${col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`
            : `<line x1="4" y1="1" x2="4" y2="8" stroke="${col}" stroke-width="1.2" stroke-linecap="round"/><path d="M1.5 5 L4 9.5 L6.5 5" fill="none" stroke="${col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`;
        } else {
          svg = isUp
            ? `<line x1="2" y1="11" x2="2" y2="4" stroke="${col}" stroke-width="1.2" stroke-linecap="round"/><path d="M0 7 L2 2.5 L4 7" fill="none" stroke="${col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><line x1="7" y1="11" x2="7" y2="4" stroke="${col}" stroke-width="1.2" stroke-linecap="round"/><path d="M5 7 L7 2.5 L9 7" fill="none" stroke="${col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`
            : `<line x1="2" y1="1" x2="2" y2="8" stroke="${col}" stroke-width="1.2" stroke-linecap="round"/><path d="M0 5 L2 9.5 L4 5" fill="none" stroke="${col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><line x1="7" y1="1" x2="7" y2="8" stroke="${col}" stroke-width="1.2" stroke-linecap="round"/><path d="M5 5 L7 9.5 L9 5" fill="none" stroke="${col}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`;
        }
        const span = document.createElement('span');
        span.style.cssText = 'display:inline-flex;align-items:center;gap:3px;';
        span.textContent = base;
        const icon = document.createElement('span');
        icon.innerHTML = `<svg viewBox="0 0 8 12" width="8" height="12" style="vertical-align:middle;overflow:visible">${svg}</svg>`;
        span.appendChild(icon);
        return [span];
      })()),
      // Traits row — includes trait-dots AND the evolution badge
      // (if specialized). Shown in the footer area so all "tags" live
      // together. Evolution styled as gold chip to stand out vs the
      // standard trait-dots but staying quiet.
      (p.traits.length || p.evolution) ? el('div', { class:'traits' }, [
        ...p.traits.map(t =>
          el('span', { class:'trait-dot', title: DATA.traits[t]?.desc || '' }, [DATA.traits[t]?.name || t])
        ),
        p.evolution ? UI.buildEvolutionBadge(p.evolution) : null
      ].filter(Boolean)) : null
    ]);

    // Condition bar — slim footer on the card showing current condition
    // as a colored bar. Only shown in contexts that explicitly ask (hub
    // primarily) so match/lineup/recruit views stay clean. Graceful no-op
    // if the player has no condition tracked yet (new run, first match).
    // Tooltip explains the 80%-ceiling design: starters recover to 80,
    // bench recovers +30 to 100. Previously just showed the bare number
    // and players assumed their team was permanently fatigued.
    if (opts.showCondition && typeof p.condition === 'number') {
      let tone = 'good';
      if (p.condition < 25) tone = 'critical';
      else if (p.condition < 50) tone = 'warn';
      else if (p.condition < 75) tone = 'neutral';
      // v0.38 — Tooltip now surfaces the ACTIVE stat malus from fatigue
      // so the player understands why their numbers look low without
      // hunting through the help screen. Thresholds mirror the engine
      // (stats.js): <25 → -6 per stat, <50 → -3 per stat, else no
      // malus. Text is prepended to the generic tooltip so the concrete
      // current effect is the first thing readers see.
      let malusText = '';
      if (p.condition < 25) {
        malusText = '⚠ Critical fatigue — all stats currently reduced by 6. '
                  + 'Sub this player out or rest them with Breather / Rotation.\n\n';
      } else if (p.condition < 50) {
        malusText = '⚠ Tired — all stats currently reduced by 3. '
                  + 'Consider resting or subbing to avoid the -6 tier below 25.\n\n';
      }
      const condTooltipKey = 'ui.hub.conditionTooltip';
      const condTooltipTxt = I18N.t(condTooltipKey);
      const tooltip = malusText
        + 'Condition: ' + p.condition + '/100'
        + (condTooltipTxt && condTooltipTxt !== condTooltipKey
            ? '\n\n' + condTooltipTxt
            : '\n\nMatch play drains condition. Starters recover between matches '
              + 'based on how burnt-out they were: light use → 88, moderate → 76, '
              + 'heavy → 65, overplayed → 55 (always above the -3 penalty tier). '
              + 'Bench players recover +22 points. Rotating tired starters onto '
              + 'the bench keeps them sharp for later matches.');
      const bar = el('div', { class: 'p-cond-wrap' }, [
        el('div', { class: 'p-cond-bar p-cond-' + tone, title: tooltip }, [
          el('div', {
            class: 'p-cond-fill',
            style: { width: Math.max(3, p.condition) + '%' }
          }),
          el('span', { class: 'p-cond-value' }, [String(p.condition)])
        ])
      ]);
      card.appendChild(bar);
    }

    return card;
  },

  renderMatch(opp, squad) {
    // Match-Kontext aus dem globalen State ziehen. Wird für Tooltip-
    // Helfer wie buildPlayerStatTip gebraucht, die effektive Stats
    // (inkl. Buff-Layer) berechnen.
    const match = window.state?.currentMatch || null;

    // Rebuild the me-side team block: logo + name + optional form chip.
    // Mirrors the hub's visual language so the match screen doesn't feel like
    // a completely different surface.
    const meBlock = $('#match-me-name');
    meBlock.innerHTML = '';
    if (state.teamLogo) {
      meBlock.appendChild(el('img', {
        class: 'match-header-logo',
        src: state.teamLogo,
        alt: getTeamDisplayName(squad)
      }, []));
    }
    meBlock.appendChild(el('span', { class: 'match-header-name' }, [getTeamDisplayName(squad)]));

    const teamFormAvg = squad.reduce((s, p) => s + (p.form || 0), 0) / Math.max(1, squad.length);
    let formChip = null;
    if (teamFormAvg >= 2)       formChip = { cls:'form-chip hot',  text:'🔥 ' + I18N.t('ui.labels.hotStreak') };
    else if (teamFormAvg >= 1)  formChip = { cls:'form-chip up',   text:'↑ '  + I18N.t('ui.labels.goodForm') };
    else if (teamFormAvg <= -2) formChip = { cls:'form-chip cold', text:'❄ '  + I18N.t('ui.labels.crisis') };
    else if (teamFormAvg <= -1) formChip = { cls:'form-chip down', text:'↓ '  + I18N.t('ui.labels.badForm') };
    if (formChip) {
      meBlock.appendChild(el('div', { class: formChip.cls }, [formChip.text]));
    }

    // Opp-side: logo + name + special/trait chips. Same chip markup (.opp-tag)
    // as the hub, so the visual language carries through.
    const oppBlock = $('#match-opp-name');
    oppBlock.innerHTML = '';
    if (opp.logo) {
      oppBlock.appendChild(el('img', {
        class: 'match-header-logo',
        src: opp.logo,
        alt: opp.name
      }, []));
    }
    oppBlock.appendChild(el('span', { class: 'match-header-name' + (opp.isBoss ? ' boss' : '') },
      [(opp.isBoss ? '🏆 ' : '') + opp.name]));

    const oppSpecialObj = opp.special || null;
    const oppTraitChips = (opp.traits || [])
      .map(tid => {
        const td = (window.OPP_TRAITS || []).find(x => x.id === tid);
        return td ? { id: tid, name: td.name } : null;
      })
      .filter(Boolean)
      .slice(0, 2);
    if (oppSpecialObj || oppTraitChips.length) {
      oppBlock.appendChild(el('div', { class:'match-header-tags' }, [
        oppSpecialObj ? el('span', {
          class:'opp-tag special',
          title: (() => {
            const k = 'data.oppTells.' + oppSpecialObj.id;
            const t = I18N.t(k);
            return (t && t !== k) ? t : '';
          })()
        }, [oppSpecialObj.name]) : null,
        ...oppTraitChips.map(t => el('span', {
          class:'opp-tag',
          title: (() => {
            const k = 'data.oppTells.trait_' + t.id;
            const v = I18N.t(k);
            return (v && v !== k) ? v : '';
          })()
        }, [t.name]))
      ]));
    }

    $('#score-me').textContent = '0';
    $('#score-opp').textContent = '0';
    // v53 — Runden-Indicator durch Match-HUD ersetzt: Clock + Highlight-
    // Streifen (siehe js/match-hud.js). Der #round-indicator-Container
    // bleibt als DOM-Anker erhalten (damit animateCardFlyOut weiter
    // funktioniert), sein Inhalt wird vom Modul gepflegt. Fallback auf
    // die alten round-dots, falls das Modul mal nicht geladen ist.
    if (window.KL?.matchHud) {
      window.KL.matchHud.initMatch(window.state?.currentMatch || null);
    } else {
      const ri = $('#round-indicator');
      ri.innerHTML = '';
      for (let i = 0; i < CONFIG.rounds; i++) {
        ri.appendChild(el('div', { class:'round-dot', 'data-round':(i+1) }));
      }
    }
    $('#match-log').innerHTML = '';
    // v52.3 — cp-intent now lives OUTSIDE #match-log (pinned above it in
    // .match-log-wrap), so the innerHTML-reset above no longer clears it.
    // Wipe it explicitly so a stale OPP-THREAT from the previous match
    // doesn't linger on-screen until the first card-phase render.
    const _cpIntentEl = document.getElementById('cp-intent');
    if (_cpIntentEl) {
      _cpIntentEl.innerHTML = '';
      _cpIntentEl.className = 'cp-intent';
    }

    // Player-Pulse-Tiles: zeigen Aufstellung live während des Matches.
    // Aufbau analog zu Result-Perf-Cards, mit Live-Daten pro Runde.
    // WICHTIG: _matchStats hier zurücksetzen, sonst zeigen die Tiles noch
    // die Werte aus dem Vormatch bis zum ersten Trigger (Bug-Fix).
    for (const p of squad) {
      p._matchStats = {
        shots: 0, shotsOnTarget: 0, goals: 0,
        buildups: 0, buildupsOk: 0,
        saves: 0, goalsConceded: 0,
        defendedAttacks: 0, counters: 0
      };
    }

    const pulse = $('#match-pulse');
    if (pulse) {
      pulse.innerHTML = '';
      squad.forEach(p => {
        // Condition bar — shows live fatigue. Uses the same color logic
        // as the hub p-cond-bar so the visual language carries across.
        // Updated each round via UI.updateMatchConditions(match).
        const condBar = el('div', { class: 'mp-cond-bar' }, [
          el('div', { class: 'mp-cond-fill', 'data-player-id': p.id }, [])
        ]);

        const tile = el('div', {
          class:'mp-tile',
          'data-player-id': p.id,
          'data-kl-tip': UI.buildPlayerStatTip(p, match)
        }, [
          el('div', { class:'mp-role' }, [UI.roleAbbr(p.role)]),
          el('div', { class:'mp-name' }, [p.name]),
          el('div', { class:'mp-line', 'data-field':'line' }, []),
          condBar
        ]);
        pulse.appendChild(tile);
      });
      UI.updatePulseStats(squad);
      UI.updateMatchConditions(squad);
    }

    // Momentum reset — Bar auf 50/50 und Info-Strip leeren. Die Chips/
    // Deltas/Cause werden sofort neu gesetzt, sobald das matchStart-Event
    // durchläuft (siehe flow.js:handleMatchEvent).
    UI.updateMomentum(50);
    const momIds = ['mom-chip-edge', 'mom-chip-threat', 'mom-cause'];
    for (const id of momIds) {
      const el = document.getElementById(id);
      if (el) { el.textContent = ''; el.className = el.className.replace(/\s+(pos|neg|zero)\b/g, ''); }
    }
    const deltasBox = document.getElementById('mom-deltas');
    if (deltasBox) {
      deltasBox.querySelectorAll('.mom-delta').forEach(cell => {
        cell.classList.remove('pos', 'neg');
        cell.classList.add('zero');
        const v = cell.querySelector('.md-val');
        if (v) v.textContent = '';
      });
    }

    UI.renderMatchFooter(squad, opp);
    UI.showScreen('screen-match');
  },

  // Schreibt eine kompakte Live-Zeile pro Tile (Wert + Label in einer Zeile).
  // Rollen-spezifisch: ST/LF → Tore, PM → Build-Up-Quote, VT → Stops, TW → Paraden.
  // Live condition bars for each starter on the match screen. Called
  // once at match start (via renderMatch) and on every round advance
  // from the engine (via the round event handler). Mirrors the hub
  // p-cond-bar visual language: thin bar, color tones by zone.
  updateMatchConditions(squad) {
    if (!squad) return;
    for (const p of squad) {
      const fill = document.querySelector(`.mp-cond-fill[data-player-id="${p.id}"]`);
      if (!fill) continue;
      if (typeof p.condition !== 'number') {
        fill.style.width = '100%';
        fill.className = 'mp-cond-fill good';
        continue;
      }
      const c = p.condition;
      let tone = 'good';
      if (c < 25) tone = 'critical';
      else if (c < 50) tone = 'warn';
      else if (c < 75) tone = 'neutral';
      fill.style.width = Math.max(2, c) + '%';
      fill.className = 'mp-cond-fill ' + tone;
      fill.setAttribute('title', p.name + ' — condition ' + c + '/100');
    }
  },

  // v53 — Baut den data-kl-tip-Inhalt (JSON) für einen mp-tile. Zeigt die
  // aktuellen Auf-/Abwertungen pro Stat relativ zum Base-Wert. Effektive
  // Werte kommen aus KL.stats.computePlayerStats (inkl. Form, Traits,
  // Team-Buffs, Kondition).
  //
  // v0.47 — zeigt ALLE 5 Stats mit Base → Effective (±Δ) statt nur Deltas.
  // Breakdown-Block (sub) mit Quellen: Kondition, Form, Team-Form, Team-
  // Buffs aus Karten und Taktiken.
  //
  // v0.48 — Unicode-Bar-Skala wieder entfernt. Stats können im Match
  // durch Buffs >99 gehen (Base 88 + Buff +20 = 108) — ohne harten Cap
  // wie in Fifa läuft die Bar über oder ist irreführend. Das Base→
  // Effective-Format mit Delta bleibt — aussagekräftig auch ohne Bar.
  buildPlayerStatTip(p, match) {
    const STAT_LABEL = { offense: 'OFF', defense: 'DEF', tempo: 'TMP', vision: 'VIS', composure: 'CMP' };
    const base = p.stats || {};
    let effective = base;
    const computeFn = window.KL?.stats?.computePlayerStats;
    if (computeFn && match) {
      try { effective = computeFn(p, match) || base; } catch (_) { effective = base; }
    }
    const role = UI.roleAbbr(p.role);
    const head = `${role} · ${p.name}`;

    // Stat-Zeilen. Format mit Delta:  "OFF 55→65 (+10)"
    //              ohne Delta:        "OFF 55"
    // Tabular-nums im CSS hält die Ziffern aligned.
    const statLines = [];
    let netDelta = 0;
    for (const [k, lbl] of Object.entries(STAT_LABEL)) {
      const b = base[k] || 0;
      const e = effective[k] || 0;
      const d = e - b;
      netDelta += d;
      if (d === 0) {
        statLines.push(`${lbl} ${b}`);
      } else {
        const sign = d > 0 ? '+' : '';
        statLines.push(`${lbl} ${b}→${e} (${sign}${d})`);
      }
    }
    const tone = netDelta > 0 ? 'me' : netDelta < 0 ? 'opp' : 'neutral';

    // Breakdown-Zeilen: welche Effekte erklären die Deltas?
    // v0.54 — Labels durch i18n-Keys ersetzt. Vorher hardcoded
    // deutsch ("Kondition", "Karten/Taktik", "alle Stats"), bluteten
    // in EN/ES-Spielern in den Tooltip durch.
    const breakdown = [];
    if (match) {
      if (typeof p.condition === 'number') {
        let pen = 0;
        if (p.condition < 25) pen = 6;
        else if (p.condition < 50) pen = 3;
        if (pen > 0) {
          breakdown.push(I18N.t('ui.match.pulseTipCondition', {
            value: Math.round(p.condition),
            pen
          }));
        }
      }
      const roleDef = (window.DATA?.roles || []).find(r => r.id === p.role);
      const focusStat = roleDef?.focusStat;
      if (focusStat && p.form) {
        const formForCalc = (match._formPenaltiesDisabled && p.form < 0) ? 0 : p.form;
        if (formForCalc) {
          const fDelta = formForCalc * 2;
          breakdown.push(I18N.t('ui.match.pulseTipForm', {
            form:  (p.form > 0 ? '+' : '') + p.form,
            sign:  fDelta > 0 ? '+' : '',
            delta: fDelta,
            stat:  STAT_LABEL[focusStat]
          }));
        }
      }
      if (match._teamFormBonus) {
        const tf = match._teamFormBonus;
        breakdown.push(I18N.t('ui.match.pulseTipTeamForm', {
          sign:  tf > 0 ? '+' : '',
          value: tf
        }));
      }
      if (match.teamBuffs) {
        const nonZero = Object.entries(match.teamBuffs).filter(([, v]) => v !== 0);
        if (nonZero.length) {
          const parts = nonZero.map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${STAT_LABEL[k]}`).join(', ');
          breakdown.push(I18N.t('ui.match.pulseTipCardsTactic', { parts }));
        }
      }
    }

    const payload = { head, body: statLines, tone };
    if (breakdown.length) payload.sub = breakdown;
    return JSON.stringify(payload);
  },

  updatePulseStats(squad) {
    if (!squad) return;
    const match = window.state?.currentMatch;
    for (const p of squad) {
      const tile = document.querySelector(`.mp-tile[data-player-id="${p.id}"]`);
      if (!tile) continue;
      // v53 — Stat-Delta-Tooltip pro Runde aktualisieren. Der data-kl-tip
      // wird vom globalen KL.tip-System bei Hover gelesen.
      try { tile.setAttribute('data-kl-tip', UI.buildPlayerStatTip(p, match)); } catch (_) { /* nice-to-have */ }
      const ms = p._matchStats || {};
      let value = '—';
      let label = '';
      let tone = '';

      if (p.role === 'ST' || p.role === 'LF') {
        const g = ms.goals || 0;
        const shots = ms.shots || 0;
        const shotsOn = ms.shotsOnTarget || 0;
        if (shots > 0) {
          value = `${g}⚽ · ${shotsOn}/${shots}`;
          label = '🎯';
        } else {
          value = `${g}`;
          label = '⚽';
        }
        if (g >= 1) tone = 'good';
      } else if (p.role === 'PM') {
        const ok = ms.buildupsOk || 0;
        const total = ms.buildups || 0;
        value = `${ok}/${total}`;
        label = I18N.t('ui.match.pulseBuildup');
        if (total >= 2) {
          const rate = ok / total;
          if (rate >= 0.7) tone = 'good';
          else if (rate < 0.4) tone = 'bad';
        }
      } else if (p.role === 'VT') {
        const stops = ms.defendedAttacks || 0;
        const conceded = ms.goalsConceded || 0;
        value = String(stops);
        label = I18N.t('ui.match.pulseDefense');
        if (stops >= 2 && conceded === 0) tone = 'good';
        else if (conceded >= 2) tone = 'bad';
      } else if (p.role === 'TW') {
        const saves = ms.saves || 0;
        const conceded = ms.goalsConceded || 0;
        value = String(saves);
        label = I18N.t('ui.match.pulseSaves');
        if (saves >= 2 && conceded < 2) tone = 'good';
        else if (conceded >= 2) tone = 'bad';
      }

      const lineEl = tile.querySelector('[data-field="line"]');
      if (lineEl) {
        lineEl.innerHTML = '';
        const valueSpan = document.createElement('span');
        valueSpan.className = 'mp-value' + (tone ? ' ' + tone : '');
        valueSpan.textContent = value;
        const labelSpan = document.createElement('span');
        labelSpan.className = 'mp-label';
        labelSpan.textContent = label;
        lineEl.appendChild(valueSpan);
        if (label) lineEl.appendChild(labelSpan);
      }
    }
  },

  // Lässt ein Player-Tile kurz aufleuchten. tone: 'fire' (trait/goal) | 'hit' (got scored on)
  pulsePlayer(playerId, tone = 'fire') {
    const tile = document.querySelector(`.mp-tile[data-player-id="${playerId}"]`);
    if (!tile) return;
    tile.classList.remove('pulse-fire', 'pulse-hit');
    // Reflow für Neu-Animation bei Folge-Triggern
    void tile.offsetWidth;
    tile.classList.add(tone === 'hit' ? 'pulse-hit' : 'pulse-fire');
  },

  // v0.46 — Tauscht ein Player-Pulse-Tile aus (bei halftime-sub oder
  // event-driven swap). Der bisherige Code in updatePulseStats konnte
  // nur EXISTIERENDE Tiles aktualisieren — tauchte ein neuer Spieler
  // im squad auf (z.B. nach Einwechslung), blieb sein Tile nicht
  // sichtbar und das alte Tile des Ausgewechselten zeigte noch Namen
  // + Stats der falschen Person. Fix: finde das outgoing-Tile in
  // #match-pulse und ersetze es in-place mit einem frisch gebautem
  // Tile für den incoming-Spieler.
  replacePulseTile(outgoingId, incoming, match) {
    if (!incoming) return;
    const old = document.querySelector(`.mp-tile[data-player-id="${outgoingId}"]`);
    if (!old) return;
    // _matchStats initialisieren, sonst wirft updatePulseStats durch-
    // einandergewürfelte Werte aus der letzten Render-Runde.
    if (!incoming._matchStats) {
      incoming._matchStats = {
        shots: 0, shotsOnTarget: 0, goals: 0,
        buildups: 0, buildupsOk: 0,
        saves: 0, goalsConceded: 0,
        defendedAttacks: 0, counters: 0
      };
    }
    const condBar = el('div', { class: 'mp-cond-bar' }, [
      el('div', { class: 'mp-cond-fill', 'data-player-id': incoming.id }, [])
    ]);
    const fresh = el('div', {
      class: 'mp-tile',
      'data-player-id': incoming.id,
      'data-kl-tip': UI.buildPlayerStatTip(incoming, match)
    }, [
      el('div', { class: 'mp-role' }, [UI.roleAbbr(incoming.role)]),
      el('div', { class: 'mp-name' }, [incoming.name]),
      el('div', { class: 'mp-line', 'data-field': 'line' }, []),
      condBar
    ]);
    old.replaceWith(fresh);
    // Sofortiger Stat-Refresh, damit die neue Tile direkt mit den
    // aktuellen (leeren) Werten dargestellt wird statt eine Runde
    // leer zu bleiben.
    UI.updatePulseStats(match.squad);
    UI.updateMatchConditions(match.squad);
  },

  // Momentum (0-100) — 50 ist ausgeglichen. >50 = eigene Seite, <50 = Gegner.
  // v0.58.1 — Set a tooltip on the bar itself so players can hover to learn
  // what the bar represents and how it's computed. The chips below the bar
  // (EDGE / THREAT) had tooltips since v52.4 but the bar itself didn't,
  // and players don't intuit "60% possession + 10% score + 30% engine
  // momentum" from looking at it.
  updateMomentum(meValue) {
    const v = Math.max(0, Math.min(100, meValue));
    const mePct  = v;
    const oppPct = 100 - v;
    const meFill  = $('#mom-fill-me');
    const oppFill = $('#mom-fill-opp');
    if (meFill)  meFill.style.width  = mePct  + '%';
    if (oppFill) oppFill.style.width = oppPct + '%';

    // Tooltip is static text explaining the bar's mechanics. Set on the
    // .mom-bar element (the actual horizontal bar) so the hover area
    // matches what the player is curious about.
    const bar = document.querySelector('#match-momentum .mom-bar');
    if (bar && !bar.title) {
      const i18nOr = (key, fallback) => {
        const t = window.I18N?.t?.(key);
        return (t && t !== key) ? t : fallback;
      };
      bar.title = i18nOr('ui.momentum.barTooltip',
        'Match flow — who is controlling the game right now.\n\n' +
        'Right (green) = your side, left (red) = opponent. Center = even.\n\n' +
        'Blends three signals:\n' +
        '· Possession (60%) — rolling average across rounds played\n' +
        '· Score diff (10%) — each goal shifts ±10 points (capped)\n' +
        '· Engine momentum (30%) — swings on goals, saves, zone changes\n\n' +
        'Updates every round. Goes well with the EDGE / THREAT chips below.');
    }
  },

  // Live-Scorecard im Match-Screen. Zeigt Edge/Threat, die größte Stat-
  // Verschiebung seit Kickoff, und einen One-Liner, der den aktuellen
  // Haupt-Einfluss benennt ("Pressing aktiv · Heißer Lauf · …").
  // Wird auf matchStart (Baseline) sowie bei roundEnd und buffsUpdated
  // (nach Taktik-Wahl) aufgerufen — selten genug, dass die Berechnung
  // pro Call nicht performance-relevant ist.
  updateMatchMomentum(match) {
    const strip = document.getElementById('match-momentum');
    if (!strip || !match) return;

    const squad = match.squad || [];
    const opp = match.opp;
    if (!squad.length || !opp) return;

    // Live Team-Stats mit allen Buffs/Traits/Form via computePlayerStats.
    // aggregateEffectiveStats existiert in engine.js, aber wir inlinen es
    // hier klein, damit die UI-Schicht autark bleibt.
    const computeLive = (arr) => {
      const totals = { offense:0, defense:0, tempo:0, vision:0, composure:0 };
      if (!arr.length) return totals;
      for (const p of arr) {
        const s = typeof computePlayerStats === 'function'
          ? computePlayerStats(p, match) : (p.stats || {});
        for (const k of Object.keys(totals)) totals[k] += (s[k] || 0);
      }
      for (const k of Object.keys(totals)) totals[k] = Math.round(totals[k] / arr.length);
      return totals;
    };

    const me = computeLive(squad);
    const oppLive = { ...opp.stats };
    const rb = opp._roundBuffs || {};
    for (const k of Object.keys(oppLive)) oppLive[k] += (rb[k] || 0);

    // Baseline beim ersten Aufruf speichern — Match-spezifisch, nicht global.
    if (!match._momentumBaseline) {
      match._momentumBaseline = { me: { ...me }, opp: { ...oppLive } };
    }
    const base = match._momentumBaseline;

    // Edge/Threat: Summe positiver/negativer Diffs über die 5 Stats,
    // skaliert zu 0-5 Chips. Bewusst roh gehalten — die Bars zeigen
    // Feinheiten, die Chips zeigen das Big Picture.
    const statKeys = ['offense','defense','tempo','vision','composure'];

    // Explizite Stat→Label-Map, weil einfacher .slice(0,3) falsche Keys
    // produziert: 'tempo'.slice(0,3) = 'tem' (Key ist 'tmp'),
    // 'composure'.slice(0,3) = 'com' (Key ist 'cmp'). Zusätzlich greift
    // der `|| fallback` nicht, weil I18N.t bei fehlendem Key den Key
    // selbst zurückgibt (truthy string) statt null.
    const STAT_SHORT = {
      offense: 'off', defense: 'def', tempo: 'tmp', vision: 'vis', composure: 'cmp'
    };
    const statLabelOf = (statKey) => {
      const shortKey = STAT_SHORT[statKey] || statKey.slice(0,3);
      const i18nKey = 'ui.scorecard.' + shortKey;
      const translated = I18N.t(i18nKey);
      return (translated === i18nKey ? shortKey : translated).toUpperCase();
    };
    const i18nOr = (key, fallback) => {
      const v = I18N.t(key);
      return (v === key) ? fallback : v;
    };

    let edgePts = 0, threatPts = 0;
    for (const k of statKeys) {
      const diff = me[k] - oppLive[k];
      if (diff > 0) edgePts += diff; else threatPts += -diff;
    }
    const toChips = (pts) => Math.max(0, Math.min(5, Math.round(pts / 25)));
    const edge   = toChips(edgePts);
    const threat = toChips(threatPts);
    const chip = (n, max = 5) => '▰'.repeat(n) + '▱'.repeat(max - n);

    const edgeEl   = document.getElementById('mom-chip-edge');
    const threatEl = document.getElementById('mom-chip-threat');
    if (edgeEl) {
      edgeEl.textContent = `${i18nOr('ui.scorecard.edge',   'EDGE')} ${chip(edge)}`;
      // v52.4 — surface the existing scorecard tooltip on the chip too,
      // so hovering either the hub matchup card OR the in-match chip
      // explains what EDGE/THREAT actually measure.
      edgeEl.title = i18nOr('ui.scorecard.edgeTooltip',
        'Your advantages: traits that counter this opponent plus any stat surplus. Each ▰ ≈ 25 stat points of surplus.');
    }
    if (threatEl) {
      threatEl.textContent = `${i18nOr('ui.scorecard.threat', 'THREAT')} ${chip(threat)}`;
      threatEl.title = i18nOr('ui.scorecard.threatTooltip',
        'Their danger to you: opponent traits that hurt your squad plus any raw power gap. Each ▰ ≈ 25 stat points of deficit.');
    }

    // Größte-Verschiebung-Shift wurde durch einen kompletten 5-Stat-Strip
    // ersetzt (feste Positionen, alle Werte sichtbar). Der einzelne Shift
    // hatte das Problem, dass die Zelle springt, je nachdem welcher Stat
    // gerade der größte ist — das irritiert und lässt kleinere, aber evtl.
    // wichtige Verschiebungen unsichtbar werden.
    const deltasEl = document.getElementById('mom-deltas');
    if (deltasEl) {
      for (const k of statKeys) {
        const delta = me[k] - base.me[k];
        const valEl = deltasEl.querySelector(`[data-stat-val="${k}"]`);
        const cellEl = deltasEl.querySelector(`[data-stat="${k}"]`);
        if (!valEl || !cellEl) continue;
        if (Math.abs(delta) >= 1) {
          valEl.textContent = (delta > 0 ? '+' : '') + delta;
          cellEl.classList.remove('pos', 'neg', 'zero');
          cellEl.classList.add(delta > 0 ? 'pos' : 'neg');
        } else {
          valEl.textContent = '0';
          cellEl.classList.remove('pos', 'neg');
          cellEl.classList.add('zero');
        }
      }
    }

    // Cause-Line — priorisierte Auswahl des "gerade dominanten" Einflusses.
    // Früher mit Top-2-Buffs-Listing, jetzt nur noch narrativer Hinweis
    // (Taktikname / Form / Focus) — die Zahlen sind links bereits da.
    const causeEl = document.getElementById('mom-cause');
    let cause = '';
    if (match.lastTactic?.name) {
      cause = match._tacticMisfit ? '⚠ ' + match.lastTactic.name
            : match._tacticFit === true ? '✓ ' + match.lastTactic.name
            : match.lastTactic.name;
    }
    if (match._teamFormLabel === 'HEISSER LAUF') {
      cause = (cause ? cause + ' · ' : '') + '🔥 ' + i18nOr('ui.labels.hotStreak', 'HOT STREAK');
    } else if (match._teamFormLabel === 'KRISE') {
      cause = (cause ? cause + ' · ' : '') + '❄ ' + i18nOr('ui.labels.crisis', 'CRISIS');
    }
    // Focus-Zeile entfernt — Focus-System deprecated.
    if (causeEl) {
      causeEl.textContent = cause;
      // v52.4 — tactic tooltip. Explains the ✓ / ⚠ markers so players
      // understand why a tactic reads as "fit" vs "misfit" and what the
      // form overlays (🔥 HOT STREAK / ❄ CRISIS) mean.
      if (cause) {
        const tacName = match.lastTactic?.name || '—';
        const fitLine = match._tacticMisfit
          ? i18nOr('ui.momentum.tacticMisfit', '⚠ Misfit: this tactic clashes with the matchup → stat penalty this round.')
          : match._tacticFit === true
            ? i18nOr('ui.momentum.tacticFit', '✓ Fit: this tactic matches the matchup → stat bonus this round.')
            : i18nOr('ui.momentum.tacticNeutral', 'Neutral: no fit bonus or misfit penalty.');
        const formLine = match._teamFormLabel === 'HEISSER LAUF'
          ? '\n🔥 ' + i18nOr('ui.momentum.tacticFormHot',    'Hot streak — team form bonus stacked on top.')
          : match._teamFormLabel === 'KRISE'
            ? '\n❄ ' + i18nOr('ui.momentum.tacticFormCrisis', 'Crisis — team form penalty stacked on top.')
            : '';
        causeEl.title = i18nOr('ui.momentum.tacticTooltipHeader',
          'Current active tactic.') + '\n\n' + tacName + '\n' + fitLine + formLine;
      } else {
        causeEl.removeAttribute('title');
      }
    }
  },

  renderMatchFooter(squad, opp) {
    const foot = $('#match-footer');
    if (!foot) return;
    foot.innerHTML = '';
    // v0.49 — engine-aligned statt avg. Selber Grund wie im Scorecard:
    // opp.stats ist team-aggregat (~100-135), plain avg wäre ~50 — der
    // Footer hätte uns überall niedriger gezeigt als die Engine rechnet.
    const teamStats = (window.KL?.stats?.teamStatsEngineAligned || aggregateTeamStats)(squad);
    const oppStats = opp.stats;
    const keys = [
      { id:'offense',   label:'OFF' },
      { id:'defense',   label:'DEF' },
      { id:'tempo',     label:'TMP' },
      { id:'vision',    label:'VIS' },
      { id:'composure', label:'CMP' }
    ];
    keys.forEach(k => {
      const mine = teamStats[k.id];
      const theirs = oppStats[k.id];
      const total = Math.max(1, mine + theirs);
      const myPct = (mine / total) * 100;
      const theirPct = (theirs / total) * 100;
      const row = el('div', { class:'match-footer-row' }, [
        el('div', { class:'mf-label' }, [k.label]),
        el('div', { class:'mf-val-me' }, [String(mine)]),
        el('div', { class:'mf-bar' }, [
          el('div', { class:'mf-bar-me', style:{ width: myPct + '%' } }),
          el('div', { class:'mf-bar-opp', style:{ width: theirPct + '%' } })
        ]),
        el('div', { class:'mf-val-opp' }, [String(theirs)])
      ]);
      foot.appendChild(row);
    });
  },

  updateRoundIndicator(round) {
    // v53 — Runden-Punkte durch Match-HUD ersetzt (Clock+Stripe).
    // Fallback-Code darunter bleibt für den Fall, dass match-hud.js nicht
    // geladen wurde (Dev-Builds, isolierte Tests).
    if (window.KL?.matchHud) {
      window.KL.matchHud.updateRound(round);
      return;
    }
    $$('.round-dot').forEach(d => {
      const r = Number(d.dataset.round);
      d.classList.remove('active', 'past');
      if (r < round) d.classList.add('past');
      else if (r === round) d.classList.add('active');
    });
  },

  // Blended momentum: Ballbesitz (60%) + Score-Differenz (40%). Ohne die
  // Score-Komponente bleibt die Bar bei 4:0 optisch zentriert, was die
  // tatsächliche Dominanz unterschreibt. Score-Factor saturiert bei ±4
  // Tor-Differenz, damit späte Klatschen nicht weiter ausschlagen.
  computeBlendedMomentum(match) {
    const s = match?.stats || {};
    const possession = s.possRounds
      ? Math.round((s.possAccum / s.possRounds) * 100)
      : 50;
    const diff = (match?.scoreMe || 0) - (match?.scoreOpp || 0);
    const scoreFactor = Math.max(10, Math.min(90, 50 + diff * 10));
    // Match-momentum: -100..+100 → 0..100 scale. Blended in at 30%
    // weight so the bar visibly shifts with momentum swings (goal,
    // save, zone changes) without being overridden by noise. Ball
    // possession stays the backbone (60%), score diff (10%), momentum
    // (30%). Keeps the bar truthful: a team with 60% possession but
    // trailing + losing momentum shows a leftward-shifting bar over
    // time, which matches the on-screen narrative.
    const mm = match?.matchMomentum || 0;
    const momentumFactor = Math.max(0, Math.min(100, 50 + mm * 0.5));
    return Math.round(possession * 0.60 + scoreFactor * 0.10 + momentumFactor * 0.30);
  },

  updateMatchScore(match) {
    $('#score-me').textContent = String(match.scoreMe);
    $('#score-opp').textContent = String(match.scoreOpp);
    UI.updateRoundIndicator(match.round);
    UI.renderMatchFooter(match.squad, match.opp);
    UI.updatePulseStats(match.squad);
    UI.updateMomentum(UI.computeBlendedMomentum(match));
  },

  appendLog(msg, cls='') {
    if (window.FX) {
      if (cls === 'goal-me') window.FX.goalMe();
      else if (cls === 'goal-opp') window.FX.goalOpp();
    }

    // Player Pulse: bei Trigger- und Goal-Events den Dot aufleuchten lassen.
    // Matching: squad-Spielernamen im Log-Text suchen.
    try {
      const match = window.state?.currentMatch;
      const squad = match?.squad;
      if (squad && (cls === 'trigger' || cls === 'goal-me')) {
        for (const p of squad) {
          if (p.name && msg.includes(p.name)) {
            UI.pulsePlayer(p.id, 'fire');
            break;
          }
        }
      }
      // Bei Gegentor: Keeper pulst "hit"
      if (squad && cls === 'goal-opp') {
        const keeper = squad.find(p => p.role === 'TW');
        if (keeper) UI.pulsePlayer(keeper.id, 'hit');
      }

      // Momentum: Tore verschieben den Balken sichtbar. Gleiche Blend-
      // Formel wie im Update pro Runde, damit das Bild konsistent bleibt.
      if (match && (cls === 'goal-me' || cls === 'goal-opp')) {
        UI.updateMomentum(UI.computeBlendedMomentum(match));
      }
    } catch (_) { /* Log-Visual ist nice-to-have, nie kritisch */ }

    const log = $('#match-log');
    const line = el('div', { class: logLineClass(cls) }, [msg]);
    // v0.48 — Log-Tooltip setzen, falls die Klasse einen Eintrag in
    // LOG_TIP_KEY hat. Adressiert User-Feedback "sollten nicht auch
    // einige Logs tooltips erhalten?". Generisch pro Kategorie — genug
    // Kontext um zu erklären WAS eine Zeile mechanisch bedeutet, ohne
    // per-Zeile-Parsing zu bauen.
    const tip = logTipFor(cls);
    if (tip) line.setAttribute('data-kl-tip', tip);
    log.appendChild(line);

    // v53 — Match-HUD hängt hier mit, um Highlight-Events (Tore, Opp-Karten,
    // Spieler-Entscheidungen) auf den Streifen oben zu setzen. Nimmt das
    // Log-Element als Anchor entgegen, damit Klicks auf Marker zur passenden
    // Zeile springen können. Fängt Exceptions ab — das HUD ist nice-to-have,
    // kein Blocker für das eigentliche Logging.
    try {
      if (window.KL?.matchHud) window.KL.matchHud.onLogLine(line, msg, cls);
    } catch (_) { /* stripe-visual ist nice-to-have */ }

    // Micro-Boost-Queue leeren: während der vorherigen bumpPlayerStat-Kette
    // können Schwellen überschritten worden sein. Toast-Zeilen direkt nach
    // dem auslösenden Event einblenden, damit die Kausalität sichtbar ist.
    try {
      const match = window.state?.currentMatch;
      const q = match?._microBoostQueue;
      if (q && q.length) {
        const STAT_LABEL = { offense:'OFF', defense:'DEF', tempo:'TMP', vision:'VIS', composure:'CMP' };
        while (q.length) {
          const mb = q.shift();
          const label = STAT_LABEL[mb.stat] || mb.stat.toUpperCase();
          const text = I18N.t('ui.log.microBoost', {
            name: mb.playerName, stat: label, value: mb.newValue
          });
          const toast = el('div', { class: logLineClass('micro-boost') }, [text]);
          log.appendChild(toast);
          UI.pulsePlayer(mb.playerId, 'fire');
        }
      }
    } catch (_) { /* Toast ist nice-to-have, nie kritisch */ }

    log.scrollTop = log.scrollHeight;
  },

  renderHalftimeSummary(match, opts={}) {
    const s = match.stats;
    const myAcc  = s.myShots  ? Math.round(s.myShotsOnTarget  / s.myShots  * 100) : null;
    const myBR   = s.myBuildups ? Math.round(s.myBuildupsSuccess / s.myBuildups * 100) : null;
    const poss   = s.possRounds ? Math.round((s.possAccum / s.possRounds) * 100) : 50;

    const mechanics = [];
    if (match.autoCounterRoundsLeft > 0) mechanics.push({ icon:'⚡', label: I18N.t('ui.ht.mechanicCounter') });
    if (match.pressingRoundsLeft    > 0) mechanics.push({ icon:'🏃', label: I18N.t('ui.ht.mechanicPressing') });
    if (match.possessionActive)          mechanics.push({ icon:'🎯', label: I18N.t('ui.ht.mechanicPossession') });
    if (match.aggressiveRoundsLeft  > 0) mechanics.push({ icon:'💥', label: I18N.t('ui.ht.mechanicAggressive') });
    if (match.flankRoundsLeft       > 0) mechanics.push({ icon:'🏃', label: I18N.t('ui.ht.mechanicFlank') });
    if (match._rallyActive)              mechanics.push({ icon:'💢', label: I18N.t('ui.ht.mechanicRally') });

    const happened = [];
    if ((match._htPressingBlocks || 0) > 0)
      happened.push(`🛡 ${I18N.t('ui.ht.pressBlocked', { n: match._htPressingBlocks })}`);
    if ((match._htCountersFired || 0) > 0)
      happened.push(`⚡ ${I18N.t('ui.ht.countersFired', { n: match._htCountersFired })}`);
    if ((match.momentumCounter || 0) >= 2)
      happened.push(`🔄 ${I18N.t('ui.ht.momentumActive', { bonus: 15 })}`);

    const panel = el('div', { class:'interrupt-panel ht-summary' }, [
      el('div', { class:'ip-title' }, [opts.title || I18N.t('ui.ht.title')]),
      el('div', { class:'ht-score-strip' }, [
        el('div', { class:'ht-score-me' }, [String(match.scoreMe)]),
        el('div', { class:'ht-score-mid' }, [
          el('div', { class:'ht-poss-bar' }, [
            el('div', { class:'ht-poss-fill', style:{ width: poss + '%' } })
          ]),
          el('div', { class:'ht-poss-label' }, [`${poss}% — ${I18N.t('ui.statsPanel.possession')}`])
        ]),
        el('div', { class:'ht-score-opp' }, [String(match.scoreOpp)])
      ]),
      el('div', { class:'ht-stats-row' }, [
        el('div', { class:'ht-stat' }, [
          el('div', { class:'ht-stat-val' }, [`${s.myShots}`]),
          el('div', { class:'ht-stat-label' }, [I18N.t('ui.statsPanel.shots')])
        ]),
        el('div', { class:'ht-stat' }, [
          el('div', { class:'ht-stat-val' }, [myAcc !== null ? `${myAcc}%` : '—']),
          el('div', { class:'ht-stat-label' }, [I18N.t('ui.statsPanel.accuracy')])
        ]),
        el('div', { class:'ht-stat' }, [
          el('div', { class:'ht-stat-val' }, [myBR !== null ? `${myBR}%` : '—']),
          el('div', { class:'ht-stat-label' }, [I18N.t('ui.statsPanel.buildup')])
        ]),
        el('div', { class:'ht-stat' }, [
          el('div', { class:'ht-stat-val' }, [String(s.saves || 0)]),
          el('div', { class:'ht-stat-label' }, [I18N.t('ui.statsPanel.saves')])
        ])
      ]),
      happened.length ? el('div', { class:'ht-happened' },
        happened.map(h => el('div', { class:'ht-happened-item' }, [h]))
      ) : null,
      mechanics.length ? el('div', { class:'ht-mechanics' }, [
        el('div', { class:'ht-mechanics-title' }, [I18N.t('ui.ht.activeIntoSecondHalf')]),
        // v0.40 — Tooltip per Tag mit Description (wenn die Mechanik
        // eine mitbringt). Ohne Tooltip weiß der Spieler oft nicht,
        // WAS genau aktiv bleibt (nur das Icon + Label, oft kryptisch).
        ...mechanics.map(m => el('div', {
          class:'ht-mechanic-tag',
          title: m.desc || m.tooltip || `${m.label} — diese Mechanik bleibt in der zweiten Halbzeit aktiv.`
        }, [m.icon + ' ' + m.label]))
      ]) : null
    ]);
    return panel;
  },

  // v0.58 — Consolidates the optional primaryLine ("Build-up runs through
  // PM vision/composure: 85 VIS / 67 CMP") and the up-to-three intel hints
  // (pace edge, back-line pressure, etc.) into ONE intel container with
  // consistent styling. Pre-fix, primaryLine rendered as a separate italic
  // line above and the hints rendered as colored banners below — five
  // visually competing elements between the header and the choices. New
  // design: same row structure for every line — gray text + a 3px colored
  // left-stripe carrying the severity. No more inline colored text, no
  // banner backgrounds. Reads as a list, not a stack of boxes.
  renderIntelBox(primaryLine, hints) {
    const rows = [];
    if (primaryLine) {
      rows.push({ text: primaryLine, type: 'info' });
    }
    for (const hint of (hints || []).slice(0, 3)) {
      const text = typeof hint === 'string' ? hint : hint.text;
      const type = typeof hint === 'string' ? 'info' : (hint.type || 'info');
      if (text) rows.push({ text, type });
    }
    if (!rows.length) return null;
    const box = el('div', { class: 'intel-box' });
    for (const row of rows) {
      box.appendChild(el('div', { class: `intel-row intel-${row.type}` }, [row.text]));
    }
    return box;
  },

  renderHintBox(hints) {
    if (!hints || !hints.length) return null;
    const box = el('div', { class: 'hint-box' });
    for (const hint of hints.slice(0, 3)) {
      const line = el('div', { class: `hint-line hint-${hint.type}` }, [hint.text]);
      box.appendChild(line);
    }
    return box;
  },

  renderPhaseGuide(match, phase) {
    const lines = buildPhaseGuide(match, phase);
    if (!lines.length) return null;
    return el('div', { class:'interrupt-panel' }, [
      el('div', { class:'ip-title' }, [I18N.t('ui.statsPanel.whatMattersNow')]),
      ...lines.map(line => el('div', { class:'ht-happened-item' }, [line]))
    ]);
  },

  // Kondensiert den Halftime/Final-Snapshot auf eine Zeile.
  // Zeigt: Score · Ballbesitz · ein prägnanter "wo steht ihr"-Satz.
  buildInterruptSnapshot(match, phase) {
    if (!match) return null;
    const normalizedPhase = (phase === 'halftime_focus' || phase === 'halftime_sub') ? 'halftime' : phase;
    const s = match.stats || {};
    const poss = s.possRounds ? Math.round((s.possAccum / s.possRounds) * 100) : 50;

    // Erste Zeile vom PhaseGuide ist meistens der entscheidende Satz.
    const guideLines = buildPhaseGuide(match, phase);
    const primaryLine = guideLines[0] || null;

    return {
      scoreMe: match.scoreMe || 0,
      scoreOpp: match.scoreOpp || 0,
      possession: poss,
      phase: normalizedPhase,
      showScore: normalizedPhase === 'halftime' || normalizedPhase === 'final',
      primaryLine
    };
  },

  renderInterruptSnapshot(snapshot) {
    if (!snapshot) return null;
    const children = [];

    // Score + Possession nur wenn Match läuft (halftime, final) — beim Kickoff
    // steht es 0:0, das ist leer.
    if (snapshot.showScore) {
      const diff = snapshot.scoreMe - snapshot.scoreOpp;
      const scoreCls = diff > 0 ? 'ahead' : (diff < 0 ? 'behind' : 'level');
      children.push(el('div', { class:'isnap-score-row' }, [
        el('span', { class:'isnap-score ' + scoreCls }, [
          `${snapshot.scoreMe} : ${snapshot.scoreOpp}`
        ]),
        el('div', { class:'isnap-poss' }, [
          el('div', { class:'isnap-poss-bar' }, [
            el('div', { class:'isnap-poss-fill', style:{ width: snapshot.possession + '%' } })
          ]),
          el('div', { class:'isnap-poss-label mono-sm' }, [
            `${snapshot.possession}% ${I18N.t('ui.statsPanel.possession')}`
          ])
        ])
      ]));
    }

    if (snapshot.primaryLine) {
      children.push(el('div', { class:'isnap-headline' }, [snapshot.primaryLine]));
    }

    if (!children.length) return null;
    return el('div', { class:'interrupt-snapshot' }, children);
  },

  showInterrupt(title, subtitle, options, onPick, match, phase, hints) {
    const modal = $('#interrupt-modal');
    modal.innerHTML = '';

    const isEvent = phase === 'event';
    const isFocusSub = phase === 'halftime_sub';

    // --- Header ---
    if (isEvent) {
      modal.classList.add('interrupt-modal--event');
      modal.appendChild(el('div', { class: 'event-modal-header' }, [
        el('div', { class: 'event-modal-badge' }, ['⚡ ' + I18N.t('ui.flow.eventTitle')]),
        el('h2', { class: 'event-modal-title' }, [title])
      ]));
    } else {
      modal.classList.remove('interrupt-modal--event');
      modal.appendChild(el('h2', {}, [title]));
    }

    // Subtitle (kann einen "__REASON__"-Teil haben der separat hervorgehoben wird)
    let subtitleText = subtitle;
    let reasonText = null;
    if (typeof subtitle === 'string' && subtitle.includes('__REASON__')) {
      const parts = subtitle.split('__REASON__');
      subtitleText = parts[0].trim();
      reasonText = parts[1];
    }
    modal.appendChild(el('div', { class:'sub' }, [subtitleText]));
    if (reasonText) {
      modal.appendChild(el('div', { class:'event-modal-reason' }, ['↳ ' + reasonText]));
    }

    // v0.58 — Layout order is Header → Stats → Intel → Choices. Pre-fix
    // the stats bar was appended at the very END of the modal, after the
    // choices, which meant the player saw the choices first and the
    // factual reference data only after deciding. Stats now render
    // immediately under the subtitle so they're available BEFORE the
    // intel hints (which interpret the stats) and the choices (which act
    // on the interpretation). Header → Stats → Intel → Choices is the
    // natural decision flow: facts → reading → action.
    let primaryLine = null;
    const showSnapshot = match && !isFocusSub && !isEvent
      && (phase === 'kickoff' || phase === 'halftime' || phase === 'final');
    if (showSnapshot) {
      const snapshot = UI.buildInterruptSnapshot(match, phase);
      primaryLine = snapshot?.primaryLine || null;
    }

    // Hints: deduplicate against primaryLine so the same thought doesn't
    // appear twice (headline above + hint below).
    let filteredHints = hints || [];
    if (primaryLine) {
      const primaryTokens = extractHintTokens(primaryLine);
      filteredHints = filteredHints.filter(h => {
        const hintText = typeof h === 'string' ? h : h.text;
        if (!hintText) return true;
        const hintTokens = extractHintTokens(hintText);
        // Wenn ≥2 signifikante Tokens übereinstimmen, Duplikat verwerfen.
        let overlap = 0;
        for (const t of hintTokens) if (primaryTokens.has(t)) overlap++;
        return overlap < 2;
      });
    }
    const trimmedHints = filteredHints.slice(0, 2);

    // Stats panel — only for tactic-decision phases. Renders BEFORE the
    // intel box so hints can refer to the numbers visible above.
    if (match && (phase === 'kickoff' || phase === 'halftime' || phase === 'final' || isEvent)) {
      const panel = el('div', { class:'interrupt-stats-always' });
      panel.appendChild(UI.renderTeamStatsPanel(match, { phase: isEvent ? 'kickoff' : phase }));
      modal.appendChild(panel);
    }

    // Intel box: consolidates primaryLine + hints into one consistent
    // container — gray text, severity carried only by the 3px left-stripe.
    const intelBox = UI.renderIntelBox(primaryLine, trimmedHints);
    if (intelBox) modal.appendChild(intelBox);

    // --- Optionen — DIREKT nach dem Snapshot, nicht vergraben ---
    // Für taktische Entscheidungen (kickoff/halftime/final) zeigen wir
    // unter jeder Option die Spieler, die von der Wahl bevorzugt werden.
    // Erfolgreiche Aktionen dieser Spieler während der Phase geben
    // Bonus-XP — das verbindet die Entscheidung direkt mit der Progression.
    const showFocus = match && !isEvent && !isFocusSub
      && (phase === 'kickoff' || phase === 'halftime' || phase === 'final')
      && typeof previewTacticFocusPlayers === 'function';

    const squadForPreview = showFocus ? (match.squad || getLineup?.() || []) : null;

    const list = el('div', { class:'choice-list' });
    options.forEach(opt => {
      // desc can be a plain string (legacy) or an array of lines (new format
      // from generateFocusOptions / decorateOptionsForDisplay). Render each
      // line as its own row so we get honest vertical rhythm instead of a
      // pipe-separated wall of text.
      const descChildren = Array.isArray(opt.desc)
        ? opt.desc.filter(Boolean).map(line => el('div', { class:'choice-desc-line' }, [line]))
        : (opt.desc ? [el('div', { class:'choice-desc-line' }, [opt.desc])] : []);

      // cornerBadge: single prominent tag pinned to the top-right of the box
      // (used for Player Focus success chance — the most important number on
      // that card). Kept separate from inline badges so the visual hierarchy
      // is clear: corner = headline, inline = modifiers.
      // tooltip (native `title`) explains WHY a badge is on — without it
      // "RISKY" was opaque. Appended ⓘ affordance hints at the tooltip.
      const cornerBadge = opt.cornerBadge
        ? el('span', {
            class:'choice-corner-badge ' + (opt.cornerBadge.kind || 'info'),
            title: opt.cornerBadge.tooltip || ''
          }, [
            opt.cornerBadge.text + (opt.cornerBadge.tooltip ? ' ⓘ' : '')
          ])
        : null;

      // badges: qualitative inline tags (FIT, SYNERGY). Rendered as a pill row
      // between title and desc so they catch the eye after the title.
      const badgeRow = (opt.badges && opt.badges.length)
        ? el('div', { class:'choice-badges' },
            opt.badges.map(b => el('span', {
              class:'choice-badge ' + (b.kind || 'info'),
              title: b.tooltip || ''
            }, [ b.text + (b.tooltip ? ' ⓘ' : '') ])))
        : null;

      const children = [
        cornerBadge,
        el('div', { class:'choice-title' }, [opt.name]),
        badgeRow,
        el('div', { class:'choice-desc' }, descChildren)
      ].filter(Boolean);

      if (showFocus && squadForPreview?.length) {
        const focusPlayers = previewTacticFocusPlayers(squadForPreview, opt.id, phase);
        if (focusPlayers.length) {
          const focusChips = focusPlayers.map(fp =>
            // v0.40 — Tooltip erklärt den "Warum" der Fokus-Markierung.
            // Ohne Tooltip wirkt die Chip-Liste zufällig; jetzt sieht
            // der Spieler, dass diese Entscheidung für diesen Spieler
            // besonders stark wirkt (seine Rolle matched die Tactic-
            // Wirkung, oder ein Trait/Evolution-Buff greift).
            el('span', {
              class: 'focus-chip role-' + fp.role,
              title: `${fp.name} (${UI.roleAbbr(fp.role)}) — wird von dieser Option besonders geboostet. `
                    + (fp.reason ? fp.reason : 'Seine Rolle oder ein Trait passt zu der gewählten Taktik.')
            }, [
              el('span', { class: 'fc-role' }, [UI.roleAbbr(fp.role)]),
              el('span', { class: 'fc-name' }, [fp.name])
            ])
          );
          children.push(el('div', { class: 'choice-focus' }, [
            el('span', { class: 'cf-label' }, [I18N.t('ui.prob.boosts') || 'Boostet']),
            ...focusChips
          ]));
        }
      }

      const btn = el('button', { class:'choice' }, children);
      btn.addEventListener('click', () => {
        $('#interrupt-overlay').classList.remove('active');
        // Decision-History für Result-Screen speichern (Taktik-Name + Phase)
        if (showFocus) {
          match._decisionHistory = match._decisionHistory || [];
          match._decisionHistory.push({
            phase,
            tacticId: opt.id,
            tacticName: opt.name
          });
        }
        onPick(opt);
      });
      list.appendChild(btn);
    });
    modal.appendChild(list);

    // Stats-Panel in allen Modals: schlank gehalten wie in den situativen
    // Events — nur die Phase-Relevant-Stats-Tabelle, keine Summary und
    // kein Prose-Guide mehr. Begründung: die vorherige Kombi (Summary +
    // Guide + Panel) war informationsüberladen, und die Summary-Werte
    // (Shots/Accuracy/Buildup/Saves) sind bereits aus dem Live-Match-
    // Dashboard sichtbar. Der Entscheidungsraum wird durch Stats-Tabelle
    // plus Option-Descriptions abgedeckt, Prose-Guide war redundant.
    //
    // v0.58 — Stats panel moved to BEFORE the intel box (top of modal,
    // right under subtitle) so it serves as factual reference for the
    // hints that interpret it. The append site here is a no-op now —
    // kept as a guard in case future code paths skip the early append.

    $('#interrupt-overlay').classList.add('active');
  },

  getOpponentSaveCount(match) {
    const recorded = (match?.opp?.lineup || []).reduce((sum, player) => sum + (player._matchStats?.saves || 0), 0);
    const goalEvents = (match?.squad || []).reduce((sum, player) => sum + (player._matchStats?.goals || 0), 0);
    const inferred = Math.max(0, (match?.stats?.myShotsOnTarget || 0) - goalEvents);
    return Math.max(recorded, inferred);
  },

  getOnTargetLabel() {
    const label = I18N.t('ui.statsPanel.onTarget');
    return label === 'ui.statsPanel.onTarget' ? 'On Target' : label;
  },

  renderMatchStatsPanel(match) {
    const s = match.stats;
    const myAccuracy = s.myShots ? Math.round(s.myShotsOnTarget / s.myShots * 100) : 0;
    const oppAccuracy = s.oppShots ? Math.round(s.oppShotsOnTarget / s.oppShots * 100) : 0;
    const myBuildupRate = s.myBuildups ? Math.round(s.myBuildupsSuccess / s.myBuildups * 100) : 0;
    const oppBuildupRate = s.oppBuildups ? Math.round(s.oppBuildupsSuccess / s.oppBuildups * 100) : 0;
    const possession = s.possRounds ? Math.round((s.possAccum / s.possRounds) * 100) : 50;
    const oppSaves = UI.getOpponentSaveCount(match);
    UI._lastOppSaveCount = oppSaves;
    const panel = el('div', { class:'interrupt-panel' }, [
      el('div', { class:'ip-title' }, [I18N.t('ui.result.analysis')]),
      UI.renderMatchStatRow(I18N.t('ui.statsPanel.possession'), possession + '%', (100-possession) + '%'),
      UI.renderMatchStatRow(I18N.t('ui.statsPanel.shots'), s.myShots, s.oppShots),
      UI.renderMatchStatRow(UI.getOnTargetLabel(), s.myShotsOnTarget, s.oppShotsOnTarget),
      UI.renderMatchStatRow(I18N.t('ui.statsPanel.accuracy'), myAccuracy + '%', oppAccuracy + '%'),
      UI.renderMatchStatRow(I18N.t('ui.statsPanel.buildup'), myBuildupRate + '%', oppBuildupRate + '%'),
      UI.renderMatchStatRow(I18N.t('ui.statsPanel.saves'), s.saves, '–')
    ]);
    return panel;
  },

  renderMatchStatRow(label, meVal, oppVal) {
    let resolvedLabel = label;
    let resolvedOpp = oppVal;

    if (label === I18N.t('ui.statsPanel.saves') && (oppVal === 'â€“' || oppVal === '–')) {
      resolvedOpp = UI._lastOppSaveCount ?? oppVal;
    }

    return el('div', { class:'ip-match-row' }, [
      el('span', { class:'ip-match-me' }, [String(meVal)]),
      el('span', { class:'ip-match-label' }, [resolvedLabel]),
      el('span', { class:'ip-match-opp' }, [String(resolvedOpp)])
    ]);
  },

  renderTeamStatsPanel(match, opts={}) {
    // v52.1: swapped out the wide OWN/DIFF/OPPONENT table for the same
    // horizontal chip strip used in the card phase (#cp-stat-diffs).
    // Rationale: the decision modals were showing a dense 5-row table
    // that duplicated what the live card phase already renders. Player
    // feedback: "I've been staring at these numbers all match, don't
    // show them to me again in a different format when I'm deciding".
    // Chip-form reuses the visual language of the hub scorecard + card
    // phase, adding the current match phase as the leading chip so the
    // decision inherits phase-context cleanly.
    //
    // v52.2: dropped the enclosing `.interrupt-panel` frame. The chip
    // strip already has per-chip borders + colouring, and the parent
    // `.interrupt-stats-always` provides a dashed separator line from
    // the decision list above — wrapping the chips in another bordered
    // panel was double-framing. Rendered bare now; the `.cp-stat-diffs`
    // class alone carries the layout, with a small wrap-fallback rule
    // in CSS so narrow modals don't overflow horizontally.
    const chipStrip = UI.buildStatDiffChipsEl(match);
    if (!chipStrip) {
      // Fallback: no squad/opp data — render a tiny note so the panel
      // doesn't just vanish. Should never fire in practice.
      return el('div', { class: 'modal-stat-diffs-fallback' }, [
        el('div', { class: 'ip-title' }, [I18N.t('ui.statsPanel.currentTeamStats')])
      ]);
    }
    // Tag the strip with a modal-context class so CSS can enable wrap
    // without affecting the card-phase strip (which scrolls horizontally
    // in its own, wider container).
    chipStrip.classList.add('cp-stat-diffs--modal');
    return chipStrip;
  },

  showEvolution(player, options, onPick) {
    const modal = $('#interrupt-modal');
    modal.innerHTML = '';
    modal.classList.remove('interrupt-modal--event');
    modal.appendChild(el('h2', { style:{ color:'var(--gold)' } }, [I18N.t('ui.evolution.title')]));
    modal.appendChild(el('div', { class:'sub' }, [I18N.t('ui.evolution.reachedLevel', { name: player.name, role: DATA.roles.find(r=>r.id===player.role)?.label, level: player.level })]));
    const opts = el('div', { class:'evo-options' });
    options.forEach(evoId => {
      const evo = DATA.evoDetails[evoId];
      if (!evo) return;
      const boostText = Object.entries(evo.boosts).map(([k,v]) => `${k.substring(0,3).toUpperCase()} ${v>=0?'+':''}${v}`).join('  ');
      const traitDef = DATA.traits[evo.trait];
      const card = el('div', { class:'evo-option' }, [
        el('div', { class:'evo-name' }, [evo.label]),
        el('div', { class:'evo-role' }, [DATA.roles.find(r=>r.id===evo.role)?.label || evo.role]),
        el('div', { class:'evo-boost' }, [boostText]),
        traitDef ? el('div', { class:'evo-trait' }, [
          el('b', {}, [I18N.t('ui.evolution.traitLabel', { name: traitDef.name })]),
          el('span', {}, [traitDef.desc])
        ]) : null,
        evo.parentTrait ? el('div', { class:'mono-sm', style:{ marginTop:'6px', color:'var(--accent-2)' } }, [
          I18N.t('ui.evolution.keepsTrait', { name: DATA.traits[evo.parentTrait]?.name || evo.parentTrait })
        ]) : null
      ]);
      card.addEventListener('click', () => {
        $('#interrupt-overlay').classList.remove('active');
        onPick(evoId);
      });
      opts.appendChild(card);
    });
    modal.appendChild(opts);
    $('#interrupt-overlay').classList.add('active');
  },

  // Extrahiert die 2-3 wichtigsten Momente aus einem Match.
  // Gibt Objekte mit {icon, text, tone}.
  buildResultHighlights(match, result) {
    if (!match?.squad) return [];
    const highlights = [];
    const squad = match.squad;

    // Top scorer
    const scorers = squad
      .filter(p => (p._matchStats?.goals || 0) > 0)
      .sort((a, b) => (b._matchStats.goals || 0) - (a._matchStats.goals || 0));
    if (scorers.length) {
      const top = scorers[0];
      const g = top._matchStats.goals;
      const key = g >= 3 ? 'ui.result.hlHatTrick'
                : g >= 2 ? 'ui.result.hlBraceOrHat'
                : 'ui.result.hlGoal';
      highlights.push({
        icon: '⚽',
        text: I18N.t(key, { name: top.name, n: g }),
        tone: 'good'
      });
    }

    // Keeper save count
    const keeper = squad.find(p => p.role === 'TW');
    if (keeper) {
      const saves = keeper._matchStats?.saves || 0;
      if (saves >= 4) {
        highlights.push({
          icon: '🧤',
          text: I18N.t('ui.result.hlKeeperBig', { name: keeper.name, n: saves }),
          tone: 'good'
        });
      } else if (saves >= 2 && result !== 'loss') {
        highlights.push({
          icon: '🧤',
          text: I18N.t('ui.result.hlKeeperSolid', { name: keeper.name, n: saves }),
          tone: 'good'
        });
      }
    }

    // Big XP gainer (breakout)
    const breakout = squad
      .map(p => ({ p, xp: p._lastMatchXp || 0 }))
      .filter(({ xp }) => xp >= 8)
      .sort((a, b) => b.xp - a.xp)[0];
    if (breakout && highlights.length < 3) {
      highlights.push({
        icon: '✦',
        text: I18N.t('ui.result.hlBreakout', { name: breakout.p.name, xp: breakout.xp }),
        tone: 'neutral'
      });
    }

    // Low performer (nur bei Niederlage, nur wenn wirklich unterirdisch)
    if (result === 'loss' && highlights.length < 3) {
      const flop = squad
        .map(p => ({ p, xp: p._lastMatchXp || 0 }))
        .filter(({ xp }) => xp <= 1)
        .sort((a, b) => a.xp - b.xp)[0];
      if (flop) {
        highlights.push({
          icon: '✗',
          text: I18N.t('ui.result.hlFlop', { name: flop.p.name }),
          tone: 'warn'
        });
      }
    }

    // Sacrifice (falls vorhanden) — das ist erzählerisch wichtig
    if (match._sacrificeVictim) {
      highlights.push({
        icon: '⚠',
        text: I18N.t('ui.result.sacrificeNote', { name: match._sacrificeVictim.name }),
        tone: 'warn'
      });
    }

    // Decision-Wert: Vergleich Pre-Match-Win-Prob gegen tatsächliches
    // Ergebnis. Ein Sieg bei 30% Pre-Match-Prob war +70pp "over expectation",
    // eine Niederlage bei 70% war -70pp. Das ist nicht exakt der Wert der
    // Entscheidungen (Random ist auch dabei), aber es gibt dem Spieler
    // Feedback dazu, ob er über oder unter Erwartung performt hat.
    // Nur zeigen wenn Pre-Match-Prob vorhanden und das Delta signifikant ist.
    if (typeof match._preMatchWinProb === 'number' && highlights.length < 3) {
      const preWin = match._preMatchWinProb * 100; // war 0..1
      let actualPoints;
      if (result === 'win')       actualPoints = 100;
      else if (result === 'draw') actualPoints = 50;
      else                        actualPoints = 0;
      const delta = Math.round(actualPoints - preWin);
      if (Math.abs(delta) >= 15) {
        const tone = delta > 0 ? 'good' : 'warn';
        const key = delta > 0 ? 'ui.result.hlOverperform' : 'ui.result.hlUnderperform';
        highlights.push({
          icon: delta > 0 ? '▲' : '▼',
          text: I18N.t(key, { delta: Math.abs(delta), pre: Math.round(preWin) }),
          tone
        });
      }
    }

    return highlights.slice(0, 3);
  },

  // v0.56 — One-line match verdict for the result-screen hero.
  // Walks a priority ladder of signals; first match wins, returns
  // a short sentence in the active language. Reads from telemetry
  // already populated by the engine + flow.js (match.stats.*,
  // match.squad with end-of-match condition snapshots, opp power).
  // Returns '' if no clear signal — the hero falls back to just
  // result + score, which is also fine.
  //
  // v0.60 — Now also collects SECONDARY causes (signals that fired
  // but didn't make the headline). Returns shape:
  //   { headline: 'string', causes: ['string', 'string'] }
  // Backward compatible: if a caller treats the return as a string,
  // toString returns the headline. Result-screen renders the
  // secondary causes as small dim lines below the headline so the
  // player gets a 2-3 line breakdown instead of just one.
  //
  // Heuristic ladder, top-down:
  //  1. Heavy power gap (lost/drew despite being underdog) → moral win
  //  2. Squad fatigue (multiple starters at <35 condition end of match)
  //  3. Buildup conversion <50% → vision/passing struggled
  //  4. Created chances but couldn't finish (high shots, low goals)
  //  5. Opp converted ruthlessly (few shots, high goals)
  //  6. Generic fallbacks per result type
  computeMatchVerdict(result, match) {
    const empty = { headline: '', causes: [], toString() { return ''; } };
    if (!match) return empty;
    const t = (key, vars) => {
      const raw = window.I18N?.t?.(key, vars || {});
      return (raw && raw !== key) ? raw : '';
    };
    const stats   = match.stats || {};
    const squad   = match.squad || [];
    const opp     = match.opp   || {};
    const scoreMe  = match.scoreMe  || 0;
    const scoreOpp = match.scoreOpp || 0;

    // Power comparison — opp.power is set at match generation time.
    const oppPower = opp.power || 0;
    const myPower  = match.myPower || 0;
    const wasUnderdog = oppPower > 0 && myPower > 0 && oppPower > myPower * 1.15;

    // Condition fallout — count starters who ended at <35 condition.
    const tiredStarters = squad.filter(p =>
      typeof p.condition === 'number' && p.condition < 35
    );
    const fatigueNames = tiredStarters.slice(0, 2).map(p => p.name).join(', ');

    // Buildup conversion
    const bldAtt  = stats.myBuildups || 0;
    const bldOk   = stats.myBuildupsSuccess || 0;
    const bldRate = bldAtt > 0 ? bldOk / bldAtt : 1.0;

    // Shot conversion (mine)
    const shots   = stats.myShots || 0;
    const sotMe   = stats.myShotsOnTarget || 0;
    const myConv  = sotMe > 0 ? scoreMe / sotMe : 0;

    // Opp conversion
    const oppShots = stats.oppShots || 0;
    const oppConv  = oppShots > 0 ? scoreOpp / oppShots : 0;

    // Collect all firing signals in priority order. Each signal: { text }.
    const signals = [];

    // ── 1. Underdog moral — drew or lost narrowly while massively underdogged
    if (wasUnderdog && (result === 'draw' || (result === 'loss' && (scoreOpp - scoreMe) <= 1))) {
      const v = t('ui.result.verdict.underdogStood')
        || (result === 'draw'
            ? 'Held the favourites — points off a stronger side.'
            : 'Tight loss to a clearly stronger team — close to upset.');
      signals.push({ text: v });
    }

    // ── 2. Squad fatigue — explains a loss/draw via late-match condition
    if (result !== 'win' && tiredStarters.length >= 2 && fatigueNames) {
      const v = t('ui.result.verdict.squadGassed', { players: fatigueNames })
        || `Squad ran out of legs — ${fatigueNames} dropped below 35 condition.`;
      signals.push({ text: v });
    }

    // ── 3. Buildup struggled — passed less than half cleanly
    if (result !== 'win' && bldAtt >= 6 && bldRate < 0.5) {
      const pct = Math.round(bldRate * 100);
      const v = t('ui.result.verdict.buildupStruggled', { pct })
        || `Buildup play stalled — only ${pct}% of attempts found the runner.`;
      signals.push({ text: v });
    }

    // ── 4. Created chances, missed them (shots high, conversion low)
    if (result !== 'win' && shots >= 6 && scoreMe <= 1) {
      const v = t('ui.result.verdict.chancesMissed', { shots })
        || `${shots} shots to one goal — chances came, finishing didn't.`;
      signals.push({ text: v });
    }

    // ── 5. Opp lethal — they didn't shoot much but converted everything
    if (scoreOpp >= 2 && oppShots >= 1 && oppConv >= 0.6) {
      const v = t('ui.result.verdict.oppRuthless', { shots: oppShots, goals: scoreOpp })
        || `Their ${oppShots} chance${oppShots > 1 ? 's' : ''} found ${scoreOpp} goal${scoreOpp > 1 ? 's' : ''} — clinical.`;
      signals.push({ text: v });
    }

    // If at least one specific signal fired, headline = first, causes = next 2.
    if (signals.length > 0) {
      const headline = signals[0].text;
      const causes = signals.slice(1, 3).map(s => s.text);
      return { headline, causes, toString() { return headline; } };
    }

    // ── 6. Generic fallbacks (no specific signal fired)
    let fallback = '';
    if (result === 'win') {
      const margin = scoreMe - scoreOpp;
      if (margin >= 3) {
        fallback = t('ui.result.verdict.dominantWin') || 'Routine win — the gap showed.';
      } else if (margin > 0) {
        fallback = t('ui.result.verdict.gritWin') || 'Hard-fought win.';
      }
    } else if (result === 'draw') {
      fallback = t('ui.result.verdict.shareSpoils') || 'Honours even.';
    } else {
      fallback = t('ui.result.verdict.toughLoss') || 'Tough one — back to the drawing board.';
    }
    return { headline: fallback, causes: [], toString() { return fallback; } };
  },

  renderResult(result, scoreMe, scoreOpp, reward, match) {
    if (window.FX) {
      if (result === 'win') window.FX.winResult();
      else if (result === 'loss') window.FX.lossResult();
    }
    const cls = result === 'win' ? 'win' : (result === 'loss' ? 'loss' : 'draw');
    const title = result === 'win' ? I18N.t('ui.result.win')
                 : result === 'loss' ? I18N.t('ui.result.loss')
                 : I18N.t('ui.result.draw');
    const content = $('#result-content');
    content.innerHTML = '';

    // --- Zone A: Hero — Result title + Score + Verdict + Causes. ---
    // v0.56 — Match-Verdict-Headline. Single sentence diagnosing what
    // shaped the result, computed from the post-match telemetry data
    // the engine already collected. Turns "I lost again" into "I lost
    // BECAUSE..." — the difference between a frustrating loss and a
    // useful one. Heuristic ranks several signals; the first match
    // wins. See computeMatchVerdict for the actual ladder.
    //
    // v0.60 — computeMatchVerdict now returns headline + secondary
    // causes. The headline reads as before; up to 2 secondary causes
    // render as smaller dim italic lines below it. Multiple signals
    // can fire on the same loss (e.g. fatigue + missed chances + opp
    // ruthless) — the player gets all three angles instead of just
    // the dominant one. Wins skip causes (only the headline shows)
    // because we don't need to dissect *why* the team won.
    const verdictData = UI.computeMatchVerdict(result, match);
    const verdict = (verdictData && verdictData.headline) || '';
    const causes  = (verdictData && verdictData.causes)   || [];
    const heroChildren = [
      el('h1', { class: cls }, [title]),
      el('div', { class:'result-score' }, [`${scoreMe} : ${scoreOpp}`]),
      verdict ? el('div', { class:'result-verdict ' + cls }, [verdict]) : null
    ];
    if (causes.length && result !== 'win') {
      const causesEl = el('div', { class:'result-causes' });
      for (const c of causes) {
        causesEl.appendChild(el('div', { class:'result-cause-row' }, [c]));
      }
      heroChildren.push(causesEl);
    }
    if (reward) heroChildren.push(el('div', { class:'result-reward' }, [reward]));
    content.appendChild(el('div', { class:'result-hero' }, heroChildren));

    // --- Zone A.1: Match-Recap-Stripe ---
    // Statische Kopie des Live-Stripes mit allen Events dieses Matches.
    // Auf einen Blick: Wann fielen die Tore? Wann zog der Gegner eine
    // Karte? Wo lagen die Interrupt-Entscheidungen? Lohnt als kompakter
    // visueller Anker vor den ausführlicheren Summary-Panels darunter.
    if (window.KL?.matchHud?.mountRecap) {
      const recapBox = el('div', { class: 'result-recap-stripe' });
      content.appendChild(recapBox);
      try {
        window.KL.matchHud.mountRecap(recapBox);
      } catch (_) { /* recap ist optional — bei Fehler einfach weglassen */ }
    }

    // --- Zone A.5: Achievement pops — unlocked this match.
    // v52.2: state.pendingAchievementPop was populated by checkAchievements
    // (flow.js before renderResult) but previously the hub silently cleared
    // it without display. Now we render a compact strip on the result
    // screen and consume the list here so the hub's clear is a no-op.
    // Only visible when there's actually something to pop.
    const popped = Array.isArray(window.state?.pendingAchievementPop)
      ? window.state.pendingAchievementPop.slice()
      : [];
    if (popped.length) {
      const bannerKey = popped.length === 1
        ? 'ui.result.achievementsBannerOne'
        : 'ui.result.achievementsBanner';
      const strip = el('div', { class: 'result-achievements-strip' }, [
        el('div', { class: 'ras-title' }, [I18N.t(bannerKey) || '🏆 New unlocks']),
        el('div', { class: 'ras-list' }, popped.map(ach =>
          el('div', { class: 'ras-item', title: ach.desc || '' }, [
            el('span', { class: 'ras-icon' }, ['🏆']),
            el('span', { class: 'ras-text' }, [
              el('span', { class: 'ras-name' }, [ach.title || ach.id]),
              ach.desc ? el('span', { class: 'ras-desc' }, [ach.desc]) : null
            ])
          ])
        ))
      ]);
      content.appendChild(strip);
      // Consume — the hub clear at the top of renderHub becomes a no-op
      // now because we actually displayed the pops. Without this the
      // same achievements would flash again on any later hub render.
      window.state.pendingAchievementPop = [];
    }

    // --- Zone B (moved): Card Summary, Highlights, Next-Up all go
    // INTO the accordion below rather than sitting open above it.
    // Result screen stays maximally compact — only Hero is default
    // visible. The accordion sections default-open for primary
    // sections (card-summary, highlights), default-closed for detail
    // (match log, stats, etc.). Restores the v38 layout feel.
    let cardSummary = null;
    let highlightsBox = null;
    let nextBoxEl = null;
    if (match) {
      const cfg = window.CONFIG || window.KL?.config?.CONFIG;
      if (cfg?.cardsEnabled && window.KL?.cards) {
        const cs = UI.buildCardMatchSummary(match, window.state);
        if (cs) {
          cs.classList.add('result-card-hero');
          // v52.2: tag the hero panel with the result class so its
          // border / title colour can follow the outcome. Previously
          // the green `--accent` was hard-coded here, which made WIN
          // pages feel "all green" and LOSS/DRAW screens visually
          // mismatched (green panel under a red/gold title).
          cs.classList.add('result-card-hero--' + cls);
          cardSummary = cs;
        }
      }

      // Highlights and Next-Up still as two-column row, but wrapped
      // into their own accordion section.
      const highlights = UI.buildResultHighlights(match, result);
      const nextBox = (cfg?.cardsEnabled && window.KL?.cards)
        ? UI.buildNextUpPreview(match, window.state, result)
        : null;

      if (highlights.length || nextBox) {
        const twoCol = el('div', { class: 'result-two-col' });

        if (highlights.length) {
          const hlBox = el('div', { class: 'result-highlights result-col' });
          hlBox.appendChild(el('div', { class: 'result-col-title' }, ['HIGHLIGHTS']));
          highlights.forEach(h => {
            hlBox.appendChild(el('div', { class: 'result-hl tone-' + h.tone }, [
              el('span', { class: 'hl-icon' }, [h.icon]),
              el('span', { class: 'hl-text' }, [h.text])
            ]));
          });
          twoCol.appendChild(hlBox);
        }

        if (nextBox) {
          nextBox.classList.add('result-col');
          twoCol.appendChild(nextBox);
        }

        highlightsBox = twoCol;
      }

      // --- Zone D: Player Perf prepared for accordion ---
      // Plus Result-spezifischer Footer pro Karte: XP-Gewinn, Form-Delta,
      // rollenspezifische Match-Performance.
      //
      // DEMOTED: This was primary content pre-v5; in card mode the card
      // impact above reads first, player perf stays available but quieter.
      const perfBox = el('div', { class:'result-perf-grid squad-display result-perf-demoted' });
      for (const p of match.squad) {
        const xp = p._lastMatchXp || 0;
        const ms = p._matchStats || {};
        const formDelta = p._formDelta || 0;

        let detail = '';
        if (p.role === 'ST' || p.role === 'LF') detail = `${ms.goals || 0}⚽ · ${ms.shotsOnTarget || 0}/${ms.shots || 0}🎯`;
        else if (p.role === 'PM') detail = `${ms.buildupsOk || 0}/${ms.buildups || 0} ${I18N.t('ui.statsPanel.buildup')}`;
        else if (p.role === 'VT') detail = `${ms.defendedAttacks || 0} ${I18N.t('ui.result.stopsLabel')}`;
        else if (p.role === 'TW') detail = `${ms.saves || 0} ${I18N.t('ui.statsPanel.saves')}`;

        const xpTone = xp >= 6 ? 'good' : (xp <= 2 ? 'bad' : 'dim');
        // Früher: inline-Split "+17 XP (7+10★)" der die Meta-Zeile
        // verbreitet und den Form-Chip inkonsistent nach unten umbrach.
        // Die vollständige Decision-XP-Aufschlüsselung steht weiter
        // unten in der Details-Sektion ("Deine Entscheidungen").
        const xpChildren = [`+${xp} XP`];

        const formMark = formDelta > 0 ? '↑' : (formDelta < 0 ? '↓' : '');
        const formColor = formDelta > 0 ? 'var(--good)' : (formDelta < 0 ? 'var(--danger)' : 'var(--muted)');
        const formLabelKey = formDelta > 0 ? 'ui.labels.goodForm' : 'ui.labels.badForm';

        // Academy-Spieler: kein XP-Chip, keine Form-Anzeige — beides gibt
        // es für Aushilfen nicht und die "+0 XP bad"-Darstellung wäre
        // irreführend (sie haben nicht schlecht gespielt, sie bekommen
        // per Design keine XP).
        const metaChildren = p.isAcademy
          ? [el('span', { class:'rcf-xp dim', style:{ fontStyle:'italic' } }, [I18N.t('ui.labels.academy') || 'ACADEMY'])]
          : [
              el('span', { class:'rcf-xp ' + xpTone }, xpChildren),
              formMark
                ? el('span', { class:'rcf-form', style:{ color: formColor } }, [formMark + ' ' + I18N.t(formLabelKey).toLowerCase()])
                : null
            ];

        // Wrapper: Standard-Card oben + Result-Footer drunter
        const wrap = el('div', { class:'result-card-wrap' });
        wrap.appendChild(UI.renderPlayerCard(p, { showStatDiff: true }));
        wrap.appendChild(el('div', { class:'result-card-foot' }, [
          el('div', { class:'rcf-detail' }, [detail || '—']),
          el('div', { class:'rcf-meta' }, metaChildren)
        ]));
        perfBox.appendChild(wrap);
      }
      // (Don't append perfBox directly — it goes inside the accordion
      // below, closed by default. Keeps the result screen compact and
      // lets the player expand player performance on demand.)

      // --- Zone D: Accordion-Details — gleiche Sprache wie Hub ---
      // All secondary sections are now accordion-wrapped so the top
      // of the screen stays compact: hero + highlights + card-summary
      // + next-up are the primary reads, everything else is opt-in.
      const accordion = el('div', { class: 'hub-accordion result-accordion' });

      // Helper to build one section — keeps body hidden until head click.
      const buildSection = (id, label, meta, bodyContent, openByDefault = false) => {
        const section = el('div', {
          class: 'hub-acc-section' + (openByDefault ? ' open' : ''),
          'data-section': id
        });
        const head = el('div', { class: 'hub-acc-head' }, [
          el('span', { class: 'hub-acc-label' }, [label]),
          meta ? el('span', { class: 'hub-acc-meta' }, [meta]) : null,
          el('span', { class: 'hub-acc-arrow' }, ['▾'])
        ]);
        const body = el('div', { class: 'hub-acc-body' });
        body.appendChild(bodyContent);
        head.addEventListener('click', () => {
          section.classList.toggle('open');
        });
        section.appendChild(head);
        section.appendChild(body);
        return section;
      };

      // -- Section: Card Summary — primary story for cards-mode.
      //    Default OPEN so the player sees their card impact first,
      //    but it's now collapsible rather than permanently sitting
      //    above the accordion. Restores v38 layout.
      if (cardSummary) {
        accordion.appendChild(buildSection('card-summary',
          I18N.t('ui.result.cardSummaryTitle') || 'Card Play',
          null,
          cardSummary,
          true   // open by default
        ));
      }

      // -- Section: Highlights + Next Up — narrative beats + preview.
      //    Default OPEN, collapsible. Holds the 2-col internal layout.
      if (highlightsBox) {
        accordion.appendChild(buildSection('highlights',
          I18N.t('ui.result.highlightsTitle') || 'Highlights & Next',
          null,
          highlightsBox,
          true   // open by default
        ));
      }

      // -- Section: Player Performance — XP, form, per-player stats --
      // Closed by default: it's detail for interested players, not the
      // story. The top-of-screen blocks (highlights + card summary)
      // already convey the match arc.
      accordion.appendChild(buildSection('players',
        I18N.t('ui.result.players') || 'Player Performance',
        match.squad.length + '',
        perfBox
      ));

      // -- Section: Match Log --
      const logEntries = (window.getState?.()?._lastMatchLog) || [];
      if (logEntries.length) {
        const logBody = el('div', { class: 'match-log', style: { maxHeight: '280px', fontSize: '13px' } });
        logEntries.forEach(({ msg, cls }) => logBody.appendChild(el('div', { class: logLineClass(cls) }, [msg])));
        accordion.appendChild(buildSection('log',
          I18N.t('ui.result.matchLogTitle'),
          logEntries.length + '',
          logBody
        ));
      }

      // -- Section: Match Flow (team stat drift) --
      if (match._momentumBaseline) {
        const base = match._momentumBaseline.me;
        const current = (() => {
          const totals = { offense: 0, defense: 0, tempo: 0, vision: 0, composure: 0 };
          for (const p of match.squad) {
            const s = (typeof computePlayerStats === 'function')
              ? computePlayerStats(p, match) : (p.stats || {});
            for (const k of Object.keys(totals)) totals[k] += (s[k] || 0);
          }
          for (const k of Object.keys(totals)) totals[k] = Math.round(totals[k] / match.squad.length);
          return totals;
        })();
        const deltas = Object.keys(base)
          .map(k => ({ stat: k, from: base[k], to: current[k], delta: current[k] - base[k] }))
          .filter(d => Math.abs(d.delta) >= 2)
          .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
        if (deltas.length) {
          const STAT_LABEL = { offense: 'OFF', defense: 'DEF', tempo: 'TMP', vision: 'VIS', composure: 'CMP' };
          const flowWrap = el('div', { class: 'result-flow-inner' });
          flowWrap.appendChild(el('div', { class: 'result-sub-hint' }, [
            I18N.t('ui.result.matchFlowHint') || 'Team-Stat-Entwicklung während des Matches (Buffs, Form, Traits).'
          ]));
          for (const d of deltas) {
            const sign = d.delta > 0 ? '+' : '';
            const tone = d.delta > 0 ? 'good' : 'bad';
            flowWrap.appendChild(el('div', { class: 'decision-row' }, [
              el('span', { class: 'dec-phase' }, [STAT_LABEL[d.stat] || d.stat.toUpperCase()]),
              el('span', { class: 'dec-name' },  [`${d.from} → ${d.to}`]),
              el('span', { class: 'dec-delta tone-' + tone }, [`${sign}${d.delta}`])
            ]));
          }
          accordion.appendChild(buildSection('flow',
            I18N.t('ui.result.matchFlowTitle') || 'Match Flow',
            deltas.length + '',
            flowWrap
          ));
        }
      }

      // -- Section: Full Stats Breakdown --
      const s = match.stats || {};
      const possession = s.possRounds
        ? Math.round((s.possAccum / s.possRounds) * 100) : 50;
      const myAccuracy = s.myShots
        ? Math.round((s.myShotsOnTarget / s.myShots) * 100) : 0;
      const oppAccuracy = s.oppShots
        ? Math.round((s.oppShotsOnTarget / s.oppShots) * 100) : 0;
      // v52.2 fix: build-up rate was reading s.buildupsAttempted /
      // s.buildupsSuccess (undefined), always rendering 0%. Engine
      // stores these as myBuildups / myBuildupsSuccess (and
      // oppBuildups / oppBuildupsSuccess). Same keys the live
      // stats-panel at line 3093 uses; now consistent.
      const myBuildupRate = s.myBuildups
        ? Math.round((s.myBuildupsSuccess / s.myBuildups) * 100) : 0;
      const oppBuildupRate = s.oppBuildups
        ? Math.round((s.oppBuildupsSuccess / s.oppBuildups) * 100) : 0;
      // Opp saves: now tracked directly in match.stats.oppSaves (bumped
      // at every opp-keeper save site in engine.js). Fallback to the old
      // subtraction formula for legacy matches, with Math.max to clamp
      // the negative values that direct-action goals used to produce
      // (scoreMe > myShotsOnTarget when goals come from scrappy/extraShot/etc).
      const oppSaves = (s.oppSaves != null)
        ? s.oppSaves
        : Math.max(0, s.myShotsOnTarget - (match.scoreMe || scoreMe));
      const statsBody = el('div', { class: 'result-stats-inner' });
      [
        [I18N.t('ui.statsPanel.possession'), possession + '%', (100 - possession) + '%'],
        [I18N.t('ui.statsPanel.goals'),      scoreMe,           scoreOpp],
        [I18N.t('ui.statsPanel.shots'),      s.myShots,         s.oppShots],
        [UI.getOnTargetLabel(),              s.myShotsOnTarget, s.oppShotsOnTarget],
        [I18N.t('ui.statsPanel.accuracy'),   myAccuracy + '%',  oppAccuracy + '%'],
        [I18N.t('ui.statsPanel.buildup'),    myBuildupRate + '%', oppBuildupRate + '%'],
        [I18N.t('ui.statsPanel.saves'),      s.saves,           oppSaves],
        [I18N.t('ui.statsPanel.abilitiesTriggered'), s.triggersFired || 0, s.oppTriggersFired || 0]
      ].forEach(([label, me, opp]) => statsBody.appendChild(UI.renderMatchStatRow(label, me, opp)));
      accordion.appendChild(buildSection('stats',
        I18N.t('ui.statsPanel.title') || 'Stats',
        '',
        statsBody
      ));

      // -- Section: Decisions XP breakdown --
      const decisions = match._decisionHistory || [];
      if (decisions.length) {
        const decBody = el('div', { class: 'result-decisions-inner' });
        const perTactic = {};
        for (const p of match.squad) {
          const sources = p._decisionXpSources || {};
          for (const [decId, amount] of Object.entries(sources)) {
            perTactic[decId] = (perTactic[decId] || 0) + amount;
          }
        }
        for (const d of decisions) {
          const phase = d.phase === 'kickoff' ? 'R1' : d.phase === 'halftime' ? 'HT' : 'R6';
          const bonus = perTactic[d.tacticId] || 0;
          // Prefer the name stored at decision time; fall back to i18n
          // lookup by tacticId; last resort a generic decision label.
          const decName = d.tacticName
            || I18N.t('ui.decisions.' + d.tacticId + '.name')
            || d.tacticId || '—';
          decBody.appendChild(el('div', { class: 'decision-row' }, [
            el('span', { class: 'dec-phase' }, [phase]),
            el('span', { class: 'dec-name' },  [decName]),
            el('span', { class: 'dec-delta tone-' + (bonus > 0 ? 'good' : 'neutral') },
              [bonus > 0 ? `+${bonus} XP` : '—'])
          ]));
        }
        accordion.appendChild(buildSection('decisions',
          I18N.t('ui.result.decisionsTitle') || 'Deine Entscheidungen',
          decisions.length + '',
          decBody
        ));
      }

      // -- Section: Trait Report --
      if (typeof buildMatchTraitReport === 'function') {
        const report = buildMatchTraitReport(match);
        if (report.length) {
          const traitBody = el('div', { class: 'result-perf-list' });
          for (const entry of report) {
            const fireLabel = entry.isPassive
              ? I18N.t('ui.result.traitReportPassive')
              : I18N.t('ui.result.traitReportFires', { count: entry.count });
            traitBody.appendChild(el('div', { class: 'result-perf-row' }, [
              el('span', { class: 'perf-role' }, [entry.role ? UI.roleAbbr(entry.role) : '—']),
              el('span', { class: 'perf-name' }, [entry.traitName]),
              el('span', { class: 'perf-detail' }, [entry.playerName]),
              el('span', { class: 'perf-xp good' }, [fireLabel]),
              el('span', { class: 'perf-impact' }, [I18N.t('ui.result.traitReportImpact', { value: entry.estimatedImpact })])
            ]));
          }
          accordion.appendChild(buildSection('traits',
            I18N.t('ui.result.traitReportTitle'),
            report.length + '',
            traitBody
          ));
        }
      }

      content.appendChild(accordion);
    }

    content.appendChild(el('div', { class:'btn-row', style:{ justifyContent:'center', marginTop:'20px' } }, [
      el('button', { class:'btn primary', onClick: () => FLOW.continueRun() }, [I18N.t('ui.result.continue')])
    ]));
    UI.showScreen('screen-result');
  },


  // ─── Card-phase UI ──────────────────────────────────────────────────────
  // Non-modal hand strip at the bottom of the match screen. Driven entirely
  // by KL.cards state (deck/hand/discard/energy on state + match). Click a
  // card to play; click End Turn to resolve and let the engine continue.
  // ────────────────────────────────────────────────────────────────────────

  _cardPhaseEndResolve: null,

  showCardPhase(match, state, onEnd) {
    const box = document.getElementById('card-phase');
    if (!box) { onEnd && onEnd(); return; }
    UI._cardPhaseEndResolve = onEnd;
    UI._cardPhaseMatch = match;
    UI._cardPhaseState = state;

    box.classList.add('active');

    // Wire End Turn button (replace any previous handler).
    const endBtn = document.getElementById('cp-end-btn');
    if (endBtn) {
      endBtn.onclick = () => UI.endCardPhase();
    }

    // Wire Mulligan button. Only visible on Round 1 if not yet used.
    // Click discards hand, draws fresh, hides itself.
    const mulliganBtn = document.getElementById('cp-mulligan-btn');
    if (mulliganBtn) {
      const canMulligan = (match.round || 1) === 1 && !match._mulliganUsed;
      mulliganBtn.style.display = canMulligan ? '' : 'none';
      mulliganBtn.onclick = () => {
        if (!window.KL?.cards?.useMulligan) return;
        const ok = window.KL.cards.useMulligan(state, match);
        if (ok) {
          mulliganBtn.style.display = 'none';
          UI.renderCardPhase();
        }
      };
    }

    UI.renderCardPhase();

    // First-ever card phase — show an onboarding overlay once per
    // browser (persisted via localStorage). Guides the new player
    // through Hand, Energy, Flow, End Turn before they touch anything.
    try {
      const seen = window.localStorage?.getItem?.('kicklike_tutorial_cards_seen');
      if (!seen && match.round === 1 && (window.state?.matchNumber || 0) === 0) {
        UI.showCardTutorial();
        window.localStorage?.setItem?.('kicklike_tutorial_cards_seen', '1');
      }
    } catch (_) { /* localStorage may be blocked; the tutorial is optional */ }

    // v0.55 — Second-stage tutorial. The first overlay covered Hand /
    // Energy / Flow / Situations / End Turn — enough to play match 1.
    // After two matches the player has seen the core loop work; now
    // surface the *next* layer of mechanics they've been seeing in the
    // UI but probably haven't decoded: phase affinity, the EV chip on
    // each card, the Probable Situations panel that shows which match
    // frames to expect. Gated by a separate localStorage key so old
    // saves get the second pass too. Trigger fires at the start of the
    // match-3 card phase (matchNumber === 2 because the counter is
    // 0-indexed at the first card-phase call) so the player has played
    // through one full match plus halftime/final picks before this
    // overlay appears.
    try {
      const seen2 = window.localStorage?.getItem?.('kicklike_tutorial_cards2_seen');
      if (!seen2 && match.round === 1 && (window.state?.matchNumber || 0) === 2) {
        UI.showCardTutorial2();
        window.localStorage?.setItem?.('kicklike_tutorial_cards2_seen', '1');
      }
    } catch (_) { /* localStorage may be blocked; the tutorial is optional */ }

    // If no playable cards and no reason to wait, auto-end after a beat.
    // (Still give player a chance to see the hand.)
    // Kept manual for MVP so the player always feels in control.
  },

  endCardPhase() {
    const match = UI._cardPhaseMatch;
    const state = UI._cardPhaseState;
    const box = document.getElementById('card-phase');
    if (!match || !state) return;

    // Skip malus — if the player ended the round without playing any
    // cards, the team plays on autopilot this round. Small TMP/VIS hit
    // so skipping has a REAL cost. Prevents the "skip everything and
    // still win 5-0" play pattern the game devolved into at v7.
    // v52.6 — Stronger + stacking malus. Per playtester report: matches
    // were still winnable from round 1 with no card play. Now:
    //   1st skip in match: -6 TMP / -4 VIS (this round)
    //   2nd skip:          -8 TMP / -6 VIS / -2 CMP
    //   3rd+ skip:         -10 TMP / -8 VIS / -4 CMP / -3 OFF
    // Plus a sticky carryover layer: +1 cumulative -2 TMP malus per skip,
    // capped at -8, lasting until match end. Skipping is now a real cost,
    // not a free shortcut to "playing on autopilot".
    try {
      const playedThisRound = (match._cardsPlayedThisMatch || [])
        .filter(p => p.round === match.round);
      if (playedThisRound.length === 0) {
        match._skipCount = (match._skipCount || 0) + 1;
        const skipN = match._skipCount;

        const tier = skipN >= 3 ? 3 : skipN >= 2 ? 2 : 1;
        // v52.7 — Malus jetzt über alle 5 Stats verteilt. Zuvor nur TMP/VIS
        // (+ CMP/OFF auf höheren Tiers), was sich punktuell anfühlte. Ohne
        // Karten spielt das Team im Ganzen unkoordiniert — also leiden alle
        // Bereiche. Werte bewusst moderat: Skipping bleibt eine valide
        // Strategie (nicht jeder will jede Runde Karten spielen), aber der
        // Cost ist jetzt durchgängig spürbar statt nur in zwei Stats.
        const ROUND_MALUS = {
          1: { offense: -3, defense: -3, tempo: -5, vision: -4, composure: -3 },
          2: { offense: -5, defense: -5, tempo: -7, vision: -6, composure: -5 },
          3: { offense: -7, defense: -7, tempo: -9, vision: -8, composure: -7 }
        }[tier];

        match.buffLayers.push({
          source: 'skip_malus',
          range: [match.round, match.round],
          stats: ROUND_MALUS,
          special: null
        });

        // Sticky carryover: -2 TMP per cumulative skip, capped at -8,
        // lasting until match end. Single layer that we patch each time
        // (rather than stacking N layers) so the buff inspector stays
        // clean.
        const stickyMalus = -Math.min(8, 2 * skipN);
        const existingSticky = match.buffLayers.find(L => L.source === 'skip_malus_sticky');
        if (existingSticky) {
          existingSticky.stats.tempo = stickyMalus;
          existingSticky.range[1] = 99;
        } else {
          match.buffLayers.push({
            source: 'skip_malus_sticky',
            range: [match.round, 99],
            stats: { tempo: stickyMalus },
            special: null
          });
        }

        const logEl = document.getElementById('match-log');
        if (logEl) {
          const baseNote = (window.I18N?.t?.('ui.cards.skipMalus')) || 'No cards played — tempo drops.';
          const tierTag = tier === 3 ? ' (severe — 3rd skip)'
                        : tier === 2 ? ' (compounding — 2nd skip)'
                        : '';
          logEl.appendChild(el('div', { class: logLineClass('card-summary dim') }, [
            '└ ' + baseNote + tierTag
          ]));
          logEl.scrollTop = logEl.scrollHeight;
        }
      }
    } catch (_) { /* safety: never block the round */ }

    // End-of-round summary: diff buffs from card-phase-start vs now.
    // Lists how many cards were played this round and the net stat impact,
    // so the player sees cause/effect without staring at hidden state.
    try {
      const played = (match._cardsPlayedThisMatch || [])
        .filter(p => p.round === match.round);
      if (played.length > 0) {
        const startBuffs = match._cardPhaseStartBuffs || {};
        const now = match.teamBuffs || {};
        const LABEL = { offense:'OFF', defense:'DEF', tempo:'TMP', vision:'VIS', composure:'CMP' };
        const parts = [];
        for (const k of ['offense','defense','tempo','vision','composure']) {
          const d = (now[k] || 0) - (startBuffs[k] || 0);
          if (d !== 0) parts.push(`${LABEL[k]} ${d > 0 ? '+' : ''}${d}`);
        }
        const cardCountLabel = played.length === 1
          ? '1 card'
          : played.length + ' cards';
        const summary = cardCountLabel + (parts.length ? ' · ' + parts.join(' · ') : '');

        const logEl = document.getElementById('match-log');
        if (logEl) {
          logEl.appendChild(el('div', { class: logLineClass('card-summary') }, [
            '└ ' + summary
          ]));
          logEl.scrollTop = logEl.scrollHeight;
        }
      }
    } catch (_) { /* summary is nice-to-have, never block the round */ }

    // Discard whatever is left in hand.
    if (window.KL?.cards) window.KL.cards.discardHand(state);

    if (box) box.classList.remove('active');
    const resolve = UI._cardPhaseEndResolve;
    UI._cardPhaseEndResolve = null;
    UI._cardPhaseMatch = null;
    UI._cardPhaseState = null;
    if (typeof resolve === 'function') resolve();
  },

  renderCardPhase() {
    const match = UI._cardPhaseMatch;
    const state = UI._cardPhaseState;
    if (!match || !state) return;

    UI.renderActiveFrame(match);
    UI.renderEnergy(match);
    UI.renderDeckCounts(state);
    UI.renderCardTags(match);
    UI.renderOppIntent(match);
    UI.renderStatDiffChips(match);
    UI.renderFatigueWarning(match);
    UI.renderHand(match, state);
    UI.updateMatchCardState(match);   // sync persistent header badge
    // v52.5 — UI.updateActiveEffects removed: the #match-active-effects
    // chip row was deleted and its state surfaces via log lines now.

    // v52.7 — Mulligan visibility re-check on every render. The initial
    // gate in showCardPhase only runs once per round-start and didn't
    // catch "card was played → mulligan must hide". Now: button vanishes
    // the moment any card is committed, mirroring the JS-layer guard in
    // useMulligan.
    const mulliganBtn = document.getElementById('cp-mulligan-btn');
    if (mulliganBtn) {
      const playsThisMatch = match._cardsPlayedThisMatch?.length || 0;
      const canMulligan = (match.round || 1) === 1
        && !match._mulliganUsed
        && playsThisMatch === 0;
      mulliganBtn.style.display = canMulligan ? '' : 'none';
    }
  },

  // Fatigue warning bar — surfaces any starter below 40 condition in
  // a compact inline banner above the hand. Tells the player WHERE
  // the fatigue is biting, so they can plan around it (Breather,
  // avoiding condition-gated power cards, considering Rotation).
  // Empty (hidden) when no starter is below the threshold.
  renderFatigueWarning(match) {
    let box = document.getElementById('cp-fatigue-warning');
    if (!box) {
      // Create lazily the first time — inserted before #card-hand.
      const hand = document.getElementById('card-hand');
      if (!hand || !hand.parentNode) return;
      box = document.createElement('div');
      box.id = 'cp-fatigue-warning';
      box.className = 'cp-fatigue-warning';
      hand.parentNode.insertBefore(box, hand);
    }
    const squad = match?.squad || [];
    // v0.38 — Threshold raised from <40 to <30. At <50 the -3 stat malus
    // kicks in, at <25 it's -6. Showing the warning row at <40 meant it
    // lit up for normal mid-match wear that the per-card chips already
    // cover. At <30 the warning only fires for players actually in or
    // approaching the danger zone, so the row earns its screen space.
    // Keeper stays excluded — they don't pay fatigue and can't be subbed
    // like outfield players.
    const tired = squad
      .filter(p => typeof p.condition === 'number' && p.condition < 30 && p.role !== 'TW')
      .sort((a, b) => a.condition - b.condition);
    if (tired.length === 0) {
      box.style.display = 'none';
      box.innerHTML = '';
      return;
    }
    box.style.display = '';
    box.innerHTML = '';
    const label = document.createElement('span');
    label.className = 'cp-fatigue-label';
    label.textContent = '💨 FATIGUE';
    box.appendChild(label);
    for (const p of tired) {
      const chip = document.createElement('span');
      const tier = p.condition < 20 ? 'critical' : p.condition < 25 ? 'heavy' : 'moderate';
      chip.className = 'cp-fatigue-chip tier-' + tier;
      // v0.38 — role label uses UI.roleAbbr (GK/DF/PM/WG/ST) to match
      // the rest of the UI; previously showed the internal TW/VT/PM/LF/ST
      // codes. Lastname-only keeps the chip compact in crowded hands.
      const roleLabel = UI.roleAbbr(p.role) || p.role;
      const lastName  = (p.name || '?').split(' ').slice(-1)[0];
      chip.textContent = `${roleLabel} ${lastName} · ${Math.round(p.condition)}`;
      chip.title = `${p.name} (${roleLabel}) — condition ${Math.round(p.condition)}. Power cards for this role may be locked. Consider Breather or Rotation.`;
      box.appendChild(chip);
    }
  },

  // Inline situation banner: replaces old modal events. Shows icon, title,
  // narrative text, mechanical effect, and a hint pointing at the card
  // archetype that addresses this frame. No user interaction — the card
  // play itself is the response.
  renderActiveFrame(match) {
    const box = document.getElementById('cp-frame');
    if (!box) return;
    box.innerHTML = '';
    box.classList.remove('sev-warn', 'sev-good', 'sev-danger', 'sev-opportunity');

    const frame = match?._activeFrame;
    if (!frame) { box.style.display = 'none'; return; }

    // v52.8 — Opportunity-class frames (sev-opportunity) no longer render
    // as a banner box; they emit a log line instead. They were big visual
    // interrupts that competed with the actual cards in hand for attention,
    // and an "exploit it" advisory reads better as a log beat than as a
    // pinned panel that lingers all round. Danger / warn / good frames
    // STILL render as banners since they communicate immediate state the
    // player must respond to. Dedup via _frameLoggedKeys so a frame that
    // re-resolves on a re-render doesn't spam duplicate lines.
    if (frame.severity === 'opportunity') {
      box.style.display = 'none';
      const dedupKey = (frame.title || '') + '@r' + (match.round || 0);
      match._frameLoggedKeys = match._frameLoggedKeys || new Set();
      if (!match._frameLoggedKeys.has(dedupKey)) {
        match._frameLoggedKeys.add(dedupKey);
        const logEl = document.getElementById('match-log');
        if (logEl) {
          const parts = [];
          parts.push((frame.icon || '⚡') + ' ' + (frame.title || '').toUpperCase());
          if (frame.text)   parts.push('— ' + frame.text);
          if (frame.effect) parts.push('· ' + frame.effect);
          if (frame.hint)   parts.push('↳ ' + frame.hint);
          logEl.appendChild(el('div', { class: logLineClass('trigger') },
            [parts.join(' ')]));
          logEl.scrollTop = logEl.scrollHeight;
        }
      }
      return;
    }

    box.style.display = '';
    box.classList.add('sev-' + (frame.severity || 'warn'));

    // Hover tooltip — only the severity meaning so the box doesn't
    // double up on text that's already visible inside it. The hint
    // and effect already render in the .frame-meta row below.
    const sevWord = frame.severity === 'danger'      ? 'DANGER — active threat'
                  : frame.severity === 'good'        ? 'GOOD — positive momentum'
                  :                                     'WARN — keep an eye on this';
    box.setAttribute('title', 'A situation has arisen this match.\n\n' + sevWord);

    const header = el('div', { class: 'frame-head' }, [
      el('span', { class: 'frame-icon' }, [frame.icon || '⚡']),
      el('span', { class: 'frame-title' }, [frame.title || ''])
    ]);
    box.appendChild(header);

    if (frame.text) {
      box.appendChild(el('div', { class: 'frame-text' }, [frame.text]));
    }

    const meta = el('div', { class: 'frame-meta' });
    if (frame.effect) {
      meta.appendChild(el('span', { class: 'frame-effect' }, [frame.effect]));
    }
    if (frame.hint) {
      meta.appendChild(el('span', { class: 'frame-hint' }, ['↳ ' + frame.hint]));
    }
    box.appendChild(meta);
  },

  renderEnergy(match) {
    const box = document.getElementById('cp-energy');
    if (!box) return;
    box.innerHTML = '';
    const cap = window.KL?.config?.CONFIG?.energyPerRound || 3;
    const left = match._cardEnergy || 0;
    // Label + pips + count. Pips still communicate visually; the count makes
    // the meaning unambiguous.
    box.appendChild(el('span', { class: 'cp-energy-label' }, [I18N.t('ui.cards.energyLabel') || 'ENERGY']));
    const pipsWrap = el('span', { class: 'cp-pips' });
    for (let i = 0; i < cap; i++) {
      const filled = i < left;
      pipsWrap.appendChild(el('span', {
        class: 'cp-pip' + (filled ? ' filled' : '')
      }));
    }
    box.appendChild(pipsWrap);
    box.appendChild(el('span', { class: 'cp-energy-count' }, [`${left}/${cap}`]));
  },

  renderDeckCounts(state) {
    // Format: "🂠 2  ·  🗑 4" — icon first, value prominent, label dim.
    // We keep the DOM nodes the engine already has (cp-deck-count,
    // cp-discard-count) and just re-style around them.
    // v52.1: the card-box readouts were functional but opaque — players
    // report "feels like the deck never empties" because the reshuffle
    // from discard happens silently inside drawCards(). Tooltips now
    // explain the mechanic; a brief flash when state._deckJustReshuffled
    // fires surfaces the moment visually.
    const d = document.getElementById('cp-deck-count');
    const dd = document.getElementById('cp-discard-count');
    if (d)  d.textContent  = (state._cardDeck    || []).length;
    if (dd) dd.textContent = (state._cardDiscard || []).length;

    // Parent .cp-count wrappers get the hover tooltips.
    const deckWrap = d?.parentElement;
    const discWrap = dd?.parentElement;
    if (deckWrap && !deckWrap._tooltipBound) {
      deckWrap.title = I18N.t('ui.cards.deckTooltip')
        || 'Deck — cards yet to be drawn. When it empties, the discard pile reshuffles into a new deck (standard deckbuilder loop).';
      deckWrap._tooltipBound = true;
    }
    if (discWrap && !discWrap._tooltipBound) {
      discWrap.title = I18N.t('ui.cards.discardTooltip')
        || 'Discard — cards already played or discarded this match. Reshuffles back into the deck when the deck runs dry.';
      discWrap._tooltipBound = true;
    }

    // Reshuffle flash — drawCards sets _deckJustReshuffled after merging
    // discard → deck. Pulse the deck chip so the player sees the moment.
    if (state._deckJustReshuffled && deckWrap) {
      deckWrap.classList.remove('cp-reshuffle-flash');
      // Force reflow so re-adding the class restarts the animation.
      void deckWrap.offsetWidth;
      deckWrap.classList.add('cp-reshuffle-flash');
      state._deckJustReshuffled = false;
    }
  },

  // Persistent Flow / Lane indicator in the match header. Visible
  // throughout the match, including between rounds when the card panel
  // is collapsed. Hidden entirely when cards are disabled.
  updateMatchCardState(match) {
    const box = document.getElementById('match-card-state');
    if (!box) return;
    const cfg = window.CONFIG || window.KL?.config?.CONFIG;
    if (!cfg?.cardsEnabled || !match) { box.style.display = 'none'; return; }

    const flow = match._cardFlow || 0;
    const laneOpen = !!match._cardLaneOpen;

    box.style.display = '';
    box.innerHTML = '';

    const flowEl = el('span', {
      class: 'mcs-chip mcs-flow' + (flow === 0 ? ' dim' : ''),
      title: 'Flow: set up with Setup cards, spend on Triggers & Combos.'
    }, ['⚡ ' + flow]);
    box.appendChild(flowEl);

    const laneEl = el('span', {
      class: 'mcs-chip mcs-lane' + (laneOpen ? '' : ' dim'),
      title: 'Lane Open: unlocks lane-consuming cards.'
    }, [laneOpen ? '◈ OPEN' : '◇ —']);
    box.appendChild(laneEl);

    // Team condition chip — avg condition across the starting five, with
    // color coding for fatigue. Shows min-condition player name in the
    // tooltip so the player knows WHO to target with Breather/Rotation.
    const squad = match.squad || [];
    const scored = squad.filter(p => typeof p.condition === 'number');
    if (scored.length > 0) {
      const avg = Math.round(scored.reduce((s, p) => s + p.condition, 0) / scored.length);
      const minP = scored.reduce((a, b) => (a.condition < b.condition ? a : b));
      let tone = 'good';
      if (minP.condition < 25) tone = 'critical';
      else if (minP.condition < 50 || avg < 60) tone = 'warn';
      else if (avg < 80) tone = 'neutral';

      const brk = scored
        .map(p => (p.name || p.role) + ': ' + p.condition)
        .join(' · ');
      const condEl = el('span', {
        class: 'mcs-chip mcs-cond mcs-cond-' + tone,
        title: 'Team condition (avg). Lowest: ' + (minP.name || minP.role) +
               ' at ' + minP.condition + '. Breakdown: ' + brk
      }, ['🫁 ' + avg]);
      box.appendChild(condEl);
    }

    // Active card effects — badges for multi-round, pending, sticky effects
    // so the player sees what's still ticking and what just resolved.
    const effects = match._activeCardEffects || [];
    for (const e of effects) {
      const chip = el('span', {
        class: 'mcs-effect mcs-effect-' + (e.status || 'active') + ' mcs-effect-type-' + e.type,
        title: (e.label ? e.label + ' · ' : '') + (e.note || '')
      });
      chip.appendChild(el('span', { class: 'mce-icon' }, [e.icon || '●']));
      let tail = '';
      if (e.status === 'success') tail = '✓';
      else if (e.status === 'failed') tail = '✗';
      else if (e.status === 'expired') tail = '—';
      else if (e.type === 'multi' && e.duration > 0) tail = e.duration + 'R';
      else if (e.type === 'pending') tail = '…';
      else if (e.type === 'sticky') tail = '∞';
      if (tail) chip.appendChild(el('span', { class: 'mce-tail' }, [tail]));
      box.appendChild(chip);
    }

    if (effects.some(e => e.status !== 'active')) {
      setTimeout(() => {
        if (window.KL?.cards?.pruneResolvedEffects) {
          window.KL.cards.pruneResolvedEffects(match);
          UI.updateMatchCardState(match);
        }
      }, 1800);
    }
  },

  // v52.5 — updateActiveEffects removed along with the #match-active-effects
  // chip row. The same information now appears as log lines (see the
  // appendAeLog helper below — it emits a muted log entry whenever the
  // underlying card flags transition). Callers in flow.js and renderCardPhase
  // were stripped in the same pass.

  // Helper: emits a one-shot log line for each persistent card outcome,
  // deduped via a session Set stored on the match so the same "BAIT ARMED"
  // or "THREAT DEFUSED" line doesn't spam every render tick.
  appendAeLog(match, key, cls, msg) {
    if (!match) return;
    match._aeLogged = match._aeLogged || new Set();
    if (match._aeLogged.has(key)) return;
    match._aeLogged.add(key);
    const logEl = document.getElementById('match-log');
    if (!logEl) return;
    logEl.appendChild(el('div', { class: logLineClass(cls || 'dim') }, [msg]));
    logEl.scrollTop = logEl.scrollHeight;
  },

  renderCardTags(match) {
    const box = document.getElementById('cp-tags');
    if (!box) return;
    box.innerHTML = '';
    const flow = match._cardFlow || 0;
    const laneOpen = !!match._cardLaneOpen;
    const press = match._cardPressResist || 0;

    // Flow ALWAYS visible — even at 0 — so the concept is legible for
    // new players and the state stays readable during turn transitions.
    // Dimmed when inactive, highlighted when stacked.
    const flowChip = el('span', {
      class: 'cp-tag cp-tag-flow' + (flow === 0 ? ' dim' : ''),
      title: I18N.tOr('ui.cards.flowHint', 'Setup cards add Flow. Triggers and Combos consume it for big payoffs.')
    }, ['FLOW ×' + flow]);
    box.appendChild(flowChip);

    // Lane Open: always shown, even closed, so players see it as a slot.
    const laneChip = el('span', {
      class: 'cp-tag cp-tag-lane' + (laneOpen ? '' : ' dim'),
      title: I18N.tOr('ui.cards.laneHint', 'Lane Open unlocks lane-consuming cards for a big offensive kicker.')
    }, [laneOpen ? 'LANE OPEN' : 'LANE —']);
    box.appendChild(laneChip);

    // Press Resist stays conditional — it's a niche tag, not a core resource.
    if (press > 0) {
      box.appendChild(el('span', {
        class: 'cp-tag cp-tag-press',
        title: I18N.tOr('ui.cards.pressHint', 'Press Resist soaks opponent press pressure — blunts their defense-bonus this round.')
      }, [`PRESS RESIST ${press}`]));
    }
  },

  // Opp-intent preview: one trait "loaded" per round, driven by
  // Estimate goal-EV for a card given current match state. Combines:
  //   (a) base goal impact from the card's stats + direct-action type
  //       (values derived from Monte-Carlo analysis in balance audit)
  //   (b) current phase-affinity multiplier
  //   (c) active micro-event bonus if applicable
  // Returns null for cards with no goal-relevant output (pure setups,
  // pure defense cards).
  estimateCardGoalEV(def, match) {
    if (!def || !match) return null;

    // Base EV table — from balance audit Monte Carlo. Values are
    // *expected goals added to a match* when the card plays against
    // a neutral opp baseline. Setup-only cards not listed = 0.
    const BASE_EV = {
      hope_shot:       0.20,
      long_ball:       0.36,
      quick_build:     0.32,
      tight_shape:     0.84,   // defense goal-prevention EV
      hold_the_line:   0.35,
      keeper_rush:     0.55,
      overlap_run:     1.18,
      forward_burst:   1.19,
      hero_moment:     1.45,
      wing_trap:       1.22,
      masterclass:     2.05,
      clinical_finish: 1.38,
      desperate_foul:  1.22,
      stone_cold:      2.21,
      killing_blow:    1.96,
      block:           1.40,
      preempt:         1.80,
      through_ball:    0.58,
      dig_deep:        1.00,
      burn_plan:       1.06,
      running_hot:     1.35,
      gegenpress:      1.21,
      counter_strike:  1.20,
      tide_turner:     0.88,
      ride_the_wave:   1.15,
      ball_recovery:   0.42,
      storm_warning:   0.60
    };
    const base = BASE_EV[def.id] || 0;
    if (base === 0) return null;

    // Phase affinity multiplier — reads the same table cards.js uses.
    const getPhase = window.KL?.cards?.getPhaseAffinity;
    const phaseMult = getPhase ? getPhase(def.type, match.matchPhase || 'buildup') : 1.0;

    // Active micro-event bonus estimate. If a corner window is open and
    // this card has a direct-action that'd match, estimate +30% on its
    // goal-action component (roughly half of total EV is direct action).
    let eventBonus = 0;
    if (match._cornerPending) {
      // Cards with extraShot/throughBall/cross/scrappyGoal DA types benefit
      const boostedIds = ['hope_shot','long_ball','overlap_run','forward_burst','hero_moment','clinical_finish','stone_cold','masterclass','killing_blow','dig_deep','burn_plan','running_hot','through_ball','ride_the_wave'];
      if (boostedIds.includes(def.id)) eventBonus = base * 0.20;
    }
    if (match._counterPressWindow && (match.round || 0) <= match._counterPressWindow) {
      if (['gegenpress','counter_strike','ball_recovery','preempt'].includes(def.id)) {
        eventBonus = Math.max(eventBonus, base * 0.18);
      }
    }
    if (match._oneOnOnePending) {
      if (['stone_cold','clinical_finish','hero_moment','masterclass','killing_blow'].includes(def.id)) {
        eventBonus = Math.max(eventBonus, base * 0.22);
      }
    }

    const ev = Math.max(0, (base * phaseMult) + eventBonus);
    return { ev, base, phaseMult, eventBonus };
  },

  // Pure builder — returns a DOM element with the stat-diff chip strip
  // (phase chip + 5 stat chips). Used by renderStatDiffChips (live card
  // phase) AND by renderTeamStatsPanel (decision modals). Centralising
  // here keeps both in visual sync: swap the chip rendering and both
  // update. v52.1 added when decision modals switched from the wide
  // own/diff/opp table to the same chip form.
  buildStatDiffChipsEl(match) {
    if (!match || !match.squad || !match.opp) return null;

    const squad = match.squad;
    const opp = match.opp;

    const totals = { offense: 0, defense: 0, tempo: 0, vision: 0, composure: 0 };
    for (const p of squad) {
      const s = (typeof computePlayerStats === 'function')
        ? computePlayerStats(p, match) : (p.stats || {});
      for (const k of Object.keys(totals)) totals[k] += (s[k] || 0);
    }
    for (const k of Object.keys(totals)) totals[k] = Math.round(totals[k] / squad.length);

    const oppLive = { ...opp.stats };
    const rb = opp._roundBuffs || {};
    for (const k of Object.keys(oppLive)) oppLive[k] += (rb[k] || 0);

    const LABELS = { offense: 'OFF', defense: 'DEF', tempo: 'TMP', vision: 'VIS', composure: 'CMP' };
    const stats = Object.keys(totals).map(k => ({
      stat: k,
      me: totals[k],
      opp: oppLive[k] || 0,
      diff: totals[k] - (oppLive[k] || 0)
    }));

    const strip = el('div', { class: 'cp-stat-diffs' });

    // Phase chip first — leading element, communicates current match phase.
    const phase = match.matchPhase || 'buildup';
    const PHASE_LABELS = {
      buildup:    'BUILD',
      possession: 'POSS',
      transition: 'TRANS',
      attack:     'ATTACK',
      recovery:   'RECOVER',
      defensive:  'DEF PHASE'
    };
    const PHASE_HINTS = {
      buildup:    'Build-up — no modifiers. Standard play.',
      possession: 'Possession — setups +20%, triggers weaker.',
      transition: 'Transition — triggers +25%, counters +20%.',
      attack:     'Attack — combos +30%, defenses weaker.',
      recovery:   'Recovery — we lost the ball, counters +25%, offense weaker.',
      defensive:  'Defensive — defenses +25%, offense weaker.'
    };
    strip.appendChild(el('span', {
      class: 'sd-chip phase phase-' + phase,
      title: PHASE_HINTS[phase]
    }, [
      el('span', { class: 'sd-label' }, ['PHASE']),
      el('span', { class: 'sd-val' }, [PHASE_LABELS[phase]])
    ]));

    // v53 — Clock im Match-HUD-Oben synchron halten. Der Clock liest
    // match.matchPhase live, aber nur bei Log-Events oder Round-Change —
    // zwischen dem Round-Start-Reset und dem ersten neuen Log konnte
    // ein Mismatch entstehen (cp-Chip zeigt 'build', Clock noch 'attack'
    // aus der Vorrunde). refresh() ruft updateClockUi erneut auf; damit
    // lesen beide aus derselben Snapshot-Sekunde.
    if (window.KL?.matchHud?.refresh) {
      try { window.KL.matchHud.refresh(); } catch (_) { /* nice-to-have */ }
    }

    // Stat chips — ME value · OPP value, colored by who leads.
    for (const d of stats) {
      const tone = d.diff > 0 ? 'pos' : d.diff < 0 ? 'neg' : 'zero';
      strip.appendChild(el('span', {
        class: 'sd-chip stat ' + tone,
        title: LABELS[d.stat] + ': team ' + d.me + ' vs opp ' + d.opp + ' (diff ' + (d.diff > 0 ? '+' : '') + d.diff + ')'
      }, [
        el('span', { class: 'sd-label' }, [LABELS[d.stat]]),
        el('span', { class: 'sd-me' }, [String(d.me)]),
        el('span', { class: 'sd-sep' }, ['·']),
        el('span', { class: 'sd-opp' }, [String(d.opp)])
      ]));
    }

    return strip;
  },

  // Compact stat-diff strip in the card phase — shows top stat gaps
  // between my live team totals and the opp, styled like the hub
  // matchup scorecard. Each chip shows ME value + OPP value + delta
  // so the player sees absolute stats AND the gap at a glance.
  renderStatDiffChips(match) {
    const box = document.getElementById('cp-stat-diffs');
    if (!box) return;
    box.innerHTML = '';
    const strip = UI.buildStatDiffChipsEl(match);
    if (!strip) { box.style.display = 'none'; return; }
    box.style.display = '';
    // Move all children from the freshly-built strip into the live
    // container so we don't disrupt the existing ID-bound DOM node.
    while (strip.firstChild) box.appendChild(strip.firstChild);
  },

  // Opp-Intent chip — shows what trait the opp is about to trigger.
  // KL.cards.pickOppIntent which priorities by round-fit + freshness.
  // The severity (1-3) drives visual urgency — darker red for higher threat.
  // When severity >= 2 AND not already absorbed, the intent is TELEGRAPHED:
  // Block or Pre-empt can punish it hard.
  //
  // v0.56 — Banner shape compressed. Pre-fix layout was pin + label +
  // sev-dots + verb-phrase + name + dash + description, which routinely
  // wrapped to two lines on the match screen and competed with the log
  // for vertical space. Verb-phrase and description now live in the
  // tooltip; the inline banner stays one tight row: 📌 OPP THREAT  ●●○
  //   Quick Strike   [TELEGRAPHED]. Long-form context (sev meaning,
  // setup verb, full description, telegraph/absorb explanation) is
  // accessed by hover, where it has room.
  renderOppIntent(match) {
    const box = document.getElementById('cp-intent');
    if (!box) return;
    box.innerHTML = '';
    box.classList.remove('sev-1', 'sev-2', 'sev-3', 'telegraphed', 'absorbed');

    const intent = window.KL?.cards?.pickOppIntent?.(match);
    if (!intent) return;

    const absorbed = match._oppIntentAbsorbed && match._oppIntentAbsorbed === intent.id;
    const telegraphed = !absorbed && intent.severity >= 2;

    box.classList.add('sev-' + intent.severity);
    if (telegraphed) box.classList.add('telegraphed');
    if (absorbed)    box.classList.add('absorbed');

    // Variant setup-verb — moved to tooltip in v0.56 since it doesn't
    // affect mechanics, just adds flavor. Deterministic via round +
    // intent.id hash so the wording is stable WITHIN a round (re-render
    // doesn't flicker) but varies across rounds/matches.
    const VERB_POOL = I18N.list && I18N.list('ui.cards.oppIntentVerbs');
    let verbPhrase = '';
    if (VERB_POOL && VERB_POOL.length) {
      const r = match.round || 1;
      const hash = (r * 31 + intent.id.length * 17) % VERB_POOL.length;
      verbPhrase = VERB_POOL[hash];
    }

    // Tooltip carries the long-form context that no longer renders inline.
    const sevDesc = intent.severity === 3 ? 'SEVERE threat — high impact'
                  : intent.severity === 2 ? 'Moderate threat — worth a counter'
                  :                          'Low threat — can be ignored';
    const headerKey = 'ui.cards.oppIntentTooltipHeader';
    const headerRaw = I18N.t(headerKey);
    const header = (headerRaw === headerKey)
      ? 'Opponent has loaded a trait to fire this round.'
      : headerRaw;
    const titleParts = [header];
    if (verbPhrase) titleParts.push('"' + verbPhrase + ' ' + intent.name + '"');
    if (intent.desc) titleParts.push('— ' + intent.desc);
    titleParts.push('');  // blank line before mechanical info
    titleParts.push('Severity: ' + sevDesc);
    if (telegraphed) {
      titleParts.push('⚠ Telegraphed (sev ≥ 2): a Block or Preempt card neutralizes it.');
    }
    if (absorbed) {
      titleParts.push('✓ Absorbed: a Counter card already defused this threat.');
    }
    box.setAttribute('title', titleParts.join('\n'));

    // Inline banner: pin, label, sev dots, name, optional tag — that's it.
    const label = I18N.t('ui.cards.oppIntent') || 'OPP THREAT';
    const sevDots = '●'.repeat(intent.severity) + '○'.repeat(3 - intent.severity);

    box.appendChild(el('span', { class: 'cp-intent-pin', 'aria-hidden': 'true' }, ['📌']));
    box.appendChild(el('span', { class: 'cp-intent-label' }, [label]));
    box.appendChild(el('span', {
      class: 'cp-intent-sev',
      title: 'Severity ' + intent.severity + '/3 — ' + sevDesc
    }, [sevDots]));
    box.appendChild(el('span', { class: 'cp-intent-name' }, [intent.name]));
    if (telegraphed) {
      box.appendChild(el('span', { class: 'cp-intent-tag' },
        [I18N.t('ui.cards.telegraphed') || 'TELEGRAPHED']));
    }
    if (absorbed) {
      box.appendChild(el('span', { class: 'cp-intent-tag absorbed' },
        [I18N.t('ui.cards.absorbed') || 'DEFUSED']));
    }
  },

  renderHand(match, state) {
    const hand = state._cardHand || [];
    const handBox = document.getElementById('card-hand');
    if (!handBox) return;
    handBox.innerHTML = '';

    if (!hand.length) {
      handBox.appendChild(el('div', { class: 'hand-empty' },
        [I18N.t('ui.cards.handEmpty')]));
      return;
    }

    hand.forEach((cardId, idx) => {
      const cardEl = UI.buildHandCard(cardId, idx, match, state);
      handBox.appendChild(cardEl);
    });
  },

  buildHandCard(cardId, handIndex, match, state) {
    const K = window.KL.cards;
    const def = K.getCardDef(cardId);
    if (!def) return el('div', { class: 'hand-card error' }, ['?']);

    const playable = K.canPlay(state, match, cardId);
    const synergy  = K.synergyStatus(state, match, cardId);
    const payoff   = K.payoffStatus ? K.payoffStatus(state, match, cardId) : { full: true, missing: null };

    const classes = ['hand-card', 'rarity-' + def.rarity, 'type-' + def.type];
    if (!playable) classes.push('unplayable');
    // Soft-disconnect: playable but needs not met → payoff is weak.
    // A muted-orange tint + a small badge make this visible before play.
    if (playable && !payoff.full) classes.push('soft-disconnect');
    if (synergy.glow) classes.push('glow', 'glow-' + synergy.reason);

    const nameKey = 'ui.cards.' + def.id + '.name';
    const descKey = 'ui.cards.' + def.id + '.desc';
    const typeLabel = I18N.t('ui.cards.types.' + def.type);

    // Cost is now shown as energy pips at the bottom-left, echoing the
    // top-bar energy display. Same visual language, smaller scale, so a
    // card's cost reads at a glance in the same vocabulary as what you
    // have left. Zero-cost cards show a single empty pip.
    const costPips = el('div', { class: 'hc-cost-pips' });
    const n = Math.max(1, def.cost);
    for (let i = 0; i < n; i++) {
      costPips.appendChild(el('span', { class: 'hc-pip' + (def.cost > 0 ? ' filled' : '') }));
    }

    // Type-hover explanation — surfaces what a "Setup" or "Combo"
    // actually does for players not familiar with the card-game idiom.
    const TYPE_HINT = {
      setup:   'Setup: generates Flow or unlocks lanes for later payoffs.',
      trigger: 'Trigger: fires a mechanical effect. Often consumes Flow.',
      combo:   'Combo: needs conditions (Flow/Lane Open) for full effect.',
      defense: 'Defense: protects backline and keeper.',
      counter: 'Counter: punishes telegraphed opp threats.'
    };

    // Goal-EV chip — expected-goals strength indicator as 1-3 stars
    // (★ / ★★ / ★★★) based on current match state (phase affinity +
    // active micro-event window). NOT shown when the card is in
    // soft-disconnect state (⏸ FLOW/LANE badge takes priority — the
    // listed EV would be misleading since the card plays at base
    // effect only). Tooltip gives the exact expected-goals number.
    let evInlineChip = null;
    const softDisconnect = playable && !payoff.full;
    if (!softDisconnect) {
      const evData = UI.estimateCardGoalEV(def, match);
      if (evData && evData.ev >= 0.3) {
        let evTone, evLabel;
        if (evData.ev >= 1.5)      { evTone = 'ev-strong'; evLabel = '★★★'; }
        else if (evData.ev >= 0.8) { evTone = 'ev-med';    evLabel = '★★';  }
        else                        { evTone = 'ev-low';    evLabel = '★';   }
        const evTitle = 'Expected goal impact: ~' + evData.ev.toFixed(2) + ' goals'
          + (evData.phaseMult !== 1.0 ? '\nPhase affinity: ×' + evData.phaseMult.toFixed(2) : '')
          + (evData.eventBonus ? '\nActive event bonus: +' + evData.eventBonus.toFixed(2) : '')
          + '\n\nNOT a probability — this is expected goals impact this match.'
          + '\n★★★ ≥ 1.5 · ★★ ≥ 0.8 · ★ ≥ 0.3';
        evInlineChip = el('span', {
          class: 'hc-ev-chip ' + evTone,
          title: evTitle
        }, [evLabel]);
      }
    }

    const hcTypeRow = el('div', { class: 'hc-type-row' }, [
      el('div', { class: 'hc-type', title: TYPE_HINT[def.type] || '' }, [typeLabel]),
      evInlineChip
    ]);

    // Upgrade indicator — "+" appended to the card name if this card
    // has been upgraded (state._cardUpgrades map). Persists across
    // matches. Tooltipped to explain the +25% bonus.
    const isUpgraded = !!(state?._cardUpgrades?.[cardId]);
    const displayName = I18N.t(nameKey) + (isUpgraded ? '+' : '');
    const nameEl = el('div', { class: 'hc-name' + (isUpgraded ? ' upgraded' : '') }, [displayName]);
    if (isUpgraded) nameEl.setAttribute('title', 'Upgraded — +25% stat effect.');

    const card = el('div', { class: classes.join(' ') + (isUpgraded ? ' upgraded' : '') }, [
      hcTypeRow,
      nameEl,
      el('div', { class: 'hc-desc' }, [UI.resolveCardDescription(def.id, match)]),
      costPips
    ]);

    // Soft-disconnect badge — appears in the top-right corner when
    // the card is playable but its needs aren't met.
    if (playable && !payoff.full) {
      const badgeLabel = payoff.missing === 'flow' ? '⏸ FLOW'
                       : payoff.missing === 'lane' ? '⏸ LANE'
                       : payoff.missing === 'both' ? '⏸ FLOW+LANE'
                       : '⏸';
      const badgeTitle = payoff.missing === 'flow'
        ? 'Needs more Flow — plays at base effect only.'
        : payoff.missing === 'lane'
          ? 'Lane not open — plays at base effect only.'
          : 'Needs Flow AND Lane — plays at base effect only.';
      card.appendChild(el('div', { class: 'hc-disconnect-badge', title: badgeTitle }, [badgeLabel]));
    }

    // Retain badge — appears bottom-right for cards with the 'retain'
    // tag. Signals "this card stays in hand at round end if unplayed,"
    // enabling power-card stockpiling for the right moment.
    if ((def.tags || []).includes('retain')) {
      card.appendChild(el('div', {
        class: 'hc-retain-badge',
        title: 'Retain — stays in hand at round end if unplayed.'
      }, ['⚓']));
    }

    // Fatigue cost chip — bottom-right of card, red-tinted. Shows how
    // much condition this card will drain on which starter when played.
    // Helps the player plan around the fatigue economy instead of being
    // surprised when their star runs out of gas in round 5.
    //
    // The chip surfaces two things that were previously hidden in tooltips:
    //   (1) WHO is the target's current condition, right on the card, so
    //       the player can see at a glance that "yes, my ST is the one
    //       paying this, and he's already at 32/100".
    //   (2) The post-cost severity tier (tinted chip: neutral / warn /
    //       danger). Matches the 50 / 25 condition thresholds that
    //       trigger the -3 / -6 stat penalties in the engine.
    // The detailed escalation-math and resource-advice stay in the
    // tooltip to keep the on-card footprint small.
    const fatigueCost = window.KL?.cards?.getFatigueCost?.(match, cardId);
    if (fatigueCost && fatigueCost.amount > 0) {
      // Look up the target's live condition to project post-play state.
      const targetPlayer = (match?.squad || []).find(p => p.name === fatigueCost.playerName);
      const currentCond = typeof targetPlayer?.condition === 'number'
        ? Math.round(targetPlayer.condition) : null;
      const projectedCond = currentCond != null
        ? Math.max(0, currentCond - fatigueCost.amount) : null;
      // Severity tiers mirror engine thresholds (stats.js):
      //   <25  → heavy penalty (-6 per stat)   → danger
      //   <50  → mild penalty (-3 per stat)    → warn
      //   else → no penalty                    → neutral
      let severity = 'neutral';
      if (projectedCond != null) {
        if (projectedCond < 25)      severity = 'danger';
        else if (projectedCond < 50) severity = 'warn';
      }

      // Show escalation delta when this isn't the first card of the
      // round. getFatigueCost already bakes in the +2 per prior play,
      // but the player can't tell WHERE the number comes from. A small
      // parenthetical signals "this number is inflated because you're
      // chain-casting".
      const cardsThisRound = match?._cardsThisRound || 0;
      const baseAmount = fatigueCost.amount - (cardsThisRound > 0 ? cardsThisRound * 2 : 0);
      const escalationHint = (cardsThisRound > 0 && baseAmount > 0)
        ? ` (base ${baseAmount} +${cardsThisRound * 2})` : '';

      const chipTitle =
        `Plays cost ${fatigueCost.amount} condition on `
        + (fatigueCost.playerName || '?')
        + (fatigueCost.role ? ` (${UI.roleAbbr(fatigueCost.role)})` : '')
        + (currentCond != null ? `. Currently at ${currentCond}/100` : '')
        + (projectedCond != null ? `, will drop to ${projectedCond}` : '')
        + escalationHint + '.'
        + ' Manage fatigue — heavy card-play tires your squad faster.'
        + ' Starters with condition under 50 lose 3 points on every stat;'
        + ' under 25 it jumps to 6. Use rest cards (Breather, Rotation,'
        + ' Second Wind) or substitutions to recover.';

      // Compose chip label: role + cost, plus /cond when known so the
      // player sees "ST 32→28" at a glance instead of just "−4 ST".
      // v0.38 — role shown via UI.roleAbbr so the visible abbreviation
      // matches the rest of the UI (GK/DF/PM/WG/ST rather than the
      // internal TW/VT/PM/LF/ST codes).
      const roleTag  = fatigueCost.role ? ' ' + UI.roleAbbr(fatigueCost.role) : '';
      const condSpan = (currentCond != null && projectedCond != null)
        ? ` ${currentCond}→${projectedCond}` : '';
      const chipLabel = '⚡−' + fatigueCost.amount + roleTag + condSpan;

      card.appendChild(el('div', {
        class: 'hc-fatigue-chip hc-fatigue-' + severity,
        title: chipTitle
      }, [chipLabel]));
    }


    // Full description tooltip on the whole card (for unplayable cards
    // that can't be clicked, or readers who want the full text).
    if (!playable) {
      const reason = synergy?.reason || 'unaffordable';
      let reasonText;
      if (reason === 'unaffordable') {
        reasonText = 'Not enough energy.';
      } else if (reason === 'needs_flow') {
        reasonText = 'Needs more Flow.';
      } else if (reason === 'needs_lane') {
        reasonText = 'Needs Lane Open.';
      } else if (reason === 'needs_condition' && synergy?.gate) {
        const g = synergy.gate;
        reasonText = `${g.playerName} (${g.role}) too tired — condition ${g.current}, needs ${g.required}.`;
      } else {
        reasonText = 'Cannot play right now.';
      }
      card.setAttribute('title', reasonText + '\n\n' + UI.resolveCardDescription(def.id, match));
    }

    if (playable) {
      card.addEventListener('click', () => UI.onCardClick(handIndex));
    }

    return card;
  },

  onCardClick(handIndex) {
    const match = UI._cardPhaseMatch;
    const state = UI._cardPhaseState;
    if (!match || !state) return;

    // Pause blocks card play — pause is "I'm thinking," letting cards
    // fire during pause is inconsistent. Lightweight feedback via
    // toast-less log line so the user knows WHY nothing happened.
    if (window.state?._paused) {
      const logEl = document.getElementById('match-log');
      if (logEl) {
        logEl.appendChild(el('div', { class: logLineClass('paused-hint') },
          ['⏸ Resume to play cards.']));
        logEl.scrollTop = logEl.scrollHeight;
      }
      return;
    }

    const cardId = state._cardHand[handIndex];
    const preFlow = match._cardFlow || 0;
    const preLane = !!match._cardLaneOpen;
    // Snapshot team buffs before the play so telemetry can compute the
    // stat delta this card produced. The engine internally tracks its
    // own snapshot but doesn't expose it; keeping an independent copy
    // here is cheap and only runs when telemetry is active.
    const teamBuffsBefore = (window.KL?.telemetry?.isEnabled?.())
      ? { ...(match.teamBuffs || {}) }
      : null;

    const res = window.KL.cards.playCard(state, match, handIndex);
    if (!res) return;

    // Run-level counter — drives the post-run stats panel's
    // "CARDS PLAYED" tile. Survives per-match resets because we keep
    // it on state, not on match.
    if (window.state) {
      window.state._runCardsPlayed = (window.state._runCardsPlayed || 0) + 1;
    }

    const postFlow = match._cardFlow || 0;
    const postLane = !!match._cardLaneOpen;
    const flowDelta = postFlow - preFlow;
    const laneConsumed = preLane && !postLane;

    // ─── Telemetry: card play ────────────────────────────────────────
    // Capture the full "what did this card do" payload. The applyResult
    // the engine returned already has payoff / outcome / fatigue info;
    // we add team-buff deltas and pre/post flow for the balance review.
    if (window.KL?.telemetry?.isEnabled?.()) {
      try {
        const ar = res.applyResult || {};
        const def = window.KL?.cards?.getCardDef?.(cardId) || {};
        window.KL.telemetry.recordCardPlay({
          round:      match.round,
          cardId,
          cardType:   def.type || null,
          cost:       def.cost ?? null,
          energyAfter: match._cardEnergy,
          chainIndex: match._cardsThisRound || null,
          fatigueTarget:         ar.fatigueTarget || null,
          fatigueDrain:          ar.fatigueDrain ?? null,
          fatigueConditionAfter: ar.fatigueConditionAfter ?? null,
          combinedMultiplier: ar.combinedMultiplier ?? 1,
          upgraded:       !!ar.upgraded,
          roleAffinity:   ar.roleAffinity ?? null,
          phaseAffinity:  ar.phaseAffinity ?? null,
          matchPhase:     ar.matchPhase || match.matchPhase || null,
          payoff:         (typeof ar.payoff === 'boolean') ? ar.payoff : null,
          outcome:        ar.outcome || null,
          flowBefore:     preFlow,
          flowAfter:      postFlow,
          chainBonusFired: ar.chainBonusFired || null,
          chainBonusStats: ar.chainBonusStats || null,
          teamBuffsBefore,
          teamBuffsAfter:  { ...(match.teamBuffs || {}) }
        });
      } catch (_) { /* telemetry never crashes a match */ }
    }

    const logEl = document.getElementById('match-log');

    // 1) Narrative line — the main attraction. Evokes the moment in
    //    broadcast-style with the actual player name fired into the slots.
    //    Falls back silently if no flavor template exists for this card.
    const narrative = UI.resolveCardNarrative(cardId, match, res);
    if (logEl && narrative) {
      logEl.appendChild(el('div', { class: logLineClass('card-narrative') },
        [narrative]));
    }

    // 2) Mechanical line — compact audit trail so the player can still
    //    verify the math. Same info as before, just demoted below the
    //    narrative so it feels like the footnote it actually is.
    const cardName = I18N.t('ui.cards.' + cardId + '.name');
    let mechSuffix = '';
    if (flowDelta < 0) mechSuffix += ` · Flow ${flowDelta}`;
    else if (flowDelta > 0) mechSuffix += ` · Flow +${flowDelta}`;
    if (laneConsumed) mechSuffix += ' · Lane consumed';
    if (res.applyResult?.payoff === true) mechSuffix += ' · ✨ payoff';
    if (res.applyResult?.payoff === false) mechSuffix += ' · base effect';
    if (res.applyResult?.outcome) mechSuffix += ' · ' + res.applyResult.outcome;

    if (logEl) {
      // v53 — Kartentyp als zusätzliche Klasse ans Log-Element hängen,
      // damit der Match-HUD-Klassifikator bestimmte Typen (counter) auf
      // den Stripe ziehen kann, ohne auf dem Message-String matchen zu
      // müssen. tierClass kennt 'card-type-*' nicht, also bleibt es rein
      // semantisch als DOM-Hook.
      const _def = window.KL?.cards?.getCardDef?.(cardId);
      const _typeCls = _def?.type ? ' card-type-' + _def.type : '';
      logEl.appendChild(el('div', { class: logLineClass('card-play' + _typeCls) },
        ['▸ ' + cardName + mechSuffix]));
      logEl.scrollTop = logEl.scrollHeight;
    }

    // 2.x) Fatigue drain log — shows the condition cost right under
    //      the card-play line so the player connects "I played X →
    //      Y lost Z stamina." Quiet muted text, doesn't overwhelm
    //      the main narrative beat.
    if (res.applyResult?.fatigueDrain > 0 && res.applyResult?.fatigueTarget && logEl) {
      const amt = res.applyResult.fatigueDrain;
      const name = res.applyResult.fatigueTarget;
      const role = res.applyResult.fatigueTargetRole || '';
      const after = res.applyResult.fatigueConditionAfter;
      logEl.appendChild(el('div', { class: logLineClass('fatigue-cost') },
        [`⚡ −${amt} condition on ${name}${role ? ' (' + role + ')' : ''}` +
         (typeof after === 'number' ? ` · now ${Math.round(after)}` : '')]));
      logEl.scrollTop = logEl.scrollHeight;
    }

    // 2.y) v52.7 — Card-Type-Chain bonus celebration. When playCard
    // detects we just hit 3 (VERSATILE) or 4+ (TOTAL FOOTBALL) distinct
    // card types this round, it tags the result and pushes the buffLayer.
    // We surface it as an emphasized log line so the player connects
    // "varied play → real bonus" without having to read the buff inspector.
    if (res.applyResult?.chainBonusFired && logEl) {
      const tier = res.applyResult.chainBonusFired;
      const stats = res.applyResult.chainBonusStats || {};
      const LABEL = { offense:'OFF', defense:'DEF', tempo:'TMP', vision:'VIS', composure:'CMP' };
      const summary = Object.entries(stats)
        .map(([k, v]) => `${LABEL[k] || k} ${v > 0 ? '+' : ''}${v}`)
        .join(' / ');
      const headline = tier === 'totalfootball'
        ? '✨ TOTAL FOOTBALL — every angle covered!'
        : '✨ VERSATILE PLAY — three card types chained!';
      logEl.appendChild(el('div', { class: logLineClass('trigger') },
        [headline + ' · ' + summary]));
      logEl.scrollTop = logEl.scrollHeight;
    }

    // 2.y) Condition restore log — mirror of fatigue drain for cards
    //      that INCREASE a player's condition (breather, rotation, doping).
    //      Without this the restore is invisible to the player, which
    //      led to "did breather do anything?" confusion. Green visual
    //      cue so it reads as the positive mirror of the drain line.
    if (res.applyResult?.conditionDelta > 0 && res.applyResult?.targetName && logEl) {
      const amt = res.applyResult.conditionDelta;
      const name = res.applyResult.targetName;
      const after = res.applyResult.conditionAfter;
      logEl.appendChild(el('div', { class: logLineClass('condition-gain') },
        [`💚 +${amt} condition on ${name}` +
         (typeof after === 'number' ? ` · now ${Math.round(after)}` : '')]));
      logEl.scrollTop = logEl.scrollHeight;
    }

    // 2a) Role-affinity line — fires when an evolved starter's
    //     specialization matched the played card and amplified it.
    //     Surfaces the synergy so the player connects "Regista +
    //     Through-Ball" instead of seeing raw numbers.
    if (res.applyResult?.roleAffinity && res.applyResult.roleAffinity !== 1.0 && logEl) {
      const match2 = UI._cardPhaseMatch;
      const evolved = (match2?.squad || []).find(p => {
        if (!p.evolution || !window.KL?.roles) return false;
        const def = window.KL.roles.getEvolutionDef(p.evolution);
        return def && (def.cardAffinity || []).includes(cardId);
      });
      if (evolved) {
        const evoBadge = window.KL.roles.getEvolutionDef(evolved.evolution);
        const camel = (evoBadge.id || '').replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        const evoName = I18N.t('ui.evolutions.' + camel + '.name') || evoBadge.id;
        const pct = Math.round((res.applyResult.roleAffinity - 1) * 100);
        logEl.appendChild(el('div', { class: logLineClass('role-affinity') },
          [`↑ ${evolved.name} (${evoName}) amplifies this — +${pct}% effect.`]));
        logEl.scrollTop = logEl.scrollHeight;
      }
    }

    // 2b) Fatigue-threshold narration — fires ONLY when a card's drain
    //     pushes a starter through a condition tier (50/35/20). Creates
    //     visible "team is tiring" moments that land during play.
    if (res.applyResult?.fatigueThresholdCrossed && logEl) {
      const t = res.applyResult.fatigueThresholdCrossed;
      const name = res.applyResult.fatigueTarget;
      const role = res.applyResult.fatigueTargetRole;
      const after = res.applyResult.fatigueConditionAfter;
      let narration;
      if (t === 50) {
        const pool = [
          `${name} (${role}) breathing heavy — legs starting to feel it.`,
          `${name} (${role}) waves for a break in play — not yet critical.`,
          `${name} (${role}) drops the tempo a touch — conserving.`,
          `${name} (${role}) looks across to the bench — still running, but asking.`
        ];
        narration = pool[Math.floor(Math.random() * pool.length)];
      } else if (t === 35) {
        const pool = [
          `${name} (${role}) is cooked — last legs now.`,
          `${name} (${role}) is blowing hard — this is running on fumes.`,
          `${name} (${role}) jogs back slower — the well is nearly dry.`,
          `${name} (${role}) grabs the shorts, bent over — deep in the tank.`
        ];
        narration = pool[Math.floor(Math.random() * pool.length)];
      } else if (t === 20) {
        const pool = [
          `${name} (${role}) is done — every step looks like a mile.`,
          `${name} (${role}) cramps up — staff waving at the physio.`,
          `${name} (${role}) can't press anymore — pure survival mode.`,
          `${name} (${role}) visibly suffering — big decision coming.`
        ];
        narration = pool[Math.floor(Math.random() * pool.length)];
      }
      if (narration) {
        // Append the concrete mechanical effect so the player learns
        // what low condition costs. First crossing of each threshold
        // per player gets the hint; later ones don't repeat.
        let penaltyHint = '';
        if (t === 50) penaltyHint = ' · −3 on all stats below 50';
        else if (t === 20) penaltyHint = ' · −6 on all stats below 25';
        logEl.appendChild(el('div', { class: logLineClass('fatigue-narration') },
          ['💨 ' + narration + ' (cond ' + Math.round(after) + ')' + penaltyHint]));
        logEl.scrollTop = logEl.scrollHeight;
      }
    }

    // 3) Direct-Action resolution — when a card triggers an IMMEDIATE
    //    in-fiction event (not a stat-buff), we log the action outcome
    //    right here so the player sees the cause-effect chain. This
    //    makes cards feel like plays ("Araújo threads the ball through!")
    //    rather than sliders ("+10 OFF next round"). Outcome types are
    //    dispatched to engine helpers; the result is narrated here.
    if (res.applyResult?.directAction && logEl) {
      const da = res.applyResult.directAction;
      const daLines = UI.resolveDirectAction(da, match);
      for (const line of daLines) {
        logEl.appendChild(el('div', { class: logLineClass('direct-action ' + (line.cls || '')) },
          [(line.prefix || '→ ') + line.msg]));
      }
      logEl.scrollTop = logEl.scrollHeight;
    }

    // Fly-out animation — the clicked card lifts toward the card-state
    // header before renderCardPhase rebuilds the hand. Captures the
    // physical sense of "this card was committed" rather than having it
    // just vanish. Non-blocking: the animation runs while the rest of
    // the UI updates synchronously.
    UI.animateCardFlyOut(handIndex);

    // Stat pop — visual delta from this card alone.
    UI.showCardImpact(res);

    // Flash Flow/Lane chips when consumed, so the player SEES the payoff.
    if (flowDelta < 0) UI.flashTag('cp-tag-flow');
    if (laneConsumed)  UI.flashTag('cp-tag-lane');

    if (UI.updateMatchMomentum) UI.updateMatchMomentum(match);

    UI.renderCardPhase();

    // Auto-end turn when nothing playable remains, after a short beat so
    // the player sees the last card's impact.
    const anyPlayable = (state._cardHand || []).some(id =>
      window.KL.cards.canPlay(state, match, id));
    if (!anyPlayable) {
      setTimeout(() => UI.endCardPhase(), 700);
    }
  },

  // Resolves a card's flavor template into a full sentence by filling in
  // player-role placeholders and the opponent team name. Picks between
  // .flavor (default), .flavorHit (payoff succeeded), and .flavorMiss
  // (conditional payoff failed) based on the play result.
  //
  // Returns a single string, or '' if no template is registered.
  resolveCardNarrative(cardId, match, res) {
    if (!match || !cardId || !window.I18N) return '';

    // Choose branch: forced/hit/miss/default.
    // `forced` beats all other branches — it's the explicit "this card
    // had no choice" outcome (e.g. third Doping play this match).
    const ap = res?.applyResult || {};
    let base = 'flavor';
    if (ap.payoff === true)  base = 'flavorHit';
    if (ap.payoff === false) base = 'flavorMiss';
    if (ap.outcome === 'setup') base = 'flavorHit';
    if (ap.outcome === 'miss' || ap.outcome === 'dud') base = 'flavorMiss';
    if (ap.forced === true)  base = 'flavorForced';

    // pickText handles i18n arrays by picking a random entry. If the
    // branch is missing, fall back to generic .flavor.
    const path = 'ui.cards.' + cardId + '.' + base;
    let raw = window.I18N.pickText ? window.I18N.pickText(path) : null;
    if (!raw || raw === path) {
      raw = window.I18N.pickText ? window.I18N.pickText('ui.cards.' + cardId + '.flavor') : null;
    }
    if (!raw || typeof raw !== 'string') return '';
    if (raw.startsWith('ui.cards.')) return '';  // unresolved key

    // Resolve {role} placeholders from the squad, and {opp} from match.opp.
    // Also {target} — for cards like Breather/Rotation that pick a specific
    // player to act on. The applyResult ships targetName back up.
    const roles = { PM:'', LF:'', ST:'', VT:'', TW:'' };
    for (const p of match.squad || []) {
      if (roles[p.role] !== undefined && !roles[p.role]) roles[p.role] = p.name;
    }
    const targetName = ap.targetName || '';
    return raw
      .replace(/\{pm\}/g, roles.PM || 'the playmaker')
      .replace(/\{lf\}/g, roles.LF || 'the winger')
      .replace(/\{st\}/g, roles.ST || 'the striker')
      .replace(/\{vt\}/g, roles.VT || 'the defender')
      .replace(/\{tw\}/g, roles.TW || 'the keeper')
      .replace(/\{target\}/g, targetName || 'the player')
      .replace(/\{opp\}/g, match.opp?.name || 'them');
  },

  // v0.53 — Sister helper to resolveCardNarrative, but for the static
  // card description text (`ui.cards.<id>.desc`). Same role-placeholder
  // rules, but without the flavor branching and with role-abbreviation
  // fallbacks (ST/TW/VT/PM/LF) instead of "the striker"/"the keeper"
  // because the description is shown on hand cards, deck-management
  // panels, codex and draft views — contexts where the more compact
  // role token reads cleaner than a sentence-style fallback.
  //
  // The match argument is optional. When called from in-match contexts
  // (hand card render, card-play tooltip, card-played panel), the live
  // squad is read and player names substitute. From codex / deck-overview
  // / draft contexts there's no match yet, so role abbreviations stand
  // in. Either way the string never contains a literal `{st}`, `{tw}`,
  // etc. anymore — which was the visible bug in the v0.52 Lone Striker
  // hand-card screenshot.
  resolveCardDescription(cardId, match) {
    if (!cardId || !window.I18N) return '';
    const raw = window.I18N.t('ui.cards.' + cardId + '.desc');
    if (!raw || typeof raw !== 'string') return '';
    if (raw.startsWith('ui.cards.')) return '';   // unresolved key
    if (!raw.includes('{')) return raw;           // no placeholders → fast path

    const roles = { PM:'', LF:'', ST:'', VT:'', TW:'' };
    for (const p of (match?.squad || [])) {
      if (roles[p.role] !== undefined && !roles[p.role]) roles[p.role] = p.name;
    }
    return raw
      .replace(/\{pm\}/g, roles.PM || 'PM')
      .replace(/\{lf\}/g, roles.LF || 'LF')
      .replace(/\{st\}/g, roles.ST || 'ST')
      .replace(/\{vt\}/g, roles.VT || 'VT')
      .replace(/\{tw\}/g, roles.TW || 'TW')
      .replace(/\{opp\}/g, match?.opp?.name || 'opponent');
  },

  // Builds the post-match card performance summary card. Returns a DOM
  // element to slot into the result screen, or null if nothing interesting.
  // Builds a small preview of the post-match flow so the player knows
  // what's coming: card draft add/remove, legendary recruit after a boss,
  // or straight-to-hub. Improves flow comprehension — no more "wait, why
  // am I on a new screen?" moments.
  buildNextUpPreview(match, state, result) {
    if (!state || !window.KL?.cards) return null;
    // state.matchNumber was already incremented in flow.js before
    // renderResult runs (flow.js line 187: `state.matchNumber++` sits
    // BEFORE the UI.renderResult() call). So it already equals the
    // just-completed match number. v52.1 fix: the previous `+1` here
    // meant the preview was predicting the draft AFTER the next match
    // instead of the one that's actually coming up — which produced
    // the reported mismatch ("preview says REMOVE, actual draft is ADD").
    const completedMatch = state.matchNumber || 0;

    // Final match — nothing comes after, skip preview.
    if (completedMatch >= 14) return null;

    const items = [];

    // Boss-match legendary recruit preview
    const cfg = window.CONFIG || window.KL?.config?.CONFIG;
    if (result === 'win' && cfg?.bossMatches?.includes?.(completedMatch)) {
      items.push({
        icon: '⭐',
        label: I18N.t('ui.nextUp.legendaryRecruit') || 'Legendary recruit offer',
        tone: 'good'
      });
    }

    // Card draft preview
    const draftMode = window.KL.cards.pickDraftMode(completedMatch);
    if (draftMode === 'add') {
      items.push({
        icon: '➕',
        label: I18N.t('ui.nextUp.cardDraftAdd') || 'Pick a new card for your deck',
        tone: 'good'
      });
    } else if (draftMode === 'remove') {
      items.push({
        icon: '✂',
        label: I18N.t('ui.nextUp.cardDraftRemove') || 'Remove a card from your deck',
        tone: 'neutral'
      });
    } else if (draftMode === 'replace') {
      items.push({
        icon: '↻',
        label: I18N.t('ui.nextUp.cardDraftReplace') || 'Replace a card — swap one for a new one',
        tone: 'good'
      });
    } else if (draftMode === 'double_add') {
      items.push({
        icon: '⚡',
        label: I18N.t('ui.nextUp.cardDraftDoubleAdd') || 'Boss reward — pick TWO cards',
        tone: 'good'
      });
    } else if (draftMode === 'upgrade') {
      items.push({
        icon: '↑',
        label: I18N.t('ui.nextUp.cardDraftUpgrade') || 'Upgrade a card — +25% effect',
        tone: 'good'
      });
    } else if (draftMode === 'evolution') {
      items.push({
        icon: '✦',
        label: I18N.t('ui.nextUp.roleEvolution') || 'Role evolution — specialize a starter',
        tone: 'good'
      });
    }

    // Next match preview
    const nextOpp = state.seasonOpponents?.[completedMatch];
    if (nextOpp) {
      const isBoss = cfg?.bossMatches?.includes?.(completedMatch + 1);
      items.push({
        icon: isBoss ? '👑' : '⚔',
        label: (I18N.t('ui.nextUp.nextMatch') || 'Next match') + ': ' + (nextOpp.name || '?'),
        tone: isBoss ? 'warn' : 'dim'
      });
    }

    if (items.length === 0) return null;

    const box = el('div', { class: 'result-next-up' });
    box.appendChild(el('div', { class: 'result-sub-hint' }, [
      I18N.t('ui.nextUp.title') || 'COMING UP'
    ]));
    const list = el('div', { class: 'next-up-list' });
    for (const it of items) {
      list.appendChild(el('div', { class: 'next-up-item tone-' + it.tone }, [
        el('span', { class: 'nu-icon' }, [it.icon]),
        el('span', { class: 'nu-label' }, [it.label])
      ]));
    }
    box.appendChild(list);
    return box;
  },

  buildCardMatchSummary(match, state) {
    const played = match?._cardsPlayedThisMatch || [];
    const framesFired = Array.from(match?._firedFrames || []);
    const deckSize = state && window.KL?.cards
      ? window.KL.cards.getFullDeckContents(state).length
      : 0;
    const hasCondition = (match?.squad || []).some(p => typeof p.condition === 'number');

    if (played.length === 0 && framesFired.length === 0 && !hasCondition) return null;

    // v52.2: unified compact layout for ALL outcomes (win / loss / draw).
    // Previously the function had two shapes: a KPI-heavy "stats" card
    // for matches where cards were played, and a minimal compact card
    // for the 0-plays case. In practice that meant the WIN page (usually
    // high engagement, cards played) looked denser and different from
    // the LOSS / DRAW pages. The three pages don't need different
    // layouts — consolidating keeps the result screen visually
    // consistent regardless of outcome. The compact line now adapts its
    // text to reflect the actual card count when plays happened, and
    // surfaces FLOW PEAK inline when it's worth mentioning.
    const card = el('div', { class: 'result-sub-card result-card-compact' });
    card.appendChild(el('div', { class: 'result-sub-title' }, [
      I18N.t('ui.result.cardsTitle') || 'Card Play'
    ]));

    // Headline line — either "N cards played · [FLOW PEAK K ·] DECK SIZE M"
    // or "No cards played · DECK SIZE M" when the player skipped every
    // card phase. One line, no KPI-chip row — the compact aesthetic is
    // the whole point.
    const flowPeak = played.length > 0 ? UI.estimateFlowPeak(played) : 0;
    const parts = [];
    if (played.length === 0) {
      parts.push(I18N.t('ui.result.cardsSkipped') || 'No cards played');
    } else {
      const cardsPlayedLabel = I18N.t('ui.result.cardsPlayed') || 'CARDS PLAYED';
      parts.push(`${played.length} ${cardsPlayedLabel.toLowerCase()}`);
      if (flowPeak > 0) {
        const flowLabel = I18N.t('ui.result.flowPeak') || 'FLOW PEAK';
        parts.push(`${flowLabel.toLowerCase()} ${flowPeak}`);
      }
    }
    const deckLabel = I18N.t('ui.result.deckAfter') || 'DECK SIZE';
    parts.push(`${deckLabel.toLowerCase()} ${deckSize}`);

    card.appendChild(el('div', { class: 'card-compact-line' }, [
      el('span', { class: 'ccl-note' }, [parts.join(' · ')])
    ]));

    // Frames that fired — same one-line summary the old compact branch
    // used. Kept because situation-frames are often the narrative peak
    // of a match and they should still be visible post-match.
    if (framesFired.length > 0) {
      const fr = el('div', { class: 'card-compact-frames' });
      fr.appendChild(el('span', { class: 'ccf-label' }, [
        (I18N.t('ui.result.framesFired') || 'Situations') + ': '
      ]));
      const frameNames = framesFired.map(frameId => {
        return I18N.t('ui.frames.' + UI.frameIdToI18nKey(frameId) + '.title') || frameId;
      }).join(' · ');
      fr.appendChild(el('span', { class: 'ccf-names' }, [frameNames]));
      card.appendChild(fr);
    }

    // NOTE: The richer stats variant (KPI row + most-played list) was
    // retired in v52.2. If it needs to come back, wrap it behind a
    // UI-config flag rather than a data-driven branch — mixing two
    // layouts for the same post-match summary was the original reason
    // the result screens diverged between win and loss / draw.
    return card;
  },

  // Per-starter condition summary: role · name · start → end with color
  // delta. Data comes from match._conditionStartSnapshot (R1 kickoff) and
  // match._conditionEndSnapshot (match end, taken BEFORE post-match
  // recovery is applied). Tolerates missing snapshots gracefully.
  buildConditionBilanz(match) {
    const squad = match?.squad || [];
    const startSnap = match?._conditionStartSnapshot || {};
    const endSnap   = match?._conditionEndSnapshot   || {};
    const scored = squad.filter(p =>
      typeof endSnap[p.id] === 'number' || typeof p.condition === 'number'
    );
    if (scored.length === 0) return null;

    const box = el('div', { class: 'card-stats-cond' });
    box.appendChild(el('div', { class: 'result-sub-hint' }, [
      I18N.t('ui.result.condBilanz') || 'Condition'
    ]));

    const grid = el('div', { class: 'cond-bilanz-grid' });
    for (const p of scored) {
      const before = startSnap[p.id];
      // Prefer end snapshot; fall back to live condition if snapshot missing.
      const after  = (typeof endSnap[p.id] === 'number') ? endSnap[p.id] : p.condition;
      const delta  = typeof before === 'number' ? after - before : null;

      let tone = 'good';
      if (after < 25) tone = 'critical';
      else if (after < 50) tone = 'warn';
      else if (after < 75) tone = 'neutral';

      const row = el('div', { class: 'cond-bilanz-row tone-' + tone });
      row.appendChild(el('span', { class: 'cbr-role' }, [UI.roleAbbr(p.role) || p.role]));
      row.appendChild(el('span', { class: 'cbr-name' }, [p.name]));

      const values = el('span', { class: 'cbr-values' });
      if (typeof before === 'number') {
        values.appendChild(el('span', { class: 'cbr-before' }, [String(before)]));
        values.appendChild(el('span', { class: 'cbr-arrow' }, ['→']));
      }
      values.appendChild(el('span', { class: 'cbr-after' }, [String(after)]));
      if (delta !== null && delta !== 0) {
        const sign = delta > 0 ? '+' : '';
        values.appendChild(el('span', { class: 'cbr-delta ' + (delta < 0 ? 'neg' : 'pos') }, [sign + delta]));
      }
      row.appendChild(values);
      grid.appendChild(row);
    }
    box.appendChild(grid);
    return box;
  },

  // Frame IDs are snake_case; i18n keys are camelCase. Map them.
  frameIdToI18nKey(id) {
    return String(id).replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  },

  // Small KPI block — big number, small label. Reused in the card
  // summary and can be reused elsewhere.
  // Dashboard-style KPI tile: big pixel number, small uppercase label,
  // optional leading icon and tone class for color emphasis. Used in the
  // match-end card summary row.
  buildKpi(value, label, opts = {}) {
    const cls = ['card-kpi'];
    if (opts.tone) cls.push('ck-tone-' + opts.tone);
    const children = [];
    if (opts.icon) children.push(el('div', { class: 'ck-icon' }, [opts.icon]));
    children.push(el('div', { class: 'ck-val' }, [String(value)]));
    children.push(el('div', { class: 'ck-label' }, [label]));
    return el('div', { class: cls.join(' ') }, children);
  },

  // Estimate the Flow peak during the match from the played-cards log.
  // Each setup card adds +1 (or +2 for deep_focus); each combo consumes.
  // Doesn't perfectly match runtime (Frame-hot_corridor can set laneOpen
  // without going through a card), but close enough to surface a meaningful
  // "you reached Flow N" highlight.
  estimateFlowPeak(playedList) {
    let flow = 0;
    let peak = 0;
    for (const entry of playedList) {
      const def = window.KL?.cards?.getCardDef?.(entry.id);
      if (!def) continue;
      for (const tag of (def.tags || [])) {
        if (tag === 'flow') flow++;
      }
      // Combos and triggers can consume: hero_moment -2 on payoff,
      // masterclass -3, stone_cold -2, overlap_run doesn't consume.
      // Simple approximation: if needs includes 'flow' → consumption.
      if ((def.needs || []).includes('flow')) {
        if (def.id === 'masterclass') flow = Math.max(0, flow - 3);
        else if (def.id === 'hero_moment' && flow >= 2) flow -= 2;
        else if (def.id === 'stone_cold' && flow >= 2) flow -= 2;
      }
      if (flow > peak) peak = flow;
    }
    return peak;
  },

  // Briefly pulse a tag chip when its resource is consumed.
  // Clones the clicked hand card and animates it flying toward the
  // card-state header (top of the match screen). Non-blocking: the main
  // renderCardPhase rebuilds the hand synchronously while the clone does
  // its visual swoosh. The clone is absolutely positioned and removes
  // itself after the animation completes, so it never interferes with
  // layout.
  // First-play card tutorial. Creates a dismissable overlay with 5
  // numbered hints pointing at hand / energy / flow / end-turn / frames.
  // Overlay is a single full-screen layer over the match — player can
  // close it anytime and it won't reappear on this browser.
  showCardTutorial() {
    if (document.getElementById('card-tutorial-overlay')) return;
    const lang = (window.I18N?.getLang?.() || 'en');
    const copy = {
      en: {
        title: 'CARDS — HOW IT WORKS',
        intro: 'Each round you get a hand of cards that buff your team or trigger moments. Take a look:',
        steps: [
          'HAND — click a card to play it. Energy cost shown as dots.',
          'ENERGY — you get 3 per round. Spend, then End Turn.',
          'FLOW — Setup cards build it up. Triggers and Combos spend it for big payoffs.',
          'SITUATIONS — inline banners during a match. React with the right cards.',
          'END TURN — finishes the card phase. The round then simulates.'
        ],
        close: 'GOT IT'
      },
      de: {
        title: 'KARTEN — SO GEHT\'S',
        intro: 'Pro Runde bekommst du eine Hand voll Karten, die dein Team stärken oder Momente auslösen. Schau mal:',
        steps: [
          'HAND — klick eine Karte um sie auszuspielen. Energiekosten als Punkte.',
          'ENERGIE — 3 pro Runde. Ausgeben, dann Zug beenden.',
          'FLOW — Setup-Karten bauen ihn auf. Trigger und Combos verbrauchen ihn für großen Payoff.',
          'SITUATIONEN — Banner während des Matches. Reagiere mit den passenden Karten.',
          'ZUG BEENDEN — schließt die Card-Phase ab. Die Runde wird dann simuliert.'
        ],
        close: 'ALLES KLAR'
      },
      es: {
        title: 'CARTAS — CÓMO FUNCIONA',
        intro: 'Cada ronda recibes una mano de cartas que refuerzan tu equipo o disparan momentos. Mira:',
        steps: [
          'MANO — haz clic para jugar una carta. Coste en energía como puntos.',
          'ENERGÍA — 3 por ronda. Gasta, luego Terminar Turno.',
          'FLOW — las cartas Setup lo generan. Triggers y Combos lo gastan por gran recompensa.',
          'SITUACIONES — pancartas durante el partido. Reacciona con las cartas adecuadas.',
          'TERMINAR TURNO — cierra la fase de cartas. La ronda se simula después.'
        ],
        close: 'ENTENDIDO'
      }
    };
    const t = copy[lang] || copy.en;

    const overlay = el('div', { id: 'card-tutorial-overlay', class: 'card-tutorial-overlay' }, [
      el('div', { class: 'card-tutorial-modal' }, [
        el('h2', { class: 'ctm-title' }, [t.title]),
        el('p', { class: 'ctm-intro' }, [t.intro]),
        el('ol', { class: 'ctm-steps' }, t.steps.map(step => el('li', {}, [step]))),
        el('button', { class: 'btn primary ctm-close' }, [t.close])
      ])
    ]);
    document.body.appendChild(overlay);
    const btn = overlay.querySelector('.ctm-close');
    btn.onclick = () => overlay.remove();
    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay) overlay.remove();
    });
  },

  // v0.55 — Second-stage tutorial, fired at the start of match 3's
  // card phase. Covers the layer-2 mechanics that the first tutorial
  // intentionally skipped (would have been overload at minute 0):
  // phase affinity, the EV-chip starring, and the Probable Situations
  // panel. Wording stays plain — no jargon like "soft-disconnect" or
  // "frame severity", just *what does this thing on screen mean and
  // how do I read it*. Same dismissable-overlay UX as the first
  // tutorial: closes via button or click on the backdrop.
  showCardTutorial2() {
    if (document.getElementById('card-tutorial-overlay')) return;
    const lang = (window.I18N?.getLang?.() || 'en');
    const copy = {
      en: {
        title: 'A FEW MORE THINGS',
        intro: 'You\'ve played a couple of matches. The UI shows three more things you can use:',
        steps: [
          'PHASE — round-header words like ATTACK / DEFENSIVE shift card power. A combo card sings in ATTACK, mumbles in DEFENSIVE. Watch the round header.',
          'STAR CHIP — the ★ on a card is its expected goal impact this turn. ★★★ is strong now, ★ is weak. Soft-disconnected (⏸ FLOW / ⏸ LANE) cards hide the chip — they play at half effect.',
          'SITUATIONS PANEL — the pre-match \"Probable Situations\" lists frames you might hit. \"Counters\" mean you can defend; \"Payoffs\" mean you can exploit a favourable moment.'
        ],
        close: 'GOT IT'
      },
      de: {
        title: 'EIN PAAR DINGE NOCH',
        intro: 'Du hast ein paar Matches gespielt. Die UI zeigt noch drei Dinge, die du nutzen kannst:',
        steps: [
          'PHASE — die Runden-Header wie ATTACK / DEFENSIVE verändern Karten-Stärke. Eine Combo-Karte glänzt in ATTACK, schwächelt in DEFENSIVE. Achte auf den Header.',
          'STERN-CHIP — das ★ auf einer Karte zeigt den erwarteten Tor-Effekt diese Runde. ★★★ ist jetzt stark, ★ ist schwach. Soft-disconnected (⏸ FLOW / ⏸ LANE) Karten zeigen keinen Chip — sie wirken nur halb.',
          'SITUATIONS-PANEL — die "Wahrscheinlichen Situationen" vor dem Match listen Frames die kommen können. "Konter" heißt: du kannst abwehren; "Hebel" heißt: du kannst einen Vorteil ausnutzen.'
        ],
        close: 'ALLES KLAR'
      },
      es: {
        title: 'UN PAR DE COSAS MÁS',
        intro: 'Has jugado un par de partidos. La interfaz muestra tres cosas más que puedes usar:',
        steps: [
          'FASE — las cabeceras de ronda como ATTACK / DEFENSIVE cambian la fuerza de las cartas. Una combo brilla en ATTACK, susurra en DEFENSIVE. Mira la cabecera.',
          'CHIP DE ESTRELLA — el ★ en una carta es su impacto esperado en gol esta ronda. ★★★ es fuerte ahora, ★ es flojo. Las cartas soft-disconnected (⏸ FLOW / ⏸ LANE) ocultan el chip — funcionan a medio efecto.',
          'PANEL DE SITUACIONES — las "Situaciones probables" antes del partido listan frames que pueden surgir. "Contras" = puedes defender; "Remates" = puedes aprovechar un momento favorable.'
        ],
        close: 'ENTENDIDO'
      }
    };
    const t = copy[lang] || copy.en;

    const overlay = el('div', { id: 'card-tutorial-overlay', class: 'card-tutorial-overlay' }, [
      el('div', { class: 'card-tutorial-modal' }, [
        el('h2', { class: 'ctm-title' }, [t.title]),
        el('p', { class: 'ctm-intro' }, [t.intro]),
        el('ol', { class: 'ctm-steps' }, t.steps.map(step => el('li', {}, [step]))),
        el('button', { class: 'btn primary ctm-close' }, [t.close])
      ])
    ]);
    document.body.appendChild(overlay);
    const btn = overlay.querySelector('.ctm-close');
    btn.onclick = () => overlay.remove();
    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay) overlay.remove();
    });
  },

  // Direct-action resolver — converts a card's immediate-event spec
  // into narrated + mechanically resolved outcomes. Called during
  // the card play's client-side resolution, not via the engine loop,
  // because these events are the CARD's payoff, not part of the
  // scripted round simulation. Mechanics are light: direct actions
  // mutate match state (add goals, block opp shots, reduce opp stats)
  // and return 1-3 log lines describing what happened.
  resolveDirectAction(da, match) {
    const lines = [];
    if (!da || !match) return lines;

    const squad = match.squad || [];
    const st = squad.find(p => p.role === 'ST');
    const pm = squad.find(p => p.role === 'PM');
    const lf = squad.find(p => p.role === 'LF');
    const vt = squad.find(p => p.role === 'VT');
    const tw = squad.find(p => p.role === 'TW');
    const stName = st?.name || 'Striker';
    const pmName = pm?.name || 'Midfielder';
    const lfName = lf?.name || 'Winger';
    const vtName = vt?.name || 'Defender';
    const twName = tw?.name || 'Keeper';
    const oppName = match.opp?.name || 'Opponent';

    // Pick narration variants with the narrator pool for rhythm
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Micro-event bonus: if an active match-event window is open AND
    // this da.type matches, return the bonus chance and a flag to log
    // that the event was cashed in. Consumes the event flag so it
    // fires once.
    const getMicroEventBonus = (daType) => {
      const r = match.round || 0;
      // Corner kick window: applies to extraShot / throughBall / cross
      if (match._cornerPending && r <= (match._cornerWindow || 0)) {
        if (['extraShot', 'throughBall', 'cross', 'scrappyGoal'].includes(daType)) {
          match._cornerPending = false;   // consume
          return { bonus: 0.35, label: 'corner cashed in' };
        }
      }
      // 1v1: applies to composure shots (extraShot, throughBall)
      if (match._oneOnOnePending && r <= (match._oneOnOneWindow || 0)) {
        if (['extraShot', 'throughBall'].includes(daType)) {
          match._oneOnOnePending = false;
          return { bonus: 0.29, label: '1v1 clinical' };
        }
      }
      // Counter-press: applies to pressWin, interceptCounter
      if (match._counterPressWindow && r <= match._counterPressWindow) {
        if (['pressWin', 'interceptCounter', 'oppStumble'].includes(daType)) {
          match._counterPressWindow = 0;
          return { bonus: 0.25, label: 'counter-press' };
        }
      }
      return null;
    };

    switch (da.type) {
      case 'extraShot': {
        const oppOff = (match.opp?.stats?.offense || 50);
        const myOff  = (match.teamBuffs?.offense || 0) + 50;
        let chance = Math.max(0.25, Math.min(0.80, 0.35 + (myOff - oppOff) * 0.006));
        const evt = getMicroEventBonus('extraShot');
        if (evt) {
          chance = Math.min(0.92, chance + evt.bonus);
          lines.push({ cls:'match-event', msg: `✦ ${evt.label} — extra quality on this shot.` });
        }
        if (Math.random() < chance) {
          match.scoreMe += 1;
          match.matchMomentum = Math.min(100, (match.matchMomentum || 0) + 30);
          UI.updateMatchScore?.(match);
          lines.push({ prefix:'⚽ ', cls:'goal-me', msg: pick([
            `${stName} tucks it low in the corner — keeper dived the wrong way. GOAL.`,
            `${stName} buries it — side-foot past the far post. GOAL.`,
            `${stName} meets it first-time — rips through the top corner. GOAL.`,
            `Half-volley from ${stName} — lashed home. GOAL.`,
            `${stName} chests it down, smashes it in — clinical. GOAL.`,
            `The finish! ${stName} leathers it past the keeper. GOAL.`
          ])});
        } else {
          lines.push({ cls:'trigger', msg: pick([
            `${stName} rifles it — tipped over the bar at full stretch.`,
            `${stName} lashes at it — cannons off the crossbar.`,
            `${stName} forces the keeper into a flying save — close!`,
            `${stName} strikes it pure — straight at the keeper's chest.`,
            `${stName} swings — the defender throws a boot in, ball deflected.`
          ])});
        }
        break;
      }
      case 'throughBall': {
        const target = da.target === 'LF' ? lfName : stName;
        lines.push({ cls:'trigger', msg: pick([
          `${pmName} splits two with a disguised pass — ${target} is through!`,
          `Defence-splitting ball from ${pmName} — ${target} is in behind!`,
          `${pmName} threads the needle — ${target} onto it, one-on-one brewing.`,
          `Eyes up, outside of the boot — ${pmName} finds ${target} in the gap.`,
          `${pmName} sees the run early — sliderule pass, ${target} bursts clear.`
        ])});
        let chance = 0.45;
        const evt = getMicroEventBonus('throughBall');
        if (evt) {
          chance = Math.min(0.92, chance + evt.bonus);
          lines.push({ cls:'match-event', msg: `✦ ${evt.label} — the moment arrives.` });
        }
        if (Math.random() < chance) {
          match.scoreMe += 1;
          match.matchMomentum = Math.min(100, (match.matchMomentum || 0) + 30);
          UI.updateMatchScore?.(match);
          lines.push({ prefix:'⚽ ', cls:'goal-me', msg: pick([
            `${target} rounds the keeper, rolls it into the empty net — GOAL.`,
            `${target} stays composed, slots it cold past the outrushing keeper. GOAL.`,
            `${target} lifts it over the sprawling keeper — dinked, cheeky, in. GOAL.`,
            `${target} finishes first-time across goal — keeper had no chance. GOAL.`
          ])});
        } else {
          lines.push({ msg: pick([
            `${target} drags the shot wide — gilt-edged chance gone.`,
            `Keeper charges out, smothers it at ${target}'s feet — brave save.`,
            `${target} checks his run — offside flag up, agonisingly close.`,
            `A covering boot! The last defender slides in, clears for a corner.`,
            `${target} shoots early — keeper saves with the legs, knee reflex.`
          ])});
        }
        break;
      }
      case 'cross': {
        lines.push({ cls:'trigger', msg: pick([
          `${lfName} skins the full-back, whips one in with the laces.`,
          `${lfName} burns down the flank, delivers on the overlap.`,
          `${lfName} pulls it back from the byline — inviting, just waiting to be buried.`,
          `${lfName} hangs one up at the back post — ${stName} attacks it!`,
          `Early ball from ${lfName} — cut-back onto the penalty spot.`
        ])});
        let chance = 0.38;
        const evt = getMicroEventBonus('cross');
        if (evt) {
          chance = Math.min(0.92, chance + evt.bonus);
          lines.push({ cls:'match-event', msg: `✦ ${evt.label} — perfect delivery.` });
        }
        if (Math.random() < chance) {
          match.scoreMe += 1;
          match.matchMomentum = Math.min(100, (match.matchMomentum || 0) + 30);
          UI.updateMatchScore?.(match);
          lines.push({ prefix:'⚽ ', cls:'goal-me', msg: pick([
            `${stName} rises highest — thumps a header into the corner! GOAL.`,
            `${stName} slides in at the near post — bundles it home! GOAL.`,
            `${stName} stretches out a boot — stabs it past the keeper! GOAL.`,
            `Volley from ${stName} — pure technique, smashed across goal! GOAL.`
          ])});
        } else {
          lines.push({ msg: pick([
            `Big man at the back post heads it clear — ${stName} couldn't get there.`,
            `Keeper comes and claims it — brave under pressure.`,
            `Cut out at the near post — defender's body in the way.`,
            `${stName} gets on the end of it — straight at the keeper.`
          ])});
        }
        break;
      }
      case 'absorbShot': {
        match._cardAbsorbNextOppShot = true;
        lines.push({ cls:'trigger', msg: pick([
          `${vtName} flies in — full-blooded challenge, ball hacked away.`,
          `${vtName} gets a head to it — brave, right between the centre-halves.`,
          `${vtName} stands tall, chest blocks it — defender's badge on the line.`,
          `${vtName} throws himself feet-first — last-ditch slide, superb.`,
          `${vtName} reads it all the way — steps up, shoulder to shoulder, wins it clean.`
        ])});
        break;
      }
      case 'foulBreak': {
        match._cardAbsorbNextOppShot = true;
        vt && bumpVTCard(vt);
        match.matchMomentum = Math.max(-100, (match.matchMomentum || 0) - 5);
        lines.push({ cls:'trigger', msg: pick([
          `${vtName} scythes him down on the edge of the D — ref reaches for the card. Yellow. Attack dead.`,
          `Cynical arm across the chest from ${vtName} — tactical, necessary, yellow.`,
          `${vtName} takes one for the team — steps across, yellow card, reset.`,
          `Professional foul by ${vtName} — holds the shirt, takes the booking. Play broken up.`,
          `${vtName} chops him down 30 yards out — stops the break at the cost of a yellow.`
        ])});
        break;
      }
      case 'interceptCounter': {
        lines.push({ cls:'trigger', msg: pick([
          `${vtName} reads the pass, steps in front — ball won clean!`,
          `${vtName} gambles, plants his boot, nicks it off the winger's toe.`,
          `${vtName} sniffs out the sloppy pass — intercepted, we break.`,
          `${vtName} steps through the line — picks it off like a corner flag.`,
          `Anticipation from ${vtName} — the pass never reaches its target.`
        ])});
        let chance = 0.30;
        const evt = getMicroEventBonus('interceptCounter');
        if (evt) {
          chance = Math.min(0.80, chance + evt.bonus);
          lines.push({ cls:'match-event', msg: `✦ ${evt.label} — they're wide open.` });
        }
        if (Math.random() < chance) {
          match.scoreMe += 1;
          match.matchMomentum = Math.min(100, (match.matchMomentum || 0) + 30);
          UI.updateMatchScore?.(match);
          lines.push({ prefix:'⚽ ', cls:'goal-me', msg: pick([
            `Three-pass counter — ${stName} slots it past the sprawling keeper! GOAL.`,
            `Lightning break — ${pmName} finds ${stName} on the run, buried. GOAL.`,
            `Counter-punch! ${stName} drills it low from the edge of the box. GOAL.`
          ])});
        } else {
          match.matchMomentum = Math.min(100, (match.matchMomentum || 0) + 6);
          lines.push({ msg: pick([
            `${pmName} carries it into midfield — chance to reset, possession ours.`,
            `${pmName} takes it upfield — we've got the ball in their half.`,
            `Clever layoff from ${pmName} — we keep the ball but the moment passes.`
          ])});
        }
        break;
      }
      case 'keeperSave': {
        // Guaranteed save of the next opp shot this round.
        match._cardGuaranteedSave = true;
        lines.push({ cls:'trigger', msg: pick([
          `${twName} barks orders at the back line — angles right, feet set, ready.`,
          `${twName} locks in — reads the shooter's body shape, already halfway across goal.`,
          `${twName} rolls his shoulders, exhales — the zone is on.`,
          `${twName} takes two steps off his line — cutting the angle down to nothing.`,
          `${twName} is all gloves and guts — tells the back four he's got the next one.`
        ])});
        break;
      }
      case 'freeKick': {
        lines.push({ cls:'trigger', msg: pick([
          `Dead-ball opportunity — ${pmName} stands over it, wall lining up.`,
          `Direct free-kick range — ${stName} measures the run-up, places the ball.`,
          `${pmName} wants it — hands on hips, eyeing the top corner, crowd hushes.`,
          `Prime position for a set-piece — ${pmName} takes the deep breath.`
        ])});
        if (Math.random() < 0.35) {
          match.scoreMe += 1;
          match.matchMomentum = Math.min(100, (match.matchMomentum || 0) + 30);
          UI.updateMatchScore?.(match);
          lines.push({ prefix:'⚽ ', cls:'goal-me', msg: pick([
            `${pmName} whips it up and over the wall — top corner! GOAL.`,
            `${pmName} bends it around the wall — keeper frozen, inside the post! GOAL.`,
            `${pmName} strikes it pure — knuckleball dipping under the bar! GOAL.`,
            `${pmName} curls it with the inside of the boot — keeper at full stretch, too late! GOAL.`
          ])});
        } else {
          lines.push({ msg: pick([
            `Wall leaps, deflection — corner kick for us at least.`,
            `${pmName} skies it — ends up somewhere in the back of the stands.`,
            `Keeper tips it over — Nacho clawing at air. Close.`,
            `Into the wall — the structure held. Ball out for a throw.`
          ])});
        }
        break;
      }
      case 'corner': {
        lines.push({ cls:'trigger', msg: pick([
          `Corner kick — ${pmName} trots over, signals the routine.`,
          `${lfName} over the ball in the corner — inswinger coming.`,
          `Flag up, corner to us — ${pmName} waits for the big men to arrive.`,
          `${pmName} stands at the corner flag — raises an arm, calls the play.`
        ])});
        if (Math.random() < 0.30) {
          match.scoreMe += 1;
          match.matchMomentum = Math.min(100, (match.matchMomentum || 0) + 30);
          UI.updateMatchScore?.(match);
          lines.push({ prefix:'⚽ ', cls:'goal-me', msg: pick([
            `${vtName} rises highest at the back post — thunders it home! GOAL from the corner!`,
            `Training-ground routine — ${stName} peels off the back, heads it in at the far post! GOAL.`,
            `${pmName} whips it in — scramble in the six-yard box, ${vtName} buries it! GOAL.`,
            `Near-post flick-on, ${stName} meets it with a diving header — top bin! GOAL.`
          ])});
        } else {
          lines.push({ msg: pick([
            `Cleared by the first defender at the near post — danger averted.`,
            `Keeper comes and claims it confidently — nothing doing.`,
            `Half-cleared, recycled — we'll have another go.`,
            `Wrestling in the box, ref sees a shirt pull — free-kick going the other way.`
          ])});
        }
        break;
      }
      case 'pressWin': {
        let chance = 0.50;
        const evt = getMicroEventBonus('pressWin');
        if (evt) {
          chance = Math.min(0.90, chance + evt.bonus);
          lines.push({ cls:'match-event', msg: `✦ ${evt.label} — hunt the ball.` });
        }
        if (Math.random() < chance) {
          match._cardAbsorbNextOppShot = true;
          match.matchMomentum = Math.min(100, (match.matchMomentum || 0) + 8);
          lines.push({ cls:'trigger', msg: pick([
            `${lfName} hunts the full-back down, wins the throw — pressure pays off!`,
            `Trap sprung — ${pmName} robs the ball in midfield, second wave incoming.`,
            `${vtName} gets right up the centre-half's nose — forces the loose pass, ball ours.`,
            `${stName} leads the charge, closes the keeper — panicked clearance, we reset high.`,
            `Textbook pressing trigger — ${pmName} cuts the passing lane, wins it in their half.`
          ])});
        } else {
          match.matchMomentum = Math.max(-100, (match.matchMomentum || 0) - 8);
          lines.push({ cls:'trigger', msg: pick([
            `${oppName} play through it with one touch — press is broken, we're exposed.`,
            `Smart one-two beats the press — ${oppName} has space behind us now.`,
            `The press leaves the middle wide open — ${oppName} drive straight through.`,
            `Our shape stretches — ${oppName} find the free man, we're chasing.`
          ])});
        }
        break;
      }
      case 'scrappyGoal': {
        let chance = 0.20;
        const evt = getMicroEventBonus('scrappyGoal');
        if (evt) {
          chance = Math.min(0.75, chance + evt.bonus);
          lines.push({ cls:'match-event', msg: `✦ ${evt.label} — even a hope-shot finds it.` });
        }
        if (Math.random() < chance) {
          match.scoreMe += 1;
          match.matchMomentum = Math.min(100, (match.matchMomentum || 0) + 30);
          UI.updateMatchScore?.(match);
          lines.push({ prefix:'⚽ ', cls:'goal-me', msg: pick([
            `${stName} pokes at it, deflection off the defender's shin — in! Ugly but counts. GOAL.`,
            `Scramble in the box — ${stName} forces his body between ball and keeper. Scuffed in. GOAL.`,
            `${stName} shanks it — wicked deflection, keeper wrongfooted, GOAL!`,
            `It's a dog's dinner in the six-yard box — ${stName} last touch, somehow it's in. GOAL.`
          ])});
        } else {
          lines.push({ cls:'trigger', msg: pick([
            `${stName} swings a wild one — sails into row Z.`,
            `${stName} toes it weakly — keeper barely breaks sweat.`,
            `${stName} wants a penalty — ref waves it away, goal-kick.`
          ])});
        }
        break;
      }
      case 'oppStumble': {
        match._cardOppNextAttackFails = true;
        match.matchMomentum = Math.min(100, (match.matchMomentum || 0) + 6);
        const evt = getMicroEventBonus('oppStumble');
        if (evt) {
          match.matchMomentum = Math.min(100, (match.matchMomentum || 0) + 8);
          lines.push({ cls:'match-event', msg: `✦ ${evt.label} — we flip it instantly.` });
        }
        lines.push({ cls:'trigger', msg: pick([
          `${oppName}'s centre-back slips playing it out — ${stName} nearly gets there first, ball out for a throw.`,
          `Miscommunication between keeper and defender — ${vtName} cleans up the loose one.`,
          `${oppName} overhit the build-up pass — sails out of play for a goal kick to us.`,
          `Heavy touch from ${oppName}'s playmaker — we're onto it before he can recover.`,
          `${oppName}'s winger tries to dribble out of trouble — loses it, we recover possession.`
        ])});
        break;
      }
      default:
        break;
    }

    return lines;

    function bumpVTCard(player) {
      if (!player) return;
      player._yellowCards = (player._yellowCards || 0) + 1;
    }
  },

  // Run-end statistics panel — reusable block for both victory and
  // gameover screens. Summarizes the full run with: W/D/L record,
  // goal difference, match timeline (one box per match), top scorer,
  // final deck size, and cards-played/frames-fired totals when the
  // card layer is enabled.
  buildRunStatsPanel() {
    const st = window.state;
    if (!st) return null;
    const panel = el('div', { class: 'run-stats-panel' });

    // Record + goals summary
    const summary = el('div', { class: 'rsp-summary' }, [
      el('div', { class: 'rsp-record' }, [
        el('span', { class: 'rsp-rec-item rsp-rec-w' }, [st.wins + ' W']),
        el('span', { class: 'rsp-rec-item rsp-rec-d' }, [st.draws + ' D']),
        el('span', { class: 'rsp-rec-item rsp-rec-l' }, [st.losses + ' L'])
      ]),
      el('div', { class: 'rsp-goals' }, [
        el('span', { class: 'rsp-goals-val' }, [st.goalsFor + ' : ' + st.goalsAgainst]),
        (() => {
          const diff = st.goalsFor - st.goalsAgainst;
          const cls = diff > 0 ? 'pos' : diff < 0 ? 'neg' : 'zero';
          return el('span', { class: 'rsp-goals-diff ' + cls }, [
            (diff >= 0 ? '+' : '') + diff
          ]);
        })()
      ])
    ]);
    panel.appendChild(summary);

    // Match timeline — one chip per played match, color-coded by result
    if (Array.isArray(st.matchHistory) && st.matchHistory.length > 0) {
      const timeline = el('div', { class: 'rsp-timeline' }, [
        el('div', { class: 'rsp-section-label' }, ['TIMELINE'])
      ]);
      const row = el('div', { class: 'rsp-timeline-row' });
      for (const m of st.matchHistory) {
        const cls = m.result === 'win' ? 'win' : m.result === 'loss' ? 'loss' : 'draw';
        row.appendChild(el('div', {
          class: 'rsp-tl-chip ' + cls,
          title: 'Match ' + m.md + ' vs ' + m.opp + ' — ' + m.scoreMe + ':' + m.scoreOpp
        }, [
          el('span', { class: 'rsp-tl-num' }, ['M' + m.md]),
          el('span', { class: 'rsp-tl-score' }, [m.scoreMe + ':' + m.scoreOpp])
        ]));
      }
      timeline.appendChild(row);
      panel.appendChild(timeline);
    }

    // Top scorer — most goals across the run
    const topScorer = (st.roster || [])
      .filter(p => typeof p._runGoals === 'number' && p._runGoals > 0)
      .sort((a, b) => (b._runGoals || 0) - (a._runGoals || 0))[0];
    if (topScorer) {
      panel.appendChild(el('div', { class: 'rsp-top-scorer' }, [
        el('span', { class: 'rsp-ts-label' }, ['TOP SCORER · ']),
        el('span', { class: 'rsp-ts-name' }, [topScorer.name]),
        el('span', { class: 'rsp-ts-goals' }, [' — ' + topScorer._runGoals + ' goals'])
      ]));
    }

    // Card layer stats (only if cards enabled)
    const cfg = window.CONFIG || window.KL?.config?.CONFIG;
    if (cfg?.cardsEnabled && window.KL?.cards) {
      const deckSize = window.KL.cards.getFullDeckContents(st).length;
      const cardsPlayed = st._runCardsPlayed || 0;
      const framesFired = st._runFramesFired || 0;
      panel.appendChild(el('div', { class: 'rsp-card-stats' }, [
        el('div', { class: 'rsp-cs-tile' }, [
          el('div', { class: 'rsp-cs-val' }, [String(deckSize)]),
          el('div', { class: 'rsp-cs-label' }, ['FINAL DECK'])
        ]),
        cardsPlayed > 0 ? el('div', { class: 'rsp-cs-tile' }, [
          el('div', { class: 'rsp-cs-val' }, [String(cardsPlayed)]),
          el('div', { class: 'rsp-cs-label' }, ['CARDS PLAYED'])
        ]) : null,
        framesFired > 0 ? el('div', { class: 'rsp-cs-tile' }, [
          el('div', { class: 'rsp-cs-val' }, [String(framesFired)]),
          el('div', { class: 'rsp-cs-label' }, ['SITUATIONS'])
        ]) : null
      ]));
    }

    return panel;
  },

  animateCardFlyOut(handIndex) {
    try {
      const handCards = document.querySelectorAll('#card-hand .hand-card');
      const sourceCard = handCards[handIndex];
      // Fly up toward the round indicator. The match-active-effects strip
      // (v52.5 removal) and match-card-state header chip are gone, so the
      // round indicator at the top of the match screen is the stable target.
      const target = document.getElementById('round-indicator')
                  || document.getElementById('card-phase');
      if (!sourceCard || !target) return;

      const srcRect = sourceCard.getBoundingClientRect();
      const tgtRect = target.getBoundingClientRect();

      // Clone the card visually, strip event handlers, position on top.
      const clone = sourceCard.cloneNode(true);
      clone.classList.add('card-flyout');
      clone.style.position = 'fixed';
      clone.style.left = srcRect.left + 'px';
      clone.style.top  = srcRect.top  + 'px';
      clone.style.width = srcRect.width + 'px';
      clone.style.height = srcRect.height + 'px';
      clone.style.margin = '0';
      clone.style.zIndex = '9999';
      clone.style.pointerEvents = 'none';
      clone.style.transition = 'transform 0.42s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.42s ease-out';
      document.body.appendChild(clone);

      // Compute the travel vector: from hand-card center to state-header center.
      const dx = (tgtRect.left + tgtRect.width / 2) - (srcRect.left + srcRect.width / 2);
      const dy = (tgtRect.top + tgtRect.height / 2) - (srcRect.top + srcRect.height / 2);

      // Hide the original so the clone owns the visual identity
      // during flight. renderCardPhase will rebuild the hand shortly after.
      sourceCard.style.visibility = 'hidden';

      requestAnimationFrame(() => {
        clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.35) rotate(12deg)`;
        clone.style.opacity = '0.0';
      });

      setTimeout(() => clone.remove(), 500);
    } catch (_) {
      // Animation is nice-to-have; swallow errors so a bad DOM reference
      // never blocks an actual card play.
    }
  },

  flashTag(className) {
    const node = document.querySelector('.' + className);
    if (!node) return;
    node.classList.remove('tag-consumed');  // reset if already animating
    // Force reflow to restart animation
    void node.offsetWidth;
    node.classList.add('tag-consumed');
    setTimeout(() => node.classList.remove('tag-consumed'), 900);
  },

  // ─── Role evolution draft screen ─────────────────────────────────────
  // Matches 6 and 11 — offer one un-evolved starter two specialization
  // paths. Shown in the same view as card drafts (cd-title/subtitle +
  // card-draft-options container). Each path is a "card" visually, but
  // clicking it applies the evolution to the player and advances flow.
  renderEvolutionDraft(candidate, paths) {
    // Activate the card-draft screen (Evolution reuses the same DOM slot).
    UI.showScreen('screen-card-draft');
    const title = document.getElementById('cd-title');
    const subtitle = document.getElementById('cd-subtitle');
    const options = document.getElementById('card-draft-options');
    const skipBtn = document.getElementById('cd-skip-btn');
    if (!options) return;

    title.textContent = I18N.t('ui.evolutions.title') || 'ROLE EVOLUTION';
    subtitle.textContent = (I18N.t('ui.evolutions.subtitle') || 'Choose a specialization path for {name} ({role}).')
      .replace('{name}', candidate.name)
      .replace('{role}', candidate.role);

    options.innerHTML = '';
    options.className = 'card-draft-options mode-evolution';

    for (const path of paths) {
      const name = I18N.t(path.nameKey) || path.id;
      const desc = I18N.t(path.descKey) || '';
      const statBits = Object.entries(path.statShift).map(([k, v]) => {
        const sign = v >= 0 ? '+' : '';
        const tone = v >= 0 ? 'evo-stat-pos' : 'evo-stat-neg';
        return `<span class="${tone}">${sign}${v} ${k.toUpperCase()}</span>`;
      }).join(' · ');
      const affinityLine = (path.cardAffinity || []).length
        ? `+${Math.round(path.cardBonus * 100)}% on: ${path.cardAffinity.slice(0,3).map(id => id.replace(/_/g,' ')).join(', ')}`
        : '';

      const card = el('div', { class: 'draft-card evolution-card' });
      card.innerHTML = `
        <div class="evo-role">${candidate.role}</div>
        <div class="evo-name">${name}</div>
        <div class="evo-stats">${statBits}</div>
        <div class="evo-desc">${desc}</div>
        <div class="evo-affinity">${affinityLine}</div>
        <div class="dc-action">${I18N.t('ui.evolutions.actionChoose') || '↑ EVOLVE'}</div>
      `;
      card.addEventListener('click', () => {
        if (window.FLOW?.pickEvolution) window.FLOW.pickEvolution(path.id);
      });
      options.appendChild(card);
    }

    skipBtn.textContent = I18N.t('ui.evolutions.skip') || 'Skip evolution';
    skipBtn.onclick = () => {
      if (window.FLOW?.skipEvolution) window.FLOW.skipEvolution();
    };
  },

  // ─── Card draft screen ─────────────────────────────────────────────────
  // Post-match deck-shaping. Mode 'add' = pick 1 of 3 new cards; mode
  // 'remove' = pick 1 card from your deck to discard permanently. The
  // alternation between these drives build commitment over a run.
  renderCardDraft(cardIds, mode) {
    const title = document.getElementById('cd-title');
    const subtitle = document.getElementById('cd-subtitle');
    const options = document.getElementById('card-draft-options');
    const skipBtn = document.getElementById('cd-skip-btn');
    if (!options) return;

    const isAdd = (mode === 'add' || mode === 'add_first' || mode === 'add_second' || mode === 'replace_step2');
    const isBossReward = (mode === 'add_first' || mode === 'add_second');
    const isReplaceStep1 = (mode === 'replace_step1');
    const isReplaceStep2 = (mode === 'replace_step2');
    const isUpgrade = (mode === 'upgrade');

    if (isBossReward) {
      const pickNum = mode === 'add_first' ? 1 : 2;
      title.textContent = (I18N.t('ui.cardDraft.bossTitle') || 'BOSS REWARD') +
        ' · ' + pickNum + '/2';
      subtitle.textContent = I18N.t('ui.cardDraft.bossSubtitle')
        || 'You toppled a boss. Take two cards to sharpen your deck.';
    } else if (isReplaceStep1) {
      title.textContent = I18N.t('ui.cardDraft.replaceStep1Title') || 'REPLACE — STEP 1/2';
      subtitle.textContent = I18N.t('ui.cardDraft.replaceStep1Subtitle')
        || 'Pick a card to remove. You\'ll choose its replacement next.';
    } else if (isReplaceStep2) {
      title.textContent = I18N.t('ui.cardDraft.replaceStep2Title') || 'REPLACE — STEP 2/2';
      subtitle.textContent = I18N.t('ui.cardDraft.replaceStep2Subtitle')
        || 'Pick a replacement for the removed card.';
    } else if (isUpgrade) {
      title.textContent = I18N.t('ui.cardDraft.upgradeTitle') || 'UPGRADE';
      subtitle.textContent = I18N.t('ui.cardDraft.upgradeSubtitle')
        || 'Pick a card to upgrade — permanent +25% stat effect.';
    } else {
      title.textContent = isAdd
        ? I18N.t('ui.cardDraft.addTitle')
        : I18N.t('ui.cardDraft.removeTitle');
      subtitle.textContent = isAdd
        ? I18N.t('ui.cardDraft.addSubtitle')
        : I18N.t('ui.cardDraft.removeSubtitle');
    }
    skipBtn.textContent = isUpgrade
      ? (I18N.t('ui.cardDraft.skipUpgrade') || 'Skip upgrade')
      : isAdd
        ? I18N.t('ui.cardDraft.skipAdd')
        : I18N.t('ui.cardDraft.skipRemove');

    options.innerHTML = '';
    options.className = 'card-draft-options mode-' + mode + (isBossReward ? ' mode-boss' : '');

    for (const cardId of cardIds) {
      const def = window.KL.cards.getCardDef(cardId);
      if (!def) continue;

      const classes = ['draft-card', 'rarity-' + def.rarity, 'type-' + def.type];
      // 'draft-remove' class only when the action is actually a removal —
      // upgrade mode was incorrectly tagged here, which visually flagged
      // upgrade cards as "to be removed" and confused the readout with
      // the "+25% permanent effect" subtitle.
      if (!isAdd && !isUpgrade) classes.push('draft-remove');
      if (isUpgrade) classes.push('draft-upgrade');

      // Cost as pips — same vocabulary as the hand and the energy meter.
      const costPips = el('div', { class: 'dc-cost-pips' });
      const n = Math.max(1, def.cost);
      for (let i = 0; i < n; i++) {
        costPips.appendChild(el('span', {
          class: 'dc-pip' + (def.cost > 0 ? ' filled' : '')
        }));
      }

      // Type-hover explanation echo of the hand card system.
      const DC_TYPE_HINT = {
        setup:   'Setup: generates Flow or unlocks lanes for later payoffs.',
        trigger: 'Trigger: fires a mechanical effect. Often consumes Flow.',
        combo:   'Combo: needs conditions (Flow/Lane Open) for full effect.',
        defense: 'Defense: protects backline and keeper.',
        counter: 'Counter: punishes telegraphed opp threats.'
      };

      // Action label — correctly distinguishes upgrade from remove.
      const actionLabel = isUpgrade
        ? I18N.t('ui.cardDraft.actionUpgrade')
        : (isAdd ? I18N.t('ui.cardDraft.actionAdd') : I18N.t('ui.cardDraft.actionRemove'));

      const card = el('div', { class: classes.join(' ') }, [
        costPips,
        el('div', { class: 'dc-type', title: DC_TYPE_HINT[def.type] || '' }, [I18N.t('ui.cards.types.' + def.type)]),
        el('div', { class: 'dc-name' }, [I18N.t('ui.cards.' + def.id + '.name')]),
        el('div', { class: 'dc-desc' }, [UI.resolveCardDescription(def.id, null)]),
        el('div', { class: 'dc-action' }, [actionLabel])
      ]);
      card.addEventListener('click', () => FLOW.pickCardDraft(cardId));
      options.appendChild(card);
    }

    UI.showScreen('screen-card-draft');
  },

  showCardImpact(res) {
    // Build per-stat delta chips. Each stat gets its own pill so the
    // whole readout reads as a score of changes rather than a mashed
    // string. Positives flash green, negatives red.
    const before = res.teamBuffsBefore || {};
    const after  = res.teamBuffsAfter  || {};
    const keys = ['offense', 'defense', 'tempo', 'vision', 'composure'];
    const LABEL = { offense:'OFF', defense:'DEF', tempo:'TMP', vision:'VIS', composure:'CMP' };
    const chips = [];
    for (const k of keys) {
      const d = (after[k] || 0) - (before[k] || 0);
      if (d !== 0) {
        const tone = d > 0 ? 'pos' : 'neg';
        chips.push(el('span', { class: 'cip-chip cip-' + tone }, [
          `${LABEL[k]} ${d > 0 ? '+' : ''}${d}`
        ]));
      }
    }
    if (!chips.length) return;

    const pop = el('div', { class: 'card-impact-pop' }, chips);
    const container = document.getElementById('screen-match');
    if (!container) return;
    container.appendChild(pop);
    // Animate in, then fade out, then remove.
    requestAnimationFrame(() => pop.classList.add('show'));
    setTimeout(() => pop.classList.add('fade'), 900);
    setTimeout(() => pop.remove(), 1500);
  }
};

window.buildContextHint = buildContextHint;
window.extractHintTokens = extractHintTokens;
window.UI = UI;
