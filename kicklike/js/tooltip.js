// ============================================================================
// js/tooltip.js — Globales Kicklike-Tooltip-System (KL.tip)
// ============================================================================
//
// Ersetzt den nativen HTML-`title`-Tooltip durch ein gestyltes In-Game-Overlay,
// das sich der CRT-Ästhetik anpasst. Zwei Wege, es zu nutzen:
//
//   1. Automatisch: Jedes Element mit `title="..."` wird beim ersten Hover
//      transparent umgeschrieben — `title` wird entfernt (damit der native
//      OS-Tooltip nicht auch noch aufpoppt) und als `data-kl-tip` gemerkt.
//      Keine Code-Änderungen an den ~40 Stellen nötig, die heute `title`
//      benutzen.
//
//   2. Explizit: Elemente können `data-kl-tip="..."` direkt setzen. Für
//      strukturierte Tooltips (Kopf + Body + Sub + Ton) kann der Wert
//      JSON-encoded sein:
//         data-kl-tip='{"head":"Kickoff","body":"Schnelle Flügel","tone":"me"}'
//      Plain-Strings werden als Body-Text gerendert.
//
// Ton-Klassen (`tone`): 'me' | 'opp' | 'neutral'. Default: neutral.
//
// Die API ist bewusst minimal: `KL.tip.show(anchor, content)` und
// `KL.tip.hide()`. Das reicht für sowohl die Auto-Wire-Delegation als auch
// für explizite Aufrufe aus anderen Modulen (z.B. Match-HUD für Stripe-
// Marker, die strukturierte Event-Info tragen).

(() => {
  'use strict';
  const KL = window.KL || (window.KL = {});

  const S = {
    el: null,             // Singleton-Tooltip-Element, an <body> gehängt
    currentAnchor: null,  // zuletzt gehovertes Element (für leave-Detection)
    hideTimer: null,
  };

  function ensureEl() {
    if (S.el) return S.el;
    const el = document.createElement('div');
    el.className = 'kl-tip';
    el.style.display = 'none';
    document.body.appendChild(el);
    S.el = el;
    return el;
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g,
      c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  // Content kann sein:
  //   - ein Plain-String (wird als Body gerendert)
  //   - ein Objekt { head, body, sub, tone } (strukturiert)
  //
  // In beiden Fällen wird das Element leer zurückgegeben, falls kein
  // Inhalt vorhanden ist — dann wird der Tooltip nicht gezeigt.
  function renderContent(content) {
    if (!content) return '';
    if (typeof content === 'string') {
      // Mehrzeilige native Titles (\n-getrennt): erste Zeile als Head,
      // Rest als Body. Das matcht das Pattern existierender title-
      // Attribute wie "Severity 2/3 — medium threat".
      const lines = content.split(/\n+/).map(s => s.trim()).filter(Boolean);
      if (lines.length === 0) return '';
      if (lines.length === 1) {
        return `<div class="kl-tip-body">${esc(lines[0])}</div>`;
      }
      return (
        `<div class="kl-tip-head">${esc(lines[0])}</div>` +
        `<div class="kl-tip-body">${esc(lines.slice(1).join(' '))}</div>`
      );
    }
    const tone = content.tone || 'neutral';
    let html = '';
    if (content.head) {
      html += `<div class="kl-tip-head kl-tip-${esc(tone)}">${esc(content.head)}</div>`;
    }
    if (content.body) {
      // v0.47 — body darf nun ein Array sein. Jedes Element wird auf
      // eine eigene Zeile gerendert. Erlaubt Stat-Listen mit Scale-Bars
      // im Pulse-Tooltip ohne HTML im body (weiterhin escaped).
      if (Array.isArray(content.body)) {
        html += '<div class="kl-tip-body">';
        html += content.body.map(line => esc(String(line))).join('<br>');
        html += '</div>';
      } else {
        html += `<div class="kl-tip-body">${esc(content.body)}</div>`;
      }
    }
    if (content.sub) {
      if (Array.isArray(content.sub)) {
        html += '<div class="kl-tip-sub">';
        html += content.sub.map(line => esc(String(line))).join('<br>');
        html += '</div>';
      } else {
        html += `<div class="kl-tip-sub">${esc(content.sub)}</div>`;
      }
    }
    return html;
  }

  // Positionierung: unter dem Anker zentriert, fallback über dem Anker
  // wenn unten nicht genug Platz ist. Clamp auf Viewport-Ränder.
  function position(anchor) {
    const el = S.el;
    const pad = 8;
    const ar = anchor.getBoundingClientRect();
    const tr = el.getBoundingClientRect();
    let left = ar.left + ar.width / 2 - tr.width / 2;
    let top = ar.bottom + 6;
    if (top + tr.height > window.innerHeight - pad) {
      top = ar.top - tr.height - 6;
    }
    left = Math.max(pad, Math.min(window.innerWidth - tr.width - pad, left));
    el.style.left = Math.round(left) + 'px';
    el.style.top = Math.round(top) + 'px';
  }

  function show(anchor, content) {
    if (!anchor) return;
    const el = ensureEl();
    const html = renderContent(content);
    if (!html) { hide(); return; }
    if (S.hideTimer) { clearTimeout(S.hideTimer); S.hideTimer = null; }
    el.innerHTML = html;
    el.style.display = 'block';
    S.currentAnchor = anchor;
    position(anchor);
  }

  function hide() {
    if (S.hideTimer) { clearTimeout(S.hideTimer); S.hideTimer = null; }
    if (S.el) S.el.style.display = 'none';
    S.currentAnchor = null;
  }

  function scheduleHide() {
    if (S.hideTimer) clearTimeout(S.hideTimer);
    S.hideTimer = setTimeout(hide, 120);
  }

  // Inhalt eines Elements ermitteln — bevorzugt `data-kl-tip`, fallback
  // auf natives `title`. Beim ersten Zugriff wird `title` entfernt und
  // als `data-kl-tip` gespeichert, damit der native Browser-Tooltip
  // nicht zusätzlich erscheint.
  function contentFor(el) {
    if (!el) return null;
    let raw = el.dataset.klTip;
    if (raw == null) {
      const title = el.getAttribute('title');
      if (!title) return null;
      el.setAttribute('data-kl-tip', title);
      el.removeAttribute('title');
      raw = title;
    }
    // JSON-Content erkennen (beginnt mit '{')
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try { return JSON.parse(trimmed); } catch (_) { /* kein JSON, als String */ }
    }
    return raw;
  }

  // Delegation: ein Listener am Document, reagiert auf mouseover/mouseout.
  // Capture-Phase, damit SVG-Elemente (die keine mouseenter-Events sauber
  // bubblen) auch erfasst werden.
  function onOver(e) {
    const el = e.target.closest && e.target.closest('[data-kl-tip], [title]');
    if (!el) return;
    const content = contentFor(el);
    if (!content) return;
    show(el, content);
  }

  function onOut(e) {
    if (!S.currentAnchor) return;
    // Bewegt sich der Pointer noch innerhalb des aktuellen Ankers?
    // (SVG-Marker mit mehreren Kindern würden sonst flackern.)
    const rel = e.relatedTarget;
    if (rel && S.currentAnchor.contains && S.currentAnchor.contains(rel)) return;
    // Kleiner Delay, damit Re-Hover (z.B. zwischen zwei dicht liegenden
    // Markern) den Tooltip nicht kurz ausblenden.
    scheduleHide();
  }

  // Klick schließt einen offenen Tooltip sofort (z.B. weil der Nutzer
  // auf den Marker klickt, um zum Log zu springen).
  function onClick() {
    if (S.currentAnchor) hide();
  }

  // Scroll schließt den Tooltip — sonst klebt er weiter an einer Position,
  // die nicht mehr zum Anker passt.
  function onScroll() {
    if (S.currentAnchor) hide();
  }

  document.addEventListener('mouseover', onOver, true);
  document.addEventListener('mouseout', onOut, true);
  document.addEventListener('click', onClick, true);
  window.addEventListener('scroll', onScroll, true);

  KL.tip = { show, hide };
})();
