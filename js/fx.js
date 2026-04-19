// Screen effects module - injected into flow.js logic via UI calls
(function() {
  function createOverlay(id) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;transition:opacity 0.15s;opacity:0;';
      document.body.appendChild(el);
    }
    return el;
  }

  function flash(color, duration=400) {
    const ov = createOverlay('fx-flash');
    ov.style.background = color;
    ov.style.opacity = '1';
    setTimeout(() => { ov.style.opacity = '0'; }, duration * 0.3);
  }

  function shake(intensity=6, duration=500) {
    const app = document.getElementById('app');
    if (!app) return;
    const start = Date.now();
    const step = () => {
      const t = Date.now() - start;
      if (t >= duration) { app.style.transform = ''; return; }
      const decay = 1 - t / duration;
      const x = (Math.random() - 0.5) * intensity * decay;
      const y = (Math.random() - 0.5) * intensity * decay;
      app.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function vignette(color, duration=1200) {
    const ov = createOverlay('fx-vignette');
    ov.style.background = `radial-gradient(ellipse at center, transparent 40%, ${color} 100%)`;
    ov.style.opacity = '1';
    setTimeout(() => { ov.style.opacity = '0'; }, duration * 0.6);
  }

  function goalMe() {
    flash('rgba(170,255,42,0.22)', 600);
    vignette('rgba(170,255,42,0.18)', 1200);
    shake(3, 300);
  }
  function goalOpp() {
    flash('rgba(255,60,110,0.28)', 500);
    vignette('rgba(255,60,110,0.25)', 1500);
    shake(7, 500);
  }
  function winResult() {
    flash('rgba(170,255,42,0.18)', 800);
    vignette('rgba(170,255,42,0.12)', 2000);
  }
  function lossResult() {
    vignette('rgba(255,60,110,0.3)', 2500);
    shake(5, 400);
  }
  function bossWarning() {
    vignette('rgba(255,210,58,0.2)', 1500);
    flash('rgba(255,210,58,0.15)', 600);
  }

  window.FX = { goalMe, goalOpp, winResult, lossResult, bossWarning, flash, shake, vignette };
})();
