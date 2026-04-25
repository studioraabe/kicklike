// Screen effects module — glowing border frame
(function() {
  function createFrame(id) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.style.cssText = [
        'position:fixed',
        'inset:0',
        'pointer-events:none',
        'z-index:9999',
        'opacity:0'
      ].join(';');
      document.body.appendChild(el);
    }
    return el;
  }

  // glowBlur  — how far the glow bleeds inward (px), soft diffuse halo
  // glowSpread — hard inner border thickness (px), keep thin
  function animateFrame(el, color, glowBlur, glowSpread, peakOpacity, rampMs, totalMs) {
    if (el._fxFrame) cancelAnimationFrame(el._fxFrame);

    el.style.boxShadow = `inset 0 0 ${glowBlur}px ${glowSpread}px ${color}`;

    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      let t;

      if (elapsed < rampMs) {
        // sharp ease-out ramp — frame snaps on quickly
        const p = elapsed / rampMs;
        t = 1 - Math.pow(1 - p, 2.5);
      } else if (elapsed < totalMs) {
        // very gentle ease-in fade — lingers at the edge, drifts away slowly
        const p = (elapsed - rampMs) / (totalMs - rampMs);
        t = 1 - Math.pow(p, 2.4);
      } else {
        el.style.opacity = '0';
        el._fxFrame = null;
        return;
      }

      el.style.opacity = String(Math.max(0, peakOpacity * t));
      el._fxFrame = requestAnimationFrame(tick);
    }

    el._fxFrame = requestAnimationFrame(tick);
  }

  function shake(intensity, duration) {
    const app = document.getElementById('app');
    if (!app) return;
    const start = Date.now();
    function step() {
      const t = Date.now() - start;
      if (t >= duration) { app.style.transform = ''; return; }
      const decay = 1 - t / duration;
      const x = (Math.random() - 0.5) * intensity * decay;
      const y = (Math.random() - 0.5) * intensity * decay;
      app.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ── Goal scored ───────────────────────────────────────────────────────────
  function goalMe() {
    const el = createFrame('fx-frame');
    // wider blur, longer tail
    animateFrame(el, 'rgba(170,255,42,0.90)', 42, 5, 1, 90, 1400);
    shake(2, 200);
  }

  // ── Goal conceded ─────────────────────────────────────────────────────────
  function goalOpp() {
    const el = createFrame('fx-frame');
    animateFrame(el, 'rgba(255,60,110,0.92)', 38, 6, 1, 60, 1500);
    shake(5, 340);
  }

  // ── Match won ─────────────────────────────────────────────────────────────
  function winResult() {
    const el = createFrame('fx-frame');
    animateFrame(el, 'rgba(170,255,42,0.75)', 54, 4, 1, 240, 2600);
  }

  // ── Match lost ────────────────────────────────────────────────────────────
  function lossResult() {
    const el = createFrame('fx-frame');
    animateFrame(el, 'rgba(255,60,110,0.80)', 50, 6, 1, 180, 2800);
    shake(4, 300);
  }

  // ── Boss warning ──────────────────────────────────────────────────────────
  function bossWarning() {
    const el = createFrame('fx-frame');
    animateFrame(el, 'rgba(255,210,58,0.80)', 46, 4, 1, 200, 2200);
  }

  // stubs kept for any legacy callers
  function flash() {}
  function vignette() {}

  window.FX = { goalMe, goalOpp, winResult, lossResult, bossWarning, flash, shake, vignette };
})();