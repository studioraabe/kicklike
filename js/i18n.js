(() => {
  const STORAGE_KEY = 'kicklike_lang_v1';
  const registry = {};
  let currentLang = localStorage.getItem(STORAGE_KEY) || document.documentElement.lang || 'en';

  function getPath(obj, path) {
    return String(path).split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
  }

  function format(value, vars = {}) {
    if (typeof value !== 'string') return value;
    return value.replace(/\{(\w+)\}/g, (_, key) => (vars[key] ?? `{${key}}`));
  }

  function locale() {
    return registry[currentLang] || registry.en || Object.values(registry)[0] || {};
  }

  function t(path, vars = {}) {
    const value = getPath(locale(), path);
    if (value == null) return path;
    return format(value, vars);
  }

  function list(path) {
    const value = getPath(locale(), path);
    return Array.isArray(value) ? value : [];
  }

  function pickText(path, vars = {}) {
    const options = list(path);
    if (!options.length) return path;
    return format(options[Math.floor(Math.random() * options.length)], vars);
  }

  function titleCase(value) {
    return String(value)
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  function decorateConfigData(data) {
    const dataLocale = locale().data || {};
    const statLabels = locale().stats || {};

    data.roles.forEach(role => {
      const translated = dataLocale.roles?.[role.id];
      if (!translated) return;
      role.label = translated.label;
      role.desc = translated.desc;
    });

    Object.entries(data.archetypes).forEach(([id, archetype]) => {
      archetype.label = dataLocale.archetypes?.[id] || archetype.label;
    });

    Object.entries(data.evoDetails).forEach(([id, evo]) => {
      evo.label = dataLocale.evoLabels?.[id] || evo.label || titleCase(id);
    });

    Object.entries(data.traits).forEach(([id, trait]) => {
      if (id.endsWith('_mastery')) {
        const evoId = id.replace(/_mastery$/, '');
        const evo = data.evoDetails[evoId];
        const parentLabel = evo?.inheritedFrom ? data.evoDetails[evo.inheritedFrom]?.label : '';
        const emphasisOrder = Object.keys(evo?.boosts || {}).filter(key => ['offense', 'defense', 'tempo', 'vision', 'composure'].includes(key));
        const emphasis = emphasisOrder.map(key => statLabels[key] || key).join(', ');
        trait.name = t('generated.masteryName', { label: evo?.label || titleCase(evoId) });
        trait.desc = t('generated.masteryDesc', { parent: parentLabel, stats: emphasis });
        return;
      }
      const translated = dataLocale.traits?.[id];
      if (!translated) return;
      trait.name = translated.name;
      trait.desc = translated.desc;
    });

    data.starterTeams.forEach(team => {
      const translated = dataLocale.starterTeams?.[team.id];
      if (!translated) return;
      team.name = translated.name;
      team.theme = translated.theme;
      team.desc = translated.desc;
      team.difficultyLabel = translated.difficultyLabel;
    });

    data.opponents.prefixes = list('data.opponents.prefixes');
    data.opponents.places = list('data.opponents.places');
    data.opponents.specials.forEach(special => {
      special.name = dataLocale.opponents?.specials?.[special.id] || special.name;
    });

    data.kickoffTactics.forEach(tactic => {
      const translated = dataLocale.tactics?.kickoff?.[tactic.id];
      if (!translated) return;
      tactic.name = translated.name;
      tactic.desc = translated.desc;
    });
    data.halftimeOptions.forEach(tactic => {
      const translated = dataLocale.tactics?.halftime?.[tactic.id];
      if (!translated) return;
      tactic.name = translated.name;
      tactic.desc = translated.desc;
    });
    data.finalOptions.forEach(tactic => {
      const translated = dataLocale.tactics?.final?.[tactic.id];
      if (!translated) return;
      tactic.name = translated.name;
      tactic.desc = translated.desc;
    });
  }

  function applyDom(root = document) {
    root.querySelectorAll('[data-i18n]').forEach(node => {
      node.textContent = t(node.dataset.i18n);
    });
    root.querySelectorAll('[data-i18n-html]').forEach(node => {
      node.innerHTML = t(node.dataset.i18nHtml);
    });
    if (document.title) {
      document.title = t('ui.meta.title');
    }
    document.documentElement.lang = currentLang;
    root.querySelectorAll('[data-lang]').forEach(node => {
      node.classList.toggle('active', node.dataset.lang === currentLang);
    });
  }

  function setLang(nextLang) {
    if (!registry[nextLang]) return;
    currentLang = nextLang;
    localStorage.setItem(STORAGE_KEY, currentLang);
    applyDom();
    if (window.DATA) decorateConfigData(window.DATA);
    if (window.UI && window.getState) {
      const currentState = window.getState();
      if (!currentState || !currentState.matchNumber) {
        window.UI.renderStart();
      } else if (currentState.currentOpponent) {
        window.UI.renderHub();
      }
    }
  }

  function registerLocale(lang, payload) {
    registry[lang] = payload;
  }

  function bindLanguageButtons() {
    document.addEventListener('click', ev => {
      const btn = ev.target.closest('[data-lang]');
      if (!btn) return;
      setLang(btn.dataset.lang);
    });
  }

  bindLanguageButtons();
  document.addEventListener('DOMContentLoaded', () => applyDom());

  window.I18N = {
    registerLocale,
    decorateConfigData,
    applyDom,
    setLang,
    locale,
    t,
    list,
    pickText,
    format,
    getLang: () => currentLang
  };
})();