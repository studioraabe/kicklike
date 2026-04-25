// codex.js — persistent meta-state across runs.
//
// Backs the v52 Meta-Codex page. All data lives in localStorage so progress
// survives browser sessions and stays local to the device (no account).
// Three collections:
//   1. achievements — id-set of achievements ever unlocked (across ALL runs)
//   2. legendaries  — snapshot of every legendary player ever recruited
//   3. cardsSeen    — id-set of cards ever drafted or played
//
// The in-run state.achievements array is per-run. The codex merges it into
// persistent storage so the codex shows lifetime progress, not "what did I
// do this run". Same for legendary/card tracking.
//
// Exposed as window.KL.codex — the UI page reads through it.

(() => {
  const KL = window.KL || (window.KL = {});

  const KEYS = {
    achievements: 'kicklike_codex_achievements_v1',
    legendaries:  'kicklike_codex_legendaries_v1',
    cardsSeen:    'kicklike_codex_cards_v1'
  };

  // ─── Low-level storage helpers ─────────────────────────────────────────────
  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  // ─── Achievements ──────────────────────────────────────────────────────────
  function getUnlockedAchievements() {
    return loadJSON(KEYS.achievements, []);
  }

  function recordAchievementUnlock(id) {
    if (!id) return false;
    const current = getUnlockedAchievements();
    if (current.includes(id)) return false;
    current.push(id);
    return saveJSON(KEYS.achievements, current);
  }

  function isAchievementUnlocked(id) {
    return getUnlockedAchievements().includes(id);
  }

  // ─── Legendaries ───────────────────────────────────────────────────────────
  // Store a compact snapshot: id, name, role, traits, firstSeenAt. Keyed by
  // generated-id so re-recruiting the same legendary in a later run doesn't
  // dupe the codex entry. Limit to 200 entries (soft cap) — if the player
  // has 200+ unique legendaries we'll prune the oldest.
  function getLegendaries() {
    return loadJSON(KEYS.legendaries, []);
  }

  function recordLegendary(player) {
    if (!player || !player.id) return false;
    const current = getLegendaries();
    if (current.some(p => p.id === player.id)) return false;
    const snapshot = {
      id:     player.id,
      name:   player.name,
      role:   player.role,
      traits: (player.traits || []).slice(),
      stats:  player.stats ? { ...player.stats } : null,
      firstSeenAt: Date.now()
    };
    current.push(snapshot);
    // Soft cap — prune oldest if we go over
    while (current.length > 200) current.shift();
    return saveJSON(KEYS.legendaries, current);
  }

  // ─── Cards seen ───────────────────────────────────────────────────────────
  function getSeenCards() {
    return loadJSON(KEYS.cardsSeen, []);
  }

  function recordCardSeen(cardId) {
    if (!cardId) return false;
    const current = getSeenCards();
    if (current.includes(cardId)) return false;
    current.push(cardId);
    return saveJSON(KEYS.cardsSeen, current);
  }

  function isCardSeen(cardId) {
    return getSeenCards().includes(cardId);
  }

  // ─── Reset (dev / settings) ────────────────────────────────────────────────
  // Not wired to any UI in v52 — exposed for future "reset codex" option.
  function resetAll() {
    for (const k of Object.values(KEYS)) {
      try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
    }
  }

  KL.codex = {
    // achievements
    getUnlockedAchievements,
    recordAchievementUnlock,
    isAchievementUnlocked,
    // legendaries
    getLegendaries,
    recordLegendary,
    // cards
    getSeenCards,
    recordCardSeen,
    isCardSeen,
    // dev
    resetAll
  };
})();
